// api/pulse.js — JADRAN.AI Proactive Intelligence Pulse
// Every 3 min: GPS position + segment + YOLO + HERE Traffic + Weather → Claude Sonnet → 1-2 sentence guide card
// This is the BRAIN — transforms raw data into a personal travel companion voice

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const HERE_KEY = process.env.HERE_API_KEY;
const FB_KEY = process.env.FIREBASE_API_KEY;
const CORS = ["https://jadran.ai", "https://monte-negro.ai"];

let CACHE = { key: "", data: null, ts: 0 };
const CACHE_TTL = 120000; // 2 min

// Rate limiting — max 30 pulse calls per IP per hour (prevents Sonnet bill shock)
const _pulseRL = new Map();
function pulseRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _pulseRL) { if (now > v.r) _pulseRL.delete(k); }
  const e = _pulseRL.get(ip);
  if (!e || now > e.r) { _pulseRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 30) return false;
  e.c++; return true;
}

// Global daily cap — max 500 Sonnet calls per day across all users
let _globalPulse = { c: 0, r: 0 };
function globalPulseOk() {
  const now = Date.now();
  if (now > _globalPulse.r) { _globalPulse = { c: 1, r: now + 86400000 }; return true; }
  if (_globalPulse.c >= 500) return false;
  _globalPulse.c++; return true;
}

// ── Route corridor detection — determines which highways and tunnels are on the route ──
function detectRouteCorridor(fromCity, destCity, fromLat, fromLng, destLat, destLng) {
  const from = (fromCity || "").toLowerCase();
  const dest = (destCity || "").toLowerCase();
  const all = from + " " + dest;

  const istra = ["pula", "poreč", "porec", "rovinj", "umag", "novigrad", "rabac", "medulin", "pazin", "labin"];
  const isIstra = istra.some(c => all.includes(c));
  const kvarner = ["rijeka", "opatija", "crikvenica", "krk", "rab", "cres", "lošinj", "losinj", "senj"];
  const isKvarner = kvarner.some(c => all.includes(c));
  const dalmatia = ["split", "trogir", "makarska", "dubrovnik", "zadar", "šibenik", "sibenik", "omiš", "omis", "bol", "hvar", "korčula", "korcula", "vis", "ploče", "ploce"];
  const isDalmatia = dalmatia.some(c => all.includes(c));

  const highways = [];
  const tunnels = [];

  if (destLat && destLat < 46.4 && fromLat && fromLat > 46.5) {
    if (fromLng > 14.5) highways.push("AT A2 Süd");
    highways.push("Karavanke ili Spielfeld");
  }
  if ((fromLat > 45.5 && destLat < 46) || from.includes("maribor") || from.includes("ljubljana")) {
    highways.push("SLO A1/A2 (DARS)");
    if (isIstra) { highways.push("SLO A1 → HR A7 Rupa → A8 Istra"); tunnels.push("Učka 5062m (4.5m)"); }
  }
  if (isDalmatia) { highways.push("HR A1 Zagreb→Split→Dubrovnik"); tunnels.push("Mala Kapela 5780m (4.2m)", "Sv. Rok 5679m (4.2m)"); }
  if (isKvarner && !isIstra) highways.push("HR A6 Bosiljevo→Rijeka");
  if (isIstra) { highways.push("HR A8/A9 Istarski ipsilon"); if (!tunnels.includes("Učka 5062m (4.5m)")) tunnels.push("Učka 5062m (4.5m)"); }
  if (highways.length === 0) highways.push("nije određen");

  return { highways, tunnels };
}

// ── Haversine distance in km ──
function distKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Guard: missing API keys
  if (!ANTHROPIC_KEY) return res.status(200).json({ pulse: "", error: "AI not configured", ts: new Date().toISOString() });

  // Rate limiting
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!pulseRateOk(clientIp)) return res.status(429).json({ error: "Rate limit exceeded", ts: new Date().toISOString() });
  if (!globalPulseOk()) return res.status(200).json({ pulse: "", error: "Daily limit reached", ts: new Date().toISOString() });

  const { lat, lng, segment, lang, fromCity, fromLat, fromLng, destCity, destLat, destLng,
          distToDest, etaMin, routeKm, routeHrs, routeMins, speed, country } = req.body || {};
  if (!lat || !lng) return res.status(400).json({ error: "lat/lng required" });

  const seg = segment || "par";
  const lk = lang || "hr";
  const cacheKey = `${Math.round(lat * 10)}_${Math.round(lng * 10)}_${seg}_${lk}`;

  if (CACHE.data && CACHE.key === cacheKey && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  const routeCorridor = detectRouteCorridor(fromCity, destCity, fromLat, fromLng, destLat, destLng);

  // ── Parallel data fetch (all fail gracefully) ──
  console.log(`[pulse] fetch — seg=${seg} lang=${lk}`);
  const [trafficRes, yoloRes, weatherRes] = await Promise.allSettled([
    fetchRouteTraffic(lat, lng, destLat, destLng),
    fetchNearbyYolo(lat, lng),
    fetchWeather(lat, lng),
  ]);

  const traffic = trafficRes.status === "fulfilled" ? trafficRes.value : [];
  const yolo = yoloRes.status === "fulfilled" ? yoloRes.value : null;
  const weather = weatherRes.status === "fulfilled" ? weatherRes.value : null;

  // ── Compute position context ──
  const hour = new Date().toLocaleString("en", { timeZone: "Europe/Zagreb", hour: "numeric", hour12: false });
  const dayOfWeek = new Date().toLocaleString("en", { timeZone: "Europe/Zagreb", weekday: "long" });

  // Determine where the user IS right now based on coordinates
  const posLat = parseFloat(lat), posLng = parseFloat(lng);
  let nearestCity = "unknown";
  const cityCheck = [
    [48.21, 16.37, "Wien"], [47.07, 15.44, "Graz"], [46.62, 14.31, "Villach"],
    [46.56, 15.65, "Maribor"], [46.05, 14.51, "Ljubljana"], [45.53, 13.73, "Koper"],
    [45.82, 15.97, "Zagreb"], [45.49, 15.55, "Karlovac"], [45.34, 14.41, "Rijeka"],
    [44.87, 13.85, "Pula"], [45.23, 13.60, "Poreč"], [45.08, 13.64, "Rovinj"],
    [44.12, 15.23, "Zadar"], [43.73, 15.89, "Šibenik"], [43.51, 16.44, "Split"],
    [43.30, 17.02, "Makarska"], [42.64, 18.09, "Dubrovnik"], [43.52, 16.27, "Trogir"],
    [45.47, 13.62, "Umag"], [45.09, 14.57, "Opatija"],
  ];
  let minDist = Infinity;
  for (const [clat, clng, cname] of cityCheck) {
    const d = distKm(posLat, posLng, clat, clng);
    if (d < minDist) { minDist = d; nearestCity = cname; }
  }
  const nearCityStr = minDist < 15 ? `near ${nearestCity}` : minDist < 50 ? `~${Math.round(minDist)}km from ${nearestCity}` : `between cities (${nearestCity} closest)`;

  // Compute remaining distance properly
  let remainingKm = null;
  let remainingTime = null;
  if (routeKm && destLat && destLng && fromLat && fromLng) {
    // Use proportional scaling against known route distance
    const totalStraight = distKm(fromLat, fromLng, destLat, destLng);
    const currentStraight = distKm(posLat, posLng, destLat, destLng);
    if (totalStraight > 0) {
      remainingKm = Math.round((currentStraight / totalStraight) * routeKm);
      const avgSpeed = routeKm / ((routeHrs || 0) * 60 + (routeMins || 60));
      remainingTime = Math.round(remainingKm / avgSpeed);
    }
  } else if (distToDest) {
    remainingKm = Math.round(distToDest);
    remainingTime = etaMin || null;
  }

  // Progress percentage
  let progressPct = null;
  if (routeKm && remainingKm) {
    progressPct = Math.max(0, Math.min(100, Math.round(((routeKm - remainingKm) / routeKm) * 100)));
  }

  // ── Build context ──
  let context = `ROUTE: ${fromCity || "?"} → ${destCity || "?"}`;
  if (routeKm) context += ` (total ${routeKm} km, ${routeHrs || "?"}h ${routeMins || "?"}min by road)`;
  context += `\nHIGHWAY CORRIDOR: ${routeCorridor.highways.join(" → ")}`;
  context += `\nTUNNELS ON THIS ROUTE: ${routeCorridor.tunnels.length > 0 ? routeCorridor.tunnels.join(", ") : "none"}`;
  context += `\n\nCURRENT POSITION: ${posLat.toFixed(3)}, ${posLng.toFixed(3)} — ${nearCityStr}`;
  if (country) context += ` (country: ${country})`;
  if (remainingKm) context += `\nREMAINING: ~${remainingKm} km to ${destCity || "destination"}`;
  if (remainingTime) context += ` (~${remainingTime} min)`;
  if (progressPct !== null) context += `\nPROGRESS: ${progressPct}% of route completed`;
  if (speed) context += `\nSPEED: ${Math.round(speed * 3.6)} km/h`;
  context += `\nTIME: ${dayOfWeek}, ${hour}:00h (Europe/Zagreb)`;

  context += `\n\nCRITICAL: Only mention tunnels and highways that are ON THIS ROUTE (${routeCorridor.highways.join(", ")}). NEVER mention tunnels/highways not on this route!`;

  if (traffic.length > 0) {
    const nearby = traffic.filter(t => t.distKm !== null && t.distKm < 40);
    const ahead = traffic.filter(t => t.distKm === null || t.distKm >= 40);
    if (nearby.length > 0) {
      context += `\n\nTRAFFIC NEARBY (within 40km, ${nearby.length} incidents):`;
      nearby.slice(0, 5).forEach(t => {
        context += `\n- ${t.type}: ${t.desc}${t.road ? ` (${t.road})` : ""}${t.distKm ? ` [~${t.distKm}km away]` : ""}`;
      });
    }
    if (ahead.length > 0) {
      context += `\n\nTRAFFIC AHEAD ON ROUTE (${ahead.length} incidents further along):`;
      ahead.slice(0, 5).forEach(t => {
        context += `\n- ${t.type}: ${t.desc}${t.road ? ` (${t.road})` : ""}${t.distKm ? ` [~${t.distKm}km away]` : ""}`;
      });
    }
    if (nearby.length === 0 && ahead.length === 0) {
      context += "\n\nTRAFFIC: No reported incidents on route.";
    }
  } else {
    context += "\n\nTRAFFIC: No reported incidents on route.";
  }

  if (yolo) {
    if (yolo.activeCams === 0) {
      context += `\n\nYOLO SENSE: Night mode — 0 active sensors of 166. Sensors inactive at night, do NOT interpret as "no traffic".`;
    } else {
      context += `\n\nYOLO SENSE (${yolo.activeCams} active of 166):`;
      if (yolo.totalCars > 0 || yolo.totalPersons > 0) context += ` total ${yolo.totalCars} vehicles, ${yolo.totalPersons} persons`;
      if (yolo.regionSummary) context += `\n${yolo.regionSummary}`;
      if (yolo.busiestCam) context += `\nBusiest: ${yolo.busiestCam}`;
    }
  }

  if (weather) {
    context += `\n\nWEATHER at current position: ${weather.temp}°C, ${weather.condition}`;
    if (weather.wind > 30) context += `, WIND ${weather.wind} km/h!`;
    else if (weather.wind > 0) context += `, wind ${weather.wind} km/h`;
    if (weather.gusts > 60) context += ` ⚠️ GUSTS UP TO ${weather.gusts} km/h`;
  }

  // ── Claude Sonnet generates the pulse ──
  const systemPrompt = buildSystemPrompt(seg, lk);

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: context }],
      }),
      signal: AbortSignal.timeout(6000),
    });

    console.warn(`[pulse] Sonnet responded — status=${aiRes.status}`);
    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "";

    const result = {
      pulse: text,
      sources: { traffic: traffic.length, yolo: yolo?.activeCams || 0, weather: !!weather },
      ts: new Date().toISOString(),
    };

    CACHE = { key: cacheKey, data: result, ts: Date.now() };
    return res.status(200).json(result);
  } catch (e) {
    console.error("pulse: AI error:", e.message);
    return res.status(200).json({ pulse: "", error: e.message, ts: new Date().toISOString() });
  }
}

// ── System prompt builder — FULLY LOCALIZED per language ──
function buildSystemPrompt(seg, lang) {
  // Language-specific instructions
  const LANG_PROMPT = {
    hr: {
      instr: "Odgovaraj ISKLJUČIVO na hrvatskom jeziku.",
      role: { kamper: "Iskusni kamper vodič. Prioritet: tuneli (visine!), LPG, dump stanice, bura, parking. Direktan, praktičan ton.", porodica: "Obiteljski vodič. Prioritet: WC pauze, dječje plaže, sigurnost. Topao ton. Pauze svakih 2h.", par: "Elegantan vodič za parove. Romantični viewpointi, vinarije, zalasci sunca. Šarmantan ton.", jedrilicar: "Pomorski vodič. Vjetar, marine, sidrišta, VHF. Nautička terminologija, bofori ne km/h." },
      rules: `PRAVILA:
1. 1-3 kratke rečenice. Nikad duže.
2. Počni sa situacijom — NE pozdravljaj se.
3. Mirno: predloži nešto u blizini. Incident: upozori + alternativa.
4. Bura/oluja: HITNO upozorenje prvo.
5. Blizu cilja (<10km): parking/marina savjet.
6. Govori prirodno kao lokalni prijatelj. Max 1-2 emoji.
7. NIKAD ne izmišljaj brojeve — koristi samo ČINJENICE iz konteksta.
8. NIKAD ne reci koliko je ukupna ruta duga ako ne piše u podacima.`,
    },
    de: {
      instr: "Antworte AUSSCHLIESSLICH auf Deutsch.",
      role: { kamper: "Erfahrener Camper-Guide. Priorität: Tunnel (Höhen!), LPG, Entsorgung, Bora, Parkplätze. Direkter, praktischer Ton.", porodica: "Familienguide. Priorität: WC-Pausen, Kinderstrände, Sicherheit. Warmer Ton. Pausen alle 2h.", par: "Eleganter Paar-Guide. Romantische Aussichtspunkte, Weingüter, Sonnenuntergänge. Charmanter Ton.", jedrilicar: "Nautischer Guide. Wind, Marinas, Ankerplätze, VHF. Nautische Terminologie, Beaufort." },
      rules: `REGELN:
1. 1-3 kurze Sätze. Nie länger.
2. Beginne mit der Situation — KEINE Begrüßung.
3. Ruhig: Empfehlung in der Nähe. Vorfall: Warnung + Alternative.
4. Bora/Sturm: DRINGENDE Warnung zuerst.
5. Nahe am Ziel (<10km): Parkplatz-/Marina-Tipp.
6. Sprich natürlich wie ein lokaler Freund. Max 1-2 Emoji.
7. NIEMALS Zahlen erfinden — nur FAKTEN aus dem Kontext verwenden.
8. NIEMALS die Gesamtlänge der Route nennen, wenn sie nicht in den Daten steht.`,
    },
    en: {
      instr: "Respond EXCLUSIVELY in English.",
      role: { kamper: "Expert camper guide. Priority: tunnels (heights!), LPG, dump stations, bora wind, parking. Direct, practical tone.", porodica: "Family guide. Priority: restroom breaks, kid beaches, safety. Warm tone. Breaks every 2h.", par: "Elegant couple's guide. Romantic viewpoints, wineries, sunsets. Charming insider tone.", jedrilicar: "Maritime guide. Wind, marinas, anchorages, VHF. Nautical terminology, Beaufort scale." },
      rules: `RULES:
1. 1-3 short sentences. Never longer.
2. Start with the situation — NO greetings.
3. Calm: suggest something nearby. Incident: warn + alternative.
4. Bora/storm: URGENT warning first.
5. Near destination (<10km): parking/marina tip.
6. Speak naturally like a local friend. Max 1-2 emoji.
7. NEVER invent numbers — only use FACTS from the context.
8. NEVER state total route length unless it's in the data.`,
    },
    it: {
      instr: "Rispondi ESCLUSIVAMENTE in italiano.",
      role: { kamper: "Guida camper esperta. Priorità: gallerie (altezze!), GPL, scarico, bora, parcheggi. Tono diretto e pratico.", porodica: "Guida per famiglie. Priorità: soste bagno, spiagge bambini, sicurezza. Tono caldo. Soste ogni 2h.", par: "Guida elegante per coppie. Punti panoramici, cantine, tramonti. Tono affascinante.", jedrilicar: "Guida nautica. Vento, porti, ancoraggi, VHF. Terminologia nautica, Beaufort." },
      rules: `REGOLE:
1. 1-3 frasi brevi. Mai di più.
2. Inizia con la situazione — NIENTE saluti.
3. Calmo: suggerisci qualcosa vicino. Incidente: avvisa + alternativa.
4. Bora/tempesta: avviso URGENTE per primo.
5. Vicino alla destinazione (<10km): consiglio parcheggio/porto.
6. Parla naturalmente come un amico locale. Max 1-2 emoji.
7. MAI inventare numeri — usa solo i FATTI dal contesto.
8. MAI dire la lunghezza totale del percorso se non è nei dati.`,
    },
    si: {
      instr: "Odgovarjaj IZKLJUČNO v slovenščini.",
      role: { kamper: "Izkušen kamper vodnik. Prednost: predori (višine!), LPG, dump postaje, burja, parkiranje. Neposreden, praktičen ton.", porodica: "Družinski vodnik. Prednost: postanki za WC, otroške plaže, varnost. Topel ton. Postanki vsaki 2h.", par: "Eleganten vodnik za pare. Romantične razgledne točke, vinarji, sončni zahodi. Očarljiv ton.", jedrilicar: "Pomorski vodnik. Veter, marine, sidrišča, VHF. Navtična terminologija, beauforti." },
      rules: `PRAVILA:
1. 1-3 kratki stavki. Nikoli dlje.
2. Začni s situacijo — BREZ pozdrava.
3. Mirno: predlagaj nekaj v bližini. Incident: opozori + alternativa.
4. Burja/nevihta: NUJNO opozorilo najprej.
5. Blizu cilja (<10km): nasvet za parkiranje/marino.
6. Govori naravno kot lokalni prijatelj. Max 1-2 emoji.
7. NIKOLI ne izmišljuj številk — uporabi samo DEJSTVA iz konteksta.
8. NIKOLI ne navajaj skupne dolžine poti, če ni v podatkih.`,
    },
    cz: {
      instr: "Odpovídej VÝHRADNĚ v češtině.",
      role: { kamper: "Zkušený karavanový průvodce. Priorita: tunely (výšky!), LPG, dump stanice, bóra, parkování. Přímý, praktický tón.", porodica: "Rodinný průvodce. Priorita: přestávky na WC, dětské pláže, bezpečnost. Vřelý tón. Přestávky každé 2h.", par: "Elegantní průvodce pro páry. Romantické vyhlídky, vinařství, západy slunce. Okouzlující tón.", jedrilicar: "Námořní průvodce. Vítr, přístavy, kotviště, VHF. Námořní terminologie, Beaufort." },
      rules: `PRAVIDLA:
1. 1-3 krátké věty. Nikdy déle.
2. Začni situací — ŽÁDNÝ pozdrav.
3. Klid: doporuč něco poblíž. Incident: varuj + alternativa.
4. Bóra/bouře: NALÉHAVÉ varování první.
5. Blízko cíle (<10km): tip na parkování/přístav.
6. Mluv přirozeně jako místní přítel. Max 1-2 emoji.
7. NIKDY nevymýšlej čísla — používej jen FAKTA z kontextu.
8. NIKDY neuváděj celkovou délku trasy, pokud není v datech.`,
    },
    pl: {
      instr: "Odpowiadaj WYŁĄCZNIE po polsku.",
      role: { kamper: "Doświadczony przewodnik kamperowy. Priorytet: tunele (wysokości!), LPG, dump stacje, bora, parking. Bezpośredni, praktyczny ton.", porodica: "Przewodnik rodzinny. Priorytet: przerwy na WC, plaże dla dzieci, bezpieczeństwo. Ciepły ton. Przerwy co 2h.", par: "Elegancki przewodnik dla par. Romantyczne punkty widokowe, winiarnie, zachody słońca. Czarujący ton.", jedrilicar: "Przewodnik morski. Wiatr, mariny, kotwicowiska, VHF. Terminologia żeglarska, Beaufort." },
      rules: `ZASADY:
1. 1-3 krótkie zdania. Nigdy dłużej.
2. Zacznij od sytuacji — BEZ powitania.
3. Spokojnie: zasugeruj coś w pobliżu. Incydent: ostrzeż + alternatywa.
4. Bora/burza: PILNE ostrzeżenie najpierw.
5. Blisko celu (<10km): wskazówka parkingowa/portowa.
6. Mów naturalnie jak lokalny przyjaciel. Max 1-2 emoji.
7. NIGDY nie wymyślaj liczb — używaj tylko FAKTÓW z kontekstu.
8. NIGDY nie podawaj całkowitej długości trasy, jeśli nie ma jej w danych.`,
    },
  };

  // AT uses DE
  const l = LANG_PROMPT[lang] || LANG_PROMPT[lang === "at" ? "de" : "hr"];
  const role = l.role[seg] || l.role.par;

  // Reference data (language-neutral, factual)
  const facts = `REFERENCE DATA (use ONLY these, never invent):
Tunnels A1 Zagreb→Split→Dubrovnik: Sv. Rok 5679m 4.2m height, Mala Kapela 5780m 4.2m
Tunnel A8 Rijeka→Istra: Učka 5062m 4.5m
Tunnels AT→SLO: Karavanke 7948m 4.1m (A2), Ljubelj 1570m 3.8m
IMPORTANT: Učka is ONLY on Istra route, NOT on A1 to Split! Sv.Rok and Mala Kapela are ONLY on A1!
LPG: Villach (AT), Ljubljana BTC (SI), Zagreb Jankomir, Karlovac, Zadar, Split Duje (HR)
Dump stations: Villach Camping, Krk Ježevac, Stobreč (Split), Solitudo (Dubrovnik), Borik (Zadar), Veštar (Rovinj)
ACI marinas VHF Ch17: Split (355), Dubrovnik (380), Trogir (174), Zadar (300), Pula (192), Korčula (159)
Kid beaches: Nin Kraljičina (sand+shallow), Lopar Rajska (Rab), Sakarun (Dugi Otok)
Romantic: Bled (15min detour A2), Motovun (truffles), Pelješac wine road, Biokovo Skywalk 1228m
Rest stops A1: Otočac, Brinje, Jasenice (Velebit view)
Bora zones: Senj coast (ban >5m vehicles at >80km/h), Maslenica bridge, Krk bridge
Schengen: AT/SLO/HR — no border, but possible summer checks (especially Saturdays)`;

  return `You are JADRAN AI — a proactive tourist guide for the Adriatic coast.
${l.instr}

YOUR ROLE: ${role}

${facts}

${l.rules}`;
}

// ── Data fetchers ──

async function fetchRouteTraffic(lat, lng, destLat, destLng) {
  try {
    const fLat = parseFloat(lat), fLng = parseFloat(lng);
    const dLat = parseFloat(destLat), dLng = parseFloat(destLng);
    // bbox covers from current position to destination + padding
    // If no destination, fall back to ±0.4° around user
    let southLat, northLat, westLng, eastLng;
    if (dLat && dLng) {
      southLat = Math.min(fLat, dLat) - 0.3;
      northLat = Math.max(fLat, dLat) + 0.3;
      westLng = Math.min(fLng, dLng) - 0.3;
      eastLng = Math.max(fLng, dLng) + 0.3;
    } else {
      southLat = fLat - 0.4; northLat = fLat + 0.4;
      westLng = fLng - 0.4; eastLng = fLng + 0.4;
    }
    const url = `https://data.traffic.hereapi.com/v7/incidents?in=bbox:${westLng},${southLat},${eastLng},${northLat}&locationReferencing=shape&apiKey=${HERE_KEY}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) { console.warn("pulse: HERE Traffic", r.status); return []; }
    const data = await r.json();
    return (data.results || []).map(i => {
      const iLat = i.location?.shape?.links?.[0]?.points?.[0]?.lat;
      const iLng = i.location?.shape?.links?.[0]?.points?.[0]?.lng;
      let incDistKm = null;
      if (iLat && iLng) incDistKm = Math.round(distKm(fLat, fLng, iLat, iLng));
      return {
        type: i.incidentDetails?.type || "UNKNOWN",
        desc: i.incidentDetails?.description?.value || "",
        road: i.location?.description?.value || "",
        severity: i.incidentDetails?.criticality || "minor",
        distKm: incDistKm,
      };
    }).filter(i => i.desc).sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999)).slice(0, 15);
  } catch (e) { console.warn("pulse: HERE error:", e.message); return []; }
}

let SENSE_CACHE = { data: null, ts: 0 };
const SENSE_CACHE_TTL = 180000; // 3 min

async function fetchNearbyYolo(lat, lng) {
  if (SENSE_CACHE.data && Date.now() - SENSE_CACHE.ts < SENSE_CACHE_TTL) return SENSE_CACHE.data;
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) { console.warn("pulse: Sense Firestore", r.status); return null; }
    const data = await r.json();
    if (!data.documents) return null;

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
      totalCars += cars; totalPersons += persons;
      const sub = f.sub_region?.stringValue || "other";
      if (!regions[sub]) regions[sub] = { cars: 0, persons: 0, total: 0 };
      regions[sub].cars += cars; regions[sub].persons += persons; regions[sub].total += cnt;
      const camName = f.sensor_id?.stringValue || doc.name.split("/").pop();
      if (cnt > busiestCount) { busiestCount = cnt; busiestCam = `${camName} (${cnt} obj)`; }
    }
    const regionSummary = Object.entries(regions).filter(([_, d]) => d.total > 0)
      .sort((a, b) => b[1].total - a[1].total).slice(0, 5)
      .map(([r, d]) => `${r}: ${d.cars} vehicles, ${d.persons} persons`).join("; ");
    const result = { activeCams, totalCars, totalPersons, busiestCam, regionSummary };
    SENSE_CACHE = { data: result, ts: Date.now() };
    return result;
  } catch (e) { console.warn("pulse: YOLO error:", e.message); return null; }
}

async function fetchWeather(lat, lng) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe/Zagreb`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const c = data.current;
    if (!c) return null;
    const wmo = (code) => code <= 1 ? "sunny" : code <= 3 ? "cloudy" : code <= 48 ? "fog" : code <= 67 ? "rain" : code <= 77 ? "snow" : code >= 95 ? "storm" : "cloudy";
    return { temp: Math.round(c.temperature_2m), wind: Math.round(c.wind_speed_10m), gusts: Math.round(c.wind_gusts_10m || 0), condition: wmo(c.weather_code || 0) };
  } catch (e) { console.warn("pulse: Weather error:", e.message); return null; }
}
