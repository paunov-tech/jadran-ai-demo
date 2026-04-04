// ── Marketing Platform Config ──
// Single rebrand surface: change BRAND to switch from jadran → medical.ai
// All segments, copy, colors, and tracking in one place.

export const BRAND = {
  id: "jadran",                          // change to "medical" for medical.ai
  name: "JADRAN.AI",
  domain: "jadran.ai",
  tagline: "AI turistički vodič za hrvatsku obalu",
  primaryColor: "#0ea5e9",
  darkBg: "#0a1628",
  firestorePrefix: "mkt",               // Firestore collection prefix
  metaPixelId: null,                    // set in Vercel env: META_PIXEL_ID
  resendFromEmail: "noreply@jadran.ai",
  qualifyRoute: "/qualify",
  campaignsRoute: "/campaigns",
};

// ── Segments ──
// Each segment = one landing page variant + one email sequence
export const SEGMENTS = {
  de_camper: {
    id: "de_camper",
    lang: "de",
    label: "Camper DE",
    pain: "Du planst deine Kroatien-Tour und weißt nicht, wo du legal übernachten kannst?",
    benefit: "JADRAN.AI zeigt dir sofort legale Stellplätze, Stromanschlüsse und Entsorgungsstationen — auf Deutsch.",
    cta: "Kostenlos testen →",
    headline: "Kroatien mit dem Wohnmobil — ohne böse Überraschungen",
    subheadline: "KI-Reiseführer für die Adria: Stellplätze, Höhenbeschränkungen, Bora-Warnungen",
    emailSubject: "Dein Kroatien-Wohnmobil-Guide ist bereit",
    niche: "camper",
    lang_param: "de",
  },
  it_sailor: {
    id: "it_sailor",
    lang: "it",
    label: "Sailor IT",
    pain: "Stai pianificando una veleggiata in Croazia ma non sai dove ormeggiare?",
    benefit: "JADRAN.AI trova gli ormeggi ACI, i porti liberi e le previsioni meteo in tempo reale.",
    cta: "Prova gratis →",
    headline: "Veleggia la Croazia — senza sorprese",
    subheadline: "Guida AI per l'Adriatico: porti, ancoraggi, vento e meteo marino",
    emailSubject: "La tua guida vela Croazia è pronta",
    niche: "sailing",
    lang_param: "it",
  },
  en_cruiser: {
    id: "en_cruiser",
    lang: "en",
    label: "Cruiser EN",
    pain: "Planning a Croatia cruise but overwhelmed by marinas, anchorages and weather?",
    benefit: "JADRAN.AI gives you real-time Adriatic weather, marina availability and route planning in seconds.",
    cta: "Try free →",
    headline: "Cruise Croatia's Adriatic — smarter",
    subheadline: "AI travel guide: marinas, anchorages, bura forecasts, hidden bays",
    emailSubject: "Your Croatia sailing guide is ready",
    niche: "sailing",
    lang_param: "en",
  },
  de_family: {
    id: "de_family",
    lang: "de",
    label: "Family DE",
    pain: "Familienurlaub in Kroatien — aber wo sind die kinderfreundlichen Strände und sicheren Buchten?",
    benefit: "JADRAN.AI empfiehlt familienfreundliche Strände, flache Buchten und nahegelegene Restaurants.",
    cta: "Kostenlos testen →",
    headline: "Kroatien mit Kindern — entspannt und sicher",
    subheadline: "KI-Reiseguide: Sandstrände, Flachwasser-Buchten, Campingplätze",
    emailSubject: "Dein Familien-Kroatien-Guide ist bereit",
    niche: "camper",
    lang_param: "de",
  },
  en_couple: {
    id: "en_couple",
    lang: "en",
    label: "Couple EN",
    pain: "Looking for a romantic, uncrowded Adriatic escape — not the same tourist traps?",
    benefit: "JADRAN.AI finds hidden beaches, quiet coves and local restaurants that TripAdvisor never shows.",
    cta: "Explore now →",
    headline: "Discover Croatia's secret Adriatic",
    subheadline: "AI guide to hidden beaches, quiet anchorages and authentic local spots",
    emailSubject: "Your secret Croatia guide is ready",
    niche: "cruiser",
    lang_param: "en",
  },
};

// ── Email drip sequence ──
// Delays in hours from lead capture
export const EMAIL_SEQUENCE = [
  { step: 0, delayH: 0,   templateId: "welcome",    subject: (seg) => seg.emailSubject },
  { step: 1, delayH: 24,  templateId: "tip1",       subject: () => "3 insider tips for Croatia 🌊" },
  { step: 2, delayH: 72,  templateId: "social",     subject: () => "What other travellers said about JADRAN.AI" },
  { step: 3, delayH: 168, templateId: "upgrade",    subject: () => "Plan your trip — full guide unlocked" },
];

// ── A/B test config ──
export const AB_CONFIG = {
  minImpressions: 500,    // minimum before auto-kill
  minConvRate: 0.01,      // 1% lead rate threshold
  checkEvery: 100,        // re-evaluate every 100 impressions
};
