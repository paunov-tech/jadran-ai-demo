// ── CAMPS DATA — Croatian Adriatic Coast ──────────────────────────────────
// Static base: 50+ camps, all coastal regions
// Dynamic status merged at runtime from Firestore jadran_camps/{id}
// Delta approach: each camp maps to nearby YOLO sensor prefixes
//
// Fields:
//   id        — unique HR-REG-NNN
//   region    — matches LOCATIONS keys in chat.js
//   access    — road type, max dims, approach YOLO sensors
//   infra     — electricity, dump, LPG, wifi, etc.
//   price     — €/night camper+2pax, low/mid/high season
//   partner   — B2B tier or null

export const CAMPS = [

  // ── ISTRA ─────────────────────────────────────────────────────────────────

  {
    id: "HR-IST-001",
    name: "Camping Polari",
    region: "istra", sub: "rovinj",
    coords: [45.0594, 13.6733],
    website: "maistra.com/camping-polari",
    phone: "+385 52 800 200",
    season: { open: "04-24", close: "10-05" },
    capacity: { total: 2000, motorhomePitches: 400, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "D75 iz Rovinja prema jugu, dobro označen. Nema ograničenja za kampere do 12m.",
      yoloSensors: ["rovinj","istra_south","d75"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/kamen", dogFriendly: true,
    },
    price: { low: 28, mid: 52, high: 75 },
    partner: false, bookUrl: null,
    notes: "Tiha uvala 3.5km južno od Rovinja. Superiorne parcele 120m² za kampere 7.5m+ i >4t. LPG nije dostupan — Rovinj 3.5km.",
  },

  {
    id: "HR-IST-002",
    name: "Camping Amarin",
    region: "istra", sub: "rovinj",
    coords: [45.1053, 13.6214],
    website: "maistra.com/camping-amarin",
    phone: "+385 52 800 200",
    season: { open: "04-24", close: "10-05" },
    capacity: { total: 650, motorhomePitches: 250, maxLen: 10, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "3km sjeverno od Rovinja, D303. Taksi čamac do centra u sezoni.",
      yoloSensors: ["rovinj","istra_north","d303"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/pijesak/kamen", dogFriendly: true,
    },
    price: { low: 25, mid: 48, high: 70 },
    partner: false, bookUrl: null,
    notes: "Blue Flag plaža. 13 sanitarnih blokova. Dobro razdvojene parcele 70-100m².",
  },

  {
    id: "HR-IST-003",
    name: "Camping Veštar",
    region: "istra", sub: "rovinj",
    coords: [45.0821, 13.6289],
    website: "maistra.com/camping-vestar",
    season: { open: "04-24", close: "10-05" },
    capacity: { total: 563, motorhomePitches: 200, maxLen: 10, maxH: null },
    access: {
      road: "asfalt", notes: "10 min od centra Rovinja. Mala luka s vezovima.",
      yoloSensors: ["rovinj","istra_south"],
      ferry: null,
    },
    infra: {
      electricity: "6-10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: true,
      pool: false, beach: "šljunak/pijesak/kamen", dogFriendly: true,
    },
    price: { low: 22, mid: 44, high: 65 },
    partner: false, bookUrl: null,
    notes: "Mirna uvala, idealno za obitelji. Parcele 100-140m². 7 sanitarnih blokova s obiteljskim kupaonicama.",
  },

  {
    id: "HR-IST-004",
    name: "Camping Zelena Laguna",
    region: "istra", sub: "porec",
    coords: [45.2156, 13.5847],
    website: "istracamping.com/zelena-laguna",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 540, motorhomePitches: 180, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", notes: "Tik uz Poreč, D75. Camper opskrbna stanica na ulazu.",
      yoloSensors: ["porec","istra_west","d75"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 68 },
    partner: false, bookUrl: null,
    notes: "42 potpuno servisiranih parcela. Camper opskrbna stanica. 6 sanitarnih blokova.",
  },

  {
    id: "HR-IST-005",
    name: "Camping Bijela Uvala",
    region: "istra", sub: "porec",
    coords: [45.1924, 13.5612],
    website: "istracamping.com/bijela-uvala",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 1088, motorhomePitches: 350, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", notes: "5km južno od Poreča. 16A priključci — rijetki u HR!",
      yoloSensors: ["porec","istra_west"],
      ferry: null,
    },
    infra: {
      electricity: "16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "bijeli šljunak", dogFriendly: true,
    },
    price: { low: 26, mid: 50, high: 72 },
    partner: false, bookUrl: null,
    notes: "4 bazena slatke vode. 16A EU priključci. Bijeli šljunak, bistro more. 30 min hoda od Poreča.",
  },

  {
    id: "HR-IST-006",
    name: "Camping Umag Park",
    region: "istra", sub: "umag",
    coords: [45.4327, 13.5242],
    website: "istracamping.com/umag",
    season: { open: "04-23", close: "10-04" },
    capacity: { total: 1868, motorhomePitches: 500, maxLen: 9, maxH: null },
    access: {
      road: "asfalt", notes: "Unutar Umaga. Standardne parcele do 6m, veće do 9m.",
      yoloSensors: ["umag","istra_north"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "privatna", dogFriendly: true,
    },
    price: { low: 23, mid: 44, high: 66 },
    partner: false, bookUrl: null,
    notes: "2 bazenskih kompleksa, 10 sanitarnih blokova. Luksuzne Mare parcele s osobnim roštiljem.",
  },

  {
    id: "HR-IST-007",
    name: "Camping Brioni (Sunny Camping)",
    region: "istra", sub: "fazana",
    coords: [44.9266, 13.8017],
    website: "valamarcamping.com/brioni",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 400, motorhomePitches: 150, maxLen: 10, maxH: null },
    access: {
      road: "asfalt", notes: "5km od Fažane, 7km od Pule. Blizina Brijuna.",
      yoloSensors: ["pula","fazana","istra_south"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak 700m", dogFriendly: true,
    },
    price: { low: 22, mid: 40, high: 60 },
    partner: false, bookUrl: null,
    notes: "NEMA dump stanicu — samo kemijska WC. Ronilački centar. 700m šljunčane plaže.",
  },

  {
    id: "HR-IST-008",
    name: "Camping Rabac (Maslinica)",
    region: "istra", sub: "rabac",
    coords: [45.0731, 14.1534],
    website: "valamarcamping.com/rabac",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 350, motorhomePitches: 120, maxLen: 9, maxH: null },
    access: {
      road: "makadam/asfalt",
      notes: "UPOZORENJE: Spuštanje u Rabac je strma serpentinska cesta 12%. Kamperi >9m — teško manevrisanje. Parkiraj u gornjem dijelu i provjeri dimenzije!",
      yoloSensors: ["rabac","labin","istra_east"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 58 },
    partner: false, bookUrl: null,
    notes: "⚠️ Strma serpentina na ulazu — max 9m kamper. Maslinov gaj, direktno na plažu.",
  },

  {
    id: "HR-IST-009",
    name: "Camping Koversada (Naturist)",
    region: "istra", sub: "vrsar",
    coords: [45.1403, 13.5981],
    website: "maistra.com/camping-koversada",
    season: { open: "04-24", close: "10-04" },
    capacity: { total: 1700, motorhomePitches: 400, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", notes: "2km južno od Vrsara. Djelomično tekstilno.",
      yoloSensors: ["vrsar","istra_west"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "kamen/šljunak", dogFriendly: false,
    },
    price: { low: 22, mid: 42, high: 62 },
    partner: false, bookUrl: null,
    notes: "Naturistički park — djelomično tekstilno od 2024. Skrivene uvale, stjenovite terase.",
  },

  {
    id: "HR-IST-010",
    name: "Camping Kažela",
    region: "istra", sub: "medulin",
    coords: [44.8061, 13.9546],
    website: "arenacampsites.com/en/campsites-istria/camping-kazela",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 3000, motorhomePitches: 600, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "D66 prema Medulinu, 8km južno od Pule. Dobar pristup za sve tipove vozila. Kamper recepcija odvojena.",
      yoloSensors: ["pula","medulin","istra_south"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/kamen", dogFriendly: true,
    },
    price: { low: 30, mid: 58, high: 85 },
    partner: false, bookUrl: null,
    notes: "Jedan od najvećih kampova u Istri (71ha). Arena Campsites premium resort. 5 bazenskih bazena, aquapark. LPG: Pula 8km.",
  },

  {
    id: "HR-IST-011",
    name: "Camping Arena Stoja",
    region: "istra", sub: "pula",
    coords: [44.8570, 13.8133],
    website: "arenacamps.com/en/camps-istria/camping-arena-stoja",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 1800, motorhomePitches: 400, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "3km zapadno od centra Pule, odlično označen. Direktan pristup s D75/D2. Recepcija za kampere 24h u sezoni.",
      yoloSensors: ["pula","istra_south"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak/kamen", dogFriendly: true,
    },
    price: { low: 28, mid: 55, high: 80 },
    partner: false, bookUrl: null,
    notes: "33ha, poluotok Stoja. Vizura na Pulsku arenu. Premium parcele uz more. LPG: Pula 3km.",
  },

  // ── KVARNER ───────────────────────────────────────────────────────────────

  {
    id: "HR-KVA-001",
    name: "Camping Bor",
    region: "kvarner", sub: "krk",
    coords: [45.0257, 14.5741],
    website: "camp-bor.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 280, motorhomePitches: 100, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "Krčki most BESPLATAN od 2020. Zatvaranje za kampere III. kat. pri buri >60 km/h — alternativa: trajekt Crikvenica-Šilo. Kamp: zapadno od grad Krka, 10 min hoda do mora.",
      yoloSensors: ["krk_most","krk","kvarner"],
      ferry: { line: "Crikvenica-Šilo", operator: "Jadrolinija", fallbackForBridge: true },
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: false,
      pool: false, beach: "šljunak 10 min", dogFriendly: true,
    },
    price: { low: 18, mid: 34, high: 52 },
    partner: false, bookUrl: null,
    notes: "Autentična otočna atmosfera, suhozid, masline i borovi. Otvoreno 1985. Dobro za kampere.",
  },

  {
    id: "HR-KVA-002",
    name: "Camping Baška Valamar",
    region: "kvarner", sub: "krk_baska",
    coords: [44.9688, 14.7618],
    website: "valamarcamping.com/baska",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 398, motorhomePitches: 200, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "Krčki most + D102 prema Baški. Cesta prema Baški: serpentine, ali prohodna do 10m. Kamp je u centru Vele Plaže.",
      yoloSensors: ["krk_most","krk","baska"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/pijesak 2km direktno", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 68 },
    partner: false, bookUrl: null,
    notes: "Centar Vele Plaže — 2km šljunčane plaže s pješčanim dnom. Obiteljski akvapark.",
  },

  {
    id: "HR-KVA-003",
    name: "Camping Njivice",
    region: "kvarner", sub: "krk_njivice",
    coords: [45.1692, 14.5301],
    website: "campnjivice.hr",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 500, motorhomePitches: 180, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "Krčki most + D102 prema Njivicama. Blizu mosta, lako dostupno.",
      yoloSensors: ["krk_most","krk","njivice"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 56 },
    partner: false, bookUrl: null,
    notes: "Blizu Krčkog mosta. Mirna uvala. Dobra polazna točka za obilazak otoka.",
  },

  {
    id: "HR-KVA-004",
    name: "Camping Lopari Resort",
    region: "kvarner", sub: "losinj",
    coords: [44.5794, 14.4689],
    website: "losinia.hr",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 400, motorhomePitches: 150, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "⚠️ KOMPLEKSAN PRISTUP: Trajekt Brestova-Porozina (Cres) ILI Valbiska-Merag. Most Cres-Lošinj otvara se za brodove 2x/dan (9:00 i 17:00) — može blokirati promet 30 min. Ukupno 1-1.5h od trajekta do kampa.",
      yoloSensors: ["losinj","cres","valbiska","merag"],
      ferry: { line: "Brestova-Porozina ili Valbiska-Merag", operator: "Jadrolinija", mustBook: true },
      bridgeWarning: "Most Cres-Lošinj: otvara se za brodove 9:00 i 17:00 — čekanje ~30min!",
    },
    infra: {
      electricity: "16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak", dogFriendly: true,
    },
    price: { low: 26, mid: 50, high: 72 },
    partner: false, bookUrl: null,
    notes: "Parcele ~100m². 16A. Kompleksan pristup — planirati unaprijed.",
  },

  {
    id: "HR-KVA-005",
    name: "Camping Poljana",
    region: "kvarner", sub: "losinj",
    coords: [44.5319, 14.4738],
    website: "campingpoljana.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 800, motorhomePitches: 300, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "Isti pristup kao Lopari — trajekt + most Cres-Lošinj. Kamp je na jugu otoka, blizina Mali Lošinj.",
      yoloSensors: ["losinj","cres"],
      ferry: { line: "Brestova-Porozina ili Valbiska-Merag", operator: "Jadrolinija", mustBook: true },
      bridgeWarning: "Most Cres-Lošinj: otvara se za brodove 9:00 i 17:00!",
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak/kamen direktno", dogFriendly: true,
    },
    price: { low: 22, mid: 44, high: 65 },
    partner: false, bookUrl: null,
    notes: "Camping Village s mobilnim kućicama i glamping. Mali Lošinj u blizini — aromaterapi.",
  },

  {
    id: "HR-KVA-006",
    name: "Camping Kovačine",
    region: "kvarner", sub: "cres",
    coords: [44.9584, 14.4035],
    website: "camp-kovacine.com",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 800, motorhomePitches: 280, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "Trajekt Brestova-Porozina. Kamp je blizu Cres grada, 3km od trajektne luke. Lako dostupan.",
      yoloSensors: ["cres","porozina"],
      ferry: { line: "Brestova-Porozina", operator: "Jadrolinija", mustBook: true },
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 58 },
    partner: false, bookUrl: null,
    notes: "Blizu Cres grada. Preporuča se kao prva noć na otocima Kvarner.",
  },

  {
    id: "HR-KVA-007",
    name: "Camping San Marino",
    region: "kvarner", sub: "rab",
    coords: [44.7548, 14.7621],
    website: "camping-sanmarino-rab.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 300, motorhomePitches: 100, maxLen: 9, maxH: null },
    access: {
      road: "asfalt",
      notes: "Trajekt Stinica-Mišnjak (Rapska Plovidba, L337, ne treba rezervacija) ili Valbiska-Lopar (Jadrolinija L338, rezervacija preporučena). Kamp blizu Raba.",
      yoloSensors: ["misnjak","jablanac","prizna","lopar","rab_"],
      ferry: { line: "Stinica-Mišnjak", operator: "Rapska Plovidba", reservation: false },
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: false,
      pool: false, beach: "šljunak", dogFriendly: true,
    },
    price: { low: 12, mid: 22, high: 34 },
    partner: false, bookUrl: null,
    notes: "Mali, miran kamp. Nema dump stanicu. Parcele pod sjenilom.",
  },

  {
    id: "HR-KVA-008",
    name: "Camping Padova Valamar",
    region: "kvarner", sub: "rab",
    coords: [44.7697, 14.7534],
    website: "valamarcamping.com/padova",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 600, motorhomePitches: 220, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "Trajekt Stinica-Mišnjak ili Valbiska-Lopar. Kamp blizu Rab grada, šarmantna tiha uvala.",
      yoloSensors: ["misnjak","jablanac","lopar","valbiska","rab_"],
      ferry: { line: "Stinica-Mišnjak", operator: "Rapska Plovidba", reservation: false },
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/kamen", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 68 },
    partner: false, bookUrl: null,
    notes: "Aquapark, Maro Club, sportski sadržaji. Neke parcele direktno uz more.",
  },

  {
    id: "HR-KVA-009",
    name: "Camp Suha Punta",
    region: "kvarner", sub: "rab",
    coords: [44.7893, 14.7141],
    website: "suhapunta.com",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 1000, motorhomePitches: 350, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "5km sjeverozapadno od Rab grada, poluotok Kalifront. Lokalni autobus prema Rabu. Isti trajektni pristup.",
      yoloSensors: ["misnjak","jablanac","rab_"],
      ferry: { line: "Stinica-Mišnjak", operator: "Rapska Plovidba", reservation: false },
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak/kamen - Lopar Sahara 20km", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 58 },
    partner: false, bookUrl: null,
    notes: "Borova šuma Kalifront — zaštićeni hrast. Tenis, mini-golf, vodeni sportovi. Najljepše plaže Raba u blizini.",
  },

  {
    id: "HR-KVA-010",
    name: "Elements Camping Selce",
    region: "kvarner", sub: "crikvenica",
    coords: [45.1573, 14.7285],
    website: "jadran-crikvenica.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 400, motorhomePitches: 150, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "D8 obalna cesta, Crikvenica-Selce. Nema tunela. Jednostavan pristup s kopna.",
      yoloSensors: ["crikvenica","selce","a6_rijeka","kvarner_coast"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/pijesak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 56 },
    partner: false, bookUrl: null,
    notes: "Kaskadni bazeni, kristalno more. Bez tunela, idealan za 1. noć iz Rijeke.",
  },

  {
    id: "HR-KVA-011",
    name: "Camping Jezevac",
    region: "kvarner", sub: "krk_grad",
    coords: [45.0202, 14.5651],
    website: "hoteli-krk.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 600, motorhomePitches: 220, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "Krčki most + D102 do Krk grada. 1km zapadno od centra. Jednostavan pristup.",
      yoloSensors: ["krk_most","krk"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 22, mid: 42, high: 62 },
    partner: false, bookUrl: null,
    notes: "Uz grad Krk, 1km do starih bedema. Pinijeva šuma, direktna plaža.",
  },

  // ── ZADAR / ŠIBENIK ────────────────────────────────────────────────────────

  {
    id: "HR-ZAD-001",
    name: "Autokamp Borik",
    region: "zadar_sibenik", sub: "zadar",
    coords: [44.1463, 15.2117],
    website: "falkensteiner.com/resort-borik",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 2000, motorhomePitches: 500, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "10 min od Zadra javnim prijevozom. Borovica uz more. Nema ograničenja za kampere.",
      yoloSensors: ["zadar","borik","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/pijesak direktno", dogFriendly: true,
    },
    price: { low: 22, mid: 42, high: 62 },
    partner: false, bookUrl: null,
    notes: "Ogromni kamp u borovici. Otvoreni bazen s toboganima. Mini golf. Vodeni sportski centar.",
  },

  {
    id: "HR-ZAD-002",
    name: "Camping Biograd",
    region: "zadar_sibenik", sub: "biograd",
    coords: [43.9431, 15.4497],
    website: "campingbiograd.com",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 1200, motorhomePitches: 400, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "30km južno od Zadra, A1 izlaz Zadar ili D8. Trajekt Biograd-Tkon (Pašman) 20 min, do 13 polazaka/dan ljeti.",
      yoloSensors: ["biograd","zadar","a1_zg_split","tkon"],
      ferry: { line: "Biograd-Tkon (Pašman)", operator: "Jadrolinija", auto_5m: 14 },
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 68 },
    partner: false, bookUrl: null,
    notes: "Izvrsna polazišna točka za NP Kornati. Trajekt za Pašman 20 min.",
  },

  {
    id: "HR-ZAD-003",
    name: "Camping Resort Šibenik",
    region: "zadar_sibenik", sub: "sibenik",
    coords: [43.7421, 15.9113],
    website: "sibenik-camping.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 600, motorhomePitches: 200, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "2ha maslinova gaja uz more. Blizina Šibenika i Vodica. D8.",
      yoloSensors: ["sibenik","vodice","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 58 },
    partner: false, bookUrl: null,
    notes: "Maslinov gaj. Dobra baza za NP Krka (30km) i NP Kornati.",
  },

  {
    id: "HR-ZAD-004",
    name: "Camping Imperial",
    region: "zadar_sibenik", sub: "vodice",
    coords: [43.7597, 15.7872],
    website: "solaris.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 500, motorhomePitches: 180, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "1km južno od Vodica u borovici. D8.",
      yoloSensors: ["vodice","sibenik"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 22, mid: 40, high: 60 },
    partner: false, bookUrl: null,
    notes: "Dio Solaris resorta. Unutarnji i vanjski bazeni. Borovica uz more.",
  },

  {
    id: "HR-ZAD-005",
    name: "Tisno Camping",
    region: "zadar_sibenik", sub: "murter",
    coords: [43.8011, 15.6531],
    website: "camping-tisno.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 400, motorhomePitches: 140, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "⚠️ Most Tisno za Murter: zatvoren 9:00-9:30 i 17:00-17:30 za brodski promet! Planirati dolazak/odlazak izvan tih termina. Kamion/kamper prolazi bez problema izvan tih perioda.",
      yoloSensors: ["tisno","murter","biograd"],
      bridge: "Most Tisno: zatvorenje za brodove 9:00-9:30 i 17:00-17:30 svaki dan.",
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 20, mid: 38, high: 58 },
    partner: false, bookUrl: null,
    notes: "Mirne turističke parcele, obiteljske parcele s pogledom na more. ⚠️ Plimski most!",
  },

  {
    id: "HR-ZAD-006",
    name: "Camping Zaton Holiday Resort",
    region: "zadar_sibenik", sub: "zadar_north",
    coords: [44.2232, 15.1487],
    website: "zaton.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 1800, motorhomePitches: 600, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "14km sjeverno od Zadra, D8. Veliki kamp s odličnom infrastrukturom.",
      yoloSensors: ["zadar","nin","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: true, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak/pijesak direktno", dogFriendly: true,
    },
    price: { low: 26, mid: 50, high: 72 },
    partner: false, bookUrl: null,
    notes: "⭐ LPG dostupan! 16A na nekim parcelama. Jedan od najvećih kampova HR. Odličan dump station.",
  },

  {
    id: "HR-ZAD-007",
    name: "Bluesun Camping Paklenica",
    region: "zadar_sibenik", sub: "starigrad_paklenica",
    coords: [44.2870, 15.4473],
    website: "bluesuncamping.com/hr/paklenica",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 600, motorhomePitches: 200, maxLen: 12, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "D8 Starigrad Paklenica, 35km sjeverno od Zadra. Direktno uz NP Paklenica — ulaz u kanjon pješice 5 min.",
      yoloSensors: ["zadar","paklenica","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak/kamen direktno", dogFriendly: true,
    },
    price: { low: 24, mid: 44, high: 62 },
    partner: false, bookUrl: null,
    notes: "Neposredno uz NP Paklenica — penjački raj. Kamperi do 12m bez problema. LPG: Starigrad/Zadar.",
  },

  {
    id: "HR-ZAD-008",
    name: "Kamp Nin",
    region: "zadar_sibenik", sub: "nin",
    coords: [44.2455, 15.1742],
    website: "campingnin.hr",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 350, motorhomePitches: 120, maxLen: 10, maxH: null },
    access: {
      road: "asfalt", maxLen: null, maxH: null, maxW: null,
      notes: "Nin 13km sjeverno od Zadra, D306. Legendarni sabunara (ljekovito blato). Pristup lak, manji kamp uz pijesak.",
      yoloSensors: ["zadar","nin","biograd"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: false,
      pool: false, beach: "pijesak direktno", dogFriendly: true,
    },
    price: { low: 18, mid: 34, high: 52 },
    partner: false, bookUrl: null,
    notes: "Jedina pješčana plaža u okolici. Ljekovito blato sabunara uz plaži. Miran obiteljski kamp.",
  },

  // ── SPLIT / MAKARSKA ──────────────────────────────────────────────────────

  {
    id: "HR-SPL-001",
    name: "Camping Stobreč Split",
    region: "split_makarska", sub: "split",
    coords: [43.4891, 16.5543],
    website: "campingsplit.com",
    phone: "+385 21 325 426",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 272, motorhomePitches: 160, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "⚠️ Split centar NIJE za kampere! Koristiti parking P+R Supaval ili Kopilica. Kamp je 10km od Splita prema istoku, D8 Stobreč. Dobro označen.",
      yoloSensors: ["split","stobrec","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10-16A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 28, mid: 52, high: 76 },
    partner: false, bookUrl: null,
    notes: "⭐ ADAC Superplatz (top 190 EU kampova). Wellness/spa. Svi priključci. Ronilački centar, SUP, yoga.",
  },

  {
    id: "HR-SPL-002",
    name: "Camping Galeb (Omiš)",
    region: "split_makarska", sub: "omis",
    coords: [43.4464, 16.6981],
    website: "hotel-galeb.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 230, motorhomePitches: 100, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "1km od centra Omiša, D8. Cetina kanjon u blizini — obavezno za kampere koji volun rafting.",
      yoloSensors: ["omis","split","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 22, mid: 42, high: 64 },
    partner: false, bookUrl: null,
    notes: "Blizina Cetine za rafting. 1km od tvrđave Mirabela. Dobra lokacija za obilazak Makarske rivijere.",
  },

  {
    id: "HR-SPL-003",
    name: "Camping Krvavica",
    region: "split_makarska", sub: "baska_voda",
    coords: [43.3652, 16.9147],
    website: "autocamp-krvavica.com",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 200, motorhomePitches: 80, maxLen: 9, maxH: null },
    access: {
      road: "asfalt",
      notes: "6km od Makarske, D8. Mali obiteljski kamp. Cesta prohodna za kampere do 9m.",
      yoloSensors: ["makarska","baska_voda","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: false, shop: false, restaurant: false,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 18, mid: 34, high: 52 },
    partner: false, bookUrl: null,
    notes: "Mali, miran obiteljski kamp. Sjajne noći, izvrna plaža. Nema dump stanice ni restorana.",
  },

  {
    id: "HR-SPL-004",
    name: "Medora Orbis Camping",
    region: "split_makarska", sub: "makarska",
    coords: [43.2970, 17.0233],
    website: "medora.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 450, motorhomePitches: 180, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "Tučepi, 5km od Makarske. D8. Lako dostupno.",
      yoloSensors: ["makarska","tucepi","a1_zg_split"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 68 },
    partner: false, bookUrl: null,
    notes: "4 zvjezdice. Rivijera Tučepi. Bazen, sportski sadržaji.",
  },

  {
    id: "HR-SPL-005",
    name: "Camping Dole",
    region: "split_makarska", sub: "makarska",
    coords: [43.3341, 16.9502],
    website: "autocamp-dole.hr",
    season: { open: "05-01", close: "09-30" },
    capacity: { total: 180, motorhomePitches: 70, maxLen: 9, maxH: null },
    access: {
      road: "asfalt",
      notes: "Između Baške Vode i Makarske, D8. Mali kamp direktno na plaži.",
      yoloSensors: ["makarska","baska_voda"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: false, laundry: false, shop: false, restaurant: false,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 16, mid: 30, high: 46 },
    partner: false, bookUrl: null,
    notes: "Direktna šljunčana plaža. Ronjenje, snorkeling, sup. Bez amenitija — čista priroda.",
  },

  {
    id: "HR-SPL-006",
    name: "Camping Hvar (Vira)",
    region: "split_makarska", sub: "hvar",
    coords: [43.1688, 16.6591],
    website: "campinghvar.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 300, motorhomePitches: 100, maxLen: 8, maxH: null },
    access: {
      road: "asfalt",
      notes: "⚠️ HVAR: Trajekt Split-Stari Grad (Jadrolinija) ILI Drvenik-Sučuraj (kraći, manje gužve, manje kampera). Tunel Pitve ZABRANJENO za kampere (visina 2.4m, širina 2.3m)! Koristiti obilazak.",
      yoloSensors: ["split","stari_grad","drvenik","sucaraj"],
      ferry: { line: "Split-Stari Grad ili Drvenik-Sučuraj", operator: "Jadrolinija", mustBook: true },
      tunnel: "⛔ TUNEL PITVE: max 2.3m širina, 2.4m visina — ZABRANJENO za kampere! Obvezni obilazak.",
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 24, mid: 46, high: 70 },
    partner: false, bookUrl: null,
    notes: "⛔ Tunel Pitve ZABRANJENO! Koristiti obilazac. Drvenik-Sučuraj trajekt manje gužve.",
  },

  // ── DUBROVNIK / JUŽNA DALMACIJA ───────────────────────────────────────────

  {
    id: "HR-DUB-001",
    name: "Camping Nevio",
    region: "dubrovnik", sub: "orebit",
    coords: [42.9789, 17.2043],
    website: "nevio-camping.com",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 150, motorhomePitches: 80, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "Orebić, Pelješac poluotok. Pelješki most (besplatan od 2022) → D8 → Orebić. Nema Neum obilazak. Trajekt Orebić-Korčula 15 min za ekskurziju.",
      yoloSensors: ["peljesac","orebic","dubrovnik","a1_zg_split"],
      ferry: { line: "Orebić-Korčula (izlet)", operator: "Jadrolinija" },
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: true,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: true,
      pool: true, beach: "šljunak direktno", dogFriendly: true,
    },
    price: { low: 26, mid: 48, high: 72 },
    partner: false, bookUrl: null,
    notes: "⭐ Višestruki pobjednik nagrade za najbolji kamp HR. 4 zvjezdice. Dump point, grey water.",
  },

  {
    id: "HR-DUB-002",
    name: "Brijesta Camping",
    region: "dubrovnik", sub: "peljesac",
    coords: [42.8842, 17.5631],
    website: "brijesta-dubrovnik.camp",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 70, motorhomePitches: 40, maxLen: 12, maxH: null },
    access: {
      road: "asfalt/šljunak",
      notes: "75km sjeverno od Dubrovnika. Pelješki most + D414. Tiho pelješko selo. Dva kampa: 'Zakono' (maslinik, 50m od plaže) i 'Vrela' (direktno na plaži).",
      yoloSensors: ["peljesac","ston","dubrovnik"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: false, shop: false, restaurant: false,
      pool: false, beach: "šljunak/pijesak direktno", dogFriendly: true,
    },
    price: { low: 18, mid: 34, high: 52 },
    partner: false, bookUrl: null,
    notes: "Autentično pelješko selo. Zakono (40 parcela u masliniku) + Vrela (20 parcela uz samu plaž).",
  },

  {
    id: "HR-DUB-003",
    name: "Camping Kate",
    region: "dubrovnik", sub: "mlini",
    coords: [42.5876, 18.2184],
    website: "campingkate.com",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 200, motorhomePitches: 80, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "10km južno od Dubrovnika, 15km sjeverno od Cavtata. D8. Autobus prema Dubrovniku/Cavtatu. ⚠️ DUBROVNIK centar NIKAKO kamperom — koristiti Pile parking + autobus.",
      yoloSensors: ["dubrovnik","mlini","cavtat"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: false, restaurant: false,
      pool: false, beach: "šljunak pješačenje do mora", dogFriendly: true,
    },
    price: { low: 22, mid: 42, high: 65 },
    partner: false, bookUrl: null,
    notes: "Tranzitni kamp Dubrovnik. Camper opskrbna stanica. Autobus direktno do Straduna.",
  },

  {
    id: "HR-DUB-004",
    name: "Autocamp Laguna (Plat)",
    region: "dubrovnik", sub: "plat",
    coords: [42.6124, 18.1632],
    website: "camplaguna-dubrovnik.hr",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 250, motorhomePitches: 90, maxLen: 10, maxH: null },
    access: {
      road: "asfalt",
      notes: "8km od Dubrovnika, D8. Mirno, rijetko turiste.",
      yoloSensors: ["dubrovnik","plat","cavtat"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: false, shop: false, restaurant: false,
      pool: false, beach: "šljunak 5 min pješačenja", dogFriendly: true,
    },
    price: { low: 18, mid: 34, high: 52 },
    partner: false, bookUrl: null,
    notes: "Miran kamp, dobra cijena. Nema dump stanice. 5 min hoda do plaže.",
  },

  {
    id: "HR-DUB-005",
    name: "Solitudo Sunny Camping",
    region: "dubrovnik", sub: "dubrovnik",
    coords: [42.6563, 18.0729],
    website: "babinkuk.com/solitudo",
    season: { open: "04-01", close: "10-31" },
    capacity: { total: 500, motorhomePitches: 200, maxLen: 12, maxH: null },
    access: {
      road: "asfalt",
      notes: "⚠️ Jedini kamp u vlasništvu Dubrovnika. Gradske ulice NISU za kampere. Koristiti Pile/Gruz parking + autobuse. Kamp je na poluotoku Babin Kuk, prihvatljiv pristup D8.",
      yoloSensors: ["dubrovnik","babin_kuk"],
      ferry: null,
    },
    infra: {
      electricity: "10A", dumpStation: true, freshWater: true, greyWater: false,
      lpg: false, wifi: true, laundry: true, shop: true, restaurant: true,
      pool: false, beach: "šljunak 5 min", dogFriendly: true,
    },
    price: { low: 26, mid: 50, high: 78 },
    partner: false, bookUrl: null,
    notes: "Najbliži kamp Dubrovniku (autobus direktno do Straduna). ⚠️ Centar je zabranjene zone!",
  },

  {
    id: "HR-DUB-006",
    name: "Autocamp Lovor (Mljet)",
    region: "dubrovnik", sub: "mljet",
    coords: [42.7643, 17.5892],
    website: "autocamp-mljet.com",
    season: { open: "04-15", close: "10-15" },
    capacity: { total: 100, motorhomePitches: 40, maxLen: 10, maxH: null },
    access: {
      road: "asfalt/šljunak",
      notes: "⚠️ MLJET: Trajekt Dubrovnik/Prapratno-Sobra. Jedina auto-luka na Mljetu. Kamperi dobrodošli. Kamp 15km od Sobe, uz rub NP Mljet.",
      yoloSensors: ["dubrovnik","sobra","mljet"],
      ferry: { line: "Prapratno-Sobra", operator: "Jadrolinija", mustBook: true },
    },
    infra: {
      electricity: "10A", dumpStation: false, freshWater: true, greyWater: false,
      lpg: false, wifi: false, laundry: false, shop: false, restaurant: false,
      pool: false, beach: "kamen/šuma direktno", dogFriendly: true,
    },
    price: { low: 16, mid: 30, high: 46 },
    partner: false, bookUrl: null,
    notes: "Obiteljski kamp uz NP Mljet. Pickup/dropoff u Sobri dostupan. Bez amenitija — priroda.",
  },

];

// ── REGION INDEX — quick lookup by region key ─────────────────────────────
export const CAMPS_BY_REGION = CAMPS.reduce((acc, c) => {
  if (!acc[c.region]) acc[c.region] = [];
  acc[c.region].push(c);
  return acc;
}, {});

// ── FORMAT FOR AI PROMPT ──────────────────────────────────────────────────
// Returns compact text block ready for injection into camper system prompt.
// status = { [campId]: { occupancy, status, notes } } from Firestore
export function buildCampPrompt(region, status = {}, camperLen = 7, camperH = null) {
  const camps = CAMPS_BY_REGION[region] || [];
  if (!camps.length) return "";

  const lines = [`KAMPOVI U REGIJI (${camps.length} kampova):`];

  for (const c of camps) {
    const st = status[c.id] || {};
    const dynStatus = st.status === "full" ? "🔴 PUNO"
      : st.status === "almost_full" ? "🟡 SKORO PUNO"
      : st.status === "closed" ? "⛔ ZATVORENO"
      : st.occupancy > 85 ? "🟡 GUSTO"
      : "🟢 slobodno";

    // Access warning for this camper
    const accessWarn = [];
    if (c.capacity.maxLen && camperLen > c.capacity.maxLen)
      accessWarn.push(`⛔ MAX ${c.capacity.maxLen}m — tvoj kamper prevelik!`);
    if (c.access.tunnel) accessWarn.push(c.access.tunnel);
    if (c.access.bridgeWarning) accessWarn.push(`⚠️ ${c.access.bridgeWarning}`);
    if (c.access.ferry) {
      const f = c.access.ferry;
      accessWarn.push(`Trajekt: ${f.line} (${f.operator})${f.mustBook ? " — REZERVACIJA OBAVEZNA ljeti!" : ""}`);
    }

    const infraFlags = [
      c.infra.dumpStation ? "dump✓" : "dump✗",
      c.infra.lpg ? "LPG✓" : "",
      `${c.infra.electricity}`,
      c.infra.wifi ? "wifi" : "",
      c.infra.pool ? "bazen" : "",
    ].filter(Boolean).join(", ");

    const priceInfo = `van sezone €${c.price.low}/noć, ljeto €${c.price.high}/noć`;

    lines.push(`\n● ${c.name} [${c.id}] ${dynStatus}`);
    lines.push(`  ${c.sub ? c.sub.replace(/_/g," ") : c.region} | ${c.capacity.motorhomePitches} kamper parcela | max ${c.capacity.maxLen || "∞"}m`);
    lines.push(`  Infra: ${infraFlags}`);
    lines.push(`  Plaža: ${c.infra.beach}`);
    lines.push(`  Cijena: ${priceInfo}`);
    if (accessWarn.length) lines.push(`  ${accessWarn.join(" | ")}`);
    if (st.notes) lines.push(`  Live: ${st.notes}`);
    if (c.notes) lines.push(`  Napomena: ${c.notes}`);
    if (c.website) lines.push(`  Web: ${c.website}`);
  }

  lines.push(`\nPRAVILA ZA KAMPOVE:
- Dump stanica: obavezno provjeri — označeno dump✓/dump✗ za svaki kamp
- LPG: samo kamp Zaton Holiday Resort sigurno ima LPG — ostali: Rijeka/Split/Zadar centri
- Rezervacija: srpanj/kolovoz OBAVEZNO unaprijed, posebno za velike parcele
- Plaže: šljunak prevladava, pijesak = rijetko (Lopar Sahara, Nin)
- NIKAD ne preporuči divlje kampiranje — kazna 130-1300€
- Za kampere >9m: posebno upozori na ograničenja pristupa i max dužinu parcela`);

  return lines.join("\n");
}

// ── DELTA APPROACH INDEX ──────────────────────────────────────────────────
// Maps YOLO sensor prefixes → camps they feed into (for approach monitoring)
export function getCampsForSensor(sensorId) {
  return CAMPS.filter(c =>
    c.access.yoloSensors?.some(prefix => sensorId.includes(prefix))
  ).map(c => c.id);
}
