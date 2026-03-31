// api/profile.js — Persist user travel profile across sessions (Firestore-backed)
const ALLOWED = ["https://jadran.ai", "https://monte-negro.ai"];
const FB_PROJECT = "molty-portal";

async function fsRead(key, path) {
  try {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${path}?key=${key}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (!d.fields) return null;
    const o = {};
    for (const [k, v] of Object.entries(d.fields)) {
      o[k] = v.stringValue ?? v.integerValue ?? v.booleanValue ?? null;
    }
    return o;
  } catch { return null; }
}

async function fsWrite(key, path, data) {
  try {
    const body = { fields: {} };
    for (const [k, v] of Object.entries(data)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "number") body.fields[k] = { integerValue: String(Math.round(v)) };
      else if (typeof v === "boolean") body.fields[k] = { booleanValue: v };
      else body.fields[k] = { stringValue: String(v) };
    }
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${path}?key=${key}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    return r.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED.includes(origin) ? origin : ALLOWED[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const FB_KEY = process.env.FIREBASE_API_KEY;
  if (!FB_KEY) return res.status(200).json({ ok: false, reason: "no_key" });

  const deviceId = req.method === "GET"
    ? (req.query.deviceId || "")
    : (req.body?.deviceId || "");

  if (!deviceId || deviceId.length < 4) {
    return res.status(400).json({ error: "deviceId required" });
  }

  const path = `jadran_profiles/${deviceId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  // ── GET — load saved profile ──
  if (req.method === "GET") {
    const profile = await fsRead(FB_KEY, path);
    if (!profile) return res.status(200).json({ ok: true, profile: {} });
    // Convert comma-separated string fields back to arrays
    const arr = (s) => (s || "").split(",").map(x => x.trim()).filter(Boolean);
    return res.status(200).json({
      ok: true,
      profile: {
        ...profile,
        totalMsgs: parseInt(profile.totalMsgs) || 0,
        lastActive: parseInt(profile.lastActive) || 0,
        interests: arr(profile.interests),
        visited: arr(profile.visited),
        avoided: arr(profile.avoided),
        liked: arr(profile.liked),
      },
    });
  }

  // ── POST — save profile ──
  if (req.method === "POST") {
    const p = req.body?.profile;
    if (!p || typeof p !== "object") return res.status(400).json({ error: "profile required" });
    const toArr = (v) => (Array.isArray(v) ? v.join(",") : v || "");
    const flat = {
      niche:       p.niche     || "",
      region:      p.region    || "",
      lang:        p.lang      || "",
      interests:   toArr(p.interests),
      visited:     toArr(p.visited),
      avoided:     toArr(p.avoided),
      liked:       toArr(p.liked),
      totalMsgs:   p.totalMsgs || 0,
      lastActive:  p.lastActive || Date.now(),
      updatedAt:   Date.now(),
    };
    await fsWrite(FB_KEY, path, flat);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
