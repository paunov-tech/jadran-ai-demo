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
    id:"Istra", img:"https://images.unsplash.com/photo-1747339664027-4d18dc50c905?w=800&q=80", accent:"#fb923c", liveCity:"rovinj",
    tagline:{ hr:"Tartufi, vino i rimska arena", de:"Trüffel, Wein und römische Arena", en:"Truffles, wine and Roman arena", it:"Tartufi, vino e arena romana" },
    destinations:[
      { id:"rovinj",   name:"Rovinj",   accent:"#fb923c", img:"https://images.unsplash.com/photo-1563974514898-7aea295e12fa?w=600&q=75",           tagline:{hr:"Najromantičniji grad",de:"Romantischste Stadt",en:"Most romantic town",it:"Città più romantica"} },
      { id:"pula",     name:"Pula",     accent:"#34d399", img:"https://images.unsplash.com/photo-1747339664027-4d18dc50c905?w=600&q=75",           tagline:{hr:"Rimska arena živi",de:"Die Arena lebt",en:"Roman Arena lives on",it:"L'Arena Romana vive"} },
      { id:"porec",    name:"Poreč",    accent:"#fbbf24", img:"https://images.unsplash.com/photo-1631972962625-92a133f56347?w=600&q=75", tagline:{hr:"Eufrazijeva bazilika",de:"Euphrasius-Basilika",en:"Euphrasian Basilica",it:"Basilica Eufrasiana"} },
      { id:"novigrad", name:"Novigrad", accent:"#06b6d4", img:"https://images.unsplash.com/photo-1542571539-183913214de8?w=600&q=75", tagline:{hr:"Ribarska idila",de:"Fischeridyll",en:"Fisherman's idyll",it:"Idillio da pescatore"} },
      { id:"motovun",  name:"Motovun",  accent:"#a3e635", img:"https://images.unsplash.com/photo-1636792557657-c46988334042?w=600&q=75", tagline:{hr:"Grad tartufa",de:"Trüffelstadt",en:"Truffle town",it:"Città dei tartufi"} },
      { id:"labin",    name:"Labin",    accent:"#f472b6", img:"https://images.unsplash.com/photo-1475776408506-9a5371e7a068?w=600&q=75", tagline:{hr:"Istarski balkon",de:"Istrianischer Balkon",en:"Istrian balcony",it:"Balcone dell'Istria"} },
    ]
  },
  {
    id:"Kvarner", img:"https://images.unsplash.com/photo-1539601591461-2a5e0edb6915?w=800&q=80", accent:"#0ea5e9", liveCity:"rab",
    tagline:{ hr:"Otoci, fjordovi i wellness", de:"Inseln, Fjorde und Wellness", en:"Islands, fjords and wellness", it:"Isole, fiordi e benessere" },
    destinations:[
      { id:"rab",     name:"Rab",     accent:"#fbbf24", img:"https://images.unsplash.com/photo-1539601591461-2a5e0edb6915?w=600&q=75",           tagline:{hr:"Otok četiri zvonika",de:"Insel der vier Türme",en:"Island of four bell towers",it:"Isola dei quattro campanili"} },
      { id:"opatija", name:"Opatija", accent:"#06b6d4", img:"https://images.unsplash.com/photo-1576675453529-fa14f891f238?w=600&q=75", tagline:{hr:"Elegancija Kvarnera",de:"Eleganz des Kvarners",en:"Kvarner elegance",it:"Eleganza del Quarnero"} },
      { id:"krk",     name:"Krk",     accent:"#22c55e", img:"https://images.unsplash.com/photo-1554155845-440a0ec58d3b?w=600&q=75", tagline:{hr:"Kruna Kvarnera",de:"Krone des Kvarners",en:"Crown of the Kvarner",it:"Corona del Quarnero"} },
      { id:"cres",    name:"Cres",    accent:"#84cc16", img:"https://images.unsplash.com/photo-1641823290680-9db60b43a026?w=600&q=75", tagline:{hr:"Divlja priroda",de:"Wilde Natur",en:"Wild nature",it:"Natura selvaggia"} },
      { id:"losinj",  name:"Lošinj",  accent:"#38bdf8", img:"https://images.unsplash.com/photo-1539257419621-1672658884a7?w=600&q=75", tagline:{hr:"Otok vitalnosti",de:"Insel der Vitalität",en:"Island of vitality",it:"Isola della vitalità"} },
      { id:"rijeka",  name:"Rijeka",  accent:"#c084fc", img:"https://images.unsplash.com/photo-1654969936668-e8a5532aa1c7?w=600&q=75", tagline:{hr:"Luka i kultura",de:"Hafen und Kultur",en:"Port and culture",it:"Porto e cultura"} },
    ]
  },
  {
    id:"Dalmacija", img:"https://images.unsplash.com/photo-1555990538-c48ab0a194b5?w=800&q=80", accent:"#38bdf8", liveCity:"split",
    tagline:{ hr:"Antički gradovi i kristalno more", de:"Antike Städte und kristallklares Meer", en:"Ancient towns and crystal-clear sea", it:"Città antiche e mare cristallino" },
    destinations:[
      { id:"dubrovnik", name:"Dubrovnik", accent:"#f97316", img:"https://images.unsplash.com/photo-1754817033060-1bc427e6bea2?w=600&q=75",  tagline:{hr:"Biser Jadrana",de:"Perle der Adria",en:"Pearl of the Adriatic",it:"Perla dell'Adriatico"} },
      { id:"split",     name:"Split",     accent:"#0ea5e9", img:"https://images.unsplash.com/photo-1555990538-c48ab0a194b5?w=600&q=75", tagline:{hr:"Dioklecijanova palača",de:"Diokletianpalast",en:"Diocletian's Palace",it:"Palazzo di Diocleziano"} },
      { id:"zadar",     name:"Zadar",     accent:"#f59e0b", img:"https://images.unsplash.com/photo-1661762332723-e5e5d07e702e?w=600&q=75", tagline:{hr:"Najljepši zalazak",de:"Schönster Sonnenuntergang",en:"Most beautiful sunset",it:"Tramonto più bello"} },
      { id:"sibenik",   name:"Šibenik",   accent:"#a78bfa", img:"https://images.unsplash.com/photo-1628615875885-05b0c905d605?w=600&q=75", tagline:{hr:"UNESCO katedrale",de:"UNESCO-Kathedralen",en:"UNESCO cathedrals",it:"Cattedrali UNESCO"} },
      { id:"trogir",    name:"Trogir",    accent:"#fb923c", img:"https://images.unsplash.com/photo-1690573460456-a391616cc9c8?w=600&q=75", tagline:{hr:"Otok-grad UNESCO",de:"Inselstadt UNESCO",en:"Island-city UNESCO",it:"Città-isola UNESCO"} },
      { id:"makarska",  name:"Makarska",  accent:"#38bdf8", img:"https://images.unsplash.com/photo-1507301409852-188e6770a8db?w=600&q=75", tagline:{hr:"Rivijera iz snova",de:"Traumriviera",en:"Dream riviera",it:"Riviera dei sogni"} },
    ]
  },
  {
    id:"Otoci", img:"https://images.unsplash.com/photo-1596182325210-a4f1c8943166?w=800&q=80", accent:"#a78bfa", liveCity:"rab",
    tagline:{ hr:"Lavanda, glamur i čiste plaže", de:"Lavendel, Glamour und saubere Strände", en:"Lavender, glamour and pristine beaches", it:"Lavanda, glamour e spiagge incontaminate" },
    destinations:[
      { id:"rab",     name:"Rab",     accent:"#fbbf24", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&q=75",           tagline:{hr:"Četiri zvonika · čiste plaže",de:"Vier Türme · saubere Strände",en:"Four towers · pristine beaches",it:"Quattro campanili · spiagge incontaminate"} },
      { id:"hvar",    name:"Hvar",    accent:"#a78bfa", img:"https://images.unsplash.com/photo-1596182325210-a4f1c8943166?w=600&q=75",           tagline:{hr:"Lavanda i glamur",de:"Lavendel und Glamour",en:"Lavender and glamour",it:"Lavanda e glamour"} },
      { id:"brac",    name:"Brač",    accent:"#fbbf24", img:"https://images.unsplash.com/photo-1537353825146-9f2f61475590?w=600&q=75", tagline:{hr:"Zlatni rat i mramor",de:"Goldenes Horn & Marmor",en:"Golden Horn & marble",it:"Corno d'oro e marmo"} },
      { id:"korcula", name:"Korčula", accent:"#22c55e", img:"https://images.unsplash.com/photo-1534164170090-9380bb74c2aa?w=600&q=75", tagline:{hr:"Rodni grad Marka Pola",de:"Geburtsort Marco Polos",en:"Marco Polo's birthplace",it:"Città natale di Marco Polo"} },
      { id:"vis",     name:"Vis",     accent:"#38bdf8", img:"https://images.unsplash.com/photo-1616709699425-b1bc33538714?w=600&q=75", tagline:{hr:"Autentični daleki otok",de:"Authentische ferne Insel",en:"Authentic far island",it:"Isola lontana autentica"} },
      { id:"mljet",   name:"Mljet",   accent:"#34d399", img:"https://images.unsplash.com/photo-1554585343-acd99e31977b?w=600&q=75", tagline:{hr:"Nacionalni park · jezera",de:"Nationalpark · Seen",en:"National park · lakes",it:"Parco nazionale · laghi"} },
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
  { n:"8",     l:{hr:"Jezika",de:"Sprachen",en:"Languages",it:"Lingue",pl:"Języków",si:"Jezikov"} },
  { n:"7",     l:{hr:"Regija",de:"Regionen",en:"Regions",it:"Regioni",pl:"Regionów",si:"Regij"} },
  { n:"24/7",  l:{hr:"AI vodič",de:"KI-Guide",en:"AI guide",it:"Guida AI",pl:"Przewodnik AI",si:"AI vodič"} },
];

// ─── SENSE — image-driven, no emoji ───
const SENSE = [
  { img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60", l:{hr:"Plaže uživo",de:"Live-Strände",en:"Live beaches",it:"Spiagge live",pl:"Plaże na żywo",si:"Plaže v živo"}, v:{hr:"Popunjenost · Stanje mora",de:"Auslastung · Meerzustand",en:"Occupancy · Sea conditions",it:"Occupazione · Condizioni mare",pl:"Obłożenie · Stan morza",si:"Zasedenost · Stanje morja"} },
  { img:"https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&q=60", l:{hr:"Parking uživo",de:"Live Parken",en:"Live parking",it:"Parcheggio live",pl:"Parking na żywo",si:"Parking v živo"}, v:{hr:"Slobodna mjesta · Cijene",de:"Freie Plätze · Preise",en:"Free spots · Prices",it:"Posti liberi · Prezzi",pl:"Wolne miejsca · Ceny",si:"Prosta mesta · Cene"} },
  { img:"https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=200&q=60", l:{hr:"Marine i vezovi",de:"Marinas & Liegeplätze",en:"Marinas & berths",it:"Marine e ormeggi",pl:"Mariny i miejsca cumowania",si:"Marine in privezi"}, v:{hr:"Slobodni vezovi · Uvjeti",de:"Freie Liegeplätze · Bedingungen",en:"Free berths · Conditions",it:"Posti liberi · Condizioni",pl:"Wolne miejsca · Warunki",si:"Prosti privezi · Pogoji"} },
  { img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&q=60", l:{hr:"Vrijeme i more",de:"Wetter & Meer",en:"Weather & sea",it:"Meteo e mare",pl:"Pogoda i morze",si:"Vreme in morje"}, v:{hr:"UV · Temperatura · Vjetar",de:"UV · Temperatur · Wind",en:"UV · Temperature · Wind",it:"UV · Temperatura · Vento",pl:"UV · Temperatura · Wiatr",si:"UV · Temperatura · Veter"} },
];

// ─── LIVE — nearest Adriatic city by GPS ───
const ADRIATIC_CITIES = [
  {name:"Dubrovnik", lat:42.65,lon:18.09},{name:"Cavtat",  lat:42.58,lon:18.22},
  {name:"Korčula",   lat:42.96,lon:17.13},{name:"Hvar",    lat:43.17,lon:16.44},
  {name:"Split",     lat:43.51,lon:16.44},{name:"Trogir",  lat:43.52,lon:16.25},
  {name:"Makarska",  lat:43.30,lon:17.02},{name:"Brela",   lat:43.37,lon:16.93},
  {name:"Tučepi",    lat:43.27,lon:17.06},{name:"Primošten",lat:43.58,lon:15.92},
  {name:"Šibenik",   lat:43.73,lon:15.89},{name:"Vodice",  lat:43.76,lon:15.78},
  {name:"Zadar",     lat:44.12,lon:15.23},{name:"Nin",     lat:44.24,lon:15.18},
  {name:"Biograd",   lat:43.94,lon:15.45},{name:"Pag",     lat:44.44,lon:15.06},
  {name:"Rab",       lat:44.75,lon:14.76},{name:"Senj",    lat:44.99,lon:14.91},
  {name:"Krk",       lat:45.03,lon:14.57},{name:"Cres",    lat:44.96,lon:14.41},
  {name:"Lošinj",    lat:44.53,lon:14.47},{name:"Opatija", lat:45.34,lon:14.31},
  {name:"Rijeka",    lat:45.33,lon:14.44},{name:"Poreč",   lat:45.23,lon:13.60},
  {name:"Rovinj",    lat:45.08,lon:13.64},{name:"Pula",    lat:44.87,lon:13.85},
  {name:"Novigrad",  lat:45.32,lon:13.56},{name:"Motovun", lat:45.34,lon:13.83},
];
function nearestCity(lat, lon) {
  return ADRIATIC_CITIES.reduce((b, c) => {
    const d = Math.hypot(c.lat - lat, c.lon - lon);
    return d < b.d ? {d, name:c.name} : b;
  }, {d:Infinity, name:"Jadran"}).name;
}
function windDirStr(deg) {
  return ["N","NE","E","SE","S","SW","W","NW"][Math.round((deg||0)/45)%8];
}
function wxEmoji(code) {
  if (code == null) return "🌤️";
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 49) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}

// ─── GYG OFFERS — GetYourGuide affiliate ───
const GYG_OFFERS = [
  { title:{hr:"Tura brodom — Rab",de:"Bootstour — Rab",en:"Boat tour — Rab",it:"Tour in barca — Rab"}, price:"45€", tag:"RAB", img:"https://images.unsplash.com/photo-1592486882552-9c2a022c529b?w=400&q=75", link:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour" },
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
  makarska: [{ title:{hr:"Izlet na Biokovo",de:"Ausflug auf Biokovo",en:"Biokovo excursion",it:"Escursione Biokovo"}, price:"35€", img:"https://images.unsplash.com/photo-1573599852326?w=400&q=75", link:"https://www.getyourguide.com/makarska-l4150/?partner_id=9OEGOYI&q=biokovo" }],
  zadar:    [{ title:{hr:"Krka & Šibenik vodopadi",de:"Krka & Šibenik Wasserfälle",en:"Krka & Šibenik waterfalls",it:"Cascate Krka & Šibenik"}, price:"55€", img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=75", link:"https://www.getyourguide.com/zadar-l4157/?partner_id=9OEGOYI&q=krka" }],
  pula:     [{ title:{hr:"Tura rimske arene — Pula",de:"Führung Röm. Arena — Pula",en:"Roman Arena tour — Pula",it:"Tour Arena Romana — Pola"}, price:"20€", img:"https://images.unsplash.com/photo-1592486882552-9c2a022c529b?w=400&q=75", link:"https://www.getyourguide.com/pula-l4161/?partner_id=9OEGOYI&q=arena" }],
  opatija:  [{ title:{hr:"Šetnja Lungomare & SPA",de:"Lungomare-Spaziergang & SPA",en:"Lungomare walk & SPA",it:"Passeggiata Lungomare & SPA"}, price:"30€", img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=75", link:"https://www.getyourguide.com/opatija-l4163/?partner_id=9OEGOYI&q=spa" }],
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
  { id:"dubrovnik", name:"Dubrovnik", img:"https://images.unsplash.com/photo-1754817033060-1bc427e6bea2?w=1400&q=85" },
  { id:"rab",       name:"Rab",       img:"https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=1400&q=85" },
  { id:"rovinj",    name:"Rovinj",    img:"https://images.unsplash.com/photo-1563974514898-7aea295e12fa?w=1400&q=85" },
  { id:"hvar",      name:"Hvar",      img:"https://images.unsplash.com/photo-1596182325210-a4f1c8943166?w=1400&q=85" },
  { id:"split",     name:"Split",     img:"https://images.unsplash.com/photo-1555990538-c48ab0a194b5?w=1400&q=85" },
  { id:"zadar",     name:"Zadar",     img:"https://images.unsplash.com/photo-1661762332723-e5e5d07e702e?w=1400&q=85" },
];

const FLAGS = { hr:"🇭🇷", de:"🇩🇪", at:"🇦🇹", en:"🇬🇧", it:"🇮🇹", pl:"🇵🇱", si:"🇸🇮" };

// ─── BLACK JACK MENU DATA ───
const BJ = {
  img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  address: "Palit 315, Rab · 200m od plaže",
  hours: { hr:"Pon–Ned 12:00–23:00", de:"Mo–So 12:00–23:00", en:"Mon–Sun 12:00–23:00", it:"Lun–Dom 12:00–23:00" },
  phone: "+385 51 724 522",
  whatsapp: "38551724522",
  rating: 4.7,
  reviewCount: 127,
  link: "/?kiosk=rab&affiliate=blackjack&tk=sial2026",
  gallery: [
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=75",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=75",
    "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=500&q=75",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=75",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=75",
  ],
  testimonials: [
    { name:"Klaus M.", flag:"🇩🇪", rating:5, text:{ hr:"Najbolji steak na otoku! Terasa s pogledom na more je fantastična.", de:"Das beste Steak auf der Insel! Die Terrasse mit Meerblick ist einfach traumhaft.", en:"Best steak on the island! The sea-view terrace is simply dreamy.", it:"La migliore bistecca sull'isola! La terrazza è semplicemente meravigliosa." } },
    { name:"Sarah B.", flag:"🇬🇧", rating:5, text:{ hr:"Fantastične pizze i prijazno osoblje. Ćevapi s dimljenim sirom su apsolutno obavezni!", de:"Fantastische Pizzen und freundliches Personal. Der Ćevapi mit Räucherkäse ist ein Muss!", en:"Fantastic pizzas and friendly staff. The ćevapi with smoked cheese is an absolute must!", it:"Pizze fantastiche e personale gentile. Il ćevapi con formaggio affumicato è un must!" } },
    { name:"Marta K.", flag:"🇵🇱", rating:5, text:{ hr:"Savršena ljetna večer — riblje jelo je bilo izvrsno. Ugodna i autentična.", de:"Perfekter Urlaubsabend — die Fischplatte war köstlich. Gemütlich und authentisch.", en:"Perfect holiday evening — the seafood was delicious. Cosy and authentically Croatian.", it:"Serata perfetta — il pesce era delizioso. Accogliente e autenticamente croata." } },
  ],
  dailySpecials: [
    { day:0, emoji:"🥩", hr:"Nedjeljna goveđa plata (za 2)", de:"Sonntagsrinderplatte (für 2)", en:"Sunday beef platter (for 2)", it:"Piatto di manzo domenicale", price:32 },
    { day:1, emoji:"🐟", hr:"Riba dana s prilogom", de:"Fisch des Tages mit Beilage", en:"Fish of the day with side", it:"Pesce del giorno con contorno", price:19 },
    { day:2, emoji:"🍕", hr:"Pizza + salata + piće = 15€", de:"Pizza + Salat + Getränk = 15€", en:"Pizza + salad + drink = 15€", it:"Pizza + insalata + bevanda = 15€", price:15 },
    { day:3, emoji:"🐙", hr:"Pečena hobotnica + crni rižot", de:"Gebackener Krake + schwarzes Risotto", en:"Baked octopus + black risotto", it:"Polpo al forno + risotto nero", price:24 },
    { day:4, emoji:"🌭", hr:"Ćevapi večer — 10 kom + prilog", de:"Ćevapi-Abend — 10 Stk + Beilage", en:"Ćevapi night — 10 pcs + side", it:"Serata ćevapi — 10 pz + contorno", price:18 },
    { day:5, emoji:"🦞", hr:"Jadranski tanjur za 2 — sve iz mora", de:"Adriatischer Teller für 2 — alles aus dem Meer", en:"Adriatic platter for 2 — all from the sea", it:"Piatto adriatico x2 — tutto dal mare", price:38 },
    { day:6, emoji:"🔥", hr:"Subotnji roštilj mješano (za 2)", de:"Samstag-Grillplatte (für 2)", en:"Saturday BBQ mixed grill (for 2)", it:"Grigliata mista del sabato", price:36 },
  ],
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
  rooms: [
    { id:"studio", emoji:"🛏️", name:{ hr:"Studio apartman", de:"Studio-Apartment", en:"Studio apartment", it:"Studio appartamento" }, guests:2, beds:1, sqm:22, img:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=75", view:{ hr:"Pogled na vrt", de:"Gartenblick", en:"Garden view", it:"Vista giardino" }, priceFrom:65, amen:{ hr:"❄️ Klima · 📶 WiFi · 🍳 Kuhinja · 🅿️ Parking", de:"❄️ Klima · 📶 WLAN · 🍳 Küche · 🅿️ Parkplatz", en:"❄️ A/C · 📶 WiFi · 🍳 Kitchen · 🅿️ Parking", it:"❄️ Aria · 📶 WiFi · 🍳 Cucina · 🅿️ Parcheggio" } },
    { id:"apt_a", emoji:"🏠", name:{ hr:"Apartman A · 4 osobe", de:"Apartment A · 4 Pers.", en:"Apartment A · 4 guests", it:"App. A · 4 persone" }, guests:4, beds:2, sqm:42, img:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=75", view:{ hr:"Pogled na more", de:"Meerblick", en:"Sea view", it:"Vista mare" }, priceFrom:95, amen:{ hr:"❄️ Klima · 📶 WiFi · 🍳 Kuhinja · 🌅 Pogled na more · 🅿️ Parking", de:"❄️ Klima · 📶 WLAN · 🍳 Küche · 🌅 Meerblick · 🅿️ Parkplatz", en:"❄️ A/C · 📶 WiFi · 🍳 Kitchen · 🌅 Sea view · 🅿️ Parking", it:"❄️ Aria · 📶 WiFi · 🍳 Cucina · 🌅 Vista mare · 🅿️ Parcheggio" } },
    { id:"apt_b", emoji:"🏡", name:{ hr:"Apartman B · 6 osoba", de:"Apartment B · 6 Pers.", en:"Apartment B · 6 guests", it:"App. B · 6 persone" }, guests:6, beds:3, sqm:65, img:"https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=500&q=75", view:{ hr:"Panorama mora", de:"Panorama-Meerblick", en:"Panoramic sea view", it:"Vista panoramica" }, priceFrom:130, amen:{ hr:"❄️ Klima · 📶 WiFi · 🍳 Kuhinja · 🛁 2 kupaonice · 🌅 Pogled na more · 🏊 Terasa", de:"❄️ Klima · 📶 WLAN · 🍳 Küche · 🛁 2 Bäder · 🌅 Meerblick · 🏊 Terrasse", en:"❄️ A/C · 📶 WiFi · 🍳 Kitchen · 🛁 2 baths · 🌅 Sea view · 🏊 Terrace", it:"❄️ Aria · 📶 WiFi · 🍳 Cucina · 🛁 2 bagni · 🌅 Vista mare · 🏊 Terrazza" } },
  ],
};

// ─── APP TESTIMONIALS ───
const APP_REVIEWS = [
  { name:"Klaus & Monika H.", flag:"🇩🇪", from:"Berlin", rating:5, text:{ hr:"Najbolja turistička aplikacija! Odmah sve — parking, plaža, restoran. Kao lokalni prijatelj.", de:"Die beste Reise-App, die wir je hatten! Alles sofort — Parken, Strand, Restaurant. Wie ein lokaler Freund.", en:"Best travel app ever! Parking, beach, restaurant — instantly. Like a local friend.", it:"La migliore app di viaggio! Tutto subito — parcheggio, spiaggia, ristorante. Come un amico locale." } },
  { name:"Anna Kowalski", flag:"🇵🇱", from:"Kraków", rating:5, text:{ hr:"Jadran AI nam je spasio odmor! Informacije u realnom vremenu o gužvama i granicama. 10/10!", de:"Jadran AI hat unseren Urlaub gerettet! Echtzeit-Infos über Staus und Grenzwartezeiten. 10/10!", en:"Jadran AI saved our holiday! Real-time info on traffic and border waits. 10/10!", it:"Jadran AI ha salvato la nostra vacanza! Info in tempo reale su traffico e frontiere. 10/10!" } },
  { name:"Marco R.", flag:"🇮🇹", from:"Milano", rating:5, text:{ hr:"AI chat je fantastičan! Pitao sam za riblje mjesto i odmah dobio savršenu preporuku — Black Jack!", de:"Der KI-Chat ist fantastisch! Ich fragte nach einem Fischrestaurant und bekam sofort Black Jack empfohlen!", en:"The AI chat is fantastic! I asked for seafood and instantly got the perfect recommendation — Black Jack!", it:"La chat AI è fantastica! Ho chiesto un posto per il pesce e in un secondo mi ha consigliato Black Jack!" } },
  { name:"Petra & Tom S.", flag:"🇨🇿", from:"Praha", rating:5, text:{ hr:"Koristili smo s kampinga. Sve na jednom mjestu: vrema, trajekti, izleti. Sjajno!", de:"Wir haben die App vom Campingplatz aus genutzt. Alles da: Wetter, Fähren, Ausflüge. Brillant!", en:"Used it from our campsite. Everything in one place: weather, ferries, excursions. Brilliant!", it:"Usata dal campeggio. Tutto in un posto: meteo, traghetti, escursioni. Brillante!" } },
  { name:"Sarah & James B.", flag:"🇬🇧", from:"London", rating:5, text:{ hr:"Više nikada na Jadranu bez Jadran AI. Preporuka za Black Jack bila je savršena — večera na terasi pored mora.", de:"Nie wieder Adria ohne Jadran AI. Die Black-Jack-Empfehlung war traumhaft — Abendessen auf der Terrasse am Meer.", en:"Never visiting the Adriatic without Jadran AI again. The Black Jack dinner on the sea terrace was magical.", it:"Mai più sull'Adriatico senza Jadran AI. La cena al Black Jack sulla terrazza sul mare era magica." } },
];

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [viatorDeals, setViatorDeals] = useState([]);
  const [viatorLoading, setViatorLoading] = useState(false);
  const [activeDestId, setActiveDestId] = useState(null); // city within region sheet
  const [showReview, setShowReview] = useState(false);
  const [rvRating, setRvRating] = useState(0);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvDone, setRvDone] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);
  const [liveWx, setLiveWx] = useState(null);
  const [liveMarine, setLiveMarine] = useState(null);
  const [liveCity, setLiveCity] = useState(null);
  const [liveLoadState, setLiveLoadState] = useState("idle"); // idle|loading|done|error|noperm
  const heroRef = useRef(null);
  const [qcMsgs, setQcMsgs] = useState([]);
  const [qcInput, setQcInput] = useState("");
  const [qcLoading, setQcLoading] = useState(false);
  const [qcStarted, setQcStarted] = useState(false);
  const qcEndRef = useRef(null);
  const qcSend = async (text) => {
    if (!text.trim() || qcLoading) return;
    const uMsg = { role:"user", text:text.trim() };
    setQcMsgs(p => [...p, uMsg]);
    setQcInput(""); setQcLoading(true); setQcStarted(true);
    try {
      const r = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ mode:"apartment", plan:"free", lang: lang==="at"?"de":lang||"en", region:"all", msgs:[...qcMsgs, uMsg].slice(-6) }) });
      const d = await r.json();
      setQcMsgs(p => [...p, { role:"assistant", text: d.reply||d.text||(lang==="de"||lang==="at"?"Einen Moment…":lang==="en"?"One moment…":"Trenutak…") }]);
    } catch { setQcMsgs(p => [...p, { role:"assistant", text:"…" }]); }
    setQcLoading(false);
  };
  useEffect(() => { qcEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [qcMsgs]);

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
    const anyModal = showBJ || showLive || activeFeature;
    const h = e => { if (e.key === "Escape") { setShowBJ(false); setSelectedMenuItem(null); setShowLive(false); setActiveFeature(null); } };
    if (anyModal) {
      document.addEventListener("keydown", h);
      document.body.style.overflow = "hidden";
    }
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [showBJ, showLive]);

  // ─ Live data: GPS → Open-Meteo weather + marine ─
  useEffect(() => {
    if (!showLive) return;
    setLiveLoadState("loading");
    setLiveWx(null); setLiveMarine(null); setLiveCity(null);
    if (!navigator.geolocation) { setLiveLoadState("noperm"); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        setLiveCity(nearestCity(lat, lon));
        Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover,weather_code&wind_speed_unit=kmh&timezone=auto`).then(r => r.json()),
          fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=sea_surface_temperature,wave_height,wave_period`).then(r => r.json()),
        ]).then(([wx, mar]) => {
          setLiveWx(wx.current || null);
          setLiveMarine(mar.current || null);
          setLiveLoadState("done");
        }).catch(() => setLiveLoadState("error"));
      },
      () => setLiveLoadState("noperm"),
      { timeout: 10000, maximumAge: 300000 }
    );
  }, [showLive]);

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
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:300, paddingTop:"max(10px, env(safe-area-inset-top, 10px))", paddingBottom:10, paddingLeft:16, paddingRight:16, display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(5,13,26,0.75)", backdropFilter:"blur(24px) saturate(1.8)", WebkitBackdropFilter:"blur(24px) saturate(1.8)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        {/* Left: hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} style={{ width:36, height:36, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, padding:0, flexShrink:0 }} aria-label="Meni">
          <span style={{ display:"block", width:18, height:2, background: menuOpen ? "#0ea5e9" : "#94a3b8", borderRadius:2, transition:"all 0.2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
          <span style={{ display:"block", width:18, height:2, background: menuOpen ? "transparent" : "#94a3b8", borderRadius:2, transition:"all 0.2s" }} />
          <span style={{ display:"block", width:18, height:2, background: menuOpen ? "#0ea5e9" : "#94a3b8", borderRadius:2, transition:"all 0.2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
        </button>

        {/* Center: JADRAN */}
        <span style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", fontFamily:F, fontSize:17, fontWeight:700, letterSpacing:3, textTransform:"uppercase", color:"#f0f4f8", pointerEvents:"none" }}>JADRAN</span>

        {/* Right: current destination name */}
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:300, letterSpacing:1 }}>
          {HERO_DESTS[heroIdx]?.name}
        </div>

        {/* Hamburger dropdown */}
        {menuOpen && <>
          <div onClick={() => setMenuOpen(false)} style={{ position:"fixed", inset:0, zIndex:298 }} />
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:12, zIndex:299, minWidth:210, background:"rgba(5,13,26,0.97)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:14, border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 12px 40px rgba(0,0,0,0.6)", overflow:"hidden" }}>
            <button onClick={() => { setMenuOpen(false); setActiveTab("explore"); document.getElementById("destinations")?.scrollIntoView({behavior:"smooth"}); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", color:"#7dd3fc", fontSize:14, fontWeight:600, background:"none", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", width:"100%", fontFamily:B, textAlign:"left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              {({hr:"Istraži",de:"Erkunden",en:"Explore",it:"Esplora",pl:"Odkryj",si:"Razišči"})[lang]||"Explore"}
            </button>
            <a href="/landing" onClick={() => setMenuOpen(false)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", color:"#fbbf24", fontSize:14, fontWeight:600, textDecoration:"none", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
              {({hr:"Guardian Brief",de:"Guardian Brief",en:"Guardian Brief",it:"Guardian Brief",pl:"Guardian Brief",si:"Guardian Brief"})[lang]||"Guardian Brief"}
            </a>
            <button onClick={() => { setMenuOpen(false); setActiveTab("live"); setShowLive(true); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", color:"#22c55e", fontSize:14, fontWeight:600, background:"none", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", width:"100%", fontFamily:B, textAlign:"left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 2v2"/><path d="M12 20v2"/><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>
              {({hr:"Live",de:"Live",en:"Live",it:"Live",pl:"Live",si:"Živo"})[lang]||"Live"}
            </button>
            <button onClick={() => { setMenuOpen(false); setActiveTab("lang"); setLangOpen(true); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", color:"#94a3b8", fontSize:14, background:"none", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer", width:"100%", fontFamily:B, textAlign:"left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {({hr:"Jezik",de:"Sprache",en:"Lang",it:"Lingua",pl:"Język",si:"Jezik"})[lang]||"Lang"}
            </button>
            <button onClick={() => { setMenuOpen(false); window.history.back(); }} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", color:"#64748b", fontSize:14, background:"none", border:"none", cursor:"pointer", width:"100%", fontFamily:B, textAlign:"left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              {({hr:"Nazad",de:"Zurück",en:"Back",it:"Indietro",pl:"Wstecz",si:"Nazaj"})[lang]||"Back"}
            </button>
          </div>
        </>}
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ position:"relative", overflow:"hidden", background:"#0a0e17", minHeight:320 }}>
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
        <div style={{ position:"relative", zIndex:2, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"136px 24px 32px", maxWidth:720, margin:"0 auto", width:"100%", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(24px)", transition:"all 1.1s cubic-bezier(0.16,1,0.3,1)" }}>

          {/* Live badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 18px", borderRadius:20, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.18)", marginBottom:14 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 10px #22c55e", animation:"pulse 2s infinite", flexShrink:0 }} />
            <span style={{ fontSize:10, color:"#7dd3fc", fontWeight:600, letterSpacing:2 }}>
              {({hr:"JADRAN SENSE™ AKTIVAN",de:"JADRAN SENSE™ AKTIV",en:"JADRAN SENSE™ ACTIVE",it:"JADRAN SENSE™ ATTIVO",pl:"JADRAN SENSE™ AKTYWNY",si:"JADRAN SENSE™ AKTIVEN"})[dl] || "JADRAN SENSE™ ACTIVE"}
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{ fontFamily:F, fontSize:"clamp(40px,8vw,72px)", fontWeight:400, lineHeight:1.05, marginBottom:6, letterSpacing:"-0.02em" }}>
            <span style={{ display:"block", color:"rgba(240,244,248,0.45)", fontSize:"clamp(12px,2vw,15px)", fontFamily:B, fontWeight:300, letterSpacing:7, textTransform:"uppercase", marginBottom:8 }}>
              {({hr:"Otkrijte",de:"Entdecken Sie",en:"Discover",it:"Scoprite",pl:"Odkryj",si:"Odkrijte"})[dl] || "Discover"}
            </span>
            <span style={{ background:"linear-gradient(135deg, #f0f4f8 10%, #7dd3fc 45%, #fbbf24 85%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% 200%", animation:"gradShift 7s ease infinite" }}>
              {({hr:"Hrvatski Jadran",de:"Kroatische Adria",en:"Croatian Adriatic",it:"Adriatico Croato",pl:"Chorwacka Adria",si:"Hrvaška Adria"})[dl] || "Croatian Adriatic"}
            </span>
          </h1>

          {/* Currently showing */}
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:8, fontWeight:300, letterSpacing:2 }}>
            — {HERO_DESTS[heroIdx].name} —
          </div>

          <p style={{ fontSize:"clamp(14px,2vw,16px)", color:"#94a3b8", lineHeight:1.6, maxWidth:520, marginBottom:20, fontWeight:300 }}>
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
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginBottom:12 }}>
            <a href="/landing" style={{ padding:"16px 32px", borderRadius:14, color:"#fbbf24", fontSize:18, fontWeight:700, textDecoration:"none", fontFamily:F, border:"2px solid rgba(251,191,36,0.55)", background:"rgba(251,191,36,0.12)", display:"inline-flex", alignItems:"center", gap:8, letterSpacing:0.4, backdropFilter:"blur(8px)", boxShadow:"0 0 20px rgba(251,191,36,0.18)" }}>
              ⭐ AI Travel Guardian →
            </a>
          </div>


        </div>
      </section>

      {/* ═══ INSTANT AI CHAT ═══ */}
      <section style={{ padding:"0 20px 52px", background:"#0a0e17" }}>
        <style>{`@keyframes qc-blink{0%,80%,100%{opacity:.15}40%{opacity:1}} @keyframes qc-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ background:"rgba(10,18,32,0.92)", border:"1px solid rgba(14,165,233,0.13)", borderRadius:20, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.5)" }}>

            {/* Messages — only shown after first send */}
            {qcMsgs.length > 0 && (
              <div style={{ padding:"18px 18px 8px", maxHeight:280, overflowY:"auto" }}>
                {qcMsgs.map((m,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10, animation:"qc-in .3s both" }}>
                    <div style={{ background:m.role==="user"?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(14,165,233,0.07)", border:m.role==="user"?"none":"1px solid rgba(14,165,233,0.1)", borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px", padding:"10px 15px", fontSize:14, color:m.role==="user"?"#fff":"#cbd5e1", lineHeight:1.65, maxWidth:"82%", whiteSpace:"pre-wrap" }}>{m.text}</div>
                  </div>
                ))}
                {qcLoading && (
                  <div style={{ display:"flex", marginBottom:10 }}>
                    <div style={{ background:"rgba(14,165,233,0.07)", border:"1px solid rgba(14,165,233,0.1)", borderRadius:"4px 16px 16px 16px", padding:"13px 16px", display:"flex", gap:5, alignItems:"center" }}>
                      {[0,1,2].map(i=><span key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#38bdf8",display:"inline-block",animation:`qc-blink 1.4s ease ${i*0.22}s infinite` }}/>)}
                    </div>
                  </div>
                )}
                <div ref={qcEndRef}/>
              </div>
            )}

            {/* Input */}
            <div style={{ padding:"14px 16px 12px", display:"flex", gap:10 }}>
              <input value={qcInput} onChange={e=>setQcInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),qcSend(qcInput))}
                placeholder={dl==="de"?"Frag mich etwas über die Adria…":dl==="en"?"Ask me anything about the Adriatic…":dl==="it"?"Chiedimi qualcosa sull'Adriatico…":"Pitaj me nešto o Jadranu…"}
                disabled={qcLoading}
                style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:13, padding:"13px 18px", fontSize:15, color:"#e2e8f0", outline:"none", fontFamily:B, caretColor:"#0ea5e9" }}
              />
              <button onClick={()=>qcSend(qcInput)} disabled={qcLoading||!qcInput.trim()} style={{ width:48, height:48, borderRadius:13, background:qcInput.trim()&&!qcLoading?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(14,165,233,0.08)", border:"none", cursor:qcInput.trim()&&!qcLoading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .2s" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            {/* Freemium note */}
            <div style={{ padding:"0 16px 14px", textAlign:"center", fontSize:12, color:"#475569" }}>
              {dl==="de"?"7 Fragen gratis · danach":dl==="en"?"7 messages free · then":dl==="it"?"7 domande gratis · poi":"7 poruka besplatno · zatim"}{" "}
              <a href="/ai" style={{ color:"#0ea5e9", textDecoration:"none", fontWeight:600 }}>
                {dl==="de"?"Vollzugang ab 9,99 €":dl==="en"?"full access from €9.99":dl==="it"?"accesso completo da 9,99 €":"puni pristup od 9,99 €"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DESTINATIONS ═══ */}
      <section id="destinations" style={{ padding:"32px 20px 28px", background:"linear-gradient(180deg, #071828 0%, #0a1e36 50%, #071828 100%)" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          <div style={{ textAlign:"center", marginBottom:18 }}>
            <div style={{ fontSize:10, color:"#0ea5e9", letterSpacing:4, fontWeight:700, marginBottom:6 }}>
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
                  <p style={{ fontSize:10, color:"rgba(255,255,255,0.55)", fontWeight:300, lineHeight:1.3 }}>{r.destinations.slice(0,3).map(d => d.name).join(" · ")}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARTNERI & BEST DEALS ═══ */}
      <section style={{ padding:"24px 20px 20px", background:"#050d1a" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          {/* — Naši partneri — */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
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

      {/* ═══ APP REVIEWS ═══ */}
      <section style={{ padding:"28px 20px 24px", background:"#030810", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:4, fontWeight:700, marginBottom:4 }}>
                {({hr:"ŠTO KAŽU GOSTI",de:"WAS GÄSTE SAGEN",en:"WHAT GUESTS SAY",it:"COSA DICONO GLI OSPITI",pl:"CO MÓWIĄ GOŚCIE",si:"KAJ PRAVIJO GOSTJE"})[lang]||"WHAT GUESTS SAY"}
              </div>
              <div style={{ fontFamily:F, fontSize:20, fontWeight:400, color:"#f0f4f8" }}>
                {({hr:"Iskustva s Jadran AI",de:"Erlebnisse mit Jadran AI",en:"Experiences with Jadran AI",it:"Esperienze con Jadran AI"})[lang]||"Experiences with Jadran AI"}
              </div>
            </div>
            <button onClick={() => { setShowReview(true); setRvRating(0); setRvName(""); setRvText(""); setRvDone(false); }}
              style={{ padding:"9px 16px", borderRadius:12, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", fontSize:12, fontWeight:700, color:"#fbbf24", cursor:"pointer", fontFamily:B, flexShrink:0 }}>
              + {({hr:"Dodaj utisak",de:"Bewertung",en:"Add review",it:"Aggiungi"})[lang]||"Add review"}
            </button>
          </div>

          {/* Review cards — horizontal scroll */}
          <div style={{ display:"flex", gap:12, overflowX:"auto", scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch", paddingBottom:8 }}>
            {APP_REVIEWS.map((rv, i) => (
              <div key={i} style={{ minWidth:260, maxWidth:280, borderRadius:16, background:"#0a1628", border:"1px solid rgba(255,255,255,0.05)", padding:"16px 16px", flexShrink:0, scrollSnapAlign:"start" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{rv.flag}</span>
                  <div>
                    <div style={{ fontFamily:B, fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{rv.name}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>{rv.from}</div>
                  </div>
                  <div style={{ marginLeft:"auto", fontSize:13, color:"#fbbf24" }}>{"★".repeat(rv.rating)}</div>
                </div>
                <div style={{ fontSize:13, color:"#64748b", lineHeight:1.65, fontStyle:"italic" }}>"{t(rv.text)}"</div>
              </div>
            ))}
          </div>

          {/* Average rating strip */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:16, padding:"10px 16px", borderRadius:12, background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.12)" }}>
            <span style={{ fontSize:22, color:"#fbbf24" }}>★</span>
            <span style={{ fontFamily:B, fontSize:16, fontWeight:700, color:"#fbbf24" }}>5.0</span>
            <span style={{ fontSize:12, color:"#475569" }}>·</span>
            <span style={{ fontSize:12, color:"#64748b" }}>{APP_REVIEWS.length} {({hr:"recenzija",de:"Bewertungen",en:"reviews",it:"recensioni"})[lang]||"reviews"}</span>
            <span style={{ marginLeft:"auto", fontSize:11, color:"#334155" }}>jadran.ai</span>
          </div>

        </div>
      </section>

      {/* ═══ REVIEW MODAL ═══ */}
      {showReview && (
        <div onClick={() => setShowReview(false)} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(3,8,16,0.88)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:520, background:"#0a1628", borderRadius:"24px 24px 0 0", border:"1px solid rgba(251,191,36,0.15)", borderBottom:"none", padding:"24px 20px", paddingBottom:"calc(24px + env(safe-area-inset-bottom, 0px))", animation:"fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:F, fontSize:22, fontWeight:400, color:"#f0f4f8" }}>
                {({hr:"Vaš utisak",de:"Ihre Bewertung",en:"Your review",it:"La tua recensione"})[lang]||"Your review"}
              </div>
              <button onClick={() => setShowReview(false)} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", color:"#64748b", fontSize:15, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
            </div>

            {rvDone ? (
              <div style={{ textAlign:"center", padding:"20px 0 10px" }}>
                <div style={{ fontSize:46, marginBottom:12 }}>🙏</div>
                <div style={{ fontFamily:F, fontSize:20, color:"#f0f4f8", marginBottom:6 }}>
                  {({hr:"Hvala vam!",de:"Danke schön!",en:"Thank you!",it:"Grazie mille!"})[lang]||"Thank you!"}
                </div>
                <div style={{ fontFamily:B, fontSize:13, color:"#475569" }}>
                  {({hr:"Vaše mišljenje nam puno znači.",de:"Ihr Feedback bedeutet uns sehr viel.",en:"Your feedback means a lot to us.",it:"Il tuo feedback ci è molto prezioso."})[lang]||""}
                </div>
              </div>
            ) : (
              <>
                {/* Stars */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontFamily:B, fontSize:11, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:2 }}>
                    {({hr:"Ocjena",de:"Bewertung",en:"Rating",it:"Valutazione"})[lang]||"Rating"}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setRvRating(n)}
                        style={{ flex:1, padding:"12px 0", borderRadius:12, border:`1px solid ${rvRating>=n?"rgba(251,191,36,0.5)":"rgba(255,255,255,0.06)"}`, background:rvRating>=n?"rgba(251,191,36,0.1)":"transparent", fontSize:24, cursor:"pointer", transition:"all 0.15s", color:rvRating>=n?"#fbbf24":"#1e293b" }}>
                        {rvRating >= n ? "★" : "☆"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontFamily:B, fontSize:11, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:2 }}>
                    {({hr:"Vaše ime",de:"Ihr Name",en:"Your name",it:"Il tuo nome"})[lang]||"Name"}
                  </div>
                  <input
                    value={rvName} onChange={e => setRvName(e.target.value)}
                    placeholder={({hr:"Npr. Klaus M.",de:"z.B. Klaus M.",en:"e.g. Klaus M.",it:"es. Klaus M."})[lang]||""}
                    style={{ width:"100%", padding:"10px 12px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, color:"#e2e8f0", fontSize:14, fontFamily:B, outline:"none", boxSizing:"border-box" }}
                  />
                </div>

                {/* Text */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:B, fontSize:11, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:2 }}>
                    {({hr:"Komentar",de:"Kommentar",en:"Comment",it:"Commento"})[lang]||"Comment"}
                  </div>
                  <textarea
                    value={rvText} onChange={e => setRvText(e.target.value)} rows={3}
                    placeholder={({hr:"Vaše iskustvo s Jadran AI...",de:"Ihre Erfahrung mit Jadran AI...",en:"Your experience with Jadran AI...",it:"La tua esperienza con Jadran AI..."})[lang]||""}
                    style={{ width:"100%", padding:"10px 12px", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, color:"#e2e8f0", fontSize:14, fontFamily:B, outline:"none", resize:"none", boxSizing:"border-box" }}
                  />
                </div>

                {/* Submit */}
                <button
                  disabled={!rvRating || !rvName.trim()}
                  onClick={async () => {
                    try {
                      const deviceId = localStorage.getItem("jadran_device_id") || "unknown";
                      await fetch("/api/partner-feedback", {
                        method:"POST", headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ partner:"jadran_app", rating:rvRating, comment:`${rvName}: ${rvText}`, lang, deviceId }),
                      });
                    } catch {}
                    setRvDone(true);
                  }}
                  style={{ width:"100%", padding:"15px", borderRadius:14, background: (rvRating && rvName.trim()) ? "linear-gradient(135deg,#f59e0b,#d97706)" : "rgba(251,191,36,0.08)", border:"none", color: (rvRating && rvName.trim()) ? "#fff" : "#475569", fontSize:16, fontWeight:700, cursor: (rvRating && rvName.trim()) ? "pointer" : "default", fontFamily:B, transition:"all 0.2s" }}>
                  {({hr:"Pošalji recenziju →",de:"Bewertung absenden →",en:"Submit review →",it:"Invia recensione →"})[lang]||"Submit →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ PARTNER CTA ═══ */}
      <section style={{ padding:"32px 20px", background:"linear-gradient(160deg, #050d1a 0%, #0a1628 50%, #061018 100%)", borderTop:"1px solid rgba(14,165,233,0.08)" }}>
        <div style={{ maxWidth:960, margin:"0 auto", display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
          <a href="/partner" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"16px 36px", background:"linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius:18, color:"#fff", fontFamily:B, fontSize:16, fontWeight:700, textDecoration:"none", boxShadow:"0 8px 32px rgba(14,165,233,0.3)" }}>
            🤝 {({hr:"Registriraj se — besplatno",de:"Jetzt registrieren — kostenlos",en:"Register — free",it:"Registrati — gratis"})[lang]||"Register — free"}
          </a>
          <a href="/partner" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"16px 28px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(14,165,233,0.3)", borderRadius:18, color:"#0ea5e9", fontFamily:B, fontSize:15, fontWeight:600, textDecoration:"none" }}>
            {({hr:"Prijava →",de:"Anmelden →",en:"Sign in →",it:"Accedi →"})[lang]||"Sign in →"}
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
      {showBJ && (() => {
        const today = new Date().getDay();
        const special = BJ.dailySpecials.find(s => s.day === today);
        return (
        <div onClick={() => { setShowBJ(false); setSelectedMenuItem(null); }} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.88)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, maxHeight:"92dvh", background:"#0a1628", borderRadius:"24px 24px 0 0", border:"1px solid rgba(249,115,22,0.15)", borderBottom:"none", overflow:"hidden", display:"flex", flexDirection:"column", animation:"fadeUp 0.35s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* ── Hero photo ── */}
            <div style={{ position:"relative", height:180, flexShrink:0 }}>
              <img src={BJ.img} alt="Black Jack" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, #0a1628 0%, rgba(10,22,40,0.5) 60%, rgba(10,22,40,0.15) 100%)" }} />
              <button onClick={() => { setShowBJ(false); setSelectedMenuItem(null); }} style={{ position:"absolute", top:14, right:14, width:32, height:32, borderRadius:"50%", background:"rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", fontSize:16, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
              <div style={{ position:"absolute", top:14, left:14, padding:"4px 10px", borderRadius:8, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.25)", fontSize:9, fontWeight:700, color:"#f97316", letterSpacing:1.5 }}>PARTNER • RAB</div>
              <div style={{ position:"absolute", bottom:12, left:18, right:18 }}>
                <div style={{ fontFamily:F, fontSize:28, fontWeight:400, color:"#f0f9ff" }}>🃏 Black Jack</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:4, flexWrap:"wrap" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{BJ.address}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:8, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.3)" }}>
                    <span style={{ color:"#fbbf24", fontSize:11 }}>★</span>
                    <span style={{ fontSize:11, fontWeight:700, color:"#fbbf24" }}>{BJ.rating}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>({BJ.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Contact strip ── */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)", flexShrink:0 }}>
              <a href={`tel:${BJ.phone}`} style={{ padding:"9px 6px", borderRadius:12, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.18)", display:"flex", flexDirection:"column", alignItems:"center", gap:3, textDecoration:"none" }}>
                <span style={{ fontSize:18 }}>📞</span>
                <span style={{ fontSize:9, fontWeight:700, color:"#38bdf8" }}>{({hr:"Pozovi",de:"Anrufen",en:"Call",it:"Chiama"})[dl]||"Call"}</span>
              </a>
              <a href={`https://wa.me/${BJ.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ padding:"9px 6px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.18)", display:"flex", flexDirection:"column", alignItems:"center", gap:3, textDecoration:"none" }}>
                <span style={{ fontSize:18 }}>💬</span>
                <span style={{ fontSize:9, fontWeight:700, color:"#25d366" }}>WhatsApp</span>
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=Palit+315,+Rab,+Croatia" target="_blank" rel="noopener noreferrer" style={{ padding:"9px 6px", borderRadius:12, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.18)", display:"flex", flexDirection:"column", alignItems:"center", gap:3, textDecoration:"none" }}>
                <span style={{ fontSize:18 }}>🗺️</span>
                <span style={{ fontSize:9, fontWeight:700, color:"#fbbf24" }}>{({hr:"Navigacija",de:"Navigation",en:"Navigate",it:"Naviga"})[dl]||"Navigate"}</span>
              </a>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ overflowY:"auto", WebkitOverflowScrolling:"touch", flex:1, paddingBottom:"env(safe-area-inset-bottom, 16px)" }}>

              {/* Hours + today's special */}
              <div style={{ padding:"12px 16px 0" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: special ? 10 : 0, padding:"8px 12px", borderRadius:10, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.12)" }}>
                  <span style={{ fontSize:14 }}>🕐</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#22c55e" }}>{({hr:"Otvoreno",de:"Geöffnet",en:"Open",it:"Aperto"})[dl]||"Open"} · </span>
                  <span style={{ fontSize:11, color:"#94a3b8" }}>{t(BJ.hours)}</span>
                </div>
                {special && (
                  <div style={{ marginTop:10, padding:"12px 14px", borderRadius:12, background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)" }}>
                    <div style={{ fontSize:9, color:"#fbbf24", letterSpacing:3, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>{({hr:"JELO DANA",de:"TAGESGERICHT",en:"TODAY'S SPECIAL",it:"PIATTO DEL GIORNO"})[dl]||"TODAY'S SPECIAL"}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:24 }}>{special.emoji}</span>
                        <span style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{t(special)}</span>
                      </div>
                      <span style={{ fontSize:15, fontWeight:700, color:"#fbbf24" }}>€{special.price}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo gallery */}
              <div style={{ padding:"14px 0 0 16px" }}>
                <div style={{ fontSize:9, color:"#f97316", letterSpacing:3, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>{({hr:"GALERIJA",de:"GALERIE",en:"GALLERY",it:"GALLERIA"})[dl]||"GALLERY"}</div>
                <div style={{ display:"flex", gap:8, overflowX:"auto", scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch", paddingRight:16, paddingBottom:4 }}>
                  {BJ.gallery.map((src, gi) => (
                    <div key={gi} style={{ minWidth:130, height:90, borderRadius:12, overflow:"hidden", flexShrink:0, scrollSnapAlign:"start" }}>
                      <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu sections */}
              {BJ.menu.map((sec, si) => (
                <div key={si} style={{ padding:"16px 16px 0" }}>
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
                            <div style={{ padding:"0 14px 14px", paddingLeft:48, fontSize:13, color:"#94a3b8", lineHeight:1.7, borderTop:"1px solid rgba(255,255,255,0.04)", paddingTop:10 }}>
                              {t(item.desc)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Testimonials */}
              <div style={{ padding:"16px 16px 0" }}>
                <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:3, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>{({hr:"OCJENE GOSTIJU",de:"GÄSTEBEWERTUNGEN",en:"GUEST REVIEWS",it:"RECENSIONI"})[dl]||"REVIEWS"}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {BJ.testimonials.map((rv, ri) => (
                    <div key={ri} style={{ padding:"12px 14px", borderRadius:14, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:16 }}>{rv.flag}</span>
                        <span style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{rv.name}</span>
                        <span style={{ fontSize:12, color:"#fbbf24", marginLeft:"auto" }}>{"★".repeat(rv.rating)}</span>
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, fontStyle:"italic" }}>"{t(rv.text)}"</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accommodation */}
              <div style={{ padding:"16px 16px 0" }}>
                <div style={{ fontSize:10, color:"#22c55e", letterSpacing:3, fontWeight:700, marginBottom:10, textTransform:"uppercase" }}>
                  {({hr:"SMJEŠTAJ",de:"UNTERKUNFT",en:"ACCOMMODATION",it:"ALLOGGIO"})[dl]||"ACCOMMODATION"}
                </div>
                <div style={{ display:"flex", gap:10, overflowX:"auto", scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch", paddingBottom:4 }}>
                  {BJ.rooms.map(room => (
                    <div key={room.id} style={{ minWidth:220, borderRadius:14, overflow:"hidden", border:"1px solid rgba(34,197,94,0.15)", background:"rgba(0,0,0,0.2)", flexShrink:0, scrollSnapAlign:"start" }}>
                      <div style={{ position:"relative", height:90 }}>
                        <img src={room.img} alt={t(room.name)} style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(5,14,30,0.85) 0%, transparent 60%)" }} />
                        <div style={{ position:"absolute", bottom:8, left:10, right:10, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#f0f9ff" }}>{room.emoji} {t(room.name)}</div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:16, fontWeight:700, color:"#22c55e" }}>€{room.priceFrom}</div>
                            <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)" }}>{({hr:"/noć",de:"/Nacht",en:"/night",it:"/notte"})[dl]||"/noć"}</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:"8px 10px" }}>
                        <div style={{ fontSize:10, color:"#64748b", marginBottom:8, lineHeight:1.4 }}>👤 {room.guests} · 🛏️ {room.beds} · 📐 {room.sqm}m² · {t(room.view)}</div>
                        <div style={{ fontSize:10, color:"#4ade80", marginBottom:8 }}>{t(room.amen)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aerial map */}
              <div style={{ padding:"14px 16px 0" }}>
                <div style={{ fontSize:10, color:"#a78bfa", letterSpacing:3, fontWeight:700, marginBottom:8, textTransform:"uppercase" }}>
                  {({hr:"POGLED ODOZGO",de:"VOGELPERSPEKTIVE",en:"AERIAL VIEW",it:"VISTA AEREA"})[dl]||"AERIAL VIEW"}
                </div>
                <div style={{ borderRadius:14, overflow:"hidden", height:180, border:"1px solid rgba(167,139,250,0.18)", position:"relative" }}>
                  <iframe
                    title="Black Jack aerial"
                    src="https://maps.google.com/maps?q=Palit+315,+Rab,+Croatia&hl=hr&z=17&t=k&output=embed"
                    style={{ width:"100%", height:"100%", border:0, display:"block" }}
                    loading="lazy"
                    allowFullScreen
                  />
                  <div style={{ position:"absolute", bottom:8, left:8, padding:"3px 8px", borderRadius:6, background:"rgba(5,14,30,0.85)", fontSize:9, color:"#c4b5fd" }}>
                    📍 Palit 315 · 200m {({hr:"od plaže",de:"vom Strand",en:"from beach",it:"dalla spiaggia"})[dl]||"od plaže"}
                  </div>
                </div>
              </div>

              {/* Nearby */}
              <div style={{ padding:"16px 16px 0" }}>
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
              <div style={{ padding:"16px 16px 20px" }}>
                <a href={`${BJ.link}&lang=${lang}`} style={{ display:"block", padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#f97316,#ea580c)", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", textAlign:"center", boxShadow:"0 4px 20px rgba(249,115,22,0.3)", minHeight:48, lineHeight:"20px" }}>
                  {({hr:"Otvori AI vodič za Rab →",de:"KI-Guide für Rab öffnen →",en:"Open AI guide for Rab →",it:"Apri guida AI per Rab →"})[dl]||"Open AI guide →"}
                </a>
              </div>

            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:"28px 20px", paddingBottom:"calc(80px + env(safe-area-inset-bottom, 0px))", textAlign:"center", background:"#030810", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:5, marginBottom:8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-label="Anthropic"><path d="M14.25 2h-4.5L3 22h4.5l1.5-4.5h6l1.5 4.5H21L14.25 2zm-5.5 12 3.25-9.5 3.25 9.5H8.75z" fill="#92400e"/></svg>
          <span style={{ fontSize:10, fontWeight:600, color:"#92400e", letterSpacing:0.3 }}>Claude by Anthropic</span>
        </div>
        <div style={{ fontSize:10, color:"#1e293b", letterSpacing:0.5 }}>© 2026 SIAL Consulting d.o.o. · jadran.ai</div>
        <div style={{ marginTop:6 }}>
          <a href="/blog" style={{ fontSize:9, color:"#334155", textDecoration:"underline", textUnderlineOffset:2 }}>Blog</a>
        </div>
      </footer>

      {/* ═══ LIVE OVERLAY — context-aware ═══ */}
      {showLive && (
        <div onClick={() => setShowLive(false)} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(3,8,16,0.92)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:560, background:"#080f1e", borderRadius:"24px 24px 0 0", border:"1px solid rgba(34,197,94,0.2)", borderBottom:"none", overflow:"hidden", animation:"fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* ── Header ── */}
            <div style={{ padding:"18px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: liveLoadState === "done" ? "#22c55e" : "#f59e0b", boxShadow:`0 0 10px ${liveLoadState === "done" ? "#22c55e" : "#f59e0b"}`, animation:"pulse 2s infinite", flexShrink:0 }} />
                <span style={{ fontSize:12, color:"#22c55e", fontWeight:700, letterSpacing:2 }}>JADRAN SENSE™ LIVE</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {liveCity && <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>📍 {liveCity}</span>}
                <button onClick={() => setShowLive(false)} style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.05)", border:"none", color:"#64748b", fontSize:14, cursor:"pointer", display:"grid", placeItems:"center" }}>✕</button>
              </div>
            </div>

            <div style={{ padding:"16px 20px", paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))" }}>

              {/* ── Loading ── */}
              {liveLoadState === "loading" && (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>📡</div>
                  <div style={{ fontSize:13, color:"#64748b" }}>
                    {({hr:"Dohvaćam podatke za vašu lokaciju…",de:"Standortdaten werden geladen…",en:"Fetching data for your location…",it:"Caricamento dati posizione…",pl:"Pobieranie danych lokalizacji…",si:"Nalagam podatke za vašo lokacijo…"})[dl]||"Loading…"}
                  </div>
                </div>
              )}

              {/* ── No permission ── */}
              {(liveLoadState === "noperm" || liveLoadState === "error") && (
                <div style={{ textAlign:"center", padding:"28px 0" }}>
                  <div style={{ fontSize:28, marginBottom:10 }}>📍</div>
                  <div style={{ fontSize:13, color:"#f59e0b", marginBottom:8 }}>
                    {liveLoadState === "noperm"
                      ? ({hr:"Dopusti pristup lokaciji za Live podatke",de:"Standortzugriff erlauben für Live-Daten",en:"Allow location access for Live data",it:"Consenti accesso posizione per dati live",pl:"Zezwól na lokalizację dla danych live",si:"Dovoli dostop do lokacije za žive podatke"})[dl]||"Allow location"
                      : ({hr:"Ne mogu dohvatiti podatke",de:"Daten konnten nicht geladen werden",en:"Could not fetch data",it:"Impossibile caricare i dati",pl:"Nie można pobrać danych",si:"Podatkov ni mogoče naložiti"})[dl]||"Error"}
                  </div>
                </div>
              )}

              {/* ── Live data grid ── */}
              {liveLoadState === "done" && liveWx && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>

                  {/* Tile 1: Weather */}
                  <div style={{ borderRadius:16, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.12)", padding:"14px 12px" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:8 }}>
                      {({hr:"VRIJEME",de:"WETTER",en:"WEATHER",it:"METEO",pl:"POGODA",si:"VREME"})[dl]||"WEATHER"}
                    </div>
                    <div style={{ fontSize:32, marginBottom:4 }}>{wxEmoji(liveWx.weather_code)}</div>
                    <div style={{ fontSize:26, fontWeight:300, color:"#f0f4f8", lineHeight:1 }}>{Math.round(liveWx.temperature_2m ?? 0)}°C</div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>
                      {({hr:"osjeća se",de:"gefühlt",en:"feels like",it:"percepito",pl:"odczuwalna",si:"občutek"})[dl]||"feels"} {Math.round(liveWx.apparent_temperature ?? 0)}°
                    </div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>☁️ {liveWx.cloud_cover ?? "—"}%</div>
                  </div>

                  {/* Tile 2: UV + Wind */}
                  <div style={{ borderRadius:16, background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.12)", padding:"14px 12px" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:8 }}>UV · VJETAR</div>
                    <div style={{ fontSize:22, fontWeight:700, color: (liveWx.uv_index??0) >= 8 ? "#ef4444" : (liveWx.uv_index??0) >= 5 ? "#f59e0b" : "#22c55e", marginBottom:2 }}>
                      UV {liveWx.uv_index ?? "—"}
                    </div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>
                      {(liveWx.uv_index??0) >= 8 ? "⚠️ Ekstremno" : (liveWx.uv_index??0) >= 6 ? "🧴 Visok" : (liveWx.uv_index??0) >= 3 ? "😎 Umjeren" : "✅ Nizak"}
                    </div>
                    <div style={{ fontSize:13, color:"#7dd3fc" }}>
                      💨 {Math.round(liveWx.wind_speed_10m ?? 0)} km/h {windDirStr(liveWx.wind_direction_10m)}
                    </div>
                  </div>

                  {/* Tile 3: Sea temperature + waves */}
                  <div style={{ borderRadius:16, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.14)", padding:"14px 12px" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:8 }}>
                      {({hr:"MORE",de:"MEER",en:"SEA",it:"MARE",pl:"MORZE",si:"MORJE"})[dl]||"SEA"}
                    </div>
                    <div style={{ fontSize:28, fontWeight:300, color:"#7dd3fc", lineHeight:1.1 }}>
                      🌊 {liveMarine ? Math.round(liveMarine.sea_surface_temperature ?? 0) : "—"}°C
                    </div>
                    <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>
                      {({hr:"temp. mora",de:"Meerestemperatur",en:"sea temp",it:"temp. mare",pl:"temp. morza",si:"temp. morja"})[dl]||"sea temp"}
                    </div>
                    {liveMarine && (
                      <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>
                        〰️ {(liveMarine.wave_height ?? 0).toFixed(1)}m · {Math.round(liveMarine.wave_period ?? 0)}s
                      </div>
                    )}
                  </div>

                  {/* Tile 4: Sea cleanliness */}
                  <div style={{ borderRadius:16, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.16)", padding:"14px 12px" }}>
                    <div style={{ fontSize:9, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:8 }}>
                      {({hr:"ČISTOĆA MORA",de:"MEERESQUALITÄT",en:"SEA QUALITY",it:"QUALITÀ MARE",pl:"CZYSTOŚĆ MORZA",si:"ČISTOST MORJA"})[dl]||"SEA QUALITY"}
                    </div>
                    <div style={{ fontSize:22, fontWeight:700, color:"#22c55e", marginBottom:4 }}>★★★★★</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#22c55e", marginBottom:4 }}>
                      {({hr:"Odlična",de:"Ausgezeichnet",en:"Excellent",it:"Eccellente",pl:"Doskonała",si:"Odlična"})[dl]||"Excellent"}
                    </div>
                    <div style={{ fontSize:9, color:"#475569", lineHeight:1.4 }}>EU Bathing Water Directive · Jadransko more</div>
                  </div>

                </div>
              )}

              {/* ── Parking CTA ── */}
              {liveLoadState === "done" && (
                <a href={`/ai?niche=camper&lang=${lang}${liveCity ? `&dest=${encodeURIComponent(liveCity)}` : ""}`}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12, padding:"13px 16px", borderRadius:14, background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.16)", textDecoration:"none" }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#fbbf24" }}>
                      🅿️ {({hr:"Parking blizu vas",de:"Parkplätze in der Nähe",en:"Parking near you",it:"Parcheggio vicino a te",pl:"Parking w pobliżu",si:"Parking v bližini"})[dl]||"Parking near you"}
                    </div>
                    <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>
                      {({hr:"Pitaj JADRAN AI →",de:"JADRAN AI fragen →",en:"Ask JADRAN AI →",it:"Chiedi JADRAN AI →",pl:"Zapytaj JADRAN AI →",si:"Vprašaj JADRAN AI →"})[dl]||"Ask JADRAN AI →"}
                    </div>
                  </div>
                  <span style={{ fontSize:18, color:"#fbbf24" }}>→</span>
                </a>
              )}

              {/* ── Source note ── */}
              {liveLoadState === "done" && (
                <div style={{ marginTop:10, fontSize:9, color:"#1e3a5f", textAlign:"center" }}>
                  Open-Meteo · Marine API · EU Bathing Water Directive 2023
                </div>
              )}

            </div>
          </div>
        </div>
      )}

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

    </div>
  );
}
