// ── CRON: Meta Ads Insights Sync ────────────────────────────────────
// Pulls daily campaign performance from Meta → writes to Firestore.
// Schedule: once/day via Vercel cron or manual trigger.
//
// GET /api/cron-insights?secret=CRON_SECRET
//
// Syncs: impressions, clicks, spend, CPC, CTR, conversions per campaign.
// Stores in Firestore: jadran_insights/{campaign_id}_{date}

const GRAPH = "https://graph.facebook.com/v19.0";
const PROJECT = "molty-portal";

async function graphGet(path, params, token) {
  const qs = new URLSearchParams({ access_token: token, ...params }).toString();
  const r = await fetch(`${GRAPH}/${path}?${qs}`, { signal: AbortSignal.timeout(15000) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || `HTTP ${r.status}`);
  return data;
}

async function fsWrite(collection, docId, fields) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;
  const fsFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") fsFields[k] = Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
    else fsFields[k] = { stringValue: String(v) };
  }
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${docId}?key=${apiKey}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fsFields }) }
  ).catch(e => console.warn(`Firestore write failed: ${e.message}`));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = req.query.secret || req.headers["x-cron-secret"];
  const adminRaw = req.headers["x-admin-token"] || "";
  const adminDecoded = (() => { try { return Buffer.from(adminRaw, "base64").toString("utf8"); } catch { return adminRaw; } })();
  const ADMIN = (process.env.ADMIN_TOKEN || "").trim();
  const isAdmin = adminDecoded.trim() === ADMIN || secret === ADMIN;
  if (secret !== process.env.CRON_SECRET && !isAdmin) return res.status(401).json({ error: "unauthorized" });

  const token = process.env.META_CAPI_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token || !account) return res.status(500).json({ error: "META_AD_ACCOUNT_ID or META_CAPI_TOKEN not set" });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  try {
    // Pull all JADRAN campaigns
    const campaigns = await graphGet(`${account}/campaigns`, {
      fields: "id,name,status",
      limit: "50",
      filtering: JSON.stringify([{ field: "name", operator: "CONTAIN", value: "JADRAN" }]),
    }, token);

    const results = [];

    for (const camp of (campaigns.data || [])) {
      try {
        const insights = await graphGet(`${camp.id}/insights`, {
          fields: "impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type",
          time_range: JSON.stringify({ since: yesterday, until: today }),
        }, token);

        const row = insights.data?.[0];
        if (!row) { results.push({ campaign: camp.name, status: "no_data" }); continue; }

        // Extract lead conversions from actions
        const leads = (row.actions || []).find(a => a.action_type === "lead")?.value || 0;
        const purchases = (row.actions || []).find(a => a.action_type === "purchase")?.value || 0;
        const costPerLead = (row.cost_per_action_type || []).find(a => a.action_type === "lead")?.value || 0;

        const doc = {
          campaign_id: camp.id,
          campaign_name: camp.name,
          status: camp.status,
          date: yesterday,
          impressions: parseInt(row.impressions || 0),
          clicks: parseInt(row.clicks || 0),
          spend: parseFloat(row.spend || 0),
          cpc: parseFloat(row.cpc || 0),
          cpm: parseFloat(row.cpm || 0),
          ctr: parseFloat(row.ctr || 0),
          leads: parseInt(leads),
          purchases: parseInt(purchases),
          cost_per_lead: parseFloat(costPerLead),
          synced_at: new Date().toISOString(),
        };

        await fsWrite("jadran_insights", `${camp.id}_${yesterday}`, doc);
        results.push({ campaign: camp.name, ...doc });
      } catch (err) {
        results.push({ campaign: camp.name, error: err.message });
      }
    }

    console.log(`[cron-insights] Synced ${results.length} campaigns for ${yesterday}`);

    // ── Daily email report ─────────────────────────────────────────────
    await sendDailyReport(yesterday, results);

    return res.json({ ok: true, date: yesterday, campaigns: results });
  } catch (err) {
    console.error("[cron-insights] error:", err.message);
    return res.status(502).json({ error: err.message });
  }
}

async function sendDailyReport(date, campaigns) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const valid = campaigns.filter(c => !c.error && c.impressions !== undefined);
  const totalSpend = valid.reduce((s, c) => s + (c.spend || 0), 0);
  const totalLeads = valid.reduce((s, c) => s + (c.leads || 0), 0);
  const totalImpressions = valid.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = valid.reduce((s, c) => s + (c.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";
  const avgCPL = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : "N/A";

  const alerts = [];
  valid.forEach(c => {
    if (c.cost_per_lead > 5) alerts.push(`⚠️ ${c.campaign_name}: CPL ${c.cost_per_lead.toFixed(2)}€`);
    if (c.leads === 0 && c.spend > 10) alerts.push(`🚨 ${c.campaign_name}: ${c.spend.toFixed(2)}€ potrošeno, 0 leadova`);
    if (c.ctr < 0.5 && c.impressions > 500) alerts.push(`📉 ${c.campaign_name}: CTR ${c.ctr.toFixed(2)}% (ispod 0.5%)`);
  });

  const rows = valid.map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;">${c.campaign_name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${(c.impressions||0).toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${c.clicks||0}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${c.leads||0}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${(c.spend||0).toFixed(2)}€</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;color:${c.cost_per_lead>5?"#ef4444":"#22c55e"};">${c.cost_per_lead>0?c.cost_per_lead.toFixed(2)+"€":"–"}</td>
    </tr>`).join("");

  const alertBlock = alerts.length > 0
    ? `<div style="margin:20px 0;padding:16px;background:#1e0a0a;border:1px solid #7f1d1d;border-radius:8px;color:#fca5a5;font-size:13px;line-height:1.8;">${alerts.join("<br>")}</div>`
    : `<div style="margin:20px 0;padding:12px 16px;background:#051a0a;border:1px solid #14532d;border-radius:8px;color:#86efac;font-size:13px;">✅ Sve kampanje u normali.</div>`;

  const html = `
<div style="font-family:'Segoe UI',sans-serif;background:#050d1a;color:#e2e8f0;max-width:640px;margin:0 auto;padding:32px 24px;">
  <div style="font-size:22px;font-weight:700;color:#0ea5e9;margin-bottom:4px;">Jadran<span style="color:#f59e0b;">.ai</span></div>
  <div style="font-size:12px;color:#64748b;margin-bottom:24px;border-bottom:1px solid #1e293b;padding-bottom:16px;">Daily Campaign Report — ${date}</div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
    ${[
      ["Potrošeno", totalSpend.toFixed(2)+"€", "#f59e0b"],
      ["Leadovi", totalLeads, "#22c55e"],
      ["Impressions", totalImpressions.toLocaleString(), "#0ea5e9"],
      ["Avg CPL", avgCPL+(avgCPL!=="N/A"?"€":""), totalLeads>0&&parseFloat(avgCPL)<5?"#22c55e":"#ef4444"],
    ].map(([label, val, color]) => `
    <div style="background:#0a1628;border:1px solid #1e293b;border-radius:10px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:700;color:${color};">${val}</div>
      <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">${label}</div>
    </div>`).join("")}
  </div>

  ${alertBlock}

  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px;">
    <thead>
      <tr style="border-bottom:1px solid #334155;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-weight:600;">Kampanja</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Imp.</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Klikovi</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Leadi</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">Spend</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;font-weight:600;">CPL</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="6" style="padding:12px;color:#64748b;text-align:center;">Nema podataka za juče</td></tr>'}</tbody>
  </table>

  <div style="font-size:11px;color:#334155;text-align:center;border-top:1px solid #1e293b;padding-top:16px;">
    Jadran.ai · R09-HUNTER · ${new Date().toISOString()}
  </div>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "JADRAN.AI <noreply@jadran.ai>",
      to: process.env.REPORT_EMAIL || "info@sialconsulting.com",
      subject: `📊 JADRAN Daily — ${date} · ${totalLeads} lead${totalLeads!==1?"ova":""}, ${totalSpend.toFixed(2)}€${alerts.length>0?" ⚠️":""}`,
      html,
    }),
  }).catch(e => console.warn("[cron-insights] email failed:", e.message));
}
