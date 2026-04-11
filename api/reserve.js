// api/reserve.js — Pre-trip booking engine
// POST: create booking → unique JAD-XXX-YYYYMMDD-XXXXXX ID
// GET:  retrieve booking by ID
// Persists to Firebase Firestore (same REST pattern as chat.js)

import { randomBytes, createHmac } from "crypto";

const RESEND_KEY     = process.env.RESEND_API_KEY;
const CONFIRM_SECRET = process.env.CONFIRM_SECRET; // No default — fail-closed
const BASE_URL       = "https://jadran.ai";
const OPERATOR_EMAIL = "admin@jadran.ai";

// Rate limit: 5 booking requests/hour per IP (prevents email spam flooding)
const _resRL = new Map();
function resRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _resRL) { if (now > v.r) _resRL.delete(k); }
  const e = _resRL.get(ip);
  if (!e || now > e.r) { _resRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 5) return false;
  e.c++; return true;
}

function genConfirmToken(id, role) {
  return createHmac("sha256", CONFIRM_SECRET)
    .update(`${id}:${role}`)
    .digest("hex")
    .slice(0, 32);
}

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: "JADRAN.ai Booking <booking@jadran.ai>", to, subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

function partnerEmailHtml(booking, confirmUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:40px 20px}
.wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.head{background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:32px 40px;color:#fff;text-align:center}
.logo{font-size:24px;font-family:Georgia,serif;font-weight:700;color:#fff}
.logo span{color:#FFB800}
.body{padding:32px 40px}
h2{font-size:20px;font-weight:700;margin:0 0 16px}
.row{display:flex;gap:16px;margin-bottom:8px}
.label{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px}
.val{font-size:15px;font-weight:600;color:#0f172a}
.id{font-family:monospace;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;font-size:13px;color:#0284c7;margin:16px 0}
.btn{display:block;margin:24px 0 8px;padding:14px 28px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;text-align:center}
.footer{padding:20px 40px;background:#f8fafc;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0}
</style></head>
<body>
<div class="wrap">
  <div class="head">
    <div class="logo">JADRAN<span>.ai</span></div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px">AI Travel Operator</div>
  </div>
  <div class="body">
    <h2>New Booking Request</h2>
    <p style="color:#475569;margin-bottom:24px">A guest has requested a booking at your accommodation through JADRAN.ai. Please confirm to activate their AI travel guide.</p>
    <div class="id">${booking.id}</div>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:20px">
      <div style="margin-bottom:12px">
        <div class="label">Guest</div>
        <div class="val">${booking.guestName}</div>
        ${booking.guestEmail ? `<div style="font-size:13px;color:#64748b">${booking.guestEmail}</div>` : ""}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div><div class="label">Arrival</div><div class="val">${booking.arrival}</div></div>
        <div><div class="label">Departure</div><div class="val">${booking.departure}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div><div class="label">Nights</div><div class="val">${booking.nights}</div></div>
        <div><div class="label">Guests</div><div class="val">${booking.guests}</div></div>
      </div>
    </div>
    <p style="font-size:13px;color:#64748b;margin-bottom:4px">Accommodation: <strong>${booking.accommodationName}</strong></p>
    <a class="btn" href="${confirmUrl}">✓ Confirm this booking</a>
    <p style="font-size:12px;color:#94a3b8;text-align:center">Once you confirm, the operator will review and the guest will receive their trip ID.</p>
  </div>
  <div class="footer">JADRAN.ai · AI turistički operater · <a href="${BASE_URL}/admin" style="color:#0284c7">Admin Panel</a></div>
</div>
</body>
</html>`;
}

function operatorEmailHtml(booking, confirmUrl, adminUrl) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:system-ui,sans-serif;background:#0a1628;color:#f0f4f8;margin:0;padding:40px 20px}
.wrap{max-width:560px;margin:0 auto;background:#0f1e35;border:1px solid rgba(0,180,216,0.2);border-radius:16px;overflow:hidden}
.head{background:linear-gradient(135deg,#07111f,#0d2137);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,180,216,0.15)}
.logo{font-size:24px;font-family:Georgia,serif;font-weight:700;color:#fff}
.logo span{color:#FFB800}
.body{padding:32px 40px}
h2{font-size:18px;font-weight:700;margin:0 0 16px;color:#f0f4f8}
.label{font-size:11px;color:#7a8fa8;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:3px}
.val{font-size:15px;font-weight:600;color:#f0f4f8}
.id{font-family:monospace;background:rgba(0,180,216,0.08);border:1px solid rgba(0,180,216,0.2);border-radius:8px;padding:8px 16px;font-size:13px;color:#00b4d8;margin:16px 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;background:rgba(255,255,255,0.03);border-radius:12px;padding:18px;margin-bottom:18px}
.btn{display:block;margin:20px 0 8px;padding:14px 28px;background:linear-gradient(135deg,#00b4d8,#0085a8);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;text-align:center}
.btn2{display:block;padding:11px 24px;background:transparent;border:1px solid rgba(0,180,216,0.3);color:#00b4d8;font-size:13px;text-decoration:none;border-radius:10px;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="head">
    <div class="logo">JADRAN<span>.ai</span></div>
    <div style="font-size:11px;color:#7a8fa8;margin-top:8px;letter-spacing:1px">OPERATOR ALERT · NEW BOOKING</div>
  </div>
  <div class="body">
    <h2>New Booking — Review Required</h2>
    <div class="id">${booking.id}</div>
    <div class="grid">
      <div><div class="label">Guest</div><div class="val">${booking.guestName}</div></div>
      <div><div class="label">Destination</div><div class="val">${booking.destinationName}</div></div>
      <div><div class="label">Arrival</div><div class="val">${booking.arrival}</div></div>
      <div><div class="label">Departure</div><div class="val">${booking.departure}</div></div>
      <div><div class="label">Nights</div><div class="val">${booking.nights}</div></div>
      <div><div class="label">Guests</div><div class="val">${booking.guests}</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="label">Accommodation</div>
      <div class="val">${booking.accommodationName} <span style="font-size:12px;color:${booking.accommodationDirect === "true" ? "#22c55e" : "#7a8fa8"}">${booking.accommodationDirect === "true" ? "✓ direct" : "affiliate"}</span></div>
      ${booking.guestEmail ? `<div style="font-size:13px;color:#7a8fa8;margin-top:4px">${booking.guestEmail}</div>` : ""}
    </div>
    <a class="btn" href="${confirmUrl}">✓ Confirm as Operator</a>
    <a class="btn2" href="${adminUrl}" style="margin-top:8px">📋 View in Admin Panel</a>
  </div>
</div>
</body>
</html>`;
}

const FB_PROJECT = "molty-portal";
const FB_KEY     = process.env.FIREBASE_API_KEY;

const CORS = {
  "Access-Control-Allow-Origin":  "https://jadran.ai",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Crockford base-32 charset (no 0/O/I/1 confusion)
const B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genBookingId(destId = "ADR") {
  const prefix = (destId || "ADR").slice(0, 3).toUpperCase();
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand   = Array.from(randomBytes(6), b => B32[b % 32]).join("");
  return `JAD-${prefix}-${date}-${rand}`;
}

async function fsWrite(id, data) {
  if (!FB_KEY) return false;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "number") fields[k] = { integerValue: String(v) };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else fields[k] = { stringValue: String(v) };
    }
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/bookings/${id}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok;
  } catch { return false; }
}

async function fsRead(id) {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/bookings/${id}?key=${FB_KEY}`
    );
    if (!r.ok) return null;
    const doc = await r.json();
    if (!doc.fields) return null;
    const out = {};
    for (const [k, v] of Object.entries(doc.fields)) {
      out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
    }
    return out;
  } catch { return null; }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const clientIp = (req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();

  // ── GET /api/reserve?id=JAD-... ──
  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });
    const booking = await fsRead(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    return res.json(booking);
  }

  // ── POST /api/reserve ──
  if (req.method === "POST") {
    if (!resRateOk(clientIp)) return res.status(429).json({ error: "Too many requests. Try again later." });
    if (!CONFIRM_SECRET) return res.status(503).json({ error: "Booking service not configured" });
    const {
      destination, destinationName,
      accommodation,
      guestName, guestEmail,
      arrival, departure, guests,
      lang, deviceId,
    } = req.body || {};

    if (!destination || !guestName?.trim()) {
      return res.status(400).json({ error: "Required: destination, guestName" });
    }
    if (!arrival || !departure) {
      return res.status(400).json({ error: "Required: arrival, departure" });
    }

    const id = genBookingId(destination);
    const nights = Math.max(
      0,
      Math.round((new Date(departure) - new Date(arrival)) / 86400000)
    );

    const accommodationEmail = (accommodation?.email || "").trim();

    const flat = {
      id,
      destination,
      destinationName: destinationName || destination,
      accommodationName: accommodation?.name || "",
      accommodationType: accommodation?.type || "affiliate",
      accommodationDirect: accommodation?.direct ? "true" : "false",
      accommodationEmail,
      guestName: guestName.trim(),
      guestEmail: (guestEmail || "").trim(),
      arrival,
      departure,
      nights,
      guests: guests || 2,
      lang: lang || "en",
      deviceId: deviceId || "",
      status: "pending",
      partnerConfirmed: "false",
      operatorConfirmed: "false",
      createdAt: new Date().toISOString(),
    };

    // Await Firebase write — serverless fn terminates on res.json() so fire-and-forget doesn't work
    await fsWrite(id, flat);

    // Send confirmation emails (non-blocking)
    const partnerToken  = genConfirmToken(id, "partner");
    const operatorToken = genConfirmToken(id, "operator");
    const partnerConfirmUrl  = `${BASE_URL}/api/confirm?id=${encodeURIComponent(id)}&token=${partnerToken}&role=partner`;
    const operatorConfirmUrl = `${BASE_URL}/api/confirm?id=${encodeURIComponent(id)}&token=${operatorToken}&role=operator`;
    const adminUrl = `${BASE_URL}/admin`;

    // Await emails before responding — serverless fn terminates on res.json()
    const emailPromises = [];
    if (accommodationEmail) {
      emailPromises.push(sendEmail(
        accommodationEmail,
        `New booking request: ${guestName.trim()} — ${id}`,
        partnerEmailHtml(flat, partnerConfirmUrl)
      ));
    }
    emailPromises.push(sendEmail(
      OPERATOR_EMAIL,
      `[Jadran.ai] New booking — ${id} · ${guestName.trim()} → ${destinationName || destination}`,
      operatorEmailHtml(flat, operatorConfirmUrl, adminUrl)
    ));
    await Promise.all(emailPromises).catch(e => console.error("[reserve] email send failed:", e.message));

    return res.json({ id, booking: flat });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
