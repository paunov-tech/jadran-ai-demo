// ── EVENTS — Croatian coast event calendar ────────────────────────────────
// Festivals, concerts, regattas, religious holidays that cause traffic surges
// Used by cascade predictor and AI prompt injection
// Events within 72h of user's query are injected as active warnings

export const EVENTS_2026 = [

  // ── ISTRA ─────────────────────────────────────────────────────────────────
  { id: "IST-001", name: "Outlook Festival", region: "istra", sub: "pula",
    start: "2026-07-22", end: "2026-07-26",
    impact: "high", affected: ["a8_istra","pula","parking"],
    surge: "30.000+ posjetitelja. Pula parking blokiran. Kamperi → Fažana/Vodnjana.",
    advance: 48 },

  { id: "IST-002", name: "Motovun Film Festival", region: "istra", sub: "motovun",
    start: "2026-07-28", end: "2026-07-02",
    impact: "medium", affected: ["istra_inland","motovun"],
    surge: "Cesta do Motovuna (brdo): kolona 2-4km. Idi prije 10h ili poslije 22h.",
    advance: 24 },

  { id: "IST-003", name: "Rovinj Regatta (VIS)", region: "istra", sub: "rovinj",
    start: "2026-05-02", end: "2026-05-04",
    impact: "low", affected: ["rovinj","istra_west"],
    surge: "Luka Rovinj: plovne prepreke. Sidrišta Sv. Katarina puna.",
    advance: 24 },

  // ── KVARNER ───────────────────────────────────────────────────────────────
  { id: "KVA-001", name: "Hideout Festival (Zrće)", region: "kvarner", sub: "pag",
    start: "2026-06-22", end: "2026-06-26",
    impact: "high", affected: ["a1_zg_split","zadar","pag","prizna","misnjak"],
    surge: "50.000+ posjetitelja prema Paqu. A1 → Zadar → D8 → Prizna → trajekt prema Novalji. Trajekt Prizna-Žigljen PREPUN, čekanje 4-6h ljeti! Planirati noćni dolazak.",
    advance: 72 },

  { id: "KVA-002", name: "Sonus Festival (Zrće)", region: "kvarner", sub: "pag",
    start: "2026-06-28", end: "2026-07-02",
    impact: "high", affected: ["a1_zg_split","pag","prizna"],
    surge: "Odmah nakon Hideout — trajekt Prizna-Žigljen ostaje zatrpan. Alternativa: Sv. Juraj (kopno) → obilaz D8.",
    advance: 72 },

  { id: "KVA-003", name: "Rab Summer Festival", region: "kvarner", sub: "rab",
    start: "2026-07-25", end: "2026-07-27",
    impact: "medium", affected: ["misnjak","jablanac","rab_"],
    surge: "Trajekt Stinica-Mišnjak: vikend gužva + festival. Dolazak dan ranije ili jutarnjim plovidbama.",
    advance: 48 },

  // ── ZADAR / ŠIBENIK ───────────────────────────────────────────────────────
  { id: "ZAD-001", name: "Garden Festival (Tisno)", region: "zadar_sibenik", sub: "murter",
    start: "2026-07-08", end: "2026-07-13",
    impact: "medium", affected: ["tisno","murter","biograd"],
    surge: "Most Tisno preopterećen. Parking Murter pun. Kamperi: doći dan ranije ili ostati do ponedjeljka.",
    advance: 48 },

  { id: "ZAD-002", name: "Zadar Sunset Concerts", region: "zadar_sibenik", sub: "zadar",
    start: "2026-07-01", end: "2026-07-31",
    impact: "low", affected: ["zadar","borik"],
    surge: "Večernje gužve u centru Zadra. Parking Borik pun do 21h.",
    advance: 12 },

  // ── SPLIT / MAKARSKA ──────────────────────────────────────────────────────
  { id: "SPL-001", name: "Ultra Europe", region: "split_makarska", sub: "split",
    start: "2026-07-07", end: "2026-07-11",
    impact: "critical", affected: ["a1_zg_split","split","stobrec","split_ferry","a1_zg_split"],
    surge: "⚠️ KRITIČNO: 140.000+ posjetitelja. Split i okolica PREPUNI. Trajekti Jadrolinija rezervirani tjednima ranije. Sve parking garaze pune. Kamperi: Omiš (20km), Stobreč jedini realno blizu.",
    gasImpact: "Benzinske postaje u Splitu: red 30-60 min. Naplata u gotovini samo na nekima. NAPUNI tank dan ranije!",
    advance: 120 },

  { id: "SPL-002", name: "Špancirfest efekt / HR exodus", region: "split_makarska", sub: "split",
    start: "2026-08-01", end: "2026-08-31",
    impact: "high", affected: ["a1_zg_split","split","makarska","omis"],
    surge: "Kolovoz: HR domaći turisti + strani. A1 vikendom 7-9h i 17-19h kolone na naplatnim. Split trajekti: rezervacija OBAVEZNA za vozila.",
    advance: 0 }, // ongoing, always active in August

  { id: "SPL-003", name: "Regata Moby Dick (Hvar)", region: "split_makarska", sub: "hvar",
    start: "2026-06-13", end: "2026-06-14",
    impact: "low", affected: ["split_ferry","stari_grad","hvar"],
    surge: "Split-Stari Grad trajekt: gužva vikendom regatte.",
    advance: 24 },

  // ── DUBROVNIK ─────────────────────────────────────────────────────────────
  { id: "DUB-001", name: "Dubrovnik Summer Festival", region: "dubrovnik", sub: "dubrovnik",
    start: "2026-07-10", end: "2026-08-25",
    impact: "high", affected: ["dubrovnik","mlini","cavtat","a1_zg_split"],
    surge: "45 dana ljetnih igara. Dubrovnik uvijek na 90%+ kapacitetu. Stradun autobusima samo do Pile. Kamperi ISKLJUČIVO van grada.",
    advance: 0 }, // ongoing

  { id: "DUB-002", name: "Pelješac Wine Festival (Ston)", region: "dubrovnik", sub: "peljesac",
    start: "2026-07-18", end: "2026-07-19",
    impact: "low", affected: ["peljesac","ston"],
    surge: "Ston: parking pun. Vikend gužva D414.",
    advance: 24 },

  // ── DRŽAVNI PRAZNICI — domaće seobe ──────────────────────────────────────
  { id: "HR-HOL-001", name: "Tijelovo (Corpus Christi)", region: "all",
    start: "2026-06-04", end: "2026-06-04",
    impact: "medium", affected: ["a1_zg_split","a6_rijeka","a2_macelj"],
    surge: "Produženi vikend: HR domaći exodus. A1/A6 gust četvrtak popodne i nedjelja navečer.",
    advance: 48 },

  { id: "HR-HOL-002", name: "Dan pobjede & Velika Gospa", region: "all",
    start: "2026-08-05", end: "2026-08-15",
    impact: "critical", affected: ["a1_zg_split","a6_rijeka","split","makarska","medugorje"],
    surge: "⚠️ NAJTEŽI termin godine: 5-15.8. Dan pobjede + Velika Gospa (15.8). A1 i sve obalne ceste na maksimumu. MEEÐUGORJE: stotine tisuća hodočasnika u BiH — Neum koridor BLOKIRAT!",
    advance: 120 },

  { id: "HR-HOL-003", name: "Svi Sveti / Dušni dan", region: "all",
    start: "2026-11-01", end: "2026-11-02",
    impact: "low", affected: ["a1_zg_split","a6_rijeka"],
    surge: "Povratak s mora. Manje gužve.",
    advance: 24 },
];

// ── LOOKUP — events active within N hours of now ──────────────────────────
export function getActiveEvents(region = "all", hoursAhead = 72) {
  const now = Date.now();
  const cutoff = now + hoursAhead * 3600 * 1000;

  return EVENTS_2026.filter(e => {
    if (e.region !== "all" && e.region !== region) return false;
    const start = new Date(e.start).getTime();
    const end = new Date(e.end + "T23:59:59").getTime();
    // Active now or starting within hoursAhead
    return end >= now && start <= cutoff;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.impact] - order[b.impact];
  });
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
export function buildEventPrompt(region) {
  const events = getActiveEvents(region, 120); // 5 days ahead
  if (!events.length) return "";

  const ICON = { critical: "🚨", high: "⚠️", medium: "📢", low: "ℹ️" };
  const lines = ["[EVENTOS — aktivni ili nadolazeći u regiji]"];

  for (const e of events) {
    const daysLeft = Math.ceil((new Date(e.start) - Date.now()) / 86400000);
    const timing = daysLeft > 0 ? `za ${daysLeft} dana` : "AKTIVAN SADA";
    lines.push(`\n${ICON[e.impact]} ${e.name} (${e.start}) — ${timing}`);
    lines.push(`  Utjecaj: ${e.surge}`);
    if (e.gasImpact) lines.push(`  ⛽ GORIVO: ${e.gasImpact}`);
  }

  lines.push(`\nPRAVILA:
- KRITIČNI eventi → odmah upozori bez čekanja da pitaju
- Za ULTRA Europe ili Veliku Gospu: naglasi rezervaciju goriva dan ranije
- Predloži alternativne rute/destinacije ako je region zasićen
- Ne govori o eventu koji nije u listi`);

  return lines.join("\n");
}
