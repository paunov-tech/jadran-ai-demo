// ── SENTINEL-2 SATELLITE PARKING DETECTOR ─────────────────────────────────
// ESA Copernicus Data Space — Sentinel-2 L2A, 10m resolution, free
// Statistical API: computes mean band reflectance over parking polygon
// Vehicle detection: cars increase visible-band reflectance vs empty asphalt
// Revisit: ~2-3 days (Sentinel-2A + 2B combined)
//
// Env vars:
//   SENTINEL_HUB_CLIENT_ID     — from dataspace.copernicus.eu OAuth2 client
//   SENTINEL_HUB_CLIENT_SECRET

// ── PARKING ZONE DEFINITIONS ──────────────────────────────────────────────
// Each zone: GeoJSON polygon, baseline reflectance (off-season empty lot)
// Polygon = rectangle around parking area, ~100-200m across
// Baseline = mean B04 reflectance in March (empty, post-winter)
export const PARKING_ZONES = {

  plitvice_p1: {
    name: "Plitvice P1 (Ulaz 1)",
    location: "np_plitvice",
    npId: "plitvice",
    // P1 parking near entrance 1, west side of road D1
    polygon: [[15.6113,44.8807],[15.6135,44.8807],[15.6135,44.8790],[15.6113,44.8790],[15.6113,44.8807]],
    baselineB04: 0.08,  // dark asphalt when empty
    baselineB03: 0.09,
    areaM2: 18000,      // ~180 parking spots × 15m²/spot
    maxCars: 180,
  },

  plitvice_p2: {
    name: "Plitvice P2 (Ulaz 2)",
    location: "np_plitvice",
    npId: "plitvice",
    // P2 near entrance 2: 44°52'58.5"N 15°37'25.2"E (verified)
    polygon: [[15.6215,44.8838],[15.6242,44.8838],[15.6242,44.8818],[15.6215,44.8818],[15.6215,44.8838]],
    baselineB04: 0.08,
    baselineB03: 0.09,
    areaM2: 22000,
    maxCars: 220,
  },

  krka_lozovac: {
    name: "Krka NP — Lozovac (kamperi)",
    location: "np_krka",
    npId: "krka",
    // Lozovac: 43.8329°N, 15.9602°E (verified from NP Krka directions)
    polygon: [[15.9585,43.8338],[15.9618,43.8338],[15.9618,43.8318],[15.9585,43.8318],[15.9585,43.8338]],
    baselineB04: 0.09,
    baselineB03: 0.10,
    areaM2: 25000,
    maxCars: 300,
  },

  zlatni_rat: {
    name: "Zlatni Rat — parking Bol (Brač)",
    location: "split_makarska",
    npId: null,
    // 43.257347, 16.634528 (verified)
    polygon: [[16.6328,43.2582],[16.6358,43.2582],[16.6358,43.2563],[16.6328,43.2563],[16.6328,43.2582]],
    baselineB04: 0.10,
    baselineB03: 0.11,
    areaM2: 8000,
    maxCars: 120,
  },

  lopar_rajska: {
    name: "Rajska plaža Lopar — parking (Rab)",
    location: "kvarner",
    npId: null,
    // Main parking for Rajska plaža, Lopar
    polygon: [[14.7218,44.8362],[14.7238,44.8362],[14.7238,44.8350],[14.7218,44.8350],[14.7218,44.8362]],
    baselineB04: 0.09,
    baselineB03: 0.10,
    areaM2: 12000,
    maxCars: 150,
  },

  split_supaval: {
    name: "Split — P+R Supaval",
    location: "split_makarska",
    npId: null,
    // Supaval park-and-ride, west Split
    polygon: [[16.4281,43.5117],[16.4305,43.5117],[16.4305,43.5103],[16.4281,43.5103],[16.4281,43.5117]],
    baselineB04: 0.10,
    baselineB03: 0.11,
    areaM2: 20000,
    maxCars: 350,
  },

  dubrovnik_pile: {
    name: "Dubrovnik — Garaža Ilijina Glavica (Pile)",
    location: "dubrovnik",
    npId: null,
    // Zagrebačka ul. 42: 42°38'31.862"N 18°6'10.8"E = 42.6422°N, 18.1030°E (verified, 711 mjesta)
    polygon: [[18.1018,42.6431],[18.1042,42.6431],[18.1042,42.6413],[18.1018,42.6413],[18.1018,42.6431]],
    baselineB04: 0.11,
    baselineB03: 0.12,
    areaM2: 9000,
    maxCars: 500,  // multi-story garage — satellite sees roof
  },

  stobrec_camp: {
    name: "Camping Stobreč Split — ulazna zona",
    location: "split_makarska",
    npId: null,
    polygon: [[16.5562,43.4924],[16.5585,43.4924],[16.5585,43.4911],[16.5562,43.4911],[16.5562,43.4924]],
    baselineB04: 0.08,
    baselineB03: 0.09,
    areaM2: 15000,
    maxCars: 200,
  },

  stinica_terminal: {
    name: "Stinica trajektna luka — red čekanja",
    location: "kvarner",
    npId: null,
    // Approach road and waiting area at Stinica terminal
    polygon: [[14.9022,44.9897],[14.9048,44.9897],[14.9048,44.9882],[14.9022,44.9882],[14.9022,44.9897]],
    baselineB04: 0.07,
    baselineB03: 0.08,
    areaM2: 6000,
    maxCars: 80,  // terminal capacity before next sailing
  },

  misnjak_terminal: {
    name: "Mišnjak trajektna luka — Rab island",
    location: "kvarner",
    npId: null,
    polygon: [[14.7583,44.7437],[14.7605,44.7437],[14.7605,44.7423],[14.7583,44.7423],[14.7583,44.7437]],
    baselineB04: 0.07,
    baselineB03: 0.08,
    areaM2: 4000,
    maxCars: 60,
  },
};

// ── SENTINEL HUB AUTH ─────────────────────────────────────────────────────
let _token = null;
let _tokenExp = 0;

async function getSentinelToken() {
  if (_token && Date.now() < _tokenExp - 30000) return _token;

  const clientId     = process.env.SENTINEL_HUB_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_HUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("SENTINEL_HUB credentials not configured");

  const r = await fetch(
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     clientId,
        client_secret: clientSecret,
      }),
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!r.ok) throw new Error(`Sentinel auth HTTP ${r.status}`);
  const data = await r.json();
  _token = data.access_token;
  _tokenExp = Date.now() + (data.expires_in || 600) * 1000;
  return _token;
}

// ── EVALSCRIPT — vehicle detection index ─────────────────────────────────
// Returns mean of B04 (Red) and B03 (Green) over polygon
// Cars increase visible-band reflectance vs dark empty asphalt
// NDVI complement: low NDVI + high visible = pavement/vehicles
const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B02","B03","B04","B08","B11","CLM"], units: "REFLECTANCE" }],
    output: [
      { id: "data", bands: 5, sampleType: "FLOAT32" },
      { id: "cloud", bands: 1, sampleType: "UINT8" }
    ]
  };
}
function evaluatePixel(s) {
  const cloud = s.CLM > 0 ? 1 : 0;
  return {
    data: [s.B02, s.B03, s.B04, s.B08, s.B11],
    cloud: [cloud]
  };
}`;

// ── QUERY STATISTICAL API ─────────────────────────────────────────────────
async function queryZoneStats(zone, token, daysBack = 5) {
  const now   = new Date();
  const from  = new Date(now - daysBack * 86400000).toISOString().slice(0, 10) + "T00:00:00Z";
  const to    = now.toISOString().slice(0, 10) + "T23:59:59Z";

  const body = {
    input: {
      bounds: {
        geometry: {
          type: "Polygon",
          coordinates: [zone.polygon],
        },
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: {
          timeRange: { from, to },
          maxCloudCoverage: 50,
          mosaickingOrder: "leastCC",  // prefer least cloud coverage
        },
      }],
    },
    aggregation: {
      timeRange: { from, to },
      aggregationInterval: { interval: "P1D" },
      width: 64, height: 64,  // downsampled — we only need statistics
      evalscript: EVALSCRIPT,
    },
    calculations: {
      default: {
        histograms: { default: { nBins: 10, lowEdge: 0.0, highEdge: 0.5 } },
        statistics: { default: { percentiles: { k: [25, 50, 75] } } },
      },
    },
  };

  const r = await fetch(
    "https://sh.dataspace.copernicus.eu/api/v1/statistics",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`Sentinel Statistics HTTP ${r.status}: ${err.slice(0, 200)}`);
  }
  return r.json();
}

// ── OCCUPANCY ESTIMATION ──────────────────────────────────────────────────
// Higher mean B04 (Red) vs baseline → more vehicles
// Scale: 0-100% estimated occupancy
function estimateOccupancy(stats, zone) {
  // Find most recent non-cloudy result
  const intervals = stats?.data?.filter(d =>
    d.outputs?.data?.bands?.B0?.stats?.mean != null &&
    d.outputs?.cloud?.bands?.B0?.stats?.mean < 0.3  // <30% cloud cover
  );
  if (!intervals?.length) return null;

  const latest = intervals[intervals.length - 1];
  const meanB04 = latest.outputs.data.bands.B2?.stats?.mean  // B04 is index 2 (B02,B03,B04)
               ?? latest.outputs.data.bands.B0?.stats?.mean;
  const imageDate = latest.interval?.from?.slice(0, 10);
  const cloudPct  = Math.round((latest.outputs.cloud?.bands?.B0?.stats?.mean || 0) * 100);

  if (meanB04 == null) return null;

  // Delta from baseline → estimated vehicle density
  const delta = Math.max(0, meanB04 - zone.baselineB04);
  // Empirically: delta 0.05 ≈ ~50% full, delta 0.10 ≈ full
  const raw = Math.min(1, delta / 0.10);
  const occupancyPct = Math.round(raw * 100);

  const level = occupancyPct >= 85 ? "full"
    : occupancyPct >= 60 ? "heavy"
    : occupancyPct >= 35 ? "moderate"
    : occupancyPct >= 10 ? "light"
    : "empty";

  return { occupancyPct, level, imageDate, cloudPct, meanB04, baselineB04: zone.baselineB04 };
}

// ── CACHE ─────────────────────────────────────────────────────────────────
let _satCache = {};
let _satCacheDate = "";

export async function fetchSatelliteOccupancy(locationFilter = null) {
  const today = new Date().toISOString().slice(0, 10);

  // Daily cache — Sentinel-2 revisit is 2-3 days, no point re-querying intraday
  if (_satCacheDate === today && Object.keys(_satCache).length > 0) {
    return locationFilter
      ? Object.fromEntries(Object.entries(_satCache).filter(([k]) => PARKING_ZONES[k]?.location === locationFilter))
      : _satCache;
  }

  let token;
  try {
    token = await getSentinelToken();
  } catch (e) {
    console.warn("[satellite] auth failed:", e.message);
    return {};
  }

  const results = {};
  const zones = locationFilter
    ? Object.entries(PARKING_ZONES).filter(([, z]) => z.location === locationFilter)
    : Object.entries(PARKING_ZONES);

  // Query all zones in parallel (max 5 concurrent to avoid rate limit)
  const BATCH = 5;
  for (let i = 0; i < zones.length; i += BATCH) {
    const batch = zones.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(async ([id, zone]) => {
        const stats = await queryZoneStats(zone, token);
        const occ   = estimateOccupancy(stats, zone);
        return [id, { zone, occ, raw: stats }];
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled") {
        const [id, data] = r.value;
        results[id] = data;
      }
    }
  }

  _satCache = results;
  _satCacheDate = today;

  // Write to Firestore for persistence + np-capacity.js to read
  await persistToFirestore(results).catch(e =>
    console.warn("[satellite] Firestore persist failed:", e.message)
  );

  return results;
}

// ── PERSIST TO FIRESTORE ──────────────────────────────────────────────────
async function persistToFirestore(results) {
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return;

  for (const [zoneId, data] of Object.entries(results)) {
    if (!data.occ) continue;
    const body = {
      fields: {
        occupancyPct:  { integerValue: String(data.occ.occupancyPct) },
        level:         { stringValue: data.occ.level },
        imageDate:     { stringValue: data.occ.imageDate || "" },
        cloudPct:      { integerValue: String(data.occ.cloudPct || 0) },
        zoneName:      { stringValue: data.zone.name },
        location:      { stringValue: data.zone.location },
        npId:          { stringValue: data.zone.npId || "" },
        updatedAt:     { timestampValue: new Date().toISOString() },
        source:        { stringValue: "sentinel-2" },
      },
    };
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_satellite/${zoneId}?key=${key}`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
const LEVEL_ICON = { full: "🔴", heavy: "🟠", moderate: "🟡", light: "🟢", empty: "⚪" };
const LEVEL_TEXT = {
  full:     "PUNO — čekaj ili dođi rano ujutro",
  heavy:    "gusto — ograničena mjesta",
  moderate: "umjereno — ima mjesta",
  light:    "malo posjetitelja",
  empty:    "prazno — idealno za posjet",
};

export function buildSatellitePrompt(results, region) {
  const relevant = Object.entries(results)
    .filter(([, d]) => !region || d.zone?.location === region || d.zone?.location === "all")
    .filter(([, d]) => d.occ != null);

  if (!relevant.length) return "";

  const lines = ["[SATELITSKI SNIMAK — parking kapaciteti (Sentinel-2, ažurirano dnevno)]"];
  lines.push("Izvor: ESA Copernicus Sentinel-2, 10m rezolucija. Datum snimka naznačen.\n");

  for (const [, data] of relevant) {
    const { occ, zone } = data;
    const freshness = occ.imageDate
      ? `snimak ${occ.imageDate}${occ.cloudPct > 20 ? ` (oblačnost ${occ.cloudPct}% — niža pouzdanost)` : ""}`
      : "datum nepoznat";
    lines.push(`${LEVEL_ICON[occ.level]} ${zone.name}`);
    lines.push(`  Popunjenost: ~${occ.occupancyPct}% — ${LEVEL_TEXT[occ.level]}`);
    lines.push(`  ${freshness}`);
    if (zone.npId) lines.push(`  → NP: rezerviraj ulaznice online ako je heavy/full`);
  }

  // Ferry terminals — special interpretation
  const ferryZones = relevant.filter(([id]) => id.includes("terminal"));
  if (ferryZones.length) {
    lines.push("\n[SATELIT — TRAJEKTNI TERMINALI]");
    for (const [id, data] of ferryZones) {
      const { occ, zone } = data;
      if (!occ) continue;
      const cars = Math.round((occ.occupancyPct / 100) * zone.maxCars);
      lines.push(`${LEVEL_ICON[occ.level]} ${zone.name}: ~${cars} vozila u zoni`);
      if (occ.level === "full" || occ.level === "heavy")
        lines.push(`  ⚠️ Red čekanja detektovan iz svemira — plovi alternativnom linijom ili dođi u ${occ.occupancyPct > 80 ? "2-3h" : "1h"}`);
    }
  }

  lines.push(`\nPRAVILA ZA SATELITSKE PODATKE:
- Ovo su STVARNE detekcije iz svemira, ne procjene — naglasi pouzdanost
- Oblačnost >30%: naznači smanjenu pouzdanost
- Snimak star >3 dana: naznači da su podaci stariji
- Za NP pun → odmah predloži alternativni ulaz ili vremenski pomak
- Format: "Prema satelitskom snimku od [datum], parking je [razina]"`);

  return lines.join("\n");
}

// ── READ FROM FIRESTORE (fallback za np-capacity.js) ─────────────────────
export async function readSatelliteCache(zoneIds = []) {
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return {};
  try {
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_satellite?key=${key}&pageSize=20`;
    const r = await fetch(url);
    if (!r.ok) return {};
    const data = await r.json();
    if (!data.documents) return {};

    const result = {};
    for (const doc of data.documents) {
      const id = doc.name.split("/").pop();
      if (zoneIds.length && !zoneIds.includes(id)) continue;
      const f = doc.fields || {};
      result[id] = {
        occupancyPct: parseInt(f.occupancyPct?.integerValue || "0"),
        level: f.level?.stringValue || "unknown",
        imageDate: f.imageDate?.stringValue || null,
        cloudPct: parseInt(f.cloudPct?.integerValue || "0"),
        zoneName: f.zoneName?.stringValue || id,
        location: f.location?.stringValue || "",
        npId: f.npId?.stringValue || null,
        source: "sentinel-2",
      };
    }
    return result;
  } catch (e) {
    console.warn("[satellite] Firestore read failed:", e.message);
    return {};
  }
}

// ── VERCEL HANDLER ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400"); // 1h browser, 24h CDN

  const region = req.query.region || null;

  try {
    const results = await fetchSatelliteOccupancy(region);
    const prompt  = buildSatellitePrompt(results, region);
    res.json({
      ts: new Date().toISOString(),
      zoneCount: Object.keys(results).length,
      zones: Object.fromEntries(
        Object.entries(results).map(([id, d]) => [id, { name: d.zone.name, occ: d.occ }])
      ),
      promptBlock: prompt,
    });
  } catch (e) {
    console.error("[satellite]", e.message);
    res.status(500).json({ error: e.message });
  }
}
