// api/table-book.js — Restaurant table reservation
// POST { restaurantName, restaurantAddress, restaurantId, date, time, persons,
//        guestName, guestEmail, guestPhone, message, lang }
// → Firestore jadran_table_bookings + email to booking@jadran.ai + guest confirmation

import { randomBytes } from "crypto";

const RESEND_KEY    = process.env.RESEND_API_KEY;
const FB_KEY        = process.env.FIREBASE_API_KEY;
const FB_PROJECT    = "molty-portal";
const BOOKING_EMAIL = "booking@jadran.ai";
const CORS          = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

// Affiliate notification emails — set AFFILIATE_EMAIL_<ID> Vercel env vars
// e.g. AFFILIATE_EMAIL_BLACKJACK, AFFILIATE_EMAIL_EUFEMIJA
function affiliateEmail(affiliateId) {
  if (!affiliateId) return null;
  const key = `AFFILIATE_EMAIL_${affiliateId.toUpperCase()}`;
  return process.env[key] || null;
}

const _rl = new Map();
function rlOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 5) return false;
  e.c++; return true;
}

const B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Array.from(randomBytes(4), b => B32[b % 32]).join("");
  return `TAB-${date}-${rand}`;
}

async function fsWrite(id, data) {
  if (!FB_KEY) return;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v == null) continue;
    if (typeof v === "number") fields[k] = { integerValue: String(v) };
    else fields[k] = { stringValue: String(v) };
  }
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_table_bookings/${id}?key=${FB_KEY}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
  ).catch(() => {});
}

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "JADRAN.ai Booking <booking@jadran.ai>", to, subject, html }),
  }).catch(() => {});
}

function operatorHtml(b) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:system-ui,sans-serif;background:#0a1628;color:#e2e8f0;padding:32px 16px;margin:0}
.w{max-width:520px;margin:0 auto;background:#0f1e35;border:1px solid rgba(14,165,233,0.2);border-radius:16px;overflow:hidden}
.h{background:linear-gradient(135deg,#07111f,#0d2137);padding:24px 32px;text-align:center;border-bottom:1px solid rgba(14,165,233,0.15)}
.logo{font-size:20px;font-family:Georgia,serif;font-weight:700;color:#fff}.logo span{color:#FFB800}
.b{padding:28px 32px}
.id{font-family:monospace;background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-radius:8px;padding:6px 14px;font-size:13px;color:#38bdf8;margin:10px 0;display:inline-block}
.g{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;margin:12px 0}
.l{font-size:10px;color:#64748b;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
.v{font-size:14px;font-weight:600;color:#f0f4f8}
</style></head><body><div class="w">
<div class="h"><div class="logo">JADRAN<span>.ai</span></div><div style="font-size:11px;color:#7a8fa8;margin-top:6px;letter-spacing:1px">NOVA REZERVACIJA STOLA</div></div>
<div class="b">
  <div class="id">${b.id}</div>
  <div style="background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.15);border-radius:10px;padding:14px 16px;margin:12px 0">
    <div class="l">Restoran</div>
    <div class="v" style="font-size:16px">${b.restaurantName}</div>
    ${b.restaurantAddress ? `<div style="font-size:12px;color:#64748b;margin-top:3px">${b.restaurantAddress}</div>` : ""}
  </div>
  <div class="g">
    <div><div class="l">Gost</div><div class="v">${b.guestName}</div></div>
    <div><div class="l">Kontakt</div><div class="v">${b.guestEmail || b.guestPhone || "—"}</div></div>
    <div><div class="l">Datum</div><div class="v">${b.date}</div></div>
    <div><div class="l">Sat</div><div class="v">${b.time}</div></div>
    <div><div class="l">Osoba</div><div class="v">${b.persons}</div></div>
    <div><div class="l">Status</div><div class="v" style="color:#22c55e">Nova</div></div>
  </div>
  ${b.message ? `<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:12px;font-size:13px;color:#94a3b8"><b style="color:#e2e8f0">Poruka:</b> ${b.message}</div>` : ""}
  <p style="font-size:12px;color:#475569;margin-top:16px;text-align:center">Kontaktirajte restoran i proslijedite rezervaciju.</p>
</div></div></body></html>`;
}

function guestHtml(b) {
  const labels = {
    hr: { title: "Rezervacija zaprimljena!", sub: "Vaš zahtjev za stolom je poslan restoranu.", note: "Restoran će Vas kontaktirati za potvrdu. Ako ne dobijete odgovor za 2 sata, obratite se na booking@jadran.ai" },
    en: { title: "Reservation received!", sub: "Your table request has been sent to the restaurant.", note: "The restaurant will contact you to confirm. If no reply within 2 hours, reach out to booking@jadran.ai" },
    de: { title: "Reservierung eingegangen!", sub: "Ihre Tischanfrage wurde ans Restaurant gesendet.", note: "Das Restaurant wird sich zur Bestätigung melden. Bei ausbleibender Antwort: booking@jadran.ai" },
    it: { title: "Prenotazione ricevuta!", sub: "La vostra richiesta è stata inviata al ristorante.", note: "Il ristorante vi contatterà per confermare. Nessuna risposta entro 2 ore? Scrivete a booking@jadran.ai" },
  };
  const L = labels[b.lang] || labels.en;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:32px 16px;margin:0}
.w{max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.h{background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:28px 32px;text-align:center}
.logo{font-size:22px;font-family:Georgia,serif;font-weight:700;color:#fff}.logo span{color:#FFB800}
.b{padding:28px 32px}
.id{font-family:monospace;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;font-size:14px;color:#0284c7;margin:14px auto;display:block;text-align:center}
.g{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border-radius:12px;padding:16px;margin:12px 0}
.l{font-size:10px;color:#94a3b8;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.v{font-size:14px;font-weight:600;color:#0f172a}
.note{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;font-size:13px;color:#15803d;margin:16px 0}
</style></head><body><div class="w">
<div class="h"><div class="logo">JADRAN<span>.ai</span></div><div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px">Table reservation</div></div>
<div class="b">
  <div style="font-size:32px;text-align:center">🍽️</div>
  <h2 style="text-align:center;margin:8px 0 4px;font-size:18px">${L.title}</h2>
  <p style="text-align:center;color:#64748b;font-size:13px;margin:0 0 12px">${L.sub}</p>
  <code class="id">${b.id}</code>
  <div style="text-align:center;font-size:18px;font-weight:700;color:#0f172a;margin:10px 0">${b.restaurantName}</div>
  <div class="g">
    <div><div class="l">Datum / Date</div><div class="v">${b.date}</div></div>
    <div><div class="l">Sat / Time</div><div class="v">${b.time}</div></div>
    <div><div class="l">Osoba / Persons</div><div class="v">${b.persons}</div></div>
    <div><div class="l">Ime / Name</div><div class="v">${b.guestName}</div></div>
  </div>
  <div class="note">✅ ${L.note}</div>
  <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:16px">JADRAN.ai · AI Adriatic Guide</p>
</div></div></body></html>`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "POST only" });

  const ip = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!rlOk(ip)) return res.status(429).json({ error: "Previše zahtjeva. Pokušajte za 1 sat." });

  const {
    restaurantName, restaurantAddress, restaurantId,
    affiliateId,
    date, time, persons,
    guestName, guestEmail, guestPhone, message,
    lang = "hr",
  } = req.body || {};

  if (!restaurantName?.trim() || !date || !time || !guestName?.trim())
    return res.status(400).json({ error: "Required: restaurantName, date, time, guestName" });
  if (!guestEmail?.trim() && !guestPhone?.trim())
    return res.status(400).json({ error: "Required: guestEmail or guestPhone" });

  const id = genId();
  const booking = {
    id,
    restaurantName: restaurantName.trim(),
    restaurantAddress: restaurantAddress || "",
    restaurantId: restaurantId || "",
    affiliateId: affiliateId || "",
    date, time,
    persons: parseInt(persons) || 2,
    guestName: guestName.trim(),
    guestEmail: (guestEmail || "").trim(),
    guestPhone: (guestPhone || "").trim(),
    message: (message || "").trim().slice(0, 400),
    lang,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await fsWrite(id, booking);

  // Always notify Jadran.ai booking desk
  const subj = `[Jadran.ai] Rezervacija stola — ${restaurantName} · ${date} ${time} · ${guestName}`;
  const emails = [ sendEmail(BOOKING_EMAIL, subj, operatorHtml(booking)) ];

  // Also notify affiliate restaurant directly if they have an email configured
  const affEmail = affiliateEmail(affiliateId);
  if (affEmail) {
    emails.push(sendEmail(affEmail, subj, operatorHtml(booking)));
  }

  // Guest confirmation
  if (booking.guestEmail) {
    emails.push(sendEmail(booking.guestEmail,
      `Rezervacija stola — ${restaurantName} · ${date} ${time}`,
      guestHtml(booking)
    ));
  }
  await Promise.all(emails);

  return res.status(200).json({ ok: true, id, booking });
}
