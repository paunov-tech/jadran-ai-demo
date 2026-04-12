// api/delta-big-eye.js — DELTA BIG EYE™  Obalna vizija: Split Riva, marine, plaže
// GET /api/delta-big-eye?action=process&region=X&batch=N  (x-admin-token ili CRON_SECRET)
// GET /api/delta-big-eye?action=read                      (public — cached Firestore docs)

const GEMINI_KEY  = process.env.GEMINI_API_KEY;
const FB_KEY      = process.env.FIREBASE_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const FB_PROJECT  = "molty-portal";
const COLLECTION  = "jadran_big_eye";
const CORS        = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

// ── Camera Registry ────────────────────────────────────────────────────────────
// Only cameras with confirmed working snapshot URLs (tested 2026-04-12)
const CAMERAS = [
  // Split–Makarska (prioritet 1 — DACH turisti najviše pitaju za Split)
  { id: "split_riva",     region: "split_makarska", label: "Split Riva",          snap: "https://cdn.whatsupcams.com/snapshot/hr_split07.jpg" },
  { id: "split_marina",   region: "split_makarska", label: "Split Marina",        snap: "https://cdn.whatsupcams.com/snapshot/hr_kastel3.jpg" },
  { id: "makarska_riva",  region: "split_makarska", label: "Makarska Riva",       snap: "https://cdn.whatsupcams.com/snapshot/hr_makarskariva01.jpg" },
  { id: "hvar_riva",      region: "split_makarska", label: "Hvar Riva",           snap: "https://cdn.whatsupcams.com/snapshot/hr_vira01.jpg" },
  { id: "brac_bol",       region: "split_makarska", label: "Brač Bol Zlatni Rat", snap: "https://cdn.whatsupcams.com/snapshot/hr_bol03.jpg" },
  // Kvarner / Rab (prioritet 1 — pilot TZ partner)
  { id: "rab_centar",     region: "kvarner",         label: "Rab Stari grad",      snap: "https://cdn.whatsupcams.com/snapshot/hr_rab01.jpg" },
  // Dubrovnik
  { id: "dubrovnik_riva", region: "dubrovnik",       label: "Dubrovnik Stradun",   snap: "https://cdn.whatsupcams.com/snapshot/hr_dubrovnik07.jpg" },
  // Zadar–Šibenik (marine — jedriliče i charter)
  { id: "zadar_marina",   region: "zadar_sibenik",   label: "Zadar Marina",        snap: "https://cdn.whatsupcams.com/snapshot/hr_zadar5.jpg" },
  { id: "sibenik_marina", region: "zadar_sibenik",   label: "Šibenik Marina",      snap: "https://cdn.whatsupcams.com/snapshot/hr_sibenik02.jpg" },
  // Istra
  { id: "rovinj_marina",  region: "istra",           label: "Rovinj Marina",       snap: "https://cdn.whatsupcams.com/snapshot/hr_rovinj4.jpg" },
];

// ── Vision prompt (ne mijenjati — testiran) ────────────────────────────────────
const VISION_PROMPT = `Analyze this webcam image from the Croatian Adriatic coast.
Count ONLY what is clearly visible. Respond in JSON only, no other text:
{
  "persons": <0-500, visible people/tourists>,
  "vehicles": <0-200, cars/buses/trucks on roads or parking>,
  "boats": <0-100, boats/yachts in marina or sea>,
  "crowd_level": <"empty"|"low"|"moderate"|"busy"|"packed">,
  "crowd_pct": <0-100, estimated occupancy percentage>,
  "visibility": <"clear"|"hazy"|"foggy"|"dark"|"offline">,
  "notes": <"" or brief observation max 10 words>
}
If image is offline/black/unavailable: {"visibility":"offline"}`;

// ── Firestore helpers ──────────────────────────────────────────────────────────
async function fsRead() {
  if (!FB_KEY) return [];
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${COLLECTION}?key=${FB_KEY}&pageSize=50`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.documents || []).map(doc => {
      const f  = doc.fields || {};
      const id = doc.name.split("/").pop();
      return {
        id,
        region:      f.region?.stringValue      || "",
        label:       f.label?.stringValue        || id,
        snap:        f.snap?.stringValue         || "",
        persons:     parseInt(f.persons?.integerValue  || f.persons?.doubleValue  || "0"),
        vehicles:    parseInt(f.vehicles?.integerValue || f.vehicles?.doubleValue || "0"),
        boats:       parseInt(f.boats?.integerValue    || f.boats?.doubleValue    || "0"),
        crowd_level: f.crowd_level?.stringValue  || "empty",
        crowd_pct:   parseInt(f.crowd_pct?.integerValue || f.crowd_pct?.doubleValue || "0"),
        visibility:  f.visibility?.stringValue   || "clear",
        notes:       f.notes?.stringValue        || "",
        ts:          f.ts?.stringValue           || "",
      };
    });
  } catch { return []; }
}

async function fsSave(cam, analysis) {
  if (!FB_KEY) return;
  const body = {
    fields: {
      region:      { stringValue:  cam.region },
      label:       { stringValue:  cam.label  },
      snap:        { stringValue:  cam.snap   },
      persons:     { integerValue: String(analysis.persons     ?? 0) },
      vehicles:    { integerValue: String(analysis.vehicles    ?? 0) },
      boats:       { integerValue: String(analysis.boats       ?? 0) },
      crowd_level: { stringValue:  analysis.crowd_level || "empty" },
      crowd_pct:   { integerValue: String(analysis.crowd_pct   ?? 0) },
      visibility:  { stringValue:  analysis.visibility  || "clear" },
      notes:       { stringValue:  analysis.notes       || "" },
      ts:          { stringValue:  new Date().toISOString() },
    },
  };
  try {
    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${COLLECTION}/${cam.id}?key=${FB_KEY}`,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) }
    );
  } catch {}
}

// ── Gemini Flash Vision ────────────────────────────────────────────────────────
async function fetchSnapshot(url) {
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer()).toString("base64");
}

async function analyzeWithGemini(base64) {
  if (!GEMINI_KEY) throw new Error("no GEMINI_API_KEY");
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64 } },
          { text: VISION_PROMPT },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 120 },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );
  if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);
  const data  = await resp.json();
  const raw   = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const match = raw.match(/\{[\s\S]*?\}/);
  if (!match) throw new Error("No JSON in Gemini response: " + raw.slice(0, 100));
  return JSON.parse(match[0]);
}

// ── Batch processor ────────────────────────────────────────────────────────────
async function processBatch(region, batchSize) {
  const pool  = region ? CAMERAS.filter(c => c.region === region) : CAMERAS;
  const batch = pool.slice(0, batchSize || 5);
  const results = [];
  for (const cam of batch) {
    try {
      const b64      = await fetchSnapshot(cam.snap);
      const analysis = await analyzeWithGemini(b64);
      if (analysis.visibility !== "offline") await fsSave(cam, analysis);
      results.push({ id: cam.id, status: analysis.visibility === "offline" ? "offline" : "ok", ...analysis });
    } catch (e) {
      results.push({ id: cam.id, status: "error", error: e.message });
    }
  }
  return results;
}

// ── buildBigEyePrompt — used by chat.js to inject into AI system prompt ────────
export async function buildBigEyePrompt() {
  const docs = await fsRead();
  const live = docs.filter(d => d.visibility !== "offline" && d.ts);
  if (!live.length) return null;
  const lines = live.map(d =>
    `  ${d.label}: ${d.crowd_pct}% popunjenost, ${d.persons} osoba${d.boats > 0 ? `, ${d.boats} brodova` : ""} (${d.crowd_level})`
  );
  return `## BIG EYE — Live obalne kamere (Gemini Vision)\n${lines.join("\n")}`;
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (CORS.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const { action = "read", region = "", batch = "5" } = req.query;

  if (action === "process") {
    const token = req.headers["x-admin-token"] || req.query.token || "";
    if (CRON_SECRET && token !== CRON_SECRET) return res.status(401).json({ error: "unauthorized" });
    try {
      const results = await processBatch(region || null, parseInt(batch) || 5);
      return res.json({ ok: true, processed: results.length, results });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // action=read — public, returns cached Firestore docs
  const docs = await fsRead();
  return res.json({ ok: true, count: docs.length, cameras: docs });
}
