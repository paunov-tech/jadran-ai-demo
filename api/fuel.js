// ── FUEL INTELLIGENCE — Croatia Adriatic Coast ────────────────────────────
// LPG stations, fuel prices, crisis mode, "last station" warnings
// Iran war context: Strait of Hormuz risk → price spike + shortage protocol
//
// Crisis thresholds (EUR):
//   Diesel > 2.20 → ALERT, > 2.50 → CRITICAL
//   Benzin 95 > 2.30 → ALERT, > 2.60 → CRITICAL
//   LPG/Autogas > 1.10 → ALERT, > 1.40 → CRITICAL

// ── CRISIS CONFIG ─────────────────────────────────────────────────────────
const CRISIS = {
  diesel:  { alert: 2.20, critical: 2.50 },
  benzin:  { alert: 2.30, critical: 2.60 },
  lpg:     { alert: 1.10, critical: 1.40 },
};

// ── LPG STATION DATABASE ──────────────────────────────────────────────────
// LPG (autogas/propan-butan) je rijedak u HR — svaka postaja vrijedi zlata za kampere
// Oznake: INA = Autoplin, Petrol (SLO chain), OMV, Tifon, Lukoil/Crodux
export const LPG_STATIONS = [

  // ── ULAZNI KORIDORI ───────────────────────────────────────────────────────
  { id: "LPG-A6-001", name: "INA Deanovec", route: "A2_Zagreb", region: "inland",
    coords: [45.7821, 16.5234], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Zadnja INA s LPG na A2 prije Karlovca. Adblue dostupan." },

  { id: "LPG-A6-002", name: "OMV Karlovac", route: "A6_Rijeka", region: "inland",
    coords: [45.4889, 15.5472], brand: "OMV",
    fuels: ["LPG","D","B95"], h24: true,
    note: "A6 čvor Karlovac. LPG, Adblue, autoperač za kampere." },

  { id: "LPG-A6-003", name: "INA Vukova Gorica", route: "A6_Rijeka", region: "inland",
    coords: [45.5231, 15.2847], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "06:00-22:00",
    note: "A6 između Karlovca i Rijeke. Jedina LPG u tom segmentu!" },

  { id: "LPG-A6-004", name: "INA Rijeka Krnjevo", route: "A6_Rijeka", region: "kvarner",
    coords: [45.3426, 14.4078], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Rijeka, čvor A6/A7. Zadnja LPG za kampere prema Kvarneru." },

  { id: "LPG-A7-001", name: "Petrol Rupa (HR-SLO granica)", route: "A7_Rupa", region: "kvarner",
    coords: [45.4722, 14.2631], brand: "Petrol",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Odmah na HR strani. Petrol (SLO chain) ima LPG pouzdano." },

  // ── ISTRA ─────────────────────────────────────────────────────────────────
  { id: "LPG-IST-001", name: "INA Pula Stoja", route: "A9_Pula", region: "istra",
    coords: [44.8691, 13.8472], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-21:00",
    note: "Pula, jedina LPG u Puli. Popuni u Puli — nema više prema jugu Istre." },

  { id: "LPG-IST-002", name: "Tifon Poreč", route: "D75_Porec", region: "istra",
    coords: [45.2284, 13.5939], brand: "Tifon",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Poreč obilaznica. LPG 24h. Popularan za kampere prema Polari/Zelena Laguna." },

  { id: "LPG-IST-003", name: "INA Rovinj", route: "D75_Rovinj", region: "istra",
    coords: [45.0847, 13.6392], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-22:00",
    note: "Jedina LPG u Rovinju. Popuni ovdje — kampovi okolo nemaju LPG." },

  { id: "LPG-IST-004", name: "Petrol Umag", route: "D75_Umag", region: "istra",
    coords: [45.4336, 13.5217], brand: "Petrol",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Umag ulaz. Najpouzdanija LPG sjeverna Istra." },

  // ── KVARNER ───────────────────────────────────────────────────────────────
  { id: "LPG-KVA-001", name: "INA Senj", route: "D8_Senj", region: "kvarner",
    coords: [44.9931, 14.9012], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "06:00-22:00",
    lastBefore: ["rab_ferry_stinica"],
    note: "⚠️ ZADNJA LPG PRIJE RABA! Stinica trajekt 18km dalje. Rab island NEMA LPG." },

  { id: "LPG-KVA-002", name: "INA Krk (grad)", route: "D102_Krk", region: "kvarner",
    coords: [45.0267, 14.5712], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-21:00",
    note: "Jedina LPG na Krku! Popuni u gradu Krku — ostale INA na otoku je nemaju." },

  { id: "LPG-KVA-003", name: "INA Crikvenica", route: "D8_Crikvenica", region: "kvarner",
    coords: [45.1731, 14.6912], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: false, openHours: "06:00-22:00",
    note: "Crikvenica D8. LPG za kampere prema selce/Hrelinu." },

  // ── ZADAR / ŠIBENIK ───────────────────────────────────────────────────────
  { id: "LPG-ZAD-001", name: "INA Zadar Sjever", route: "A1_Zadar", region: "zadar_sibenik",
    coords: [44.1432, 15.2013], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "A1 čvor Zadar sjever. 24h, LPG. Blizina Zaton kampa (14km)." },

  { id: "LPG-ZAD-002", name: "Tifon Biograd", route: "D8_Biograd", region: "zadar_sibenik",
    coords: [43.9434, 15.4483], brand: "Tifon",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-22:00",
    lastBefore: ["pašman_trajekt"],
    note: "Biograd. Zadnja LPG prije trajekta Biograd-Tkon. Pašman nema LPG." },

  { id: "LPG-ZAD-003", name: "INA Vodice", route: "D8_Vodice", region: "zadar_sibenik",
    coords: [43.7621, 15.7891], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-21:00",
    note: "Vodice D8. Između Zadra i Šibenika." },

  { id: "LPG-ZAD-004", name: "OMV Šibenik", route: "D8_Sibenik", region: "zadar_sibenik",
    coords: [43.7341, 15.8892], brand: "OMV",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Šibenik obilaznica. 24h. Dobra točka za kampere prema NP Krki." },

  // ── SPLIT / MAKARSKA ──────────────────────────────────────────────────────
  { id: "LPG-SPL-001", name: "INA Split Solin", route: "A1_Split", region: "split_makarska",
    coords: [43.5427, 16.4821], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "A1 čvor Split-Solin. 24h. Jedina LPG uz A1 ulaz u Split. Ultra Europe vikend: queue do 45 min!" },

  { id: "LPG-SPL-002", name: "Tifon Stobreč", route: "D8_Stobrec", region: "split_makarska",
    coords: [43.5013, 16.5621], brand: "Tifon",
    fuels: ["LPG","D","B95"], h24: false, openHours: "06:00-22:00",
    note: "Uz Camping Stobreč. Idealno za kampere u kampu." },

  { id: "LPG-SPL-003", name: "INA Makarska", route: "D8_Makarska", region: "split_makarska",
    coords: [43.2981, 17.0121], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-22:00",
    lastBefore: ["drvenik_trajekt_hvar"],
    note: "Makarska, D8. ⚠️ Zadnja LPG ako ideš na Hvar (Drvenik-Sučuraj). Hvar NEMA LPG." },

  // ── DUBROVNIK / PELJEŠAC ──────────────────────────────────────────────────
  { id: "LPG-DUB-001", name: "INA Ploče", route: "A1_Ploca", region: "dubrovnik",
    coords: [43.0578, 17.4342], brand: "INA",
    fuels: ["LPG","D","B95","B98"], h24: true,
    note: "Ploče, A1 jug. Zadnja siguran LPG prije Pelješca i Dubrovnika." },

  { id: "LPG-DUB-002", name: "Tifon Dubrovnik Komolac", route: "A1_Dubrovnik", region: "dubrovnik",
    coords: [42.6821, 18.0873], brand: "Tifon",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-21:00",
    note: "Dubrovnik sjever, ulaz u grad. Zadnja LPG — Dubrovnik centar nema pristup za kampere." },

  { id: "LPG-DUB-003", name: "INA Cavtat", route: "D8_Cavtat", region: "dubrovnik",
    coords: [42.5871, 18.2234], brand: "INA",
    fuels: ["LPG","D","B95"], h24: false, openHours: "07:00-21:00",
    note: "Cavtat, D8 prema crnogorskoj granici." },
];

// ── "LAST STATION" WARNINGS ───────────────────────────────────────────────
// Islands and remote areas with NO fuel (or very limited)
export const FUEL_DEAD_ZONES = {
  rab:     { note: "⛽ RAB ISLAND: Jedina benzinska bez LPG. NAPUNI U SENJU (18km prije Stinice)!", hasFuel: true, hasLPG: false },
  hvar:    { note: "⛽ HVAR: Jedna benzinska u Starom Gradu, jedna u Hvaru — bez LPG. Napuni u Makarskoj prije Drvenika!", hasFuel: true, hasLPG: false },
  vis:     { note: "⛽ VIS: Jedna benzinska, bez LPG. Napuni u Splitu.", hasFuel: true, hasLPG: false },
  korcula: { note: "⛽ KORČULA: Ograničeno gorivo. LPG nema. Napuni na kopnu.", hasFuel: true, hasLPG: false },
  brac:    { note: "⛽ BRAČ: Supetar i Bol imaju benzin, LPG nema.", hasFuel: true, hasLPG: false },
  mljet:   { note: "⛽ MLJET: Samo Babino Polje — malo gorivo. LPG nema. Napuni u Dubrovniku!", hasFuel: true, hasLPG: false },
  cres:    { note: "⛽ CRES: Grad Cres ima benzin, LPG nema. Napuni u Rijeci/Lovranu.", hasFuel: true, hasLPG: false },
  losinj:  { note: "⛽ LOŠINJ: Mali Lošinj ima benzin i dizel, LPG nema. Napuni u Rijeci.", hasFuel: true, hasLPG: false },
  pasman:  { note: "⛽ PAŠMAN: NEMA benzinske postaje! Napuni u Biogradu.", hasFuel: false, hasLPG: false },
  murter:  { note: "⛽ MURTER: Jedna benzinska, LPG nema.", hasFuel: true, hasLPG: false },
};

// ── PRICE CACHE ───────────────────────────────────────────────────────────
let _priceCache = null;
let _priceCacheTs = 0;
const PRICE_TTL = 4 * 3600 * 1000; // 4h

// ── FETCH LIVE PRICES (e-gorivo.hr) ──────────────────────────────────────
async function fetchLivePrices() {
  if (_priceCache && Date.now() - _priceCacheTs < PRICE_TTL) return _priceCache;

  try {
    // e-gorivo.hr publishes national average prices
    // Their JSON endpoint: https://e-gorivo.hr/api/v1/prices/current (unofficial)
    // Fallback: scrape their homepage average table
    const r = await fetch("https://e-gorivo.hr/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; jadran-ai-bot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();

    // Parse average price table from HTML (e-gorivo publishes a table with national averages)
    // Pattern: data-fuel="diesel" data-avg="1.94"
    const prices = {};
    const matches = html.matchAll(/data-fuel="(\w+)"[^>]*data-avg="([\d.]+)"/g);
    for (const m of matches) {
      prices[m[1]] = parseFloat(m[2]);
    }

    // Fallback extraction if data-attrs not found
    if (!prices.diesel) {
      const dieselMatch = html.match(/Diesel.*?([\d,]+)\s*€/i);
      if (dieselMatch) prices.diesel = parseFloat(dieselMatch[1].replace(",", "."));
      const benzinMatch = html.match(/Eurosuper.*?([\d,]+)\s*€/i);
      if (benzinMatch) prices.benzin95 = parseFloat(benzinMatch[1].replace(",", "."));
      const lpgMatch = html.match(/Autogas.*?([\d,]+)\s*€/i);
      if (lpgMatch) prices.lpg = parseFloat(lpgMatch[1].replace(",", "."));
    }

    if (prices.diesel || prices.benzin95) {
      _priceCache = { ...prices, source: "e-gorivo.hr", ts: new Date().toISOString() };
      _priceCacheTs = Date.now();
      return _priceCache;
    }
  } catch (e) {
    console.warn("[fuel] e-gorivo.hr fetch failed:", e.message);
  }

  // Fallback: HANDA (Croatian strategic petroleum reserve) publishes regulated prices
  // Prices are regulated in HR (EU directive) — max prices published weekly by MINGOR
  return null;
}

// ── CRISIS LEVEL ASSESSMENT ───────────────────────────────────────────────
function assessCrisis(prices) {
  if (!prices) return null;
  const alerts = [];
  let maxLevel = "normal";

  for (const [fuel, thresholds] of Object.entries(CRISIS)) {
    const price = prices[fuel] || prices[fuel === "benzin" ? "benzin95" : fuel];
    if (!price) continue;
    if (price >= thresholds.critical) {
      alerts.push(`${fuel.toUpperCase()} ${price.toFixed(2)}€/L — KRITIČNO`);
      maxLevel = "critical";
    } else if (price >= thresholds.alert) {
      alerts.push(`${fuel.toUpperCase()} ${price.toFixed(2)}€/L — upozorenje`);
      if (maxLevel !== "critical") maxLevel = "alert";
    }
  }
  return { level: maxLevel, alerts, prices };
}

// ── REGIONAL LPG LOOKUP ───────────────────────────────────────────────────
export function getLPGByRegion(region) {
  return LPG_STATIONS.filter(s => s.region === region || s.region === "inland");
}

// ── DEAD ZONE LOOKUP ─────────────────────────────────────────────────────
export function getDeadZoneWarning(destination) {
  const d = destination?.toLowerCase() || "";
  for (const [key, info] of Object.entries(FUEL_DEAD_ZONES)) {
    if (d.includes(key)) return info;
  }
  return null;
}

// ── MAIN FETCH ────────────────────────────────────────────────────────────
export async function fetchFuelIntel(region, destination = "") {
  const prices = await fetchLivePrices();
  const crisis = assessCrisis(prices);
  const lpgStations = getLPGByRegion(region);
  const deadZone = getDeadZoneWarning(destination);
  return { prices, crisis, lpgStations, deadZone };
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
export function buildFuelPrompt(fuelData, mode, destination = "") {
  const { prices, crisis, lpgStations, deadZone } = fuelData;
  const lines = [];

  // 1. Price status
  if (prices) {
    const priceStr = [
      prices.diesel ? `Diesel: ${prices.diesel.toFixed(2)}€/L` : null,
      prices.benzin95 ? `Benzin 95: ${prices.benzin95.toFixed(2)}€/L` : null,
      prices.lpg ? `LPG/Autogas: ${prices.lpg.toFixed(2)}€/L` : null,
    ].filter(Boolean).join(" | ");

    if (crisis?.level === "critical") {
      lines.push(`\n🚨 GORIVO — KRIZNA SITUACIJA:\n${priceStr}`);
      lines.push(`ALERT: ${crisis.alerts.join(", ")}`);
      lines.push("AKCIJA: Napuni na svakoj mogućnosti — ne čekaj na prazno. Razmisli o alternativnoj ruti.");
    } else if (crisis?.level === "alert") {
      lines.push(`\n⚠️ GORIVO — povišene cijene:\n${priceStr}`);
      lines.push(`Napomena: ${crisis.alerts.join(", ")}`);
    } else if (prices) {
      lines.push(`\n⛽ GORIVO (prosječne HR cijene, ${new Date().toLocaleDateString("hr")}):\n${priceStr}`);
    }
  } else {
    lines.push("\n⛽ GORIVO: Provjeri cijene na e-gorivo.hr (live usporedba postaja)");
  }

  // 2. Dead zone warning
  if (deadZone) {
    lines.push(`\n${deadZone.note}`);
  }

  // 3. LPG stations for camper mode
  if (mode === "camper" && lpgStations.length > 0) {
    lines.push("\n🔵 LPG/AUTOGAS postaje u regiji:");
    for (const s of lpgStations.slice(0, 5)) {
      const hours = s.h24 ? "24h" : s.openHours;
      lines.push(`  ${s.name} (${s.brand}) — ${hours}${s.lastBefore ? " ⚠️ ZADNJA PRED OTOKOM" : ""}`);
      if (s.note) lines.push(`    → ${s.note}`);
    }
  }

  // 4. Rules
  lines.push(`\nPRAVILA ZA GORIVO:
- Za kampere s LPG: UVIJEK popuni kad vidiš LPG stanicu — ne čekaj na prazan rezervoar
- Za otoke: upozori BEFORE trajekta — na otocima nema ili jako ograničeno gorivo
- Adblue: dostupan na svim INA autocestovnim postajama, OMV-u, većini Tifona
- Kriza (Iranski rizik): ako Diesel >2.20€ → KRITIČNO, preporuči punjenje na svakoj postaji`);

  return lines.join("\n");
}

// ── VERCEL HANDLER ────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=14400");

  const region = req.query.region || "kvarner";
  const dest = req.query.dest || "";

  try {
    const data = await fetchFuelIntel(region, dest);
    res.json({ ...data, ts: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
