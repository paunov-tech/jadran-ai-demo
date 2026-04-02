// ── HAK — Croatian Automobile Club road incidents ─────────────────────────
// Source: HAK public RSS + fallback to known planned works
// Covers: accidents, closures, roadworks, border queues, weather closures

let _hakCache = null;
let _hakCacheTs = 0;
const HAK_TTL = 10 * 60 * 1000; // 10 min

// ── ROUTE KEYWORD MAPPING ─────────────────────────────────────────────────
const ROUTE_KEYWORDS = {
  a1_zg_split:   ["A1","autocesta","Zagreb-Split","Bosiljevo","Sveti Rok","Šestanovac","Dugopolje","Ploče"],
  a6_rijeka:     ["A6","Bosiljevo-Rijeka","Delnice","Vrbovsko"],
  a2_macelj:     ["A2","Macelj","Zaprešić","Krapina"],
  a7_rupa:       ["A7","Rupa","Permani"],
  a8_istra:      ["A8","Istra","Učka","tunel Učka","Mirna"],
  border:        ["granica","border","Macelj","Bregana","Rupa","Šentilj","Karavanke","Pasjak"],
  krk_most:      ["Krčki most","Krk most"],
  jablanac:      ["Jablanac","Stinica","Prizna","Senj","D8"],
  senj:          ["Senj","Magistrala","bura","Mašlenica"],
  maslenica:     ["Mašlenica","Zadar-Split","Novigrad"],
  split:         ["Split","Stobreč","Solin","Kaštela"],
  dubrovnik:     ["Dubrovnik","Pelješki most","Neum","Ploče"],
};

// ── SEVERITY PARSER ───────────────────────────────────────────────────────
function parseSeverity(text) {
  const t = text.toLowerCase();
  if (t.includes("zatvoreno") || t.includes("zabrana") || t.includes("obustavljen"))
    return "critical";
  if (t.includes("kolona") || t.includes("prometna nesreća") || t.includes("gužva"))
    return "high";
  if (t.includes("radovi") || t.includes("smanjena") || t.includes("usporenje"))
    return "medium";
  return "low";
}

function detectRoutes(text) {
  const matched = [];
  for (const [route, keywords] of Object.entries(ROUTE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) matched.push(route);
  }
  return matched;
}

// ── HAK RSS FETCH ─────────────────────────────────────────────────────────
async function fetchHAKRSS() {
  // HAK publishes road conditions via RSS and their website
  // Public RSS: https://www.hak.hr/rss/promet.xml (road conditions)
  // Also: https://www.hak.hr/rss/granice.xml (border queues)
  const urls = [
    "https://www.hak.hr/rss/promet.xml",
    "https://www.hak.hr/info/stanje-na-cestama/",
  ];

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; jadran-ai-bot/1.0; +https://jadran.ai)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) continue;
      const text = await r.text();

      // Parse RSS XML items
      const incidents = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const item = match[1];
        const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                       item.match(/<title>(.*?)<\/title>/))?.[1]?.trim() || "";
        const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                      item.match(/<description>(.*?)<\/description>/))?.[1]?.trim() || "";
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]?.trim() || "";

        if (!title && !desc) continue;
        const fullText = `${title} ${desc}`;
        const age = pubDate ? (Date.now() - new Date(pubDate).getTime()) / 3600000 : 0;
        if (age > 6) continue; // Skip incidents older than 6h

        incidents.push({
          title, desc, pubDate,
          severity: parseSeverity(fullText),
          routes: detectRoutes(fullText),
          raw: fullText.substring(0, 300),
        });
      }

      if (incidents.length) return incidents;
    } catch (e) {
      console.warn(`[hak] fetch ${url} failed:`, e.message);
    }
  }
  return null;
}

// ── BORDER QUEUE ESTIMATION (pattern-based when HAK unavailable) ───────────
function estimateBorderQueues() {
  const now = new Date();
  const h = now.getHours();
  const day = now.getDay();
  const month = now.getMonth() + 1;
  const isSeason = month >= 6 && month <= 8;
  const isFri = day === 5;
  const isSun = day === 0;
  const isSat = day === 6;

  const queues = [];

  if (isSeason && isFri && h >= 14 && h <= 20) {
    queues.push({ border: "Macelj (HR-SLO)", wait: "60-120 min", dir: "ulaz u HR" });
    queues.push({ border: "Bregana (HR-SLO)", wait: "45-90 min", dir: "ulaz u HR" });
    queues.push({ border: "Rupa (HR-SLO)", wait: "30-60 min", dir: "ulaz u HR" });
  }
  if (isSeason && (isSun || isSat) && h >= 16 && h <= 22) {
    queues.push({ border: "Macelj (HR-SLO)", wait: "30-60 min", dir: "izlaz iz HR (povratak)" });
    queues.push({ border: "Šentilj (SLO-AT)", wait: "20-45 min", dir: "prema Austriji" });
  }
  if (isSeason && h >= 8 && h <= 18) {
    queues.push({ border: "Karavanke tunel (SLO-AT)", wait: "15-30 min", dir: "obostrano" });
  }

  return queues;
}

// ── MAIN FETCH ─────────────────────────────────────────────────────────────
export async function fetchHAKIntel(region) {
  if (_hakCache && Date.now() - _hakCacheTs < HAK_TTL) {
    return filterByRegion(_hakCache, region);
  }

  const [incidents, borders] = await Promise.all([
    fetchHAKRSS(),
    Promise.resolve(estimateBorderQueues()),
  ]);

  const data = { incidents: incidents || [], borders, ts: new Date().toISOString() };
  _hakCache = data;
  _hakCacheTs = Date.now();
  return filterByRegion(data, region);
}

function filterByRegion(data, region) {
  if (!region || region === "all") return data;
  const REGION_ROUTES = {
    istra:           ["a8_istra","a7_rupa","border"],
    kvarner:         ["a6_rijeka","a7_rupa","krk_most","jablanac","senj","border"],
    zadar_sibenik:   ["a1_zg_split","maslenica","border"],
    split_makarska:  ["a1_zg_split","split","border"],
    dubrovnik:       ["a1_zg_split","dubrovnik","border"],
  };
  const routes = REGION_ROUTES[region] || [];

  return {
    ...data,
    incidents: data.incidents.filter(i => i.routes.some(r => routes.includes(r))),
  };
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
export function buildHAKPrompt(hakData) {
  const { incidents, borders } = hakData;
  if (!incidents?.length && !borders?.length) return "";

  const lines = ["[HAK — stanje na cestama, live]"];
  const ICON = { critical: "🚨", high: "⚠️", medium: "🔧", low: "ℹ️" };

  if (incidents?.length) {
    for (const inc of incidents.slice(0, 5)) {
      lines.push(`${ICON[inc.severity]} ${inc.title}`);
      if (inc.desc && inc.desc !== inc.title) lines.push(`  ${inc.desc.substring(0, 150)}`);
    }
  }

  if (borders?.length) {
    lines.push("\n[GRANICE — procjena čekanja]");
    for (const b of borders) {
      lines.push(`⏱️ ${b.border} (${b.dir}): ~${b.wait}`);
    }
  }

  lines.push(`\nPRAVILA:
- HAK incident critical → odmah upozori bez čekanja pitanja
- Bura zabrana: alternativa trajekt Crikvenica-Šilo (za Krk), Jablanac-Mišnjak ostaje ako slabija
- Granica: DARS + HAK kombiniraj za realnu procjenu
- Za sve incidente: navedi alternativnu rutu`);

  return lines.join("\n");
}
