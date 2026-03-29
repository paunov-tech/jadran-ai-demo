// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Destination Explorer  "/explore"
// Mediterranean luxury editorial · mobile-first · Apple-grade
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { DealCards } from "./DealCards";

// ─── FONTS ───
const F = "'Playfair Display','Cormorant Garamond',Georgia,serif";
const B = "'Outfit','system-ui',sans-serif";

// ─── REGIONS — 6 key destinations each ───
const REGIONS = [
  {
    id:"Istra", img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80", accent:"#fb923c", liveCity:"rovinj",
    tagline:{ hr:"Tartufi, vino i rimska arena", de:"Trüffel, Wein und römische Arena", en:"Truffles, wine and Roman arena", it:"Tartufi, vino e arena romana" },
    destinations:[
      { id:"rovinj",   name:"Rovinj",   accent:"#fb923c", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=75",           tagline:{hr:"Najromantičniji grad",de:"Romantischste Stadt",en:"Most romantic town",it:"Città più romantica"} },
      { id:"pula",     name:"Pula",     accent:"#34d399", img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600&q=75",           tagline:{hr:"Rimska arena živi",de:"Die Arena lebt",en:"Roman Arena lives on",it:"L'Arena Romana vive"} },
      { id:"porec",    name:"Poreč",    accent:"#fbbf24", img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=75", tagline:{hr:"Eufrazijeva bazilika",de:"Euphrasius-Basilika",en:"Euphrasian Basilica",it:"Basilica Eufrasiana"} },
      { id:"novigrad", name:"Novigrad", accent:"#06b6d4", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=75", tagline:{hr:"Ribarska idila",de:"Fischeridyll",en:"Fisherman's idyll",it:"Idillio da pescatore"} },
      { id:"motovun",  name:"Motovun",  accent:"#a3e635", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=75", tagline:{hr:"Grad tartufa",de:"Trüffelstadt",en:"Truffle town",it:"Città dei tartufi"} },
      { id:"labin",    name:"Labin",    accent:"#f472b6", img:"https://images.unsplash.com/photo-1475776408506-9a5371e7a068?w=600&q=75", tagline:{hr:"Istarski balkon",de:"Istrianischer Balkon",en:"Istrian balcony",it:"Balcone dell'Istria"} },
    ]
  },
  {
    id:"Kvarner", img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80", accent:"#0ea5e9", liveCity:"rab",
    tagline:{ hr:"Otoci, fjordovi i wellness", de:"Inseln, Fjorde und Wellness", en:"Islands, fjords and wellness", it:"Isole, fiordi e benessere" },
    destinations:[
      { id:"rab",     name:"Rab",     accent:"#fbbf24", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=75",           tagline:{hr:"Otok četiri zvonika",de:"Insel der vier Türme",en:"Island of four bell towers",it:"Isola dei quattro campanili"} },
      { id:"opatija", name:"Opatija", accent:"#06b6d4", img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=75", tagline:{hr:"Elegancija Kvarnera",de:"Eleganz des Kvarners",en:"Kvarner elegance",it:"Eleganza del Quarnero"} },
      { id:"krk",     name:"Krk",     accent:"#22c55e", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=75", tagline:{hr:"Kruna Kvarnera",de:"Krone des Kvarners",en:"Crown of the Kvarner",it:"Corona del Quarnero"} },
      { id:"cres",    name:"Cres",    accent:"#84cc16", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75", tagline:{hr:"Divlja priroda",de:"Wilde Natur",en:"Wild nature",it:"Natura selvaggia"} },
      { id:"losinj",  name:"Lošinj",  accent:"#38bdf8", img:"https://images.unsplash.com/photo-1475776408506-9a5371e7a068?w=600&q=75", tagline:{hr:"Otok vitalnosti",de:"Insel der Vitalität",en:"Island of vitality",it:"Isola della vitalità"} },
      { id:"rijeka",  name:"Rijeka",  accent:"#c084fc", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=75", tagline:{hr:"Luka i kultura",de:"Hafen und Kultur",en:"Port and culture",it:"Porto e cultura"} },
    ]
  },
  {
    id:"Dalmacija", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=800&q=80", accent:"#38bdf8", liveCity:"split",
    tagline:{ hr:"Antički gradovi i kristalno more", de:"Antike Städte und kristallklares Meer", en:"Ancient towns and crystal-clear sea", it:"Città antiche e mare cristallino" },
    destinations:[
      { id:"dubrovnik", name:"Dubrovnik", accent:"#f97316", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=75",  tagline:{hr:"Biser Jadrana",de:"Perle der Adria",en:"Pearl of the Adriatic",it:"Perla dell'Adriatico"} },
      { id:"split",     name:"Split",     accent:"#0ea5e9", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=75", tagline:{hr:"Dioklecijanova palača",de:"Diokletianpalast",en:"Diocletian's Palace",it:"Palazzo di Diocleziano"} },
      { id:"zadar",     name:"Zadar",     accent:"#f59e0b", img:"https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=75", tagline:{hr:"Najljepši zalazak",de:"Schönster Sonnenuntergang",en:"Most beautiful sunset",it:"Tramonto più bello"} },
      { id:"sibenik",   name:"Šibenik",   accent:"#a78bfa", img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=600&q=75", tagline:{hr:"UNESCO katedrale",de:"UNESCO-Kathedralen",en:"UNESCO cathedrals",it:"Cattedrali UNESCO"} },
      { id:"trogir",    name:"Trogir",    accent:"#fb923c", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=75", tagline:{hr:"Otok-grad UNESCO",de:"Inselstadt UNESCO",en:"Island-city UNESCO",it:"Città-isola UNESCO"} },
      { id:"makarska",  name:"Makarska",  accent:"#38bdf8", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75", tagline:{hr:"Rivijera iz snova",de:"Traumriviera",en:"Dream riviera",it:"Riviera dei sogni"} },
    ]
  },
  {
    id:"Otoci", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", accent:"#a78bfa", liveCity:"rab",
    tagline:{ hr:"Lavanda, glamur i čiste plaže", de:"Lavendel, Glamour und saubere Strände", en:"Lavender, glamour and pristine beaches", it:"Lavanda, glamour e spiagge incontaminate" },
    destinations:[
      { id:"rab",     name:"Rab",     accent:"#fbbf24", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=75",           tagline:{hr:"Četiri zvonika · čiste plaže",de:"Vier Türme · saubere Strände",en:"Four towers · pristine beaches",it:"Quattro campanili · spiagge incontaminate"} },
      { id:"hvar",    name:"Hvar",    accent:"#a78bfa", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=75",           tagline:{hr:"Lavanda i glamur",de:"Lavendel und Glamour",en:"Lavender and glamour",it:"Lavanda e glamour"} },
      { id:"brac",    name:"Brač",    accent:"#fbbf24", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=75", tagline:{hr:"Zlatni rat i mramor",de:"Goldenes Horn & Marmor",en:"Golden Horn & marble",it:"Corno d'oro e marmo"} },
      { id:"korcula", name:"Korčula", accent:"#22c55e", img:"https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=75", tagline:{hr:"Rodni grad Marka Pola",de:"Geburtsort Marco Polos",en:"Marco Polo's birthplace",it:"Città natale di Marco Polo"} },
      { id:"vis",     name:"Vis",     accent:"#38bdf8", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=75", tagline:{hr:"Autentični daleki otok",de:"Authentische ferne Insel",en:"Authentic far island",it:"Isola lontana autentica"} },
      { id:"mljet",   name:"Mljet",   accent:"#34d399", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=75", tagline:{hr:"Nacionalni park · jezera",de:"Nationalpark · Seen",en:"National park · lakes",it:"Parco nazionale · laghi"} },
    ]
  },
];

// ─── RABSKA FJERA ───
const FJERA = {
  title: { hr:"Rabska Fjera", de:"Rabska Fjera", en:"Rabska Fjera", it:"Rabska Fjera" },
  sub: { hr:"Najveći srednjovjekovni festival Hrvatske · od 1364.", de:"Kroatiens größtes Mittelalterfest · seit 1364.", en:"Croatia's largest medieval festival · since 1364.", it:"Il più grande festival medievale della Croazia · dal 1364." },
  date: "25 — 27. VII.",
  facts: [
    { n:"700+", l:{hr:"Kostimiranih sudionika",de:"Kostümierte Teilnehmer",en:"Costumed participants",it:"Partecipanti in costume"} },
    { n:"100+", l:{hr:"Obrtničkih radionica",de:"Handwerksstätten",en:"Craft workshops",it:"Laboratori artigianali"} },
    { n:"1364", l:{hr:"Godina osnivanja",de:"Gründungsjahr",en:"Year founded",it:"Anno di fondazione"} },
  ],
  highlights: [
    { e:"⚔️", l:{hr:"Turnir samostreličara",de:"Armbrustturnier",en:"Crossbow tournament",it:"Torneo di balestra"} },
    { e:"🏰", l:{hr:"Povorka kroz stari grad",de:"Parade durch die Altstadt",en:"Old town parade",it:"Sfilata nel centro storico"} },
    { e:"🍖", l:{hr:"Srednjovjekovna jela",de:"Mittelalterliche Speisen",en:"Medieval cuisine",it:"Cucina medievale"} },
    { e:"🎆", l:{hr:"Vatromet u ponoć",de:"Feuerwerk um Mitternacht",en:"Midnight fireworks",it:"Fuochi d'artificio a mezzanotte"} },
  ],
};

// ─── STATS ───
const STATS = [
  { n:"165+",  l:{hr:"Jadran Sense™ točaka",de:"Jadran Sense™ Punkte",en:"Jadran Sense™ points",it:"Punti Jadran Sense™",pl:"Punktów Jadran Sense™",si:"Jadran Sense™ točk"} },
  { n:"8",     l:{hr:"Jezika",de:"Sprachen",en:"Languages",it:"Lingue",pl:"Języków",si:"Jezikov"} },
  { n:"7",     l:{hr:"Regija",de:"Regionen",en:"Regions",it:"Regioni",pl:"Regionów",si:"Regij"} },
  { n:"24/7",  l:{hr:"AI vodič",de:"KI-Guide",en:"AI guide",it:"Guida AI",pl:"Przewodnik AI",si:"AI vodič"} },
];

// ─── SENSE — image-driven, no emoji ───
const SENSE = [
  { img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60", l:{hr:"Plaže uživo",de:"Live-Strände",en:"Live beaches",it:"Spiagge live",pl:"Plaże na żywo",si:"Plaže v živo"}, v:{hr:"Popunjenost · Stanje mora",de:"Auslastung · Meerzustand",en:"Occupancy · Sea conditions",it:"Occupazione · Condizioni mare",pl:"Obłożenie · Stan morza",si:"Zasedenost · Stanje morja"} },
  { img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=60", l:{hr:"Parking uživo",de:"Live Parken",en:"Live parking",it:"Parcheggio live",pl:"Parking na żywo",si:"Parking v živo"}, v:{hr:"Slobodna mjesta · Cijene",de:"Freie Plätze · Preise",en:"Free spots · Prices",it:"Posti liberi · Prezzi",pl:"Wolne miejsca · Ceny",si:"Prosta mesta · Cene"} },
  { img:"https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=200&q=60", l:{hr:"Marine i vezovi",de:"Marinas & Liegeplätze",en:"Marinas & berths",it:"Marine e ormeggi",pl:"Mariny i miejsca cumowania",si:"Marine in privezi"}, v:{hr:"Slobodni vezovi · Uvjeti",de:"Freie Liegeplätze · Bedingungen",en:"Free berths · Conditions",it:"Posti liberi · Condizioni",pl:"Wolne miejsca · Warunki",si:"Prosti privezi · Pogoji"} },
  { img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=200&q=60", l:{hr:"Vrijeme i more",de:"Wetter & Meer",en:"Weather & sea",it:"Meteo e mare",pl:"Pogoda i morze",si:"Vreme in morje"}, v:{hr:"UV · Temperatura · Vjetar",de:"UV · Temperatur · Wind",en:"UV · Temperature · Wind",it:"UV · Temperatura · Vento",pl:"UV · Temperatura · Wiatr",si:"UV · Temperatura · Veter"} },
];

// ─── GYG OFFERS — GetYourGuide affiliate ───
const GYG_OFFERS = [
  { title:{hr:"Tura brodom — Rab",de:"Bootstour — Rab",en:"Boat tour — Rab",it:"Tour in barca — Rab"}, price:"45€", tag:"RAB", img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=75", link:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour" },
  { title:{hr:"Blue Cave & 5 otoka",de:"Blaue Grotte & 5 Inseln",en:"Blue Cave & 5 islands",it:"Grotta Azzurra & 5 isole"}, price:"110€", tag:"SPLIT", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75", link:"https://www.getyourguide.com/split-l268/?partner_id=9OEGOYI&q=blue+cave" },
  { title:{hr:"Lov na tartufe — Motovun",de:"Trüffeljagd — Motovun",en:"Truffle hunting — Motovun",it:"Caccia al tartufo — Montona"}, price:"45€", tag:"ISTRA", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75", link:"https://www.getyourguide.com/istria-county-l1297/?partner_id=9OEGOYI&q=truffle" },
  { title:{hr:"Kajak Dubrovnik zidine",de:"Kajak Dubrovnik Mauern",en:"Kayak Dubrovnik walls",it:"Kayak mura Dubrovnik"}, price:"40€", tag:"DUBROVNIK", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&q=75", link:"https://www.getyourguide.com/dubrovnik-l213/?partner_id=9OEGOYI&q=kayak" },
  { title:{hr:"Degustacija vina — Pelješac",de:"Weinverkostung — Pelješac",en:"Wine tasting — Pelješac",it:"Degustazione vini — Pelješac"}, price:"35€", tag:"DUBROVNIK", img:"https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&q=75", link:"https://www.getyourguide.com/ston-l4159/?partner_id=9OEGOYI&q=wine" },
];

// ─── CITY-LEVEL AFFILIATES (our contracted partners, appear first in city deals) ───
const CITY_AFFILIATES = {
  rab: [
    { id:"blackjack", name:"Black Jack", img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75", badge:"NAŠI PARTNER", badgeColor:"#f97316", desc:{hr:"Gurman House · Palit, Rab",de:"Gurman House · Palit, Rab",en:"Gurman House · Palit, Rab",it:"Gurman House · Palit, Rab"}, cta:{hr:"Pogledaj meni",de:"Menü ansehen",en:"View menu",it:"Vedi menu"}, action:"bj" },
    { id:"fjera", name:"Rabska Fjera", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=75", badge:"⚔️ RAB · 25–27.VII", badgeColor:"#fbbf24", desc:{hr:"Najveći medievalni festival HR",de:"Kroatiens größtes Mittelalterfest",en:"Croatia's largest medieval festival",it:"Il più grande festival medievale"}, cta:{hr:"AI Guide Rab",de:"AI Guide Rab",en:"AI Guide Rab",it:"AI Guide Rab"}, link:"/?kiosk=rab" },
  ],
};

// ─── GYG DEALS PER CITY ───
// gygId: renders official GYG widget with real activity image/price/rating
// img: fallback for cities without a specific GYG activity widget
const CITY_GYG = {
  rab:      [{ title:{hr:"Tura brodom — Rab",de:"Bootstour — Rab",en:"Boat tour — Rab",it:"Tour in barca — Rab"}, price:"45€", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=75", link:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour" }],
  split:    [
    { gygId:"t326676", title:{hr:"Blue Cave, Hvar & 5 otoka",de:"Blaue Grotte, Hvar & 5 Inseln",en:"Blue Cave, Hvar & 5 islands",it:"Grotta Azzurra, Hvar & 5 isole"}, price:"145€", rating:"4.6", reviews:"6325", link:"https://www.getyourguide.com/activity/-t326676?partner_id=9OEGOYI" },
  ],
  dubrovnik:[
    { gygId:"t217212", title:{hr:"Game of Thrones tura + Lokrum",de:"Game of Thrones Tour + Lokrum",en:"Game of Thrones Tour + Lokrum",it:"Tour Game of Thrones + Lokrum"}, price:"20€", rating:"4.9", reviews:"4307", link:"https://www.getyourguide.com/activity/-t217212?partner_id=9OEGOYI" },
    { gygId:"t131646", title:{hr:"Crna Gora — Perast & Kotor brodom",de:"Montenegro — Perast & Kotor Bootstour",en:"Montenegro — Perast & Kotor boat tour",it:"Montenegro — Perast & Kotor in barca"}, price:"58€", rating:"4.6", reviews:"4127", link:"https://www.getyourguide.com/activity/-t131646?partner_id=9OEGOYI" },
    { title:{hr:"Kajak — zidine Dubrovnika",de:"Kajak — Dubrovnik Mauern",en:"Kayak — Dubrovnik walls",it:"Kayak — mura Dubrovnik"}, price:"40€", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&q=75", link:"https://www.getyourguide.com/dubrovnik-l213/?partner_id=9OEGOYI&q=kayak" },
  ],
  zagreb:   [
    { gygId:"t406236", title:{hr:"Plitvice & Rastoke s ulazninom",de:"Plitvicer Seen & Rastoke mit Ticket",en:"Plitvice & Rastoke with ticket",it:"Plitvice & Rastoke con biglietto"}, price:"99€", rating:"4.9", reviews:"3015", link:"https://www.getyourguide.com/activity/-t406236?partner_id=9OEGOYI" },
  ],
  rovinj:   [{ title:{hr:"Lov na tartufe — Motovun",de:"Trüffeljagd — Motovun",en:"Truffle hunting — Motovun",it:"Caccia al tartufo"}, price:"45€", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75", link:"https://www.getyourguide.com/istria-county-l1297/?partner_id=9OEGOYI&q=truffle" }],
  motovun:  [{ title:{hr:"Lov na tartufe — Motovun",de:"Trüffeljagd — Motovun",en:"Truffle hunting — Motovun",it:"Caccia al tartufo"}, price:"45€", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75", link:"https://www.getyourguide.com/istria-county-l1297/?partner_id=9OEGOYI&q=truffle" }],
  hvar:     [{ title:{hr:"Tura brodom — Hvar & Blue Lagoon",de:"Bootstour — Hvar & Blaue Lagune",en:"Boat tour — Hvar & Blue Lagoon",it:"Tour in barca — Hvar"}, price:"65€", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75", link:"https://www.getyourguide.com/hvar-l4149/?partner_id=9OEGOYI&q=boat+tour" }],
  makarska: [{ title:{hr:"Izlet na Biokovo",de:"Ausflug auf Biokovo",en:"Biokovo excursion",it:"Escursione Biokovo"}, price:"35€", img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75", link:"https://www.getyourguide.com/makarska-l4150/?partner_id=9OEGOYI&q=biokovo" }],
  zadar:    [{ title:{hr:"Krka & Šibenik vodopadi",de:"Krka & Šibenik Wasserfälle",en:"Krka & Šibenik waterfalls",it:"Cascate Krka & Šibenik"}, price:"55€", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=75", link:"https://www.getyourguide.com/zadar-l4157/?partner_id=9OEGOYI&q=krka" }],
  pula:     [{ title:{hr:"Tura rimske arene — Pula",de:"Führung Röm. Arena — Pula",en:"Roman Arena tour — Pula",it:"Tour Arena Romana — Pola"}, price:"20€", img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=75", link:"https://www.getyourguide.com/pula-l4161/?partner_id=9OEGOYI&q=arena" }],
  opatija:  [{ title:{hr:"Šetnja Lungomare & SPA",de:"Lungomare-Spaziergang & SPA",en:"Lungomare walk & SPA",it:"Passeggiata Lungomare & SPA"}, price:"30€", img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=400&q=75", link:"https://www.getyourguide.com/opatija-l4163/?partner_id=9OEGOYI&q=spa" }],
};

// ─── CITY → FIRESTORE REGION KEY MAPPING ───
const CITY_TO_FS = {
  rovinj:'istra', pula:'istra', porec:'istra', novigrad:'istra', motovun:'istra', labin:'istra',
  rab:'rab', krk:'rab', cres:'rab', losinj:'rab',
  opatija:'opatija', rijeka:'opatija',
  split:'split', sibenik:'split', trogir:'split', hvar:'split', brac:'split', vis:'split',
  dubrovnik:'dubrovnik', korcula:'dubrovnik', mljet:'dubrovnik',
  zadar:'zadar',
  makarska:'makarska',
};

// ─── HERO DESTINATIONS (cycling background) ───
const HERO_DESTS = [
  { id:"dubrovnik", name:"Dubrovnik", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=1400&q=85" },
  { id:"rab",       name:"Rab",       img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=85" },
  { id:"rovinj",    name:"Rovinj",    img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=85" },
  { id:"hvar",      name:"Hvar",      img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1400&q=85" },
  { id:"split",     name:"Split",     img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=1400&q=85" },
  { id:"zadar",     name:"Zadar",     img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1400&q=85" },
];

const FLAGS = { hr:"🇭🇷", de:"🇩🇪", at:"🇦🇹", en:"🇬🇧", it:"🇮🇹", pl:"🇵🇱", si:"🇸🇮" };

// ─── BLACK JACK MENU DATA ───
const BJ = {
  img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  address: "Palit 315, Rab · 200m od plaže",
  hours: { hr:"Pon–Ned 12:00–23:00", de:"Mo–So 12:00–23:00", en:"Mon–Sun 12:00–23:00", it:"Lun–Dom 12:00–23:00" },
  phone: "+385 51 724 522",
  link: "/?kiosk=rab&affiliate=blackjack&tk=sial2026&lang=de",
  menu: [
    {
      section: { hr:"Predjela", de:"Vorspeisen", en:"Starters", it:"Antipasti" },
      items: [
        { id:"prsut", emoji:"🥩", name:{ hr:"Dalmatinski pršut", de:"Dalmatinischer Pršut", en:"Dalmatian prosciutto", it:"Prosciutto dalmata" }, desc:{ hr:"Domaći suhomesnati pršut, masline, kapari, domaće maslinovo ulje s Raba", de:"Hausgemachter Trockenschinken, Oliven, Kapern, heimisches Olivenöl aus Rab", en:"Home-cured dry prosciutto, olives, capers, Rab olive oil", it:"Prosciutto stagionato artigianale, olive, capperi, olio d'oliva di Rab" }, price:12 },
        { id:"bruschette", emoji:"🍞", name:{ hr:"Bruschette s tartufima", de:"Bruschette mit Trüffel", en:"Truffle bruschette", it:"Bruschette al tartufo" }, desc:{ hr:"Prepečeni kruh s istarskom tartufnom kremom, cherry rajčicama i svježim bosiljkom", de:"Geröstetes Brot mit istrischer Trüffelcreme, Kirschtomaten und frischem Basilikum", en:"Toasted bread with Istrian truffle cream, cherry tomatoes and fresh basil", it:"Pane tostato con crema di tartufo istriano, pomodorini e basilico fresco" }, price:9 },
        { id:"calamari", emoji:"🦑", name:{ hr:"Kalamari na roštilju", de:"Gegrillte Kalamari", en:"Grilled calamari", it:"Calamari alla griglia" }, desc:{ hr:"Svježi jadranski kalamari s limunom, peršinom i domaćim maslinovim uljem", de:"Frische Adriatische Kalamari mit Zitrone, Petersilie und heimischem Olivenöl", en:"Fresh Adriatic calamari with lemon, parsley and local olive oil", it:"Calamari adriatici freschi con limone, prezzemolo e olio locale" }, price:14 },
      ]
    },
    {
      section: { hr:"S roštilja", de:"Vom Grill", en:"From the grill", it:"Dalla griglia" },
      items: [
        { id:"ribeye", emoji:"🥩", name:{ hr:"Argentinski ribeye 300g", de:"Argentinisches Ribeye 300g", en:"Argentine ribeye 300g", it:"Ribeye argentino 300g" }, desc:{ hr:"Premium argentinsko meso na drvenom ugljenu, dimljeni maslac, rucola salata, pečeni češnjak", de:"Premium argentinisches Fleisch auf Holzkohle, Räucherbutter, Rucola-Salat, gerösteter Knoblauch", en:"Premium Argentine beef on charcoal, smoked butter, rocket salad, roasted garlic", it:"Manzo argentino premium alla brace, burro affumicato, rucola, aglio arrosto" }, price:28 },
        { id:"cevapi", emoji:"🌭", name:{ hr:"Ćevapi s dimljenim sirom (8 kom)", de:"Ćevapi mit Räucherkäse (8 Stk)", en:"Ćevapi with smoked cheese (8 pcs)", it:"Ćevapi con formaggio affumicato (8 pz)" }, desc:{ hr:"Domaći goveđi ćevapi, dimljeni sir iz Dalmatinske zagore, ajvar, svježi luk, somun", de:"Hausgemachte Rindfleisch-Ćevapi, Räucherkäse aus dem dalmatinischen Hinterland, Ajvar, frische Zwiebeln, Somun-Brot", en:"Homemade beef ćevapi, smoked cheese from Dalmatian hinterland, ajvar, fresh onion, somun bread", it:"Ćevapi di manzo artigianali, formaggio affumicato della Dalmazia, ajvar, cipolla fresca, pane somun" }, price:16 },
        { id:"mixed", emoji:"🍖", name:{ hr:"Mješano meso s roštilja", de:"Gemischtes Grillplatte", en:"Mixed grill platter", it:"Piatto misto alla griglia" }, desc:{ hr:"Ćevapi, pileći batak, svinjska rebra i povrće s roštilja — za 2 osobe", de:"Ćevapi, Hähnchenschenkel, Schweinerippchen und Grillgemüse — für 2 Personen", en:"Ćevapi, chicken thigh, pork ribs and grilled vegetables — for 2 persons", it:"Ćevapi, coscia di pollo, costine di maiale e verdure grigliate — per 2 persone" }, price:32 },
      ]
    },
    {
      section: { hr:"Pizze", de:"Pizzen", en:"Pizzas", it:"Pizze" },
      items: [
        { id:"margherita", emoji:"🍕", name:{ hr:"Margherita", de:"Margherita", en:"Margherita", it:"Margherita" }, desc:{ hr:"San Marzano rajčica, buffalo mozzarella, svježi bosiljak, ekstra djevičansko maslinovo ulje", de:"San-Marzano-Tomaten, Büffelmozzarella, frisches Basilikum, natives Olivenöl extra", en:"San Marzano tomato, buffalo mozzarella, fresh basil, extra virgin olive oil", it:"Pomodoro San Marzano, mozzarella di bufala, basilico fresco, olio extravergine" }, price:11 },
        { id:"blackjack", emoji:"🃏", name:{ hr:"Pizza Black Jack", de:"Pizza Black Jack", en:"Pizza Black Jack", it:"Pizza Black Jack" }, desc:{ hr:"Dimljeni sir, ćevapčići, pepperoni, pečene paprike, češnjak ulje — naš signature", de:"Räucherkäse, Ćevapčići, Pepperoni, geröstete Paprika, Knoblauchöl — unser Signature-Gericht", en:"Smoked cheese, ćevapčići, pepperoni, roasted peppers, garlic oil — our signature", it:"Formaggio affumicato, ćevapčići, pepperoni, peperoni arrosto, olio all'aglio — la nostra specialty" }, price:15 },
        { id:"frutti", emoji:"🦐", name:{ hr:"Frutti di mare", de:"Frutti di mare", en:"Frutti di mare", it:"Frutti di mare" }, desc:{ hr:"Mješavina jadranskih plodova mora, rajčica, češnjak, peršin, maslinovo ulje", de:"Mischung aus adriatischen Meeresfrüchten, Tomaten, Knoblauch, Petersilie, Olivenöl", en:"Adriatic seafood medley, tomato, garlic, parsley, olive oil", it:"Misto di frutti di mare adriatici, pomodoro, aglio, prezzemolo, olio d'oliva" }, price:16 },
      ]
    },
    {
      section: { hr:"Deserti", de:"Desserts", en:"Desserts", it:"Dolci" },
      items: [
        { id:"rozata", emoji:"🍮", name:{ hr:"Domaća rožata", de:"Hausgemachte Rožata", en:"Homemade rožata", it:"Rožata artigianale" }, desc:{ hr:"Tradicionalni dalmatinski krem karamel s ružinom vodicom i mjedom s Raba", de:"Traditioneller dalmatinischer Crème caramel mit Rosenwasser und Honig aus Rab", en:"Traditional Dalmatian crème caramel with rose water and Rab honey", it:"Crème caramel dalmata con acqua di rose e miele di Rab" }, price:7 },
        { id:"smokva", emoji:"🍰", name:{ hr:"Torta od smokava", de:"Feigenkuchen", en:"Fig cake", it:"Torta di fichi" }, desc:{ hr:"Domaća torta s rabskim smokvama, mjedom i orasima — sezonski specijalitet", de:"Hausgemachter Kuchen mit Rab-Feigen, Honig und Walnüssen — Saisonspezialität", en:"Homemade cake with Rab figs, honey and walnuts — seasonal speciality", it:"Torta artigianale con fichi di Rab, miele e noci — specialità stagionale" }, price:8 },
      ]
    },
    {
      section: { hr:"Piće", de:"Getränke", en:"Drinks", it:"Bevande" },
      items: [
        { id:"vino", emoji:"🍷", name:{ hr:"Domaće vino (čaša)", de:"Hauswein (Glas)", en:"House wine (glass)", it:"Vino della casa (calice)" }, desc:{ hr:"Bijelo ili crno, lokalni vinari s otoka Raba i Pelješca", de:"Weiß oder Rot, lokale Winzer der Insel Rab und Pelješac", en:"White or red, local winemakers from Rab island and Pelješac", it:"Bianco o rosso, produttori locali dell'isola di Rab e Pelješac" }, price:5 },
        { id:"pivo", emoji:"🍺", name:{ hr:"Lokalno pivo", de:"Lokales Bier", en:"Local beer", it:"Birra locale" }, desc:{ hr:"Karlovačko ili Ožujsko, servirano u hladnom vrču", de:"Karlovačko oder Ožujsko, serviert im kühlen Krug", en:"Karlovačko or Ožujsko, served in a chilled mug", it:"Karlovačko o Ožujsko, servita in una boccale fredda" }, price:4 },
        { id:"sok", emoji:"🥤", name:{ hr:"Sok / Mineralna", de:"Saft / Mineralwasser", en:"Juice / Mineral water", it:"Succo / Acqua minerale" }, desc:{ hr:"Domaći sok od jabuke ili narančade, Jamnica mineralna voda", de:"Hausgemachter Apfel- oder Orangensaft, Jamnica Mineralwasser", en:"Homemade apple or orange juice, Jamnica mineral water", it:"Succo di mela o arancia artigianale, acqua minerale Jamnica" }, price:3 },
      ]
    },
  ],
  nearby: [
    { id:"plaza", emoji:"🏖️", name:{ hr:"Gradska plaža", de:"Stadtstand", en:"Town beach", it:"Spiaggia cittadina" }, dist:"200m", tag:{ hr:"Pješice", de:"zu Fuß", en:"On foot", it:"A piedi" }, link:"/?kiosk=rab&go=beach&lang=de" },
    { id:"starigard", emoji:"🏰", name:{ hr:"Stari grad Rab", de:"Altstadt Rab", en:"Rab Old Town", it:"Città vecchia di Rab" }, dist:"1.2 km", tag:{ hr:"4 zvonika", de:"4 Türme", en:"4 bell towers", it:"4 campanili" }, link:"/?kiosk=rab&go=oldtown&lang=de" },
    { id:"kampovi", emoji:"⛺", name:{ hr:"Camping Padova III", de:"Camping Padova III", en:"Camping Padova III", it:"Camping Padova III" }, dist:"800m", tag:{ hr:"Kamp parking", de:"Campingstellplatz", en:"Camper pitch", it:"Piazzola camper" }, link:"/?kiosk=rab&go=camping&lang=de" },
    { id:"marina", emoji:"⚓", name:{ hr:"Marina Rab", de:"Marina Rab", en:"Marina Rab", it:"Marina Rab" }, dist:"1.5 km", tag:{ hr:"48 vezova", de:"48 Liegeplätze", en:"48 berths", it:"48 ormeggi" }, link:"/?kiosk=rab&go=marina&lang=de" },
    { id:"spilja", emoji:"🦇", name:{ hr:"Špilja Šupljara", de:"Höhle Šupljara", en:"Šupljara Cave", it:"Grotta Šupljara" }, dist:"3 km", tag:{ hr:"Prirodna atrakcija", de:"Naturdenkmal", en:"Natural attraction", it:"Attrazione naturale" }, link:"/?kiosk=rab&go=cave&lang=de" },
  ],
};

export default function DestinationExplorer() {
  const [lang, setLang] = useState(() => {
    try {
      const s = localStorage.getItem("jadran_lang"); if (s) return s;
      const n = (navigator.language||"").toLowerCase();
      if (n.includes("at")) return "at";
      if (n.startsWith("de")) return "de";
      if (n.startsWith("en")) return "en";
      if (n.startsWith("it")) return "it";
      if (n.startsWith("pl")) return "pl";
      if (n.startsWith("sl")) return "si";
    } catch {} return "hr";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeDest, setActiveDest] = useState(null); // { id, name, img, liveCity }
  const [showBJ, setShowBJ] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [activeTab, setActiveTab] = useState("explore");
  const [heroIdx, setHeroIdx] = useState(0);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [viatorDeals, setViatorDeals] = useState([]);
  const [viatorLoading, setViatorLoading] = useState(false);
  const [activeDestId, setActiveDestId] = useState(null); // city within region sheet
  const heroRef = useRef(null);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  useEffect(() => { try { localStorage.setItem("jadran_lang",lang); } catch {} }, [lang]);
  // ─ GYG widget script loader ─
  useEffect(() => {
    if (document.querySelector('script[data-gyg-partner-id="9OEGOYI"]')) return;
    const s = document.createElement("script");
    s.src = "https://widget.getyourguide.com/dist/pa.umd.production.min.js";
    s.async = true;
    s.defer = true;
    s.setAttribute("data-gyg-partner-id", "9OEGOYI");
    document.head.appendChild(s);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setHeroIdx(i => (i + 1) % HERO_DESTS.length), 4500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const anyModal = showBJ || showLive;
    const h = e => { if (e.key === "Escape") { setShowBJ(false); setSelectedMenuItem(null); setShowLive(false); } };
    if (anyModal) {
      document.addEventListener("keydown", h);
      document.body.style.overflow = "hidden";
    }
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [showBJ, showLive]);

  // ─ Viator API fetch ─
  useEffect(() => {
    const key = import.meta.env.VITE_VIATOR_API_KEY;
    if (!key) return;
    setViatorLoading(true);
    const destId = activeDest ? activeDest.id : (activeRegion ? REGIONS.find(r => r.id === activeRegion)?.liveCity : null);
    fetch("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: { "exp-api-key": key, "Content-Type": "application/json", "Accept-Language": lang === "at" ? "de" : lang },
      body: JSON.stringify({
        filtering: { destination: destId || "769" }, // 769 = Croatia
        sorting: { sort: "TRAVELER_RATING", order: "DESC" },
        pagination: { start: 1, count: 6 },
        currency: "EUR",
      }),
    })
      .then(r => r.json())
      .then(data => { setViatorDeals(data.products || []); setViatorLoading(false); })
      .catch(() => setViatorLoading(false));
  }, [activeDest, activeRegion, lang]);

  const t = (obj) => { const k = lang==="at"?"de":lang; return obj[k] || (["pl","si"].includes(lang) ? obj.en : null) || obj.hr || ""; };
  const dl = lang === "at" ? "de" : (["pl","si"].includes(lang) ? "en" : lang);

  const activeRegionData = REGIONS.find(r => r.id === activeRegion);
  const destList = activeRegionData?.destinations ?? [];

  return (
    <div style={{ background:"#0a0e17", color:"#f0f4f8", fontFamily:B, minHeight:"100dvh", overflowX:"hidden" }}>

      {/* ── CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html { scroll-behavior: smooth; }
        body { overscroll-behavior: none; }
        @keyframes heroReveal { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes waveFlow { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes gradShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .explore-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .explore-card:active { transform: scale(0.97) !important; }
        @media (hover:hover) { .explore-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.4) !important; } }
        .region-pill { transition: all 0.25s; }
        .region-pill:active { transform: scale(0.95); }
        .sense-card { transition: all 0.3s; }
        @media (hover:hover) { .sense-card:hover { background: rgba(14,165,233,0.08) !important; border-color: rgba(14,165,233,0.25) !important; } }
        ::-webkit-scrollbar { height:4px; width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(14,165,233,0.2); border-radius:2px; }
        input:focus { outline:none; border-color:rgba(14,165,233,0.5) !important; box-shadow:0 0 0 3px rgba(14,165,233,0.1) !important; }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"10px 20px", paddingTop:"max(10px, env(safe-area-inset-top, 10px))", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(5,13,26,0.75)", backdropFilter:"blur(24px) saturate(1.8)", WebkitBackdropFilter:"blur(24px) saturate(1.8)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"grid", placeItems:"center", fontSize:14, fontWeight:800, color:"#fff", fontFamily:F, boxShadow:"0 4px 16px rgba(14,165,233,0.3)" }}>J</div>
          <span style={{ fontFamily:F, fontSize:15, fontWeight:600, letterSpacing:3, textTransform:"uppercase" }}>Jadran</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:300, letterSpacing:1 }}>
          {HERO_DESTS[heroIdx]?.name}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ position:"relative", height:"100dvh", overflow:"hidden", background:"#0a0e17" }}>
        {/* Pexels Adriatic video — matches transit/pre-trip segment */}
        <video autoPlay muted loop playsInline style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.28 }}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%230a0e17'/%3E%3C/svg%3E">
          <source src="https://videos.pexels.com/video-files/1093662/1093662-sd_640_360_30fps.mp4" type="video/mp4" />
        </video>
        {/* Rotating cinematic backgrounds on top of video */}
        {HERO_DESTS.map((hd, i) => (
          <div key={hd.id} style={{ position:"absolute", inset:"-5%", backgroundImage:`url(${hd.img})`, backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(0.22) saturate(1.5)", opacity: i === heroIdx ? 0.6 : 0, transition:"opacity 2.5s ease", willChange:"opacity" }} />
        ))}
        {/* Gradient overlays — like LandingPage */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(10,14,23,0.55) 0%, rgba(10,14,23,0.2) 35%, rgba(10,14,23,0.15) 55%, rgba(10,14,23,0.92) 85%, #0a0e17 100%)" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 120% 80% at 50% 100%, rgba(14,165,233,0.05) 0%, transparent 70%)" }} />
        {/* Top accent line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, rgba(14,165,233,0.6), rgba(251,191,36,0.4), rgba(14,165,233,0.6), transparent)", backgroundSize:"200% 100%", animation:"gradShift 8s ease infinite" }} />

        {/* Content — centered symmetric */}
        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", padding:"0 24px", maxWidth:720, margin:"0 auto", width:"100%", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"all 1.1s cubic-bezier(0.16,1,0.3,1)" }}>

          {/* Live badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 18px", borderRadius:20, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.18)", marginBottom:24 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 10px #22c55e", animation:"pulse 2s infinite", flexShrink:0 }} />
            <span style={{ fontSize:10, color:"#7dd3fc", fontWeight:600, letterSpacing:2 }}>
              {({hr:"JADRAN SENSE™ AKTIVAN",de:"JADRAN SENSE™ AKTIV",en:"JADRAN SENSE™ ACTIVE",it:"JADRAN SENSE™ ATTIVO",pl:"JADRAN SENSE™ AKTYWNY",si:"JADRAN SENSE™ AKTIVEN"})[dl] || "JADRAN SENSE™ ACTIVE"}
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{ fontFamily:F, fontSize:"clamp(40px,8vw,72px)", fontWeight:400, lineHeight:1.05, marginBottom:6, letterSpacing:"-0.02em" }}>
            <span style={{ display:"block", color:"rgba(240,244,248,0.45)", fontSize:"clamp(12px,2vw,15px)", fontFamily:B, fontWeight:300, letterSpacing:7, textTransform:"uppercase", marginBottom:16 }}>
              {({hr:"Otkrijte",de:"Entdecken Sie",en:"Discover",it:"Scoprite",pl:"Odkryj",si:"Odkrijte"})[dl] || "Discover"}
            </span>
            <span style={{ background:"linear-gradient(135deg, #f0f4f8 10%, #7dd3fc 45%, #fbbf24 85%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% 200%", animation:"gradShift 7s ease infinite" }}>
              {({hr:"Hrvatski Jadran",de:"Kroatische Adria",en:"Croatian Adriatic",it:"Adriatico Croato",pl:"Chorwacka Adria",si:"Hrvaška Adria"})[dl] || "Croatian Adriatic"}
            </span>
          </h1>

          {/* Currently showing */}
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:16, fontWeight:300, letterSpacing:2 }}>
            — {HERO_DESTS[heroIdx].name} —
          </div>

          <p style={{ fontSize:"clamp(14px,2vw,16px)", color:"#94a3b8", lineHeight:1.75, maxWidth:520, marginBottom:36, fontWeight:300 }}>
            {({
              hr:"Skrivene plaže, konobe od lokalaca, live stanje mora i parkinga — vaš AI vodič za savršeni Jadran.",
              de:"Versteckte Strände, lokale Restaurants, Live-Meer- und Parkdaten — Ihr KI-Guide für die perfekte Adria.",
              en:"Hidden beaches, local restaurants, live sea & parking data — your AI guide to the perfect Adriatic.",
              it:"Spiagge nascoste, ristoranti locali, dati live su mare e parcheggi — la tua guida AI per l'Adriatico perfetto.",
              pl:"Ukryte plaże, lokalne restauracje, dane live o morzu i parkingach — Twój przewodnik AI po Adriatyku.",
              si:"Skrite plaže, lokalni restavranti, podatki v živo — vaš AI vodnik za popolni Jadran.",
            })[dl] || ""}
          </p>

          {/* CTAs — centered */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:32 }}>
            <a href="#destinations" style={{ padding:"15px 32px", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:14, color:"#fff", fontSize:15, fontWeight:600, textDecoration:"none", fontFamily:F, letterSpacing:0.3, boxShadow:"0 4px 24px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.15)", minHeight:50, display:"inline-flex", alignItems:"center" }}>
              {({hr:"Istraži destinacije",de:"Destinationen entdecken",en:"Explore destinations",it:"Esplora destinazioni",pl:"Odkryj destynacje",si:"Razišči destinacije"})[dl] || "Explore"} ↓
            </a>
            <a href="/landing" style={{ padding:"15px 28px", borderRadius:14, color:"#fbbf24", fontSize:15, fontWeight:500, textDecoration:"none", fontFamily:F, border:"1px solid rgba(251,191,36,0.3)", background:"rgba(251,191,36,0.06)", minHeight:50, display:"inline-flex", alignItems:"center", gap:8, letterSpacing:0.3, backdropFilter:"blur(8px)" }}>
              ⭐ AI Travel Guardian →
            </a>
          </div>


        </div>
      </section>

      {/* ═══ DESTINATIONS ═══ */}
      <section id="destinations" style={{ padding:"56px 16px 40px", background:"linear-gradient(180deg, #071828 0%, #0a1e36 50%, #071828 100%)" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          <div style={{ textAlign:"center", marginBottom:28 }}>
            <div style={{ fontSize:10, color:"#0ea5e9", letterSpacing:4, fontWeight:700, marginBottom:8 }}>
              {({hr:"ISTRAŽI DESTINACIJE",de:"REISEZIELE ENTDECKEN",en:"EXPLORE DESTINATIONS",it:"ESPLORA DESTINAZIONI"})[dl] || "EXPLORE"}
            </div>
            <h2 style={{ fontFamily:F, fontSize:"clamp(24px,4vw,36px)", fontWeight:400 }}>
              {({hr:"Odaberi regiju",de:"Region wählen",en:"Choose a region",it:"Scegli una regione"})[dl] || ""}
            </h2>
          </div>

          {/* Region cards 2×2 — tap opens region deals sheet */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:14 }}>
            {REGIONS.map((r, i) => (
              <button key={r.id} className="explore-card"
                onClick={() => { setActiveRegion(r.id); setActiveDestId(r.liveCity); }}
                style={{ display:"block", borderRadius:18, overflow:"hidden", position:"relative",
                  height:150, border:"1px solid rgba(255,255,255,0.06)",
                  boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
                  animation:`fadeUp 0.45s ease ${i * 0.07}s both`,
                  cursor:"pointer", background:"none", padding:0, textAlign:"left",
                }}>
                <img src={r.img} alt={r.id} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.9) 0%, rgba(5,13,26,0.3) 100%)" }} />
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 14px" }}>
                  <h3 style={{ fontFamily:F, fontSize:20, fontWeight:400, marginBottom:2, lineHeight:1.1, color:"#fff" }}>{r.id}</h3>
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:300, lineHeight:1.3 }}>{t(r.tagline)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARTNERI & BEST DEALS ═══ */}
      <section style={{ padding:"40px 16px 32px", background:"#050d1a" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          {/* — Naši partneri — */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#f97316", letterSpacing:4, fontWeight:700 }}>NAŠI PARTNERI</div>
              <div style={{ flex:1, height:1, background:"linear-gradient(90deg, rgba(249,115,22,0.2), transparent)" }} />
            </div>
            <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:8, scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch" }}>
              {/* Black Jack */}
              <button onClick={() => { setShowBJ(true); setSelectedMenuItem(null); }} style={{ minWidth:190, height:150, borderRadius:16, overflow:"hidden", position:"relative", flexShrink:0, scrollSnapAlign:"start", border:"1px solid rgba(249,115,22,0.25)", cursor:"pointer", background:"none", padding:0 }}>
                <img src={BJ.img} alt="Black Jack" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(10,22,40,0.94) 0%, rgba(10,22,40,0.3) 100%)" }} />
                <div style={{ position:"absolute", top:10, left:10, padding:"3px 8px", borderRadius:6, background:"rgba(249,115,22,0.18)", border:"1px solid rgba(249,115,22,0.3)", fontSize:8, fontWeight:700, color:"#f97316", letterSpacing:1.5 }}>NAŠI PARTNER</div>
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 12px", textAlign:"left" }}>
                  <div style={{ fontFamily:F, fontSize:18, fontWeight:400, color:"#fff", marginBottom:2 }}>Black Jack</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>{BJ.address}</div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"4px 9px", borderRadius:6, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.3)", fontSize:9, color:"#f97316", fontWeight:700 }}>
                    {({hr:"Pogledaj meni",de:"Menü ansehen",en:"View menu",it:"Vedi menu"})[dl]||"Menu"} →
                  </div>
                </div>
              </button>
              {/* Rab AI Guide */}
              <a href={`/?kiosk=rab&lang=${lang}`} style={{ minWidth:190, height:150, borderRadius:16, overflow:"hidden", position:"relative", flexShrink:0, scrollSnapAlign:"start", textDecoration:"none", color:"#fff", border:"1px solid rgba(251,191,36,0.2)" }}>
                <img src="https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=600&q=75" alt="Rabska Fjera" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.92) 0%, rgba(5,13,26,0.3) 100%)" }} />
                <div style={{ position:"absolute", top:10, left:10, padding:"3px 8px", borderRadius:6, background:"rgba(251,191,36,0.14)", border:"1px solid rgba(251,191,36,0.3)", fontSize:8, fontWeight:700, color:"#fbbf24", letterSpacing:1.5 }}>⚔️ RAB · {FJERA.date}</div>
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 12px" }}>
                  <div style={{ fontFamily:F, fontSize:18, fontWeight:400, marginBottom:2 }}>{t(FJERA.title)}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>{t(FJERA.sub).slice(0,42)}…</div>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"4px 9px", borderRadius:6, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", fontSize:9, color:"#fbbf24", fontWeight:700 }}>
                    AI Guide Rab →
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* — AI Deals from n8n/Firestore — */}
          <DealCards region="all" lang={lang} />

          {/* Viator Shop CTA */}
          <a href="https://vi.me/qku0x" target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderRadius:14, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", textDecoration:"none", marginTop:4 }}>
            <span style={{ fontFamily:"'Outfit',sans-serif", fontSize:13, color:"#22c55e", fontWeight:600 }}>
              {({hr:"Sve aktivnosti na Jadranu →", de:"Alle Aktivitäten auf der Adria →", en:"All Adriatic activities →", it:"Tutte le attività sull'Adriatico →"})[lang] || "Sve aktivnosti na Jadranu →"}
            </span>
            <span style={{ fontSize:18 }}>🎟️</span>
          </a>

        </div>
      </section>

      {/* ═══ REGION DEALS SHEET ═══ */}
      {activeRegion && (() => {
        const rData = REGIONS.find(r => r.id === activeRegion);
        if (!rData) return null;
        const curDest = rData.destinations.find(d => d.id === activeDestId) || rData.destinations[0];
        const affiliates = CITY_AFFILIATES[activeDestId] || CITY_AFFILIATES[rData.liveCity] || [];
        const gygDeals = CITY_GYG[activeDestId] || CITY_GYG[rData.liveCity] || [];
        // Build deals: affiliates first, then GYG, then AI placeholder
        return (
        <div onClick={() => setActiveRegion(null)} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.88)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:600, background:"#0a1628", borderRadius:"24px 24px 0 0", border:`1px solid ${rData.accent}20`, borderBottom:"none", maxHeight:"90dvh", display:"flex", flexDirection:"column", animation:"fadeUp 0.32s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* Header */}
            <div style={{ padding:"20px 20px 0", flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:10, color:rData.accent, letterSpacing:3, fontWeight:700, marginBottom:3 }}>{rData.id.toUpperCase()}</div>
                  <div style={{ fontFamily:F, fontSize:22, fontWeight:400, color:"#f0f4f8" }}>
                    {curDest ? curDest.name : rData.id}
                  </div>
                </div>
                <button onClick={() => setActiveRegion(null)} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", fontSize:15, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
              </div>

              {/* City tabs — photo cards (transit style) */}
              <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:14, scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch" }}>
                {rData.destinations.map(d => {
                  const isActive = activeDestId === d.id;
                  return (
                    <button key={d.id} onClick={() => setActiveDestId(d.id)}
                      style={{ flexShrink:0, scrollSnapAlign:"start", width:90, height:72, borderRadius:14, overflow:"hidden", position:"relative", border:`2px solid ${isActive ? d.accent : "rgba(255,255,255,0.07)"}`, background:"none", padding:0, cursor:"pointer", transition:"all 0.2s", boxShadow: isActive ? `0 0 0 1px ${d.accent}40, 0 4px 16px rgba(0,0,0,0.4)` : "none", transform: isActive ? "scale(1.05)" : "scale(1)" }}>
                      <img src={d.img} alt={d.name} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", inset:0, background: isActive ? `linear-gradient(0deg, rgba(5,13,26,0.82) 0%, rgba(5,13,26,0.25) 100%)` : "linear-gradient(0deg, rgba(5,13,26,0.92) 0%, rgba(5,13,26,0.55) 100%)" }} />
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"0 5px 6px", textAlign:"center" }}>
                        <div style={{ fontSize:10, fontWeight:700, color: isActive ? d.accent : "rgba(255,255,255,0.75)", lineHeight:1.2, fontFamily:B }}>{d.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable deals */}
            <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, padding:"0 20px", paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))" }}>

              {/* ① Naši affiliati — first */}
              {affiliates.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:9, color:"#f97316", letterSpacing:3, fontWeight:700, marginBottom:10 }}>NAŠI PARTNERI</div>
                  <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4, scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch" }}>
                    {affiliates.map(aff => (
                      aff.action === "bj"
                        ? <button key={aff.id} onClick={e => { e.stopPropagation(); setShowBJ(true); setSelectedMenuItem(null); }}
                            style={{ minWidth:180, height:140, borderRadius:14, overflow:"hidden", position:"relative", flexShrink:0, scrollSnapAlign:"start", border:`1px solid ${aff.badgeColor}30`, cursor:"pointer", background:"none", padding:0 }}>
                            <img src={aff.img} alt={aff.name} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(10,22,40,0.95) 0%, rgba(10,22,40,0.3) 100%)" }} />
                            <div style={{ position:"absolute", top:8, left:8, padding:"2px 8px", borderRadius:5, background:`${aff.badgeColor}20`, fontSize:8, fontWeight:700, color:aff.badgeColor, letterSpacing:1.2 }}>{aff.badge}</div>
                            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 12px", textAlign:"left" }}>
                              <div style={{ fontFamily:F, fontSize:17, fontWeight:400, color:"#fff", marginBottom:2 }}>{aff.name}</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>{t(aff.desc)}</div>
                              <div style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:5, background:`${aff.badgeColor}18`, border:`1px solid ${aff.badgeColor}30`, fontSize:9, color:aff.badgeColor, fontWeight:700 }}>{t(aff.cta)} →</div>
                            </div>
                          </button>
                        : <a key={aff.id} href={(aff.link || "#").replace("/?kiosk=rab", `/?kiosk=rab&lang=${lang}`)}
                            style={{ minWidth:180, height:140, borderRadius:14, overflow:"hidden", position:"relative", flexShrink:0, scrollSnapAlign:"start", textDecoration:"none", color:"#fff", border:`1px solid ${aff.badgeColor}30`, display:"block" }}>
                            <img src={aff.img} alt={aff.name} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                            <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.95) 0%, rgba(5,13,26,0.3) 100%)" }} />
                            <div style={{ position:"absolute", top:8, left:8, padding:"2px 8px", borderRadius:5, background:`${aff.badgeColor}20`, fontSize:8, fontWeight:700, color:aff.badgeColor, letterSpacing:1.2 }}>{aff.badge}</div>
                            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 12px" }}>
                              <div style={{ fontFamily:F, fontSize:17, fontWeight:400, marginBottom:2 }}>{aff.name}</div>
                              <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:6 }}>{t(aff.desc)}</div>
                              <div style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:5, background:`${aff.badgeColor}18`, border:`1px solid ${aff.badgeColor}30`, fontSize:9, color:aff.badgeColor, fontWeight:700 }}>{t(aff.cta)} →</div>
                            </div>
                          </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ② GYG */}
              {gygDeals.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:9, color:"#22c55e", letterSpacing:3, fontWeight:700, marginBottom:10 }}>GETYOURGUIDE</div>
                  <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4, scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch" }}>
                    {gygDeals.map((o, i) => o.gygId ? (
                      /* GYG official widget — loads real activity image, price & rating */
                      <div key={i} style={{ minWidth:200, flexShrink:0, scrollSnapAlign:"start", borderRadius:14, overflow:"hidden", border:"1px solid rgba(34,197,94,0.15)" }}>
                        <div data-gyg-widget="auto" data-gyg-partner-id="9OEGOYI" data-gyg-cmp={o.gygId} />
                      </div>
                    ) : (
                      /* Static card fallback for activities without a specific widget ID */
                      <a key={i} href={o.link} target="_blank" rel="noopener noreferrer"
                        style={{ minWidth:180, height:140, borderRadius:14, overflow:"hidden", position:"relative", flexShrink:0, scrollSnapAlign:"start", textDecoration:"none", color:"#fff", border:"1px solid rgba(34,197,94,0.15)", display:"block" }}>
                        <img src={o.img} alt={t(o.title)} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.93) 0%, rgba(5,13,26,0.2) 65%)" }} />
                        <div style={{ position:"absolute", top:8, left:8, padding:"2px 7px", borderRadius:5, background:"rgba(34,197,94,0.18)", fontSize:8, fontWeight:700, color:"#22c55e", letterSpacing:1 }}>GYG</div>
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px 10px" }}>
                          <div style={{ fontSize:12, fontWeight:600, lineHeight:1.3, marginBottom:3 }}>{t(o.title)}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>{o.price}</span>
                            {o.rating && <span style={{ fontSize:10, color:"#facc15" }}>★ {o.rating}</span>}
                            {o.reviews && <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>({Number(o.reviews).toLocaleString()})</span>}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ③ AI Deals — live from n8n/Firestore (Viator + partners) */}
              <DealCards region={CITY_TO_FS[activeDestId] || CITY_TO_FS[rData.liveCity] || rData.liveCity} lang={lang} maxCards={4} />

            </div>

            {/* Sticky CTA — Open AI guide */}
            <div style={{ padding:"14px 20px", paddingBottom:"calc(14px + env(safe-area-inset-bottom, 0px))", borderTop:"1px solid rgba(255,255,255,0.05)", flexShrink:0, background:"#0a1628" }}>
              <a href={`/?kiosk=${activeDestId || rData.liveCity}&lang=${lang}`}
                style={{ display:"block", padding:"14px", borderRadius:14, background:`linear-gradient(135deg,${rData.accent},${rData.accent}cc)`, color:"#050d1a", fontSize:14, fontWeight:700, textDecoration:"none", textAlign:"center", boxShadow:`0 4px 20px ${rData.accent}30`, minHeight:48, lineHeight:"20px" }}>
                {({hr:"Otvori AI vodič za",de:"KI-Guide öffnen für",en:"Open AI guide for",it:"Apri guida AI per"})[dl]||"Open AI guide for"} {curDest?.name || rData.id} →
              </a>
            </div>

          </div>
        </div>
        );
      })()}

      {/* ═══ BLACK JACK MODAL ═══ */}
      {showBJ && (
        <div onClick={() => { setShowBJ(false); setSelectedMenuItem(null); }} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, maxHeight:"90dvh", background:"#0a1628", borderRadius:"24px 24px 0 0", border:"1px solid rgba(249,115,22,0.15)", borderBottom:"none", overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* Header photo */}
            <div style={{ position:"relative", height:160, flexShrink:0 }}>
              <img src={BJ.img} alt="Black Jack" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, #0a1628 0%, rgba(10,22,40,0.6) 60%, rgba(10,22,40,0.2) 100%)" }} />
              <button onClick={() => { setShowBJ(false); setSelectedMenuItem(null); }} style={{ position:"absolute", top:14, right:14, width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", fontSize:16, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
              <div style={{ position:"absolute", top:14, left:14, padding:"4px 10px", borderRadius:8, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.25)", fontSize:9, fontWeight:700, color:"#f97316", letterSpacing:1.5 }}>PARTNER • RAB</div>
              <div style={{ position:"absolute", bottom:14, left:18 }}>
                <div style={{ fontFamily:F, fontSize:26, fontWeight:400 }}>Black Jack</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", marginTop:2 }}>{BJ.address}</div>
              </div>
            </div>

            {/* Info row */}
            <div style={{ display:"flex", gap:16, padding:"12px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0 }}>
              <div style={{ fontSize:11, color:"#64748b" }}>🕐 {t(BJ.hours)}</div>
              <div style={{ fontSize:11, color:"#64748b" }}>📞 {BJ.phone}</div>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, paddingBottom:"env(safe-area-inset-bottom, 16px)" }}>

              {/* Menu sections */}
              {BJ.menu.map((sec, si) => (
                <div key={si} style={{ padding:"16px 18px 0" }}>
                  <div style={{ fontSize:10, color:"#f97316", letterSpacing:3, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>{t(sec.section)}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
                    {sec.items.map(item => {
                      const isOpen = selectedMenuItem === item.id;
                      return (
                        <div key={item.id} onClick={() => setSelectedMenuItem(isOpen ? null : item.id)} style={{ borderRadius:14, border:`1px solid ${isOpen ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.05)"}`, background: isOpen ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.02)", cursor:"pointer", overflow:"hidden", transition:"all 0.2s" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>
                            <span style={{ fontSize:22, flexShrink:0 }}>{item.emoji}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t(item.name)}</div>
                              {!isOpen && <div style={{ fontSize:11, color:"#475569", marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t(item.desc)}</div>}
                            </div>
                            <div style={{ flexShrink:0, textAlign:"right" }}>
                              <div style={{ fontSize:16, fontWeight:700, color:"#22c55e", fontFamily:F }}>{item.price}€</div>
                              <div style={{ fontSize:9, color:"#334155", marginTop:1 }}>{isOpen ? "▲" : "▼"}</div>
                            </div>
                          </div>
                          {isOpen && (
                            <div style={{ padding:"0 14px 14px 48px", fontSize:13, color:"#94a3b8", lineHeight:1.7, borderTop:"1px solid rgba(255,255,255,0.04)", paddingTop:10, marginLeft:0 }}>
                              {t(item.desc)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Nearby */}
              <div style={{ padding:"16px 18px 0" }}>
                <div style={{ fontSize:10, color:"#0ea5e9", letterSpacing:3, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>
                  {({hr:"Mjesta u blizini",de:"In der Nähe",en:"Nearby",it:"Nelle vicinanze"})[dl]||"Nearby"}
                </div>
                <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:8, scrollSnapType:"x mandatory" }}>
                  {BJ.nearby.map(n => (
                    <a key={n.id} href={n.link.replace("lang=de", `lang=${lang}`)} onClick={e => e.stopPropagation()} style={{ minWidth:130, borderRadius:14, border:"1px solid rgba(14,165,233,0.1)", background:"rgba(14,165,233,0.03)", padding:"12px 12px 10px", textDecoration:"none", color:"#f0f4f8", scrollSnapAlign:"start", flexShrink:0, transition:"all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.background = "rgba(14,165,233,0.07)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.1)"; e.currentTarget.style.background = "rgba(14,165,233,0.03)"; }}>
                      <div style={{ fontSize:20, marginBottom:6 }}>{n.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:600, marginBottom:2, lineHeight:1.3 }}>{t(n.name)}</div>
                      <div style={{ fontSize:10, color:"#38bdf8", marginBottom:2 }}>{n.dist}</div>
                      <div style={{ fontSize:9, color:"#334155" }}>{t(n.tag)}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ padding:"16px 18px 20px" }}>
                <a href={BJ.link} style={{ display:"block", padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", textAlign:"center", boxShadow:"0 4px 20px rgba(249,115,22,0.3)", minHeight:48, lineHeight:"20px" }}>
                  {({hr:"Otvori AI vodič za Rab →",de:"KI-Guide für Rab öffnen →",en:"Open AI guide for Rab →",it:"Apri guida AI per Rab →"})[dl]||"Open AI guide →"}
                </a>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:"28px 20px", paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))", textAlign:"center", background:"#030810", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize:10, color:"#1e293b", letterSpacing:0.5 }}>© 2026 SIAL Consulting d.o.o. · jadran.ai</div>
      </footer>

      {/* ═══ LIVE OVERLAY — context-aware ═══ */}
      {showLive && (() => {
        const liveTarget = activeDest
          ? activeDest.name
          : activeRegionData
            ? (activeRegionData.liveCity === "rab" ? "Rab" : activeRegionData.destinations.find(d => d.id === activeRegionData.liveCity)?.name || activeRegionData.id)
            : "Jadran";
        const liveImg = activeDest
          ? activeDest.img
          : (activeRegionData?.img || SENSE[0].img);
        return (
        <div onClick={() => setShowLive(false)} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.88)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, background:"#0a1628", borderRadius:"24px 24px 0 0", border:"1px solid rgba(34,197,94,0.18)", borderBottom:"none", overflow:"hidden", animation:"fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
            {/* Hero image strip */}
            <div style={{ position:"relative", height:90, overflow:"hidden" }}>
              <img src={liveImg.replace("w=800","w=600")} alt={liveTarget} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.4 }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, #0a1628 0%, rgba(10,22,40,0.5) 100%)" }} />
              <div style={{ position:"absolute", bottom:12, left:18, display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 10px #22c55e", animation:"pulse 2s infinite", flexShrink:0 }} />
                <span style={{ fontSize:11, color:"#22c55e", fontWeight:700, letterSpacing:2 }}>JADRAN SENSE™</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>· {liveTarget}</span>
              </div>
              <button onClick={() => setShowLive(false)} style={{ position:"absolute", top:12, right:14, width:28, height:28, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"none", color:"#64748b", fontSize:14, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
            </div>
            <div style={{ padding:"16px 18px", paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {SENSE.map((s,i) => (
                  <div key={i} style={{ borderRadius:14, overflow:"hidden", position:"relative", height:108, border:"1px solid rgba(14,165,233,0.1)" }}>
                    <img src={s.img} alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.18 }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.94) 0%, rgba(5,13,26,0.5) 100%)" }} />
                    <div style={{ position:"relative", padding:"12px 10px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                      <div style={{ fontSize:12, fontWeight:600, color:"#e2e8f0", marginBottom:2 }}>{t(s.l)}</div>
                      <div style={{ fontSize:9, color:"#64748b", lineHeight:1.4 }}>{t(s.v)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {liveTarget === "Rab" && (
                <a href={`/?kiosk=rab&go=live&lang=${lang}`} style={{ display:"block", marginTop:12, padding:"12px", borderRadius:12, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.18)", textAlign:"center", textDecoration:"none", color:"#22c55e", fontSize:12, fontWeight:600 }}>
                  {({hr:"Otvori live Rab →",de:"Live Rab öffnen →",en:"Open live Rab →",it:"Apri live Rab →"})[dl]||"Open live →"}
                </a>
              )}
              <div style={{ marginTop:12, fontSize:9, color:"#1e3a5f", textAlign:"center" }}>
                165+ {({hr:"senzorskih točaka · Jadran.ai",de:"Sensorpunkte · Jadran.ai",en:"sensor points · Jadran.ai",it:"punti sensoriali · Jadran.ai"})[dl]||"sensor points"}
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ LANG PICKER OVERLAY ═══ */}
      {langOpen && (
        <div onClick={() => setLangOpen(false)} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, background:"#0a1628", borderRadius:"24px 24px 0 0", border:"1px solid rgba(255,255,255,0.08)", borderBottom:"none", padding:"24px 20px", paddingBottom:"calc(24px + env(safe-area-inset-bottom, 0px))", animation:"fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:2, marginBottom:16, textTransform:"uppercase" }}>
              {({hr:"Odaberi jezik",de:"Sprache wählen",en:"Choose language",it:"Scegli lingua",pl:"Wybierz język",si:"Izberi jezik"})[dl]||"Language"}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8 }}>
              {Object.entries(FLAGS).map(([k,v]) => (
                <button key={k} onClick={() => { setLang(k); setLangOpen(false); }} style={{ padding:"14px 8px", borderRadius:14, border:`1px solid ${lang===k ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.06)"}`, background: lang===k ? "rgba(14,165,233,0.1)" : "rgba(255,255,255,0.02)", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:24 }}>{v}</span>
                  <span style={{ fontSize:9, color: lang===k ? "#7dd3fc" : "#475569", fontWeight:600, letterSpacing:0.5 }}>{k.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STICKY BOTTOM BAR ═══ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, paddingBottom:"env(safe-area-inset-bottom, 0px)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", background:"rgba(5,8,16,0.96)", backdropFilter:"blur(24px) saturate(2)", WebkitBackdropFilter:"blur(24px) saturate(2)", borderTop:"1px solid rgba(14,165,233,0.12)", boxShadow:"0 -8px 32px rgba(0,0,0,0.4)" }}>
          {[
            { id:"explore", icon:"🗺️", label:{hr:"Istraži",de:"Erkunden",en:"Explore",it:"Esplora",pl:"Odkryj",si:"Razišči"}, action: () => { setActiveTab("explore"); document.getElementById("destinations")?.scrollIntoView({behavior:"smooth"}); } },
            { id:"go",      icon:"✈️", label:{hr:"Kreni",de:"Los",en:"Go",it:"Vai",pl:"Jedź",si:"Pojdi"}, href:"/landing" },
            { id:"live",    icon:"🌊", label:{hr:"Live",de:"Live",en:"Live",it:"Live",pl:"Live",si:"Živo"}, action: () => { setActiveTab("live"); setShowLive(true); } },
            { id:"lang",    icon: FLAGS[lang]||"🌐", label:{hr:"Jezik",de:"Sprache",en:"Lang",it:"Lingua",pl:"Język",si:"Jezik"}, action: () => { setActiveTab("lang"); setLangOpen(true); } },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const inner = (
              <>
                <span style={{ fontSize:22, lineHeight:1 }}>{tab.icon}</span>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:0.3, color: isActive ? "#7dd3fc" : "#475569", marginTop:4 }}>{t(tab.label)}</span>
                {isActive && <div style={{ position:"absolute", top:0, left:"25%", right:"25%", height:2, borderRadius:2, background:"linear-gradient(90deg,#0ea5e9,#38bdf8)" }} />}
              </>
            );
            return tab.href
              ? <a key={tab.id} href={tab.href} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 4px 10px", textDecoration:"none", color:"inherit", position:"relative", minHeight:60 }}>{inner}</a>
              : <button key={tab.id} onClick={tab.action} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 4px 10px", background:"none", border:"none", cursor:"pointer", fontFamily:B, color:"inherit", position:"relative", minHeight:60 }}>{inner}</button>;
          })}
        </div>
      </div>
    </div>
  );
}
