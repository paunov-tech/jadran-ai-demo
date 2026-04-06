// GET /api/cron-reengage — Vercel cron (every 12h)
// Triggers 14-day re-engagement sequence for paywall/exit_intent leads.
// Vercel automatically sends Authorization: Bearer {CRON_SECRET}

import reEngage from "./re-engage.js";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers["x-cron-secret"];
  if (cronSecret && provided !== cronSecret) return res.status(401).json({ error: "unauthorized" });

  req.method = "POST";
  req.body = { secret: cronSecret };
  return reEngage(req, res);
}
