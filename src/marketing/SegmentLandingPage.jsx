// Route: /m/:slug  (e.g. /m/de_camper?v=vDEC_001)
// Product showcase landing page — show the app, let them try it, then convert.
// Structure: hero → how it works → live demo (ungated) → pricing → testimonials → CTA

import { useState, useEffect, useRef } from "react";
import { SEGMENTS } from "./marketingConfig.js";

const F = "'Outfit', system-ui, sans-serif";

// ── Per-segment content ───────────────────────────────────────────────────────
const CONTENT = {
  de_camper: {
    lang: "de",
    hero: {
      tag: "KI-REISEBEGLEITER FÜR WOHNMOBILREISENDE",
      h1: "Kroatien mit dem Wohnmobil —\nohne böse Überraschungen",
      sub: "Legale Stellplätze, Höhenbeschränkungen, Bura-Warnungen — alles auf Deutsch, alles in Echtzeit.",
      cta: "Kostenlos testen",
      ctaHref: "/ai?niche=camper&lang=de",
      ctaSub: "Keine Registrierung · 7 Fragen gratis",
    },
    steps: [
      { n:"1", title:"App öffnen", desc:"Keine Installation. Direkt im Browser, auf jedem Gerät." },
      { n:"2", title:"Deine Frage stellen", desc:"Auf Deutsch. Stellplatz, Route, Tunnel, Wetter — einfach fragen." },
      { n:"3", title:"Konkrete Antwort", desc:"Echte Ortsangaben, Preise und Warnungen — kein generisches Touristeninfo." },
    ],
    features: [
      { icon:"🅿️", title:"Legale Stellplätze", desc:"Alle genehmigten Stellplätze und Campingplätze entlang der Adria. Mit Strom, Wasser, Entsorgung. Kein Bußgeldrisiko." },
      { icon:"📏", title:"Höhenbeschränkungen", desc:"Tunnel Učka (4,2m), Brücken und Straßen mit Limits für dein Fahrzeug — bevor du hineingerätst." },
      { icon:"🌬️", title:"Bura-Warnungen", desc:"Echtzeit-Warnungen wenn gefährliche Böen auf Küstenstraßen aktiv sind. Automatisch für deine Route." },
      { icon:"⛽", title:"Günstigste Tankstellen", desc:"Dieselpreise entlang der Route. Kroatien ist bis zu 20% günstiger als Deutschland — wenn du weißt wo." },
      { icon:"🌊", title:"Live-Wetter & Meer", desc:"Temperatur, Wind, Wellengang — für den nächsten Badestrand oder Hafen auf deiner Route." },
      { icon:"🗺️", title:"Routenplanung", desc:"Wohnmobil-freundliche Routen. Keine Straßen mit Verboten, keine Überraschungen auf der Küstenstraße." },
    ],
    demo: {
      label: "PROBIERE ES SELBST — KEINE REGISTRIERUNG",
      placeholder: "z.B. Wo kann ich heute Nacht bei Split legal übernachten?",
      chips: ["Stellplatz bei Split?","Bura heute aktiv?","Tunnel Učka Höhe?","Günstige Entsorgung Istrien?"],
      errText: "Keine Antwort — bitte nochmal versuchen.",
    },
    pricing: {
      label: "PREISE",
      free: { label:"Kostenlos", price:"0 €", features:["7 Fragen gratis","Kein Konto nötig","Alle Regionen"] },
      explorer: { label:"Explorer", price:"9,99 €", per:"/Woche", features:["KI-Assistent Chat","Restaurants & Strände","Routen & Karten"] },
      season: { label:"Season Pass", price:"19,99 €", per:"/bis Oktober", badge:"AM BELIEBTESTEN", features:["Alles aus Explorer","🛡️ Travel Guardian: Sturm · Feuer · Grenze","📸 Jadran Lens: Strafen vermeiden","🎙️ Walkie-Talkie: sicher beim Fahren"] },
      vip: { label:"VIP Priority", price:"49,99 €", per:"/bis Oktober", features:["Alles aus Season Pass","⚡ 300 Nachrichten/Tag","🏆 Ausführlichere Antworten"] },
      ctaExplorer:"Explorer kaufen", ctaSeason:"Season Pass kaufen", ctaVip:"VIP kaufen",
    },
    proof: [
      { text:"Hat uns vor einem €200 Bußgeld gerettet — Stellplatz gefunden den Google Maps nicht kennt.", name:"Klaus & Renate", origin:"Bayern, Wohnmobil-Tour Istrien→Dubrovnik" },
      { text:"Tunnel-Warnung 10 Minuten bevor wir reingefahren wären. Unser Fahrzeug hätte nicht durchgepasst.", name:"Thomas H.", origin:"München → Dalmatien" },
      { text:"Endlich ein Guide der wirklich auf Deutsch antwortet und konkrete Orte nennt, keine leeren Phrasen.", name:"Brigitte S.", origin:"Wien, Stellplatz-Tour Kvarner" },
    ],
    faq: [
      { q:"Brauche ich ein Konto?", a:"Nein. Einfach öffnen und loslegen. 7 Fragen sind kostenlos, ohne Registrierung." },
      { q:"Funktioniert es auf dem Smartphone?", a:"Ja, vollständig optimiert für Mobilgeräte. Kein Download nötig." },
      { q:"Sind die Stellplätze aktuell?", a:"Die Datenbank wird laufend aktualisiert. Für Kroatien mit über 400 verifizierten Stellplätzen." },
      { q:"Was passiert nach 7 Fragen?", a:"Du kannst Explorer (9,99 €/Woche), Season Pass (19,99 €) oder VIP Priority (49,99 €) kaufen. Per Karte oder PayPal." },
    ],
    finalCta: "Jetzt kostenlos testen →",
    finalHref: "/ai?niche=camper&lang=de",
  },

  de_family: {
    lang: "de",
    hero: {
      tag: "FAMILIENURLAUB AN DER ADRIA",
      h1: "Kroatien mit Kindern —\nentspannt und sicher",
      sub: "Kinderfreundliche Strände, sichere Buchten, Restaurants ohne Touristenfallen — auf Deutsch.",
      cta: "Kostenlos testen",
      ctaHref: "/ai?niche=camper&lang=de",
      ctaSub: "Keine Registrierung · 7 Fragen gratis",
    },
    steps: [
      { n:"1", title:"App öffnen", desc:"Keine Installation. Direkt im Browser." },
      { n:"2", title:"Frage stellen", desc:"Strand für Kleinkinder, Restaurant, Ausflug — einfach fragen." },
      { n:"3", title:"Konkrete Empfehlung", desc:"Echte Orte, Preise, Öffnungszeiten — kein Touristenführer von 2019." },
    ],
    features: [
      { icon:"🏖️", title:"Kinderfreundliche Strände", desc:"Flaches Wasser, Sandstrand, keine gefährlichen Strömungen. Mit GPS-Koordinaten." },
      { icon:"🍕", title:"Familienrestaurants", desc:"Lokale Konobas mit Kinderteller — nicht die überteuerten Touristenrestaurants." },
      { icon:"🚗", title:"Parken & Anreise", desc:"Park&Ride-Optionen, Shuttle-Busse, Zugang zu Stränden mit dem Auto." },
      { icon:"🌊", title:"Badequalität live", desc:"Wassertemperatur, Wellen, UV-Index — für den perfekten Badetag." },
      { icon:"🎡", title:"Aktivitäten", desc:"Wasserparks, Ausflüge, Nationalparks — gefiltert nach Kinderalter." },
      { icon:"🌬️", title:"Wetterwarnungen", desc:"Bura und Gewitter rechtzeitig — damit der Strandtag nicht ins Wasser fällt." },
    ],
    demo: {
      label: "PROBIERE ES SELBST",
      placeholder: "z.B. Welcher Strand in der Nähe von Split ist sicher für Kleinkinder?",
      chips: ["Strand für Kleinkinder Split?","Kinderfreundliches Restaurant Hvar?","Wasserpark Kroatien?","Sichere Bucht ohne Strömung?"],
      errText: "Keine Antwort — bitte nochmal versuchen.",
    },
    pricing: {
      label: "PREISE",
      free: { label:"Kostenlos", price:"0 €", features:["7 Fragen gratis","Kein Konto","Alle Regionen"] },
      explorer: { label:"Explorer", price:"9,99 €", per:"/Woche", features:["KI-Assistent Chat","Restaurants & Strände","Routen & Karten"] },
      season: { label:"Season Pass", price:"19,99 €", per:"/bis Oktober", badge:"AM BELIEBTESTEN", features:["Alles aus Explorer","🛡️ Travel Guardian: Sturm · Feuer · Grenze","📸 Jadran Lens: Strafen vermeiden","🎙️ Walkie-Talkie: sicher beim Fahren"] },
      vip: { label:"VIP Priority", price:"49,99 €", per:"/bis Oktober", features:["Alles aus Season Pass","⚡ 300 Nachrichten/Tag","🏆 Ausführlichere Antworten"] },
      ctaExplorer:"Explorer kaufen", ctaSeason:"Season Pass kaufen", ctaVip:"VIP kaufen",
    },
    proof: [
      { text:"Meine Kinder haben mitgeplant statt zu quengeln. Der beste Urlaub seit Jahren.", name:"Familie Weber", origin:"Split–Hvar–Brač" },
      { text:"Hat uns den einzigen Strand ohne Strömung in der Gegend gezeigt. Perfekt für unsere 3-Jährige.", name:"Sandra M.", origin:"Wien, Makarska Riviera" },
      { text:"Restaurants die JADRAN.AI empfiehlt sind tatsächlich lokal und günstig. Kein einziges war eine Touristenfalle.", name:"Peter & Monika", origin:"München, Split-Urlaub" },
    ],
    faq: [
      { q:"Brauche ich ein Konto?", a:"Nein. Einfach öffnen und loslegen. 7 Fragen kostenlos." },
      { q:"Funktioniert es auf dem Smartphone?", a:"Ja, vollständig für Mobilgeräte optimiert." },
      { q:"Auf Deutsch?", a:"Ja, vollständig auf Deutsch — Fragen und Antworten." },
      { q:"Was kostet der Season Pass?", a:"19,99 € für die gesamte Saison April–Oktober. Einmalige Zahlung." },
    ],
    finalCta: "Jetzt kostenlos testen →",
    finalHref: "/ai?niche=camper&lang=de",
  },

  it_sailor: {
    lang: "it",
    hero: {
      tag: "GUIDA AI PER VELISTI IN CROAZIA",
      h1: "Veleggia la Croazia —\nsenza sorprese",
      sub: "Marine ACI, ancoraggi liberi, previsioni Bora e Jugo — tutto in italiano, tutto in tempo reale.",
      cta: "Prova gratis",
      ctaHref: "/ai?niche=sailing&lang=it",
      ctaSub: "Nessuna registrazione · 7 domande gratis",
    },
    steps: [
      { n:"1", title:"Apri l'app", desc:"Nessuna installazione. Direttamente nel browser, su qualsiasi dispositivo." },
      { n:"2", title:"Fai la tua domanda", desc:"In italiano. Marina, ancoraggio, meteo, rotta — chiedi semplicemente." },
      { n:"3", title:"Risposta concreta", desc:"Coordinate GPS, prezzi reali e avvisi — non informazioni generiche da depliant." },
    ],
    features: [
      { icon:"⚓", title:"Marine ACI", desc:"Disponibilità in tempo reale, prezzi e servizi per tutte le marine ACI della Dalmazia." },
      { icon:"🌬️", title:"Previsioni Bora e Jugo", desc:"Avvisi NAVTEX e meteo marino prima che la situazione diventi pericolosa. Non salpare alla cieca." },
      { icon:"🏝️", title:"Ancoraggi liberi", desc:"Le baie più belle dove passare la notte gratuitamente — lontano dalle flotte charter." },
      { icon:"🐟", title:"Ristoranti di pesce", desc:"Dove mangiano i pescatori locali, non i turisti. Con prezzi e indicazioni per arrivarci in barca." },
      { icon:"🗺️", title:"Rotte sicure", desc:"Rotte ottimizzate per velisti, scogli e bassi fondali inclusi." },
      { icon:"🌊", title:"Meteo marino live", desc:"Temperatura dell'acqua, altezza onde, direzione vento — aggiornati ogni ora." },
    ],
    demo: {
      label: "PROVALO TU STESSO — SENZA REGISTRAZIONE",
      placeholder: "es. Dove posso ancorare stanotte vicino a Hvar?",
      chips: ["Ancoraggio libero vicino Hvar?","Bora domani?","Marina ACI Šibenik disponibile?","Ristorante pesce Vis?"],
      errText: "Nessuna risposta — riprova.",
    },
    pricing: {
      label: "PREZZI",
      free: { label:"Gratis", price:"0 €", features:["7 domande gratis","Nessun account","Tutte le regioni"] },
      explorer: { label:"Explorer", price:"9,99 €", per:"/settimana", features:["Chat assistente AI","Ristoranti & spiagge","Rotte & mappe"] },
      season: { label:"Season Pass", price:"19,99 €", per:"/fino a ottobre", badge:"PIÙ POPOLARE", features:["Tutto da Explorer","🛡️ Travel Guardian: tempeste · incendi · confini","📸 Jadran Lens: evita multe €60","🎙️ Walkie-Talkie: usa in sicurezza alla guida"] },
      vip: { label:"VIP Priority", price:"49,99 €", per:"/fino a ottobre", features:["Tutto da Season Pass","⚡ 300 messaggi/giorno","🏆 Risposte dettagliate"] },
      ctaExplorer:"Acquista Explorer", ctaSeason:"Acquista Season Pass", ctaVip:"Acquista VIP",
    },
    proof: [
      { text:"Tre baie che non esistono su nessuna app. Incredibile per chi naviga in Croazia.", name:"Marco", origin:"Ancona → Spalato" },
      { text:"Avviso Bora 2 ore prima. Abbiamo aspettato a Šibenik. La barca era al sicuro.", name:"Giulia & Luca", origin:"Costa Dalmata, Oceanis 40" },
      { text:"La marina ACI era al completo ma JADRAN.AI mi ha trovato un ancoraggio gratuito a 200m.", name:"Roberto F.", origin:"Genova → Isole Elafiti" },
    ],
    faq: [
      { q:"Serve un account?", a:"No. Apri e inizia subito. 7 domande gratis, nessuna registrazione." },
      { q:"Funziona su smartphone?", a:"Sì, completamente ottimizzato per mobile." },
      { q:"I dati NAVTEX sono aggiornati?", a:"Sì, dati DHMZ in tempo reale aggiornati ogni ora." },
      { q:"Cosa succede dopo 7 domande?", a:"Puoi acquistare Explorer (9,99 €/settimana), Season Pass (19,99 €) o VIP Priority (49,99 €). Carta o PayPal." },
    ],
    finalCta: "Prova adesso gratis →",
    finalHref: "/ai?niche=sailing&lang=it",
  },

  en_cruiser: {
    lang: "en",
    hero: {
      tag: "AI GUIDE FOR SAILORS & CRUISERS",
      h1: "Cruise Croatia's Adriatic —\nsmarter",
      sub: "ACI marina availability, free anchorages, Bura forecasts, hidden bays — in English, in real time.",
      cta: "Try free",
      ctaHref: "/ai?niche=sailing&lang=en",
      ctaSub: "No registration · 7 questions free",
    },
    steps: [
      { n:"1", title:"Open the app", desc:"No install. Works in any browser, on any device." },
      { n:"2", title:"Ask your question", desc:"In English. Marina, anchorage, weather, route — just ask." },
      { n:"3", title:"Get a real answer", desc:"GPS coordinates, real prices and warnings — not generic tourist brochure copy." },
    ],
    features: [
      { icon:"⚓", title:"ACI Marina availability", desc:"Real-time berth availability, prices and services for all ACI marinas along the Dalmatian coast." },
      { icon:"🌬️", title:"Bura & Jugo forecasts", desc:"NAVTEX and marine weather before conditions turn dangerous. Don't leave port blind." },
      { icon:"🏝️", title:"Free anchorages", desc:"Beautiful bays to anchor overnight for free — away from charter flotillas and tourist crowds." },
      { icon:"🐟", title:"Where locals eat", desc:"Fish restaurants where the fishermen go, not the tourists. With prices and how to arrive by boat." },
      { icon:"🗺️", title:"Safe routes", desc:"Sailor-optimised routes. Rocks, shallow water and restricted areas all included." },
      { icon:"🌊", title:"Live marine weather", desc:"Sea temperature, wave height, wind direction — updated hourly from DHMZ." },
    ],
    demo: {
      label: "TRY IT YOURSELF — NO REGISTRATION",
      placeholder: "e.g. Where can I anchor tonight near Hvar for free?",
      chips: ["Free anchorage near Hvar?","Bura forecast tomorrow?","ACI Šibenik berth available?","Best fish restaurant Vis?"],
      errText: "No response — please try again.",
    },
    pricing: {
      label: "PRICING",
      free: { label:"Free", price:"€0", features:["7 questions free","No account needed","All regions"] },
      explorer: { label:"Explorer", price:"€9.99", per:"/week", features:["AI assistant chat","Restaurants & beaches","Routes & charts"] },
      season: { label:"Season Pass", price:"€19.99", per:"/until October", badge:"MOST POPULAR", features:["Everything in Explorer","🛡️ Travel Guardian: storms · fires · borders","📸 Jadran Lens: avoid €60 fines","🎙️ Walkie-Talkie: use safely while driving"] },
      vip: { label:"VIP Priority", price:"€49.99", per:"/until October", features:["Everything in Season","⚡ 300 messages/day","🏆 More detailed answers"] },
      ctaExplorer:"Buy Explorer", ctaSeason:"Buy Season Pass", ctaVip:"Buy VIP",
    },
    proof: [
      { text:"Found three anchorages that aren't on any chart app. Best tool I've used for Croatian waters.", name:"James", origin:"Sailing Ancona to Dubrovnik" },
      { text:"Bura warning 2 hours before it hit. Stayed in Šibenik. Boat was fine.", name:"Sarah & Tom", origin:"Hanse 458, Dalmatian coast" },
      { text:"The ACI was full but JADRAN.AI found me a free anchorage 200m away. Perfect night.", name:"Robert F.", origin:"Geneva → Elaphiti Islands" },
    ],
    faq: [
      { q:"Do I need an account?", a:"No. Open it and start immediately. 7 questions free, no signup." },
      { q:"Does it work on a phone?", a:"Yes, fully optimised for mobile. Works offline for cached responses." },
      { q:"Is the NAVTEX data live?", a:"Yes, DHMZ data updated hourly." },
      { q:"What happens after 7 questions?", a:"Buy Explorer (€9.99/week), Season Pass (€19.99) or VIP Priority (€49.99). Card or PayPal." },
    ],
    finalCta: "Try it free now →",
    finalHref: "/ai?niche=sailing&lang=en",
  },

  en_camper: {
    lang: "en",
    hero: {
      tag: "AI GUIDE FOR MOTORHOME TRAVELLERS",
      h1: "Road trip Croatia —\nwithout the nasty surprises",
      sub: "Legal camper spots, height restrictions, Bura warnings — in English, in real time.",
      cta: "Try free",
      ctaHref: "/ai?niche=camper&lang=en",
      ctaSub: "No registration · 7 questions free",
    },
    steps: [
      { n:"1", title:"Open the app", desc:"No install. Works in any browser, on any device." },
      { n:"2", title:"Ask your question", desc:"In English. Parking spot, route, tunnel, weather — just ask." },
      { n:"3", title:"Get a real answer", desc:"Real place names, prices and warnings — not generic tourist copy." },
    ],
    features: [
      { icon:"🅿️", title:"Legal camper spots", desc:"All approved motorhome stops along the Adriatic. With hookups, water, dump stations. No fine risk." },
      { icon:"📏", title:"Height restrictions", desc:"Učka tunnel (4.2m), bridges and roads with vehicle limits — before you drive into them." },
      { icon:"🌬️", title:"Bura wind warnings", desc:"Real-time alerts when dangerous gusts are active on coastal roads. Automatic for your route." },
      { icon:"⛽", title:"Cheapest fuel stops", desc:"Diesel prices along the route. Croatia can be 20% cheaper than Germany if you know where." },
      { icon:"🌊", title:"Live weather & sea", desc:"Temperature, wind, swell — for the next beach or harbour on your route." },
      { icon:"🗺️", title:"Route planning", desc:"Motorhome-friendly routes. No prohibited roads, no surprises on the coastal highway." },
    ],
    demo: {
      label: "TRY IT YOURSELF — NO REGISTRATION",
      placeholder: "e.g. Where can I legally park my motorhome near Split tonight?",
      chips: ["Legal spots near Split?","Bura active now?","Učka tunnel height?","Cheap dump station Istria?"],
      errText: "No response — please try again.",
    },
    pricing: {
      label: "PRICING",
      free: { label:"Free", price:"€0", features:["7 questions free","No account needed","All regions"] },
      explorer: { label:"Explorer", price:"€9.99", per:"/week", features:["AI assistant chat","Restaurants & beaches","Routes & maps"] },
      season: { label:"Season Pass", price:"€19.99", per:"/until October", badge:"MOST POPULAR", features:["Everything in Explorer","🛡️ Travel Guardian: storms · fires · borders","📸 Jadran Lens: avoid €60 fines","🎙️ Walkie-Talkie: use safely while driving"] },
      vip: { label:"VIP Priority", price:"€49.99", per:"/until October", features:["Everything in Season","⚡ 300 messages/day","🏆 More detailed answers"] },
      ctaExplorer:"Buy Explorer", ctaSeason:"Buy Season Pass", ctaVip:"Buy VIP",
    },
    proof: [
      { text:"Saved us from a €200 fine — found a legal spot that Google Maps doesn't even show.", name:"Dave & Sarah", origin:"Motorhome Split to Istria" },
      { text:"Height warning 10 minutes before the tunnel. Our van wouldn't have made it through.", name:"Mike", origin:"Lancashire → Dalmatia" },
      { text:"Finally a guide that gives real place names and prices, not tourist brochure nonsense.", name:"Clive & Jan", origin:"Touring from Split" },
    ],
    faq: [
      { q:"Do I need an account?", a:"No. Open it and start immediately. 7 questions free, no signup." },
      { q:"Does it work on a phone?", a:"Yes, fully optimised for mobile." },
      { q:"Are the parking spots up to date?", a:"Yes, verified database of 400+ spots across Croatia, updated continuously." },
      { q:"What happens after 7 questions?", a:"Buy Explorer (€9.99/week), Season Pass (€19.99) or VIP Priority (€49.99). Card or PayPal." },
    ],
    finalCta: "Try it free now →",
    finalHref: "/ai?niche=camper&lang=en",
  },

  en_couple: {
    lang: "en",
    hero: {
      tag: "AI GUIDE FOR CROATIA TRAVELLERS",
      h1: "Discover Croatia's\nsecret Adriatic",
      sub: "Hidden beaches, local restaurants, sunset spots — places TripAdvisor has never heard of.",
      cta: "Try free",
      ctaHref: "/ai?niche=apartment&lang=en",
      ctaSub: "No registration · 7 questions free",
    },
    steps: [
      { n:"1", title:"Open the app", desc:"No install. Works in any browser, on any device." },
      { n:"2", title:"Ask your question", desc:"Beach, restaurant, excursion, sunset spot — just ask." },
      { n:"3", title:"Get a real answer", desc:"Real places with GPS, prices and opening hours — not year-old blog posts." },
    ],
    features: [
      { icon:"🏖️", title:"Secret beaches", desc:"GPS coordinates to coves that aren't on Google Maps. Empty even in peak season." },
      { icon:"🍷", title:"Local restaurants", desc:"Where fishermen eat, not tourists. Konobas with no English menu and actual fresh fish." },
      { icon:"🌅", title:"Sunset spots", desc:"Best viewpoints for golden hour along the coast. With parking and how to get there." },
      { icon:"🌊", title:"Live sea conditions", desc:"Water temperature, waves, crowds — before you drive an hour to the beach." },
      { icon:"🗺️", title:"Island hopping", desc:"Ferry schedules, boat taxis, which islands are worth the trip and which to skip." },
      { icon:"🌬️", title:"Weather & wind", desc:"Bura and storm forecasts. Know before you go." },
    ],
    demo: {
      label: "TRY IT YOURSELF — NO REGISTRATION",
      placeholder: "e.g. What's the most secluded beach near Dubrovnik?",
      chips: ["Secluded beach near Dubrovnik?","Best local restaurant Split?","Sunset viewpoint Hvar?","Quiet island to visit?"],
      errText: "No response — please try again.",
    },
    pricing: {
      label: "PRICING",
      free: { label:"Free", price:"€0", features:["7 questions free","No account needed","All regions"] },
      explorer: { label:"Explorer", price:"€9.99", per:"/week", features:["AI assistant chat","Restaurants & beaches","All regions"] },
      season: { label:"Season Pass", price:"€19.99", per:"/until October", badge:"MOST POPULAR", features:["Everything in Explorer","🛡️ Travel Guardian: storms · fires · borders","📸 Jadran Lens: avoid €60 fines","🎙️ Walkie-Talkie: use safely while driving"] },
      vip: { label:"VIP Priority", price:"€49.99", per:"/until October", features:["Everything in Season","⚡ 300 messages/day","🏆 More detailed answers"] },
      ctaExplorer:"Buy Explorer", ctaSeason:"Buy Season Pass", ctaVip:"Buy VIP",
    },
    proof: [
      { text:"We had the beach completely to ourselves for two hours. No travel blog has mentioned it.", name:"Sophie & Tom", origin:"Island-hopping from Split" },
      { text:"The restaurant recommendation was so good the owner came out to talk to us.", name:"Anna & Felix", origin:"Honeymoon, Dubrovnik" },
      { text:"Found a cove on Vis that wasn't on any map. Best day of the whole holiday.", name:"Claire", origin:"Solo trip, Dalmatia" },
    ],
    faq: [
      { q:"Do I need an account?", a:"No. Open it and start immediately. 7 questions free, no signup." },
      { q:"Does it work on a phone?", a:"Yes, fully optimised for mobile." },
      { q:"Is it just a chatbot?", a:"It's a local knowledge system with live weather, crowd data and real-time conditions — not just a chatbot." },
      { q:"What happens after 7 questions?", a:"Buy Explorer (€9.99/week), Season Pass (€19.99) or VIP Priority (€49.99). Card or PayPal." },
    ],
    finalCta: "Try it free now →",
    finalHref: "/ai?niche=apartment&lang=en",
  },
};

const WA_NUMBER = "381695561699";

function getVid() {
  const KEY = "jadran_vid";
  let vid = localStorage.getItem(KEY);
  if (!vid) { const m = document.cookie.match(/(?:^|;\s*)jadran_vid=([^;]+)/); vid = m ? m[1] : null; }
  if (!vid) {
    vid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, vid);
    document.cookie = `jadran_vid=${vid}; expires=${new Date(Date.now()+30*86400000).toUTCString()}; path=/; SameSite=Lax`;
    return { vid, returning: false };
  }
  return { vid, returning: true };
}

const B = "'Outfit', system-ui, sans-serif";
const SKY = "#0ea5e9";
const DARK = "#050d1a";

export default function SegmentLandingPage({ slug }) {
  const seg = SEGMENTS[slug];
  const c = CONTENT[slug] || CONTENT.en_camper;

  const [variantId, setVariantId] = useState("default");
  const [vid, setVid] = useState("");
  const [returning, setReturning] = useState(false);

  // Demo chat
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoReplied, setDemoReplied] = useState(false);
  const chatRef = useRef(null);

  // Email capture (optional, at bottom)
  const [capEmail, setCapEmail] = useState("");
  const [capName, setCapName] = useState("");
  const [capDone, setCapDone] = useState(false);
  const [capLoading, setCapLoading] = useState(false);

  // In-app browser detection — FB/IG in-app browsers block Stripe redirects
  const _UA = typeof navigator !== "undefined" ? (navigator.userAgent || "") : "";
  const isInApp   = /FBAN|FBAV|FB_IAB|Instagram/i.test(_UA);
  const isIOS     = /iPhone|iPad|iPod/i.test(_UA);
  const isAndroid = /Android/i.test(_UA);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const openInChrome = () => {
    const here = window.location.href;
    window.location.href = `intent://${here.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
    setTimeout(() => { window.open(here, "_blank"); }, 1200);
  };
  const handleCta = (href) => {
    if (isInApp && isIOS) { setShowBrowserModal(true); return; }
    if (isInApp && isAndroid) { openInChrome(); return; }
    window.location.href = href;
  };

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v") || "default";
    setVariantId(v);
    const { vid: visitorId, returning: r } = getVid();
    setVid(visitorId); setReturning(r);
    fetch("/api/ab-impression", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ variantId: v, segmentId: slug, source: document.referrer || "direct" }) }).catch(()=>{});
  }, [slug]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, loading]);

  if (!seg) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:DARK, color:"#f0f9ff", fontFamily:B }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌊</div>
        <p>Page not found</p><a href="/" style={{ color:SKY, marginTop:16, display:"block" }}>Go home</a>
      </div>
    </div>
  );

  async function askAI(q) {
    if (!q.trim() || loading) return;
    const uMsg = { role:"user", content:q.trim() };
    setMsgs(p => [...p, uMsg]);
    setInput("");
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"}, signal: ctrl.signal,
        body: JSON.stringify({ mode: slug.includes("sail") || slug.includes("cruis") ? "sailing" : slug.includes("camper") ? "camper" : "landing",
          plan:"free", lang: c.lang === "de" ? "de" : c.lang === "it" ? "it" : "en",
          region:"all", messages:[...msgs, uMsg].slice(-4) }),
      });
      clearTimeout(t);
      const d = await r.json();
      const reply = d.content?.[0]?.text || d.reply || d.text || c.demo.errText;
      setMsgs(p => [...p, { role:"assistant", content:reply }]);
      setDemoReplied(true);
    } catch {
      setMsgs(p => [...p, { role:"assistant", content: c.demo.errText }]);
    }
    setLoading(false);
  }

  async function handleCapture(e) {
    e.preventDefault();
    if (!capEmail || capDone) return;
    setCapLoading(true);
    try {
      await fetch("/api/lead-capture", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: capEmail, name: capName, segmentId: slug, variantId, source:"landing_bottom", vid, returning,
          fingerprint:{ ua:navigator.userAgent, lang:navigator.language, tz:Intl.DateTimeFormat().resolvedOptions().timeZone } }) });
      fetch("/api/ab-convert", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ variantId, segmentId: slug }) }).catch(()=>{});
      setCapDone(true);
    } catch {}
    setCapLoading(false);
  }

  const { hero, steps, features, demo, pricing, proof, faq } = c;
  const isDE = c.lang === "de";
  const isIT = c.lang === "it";
  const waMsg = encodeURIComponent(isDE ? "Hallo, ich interessiere mich für JADRAN.AI 🌊" : isIT ? "Ciao, sono interessato a JADRAN.AI 🌊" : "Hi, I'm interested in JADRAN.AI 🌊");

  // ── helpers ──
  const Section = ({ children, bg, pt=48, pb=48 }) => (
    <div style={{ background: bg || "transparent", padding:`${pt}px 20px ${pb}px` }}>
      <div style={{ maxWidth:640, margin:"0 auto" }}>{children}</div>
    </div>
  );
  const SectionLabel = ({ text }) => (
    <p style={{ fontSize:10, letterSpacing:3, color:SKY, fontWeight:700, textAlign:"center", marginBottom:24 }}>{text}</p>
  );
  const PrimaryBtn = ({ href, text, sub, style:s }) => (
    <div style={{ textAlign:"center", ...s }}>
      <a href={isInApp ? undefined : href} onClick={isInApp ? (e) => { e.preventDefault(); handleCta(href); } : undefined}
        style={{ display:"inline-block", padding:"16px 36px", background:`linear-gradient(135deg,${SKY},#0284c7)`,
        color:"#fff", textDecoration:"none", borderRadius:16, fontWeight:700, fontSize:18, fontFamily:B,
        boxShadow:"0 8px 32px rgba(14,165,233,0.35)", transition:"all .2s", cursor:"pointer" }}>{text}</a>
      {sub && <p style={{ marginTop:10, fontSize:13, color:"#475569" }}>{sub}</p>}
    </div>
  );

  const browserModalJsx = showBrowserModal && (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,14,30,0.94)", zIndex:9999, display:"grid", placeItems:"center", padding:24 }}
      onClick={() => setShowBrowserModal(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background:"rgba(12,28,50,0.98)", borderRadius:24, padding:"32px 24px", maxWidth:380, width:"100%", border:"1px solid rgba(245,158,11,0.25)", textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:20, fontWeight:700, color:"#f0f9ff", marginBottom:10, fontFamily:B }}>
          {isDE ? "In Safari öffnen" : isIT ? "Apri in Safari" : "Open in Safari"}
        </div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:24 }}>
          {isDE ? "Facebook blockiert die sichere Bezahlseite. Öffne in Safari, dann kannst du bezahlen:" : isIT ? "Facebook blocca il pagamento. Apri in Safari:" : "Facebook blocks payments. Open in Safari to pay:"}
        </div>
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:16, padding:"20px 16px", marginBottom:24, textAlign:"left" }}>
          {[
            isDE ? "Tippe auf  ···  (unten rechts)" : isIT ? "Tocca  ···  (in basso a destra)" : "Tap  ···  (bottom right)",
            isDE ? 'Wähle „In Safari öffnen"' : isIT ? '"Apri in Safari"' : '"Open in Safari"',
            isDE ? 'Dann auf \u201eKaufen\u201c tippen' : isIT ? 'Poi tocca "Acquista"' : 'Then tap "Buy"',
          ].map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</div>
              <span style={{ fontSize:14, color:"#f0f9ff", lineHeight:1.4 }}>{step}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setShowBrowserModal(false)} style={{ width:"100%", padding:"14px 0", borderRadius:14, background:"rgba(100,116,139,0.15)", border:"1px solid rgba(100,116,139,0.2)", color:"#94a3b8", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:B }}>
          {isDE ? "Schließen" : isIT ? "Chiudi" : "Close"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background:DARK, color:"#f0f9ff", fontFamily:B, minHeight:"100dvh", overflowX:"hidden" }}>

      {browserModalJsx}

      {/* In-app browser warning */}
      {isInApp && (
        <div style={{ background:"#d97706", color:"#fff", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontSize:13, position:"sticky", top:0, zIndex:200 }}>
          <span style={{ fontWeight:600 }}>
            {isDE ? "⚠️ Zahlung nur in Safari/Chrome möglich" : isIT ? "⚠️ Pagamento solo in Safari/Chrome" : "⚠️ Payment requires Safari/Chrome"}
          </span>
          <button onClick={isAndroid ? openInChrome : () => setShowBrowserModal(true)}
            style={{ background:"#fff", color:"#d97706", border:"none", borderRadius:8, padding:"6px 14px", fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" }}>
            {isAndroid ? (isDE ? "Chrome →" : "Chrome →") : (isDE ? "Wie? →" : isIT ? "Come? →" : "How? →")}
          </button>
        </div>
      )}

      {/* ── NAV ── */}
      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
        borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(5,13,26,0.95)",
        position:"sticky", top:0, zIndex:100, backdropFilter:"blur(12px)" }}>
        <span style={{ fontSize:13, letterSpacing:3, color:SKY, fontWeight:700 }}>JADRAN.AI</span>
        <a href={isInApp ? undefined : hero.ctaHref}
          onClick={isInApp ? (e) => { e.preventDefault(); handleCta(hero.ctaHref); } : undefined}
          style={{ padding:"9px 20px", background:`linear-gradient(135deg,${SKY},#0284c7)`,
          color:"#fff", textDecoration:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          {isDE ? "App öffnen" : isIT ? "Apri l'app" : "Open app"}
        </a>
      </div>

      {/* ── HERO ── */}
      <Section pt={56} pb={48} bg="linear-gradient(180deg,#071828 0%,#050d1a 100%)">
        <p style={{ fontSize:11, letterSpacing:3, color:SKY, fontWeight:700, textAlign:"center", marginBottom:16 }}>{hero.tag}</p>
        <h1 style={{ fontSize:"clamp(26px,6vw,52px)", fontWeight:700, lineHeight:1.15, textAlign:"center",
          marginBottom:16, whiteSpace:"pre-line" }}>{hero.h1}</h1>
        <p style={{ fontSize:"clamp(15px,2.5vw,18px)", color:"#7dd3fc", textAlign:"center", lineHeight:1.6,
          marginBottom:40, maxWidth:520, margin:"0 auto 40px" }}>{hero.sub}</p>
        <PrimaryBtn href={hero.ctaHref} text={hero.cta} sub={hero.ctaSub} />
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section pt={48} pb={48} bg="#071828">
        <SectionLabel text={isDE ? "SO FUNKTIONIERT ES" : isIT ? "COME FUNZIONA" : "HOW IT WORKS"} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign:"center", padding:"20px 14px", background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.05)", borderRadius:16 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`rgba(14,165,233,0.12)`,
                border:`1px solid rgba(14,165,233,0.25)`, display:"flex", alignItems:"center",
                justifyContent:"center", margin:"0 auto 12px", fontSize:14, fontWeight:700, color:SKY }}>{s.n}</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{s.title}</div>
              <div style={{ fontSize:12, color:"#475569", lineHeight:1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── LIVE DEMO ── */}
      <Section pt={48} pb={48} bg={DARK}>
        <SectionLabel text={demo.label} />
        <div style={{ background:"rgba(10,18,32,0.95)", border:"1px solid rgba(14,165,233,0.18)",
          borderRadius:20, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>

          {/* Messages */}
          {msgs.length > 0 && (
            <div ref={chatRef} style={{ padding:"16px 16px 8px", maxHeight:320, overflowY:"auto" }}>
              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start",
                  marginBottom:10, animation:"msgIn .3s both" }}>
                  {m.role === "assistant" && (
                    <div style={{ marginRight:8, paddingTop:2 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:`rgba(14,165,233,0.12)`,
                        border:"1px solid rgba(14,165,233,0.2)", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:12, color:SKY, fontWeight:700, flexShrink:0 }}>AI</div>
                    </div>
                  )}
                  <div style={{ background:m.role==="user"?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(14,165,233,0.07)",
                    border:m.role==="user"?"none":"1px solid rgba(14,165,233,0.1)",
                    borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",
                    padding:"11px 15px", fontSize:14, color:m.role==="user"?"#fff":"#cbd5e1",
                    lineHeight:1.65, maxWidth:"82%", whiteSpace:"pre-wrap" }}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display:"flex", marginBottom:10 }}>
                  <div style={{ width:28,height:28,borderRadius:"50%",background:"rgba(14,165,233,0.12)",border:"1px solid rgba(14,165,233,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:SKY,fontWeight:700,flexShrink:0,marginRight:8 }}>AI</div>
                  <div style={{ background:"rgba(14,165,233,0.07)",border:"1px solid rgba(14,165,233,0.1)",borderRadius:"4px 16px 16px 16px",padding:"13px 15px",display:"flex",gap:5,alignItems:"center" }}>
                    {[0,1,2].map(i=><span key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#38bdf8",display:"inline-block",animation:`blink 1.4s ease ${i*.22}s infinite` }}/>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chips */}
          {!loading && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding: msgs.length ? "8px 14px 12px" : "16px 14px 12px",
              borderTop: msgs.length ? "1px solid rgba(14,165,233,0.07)" : "none" }}>
              {demo.chips.map((ch, i) => (
                <button key={i} onClick={() => askAI(ch)} disabled={loading}
                  style={{ padding:"9px 14px", background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.2)",
                    borderRadius:20, fontSize:13, color:"#7dd3fc", cursor:"pointer", fontFamily:B,
                    transition:"all .2s", opacity:loading?.4:1 }}>{ch}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ display:"flex", gap:8, padding:"10px 12px", borderTop:"1px solid rgba(14,165,233,0.07)" }}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),askAI(input))}
              placeholder={demo.placeholder} disabled={loading}
              style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(14,165,233,0.18)",
                borderRadius:12, padding:"12px 16px", fontSize:14, color:"#e2e8f0", outline:"none",
                fontFamily:B, caretColor:SKY }} />
            <button onClick={() => askAI(input)} disabled={!input.trim()||loading}
              style={{ width:44, height:44, borderRadius:11, border:"none", cursor:input.trim()&&!loading?"pointer":"default",
                background:input.trim()&&!loading?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(14,165,233,0.07)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {demoReplied ? (
            <div style={{ margin:"10px 12px 14px", borderRadius:14, background:"linear-gradient(135deg, rgba(245,158,11,0.12), rgba(234,88,12,0.08))", border:"1px solid rgba(245,158,11,0.3)", padding:"14px 16px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#f59e0b", marginBottom:4 }}>
                {isDE ? "Das war nur eine Vorschau." : isIT ? "Questa era solo un'anteprima." : "That was just a preview."}
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", marginBottom:12, lineHeight:1.5 }}>
                {isDE ? "Season Pass: ganzer Sommer, alle Regionen, Sturmwarnungen, Walkie-Talkie — einmalig 19,99 €." : isIT ? "Season Pass: tutta l'estate, tutte le regioni, allerte meteo, Walkie-Talkie — una tantum 19,99 €." : "Season Pass: full summer, all regions, storm alerts, Walkie-Talkie — one-time €19.99."}
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <a href={isInApp ? undefined : hero.ctaHref}
                  onClick={isInApp ? (e) => { e.preventDefault(); handleCta(hero.ctaHref); } : undefined}
                  style={{ flex:2, display:"block", padding:"11px 0", background:"linear-gradient(135deg,#f59e0b,#d97706)", borderRadius:10, color:"#0f172a", fontWeight:800, fontSize:14, textAlign:"center", textDecoration:"none", fontFamily:B, boxShadow:"0 2px 8px rgba(245,158,11,0.35)", cursor:"pointer" }}>
                  {isDE ? "Season Pass — 19,99 €" : isIT ? "Season Pass — 19,99 €" : "Season Pass — €19.99"} →
                </a>
                <a href={isInApp ? undefined : hero.ctaHref}
                  onClick={isInApp ? (e) => { e.preventDefault(); handleCta(hero.ctaHref); } : undefined}
                  style={{ flex:1, display:"block", padding:"11px 0", background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.2)", borderRadius:10, color:"#7dd3fc", fontSize:12, fontWeight:600, textAlign:"center", textDecoration:"none", fontFamily:B, cursor:"pointer" }}>
                  {isDE ? "Gratis testen" : isIT ? "Prova gratis" : "Try free"}
                </a>
              </div>
            </div>
          ) : (
            <p style={{ textAlign:"center", fontSize:12, color:"#475569", padding:"8px 16px 14px" }}>
              {isDE ? "7 Fragen kostenlos · Keine Registrierung" : isIT ? "7 domande gratis · Nessuna registrazione" : "7 questions free · No registration"}
            </p>
          )}
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section pt={48} pb={48} bg="#071828">
        <SectionLabel text={isDE ? "FUNKTIONEN" : isIT ? "FUNZIONALITÀ" : "FEATURES"} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:16, padding:"18px 16px" }}>
              <div style={{ fontSize:24, marginBottom:10 }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:12, color:"#475569", lineHeight:1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TECH STACK ── */}
      <Section pt={48} pb={48} bg={DARK}>
        <SectionLabel text={isDE ? "TECHNOLOGIE" : isIT ? "TECNOLOGIA" : "TECHNOLOGY"} />
        <p style={{ textAlign:"center", fontSize:isDE?14:15, color:"#64748b", lineHeight:1.7, marginBottom:32, maxWidth:560, margin:"0 auto 32px" }}>
          {isDE
            ? "Keine App von gestern. Jadran.ai ist die einzige Reise-KI, die Echtzeit-Satellitendaten, Straßenverkehr von HERE (BMW-Gruppe), EU-Wettersatelliten und militärgrade KI in einem System kombiniert."
            : isIT
            ? "Non una solita app. Jadran.ai è l'unica guida AI che combina dati satellitari in tempo reale, traffico HERE (Gruppo BMW), satelliti meteo UE e AI di livello militare in un unico sistema."
            : "Not an ordinary app. Jadran.ai is the only travel AI that combines real-time satellite data, HERE traffic (BMW Group), EU weather satellites and military-grade AI in one system."}
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:24 }}>
          {[
            {
              logo: "HERE",
              logoColor: "#00AFAA",
              name: isDE ? "HERE Maps Navigation" : isIT ? "HERE Maps Navigation" : "HERE Maps Navigation",
              desc: isDE ? "Präzise Routing-Daten von BMW und Bosch — dem Standard der Automobilindustrie. Kein Google, keine Werbung." : isIT ? "Dati di routing precisi da BMW e Bosch — lo standard dell'industria automobilistica." : "Precision routing data from BMW and Bosch — the automotive industry standard. No Google, no ads.",
              badge: isDE ? "BMW-Gruppe" : isIT ? "Gruppo BMW" : "BMW Group",
            },
            {
              logo: "ESA",
              logoColor: "#003087",
              name: isDE ? "Sentinel-2 EU-Satelliten" : isIT ? "Satelliti Sentinel-2 UE" : "Sentinel-2 EU Satellites",
              desc: isDE ? "Europäische Weltraumagentur-Satelliten überwachen Parkplätze, Strandbesucheraufkommen und Straßenzustände täglich." : isIT ? "Satelliti dell'Agenzia Spaziale Europea monitorano parcheggi, affollamento spiagge e condizioni stradali ogni giorno." : "European Space Agency satellites monitor parking, beach crowds and road conditions daily.",
              badge: isDE ? "EU-Daten" : isIT ? "Dati UE" : "EU Data",
            },
            {
              logo: "⚡",
              logoColor: "#8B5CF6",
              name: isDE ? "Anthropic Claude KI" : isIT ? "Anthropic Claude AI" : "Anthropic Claude AI",
              desc: isDE ? "Das einzige KI-Modell mit US-Verteidigungsministerium-Vertrag. Constitutional AI — keine Halluzinationen, keine falschen Infos." : isIT ? "L'unico modello AI con contratto con il Dipartimento della Difesa USA. Niente allucinazioni, niente false informazioni." : "The only AI model with a US Department of Defense contract. Constitutional AI — no hallucinations, no false information.",
              badge: isDE ? "US DoD Contract" : isIT ? "Contratto US DoD" : "US DoD Contract",
            },
            {
              logo: "👁",
              logoColor: "#F59E0B",
              name: isDE ? "YOLO Verkehrssensor-Netzwerk" : isIT ? "Rete sensori di traffico YOLO" : "YOLO Traffic Sensor Network",
              desc: isDE ? "160+ Verkehrssensoren entlang der Küste erfassen Besucheraufkommen, Fahrzeugdichte und Hafenauslastung — anonym, aggregiert, alle 15 Minuten aktualisiert." : isIT ? "160+ sensori di traffico lungo la costa rilevano affollamento, densità veicolare e occupazione dei porti — anonimi, aggregati, aggiornati ogni 15 minuti." : "160+ traffic sensors along the coast measure visitor density, vehicle flow and harbour occupancy — anonymous, aggregated, updated every 15 minutes.",
              badge: isDE ? "160+ Sensoren" : isIT ? "160+ sensori" : "160+ Sensors",
            },
            {
              logo: "🛰",
              logoColor: "#10B981",
              name: isDE ? "Google Street View" : isIT ? "Google Street View" : "Google Street View",
              desc: isDE ? "360°-Straßenansichten für präzise Standortverifizierung. Damit du weißt genau was dich erwartet — bevor du ankommst." : isIT ? "Viste stradali a 360° per la verifica precisa dei luoghi. Sai esattamente cosa ti aspetta prima di arrivare." : "360° street-level imagery for precise location verification. Know exactly what to expect before you arrive.",
              badge: isDE ? "Google Partner" : isIT ? "Google Partner" : "Google Partner",
            },
            {
              logo: "🇩🇪",
              logoColor: "#E5E7EB",
              name: isDE ? "Hetzner Cloud (Deutschland)" : isIT ? "Hetzner Cloud (Germania)" : "Hetzner Cloud (Germany)",
              desc: isDE ? "Server in deutschen Rechenzentren. DSGVO-konform. Deine Daten verlassen nie die EU — Datenschutz nach deutschem Standard." : isIT ? "Server in data center tedeschi. Conforme al GDPR. I tuoi dati non lasciano mai l'UE." : "Servers in German data centres. GDPR compliant. Your data never leaves the EU.",
              badge: isDE ? "DSGVO-konform" : isIT ? "Conforme GDPR" : "GDPR Compliant",
            },
          ].map((t, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:16, padding:"18px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${t.logoColor}18`, border:`1px solid ${t.logoColor}30`,
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                  fontSize: t.logo.length > 2 ? 11 : 18, fontWeight:800, color:t.logoColor, letterSpacing:-0.5 }}>
                  {t.logo}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#f0f9ff", lineHeight:1.2 }}>{t.name}</div>
                  <div style={{ fontSize:10, color:t.logoColor, fontWeight:700, letterSpacing:1, marginTop:2 }}>{t.badge}</div>
                </div>
              </div>
              <p style={{ fontSize:12, color:"#475569", lineHeight:1.55 }}>{t.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(14,165,233,0.04)", border:"1px solid rgba(14,165,233,0.12)", borderRadius:14, padding:"16px 18px", textAlign:"center" }}>
          <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>
            {isDE
              ? "6 Enterprise-APIs · 160+ Verkehrssensoren · EU-Satellitendaten · Militärgrade KI · DSGVO-konforme deutsche Server"
              : isIT
              ? "6 API Enterprise · 160+ sensori di traffico · Dati satellitari UE · AI livello militare · Server tedeschi GDPR"
              : "6 Enterprise APIs · 160+ traffic sensors · EU satellite data · Military-grade AI · GDPR-compliant German servers"}
          </p>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section pt={48} pb={48} bg={DARK}>
        <SectionLabel text={pricing.label} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.2fr 1fr", gap:12 }}>
          {[
            { ...pricing.free, isFree:true },
            { ...pricing.explorer, ctaText: pricing.ctaExplorer, ctaHref: hero.ctaHref },
            { ...pricing.season, ctaText: pricing.ctaSeason, ctaHref: hero.ctaHref },
            { ...pricing.vip, ctaText: pricing.ctaVip, ctaHref: hero.ctaHref },
          ].map((tier, i) => (
            <div key={i} style={{
              background: i===2 ? "rgba(245,158,11,0.06)" : i===3 ? "rgba(168,85,247,0.04)" : "rgba(255,255,255,0.02)",
              border: i===2 ? "1px solid rgba(245,158,11,0.4)" : i===3 ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(255,255,255,0.05)",
              borderRadius:16, padding:"20px 14px", textAlign:"center", position:"relative",
              transform: i===2 ? "scale(1.02)" : "none", zIndex: i===2 ? 1 : 0 }}>
              {tier.badge && (
                <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
                  background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff",
                  fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, letterSpacing:1, whiteSpace:"nowrap" }}>
                  {tier.badge}
                </div>
              )}
              <div style={{ fontSize:13, color: i===2 ? "#f59e0b" : i===3 ? "#a855f7" : "#64748b", fontWeight: i===2||i===3 ? 700 : 400, letterSpacing:1, marginBottom:6 }}>{tier.label}</div>
              <div style={{ fontSize:26, fontWeight:700, color: i===2 ? "#f59e0b" : i===3 ? "#a855f7" : "#f0f9ff", marginBottom:2 }}>{tier.price}</div>
              {tier.per && <div style={{ fontSize:12, color:"#475569", marginBottom:14 }}>{tier.per}</div>}
              <div style={{ marginBottom:16 }}>
                {tier.features.map((f, j) => (
                  <div key={j} style={{ fontSize:12, color:"#64748b", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                    ✓ {f}
                  </div>
                ))}
              </div>
              {tier.isFree ? (
                <a href={hero.ctaHref} style={{ display:"block", padding:"10px", background:"rgba(14,165,233,0.08)",
                  border:"1px solid rgba(14,165,233,0.2)", color:SKY, textDecoration:"none",
                  borderRadius:10, fontSize:13, fontWeight:600 }}>
                  {isDE ? "Kostenlos starten" : isIT ? "Inizia gratis" : "Start free"}
                </a>
              ) : (
                <a href={`/ai?niche=${seg.niche}&lang=${seg.lang_param}`} style={{ display:"block", padding:"10px",
                  background: i===3 ? "linear-gradient(135deg,#a855f7,#7c3aed)" : i===2 ? "linear-gradient(135deg,#f59e0b,#d97706)" : `linear-gradient(135deg,${SKY},#0284c7)`,
                  color:"#fff", textDecoration:"none", borderRadius:10, fontSize:13, fontWeight:700 }}>
                  {tier.ctaText}
                </a>
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign:"center", fontSize:12, color:"#334155", marginTop:14 }}>
          {isDE ? "Karte oder PayPal · Sofortiger Zugang · Keine Abo-Falle" : isIT ? "Carta o PayPal · Accesso immediato · Nessun abbonamento" : "Card or PayPal · Instant access · No subscription trap"}
        </p>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section pt={40} pb={40} bg="#071828">
        <SectionLabel text={isDE ? "WAS ANDERE SAGEN" : isIT ? "COSA DICONO" : "WHAT OTHERS SAY"} />
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {proof.map((p, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:16, padding:"18px 18px" }}>
              <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.6, fontStyle:"italic", marginBottom:10 }}>"{p.text}"</p>
              <p style={{ fontSize:12, color:"#475569" }}>— <strong style={{ color:"#64748b" }}>{p.name}</strong>, {p.origin}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section pt={40} pb={40} bg={DARK}>
        <SectionLabel text="FAQ" />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {faq.map((f, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
              borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{f.q}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.55 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section pt={48} pb={16} bg="#071828">
        <PrimaryBtn href={hero.ctaHref} text={c.finalCta} sub={hero.ctaSub} />
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"24px 0 16px", color:"#1e293b", fontSize:12 }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.04)" }}/><span>{isDE?"oder":isIT?"o":"or"}</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.04)" }}/>
        </div>
        <button onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, "_blank")}
          style={{ width:"100%", padding:"13px", background:"#25D366", color:"#fff", border:"none",
            borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:B,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          {isDE ? "Frage per WhatsApp" : isIT ? "Chiedi su WhatsApp" : "Ask via WhatsApp"}
        </button>
      </Section>

      {/* ── EMAIL CAPTURE (optional, below fold) ── */}
      {!capDone && (
        <Section pt={24} pb={48} bg="#071828">
          <p style={{ textAlign:"center", fontSize:12, color:"#334155", marginBottom:14 }}>
            {isDE ? "Oder: Guide per E-Mail erhalten" : isIT ? "Oppure: ricevi la guida per email" : "Or: get the guide by email"}
          </p>
          <form onSubmit={handleCapture} style={{ display:"flex", gap:8 }}>
            <input type="email" required placeholder={isDE?"E-Mail-Adresse":isIT?"Indirizzo email":"Email address"}
              value={capEmail} onChange={e=>setCapEmail(e.target.value)}
              style={{ flex:1, padding:"12px 14px", background:"rgba(255,255,255,0.04)",
                border:"1px solid rgba(255,255,255,0.07)", borderRadius:11, color:"#94a3b8",
                fontSize:14, outline:"none", fontFamily:B }} />
            <button type="submit" disabled={capLoading}
              style={{ padding:"12px 20px", background:"rgba(14,165,233,0.1)", border:"1px solid rgba(14,165,233,0.2)",
                color:SKY, borderRadius:11, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:B, whiteSpace:"nowrap" }}>
              {capLoading ? "..." : isDE ? "Senden" : isIT ? "Invia" : "Send"}
            </button>
          </form>
        </Section>
      )}
      {capDone && (
        <Section pt={16} pb={48} bg="#071828">
          <p style={{ textAlign:"center", fontSize:13, color:"#38bdf8" }}>
            {isDE ? `✓ Guide an ${capEmail} gesendet` : isIT ? `✓ Guida inviata a ${capEmail}` : `✓ Guide sent to ${capEmail}`}
          </p>
        </Section>
      )}

      <footer style={{ padding:"24px 20px", textAlign:"center", fontSize:11, color:"#1e293b", background:DARK, borderTop:"1px solid rgba(255,255,255,0.03)" }}>
        <a href="/privacy" style={{ color:"#1e293b", textDecoration:"none" }}>Privacy</a>
        {" · "}JADRAN.AI · SIAL Consulting d.o.o.
      </footer>

      <style>{`
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes blink { 0%,80%,100%{opacity:.15} 40%{opacity:1} }
        * { box-sizing:border-box; }
        html,body { overflow-x:hidden; max-width:100vw; margin:0; padding:0; }
        input::placeholder { color:#334155; }
        input { transition:border-color .2s; }
        input:focus { border-color:${SKY} !important; }
        button:hover { opacity:.9; }
        a:hover { opacity:.85; }
      `}</style>
    </div>
  );
}
