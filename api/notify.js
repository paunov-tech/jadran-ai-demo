// api/notify.js — Guest onboarding notification via Resend
// Fire-and-forget: POST /api/notify { type, guestName, roomCode, dates }
// Looks up host email from Firestore apartments collection, then sends via Resend

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const RESEND_API = "https://api.resend.com/emails";
const FROM = "JADRAN AI <noreply@jadran.ai>";
const NOTIFY_EMAIL = "info@sialconsulting.com"; // fallback / always CC

// Rate limit: 10 notifications/hour per IP (prevents Resend quota drain)
const _notifyRL = new Map();
function notifyRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _notifyRL) { if (now > v.r) _notifyRL.delete(k); }
  const e = _notifyRL.get(ip);
  if (!e || now > e.r) { _notifyRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 10) return false;
  e.c++; return true;
}

async function getHostEmail(roomCode) {
  if (!roomCode || !process.env.FIREBASE_API_KEY) return null;
  try {
    const projectId = "molty-portal";
    const apiKey = process.env.FIREBASE_API_KEY;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/apartments?key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const docs = data.documents || [];
    for (const d of docs) {
      const fields = d.fields || {};
      if (fields.roomCode?.stringValue === roomCode) {
        return fields.hostEmail?.stringValue || null;
      }
    }
  } catch {}
  return null;
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const recipients = [NOTIFY_EMAIL];
  if (to && to !== NOTIFY_EMAIL) recipients.push(to);
  await fetch(RESEND_API, {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: recipients, subject, html }),
  }).catch(() => {});
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const clientIp = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
  if (!notifyRateOk(clientIp)) return res.status(429).json({ error: "Too many requests" });

  const { type, guestName, roomCode, dates } = req.body || {};
  if (!guestName || !roomCode) return res.status(400).json({ error: "guestName and roomCode required" });

  // Respond immediately — fire-and-forget the email
  res.status(200).json({ ok: true });

  try {
    const hostEmail = await getHostEmail(roomCode);

    if (type === "checkin" || !type) {
      const subject = `Novi gost prijava — ${roomCode}`;
      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:520px;color:#1e293b;">
          <h2 style="color:#0284c7;">🌊 JADRAN AI — Prijava gosta</h2>
          <p><strong>Gost:</strong> ${guestName}</p>
          <p><strong>Soba:</strong> ${roomCode}</p>
          <p><strong>Datumi:</strong> ${dates || "—"}</p>
          <p style="margin-top:20px;font-size:12px;color:#94a3b8;">
            Gost je završio onboarding na jadran.ai?room=${roomCode}
          </p>
        </div>`;
      await sendEmail(hostEmail, subject, html);
    }
  } catch (err) {
    console.error("notify error:", err.message);
  }
}
