// ── CRON: Meta Ads Auto-Optimizer ────────────────────────────────────
// Reads last 3 days of insights from Firestore → pauses bad campaigns.
// Runs every 3 days via Vercel cron.
//
// GET /api/cron-meta-optimize?secret=CRON_SECRET
//
// Rules:
//   pause if: spend > 15€ AND leads == 0
//   pause if: CPL > 8€
//   flag if:  CTR < 0.3% on > 1000 impressions

const GRAPH = "https://graph.facebook.com/v19.0";
const PROJECT = "molty-portal";

async function graphPost(path, body, token) {
  const r = await fetch(`${GRAPH}/${path}?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

async function graphGet(path, params, token) {
  const qs = new URLSearchParams({ access_token: token, ...params }).toString();
  const r = await fetch(`${GRAPH}/${path}?${qs}`, { signal: AbortSignal.timeout(15000) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data;
}

async function fsQuery(collection, token) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return [];
  const r = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}?key=${apiKey}&pageSize=100`
  );
  const data = await r.json();
  return (data.documents || []).map(doc => {
    const f = doc.fields || {};
    const out = {};
    for (const [k, v] of Object.entries(f)) {
      out[k] = v.stringValue ?? v.doubleValue ?? (v.integerValue !== undefined ? parseInt(v.integerValue) : null);
    }
    return out;
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const secret = req.query.secret || req.headers["x-cron-secret"];
  const adminRaw = req.headers["x-admin-token"] || "";
  const adminDecoded = (() => { try { return Buffer.from(adminRaw, "base64").toString("utf8"); } catch { return adminRaw; } })();
  const isAdmin = adminDecoded.trim() === (process.env.ADMIN_TOKEN || "").trim();
  if (secret !== process.env.CRON_SECRET && !isAdmin) return res.status(401).json({ error: "unauthorized" });

  const token = process.env.META_CAPI_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token || !account) return res.status(500).json({ error: "META creds missing" });

  // Last 3 days date range
  const today = new Date().toISOString().slice(0, 10);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

  try {
    // Get active JADRAN campaigns
    const campaigns = await graphGet(`${account}/campaigns`, {
      fields: "id,name,status",
      limit: "50",
      filtering: JSON.stringify([
        { field: "name", operator: "CONTAIN", value: "JADRAN" },
        { field: "effective_status", operator: "IN", value: ["ACTIVE"] },
      ]),
    }, token);

    const results = [];

    for (const camp of (campaigns.data || [])) {
      try {
        const insights = await graphGet(`${camp.id}/insights`, {
          fields: "impressions,clicks,spend,ctr,actions,cost_per_action_type",
          time_range: JSON.stringify({ since: threeDaysAgo, until: today }),
        }, token);

        const row = insights.data?.[0];
        if (!row) { results.push({ name: camp.name, action: "skip", reason: "no data" }); continue; }

        const spend = parseFloat(row.spend || 0);
        const impressions = parseInt(row.impressions || 0);
        const clicks = parseInt(row.clicks || 0);
        const ctr = impressions > 0 ? (clicks / impressions * 100) : 0;
        const leads = parseInt((row.actions || []).find(a => a.action_type === "lead")?.value || 0);
        const cpl = leads > 0 ? spend / leads : 999;

        let action = "keep";
        let reason = "";

        if (spend > 15 && leads === 0) {
          action = "pause";
          reason = `${spend.toFixed(2)}€ potrošeno, 0 leadova (3 dana)`;
        } else if (leads > 0 && cpl > 8) {
          action = "pause";
          reason = `CPL ${cpl.toFixed(2)}€ > 8€ limit`;
        } else if (impressions > 1000 && ctr < 0.3) {
          action = "flag";
          reason = `CTR ${ctr.toFixed(2)}% — treba refresh kreativa`;
        }

        if (action === "pause") {
          await graphPost(`${camp.id}`, { status: "PAUSED" }, token);
        }

        results.push({ id: camp.id, name: camp.name, spend, impressions, leads, cpl: cpl.toFixed(2), ctr: ctr.toFixed(2), action, reason });
      } catch (err) {
        results.push({ name: camp.name, action: "error", reason: err.message });
      }
    }

    await sendOptimizeReport(today, results);

    console.log(`[cron-meta-optimize] ${results.length} campaigns evaluated`);
    return res.json({ ok: true, date: today, results });
  } catch (err) {
    console.error("[cron-meta-optimize] error:", err.message);
    return res.status(502).json({ error: err.message });
  }
}

async function sendOptimizeReport(date, results) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const paused = results.filter(r => r.action === "pause");
  const flagged = results.filter(r => r.action === "flag");
  const kept = results.filter(r => r.action === "keep");

  if (paused.length === 0 && flagged.length === 0) return; // nothing to report

  const rows = results.map(r => {
    const color = r.action === "pause" ? "#ef4444" : r.action === "flag" ? "#f59e0b" : "#22c55e";
    const icon = r.action === "pause" ? "⏸" : r.action === "flag" ? "🔄" : "✅";
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;">${icon} ${r.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${r.spend ? r.spend.toFixed(2)+"€" : "–"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${r.leads ?? "–"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;text-align:right;">${r.ctr ? r.ctr+"%" : "–"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:${color};font-weight:600;">${r.action.toUpperCase()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e293b;font-size:11px;color:#64748b;">${r.reason || ""}</td>
    </tr>`;
  }).join("");

  const html = `
<div style="font-family:'Segoe UI',sans-serif;background:#050d1a;color:#e2e8f0;max-width:640px;margin:0 auto;padding:32px 24px;">
  <div style="font-size:22px;font-weight:700;color:#0ea5e9;margin-bottom:4px;">Jadran<span style="color:#f59e0b;">.ai</span></div>
  <div style="font-size:12px;color:#64748b;margin-bottom:24px;border-bottom:1px solid #1e293b;padding-bottom:16px;">Auto-Optimize Report — ${date}</div>

  <div style="margin-bottom:20px;font-size:13px;color:#94a3b8;line-height:1.8;">
    ⏸ Pauzirano: <strong style="color:#ef4444;">${paused.length}</strong> &nbsp;·&nbsp;
    🔄 Flagirano: <strong style="color:#f59e0b;">${flagged.length}</strong> &nbsp;·&nbsp;
    ✅ Aktivno: <strong style="color:#22c55e;">${kept.length}</strong>
  </div>

  <table style="width:100%;border-collapse:collapse;font-size:12px;">
    <thead>
      <tr style="border-bottom:1px solid #334155;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;">Kampanja</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;">Spend (3d)</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;">Leadi</th>
        <th style="padding:8px 12px;text-align:right;color:#64748b;">CTR</th>
        <th style="padding:8px 12px;color:#64748b;">Akcija</th>
        <th style="padding:8px 12px;color:#64748b;">Razlog</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="margin-top:20px;font-size:11px;color:#334155;text-align:center;border-top:1px solid #1e293b;padding-top:16px;">
    Jadran.ai · Auto-Optimizer · ${new Date().toISOString()}
  </div>
</div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "JADRAN.AI <noreply@jadran.ai>",
      to: process.env.REPORT_EMAIL || "info@sialconsulting.com",
      subject: `🤖 Auto-Optimize ${date} · ${paused.length} pauzirano, ${flagged.length} flagirano`,
      html,
    }),
  }).catch(e => console.warn("[cron-meta-optimize] email failed:", e.message));
}
