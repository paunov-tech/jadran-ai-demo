// api/feedback.js — Log user feedback on AI responses to Firestore
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
  // Fail silently — feedback is non-critical
  if (!FB_KEY) return res.status(200).json({ ok: false });

  const { deviceId, aiText, userMsg, region, lang, reason = "wrong_info" } = req.body || {};
  if (!aiText) return res.status(400).json({ error: "aiText required" });

  try {
    const docId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      fields: {
        deviceId: { stringValue: (deviceId || "unknown").slice(0, 80) },
        aiText:   { stringValue: (aiText  || "").slice(0, 600) },
        userMsg:  { stringValue: (userMsg || "").slice(0, 300) },
        region:   { stringValue: region   || "" },
        lang:     { stringValue: lang     || "" },
        reason:   { stringValue: reason   || "wrong_info" },
        ts:       { integerValue: String(Date.now()) },
      },
    };
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_feedback/${docId}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
