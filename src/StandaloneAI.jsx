// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Standalone AI Assistant
// Route: jadran.ai/ai
// Pay 5.99€ → travel guide without apartment context
// Perfect for: campervan travelers, day-trippers, cruise visitors
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { EXPERIENCES, GEMS, BOOKING_CITIES, CAMPER_WARNINGS, ISTRA_CAMPER_INTEL, DEEP_LOCAL, DUBROVNIK_INTEL, filterByRegion } from "./data.js";

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
  hr: { title: "Jadran Vodič", sub: "Lokalni savjeti za savršen odmor", start: "Započnite razgovor", send: "Pošalji", placeholder: "Pitajte me o Jadranu...", region: "Odaberite regiju", mode: "Kako putujete?", unlock: "Otključaj — od 3.99€", free3: "3 besplatna pitanja", remaining: "preostalo", upgraded: "Premium otključan!", back: "Natrag", typing: "razmišljam...",
    // Niche setup
    nicCamper: "Kamper vodič", nicCamperSub: "Parking, rute, dump station, upozorenja za kampere",
    nicLocal: "Lokalni vodič", nicLocalSub: "Apartman, hotel ili automobilom — plaže, konobe, skrivena mjesta",
    nicSailing: "Nautički vodič", nicSailingSub: "Marine, sidrišta, vjetar, konobe s mora",
    nicCruiser: "Kruzer vodič", nicCruiserSub: "Maksimum u 8 sati — plan po minutu, skip-the-line",
    // Camper picker
    gabariti: "GABARITI VOZILA", lenLabel: "Dužina (m)", heightLabel: "Visina (m)", 
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
    freeNote: "24h besplatno · zatim od 3.99€/tjedan", trialExpired: "Besplatni dan istekao", payExpired: "BESPLATNI DAN JE ISTEKAO", payTitle: "Otključajte svog vodiča", payFeatures: "Neograničena pitanja 24/7|Svi savjeti otključani|8+ skrivenih plaža i konoba|Personalizirana ruta za danas", payCamper: "Kamper parking, dump station, voda", payIstra: "Istra Insider — sezonski savjeti", payWeek: "Tjedan", payWeekSub: "7 dana · 1 regija", paySeason: "Sezona", paySeasonSub: "30 dana · sve regije", payLoading: "Preusmjeravanje na plaćanje...", paySecure: "Sigurno plaćanje putem Stripe · Nema skrivenih troškova · Otkazivanje bilo kada", payLater: "Možda kasnije", buyNow: "KUPI PREMIUM", buyPrice: "od 3.99€",
  },
  en: { title: "Jadran Guide", sub: "Local tips for the perfect Adriatic trip", start: "Start chatting", send: "Send", placeholder: "Ask me about the Adriatic...", region: "Choose region", mode: "How are you traveling?", unlock: "Unlock — from €3.99", free3: "3 free questions", remaining: "remaining", upgraded: "Premium unlocked!", back: "Back", typing: "thinking...",
    nicCamper: "Camper Guide", nicCamperSub: "Parking, routes, dump stations, camper warnings",
    nicLocal: "Local Guide", nicLocalSub: "Apartment, hotel or by car — beaches, restaurants, hidden gems",
    nicSailing: "Nautical Guide", nicSailingSub: "Marinas, anchorages, wind, waterfront restaurants",
    nicCruiser: "Cruise Guide", nicCruiserSub: "Max in 8 hours — minute-by-minute plan, skip-the-line",
    gabariti: "VEHICLE SIZE", lenLabel: "Length (m)", heightLabel: "Height (m)",
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
    freeNote: "24h free · then from €3.99/week", trialExpired: "Free day expired", payExpired: "FREE DAY EXPIRED", payTitle: "Unlock your guide", payFeatures: "Unlimited questions 24/7|All tips unlocked|8+ hidden beaches & restaurants|Personalized route for today", payCamper: "Camper parking, dump stations, water", payIstra: "Istria Insider — seasonal tips", payWeek: "Week", payWeekSub: "7 days · 1 region", paySeason: "Season", paySeasonSub: "30 days · all regions", payLoading: "Redirecting to payment...", paySecure: "Secure payment via Stripe · No hidden costs · Cancel anytime", payLater: "Maybe later", buyNow: "BUY PREMIUM", buyPrice: "from €3.99",
  },
  de: { title: "Jadran Reiseführer", sub: "Geprüfte Insider-Tipps für Ihren Adria-Urlaub", start: "Gespräch starten", send: "Senden", placeholder: "Fragen Sie mich zur Adria...", region: "Wählen Sie Ihre Region", mode: "Wie reisen Sie?", unlock: "Freischalten — ab 3,99€", free3: "3 kostenlose Fragen", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "Zurück", typing: "einen Moment...",
    nicCamper: "Camper-Reiseführer", nicCamperSub: "Stellplätze, Routen, Ver-/Entsorgung, Warnungen",
    nicLocal: "Lokaler Reiseführer", nicLocalSub: "Ferienwohnung, Hotel oder mit dem Auto — Strände, Restaurants",
    nicSailing: "Nautischer Reiseführer", nicSailingSub: "Marinas, Ankerplätze, Wind, Küstenrestaurants",
    nicCruiser: "Kreuzfahrt-Reiseführer", nicCruiserSub: "Maximum in 8 Stunden — Minutenplan, ohne Anstehen",
    gabariti: "FAHRZEUGMAßE", lenLabel: "Länge (m)", heightLabel: "Höhe (m)",
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
    freeNote: "24h kostenlos · danach ab 3,99€/Woche", trialExpired: "Kostenloser Tag abgelaufen", payExpired: "KOSTENLOSER TAG ABGELAUFEN", payTitle: "Schalten Sie Ihren Reiseführer frei", payFeatures: "Unbegrenzte Fragen 24/7|Alle Tipps freigeschaltet|8+ versteckte Strände und Restaurants|Personalisierte Route für heute", payCamper: "Camper-Parkplätze, Entsorgung, Wasser", payIstra: "Istrien Insider — saisonale Tipps", payWeek: "Woche", payWeekSub: "7 Tage · 1 Region", paySeason: "Saison", paySeasonSub: "30 Tage · alle Regionen", payLoading: "Weiterleitung zur Zahlung...", paySecure: "Sichere Zahlung über Stripe · Keine versteckten Kosten · Jederzeit kündbar", payLater: "Vielleicht später", buyNow: "PREMIUM KAUFEN", buyPrice: "ab 3,99€",
  },
  it: { title: "Guida Jadran", sub: "Consigli verificati per la vacanza perfetta sull'Adriatico", start: "Inizia a chattare", send: "Invia", placeholder: "Chiedimi dell'Adriatico...", region: "Scegliete la regione", mode: "Come viaggiate?", unlock: "Sblocca — da 3,99€", free3: "3 domande gratuite", remaining: "rimanenti", upgraded: "Premium sbloccato!", back: "Indietro", typing: "penso...",
    nicCamper: "Guida camper", nicCamperSub: "Parcheggi, percorsi, scarico, avvertenze per camper",
    nicLocal: "Guida locale", nicLocalSub: "Appartamento, hotel o in auto — spiagge, ristoranti, gemme nascoste",
    nicSailing: "Guida nautica", nicSailingSub: "Porti turistici, ancoraggi, vento, ristoranti sul mare",
    nicCruiser: "Guida crociera", nicCruiserSub: "Massimo in 8 ore — piano al minuto, salta la fila",
    gabariti: "DIMENSIONI VEICOLO", lenLabel: "Lunghezza (m)", heightLabel: "Altezza (m)",
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
    freeNote: "24h gratis · poi da 3,99€/settimana", trialExpired: "Giorno gratuito scaduto", payExpired: "GIORNO GRATUITO SCADUTO", payTitle: "Sblocca la tua guida", payFeatures: "Domande illimitate 24/7|Tutti i consigli sbloccati|8+ spiagge e ristoranti nascosti|Percorso personalizzato per oggi", payCamper: "Parcheggi camper, scarico, acqua", payIstra: "Istria Insider — consigli stagionali", payWeek: "Settimana", payWeekSub: "7 giorni · 1 regione", paySeason: "Stagione", paySeasonSub: "30 giorni · tutte le regioni", payLoading: "Reindirizzamento al pagamento...", paySecure: "Pagamento sicuro tramite Stripe · Nessun costo nascosto · Cancella in qualsiasi momento", payLater: "Forse più tardi", buyNow: "ACQUISTA PREMIUM", buyPrice: "da 3,99€",
  },
  at: { title: "Jadran Urlaubsguide", sub: "Insider-Tipps für deinen Adria-Urlaub — direkt von Einheimischen", start: "Los geht's!", send: "Abschicken", placeholder: "Frag mich was über die Adria...", region: "Wo geht's hin?", mode: "Wie bist du unterwegs?", unlock: "Freischalten — ab 3,99€", free3: "3 Fragen gratis", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "Zurück", typing: "Moment...",
    nicCamper: "Camper-Guide", nicCamperSub: "Stellplätze, Routen, Ver-/Entsorgung, Warnungen für Camper",
    nicLocal: "Dein Urlaubsguide", nicLocalSub: "Ferienwohnung, Hotel oder mit dem Auto — Strände, Beisln, Geheimtipps",
    nicSailing: "Nautik-Guide", nicSailingSub: "Marinas, Ankerplätze, Wind, Schmankerln am Wasser",
    nicCruiser: "Kreuzfahrt-Guide", nicCruiserSub: "Maximales Erlebnis in 8 Stunden — ohne Anstehen",
    gabariti: "FAHRZEUGGRÖßE", lenLabel: "Länge (m)", heightLabel: "Höhe (m)",
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
    walkieTalk: "Zum Reden drücken", walkieListen: "I hör zu...", walkieAnswer: "Antwort kommt...",
    walkieInfo: "Freisprechanlage · Display bleibt an", walkieSnap: "Foto machen",
    errVision: "Analyse fehlgeschlagen. Bitte nochmal probieren.", errConnection: "Verbindung nicht verfügbar. Bitte nochmal probieren.",
    freeNote: "24h gratis · dann ab 3,99€/Woche", trialExpired: "Gratis-Tag abgelaufen", payExpired: "GRATIS-TAG ABGELAUFEN", payTitle: "Schalt deinen Guide frei", payFeatures: "Unbegrenzt Fragen 24/7|Alle Tipps freigeschaltet|8+ versteckte Strände und Beisln|Personalisierte Route für heute", payCamper: "Camper-Stellplätze, Entsorgung, Wasser", payIstra: "Istrien Insider — Tipps zur Saison", payWeek: "Woche", payWeekSub: "7 Tage · 1 Region", paySeason: "Saison", paySeasonSub: "30 Tage · alle Regionen", payLoading: "Weiterleitung zur Zahlung...", paySecure: "Sichere Zahlung via Stripe · Keine versteckten Kosten · Jederzeit kündbar", payLater: "Vielleicht später", buyNow: "PREMIUM KAUFEN", buyPrice: "ab 3,99€",
  },
  si: { title: "Jadran vodič", sub: "Lokalni nasveti za popoln oddih na Jadranu", start: "Začni pogovor", send: "Pošlji", placeholder: "Vprašajte me o Jadranu...", region: "Izberite regijo", mode: "Kako potujete?", unlock: "Odkleni — od 3,99€", free3: "3 brezplačna vprašanja", remaining: "preostalo", upgraded: "Premium odklenjen!", back: "Nazaj", typing: "razmišljam...",
    nicCamper: "Vodič za kamper", nicCamperSub: "Parkirišča, poti, opozorila za kamper",
    nicLocal: "Lokalni vodič", nicLocalSub: "Apartma, hotel ali z avtom — plaže, restavracije",
    nicSailing: "Navtični vodič", nicSailingSub: "Marine, sidrišča, veter, restavracije ob morju",
    nicCruiser: "Vodič za križarke", nicCruiserSub: "Maksimum v 8 urah — načrt po minutah",
    gabariti: "VELIKOST VOZILA", lenLabel: "Dolžina (m)", heightLabel: "Višina (m)",
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
    freeNote: "24h brezplačno · nato od 3,99€/teden", trialExpired: "Brezplačni dan je potekel", payExpired: "BREZPLAČNI DAN JE POTEKEL", payTitle: "Odkleni vodič", payFeatures: "Neomejeno vprašanj 24/7|Vsi nasveti odklenjeni|8+ skritih plaž|Personalizirana pot za danes", payCamper: "Parkirišča za kamper, voda", payIstra: "Istra Insider", payWeek: "Teden", payWeekSub: "7 dni · 1 regija", paySeason: "Sezona", paySeasonSub: "30 dni · vse regije", payLoading: "Preusmerjanje na plačilo...", paySecure: "Varno plačilo prek Stripe · Brez skritih stroškov · Prekliči kadar koli", payLater: "Mogoče pozneje", buyNow: "KUPI PREMIUM", buyPrice: "od 3,99€",
  },
  cz: { title: "Jadran průvodce", sub: "Místní tipy pro perfektní dovolenou na Jadranu", start: "Začít konverzaci", send: "Odeslat", placeholder: "Zeptejte se na Jadran...", region: "Vyberte region", mode: "Jak cestujete?", unlock: "Odemknout — od 3,99€", free3: "3 otázky zdarma", remaining: "zbývá", upgraded: "Premium odemčen!", back: "Zpět", typing: "přemýšlím...",
    nicCamper: "Průvodce pro karavany", nicCamperSub: "Parkování, trasy, služby, varování pro karavany",
    nicLocal: "Místní průvodce", nicLocalSub: "Apartmán, hotel nebo autem — pláže, restaurace, skryté klenoty",
    nicSailing: "Námořní průvodce", nicSailingSub: "Přístavy, kotviště, vítr, restaurace u moře",
    nicCruiser: "Průvodce pro výletní lodě", nicCruiserSub: "Maximum za 8 hodin — plán po minutách",
    gabariti: "ROZMĚRY VOZIDLA", lenLabel: "Délka (m)", heightLabel: "Výška (m)",
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
    freeNote: "24h zdarma · poté od 3,99€/týden", trialExpired: "Bezplatný den vypršel", payExpired: "BEZPLATNÝ DEN VYPRŠEL", payTitle: "Odemkněte průvodce", payFeatures: "Neomezené dotazy 24/7|Všechny tipy odemčeny|8+ skrytých pláží|Personalizovaná trasa na dnes", payCamper: "Parkování pro karavany, voda", payIstra: "Istrie Insider", payWeek: "Týden", payWeekSub: "7 dní · 1 region", paySeason: "Sezóna", paySeasonSub: "30 dní · všechny regiony", payLoading: "Přesměrování na platbu...", paySecure: "Bezpečná platba přes Stripe · Žádné skryté poplatky · Zrušení kdykoliv", payLater: "Možná později", buyNow: "KOUPIT PREMIUM", buyPrice: "od 3,99€",
  },
  pl: { title: "Jadran przewodnik", sub: "Lokalne wskazówki na idealny urlop nad Adriatykiem", start: "Zacznij rozmowę", send: "Wyślij", placeholder: "Zapytaj o Adriatyk...", region: "Wybierz region", mode: "Jak podróżujesz?", unlock: "Odblokuj — od 3,99€", free3: "3 pytania za darmo", remaining: "pozostało", upgraded: "Premium odblokowany!", back: "Wstecz", typing: "myślę...",
    nicCamper: "Przewodnik kamperowy", nicCamperSub: "Parkingi, trasy, stacje serwisowe, ostrzeżenia",
    nicLocal: "Lokalny przewodnik", nicLocalSub: "Apartament, hotel lub samochodem — plaże, restauracje",
    nicSailing: "Przewodnik żeglarski", nicSailingSub: "Mariny, kotwicowiska, wiatr, restauracje nad wodą",
    nicCruiser: "Przewodnik wycieczkowy", nicCruiserSub: "Maksimum w 8 godzin — plan co do minuty",
    gabariti: "WYMIARY POJAZDU", lenLabel: "Długość (m)", heightLabel: "Wysokość (m)",
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
    freeNote: "24h za darmo · potem od 3,99€/tydzień", trialExpired: "Darmowy dzień wygasł", payExpired: "DARMOWY DZIEŃ WYGASŁ", payTitle: "Odblokuj przewodnik", payFeatures: "Nieograniczone pytania 24/7|Wszystkie wskazówki odblokowane|8+ ukrytych plaż|Spersonalizowana trasa na dziś", payCamper: "Parkingi dla kamperów, woda", payIstra: "Istria Insider", payWeek: "Tydzień", payWeekSub: "7 dni · 1 region", paySeason: "Sezon", paySeasonSub: "30 dni · wszystkie regiony", payLoading: "Przekierowanie do płatności...", paySecure: "Bezpieczna płatność przez Stripe · Brak ukrytych kosztów · Anuluj w dowolnym momencie", payLater: "Może później", buyNow: "KUP PREMIUM", buyPrice: "od 3,99€",
  },
};

export default function StandaloneAI() {
  const [step, setStep] = useState("setup"); // setup | chat
  const [niche, setNiche] = useState(null);
  const [camperLen, setCamperLen] = useState("");
  const [walkieMode, setWalkieMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [camperHeight, setCamperHeight] = useState(""); // "camper" | "local" | null — set from landing CTA
  const [lang, setLang] = useState("hr");
  const [region, setRegion] = useState(null);
  const [travelMode, setTravelMode] = useState(null);
  const [premium, setPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [trialHoursLeft, setTrialHoursLeft] = useState(24);
  const [trialExpired, setTrialExpired] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Chat
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollBox = useRef(null);
  const scrollAnchor = useRef(null);
  const cameraRef = useRef(null);
  const [weather, setWeather] = useState(null);
  const [weatherTime, setWeatherTime] = useState(null);
  const [notifPerm, setNotifPerm] = useState("default");
  const [lastAlert, setLastAlert] = useState(null);
  const [regionImgs, setRegionImgs] = useState({});

  useEffect(() => { scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, loading]);
  
  // Region → coordinates (coastal points for accurate marine data)
  const COORDS = {
    split: { lat: 43.49, lon: 16.55, loc: "Split-Podstrana" },
    makarska: { lat: 43.30, lon: 17.02, loc: "Makarska" },
    dubrovnik: { lat: 42.64, lon: 18.09, loc: "Dubrovnik" },
    zadar: { lat: 44.12, lon: 15.23, loc: "Zadar" },
    istra: { lat: 45.08, lon: 13.64, loc: "Rovinj-Istra" },
    kvarner: { lat: 45.34, lon: 14.31, loc: "Opatija-Kvarner" },
  };
  
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
  // Load region image when region selected
  useEffect(() => {
    if (!region || regionImgs[region]) return;
    const cityMap = { split: "Split", makarska: "Makarska", dubrovnik: "Dubrovnik", zadar: "Zadar", istra: "Rovinj", kvarner: "Opatija" };
    const city = cityMap[region];
    if (city) fetch(`/api/cityimg?city=${encodeURIComponent(city)}`)
      .then(r => r.json()).then(d => { if (d.url) setRegionImgs(prev => ({ ...prev, [region]: d.url })); })
      .catch(() => {});
  }, [region]);

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
      window.history.replaceState({}, "", "/ai");
    }
    // Check localStorage
    try { if (localStorage.getItem("jadran_ai_premium") === "1") setPremium(true); } catch {}
    // Also check ?payment=success from Stripe redirect
    if (params.get("payment") === "success") {
      setPremium(true);
      try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
      window.history.replaceState({}, "", "/ai");
    }
    // Auto-open paywall from landing "KUPI ODMAH"
    if (params.get("buy") === "true") {
      setShowPaywall(true);
      window.history.replaceState({}, "", "/ai");
    }
  }, []);

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
        body: JSON.stringify({ image: base64, mimeType, lang, context: `Gost u regiji ${regionName}. ${modeCtx}` }),
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
    setPayLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomCode: "AI-STANDALONE", guestName: "AI User", lang,
          returnPath: "/ai" + (niche ? "?niche=" + niche : ""),
          plan, region: plan === "week" ? (region || "split") : "all",
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
    setPayLoading(false);
  };

  // ─── AI CHAT ───
  const sendMsg = async () => {
    if (!input.trim() || loading) return;
    if (!premium && trialExpired) { setShowPaywall(true); return; }

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
      ...regionExps.map(e => `• ${e.name} (${e.price}€, ${e.dur}) → [${e.name} — ${e.price}€](${e.link})`),
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
          messages: [...msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      const aiText = data.content?.map(c => c.text || "").join("") || "...";
      setMsgs(p => [...p, { role: "assistant", text: aiText }]);
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
  const Paywall = () => showPaywall && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }}
      onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "32px 24px", maxWidth: 440, width: "100%", border: "1px solid rgba(245,158,11,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>{t.payExpired}</div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 24, color: C.text }}>{t.payTitle}</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: isNight ? "rgba(14,165,233,0.04)" : "rgba(14,165,233,0.06)", marginBottom: 20, fontSize: 13, lineHeight: 2, color: C.text }}>
          {t.payFeatures.split("|").map((f,i) => <span key={i}>✅ {f}<br/></span>)}
          {(travelMode === "camper" || niche === "camper") && <>✅ {t.payCamper}<br/></>}
          {region === "istra" && <>✅ {t.payIstra}<br/></>}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={() => startCheckout("week")} disabled={payLoading}
            style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: `1px solid ${C.bord}`, background: isNight ? C.card : "rgba(255,255,255,0.8)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>
            <div style={{ fontSize: 28, fontWeight: 300, color: C.accent }}>3.99€</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4 }}>{t.payWeek}</div>
            <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{t.payWeekSub}</div>
          </button>
          <button onClick={() => startCheckout("season")} disabled={payLoading}
            style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: "1px solid rgba(245,158,11,0.2)", background: isNight ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.08)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"}>
            <div style={{ position: "absolute", top: 0, right: 0, padding: "2px 10px", background: C.gold, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "0 14px 0 8px" }}>BEST</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: C.gold }}>7.99€</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4 }}>{t.paySeason}</div>
            <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{t.paySeasonSub}</div>
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
        </div>
        <button onClick={() => setShowPaywall(false)} style={{ width: "100%", background: "none", border: "none", color: C.mut, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 8 }}>{t.payLater}</button>
      </div>
    </div>
  );


  // ═══ ICE-BREAKER — context-aware welcome message ═══
  const generateIcebreaker = () => {
    const h = new Date().getHours();
    const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";
    const isCamperMode = travelMode === "camper" || niche === "camper";
    const w = weather;
    
    // ─── RETURNING USER DETECTION ───
    let isReturning = false;
    let hoursSinceLast = 0;
    let visitCount = 1;
    try {
      const lastVisit = localStorage.getItem("jadran_last_chat");
      const vc = parseInt(localStorage.getItem("jadran_visit_count") || "0");
      visitCount = vc + 1;
      localStorage.setItem("jadran_visit_count", String(visitCount));
      localStorage.setItem("jadran_last_chat", Date.now().toString());
      if (lastVisit) {
        hoursSinceLast = (Date.now() - parseInt(lastVisit)) / 3600000;
        if (hoursSinceLast >= 4) isReturning = true;
      }
    } catch {}

    // ─── FOLLOW-UP SCENARIOS (returning user, 4+ hours) ───
    if (isReturning && isCamperMode) {
      const regionExps = filterByRegion(EXPERIENCES, region);
      
      // Scenario 1: "Jutro posle" (6-12h) — dnevni izleti
      if (h >= 6 && h < 12) {
        const boatTrip = regionExps.find(e => e.cat === "premium" || e.name.includes("Cave") || e.name.includes("Island")) || regionExps[0];
        return `Dobro jutro! ☕ Nadam se da je noć u ${regionName} prošla odlično.

${w ? w.icon + " Danas " + w.temp + "°C" + (w.windSpeed < 15 ? ", gotovo bez vjetra — savršen dan za more!" : ".") : "Prekrasan dan!"}${w?.waveHeight && w.waveHeight < 0.5 ? " More mirno kao ulje!" : ""}

Većina gostiju danas ide na izlet — ${boatTrip ? `još ima mjesta!
[${boatTrip.name} — ${boatTrip.price}€](${boatTrip.link})` : "pitaj me za preporuku!"}
${isCamperMode ? "\nAko ste ipak za vožnju — treba li vam mapa lokalnih puteva sigurnih za kampere?" : ""}`;
      }
      
      // Scenario 2: "Kasno popodne" (15-21h) — večera
      if (h >= 15 && h < 21) {
        const gastro = regionExps.find(e => e.cat === "gastro") || regionExps.find(e => e.name.includes("Wine"));
        return `Hej! Bliži se vrijeme za večeru. 🍽️ Znam da je nakon cijelog dana najteže tražiti dobar restoran ${isCamperMode ? "s velikim parkingom" : ""}.

${region === "split" ? "Moj prijedlog: Konoba Matoni, Podstrana — terasa nad morem, pašticada 14€. Imaju prostran parking za kampere!" : region === "istra" ? "Moj prijedlog: Konoba Batelina, Banjole kod Pule — svježa riba po kg, prostran ravan parking." : region === "dubrovnik" ? "Moj prijedlog: Na Pelješcu — stonske kamenice 1€/kom, domaće vino, parking bez stresa." : region === "kvarner" ? "Moj prijedlog: Konoba Nada, Vrbnik na Krku — domaća janjetina, pogled na more, parking na ulazu u selo." : "Pitaj me za preporuku konobe s parkingom u blizini!"}
${gastro ? `\n[${gastro.name} — ${gastro.price}€](${gastro.link})` : ""}

Treba li navigacija do parkinga ili imate drugi plan za večeras?`;
      }
      
      // Scenario 3: "Spremanje za pokret" (48h+ ili default returning)
      if (visitCount >= 3 || hoursSinceLast > 24) {
        const booking = BOOKING_CITIES.find(c => c.region === region);
        const nextRegion = region === "istra" ? "Kvarner" : region === "kvarner" ? "Dalmacija" : region === "split" ? "jug prema Dubrovniku" : region === "dubrovnik" ? "sjever prema Splitu" : "sljedeću destinaciju";
        return `Pozdrav ponovo! 🚐 Vidim da ste već ${visitCount > 3 ? "nekoliko dana" : "par dana"} u regiji ${regionName}.

${w ? w.icon + " " + w.temp + "°C" : ""} Ako planirate da se pomjerite prema ${nextRegion}, imam logistički savjet:
${region === "istra" ? "Na Istarskom Ipsilonu pazi na bočni vjetar kod vijadukta Limska draga — kamperi III kategorije." : region === "kvarner" ? "Ako idete na otoke (Krk, Cres, Pag), kupite kartu za trajekt unaprijed da preskočite redove." : region === "split" ? "Magistrala kod Omiša (prevoj Dubci) ima bočni vjetar — kamperi s ceradom na 40 km/h." : "Pelješki most je besplatan — ne morate više kroz Neum!"}
${booking ? `\nMali kampovi se brzo pune. Pronašao sam slobodne parcele za sutra:
[Pogledaj smještaj — ${booking.name}](${booking.link})` : ""}

Kamo dalje — trebate rutu ili preporuku za usput?`;
      }
    }
    
    // ─── RETURNING NON-CAMPER ───
    if (isReturning) {
      return `Dobrodošli natrag! 🌊 ${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C" : ""} u ${regionName}.

Što planirate danas? Mogu preporučiti ${h < 12 ? "jutarnji izlet ili plažu" : h < 17 ? "popodnevnu aktivnost ili skrivenu uvalu" : "večeru s pogledom ili noćni izlaz"}. 🗺️`;
    }
    
    // ─── FIRST VISIT — existing ice-breaker logic ───
    
    // Weather-conditional (rain or strong wind)
    if (w && (w.windSpeed > 40 || w.icon === "🌧️" || w.icon === "🌦️" || w.icon === "⛈️")) {
      const windWarn = w.windSpeed > 40;
      if (isCamperMode) {
        return `Uh, vrijeme danas nije na našoj strani! ${w.icon} ${windWarn ? "Jaka bura otežava vožnju kamperima uz obalu." : "Kiša pada u regiji " + regionName + "."}

Nema smisla sjediti u vozilu — ovo je savršen dan za istraživanje unutrašnjosti na toplom. ${region === "istra" ? "Preporučujem degustaciju vina i pršuta u lokalnoj vinariji — imaju zaštićen parking za kamper.\n[Rezerviraj degustaciju vina](https://www.getyourguide.com/istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975/?partner_id=9OEGOYI&utm_medium=local_partners)" : region === "split" ? "Idealan dan za Dioklecijanove podrume — pod krovom, a fascinantan!\n[Rezerviraj obilazak palače](https://www.getyourguide.com/split-l268/split-walking-tour-t54976/?partner_id=9OEGOYI&utm_medium=local_partners)" : "Idealan dan za lokalne konobe u unutrašnjosti — topla jela i vino iz podruma."}

Gdje se trenutno nalaziš da ti provjerim prohodnost puteva? 🛡️`;
      }
      return `Vrijeme danas traži plan B! ${w.icon} ${windWarn ? "Vjetar je jak — " + w.windSpeed + " km/h." : "Kiša pada, ali to znači manje turista svugdje!"}

Preporučujem dan u unutrašnjosti: lokalne konobe, vinarije, muzeji. ${region === "istra" ? "Motovun i Grožnjan su prekrasni po kiši — manje turista, više atmosfere! 🍷" : "Savršen dan za skrivene lokalne tajne! 🍷"}

Što vas zanima — hrana, kultura, ili nešto treće?`;
    }
    
    // Time-conditional
    if (h >= 17 && h < 21) {
      // Evening - dinner time
      if (isCamperMode) {
        return `Dobra večer! 🌅 Zalazak u ${regionName} je danas u ${w?.sunset || "19:30"} — savršeno za večeru s pogledom.

${region === "split" ? "Konoba Matoni u Podstrani — terasa nad morem, pašticada 14€, i imaju veliki parking za kampere!" : region === "istra" ? "Konoba Batelina u Banjolama kod Pule — svježa riba po kg, a parking je prostran i ravan." : region === "dubrovnik" ? "Na Pelješcu obavezno probaj stonske kamenice — 1€/kom! Parking bez problema.\n[Rezerviraj degustaciju kamenica](https://www.getyourguide.com/ston-l4159/ston-oyster-and-wine-tasting-tour-t197562/?partner_id=9OEGOYI&utm_medium=local_partners)" : "Lokalne konobe u " + regionName + " imaju mjesta za kamper — pitaj me za preporuku!"}

Treba li ti parking za večeras ili želiš preporuku za sutra? 🚐`;
      }
      return `Dobra večer! 🌅 More je ${w?.sea || 20}°C, zalazak u ${w?.sunset || "19:30"}. Savršeno za šetnju rivom.

Što planirate za večeras — romantična večera, noćni život, ili mirna kava uz more?`;
    }
    
    if (h >= 6 && h < 10) {
      // Morning - activity time
      if (isCamperMode) {
        return `Dobro jutro! ☀️ ${w ? w.icon + " " + w.temp + "°C" : ""}, more ${w?.sea || 20}°C — savršen dan za avanturu!

${w?.waveHeight && w.waveHeight < 0.5 ? "More je mirno kao ulje — idealno za izlet brodom!\n[Pogledaj dostupne izlete](https://www.getyourguide.com/split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676/?partner_id=9OEGOYI&utm_medium=local_partners) 🚤" : ""}${region === "istra" ? " Rt Kamenjak je rano ujutro prazan — ali zatvori ventilaciju frižidera zbog prašine na makadamu!" : region === "split" ? " Kašjuni plaža pod Marjanom — dođi prije 10h dok je prazna!" : ""}

Kamo danas — plaže, izleti, ili tranzit prema sljedećoj destinaciji?`;
      }
      return `Dobro jutro! ☀️ ${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C" : "Prekrasan dan na Jadranu!"}

Što planirate danas — plaže, izleti, kultura? 🌊`;
    }
    
    // Default - general welcome
    if (isCamperMode) {
      return `Pozdrav! 🚐 Dobrodošli u ${regionName}. Ja sam vaš lokalni kamper expert — poznajem svaki parking, dump station i skrivenu uvalu na ovom dijelu obale.

${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C, vjetar " + (w.windDir || "") + " " + (w.windSpeed || "") + " km/h" : ""}

Što vam prvo treba — siguran parking za noćas, preporuka za plažu pristupačnu kamperom, ili nešto treće?`;
    }
    return `Pozdrav! 🌊 Dobrodošli u ${regionName}. Poznajem svaku skrivenu plažu i konubu na ovom dijelu obale.

${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C" : ""} Što vas zanima? 🗺️`;
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
    <div style={{ minHeight: "100vh", background: C.heroBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, textDecoration: "none", fontSize: 18, transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>‹</a>
          <div style={{ display: "flex", gap: 2, background: isNight ? "rgba(12,28,50,0.5)" : "rgba(255,255,255,0.5)", borderRadius: 12, padding: 3 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                style={{ padding: "4px 6px", background: lang === l.code ? "rgba(14,165,233,0.12)" : "transparent", border: lang === l.code ? `1px solid ${C.accent}40` : "1px solid transparent", borderRadius: 9, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                {l.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Niche-specific hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 800, color: "#fff" }}>J</div>
            <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, color: C.text }}>JADRAN</span>
          </div>
          
          {niche === "camper" && <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚐</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>Kamper vodič</div>
            <div style={{ fontSize: 14, color: C.mut }}>Parking, rute, dump station, upozorenja za kampere</div>
          </>}
          {niche === "local" && <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚗</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>Lokalni vodič</div>
            <div style={{ fontSize: 14, color: C.mut }}>Apartman, hotel ili automobilom uz obalu — plaže, konobe, skrivena mjesta</div>
          </>}
          {niche === "sailing" && <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>⛵</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>Nautički vodič</div>
            <div style={{ fontSize: 14, color: C.mut }}>Marine, sidrišta, vjetar, konobe s mora</div>
          </>}
          {niche === "cruiser" && <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚢</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>Kruzer vodič</div>
            <div style={{ fontSize: 14, color: C.mut }}>Maksimum u 8 sati — plan po minutu, skip-the-line</div>
          </>}
          {!niche && <>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>{t.title}</div>
            <div style={{ fontSize: 14, color: C.mut }}>{t.sub}</div>
          </>}
        </div>

        {/* Camper size picker — only for camper niche */}
        {niche === "camper" && (
          <div style={{ marginBottom: 24, padding: "16px", borderRadius: 16, background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <div style={{ fontSize: 11, color: C.gold, letterSpacing: 3, marginBottom: 12, fontWeight: 600 }}>{t.gabariti}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>Dužina (m)</div>
                <input value={camperLen} onChange={e => setCamperLen(e.target.value)} placeholder="npr. 7.5"
                  type="number" step="0.1" min="4" max="15"
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.mut, marginBottom: 4 }}>Visina (m)</div>
                <input value={camperHeight} onChange={e => setCamperHeight(e.target.value)} placeholder="npr. 3.2"
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
                <div key={m.id} onClick={() => setTravelMode(m.id)} style={{
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

        {/* Region */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: C.mut, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{t.region}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {REGIONS.map(r => (
              <div key={r.id} onClick={() => setRegion(r.id)} style={{
                padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                background: region === r.id ? "rgba(14,165,233,0.12)" : C.card,
                border: `1px solid ${region === r.id ? "#0ea5e9" : C.bord}`,
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start */}
        <button onClick={() => { if (region && travelMode) { setStep("chat"); setTimeout(() => setMsgs([{ role: "assistant", text: generateIcebreaker() }]), 300); } }}
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

        {/* BUY PREMIUM — prominent */}
        <button onClick={() => setShowPaywall(true)}
          style={{
            width: "100%", padding: "14px", borderRadius: 18, border: "none", marginTop: 10,
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Playfair Display',Georgia,serif",
            boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          <span>⭐</span> {t.buyNow || "KUPI PREMIUM"} <span style={{ fontSize: 12, opacity: 0.8 }}>— {t.buyPrice || "od 3.99€"}</span>
        </button>

        {/* Free tier note */}
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: isNight ? "rgba(255,255,255,0.3)" : "rgba(12,74,110,0.4)" }}>
          {t.freeNote}
        </div>
        <div style={{ textAlign: "center", marginTop: 4, fontSize: 10, color: isNight ? "rgba(255,255,255,0.2)" : "rgba(12,74,110,0.25)" }}>
          🛡️ Stripe · {t.paySecure?.split("·")[1]?.trim() || "Bez skrivenih troškova"}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::selection { background: rgba(14,165,233,0.3); }`}</style>
    </div>
  );

  // ═══ CHAT SCREEN ═══
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: C.chatBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "14px 20px", paddingTop: "max(14px, env(safe-area-inset-top, 14px))", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.bord}`, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStep("setup")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.bord}`, background: "transparent", color: C.text, fontSize: 16, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>‹</button>
          <div style={{ width: 1, height: 20, background: C.bord }} />
          <span style={{ fontSize: 18 }}>{TRAVEL_MODES.find(m => m.id === travelMode)?.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{REGIONS.find(r => r.id === region)?.name}</span>
          {weather && <span style={{ fontSize: 12, color: C.mut, marginLeft: 4 }}>{weather.icon} {weather.temp}° · 🌊 {weather.sea}°</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {(travelMode === "camper" || travelMode === "sailing") && (
            <button onClick={toggleWalkie} style={{ padding: "4px 10px", borderRadius: 10, background: walkieMode ? "rgba(34,197,94,0.12)" : "transparent", border: `1px solid ${walkieMode ? "rgba(34,197,94,0.2)" : C.bord}`, color: walkieMode ? "#22c55e" : C.mut, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {walkieMode ? "📻 ON" : "📻"}
            </button>
          )}
          {premium
            ? <span style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: C.gold, fontSize: 10, fontWeight: 600 }}>⭐ {premiumPlan?.plan === "season" ? "SEZONA" : "TJEDAN"} {premiumPlan ? Math.ceil((premiumPlan.expiresAt - Date.now()) / 86400000) + "d" : ""}</span>
            : <button onClick={() => trialExpired ? setShowPaywall(true) : null} style={{ padding: trialExpired ? "6px 14px" : "4px 12px", borderRadius: 12, background: trialExpired ? "linear-gradient(135deg, #ef4444, #dc2626)" : "rgba(52,211,153,0.08)", border: trialExpired ? "none" : "1px solid rgba(52,211,153,0.12)", color: trialExpired ? "#fff" : "#34d399", fontSize: trialExpired ? 11 : 10, fontWeight: trialExpired ? 700 : 600, cursor: trialExpired ? "pointer" : "default", fontFamily: "inherit", boxShadow: trialExpired ? "0 2px 8px rgba(239,68,68,0.3)" : "none" }}>
                {trialExpired ? `⭐ ${t.buyNow || "KUPI"}` : `✅ ${trialHoursLeft}h`}
              </button>
          }
        </div>
      </div>

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
            <div style={{ padding: "10px 16px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 300 }}>{weather.icon} {weather.temp}°</div>
                  <div style={{ fontSize: 8, color: C.mut }}>osjeća {weather.feelsLike}°</div>
                </div>
                <div style={{ width: 1, height: 28, background: C.bord }} />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 500, color: C.accent }}>🌊 {weather.sea}°</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{weather.seaEmoji} {weather.seaState || "more"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: weather.windSpeed > 40 ? "#f87171" : C.text }}>{weather.windName || weather.windDir}</div>
                  <div style={{ fontSize: 8, color: weather.windSpeed > 40 ? "#fca5a5" : C.mut }}>{weather.windSpeed} km/h{weather.gusts > weather.windSpeed + 10 ? ` (${weather.gusts})` : ""}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: weather.uv >= 8 ? "#f87171" : weather.uv >= 5 ? C.gold : "#4ade80" }}>UV {weather.uv}</div>
                  <div style={{ fontSize: 8, color: C.mut }}>{weather.uv >= 8 ? "zaštita!" : weather.uv >= 5 ? "SPF 30+" : "nizak"}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.gold }}>🌅 {weather.sunset}</div>
                  <div style={{ fontSize: 8, color: C.mut }}>zalazak</div>
                </div>
              </div>
            </div>
            {/* Maritime detail row */}
            <div style={{ padding: "2px 16px 8px", display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {weather.waveHeight > 0 && <span style={{ fontSize: 10, color: C.mut }}>🌊 valovi {weather.waveHeight}m {weather.wavePeriod ? `/ ${weather.wavePeriod}s` : ""}</span>}
              <span style={{ fontSize: 10, color: C.mut }}>💨 tlak {weather.pressure} hPa {weather.pressure < 1010 ? "↓" : weather.pressure > 1020 ? "↑" : "—"}</span>
              <span style={{ fontSize: 10, color: C.mut }}>💧 vlaga {weather.humidity}%</span>
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
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>TEMPERATURA</div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: C.text }}>{weather.icon} {weather.temp}°</div>
                  <div style={{ fontSize: 11, color: C.mut }}>osjeća se {weather.feelsLike}°</div>
                  <div style={{ fontSize: 11, color: C.mut }}>oblačnost {weather.cloudCover || "—"}%</div>
                </div>

                {/* UV + SUN */}
                <div style={{ padding: "14px", borderRadius: 14, background: C.card, border: `1px solid ${C.bord}` }}>
                  <div style={{ fontSize: 9, color: C.mut, letterSpacing: 2, marginBottom: 6 }}>UV INDEX</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: weather.uv >= 8 ? "#ef4444" : weather.uv >= 5 ? "#f59e0b" : "#22c55e" }}>
                    {weather.uv}
                  </div>
                  <div style={{ fontSize: 11, color: C.mut }}>
                    {weather.uv >= 8 ? "🛡️ zaštita obavezna!" : weather.uv >= 5 ? "SPF 30+ preporučen" : "😎 nizak rizik"}
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
                  <div style={{ fontSize: 11, color: C.mut, marginTop: 3 }}>💧 vlaga {weather.humidity}%</div>
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
                  Podaci: Open-Meteo Marine API · Lokacija: {weather.location || "Jadran"} · Osvježavanje svaku minutu
                </div>
              </div>
            </div> : <div style={{ padding: 40, textAlign: "center", color: C.mut, fontSize: 13 }}>{t.loading}</div>}

            {/* Floating conversation previews — shows what the AI can do */}
            <div style={{ padding: "20px 16px 8px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: C.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>POGLEDAJTE ŠTO SVE ZNAM</div>
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
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.card, border: `1px solid ${C.bord}`, fontSize: 13, color: C.text, maxWidth: "85%", lineHeight: 1.6 }}>{conv.a}</div>
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
              <div style={{ fontSize: 11, color: isNight ? "rgba(255,255,255,0.2)" : "rgba(12,74,110,0.3)", marginTop: 14 }}>3 besplatna pitanja · Premium 5.99€</div>
            </div>
          </div>
        )}

        {/* Messages pushed to bottom via margin-top:auto */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", padding: "0 16px" }}>
            {m.image && <img src={m.image} alt="foto" style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", marginRight: 8, alignSelf: "flex-end" }} />}
            <div style={{
              maxWidth: "85%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? (isNight ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))" : "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(2,132,199,0.12))") : C.card,
              border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.2)" : C.bord}`,
              fontSize: 18, lineHeight: 1.5, whiteSpace: "pre-wrap",
            }}>
              {m.role === "assistant" ? m.text.split("\n").map((line, j) => {
                // Parse [label](url) into rich buttons AND plain URLs into links
                const parts = line.split(/(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s)]+)/g).filter(Boolean);
                return <div key={j} style={{ marginBottom: line === "" ? 4 : 0 }}>{parts.map((part, k) => {
                  const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                  if (linkMatch) {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 16px 8px" }}>
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
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.bord}`, background: C.card, color: C.text, fontSize: 15, cursor: "pointer", fontFamily: "inherit", textAlign: "left", minHeight: 48, transition: "all 0.2s" }}>
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
                              <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, background: isNight ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.15)", padding: "3px 10px", borderRadius: 10 }}>{a.price}€</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{a.name}</div>
                            <div style={{ display: "flex", gap: 6, fontSize: 10, color: C.mut }}>
                              <span>⏱ {a.dur}</span>
                              <span>⭐ {a.rating}</span>
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
                            {tip.season === "pre" && <span style={{ fontSize: 9, marginLeft: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: C.gold }}>PREDSEZONA</span>}
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
          <button onClick={() => setShowPaywall(true)} style={{ width: "100%", padding: "14px 20px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Playfair Display',Georgia,serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 -2px 12px rgba(239,68,68,0.3)" }}>
            ⭐ {t.buyNow || "KUPI PREMIUM"} <span style={{ fontSize: 12, opacity: 0.8 }}>— {t.buyPrice || "od 3.99€"}</span>
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

      {/* Input */}
      <div style={{ padding: "12px 16px", paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))", borderTop: `1px solid ${C.bord}`, display: "flex", gap: 8, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.3)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder={t.placeholder}
          style={{ flex: 1, padding: "16px 18px", borderRadius: 16, border: `1px solid ${C.bord}`, background: C.inputBg, color: C.text, fontSize: 17, outline: "none", fontFamily: "inherit" }}
        />
        {/* Hidden camera input */}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
        <button onClick={() => cameraRef.current?.click()} style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${C.bord}`, background: C.inputBg, color: C.accent, fontSize: 22, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>📷</button>
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

      <Paywall />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @supports not (height: 100dvh) { .jadran-chat { height: 100vh !important; } }
        ::selection { background: rgba(14,165,233,0.3); }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes seaV1 { 0%,100% { d: path('M0,20 C60,10 120,30 180,18 C240,6 300,28 360,15 C380,12 400,20 400,20 L400,80 L0,80 Z'); } 50% { d: path('M0,25 C60,32 120,14 180,26 C240,34 300,16 360,28 C380,30 400,22 400,22 L400,80 L0,80 Z'); } }
        @keyframes seaV2 { 0%,100% { d: path('M0,30 C50,22 100,35 160,25 C220,15 280,32 340,22 C370,18 400,28 400,28 L400,80 L0,80 Z'); } 50% { d: path('M0,22 C50,32 100,18 160,30 C220,38 280,20 340,32 C370,35 400,24 400,24 L400,80 L0,80 Z'); } }
        @keyframes sunGlow { 0%,100% { box-shadow: 0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(251,191,36,0.15); } 50% { box-shadow: 0 0 80px rgba(251,191,36,0.5), 0 0 160px rgba(251,191,36,0.2); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
