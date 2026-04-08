// ── META MARKETING API — Campaign Management ──────────────────────────
// Endpoints for creating, managing, and monitoring Meta ad campaigns.
// Bridges internal A/B system (Firestore mkt_ab) ↔ Meta Ads Manager.
//
// ENV required:
//   META_CAPI_TOKEN     — System User access token (ads_manage, read_insights)
//   META_AD_ACCOUNT_ID  — act_XXXXXXXXX
//   META_PAGE_ID        — Facebook Page ID (for ad creatives)
//   META_PIXEL_ID       — Pixel ID (for conversion tracking)
//   ADMIN_TOKEN         — Admin auth
//
// POST /api/meta-ads  { action, ...params }
// Actions: create_campaign, create_adset, create_ad, pause, resume,
//          get_insights, list_campaigns, push_winners

const GRAPH = "https://graph.facebook.com/v19.0";

function metaEnv() {
  return {
    token: process.env.META_CAPI_TOKEN,
    account: process.env.META_AD_ACCOUNT_ID,
    page: process.env.META_PAGE_ID,
    pixel: process.env.META_PIXEL_ID,
  };
}

function missing(env) {
  const m = [];
  if (!env.token) m.push("META_CAPI_TOKEN");
  if (!env.account) m.push("META_AD_ACCOUNT_ID");
  return m;
}

// ── Graph API wrapper ──────────────────────────────────────────────────
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

// ── SEGMENT → TARGETING MAP ────────────────────────────────────────────
const SEGMENT_TARGETING = {
  de_camper: {
    geo: { countries: ["DE", "AT", "CH"] },
    age_min: 30, age_max: 65,
    interests: [
      { id: "6003384912200", name: "Camping" },
      { id: "6003277229894", name: "Recreational vehicle" },
    ],
    locales: [5], // German
  },
  de_family: {
    geo: { countries: ["DE", "AT", "CH"] },
    age_min: 28, age_max: 50,
    interests: [
      { id: "6003397425735", name: "Family travel" },
      { id: "6003020834693", name: "Beach" },
    ],
    locales: [5],
  },
  it_sailor: {
    geo: { countries: ["IT"] },
    age_min: 30, age_max: 65,
    interests: [
      { id: "6003012949498", name: "Sailing" },
      { id: "6003348604980", name: "Boating" },
    ],
    locales: [22], // Italian
  },
  en_cruiser: {
    geo: { countries: ["GB", "US", "AU", "NL"] },
    age_min: 30, age_max: 65,
    interests: [
      { id: "6003012949498", name: "Sailing" },
      { id: "6003107902433", name: "Travel" },
    ],
    locales: [6], // English
  },
  en_camper: {
    geo: { countries: ["GB", "US", "AU", "NL"] },
    age_min: 28, age_max: 60,
    interests: [
      { id: "6003384912200", name: "Camping" },
      { id: "6003277229894", name: "Recreational vehicle" },
    ],
    locales: [6],
  },
  en_couple: {
    geo: { countries: ["GB", "US", "AU", "NL"] },
    age_min: 25, age_max: 45,
    interests: [
      { id: "6003020834693", name: "Beach" },
      { id: "6003107902433", name: "Travel" },
    ],
    locales: [6],
  },
};

// ── ACTIONS ────────────────────────────────────────────────────────────

async function createCampaign(env, { name, objective = "OUTCOME_LEADS", dailyBudget }) {
  return graphPost(`${env.account}/campaigns`, {
    name: name || `JADRAN_${Date.now()}`,
    objective,
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false, // budget per adset, not CBO
    status: "PAUSED",
  }, env.token);
}

async function createAdSet(env, { campaignId, name, segmentId, dailyBudget = 1000 }) {
  const target = SEGMENT_TARGETING[segmentId];
  if (!target) throw new Error(`Unknown segment: ${segmentId}`);

  return graphPost(`${env.account}/adsets`, {
    campaign_id: campaignId,
    name: name || `${segmentId}_adset`,
    daily_budget: dailyBudget, // cents
    billing_event: "IMPRESSIONS",
    optimization_goal: "LEAD_GENERATION",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      geo_locations: target.geo,
      age_min: target.age_min,
      age_max: target.age_max,
      flexible_spec: [{ interests: target.interests }],
      locales: target.locales,
      publisher_platforms: ["facebook", "instagram"],
    },
    promoted_object: {
      pixel_id: env.pixel,
      custom_event_type: "LEAD",
    },
    status: "PAUSED",
  }, env.token);
}

async function createAd(env, { adsetId, name, hook, body, cta = "LEARN_MORE", link, imageUrl }) {
  if (!env.page) throw new Error("META_PAGE_ID required for ad creation");

  // Create ad creative
  const creative = await graphPost(`${env.account}/adcreatives`, {
    name: `creative_${name || Date.now()}`,
    object_story_spec: {
      page_id: env.page,
      link_data: {
        message: `${hook}\n\n${body}`,
        link: link || "https://jadran.ai",
        call_to_action: { type: cta },
        ...(imageUrl ? { picture: imageUrl } : {}),
      },
    },
  }, env.token);

  // Create ad using creative
  return graphPost(`${env.account}/ads`, {
    adset_id: adsetId,
    creative: { creative_id: creative.id },
    name: name || `ad_${Date.now()}`,
    status: "PAUSED",
  }, env.token);
}

async function setStatus(env, { objectId, status }) {
  return graphPost(objectId, { status }, env.token);
}

async function getInsights(env, { objectId, dateRange = 7 }) {
  const since = new Date(Date.now() - dateRange * 86400000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);
  return graphGet(`${objectId}/insights`, {
    fields: "impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type",
    time_range: JSON.stringify({ since, until }),
    time_increment: "1",
  }, env.token);
}

async function listCampaigns(env) {
  return graphGet(`${env.account}/campaigns`, {
    fields: "id,name,status,objective,daily_budget,lifetime_budget,created_time",
    limit: "50",
    filtering: JSON.stringify([{ field: "name", operator: "CONTAIN", value: "JADRAN" }]),
  }, env.token);
}

// ── PUSH WINNERS — sync top A/B variants to Meta as ads ────────────────
async function pushWinners(env, { segmentId, campaignId, adsetId, variants }) {
  if (!variants?.length) throw new Error("No variants to push");

  const results = [];
  for (const v of variants.slice(0, 5)) { // max 5 ads per push
    try {
      const ad = await createAd(env, {
        adsetId,
        name: `${segmentId}_${v.id}`,
        hook: v.hook,
        body: v.body,
        link: `https://jadran.ai/m/${segmentId}?v=${v.id}&utm_source=meta&utm_medium=paid&utm_campaign=${segmentId}`,
      });
      results.push({ variantId: v.id, adId: ad.id, status: "created" });
    } catch (err) {
      results.push({ variantId: v.id, error: err.message });
    }
  }
  return results;
}

// ── HANDLER ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
  };
  if (req.method === "OPTIONS") return res.status(204).set(CORS).end();
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  // Admin auth
  const raw = req.headers["x-admin-token"] || "";
  const decoded = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
  if (decoded.trim() !== (process.env.ADMIN_TOKEN || "").trim()) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const env = metaEnv();
  const miss = missing(env);
  if (miss.length) return res.status(500).json({ error: `Missing env vars: ${miss.join(", ")}` });

  const { action, ...params } = req.body || {};

  try {
    switch (action) {
      case "create_campaign":
        return res.json({ ok: true, ...(await createCampaign(env, params)) });

      case "create_adset":
        return res.json({ ok: true, ...(await createAdSet(env, params)) });

      case "create_ad":
        return res.json({ ok: true, ...(await createAd(env, params)) });

      case "pause":
        return res.json({ ok: true, ...(await setStatus(env, { ...params, status: "PAUSED" })) });

      case "resume":
        return res.json({ ok: true, ...(await setStatus(env, { ...params, status: "ACTIVE" })) });

      case "get_insights":
        return res.json({ ok: true, ...(await getInsights(env, params)) });

      case "list_campaigns":
        return res.json({ ok: true, ...(await listCampaigns(env)) });

      case "push_winners":
        return res.json({ ok: true, results: await pushWinners(env, params) });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}`, available: [
          "create_campaign", "create_adset", "create_ad",
          "pause", "resume", "get_insights", "list_campaigns", "push_winners",
        ]});
    }
  } catch (err) {
    console.error(`[meta-ads] ${action} error:`, err.message);
    return res.status(502).json({ error: err.message });
  }
}
