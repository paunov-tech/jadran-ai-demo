// api/guide.js — AI Route Guide: Live Situational Awareness Engine
// Aggregates: HERE Traffic, YOLO cameras, Open-Meteo weather, Border crossings,
// HAC (HR), DARS (SI), ASFINAG (AT) road conditions
// Returns: prioritized intelligence cards for the tourist
//
// GET /api/guide?oLat=48.2&oLng=16.4&dLat=43.5&dLng=16.4&seg=kamper&lang=hr

const HERE_KEY = process.env.HERE_API_KEY || "0baWwk3UMqKmttJIQWhv-ocxS7vOFncDkbLKb68JKxw";
const FB_KEY = process.env.FIREBASE_API_KEY;
const CORS = ["https://jadran.ai","https://monte-negro.ai"];
const CACHE = { data: null, ts: 0, key: "" };
const CACHE_TTL = 180000; // 3 min

// ─── SEVERITY PRIORITY ───
const SEV = { critical: 0, warning: 1, info: 2, tip: 3 };

// ─── DATA FETCHERS (all with timeouts, all fail gracefully) ───

async function fetchHereTraffic(oLat, oLng, dLat, dLng) {
  try {
    const minLat = Math.min(oLat, dLat) - 0.3, maxLat = Math.max(oLat, dLat) + 0.3;
    const minLng = Math.min(oLng, dLng) - 0.3, maxLng = Math.max(oLng, dLng) + 0.3;
    const r = await fetch(
      `https://data.traffic.hereapi.com/v7/incidents?in=bbox:${minLat},${minLng};${maxLat},${maxLng}&apiKey=${HERE_KEY}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return [];
    const data = await r.json();
    return (data.results || []).map(i => ({
      type: i.incidentDetails?.type || "UNKNOWN",
      desc: i.incidentDetails?.description?.value || "",
      road: i.location?.description?.value || "",
      severity: i.incidentDetails?.criticality || "minor",
      from: i.incidentDetails?.startTime,
      to: i.incidentDetails?.endTime,
      lat: i.location?.shape?.links?.[0]?.points?.[0]?.lat,
      lng: i.location?.shape?.links?.[0]?.points?.[0]?.lng,
    })).filter(i => i.desc);
  } catch (e) { console.warn("guide: HERE traffic error:", e.message); return []; }
}

async function fetchYoloCameras() {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    if (!data.documents) return null;
    const cutoff = Date.now() - 24 * 3600000;
    const regions = {};
    let total = 0, active = 0;
    for (const doc of data.documents) {
      const f = doc.fields;
      if (!f) continue;
      const ts = f.timestamp?.stringValue || "";
      const docId = doc.name.split("/").pop();
      let fresh = false;
      if (ts) { const t = new Date(ts).getTime(); fresh = !isNaN(t) && t > cutoff; }
      if (!fresh) fresh = !/\d{4}-\d{2}-\d{2}/.test(docId);
      if (!fresh) continue;
      const sub = f.sub_region?.stringValue || "other";
      const cnt = parseInt(f.raw_count?.integerValue || "0");
      const cam = f.camera_id?.stringValue || "";
      const counts = {};
      if (f.counts?.mapValue?.fields) {
        for (const [k, v] of Object.entries(f.counts.mapValue.fields)) counts[k] = parseInt(v.integerValue || "0");
      }
      if (!regions[sub]) regions[sub] = { objects: 0, cars: 0, persons: 0, cams: 0 };
      regions[sub].objects += cnt;
      regions[sub].cars += (counts.car || 0);
      regions[sub].persons += (counts.person || 0);
      if (cnt > 0) regions[sub].cams++;
      total += cnt;
      if (cnt > 0) active++;
    }
    return { regions, total, active, ts: new Date().toISOString() };
  } catch (e) { console.warn("guide: YOLO error:", e.message); return null; }
}

async function fetchWeatherRoute(oLat, oLng, dLat, dLng) {
  try {
    // Weather at midpoint + destination
    const mLat = (oLat + dLat) / 2, mLng = (oLng + dLng) / 2;
    const [midR, dstR] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${mLat}&longitude=${mLng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe/Zagreb`, { signal: AbortSignal.timeout(5000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${dLat}&longitude=${dLng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,uv_index&timezone=Europe/Zagreb`, { signal: AbortSignal.timeout(5000) }),
    ]);
    const mid = await midR.json();
    const dst = await dstR.json();
    const wmo = (code) => code <= 1 ? "sunny" : code <= 3 ? "cloudy" : code <= 48 ? "fog" : code <= 67 ? "rain" : code <= 77 ? "snow" : code >= 95 ? "storm" : "overcast";
    return {
      midpoint: { temp: mid.current?.temperature_2m, wind: mid.current?.wind_speed_10m, gusts: mid.current?.wind_gusts_10m, condition: wmo(mid.current?.weather_code || 0) },
      destination: { temp: dst.current?.temperature_2m, wind: dst.current?.wind_speed_10m, gusts: dst.current?.wind_gusts_10m, uv: dst.current?.uv_index, condition: wmo(dst.current?.weather_code || 0) },
    };
  } catch (e) { console.warn("guide: weather error:", e.message); return null; }
}

async function fetchBorderWaits() {
  try {
    const r = await fetch("https://promet.si/api/v2/events?lang=sl&type=border", {
      headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.events || data.features || []).map(e => {
      const p = e.properties || e;
      return { name: p.title || p.name || "", wait: parseInt(p.delay || p.wait || "0"), status: p.status || "open" };
    }).filter(b => b.name);
  } catch (e) { console.warn("guide: DARS border error:", e.message); return []; }
}

async function fetchHAC() {
  try {
    const r = await fetch("https://www.hak.hr/api/stanje-na-cestama", {
      headers: { Accept: "application/json", "User-Agent": "JadranAI/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.roadConditions || data.items || data || []).slice(0, 20).map(i => ({
      road: i.road || i.naziv || "",
      desc: i.description || i.opis || "",
      type: i.type || i.vrsta || "info",
    })).filter(i => i.desc);
  } catch (e) { console.warn("guide: HAC error:", e.message); return []; }
}

// ─── RULES ENGINE — generates intelligence cards from raw data ───

function generateCards(traffic, yolo, weather, borders, hac, seg, lang) {
  const cards = [];
  const isKamper = seg === "kamper" || seg === "truck";
  const hr = lang === "hr" || lang === "si" || lang === "cz" || lang === "pl";
  const de = lang === "de" || lang === "at";

  // ── TRAFFIC INCIDENTS ──
  const critical = traffic.filter(i => i.severity === "critical" || i.type === "ROAD_CLOSURE");
  const major = traffic.filter(i => i.severity === "major" || i.type === "ACCIDENT");
  const construction = traffic.filter(i => i.type === "CONSTRUCTION");
  const congestion = traffic.filter(i => i.type === "CONGESTION");

  if (critical.length > 0) {
    const roads = critical.map(i => i.road || i.desc).slice(0, 3).join(", ");
    cards.push({
      id: "traffic_critical",
      severity: "critical",
      icon: "⛔",
      title: de ? "Straße gesperrt" : hr ? "Cesta zatvorena" : "Road closed",
      body: de ? `${critical.length} Sperrung(en): ${roads}. Alternative Route prüfen.`
           : hr ? `${critical.length} zatvaranje: ${roads}. Provjerite alternativnu rutu.`
           : `${critical.length} closure(s): ${roads}. Check alternative route.`,
      source: "HERE Traffic",
      ts: new Date().toISOString(),
    });
  }

  if (major.length > 0) {
    cards.push({
      id: "traffic_accident",
      severity: "warning",
      icon: "🚨",
      title: de ? `${major.length} Unfall/Störung` : hr ? `${major.length} nesreća/zastoj` : `${major.length} accident(s)`,
      body: major.slice(0, 2).map(i => i.road ? `${i.road}: ${i.desc}` : i.desc).join(" | "),
      source: "HERE Traffic",
      ts: new Date().toISOString(),
    });
  }

  if (congestion.length > 2) {
    cards.push({
      id: "traffic_congestion",
      severity: "info",
      icon: "🟡",
      title: de ? "Erhöhtes Verkehrsaufkommen" : hr ? "Pojačan promet" : "Heavy traffic",
      body: de ? `${congestion.length} Staus auf der Strecke. Planen Sie Verzögerungen ein.`
           : hr ? `${congestion.length} gužvi na ruti. Očekujte kašnjenje.`
           : `${congestion.length} congestion points. Expect delays.`,
      source: "HERE Traffic",
      ts: new Date().toISOString(),
    });
  }

  if (construction.length > 0 && isKamper) {
    cards.push({
      id: "traffic_construction",
      severity: "info",
      icon: "🚧",
      title: de ? "Baustellen auf der Strecke" : hr ? "Radovi na cesti" : "Road works",
      body: de ? `${construction.length} Baustelle(n). Achtung: enge Fahrspuren für Camper!`
           : hr ? `${construction.length} gradilišta. Oprez: uske trake za kampere!`
           : `${construction.length} construction zone(s). Caution: narrow lanes for campers!`,
      source: "HERE Traffic",
      ts: new Date().toISOString(),
    });
  }

  if (traffic.length === 0) {
    cards.push({
      id: "traffic_clear",
      severity: "tip",
      icon: "✅",
      title: de ? "Freie Fahrt" : hr ? "Slobodna vožnja" : "Clear road",
      body: de ? "Keine Störungen auf Ihrer Route gemeldet." : hr ? "Nema prijavljenih incidenata na vašoj ruti." : "No incidents reported on your route.",
      source: "HERE Traffic",
      ts: new Date().toISOString(),
    });
  }

  // ── WEATHER ──
  if (weather) {
    const d = weather.destination;
    const m = weather.midpoint;
    // Storm/strong wind warning
    if (d?.condition === "storm" || m?.condition === "storm") {
      cards.push({
        id: "wx_storm",
        severity: "critical",
        icon: "⛈️",
        title: de ? "Unwetterwarnung" : hr ? "Upozorenje na oluju" : "Storm warning",
        body: de ? "Gewitter auf der Strecke. Fahren Sie vorsichtig, halten Sie an Raststätten." : hr ? "Oluja na ruti. Vozite oprezno, stanite na odmorištima." : "Storm on route. Drive carefully, stop at rest areas.",
        source: "Open-Meteo",
        ts: new Date().toISOString(),
      });
    }
    // Bura warning for campers
    if (isKamper && (m?.gusts > 60 || d?.gusts > 60)) {
      cards.push({
        id: "wx_bura",
        severity: "critical",
        icon: "💨",
        title: de ? "Sturmböen — Camper-Warnung" : hr ? "Bura — upozorenje za kampere" : "Storm gusts — camper warning",
        body: de ? `Böen bis ${Math.max(m?.gusts||0, d?.gusts||0)} km/h. Krk-Brücke und Senj-Magistrale können gesperrt sein. HAK.hr prüfen!`
             : hr ? `Udari do ${Math.max(m?.gusts||0, d?.gusts||0)} km/h. Krčki most i magistrala Senj mogu biti zatvoreni. Provjerite HAK.hr!`
             : `Gusts up to ${Math.max(m?.gusts||0, d?.gusts||0)} km/h. Krk bridge and Senj road may be closed. Check HAK.hr!`,
        source: "Open-Meteo",
        ts: new Date().toISOString(),
      });
    }
    // Destination weather card
    if (d) {
      const condIcon = d.condition === "sunny" ? "☀️" : d.condition === "rain" ? "🌧️" : d.condition === "snow" ? "🌨️" : d.condition === "fog" ? "🌫️" : "⛅";
      cards.push({
        id: "wx_dest",
        severity: "tip",
        icon: condIcon,
        title: de ? `Ziel: ${Math.round(d.temp)}°C` : hr ? `Destinacija: ${Math.round(d.temp)}°C` : `Destination: ${Math.round(d.temp)}°C`,
        body: de ? `${condIcon} Wind ${Math.round(d.wind)} km/h${d.uv >= 6 ? ` · UV ${d.uv} — Sonnenschutz!` : ""}`
             : hr ? `${condIcon} Vjetar ${Math.round(d.wind)} km/h${d.uv >= 6 ? ` · UV ${d.uv} — krema za sunce!` : ""}`
             : `${condIcon} Wind ${Math.round(d.wind)} km/h${d.uv >= 6 ? ` · UV ${d.uv} — sunscreen!` : ""}`,
        source: "Open-Meteo",
        ts: new Date().toISOString(),
      });
    }
  }

  // ── YOLO CAMERA INTELLIGENCE ──
  if (yolo && yolo.total > 0) {
    const sortedRegions = Object.entries(yolo.regions).sort((a, b) => b[1].objects - a[1].objects);
    const busiest = sortedRegions[0];
    const quietest = sortedRegions.filter(([_, d]) => d.objects > 0).pop();
    if (busiest && busiest[1].objects > 50) {
      cards.push({
        id: "yolo_busy",
        severity: "info",
        icon: "📸",
        title: de ? "Kameras: hohes Aufkommen" : hr ? "Kamere: pojačan promet" : "Cameras: heavy activity",
        body: de ? `${busiest[0]}: ${busiest[1].objects} Objekte (${busiest[1].cars} Autos, ${busiest[1].persons} Personen) auf ${busiest[1].cams} Kameras.${quietest ? ` Ruhiger: ${quietest[0]}` : ""}`
             : hr ? `${busiest[0]}: ${busiest[1].objects} objekata (${busiest[1].cars} auta, ${busiest[1].persons} osoba) na ${busiest[1].cams} kamera.${quietest ? ` Mirnije: ${quietest[0]}` : ""}`
             : `${busiest[0]}: ${busiest[1].objects} objects (${busiest[1].cars} cars, ${busiest[1].persons} people) on ${busiest[1].cams} cameras.${quietest ? ` Quieter: ${quietest[0]}` : ""}`,
        source: "YOLO BIG EYE",
        ts: yolo.ts,
      });
    }
    // Camper-specific: highway camera activity
    if (isKamper) {
      const hwRegions = ["inland", "zagreb", "gorski_kotar"];
      const hwCars = hwRegions.reduce((sum, r) => sum + (yolo.regions[r]?.cars || 0), 0);
      if (hwCars > 30) {
        cards.push({
          id: "yolo_hw",
          severity: "info",
          icon: "🛣️",
          title: de ? "Dichter Autobahnverkehr" : hr ? "Gust promet na autocesti" : "Dense highway traffic",
          body: de ? `${hwCars} Fahrzeuge auf Autobahn-Kameras erkannt. Naplatne können voll sein.`
               : hr ? `${hwCars} vozila na kamerama autoceste. Naplatne rampe mogu biti pune.`
               : `${hwCars} vehicles detected on highway cameras. Toll stations may be crowded.`,
          source: "YOLO BIG EYE",
          ts: yolo.ts,
        });
      }
    }
  }

  // ── BORDER CROSSINGS ──
  const longWaits = borders.filter(b => b.wait > 20);
  if (longWaits.length > 0) {
    cards.push({
      id: "border_wait",
      severity: longWaits.some(b => b.wait > 45) ? "warning" : "info",
      icon: "🛂",
      title: de ? "Grenzwartezeit" : hr ? "Čekanje na granici" : "Border wait",
      body: longWaits.map(b => `${b.name}: ~${b.wait} min`).join(" · "),
      source: "DARS/promet.si",
      ts: new Date().toISOString(),
    });
  }

  // ── HAC ROAD CONDITIONS ──
  if (hac.length > 0) {
    const relevant = hac.filter(h => h.type === "closure" || h.type === "restriction" || h.desc.toLowerCase().includes("zatvoren") || h.desc.toLowerCase().includes("ograničen"));
    if (relevant.length > 0) {
      cards.push({
        id: "hac_road",
        severity: "warning",
        icon: "🛤️",
        title: de ? "HAK Straßenmeldung" : hr ? "HAK obavijest" : "HAK road notice",
        body: relevant.slice(0, 3).map(h => h.road ? `${h.road}: ${h.desc}` : h.desc).join(" | "),
        source: "HAK.hr",
        ts: new Date().toISOString(),
      });
    }
  }

  // Sort by severity
  cards.sort((a, b) => (SEV[a.severity] ?? 9) - (SEV[b.severity] ?? 9));
  return cards;
}

// ─── HANDLER ───

export default async function handler(req, res) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", CORS.includes(origin) ? origin : CORS[0]);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=60");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const oLat = parseFloat(req.query?.oLat) || 48.2082;
  const oLng = parseFloat(req.query?.oLng) || 16.3738;
  const dLat = parseFloat(req.query?.dLat) || 43.5081;
  const dLng = parseFloat(req.query?.dLng) || 16.4402;
  const seg = req.query?.seg || "auto";
  const lang = req.query?.lang || "hr";

  // Cache key
  const key = `${oLat.toFixed(1)}_${oLng.toFixed(1)}_${dLat.toFixed(1)}_${dLng.toFixed(1)}_${seg}_${lang}`;
  if (CACHE.data && CACHE.key === key && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  try {
    // Parallel fetch ALL sources
    const [traffic, yolo, weather, borders, hac] = await Promise.allSettled([
      fetchHereTraffic(oLat, oLng, dLat, dLng),
      fetchYoloCameras(),
      fetchWeatherRoute(oLat, oLng, dLat, dLng),
      fetchBorderWaits(),
      fetchHAC(),
    ]);

    const trafficData = traffic.status === "fulfilled" ? traffic.value : [];
    const yoloData = yolo.status === "fulfilled" ? yolo.value : null;
    const weatherData = weather.status === "fulfilled" ? weather.value : null;
    const borderData = borders.status === "fulfilled" ? borders.value : [];
    const hacData = hac.status === "fulfilled" ? hac.value : [];

    // Generate intelligence cards
    const cards = generateCards(trafficData, yoloData, weatherData, borderData, hacData, seg, lang);

    const result = {
      cards,
      sources: {
        traffic: trafficData.length,
        yolo: yoloData ? yoloData.active : 0,
        weather: weatherData ? true : false,
        borders: borderData.length,
        hac: hacData.length,
      },
      updated: new Date().toISOString(),
    };

    CACHE.data = result;
    CACHE.ts = Date.now();
    CACHE.key = key;

    return res.status(200).json(result);
  } catch (e) {
    console.error("guide.js error:", e.message);
    return res.status(500).json({ error: "Guide unavailable", cards: [] });
  }
}
