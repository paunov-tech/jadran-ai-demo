// api/pulse.js — JADRAN.AI Proactive Intelligence Pulse
// Every 3 min: GPS position + segment + YOLO + HERE Traffic + Weather → Claude Haiku → 1-2 sentence guide card
// This is the BRAIN — transforms raw data into a personal travel companion voice

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const HERE_KEY = process.env.HERE_API_KEY || "0baWwk3UMqKmttJIQWhv-ocxS7vOFncDkbLKb68JKxw";
const FB_KEY = process.env.FIREBASE_API_KEY;
const CORS = ["https://jadran.ai", "https://monte-negro.ai"];

// Cache to avoid hammering Claude on identical positions
let CACHE = { key: "", data: null, ts: 0 };
const CACHE_TTL = 120000; // 2 min

// ── Route corridor detection — determines which highways and tunnels are on the route ──
function detectRouteCorridor(fromCity, destCity, fromLat, fromLng, destLat, destLng) {
  const from = (fromCity || "").toLowerCase();
  const dest = (destCity || "").toLowerCase();
  const all = from + " " + dest;

  // Istra route: A8/A9, Učka tunnel
  const istra = ["pula", "poreč", "porec", "rovinj", "umag", "novigrad", "rabac", "medulin", "pazin", "labin"];
  const isIstra = istra.some(c => all.includes(c));

  // Kvarner route: A6, possible A7
  const kvarner = ["rijeka", "opatija", "crikvenica", "krk", "rab", "cres", "lošinj", "losinj", "senj"];
  const isKvarner = kvarner.some(c => all.includes(c));

  // South Dalmatia: A1 full
  const dalmatia = ["split", "trogir", "makarska", "dubrovnik", "zadar", "šibenik", "sibenik", "omiš", "omis", "bol", "hvar", "korčula", "korcula", "vis", "ploče", "ploce"];
  const isDalmatia = dalmatia.some(c => all.includes(c));

  const highways = [];
  const tunnels = [];

  // From Austria
  if (destLat && destLat < 46.4 && fromLat && fromLat > 46.5) {
    if (fromLng > 14.5) highways.push("AT A2 Süd");
    highways.push("Karavanke ili Spielfeld");
  }

  // Through Slovenia
  if ((fromLat > 45.5 && destLat < 46) || from.includes("maribor") || from.includes("ljubljana")) {
    highways.push("SLO A1/A2 (DARS)");
    if (isIstra) {
      highways.push("SLO A1 → HR A7 Rupa → A8 Istra");
      tunnels.push("Učka 5062m (4.5m)");
    }
  }

  // Croatian highways
  if (isDalmatia) {
    highways.push("HR A1 Zagreb→Split→Dubrovnik");
    tunnels.push("Mala Kapela 5780m (4.2m)", "Sv. Rok 5679m (4.2m)");
  }
  if (isKvarner && !isIstra) {
    highways.push("HR A6 Bosiljevo→Rijeka");
  }
  if (isIstra) {
    highways.push("HR A8/A9 Istarski ipsilon");
    if (!tunnels.includes("Učka 5062m (4.5m)")) tunnels.push("Učka 5062m (4.5m)");
  }

  // Fallback
  if (highways.length === 0) highways.push("nije određen");

  return { highways, tunnels };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { lat, lng, segment, lang, fromCity, fromLat, fromLng, destCity, destLat, destLng, distToDest, etaMin, speed, country } = req.body || {};
  if (!lat || !lng) return res.status(400).json({ error: "lat/lng required" });

  const seg = segment || "par";
  const lk = lang || "hr";
  const cacheKey = `${Math.round(lat * 10)}_${Math.round(lng * 10)}_${seg}`;

  if (CACHE.data && CACHE.key === cacheKey && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  // ── Determine route corridor (which highways are on this route) ──
  const routeCorridor = detectRouteCorridor(fromCity, destCity, fromLat, fromLng, destLat, destLng);

  // ── Parallel data fetch (all fail gracefully) ──
  const [trafficRes, yoloRes, weatherRes] = await Promise.allSettled([
    fetchNearbyTraffic(lat, lng),
    fetchNearbyYolo(lat, lng),
    fetchWeather(lat, lng),
  ]);

  const traffic = trafficRes.status === "fulfilled" ? trafficRes.value : [];
  const yolo = yoloRes.status === "fulfilled" ? yoloRes.value : null;
  const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;

  // ── Build context for Claude ──
  const hour = new Date().toLocaleString("en", { timeZone: "Europe/Zagreb", hour: "numeric", hour12: false });
  const dayOfWeek = new Date().toLocaleString("en", { timeZone: "Europe/Zagreb", weekday: "long" });

  let context = `RUTA: ${fromCity || "?"} → ${destCity || "?"}`;
  context += `\nKORIDOR: ${routeCorridor.highways.join(" → ")}`;
  context += `\nTUNELI NA OVOJ RUTI: ${routeCorridor.tunnels.length > 0 ? routeCorridor.tunnels.join(", ") : "nema"}`;
  context += `\nPOZICIJA: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
  if (country) context += ` (${country})`;
  if (distToDest) context += `\nDO CILJA: ${Math.round(distToDest)} km`;
  if (etaMin) context += ` (~${etaMin} min)`;
  if (speed) context += `\nBRZINA: ${Math.round(speed * 3.6)} km/h`;
  context += `\nVRIJEME: ${dayOfWeek}, ${hour}:00h`;
  context += `\nSEGMENT: ${seg}`;
  context += `\n\nVAŽNO: Govori SAMO o tunelima i autoputevima koji su NA OVOJ RUTI (${routeCorridor.highways.join(", ")}). NE spominji tunele/autoputeve koji NISU na ruti!`;

  if (traffic.length > 0) {
    context += `\n\nPROMET (HERE Traffic, ${traffic.length} incidenata u blizini):`;
    traffic.slice(0, 5).forEach(t => {
      context += `\n- ${t.type}: ${t.desc}${t.road ? ` (${t.road})` : ""}`;
    });
  } else {
    context += "\n\nPROMET: Nema prijavljenih incidenata u blizini.";
  }

  if (yolo) {
    context += `\n\nYOLO KAMERE (${yolo.activeCams} aktivnih od 166):`;
    if (yolo.totalCars > 0 || yolo.totalPersons > 0) {
      context += ` ukupno ${yolo.totalCars} vozila, ${yolo.totalPersons} osoba`;
    }
    if (yolo.regionSummary) context += `\n${yolo.regionSummary}`;
    if (yolo.busiestCam) context += `\nNajaktivnija kamera: ${yolo.busiestCam}`;
  }

  if (weather) {
    context += `\n\nVRIJEME: ${weather.temp}°C, ${weather.condition}`;
    if (weather.wind > 30) context += `, VJETAR ${weather.wind} km/h!`;
    else if (weather.wind > 0) context += `, vjetar ${weather.wind} km/h`;
    if (weather.gusts > 60) context += ` ⚠️ UDARI DO ${weather.gusts} km/h`;
  }

  // ── Claude Haiku generates the pulse ──
  const systemPrompt = buildSystemPrompt(seg, lk);
  const userPrompt = context;

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 280,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(4000),
    });

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "";

    const result = {
      pulse: text,
      sources: {
        traffic: traffic.length,
        yolo: yolo?.activeCams || 0,
        weather: !!weather,
      },
      ts: new Date().toISOString(),
    };

    CACHE = { key: cacheKey, data: result, ts: Date.now() };
    return res.status(200).json(result);
  } catch (e) {
    console.error("pulse: AI error:", e.message);
    return res.status(200).json({ pulse: "", error: e.message, ts: new Date().toISOString() });
  }
}

// ── System prompt per segment + language ──
function buildSystemPrompt(seg, lang) {
  const langInstr = lang === "de" || lang === "at" ? "Antworte auf Deutsch." :
    lang === "en" ? "Respond in English." :
    lang === "it" ? "Rispondi in italiano." :
    "Odgovaraj na hrvatskom.";

  const segPersona = {
    kamper: "Ti si iskusni kamper vodič. Prioritet: tuneli (visine!), LPG stanice, dump stanice, bura, parkiranje kampera, naplatne rampe. Koristi direktan, praktičan ton. Ako je bura — upozori hitno.",
    porodica: "Ti si prijateljski obiteljski vodič. Prioritet: WC pauze, dječje plaže, restorani s igračkama, sigurnost. Koristi topao, strpljiv ton. Predloži pauze svakih 2h.",
    par: "Ti si elegantan insider vodič za parove. Prioritet: romantični viewpointi, vinarije, restorani, zalasci sunca. Koristi šarmantan, insajderski ton. Predloži skretanja koja se pamte.",
    jedrilicar: "Ti si pomorski vodič. Prioritet: vjetar (maestral, bura, jugo), marine, sidrišta, VHF kanali, gorivo. Koristi nautičku terminologiju. Bofori, čvorovi, ne km/h.",
  };

  return `Ti si JADRAN AI — proaktivni turistički vodič za jadransku obalu.
${langInstr}

TVOJA ROLA: ${segPersona[seg] || segPersona.par}

ČINJENICE — KORISTI SAMO OVE PODATKE, NE IZMIŠLJAJ:
Tuneli na A1 Zagreb→Split→Dubrovnik: Sv. Rok 5679m 4.2m, Mala Kapela 5780m 4.2m
Tunel na A8 Rijeka→Istra (Pula/Poreč/Rovinj): Učka 5062m 4.5m
Tuneli AT→SLO: Karavanke 7948m 4.1m (A2), Ljubelj 1570m 3.8m (regionalna)
VAŽNO: Učka je SAMO na ruti prema Istri, NE na A1 prema Splitu! Sv.Rok i Mala Kapela su SAMO na A1!
LPG stanice: Villach (AT), Ljubljana BTC (SI), Zagreb Jankomir (HR), Karlovac (HR), Zadar (HR), Split Duje (HR)
Dump stanice: Villach Camping, Krk Ježevac, Stobreč (Split), Solitudo (Dubrovnik), Borik (Zadar), Veštar (Rovinj)
ACI marine VHF Ch 17: Split (355 vez), Dubrovnik (380), Trogir (174), Zadar (300), Pula (192), Korčula (159)
Dječje plaže: Nin Kraljičina (pijesak+plitko), Lopar Rajska (Rab), Sakarun (Dugi Otok)
Romantično: Bled (15min skretanje A2), Motovun (tartufi), Pelješac vinska cesta, Biokovo Skywalk 1228m
Odmorišta A1: Otočac, Brinje, Jasenice (Velebit pogled)
McDonald's ruta: Graz Süd, Ljubljana BTC, Zagreb Jankomir, Mall of Split
Bura zone: Senj magistrala (zabrana >5m pri >80km/h), Maslenica most, Krčki most
Schengen: AT/SLO/HR — NEMA granice, ali moguće vanredne kontrole i gužve (posebno ljeti subotom)

PRAVILA:
1. Odgovor MORA biti 1-3 kratke rečenice. Nikad duže.
2. Počni sa trenutnom situacijom — NE pozdravljaj, NE predstavljaj se.
3. Ako je sve mirno: predloži nešto u blizini (restoran, plaža, viewpoint).
4. Ako ima incidenata: upozori i predloži alternativu.
5. Ako je bura ili oluja: HITNO upozorenje na prvom mjestu.
6. Ako je blizu destinacije (<10km): daj parking/marina savjet.
7. Nikad ne reci "prema mojim podacima" — govori prirodno kao lokalni prijatelj.
8. Koristi emoji diskretno — max 1-2 po odgovoru.
9. NIKAD ne ponavljaj istu preporuku — svaki pulse mora biti svjež.
10. Ako nema ništa relevantno — daj fun fact o regiji kroz koju prolaze.
11. NIKAD ne izmišljaj brojeve (visine, udaljenosti) — koristi samo ČINJENICE iznad.`;
}

// ── Data fetchers (same as guide.js, but scoped to nearby area) ──

async function fetchNearbyTraffic(lat, lng) {
  try {
    const fLat = parseFloat(lat), fLng = parseFloat(lng);
    const minLat = fLat - 0.4, maxLat = fLat + 0.4;
    const minLng = fLng - 0.4, maxLng = fLng + 0.4;
    const url = `https://data.traffic.hereapi.com/v7/incidents?in=bbox:${minLat},${minLng};${maxLat},${maxLng}&apiKey=${HERE_KEY}`;
    console.log("pulse: HERE url:", url.replace(HERE_KEY, "KEY"));
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) { const body = await r.text().catch(()=>""); console.warn("pulse: HERE Traffic", r.status, body.slice(0,200)); return []; }
    const data = await r.json();
    const results = (data.results || []).map(i => ({
      type: i.incidentDetails?.type || "UNKNOWN",
      desc: i.incidentDetails?.description?.value || "",
      road: i.location?.description?.value || "",
      severity: i.incidentDetails?.criticality || "minor",
    })).filter(i => i.desc).slice(0, 10);
    console.log(`pulse: HERE Traffic OK — ${results.length} incidents`);
    return results;
  } catch (e) { console.warn("pulse: HERE Traffic error:", e.message); return []; }
}

// YOLO cache — Firestore 429 (guide.js 5K calls drain quota)
let YOLO_CACHE = { data: null, ts: 0 };
const YOLO_CACHE_TTL = 180000; // 3 min

async function fetchNearbyYolo(lat, lng) {
  // Return cached if fresh
  if (YOLO_CACHE.data && Date.now() - YOLO_CACHE.ts < YOLO_CACHE_TTL) {
    console.log("pulse: YOLO cached");
    return YOLO_CACHE.data;
  }
  if (!FB_KEY) { console.warn("pulse: YOLO skipped — no FIREBASE_API_KEY"); return null; }
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) { console.warn("pulse: YOLO Firestore", r.status); return null; }
    const data = await r.json();
    if (!data.documents) { console.warn("pulse: YOLO — no documents"); return null; }

    let totalCars = 0, totalPersons = 0, activeCams = 0, busiestCam = null, busiestCount = 0;
    const regions = {};
    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;
      const cnt = parseInt(f.raw_count?.integerValue || "0");
      if (cnt === 0) continue;
      activeCams++;
      const cars = parseInt(f.counts?.mapValue?.fields?.car?.integerValue || "0");
      const persons = parseInt(f.counts?.mapValue?.fields?.person?.integerValue || "0");
      totalCars += cars;
      totalPersons += persons;
      const sub = f.sub_region?.stringValue || "other";
      if (!regions[sub]) regions[sub] = { cars: 0, persons: 0, total: 0 };
      regions[sub].cars += cars;
      regions[sub].persons += persons;
      regions[sub].total += cnt;
      const camName = f.camera_id?.stringValue || doc.name.split("/").pop();
      if (cnt > busiestCount) { busiestCount = cnt; busiestCam = `${camName} (${cnt} obj)`; }
    }
    const regionSummary = Object.entries(regions)
      .filter(([_, d]) => d.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([r, d]) => `${r}: ${d.cars} vozila, ${d.persons} osoba`)
      .join("; ");
    console.log(`pulse: YOLO OK — ${activeCams} active, ${data.documents.length} docs`);
    const result = { activeCams, totalCars, totalPersons, busiestCam, regionSummary };
    YOLO_CACHE = { data: result, ts: Date.now() };
    return result;
  } catch (e) { console.warn("pulse: YOLO error:", e.message); return null; }
}

async function fetchWeather(lat, lng) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe/Zagreb`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) { console.warn("pulse: Weather", r.status); return null; }
    const data = await r.json();
    const c = data.current;
    if (!c) { console.warn("pulse: Weather — no current data"); return null; }
    const wmo = (code) => code <= 1 ? "sunčano" : code <= 3 ? "oblačno" : code <= 48 ? "magla" : code <= 67 ? "kiša" : code <= 77 ? "snijeg" : code >= 95 ? "oluja" : "oblačno";
    console.log(`pulse: Weather OK — ${Math.round(c.temperature_2m)}°C`);
    return {
      temp: Math.round(c.temperature_2m),
      wind: Math.round(c.wind_speed_10m),
      gusts: Math.round(c.wind_gusts_10m || 0),
      condition: wmo(c.weather_code || 0),
    };
  } catch (e) { console.warn("pulse: Weather error:", e.message); return null; }
}
