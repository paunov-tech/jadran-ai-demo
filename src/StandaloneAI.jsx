// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Standalone AI Assistant
// Route: jadran.ai/ai
// Explorer 9.99€ | Season 19.99€ | VIP 49.99€ — 3 free messages trial
// Perfect for: campervan travelers, day-trippers, cruise visitors
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { EXPERIENCES, GEMS, BOOKING_CITIES, CAMPER_WARNINGS, ISTRA_CAMPER_INTEL, DEEP_LOCAL, DUBROVNIK_INTEL, MARINAS, ANCHORAGES, CRUISE_PORTS, filterByRegion } from "./data.js";
import { loadDelta } from "./deltaContext.js";


// ── DEVICE FINGERPRINT (survives incognito/private browsing) ──
// Generates a stable hash from browser characteristics that don't change in private mode
// Canvas rendering, screen geometry, timezone, language, hardware — all persist
async function getDeviceFingerprint() {
  try {
    const components = [];
    // Canvas fingerprint — GPU renders text uniquely per device
    try {
      const c = document.createElement("canvas");
      c.width = 200; c.height = 50;
      const ctx = c.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(100, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Jadran.ai \uD83C\uDF0A", 2, 15);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("Jadran.ai \uD83C\uDF0A", 4, 17);
      components.push(c.toDataURL());
    } catch { components.push("no-canvas"); }
    // Screen geometry
    components.push(screen.width + "x" + screen.height);
    components.push(String(window.devicePixelRatio || 1));
    components.push(screen.colorDepth || 24);
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
    components.push(String(new Date().getTimezoneOffset()));
    // Navigator
    components.push(navigator.language || "");
    components.push(navigator.platform || "");
    components.push(String(navigator.hardwareConcurrency || 0));
    components.push(String(navigator.maxTouchPoints || 0));
    // WebGL renderer (GPU-specific)
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (gl) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (dbg) components.push(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "");
      }
    } catch { components.push("no-webgl"); }
    // Hash it
    const raw = components.join("|");
    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "fp_" + hashArray.slice(0, 12).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null; // Fallback — can't fingerprint
  }
}

const REGIONS = [
  { id: "split", name: "Split & okolica", emoji: "🏛️", desc: "Dioklecijanova palača, Podstrana, Omiš" },
  { id: "makarska", name: "Makarska rivijera", emoji: "🏖️", desc: "Brela, Baška Voda, Tučepi" },
  { id: "dubrovnik", name: "Dubrovnik", emoji: "🏰", desc: "Stari grad, Elafiti, Cavtat" },
  { id: "zadar", name: "Zadar & Šibenik", emoji: "🌅", desc: "Morske orgulje, Krka, Kornati" },
  { id: "istra", name: "Istra", emoji: "🫒", desc: "Rovinj, Pula, Poreč, Motovun" },
  { id: "kvarner", name: "Kvarner", emoji: "⚓", desc: "Opatija, Krk, Cres, Lošinj" },
];

const TRAVEL_MODES = [
  { id: "apartment", emoji: "🏠", name: "Apartman/Hotel", desc: "Fiksni smještaj" },
  { id: "camper", emoji: "🚐", name: "Kamper / Autodom", desc: "Sloboda na kotačima" },
  { id: "sailing", emoji: "⛵", name: "Jedrilica / Brod", desc: "Nautički turizam" },
  { id: "cruiser", emoji: "🚢", name: "Kruzer", desc: "Lučki dan — maksimum u 8h" },
  { id: "daytrip", emoji: "🚗", name: "Dnevni izlet", desc: "Prolazim kroz" },
  { id: "cruise", emoji: "🚢", name: "Krstarenje", desc: "Kratko zaustavljanje" },
];

const LANGS = [
  { code: "hr", flag: "🇭🇷" }, { code: "de", flag: "🇩🇪" }, { code: "at", flag: "🇦🇹" },
  { code: "en", flag: "🇬🇧" }, { code: "it", flag: "🇮🇹" }, { code: "si", flag: "🇸🇮" },
  { code: "cz", flag: "🇨🇿" }, { code: "pl", flag: "🇵🇱" },
];

const T = {
  hr: { title: "Jadran Vodič", sub: "Lokalni savjeti za savršen odmor", start: "Započnite razgovor", send: "Pošalji", placeholder: "Pitajte me o Jadranu...", region: "Odaberite regiju", mode: "Kako putujete?", unlock: "Otključaj — od 9.99€", free3: "3 besplatna pitanja", remaining: "preostalo", upgraded: "Premium otključan!", back: "Natrag", typing: "razmišljam...",
    // Niche setup
    nicCamper: "Kamper vodič", nicCamperSub: "Parking, rute, dump station, upozorenja za kampere",
    nicLocal: "Lokalni vodič", nicLocalSub: "Apartman, hotel ili automobilom — plaže, konobe, skrivena mjesta",
    nicSailing: "Nautički vodič", nicSailingSub: "Marine, sidrišta, vjetar, konobe s mora",
    nicCruiser: "Kruzer vodič", nicCruiserSub: "Maksimum u 8 sati — plan po minutu, skip-the-line",
    // Camper picker
    gabariti: "GABARITI VOZILA", camperLength: "Dužina (m)", camperHeight: "Visina (m)", camperPlaceholderLen: "npr. 7.5", camperPlaceholderH: "npr. 3.2", lenLabel: "Dužina (m)", heightLabel: "Visina (m)",
    gabaritiFeedback: "Vaš kamper: {len}m × {h}m — prilagođavamo preporuke",
    gabaritiHint: "Opcionalno — ali pomaže za preciznije rute i parkinge",
    // Vibe
    vibeTitle: "Trenutno na Jadranu", vibeCamper: "Stanje na cesti i moru", vibeSailing: "Pomorske prilike",
    notifBtn: "Dozvoli obavijesti za vrijeme", notifOn: "Obavijesti aktivne", loading: "Učitavam podatke...",
    // Quick chips
    qParking: "Gdje parkirati kamper?", qDinner: "Večera s parkingom?", qFuel: "Benzinska / LPG?",
    qMarina: "Najbliža marina s vezom?", qSea: "Stanje mora i vjetar?", qKonoba: "Konoba dostupna s mora?",
    qPlan: "Plan dana za 8 sati?", qLunch: "Lokalni ručak bez turističke cijene?", qPhoto: "Fotogenična lokacija?",
    qBeach: "Najbolja plaža u blizini?", qFood: "Preporuka za ručak?", qVisit: "Što posjetiti danas?",
    // Buttons
    showOffers: "Aktivnosti, plaže, ponude", showBtn: "Prikaži ▼", hideBtn: "Sakrij ponude ▲",
    available: "dostupno", activities: "AKTIVNOSTI",
    btnOffer: "Pogledaj ponudu", btnTour: "Pogledaj turu", btnStay: "Pogledaj smještaj", btnOpen: "Otvori link",
    bookBest: "Najbolje cijene",
    // Walkie
    walkieTalk: "Pritisnite za govor", walkieListen: "Slušam...", walkieAnswer: "Odgovaram...",
    walkieInfo: "Hands-free · Ekran ne gasi se", walkieSnap: "Slikaj",
    // Errors & status
    errVision: "Greška pri analizi. Pokušajte ponovno.", errConnection: "Veza nije dostupna. Pokušajte ponovno.",
    iceWelcome: "Dobrodošli u", iceBack: "Dobrodošli natrag", iceMorning: "Dobro jutro.", iceEvening: "Dobra večer.", iceWhat: "Što planirate danas", iceBeach: "plaže, izleti, kultura", iceDinner: "večeru s pogledom", iceActivity: "popodnevnu aktivnost", iceCamperIntro: "Poznajem svaki parking, dump station i skrivenu uvalu na ovom dijelu obale.", iceSailIntro: "Poznajem svaku marinu, sidrište i konubu do koje se dolazi s mora.", iceCruiseIntro: "Imate ograničeno vrijeme — napravit ćemo plan po minutu.", iceCruiseQ: "U koliko sati se morate vratiti na brod?", iceGenericIntro: "Poznajem svaku skrivenu plažu i konubu na ovom dijelu obale.", iceWhatFirst: "Što vam prvo treba", iceParkingQ: "siguran parking za noćas, preporuka za plažu pristupačnu kamperom, ili nešto treće?", iceMarinaQ: "Trebate preporuku za vez, sigurno sidrište ili večeru na obali?", iceWhatInterest: "Što vas zanima?",
    wxFeels: "osjeća", wxWaves: "valovi", wxPressure: "tlak", wxHumidity: "vlaga", wxSunset: "zalazak", wxProtection: "zaštita obavezna", wxSpf: "SPF 30+ preporučen", wxLowRisk: "nizak rizik", wxData: "Podaci", wxLocation: "Lokacija", wxRefresh: "Osvježava se svake minute", wxCalm: "mirno", wxForecast: "Prognoza vrijedi do", wxSource: "Izvor: DHMZ", wxWind: "vjetar", wxSea: "more", wxVisibility: "vidljivost", wxSeeAll: "POGLEDAJTE ŠTO SVE MOGU", wxCloud: "oblačnost", wxDays: "dana", tierSeason: "SEZONA", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "PREDSEZONA", wxTemp: "TEMPERATURA",
    freeNote: "3 poruke besplatno · zatim 9.99€/tjedan", trialExpired: "Besplatni dan istekao", payExpired: "BESPLATNI DAN JE ISTEKAO", payTitle: "Otključajte svog vodiča", payFeatures: "Neograničena pitanja 24/7|Svi savjeti otključani|8+ skrivenih plaža i konoba|Personalizirana ruta za danas", payCamper: "Kamper parking, dump station, voda", payIstra: "Istra Insider — sezonski savjeti", payWeek: "Tjedan", payWeekSub: "7 dana · 1 regija", paySeason: "Sezona", paySeasonSub: "30 dana · sve regije", payLoading: "Preusmjeravanje na plaćanje...", paySecure: "Sigurno plaćanje putem Stripe · Nema skrivenih troškova · Jednokratno plaćanje · bez pretplate", payLater: "Možda kasnije", payRecover: "Već ste platili?", payRecoverEmail: "Unesite email s kojim ste platili", payRecoverBtn: "Obnovi pristup", payRecoverOk: "Pristup obnovljen!", payRecoverFail: "Plaćanje nije pronađeno", payRecoverExpired: "Pretplata istekla", buyNow: "KUPI PREMIUM", buyPrice: "od 9.99€",
  },
  en: { title: "Jadran Guide", sub: "Local tips for the perfect Adriatic trip", start: "Start chatting", send: "Send", placeholder: "Ask me about the Adriatic...", region: "Choose region", mode: "How are you traveling?", unlock: "Unlock — from €9.99", free3: "3 free questions", remaining: "remaining", upgraded: "Premium unlocked!", back: "Back", typing: "thinking...",
    nicCamper: "Camper Guide", nicCamperSub: "Parking, routes, dump stations, camper warnings",
    nicLocal: "Local Guide", nicLocalSub: "Apartment, hotel or by car — beaches, restaurants, hidden gems",
    nicSailing: "Nautical Guide", nicSailingSub: "Marinas, anchorages, wind, waterfront restaurants",
    nicCruiser: "Cruise Guide", nicCruiserSub: "Max in 8 hours — minute-by-minute plan, skip-the-line",
    gabariti: "VEHICLE SIZE", camperLength: "Length (m)", camperHeight: "Height (m)", camperPlaceholderLen: "e.g. 7.5", camperPlaceholderH: "e.g. 3.2", lenLabel: "Length (m)", heightLabel: "Height (m)",
    gabaritiFeedback: "Your camper: {len}m × {h}m — tailoring recommendations",
    gabaritiHint: "Optional — but helps for precise routes & parking",
    vibeTitle: "Right now on the Adriatic", vibeCamper: "Road & sea conditions", vibeSailing: "Maritime conditions",
    notifBtn: "Enable weather alerts", notifOn: "Alerts active", loading: "Loading data...",
    qParking: "Where to park the camper?", qDinner: "Dinner with parking?", qFuel: "Gas / LPG nearby?",
    qMarina: "Nearest marina with berth?", qSea: "Sea conditions & wind?", qKonoba: "Restaurant from the sea?",
    qPlan: "Day plan for 8 hours?", qLunch: "Local lunch, no tourist prices?", qPhoto: "Best photo spot?",
    qBeach: "Best beach nearby?", qFood: "Lunch recommendation?", qVisit: "What to see today?",
    showOffers: "Activities, beaches, deals", showBtn: "Show ▼", hideBtn: "Hide offers ▲",
    available: "available", activities: "ACTIVITIES",
    btnOffer: "View offer", btnTour: "View tour", btnStay: "View accommodation", btnOpen: "Open link",
    bookBest: "Best prices",
    walkieTalk: "Press to talk", walkieListen: "Listening...", walkieAnswer: "Responding...",
    walkieInfo: "Hands-free · Screen stays on", walkieSnap: "Snap photo",
    errVision: "Analysis failed. Please try again.", errConnection: "Connection unavailable. Please try again.",
    iceWelcome: "Welcome to", iceBack: "Welcome back", iceMorning: "Good morning.", iceEvening: "Good evening.", iceWhat: "What are you planning today", iceBeach: "beaches, trips, culture", iceDinner: "dinner with a view", iceActivity: "an afternoon activity", iceCamperIntro: "I know every parking spot, dump station and hidden cove on this part of the coast.", iceSailIntro: "I know every marina, anchorage and waterfront restaurant on this coast.", iceCruiseIntro: "You have limited time — we will make a plan by the minute.", iceCruiseQ: "What time do you need to be back on board?", iceGenericIntro: "I know every hidden beach and restaurant on this part of the coast.", iceWhatFirst: "What do you need first", iceParkingQ: "safe parking for tonight, a camper-friendly beach, or something else?", iceMarinaQ: "Need a berth recommendation, safe anchorage, or dinner on shore?", iceWhatInterest: "What are you interested in?",
    wxFeels: "feels", wxWaves: "waves", wxPressure: "pressure", wxHumidity: "humidity", wxSunset: "sunset", wxProtection: "protection required", wxSpf: "SPF 30+ recommended", wxLowRisk: "low risk", wxData: "Data", wxLocation: "Location", wxRefresh: "Refreshes every minute", wxCalm: "calm", wxForecast: "Forecast valid until", wxSource: "Source: DHMZ", wxWind: "wind", wxSea: "sea", wxVisibility: "visibility", wxSelectRegion: "Select your region", wxSeeAll: "SEE WHAT I CAN DO", wxCloud: "cloud cover", wxDays: "days", tierSeason: "SEASON", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "PRE-SEASON", wxTemp: "TEMPERATURE",
    freeNote: "3 messages free · then from €9.99/week", trialExpired: "Free day expired", payExpired: "FREE DAY EXPIRED", payTitle: "Unlock your guide", payFeatures: "Unlimited questions 24/7|All tips unlocked|8+ hidden beaches & restaurants|Personalized route for today", payCamper: "Camper parking, dump stations, water", payIstra: "Istria Insider — seasonal tips", payWeek: "Week", payWeekSub: "7 days · 1 region", paySeason: "Season", paySeasonSub: "30 days · all regions", payLoading: "Redirecting to payment...", paySecure: "Secure payment via Stripe · No hidden costs · One-time payment · no subscription", payLater: "Maybe later", payRecover: "Already paid?", payRecoverEmail: "Enter the email you used at checkout", payRecoverBtn: "Restore access", payRecoverOk: "Access restored!", payRecoverFail: "No payment found", payRecoverExpired: "Subscription expired", buyNow: "BUY PREMIUM", buyPrice: "from €9.99",
  },
  de: { title: "Jadran Reiseführer", sub: "Geprüfte Insider-Tipps für Ihren Adria-Urlaub", start: "Gespräch starten", send: "Senden", placeholder: "Fragen Sie mich zur Adria...", region: "Wählen Sie Ihre Region", mode: "Wie reisen Sie?", unlock: "Freischalten — ab 9,99€", free3: "3 kostenlose Fragen", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "Zurück", typing: "einen Moment...",
    nicCamper: "Camper-Reiseführer", nicCamperSub: "Stellplätze, Routen, Ver-/Entsorgung, Warnungen",
    nicLocal: "Lokaler Reiseführer", nicLocalSub: "Ferienwohnung, Hotel oder mit dem Auto — Strände, Restaurants",
    nicSailing: "Nautischer Reiseführer", nicSailingSub: "Marinas, Ankerplätze, Wind, Küstenrestaurants",
    nicCruiser: "Kreuzfahrt-Reiseführer", nicCruiserSub: "Maximum in 8 Stunden — Minutenplan, ohne Anstehen",
    gabariti: "FAHRZEUGMAßE", camperLength: "Länge (m)", camperHeight: "Höhe (m)", camperPlaceholderLen: "z.B. 7,5", camperPlaceholderH: "z.B. 3,2", lenLabel: "Länge (m)", heightLabel: "Höhe (m)",
    gabaritiFeedback: "Ihr Camper: {len}m × {h}m — Empfehlungen werden angepasst",
    gabaritiHint: "Optional — aber hilfreich für präzise Routen und Parkplätze",
    vibeTitle: "Aktuell an der Adria", vibeCamper: "Straßen- & Seebedingungen", vibeSailing: "Seebedingungen",
    notifBtn: "Wetterwarnungen aktivieren", notifOn: "Warnungen aktiv", loading: "Daten werden geladen...",
    qParking: "Wo kann ich den Camper parken?", qDinner: "Abendessen mit Parkplatz?", qFuel: "Tankstelle / LPG?",
    qMarina: "Nächste Marina mit Liegeplatz?", qSea: "Seezustand & Wind?", qKonoba: "Restaurant vom Meer aus?",
    qPlan: "Tagesplan für 8 Stunden?", qLunch: "Lokales Mittagessen, keine Touristenpreise?", qPhoto: "Bester Foto-Spot?",
    qBeach: "Bester Strand in der Nähe?", qFood: "Empfehlung zum Mittagessen?", qVisit: "Was gibt es heute zu sehen?",
    showOffers: "Aktivitäten, Strände, Angebote", showBtn: "Anzeigen ▼", hideBtn: "Angebote verbergen ▲",
    available: "verfügbar", activities: "AKTIVITÄTEN",
    btnOffer: "Angebot ansehen", btnTour: "Tour ansehen", btnStay: "Unterkunft ansehen", btnOpen: "Link öffnen",
    bookBest: "Beste Preise",
    walkieTalk: "Zum Sprechen drücken", walkieListen: "Ich höre zu...", walkieAnswer: "Antwort wird erstellt...",
    walkieInfo: "Freisprechanlage · Display bleibt an", walkieSnap: "Foto aufnehmen",
    errVision: "Analyse fehlgeschlagen. Bitte erneut versuchen.", errConnection: "Verbindung nicht verfügbar. Bitte erneut versuchen.",
    iceWelcome: "Willkommen in", iceBack: "Willkommen zurück", iceMorning: "Guten Morgen.", iceEvening: "Guten Abend.", iceWhat: "Was planen Sie heute", iceBeach: "Strände, Ausflüge, Kultur", iceDinner: "Abendessen mit Aussicht", iceActivity: "eine Nachmittagsaktivität", iceCamperIntro: "Ich kenne jeden Stellplatz, jede Entsorgungsstation und versteckte Bucht an diesem Küstenabschnitt.", iceSailIntro: "Ich kenne jeden Hafen, Ankerplatz und jedes Restaurant am Wasser.", iceCruiseIntro: "Sie haben wenig Zeit — wir erstellen einen minutengenauen Plan.", iceCruiseQ: "Um wie viel Uhr müssen Sie zurück an Bord sein?", iceGenericIntro: "Ich kenne jeden versteckten Strand und jedes Restaurant an diesem Küstenabschnitt.", iceWhatFirst: "Was brauchen Sie zuerst", iceParkingQ: "sicheren Stellplatz für heute Nacht, einen Camper-freundlichen Strand oder etwas anderes?", iceMarinaQ: "Brauchen Sie eine Liegeplatz-Empfehlung, sicheren Ankerplatz oder Abendessen an Land?", iceWhatInterest: "Was interessiert Sie?",
    wxFeels: "gefühlt", wxWaves: "Wellen", wxPressure: "Druck", wxHumidity: "Feuchtigkeit", wxSunset: "Sonnenuntergang", wxProtection: "Schutz nötig", wxSpf: "SPF 30+ empfohlen", wxLowRisk: "geringes Risiko", wxData: "Daten", wxLocation: "Standort", wxRefresh: "Aktualisierung jede Minute", wxCalm: "ruhig", wxForecast: "Prognose gültig bis", wxSource: "Quelle: DHMZ", wxWind: "Wind", wxSea: "Meer", wxVisibility: "Sicht", wxSeeAll: "ENTDECKEN SIE MEINE FÄHIGKEITEN",
    freeNote: "3 Nachrichten gratis · dann ab 9,99€/Woche", trialExpired: "Kostenloser Tag abgelaufen", payExpired: "KOSTENLOSER TAG ABGELAUFEN", payTitle: "Schalten Sie Ihren Reiseführer frei", payFeatures: "Unbegrenzte Fragen 24/7|Alle Tipps freigeschaltet|8+ versteckte Strände und Restaurants|Personalisierte Route für heute", payCamper: "Camper-Parkplätze, Entsorgung, Wasser", payIstra: "Istrien Insider — saisonale Tipps", payWeek: "Woche", payWeekSub: "7 Tage · 1 Region", paySeason: "Saison", paySeasonSub: "30 Tage · alle Regionen", payLoading: "Weiterleitung zur Zahlung...", paySecure: "Sichere Zahlung über Stripe · Keine versteckten Kosten · Einmalzahlung · kein Abo", payLater: "Vielleicht später", payRecover: "Bereits bezahlt?", payRecoverEmail: "E-Mail eingeben, mit der Sie bezahlt haben", payRecoverBtn: "Zugang wiederherstellen", payRecoverOk: "Zugang wiederhergestellt!", payRecoverFail: "Keine Zahlung gefunden", payRecoverExpired: "Abonnement abgelaufen", buyNow: "PREMIUM KAUFEN", buyPrice: "ab 9,99€",
  },
  it: { title: "Guida Jadran", sub: "Consigli verificati per la vacanza perfetta sull'Adriatico", start: "Inizia a chattare", send: "Invia", placeholder: "Chiedimi dell'Adriatico...", region: "Scegliete la regione", mode: "Come viaggiate?", unlock: "Sblocca — da 9,99€", free3: "3 domande gratuite", remaining: "rimanenti", upgraded: "Premium sbloccato!", back: "Indietro", typing: "penso...",
    nicCamper: "Guida camper", nicCamperSub: "Parcheggi, percorsi, scarico, avvertenze per camper",
    nicLocal: "Guida locale", nicLocalSub: "Appartamento, hotel o in auto — spiagge, ristoranti, gemme nascoste",
    nicSailing: "Guida nautica", nicSailingSub: "Porti turistici, ancoraggi, vento, ristoranti sul mare",
    nicCruiser: "Guida crociera", nicCruiserSub: "Massimo in 8 ore — piano al minuto, salta la fila",
    gabariti: "DIMENSIONI VEICOLO", camperLength: "Lunghezza (m)", camperHeight: "Altezza (m)", camperPlaceholderLen: "es. 7,5", camperPlaceholderH: "es. 3,2", lenLabel: "Lunghezza (m)", heightLabel: "Altezza (m)",
    gabaritiFeedback: "Il vostro camper: {len}m × {h}m — adattiamo i consigli",
    gabaritiHint: "Facoltativo — ma utile per percorsi e parcheggi precisi",
    vibeTitle: "In questo momento sull'Adriatico", vibeCamper: "Condizioni stradali e marittime", vibeSailing: "Condizioni marittime",
    notifBtn: "Attiva avvisi meteo", notifOn: "Avvisi attivi", loading: "Caricamento dati...",
    qParking: "Dove parcheggiare il camper?", qDinner: "Cena con parcheggio?", qFuel: "Distributore / GPL?",
    qMarina: "Porto turistico più vicino?", qSea: "Condizioni del mare e vento?", qKonoba: "Ristorante dal mare?",
    qPlan: "Piano giornaliero per 8 ore?", qLunch: "Pranzo locale, no prezzi turistici?", qPhoto: "Miglior punto foto?",
    qBeach: "Spiaggia migliore nelle vicinanze?", qFood: "Consiglio per il pranzo?", qVisit: "Cosa vedere oggi?",
    showOffers: "Attività, spiagge, offerte", showBtn: "Mostra ▼", hideBtn: "Nascondi offerte ▲",
    available: "disponibili", activities: "ATTIVITÀ",
    btnOffer: "Vedi offerta", btnTour: "Vedi tour", btnStay: "Vedi alloggio", btnOpen: "Apri link",
    bookBest: "Prezzi migliori",
    walkieTalk: "Premi per parlare", walkieListen: "Ascolto...", walkieAnswer: "Rispondo...",
    walkieInfo: "Vivavoce · Schermo sempre acceso", walkieSnap: "Scatta foto",
    errVision: "Analisi fallita. Riprovare.", errConnection: "Connessione non disponibile. Riprovare.",
    iceWelcome: "Benvenuti a", iceBack: "Bentornati", iceMorning: "Buongiorno.", iceEvening: "Buonasera.", iceWhat: "Cosa avete in programma oggi", iceBeach: "spiagge, escursioni, cultura", iceDinner: "cena con vista", iceActivity: "un'attività pomeridiana", iceCamperIntro: "Conosco ogni parcheggio, stazione di scarico e baia nascosta su questa costa.", iceSailIntro: "Conosco ogni marina, ancoraggio e ristorante sul mare.", iceCruiseIntro: "Avete tempo limitato — creeremo un piano al minuto.", iceCruiseQ: "A che ora dovete tornare a bordo?", iceGenericIntro: "Conosco ogni spiaggia nascosta e ristorante su questa costa.", iceWhatFirst: "Di cosa avete bisogno per primo", iceParkingQ: "parcheggio sicuro per stanotte, spiaggia per camper o altro?", iceMarinaQ: "Serve un posto barca, ancoraggio sicuro o cena a terra?", iceWhatInterest: "Cosa vi interessa?",
    wxFeels: "percepiti", wxWaves: "onde", wxPressure: "pressione", wxHumidity: "umidità", wxSunset: "tramonto", wxProtection: "protezione obbligatoria", wxSpf: "SPF 30+ consigliato", wxLowRisk: "rischio basso", wxData: "Dati", wxLocation: "Posizione", wxRefresh: "Aggiornamento ogni minuto", wxCalm: "calmo", wxForecast: "Previsione valida fino a", wxSource: "Fonte: DHMZ", wxWind: "vento", wxSea: "mare", wxVisibility: "visibilità", wxSeeAll: "SCOPRI COSA POSSO FARE",
    freeNote: "3 messaggi gratis · poi da 9,99€/settimana", trialExpired: "Giorno gratuito scaduto", payExpired: "GIORNO GRATUITO SCADUTO", payTitle: "Sblocca la tua guida", payFeatures: "Domande illimitate 24/7|Tutti i consigli sbloccati|8+ spiagge e ristoranti nascosti|Percorso personalizzato per oggi", payCamper: "Parcheggi camper, scarico, acqua", payIstra: "Istria Insider — consigli stagionali", payWeek: "Settimana", payWeekSub: "7 giorni · 1 regione", paySeason: "Stagione", paySeasonSub: "30 giorni · tutte le regioni", payLoading: "Reindirizzamento al pagamento...", paySecure: "Pagamento sicuro tramite Stripe · Nessun costo nascosto · Pagamento unico · nessun abbonamento", payLater: "Forse più tardi", payRecover: "Già pagato?", payRecoverEmail: "Inserisci l'email usata per il pagamento", payRecoverBtn: "Ripristina accesso", payRecoverOk: "Accesso ripristinato!", payRecoverFail: "Nessun pagamento trovato", payRecoverExpired: "Abbonamento scaduto", buyNow: "ACQUISTA PREMIUM", buyPrice: "da 9,99€",
  },
  at: { title: "Jadran Urlaubsguide", sub: "Insider-Tipps für deinen Adria-Urlaub — direkt von Einheimischen", start: "Los geht's!", send: "Abschicken", placeholder: "Frag mi was über die Adria...", region: "Wo geht's hin?", mode: "Wie bist du unterwegs?", unlock: "Freischalten — ab 9,99€", free3: "3 Fragen gratis", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "Zurück", typing: "Moment...",
    nicCamper: "Camper-Guide", nicCamperSub: "Stellplätze, Routen, Ver-/Entsorgung, Warnungen für Camper",
    nicLocal: "Dein Urlaubsguide", nicLocalSub: "Ferienwohnung, Hotel oder mit dem Auto — Strände, Beisln, Geheimtipps",
    nicSailing: "Nautik-Guide", nicSailingSub: "Marinas, Ankerplätze, Wind, Schmankerln am Wasser",
    nicCruiser: "Kreuzfahrt-Guide", nicCruiserSub: "Maximales Erlebnis in 8 Stunden — ohne Anstehen",
    gabariti: "FAHRZEUGGRÖßE", camperLength: "Länge (m)", camperHeight: "Höhe (m)", camperPlaceholderLen: "z.B. 7,5", camperPlaceholderH: "z.B. 3,2", lenLabel: "Länge (m)", heightLabel: "Höhe (m)",
    gabaritiFeedback: "Dein Camper: {len}m × {h}m — wir passen die Tipps an",
    gabaritiHint: "Freiwillig — hilft aber für genaue Routen und Parkplätze",
    vibeTitle: "Gerade an der Adria", vibeCamper: "Straßen- & Meerlage", vibeSailing: "Seebedingungen",
    notifBtn: "Wetterwarnungen aktivieren", notifOn: "Warnungen aktiv", loading: "Daten laden...",
    qParking: "Wo kann ich den Camper hinstellen?", qDinner: "Abendessen mit Parkplatz?", qFuel: "Tankstelle / LPG?",
    qMarina: "Nächste Marina mit Liegeplatz?", qSea: "Wie schaut's am Meer aus?", qKonoba: "Beisl direkt am Wasser?",
    qPlan: "Tagesplan für 8 Stunden?", qLunch: "Wo gibt's a gschmackige Jause?", qPhoto: "Bester Platz fürs Foto?",
    qBeach: "Bester Strand in der Nähe?", qFood: "Wo gibt's was Gutes zum Essen?", qVisit: "Was schaut man sich heut an?",
    showOffers: "Aktivitäten, Strände, Angebote", showBtn: "Anzeigen ▼", hideBtn: "Angebote verbergen ▲",
    available: "verfügbar", activities: "AKTIVITÄTEN",
    btnOffer: "Angebot anschauen", btnTour: "Tour anschauen", btnStay: "Unterkunft anschauen", btnOpen: "Link öffnen",
    bookBest: "Beste Preise",
    walkieTalk: "Zum Reden drücken", walkieListen: "I hör zua...", walkieAnswer: "Antwort kommt...",
    walkieInfo: "Freisprechanlage · Display bleibt an", walkieSnap: "Foto machen",
    errVision: "Analyse fehlgeschlagen. Bitte nochmal probieren.", errConnection: "Verbindung nicht verfügbar. Bitte nochmal probieren.",
    iceWelcome: "Willkommen in", iceBack: "Schön dass'd wieder da bist", iceMorning: "Guten Morgen.", iceEvening: "Guten Abend.", iceWhat: "Was hast heut vor", iceBeach: "Strände, Ausflüge, Kultur", iceDinner: "Abendessen mit Aussicht", iceActivity: "was am Nachmittag", iceCamperIntro: "I kenn jeden Stellplatz, jede Entsorgungsstation und versteckte Bucht an dem Küstenabschnitt.", iceSailIntro: "I kenn jeden Hafen, Ankerplatz und jedes Beisl am Wasser.", iceCruiseIntro: "Du hast wenig Zeit — mia machen an minutengenauen Plan.", iceCruiseQ: "Um wie viel Uhr musst z'ruck an Bord sein?", iceGenericIntro: "I kenn jeden versteckten Strand und jedes Beisl an dem Küstenabschnitt.", iceWhatFirst: "Was brauchst als Erstes", iceParkingQ: "sicheren Stellplatz für heut Nacht, an Camper-freundlichen Strand oder was anderes?", iceMarinaQ: "Brauchst a Liegeplatz-Empfehlung, sicheren Ankerplatz oder Abendessen an Land?", iceWhatInterest: "Was interessiert di?",
    wxFeels: "g'fühlt", wxWaves: "Wellen", wxPressure: "Druck", wxHumidity: "Feuchtigkeit", wxSunset: "Sonnenuntergang", wxProtection: "Schutz nötig", wxSpf: "SPF 30+ empfohlen", wxLowRisk: "wenig Risiko", wxData: "Daten", wxLocation: "Standort", wxRefresh: "Aktualisierung jede Minute", wxCalm: "ruhig", wxForecast: "Prognose gültig bis", wxSource: "Quelle: DHMZ", wxWind: "Wind", wxSea: "Meer", wxVisibility: "Sicht", wxSeeAll: "SCHAU WAS I ALLES KANN", wxCloud: "Bewölkung", wxDays: "Tage", tierSeason: "SAISON", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "VORSAISON", wxTemp: "TEMPERATUR",
    freeNote: "3 Nachrichten gratis · dann ab 9,99€/Woche", trialExpired: "Gratis-Tag abgelaufen", payExpired: "GRATIS-TAG ABGELAUFEN", payTitle: "Schalt deinen Guide frei", payFeatures: "Unbegrenzt Fragen 24/7|Alle Tipps freigeschaltet|8+ versteckte Strände und Beisln|Personalisierte Route für heute", payCamper: "Camper-Stellplätze, Entsorgung, Wasser", payIstra: "Istrien Insider — Tipps zur Saison", payWeek: "Woche", payWeekSub: "7 Tage · 1 Region", paySeason: "Saison", paySeasonSub: "30 Tage · alle Regionen", payLoading: "Weiterleitung zur Zahlung...", paySecure: "Sichere Zahlung via Stripe · Keine versteckten Kosten · Einmalzahlung · kein Abo", payLater: "Vielleicht später", payRecover: "Bereits bezahlt?", payRecoverEmail: "E-Mail eingeben, mit der Sie bezahlt haben", payRecoverBtn: "Zugang wiederherstellen", payRecoverOk: "Zugang wiederhergestellt!", payRecoverFail: "Keine Zahlung gefunden", payRecoverExpired: "Abonnement abgelaufen", buyNow: "PREMIUM KAUFEN", buyPrice: "ab 9,99€",
  },
  si: { title: "Jadran vodič", sub: "Lokalni nasveti za popoln oddih na Jadranu", start: "Začni pogovor", send: "Pošlji", placeholder: "Vprašajte me o Jadranu...", region: "Izberite regijo", mode: "Kako potujete?", unlock: "Odkleni — od 9,99€", free3: "3 brezplačna vprašanja", remaining: "preostalo", upgraded: "Premium odklenjen!", back: "Nazaj", typing: "razmišljam...",
    nicCamper: "Vodič za kamper", nicCamperSub: "Parkirišča, poti, opozorila za kamper",
    nicLocal: "Lokalni vodič", nicLocalSub: "Apartma, hotel ali z avtom — plaže, restavracije",
    nicSailing: "Navtični vodič", nicSailingSub: "Marine, sidrišča, veter, restavracije ob morju",
    nicCruiser: "Vodič za križarke", nicCruiserSub: "Maksimum v 8 urah — načrt po minutah",
    gabariti: "VELIKOST VOZILA", camperLength: "Dolžina (m)", camperHeight: "Višina (m)", camperPlaceholderLen: "npr. 7,5", camperPlaceholderH: "npr. 3,2", lenLabel: "Dolžina (m)", heightLabel: "Višina (m)",
    gabaritiFeedback: "Vaš kamper: {len}m × {h}m — prilagajamo priporočila",
    gabaritiHint: "Neobvezno — a pomaga za natančne poti",
    vibeTitle: "Trenutno na Jadranu", vibeCamper: "Stanje na cesti in morju", vibeSailing: "Pomorske razmere",
    notifBtn: "Vklopi vremenska opozorila", notifOn: "Opozorila aktivna", loading: "Nalagam podatke...",
    qParking: "Kje parkirati kamper?", qDinner: "Večerja s parkiriščem?", qFuel: "Bencinska / LPG?",
    qMarina: "Najbližja marina?", qSea: "Stanje morja in veter?", qKonoba: "Restavracija ob morju?",
    qPlan: "Dnevni načrt za 8 ur?", qLunch: "Lokalno kosilo?", qPhoto: "Najboljša točka za fotografijo?",
    qBeach: "Najboljša plaža v bližini?", qFood: "Priporočilo za kosilo?", qVisit: "Kaj si ogledati danes?",
    showOffers: "Aktivnosti, plaže, ponudbe", showBtn: "Prikaži ▼", hideBtn: "Skrij ponudbe ▲",
    available: "na voljo", activities: "AKTIVNOSTI",
    btnOffer: "Poglej ponudbo", btnTour: "Poglej izlet", btnStay: "Poglej nastanitev", btnOpen: "Odpri povezavo",
    bookBest: "Najboljše cene",
    walkieTalk: "Pritisni za govor", walkieListen: "Poslušam...", walkieAnswer: "Odgovarjam...",
    walkieInfo: "Prostoročno · Zaslon ne ugasne", walkieSnap: "Fotografiraj",
    errVision: "Analiza ni uspela. Poskusite znova.", errConnection: "Povezava ni na voljo. Poskusite znova.",
    iceWelcome: "Dobrodošli v", iceBack: "Dobrodošli nazaj", iceMorning: "Dobro jutro.", iceEvening: "Dober večer.", iceWhat: "Kaj načrtujete danes", iceBeach: "plaže, izleti, kultura", iceDinner: "večerjo z razgledom", iceActivity: "popoldansko aktivnost", iceCamperIntro: "Poznam vsako parkirišče in skrito zatlino na tem delu obale.", iceSailIntro: "Poznam vsako marino in sidrišče na tej obali.", iceCruiseIntro: "Imate omejen čas — naredili bomo načrt po minutah.", iceCruiseQ: "Ob kateri uri se morate vrniti na ladjo?", iceGenericIntro: "Poznam vsako skrito plažo in restavracijo na tem delu obale.", iceWhatFirst: "Kaj najprej potrebujete", iceParkingQ: "varno parkirišče za nocoj, plažo za kamper ali kaj drugega?", iceMarinaQ: "Potrebujete priporočilo za privez ali večerjo na obali?", iceWhatInterest: "Kaj vas zanima?",
    wxFeels: "občutek", wxWaves: "valovi", wxPressure: "tlak", wxHumidity: "vlaga", wxSunset: "zahod", wxProtection: "zaščita obvezna", wxSpf: "SPF 30+ priporočen", wxLowRisk: "nizko tveganje", wxData: "Podatki", wxLocation: "Lokacija", wxRefresh: "Posodobitev vsako minuto", wxCalm: "mirno", wxForecast: "Napoved velja do", wxSource: "Vir: DHMZ", wxWind: "veter", wxSea: "morje", wxVisibility: "vidljivost", wxSelectRegion: "Izberite regijo", wxSeeAll: "POGLEJTE KAJ VSE ZNAM", wxCloud: "oblačnost", wxDays: "dni", tierSeason: "SEZONA", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "PREDSEZONA", wxTemp: "TEMPERATURA",
    freeNote: "3 sporočila brezplačno · nato 9,99€/teden", trialExpired: "Brezplačni dan je potekel", payExpired: "BREZPLAČNI DAN JE POTEKEL", payTitle: "Odkleni vodič", payFeatures: "Neomejeno vprašanj 24/7|Vsi nasveti odklenjeni|8+ skritih plaž|Personalizirana pot za danes", payCamper: "Parkirišča za kamper, voda", payIstra: "Istra Insider", payWeek: "Teden", payWeekSub: "7 dni · 1 regija", paySeason: "Sezona", paySeasonSub: "30 dni · vse regije", payLoading: "Preusmerjanje na plačilo...", paySecure: "Varno plačilo prek Stripe · Brez skritih stroškov · Enkratno plačilo · brez naročnine", payLater: "Mogoče pozneje", payRecover: "Že plačano?", payRecoverEmail: "Vnesite email, s katerim ste plačali", payRecoverBtn: "Obnovi dostop", payRecoverOk: "Dostop obnovljen!", payRecoverFail: "Plačilo ni najdeno", payRecoverExpired: "Naročnina potekla", buyNow: "KUPI PREMIUM", buyPrice: "od 9,99€",
  },
  cz: { title: "Jadran průvodce", sub: "Místní tipy pro perfektní dovolenou na Jadranu", start: "Začít konverzaci", send: "Odeslat", placeholder: "Zeptejte se na Jadran...", region: "Vyberte region", mode: "Jak cestujete?", unlock: "Odemknout — od 9,99€", free3: "3 otázky zdarma", remaining: "zbývá", upgraded: "Premium odemčen!", back: "Zpět", typing: "přemýšlím...",
    nicCamper: "Průvodce pro karavany", nicCamperSub: "Parkování, trasy, služby, varování pro karavany",
    nicLocal: "Místní průvodce", nicLocalSub: "Apartmán, hotel nebo autem — pláže, restaurace, skryté klenoty",
    nicSailing: "Námořní průvodce", nicSailingSub: "Přístavy, kotviště, vítr, restaurace u moře",
    nicCruiser: "Průvodce pro výletní lodě", nicCruiserSub: "Maximum za 8 hodin — plán po minutách",
    gabariti: "ROZMĚRY VOZIDLA", camperLength: "Délka (m)", camperHeight: "Výška (m)", camperPlaceholderLen: "např. 7,5", camperPlaceholderH: "např. 3,2", lenLabel: "Délka (m)", heightLabel: "Výška (m)",
    gabaritiFeedback: "Váš karavan: {len}m × {h}m — přizpůsobujeme doporučení",
    gabaritiHint: "Nepovinné — ale pomáhá pro přesné trasy",
    vibeTitle: "Právě teď na Jadranu", vibeCamper: "Silniční a mořské podmínky", vibeSailing: "Mořské podmínky",
    notifBtn: "Zapnout upozornění na počasí", notifOn: "Upozornění aktivní", loading: "Načítám data...",
    qParking: "Kde zaparkovat karavan?", qDinner: "Večeře s parkováním?", qFuel: "Benzínka / LPG?",
    qMarina: "Nejbližší přístav?", qSea: "Stav moře a vítr?", qKonoba: "Restaurace u moře?",
    qPlan: "Denní plán na 8 hodin?", qLunch: "Místní oběd za dobré ceny?", qPhoto: "Nejlepší místo na fotku?",
    qBeach: "Nejlepší pláž v okolí?", qFood: "Doporučení na oběd?", qVisit: "Co vidět dnes?",
    showOffers: "Aktivity, pláže, nabídky", showBtn: "Zobrazit ▼", hideBtn: "Skrýt nabídky ▲",
    available: "dostupné", activities: "AKTIVITY",
    btnOffer: "Zobrazit nabídku", btnTour: "Zobrazit výlet", btnStay: "Zobrazit ubytování", btnOpen: "Otevřít odkaz",
    bookBest: "Nejlepší ceny",
    walkieTalk: "Stiskněte pro mluvení", walkieListen: "Poslouchám...", walkieAnswer: "Odpovídám...",
    walkieInfo: "Hlasité ovládání · Displej zůstává zapnutý", walkieSnap: "Vyfotit",
    errVision: "Analýza selhala. Zkuste to znovu.", errConnection: "Připojení není k dispozici. Zkuste to znovu.",
    iceWelcome: "Vítejte v", iceBack: "Vítejte zpět", iceMorning: "Dobré ráno.", iceEvening: "Dobrý večer.", iceWhat: "Co dnes plánujete", iceBeach: "pláže, výlety, kultura", iceDinner: "večeři s výhledem", iceActivity: "odpolední aktivitu", iceCamperIntro: "Znám každé parkoviště a skrytou zátoku na tomto pobřeží.", iceSailIntro: "Znám každý přístav a kotviště na tomto pobřeží.", iceCruiseIntro: "Máte omezený čas — vytvoříme plán po minutách.", iceCruiseQ: "V kolik hodin se musíte vrátit na loď?", iceGenericIntro: "Znám každou skrytou pláž a restauraci na tomto pobřeží.", iceWhatFirst: "Co potřebujete nejdříve", iceParkingQ: "bezpečné parkování na noc, pláž pro karavan nebo něco jiného?", iceMarinaQ: "Potřebujete doporučení kotviště nebo večeři na břehu?", iceWhatInterest: "Co vás zajímá?",
    wxFeels: "pocitově", wxWaves: "vlny", wxPressure: "tlak", wxHumidity: "vlhkost", wxSunset: "západ", wxProtection: "ochrana nutná", wxSpf: "SPF 30+ doporučeno", wxLowRisk: "nízké riziko", wxData: "Data", wxLocation: "Poloha", wxRefresh: "Aktualizace každou minutu", wxCalm: "klidné", wxForecast: "Předpověď platí do", wxSource: "Zdroj: DHMZ", wxWind: "vítr", wxSea: "moře", wxVisibility: "viditelnost", wxSelectRegion: "Vyberte region", wxSeeAll: "PODÍVEJTE SE CO UMÍM", wxCloud: "oblačnost", wxDays: "dní", tierSeason: "SEZÓNA", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "PŘEDSEZÓNA", wxTemp: "TEPLOTA",
    freeNote: "3 zprávy zdarma · poté 9,99€/týden", trialExpired: "Bezplatný den vypršel", payExpired: "BEZPLATNÝ DEN VYPRŠEL", payTitle: "Odemkněte průvodce", payFeatures: "Neomezené dotazy 24/7|Všechny tipy odemčeny|8+ skrytých pláží|Personalizovaná trasa na dnes", payCamper: "Parkování pro karavany, voda", payIstra: "Istrie Insider", payWeek: "Týden", payWeekSub: "7 dní · 1 region", paySeason: "Sezóna", paySeasonSub: "30 dní · všechny regiony", payLoading: "Přesměrování na platbu...", paySecure: "Bezpečná platba přes Stripe · Žádné skryté poplatky · Jednorázová platba · bez předplatného", payLater: "Možná později", payRecover: "Už jste platili?", payRecoverEmail: "Zadejte email použitý při platbě", payRecoverBtn: "Obnovit přístup", payRecoverOk: "Přístup obnoven!", payRecoverFail: "Platba nenalezena", payRecoverExpired: "Předplatné vypršelo", buyNow: "KOUPIT PREMIUM", buyPrice: "od 9,99€",
  },
  pl: { title: "Jadran przewodnik", sub: "Lokalne wskazówki na idealny urlop nad Adriatykiem", start: "Zacznij rozmowę", send: "Wyślij", placeholder: "Zapytaj o Adriatyk...", region: "Wybierz region", mode: "Jak podróżujesz?", unlock: "Odblokuj — od 9,99€", free3: "3 pytania za darmo", remaining: "pozostało", upgraded: "Premium odblokowany!", back: "Wstecz", typing: "myślę...",
    nicCamper: "Przewodnik kamperowy", nicCamperSub: "Parkingi, trasy, stacje serwisowe, ostrzeżenia",
    nicLocal: "Lokalny przewodnik", nicLocalSub: "Apartament, hotel lub samochodem — plaże, restauracje",
    nicSailing: "Przewodnik żeglarski", nicSailingSub: "Mariny, kotwicowiska, wiatr, restauracje nad wodą",
    nicCruiser: "Przewodnik wycieczkowy", nicCruiserSub: "Maksimum w 8 godzin — plan co do minuty",
    gabariti: "WYMIARY POJAZDU", camperLength: "Długość (m)", camperHeight: "Wysokość (m)", camperPlaceholderLen: "np. 7,5", camperPlaceholderH: "np. 3,2", lenLabel: "Długość (m)", heightLabel: "Wysokość (m)",
    gabaritiFeedback: "Twój kamper: {len}m × {h}m — dostosowujemy rekomendacje",
    gabaritiHint: "Opcjonalne — ale pomaga w doborze tras i parkingów",
    vibeTitle: "Teraz na Adriatyku", vibeCamper: "Warunki drogowe i morskie", vibeSailing: "Warunki morskie",
    notifBtn: "Włącz alerty pogodowe", notifOn: "Alerty aktywne", loading: "Ładowanie danych...",
    qParking: "Gdzie zaparkować kamper?", qDinner: "Kolacja z parkingiem?", qFuel: "Stacja / LPG?",
    qMarina: "Najbliższa marina?", qSea: "Stan morza i wiatr?", qKonoba: "Restauracja nad wodą?",
    qPlan: "Plan dnia na 8 godzin?", qLunch: "Lokalny obiad w dobrej cenie?", qPhoto: "Najlepsze miejsce na zdjęcie?",
    qBeach: "Najlepsza plaża w pobliżu?", qFood: "Polecenie na obiad?", qVisit: "Co zobaczyć dziś?",
    showOffers: "Aktywności, plaże, oferty", showBtn: "Pokaż ▼", hideBtn: "Ukryj oferty ▲",
    available: "dostępne", activities: "AKTYWNOŚCI",
    btnOffer: "Zobacz ofertę", btnTour: "Zobacz wycieczkę", btnStay: "Zobacz noclegi", btnOpen: "Otwórz link",
    bookBest: "Najlepsze ceny",
    walkieTalk: "Naciśnij, aby mówić", walkieListen: "Słucham...", walkieAnswer: "Odpowiadam...",
    walkieInfo: "Tryb głośnomówiący · Ekran nie gaśnie", walkieSnap: "Zrób zdjęcie",
    errVision: "Analiza nie powiodła się. Spróbuj ponownie.", errConnection: "Brak połączenia. Spróbuj ponownie.",
    iceWelcome: "Witamy w", iceBack: "Witamy ponownie", iceMorning: "Dzień dobry.", iceEvening: "Dobry wieczór.", iceWhat: "Co planujecie dziś", iceBeach: "plaże, wycieczki, kultura", iceDinner: "kolację z widokiem", iceActivity: "popołudniową aktywność", iceCamperIntro: "Znam każdy parking i ukrytą zatokę na tym odcinku wybrzeża.", iceSailIntro: "Znam każdą marinę i kotwicowisko na tym wybrzeżu.", iceCruiseIntro: "Macie ograniczony czas — stworzymy plan co do minuty.", iceCruiseQ: "O której musicie wrócić na statek?", iceGenericIntro: "Znam każdą ukrytą plażę i restaurację na tym wybrzeżu.", iceWhatFirst: "Czego potrzebujecie najpierw", iceParkingQ: "bezpieczny parking na noc, plażę dla kampera czy coś innego?", iceMarinaQ: "Potrzebujecie rekomendacji cumowania lub kolacji na brzegu?", iceWhatInterest: "Co was interesuje?",
    wxFeels: "odczuwalna", wxWaves: "fale", wxPressure: "ciśnienie", wxHumidity: "wilgotność", wxSunset: "zachód", wxProtection: "ochrona wymagana", wxSpf: "SPF 30+ zalecany", wxLowRisk: "niskie ryzyko", wxData: "Dane", wxLocation: "Lokalizacja", wxRefresh: "Aktualizacja co minutę", wxCalm: "spokojne", wxForecast: "Prognoza ważna do", wxSource: "Źródło: DHMZ", wxWind: "wiatr", wxSea: "morze", wxVisibility: "widoczność", wxSelectRegion: "Wybierz region", wxSeeAll: "ZOBACZ CO POTRAFIĘ", wxCloud: "zachmurzenie", wxDays: "dni", tierSeason: "SEZON", tierExplorer: "EXPLORER", tierVip: "VIP", preseason: "PRZEDSEZON", wxTemp: "TEMPERATURA",
    freeNote: "3 wiadomości za darmo · potem 9,99€/tydzień", trialExpired: "Darmowy dzień wygasł", payExpired: "DARMOWY DZIEŃ WYGASŁ", payTitle: "Odblokuj przewodnik", payFeatures: "Nieograniczone pytania 24/7|Wszystkie wskazówki odblokowane|8+ ukrytych plaż|Spersonalizowana trasa na dziś", payCamper: "Parkingi dla kamperów, woda", payIstra: "Istria Insider", payWeek: "Tydzień", payWeekSub: "7 dni · 1 region", paySeason: "Sezon", paySeasonSub: "30 dni · wszystkie regiony", payLoading: "Przekierowanie do płatności...", paySecure: "Bezpieczna płatność przez Stripe · Brak ukrytych kosztów · Jednorazowa płatność · bez subskrypcji", payLater: "Może później", payRecover: "Już zapłacono?", payRecoverEmail: "Wpisz email użyty przy płatności", payRecoverBtn: "Przywróć dostęp", payRecoverOk: "Dostęp przywrócony!", payRecoverFail: "Nie znaleziono płatności", payRecoverExpired: "Subskrypcja wygasła", buyNow: "KUP PREMIUM", buyPrice: "od 9,99€",
  },
};

export default function StandaloneAI() {
  const [step, setStep] = useState(() => {
    // Premium user with saved choices → skip setup on return
    try {
      const isPrem = localStorage.getItem("jadran_ai_premium") === "1";
      const hasRegion = !!localStorage.getItem("jadran_region");
      const hasMode = !!localStorage.getItem("jadran_travelMode");
      // Check if premium actually expired
      const pp = localStorage.getItem("jadran_premium_plan");
      if (pp) {
        const plan = JSON.parse(pp);
        if (plan.expiresAt && plan.expiresAt < Date.now()) {
          localStorage.removeItem("jadran_ai_premium");
          return "setup"; // expired
        }
      }
      // Don't auto-skip if coming from Stripe or from landing with niche
      const params = new URLSearchParams(window.location.search);
      const isPaymentRedirect = params.get("payment") === "success" || params.get("payment") === "cancelled";
      const hasNiche = !!params.get("niche"); // From landing page — user needs to pick region
      if (isPrem && hasRegion && hasMode && !isPaymentRedirect && !hasNiche) return "chat";
    } catch {}
    return "setup";
  }); // setup | chat
  const [niche, setNiche] = useState(null);
  const [camperLen, setCamperLen] = useState("");
  const [walkieMode, setWalkieMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [camperHeight, setCamperHeight] = useState(""); // "camper" | "local" | null — set from landing CTA
  // ═══ SELF-LEARNING USER PROFILE ═══
const SIGNAL_RULES = [
  // Group detection
  { patterns: [/kinder|djec|deca|bambini|kids|family|obitelj|porodic|enfants/i], field: "group", value: "obitelj s djecom" },
  { patterns: [/partner|žen|muž|wife|husband|couple|zu zweit|coppia|par\b/i], field: "group", value: "par" },
  { patterns: [/sam\b|solo|allein|alone|jedan/i], field: "group", value: "solo" },
  { patterns: [/gruppe|group|grupa|ekipa|prijatelji|friends|amici/i], field: "group", value: "grupa prijatelja" },
  // Budget detection
  { patterns: [/jeftin|günstig|cheap|budget|economico|besplatn|gratis|free|kostenlos/i], field: "budget", value: "budget" },
  { patterns: [/luksuz|luxury|premium|exklusiv|5\s?star|fine.?dining|upscale/i], field: "budget", value: "premium" },
  // Diet detection
  { patterns: [/vegetari|vegan/i], field: "diet", value: "vegetarijanac" },
  { patterns: [/rib[aeu]|fish|fisch|pesce|seafood|morsk/i], field: "interest_add", value: "morska hrana" },
  // Interest detection (additive)
  { patterns: [/plaž|beach|strand|spiaggia|kupan|swim|baden/i], field: "interest_add", value: "plaže" },
  { patterns: [/konob|restoran|restaurant|essen|mangiare|food|hrana|ručak|večer|lunch|dinner/i], field: "interest_add", value: "gastronomija" },
  { patterns: [/vino|wine|wein|degustac|tasting/i], field: "interest_add", value: "vino" },
  { patterns: [/povijest|history|geschicht|storia|museum|muzej/i], field: "interest_add", value: "povijest" },
  { patterns: [/ronjenje|diving|tauchen|schnorchel|snorkel/i], field: "interest_add", value: "ronjenje" },
  { patterns: [/kayak|kanu|SUP|paddle|surf/i], field: "interest_add", value: "vodeni sportovi" },
  { patterns: [/pješač|hiking|wander|trek|planin|mountain|brdo/i], field: "interest_add", value: "pješačenje" },
  { patterns: [/noćni|nightlife|nachtleben|party|klub|club|bar\b/i], field: "interest_add", value: "noćni život" },
  { patterns: [/tartufi|truffle|trüffel|maslin|olive|öl/i], field: "interest_add", value: "lokalni proizvodi" },
  // Avoidance detection
  { patterns: [/ne.*gužv|keine.*massen|no.*crowd|izbjeg.*turist|avoid.*tourist|ohne.*touristen/i], field: "avoid_add", value: "gužve" },
  { patterns: [/ne.*skup|nicht.*teuer|not.*expensive|ne.*skupo/i], field: "avoid_add", value: "skupi objekti" },
];

function extractSignals(text) {
  const signals = {};
  for (const rule of SIGNAL_RULES) {
    for (const pat of rule.patterns) {
      if (pat.test(text)) {
        if (rule.field === "interest_add") {
          if (!signals._interests) signals._interests = [];
          if (!signals._interests.includes(rule.value)) signals._interests.push(rule.value);
        } else if (rule.field === "avoid_add") {
          if (!signals._avoided) signals._avoided = [];
          if (!signals._avoided.includes(rule.value)) signals._avoided.push(rule.value);
        } else {
          signals[rule.field] = rule.value;
        }
        break; // First match per rule wins
      }
    }
  }
  return signals;
}

// Place name extraction (from user messages mentioning Croatian places)
const PLACES = ["Rovinj","Split","Dubrovnik","Zadar","Pula","Makarska","Hvar","Korčula","Brač","Vis","Mljet","Rab","Krk","Cres","Lošinj","Opatija","Rijeka","Šibenik","Trogir","Ston","Pelješac","Motovun","Poreč","Umag","Novigrad","Biograd","Primošten","Bol","Cavtat","Lokrum","Bačvice","Kašjuni","Zlatni Rat"];

function extractPlaces(text) {
  return PLACES.filter(p => text.toLowerCase().includes(p.toLowerCase()));
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem("jadran_user_profile") || "{}");
  } catch { return {}; }
}

function saveProfile(profile) {
  try { localStorage.setItem("jadran_user_profile", JSON.stringify(profile)); } catch {}
}

function updateProfile(userMsg, aiMsg) {
  const profile = { ...loadProfile() };
  // Update visit/message counts
  profile.totalMsgs = (profile.totalMsgs || 0) + 1;
  profile.lastActive = Date.now();
  // Extract signals from user message
  const signals = extractSignals(userMsg);
  if (signals.group) profile.group = signals.group;
  if (signals.budget) profile.budget = signals.budget;
  if (signals.diet) profile.diet = signals.diet;
  // Add interests (deduplicate)
  if (signals._interests) {
    profile.interests = [...new Set([...(profile.interests || []), ...signals._interests])].slice(-15);
  }
  // Add avoidances
  if (signals._avoided) {
    profile.avoided = [...new Set([...(profile.avoided || []), ...signals._avoided])].slice(-10);
  }
  // Extract places mentioned
  const places = extractPlaces(userMsg + " " + (aiMsg || ""));
  if (places.length) {
    profile.visited = [...new Set([...(profile.visited || []), ...places])].slice(-20);
  }
  // Track what got positive reaction (simple heuristic: if user asks follow-up about same topic)
  if (userMsg.length < 40 && (userMsg.includes("?") || /više|more|mehr|altro|ešte|więcej/i.test(userMsg))) {
    // Short follow-up = user liked previous recommendation
    if (aiMsg) {
      const aiPlaces = extractPlaces(aiMsg);
      if (aiPlaces.length) {
        profile.liked = [...new Set([...(profile.liked || []), ...aiPlaces])].slice(-10);
      }
    }
  }
  saveProfile(profile);
  return profile;
}

const [lang, setLang] = useState(() => {
    // Priority: URL param > localStorage > landing cookie > browser > default
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get("lang");
      if (urlLang && ["hr","en","de","it","at","si","cz","pl"].includes(urlLang)) return urlLang;
      const saved = localStorage.getItem("jadran_lang");
      if (saved) return saved;
      const nav = (navigator.language || "hr").toLowerCase();
      if (nav.startsWith("de") && nav.includes("at")) return "at";
      if (nav.startsWith("de")) return "de";
      if (nav.startsWith("en")) return "en";
      if (nav.startsWith("it")) return "it";
      if (nav.startsWith("sl")) return "si";
      if (nav.startsWith("cs")) return "cz";
      if (nav.startsWith("pl")) return "pl";
    } catch {}
    return "hr";
  });

  // Persist language choice
  useEffect(() => {
    try { localStorage.setItem("jadran_lang", lang); } catch {}
  }, [lang]);
  const [region, setRegion] = useState(() => { try { return localStorage.getItem("jadran_region") || null; } catch { return null; } });
  const [travelMode, setTravelMode] = useState(() => { try { return localStorage.getItem("jadran_travelMode") || null; } catch { return null; } });
  const [premium, setPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now()); // Live countdown timer
  const [msgCount, setMsgCount] = useState(0);
  const [deviceFp, setDeviceFp] = useState(null);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  const [promoCode] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get("promo");
      if (p) { localStorage.setItem("jadran_promo", p); return p; }
      return localStorage.getItem("jadran_promo") || "";
    } catch { return ""; }
  });
  const FREE_MSGS = 3;
  const PREMIUM_DAILY_LIMIT = 100; // Cost control: ~2€/day max API spend per user
  const VIP_DAILY_LIMIT = 300; // VIP gets 3x more messages

  // ═══ TIER GATES — Lego block feature access ═══
  // Each feature is a boolean gate. Add new features here, UI checks via can().
  const TIER_GATES = {
    free:     { chat: true,  lens: false, walkie: false, guardian: false, priority: false, msgLimit: FREE_MSGS },
    week:     { chat: true,  lens: false, walkie: false, guardian: false, priority: false, msgLimit: PREMIUM_DAILY_LIMIT },
    season:   { chat: true,  lens: true,  walkie: true,  guardian: true,  priority: false, msgLimit: PREMIUM_DAILY_LIMIT },
    vip:      { chat: true,  lens: true,  walkie: true,  guardian: true,  priority: true,  msgLimit: VIP_DAILY_LIMIT },
    referral: { chat: true,  lens: true,  walkie: true,  guardian: true,  priority: false, msgLimit: PREMIUM_DAILY_LIMIT },
  };
  const currentTier = promoCode ? "vip" : (premium ? (premiumPlan?.plan || "week") : "free");
  const gates = TIER_GATES[currentTier] || TIER_GATES.free;
  const can = (feature) => gates[feature] === true;
  const [upsellFeature, setUpsellFeature] = useState(null); // which feature triggered upsell
  const [trialExpired, setTrialExpired] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState(null); // null | "loading" | "success" | "error" | "expired"
  const [recoveryError, setRecoveryError] = useState("");

  // Plausible analytics helper
  // Dual analytics: Plausible (privacy) + Meta Pixel (ads)
  const track = (event, props) => {
    try { window.plausible?.(event, { props }); } catch {}
    try {
      const pixelMap = {
        checkout_click: "InitiateCheckout",
        paywall_shown: "ViewContent",
        chat_start: "ViewContent",
        msg_sent: "ViewContent",
        referral_share: "Lead",
      };
      if (pixelMap[event] && window.fbq) window.fbq("track", pixelMap[event], props || {});
    } catch {}
  };
  const trackPurchase = (plan, amount, currency = "EUR") => {
    try { window.plausible?.("purchase", { props: { plan, amount, currency } }); } catch {}
    try { window.fbq?.("track", "Purchase", { value: amount, currency, content_name: plan }); } catch {}
  };
  const [langOpen, setLangOpen] = useState(false);
  const curFlag = (LANGS.find(l => l.code === lang) || LANGS[0]).flag;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [dailyNews, setDailyNews] = useState(null);
  const [invitedBy, setInvitedBy] = useState(() => { try { return localStorage.getItem("jadran_invited_by"); } catch { return null; } });
  const [referralToast, setReferralToast] = useState(null);
  const [globalToast, setGlobalToast] = useState(null);
  const [showInviteWelcome, setShowInviteWelcome] = useState(false);

  // Chat
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollBox = useRef(null);
  const scrollAnchor = useRef(null);
  const cameraRef = useRef(null);
  const [weather, setWeather] = useState(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [weatherTime, setWeatherTime] = useState(null);
  const [navtex, setNavtex] = useState(null);
  const [guideCards, setGuideCards] = useState([]);
  const [notifPerm, setNotifPerm] = useState("default");
  const [lastAlert, setLastAlert] = useState(null);
  const [regionImgs, setRegionImgs] = useState({});

  useEffect(() => { scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, loading]);

  // iOS keyboard: scroll input into view when virtual keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => { if (document.activeElement?.tagName === "INPUT") setTimeout(() => document.activeElement?.scrollIntoView?.({ block: "nearest" }), 100); };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Region → coordinates (coastal points for accurate marine data)
  const COORDS = {
    split: { lat: 43.49, lon: 16.55, loc: "Split-Podstrana" },
    makarska: { lat: 43.30, lon: 17.02, loc: "Makarska" },
    dubrovnik: { lat: 42.64, lon: 18.09, loc: "Dubrovnik" },
    zadar: { lat: 44.12, lon: 15.23, loc: "Zadar" },
    istra: { lat: 45.08, lon: 13.64, loc: "Rovinj-Istra" },
    kvarner: { lat: 45.34, lon: 14.31, loc: "Opatija-Kvarner" },
  };

  // Persist region + travelMode to localStorage on every change
  useEffect(() => { try { if (region) localStorage.setItem("jadran_region", region); } catch {} }, [region]);
  useEffect(() => { try { if (travelMode) localStorage.setItem("jadran_travelMode", travelMode); } catch {} }, [travelMode]);
  // Live countdown timer — updates badge every 60s so "29d" → "28d" transitions are visible
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 60000); return () => clearInterval(t); }, []);

  // ── OFFLINE DETECTION ──
  useEffect(() => {
    const goOff = () => setIsOffline(true);
    const goOn = () => setIsOffline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => { window.removeEventListener("online", goOn); window.removeEventListener("offline", goOff); };
  }, []);

  // ── PREMIUM EXPIRY RE-CHECK on tab focus ──
  // Catches: expired while away, localStorage cleared by another tab, premium revoked
  useEffect(() => {
    const checkPremium = () => {
      if (document.visibilityState !== "visible") return;
      try {
        const raw = localStorage.getItem("jadran_premium_plan");
        if (!raw) {
          // No plan data but premium flag set — trust flag (promo code or legacy)
          if (premium && !promoCode) {
            const flag = localStorage.getItem("jadran_ai_premium");
            if (flag !== "1") { setPremium(false); setTrialExpired(true); }
          }
          return;
        }
        const plan = JSON.parse(raw);
        if (plan.expiresAt && plan.expiresAt < Date.now()) {
          setPremium(false); setTrialExpired(true); setPremiumPlan(null);
          try { localStorage.removeItem("jadran_ai_premium"); localStorage.removeItem("jadran_premium_plan"); } catch {}
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", checkPremium);
    return () => document.removeEventListener("visibilitychange", checkPremium);
  }, [premium, promoCode]);

  // Auto-generate icebreaker when entering chat with no messages (e.g. premium auto-skip)
  useEffect(() => {
    if (step === "chat" && msgs.length === 0 && region) {
      const ice = generateIcebreaker(region);
      setMsgs([{ role: "assistant", text: ice }]);
    }
  }, []); // only on mount

  // Fetch weather per region + auto-refresh every 60s
  useEffect(() => {
    const fetchWx = () => {
      const c = COORDS[region] || COORDS.split;
      fetch(`/api/weather?lat=${c.lat}&lon=${c.lon}&loc=${c.loc}`)
        .then(r => r.json())
        .then(d => {
          if (d.current?.temp) {
            const w = { ...d.current, location: c.loc };
            setWeather(w); setWeatherTime(new Date());
            if (notifPerm === "granted") {
              const a = [];
              if (w.windSpeed > 35) a.push(w.windName + " " + w.windSpeed + " km/h!");
              if (w.seaLevel >= 4) a.push("More " + w.seaState);
              if (w.uv >= 9) a.push("UV " + w.uv + " — zaštita!");
              if (w.pressure < 1005) a.push("Tlak " + w.pressure + " hPa — oluja");
              const k = a.join("|");
              if (a.length && k !== lastAlert) { setLastAlert(k); try { new Notification("⚠️ JADRAN", { body: a.join("\n"), icon: "/icon-192.svg", tag: "wx-alert", renotify: true }); } catch {} }
            }
          }
        })
        .catch(() => {});
    };
    fetchWx();
    const interval = setInterval(fetchWx, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, [region]);

  // Fetch emergency alerts (fires, weather warnings) — every 5 min
  useEffect(() => {
    const fetchAlerts = () => {
      fetch("/api/alerts").then(r => r.json()).then(d => {
        if (d.alerts?.length) {
          // Filter to user's region if set
          const relevant = region
            ? d.alerts.filter(a => !a.region || a.region === region || a.severity === "critical")
            : d.alerts.filter(a => a.severity === "critical" || a.severity === "high");
          setEmergencyAlerts(relevant);
        } else {
          setEmergencyAlerts([]);
        }
      }).catch(() => {});
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // 5 min
    return () => clearInterval(interval);
  }, [region]);

  // Fetch DHMZ NAVTEX for sailing mode
  useEffect(() => {
    if (travelMode !== "sailing") return;
    fetch("/api/navtex").then(r => r.json()).then(d => { if (d.zones) setNavtex(d); }).catch(() => {});
  }, [travelMode]);

  // Fetch guide.js route intelligence (HERE Traffic + YOLO + weather)
  // Refreshes every 3 min (matches guide.js cache TTL)
  useEffect(() => {
    const fetchGuide = () => {
      try {
        const delta = loadDelta();
        const oCoords = delta.from_coords;
        const destLat = delta.destination?.lat;
        const destLng = delta.destination?.lng;
        const regCoords = COORDS[region] || COORDS.split;

        // Prefer full route (origin → destination). Fallback: destination-only (local conditions).
        const dLat = destLat || regCoords.lat;
        const dLng = destLng || regCoords.lon;
        // If no origin, use a generic Central Europe departure (Vienna) — still gets destination weather + local traffic
        const oLat = oCoords?.[0] || 48.21;
        const oLng = oCoords?.[1] || 16.37;
        const seg = delta.segment || travelMode || "auto";
        fetch(`/api/guide?oLat=${oLat}&oLng=${oLng}&dLat=${dLat}&dLng=${dLng}&seg=${seg}&lang=${lang}`)
          .then(r => r.json())
          .then(d => { if (d.cards?.length) setGuideCards(d.cards); })
          .catch(() => {});
      } catch {}
    };
    fetchGuide();
    const interval = setInterval(fetchGuide, 180000); // 3 min
    return () => clearInterval(interval);
  }, [travelMode, lang, region]);
  // Load ALL region images on mount (for visual picker grid)
  useEffect(() => {
    const cityMap = { split: "Split", makarska: "Makarska", dubrovnik: "Dubrovnik", zadar: "Zadar", istra: "Rovinj", kvarner: "Opatija" };
    for (const [rid, city] of Object.entries(cityMap)) {
      if (regionImgs[rid]) continue;
      fetch(`/api/cityimg?city=${encodeURIComponent(city)}`)
        .then(r => r.json()).then(d => { if (d.url) setRegionImgs(prev => ({ ...prev, [rid]: d.url })); })
        .catch(() => {});
    }
  }, []);

  // Check URL params: premium + niche mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("niche");
    if (n === "camper" || n === "local") { setNiche(n); if (n === "camper") setTravelMode("camper"); }
    if (n === "sailing") { setNiche(n); setTravelMode("sailing"); }
    if (n === "cruiser") { setNiche(n); setTravelMode("cruiser"); }
    if (n === "local") { setNiche(n); setTravelMode("apartment"); }
    if (params.get("premium") === "true") {
      setPremium(true);
      try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
    }
    // Detect invite link: jadran.ai/ai?invite=DEVICE_ID
    const inviteParam = params.get("invite");
    if (inviteParam && inviteParam.startsWith("jd_")) {
      try { localStorage.setItem("jadran_invited_by", inviteParam); } catch {}
      setInvitedBy(inviteParam);
      setShowInviteWelcome(true);
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
    }
    // Detect B2B partner QR: jadran.ai/ai?ref=JAD-RAB-001
    const refParam = params.get("ref");
    if (refParam && refParam.startsWith("JAD-")) {
      try { localStorage.setItem("jadran_partner_ref", refParam); } catch {}
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
    }
    // Check localStorage
    try {
      if (localStorage.getItem("jadran_ai_premium") === "1") {
        // Verify not expired
        const pp = localStorage.getItem("jadran_premium_plan");
        if (pp) {
          const plan = JSON.parse(pp);
          setPremiumPlan(plan);
          if (plan.expiresAt && plan.expiresAt < Date.now()) {
            // Premium expired — clean up
            localStorage.removeItem("jadran_ai_premium");
            setPremium(false);
            setTrialExpired(true);
          } else {
            setPremium(true);
          }
        } else {
          setPremium(true); // no plan data = trust the flag
        }
      }
      // Load message count
      const mc = parseInt(localStorage.getItem("jadran_msg_count") || "0");
      setMsgCount(mc);
      // IMMEDIATE: Check usage by IP (no fingerprint needed — catches incognito)
      fetch("/api/usage?fp=none").then(r => r.json()).then(d => {
        if (d && d.exhausted) {
          setMsgCount(FREE_MSGS); setTrialExpired(true);
          try { localStorage.setItem("jadran_msg_count", String(FREE_MSGS)); } catch {}
        } else if (d && d.count > mc) {
          setMsgCount(d.count);
          try { localStorage.setItem("jadran_msg_count", String(d.count)); } catch {}
          if (d.count >= 10) setTrialExpired(true);
        }
      }).catch(() => {});
      // Generate device fingerprint (survives incognito on same browser)
      getDeviceFingerprint().then(fp => {
        if (fp) {
          setDeviceFp(fp);
          let did = localStorage.getItem("jadran_device_id");
          if (!did) { did = fp; try { localStorage.setItem("jadran_device_id", fp); } catch {} }
        }
      });
      if (mc >= FREE_MSGS) setTrialExpired(true);
      // Firebase fallback — recover premium if localStorage was cleared
      if (localStorage.getItem("jadran_ai_premium") !== "1") {
        const deviceId = localStorage.getItem("jadran_device_id");
        if (deviceId) {
          // Lazy load Firebase only when needed (saves 345KB on initial load)
          Promise.all([import("./firebase.js"), import("firebase/firestore")]).then(([fbMod, fsMod]) => {
            fsMod.getDoc(fsMod.doc(fbMod.db, "jadran_premium", deviceId)).then(snap => {
              if (snap.exists()) {
                const d = snap.data();
                const rawExp = d.expiresAt;
                const expiresAt = rawExp?.toDate ? rawExp.toDate().getTime() : (typeof rawExp === "string" && rawExp.includes("T") ? new Date(rawExp).getTime() : parseInt(rawExp || "0"));
                if (expiresAt > Date.now()) {
                  setPremium(true); setTrialExpired(false); setMsgCount(0);
                  try {
                    localStorage.setItem("jadran_ai_premium", "1");
                    localStorage.removeItem("jadran_msg_count");
                    const premData = { plan: d.plan, days: parseInt(d.days || "7"), region: d.region || "all", expiresAt, purchasedAt: d.paidAt?.toDate ? d.paidAt.toDate().toISOString() : (typeof d.paidAt === "string" ? d.paidAt : new Date().toISOString()) };
                    localStorage.setItem("jadran_premium_plan", JSON.stringify(premData));
                    setPremiumPlan(premData);
                  } catch {}
                }
              }
            }).catch(() => {});
          }).catch(() => {});
        }
      }
    } catch {}
    // Also check ?payment=success from Stripe redirect — VERIFY server-side
    if (params.get("payment") === "success") {
      // Restore session state saved before Stripe redirect
      let savedSession = {};
      try {
        savedSession = JSON.parse(localStorage.getItem("jadran_session") || "{}");
        localStorage.removeItem("jadran_session");
      } catch {}
      // Fallback chain: savedSession → localStorage → defaults
      const restoredRegion = savedSession.region || localStorage.getItem("jadran_region") || "split";
      const restoredMode = savedSession.travelMode || localStorage.getItem("jadran_travelMode") || "apartment";
      setRegion(restoredRegion);
      setTravelMode(restoredMode);
      if (savedSession.lang) setLang(savedSession.lang);
      if (savedSession.niche) setNiche(savedSession.niche);
      const sessionId = params.get("session_id");
      const plan = params.get("plan") || "week";
      const days = params.get("days") || "7";
      const planRegion = params.get("region") || "all";
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
      if (sessionId) {
        setVerifyingPayment(true);
        fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, deviceId: localStorage.getItem("jadran_device_id") || "" }) })
          .then(r => r.json())
          .then(data => {
            if (data.paid) {
              setPremium(true);
              setTrialExpired(false);
              setMsgCount(0);
              trackPurchase(plan, plan === "vip" ? 49.99 : plan === "season" ? 19.99 : 9.99);
              try { localStorage.removeItem("jadran_msg_count"); } catch {}
              try {
                localStorage.setItem("jadran_ai_premium", "1");
                const premData = { plan, days: parseInt(days), region: planRegion, expiresAt: Date.now() + parseInt(days) * 86400000, purchasedAt: new Date().toISOString(), sessionId };
                localStorage.setItem("jadran_premium_plan", JSON.stringify(premData));
                setPremiumPlan(premData);
              } catch {}
              setShowSuccess(true);
              // Auto-enter chat after payment — guaranteed, with fallback region
              try {
                const ice = generateIcebreaker(restoredRegion); setMsgs([{ role: "assistant", text: ice }]); setStep("chat");
              } catch { setStep("chat"); }
            } else {
              console.error("Payment verification failed:", data);
              setShowPaywall(true);
            }
            setVerifyingPayment(false);
          })
          .catch(err => { console.error("Verify error:", err); setVerifyingPayment(false); setShowPaywall(true); });
      } else {
        // No session_id = forged URL, reject
        console.error("Payment URL without session_id — rejected");
      }
    }
    // Handle payment cancellation — reopen paywall
    if (params.get("payment") === "cancelled") {
      // Restore session state — same fallback chain as success
      try {
        const sess = JSON.parse(localStorage.getItem("jadran_session") || "{}");
        localStorage.removeItem("jadran_session");
        const cRegion = sess.region || localStorage.getItem("jadran_region") || "split";
        const cMode = sess.travelMode || localStorage.getItem("jadran_travelMode") || "apartment";
        setRegion(cRegion);
        setTravelMode(cMode);
        if (sess.lang) setLang(sess.lang);
        if (sess.niche) setNiche(sess.niche);
        const ice = generateIcebreaker(cRegion); setMsgs([{ role: "assistant", text: ice }]); setStep("chat");
      } catch {}
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
      setShowPaywall(true);
    }
    // Auto-open paywall from landing "KUPI ODMAH"
    if (params.get("buy") === "true") {
      setShowPaywall(true);
      window.history.replaceState({}, "", "/ai" + (n ? "?niche=" + n : ""));
    }
  }, []);

  // Fetch daily micro-news (cached 1h server-side)
  useEffect(() => {
    fetch(`/api/daily?lang=${lang}`).then(r => r.json()).then(d => {
      if (d?.text) setDailyNews(d);
    }).catch(() => {});
  }, [lang]);

  const t = T[lang] || T.en;

  // ─── STRIPE CHECKOUT ───
  // ═══ JADRAN LENS — compressed vision ═══
  const compressImage = (file, maxSize = 1024) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({ base64: dataUrl.split(",")[1], thumbUrl: dataUrl, mimeType: "image/jpeg" });
    };
    img.src = URL.createObjectURL(file);
  });

  const handlePhoto = async (e) => {
    // ── TIER GATE: Lens requires Season+ ──
    if (!can("lens")) { setUpsellFeature("lens"); setShowPaywall(true); e.target.value = ""; return; }
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const { base64, thumbUrl, mimeType } = await compressImage(file);
    setMsgs(p => [...p, { role: "user", text: "📸 Jadran Lens", image: thumbUrl }]);
    setLoading(true);

    try {
      const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";
      const modeCtx = travelMode === "camper" ? `Putuje kamperom${camperLen ? " (" + camperLen + "m)" : ""}.` : travelMode === "sailing" ? "Nautičar." : travelMode === "cruiser" ? "Putnik s kruzera — ograničeno vrijeme!" : "";
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType, lang, context: `Gost u regiji ${regionName}. ${modeCtx}`, deviceId: (() => { try { return localStorage.getItem("jadran_device_id") || ""; } catch { return ""; } })(), plan: currentTier }),
      });
      const data = await res.json();
      const text = data.text || "Nisam uspio analizirati sliku.";
      setMsgs(p => [...p, { role: "assistant", text }]);
      if (walkieMode) speak(text);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: t.errVision }]);
    }
    setLoading(false);
  };

  // ═══ WALKIE-TALKIE — hands-free mode ═══
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\[.*?\]\(.*?\)/g, "").replace(/[*#🔥⚠️📸🚨💎🌊⛵🚐🚢🏖️🍽️⛽🅿️💧🌅]/g, ""));
    u.lang = lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-US" : lang === "it" ? "it-IT" : "hr-HR";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const toggleWalkie = async () => {
    if (walkieMode) {
      setWalkieMode(false);
      if (wakeLock) { try { wakeLock.release(); } catch {} setWakeLock(null); }
      return;
    }
    // ── TIER GATE: Walkie requires Season+ ──
    if (!can("walkie")) { setUpsellFeature("walkie"); setShowPaywall(true); return; }
    setWalkieMode(true);
    // Screen Wake Lock — keep screen on while driving
    if ("wakeLock" in navigator) {
      try { const wl = await navigator.wakeLock.request("screen"); setWakeLock(wl); } catch {}
    }
  };

  const startVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setIsRecording(true);
    const r = new SR();
    r.lang = lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-US" : lang === "it" ? "it-IT" : lang === "hr" ? "hr-HR" : "hr-HR";
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setIsRecording(false);
      setInput(text);
      // Auto-send in walkie mode
      if (walkieMode) { setTimeout(() => document.querySelector("[data-send]")?.click(), 100); }
    };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    r.start();
  };

  const startCheckout = async (plan = "week") => {
    track("checkout_click", { plan, lang, region, niche });
    try { window.fbq?.("track", "AddPaymentInfo", { content_name: plan, currency: "EUR", value: plan === "vip" ? 49.99 : plan === "season" ? 19.99 : 9.99 }); } catch {}
    // Persist session state so it survives Stripe redirect
    try { localStorage.setItem("jadran_session", JSON.stringify({ region, travelMode, lang, niche })); } catch {}
    setPayLoading(true);
    try {
      // Generate/retrieve device ID for subscription binding
      let deviceId = deviceFp || localStorage.getItem("jadran_device_id");
      if (!deviceId) {
        deviceId = "jd_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      }
      try { localStorage.setItem("jadran_device_id", deviceId); } catch {}
      // Retrieve UTM params for Stripe metadata
      let utmData = {};
      try { utmData = JSON.parse(localStorage.getItem("jadran_utm") || "{}"); } catch {}
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: "AI-STANDALONE", guestName: "AI User", lang,
          returnPath: "/ai" + (niche ? "?niche=" + niche + "&lang=" + lang : "?lang=" + lang),
          plan, region: plan === "week" ? (region || "split") : "all",
          deviceId,
          utm_source: utmData.utm_source || "",
          utm_medium: utmData.utm_medium || "",
          utm_campaign: utmData.utm_campaign || "",
          partnerRef: (() => { try { return localStorage.getItem("jadran_partner_ref") || ""; } catch { return ""; } })(),
        }),
      });
      const data = await res.json();
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
      setPayLoading(false);
    }
  };

  // ─── AI CHAT ───
  const sendMsg = async () => {
    if (!input.trim() || loading) return;
    // ── OFFLINE GUARD — don't burn trial messages on network errors ──
    if (isOffline) {
      const offMsg = lang === "en" ? "No internet connection. Please check your signal and try again."
        : lang === "de" || lang === "at" ? "Keine Internetverbindung. Bitte Signal prüfen."
        : lang === "it" ? "Nessuna connessione internet. Controlla il segnale."
        : lang === "si" ? "Ni internetne povezave. Preverite signal."
        : lang === "cz" ? "Žádné připojení k internetu. Zkontrolujte signál."
        : lang === "pl" ? "Brak połączenia z internetem. Sprawdź sygnał."
        : "Nema internet veze. Provjeri signal i pokušaj ponovo.";
      setMsgs(prev => [...prev, { role: "assistant", text: "📡 " + offMsg }]);
      return;
    }
    if (!premium && trialExpired) { setShowPaywall(true); track("paywall_shown", { lang, region, niche }); return; }
    // Premium daily limit — cost control
    if (premium) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const dailyKey = "jadran_daily_" + today;
        const dailyCount = parseInt(localStorage.getItem(dailyKey) || "0") + 1;
        localStorage.setItem(dailyKey, String(dailyCount));
        // Clean old daily keys
        try { const yd = new Date(Date.now() - 86400000).toISOString().slice(0, 10); localStorage.removeItem("jadran_daily_" + yd); } catch {}
        const isVip = premiumPlan?.plan === "vip";
        const dailyLimit = gates.msgLimit;
        if (dailyCount >= dailyLimit) {
          setGlobalToast(lang === "en" ? "Daily message limit reached. Come back tomorrow!" : lang === "de" || lang === "at" ? "Tageslimit erreicht. Morgen geht's weiter!" : lang === "it" ? "Limite giornaliero raggiunto. Torna domani!" : "Dnevni limit poruka dosegnut. Vratite se sutra!");
          setTimeout(() => setGlobalToast(null), 4000);
          return;
        }
        if (dailyCount === Math.floor(dailyLimit * 0.8)) {
          setGlobalToast(lang === "en" ? `${dailyLimit - dailyCount} messages left today` : lang === "de" || lang === "at" ? `Noch ${dailyLimit - dailyCount} Nachrichten heute` : `Još ${dailyLimit - dailyCount} poruka danas`);
          setTimeout(() => setGlobalToast(null), 3000);
        }
      } catch {}
    }
    // Increment message counter for free users
    if (!premium) {
      const newCount = msgCount + 1;
      setMsgCount(newCount);
      try { localStorage.setItem("jadran_msg_count", String(newCount)); } catch {}
      // CRITICAL: Persist count to Firestore (survives incognito + cold starts)
      if (deviceFp) {
        fetch("/api/usage", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fp: deviceFp, action: "increment" })
        }).then(r => r.json()).then(d => {
          // If server count is higher (e.g. from other tab), sync up
          if (d && d.count > newCount) {
            setMsgCount(d.count);
            try { localStorage.setItem("jadran_msg_count", String(d.count)); } catch {}
            if (d.exhausted) setTrialExpired(true);
          }
        }).catch(() => {});
      }
      if (newCount === 1) {
        track("chat_start", { lang, region, niche });
        // Referral conversion: invited user asked first question → reward SHARER only
        const ib = invitedBy || localStorage.getItem("jadran_invited_by");
        if (ib) {
          let did = localStorage.getItem("jadran_device_id");
          if (!did) { did = "jd_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); localStorage.setItem("jadran_device_id", did); }
          fetch("/api/referral", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "convert", deviceId: did, invitedBy: ib }) })
            .then(r => r.json()).then(d => {
              if (d.ok && !d.already) {
                // Invited user (Klaus) gets NO premium — just a thank-you toast
                setGlobalToast(lang === "en" ? "🔗 Link accepted! Enjoy 3 free messages." : lang === "de" || lang === "at" ? "🔗 Link akzeptiert! 3 Nachrichten gratis." : lang === "it" ? "🔗 Link accettato! 3 messaggi gratis." : lang === "si" ? "🔗 Povezava sprejeta! 3 brezplačna sporočila." : lang === "cz" ? "🔗 Odkaz přijat! 3 zprávy zdarma." : lang === "pl" ? "🔗 Link zaakceptowany! 3 darmowe wiadomości." : "🔗 Link prihvaćen! 3 besplatne poruke.");
                setTimeout(() => setGlobalToast(null), 4000);
                try { localStorage.removeItem("jadran_invited_by"); } catch {}
              }
            }).catch(() => {});
        }
      }
      track("msg_sent", { msg_number: newCount, lang, niche });
      if (newCount >= FREE_MSGS) { setTrialExpired(true); }
    }

    const msg = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text: msg }]);
    setLoading(true);
    // trial active — no decrement

    const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";

    // Build affiliate link catalog (still needed — these are real URLs)
    const regionExps = filterByRegion(EXPERIENCES, region).slice(0, 8);
    const dubLinks = region === "dubrovnik" ? DUBROVNIK_INTEL.filter(d => d.link).map(d => `• ${d.spot} → [${d.spot}](${d.link})`) : [];
    const warnLinks = filterByRegion(CAMPER_WARNINGS, region).filter(w => w.link).map(w => `• ${w.name} → [${w.name}](${w.link})`);
    const linkCatalog = [
      ...regionExps.map(e => `• ${e.name} (~${e.price}€, ${e.dur}) → [${e.name} — od ${e.price}€](${e.link})`),
      ...dubLinks, ...warnLinks,
    ].join("\n");

    // Nautical data (only built if needed — saves tokens)
    const regionMarinas = MARINAS.filter(m => m.region === region).slice(0, 4);
    const regionAnchors = ANCHORAGES.filter(a => a.region === region).slice(0, 4);
    const cruisePort = CRUISE_PORTS.find(p => p.region === region);
    const marinaCatalog = travelMode === "sailing" ? regionMarinas.map(m =>
      `• ${m.name}: ${m.berths} vezova, max ${m.maxLen}, ${m.price}, gorivo:${m.fuel?"da":"ne"}, VHF ${m.vhf}. ${m.note}`
    ).join("\n") : "";
    const anchorCatalog = travelMode === "sailing" ? regionAnchors.map(a =>
      `• ${a.name}: dubina ${a.depth}, dno ${a.bottom}, zaštita od ${a.shelter}, ${a.fee}. ${a.note}`
    ).join("\n") : "";
    const cruiseCtx = travelMode === "cruiser" && cruisePort ? `LUKA: ${cruisePort.name}\nTerminal: ${cruisePort.terminal}, shuttle: ${cruisePort.shuttle}\nMUST-SEE: ${cruisePort.mustSee}\nIZBJEGAVAJ: ${cruisePort.avoid}\nHRANA: ${cruisePort.foodTip}\nSHOPPING: ${cruisePort.shopping}\nPLAN DANA: ${cruisePort.timePlan}` : "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Dynamic routing — backend assembles prompt from Lego blocks
          mode: travelMode || "default",
          plan: currentTier,
          promoCode: promoCode || undefined,
          deviceId: deviceFp || (() => { try { return localStorage.getItem("jadran_device_id") || ""; } catch { return ""; } })(),
          walkieMode: walkieMode || undefined,
          camperLen: camperLen || undefined,
          camperHeight: camperHeight || undefined,
          region,
          lang,
          weather: weather || null,
          linkCatalog,
          marinaCatalog: marinaCatalog || undefined,
          anchorCatalog: anchorCatalog || undefined,
          cruiseCtx: cruiseCtx || undefined,
          navtexData: travelMode === "sailing" && navtex ? (() => {
            const zone = navtex.regionZoneMap?.[region] || "srednji";
            const parts = [];
            if (navtex.warning) parts.push(`⚠️ UPOZORENJE: ${navtex.warning}`);
            if (navtex.zones?.[zone]) parts.push(`PROGNOZA (${zone} Jadran): ${navtex.zones[zone]}`);
            const st = navtex.stations?.find(s => s.place === (navtex.regionStationMap?.[region] || "Split"));
            if (st) parts.push(`POSTAJA ${st.place}: vjetar ${st.wind} čv, more ${st.sea}, vidljivost ${st.visibility} km, tlak ${st.pressure} hPa, ${st.conditions}`);
            return parts.join("\n");
          })() : undefined,
          userProfile: (() => { const p = loadProfile(); p.niche = travelMode || niche; p.region = region; return p; })(),
          emergencyAlerts: (emergencyAlerts.length && can("guardian")) ? emergencyAlerts.map(a => ({ type: a.type, severity: a.severity, region: a.region, title: a.title, description: a.description, count: a.count, source: a.source, url: a.url })).slice(0, 5) : undefined,
          delta_context: (() => { try { const d = loadDelta(); return d.segment ? d : undefined; } catch { return undefined; } })(),
          guide_cards: guideCards.length ? guideCards.slice(0, 8) : undefined,
          messages: [...msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      // Server-side exhaustion check — triggers paywall even in incognito
      if (data._exhausted || res.status === 429) {
        setTrialExpired(true);
        setMsgCount(FREE_MSGS);
        try { localStorage.setItem("jadran_msg_count", String(FREE_MSGS)); } catch {}
        setShowPaywall(true);
      }
      const aiText = data.content?.map(c => c.text || "").join("") || data.error?.message || "⚠️ Pokušajte ponovno.";
      setMsgs(p => [...p, { role: "assistant", text: aiText }]);
      // Self-learning: extract signals and update profile
      updateProfile(msg, aiText);
      if (walkieMode) speak(aiText);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: t.errConnection }]);
    }
    setLoading(false);
  };

  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  const C = isNight ? {
    bg: "#0a1628", accent: "#0ea5e9", gold: "#f59e0b", text: "#f0f9ff",
    mut: "#7dd3fc", bord: "rgba(14,165,233,0.08)", card: "rgba(12,28,50,0.7)",
    heroBg: "linear-gradient(160deg, #0a1628, #0e3a5c 50%, #134e6f)",
    chatBg: "linear-gradient(160deg, #0a1628, #0e3a5c)",
    inputBg: "rgba(255,255,255,0.04)",
  } : {
    bg: "#e8f4fc", accent: "#0284c7", gold: "#d97706", text: "#0c2d48",
    mut: "#4b7a99", bord: "rgba(12,74,110,0.1)", card: "rgba(255,255,255,0.7)",
    heroBg: "linear-gradient(160deg, #dbeef9 0%, #b8dff5 30%, #87ceeb 60%, #e0f2fe 100%)",
    chatBg: "linear-gradient(160deg, #e0f2fe, #bae6fd 50%, #dbeef9)",
    inputBg: "rgba(12,74,110,0.04)",
  };

  // ═══ PAYWALL MODAL ═══
  const paywallJsx = showPaywall && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 300, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "min(10dvh, 60px) 24px 24px" }}
      onClick={() => { setShowPaywall(false); setUpsellFeature(null); setShowRecovery(false); setRecoveryStatus(null); setRecoveryEmail(""); }}>
      <div onClick={e => e.stopPropagation()} style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "28px 20px", maxWidth: 480, width: "100%", border: "1px solid rgba(245,158,11,0.1)", maxHeight: "90dvh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔒</div>
          {/* Upsell context — which feature triggered paywall */}
          {upsellFeature && (() => {
            const upsellText = {
              walkie: { de: "🎙️ Walkie-Talkie ist ein Season Pass Feature", en: "🎙️ Walkie-Talkie is a Season Pass feature", it: "🎙️ Walkie-Talkie è una funzione Season Pass", hr: "🎙️ Walkie-Talkie zahtijeva Season Pass" },
              lens: { de: "📸 Jadran Lens ist ein Season Pass Feature", en: "📸 Jadran Lens is a Season Pass feature", it: "📸 Jadran Lens è una funzione Season Pass", hr: "📸 Jadran Lens zahtijeva Season Pass" },
              guardian: { de: "🛡️ Travel Guardian ist ein Season Pass Feature", en: "🛡️ Travel Guardian is a Season Pass feature", it: "🛡️ Travel Guardian è una funzione Season Pass", hr: "🛡️ Travel Guardian zahtijeva Season Pass" },
            }[upsellFeature] || {};
            const txt = upsellText[lang] || upsellText[lang === "at" ? "de" : "hr"] || upsellText.en || "";
            return txt ? <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 11, fontWeight: 600, color: C.gold, marginBottom: 12 }}>{txt}</div> : null;
          })()}
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>
            {lang === "de" || lang === "at" ? "Deine kostenlose Testphase ist abgelaufen" : lang === "en" ? "Your free trial has expired" : lang === "it" ? "La tua prova gratuita è scaduta" : lang === "si" ? "Brezplačno obdobje je poteklo" : lang === "cz" ? "Bezplatné období vypršelo" : lang === "pl" ? "Bezpłatny okres próbny wygasł" : "Tvoj besplatni probni period je istekao"}
          </div>
          <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.5 }}>
            {lang === "de" || lang === "at" ? "Sichere deinen Urlaub. Vermeide Strafen, Staus und Stürme bis Ende der Saison." : lang === "en" ? "Secure your holiday. Avoid fines, traffic jams and storms until end of season." : lang === "it" ? "Proteggi la tua vacanza. Evita multe, code e tempeste fino a fine stagione." : "Osiguraj svoj odmor. Izbjegni kazne, gužve i oluje do kraja sezone."}
          </div>
        </div>
        {/* ═══ 3-TIER DECOY PRICING CARDS ═══ */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, alignItems: "stretch", boxSizing: "border-box" }}>
          {/* ── EXPLORER (Anchor Low — designed to feel incomplete) ── */}
          <button onClick={() => startCheckout("week")} disabled={payLoading}
            style={{ flex: 1, padding: "14px 8px 12px", borderRadius: 16, border: `1px solid ${C.bord}`, background: isNight ? C.card : "rgba(255,255,255,0.8)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", opacity: 0.9 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.opacity = "1"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.opacity = "0.9"; }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 4 }}>EXPLORER</div>
            <div style={{ fontSize: 22, fontWeight: 300, color: C.accent }}>9.99€</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.mut, marginBottom: 6 }}>{lang === "de" || lang === "at" ? "pro Woche" : lang === "en" ? "per week" : lang === "it" ? "a settimana" : "tjedno"}</div>
            <div style={{ fontSize: 8, color: C.mut, marginBottom: 6, fontStyle: "italic" }}>{lang === "de" || lang === "at" ? "Nur Basisinformationen" : lang === "en" ? "Basic info only" : lang === "it" ? "Solo info di base" : "Samo osnovne info"}</div>
            <div style={{ fontSize: 9, color: C.mut, lineHeight: 1.9, textAlign: "left", flex: 1 }}>
              ✅ {lang === "de" || lang === "at" ? "Chat mit AI-Assistent" : lang === "en" ? "AI assistant chat" : lang === "it" ? "Chat con assistente AI" : "Chat s AI asistentom"}<br/>
              ✅ {lang === "de" || lang === "at" ? "Restaurants & Strände" : lang === "en" ? "Restaurants & beaches" : lang === "it" ? "Ristoranti e spiagge" : "Restorani i plaže"}<br/>
              <span style={{ color: isNight ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.6)" }}>❌ {lang === "de" || lang === "at" ? "Kein Sturmwarner" : lang === "en" ? "No storm/fire alerts" : lang === "it" ? "No allerte meteo" : "Bez upozorenja"}</span><br/>
              <span style={{ color: isNight ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.6)" }}>❌ {lang === "de" || lang === "at" ? "Kein Walkie-Talkie" : lang === "en" ? "No Walkie-Talkie" : lang === "it" ? "No Walkie-Talkie" : "Bez Walkie-Talkie"}</span><br/>
              <span style={{ color: isNight ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.6)" }}>❌ {lang === "de" || lang === "at" ? "Kein Jadran Lens" : lang === "en" ? "No Jadran Lens" : lang === "it" ? "No Jadran Lens" : "Bez Jadran Lens"}</span>
            </div>
          </button>
          {/* ── SEASON PASS (Golden Goose — pre-selected, THE target) ── */}
          <button onClick={() => startCheckout("season")} disabled={payLoading}
            style={{ flex: 1.3, padding: "16px 10px 14px", borderRadius: 18, border: "2px solid rgba(245,158,11,0.6)", background: isNight ? "rgba(245,158,11,0.08)" : "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", position: "relative", overflow: "hidden", transition: "all 0.2s", display: "flex", flexDirection: "column", transform: "scale(1.04)", boxShadow: "0 6px 24px rgba(245,158,11,0.2)", zIndex: 1 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.9)"; e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(245,158,11,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(245,158,11,0.2)"; }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "4px 0", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 2, textAlign: "center" }}>
              ⭐ {lang === "de" || lang === "at" ? "AM BELIEBTESTEN" : lang === "en" ? "MOST POPULAR" : lang === "it" ? "PIÙ POPOLARE" : "NAJPOPULARNIJE"}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 1, marginTop: 18, marginBottom: 4 }}>SEASON PASS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.gold }}>19.99€</div>
            <div style={{ fontSize: 9, fontWeight: 600, color: C.gold, marginBottom: 6 }}>{lang === "de" || lang === "at" ? "bis Oktober · alle Regionen" : lang === "en" ? "until October · all regions" : lang === "it" ? "fino a ottobre · tutte" : "do oktobra · sve regije"}</div>
            <div style={{ fontSize: 9, color: C.text, lineHeight: 1.9, textAlign: "left", flex: 1, fontWeight: 500 }}>
              ✅ {lang === "de" || lang === "at" ? "Alles aus Explorer" : lang === "en" ? "Everything in Explorer" : lang === "it" ? "Tutto da Explorer" : "Sve iz Explorera"}<br/>
              🛡️ <strong style={{ color: C.gold }}>Travel Guardian</strong>: {lang === "de" || lang === "at" ? "Sturm · Feuer · Grenze" : lang === "en" ? "storms · fires · borders" : lang === "it" ? "tempeste · incendi · confini" : "oluje · požari · granica"}<br/>
              📸 <strong>Jadran Lens</strong>: {lang === "de" || lang === "at" ? "Strafen vermeiden" : lang === "en" ? "avoid €60 fines" : lang === "it" ? "evita multe €60" : "izbjegni kaznu 60€"}<br/>
              🎙️ <strong>Walkie-Talkie</strong>: {lang === "de" || lang === "at" ? "Sicher nutzen beim Fahren" : lang === "en" ? "use safely while driving" : lang === "it" ? "usa in sicurezza alla guida" : "bezbedno koristi u vožnji"}
            </div>
          </button>
          {/* ── VIP PRIORITY (Price Anchor — makes 19.99 feel cheap) ── */}
          <button onClick={() => startCheckout("vip")} disabled={payLoading}
            style={{ flex: 1, padding: "14px 8px 12px", borderRadius: 16, border: "1px solid rgba(168,85,247,0.12)", background: isNight ? "rgba(168,85,247,0.03)" : "rgba(168,85,247,0.03)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.2s", display: "flex", flexDirection: "column", opacity: 0.8 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.35)"; e.currentTarget.style.opacity = "0.95"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.12)"; e.currentTarget.style.opacity = "0.8"; }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", letterSpacing: 1, marginBottom: 4 }}>VIP PRIORITY</div>
            <div style={{ fontSize: 22, fontWeight: 300, color: "#a855f7" }}>49.99€</div>
            <div style={{ fontSize: 9, color: C.mut, marginBottom: 6 }}>{lang === "de" || lang === "at" ? "bis Oktober · Priorität" : lang === "en" ? "until October · priority" : lang === "it" ? "fino a ottobre · priorità" : "do oktobra · prioritet"}</div>
            <div style={{ fontSize: 9, color: C.mut, lineHeight: 1.9, textAlign: "left", flex: 1 }}>
              ✅ {lang === "de" || lang === "at" ? "Alles aus Season Pass" : lang === "en" ? "Everything in Season" : lang === "it" ? "Tutto da Season" : "Sve iz Season Passa"}<br/>
              ⚡ {lang === "de" || lang === "at" ? "300 Nachrichten/Tag" : lang === "en" ? "300 messages/day" : lang === "it" ? "300 messaggi/giorno" : "300 poruka/dan"}<br/>
              🏆 {lang === "de" || lang === "at" ? "Ausführlichere Antworten" : lang === "en" ? "More detailed answers" : lang === "it" ? "Risposte dettagliate" : "Detaljniji odgovori"}
            </div>
          </button>
        </div>
        {payLoading && <div style={{ textAlign: "center", fontSize: 13, color: C.accent, marginBottom: 8 }}>⏳ {t.payLoading}</div>}
        {/* Payment methods + security */}
        <div style={{ textAlign: "center", marginTop: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            {["VISA","Mastercard","Apple Pay","Google Pay"].map(m => (
              <span key={m} style={{ padding: "3px 8px", borderRadius: 6, background: isNight ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`, fontSize: 9, color: C.mut, fontWeight: 500 }}>{m}</span>
            ))}
          </div>
          <div style={{ fontSize: 9, color: C.mut }}>🔒 {t.paySecure}</div>
          <div style={{ fontSize: 8, color: C.mut, marginTop: 4 }}>{lang === "en" ? "Prices incl. VAT" : lang === "de" || lang === "at" ? "Preise inkl. MwSt." : lang === "it" ? "Prezzi IVA inclusa" : "Cijene uklj. PDV"} · SIAL Consulting d.o.o.</div>
        </div>

        {/* ═══ RECOVERY FLOW — above referral, easy to reach ═══ */}
        {!showRecovery ? (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => { setShowRecovery(true); setRecoveryStatus(null); setRecoveryError(""); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "6px 12px", textDecoration: "underline", opacity: 0.8 }}>{t.payRecover}</button>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", marginTop: 8, borderRadius: 12, background: isNight ? "rgba(14,165,233,0.06)" : "rgba(14,165,233,0.04)", border: `1px solid ${isNight ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.1)"}` }}>
            {recoveryStatus === "success" ? (
              <div style={{ textAlign: "center", color: "#22c55e", fontSize: 13, fontWeight: 600, padding: 8 }}>{t.payRecoverOk}</div>
            ) : (
              <>
                <div style={{ fontSize: 11, color: C.mut, marginBottom: 8 }}>{t.payRecoverEmail}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    value={recoveryEmail}
                    onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${recoveryStatus === "error" || recoveryStatus === "expired" ? "#ef4444" : C.bord}`, background: isNight ? "rgba(255,255,255,0.08)" : "#fff", color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none" }}
                    onFocus={e => { setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300); }}
                    onKeyDown={e => { if (e.key === "Enter") document.getElementById("jadran-recover-btn")?.click(); }}
                  />
                  <button
                    id="jadran-recover-btn"
                    disabled={recoveryStatus === "loading" || !recoveryEmail.includes("@")}
                    onClick={() => {
                      setRecoveryStatus("loading"); setRecoveryError("");
                      const did = localStorage.getItem("jadran_device_id") || deviceFp || "jd_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8);
                      try { localStorage.setItem("jadran_device_id", did); } catch {}
                      fetch("/api/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recoveryEmail.trim(), deviceId: did }) })
                        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d })))
                        .then(({ ok, status, data }) => {
                          if (ok && data.recovered) {
                            setRecoveryStatus("success");
                            setPremium(true); setTrialExpired(false); setMsgCount(0);
                            try {
                              localStorage.setItem("jadran_ai_premium", "1");
                              localStorage.removeItem("jadran_msg_count");
                              const premData = { plan: data.plan, days: data.days, region: data.region, expiresAt: data.expiresAt, purchasedAt: data.paidAt };
                              localStorage.setItem("jadran_premium_plan", JSON.stringify(premData));
                              setPremiumPlan(premData);
                            } catch {}
                            setTimeout(() => { setShowPaywall(false); setShowRecovery(false); }, 1500);
                          } else {
                            setRecoveryStatus(status === 410 ? "expired" : "error");
                            setRecoveryError(status === 410 ? t.payRecoverExpired : (data.error || t.payRecoverFail));
                          }
                        })
                        .catch(() => { setRecoveryStatus("error"); setRecoveryError(t.payRecoverFail); });
                    }}
                    style={{ padding: "12px 18px", borderRadius: 10, border: "none", background: recoveryStatus === "loading" ? C.mut : C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: recoveryStatus === "loading" ? "wait" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: !recoveryEmail.includes("@") ? 0.5 : 1 }}
                  >{recoveryStatus === "loading" ? "..." : t.payRecoverBtn}</button>
                </div>
                {recoveryError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6, textAlign: "center" }}>{recoveryError}</div>}
              </>
            )}
          </div>
        )}

        {/* ═══ REFERRAL SHARE — Smart Exit ═══ */}
        {(() => {
          let did; try { did = localStorage.getItem("jadran_device_id"); } catch {} if (!did) return null;
          const inviteUrl = `https://jadran.ai/ai?invite=${did}`;
          const shareText = lang === "de" || lang === "at"
            ? `Leute, hab eine geniale KI für Kroatien gefunden. Löst Camper-Parkplätze, Fähren und findet versteckte Konobas ohne Touristenpreise. Probiert es kostenlos — 3 Fragen gratis: ${inviteUrl}`
            : lang === "en"
            ? `Found an amazing AI for Croatia trips. Solves camper parking, ferries and finds hidden restaurants without tourist prices. Try it free — 3 questions on the house: ${inviteUrl}`
            : lang === "it"
            ? `Ho trovato un'IA geniale per la Croazia. Risolve parcheggi camper, traghetti e trova ristoranti nascosti. Provatelo gratis — 3 domande omaggio: ${inviteUrl}`
            : `Ljudi, našao sam genijalan AI za Hrvatsku. Rješava parkinge za kampere, trajekte i nalazi skrivene konobe bez turističkih cijena. Probajte besplatno — 3 pitanja gratis: ${inviteUrl}`;
          return (
            <div style={{ marginTop: 16, padding: "16px", borderRadius: 14, background: isNight ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.06)", border: `1px solid ${isNight ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.15)"}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", marginBottom: 6 }}>
                🎁 {lang === "en" ? "Share & earn 24h Premium!" : lang === "de" || lang === "at" ? "Teilen & 24h Premium verdienen!" : lang === "it" ? "Condividi & guadagna 24h Premium!" : "Podijeli i osvoji 24h Premium!"}
              </div>
              <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5, marginBottom: 12 }}>
                {lang === "en" ? "Share your link. When a friend asks their first question, YOU get 24h Premium free." : lang === "de" || lang === "at" ? "Teile deinen Link. Wenn ein Freund seine erste Frage stellt, bekommst DU 24h Premium gratis." : lang === "it" ? "Condividi il tuo link. Quando un amico fa la prima domanda, TU ricevi 24h Premium gratis." : "Podijeli svoj link. Kada prijatelj postavi prvo pitanje, TI dobivaš 24h Premium besplatno."}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank"); track("referral_share", { channel: "whatsapp" }); }} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  🟢 {lang === "en" ? "Send via WhatsApp" : lang === "de" || lang === "at" ? "Per WhatsApp senden" : lang === "it" ? "Invia su WhatsApp" : "Pošalji na WhatsApp"}
                </button>
                <button onClick={() => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}&quote=${encodeURIComponent(shareText)}`, "_blank"); track("referral_share", { channel: "facebook" }); }} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "#1877F2", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  🔵 {lang === "en" ? "Share in Facebook group" : lang === "de" || lang === "at" ? "In Facebook-Gruppe teilen" : lang === "it" ? "Condividi nel gruppo Facebook" : "Podijeli u Facebook grupu"}
                </button>
                <button onClick={() => { navigator.clipboard?.writeText(inviteUrl).then(() => { setReferralToast(lang === "en" ? "Link copied!" : lang === "de" || lang === "at" ? "Link kopiert!" : lang === "it" ? "Link copiato!" : "Link kopiran!"); setTimeout(() => setReferralToast(null), 2000); }); track("referral_share", { channel: "copy" }); }} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.bord}`, background: "transparent", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  🔗 {referralToast || (lang === "en" ? "Copy your secret link" : lang === "de" || lang === "at" ? "Deinen geheimen Link kopieren" : lang === "it" ? "Copia il tuo link segreto" : "Kopiraj svoj tajni link")}
                </button>
              </div>
            </div>
          );
        })()}
        <button onClick={() => { setShowPaywall(false); setUpsellFeature(null); setShowRecovery(false); setRecoveryStatus(null); setRecoveryEmail(""); }} style={{ width: "100%", background: "none", border: "none", color: C.mut, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 8 }}>{t.payLater}</button>
        <div style={{ textAlign: "center", marginTop: 4 }}>
          <a href="/" target="_blank" rel="noopener" style={{ fontSize: 8, color: C.mut, opacity: 0.6, textDecoration: "none" }}>{lang === "en" ? "Terms & Privacy" : lang === "de" || lang === "at" ? "Impressum & Datenschutz" : lang === "it" ? "Termini e Privacy" : "Uvjeti i privatnost"}</a>
        </div>
      </div>
    </div>
  );

  // ═══ INVITE WELCOME — what the referred friend sees ═══
  const inviteWelcomeJsx = showInviteWelcome && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 280, display: "grid", placeItems: "center", padding: 24 }}
      onClick={() => setShowInviteWelcome(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "32px 24px", maxWidth: 420, width: "100%", border: "1px solid rgba(34,197,94,0.15)", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🍻</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          {lang === "en" ? "A friend shared this guide with you!" : lang === "de" || lang === "at" ? "Ein Freund hat dir diesen Guide empfohlen!" : lang === "it" ? "Un amico ti ha consigliato questa guida!" : "Prijatelj ti preporučuje ovog vodiča!"}
        </div>
        <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.5, marginBottom: 20 }}>
          {lang === "en" ? "No installation. No credit card. Just ask your digital co-pilot anything about the perfect Adriatic holiday." : lang === "de" || lang === "at" ? "Keine Installation. Keine Kreditkarte. Frag deinen digitalen Copiloten alles über den perfekten Adria-Urlaub." : lang === "it" ? "Nessuna installazione. Nessuna carta di credito. Chiedi tutto sulla vacanza perfetta in Adriatico." : "Nema instalacije. Nema kreditne kartice. Pitaj svog digitalnog suvozača što god ti treba za savršen odmor na Jadranu."}
        </div>
        <button onClick={() => setShowInviteWelcome(false)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display',Georgia,serif", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
          {lang === "en" ? "Start exploring" : lang === "de" || lang === "at" ? "Los geht's!" : lang === "it" ? "Inizia a esplorare" : "Započni istraživanje"}
        </button>
      </div>
    </div>
  );

  // ═══ PAYMENT VERIFICATION OVERLAY ═══
  // ═══ EMERGENCY ALERT BANNER ═══
  const AlertBanner = () => {
    if (!emergencyAlerts.length) return null;
    const top = emergencyAlerts[0];
    const isCritical = top.severity === "critical";
    const isHigh = top.severity === "high";
    const bgColor = isCritical ? "rgba(220,38,38,0.95)" : isHigh ? "rgba(245,158,11,0.95)" : "rgba(14,165,233,0.9)";
    const icon = top.type === "fire" ? "🔥" : top.type === "wind" ? "💨" : top.type === "heat" ? "🌡️" : top.type === "storm" ? "⛈️" : top.type === "flood" ? "🌊" : top.type === "snow" ? "❄️" : top.type === "coastal" ? "🌊" : top.type === "travel_advisory" ? "🇩🇪" : "⚠️";
    const regionName = REGIONS.find(r => r.id === top.region)?.name || top.region || "";

    const alertTypeMap = {
      road_closure: { de: "Straßensperrung", en: "Road closure", it: "Chiusura stradale", hr: "Zatvaranje ceste" },
      ferry_cancelled: { de: "Fähre gestrichen", en: "Ferry cancelled", it: "Traghetto cancellato", hr: "Trajekt otkazan" },
      bura_closure: { de: "Bora — Straße gesperrt", en: "Bora wind — road closed", it: "Bora — strada chiusa", hr: "Bura — cesta zatvorena" },
      traffic_jam: { de: "Stau", en: "Traffic jam", it: "Ingorgo", hr: "Zastoj" },
      roadworks: { de: "Baustelle", en: "Roadworks", it: "Lavori stradali", hr: "Radovi na cesti" },
      wind: { de: "Windwarnung", en: "Wind warning", it: "Avviso vento", hr: "Upozorenje na vjetar" },
      storm: { de: "Sturmwarnung", en: "Storm warning", it: "Avviso tempesta", hr: "Upozorenje na oluju" },
      heat: { de: "Hitzewarnung", en: "Heat warning", it: "Avviso caldo", hr: "Upozorenje na vrućinu" },
      flood: { de: "Hochwasserwarnung", en: "Flood warning", it: "Avviso alluvione", hr: "Upozorenje na poplavu" },
    };
    const alertLang = (lang === "de" || lang === "at") ? "de" : (lang === "en" ? "en" : lang === "it" ? "it" : "hr");
    const alertText = top.type === "fire"
      ? (lang === "de" || lang === "at" ? `Waldbrand ${regionName} — ${top.count || 1} Herd(e) erkannt` : lang === "en" ? `Wildfire ${regionName} — ${top.count || 1} hotspot(s) detected` : lang === "it" ? `Incendio ${regionName} — ${top.count || 1} focolaio(i)` : `Požar ${regionName} — ${top.count || 1} žarište(a) detektirano`)
      : (alertTypeMap[top.type]?.[alertLang] ? `${alertTypeMap[top.type][alertLang]}${regionName ? " — " + regionName : ""}` : top.title ? top.title : (lang === "en" ? "Weather warning active" : lang === "de" || lang === "at" ? "Wetterwarnung aktiv" : lang === "it" ? "Allerta meteo attiva" : "Vremensko upozorenje aktivno"));

    return (
      <div style={{ background: bgColor, color: "#fff", padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", animation: isCritical ? "alertPulse 2s infinite" : "none" }}
        onClick={() => { if (!can("guardian")) { setUpsellFeature("guardian"); setShowPaywall(true); return; } if (top.type === "fire") window.open("https://firms.modaps.eosdis.nasa.gov/map/#d:24hrs;@" + (top.lon || 16) + "," + (top.lat || 43) + ",9z", "_blank"); else window.open("https://www.meteoalarm.org/en/live/region/HR", "_blank"); }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1 }}>{alertText}</span>
        {!can("guardian") && <span style={{ padding: "2px 6px", borderRadius: 6, background: "rgba(255,255,255,0.2)", fontSize: 9 }}>🛡️ {lang === "de" || lang === "at" ? "Upgrade" : "Upgrade"}</span>}
        {emergencyAlerts.length > 1 && <span style={{ opacity: 0.7, fontSize: 10 }}>+{emergencyAlerts.length - 1}</span>}
        <span style={{ fontSize: 10, opacity: 0.7 }}>112</span>
      </div>
    );
  };

  const VerifyingOverlay = () => verifyingPayment && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 350, display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "40px 32px", maxWidth: 360, width: "100%", textAlign: "center", border: `1px solid ${C.bord}` }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${C.accent}`, borderTopColor: "transparent", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          {lang === "en" ? "Verifying payment..." : lang === "de" || lang === "at" ? "Zahlung wird überprüft..." : lang === "it" ? "Verifica pagamento..." : "Provjeravamo uplatu..."}
        </div>
        <div style={{ fontSize: 12, color: C.mut }}>Stripe</div>
      </div>
    </div>
  );

  // ═══ POST-PURCHASE SUCCESS MODAL ═══
  const SuccessModal = () => showSuccess && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 400, display: "grid", placeItems: "center", padding: 24 }}
      onClick={() => setShowSuccess(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "32px 24px", maxWidth: 440, width: "100%", border: "1px solid rgba(34,197,94,0.15)", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.1)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 32 }}>✅</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 6 }}>{t.upgraded || "Premium otključan!"}</div>
        <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600, marginBottom: 16 }}>⭐ {premiumPlan?.plan === "season" ? t.paySeason : t.payWeek} · {premiumPlan?.days || 30} {t.wxDays || "dana"}</div>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: isNight ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.06)", marginBottom: 16, fontSize: 13, lineHeight: 2, color: C.text, textAlign: "left" }}>
          ✅ {(t.payFeatures || "").split("|")[0]}<br/>
          ✅ {(t.payFeatures || "").split("|")[1]}<br/>
          ✅ {(t.payFeatures || "").split("|")[2]}<br/>
          ✅ {(t.payFeatures || "").split("|")[3]}
        </div>
        <div style={{ padding: "12px 16px", borderRadius: 12, background: isNight ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${C.bord}`, marginBottom: 16, fontSize: 11, color: C.mut, textAlign: "left" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>🧾 {lang === "en" ? "Payment details" : lang === "de" || lang === "at" ? "Zahlungsdetails" : lang === "it" ? "Dettagli pagamento" : "Detalji plaćanja"}</div>
          <div>Stripe · {premiumPlan?.plan === "vip" ? "49.99€" : premiumPlan?.plan === "season" ? "19.99€" : "9.99€"}</div>
          <div>{premiumPlan?.purchasedAt ? new Date(premiumPlan.purchasedAt).toLocaleDateString(lang === "de" || lang === "at" ? "de-AT" : lang === "en" ? "en-GB" : "hr-HR", { day: "numeric", month: "long", year: "numeric" }) : ""}</div>
          <div style={{ marginTop: 4, fontSize: 10 }}>{lang === "en" ? "Receipt sent to your email by Stripe" : lang === "de" || lang === "at" ? "Rechnung per E-Mail von Stripe" : lang === "it" ? "Ricevuta inviata da Stripe via email" : "Račun poslan na email putem Stripe"}</div>
        </div>
        <button onClick={() => { setShowSuccess(false); if (step === "setup") { const ice = generateIcebreaker(); setMsgs([{ role: "assistant", text: ice }]); setStep("chat"); window.scrollTo(0, 0); } }}
          style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display',Georgia,serif", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}>
          {lang === "en" ? "Start exploring →" : lang === "de" ? "Los geht's →" : lang === "at" ? "Los geht's! →" : lang === "it" ? "Inizia a esplorare →" : "Započnite istraživanje →"}
        </button>
      </div>
    </div>
  );


  // ═══ ICE-BREAKER — context-aware welcome message ═══
  const generateIcebreaker = (overrideRegion) => {
    const h = new Date().getHours();
    const activeRegion = overrideRegion || region;
    const regionName = REGIONS.find(r => r.id === activeRegion)?.name || "Jadran";
    const isCamperMode = travelMode === "camper" || niche === "camper";
    const isSailing = travelMode === "sailing" || niche === "sailing";
    const isCruiser = travelMode === "cruiser" || niche === "cruiser";
    const w = weather;
    const wxLine = w ? `${w.temp}°C, ${t.wxSea || "more"} ${w.sea}°C, ${t.wxWind || "vjetar"} ${w.windDir || ""} ${w.windSpeed || ""} km/h.` : "";

    let isReturning = false;
    try {
      const lastVisit = localStorage.getItem("jadran_last_chat");
      const vc = parseInt(localStorage.getItem("jadran_visit_count") || "0");
      localStorage.setItem("jadran_visit_count", String(vc + 1));
      // Update profile visit count
      const prof = loadProfile();
      prof.visits = vc + 1;
      if (!prof.firstVisit) prof.firstVisit = Date.now();
      saveProfile(prof);
      localStorage.setItem("jadran_last_chat", Date.now().toString());
      if (lastVisit && (Date.now() - parseInt(lastVisit)) / 3600000 >= 4) isReturning = true;
    } catch {}

    if (isReturning) {
      return `${t.iceBack} ${regionName}. ${wxLine}\n\n${t.iceWhat}? ${h < 12 ? t.iceBeach : h < 17 ? t.iceActivity : t.iceDinner}.`;
    }

    if (w && w.windSpeed > 40) {
      return `${t.iceWelcome} ${regionName}. ${w.windSpeed} km/h — ${t.wxProtection || "oprez"}.\n\n${t.iceWhatInterest}`;
    }

    if (h >= 17 && h < 21) {
      return `${t.iceEvening} ${t.iceWelcome} ${regionName}. ${wxLine}\n\n${t.iceWhat} — ${t.iceDinner}?`;
    }

    if (h >= 6 && h < 10) {
      return `${t.iceMorning} ${t.iceWelcome} ${regionName}. ${wxLine}\n\n${t.iceWhat} — ${t.iceBeach}?`;
    }

    if (isCamperMode) {
      return `${t.iceWelcome} ${regionName}. ${t.iceCamperIntro}\n\n${wxLine}\n\n${t.iceWhatFirst} — ${t.iceParkingQ}`;
    }
    if (isSailing) {
      return `${t.iceWelcome} ${regionName}. ${t.iceSailIntro}\n\n${wxLine}\n\n${t.iceMarinaQ}`;
    }
    if (isCruiser) {
      return `${t.iceWelcome} ${regionName}. ${t.iceCruiseIntro}\n\n${wxLine}\n\n${t.iceCruiseQ}`;
    }
    return `${t.iceWelcome} ${regionName}. ${t.iceGenericIntro}\n\n${wxLine} ${t.iceWhatInterest}`;
  };

  // ═══ CAMPER-SPECIFIC QUICK QUESTIONS ═══
  const camperQuick = travelMode === "camper" ? [
    "🅿️ Gdje mogu legalno parkirati kamper?",
    "💧 Najbliža pumpa za vodu?",
    "🚿 Dump station u blizini?",
    "🏖️ Plaže pristupačne kamperima?",
    "⛽ Cijene goriva na ruti?",
    "🌙 Preporuka za noćenje?",
  ] : travelMode === "sailing" ? [
    "⚓ Najbolja marina u blizini?",
    "🌬️ Kakav je vjetar danas?",
    `🍽️ ${t.qKonoba}`,
    "⛽ Gdje napuniti gorivo?",
    "🏝️ Zaštićeno sidrište?",
    "🌊 Stanje mora i prognoze?",
  ] : travelMode === "cruiser" ? [
    "🗺️ Optimalan plan dana za 8h?",
    "🍽️ Gdje jesti lokalno i jeftino?",
    "📸 Najbolja lokacija za fotku?",
    "🛍️ Što kupiti kao suvenir?",
    "⚠️ Što izbjegavati?",
    "🏖️ Najbliža plaža od luke?",
  ] : [];

  const defaultQuick = [
    `🏖️ ${t.qBeach}`,
    "🍽️ Lokalna konoba za večeru?",
    `🗺️ ${t.qVisit}`,
    "☀️ Kakvo je vrijeme?",
  ];

  const quickQs = [...camperQuick.slice(0, 3), ...defaultQuick.slice(0, camperQuick.length ? 1 : 4)];

  // ═══ SETUP SCREEN ═══
  if (step === "setup") return (
    <div style={{ minHeight: "100dvh", background: C.heroBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 24px", paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => window.location.href = "/"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.bord}`, background: C.card, color: C.mut, fontSize: 16, cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.color = C.mut; }}>‹</button>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700, color: C.accent, letterSpacing: 2 }}>JADRAN.AI</div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{ padding: "5px 8px", background: isNight ? "rgba(12,28,50,0.5)" : "rgba(255,255,255,0.5)", border: `1px solid ${C.bord}`, borderRadius: 10, cursor: "pointer", fontSize: 18, lineHeight: 1, display: "flex", alignItems: "center", gap: 3 }}>
              {curFlag}<span style={{ fontSize: 9, color: C.mut }}>▾</span>
            </button>
            {langOpen && <>
              <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
              <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 999, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, padding: 6, background: isNight ? "rgba(10,22,40,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderRadius: 10, border: `1px solid ${C.bord}`, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }} style={{ padding: "6px 8px", background: lang === l.code ? `${C.accent}18` : "transparent", border: lang === l.code ? `1px solid ${C.accent}40` : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "all 0.15s" }}>{l.flag}</button>
                ))}
              </div>
            </>}
          </div>
        </div>

        {/* Niche photo hero — always visible when niche set */}
        {niche && (
          <div
            onClick={() => { if (!premium) startCheckout("season"); }}
            onTouchEnd={(e) => { if (!premium) { e.preventDefault(); startCheckout("season"); } }}
            role="button" tabIndex={0}
            style={{
              borderRadius: 18, position: "relative", overflow: "hidden", minHeight: 80,
              cursor: premium ? "default" : "pointer",
              WebkitTapHighlightColor: "rgba(245,158,11,0.2)",
              border: premium ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(245,158,11,0.25)", marginBottom: 24,
              boxShadow: premium ? "0 0 20px rgba(34,197,94,0.08)" : "0 0 20px rgba(245,158,11,0.08), 0 0 60px rgba(245,158,11,0.04)",
              transition: "all 0.3s", zIndex: 1,
            }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${niche === "camper" ? "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=600&q=75" : niche === "sailing" ? "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600&q=75" : niche === "cruiser" ? "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=75" : "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=75"})`, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${niche === "camper" ? "rgba(245,158,11,0.7)" : niche === "sailing" ? "rgba(6,182,212,0.65)" : niche === "cruiser" ? "rgba(168,85,247,0.65)" : "rgba(14,165,233,0.65)"} 0%, rgba(15,23,42,0.88) 100%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative", padding: "20px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                  {niche === "camper" ? t.nicCamper : niche === "sailing" ? t.nicSailing : niche === "cruiser" ? t.nicCruiser : t.nicLocal}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
                  {niche === "camper" ? t.nicCamperSub : niche === "sailing" ? t.nicSailingSub : niche === "cruiser" ? t.nicCruiserSub : t.nicLocalSub}
                </div>
              </div>
              {premium
                ? <div style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>⭐ PREMIUM</div>
                : <div style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", fontWeight: 800, fontSize: 12, flexShrink: 0, boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}>19.99€ →</div>
              }
            </div>
          </div>
        )}

        {/* J logo + title — only when no niche (direct /ai) */}
        {!niche && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>J</div>
              <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, color: C.text }}>JADRAN</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>{t.title}</div>
            <div style={{ fontSize: 14, color: C.mut }}>{t.sub}</div>
          </div>
        )}

        {/* Camper size picker — only for camper niche */}
        {niche === "camper" && (
          <div style={{ marginBottom: 24, padding: "16px", borderRadius: 16, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <div style={{ fontSize: 11, color: C.gold, letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>{t.gabariti}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>{t.camperLength || "Dužina (m)"}</div>
                <input value={camperLen} onChange={e => setCamperLen(e.target.value)} placeholder={t.camperPlaceholderLen || "npr. 7.5"}
                  type="number" step="0.1" min="4" max="15"
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>{t.camperHeight || "Visina (m)"}</div>
                <input value={camperHeight} onChange={e => setCamperHeight(e.target.value)} placeholder={t.camperPlaceholderH || "npr. 3.2"}
                  type="number" step="0.1" min="1.5" max="5"
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.mut, marginTop: 8, textAlign: "center" }}>
              {camperLen && camperHeight ? t.gabaritiFeedback.replace("{len}",camperLen).replace("{h}",camperHeight) : t.gabaritiHint}
            </div>
          </div>
        )}

        {/* Travel mode — only if no niche set (direct /ai access) */}
        {!niche && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: C.mut, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{t.mode}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {TRAVEL_MODES.map(m => (
                <div key={m.id} onClick={() => { setTravelMode(m.id); track("niche_selected", { mode: m.id }); }} style={{
                  padding: "16px 12px", borderRadius: 16, textAlign: "center", cursor: "pointer",
                  background: travelMode === m.id ? "rgba(14,165,233,0.12)" : C.card,
                  border: `1px solid ${travelMode === m.id ? "#0ea5e9" : C.bord}`,
                  transition: "all 0.2s", transform: travelMode === m.id ? "scale(1.03)" : "scale(1)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{m.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Region — 3x2 visual grid with Wikipedia images */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.mut, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{t.region}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {REGIONS.map(r => {
              const isSelected = region === r.id;
              const hasImg = !!regionImgs[r.id];
              return (
              <div key={r.id} onClick={() => {
                setRegion(r.id);
                track("region_selected", { region: r.id });
                if (travelMode) {
                  const ice = generateIcebreaker(r.id);
                  setMsgs([{ role: "assistant", text: ice }]);
                  setStep("chat");
                  window.scrollTo(0, 0);
                }
              }} style={{
                borderRadius: 16, cursor: "pointer", position: "relative", overflow: "hidden",
                aspectRatio: "1 / 1",
                border: isSelected ? "2px solid #0ea5e9" : `1px solid ${C.bord}`,
                background: C.card,
                transition: "all 0.2s",
                boxShadow: isSelected ? "0 4px 16px rgba(14,165,233,0.25)" : "none",
                transform: isSelected ? "scale(1.03)" : "scale(1)",
              }}>
                {/* Background image */}
                {hasImg && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${regionImgs[r.id]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: isSelected ? 0.9 : 0.7, transition: "opacity 0.3s" }} />}
                {/* Gradient overlay */}
                <div style={{ position: "absolute", inset: 0, background: isNight
                  ? `linear-gradient(180deg, rgba(10,22,40,${isSelected ? "0.05" : "0.15"}) 0%, rgba(10,22,40,0.82) 65%)`
                  : `linear-gradient(180deg, rgba(255,255,255,${isSelected ? "0" : "0.05"}) 0%, rgba(255,255,255,${isSelected ? "0.55" : "0.75"}) 65%)`
                }} />
                {/* Content */}
                <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "10px 10px 12px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#0ea5e9" : C.text, lineHeight: 1.2 }}>{r.name}</div>
                  <div style={{ fontSize: 9, color: C.mut, lineHeight: 1.3, marginTop: 2, opacity: 0.8 }}>{r.desc}</div>
                </div>
                {/* Selected checkmark */}
                {isSelected && <div style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", background: "#0ea5e9", display: "grid", placeItems: "center", fontSize: 12, color: "#fff" }}>✓</div>}
              </div>
              );
            })}
          </div>
        </div>

        {/* Start — only shows if no niche (direct /ai access, mode not auto-set) */}
        {!niche && (
          <button onClick={() => { if (region && travelMode) { const ice = generateIcebreaker(); setMsgs([{ role: "assistant", text: ice }]); setStep("chat"); window.scrollTo(0, 0); } }}
            disabled={!region || !travelMode}
            style={{
              width: "100%", padding: "18px", borderRadius: 18, border: "none",
              background: region && travelMode ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : (isNight ? "rgba(255,255,255,0.06)" : "rgba(12,74,110,0.08)"),
              color: "#fff", fontSize: 17, fontWeight: 600, cursor: region && travelMode ? "pointer" : "not-allowed",
              opacity: region && travelMode ? 1 : 0.4,
              fontFamily: "'Playfair Display',Georgia,serif",
              boxShadow: region && travelMode ? "0 6px 24px rgba(14,165,233,0.25)" : "none",
            }}>
            {t.start} →
          </button>
        )}

        {/* Free tier note */}
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: isNight ? "rgba(255,255,255,0.3)" : "rgba(12,74,110,0.35)" }}>
          {t.freeNote}
        </div>

        {/* ═══ DIRECT BUY — skip trial, buy premium immediately ═══ */}
        {!premium && (
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <button onClick={() => startCheckout("week")}
              style={{
                flex: 1, padding: "14px 10px", borderRadius: 14, border: `1px solid ${C.accent}40`,
                background: isNight ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.06)",
                cursor: "pointer", textAlign: "center", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.accent}40`; e.currentTarget.style.transform = "scale(1)"; }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>9.99€</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginTop: 2 }}>{lang === "en" ? "Explorer" : lang === "de" || lang === "at" ? "Explorer" : lang === "it" ? "Explorer" : "Explorer"}</div>
              <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>{lang === "en" ? "One region" : lang === "de" || lang === "at" ? "Eine Region" : lang === "it" ? "Una regione" : "Jedna regija"}</div>
            </button>
            <button onClick={() => startCheckout("season")}
              style={{
                flex: 1, padding: "14px 10px", borderRadius: 14,
                border: "1px solid rgba(245,158,11,0.4)",
                background: isNight ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                cursor: "pointer", textAlign: "center", position: "relative", overflow: "hidden", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "scale(1)"; }}>
              <div style={{ position: "absolute", top: 6, right: 6, fontSize: 8, fontWeight: 700, color: "#0f172a", background: C.gold, padding: "2px 6px", borderRadius: 6 }}>
                {lang === "en" ? "BEST VALUE" : lang === "de" || lang === "at" ? "BEST PREIS" : lang === "it" ? "MIGLIORE" : "NAJBOLJE"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>19.99€</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginTop: 2 }}>{lang === "en" ? "Full Season" : lang === "de" || lang === "at" ? "Ganze Saison" : lang === "it" ? "Tutta Stagione" : "Cijela Sezona"}</div>
              <div style={{ fontSize: 9, color: C.mut, marginTop: 2 }}>{lang === "en" ? "All regions · 30 days" : lang === "de" || lang === "at" ? "Alle Regionen · 30 Tage" : lang === "it" ? "Tutte regioni · 30 giorni" : "Sve regije · 30 dana"}</div>
            </button>
          </div>
        )}

        {/* ═══ SOCIAL PROOF + VALUE PROP ═══ */}
        {!premium && (
          <div style={{ marginTop: 20, padding: "16px", borderRadius: 16, background: isNight ? "rgba(245,158,11,0.03)" : "rgba(245,158,11,0.04)", border: `1px solid ${isNight ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.1)"}` }}>
            {/* Stats row — verifiable market data */}
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>6</div>
                <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1 }}>{lang === "de" || lang === "at" ? "REGIONEN" : lang === "en" ? "REGIONS" : lang === "it" ? "REGIONI" : "REGIJA"}</div>
              </div>
              <div style={{ width: 1, background: C.bord }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>8</div>
                <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1 }}>{lang === "de" || lang === "at" ? "SPRACHEN" : lang === "en" ? "LANGUAGES" : lang === "it" ? "LINGUE" : "JEZIKA"}</div>
              </div>
              <div style={{ width: 1, background: C.bord }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>24/7</div>
                <div style={{ fontSize: 9, color: C.mut, letterSpacing: 1 }}>{lang === "de" || lang === "at" ? "VERFÜGBAR" : lang === "en" ? "AVAILABLE" : lang === "it" ? "DISPONIBILE" : "DOSTUPNO"}</div>
              </div>
            </div>
            {/* Use case example */}
            <div style={{ padding: "12px 14px", borderRadius: 12, background: isNight ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.gold, fontWeight: 600, letterSpacing: 1, marginBottom: 6 }}>
                {lang === "de" || lang === "at" ? "DAS KANN IHR GUIDE" : lang === "en" ? "WHAT YOUR GUIDE DOES" : lang === "it" ? "COSA FA LA GUIDA" : "ŠTO VAŠ VODIČ RADI"}
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                {niche === "camper" ? (lang === "de" || lang === "at" ? "Tunnel-Höhen, Camper-Stellplätze, Dump-Stations, Bura-Warnungen — alles in Echtzeit." : lang === "en" ? "Tunnel heights, camper parking, dump stations, Bura warnings — all in real-time." : "Visine tunela, kamper parkinge, dump statione, upozorenja na buru — sve u realnom vremenu.")
                : niche === "sailing" ? (lang === "de" || lang === "at" ? "DHMZ-Prognose, NAVTEX, Marinas, Ankerplätze, Windvorhersage — direkt im Chat." : lang === "en" ? "DHMZ forecast, NAVTEX, marinas, anchorages, wind forecast — right in the chat." : "DHMZ prognoza, NAVTEX, marine, sidrišta, prognoza vjetra — direktno u chatu.")
                : niche === "cruiser" ? (lang === "de" || lang === "at" ? "Minutengenauer Plan für Ihren Hafentag. Restaurants, Sehenswürdigkeiten, Rückweg zum Schiff." : lang === "en" ? "Minute-by-minute plan for your port day. Restaurants, sights, route back to ship." : "Plan po minutu za vaš dan u luci. Restorani, znamenitosti, povratak na brod.")
                : (lang === "de" || lang === "at" ? "Versteckte Buchten, lokale Konobas, Parkplätze, Wetter — alles was Google nicht weiß." : lang === "en" ? "Hidden coves, local konobas, parking, weather — everything Google doesn't know." : "Skrivene uvale, lokalne konobe, parking, vrijeme — sve što Google ne zna.")}
              </div>
            </div>
            {/* Urgency */}
            <div style={{ textAlign: "center", fontSize: 11, color: C.gold, fontWeight: 600 }}>
              {lang === "en" ? "Season price valid until June 1" : lang === "de" || lang === "at" ? "Saisonpreis gültig bis 1. Juni" : lang === "it" ? "Prezzo stagionale valido fino al 1° giugno" : "Sezonska cijena do 1. lipnja"}
            </div>
          </div>
        )}

        {/* ═══ DAILY — live Adriatic micro-news from Gemini ═══ */}
        {dailyNews && (
          <div style={{
            marginTop: 20, padding: "16px 18px", borderRadius: 16,
            background: isNight ? "rgba(14,165,233,0.04)" : "rgba(14,165,233,0.06)",
            border: `1px solid ${isNight ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.12)"}`,
          }}>
            <div style={{ fontSize: 9, color: C.accent, letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>
              {lang === "en" ? "ADRIATIC TODAY" : lang === "de" || lang === "at" ? "ADRIA HEUTE" : lang === "it" ? "ADRIATICO OGGI" : "JADRAN DANAS"}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{dailyNews.ic}</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{dailyNews.text}</div>
            </div>
            <div style={{ fontSize: 9, color: C.mut, marginTop: 10, textAlign: "right" }}>
              {dailyNews.date} · jadran.ai
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", padding: "20px 24px 32px", opacity: 0.3 }}>
        <div style={{ fontSize: 9, color: C.mut, letterSpacing: 0.5 }}>{"\u00A9"} 2026 SIAL Consulting d.o.o. {"\u00B7"} All rights reserved.</div>
      </div>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::selection { background: rgba(14,165,233,0.3); }`}</style>
    </div>
  );

  // ═══ CHAT SCREEN ═══
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: C.chatBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>

      {/* Header */}
      <div style={{ padding: "14px 20px", paddingTop: "max(14px, env(safe-area-inset-top, 14px))", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.bord}`, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
          <button onClick={() => { setStep("setup"); window.scrollTo(0, 0); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.bord}`, background: "transparent", color: C.text, fontSize: 16, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>‹</button>
          <div style={{ width: 1, height: 20, background: C.bord, flexShrink: 0 }} />
          <span style={{ fontSize: 18, flexShrink: 0 }}>{TRAVEL_MODES.find(m => m.id === travelMode)?.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "30vw" }}>{REGIONS.find(r => r.id === region)?.name}</span>
          {weather && <span style={{ fontSize: 11, color: C.mut, marginLeft: 2, whiteSpace: "nowrap", flexShrink: 1, overflow: "hidden" }}>{weather.icon} {weather.temp}° · 🌊 {weather.sea}°</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {(travelMode === "camper" || travelMode === "sailing") && (
            <button onClick={toggleWalkie} style={{ padding: "4px 10px", borderRadius: 10, background: walkieMode ? "rgba(34,197,94,0.12)" : "transparent", border: `1px solid ${walkieMode ? "rgba(34,197,94,0.2)" : C.bord}`, color: walkieMode ? "#22c55e" : C.mut, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {walkieMode ? "📻 ON" : can("walkie") ? "📻" : "📻🔒"}
            </button>
          )}
          {premium
            ? <span style={{ padding: "4px 12px", borderRadius: 12, background: premiumPlan?.plan === "vip" ? "rgba(168,85,247,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${premiumPlan?.plan === "vip" ? "rgba(168,85,247,0.12)" : "rgba(245,158,11,0.12)"}`, color: premiumPlan?.plan === "vip" ? "#a855f7" : C.gold, fontSize: 10, fontWeight: 600 }}>⭐ {premiumPlan?.plan === "vip" ? (t.tierVip || "VIP") : premiumPlan?.plan === "season" ? (t.tierSeason || "SEZONA") : (t.tierExplorer || "EXPLORER")} {premiumPlan ? (() => { const ms = premiumPlan.expiresAt - nowMs; const d = Math.ceil(ms / 86400000); return d > 1 ? d + "d" : d === 1 ? "24h" : Math.max(0, Math.ceil(ms / 3600000)) + "h"; })() : ""}</span>
            : <button onClick={() => trialExpired ? setShowPaywall(true) : null} disabled={payLoading} style={{ padding: trialExpired ? "6px 14px" : "4px 12px", borderRadius: 12, background: trialExpired ? "linear-gradient(135deg, #ef4444, #dc2626)" : "rgba(52,211,153,0.08)", border: trialExpired ? "none" : "1px solid rgba(52,211,153,0.12)", color: trialExpired ? "#fff" : "#34d399", fontSize: trialExpired ? 11 : 10, fontWeight: trialExpired ? 700 : 600, cursor: trialExpired ? "pointer" : "default", fontFamily: "inherit", boxShadow: trialExpired ? "0 2px 8px rgba(239,68,68,0.3)" : "none" }}>
                {trialExpired ? `⭐ ${t.buyNow || "KUPI"}` : `${FREE_MSGS - msgCount}/${FREE_MSGS}`}
              </button>
          }
        </div>
      </div>

      {/* Emergency Alert Banner */}
      <AlertBanner />
      <style>{`@keyframes alertPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>

      {/* Messages */}
      <div ref={scrollBox} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0", display: "flex", flexDirection: "column" }}>

        {/* ═══ JADRAN VIBE — Maritime Dashboard ═══ */}
        {msgs.length > 0 && weather && (
          <div style={{ flexShrink: 0, borderBottom: `1px solid ${C.bord}` }}>
            {/* LIVE location label */}
            <div style={{ padding: "6px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px rgba(34,197,94,0.5)", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 600, letterSpacing: 2 }}>LIVE</span>
                <span style={{ fontSize: 9, color: C.mut }}>📍 {weather.location || "Jadran"}</span>
              </div>
              <span style={{ fontSize: 9, color: C.mut }}>{weatherTime ? weatherTime.toLocaleTimeString("hr", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
            </div>
            <div style={{ padding: "10px 12px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4, boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 300 }}>{weather.icon} {weather.temp}°</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{t.wxFeels} {weather.feelsLike}°</div>
                </div>
                <div style={{ width: 1, height: 28, background: C.bord }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: C.accent }}>🌊 {weather.sea}°</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{weather.seaEmoji} {weather.seaState || t.wxSea || "more"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: weather.windSpeed > 40 ? "#f87171" : C.text }}>{weather.windName || weather.windDir}</div>
                  <div style={{ fontSize: 8, color: weather.windSpeed > 40 ? "#fca5a5" : C.mut }}>{weather.windSpeed} km/h{weather.gusts > weather.windSpeed + 10 ? ` (${weather.gusts})` : ""}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: weather.uv >= 8 ? "#f87171" : weather.uv >= 5 ? C.gold : "#4ade80" }}>UV {weather.uv}</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{weather.uv >= 8 ? t.wxProtection : weather.uv >= 5 ? t.wxSpf : t.wxLowRisk}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.gold }}>🌅 {weather.sunset}</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{t.wxSunset}</div>
                </div>
              </div>
            </div>
            {/* Maritime detail row */}
            <div style={{ padding: "2px 12px 8px", display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {weather.waveHeight > 0 && <span style={{ fontSize: 10, color: C.mut }}>{t.wxWaves} {weather.waveHeight}m {weather.wavePeriod ? `/ ${weather.wavePeriod}s` : ""}</span>}
              <span style={{ fontSize: 10, color: C.mut }}>{t.wxPressure} {weather.pressure} hPa {weather.pressure < 1010 ? "↓" : weather.pressure > 1020 ? "↑" : "—"}</span>
              <span style={{ fontSize: 10, color: C.mut }}>{t.wxHumidity} {weather.humidity}%</span>
              {weather.swellHeight > 0.1 && <span style={{ fontSize: 10, color: C.mut }}>🌊 swell {weather.swellHeight}m</span>}
            </div>
            {/* Warning bar if dangerous conditions */}
            {(weather.windSpeed > 35 || weather.seaLevel >= 4 || weather.uv >= 9) && (
              <div style={{ padding: "6px 16px", background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.1)", fontSize: 11, color: "#f87171", fontWeight: 600, textAlign: "center" }}>
                ⚠️ {weather.windSpeed > 35 ? `${weather.windName} ${weather.windSpeed} km/h — oprez za kampere!` : ""} {weather.seaLevel >= 4 ? `More ${weather.seaState}!` : ""} {weather.uv >= 9 ? "UV ekstreman — zaštita obavezna!" : ""}
              </div>
            )}
          </div>
        )}

        {msgs.length === 0 && (
          <div style={{ padding: 0 }}>
            {/* ═══ VIBE JADRANA — MARITIME DASHBOARD ═══ */}

            {weather ? <div style={{ padding: "0 0 8px" }}>
              {/* Header */}
              <div style={{ padding: "16px 16px 12px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 9, letterSpacing: 5, color: "#22c55e", fontWeight: 600 }}>LIVE</span>
                  <span style={{ fontSize: 9, letterSpacing: 3, color: C.accent, fontWeight: 600 }}>VIBE JADRANA</span>
                </div>
                <div style={{ fontFamily: "'Playfair Display','Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700 }}>
                  {travelMode === "camper" ? t.vibeCamper : travelMode === "sailing" ? t.vibeSailing : t.vibeTitle}
                </div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 4 }}>
                  📍 {weather.location || "Jadran"} · Ažurirano {weatherTime ? weatherTime.toLocaleTimeString("hr", { hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
                {notifPerm === "default" && "Notification" in window && (
                  <button onClick={async () => { const p = await Notification.requestPermission(); setNotifPerm(p); if (p === "granted") new Notification("✅ JADRAN", { body: "Upozorenja za vjetar i more su aktivna.", icon: "/icon-192.svg" }); }}
                    style={{ marginTop: 8, padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.accent}30`, background: "transparent", color: C.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    🔔 {t.notifBtn}
                  </button>
                )}
                {notifPerm === "granted" && <div style={{ marginTop: 6, fontSize: 10, color: "#22c55e" }}>🔔 {t.notifOn}</div>}
              </div>

              {/* Main cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 12px", marginBottom: 8 }}>
                {/* SEA STATE — big card */}
                <div style={{ gridColumn: "1 / -1", padding: "16px", borderRadius: 16, background: `linear-gradient(135deg, ${weather.seaLevel <= 1 ? "rgba(34,197,94,0.08)" : weather.seaLevel <= 3 ? "rgba(250,204,21,0.08)" : "rgba(239,68,68,0.08)"}, transparent)`, border: `1px solid ${weather.seaLevel <= 1 ? "rgba(34,197,94,0.15)" : weather.seaLevel <= 3 ? "rgba(250,204,21,0.12)" : "rgba(239,68,68,0.2)"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 4 }}>STANJE MORA</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: weather.seaLevel <= 1 ? "#22c55e" : weather.seaLevel <= 3 ? "#facc15" : "#ef4444" }}>
                        {weather.seaEmoji} {weather.seaState}
                      </div>
                      <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>
                        Valovi {weather.waveHeight}m · period {weather.wavePeriod}s · smjer {weather.waveDir}
                      </div>
                      {weather.swellHeight > 0.1 && <div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>Swell {weather.swellHeight}m iz {weather.swellDir || "—"} ({weather.swellPeriod || "—"}s)</div>}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>{weather.sea}°</div>
                      <div style={{ fontSize: 9, color: C.mut }}>MORE</div>
                      <div style={{ fontSize: 10, color: weather.sea >= 24 ? "#22c55e" : weather.sea >= 20 ? "#facc15" : C.mut, marginTop: 2 }}>
                        {weather.sea >= 24 ? "☀️ savršeno" : weather.sea >= 20 ? "👍 ugodno" : weather.sea >= 16 ? "🥶 svježe" : "❄️ hladno"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WIND — with Adriatic name */}
                <div style={{ padding: "14px", borderRadius: 14, background: C.card, border: `1px solid ${weather.windSpeed > 35 ? "rgba(239,68,68,0.2)" : C.bord}` }}>
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>VJETAR</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: weather.windSpeed > 35 ? "#f87171" : C.text }}>{weather.windName || "—"}</div>
                  <div style={{ fontSize: 12, color: C.mut }}>{weather.windDir} {weather.windSpeed} km/h</div>
                  <div style={{ fontSize: 11, color: C.mut }}>udari {weather.gusts} km/h</div>
                  <div style={{ fontSize: 10, color: weather.windSpeed > 35 ? "#fca5a5" : C.accent, marginTop: 4 }}>
                    Bf {weather.beaufort || Math.round(weather.windSpeed / 8)} · {weather.windDesc || ""}
                  </div>
                </div>

                {/* TEMPERATURE */}
                <div style={{ padding: "14px", borderRadius: 14, background: C.card, border: `1px solid ${C.bord}` }}>
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>{t.wxTemp || 'TEMPERATURA'}</div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: C.text }}>{weather.icon} {weather.temp}°</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{t.wxFeels} {weather.feelsLike}°</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{t.wxCloud} {weather.cloudCover || "—"}%</div>
                </div>

                {/* UV + SUN */}
                <div style={{ padding: "14px", borderRadius: 14, background: C.card, border: `1px solid ${C.bord}` }}>
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>UV INDEX</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: weather.uv >= 8 ? "#ef4444" : weather.uv >= 5 ? "#f59e0b" : "#22c55e" }}>
                    {weather.uv}
                  </div>
                  <div style={{ fontSize: 11, color: C.mut }}>
                    {weather.uv >= 8 ? t.wxProtection : weather.uv >= 5 ? t.wxSpf : t.wxLowRisk}
                  </div>
                  <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>
                    opeklina za {weather.uv >= 8 ? "~15 min" : weather.uv >= 5 ? "~25 min" : "45+ min"}
                  </div>
                </div>

                {/* PRESSURE + HUMIDITY */}
                <div style={{ padding: "14px", borderRadius: 14, background: C.card, border: `1px solid ${C.bord}` }}>
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>BAROMETAR</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: C.text }}>
                    {weather.pressure} <span style={{ fontSize: 10, color: C.mut }}>hPa</span>
                  </div>
                  <div style={{ fontSize: 11, color: weather.pressure < 1010 ? "#f59e0b" : "#22c55e" }}>
                    {weather.pressure < 1008 ? "↓ pad — promjena" : weather.pressure < 1013 ? "↓ blagi pad" : weather.pressure > 1020 ? "↑ stabilno" : "— normalan"}
                  </div>
                  <div style={{ fontSize: 11, color: C.mut, marginTop: 3 }}>{t.wxHumidity} {weather.humidity}%</div>
                </div>
              </div>

              {/* Sunrise/Sunset bar */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20, padding: "8px 16px 4px" }}>
                <span style={{ fontSize: 12, color: C.mut }}>🌅 izlazak {weather.sunrise}</span>
                <span style={{ fontSize: 12, color: C.gold }}>🌇 zalazak {weather.sunset}</span>
              </div>

              {/* Warning banner if conditions are dangerous */}
              {(weather.windSpeed > 35 || weather.seaLevel >= 4 || weather.uv >= 9) && (
                <div style={{ margin: "8px 12px", padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#f87171", fontWeight: 700 }}>
                    ⚠️ {weather.windSpeed > 35 ? `${weather.windName} ${weather.windSpeed} km/h — oprez za kampere!` : ""} {weather.seaLevel >= 4 ? `More ${weather.seaState}!` : ""} {weather.uv >= 9 ? "UV ekstreman!" : ""}
                  </div>
                </div>
              )}

              {/* Lučka kapetanija note */}
              <div style={{ textAlign: "center", padding: "4px 16px 8px" }}>
                <div style={{ fontSize: 9, color: isNight ? "rgba(255,255,255,0.15)" : "rgba(12,74,110,0.2)", letterSpacing: 1 }}>
                  {t.wxData}: Open-Meteo Marine API · {t.wxLocation}: {weather.location || "Jadran"} · {t.wxRefresh}
                </div>
              </div>

              {/* ═══ DHMZ NAVTEX — only in sailing mode ═══ */}
              {travelMode === "sailing" && navtex && (() => {
                const zone = navtex.regionZoneMap?.[region] || "srednji";
                const forecast = navtex.zones?.[zone] || "";
                const station = navtex.stations?.find(s => s.place === (navtex.regionStationMap?.[region] || "Split"));
                const detailed = navtex.jadranDetailed?.[zone] || "";
                return (
                  <div style={{ margin: "0 12px 8px", borderRadius: 16, border: `1px solid ${isNight ? "rgba(6,182,212,0.15)" : "rgba(6,182,212,0.2)"}`, background: isNight ? "rgba(6,182,212,0.03)" : "rgba(6,182,212,0.04)", overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ padding: "10px 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>⚓</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#06b6d4", letterSpacing: 2 }}>DHMZ NAVTEX</span>
                      </div>
                      <a href="https://meteo.hr/prognoze.php?section=prognoze_specp&param=pomorci" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: C.mut, textDecoration: "none" }}>meteo.hr →</a>
                    </div>

                    {/* Warning banner */}
                    {navtex.warning && (
                      <div style={{ padding: "6px 14px", background: "rgba(245,158,11,0.08)", borderTop: "1px solid rgba(245,158,11,0.1)", fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                        ⚠️ {navtex.warning}
                      </div>
                    )}

                    {/* Zone forecast */}
                    <div style={{ padding: "8px 14px" }}>
                      <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
                        {zone === "sjeverni" ? "SJEVERNI JADRAN" : zone === "srednji" ? "SREDNJI JADRAN" : "JUŽNI JADRAN"}
                      </div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                        {forecast || detailed}
                      </div>
                    </div>

                    {/* Nearest station data */}
                    {station && (
                      <div style={{ padding: "6px 14px 10px", display: "flex", gap: 12, flexWrap: "wrap", borderTop: `1px solid ${C.bord}` }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: C.mut }}>📍 {station.place}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>💨 {station.wind}</div>
                          <div style={{ fontSize: 8, color: C.mut }}>{t.wxWind}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>🌊 {station.sea}</div>
                          <div style={{ fontSize: 8, color: C.mut }}>{t.wxSea}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>👁️ {station.visibility} km</div>
                          <div style={{ fontSize: 8, color: C.mut }}>{t.wxVisibility}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{station.pressure} hPa</div>
                          <div style={{ fontSize: 8, color: C.mut }}>{t.wxPressure}</div>
                        </div>
                      </div>
                    )}

                    {/* Valid until */}
                    {navtex.validUntil && (
                      <div style={{ padding: "4px 14px 8px", fontSize: 9, color: C.mut, textAlign: "center" }}>
                        {t.wxForecast}: {navtex.validUntil} · {t.wxSource}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div> : <div style={{ padding: 40, textAlign: "center", color: C.mut, fontSize: 13 }}>{t.loading}</div>}

            {/* Floating conversation previews — shows what the AI can do */}
            <div style={{ padding: "20px 16px 8px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: C.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>{t.wxSeeAll}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(travelMode === "camper" ? [
                  { q: "Gdje mogu parkirati kamper u Splitu?", a: "🅿️ Autocamp Stobreč, 3km — 25€/noć, struja + voda uključeni. Ili slobodni parking Žnjan, besplatno ali bez servisa. Za dump station: INA pumpa Dugopolje, 15km." },
                  { q: "Ima li LPG stanica na putu za Dubrovnik?", a: "⛽ INA Ploče (km 87) ima LPG, 0.72€/L. Sljedeća je tek u Dubrovniku — napunite se u Pločama! Usput preporučam stanku u Stonu — najbolje kamenice na Jadranu, 1€/kom 🦪" },
                ] : travelMode === "sailing" ? [
                  { q: "Najbolja marina blizu Splita?", a: "⚓ ACI Marina Split — 3.5€/m ljeti, odlična zaštita od juga. Za mir: ACI Milna na Braču, 30min sail, upola jeftinije + konoba Palma na rivi 🍷" },
                  { q: "Kakav je vjetar sutra?", a: "🌬️ Maestral 12-15 čv popodne, idealno za Brač. Bura slabi ujutro. Izbjegavajte Hvarski kanal ako puše > 20 čv — bolje zaobići preko Šolte." },
                ] : [
                  { q: "Skrivena plaža blizu Splita?", a: "🏖️ Kašjuni pod Marjanom — lokalci je čuvaju za sebe! Parking 5€, dođite prije 10h. Voda kristalna, borova šuma za hlad. Za djecu bolje Bačvice — pijesak! 🐚" },
                  { q: "Gdje večerati s pogledom?", a: "🍽️ Konoba Matoni, Podstrana — terasa nad morem, pašticada 14€, svježa riba po kg. Rezervirajte dan ranije! Alternativa: Dvor u Omišu, ušće Cetine 🌊" },
                ]).map((conv, i) => (
                  <div key={i} style={{ animation: `fadeSlide 0.6s ${0.3 + i * 0.2}s both` }}>
                    {/* User question */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.08))", border: "1px solid rgba(14,165,233,0.15)", fontSize: 13, color: isNight ? "#bae6fd" : "#0c4a6e", maxWidth: "75%" }}>{conv.q}</div>
                    </div>
                    {/* AI answer */}
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.card, border: `1px solid ${C.bord}`, fontSize: 13, color: C.text, maxWidth: "82%", boxSizing: "border-box", lineHeight: 1.6 }}>{conv.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick questions — CTA */}
            <div style={{ padding: "16px 16px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: 3, fontWeight: 600, marginBottom: 12 }}>VAŠA PITANJA</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {quickQs.map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => document.querySelector("[data-send]")?.click(), 50); }}
                    style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 16, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textAlign: "left", minHeight: 50 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + "40"; e.currentTarget.style.background = C.accent + "08"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.background = C.card; }}>
                    {q}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: isNight ? "rgba(255,255,255,0.2)" : "rgba(12,74,110,0.3)", marginTop: 14 }}>3 besplatne poruke · od 9.99€</div>
            </div>
          </div>
        )}

        {/* Messages pushed to bottom via margin-top:auto */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", padding: "0 16px" }}>
            {m.image && <img src={m.image} alt="foto" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", marginRight: 8, alignSelf: "flex-end" }} />}
            <div style={{
              maxWidth: "82%", boxSizing: "border-box", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? (isNight ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))" : "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(2,132,199,0.12))") : C.card,
              border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.2)" : C.bord}`,
              fontSize: 18, lineHeight: 1.5, whiteSpace: "pre-wrap",
            }}>
              {m.role === "assistant" ? m.text.split("\n").map((line, j) => {
                // Parse [label](url) into rich buttons AND plain URLs into links
                const parts = line.split(/(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s)]+)/g).filter(Boolean);
                return <div key={j} style={{ marginBottom: line === "" ? 4 : 0 }}>{parts.map((part, k) => {
                  const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                  if (linkMatch && /^https?:\/\//.test(linkMatch[2])) {
                    return <a key={k} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{
                      display: "block", margin: "10px 0", padding: "16px 20px", borderRadius: 14,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff",
                      fontSize: 17, fontWeight: 700, textDecoration: "none", textAlign: "center",
                      minHeight: 56, lineHeight: "24px",
                      boxShadow: "0 4px 12px rgba(14,165,233,0.3)", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}
                    >{linkMatch[1]} →</a>;
                  }
                  if (/^https?:\/\//.test(part)) {
                    const label = part.includes("getyourguide") ? t.btnOffer : part.includes("viator") ? t.btnTour : part.includes("booking.com") ? t.btnStay : t.btnOpen;
                    return <a key={k} href={part} target="_blank" rel="noopener noreferrer" style={{
                      display: "block", margin: "8px 0", padding: "14px 18px", borderRadius: 12,
                      background: isNight ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.06)",
                      border: `1px solid ${C.accent}30`,
                      fontSize: 16, color: C.accent, textDecoration: "none", fontWeight: 600, textAlign: "center",
                      minHeight: 50,
                    }}>{label} →</a>;
                  }
                  return <span key={k}>{part}</span>;
                })}</div>;
              }) : m.text}
            </div>
          </div>
        ))}

        </div>
        {/* Scroll anchor — always at bottom of messages */}
        <div ref={scrollAnchor} />

        {/* Quick reply chips after last AI message */}
        {msgs.length > 0 && !loading && msgs[msgs.length - 1]?.role === "assistant" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 12px 8px", overflow: "hidden" }}>
            {(travelMode === "camper" || niche === "camper" ? [
              `🅿️ ${t.qParking}`,
              `🍽️ ${t.qDinner}`,
              `⛽ ${t.qFuel}`,
            ] : travelMode === "sailing" || niche === "sailing" ? [
              `⚓ ${t.qMarina}`,
              `🌊 ${t.qSea}`,
              `🍽️ ${t.qKonoba}`,
            ] : travelMode === "cruiser" || niche === "cruiser" ? [
              `🗺️ ${t.qPlan}`,
              `🍽️ ${t.qLunch}`,
              `📸 ${t.qPhoto}`,
            ] : [
              `🏖️ ${t.qBeach}`,
              `🍽️ ${t.qFood}`,
              `🗺️ ${t.qVisit}`,
            ]).map(q => (
              <button key={q} onClick={() => { setInput(q); setTimeout(() => document.querySelector("[data-send]")?.click(), 50); }}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 44, transition: "all 0.2s", boxSizing: "border-box", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 16px" }}>
            <div style={{ padding: "12px 20px", borderRadius: "18px 18px 18px 4px", background: C.card, border: `1px solid ${C.bord}` }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: `pulse 1.2s ${d * 0.2}s infinite` }} />)}
                <span style={{ fontSize: 11, color: C.mut, marginLeft: 6 }}>{t.typing}</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CONTENT CARDS — collapsible when chatting ═══ */}
        {region && (
          <div style={{ padding: "8px 0 20px" }}>
            {/* When chatting: show toggle button instead of full cards */}
            {msgs.length > 0 && !showCards && (
              <button onClick={() => setShowCards(true)} style={{
                width: "calc(100% - 32px)", margin: "8px 16px", padding: "12px 16px", borderRadius: 14,
                border: `1px solid ${C.bord}`, background: C.card, color: C.text,
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{`🗺️ ${t.showOffers}`}</span>
                <span style={{ fontSize: 12, color: C.accent }}>{t.showBtn}</span>
              </button>
            )}
            {msgs.length > 0 && showCards && (
              <button onClick={() => setShowCards(false)} style={{
                width: "calc(100% - 32px)", margin: "8px 16px 12px", padding: "10px 16px", borderRadius: 12,
                border: `1px solid ${C.bord}`, background: "transparent", color: C.mut,
                fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              }}>{t.hideBtn}</button>
            )}
            {(msgs.length === 0 || showCards) && <>

            {/* Activities — affiliate, always visible */}
            {(() => {
              const allActs = filterByRegion(EXPERIENCES, region);
              const acts = (niche === 'camper' ? allActs.filter(a => ['adventure','nature'].includes(a.cat)) : niche === 'local' ? allActs.filter(a => a.cat !== 'nature' || true) : allActs).slice(0, 6);
              return acts.length > 0 && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, fontWeight: 600 }}>{t.activities}</div>
                    <div style={{ fontSize: 10, color: C.mut }}>{acts.length} {t.available}</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }}>
                    {acts.map(a => (
                      <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", scrollSnapAlign: "start" }}>
                        <div style={{
                          minWidth: 180, minHeight: 140, padding: 0, borderRadius: 18,
                          background: C.card, border: `1px solid ${C.bord}`,
                          transition: "all 0.2s", cursor: "pointer", position: "relative", overflow: "hidden",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
                          {/* Region photo */}
                          {regionImgs[region] && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${regionImgs[region]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.25 }} />}
                          <div style={{ position: "absolute", inset: 0, background: isNight ? "linear-gradient(180deg, rgba(10,22,40,0.3) 0%, rgba(10,22,40,0.85) 100%)" : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.8) 100%)" }} />
                          <div style={{ position: "relative", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 140 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 22 }}>{a.emoji}</span>
                              <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, background: isNight ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.15)", padding: "3px 10px", borderRadius: 10 }}>~{a.price}€</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{a.name}</div>
                            <div style={{ display: "flex", gap: 6, fontSize: 10, color: C.mut }}>
                              <span>⏱ {a.dur}</span>
                              {a.rating > 0 && <span>⭐ {a.rating}</span>}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ⚠️ Camper Warnings — trust builders */}
            {(() => {
              if (niche === "local") return null;
              const warnings = filterByRegion(CAMPER_WARNINGS, region);
              return warnings.length > 0 && (travelMode === "camper" || niche === "camper") && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>⚠️ UPOZORENJA ZA KAMPERE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {warnings.map(w => (
                      <div key={w.id} style={{
                        padding: "14px 16px", borderRadius: 16,
                        background: isNight ? "rgba(248,113,113,0.06)" : "rgba(248,113,113,0.08)",
                        border: `1px solid ${w.severity === "critical" ? "rgba(239,68,68,0.3)" : w.severity === "high" ? "rgba(248,113,113,0.2)" : "rgba(248,113,113,0.1)"}`,
                      }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 22 }}>{w.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{w.name}</span>
                              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8,
                                background: w.severity === "critical" ? "rgba(239,68,68,0.15)" : w.severity === "high" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                                color: w.severity === "critical" ? "#ef4444" : w.severity === "high" ? "#f87171" : C.gold,
                                fontWeight: 700, letterSpacing: 1,
                              }}>{w.severity === "critical" ? "KRITIČNO" : w.severity === "high" ? "OPASNO" : "PAŽNJA"}</span>
                            </div>
                            <div style={{ fontSize: 12, color: isNight ? "#fca5a5" : "#b91c1c", lineHeight: 1.4, marginBottom: 6 }}>{w.danger}</div>
                            {(premium || w.severity === "medium") ? <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.4 }}>💡 {w.advice}</div> : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 12, color: C.gold, cursor: "pointer" }}>🔒 Otključaj savjet — Premium</div>}
                            {w.link && <a href={w.link} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-block", marginTop: 8, padding: "5px 14px", borderRadius: 10,
                              background: isNight ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.08)", border: `1px solid ${C.bord}`,
                              fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 500,
                            }}>Rezerviraj alternativu →</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 🏕️ Istra Camping Intel — seasonal tips */}
            {region === "istra" && (travelMode === "camper" || niche === "camper") && (
              <div style={{ marginBottom: 20, padding: "0 4px" }}>
                <div style={{ fontSize: 10, color: "#34d399", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🏕️ ISTRA INSIDER</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ISTRA_CAMPER_INTEL.map(tip => (
                    <div key={tip.id} style={{
                      padding: "12px 14px", borderRadius: 14,
                      background: isNight ? "rgba(52,211,153,0.04)" : "rgba(52,211,153,0.06)",
                      border: `1px solid ${tip.severity === "critical" ? "rgba(239,68,68,0.2)" : tip.severity === "high" ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.12)"}`,
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18 }}>{tip.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                            {tip.name}
                            {tip.season === "pre" && <span style={{ fontSize: 9, marginLeft: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: C.gold }}>{t.preseason || "PREDSEZONA"}</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.4, marginBottom: 4 }}>{tip.danger}</div>
                          <div style={{ fontSize: 11, color: "#34d399", lineHeight: 1.4 }}>💡 {tip.advice}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🏰 Dubrovnik & Pelješac Intel */}
            {region === "dubrovnik" && (travelMode === "camper" || niche === "camper") && (
              <div style={{ marginBottom: 20, padding: "0 4px" }}>
                <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🏰 DUBROVNIK SURVIVAL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {DUBROVNIK_INTEL.map(tip => (
                    <div key={tip.id} style={{
                      padding: "12px 14px", borderRadius: 14,
                      background: isNight ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.06)",
                      border: `1px solid ${tip.severity === "critical" ? "rgba(239,68,68,0.25)" : tip.severity === "high" ? "rgba(248,113,113,0.15)" : "rgba(245,158,11,0.1)"}`,
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18 }}>{tip.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{tip.spot}</span>
                            {tip.severity !== "low" && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8,
                              background: tip.severity === "critical" ? "rgba(239,68,68,0.15)" : "rgba(248,113,113,0.1)",
                              color: tip.severity === "critical" ? "#ef4444" : "#f87171",
                              fontWeight: 700, letterSpacing: 1,
                            }}>{tip.severity === "critical" ? "KRITIČNO" : "OPASNO"}</span>}
                          </div>
                          {premium
                            ? <>
                                <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5 }}>{tip.intel}</div>
                                {tip.link && <a href={tip.link} target="_blank" rel="noopener noreferrer" style={{
                                  display: "inline-block", marginTop: 6, padding: "4px 12px", borderRadius: 8,
                                  background: isNight ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.06)", border: `1px solid ${C.bord}`,
                                  fontSize: 10, color: C.accent, textDecoration: "none", fontWeight: 500,
                                }}>Rezerviraj →</a>}
                              </>
                            : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 11, color: C.gold, cursor: "pointer" }}>🔒 Otključaj savjet — Premium</div>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🗺️ Deep Local Intel — region-specific */}
            {(() => {
              const locals = DEEP_LOCAL[region];
              return locals && locals.length > 0 && (travelMode === "camper" || niche === "camper") && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🗺️ LOKALNO ZNANJE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {locals.map(d => (
                      <div key={d.id} style={{
                        padding: "12px 14px", borderRadius: 14,
                        background: isNight ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.06)",
                        border: `1px solid rgba(167,139,250,0.1)`,
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16 }}>{d.emoji}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{d.spot}</div>
                            {premium
                              ? <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5 }}>{d.intel}</div>
                              : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 11, color: C.gold, cursor: "pointer" }}>🔒 Insider savjet — Premium</div>
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Hidden Gems */}
            {(() => {
              const gems = filterByRegion(GEMS, region);
              const freeGems = gems.filter(g => !g.premium);
              const premGems = gems.filter(g => g.premium);
              return gems.length > 0 && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: C.gold, letterSpacing: 3, fontWeight: 600 }}>💎 SKRIVENA MJESTA</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {freeGems.map((g, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 16, background: C.card, border: `1px solid ${C.bord}` }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 22 }}>{g.emoji}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{g.name} <span style={{ fontSize: 10, color: C.mut, fontWeight: 400 }}>{g.type}</span></div>
                            <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{g.desc}</div>
                            <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>💡 {g.tip}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {premGems.length > 0 && (
                      <div onClick={() => !premium && setShowPaywall(true)} style={{
                        padding: "14px 16px", borderRadius: 16, cursor: premium ? "default" : "pointer",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))",
                        border: "1px solid rgba(245,158,11,0.1)",
                      }}>
                        {premium ? premGems.map((g, i) => (
                          <div key={i} style={{ padding: "8px 0", borderBottom: i < premGems.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 20 }}>{g.emoji}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                                <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.4 }}>{g.desc}</div>
                                <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>💡 {g.tip}</div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 4 }}>🔒 Još {premGems.length} skrivenih mjesta</div>
                            <div style={{ fontSize: 11, color: C.mut }}>Premium · {premGems.map(g => g.name).join(", ")}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Booking.com */}
            {(() => {
              const city = BOOKING_CITIES.find(c => c.region === region);
              return city && (
                <div style={{ padding: "0 4px" }}>
                  <a href={city.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "16px 20px", borderRadius: 18, display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "rgba(0,53,128,0.08)", border: "1px dashed rgba(0,85,166,0.15)",
                      transition: "all 0.2s", cursor: "pointer",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.15)"; }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>🏨 Smještaj — {city.name}</div>
                        <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{`Booking.com · ${t.bookBest}`}</div>
                      </div>
                      <div style={{ padding: "8px 14px", background: "linear-gradient(135deg, #003580, #0055A6)", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Pogledaj →
                      </div>
                    </div>
                  </a>
                </div>
              );
            })()}
            </>}
          </div>
        )}
        <div style={{ minHeight: 8, flexShrink: 0 }} />
      </div>
      {!premium && trialExpired && (
        <div style={{ flexShrink: 0 }}>
          <button onClick={() => setShowPaywall(true)} disabled={payLoading} style={{ width: "100%", padding: "14px 20px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display',Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 -2px 12px rgba(239,68,68,0.3)" }}>
            ⭐ {t.buyNow || "KUPI PREMIUM"} <span style={{ fontSize: 12, opacity: 0.8 }}>— 9.99€</span>
          </button>
        </div>
      )}

      {/* ═══ WALKIE-TALKIE PTT (Push-to-Talk) ═══ */}
      {walkieMode && (
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "center", alignItems: "center", gap: 16, borderTop: `1px solid ${C.bord}`, flexShrink: 0, background: isNight ? "rgba(34,197,94,0.03)" : "rgba(34,197,94,0.04)" }}>
          <button onClick={startVoiceInput} disabled={loading}
            style={{ width: 120, height: 120, borderRadius: "50%", border: `3px solid ${isRecording ? "#ef4444" : "#22c55e"}`, background: isRecording ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.08)", color: isRecording ? "#ef4444" : "#22c55e", fontSize: 40, cursor: loading ? "not-allowed" : "pointer", display: "grid", placeItems: "center", transition: "all 0.3s", animation: isRecording ? "pulse 1s infinite" : "none", boxShadow: isRecording ? "0 0 40px rgba(239,68,68,0.2)" : "0 0 30px rgba(34,197,94,0.1)" }}>
            {loading ? "⏳" : isRecording ? "⏺️" : "🎙️"}
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isRecording ? "#ef4444" : "#22c55e", marginBottom: 4 }}>
              {loading ? t.walkieAnswer : isRecording ? t.walkieListen : t.walkieTalk}
            </div>
            <div style={{ fontSize: 10, color: C.mut }}>📻 {t.walkieInfo}</div>
            <button onClick={() => { if (cameraRef.current) cameraRef.current.click(); }} style={{ marginTop: 8, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.bord}`, background: "transparent", color: C.mut, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
              📸 {t.walkieSnap}
            </button>
          </div>
        </div>
      )}

      {/* Offline banner */}
      {isOffline && (
        <div style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", borderTop: `1px solid rgba(239,68,68,0.2)`, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
          <span>📡</span>
          <span>{lang === "en" ? "Offline — check your connection" : lang === "de" || lang === "at" ? "Offline — Verbindung prüfen" : lang === "it" ? "Offline — controlla la connessione" : lang === "si" ? "Brez povezave" : lang === "cz" ? "Offline — zkontrolujte připojení" : lang === "pl" ? "Offline — sprawdź połączenie" : "Offline — provjeri vezu"}</span>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))", borderTop: `1px solid ${C.bord}`, display: "flex", gap: 8, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.3)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder={t.placeholder}
          style={{ flex: 1, padding: "16px 18px", borderRadius: 16, border: `1px solid ${C.bord}`, background: C.inputBg, color: C.text, fontSize: 17, outline: "none", fontFamily: "inherit" }}
        />
        {/* Hidden camera input */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
        <button onClick={() => { if (!can("lens")) { setUpsellFeature("lens"); setShowPaywall(true); return; } cameraRef.current?.click(); }} style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${C.bord}`, background: C.inputBg, color: can("lens") ? C.accent : C.mut, fontSize: 22, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, position: "relative" }}>{can("lens") ? "📷" : "📷"}{!can("lens") && <span style={{ position: "absolute", bottom: 2, right: 2, fontSize: 10 }}>🔒</span>}</button>
        {"webkitSpeechRecognition" in window || "SpeechRecognition" in window ? <button onClick={startVoiceInput}
          style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${isRecording ? "#ef4444" : C.bord}`, background: isRecording ? "rgba(239,68,68,0.1)" : C.inputBg, color: isRecording ? "#ef4444" : C.accent, fontSize: 22, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0, transition: "all 0.2s", animation: isRecording ? "pulse 1s infinite" : "none" }}>{isRecording ? "⏺️" : "🎙️"}</button> : null}
        <button data-send onClick={sendMsg} disabled={loading || !input.trim()}
          style={{
            width: 52, height: 52, borderRadius: 16, border: "none",
            background: input.trim() && !loading ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : (isNight ? "rgba(255,255,255,0.06)" : "rgba(12,74,110,0.08)"),
            color: "#fff", fontSize: 20, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>↑</button>
      </div>

      {paywallJsx}
      {inviteWelcomeJsx}
      <VerifyingOverlay />
      <SuccessModal />
      {globalToast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "#fff", padding: "14px 28px", borderRadius: 16, fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display',Georgia,serif", boxShadow: "0 8px 32px rgba(34,197,94,0.4)", animation: "fadeInDown 0.3s ease", whiteSpace: "nowrap" }}>{globalToast}</div>}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @supports not (height: 100dvh) { .jadran-chat { height: 100vh !important; } }
        ::selection { background: rgba(14,165,233,0.3); }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes sunGlow { 0%,100% { box-shadow: 0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(251,191,36,0.15); } 50% { box-shadow: 0 0 80px rgba(251,191,36,0.5), 0 0 160px rgba(251,191,36,0.2); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
