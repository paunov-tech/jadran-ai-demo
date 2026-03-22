// api/push-subscribe.js — Save Web Push subscription to Firestore
// POST /api/push-subscribe  { subscription, deviceId, roomCode }

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { subscription, deviceId, roomCode } = req.body || {};
  if (!subscription || !deviceId) return res.status(400).json({ error: "subscription and deviceId required" });

  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return res.status(200).json({ ok: true, warn: "Firestore not configured" });

  const docId = `device_${deviceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/push_subscriptions/${docId}?key=${apiKey}`;

  try {
    const resp = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          deviceId: { stringValue: deviceId },
          roomCode: { stringValue: roomCode || "" },
          endpoint: { stringValue: subscription.endpoint || "" },
          subscription: { stringValue: JSON.stringify(subscription) },
          savedAt: { stringValue: new Date().toISOString() },
        },
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error("push-subscribe Firestore error:", resp.status, err);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("push-subscribe error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
