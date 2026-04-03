// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Static Data Layer
// All constants, content, translations, affiliate helpers.
// Nothing here touches React or DOM.
// ═══════════════════════════════════════════════════════════════

// ─── AFFILIATE URL BUILDERS ───────────────────────────────────
export const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
export const VIA = (id) => `https://www.viator.com/tours/${id}?pid=P00292197&mcid=42383&medium=link`;
export const BKG = (city, params = "") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

// ─── CITY COORDINATES (HERE SDK fallback) ─────────────────────
export const CITY_COORDS = {
  "Wien":[48.2082,16.3738], "München":[48.1351,11.5820], "Frankfurt":[50.1109,8.6821],
  "Beograd":[44.8176,20.4633], "Ljubljana":[46.0569,14.5058], "Graz":[47.0707,15.4395],
  "Salzburg":[47.8095,13.0550], "Linz":[48.3069,14.2858], "Zürich":[47.3769,8.5417],
  "Berlin":[52.5200,13.4050], "Hamburg":[53.5753,10.0153], "Köln":[50.9333,6.9500],
  "Split":[43.5081,16.4402], "Dubrovnik":[42.6507,18.0944], "Zadar":[44.1194,15.2314],
  "Rijeka":[45.3271,14.4422], "Pula":[44.8666,13.8496], "Rovinj":[45.0811,13.6387],
  "Makarska":[43.2967,17.0177], "Hvar":[43.1729,16.4414], "Trogir":[43.5167,16.2500],
  "Omiš":[43.4439,16.6892], "Šibenik":[43.7350,15.8952], "Podstrana":[43.4833,16.5500],
  "Opatija":[45.3369,14.3053], "Krk":[45.0267,14.5756], "Rab":[44.7556,14.7606],
  "Praha":[50.0755,14.4378], "Kraków":[50.0647,19.9450], "Trieste":[45.6495,13.7768],
  "Zagreb":[45.8150,15.9819],
};

// Departure city → home coordinates (used when FROM not geocoded)
export const COUNTRY_CITY = {
  DE: "München", AT: "Wien", IT: "Trieste", SI: "Ljubljana",
  CZ: "Praha", PL: "Kraków", HR: "Zagreb",
};

// ─── REGION HELPER ────────────────────────────────────────────
// Maps any Croatian city/town name → content region key.
export const getDestRegion = (city) => {
  if (!city) return null;
  const c = (city || "").toLowerCase();
  if (["split","podstrana","omiš","omis","makarska","trogir","hvar","brač","brac","vis","bol","supetar"].some(x => c.includes(x))) return "split";
  if (["rovinj","pula","medulin","poreč","porec","umag","novigrad","labin","motovun"].some(x => c.includes(x))) return "istria";
  if (["rab","opatija","krk","rijeka","crikvenica","lošinj","losinj","cres","novalja","pag","mali losinj"].some(x => c.includes(x))) return "kvarner";
  if (["zadar","šibenik","sibenik","biograd","nin","vodice"].some(x => c.includes(x))) return "zadar";
  if (["dubrovnik","korčula","korcula","pelješac"].some(x => c.includes(x))) return "dubrovnik";
  return null;
};

// ─── GUEST DEFAULTS ───────────────────────────────────────────
export const GUEST_FALLBACK = {
  name: "Gost", first: "Gost", country: "HR", lang: "hr", flag: "🇭🇷",
  adults: 2, kids: 0, kidsAges: [], interests: ["gastro","adventure"],
  arrival: null, departure: null, car: true, carPlate: "",
  accommodation: "Apartman", host: "", hostPhone: "", email: "",
};

// ─── WEATHER DEFAULTS ─────────────────────────────────────────
export const W_DEFAULT = { icon: "☀️", temp: 28, sea: 24, uv: 7, wind: "Z 8 km/h", sunset: "20:30", humidity: 50 };

export const FORECAST_DAYS = {
  hr:["Pon","Uto","Sri","Čet","Pet","Sub","Ned"], de:["Mo","Di","Mi","Do","Fr","Sa","So"],
  at:["Mo","Di","Mi","Do","Fr","Sa","So"], en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  it:["Lun","Mar","Mer","Gio","Ven","Sab","Dom"], si:["Pon","Tor","Sre","Čet","Pet","Sob","Ned"],
  cz:["Po","Út","St","Čt","Pá","So","Ne"], pl:["Pon","Wt","Śr","Czw","Pt","Sob","Ndz"],
};

export const FORECAST_DEFAULT = [
  { di:0, icon:"☀️", h:31, l:22 }, { di:1, icon:"⛅", h:28, l:21 },
  { di:2, icon:"🌧️", h:23, l:19 }, { di:3, icon:"☀️", h:30, l:22 },
  { di:4, icon:"☀️", h:32, l:23 }, { di:5, icon:"⛅", h:29, l:21 },
  { di:6, icon:"☀️", h:31, l:22 },
];

// ─── PRACTICAL (generic, not location-specific) ───────────────
export const PRACTICAL = {
  sun: { icon:"☀️", tk:"sun", items:[
    { n:"UV Index", note:{hr:"SPF 50+ obavezno između 11-16h!",de:"SPF 50+ Pflicht zwischen 11-16 Uhr!",en:"SPF 50+ mandatory between 11am-4pm!",it:"SPF 50+ obbligatorio tra le 11-16!",si:"SPF 50+ obvezno med 11-16h!",cz:"SPF 50+ povinné mezi 11-16h!",pl:"SPF 50+ obowiązkowe między 11-16!"}, warn:true, uvDynamic:true },
    { n:{hr:"Hidracija",de:"Hydration",en:"Hydration",it:"Idratazione",si:"Hidracija",cz:"Hydratace",pl:"Nawodnienie"}, note:{hr:"Min. 3L vode dnevno · Djeca češće!",de:"Min. 3L Wasser täglich · Kinder öfter!",en:"Min. 3L water daily · Kids more often!",it:"Min. 3L acqua al giorno · Bambini più spesso!",si:"Min. 3L vode dnevno · Otroci pogosteje!",cz:"Min. 3L vody denně · Děti častěji!",pl:"Min. 3L wody dziennie · Dzieci częściej!"} },
    { n:{hr:"Ljekarna",de:"Apotheke",en:"Pharmacy",it:"Farmacia",si:"Lekarna",cz:"Lékárna",pl:"Apteka"}, note:{hr:"Potražite najbližu u kategoriji 'Ljekarna'",de:"Suchen Sie die nächste unter 'Apotheke'",en:"Find nearest in 'Pharmacy' category",it:"Trova la più vicina in 'Farmacia'",si:"Poiščite najbližjo v kategoriji 'Lekarna'",cz:"Najděte nejbližší v kategorii 'Lékárna'",pl:"Znajdź najbliższą w kategorii 'Apteka'"} },
  ]},
  emergency: { icon:"🏥", tk:"emergency", items:[
    { n:{hr:"Hitna pomoć",de:"Notruf",en:"Emergency",it:"Emergenza",si:"Nujna pomoč",cz:"Tísňové volání",pl:"Pogotowie"}, note:"112", warn:true },
    { n:{hr:"Policija",de:"Polizei",en:"Police",it:"Polizia",si:"Policija",cz:"Policie",pl:"Policja"}, note:"192" },
    { n:{hr:"Hitna medicinska",de:"Rettungsdienst",en:"Ambulance",it:"Ambulanza",si:"Reševalci",cz:"Záchranná služba",pl:"Pogotowie ratunkowe"}, note:"194" },
    { n:{hr:"Obalna straža",de:"Küstenwache",en:"Coast Guard",it:"Guardia costiera",si:"Obalna straža",cz:"Pobřežní stráž",pl:"Straż przybrzeżna"}, note:"195" },
    { n:{hr:"Vatrogasci",de:"Feuerwehr",en:"Fire Department",it:"Vigili del fuoco",si:"Gasilci",cz:"Hasiči",pl:"Straż pożarna"}, note:"193" },
  ]},
};

// ─── GEMS (hidden local spots, region-tagged) ─────────────────
export const GEMS = [
  // ═══ DALMATIA / SPLIT ═══
  { name:"Uvala Vruja", emoji:"🏝️", lat:43.3712, lng:16.7893, region:"split", premium:false,
    type:{hr:"Tajna plaža",de:"Geheimstrand",en:"Secret beach",it:"Spiaggia segreta",si:"Skrita plaža",cz:"Tajná pláž",pl:"Tajna plaża"},
    desc:{hr:"Između Omiša i Makarske, dostupna samo pješice. Kristalno more, potpuno divlja.",de:"Zwischen Omiš und Makarska, nur zu Fuß erreichbar. Kristallklares Meer, völlig wild.",en:"Between Omiš and Makarska, accessible only on foot. Crystal clear sea, completely wild.",it:"Tra Omiš e Makarska, raggiungibile solo a piedi. Mare cristallino, completamente selvaggia.",si:"Med Omišem in Makarsko, dostopna le peš. Kristalno morje.",cz:"Mezi Omišem a Makarskou, přístupná pouze pěšky. Křišťálové moře.",pl:"Między Omišem a Makarską, dostępna tylko pieszo."},
    tip:{hr:"Ponesite vode i cipele za hodanje! Nema sjene.",de:"Bringen Sie Wasser und Wanderschuhe mit! Kein Schatten.",en:"Bring water and walking shoes! No shade.",it:"Portate acqua e scarpe da trekking! Nessuna ombra.",si:"Vzemite vodo in pohodne čevlje! Ni sence.",cz:"Vezměte vodu a turistickou obuv! Žádný stín.",pl:"Weźcie wodę i buty do chodzenia! Brak cienia."},
    best:{hr:"Ujutro",de:"Morgens",en:"Morning",it:"Mattina",si:"Zjutraj",cz:"Ráno",pl:"Rano"}, diff:{hr:"Srednje",de:"Mittel",en:"Medium",it:"Medio",si:"Srednje",cz:"Střední",pl:"Średni"} },
  { name:"Marjan špilje", emoji:"🕳️", lat:43.5089, lng:16.4168, region:"split", premium:false,
    type:{hr:"Šetnja",de:"Wanderung",en:"Walk",it:"Passeggiata",si:"Sprehod",cz:"Procházka",pl:"Spacer"},
    desc:{hr:"Starokršćanske špilje iz 5. st. na stazi od Kašjuna do vrha Marjana.",de:"Frühchristliche Höhlen aus dem 5. Jh. auf dem Weg von Kašjuni zum Marjan-Gipfel.",en:"Early Christian caves from the 5th century on the trail from Kašjuni to Marjan summit.",it:"Grotte paleocristiane del V secolo sul sentiero da Kašjuni alla cima del Marjan.",si:"Starokrščanske jame iz 5. st. na poti od Kašjunov do vrha Marjana.",cz:"Starokřesťanské jeskyně z 5. století na stezce z Kašjuni na vrchol Marjanu.",pl:"Wczesnochrześcijańskie jaskinie z V w. na szlaku z Kašjuni na szczyt Marjanu."},
    tip:{hr:"Krenite u 17h, stignete na vrh za zalazak sunca.",de:"Starten Sie um 17 Uhr, Gipfel zum Sonnenuntergang.",en:"Start at 5pm, reach the summit for sunset.",it:"Partite alle 17, arrivate in cima per il tramonto.",si:"Začnite ob 17h, na vrh za sončni zahod.",cz:"Vyražte v 17h, na vrchol k západu slunce.",pl:"Wyruszcie o 17, na szczyt o zachodzie słońca."},
    best:{hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Konoba Stari Mlin", emoji:"🍷", lat:43.4901, lng:16.5634, region:"split", premium:true,
    type:{hr:"Lokalna tajna",de:"Lokales Geheimnis",en:"Local secret",it:"Segreto locale",si:"Lokalna skrivnost",cz:"Místní tajemství",pl:"Lokalny sekret"},
    desc:{hr:"Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. Pršut, sir, vino iz podruma.",de:"Srinjine, 15 Min. Keine Speisekarte — der Wirt kocht, was da ist. Pršut, Käse, Wein aus dem Keller.",en:"Srinjine, 15min. No menu — the host cooks what's available. Pršut, cheese, wine from the cellar.",it:"Srinjine, 15min. Nessun menù — il padrone cucina ciò che c'è. Pršut, formaggio, vino.",si:"Srinjine, 15min. Ni jedilnika — gostilničar kuha, kar ima.",cz:"Srinjine, 15 min. Žádné menu — hostitel vaří, co má.",pl:"Srinjine, 15min. Brak menu — gospodarz gotuje co ma."},
    tip:{hr:"Nazovite dan ranije. ~80€ za 4 osobe sa vinom.",de:"Rufen Sie einen Tag vorher an. ~80€ für 4 Personen mit Wein.",en:"Call a day ahead. ~80€ for 4 people with wine.",it:"Chiamate un giorno prima. ~80€ per 4 persone.",si:"Pokličite dan prej. ~80€ za 4 osebe.",cz:"Zavolejte den předem. ~80€ pro 4 osoby.",pl:"Zadzwońcie dzień wcześniej. ~80€ za 4 osoby."},
    best:{hr:"Večer",de:"Abend",en:"Evening",it:"Sera",si:"Večer",cz:"Večer",pl:"Wieczór"}, diff:{hr:"Auto",de:"Auto",en:"Car",it:"Auto",si:"Avto",cz:"Auto",pl:"Auto"} },
  { name:"Klis", emoji:"🏰", lat:43.5583, lng:16.5242, region:"split", premium:true,
    type:{hr:"Iskustvo",de:"Erlebnis",en:"Experience",it:"Esperienza",si:"Doživetje",cz:"Zážitek",pl:"Doświadczenie"},
    desc:{hr:"Game of Thrones tvrđava u zoru. Nema turista. Pogled na Split i otoke.",de:"Game of Thrones Festung im Morgengrauen. Keine Touristen. Blick auf Split und die Inseln.",en:"Game of Thrones fortress at dawn. No tourists. View of Split and the islands.",it:"Fortezza di Game of Thrones all'alba. Nessun turista. Vista su Spalato e le isole.",si:"Game of Thrones trdnjava ob zori. Brez turistov. Pogled na Split in otoke.",cz:"Pevnost ze Hry o trůny za úsvitu. Žádní turisté. Výhled na Split a ostrovy.",pl:"Twierdza z Gry o Tron o świcie. Żadnych turystów."},
    tip:{hr:"Parking besplatan prije 8h. Dođite u 5:15.",de:"Parking kostenlos vor 8 Uhr. Kommen Sie um 5:15.",en:"Free parking before 8am. Arrive at 5:15.",it:"Parcheggio gratuito prima delle 8. Arrivate alle 5:15.",si:"Parking brezplačen pred 8h. Pridite ob 5:15.",cz:"Parkování zdarma před 8h. Přijeďte v 5:15.",pl:"Parking bezpłatny przed 8. Przyjedźcie o 5:15."},
    best:{hr:"Izlazak sunca",de:"Sonnenaufgang",en:"Sunrise",it:"Alba",si:"Sončni vzhod",cz:"Východ slunce",pl:"Wschód słońca"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Cetina", emoji:"🌊", lat:43.4456, lng:16.7012, region:"split", premium:true,
    type:{hr:"Kupanje",de:"Baden",en:"Swimming",it:"Nuoto",si:"Kopanje",cz:"Koupání",pl:"Kąpiel"},
    desc:{hr:"3km uzvodno od Omiša, makadamski put do skrivenog prirodnog bazena.",de:"3km flussaufwärts von Omiš, Schotterweg zum versteckten Naturbecken.",en:"3km upstream from Omiš, gravel road to a hidden natural pool.",it:"3km a monte da Omiš, strada sterrata verso una piscina naturale nascosta.",si:"3km gorvodno od Omiša, makadamska pot do skritega naravnega bazena.",cz:"3km proti proudu od Omiše, štěrková cesta ke skrytému přírodnímu bazénu.",pl:"3km w górę rzeki od Omisza, droga szutrowa do ukrytego naturalnego basenu."},
    tip:{hr:"Skrenite desno kod mosta u Omišu. Makadamski put 1km.",de:"Rechts abbiegen bei der Brücke in Omiš. Schotterweg 1km.",en:"Turn right at the bridge in Omiš. Gravel road 1km.",it:"Girate a destra al ponte di Omiš. Strada sterrata 1km.",si:"Zavijte desno pri mostu v Omišu. Makadamska pot 1km.",cz:"Odbočte vpravo u mostu v Omiši. Štěrková cesta 1km.",pl:"Skręćcie w prawo przy moście w Omiszu. Droga szutrowa 1km."},
    best:{hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Vidova Gora", emoji:"🌄", lat:43.3151, lng:16.6212, region:"split", premium:true,
    type:{hr:"Pogled",de:"Aussicht",en:"Viewpoint",it:"Panorama",si:"Razgled",cz:"Vyhlídka",pl:"Punkt widokowy"},
    desc:{hr:"Najviši vrh jadranskih otoka (778m). Auto do vrha. Pogled na Hvar, Vis, Italiju.",de:"Höchster Gipfel der Adriainseln (778m). Auto bis zum Gipfel. Blick auf Hvar, Vis, Italien.",en:"Highest peak of the Adriatic islands (778m). Drive to the top. View of Hvar, Vis, Italy.",it:"Vetta più alta delle isole adriatiche (778m). Auto fino in cima. Vista su Hvar, Vis, Italia.",si:"Najvišji vrh jadranskih otokov (778m). Avto do vrha. Pogled na Hvar, Vis, Italijo.",cz:"Nejvyšší vrchol jadranských ostrovů (778m). Autem na vrchol.",pl:"Najwyższy szczyt wysp adriatyckich (778m). Autem na szczyt."},
    tip:{hr:"Ferry 12h, auto 30min do vrha, zalazak, večera u Bolu.",de:"Fähre 12 Uhr, Auto 30 Min zum Gipfel, Sonnenuntergang, Abendessen in Bol.",en:"Ferry 12pm, car 30min to top, sunset, dinner in Bol.",it:"Traghetto 12, auto 30min in cima, tramonto, cena a Bol.",si:"Trajekt 12h, avto 30min do vrha, zahod, večerja v Bolu.",cz:"Trajekt 12h, auto 30min na vrchol, západ slunce.",pl:"Prom 12, auto 30min na szczyt, zachód słońca."},
    best:{hr:"Zalazak",de:"Sonnenuntergang",en:"Sunset",it:"Tramonto",si:"Zahod",cz:"Západ slunce",pl:"Zachód słońca"}, diff:"Ferry+Auto" },

  // ═══ KVARNER — RAB ═══
  { name:"Rt Ciganka", emoji:"🏖️", lat:44.7368, lng:14.7012, region:"kvarner", premium:false,
    type:{hr:"Tajna plaža",de:"Geheimstrand",en:"Secret beach",it:"Spiaggia segreta",si:"Skrita plaža",cz:"Tajná pláž",pl:"Tajna plaża"},
    desc:{hr:"Najljepša divlja uvala na Rabu. Staza 25min kroz borovu šumu od Kampora.",de:"Schönste wilde Bucht auf Rab. 25min Wanderweg durch Kiefernwald von Kampor.",en:"Most beautiful wild cove on Rab. 25min trail through pine forest from Kampor.",it:"La baia più bella di Rab. Sentiero 25min attraverso pineta da Kampor.",si:"Najlepša divja skrivnost Raba. Pot 25min skozi borovi gozd od Kampora.",cz:"Nejkrásnější divoká zátoka na Rabu. Stezka 25min přes borový les z Kamporu.",pl:"Najpiękniejsza dzika zatoczka na Rabu. Ścieżka 25min przez las sosnowy z Kamporu."},
    tip:{hr:"Parking uz cestu kod Kamporu. Nosite vodu — nema sjene.",de:"Parken an der Straße bei Kampor. Wasser mitnehmen — kein Schatten.",en:"Park on roadside near Kampor. Bring water — no shade.",it:"Parcheggio sul ciglio strada vicino Kampor. Portare acqua.",si:"Parkiranje ob cesti pri Kamporu. Vzemite vodo — ni sence.",cz:"Parkování u silnice u Kamporu. Vezměte vodu — žádný stín.",pl:"Parkowanie przy drodze koło Kamporu. Weź wodę — brak cienia."},
    best:{hr:"Jutro",de:"Morgens",en:"Morning",it:"Mattina",si:"Zjutraj",cz:"Ráno",pl:"Rano"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Kampor — Stari Grad", emoji:"⛪", lat:44.7467, lng:14.7178, region:"kvarner", premium:false,
    type:{hr:"Selo",de:"Dorf",en:"Village",it:"Villaggio",si:"Vas",cz:"Vesnice",pl:"Wioska"},
    desc:{hr:"Mirno ribarsko selo 3km od Starog Grada. Autentična konoba, lokalni ribari.",de:"Ruhiges Fischerdorf 3km von der Altstadt. Authentische Konoba, lokale Fischer.",en:"Quiet fishing village 3km from the Old Town. Authentic konoba, local fishermen.",it:"Quieto villaggio di pescatori 3km dalla Città Vecchia. Konoba autentica.",si:"Mirna ribiška vasica 3km od Starega mesta. Avtentična konoba, lokalni ribiči.",cz:"Klidná rybářská vesnice 3km od Starého města. Autentická konoba.",pl:"Spokojna wioska rybacka 3km od Starego Miasta. Autentyczna konoba."},
    tip:{hr:"Konoba Rabljanin — pitajte za ribu dana. Rezervirajte do 10h.",de:"Konoba Rabljanin — fragen Sie nach dem Tagesfisch. Reservieren bis 10 Uhr.",en:"Konoba Rabljanin — ask for today's catch. Reserve by 10am.",it:"Konoba Rabljanin — chiedete il pesce del giorno. Prenotare entro le 10.",si:"Konoba Rabljanin — vprašajte za ribo dneva. Rezervirajte do 10h.",cz:"Konoba Rabljanin — zeptejte se na denní rybu. Rezervujte do 10h.",pl:"Konoba Rabljanin — zapytaj o dzisiejszy połów. Zarezerwuj do 10."},
    best:{hr:"Ručak",de:"Mittagessen",en:"Lunch",it:"Pranzo",si:"Kosilo",cz:"Oběd",pl:"Obiad"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Glagoljska azbuka", emoji:"🗿", lat:44.7545, lng:14.7612, region:"kvarner", premium:true,
    type:{hr:"Kulturna staza",de:"Kulturpfad",en:"Cultural trail",it:"Sentiero culturale",si:"Kulturna pot",cz:"Kulturní stezka",pl:"Szlak kulturowy"},
    desc:{hr:"Staza kroz borovu šumu s 30 kamenih ploča glagoljske azbuks. Jedinstven kulturni monument.",de:"Pfad durch Kiefernwald mit 30 Steintafeln des glagolitischen Alphabets. Einzigartiges Kulturmonument.",en:"Trail through pine forest with 30 stone tablets of the Glagolitic alphabet. Unique monument.",it:"Sentiero nel bosco di pini con 30 tavole di pietra dell'alfabeto glagolitico.",si:"Pot skozi borovi gozd s 30 kamnitimi ploščami glagolice.",cz:"Stezka borovým lesem s 30 kamennými tabulemi hlaholice.",pl:"Szlak przez sosnowy las z 30 kamiennymi tablicami głagolicy."},
    tip:{hr:"Start kod autobusne postaje Rab. Krug 4km, 1.5h.",de:"Start an der Busstation Rab. Rundweg 4km, 1,5h.",en:"Start at Rab bus station. Loop 4km, 1.5h.",it:"Partenza alla fermata bus di Rab. Anello 4km, 1,5h.",si:"Start pri avtobusni postaji Rab. Krog 4km, 1,5h.",cz:"Start u autobusového nádraží Rab. Okruh 4km, 1,5h.",pl:"Start przy dworcu autobusowym Rab. Pętla 4km, 1,5h."},
    best:{hr:"Jutro",de:"Morgens",en:"Morning",it:"Mattina",si:"Zjutraj",cz:"Ráno",pl:"Rano"}, diff:{hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name:"Uvala Sv. Eufemija", emoji:"⛵", lat:44.7489, lng:14.7534, region:"kvarner", premium:true,
    type:{hr:"Sidrište",de:"Ankerplatz",en:"Anchorage",it:"Ancoraggio",si:"Sidrišče",cz:"Kotviště",pl:"Kotwicowisko"},
    desc:{hr:"Zaštićena uvala s kristalnim dnom. Nautičari sidre ovdje svako ljeto. Snorkeling do 15m.",de:"Geschützte Bucht mit kristallklarem Boden. Segler ankern hier jeden Sommer. Schnorcheln bis 15m.",en:"Sheltered cove with crystal-clear bottom. Sailors anchor here every summer. 15m visibility.",it:"Baia riparata con fondal cristallino. I velisti attraccano qui ogni estate.",si:"Zavarovana uvala s kristalnim dnom. Jadralci sidrijo tu vsako poletje.",cz:"Chráněná zátoka s křišťálovým dnem. Jachtaři kotvili každé léto.",pl:"Osłonięta zatoka z krystalicznym dnem. Żeglarze cumują tu co lato."},
    tip:{hr:"VHF kanal 17. Anchor 4-8m, dobro dno za sidrenje.",de:"VHF Kanal 17. Anker 4-8m, guter Ankergrund.",en:"VHF channel 17. Anchor 4-8m, good holding.",it:"Canale VHF 17. Ancora 4-8m, buon fondale.",si:"VHF kanal 17. Sidro 4-8m, dobro dno.",cz:"VHF kanál 17. Kotva 4-8m, dobrý kotevní důvod.",pl:"Kanał VHF 17. Kotwica 4-8m, dobre dno."},
    best:{hr:"Cijeli dan",de:"Ganztags",en:"All day",it:"Tutto il giorno",si:"Cel dan",cz:"Celý den",pl:"Cały dzień"}, diff:{hr:"Brod",de:"Boot",en:"Boat",it:"Barca",si:"Čoln",cz:"Loď",pl:"Łódź"} },
];

// ─── EXPERIENCES (affiliate activities, region-tagged) ────────
export const EXPERIENCES = [
  // ═══ DALMATIA / SPLIT ═══
  { id:1,  name:"Rafting Cetina",         emoji:"🚣", price:35,  dur:"3h",   rating:4.9, cat:"adventure", region:"split",   gyg:GYG("omis-l2096/rafting-on-cetina-river-from-omis-t35592"),            viator:VIA("Split/rafting-on-Cetina-river-Omis/d4185-261342P1") },
  { id:2,  name:"Kajak Night Glow",        emoji:"🛶", price:55,  dur:"3h",   rating:4.9, cat:"adventure", region:"split",   gyg:GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id:3,  name:"ATV Quad + Waterfall",    emoji:"🏍️", price:65,  dur:"5h",   rating:4.9, cat:"adventure", region:"split",   gyg:GYG("split-l268/activity-tc1/?q=atv+quad+waterfall") },
  { id:4,  name:"Split Walking Tour",      emoji:"🏛️", price:25,  dur:"2h",   rating:4.7, cat:"culture",   region:"split",   gyg:GYG("split-l268/split-walking-tour-t54976"),                            viator:VIA("Split/Split-Diocletians-Palace-Walking-Tour/d4185-54976P1") },
  { id:5,  name:"Game of Thrones",         emoji:"🐉", price:60,  dur:"2h",   rating:4.9, cat:"culture",   region:"split",   gyg:GYG("split-l268/activity-tc1/?q=game+of+thrones") },
  { id:6,  name:"Blue Cave 5 Islands",     emoji:"🏝️", price:110, dur:"10h",  rating:4.8, cat:"premium",   region:"split",   gyg:GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), viator:VIA("Split/Blue-Cave-and-Hvar-Tour-from-Split/d4185-17622P2") },
  { id:7,  name:"Hvar + Pakleni Catamaran",emoji:"⛵", price:89,  dur:"10h",  rating:4.8, cat:"premium",   region:"split",   gyg:GYG("split-l268/split-full-day-boat-trip-to-3-islands-w-lunch-snorkeling-t412889"), viator:VIA("Split/Three-Island-Tour-from-Split/d4185-412889P1") },
  { id:8,  name:"Sunset Cruise",           emoji:"🌅", price:65,  dur:"2h",   rating:5.0, cat:"premium",   region:"split",   gyg:GYG("split-l268/cruises-boat-tours-tc48/?q=sunset+cruise") },
  { id:9,  name:"Krka + Wine Tasting",     emoji:"🍷", price:65,  dur:"8h",   rating:4.8, cat:"gastro",    region:"split",   gyg:GYG("split-l268/day-tour-from-split-krka-waterfalls-tour-wine-tasting-t251842"), viator:VIA("Split/From-Split-Krka-Waterfalls-Food-Wine-Tasting-Tour/d4185-251842P1") },
  { id:10, name:"Plitvice Lakes",          emoji:"🌊", price:75,  dur:"12h",  rating:4.8, cat:"nature",    region:"split",   gyg:GYG("split-l268/from-split-plitvice-lakes-guided-tour-with-entry-tickets-t411976"), viator:VIA("Split/Plitvice-Lakes-Guided-Tour-with-Entry-Tickets/d4185-411976P1") },
  // ═══ ISTRA ═══
  { id:20, name:"Truffle Hunting",         emoji:"🍄", price:45,  dur:"2h",   rating:4.9, cat:"gastro",    region:"istria",  gyg:GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975") },
  { id:21, name:"Istria in 1 Day",         emoji:"🏰", price:55,  dur:"9h",   rating:4.7, cat:"culture",   region:"istria",  gyg:GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468") },
  { id:22, name:"Inner Istria + Food",     emoji:"🫒", price:65,  dur:"8h",   rating:4.8, cat:"gastro",    region:"istria",  gyg:GYG("pula-l344/food-drink-tc6/?q=inner+istria+food") },
  { id:23, name:"Pula Arena + Wine",       emoji:"🏟️", price:50,  dur:"6h",   rating:4.7, cat:"culture",   region:"istria",  gyg:GYG("pula-l344/food-drink-tc6/?q=istrian+wineries") },
  // ═══ KVARNER ═══
  { id:30, name:"Kvarner Bay Tour",        emoji:"⚓", price:55,  dur:"5h",   rating:4.8, cat:"culture",   region:"kvarner", gyg:GYG("opatija-l1296/best-of-kvarner-bay-half-day-tour-from-rijeka-or-opatija-t977515") },
  { id:31, name:"Cres Island Boat",        emoji:"🚢", price:120, dur:"8h",   rating:4.9, cat:"premium",   region:"kvarner", gyg:GYG("opatija-l1296?q=cres+island+boat") },
  { id:32, name:"Opatija Evening Cruise",  emoji:"🌙", price:45,  dur:"2h",   rating:4.8, cat:"premium",   region:"kvarner", gyg:GYG("opatija-l1296?q=evening+cruise+kvarner") },
  // ═══ KVARNER — RAB ═══
  { id:40, name:"Rab Old Town Tour",       emoji:"🏰", price:20,  dur:"1.5h", rating:4.9, cat:"culture",   region:"kvarner", gyg:GYG("rab-island-l3038/rab-old-town-guided-tour-t279756"),               viator:VIA("Rab/Old-Town-Walking-Tour/d50867") },
  { id:41, name:"Boat Tour 5 Beaches",     emoji:"⛵", price:55,  dur:"6h",   rating:4.8, cat:"premium",   region:"kvarner", gyg:GYG("rab-island-l3038?q=boat+tour+beaches"),                           viator:VIA("Rab/Boat-Tour-5-Beaches/d50867") },
  { id:42, name:"Sea Kayaking Rab",        emoji:"🛶", price:35,  dur:"3h",   rating:4.9, cat:"adventure", region:"kvarner", gyg:GYG("rab-island-l3038?q=sea+kayaking"),                                viator:VIA("Rab/Sea-Kayak-Tour/d50867") },
  { id:43, name:"Snorkeling + Wreck",      emoji:"🤿", price:45,  dur:"4h",   rating:4.7, cat:"adventure", region:"kvarner", gyg:GYG("rab-island-l3038?q=snorkeling+wreck") },
  { id:44, name:"E-Bike Island Loop",      emoji:"🚴", price:40,  dur:"4h",   rating:4.8, cat:"adventure", region:"kvarner", gyg:GYG("rab-island-l3038?q=ebike+cycling+tour") },
  { id:45, name:"Sunset Sailing Rab",      emoji:"🌅", price:60,  dur:"2.5h", rating:5.0, cat:"premium",   region:"kvarner", gyg:GYG("rab-island-l3038?q=sunset+sailing+wine") },
];

// ─── ACCOMMODATION (Booking.com affiliate links) ──────────────
export const ACCOMMODATION = [
  { region:"split",   emoji:"🏖️", name:{hr:"Podstrana & Split",de:"Podstrana & Split",en:"Podstrana & Split",it:"Podstrana & Spalato",si:"Podstrana & Split",cz:"Podstrana & Split",pl:"Podstrana & Split"}, note:{hr:"Blizu centra, plaže na dohvat ruke",de:"Stadtnah, Strände in Reichweite",en:"Near center, beaches within reach",it:"Vicino al centro",si:"Blizu centra",cz:"Blízko centra",pl:"Blisko centrum"}, link:BKG("Split, Croatia","&checkin=&checkout=&group_adults=2&no_rooms=1&sb_travel_purpose=leisure") },
  { region:"split",   emoji:"🏝️", name:{hr:"Makarska rivijera",de:"Makarska Riviera",en:"Makarska Riviera",it:"Riviera di Makarska",si:"Makarska riviera",cz:"Makarská riviéra",pl:"Riwiera Makarska"}, note:{hr:"Najljepše plaže Dalmacije",de:"Die schönsten Strände Dalmatiens",en:"Dalmatia's most beautiful beaches",it:"Le spiagge più belle",si:"Najlepše plaže Dalmacije",cz:"Nejkrásnější pláže",pl:"Najpiękniejsze plaże"}, link:BKG("Makarska, Croatia") },
  { region:"split",   emoji:"⛵", name:{hr:"Hvar",de:"Hvar",en:"Hvar",it:"Hvar",si:"Hvar",cz:"Hvar",pl:"Hvar"}, note:{hr:"Glamur + lavanda + noćni život",de:"Glamour + Lavendel + Nachtleben",en:"Glamour + lavender + nightlife",it:"Glamour + lavanda + vita notturna",si:"Glamur + sivka + nočno življenje",cz:"Glamour + levandule + noční život",pl:"Glamour + lawenda"}, link:BKG("Hvar, Croatia") },
  { region:"istria",  emoji:"🫒", name:{hr:"Rovinj",de:"Rovinj",en:"Rovinj",it:"Rovigno",si:"Rovinj",cz:"Rovinj",pl:"Rovinj"}, note:{hr:"Najromantičniji grad Istre",de:"Die romantischste Stadt Istriens",en:"Istria's most romantic town",it:"La città più romantica dell'Istria",si:"Najbolj romantično mesto Istre",cz:"Nejromantičtější město Istrie",pl:"Najbardziej romantyczne miasto"}, link:BKG("Rovinj, Croatia") },
  { region:"istria",  emoji:"🏟️", name:{hr:"Pula & Medulin",de:"Pula & Medulin",en:"Pula & Medulin",it:"Pola & Medulin",si:"Pula & Medulin",cz:"Pula & Medulin",pl:"Pula & Medulin"}, note:{hr:"Rimska arena + obiteljske plaže",de:"Römische Arena + Familienstrände",en:"Roman arena + family beaches",it:"Arena romana + spiagge per famiglie",si:"Rimska arena + družinske plaže",cz:"Římská aréna + rodinné pláže",pl:"Arena + plaże rodzinne"}, link:BKG("Pula, Croatia") },
  { region:"kvarner", emoji:"⚓", name:{hr:"Opatija",de:"Opatija",en:"Opatija",it:"Abbazia",si:"Opatija",cz:"Opatija",pl:"Opatija"}, note:{hr:"Biser Kvarnera, elegancija + šetnice",de:"Perle der Kvarner, Eleganz + Promenaden",en:"Pearl of Kvarner, elegance + promenades",it:"Perla del Quarnero",si:"Biser Kvarnerja",cz:"Perla Kvarneru",pl:"Perła Kwarneru"}, link:BKG("Opatija, Croatia") },
  { region:"kvarner", emoji:"🏝️", name:{hr:"Otok Krk",de:"Insel Krk",en:"Krk Island",it:"Isola di Krk",si:"Otok Krk",cz:"Ostrov Krk",pl:"Wyspa Krk"}, note:{hr:"Zlatni otok — most s kopnom",de:"Goldene Insel — Brücke zum Festland",en:"Golden island — bridge to mainland",it:"Isola d'oro — ponte",si:"Zlati otok — most s kopnim",cz:"Zlatý ostrov — most",pl:"Złota wyspa — most"}, link:BKG("Krk, Croatia") },
];

// ─── BUNDLES (pre-trip activity packages) ────────────────────
export const BUNDLES = [
  { emoji:"🏝️", includes:["Blue Cave 5 Islands","Split Walking Tour"], name:{hr:"Otoci + Povijest",de:"Inseln + Geschichte",en:"Islands + History",it:"Isole + Storia",si:"Otoki + Zgodovina",cz:"Ostrovy + Historie",pl:"Wyspy + Historia"}, tip:{hr:"Jedan dan more i otoci, drugi dan Dioklecijanova palača!",de:"Ein Tag Meer und Inseln, am nächsten Diokletianpalast!",en:"One day sea & islands, next day Diocletian's Palace!",it:"Un giorno mare e isole, il giorno dopo Diocleziano!",si:"En dan morje in otoki, naslednji dan Dioklecijanova palača!",cz:"Jeden den moře a ostrovy, druhý den Diokleciánův palác!",pl:"Jeden dzień morze i wyspy, następny Pałac Dioklecjana!"} },
  { emoji:"👨‍👩‍👧‍👦", includes:["Rafting Cetina","ATV Quad + Waterfall"], name:{hr:"Adrenalin paket",de:"Adrenalin-Paket",en:"Adrenaline Pack",it:"Pacchetto adrenalina",si:"Adrenalin paket",cz:"Adrenalinový balíček",pl:"Pakiet adrenaliny"}, tip:{hr:"Dva dana čistog adrenalina! Djeca 8+ na rafting.",de:"Zwei Tage purer Adrenalin! Kinder ab 8 zum Rafting.",en:"Two days of pure adrenaline! Kids 8+ can raft.",it:"Due giorni di pura adrenalina! Bambini 8+ al rafting.",si:"Dva dni čistega adrenalina! Otroci 8+ na rafting.",cz:"Dva dny čistého adrenalinu! Děti 8+ na rafting.",pl:"Dwa dni czystej adrenaliny! Dzieci 8+ na rafting."} },
  { emoji:"🍄", includes:["Truffle Hunting","Inner Istria + Food"], name:{hr:"Istra Gastro",de:"Istrien Gastro",en:"Istria Gastro",it:"Istria Gastro",si:"Istra Gastro",cz:"Istrie Gastro",pl:"Istria Gastro"}, tip:{hr:"Lov na tartufe + konobe unutrašnje Istre — nezaboravno!",de:"Trüffeljagd + Konobas des Hinterlands — unvergesslich!",en:"Truffle hunt + inland konobas — unforgettable!",it:"Caccia al tartufo + konobe dell'entroterra!",si:"Lov na tartufe + konobe notranje Istre — nepozabno!",cz:"Lov na lanýže + konoby vnitrozemí — nezapomenutelné!",pl:"Polowanie na trufle + konoby w głębi lądu!"} },
  { emoji:"💑", includes:["Sunset Cruise","Krka + Wine Tasting"], name:{hr:"Romantični bijeg",de:"Romantische Flucht",en:"Romantic Escape",it:"Fuga romantica",si:"Romantični pobeg",cz:"Romantický únik",pl:"Romantyczna ucieczka"}, tip:{hr:"Zalazak na brodu + vodopadi i vino — savršen dan za dvoje!",de:"Sonnenuntergang auf dem Boot + Wasserfälle und Wein!",en:"Sunset cruise + waterfalls and wine — perfect for two!",it:"Tramonto in barca + cascate e vino — perfetto per due!",si:"Zahod na ladji + slapovi in vino — popoln dan za dva!",cz:"Západ na lodi + vodopády a víno — perfektní pro dva!",pl:"Zachód na łodzi + wodospady i wino — idealny dla dwojga!"} },
];

// ─── LOYALTY TIERS ────────────────────────────────────────────
export const LOYALTY_TIERS = [
  { tier:"Morski val", min:0,   next:"Dalmatinac", nextPts:500  },
  { tier:"Dalmatinac", min:500, next:"Jadran",     nextPts:1200 },
  { tier:"Jadran",     min:1200,next:"Legend",     nextPts:3000 },
];
// Base data for static LOYALTY const (kept for backward compat)
export const LOYALTY = { tier:"Morski val", next:"Dalmatinac", nextPts:500 };

// ─── VIATOR FALLBACK (shown before API call returns) ──────────
export const VIATOR_FALLBACK = [
  { productCode:"GYG-001", title:"Split – Dioklecijanova palača",       description:"Razgledajte rimsku palaču iz 4. st. s lokalnim vodičem.",                          price:29,  rating:4.8, reviewCount:1240, duration:"2h",   category:"Kultura",  images:["https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=400"], bookingUrl:"https://www.getyourguide.com/split-l268/?partner_id=9OEGOYI&q=diocletian+palace+tour" },
  { productCode:"GYG-002", title:"Plava špilja & 5 otoka",              description:"Posjetite Plavu špilju, Hvar, Brač i uvale Paklenih otoka.",                        price:110, rating:4.9, reviewCount:6325, duration:"8h",   category:"Nautika",  images:["https://images.unsplash.com/photo-1503756234508-e32369269dde?w=400"], bookingUrl:"https://www.getyourguide.com/activity/-t326676?partner_id=9OEGOYI" },
  { productCode:"GYG-003", title:"NP Krka – izlet s prijevozom",        description:"Vodopadima Roski slap i Skradin Buk. Kupanje u rijeci Krki uključeno.",              price:65,  rating:4.7, reviewCount:890,  duration:"9h",   category:"Priroda",  images:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"], bookingUrl:"https://www.getyourguide.com/split-l268/?partner_id=9OEGOYI&q=krka+waterfalls" },
  { productCode:"GYG-004", title:"Rafting na Cetini iz Omiša",          description:"Adrenalinska avantura u kanjonu Cetine. Oprema uključena.",                          price:40,  rating:4.8, reviewCount:650,  duration:"3h",   category:"Avantura", images:["https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400"], bookingUrl:"https://www.getyourguide.com/omis-l2760/?partner_id=9OEGOYI&q=rafting+cetina" },
  { productCode:"GYG-005", title:"Hvar + Pakleni otoci",                description:"Cjelodnevni izlet do Hvara, Paklenih otoka — ručak uključen.",                       price:89,  rating:4.8, reviewCount:2100, duration:"10h",  category:"Nautika",  images:["https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400"], bookingUrl:"https://www.getyourguide.com/split-l268/?partner_id=9OEGOYI&q=hvar+pakleni" },
  { productCode:"GYG-006", title:"Plitvička jezera & Rastoke",          description:"Nacionalni park Plitvice s ulazninom i transferom iz Splita ili Zadra.",              price:99,  rating:4.9, reviewCount:3015, duration:"12h",  category:"Priroda",  images:["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"], bookingUrl:"https://www.getyourguide.com/activity/-t406236?partner_id=9OEGOYI" },
];

// ─── INTERESTS ────────────────────────────────────────────────
export const INTEREST_LABELS = {
  gastro:{hr:"Gastronomija",de:"Gastronomie",en:"Gastronomy",it:"Gastronomia",si:"Gastronomija",cz:"Gastronomie",pl:"Gastronomia"},
  adventure:{hr:"Avantura",de:"Abenteuer",en:"Adventure",it:"Avventura",si:"Pustolovščina",cz:"Dobrodružství",pl:"Przygoda"},
  culture:{hr:"Kultura",de:"Kultur",en:"Culture",it:"Cultura",si:"Kultura",cz:"Kultura",pl:"Kultura"},
  beach:{hr:"Plaže",de:"Strände",en:"Beaches",it:"Spiagge",si:"Plaže",cz:"Pláže",pl:"Plaże"},
  wellness:{hr:"Wellness",de:"Wellness",en:"Wellness",it:"Benessere",si:"Wellness",cz:"Wellness",pl:"Wellness"},
  kids:{hr:"Obitelj",de:"Familie",en:"Family",it:"Famiglia",si:"Družina",cz:"Rodina",pl:"Rodzina"},
  nightlife:{hr:"Noćni život",de:"Nachtleben",en:"Nightlife",it:"Vita notturna",si:"Nočno življenje",cz:"Noční život",pl:"Życie nocne"},
  nature:{hr:"Priroda",de:"Natur",en:"Nature",it:"Natura",si:"Narava",cz:"Příroda",pl:"Przyroda"},
};
export const INTERESTS = [
  {k:"gastro",e:"🍷"},{k:"adventure",e:"🏔️"},{k:"culture",e:"🏛️"},{k:"beach",e:"🏖️"},
  {k:"wellness",e:"🧖"},{k:"kids",e:"👨‍👩‍👧‍👦"},{k:"nightlife",e:"🍸"},{k:"nature",e:"🌿"},
];

// ─── LANGUAGES ────────────────────────────────────────────────
export const LANGS = [
  {code:"hr",flag:"🇭🇷",name:"Hrvatski"}, {code:"de",flag:"🇩🇪",name:"Deutsch"},
  {code:"at",flag:"🇦🇹",name:"Österreich"}, {code:"en",flag:"🇬🇧",name:"English"},
  {code:"it",flag:"🇮🇹",name:"Italiano"}, {code:"si",flag:"🇸🇮",name:"Slovenščina"},
  {code:"cz",flag:"🇨🇿",name:"Čeština"}, {code:"pl",flag:"🇵🇱",name:"Polski"},
];

// ─── TRANSLATIONS ─────────────────────────────────────────────
const T = {
  preTrip:{hr:"Prije dolaska",de:"Vor Anreise",en:"Pre-Trip",it:"Pre-viaggio",si:"Pred prihodom",cz:"Před příjezdem",pl:"Przed przyjazdem"},
  kiosk:{hr:"Kiosk · Boravak",de:"Kiosk · Aufenthalt",en:"Kiosk · Stay",it:"Kiosk · Soggiorno",si:"Kiosk · Bivanje",cz:"Kiosk · Pobyt",pl:"Kiosk · Pobyt"},
  postStay:{hr:"Nakon odlaska",de:"Nach Abreise",en:"Post-Stay",it:"Post-soggiorno",si:"Po odhodu",cz:"Po odjezdu",pl:"Po wyjeździe"},
  back:{hr:"← Natrag",de:"← Zurück",en:"← Back",it:"← Indietro",si:"← Nazaj",cz:"← Zpět",pl:"← Wstecz"},
  quickAccess:{hr:"BRZI PRISTUP",de:"SCHNELLZUGRIFF",en:"QUICK ACCESS",it:"ACCESSO RAPIDO",si:"HITRI DOSTOP",cz:"RYCHLÝ PŘÍSTUP",pl:"SZYBKI DOSTĘP"},
  activities:{hr:"AKTIVNOSTI",de:"AKTIVITÄTEN",en:"ACTIVITIES",it:"ATTIVITÀ",si:"AKTIVNOSTI",cz:"AKTIVITY",pl:"AKTYWNOŚCI"},
  book:{hr:"REZERVIRAJ",de:"BUCHEN",en:"BOOK",it:"PRENOTA",si:"REZERVIRAJ",cz:"REZERVOVAT",pl:"ZAREZERWUJ"},
  bookNow:{hr:"Rezerviraj →",de:"Jetzt buchen →",en:"Book now →",it:"Prenota ora →",si:"Rezerviraj →",cz:"Rezervovat →",pl:"Zarezerwuj →"},
  bookSent:{hr:"Rezervacija poslana!",de:"Buchung gesendet!",en:"Booking sent!",it:"Prenotazione inviata!",si:"Rezervacija poslana!",cz:"Rezervace odeslána!",pl:"Rezerwacja wysłana!"},
  bookConfirm:{hr:"Potvrda unutar 30 min na vaš email.",de:"Bestätigung innerhalb von 30 Min per E-Mail.",en:"Confirmation within 30 min to your email.",it:"Conferma entro 30 min alla tua email.",si:"Potrditev v 30 min na vaš email.",cz:"Potvrzení do 30 min na váš email.",pl:"Potwierdzenie w ciągu 30 min na Twój email."},
  perPerson:{hr:"po osobi",de:"pro Person",en:"per person",it:"a persona",si:"na osebo",cz:"na osobu",pl:"od osoby"},
  day:{hr:"Dan",de:"Tag",en:"Day",it:"Giorno",si:"Dan",cz:"Den",pl:"Dzień"},
  aiRec:{hr:"AI PREPORUKA",de:"AI-EMPFEHLUNG",en:"AI RECOMMENDATION",it:"SUGGERIMENTO AI",si:"AI PRIPOROČILO",cz:"AI DOPORUČENÍ",pl:"REKOMENDACJA AI"},
  parking:{hr:"Parking",de:"Parkplatz",en:"Parking",it:"Parcheggio",si:"Parkiranje",cz:"Parkování",pl:"Parking"},
  beaches:{hr:"Plaže",de:"Strände",en:"Beaches",it:"Spiagge",si:"Plaže",cz:"Pláže",pl:"Plaże"},
  sun:{hr:"Sunce & UV",de:"Sonne & UV",en:"Sun & UV",it:"Sole & UV",si:"Sonce & UV",cz:"Slunce & UV",pl:"Słońce & UV"},
  emergency:{hr:"Hitno",de:"Notfall",en:"Emergency",it:"Emergenza",si:"Nujno",cz:"Nouzové",pl:"Nagłe"},
  gems:{hr:"Hidden Gems",de:"Hidden Gems",en:"Hidden Gems",it:"Gemme Nascoste",si:"Skriti dragulji",cz:"Skryté perly",pl:"Ukryte perły"},
  aiGuide:{hr:"AI Vodič",de:"AI-Guide",en:"AI Guide",it:"Guida AI",si:"AI Vodič",cz:"AI Průvodce",pl:"AI Przewodnik"},
  navigate:{hr:"Navigiraj",de:"Navigieren",en:"Navigate",it:"Naviga",si:"Navigiraj",cz:"Navigovat",pl:"Nawiguj"},
  welcome:{hr:"Dobrodošli u JADRAN AI",de:"Willkommen bei JADRAN AI",en:"Welcome to JADRAN AI",it:"Benvenuti su JADRAN AI",si:"Dobrodošli v JADRAN AI",cz:"Vítejte v JADRAN AI",pl:"Witamy w JADRAN AI"},
  interests:{hr:"Što vas zanima?",de:"Was interessiert Sie?",en:"What interests you?",it:"Cosa ti interessa?",si:"Kaj vas zanima?",cz:"Co vás zajímá?",pl:"Co Cię interesuje?"},
  chooseMin:{hr:"Odaberite najmanje 2",de:"Wählen Sie mindestens 2",en:"Choose at least 2",it:"Scegli almeno 2",si:"Izberite vsaj 2",cz:"Vyberte alespoň 2",pl:"Wybierz co najmniej 2"},
  next:{hr:"Dalje →",de:"Weiter →",en:"Next →",it:"Avanti →",si:"Naprej →",cz:"Další →",pl:"Dalej →"},
  premiumTitle:{hr:"JADRAN AI Premium",de:"JADRAN AI Premium",en:"JADRAN AI Premium",it:"JADRAN AI Premium",si:"JADRAN AI Premium",cz:"JADRAN AI Premium",pl:"JADRAN AI Premium"},
  premiumDesc:{hr:"Otključajte AI vodič, skrivena mjesta i personalizirane preporuke.",de:"Schalten Sie AI-Guide, versteckte Orte und personalisierte Empfehlungen frei.",en:"Unlock AI guide, hidden places, and personalized recommendations.",it:"Sblocca guida AI, luoghi nascosti e consigli personalizzati.",si:"Odklenite AI vodič, skrita mesta in prilagojene priporočila.",cz:"Odemkněte AI průvodce, skrytá místa a personalizovaná doporučení.",pl:"Odblokuj przewodnik AI, ukryte miejsca i spersonalizowane rekomendacje."},
  askAnything:{hr:"Pitajte bilo što o Jadranu",de:"Fragen Sie alles über die Adria",en:"Ask anything about the Adriatic",it:"Chiedi qualsiasi cosa sull'Adriatico",si:"Vprašajte karkoli o Jadranu",cz:"Zeptejte se na cokoliv o Jadranu",pl:"Zapytaj o cokolwiek nad Adriatykiem"},
  askPlaceholder:{hr:"Pitajte nešto...",de:"Fragen Sie etwas...",en:"Ask something...",it:"Chiedi qualcosa...",si:"Vprašajte...",cz:"Zeptejte se...",pl:"Zapytaj..."},
  thanks:{hr:"Hvala",de:"Danke",en:"Thank you",it:"Grazie",si:"Hvala",cz:"Děkujeme",pl:"Dziękujemy"},
  inviteFriends:{hr:"Pozovite prijatelje — 15% popust",de:"Freunde einladen — 15% Rabatt",en:"Invite friends — 15% off",it:"Invita amici — 15% di sconto",si:"Povabite prijatelje — 15% popust",cz:"Pozvěte přátele — 15% sleva",pl:"Zaproś przyjaciół — 15% zniżki"},
  shareCode:{hr:"Podijeli kod →",de:"Code teilen →",en:"Share code →",it:"Condividi codice →",si:"Deli kodo →",cz:"Sdílet kód →",pl:"Udostępnij kod →"},
  nextYear:{hr:"Sljedeće godine? 🏖️",de:"Nächstes Jahr? 🏖️",en:"Next year? 🏖️",it:"L'anno prossimo? 🏖️",si:"Prihodnje leto? 🏖️",cz:"Příští rok? 🏖️",pl:"Następny rok? 🏖️"},
  morning:{hr:"Dobro jutro",de:"Guten Morgen",en:"Good morning",it:"Buongiorno",si:"Dobro jutro",cz:"Dobré ráno",pl:"Dzień dobry"},
  midday:{hr:"Dobar dan",de:"Guten Tag",en:"Good afternoon",it:"Buon pomeriggio",si:"Dober dan",cz:"Dobré odpoledne",pl:"Dzień dobry"},
  evening:{hr:"Dobra večer",de:"Guten Abend",en:"Good evening",it:"Buonasera",si:"Dober večer",cz:"Dobrý večer",pl:"Dobry wieczór"},
  night:{hr:"Laku noć",de:"Gute Nacht",en:"Good night",it:"Buonanotte",si:"Lahko noč",cz:"Dobrou noc",pl:"Dobranoc"},
  forecast:{hr:"PROGNOZA",de:"WETTERVORHERSAGE",en:"WEATHER FORECAST",it:"PREVISIONI METEO",si:"NAPOVED",cz:"PŘEDPOVĚĎ",pl:"PROGNOZA"},
  onTheRoad:{hr:"NA PUTU",de:"UNTERWEGS",en:"ON THE ROAD",it:"IN VIAGGIO",si:"NA POTI",cz:"NA CESTĚ",pl:"W DRODZE"},
  arrival:{hr:"DOLAZAK",de:"ANKUNFT",en:"ARRIVAL",it:"ARRIVO",si:"PRIHOD",cz:"PŘÍJEZD",pl:"PRZYJAZD"},
  safeTrip:{hr:"Sretan put!",de:"Gute Reise!",en:"Safe travels!",it:"Buon viaggio!",si:"Srečno pot!",cz:"Šťastnou cestu!",pl:"Szczęśliwej podróży!"},
  arrived:{hr:"Stigli! → Pokreni Kiosk",de:"Angekommen! → Kiosk starten",en:"Arrived! → Start Kiosk",it:"Arrivati! → Avvia Kiosk",si:"Prispeli! → Zaženi Kiosk",cz:"Dorazili! → Spustit Kiosk",pl:"Przyjechaliśmy! → Uruchom Kiosk"},
  daysToGo:{hr:"dana do odmora",de:"Tage bis zum Urlaub",en:"days until vacation",it:"giorni alla vacanza",si:"dni do počitnic",cz:"dní do dovolené",pl:"dni do wakacji"},
  points:{hr:"bodova",de:"Punkte",en:"points",it:"punti",si:"točk",cz:"bodů",pl:"punktów"},
  more:{hr:"još",de:"Noch",en:"more",it:"ancora",si:"še",cz:"ještě",pl:"jeszcze"},
  unforgettable:{hr:"Nezaboravno",de:"Unvergesslich",en:"Unforgettable",it:"Indimenticabile",si:"Nepozabno",cz:"Nezapomenutelné",pl:"Niezapomniane"},
  bothDiscount:{hr:"Oboje dobivate popust na sljedeću rezervaciju",de:"Beide erhalten Rabatt auf die nächste Buchung",en:"Both of you get a discount on next booking",it:"Entrambi ottenete uno sconto",si:"Oba dobita popust na naslednjo rezervacijo",cz:"Oba získáte slevu na příští rezervaci",pl:"Oboje otrzymujecie zniżkę"},
  localTip:{hr:"Lokalni znaju — turisti ne",de:"Einheimische wissen — Touristen nicht",en:"Locals know — tourists don't",it:"I locali sanno — i turisti no",si:"Domačini vedo — turisti ne",cz:"Místní ví — turisté ne",pl:"Lokalni wiedzą — turyści nie"},
  checkOut:{hr:"Check-out →",de:"Check-out →",en:"Check-out →",it:"Check-out →",si:"Check-out →",cz:"Check-out →",pl:"Check-out →"},
  chatPrompt1:{hr:"Što danas s djecom?",de:"Was heute mit Kindern?",en:"What to do with kids today?",it:"Cosa fare con i bambini oggi?",si:"Kaj danes z otroki?",cz:"Co dnes s dětmi?",pl:"Co dziś z dziećmi?"},
  chatPrompt2:{hr:"Tajne plaže?",de:"Geheime Strände?",en:"Secret beaches?",it:"Spiagge segrete?",si:"Skrite plaže?",cz:"Tajné pláže?",pl:"Tajne plaże?"},
  chatPrompt3:{hr:"Preporuka za večeru?",de:"Abendessen-Tipp?",en:"Dinner recommendation?",it:"Consiglio per cena?",si:"Priporočilo za večerjo?",cz:"Tip na večeři?",pl:"Polecenie na kolację?"},
  chatPrompt4:{hr:"Gdje parkirati u Splitu?",de:"Wo parken in Split?",en:"Where to park in Split?",it:"Dove parcheggiare a Spalato?",si:"Kje parkirati v Splitu?",cz:"Kde parkovat ve Splitu?",pl:"Gdzie parkować w Splicie?"},
  bookVia:{hr:"Rezerviraj preko",de:"Buchen über",en:"Book via",it:"Prenota tramite",si:"Rezerviraj prek",cz:"Rezervovat přes",pl:"Zarezerwuj przez"},
  familyPrice:{hr:"Obitelj",de:"Familie",en:"Family",it:"Famiglia",si:"Družina",cz:"Rodina",pl:"Rodzina"},
  revenue:{hr:"PRIHOD",de:"UMSATZ",en:"REVENUE",it:"RICAVI",si:"PRIHODKI",cz:"PŘÍJMY",pl:"PRZYCHODY"},
  findStay:{hr:"PRONAĐI SMJEŠTAJ",de:"UNTERKUNFT FINDEN",en:"FIND ACCOMMODATION",it:"TROVA ALLOGGIO",si:"NAJDI NASTANITEV",cz:"NAJÍT UBYTOVÁNÍ",pl:"ZNAJDŹ NOCLEG"},
  planNext:{hr:"Planirajte sljedeći odmor",de:"Planen Sie den nächsten Urlaub",en:"Plan your next vacation",it:"Pianifica la prossima vacanza",si:"Načrtujte naslednje počitnice",cz:"Naplánujte další dovolenou",pl:"Zaplanuj następne wakacje"},
  browseOn:{hr:"Pogledaj na Booking.com →",de:"Auf Booking.com ansehen →",en:"Browse on Booking.com →",it:"Cerca su Booking.com →",si:"Poglej na Booking.com →",cz:"Prohlédnout na Booking.com →",pl:"Zobacz na Booking.com →"},
  payFeatures1:{hr:"AI Vodič — pitajte bilo što 24/7",de:"AI-Guide — fragen Sie alles 24/7",en:"AI Guide — ask anything 24/7",it:"Guida AI — chiedi qualsiasi cosa 24/7",si:"AI Vodič — vprašajte karkoli 24/7",cz:"AI Průvodce — ptejte se na cokoliv 24/7",pl:"Przewodnik AI — pytaj o cokolwiek 24/7"},
  payFeatures2:{hr:"6 Hidden Gems sa lokalnim savjetima",de:"6 Hidden Gems mit lokalen Tipps",en:"6 Hidden Gems with local tips",it:"6 Gemme nascoste con consigli locali",si:"6 skritih draguljev z lokalnimi nasveti",cz:"6 skrytých perel s místními tipy",pl:"6 ukrytych pereł z lokalnymi wskazówkami"},
  payFeatures3:{hr:"Personalizirane preporuke po vremenu i interesima",de:"Personalisierte Empfehlungen nach Wetter und Interessen",en:"Personalized recommendations by weather and interests",it:"Consigli personalizzati per meteo e interessi",si:"Prilagojene priporočila po vremenu in interesih",cz:"Personalizovaná doporučení podle počasí a zájmů",pl:"Spersonalizowane rekomendacje wg pogody i zainteresowań"},
  payFeatures4:{hr:"Rezervacije aktivnosti s vodičem",de:"Reiseberater-Buchung von Aktivitäten",en:"Guided activity bookings",it:"Prenotazione attività con guida",si:"Rezervacije aktivnosti s vodičem",cz:"Rezervace aktivit s průvodcem",pl:"Rezerwacje aktywności z przewodnikiem"},
  payFeatures5:{hr:"Loyalty bodovi i popusti za sljedeći put",de:"Treuepunkte und Rabatte für den nächsten Besuch",en:"Loyalty points and discounts for next visit",it:"Punti fedeltà e sconti per la prossima visita",si:"Točke zvestobe in popusti za naslednjič",cz:"Věrnostní body a slevy na příští návštěvu",pl:"Punkty lojalnościowe i zniżki na następny pobyt"},
  payVia:{hr:"Plaćanje putem Stripe · SIAL Consulting d.o.o.",de:"Zahlung über Stripe · SIAL Consulting d.o.o.",en:"Payment via Stripe · SIAL Consulting d.o.o.",it:"Pagamento tramite Stripe · SIAL Consulting d.o.o.",si:"Plačilo prek Stripe · SIAL Consulting d.o.o.",cz:"Platba přes Stripe · SIAL Consulting d.o.o.",pl:"Płatność przez Stripe · SIAL Consulting d.o.o."},
  earlyBird:{hr:"Early Bird 2027: 20% popusta pri rezervaciji prije 1. listopada.",de:"Early Bird 2027: 20% Rabatt bei Buchung vor 1. Oktober.",en:"Early Bird 2027: 20% off when booking before October 1st.",it:"Early Bird 2027: 20% di sconto prenotando prima del 1° ottobre.",si:"Early Bird 2027: 20% popusta pri rezervaciji pred 1. oktobrom.",cz:"Early Bird 2027: 20% sleva při rezervaci před 1. říjnem.",pl:"Early Bird 2027: 20% zniżki przy rezerwacji przed 1 października."},
  transitTip1:{hr:"Ljubljana za 2h — preporučujemo Gostilna Pri Lojzetu. Zadnja jeftina pumpa prije HR granice.",de:"Ljubljana in 2h — wir empfehlen Gostilna Pri Lojzetu. Letzte günstige Tankstelle vor HR-Grenze.",en:"Ljubljana in 2h — we recommend Gostilna Pri Lojzetu. Last cheap gas before HR border.",it:"Lubiana in 2h — consigliamo Gostilna Pri Lojzetu. Ultimo distributore economico prima del confine HR.",si:"Ljubljana čez 2h — priporočamo Gostilna Pri Lojzetu.",cz:"Lublaň za 2h — doporučujeme Gostilna Pri Lojzetu.",pl:"Lublana za 2h — polecamy Gostilna Pri Lojzetu."},
  transitTip2:{hr:"HR cestarina: ~28€ do Splita. ENC preporučen. A1 HR SIM za 7€ u prvoj benzinskoj.",de:"HR Maut: ~28€ bis Split. ENC empfohlen. A1 HR SIM für 7€ an der ersten Tankstelle.",en:"HR toll: ~28€ to Split. ENC recommended. A1 HR SIM for 7€ at first gas station.",it:"Pedaggio HR: ~28€ fino a Spalato. ENC consigliato. SIM A1 HR per 7€.",si:"HR cestnina: ~28€ do Splita. ENC priporočen.",cz:"HR mýtné: ~28€ do Splitu. ENC doporučen.",pl:"Opłata HR: ~28€ do Splitu. ENC zalecany."},
  transitTip3:{hr:"Još ~45 min! Domaćin {HOST} obaviješten. Konzum 400m od apartmana za prvi shopping.",de:"Noch ~45 Min! Gastgeber {HOST} informiert. Konzum 400m von der Unterkunft für ersten Einkauf.",en:"~45 min left! Host {HOST} notified. Konzum 400m from apartment for first shopping.",it:"Ancora ~45 min! Host {HOST} avvisato. Konzum a 400m dall'appartamento.",si:"Še ~45 min! Gostitelj {HOST} obveščen.",cz:"Ještě ~45 min! Hostitel {HOST} informován.",pl:"Jeszcze ~45 min! Gospodarz {HOST} powiadomiony."},
  booked:{hr:"Rezervirano",de:"Gebucht",en:"Booked",it:"Prenotato",si:"Rezervirano",cz:"Zarezervováno",pl:"Zarezerwowano"},
  daysStay:{hr:"dana",de:"Tage",en:"days",it:"giorni",si:"dni",cz:"dní",pl:"dni"},
  skipBtn:{hr:"Preskoči",de:"Überspringen",en:"Skip",it:"Salta",si:"Preskoči",cz:"Přeskočit",pl:"Pomiń"},
  tagline:{hr:"Vaš Jadran, reimaginiran",de:"Ihre Adria, neu gedacht",en:"Your Adriatic, Reimagined",it:"Il tuo Adriatico, reinventato",si:"Vaš Jadran, na novo",cz:"Váš Jadran, znovu",pl:"Twój Adriatyk, na nowo"},
  askDalmatia:{hr:"Pitajte bilo što o Dalmaciji",de:"Fragen Sie alles über Dalmatien",en:"Ask anything about Dalmatia",it:"Chiedi qualsiasi cosa sulla Dalmazia",si:"Vprašajte karkoli o Dalmaciji",cz:"Zeptejte se na cokoliv o Dalmácii",pl:"Zapytaj o cokolwiek o Dalmacji"},
  sea:{hr:"More",de:"Meer",en:"Sea",it:"Mare",si:"Morje",cz:"Moře",pl:"Morze"},
  sunset:{hr:"Zalazak sunca",de:"Sonnenuntergang",en:"Sunset",it:"Tramonto",si:"Sončni zahod",cz:"Západ slunce",pl:"Zachód słońca"},
  sunny:{hr:"Sunčano",de:"Sonnig",en:"Sunny",it:"Soleggiato",si:"Sončno",cz:"Slunečno",pl:"Słonecznie"},
};

// AT always equals DE
Object.keys(T).forEach(k => { if (T[k]?.de !== undefined) T[k].at = T[k].de; });

// ─── TRANSLATE HELPER ─────────────────────────────────────────
export const t = (key, lang) => {
  const entry = T[key];
  if (!entry) return key;
  const l = lang === "at" ? "de" : lang;
  return entry[l] || entry.hr || entry.en || key;
};

// ─── NAVIGATION HELPER ────────────────────────────────────────
export const navigateTo = (lat, lng) => {
  if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
};

// ─── ALERT METADATA ──────────────────────────────────────────
export const ALERT_ICONS = {
  fire:"🔥", wind:"🌬️", storm:"⛈", rain:"🌧️", heat:"🌡️", coastal:"🌊",
  flood:"💧", fog:"🌫️", snow:"❄️", road_closure:"⚠️", ferry_cancelled:"⛴",
  bura_closure:"🌬️", traffic_jam:"🚗", roadworks:"🔧", travel_advisory:"🇩🇪",
  weather:"⛈", default:"⚠️",
};
export const ALERT_COLORS = { critical:"#ef4444", high:"#f59e0b", medium:"#38bdf8" };

// ─── SEGMENT ICONS ────────────────────────────────────────────
export const SEG_ICON = { kamper:"🚐", porodica:"👨‍👩‍👧", par:"💑", jedrilicar:"⛵" };

// ─── NEARBY CATEGORIES ───────────────────────────────────────
export const NEARBY_CATS = ["parking","food","shop","beach","pharmacy","bakery","culture","fuel"];

// ─── FILTER UTILITY ──────────────────────────────────────────
// Generic region filter — used by StandaloneAI and KioskActivities
export const filterByRegion = (arr, region) => {
  if (!region || region === "all") return arr;
  return arr.filter(item => item.region === region);
};

// ─── BOOKING CITIES (Booking.com affiliate per region) ────────
export const BOOKING_CITIES = [
  { region:"split",    name:"Split & Dalmacija",  link:BKG("Split, Croatia","&group_adults=2&no_rooms=1") },
  { region:"istria",   name:"Istra",              link:BKG("Istria, Croatia","&group_adults=2&no_rooms=1") },
  { region:"kvarner",  name:"Kvarner & Rab",      link:BKG("Kvarner, Croatia","&group_adults=2&no_rooms=1") },
  { region:"zadar",    name:"Zadar & Šibenik",    link:BKG("Zadar, Croatia","&group_adults=2&no_rooms=1") },
  { region:"dubrovnik",name:"Dubrovnik & Pelješac",link:BKG("Dubrovnik, Croatia","&group_adults=2&no_rooms=1") },
];

// ─── CAMPER WARNINGS (road/tunnel/bura alerts per region) ────
export const CAMPER_WARNINGS = [
  { region:"split",    name:"Karavanke tunel",  link:"https://www.dars.si/Tunnels/Karavanke_Tunnel.aspx",  note:"Visinska ograničenja! Max visina 4.1m. Platite online.", emoji:"🚧" },
  { region:"split",    name:"A1 Autocesta HR",  link:"https://www.hac.hr/en/toll-calculation",              note:"Cestarina do Splita ~28€. ENC štedi 15%.", emoji:"💳" },
  { region:"kvarner",  name:"Bura — Kvarner",   link:"https://www.hak.hr/en/road-conditions/",             note:"Bura može zatvoriti most na Krk. Pratite HAK.", emoji:"🌬️" },
  { region:"kvarner",  name:"Most Krk",         link:"https://www.hak.hr/en/road-conditions/",             note:"Plaćanje mostarine na izlazu. Kamper max 7.5t.", emoji:"🌉" },
  { region:"istria",   name:"Učka tunel",        link:"https://www.bina-istra.hr/en/ucka-tunnel",           note:"Max visina 4.8m, max širina 2.5m.", emoji:"🚇" },
  { region:"dubrovnik",name:"Granica BiH",       link:"https://www.mvep.hr/en/",                            note:"Prolaz kroz Neum — biometrijska osobna karta OK.", emoji:"🛃" },
];

// ─── MARINAS (nautical, per region) ──────────────────────────
export const MARINAS = [
  { region:"kvarner", name:"Marina Rab",        berths:200, maxLen:"20m", price:"od 35€/noć", fuel:true,  vhf:"17", note:"U samom centru grada. Voda i struja uključeni." },
  { region:"kvarner", name:"Marina Punat (Krk)",berths:800, maxLen:"40m", price:"od 55€/noć", fuel:true,  vhf:"17", note:"Jedna od najvećih marina u Hrvatskoj. Restoran, servis." },
  { region:"kvarner", name:"Marina Opatija",    berths:170, maxLen:"20m", price:"od 50€/noć", fuel:false, vhf:"17", note:"Gradska marina, blizu centra Opatije." },
  { region:"split",   name:"Marina Split ACI",  berths:355, maxLen:"40m", price:"od 60€/noć", fuel:true,  vhf:"17", note:"Najbliža marina centru Splita. Punjenje el. vozila." },
  { region:"split",   name:"Marina Trogir ACI", berths:200, maxLen:"25m", price:"od 45€/noć", fuel:true,  vhf:"17", note:"Pored UNESCO Starog Grada Trogira. Odlična zaštita." },
  { region:"split",   name:"Marina Hvar",       berths:160, maxLen:"50m", price:"od 80€/noć", fuel:true,  vhf:"73", note:"Elitna marina u srcu Hvara. Rezervacija obavezna." },
  { region:"dubrovnik",name:"Marina Dubrovnik", berths:437, maxLen:"50m", price:"od 90€/noć", fuel:true,  vhf:"17", note:"Jedina marina u blizini zidina. Čarter baza." },
  { region:"istria",  name:"Marina Rovinj",     berths:400, maxLen:"50m", price:"od 55€/noć", fuel:true,  vhf:"17", note:"Romantični Rovinj. Servis, brodogradilište." },
];

// ─── ANCHORAGES (sailing sidrišta per region) ────────────────
export const ANCHORAGES = [
  { region:"kvarner",  name:"Uvala Sv. Eufemija",  depth:"4-8m", bottom:"pijesak",  shelter:"Sjever, Zapad", fee:"besplatno", note:"Odlično sidrište, kristalno more." },
  { region:"kvarner",  name:"Uvala Supetarska Draga", depth:"3-6m",bottom:"pijesak", shelter:"Sve smjerove",  fee:"besplatno", note:"Zaštićena uvala, blizina sela Supetarska Draga." },
  { region:"split",    name:"Pakleni otoci — Palmižana",depth:"4-10m",bottom:"pijesak",shelter:"Sjever",    fee:"50kn/noć", note:"Najpopularnije sidrište Hvara. Restoran na obali." },
  { region:"split",    name:"Uvala Stiniva (Vis)",  depth:"5-8m", bottom:"kamen",   shelter:"Sjever, Istok", fee:"besplatno", note:"Najljepša plaža Jadrana. Dolaziti ujutro." },
  { region:"dubrovnik",name:"Koločep — Donje Čelo", depth:"3-5m", bottom:"pijesak", shelter:"Svi smjerovi",  fee:"besplatno", note:"Mirni otok 15min od Dubrovnika." },
  { region:"istria",   name:"Uvala Funtana",        depth:"4-7m", bottom:"pijesak", shelter:"Sjever, Zapad", fee:"besplatno", note:"Mirna istrska uvala blizu Poreča." },
];

// ─── CRUISE PORTS (kruzeri intel) ────────────────────────────
export const CRUISE_PORTS = [
  { region:"split", name:"Luka Split",
    terminal:"Cruise terminal Domaći", shuttle:"pješice do centra (5min)",
    mustSee:"Dioklecijanova palača (5min pješice), Marjan šuma (25min)",
    avoid:"Restoran u starom gradu između 11-14h (prenatrpano)",
    foodTip:"Konoba Matoni — 10min hoda, lokalna riba po razumnoj cijeni",
    shopping:"Marmontova ulica, Pazar market (svježe voće, sir, pršut)",
    timePlan:"8h: Palača + Vestibul. 10h: Marjan uspon. 12h: ručak Matoni. 14h: Kašjuni plaža. 16h: ukrcaj." },
  { region:"dubrovnik", name:"Luka Dubrovnik (Gruž)",
    terminal:"Dubrovnik Cruise Port Gruž", shuttle:"bus 1a do Pile (15min, 2€)",
    mustSee:"Zidine (18€, rano ujutro!), Stara ulica Stradun, Lokalitet Lokrum",
    avoid:"Cable car u jutarnjim satima (2h čekanja). Stradun 10-15h.",
    foodTip:"Konoba Lokanda Peskarija — Bunićeva poljana, svježa riba, lokalni wine",
    shopping:"Zrinsko-Frankopanska ulica — lokalni proizvodi, bez turističkih kičeva",
    timePlan:"7:30h: Zidine (bez gužve!). 10h: Lokrum otočić. 13h: ručak Peskarija. 15h: Stradun + kupovina. 17h: bus Gruž." },
  { region:"kvarner", name:"Luka Rijeka",
    terminal:"Rijeka Cruise Port", shuttle:"pješice do centra (10min)",
    mustSee:"Korzo šetnica, Trsatska gradina, Guvernerova palača",
    avoid:"Nema posebnih upozorenja za turiste",
    foodTip:"Municipium Restaurant — Korzo, dalmatinska kuhinja u secesijskim prostorima",
    shopping:"Korzo 16 — lokalni delikatesni shop, istarska tartufi, vino",
    timePlan:"9h: Trsatska gradina (30min do vrha). 11h: Korzo šetnja. 13h: ručak Municipium. 15h: Guvernerova palača. 17h: ukrcaj." },
];

// ─── DEEP LOCAL INTEL (insider tips per region) ───────────────
// Each region key → array of {id, emoji, spot, intel}
export const DEEP_LOCAL = {
  split: [
    { id:"sl1", emoji:"🐟", spot:"Tržnica (Pazar) u 7h", intel:"Lokalni ribari prodaju ulov direktno s broda. Cijena upola manja nego u restoranima. Pitajte za 'brancin' ili 'komarča' — uvijek svježe." },
    { id:"sl2", emoji:"🍕", spot:"Kantun — ulica Augusta Šenoe 2", intel:"Najautentičniji burek u Splitu. Radi od 5h. Lokalni policajci i taksisti jedu ovdje. Redovi se cijene." },
    { id:"sl3", emoji:"🚗", spot:"Parking Split 3 (Brodarica)", intel:"Najjeftiniji parking blizu centra — 8kn/h. 7min pješice do Zlatnih vrata. Uvijek ima mjesta." },
  ],
  kvarner: [
    { id:"kl1", emoji:"🐑", spot:"Janjetina s otoka Cresa", intel:"Creska janjad su specifičnog okusa zbog trave aromatics. Naručite 24h unaprijed u bilo kojoj konobi na Cresu — nije na jelovniku ali uvijek postoji." },
    { id:"kl2", emoji:"🌲", spot:"Borova šuma Rab — jutarnja šetnja", intel:"3.5km staza od Raba prema Kamporu kroz najgušću borovu šumu Jadrana. Temperatura za 4-5°C niža nego na plaži. Idealno 7-9h." },
    { id:"kl3", emoji:"⛵", spot:"Prolaz Velebitski kanal — jutro", intel:"Krenite iz Raba prema Senju do 8h — jutarnji termal je miran. Poslijepodne bura jača do 6 Beauforta. Zimski prolazi isključivo s HAK potvrdom." },
    { id:"kl4", emoji:"⚔️", spot:"Rabska Fjera — 25-27. srpnja", intel:"Najveći srednjovjekovni festival Hrvatske od 1364. Povorka kreće 21:30 s Trga Sv. Kristofora. 700+ kostimiranih sudionika, turnir samostreličara, vatromet u ponoć. Rezervirajte smještaj 3 tjedna ranije!" },
    { id:"kl5", emoji:"🏛️", spot:"Rab — 4 zvonika u jednom kadru", intel:"Najljepši pogled na sva 4 zvonika: s Gornje ulice kod Sv. Andrije. Katedrala Sv. Marije (1175.) — posvećena od pape Aleksandra III. Ulaz na vrh zvonika 3€, 360° panorama." },
    { id:"kl6", emoji:"🍰", spot:"Rapska torta — Kuća rapske torte", intel:"Recept iz 1177. — bademi, maraschino, naranča. Originalna se prodaje samo u Kući rapske torte u starom gradu. Košta 8-12€ komad, ali vrijedi svake kune." },
  ],
  istria: [
    { id:"il1", emoji:"🍄", spot:"Tržnica Pula — tartufi", intel:"Tartufi na tržnici u Puli koštaju 3x manje nego u restoranima. Bijeli tartuf sezona: rujan-prosinac. Domaći prodavači prepoznatljivi po košaricama s drvenim poklopcima." },
    { id:"il2", emoji:"🍷", spot:"Vinarija Kozlović — Momjan", intel:"Najcjenjenija obiteljska vinarija Istre. Malvazija 2022 je dobila 94 boda. Degustacija 20€ s 6 vina. Rezervacija obavezna, ali uvijek nađu mjesto." },
  ],
  zadar: [
    { id:"zl1", emoji:"🎶", spot:"Morske orgulje — 5h ujutro", intel:"Najdramatičniji zvuk mora kada su plima i morska struja u suprotnom smjeru. Nema turista, samo zvuk i more." },
  ],
  dubrovnik: [
    { id:"dl1", emoji:"🏰", spot:"Zidine — ulaz Ploče", intel:"Ulaz Ploče ima kraći red nego ulaz Pile. Razlika: 30-45min čekanja. Idite ujutro u 8h odmah po otvaranju ili pred zatvaranje u 17h." },
    { id:"dl2", emoji:"🚌", spot:"Bus 5 do Srđa", intel:"Bus 5 do podnožja žičare — alternativa liftom za one koji izbjegavaju gužvu. Pogled na grad s vrha Srđa bez turista koji dolaze žičarom. 1.5€." },
  ],
};

// ─── ISTRA CAMPER INTEL ───────────────────────────────────────
export const ISTRA_CAMPER_INTEL = {
  roads: [
    { spot:"Učka tunel", note:"Max visina 4.8m, max širina 2.5m. Plaćanje gotovinom ili karticom. Besplatno za vozila do 3.5t." },
    { spot:"Učka alternativa — stara cesta", note:"Za kamper > 4.8m visine: zaobilaznica via Vranja 43km dulja ali bez ograničenja visine. Preporučeno jutrom." },
  ],
  campings: [
    { name:"Camping Brioni (Pula)", price:"od 30€/noć", hook:true,  wifi:true,  pool:true,  note:"5 zvjezdica, direktan pristup moru. Rezervacija 3 tjedna unaprijed." },
    { name:"Camping Valkanela (Vrsar)", price:"od 25€/noć",hook:true, wifi:true, pool:false, note:"Borova šuma, tihe parcele. Kamper max dužina 10m." },
    { name:"Camping Bi-Village (Fažana)", price:"od 35€/noć",hook:true,wifi:true,pool:true, note:"Najbliži Brijunima. Luksuzni eko resort." },
  ],
};

// ─── DUBROVNIK INTEL ─────────────────────────────────────────
export const DUBROVNIK_INTEL = [
  { spot:"Gradska luka — Karaka",      link:"https://www.karaka-dubrovnik.com", note:"Jedina karaka (galija) replika na Jadranu. Tura s vinom 2h, 40€." },
  { spot:"Lokrum — Benediktinski manastir", link:"https://www.lokrum.hr",      note:"Trajekt 15min iz luke, 50kn povratna. Peacoci slobodni na otoku. Nema noćenja." },
  { spot:"Žičara Srđ",                 link:"https://www.dubrovnikcablecar.com",note:"25€ povratna. Ujutro 8h nema gužve. Pogled na Elafitske otoke." },
  { spot:"Konoba Kopun — Gunduličeva",  link:null,                              note:"Lokalna taverna bez turističke karte. Dubrovački pasticada 95kn." },
];
