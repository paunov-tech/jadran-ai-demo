// api/partner-stats.js — Aggregate stats for partner analytics dashboard
// Auth: ?pin=PIN validated server-side (pins in env vars only — never in client bundle)
const FB_PROJECT = "molty-portal";
const ALLOWED_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];

// Pins MUST be set as Vercel env vars: PIN_BLACKJACK, PIN_EUFEMIJA
// Fallback pins are intentionally NOT set here — fail-closed
const VALID_PINS = {
  "blackjack": process.env.PIN_BLACKJACK,
  "eufemija":  process.env.PIN_EUFEMIJA,
};

// Rate limit: max 10 PIN attempts per IP per 15 min (brute force protection)
const _pinRL = new Map();
function pinRateOk(ip) {
  const now = Date.now(), WIN = 900000;
  const e = _pinRL.get(ip);
  if (!e || now > e.r) { _pinRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 10) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!pinRateOk(clientIp)) return res.status(429).json({ error: "Too many attempts" });

  const { partner, pin } = req.query || {};
  if (!partner || !pin) return res.status(400).json({ error: "partner and pin required" });
  // If env var not set, reject all — never fall back to a hardcoded value
  if (!VALID_PINS[partner] || VALID_PINS[partner] !== pin) return res.status(403).json({ error: "invalid pin" });

  const FB_KEY = process.env.FIREBASE_API_KEY;
  if (!FB_KEY) return res.status(200).json({ ok: false, views: 0, feedback: [] });

  try {
    // ── Fetch views ────────────────────────────────────────────
    const viewsUrl = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`;
    const viewsQuery = {
      structuredQuery: {
        from: [{ collectionId: "jadran_partner_views" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "partner" },
            op: "EQUAL",
            value: { stringValue: partner },
          }
        },
        orderBy: [{ field: { fieldPath: "ts" }, direction: "DESCENDING" }],
        limit: 500,
      }
    };

    // ── Fetch feedback ─────────────────────────────────────────
    const fbUrl = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`;
    const fbQuery = {
      structuredQuery: {
        from: [{ collectionId: "jadran_partner_feedback" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "partner" },
            op: "EQUAL",
            value: { stringValue: partner },
          }
        },
        orderBy: [{ field: { fieldPath: "ts" }, direction: "DESCENDING" }],
        limit: 100,
      }
    };

    const [viewsRes, fbRes] = await Promise.all([
      fetch(viewsUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(viewsQuery), signal: AbortSignal.timeout(8000) }),
      fetch(fbUrl,    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fbQuery),  signal: AbortSignal.timeout(8000) }),
    ]);

    const [viewsDocs, fbDocs] = await Promise.all([viewsRes.json(), fbRes.json()]);

    // Parse views
    const views = (Array.isArray(viewsDocs) ? viewsDocs : [])
      .filter(d => d.document)
      .map(d => {
        const f = d.document.fields || {};
        return {
          ts:    parseInt(f.ts?.integerValue || 0),
          event: f.event?.stringValue || "view",
          lang:  f.lang?.stringValue || "",
          hour:  parseInt(f.hour?.integerValue || 0),
          day:   parseInt(f.day?.integerValue || 0),
        };
      });

    // Parse feedback
    const feedback = (Array.isArray(fbDocs) ? fbDocs : [])
      .filter(d => d.document)
      .map(d => {
        const f = d.document.fields || {};
        return {
          ts:      parseInt(f.ts?.integerValue || 0),
          rating:  parseInt(f.rating?.integerValue || 0),
          comment: f.comment?.stringValue || "",
          lang:    f.lang?.stringValue || "",
        };
      });

    // ── Aggregations ──────────────────────────────────────────
    const now = Date.now();
    const DAY = 86400000;
    const views7d  = views.filter(v => v.ts > now - 7  * DAY).length;
    const views30d = views.filter(v => v.ts > now - 30 * DAY).length;

    // Views by day (last 7 days)
    const byDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = `${d.getMonth()+1}/${d.getDate()}`;
      byDay[key] = 0;
    }
    views.filter(v => v.ts > now - 7 * DAY).forEach(v => {
      const d = new Date(v.ts);
      const key = `${d.getMonth()+1}/${d.getDate()}`;
      if (key in byDay) byDay[key]++;
    });

    // Views by language
    const byLang = {};
    views.filter(v => v.ts > now - 30 * DAY).forEach(v => {
      const l = v.lang || "?";
      byLang[l] = (byLang[l] || 0) + 1;
    });

    // Avg rating
    const ratings = feedback.map(f => f.rating).filter(r => r > 0);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    return res.status(200).json({
      ok: true,
      partner,
      totalViews: views.length,
      views7d,
      views30d,
      byDay,
      byLang,
      feedbackCount: feedback.length,
      avgRating,
      recentFeedback: feedback.slice(0, 10),
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
