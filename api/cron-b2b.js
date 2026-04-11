// GET /api/cron-b2b — Vercel cron (svaki dan u 09:00 UTC)
// Pokreće B2B email sekvencu za sve kontakte kojima je nastupio nextSendAt.
// Vercel automatski šalje Authorization: Bearer {CRON_SECRET}

import b2bOutreach from "./b2b-outreach.js";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers["x-cron-secret"];
  const adminRaw = req.headers["x-admin-token"] || "";
  const adminDecoded = (() => { try { return Buffer.from(adminRaw, "base64").toString("utf8"); } catch { return adminRaw; } })();
  const isAdmin = adminDecoded.trim() === (process.env.ADMIN_TOKEN || "").trim();
  if (!isAdmin && cronSecret && provided !== cronSecret) return res.status(401).json({ error: "unauthorized" });

  req.method = "POST";
  req.query = { ...req.query, action: "send" };
  return b2bOutreach(req, res);
}
