// api/viator-product.js — Viator product detail
// GET /api/viator-product?productCode=XXX

const VIATOR_KEY = "D4EE562C-12E3-4512-A435-F14425A76E31";
const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const CACHE = new Map();
const CACHE_TTL = 3600000; // 1h

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const { productCode } = req.query;
  if (!productCode) return res.status(400).json({ error: "productCode required" });

  const cached = CACHE.get(productCode);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ product: cached.data });
  }

  // Skip Viator API for local fallback codes
  if (productCode.startsWith("LOCAL-")) {
    return res.status(200).json({ product: null });
  }

  try {
    const resp = await fetch(`https://api.viator.com/partner/products/${encodeURIComponent(productCode)}`, {
      headers: {
        "exp-api-key": VIATOR_KEY,
        "Accept-Language": "en-US",
      },
    });

    if (!resp.ok) {
      console.error("Viator product fetch failed:", resp.status);
      return res.status(200).json({ product: null });
    }

    const data = await resp.json();
    const images = (data.images || []).map(img => {
      const variant = img.variants?.find(v => v.width >= 600) || img.variants?.[0];
      return variant?.url || null;
    }).filter(Boolean).slice(0, 5);

    const product = {
      productCode: data.productCode,
      title: data.title,
      description: data.description || "",
      shortDescription: (data.description || "").slice(0, 300),
      images,
      price: data.pricing?.summary?.fromPrice ?? null,
      duration: data.duration?.fixedDurationInMinutes
        ? `${Math.round(data.duration.fixedDurationInMinutes / 60)}h`
        : (data.duration?.description || ""),
      rating: data.reviews?.combinedAverageRating ?? null,
      reviewCount: data.reviews?.totalReviews ?? 0,
      inclusions: (data.inclusions || []).map(i => i.otherDescription || i.type).filter(Boolean).slice(0, 6),
      exclusions: (data.exclusions || []).map(e => e.otherDescription || e.type).filter(Boolean).slice(0, 4),
      meetingPoint: data.logistics?.start?.[0]?.description?.summary || null,
      cancellationPolicy: data.cancellationPolicy?.description || "Standard",
      bookingUrl: `https://www.viator.com/tours/${encodeURIComponent(productCode)}`,
    };

    CACHE.set(productCode, { data: product, ts: Date.now() });
    return res.status(200).json({ product });
  } catch (err) {
    console.error("Viator product error:", err.message);
    return res.status(200).json({ product: null });
  }
}
