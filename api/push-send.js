// api/push-send.js — Send Web Push notification to a device
// POST /api/push-send  { deviceId, title, body, url, tag }
// Requires VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL env vars

import webpush from "web-push";

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];

function configureVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:info@sialconsulting.com";
  if (!pub || !priv) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(email, pub, priv);
}

async function getSubscription(deviceId) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_API_KEY not set");
  const docId = `device_${deviceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/push_subscriptions/${docId}?key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Subscription not found: ${resp.status}`);
  const data = await resp.json();
  const subStr = data.fields?.subscription?.stringValue;
  if (!subStr) throw new Error("No subscription in document");
  return JSON.parse(subStr);
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { deviceId, title, body, url: notifUrl, tag } = req.body || {};
  if (!deviceId || !title || !body) return res.status(400).json({ error: "deviceId, title, body required" });

  try {
    configureVapid();
    const subscription = await getSubscription(deviceId);
    const payload = JSON.stringify({ title, body, icon: "/icon-192.svg", tag: tag || "jadran", url: notifUrl || "/" });
    await webpush.sendNotification(subscription, payload);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("push-send error:", err.message);
    // 410 Gone = subscription expired, not a server error
    if (err.statusCode === 410) return res.status(410).json({ error: "Subscription expired" });
    return res.status(500).json({ error: err.message });
  }
}
