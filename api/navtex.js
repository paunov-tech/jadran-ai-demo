// ═══ DHMZ NAVTEX MARITIME FORECAST SCRAPER ═══
// Source: https://meteo.hr/prognoze.php?section=prognoze_specp&param=pomorci
// Official Croatian Meteorological Service — maritime safety forecast

// Rate limit: 30/hour per IP (scrapes external government site)
const _rl = new Map();
function navRateOk(ip) {
  const now = Date.now(), WIN = 3600000;
  for (const [k, v] of _rl) { if (now > v.r) _rl.delete(k); }
  const e = _rl.get(ip);
  if (!e || now > e.r) { _rl.set(ip, { c: 1, r: now + WIN }); return true; }
  if (e.c >= 30) return false;
  e.c++; return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', (["https://jadran.ai","https://www.jadran.ai","https://monte-negro.ai","https://www.monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) ? req.headers.origin : "https://jadran.ai"));
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800'); // 30min cache

  if (req.method === 'OPTIONS') return res.status(200).end();
  const clientIp = (req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (!navRateOk(clientIp)) return res.status(429).json({ error: "Too many requests" });

  try {
    // Fetch BOTH pages: NAVTEX + nautičari prognoza
    const [navtexRes, jadranRes] = await Promise.all([
      fetch('https://meteo.hr/prognoze.php?section=prognoze_specp&param=pomorci'),
      fetch('https://meteo.hr/prognoze.php?section=prognoze_specp&param=jadran'),
    ]);

    const navtexHtml = await navtexRes.text();
    const jadranHtml = await jadranRes.text();

    // ── PARSE NAVTEX ──
    const result = { source: "DHMZ NAVTEX", url: "https://meteo.hr/prognoze.php?section=prognoze_specp&param=pomorci" };

    // Extract warning
    const warnMatch = navtexHtml.match(/<h5>Upozorenje<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
    result.warning = warnMatch ? cleanHtml(warnMatch[1]) : null;

    // Extract state (synoptic situation)
    const stateMatch = navtexHtml.match(/<h5>Stanje<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
    result.synoptic = stateMatch ? cleanHtml(stateMatch[1]) : null;

    // Extract validity
    const validMatch = navtexHtml.match(/vrijedi do:\s*(\d{2}\.\d{2}\.\d{4}[^<]*)/i);
    result.validUntil = validMatch ? validMatch[1].trim() : null;

    // Extract zone forecasts
    const zones = {};
    const zoneRegex = /<h5>(Sjeverni|Srednji|Južni) Jadran<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    let zm;
    while ((zm = zoneRegex.exec(navtexHtml)) !== null) {
      const zoneName = zm[1].toLowerCase(); // sjeverni, srednji, južni
      zones[zoneName] = cleanHtml(zm[2]);
    }
    result.zones = zones;

    // Extract station table
    const stations = [];
    const tableMatch = navtexHtml.match(/<h5>Vrijeme na Jadranu[^<]*<\/h5>\s*<table[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
      let rm;
      while ((rm = rowRegex.exec(tableMatch[1])) !== null) {
        const place = cleanHtml(rm[1]).trim();
        if (place && place !== 'Mjesto') {
          stations.push({
            place,
            wind: cleanHtml(rm[2]).trim(),
            sea: cleanHtml(rm[3]).trim(),
            visibility: cleanHtml(rm[4]).trim(),
            conditions: cleanHtml(rm[5]).trim(),
            pressure: cleanHtml(rm[6]).trim(),
          });
        }
      }
    }
    result.stations = stations;

    // ── PARSE JADRAN NAUTIČARI PROGNOZA ──
    // This has more detailed wind/sea forecasts with morning/afternoon
    const jadranForecast = {};
    const jadranZoneRegex = /<h5>(Sjeverni|Srednji|Južni) Jadran<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    let jm;
    while ((jm = jadranZoneRegex.exec(jadranHtml)) !== null) {
      jadranForecast[jm[1].toLowerCase()] = cleanHtml(jm[2]);
    }
    result.jadranDetailed = jadranForecast;

    // Extract Jadran warning if different
    const jadranWarn = jadranHtml.match(/<h5>Upozorenje<\/h5>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
    if (jadranWarn) {
      const jw = cleanHtml(jadranWarn[1]);
      if (jw && jw !== result.warning) result.jadranWarning = jw;
    }

    // Map regions to zones
    result.regionZoneMap = {
      istra: "sjeverni",
      kvarner: "sjeverni",
      zadar: "srednji",
      split: "srednji",
      makarska: "srednji",
      dubrovnik: "južni",
    };

    // Find nearest station per region
    result.regionStationMap = {
      istra: "Mali Lošinj",
      kvarner: "Rijeka",
      zadar: "Zadar",
      split: "Split",
      makarska: "Split",
      dubrovnik: "Dubrovnik",
    };

    return res.status(200).json(result);
  } catch (err) {
    console.error('DHMZ scrape error:', err);
    return res.status(500).json({ error: 'DHMZ data unavailable', message: err.message });
  }
}

function cleanHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
