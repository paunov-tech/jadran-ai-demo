// api/coast-intelligence.js — DELTA Coast Intelligence Aggregator
// Aggregates: YOLO crowd sensors + Sentinel-2 parking/sea quality + affiliates + HAK traffic
// GET /api/coast-intelligence
// Cache: 60s in-memory

const FB_KEY             = process.env.FIREBASE_API_KEY;
const WINDY_FORECAST_KEY = process.env.WINDY_FORECAST_KEY;
const WINDY_WEBCAM_KEY   = process.env.WINDY_WEBCAM_KEY;
const CORS               = ["https://jadran.ai", "https://monte-negro.ai"];

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60000;

// ─── REGION CENTROIDS — mapped from YOLO sub_region field ───────────────────
const REGION_CENTROIDS = {
  kvarner:        { lat: 45.04, lng: 14.55, name: "Kvarner" },
  split_makarska: { lat: 43.51, lng: 16.44, name: "Split–Makarska" },
  dubrovnik:      { lat: 42.65, lng: 18.09, name: "Dubrovnik" },
  zadar_sibenik:  { lat: 44.12, lng: 15.23, name: "Zadar–Šibenik" },
  istra:          { lat: 45.22, lng: 13.84, name: "Istra" },
  np_plitvice:    { lat: 44.88, lng: 15.62, name: "NP Plitvice" },
  np_krka:        { lat: 43.83, lng: 15.96, name: "NP Krka" },
  other:          { lat: 44.50, lng: 15.80, name: "Ostalo" },
};

// ─── PARKING ZONE CENTROIDS — from satellite.js polygon midpoints ────────────
const PARKING_CENTROIDS = {
  plitvice_p1:      { lat: 44.8799, lng: 15.6124, name: "Plitvice P1",        maxCars: 180 },
  plitvice_p2:      { lat: 44.8828, lng: 15.6229, name: "Plitvice P2",        maxCars: 220 },
  krka_lozovac:     { lat: 43.8328, lng: 15.9602, name: "Krka Lozovac",       maxCars: 300 },
  zlatni_rat:       { lat: 43.2573, lng: 16.6343, name: "Zlatni Rat (Bol)",   maxCars: 120 },
  lopar_rajska:     { lat: 44.8356, lng: 14.7228, name: "Lopar Rajska plaža", maxCars: 150 },
  split_supaval:    { lat: 43.5110, lng: 16.4293, name: "Split P+R Supaval",  maxCars: 350 },
  dubrovnik_pile:   { lat: 42.6422, lng: 18.1030, name: "Dubrovnik Pile",     maxCars: 500 },
  stobrec_camp:     { lat: 43.4918, lng: 15.5574, name: "Stobreč Camp",       maxCars: 200 },
  stinica_terminal: { lat: 44.9890, lng: 14.9035, name: "Stinica trajekt",    maxCars: 80  },
  misnjak_terminal: { lat: 44.7430, lng: 14.7594, name: "Mišnjak trajekt",    maxCars: 60  },
};

// ─── SEA QUALITY ZONE CENTROIDS ──────────────────────────────────────────────
const SEA_CENTROIDS = {
  lopar_rab:       { lat: 44.841, lng: 14.707, name: "Rajska plaža (Rab)",    region: "kvarner" },
  bacvice_split:   { lat: 43.494, lng: 16.452, name: "Bačvice (Split)",       region: "split_makarska" },
  zlatni_rat_bol:  { lat: 43.318, lng: 16.647, name: "Zlatni Rat (Bol)",      region: "split_makarska" },
  rovinj_bay:      { lat: 45.077, lng: 13.636, name: "Rovinj uvala",          region: "istra" },
  dubrovnik_banje: { lat: 42.641, lng: 18.113, name: "Banje (Dubrovnik)",     region: "dubrovnik" },
  makarska:        { lat: 43.293, lng: 17.018, name: "Makarska",              region: "split_makarska" },
  hvar_bay:        { lat: 43.172, lng: 16.443, name: "Hvar luka",             region: "split_makarska" },
  zadar_coastal:   { lat: 44.140, lng: 15.183, name: "Zadar Borik",           region: "zadar_sibenik" },
};

// ─── FORECAST POINTS — Windy Point Forecast API ──────────────────────────────
const FORECAST_POINTS = [
  { id: "split",     name: "Split",     lat: 43.508, lng: 16.440 },
  { id: "dubrovnik", name: "Dubrovnik", lat: 42.650, lng: 18.094 },
  { id: "zadar",     name: "Zadar",     lat: 44.119, lng: 15.231 },
  { id: "rijeka",    name: "Rijeka",    lat: 45.327, lng: 14.442 },
  { id: "pula",      name: "Pula",      lat: 44.867, lng: 13.848 },
  { id: "hvar",      name: "Hvar",      lat: 43.172, lng: 16.443 },
];

// ─── AFFILIATE PINS (server-side copy) ───────────────────────────────────────
const AFFILIATES = [
  { id: "blackjack", name: "Black Jack — Gurman House", city: "Rab",    lat: 44.7534, lng: 14.7835, color: "#0ea5e9" },
  { id: "eufemija",  name: "Konoba Sv. Eufemija",       city: "Rovinj", lat: 45.0812, lng: 13.6388, color: "#f59e0b" },
];

function densityLevel(objects) {
  if (objects > 200) return "critical";
  if (objects > 100) return "heavy";
  if (objects > 50)  return "moderate";
  if (objects > 10)  return "light";
  return "empty";
}

// Normalize Firestore sub_region strings → canonical centroid keys
// Handles variant naming from different sensor operators
function normalizeSubRegion(sub) {
  const s = (sub || "other").toLowerCase().replace(/[_\-\s]+/g, "_");
  if (/plitvice/.test(s))                                                    return "np_plitvice";
  if (/krka/.test(s))                                                        return "np_krka";
  if (/kvarner|rab|krk|cres|losinj|rijeka|opatija|senj/.test(s))            return "kvarner";
  if (/split|makarska|bol|hvar|brač|brac|šolta|solta|trogir|omis/.test(s))  return "split_makarska";
  if (/dubrovnik|peljes|pelješac|korčula|korcula|lastovo/.test(s))           return "dubrovnik";
  if (/zadar|šibenik|sibenik|murter|vodice|biograd|nin/.test(s))             return "zadar_sibenik";
  if (/istra|istria|rovinj|pula|poreč|porec|novigrad|umag|labin/.test(s))   return "istra";
  return "other";
}

// ─── YOLO from Firestore ──────────────────────────────────────────────────────
async function fetchYolo() {
  if (!FB_KEY) return { regions: {}, total: 0, active: 0 };
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return { regions: {}, total: 0, active: 0 };
    const data = await r.json();
    if (!data.documents) return { regions: {}, total: 0, active: 0 };
    const cutoff = Date.now() - 24 * 3600000;
    const regions = {};
    let total = 0, active = 0;
    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;
      const ts = f.timestamp?.stringValue || "";
      const docId = doc.name.split("/").pop();
      let fresh = false;
      if (ts) { const t = new Date(ts).getTime(); fresh = !isNaN(t) && t > cutoff; }
      if (!fresh) fresh = !/\d{4}-\d{2}-\d{2}/.test(docId);
      if (!fresh) continue;
      const rawSub = f.sub_region?.stringValue || "other";
      const sub    = normalizeSubRegion(rawSub);
      const cnt    = parseInt(f.raw_count?.integerValue || "0");
      const counts = {};
      if (f.counts?.mapValue?.fields) {
        for (const [k, v] of Object.entries(f.counts.mapValue.fields)) {
          counts[k] = parseInt(v.integerValue || "0");
        }
      }
      if (!regions[sub]) regions[sub] = { objects: 0, cars: 0, persons: 0, cams: 0 };
      regions[sub].objects += cnt;
      regions[sub].cars    += counts.car    || 0;
      regions[sub].persons += counts.person || 0;
      if (cnt > 0) regions[sub].cams++;
      total  += cnt;
      if (cnt > 0) active++;
    }
    return { regions, total, active };
  } catch (e) {
    console.warn("[coast-intel] YOLO:", e.message);
    return { regions: {}, total: 0, active: 0 };
  }
}

// ─── Satellite parking from Firestore ────────────────────────────────────────
async function fetchParkingCache() {
  if (!FB_KEY) return {};
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_satellite?key=${FB_KEY}&pageSize=20`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return {};
    const data = await r.json();
    const result = {};
    for (const doc of (data.documents || [])) {
      const id = doc.name.split("/").pop();
      const f  = doc.fields || {};
      result[id] = {
        occupancyPct: parseInt(f.occupancyPct?.integerValue || "0"),
        level:        f.level?.stringValue || "unknown",
        imageDate:    f.imageDate?.stringValue || null,
      };
    }
    return result;
  } catch (e) {
    console.warn("[coast-intel] parking:", e.message);
    return {};
  }
}

// ─── Sea quality from Firestore ───────────────────────────────────────────────
async function fetchSeaCache() {
  if (!FB_KEY) return {};
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_sea_quality?key=${FB_KEY}&pageSize=20`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return {};
    const data = await r.json();
    const result = {};
    for (const doc of (data.documents || [])) {
      const id = doc.name.split("/").pop();
      const f  = doc.fields || {};
      result[id] = {
        clarity:   f.clarity?.stringValue   || "unknown",
        clarityHR: f.clarityHR?.stringValue || "nepoznato",
        algaeRisk: f.algaeRisk?.stringValue || "none",
        score:     parseInt(f.score?.integerValue || "0"),
        imageDate: f.imageDate?.stringValue || null,
        beach:     f.beach?.stringValue     || id,
      };
    }
    return result;
  } catch (e) {
    console.warn("[coast-intel] sea:", e.message);
    return {};
  }
}

// ─── HAK traffic ─────────────────────────────────────────────────────────────
async function fetchHAK() {
  try {
    const r = await fetch("https://www.hak.hr/info/stanje-na-cestama/feed/", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" },
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = [];
    const rx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = rx.exec(xml)) !== null && items.length < 8) {
      const chunk = m[1];
      const title   = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(chunk) || /<title>([^<]*)<\/title>/.exec(chunk))?.[1]?.trim() || "";
      const desc    = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(chunk) || /<description>([^<]*)<\/description>/.exec(chunk))?.[1]?.replace(/<[^>]+>/g, "").trim() || "";
      const pubDate = /<pubDate>([^<]*)<\/pubDate>/.exec(chunk)?.[1]?.trim() || "";
      if (title) items.push({ title, desc: desc.slice(0, 200), pubDate, source: "HAK" });
    }
    return items;
  } catch (e) { return []; }
}

// ─── Windy Point Forecast ────────────────────────────────────────────────────
async function fetchWindyForecast() {
  if (!WINDY_FORECAST_KEY) return [];
  const results = [];
  await Promise.all(FORECAST_POINTS.map(async pt => {
    try {
      const [wRes, waveRes] = await Promise.all([
        fetch("https://api.windy.com/api/point-forecast/v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pt.lat, lon: pt.lng, model: "gfs",
            parameters: ["wind", "windGust", "temp"],
            levels: ["surface"],
            key: WINDY_FORECAST_KEY,
          }),
          signal: AbortSignal.timeout(8000),
        }),
        fetch("https://api.windy.com/api/point-forecast/v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pt.lat, lon: pt.lng, model: "gfsWave",
            parameters: ["waves"],
            levels: ["surface"],
            key: WINDY_FORECAST_KEY,
          }),
          signal: AbortSignal.timeout(8000),
        }),
      ]);
      const wd    = wRes.ok    ? await wRes.json()    : null;
      const waved = waveRes.ok ? await waveRes.json() : null;
      if (!wd) return;
      const u   = wd["wind_u-surface"]?.[0] ?? 0;
      const v   = wd["wind_v-surface"]?.[0] ?? 0;
      const spd = Math.sqrt(u * u + v * v);
      const deg = ((270 - Math.atan2(v, u) * 180 / Math.PI) + 360) % 360;
      const tempK = wd["temp-surface"]?.[0] ?? 273.15;
      const gust  = wd["windGust-surface"]?.[0] ?? spd;
      // wave height — try both field name variants
      const waveH = waved
        ? (waved["waves_significant_height-surface"]?.[0] ?? waved["waves-surface"]?.[0] ?? null)
        : null;
      results.push({
        id: pt.id, name: pt.name, lat: pt.lat, lng: pt.lng,
        windMs:  Math.round(spd * 10) / 10,
        windKts: Math.round(spd * 1.944),
        windDeg: Math.round(deg),
        gustMs:  Math.round(gust * 10) / 10,
        tempC:   Math.round((tempK - 273.15) * 10) / 10,
        waveM:   waveH != null ? Math.round(waveH * 10) / 10 : null,
      });
    } catch (e) {
      console.warn("[coast-intel] Windy forecast", pt.id, e.message);
    }
  }));
  // keep original order
  return FORECAST_POINTS.map(p => results.find(r => r.id === p.id)).filter(Boolean);
}

// ─── Windy Webcams ────────────────────────────────────────────────────────────
async function fetchWindyWebcams() {
  if (!WINDY_WEBCAM_KEY) return [];
  try {
    const r = await fetch(
      "https://api.windy.com/webcams/api/v3/webcams?nearby=44.0,16.0,350&limit=15&include=player,images&lang=en",
      { headers: { "x-windy-api-key": WINDY_WEBCAM_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) { console.warn("[coast-intel] Windy webcams HTTP", r.status); return []; }
    const data = await r.json();
    return (data.webcams || [])
      .filter(w => w.status === "active" && w.location?.latitude && w.location?.longitude)
      .slice(0, 12)
      .map(w => ({
        id:      w.webcamId,
        title:   w.title || "",
        city:    w.location?.city || "",
        lat:     w.location.latitude,
        lng:     w.location.longitude,
        preview: w.player?.day?.previewUrl || w.player?.live?.previewUrl || null,
        url:     `https://www.windy.com/webcams/${w.webcamId}`,
      }));
  } catch (e) {
    console.warn("[coast-intel] Windy webcams:", e.message);
    return [];
  }
}

// ─── NASA FIRMS active fires ──────────────────────────────────────────────────
async function fetchNASAFires() {
  try {
    const r = await fetch(
      "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Europe_24h.csv",
      { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" } }
    );
    if (!r.ok) return [];
    const text  = await r.text();
    const lines = text.trim().split("\n");
    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const c   = lines[i].split(",");
      const lat = parseFloat(c[0]);
      const lng = parseFloat(c[1]);
      // Croatia + immediate Adriatic coast bounding box
      if (lat >= 41.5 && lat <= 47.5 && lng >= 13.0 && lng <= 19.5) {
        fires.push({
          lat, lng,
          confidence: (c[9] || "nominal").trim(),
          acqDate:    (c[5] || "").trim(),
          dayNight:   (c[13] || "D").trim(),
        });
      }
    }
    return fires.slice(0, 40);
  } catch (e) {
    console.warn("[coast-intel] NASA FIRMS:", e.message);
    return [];
  }
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (CORS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return res.status(200).json(_cache);
  }

  const [yolo, parking, sea, traffic, forecast, webcams, fires] = await Promise.all([
    fetchYolo(),
    fetchParkingCache(),
    fetchSeaCache(),
    fetchHAK(),
    fetchWindyForecast(),
    fetchWindyWebcams(),
    fetchNASAFires(),
  ]);

  // Build region nodes
  const regions = Object.entries(REGION_CENTROIDS).map(([id, c]) => {
    const yd = yolo.regions[id] || { objects: 0, cars: 0, persons: 0, cams: 0 };
    return {
      id, lat: c.lat, lng: c.lng, name: c.name,
      objects: yd.objects, cars: yd.cars, persons: yd.persons, cams: yd.cams,
      level: densityLevel(yd.objects),
    };
  });

  // Build parking nodes
  const parkingNodes = Object.entries(PARKING_CENTROIDS).map(([id, c]) => {
    const sat = parking[id];
    return {
      id, lat: c.lat, lng: c.lng, name: c.name, maxCars: c.maxCars,
      occupancyPct: sat?.occupancyPct ?? null,
      level:        sat?.level       ?? "unknown",
      imageDate:    sat?.imageDate   ?? null,
    };
  });

  // Build sea nodes
  const seaNodes = Object.entries(SEA_CENTROIDS).map(([id, c]) => {
    const sat = sea[id];
    return {
      id, lat: c.lat, lng: c.lng, name: c.name, region: c.region,
      clarity:   sat?.clarity   ?? "unknown",
      clarityHR: sat?.clarityHR ?? "nepoznato",
      algaeRisk: sat?.algaeRisk ?? "none",
      score:     sat?.score     ?? 0,
      imageDate: sat?.imageDate ?? null,
      beach:     sat?.beach     ?? c.name,
    };
  });

  // Alerts: critical first
  const alerts = [];
  for (const r of regions) {
    if (r.level === "critical") alerts.push({ type: "crowd",   severity: "critical", text: `Kritična gužva: ${r.name} (${r.objects} detekcija)`,  region: r.id });
    else if (r.level === "heavy")    alerts.push({ type: "crowd",   severity: "warning",  text: `Velika gužva: ${r.name} (${r.objects} detekcija)`,      region: r.id });
  }
  for (const p of parkingNodes) {
    if (p.level === "full")          alerts.push({ type: "parking", severity: "critical", text: `Parking pun: ${p.name}`,                                zone: p.id });
    else if (p.level === "heavy")    alerts.push({ type: "parking", severity: "warning",  text: `Parking gusto: ${p.name} (~${p.occupancyPct}%)`,         zone: p.id });
  }
  for (const s of seaNodes) {
    if (s.algaeRisk === "high")      alerts.push({ type: "sea",     severity: "warning",  text: `Alge: ${s.beach} — povišen klorofil`,                   zone: s.id });
  }
  for (const t of traffic.slice(0, 3)) {
    alerts.push({ type: "traffic",   severity: "warning",  text: t.title, source: "HAK" });
  }
  alerts.sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1));

  // Fire alerts → add to alerts list
  const highFires = fires.filter(f => f.confidence === "high");
  if (highFires.length > 0)
    alerts.push({ type: "fire", severity: "critical", text: `NASA FIRMS: ${highFires.length} aktivni požar${highFires.length > 1 ? "a" : ""} u regiji` });
  else if (fires.length > 0)
    alerts.push({ type: "fire", severity: "warning", text: `NASA FIRMS: ${fires.length} potencijalnih požarnih točaka` });
  alerts.sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1));

  const payload = {
    ts: new Date().toISOString(),
    yolo:      { total: yolo.total, active: yolo.active },
    regions,
    parking:   parkingNodes,
    sea:       seaNodes,
    affiliates: AFFILIATES,
    traffic:   traffic.slice(0, 6),
    alerts:    alerts.slice(0, 15),
    forecast,
    webcams,
    fires,
  };

  _cache   = payload;
  _cacheTs = Date.now();
  return res.status(200).json(payload);
}
