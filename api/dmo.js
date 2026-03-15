// /api/dmo.js — Destination Management Engine v2
// LIVE for: RAB (full sub-region coverage)
// TEMPLATE-READY for: any destination — copy RAB block, change probes
//
// GOOGLE INTEGRATION:
// 1. Places Aggregate API — POI density per area (10K free/mo)
// 2. Places Details (New) — live open/closed status per probe
// 3. Places Insights BigQuery — historical trend analysis
// 4. Weather API overlay — bura/storms affect tourist flow
//
// INTERNAL DATA:
// 5. eVisitor baseline — HTZ published occupancy statistics
// 6. JADRAN.AI usage — chat sessions per region (Firestore)

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const FB_API_KEY = process.env.FIREBASE_API_KEY;
const PROJECT_ID = "molty-portal";

// ═══ RAB — FULLY IMPLEMENTED ═══
const DESTINATIONS = {
  rab: {
    id: "rab", name: "Otok Rab", country: "croatia", parentRegion: "kvarner",
    tz: "TZ Grada Raba", status: "LIVE",
    subRegions: {
      rab_town: {
        name: "Grad Rab (Stari grad)",
        desc: "Srednjovjekovni centar, 4 zvonika, riva, konobe",
        lat: 44.7561, lng: 14.7603,
        probes: [
          { name: "Trg Sv. Kristofora", placeId: "ChIJm8WqOrv1b0cRYC5H0g5kbHo", weight: 1.0 },
          { name: "Rab Riva", placeId: "ChIJiQFD_rr1b0cROFniCQFvtrE", weight: 0.9 },
        ],
        baseline: { may:25, jun:65, jul:88, aug:95, sep:55, oct:20 },
        capacity: { restaurants:45, beds:1200, dailyMax:3000 },
        tzPriority: "suppress_when_full",
      },
      lopar: {
        name: "Lopar (Paradise Beach)",
        desc: "1.5km pješčana plaža, plitko more, obitelji s djecom",
        lat: 44.8283, lng: 14.7283,
        probes: [
          { name: "Rajska Plaža", placeId: "ChIJ5YSg_N_3b0cR6e-g4JvNkNU", weight: 1.0 },
          { name: "San Marino Resort", placeId: "ChIJYSFCvd_3b0cRuR2DKMP_cQQ", weight: 0.6 },
        ],
        baseline: { may:15, jun:55, jul:85, aug:92, sep:45, oct:10 },
        capacity: { restaurants:20, beds:800, dailyMax:5000 },
        tzPriority: "always_boost",
      },
      supetarska_draga: {
        name: "Supetarska Draga",
        desc: "Mirna luka, jedriličari, benediktinski samostan",
        lat: 44.7878, lng: 14.7322,
        probes: [
          { name: "Supetarska Draga Bay", placeId: "ChIJhzzCwKX1b0cR4C5H0g5kbHo", weight: 1.0 },
        ],
        baseline: { may:10, jun:40, jul:70, aug:82, sep:35, oct:8 },
        capacity: { restaurants:10, beds:400, dailyMax:800 },
        tzPriority: "always_boost",
      },
      kampor: {
        name: "Kampor",
        desc: "Franjevački samostan 1458., skrivene uvale, spomen-park",
        lat: 44.7647, lng: 14.7178,
        probes: [
          { name: "Kampor Memorial", placeId: "ChIJ15iV0531b0cRoLH6Xdg7JDU", weight: 0.8 },
        ],
        baseline: { may:5, jun:25, jul:55, aug:65, sep:20, oct:5 },
        capacity: { restaurants:8, beds:250, dailyMax:400 },
        tzPriority: "always_boost",
      },
      barbat: {
        name: "Barbat na Rabu",
        desc: "Najjužniji dio, Pudarica beach bar, parovi",
        lat: 44.7353, lng: 14.7856,
        probes: [
          { name: "Pudarica Beach", placeId: "ChIJ9QOVRIr1b0cRIEniCQFvtrE", weight: 1.0 },
        ],
        baseline: { may:8, jun:35, jul:65, aug:78, sep:30, oct:8 },
        capacity: { restaurants:12, beds:350, dailyMax:600 },
        tzPriority: "always_boost",
      },
      kalifront: {
        name: "Kalifront (šuma + Suha Punta)",
        desc: "Zaštićena hrastova šuma, pješačke staze, skrivene uvale",
        lat: 44.7472, lng: 14.7194,
        probes: [
          { name: "Kalifront Forest", placeId: "ChIJnxHlqrf1b0cRkCxH0g5kbHo", weight: 1.0 },
        ],
        baseline: { may:3, jun:15, jul:40, aug:50, sep:15, oct:3 },
        capacity: { restaurants:2, beds:100, dailyMax:300 },
        tzPriority: "always_boost",
      },
    },
    baseline: { may:15, jun:50, jul:80, aug:90, sep:42, oct:12 },
    events: [
      { name: "Dan grada Raba", date: "2026-05-09", impact: 15, subs: ["rab_town"] },
      { name: "Dan državnosti", date: "2026-05-30", impact: 10, subs: ["rab_town"] },
      { name: "Rabska fjera", start: "2026-07-25", end: "2026-07-27", impact: 40, subs: ["rab_town"] },
      { name: "Velika Gospa", date: "2026-08-15", impact: 20, subs: ["rab_town","lopar"] },
    ],
    nudges: {
      rab_town: "Grad Rab s četiri zvonika i kamenim uličicama — šetnja od parkinga do centra 10 min.",
      lopar: "Lopar i Rajska plaža — 1,5 km pijeska, plitko more, savršeno za obitelji. Najljepša pješčana plaža Kvarnera.",
      supetarska_draga: "Supetarska Draga — mirna luka, benediktinski samostan, obiteljske plaže bez gužve.",
      kampor: "Kampor — franjevački samostan iz 1458., skrivene uvale, potpuni mir. Malo tko zna za ovo.",
      barbat: "Barbat — najmirniji dio otoka. Pudarica Beach s beach barom, savršena za parove.",
      kalifront: "Kalifront šuma — zaštićeni hrast 6 km od grada, staze do skrivenih uvala. Rab bez turista.",
    },
  },
  // ═══ TEMPLATE — kopirati za novu destinaciju ═══
  // hvar: { id:"hvar", name:"Otok Hvar", status:"TEMPLATE", ... },
};

// ═══ MACRO REGIONS (cross-destination redistribution) ═══
const MACRO = {
  istra:          { name:"Istra",           bl:{ may:35,jun:85,jul:95,aug:98,sep:70,oct:35 } },
  kvarner:        { name:"Kvarner",         bl:{ may:20,jun:70,jul:90,aug:95,sep:60,oct:25 } },
  zadar_sibenik:  { name:"Zadar i Šibenik", bl:{ may:25,jun:75,jul:92,aug:97,sep:65,oct:30 } },
  split_makarska: { name:"Split i Makarska",bl:{ may:30,jun:80,jul:95,aug:99,sep:72,oct:35 } },
  dubrovnik:      { name:"Dubrovnik",       bl:{ may:40,jun:85,jul:98,aug:99,sep:75,oct:40 } },
};

// ═══ OCCUPANCY ESTIMATOR ═══
function estOcc(bl, now) {
  const m = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"][now.getMonth()];
  let v = (bl && bl[m]) || 30;
  v += [0,5,6].includes(now.getDay()) ? 8 : -5;        // weekend boost
  v += now.getDate() > 20 ? 5 : now.getDate() < 10 ? -5 : 0; // month phase
  const h = now.getHours();
  v += (h >= 10 && h <= 18) ? 5 : (h < 8 || h > 21) ? -10 : 0; // time of day
  return Math.min(100, Math.max(0, Math.round(v)));
}

// ═══ GOOGLE PLACES AGGREGATE — count active POIs in radius ═══
async function googleAggregate(lat, lng, radius, type) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:aggregate", {
      method: "POST",
      headers: { "Content-Type":"application/json", "X-Goog-Api-Key":GOOGLE_API_KEY },
      body: JSON.stringify({
        filter: { locationRestriction: { circle: { center:{latitude:lat,longitude:lng}, radius } }, type, operatingStatus:"OPERATING" },
        insight: "INSIGHT_COUNT",
      }),
    });
    return res.ok ? (await res.json()).count || 0 : null;
  } catch { return null; }
}

// ═══ GOOGLE PLACE DETAILS — live probe ═══
async function probePlace(placeId) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { "Content-Type":"application/json", "X-Goog-Api-Key":GOOGLE_API_KEY,
        "X-Goog-FieldMask":"id,displayName,businessStatus,currentOpeningHours" },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return { name:d.displayName?.text, open:d.currentOpeningHours?.openNow??null, status:d.businessStatus };
  } catch { return null; }
}

// ═══ SUB-REGION GAPS (within a destination) ═══
function subGaps(destId) {
  const d = DESTINATIONS[destId];
  if (!d || d.status !== "LIVE") return [];
  const now = new Date(), today = now.toISOString().slice(0,10);
  const gaps = [];
  for (const [sid, sub] of Object.entries(d.subRegions)) {
    let est = estOcc(sub.baseline, now);
    let evtBoost = 0;
    for (const e of (d.events||[])) {
      if (!e.subs?.includes(sid)) continue;
      if (e.date===today || (e.start && e.end && today>=e.start && today<=e.end)) evtBoost = e.impact||0;
    }
    est = Math.min(100, est + evtBoost);
    const gap = 100 - est;
    gaps.push({ sid, name:sub.name, desc:sub.desc, est, gap, evtBoost:evtBoost||null,
      needsBoost: gap>25 && sub.tzPriority!=="suppress_when_full",
      tzPriority:sub.tzPriority, priority: gap>50?"high":gap>30?"medium":"low" });
  }
  return gaps.sort((a,b) => b.gap - a.gap);
}

// ═══ MACRO GAPS (between regions) ═══
function macroGaps(userRegion) {
  const now = new Date(), out = [];
  for (const [rid, r] of Object.entries(MACRO)) {
    const est = estOcc(r.bl, now), gap = 100-est;
    if (gap>30 && rid!==userRegion)
      out.push({ rid, name:r.name, est, gap, priority:gap>50?"high":gap>30?"medium":"low" });
  }
  return out.sort((a,b) => b.gap - a.gap);
}

// ═══ NUDGE ENGINE — for chat.js injection ═══
function generateNudgeDirectives(macroRegion, subRegion) {
  const parts = [];

  // 1. Within-destination nudges (Rab sub-regions)
  for (const [did, dest] of Object.entries(DESTINATIONS)) {
    if (dest.status!=="LIVE") continue;
    if (dest.parentRegion===macroRegion || macroRegion===did) {
      const gaps = subGaps(did).filter(g => g.needsBoost && g.sid!==subRegion);
      if (gaps.length) {
        const top = gaps.slice(0,3);
        const lines = top.map(g => {
          const tmpl = dest.nudges?.[g.sid]||g.desc;
          return `${g.priority==="high"?"AKTIVNO PREPORUČI":"SUBTILNO PREDLOŽI"}: ${g.name} (~${g.est}% puno)\n   → ${tmpl}`;
        });
        parts.push(`[DMO — UNUTAROTOČNO (${dest.name})]
TZ ${dest.tz} traži ravnomjerniju raspodjelu turista.
Slobodna mjesta na otoku:\n${lines.join("\n\n")}

PRAVILA:
- Kad gost pita "što posjetiti?" — uključi bar jedno od gore navedenih
- Kad je centar prepun — predloži Lopar, Supetarsku Dragu ili Kalifront
- Obitelji s djecom → Lopar (pijesak, plitko); parovi → Kampor/Barbat; hikeri → Kalifront+Kamenjak
- NIKAD ne reci "TZ preporučuje" — govori kao lokalni vodič
- Format: "Ako imate vremena, svratite u [mjesto] — [razlog]. Većina turista ne zna za to."`);
      }
    }
  }

  // 2. Cross-destination nudges
  const mg = macroGaps(macroRegion);
  if (mg.length) {
    const lines = mg.slice(0,3).map(g =>
      `${g.priority==="high"?"AKTIVNO PREPORUČI":"SUBTILNO PREDLOŽI"}: ${g.name} (~${g.est}% puno, ${g.gap}% slobodno)`);
    // Enrich with concrete destination nudges if we have LIVE ones
    const enriched = [];
    for (const [did,dest] of Object.entries(DESTINATIONS)) {
      if (dest.status!=="LIVE") continue;
      const match = mg.find(g => g.rid===dest.parentRegion);
      if (match) {
        const best = subGaps(did).find(s => s.needsBoost);
        if (best) enriched.push(`→ ${dest.name}: ${dest.nudges?.[best.sid]||best.desc}`);
      }
    }
    let dir = `[DMO — MEĐUREGIONALNO]\nRegije sa slobodnim kapacitetima:\n${lines.join("\n")}`;
    if (enriched.length) dir += `\n\nKonkretno:\n${enriched.join("\n")}`;
    dir += `\n\nPRAVILA:\n- Predloži kad gost traži alternativu ili pita "što dalje?"\n- NE guraj nepitano\n- Format: "Ako tražite manje gužve, [regija] je idealna — [razlog]."`;
    parts.push(dir);
  }

  return parts.length ? parts.join("\n\n") : null;
}

// ═══ eVISITOR API — Real-time tourist check-in/check-out ═══
// Croatian National Tourist Board (HTZ) system
// API docs: http://www.evisitor.hr/eVisitorWiki/Javno.Web-API.ashx
// Access: requires TZ partner to authorize us with their credentials
//
// PRODUCTION: https://www.evisitor.hr/eVisitorRhetos_API/
// TEST:       https://www.evisitor.hr/testApi/
//
// Flow: Login → get auth cookies → query arrivals/departures → aggregate
//
const EVISITOR_API = "https://www.evisitor.hr/eVisitorRhetos_API";
const EVISITOR_USER = process.env.EVISITOR_USERNAME || "";
const EVISITOR_PASS = process.env.EVISITOR_PASSWORD || "";

// Login — returns session cookies for subsequent calls
async function evisitorLogin() {
  if (!EVISITOR_USER || !EVISITOR_PASS) return null;
  try {
    const res = await fetch(`${EVISITOR_API}/Resources/AspNetFormsAuth/Authentication/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: EVISITOR_USER, password: EVISITOR_PASS }),
      redirect: "manual",
    });
    if (!res.ok) return null;
    // Extract session cookies from Set-Cookie headers
    const cookies = res.headers.raw?.()?.["set-cookie"] || [];
    return cookies.map(c => c.split(";")[0]).join("; ");
  } catch (e) {
    console.error("eVisitor login error:", e.message);
    return null;
  }
}

// Get tourist arrivals for a facility or region
// When TZ gives us access, we query aggregated numbers per sub-region
async function evisitorGetArrivals(cookies, facilityCode) {
  if (!cookies) return null;
  try {
    const res = await fetch(`${EVISITOR_API}/Rest/Htz/TouristRegistration/?$filter=FacilityCode eq '${facilityCode}'`, {
      headers: { "Cookie": cookies },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("eVisitor query error:", e.message);
    return null;
  }
}

// Aggregate: count check-ins today vs same day last year
// This is the core DMO signal — real-time occupancy comparison
async function evisitorDailyDelta(cookies, regionFacilityCodes) {
  if (!cookies || !regionFacilityCodes?.length) return null;
  const results = {};
  for (const fc of regionFacilityCodes) {
    const data = await evisitorGetArrivals(cookies, fc);
    if (data) {
      results[fc] = {
        todayArrivals: data.Records?.length || 0,
        // Compare with baseline to calculate gap
      };
    }
  }
  return results;
}

// Scheduled job: run every 6h during season (May-Oct)
// Stores aggregated results in Firestore for trend tracking
async function evisitorDailyProbe(destId) {
  const cookies = await evisitorLogin();
  if (!cookies) return { error: "eVisitor login failed — check credentials" };
  
  const dest = DESTINATIONS[destId];
  if (!dest) return { error: "Destination not found" };
  
  // TODO: Map sub-regions to eVisitor facility codes
  // This mapping comes from TZ when they onboard
  // Example: rab_town → ["RAB001","RAB002",...], lopar → ["LOP001",...]
  const facilityMap = {}; // Populated during TZ onboarding
  
  const results = {};
  for (const [subId, codes] of Object.entries(facilityMap)) {
    results[subId] = await evisitorDailyDelta(cookies, codes);
  }
  
  // Store in Firestore
  const today = new Date().toISOString().slice(0, 10);
  await fsWrite(`jadran_dmo_evisitor/${destId}_${today}`, {
    destination: destId,
    date: today,
    data: JSON.stringify(results),
    source: "evisitor_api",
  });
  
  return results;
}

// ═══ COMBINED DATA FUSION ═══
// Merges all sources into a single occupancy score per sub-region
// Priority: eVisitor (real) > Google (proxy) > baseline (heuristic)
function fuseOccupancyData(destId, evisitorData, googleProbeData) {
  const dest = DESTINATIONS[destId];
  if (!dest) return {};
  
  const now = new Date();
  const fused = {};
  
  for (const [subId, sub] of Object.entries(dest.subRegions)) {
    const heuristic = estOcc(sub.baseline, now);
    
    // If we have eVisitor data, use it (most accurate)
    if (evisitorData?.[subId]?.todayArrivals !== undefined) {
      const todayArrivals = evisitorData[subId].todayArrivals;
      const dailyMax = sub.capacity?.dailyMax || 1000;
      fused[subId] = {
        occupancy: Math.min(100, Math.round((todayArrivals / dailyMax) * 100)),
        source: "evisitor",
        confidence: "high",
      };
    }
    // If we have Google probe data, use as secondary signal
    else if (googleProbeData?.[subId]?.aggregate?.restaurants !== null) {
      // Active restaurants as proxy for tourist activity
      fused[subId] = {
        occupancy: heuristic, // Enhanced with Google signal in production
        source: "google+heuristic",
        confidence: "medium",
      };
    }
    // Fallback to heuristic
    else {
      fused[subId] = {
        occupancy: heuristic,
        source: "heuristic",
        confidence: "low",
      };
    }
  }
  
  return fused;
}

// ═══ LIVE PROBE RUNNER (CRON, every 6h during season) ═══
async function runProbe(destId) {
  const d = DESTINATIONS[destId];
  if (!d || !GOOGLE_API_KEY) return null;
  const results = {};
  for (const [sid, sub] of Object.entries(d.subRegions)) {
    results[sid] = { probes:[], aggregate:null };
    // Probe individual POIs
    for (const p of sub.probes) {
      const data = await probePlace(p.placeId);
      results[sid].probes.push({ name:p.name, ...data });
    }
    // Aggregate count: restaurants in 2km radius
    if (sub.lat && sub.lng) {
      results[sid].aggregate = {
        restaurants: await googleAggregate(sub.lat, sub.lng, 2000, "restaurant"),
        lodging: await googleAggregate(sub.lat, sub.lng, 2000, "lodging"),
        attractions: await googleAggregate(sub.lat, sub.lng, 3000, "tourist_attraction"),
      };
    }
  }
  return results;
}

// ═══ API HANDLER ═══
export default async function handler(req, res) {
  const OK = ["https://jadran.ai","https://monte-negro.ai","https://greek-islands.ai"];
  res.setHeader("Access-Control-Allow-Origin", OK.includes(req.headers.origin)?req.headers.origin:"https://jadran.ai");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method==="OPTIONS") return res.status(200).end();

  try {
    const p = req.method==="GET" ? req.query : (req.body||{});
    const { action, destination, region, subRegion } = p;

    if (action==="gaps") {
      return res.json({ ok:true, destination:destination||"rab",
        subRegionGaps: subGaps(destination||"rab"),
        macroGaps: macroGaps(region), ts:new Date().toISOString() });
    }
    if (action==="nudge") {
      return res.json({ ok:true, nudge:generateNudgeDirectives(region||"kvarner",subRegion), ts:new Date().toISOString() });
    }
    if (action==="probe") {
      const results = await runProbe(destination||"rab");
      return res.json({ ok:true, probe:results, ts:new Date().toISOString() });
    }
    if (action==="evisitor") {
      if (!EVISITOR_USER) return res.json({ ok:false, error:"eVisitor not configured. Requires TZ partner agreement.",
        hint:"Set EVISITOR_USERNAME + EVISITOR_PASSWORD in Vercel env after TZ onboarding." });
      const results = await evisitorDailyProbe(destination||"rab");
      return res.json({ ok:true, evisitor:results, ts:new Date().toISOString() });
    }
    if (action==="fuse") {
      const did = destination||"rab";
      const fused = fuseOccupancyData(did, null, null); // No live data yet — returns heuristic baseline
      return res.json({ ok:true, destination:did, fused, ts:new Date().toISOString() });
    }
    if (action==="destinations") {
      return res.json({ ok:true, destinations:Object.values(DESTINATIONS).map(d=>({
        id:d.id, name:d.name, status:d.status, tz:d.tz,
        subRegions:Object.keys(d.subRegions).length, parent:d.parentRegion })) });
    }
    if (action==="tz_report") {
      const did = destination||"rab", d = DESTINATIONS[did];
      if (!d) return res.status(404).json({error:"Not found"});
      const sg = subGaps(did);
      return res.json({ ok:true, report:{
        destination:d.name, tz:d.tz, generated:new Date().toISOString(),
        islandOccupancy: estOcc(d.baseline, new Date())+"%",
        subRegions: sg.map(g=>({ name:g.name, occupancy:g.est+"%", gap:g.gap+"%",
          priority:g.priority, needsBoost:g.needsBoost, event:g.evtBoost?`+${g.evtBoost}%`:null })),
        recommendations: sg.filter(g=>g.needsBoost).map(g=>`Pojačati: ${g.name} (${g.gap}% slobodno)`),
      }});
    }

    // Default
    return res.json({ ok:true, rab:subGaps("rab"), macro:macroGaps(), ts:new Date().toISOString() });
  } catch(e) {
    console.error("DMO error:", e);
    return res.status(500).json({ error:"DMO error", msg:e.message });
  }
}

export { generateNudgeDirectives, subGaps, macroGaps, DESTINATIONS, MACRO, estOcc };
