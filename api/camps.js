// ── CAMPS API — static + Firestore dynamic status ─────────────────────────
// GET /api/camps?region=kvarner&len=8&h=3.5
// Returns: camp list for region, merged with live occupancy from Firestore jadran_camps

import { CAMPS_BY_REGION, buildCampPrompt } from "./camps-data.js";

let _statusCache = null;
let _statusCacheTs = 0;
const STATUS_TTL = 5 * 60 * 1000; // 5 min

async function fetchCampStatus() {
  if (_statusCache && Date.now() - _statusCacheTs < STATUS_TTL) return _statusCache;
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return {};
  try {
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_camps?key=${key}&pageSize=200`;
    const r = await fetch(url);
    if (!r.ok) return {};
    const data = await r.json();
    if (!data.documents) return {};

    const status = {};
    for (const doc of data.documents) {
      const id = doc.name.split("/").pop();
      const f = doc.fields || {};
      status[id] = {
        status: f.status?.stringValue || "open",
        occupancy: parseInt(f.occupancy?.integerValue || "0"),
        notes: f.notes?.stringValue || "",
        lastUpdate: f.lastUpdate?.timestampValue || null,
        approachTraffic: f.approachTraffic?.stringValue || null, // "light"|"moderate"|"heavy"
      };
    }
    _statusCache = status;
    _statusCacheTs = Date.now();
    return status;
  } catch (e) {
    console.error("[camps] Firestore error:", e.message);
    return {};
  }
}

// Exported for use in chat.js
export async function fetchCampData(region, camperLen = 7, camperH = null) {
  const status = await fetchCampStatus();
  return buildCampPrompt(region, status, camperLen, camperH);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

  const region = req.query.region || "kvarner";
  const len = parseFloat(req.query.len) || 7;
  const h = parseFloat(req.query.h) || null;

  const camps = CAMPS_BY_REGION[region] || [];
  const status = await fetchCampStatus();

  // Merge static + dynamic
  const result = camps.map(c => ({
    ...c,
    live: status[c.id] || { status: "open", occupancy: 0 },
  }));

  res.json({
    region,
    count: result.length,
    camps: result,
    promptBlock: buildCampPrompt(region, status, len, h),
    ts: new Date().toISOString(),
  });
}
