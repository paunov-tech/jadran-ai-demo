// =========================================================
// JADRAN.AI — TripGuide: Trip entry via unique booking ID
// Route: /?trip=JAD-RAB-YYYYMMDD-XXXXXX
// Loads booking from localStorage, sets delta_context, enters AI guide
// =========================================================
import { useState, useEffect } from "react";
import { saveDelta } from "./deltaContext";

const C = {
  bg: "#0a1628", surface: "#0f1e35", card: "#162240",
  accent: "#00b4d8", gold: "#FFB800", white: "#f0f4f8",
  muted: "#7a8fa8", border: "rgba(0,180,216,0.12)",
  success: "#22c55e", danger: "#ef4444",
  gradBg: "linear-gradient(160deg, #07111f 0%, #0d2137 60%, #081523 100%)",
};

const PHASE_INFO = {
  pretrip: {
    icon: "🏠", color: "#00b4d8",
    en: { label: "PRE-TRIP", desc: "Your trip is confirmed. AI companion activates on travel day." },
    de: { label: "VOR DER REISE", desc: "Deine Reise ist bestätigt. KI-Begleiter aktiviert sich am Reisetag." },
  },
  transit: {
    icon: "🚗", color: "#f59e0b",
    en: { label: "ON THE WAY", desc: "Your AI companion is tracking you to the destination in real-time." },
    de: { label: "UNTERWEGS", desc: "Dein KI-Begleiter begleitet dich in Echtzeit zur Destination." },
  },
  odmor: {
    icon: "🏝️", color: "#22c55e",
    en: { label: "ENJOYING YOUR STAY", desc: "Ask your local AI guardian about beaches, restaurants and excursions." },
    de: { label: "URLAUB GENUSS", desc: "Frag deinen lokalen KI-Guardian nach Stränden, Restaurants und Ausflügen." },
  },
  departure: {
    icon: "👋", color: "#a78bfa",
    en: { label: "DEPARTURE DAY", desc: "Ferry times, route home, and a loyalty offer for next year." },
    de: { label: "ABREISETAG", desc: "Fährzeiten, Heimweg und ein Treuerabatt für nächstes Jahr." },
  },
};

function detectPhase(booking) {
  const now = new Date();
  const arrival = booking?.dates?.arrival ? new Date(booking.dates.arrival) : null;
  const departure = booking?.dates?.departure ? new Date(booking.dates.departure) : null;
  if (!arrival) return "pretrip";
  const diffArrival = (arrival - now) / 86400000; // days until arrival
  const diffDeparture = departure ? (departure - now) / 86400000 : null;
  if (diffArrival > 1) return "pretrip";
  if (diffArrival > -1) return "transit"; // day before + arrival day
  if (diffDeparture !== null && diffDeparture < 1 && diffDeparture > -1) return "departure";
  if (departure && now > departure) return "departed";
  return "odmor"; // during stay
}

export default function TripGuide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("trip");
  const lang = params.get("lang") || (() => {
    try { return localStorage.getItem("jadran_lang") || "en"; } catch { return "en"; }
  })();

  const t = (en, de) => lang === "de" ? de : en;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("pretrip");

  useEffect(() => {
    // 1. Try localStorage first (fastest, works offline)
    let stored = null;
    try {
      const raw = localStorage.getItem("jadran_booking");
      if (raw) {
        const parsed = JSON.parse(raw);
        // Verify it matches the trip ID in URL (if present)
        if (!tripId || parsed.id === tripId) {
          stored = parsed;
        }
      }
    } catch {}

    if (stored) {
      const p = detectPhase(stored);
      setBooking(stored);
      setPhase(p);
      // Update delta_context for AI
      try {
        saveDelta({
          destination: { city: stored.destinationName, region: "kvarner" },
          arrival_date: stored.dates?.arrival,
          departure_date: stored.dates?.departure,
          guest_name: stored.guest?.name,
          booking_id: stored.id,
          accommodation_name: stored.accommodation?.name,
          accommodation_direct: stored.accommodation?.direct || false,
          travelers: { adults: stored.dates?.guests || 2, kids: 0, kids_ages: [] },
          phase: p,
        });
      } catch {}
      setLoading(false);
    } else if (tripId) {
      // 2. Try API
      fetch(`/api/reserve?id=${encodeURIComponent(tripId)}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            const synthetic = {
              id: data.id || tripId,
              destination: data.destination,
              destinationName: data.destinationName,
              accommodation: { name: data.accommodationName, type: data.accommodationType, direct: data.accommodationDirect === "true" },
              guest: { name: data.guestName, email: data.guestEmail },
              dates: { arrival: data.arrival, departure: data.departure, guests: data.guests },
              lang: data.lang,
              createdAt: data.createdAt,
            };
            try { localStorage.setItem("jadran_booking", JSON.stringify(synthetic)); } catch {}
            const p = detectPhase(synthetic);
            setBooking(synthetic);
            setPhase(p);
            try {
              saveDelta({
                destination: { city: data.destinationName, region: "kvarner" },
                arrival_date: data.arrival,
                departure_date: data.departure,
                guest_name: data.guestName,
                booking_id: data.id || tripId,
                accommodation_name: data.accommodationName,
                accommodation_direct: data.accommodationDirect === "true",
                travelers: { adults: Number(data.guests) || 2, kids: 0, kids_ages: [] },
                phase: p,
              });
            } catch {}
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const enterGuide = () => {
    const dest = booking?.destination || "rab";
    window.location.href = `/?kiosk=${dest}&lang=${lang}&booking=${booking?.id || tripId || ""}`;
  };

  const phaseInfo = PHASE_INFO[phase] || PHASE_INFO.odmor;
  const phaseText = lang === "de" ? phaseInfo.de : phaseInfo.en;

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: C.gradBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", color: C.muted, fontSize: 18 }}>
        🌊 {t("Loading your trip…", "Reise wird geladen…")}
      </div>
    );
  }

  // No booking found → show entry form
  if (!booking && !tripId) {
    return (
      <div style={{ minHeight: "100dvh", background: C.gradBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🌊</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {t("Enter your Booking ID", "Booking-ID eingeben")}
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 28 }}>
            {t("Enter the JAD-XXX-... ID you received after booking to activate your AI guide.", "Gib die JAD-XXX-...-ID ein, die du nach der Buchung erhalten hast, um deinen KI-Guide zu aktivieren.")}
          </p>
          <form onSubmit={e => {
            e.preventDefault();
            const id = e.target.elements.bid.value.trim().toUpperCase();
            if (id) window.location.href = `/?trip=${encodeURIComponent(id)}&lang=${lang}`;
          }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input name="bid" type="text" placeholder="JAD-RAB-..." autoFocus
              style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.white, fontFamily: "inherit", fontSize: 15, outline: "none", minWidth: 200 }} />
            <button type="submit" style={{ padding: "13px 24px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {t("Open Guide →", "Guide öffnen →")}
            </button>
          </form>
          <p style={{ marginTop: 24, fontSize: 13, color: C.muted }}>
            {t("No ID? ", "Keine ID? ")}
            <a href="/explore" style={{ color: C.accent, textDecoration: "none" }}>{t("Plan your trip here →", "Reise hier planen →")}</a>
          </p>
        </div>
      </div>
    );
  }

  // Booking found (or just have tripId from URL)
  const displayName = booking?.guest?.name || t("Traveller", "Reisender");
  const displayDest = booking?.destinationName || (tripId ? tripId.split("-")[1] : "Rab");

  return (
    <div style={{ minHeight: "100dvh", background: C.gradBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .fade-in { opacity: 0; transform: translateY(12px); animation: fadeUp 0.45s ease forwards; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse { animation: pulse 2s infinite; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: "rgba(7,17,31,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 22, fontFamily: "Georgia, serif", fontWeight: 700 }}>
            <span style={{ color: C.white }}>JADRAN</span><span style={{ color: C.gold }}>.ai</span>
          </span>
        </a>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 9, color: C.accent, fontWeight: 700, letterSpacing: "1.5px" }}>AI TRAVEL OPERATOR</span>
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: C.success }} />
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div className="fade-in">

          {/* GREETING */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{phaseInfo.icon}</div>
            <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 20, background: `${phaseInfo.color}20`, border: `1px solid ${phaseInfo.color}50`, fontSize: 11, color: phaseInfo.color, fontWeight: 700, letterSpacing: "1px", marginBottom: 16 }}>
              {phaseText.label}
            </div>
            <h1 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, marginBottom: 12 }}>
              {t(`Welcome back, ${displayName}!`, `Willkommen zurück, ${displayName}!`)}
            </h1>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
              {phaseText.desc}
            </p>
          </div>

          {/* BOOKING CARD */}
          {booking && (
            <div style={{ background: booking.accommodation?.direct ? `linear-gradient(135deg, rgba(255,184,0,0.06), ${C.card})` : C.surface, border: `1.5px solid ${booking.accommodation?.direct ? C.gold + "60" : C.border}`, borderRadius: 20, padding: "24px 28px", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.8px", marginBottom: 4 }}>{t("YOUR BOOKING", "DEINE BUCHUNG")}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{booking.accommodation?.name}</div>
                  <div style={{ fontSize: 14, color: C.accent, marginTop: 2 }}>📍 {displayDest}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, background: C.card, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, letterSpacing: "0.5px" }}>
                  {booking.id || tripId}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {booking.dates?.arrival && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Arrival", "Anreise")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.arrival}</div></div>}
                {booking.dates?.departure && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Departure", "Abreise")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.departure}</div></div>}
                {booking.dates?.guests && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Guests", "Gäste")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.guests}</div></div>}
              </div>
              {booking.accommodation?.direct && (
                <div style={{ marginTop: 14, fontSize: 13, color: C.success }}>
                  ✓ {t("Direct booking — AI companion included", "Direktbuchung — KI-Begleiter inklusive")}
                </div>
              )}
            </div>
          )}

          {/* PHASE-BASED QUICK ACTIONS */}
          {phase === "pretrip" && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 {t("Pre-Trip Checklist", "Vor-Reise Checkliste")}</h3>
              {[
                t("✓ Booking confirmed — check your email", "✓ Buchung bestätigt — E-Mail prüfen"),
                t("○ Ferry reservation (arrive 1-2h early in summer!)", "○ Fährreservierung (im Sommer 1-2h früher ankommen!)"),
                t("○ Check ferry cameras before departure", "○ Fährkameras vor Abfahrt prüfen"),
                t("○ Download offline maps for the island", "○ Offline-Karten für die Insel herunterladen"),
                t("○ Pack: sunscreen, cash (ATMs limited on island), EU health card", "○ Packen: Sonnencreme, Bargeld (wenige Geldautomaten), EU-Gesundheitskarte"),
              ].map((item, i) => (
                <div key={i} style={{ fontSize: 13, color: i === 0 ? C.success : C.muted, marginBottom: 8, paddingLeft: 4 }}>{item}</div>
              ))}
            </div>
          )}

          {/* MAIN CTA */}
          <button onClick={enterGuide}
            style={{ width: "100%", padding: "20px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 36px ${C.accent}50`, marginBottom: 14, letterSpacing: "0.5px" }}>
            🚀 {t("Open AI Guide", "KI-Guide öffnen")}
            <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8, marginTop: 4 }}>
              {t("Full context loaded · Powered by Jadran.ai", "Vollständiger Kontext geladen · Powered by Jadran.ai")}
            </div>
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
            <a href="/explore" style={{ padding: "13px", borderRadius: 14, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
              🗺️ {t("Explore", "Erkunden")}
            </a>
            <a href="tel:112" style={{ padding: "13px", borderRadius: 14, border: `1px solid rgba(239,68,68,0.3)`, color: "#f87171", fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
              🆘 {t("Emergency: 112", "Notruf: 112")}
            </a>
          </div>

          {/* USEFUL INFO */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.muted }}>{t("Quick info for Rab", "Schnellinfo für Rab")}</h4>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
              <div>⛴️ {t("Ferry Stinica → Mišnjak: every 60 min, 15 min, ~€25", "Fähre Stinica → Mišnjak: jede 60 Min, 15 Min, ~€25")}</div>
              <div>🏖️ {t("Paradise Beach: arrive before 10h (summer)", "Paradiesstrand: vor 10 Uhr ankommen (Sommer)")}</div>
              <div>💊 {t("Pharmacy: Rab Old Town, open Mon–Sat 8–20h", "Apotheke: Altstadt Rab, Mo–Sa 8–20h")}</div>
              <div>🏥 {t("Hospital: Dom zdravlja Rab, +385 51 775 016", "Krankenhaus: Dom zdravlja Rab, +385 51 775 016")}</div>
              <div>💶 {t("Currency: Euro (€). ATMs in Rab town center.", "Währung: Euro (€). Geldautomaten im Stadtzentrum.")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
