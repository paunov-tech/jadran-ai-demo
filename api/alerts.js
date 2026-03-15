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

// Auswärtiges Amt — German Federal Foreign Office travel advisories (RSS)
// "Sveto pismo" za nemce. THE trusted source for DE/AT tourists.
// Covers: Kroatien, Slowenien (transit), Montenegro (expansion)
async function fetchAuswaertigesAmt() {
  try {
    const url = "https://www.auswaertiges-amt.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/RSS_Reisehinweise.xml";
    const res = await fetch(url, {
      headers: { "User-Agent": "JadranAI/1.0", "Accept": "application/rss+xml,application/xml,text/xml" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const alerts = [];
    const targetCountries = ["kroatien", "slowenien", "montenegro", "bosnien"];
    
    const items = xml.split("<item>").slice(1);
    for (const item of items) {
      const title = (item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const desc = (item.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const link = (item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] || "").trim();

      const combined = (title + " " + desc).toLowerCase();
      const matchedCountry = targetCountries.find(c => combined.includes(c));
      if (!matchedCountry) continue;

      // Severity from warning keywords
      let severity = "medium";
      if (/reisewarnung|warnt? dringend|nicht reisen|ausreise|evakuierung/i.test(combined)) severity = "critical";
      else if (/teilreisewarnung|warnung|gefahr|waldbrände?|überschwemmung|grenzschließung|grenzkontrollen|erdbeben|unruhen/i.test(combined)) severity = "high";
      
      // Only actionable warnings
      const hasWarning = /warnung|gefahr|brand|feuer|sturm|überschwemmung|erdbeben|grenz|terror|streik|demonstrat|evakuier|krise|minen/i.test(combined);
      if (!hasWarning && severity === "medium") continue;

      let region = "";
      if (matchedCountry === "kroatien") {
        if (/dalmat|split|dubrovnik|makarska/i.test(combined)) region = "split";
        else if (/istr/i.test(combined)) region = "istra";
        else if (/kvarner|rijeka/i.test(combined)) region = "kvarner";
        else if (/zadar|šibenik|sibenik/i.test(combined)) region = "zadar";
      }

      alerts.push({
        type: "travel_advisory",
        severity,
        region,
        title: `🇩🇪 ${title.slice(0, 150)}`,
        description: desc.slice(0, 400),
        source: "Auswärtiges Amt",
        time: pubDate,
        url: link || "https://www.auswaertiges-amt.de/de/service/laender/kroatien-node/kroatiensicherheit/210072",
        country: matchedCountry,
      });
    }
    return alerts.slice(0, 3);
  } catch (err) {
    console.error("[ALERTS] Auswärtiges Amt error:", err.message);
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

// Aggregate all sources
async function aggregateAlerts() {
  const [fires, weather, hvz, aa, hak] = await Promise.all([
    fetchFires(),
    fetchWeatherAlerts(),
    fetchHVZ(),
    fetchAuswaertigesAmt(),
    fetchHAK(),
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
  const all = [...clustered, ...weather, ...hvz, ...aa, ...hak].sort((a, b) =>
    (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3)
  );

  return {
    fires: clustered.length + hvz.filter(a => a.type === "fire").length,
    weather: weather.length,
    hvz: hvz.length,
    aa: aa.length,
    hak: hak.length,
    total: all.length,
    alerts: all.slice(0, 12), // Max 12 alerts (was 10, +2 for HAK)
    updated: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin === "https://jadran.ai" ? "https://jadran.ai" : req.headers.origin || "*");
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
