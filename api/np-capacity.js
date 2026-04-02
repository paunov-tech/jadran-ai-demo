// ── NATIONAL PARK CAPACITY — Croatia ─────────────────────────────────────
// NP Plitvice: 8.000/day hard limit (timed entry)
// NP Krka: 3.500/day Skradinski Buk (reduced from 5.700 post-2022)
// NP Mljet, Kornati, Brijuni, Paklenica: softer limits
// Sources: park websites + Firestore manual updates from rangers/partners

const NP_DATA = {
  plitvice: {
    name: "NP Plitvička Jezera",
    region: "inland",
    coords: [44.8804, 15.6166],
    dailyLimit: 8000,
    peakMonths: [6, 7, 8, 9],
    openHours: { peak: "07:00-20:00", low: "08:00-17:00" },
    website: "np-plitvicka-jezera.hr",
    booking: "np-plitvicka-jezera.hr/en/tickets-and-prices/",
    mustBook: true,
    routes: ["A1 čvor Otočac/Rakovica, D1 prema jezerima"],
    approach: {
      maxH: null, maxLen: null,
      parking: "P1 (ulaz 1) i P2 (ulaz 2) — P1 se puni do 9h u sezoni!",
      campersNote: "Kamperi mogu koristiti oba parkirišta. P3 (Jezerce) nema prikolice.",
      yoloSensors: ["plitvice","a1_zg_split","rakovica"],
    },
    peakHours: "09:00-13:00",
    bestTime: "Prva tura 07:00 (ulaz otvara) ili zadnja tura 15:00-16:00",
    price: { adult: 39.90, child: 19.95, camperParking: 8.00 },
    notes: "⚠️ TIMED ENTRY — ulaznice online obavezne u sezoni! Na licu mjesta često rasprodano. Kamperi: parking uz ulaz 1 je ravna podloga.",
  },

  krka: {
    name: "NP Krka (Skradinski Buk)",
    region: "zadar_sibenik",
    coords: [43.7950, 15.9706],
    dailyLimit: 3500,
    peakMonths: [6, 7, 8, 9],
    openHours: { peak: "08:00-20:00", low: "09:00-17:00" },
    website: "np-krka.hr",
    booking: "np-krka.hr/en/visit/",
    mustBook: true,
    routes: ["D33 iz Šibenika, ili D56 iz Drniša"],
    approach: {
      maxH: null, maxLen: null,
      parking: "Lozovac (gornji ulaz) — shuttle do Skradinskog Buka. KAMPERI: isključivo Lozovac!",
      campersNote: "Donji ulaz Skradin pristupačan manjim vozilima (< 7m). Kamperi obvezno Lozovac + shuttle.",
      yoloSensors: ["sibenik","krka","vodice"],
    },
    peakHours: "10:00-14:00",
    bestTime: "08:00-09:00 ili 16:00-18:00",
    price: { adult: 26.54, child: 13.27, shuttle: "uključen u ulaznicu" },
    notes: "Kamperi: ISKLJUČIVO parkiranje Lozovac (gornji ulaz). Shuttle uključen. U kolovozu: online ulaznica dan ranije.",
  },

  mljet: {
    name: "NP Mljet (Jezera)",
    region: "dubrovnik",
    coords: [42.7526, 17.3853],
    dailyLimit: null,
    peakMonths: [7, 8],
    openHours: { peak: "08:00-19:00", low: "09:00-17:00" },
    website: "np-mljet.hr",
    booking: "np-mljet.hr",
    mustBook: false,
    routes: ["Trajekt Prapratno-Sobra (Jadrolinija), jedina auto-luka"],
    approach: {
      maxH: null, maxLen: 12,
      campersNote: "Trajekt prima kampere do 12m. NP unutar otoka pristupačan osobnim vozilima.",
      yoloSensors: ["dubrovnik","sobra","mljet"],
    },
    price: { adult: 20.00, child: 10.00 },
    notes: "Manji park, bez hard limita. Bicikli preporučeni za obilazak jezera.",
  },

  kornati: {
    name: "NP Kornati",
    region: "zadar_sibenik",
    coords: [43.7830, 15.2791],
    dailyLimit: null,
    peakMonths: [6, 7, 8, 9],
    openHours: null,
    website: "np-kornati.hr",
    mustBook: false,
    routes: ["Brodom iz Murtera, Biograda ili Šibenika — NEMA pristupa kopnom"],
    approach: {
      campersNote: "⚠️ ISKLJUČIVO brodom — bez auta! Kamperi ostavljaju vozilo u Biogradu/Murteru, izlet brodom 1 dan.",
      yoloSensors: ["biograd","murter","tisno"],
    },
    price: { adult: 11.56, child: 5.78, note: "Ulaznica NP + naknada za brod odvojeno (~80-120€/os za day trip)" },
    notes: "Nema kopnenog pristupa. Kamperi: parkiraj u Biogradu (Camping Biograd), uzmi izletni brod.",
  },

  paklenica: {
    name: "NP Paklenica",
    region: "zadar_sibenik",
    coords: [44.3610, 15.4698],
    dailyLimit: null,
    peakMonths: [5, 6, 7, 8, 9],
    openHours: { peak: "07:00-21:00", low: "08:00-18:00" },
    website: "paklenica.hr",
    mustBook: false,
    routes: ["D8 Starigrad Paklenica, 35km sjeverno od Zadra"],
    approach: {
      maxLen: 9,
      campersNote: "Parking Starigrad može primiti kampere do 9m. Špilja Manita peć — pješice 4-5h.",
      yoloSensors: ["zadar","paklenica","a1_zg_split"],
    },
    price: { adult: 10.00, child: 5.00 },
    notes: "Penjačka meka. Kamperi do 9m u parkingu bez problema.",
  },

  brijuni: {
    name: "NP Brijuni",
    region: "istra",
    coords: [44.9143, 13.7547],
    dailyLimit: null,
    peakMonths: [6, 7, 8, 9],
    website: "np-brijuni.hr",
    mustBook: true,
    routes: ["Trajekt iz Fažane (5 min), NEMA pristupa automobilom"],
    approach: {
      campersNote: "Automobili/kamperi: parkiraj u Fažani (Camping Brioni 5km). Trajekt na Brijune, auta ne primaju.",
      yoloSensors: ["fazana","pula","istra_south"],
    },
    price: { adult: 19.91, child: 9.96, note: "Uključuje trajekt i safari obilazak" },
    notes: "Kamperi: Camping Brioni Fažana (5km) → trajekt. Auto ostaje na kopnu.",
  },
};

// ── CAPACITY STATUS from Firestore ────────────────────────────────────────
let _npCache = null;
let _npCacheTs = 0;
const NP_TTL = 15 * 60 * 1000; // 15 min

async function fetchNPStatus() {
  if (_npCache && Date.now() - _npCacheTs < NP_TTL) return _npCache;
  const key = process.env.FIREBASE_API_KEY;
  if (!key) return {};
  try {
    const url = `https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_np?key=${key}&pageSize=20`;
    const r = await fetch(url);
    if (!r.ok) return {};
    const data = await r.json();
    if (!data.documents) return {};

    const status = {};
    for (const doc of data.documents) {
      const id = doc.name.split("/").pop();
      const f = doc.fields || {};
      status[id] = {
        currentVisitors: parseInt(f.currentVisitors?.integerValue || "0"),
        queueMin: parseInt(f.queueMin?.integerValue || "0"),
        ticketsAvailable: f.ticketsAvailable?.booleanValue !== false,
        notes: f.notes?.stringValue || "",
        lastUpdate: f.lastUpdate?.timestampValue || null,
      };
    }
    _npCache = status;
    _npCacheTs = Date.now();
    return status;
  } catch (e) {
    return {};
  }
}

// ── TIME-BASED CAPACITY ESTIMATE (no live data) ───────────────────────────
function estimateNPCapacity(npId) {
  const now = new Date();
  const h = now.getHours();
  const month = now.getMonth() + 1;
  const np = NP_DATA[npId];
  if (!np) return null;

  const isPeak = np.peakMonths?.includes(month);
  const isRushHour = h >= 10 && h <= 14;
  const isMorning = h >= 7 && h <= 9;

  if (!isPeak) return { level: "low", msg: "Van sezone — nema gužve" };
  if (isMorning) return { level: "low", msg: "Rano jutro — idealno, manja gužva" };
  if (isRushHour) return { level: "high", msg: "Vršni sat — gužva moguća, preporuči rano jutro" };
  return { level: "medium", msg: "Umjerena posjećenost" };
}

// ── REGION → ADJACENT NPs ─────────────────────────────────────────────────
// Tourists always ask about nearby NPs regardless of current coastal region
const NP_FOR_REGION = {
  istra:          ["brijuni", "paklenica"],
  kvarner:        ["plitvice", "paklenica", "kornati"],
  zadar_sibenik:  ["krka", "kornati", "plitvice", "paklenica"],
  split_makarska: ["krka", "plitvice"],
  dubrovnik:      ["mljet", "krka"],
  inland:         ["plitvice", "krka", "paklenica"],
  all:            Object.keys(NP_DATA),
};

// ── MAIN FETCH ────────────────────────────────────────────────────────────
export async function fetchNPCapacity(region) {
  const liveStatus = await fetchNPStatus();
  const allowed = new Set(NP_FOR_REGION[region] || NP_FOR_REGION.all);
  const relevant = Object.entries(NP_DATA)
    .filter(([id]) => allowed.has(id))
    .map(([id, np]) => ({ id, ...np, live: liveStatus[id] || null, estimate: estimateNPCapacity(id) }));
  return relevant;
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
export function buildNPPrompt(npList) {
  if (!npList?.length) return "";
  const lines = ["[NACIONALNI PARKOVI — kapacitet i savjeti]"];

  for (const np of npList) {
    const lv = np.live;
    const est = np.estimate;

    let status = "";
    if (lv?.queueMin > 30) status = `🔴 RED ČEKANJA ~${lv.queueMin} min`;
    else if (lv?.currentVisitors > (np.dailyLimit * 0.85)) status = "🟡 SKORO PUNO";
    else if (lv?.ticketsAvailable === false) status = "🔴 ULAZNICE RASPRODANE";
    else if (est?.level === "high") status = "⚠️ Vršni sat — gužva";
    else status = "🟢 OK";

    lines.push(`\n${np.name} ${status}`);
    if (np.dailyLimit) lines.push(`  Dnevni limit: ${np.dailyLimit} posjetitelja`);
    lines.push(`  Pristup: ${np.approach?.campersNote || "standardno"}`);
    if (np.mustBook) lines.push(`  ⚠️ Rezervacija obavezna: ${np.booking}`);
    if (np.notes) lines.push(`  Info: ${np.notes}`);
    lines.push(`  Cijena: od ${np.price?.adult}€/os`);
    if (np.bestTime) lines.push(`  Preporučeno: ${np.bestTime}`);
  }

  lines.push(`\nPRAVILA NP:
- Plitvice i Krka u sezoni: UVIJEK provjeri dostupnost ulaznica dan ranije
- Kamperi: specifični parking uvjeti za svaki NP — ne šalji u centar bez provjere
- Kornati i Brijuni: bez auta — kamperi ostavljaju vozilo na kopnu`);

  return lines.join("\n");
}
