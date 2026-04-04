// api/partner-bookings.js — Booking inbox + dual-confirm system
// GET  /api/partner-bookings                              x-partner-token → partner's booking list
// POST /api/partner-bookings?action=confirm&id=xxx        x-partner-token → partner confirms
// POST /api/partner-bookings?action=reject&id=xxx         x-partner-token → partner rejects
// POST /api/partner-bookings?action=platform-confirm&id=xxx  x-admin-token → platform confirms
// POST /api/partner-bookings?action=new (PUBLIC, no auth) → guest creates booking request
//   body: { partnerId, capacityId, capacityName, checkIn, checkOut, guests, guestName, guestEmail, guestPhone, lang, note }

const FB_PROJECT   = "molty-portal";
const FB_KEY       = process.env.VITE_FB_API_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const RESEND_FROM  = "JADRAN.ai Booking <booking@jadran.ai>";
const ADMIN_EMAIL  = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-partner-token,x-admin-token",
};

// ── Firestore helpers ────────────────────────────────────────────
async function fsGet(col, id) {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`
    );
    if (!r.ok) return null;
    const doc = await r.json();
    if (!doc.fields) return null;
    return fromFields(doc.fields);
  } catch { return null; }
}

async function fsSet(col, id, data) {
  if (!FB_KEY) return false;
  try {
    const fields = toFields(data);
    const mask = Object.keys(data).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}&${mask}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }
    );
    return r.ok;
  } catch { return false; }
}

async function fsQuery(col, field, op, value) {
  if (!FB_KEY) return [];
  try {
    const body = {
      structuredQuery: {
        from: [{ collectionId: col }],
        where: { fieldFilter: { field: { fieldPath: field }, op, value: { stringValue: value } } },
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: 200,
      }
    };
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const rows = await r.json();
    return rows.filter(row => row.document).map(row => ({
      id: row.document.name.split("/").pop(),
      ...fromFields(row.document.fields),
    }));
  } catch { return []; }
}

function toFields(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "boolean") f[k] = { booleanValue: v };
    else if (typeof v === "number") f[k] = { integerValue: v };
    else f[k] = { stringValue: String(v) };
  }
  return f;
}

function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
  }
  return out;
}

// ── Auth ─────────────────────────────────────────────────────────
async function authenticate(req) {
  const token = req.headers["x-partner-token"];
  if (!token) return null;
  const session = await fsGet("partner_sessions", token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  return await fsGet("partners", session.partnerId);
}

function isAdmin(req) {
  const raw      = req.headers["x-admin-token"] || "";
  const decoded  = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
  return decoded === process.env.ADMIN_TOKEN;
}

// ── Booking ID ───────────────────────────────────────────────────
function genBookingId() {
  return "BK-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
}

// ── Email ────────────────────────────────────────────────────────
function esc(s) { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  }).catch(() => {});
}

function guestConfirmHtml(b) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:32px 20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
  <div style="background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:28px 32px;text-align:center">
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff">JADRAN<span style="color:#FFB800">.ai</span></div>
    <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">Potvrda upita za rezervaciju</div>
  </div>
  <div style="padding:28px 32px">
    <h2 style="font-size:17px;margin:0 0 8px">Upit primljen! ✓</h2>
    <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0 0 20px">
      Vaš upit je zaprimljen. Partner će ga potvrditi u roku od nekoliko sati. Dobiti ćete obavijest emailom.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin-bottom:20px;text-align:center">
      <div style="font-size:10px;color:#16a34a;font-weight:700;letter-spacing:1px">BROJ REZERVACIJE</div>
      <div style="font-family:monospace;font-size:20px;font-weight:800;color:#15803d">${esc(b.id)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <tr><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;color:#64748b">Partner</td><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;font-weight:600;text-align:right">${esc(b.partnerName)}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;color:#64748b">Smještaj/kapacitet</td><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;font-weight:600;text-align:right">${esc(b.capacityName)}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;color:#64748b">Dolazak</td><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;font-weight:600;text-align:right">${esc(b.checkIn)}</td></tr>
      <tr><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;color:#64748b">Odlazak</td><td style="padding:7px 0;border-bottom:1px solid #f1f5f9;font-weight:600;text-align:right">${esc(b.checkOut)}</td></tr>
      <tr><td style="padding:7px 0;color:#64748b">Gosti</td><td style="padding:7px 0;font-weight:600;text-align:right">${esc(b.guests)} osoba</td></tr>
    </table>
  </div>
  <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
    JADRAN.ai · <a href="https://jadran.ai" style="color:#0284c7">jadran.ai</a>
  </div>
</div></body></html>`;
}

function partnerNewBookingHtml(b) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px">
<h2 style="font-size:16px;color:#0a1628">🔔 Novi upit putem JADRAN.ai</h2>
<table style="border-collapse:collapse;font-size:13px;width:100%">
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">ID rezervacije</td><td style="padding:6px 0;font-family:monospace;font-weight:700;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.id)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Kapacitet</td><td style="padding:6px 0;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.capacityName)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Gost</td><td style="padding:6px 0;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.guestName)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Email gosta</td><td style="padding:6px 0;border-bottom:1px solid #e2e8f0;text-align:right"><a href="mailto:${esc(b.guestEmail)}">${esc(b.guestEmail || "—")}</a></td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Telefon</td><td style="padding:6px 0;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.guestPhone || "—")}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Dolazak</td><td style="padding:6px 0;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.checkIn)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Odlazak</td><td style="padding:6px 0;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${esc(b.checkOut)}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b;border-bottom:1px solid #e2e8f0">Noći</td><td style="padding:6px 0;font-weight:600;border-bottom:1px solid #e2e8f0;text-align:right">${esc(String(b.nights))}</td></tr>
  <tr><td style="padding:6px 0;color:#64748b">Gosti</td><td style="padding:6px 0;font-weight:600;text-align:right">${esc(String(b.guests))} osoba</td></tr>
</table>
${b.note ? `<p style="margin-top:16px;font-size:13px;color:#334155"><b>Napomena gosta:</b> ${esc(b.note)}</p>` : ""}
<p style="margin-top:20px;font-size:13px;color:#64748b">Prijavite se na <a href="https://jadran.ai/partner">jadran.ai/partner</a> da potvrdite ili odbijete upit.</p>
</div>`;
}

function guestStatusHtml(b, status) {
  const isOk    = status === "confirmed";
  const color   = isOk ? "#16a34a" : "#dc2626";
  const bgColor = isOk ? "#f0fdf4" : "#fef2f2";
  const border  = isOk ? "#bbf7d0" : "#fecaca";
  const msg     = isOk
    ? "Vaša rezervacija je potvrđena! Vidimo se na Jadranu. 🌊"
    : "Nažalost, kapacitet nije dostupan u odabranom terminu. Pokušajte s drugim datumima.";
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f8fafc;padding:32px 20px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
  <div style="background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:28px 32px;text-align:center">
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#fff">JADRAN<span style="color:#FFB800">.ai</span></div>
  </div>
  <div style="padding:28px 32px">
    <div style="background:${bgColor};border:1px solid ${border};border-radius:10px;padding:16px;margin-bottom:20px;text-align:center">
      <div style="font-size:24px;margin-bottom:6px">${isOk ? "✓" : "✗"}</div>
      <div style="font-size:15px;font-weight:700;color:${color}">${isOk ? "Rezervacija potvrđena" : "Rezervacija odbijena"}</div>
    </div>
    <p style="color:#475569;font-size:13px;line-height:1.7">${msg}</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">Broj rezervacije: <b style="font-family:monospace">${esc(b.id)}</b></p>
  </div>
  <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center">
    JADRAN.ai · <a href="https://jadran.ai" style="color:#0284c7">jadran.ai</a>
  </div>
</div></body></html>`;
}

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query?.action;

  // ── PUBLIC: new booking request ──────────────────────────────
  if (action === "new" && req.method === "POST") {
    const {
      partnerId, capacityId, capacityName,
      checkIn, checkOut, guests,
      guestName, guestEmail, guestPhone, lang, note,
    } = req.body || {};

    if (!partnerId || !capacityId || !checkIn || !checkOut || !guestName) {
      return res.status(400).json({ error: "Obavezno: partnerId, capacityId, checkIn, checkOut, guestName" });
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ error: "Dolazak mora biti prije odlaska" });
    }

    const partner = await fsGet("partners", partnerId);
    if (!partner) return res.status(404).json({ error: "Partner nije pronađen" });

    const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
    const id     = genBookingId();

    const booking = {
      id,
      partnerId,
      partnerName:  partner.name || "",
      partnerEmail: partner.email || "",
      capacityId,
      capacityName: capacityName || capacityId,
      checkIn,
      checkOut,
      nights:       String(nights),
      guests:       String(guests || 1),
      guestName,
      guestEmail:   guestEmail || "",
      guestPhone:   guestPhone || "",
      lang:         lang || "hr",
      note:         note || "",
      // Dual-confirm: both platform + partner must confirm
      status:           "pending",         // pending | partner_confirmed | confirmed | rejected | cancelled
      partnerConfirmed: "false",
      platformConfirmed: "false",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fsSet("partner_bookings", id, booking);

    // Email guest
    if (guestEmail) {
      await sendEmail(
        guestEmail,
        `Upit primljen · ${id} — ${capacityName || capacityId}`,
        guestConfirmHtml(booking)
      );
    }

    // Email partner
    if (partner.email) {
      await sendEmail(
        partner.email,
        `🔔 Novi upit ${id} — ${guestName} · ${checkIn} → ${checkOut}`,
        partnerNewBookingHtml(booking)
      );
    }

    // Notify admin
    if (ADMIN_EMAIL) {
      await sendEmail(
        ADMIN_EMAIL,
        `📋 Novi booking ${id} @ ${partner.name}`,
        partnerNewBookingHtml(booking)
      );
    }

    return res.status(201).json({ ok: true, id });
  }

  // ── GET: partner's booking list ───────────────────────────────
  if (req.method === "GET" && !action) {
    const partner = await authenticate(req);
    if (!partner) return res.status(401).json({ error: "Nevažeća autentikacija" });

    const bookings = await fsQuery("partner_bookings", "partnerId", "EQUAL", partner.id);
    return res.json({ ok: true, bookings });
  }

  // ── PARTNER CONFIRM ───────────────────────────────────────────
  if (action === "confirm" && req.method === "POST") {
    const partner = await authenticate(req);
    if (!partner) return res.status(401).json({ error: "Nevažeća autentikacija" });

    const id      = req.query.id;
    if (!id) return res.status(400).json({ error: "ID rezervacije je obavezan" });

    const booking = await fsGet("partner_bookings", id);
    if (!booking) return res.status(404).json({ error: "Rezervacija nije pronađena" });
    if (booking.partnerId !== partner.id) return res.status(403).json({ error: "Zabranjen pristup" });
    if (booking.status === "rejected" || booking.status === "cancelled") {
      return res.status(409).json({ error: "Rezervacija je već zatvorena" });
    }

    // Partner confirms — check if platform also confirmed
    const bothConfirmed = booking.platformConfirmed === "true";
    const newStatus     = bothConfirmed ? "confirmed" : "partner_confirmed";

    await fsSet("partner_bookings", id, {
      partnerConfirmed: "true",
      status:           newStatus,
      updatedAt:        new Date().toISOString(),
    });

    // If fully confirmed, email guest
    if (bothConfirmed && booking.guestEmail) {
      await sendEmail(
        booking.guestEmail,
        `✓ Rezervacija potvrđena · ${id}`,
        guestStatusHtml({ ...booking }, "confirmed")
      );
    }

    // Notify admin about partner confirmation
    if (ADMIN_EMAIL && !bothConfirmed) {
      await sendEmail(
        ADMIN_EMAIL,
        `✓ Partner potvrdio ${id} — čeka platform potvrdu`,
        `<p style="font-family:system-ui,sans-serif">Partner <b>${esc(partner.name)}</b> potvrdio rezervaciju <b>${esc(id)}</b>.</p>
         <p>Status: partner_confirmed — čeka vašu potvrdu.</p>`
      );
    }

    return res.json({ ok: true, status: newStatus });
  }

  // ── PARTNER REJECT ────────────────────────────────────────────
  if (action === "reject" && req.method === "POST") {
    const partner = await authenticate(req);
    if (!partner) return res.status(401).json({ error: "Nevažeća autentikacija" });

    const id      = req.query.id;
    if (!id) return res.status(400).json({ error: "ID rezervacije je obavezan" });

    const booking = await fsGet("partner_bookings", id);
    if (!booking) return res.status(404).json({ error: "Rezervacija nije pronađena" });
    if (booking.partnerId !== partner.id) return res.status(403).json({ error: "Zabranjen pristup" });

    await fsSet("partner_bookings", id, {
      status:    "rejected",
      updatedAt: new Date().toISOString(),
    });

    // Email guest about rejection
    if (booking.guestEmail) {
      await sendEmail(
        booking.guestEmail,
        `Rezervacija nije dostupna · ${id}`,
        guestStatusHtml(booking, "rejected")
      );
    }

    return res.json({ ok: true, status: "rejected" });
  }

  // ── PLATFORM CONFIRM (admin only) ─────────────────────────────
  if (action === "platform-confirm" && req.method === "POST") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin pristup potreban" });

    const id      = req.query.id;
    if (!id) return res.status(400).json({ error: "ID rezervacije je obavezan" });

    const booking = await fsGet("partner_bookings", id);
    if (!booking) return res.status(404).json({ error: "Rezervacija nije pronađena" });

    const bothConfirmed = booking.partnerConfirmed === "true";
    const newStatus     = bothConfirmed ? "confirmed" : "pending";

    await fsSet("partner_bookings", id, {
      platformConfirmed: "true",
      status:            newStatus,
      updatedAt:         new Date().toISOString(),
    });

    // If fully confirmed, email guest
    if (bothConfirmed && booking.guestEmail) {
      await sendEmail(
        booking.guestEmail,
        `✓ Rezervacija potvrđena · ${id}`,
        guestStatusHtml(booking, "confirmed")
      );
    }

    return res.json({ ok: true, status: newStatus });
  }

  // ── ADMIN: all partner bookings ───────────────────────────────
  if (action === "admin-all" && req.method === "GET") {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin pristup potreban" });
    try {
      const r = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/partner_bookings?key=${FB_KEY}&pageSize=200`
      );
      if (!r.ok) return res.status(500).json({ error: "Firestore greška" });
      const data = await r.json();
      const bookings = (data.documents || []).map(doc => ({
        id: doc.name.split("/").pop(),
        ...fromFields(doc.fields || {}),
      })).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.json({ ok: true, bookings });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "Nepoznata akcija" });
}
