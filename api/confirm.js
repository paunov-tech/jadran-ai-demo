// api/confirm.js — Dual-confirmation endpoint
// Partner:  GET /api/confirm?id=JAD-...&token=TOKEN&role=partner
// Operator: GET /api/confirm?id=JAD-...&token=TOKEN&role=operator
// When both partnerConfirmed + operatorConfirmed → status = "confirmed"
// Admin shortcut: POST /api/confirm { id, role: "operator" } with x-admin-token header

import { createHmac } from "crypto";

const FB_PROJECT  = "molty-portal";
const FB_KEY      = process.env.FIREBASE_API_KEY;
const CONFIRM_SECRET = process.env.CONFIRM_SECRET || "jadran2026demo";
const ADMIN_TOKEN    = process.env.ADMIN_TOKEN    || "jadran-admin-2026";
const BASE_URL       = "https://jadran.ai";

async function sendGuestEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "JADRAN.ai Booking <booking@jadran.ai>", to, subject, html }),
    });
    return r.ok;
  } catch { return false; }
}

function guestConfirmedEmail(booking, tripUrl) {
  const id = booking.id || "";
  const name = booking.guestName || "Guest";
  const accom = booking.accommodationName || "";
  const dest = booking.destinationName || "";
  const arrival = booking.arrival || "";
  const departure = booking.departure || "";
  const nights = booking.nights || "";
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:40px 20px}
.wrap{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.head{background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:36px 40px;color:#fff;text-align:center}
.logo{font-size:26px;font-family:Georgia,serif;font-weight:700;color:#fff;margin-bottom:6px}
.logo span{color:#FFB800}
.badge{display:inline-block;padding:4px 18px;border-radius:20px;background:rgba(34,197,94,0.2);border:1px solid rgba(34,197,94,0.5);color:#4ade80;font-size:11px;font-weight:700;letter-spacing:1px;margin-top:12px}
.body{padding:36px 40px}
h2{font-size:20px;font-weight:700;margin:0 0 8px;color:#0f172a}
.sub{font-size:15px;color:#64748b;margin-bottom:28px;line-height:1.6}
.id-box{background:linear-gradient(135deg,#0a1628,#0f2a4a);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px}
.id-label{font-size:11px;color:rgba(255,255,255,0.5);font-weight:700;letter-spacing:1px;margin-bottom:6px}
.id{font-family:monospace;font-size:22px;font-weight:800;color:#00b4d8;letter-spacing:2px;word-break:break-all}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.cell{background:#f8fafc;border-radius:10px;padding:14px 16px}
.clabel{font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}
.cval{font-size:15px;font-weight:700;color:#0f172a}
.btn{display:block;margin:0 0 12px;padding:16px 28px;background:linear-gradient(135deg,#00b4d8,#0085a8);color:#fff;font-size:16px;font-weight:800;text-decoration:none;border-radius:14px;text-align:center}
.note{font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;margin-top:8px}
.footer{padding:20px 40px;background:#f8fafc;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="head">
    <div class="logo">JADRAN<span>.ai</span></div>
    <div style="font-size:13px;color:rgba(255,255,255,0.65)">AI Travel Operator</div>
    <div class="badge">✓ BOOKING CONFIRMED</div>
  </div>
  <div class="body">
    <h2>Your trip is confirmed, ${name}! 🎉</h2>
    <p class="sub">Both your accommodation and our team have confirmed your booking. Your AI travel companion is ready to guide you from home to ${dest} and back.</p>
    <div class="id-box">
      <div class="id-label">YOUR TRIP ID</div>
      <div class="id">${id}</div>
    </div>
    <div class="grid">
      <div class="cell"><div class="clabel">Accommodation</div><div class="cval">${accom}</div></div>
      <div class="cell"><div class="clabel">Destination</div><div class="cval">${dest}</div></div>
      <div class="cell"><div class="clabel">Arrival</div><div class="cval">${arrival}</div></div>
      <div class="cell"><div class="clabel">Departure</div><div class="cval">${departure}</div></div>
    </div>
    <a class="btn" href="${tripUrl}">🚀 Open My Trip Guide</a>
    <p class="note">Save this email. Your Trip ID gives you access to your personalised AI guide at any time — even offline after first load.</p>
  </div>
  <div class="footer">JADRAN.ai · AI turistički operater · <a href="https://jadran.ai" style="color:#0284c7">jadran.ai</a></div>
</div>
</body>
</html>`;
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-admin-token",
};

export function genConfirmToken(id, role) {
  return createHmac("sha256", CONFIRM_SECRET)
    .update(`${id}:${role}`)
    .digest("hex")
    .slice(0, 32);
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

async function fsPatch(id, data) {
  if (!FB_KEY) return false;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else fields[k] = { stringValue: String(v) };
    }
    // Build updateMask to only update specified fields
    const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/bookings/${id}?key=${FB_KEY}&${fieldPaths}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok;
  } catch { return false; }
}

function htmlPage(title, body, color = "#22c55e") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — JADRAN.ai</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a1628; color: #f0f4f8; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 480px; width: 100%; background: #0f1e35; border: 1px solid rgba(0,180,216,0.15); border-radius: 20px; padding: 40px; text-align: center; }
    .icon { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    p { font-size: 15px; color: #7a8fa8; line-height: 1.65; margin-bottom: 20px; }
    .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 16px; }
    a.btn { display: inline-block; margin-top: 8px; padding: 13px 28px; border-radius: 14px; background: linear-gradient(135deg, #00b4d8, #0085a8); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; }
    .logo { font-size: 20px; font-family: Georgia, serif; font-weight: 700; margin-bottom: 32px; color: #7a8fa8; }
    .logo span { color: #FFB800; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">JADRAN<span>.ai</span></div>
    ${body}
    <a class="btn" href="${BASE_URL}/admin">→ Admin Panel</a>
  </div>
</body>
</html>`;
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── POST — admin confirms from panel ──
  if (req.method === "POST") {
    const adminTok = req.headers["x-admin-token"];
    if (adminTok !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

    const { id, role } = req.body || {};
    if (!id || !["partner", "operator"].includes(role)) {
      return res.status(400).json({ error: "Required: id, role" });
    }

    const booking = await fsRead(id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const updates = {};
    if (role === "partner")  updates.partnerConfirmed  = "true";
    if (role === "operator") updates.operatorConfirmed = "true";

    const partnerOk  = role === "partner"  || booking.partnerConfirmed  === "true";
    const operatorOk = role === "operator" || booking.operatorConfirmed === "true";
    if (partnerOk && operatorOk) updates.status = "confirmed";

    await fsPatch(id, updates);

    // Notify guest when fully confirmed
    if (updates.status === "confirmed" && booking.guestEmail) {
      const tripUrl = `${BASE_URL}/?trip=${encodeURIComponent(id)}`;
      await sendGuestEmail(
        booking.guestEmail,
        `✓ Booking confirmed — ${id} · Your trip to ${booking.destinationName || booking.destination} is ready!`,
        guestConfirmedEmail(booking, tripUrl)
      ).catch(() => {});
    }

    return res.json({ ok: true, status: updates.status || booking.status, updates });
  }

  // ── GET — email link confirm ──
  if (req.method === "GET") {
    const { id, token, role } = req.query;

    if (!id || !token || !["partner", "operator"].includes(role)) {
      res.setHeader("Content-Type", "text/html");
      return res.status(400).send(htmlPage("Invalid Link", `
        <div class="icon">⚠️</div>
        <h1>Invalid confirmation link</h1>
        <p>The link is missing required parameters. Please check the email and try again.</p>
      `));
    }

    const expected = genConfirmToken(id, role);
    if (token !== expected) {
      res.setHeader("Content-Type", "text/html");
      return res.status(403).send(htmlPage("Invalid Token", `
        <div class="icon">🔒</div>
        <h1>Invalid token</h1>
        <p>This confirmation link is invalid or has been tampered with.</p>
      `));
    }

    const booking = await fsRead(id);
    if (!booking) {
      res.setHeader("Content-Type", "text/html");
      return res.status(404).send(htmlPage("Not Found", `
        <div class="icon">🔍</div>
        <h1>Booking not found</h1>
        <p>Booking <strong>${id}</strong> could not be found.</p>
      `));
    }

    const updates = {};
    if (role === "partner")  updates.partnerConfirmed  = "true";
    if (role === "operator") updates.operatorConfirmed = "true";

    const partnerOk  = role === "partner"  || booking.partnerConfirmed  === "true";
    const operatorOk = role === "operator" || booking.operatorConfirmed === "true";
    if (partnerOk && operatorOk) updates.status = "confirmed";

    await fsPatch(id, updates);

    const isFullyConfirmed = updates.status === "confirmed";
    // Notify guest when fully confirmed
    if (isFullyConfirmed && booking.guestEmail) {
      const tripUrl = `${BASE_URL}/?trip=${encodeURIComponent(id)}`;
      sendGuestEmail(
        booking.guestEmail,
        `✓ Booking confirmed — ${id} · Your trip to ${booking.destinationName || booking.destination} is ready!`,
        guestConfirmedEmail(booking, tripUrl)
      ).catch(() => {});
    }
    const roleLabel = role === "partner" ? "accommodation partner" : "operator";

    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(htmlPage(
      isFullyConfirmed ? "Booking Confirmed!" : "Confirmation Received",
      isFullyConfirmed
        ? `
          <div class="icon">✅</div>
          <div class="badge" style="background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);color:#22c55e;">FULLY CONFIRMED</div>
          <h1>Booking Confirmed!</h1>
          <p>Both sides have confirmed. Guest <strong>${booking.guestName}</strong> can now proceed to their trip guide.</p>
          <p style="font-family:monospace;font-size:13px;color:#00b4d8;">${id}</p>
        `
        : `
          <div class="icon">👍</div>
          <div class="badge" style="background:rgba(0,180,216,0.15);border:1px solid rgba(0,180,216,0.4);color:#00b4d8;">PENDING</div>
          <h1>Your confirmation received</h1>
          <p>Thank you! As ${roleLabel}, you've confirmed booking for <strong>${booking.guestName}</strong>.</p>
          <p>Waiting for the other side to confirm before the guest is notified.</p>
          <p style="font-family:monospace;font-size:13px;color:#00b4d8;">${id}</p>
        `
    ));
  }

  return res.status(405).json({ error: "Method not allowed" });
}
