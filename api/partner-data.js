// api/partner-data.js — Partner profile & capacities CRUD
// GET    /api/partner-data                       → full profile
// PATCH  /api/partner-data                       body: { field updates }
// POST   /api/partner-data?action=add-capacity   body: capacity object
// PATCH  /api/partner-data?action=edit-capacity  body: { id, ...fields }
// DELETE /api/partner-data?action=del-capacity&id=xxx
// POST   /api/partner-data?action=add-photo      body: { url }
// DELETE /api/partner-data?action=del-photo&url=xxx
// All require x-partner-token header

const FB_PROJECT = "molty-portal";
const FB_KEY     = process.env.FIREBASE_API_KEY;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
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

// For fields that contain JSON arrays (capacities, photos), use full document replace
async function fsSetFull(col, id, data) {
  if (!FB_KEY) return false;
  try {
    const fields = toFieldsFull(data);
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${col}/${id}?key=${FB_KEY}`,
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

function toFieldsFull(obj) {
  return toFields(obj);
}

function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    const raw = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
    // Try to parse JSON arrays/objects
    if (typeof raw === "string" && (raw.startsWith("[") || raw.startsWith("{"))) {
      try { out[k] = JSON.parse(raw); continue; } catch {}
    }
    out[k] = raw;
  }
  return out;
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

function genCapacityId() {
  return "cap_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ── Allowed profile fields (whitelist) ──────────────────────────
const PROFILE_FIELDS = new Set([
  "name", "type", "city", "address", "phone", "website",
  "description_hr", "description_de", "description_en", "description_it",
  "hours_hr", "hours_de", "hours_en", "hours_it",
  "amenities",  // JSON array
  "rating", "reviewCount",
  "heroImg", "logo",
]);

// ── Main handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(200).end();

  const partner = await authenticate(req);
  if (!partner) return res.status(401).json({ error: "Nevažeća autentikacija" });

  const action = req.query?.action;

  // ── GET FULL PROFILE ─────────────────────────────────────────────
  if (req.method === "GET" && !action) {
    const { passwordHash: _, ...safe } = partner;
    // Ensure arrays exist
    safe.capacities = safe.capacities || [];
    safe.photos      = safe.photos      || [];
    safe.amenities   = safe.amenities   || [];
    return res.json({ ok: true, partner: safe });
  }

  // ── PATCH PROFILE FIELDS ─────────────────────────────────────────
  if (req.method === "PATCH" && !action) {
    const updates = {};
    for (const [k, v] of Object.entries(req.body || {})) {
      if (PROFILE_FIELDS.has(k)) updates[k] = v;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nema validnih polja za update" });
    updates.updatedAt = new Date().toISOString();
    await fsSet("partners", partner.id, updates);
    return res.json({ ok: true });
  }

  // ── ADD CAPACITY ─────────────────────────────────────────────────
  if (action === "add-capacity" && req.method === "POST") {
    const { name, type, capacity, priceFrom, description, unit } = req.body || {};
    if (!name || !type) return res.status(400).json({ error: "Naziv i tip su obavezni" });

    const caps = Array.isArray(partner.capacities) ? partner.capacities : [];
    if (caps.length >= 50) return res.status(400).json({ error: "Maksimalno 50 kapaciteta" });

    const newCap = {
      id: genCapacityId(),
      name: String(name),
      type: String(type),        // "soba" | "apartman" | "sto" | "parcela" | ...
      capacity: Number(capacity) || 2,
      priceFrom: Number(priceFrom) || 0,
      description: String(description || ""),
      unit: String(unit || "noć"), // "noć" | "h" | "dan"
      active: true,
      createdAt: new Date().toISOString(),
    };

    caps.push(newCap);
    await fsSet("partners", partner.id, { capacities: JSON.stringify(caps), updatedAt: new Date().toISOString() });
    return res.status(201).json({ ok: true, capacity: newCap });
  }

  // ── EDIT CAPACITY ────────────────────────────────────────────────
  if (action === "edit-capacity" && req.method === "PATCH") {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: "ID kapaciteta je obavezan" });

    const caps = Array.isArray(partner.capacities) ? partner.capacities : [];
    const idx  = caps.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: "Kapacitet nije pronađen" });

    const allowed = ["name", "type", "capacity", "priceFrom", "description", "unit", "active"];
    for (const k of allowed) {
      if (updates[k] !== undefined) caps[idx][k] = updates[k];
    }
    caps[idx].updatedAt = new Date().toISOString();

    await fsSet("partners", partner.id, { capacities: JSON.stringify(caps), updatedAt: new Date().toISOString() });
    return res.json({ ok: true, capacity: caps[idx] });
  }

  // ── DELETE CAPACITY ──────────────────────────────────────────────
  if (action === "del-capacity" && req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "ID je obavezan" });

    const caps    = Array.isArray(partner.capacities) ? partner.capacities : [];
    const filtered = caps.filter(c => c.id !== id);
    if (filtered.length === caps.length) return res.status(404).json({ error: "Kapacitet nije pronađen" });

    await fsSet("partners", partner.id, { capacities: JSON.stringify(filtered), updatedAt: new Date().toISOString() });
    return res.json({ ok: true });
  }

  // ── ADD PHOTO ────────────────────────────────────────────────────
  if (action === "add-photo" && req.method === "POST") {
    const { url } = req.body || {};
    if (!url || !url.startsWith("http")) return res.status(400).json({ error: "Nevažeći URL slike" });

    const photos = Array.isArray(partner.photos) ? partner.photos : [];
    if (photos.length >= 10) return res.status(400).json({ error: "Maksimalno 10 fotografija" });
    if (photos.includes(url))  return res.status(409).json({ error: "Fotografija već postoji" });

    photos.push(url);
    await fsSet("partners", partner.id, { photos: JSON.stringify(photos), updatedAt: new Date().toISOString() });
    return res.status(201).json({ ok: true, photos });
  }

  // ── DELETE PHOTO ─────────────────────────────────────────────────
  if (action === "del-photo" && req.method === "DELETE") {
    const url     = req.query.url;
    const photos  = Array.isArray(partner.photos) ? partner.photos : [];
    const filtered = photos.filter(p => p !== url);
    await fsSet("partners", partner.id, { photos: JSON.stringify(filtered), updatedAt: new Date().toISOString() });
    return res.json({ ok: true, photos: filtered });
  }

  return res.status(400).json({ error: "Nepoznata akcija" });
}
