// api/nearby.js — JADRAN.AI Location-Aware Nearby Search
// Uses HERE Browse + Reverse Geocode for dynamic Kiosk content
// GET /api/nearby?lat=43.30&lng=17.02&cats=parking,food&limit=5&lang=hr

const HERE_KEY = process.env.HERE_API_KEY;
const CORS = ["https://jadran.ai", "https://monte-negro.ai"];

// Rate limiting — max 60 nearby calls per IP per hour
const _nearbyRL = new Map();
function nearbyRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _nearbyRL) { if (now > v.r) _nearbyRL.delete(k); }
  const e = _nearbyRL.get(ip);
  if (!e || now > e.r) { _nearbyRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 60) return false;
  e.c++; return true;
}

// Response cache — same location within 5 min gets cached result
let NEARBY_CACHE = new Map();
const NEARBY_CACHE_TTL = 300000;

// HERE Browse category IDs
// https://developer.here.com/documentation/geocoding-search-api/dev_guide/topics/places-category-system.html
const CAT_MAP = {
  parking:    "600-6300,600-6400",           // parking lot + parking garage
  food:       "100-1000,100-1100",           // restaurant + café/bar
  shop:       "600-6900-0247,600-6900-0248", // supermarket + grocery
  beach:      "550-5510",                    // beach
  pharmacy:   "600-6200",                    // pharmacy
  atm:        "700-7010",                    // ATM
  fuel:       "700-7600",                    // petrol/gas station
  hospital:   "800-8000",                    // hospital/clinic
  police:     "800-8100",                    // police
  bakery:     "100-1100-0244",               // bakery
  ice_cream:  "100-1100-0310",               // ice cream
  nightlife:  "200-2000",                    // nightlife
  culture:    "300-3000",                    // tourist attraction
  sport:      "550-5520",                    // sports/recreation
  marina:     "550-5510-0356",               // marina
  camping:    "500-5100-0058",               // camping
};

// Walking speed: ~5 km/h = 83m/min
function walkMin(meters) { return Math.max(1, Math.round(meters / 83)); }
// Driving speed in city: ~30 km/h = 500m/min
function driveMin(meters) { return Math.max(1, Math.round(meters / 500)); }

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=120");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Guard: missing API key
  if (!HERE_KEY) return res.status(200).json({ location: { city: "?" }, categories: {}, error: "Maps not configured", ts: new Date().toISOString() });

  // Rate limiting
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!nearbyRateOk(clientIp)) return res.status(429).json({ error: "Rate limit exceeded" });

  const lat = parseFloat(req.query?.lat);
  const lng = parseFloat(req.query?.lng);
  if (!lat || !lng) return res.status(400).json({ error: "lat/lng required" });

  // Cache check
  const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${req.query?.cats || "default"}_${req.query?.lang || "hr"}`;
  const cached = NEARBY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < NEARBY_CACHE_TTL) {
    return res.status(200).json({ ...cached.data, cached: true });
  }

  const cats = (req.query?.cats || "parking,food,shop,beach").split(",").map(c => c.trim());
  const limit = Math.min(parseInt(req.query?.limit) || 5, 10);
  const lang = req.query?.lang || "hr";
  const radius = parseInt(req.query?.radius) || 5000; // meters

  // Map language to HERE Accept-Language
  const hereLang = { hr: "hr-HR", de: "de-DE", en: "en-US", it: "it-IT", si: "sl-SI", cz: "cs-CZ", pl: "pl-PL", at: "de-AT" }[lang] || "hr-HR";

  try {
    // Parallel: reverse geocode + all category searches
    const reverseGeoPromise = fetch(
      `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&lang=${hereLang}&apiKey=${HERE_KEY}`,
      { signal: AbortSignal.timeout(4000) }
    ).then(r => r.json()).catch(() => null);

    const catPromises = cats.map(cat => {
      const hereCats = CAT_MAP[cat];
      if (!hereCats) return Promise.resolve({ cat, places: [] });

      return fetch(
        `https://browse.search.hereapi.com/v1/browse?at=${lat},${lng}&categories=${hereCats}&in=circle:${lat},${lng};r=${radius}&limit=${limit}&lang=${hereLang}&apiKey=${HERE_KEY}`,
        { signal: AbortSignal.timeout(4000) }
      )
        .then(r => r.json())
        .then(data => ({
          cat,
          places: (data.items || []).map(item => ({
            name: item.title || "?",
            address: item.address?.label || "",
            street: item.address?.street || "",
            houseNumber: item.address?.houseNumber || "",
            district: item.address?.district || "",
            lat: item.position?.lat,
            lng: item.position?.lng,
            distance: item.distance || null,
            walkMin: item.distance ? walkMin(item.distance) : null,
            driveMin: item.distance ? driveMin(item.distance) : null,
            categories: (item.categories || []).map(c => c.name).slice(0, 2),
            openNow: item.openingHours?.[0]?.isOpen ?? null,
            hours: item.openingHours?.[0]?.text?.[0] || null,
            phone: item.contacts?.[0]?.phone?.[0]?.value || null,
            website: item.contacts?.[0]?.www?.[0]?.value || null,
            rating: item.scoring?.popularity || null,
          })),
        }))
        .catch(() => ({ cat, places: [] }));
    });

    const [geoResult, ...catResults] = await Promise.all([reverseGeoPromise, ...catPromises]);

    // Extract city/address from reverse geocode
    const geoItem = geoResult?.items?.[0];
    const location = geoItem ? {
      city: geoItem.address?.city || geoItem.address?.county || "?",
      district: geoItem.address?.district || "",
      street: geoItem.address?.street || "",
      country: geoItem.address?.countryCode || "",
      label: geoItem.address?.label || "",
    } : { city: "?", district: "", street: "", country: "", label: "" };

    // Build response
    const categories = {};
    for (const cr of catResults) {
      categories[cr.cat] = cr.places;
    }

    const result = { location, categories, query: { lat, lng, radius, lang }, ts: new Date().toISOString() };

    // Cache for 5 min
    NEARBY_CACHE.set(cacheKey, { data: result, ts: Date.now() });
    // Evict old cache entries
    if (NEARBY_CACHE.size > 100) {
      for (const [k, v] of NEARBY_CACHE) { if (Date.now() - v.ts > NEARBY_CACHE_TTL) NEARBY_CACHE.delete(k); }
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error("nearby: error:", e.message);
    return res.status(200).json({ location: { city: "?" }, categories: {}, error: e.message, ts: new Date().toISOString() });
  }
}
