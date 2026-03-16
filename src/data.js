// ═══════════════════════════════════════════════════════════════
// JADRAN — Shared data for both Guest App and Standalone AI
// NOTE: App.jsx keeps its own copy for safety. This is for StandaloneAI.
// ═══════════════════════════════════════════════════════════════

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const VIA = (id) => `https://www.viator.com/tours/${id}?pid=P00292197&mcid=42383&medium=link`;
const BKG = (city, params="") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

// NOTE: Prices are approximate starting prices. Actual prices vary by season and availability.
// Ratings removed — were fabricated. Link to GYG for real ratings.
export const EXPERIENCES = [
  // Split & Dalmacija
  { id: 1, name: "Rafting Cetina", emoji: "🚣", price: 35, dur: "3h", rating: 0, cat: "adventure", region: "split",
    link: GYG("omis-l2096/rafting-on-cetina-river-from-omis-t35592") },
  { id: 2, name: "Kajak Night Glow", emoji: "🛶", price: 55, dur: "3h", rating: 0, cat: "adventure", region: "split",
    link: GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id: 3, name: "ATV Quad + Waterfall", emoji: "🏍️", price: 65, dur: "5h", rating: 0, cat: "adventure", region: "split",
    link: GYG("split-l268/activity-tc1/?q=atv+quad+waterfall") },
  { id: 4, name: "Split Walking Tour", emoji: "🏛️", price: 25, dur: "2h", rating: 0, cat: "culture", region: "split",
    link: GYG("split-l268/split-walking-tour-t54976") },
  { id: 5, name: "Game of Thrones", emoji: "🐉", price: 60, dur: "2h", rating: 0, cat: "culture", region: "split",
    link: GYG("split-l268/activity-tc1/?q=game+of+thrones") },
  { id: 6, name: "Blue Cave 5 Islands", emoji: "🏝️", price: 110, dur: "10h", rating: 0, cat: "premium", region: "split",
    link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676") },
  { id: 7, name: "Hvar + Pakleni Catamaran", emoji: "⛵", price: 89, dur: "10h", rating: 0, cat: "premium", region: "split",
    link: GYG("split-l268/split-full-day-boat-trip-to-3-islands-w-lunch-snorkeling-t412889") },
  { id: 8, name: "Sunset Cruise", emoji: "🌅", price: 65, dur: "2h", rating: 0, cat: "premium", region: "split",
    link: GYG("split-l268/cruises-boat-tours-tc48/?q=sunset+cruise") },
  { id: 9, name: "Krka + Wine Tasting", emoji: "🍷", price: 65, dur: "8h", rating: 0, cat: "gastro", region: "split",
    link: GYG("split-l268/day-tour-from-split-krka-waterfalls-tour-wine-tasting-t251842") },
  { id: 10, name: "Plitvice Lakes", emoji: "🌊", price: 75, dur: "12h", rating: 0, cat: "nature", region: "split",
    link: GYG("split-l268/from-split-plitvice-lakes-guided-tour-with-entry-tickets-t411976") },
  // Zadar & Šibenik
  { id: 11, name: "Krka Waterfalls", emoji: "💦", price: 55, dur: "8h", rating: 0, cat: "nature", region: "zadar",
    link: GYG("sibenik-l2091/krka-waterfalls-day-trip-from-sibenik-t75621") },
  { id: 12, name: "Kornati Islands", emoji: "🏝️", price: 85, dur: "10h", rating: 0, cat: "premium", region: "zadar",
    link: GYG("zadar-l936/zadar-kornati-national-park-full-day-boat-tour-t389218") },
  { id: 13, name: "Zadar Sunset Tour", emoji: "🌅", price: 35, dur: "2h", rating: 0, cat: "culture", region: "zadar",
    link: GYG("zadar-l936/zadar-old-town-sunset-walking-tour-t226044") },
  // Dubrovnik
  { id: 14, name: "Dubrovnik Walls Walk", emoji: "🏰", price: 45, dur: "2h", rating: 0, cat: "culture", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-old-town-and-city-walls-walking-tour-t50564") },
  { id: 15, name: "Elafiti Islands", emoji: "⛵", price: 55, dur: "8h", rating: 0, cat: "premium", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-elafiti-3-island-cruise-with-lunch-t97898") },
  { id: 16, name: "Mostar Day Trip", emoji: "🌉", price: 45, dur: "10h", rating: 0, cat: "culture", region: "dubrovnik",
    link: GYG("dubrovnik-l518/dubrovnik-full-day-tour-of-mostar-t15584") },
  // Makarska
  { id: 17, name: "Biokovo Skywalk", emoji: "🏔️", price: 35, dur: "3h", rating: 0, cat: "nature", region: "makarska",
    link: GYG("makarska-l2098/biokovo-skywalk-guided-tour-t535283") },
  { id: 18, name: "Brač Golden Horn", emoji: "🏖️", price: 35, dur: "8h", rating: 0, cat: "adventure", region: "makarska",
    link: GYG("split-l268/cruises-boat-tours-tc48/?q=golden+horn+brac") },
  // Istra
  { id: 20, name: "Truffle Hunting", emoji: "🍄", price: 45, dur: "2h", rating: 0, cat: "gastro", region: "istra",
    link: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975") },
  { id: 21, name: "Istria in 1 Day", emoji: "🏰", price: 55, dur: "9h", rating: 0, cat: "culture", region: "istra",
    link: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468") },
  { id: 22, name: "Inner Istria + Food", emoji: "🫒", price: 65, dur: "8h", rating: 0, cat: "gastro", region: "istra",
    link: GYG("pula-l344/food-drink-tc6/?q=inner+istria+food") },
  { id: 23, name: "Pula Arena + Wine", emoji: "🏟️", price: 50, dur: "6h", rating: 0, cat: "culture", region: "istra",
    link: GYG("pula-l344/food-drink-tc6/?q=istrian+wineries") },
  // Kvarner
  { id: 30, name: "Kvarner Bay Tour", emoji: "⚓", price: 55, dur: "5h", rating: 0, cat: "culture", region: "kvarner",
    link: GYG("opatija-l1296/cruises-boat-tours-tc48/?q=kvarner+islands") },
  { id: 31, name: "Cres Island Boat", emoji: "🚢", price: 120, dur: "8h", rating: 0, cat: "premium", region: "kvarner",
    link: GYG("rijeka-l1298/activity-tc1/?q=cres+losinj+island") },
  { id: 32, name: "Opatija Evening Cruise", emoji: "🌙", price: 45, dur: "2h", rating: 0, cat: "premium", region: "kvarner",
    link: GYG("opatija-l1296/cruises-boat-tours-tc48/?q=sunset+boat") },
  // ═══ VIATOR — Shore Excursions & Skip-the-Line ═══
  { id: 40, name: "Dubrovnik Shore Excursion + Cavtat", emoji: "🚢", price: 85, dur: "4h", rating: 0, cat: "premium", region: "dubrovnik",
    link: VIA("Dubrovnik/Dubrovnik-Shore-Excursion-Private-Tour-of-Dubrovnik-and-Cavtat/d904-5360PRTDBVCAVTAT") },
  { id: 41, name: "GoT Tour + City Walls (Skip Line)", emoji: "🏰", price: 55, dur: "3h", rating: 0, cat: "culture", region: "dubrovnik",
    link: VIA("Dubrovnik/Dubrovnik-Shore-Excursion-Viator-Exclusive-Game-of-Thrones-Tour/d904-5360PRTDBGOT") },
  { id: 42, name: "Dubrovnik Cable Car + Old Town Tour", emoji: "🚡", price: 65, dur: "3.5h", rating: 0, cat: "culture", region: "dubrovnik",
    link: VIA("Dubrovnik/Dubrovnik-Shore-Excursion-The-Cruise-Ship-Passenger-Tour/d904-100763P6") },
  { id: 43, name: "Dubrovnik Srđ Panorama + Old Town", emoji: "🏔️", price: 95, dur: "4h", rating: 0, cat: "premium", region: "dubrovnik",
    link: VIA("Dubrovnik/Dubrovnik-Above-and-Beyond-Srdj-hill-panorama-and-guided-Old-Town-SHORE-EXCURSION/d904-71079P8") },
  { id: 44, name: "Split Walking Tour Shore Excursion", emoji: "🏛️", price: 30, dur: "2h", rating: 0, cat: "culture", region: "split",
    link: VIA("Split/Split-Walking-Tour/d562-5765P1") },
  { id: 45, name: "Krka Falls from Cruise Port", emoji: "🌊", price: 75, dur: "8h", rating: 0, cat: "adventure", region: "zadar",
    link: VIA("Sibenik/Krka-Waterfalls-Day-Trip/d4400-5158KRKA") },
  { id: 46, name: "Montenegro Day Trip from Dubrovnik", emoji: "🇲🇪", price: 55, dur: "10h", rating: 0, cat: "adventure", region: "dubrovnik",
    link: VIA("Dubrovnik/Dubrovnik-to-Montenegro-Day-Trip/d904-3658MONTE") },
  // ═══ GAP FILL — Makarska ═══
  { id: 50, name: "Makarska 3-Island Speedboat", emoji: "🚤", price: 65, dur: "5h", rating: 0, cat: "adventure", region: "makarska",
    link: GYG("makarska-l2098/cruises-boat-tours-tc48/?q=speedboat+cave+blue+lagoon") },
  { id: 51, name: "Makarska Kayak Tour", emoji: "🛶", price: 45, dur: "3h", rating: 0, cat: "adventure", region: "makarska",
    link: VIA("Makarska/Kayaking-tour-in-beautiful-Makarska/d31483-315512P1") },
  { id: 52, name: "Cetina River Boat + Lunch", emoji: "🏞️", price: 85, dur: "8h", rating: 0, cat: "nature", region: "makarska",
    link: VIA("Makarska/Omis-and-river-Cetina-Day-Trip-from-Makarska-Riviera/d31483-5690P20") },
  { id: 53, name: "Hvar & Brač Boat Day Trip", emoji: "🏝️", price: 55, dur: "9h", rating: 0, cat: "premium", region: "makarska",
    link: GYG("makarska-l2098/cruises-boat-tours-tc48/?q=hvar+brac+boat") },
  // ═══ GAP FILL — Zadar ═══
  { id: 54, name: "Zadar Sunset Kayak", emoji: "🛶", price: 35, dur: "2.5h", rating: 0, cat: "adventure", region: "zadar",
    link: GYG("zadar-l936/water-sports-tc52/?q=kayak+sunset") },
  { id: 55, name: "Zrmanja River Rafting", emoji: "🏞️", price: 55, dur: "4h", rating: 0, cat: "adventure", region: "zadar",
    link: GYG("zadar-l936/activity-tc1/?q=zrmanja+rafting") },
  { id: 56, name: "Zadar Food & Wine Walk", emoji: "🍷", price: 65, dur: "3h", rating: 0, cat: "gastro", region: "zadar",
    link: GYG("zadar-l936/food-drink-tc6/?q=food+wine+walking") },
  { id: 57, name: "Pag Island Cheese & Salt", emoji: "🧀", price: 70, dur: "8h", rating: 0, cat: "gastro", region: "zadar",
    link: GYG("zadar-l936/activity-tc1/?q=pag+island+cheese+wine") },
  // ═══ GAP FILL — Istra ═══
  { id: 58, name: "Rovinj Sunset Boat Tour", emoji: "🌅", price: 35, dur: "1.5h", rating: 0, cat: "premium", region: "istra",
    link: GYG("rovinj-l1299/cruises-boat-tours-tc48/?q=sunset+boat") },
  { id: 59, name: "Pula Kayak & Snorkel Caves", emoji: "🛶", price: 45, dur: "3h", rating: 0, cat: "adventure", region: "istra",
    link: GYG("pula-l344/water-sports-tc52/?q=kayak+snorkel+caves") },
  { id: 60, name: "Istria Olive Oil & Wine", emoji: "🫒", price: 60, dur: "5h", rating: 0, cat: "gastro", region: "istra",
    link: GYG("porec-l1300/food-drink-tc6/?q=olive+oil+wine+truffle") },
  { id: 61, name: "Brijuni National Park Boat", emoji: "🦌", price: 40, dur: "4h", rating: 0, cat: "nature", region: "istra",
    link: GYG("pula-l344/cruises-boat-tours-tc48/?q=brijuni+national+park") },
  // ═══ GAP FILL — Kvarner ═══
  { id: 62, name: "Rab Island Day Trip", emoji: "🏖️", price: 45, dur: "8h", rating: 0, cat: "adventure", region: "kvarner",
    link: GYG("krk-l4158/cruises-boat-tours-tc48/?q=rab+island") },
  { id: 63, name: "Krk Wine & Olive Oil Tour", emoji: "🍷", price: 55, dur: "4h", rating: 0, cat: "gastro", region: "kvarner",
    link: GYG("krk-l4158/food-drink-tc6/?q=wine+olive+oil") },
  { id: 64, name: "Cres Dolphin Watching", emoji: "🐬", price: 50, dur: "3h", rating: 0, cat: "nature", region: "kvarner",
    link: GYG("opatija-l1296/cruises-boat-tours-tc48/?q=dolphin+losinj") },
  // ═══ GAP FILL — Split extras ═══
  { id: 65, name: "Split Kayak Night Glow", emoji: "🛶", price: 40, dur: "2h", rating: 0, cat: "adventure", region: "split",
    link: GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id: 66, name: "Split Food & Wine Walk", emoji: "🍷", price: 75, dur: "3h", rating: 0, cat: "gastro", region: "split",
    link: GYG("split-l268/food-drink-tc6/?q=food+wine+walking") },
  { id: 67, name: "Omiš Zipline Adventure", emoji: "🎢", price: 40, dur: "2.5h", rating: 0, cat: "adventure", region: "split",
    link: GYG("omis-l2096/activity-tc1/?q=zipline+cetina") },
  // ═══ GAP FILL — Dubrovnik extras ═══
  { id: 68, name: "Dubrovnik Kayak + Snorkel", emoji: "🛶", price: 35, dur: "3h", rating: 0, cat: "adventure", region: "dubrovnik",
    link: GYG("dubrovnik-l518/water-sports-tc52/?q=kayak+snorkel") },
  { id: 69, name: "Ston Oysters + Pelješac Wine", emoji: "🦪", price: 85, dur: "8h", rating: 0, cat: "gastro", region: "dubrovnik",
    link: GYG("dubrovnik-l518/food-drink-tc6/?q=peljesac+wine+oyster") },
  { id: 70, name: "Lokrum Island Half Day", emoji: "🏝️", price: 22, dur: "4h", rating: 0, cat: "nature", region: "dubrovnik",
    link: GYG("dubrovnik-l518/cruises-boat-tours-tc48/?q=lokrum+island") },
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
    link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676") },
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
  { name: "ACI Marina Rovinj", region: "istra", lat: 45.08, lon: 13.64, berths: 196, maxLen: "35m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Zaštićena od svih vjetrova osim juga. Restoran na rivi odličan." },
  { name: "ACI Marina Pula", region: "istra", lat: 44.87, lon: 13.85, berths: 192, maxLen: "40m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Blizu Arene. Otvorena jugu — pri najavi prebaci se u Veruda." },
  { name: "Marina Veruda", region: "istra", lat: 44.83, lon: 13.85, berths: 630, maxLen: "50m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Najveća marina u Istri. Odlična zaštita. Supermarket 200m." },
  // Kvarner
  { name: "ACI Marina Cres", region: "kvarner", lat: 44.96, lon: 14.41, berths: 461, maxLen: "50m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Mirna marina. Grad Cres na pješačkoj udaljenosti. Dobar za obitelji." },
  { name: "ACI Marina Supetarska Draga", region: "kvarner", lat: 44.79, lon: 14.74, berths: 280, maxLen: "25m", vhf: 17, fuel: false, water: true, electric: true, price: "check ACI website", wifi: true, note: "Rab — mirno sidrište. Pijesak Lopar 10 min autom." },
  // Split
  { name: "ACI Marina Split", region: "split", lat: 43.51, lon: 16.44, berths: 318, maxLen: "50m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Centar Splita, Dioklecijanova 5 min. Skupo ljeti ali lokacija neprocjenjiva." },
  { name: "Marina Kaštela", region: "split", lat: 43.55, lon: 16.38, berths: 420, maxLen: "25m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "15 min od Splita, upola jeftinije. Taxi boat do grada." },
  { name: "ACI Marina Milna", region: "split", lat: 43.33, lon: 16.45, berths: 197, maxLen: "30m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Brač — najzaštićenija luka na otoku. Konoba Palma na rivi." },
  // Dubrovnik
  { name: "ACI Marina Dubrovnik", region: "dubrovnik", lat: 42.66, lon: 18.06, berths: 425, maxLen: "60m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Komolac, 6km od starog grada. Bus 1A do Pila vrata." },
  // Zadar
  { name: "Marina Dalmacija Sukošan", region: "zadar", lat: 44.04, lon: 15.30, berths: 1200, maxLen: "40m", vhf: 17, fuel: true, water: true, electric: true, price: "check ACI website", wifi: true, note: "Najveća marina na Jadranu! Kornati na dohvat ruke." },
  { name: "ACI Marina Žut", region: "zadar", lat: 43.87, lon: 15.29, berths: 120, maxLen: "20m", vhf: 17, fuel: false, water: true, electric: true, price: "check ACI website", wifi: false, note: "Kornati — potpuna tišina. Restoran Goro jedina opcija ali vrhunski." },
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
    link: GYG("dubrovnik-l518/sightseeing-tc2/?q=cable+car+srd") },
  { id: "tudman-most", spot: "Most dr. Franje Tuđmana", emoji: "🌬️", severity: "high",
    intel: "Ovaj most se PRVI zatvara za kampere i prikolice na prve udare bure. Uvijek provjeri meteo prije ulaska u Dubrovnik. Alternativa: stari put kroz Rijeku Dubrovačku (Mokošica)." },
  { id: "peljesac-most", spot: "Pelješki most — sloboda od granice", emoji: "🌉", severity: "low",
    intel: "Više ne moraš kroz Neum (BiH) — nema gubitka vremena na pasoškoj kontroli! Most je BESPLATAN. Na Pelješcu obavezno: degustacija Mali Plavac + stonske kamenice.",
    link: GYG("dubrovnik-l518/food-drink-tc6/?q=ston+oyster+wine") },
  { id: "mljet-trajekt", spot: "Trajekt za Mljet (Prapratno)", emoji: "⛴️", severity: "medium",
    intel: "NP Mljet je hit ali trajekt ljeti krcat. Ostavi kamper na parkingu na Pelješcu, idi kao pješak (jeftinije i brže). Na Mljetu — najam bicikala za obilazak jezera.",
    link: GYG("dubrovnik-l518/cruises-boat-tours-tc48/?q=mljet+island") },
];

// ═══ CAMPER DUMP STATIONS ═══
// Verified locations for black/grey water disposal and fresh water
export const DUMP_STATIONS = [
  // ISTRA
  { id: "ds_porec", name: "Camping Zelena Laguna", city: "Poreč", region: "istra", lat: 45.19, lon: 13.59, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "Besplatno za goste / 5€ tranzit", hours: "08-20h", note: "Najveći dump point u Istri. Lako pristupačan." },
  { id: "ds_rovinj", name: "Camping Polari", city: "Rovinj", region: "istra", lat: 45.06, lon: 13.63, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "Besplatno za goste / 7€ tranzit", hours: "Non-stop", note: "Na ulazu u kamp, ne morate unutra. Pitajte na recepciji." },
  { id: "ds_pula_stoja", name: "Camping Stoja", city: "Pula", region: "istra", lat: 44.85, lon: 13.83, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "2km od Arene. Dump + voda na ulazu." },
  { id: "ds_umag", name: "Camping Park Umag", city: "Umag", region: "istra", lat: 45.43, lon: 13.52, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "Besplatno za goste / 5€", hours: "08-20h", note: "Blizu granice sa Slovenijom — prvi stop." },
  { id: "ds_bale", name: "Camp Mon Perin", city: "Bale", region: "istra", lat: 45.03, lon: 13.78, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-22h", note: "Odličan pritisak vode za brzo punjenje! Rijedak u regiji." },
  // KVARNER
  { id: "ds_krk_omisalj", name: "Camping Omišalj", city: "Omišalj, Krk", region: "kvarner", lat: 45.21, lon: 14.55, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "Besplatno za goste / 8€", hours: "08-20h", note: "Odmah nakon Krčkog mosta — idealno za prvi stop." },
  { id: "ds_krk_njivice", name: "Camping Njivice", city: "Njivice, Krk", region: "kvarner", lat: 45.16, lon: 14.53, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Manji kamp, mirno, dump pristupačan s ceste." },
  { id: "ds_cres", name: "Camp Kovačine", city: "Cres", region: "kvarner", lat: 44.97, lon: 14.40, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "6€", hours: "08-20h (ljeti do 22h)", note: "PAŽNJA: ljeti ograničavaju vodu! Napunite spremnike na kopnu." },
  { id: "ds_rab", name: "Camp Padova III", city: "Rab", region: "kvarner", lat: 44.76, lon: 14.76, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "Besplatno za goste / 5€", hours: "08-20h", note: "Blizu Lopar plaže. Dump na ulazu." },
  { id: "ds_rijeka", name: "Autokamp Preluk", city: "Rijeka/Opatija", region: "kvarner", lat: 45.35, lon: 14.34, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "5€", hours: "Non-stop", note: "3km od centra Opatije. Bus 32 do grada." },
  // ZADAR / ŠIBENIK
  { id: "ds_zadar", name: "Camping Borik", city: "Zadar", region: "zadar", lat: 44.14, lon: 15.20, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Najbliži dump centru Zadra — 3km od Morskih orgulja." },
  { id: "ds_biograd", name: "Camping Soline", city: "Biograd na Moru", region: "zadar", lat: 43.93, lon: 15.45, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "7€", hours: "08-22h", note: "Veliki kamp, puni servis. Blizu NP Kornati polazišta." },
  { id: "ds_sibenik", name: "Camping Solaris", city: "Šibenik", region: "zadar", lat: 43.71, lon: 15.87, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "8€", hours: "08-20h", note: "Resort-stil ali ima javni dump. Blizu NP Krka." },
  { id: "ds_vodice", name: "Camping Imperial", city: "Vodice", region: "zadar", lat: 43.76, lon: 15.78, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Između Šibenika i Vodica." },
  { id: "ds_murter", name: "Camping Jezera", city: "Jezera, Murter", region: "zadar", lat: 43.77, lon: 15.66, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "Besplatno za goste", hours: "08-20h", note: "Polazište za Kornate. Dump na ulazu u kamp." },
  // SPLIT / MAKARSKA
  { id: "ds_split_stobrec", name: "Camping Stobreč Split", city: "Stobreč", region: "split", lat: 43.50, lon: 16.49, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "7€", hours: "Non-stop", note: "Najbliži dump Splitu! Bus 25 do Dioklecijanove. 24/7 pristup." },
  { id: "ds_trogir", name: "Camping Seget", city: "Trogir", region: "split", lat: 43.52, lon: 16.20, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Prekoputa starog grada Trogira." },
  { id: "ds_makarska", name: "Camping Baško Polje", city: "Baška Voda", region: "split", lat: 43.36, lon: 16.92, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Rivijera Makarska. Pristup s magistrale." },
  { id: "ds_omis", name: "Camping Galeb", city: "Omiš", region: "split", lat: 43.44, lon: 16.70, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Ušće Cetine. Blizu raftinga." },
  // DUBROVNIK
  { id: "ds_dubrovnik", name: "Camping Solitudo", city: "Dubrovnik (Babin Kuk)", region: "dubrovnik", lat: 42.66, lon: 18.05, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "8€", hours: "08-20h", note: "Jedini dump blizu Dubrovnika! Bus 6 do Starog grada." },
  { id: "ds_ploce", name: "Autocamp Murvica", city: "Ploče", region: "dubrovnik", lat: 43.04, lon: 17.42, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Pred Neum — zadnji dump prije BiH koridora." },
  { id: "ds_orebic", name: "Camping Nevio", city: "Orebić, Pelješac", region: "dubrovnik", lat: 42.98, lon: 17.18, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "5€", hours: "08-20h", note: "Pelješac poluotok. Trajekt za Korčulu 5 min." },
  // GORSKI KOTAR / ZAGREB
  { id: "ds_zagreb", name: "Autocamp Zagreb", city: "Zagreb (Lučko)", region: "inland", lat: 45.76, lon: 15.89, blackWater: true, greyWater: true, freshWater: true, electric: true, price: "5€", hours: "Non-stop", note: "Odmah uz A1 izlaz Lučko. Prvi/zadnji stop iz/za Austriju." },
  { id: "ds_dugopolje", name: "Servisna zona Dugopolje", city: "Dugopolje (Split)", region: "split", lat: 43.58, lon: 16.56, blackWater: true, greyWater: true, freshWater: true, electric: false, price: "3€", hours: "Non-stop", note: "Odmorište na A1. Brz dump bez skretanja s autoceste." },
];

// ═══ LPG / AUTOPLIN STATIONS (coastal corridor) ═══
// Source: mylpg.eu + INA network, verified locations along tourist routes
export const LPG_STATIONS = [
  // ISTRA
  { id: "lpg_pula", name: "INA Pula (Veruda)", city: "Pula", region: "istra", lat: 44.85, lon: 13.85, brand: "INA", note: "Blizu Marine Veruda. Radi non-stop." },
  { id: "lpg_porec", name: "Tifon Poreč", city: "Poreč", region: "istra", lat: 45.22, lon: 13.60, brand: "Tifon", note: "Ulaz u grad sa istoka." },
  { id: "lpg_pazin", name: "INA Pazin", city: "Pazin", region: "istra", lat: 45.24, lon: 13.94, brand: "INA", note: "Centar Istre — ako idete u unutrašnjost." },
  { id: "lpg_umag", name: "INA Umag", city: "Umag", region: "istra", lat: 45.43, lon: 13.52, brand: "INA", note: "Blizu granice. Zadnja šansa za jeftini LPG." },
  // KVARNER
  { id: "lpg_rijeka", name: "INA Rijeka (Škurinje)", city: "Rijeka", region: "kvarner", lat: 45.34, lon: 14.41, brand: "INA", note: "Glavni LPG point Kvarnera." },
  { id: "lpg_senj", name: "Crodux Senj", city: "Senj", region: "kvarner", lat: 45.00, lon: 14.90, brand: "Crodux", note: "Magistrala — jedini LPG između Rijeke i Zadra!" },
  // ZADAR
  { id: "lpg_zadar", name: "INA Zadar (Gaženica)", city: "Zadar", region: "zadar", lat: 44.10, lon: 15.25, brand: "INA", note: "Blizu trajektne luke. Napunite prije otoka!" },
  { id: "lpg_sibenik", name: "INA Šibenik", city: "Šibenik", region: "zadar", lat: 43.73, lon: 15.90, brand: "INA", note: "Na ulazu u grad sa A1." },
  // SPLIT
  { id: "lpg_split", name: "INA Split (Kopilica)", city: "Split", region: "split", lat: 43.51, lon: 16.44, brand: "INA", note: "Najbliži LPG centru Splita." },
  { id: "lpg_sinj", name: "INA Sinj", city: "Sinj", region: "split", lat: 43.70, lon: 16.64, brand: "INA", note: "Unutrašnjost — ako idete za Imotski/BiH." },
  { id: "lpg_makarska", name: "Tifon Makarska", city: "Makarska", region: "split", lat: 43.30, lon: 17.01, brand: "Tifon", note: "Rivijera. Jedini LPG Makarska-Omiš." },
  // DUBROVNIK
  { id: "lpg_metkovic", name: "INA Metković", city: "Metković", region: "dubrovnik", lat: 43.05, lon: 17.65, brand: "INA", note: "Zadnji LPG prije Dubrovnika! Napunite OVDJE." },
  { id: "lpg_dubrovnik", name: "INA Dubrovnik (Komolac)", city: "Dubrovnik", region: "dubrovnik", lat: 42.67, lon: 18.05, brand: "INA", note: "Jedini LPG u dubrovačkoj regiji." },
  // ZAGREB / TRANZIT
  { id: "lpg_zagreb", name: "INA Zagreb (Lučko)", city: "Zagreb", region: "inland", lat: 45.76, lon: 15.91, brand: "INA", note: "A1 čvorište — napunite za put na jug." },
  { id: "lpg_karlovac", name: "INA Karlovac", city: "Karlovac", region: "inland", lat: 45.49, lon: 15.55, brand: "INA", note: "Između Zagreba i obale." },
];

// ═══ CAMPER DIMENSION RESTRICTIONS ═══
// Used by gabarit auto-checker to proactively warn
export const DIMENSION_RESTRICTIONS = [
  { id: "restr_pitve", name: "Tunel Pitve (Hvar)", width: 2.3, height: 2.4, region: "split", severity: "critical", advice: "Većina kampera NE PROLAZI! Ostavite vozilo u Jelsi." },
  { id: "restr_vrbnik", name: "Stari grad Vrbnik (Krk)", width: 2.0, height: null, region: "kvarner", severity: "high", advice: "GPS navodi unutra — NEMA povratka! Parking na ulazu." },
  { id: "restr_trogir_bridge", name: "Stari most Trogir", width: 2.5, height: 3.2, region: "split", severity: "medium", advice: "Koristite Novi most (Most hrvatskih branitelja)." },
  { id: "restr_rovinj", name: "Centar Rovinj", width: null, height: null, region: "istra", severity: "medium", maxWeight: 3.5, advice: "Zabrana >3.5t! Parking Valdibora ili Končeta." },
  { id: "restr_opatija", name: "Centar Opatije", width: null, height: null, region: "kvarner", severity: "medium", maxWeight: 3.5, advice: "Zabrana >3.5t! Camp Preluk (3km) + bus 32." },
  { id: "restr_ucka", name: "Tunel Učka", width: null, height: 4.5, region: "istra", severity: "low", advice: "Većina kampera prolazi (4.5m limit). Zatvorite prozore!" },
  { id: "restr_biokovo", name: "Biokovo Skywalk pristup", width: 2.2, height: null, region: "split", severity: "high", advice: "Serpentine, dva auta se teško mimoilaze. Park u podnožju." },
  { id: "restr_krk_bridge", name: "Krčki most (bura)", width: null, height: null, region: "kvarner", severity: "high", windLimit: 60, advice: "Zatvara se za kampere pri buri >60 km/h! Alternativa: trajekt Crikvenica-Šilo." },
  { id: "restr_senj", name: "Magistrala Senj (Vratnik)", width: null, height: null, region: "kvarner", severity: "high", windLimit: 60, advice: "Bura udari bočno! Kamperi s ceradom najugroženiji. Pričekajte na Vratniku." },
  { id: "restr_prizna", name: "Trajekt Prizna-Žigljen (Pag)", width: null, height: null, region: "kvarner", severity: "high", windLimit: 60, advice: "Zabrana za kampere pri buri >60 km/h. Koristite Paški most." },
];
