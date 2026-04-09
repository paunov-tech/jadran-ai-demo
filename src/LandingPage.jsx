// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Landing Page v2 "Izlog"
// Conversion-optimized: Video hero, pain relief, live demo,
// social proof carousel, B2B section, sticky CTA
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { saveDelta } from "./deltaContext";

// Direct Stripe checkout
const goToStripe = async (plan = "season", lang = "en") => {
  try {
    // Analytics
    try { window.plausible?.("checkout_click", { props: { plan, source: "landing" } }); } catch {}
    try { if (localStorage.getItem("jadran_consent") === "1" && window.fbq) window.fbq("track", "AddPaymentInfo", { content_name: plan, currency: "EUR", value: plan === "vip" ? 49.99 : plan === "season" ? 19.99 : 9.99, event_id: `lp_${Date.now()}_${Math.random().toString(36).slice(2,9)}` }); } catch {}
    let deviceId;
    try { deviceId = localStorage.getItem("jadran_device_id"); if (!deviceId) { const b = new Uint8Array(9); crypto.getRandomValues(b); deviceId = "jd_" + Array.from(b, x => x.toString(16).padStart(2,"0")).join(""); localStorage.setItem("jadran_device_id", deviceId); } } catch { deviceId = "unknown"; }
    let utmData = {};
    try { utmData = JSON.parse(localStorage.getItem("jadran_utm") || "{}"); } catch {}
    // Save session so post-payment redirect enters chat
    try { localStorage.setItem("jadran_session", JSON.stringify({ region: plan === "week" ? "split" : "all", travelMode: "apartment", lang })); } catch {}
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: "AI-STANDALONE", guestName: "AI User", lang, returnPath: "/ai", plan, region: plan === "week" ? "split" : "all", deviceId, utm_source: utmData.utm_source || "", utm_medium: utmData.utm_medium || "", utm_campaign: utmData.utm_campaign || "" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (e) { console.error("Checkout error:", e); }
};

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const BKG = (city) => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en`;

const L = {
  hr: { fromLabel: "Odakle krećeš?", toLabel: "Kuda ideš?", fromPlaceholder: "Počni kucati grad…", toPlaceholder: "Počni kucati destinaciju…", ctaGo: "Kreni sa mnom →", badge: "Travel Guardian · Aktivan", h1a: "", h1b: "", h1c: "Travel |J| Guardian.", sub: "Prati te od polaska do sigurnog povratka.", destLabel: "Kamo ideš?", lenLabel: "Dužina vozila?", cta: "Započni Chat", pain1t: "Zaboravi na kazne", pain1d: "Naš vodič zna visinu svakog podvožnjaka i širinu svakog starog grada. Ne rizikuj zaglavljivanje kampera na usponima Biokova ili uličicama Trogira.", pain2t: "Bura te neće iznenaditi", pain2d: "Povezani smo sa lokalnim meteo-stanicama. Ako udari vjetar opasan za tvoju tendu, dobijaš upozorenje i lokaciju najbližeg zaklona.", pain3t: "Mjesta kojih nema na Googleu", pain3d: "OPG-ovi, vinarije s besplatnim parkingom i prazne uvale koje samo lokalci čuvaju za sebe.", demoTitle: "Pametnije od mape. Brže od recepcije.", trendTitle: "Što se traži na Jadranu?", b2bTitle: "Turistička zajednica ili hotelijer? Postanite naš destinacijski partner.", b2bDesc: "TZ Rab odabrala je Jadran.ai kao svog AI turističkog operatera. Vaša destinacija ili smještaj može biti sljedeći. Podijelite QR kod gostima — oni dobijaju operatera koji ih vodi od kuće do kuće.", b2bBtn: "Postanite partner →", sticky: "Od 9.99€/tjedan", stickyBuy: "KUPI ODMAH", stickyBtn: "POKRENI JADRAN", demoLabel: "POGLEDAJTE U AKCIJI", demoDesc: "Hans pita:", demoQ: "Mogu li kamperom do centra Pule?", demoA: "Nikako! 🚨 Pauk cilja kampere — kazna 60€. Parkiraj na Gregovici besplatno.", demoCta: "Konoba Batelina — svježa riba, parking", demoTry: "Probaj besplatno", demoStory: "Vodič odmah upozorava, daje besplatan parking i preporučuje konubu sa popustom. Sve u 3 sekunde.", destLabel2: "DESTINACIJE", destTitle2: "Otkrijte Jadran", destBook2: "Booking.com →", trendLabel2: "POPULARNO", trendSub2: "Aktivnosti i izleti", trendAsk: "Pitaj vodič", trendBook2: "Rezerviraj", freeInfo: "5 poruka besplatno · 8 jezika · bez registracije", roomCode: "Kod sobe", roomOpen: "Otvori", phoneName: "Jadran Vodič" , tab1: "Kamper vodič", tab1s: "Parking, rute, upozorenja", tab2: "Lokalni vodič", tab2s: "Apartman, hotel ili auto — plaže, konobe", tab3: "Nautički vodič", tab3s: "Marine, sidrišta, vjetar", tab4: "Kruzer vodič", tab4s: "Lučki dan, plan po minutu" },
  de: { fromLabel: "Wo startest du?", toLabel: "Wohin geht die Reise?", fromPlaceholder: "Stadt eingeben…", toPlaceholder: "Ziel eingeben…", ctaGo: "Los geht's →", badge: "Travel Guardian · Aktiv", h1a: "", h1b: "", h1c: "Travel |J| Guardian.", sub: "Begleitet Sie von der Abfahrt bis zur Rückkehr.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Keine Strafen mehr", pain1d: "Unser Guide kennt jede Unterführung und jede Altstadtgasse. Kein Risiko.", pain2t: "Bora überrascht nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind erhalten Sie sofort eine Warnung.", pain3t: "Was nicht auf Google steht", pain3d: "Familienbetriebe, Weingüter mit Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Tourismusverband oder Unterkunft? Werden Sie Destinationspartner.", b2bDesc: "Tourismusverband Rab hat Jadran.ai als offiziellen KI-Reiseoperateur gewählt. Ihre Destination ist die nächste. Gäste erhalten einen Operateur der sie von Tür zu Tür begleitet.", b2bBtn: "Partner werden →", sticky: "Ab 9,99€/Woche", stickyBuy: "JETZT KAUFEN", stickyBtn: "JADRAN STARTEN", tab1: "Camper-Reiseführer", demoLabel: "IN AKTION ANSEHEN", demoDesc: "Hans fragt:", demoQ: "Kann ich mit dem Camper ins Zentrum von Pula?", demoA: "Auf keinen Fall! 🚨 Abschleppwagen — 60€ Strafe. Kostenlos parken in Gregovica.", demoCta: "Konoba Batelina — frischer Fisch, Parkplatz", demoTry: "Kostenlos testen", demoStory: "Der Guide warnt sofort, findet kostenloses Parken und empfiehlt ein Restaurant mit Rabatt. In 3 Sekunden.", destLabel2: "REISEZIELE", destTitle2: "Entdecken Sie die Adria", destBook2: "Booking.com →", trendLabel2: "BELIEBT", trendSub2: "Aktivitäten und Ausflüge", trendAsk: "Guide fragen", trendBook2: "Reservieren", freeInfo: "5 Nachrichten gratis · 8 Sprachen · ohne Registrierung", roomCode: "Zimmercode", roomOpen: "Öffnen", phoneName: "Jadran Reiseführer", tab1s: "Stellplätze, Routen, Warnungen", tab2: "Lokaler Reiseführer", tab2s: "Ferienwohnung, Hotel oder Auto — Strände, Restaurants", tab3: "Nautischer Reiseführer", tab3s: "Marinas, Ankerplätze, Wind", tab4: "Kreuzfahrt-Reiseführer", tab4s: "Hafentag, Minutenplan" },
  at: { fromLabel: "Wo startest du?", toLabel: "Wohin geht die Reise?", fromPlaceholder: "Stadt eingeben…", toPlaceholder: "Ziel eingeben…", ctaGo: "Los geht's →", badge: "Travel Guardian · Aktiv", h1a: "", h1b: "", h1c: "Dein |J| Reiseoperateur.", sub: "Wir planen. Begleiten. Bringen dich heim.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Vergiss die Strafen", pain1d: "Unser Guide kennt jede Unterführung und jede Altstadtgasse. Null Risiko.", pain2t: "Bora überrascht dich nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind bekommst du sofort eine Warnung.", pain3t: "Was ned auf Google steht", pain3d: "Familienbetriebe, Weingüter mit Camper-Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Vermietest du eine Unterkunft?", b2bDesc: "Teil unseren QR-Code — deine Gäste kriegen einen 24/7 Guide.", b2bBtn: "Gratis QR-Code erstellen", sticky: "Ab 9,99€/Woche", stickyBuy: "JETZT KAUFEN", stickyBtn: "JADRAN STARTEN", tab1: "Camper-Guide", demoLabel: "SCHAU DIR DAS AN", demoDesc: "Hans fragt:", demoQ: "Kann i mit dem Camper ins Zentrum von Pula?", demoA: "Auf gar keinen Fall! 🚨 Abschleppdienst — 60€ Strafe. Gratis parken in Gregovica.", demoCta: "Konoba Batelina — frischer Fisch, Parkplatz", demoTry: "Gratis ausprobieren", demoStory: "Der Guide warnt sofort, findet gratis Parken und empfiehlt a Beisl mit Rabatt. In 3 Sekunden.", destLabel2: "REISEZIELE", destTitle2: "Entdeck die Adria", destBook2: "Booking.com →", trendLabel2: "BELIEBT", trendSub2: "Aktivitäten und Ausflüge", trendAsk: "Guide fragen", trendBook2: "Reservieren", freeInfo: "5 Nachrichten gratis · 8 Sprachen · ohne Registrierung", roomCode: "Zimmercode", roomOpen: "Öffnen", phoneName: "Jadran Urlaubsguide", tab1s: "Stellplätze, Routen, Warnungen", tab2: "Dein Urlaubsguide", tab2s: "Ferienwohnung, Hotel oder Auto — Strände, Beisln", tab3: "Nautik-Guide", tab3s: "Marinas, Ankerplätze, Wind", tab4: "Kreuzfahrt-Guide", tab4s: "Hafentag, Minutenplan" },
  en: { fromLabel: "Where are you starting?", toLabel: "Where are you going?", fromPlaceholder: "Start typing a city…", toPlaceholder: "Start typing destination…", ctaGo: "Let's go →", badge: "Travel Guardian · Active", h1a: "", h1b: "", h1c: "Travel |J| Guardian.", sub: "Guards every step — from departure to home.", destLabel: "Where to?", lenLabel: "Vehicle length?", cta: "Start Chat", pain1t: "Forget about fines", pain1d: "Our guide knows every underpass height and every old town width. Zero risk.", pain2t: "Bora won't surprise you", pain2d: "Connected to local weather stations. Dangerous wind triggers an instant warning.", pain3t: "What's not on Google", pain3d: "Family farms, wineries with free parking and empty coves only locals know.", demoTitle: "Smarter than any map.", trendTitle: "Trending on the Adriatic?", b2bTitle: "Tourist board or property owner? Become our destination partner.", b2bDesc: "TZ Rab chose Jadran.ai as their official AI travel operator. Your destination could be next. Guests get an operator that guides them door-to-door.", b2bBtn: "Become a partner →", sticky: "From €9.99", stickyBuy: "BUY NOW", stickyBtn: "START JADRAN", demoLabel: "SEE IT IN ACTION", demoDesc: "Hans asks:", demoQ: "Can I drive my camper to the center of Pula?", demoA: "Absolutely not! 🚨 Tow trucks — €60 fine. Park free at Gregovica.", demoCta: "Konoba Batelina — fresh fish, flat parking", demoTry: "Try for free", demoStory: "The guide warns instantly, finds free parking and recommends a restaurant with a discount. All in 3 seconds.", destLabel2: "DESTINATIONS", destTitle2: "Discover the Adriatic", destBook2: "Booking.com →", trendLabel2: "TRENDING", trendSub2: "Activities & excursions", trendAsk: "Ask guide", trendBook2: "Book now", freeInfo: "5 messages free · 8 languages · no registration", roomCode: "Room code", roomOpen: "Open", phoneName: "Jadran Guide", tab1: "Camper Guide", tab1s: "Parking, routes, warnings", tab2: "Local Guide", tab2s: "Apartment, hotel or by car — beaches, restaurants", tab3: "Nautical Guide", tab3s: "Marinas, anchorages, wind", tab4: "Cruise Guide", tab4s: "Port day, minute-by-minute plan" },
  it: { fromLabel: "Da dove parti?", toLabel: "Dove vai?", fromPlaceholder: "Scrivi una città…", toPlaceholder: "Scrivi la destinazione…", ctaGo: "Andiamo →", badge: "Travel Guardian · Attivo", h1a: "", h1b: "", h1c: "Travel |J| Guardian.", sub: "Ti accompagna dalla partenza al ritorno.", destLabel: "Dove vai?", lenLabel: "Lunghezza?", cta: "Inizia Chat", pain1t: "Dimentica le multe", pain1d: "La nostra guida conosce ogni sottopasso e ogni centro storico.", pain2t: "La Bora non sorprende", pain2d: "Collegati alle stazioni meteo. Vento pericoloso = avviso immediato.", pain3t: "Cosa non c'è su Google", pain3d: "Agriturismi, cantine con parcheggio e calette vuote.", demoTitle: "Più smart di ogni mappa.", trendTitle: "Tendenze sull'Adriatico?", b2bTitle: "Affitti un alloggio?", b2bDesc: "Condividi il QR code — ospiti ottengono guida 24/7.", b2bBtn: "Genera QR gratuito", sticky: "Da 9,99€/settimana", stickyBuy: "ACQUISTA ORA", stickyBtn: "AVVIA JADRAN", demoLabel: "GUARDALO IN AZIONE", demoDesc: "Hans chiede:", demoQ: "Posso col camper nel centro di Pola?", demoA: "Assolutamente no! 🚨 Carri attrezzi — multa 60€. Gratis a Gregovica.", demoCta: "Konoba Batelina — pesce fresco, parcheggio", demoTry: "Prova gratis", demoStory: "La guida avvisa subito, trova parcheggio gratuito e consiglia un ristorante con sconto. Tutto in 3 secondi.", destLabel2: "DESTINAZIONI", destTitle2: "Scoprite l'Adriatico", destBook2: "Booking.com →", trendLabel2: "POPOLARE", trendSub2: "Attività ed escursioni", trendAsk: "Chiedi alla guida", trendBook2: "Prenota", freeInfo: "5 messaggi gratis · 8 lingue · senza registrazione", roomCode: "Codice camera", roomOpen: "Apri", phoneName: "Guida Jadran", tab1: "Guida camper", tab1s: "Parcheggi, percorsi, avvertenze", tab2: "Guida locale", tab2s: "Appartamento, hotel o in auto — spiagge, ristoranti", tab3: "Guida nautica", tab3s: "Porti turistici, ancoraggi, vento", tab4: "Guida crociera", tab4s: "Giorno in porto, piano al minuto" },
};

const TRENDING = [
  { emoji: "🚤", title: { hr: "Limski kanal — tura brodom", de: "Lim-Kanal — Bootsfahrt", en: "Lim Channel — boat tour", it: "Canale di Leme — gita in barca" }, sub: { hr: "Samo 12 mjesta", de: "Nur 12 Plätze", en: "Only 12 spots", it: "Solo 12 posti" }, price: "45€", link: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468"), tag: "ISTRA" },
  { emoji: "🍄", title: { hr: "Lov na tartufe — Motovun", de: "Trüffeljagd — Motovun", en: "Truffle hunting — Motovun", it: "Caccia al tartufo — Motovun" }, sub: { hr: "Pravi lovac i pas", de: "Echter Jäger mit Hund", en: "Real hunter & dog", it: "Vero cacciatore con cane" }, price: "45€", link: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975"), tag: "ISTRA" },
  { emoji: "🏟️", title: { hr: "Pula Arena — noćna tura", de: "Pula Arena — Nachttour", en: "Pula Arena — night tour", it: "Arena di Pola — tour notturno" }, sub: { hr: "2000 godina povijesti", de: "2000 Jahre Geschichte", en: "2000 years of history", it: "2000 anni di storia" }, price: "19€", link: GYG("pula-l1350/?q=arena+tour"), tag: "ISTRA" },
  { emoji: "🏝️", title: { hr: "Blue Cave & 5 otoka", de: "Blaue Grotte & 5 Inseln", en: "Blue Cave & 5 islands", it: "Grotta Azzurra & 5 isole" }, sub: { hr: "Cijeli dan na moru", de: "Ganztagesausflug", en: "Full day at sea", it: "Giornata intera in mare" }, price: "110€", link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), tag: "SPLIT" },
  { emoji: "🌊", title: { hr: "Rafting na Cetini", de: "Rafting auf der Cetina", en: "Cetina river rafting", it: "Rafting sul Cetina" }, sub: { hr: "Kanjon + slapovi", de: "Schlucht + Wasserfälle", en: "Canyon + waterfalls", it: "Canyon + cascate" }, price: "40€", link: GYG("omis-l2760/?q=rafting+cetina"), tag: "SPLIT" },
  { emoji: "🌿", title: { hr: "Hvar & Pakleni otoci", de: "Hvar & Pakleni-Inseln", en: "Hvar & Pakleni islands", it: "Hvar & isole Pakleni" }, sub: { hr: "Brodska tura cijeli dan", de: "Ganztags Bootstour", en: "Full day boat trip", it: "Gita in barca giornata intera" }, price: "89€", link: GYG("split-l268/?q=hvar+pakleni+boat"), tag: "SPLIT" },
  { emoji: "💧", title: { hr: "NP Krka — izlet s prijevozom", de: "NP Krka — Tagesausflug", en: "Krka NP — day trip", it: "NP Krka — escursione" }, sub: { hr: "Kupanje uključeno", de: "Baden inklusive", en: "Swimming included", it: "Nuoto incluso" }, price: "65€", link: GYG("split-l268/?q=krka+waterfalls+day+trip"), tag: "ZADAR" },
  { emoji: "🌅", title: { hr: "Zadar — zalazak & morske orgulje", de: "Zadar — Sonnenuntergang & Meeresorgel", en: "Zadar — sunset & sea organ", it: "Zadar — tramonto & organo marino" }, sub: { hr: "Najljepši zalazak na svijetu", de: "Schönster Sonnenuntergang der Welt", en: "World's most beautiful sunset", it: "Il tramonto più bello del mondo" }, price: "25€", link: GYG("zadar-l5008/?q=sunset+sea+organ"), tag: "ZADAR" },
  { emoji: "🍷", title: { hr: "Degustacija na Pelješcu", de: "Weinprobe auf Pelješac", en: "Wine tasting on Pelješac", it: "Degustazione a Pelješac" }, sub: { hr: "Parking za kampere", de: "Camper-Parkplatz", en: "Camper parking", it: "Parcheggio camper" }, price: "35€", link: GYG("ston-l4159/?q=wine+tasting+peljesac"), tag: "DUBROVNIK" },
  { emoji: "🏰", title: { hr: "Dubrovnik zidine — vodič", de: "Dubrovnik Stadtmauern — Guide", en: "Dubrovnik city walls — guided", it: "Mura di Dubrovnik — guidato" }, sub: { hr: "Bez čekanja", de: "Ohne Wartezeit", en: "Skip the queue", it: "Senza fila" }, price: "45€", link: GYG("activity/-t217212"), tag: "DUBROVNIK" },
  { emoji: "🚣", title: { hr: "Kajak — zidine Dubrovnika", de: "Kajak — Dubrovnik Mauern", en: "Kayak — Dubrovnik walls", it: "Kayak — mura Dubrovnik" }, sub: { hr: "Pogled s mora", de: "Blick vom Meer", en: "View from the sea", it: "Vista dal mare" }, price: "40€", link: GYG("dubrovnik-l213/?q=kayak+walls"), tag: "DUBROVNIK" },
  { emoji: "🏔️", title: { hr: "Plitvička jezera & Rastoke", de: "Plitvicer Seen & Rastoke", en: "Plitvice Lakes & Rastoke", it: "Laghi di Plitvice & Rastoke" }, sub: { hr: "Ulaznica uključena", de: "Ticket inklusive", en: "Ticket included", it: "Biglietto incluso" }, price: "99€", link: GYG("activity/-t406236"), tag: "PLITVICE" },
];

// Demo chat built dynamically from tx() translations


const DESTINATIONS = [
  { name: "Split & Podstrana", emoji: "🏛️", desc: { hr: "Dioklecijanova palača, Bačvice, Marjan", de: "Diokletians Palast, Bačvice, Marjan", en: "Diocletian's Palace, Bačvice, Marjan", it: "Palazzo di Diocleziano, Bačvice, Marjan" }, link: BKG("Split, Croatia"), region: "Dalmacija", city: "Split" },
  { name: "Makarska rivijera", emoji: "🏖️", desc: { hr: "Najljepše plaže Jadrana", de: "Die schönsten Strände der Adria", en: "Most beautiful beaches of the Adriatic", it: "Le spiagge più belle dell'Adriatico" }, link: BKG("Makarska, Croatia"), region: "Dalmacija", city: "Makarska" },
  { name: "Hvar", emoji: "🌿", desc: { hr: "Lavanda, glamur, noćni život", de: "Lavendel, Glamour, Nachtleben", en: "Lavender, glamour, nightlife", it: "Lavanda, glamour, vita notturna" }, link: BKG("Hvar, Croatia"), region: "Otoci", city: "Hvar" },
  { name: "Rovinj", emoji: "⛪", desc: { hr: "Najromantičniji grad Istre", de: "Romantischste Stadt Istriens", en: "Most romantic town in Istria", it: "La città più romantica dell'Istria" }, link: BKG("Rovinj, Croatia"), region: "Istra", city: "Rovinj" },
  { name: "Pula", emoji: "🏟️", desc: { hr: "Rimska arena, obiteljske plaže", de: "Römisches Amphitheater, Familienstrände", en: "Roman arena, family beaches", it: "Arena romana, spiagge familiari" }, link: BKG("Pula, Croatia"), region: "Istra", city: "Pula" },
  { name: "Opatija", emoji: "⚓", desc: { hr: "Elegancija Kvarnera", de: "Eleganz der Kvarner Bucht", en: "Elegance of the Kvarner Bay", it: "Eleganza del Quarnero" }, link: BKG("Opatija, Croatia"), region: "Kvarner", city: "Opatija" },
  { name: "Dubrovnik", emoji: "🏰", desc: { hr: "Biser Jadrana, gradske zidine", de: "Perle der Adria, Stadtmauern", en: "Pearl of the Adriatic, city walls", it: "Perla dell'Adriatico, mura cittadine" }, link: BKG("Dubrovnik, Croatia"), region: "Dalmacija", city: "Dubrovnik" },
  { name: "Zadar", emoji: "🌅", desc: { hr: "Morske orgulje, najljepši zalazak", de: "Meeresorgel, schönster Sonnenuntergang", en: "Sea organ, most beautiful sunset", it: "Organo marino, tramonto più bello" }, link: BKG("Zadar, Croatia"), region: "Dalmacija", city: "Zadar" },
];

const DESTS = ["Rovinj","Split","Dubrovnik","Zadar","Pula","Makarska","Hvar","Opatija"];

export default function LandingPage() {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("jadran_lang");
      if (saved) return saved;
      const nav = (navigator.language || "hr").toLowerCase();
      if (nav.startsWith("de") && nav.includes("at")) return "at";
      if (nav.startsWith("de")) return "de";
      if (nav.startsWith("en")) return "en";
      if (nav.startsWith("it")) return "it";
    } catch {}
    return "hr";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [legalPage, setLegalPage] = useState(null); // "impressum" | "privacy" | null
  // Persist language + close popover on outside click
  useEffect(() => { try { localStorage.setItem("jadran_lang", lang); } catch {} }, [lang]);
  const FLAGS = [["hr","🇭🇷"],["de","🇩🇪"],["at","🇦🇹"],["en","🇬🇧"],["it","🇮🇹"],["si","🇸🇮"],["cz","🇨🇿"],["pl","🇵🇱"]];
  const curFlag = (FLAGS.find(f => f[0] === lang) || FLAGS[0])[1];
  // AT uses standard DE (Hochdeutsch), no dialect
  const tx = (k) => (L[lang === "at" ? "de" : lang] || L.hr)[k] || L.hr[k];
  const [dest, setDest] = useState("");
  const [vLen, setVLen] = useState("");
  const [anim, setAnim] = useState(false);
  const [roomInput, setRoomInput] = useState("");
  const [guardianBrief, setGuardianBrief] = useState(null); // pre-trip brief data
  const [briefLoading, setBriefLoading] = useState(false);
  // Unified entry flow
  const [selectedMode, setSelectedMode] = useState(null); // "auto"|"avion"|"kamper"|"odmor"
  const [depCity, setDepCity] = useState("");
  const [depCoords, setDepCoords] = useState(null); // {lat, lng} from autosuggest
  const [routeStep, setRouteStep] = useState(null); // null | "city" | "map"
  const [toLPCity, setToLPCity] = useState(""); // destination city for new 2-input flow
  const [toCoords, setToCoords] = useState(null); // {lat, lng} from autosuggest
  const [fromLPSugs, setFromLPSugs] = useState([]);
  const [toLPSugs, setToLPSugs] = useState([]);
  const fromTimerRef = useRef(null);
  const toTimerRef = useRef(null);
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);
  const [fromRect, setFromRect] = useState(null);
  const [toRect, setToRect] = useState(null);

  const hereSuggest = (text, setter, timerRef) => {
    clearTimeout(timerRef.current);
    if (!text || text.length < 2) { setter([]); return; }
    timerRef.current = setTimeout(() => {
      fetch(`https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(text)}&at=45.0,14.5&in=countryCode:HRV,AUT,DEU,SVN,ITA,CZE,POL,SRB,BIH,MNE,HUN,CHE&limit=5&apikey=${HERE_KEY}`)
        .then(r => r.json())
        .then(data => {
          setter((data.items || [])
            .filter(i => i.position && (i.resultType === "locality" || i.resultType === "administrativeArea" || i.resultType === "place"))
            .map(i => ({ title: i.title, lat: i.position.lat, lng: i.position.lng }))
          );
        })
        .catch(() => setter([]));
    }, 250);
  };
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapRef = useRef(null);
  const hereMapRef = useRef(null);
  const [chatStep, setChatStep] = useState(0);
  const [trendImgs, setTrendImgs] = useState({});
  const [cityImgs, setCityImgs] = useState({});
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeInputFocused, setRouteInputFocused] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverStatus, setRecoverStatus] = useState(null); // null|"loading"|"ok"|"fail"
  // Detect GDPR banner presence — offset sticky bar so they don't overlap
  const [gdprVisible, setGdprVisible] = useState(() => { try { return !localStorage.getItem("jadran_consent"); } catch { return false; } });
  useEffect(() => {
    const check = () => { try { setGdprVisible(!localStorage.getItem("jadran_consent")); } catch {} };
    const id = setInterval(check, 1000); // re-check after user clicks accept/decline
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!showPlanPicker) return;
    const h = e => { if (e.key === "Escape") setShowPlanPicker(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showPlanPicker]);
  const [isPremium, setIsPremium] = useState(() => {
    try {
      if (localStorage.getItem("jadran_ai_premium") !== "1") return false;
      const pp = localStorage.getItem("jadran_premium_plan");
      if (pp) {
        const d = JSON.parse(pp);
        if (d.expiresAt && d.expiresAt < Date.now()) { localStorage.removeItem("jadran_ai_premium"); return false; }
      }
      return true;
    } catch { return false; }
  });
  const [premDays, setPremDays] = useState(null);
  const [premLabel, setPremLabel] = useState("");
  useEffect(() => {
    try {
      const pp = localStorage.getItem("jadran_premium_plan");
      if (pp) {
        const d = JSON.parse(pp);
        const left = Math.ceil((d.expiresAt - Date.now()) / 86400000);
        setPremDays(left > 0 ? left : 0);
        setPremLabel(d.plan === "vip" ? "VIP" : d.plan === "season" ? (lang === "en" ? "SEASON" : lang === "de" || lang === "at" ? "SAISON" : lang === "it" ? "STAGIONE" : "SEZONA") : (lang === "en" ? "EXPLORER" : lang === "de" || lang === "at" ? "EXPLORER" : lang === "it" ? "EXPLORER" : "EXPLORER"));
      }
    } catch {}
  }, [lang]);

  useEffect(() => { setTimeout(() => setAnim(true), 200); }, []);
  useEffect(() => {
    if (chatStep < 3) {
      const t = setTimeout(() => setChatStep(s => s + 1), chatStep === 0 ? 1200 : 1800);
      return () => clearTimeout(t);
    }
  }, [chatStep]);

  // Load destination city images
  useEffect(() => {
    DESTINATIONS.forEach(d => {
      fetch(`/api/cityimg?city=${encodeURIComponent(d.city)}`)
        .then(r => r.json())
        .then(data => { if (data.url) setCityImgs(prev => ({ ...prev, [d.city]: data.url })); })
        .catch(() => {});
    });
  }, []);

  // Load trending images
  useEffect(() => {
    const cities = [...new Set(TRENDING.map(t => t.tag))];
    cities.forEach(city => {
      fetch(`/api/cityimg?city=${encodeURIComponent(city)}`)
        .then(r => r.json())
        .then(d => { if (d.url) setTrendImgs(prev => ({ ...prev, [city]: d.url })); })
        .catch(() => {});
    });
  }, []);

  // Auto-carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx(i => (i + 1) % TRENDING.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goChat = () => { window.location.href = `/ai?niche=camper${dest ? "&dest=" + dest : ""}`; };
  const goRoom = () => { const c = roomInput.trim().toUpperCase(); if (c) window.location.href = `/?room=${encodeURIComponent(c)}`; };

  const WMO_ICON = (code) => {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "🌨️";
    if (code <= 82) return "🌦️";
    return "⛈️";
  };

  const destTag = (city) => {
    const c = city.toLowerCase();
    if (c.includes("split") || c.includes("makarska") || c.includes("hvar") || c.includes("omiš") || c.includes("brač")) return "SPLIT";
    if (c.includes("dubrovnik") || c.includes("pelješac") || c.includes("ston")) return "DUBROVNIK";
    if (c.includes("zadar") || c.includes("krka") || c.includes("šibenik") || c.includes("sibenik")) return "ZADAR";
    if (c.includes("pula") || c.includes("rovinj") || c.includes("poreč") || c.includes("porec") || c.includes("motovun") || c.includes("istra")) return "ISTRA";
    if (c.includes("plitvic")) return "PLITVICE";
    return null;
  };

  const launchGuardian = async () => {
    const isArrival = selectedMode === "avion"; // plane / yacht / cruise — no driving route
    if (!isArrival && !depCity.trim()) return;
    if (!toLPCity.trim()) return;
    setBriefLoading(true);
    const seg = selectedMode === "kamper" ? "kamper" : selectedMode === "avion" ? "luxury" : "par";
    const fromCoordArr = depCoords ? [depCoords.lat, depCoords.lng] : null;
    const destObj = { city: toLPCity.trim() };
    if (toCoords) { destObj.lat = toCoords.lat; destObj.lng = toCoords.lng; }
    saveDelta({ segment: seg, transport: selectedMode, from: isArrival ? null : depCity.trim(), from_coords: fromCoordArr, destination: destObj, lang, phase: isArrival ? "arrival" : "transit" });
    // For arrival mode (plane/yacht), route to kiosk — NOT to StandaloneAI setup screen
    const toKioskSlug = (city) => {
      const n = city.toLowerCase()
        .replace(/š/g,"s").replace(/č/g,"c").replace(/ć/g,"c")
        .replace(/ž/g,"z").replace(/đ/g,"dj").replace(/[^a-z]/g,"");
      return { split:"split",dubrovnik:"dubrovnik",hvar:"hvar",zadar:"zadar",rab:"rab",
               krk:"krk",pula:"pula",rovinj:"rovinj",sibenik:"sibenik",shibenik:"sibenik",
               trogir:"trogir",korcula:"korcula",korchula:"korcula",brac:"brac",
               porec:"porec",opatija:"opatija",makarska:"makarska",novalja:"novalja",
               biograd:"biograd",vodice:"vodice",primosten:"primosten",crikvenica:"crikvenica",
               ragusa:"dubrovnik",spalato:"split",brač:"brac" }[n] || "split";
    };
    const transitUrl = isArrival
      ? `/?kiosk=${toKioskSlug(toLPCity.trim())}&lang=${lang}${toCoords ? `&tLat=${toCoords.lat}&tLng=${toCoords.lng}` : ""}`
      : `/?room=DEMO&go=transit&from=${encodeURIComponent(depCity.trim())}&to=${encodeURIComponent(toLPCity.trim())}&seg=${seg}&lang=${lang}${depCoords ? `&fLat=${depCoords.lat}&fLng=${depCoords.lng}` : ""}${toCoords ? `&tLat=${toCoords.lat}&tLng=${toCoords.lng}` : ""}`;

    // Linear distance + ETA — only for driving modes
    let distKm = null, etaH = null, etaMin = null;
    if (!isArrival && depCoords && toCoords) {
      const R = 6371;
      const dLat = (toCoords.lat - depCoords.lat) * Math.PI / 180;
      const dLng = (toCoords.lng - depCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(depCoords.lat*Math.PI/180)*Math.cos(toCoords.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const crow = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distKm = Math.round(crow * 1.35);
      const speedKph = seg === "kamper" ? 85 : 110;
      const totalMin = Math.round(distKm / speedKph * 60);
      etaH = Math.floor(totalMin / 60); etaMin = totalMin % 60;
    }

    // ── STAGE 1: fast fetches in parallel (weather + Jadran Sense + satellite) ──
    let weather = null, senseCards = [], satData = null;

    const weatherPromise = toCoords
      ? fetch(`https://api.open-meteo.com/v1/forecast?latitude=${toCoords.lat.toFixed(4)}&longitude=${toCoords.lng.toFixed(4)}&current=temperature_2m,weathercode&timezone=auto`, { signal: AbortSignal.timeout(6000) })
          .then(r => r.json())
          .then(wd => { if (wd.current) weather = { temp: Math.round(wd.current.temperature_2m), icon: WMO_ICON(wd.current.weathercode) }; })
          .catch(() => {})
      : Promise.resolve();

    // For arrival mode: use destination coords as both origin and dest for Sense data
    const senseOriginCoords = isArrival ? toCoords : depCoords;
    const guidePromise = (senseOriginCoords && toCoords)
      ? fetch(`/api/guide?oLat=${senseOriginCoords.lat}&oLng=${senseOriginCoords.lng}&dLat=${toCoords.lat}&dLng=${toCoords.lng}&seg=${seg}&lang=${lang === "at" ? "de" : lang || "hr"}`, { signal: AbortSignal.timeout(8000) })
          .then(r => r.json())
          .then(data => { senseCards = Array.isArray(data) ? data : (data.cards || []); })
          .catch(() => {})
      : Promise.resolve();

    const satPromise = toCoords
      ? fetch(`/api/satellite?lat=${toCoords.lat.toFixed(4)}&lng=${toCoords.lng.toFixed(4)}`, { signal: AbortSignal.timeout(8000) })
          .then(r => r.json())
          .then(d => { if (d.zoneCount > 0) satData = d; })
          .catch(() => {})
      : Promise.resolve();

    await Promise.all([weatherPromise, guidePromise, satPromise]);

    const tag = destTag(toLPCity);
    const offers = tag ? TRENDING.filter(t => t.tag === tag).slice(0, 3) : TRENDING.slice(0, 3);
    setGuardianBrief({ weather, distKm, etaH, etaMin, seg, transitUrl, offers, senseCards, satData, isArrival });
    setBriefLoading(false);
  };

  // HERE Maps API key (safe for client-side JS Maps API)
  const HERE_KEY = import.meta.env.VITE_HERE_API_KEY || "";

  // Destination coords from autosuggest (or Split fallback)
  const destLat = toCoords?.lat || 43.508;
  const destLng = toCoords?.lng || 16.440;

  const TRANSPORT_LABELS = {
    hr: { auto: "🚗 Auto / Kombi", avion: "✈️ Avion / Jahta", kamper: "🚐 Kamper / Prikolica", odmor: "🏠 Već sam na odmoru" },
    de: { auto: "🚗 Auto / Kombi", avion: "✈️ Flug / Yacht", kamper: "🚐 Camper / Anhänger", odmor: "🏠 Ich bin schon da" },
    en: { auto: "🚗 Car / Van", avion: "✈️ Flight / Yacht", kamper: "🚐 Camper / Caravan", odmor: "🏠 Already on vacation" },
    it: { auto: "🚗 Auto / Furgone", avion: "✈️ Volo / Yacht", kamper: "🚐 Camper / Roulotte", odmor: "🏠 Sono già in vacanza" },
  };
  const TRANSPORT_SUBS = {
    hr: { auto: "Rute, parking, info za putnike", avion: "Transferi, marine, izleti", kamper: "Kampovi, visine mostova, servisi", odmor: "Unesite kod sobe za personalizirani vodič" },
    de: { auto: "Routen, Parken, Reiseinfos", avion: "Transfers, Marinas, Ausflüge", kamper: "Campingplätze, Brückenhöhen, Service", odmor: "Zimmernummer eingeben für persönlichen Guide" },
    en: { auto: "Routes, parking, travel info", avion: "Transfers, marinas, excursions", kamper: "Campsites, bridge heights, services", odmor: "Enter room code for personalized guide" },
    it: { auto: "Percorsi, parcheggi, info viaggio", avion: "Trasferimenti, marine, escursioni", kamper: "Campeggi, altezze ponti, servizi", odmor: "Inserisci codice camera per guida personale" },
  };
  const DEP_PLACEHOLDER = { hr: "Grad polaska (npr. München, Wien...)", de: "Abfahrtstadt (z.B. München, Wien...)", en: "Departure city (e.g. München, Vienna...)", it: "Città di partenza (es. Monaco, Vienna...)" };
  const goLabel = (l) => ({ hr: "Pokaži rutu →", de: "Route anzeigen →", en: "Show route →", it: "Mostra percorso →" }[l] || "Pokaži rutu →");
  const startLabel = (l) => ({ hr: "Krenite na put →", de: "Reise starten →", en: "Start your journey →", it: "Inizia il viaggio →" }[l] || "Krenite na put →");
  const tlang = (obj) => obj[lang === "at" ? "de" : lang] || obj.hr || obj.en || "";

  const modeToNiche = { auto: "local", avion: "luxury", kamper: "camper" };

  // Load HERE Maps scripts dynamically
  const loadHereMaps = useCallback(() => new Promise((resolve, reject) => {
    if (window.H?.Map) { resolve(); return; }
    const scripts = [
      "https://js.api.here.com/v3/3.1/mapsjs-core.js",
      "https://js.api.here.com/v3/3.1/mapsjs-service.js",
      "https://js.api.here.com/v3/3.1/mapsjs-ui.js",
      "https://js.api.here.com/v3/3.1/mapsjs-mapevents.js",
    ];
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://js.api.here.com/v3/3.1/mapsjs-ui.css";
    document.head.appendChild(css);
    let loaded = 0;
    const loadNext = (i) => {
      if (i >= scripts.length) { resolve(); return; }
      const s = document.createElement("script");
      s.src = scripts[i]; s.async = false;
      s.onload = () => { loaded++; loadNext(i + 1); };
      s.onerror = reject;
      document.head.appendChild(s);
    };
    loadNext(0);
  }), []);

  // Geocode + route using HERE APIs, then render map
  const fetchRoute = useCallback(async (city) => {
    setRouteLoading(true);
    try {
      // 1. Geocode departure city
      const geoRes = await fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(city + ", Europe")}&limit=1&apikey=${HERE_KEY}`);
      const geoData = await geoRes.json();
      const pos = geoData.items?.[0]?.position;
      if (!pos) throw new Error("City not found");
      const { lat: oLat, lng: oLng } = pos;

      // 2. Calculate route
      const niche = selectedMode === "avion" ? "pedestrian" : selectedMode === "kamper" ? "truck" : "car";
      const routeRes = await fetch(`https://router.hereapi.com/v8/routes?transportMode=${niche}&origin=${oLat},${oLng}&destination=${destLat},${destLng}&return=polyline,summary,actions&apikey=${HERE_KEY}`);
      const routeJson = await routeRes.json();
      const section = routeJson.routes?.[0]?.sections?.[0];
      if (!section) throw new Error("No route");
      const summary = section.summary;
      const km = Math.round(summary.length / 1000);
      const hrs = Math.floor(summary.duration / 3600);
      const mins = Math.round((summary.duration % 3600) / 60);
      setRouteData({ oLat, oLng, city: geoData.items[0].title, km, hrs, mins, polyline: section.polyline });

      // 3. Load HERE Maps JS and render
      await loadHereMaps();
      setRouteStep("map");
    } catch (e) {
      console.error("Route error:", e);
      setRouteData({ error: e.message });
      setRouteStep("map");
    } finally {
      setRouteLoading(false);
    }
  }, [selectedMode, loadHereMaps, destLat, destLng]);

  // Render HERE map after routeData is set and mapRef is available
  useEffect(() => {
    if (routeStep !== "map" || !routeData || routeData.error || !mapRef.current || !window.H) return;
    if (hereMapRef.current) { hereMapRef.current.dispose(); }
    const platform = new window.H.service.Platform({ apikey: HERE_KEY });
    const defaultLayers = platform.createDefaultLayers();
    const map = new window.H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      zoom: 6, center: { lat: (routeData.oLat + destLat) / 2, lng: (routeData.oLng + destLng) / 2 },
    });
    hereMapRef.current = map;
    const behavior = new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));
    window.H.ui.UI.createDefault(map, defaultLayers);

    // Decode polyline and draw route
    if (routeData.polyline && window.H.geo.LineString) {
      try {
        const lineString = window.H.geo.LineString.fromFlexiblePolyline(routeData.polyline);
        const polyline = new window.H.map.Polyline(lineString, { style: { lineWidth: 4, strokeColor: "#0ea5e9" } });
        map.addObject(polyline);
        map.getViewModel().setLookAtData({ bounds: polyline.getBoundingBox() }, true);
      } catch {}
    }

    // Origin & destination markers
    const svgOrigin = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0ea5e9"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">🚩</text></svg>`;
    const svgDest = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12">⚓</text></svg>`;
    map.addObjects([
      new window.H.map.Marker({ lat: routeData.oLat, lng: routeData.oLng }, { icon: new window.H.map.Icon(svgOrigin) }),
      new window.H.map.Marker({ lat: destLat, lng: destLng }, { icon: new window.H.map.Icon(svgDest) }),
    ]);
  }, [routeStep, routeData]);

  // Clean up HERE map on unmount
  useEffect(() => () => { hereMapRef.current?.dispose?.(); }, []);

  const F = "'Playfair Display', Georgia, serif";
  const B = "'Outfit', system-ui, sans-serif";

  return (
    <div style={{ background: "#0a1628", color: "#f0f4f8", fontFamily: B, overflowX: "hidden" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, paddingTop: "max(10px, env(safe-area-inset-top, 10px))", paddingBottom: 10, paddingLeft: 16, paddingRight: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,22,40,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Left: hamburger */}
        <button onClick={() => setMenuOpen(m => !m)} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 0, flexShrink: 0 }} aria-label="Meni">
          <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "#0ea5e9" : "#94a3b8", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
          <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "transparent" : "#94a3b8", borderRadius: 2, transition: "all 0.2s" }} />
          <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "#0ea5e9" : "#94a3b8", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
        </button>

        {/* Center: JADRAN */}
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: F, fontSize: 17, fontWeight: 700, letterSpacing: 3, color: "#f0f4f8", pointerEvents: "none" }}>JADRAN</span>

        {/* Right: lang picker */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setLangOpen(!langOpen)} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
            {curFlag}<span style={{ fontSize: 9, color: "#64748b" }}>▾</span>
          </button>
          {langOpen && <>
            <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
            <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 999, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, padding: 6, background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
              {FLAGS.map(([c,f]) => (
                <button key={c} onClick={() => { setLang(c); setLangOpen(false); }} style={{ padding: "6px 8px", background: lang === c ? "rgba(14,165,233,0.15)" : "transparent", border: lang === c ? "1px solid rgba(14,165,233,0.3)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "all 0.15s" }}>{f}</button>
              ))}
            </div>
          </>}
        </div>

        {/* Hamburger dropdown */}
        {menuOpen && <>
          <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 12, zIndex: 99, minWidth: 200, background: "rgba(10,22,40,0.97)", backdropFilter: "blur(24px)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", overflow: "hidden" }}>
            <a href="https://vi.me/qku0x" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", color: "#22c55e", fontSize: 14, fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
              Aktivnosti
            </a>
            <a href="/explore" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", color: "#7dd3fc", fontSize: 14, fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              {lang === "de" || lang === "at" ? "Destinationen" : lang === "en" ? "Explore" : lang === "it" ? "Destinazioni" : lang === "si" ? "Destinacije" : lang === "pl" ? "Destynacje" : "Destinacije"}
            </a>
            <a href="/partner" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", color: "#94a3b8", fontSize: 14, textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Host / Partner
            </a>
            <button onClick={() => { setMenuOpen(false); window.history.back(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", color: "#64748b", fontSize: 14, background: "none", border: "none", cursor: "pointer", width: "100%", fontFamily: B, textAlign: "left" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              {lang === "de" || lang === "at" ? "Zurück" : lang === "en" ? "Back" : lang === "it" ? "Indietro" : "Nazad"}
            </button>
          </div>
        </>}
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", minHeight: "100dvh", display: "flex", alignItems: "flex-start", overflow: "hidden", paddingBottom: 40 }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%230a0e17'/%3E%3C/svg%3E">
          <source src="https://videos.pexels.com/video-files/1093662/1093662-sd_640_360_30fps.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,23,0.6) 0%, rgba(10,14,23,0.3) 40%, rgba(10,14,23,0.95) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto", padding: selectedMode ? "76px 24px 40px" : "76px 24px 40px", textAlign: "center", opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.15)", color: "#facc15", fontSize: 11, fontWeight: 600, marginBottom: 20, letterSpacing: 1 }}>{"🛡️"} {tx("badge")}</div>
          <h1 style={{ fontFamily: F, fontSize: "clamp(28px, 5.5vw, 52px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
            <span style={{ color: "#f87171" }}>{tx("h1a")}<br/>{tx("h1b")}</span><br/>
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {tx("h1c").split("|J|").map((part, idx) => idx === 0 ? <span key={idx}>{part}</span> : <span key={idx}><span style={{ display: "inline-block", width: "0.9em", height: "0.9em", borderRadius: "0.2em", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", textAlign: "center", lineHeight: "0.9em", fontSize: "0.65em", fontWeight: 800, color: "#fff", WebkitTextFillColor: "#fff", verticalAlign: "middle", margin: "0 0.15em" }}>J</span>{part}</span>)}
              </span>
          </h1>
          <p style={{ fontSize: "clamp(14px, 2.2vw, 17px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>{tx("sub")}</p>
          {/* ── Transport Tiles with DELTA integration ── */}
          {(() => {
            const TILE_TO_SEGMENT = { auto: "par", avion: "jedrilicar", kamper: "kamper", odmor: null };
            const tiles = [
              { id: "auto",   img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=75", accent: "rgba(14,165,233,0.65)", border: "rgba(14,165,233,0.2)" },
              { id: "avion",  img: "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=400&q=75", accent: "rgba(6,182,212,0.6)", border: "rgba(6,182,212,0.2)" },
              { id: "kamper", img: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&q=75", accent: "rgba(245,158,11,0.65)", border: "rgba(245,158,11,0.2)" },
              { id: "odmor",  img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75", accent: "rgba(34,197,94,0.55)", border: "rgba(34,197,94,0.2)" },
            ];
            // Dynamic Guardian phase: 0=setup tile, 1=entering route, 2=ready to activate
            const gPhase = selectedMode === null ? 0
              : routeStep === "room" ? 1
              : routeStep === "city" && depCity.trim() && toLPCity.trim() ? 2
              : routeStep === "city" ? 1
              : 0;
            const stepLabels = [
              { hr: "GUARDIAN POSTAVLJANJE — KORAK 1", de: "GUARDIAN SETUP — SCHRITT 1", en: "GUARDIAN SETUP — STEP 1", it: "CONFIGURAZIONE GUARDIAN — PASSO 1" },
              { hr: "GUARDIAN POSTAVLJANJE — KORAK 2", de: "GUARDIAN SETUP — SCHRITT 2", en: "GUARDIAN SETUP — STEP 2", it: "CONFIGURAZIONE GUARDIAN — PASSO 2" },
              { hr: "GUARDIAN SPREMAN — AKTIVIRAJ", de: "GUARDIAN BEREIT — AKTIVIEREN", en: "GUARDIAN READY — ACTIVATE", it: "GUARDIAN PRONTO — ATTIVA" },
            ];
            // Guardian Brief intercept — show pre-trip card instead of setup wizard
            if (guardianBrief) {
              const gb = guardianBrief;
              const modeLabel = { kamper: { hr:"kamper 🚐", de:"Wohnmobil 🚐", en:"camper 🚐", it:"camper 🚐" }, jedrilicar: { hr:"jahta/avion ⛵", de:"Yacht/Flug ⛵", en:"yacht/flight ⛵", it:"yacht/volo ⛵" }, par: { hr:"auto 🚗", de:"Auto 🚗", en:"car 🚗", it:"auto 🚗" } }[gb.seg] || { hr:"auto 🚗", de:"Auto 🚗", en:"auto 🚗", it:"auto 🚗" };
              return (
                <div style={{ maxWidth: 540, margin: "0 auto", animation: "fadeIn 0.4s both" }}>
                  {/* Guardian Brief header */}
                  <div style={{ fontSize: 11, color: "#4ade80", marginBottom: 12, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: B }}>
                    🛡️ {lang === "de" || lang === "at" ? "GUARDIAN BRIEF — REISEPRÜFUNG" : lang === "en" ? "GUARDIAN BRIEF — PRE-TRIP CHECK" : lang === "it" ? "GUARDIAN BRIEF — CONTROLLO VIAGGIO" : "GUARDIAN BRIEF — PROVJERA PUTOVANJA"}
                  </div>
                  {/* Guardian active status strip */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "5px 12px", borderRadius: 8, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block", animation: "pulse 2s infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: 1, fontFamily: B }}>
                        {lang === "de" || lang === "at" ? "GUARDIAN AKTIV" : lang === "en" ? "GUARDIAN ACTIVE" : lang === "it" ? "GUARDIAN ATTIVO" : "GUARDIAN AKTIVAN"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {[
                        { src: "HAK", active: true },
                        { src: lang === "de" || lang === "at" ? "Wetter" : lang === "en" ? "Meteo" : lang === "it" ? "Meteo" : "Meteo", active: !!gb.weather },
                        { src: lang === "de" || lang === "at" ? "Sat" : "Sat", active: !!gb.satData },
                        { src: "Live", active: !!(gb.senseCards?.length) },
                      ].map((s, i) => (
                        <span key={i} style={{ fontSize: 9, color: s.active ? "#4ade80" : "#374151", fontFamily: B, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.active ? "#22c55e" : "#374151", display: "inline-block", flexShrink: 0 }} />
                          {s.src}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Brief card */}
                  <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(34,197,94,0.2)", background: "rgba(10,22,40,0.8)" }}>
                    {/* Route / Arrival header */}
                    <div style={{ padding: "16px 18px", background: gb.isArrival ? "rgba(6,182,212,0.08)" : "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        {gb.isArrival ? (
                          <>
                            <div style={{ fontSize: 10, color: "#06b6d4", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
                              {lang === "de" || lang === "at" ? "ANKUNFT" : lang === "en" ? "ARRIVAL" : lang === "it" ? "ARRIVO" : "DOLAZAK"}
                            </div>
                            <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: "#f0f4f8" }}>{toLPCity}</div>
                            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{tlang(modeLabel)}</div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: "#f0f4f8", marginBottom: 4 }}>{depCity} → {toLPCity}</div>
                            <div style={{ fontSize: 13, color: "#64748b" }}>{tlang(modeLabel)}</div>
                          </>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {gb.weather && <div style={{ fontSize: 20 }}>{gb.weather.icon} <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{gb.weather.temp}°C</span></div>}
                        {gb.distKm && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>≈{gb.distKm}km · ~{gb.etaH}h{gb.etaMin > 0 ? `${gb.etaMin}m` : ""}</div>}
                      </div>
                    </div>
                    {/* Jadran Sense section */}
                    {((gb.senseCards && gb.senseCards.length > 0) || gb.satData) && (
                      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10, fontFamily: B }}>
                          📡 JADRAN SENSE — LIVE INTELLIGENCE
                        </div>
                        {gb.satData && (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, padding: "8px 10px", borderRadius: 10, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>🛰️</span>
                            <div style={{ fontSize: 12, color: "#c4b5fd", lineHeight: 1.5 }}>
                              <strong style={{ color: "#ddd6fe" }}>
                                {lang === "de" || lang === "at" ? "Satellit" : lang === "en" ? "Satellite" : lang === "it" ? "Satellite" : "Satellit"}
                              </strong>
                              {" — "}
                              {gb.satData.zones && gb.satData.zones.length > 0
                                ? gb.satData.zones.slice(0, 2).map((z, zi) => (
                                    <span key={zi}>{z.name}: <strong style={{ color: z.occupancy > 80 ? "#f87171" : z.occupancy > 50 ? "#fb923c" : "#4ade80" }}>{z.occupancy}% {lang === "de" || lang === "at" ? "belegt" : lang === "en" ? "occupied" : lang === "it" ? "occupato" : "popunjeno"}</strong>{zi < Math.min(gb.satData.zones.length, 2) - 1 ? " · " : ""}</span>
                                  ))
                                : (lang === "de" || lang === "at" ? `${gb.satData.zoneCount} Campingzonen erkannt` : lang === "en" ? `${gb.satData.zoneCount} camp zones detected` : lang === "it" ? `${gb.satData.zoneCount} zone rilevate` : `${gb.satData.zoneCount} zona detektirano`)}
                            </div>
                          </div>
                        )}
                        {gb.senseCards && gb.senseCards.slice(0, 4).map((card, ci) => {
                          const sevColor = { critical: "#f87171", warning: "#fb923c", info: "#38bdf8", tip: "#4ade80" }[card.severity] || "#94a3b8";
                          const sevBg = { critical: "rgba(248,113,113,0.07)", warning: "rgba(251,146,60,0.07)", info: "rgba(56,189,248,0.07)", tip: "rgba(74,222,128,0.07)" }[card.severity] || "rgba(255,255,255,0.03)";
                          const sevBorder = { critical: "rgba(248,113,113,0.2)", warning: "rgba(251,146,60,0.2)", info: "rgba(56,189,248,0.2)", tip: "rgba(74,222,128,0.2)" }[card.severity] || "rgba(255,255,255,0.06)";
                          return (
                            <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: ci < gb.senseCards.slice(0,4).length - 1 ? 6 : 0, padding: "8px 10px", borderRadius: 10, background: sevBg, border: `1px solid ${sevBorder}` }}>
                              <span style={{ fontSize: 15, flexShrink: 0 }}>{card.icon || "📍"}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: sevColor }}>{card.title}</div>
                                {card.body && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 1.4 }}>{card.body}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Status row */}
                    <div style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#4ade80" }}>{lang === "de" || lang === "at" ? "Guardian bereit — überwacht jede Phase deiner Reise" : lang === "en" ? "Guardian ready — monitoring every phase of your journey" : lang === "it" ? "Guardian pronto — monitora ogni fase del viaggio" : "Guardian spreman — prati svaku fazu tvog putovanja"}</span>
                    </div>
                  </div>
                  {/* Partner offers — outside card, always visible */}
                  {gb.offers && gb.offers.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10, fontFamily: B }}>
                        ⭐ {lang === "de" || lang === "at" ? "AKTIVITÄTEN IN DER DESTINATION" : lang === "en" ? "ACTIVITIES AT YOUR DESTINATION" : lang === "it" ? "ATTIVITÀ ALLA DESTINAZIONE" : "AKTIVNOSTI NA DESTINACIJI"}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {gb.offers.map((offer, i) => (
                          <a key={i} href={offer.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{offer.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tlang(offer.title)}</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{tlang(offer.sub)}</div>
                            </div>
                            <div style={{ flexShrink: 0, fontSize: 14, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "5px 12px", borderRadius: 8, whiteSpace: "nowrap" }}>{offer.price} →</div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Launch CTA */}
                  <button onClick={() => { window.location.href = gb.transitUrl; }} style={{ width: "100%", marginTop: 14, padding: "16px 20px", borderRadius: 14, background: gb.isArrival ? "linear-gradient(135deg, #06b6d4, #0284c7)" : "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: F, letterSpacing: 0.5, boxShadow: gb.isArrival ? "0 4px 24px rgba(6,182,212,0.3)" : "0 4px 24px rgba(34,197,94,0.3)" }}>
                    {gb.isArrival
                      ? (lang === "de" || lang === "at" ? "🛡️ Ankunft — Guardian führt mich →" : lang === "en" ? "🛡️ Arrival — Guardian guides me →" : lang === "it" ? "🛡️ Arrivo — il Guardian mi guida →" : "🛡️ Dolazak — Guardian me vodi →")
                      : (lang === "de" || lang === "at" ? "🛡️ Auf geht's — Guardian begleitet mich →" : lang === "en" ? "🛡️ Let's go — Guardian is with me →" : lang === "it" ? "🛡️ Partiamo — il Guardian mi accompagna →" : "🛡️ Krenimo — Guardian me prati →")}
                  </button>
                  <button onClick={() => setGuardianBrief(null)} style={{ width: "100%", marginTop: 8, padding: "10px", background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontFamily: B }}>
                    {lang === "de" || lang === "at" ? "← Route ändern" : lang === "en" ? "← Change route" : lang === "it" ? "← Cambia percorso" : "← Promijeni rutu"}
                  </button>
                  <div style={{ marginTop: 10, fontSize: 11, color: "#334155" }}>{tx("freeInfo")}</div>
                </div>
              );
            }

            return (
              <div style={{ maxWidth: 540, margin: "0 auto" }}>
                <div style={{ fontSize: 11, color: gPhase >= 2 ? "#4ade80" : "#64748b", marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: B, transition: "color 0.3s" }}>
                  {tlang(stepLabels[Math.min(gPhase, 2)])}
                </div>
                {/* Guardian phase progress — dynamic */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, justifyContent: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
                        background: i < gPhase ? "rgba(34,197,94,0.18)" : i === gPhase ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${i < gPhase ? "rgba(34,197,94,0.4)" : i === gPhase ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: i < gPhase ? "#4ade80" : i === gPhase ? "#38bdf8" : "#334155",
                        transition: "all 0.3s",
                      }}>
                        {i < gPhase ? "✓" : i + 1}
                      </div>
                      {i < 2 && <div style={{ width: 28, height: 1, background: i < gPhase ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)", transition: "all 0.3s" }} />}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 14, lineHeight: 1.5 }}>
                  {lang === "de" || lang === "at" ? "Guardian übernimmt die Kontrolle. Wählen Sie Ihre Reiseart — wir passen alles an." : lang === "en" ? "Guardian takes over. Choose how you travel — we adapt everything." : lang === "it" ? "Il Guardian interviene. Scegli come viaggi — ci adattiamo." : "Guardian preuzima kontrolu. Odaberite način putovanja — prilagođavamo se."}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {tiles.map(({ id, img, accent, border }) => {
                    const active = selectedMode === id;
                    return (
                      <button key={id} onClick={() => {
                        setSelectedMode(id);
                        setRouteStep(id === "odmor" ? "room" : "city");
                        setRouteData(null);
                        try { localStorage.setItem("jadran_transport", id); } catch {}
                        const seg = TILE_TO_SEGMENT[id];
                        if (seg) saveDelta({ segment: seg, transport: id });
                      }} style={{
                        borderRadius: 16, textDecoration: "none", position: "relative", overflow: "hidden",
                        border: `1px solid ${active ? border.replace("0.2", "0.6") : border}`,
                        transition: "all 0.3s", display: "block", minHeight: 90, cursor: "pointer",
                        background: "transparent", padding: 0,
                        boxShadow: active ? `0 0 0 2px ${border.replace("0.2", "0.4")}, 0 8px 32px rgba(0,0,0,0.3)` : "none",
                        transform: active ? "scale(1.02)" : "scale(1)",
                      }}>
                        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${accent} 0%, rgba(15,23,42,0.88) 100%)` }} />
                        <div style={{ position: "relative", padding: "16px 14px", textAlign: "left" }}>
                          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{tlang(TRANSPORT_LABELS)[id]}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 4, lineHeight: 1.4 }}>{tlang(TRANSPORT_SUBS)[id]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Room code panel */}
                {routeStep === "room" && (
                  <div style={{ marginTop: 14, padding: "18px 20px", borderRadius: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", animation: "fadeIn 0.3s both" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={roomInput} onChange={e => setRoomInput(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && goRoom()}
                        placeholder={tlang({ hr: "Kod sobe (npr. MDB2F)", de: "Zimmercode (z.B. MDB2F)", en: "Room code (e.g. MDB2F)", it: "Codice camera (es. MDB2F)" })}
                        style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#f0f4f8", fontSize: 14, outline: "none", fontFamily: B, letterSpacing: 1 }} />
                      <button onClick={goRoom} style={{ padding: "12px 18px", borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: B, whiteSpace: "nowrap" }}>
                        {tx("roomOpen")} →
                      </button>
                    </div>
                  </div>
                )}

                {/* Route inputs — shown after transport tile click */}
                {(routeStep === "city" || routeStep === "map") && (() => {
                  const isArrivalMode = selectedMode === "avion";
                  const canActivate = isArrivalMode ? !!toLPCity.trim() : (!!depCity.trim() && !!toLPCity.trim());
                  return (
                    <div style={{ marginTop: 14, padding: "16px 14px", borderRadius: 16, background: isArrivalMode ? "rgba(6,182,212,0.06)" : "rgba(14,165,233,0.06)", border: `1px solid ${isArrivalMode ? "rgba(6,182,212,0.2)" : "rgba(14,165,233,0.15)"}`, animation: "fadeIn 0.3s both" }}>
                      {isArrivalMode && (
                        <div style={{ fontSize: 11, color: "#06b6d4", marginBottom: 10, letterSpacing: 0.5 }}>
                          {lang === "de" || lang === "at" ? "✈️ Ankunftsbriefing — kein Fahrtweg nötig" : lang === "en" ? "✈️ Arrival briefing — no driving route needed" : lang === "it" ? "✈️ Briefing di arrivo — nessun percorso" : "✈️ Dolazni brief — ruta nije potrebna"}
                        </div>
                      )}
                      {/* FROM — only for driving modes */}
                      {!isArrivalMode && (<>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{tx("fromLabel")}</div>
                        <div style={{ position: "relative", marginBottom: 12 }}>
                          <input ref={fromInputRef} value={depCity}
                            onChange={e => { setDepCity(e.target.value); hereSuggest(e.target.value, setFromLPSugs, fromTimerRef); if (fromInputRef.current) setFromRect(fromInputRef.current.getBoundingClientRect()); }}
                            onFocus={() => { setRouteInputFocused(true); if (fromInputRef.current) setFromRect(fromInputRef.current.getBoundingClientRect()); }}
                            onBlur={() => { setTimeout(() => setFromLPSugs([]), 150); setTimeout(() => setRouteInputFocused(false), 300); }}
                            placeholder={tx("fromPlaceholder")}
                            inputMode="text" autoCorrect="off" autoCapitalize="words" spellCheck={false} autoComplete="off"
                            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${depCity ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.04)", color: "#f0f4f8", fontSize: 16, outline: "none", fontFamily: B, boxSizing: "border-box" }} />
                          {fromLPSugs.length > 0 && fromRect && (
                            <div style={{ position: "fixed", top: fromRect.bottom + 4, left: fromRect.left, width: fromRect.width, background: "#0c1e35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, zIndex: 9999, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                              {fromLPSugs.map(c => <div key={c.title} onMouseDown={e => { e.preventDefault(); setDepCity(c.title); setDepCoords({lat: c.lat, lng: c.lng}); setFromLPSugs([]); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.title}</div>)}
                            </div>
                          )}
                        </div>
                      </>)}
                      {/* TO — always shown */}
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                        {isArrivalMode
                          ? (lang === "de" || lang === "at" ? "Destination" : lang === "en" ? "Destination" : lang === "it" ? "Destinazione" : "Destinacija")
                          : tx("toLabel")}
                      </div>
                      <div style={{ position: "relative", marginBottom: 16 }}>
                        <input ref={toInputRef} value={toLPCity}
                          onChange={e => { setToLPCity(e.target.value); hereSuggest(e.target.value, setToLPSugs, toTimerRef); if (toInputRef.current) setToRect(toInputRef.current.getBoundingClientRect()); }}
                          onFocus={() => { setRouteInputFocused(true); if (toInputRef.current) setToRect(toInputRef.current.getBoundingClientRect()); }}
                          onBlur={() => { setTimeout(() => setToLPSugs([]), 150); setTimeout(() => setRouteInputFocused(false), 300); }}
                          placeholder={isArrivalMode
                            ? (lang === "de" || lang === "at" ? "z.B. Dubrovnik, Split, Hvar…" : lang === "en" ? "e.g. Dubrovnik, Split, Hvar…" : lang === "it" ? "es. Dubrovnik, Split, Hvar…" : "npr. Dubrovnik, Split, Hvar…")
                            : tx("toPlaceholder")}
                          inputMode="text" autoCorrect="off" autoCapitalize="words" spellCheck={false} autoComplete="off"
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${toLPCity ? "rgba(249,115,22,0.4)" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.04)", color: "#f0f4f8", fontSize: 16, outline: "none", fontFamily: B, boxSizing: "border-box" }} />
                        {toLPSugs.length > 0 && toRect && (
                          <div style={{ position: "fixed", top: toRect.bottom + 4, left: toRect.left, width: toRect.width, background: "#0c1e35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, zIndex: 9999, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                            {toLPSugs.map(c => <div key={c.title} onMouseDown={e => { e.preventDefault(); setToLPCity(c.title); setToCoords({lat: c.lat, lng: c.lng}); setToLPSugs([]); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#e2e8f0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{c.title}</div>)}
                          </div>
                        )}
                      </div>
                      {/* CTA */}
                      <button
                        disabled={!canActivate || briefLoading}
                        onClick={launchGuardian}
                        style={{ width: "100%", padding: "14px 20px", borderRadius: 12, background: canActivate ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.06)", border: "none", color: canActivate ? "#fff" : "#475569", fontSize: 15, fontWeight: 700, cursor: canActivate ? "pointer" : "default", fontFamily: F, letterSpacing: 0.5, transition: "all 0.2s" }}>
                        {briefLoading
                          ? (lang === "de" || lang === "at" ? "Guardian prüft…" : lang === "en" ? "Guardian checking…" : lang === "it" ? "Guardian controlla…" : "Guardian provjerava…")
                          : canActivate
                            ? (lang === "de" || lang === "at" ? "🛡️ Guardian aktivieren →" : lang === "en" ? "🛡️ Activate Guardian →" : lang === "it" ? "🛡️ Attiva Guardian →" : "🛡️ Aktiviraj Guardian →")
                            : tx("ctaGo")}
                      </button>
                    </div>
                  );
                })()}

                <div style={{ marginTop: 14, fontSize: 11, color: "#334155" }}>{tx("freeInfo")}</div>
              </div>
            );
          })()}
        </div>
      </section>


      {/* ═══ LIVE DEMO ═══ */}
      <section style={{ padding: "48px 24px", background: "linear-gradient(180deg, #0a1628, #0e3a5c)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>{tx("demoLabel")}</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700 }}>{tx("demoTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, alignItems: "center" }}>
            {/* Phone mockup */}
            <div style={{ background: "linear-gradient(135deg, #0c2d48, #0e3a5c)", borderRadius: 28, padding: "14px 10px", maxWidth: 320, margin: "0 auto", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>J</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{tx("phoneName")}</div>
                <div style={{ fontSize: 8, color: "#22c55e", marginLeft: 2 }}>{"\u25CF"} online</div>
              </div>
              <div style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, padding: "0 4px" }}>
                {[{role:"user",text:tx("demoQ")},{role:"ai",text:tx("demoA")},{role:"cta",text:tx("demoCta")}].slice(0, chatStep).map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeSlide 0.5s both" }}>
                    {m.role === "cta" ? (
                      <div style={{ width: "88%", padding: "10px 12px", borderRadius: 12, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                        {"🍽️"} {m.text} {"\u2192"}
                      </div>
                    ) : (
                      <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: m.role === "user" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.05)", fontSize: 12, lineHeight: 1.5 }}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Right text */}
            <div>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>
                {tx("demoDesc")} <em>"{tx("demoQ")}"</em><br/><br/>
                {tx("demoStory")}
              </p>
              <a href="/explore" aria-label="Probaj besplatno" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: F }}>
                {tx("demoTry")} {"\u2192"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DESTINATIONS + AFFILIATE ═══ */}
      <section style={{ padding: "48px 24px", background: "#0a1628" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Destination cards with photos */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>{tx("destLabel2")}</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 700 }}>{tx("destTitle2")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 32 }}>
            {DESTINATIONS.map((d, i) => (
              <div key={i} style={{ textDecoration: "none", color: "inherit" }}>
                <a href={`/?kiosk=${d.city.toLowerCase()}&lang=${lang}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{
                    borderRadius: 18, overflow: "hidden", position: "relative",
                    background: "#0c2d48", border: "1px solid rgba(14,165,233,0.06)",
                    cursor: "pointer", transition: "all 0.3s", minHeight: 200,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.06)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                    {cityImgs[d.city] && <div style={{
                      position: "absolute", inset: 0,
                      backgroundImage: `url(${cityImgs[d.city]})`,
                      backgroundSize: "cover", backgroundPosition: "center",
                      transition: "transform 0.5s",
                    }} className="dest-img" />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(6,14,28,0.92) 0%, rgba(6,14,28,0.4) 50%, rgba(6,14,28,0.2) 100%)" }} />
                    <div style={{ position: "relative", padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 200 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: 8, background: "rgba(14,165,233,0.15)", alignSelf: "flex-start", marginBottom: 8 }}>{d.region}</span>
                      <div style={{ fontFamily: F, fontSize: 19, fontWeight: 700, marginBottom: 3, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>{d.desc[lang] || d.desc.de || d.desc.en}</div>
                      <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 700 }}>
                        {lang === "de" || lang === "at" ? "AI Guide öffnen →" : lang === "en" ? "Open AI Guide →" : lang === "it" ? "Apri AI Guide →" : "Otvori AI vodič →"}
                      </div>
                    </div>
                  </div>
                </a>
                <a href={d.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", marginTop: 6, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", textAlign: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: B }}>
                    {lang === "de" || lang === "at" ? "Unterkunft suchen" : lang === "en" ? "Find accommodation" : lang === "it" ? "Cerca alloggio" : "Traži smještaj"} · Booking.com
                  </span>
                </a>
              </div>
            ))}
          </div>

          {/* Affiliate carousel */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>🔥 {tx("trendLabel2")}</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700 }}>{tx("trendSub2")}</h2>
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory" }}>
            {TRENDING.map((t, i) => (
              <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", scrollSnapAlign: "start" }}>
                <div style={{ minWidth: 260, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", transition: "all 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = ""; }}>
                  <div style={{ height: 100, background: "linear-gradient(135deg, #0c2d48, #134e6f)", position: "relative", overflow: "hidden", display: "grid", placeItems: "center" }}>
                    {trendImgs[t.tag] && <img src={trendImgs[t.tag]} alt={t.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />}
                    <span style={{ position: "relative", fontSize: 32 }}>{t.emoji}</span>
                    <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(14,165,233,0.15)", color: "#38bdf8", fontSize: 9, fontWeight: 600, letterSpacing: 1 }}>{t.tag}</span>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.title[lang] || t.title.de || t.title.en}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{t.sub[lang] || t.sub.de || t.sub.en}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>{t.price}</span>
                      <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(14,165,233,0.08)", color: "#38bdf8", fontSize: 11, fontWeight: 600 }}>{tx("trendBook2")}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ B2B ═══ */}
      <section style={{ padding: "48px 24px", background: "linear-gradient(180deg, #0e3a5c, #0a1628)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: F, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, color: "#facc15", marginBottom: 14 }}>{tx("b2bTitle")}</h2>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28 }}>{tx("b2bDesc")}</p>
          <a href="/partner" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#0a1628", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: F }}>
            {tx("b2bBtn")} {"\u2192"}
          </a>
          <div style={{ marginTop: 32, display: "inline-flex", gap: 6, alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <input value={roomInput} onChange={e => setRoomInput(e.target.value)} onKeyDown={e => e.key === "Enter" && goRoom()}
              placeholder={tx("roomCode")} style={{ width: 100, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#94a3b8", fontSize: 13, outline: "none", fontFamily: B }} />
            {roomInput && <button onClick={goRoom} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(14,165,233,0.08)", border: "none", color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{tx("roomOpen")} {"\u2192"}</button>}
          </div>
        </div>
      </section>

      {/* ═══ NAŠI PARTNERI ═══ */}
      <section style={{ padding: "40px 24px", background: "#080e1a" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 5, fontWeight: 600, textAlign: "center", marginBottom: 20 }}>
            {lang === "de" || lang === "at" ? "UNSERE PARTNER" : lang === "en" ? "OUR PARTNERS" : lang === "it" ? "I NOSTRI PARTNER" : "NAŠI PARTNERI"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", alignItems: "center" }}>
            {/* Air Serbia — affiliate with official banner */}
            <a href="https://www.kqzyfj.com/click-101704203-13957399" target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 16px", borderRadius: 14,
                background: "rgba(200,16,46,0.06)", border: "1px solid rgba(200,16,46,0.2)",
                transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,16,46,0.45)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(200,16,46,0.2)"}>
              <img src="https://www.ftjcfx.com/image-101704203-13957399" width="44" height="44" alt="Air Serbia" style={{ borderRadius: 10, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>Air Serbia</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {lang === "de" || lang === "at" ? "Direktflug → Brač" : lang === "en" ? "Direct flight → Brač" : lang === "it" ? "Volo diretto → Brač" : "Direktni let → Brač"}
                </div>
              </div>
            </a>
            {/* Booking.com */}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(0,115,230,0.05)", border: "1px solid rgba(0,115,230,0.15)" }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#0073E6", fontFamily: "'Outfit',sans-serif" }}>B.</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>Booking.com</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {lang === "de" || lang === "at" ? "Unterkunft" : lang === "en" ? "Accommodation" : lang === "it" ? "Alloggi" : "Smještaj"}
                </div>
              </div>
            </div>
            {/* GetYourGuide */}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(255,87,34,0.05)", border: "1px solid rgba(255,87,34,0.15)" }}>
              <span style={{ fontSize: 16 }}>🎟️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>GetYourGuide</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  {lang === "de" || lang === "at" ? "Ausflüge & Touren" : lang === "en" ? "Tours & Activities" : lang === "it" ? "Tour e attività" : "Izleti i ture"}
                </div>
              </div>
            </div>
            {/* HERE Maps */}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 12,
              background: "rgba(0,175,170,0.05)", border: "1px solid rgba(0,175,170,0.15)" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#00AFAA" }}>HERE</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>HERE Maps</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>BMW Group · Navigation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 24px", paddingBottom: gdprVisible ? "calc(32px + 52px + 52px)" : "calc(32px + 52px)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.03)", background: "#080e1a" }}>
        {/* Anthropic Claude badge */}
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-label="Anthropic"><path d="M14.25 2h-4.5L3 22h4.5l1.5-4.5h6l1.5 4.5H21L14.25 2zm-5.5 12 3.25-9.5 3.25 9.5H8.75z" fill="#D97706"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#D97706", fontFamily: "'Outfit',system-ui,sans-serif", letterSpacing: 0.4 }}>Claude</span>
          <span style={{ fontSize: 11, color: "#475569", fontFamily: "'Outfit',system-ui,sans-serif" }}>by Anthropic · AI engine</span>
        </div>
        {/* Payment trust — minimal */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569" }}>🛡️</span>
          <span style={{ fontSize: 11, color: "#475569" }}>Secure payments by</span>
          <span style={{ color: "#635BFF", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',system-ui,sans-serif" }}>stripe</span>
        </div>
        <div style={{ fontSize: 11, color: "#1e293b" }}>JADRAN {"\u00B7"} SIAL Consulting d.o.o. {"\u00B7"} 2026</div>
        <div style={{ fontSize: 9, color: "#0f172a", marginTop: 6, letterSpacing: 0.5 }}>{"\u00A9"} 2026 SIAL Consulting d.o.o. All rights reserved.</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <a href="/blog" style={{ fontSize: 9, color: "#334155", textDecoration: "underline", textUnderlineOffset: 2 }}>Blog</a>
          <span onClick={() => setLegalPage("impressum")} style={{ fontSize: 9, color: "#1e293b", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Impressum</span>
          <span onClick={() => setLegalPage("privacy")} style={{ fontSize: 9, color: "#1e293b", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy</span>
        </div>
      </footer>

      {/* ═══ STICKY BUY BAR — PREMIUM DESIGN ═══ */}
      {(!routeInputFocused && !routeStep) && isPremium ? (
        <div style={{ position: "fixed", bottom: gdprVisible ? 52 : 0, left: 0, right: 0, zIndex: 99, paddingBottom: "env(safe-area-inset-bottom, 0px)", transition: "bottom 0.3s" }}>
          <div style={{ padding: "10px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", borderTop: "1px solid rgba(245,158,11,0.15)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "4px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>⭐ {premLabel} {premDays !== null ? premDays + "d" : ""}</span>
            <span style={{ color: "#475569", fontSize: 10 }}>JADRAN.AI PREMIUM</span>
          </div>
        </div>
      ) : (!routeInputFocused && !routeStep) ? (
        <div onClick={() => setShowPlanPicker(true)} style={{ position: "fixed", bottom: gdprVisible ? 52 : 0, left: 0, right: 0, zIndex: 99, cursor: "pointer", paddingBottom: "env(safe-area-inset-bottom, 0px)", transition: "bottom 0.3s" }}>
          <div style={{ position: "relative", overflow: "hidden", padding: "12px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", borderTop: "1px solid rgba(245,158,11,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}>
            {/* Shimmer accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "grid", placeItems: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}>⭐</div>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: F }}>{tx("stickyBuy") || "KUPI ODMAH"}</div>
                <div style={{ color: "#94a3b8", fontSize: 10 }}>{tx("sticky")}</div>
              </div>
            </div>
            <div style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", fontWeight: 800, fontSize: 14, fontFamily: F, boxShadow: "0 4px 16px rgba(245,158,11,0.3)", letterSpacing: 0.5 }}>
              {tx("sticky") || "Od 9.99€"} →
            </div>
          </div>
        </div>
      ) : null}

      {/* ═══ PLAN PICKER MODAL — Decoy Psychology ═══ */}
      {showPlanPicker && (
        <div onClick={() => setShowPlanPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(5,14,30,0.90)", display: "grid", placeItems: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", borderRadius: 24, padding: "28px 18px", maxWidth: 480, width: "100%", border: "1px solid rgba(245,158,11,0.15)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)", maxHeight: "90dvh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display',Georgia,serif", marginBottom: 6 }}>
                {lang === "de" || lang === "at" ? "Sichere deinen Urlaub" : lang === "en" ? "Secure your holiday" : lang === "it" ? "Proteggi la tua vacanza" : "Osiguraj svoj odmor"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                {lang === "de" || lang === "at" ? "Vermeide Strafen, Staus und Stürme bis Ende der Saison." : lang === "en" ? "Avoid fines, traffic jams and storms until end of season." : lang === "it" ? "Evita multe, code e tempeste fino a fine stagione." : "Izbjegni kazne, gužve i oluje do kraja sezone."}
              </div>
            </div>
            {/* ── 3-TIER DECOY CARDS ── */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "stretch" }}>
              {/* EXPLORER — anchor low */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("week", lang); }}
                style={{ flex: 1, padding: "14px 8px 12px", borderRadius: 16, border: "1px solid rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.04)", cursor: "pointer", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", opacity: 0.85 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.5)"; e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.opacity = "0.85"; }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#0ea5e9", letterSpacing: 1, marginBottom: 4 }}>EXPLORER</div>
                <div style={{ fontSize: 22, fontWeight: 300, color: "#0ea5e9" }}>9.99€</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>{lang === "de" || lang === "at" ? "pro Woche" : lang === "en" ? "per week" : lang === "it" ? "a settimana" : "tjedno"}</div>
                <div style={{ fontSize: 8, color: "#475569", marginBottom: 6, fontStyle: "italic" }}>{lang === "de" || lang === "at" ? "Nur Basisinformationen" : lang === "en" ? "Basic info only" : lang === "it" ? "Solo info base" : "Samo osnovne info"}</div>
                <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.9, textAlign: "left", flex: 1 }}>
                  ✅ {lang === "de" || lang === "at" ? "Chat mit AI" : lang === "en" ? "AI chat" : lang === "it" ? "Chat AI" : "AI chat"}<br/>
                  ✅ {lang === "de" || lang === "at" ? "Restaurants & Strände" : lang === "en" ? "Restaurants & beaches" : lang === "it" ? "Ristoranti e spiagge" : "Restorani i plaže"}<br/>
                  <span style={{ color: "rgba(239,68,68,0.5)" }}>❌ {lang === "de" || lang === "at" ? "Kein Sturmwarner" : lang === "en" ? "No storm alerts" : lang === "it" ? "No allerte" : "Bez upozorenja"}</span><br/>
                  <span style={{ color: "rgba(239,68,68,0.5)" }}>❌ {lang === "de" || lang === "at" ? "Kein Walkie-Talkie" : lang === "en" ? "No Walkie-Talkie" : lang === "it" ? "No Walkie-Talkie" : "Bez Walkie-Talkie"}</span><br/>
                  <span style={{ color: "rgba(239,68,68,0.5)" }}>❌ {lang === "de" || lang === "at" ? "Kein Jadran Lens" : lang === "en" ? "No Jadran Lens" : lang === "it" ? "No Jadran Lens" : "Bez Jadran Lens"}</span>
                </div>
              </div>
              {/* SEASON PASS — the golden goose */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("season", lang); }}
                style={{ flex: 1.3, padding: "16px 10px 14px", borderRadius: 18, border: "2px solid rgba(245,158,11,0.6)", background: "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.03) 100%)", cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden", transition: "all 0.2s", display: "flex", flexDirection: "column", transform: "scale(1.04)", boxShadow: "0 6px 24px rgba(245,158,11,0.2)", zIndex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.9)"; e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.2)"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "4px 0", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 2, textAlign: "center" }}>
                  ⭐ {lang === "de" || lang === "at" ? "AM BELIEBTESTEN" : lang === "en" ? "MOST POPULAR" : lang === "it" ? "PIÙ POPOLARE" : "NAJPOPULARNIJE"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", letterSpacing: 1, marginTop: 18, marginBottom: 4 }}>SEASON PASS</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b" }}>19.99€</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#f59e0b", marginBottom: 6 }}>{lang === "de" || lang === "at" ? "bis Oktober · alle Regionen" : lang === "en" ? "until October · all regions" : lang === "it" ? "fino a ottobre · tutte" : "do oktobra · sve regije"}</div>
                <div style={{ fontSize: 9, color: "#e2e8f0", lineHeight: 1.9, textAlign: "left", flex: 1, fontWeight: 500 }}>
                  ✅ {lang === "de" || lang === "at" ? "Alles aus Explorer" : lang === "en" ? "Everything in Explorer" : lang === "it" ? "Tutto da Explorer" : "Sve iz Explorera"}<br/>
                  🛡️ <strong style={{ color: "#f59e0b" }}>Travel Guardian</strong>: {lang === "de" || lang === "at" ? "Sturm · Feuer · Grenze" : lang === "en" ? "storms · fires · borders" : lang === "it" ? "tempeste · incendi" : "oluje · požari · granica"}<br/>
                  📸 <strong>Jadran Lens</strong>: {lang === "de" || lang === "at" ? "Strafen vermeiden" : lang === "en" ? "avoid €60 fines" : lang === "it" ? "evita multe €60" : "izbjegni kaznu 60€"}<br/>
                  🎙️ <strong>Walkie-Talkie</strong>: {lang === "de" || lang === "at" ? "Sicher nutzen beim Fahren" : lang === "en" ? "use safely while driving" : lang === "it" ? "usa in sicurezza alla guida" : "bezbedno koristi u vožnji"}
                </div>
              </div>
              {/* VIP — price anchor decoy */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("vip", lang); }}
                style={{ flex: 1, padding: "14px 8px 12px", borderRadius: 16, border: "1px solid rgba(168,85,247,0.12)", background: "rgba(168,85,247,0.03)", cursor: "pointer", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", opacity: 0.75 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.35)"; e.currentTarget.style.opacity = "0.95"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.12)"; e.currentTarget.style.opacity = "0.75"; }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", letterSpacing: 1, marginBottom: 4 }}>VIP PRIORITY</div>
                <div style={{ fontSize: 22, fontWeight: 300, color: "#a855f7" }}>49.99€</div>
                <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>{lang === "de" || lang === "at" ? "bis Oktober · Priorität" : lang === "en" ? "until October · priority" : lang === "it" ? "fino a ottobre · priorità" : "do oktobra · prioritet"}</div>
                <div style={{ fontSize: 9, color: "#64748b", lineHeight: 1.9, textAlign: "left", flex: 1 }}>
                  ✅ {lang === "de" || lang === "at" ? "Alles aus Season" : lang === "en" ? "Everything in Season" : lang === "it" ? "Tutto da Season" : "Sve iz Season Passa"}<br/>
                  ⚡ {lang === "de" || lang === "at" ? "300 Nachrichten/Tag" : lang === "en" ? "300 messages/day" : lang === "it" ? "300 msg/giorno" : "300 poruka/dan"}<br/>
                  🏆 {lang === "de" || lang === "at" ? "Detailliertere Tipps" : lang === "en" ? "More detailed tips" : lang === "it" ? "Consigli dettagliati" : "Detaljniji savjeti"}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#64748b" }}>
              🔒 {lang === "en" ? "Secure payment via Stripe · No hidden fees" : lang === "de" || lang === "at" ? "Sichere Zahlung über Stripe · Keine versteckten Kosten" : lang === "it" ? "Pagamento sicuro via Stripe · Nessun costo nascosto" : "Sigurno plaćanje putem Stripe · Bez skrivenih troškova"}
            </div>

            {/* ── ALREADY PAID RECOVERY ── */}
            <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textAlign: "center" }}>
                {lang === "de" || lang === "at" ? "Bereits bezahlt?" : lang === "en" ? "Already paid?" : lang === "it" ? "Già pagato?" : "Već plaćeno?"}
              </div>
              {recoverStatus === "ok" ? (
                <div style={{ textAlign: "center", color: "#4ade80", fontSize: 13, fontWeight: 700 }}>
                  ✓ {lang === "de" || lang === "at" ? "Zugang wiederhergestellt!" : lang === "en" ? "Access restored!" : lang === "it" ? "Accesso ripristinato!" : "Pristup obnovljen!"}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="email"
                    value={recoverEmail}
                    onChange={e => setRecoverEmail(e.target.value)}
                    placeholder={lang === "de" || lang === "at" ? "E-Mail der Zahlung" : lang === "en" ? "Payment email" : lang === "it" ? "Email pagamento" : "Email s kojim ste platili"}
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${recoverStatus === "fail" ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit" }}
                  />
                  <button
                    disabled={recoverStatus === "loading" || !recoverEmail.includes("@")}
                    onClick={async () => {
                      setRecoverStatus("loading");
                      try {
                        let deviceId;
                        try { deviceId = localStorage.getItem("jadran_device_id"); if (!deviceId) { const b = new Uint8Array(9); crypto.getRandomValues(b); deviceId = "jd_" + Array.from(b, x => x.toString(16).padStart(2,"0")).join(""); localStorage.setItem("jadran_device_id", deviceId); } } catch { deviceId = "unknown"; }
                        const r = await fetch("/api/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recoverEmail.trim().toLowerCase(), deviceId }) });
                        if (r.ok) {
                          const d = await r.json();
                          if (d.recovered) { localStorage.setItem("jadran_ai_premium", "1"); setRecoverStatus("ok"); setTimeout(() => { window.location.href = "/ai"; }, 1500); }
                          else setRecoverStatus("fail");
                        } else setRecoverStatus("fail");
                      } catch { setRecoverStatus("fail"); }
                    }}
                    style={{ padding: "9px 14px", borderRadius: 8, background: recoverStatus === "loading" ? "rgba(255,255,255,0.06)" : "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
                    {recoverStatus === "loading" ? "…" : lang === "de" || lang === "at" ? "Wiederherstellen" : lang === "en" ? "Restore" : lang === "it" ? "Ripristina" : "Obnovi"}
                  </button>
                </div>
              )}
              {recoverStatus === "fail" && (
                <div style={{ fontSize: 11, color: "#f87171", marginTop: 6, textAlign: "center" }}>
                  {lang === "de" || lang === "at" ? "Kein Kauf gefunden. E-Mail prüfen oder Support kontaktieren." : lang === "en" ? "No purchase found. Check email or contact support." : lang === "it" ? "Nessun acquisto trovato. Controlla email o contatta supporto." : "Plaćanje nije pronađeno. Provjeri email ili kontaktiraj podršku."}
                </div>
              )}
            </div>

            <div onClick={() => { setShowPlanPicker(false); setRecoverStatus(null); setRecoverEmail(""); }} style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#475569", cursor: "pointer" }}>
              {lang === "en" ? "Maybe later" : lang === "de" || lang === "at" ? "Vielleicht später" : lang === "it" ? "Forse dopo" : "Možda kasnije"}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEGAL OVERLAY ═══ */}
      {legalPage && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,14,30,0.95)", overflowY: "auto", WebkitOverflowScrolling: "touch" }} onClick={() => setLegalPage(null)}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 100px", color: "#e2e8f0", fontFamily: B, fontSize: 13, lineHeight: 1.8 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLegalPage(null)} style={{ position: "fixed", top: 16, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 10000 }}>×</button>
            {legalPage === "impressum" ? (<>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>RECHTLICHES</div>
              <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#fff" }}>Impressum</h2>
              <p><strong>Angaben gemäß § 5 ECG (Österreich) / § 5 TMG (Deutschland):</strong></p>
              <p style={{ margin: "16px 0" }}>
                <strong>SIAL Consulting d.o.o.</strong><br/>
                Bizeljska cesta 5<br/>
                8250 Brežice<br/>
                Slovenija / Slowenien
              </p>
              <p><strong>Identifikationsnummer:</strong> SI97117765</p>
              <p><strong>Verantwortlich:</strong> Miroslav Paunov</p>
              <p style={{ margin: "16px 0" }}>
                <strong>Kontakt:</strong><br/>
                E-Mail: info@sialconsulting.com<br/>
                Telefon: +386 40 564 940
              </p>
              <p style={{ margin: "16px 0" }}>
                <strong>Umsatzsteuer-Identifikationsnummer:</strong> SI97117765<br/>
                <strong>Handelsregister:</strong> Okrožno sodišče v Krškem, Slovenija
              </p>
              <p style={{ color: "#64748b", marginTop: 24, fontSize: 11 }}>
                Plattform der EU-Kommission zur Online-Streitbeilegung:<br/>
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>https://ec.europa.eu/consumers/odr</a>
              </p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 16 }}>
                <strong>Haftungshinweis:</strong> Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Die auf dieser Plattform bereitgestellten Informationen und Empfehlungen dienen ausschließlich zu Informationszwecken und stellen keine rechtsverbindliche Beratung dar.
              </p>
            </>) : (<>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>RECHTLICHES</div>
              <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#fff" }}>Datenschutzerklärung</h2>
              <p><strong>Verantwortlicher:</strong><br/>SIAL Consulting d.o.o., Bizeljska cesta 5, 8250 Brežice, Slovenija<br/>E-Mail: info@sialconsulting.com</p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>1. Erhobene Daten</h3>
              <p>Wir erheben so wenig Daten wie möglich:</p>
              <p style={{ margin: "8px 0" }}>
                <strong>Automatisch:</strong> Anonymisierte Seitenaufrufe über Plausible Analytics (cookielos, DSGVO-konform, keine personenbezogenen Daten, keine Cookies, kein Tracking über Websites hinweg). Server-Logs (IP-Adresse, Browser-Typ) werden nicht gespeichert.
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Bei Nutzung des AI-Guides:</strong> Ihre Chat-Nachrichten werden an den AI-Dienst (Anthropic Claude / Google Gemini) zur Verarbeitung gesendet. Nachrichten werden nicht dauerhaft gespeichert. Nutzungspräferenzen (Sprache, Region, Reiseart) werden lokal in Ihrem Browser gespeichert (localStorage) und nie an unsere Server übertragen.
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Bei Zahlung:</strong> Zahlungen werden über Stripe Inc. abgewickelt. Wir erhalten Ihre E-Mail-Adresse für die Kaufbestätigung. Kreditkartendaten werden ausschließlich von Stripe verarbeitet und nie auf unseren Servern gespeichert. Stripe Datenschutz: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>stripe.com/privacy</a>
              </p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>2. Cookies</h3>
              <p>Diese Website verwendet <strong>keine Cookies</strong>. Weder eigene noch von Drittanbietern. Alle Nutzerdaten werden ausschließlich im localStorage Ihres Browsers gespeichert und verlassen Ihr Gerät nicht.</p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>3. Ihre Rechte (DSGVO Art. 15-21)</h3>
              <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Da wir keine personenbezogenen Daten auf unseren Servern speichern, können Sie Ihre lokalen Daten jederzeit selbst löschen, indem Sie den Browser-Cache leeren.</p>
              <p style={{ margin: "8px 0" }}>Für Anfragen: <a href="mailto:info@sialconsulting.com" style={{ color: "#0ea5e9" }}>info@sialconsulting.com</a></p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>4. Drittanbieter</h3>
              <p style={{ margin: "8px 0" }}><strong>Plausible Analytics</strong> — cookielose, DSGVO-konforme Webanalyse. Keine personenbezogenen Daten. <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Stripe</strong> — Zahlungsabwicklung. PCI DSS Level 1 zertifiziert. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Anthropic (Claude AI)</strong> — AI-Chatverarbeitung. Nachrichten werden nicht für Training verwendet. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Sentry</strong> — Fehlerbericht-Dienst. Erfasst technische Fehler (keine Chatinhalte). <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>5. Kontakt & Aufsichtsbehörde</h3>
              <p>Bei Fragen: info@sialconsulting.com</p>
              <p style={{ margin: "8px 0", color: "#64748b", fontSize: 11 }}>Zuständige Aufsichtsbehörde: Informacijski pooblaščenec Republike Slovenije, Dunajska cesta 22, 1000 Ljubljana, Slovenija. <a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>www.ip-rs.si</a></p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>Stand: März 2026</p>
            </>)}
          </div>
        </div>
      )}

      {/* ═══ GDPR CONSENT BANNER ═══ */}
      {gdprVisible && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, background:"rgba(8,14,26,0.97)", borderTop:"1px solid rgba(14,165,233,0.12)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", padding:"14px 20px", paddingBottom:"calc(14px + env(safe-area-inset-bottom, 0px))", display:"flex", flexWrap:"wrap", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, minWidth:200, fontSize:11, color:"#64748b", lineHeight:1.5, fontFamily:"'Outfit',sans-serif" }}>
            {lang === "de" || lang === "at"
              ? "Wir verwenden Cookies für Zahlungsabwicklung und anonyme Nutzungsanalyse (Plausible, cookielos). Keine Werbung."
              : lang === "it"
              ? "Utilizziamo cookie per pagamenti e analisi anonima (Plausible, senza cookie). Nessuna pubblicità."
              : lang === "hr"
              ? "Koristimo kolačiće za plaćanje i anonimnu analitiku (Plausible, bez kolačića). Bez oglašavanja."
              : "We use cookies for payments and anonymous analytics (Plausible, cookieless). No ads."}
            {" "}<span onClick={() => setLegalPage?.("privacy")} style={{ color:"#0ea5e9", cursor:"pointer", textDecoration:"underline" }}>Privacy</span>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={() => { try { localStorage.setItem("jadran_consent","1"); setGdprVisible(false); } catch {} }}
              style={{ padding:"8px 18px", borderRadius:20, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", border:"none", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", minHeight:36 }}>
              {lang === "de" || lang === "at" ? "Akzeptieren" : lang === "it" ? "Accetta" : lang === "hr" ? "Prihvati" : "Accept"}
            </button>
            <button onClick={() => { try { localStorage.setItem("jadran_consent","minimal"); setGdprVisible(false); } catch {} }}
              style={{ padding:"8px 14px", borderRadius:20, background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#475569", fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", minHeight:36 }}>
              {lang === "de" || lang === "at" ? "Ablehnen" : lang === "it" ? "Rifiuta" : lang === "hr" ? "Odbij" : "Decline"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(14,165,233,0.3); }
        html { scroll-behavior: smooth; }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1e293b; color: #f0f4f8; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 2px; }
        .dest-img { transition: transform 0.5s ease !important; }
        a:hover .dest-img { transform: scale(1.08) !important; }
      `}</style>
    </div>
  );
}
