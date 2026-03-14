// api/alerts.js — Emergency Alert Aggregator
// Sources: NASA FIRMS (fires), MeteoAlarm/DHMZ (weather), manual critical alerts
// Cached: 10 min (fires update every 3h from satellite, weather every 6h)

const CACHE = { data: null, ts: 0 };
const CACHE_TTL = 600000; // 10 min

// Croatia bounding box (approximate)
const HR_BOUNDS = { minLat: 42.3, maxLat: 46.6, minLon: 13.2, maxLon: 19.5 };

// Region mapping — assign fire/alert to nearest region
const REGION_CENTERS = {
  istra:    { lat: 45.1, lon: 13.9 },
  kvarner:  { lat: 45.0, lon: 14.5 },
  zadar:    { lat: 44.1, lon: 15.3 },
  split:    { lat: 43.5, lon: 16.5 },
  makarska: { lat: 43.3, lon: 17.0 },
  dubrovnik:{ lat: 42.65, lon: 18.1 },
};

function nearestRegion(lat, lon) {
  let best = "split", bestDist = Infinity;
  for (const [id, c] of Object.entries(REGION_CENTERS)) {
    const d = Math.sqrt((lat - c.lat) ** 2 + (lon - c.lon) ** 2);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

// NASA FIRMS — free API, no key needed for country CSV
async function fetchFires() {
  try {
    // VIIRS active fires for Croatia, last 24h
    const url = "https://firms.modaps.eosdis.nasa.gov/api/country/csv/OPEN_KEY/VIIRS_SNPP_NRT/HRV/1";
    const res = await fetch(url, { headers: { "User-Agent": "JadranAI/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].split(",");
    const latIdx = header.indexOf("latitude");
    const lonIdx = header.indexOf("longitude");
    const brIdx = header.indexOf("bright_ti4");
    const confIdx = header.indexOf("confidence");
    const dateIdx = header.indexOf("acq_date");
    const timeIdx = header.indexOf("acq_time");

    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);
      const brightness = parseFloat(cols[brIdx] || "0");
      const confidence = cols[confIdx] || "nominal";
      const date = cols[dateIdx] || "";
      const time = cols[timeIdx] || "";

      // Only high-confidence fires
      if (confidence === "low") continue;
      if (lat < HR_BOUNDS.minLat || lat > HR_BOUNDS.maxLat) continue;
      if (lon < HR_BOUNDS.minLon || lon > HR_BOUNDS.maxLon) continue;

      fires.push({
        type: "fire",
        severity: brightness > 350 ? "critical" : brightness > 320 ? "high" : "medium",
        lat, lon,
        region: nearestRegion(lat, lon),
        brightness: Math.round(brightness),
        confidence,
        time: `${date} ${time}`,
      });
    }
    return fires;
  } catch (err) {
    console.error("[ALERTS] FIRMS error:", err.message);
    return [];
  }
}

// MeteoAlarm — RSS/Atom feed (official, reliable)
async function fetchWeatherAlerts() {
  try {
    const url = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia";
    const res = await fetch(url, { 
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "application/atom+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const alerts = [];
    const entries = xml.split("<entry>").slice(1);
    
    for (const entry of entries) {
      const title = (entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const summary = (entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
      const updated = entry.match(/<updated>(.*?)<\/updated>/)?.[1] || "";
      
      // Extract severity color
      let severity = "low";
      const content = title + " " + summary;
      if (/red|crveno|4;/i.test(content)) severity = "critical";
      else if (/orange|narančasto|3;/i.test(content)) severity = "high";
      else if (/yellow|žuto|2;/i.test(content)) severity = "medium";
      else continue; // skip green/no warning
      
      // Extract alert type
      let alertType = "weather";
      if (/wind|vjetar|bura|bora/i.test(content)) alertType = "wind";
      else if (/fire|požar|forest/i.test(content)) alertType = "fire";
      else if (/rain|kiša|oborin/i.test(content)) alertType = "rain";
      else if (/thunder|storm|grmljavin|oluj/i.test(content)) alertType = "storm";
      else if (/heat|toplins|vrućin/i.test(content)) alertType = "heat";
      else if (/snow|snijeg/i.test(content)) alertType = "snow";
      else if (/flood|poplav/i.test(content)) alertType = "flood";
      else if (/fog|magl/i.test(content)) alertType = "fog";
      else if (/coast|wave|val/i.test(content)) alertType = "coastal";
      
      // Match to Adriatic region
      let region = "";
      for (const [id, c] of Object.entries(REGION_CENTERS)) {
        const regionNames = {
          istra: ["istra", "istria", "pula"],
          kvarner: ["kvarner", "rijeka", "cres", "lošinj"],
          zadar: ["zadar", "šibenik", "sibenik"],
          split: ["split", "trogir", "hvar", "brač"],
          makarska: ["makarska", "biokovo", "omiš"],
          dubrovnik: ["dubrovnik", "korčula", "pelješac"],
        };
        if (regionNames[id]?.some(n => content.toLowerCase().includes(n))) {
          region = id;
          break;
        }
      }
      
      alerts.push({
        type: alertType,
        severity,
        region,
        title: title.slice(0, 200),
        description: summary.slice(0, 500),
        source: "MeteoAlarm",
        time: updated,
      });
    }
    return alerts;
  } catch (err) {
    console.error("[ALERTS] MeteoAlarm error:", err.message);
    return [];
  }
}

// Aggregate all sources
async function aggregateAlerts() {
  const [fires, weather] = await Promise.all([
    fetchFires(),
    fetchWeatherAlerts(),
  ]);

  // Deduplicate fires by proximity (cluster within 0.05 degrees ≈ 5km)
  const clustered = [];
  for (const fire of fires) {
    const existing = clustered.find(f =>
      Math.abs(f.lat - fire.lat) < 0.05 && Math.abs(f.lon - fire.lon) < 0.05
    );
    if (existing) {
      if (fire.brightness > existing.brightness) {
        existing.brightness = fire.brightness;
        existing.severity = fire.severity;
      }
      existing.count = (existing.count || 1) + 1;
    } else {
      clustered.push({ ...fire, count: 1 });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  const all = [...clustered, ...weather].sort((a, b) =>
    (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  );

  return {
    fires: clustered.length,
    weather: weather.length,
    total: all.length,
    alerts: all.slice(0, 10), // Max 10 alerts
    updated: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin === "https://jadran.ai" ? "https://jadran.ai" : req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Check cache
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json(CACHE.data);
  }

  try {
    const data = await aggregateAlerts();
    CACHE.data = data;
    CACHE.ts = Date.now();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[ALERTS] Aggregation error:", err.message);
    return res.status(500).json({ error: err.message, fires: 0, weather: 0, total: 0, alerts: [] });
  }
}
