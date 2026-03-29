// api/push-broadcast.js — Broadcast Web Push to ALL subscribed devices
// POST /api/push-broadcast { title, body, url, tag, icon, secret }
// Called by n8n when a new critical/high alert is detected.
// Requires env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL, FIREBASE_API_KEY, PUSH_SECRET

import webpush from "web-push";

const PROJECT_ID = "molty-portal";
const BATCH_SIZE = 50; // parallel sends per batch (avoid Vercel 10s timeout)

// Global rate limit: max 20 broadcasts/hour to prevent notification spam
let _broadcastCount = 0, _broadcastReset = 0;
function broadcastRateOk() {
  const now = Date.now();
  if (now > _broadcastReset) { _broadcastCount = 1; _broadcastReset = now + 3600000; return true; }
  if (_broadcastCount >= 20) return false;
  _broadcastCount++;
  return true;
}

function configureVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:info@sialconsulting.com";
  if (!pub || !priv) throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set in env");
  webpush.setVapidDetails(email, pub, priv);
}

async function getAllSubscriptions() {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error("FIREBASE_API_KEY not set");

  const subs = [];
  let pageToken = null;
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/push_subscriptions?key=${apiKey}&pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error(`Firestore list error: ${resp.status}`);
    const data = await resp.json();
    for (const doc of (data.documents || [])) {
      const subStr = doc.fields?.subscription?.stringValue;
      const docId = doc.name?.split("/").pop();
      if (subStr && docId) {
        try { subs.push({ docId, subscription: JSON.parse(subStr) }); } catch {}
      }
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return subs;
}

async function deleteExpired(docId) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/push_subscriptions/${docId}?key=${apiKey}`,
    { method: "DELETE" }
  ).catch(() => {});
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://jadran.ai");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Push-Secret");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Auth — require secret (fail-closed if not configured)
  const secret = process.env.PUSH_SECRET;
  if (!secret) return res.status(503).json({ error: "Push not configured" });
  const provided = req.headers["x-push-secret"]; // header only — don't accept in body
  if (provided !== secret) return res.status(401).json({ error: "Unauthorized" });

  if (!broadcastRateOk()) return res.status(429).json({ error: "Broadcast rate limit exceeded" });

  const { title, body, url: notifUrl, tag, icon, requireInteraction } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });

  try {
    configureVapid();
    const subs = await getAllSubscriptions();
    if (!subs.length) return res.status(200).json({ ok: true, sent: 0, total: 0 });

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: tag || "jadran-alert",
      url: notifUrl || "https://jadran.ai",
      requireInteraction: !!requireInteraction,
    });

    let sent = 0, failed = 0, expired = 0;

    for (let i = 0; i < subs.length; i += BATCH_SIZE) {
      await Promise.all(subs.slice(i, i + BATCH_SIZE).map(async ({ docId, subscription }) => {
        try {
          await webpush.sendNotification(subscription, payload);
          sent++;
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await deleteExpired(docId); // clean up dead subscriptions
            expired++;
          } else {
            failed++;
            console.error(`[push-broadcast] failed ${docId}:`, err.statusCode, err.message);
          }
        }
      }));
    }

    console.log(`[push-broadcast] sent=${sent} failed=${failed} expired_cleaned=${expired} total=${subs.length}`);
    return res.status(200).json({ ok: true, sent, failed, expired, total: subs.length });

  } catch (err) {
    console.error("[push-broadcast] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
