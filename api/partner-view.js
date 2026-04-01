// api/partner-view.js — Increment partner view counter (fire-and-forget)
const ALLOWED = ["https://jadran.ai", "https://monte-negro.ai"];
const FB_PROJECT = "molty-portal";

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED.includes(origin) ? origin : ALLOWED[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const FB_KEY = process.env.FIREBASE_API_KEY;
  if (!FB_KEY) return res.status(200).json({ ok: false });

  const { partner, event = "view", lang = "", deviceId = "unknown" } = req.body || {};
  if (!partner) return res.status(400).json({ error: "partner required" });

  try {
    const docId = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      fields: {
        partner:  { stringValue: String(partner).slice(0, 40) },
        event:    { stringValue: String(event).slice(0, 40) },
        lang:     { stringValue: String(lang).slice(0, 10) },
        deviceId: { stringValue: String(deviceId).slice(0, 80) },
        ts:       { integerValue: String(Date.now()) },
        day:      { integerValue: String(new Date().getDay()) },
        hour:     { integerValue: String(new Date().getHours()) },
      },
    };
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_partner_views/${docId}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
