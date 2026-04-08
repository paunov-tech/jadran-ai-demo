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
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: "unauthorized" });

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
    return res.json({ ok: true, date: yesterday, campaigns: results });
  } catch (err) {
    console.error("[cron-insights] error:", err.message);
    return res.status(502).json({ error: err.message });
  }
}
