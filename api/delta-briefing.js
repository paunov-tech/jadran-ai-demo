// api/delta-briefing.js — DELTA AI Situational Briefing
// Collects all coast intelligence, sends to Claude Opus 4.6, returns operator situation report
// GET /api/delta-briefing
// Cache: 5 min

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const FB_KEY        = process.env.FIREBASE_API_KEY;
const CORS          = ["https://jadran.ai", "https://monte-negro.ai"];

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 300000; // 5 min

// ─── Reuse same Firestore fetchers as coast-intelligence.js ──────────────────

async function fetchYolo() {
  if (!FB_KEY) return { regions: {}, total: 0 };
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return { regions: {}, total: 0 };
    const data = await r.json();
    if (!data.documents) return { regions: {}, total: 0 };
    const cutoff = Date.now() - 24 * 3600000;
    const regions = {};
    let total = 0;
    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;
      const ts = f.timestamp?.stringValue || "";
      const docId = doc.name.split("/").pop();
      let fresh = false;
      if (ts) { const t = new Date(ts).getTime(); fresh = !isNaN(t) && t > cutoff; }
      // Bez valjanog timestamp-a: skip — ne uključuj stare dokumente
      if (!fresh) continue;
      const sub = f.sub_region?.stringValue || "other";
      const cnt = parseInt(f.raw_count?.integerValue || "0");
      const counts = {};
      if (f.counts?.mapValue?.fields) {
        for (const [k, v] of Object.entries(f.counts.mapValue.fields)) counts[k] = parseInt(v.integerValue || "0");
      }
      if (!regions[sub]) regions[sub] = { objects: 0, cars: 0, persons: 0 };
      regions[sub].objects += cnt;
      regions[sub].cars    += counts.car    || 0;
      regions[sub].persons += counts.person || 0;
      total += cnt;
    }
    return { regions, total };
  } catch { return { regions: {}, total: 0 }; }
}

async function fetchParkingCache() {
  if (!FB_KEY) return {};
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_satellite?key=${FB_KEY}&pageSize=20`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return {};
    const data = await r.json();
    const result = {};
    for (const doc of (data.documents || [])) {
      const id = doc.name.split("/").pop();
      const f  = doc.fields || {};
      result[id] = {
        occupancyPct: parseInt(f.occupancyPct?.integerValue || "0"),
        level:     f.level?.stringValue     || "unknown",
        zoneName:  f.zoneName?.stringValue  || id,
        imageDate: f.imageDate?.stringValue || null,
      };
    }
    return result;
  } catch { return {}; }
}

async function fetchSeaCache() {
  if (!FB_KEY) return {};
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_sea_quality?key=${FB_KEY}&pageSize=20`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!r.ok) return {};
    const data = await r.json();
    const result = {};
    for (const doc of (data.documents || [])) {
      const id = doc.name.split("/").pop();
      const f  = doc.fields || {};
      result[id] = {
        clarity:   f.clarity?.stringValue   || "unknown",
        clarityHR: f.clarityHR?.stringValue || "nepoznato",
        algaeRisk: f.algaeRisk?.stringValue || "none",
        score:     parseInt(f.score?.integerValue || "0"),
        beach:     f.beach?.stringValue     || id,
      };
    }
    return result;
  } catch { return {}; }
}

async function fetchHAK() {
  try {
    const r = await fetch("https://www.hak.hr/info/stanje-na-cestama/feed/", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" },
    });
    if (!r.ok) return [];
    const xml = await r.text();
    const items = [];
    const rx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = rx.exec(xml)) !== null && items.length < 5) {
      const chunk = m[1];
      const title = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(chunk) || /<title>([^<]*)<\/title>/.exec(chunk))?.[1]?.trim() || "";
      if (title) items.push(title);
    }
    return items;
  } catch { return []; }
}

// ─── Build situation prompt ───────────────────────────────────────────────────
function buildSitPrompt(yolo, parking, sea, traffic, ts) {
  const lines = [
    "Ti si operativni AI oficir jadran.ai nadzornog centra za jadransku obalu.",
    "Generiraj KRATKI situacijski izvještaj (max 130 riječi) za operativni tim.",
    "Ton: koncizan, profesionalan, operativan. Navedi TOP prioritete akcije.",
    "",
    `=== SITUACIJSKA SLIKA — ${ts} ===`,
    "",
    "TURISTIČKA GUSTOĆA (YOLO mreža 160+ senzora):",
  ];

  const REGION_NAMES = {
    kvarner: "Kvarner", split_makarska: "Split–Makarska", dubrovnik: "Dubrovnik",
    zadar_sibenik: "Zadar–Šibenik", istra: "Istra", np_plitvice: "NP Plitvice",
    np_krka: "NP Krka", highway: "Autoceste (HAK)", border: "Granice (HAK)",
    other: "Ostalo",
  };
  const LEVEL_HR = { critical: "KRITIČNO", heavy: "jako gusto", moderate: "umjereno", light: "malo", empty: "prazno" };
  function densityLevel(o) {
    return o > 200 ? "critical" : o > 100 ? "heavy" : o > 50 ? "moderate" : o > 10 ? "light" : "empty";
  }

  const regionsSorted = Object.entries(yolo.regions)
    .map(([id, d]) => ({ id, name: REGION_NAMES[id] || id, ...d, level: densityLevel(d.objects) }))
    .sort((a, b) => b.objects - a.objects);

  for (const r of regionsSorted) {
    lines.push(`  ${r.name}: ${r.objects} detekcija (${r.cars} vozila, ${r.persons} osoba) — ${LEVEL_HR[r.level] || r.level}`);
  }
  lines.push(`  UKUPNO: ${yolo.total} detekcija`);

  const criticalParking = Object.entries(parking).filter(([, p]) => p.level === "full" || p.level === "heavy");
  if (criticalParking.length) {
    lines.push("", "PARKING KAPACITETI — KRITIČNE ZONE (Sentinel-2):");
    for (const [, p] of criticalParking) {
      lines.push(`  ${p.zoneName}: ${p.occupancyPct}% — ${p.level === "full" ? "PUNO" : "gusto"}${p.imageDate ? " (snimak " + p.imageDate + ")" : ""}`);
    }
  }

  const seaAlerts = Object.entries(sea).filter(([, s]) => s.algaeRisk === "high" || s.algaeRisk === "moderate");
  if (seaAlerts.length) {
    lines.push("", "MORE — UPOZORENJA:");
    for (const [, s] of seaAlerts) {
      lines.push(`  ${s.beach}: ${s.clarityHR}, alge: ${s.algaeRisk}`);
    }
  }

  if (traffic.length) {
    lines.push("", "HAK PROMET (aktualnih " + traffic.length + " upozorenja):");
    for (const t of traffic.slice(0, 3)) lines.push("  " + t);
  }

  lines.push("", "=== KRAJ PODATAKA ===", "", "Sada generiraj situacijski izvještaj:");
  return lines.join("\n");
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (CORS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")    return res.status(405).json({ error: "Method not allowed" });

  if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
    return res.status(200).json(_cache);
  }

  const ts = new Date().toLocaleString("hr-HR", { timeZone: "Europe/Zagreb", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

  const [yolo, parking, sea, traffic] = await Promise.all([
    fetchYolo(),
    fetchParkingCache(),
    fetchSeaCache(),
    fetchHAK(),
  ]);

  let briefing = "Podaci se učitavaju...";
  let briefingError = null;

  if (ANTHROPIC_KEY) {
    try {
      const prompt = buildSitPrompt(yolo, parking, sea, traffic, ts);
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 300,
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) {
        const data = await r.json();
        briefing = data.content?.[0]?.text?.trim() || "Bez odgovora.";
      } else {
        briefingError = `AI HTTP ${r.status}`;
        briefing = "AI briefing privremeno nedostupan.";
      }
    } catch (e) {
      briefingError = e.message;
      briefing = "AI briefing privremeno nedostupan.";
    }
  } else {
    briefing = "ANTHROPIC_API_KEY nije konfiguriran.";
  }

  // Build quick alert list for the panel
  const alerts = [];
  for (const [id, d] of Object.entries(yolo.regions)) {
    if (d.objects > 200) alerts.push({ severity: "critical", text: `Kritična gužva: ${id} (${d.objects})` });
    else if (d.objects > 100) alerts.push({ severity: "warning", text: `Gužva: ${id} (${d.objects})` });
  }
  for (const [, p] of Object.entries(parking)) {
    if (p.level === "full")  alerts.push({ severity: "critical", text: `Parking pun: ${p.zoneName}` });
    else if (p.level === "heavy") alerts.push({ severity: "warning", text: `Parking gusto: ${p.zoneName} (${p.occupancyPct}%)` });
  }
  for (const [, s] of Object.entries(sea)) {
    if (s.algaeRisk === "high") alerts.push({ severity: "warning", text: `Alge: ${s.beach}` });
  }
  alerts.sort((a, b) => (a.severity === "critical" ? -1 : 1));

  const payload = {
    ts:           new Date().toISOString(),
    briefing,
    alerts:       alerts.slice(0, 10),
    stats: {
      totalDetections: yolo.total,
      criticalRegions: alerts.filter(a => a.severity === "critical" && a.text.includes("gužva")).length,
      fullParkings:    alerts.filter(a => a.text.includes("pun")).length,
      seaAlerts:       alerts.filter(a => a.text.includes("Alge")).length,
      hakItems:        traffic.length,
    },
    ...(briefingError ? { _error: briefingError } : {}),
  };

  _cache   = payload;
  _cacheTs = Date.now();
  return res.status(200).json(payload);
}
