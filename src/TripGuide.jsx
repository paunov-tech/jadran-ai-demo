// =========================================================
// JADRAN.AI — TripGuide: Trip entry via unique booking ID
// Route: /?trip=JAD-RAB-YYYYMMDD-XXXXXX
// Flow: status check → [pending → wait] → [confirmed → transport] → [paid → AI guide]
// =========================================================
import { useState, useEffect, useRef } from "react";
import { saveDelta } from "./deltaContext";

const C = {
  bg: "#0a1628", surface: "#0f1e35", card: "#162240",
  accent: "#00b4d8", gold: "#FFB800", white: "#f0f4f8",
  muted: "#7a8fa8", border: "rgba(0,180,216,0.12)",
  success: "#22c55e", warning: "#f59e0b", danger: "#ef4444",
  gradBg: "linear-gradient(160deg, #07111f 0%, #0d2137 60%, #081523 100%)",
};

const PHASE_INFO = {
  pretrip:   { icon: "🏠", color: "#00b4d8", en: { label: "PRE-TRIP",         desc: "Your trip is confirmed. Select how you're travelling and unlock your AI companion." }, de: { label: "VOR DER REISE",  desc: "Reise bestätigt. Wähle dein Transportmittel und aktiviere deinen KI-Begleiter." } },
  transit:   { icon: "🚗", color: "#f59e0b", en: { label: "ON THE WAY",        desc: "Your AI companion is tracking you to the destination in real-time." },                  de: { label: "UNTERWEGS",      desc: "Dein KI-Begleiter begleitet dich in Echtzeit zur Destination." } },
  odmor:     { icon: "🏝️", color: "#22c55e", en: { label: "ENJOYING YOUR STAY",desc: "Ask your local AI guardian about beaches, restaurants and excursions." },               de: { label: "URLAUB GENUSS",  desc: "Frag deinen lokalen KI-Guardian nach Stränden, Restaurants und Ausflügen." } },
  departure: { icon: "👋", color: "#a78bfa", en: { label: "DEPARTURE DAY",     desc: "Ferry times, route home, and a loyalty offer for next year." },                          de: { label: "ABREISETAG",     desc: "Fährzeiten, Heimweg und ein Treuerabatt für nächstes Jahr." } },
};

const TRANSPORT_OPTIONS = [
  { id: "auto",   icon: "🚗", en: "By Car",       de: "Mit dem Auto",    desc_en: "Route planning, parking & tolls",        desc_de: "Routenplanung, Parken & Maut" },
  { id: "kamper", icon: "🚐", en: "Campervan",    de: "Wohnmobil",       desc_en: "Camper-friendly routes, dump stations",  desc_de: "Camperstrecken, Entsorgung" },
  { id: "avion",  icon: "✈️", en: "By Plane",     de: "Mit dem Flugzeug",desc_en: "Airport transfers & ferry connection",    desc_de: "Flughafentransfer & Fähre" },
  { id: "odmor",  icon: "🚢", en: "Ferry Direct",  de: "Direktfähre",    desc_en: "Ferry schedule, tickets & arrival tips",  desc_de: "Fahrplan, Tickets & Ankunftstipps" },
];

const PLANS = [
  { id: "week",   icon: "⚡", label: "Explorer 7 days",   price: "€9.99",  desc: "Full AI guide for your trip" },
  { id: "season", icon: "🌊", label: "Season 30 days",    price: "€19.99", desc: "AI guide + all Jadran destinations" },
  { id: "vip",    icon: "👑", label: "VIP 30 days",       price: "€49.99", desc: "Priority AI + exclusive partner offers" },
];

function detectPhase(booking) {
  const now = new Date();
  const arrival   = booking?.dates?.arrival   ? new Date(booking.dates.arrival)   : null;
  const departure = booking?.dates?.departure ? new Date(booking.dates.departure) : null;
  if (!arrival) return "pretrip";
  const diffArrival   = (arrival - now) / 86400000;
  const diffDeparture = departure ? (departure - now) / 86400000 : null;
  if (diffArrival > 1)  return "pretrip";
  if (diffArrival > -1) return "transit";
  if (diffDeparture !== null && diffDeparture < 1 && diffDeparture > -1) return "departure";
  if (departure && now > departure) return "departed";
  return "odmor";
}

function syntheticFromFlat(data, tripId) {
  return {
    id: data.id || tripId,
    destination: data.destination,
    destinationName: data.destinationName,
    accommodation: { name: data.accommodationName, type: data.accommodationType, direct: data.accommodationDirect === "true" },
    guest: { name: data.guestName, email: data.guestEmail },
    dates: { arrival: data.arrival, departure: data.departure, guests: data.guests },
    lang: data.lang,
    createdAt: data.createdAt,
    status: data.status || "pending",
    partnerConfirmed: data.partnerConfirmed,
    operatorConfirmed: data.operatorConfirmed,
  };
}

export default function TripGuide() {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("trip");
  const lang = params.get("lang") || (() => {
    try { return localStorage.getItem("jadran_lang") || "en"; } catch { return "en"; }
  })();
  const paymentResult = params.get("payment"); // "success" after Stripe redirect

  const t = (en, de) => lang === "de" ? de : en;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("pretrip");
  const [step, setStep] = useState("status"); // status | transport | payment | guide
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("week");
  const [checkingOut, setCheckingOut] = useState(false);
  const pollRef = useRef(null);

  // Check if this trip is already paid
  const isPaid = () => {
    try {
      const paid = JSON.parse(localStorage.getItem("jadran_trip_paid") || "{}");
      return !!paid[tripId || booking?.id];
    } catch { return false; }
  };

  const markPaid = (id) => {
    try {
      const paid = JSON.parse(localStorage.getItem("jadran_trip_paid") || "{}");
      paid[id] = true;
      localStorage.setItem("jadran_trip_paid", JSON.stringify(paid));
    } catch {}
  };

  const loadBookingFromFlat = (data) => {
    const b = syntheticFromFlat(data, tripId);
    try { localStorage.setItem("jadran_booking", JSON.stringify(b)); } catch {}
    const p = detectPhase(b);
    setBooking(b);
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
    return b;
  };

  const fetchFromApi = async (id) => {
    try {
      const r = await fetch(`/api/reserve?id=${encodeURIComponent(id)}`);
      if (r.ok) {
        const data = await r.json();
        return loadBookingFromFlat(data);
      }
    } catch {}
    return null;
  };

  // Determine which step to show based on booking status + payment
  const determineStep = (b, paid) => {
    if (!b) return "status";
    const confirmed = b.status === "confirmed";
    if (!confirmed) return "status"; // waiting for confirmation
    if (paid) return "guide"; // already paid, go straight to guide
    // Check localStorage for transport selection
    try {
      const delta = JSON.parse(localStorage.getItem("jadran_delta_context") || "{}");
      if (delta.transport) setSelectedTransport(delta.transport);
    } catch {}
    return "transport"; // confirmed but not paid
  };

  useEffect(() => {
    // Handle payment success return
    if (paymentResult === "success" && tripId) {
      markPaid(tripId);
      // Clean up URL without reload
      const clean = new URL(window.location.href);
      clean.searchParams.delete("payment");
      clean.searchParams.delete("plan");
      clean.searchParams.delete("days");
      clean.searchParams.delete("region");
      clean.searchParams.delete("session_id");
      window.history.replaceState({}, "", clean.toString());
    }

    // Load booking
    let stored = null;
    try {
      const raw = localStorage.getItem("jadran_booking");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!tripId || parsed.id === tripId) stored = parsed;
      }
    } catch {}

    if (stored) {
      const p = detectPhase(stored);
      setBooking(stored);
      setPhase(p);
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
      const s = determineStep(stored, isPaid());
      setStep(s);
      setLoading(false);

      // If still pending, refresh from API + start polling
      if (s === "status" && tripId) {
        fetchFromApi(tripId).then(fresh => {
          if (fresh) {
            const newStep = determineStep(fresh, isPaid());
            setStep(newStep);
          }
        });
      }
    } else if (tripId) {
      fetchFromApi(tripId).then(b => {
        if (b) {
          const s = determineStep(b, isPaid());
          setStep(s);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Poll for status change (pending → confirmed) every 15s
  useEffect(() => {
    if (step !== "status" || !tripId) return;
    pollRef.current = setInterval(async () => {
      const b = await fetchFromApi(tripId);
      if (b?.status === "confirmed") {
        clearInterval(pollRef.current);
        setStep(isPaid() ? "guide" : "transport");
      }
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [step, tripId]);

  const startCheckout = async () => {
    if (!selectedTransport) return;
    setCheckingOut(true);
    // Save transport to delta
    try { saveDelta({ transport: selectedTransport }); } catch {}
    const id = booking?.id || tripId;
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          guestName: booking?.guest?.name || "Guest",
          lang,
          returnPath: `/?trip=${encodeURIComponent(id)}`,
          region: booking?.destination || "rab",
          deviceId: (() => { try { return localStorage.getItem("jadran_device_id") || ""; } catch { return ""; } })(),
        }),
      });
      if (r.ok) {
        const data = await r.json();
        if (data.url) { window.location.href = data.url; return; }
      }
    } catch {}
    setCheckingOut(false);
  };

  const enterGuide = () => {
    const dest = booking?.destination || "rab";
    window.location.href = `/?kiosk=${dest}&lang=${lang}&booking=${booking?.id || tripId || ""}`;
  };

  const phaseInfo = PHASE_INFO[phase] || PHASE_INFO.odmor;
  const phaseText = lang === "de" ? phaseInfo.de : phaseInfo.en;
  const displayName = booking?.guest?.name || t("Traveller", "Reisender");
  const displayDest = booking?.destinationName || (tripId ? tripId.split("-")[1] : "Rab");

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
            {t("Enter the JAD-XXX-... ID you received after booking.", "Gib die JAD-XXX-...-ID ein, die du nach der Buchung erhalten hast.")}
          </p>
          <form onSubmit={e => {
            e.preventDefault();
            const id = e.target.elements.bid.value.trim().toUpperCase();
            if (id) window.location.href = `/?trip=${encodeURIComponent(id)}&lang=${lang}`;
          }} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input name="bid" type="text" placeholder="JAD-RAB-..." autoFocus
              style={{ flex: 1, padding: "13px 16px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, color: C.white, fontFamily: "inherit", fontSize: 15, outline: "none", minWidth: 200 }} />
            <button type="submit" style={{ padding: "13px 24px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {t("Open →", "Öffnen →")}
            </button>
          </form>
          <p style={{ marginTop: 24, fontSize: 13, color: C.muted }}>
            {t("No ID? ", "Keine ID? ")}
            <a href="/explore" style={{ color: C.accent, textDecoration: "none" }}>{t("Plan your trip →", "Reise planen →")}</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.gradBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .fade-in { opacity: 0; transform: translateY(12px); animation: fadeUp 0.45s ease forwards; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse { animation: pulse 2s infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; display: inline-block; }
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

          {/* ══ STEP: STATUS — Waiting for confirmation ══ */}
          {step === "status" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
                <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 20, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.4)", fontSize: 11, color: C.warning, fontWeight: 700, letterSpacing: "1px", marginBottom: 16 }}>
                  {t("AWAITING CONFIRMATION", "WARTEN AUF BESTÄTIGUNG")}
                </div>
                <h1 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, marginBottom: 12 }}>
                  {t(`Hi ${displayName}!`, `Hallo ${displayName}!`)}
                </h1>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
                  {t("Your booking request has been sent. We're waiting for confirmation from the accommodation and our operator team. You'll be able to continue once both sides confirm.",
                     "Deine Buchungsanfrage wurde gesendet. Wir warten auf die Bestätigung der Unterkunft und unseres Operatorteams.")}
                </p>
              </div>

              {/* Booking summary card */}
              {booking && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "24px 28px", marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.8px", marginBottom: 4 }}>{t("BOOKING REQUEST", "BUCHUNGSANFRAGE")}</div>
                      <div style={{ fontSize: 17, fontWeight: 700 }}>{booking.accommodation?.name}</div>
                      <div style={{ fontSize: 13, color: C.accent, marginTop: 2 }}>📍 {displayDest}</div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: C.muted, background: C.card, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                      {booking.id || tripId}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {booking.dates?.arrival   && <div><div style={{ fontSize: 10, color: C.muted }}>{t("Arrival","Anreise")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{booking.dates.arrival}</div></div>}
                    {booking.dates?.departure && <div><div style={{ fontSize: 10, color: C.muted }}>{t("Departure","Abreise")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{booking.dates.departure}</div></div>}
                    {booking.dates?.guests    && <div><div style={{ fontSize: 10, color: C.muted }}>{t("Guests","Gäste")}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{booking.dates.guests}</div></div>}
                  </div>
                </div>
              )}

              {/* Confirmation steps */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 14, letterSpacing: "0.8px" }}>{t("CONFIRMATION PROCESS", "BESTÄTIGUNGSPROZESS")}</div>
                {[
                  { icon: booking?.partnerConfirmed === "true" ? "✅" : "⏳", label: t("Accommodation confirms availability", "Unterkunft bestätigt Verfügbarkeit"), done: booking?.partnerConfirmed === "true" },
                  { icon: booking?.operatorConfirmed === "true" ? "✅" : "⏳", label: t("Jadran.ai operator reviews booking", "Jadran.ai Operator prüft Buchung"), done: booking?.operatorConfirmed === "true" },
                  { icon: "🔓", label: t("You select transport & unlock AI guide", "Transport wählen & KI-Guide freischalten"), done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: item.done ? C.white : C.muted }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "14px 20px", borderRadius: 14, background: "rgba(0,180,216,0.05)", border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, textAlign: "center" }}>
                <div className="pulse" style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: C.warning, marginRight: 8 }} />
                {t("Checking for updates every 15 seconds…", "Prüfe alle 15 Sekunden auf Updates…")}
              </div>
            </>
          )}

          {/* ══ STEP: TRANSPORT — Pre-trip Level 2 ══ */}
          {step === "transport" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🗺️</div>
                <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", fontSize: 11, color: C.success, fontWeight: 700, letterSpacing: "1px", marginBottom: 16 }}>
                  ✓ {t("BOOKING CONFIRMED — STEP 2", "BUCHUNG BESTÄTIGT — SCHRITT 2")}
                </div>
                <h1 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, marginBottom: 12 }}>
                  {t(`${displayName}, how are you travelling?`, `${displayName}, wie reist du an?`)}
                </h1>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
                  {t("Your AI guide will be personalised for your transport mode — routes, tips and alerts that matter to you.",
                     "Dein KI-Guide wird für dein Reisemittel personalisiert — Routen, Tipps und Alerts speziell für dich.")}
                </p>
              </div>

              {/* Transport options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                {TRANSPORT_OPTIONS.map(opt => {
                  const active = selectedTransport === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setSelectedTransport(opt.id)}
                      style={{ padding: "18px 16px", borderRadius: 16, background: active ? `linear-gradient(135deg, rgba(0,180,216,0.12), rgba(0,133,168,0.08))` : C.surface, border: `2px solid ${active ? C.accent : C.border}`, color: C.white, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.18s" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                        {lang === "de" ? opt.de : opt.en}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {lang === "de" ? opt.desc_de : opt.desc_en}
                      </div>
                      {active && <div style={{ marginTop: 8, fontSize: 11, color: C.accent, fontWeight: 700 }}>✓ Selected</div>}
                    </button>
                  );
                })}
              </div>

              <button onClick={() => { if (selectedTransport) setStep("payment"); }}
                disabled={!selectedTransport}
                style={{ width: "100%", padding: "18px", borderRadius: 18, background: selectedTransport ? `linear-gradient(135deg, ${C.accent}, #0085a8)` : "rgba(255,255,255,0.05)", color: selectedTransport ? "#fff" : C.muted, fontSize: 16, fontWeight: 800, border: "none", cursor: selectedTransport ? "pointer" : "default", fontFamily: "inherit", marginBottom: 12 }}>
                {t("Continue → Unlock AI Guide", "Weiter → KI-Guide freischalten")}
              </button>
              {!selectedTransport && (
                <p style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>{t("Select your transport mode above to continue.", "Wähle dein Reisemittel aus.")}</p>
              )}
            </>
          )}

          {/* ══ STEP: PAYMENT — Gate ══ */}
          {step === "payment" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🔓</div>
                <div style={{ display: "inline-block", padding: "4px 16px", borderRadius: 20, background: "rgba(0,180,216,0.1)", border: `1px solid ${C.accent}40`, fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: 16 }}>
                  {t("UNLOCK YOUR AI GUIDE", "KI-GUIDE FREISCHALTEN")}
                </div>
                <h1 style={{ fontFamily: "Georgia, 'Playfair Display', serif", fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, marginBottom: 12 }}>
                  {t("One step to your AI travel companion", "Ein Schritt zu deinem KI-Reisebegleiter")}
                </h1>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
                  {t(`Transport: ${TRANSPORT_OPTIONS.find(o => o.id === selectedTransport)?.[lang === "de" ? "de" : "en"] || selectedTransport}. Your guide will be fully personalised.`,
                     `Transport: ${TRANSPORT_OPTIONS.find(o => o.id === selectedTransport)?.de || selectedTransport}. Dein Guide wird vollständig personalisiert.`)}
                </p>
              </div>

              {/* Plan selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {PLANS.map(plan => {
                  const active = selectedPlan === plan.id;
                  return (
                    <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                      style={{ padding: "18px 20px", borderRadius: 16, background: active ? `linear-gradient(135deg, rgba(0,180,216,0.12), rgba(0,133,168,0.06))` : C.surface, border: `2px solid ${active ? C.accent : C.border}`, color: C.white, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 16, textAlign: "left" }}>
                      <span style={{ fontSize: 28 }}>{plan.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{plan.label}</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{plan.desc}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: active ? C.accent : C.muted }}>{plan.price}</div>
                    </button>
                  );
                })}
              </div>

              <button onClick={startCheckout} disabled={checkingOut}
                style={{ width: "100%", padding: "20px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 17, fontWeight: 800, border: "none", cursor: checkingOut ? "default" : "pointer", fontFamily: "inherit", boxShadow: `0 8px 36px ${C.accent}40`, marginBottom: 14 }}>
                {checkingOut
                  ? <span><span className="spin">↻</span> {t("Redirecting to payment…", "Weiterleitung zur Zahlung…")}</span>
                  : <span>💳 {t(`Pay ${PLANS.find(p=>p.id===selectedPlan)?.price} · Unlock Guide`, `${PLANS.find(p=>p.id===selectedPlan)?.price} bezahlen · Guide freischalten`)}</span>}
                <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.75, marginTop: 5 }}>
                  {t("Secured by Stripe · Instant access", "Gesichert durch Stripe · Sofortzugang")}
                </div>
              </button>

              <button onClick={() => setStep("transport")}
                style={{ width: "100%", padding: "12px", borderRadius: 14, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← {t("Change transport", "Transport ändern")}
              </button>
            </>
          )}

          {/* ══ STEP: GUIDE — Full access ══ */}
          {step === "guide" && (
            <>
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
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{booking.accommodation?.name}</div>
                      <div style={{ fontSize: 14, color: C.accent, marginTop: 2 }}>📍 {displayDest}</div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, background: C.card, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                      {booking.id || tripId}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {booking.dates?.arrival   && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Arrival","Anreise")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.arrival}</div></div>}
                    {booking.dates?.departure && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Departure","Abreise")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.departure}</div></div>}
                    {booking.dates?.guests    && <div><span style={{ fontSize: 11, color: C.muted }}>{t("Guests","Gäste")}</span><div style={{ fontSize: 14, fontWeight: 600 }}>{booking.dates.guests}</div></div>}
                  </div>
                  {booking.accommodation?.direct && (
                    <div style={{ marginTop: 14, fontSize: 13, color: C.success }}>
                      ✓ {t("Direct booking — AI companion included", "Direktbuchung — KI-Begleiter inklusive")}
                    </div>
                  )}
                </div>
              )}

              {/* PRE-TRIP CHECKLIST */}
              {phase === "pretrip" && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 28 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>📋 {t("Pre-Trip Checklist", "Vor-Reise Checkliste")}</h3>
                  {[
                    t("✓ Booking confirmed — check your email", "✓ Buchung bestätigt — E-Mail prüfen"),
                    t("○ Ferry reservation (arrive 1–2h early in summer!)", "○ Fährreservierung (im Sommer 1–2h früher ankommen!)"),
                    t("○ Check ferry cameras before departure", "○ Fährkameras vor Abfahrt prüfen"),
                    t("○ Download offline maps for the island", "○ Offline-Karten für die Insel herunterladen"),
                    t("○ Pack: sunscreen, cash (ATMs limited), EU health card", "○ Packen: Sonnencreme, Bargeld, EU-Gesundheitskarte"),
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: i === 0 ? C.success : C.muted, marginBottom: 8, paddingLeft: 4 }}>{item}</div>
                  ))}
                </div>
              )}

              {/* MAIN CTA */}
              <button onClick={enterGuide}
                style={{ width: "100%", padding: "20px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 36px ${C.accent}50`, marginBottom: 14 }}>
                🚀 {t("Open AI Guide", "KI-Guide öffnen")}
                <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.8, marginTop: 4 }}>
                  {t("Full context loaded · Powered by Jadran.ai", "Vollständiger Kontext geladen · Powered by Jadran.ai")}
                </div>
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 32 }}>
                <a href="/explore" style={{ padding: "13px", borderRadius: 14, border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
                  🗺️ {t("Explore", "Erkunden")}
                </a>
                <a href="tel:112" style={{ padding: "13px", borderRadius: 14, border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13, textDecoration: "none", textAlign: "center", display: "block" }}>
                  🆘 {t("Emergency: 112", "Notruf: 112")}
                </a>
              </div>

              {/* QUICK INFO */}
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
