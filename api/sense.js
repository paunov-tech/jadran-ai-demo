// api/sense.js — YOLO Sense + Weather + Marine Intelligence
// Sources:
//   1. LIVE: Firestore jadran_yolo (YOLO computer vision sensors, 5-min cadence)
//   2. LIVE: Open-Meteo current weather (temp, wind, UV, weather code)
//   3. LIVE: Open-Meteo marine (sea surface temp, wave height)
// Fallback: time-based simulation when Firestore unavailable

const CACHE = { data: null, ts: 0, key: "" };
const CACHE_TTL = 300000; // 5 min

// ─── Per-region GPS coords for weather/marine fetch ───────────
const REGION_GEO = {
  kvarner:        { lat: 44.755, lng: 14.760 }, // Rab
  istra:          { lat: 45.082, lng: 13.639 }, // Rovinj
  zadar_sibenik:  { lat: 44.119, lng: 15.231 }, // Zadar
  split_makarska: { lat: 43.508, lng: 16.440 }, // Split
  dubrovnik:      { lat: 42.650, lng: 18.094 }, // Dubrovnik
  inland:         { lat: 45.815, lng: 15.982 }, // Zagreb
};

// ─── Per-region realistic capacity ────────────────────────────
const REGION_CAPACITY = {
  kvarner:        { beachCap: 2000, marinaBerths: 250, parkingTotal: 120 },
  istra:          { beachCap: 1500, marinaBerths: 420, parkingTotal: 200 },
  zadar_sibenik:  { beachCap: 3000, marinaBerths: 310, parkingTotal: 160 },
  split_makarska: { beachCap: 4500, marinaBerths: 520, parkingTotal: 320 },
  dubrovnik:      { beachCap: 3500, marinaBerths: 180, parkingTotal: 90  },
  inland:         { beachCap: 0,    marinaBerths: 0,   parkingTotal: 500 },
};

// ─── Firestore YOLO fetch ────────────────────────────────────
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
    const today     = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const regions = {};
    let totalObjects = 0;
    let activeCams   = 0;

    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;

      const ts    = f.timestamp?.stringValue || "";
      const docId = doc.name.split("/").pop();
      let fresh   = false;
      if (ts) {
        const tsMs = new Date(ts).getTime();
        fresh = !isNaN(tsMs) && tsMs > cutoff24h;
      }
      if (!fresh) fresh = docId.includes(today) || docId.includes(yesterday);
      if (!fresh) { const hasNoDate = !/\d{4}-\d{2}-\d{2}/.test(docId); if (hasNoDate) fresh = true; }
      if (!fresh) continue;

      const camId     = f.camera_id?.stringValue || "";
      const subRegion = f.sub_region?.stringValue || "other";
      const rawCount  = parseInt(f.raw_count?.integerValue || "0");
      const busyness  = parseInt(f.busyness_percent?.integerValue || "0");
      const counts    = {};
      if (f.counts?.mapValue?.fields) {
        for (const [k, v] of Object.entries(f.counts.mapValue.fields))
          counts[k] = parseInt(v.integerValue || "0");
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
      regions[appRegion].persons      += (counts.person || 0);
      regions[appRegion].cars         += (counts.car    || 0);
      regions[appRegion].boats        += (counts.boat   || 0);
      totalObjects += rawCount;
      if (rawCount > 0) activeCams++;
    }

    for (const reg of Object.values(regions)) {
      reg.cameras.sort((a, b) => b.rawCount - a.rawCount);
      reg.activeCameras = reg.cameras.filter(c => c.rawCount > 0).length;
      reg.topCamera = reg.cameras[0] || null;
    }

    _senseCache     = { regions, totalObjects, activeCams, timestamp: new Date().toISOString() };
    _senseCacheTime = Date.now();
    return _senseCache;
  } catch (e) {
    console.error("sense.js YOLO fetch error:", e.message);
    return null;
  }
}

// ─── Open-Meteo weather + marine fetch ───────────────────────
async function fetchWeatherMarine(regionKey) {
  const geo = REGION_GEO[regionKey] || REGION_GEO.split_makarska;
  const { lat, lng } = geo;
  try {
    const [wx, marine] = await Promise.allSettled([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&current=temperature_2m,wind_speed_10m,wind_direction_10m,uv_index,weather_code,relative_humidity_2m` +
        `&wind_speed_unit=kmh&timezone=auto`
      ).then(r => r.ok ? r.json() : null),
      fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
        `&current=sea_surface_temperature,wave_height,wave_direction,wind_wave_height`
      ).then(r => r.ok ? r.json() : null),
    ]);

    const w  = wx.status     === "fulfilled" ? wx.value     : null;
    const m  = marine.status === "fulfilled" ? marine.value : null;
    const cw = w?.current;
    const cm = m?.current;

    // WMO weather code → condition label
    const wmoCode = cw?.weather_code ?? 0;
    const condition =
      wmoCode === 0  ? "vedro" :
      wmoCode <= 3   ? "oblačno" :
      wmoCode <= 49  ? "magla" :
      wmoCode <= 69  ? "kiša" :
      wmoCode <= 79  ? "snijeg" :
      wmoCode <= 99  ? "grmljavina" : "—";

    // Wind direction compass
    const dir = cw?.wind_direction_10m;
    const compass = dir != null
      ? ["S","SSW","SW","WSW","W","WNW","NW","NNW","N","NNE","NE","ENE","E","ESE","SE","SSE","S"][Math.round(dir / 22.5) % 16]
      : null;

    return {
      temp:      cw?.temperature_2m    ?? null,
      wind_kmh:  Math.round(cw?.wind_speed_10m ?? 0),
      wind_dir:  compass,
      uv:        cw?.uv_index          ?? null,
      humidity:  cw?.relative_humidity_2m ?? null,
      condition,
      sea_temp:  cm?.sea_surface_temperature != null ? Math.round(cm.sea_surface_temperature * 10) / 10 : null,
      wave_m:    cm?.wave_height        != null ? Math.round(cm.wave_height * 10) / 10        : null,
      wind_wave: cm?.wind_wave_height   != null ? Math.round(cm.wind_wave_height * 10) / 10    : null,
    };
  } catch (e) {
    console.warn("sense.js: weather/marine fetch failed:", e.message);
    return null;
  }
}

// ─── City name → YOLO region ─────────────────────────────────
function cityToRegion(city) {
  if (!city) return "split_makarska";
  const c = city.toLowerCase().trim();
  if (/rab|krk|cres|rijeka|opatija|lošinj|losinj|crikvenica|senj|novi vinodolski/.test(c)) return "kvarner";
  if (/pula|rovinj|poreč|porec|umag|novigrad|pazin|labin|medulin|fažana|fazana/.test(c)) return "istra";
  if (/zadar|šibenik|sibenik|vodice|biograd|nin|primošten|primosten|murter/.test(c))      return "zadar_sibenik";
  if (/dubrovnik|makarska|ploče|ploce|metkovic|metković|opuzen/.test(c))                  return "dubrovnik";
  return "split_makarska";
}

// ─── YOLO data → BeachStatus shape ───────────────────────────
function yoloToBeachStatus(yoloData, city) {
  const regionKey = cityToRegion(city);
  const reg = yoloData.regions?.[regionKey] || yoloData.regions?.["split_makarska"];
  if (!reg || reg.totalObjects === 0) return null;

  const cap = REGION_CAPACITY[regionKey] || REGION_CAPACITY.split_makarska;
  const cityName = city || "Jadran";
  const persons  = reg.persons;
  const boats    = reg.boats;
  const cars     = reg.cars;
  const activeCams = reg.activeCameras || 0;

  const busyness    = reg.topCamera?.busyness ?? Math.min(100, Math.round(persons / (cap.beachCap / 100)));
  const occupancy_pct = Math.min(100, busyness);

  const crowd          = occupancy_pct < 20 ? "mirno" : occupancy_pct < 45 ? "malo gužve" : occupancy_pct < 70 ? "srednje gužve" : "jako gužva";
  const recommendation = occupancy_pct < 20 ? "Savršen trenutak — gotovo prazno!" : occupancy_pct < 45 ? "Ugodno — ima mjesta" : occupancy_pct < 70 ? "Gužva — dođite rano ujutro" : "Jako gužva — preporučamo alternativu";

  const boatLoad     = Math.min(boats || 0, cap.marinaBerths);
  const freeMoorings = Math.max(0, cap.marinaBerths - boatLoad);
  const carLoad      = Math.min(cars, cap.parkingTotal);
  const freeSpots    = Math.max(0, cap.parkingTotal - carLoad);

  return {
    beach: {
      name: `Plaža ${cityName}`,
      crowd, occupancy_pct, tourists: persons, recommendation,
      best_time: "07:00–09:00", yolo_cams: activeCams,
    },
    marina: {
      name: `Marina ${cityName}`,
      boats: boatLoad, free_moorings: freeMoorings,
      total_berths: cap.marinaBerths,
      status: freeMoorings > cap.marinaBerths * 0.5 ? "slobodno" : freeMoorings > cap.marinaBerths * 0.2 ? "umjereno" : "popunjeno",
    },
    parking: {
      name: `Parking ${cityName}`,
      free_spots: freeSpots, total_spots: cap.parkingTotal,
      status: freeSpots > cap.parkingTotal * 0.5 ? "slobodno" : freeSpots > cap.parkingTotal * 0.2 ? "umjereno" : "gotovo puno",
    },
    updated: yoloData.timestamp,
    source: "yolo",
    region: regionKey,
    note: `LIVE YOLO — ${yoloData.activeCams} senzora aktivno · zadnji update ${new Date(yoloData.timestamp).toLocaleTimeString("hr")}`,
  };
}

// ─── Time-based mock fallback ─────────────────────────────────
function getMockData(city, regionKey) {
  const hour = new Date().getHours();
  const cap  = REGION_CAPACITY[regionKey] || REGION_CAPACITY.split_makarska;
  const beachPct = hour < 8 ? 5 : hour < 10 ? 20 : hour < 13 ? 55 : hour < 17 ? 85 : hour < 19 ? 50 : 15;
  const beachCrowd = beachPct < 20 ? "mirno" : beachPct < 45 ? "malo gužve" : beachPct < 70 ? "srednje gužve" : "jako gužva";
  const boatLoad  = Math.round(cap.marinaBerths * (hour < 7 ? 0.05 : hour < 10 ? 0.25 : hour < 14 ? 0.6 : hour < 18 ? 0.8 : hour < 21 ? 0.5 : 0.15));
  const carLoad   = Math.round(cap.parkingTotal  * (beachPct / 100) * 0.8);
  const c = city || "Jadran";
  return {
    beach:   { name: `Plaža ${c}`, crowd: beachCrowd, occupancy_pct: beachPct, recommendation: beachPct < 30 ? "Idealno!" : beachPct < 60 ? "Ima mjesta" : beachPct < 80 ? "Gužva" : "Puno", best_time: "07:00–09:00" },
    marina:  { name: `Marina ${c}`, boats: boatLoad, free_moorings: cap.marinaBerths - boatLoad, total_berths: cap.marinaBerths, status: boatLoad < cap.marinaBerths * 0.5 ? "slobodno" : boatLoad < cap.marinaBerths * 0.8 ? "umjereno" : "popunjeno" },
    parking: { name: `Parking ${c}`, free_spots: cap.parkingTotal - carLoad, total_spots: cap.parkingTotal, status: carLoad < cap.parkingTotal * 0.5 ? "slobodno" : carLoad < cap.parkingTotal * 0.8 ? "umjereno" : "gotovo puno" },
    updated: new Date().toISOString(),
    source:  "sense",
  };
}

// ─── Windy webcam fetch for specific region ───────────────────
const _webcamCache = {};
const WEBCAM_TTL = 15 * 60 * 1000; // 15 min — webcams change infrequently

async function fetchRegionWebcams(regionKey) {
  if (_webcamCache[regionKey] && Date.now() - _webcamCache[regionKey].ts < WEBCAM_TTL) {
    return _webcamCache[regionKey].data;
  }
  const key = process.env.WINDY_WEBCAM_KEY;
  if (!key) return [];

  // GPS centre + radius per region
  const GEO = {
    kvarner:        { lat: 44.75, lng: 14.78, r: 40 }, // Rab island focus
    istra:          { lat: 45.08, lng: 13.64, r: 50 },
    zadar_sibenik:  { lat: 44.12, lng: 15.23, r: 50 },
    split_makarska: { lat: 43.51, lng: 16.44, r: 60 },
    dubrovnik:      { lat: 42.65, lng: 18.09, r: 40 },
  };
  const geo = GEO[regionKey] || GEO.split_makarska;
  try {
    const url = `https://api.windy.com/webcams/api/v3/webcams?nearby=${geo.lat},${geo.lng},${geo.r}&limit=20&include=player,images&lang=en`;
    const r = await fetch(url, {
      headers: { "x-windy-api-key": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const d = await r.json();
    const webcams = (d.webcams || [])
      .filter(w => w.status === "active")
      .map(w => ({
        id:      w.webcamId,
        title:   w.title || "",
        city:    w.location?.city || "",
        lat:     w.location?.latitude  ?? null,
        lng:     w.location?.longitude ?? null,
        preview: w.player?.day?.previewUrl || w.player?.live?.previewUrl || w.images?.current?.preview || null,
        url:     `https://www.windy.com/webcams/${w.webcamId}`,
      }));
    _webcamCache[regionKey] = { data: webcams, ts: Date.now() };
    return webcams;
  } catch (e) {
    console.warn("sense.js webcam fetch:", e.message);
    return [];
  }
}

// ─── Handler ──────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "GET only" });

  const city      = req.query?.city || "Jadran";
  const regionKey = cityToRegion(city);
  const cacheKey  = `${city}:${regionKey}`;

  if (CACHE.data && CACHE.key === cacheKey && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  // Fetch YOLO + weather + marine + webcams in parallel
  const [yoloResult, weatherResult, webcamResult] = await Promise.allSettled([
    fetchSenseData(),
    fetchWeatherMarine(regionKey),
    fetchRegionWebcams(regionKey),
  ]);

  const yoloData    = yoloResult.status    === "fulfilled" ? yoloResult.value    : null;
  const weatherData = weatherResult.status === "fulfilled" ? weatherResult.value : null;
  const webcamData  = webcamResult.status  === "fulfilled" ? webcamResult.value  : [];

  // Build crowd/marina/parking from YOLO or mock
  let data = yoloData ? yoloToBeachStatus(yoloData, city) : null;
  if (!data) data = getMockData(city, regionKey);

  // Attach weather + marine + webcam data
  data.weather  = weatherData || null;
  data.region   = regionKey;
  data.webcams  = webcamData;

  CACHE.data = data;
  CACHE.key  = cacheKey;
  CACHE.ts   = Date.now();
  return res.status(200).json(data);
}
