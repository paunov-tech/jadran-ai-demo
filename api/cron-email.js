// GET /api/cron-email — Vercel cron (every 6h)
// Triggers email drip sequence for eligible leads.
// Vercel automatically sends Authorization: Bearer {CRON_SECRET}

import emailSend from "./email-send.js";

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : req.headers["x-cron-secret"];
  if (cronSecret && provided !== cronSecret) return res.status(401).json({ error: "unauthorized" });

  // Delegate to email-send handler with secret injected
  req.method = "POST";
  req.body = { secret: cronSecret };
  return emailSend(req, res);
}
