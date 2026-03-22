// api/border-intelligence.js — Live border crossing intelligence
// Fetches DARS/promet.si + HAK + ASFINAG in parallel, synthesizes with Claude AI
// GET /api/border-intelligence

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const CACHE = { data: null, ts: 0 };
const CACHE_TTL = 600000; // 10 min

// Known border crossing coordinates for camera filtering
const BORDER_CAMERAS = {
  karavanke: { lat: 46.497, lng: 13.999, keywords: ["karavanke", "karawanken", "karavanken"] },
  sentilj:   { lat: 46.676, lng: 15.663, keywords: ["šentilj", "sentilj", "spielfeld"] },
  macelj:    { lat: 46.196, lng: 15.675, keywords: ["macelj", "gruškovje", "gruskovje", "rogatec"] },
};

function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Source fetchers ────────────────────────────────────────────────

async function fetchDars() {
  const r = await fetch("https://promet.si/api/v2/events?lang=sl&type=border", {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`DARS ${r.status}`);
  const data = await r.json();
  const events = Array.isArray(data) ? data : (data.events || data.data || []);
  return events.map(e => ({
    source: "dars",
    location: e.title || e.name || e.location || "",
    description: e.description || e.content || "",
    type: e.type || "info",
    severity: e.severity || "low",
  })).slice(0, 20);
}

async function fetchPrometCameras() {
  const r = await fetch("https://promet.si/api/v2/cameras", {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Cameras ${r.status}`);
  const data = await r.json();
  const cams = Array.isArray(data) ? data : (data.cameras || data.data || []);

  const result = [];
  for (const [key, border] of Object.entries(BORDER_CAMERAS)) {
    // Match by location name keywords
    const matched = cams.filter(c => {
      const title = (c.title || c.name || c.location || "").toLowerCase();
      if (border.keywords.some(kw => title.includes(kw))) return true;
      // Also match by proximity if coordinates available
      if (c.y && c.x) return distKm(border.lat, border.lng, parseFloat(c.y), parseFloat(c.x)) < 15;
      if (c.lat && c.lng) return distKm(border.lat, border.lng, parseFloat(c.lat), parseFloat(c.lng)) < 15;
      return false;
    });
    if (matched.length > 0) {
      const cam = matched[0];
      const snapshotUrl = cam.imageUrl || cam.snapshot_url || cam.url || cam.image || null;
      result.push({ key, location: cam.title || cam.name || key, snapshot_url: snapshotUrl });
    }
  }
  return result;
}

async function fetchHak() {
  const r = await fetch("https://www.hak.hr/api/info/", {
    headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`HAK ${r.status}`);
  const data = await r.json();
  const items = Array.isArray(data) ? data : (data.items || data.news || data.events || []);
  return items.filter(i => {
    const txt = (i.title || i.naslov || i.description || "").toLowerCase();
    return txt.includes("granič") || txt.includes("granica") || txt.includes("border") || txt.includes("prelaz");
  }).map(i => ({
    source: "hak",
    title: i.title || i.naslov || "",
    description: i.description || i.sadrzaj || "",
    url: i.url || "",
  })).slice(0, 10);
}

async function fetchAsfinag() {
  // ASFINAG open data API
  const r = await fetch(
    "https://data.asfinag.at/api/3/action/datastore_search?resource_id=traffic&limit=50",
    { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error(`ASFINAG ${r.status}`);
  const data = await r.json();
  const records = data?.result?.records || [];
  return records.filter(rec => {
    const txt = (rec.title || rec.description || rec.location || "").toLowerCase();
    return txt.includes("karawanken") || txt.includes("spielfeld") || txt.includes("grenze");
  }).map(rec => ({
    source: "asfinag",
    title: rec.title || rec.description || "",
    location: rec.location || "",
    severity: rec.severity || "info",
  })).slice(0, 10);
}

// ─── Claude synthesis ──────────────────────────────────────────────

async function synthesize(dars, hak, asfinag, cameras) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return buildFallbackSynthesis();

  const dataStr = JSON.stringify({ dars, hak, asfinag, cameras: cameras.map(c => c.location) }, null, 2);
  const prompt = `You are analyzing border crossing data for travelers from Germany/Austria/Slovenia to Croatia (destination: Split/Podstrana area).

Available data from traffic APIs:
${dataStr}

Key border crossings:
- Šentilj (A1 motorway, Austria→Slovenia): typical wait 0-60 min
- Macelj/Gruškovje (A2 motorway, Slovenia→Croatia): typical wait 5-120 min in peak season
- Karavanke Tunnel (A11 Austria→Slovenia): often congested, single-bore

Based on this data (or general knowledge if data is sparse), provide:
1. Status for each of the 3 crossings: free/moderate/busy + estimated wait in minutes
2. Best crossing recommendation with reason
3. Time saved vs alternative route
4. Any weather or incident alerts on the route

Respond ONLY with this exact JSON (no markdown):
{
  "crossings": [
    {"name":"Karavanke","status":"free|moderate|busy","wait_minutes":0,"color":"green|yellow|red","note":""},
    {"name":"Šentilj","status":"free|moderate|busy","wait_minutes":0,"color":"green|yellow|red","note":""},
    {"name":"Macelj","status":"free|moderate|busy","wait_minutes":0,"color":"green|yellow|red","note":""}
  ],
  "recommendation":{"crossing":"","reason":"","time_saved_min":0},
  "alerts":[]
}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await resp.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    // Extract JSON even if wrapped in backticks
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return buildFallbackSynthesis();
  } catch (err) {
    console.error("Claude synthesis error:", err.message);
    return buildFallbackSynthesis();
  }
}

function buildFallbackSynthesis() {
  const h = new Date().getHours();
  const isBusy = (h >= 8 && h <= 11) || (h >= 15 && h <= 19);
  const isWeekend = [0, 5, 6].includes(new Date().getDay());
  const busy = isBusy && isWeekend;

  return {
    crossings: [
      { name: "Karavanke", status: busy ? "busy" : "moderate", wait_minutes: busy ? 45 : 15, color: busy ? "red" : "yellow", note: "Jednosmjerni tunel — izmjenični promet" },
      { name: "Šentilj", status: "free", wait_minutes: busy ? 10 : 0, color: "green", note: "A1 autocesta — preporučamo" },
      { name: "Macelj", status: busy ? "moderate" : "free", wait_minutes: busy ? 30 : 5, color: busy ? "yellow" : "green", note: "A2 autocesta → Hrvatska" },
    ],
    recommendation: {
      crossing: "Šentilj",
      reason: busy ? "Karavanke gužva — Šentilj slobodan, brže za 35 min" : "Šentilj slobodan, direktna veza na A1",
      time_saved_min: busy ? 35 : 10,
    },
    alerts: busy ? [{ type: "traffic", message: "Vikend gužva na granicama — planirajte ranije" }] : [],
    source: "fallback",
  };
}

// ─── Handler ──────────────────────────────────────────────────────

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=120");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Server-side cache
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  // Fetch all sources in parallel — never let one failure block the response
  const [darsRes, camerasRes, hakRes, asfinagRes] = await Promise.allSettled([
    fetchDars(), fetchPrometCameras(), fetchHak(), fetchAsfinag(),
  ]);

  const dars = darsRes.status === "fulfilled" ? darsRes.value : [];
  const cameras = camerasRes.status === "fulfilled" ? camerasRes.value : [];
  const hak = hakRes.status === "fulfilled" ? hakRes.value : [];
  const asfinag = asfinagRes.status === "fulfilled" ? asfinagRes.value : [];

  // Log failures for monitoring
  if (darsRes.status === "rejected") console.warn("DARS fetch failed:", darsRes.reason?.message);
  if (camerasRes.status === "rejected") console.warn("Cameras fetch failed:", camerasRes.reason?.message);
  if (hakRes.status === "rejected") console.warn("HAK fetch failed:", hakRes.reason?.message);
  if (asfinagRes.status === "rejected") console.warn("ASFINAG fetch failed:", asfinagRes.reason?.message);

  // Synthesize with Claude
  const synthesis = await synthesize(dars, hak, asfinag, cameras);

  const result = {
    crossings: synthesis.crossings,
    cameras: cameras.map(c => ({ location: c.location, snapshot_url: c.snapshot_url, key: c.key })),
    recommendation: synthesis.recommendation,
    alerts: synthesis.alerts || [],
    updated: new Date().toISOString(),
    sources: {
      dars: darsRes.status === "fulfilled",
      cameras: camerasRes.status === "fulfilled",
      hak: hakRes.status === "fulfilled",
      asfinag: asfinagRes.status === "fulfilled",
    },
  };

  CACHE.data = result;
  CACHE.ts = Date.now();
  return res.status(200).json(result);
}
