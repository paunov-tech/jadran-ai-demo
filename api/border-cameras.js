// api/border-cameras.js — Border crossing camera intelligence via Claude Vision
// GET /api/border-cameras?transport=auto|kamper|jahta
//
// 1. Fetches promet.si camera list, filters by border crossing keywords
// 2. Downloads each crossing's snapshot → Claude Vision → vehicle count + congestion
// 3. Saves to Firestore jadran_border_cameras/{crossing}_{date}
// 4. Returns aggregated intelligence with transport-aware recommendation
// 5. 10-minute server-side cache

const CORS_ORIGINS = ["https://jadran.ai", "https://monte-negro.ai"];
const CACHE = { data: null, ts: 0 };
const CACHE_TTL = 600000; // 10 min

// ─── Border crossing definitions ─────────────────────────────────────────────

const BORDER_CROSSINGS = {
  karavanke: {
    label: "Karavanke",
    keywords: ["karavanke", "karawanken", "karavanken"],
    lat: 46.497, lng: 13.999,
    note: "Jednosmjerni tunel — izmjenični promet",
    kamperBlocked: true, // height limit 4.1m
  },
  sentilj: {
    label: "Šentilj",
    keywords: ["šentilj", "sentilj", "spielfeld"],
    lat: 46.676, lng: 15.663,
    note: "A1 autocesta · preporučeno za kamper",
  },
  macelj: {
    label: "Macelj",
    keywords: ["macelj", "gruškovje", "gruskovje", "rogatec"],
    lat: 46.196, lng: 15.675,
    note: "A2 autocesta → Hrvatska",
  },
};

// ─── promet.si camera fetch ───────────────────────────────────────────────────

async function fetchCameras() {
  const r = await fetch("https://promet.si/api/v2/cameras", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`promet.si cameras ${r.status}`);
  const data = await r.json();
  return Array.isArray(data) ? data : (data.cameras || data.data || []);
}

function matchCrossing(cam) {
  const title = (cam.title || cam.name || cam.location || "").toLowerCase();
  for (const [key, crossing] of Object.entries(BORDER_CROSSINGS)) {
    if (crossing.keywords.some(kw => title.includes(kw))) return key;
  }
  return null;
}

// ─── Claude Vision: count vehicles in snapshot ───────────────────────────────

async function analyzeSnapshot(snapshotUrl) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { vehicles: 0, congestion: "unknown", wait_minutes: 0 };

  // Fetch the JPEG and base64-encode it
  let imageData = null;
  let mediaType = "image/jpeg";
  try {
    const imgResp = await fetch(snapshotUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "image/*" },
    });
    if (imgResp.ok) {
      const ct = imgResp.headers.get("content-type") || "image/jpeg";
      mediaType = ct.split(";")[0].trim() || "image/jpeg";
      const buf = await imgResp.arrayBuffer();
      imageData = Buffer.from(buf).toString("base64");
    }
  } catch (e) {
    console.warn("Snapshot download failed:", snapshotUrl, e.message);
  }

  if (!imageData) return { vehicles: 0, congestion: "unknown", wait_minutes: 0 };

  const prompt = `Analyze this border crossing traffic camera image.
Count the vehicles (cars, trucks, vans, buses) visible waiting in queue or approaching the crossing booth.
Respond ONLY with this exact JSON (no markdown, no explanation):
{"vehicles": <integer>, "congestion": "free|light|moderate|heavy", "wait_minutes": <integer>}

Rules:
- 0 vehicles in queue = "free", wait_minutes: 0
- 1–5 vehicles = "light", wait_minutes: 5
- 6–20 vehicles = "moderate", wait_minutes: 20
- 21+ vehicles = "heavy", wait_minutes: 40
- If the image is dark, obscured, or unclear, use vehicles: 0 and congestion: "unknown"`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 128,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageData } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
    const data = await resp.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (e) {
    console.error("Claude Vision border camera error:", e.message);
  }
  return { vehicles: 0, congestion: "unknown", wait_minutes: 0 };
}

// ─── Firestore: save result ───────────────────────────────────────────────────

async function saveToFirestore(crossingKey, location, analysis, snapshotUrl) {
  const projectId = "molty-portal";
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return;
  const today = new Date().toISOString().slice(0, 10);
  const docId = `${crossingKey}_${today}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jadran_border_cameras/${docId}?key=${apiKey}`;
  try {
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          camera_id: { stringValue: crossingKey },
          location: { stringValue: location },
          vehicles: { integerValue: String(analysis.vehicles) },
          congestion: { stringValue: analysis.congestion },
          wait_minutes: { integerValue: String(analysis.wait_minutes) },
          snapshot_url: { stringValue: snapshotUrl || "" },
          timestamp: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (e) {
    console.error("Border cameras Firestore save error:", e.message);
  }
}

// ─── Recommendation: transport-aware ─────────────────────────────────────────

function buildRecommendation(results, transport) {
  if (transport === "jahta") {
    return "⛵ Plovi! Za jahte granični prelazi nisu relevantni — prijavite se na prvoj marini u HR (Luka Split, Marina Kaštela ili Marina Trogir).";
  }

  const LABELS = { karavanke: "Karavanke", sentilj: "Šentilj", macelj: "Macelj" };
  const known = Object.entries(results).filter(([, v]) => v.congestion !== "unknown");

  if (!known.length) {
    return transport === "kamper"
      ? "🚐 Kamper: koristite Šentilj (A1) — Karavanke tunel ima visinu 4.1m!"
      : "Podaci o granicama trenutno nisu dostupni — provjeri HAK.hr.";
  }

  if (transport === "kamper") {
    // Kamper: force Šentilj — Karavanke tunnel 4.1m clearance blocks most campervans
    const sentilj = results.sentilj;
    const macelj = results.macelj;
    let best = sentilj || macelj;
    let bestKey = sentilj ? "sentilj" : "macelj";
    if (best && best.congestion !== "unknown") {
      const cong = { free: "slobodan", light: "malo čekanja", moderate: "umjeren red", heavy: "gužva" }[best.congestion] || best.congestion;
      return `🚐 Kamper → ${LABELS[bestKey]} (${cong}, ~${best.wait_minutes} min) ⚠️ KARAVANKE ZATVOREN za kamper (vis. 4.1m)!`;
    }
    return "🚐 Kamper: koristite Šentilj (A1) — Karavanke tunel ima visinu 4.1m!";
  }

  // Auto: recommend fastest known crossing
  const sorted = known.sort((a, b) => a[1].wait_minutes - b[1].wait_minutes);
  const [bestKey, bestVal] = sorted[0];
  const worst = sorted[sorted.length - 1];
  const saved = sorted.length > 1 ? worst[1].wait_minutes - bestVal.wait_minutes : 0;
  const cong = { free: "slobodan", light: "malo čekanja", moderate: "umjeren red", heavy: "gužva" }[bestVal.congestion] || bestVal.congestion;
  let rec = `${LABELS[bestKey]} ${cong} (~${bestVal.wait_minutes} min)`;
  if (saved > 5) rec += ` — ušteda ${saved} min vs. alternative`;
  return rec;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=120");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const transport = req.query.transport || "auto"; // auto | kamper | jahta

  // Jahta: return immediately, no border crossing needed
  if (transport === "jahta") {
    return res.status(200).json({
      crossings: {},
      recommendation: "⛵ Plovi! Za jahte granični prelazi nisu relevantni — prijavite se na prvoj marini u HR.",
      transport: "jahta",
      updated: new Date().toISOString(),
    });
  }

  // Serve cache (recommendation recomputed per transport)
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({
      ...CACHE.data,
      recommendation: buildRecommendation(CACHE.data.crossings, transport),
      transport,
      cached: true,
    });
  }

  // Fetch promet.si cameras
  let allCameras = [];
  try {
    allCameras = await fetchCameras();
  } catch (e) {
    console.warn("promet.si cameras fetch failed:", e.message);
  }

  // Group cameras by crossing
  const groups = { karavanke: [], sentilj: [], macelj: [] };
  for (const cam of allCameras) {
    const key = matchCrossing(cam);
    if (key && groups[key]) groups[key].push(cam);
  }

  // Analyze top camera per crossing in parallel
  const results = {};
  await Promise.all(
    Object.entries(groups).map(async ([key, cams]) => {
      if (!cams.length) {
        results[key] = { vehicles: 0, congestion: "unknown", wait_minutes: 0, snapshot_url: null, source: "no_camera" };
        return;
      }
      const cam = cams[0];
      const snapshotUrl = cam.imageUrl || cam.snapshot_url || cam.url || cam.image || null;
      const location = cam.title || cam.name || key;

      let analysis = { vehicles: 0, congestion: "unknown", wait_minutes: 0 };
      if (snapshotUrl) {
        analysis = await analyzeSnapshot(snapshotUrl);
        // Fire-and-forget Firestore save
        saveToFirestore(key, location, analysis, snapshotUrl).catch(() => {});
      }

      results[key] = {
        vehicles: analysis.vehicles,
        congestion: analysis.congestion,
        wait_minutes: analysis.wait_minutes,
        snapshot_url: snapshotUrl,
        location,
        note: BORDER_CROSSINGS[key]?.note || "",
        source: snapshotUrl ? "promet.si+vision" : "promet.si",
      };
    })
  );

  const response = {
    crossings: results,
    recommendation: buildRecommendation(results, transport),
    transport,
    updated: new Date().toISOString(),
  };

  CACHE.data = { crossings: results, updated: response.updated };
  CACHE.ts = Date.now();
  return res.status(200).json(response);
}
