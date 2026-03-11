import { useState, useEffect, useRef } from "react";
import { loadGuest, updateGuest, getRoomCode } from "./guestStore";

/* ══════════════════════════════════════════════════════════
   JADRAN AI — Unified Platform v4
   3 Phases: Pre-Trip → Kiosk Stay → Post-Stay
   Monetization: Free/Premium tiers + Affiliate + Concierge
   ══════════════════════════════════════════════════════════ */


/* ─── i18n TRANSLATIONS ─── */
const LANGS = [
  { code: "hr", flag: "🇭🇷", name: "Hrvatski" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "at", flag: "🇦🇹", name: "Österreich" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "si", flag: "🇸🇮", name: "Slovenščina" },
  { code: "cz", flag: "🇨🇿", name: "Čeština" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
];

const T = {
  // ─── Navigation & UI ───
  preTrip:    { hr:"Prije dolaska", de:"Vor Anreise", at:"Vor Anreise", en:"Pre-Trip", it:"Pre-viaggio", si:"Pred prihodom", cz:"Před příjezdem", pl:"Przed przyjazdem" },
  kiosk:      { hr:"Kiosk · Boravak", de:"Kiosk · Aufenthalt", at:"Kiosk · Aufenthalt", en:"Kiosk · Stay", it:"Kiosk · Soggiorno", si:"Kiosk · Bivanje", cz:"Kiosk · Pobyt", pl:"Kiosk · Pobyt" },
  postStay:   { hr:"Nakon odlaska", de:"Nach Abreise", at:"Nach Abreise", en:"Post-Stay", it:"Post-soggiorno", si:"Po odhodu", cz:"Po odjezdu", pl:"Po wyjeździe" },
  back:       { hr:"← Natrag", de:"← Zurück", at:"← Zurück", en:"← Back", it:"← Indietro", si:"← Nazaj", cz:"← Zpět", pl:"← Wstecz" },
  quickAccess:{ hr:"BRZI PRISTUP", de:"SCHNELLZUGRIFF", at:"SCHNELLZUGRIFF", en:"QUICK ACCESS", it:"ACCESSO RAPIDO", si:"HITRI DOSTOP", cz:"RYCHLÝ PŘÍSTUP", pl:"SZYBKI DOSTĘP" },
  activities: { hr:"AKTIVNOSTI", de:"AKTIVITÄTEN", at:"AKTIVITÄTEN", en:"ACTIVITIES", it:"ATTIVITÀ", si:"AKTIVNOSTI", cz:"AKTIVITY", pl:"AKTYWNOŚCI" },
  book:       { hr:"REZERVIRAJ", de:"BUCHEN", at:"BUCHEN", en:"BOOK", it:"PRENOTA", si:"REZERVIRAJ", cz:"REZERVOVAT", pl:"ZAREZERWUJ" },
  bookNow:    { hr:"Rezerviraj →", de:"Jetzt buchen →", at:"Jetzt buchen →", en:"Book now →", it:"Prenota ora →", si:"Rezerviraj →", cz:"Rezervovat →", pl:"Zarezerwuj →" },
  bookSent:   { hr:"Rezervacija poslana!", de:"Buchung gesendet!", at:"Buchung gesendet!", en:"Booking sent!", it:"Prenotazione inviata!", si:"Rezervacija poslana!", cz:"Rezervace odeslána!", pl:"Rezerwacja wysłana!" },
  bookConfirm:{ hr:"Potvrda unutar 30 min na vaš email.", de:"Bestätigung innerhalb von 30 Min per E-Mail.", at:"Bestätigung innerhalb von 30 Min per E-Mail.", en:"Confirmation within 30 min to your email.", it:"Conferma entro 30 min alla tua email.", si:"Potrditev v 30 min na vaš email.", cz:"Potvrzení do 30 min na váš email.", pl:"Potwierdzenie w ciągu 30 min na Twój email." },
  perPerson:  { hr:"po osobi", de:"pro Person", at:"pro Person", en:"per person", it:"a persona", si:"na osebo", cz:"na osobu", pl:"od osoby" },
  spotsLeft:  { hr:"mjesta", de:"Plätze", at:"Plätze", en:"spots", it:"posti", si:"mest", cz:"míst", pl:"miejsc" },
  budget:     { hr:"BUDŽET", de:"BUDGET", at:"BUDGET", en:"BUDGET", it:"BUDGET", si:"PRORAČUN", cz:"ROZPOČET", pl:"BUDŻET" },
  left:       { hr:"preostalo", de:"übrig", at:"übrig", en:"left", it:"rimanente", si:"preostalo", cz:"zbývá", pl:"pozostało" },
  perDay:     { hr:"€/dan", de:"€/Tag", at:"€/Tag", en:"€/day", it:"€/giorno", si:"€/dan", cz:"€/den", pl:"€/dzień" },
  day:        { hr:"Dan", de:"Tag", at:"Tag", en:"Day", it:"Giorno", si:"Dan", cz:"Den", pl:"Dzień" },
  simulation: { hr:"SIMULACIJA", de:"SIMULATION", at:"SIMULATION", en:"SIMULATION", it:"SIMULAZIONE", si:"SIMULACIJA", cz:"SIMULACE", pl:"SYMULACJA" },
  aiRec:      { hr:"AI PREPORUKA", de:"AI-EMPFEHLUNG", at:"AI-EMPFEHLUNG", en:"AI RECOMMENDATION", it:"SUGGERIMENTO AI", si:"AI PRIPOROČILO", cz:"AI DOPORUČENÍ", pl:"REKOMENDACJA AI" },

  // ─── Practical sections ───
  parking:    { hr:"Parking", de:"Parkplatz", at:"Parkplatz", en:"Parking", it:"Parcheggio", si:"Parkiranje", cz:"Parkování", pl:"Parking" },
  beaches:    { hr:"Plaže", de:"Strände", at:"Strände", en:"Beaches", it:"Spiagge", si:"Plaže", cz:"Pláže", pl:"Plaże" },
  sun:        { hr:"Sunce & UV", de:"Sonne & UV", at:"Sonne & UV", en:"Sun & UV", it:"Sole & UV", si:"Sonce & UV", cz:"Slunce & UV", pl:"Słońce & UV" },
  routes:     { hr:"Prijevoz", de:"Transport", at:"Transport", en:"Transport", it:"Trasporti", si:"Prevoz", cz:"Doprava", pl:"Transport" },
  food:       { hr:"Hrana", de:"Essen", at:"Essen", en:"Food", it:"Cibo", si:"Hrana", cz:"Jídlo", pl:"Jedzenie" },
  emergency:  { hr:"Hitno", de:"Notfall", at:"Notfall", en:"Emergency", it:"Emergenza", si:"Nujno", cz:"Nouzové", pl:"Nagłe" },
  gems:       { hr:"Hidden Gems", de:"Hidden Gems", at:"Hidden Gems", en:"Hidden Gems", it:"Gemme Nascoste", si:"Skriti dragulji", cz:"Skryté perly", pl:"Ukryte perły" },
  aiGuide:    { hr:"AI Vodič", de:"AI-Guide", at:"AI-Guide", en:"AI Guide", it:"Guida AI", si:"AI Vodič", cz:"AI Průvodce", pl:"AI Przewodnik" },
  navigate:   { hr:"Navigiraj", de:"Navigieren", at:"Navigieren", en:"Navigate", it:"Naviga", si:"Navigiraj", cz:"Navigovat", pl:"Nawiguj" },
  openMap:    { hr:"Otvori kartu", de:"Karte öffnen", at:"Karte öffnen", en:"Open map", it:"Apri mappa", si:"Odpri zemljevid", cz:"Otevřít mapu", pl:"Otwórz mapę" },

  // ─── Onboarding ───
  welcome:    { hr:"Dobrodošli u JADRAN AI", de:"Willkommen bei JADRAN AI", at:"Willkommen bei JADRAN AI", en:"Welcome to JADRAN AI", it:"Benvenuti su JADRAN AI", si:"Dobrodošli v JADRAN AI", cz:"Vítejte v JADRAN AI", pl:"Witamy w JADRAN AI" },
  hostUses:   { hr:"Vaš domaćin koristi JADRAN AI.", de:"Ihr Gastgeber nutzt JADRAN AI.", at:"Ihr Gastgeber nutzt JADRAN AI.", en:"Your host uses JADRAN AI.", it:"Il tuo host usa JADRAN AI.", si:"Vaš gostitelj uporablja JADRAN AI.", cz:"Váš hostitel používá JADRAN AI.", pl:"Twój gospodarz korzysta z JADRAN AI." },
  createProfile:{ hr:"Kreiraj profil →", de:"Profil erstellen →", at:"Profil erstellen →", en:"Create profile →", it:"Crea profilo →", si:"Ustvari profil →", cz:"Vytvořit profil →", pl:"Utwórz profil →" },
  interests:  { hr:"Što vas zanima?", de:"Was interessiert Sie?", at:"Was interessiert Sie?", en:"What interests you?", it:"Cosa ti interessa?", si:"Kaj vas zanima?", cz:"Co vás zajímá?", pl:"Co Cię interesuje?" },
  chooseMin:  { hr:"Odaberite najmanje 2", de:"Wählen Sie mindestens 2", at:"Wählen Sie mindestens 2", en:"Choose at least 2", it:"Scegli almeno 2", si:"Izberite vsaj 2", cz:"Vyberte alespoň 2", pl:"Wybierz co najmniej 2" },
  next:       { hr:"Dalje →", de:"Weiter →", at:"Weiter →", en:"Next →", it:"Avanti →", si:"Naprej →", cz:"Další →", pl:"Dalej →" },
  profileDone:{ hr:"Profil kreiran!", de:"Profil erstellt!", at:"Profil erstellt!", en:"Profile created!", it:"Profilo creato!", si:"Profil ustvarjen!", cz:"Profil vytvořen!", pl:"Profil utworzony!" },
  preparing:  { hr:"JADRAN AI priprema vaš personalizirani plan.", de:"JADRAN AI bereitet Ihren personalisierten Plan vor.", at:"JADRAN AI bereitet Ihren personalisierten Plan vor.", en:"JADRAN AI is preparing your personalized plan.", it:"JADRAN AI sta preparando il tuo piano personalizzato.", si:"JADRAN AI pripravlja vaš osebni načrt.", cz:"JADRAN AI připravuje váš personalizovaný plán.", pl:"JADRAN AI przygotowuje Twój spersonalizowany plan." },
  toPreTrip:  { hr:"Na Pre-Trip →", de:"Zum Pre-Trip →", at:"Zum Pre-Trip →", en:"To Pre-Trip →", it:"Al Pre-viaggio →", si:"Na Pre-Trip →", cz:"Na Pre-Trip →", pl:"Do Pre-Trip →" },

  // ─── Premium ───
  premiumTitle:{ hr:"JADRAN AI Premium", de:"JADRAN AI Premium", at:"JADRAN AI Premium", en:"JADRAN AI Premium", it:"JADRAN AI Premium", si:"JADRAN AI Premium", cz:"JADRAN AI Premium", pl:"JADRAN AI Premium" },
  premiumDesc: { hr:"Otključajte AI vodič, skrivena mjesta i personalizirane preporuke.", de:"Schalten Sie AI-Guide, versteckte Orte und personalisierte Empfehlungen frei.", at:"Schalten Sie AI-Guide, versteckte Orte und personalisierte Empfehlungen frei.", en:"Unlock AI guide, hidden places, and personalized recommendations.", it:"Sblocca guida AI, luoghi nascosti e consigli personalizzati.", si:"Odklenite AI vodič, skrita mesta in prilagojene priporočila.", cz:"Odemkněte AI průvodce, skrytá místa a personalizovaná doporučení.", pl:"Odblokuj przewodnik AI, ukryte miejsca i spersonalizowane rekomendacje." },
  unlockPremium:{ hr:"Otključaj Premium — 5.99€ →", de:"Premium freischalten — 5.99€ →", at:"Premium freischalten — 5.99€ →", en:"Unlock Premium — 5.99€ →", it:"Sblocca Premium — 5.99€ →", si:"Odklenite Premium — 5.99€ →", cz:"Odemknout Premium — 5.99€ →", pl:"Odblokuj Premium — 5.99€ →" },
  entireStay: { hr:"za cijeli boravak · jednokratno", de:"für den gesamten Aufenthalt · einmalig", at:"für den gesamten Aufenthalt · einmalig", en:"for entire stay · one-time", it:"per tutto il soggiorno · una tantum", si:"za celotno bivanje · enkratno", cz:"na celý pobyt · jednorázově", pl:"na cały pobyt · jednorazowo" },

  // ─── Chat ───
  askAnything:{ hr:"Pitajte bilo što o Jadranu", de:"Fragen Sie alles über die Adria", at:"Fragen Sie alles über die Adria", en:"Ask anything about the Adriatic", it:"Chiedi qualsiasi cosa sull'Adriatico", si:"Vprašajte karkoli o Jadranu", cz:"Zeptejte se na cokoliv o Jadranu", pl:"Zapytaj o cokolwiek nad Adriatykiem" },
  askPlaceholder:{ hr:"Pitajte nešto...", de:"Fragen Sie etwas...", at:"Fragen Sie etwas...", en:"Ask something...", it:"Chiedi qualcosa...", si:"Vprašajte...", cz:"Zeptejte se...", pl:"Zapytaj..." },

  // ─── Post-stay ───
  thanks:     { hr:"Hvala", de:"Danke", at:"Danke", en:"Thank you", it:"Grazie", si:"Hvala", cz:"Děkujeme", pl:"Dziękujemy" },
  inviteFriends:{ hr:"Pozovite prijatelje — 15% popust", de:"Freunde einladen — 15% Rabatt", at:"Freunde einladen — 15% Rabatt", en:"Invite friends — 15% off", it:"Invita amici — 15% di sconto", si:"Povabite prijatelje — 15% popust", cz:"Pozvěte přátele — 15% sleva", pl:"Zaproś przyjaciół — 15% zniżki" },
  shareCode:  { hr:"Podijeli kod →", de:"Code teilen →", at:"Code teilen →", en:"Share code →", it:"Condividi codice →", si:"Deli kodo →", cz:"Sdílet kód →", pl:"Udostępnij kod →" },
  nextYear:   { hr:"Sljedeće godine? 🏖️", de:"Nächstes Jahr? 🏖️", at:"Nächstes Jahr? 🏖️", en:"Next year? 🏖️", it:"L'anno prossimo? 🏖️", si:"Prihodnje leto? 🏖️", cz:"Příští rok? 🏖️", pl:"Następny rok? 🏖️" },
  planSummer: { hr:"Planiraj ljeto 2027 →", de:"Sommer 2027 planen →", at:"Sommer 2027 planen →", en:"Plan summer 2027 →", it:"Pianifica estate 2027 →", si:"Načrtuj poletje 2027 →", cz:"Plánovat léto 2027 →", pl:"Planuj lato 2027 →" },

  // ─── Greetings by time ───
  morning:    { hr:"Dobro jutro", de:"Guten Morgen", at:"Guten Morgen", en:"Good morning", it:"Buongiorno", si:"Dobro jutro", cz:"Dobré ráno", pl:"Dzień dobry" },
  midday:     { hr:"Dobar dan", de:"Guten Tag", at:"Grüß Gott", en:"Good afternoon", it:"Buon pomeriggio", si:"Dober dan", cz:"Dobré odpoledne", pl:"Dzień dobry" },
  evening:    { hr:"Dobra večer", de:"Guten Abend", at:"Guten Abend", en:"Good evening", it:"Buonasera", si:"Dober večer", cz:"Dobrý večer", pl:"Dobry wieczór" },
  night:      { hr:"Laku noć", de:"Gute Nacht", at:"Gute Nacht", en:"Good night", it:"Buonanotte", si:"Lahko noč", cz:"Dobrou noc", pl:"Dobranoc" },
};

// Helper: get translation for current language, fallback to HR then EN
const t = (key, lang) => {
  const entry = T[key];
  if (!entry) return key;
  // Austrian uses DE translations as base
  const l = lang === "at" ? "at" : lang;
  return entry[l] || entry.hr || entry.en || key;
};

/* ─── GOOGLE MAPS COORDINATES ─── */
const MAP_COORDS = {
  // Parking
  "villa_parking": { lat: 43.4892, lng: 16.5523, label: "Villa Marija Parking" },
  "podstrana_centar": { lat: 43.4876, lng: 16.5498, label: "Podstrana Centar Parking" },
  "garaza_lora": { lat: 43.5074, lng: 16.4316, label: "Garaža Lora Split" },
  // Beaches
  "plaza_podstrana": { lat: 43.4898, lng: 16.5536, label: "Plaža Podstrana" },
  "kasjuni": { lat: 43.5075, lng: 16.4078, label: "Kašjuni Beach" },
  "bacvice": { lat: 43.5020, lng: 16.4500, label: "Bačvice Beach" },
  "zlatni_rat": { lat: 43.2561, lng: 16.6342, label: "Zlatni Rat, Bol" },
  // Food
  "konzum": { lat: 43.4880, lng: 16.5489, label: "Konzum Podstrana" },
  "pekara_bobis": { lat: 43.4885, lng: 16.5501, label: "Pekara Bobis" },
  // Routes
  "split_centar": { lat: 43.5081, lng: 16.4402, label: "Split Centar" },
  "trogir": { lat: 43.5170, lng: 16.2518, label: "Trogir" },
  "omis": { lat: 43.4448, lng: 16.6881, label: "Omiš" },
  "ferry_split": { lat: 43.5039, lng: 16.4419, label: "Ferry Terminal Split" },
  // Emergency
  "ljekarna": { lat: 43.4878, lng: 16.5495, label: "Ljekarna Podstrana" },
  // Hidden Gems
  "uvala_vruja": { lat: 43.3712, lng: 16.7893, label: "Uvala Vruja" },
  "marjan_spilje": { lat: 43.5089, lng: 16.4168, label: "Marjan Špilje" },
  "konoba_stari_mlin": { lat: 43.4901, lng: 16.5634, label: "Konoba Stari Mlin" },
  "klis": { lat: 43.5583, lng: 16.5242, label: "Klis Fortress" },
  "cetina_bazen": { lat: 43.4456, lng: 16.7012, label: "Cetina Secret Pool" },
  "vidova_gora": { lat: 43.3151, lng: 16.6212, label: "Vidova Gora" },
};

const openGoogleMaps = (coordKey) => {
  const c = MAP_COORDS[coordKey];
  if (c) window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`, '_blank');
};

const getMapEmbed = (coordKey) => {
  const c = MAP_COORDS[coordKey];
  if (!c) return null;
  return `https://www.google.com/maps?q=${c.lat},${c.lng}&z=15&output=embed`;
};


/* ─── DATA ─── */
const GUEST = {
  name: "Familie Weber", first: "Weber", country: "DE", lang: "de", flag: "🇩🇪",
  adults: 2, kids: 2, kidsAges: [7, 11], interests: ["gastro", "adventure", "culture"],
  arrival: "2026-07-12", departure: "2026-07-19", car: true, carPlate: "M-WB 4521",
  accommodation: "Villa Marija, Podstrana", host: "Marija Perić", hostPhone: "+385 91 555 1234",
  budget: 1200, spent: 345, email: "weber@email.de"
};

const W = { icon: "☀️", temp: 31, sea: 25, uv: 8, wind: "Z 8 km/h", sunset: "20:47", humidity: 45 };

const FORECAST = [
  { d: "Pon", icon: "☀️", h: 31, l: 22 }, { d: "Uto", icon: "⛅", h: 28, l: 21 },
  { d: "Sri", icon: "🌧️", h: 23, l: 19 }, { d: "Čet", icon: "☀️", h: 30, l: 22 },
  { d: "Pet", icon: "☀️", h: 32, l: 23 }, { d: "Sub", icon: "⛅", h: 29, l: 21 },
  { d: "Ned", icon: "☀️", h: 31, l: 22 },
];

const PRACTICAL = {
  parking: { icon: "🅿️", title: "Parking", items: [
    { n: "Parking ispred vile", d: "0m", note: "Vaše mjesto: #7", free: true, mapKey: "villa_parking" },
    { n: "Podstrana centar", d: "400m", note: "8 kn/h · SMS plaćanje", price: "8kn/h", mapKey: "podstrana_centar" },
    { n: "Garaža Lora (Split)", d: "8km", note: "Natkrivena garaža, 24/7", price: "10€/dan", mapKey: "garaza_lora" },
  ]},
  beach: { icon: "🏖️", title: "Plaže", items: [
    { n: "Plaža Podstrana", d: "200m", note: "3 min pješice · Ležaljke 15€/dan", type: "🪨", mapKey: "plaza_podstrana" },
    { n: "Kašjuni", d: "6km", note: "12 min autom · Parking 5€ · Najljepša!", type: "🪨", mapKey: "kasjuni" },
    { n: "Bačvice", d: "9km", note: "PIJESAK! Savršena za djecu · 15 min autom", type: "🏖️", mapKey: "bacvice" },
    { n: "Zlatni Rat (Brač)", d: "Ferry", note: "Ikonska · Ferry 7:30, 9:30, 12:00", type: "🏖️", affiliate: true, link: "jadrolinija.hr", mapKey: "zlatni_rat" },
  ]},
  sun: { icon: "☀️", title: "Sunce & UV", items: [
    { n: `UV Index: ${W.uv} (VISOK)`, note: "SPF 50+ obavezno između 11-16h!", warn: true },
    { n: "Hidracija", note: "Min. 3L vode pri 31°C · Djeca češće!" },
    { n: "Ljekarna Podstrana", d: "300m", note: "Do 20h · SPF, After Sun, Panthenol" },
  ]},
  routes: { icon: "🗺️", title: "Prijevoz", items: [
    { n: "Split centar", d: "10km", note: "Auto 15min / Bus #60 svaki 20min (2€)", mapKey: "split_centar" },
    { n: "Trogir", d: "30km", note: "Auto 25min · UNESCO · Prekrasan pogled!", mapKey: "trogir" },
    { n: "Omiš + Cetina", d: "15km", note: "Auto 18min · Rafting dostupan!", affiliate: true, mapKey: "omis" },
    { n: "Ferry Brač/Hvar", note: "jadrolinija.hr · Online booking 20% jeftinije", affiliate: true, mapKey: "ferry_split" },
  ]},
  food: { icon: "🍽️", title: "Hrana", items: [
    { n: "Konzum", d: "400m", note: "7-21h · Svježi kruh do 8h", mapKey: "konzum" },
    { n: "Pekara Bobis", d: "250m", note: "Od 6h! Burek, kroasani", mapKey: "pekara_bobis" },
    { n: "Wolt / Glovo", note: "Dostava iz Splita do Podstrane" },
  ]},
  emergency: { icon: "🏥", title: "Hitno", items: [
    { n: "Hitna pomoć: 112 / 194", warn: true },
    { n: "Ljekarna", d: "300m", note: "Do 20h", mapKey: "ljekarna" },
    { n: "WiFi", note: "VillaMarija-5G · Lozinka: jadran2026" },
    { n: "Domaćin", note: `${GUEST.host}: ${GUEST.hostPhone} (WhatsApp)` },
  ]},
};

const GEMS = [
  { name: "Uvala Vruja", emoji: "🏝️", mapKey: "uvala_vruja", type: "Tajna plaža", desc: "Između Omiša i Makarske, dostupna samo pješice. Kristalno more, potpuno divlja.", tip: "Ponesite vode i cipele za hodanje! Nema sjene.", best: "Ujutro", diff: "Srednje", premium: false },
  { name: "Marjan špilje", emoji: "🕳️", mapKey: "marjan_spilje", type: "Šetnja", desc: "Starokršćanske špilje iz 5. st. na stazi od Kašjuna do vrha Marjana.", tip: "Krenite u 17h, stignete na vrh za zalazak sunca.", best: "Popodne", diff: "Lagano", premium: false },
  { name: "Konoba Stari Mlin", emoji: "🍷", mapKey: "konoba_stari_mlin", type: "Lokalna tajna", desc: "Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. Pršut, sir, vino iz podruma.", tip: "Nazovite dan ranije. ~80€ za 4 osobe sa vinom.", best: "Večer", diff: "Auto", premium: true },
  { name: "Klis u zoru", emoji: "🏰", mapKey: "klis", type: "Iskustvo", desc: "Game of Thrones tvrđava u zoru. Nema turista. Pogled na Split i otoke.", tip: "Parking besplatan prije 8h. Dođite u 5:15.", best: "Izlazak sunca", diff: "Lagano", premium: true },
  { name: "Cetina tajni bazen", emoji: "🌊", mapKey: "cetina_bazen", type: "Kupanje", desc: "3km uzvodno od Omiša, makadamski put do skrivenog prirodnog bazena.", tip: "Skrenite desno kod mosta u Omišu. Makadamski put 1km.", best: "Popodne", diff: "Lagano", premium: true },
  { name: "Vidova Gora zalazak", emoji: "🌄", mapKey: "vidova_gora", type: "Pogled", desc: "Najviši vrh jadranskih otoka (778m). Auto do vrha. Pogled na Hvar, Vis, Italiju.", tip: "Ferry 12h, auto 30min do vrha, zalazak, večera u Bolu.", best: "Zalazak", diff: "Ferry+Auto", premium: true },
];

const EXPERIENCES = [
  { id: 1, name: "Kajak Pakleni otoci", emoji: "🛶", price: 55, ourPrice: 65, dur: "4h", rating: 4.9, spots: 3, cat: "adventure" },
  { id: 2, name: "Dalmatinska kuhinja", emoji: "👨‍🍳", price: 50, ourPrice: 65, dur: "4h", rating: 4.8, spots: 6, cat: "gastro" },
  { id: 3, name: "Dioklecijanova palača", emoji: "🏛️", price: 25, ourPrice: 35, dur: "2h", rating: 4.7, spots: 8, cat: "culture" },
  { id: 4, name: "Rafting Cetina", emoji: "🚣", price: 45, ourPrice: 55, dur: "3h", rating: 4.9, spots: 4, cat: "adventure" },
  { id: 5, name: "Sunset Sailing", emoji: "⛵", price: 95, ourPrice: 120, dur: "4h", rating: 5.0, spots: 2, cat: "premium" },
  { id: 6, name: "Wine Tasting Kaštela", emoji: "🍷", price: 35, ourPrice: 45, dur: "3h", rating: 4.8, spots: 4, cat: "gastro" },
];

const BUNDLES = [
  { name: "Romantični bijeg", emoji: "💑", includes: ["Sunset Sailing", "Spa za dvoje", "Večera"], price: 280, orig: 345 },
  { name: "Obiteljska avantura", emoji: "👨‍👩‍👧‍👦", includes: ["Rafting Cetina", "Kajak tura", "Zlatni Rat izlet"], price: 160, orig: 195 },
  { name: "Gastro otkriće", emoji: "🍽️", includes: ["Wine Tasting", "Cooking Class", "Konoba večera"], price: 125, orig: 145 },
];

const LOYALTY = { points: 345, tier: "Morski val", next: "Dalmatinac", nextPts: 500, code: "WEBER2026" };

const INTERESTS = [
  { k: "gastro", e: "🍷", l: "Gastronomija" }, { k: "adventure", e: "🏔️", l: "Avantura" },
  { k: "culture", e: "🏛️", l: "Kultura" }, { k: "beach", e: "🏖️", l: "Plaže" },
  { k: "wellness", e: "🧖", l: "Wellness" }, { k: "kids", e: "👨‍👩‍👧‍👦", l: "Obitelj" },
  { k: "nightlife", e: "🍸", l: "Noćni život" }, { k: "nature", e: "🌿", l: "Priroda" },
];

/* ─── COMPONENT ─── */
export default function JadranUnified() {
  const [lang, setLang] = useState("hr");
  const [splash, setSplash] = useState(true);
  const [phase, setPhase] = useState("pre"); // pre | kiosk | post
  const [subScreen, setSubScreen] = useState("onboard"); // varies per phase
  const [premium, setPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [interests, setInterests] = useState(new Set(["gastro", "adventure"]));
  const [transitProg, setTransitProg] = useState(35);
  const [kioskDay, setKioskDay] = useState(3);
  const [simHour, setSimHour] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [selectedExp, setSelectedExp] = useState(null);
  const [booked, setBooked] = useState(new Set());
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const chatEnd = useRef(null);
  const roomCode = useRef(getRoomCode());

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 3800); return () => clearTimeout(t); }, []);

  // ─── PERSISTENCE: Load guest state from Firestore/localStorage ───
  const persistReady = useRef(false);
  useEffect(() => {
    loadGuest(roomCode.current).then(data => {
      if (data) {
        if (data.premium) setPremium(true);
        if (data.lang) setLang(data.lang);
        if (data.phase) { setPhase(data.phase); setSubScreen(data.subScreen || "home"); }
        if (data.booked) setBooked(new Set(data.booked));
      }
      // Mark ready AFTER initial state is applied
      setTimeout(() => { persistReady.current = true; }, 500);
    }).catch(() => { persistReady.current = true; });
  }, []);

  // ─── PERSISTENCE: Auto-save on key state changes ───
  useEffect(() => {
    if (!persistReady.current) return;
    updateGuest(roomCode.current, { lang, phase, subScreen, premium, booked: [...booked] });
  }, [lang, phase, subScreen, premium, booked]);

  // ─── ADMIN: Secret unlock for testing (?unlock=sial) ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlock') === 'sial') {
      setPremium(true);
      setSplash(false);
      setPhase('kiosk');
      setSubScreen('home');
      updateGuest(roomCode.current, { premium: true, premiumSource: 'admin_unlock' });
      const roomParam = params.get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }
  }, []);

  // ─── STRIPE: Detect payment redirect ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const bookingStatus = params.get('booking');
    const activityName = params.get('activity');

    if (paymentStatus === 'success' && sessionId) {
      // Verify payment server-side
      fetch('/api/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then(r => r.json()).then(data => {
        if (data.paid) {
          setPremium(true);
          setSplash(false);
          setPhase('kiosk');
          setSubScreen('home');
          updateGuest(roomCode.current, { premium: true, premiumSessionId: sessionId, phase: 'kiosk' });
        }
      }).catch(() => {
        // If verify fails, still unlock for UX (webhook will catch it)
        setPremium(true);
        updateGuest(roomCode.current, { premium: true, premiumSessionId: sessionId });
      });
      // Clean URL (keep ?room= if present)
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (bookingStatus === 'success' && activityName) {
      setSplash(false);
      setPhase('kiosk');
      setSubScreen('home');
      setShowConfirm(decodeURIComponent(activityName));
      setBooked(prev => {
        const next = new Set([...prev, activityName]);
        updateGuest(roomCode.current, { booked: [...next] });
        return next;
      });
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }
  }, []);

  // ─── STRIPE: Start Premium Checkout ───
  const startPremiumCheckout = async () => {
    setPayLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: roomCode.current, guestName: GUEST.name, lang }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        // Fallback: unlock in demo mode
        setPremium(true);
        setShowPaywall(false);
        updateGuest(roomCode.current, { premium: true, premiumSource: "demo_fallback" });
      }
    } catch {
      // Stripe not configured — demo mode unlock
      setPremium(true);
      setShowPaywall(false);
      updateGuest(roomCode.current, { premium: true, premiumSource: "demo_fallback" });
    }
    setPayLoading(false);
  };

  // ─── STRIPE: Start Activity Booking Checkout ───
  const startBookingCheckout = async (exp) => {
    setPayLoading(true);
    try {
      const totalPersons = GUEST.adults + (GUEST.kids || 0);
      const res = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: exp.name, price: exp.ourPrice,
          quantity: totalPersons, roomCode: roomCode.current,
          guestName: GUEST.name, lang,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Fallback demo mode
        setBooked(p => new Set([...p, exp.id]));
        setShowConfirm(exp.name);
        setSelectedExp(null);
      }
    } catch {
      // Stripe not configured — demo mode
      setBooked(p => new Set([...p, exp.id]));
      setShowConfirm(exp.name);
      setSelectedExp(null);
    }
    setPayLoading(false);
  };

  const hour = simHour ?? new Date().getHours();
  const timeCtx = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
  const daysLeft = 7 - kioskDay + 1;
  const budgetLeft = GUEST.budget - GUEST.spent;

  const tryPremium = (cb) => { if (premium) { cb(); } else { setShowPaywall(true); } };

  const doChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const sys = `Ti si JADRAN AI, 24/7 turistički concierge u Podstrani (blizu Splita), Hrvatska.
GOST: ${GUEST.name}, ${GUEST.country}, ${GUEST.adults} odraslih + ${GUEST.kids} djece (${GUEST.kidsAges.join(',')} god). Interesi: ${GUEST.interests.join(', ')}. ${GUEST.car ? 'Ima auto.' : 'Nema auto.'}
SMJEŠTAJ: ${GUEST.accommodation}. Domaćin: ${GUEST.host} (${GUEST.hostPhone}).
VRIJEME: ${W.temp}°C ${W.icon}, UV ${W.uv}, more ${W.sea}°C, zalazak ${W.sunset}. Dan: ${kioskDay}/7.
HIDDEN GEMS: ${GEMS.map(g => g.name).join(', ')}.
Odgovaraš na ${lang==="de"||lang==="at"?"Deutsch":lang==="en"?"English":lang==="it"?"Italiano":lang==="si"?"Slovenščina":lang==="cz"?"Čeština":lang==="pl"?"Polski":"Hrvatski"}. Kratko (3-5 rečenica), toplo, konkretno s cijenama i udaljenostima. Emoji.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys,
          messages: [...chatMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }] }),
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: "assistant", text: data.content?.map(c => c.text || "").join("") || "..." }]);
    } catch { setChatMsgs(p => [...p, { role: "assistant", text: "Verbindung nicht verfügbar. 🌊" }]); }
    setChatLoading(false);
  };

  /* ─── COLORS ─── */
  const C = {
    bg: "#060910", card: "#0C1018", accent: "#00B4D8", acDim: "rgba(0,180,216,0.1)",
    gold: "#C9A84C", goDim: "rgba(201,168,76,0.08)", text: "#E8E0D4", mut: "#6B6560",
    bord: "rgba(232,224,212,0.05)", red: "#EF4444", green: "#22C55E", grDim: "rgba(34,197,94,0.08)",
  };
  const dm = { fontFamily: "'Outfit',sans-serif" };
  const fonts = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />;

  /* ─── SHARED COMPONENTS ─── */
  const Badge = ({ c = "accent", children }) => (
    <span style={{ ...dm, display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, letterSpacing: 1,
      background: c === "accent" ? C.acDim : c === "gold" ? C.goDim : c === "green" ? C.grDim : "rgba(239,68,68,0.08)",
      color: c === "accent" ? C.accent : c === "gold" ? C.gold : c === "green" ? C.green : C.red }}>{children}</span>
  );
  const Btn = ({ primary, small, children, ...p }) => (
    <button {...p} style={{ padding: small ? "8px 16px" : "14px 24px", background: primary ? `linear-gradient(135deg,${C.accent},#0077B6)` : "rgba(232,224,212,0.03)",
      border: primary ? "none" : `1px solid ${C.bord}`, borderRadius: 14, color: primary ? "#fff" : C.text,
      fontSize: small ? 13 : 16, fontFamily: "'Cormorant Garamond',Georgia,serif", cursor: "pointer", fontWeight: primary ? 600 : 400, transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", letterSpacing: primary ? 0.5 : 0, boxShadow: primary ? "0 4px 16px rgba(0,180,216,0.25)" : "none", ...(p.style || {}) }} className={primary ? "btn-glow" : ""}>{children}</button>
  );
  const Card = ({ children, glow, style: sx, ...p }) => (
    <div {...p} className="glass" style={{ background: glow ? "rgba(12,16,24,0.85)" : "rgba(12,16,24,0.75)", borderRadius: 18, border: `1px solid ${glow ? "rgba(0,180,216,0.12)" : C.bord}`, padding: 20, transition: "all 0.3s", boxShadow: glow ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(232,224,212,0.03)" : "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(232,224,212,0.02)", ...sx }}>{children}</div>
  );
  const SectionLabel = ({ children, extra }) => (
    <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>{children} {extra && <span style={{ color: C.accent }}>{extra}</span>}</div>
  );
  const BackBtn = ({ onClick }) => <button onClick={onClick} style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", padding: "12px 0" }}>{t("back",lang)}</button>;

  /* ─── PHASE NAVIGATION ─── */
  const PhaseNav = () => {
    const phases = [{ k: "pre", l: t("preTrip",lang), i: "✈️" }, { k: "kiosk", l: t("kiosk",lang), i: "🏠" }, { k: "post", l: t("postStay",lang), i: "💫" }];
    const idx = phases.findIndex(p => p.k === phase);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "16px 0", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "8%", right: "8%", height: 2, background: C.bord, zIndex: 0 }} />
        <div style={{ position: "absolute", top: "50%", left: "8%", width: `${(idx / (phases.length - 1)) * 84}%`, height: 2, background: `linear-gradient(90deg,${C.accent},${C.gold})`, zIndex: 1, transition: "width 0.5s" }} />
        {phases.map((p, i) => (
          <div key={p.k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2, cursor: "pointer" }}
            onClick={() => { setPhase(p.k); if (p.k === "pre") setSubScreen("onboard"); else if (p.k === "kiosk") setSubScreen("home"); else setSubScreen("summary"); }}>
            <div style={{ width: i === idx ? 48 : 38, height: i === idx ? 48 : 38, borderRadius: "50%", background: i === idx ? `linear-gradient(135deg,${C.accent},#0077B6)` : i < idx ? C.acDim : C.card, border: i === idx ? "none" : `2px solid ${i < idx ? C.accent : C.bord}`, display: "grid", placeItems: "center", fontSize: i === idx ? 22 : 17, transition: "all 0.3s", boxShadow: i === idx ? `0 0 24px rgba(0,180,216,0.25)` : "none" }} className={i === idx ? "phase-active" : ""}>{i < idx ? "✓" : p.i}</div>
            <div style={{ ...dm, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: i === idx ? C.accent : C.mut, fontWeight: i === idx ? 700 : 400 }}>{p.l}</div>
          </div>
        ))}
      </div>
    );
  };

  /* ─── PAYWALL ─── */
  const Paywall = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,16,24,0.92)", borderRadius: 28, maxWidth: 440, width: "100%", padding: "40px 32px", border: `1px solid rgba(201,168,76,0.15)`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("premiumTitle",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {t("premiumDesc",lang)}
        </div>
        <div style={{ background: C.goDim, borderRadius: 16, padding: "20px", border: `1px solid rgba(201,168,76,0.12)`, marginBottom: 20 }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: C.gold }}>5.99€</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("entireStay",lang)}</div>
        </div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.8, marginBottom: 20, textAlign: "left" }}>
          ✓ AI Vodič — pitajte bilo što 24/7<br />
          ✓ 6 Hidden Gems sa locals tipovima<br />
          ✓ Personalizirane preporuke po vremenu i interesima<br />
          ✓ Concierge booking aktivnosti<br />
          ✓ Loyalty bodovi i popusti za sljedeći put
        </div>
        <Btn primary style={{ width: "100%", marginBottom: 10 }} onClick={startPremiumCheckout}>
          {payLoading ? "⏳..." : t("unlockPremium",lang)}
        </Btn>
        <div style={{ ...dm, fontSize: 11, color: C.mut }}>Plaćanje putem Stripe · SIAL Consulting d.o.o.</div>
      </div>
    </div>
  );

  /* ─── BOOKING CONFIRM ─── */
  const BookConfirm = () => showConfirm && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 250, display: "grid", placeItems: "center" }} onClick={() => setShowConfirm(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 400, border: `1px solid rgba(0,180,216,0.15)` }}>
        <div className="check-anim" style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0077B6)`, display: "grid", placeItems: "center", fontSize: 40, margin: "0 auto 20px", color: "#fff", boxShadow: "0 8px 32px rgba(0,180,216,0.35)" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("bookSent",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          {t("bookConfirm",lang)}
        </div>
        <div style={{ fontSize: 18, color: C.accent, marginBottom: 4 }}>{showConfirm}</div>
        <Btn primary style={{ marginTop: 16 }} onClick={() => setShowConfirm(null)}>OK</Btn>
      </div>
    </div>
  );

  /* ══════════════════════════════
     PHASE 1: PRE-TRIP
     ══════════════════════════════ */
  const PreTrip = () => {
    if (subScreen === "onboard") return (
      <div style={{ maxWidth: 540, margin: "32px auto", textAlign: "center" }}>
        {onboardStep === 0 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }} className="emoji-float">🌊</div>
            <div style={{ fontSize: 32, fontWeight: 400, marginBottom: 6, background: `linear-gradient(135deg,${C.text},${C.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("welcome",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              Ihr Gastgeber <strong style={{ color: C.gold }}>{GUEST.host}</strong> nutzt JADRAN AI.<br />60 Sekunden → personalisierter Urlaub.
            </div>
            <Btn primary onClick={() => setOnboardStep(1)}>{t("createProfile",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 1 && (
          <Card style={{ padding: 32 }}>
            <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>SCHRITT 1/2 — INTERESSEN</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>{t("interests",lang)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {INTERESTS.map(opt => (
                <div key={opt.k} onClick={() => setInterests(p => { const n = new Set(p); n.has(opt.k) ? n.delete(opt.k) : n.add(opt.k); return n; })}
                  style={{ padding: "16px 8px", background: interests.has(opt.k) ? C.acDim : C.card, border: `1px solid ${interests.has(opt.k) ? "rgba(0,180,216,0.25)" : C.bord}`, borderRadius: 14, cursor: "pointer", textAlign: "center", ...dm, fontSize: 13, color: interests.has(opt.k) ? C.accent : C.mut, transition: "all 0.3s" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{opt.e}</span>{opt.l}
                </div>
              ))}
            </div>
            <Btn primary onClick={() => setOnboardStep(2)}>{t("next",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 2 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("profileDone",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {t("preparing",lang)}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {[...interests].map(k => { const o = INTERESTS.find(x => x.k === k); return o ? <Badge key={k} c="accent">{o.e} {o.l}</Badge> : null; })}
            </div>
            <Btn primary onClick={() => setSubScreen("pretrip")}>{t("toPreTrip",lang)}</Btn>
          </Card>
        )}
      </div>
    );

    if (subScreen === "pretrip") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 30, fontWeight: 400 }}>7 Tage bis zum Urlaub ☀️</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>12.–19. Juli 2026 · {GUEST.accommodation}</div>
        </div>
        <SectionLabel>WETTERVORHERSAGE</SectionLabel>
        <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
          {FORECAST.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: 12 }}>
              <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1 }}>{d.d}</div>
              <div style={{ fontSize: 22, margin: "4px 0" }}>{d.icon}</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>{d.h}°</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel extra="AI">OPTIMIRANI PLAN</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>Mittwoch regnerisch</strong> — Palast-Tour + Museum. <strong style={{ color: C.green }}>Donnerstag sonnig</strong> — Strandtag + Kayak.
              AI je optimizirao raspored prema vremenu.
            </div>
          </Card>
          <Card>
            <SectionLabel>PAKETI</SectionLabel>
            {BUNDLES.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < BUNDLES.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                <div><span style={{ marginRight: 8 }}>{b.emoji}</span><span style={{ ...dm, fontSize: 14 }}>{b.name}</span></div>
                <div><span style={{ color: C.accent, fontSize: 18, fontWeight: 300 }}>{b.price}€</span><span style={{ ...dm, fontSize: 12, color: C.mut, textDecoration: "line-through", marginLeft: 6 }}>{b.orig}€</span></div>
              </div>
            ))}
          </Card>
        </div>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Btn primary onClick={() => setSubScreen("transit")}>Simulation: Anreisetag →</Btn>
        </div>
      </>
    );

    if (subScreen === "transit") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 28, fontWeight: 400 }}>Gute Reise! 🚗</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>München → Podstrana · ~830 km</div>
        </div>
        {/* Map */}
        <div style={{ height: 160, borderRadius: 18, background: "linear-gradient(135deg,#1a2332,#0f1822)", position: "relative", overflow: "hidden", border: `1px solid ${C.bord}`, marginBottom: 16 }}>
          <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: 3, background: C.bord }} />
          <div style={{ position: "absolute", top: "50%", left: "10%", width: `${transitProg * 0.8}%`, height: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})`, transition: "width 0.4s" }} />
          <div style={{ position: "absolute", top: "calc(50% - 8px)", left: "8%", ...dm, fontSize: 12, color: C.mut }}>🇩🇪 München</div>
          <div style={{ position: "absolute", top: "calc(50% - 14px)", left: `calc(10% + ${transitProg * 0.8}% - 14px)`, fontSize: 28, transition: "left 0.4s" }}>🚗</div>
          <div style={{ position: "absolute", top: "calc(50% - 10px)", right: "6%", fontSize: 22 }}>🏖️</div>
        </div>
        <input type="range" min={0} max={100} value={transitProg} onChange={e => setTransitProg(+e.target.value)} style={{ width: "100%", accentColor: C.accent, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel>UNTERWEGS</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
              {transitProg < 40 && "🍽️ Ljubljana za 2h — preporučujemo Gostilna Pri Lojzetu. ⛽ Zadnja jeftina pumpa prije HR granice."}
              {transitProg >= 40 && transitProg < 75 && "🎫 HR maut: ~28€ do Splita. ENC preporučen. 📱 A1 HR SIM za 7€ u prvoj benzinskoj."}
              {transitProg >= 75 && `🏖️ Još ~45 min! Domaćin ${GUEST.host} obaviješten. 🛒 Konzum 400m od apartmana za prvi shopping.`}
            </div>
          </Card>
          <Card>
            <SectionLabel>ANKUNFT</SectionLabel>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>☀️</div>
              <div style={{ fontSize: 32, fontWeight: 300 }}>31°</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>Sonnig · Meer 25°C</div>
              <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 8 }}>🌅 Sonnenuntergang 20:47</div>
            </div>
          </Card>
        </div>
        <div style={{ textAlign: "center" }}>
          <Btn primary onClick={() => { setPhase("kiosk"); setSubScreen("home"); }}>Angekommen! → Kiosk starten</Btn>
        </div>
      </>
    );
  };

  /* ══════════════════════════════
     PHASE 2: KIOSK (STAY)
     ══════════════════════════════ */
  const KioskHome = () => {
    const greetKey = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
    const greeting = t(greetKey, lang);
    const tipIcon = hour < 6 ? "🌙" : hour < 12 ? "☕" : hour < 18 ? "🏖️" : hour < 22 ? "🍷" : "🌙";
    const tip = hour < 6 ? "Morgen sonnig. Alarm für 8h empfohlen. WiFi: VillaMarija-5G / jadran2026."
      : hour < 12 ? "Perfekt für Strand Kašjuni — vor 10h kommen. Pekara Bobis (250m) hat frischen Burek ab 6h!"
      : hour < 18 ? `UV ${W.uv} — Schatten suchen bis 16h! Dioklecijanova Palača oder Konzum Einkauf ideal.`
      : hour < 22 ? `Sonnenuntergang ${W.sunset}. Konoba Stari Mlin (15min) — rufen Sie einen Tag vorher an!`
      : "Gute Nacht. Morgen sonnig, Meer 25°C.";

    return (
      <>
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ ...dm, fontSize: 12, color: C.mut, letterSpacing: 2, textTransform: "uppercase" }}>
            {tipIcon} {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} · Tag {kioskDay}/7
          </div>
          <div style={{ fontSize: 32, fontWeight: 400, marginTop: 6 }}>
            {greeting}, <span style={{ color: C.gold }}>{GUEST.first}</span>
          </div>
        </div>

        {/* Weather + UV + time sim */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 36 }}>{W.icon}</span><span style={{ fontSize: 44, fontWeight: 300 }}>{W.temp}°</span>
            </div>
            <div style={{ width: 1, height: 40, background: C.bord }} />
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.6 }}>
              Meer: <strong style={{ color: C.accent }}>{W.sea}°C</strong> · {W.wind}<br />
              UV: <strong style={{ color: W.uv >= 8 ? C.red : C.gold }}>{W.uv}</strong>{W.uv >= 8 && <span style={{ color: C.red }}> SPF50+!</span>} · 🌅 {W.sunset}
            </div>
          </Card>
          <Card style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 18px", minWidth: 180 }}>
            <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 1 }}>⏰ {t("simulation",lang)}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[{ h: null, l: "Sada" }, { h: 7, l: "07" }, { h: 13, l: "13" }, { h: 19, l: "19" }, { h: 23, l: "23" }].map(t => (
                <button key={t.l} onClick={() => setSimHour(t.h)} style={{ ...dm, padding: "5px 10px", background: simHour === t.h ? C.acDim : "transparent", border: `1px solid ${simHour === t.h ? "rgba(0,180,216,0.2)" : C.bord}`, borderRadius: 8, color: simHour === t.h ? C.accent : C.mut, fontSize: 11, cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Tip */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.goDim},rgba(0,180,216,0.03))`, borderColor: "rgba(201,168,76,0.1)", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28 }}>{tipIcon}</div>
          <div>
            <div style={{ ...dm, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>{t("aiRec",lang)}</div>
            <div style={{ ...dm, fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 300 }}>{tip}</div>
            {GUEST.kids > 0 && hour >= 12 && hour < 18 && <div style={{ ...dm, fontSize: 13, color: C.accent, marginTop: 6 }}>👨‍👩‍👧‍👦 Mit Kindern: Bačvice (Sand, flaches Wasser) ist perfekt!</div>}
          </div>
        </Card>

        {/* Budget */}
        <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ ...dm, fontSize: 11, color: C.mut }}>{t("budget",lang)} </span><span style={{ fontSize: 20, fontWeight: 300 }}>{GUEST.spent}€</span><span style={{ ...dm, fontSize: 13, color: C.mut }}> / {GUEST.budget}€</span></div>
            <div style={{ ...dm, fontSize: 13, color: C.accent }}>{budgetLeft}€ {t("left",lang)} · ~{Math.round(budgetLeft / daysLeft)}{t("perDay",lang)}</div>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: C.bord, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${(GUEST.spent / GUEST.budget * 100)}%`, borderRadius: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
        </Card>

        {/* Quick tiles */}
        <SectionLabel>{t("quickAccess",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { k: "parking", e: "🅿️", l: t("parking",lang) }, { k: "beach", e: "🏖️", l: t("beaches",lang) },
            { k: "sun", e: "☀️", l: t("sun",lang) }, { k: "routes", e: "🗺️", l: t("routes",lang) },
            { k: "food", e: "🍽️", l: t("food",lang) }, { k: "emergency", e: "🏥", l: t("emergency",lang) },
            { k: "gems", e: "💎", l: t("gems",lang) }, { k: "chat", e: "🤖", l: t("aiGuide",lang) },
          ].map(t => (
            <div key={t.k} onClick={() => {
              if (t.k === "gems") tryPremium(() => setSubScreen("gems"));
              else if (t.k === "chat") tryPremium(() => setSubScreen("chat"));
              else setSubScreen(t.k);
            }}
              className="anim-card glass" style={{ background: "rgba(12,16,24,0.7)", borderRadius: 18, padding: "22px 12px", textAlign: "center", cursor: "pointer", border: `1px solid ${C.bord}`, transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", position: "relative", boxShadow: "0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(232,224,212,0.02)" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,180,216,0.2)"; e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3), 0 0 20px rgba(0,180,216,0.08), inset 0 1px 0 rgba(232,224,212,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(232,224,212,0.02)"; }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{t.e}</div>
              <div style={{ ...dm, fontSize: 13, fontWeight: 600 }}>{t.l}</div>
              {(t.k === "gems" || t.k === "chat") && !premium && <div style={{ position: "absolute", top: 8, right: 8, ...dm, fontSize: 9, color: C.gold, background: C.goDim, padding: "2px 6px", borderRadius: 6 }}>PRO</div>}
            </div>
          ))}
        </div>

        {/* Experiences */}
        <SectionLabel extra={t("book",lang)}>{t("activities",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {EXPERIENCES.map((exp, _expIdx) => (
            <Card key={exp.id} style={{ padding: 0, overflow: "hidden", cursor: "pointer", opacity: booked.has(exp.id) ? 0.5 : 1, animation: `fadeUp 0.5s ease ${_expIdx * 0.08}s both` }}
              onClick={() => !booked.has(exp.id) && setSelectedExp(exp)}>
              <div style={{ height: 70, background: `linear-gradient(135deg,rgba(0,180,216,0.08),rgba(201,168,76,0.06),rgba(0,100,180,0.05))`, display: "grid", placeItems: "center", fontSize: 36, position: "relative", overflow: "hidden" }}><span className="emoji-float">{exp.emoji}</span></div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ ...dm, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mut }}>
                  <span>⏱{exp.dur} · ⭐{exp.rating} · 🎫{exp.spots}</span>
                  <span style={{ color: C.accent, fontSize: 16, fontWeight: 300 }}>{exp.ourPrice}€</span>
                </div>
                {booked.has(exp.id) && <Badge c="green">✓ Gebucht</Badge>}
              </div>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <Btn onClick={() => { setPhase("post"); setSubScreen("summary"); }}>Simulation: Check-out →</Btn>
        </div>
      </>
    );
  };

  const KioskDetail = () => {
    const data = PRACTICAL[subScreen];
    if (!data) return null;
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{data.icon}</span>
          <div style={{ fontSize: 28, fontWeight: 400 }}>{data.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.items.map((it, i) => (
            <Card key={i} style={{ borderColor: it.warn ? "rgba(239,68,68,0.12)" : it.free ? "rgba(34,197,94,0.12)" : C.bord, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {it.warn && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, marginTop: 8, flexShrink: 0 }} />}
              {it.free && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, marginTop: 8, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{it.n}</div>
                <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>
                  {it.note}
                  {it.d && <span style={{ color: C.accent, marginLeft: 8 }}>{it.d}</span>}
                  {it.price && <span style={{ color: C.text, marginLeft: 8 }}>{it.price}</span>}
                  {it.type && <span style={{ marginLeft: 8 }}>{it.type}</span>}
                </div>
                {it.affiliate && <Badge c="gold">AFFILIATE · {it.link || "booking link"}</Badge>}
                {it.mapKey && <button onClick={(e) => { e.stopPropagation(); openGoogleMaps(it.mapKey); }}
                  style={{...dm,marginTop:6,padding:"6px 14px",background:C.acDim,border:`1px solid rgba(0,180,216,0.15)`,borderRadius:10,color:C.accent,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
                  📍 {t("navigate",lang)}</button>}
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const KioskGems = () => (
    <>
      <BackBtn onClick={() => setSubScreen("home")} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 36 }}>💎</span>
        <div><div style={{ fontSize: 28, fontWeight: 400 }}>Hidden Gems</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>Lokalni znaju — turisti ne</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginTop: 20 }}>
        {GEMS.map((g, i) => (
          <Card key={i} style={{ cursor: "pointer", position: "relative" }}
            onClick={() => { if (g.premium && !premium) setShowPaywall(true); else setSelectedGem(g); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3), 0 0 16px rgba(201,168,76,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            {g.premium && !premium && <div style={{ position: "absolute", inset: 0, background: "rgba(6,9,16,0.7)", borderRadius: 18, display: "grid", placeItems: "center", zIndex: 5 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🔒</div><div style={{ ...dm, fontSize: 12, color: C.gold }}>Premium</div></div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{g.emoji}</span>
              <Badge c="gold">{g.type.toUpperCase()}</Badge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{g.name}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>{g.desc.substring(0, 90)}...</div>
            <div style={{ ...dm, display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: C.mut }}>
              <span>⏰ {g.best}</span><span>📍 {g.diff}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const KioskChat = () => {
    const prompts = ["Was heute mit Kindern?", "Geheime Strände?", "Abendessen-Tipp?", "Wo parken in Split?"];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {chatMsgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>{t("askAnything",lang)}</div>
              <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 20 }}>Fragen Sie alles über Dalmatien</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => setChatInput(p)} style={{ ...dm, padding: "10px 16px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, borderRadius: 14, color: C.text, fontSize: 14, cursor: "pointer" }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(0,180,216,0.08)" : "rgba(232,224,212,0.03)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.6, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(0,180,216,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
              {m.role !== "user" && <div style={{ fontSize: 10, color: C.accent, marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>JADRAN AI</div>}
              {m.text}
            </div>
          ))}
          {chatLoading && <div style={{ ...dm, maxWidth: "78%", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, opacity: 0.5 }}>● ● ●</div>}
          <div ref={chatEnd} />
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: `1px solid ${C.bord}` }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doChat()}
            placeholder={t("askPlaceholder",lang)} style={{ ...dm, flex: 1, padding: "14px 18px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, borderRadius: 18, color: C.text, fontSize: 16, outline: "none" }} />
          <button onClick={doChat} style={{ padding: "14px 24px", background: `linear-gradient(135deg,${C.accent},#0077B6)`, border: "none", borderRadius: 18, color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 600 }}>→</button>
        </div>
      </div>
    );
  };

  const Kiosk = () => {
    if (subScreen === "home") return <KioskHome />;
    if (subScreen === "gems") return <KioskGems />;
    if (subScreen === "chat") return <KioskChat />;
    if (PRACTICAL[subScreen]) return <KioskDetail />;
    return <KioskHome />;
  };

  /* ══════════════════════════════
     PHASE 3: POST-STAY
     ══════════════════════════════ */
  const PostStay = () => (
    <>
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }} className="emoji-float">🌅</div>
        <div style={{ fontSize: 30, fontWeight: 400 }}>Hvala, {GUEST.first}!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          7 Tage · {EXPERIENCES.filter(e => booked.has(e.id)).length + 2} Aktivitäten · {GUEST.spent}€ · Unvergesslich
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Loyalty */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, borderColor: "rgba(0,180,216,0.1)" }}>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.gold, marginBottom: 4 }}>JADRAN LOYALTY</div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>🌊 {LOYALTY.tier}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, marginTop: 8 }}>
            {LOYALTY.points} Punkte → <strong style={{ color: C.gold }}>{LOYALTY.next}</strong> ({LOYALTY.nextPts})
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", overflow: "hidden", margin: "12px 0 6px" }}>
            <div style={{ height: "100%", width: `${(LOYALTY.points / LOYALTY.nextPts) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>Noch {LOYALTY.nextPts - LOYALTY.points} Punkte</div>
        </Card>

        {/* Revenue summary (admin view) */}
        <Card>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8 }}>💰 PRIHOD (admin)</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 2 }}>
            Premium: <strong style={{ color: C.green }}>5.99€</strong><br />
            Concierge marža: <strong style={{ color: C.green }}>~{EXPERIENCES.filter(e => booked.has(e.id)).reduce((s, e) => s + (e.ourPrice - e.price), 0) + 30}€</strong><br />
            Affiliate klikovi: <strong style={{ color: C.green }}>~8-12€</strong><br />
            <span style={{ borderTop: `1px solid ${C.bord}`, display: "block", paddingTop: 4, marginTop: 4 }}>
              UKUPNO po gostu: <strong style={{ color: C.gold, fontSize: 18 }}>~{55 + EXPERIENCES.filter(e => booked.has(e.id)).reduce((s, e) => s + (e.ourPrice - e.price), 0)}€</strong>
            </span>
          </div>
        </Card>
      </div>

      {/* Referral */}
      <Card style={{ textAlign: "center", border: `1px dashed rgba(0,180,216,0.15)`, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{t("inviteFriends",lang)}</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 8 }}>Beide erhalten Rabatt auf die nächste Buchung</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: C.accent, margin: "10px 0" }}>{LOYALTY.code}</div>
        <Btn primary>{t("shareCode",lang)}</Btn>
      </Card>

      {/* Rebooking */}
      <Card style={{ textAlign: "center", padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("nextYear",lang)}</div>
        <div style={{ ...dm, fontSize: 14, color: C.mut, marginBottom: 16, lineHeight: 1.6 }}>
          Early Bird 2027: <strong style={{ color: C.accent }}>20% Rabatt</strong> bei Buchung vor 1. Oktober.
        </div>
        <Btn primary>{t("planSummer",lang)}</Btn>
      </Card>

      {/* Monetization breakdown (admin) */}
      <Card style={{ background: `linear-gradient(135deg,rgba(201,168,76,0.04),rgba(0,180,216,0.03))`, borderColor: "rgba(201,168,76,0.08)" }}>
        <SectionLabel extra="ADMIN">MONETIZACIJA — BEZ UGOVORA</SectionLabel>
        <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
          <strong style={{ color: C.text }}>1. Premium fee (5.99€)</strong> — Gost plaća Stripe-om. Zero ugovora.<br />
          <strong style={{ color: C.text }}>2. Concierge marža (~15-25€/aktivnost)</strong> — Bookiraš po nižoj cijeni, prodaješ višu. Gost ne zna razliku, dobiva bolju uslugu.<br />
          <strong style={{ color: C.text }}>3. Affiliate (4-8% po kliku/bookingu)</strong> — Jadrolinija, GetYourGuide, Booking. Automatski prihod.<br />
          <strong style={{ color: C.text }}>4. Host fee (20€/mj neformalno)</strong> — "Tablet servis" — Srđan dogovori na licu mjesta.<br />
          <br />
          <span style={{ color: C.gold }}>📊 Projekcija:</span> 30 apartmana × 4 gosta/mj × 50€/gost = <strong style={{ color: C.green, fontSize: 18 }}>6.000€/mj</strong> u sezoni.
        </div>
      </Card>
    </>
  );

  /* ═══ MAIN RENDER ═══ */

  /* ─── CINEMATIC SPLASH ─── */
  if (splash) return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#040608", color: "#E8E0D4", minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes splash-wave-1 { 0% { d: path('M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z'); }
          50% { d: path('M0,180 C320,120 640,220 960,140 C1120,110 1280,200 1440,170 L1440,320 L0,320 Z'); }
          100% { d: path('M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z'); } }
        @keyframes splash-wave-2 { 0% { d: path('M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z'); }
          50% { d: path('M0,190 C360,240 720,160 1080,210 C1260,230 1350,180 1440,205 L1440,320 L0,320 Z'); }
          100% { d: path('M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z'); } }
        @keyframes splash-wave-3 { 0% { d: path('M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z'); }
          50% { d: path('M0,235 C400,260 800,220 1200,245 C1320,255 1380,230 1440,242 L1440,320 L0,320 Z'); }
          100% { d: path('M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z'); } }
        @keyframes splash-logo-reveal { 0% { opacity:0; transform: scale(0.7) translateY(10px); filter: blur(8px); }
          60% { opacity:1; transform: scale(1.02) translateY(0); filter: blur(0); }
          100% { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes splash-text-reveal { 0% { opacity:0; transform: translateY(16px); letter-spacing: 12px; }
          100% { opacity:1; transform: translateY(0); letter-spacing: 8px; } }
        @keyframes splash-tagline { 0% { opacity:0; transform: translateY(10px); } 100% { opacity:0.6; transform: translateY(0); } }
        @keyframes splash-line { 0% { width: 0; } 100% { width: 80px; } }
        @keyframes splash-dots { 0%,20% { opacity:0; } 30% { opacity:1; } 60% { opacity:1; } 70%,100% { opacity:0; } }
        @keyframes splash-glow { 0%,100% { box-shadow: 0 0 40px rgba(0,180,216,0.2), 0 0 80px rgba(0,180,216,0.08); }
          50% { box-shadow: 0 0 60px rgba(0,180,216,0.35), 0 0 120px rgba(0,180,216,0.12); } }
        @keyframes splash-fade-out { 0% { opacity:1; } 100% { opacity:0; pointer-events:none; } }
        @keyframes splash-particles { 0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-120px) scale(0); opacity: 0; } }
        .splash-wrap { animation: splash-fade-out 0.8s ease 3s forwards; }
      `}</style>

      {/* Ambient light */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 60%, rgba(0,180,216,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.03) 0%, transparent 50%)" }} />

      {/* Animated waves at bottom */}
      <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"320px", opacity:0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#00B4D8" style={{ animation:"splash-wave-1 6s ease-in-out infinite" }}
          d="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z" />
        <path fill="#0077B6" style={{ animation:"splash-wave-2 7s ease-in-out infinite", opacity:0.6 }}
          d="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z" />
        <path fill="#023E8A" style={{ animation:"splash-wave-3 5s ease-in-out infinite", opacity:0.4 }}
          d="M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z" />
      </svg>

      {/* Floating particles */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position:"absolute",
            left: `${8 + (i * 7.5)}%`,
            bottom: `${10 + (i % 3) * 15}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(0,180,216,0.5)" : "rgba(201,168,76,0.4)",
            animation: `splash-particles ${3 + (i % 4)}s ease-in-out ${0.5 + i * 0.3}s infinite`,
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-wrap" style={{ textAlign:"center", position:"relative", zIndex:2 }}>
        {/* Logo circle */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, #00B4D8, #0077B6, #023E8A)",
          display: "grid", placeItems: "center",
          margin: "0 auto 28px",
          fontSize: 40, fontWeight: 700, color: "#fff",
          animation: "splash-logo-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both, splash-glow 3s ease-in-out infinite",
        }}>J</div>

        {/* Brand name */}
        <div style={{
          fontSize: 44, fontWeight: 300, textTransform: "uppercase", color: "#E8E0D4",
          animation: "splash-text-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
          letterSpacing: 8,
        }}>JADRAN</div>

        {/* Decorative line */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(0,180,216,0.5), rgba(201,168,76,0.3), transparent)",
          margin: "16px auto",
          animation: "splash-line 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14, fontWeight: 300, textTransform: "uppercase", letterSpacing: 4,
          color: "rgba(0,180,216,0.7)",
          animation: "splash-tagline 0.8s ease 1.6s both",
        }}>Your Adriatic, Reimagined</div>

        {/* Loading dots */}
        <div style={{ display:"flex", justifyContent:"center", gap: 6, marginTop: 32 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "rgba(0,180,216,0.5)",
              animation: `splash-dots 1.5s ease ${1.8 + i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* Powered by */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 10, color: "rgba(107,101,96,0.3)", letterSpacing: 2, textTransform: "uppercase",
          marginTop: 40,
          animation: "splash-tagline 0.6s ease 2.2s both",
        }}>SIAL Consulting d.o.o. · AI-Powered Concierge</div>
      </div>

      {/* Skip button */}
      <button onClick={() => setSplash(false)} style={{
        position:"absolute", bottom: 40, fontFamily:"'Outfit',sans-serif",
        background:"none", border:"1px solid rgba(232,224,212,0.1)", borderRadius: 20,
        color:"rgba(232,224,212,0.3)", fontSize: 11, padding:"8px 20px", cursor:"pointer",
        letterSpacing: 2, textTransform:"uppercase", transition:"all 0.3s",
        animation: "splash-tagline 0.5s ease 2.5s both",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,180,216,0.3)"; e.currentTarget.style.color = "rgba(0,180,216,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(232,224,212,0.1)"; e.currentTarget.style.color = "rgba(232,224,212,0.3)"; }}
      >Skip</button>
    </div>
  );
  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: C.bg, color: C.text, minHeight: "100vh", position: "relative" }}>
      {fonts}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(0,180,216,0.15); } 50% { box-shadow: 0 0 40px rgba(0,180,216,0.3); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes wave-move { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scale-in { from { opacity:0; transform: scale(0.9); } to { opacity:1; transform: scale(1); } }
        @keyframes slide-up { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
        @keyframes check-pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

        .jadran-ambient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: 
            radial-gradient(ellipse at 20% 10%, rgba(0,180,216,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(201,168,76,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(0,100,180,0.02) 0%, transparent 70%);
        }
        .jadran-ambient::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 300px;
          background: linear-gradient(to top, rgba(6,9,16,0.95), transparent);
        }
        .jadran-ambient::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(0,180,216,0.4), rgba(201,168,76,0.3), transparent);
          background-size: 200% 100%;
          animation: gradient-shift 8s ease infinite;
        }

        /* Wave decoration */
        .wave-deco { position: fixed; bottom: -2px; left: 0; width: 200%; height: 60px; opacity: 0.03; pointer-events: none; z-index: 1;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 60'%3E%3Cpath fill='%2300B4D8' d='M0,30 C360,60 720,0 1080,30 C1260,45 1350,15 1440,30 L1440,60 L0,60 Z'/%3E%3C/svg%3E") repeat-x;
          animation: wave-move 12s linear infinite;
        }

        /* Grain texture */
        .grain { position: fixed; inset: 0; opacity: 0.018; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,180,216,0.15); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,180,216,0.3); }

        /* Selection */
        ::selection { background: rgba(0,180,216,0.25); color: #E8E0D4; }

        /* Animated cards */
        .anim-card { animation: fadeUp 0.5s ease both; }
        .anim-card:nth-child(1) { animation-delay: 0s; }
        .anim-card:nth-child(2) { animation-delay: 0.08s; }
        .anim-card:nth-child(3) { animation-delay: 0.16s; }
        .anim-card:nth-child(4) { animation-delay: 0.24s; }
        .anim-card:nth-child(5) { animation-delay: 0.32s; }
        .anim-card:nth-child(6) { animation-delay: 0.40s; }
        .anim-card:nth-child(7) { animation-delay: 0.48s; }
        .anim-card:nth-child(8) { animation-delay: 0.56s; }

        /* Button hover effects */
        button { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        button:hover { transform: translateY(-1px); }
        button:active { transform: translateY(0) scale(0.98); }

        /* Primary button glow */
        .btn-glow { position: relative; overflow: hidden; }
        .btn-glow::before { content: ''; position: absolute; inset: -2px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(0,180,216,0.4), rgba(0,119,182,0.2)); filter: blur(8px); opacity: 0; transition: opacity 0.3s; z-index: -1; }
        .btn-glow:hover::before { opacity: 1; }

        /* Card glass effect */
        .glass { backdrop-filter: blur(12px) saturate(1.4); -webkit-backdrop-filter: blur(12px) saturate(1.4); }

        /* Shimmer loading */
        .shimmer { background: linear-gradient(90deg, transparent 30%, rgba(0,180,216,0.06) 50%, transparent 70%);
          background-size: 200% 100%; animation: shimmer 2s ease infinite; }

        /* Overlay entrance */
        .overlay-enter { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Phase dot active pulse */
        .phase-active { animation: pulse-glow 3s ease infinite; }

        /* Premium badge shimmer */
        .premium-shimmer { background: linear-gradient(90deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.2) 50%, rgba(201,168,76,0.08) 100%);
          background-size: 200% 100%; animation: shimmer 3s ease infinite; }

        /* Float animation for emojis */
        .emoji-float { animation: float 4s ease-in-out infinite; display: inline-block; }

        /* Smooth page transitions */
        .page-enter { animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Check animation for booking confirm */
        .check-anim { animation: check-pop 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Touch-friendly sizing for tablet */
        @media (min-width: 768px) and (max-width: 1366px) and (hover: none) {
          button { min-height: 48px; }
        }

        /* Smooth font rendering */
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
      <div className="grain" />
      <div className="wave-deco" />
      <div className="jadran-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "0 24px" }} className="page-enter">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: `1px solid rgba(232,224,212,0.04)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0077B6)`, display: "grid", placeItems: "center", fontSize: 16, fontWeight: 700, color: "#fff", boxShadow: "0 2px 12px rgba(0,180,216,0.3)" }}>J</div>
            <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: 5, textTransform: "uppercase", color: C.accent }}>Jadran</div>
            <span style={{ ...dm, fontSize: 9, color: C.accent, letterSpacing: 2, opacity: 0.6 }}>AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {premium && <span className="premium-shimmer" style={{display:"inline-block",padding:"4px 12px",borderRadius:12,fontSize:11,fontFamily:"'Outfit',sans-serif",color:"#C9A84C",letterSpacing:1.5,fontWeight:600}}>⭐ PREMIUM</span>}
            <div style={{display:"flex",gap:3,background:"rgba(12,16,24,0.6)",borderRadius:12,padding:3,border:`1px solid ${C.bord}`}}>
              {LANGS.map(lg => (
                <button key={lg.code} onClick={() => setLang(lg.code)}
                  style={{...dm,padding:"4px 6px",background:lang===lg.code?C.acDim:"transparent",border:lang===lg.code?`1px solid rgba(0,180,216,0.2)`:"1px solid transparent",borderRadius:9,cursor:"pointer",fontSize:14,lineHeight:1,transition:"all 0.2s"}}
                  title={lg.name}>{lg.flag}</button>
              ))}
            </div>
            <div style={{ ...dm, textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{GUEST.flag} {GUEST.name}</div>
              <div style={{ fontSize: 11, color: C.mut }}>{GUEST.accommodation}</div>
            </div>
          </div>
        </div>

        {/* Phase Nav */}
        <PhaseNav />

        {/* Content */}
        {phase === "pre" && <div className="page-enter"><PreTrip /></div>}
        {phase === "kiosk" && <div className="page-enter" key={subScreen}><Kiosk /></div>}
        {phase === "post" && <div className="page-enter"><PostStay /></div>}

        <div style={{ ...dm, textAlign: "center", padding: "20px 0 28px", fontSize: 10, color: "rgba(107,101,96,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          JADRAN AI · SIAL Consulting d.o.o. · Powered by Claude + Gemini
        </div>
      </div>

      {/* Overlays */}
      {showPaywall && <Paywall />}
      {showConfirm && <BookConfirm />}

      {/* Gem detail */}
      {selectedGem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px) saturate(1.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedGem(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,16,24,0.92)", borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, border: `1px solid rgba(201,168,76,0.12)` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedGem.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedGem.name}</div>
            <div style={{ ...dm, fontSize: 15, color: C.mut, lineHeight: 1.8, marginBottom: 20 }}>{selectedGem.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{ l: "Najbolje doba", v: selectedGem.best }, { l: "Težina", v: selectedGem.diff }].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut }}>{x.l}</div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 600 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <Card glow style={{ background: C.goDim, borderColor: "rgba(201,168,76,0.12)" }}>
              <div style={{ ...dm, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 LOCALS TIP</div>
              <div style={{ ...dm, fontSize: 14, lineHeight: 1.6 }}>{selectedGem.tip}</div>
            </Card>
            {selectedGem.mapKey && <button onClick={() => openGoogleMaps(selectedGem.mapKey)}
              style={{...dm,width:"100%",marginTop:12,padding:"14px",background:C.acDim,border:`1px solid rgba(0,180,216,0.15)`,borderRadius:14,color:C.accent,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📍 {t("openMap",lang)}</button>}
            <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => setSelectedGem(null)}>{t("back",lang)}</Btn>
          </div>
        </div>
      )}

      {/* Experience booking */}
      {selectedExp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px) saturate(1.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedExp(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,16,24,0.92)", borderRadius: 24, maxWidth: 440, width: "100%", padding: 32, border: `1px solid ${C.bord}` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedExp.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedExp.name}</div>
            <div style={{ ...dm, display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 13, color: C.mut }}>
              <span>⏱ {selectedExp.dur}</span><span>⭐ {selectedExp.rating}</span><span>🎫 {selectedExp.spots} mjesta</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>{selectedExp.ourPrice}€</div>
              <div style={{ ...dm, fontSize: 12, color: C.mut }}>{t("perPerson",lang)} · Transfer</div>
              {GUEST.kids > 0 && <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 4 }}>Familie: ~{selectedExp.ourPrice * 2 + Math.round(selectedExp.ourPrice * 0.5 * 2)}€</div>}
            </div>
            <div style={{ ...dm, fontSize: 11, color: C.mut, textAlign: "center", marginBottom: 16, padding: "8px", background: "rgba(0,0,0,0.15)", borderRadius: 10 }}>
              💰 Marža: {selectedExp.ourPrice - selectedExp.price}€/osobi (admin info)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setSelectedExp(null)}>{t("back",lang)}</Btn>
              <Btn primary style={{ flex: 1 }} onClick={() => startBookingCheckout(selectedExp)}>{payLoading ? "⏳..." : t("bookNow",lang)}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
