// api/admin-login.js — Admin PIN validation via POST body
// POST /api/admin-login { pin: "..." } → { ok: true } | 401 | 429 | 503

// In-memory rate limiter — max 10 attempts per 15 min per IP
const _attempts = new Map();
function checkRate(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const entry = _attempts.get(ip) || { count: 0, first: now };
  if (now - entry.first > window) { _attempts.set(ip, { count: 1, first: now }); return true; }
  if (entry.count >= 10) return false;
  entry.count++;
  _attempts.set(ip, entry);
  return true;
}

const CORS = {
  "Access-Control-Allow-Origin":  "https://jadran.ai",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN) return res.status(503).json({ ok: false, error: "not_configured" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  if (!checkRate(ip)) return res.status(429).json({ ok: false, error: "Too many attempts — try again in 15 minutes" });

  const { pin } = req.body || {};
  if (!pin || pin.trim() !== ADMIN_TOKEN.trim()) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}
