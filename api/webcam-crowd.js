// api/webcam-crowd.js — AI crowd counting on Windy webcam preview frames
// POST { webcams: [{id, url, title, region}] }  (max 12 per call)
// Uses Gemini 2.0 Flash vision to count persons + estimate busyness %
// 10-min cache per webcam ID

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CORS = ["https://jadran.ai", "https://www.jadran.ai", "https://monte-negro.ai"];

const _cache = new Map(); // webcamId → { persons, busyness, scene, ts, error }
const CACHE_TTL = 10 * 60 * 1000; // 10 min — matches Windy preview refresh

// ── Fetch image as base64 ──────────────────────────────────────
async function fetchBase64(url) {
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return Buffer.from(buf).toString("base64");
}

// ── Gemini vision call for one frame ──────────────────────────
async function analyzeFrame(id, url) {
  // Return from cache if fresh
  const cached = _cache.get(id);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return { id, ...cached };

  try {
    const b64 = await fetchBase64(url);

    const body = {
      contents: [{
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: b64 } },
          { text: `Analyze this coastal webcam frame. Count all visible people (tourists, swimmers, pedestrians). Estimate how full/busy the location is.

Reply ONLY with valid JSON on a single line:
{"persons":N,"busyness":0-100,"scene":"beach|marina|harbor|promenade|road|panorama|other","confidence":"high|medium|low"}

Rules:
- persons: exact integer count of visible humans (0 if none or image is panorama/no people area)
- busyness: 0=empty, 50=half capacity, 100=packed (use context: beach in summer, marina, etc.)
- scene: what type of location this is
- confidence: high if scene is clear and close-up, low if far/foggy/night` }
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 80 },
    };

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(12000) }
    );
    if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}`);

    const data = await resp.json();
    const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response (may have markdown wrapping)
    const match = raw.match(/\{[^}]+\}/);
    if (!match) throw new Error("No JSON in response: " + raw.slice(0, 80));

    const result = JSON.parse(match[0]);
    const out = {
      persons:    typeof result.persons  === "number" ? result.persons  : 0,
      busyness:   typeof result.busyness === "number" ? result.busyness : 0,
      scene:      result.scene      || "other",
      confidence: result.confidence || "low",
      ts:         Date.now(),
    };
    _cache.set(id, out);
    return { id, ...out };
  } catch (e) {
    const err = { id, persons: null, busyness: null, scene: null, confidence: null, error: e.message, ts: Date.now() };
    _cache.set(id, { ...err, ts: Date.now() });
    return err;
  }
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "POST only" });
  if (!GEMINI_KEY)             return res.status(503).json({ error: "Vision not configured" });

  const { webcams } = req.body || {};
  if (!Array.isArray(webcams) || webcams.length === 0) return res.status(400).json({ error: "webcams[] required" });

  // Cap at 12 per call
  const batch = webcams.slice(0, 12).filter(w => w.id && w.url);

  // Run all in parallel
  const results = await Promise.all(batch.map(w => analyzeFrame(w.id, w.url)));

  return res.status(200).json({
    ts:      new Date().toISOString(),
    results,
    cached:  results.filter(r => !r.error).length,
  });
}
