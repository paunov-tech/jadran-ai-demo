// /api/usage.js — Server-side message count by device fingerprint
// Persists in Firestore — survives incognito, cold starts, localStorage clears
// GET  ?fp=xxx         → returns { count, limit, remaining, resetAt }
// POST { fp, action }  → action="increment" bumps count, action="check" just reads

const PROJECT_ID = "molty-portal";
const API_KEY = process.env.FIREBASE_API_KEY;
const FREE_LIMIT = 10;
const RESET_HOURS = 24;

async function fsRead(docPath) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const doc = await r.json();
  if (!doc.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = v.stringValue || v.integerValue || v.booleanValue || null;
  }
  return out;
}

async function fsWrite(docPath, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${API_KEY}`;
  const body = { fields: {} };
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "number") body.fields[k] = { integerValue: String(v) };
    else if (typeof v === "boolean") body.fields[k] = { booleanValue: v };
    else body.fields[k] = { stringValue: String(v) };
  }
  const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.ok;
}

// Rate limit: max 60 usage checks/hour per IP
const _usageRL = new Map();
function usageRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _usageRL) { if (now > v.r) _usageRL.delete(k); }
  const e = _usageRL.get(ip);
  if (!e || now > e.r) { _usageRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 60) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(200).end();

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  if (!usageRateOk(ip)) return res.status(429).json({ error: "Rate limited" });

  if (!API_KEY) return res.status(500).json({ error: "Service unavailable" });

  // GET: check usage
  if (req.method === "GET") {
    const fp = req.query.fp;
    if (!fp || fp.length < 10) return res.status(400).json({ error: "Missing fingerprint" });

    const doc = await fsRead(`jadran_usage/${fp}`);
    if (!doc) {
      return res.status(200).json({ count: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT, resetAt: null });
    }

    const count = parseInt(doc.count) || 0;
    const resetAt = parseInt(doc.resetAt) || 0;
    const now = Date.now();

    // Check if reset period passed
    if (resetAt > 0 && now > resetAt) {
      // Reset counter
      await fsWrite(`jadran_usage/${fp}`, { count: 0, resetAt: 0, lastReset: now, ip });
      return res.status(200).json({ count: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT, resetAt: null });
    }

    const remaining = Math.max(0, FREE_LIMIT - count);
    return res.status(200).json({ count, limit: FREE_LIMIT, remaining, resetAt: resetAt || null });
  }

  // POST: increment or check
  if (req.method === "POST") {
    const { fp, action } = req.body || {};
    if (!fp || fp.length < 10) return res.status(400).json({ error: "Missing fingerprint" });

    const doc = await fsRead(`jadran_usage/${fp}`);
    const now = Date.now();
    let count = parseInt(doc?.count) || 0;
    let resetAt = parseInt(doc?.resetAt) || 0;

    // Auto-reset if period expired
    if (resetAt > 0 && now > resetAt) {
      count = 0;
      resetAt = 0;
    }

    if (action === "increment") {
      count += 1;
      // Set reset timer on first message
      if (count === 1 && !resetAt) {
        resetAt = now + (RESET_HOURS * 3600000);
      }
      await fsWrite(`jadran_usage/${fp}`, { count, resetAt, lastUse: now, ip });
    }

    const remaining = Math.max(0, FREE_LIMIT - count);
    const exhausted = remaining <= 0;
    return res.status(200).json({ count, limit: FREE_LIMIT, remaining, exhausted, resetAt: resetAt || null });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
