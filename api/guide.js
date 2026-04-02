// api/guide.js — AI Route Guide: Live Situational Awareness Engine
// Aggregates: HERE Traffic, Sense sensors, Open-Meteo weather,
// HAK (HR), DARS (SI), ASFINAG (AT) road conditions
// Returns: prioritized intelligence cards for the tourist
//
// GET /api/guide?oLat=48.2&oLng=16.4&dLat=43.5&dLng=16.4&seg=kamper&lang=hr

const HERE_KEY = process.env.HERE_API_KEY;
const FB_KEY = process.env.FIREBASE_API_KEY;
const CORS = ["https://jadran.ai","https://monte-negro.ai"];
const CACHE = { data: null, ts: 0, key: "" };
const CACHE_TTL = 60000; // 1 min — fresh data

// Rate limiting — max 60 guide calls per IP per hour
const _guideRL = new Map();
function guideRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _guideRL) { if (now > v.r) _guideRL.delete(k); }
  const e = _guideRL.get(ip);
  if (!e || now > e.r) { _guideRL.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 60) return false;
  e.c++; return true;
}

// ─── SEVERITY PRIORITY ───
const SEV = { critical: 0, warning: 1, info: 2, tip: 3 };

// ─── DATA FETCHERS (all with timeouts, all fail gracefully) ───

async function fetchHereTraffic(oLat, oLng, dLat, dLng) {
  try {
    if (!HERE_KEY) { console.warn("guide: HERE_API_KEY not set"); return []; }
    // Routes from Central Europe to Adriatic deviate significantly west of the
    // straight line (via Graz 15.4°E, Ljubljana 14.5°E, Zagreb 16.0°E).
    // Expand west by 2.5° and east/north/south by 0.5° to cover real road corridor.
    const southLat = Math.min(oLat, dLat) - 0.5;
    const northLat = Math.max(oLat, dLat) + 0.5;
    const westLng  = Math.min(oLng, dLng) - 2.5;   // was 0.3 — misses Ljubljana/Graz
    const eastLng  = Math.max(oLng, dLng) + 0.5;
    const url = `https://data.traffic.hereapi.com/v7/incidents?in=bbox:${westLng.toFixed(4)},${southLat.toFixed(4)},${eastLng.toFixed(4)},${northLat.toFixed(4)}&locationReferencing=shape&apiKey=${HERE_KEY}`;
    console.log("guide: HERE bbox", westLng.toFixed(2), southLat.toFixed(2), eastLng.toFixed(2), northLat.toFixed(2));
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.warn(`guide: HERE traffic HTTP ${r.status}:`, errText.slice(0, 200));
      return [];
    }
    const data = await r.json();
    const incidents = data.results || data.items || [];
    console.log("guide: HERE incidents count:", incidents.length);
    return incidents.map(i => ({
      type: i.incidentDetails?.type || "UNKNOWN",
      desc: i.incidentDetails?.description?.value || i.incidentDetails?.summary?.value || "",
      road: i.location?.description?.value || i.location?.roadName?.value || "",
      severity: i.incidentDetails?.criticality || "minor",
      from: i.incidentDetails?.startTime,
      to: i.incidentDetails?.endTime,
      lat: i.location?.shape?.links?.[0]?.points?.[0]?.lat,
      lng: i.location?.shape?.links?.[0]?.points?.[0]?.lng,
    })).filter(i => i.desc);
  } catch (e) { console.warn("guide: HERE traffic error:", e.message); return []; }
}

async function fetchYoloSensors() {
  if (!FB_KEY) return null;
  try {
    const r = await fetch(
      `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_yolo?key=${FB_KEY}&pageSize=300`,
      { signal: AbortSignal.timeout(4000) }
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
      const cam = f.sensor_id?.stringValue || "";
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
  } catch (e) { console.warn("guide: Sense error:", e.message); return null; }
}

// ─── HAK (Croatian Auto Club) — real RSS feed ───
async function fetchHAK() {
  try {
    const r = await fetch("https://www.hak.hr/info/stanje-na-cestama/feed/", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JadranBot/1.0)" },
    });
    if (!r.ok) { console.warn("guide: HAK HTTP", r.status); return []; }
    const xml = await r.text();
    const items = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRx.exec(xml)) !== null && items.length < 12) {
      const chunk = m[1];
      const title = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(chunk) || /<title>([^<]*)<\/title>/.exec(chunk))?.[1]?.trim() || "";
      const desc  = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(chunk) || /<description>([^<]*)<\/description>/.exec(chunk))?.[1]?.replace(/<[^>]+>/g,"").trim() || "";
      const pubDate = /<pubDate>([^<]*)<\/pubDate>/.exec(chunk)?.[1]?.trim() || "";
      if (title) items.push({ title, desc: desc.slice(0, 300), pubDate });
    }
    console.log("guide: HAK items", items.length);
    return items;
  } catch (e) { console.warn("guide: HAK error:", e.message); return []; }
}

// ─── DARS (Slovenia highways) — promet.si JSON ───
async function fetchDARS() {
  try {
    const r = await fetch("https://www.promet.si/dc/b2b.dogodki.json", { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return [];
    const data = await r.json();
    const events = Array.isArray(data) ? data : (data.dogodki || data.events || []);
    return events.slice(0, 8).map(e => ({
      title: e.opis || e.description || e.title || "",
      road:  e.cesta || e.road || "",
      sev:   (e.prioriteta || e.priority || "").toLowerCase(),
      type:  (e.tip || e.type || "").toUpperCase(),
    })).filter(e => e.title);
  } catch (e) { console.warn("guide: DARS error:", e.message); return []; }
}

// ─── ASFINAG (Austria) — REST API ───
async function fetchASFINAG() {
  try {
    // ASFINAG open traffic data
    const r = await fetch("https://api.asfinag.at/traffic/hazards?bbox=12.0,46.5,17.5,48.8&limit=20", {
      signal: AbortSignal.timeout(4000),
      headers: { "Accept": "application/json" },
    });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.hazards || data.features || data || []).slice(0, 6).map(h => ({
      title: h.description?.de || h.properties?.description || h.name || "",
      road:  h.road?.name || h.properties?.road || "",
      type:  (h.type || h.properties?.type || "").toUpperCase(),
    })).filter(h => h.title);
  } catch (e) { console.warn("guide: ASFINAG error:", e.message); return []; }
}

async function fetchWeatherRoute(oLat, oLng, dLat, dLng) {
  try {
    // Weather at origin + midpoint + destination
    const mLat = (oLat + dLat) / 2, mLng = (oLng + dLng) / 2;
    const hourlyFields = "temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation_probability";
    const [oriR, midR, dstR] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${oLat}&longitude=${oLng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&hourly=${hourlyFields}&timezone=Europe/Zagreb&forecast_days=1`, { signal: AbortSignal.timeout(4000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${mLat}&longitude=${mLng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m&timezone=Europe/Zagreb`, { signal: AbortSignal.timeout(4000) }),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${dLat}&longitude=${dLng}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,uv_index&hourly=${hourlyFields}&timezone=Europe/Zagreb&forecast_days=1`, { signal: AbortSignal.timeout(4000) }),
    ]);
    const ori = await oriR.json();
    const mid = await midR.json();
    const dst = await dstR.json();
    const wmo = (code) => code <= 1 ? "sunny" : code <= 3 ? "cloudy" : code <= 48 ? "fog" : code <= 67 ? "rain" : code <= 77 ? "snow" : code >= 95 ? "storm" : "overcast";

    // Hourly rain risk at destination (next 6h)
    const nowH = new Date().getHours();
    const dstHourly = (dst.hourly?.time || []).map((t, i) => ({
      h: new Date(t).getHours(),
      rain: dst.hourly.precipitation_probability?.[i] || 0,
      gusts: dst.hourly.wind_gusts_10m?.[i] || 0,
      condition: wmo(dst.hourly.weather_code?.[i] || 0),
    })).filter(s => s.h >= nowH && s.h < nowH + 6);

    const oriHourly = (ori.hourly?.time || []).map((t, i) => ({
      h: new Date(t).getHours(),
      rain: ori.hourly.precipitation_probability?.[i] || 0,
      gusts: ori.hourly.wind_gusts_10m?.[i] || 0,
    })).filter(s => s.h >= nowH && s.h < nowH + 3);

    return {
      origin: { temp: ori.current?.temperature_2m, wind: ori.current?.wind_speed_10m, gusts: ori.current?.wind_gusts_10m, condition: wmo(ori.current?.weather_code || 0), hourly: oriHourly },
      midpoint: { temp: mid.current?.temperature_2m, wind: mid.current?.wind_speed_10m, gusts: mid.current?.wind_gusts_10m, condition: wmo(mid.current?.weather_code || 0) },
      destination: { temp: dst.current?.temperature_2m, wind: dst.current?.wind_speed_10m, gusts: dst.current?.wind_gusts_10m, uv: dst.current?.uv_index, condition: wmo(dst.current?.weather_code || 0), hourly: dstHourly },
    };
  } catch (e) { console.warn("guide: weather error:", e.message); return null; }
}


// HAK severity detection from Croatian text
function hakSeverity(title, desc) {
  const t = (title + " " + desc).toLowerCase();
  if (/zatvor|zaprijek|blokira|zaustav/.test(t)) return "critical";
  if (/nesreć|sudar|prevrnulo|bura.*zatvoren|oluja/.test(t)) return "warning";
  if (/radov|gradilišt|gužv|zastoj|kolona|čekanje/.test(t)) return "info";
  return "tip";
}

// ─── RULES ENGINE — generates intelligence cards from raw data ───

function generateCards(traffic, sense, weather, hak, dars, asfinag, seg, lang) {
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
    const o = weather.origin;
    const d = weather.destination;
    const m = weather.midpoint;

    // Origin departure conditions card
    if (o) {
      const oIcon = o.condition === "sunny" ? "☀️" : o.condition === "rain" ? "🌧️" : o.condition === "snow" ? "🌨️" : o.condition === "fog" ? "🌫️" : o.condition === "storm" ? "⛈️" : "⛅";
      const oRainHours = (o.hourly || []).filter(h => h.rain >= 40);
      const oBody = de
        ? `${oIcon} ${Math.round(o.temp)}°C, Wind ${Math.round(o.wind)} km/h${oRainHours.length ? ` · 🌧️ Regen erwartet ${oRainHours.length}h` : " · Gutes Fahrwetter"}`
        : hr
        ? `${oIcon} ${Math.round(o.temp)}°C, vjetar ${Math.round(o.wind)} km/h${oRainHours.length ? ` · 🌧️ kiša za ${oRainHours.length}h` : " · dobro za polazak"}`
        : `${oIcon} ${Math.round(o.temp)}°C, wind ${Math.round(o.wind)} km/h${oRainHours.length ? ` · 🌧️ rain in ${oRainHours.length}h` : " · good conditions"}`;
      cards.push({
        id: "wx_origin",
        severity: oRainHours.length >= 2 || o.condition === "storm" ? "warning" : "tip",
        icon: oIcon,
        title: de ? "Abfahrt — aktuelles Wetter" : hr ? "Polazak — trenutno vrijeme" : "Departure — current weather",
        body: oBody,
        source: "Open-Meteo",
        ts: new Date().toISOString(),
      });
    }

    // Rain alert at destination in next 6h
    const dstRainHours = (d?.hourly || []).filter(h => h.rain >= 50);
    if (dstRainHours.length >= 2) {
      cards.push({
        id: "wx_rain_dest",
        severity: "warning",
        icon: "🌧️",
        title: de ? "Regen am Zielort erwartet" : hr ? "Kiša na destinaciji" : "Rain expected at destination",
        body: de ? `Regenwahrscheinlichkeit ≥50% für ${dstRainHours.length}h. Kap-Regenschirm einpacken!`
             : hr ? `Kiša ≥50% za ${dstRainHours.length}h. Ponesi kabanicu ili kišobran!`
             : `Rain ≥50% for ${dstRainHours.length}h. Pack a rain jacket!`,
        source: "Open-Meteo",
        ts: new Date().toISOString(),
      });
    }

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

  // ── Sense SENSE INTELLIGENCE ──
  if (sense && sense.total > 0) {
    const sortedRegions = Object.entries(sense.regions).sort((a, b) => b[1].objects - a[1].objects);
    const busiest = sortedRegions[0];
    const quietest = sortedRegions.filter(([_, d]) => d.objects > 0).pop();
    if (busiest && busiest[1].objects > 50) {
      cards.push({
        id: "sense_busy",
        severity: "info",
        icon: "📸",
        title: de ? "Kameras: hohes Aufkommen" : hr ? "Kamere: pojačan promet" : "Sensors: heavy activity",
        body: de ? `${busiest[0]}: ${busiest[1].objects} Objekte (${busiest[1].cars} Autos, ${busiest[1].persons} Personen) auf ${busiest[1].cams} Kameras.${quietest ? ` Ruhiger: ${quietest[0]}` : ""}`
             : hr ? `${busiest[0]}: ${busiest[1].objects} objekata (${busiest[1].cars} auta, ${busiest[1].persons} osoba) na ${busiest[1].cams} kamera.${quietest ? ` Mirnije: ${quietest[0]}` : ""}`
             : `${busiest[0]}: ${busiest[1].objects} objects (${busiest[1].cars} cars, ${busiest[1].persons} people) on ${busiest[1].cams} sensors.${quietest ? ` Quieter: ${quietest[0]}` : ""}`,
        source: "Sense BIG EYE",
        ts: sense.ts,
      });
    }
    // Camper-specific: highway sensor activity
    if (isKamper) {
      const hwRegions = ["inland", "zagreb", "gorski_kotar"];
      const hwCars = hwRegions.reduce((sum, r) => sum + (sense.regions[r]?.cars || 0), 0);
      if (hwCars > 30) {
        cards.push({
          id: "sense_hw",
          severity: "info",
          icon: "🛣️",
          title: de ? "Dichter Autobahnverkehr" : hr ? "Gust promet na autocesti" : "Dense highway traffic",
          body: de ? `${hwCars} Fahrzeuge auf Autobahn-Kameras erkannt. Naplatne können voll sein.`
               : hr ? `${hwCars} vozila na kamerama autoceste. Naplatne rampe mogu biti pune.`
               : `${hwCars} vehicles detected on highway sensors. Toll stations may be crowded.`,
          source: "Sense BIG EYE",
          ts: sense.ts,
        });
      }
    }
  }


  // ── HAK — Croatian roads live feed ──
  if (hak && hak.length > 0) {
    hak.slice(0, 5).forEach((item, i) => {
      const sev = hakSeverity(item.title, item.desc);
      const icon = sev === "critical" ? "⛔" : sev === "warning" ? "🚨" : sev === "info" ? "🟡" : "ℹ️";
      cards.push({
        id: `hak_${i}`,
        severity: sev,
        icon,
        title: `HAK: ${item.title.slice(0, 80)}`,
        body: item.desc || item.title,
        source: "HAK.hr",
        ts: item.pubDate || new Date().toISOString(),
      });
    });
  }

  // ── DARS — Slovenia highways ──
  if (dars && dars.length > 0) {
    dars.slice(0, 3).forEach((item, i) => {
      const isCritical = /CLOS|BLOCK|ACCID/.test(item.type) || /1|visok/.test(item.sev);
      cards.push({
        id: `dars_${i}`,
        severity: isCritical ? "warning" : "info",
        icon: isCritical ? "🚨" : "🟡",
        title: `DARS/SI: ${(item.road ? item.road + " — " : "") + item.title.slice(0, 70)}`,
        body: item.title,
        source: "DARS / promet.si",
        ts: new Date().toISOString(),
      });
    });
  }

  // ── ASFINAG — Austria highways ──
  if (asfinag && asfinag.length > 0) {
    asfinag.slice(0, 2).forEach((item, i) => {
      cards.push({
        id: `asfinag_${i}`,
        severity: "info",
        icon: "🛣️",
        title: `ASFINAG/AT: ${(item.road ? item.road + " — " : "") + item.title.slice(0, 70)}`,
        body: item.title,
        source: "ASFINAG",
        ts: new Date().toISOString(),
      });
    });
  }

  // ── SEGMENT-SPECIFIC INTELLIGENCE ──
  if (isKamper) {
    cards.push({
      id: "seg_kamper_tips",
      severity: "tip",
      icon: "🚐",
      title: de ? "Camper-Hinweise" : hr ? "Kamper savjeti" : "Camper tips",
      body: de ? "A1 Tunnels: Sv.Rok 4.2m, Mala Kapela 4.2m, Učka 4.5m. Bora bei Senj — HAK.hr prüfen! LPG: Zagreb, Karlovac, Zadar, Split."
           : hr ? "A1 tuneli: Sv.Rok 4.2m, Mala Kapela 4.2m, Učka 4.5m. Bura kod Senja — HAK.hr! LPG: Zagreb, Karlovac, Zadar, Split."
           : "A1 tunnels: Sv.Rok 4.2m, Mala Kapela 4.2m, Učka 4.5m. Bora at Senj — check HAK.hr! LPG: Zagreb, Karlovac, Zadar, Split.",
      source: "Segment",
      ts: new Date().toISOString(),
    });
  } else if (seg === "porodica") {
    cards.push({
      id: "seg_porodica_tips",
      severity: "tip",
      icon: "👨‍👩‍👧",
      title: de ? "Familien-Tipps" : hr ? "Obiteljski savjeti" : "Family tips",
      body: de ? "Pausen alle 2h empfohlen. McDonald's: Graz Süd, Ljubljana, Zagreb, Split. Kinderstrand: Nin (Sand+flach), Lopar/Rab."
           : hr ? "Pauze svakih 2h. McDonald's: Graz Süd, Ljubljana, Zagreb, Split. Dječje plaže: Nin (pijesak+plitko), Lopar/Rab."
           : "Breaks every 2h recommended. McDonald's: Graz South, Ljubljana, Zagreb, Split. Kid beaches: Nin (sand+shallow), Lopar/Rab.",
      source: "Segment",
      ts: new Date().toISOString(),
    });
  } else if (seg === "par") {
    cards.push({
      id: "seg_par_tips",
      severity: "tip",
      icon: "💑",
      title: de ? "Paar-Empfehlungen" : hr ? "Preporuke za parove" : "Couple recommendations",
      body: de ? "Romantische Stopps: Bled (15min Abstecher), Motovun (Trüffel), Pelješac Weinstraße, Biokovo Skywalk 1228m."
           : hr ? "Romantični zaustavljanja: Bled (15min skretanje), Motovun (tartufi), Pelješac vinska cesta, Biokovo Skywalk 1228m."
           : "Romantic stops: Bled (15min detour), Motovun (truffles), Pelješac wine road, Biokovo Skywalk 1228m.",
      source: "Segment",
      ts: new Date().toISOString(),
    });
  } else if (seg === "jedrilicar") {
    cards.push({
      id: "seg_jedrilicar_tips",
      severity: "tip",
      icon: "⛵",
      title: de ? "Segler-Info" : hr ? "Nautičke informacije" : "Sailor info",
      body: de ? "ACI Marinas: VHF Ch 17. Maestral nachmittags (W 10-25kn). Tankstellen: Split, Trogir, Zadar, Pula. Wetterbericht: prognoza.hr"
           : hr ? "ACI marine: VHF Ch 17. Maestral poslijepodne (W 10-25kn). Gorivo: Split, Trogir, Zadar, Pula. Prognoza: prognoza.hr"
           : "ACI marinas: VHF Ch 17. Maestral afternoons (W 10-25kn). Fuel: Split, Trogir, Zadar, Pula. Forecast: prognoza.hr",
      source: "Segment",
      ts: new Date().toISOString(),
    });
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
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!guideRateOk(clientIp)) return res.status(429).json({ error: "Rate limit exceeded" });

  const oLat = parseFloat(req.query?.oLat) || 48.2082;
  const oLng = parseFloat(req.query?.oLng) || 16.3738;
  const dLat = parseFloat(req.query?.dLat) || 43.5081;
  const dLng = parseFloat(req.query?.dLng) || 16.4402;
  const seg = req.query?.seg || "auto";
  const lang = req.query?.lang || "hr";

  const key = `${oLat.toFixed(1)}_${oLng.toFixed(1)}_${dLat.toFixed(1)}_${dLng.toFixed(1)}_${seg}_${lang}`;
  if (CACHE.data && CACHE.key === key && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json({ ...CACHE.data, cached: true });
  }

  // Hard timeout: return whatever we have after 8s
  let responded = false;
  const hardTimeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      console.warn("guide.js: hard timeout 8s — returning partial data");
      return res.status(200).json({ cards: [], sources: {}, updated: new Date().toISOString(), timeout: true });
    }
  }, 8000);

  try {
    // Parallel fetch — 6 sources, each with independent timeouts, all fail gracefully
    const [traffic, sense, weather, hak, dars, asfinag] = await Promise.allSettled([
      fetchHereTraffic(oLat, oLng, dLat, dLng),
      fetchYoloSensors(),
      fetchWeatherRoute(oLat, oLng, dLat, dLng),
      fetchHAK(),
      fetchDARS(),
      fetchASFINAG(),
    ]);

    if (responded) return; // hard timeout already fired
    clearTimeout(hardTimeout);
    responded = true;

    const trafficData = traffic.status === "fulfilled" ? (traffic.value || []) : [];
    const senseData   = sense.status === "fulfilled" ? sense.value : null;
    const weatherData = weather.status === "fulfilled" ? weather.value : null;
    const hakData     = hak.status === "fulfilled" ? (hak.value || []) : [];
    const darsData    = dars.status === "fulfilled" ? (dars.value || []) : [];
    const asfinagData = asfinag.status === "fulfilled" ? (asfinag.value || []) : [];

    console.warn(`guide.js: HERE=${trafficData.length} HAK=${hakData.length} DARS=${darsData.length} ASFINAG=${asfinagData.length} Sense=${senseData?.active||0} Wx=${!!weatherData}`);

    const cards = generateCards(trafficData, senseData, weatherData, hakData, darsData, asfinagData, seg, lang);

    cards.sort((a, b) => (SEV[a.severity] ?? 9) - (SEV[b.severity] ?? 9));

    const result = {
      cards,
      sources: { here: trafficData.length, hak: hakData.length, dars: darsData.length, sense: senseData?.active || 0, meteo: !!weatherData },
      updated: new Date().toISOString(),
    };
    CACHE.data = result; CACHE.ts = Date.now(); CACHE.key = key;
    return res.status(200).json(result);
  } catch (e) {
    clearTimeout(hardTimeout);
    if (!responded) {
      responded = true;
      console.error("guide.js error:", e.message);
      return res.status(200).json({ cards: [], sources: {}, updated: new Date().toISOString(), error: e.message });
    }
  }
}
