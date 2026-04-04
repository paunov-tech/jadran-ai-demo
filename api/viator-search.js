// api/viator-search.js — Viator activity search
// POST /api/viator-search  { destination, tags, count }
// Returns { activities: [...] }

const VIATOR_KEY = process.env.VIATOR_API_KEY; // ROTATED: was hardcoded — move to Vercel env var
const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const CACHE = new Map(); // key → { data, ts }
const CACHE_TTL = 3600000; // 1h

// Rate limit: 30 searches/hour per IP
const _vsRL = new Map();
function vsRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _vsRL) { if (now > v.r) _vsRL.delete(k); }
  const e = _vsRL.get(ip);
  if (!e || now > e.r) { _vsRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 30) return false;
  e.c++; return true;
}

const FALLBACK_ACTIVITIES = [
  {
    productCode: "LOCAL-001",
    title: "Split – Dioklecijanova palača (vođeni obilazak)",
    description: "Razgledajte impresivnu rimsku palaču iz 4. st. s lokalnim vodičem. Uključeni ulazni znakovi i priča o svakodnevnom životu cara Dioklecijana.",
    price: 29, rating: 4.8, reviewCount: 1240,
    duration: "2h", category: "Kultura",
    images: ["https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=400"],
    bookingUrl: "https://www.viator.com/tours/Split/Diocletians-Palace-Walking-Tour/d968-5085P3?pid=P00292197&mcid=42383&medium=link",
  },
  {
    productCode: "LOCAL-002",
    title: "Plava špilja & 5 otoka (brzi brod)",
    description: "Posjetite Plavu špilju, Hvar, Brač i uvale Paklenih otoka. Jedan od najpopularnijih izleta iz Splita — ne propustite!",
    price: 79, rating: 4.9, reviewCount: 3580,
    duration: "8h", category: "Nautika",
    images: ["https://images.unsplash.com/photo-1552560552-4c7d7f7d0e8d?w=400"],
    bookingUrl: "https://www.viator.com/tours/Split/Blue-Cave-and-Hvar-Tour-from-Split/d4185-17622P2?pid=P00292197&mcid=42383&medium=link",
  },
  {
    productCode: "LOCAL-003",
    title: "NP Krka – izlet s prijevozom iz Splita",
    description: "Posjetite vodopadima Roski slap i Skradin Buk. Kupanje u rijeci Krki, piknički ručak, povratak do Splita uključen.",
    price: 65, rating: 4.7, reviewCount: 890,
    duration: "9h", category: "Priroda",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"],
    bookingUrl: "https://www.viator.com/tours/Split/From-Split-Krka-Waterfalls-Food-Wine-Tasting-Tour/d4185-251842P1?pid=P00292197&mcid=42383&medium=link",
  },
  {
    productCode: "LOCAL-004",
    title: "Rafting na Cetini iz Omiša",
    description: "Adrenalinska avantura u kanjonu rijeke Cetine — samo 20 min vožnje od Podstrane. Sva oprema uključena.",
    price: 45, rating: 4.8, reviewCount: 650,
    duration: "3h", category: "Avantura",
    images: ["https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400"],
    bookingUrl: "https://www.viator.com/tours/Omis/Rafting-on-the-Cetina-River/d50835-73537P1?pid=P00292197&mcid=42383&medium=link",
  },
];

function cleanProduct(p) {
  const img = p.images?.[0]?.variants?.find(v => v.width >= 400)?.url
    || p.images?.[0]?.variants?.[0]?.url || null;
  const price = p.pricing?.summary?.fromPrice ?? p.price?.fromPrice ?? null;
  return {
    productCode: p.productCode,
    title: p.title,
    description: (p.description || "").slice(0, 300),
    price: price !== null ? Math.round(Number(price) * 10) / 10 : null,
    rating: p.reviews?.combinedAverageRating ?? p.rating ?? null,
    reviewCount: p.reviews?.totalReviews ?? p.reviewCount ?? 0,
    duration: p.duration?.fixedDurationInMinutes
      ? (p.duration.fixedDurationInMinutes < 120
          ? `${p.duration.fixedDurationInMinutes}min`
          : `${Math.round(p.duration.fixedDurationInMinutes / 60)}h`)
      : (p.duration?.description || ""),
    category: p.tags?.[0]?.allNamesByLocale?.["en"] || p.productType || "",
    images: img ? [img] : [],
    bookingUrl: p.productUrl || p.webURL || `https://www.viator.com/tours/${p.productCode || ""}?pid=P00292197&mcid=42383&medium=link`,
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const clientIp = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  if (!vsRateOk(clientIp)) return res.status(429).json({ activities: FALLBACK_ACTIVITIES, source: "fallback" });

  if (!VIATOR_KEY) return res.status(200).json({ activities: FALLBACK_ACTIVITIES, source: "fallback" });

  const { destination = "Podstrana", tags, count = 10 } = req.body || {};
  const cacheKey = `${destination}_${JSON.stringify(tags)}_${count}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ activities: cached.data, source: "cache" });
  }

  try {
    const body = {
      filtering: { destination, ...(tags ? { tags } : {}) },
      sorting: { sort: "TRAVELER_RATING", order: "DESC" },
      currency: "EUR",
      pagination: { start: 1, count: Math.min(count, 20) },
    };

    const resp = await fetch("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: {
        "exp-api-key": VIATOR_KEY,
        "Accept-Language": "en-US",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      console.error("Viator search failed:", resp.status, await resp.text());
      return res.status(200).json({ activities: FALLBACK_ACTIVITIES, source: "fallback" });
    }

    const data = await resp.json();
    const products = data.products || data.data || [];
    const activities = products.map(cleanProduct).filter(a => a.price !== null);

    const result = activities.length >= 3 ? activities : FALLBACK_ACTIVITIES;
    CACHE.set(cacheKey, { data: result, ts: Date.now() });
    return res.status(200).json({ activities: result, source: activities.length >= 3 ? "viator" : "fallback" });
  } catch (err) {
    console.error("Viator search error:", err.message);
    return res.status(200).json({ activities: FALLBACK_ACTIVITIES, source: "fallback" });
  }
}
