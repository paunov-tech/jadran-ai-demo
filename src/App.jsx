import { useState, useEffect, useRef } from "react";
import { loadGuest, updateGuest, getRoomCode } from "./guestStore";
import GuestOnboarding from "./GuestOnboarding";

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
  simulation: { hr:"DOBA DANA", de:"TAGESZEIT", at:"TAGESZEIT", en:"TIME OF DAY", it:"ORA DEL GIORNO", si:"ČAS DNEVA", cz:"DENNÍ DOBA", pl:"PORA DNIA" },
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


  // ─── i18n round 2 ───
  hostUsesName:{ hr:"Vaš domaćin {HOST} koristi JADRAN AI.", de:"Ihr Gastgeber {HOST} nutzt JADRAN AI.", at:"Ihr Gastgeber {HOST} nutzt JADRAN AI.", en:"Your host {HOST} uses JADRAN AI.", it:"Il tuo host {HOST} usa JADRAN AI.", si:"Vaš gostitelj {HOST} uporablja JADRAN AI.", cz:"Váš hostitel {HOST} používá JADRAN AI.", pl:"Twój gospodarz {HOST} korzysta z JADRAN AI." },
  onboardSub: { hr:"60 sekundi → personalizirani odmor.", de:"60 Sekunden → personalisierter Urlaub.", at:"60 Sekunden → personalisierter Urlaub.", en:"60 seconds → personalized vacation.", it:"60 secondi → vacanza personalizzata.", si:"60 sekund → prilagojene počitnice.", cz:"60 sekund → personalizovaná dovolená.", pl:"60 sekund → spersonalizowane wakacje." },
  step1:      { hr:"KORAK 1/2 — INTERESI", de:"SCHRITT 1/2 — INTERESSEN", at:"SCHRITT 1/2 — INTERESSEN", en:"STEP 1/2 — INTERESTS", it:"PASSO 1/2 — INTERESSI", si:"KORAK 1/2 — INTERESI", cz:"KROK 1/2 — ZÁJMY", pl:"KROK 1/2 — ZAINTERESOWANIA" },
  forecast:   { hr:"PROGNOZA", de:"WETTERVORHERSAGE", at:"WETTERVORHERSAGE", en:"WEATHER FORECAST", it:"PREVISIONI METEO", si:"NAPOVED", cz:"PŘEDPOVĚĎ", pl:"PROGNOZA" },
  optPlan:    { hr:"OPTIMIRANI PLAN", de:"OPTIMIERTER PLAN", at:"OPTIMIERTER PLAN", en:"OPTIMIZED PLAN", it:"PIANO OTTIMIZZATO", si:"OPTIMIRANI NAČRT", cz:"OPTIMALIZOVANÝ PLÁN", pl:"ZOPTYMALIZOWANY PLAN" },
  rainDay:    { hr:"Kišni dan", de:"Regentag", at:"Regentag", en:"Rainy day", it:"Giorno di pioggia", si:"Deževen dan", cz:"Deštivý den", pl:"Deszczowy dzień" },
  sunnyDay:   { hr:"Sunčani dan", de:"Sonniger Tag", at:"Sonniger Tag", en:"Sunny day", it:"Giornata di sole", si:"Sončen dan", cz:"Slunečný den", pl:"Słoneczny dzień" },
  palaceTour: { hr:"Palača + Muzej", de:"Palast-Tour + Museum", at:"Palast-Tour + Museum", en:"Palace + Museum", it:"Palazzo + Museo", si:"Palača + Muzej", cz:"Palác + Muzeum", pl:"Pałac + Muzeum" },
  beachKayak: { hr:"Plaža + Kajak", de:"Strandtag + Kayak", at:"Strandtag + Kayak", en:"Beach + Kayak", it:"Spiaggia + Kayak", si:"Plaža + Kajak", cz:"Pláž + Kajak", pl:"Plaża + Kajak" },
  aiOptimized:{ hr:"AI je optimizirao raspored prema vremenu.", de:"AI hat den Zeitplan wetterabhängig optimiert.", at:"AI hat den Zeitplan wetterabhängig optimiert.", en:"AI optimized the schedule based on weather.", it:"L'AI ha ottimizzato il programma in base al meteo.", si:"AI je optimiziral urnik glede na vreme.", cz:"AI optimalizovala plán podle počasí.", pl:"AI zoptymalizowało plan na podstawie pogody." },
  packages:   { hr:"PAKETI", de:"PAKETE", at:"PAKETE", en:"PACKAGES", it:"PACCHETTI", si:"PAKETI", cz:"BALÍČKY", pl:"PAKIETY" },
  simArrival: { hr:"Pogledajte putovanje →", de:"Reise ansehen →", at:"Reise ansehen →", en:"View your journey →", it:"Visualizza il viaggio →", si:"Oglejte si potovanje →", cz:"Zobrazit cestu →", pl:"Zobacz podróż →" },
  safeTrip:   { hr:"Sretan put!", de:"Gute Reise!", at:"Gute Reise!", en:"Safe travels!", it:"Buon viaggio!", si:"Srečno pot!", cz:"Šťastnou cestu!", pl:"Szczęśliwej podróży!" },
  onTheRoad:  { hr:"NA PUTU", de:"UNTERWEGS", at:"UNTERWEGS", en:"ON THE ROAD", it:"IN VIAGGIO", si:"NA POTI", cz:"NA CESTĚ", pl:"W DRODZE" },
  arrival:    { hr:"DOLAZAK", de:"ANKUNFT", at:"ANKUNFT", en:"ARRIVAL", it:"ARRIVO", si:"PRIHOD", cz:"PŘÍJEZD", pl:"PRZYJAZD" },
  sunny:      { hr:"Sunčano", de:"Sonnig", at:"Sonnig", en:"Sunny", it:"Soleggiato", si:"Sončno", cz:"Slunečno", pl:"Słonecznie" },
  sea:        { hr:"More", de:"Meer", at:"Meer", en:"Sea", it:"Mare", si:"Morje", cz:"Moře", pl:"Morze" },
  sunset:     { hr:"Zalazak sunca", de:"Sonnenuntergang", at:"Sonnenuntergang", en:"Sunset", it:"Tramonto", si:"Sončni zahod", cz:"Západ slunce", pl:"Zachód słońca" },
  skipBtn:    { hr:"Preskoči", de:"Überspringen", at:"Überspringen", en:"Skip", it:"Salta", si:"Preskoči", cz:"Přeskočit", pl:"Pomiń" },
  tagline:    { hr:"Vaš Jadran, reimaginiran", de:"Ihre Adria, neu gedacht", at:"Ihre Adria, neu gedacht", en:"Your Adriatic, Reimagined", it:"Il tuo Adriatico, reinventato", si:"Vaš Jadran, na novo", cz:"Váš Jadran, znovu", pl:"Twój Adriatyk, na nowo" },
  payFeatures1:{ hr:"AI Vodič — pitajte bilo što 24/7", de:"AI-Guide — fragen Sie alles 24/7", at:"AI-Guide — fragen Sie alles 24/7", en:"AI Guide — ask anything 24/7", it:"Guida AI — chiedi qualsiasi cosa 24/7", si:"AI Vodič — vprašajte karkoli 24/7", cz:"AI Průvodce — ptejte se na cokoliv 24/7", pl:"Przewodnik AI — pytaj o cokolwiek 24/7" },
  payFeatures2:{ hr:"6 Hidden Gems sa lokalnim savjetima", de:"6 Hidden Gems mit lokalen Tipps", at:"6 Hidden Gems mit lokalen Tipps", en:"6 Hidden Gems with local tips", it:"6 Gemme nascoste con consigli locali", si:"6 skritih draguljev z lokalnimi nasveti", cz:"6 skrytých perel s místními tipy", pl:"6 ukrytych pereł z lokalnymi wskazówkami" },
  payFeatures3:{ hr:"Personalizirane preporuke po vremenu i interesima", de:"Personalisierte Empfehlungen nach Wetter und Interessen", at:"Personalisierte Empfehlungen nach Wetter und Interessen", en:"Personalized recommendations by weather and interests", it:"Consigli personalizzati per meteo e interessi", si:"Prilagojene priporočila po vremenu in interesih", cz:"Personalizovaná doporučení podle počasí a zájmů", pl:"Spersonalizowane rekomendacje wg pogody i zainteresowań" },
  payFeatures4:{ hr:"Concierge rezervacije aktivnosti", de:"Concierge-Buchung von Aktivitäten", at:"Concierge-Buchung von Aktivitäten", en:"Concierge activity bookings", it:"Prenotazione attività concierge", si:"Concierge rezervacije aktivnosti", cz:"Concierge rezervace aktivit", pl:"Rezerwacje aktywności concierge" },
  payFeatures5:{ hr:"Loyalty bodovi i popusti za sljedeći put", de:"Treuepunkte und Rabatte für den nächsten Besuch", at:"Treuepunkte und Rabatte für den nächsten Besuch", en:"Loyalty points and discounts for next visit", it:"Punti fedeltà e sconti per la prossima visita", si:"Točke zvestobe in popusti za naslednjič", cz:"Věrnostní body a slevy na příští návštěvu", pl:"Punkty lojalnościowe i zniżki na następny pobyt" },
  payVia:     { hr:"Plaćanje putem Stripe · SIAL Consulting d.o.o.", de:"Zahlung über Stripe · SIAL Consulting d.o.o.", at:"Zahlung über Stripe · SIAL Consulting d.o.o.", en:"Payment via Stripe · SIAL Consulting d.o.o.", it:"Pagamento tramite Stripe · SIAL Consulting d.o.o.", si:"Plačilo prek Stripe · SIAL Consulting d.o.o.", cz:"Platba přes Stripe · SIAL Consulting d.o.o.", pl:"Płatność przez Stripe · SIAL Consulting d.o.o." },
  earlyBird:  { hr:"Early Bird 2027: 20% popusta pri rezervaciji prije 1. listopada.", de:"Early Bird 2027: 20% Rabatt bei Buchung vor 1. Oktober.", at:"Early Bird 2027: 20% Rabatt bei Buchung vor 1. Oktober.", en:"Early Bird 2027: 20% off when booking before October 1st.", it:"Early Bird 2027: 20% di sconto prenotando prima del 1° ottobre.", si:"Early Bird 2027: 20% popusta pri rezervaciji pred 1. oktobrom.", cz:"Early Bird 2027: 20% sleva při rezervaci před 1. říjnem.", pl:"Early Bird 2027: 20% zniżki przy rezerwacji przed 1 października." },
  transitTip1:{ hr:"Ljubljana za 2h — preporučujemo Gostilna Pri Lojzetu. Zadnja jeftina pumpa prije HR granice.", de:"Ljubljana in 2h — wir empfehlen Gostilna Pri Lojzetu. Letzte günstige Tankstelle vor HR-Grenze.", at:"Ljubljana in 2h — wir empfehlen Gostilna Pri Lojzetu. Letzte günstige Tankstelle vor HR-Grenze.", en:"Ljubljana in 2h — we recommend Gostilna Pri Lojzetu. Last cheap gas before HR border.", it:"Lubiana in 2h — consigliamo Gostilna Pri Lojzetu. Ultimo distributore economico prima del confine HR.", si:"Ljubljana čez 2h — priporočamo Gostilna Pri Lojzetu. Zadnja poceni črpalka pred HR mejo.", cz:"Lublaň za 2h — doporučujeme Gostilna Pri Lojzetu. Poslední levná pumpa před HR hranicí.", pl:"Lublana za 2h — polecamy Gostilna Pri Lojzetu. Ostatnia tania stacja przed granicą HR." },
  transitTip2:{ hr:"HR cestarina: ~28€ do Splita. ENC preporučen. A1 HR SIM za 7€ u prvoj benzinskoj.", de:"HR Maut: ~28€ bis Split. ENC empfohlen. A1 HR SIM für 7€ an der ersten Tankstelle.", at:"HR Maut: ~28€ bis Split. ENC empfohlen. A1 HR SIM für 7€ an der ersten Tankstelle.", en:"HR toll: ~28€ to Split. ENC recommended. A1 HR SIM for 7€ at first gas station.", it:"Pedaggio HR: ~28€ fino a Spalato. ENC consigliato. SIM A1 HR per 7€ al primo distributore.", si:"HR cestnina: ~28€ do Splita. ENC priporočen. A1 HR SIM za 7€ na prvi bencinski.", cz:"HR mýtné: ~28€ do Splitu. ENC doporučen. A1 HR SIM za 7€ na první pumpě.", pl:"Opłata HR: ~28€ do Splitu. ENC zalecany. SIM A1 HR za 7€ na pierwszej stacji." },
  transitTip3:{ hr:"Još ~45 min! Domaćin {HOST} obaviješten. Konzum 400m od apartmana za prvi shopping.", de:"Noch ~45 Min! Gastgeber {HOST} informiert. Konzum 400m von der Unterkunft für ersten Einkauf.", at:"Noch ~45 Min! Gastgeber {HOST} informiert. Konzum 400m von der Unterkunft für ersten Einkauf.", en:"~45 min left! Host {HOST} notified. Konzum 400m from apartment for first shopping.", it:"Ancora ~45 min! Host {HOST} avvisato. Konzum a 400m dall'appartamento per la prima spesa.", si:"Še ~45 min! Gostitelj {HOST} obveščen. Konzum 400m od apartmaja za prvi nakup.", cz:"Ještě ~45 min! Hostitel {HOST} informován. Konzum 400m od apartmánu pro první nákup.", pl:"Jeszcze ~45 min! Gospodarz {HOST} powiadomiony. Konzum 400m od apartamentu na pierwsze zakupy." },
  // ─── Missing i18n keys (bugfix) ───
  booked:     { hr:"Rezervirano", de:"Gebucht", at:"Gebucht", en:"Booked", it:"Prenotato", si:"Rezervirano", cz:"Zarezervováno", pl:"Zarezerwowano" },
  daysToGo:   { hr:"dana do odmora", de:"Tage bis zum Urlaub", at:"Tage bis zum Urlaub", en:"days until vacation", it:"giorni alla vacanza", si:"dni do počitnic", cz:"dní do dovolené", pl:"dni do wakacji" },
  arrived:    { hr:"Stigli! → Pokreni Kiosk", de:"Angekommen! → Kiosk starten", at:"Angekommen! → Kiosk starten", en:"Arrived! → Start Kiosk", it:"Arrivati! → Avvia Kiosk", si:"Prispeli! → Zaženi Kiosk", cz:"Dorazili! → Spustit Kiosk", pl:"Przyjechaliśmy! → Uruchom Kiosk" },
  points:     { hr:"bodova", de:"Punkte", at:"Punkte", en:"points", it:"punti", si:"točk", cz:"bodů", pl:"punktów" },
  more:       { hr:"još", de:"Noch", at:"Noch", en:"more", it:"ancora", si:"še", cz:"ještě", pl:"jeszcze" },
  loyaltyTier:{ hr:"Morski val", de:"Meereswelle", at:"Meereswelle", en:"Sea Wave", it:"Onda marina", si:"Morski val", cz:"Mořská vlna", pl:"Fala morska" },
  daysStay:   { hr:"dana", de:"Tage", at:"Tage", en:"days", it:"giorni", si:"dni", cz:"dní", pl:"dni" },
  activitiesDone:{ hr:"aktivnosti", de:"Aktivitäten", at:"Aktivitäten", en:"activities", it:"attività", si:"aktivnosti", cz:"aktivit", pl:"aktywności" },
  unforgettable:{ hr:"Nezaboravno", de:"Unvergesslich", at:"Unvergesslich", en:"Unforgettable", it:"Indimenticabile", si:"Nepozabno", cz:"Nezapomenutelné", pl:"Niezapomniane" },
  bothDiscount:{ hr:"Oboje dobivate popust na sljedeću rezervaciju", de:"Beide erhalten Rabatt auf die nächste Buchung", at:"Beide erhalten Rabatt auf die nächste Buchung", en:"Both of you get a discount on next booking", it:"Entrambi ottenete uno sconto sulla prossima prenotazione", si:"Oba dobita popust na naslednjo rezervacijo", cz:"Oba získáte slevu na příští rezervaci", pl:"Oboje otrzymujecie zniżkę na następną rezerwację" },
  askDalmatia:{ hr:"Pitajte bilo što o Dalmaciji", de:"Fragen Sie alles über Dalmatien", at:"Fragen Sie alles über Dalmatien", en:"Ask anything about Dalmatia", it:"Chiedi qualsiasi cosa sulla Dalmazia", si:"Vprašajte karkoli o Dalmaciji", cz:"Zeptejte se na cokoliv o Dalmácii", pl:"Zapytaj o cokolwiek o Dalmacji" },
  localTip:   { hr:"Lokalni znaju — turisti ne", de:"Einheimische wissen — Touristen nicht", at:"Einheimische wissen — Touristen nicht", en:"Locals know — tourists don't", it:"I locali sanno — i turisti no", si:"Domačini vedo — turisti ne", cz:"Místní ví — turisté ne", pl:"Lokalni wiedzą — turyści nie" },
  checkOut:   { hr:"Check-out →", de:"Check-out →", at:"Check-out →", en:"Check-out →", it:"Check-out →", si:"Check-out →", cz:"Check-out →", pl:"Check-out →" },
  chatPrompt1:{ hr:"Što danas s djecom?", de:"Was heute mit Kindern?", at:"Was heute mit Kindern?", en:"What to do with kids today?", it:"Cosa fare con i bambini oggi?", si:"Kaj danes z otroki?", cz:"Co dnes s dětmi?", pl:"Co dziś z dziećmi?" },
  chatPrompt2:{ hr:"Tajne plaže?", de:"Geheime Strände?", at:"Geheime Strände?", en:"Secret beaches?", it:"Spiagge segrete?", si:"Skrite plaže?", cz:"Tajné pláže?", pl:"Tajne plaże?" },
  chatPrompt3:{ hr:"Preporuka za večeru?", de:"Abendessen-Tipp?", at:"Abendessen-Tipp?", en:"Dinner recommendation?", it:"Consiglio per cena?", si:"Priporočilo za večerjo?", cz:"Tip na večeři?", pl:"Polecenie na kolację?" },
  chatPrompt4:{ hr:"Gdje parkirati u Splitu?", de:"Wo parken in Split?", at:"Wo parken in Split?", en:"Where to park in Split?", it:"Dove parcheggiare a Spalato?", si:"Kje parkirati v Splitu?", cz:"Kde parkovat ve Splitu?", pl:"Gdzie parkować w Splicie?" },
  viewOn:     { hr:"Pogledaj na", de:"Ansehen auf", at:"Ansehen auf", en:"View on", it:"Vedi su", si:"Poglej na", cz:"Zobrazit na", pl:"Zobacz na" },
  bookVia:    { hr:"Rezerviraj preko", de:"Buchen über", at:"Buchen über", en:"Book via", it:"Prenota tramite", si:"Rezerviraj prek", cz:"Rezervovat přes", pl:"Zarezerwuj przez" },
  familyPrice:{ hr:"Obitelj", de:"Familie", at:"Familie", en:"Family", it:"Famiglia", si:"Družina", cz:"Rodina", pl:"Rodzina" },
  revenue:    { hr:"PRIHOD", de:"UMSATZ", at:"UMSATZ", en:"REVENUE", it:"RICAVI", si:"PRIHODKI", cz:"PŘÍJMY", pl:"PRZYCHODY" },
  // ─── Accommodation ───
  findStay:   { hr:"PRONAĐI SMJEŠTAJ", de:"UNTERKUNFT FINDEN", at:"UNTERKUNFT FINDEN", en:"FIND ACCOMMODATION", it:"TROVA ALLOGGIO", si:"NAJDI NASTANITEV", cz:"NAJÍT UBYTOVÁNÍ", pl:"ZNAJDŹ NOCLEG" },
  extendStay: { hr:"Produžite boravak?", de:"Aufenthalt verlängern?", at:"Aufenthalt verlängern?", en:"Extend your stay?", it:"Prolungare il soggiorno?", si:"Podaljšaj bivanje?", cz:"Prodloužit pobyt?", pl:"Przedłużyć pobyt?" },
  planNext:   { hr:"Planirajte sljedeći odmor", de:"Planen Sie den nächsten Urlaub", at:"Planen Sie den nächsten Urlaub", en:"Plan your next vacation", it:"Pianifica la prossima vacanza", si:"Načrtujte naslednje počitnice", cz:"Naplánujte další dovolenou", pl:"Zaplanuj następne wakacje" },
  bestDeals:  { hr:"Najbolje ponude", de:"Beste Angebote", at:"Beste Angebote", en:"Best deals", it:"Migliori offerte", si:"Najboljše ponudbe", cz:"Nejlepší nabídky", pl:"Najlepsze oferty" },
  browseOn:   { hr:"Pogledaj na Booking.com →", de:"Auf Booking.com ansehen →", at:"Auf Booking.com ansehen →", en:"Browse on Booking.com →", it:"Cerca su Booking.com →", si:"Poglej na Booking.com →", cz:"Prohlédnout na Booking.com →", pl:"Zobacz na Booking.com →" },
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
const GUEST_FALLBACK = {
  name: "Familie Weber", first: "Weber", country: "DE", lang: "de", flag: "🇩🇪",
  adults: 2, kids: 2, kidsAges: [7, 11], interests: ["gastro", "adventure", "culture"],
  arrival: "2026-07-12", departure: "2026-07-19", car: true, carPlate: "M-WB 4521",
  accommodation: "Villa Marija, Podstrana", host: "Marija Perić", hostPhone: "+385 91 555 1234",
  budget: 1200, spent: 345, email: "weber@email.de"
};

const W_DEFAULT = { icon: "☀️", temp: 28, sea: 24, uv: 7, wind: "Z 8 km/h", sunset: "20:30", humidity: 50 };

const FORECAST_DAYS = {
  hr: ["Pon","Uto","Sri","Čet","Pet","Sub","Ned"],
  de: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  at: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  it: ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"],
  si: ["Pon","Tor","Sre","Čet","Pet","Sob","Ned"],
  cz: ["Po","Út","St","Čt","Pá","So","Ne"],
  pl: ["Pon","Wt","Śr","Czw","Pt","Sob","Ndz"],
};
// Forecast fallback — overridden by Gemini if available
const FORECAST_DEFAULT = [
  { di: 0, icon: "☀️", h: 31, l: 22 }, { di: 1, icon: "⛅", h: 28, l: 21 },
  { di: 2, icon: "🌧️", h: 23, l: 19 }, { di: 3, icon: "☀️", h: 30, l: 22 },
  { di: 4, icon: "☀️", h: 32, l: 23 }, { di: 5, icon: "⛅", h: 29, l: 21 },
  { di: 6, icon: "☀️", h: 31, l: 22 },
];

const PRACTICAL = {
  parking: { icon: "🅿️", tk: "parking", items: [
    { n: "Parking ispred vile", d: "0m", note: {hr:"Vaše mjesto: #7",de:"Ihr Platz: #7",en:"Your spot: #7",it:"Il vostro posto: #7",si:"Vaše mesto: #7",cz:"Vaše místo: #7",pl:"Wasze miejsce: #7"}, free: true, mapKey: "villa_parking" },
    { n: "Podstrana centar", d: "400m", note: {hr:"8 kn/h · SMS plaćanje",de:"8 kn/h · SMS-Zahlung",en:"8 kn/h · SMS payment",it:"8 kn/h · Pagamento SMS",si:"8 kn/h · SMS plačilo",cz:"8 kn/h · SMS platba",pl:"8 kn/h · Płatność SMS"}, price: "8kn/h", mapKey: "podstrana_centar" },
    { n: "Garaža Lora (Split)", d: "8km", note: {hr:"Natkrivena garaža, 24/7",de:"Überdachte Garage, 24/7",en:"Covered garage, 24/7",it:"Garage coperto, 24/7",si:"Pokrita garaža, 24/7",cz:"Krytá garáž, 24/7",pl:"Garaż kryty, 24/7"}, price: "10€/dan", mapKey: "garaza_lora" },
  ]},
  beach: { icon: "🏖️", tk: "beaches", items: [
    { n: "Plaža Podstrana", d: "200m", note: {hr:"3 min pješice · Ležaljke 15€/dan",de:"3 Min zu Fuß · Liegen 15€/Tag",en:"3 min walk · Sunbeds 15€/day",it:"3 min a piedi · Lettini 15€/giorno",si:"3 min peš · Ležalniki 15€/dan",cz:"3 min pěšky · Lehátka 15€/den",pl:"3 min pieszo · Leżaki 15€/dzień"}, type: "🪨", mapKey: "plaza_podstrana" },
    { n: "Kašjuni", d: "6km", note: {hr:"12 min autom · Parking 5€ · Najljepša!",de:"12 Min Fahrt · Parking 5€ · Die Schönste!",en:"12 min drive · Parking 5€ · Most beautiful!",it:"12 min in auto · Parcheggio 5€ · La più bella!",si:"12 min z avtom · Parking 5€ · Najlepša!",cz:"12 min autem · Parkování 5€ · Nejkrásnější!",pl:"12 min autem · Parking 5€ · Najpiękniejsza!"}, type: "🪨", mapKey: "kasjuni" },
    { n: "Bačvice", d: "9km", note: {hr:"PIJESAK! Savršena za djecu · 15 min autom",de:"SAND! Perfekt für Kinder · 15 Min Fahrt",en:"SAND! Perfect for kids · 15 min drive",it:"SABBIA! Perfetta per bambini · 15 min in auto",si:"PESEK! Popolna za otroke · 15 min z avtom",cz:"PÍSEK! Perfektní pro děti · 15 min autem",pl:"PIASEK! Idealna dla dzieci · 15 min autem"}, type: "🏖️", mapKey: "bacvice" },
    { n: "Zlatni Rat (Brač)", d: "Ferry", note: {hr:"Ikonska · Ferry 7:30, 9:30, 12:00",de:"Ikonisch · Fähre 7:30, 9:30, 12:00",en:"Iconic · Ferry 7:30, 9:30, 12:00",it:"Iconica · Traghetto 7:30, 9:30, 12:00",si:"Ikonska · Trajekt 7:30, 9:30, 12:00",cz:"Ikonická · Trajekt 7:30, 9:30, 12:00",pl:"Kultowa · Prom 7:30, 9:30, 12:00"}, type: "🏖️", affiliate: true, link: "jadrolinija.hr", mapKey: "zlatni_rat" },
  ]},
  sun: { icon: "☀️", tk: "sun", items: [
    { n: "UV Index", note: {hr:"SPF 50+ obavezno između 11-16h!",de:"SPF 50+ Pflicht zwischen 11-16 Uhr!",en:"SPF 50+ mandatory between 11am-4pm!",it:"SPF 50+ obbligatorio tra le 11-16!",si:"SPF 50+ obvezno med 11-16h!",cz:"SPF 50+ povinné mezi 11-16h!",pl:"SPF 50+ obowiązkowe między 11-16!"}, warn: true, uvDynamic: true },
    { n: {hr:"Hidracija",de:"Hydration",en:"Hydration",it:"Idratazione",si:"Hidracija",cz:"Hydratace",pl:"Nawodnienie"}, note: {hr:"Min. 3L vode pri 31°C · Djeca češće!",de:"Min. 3L Wasser bei 31°C · Kinder öfter!",en:"Min. 3L water at 31°C · Kids more often!",it:"Min. 3L acqua a 31°C · Bambini più spesso!",si:"Min. 3L vode pri 31°C · Otroci pogosteje!",cz:"Min. 3L vody při 31°C · Děti častěji!",pl:"Min. 3L wody przy 31°C · Dzieci częściej!"} },
    { n: {hr:"Ljekarna Podstrana",de:"Apotheke Podstrana",en:"Pharmacy Podstrana",it:"Farmacia Podstrana",si:"Lekarna Podstrana",cz:"Lékárna Podstrana",pl:"Apteka Podstrana"}, d: "300m", note: {hr:"Do 20h · SPF, After Sun, Panthenol",de:"Bis 20 Uhr · SPF, After Sun, Panthenol",en:"Until 8pm · SPF, After Sun, Panthenol",it:"Fino alle 20 · SPF, After Sun, Panthenol",si:"Do 20h · SPF, After Sun, Panthenol",cz:"Do 20h · SPF, After Sun, Panthenol",pl:"Do 20:00 · SPF, After Sun, Panthenol"} },
  ]},
  routes: { icon: "🗺️", tk: "routes", items: [
    { n: "Split centar", d: "10km", note: {hr:"Auto 15min / Bus #60 svaki 20min (2€)",de:"Auto 15min / Bus #60 alle 20min (2€)",en:"Car 15min / Bus #60 every 20min (2€)",it:"Auto 15min / Bus #60 ogni 20min (2€)",si:"Avto 15min / Bus #60 vsakih 20min (2€)",cz:"Auto 15min / Bus #60 každých 20min (2€)",pl:"Auto 15min / Bus #60 co 20min (2€)"}, mapKey: "split_centar" },
    { n: "Trogir", d: "30km", note: {hr:"Auto 25min · UNESCO · Prekrasan pogled!",de:"Auto 25min · UNESCO · Herrliche Aussicht!",en:"Car 25min · UNESCO · Beautiful view!",it:"Auto 25min · UNESCO · Vista bellissima!",si:"Avto 25min · UNESCO · Čudovit razgled!",cz:"Auto 25min · UNESCO · Krásný výhled!",pl:"Auto 25min · UNESCO · Piękny widok!"}, mapKey: "trogir" },
    { n: "Omiš + Cetina", d: "15km", note: {hr:"Auto 18min · Rafting dostupan!",de:"Auto 18min · Rafting verfügbar!",en:"Car 18min · Rafting available!",it:"Auto 18min · Rafting disponibile!",si:"Avto 18min · Rafting na voljo!",cz:"Auto 18min · Rafting k dispozici!",pl:"Auto 18min · Rafting dostępny!"}, affiliate: true, mapKey: "omis" },
    { n: "Ferry Brač/Hvar", note: {hr:"jadrolinija.hr · Online booking 20% jeftinije",de:"jadrolinija.hr · Online 20% günstiger",en:"jadrolinija.hr · Online booking 20% cheaper",it:"jadrolinija.hr · Prenotazione online 20% più economica",si:"jadrolinija.hr · Online 20% ceneje",cz:"jadrolinija.hr · Online 20% levněji",pl:"jadrolinija.hr · Online 20% taniej"}, affiliate: true, mapKey: "ferry_split" },
  ]},
  food: { icon: "🍽️", tk: "food", items: [
    { n: "Konzum", d: "400m", note: {hr:"7-21h · Svježi kruh do 8h",de:"7-21 Uhr · Frisches Brot bis 8 Uhr",en:"7am-9pm · Fresh bread until 8am",it:"7-21 · Pane fresco fino alle 8",si:"7-21h · Svež kruh do 8h",cz:"7-21h · Čerstvý chléb do 8h",pl:"7-21 · Świeży chleb do 8"}, mapKey: "konzum" },
    { n: "Pekara Bobis", d: "250m", note: {hr:"Od 6h! Burek, kroasani",de:"Ab 6 Uhr! Burek, Croissants",en:"From 6am! Burek, croissants",it:"Dalle 6! Burek, croissant",si:"Od 6h! Burek, rogljički",cz:"Od 6h! Burek, croissanty",pl:"Od 6! Burek, croissanty"}, mapKey: "pekara_bobis" },
    { n: "Wolt / Glovo", note: {hr:"Dostava iz Splita do Podstrane",de:"Lieferung von Split nach Podstrana",en:"Delivery from Split to Podstrana",it:"Consegna da Spalato a Podstrana",si:"Dostava iz Splita do Podstrane",cz:"Doručení ze Splitu do Podstrany",pl:"Dostawa ze Splitu do Podstrany"} },
  ]},
  emergency: { icon: "🏥", tk: "emergency", items: [
    { n: {hr:"Hitna pomoć",de:"Notruf",en:"Emergency",it:"Emergenza",si:"Nujna pomoč",cz:"Tísňové volání",pl:"Pogotowie"}, note: "112 / 194", warn: true },
    { n: {hr:"Ljekarna",de:"Apotheke",en:"Pharmacy",it:"Farmacia",si:"Lekarna",cz:"Lékárna",pl:"Apteka"}, d: "300m", note: {hr:"Do 20h",de:"Bis 20 Uhr",en:"Until 8pm",it:"Fino alle 20",si:"Do 20h",cz:"Do 20h",pl:"Do 20:00"}, mapKey: "ljekarna" },
    { n: "WiFi", note: "VillaMarija-5G · Lozinka/Password: jadran2026" },
    { n: {hr:"Domaćin",de:"Gastgeber",en:"Host",it:"Padrone di casa",si:"Gostitelj",cz:"Hostitel",pl:"Gospodarz"}, note: `${GUEST_FALLBACK.host}: ${GUEST_FALLBACK.hostPhone} (WhatsApp)` },
  ]},
};

const GEMS = [
  { name: "Uvala Vruja", emoji: "🏝️", mapKey: "uvala_vruja", premium: false,
    type: {hr:"Tajna plaža",de:"Geheimstrand",en:"Secret beach",it:"Spiaggia segreta",si:"Skrita plaža",cz:"Tajná pláž",pl:"Tajna plaża"},
    desc: {hr:"Između Omiša i Makarske, dostupna samo pješice. Kristalno more, potpuno divlja.",de:"Zwischen Omiš und Makarska, nur zu Fuß erreichbar. Kristallklares Meer, völlig wild.",en:"Between Omiš and Makarska, accessible only on foot. Crystal clear sea, completely wild.",it:"Tra Omiš e Makarska, raggiungibile solo a piedi. Mare cristallino, completamente selvaggia.",si:"Med Omišem in Makarsko, dostopna le peš. Kristalno morje, popolnoma divja.",cz:"Mezi Omišem a Makarskou, přístupná pouze pěšky. Křišťálové moře, zcela divoká.",pl:"Między Omišem a Makarską, dostępna tylko pieszo. Krystaliczne morze, całkowicie dzika."},
    tip: {hr:"Ponesite vode i cipele za hodanje! Nema sjene.",de:"Bringen Sie Wasser und Wanderschuhe mit! Kein Schatten.",en:"Bring water and walking shoes! No shade.",it:"Portate acqua e scarpe da trekking! Nessuna ombra.",si:"Vzemite vodo in pohodne čevlje! Ni sence.",cz:"Vezměte vodu a turistickou obuv! Žádný stín.",pl:"Weźcie wodę i buty do chodzenia! Brak cienia."},
    best: {hr:"Ujutro",de:"Morgens",en:"Morning",it:"Mattina",si:"Zjutraj",cz:"Ráno",pl:"Rano"}, diff: {hr:"Srednje",de:"Mittel",en:"Medium",it:"Medio",si:"Srednje",cz:"Střední",pl:"Średni"} },
  { name: "Marjan špilje", emoji: "🕳️", mapKey: "marjan_spilje", premium: false,
    type: {hr:"Šetnja",de:"Wanderung",en:"Walk",it:"Passeggiata",si:"Sprehod",cz:"Procházka",pl:"Spacer"},
    desc: {hr:"Starokršćanske špilje iz 5. st. na stazi od Kašjuna do vrha Marjana.",de:"Frühchristliche Höhlen aus dem 5. Jh. auf dem Weg von Kašjuni zum Marjan-Gipfel.",en:"Early Christian caves from the 5th century on the trail from Kašjuni to Marjan summit.",it:"Grotte paleocristiane del V secolo sul sentiero da Kašjuni alla cima del Marjan.",si:"Starokrščanske jame iz 5. st. na poti od Kašjunov do vrha Marjana.",cz:"Starokřesťanské jeskyně z 5. století na stezce z Kašjuni na vrchol Marjanu.",pl:"Wczesnochrześcijańskie jaskinie z V w. na szlaku z Kašjuni na szczyt Marjanu."},
    tip: {hr:"Krenite u 17h, stignete na vrh za zalazak sunca.",de:"Starten Sie um 17 Uhr, Gipfel zum Sonnenuntergang.",en:"Start at 5pm, reach the summit for sunset.",it:"Partite alle 17, arrivate in cima per il tramonto.",si:"Začnite ob 17h, na vrh za sončni zahod.",cz:"Vyražte v 17h, na vrchol k západu slunce.",pl:"Wyruszcie o 17, na szczyt o zachodzie słońca."},
    best: {hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Konoba Stari Mlin", emoji: "🍷", mapKey: "konoba_stari_mlin", premium: true,
    type: {hr:"Lokalna tajna",de:"Lokales Geheimnis",en:"Local secret",it:"Segreto locale",si:"Lokalna skrivnost",cz:"Místní tajemství",pl:"Lokalny sekret"},
    desc: {hr:"Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. Pršut, sir, vino iz podruma.",de:"Srinjine, 15 Min. Keine Speisekarte — der Wirt kocht, was da ist. Pršut, Käse, Wein aus dem Keller.",en:"Srinjine, 15min. No menu — the host cooks what's available. Pršut, cheese, wine from the cellar.",it:"Srinjine, 15min. Nessun menù — il padrone cucina ciò che c'è. Pršut, formaggio, vino dalla cantina.",si:"Srinjine, 15min. Ni jedilnika — gostilničar kuha, kar ima. Pršut, sir, vino iz kleti.",cz:"Srinjine, 15 min. Žádné menu — hostitel vaří, co má. Pršut, sýr, víno ze sklepa.",pl:"Srinjine, 15min. Brak menu — gospodarz gotuje co ma. Pršut, ser, wino z piwnicy."},
    tip: {hr:"Nazovite dan ranije. ~80€ za 4 osobe sa vinom.",de:"Rufen Sie einen Tag vorher an. ~80€ für 4 Personen mit Wein.",en:"Call a day ahead. ~80€ for 4 people with wine.",it:"Chiamate un giorno prima. ~80€ per 4 persone con vino.",si:"Pokličite dan prej. ~80€ za 4 osebe z vinom.",cz:"Zavolejte den předem. ~80€ pro 4 osoby s vínem.",pl:"Zadzwońcie dzień wcześniej. ~80€ za 4 osoby z winem."},
    best: {hr:"Večer",de:"Abend",en:"Evening",it:"Sera",si:"Večer",cz:"Večer",pl:"Wieczór"}, diff: {hr:"Auto",de:"Auto",en:"Car",it:"Auto",si:"Avto",cz:"Auto",pl:"Auto"} },
  { name: "Klis", emoji: "🏰", mapKey: "klis", premium: true,
    type: {hr:"Iskustvo",de:"Erlebnis",en:"Experience",it:"Esperienza",si:"Doživetje",cz:"Zážitek",pl:"Doświadczenie"},
    desc: {hr:"Game of Thrones tvrđava u zoru. Nema turista. Pogled na Split i otoke.",de:"Game of Thrones Festung im Morgengrauen. Keine Touristen. Blick auf Split und die Inseln.",en:"Game of Thrones fortress at dawn. No tourists. View of Split and the islands.",it:"Fortezza di Game of Thrones all'alba. Nessun turista. Vista su Spalato e le isole.",si:"Game of Thrones trdnjava ob zori. Brez turistov. Pogled na Split in otoke.",cz:"Pevnost ze Hry o trůny za úsvitu. Žádní turisté. Výhled na Split a ostrovy.",pl:"Twierdza z Gry o Tron o świcie. Żadnych turystów. Widok na Split i wyspy."},
    tip: {hr:"Parking besplatan prije 8h. Dođite u 5:15.",de:"Parking kostenlos vor 8 Uhr. Kommen Sie um 5:15.",en:"Free parking before 8am. Arrive at 5:15.",it:"Parcheggio gratuito prima delle 8. Arrivate alle 5:15.",si:"Parking brezplačen pred 8h. Pridite ob 5:15.",cz:"Parkování zdarma před 8h. Přijeďte v 5:15.",pl:"Parking bezpłatny przed 8. Przyjedźcie o 5:15."},
    best: {hr:"Izlazak sunca",de:"Sonnenaufgang",en:"Sunrise",it:"Alba",si:"Sončni vzhod",cz:"Východ slunce",pl:"Wschód słońca"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Cetina", emoji: "🌊", mapKey: "cetina_bazen", premium: true,
    type: {hr:"Kupanje",de:"Baden",en:"Swimming",it:"Nuoto",si:"Kopanje",cz:"Koupání",pl:"Kąpiel"},
    desc: {hr:"3km uzvodno od Omiša, makadamski put do skrivenog prirodnog bazena.",de:"3km flussaufwärts von Omiš, Schotterweg zum versteckten Naturbecken.",en:"3km upstream from Omiš, gravel road to a hidden natural pool.",it:"3km a monte da Omiš, strada sterrata verso una piscina naturale nascosta.",si:"3km gorvodno od Omiša, makadamska pot do skritega naravnega bazena.",cz:"3km proti proudu od Omiše, štěrková cesta ke skrytému přírodnímu bazénu.",pl:"3km w górę rzeki od Omisza, droga szutrowa do ukrytego naturalnego basenu."},
    tip: {hr:"Skrenite desno kod mosta u Omišu. Makadamski put 1km.",de:"Rechts abbiegen bei der Brücke in Omiš. Schotterweg 1km.",en:"Turn right at the bridge in Omiš. Gravel road 1km.",it:"Girate a destra al ponte di Omiš. Strada sterrata 1km.",si:"Zavijte desno pri mostu v Omišu. Makadamska pot 1km.",cz:"Odbočte vpravo u mostu v Omiši. Štěrková cesta 1km.",pl:"Skręćcie w prawo przy moście w Omiszu. Droga szutrowa 1km."},
    best: {hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Vidova Gora", emoji: "🌄", mapKey: "vidova_gora", premium: true,
    type: {hr:"Pogled",de:"Aussicht",en:"Viewpoint",it:"Panorama",si:"Razgled",cz:"Vyhlídka",pl:"Punkt widokowy"},
    desc: {hr:"Najviši vrh jadranskih otoka (778m). Auto do vrha. Pogled na Hvar, Vis, Italiju.",de:"Höchster Gipfel der Adriainseln (778m). Auto bis zum Gipfel. Blick auf Hvar, Vis, Italien.",en:"Highest peak of the Adriatic islands (778m). Drive to the top. View of Hvar, Vis, Italy.",it:"Vetta più alta delle isole adriatiche (778m). Auto fino in cima. Vista su Hvar, Vis, Italia.",si:"Najvišji vrh jadranskih otokov (778m). Avto do vrha. Pogled na Hvar, Vis, Italijo.",cz:"Nejvyšší vrchol jadranských ostrovů (778m). Autem na vrchol. Výhled na Hvar, Vis, Itálii.",pl:"Najwyższy szczyt wysp adriatyckich (778m). Autem na szczyt. Widok na Hvar, Vis, Włochy."},
    tip: {hr:"Ferry 12h, auto 30min do vrha, zalazak, večera u Bolu.",de:"Fähre 12 Uhr, Auto 30 Min zum Gipfel, Sonnenuntergang, Abendessen in Bol.",en:"Ferry 12pm, car 30min to top, sunset, dinner in Bol.",it:"Traghetto 12, auto 30min in cima, tramonto, cena a Bol.",si:"Trajekt 12h, avto 30min do vrha, zahod, večerja v Bolu.",cz:"Trajekt 12h, auto 30min na vrchol, západ slunce, večeře v Bolu.",pl:"Prom 12, auto 30min na szczyt, zachód słońca, kolacja w Bolu."},
    best: {hr:"Zalazak",de:"Sonnenuntergang",en:"Sunset",it:"Tramonto",si:"Zahod",cz:"Západ slunce",pl:"Zachód słońca"}, diff: "Ferry+Auto" },
];

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const VIA = (id) => `https://www.viator.com/tours/${id}?pid=P00292197&mcid=42383&medium=link`;
const BKG = (dest, params="") => `https://www.booking.com/searchresults.html?aid=101704203&dest_type=city&dest_id=${dest}${params}`;

const ACCOMMODATION = [
  { region: "split", emoji: "🏖️",
    name: { hr:"Podstrana & Split", de:"Podstrana & Split", en:"Podstrana & Split", it:"Podstrana & Spalato", si:"Podstrana & Split", cz:"Podstrana & Split", pl:"Podstrana & Split" },
    note: { hr:"Blizu centra, plaže na dohvat ruke", de:"Stadtnah, Strände in Reichweite", en:"Near center, beaches within reach", it:"Vicino al centro, spiagge a portata", si:"Blizu centra, plaže na dosegu", cz:"Blízko centra, pláže na dosah", pl:"Blisko centrum, plaże w zasięgu" },
    link: BKG("-92163", "&checkin=&checkout=&group_adults=2&no_rooms=1&sb_travel_purpose=leisure") },
  { region: "split", emoji: "🏝️",
    name: { hr:"Makarska rivijera", de:"Makarska Riviera", en:"Makarska Riviera", it:"Riviera di Makarska", si:"Makarska riviera", cz:"Makarská riviéra", pl:"Riwiera Makarska" },
    note: { hr:"Najljepše plaže Dalmacije", de:"Die schönsten Strände Dalmatiens", en:"Dalmatia's most beautiful beaches", it:"Le spiagge più belle della Dalmazia", si:"Najlepše plaže Dalmacije", cz:"Nejkrásnější pláže Dalmácie", pl:"Najpiękniejsze plaże Dalmacji" },
    link: BKG("-89007") },
  { region: "split", emoji: "⛵",
    name: { hr:"Hvar", de:"Hvar", en:"Hvar", it:"Hvar", si:"Hvar", cz:"Hvar", pl:"Hvar" },
    note: { hr:"Glamur + lavanda + noćni život", de:"Glamour + Lavendel + Nachtleben", en:"Glamour + lavender + nightlife", it:"Glamour + lavanda + vita notturna", si:"Glamur + sivka + nočno življenje", cz:"Glamour + levandule + noční život", pl:"Glamour + lawenda + życie nocne" },
    link: BKG("-89750") },
  { region: "istria", emoji: "🫒",
    name: { hr:"Rovinj", de:"Rovinj", en:"Rovinj", it:"Rovigno", si:"Rovinj", cz:"Rovinj", pl:"Rovinj" },
    note: { hr:"Najromantičniji grad Istre", de:"Die romantischste Stadt Istriens", en:"Istria's most romantic town", it:"La città più romantica dell'Istria", si:"Najbolj romantično mesto Istre", cz:"Nejromantičtější město Istrie", pl:"Najbardziej romantyczne miasto Istrii" },
    link: BKG("-91498") },
  { region: "istria", emoji: "🏟️",
    name: { hr:"Pula & Medulin", de:"Pula & Medulin", en:"Pula & Medulin", it:"Pola & Medulin", si:"Pula & Medulin", cz:"Pula & Medulin", pl:"Pula & Medulin" },
    note: { hr:"Rimska arena + obiteljske plaže", de:"Römische Arena + Familienstrände", en:"Roman arena + family beaches", it:"Arena romana + spiagge per famiglie", si:"Rimska arena + družinske plaže", cz:"Římská aréna + rodinné pláže", pl:"Rzymska arena + plaże rodzinne" },
    link: BKG("-91614") },
  { region: "kvarner", emoji: "⚓",
    name: { hr:"Opatija", de:"Opatija", en:"Opatija", it:"Abbazia", si:"Opatija", cz:"Opatija", pl:"Opatija" },
    note: { hr:"Biser Kvarnera, elegancija + šetnice", de:"Perle der Kvarner, Eleganz + Promenaden", en:"Pearl of Kvarner, elegance + promenades", it:"Perla del Quarnero, eleganza + lungomare", si:"Biser Kvarnerja, eleganca + sprehajališča", cz:"Perla Kvarneru, elegance + promenády", pl:"Perła Kwarneru, elegancja + promenady" },
    link: BKG("-91382") },
  { region: "kvarner", emoji: "🏝️",
    name: { hr:"Otok Krk", de:"Insel Krk", en:"Krk Island", it:"Isola di Krk", si:"Otok Krk", cz:"Ostrov Krk", pl:"Wyspa Krk" },
    note: { hr:"Zlatni otok — most s kopnom", de:"Goldene Insel — Brücke zum Festland", en:"Golden island — bridge to mainland", it:"Isola d'oro — ponte con la terraferma", si:"Zlati otok — most s kopnim", cz:"Zlatý ostrov — most na pevninu", pl:"Złota wyspa — most z lądem" },
    link: BKG("-91127") },
];

const EXPERIENCES = [
  // ═══ SREDNJA DALMACIJA (Split, Omiš, Otoci) ═══
  { id: 1, name: "Rafting Cetina", emoji: "🚣", price: 35, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("omis-l2096/rafting-on-cetina-river-from-omis-t35592"), viator: VIA("Split/rafting-on-Cetina-river-Omis/d4185-261342P1") },
  { id: 2, name: "Kajak Night Glow", emoji: "🛶", price: 55, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id: 3, name: "ATV Quad + Waterfall", emoji: "🏍️", price: 65, dur: "5h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("split-l268/split-atv-quad-tour-adventure-with-waterfall-swimming-t445566") },
  { id: 4, name: "Split Walking Tour", emoji: "🏛️", price: 25, dur: "2h", rating: 4.7, cat: "culture", region: "split",
    gyg: GYG("split-l268/split-walking-tour-t54976"), viator: VIA("Split/Split-Diocletians-Palace-Walking-Tour/d4185-54976P1") },
  { id: 5, name: "Game of Thrones", emoji: "🐉", price: 60, dur: "2h", rating: 4.9, cat: "culture", region: "split",
    gyg: GYG("split-l268/split-private-game-of-thrones-tour-t899804") },
  { id: 6, name: "Blue Cave 5 Islands", emoji: "🏝️", price: 110, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    gyg: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), viator: VIA("Split/Blue-Cave-and-Hvar-Tour-from-Split/d4185-17622P2") },
  { id: 7, name: "Hvar + Pakleni Catamaran", emoji: "⛵", price: 89, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    gyg: GYG("split-l268/split-full-day-boat-trip-to-3-islands-w-lunch-snorkeling-t412889"), viator: VIA("Split/Three-Island-Tour-from-Split/d4185-412889P1") },
  { id: 8, name: "Sunset Cruise", emoji: "🌅", price: 65, dur: "2h", rating: 5.0, cat: "premium", region: "split",
    gyg: GYG("split-l268/split-riviera-sunset-cruise-with-summer-vibes-t399715") },
  { id: 9, name: "Krka + Wine Tasting", emoji: "🍷", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "split",
    gyg: GYG("split-l268/day-tour-from-split-krka-waterfalls-tour-wine-tasting-t251842"), viator: VIA("Split/From-Split-Krka-Waterfalls-Food-Wine-Tasting-Tour/d4185-251842P1") },
  { id: 10, name: "Plitvice Lakes", emoji: "🌊", price: 75, dur: "12h", rating: 4.8, cat: "nature", region: "split",
    gyg: GYG("split-l268/from-split-plitvice-lakes-guided-tour-with-entry-tickets-t411976"), viator: VIA("Split/Plitvice-Lakes-Guided-Tour-with-Entry-Tickets/d4185-411976P1") },

  // ═══ ISTRA (Rovinj, Pula, Motovun) ═══
  { id: 20, name: "Truffle Hunting", emoji: "🍄", price: 45, dur: "2h", rating: 4.9, cat: "gastro", region: "istria",
    gyg: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975") },
  { id: 21, name: "Istria in 1 Day", emoji: "🏰", price: 55, dur: "9h", rating: 4.7, cat: "culture", region: "istria",
    gyg: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468") },
  { id: 22, name: "Inner Istria + Food", emoji: "🫒", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "istria",
    gyg: GYG("pula-l344/istria-guided-tour-of-inner-istria-with-food-tasting-t408255") },
  { id: 23, name: "Pula Arena + Wine", emoji: "🏟️", price: 50, dur: "6h", rating: 4.7, cat: "culture", region: "istria",
    gyg: GYG("pula-l344/3-istrian-wineries-tour-t102866") },

  // ═══ KVARNER (Opatija, Rijeka, Krk) ═══
  { id: 30, name: "Kvarner Bay Tour", emoji: "⚓", price: 55, dur: "5h", rating: 4.8, cat: "culture", region: "kvarner",
    gyg: GYG("opatija-l1296/best-of-kvarner-bay-half-day-tour-from-rijeka-or-opatija-t977515") },
  { id: 31, name: "Cres Island Boat", emoji: "🚢", price: 120, dur: "8h", rating: 4.9, cat: "premium", region: "kvarner",
    gyg: GYG("opatija-l1296?q=cres+island+boat") },
  { id: 32, name: "Opatija Evening Cruise", emoji: "🌙", price: 45, dur: "2h", rating: 4.8, cat: "premium", region: "kvarner",
    gyg: GYG("opatija-l1296?q=evening+cruise+kvarner") },
];

const BUNDLES = [
  { emoji: "🏝️", includes: ["Blue Cave 5 Islands", "Split Walking Tour"],
    name: { hr:"Otoci + Povijest", de:"Inseln + Geschichte", en:"Islands + History", it:"Isole + Storia", si:"Otoki + Zgodovina", cz:"Ostrovy + Historie", pl:"Wyspy + Historia" },
    tip: { hr:"Jedan dan more i otoci, drugi dan Dioklecijanova palača!", de:"Ein Tag Meer und Inseln, am nächsten Diokletianpalast!", en:"One day sea & islands, next day Diocletian's Palace!", it:"Un giorno mare e isole, il giorno dopo il Palazzo di Diocleziano!", si:"En dan morje in otoki, naslednji dan Dioklecijanova palača!", cz:"Jeden den moře a ostrovy, druhý den Diokleciánův palác!", pl:"Jeden dzień morze i wyspy, następny Pałac Dioklecjana!" } },
  { emoji: "👨‍👩‍👧‍👦", includes: ["Rafting Cetina", "ATV Quad + Waterfall"],
    name: { hr:"Adrenalin paket", de:"Adrenalin-Paket", en:"Adrenaline Pack", it:"Pacchetto adrenalina", si:"Adrenalin paket", cz:"Adrenalinový balíček", pl:"Pakiet adrenaliny" },
    tip: { hr:"Dva dana čistog adrenalina! Djeca 8+ na rafting.", de:"Zwei Tage purer Adrenalin! Kinder ab 8 zum Rafting.", en:"Two days of pure adrenaline! Kids 8+ can raft.", it:"Due giorni di pura adrenalina! Bambini 8+ al rafting.", si:"Dva dni čistega adrenalina! Otroci 8+ na rafting.", cz:"Dva dny čistého adrenalinu! Děti 8+ na rafting.", pl:"Dwa dni czystej adrenaliny! Dzieci 8+ na rafting." } },
  { emoji: "🍄", includes: ["Truffle Hunting", "Inner Istria + Food"],
    name: { hr:"Istra Gastro", de:"Istrien Gastro", en:"Istria Gastro", it:"Istria Gastro", si:"Istra Gastro", cz:"Istrie Gastro", pl:"Istria Gastro" },
    tip: { hr:"Lov na tartufe + konobe unutrašnje Istre — nezaboravno!", de:"Trüffeljagd + Konobas des Hinterlands — unvergesslich!", en:"Truffle hunt + inland konobas — unforgettable!", it:"Caccia al tartufo + konobe dell'entroterra — indimenticabile!", si:"Lov na tartufe + konobe notranje Istre — nepozabno!", cz:"Lov na lanýže + konoby vnitrozemí — nezapomenutelné!", pl:"Polowanie na trufle + konoby w głębi lądu — niezapomniane!" } },
  { emoji: "💑", includes: ["Sunset Cruise", "Krka + Wine Tasting"],
    name: { hr:"Romantični bijeg", de:"Romantische Flucht", en:"Romantic Escape", it:"Fuga romantica", si:"Romantični pobeg", cz:"Romantický únik", pl:"Romantyczna ucieczka" },
    tip: { hr:"Zalazak na brodu + vodopadi i vino — savršen dan za dvoje!", de:"Sonnenuntergang auf dem Boot + Wasserfälle und Wein!", en:"Sunset cruise + waterfalls and wine — perfect for two!", it:"Tramonto in barca + cascate e vino — perfetto per due!", si:"Zahod na ladji + slapovi in vino — popoln dan za dva!", cz:"Západ na lodi + vodopády a víno — perfektní pro dva!", pl:"Zachód na łodzi + wodospady i wino — idealny dla dwojga!" } },
];

const LOYALTY = { points: 345, tier: "Morski val", next: "Dalmatinac", nextPts: 500, code: "WEBER2026" };

const INTEREST_LABELS = {
  gastro:    { hr:"Gastronomija", de:"Gastronomie", en:"Gastronomy", it:"Gastronomia", si:"Gastronomija", cz:"Gastronomie", pl:"Gastronomia" },
  adventure: { hr:"Avantura", de:"Abenteuer", en:"Adventure", it:"Avventura", si:"Pustolovščina", cz:"Dobrodružství", pl:"Przygoda" },
  culture:   { hr:"Kultura", de:"Kultur", en:"Culture", it:"Cultura", si:"Kultura", cz:"Kultura", pl:"Kultura" },
  beach:     { hr:"Plaže", de:"Strände", en:"Beaches", it:"Spiagge", si:"Plaže", cz:"Pláže", pl:"Plaże" },
  wellness:  { hr:"Wellness", de:"Wellness", en:"Wellness", it:"Benessere", si:"Wellness", cz:"Wellness", pl:"Wellness" },
  kids:      { hr:"Obitelj", de:"Familie", en:"Family", it:"Famiglia", si:"Družina", cz:"Rodina", pl:"Rodzina" },
  nightlife: { hr:"Noćni život", de:"Nachtleben", en:"Nightlife", it:"Vita notturna", si:"Nočno življenje", cz:"Noční život", pl:"Życie nocne" },
  nature:    { hr:"Priroda", de:"Natur", en:"Nature", it:"Natura", si:"Narava", cz:"Příroda", pl:"Przyroda" },
};
const INTERESTS = [
  { k: "gastro", e: "🍷" }, { k: "adventure", e: "🏔️" },
  { k: "culture", e: "🏛️" }, { k: "beach", e: "🏖️" },
  { k: "wellness", e: "🧖" }, { k: "kids", e: "👨‍👩‍👧‍👦" },
  { k: "nightlife", e: "🍸" }, { k: "nature", e: "🌿" },
];

/* ─── COMPONENT ─── */
export default function JadranUnified() {
  console.log("[JADRAN] Component mounted, roomCode:", getRoomCode());
  const [lang, setLang] = useState("hr");
  const [splash, setSplash] = useState(true);
  // Auto-compute initial phase from guest dates
  const computeInitialPhase = () => {
    const now = new Date();
    const arr = G.arrival ? new Date(G.arrival) : null;
    const dep = G.departure ? new Date(G.departure) : null;
    if (arr && now < arr) return "pre";
    if (arr && dep && now >= arr && now <= dep) return "kiosk";
    if (dep && now > dep) return "post";
    return "pre";
  };
  const [phase, setPhase] = useState("pre"); // overridden by loadGuest
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

  // ─── GUEST ONBOARDING STATE ───
  const [guestProfile, setGuestProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const G = guestProfile || GUEST_FALLBACK;

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 3800); return () => clearTimeout(t); }, []);

  // ─── PERSISTENCE: Load guest state from Firestore/localStorage ───
  const persistReady = useRef(false);
  useEffect(() => {
    loadGuest(roomCode.current).then(data => {
      if (data) {
        if (data.premium) setPremium(true);
        if (data.lang) setLang(data.lang);
        if (data.phase) {
          // Use date-based phase if dates are available
          const autoPhase = (() => {
            const now = new Date();
            const arr = data.arrival ? new Date(data.arrival) : null;
            const dep = data.departure ? new Date(data.departure) : null;
            if (arr && now < arr) return "pre";
            if (arr && dep && now >= arr && now <= dep) return "kiosk";
            if (dep && now > dep) return "post";
            return data.phase;
          })();
          setPhase(autoPhase);
          if (autoPhase === "pre") setSubScreen(data.subScreen || "onboard");
          else if (autoPhase === "kiosk") setSubScreen(data.subScreen || "home");
          else setSubScreen(data.subScreen || "summary");
        }
        if (data.booked) setBooked(new Set(data.booked));
        // Load guest profile fields if they exist
        if (data.name && data.country) {
          setGuestProfile({
            name: data.name, first: data.first || data.name.split(" ").pop(),
            country: data.country, flag: data.flag || "🌍", lang: data.lang || "en",
            adults: data.adults || 2, kids: data.kids || 0, kidsAges: data.kidsAges || [],
            interests: data.interests || ["gastro","adventure"],
            arrival: data.arrival || data.checkIn || "2026-07-12",
            departure: data.departure || data.checkOut || "2026-07-19",
            car: data.car || false, carPlate: data.carPlate || "",
            accommodation: data.accommodation || "Apartman", host: data.host || "",
            hostPhone: data.hostPhone || "", budget: data.budget || 1200,
            spent: data.spent || 0, email: data.email || "",
          });
        } else if (roomCode.current && roomCode.current !== "DEMO") {
          // No profile yet — show onboarding
          setShowOnboarding(true);
        }
      } else if (roomCode.current && roomCode.current !== "DEMO") {
        setShowOnboarding(true);
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


  // ─── WEATHER: Fetch real data via Gemini grounding ───
  const [weather, setWeather] = useState(W_DEFAULT);
  const [forecast, setForecast] = useState(null); // null = use FORECAST_DEFAULT
  useEffect(() => {
    fetch("/api/gemini", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Current weather in Podstrana, Split, Croatia right now. Sea temperature, UV index, sunset time today.", mode: "weather" }),
    }).then(r => r.json()).then(data => {
      try {
        const clean = data.text.replace(/```json|```/g, "").trim();
        const w = JSON.parse(clean);
        if (w.temp) setWeather({ icon: w.icon || "☀️", temp: w.temp, sea: w.sea || 24, uv: w.uv || 7, wind: w.wind || "N/A", sunset: w.sunset || "20:30", humidity: w.humidity || 50 });
      } catch { /* keep default */ }
    }).catch(() => { /* keep default */ });
  }, []);
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
        body: JSON.stringify({ roomCode: roomCode.current, guestName: G.name, lang }),
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
      const totalPersons = G.adults + (G.kids || 0);
      const res = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: exp.name, price: exp.price,
          quantity: totalPersons, roomCode: roomCode.current,
          guestName: G.name, lang,
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
  const dateLocale = lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-GB" : lang === "it" ? "it-IT" : lang === "si" ? "sl-SI" : lang === "cz" ? "cs-CZ" : lang === "pl" ? "pl-PL" : "hr-HR";
  const isAdmin = isAdmin;
  const daysLeft = 7 - kioskDay + 1;
  const budgetLeft = G.budget - G.spent;

  const tryPremium = (cb) => { if (premium) { cb(); } else { setShowPaywall(true); } };

  const doChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const sys = `Ti si JADRAN AI, 24/7 turistički concierge u Podstrani (blizu Splita), Hrvatska.
GOST: ${G.name}, ${G.country}, ${G.adults} odraslih + ${G.kids} djece (${G.kidsAges.join(',')} god). Interesi: ${G.interests.join(', ')}. ${G.car ? 'Ima auto.' : 'Nema auto.'}
SMJEŠTAJ: ${G.accommodation}. Domaćin: ${G.host} (${G.hostPhone}).
VRIJEME: ${weather.temp}°C ${weather.icon}, UV ${weather.uv}, more ${weather.sea}°C, zalazak ${weather.sunset}. Dan: ${kioskDay}/7.
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
  // ─── TIME-AWARE COLOR SYSTEM ───
  // Azure Blue (day: 6-19h) → Night Blue (evening: 19-6h)
  const isNight = hour >= 19 || hour < 6;
  const C = isNight ? {
    // 🌙 NIGHT BLUE — deep ocean
    bg: "#040a14", card: "rgba(8,18,32,0.9)", accent: "#38bdf8", acDim: "rgba(56,189,248,0.1)",
    gold: "#fbbf24", goDim: "rgba(251,191,36,0.08)", text: "#e0f2fe", mut: "#64748b",
    bord: "rgba(148,163,184,0.08)", red: "#f87171", green: "#4ade80", grDim: "rgba(74,222,128,0.08)",
    sky: "#0c4a6e", deep: "#082f49", warm: "#fbbf24", sand: "rgba(251,191,36,0.06)", terracotta: "#fb923c",
  } : {
    // ☀️ AZURE BLUE — Adriatic day
    bg: "#0a1628", card: "rgba(12,28,50,0.85)", accent: "#0ea5e9", acDim: "rgba(14,165,233,0.12)",
    gold: "#f59e0b", goDim: "rgba(245,158,11,0.08)", text: "#f0f9ff", mut: "#7dd3fc",
    bord: "rgba(14,165,233,0.08)", red: "#f87171", green: "#4ade80", grDim: "rgba(74,222,128,0.08)",
    sky: "#0c4a6e", deep: "#0e3a5c", warm: "#f59e0b", sand: "rgba(245,158,11,0.05)", terracotta: "#f97316",
  };
  const dm = { fontFamily: "'Outfit',sans-serif" };
  const fonts = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />;
  const hf = { fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif" }; // heading font

  /* ─── SHARED COMPONENTS ─── */
  const Badge = ({ c = "accent", children }) => (
    <span style={{ ...dm, display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, letterSpacing: 0.5, fontWeight: 500,
      background: c === "accent" ? C.acDim : c === "gold" ? C.goDim : c === "green" ? C.grDim : "rgba(248,113,113,0.08)",
      color: c === "accent" ? C.accent : c === "gold" ? C.gold : c === "green" ? C.green : C.red,
      border: `1px solid ${c === "accent" ? "rgba(14,165,233,0.1)" : c === "gold" ? "rgba(245,158,11,0.1)" : c === "green" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
    }}>{children}</span>
  );
  const Btn = ({ primary, small, children, ...p }) => (
    <button {...p} style={{ padding: small ? "10px 18px" : "16px 28px", background: primary ? `linear-gradient(135deg,${C.accent} 0%,#0284c7 100%)` : "rgba(186,230,253,0.03)",
      border: primary ? "none" : `1px solid rgba(186,230,253,0.06)`, borderRadius: 16, color: primary ? "#fff" : C.text,
      fontSize: small ? 13 : 17, fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif", cursor: "pointer", fontWeight: primary ? 400 : 400, transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", letterSpacing: primary ? 0.3 : 0, boxShadow: primary ? "0 6px 24px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.15)" : "none", ...(p.style || {}) }} className={primary ? "btn-glow" : ""}>{children}</button>
  );
  const Card = ({ children, glow, warm: isWarm, style: sx, ...p }) => (
    <div {...p} className="glass anim-card" style={{
      background: isWarm
        ? `linear-gradient(165deg, rgba(12,28,50,0.82), rgba(24,20,16,0.75))`
        : glow ? "rgba(12,28,50,0.82)" : "rgba(12,28,50,0.7)",
      borderRadius: 22, padding: 24,
      border: `1px solid ${isWarm ? "rgba(245,158,11,0.1)" : glow ? "rgba(14,165,233,0.12)" : C.bord}`,
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: glow
        ? "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(14,165,233,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...sx,
    }}>{children}</div>
  );
  const SectionLabel = ({ children, extra }) => (
    <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 16, height: 1, background: `linear-gradient(90deg, ${C.accent}, transparent)` }} />
      {children} {extra && <span style={{ color: C.accent, fontWeight: 600 }}>{extra}</span>}
    </div>
  );
  const BackBtn = ({ onClick }) => <button onClick={onClick} style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", padding: "12px 0" }}>{t("back",lang)}</button>;

  /* ─── SVG PICTOGRAMS — premium line icons ─── */
  const Icon = ({ d, size = 24, color = "currentColor", stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
  const IC = {
    // Phase nav
    plane:    "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
    home:     "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z M9 21V14h6v7",
    sparkle:  "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z",
    // Quick access
    parking:  "M5 21V5a2 2 0 0 1 2-2h5a5 5 0 0 1 0 10H7",
    beach:    "M17.5 21H6.5 M5 21l4.5-9h5l4.5 9 M12 3v9 M7.5 7h9",
    sun:      "M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41",
    map:      "M3 7l6-3l6 3l6-3v13l-6 3l-6-3l-6 3Z M9 4v13 M15 7v13",
    food:     "M3 2v7a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V2 M7 2v20 M21 15V2c-2.8 0-5 2.2-5 5v6h5",
    medic:    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 9v6 M9 12h6",
    gem:      "M6 3h12l4 6l-10 12L2 9Z M2 9h20",
    bot:      "M12 8V4H8 M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 16h0 M15 16h0",
    check:    "M20 6L9 17l-5-5",
    // City landmarks
    palace:   "M3 21h18 M5 21V10l7-7l7 7v11 M9 21v-5h6v5 M9 10h0 M15 10h0 M3 10h18 M7 7V4 M17 7V4",
    arena:    "M4 21c0-6 3.6-10.8 8-10.8S20 15 20 21 M6 21c0-4 2.7-7.2 6-7.2s6 3.2 6 7.2 M2 21h20 M8 10.5V8 M16 10.5V8 M12 10.2V7 M10 11V9 M14 11V9",
    church:   "M12 2v4 M10 4h4 M8 21V10l4-4l4 4v11 M8 10h8 M3 21h18 M10 16h4 M12 13v3",
    anchor:   "M12 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z M12 8v13 M5 21a7 7 0 0 1 7-7a7 7 0 0 1 7 7 M8 12H5 M19 12h-3",
    walls:    "M3 21V6l4-3l4 3l4-3l4 3l2 0v15 M3 6h18 M7 6v15 M11 6v15 M15 6v15",
    island:   "M2 20c2-3 5-5 10-5s8 2 10 5 M7 15V9l3-4l3 4v6 M12 5V3 M10 5h4",
  };

  // City landmark icon mapping — renders SVG instead of emoji for known cities
  const CITY_ICON = {
    "Podstrana & Split": { ic: IC.palace, clr: "#0ea5e9", fallback: "🏛️" },
    "Makarska rivijera": { ic: IC.beach, clr: "#38bdf8", fallback: "🏖️" },
    "Hvar":              { ic: IC.island, clr: "#f59e0b", fallback: "🏝️" },
    "Rovinj":            { ic: IC.church, clr: "#fb923c", fallback: "⛪" },
    "Pula & Medulin":    { ic: IC.arena, clr: "#a78bfa", fallback: "🏟️" },
    "Opatija":           { ic: IC.anchor, clr: "#34d399", fallback: "⚓" },
    "Otok Krk":          { ic: IC.island, clr: "#fbbf24", fallback: "🏝️" },
    "Makarska Riviera":  { ic: IC.beach, clr: "#38bdf8", fallback: "🏖️" },
    "Krk Island":        { ic: IC.island, clr: "#fbbf24", fallback: "🏝️" },
  };
  const CityIcon = ({ name, size = 28 }) => {
    const city = CITY_ICON[name];
    if (!city) return null;
    return <div style={{ width: size + 8, height: size + 8, borderRadius: 10, background: city.clr + "14", display: "grid", placeItems: "center", border: `1px solid ${city.clr}18` }}>
      <Icon d={city.ic} size={size} color={city.clr} stroke={1.5} />
    </div>;
  };
  const PhaseNav = () => {
    const phases = [
      { k: "pre", l: t("preTrip",lang), ic: IC.plane },
      { k: "kiosk", l: t("kiosk",lang), ic: IC.home },
      { k: "post", l: t("postStay",lang), ic: IC.sparkle },
    ];
    const idx = phases.findIndex(p => p.k === phase);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "20px 0 12px", position: "relative" }}>
        {/* Track line */}
        <div style={{ position: "absolute", top: 28, left: "12%", right: "12%", height: 1, background: C.bord, zIndex: 0 }} />
        <div style={{ position: "absolute", top: 28, left: "12%", width: `${(idx / (phases.length - 1)) * 76}%`, height: 1, background: `linear-gradient(90deg,${C.accent},${C.warm})`, zIndex: 1, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
        {phases.map((p, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <div key={p.k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, cursor: "pointer" }}
              onClick={() => { setPhase(p.k); if (p.k === "pre") setSubScreen("onboard"); else if (p.k === "kiosk") setSubScreen("home"); else setSubScreen("summary"); }}>
              <div style={{
                width: active ? 52 : 40, height: active ? 52 : 40,
                borderRadius: active ? 18 : 14,
                background: active ? `linear-gradient(135deg,${C.accent},#0284c7)` : done ? C.acDim : "rgba(12,28,50,0.6)",
                border: active ? "none" : `1.5px solid ${done ? C.accent : C.bord}`,
                display: "grid", placeItems: "center",
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: active ? `0 8px 28px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
              }}>
                {done
                  ? <Icon d={IC.check} size={active ? 22 : 18} color={C.accent} stroke={2.2} />
                  : <Icon d={p.ic} size={active ? 22 : 18} color={active ? "#fff" : done ? C.accent : C.mut} stroke={active ? 2 : 1.5} />
                }
              </div>
              <div style={{ ...dm, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: active ? C.text : done ? C.accent : C.mut, fontWeight: active ? 700 : done ? 500 : 400 }}>{p.l}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── PAYWALL ─── */
  const Paywall = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 28, maxWidth: 440, width: "100%", padding: "40px 32px", border: `1px solid rgba(251,191,36,0.15)`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("premiumTitle",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {t("premiumDesc",lang)}
        </div>
        <div style={{ background: C.goDim, borderRadius: 16, padding: "20px", border: `1px solid rgba(251,191,36,0.12)`, marginBottom: 20 }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: C.gold }}>5.99€</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("entireStay",lang)}</div>
        </div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.8, marginBottom: 20, textAlign: "left" }}>
          ✓ {t("payFeatures1",lang)}<br />
          ✓ {t("payFeatures2",lang)}<br />
          ✓ {t("payFeatures3",lang)}<br />
          ✓ {t("payFeatures4",lang)}<br />
          ✓ {t("payFeatures5",lang)}
        </div>
        <Btn primary style={{ width: "100%", marginBottom: 10 }} onClick={startPremiumCheckout}>
          {payLoading ? "⏳..." : t("unlockPremium",lang)}
        </Btn>
        <div style={{ ...dm, fontSize: 11, color: C.mut }}>{t("payVia",lang)}</div>
      </div>
    </div>
  );

  /* ─── BOOKING CONFIRM ─── */
  const BookConfirm = () => showConfirm && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 250, display: "grid", placeItems: "center" }} onClick={() => setShowConfirm(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 400, border: `1px solid rgba(14,165,233,0.15)` }}>
        <div className="check-anim" style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0284c7)`, display: "grid", placeItems: "center", fontSize: 40, margin: "0 auto 20px", color: "#fff", boxShadow: "0 8px 32px rgba(14,165,233,0.35)" }}>✓</div>
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
            <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginBottom: 8, background: `linear-gradient(135deg,${C.text} 30%,${C.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("welcome",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              {t("hostUsesName",lang).replace("{HOST}","")}<strong style={{ color: C.gold }}>{G.host}</strong><br />{t("onboardSub",lang)}
            </div>
            <Btn primary onClick={() => setOnboardStep(1)}>{t("createProfile",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 1 && (
          <Card style={{ padding: 32 }}>
            <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>{t("step1",lang)}</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>{t("interests",lang)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {INTERESTS.map(opt => (
                <div key={opt.k} onClick={() => setInterests(p => { const n = new Set(p); n.has(opt.k) ? n.delete(opt.k) : n.add(opt.k); return n; })}
                  style={{ padding: "16px 8px", background: interests.has(opt.k) ? C.acDim : C.card, border: `1px solid ${interests.has(opt.k) ? "rgba(14,165,233,0.25)" : C.bord}`, borderRadius: 14, cursor: "pointer", textAlign: "center", ...dm, fontSize: 13, color: interests.has(opt.k) ? C.accent : C.mut, transition: "all 0.3s" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{opt.e}</span>{(INTEREST_LABELS[opt.k]||{})[lang] || (INTEREST_LABELS[opt.k]||{}).hr || opt.k}
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
              {[...interests].map(k => { const o = INTERESTS.find(x => x.k === k); return o ? <Badge key={k} c="accent">{o.e} {(INTEREST_LABELS[k]||{})[lang] || (INTEREST_LABELS[k]||{}).hr || k}</Badge> : null; })}
            </div>
            <Btn primary onClick={() => setSubScreen("pretrip")}>{t("toPreTrip",lang)}</Btn>
          </Card>
        )}
      </div>
    );

    if (subScreen === "pretrip") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 30, fontWeight: 400 }}>{Math.max(0, Math.ceil((new Date(G.arrival) - new Date()) / 86400000))} {t("daysToGo",lang)} ☀️</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>{new Date(G.arrival).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long"})} – {new Date(G.departure).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long",year:"numeric"})} · {G.accommodation}</div>
        </div>
        <SectionLabel>{t("forecast",lang)}</SectionLabel>
        <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
          {(forecast || FORECAST_DEFAULT).map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: 12 }}>
              <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1 }}>{(FORECAST_DAYS[lang]||FORECAST_DAYS.hr)[d.di]}</div>
              <div style={{ fontSize: 22, margin: "4px 0" }}>{d.icon}</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>{d.h}°</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel extra="AI">{t("optPlan",lang)}</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>{t("rainDay",lang)}</strong> — {t("palaceTour",lang)}. <strong style={{ color: C.green }}>{t("sunnyDay",lang)}</strong> — {t("beachKayak",lang)}.
              {t("aiOptimized",lang)}
            </div>
          </Card>
          <Card>
            <SectionLabel>{t("packages",lang)}</SectionLabel>
            {BUNDLES.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < BUNDLES.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                <div><span style={{ marginRight: 8 }}>{b.emoji}</span><span style={{ ...dm, fontSize: 14 }}>{b.name[lang] || b.name.hr}</span></div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, maxWidth: 160 }}>{b.tip[lang] || b.tip.hr}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Accommodation — Booking.com Affiliate */}
        <SectionLabel extra="Booking.com">{t("findStay",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {ACCOMMODATION.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ cursor: "pointer", padding: 16, transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <CityIcon name={a.name.hr || a.name.en} size={24} />
                  <Badge c="accent">{a.region.toUpperCase()}</Badge>
                </div>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{a.name[lang] || a.name.hr}</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{a.note[lang] || a.note.hr}</div>
                <div style={{ ...dm, fontSize: 11, color: "#0055A6", marginTop: 8, fontWeight: 600 }}>{t("browseOn",lang)}</div>
              </Card>
            </a>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Btn primary onClick={() => setSubScreen("transit")}>{t("simArrival",lang)}</Btn>
        </div>
      </>
    );

    if (subScreen === "transit") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 28, fontWeight: 400 }}>{t("safeTrip",lang)} 🚗</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>{G.country === "DE" ? "München" : G.country === "AT" ? "Wien" : G.country === "IT" ? "Trieste" : G.country === "SI" ? "Ljubljana" : G.country === "CZ" ? "Praha" : G.country === "PL" ? "Kraków" : "Polazište"} → Podstrana</div>
        </div>
        {/* Map */}
        <div style={{ height: 160, borderRadius: 18, background: "linear-gradient(135deg,#1a2332,#0f1822)", position: "relative", overflow: "hidden", border: `1px solid ${C.bord}`, marginBottom: 16 }}>
          <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: 3, background: C.bord }} />
          <div style={{ position: "absolute", top: "50%", left: "10%", width: `${transitProg * 0.8}%`, height: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})`, transition: "width 0.4s" }} />
          <div style={{ position: "absolute", top: "calc(50% - 8px)", left: "8%", ...dm, fontSize: 12, color: C.mut }}>{G.flag} {G.country === "DE" ? "München" : G.country === "AT" ? "Wien" : G.country === "IT" ? "Trieste" : G.country === "SI" ? "Ljubljana" : G.country === "CZ" ? "Praha" : G.country === "PL" ? "Kraków" : "Start"}</div>
          <div style={{ position: "absolute", top: "calc(50% - 14px)", left: `calc(10% + ${transitProg * 0.8}% - 14px)`, fontSize: 28, transition: "left 0.4s" }}>🚗</div>
          <div style={{ position: "absolute", top: "calc(50% - 10px)", right: "6%", fontSize: 22 }}>🏖️</div>
        </div>
        {isAdmin && <input type="range" min={0} max={100} value={transitProg} onChange={e => setTransitProg(+e.target.value)} style={{ width: "100%", accentColor: C.accent, marginBottom: 16 }} />}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel>{t("onTheRoad",lang)}</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
              {transitProg < 40 && "🍽️ " + t("transitTip1",lang)}
              {transitProg >= 40 && transitProg < 75 && "🎫 " + t("transitTip2",lang)}
              {transitProg >= 75 && "🏖️ " + t("transitTip3",lang).replace("{HOST}", G.host)}
            </div>
          </Card>
          <Card>
            <SectionLabel>{t("arrival",lang)}</SectionLabel>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>☀️</div>
              <div style={{ fontSize: 32, fontWeight: 300 }}>31°</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("sunny",lang)} · {t("sea",lang)} {weather.sea}°C</div>
              <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 8 }}>🌅 {t("sunset",lang)} {weather.sunset}</div>
            </div>
          </Card>
        </div>
        <div style={{ textAlign: "center" }}>
          <Btn primary onClick={() => { setPhase("kiosk"); setSubScreen("home"); updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" }); }}>{t("arrived",lang)}</Btn>
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
    const tips = {
      hr: hour < 6 ? "Sutra sunčano. Alarm za 8h. WiFi: VillaMarija-5G / jadran2026."
        : hour < 12 ? "Savršeno za plažu Kašjuni — dođite prije 10h. Pekara Bobis (250m) ima burek od 6h!"
        : hour < 18 ? `UV ${weather.uv} — tražite hlad do 16h! Dioklecijanova palača ili Konzum idealni.`
        : hour < 22 ? `Zalazak sunca ${weather.sunset}. Konoba Stari Mlin (15min) — nazovite dan ranije!`
        : "Laku noć. Sutra sunčano, more 25°C.",
      de: hour < 6 ? "Morgen sonnig. Alarm für 8h empfohlen. WiFi: VillaMarija-5G / jadran2026."
        : hour < 12 ? "Perfekt für Strand Kašjuni — vor 10h kommen. Pekara Bobis (250m) hat frischen Burek ab 6h!"
        : hour < 18 ? `UV ${weather.uv} — Schatten suchen bis 16h! Dioklecijanova Palača oder Konzum ideal.`
        : hour < 22 ? `Sonnenuntergang ${weather.sunset}. Konoba Stari Mlin (15min) — rufen Sie einen Tag vorher an!`
        : "Gute Nacht. Morgen sonnig, Meer 25°C.",
      en: hour < 6 ? "Tomorrow sunny. Set alarm for 8am. WiFi: VillaMarija-5G / jadran2026."
        : hour < 12 ? "Perfect for Kašjuni beach — arrive before 10am. Pekara Bobis (250m) has fresh burek from 6am!"
        : hour < 18 ? `UV ${weather.uv} — seek shade until 4pm! Diocletian's Palace or Konzum shopping ideal.`
        : hour < 22 ? `Sunset at ${weather.sunset}. Konoba Stari Mlin (15min) — call a day ahead!`
        : "Good night. Tomorrow sunny, sea 25°C.",
      it: hour < 6 ? "Domani sole. Sveglia alle 8. WiFi: VillaMarija-5G / jadran2026."
        : hour < 12 ? "Perfetto per spiaggia Kašjuni — arrivare prima delle 10. Pekara Bobis (250m) ha burek fresco dalle 6!"
        : hour < 18 ? `UV ${weather.uv} — cercate ombra fino alle 16! Palazzo di Diocleziano o Konzum ideali.`
        : hour < 22 ? `Tramonto ${weather.sunset}. Konoba Stari Mlin (15min) — chiamate un giorno prima!`
        : "Buonanotte. Domani sole, mare 25°C.",
    };
    const tip = tips[lang] || tips[lang === "at" ? "de" : "hr"] || tips.hr;

    return (
      <>
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ ...dm, fontSize: 12, color: C.mut, letterSpacing: 2, textTransform: "uppercase" }}>
            {tipIcon} {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })} · {t("day",lang)} {kioskDay}/7
          </div>
          <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginTop: 8, lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>
          </div>
        </div>

        {/* Weather + UV + time sim */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 36 }}>{weather.icon}</span><span style={{ fontSize: 44, fontWeight: 300 }}>{weather.temp}°</span>
            </div>
            <div style={{ width: 1, height: 40, background: C.bord }} />
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.6 }}>
              {t("sea",lang)}: <strong style={{ color: C.accent }}>{weather.sea}°C</strong> · {weather.wind}<br />
              UV: <strong style={{ color: weather.uv >= 8 ? C.red : C.gold }}>{weather.uv}</strong>{weather.uv >= 8 && <span style={{ color: C.red }}> SPF50+!</span>} · 🌅 {weather.sunset}
            </div>
          </Card>
          {isAdmin && <Card style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 18px", minWidth: 180 }}>
            <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 1 }}>⏰ {t("simulation",lang)}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[{ h: null, l: "Sada" }, { h: 7, l: "07" }, { h: 13, l: "13" }, { h: 19, l: "19" }, { h: 23, l: "23" }].map(t => (
                <button key={t.l} onClick={() => setSimHour(t.h)} style={{ ...dm, padding: "5px 10px", background: simHour === t.h ? C.acDim : "transparent", border: `1px solid ${simHour === t.h ? "rgba(14,165,233,0.2)" : C.bord}`, borderRadius: 8, color: simHour === t.h ? C.accent : C.mut, fontSize: 11, cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>
          </Card>}
        </div>

        {/* AI Tip */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.goDim},rgba(14,165,233,0.03))`, borderColor: "rgba(251,191,36,0.1)", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28 }}>{tipIcon}</div>
          <div>
            <div style={{ ...dm, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>{t("aiRec",lang)}</div>
            <div style={{ ...dm, fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 300 }}>{tip}</div>
            {G.kids > 0 && hour >= 12 && hour < 18 && <div style={{ ...dm, fontSize: 13, color: C.accent, marginTop: 6 }}>👨‍👩‍👧‍👦 {({hr:"S djecom: Bačvice (pijesak, plitka voda) je savršena!",de:"Mit Kindern: Bačvice (Sand, flaches Wasser) ist perfekt!",en:"With kids: Bačvice (sand, shallow water) is perfect!",it:"Con bambini: Bačvice (sabbia, acqua bassa) è perfetta!",si:"Z otroki: Bačvice (pesek, plitva voda) je popolna!",cz:"S dětmi: Bačvice (písek, mělká voda) je perfektní!",pl:"Z dziećmi: Bačvice (piasek, płytka woda) jest idealna!"})[lang] || "S djecom: Bačvice (pijesak, plitka voda) je savršena!"}</div>}
          </div>
        </Card>

        {/* Budget */}
        <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ ...dm, fontSize: 11, color: C.mut }}>{t("budget",lang)} </span><span style={{ fontSize: 20, fontWeight: 300 }}>{G.spent}€</span><span style={{ ...dm, fontSize: 13, color: C.mut }}> / {G.budget}€</span></div>
            <div style={{ ...dm, fontSize: 13, color: C.accent }}>{budgetLeft}€ {t("left",lang)} · ~{Math.round(budgetLeft / daysLeft)}{t("perDay",lang)}</div>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: C.bord, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${(G.spent / G.budget * 100)}%`, borderRadius: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
        </Card>

        {/* Quick tiles */}
        <SectionLabel>{t("quickAccess",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { k: "parking", ic: IC.parking, l: t("parking",lang), clr: C.accent },
            { k: "beach", ic: IC.beach, l: t("beaches",lang), clr: "#38bdf8" },
            { k: "sun", ic: IC.sun, l: t("sun",lang), clr: C.warm },
            { k: "routes", ic: IC.map, l: t("routes",lang), clr: "#34d399" },
            { k: "food", ic: IC.food, l: t("food",lang), clr: C.terracotta },
            { k: "emergency", ic: IC.medic, l: t("emergency",lang), clr: C.red },
            { k: "gems", ic: IC.gem, l: t("gems",lang), clr: C.gold },
            { k: "chat", ic: IC.bot, l: t("aiGuide",lang), clr: "#a78bfa" },
          ].map(t => (
            <div key={t.k} onClick={() => {
              if (t.k === "gems") tryPremium(() => setSubScreen("gems"));
              else if (t.k === "chat") tryPremium(() => setSubScreen("chat"));
              else setSubScreen(t.k);
            }}
              className="anim-card glass" style={{
                background: "rgba(12,28,50,0.65)", borderRadius: 20, padding: "20px 12px 16px",
                textAlign: "center", cursor: "pointer", position: "relative",
                border: `1px solid ${C.bord}`, transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.clr + "33"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.25), 0 0 20px ${t.clr}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)"; }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: t.clr + "12", display: "grid", placeItems: "center", margin: "0 auto 10px", border: `1px solid ${t.clr}15`, transition: "all 0.3s" }}>
                <Icon d={t.ic} size={22} color={t.clr} stroke={1.6} />
              </div>
              <div style={{ ...dm, fontSize: 12, fontWeight: 500, color: C.text }}>{t.l}</div>
              {(t.k === "gems" || t.k === "chat") && !premium && <div style={{ position: "absolute", top: 8, right: 8, ...dm, fontSize: 8, color: C.gold, background: C.goDim, padding: "2px 7px", borderRadius: 8, fontWeight: 600, letterSpacing: 0.5, border: `1px solid rgba(245,158,11,0.1)` }}>PRO</div>}
            </div>
          ))}
        </div>

        {/* Experiences */}
        <SectionLabel extra={t("book",lang)}>{t("activities",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {EXPERIENCES.map((exp, _expIdx) => (
            <Card key={exp.id} style={{ padding: 0, overflow: "hidden", cursor: "pointer", opacity: booked.has(exp.id) ? 0.5 : 1, animation: `fadeUp 0.5s ease ${_expIdx * 0.08}s both` }}
              onClick={() => !booked.has(exp.id) && setSelectedExp(exp)}>
              <div style={{ height: 70, background: `linear-gradient(135deg,rgba(14,165,233,0.08),rgba(251,191,36,0.06),rgba(3,105,161,0.05))`, display: "grid", placeItems: "center", fontSize: 36, position: "relative", overflow: "hidden" }}><span className="emoji-float">{exp.emoji}</span></div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ ...dm, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mut }}>
                  <span>⏱{exp.dur} · ⭐{exp.rating} · 🎫{exp.spots}</span>
                  <span style={{ color: C.accent, fontSize: 16, fontWeight: 300 }}>~{exp.price}€</span>
                </div>
                {booked.has(exp.id) && <Badge c="green">✓ {t("booked",lang)}</Badge>}
              </div>
            </Card>
          ))}
        </div>

        {/* Extend Stay — Booking.com */}
        <Card style={{ marginBottom: 16, border: "1px dashed rgba(0,85,166,0.2)", background: "rgba(0,85,166,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 400 }}>🏨 {t("extendStay",lang)}</div>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>{t("bestDeals",lang)} — Booking.com</div>
            </div>
            <a href={BKG("-92163", "&checkin=&checkout=&group_adults=2&no_rooms=1")} target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 18px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{t("browseOn",lang)}</a>
          </div>
        </Card>

        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <Btn onClick={() => { setPhase("post"); setSubScreen("summary"); updateGuest(roomCode.current, { phase: "post", subScreen: "summary" }); }}>{t("checkOut",lang)}</Btn>
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
          <div style={{ fontSize: 28, fontWeight: 400 }}>{data.tk ? t(data.tk,lang) : data.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.items.map((it, i) => (
            <Card key={i} style={{ borderColor: it.warn ? "rgba(239,68,68,0.12)" : it.free ? "rgba(34,197,94,0.12)" : C.bord, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {it.warn && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, marginTop: 8, flexShrink: 0 }} />}
              {it.free && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, marginTop: 8, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{it.uvDynamic ? `UV ${weather.uv} (${weather.uv >= 8 ? "HIGH" : weather.uv >= 5 ? "MED" : "LOW"})` : typeof it.n === "object" ? (it.n[lang] || it.n.hr || "") : it.n}</div>
                <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>
                  {typeof it.note === "object" ? (it.note[lang] || it.note.hr || "") : it.note}
                  {it.d && <span style={{ color: C.accent, marginLeft: 8 }}>{it.d}</span>}
                  {it.price && <span style={{ color: C.text, marginLeft: 8 }}>{it.price}</span>}
                  {it.type && <span style={{ marginLeft: 8 }}>{it.type}</span>}
                </div>
                {it.affiliate && it.link && <a href={`https://${it.link}`} target="_blank" rel="noopener noreferrer" style={{ ...dm, display: "inline-block", marginTop: 6, padding: "4px 12px", background: C.goDim, borderRadius: 10, fontSize: 11, color: C.gold, textDecoration: "none", letterSpacing: 1 }}>🔗 {it.link}</a>}
                {it.affiliate && !it.link && <Badge c="gold">PARTNER</Badge>}
                {it.mapKey && <button onClick={(e) => { e.stopPropagation(); openGoogleMaps(it.mapKey); }}
                  style={{...dm,marginTop:6,padding:"6px 14px",background:C.acDim,border:`1px solid rgba(14,165,233,0.15)`,borderRadius:10,color:C.accent,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4}}>
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
        <div><div style={{ fontSize: 28, fontWeight: 400 }}>{t("gems",lang)}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("localTip",lang)}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginTop: 20 }}>
        {GEMS.map((g, i) => (
          <Card key={i} style={{ cursor: "pointer", position: "relative" }}
            onClick={() => { if (g.premium && !premium) setShowPaywall(true); else setSelectedGem(g); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3), 0 0 16px rgba(251,191,36,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            {g.premium && !premium && <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)", borderRadius: 18, display: "grid", placeItems: "center", zIndex: 5 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🔒</div><div style={{ ...dm, fontSize: 12, color: C.gold }}>Premium</div></div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{g.emoji}</span>
              <Badge c="gold">{(typeof g.type === "object" ? (g.type[lang] || g.type.hr) : g.type).toUpperCase()}</Badge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{g.name}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>{(typeof g.desc === "object" ? (g.desc[lang] || g.desc.hr) : g.desc).substring(0, 90)}...</div>
            <div style={{ ...dm, display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: C.mut }}>
              <span>⏰ {typeof g.best === "object" ? (g.best[lang] || g.best.hr) : g.best}</span><span>📍 {typeof g.diff === "object" ? (g.diff[lang] || g.diff.hr) : g.diff}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const KioskChat = () => {
    const prompts = [t("chatPrompt1",lang), t("chatPrompt2",lang), t("chatPrompt3",lang), t("chatPrompt4",lang)];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {chatMsgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>{t("askAnything",lang)}</div>
              <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 20 }}>{t("askDalmatia",lang)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => setChatInput(p)} style={{ ...dm, padding: "10px 16px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 14, color: C.text, fontSize: 14, cursor: "pointer" }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(14,165,233,0.08)" : "rgba(186,230,253,0.03)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.6, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
              {m.role !== "user" && <div style={{ fontSize: 10, color: C.accent, marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>JADRAN AI</div>}
              {m.text}
            </div>
          ))}
          {chatLoading && <div style={{ ...dm, maxWidth: "78%", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, opacity: 0.5 }}>● ● ●</div>}
          <div ref={chatEnd} />
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: `1px solid ${C.bord}` }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doChat()}
            placeholder={t("askPlaceholder",lang)} style={{ ...dm, flex: 1, padding: "14px 18px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 18, color: C.text, fontSize: 16, outline: "none" }} />
          <button onClick={doChat} style={{ padding: "14px 24px", background: `linear-gradient(135deg,${C.accent},#0284c7)`, border: "none", borderRadius: 18, color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 600 }}>→</button>
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
        <div style={{ ...hf, fontSize: 34, fontWeight: 400 }}>{t("thanks",lang)}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          7 {t("daysStay",lang)} · {EXPERIENCES.filter(e => booked.has(e.id)).length + 2} {t("activitiesDone",lang)} · {G.spent}€ · {t("unforgettable",lang)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Loyalty */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, borderColor: "rgba(14,165,233,0.1)" }}>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.gold, marginBottom: 4 }}>JADRAN LOYALTY</div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>🌊 {LOYALTY.tier}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, marginTop: 8 }}>
            {LOYALTY.points} {t("points",lang)} → <strong style={{ color: C.gold }}>{LOYALTY.next}</strong> ({LOYALTY.nextPts})
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", overflow: "hidden", margin: "12px 0 6px" }}>
            <div style={{ height: "100%", width: `${(LOYALTY.points / LOYALTY.nextPts) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>{t("more",lang)} {LOYALTY.nextPts - LOYALTY.points} {t("points",lang)}</div>
        </Card>

        {/* Revenue summary — admin only (visible with ?admin=sial) */}
        {isAdmin && <Card>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8 }}>💰 {t("revenue",lang)} (admin)</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 2 }}>
            Premium: <strong style={{ color: C.green }}>5.99€</strong><br />
            Affiliate: <strong style={{ color: C.green }}>~8-15€</strong><br />
            <span style={{ borderTop: `1px solid ${C.bord}`, display: "block", paddingTop: 4, marginTop: 4 }}>
              UKUPNO: <strong style={{ color: C.gold, fontSize: 18 }}>~20-30€</strong>
            </span>
          </div>
        </Card>}
      </div>

      {/* Referral */}
      <Card style={{ textAlign: "center", border: `1px dashed rgba(14,165,233,0.15)`, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{t("inviteFriends",lang)}</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 8 }}>{t("bothDiscount",lang)}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: C.accent, margin: "10px 0" }}>{LOYALTY.code}</div>
        <Btn primary>{t("shareCode",lang)}</Btn>
      </Card>

      {/* Rebooking — Booking.com Affiliate */}
      <Card style={{ textAlign: "center", padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("nextYear",lang)}</div>
        <div style={{ ...dm, fontSize: 14, color: C.mut, marginBottom: 16, lineHeight: 1.6 }}>
          {t("planNext",lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 16, textAlign: "left" }}>
          {ACCOMMODATION.slice(0, 4).map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px 12px", background: "rgba(0,85,166,0.04)", border: `1px solid rgba(0,85,166,0.1)`, borderRadius: 12, cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.1)"; }}>
                <CityIcon name={a.name.hr || a.name.en} size={18} />
                <div style={{ ...dm, fontSize: 12, fontWeight: 500, marginTop: 4 }}>{a.name[lang] || a.name.hr}</div>
              </div>
            </a>
          ))}
        </div>
        <a href={BKG("-92163")} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "14px 28px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,53,128,0.3)" }}>{t("browseOn",lang)}</a>
      </Card>

      {/* Monetization breakdown (admin) */}
      {isAdmin && <Card style={{ background: `linear-gradient(135deg,rgba(251,191,36,0.04),rgba(14,165,233,0.03))`, borderColor: "rgba(251,191,36,0.08)" }}>
        <SectionLabel extra="ADMIN">MONETIZACIJA</SectionLabel>
        <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
          1. Premium (5.99€) · 2. Affiliate (~8-15€) · 3. Host fee<br />
          <span style={{ color: C.gold }}>📊 ~20-30€/gost</span>
        </div>
      </Card>}
    </>
  );

  /* ═══ MAIN RENDER ═══ */

  /* ─── GUEST ONBOARDING ─── */
  if (showOnboarding) return (
    <GuestOnboarding
      roomCode={roomCode.current}
      onComplete={(guestData) => {
        setGuestProfile({
          name: guestData.name, first: guestData.first || guestData.name.split(" ").pop(),
          country: guestData.country, flag: guestData.flag || "🌍", lang: guestData.lang || "en",
          adults: guestData.adults || 2, kids: guestData.kids || 0, kidsAges: guestData.kidsAges || [],
          interests: guestData.interests || [], arrival: guestData.arrival || "",
          departure: guestData.departure || "", car: guestData.car || false,
          accommodation: guestData.accommodation || "", host: guestData.host || "",
          hostPhone: guestData.hostPhone || "", budget: guestData.budget || 1200,
          spent: guestData.spent || 0, email: guestData.email || "",
        });
        setLang(guestData.lang || "en");
        // Auto-set phase based on dates
        const now = new Date();
        const cin = new Date(guestData.arrival);
        const cout = new Date(guestData.departure);
        if (now < cin) { setPhase("pre"); setSubScreen("pretrip"); }
        else if (now <= cout) { setPhase("kiosk"); setSubScreen("home"); }
        else { setPhase("post"); setSubScreen("summary"); }
        setInterests(new Set(guestData.interests || []));
        setShowOnboarding(false);
        setSplash(false);
      }}
    />
  );

  /* ─── CINEMATIC SPLASH ─── */
  if (splash) return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#061020", color: "#e0f2fe", minHeight: "100vh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
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
        @keyframes splash-glow { 0%,100% { box-shadow: 0 0 40px rgba(14,165,233,0.2), 0 0 80px rgba(14,165,233,0.08); }
          50% { box-shadow: 0 0 60px rgba(14,165,233,0.35), 0 0 120px rgba(14,165,233,0.12); } }
        @keyframes splash-fade-out { 0% { opacity:1; } 100% { opacity:0; pointer-events:none; } }
        @keyframes splash-particles { 0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-120px) scale(0); opacity: 0; } }
        .splash-wrap { animation: splash-fade-out 0.8s ease 3s forwards; }
      `}</style>

      {/* Ambient light */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 60%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.03) 0%, transparent 50%)" }} />

      {/* Animated waves at bottom */}
      <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"320px", opacity:0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#0ea5e9" style={{ animation:"splash-wave-1 6s ease-in-out infinite" }}
          d="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z" />
        <path fill="#0284c7" style={{ animation:"splash-wave-2 7s ease-in-out infinite", opacity:0.6 }}
          d="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z" />
        <path fill="#075985" style={{ animation:"splash-wave-3 5s ease-in-out infinite", opacity:0.4 }}
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
            background: i % 2 === 0 ? "rgba(14,165,233,0.5)" : "rgba(251,191,36,0.4)",
            animation: `splash-particles ${3 + (i % 4)}s ease-in-out ${0.5 + i * 0.3}s infinite`,
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-wrap" style={{ textAlign:"center", position:"relative", zIndex:2 }}>
        {/* Logo circle */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #0284c7, #075985)",
          display: "grid", placeItems: "center",
          margin: "0 auto 28px",
          fontSize: 40, fontWeight: 700, color: "#fff",
          animation: "splash-logo-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both, splash-glow 3s ease-in-out infinite",
        }}>J</div>

        {/* Brand name */}
        <div style={{
          fontSize: 44, fontWeight: 300, textTransform: "uppercase", color: "#e0f2fe",
          animation: "splash-text-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
          letterSpacing: 8,
        }}>JADRAN</div>

        {/* Decorative line */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(251,191,36,0.3), transparent)",
          margin: "16px auto",
          animation: "splash-line 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14, fontWeight: 300, textTransform: "uppercase", letterSpacing: 4,
          color: "rgba(14,165,233,0.7)",
          animation: "splash-tagline 0.8s ease 1.6s both",
        }}>{t("tagline",lang)}</div>

        {/* Loading dots */}
        <div style={{ display:"flex", justifyContent:"center", gap: 6, marginTop: 32 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "rgba(14,165,233,0.5)",
              animation: `splash-dots 1.5s ease ${1.8 + i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* Powered by */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase",
          marginTop: 40,
          animation: "splash-tagline 0.6s ease 2.2s both",
        }}>SIAL Consulting d.o.o. · AI-Powered Concierge</div>
      </div>

      {/* Skip button */}
      <button onClick={() => setSplash(false)} style={{
        position:"absolute", bottom: 40, fontFamily:"'Outfit',sans-serif",
        background:"none", border:"1px solid rgba(186,230,253,0.1)", borderRadius: 20,
        color:"rgba(186,230,253,0.3)", fontSize: 11, padding:"8px 20px", cursor:"pointer",
        letterSpacing: 2, textTransform:"uppercase", transition:"all 0.3s",
        animation: "splash-tagline 0.5s ease 2.5s both",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.color = "rgba(14,165,233,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(186,230,253,0.1)"; e.currentTarget.style.color = "rgba(186,230,253,0.3)"; }}
      >{t("skipBtn",lang)}</button>
    </div>
  );
  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: `linear-gradient(160deg, ${C.bg} 0%, ${C.deep || C.bg} 50%, ${C.sky || C.bg} 100%)`, color: C.text, minHeight: "100vh", minHeight: "100vh", position: "relative" }}>
      {fonts}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(14,165,233,0.15); } 50% { box-shadow: 0 0 40px rgba(14,165,233,0.3); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes wave-move { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scale-in { from { opacity:0; transform: scale(0.9); } to { opacity:1; transform: scale(1); } }
        @keyframes slide-up { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
        @keyframes check-pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

        .jadran-ambient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: 
            radial-gradient(ellipse at 20% 10%, rgba(14,165,233,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 70%);
        }
        .jadran-ambient::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 300px;
          background: linear-gradient(to top, rgba(10,22,40,0.95), transparent);
        }
        .jadran-ambient::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(6,182,212,0.3), transparent);
          background-size: 200% 100%;
          animation: gradient-shift 8s ease infinite;
        }

        /* Wave decoration */
        .wave-deco { position: fixed; bottom: -2px; left: 0; width: 200%; height: 60px; opacity: 0.03; pointer-events: none; z-index: 1;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 60'%3E%3Cpath fill='%230ea5e9' d='M0,30 C360,60 720,0 1080,30 C1260,45 1350,15 1440,30 L1440,60 L0,60 Z'/%3E%3C/svg%3E") repeat-x;
          animation: wave-move 12s linear infinite;
        }

        /* Grain texture */
        .grain { position: fixed; inset: 0; opacity: 0.018; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.4); }

        /* Selection */
        ::selection { background: rgba(14,165,233,0.3); color: #f0f9ff; }

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

        /* Card hover — premium lift */
        .glass { transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .glass:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.05) !important; }

        /* Primary button glow */
        .btn-glow { position: relative; overflow: hidden; }
        .btn-glow::before { content: ''; position: absolute; inset: -2px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(14,165,233,0.4), rgba(2,132,199,0.2)); filter: blur(8px); opacity: 0; transition: opacity 0.3s; z-index: -1; }
        .btn-glow:hover::before { opacity: 1; }

        /* Card glass effect */
        .glass { backdrop-filter: blur(12px) saturate(1.4); -webkit-backdrop-filter: blur(12px) saturate(1.4); }

        /* Shimmer loading */
        .shimmer { background: linear-gradient(90deg, transparent 30%, rgba(14,165,233,0.06) 50%, transparent 70%);
          background-size: 200% 100%; animation: shimmer 2s ease infinite; }

        /* Overlay entrance */
        .overlay-enter { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Phase dot active pulse */
        .phase-active { animation: pulse-glow 3s ease infinite; }

        /* Premium badge shimmer */
        .premium-shimmer { background: linear-gradient(90deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.2) 50%, rgba(251,191,36,0.08) 100%);
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
        {/* Header — premium hotel lobby */}
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},#0284c7)`, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, color: "#fff", boxShadow: "0 4px 16px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}>J</div>
              <div>
                <div style={{ ...hf, fontSize: 22, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: C.text, lineHeight: 1 }}>Jadran</div>
                <div style={{ ...dm, fontSize: 9, color: C.accent, letterSpacing: 3, marginTop: 2, fontWeight: 500 }}>AI CONCIERGE</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {premium && <span className="premium-shimmer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 14px",borderRadius:20,fontSize:10,fontFamily:"'Outfit',sans-serif",color:C.gold,letterSpacing:1.5,fontWeight:600,border:`1px solid rgba(245,158,11,0.12)`}}>⭐ PREMIUM</span>}
              <div style={{display:"flex",gap:2,background:"rgba(12,28,50,0.5)",borderRadius:14,padding:3,border:`1px solid ${C.bord}`,backdropFilter:"blur(8px)"}}>
                {LANGS.map(lg => (
                  <button key={lg.code} onClick={() => setLang(lg.code)}
                    style={{...dm,padding:"5px 7px",background:lang===lg.code?C.acDim:"transparent",border:lang===lg.code?`1px solid rgba(14,165,233,0.15)`:"1px solid transparent",borderRadius:11,cursor:"pointer",fontSize:15,lineHeight:1,transition:"all 0.25s"}}
                    title={lg.name}>{lg.flag}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Guest bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, padding: "12px 18px", background: C.sand, borderRadius: 16, border: `1px solid rgba(245,158,11,0.06)` }}>
            <div style={{ ...dm, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{G.flag}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{G.name}</div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>{G.accommodation}</div>
              </div>
            </div>
            {G.arrival && <div style={{ ...dm, fontSize: 11, color: C.mut, textAlign: "right" }}>
              {new Date(G.arrival).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"short"})} – {new Date(G.departure).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"short"})}
            </div>}
          </div>
          {/* Warm divider */}
          <div style={{ height: 1, marginTop: 16, background: `linear-gradient(90deg, transparent, rgba(245,158,11,0.12) 30%, rgba(14,165,233,0.08) 70%, transparent)` }} />
        </div>

        {/* Phase Nav */}
        <PhaseNav />

        {/* Content */}
        {phase === "pre" && <div className="page-enter"><PreTrip /></div>}
        {phase === "kiosk" && <div className="page-enter" key={subScreen}><Kiosk /></div>}
        {phase === "post" && <div className="page-enter"><PostStay /></div>}

        <div style={{ ...dm, textAlign: "center", padding: "20px 0 28px", fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          JADRAN AI · SIAL Consulting d.o.o. · Powered by AI
        </div>
      </div>

      {/* Overlays */}
      {showPaywall && <Paywall />}
      {showConfirm && <BookConfirm />}

      {/* Gem detail */}
      {selectedGem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px) saturate(1.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedGem(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, border: `1px solid rgba(251,191,36,0.12)` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedGem.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedGem.name}</div>
            <div style={{ ...dm, fontSize: 15, color: C.mut, lineHeight: 1.8, marginBottom: 20 }}>{typeof selectedGem.desc === "object" ? (selectedGem.desc[lang] || selectedGem.desc.hr) : selectedGem.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{ l: "Najbolje doba", v: selectedGem.best }, { l: "Težina", v: selectedGem.diff }].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut }}>{x.l}</div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 600 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <Card glow style={{ background: C.goDim, borderColor: "rgba(251,191,36,0.12)" }}>
              <div style={{ ...dm, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 LOCALS TIP</div>
              <div style={{ ...dm, fontSize: 14, lineHeight: 1.6 }}>{typeof selectedGem.tip === "object" ? (selectedGem.tip[lang] || selectedGem.tip.hr) : selectedGem.tip}</div>
            </Card>
            {selectedGem.mapKey && <button onClick={() => openGoogleMaps(selectedGem.mapKey)}
              style={{...dm,width:"100%",marginTop:12,padding:"14px",background:C.acDim,border:`1px solid rgba(14,165,233,0.15)`,borderRadius:14,color:C.accent,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              📍 {t("openMap",lang)}</button>}
            <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => setSelectedGem(null)}>{t("back",lang)}</Btn>
          </div>
        </div>
      )}

      {/* Experience booking */}
      {selectedExp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px) saturate(1.5)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedExp(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 440, width: "100%", padding: 32, border: `1px solid ${C.bord}` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedExp.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedExp.name}</div>
            <div style={{ ...dm, display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 13, color: C.mut }}>
              <span>⏱ {selectedExp.dur}</span><span>⭐ {selectedExp.rating}</span>
            </div>
            <Card style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginBottom: 4 }}>{t("perPerson",lang)}</div>
              <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>~{selectedExp.price}€</div>
              {G.kids > 0 && <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 4 }}>{t("familyPrice",lang)}: ~{selectedExp.price * 2 + Math.round(selectedExp.price * 0.5 * 2)}€</div>}
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {selectedExp.gyg && <a href={selectedExp.gyg} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#FF5533,#FF7744)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(255,85,51,0.3)" }}>{t("bookVia",lang)} GetYourGuide →</a>}
              {selectedExp.viator && <a href={selectedExp.viator} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#2B8B4B,#3DA65E)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(43,139,75,0.3)" }}>{t("bookVia",lang)} Viator →</a>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setSelectedExp(null)}>{t("back",lang)}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
