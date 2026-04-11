// api/partner-auth.js — Partner authentication
// POST ?action=register  { email, password, name, type, city, address, phone }
// POST ?action=login     { email, password } → { token, partner }
// GET  ?action=verify    x-partner-token header → { partner }
// POST ?action=logout    x-partner-token header

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const FB_PROJECT  = "molty-portal";
const FB_KEY      = process.env.VITE_FB_API_KEY;
const TRIAL_ENDS  = "2026-04-30";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-partner-token",
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
        limit: 1,
      }
    };
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents:runQuery?key=${FB_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    const rows = await r.json();
    return rows.filter(row => row.document).map(row => ({ id: row.document.name.split("/").pop(), ...fromFields(row.document.fields) }));
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

// ── Crypto helpers ───────────────────────────────────────────────
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf  = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(password, stored) {
  const [hash, salt] = stored.split(".");
  if (!hash || !salt) return false;
  try {
    const hashBuf    = Buffer.from(hash, "hex");
    const inputBuf   = await scryptAsync(password, salt, 64);
    return timingSafeEqual(hashBuf, inputBuf);
  } catch { return false; }
}

function genToken() {
  return randomBytes(32).toString("hex");
}

function genPartnerId() {
  return "P" + Date.now().toString(36).toUpperCase() + randomBytes(3).toString("hex").toUpperCase();
}

// ── Email helper ─────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "JADRAN.ai <booking@jadran.ai>", to, subject, html }),
  }).catch(() => {});
}

function esc(s) { return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const action = req.query?.action || req.query?.["action"];

  // ── REGISTER ────────────────────────────────────────────────────
  if (action === "register" && req.method === "POST") {
    const { email, password, name, type, city, address, phone } = req.body || {};

    if (!email || !password || !name || !type || !city) {
      return res.status(400).json({ error: "Potrebno: email, password, name, type, city" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Lozinka mora imati najmanje 8 znakova" });
    }

    // Check email already exists
    const existing = await fsQuery("partners", "email", "EQUAL", email.toLowerCase().trim());
    if (existing.length > 0) {
      const prev = existing[0];
      // Allow pending (pre-created from b2b outreach) to complete registration
      if (prev.status === "pending" || prev.verified === false) {
        const passwordHash = await hashPassword(password);
        await fsSet("partners", prev.id, {
          passwordHash,
          name: name || prev.name,
          type: type || prev.type,
          city: city || prev.city,
          address: address || prev.address || "",
          phone: phone || prev.phone || "",
          status: "trial",
          verified: true,
          trialEnds: TRIAL_ENDS,
          updatedAt: new Date().toISOString(),
        });
        const id = prev.id;
        // Notify admin + send welcome email (fall through to shared code below)
        if (ADMIN_EMAIL) {
          await sendEmail(ADMIN_EMAIL, `🆕 Novi partner (b2b): ${name} (${city}) — ${type}`,
            `<p>B2B partner je završio registraciju:</p>
             <ul><li><b>Naziv:</b> ${esc(name)}</li><li><b>Tip:</b> ${esc(type)}</li>
             <li><b>Grad:</b> ${esc(city)}</li><li><b>Email:</b> ${esc(email)}</li>
             <li><b>ID:</b> ${esc(id)}</li></ul>`);
        }
        await sendEmail(email, "Dobrodošli u JADRAN.ai Partner Program!",
          `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
           <div style="background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:32px;text-align:center;border-radius:12px 12px 0 0">
             <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff">JADRAN<span style="color:#FFB800">.ai</span></div>
           </div>
           <div style="padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
             <h2>Vaš račun je aktiviran!</h2>
             <p style="color:#64748b">Prijavite se na <strong>jadran.ai/partner</strong>. Trial period do <strong>${TRIAL_ENDS}</strong>.</p>
           </div></div>`);
        return res.status(201).json({ ok: true, message: "Račun aktiviran. Prijavite se na jadran.ai/partner" });
      }
      return res.status(409).json({ error: "Email već postoji. Prijavite se ili resetujte lozinku." });
    }

    const id           = genPartnerId();
    const passwordHash = await hashPassword(password);

    const partner = {
      id, email: email.toLowerCase().trim(), passwordHash,
      name, type, city,
      address: address || "",
      phone: phone || "",
      status: "trial",
      verified: true,
      trialEnds: TRIAL_ENDS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fsSet("partners", id, partner);

    // Notify admin
    if (ADMIN_EMAIL) {
      await sendEmail(
        ADMIN_EMAIL,
        `🆕 Novi partner: ${name} (${city}) — ${type}`,
        `<p>Novi partner se registrovao na JADRAN.ai:</p>
         <ul><li><b>Naziv:</b> ${esc(name)}</li><li><b>Tip:</b> ${esc(type)}</li>
         <li><b>Grad:</b> ${esc(city)}</li><li><b>Email:</b> ${esc(email)}</li>
         <li><b>ID:</b> ${esc(id)}</li></ul>
         <p>Trial period do ${TRIAL_ENDS}.</p>`
      );
    }

    // Welcome email to partner
    await sendEmail(
      email,
      "Dobrodošli u JADRAN.ai Partner Program!",
      `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
       <div style="background:linear-gradient(135deg,#0a1628,#0f2a4a);padding:32px;text-align:center;border-radius:12px 12px 0 0">
         <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#fff">JADRAN<span style="color:#FFB800">.ai</span></div>
         <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-top:6px">Partner Program</div>
       </div>
       <div style="padding:28px;background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
         <h2 style="font-size:18px;margin:0 0 12px">Vaš račun je kreiran!</h2>
         <p style="color:#64748b;line-height:1.7">Hvala što ste se pridružili JADRAN.ai mreži. Vaš probni period traje do <strong>${TRIAL_ENDS}</strong>.</p>
         <p style="color:#64748b;line-height:1.7">Prijavite se na <strong>jadran.ai/partner</strong> i podesite vaš profil.</p>
         <div style="background:#f8fafc;border-radius:8px;padding:14px 18px;margin:16px 0;font-family:monospace;font-size:13px;color:#0284c7">ID: ${esc(id)}</div>
       </div></div>`
    );

    return res.status(201).json({ ok: true, message: "Račun kreiran. Prijavite se na jadran.ai/partner" });
  }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (action === "login" && req.method === "POST") {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email i lozinka su obavezni" });

    const results = await fsQuery("partners", "email", "EQUAL", email.toLowerCase().trim());
    if (results.length === 0) return res.status(401).json({ error: "Pogrešan email ili lozinka" });

    const partner = results[0];
    const valid   = await verifyPassword(password, partner.passwordHash);
    if (!valid) return res.status(401).json({ error: "Pogrešan email ili lozinka" });

    if (partner.status === "suspended") {
      return res.status(403).json({ error: "Nalog je suspendovan. Kontaktirajte podršku." });
    }
    if (partner.status === "pending" || partner.verified === false) {
      return res.status(403).json({ error: "Nalog čeka verifikaciju. Kontaktirajte nas na partneri@jadran.ai" });
    }

    // Create session
    const token     = genToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    await fsSet("partner_sessions", token, {
      token, partnerId: partner.id, createdAt: new Date().toISOString(), expiresAt,
    });

    // Return partner without sensitive fields
    const { passwordHash: _, ...safe } = partner;
    return res.json({ ok: true, token, partner: safe });
  }

  // ── VERIFY ───────────────────────────────────────────────────────
  if (action === "verify" && req.method === "GET") {
    const token = req.headers["x-partner-token"];
    if (!token) return res.status(401).json({ error: "Token nije proslijeđen" });

    const session = await fsGet("partner_sessions", token);
    if (!session) return res.status(401).json({ error: "Nevažeća sesija" });
    if (new Date(session.expiresAt) < new Date()) return res.status(401).json({ error: "Sesija je istekla" });

    const partner = await fsGet("partners", session.partnerId);
    if (!partner) return res.status(401).json({ error: "Partner nije pronađen" });

    const { passwordHash: _, ...safe } = partner;
    return res.json({ ok: true, partner: safe });
  }

  // ── LOGOUT ───────────────────────────────────────────────────────
  if (action === "logout" && req.method === "POST") {
    const token = req.headers["x-partner-token"];
    if (token) {
      await fsSet("partner_sessions", token, { expiresAt: new Date(0).toISOString() });
    }
    return res.json({ ok: true });
  }

  // ── ADMIN: list all partners ─────────────────────────────────────
  if (action === "admin-list" && req.method === "GET") {
    const raw     = req.headers["x-admin-token"] || "";
    const decoded = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
    if (decoded.trim() !== (process.env.ADMIN_TOKEN || "").trim()) return res.status(401).json({ error: "Zabranjen pristup" });

    try {
      let allDocs = [], pt = null;
      do {
        const u = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/partners?key=${FB_KEY}&pageSize=300${pt ? `&pageToken=${pt}` : ""}`;
        const r2 = await fetch(u);
        if (!r2.ok) return res.status(500).json({ error: "Firestore greška" });
        const data = await r2.json();
        for (const doc of (data.documents || [])) {
          const p = fromFields(doc.fields || {});
          const { passwordHash: _, ...safe } = p;
          allDocs.push({ id: doc.name.split("/").pop(), ...safe });
        }
        pt = data.nextPageToken || null;
      } while (pt);
      return res.json({ ok: true, partners: allDocs });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── ADMIN: suspend / activate partner ────────────────────────────
  if (action === "admin-set-status" && req.method === "POST") {
    const raw     = req.headers["x-admin-token"] || "";
    const decoded = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
    if (decoded.trim() !== (process.env.ADMIN_TOKEN || "").trim()) return res.status(401).json({ error: "Zabranjen pristup" });

    const { partnerId, status } = req.body || {};
    if (!partnerId || !["trial","active","suspended","pending"].includes(status)) {
      return res.status(400).json({ error: "partnerId i status (trial|active|suspended|pending) su obavezni" });
    }
    await fsSet("partners", partnerId, { status, updatedAt: new Date().toISOString() });
    return res.json({ ok: true });
  }

  // ── ADMIN: verify pending partner (activates trial) ───────────────
  if (action === "admin-verify" && req.method === "POST") {
    const raw     = req.headers["x-admin-token"] || "";
    const decoded = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
    if (decoded.trim() !== (process.env.ADMIN_TOKEN || "").trim()) return res.status(401).json({ error: "Zabranjen pristup" });

    const { partnerId } = req.body || {};
    if (!partnerId) return res.status(400).json({ error: "partnerId je obavezan" });

    await fsSet("partners", partnerId, {
      status: "trial",
      verified: true,
      trialEnds: TRIAL_ENDS,
      updatedAt: new Date().toISOString(),
    });
    return res.json({ ok: true });
  }

  // ── ADMIN: b2b-prefill — create pending partner cards from b2b_contacts ──
  if (action === "b2b-prefill" && req.method === "POST") {
    const raw     = req.headers["x-admin-token"] || "";
    const decoded = (() => { try { return Buffer.from(raw, "base64").toString("utf8"); } catch { return raw; } })();
    if (decoded.trim() !== (process.env.ADMIN_TOKEN || "").trim()) return res.status(401).json({ error: "Zabranjen pristup" });

    // Fetch all b2b_contacts (paginated)
    const contacts = [];
    let pageToken = null;
    do {
      const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/b2b_contacts?key=${FB_KEY}&pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const r = await fetch(url);
      const data = await r.json();
      for (const doc of (data.documents || [])) {
        const f = doc.fields || {};
        const s = k => f[k]?.stringValue ?? null;
        const b = k => f[k]?.booleanValue ?? false;
        contacts.push({
          email:      s("email"),
          name:       s("name"),
          objectName: s("objectName"),
          type:       s("type"),
          city:       s("city"),
          region:     s("region"),
          address:    s("address"),
          phone:      s("phone"),
          paused:     b("paused"),
        });
      }
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    let created = 0, skipped = 0, errors = 0;

    for (const c of contacts) {
      if (!c.email || c.paused) { skipped++; continue; }

      // Skip if partner already exists
      const existing = await fsQuery("partners", "email", "EQUAL", c.email.toLowerCase().trim());
      if (existing.length > 0) { skipped++; continue; }

      const id = genPartnerId();
      const ok = await fsSet("partners", id, {
        id,
        email:     c.email.toLowerCase().trim(),
        name:      c.objectName || c.name || c.email,
        type:      c.type || "smještaj",
        city:      c.city || "",
        region:    c.region || "",
        address:   c.address || "",
        phone:     c.phone || "",
        status:    "pending",
        verified:  false,
        source:    "b2b_outreach",
        trialEnds: "2026-12-31",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (ok) created++; else errors++;
    }

    return res.json({ ok: true, total: contacts.length, created, skipped, errors });
  }

  return res.status(400).json({ error: "Nepoznata akcija" });
}
