// /api/dmo.js — Destination Management Engine
// Tracks tourist density per region, calculates gaps, generates nudge directives
// Sources: Google Maps Popular Times, eVisitor baseline, internal JADRAN usage data
//
// ARCHITECTURE:
// ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
// │ DEMAND SENSOR│────▶│ GAP CALCULATOR│────▶│ NUDGE ENGINE │
// │              │     │              │     │              │
// │ Google Maps  │     │ Current vs   │     │ Injects into │
// │ eVisitor     │     │ Expected     │     │ AI prompt    │
// │ JADRAN usage │     │ per region   │     │ per region   │
// └──────────────┘     └──────────────┘     └──────────────┘
//
// Used by: api/chat.js (reads nudge directives), TZ Dashboard (reads gap data)

// ═══ REGION DEFINITIONS ═══
// Each destination has regions with Google Maps probe points
const DESTINATIONS = {
  croatia: {
    istra: {
      name: "Istra",
      probes: [
        { name: "Rovinj Old Town", placeId: "ChIJVVVVVaSOUkcR8DBBFO7VtsQ", weight: 1.0 },
        { name: "Pula Arena", placeId: "ChIJVzG4LO3YUUYR8nt4FbUNi2Y", weight: 0.8 },
        { name: "Poreč Euphrasian", placeId: "ChIJh0h2SdKTUkcR8Dq-e7pOx8s", weight: 0.7 },
      ],
      evisitorBaseline: { jun: 85, jul: 95, aug: 98, sep: 70, oct: 35 }, // % expected occupancy
    },
    kvarner: {
      name: "Kvarner (Rab, Krk, Cres, Lošinj)",
      probes: [
        { name: "Rab Town", placeId: "ChIJm8WqOrv1b0cRYC5H0g5kbHo", weight: 1.0 },
        { name: "Krk Town", placeId: "ChIJq6qqaqoKbkcReEe3fIRNK8Y", weight: 0.8 },
        { name: "Lopar Paradise Beach", placeId: "ChIJ5YSg_N_3b0cR6e-g4JvNkNU", weight: 0.6 },
      ],
      evisitorBaseline: { jun: 70, jul: 90, aug: 95, sep: 60, oct: 25 },
    },
    zadar_sibenik: {
      name: "Zadar & Šibenik",
      probes: [
        { name: "Zadar Sea Organ", placeId: "ChIJOe6xfv_SYkcRIFTzyqHGGaE", weight: 1.0 },
        { name: "Šibenik Cathedral", placeId: "ChIJ5w8qfgq3YkcR5rBmcOoYwiQ", weight: 0.8 },
        { name: "Krka National Park", placeId: "ChIJTQ0rZX3SYUcRACrJFc7Bguo", weight: 0.7 },
      ],
      evisitorBaseline: { jun: 75, jul: 92, aug: 97, sep: 65, oct: 30 },
    },
    split_makarska: {
      name: "Split & Makarska",
      probes: [
        { name: "Diocletian Palace", placeId: "ChIJB42Y7TXKYkcRkSm3F0jv7D0", weight: 1.0 },
        { name: "Makarska Riva", placeId: "ChIJe6jvSobRYEcR2DJYN-e7aKY", weight: 0.7 },
        { name: "Bol Zlatni Rat", placeId: "ChIJdbrQzJyqYEcR4DNuMlFPCBQ", weight: 0.6 },
      ],
      evisitorBaseline: { jun: 80, jul: 95, aug: 99, sep: 72, oct: 35 },
    },
    dubrovnik: {
      name: "Dubrovnik",
      probes: [
        { name: "Stradun", placeId: "ChIJv0sdVNKTThMRoC0KgV4m558", weight: 1.0 },
        { name: "Pile Gate", placeId: "ChIJpzxiMNeUThMREkgQFDr7ROE", weight: 0.8 },
      ],
      evisitorBaseline: { jun: 85, jul: 98, aug: 99, sep: 75, oct: 40 },
    },
  },
  // Future: montenegro, greece — same structure
};

// ═══ TZ PARTNER OVERRIDES ═══
// When a TZ signs up, they can set boost priorities for their region
// Stored in Firestore: jadran_dmo/{destination}_{region}
const DEFAULT_TZ_CONFIG = {
  boostEnabled: true,        // TZ wants gap-filling active
  boostStrength: "medium",   // low/medium/high — how aggressively to push
  priorityLocations: [],     // Specific POIs TZ wants promoted (e.g. "Kalifront", "Kamenjak")
  suppressLocations: [],     // Overcrowded spots to de-emphasize
  seasonalMessage: "",       // Custom TZ message for the season
};

// ═══ DEMAND SENSOR — Google Maps Popular Times ═══
// Uses Google Places API to read current busyness levels
async function probeGoogleBusyness(placeId, apiKey) {
  // Google Places Details API returns currentOpeningHours + current_busyness (if available)
  // Note: Popular Times is not in official API but can be estimated from "usual" data
  // For MVP: we use a scoring heuristic based on time of day + month + baseline
  // For production: integrate with Google Maps Platform "Place Details (New)" which includes
  // popularity data fields
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,utc_offset,business_status&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.result?.business_status === "OPERATIONAL") {
      return { status: "open", available: true };
    }
    return { status: "unknown", available: false };
  } catch (e) {
    return { status: "error", available: false, error: e.message };
  }
}

// ═══ GAP CALCULATOR ═══
// Compares current signals vs eVisitor baseline to identify under/over-performing regions
function calculateGaps(destination = "croatia") {
  const now = new Date();
  const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const currentMonth = monthNames[now.getMonth()];
  const regions = DESTINATIONS[destination];
  if (!regions) return [];

  const gaps = [];
  for (const [regionId, region] of Object.entries(regions)) {
    const baseline = region.evisitorBaseline[currentMonth] || 50;
    
    // For MVP: estimate current occupancy from:
    // 1. Day of week (weekends +15%, midweek -10%)
    // 2. Time in month (early month -5%, late month +5%)
    // 3. Year-over-year trend (assume +3% YoY growth)
    const dayOfWeek = now.getDay(); // 0=Sun
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const dayInMonth = now.getDate();
    
    let estimated = baseline;
    estimated += isWeekend ? 8 : -5;
    estimated += dayInMonth > 20 ? 5 : dayInMonth < 10 ? -5 : 0;
    estimated = Math.min(100, Math.max(5, estimated));
    
    // Gap = how far below full capacity (100%)
    const gapPercent = 100 - estimated;
    const needsBoost = gapPercent > 30; // More than 30% gap = needs promotion
    
    gaps.push({
      regionId,
      regionName: region.name,
      baseline,
      estimated,
      gapPercent,
      needsBoost,
      boostPriority: gapPercent > 50 ? "high" : gapPercent > 30 ? "medium" : "low",
    });
  }
  
  // Sort by gap (biggest gap first = most needs promotion)
  gaps.sort((a, b) => b.gapPercent - a.gapPercent);
  return gaps;
}

// ═══ NUDGE ENGINE ═══
// Generates AI prompt injection directives based on gap analysis
// Called by api/chat.js before building the system prompt
function generateNudgeDirectives(destination = "croatia", userRegion = null) {
  const gaps = calculateGaps(destination);
  if (!gaps.length) return null;
  
  // Find regions that need boosting (gap > 30%)
  const boostRegions = gaps.filter(g => g.needsBoost);
  if (!boostRegions.length) return null;
  
  // Don't nudge user AWAY from a region that needs them
  const nudgeTargets = boostRegions.filter(g => g.regionId !== userRegion);
  if (!nudgeTargets.length) return null;
  
  // Build nudge text for AI prompt
  const top3 = nudgeTargets.slice(0, 3);
  const nudgeLines = top3.map(g => {
    const urgency = g.boostPriority === "high" ? "AKTIVNO PREPORUČI" : "SUBTILNO PREDLOŽI";
    return `${urgency}: ${g.regionName} (trenutna popunjenost ~${g.estimated}%, prostor za ${g.gapPercent}% više gostiju)`;
  });

  const directive = `[DMO DIREKTIVA — PREUSMERAVANJE TURISTA]
Sljedeće regije imaju slobodnih kapaciteta i TZ partneri traže više gostiju:
${nudgeLines.join("\n")}

PRAVILA ZA PREPORUKE:
- Kad gost pita "što da radim sutra?" ili "koja je alternativa za X?" — predloži gore navedene regije
- Kad gost kaže da je neka plaža/grad prepun — predloži alternativu iz gore navedenih regija
- NE guraj turiste AKO ih ništa ne pitaju o alternativama
- NIKAD ne reci "TZ nas je zamolio" ili "sustav preporučuje" — budi prirodan kao lokalni vodič
- Format: "Ako tražite manje gužve, [regija] je u ovom periodu idealna — [konkretan razlog]."`;

  return {
    directive,
    gapData: gaps,
    boostRegions: top3.map(g => g.regionId),
    timestamp: new Date().toISOString(),
  };
}

// ═══ ADVANCED: eVisitor + Google Mobility Integration ═══
// For production: pull real data from Croatian Ministry of Tourism
// eVisitor API endpoint (requires partnership with HTZ):
// https://www.evisitor.hr/api/v1/statistics/arrivals?region=RAB&period=2026-07
//
// Google Maps Mobility Reports (aggregated, anonymized):
// https://www.google.com/covid19/mobility/ — discontinued but replaced by:
// Google Maps Platform → Place Insights (requires Enterprise license)
//
// IMPLEMENTATION PLAN:
// Phase 1 (now): Heuristic baseline from eVisitor published stats + time-of-year
// Phase 2 (post-pilot): Google Places API live busyness probes
// Phase 3 (TZ partnership): Direct eVisitor API access through HTZ agreement

// ═══ FIRESTORE: TZ CONFIGURATION ═══
// Each partner TZ stores their config in Firestore
// Path: jadran_dmo/{destination}_{regionId}
// Fields: boostEnabled, boostStrength, priorityLocations[], suppressLocations[], seasonalMessage
const PROJECT_ID = "molty-portal";
const FB_API_KEY = process.env.FIREBASE_API_KEY;

async function loadTZConfig(destination, regionId) {
  if (!FB_API_KEY) return DEFAULT_TZ_CONFIG;
  try {
    const docPath = `jadran_dmo/${destination}_${regionId}`;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?key=${FB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return DEFAULT_TZ_CONFIG;
    const doc = await res.json();
    if (!doc.fields) return DEFAULT_TZ_CONFIG;
    return {
      boostEnabled: doc.fields.boostEnabled?.booleanValue ?? true,
      boostStrength: doc.fields.boostStrength?.stringValue || "medium",
      priorityLocations: doc.fields.priorityLocations?.arrayValue?.values?.map(v => v.stringValue) || [],
      suppressLocations: doc.fields.suppressLocations?.arrayValue?.values?.map(v => v.stringValue) || [],
      seasonalMessage: doc.fields.seasonalMessage?.stringValue || "",
    };
  } catch {
    return DEFAULT_TZ_CONFIG;
  }
}

// ═══ API HANDLER ═══
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", 
    (["https://jadran.ai","https://monte-negro.ai","https://greek-islands.ai"].includes(req.headers.origin) 
      ? req.headers.origin : "https://jadran.ai"));
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { action, destination, region } = req.method === "GET" 
      ? req.query 
      : (req.body || {});

    // ACTION: gaps — return current gap analysis for all regions
    if (action === "gaps" || !action) {
      const gaps = calculateGaps(destination || "croatia");
      return res.status(200).json({ ok: true, gaps, timestamp: new Date().toISOString() });
    }

    // ACTION: nudge — return AI prompt directive for a specific user region
    if (action === "nudge") {
      const nudge = generateNudgeDirectives(destination || "croatia", region);
      return res.status(200).json({ ok: true, nudge, timestamp: new Date().toISOString() });
    }

    // ACTION: tz_config — load TZ partner configuration
    if (action === "tz_config") {
      const config = await loadTZConfig(destination || "croatia", region || "kvarner");
      return res.status(200).json({ ok: true, config });
    }

    return res.status(400).json({ error: "Unknown action. Use: gaps, nudge, tz_config" });
  } catch (err) {
    console.error("DMO error:", err);
    return res.status(500).json({ error: "DMO engine error" });
  }
}

// ═══ EXPORTS for use in chat.js ═══
export { calculateGaps, generateNudgeDirectives, loadTZConfig, DESTINATIONS };
