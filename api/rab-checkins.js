// api/rab-checkins.js — Rab Card scan aggregator for War Room
// Reads jadran_rab_card_scans, groups by partnerId/location
// GET /api/rab-checkins?hours=24

const FB_KEY     = process.env.FIREBASE_API_KEY;
const FB_PROJECT = "molty-portal";
const CORS       = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 30000; // 30s — demo needs fresh data

// Known location display names + GPS coordinates for map heatmap
const LOCATION_LABELS = {
  ferry_terminal:  { name: "Ferry Terminal",    emoji: "⛴",  type: "entry",      lat: 44.7432, lng: 14.7598 },
  beach_rajska:    { name: "Rajska plaža",       emoji: "🏖️", type: "beach",      lat: 44.8433, lng: 14.7250 },
  info_centar:     { name: "Info centar",        emoji: "ℹ️", type: "service",    lat: 44.7570, lng: 14.7614 },
  stari_grad:      { name: "Stari grad",         emoji: "🏛",  type: "attraction", lat: 44.7570, lng: 14.7607 },
  marina_rab:      { name: "Marina Rab",         emoji: "⛵",  type: "marina",     lat: 44.7583, lng: 14.7638 },
  park_komrcar:    { name: "Park Komrčar",       emoji: "🌲",  type: "park",       lat: 44.7572, lng: 14.7578 },
  rajska:          { name: "Rajska plaža",       emoji: "🏖️", type: "beach",      lat: 44.8433, lng: 14.7250 },
  livacina:        { name: "Livačina",           emoji: "🪨",  type: "beach",      lat: 44.7557, lng: 14.8207 },
  sahara:          { name: "Sahara",             emoji: "🏝️", type: "beach",      lat: 44.8458, lng: 14.7232 },
  "suha-punta":    { name: "Suha Punta",         emoji: "⛵",  type: "beach",      lat: 44.7380, lng: 14.8510 },
  pudarica:        { name: "Pudarica",           emoji: "🌊",  type: "beach",      lat: 44.7407, lng: 14.7885 },
  mel:             { name: "Mel",                emoji: "🌿",  type: "beach",      lat: 44.7672, lng: 14.7458 },
  "sv-ivan":       { name: "Sveti Ivan",         emoji: "⛪",  type: "beach",      lat: 44.7648, lng: 14.7556 },
  barbat:          { name: "Barbat",             emoji: "🏘️", type: "beach",      lat: 44.7265, lng: 14.7840 },
  frkanj:          { name: "Frkanj",             emoji: "🌊",  type: "beach",      lat: 44.7510, lng: 14.8232 },
  crnika:          { name: "Crnika",             emoji: "🌲",  type: "beach",      lat: 44.7612, lng: 14.7720 },
  banjol:          { name: "Banjol",             emoji: "⚓",  type: "beach",      lat: 44.7388, lng: 14.7728 },
  podgrad:         { name: "Podgrad",            emoji: "🏰",  type: "beach",      lat: 44.7542, lng: 14.8058 },
  blackjack:       { name: "Black Jack Rab",     emoji: "🍽️", type: "partner",    lat: 44.7534, lng: 14.7835 },
};

async function fetchScans() {
  if (!FB_KEY) return [];
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_rab_card_scans?key=${FB_KEY}&pageSize=500`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.documents || [];
  } catch { return []; }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "GET only" });

  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return res.status(200).json({ ..._cache, cached: true });
  }

  const hours   = Math.min(168, parseInt(req.query?.hours || "24"));
  const cutoff  = Date.now() - hours * 3600000;
  const today   = new Date().toISOString().slice(0, 10);

  const docs = await fetchScans();

  // Group by location
  const byLocation = {};
  const uniqueCards = new Set();
  let totalToday = 0;
  let totalPeriod = 0;

  for (const doc of docs) {
    const f = doc.fields || {};
    const scannedAt  = f.scannedAt?.stringValue  || "";
    const partnerId  = f.partnerId?.stringValue   || "unknown";
    const partnerName = f.partnerName?.stringValue || "";
    const scanType   = f.scanType?.stringValue    || "";
    const cardId     = f.cardId?.stringValue      || "";
    const guestName  = f.guestName?.stringValue   || "";

    const scannedMs = scannedAt ? new Date(scannedAt).getTime() : 0;
    if (!scannedMs || scannedMs < cutoff) continue;

    totalPeriod++;
    uniqueCards.add(cardId);

    const isToday = scannedAt.startsWith(today);
    if (isToday) totalToday++;

    if (!byLocation[partnerId]) {
      const meta = LOCATION_LABELS[partnerId] || {};
      byLocation[partnerId] = {
        id:        partnerId,
        name:      partnerName || meta.name || partnerId,
        emoji:     meta.emoji  || "📍",
        type:      meta.type   || (scanType === "beach_checkin" ? "beach" : "entry"),
        lat:       meta.lat    || null,
        lng:       meta.lng    || null,
        count:     0,
        today:     0,
        lastScan:  "",
        visitors:  new Set(),
      };
    }
    byLocation[partnerId].count++;
    if (isToday) byLocation[partnerId].today++;
    if (!byLocation[partnerId].lastScan || scannedAt > byLocation[partnerId].lastScan) {
      byLocation[partnerId].lastScan = scannedAt;
    }
    byLocation[partnerId].visitors.add(cardId);
  }

  // Serialize (Sets can't be JSON'd)
  const locations = Object.values(byLocation).map(loc => ({
    id:          loc.id,
    name:        loc.name,
    emoji:       loc.emoji,
    type:        loc.type,
    lat:         loc.lat,
    lng:         loc.lng,
    count:       loc.count,
    today:       loc.today,
    uniqueCards: loc.visitors.size,
    lastScan:    loc.lastScan,
  })).sort((a, b) => b.today - a.today || b.count - a.count);

  const payload = {
    ts:           new Date().toISOString(),
    hours,
    totalPeriod,
    totalToday,
    uniqueCards:  uniqueCards.size,
    locations,
  };

  _cache   = payload;
  _cacheTs = Date.now();
  return res.status(200).json(payload);
}
