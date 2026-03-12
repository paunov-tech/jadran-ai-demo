// ═══════════════════════════════════════════════════════════════
// JADRAN — Shared data for both Guest App and Standalone AI
// NOTE: App.jsx keeps its own copy for safety. This is for StandaloneAI.
// ═══════════════════════════════════════════════════════════════

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const VIA = (id) => `https://www.viator.com/tours/${id}?pid=P00292197&mcid=42383&medium=link`;
const BKG = (city, params="") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

export const EXPERIENCES = [
  // Split & Dalmacija
  { id: 1, name: "Rafting Cetina", emoji: "🚣", price: 35, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    link: GYG("omis-l2096/rafting-on-cetina-river-from-omis-t35592") },
  { id: 2, name: "Kajak Night Glow", emoji: "🛶", price: 55, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    link: GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id: 3, name: "ATV Quad + Waterfall", emoji: "🏍️", price: 65, dur: "5h", rating: 4.9, cat: "adventure", region: "split",
    link: GYG("split-l268/split-atv-quad-tour-adventure-with-waterfall-swimming-t445566") },
  { id: 4, name: "Split Walking Tour", emoji: "🏛️", price: 25, dur: "2h", rating: 4.7, cat: "culture", region: "split",
    link: GYG("split-l268/split-walking-tour-t54976") },
  { id: 5, name: "Game of Thrones", emoji: "🐉", price: 60, dur: "2h", rating: 4.9, cat: "culture", region: "split",
    link: GYG("split-l268/split-private-game-of-thrones-tour-t899804") },
  { id: 6, name: "Blue Cave 5 Islands", emoji: "🏝️", price: 110, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676") },
  { id: 7, name: "Hvar + Pakleni Catamaran", emoji: "⛵", price: 89, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    link: GYG("split-l268/split-full-day-boat-trip-to-3-islands-w-lunch-snorkeling-t412889") },
  { id: 8, name: "Sunset Cruise", emoji: "🌅", price: 65, dur: "2h", rating: 5.0, cat: "premium", region: "split",
    link: GYG("split-l268/split-riviera-sunset-cruise-with-summer-vibes-t399715") },
  { id: 9, name: "Krka + Wine Tasting", emoji: "🍷", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "split",
    link: GYG("split-l268/day-tour-from-split-krka-waterfalls-tour-wine-tasting-t251842") },
  { id: 10, name: "Plitvice Lakes", emoji: "🌊", price: 75, dur: "12h", rating: 4.8, cat: "nature", region: "split",
    link: GYG("split-l268/from-split-plitvice-lakes-guided-tour-with-entry-tickets-t411976") },
  // Zadar & Šibenik
  { id: 11, name: "Krka Waterfalls", emoji: "💦", price: 55, dur: "8h", rating: 4.8, cat: "nature", region: "zadar",
    link: GYG("sibenik-l2091/krka-waterfalls-day-trip-from-sibenik-t75621") },
  { id: 12, name: "Kornati Islands", emoji: "🏝️", price: 85, dur: "10h", rating: 4.9, cat: "premium", region: "zadar",
    link: GYG("zadar-l936/zadar-kornati-national-park-full-day-boat-tour-t389218") },
  { id: 13, name: "Zadar Sunset Tour", emoji: "🌅", price: 35, dur: "2h", rating: 4.8, cat: "culture", region: "zadar",
    link: GYG("zadar-l936/zadar-old-town-sunset-walking-tour-t226044") },
  // Dubrovnik
  { id: 14, name: "Dubrovnik Walls Walk", emoji: "🏰", price: 45, dur: "2h", rating: 4.9, cat: "culture", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-old-town-and-city-walls-walking-tour-t50564") },
  { id: 15, name: "Elafiti Islands", emoji: "⛵", price: 55, dur: "8h", rating: 4.8, cat: "premium", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-elafiti-3-island-cruise-with-lunch-t97898") },
  { id: 16, name: "Mostar Day Trip", emoji: "🌉", price: 45, dur: "10h", rating: 4.7, cat: "culture", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-full-day-tour-of-mostar-t15584") },
  // Makarska
  { id: 17, name: "Biokovo Skywalk", emoji: "🏔️", price: 35, dur: "3h", rating: 4.8, cat: "nature", region: "makarska",
    link: GYG("makarska-l2098/biokovo-skywalk-guided-tour-t535283") },
  { id: 18, name: "Brač Island Ferry", emoji: "🏖️", price: 25, dur: "8h", rating: 4.7, cat: "adventure", region: "makarska",
    link: GYG("makarska-l2098?q=brac+island") },
  // Istra
  { id: 20, name: "Truffle Hunting", emoji: "🍄", price: 45, dur: "2h", rating: 4.9, cat: "gastro", region: "istra",
    link: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975") },
  { id: 21, name: "Istria in 1 Day", emoji: "🏰", price: 55, dur: "9h", rating: 4.7, cat: "culture", region: "istra",
    link: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468") },
  { id: 22, name: "Inner Istria + Food", emoji: "🫒", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "istra",
    link: GYG("pula-l344/istria-guided-tour-of-inner-istria-with-food-tasting-t408255") },
  { id: 23, name: "Pula Arena + Wine", emoji: "🏟️", price: 50, dur: "6h", rating: 4.7, cat: "culture", region: "istra",
    link: GYG("pula-l344/3-istrian-wineries-tour-t102866") },
  // Kvarner
  { id: 30, name: "Kvarner Bay Tour", emoji: "⚓", price: 55, dur: "5h", rating: 4.8, cat: "culture", region: "kvarner",
    link: GYG("opatija-l1296/best-of-kvarner-bay-half-day-tour-from-rijeka-or-opatija-t977515") },
  { id: 31, name: "Cres Island Boat", emoji: "🚢", price: 120, dur: "8h", rating: 4.9, cat: "premium", region: "kvarner",
    link: GYG("opatija-l1296?q=cres+island+boat") },
  { id: 32, name: "Opatija Evening Cruise", emoji: "🌙", price: 45, dur: "2h", rating: 4.8, cat: "premium", region: "kvarner",
    link: GYG("opatija-l1296?q=evening+cruise+kvarner") },
];

export const GEMS = [
  // Split area
  { name: "Uvala Vruja", emoji: "🏝️", region: "split", premium: false, type: "Tajna plaža", desc: "Između Omiša i Makarske, dostupna samo pješice. Kristalno more.", tip: "Ponesite vode i cipele za hodanje!" },
  { name: "Marjan špilje", emoji: "🕳️", region: "split", premium: false, type: "Šetnja", desc: "Starokršćanske špilje iz 5. st. Kašjuni → vrh Marjana.", tip: "Krenite u 17h za zalazak sunca." },
  { name: "Konoba Stari Mlin", emoji: "🍷", region: "split", premium: true, type: "Lokalna tajna", desc: "Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. ~80€/4 osobe.", tip: "Nazovite dan ranije." },
  { name: "Klis", emoji: "🏰", region: "split", premium: true, type: "Iskustvo", desc: "GoT tvrđava u zoru. Nema turista. Pogled na Split i otoke.", tip: "Dođite u 5:15, parking besplatan prije 8h." },
  { name: "Cetina", emoji: "🌊", region: "split", premium: true, type: "Kupanje", desc: "3km od Omiša, skriven prirodni bazen.", tip: "Skrenite desno kod mosta." },
  // Makarska
  { name: "Nugal", emoji: "🏖️", region: "makarska", premium: false, type: "Divlja plaža", desc: "Najljepša skrivena plaža Makarske rivijere. Strma staza 15min.", tip: "Obavezno sportske cipele, ne japanke!" },
  { name: "Biokovo svitanje", emoji: "🌄", region: "makarska", premium: true, type: "Iskustvo", desc: "Vožnja na Sveti Jure (1762m) za izlazak sunca. Pogled na Italiju.", tip: "Krenite u 4h, ponijeti jaknu." },
  // Zadar
  { name: "Saharun", emoji: "🏝️", region: "zadar", premium: false, type: "Rajska plaža", desc: "Dugi Otok — karipski pijesak usred Jadrana. Ferry iz Zadra.", tip: "Dođite ranim ferryjem, popodne gužva." },
  { name: "Telašćica", emoji: "🌊", region: "zadar", premium: true, type: "Priroda", desc: "Slano jezero + litice 150m. Dugi Otok, najdramatičniji pejzaž.", tip: "Kombinirajte sa Saharunom u isti dan." },
  // Dubrovnik
  { name: "Lokrum", emoji: "🏝️", region: "dubrovnik", premium: false, type: "Otok", desc: "10min brodom. Mrtvom more, botanički vrt, GoT Željezni Tron.", tip: "Zadnji brod u 18h — ne zakasnite!" },
  { name: "Buža Bar", emoji: "🍸", region: "dubrovnik", premium: true, type: "Bar na litici", desc: "Skriven u gradskim zidinama, ulaz kroz rupu u zidu. Kokteli nad morem.", tip: "Tražite malu rupu u zidu kod Sv. Stjepana." },
  // Istra
  { name: "Kamenjak", emoji: "🦕", region: "istra", premium: false, type: "Rt", desc: "Safari bar, skokovi u more, tragovi dinosaura. Južni vrh Istre.", tip: "Ulaz 6€/auto. Dođite prije 10h ljeti." },
  { name: "Motovun šuma", emoji: "🍄", region: "istra", premium: true, type: "Iskustvo", desc: "Najveća šuma tartufa u Europi. Mirisi, tišina, magla.", tip: "Najbolje u listopadu s lovcem na tartufe." },
  // Kvarner
  { name: "Lubenice", emoji: "🏖️", region: "kvarner", premium: false, type: "Plaža s pogledom", desc: "Cres — srednjovjekovno selo na litici 378m. Plaža dolje, raj gore.", tip: "Silazak 45min, vrijedi svake kapi znoja." },
  { name: "Vela Luka Krk", emoji: "🕳️", region: "kvarner", premium: true, type: "Špilja", desc: "Prastara špilja sa pogledom na more. Arheološko nalazište 20000 god.", tip: "Plaža odmah ispod špilje — kupanje poslije razgledanja." },
];

export const BOOKING_CITIES = [
  { region: "split", name: "Split & okolica", link: BKG("Split, Croatia") },
  { region: "makarska", name: "Makarska rivijera", link: BKG("Makarska, Croatia") },
  { region: "zadar", name: "Zadar & Šibenik", link: BKG("Zadar, Croatia") },
  { region: "dubrovnik", name: "Dubrovnik", link: BKG("Dubrovnik, Croatia") },
  { region: "istra", name: "Istra", link: BKG("Rovinj, Croatia") },
  { region: "kvarner", name: "Kvarner", link: BKG("Opatija, Croatia") },
];

// Region mapping: StandaloneAI region IDs → data region tags
export const REGION_MAP = {
  split: ["split"],
  makarska: ["makarska", "split"],   // Makarska also shows Split activities
  dubrovnik: ["dubrovnik"],
  zadar: ["zadar", "split"],          // Zadar also shows nearby Split
  istra: ["istra"],
  kvarner: ["kvarner"],
};

export const filterByRegion = (items, regionId) => {
  const regions = REGION_MAP[regionId] || [regionId];
  return items.filter(it => regions.includes(it.region));
};

// ═══════════════════════════════════════════════════════════════
// CAMPER BLACK SPOTS — Critical warnings that build trust
// These make the AI more valuable than Google Maps
// ═══════════════════════════════════════════════════════════════
export const CAMPER_WARNINGS = [
  { id: "biokovo", name: "Biokovo – Sveti Jure", region: "makarska", emoji: "⛰️", severity: "high",
    danger: "Put uzak, serpentine, dva auta se teško mimoilaze. Kamperi imaju zabranu ili rizik zaglavljivanja.",
    advice: "Ne krećite kamperom iznad ulaza u Park prirode. Parkirajte u podnožju i rezervirajte Guided Tour kombijem.",
    link: GYG("makarska-l2098/biokovo-skywalk-guided-tour-t535283") },
  { id: "rovinj", name: "Stari grad Rovinj", region: "istra", emoji: "🚫", severity: "medium",
    danger: "Rampe i kazne za kampere koji pokušavaju prići centru. Zoniranje je strogo.",
    advice: "Parking 'Valdibora' (sjever) ili 'Končeta'. Do crkve Sv. Eufemije biciklom ili taksijem, 5 min.",
    link: null },
  { id: "prizna", name: "Trajekt Prizna–Žigljen (Pag)", region: "kvarner", emoji: "🌬️", severity: "high",
    danger: "Jaka bura često zatvara liniju. Kamperi su prvi na udaru — zabrana pri vjetru >60 km/h.",
    advice: "Kad puše bura — ne idite na trajekt. Koristite Paški most, ali vozite polako kroz Senjsku dragu.",
    link: null },
  { id: "pitve", name: "Tunel Pitve (Hvar)", region: "split", emoji: "🚧", severity: "critical",
    danger: "Jedini put ka južnom Hvaru (Zavala, Ivan Dolac). Širina 2.3m, visina 2.4m. Većina kampera NE PROLAZI.",
    advice: "Vaš kamper je gotovo sigurno previsok. Ostavite vozilo u Jelsi i uzmite lokalni transfer na južne plaže.",
    link: null },
  { id: "trogir", name: "Centar Trogira – stari most", region: "split", emoji: "🌉", severity: "medium",
    danger: "Epske gužve, skretanje na Čiovo preko starog mosta je horor za velika vozila.",
    advice: "Koristite Novi most ('Most hrvatskih branitelja') da zaobiđete centar. Ušteda: 45 minuta.",
    link: null },
  { id: "senj", name: "Magistrala kod Senja (Vratnik)", region: "kvarner", emoji: "💨", severity: "high",
    danger: "Nagli pad temperature i udari bure. Kamperi s ceradama su najugroženiji.",
    advice: "Kad puše — svratite na Vratniku dok se vjetar ne smiri. Imaju parking za kampere.",
    link: null },
  { id: "vrbnik", name: "Vrbnik (Krk)", region: "kvarner", emoji: "🏘️", severity: "medium",
    danger: "Ulice toliko uske da su turistička atrakcija. GPS često navede kamper unutra — nema nazad bez dizalice.",
    advice: "Stanite na velikom parkingu na ulazu. Ne pokušavajte ulazak u stari grad. Do vinarije 5 min hoda.",
    link: null },
  { id: "stiniva", name: "Plaža Stiniva (Vis)", region: "split", emoji: "🏖️", severity: "medium",
    danger: "Put je strm i završava bez okretnice. Kamperom nećete doći do plaže.",
    advice: "Ostavite kamper kod skretanja za 'Marine Zemlje'. Stiniva je 20 min pješice. Ponijeti vodu!",
    link: GYG("vis-l4764?q=stiniva+boat") },
  { id: "cres", name: "Porozina–Dragozetići (Cres)", region: "kvarner", emoji: "⚠️", severity: "high",
    danger: "Put širok za jedno i pol vozilo, provalija bez bankine sa strane.",
    advice: "Pustite lokalce da prođu. Vozite sredinom, koristite proširenja. Pauza: Kamp Kovačine u Cresu.",
    link: BKG("Cres, Croatia") },
  { id: "krka", name: "NP Krka – Skradin parking", region: "zadar", emoji: "🅿️", severity: "medium",
    danger: "Skradin je često prebukiran i tijesan za manevrisanje kamp kućicom.",
    advice: "Idite na ulaz Lozovac — ogroman besplatan parking za kampere + direktan bus do slapova.",
    link: GYG("sibenik-l2091/krka-waterfalls-day-trip-from-sibenik-t75621") },
];

// ═══════════════════════════════════════════════════════════════
// ISTRA CAMPER INTELLIGENCE — Season-specific insider knowledge
// v2.1 — Based on experienced camper forum analysis
// ═══════════════════════════════════════════════════════════════
export const ISTRA_CAMPER_INTEL = [
  { id: "empty-camps", name: "Prazni kampovi — zatvorene usluge", emoji: "🏪", season: "pre", severity: "high",
    danger: "Veliki kampovi (Poreč, Umag) otvaraju 1. aprila, ali restorani, prodavnice i bazeni ne rade do maja.",
    advice: "Kamp je otvoren, ali najbliža prodavnica je 2km. Obavi nabavku PRIJE ulaska u kamp." },
  { id: "amperage", name: "Problem struje — amperaža", emoji: "⚡", season: "pre", severity: "medium",
    danger: "Stariji kampovi u unutrašnjosti Istre imaju limit 6A ili 10A. Grejalice izbijaju osigurače.",
    advice: "Provjeri jačinu osigurača na parceli. U predsezoni koristi plinsko grijanje (Truma) — ne preopterećuj mrežu." },
  { id: "mud", name: "Blato — terra rossa", emoji: "🌧️", season: "pre", severity: "high",
    danger: "Istarska crljenica postaje klizava i ljepljiva. Kamperi preko 3.5t tonu na travnatim parcelama.",
    advice: "Ako je padala kiša u zadnja 24h — traži ISKLJUČIVO šljunčane (gravel) parcele, pogotovo oko Umaga i Savudrije." },
  { id: "ypsilon", name: "Istarski Ipsilon — vjetar na vijaduktu", emoji: "🌬️", season: "all", severity: "medium",
    danger: "Mostovi na Ipsilonu (Limska draga) osjetljivi na bočni vjetar. Kategorizacija vozila zbunjuje na naplati.",
    advice: "Pazi na bočni vjetar na vijaduktu Limska draga. Tvoj kamper je vjerovatno III kategorija (viši od 1.9m + dvoosovina) — pripremi karticu." },
  { id: "pula-parking", name: "Pula Arena — parking zamka", emoji: "🅿️", season: "all", severity: "medium",
    danger: "Parking 'Karolina' kod Arene često zabranjen za kampere. Kazna 60€.",
    advice: "NE idi na Karolinu! Koristi parking 'Gregovica' (besplatan, prostran) ili 'Pula Gate'. Bolje Bolt do Arene nego kazna." },
  { id: "water-fill", name: "Dopuna vode — fontane", emoji: "💧", season: "pre", severity: "low",
    danger: "U aprilu neki kampovi još nisu pustili vodu na svaku parcelu zbog straha od mraza.",
    advice: "Javne česme u unutrašnjosti: Svetvinčenat, Grožnjan, Motovun — besplatna tehnička voda za kanistere." },
  { id: "wild-camping", name: "Divlji kamp — stroge kontrole", emoji: "🚨", season: "all", severity: "critical",
    danger: "Istra ima NAJSTROŽE kontrole u Hrvatskoj. Kazne do 400€. Policija i komunalni aktivni čak na pustim plažama.",
    advice: "Strogo zabranjeno spavanje van kampa! Radije izaberi mali OPG (obiteljsko gospodarstvo) koji nudi parking — jeftinije i legalno." },
];

// ═══════════════════════════════════════════════════════════════
// REGIONAL DEEP-LOCAL INTELLIGENCE — Pro-Camper Expert
// Knowledge not available on standard maps
// ═══════════════════════════════════════════════════════════════

// ═══ NAUTICAL DATA ═══
export const MARINAS = [
  // Istra
  { name: "ACI Marina Rovinj", region: "istra", lat: 45.08, lon: 13.64, berths: 390, maxLen: "40m", vhf: 17, fuel: true, water: true, electric: true, price: "3.0-5.5€/m", wifi: true, note: "Zaštićena od svih vjetrova osim juga. Restoran na rivi odličan." },
  { name: "ACI Marina Pula", region: "istra", lat: 44.87, lon: 13.85, berths: 213, maxLen: "35m", vhf: 17, fuel: true, water: true, electric: true, price: "2.5-4.5€/m", wifi: true, note: "Blizu Arene. Otvorena jugu — pri najavi prebaci se u Veruda." },
  { name: "Marina Veruda", region: "istra", lat: 44.83, lon: 13.85, berths: 630, maxLen: "50m", vhf: 17, fuel: true, water: true, electric: true, price: "3.5-6.0€/m", wifi: true, note: "Najveća marina u Istri. Odlična zaštita. Supermarket 200m." },
  // Kvarner
  { name: "ACI Marina Cres", region: "kvarner", lat: 44.96, lon: 14.41, berths: 462, maxLen: "30m", vhf: 17, fuel: true, water: true, electric: true, price: "2.0-3.5€/m", wifi: true, note: "Mirna marina. Grad Cres na pješačkoj udaljenosti. Dobar za obitelji." },
  { name: "ACI Marina Supetarska Draga", region: "kvarner", lat: 44.79, lon: 14.74, berths: 280, maxLen: "25m", vhf: 17, fuel: false, water: true, electric: true, price: "2.0-3.0€/m", wifi: true, note: "Rab — mirno sidrište. Pijesak Lopar 10 min autom." },
  // Split
  { name: "ACI Marina Split", region: "split", lat: 43.51, lon: 16.44, berths: 355, maxLen: "60m", vhf: 17, fuel: true, water: true, electric: true, price: "3.5-7.0€/m", wifi: true, note: "Centar Splita, Dioklecijanova 5 min. Skupo ljeti ali lokacija neprocjenjiva." },
  { name: "Marina Kaštela", region: "split", lat: 43.55, lon: 16.38, berths: 420, maxLen: "25m", vhf: 17, fuel: true, water: true, electric: true, price: "2.0-3.5€/m", wifi: true, note: "15 min od Splita, upola jeftinije. Taxi boat do grada." },
  { name: "ACI Marina Milna", region: "split", lat: 43.33, lon: 16.45, berths: 197, maxLen: "30m", vhf: 17, fuel: true, water: true, electric: true, price: "2.5-4.0€/m", wifi: true, note: "Brač — najzaštićenija luka na otoku. Konoba Palma na rivi." },
  // Dubrovnik
  { name: "ACI Marina Dubrovnik", region: "dubrovnik", lat: 42.66, lon: 18.06, berths: 425, maxLen: "60m", vhf: 17, fuel: true, water: true, electric: true, price: "4.0-8.0€/m", wifi: true, note: "Komolac, 6km od starog grada. Bus 1A do Pila vrata." },
  // Zadar
  { name: "Marina Dalmacija Sukošan", region: "zadar", lat: 44.04, lon: 15.30, berths: 1200, maxLen: "40m", vhf: 17, fuel: true, water: true, electric: true, price: "2.5-4.0€/m", wifi: true, note: "Najveća marina na Jadranu! Kornati na dohvat ruke." },
  { name: "ACI Marina Žut", region: "zadar", lat: 43.87, lon: 15.29, berths: 120, maxLen: "20m", vhf: 17, fuel: false, water: true, electric: true, price: "2.0-3.0€/m", wifi: false, note: "Kornati — potpuna tišina. Restoran Goro jedina opcija ali vrhunski." },
];

export const ANCHORAGES = [
  // Free/cheap anchorages (sidrišta)
  { name: "Palmižana", region: "split", lat: 43.16, lon: 16.39, depth: "5-12m", bottom: "pijesak", shelter: "Z,JZ,J", fee: "besplatno", note: "Pakleni otoci. Tirkizno more, konoba Meneghello." },
  { name: "Uvala Stiniva", region: "split", lat: 43.16, lon: 16.17, depth: "8-15m", bottom: "pijesak", shelter: "Z,SZ", fee: "besplatno", note: "Vis — najljepša plaža na svijetu. Sidri ispred, pliva do obale." },
  { name: "Uvala Srebrna", region: "split", lat: 43.17, lon: 16.18, depth: "6-10m", bottom: "pijesak/trava", shelter: "J,JZ", fee: "besplatno", note: "Vis — mirno sidrište, konoba na plaži." },
  { name: "Luka Polače", region: "dubrovnik", lat: 42.79, lon: 17.23, depth: "4-10m", bottom: "mulj", shelter: "svi osim JI", fee: "NP Mljet ulaz", note: "Mljet — rimske ruševine, jezera 2km. Boja 30€/noć ili sidro." },
  { name: "Telašćica", region: "zadar", lat: 43.88, lon: 15.16, depth: "6-15m", bottom: "pijesak/mulj", shelter: "svi vjetrovi", fee: "PP ulaz ~20€", note: "Dugi otok — potpuna zaštita. Slano jezero, strmci 160m." },
  { name: "Uvala Sakarun", region: "zadar", lat: 44.13, lon: 14.87, depth: "4-8m", bottom: "pijesak", shelter: "J,JZ,Z", fee: "besplatno", note: "Dugi otok — 'Hrvatski Karibi'. Plitko tirkizno more." },
  { name: "Limski kanal", region: "istra", lat: 45.13, lon: 13.72, depth: "10-30m", bottom: "mulj", shelter: "svi vjetrovi", fee: "besplatno", note: "Fjord usred Istre. Viking bar na klifi, kamenice s uzgajališta." },
];

export const CRUISE_PORTS = [
  { name: "Split - Gradska luka", city: "Split", region: "split", terminal: "Da", shuttle: "Nije potreban — Dioklecijanova 200m", maxShips: 2, tipTime: "07:00-19:00",
    mustSee: "Dioklecijanova palača (5 min), Riva, Marjan park (20 min šetnje), Bačvice plaža",
    avoid: "Taxi od terminala — sve je pješačko! Izbjegavajte restorane na samoj Rivi (turistička cijena).",
    foodTip: "Konoba Fetivi (3 min od luke, lokalna cijena) ili Tržnica (Pazar) za svježe voće.",
    shopping: "Hajduk shop za suvenire, Tržnica za lavandu i pršut.",
    timePlan: "09:00 Palača → 10:30 Marjan → 12:00 Ručak Fetivi → 13:30 Bačvice → 15:00 Tržnica → 16:30 Riva kava" },
  { name: "Dubrovnik - Gruž", city: "Dubrovnik", region: "dubrovnik", terminal: "Da", shuttle: "Bus 1A/1B do Pila vrata (2€, 15 min)", maxShips: 4, tipTime: "07:00-18:00",
    mustSee: "Gradske zidine (35€ rano ujutro!), Stradun, Minčeta, Buža bar (kava na stijenama)",
    avoid: "Zidine poslijepodne (gužva + sunce). Cable car skup (27€) — Srđ pješice 30 min ako ste fit.",
    foodTip: "Lokrum otok (15 min brodom, 22€ return) — mir od gužve + plaža nudista.",
    shopping: "Dubrovačka tržnica za lavandu. Izbjegavajte GoT suvenire na Stradunu — duplo skuplje.",
    timePlan: "08:00 Zidine (manje gužve!) → 10:00 Stradun → 11:00 Lokrum → 14:00 Buža bar → 16:00 Shopping → 17:00 Gruž" },
  { name: "Zadar", city: "Zadar", region: "zadar", terminal: "Ne — tender", shuttle: "Iskrcaj na Rivi, sve pješke", maxShips: 1, tipTime: "08:00-17:00",
    mustSee: "Morske orgulje (besplatno!), Pozdrav suncu, Sv. Donat, Forum",
    avoid: "Taxi na Rivi — sve je unutar 15 min pješačenja.",
    foodTip: "Tržnica za sir i pršut (Paški sir 15€/kg). Restoran Pet bunara za fine dining.",
    shopping: "Maraschino liker (originalni, samo u Zadru). Lavanda, maslinovo ulje.",
    timePlan: "08:30 Orgulje + Pozdrav suncu → 10:00 Forum + Sv.Donat → 11:30 Tržnica → 12:30 Ručak → 14:00 Šetnja zidinama → 16:00 Kava na Rivi" },
  { name: "Kotor (Montenegro)", city: "Kotor", region: "dubrovnik", terminal: "Da — ali često tender", shuttle: "Iskrcaj kod starog grada", maxShips: 2, tipTime: "07:00-18:00",
    mustSee: "Tvrđava Sv.Ivana (1350 stepenica — krenite RANO!), Stari grad, Gospa od Škrpjela (boat 5€)",
    avoid: "Popodnevni uspon na tvrđavu — vrućina je ubojita. Krenite u 8h!",
    foodTip: "Konoba Scala Santa (skrivena u starom gradu). Crnogorski pršut + vranac vino.",
    shopping: "Crnogorsko maslinovo ulje jeftinije nego u HR.",
    timePlan: "08:00 Tvrđava (dok je hladno!) → 10:30 Stari grad → 12:00 Ručak → 13:30 Gospa od Škrpjela → 15:00 Perast → 17:00 Povratak" },
];

export const DEEP_LOCAL = {
  istra: [
    { id: "limski", spot: "Kanfanar – Limski kanal", emoji: "🛣️", 
      intel: "Ako planiraš silazak u Limski kanal sa vozilom dužim od 7m, kreni isključivo rano ujutru. Mimoilaženje sa turističkim autobusima na lakat-krivinama je nemoguće bez rikverca na usponu." },
    { id: "bale", spot: "Bale – Mon Perin", emoji: "💧",
      intel: "Parking kod kampa Mon Perin ima odličan pritisak vode za brzo punjenje rezervoara — retkost u regiji." },
    { id: "kamenjak-dust", spot: "Rt Kamenjak – prašina", emoji: "💨",
      intel: "U aprilu/maju ako je suho, 'istarska prašina' (sitni pesak) ulazi u otvore frižidera i ventilacije. Zatvori spoljne otvore PRIJE ulaska na makadam." },
  ],
  kvarner: [
    { id: "krk-bura", spot: "Krk – Draga Baščanska", emoji: "🌬️",
      intel: "Nikada ne koristi stari put kroz Dragu Bašćansku ako je najavljena bura preko 40 km/h. Udari su bočni i mogu prevrnuti visoki kamper (H3/L4). Koristi isključivo glavni pravac." },
    { id: "cres-ferry", spot: "Cres – trajekt rampa", emoji: "⛴️",
      intel: "Na trajektu Porozina–Brestova, rampe su strme. Ako imaš niski zadnji prepust (kamper s garažom), ulazi dijagonalno da ne oštetiš šasiju." },
    { id: "rijeka-delta", spot: "Rijeka – parking Delta", emoji: "🅿️",
      intel: "Jedini siguran parking za kampere blizu centra je Delta. Ali ulaz je uzak i automati često ne prihvataju strane kartice — imaj keš (eura) spreman." },
    { id: "rab-lopar", spot: "Rab – Lopar Sahara plaža", emoji: "🏖️",
      intel: "Jedina pješčana plaža na Kvarneru. Parking za kampere 200m od plaže (5€/dan). Ranim jutrom imaš plažu za sebe — poslije 10h gužva. Pijesak je plitak, more naglo duboko nakon 20m." },
    { id: "opatija-ulaz", spot: "Opatija – zabrana kampera", emoji: "🚫",
      intel: "Centar Opatije je zabranjen za vozila preko 3.5t! Parking Tržnica prima kampere do 7m, ali puni se do 09:00 ljeti. Alternativa: camp Preluk (3km) + bus linija 32." },
    { id: "krk-most", spot: "Krčki most – bura", emoji: "🌉",
      intel: "Krčki most se zatvara za vozila s ceradom i kampere III kategorije pri buri >60 km/h. Provjeri HAK info prije polaska. Alternativa: trajekt Crikvenica-Šilo (15 min, češće vozi)." },
    { id: "cres-voda", spot: "Cres – Vransko jezero", emoji: "💧",
      intel: "Voda na Cresu dolazi iz Vranskog jezera — jedini izvor na otoku. Ljeti nestašica! Kamp Kovačine ima dump station ali ponekad ograniči slavine. Napuni spremnike u Rijeci ili na kopnu." },
    { id: "vrbnik-vino", spot: "Vrbnik – Žlahtina", emoji: "🍷",
      intel: "Autohtono bijelo vino samo iz Vrbnika. Katica konoba u najužoj ulici na svijetu (43cm) — stolovi vani, pogled na more. Vino 3€/čaša. Parking na ulazu u selo, 300m pješke." },
    { id: "losinjski", spot: "Mali Lošinj – delfini", emoji: "🐬",
      intel: "U kanalu između Cresa i Lošinja živi rezidentna populacija od ~180 dupina. Najčešće viđenje: ujutro 7-9h kod Nerezina. Blue World institut nudi boat tour za praćenje (50€)." },
    { id: "bakar-tunel", spot: "Tunel Učka", emoji: "🚇",
      intel: "Tunel Učka (5km) spaja Istru i Kvarner. Cestarina za kampere: 8-12€ ovisno o kategoriji. Visina tunela 4.5m — dovoljno za sve kampere. Ali ventilacija je loša — zatvori prozore." },
  ],
  split: [
    { id: "dubci", spot: "Omiška rivijera – prevoj Dubci", emoji: "🌬️",
      intel: "Prevoj Dubci (magistrala → autoput) je točka gdje vjetar ubrzava. Ako voziš kamper s ceradom, uspori na 40 km/h." },
    { id: "brac-vidova", spot: "Brač – Vidova Gora uspon", emoji: "⛰️",
      intel: "Uspon je asfaltiran, ali zadnjih 500m je usko. Ako vidiš drugi kamper da se spušta, stani na prvom proširenju. Nema mjesta za dvoje." },
    { id: "split-marjan", spot: "Split – Marjan parking", emoji: "🚫",
      intel: "Nikako ne pokušavaj parkirati oko Marjana — pauk služba u Splitu ciljano podiže kampere! Koristi kamp Stobreč, pa Uberom do Dioklecijanove palače." },
    { id: "makarska-vruja", spot: "Makarska – vidikovac Vruja", emoji: "👮",
      intel: "Na vidikovcu Vruja često stoji policija koja zabranjuje zadržavanje duže od 15 min. Za kavu s pogledom, koristi parking iznad Brela." },
  ],
  zadar: [
    { id: "dubci-zadar", spot: "Omiška rivijera – prevoj Dubci", emoji: "🌬️",
      intel: "Prevoj Dubci: vjetar ubrzava na spoju magistrale i autoputa. Kamperi s ceradom — uspori na 40 km/h." },
  ],
  makarska: [
    { id: "makarska-vruja2", spot: "Vidikovac Vruja", emoji: "👮",
      intel: "Policija na Vruji zabranjuje zadržavanje duže od 15 min. Za pauzu s pogledom — parking iznad Brela." },
    { id: "dubci-mak", spot: "Prevoj Dubci", emoji: "🌬️",
      intel: "Bočni vjetar na prevoju Dubci — kamperi s ceradom sporo, 40 km/h max." },
  ],
};

// ═══════════════════════════════════════════════════════════════
// DUBROVNIK & PELJEŠAC — Survival Guide for Campers
// ═══════════════════════════════════════════════════════════════
export const DUBROVNIK_INTEL = [
  { id: "stari-grad", spot: "Stari grad Dubrovnik (Pile/Ploče)", emoji: "🚫", severity: "critical",
    intel: "NIKADA ne pokušavaj prići zidinama kamperom. Kazne astronomske, okretanje nemoguće. Koristi Kamp Solitudo (Babin Kuk) ili Kamp Kate (Župa Dubrovačka), pa Libertas bus ili brodski transfer do Starog grada." },
  { id: "srdj", spot: "Brdo Srđ — pogled na grad", emoji: "⛰️", severity: "high",
    intel: "NE vozi kamperom preko sela Bosanka do Srđa! Put širok za jedno vozilo, pun taksista. Parkiraj u Gružu i uzmi Dubrovačku žičaru (Cable Car) — bolji pogled, bez stresa.",
    link: GYG("dubrovnik-l518/dubrovnik-cable-car-ride-ticket-t419614") },
  { id: "tudman-most", spot: "Most dr. Franje Tuđmana", emoji: "🌬️", severity: "high",
    intel: "Ovaj most se PRVI zatvara za kampere i prikolice na prve udare bure. Uvijek provjeri meteo prije ulaska u Dubrovnik. Alternativa: stari put kroz Rijeku Dubrovačku (Mokošica)." },
  { id: "peljesac-most", spot: "Pelješki most — sloboda od granice", emoji: "🌉", severity: "low",
    intel: "Više ne moraš kroz Neum (BiH) — nema gubitka vremena na pasoškoj kontroli! Most je BESPLATAN. Na Pelješcu obavezno: degustacija Mali Plavac + stonske kamenice.",
    link: GYG("ston-l4159/ston-oyster-and-wine-tasting-tour-t197562") },
  { id: "mljet-trajekt", spot: "Trajekt za Mljet (Prapratno)", emoji: "⛴️", severity: "medium",
    intel: "NP Mljet je hit ali trajekt ljeti krcat. Ostavi kamper na parkingu na Pelješcu, idi kao pješak (jeftinije i brže). Na Mljetu — najam bicikala za obilazak jezera.",
    link: GYG("dubrovnik-l518/dubrovnik-mljet-national-park-full-day-tour-t97898") },
];
