// api/partner-calendar.js — Availability calendar per capacity
// GET  ?capacityId=xxx&month=2026-07            x-partner-token  → blocked dates for month
// POST body: { capacityId, dates: ["YYYY-MM-DD",...], blocked: bool }  x-partner-token  → toggle blocks
// GET  ?capacityId=xxx&checkIn=xxx&checkOut=xxx (NO auth) → public availability check

const FB_PROJECT = "molty-portal";
const FB_KEY     = process.env.FIREBASE_API_KEY;

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

function toFields(obj) {
  const f = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "boolean") f[k] = { booleanValue: v };
    else if (typeof v === "number") f[k] = { integerValue: v };
    else if (Array.isArray(v) || typeof v === "object") f[k] = { stringValue: JSON.stringify(v) };
    else f[k] = { stringValue: String(v) };
  }
  return f;
}

function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    const raw = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
    if (typeof raw === "string" && (raw.startsWith("[") || raw.startsWith("{"))) {
      try { out[k] = JSON.parse(raw); continue; } catch {}
    }
    out[k] = raw;
  }
  return out;
}

// ── Auth helper ──────────────────────────────────────────────────
async function authenticate(req) {
  const token = req.headers["x-partner-token"];
  if (!token) return null;
  const session = await fsGet("partner_sessions", token);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null;
  const partner = await fsGet("partners", session.partnerId);
  return partner || null;
}

// ── Date helpers ─────────────────────────────────────────────────
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function datesBetween(checkIn, checkOut) {
  const dates = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  while (cur < end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates; // excludes checkout day (last night = day before checkout)
}

// ── Availability doc key ─────────────────────────────────────────
// One doc per (partnerId, capacityId) — stores all blocked dates as JSON array
function availDocId(partnerId, capacityId) {
  return `${partnerId}_${capacityId}`;
}

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const { capacityId, month, checkIn, checkOut } = req.query || {};

  // ── PUBLIC: availability check for guest booking ──────────────
  // GET ?capacityId=xxx&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
  if (req.method === "GET" && capacityId && checkIn && checkOut) {
    if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
      return res.status(400).json({ error: "Nevažeći datumi" });
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ error: "Dolazak mora biti prije odlaska" });
    }

    // Find which partner owns this capacity (search all availability docs)
    // Simpler: caller must pass partnerId as query param for public check
    const partnerId = req.query.partnerId;
    if (!partnerId) return res.status(400).json({ error: "partnerId je obavezan za javnu provjeru" });

    const doc = await fsGet("partner_availability", availDocId(partnerId, capacityId));
    const blocked = Array.isArray(doc?.blockedDates) ? doc.blockedDates : [];

    const requested = datesBetween(checkIn, checkOut);
    const conflict  = requested.filter(d => blocked.includes(d));

    return res.json({
      ok: true,
      available: conflict.length === 0,
      blockedDays: conflict,
      requestedNights: requested.length,
    });
  }

  // All other operations require authentication
  const partner = await authenticate(req);
  if (!partner) return res.status(401).json({ error: "Nevažeća autentikacija" });

  // ── GET: blocked dates for a month ───────────────────────────
  // GET ?capacityId=xxx&month=2026-07
  if (req.method === "GET" && capacityId && month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Format mjeseca: YYYY-MM" });
    }

    const doc     = await fsGet("partner_availability", availDocId(partner.id, capacityId));
    const blocked = Array.isArray(doc?.blockedDates) ? doc.blockedDates : [];
    const inMonth = blocked.filter(d => d.startsWith(month));

    return res.json({ ok: true, month, capacityId, blockedDates: inMonth });
  }

  // ── POST: toggle block/unblock dates ─────────────────────────
  // POST { capacityId, dates: ["YYYY-MM-DD",...], blocked: true/false }
  if (req.method === "POST") {
    const { capacityId: capId, dates, blocked } = req.body || {};

    if (!capId) return res.status(400).json({ error: "capacityId je obavezan" });
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "dates mora biti neprazan niz" });
    }
    if (dates.length > 366) return res.status(400).json({ error: "Maksimalno 366 datuma odjednom" });

    const invalid = dates.filter(d => !isValidDate(d));
    if (invalid.length > 0) return res.status(400).json({ error: `Nevažeći datumi: ${invalid.slice(0, 5).join(", ")}` });

    // Verify partner owns this capacity
    const caps = Array.isArray(partner.capacities) ? partner.capacities : [];
    const cap  = caps.find(c => c.id === capId);
    if (!cap) return res.status(404).json({ error: "Kapacitet nije pronađen" });

    const docId  = availDocId(partner.id, capId);
    const doc    = await fsGet("partner_availability", docId);
    let existing = Array.isArray(doc?.blockedDates) ? doc.blockedDates : [];

    if (blocked !== false) {
      // Block: merge (no duplicates)
      const toAdd = dates.filter(d => !existing.includes(d));
      existing    = [...existing, ...toAdd].sort();
    } else {
      // Unblock: remove
      const toRemove = new Set(dates);
      existing       = existing.filter(d => !toRemove.has(d));
    }

    await fsSet("partner_availability", docId, {
      partnerId:    partner.id,
      capacityId:   capId,
      blockedDates: existing,
      updatedAt:    new Date().toISOString(),
    });

    return res.json({ ok: true, capacityId: capId, blockedDates: existing });
  }

  return res.status(400).json({ error: "Nepoznata akcija" });
}
