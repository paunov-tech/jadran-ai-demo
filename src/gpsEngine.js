// src/gpsEngine.js — JADRAN.AI GPS Live Intelligence
// Runs silently in background. Fires callbacks on zone triggers.
// Never shows itself — only produces data for card engine.

import { checkZones, checkApproach, detectCountry, detectPhase, distKm } from "./geofences";
import { loadDelta, saveDelta } from "./deltaContext";

const GPS_INTERVAL = 10000;  // 10s position updates
const CARD_INTERVAL = 60000; // 60s card refresh
const APPROACH_KM = 20;      // warn 20km before zone

let watchId = null;
let lastPos = null;
let lastCountry = null;
let triggeredZones = new Set(); // zones already shown (don't repeat)
let routePoints = [];           // breadcrumb trail
let onCardCallback = null;
let onPhaseCallback = null;
let onCountryCallback = null;
let cardTimer = null;

// ─── START ───
export function startGPS(opts = {}) {
  if (watchId) return; // already running

  onCardCallback = opts.onCard || null;
  onPhaseCallback = opts.onPhase || null;
  onCountryCallback = opts.onCountry || null;

  // Load previously triggered zones from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem("jadran_triggered_zones") || "[]");
    saved.forEach(id => triggeredZones.add(id));
  } catch {}

  if (!navigator.geolocation) {
    console.warn("GPS: geolocation not available");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    onPosition,
    onError,
    { enableHighAccuracy: true, maximumAge: 8000, timeout: 15000 }
  );

  // Periodic card refresh (even without GPS movement)
  cardTimer = setInterval(() => {
    if (lastPos) generateCards(lastPos.lat, lastPos.lng);
  }, CARD_INTERVAL);
}

// ─── STOP ───
export function stopGPS() {
  if (watchId) { navigator.geolocation.clearWatch(watchId); watchId = null; }
  if (cardTimer) { clearInterval(cardTimer); cardTimer = null; }
}

// ─── POSITION UPDATE ───
function onPosition(pos) {
  const lat = pos.coords.latitude;
  const lng = pos.coords.longitude;
  const accuracy = pos.coords.accuracy;
  const speed = pos.coords.speed; // m/s or null

  lastPos = { lat, lng, accuracy, speed, ts: Date.now() };

  // Breadcrumb (max 500 points, ~80 min at 10s intervals)
  routePoints.push({ lat, lng, ts: Date.now() });
  if (routePoints.length > 500) routePoints.shift();

  // Country detection
  const country = detectCountry(lat, lng);
  if (country !== lastCountry) {
    lastCountry = country;
    saveDelta({ country });
    if (onCountryCallback) onCountryCallback(country);
  }

  // Phase detection
  const delta = loadDelta();
  const destLat = delta.destination?.lat;
  const destLng = delta.destination?.lng;
  const homeLat = delta.from_coords?.[0];
  const homeLng = delta.from_coords?.[1];
  
  if (destLat && destLng) {
    const phase = detectPhase(lat, lng, destLat, destLng, homeLat, homeLng);
    if (phase && phase !== delta.phase) {
      saveDelta({ phase });
      if (onPhaseCallback) onPhaseCallback(phase);
    }

    // Update ETA
    const distToDest = distKm(lat, lng, destLat, destLng);
    const speedKmh = speed ? speed * 3.6 : 80; // default 80km/h if no speed
    const etaMin = Math.round((distToDest / speedKmh) * 60);
    saveDelta({ dist_to_dest: Math.round(distToDest), eta_min: etaMin });
  }

  // Zone checks
  checkAndFireZones(lat, lng);
}

function onError(err) {
  console.warn("GPS error:", err.code, err.message);
}

// ─── ZONE TRIGGERS ───
function checkAndFireZones(lat, lng) {
  const delta = loadDelta();
  const segment = delta.segment || "par";
  const lang = delta.lang || "hr";

  // Approach warnings (20km out)
  const approaching = checkApproach(lat, lng, triggeredZones, APPROACH_KM);
  for (const zone of approaching) {
    const approachId = "approach_" + zone.id;
    triggeredZones.add(approachId);
    persistTriggered();

    const cardText = zone.card?.[lang] || zone.card?.hr || "";
    const segExtra = zone.segment_extra?.[segment]?.[lang] || zone.segment_extra?.[segment]?.hr || "";
    const zoneName = zone.name?.[lang] || zone.name?.hr || zone.id;

    if (onCardCallback) {
      onCardCallback({
        id: approachId,
        type: zone.type,
        severity: zone.type === "bura" ? "warning" : "info",
        icon: zoneIcon(zone.type),
        title: `${Math.round(zone.dist)} km — ${zoneName}`,
        body: segExtra ? `${cardText}\n${segExtra}` : cardText,
        source: "GPS",
        ts: new Date().toISOString(),
        approaching: true,
      });
    }
  }

  // Direct zone entry
  const entered = checkZones(lat, lng, triggeredZones);
  for (const zone of entered) {
    triggeredZones.add(zone.id);
    persistTriggered();

    const cardText = zone.card?.[lang] || zone.card?.hr || "";
    const segExtra = zone.segment_extra?.[segment]?.[lang] || zone.segment_extra?.[segment]?.hr || "";
    const zoneName = zone.name?.[lang] || zone.name?.hr || zone.id;

    if (onCardCallback) {
      onCardCallback({
        id: zone.id,
        type: zone.type,
        severity: zone.type === "bura" ? "critical" : zone.type === "schengen_transition" ? "warning" : "info",
        icon: zoneIcon(zone.type),
        title: zoneName,
        body: segExtra ? `${cardText}\n${segExtra}` : cardText,
        source: "GPS Geofence",
        ts: new Date().toISOString(),
      });
    }
  }
}

// ─── PROACTIVE CARD GENERATION ───
function generateCards(lat, lng) {
  const delta = loadDelta();
  const segment = delta.segment || "par";

  // Speed-based cards
  if (lastPos?.speed != null) {
    const kmh = lastPos.speed * 3.6;
    if (kmh < 5 && routePoints.length > 10) {
      // Stopped for a while — suggest rest
      const lastMoving = routePoints.findLast(p => {
        // crude: if position changed significantly
        return distKm(p.lat, p.lng, lat, lng) > 0.1;
      });
      if (lastMoving && Date.now() - lastMoving.ts > 1200000) { // 20+ min stopped
        if (!triggeredZones.has("rest_" + Math.floor(Date.now() / 3600000))) {
          triggeredZones.add("rest_" + Math.floor(Date.now() / 3600000));
          if (onCardCallback) {
            onCardCallback({
              id: "rest_suggest",
              type: "tip",
              severity: "tip",
              icon: "☕",
              title: segment === "porodica" ? "Pauza za djecu?" : "Odmor?",
              body: segment === "kamper" ? "Stojite duže od 20 min. Idealno za dump stanicu ili kavu!" : "Stojite duže od 20 min — iskoristite za kavu i razgledavanje.",
              source: "GPS",
              ts: new Date().toISOString(),
            });
          }
        }
      }
    }
  }

  // ETA card when close to destination
  const distToDest = delta.dist_to_dest;
  if (distToDest && distToDest < 30 && distToDest > 2) {
    if (!triggeredZones.has("eta_" + Math.round(distToDest / 5) * 5)) {
      triggeredZones.add("eta_" + Math.round(distToDest / 5) * 5);
      if (onCardCallback) {
        onCardCallback({
          id: "eta_approach",
          type: "info",
          severity: "tip",
          icon: "📍",
          title: `Još ${Math.round(distToDest)} km!`,
          body: delta.eta_min ? `Procijenjeno vrijeme dolaska: ~${delta.eta_min} min` : "",
          source: "GPS",
          ts: new Date().toISOString(),
        });
      }
    }
  }
}

function zoneIcon(type) {
  const icons = {
    schengen_transition: "🛂", bura: "💨", ferry: "⛴️",
    toll: "💶", city: "🏙️", destination: "🏖️",
  };
  return icons[type] || "📍";
}

function persistTriggered() {
  try {
    localStorage.setItem("jadran_triggered_zones", JSON.stringify([...triggeredZones]));
  } catch {}
}

// ─── RESET (new trip) ───
export function resetTrip() {
  triggeredZones.clear();
  routePoints = [];
  lastPos = null;
  lastCountry = null;
  try { localStorage.removeItem("jadran_triggered_zones"); } catch {}
}

// ─── GETTERS ───
export function getLastPosition() { return lastPos; }
export function getRoutePoints() { return [...routePoints]; }
export function getTriggeredZones() { return [...triggeredZones]; }
