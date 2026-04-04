// api/admin-login.js — Admin PIN validation via POST body
// POST /api/admin-login { pin: "..." } → { ok: true } | 401 | 503

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

  const { pin } = req.body || {};
  if (!pin || pin.trim() !== ADMIN_TOKEN.trim()) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}
