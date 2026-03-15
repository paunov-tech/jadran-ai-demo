// /api/referral.js — Viral referral engine
// When invited user sends first message, rewards BOTH users with 48h premium
// Uses Firestore REST API (no firebase-admin dependency)

const PROJECT_ID = "molty-portal";
const API_KEY = process.env.FIREBASE_API_KEY;
const REWARD_HOURS = 48;

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

// Rate limit: 30 referral calls/hour per IP
const _refRL = new Map();
function refRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _refRL) { if (now > v.r) _refRL.delete(k); }
  const e = _refRL.get(ip);
  if (!e || now > e.r) { _refRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 30) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin === "https://jadran.ai" ? "https://jadran.ai" : "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const clientIp = (req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  if (!refRateOk(clientIp)) return res.status(429).json({ error: "Too many requests" });

  try {
    const { action, deviceId, invitedBy } = req.body || {};

    // ACTION: convert — invited user sent first message, reward both
    if (action === "convert" && deviceId && invitedBy && deviceId !== invitedBy) {
      // Check if this conversion already happened (prevent abuse)
      const existing = await fsRead(`jadran_referrals/${deviceId}`);
      if (existing?.converted === "true") {
        return res.status(200).json({ ok: true, already: true });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + REWARD_HOURS * 3600000).toISOString();

      // Record the referral
      await fsWrite(`jadran_referrals/${deviceId}`, {
        invitedBy,
        convertedAt: now.toISOString(),
        converted: "true",
      });

      // Reward the INVITER (Hans) — extend or set 48h premium
      const inviterPrem = await fsRead(`jadran_premium/${invitedBy}`);
      const inviterExpiry = inviterPrem?.expiresAt ? new Date(inviterPrem.expiresAt) : now;
      const inviterNewExpiry = new Date(Math.max(inviterExpiry.getTime(), now.getTime()) + REWARD_HOURS * 3600000);
      await fsWrite(`jadran_premium/${invitedBy}`, {
        plan: "referral",
        days: String(REWARD_HOURS / 24),
        region: "all",
        paidAt: now.toISOString(),
        expiresAt: inviterNewExpiry.toISOString(),
        source: "referral_reward",
      });

      // Reward the INVITED user (Jürgen) — 48h premium
      await fsWrite(`jadran_premium/${deviceId}`, {
        plan: "referral",
        days: String(REWARD_HOURS / 24),
        region: "all",
        paidAt: now.toISOString(),
        expiresAt,
        source: "referral_invited",
        invitedBy,
      });

      // Track referral count for inviter
      const stats = await fsRead(`jadran_referral_stats/${invitedBy}`);
      const count = stats?.count ? parseInt(stats.count) + 1 : 1;
      await fsWrite(`jadran_referral_stats/${invitedBy}`, {
        count,
        lastConversion: now.toISOString(),
      });

      console.log(`✅ Referral: ${invitedBy} → ${deviceId} (conversion #${count})`);
      return res.status(200).json({ ok: true, reward: REWARD_HOURS, inviterCount: count });
    }

    // ACTION: stats — check how many referrals a user has
    if (action === "stats" && deviceId) {
      const stats = await fsRead(`jadran_referral_stats/${deviceId}`);
      return res.status(200).json({ count: stats?.count ? parseInt(stats.count) : 0 });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Referral error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
