// api/room-book.js — Direct room booking for affiliate partners (no Booking.com)
// POST { roomId, roomName, affiliate, checkIn, checkOut, guests, guestName, guestEmail, lang }
// → saves to Firestore direct_bookings, emails guest + partner

const FB_PROJECT = "molty-portal";
const FB_KEY = process.env.FIREBASE_API_KEY;

async function fsSave(collection, data) {
  if (!FB_KEY) return null;
  try {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "number") fields[k] = { integerValue: v };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else fields[k] = { stringValue: String(v) };
    }
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}/${data.id}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok ? data.id : null;
  } catch { return null; }
}

async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "JADRAN.ai Booking <booking@jadran.ai>", to, subject, html }),
  }).catch(() => {});
}

function esc(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function guestEmailHtml(id, roomName, checkIn, checkOut, guests) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:40px 20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
  <div style="background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:32px 36px;color:#fff;text-align:center">
    <div style="font-size:24px;font-family:Georgia,serif;font-weight:700">JADRAN<span style="color:#FFB800">.ai</span></div>
    <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.65)">Direktna rezervacija · Black Jack, Rab</div>
  </div>
  <div style="padding:32px 36px">
    <h2 style="font-size:18px;margin:0 0 6px">Upit primljen! 📩</h2>
    <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6">Vaš upit za smještaj je primljen. Domaćin će vas kontaktirati u roku 2 sata za potvrdu.</p>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:20px;text-align:center">
      <div style="font-size:11px;color:#94a3b8;font-weight:700;letter-spacing:1px;margin-bottom:4px">BROJ UPITA</div>
      <div style="font-family:monospace;font-size:18px;font-weight:800;color:#0284c7">${esc(id)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">Smještaj</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right">${esc(roomName)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">Dolazak</td><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;text-align:right">${esc(checkIn)}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b">Odlazak</td><td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right">${esc(checkOut)}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#64748b">Gosti</td><td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right">${esc(guests)} osoba</td></tr>
    </table>
  </div>
  <div style="padding:16px 36px;background:#f8fafc;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;text-align:center">
    JADRAN.ai · <a href="https://jadran.ai" style="color:#0284c7">jadran.ai</a>
  </div>
</div></body></html>`;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { roomId, roomName, affiliate, checkIn, checkOut, guests, guestName, guestEmail, lang } = req.body || {};

  if (!roomId || !checkIn || !checkOut || !guestName) {
    return res.status(400).json({ error: "Required: roomId, checkIn, checkOut, guestName" });
  }

  const id = `BJ-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));

  const record = {
    id, type: "direct_room_booking",
    affiliate: affiliate || "blackjack",
    roomId, roomName: roomName || roomId,
    checkIn, checkOut,
    nights: String(nights),
    guests: String(guests || 1),
    guestName, guestEmail: guestEmail || "",
    lang: lang || "hr", status: "pending",
    createdAt: new Date().toISOString(),
  };

  await fsSave("direct_bookings", record);

  // Email guest confirmation
  if (guestEmail) {
    await sendEmail(
      guestEmail,
      `Upit primljen · ${id} — ${roomName || roomId} · Black Jack, Rab`,
      guestEmailHtml(id, roomName || roomId, checkIn, checkOut, guests || 1)
    );
  }

  // Notify partner
  const partnerEmail = process.env.BJ_EMAIL || process.env.PARTNER_EMAIL_BLACKJACK;
  if (partnerEmail) {
    await sendEmail(
      partnerEmail,
      `🔔 Novi upit ${id} — ${guestName} · ${checkIn} → ${checkOut}`,
      `<p style="font-family:system-ui,sans-serif">Novi direktni upit putem <b>JADRAN.ai</b></p>
<ul style="font-family:system-ui,sans-serif;line-height:1.9">
  <li><b>ID:</b> ${esc(id)}</li>
  <li><b>Soba:</b> ${esc(roomName || roomId)}</li>
  <li><b>Gost:</b> ${esc(guestName)}</li>
  <li><b>Email:</b> ${esc(guestEmail || "—")}</li>
  <li><b>Dolazak:</b> ${esc(checkIn)}</li>
  <li><b>Odlazak:</b> ${esc(checkOut)}</li>
  <li><b>Gosti:</b> ${esc(String(guests || 1))} osoba</li>
  <li><b>Noći:</b> ${nights}</li>
</ul>`
    );
  }

  return res.json({ ok: true, id });
}
