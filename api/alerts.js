// api/alerts.js — Emergency Alert Aggregator
// Sources: NASA FIRMS (fires), MeteoAlarm/DHMZ (weather), manual critical alerts
// Cached: 10 min (fires update every 3h from satellite, weather every 6h)

const CACHE = { data: null, ts: 0 };
const CACHE_TTL = 600000; // 10 min

// Croatia bounding box (approximate)
const HR_BOUNDS = { minLat: 42.3, maxLat: 46.6, minLon: 13.2, maxLon: 19.5 };

// Region mapping — assign fire/alert to nearest region
const REGION_CENTERS = {
  istra:    { lat: 45.1, lon: 13.9 },
  kvarner:  { lat: 45.0, lon: 14.5 },
  zadar:    { lat: 44.1, lon: 15.3 },
  split:    { lat: 43.5, lon: 16.5 },
  makarska: { lat: 43.3, lon: 17.0 },
  dubrovnik:{ lat: 42.65, lon: 18.1 },
};

function nearestRegion(lat, lon) {
  let best = "split", bestDist = Infinity;
  for (const [id, c] of Object.entries(REGION_CENTERS)) {
    const d = Math.sqrt((lat - c.lat) ** 2 + (lon - c.lon) ** 2);
    if (d < bestDist) { bestDist = d; best = id; }
  }
  return best;
}

// NASA FIRMS — free API, no key needed for country CSV
async function fetchFires() {
  try {
    // VIIRS active fires for Croatia, last 24h
    const url = "https://firms.modaps.eosdis.nasa.gov/api/country/csv/OPEN_KEY/VIIRS_SNPP_NRT/HRV/1";
    const res = await fetch(url, { headers: { "User-Agent": "JadranAI/1.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const header = lines[0].split(",");
    const latIdx = header.indexOf("latitude");
    const lonIdx = header.indexOf("longitude");
    const brIdx = header.indexOf("bright_ti4");
    const confIdx = header.indexOf("confidence");
    const dateIdx = header.indexOf("acq_date");
    const timeIdx = header.indexOf("acq_time");

    const fires = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const lat = parseFloat(cols[latIdx]);
      const lon = parseFloat(cols[lonIdx]);
      const brightness = parseFloat(cols[brIdx] || "0");
      const confidence = cols[confIdx] || "nominal";
      const date = cols[dateIdx] || "";
      const time = cols[timeIdx] || "";

      // Only high-confidence fires
      if (confidence === "low") continue;
      if (lat < HR_BOUNDS.minLat || lat > HR_BOUNDS.maxLat) continue;
      if (lon < HR_BOUNDS.minLon || lon > HR_BOUNDS.maxLon) continue;

      fires.push({
        type: "fire",
        severity: brightness > 350 ? "critical" : brightness > 320 ? "high" : "medium",
        lat, lon,
        region: nearestRegion(lat, lon),
        brightness: Math.round(brightness),
        confidence,
        time: `${date} ${time}`,
      });
    }
    return fires;
  } catch (err) {
    console.error("[ALERTS] FIRMS error:", err.message);
    return [];
  }
}

// MeteoAlarm — RSS/Atom feed (official, reliable)
async function fetchWeatherAlerts() {
  try {
    const url = "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia";
    const res = await fetch(url, { 
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "application/atom+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const alerts = [];
    const entries = xml.split("<entry>").slice(1);
    
    for (const entry of entries) {
      const title = (entry.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const summary = (entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
      const updated = entry.match(/<updated>(.*?)<\/updated>/)?.[1] || "";
      
      // Extract severity color
      let severity = "low";
      const content = title + " " + summary;
      if (/red|crveno|4;/i.test(content)) severity = "critical";
      else if (/orange|narančasto|3;/i.test(content)) severity = "high";
      else if (/yellow|žuto|2;/i.test(content)) severity = "medium";
      else continue; // skip green/no warning
      
      // Extract alert type
      let alertType = "weather";
      if (/wind|vjetar|bura|bora/i.test(content)) alertType = "wind";
      else if (/fire|požar|forest/i.test(content)) alertType = "fire";
      else if (/rain|kiša|oborin/i.test(content)) alertType = "rain";
      else if (/thunder|storm|grmljavin|oluj/i.test(content)) alertType = "storm";
      else if (/heat|toplins|vrućin/i.test(content)) alertType = "heat";
      else if (/snow|snijeg/i.test(content)) alertType = "snow";
      else if (/flood|poplav/i.test(content)) alertType = "flood";
      else if (/fog|magl/i.test(content)) alertType = "fog";
      else if (/coast|wave|val/i.test(content)) alertType = "coastal";
      
      // Match to Adriatic region
      let region = "";
      for (const [id, c] of Object.entries(REGION_CENTERS)) {
        const regionNames = {
          istra: ["istra", "istria", "pula"],
          kvarner: ["kvarner", "rijeka", "cres", "lošinj"],
          zadar: ["zadar", "šibenik", "sibenik"],
          split: ["split", "trogir", "hvar", "brač"],
          makarska: ["makarska", "biokovo", "omiš"],
          dubrovnik: ["dubrovnik", "korčula", "pelješac"],
        };
        if (regionNames[id]?.some(n => content.toLowerCase().includes(n))) {
          region = id;
          break;
        }
      }
      
      alerts.push({
        type: alertType,
        severity,
        region,
        title: title.slice(0, 200),
        description: summary.slice(0, 500),
        source: "MeteoAlarm",
        time: updated,
      });
    }
    return alerts;
  } catch (err) {
    console.error("[ALERTS] MeteoAlarm error:", err.message);
    return [];
  }
}

// HVZ — Hrvatska vatrogasna zajednica DVOC reports (scrape news page)
// Source: hvz.gov.hr/vijesti/8 — daily fire intervention reports
async function fetchHVZ() {
  try {
    const url = "https://hvz.gov.hr/vijesti/8";
    const res = await fetch(url, { 
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "text/html" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    const alerts = [];
    // Look for DVOC reports with fire keywords in last 3 days
    const dvocPattern = /DVOC[^<]{0,100}(\d{1,2}\.\s*(?:siječnja|veljače|ožujka|travnja|svibnja|lipnja|srpnja|kolovoza|rujna|listopada|studenoga?|prosinca)\s*\d{4})[^<]*požar/gi;
    const fireKeywords = /požar\s+(?:otvorenog\s+prostora|raslinja|šume).*?(?:na\s+području|kod|blizu)\s+([^.]{5,80})/gi;
    
    // Extract fire locations from recent DVOC titles/summaries
    const blocks = html.match(/<a[^>]*href="[^"]*vijesti[^"]*"[^>]*>[^<]*(?:požar|DVOC)[^<]*<\/a>/gi) || [];
    
    // Also check for inline fire mentions
    const fireBlocks = html.match(/(?:požar|gori|evakuacij)[^<]{10,300}(?:Dalmacij|Split|Makarska|Dubrovnik|Zadar|Šibenik|Istra|Kvarner|Biokovo|Omiš|Hvar|Brač|Korčula|Pelješac|Trogir)/gi) || [];
    
    const regionNames = {
      istra: ["istra", "istria", "pula", "rovinj", "poreč", "labin", "pazin", "umag", "novigrad"],
      kvarner: ["kvarner", "rijeka", "cres", "lošinj", "krk", "rab", "opatija", "senj", "crikvenica"],
      zadar: ["zadar", "šibenik", "biograd", "nin", "pag", "ugljan", "pašman", "kornati", "murter", "vodice", "knin", "drniš", "skradin"],
      split: ["split", "trogir", "hvar", "brač", "solin", "kaštela", "vis", "šolta", "bol", "supetar", "stari grad", "jelsa", "sinj", "klis", "žrnovnica", "srinjine"],
      makarska: ["makarska", "biokovo", "omiš", "baška voda", "brela", "tučepi", "podgora", "gradac", "živogošće", "krilo jesenica"],
      dubrovnik: ["dubrovnik", "korčula", "pelješac", "mljet", "lastovo", "cavtat", "ston", "slano", "orebić", "metković", "ploče", "neum"],
    };
    
    for (const block of [...blocks, ...fireBlocks]) {
      const text = block.replace(/<[^>]*>/g, "").toLowerCase();
      
      // Only care about fire-related content
      if (!text.includes("požar") && !text.includes("gori") && !text.includes("evakuacij")) continue;
      
      // Determine region
      let region = "";
      for (const [id, names] of Object.entries(regionNames)) {
        if (names.some(n => text.includes(n))) {
          region = id;
          break;
        }
      }
      
      // Determine severity from keywords
      let severity = "medium";
      if (text.includes("evakuacij") || text.includes("canadair") || text.includes("opasnost za") || text.includes("ugrož")) severity = "critical";
      else if (text.includes("veliki") || text.includes("širi se") || text.match(/\d{2,}\s*ha/)) severity = "high";
      
      const cleanTitle = block.replace(/<[^>]*>/g, "").trim().slice(0, 200);
      
      // Avoid duplicates
      if (alerts.some(a => a.title === cleanTitle)) continue;
      
      alerts.push({
        type: "fire",
        severity,
        region,
        title: cleanTitle,
        description: `Izvor: HVZ DVOC (Državni vatrogasni operativni centar 193). Provjerite hvz.gov.hr za detalje.`,
        source: "HVZ",
        time: new Date().toISOString(),
      });
    }
    return alerts.slice(0, 5); // max 5 HVZ alerts
  } catch (err) {
    console.error("[ALERTS] HVZ error:", err.message);
    return [];
  }
}

// ═══ SOURCE 5: HAK — Hrvatski Autoklub (traffic + road conditions) ═══
// Free RSS feed with real-time road closures, traffic jams, ferry delays
async function fetchHAK() {
  try {
    const res = await fetch("https://www.hak.hr/info/stanje-na-cestama/", {
      headers: { "User-Agent": "JADRAN.AI-AlertSystem/1.0" },
    });
    if (!res.ok) return [];
    const rawHtml = await res.text();
    // CRITICAL: Strip ALL HTML tags FIRST, then search clean text
    // Without this, regex captures HTML attributes like data-category="..." class="..."
    const html = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")  // Remove scripts
      .replace(/<style[\s\S]*?<\/style>/gi, " ")     // Remove styles
      .replace(/<[^>]*>/g, " ")                       // Remove all tags
      .replace(/&nbsp;/g, " ")                        // HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");                          // Collapse whitespace
    const alerts = [];

    // Extract road events from HAK page
    // HAK reports: road closures, ferry cancellations, traffic jams, bura closures
    const patterns = [
      { regex: /(?:zatvor|zatvoren|blokiran|zabran)[a-zčćšžđ]*\s+[^.]{5,80}/gi, type: "road_closure", severity: "high" },
      { regex: /(?:trajekt|ferry|kompf?)[a-zčćšžđ]*\s+(?:otkazan|ne prometuje|obustav)[^.]{5,60}/gi, type: "ferry_cancelled", severity: "critical" },
      { regex: /(?:bura|olujn|orkansk)[a-zčćšžđ]*[^.]{5,80}/gi, type: "bura_closure", severity: "critical" },
      { regex: /(?:kolona|zastoj|gužva|čekanje)\s+[^.]{5,80}/gi, type: "traffic_jam", severity: "medium" },
      { regex: /(?:radovi|dionica)[a-zčćšžđ]*\s+[^.]{5,60}/gi, type: "roadworks", severity: "medium" },
    ];

    for (const { regex, type, severity } of patterns) {
      const matches = html.match(regex) || [];
      for (const match of matches.slice(0, 3)) { // Max 3 per type
        const clean = match.trim();
        if (clean.length < 10 || clean.length > 200) continue;
        // Skip if still contains HTML remnants (safety net)
        if (/[<>"=]/.test(clean)) continue;

        // Detect affected region from keywords
        let region = "general";
        const regionMap = {
          istra: /istr|pula|pazin|rovinj|poreč|umag|labin/i,
          kvarner: /kvarner|rijeka|krk|rab|cres|lošinj|senj|jablanac/i,
          zadar: /zadar|šibenik|biograd|nin|pag|kornati/i,
          split: /split|trogir|makarska|omiš|kaštela|brač|hvar|vis/i,
          dubrovnik: /dubrovnik|cavtat|korčula|pelješac|ston|neum/i,
        };
        for (const [r, rx] of Object.entries(regionMap)) {
          if (rx.test(clean)) { region = r; break; }
        }

        alerts.push({
          type,
          severity,
          region,
          title: `HAK: ${clean.slice(0, 100)}`,
          source: "HAK",
          sourceUrl: "https://www.hak.hr/info/stanje-na-cestama/",
          detectedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`[ALERTS] HAK: ${alerts.length} traffic events`);
    return alerts;
  } catch (err) {
    console.error("[ALERTS] HAK error:", err.message);
    return [];
  }
}

// ═══ SOURCE 6: Jadrolinija — official Croatian ferry company disruptions ═══
async function fetchJadrolinija() {
  try {
    const res = await fetch("https://www.jadrolinija.hr/aktualne-obavijesti", {
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "text/html" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const rawHtml = await res.text();
    const html = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\s+/g, " ");

    const alerts = [];
    const patterns = [
      { regex: /otkazan[a-zčćšžđ]*\s+[^.]{10,150}/gi, type: "ferry_cancelled", severity: "critical" },
      { regex: /obustav[a-zčćšžđ]*\s+(?:plovidbe?|prometa?)[^.]{5,120}/gi, type: "ferry_cancelled", severity: "critical" },
      { regex: /ne\s+prometuje[^.]{5,120}/gi, type: "ferry_cancelled", severity: "critical" },
      { regex: /kasnjen[a-zčćšžđ]*\s+[^.]{10,120}/gi, type: "ferry_disruption", severity: "high" },
      { regex: /izmjen[a-zčćšžđ]*\s+(?:reda\s+vožnje|plovidbe)[^.]{10,120}/gi, type: "ferry_disruption", severity: "medium" },
    ];
    const regionMap = {
      istra:    /istr|pula|rovinj|poreč|umag/i,
      kvarner:  /krk|rab|cres|lošinj|rijeka|lopar|valbiska|jablanac|mišnjak|prizna/i,
      zadar:    /zadar|šibenik|pag|biograd|ugljan|dugi\s+otok|ist|premuda|molat|iž/i,
      split:    /split|hvar|brač|vis|šolta|stari\s+grad|jelsa|supetar|bol|milna/i,
      makarska: /makarska|drvenik|sućuraj/i,
      dubrovnik:/dubrovnik|korčula|lastovo|mljet|pelješac|sobra|vela\s+luka|ubli/i,
    };

    for (const { regex, type, severity } of patterns) {
      const matches = html.match(regex) || [];
      for (const match of matches.slice(0, 3)) {
        const clean = match.trim();
        if (clean.length < 10 || clean.length > 250) continue;
        if (/[<>"=]/.test(clean)) continue;
        let region = "";
        for (const [r, rx] of Object.entries(regionMap)) {
          if (rx.test(clean)) { region = r; break; }
        }
        if (alerts.some(a => a.title.includes(clean.slice(0, 40)))) continue;
        alerts.push({
          type, severity, region,
          title: `Jadrolinija: ${clean.slice(0, 150)}`,
          description: "Provjeri jadrolinija.hr za alternativne linije i ažurirani red vožnje.",
          source: "Jadrolinija",
          sourceUrl: "https://www.jadrolinija.hr/aktualne-obavijesti",
          detectedAt: new Date().toISOString(),
        });
      }
    }
    console.log(`[ALERTS] Jadrolinija: ${alerts.length} events`);
    return alerts.slice(0, 6);
  } catch (err) {
    console.error("[ALERTS] Jadrolinija error:", err.message);
    return [];
  }
}

// ═══ SOURCE 7: DHMZ — official Croatian weather warnings (county level) ═══
async function fetchDHMZ() {
  // DHMZ publishes CAP/XML warnings; try their warning RSS and HTML page
  const urls = [
    "https://meteo.hr/prognoza.php?section=prognoza_warning&param=upozorenja",
    "https://meteo.hr/upozorenja.php",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "JadranAI/1.0", "Accept": "text/html" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const rawHtml = await res.text();
      if (!rawHtml || rawHtml.length < 500) continue;

      const html = rawHtml
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/\s+/g, " ");

      const alerts = [];
      const patterns = [
        { regex: /(?:crveno|red)\s+upozorenje[^.]{10,200}/gi, type: "weather", severity: "critical" },
        { regex: /(?:narančasto|orange)\s+upozorenje[^.]{10,200}/gi, type: "weather", severity: "high" },
        { regex: /(?:žuto|yellow)\s+upozorenje[^.]{10,200}/gi, type: "weather", severity: "medium" },
        { regex: /olujn[a-zčćšžđ]*\s+(?:upozorenje|bura|nevrijeme)[^.]{5,150}/gi, type: "wind", severity: "high" },
        { regex: /opasnost\s+od\s+(?:požara|poplave|oluje|snijega|magle)[^.]{5,150}/gi, type: "weather", severity: "high" },
      ];
      const regionMap = {
        istra:    /istr|pula|rovinj|labin|pazin/i,
        kvarner:  /kvarner|rijeka|krk|rab|cres|senj|primorje/i,
        zadar:    /zadar|šibenik|biograd|nin|sjeverodalmatin/i,
        split:    /split|trogir|hvar|brač|dalm/i,
        makarska: /makarska|biokovo|omiš/i,
        dubrovnik:/dubrovnik|korčula|pelješac|neretva/i,
      };

      for (const { regex, type, severity } of patterns) {
        const matches = html.match(regex) || [];
        for (const match of matches.slice(0, 3)) {
          const clean = match.trim();
          if (clean.length < 10 || clean.length > 250) continue;
          if (/[<>"=]/.test(clean)) continue;
          let region = "";
          for (const [r, rx] of Object.entries(regionMap)) {
            if (rx.test(clean)) { region = r; break; }
          }
          if (alerts.some(a => a.title.includes(clean.slice(0, 40)))) continue;
          alerts.push({
            type, severity, region,
            title: `DHMZ: ${clean.slice(0, 150)}`,
            description: "Izvor: Državni hidrometeorološki zavod. Detalji na meteo.hr.",
            source: "DHMZ",
            sourceUrl: url,
            detectedAt: new Date().toISOString(),
          });
        }
      }
      if (alerts.length > 0) {
        console.log(`[ALERTS] DHMZ: ${alerts.length} warnings`);
        return alerts.slice(0, 5);
      }
    } catch (err) {
      console.error("[ALERTS] DHMZ error:", err.message);
    }
  }
  return [];
}

// ═══ SOURCE 8: EEA Bathing Water Quality — poor/insufficient Croatian beaches ═══
async function fetchBathingWater() {
  try {
    // EEA DiscoData REST SQL API — returns beaches with quality problems in Croatia
    const query = encodeURIComponent(
      "SELECT TOP 30 BathingWaterName, annualQuality, municipality " +
      "FROM [WISE_Bathing_Water_Quality_v3].[latest].[v_BathingWaterQuality] " +
      "WHERE countryCode = 'HR' AND annualQuality IN ('Poor','Sufficient') " +
      "AND BathingWaterName IS NOT NULL"
    );
    const url = `https://discodata.eea.europa.eu/sql?query=${query}&p=1&nrOfHits=30`;
    const res = await fetch(url, {
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.results || data?.data || [];
    if (!results.length) return [];

    // Group by quality: Poor = critical, Sufficient = medium
    const poorBeaches = results.filter(r => r.annualQuality === "Poor");
    const sufficientBeaches = results.filter(r => r.annualQuality === "Sufficient");

    const alerts = [];
    const regionMap = {
      istra:    /istr|pula|rovinj|poreč|umag|labin|fažana|medulin|rab|novigrad/i,
      kvarner:  /kvarner|rijeka|opatija|crikvenica|senj|krk|cres|lošinj|rab|malinska/i,
      zadar:    /zadar|šibenik|biograd|nin|pag|vodice|murter|primošten|tisno|pirovac|sibenik/i,
      split:    /split|trogir|hvar|brač|solin|kaštela|vis|šolta|omiš|podstrana|dugi\s+rat/i,
      makarska: /makarska|brela|baška\s+voda|tučepi|podgora|gradac|živogošće/i,
      dubrovnik:/dubrovnik|korčula|pelješac|cavtat|ston|orebić|slano|mljet/i,
    };

    function beachRegion(name, municipality) {
      const text = ((name || "") + " " + (municipality || "")).toLowerCase();
      for (const [r, rx] of Object.entries(regionMap)) {
        if (rx.test(text)) return r;
      }
      return "";
    }

    if (poorBeaches.length > 0) {
      const names = poorBeaches.slice(0, 5).map(b => b.BathingWaterName).join(", ");
      alerts.push({
        type: "bathing_water",
        severity: "high",
        region: beachRegion(poorBeaches[0].BathingWaterName, poorBeaches[0].municipality),
        title: `Loša kakvoća mora: ${names}`,
        description: `${poorBeaches.length} plaža s ocjenom LOŠE prema EU direktivi o kupanju. Izvor: Europska agencija za okoliš (EEA). Preporuča se izbjegavanje kupanja.`,
        source: "EEA Bathing Water",
        sourceUrl: "https://www.eea.europa.eu/themes/water/europes-seas-and-coasts/bathing-water-quality",
        detectedAt: new Date().toISOString(),
      });
    }
    if (sufficientBeaches.length > 0) {
      const names = sufficientBeaches.slice(0, 3).map(b => b.BathingWaterName).join(", ");
      alerts.push({
        type: "bathing_water",
        severity: "medium",
        region: beachRegion(sufficientBeaches[0].BathingWaterName, sufficientBeaches[0].municipality),
        title: `Zadovoljavajuća kakvoća mora: ${names}`,
        description: `${sufficientBeaches.length} plaža s ocjenom ZADOVOLJAVAJUĆE prema EU direktivi. Preporuča se oprez.`,
        source: "EEA Bathing Water",
        sourceUrl: "https://www.eea.europa.eu/themes/water/europes-seas-and-coasts/bathing-water-quality",
        detectedAt: new Date().toISOString(),
      });
    }
    console.log(`[ALERTS] Bathing water: ${alerts.length} quality issues (${poorBeaches.length} poor, ${sufficientBeaches.length} sufficient)`);
    return alerts;
  } catch (err) {
    console.error("[ALERTS] Bathing water error:", err.message);
    return [];
  }
}

// ═══ SOURCE 9: Copernicus EFFIS — active fires & emergency activations (Croatia bbox) ═══
async function fetchCopernicus() {
  try {
    // EFFIS WFS — fire news/incidents in Croatia bounding box (bbox: lon_min,lat_min,lon_max,lat_max)
    const bbox = "13.2,42.3,19.5,46.6";
    const url = `https://ies-ows.jrc.ec.europa.eu/effis?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:firenews&OUTPUTFORMAT=application/json&count=10&CQL_FILTER=ST_Intersects(ms:the_geom,SRID%3D4326%3BPOLYGON((13.2+42.3,19.5+42.3,19.5+46.6,13.2+46.6,13.2+42.3)))`;
    const res = await fetch(url, {
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const features = data?.features || [];
    if (!features.length) return [];

    const alerts = [];
    const regionMap = {
      istra:    /istr|pula|rovinj|poreč|umag|labin|pazin/i,
      kvarner:  /kvarner|rijeka|krk|rab|cres|senj|lika/i,
      zadar:    /zadar|šibenik|biograd|benkovac|knin|drniš/i,
      split:    /split|trogir|omiš|sinj|klis|kaštela|makarska|brač|hvar/i,
      makarska: /makarska|biokovo|omiš|vrgorac/i,
      dubrovnik:/dubrovnik|korčula|pelješac|metković|imotski/i,
    };

    const cutoff = Date.now() - 3 * 24 * 3600 * 1000; // last 3 days
    for (const f of features) {
      const p = f.properties || {};
      const fireDate = p.firedate || p.date || p.reportdate || "";
      if (fireDate && new Date(fireDate).getTime() < cutoff) continue;

      const area = parseFloat(p.area_ha || p.area || 0);
      const severity = area > 500 ? "critical" : area > 50 ? "high" : "medium";
      const country = (p.country || p.country_name || "").toUpperCase();
      if (country && !["HR", "CROATIA", "HRVATSKA"].includes(country)) continue;

      const location = p.region || p.municipality || p.county || p.firename || "";
      let region = "";
      for (const [r, rx] of Object.entries(regionMap)) {
        if (rx.test(location)) { region = r; break; }
      }

      const areaStr = area > 0 ? ` (${Math.round(area)} ha)` : "";
      alerts.push({
        type: "fire",
        severity,
        region,
        title: `Copernicus EFFIS: Požar${location ? " — " + location : ""}${areaStr}`,
        description: `Satelitski podatak Copernicus EFFIS. ${p.country_name || "Hrvatska"}. Datum: ${fireDate || "nedavno"}. ${area > 0 ? "Površina: " + Math.round(area) + " ha." : ""}`,
        source: "Copernicus EFFIS",
        sourceUrl: "https://effis.jrc.ec.europa.eu/",
        detectedAt: new Date().toISOString(),
        lat: f.geometry?.coordinates?.[1],
        lon: f.geometry?.coordinates?.[0],
      });
    }
    console.log(`[ALERTS] Copernicus EFFIS: ${alerts.length} fire events`);
    return alerts.slice(0, 5);
  } catch (err) {
    console.error("[ALERTS] Copernicus error:", err.message);
    return [];
  }
}

// ═══ SOURCE 10: Krilo / G&V Line — fast catamaran lines (Split-Hvar-Korčula-Dubrovnik) ═══
async function fetchKrilo() {
  const sources = [
    { url: "https://www.krilo.hr/hr/novosti", name: "Krilo" },
    { url: "https://www.gv-line.hr/hr/obavijesti", name: "G&V Line" },
  ];
  const alerts = [];
  const regionMap = {
    kvarner:  /krk|rab|cres|lošinj|rijeka/i,
    zadar:    /zadar|šibenik|biograd|primošten|vodice/i,
    split:    /split|hvar|brač|vis|šolta|stari\s+grad|jelsa|supetar|bol|milna/i,
    makarska: /makarska|drvenik|sućuraj/i,
    dubrovnik:/dubrovnik|korčula|lastovo|mljet|pelješac|sobra|vela\s+luka|ubli/i,
  };
  for (const { url, name } of sources) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "JadranAI/1.0" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const html = (await res.text())
        .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
      const patterns = [
        { regex: /otkazan[a-zčćšžđ]*\s+[^.]{10,150}/gi, type: "ferry_cancelled", severity: "critical" },
        { regex: /obustav[a-zčćšžđ]*\s+(?:plovidbe?|prometa?)[^.]{5,120}/gi, type: "ferry_cancelled", severity: "critical" },
        { regex: /ne\s+prometuje[^.]{5,120}/gi, type: "ferry_cancelled", severity: "critical" },
        { regex: /kasnjen[a-zčćšžđ]*\s+[^.]{10,120}/gi, type: "ferry_disruption", severity: "high" },
        { regex: /izmjen[a-zčćšžđ]*\s+(?:reda\s+vožnje|plovidbe)[^.]{10,120}/gi, type: "ferry_disruption", severity: "medium" },
      ];
      for (const { regex, type, severity } of patterns) {
        for (const match of (html.match(regex) || []).slice(0, 2)) {
          const clean = match.trim();
          if (clean.length < 10 || clean.length > 250 || /[<>"=]/.test(clean)) continue;
          let region = "";
          for (const [r, rx] of Object.entries(regionMap)) { if (rx.test(clean)) { region = r; break; } }
          alerts.push({ type, severity, region,
            title: `${name}: ${clean.slice(0, 150)}`,
            description: `Provjeri ${url} za ažurirani red vožnje katamarana.`,
            source: name, sourceUrl: url, detectedAt: new Date().toISOString() });
        }
      }
    } catch (err) { console.error(`[ALERTS] ${name} error:`, err.message); }
  }
  console.log(`[ALERTS] Krilo/G&V: ${alerts.length} events`);
  return alerts.slice(0, 4);
}

// ═══ SOURCE 11: Copernicus CAMS — air quality & wildfire smoke (AQI over Croatia) ═══
async function fetchCAMS() {
  try {
    // CAMS European Air Quality Forecast API (open, no key needed for general AQ)
    // Bounding box covers Adriatic coast: lat 42.3-46.6, lon 13.2-19.5
    const url = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=43.5,44.1,42.65&longitude=16.5,15.3,18.1&current=pm2_5,pm10,dust,uv_index,alder_pollen&domains=cams_europe";
    const res = await fetch(url, { headers: { "User-Agent": "JadranAI/1.0" }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();

    const alerts = [];
    const locations = [
      { name: "Split", region: "split" },
      { name: "Zadar", region: "zadar" },
      { name: "Dubrovnik", region: "dubrovnik" },
    ];

    // data is array if multiple locations; wrap single in array
    const results = Array.isArray(data) ? data : [data];
    for (let i = 0; i < results.length; i++) {
      const d = results[i];
      const loc = locations[i] || { name: "Jadran", region: "" };
      const pm25 = d?.current?.pm2_5;
      const pm10 = d?.current?.pm10;
      const dust = d?.current?.dust;

      // WHO thresholds: PM2.5 >35 = unhealthy, >75 = very unhealthy; PM10 >50 = moderate, >150 = unhealthy
      if (pm25 >= 75 || pm10 >= 150) {
        alerts.push({ type: "air_quality", severity: "critical", region: loc.region,
          title: `Zagađen zrak: ${loc.name} — PM2.5 ${Math.round(pm25||0)} µg/m³, PM10 ${Math.round(pm10||0)} µg/m³`,
          description: `Opasna razina čestica u zraku (WHO granica: PM2.5 25 µg/m³). Mogući uzrok: požar ili industrijske emisije. Izbjegavajte boravak na otvorenom. Izvor: Copernicus CAMS.`,
          source: "Copernicus CAMS", sourceUrl: "https://atmosphere.copernicus.eu/", detectedAt: new Date().toISOString() });
      } else if (pm25 >= 35 || pm10 >= 50) {
        alerts.push({ type: "air_quality", severity: "high", region: loc.region,
          title: `Povišene čestice u zraku: ${loc.name} — PM2.5 ${Math.round(pm25||0)} µg/m³`,
          description: `Umjereno zagađenje zraka. Osjetljive osobe (djeca, stariji, astma) trebaju ograničiti boravak vani. Izvor: Copernicus CAMS.`,
          source: "Copernicus CAMS", sourceUrl: "https://atmosphere.copernicus.eu/", detectedAt: new Date().toISOString() });
      }
      if (dust >= 50) {
        alerts.push({ type: "air_quality", severity: "medium", region: loc.region,
          title: `Saharski prašak: ${loc.name} — ${Math.round(dust)} µg/m³`,
          description: `Povišena koncentracija saharskog prašaka. Može uzrokovati crvenilo očiju i respiratorne tegobe. Ispirajte auto vodom. Izvor: Copernicus CAMS.`,
          source: "Copernicus CAMS", sourceUrl: "https://atmosphere.copernicus.eu/", detectedAt: new Date().toISOString() });
      }
    }
    console.log(`[ALERTS] CAMS: ${alerts.length} air quality events`);
    return alerts;
  } catch (err) {
    console.error("[ALERTS] CAMS error:", err.message);
    return [];
  }
}

// Aggregate all sources
async function aggregateAlerts() {
  const [fires, weather, hvz, hak, jadrolinija, dhmz, bathingWater, copernicus, krilo, cams] = await Promise.all([
    fetchFires(),
    fetchWeatherAlerts(),
    fetchHVZ(),
    fetchHAK(),
    fetchJadrolinija(),
    fetchDHMZ(),
    fetchBathingWater(),
    fetchCopernicus(),
    fetchKrilo(),
    fetchCAMS(),
  ]);

  // Deduplicate fires by proximity (cluster within 0.05 degrees ≈ 5km)
  const clustered = [];
  for (const fire of fires) {
    const existing = clustered.find(f =>
      Math.abs(f.lat - fire.lat) < 0.05 && Math.abs(f.lon - fire.lon) < 0.05
    );
    if (existing) {
      if (fire.brightness > existing.brightness) {
        existing.brightness = fire.brightness;
        existing.severity = fire.severity;
      }
      existing.count = (existing.count || 1) + 1;
    } else {
      clustered.push({ ...fire, count: 1 });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  const all = [...clustered, ...weather, ...hvz, ...hak, ...jadrolinija, ...dhmz, ...bathingWater, ...copernicus, ...krilo, ...cams].sort((a, b) =>
    (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  );

  // Normalize: add icon + message fields for frontend compatibility
  const TYPE_ICONS = { fire:"🔥", wind:"🌬️", storm:"⛈", rain:"🌧️", heat:"🌡️", coastal:"🌊", flood:"💧", fog:"🌫️", snow:"❄️", road_closure:"⚠️", ferry_cancelled:"⛴️", ferry_disruption:"⛴️", bura_closure:"🌬️", traffic_jam:"🚗", roadworks:"🔧", weather:"⛈", bathing_water:"🏊", dhmz_warning:"☁️", air_quality:"😷" };
  const normalized = all.slice(0, 20).map(a => ({
    ...a,
    icon: TYPE_ICONS[a.type] || "⚠️",
    message: a.description ? `${a.title} — ${a.description}`.slice(0, 500) : a.title?.slice(0, 500) || "",
  }));

  return {
    fires: clustered.length + hvz.filter(a => a.type === "fire").length + copernicus.length,
    weather: weather.length,
    hvz: hvz.length,
    hak: hak.length,
    jadrolinija: jadrolinija.length,
    dhmz: dhmz.length,
    bathingWater: bathingWater.length,
    copernicus: copernicus.length,
    krilo: krilo.length,
    cams: cams.length,
    total: normalized.length,
    alerts: normalized,
    updated: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Check cache
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) {
    return res.status(200).json(CACHE.data);
  }

  try {
    const data = await aggregateAlerts();
    CACHE.data = data;
    CACHE.ts = Date.now();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[ALERTS] Aggregation error:", err.message);
    return res.status(500).json({ error: err.message, fires: 0, weather: 0, total: 0, alerts: [] });
  }
}
