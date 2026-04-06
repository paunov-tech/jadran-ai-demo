// GET /api/cron-audience — Vercel cron (daily 03:00 UTC)
// Syncs all leads to Meta Custom Audience + Google Customer Match.
// Vercel automatically sends Authorization: Bearer {CRON_SECRET}

import audienceSync from "./audience-sync.js";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers["x-cron-secret"];
  if (cronSecret && provided !== cronSecret) return res.status(401).json({ error: "unauthorized" });

  req.method = "POST";
  req.body = { secret: cronSecret };
  return audienceSync(req, res);
}
