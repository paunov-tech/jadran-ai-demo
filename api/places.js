// api/places.js — Google Places Nearby Search for Jadran.ai Kiosk
// GET /api/places?lat=44.7561&lng=14.7642&type=restaurant&radius=3000
// Caches results in Firestore (24h TTL) to stay within 5000 free calls/month
//
// Required env vars:
//   GOOGLE_PLACES_KEY  — Places API (New) key from molty-portal project
//   FIREBASE_API_KEY   — Firestore REST auth

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const FB_KEY = process.env.FIREBASE_API_KEY;
const PROJECT_ID = "molty-portal";
const CACHE_TTL_MS = 86400000; // 24 hours
const CORS = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

// ── Firestore REST helpers ──────────────────────────────────────────────────
function fsDocUrl(docPath) {
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${FB_KEY}`;
}

async function fsRead(docPath) {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(fsDocUrl(docPath));
    if (!r.ok) return null;
    const doc = await r.json();
    if (!doc.fields) return null;
    const out = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      if ("stringValue" in v) out[k] = v.stringValue;
      else if ("integerValue" in v) out[k] = Number(v.integerValue);
      else if ("booleanValue" in v) out[k] = v.booleanValue;
      else if ("doubleValue" in v) out[k] = v.doubleValue;
    }
    return out;
  } catch { return null; }
}

async function fsWrite(docPath, fields) {
  if (!FB_KEY) return;
  try {
    const body = { fields: {} };
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "number") body.fields[k] = { doubleValue: v };
      else if (typeof v === "boolean") body.fields[k] = { booleanValue: v };
      else body.fields[k] = { stringValue: String(v) };
    }
    await fetch(fsDocUrl(docPath), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch { /* cache write failure is non-fatal */ }
}

// ── CORS headers ────────────────────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = CORS.includes(origin) ? origin : CORS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=3600",
  };
}

// ── Format a Places API result ───────────────────────────────────────────────
function formatPlace(p, apiKey) {
  return {
    name: p.name,
    rating: p.rating || null,
    reviews: p.user_ratings_total || 0,
    address: p.vicinity || "",
    lat: p.geometry.location.lat,
    lng: p.geometry.location.lng,
    photo: p.photos?.[0]?.photo_reference
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photos[0].photo_reference}&key=${apiKey}`
      : null,
    open_now: p.opening_hours?.open_now ?? null,
    place_id: p.place_id,
    price_level: p.price_level ?? null,
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (!PLACES_KEY) {
    res.writeHead(503, { ...headers, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "GOOGLE_PLACES_KEY not configured", places: [] }));
    return;
  }

  const { lat = "44.7561", lng = "14.7642", type = "restaurant", radius = "3000" } = req.query || {};

  // Validate params
  const latN = parseFloat(lat), lngN = parseFloat(lng), radN = Math.min(parseInt(radius, 10) || 3000, 50000);
  if (isNaN(latN) || isNaN(lngN)) {
    res.writeHead(400, { ...headers, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid lat/lng", places: [] }));
    return;
  }

  // Firestore cache key (grid-snapped to ~500m cells)
  const cLat = Math.round(latN * 200) / 200;
  const cLng = Math.round(lngN * 200) / 200;
  const cacheKey = `places_cache/${type}_${cLat}_${cLng}_${radN}`;

  // Check cache
  const cached = await fsRead(cacheKey);
  if (cached?.json && Date.now() - Number(cached.ts || 0) < CACHE_TTL_MS) {
    try {
      const data = JSON.parse(cached.json);
      res.writeHead(200, { ...headers, "Content-Type": "application/json", "X-Cache": "HIT" });
      res.end(JSON.stringify(data));
      return;
    } catch { /* fall through to fresh fetch */ }
  }

  // Fetch from Google Places API (legacy Nearby Search — still free tier compatible)
  let url;
  if (type === "beach") {
    // Google Places has no "beach" type — use Text Search instead
    url = `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
      `query=beach&location=${latN},${lngN}&radius=${radN}&key=${PLACES_KEY}&language=en`;
  } else {
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${latN},${lngN}&radius=${radN}&type=${encodeURIComponent(type)}&key=${PLACES_KEY}&language=en&rankby=prominence`;
  }

  let places = [];
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[places] Google API error:", data.status, data.error_message);
    }
    places = (data.results || [])
      .filter(p => !p.rating || p.rating >= 3.5) // include unrated + rated 3.5+
      .slice(0, 12)
      .map(p => formatPlace(p, PLACES_KEY));
  } catch (e) {
    console.error("[places] fetch error:", e);
  }

  const result = { places, count: places.length, type, lat: latN, lng: lngN };

  // Write to cache (non-blocking)
  fsWrite(cacheKey, { json: JSON.stringify(result), ts: Date.now() });

  res.writeHead(200, { ...headers, "Content-Type": "application/json", "X-Cache": "MISS" });
  res.end(JSON.stringify(result));
}
