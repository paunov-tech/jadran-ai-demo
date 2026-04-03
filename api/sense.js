// api/sense.js — YOLO Sense — Location Intelligence
// Primary: LIVE YOLO Sense data from Firestore (same system as api/chat.js)
// Fallback: time-based mock when FIREBASE_API_KEY not set or Firestore unavailable

const CACHE = { data: null, ts: 0, key: "" };
const CACHE_TTL = 300000; // 5 min (matches YOLO update cadence)

// ─── Sense Firestore fetch (mirrored from api/chat.js — Vercel functions can't share modules) ───
let _senseCache = null;
let _senseCacheTime = 0;
const SENSE_CACHE_MS = 5 * 60 * 1000;

async function fetchSenseData() {
  if (_senseCache && Date.now() - _senseCacheTime < SENSE_CACHE_MS) return _senseCache;
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${key}&pageSize=300`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.documents) return null;

    const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const regions = {};
    let totalObjects = 0;
    let activeCams = 0;

    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;

      const ts = f.timestamp?.stringValue || "";
      const docId = doc.name.split("/").pop();
      let fresh = false;
      if (ts) {
        const tsMs = new Date(ts).getTime();
        fresh = !isNaN(tsMs) && tsMs > cutoff24h;
      }
      if (!fresh) fresh = docId.includes(today) || docId.includes(yesterday);
      if (!fresh) {
        const hasNoDate = !/\d{4}-\d{2}-\d{2}/.test(docId);
        if (hasNoDate) fresh = true;
      }
      if (!fresh) continue;

      const camId = f.camera_id?.stringValue || "";
      const subRegion = f.sub_region?.stringValue || "other";
      const rawCount = parseInt(f.raw_count?.integerValue || "0");
      const busyness = parseInt(f.busyness_percent?.integerValue || "0");
      const counts = {};
      if (f.counts?.mapValue?.fields) {
        for (const [k, v] of Object.entries(f.counts.mapValue.fields)) {
          counts[k] = parseInt(v.integerValue || "0");
        }
      }

      const REGION_MAP = {
        zagreb: "inland", gorski_kotar: "inland", inland: "inland",
        kvarner: "kvarner", istra: "istra",
        zadar: "zadar_sibenik", split: "split_makarska", dubrovnik: "dubrovnik",
      };
      const appRegion = REGION_MAP[subRegion] || subRegion;
      if (!regions[appRegion]) regions[appRegion] = { cameras: [], totalObjects: 0, persons: 0, cars: 0, boats: 0 };
      regions[appRegion].cameras.push({ camId, rawCount, busyness, counts, ts });
      regions[appRegion].totalObjects += rawCount;
      regions[appRegion].persons += (counts.person || 0);
      regions[appRegion].cars += (counts.car || 0);
      regions[appRegion].boats += (counts.boat || 0);
      totalObjects += rawCount;
      if (rawCount > 0) activeCams++;
    }

    for (const reg of Object.values(regions)) {
      reg.cameras.sort((a, b) => b.rawCount - a.rawCount);
      reg.activeCameras = reg.cameras.filter(c => c.rawCount > 0).length;
      reg.topCamera = reg.cameras[0] || null;
    }

    _senseCache = { regions, totalObjects, activeCams, timestamp: new Date().toISOString() };
    _senseCacheTime = Date.now();
    return _senseCache;
  } catch (e) {
    console.error("sense.js YOLO fetch error:", e.message);
    return null;
  }
}

// ─── Map destination city name → YOLO region key ───
function cityToRegion(city) {
  if (!city) return "split_makarska";
  const c = city.toLowerCase().trim();
  // Kvarner
  if (/rab|krk|cres|rijeka|opatija|lošinj|losinj|crikvenica|senj|novi vinodolski/.test(c)) return "kvarner";
  // Istra
  if (/pula|rovinj|poreč|porec|umag|novigrad|pazin|labin|medulin|poreč|fažana|fazana/.test(c)) return "istra";
  // Zadar / Šibenik
  if (/zadar|šibenik|sibenik|vodice|biograd|nin|primošten|primosten|murter|tribunj/.test(c)) return "zadar_sibenik";
  // Dubrovnik corridor
  if (/dubrovnik|makarska|ploče|ploce|metkovic|metković|opuzen/.test(c)) return "dubrovnik";
  // Split corridor (default Dalmatia)
  return "split_makarska";
}

// ─── Translate YOLO region → BeachStatus shape ───
function yoloToBeachStatus(yoloData, city) {
  const regionKey = cityToRegion(city);
  // Try requested region; fall back to split_makarska as last resort
  const reg = yoloData.regions?.[regionKey] || yoloData.regions?.["split_makarska"];
  if (!reg || reg.totalObjects === 0) return null;

  const cityName = city || "Jadran";
  const persons = reg.persons;
  const boats = reg.boats;
  const cars = reg.cars;
  const activeCams = reg.activeCameras || 0;

  const busyness = reg.topCamera?.busyness ?? Math.min(100, Math.round(persons / 2));
  const occupancy_pct = busyness;

  const crowd =
    occupancy_pct < 20 ? "mirno" :
    occupancy_pct < 45 ? "malo gužve" :
    occupancy_pct < 70 ? "srednje gužve" : "jako gužva";

  const recommendation =
    occupancy_pct < 20 ? "Savršen trenutak — gotovo prazno!" :
    occupancy_pct < 45 ? "Ugodno — ima mjesta" :
    occupancy_pct < 70 ? "Gužva — dođite rano ujutro" : "Jako gužva — preporučamo alternativu";

  const boatCount = Math.min(boats || 0, 40);
  const carLoad = Math.min(cars, 80);
  const freeSpots = Math.max(0, 80 - carLoad);

  return {
    beach: {
      name: `Plaža ${cityName}`,
      crowd,
      occupancy_pct,
      tourists: persons,
      recommendation,
      best_time: "07:00–09:00",
      yolo_cams: activeCams,
    },
    marina: {
      name: `Marina ${cityName}`,
      boats: boatCount,
      free_moorings: Math.max(0, 30 - boatCount),
      status: boatCount < 10 ? "slobodno" : boatCount < 20 ? "umjereno" : "popunjeno",
    },
    parking: {
      name: `Parking ${cityName}`,
      free_spots: freeSpots,
      total_spots: 80,
      status: freeSpots > 50 ? "slobodno" : freeSpots > 20 ? "umjereno" : "gotovo puno",
    },
    updated: yoloData.timestamp,
    source: "yolo",
    region: regionKey,
    note: `LIVE YOLO data — ${yoloData.activeCams} aktivnih kamera, zadnji update ${new Date(yoloData.timestamp).toLocaleTimeString("hr")}`,
  };
}

// ─── Time-based mock (kept as fallback — DO NOT DELETE) ───
function getMockData(city) {
  const hour = new Date().getHours();
  const beachCrowd = hour < 8 ? "mirno" : hour < 10 ? "malo gužve" : hour < 13 ? "srednje gužve" : hour < 17 ? "jako gužva" : hour < 19 ? "srednje gužve" : "mirno";
  const beachPct = hour < 8 ? 5 : hour < 10 ? 20 : hour < 13 ? 55 : hour < 17 ? 85 : hour < 19 ? 50 : 15;
  const boatCount = hour < 7 ? 2 : hour < 10 ? 8 : hour < 14 ? 18 : hour < 18 ? 24 : hour < 21 ? 16 : 6;
  const freeSpots = Math.max(0, Math.floor(80 - (beachPct * 0.7)));
  const c = city || "Jadran";

  return {
    beach: { name: `Plaža ${c}`, crowd: beachCrowd, occupancy_pct: beachPct, recommendation: beachPct < 30 ? "Idealno!" : beachPct < 60 ? "Ima mjesta" : beachPct < 80 ? "Gužva" : "Puno", best_time: "07:00–09:00" },
    marina: { name: `Marina ${c}`, boats: boatCount, free_moorings: Math.max(0, 30 - boatCount), status: boatCount < 10 ? "slobodno" : boatCount < 20 ? "umjereno" : "popunjeno" },
    parking: { name: `Parking ${c}`, free_spots: freeSpots, total_spots: 80, status: freeSpots > 50 ? "slobodno" : freeSpots > 20 ? "umjereno" : "gotovo puno" },
    updated: new Date().toISOString(),
    source: "sense",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://monte-negro.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=120");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const city = req.query?.city || "Jadran";

  if (CACHE.data && CACHE.key === city && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  // Try LIVE Sense data first
  let data = null;
  try {
    const yolo = await fetchSenseData();
    if (yolo) data = yoloToBeachStatus(yolo, city);
  } catch (e) {
    console.warn("sense.js: Sense unavailable, falling back to simulation:", e.message);
  }

  // Fall back to time-based simulation
  if (!data) data = getMockData(city);

  CACHE.data = data;
  CACHE.key = city;
  CACHE.ts = Date.now();
  return res.status(200).json(data);
}
