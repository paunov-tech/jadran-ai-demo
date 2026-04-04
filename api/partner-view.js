// api/partner-view.js — Increment partner view counter (fire-and-forget)
const ALLOWED = ["https://jadran.ai", "https://monte-negro.ai"];
const FB_PROJECT = "molty-portal";

// IP rate limit: max 20 view events per IP per hour (anti-botnet)
const _ipRL = new Map();
function ipRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  const e = _ipRL.get(ip);
  if (!e || now > e.r) { _ipRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 20) return false;
  e.c++; return true;
}

// Dedup: skip write if same deviceId+partner wrote within 1 hour (per instance)
const _dedup = new Map();
const DEDUP_TTL = 3600000;
function isDup(deviceId, partner) {
  const key = `${deviceId}:${partner}`;
  const now = Date.now();
  const last = _dedup.get(key);
  if (last && now - last < DEDUP_TTL) return true;
  _dedup.set(key, now);
  // Lazy cleanup
  if (_dedup.size > 5000) {
    for (const [k, v] of _dedup) { if (now - v > DEDUP_TTL) _dedup.delete(k); }
  }
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED.includes(origin) ? origin : ALLOWED[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!ipRateOk(clientIp)) return res.status(429).json({ ok: false, error: "rate limited" });

  const FB_KEY = process.env.VITE_FB_API_KEY;
  if (!FB_KEY) return res.status(200).json({ ok: false });

  const { partner, event = "view", lang = "", deviceId = "unknown" } = req.body || {};
  if (!partner) return res.status(400).json({ error: "partner required" });

  // Dedup: repeated QR scans from same device within 1h don't inflate stats
  if (isDup(String(deviceId), String(partner))) return res.status(200).json({ ok: true, dedup: true });

  try {
    const docId = `pv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      fields: {
        partner:  { stringValue: String(partner).slice(0, 40) },
        event:    { stringValue: String(event).slice(0, 40) },
        lang:     { stringValue: String(lang).slice(0, 10) },
        deviceId: { stringValue: String(deviceId).slice(0, 80) },
        ts:       { integerValue: String(Date.now()) },
        day:      { integerValue: String(new Date().getDay()) },
        hour:     { integerValue: String(new Date().getHours()) },
      },
    };
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/jadran_partner_views/${docId}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(5000) }
    );
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
