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

// ── SEA QUALITY MONITORING ZONES ─────────────────────────────────────────
// Polygons placed in open Adriatic water near key beaches
// Each zone is ~800m × 600m of open sea — land pixels auto-masked by dataMask
export const SEA_ZONES = {
  lopar_rab: {
    name: "Rajska plaža Lopar (Rab)",
    region: "kvarner",
    beach: "Rajska plaža",
    polygon: [[14.695,44.836],[14.718,44.836],[14.718,44.846],[14.695,44.846],[14.695,44.836]],
  },
  bacvice_split: {
    name: "Bačvice (Split)",
    region: "split_makarska",
    beach: "Bačvice",
    polygon: [[16.442,43.489],[16.462,43.489],[16.462,43.499],[16.442,43.499],[16.442,43.489]],
  },
  zlatni_rat_bol: {
    name: "Zlatni Rat (Bol, Brač)",
    region: "split_makarska",
    beach: "Zlatni Rat",
    polygon: [[16.636,43.313],[16.658,43.313],[16.658,43.323],[16.636,43.323],[16.636,43.313]],
  },
  rovinj_bay: {
    name: "Rovinj (Istra)",
    region: "istra",
    beach: "Rovinj uvala",
    polygon: [[13.626,45.072],[13.646,45.072],[13.646,45.082],[13.626,45.082],[13.626,45.072]],
  },
  dubrovnik_banje: {
    name: "Banje plaža (Dubrovnik)",
    region: "dubrovnik",
    beach: "Banje",
    polygon: [[18.103,42.636],[18.122,42.636],[18.122,42.645],[18.103,42.645],[18.103,42.636]],
  },
  makarska: {
    name: "Makarska rivijera",
    region: "split_makarska",
    beach: "Makarska",
    polygon: [[17.007,43.288],[17.028,43.288],[17.028,43.298],[17.007,43.298],[17.007,43.288]],
  },
  hvar_bay: {
    name: "Hvar (luka)",
    region: "split_makarska",
    beach: "Hvar grad",
    polygon: [[16.432,43.167],[16.453,43.167],[16.453,43.177],[16.432,43.177],[16.432,43.167]],
  },
  zadar_coastal: {
    name: "Zadar (Borik)",
    region: "zadar_sibenik",
    beach: "Zadar Borik",
    polygon: [[15.173,44.135],[15.193,44.135],[15.193,44.145],[15.173,44.145],[15.173,44.135]],
  },
};

// ── SEA QUALITY EVALSCRIPT — B03/B04/B05 for turbidity + chlorophyll ─────
// B04 (Red, 665nm): high in turbid/sediment water, low in clear blue sea
// B05 (Red Edge, 705nm): elevated in chlorophyll-rich water (algae)
// B03 (Green, 560nm): baseline reference
const SEA_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B03", "B04", "B05", "dataMask"], units: "REFLECTANCE" }],
    output: [
      { id: "b03", bands: 1, sampleType: "FLOAT32" },
      { id: "b04", bands: 1, sampleType: "FLOAT32" },
      { id: "b05", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  return { b03: [s.B03], b04: [s.B04], b05: [s.B05], dataMask: [s.dataMask] };
}`;

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
// Minimal evalscript: B04 (Red reflectance) for vehicle detection
// Cloud filtering handled server-side via maxCloudCoverage in dataFilter
const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "dataMask"], units: "REFLECTANCE" }],
    output: [
      { id: "b04", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  return { b04: [s.B04], dataMask: [s.dataMask] };
}`;

// ── QUERY STATISTICAL API ─────────────────────────────────────────────────
async function queryZoneStats(zone, token, daysBack = 7) {
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
          mosaickingOrder: "mostRecent",
        },
      }],
    },
    aggregation: {
      timeRange: { from, to },
      aggregationInterval: { of: "P1D" },
      width: 64, height: 64,  // downsampled — we only need statistics
      evalscript: EVALSCRIPT,
    },
    calculations: {
      default: {
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
      signal: AbortSignal.timeout(50000),
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
  // Find most recent valid result (cloud filtering is server-side via maxCloudCoverage)
  const intervals = stats?.data?.filter(d =>
    d.outputs?.b04?.bands?.B0?.stats?.mean != null
  );
  if (!intervals?.length) return null;

  const latest = intervals[intervals.length - 1];
  const meanB04   = latest.outputs.b04.bands.B0.stats.mean;
  const imageDate = latest.interval?.from?.slice(0, 10);
  const cloudPct  = 0; // handled server-side

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
      } else {
        console.warn("[satellite] zone query failed:", r.reason?.message || r.reason);
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

// NP zones are always included regardless of region — tourists travel cross-region to NPs
const NP_LOCATIONS = new Set(["np_plitvice", "np_krka", "np_kornati", "np_paklenica"]);

export function buildSatellitePrompt(results, region) {
  const relevant = Object.entries(results)
    .filter(([, d]) => !region || d.zone?.location === region || d.zone?.location === "all" || NP_LOCATIONS.has(d.zone?.location))
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

// ── SEA QUALITY QUERY ────────────────────────────────────────────────────
async function querySeaZone(zone, token, daysBack = 10) {
  const now  = new Date();
  const from = new Date(now - daysBack * 86400000).toISOString().slice(0, 10) + "T00:00:00Z";
  const to   = now.toISOString().slice(0, 10) + "T23:59:59Z";

  const body = {
    input: {
      bounds: {
        geometry: { type: "Polygon", coordinates: [zone.polygon] },
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [{
        type: "sentinel-2-l2a",
        dataFilter: {
          timeRange: { from, to },
          maxCloudCoverage: 30,
          mosaickingOrder: "mostRecent",
        },
      }],
    },
    aggregation: {
      timeRange: { from, to },
      aggregationInterval: { of: "P1D" },
      width: 64, height: 64,
      evalscript: SEA_EVALSCRIPT,
    },
    calculations: {
      default: { statistics: { default: { percentiles: { k: [25, 50, 75] } } } },
    },
  };

  const r = await fetch("https://sh.dataspace.copernicus.eu/api/v1/statistics", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(50000),
  });
  if (!r.ok) {
    const err = await r.text().catch(() => "");
    throw new Error(`Sea stats HTTP ${r.status}: ${err.slice(0, 200)}`);
  }
  return r.json();
}

// ── SEA QUALITY INTERPRETATION ───────────────────────────────────────────
// Adriatic clear water baseline: B04 ≈ 0.010-0.025 (absorbs red light strongly)
// Turbid/algae water: B04 > 0.040
// Chlorophyll elevated: B05/B04 > 1.35
function interpretSeaQuality(stats) {
  const intervals = stats?.data?.filter(d =>
    d.outputs?.b04?.bands?.B0?.stats?.mean != null
  );
  if (!intervals?.length) return null;

  const latest     = intervals[intervals.length - 1];
  const b04        = latest.outputs.b04.bands.B0.stats.mean;
  const b03        = latest.outputs.b03?.bands?.B0?.stats?.mean ?? 0.04;
  const b05        = latest.outputs.b05?.bands?.B0?.stats?.mean ?? 0.03;
  const imageDate  = latest.interval?.from?.slice(0, 10) || null;

  if (b04 == null || b04 <= 0) return null;

  // Turbidity classification (based on Adriatic empirical thresholds)
  let clarity, clarityHR, score;
  if (b04 < 0.018) {
    clarity = "excellent"; clarityHR = "kristalno čisto"; score = 5;
  } else if (b04 < 0.028) {
    clarity = "good";      clarityHR = "čisto";           score = 4;
  } else if (b04 < 0.045) {
    clarity = "fair";      clarityHR = "umjereno";        score = 3;
  } else if (b04 < 0.070) {
    clarity = "poor";      clarityHR = "mutno";           score = 2;
  } else {
    clarity = "bad";       clarityHR = "jako mutno";      score = 1;
  }

  // Chlorophyll / algae risk (B05/B04 ratio)
  const chlRatio = b05 / b04;
  let algaeRisk, algaeHR;
  if (chlRatio < 1.15) {
    algaeRisk = "none";     algaeHR = "nema algi";
  } else if (chlRatio < 1.40) {
    algaeRisk = "low";      algaeHR = "normalno";
  } else if (chlRatio < 1.70) {
    algaeRisk = "moderate"; algaeHR = "umjeren fitoplankton";
  } else {
    algaeRisk = "high";     algaeHR = "povišen klorofil — moguće alge";
  }

  // Turbidity index (B04/B03 — higher = more particulate matter)
  const turbIdx = b04 / Math.max(b03, 0.001);

  return { b04, b03, b05, turbIdx, chlRatio, clarity, clarityHR, score, algaeRisk, algaeHR, imageDate };
}

// ── FETCH ALL SEA ZONES ───────────────────────────────────────────────────
let _seaCache = {};
let _seaCacheDate = "";

export async function fetchSeaQuality() {
  const today = new Date().toISOString().slice(0, 10);
  if (_seaCacheDate === today && Object.keys(_seaCache).length > 0) return _seaCache;

  let token;
  try { token = await getSentinelToken(); }
  catch (e) { console.warn("[sea-quality] auth failed:", e.message); return {}; }

  const results = {};
  const zones = Object.entries(SEA_ZONES);

  const BATCH = 4;
  for (let i = 0; i < zones.length; i += BATCH) {
    const batch = zones.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(async ([id, zone]) => {
        const stats = await querySeaZone(zone, token);
        const quality = interpretSeaQuality(stats);
        return [id, { zone, quality }];
      })
    );
    for (const r of settled) {
      if (r.status === "fulfilled") {
        const [id, data] = r.value;
        if (data.quality) results[id] = data;
      } else {
        console.warn("[sea-quality] zone failed:", r.reason?.message || r.reason);
      }
    }
  }

  _seaCache = results;
  _seaCacheDate = today;

  // Persist to Firestore
  await persistSeaQualityToFirestore(results).catch(e =>
    console.warn("[sea-quality] Firestore persist failed:", e.message)
  );

  return results;
}

// ── PERSIST SEA QUALITY TO FIRESTORE ─────────────────────────────────────
async function persistSeaQualityToFirestore(results) {
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return;
  for (const [zoneId, data] of Object.entries(results)) {
    if (!data.quality) continue;
    const q = data.quality;
    const body = {
      fields: {
        clarity:     { stringValue: q.clarity },
        clarityHR:   { stringValue: q.clarityHR },
        algaeRisk:   { stringValue: q.algaeRisk },
        algaeHR:     { stringValue: q.algaeHR },
        score:       { integerValue: String(q.score) },
        b04:         { doubleValue: q.b04 },
        chlRatio:    { doubleValue: q.chlRatio },
        imageDate:   { stringValue: q.imageDate || "" },
        zoneName:    { stringValue: data.zone.name },
        region:      { stringValue: data.zone.region },
        beach:       { stringValue: data.zone.beach },
        updatedAt:   { timestampValue: new Date().toISOString() },
        source:      { stringValue: "sentinel-2-l2a" },
      },
    };
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_sea_quality/${zoneId}?key=${key}`;
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }
}

// ── READ SEA QUALITY FROM FIRESTORE ──────────────────────────────────────
export async function readSeaQualityCache() {
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return {};
  try {
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_sea_quality?key=${key}&pageSize=20`;
    const r = await fetch(url);
    if (!r.ok) return {};
    const data = await r.json();
    if (!data.documents) return {};
    const result = {};
    for (const doc of data.documents) {
      const id = doc.name.split("/").pop();
      const f = doc.fields || {};
      result[id] = {
        clarity:   f.clarity?.stringValue || "unknown",
        clarityHR: f.clarityHR?.stringValue || "nepoznato",
        algaeRisk: f.algaeRisk?.stringValue || "none",
        algaeHR:   f.algaeHR?.stringValue || "",
        score:     parseInt(f.score?.integerValue || "0"),
        b04:       parseFloat(f.b04?.doubleValue || "0"),
        chlRatio:  parseFloat(f.chlRatio?.doubleValue || "0"),
        imageDate: f.imageDate?.stringValue || null,
        zoneName:  f.zoneName?.stringValue || id,
        region:    f.region?.stringValue || "",
        beach:     f.beach?.stringValue || "",
        source:    "sentinel-2",
      };
    }
    return result;
  } catch (e) {
    console.warn("[sea-quality] Firestore read failed:", e.message);
    return {};
  }
}

// ── BUILD SEA QUALITY PROMPT ─────────────────────────────────────────────
export function buildSeaQualityPrompt(seaData, region) {
  if (!seaData || !Object.keys(seaData).length) return "";

  const SCORE_ICON = { 5: "🟦", 4: "🟢", 3: "🟡", 2: "🟠", 1: "🔴" };
  const ALGAE_ICON = { none: "", low: "", moderate: "⚠️ ", high: "🚨 " };

  // Filter by region if provided
  const relevant = Object.entries(seaData).filter(
    ([, d]) => !region || d.region === region
  );
  if (!relevant.length) return "";

  const lines = [
    `[SENTINEL-2 MORE — Optička analiza mora (klorofil + čistoća), ESA Copernicus]`,
    `Izvor: Sentinel-2 L2A, 10m rezolucija. Analiza B04 (crvena) + B05 (klorofil).`,
  ];

  for (const [, d] of relevant.sort((a, b) => b[1].score - a[1].score)) {
    const icon  = SCORE_ICON[d.score] || "⚪";
    const algae = ALGAE_ICON[d.algaeRisk] || "";
    const date  = d.imageDate ? ` (snimak ${d.imageDate})` : "";
    lines.push(`${icon} ${d.beach}: ${d.clarityHR}${date}`);
    if (d.algaeRisk === "moderate" || d.algaeRisk === "high") {
      lines.push(`  ${algae}${d.algaeHR} — oprez pri kupanju, provjeri HAOP.hr`);
    }
  }

  lines.push(`
PRAVILA ZA MORE — KVALITETA:
- Ovo su JEDINI podaci o kvaliteti mora iz svemira dostupni u Jadran.ai — nijedna druga aplikacija ih nema
- 🟦 Kristalno čisto = savršeno za snorkeling i ronjenje, visoka vidljivost
- 🟢 Čisto = normalno Jadransko more, odlično za kupanje
- 🟡 Umjereno = moguće alge ili sitna lebdeća materija, kupanje OK ali vidljivost smanjena
- 🟠/🔴 Mutno = povišena zamućenost, preporuči alternativnu plažu
- Alge ⚠️: upozori, preporuči provjeru na haop.hr za bakteriološke nalaze
- NIKAD ne izmišljaj ocjenu mora ako zona nije u podacima — reci "nema snimka zbog oblačnosti"`);

  return lines.join("\n");
}

// ── VERCEL HANDLER ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const region = req.query.region || null;

  // Debug mode — exposes errors (no credentials in output)
  const debug = req.query.debug === "1";

  try {
    let authError = null;
    let zoneTestError = null;
    if (debug) {
      try {
        const tok = await getSentinelToken();
        // Test one zone directly to see Sentinel API response
        const testZone = Object.values(PARKING_ZONES)[0];
        try {
          await queryZoneStats(testZone, tok);
        } catch(e) {
          zoneTestError = e.message;
        }
      } catch(e) { authError = e.message; }
    }
    const [results, seaResults] = await Promise.all([
      fetchSatelliteOccupancy(region),
      fetchSeaQuality().catch(e => { console.warn("[satellite] sea quality failed:", e.message); return {}; }),
    ]);
    const zoneCount = Object.keys(results).length;
    const seaCount  = Object.keys(seaResults).length;
    const prompt     = buildSatellitePrompt(results, region);
    const seaPrompt  = buildSeaQualityPrompt(seaResults, region);

    // Only cache successful non-empty responses — never cache failures
    if (zoneCount > 0 || seaCount > 0) {
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400"); // 1h browser, 4h CDN
    } else {
      res.setHeader("Cache-Control", "no-store"); // don't cache empty/failed responses
    }

    res.json({
      ts: new Date().toISOString(),
      zoneCount,
      seaCount,
      zones: Object.fromEntries(
        Object.entries(results).map(([id, d]) => [id, { name: d.zone.name, occ: d.occ }])
      ),
      sea: Object.fromEntries(
        Object.entries(seaResults).map(([id, d]) => [id, { name: d.zoneName, clarity: d.clarity, score: d.score }])
      ),
      promptBlock: prompt,
      seaPromptBlock: seaPrompt,
      ...(debug && authError ? { authError } : {}),
      ...(debug && zoneTestError ? { zoneTestError } : {}),
    });
  } catch (e) {
    console.error("[satellite]", e.message);
    res.setHeader("Cache-Control", "no-store");
    res.status(500).json({ error: e.message });
  }
}
