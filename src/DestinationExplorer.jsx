// =========================================================
// JADRAN.AI — AI Tourist Operator · Pre-Trip Hub
// Flow: Explorer → (select destination) → Destination Detail
//       → Prebooking Form → Confirmed (unique JAD-ID)
//       → GO TO TRIP (/?kiosk=rab&booking=JAD-...)
// =========================================================
import { useState, useEffect } from "react";
import { saveDelta } from "./deltaContext";

// ── AFFILIATE HELPERS ──
const GYG  = (q) => `https://www.getyourguide.com/searchResults?q=${encodeURIComponent(q)}&partner_id=9OEGOYI`;
const VIA  = (q) => `https://www.viator.com/searchResults/all?text=${encodeURIComponent(q)}&pid=P00292197`;
const BKG  = (q) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}&aid=101704203`;
const BKGH = (id) => `https://www.booking.com/hotel/hr/${id}.html?aid=101704203`;

// ── BOOKING ID GENERATOR ──
// Crockford base-32 charset — no 0/O/I/1 confusion
const B32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genId = (destId = "ADR") => {
  const p = (destId || "ADR").slice(0, 3).toUpperCase();
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Array.from({ length: 6 }, () => B32[Math.floor(Math.random() * 32)]).join("");
  return `JAD-${p}-${d}-${r}`;
};

// ── COLORS ──
const C = {
  bg: "#0a1628", surface: "#0f1e35", card: "#162240",
  cardHover: "#1c2d52", accent: "#00b4d8", gold: "#FFB800",
  white: "#f0f4f8", muted: "#7a8fa8", border: "rgba(0,180,216,0.12)",
  borderGold: "rgba(255,184,0,0.35)", borderGoldBright: "rgba(255,184,0,0.7)",
  success: "#22c55e", danger: "#ef4444",
  gradBg: "linear-gradient(160deg, #07111f 0%, #0d2137 60%, #081523 100%)",
};

// ── DIRECT PARTNERS (only these visible on main explorer) ──
const DIRECT_PARTNERS = [
  {
    id: "blackjack-rab",
    name: "Black Jack Rab",
    emoji: "🃏",
    destinationId: "rab",
    destinationName: "Rab",
    address: "Palit 315, Otok Rab",
    type: "direct",
    description_en: "Private apartments in quiet Palit village, 3km from Rab Old Town. Book direct — your AI guide activates immediately and tracks you from home to doorstep.",
    description_de: "Private Apartments im ruhigen Dorf Palit, 3km von der Altstadt. Direkt buchen — dein KI-Guide aktiviert sich sofort und begleitet dich von zu Hause bis zur Haustür.",
    perks_en: ["AI companion included", "Priority kiosk access", "Real-time transit guidance", "Local insider tips"],
    perks_de: ["KI-Begleiter inklusive", "Priority Kiosk-Zugang", "Echtzeit-Reisebegleitung", "Lokale Insider-Tipps"],
    rating: 4.8,
    reviews: 47,
  },
];

// ── DESTINATIONS ──
const DESTINATIONS = [
  {
    id: "rab",
    name: "Rab",
    tagline_en: "Island of Happiness",
    tagline_de: "Insel des Glücks",
    hero: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80",
    heroDetail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    badge: "PILOT", badge_color: "#FFB800",
    stats: { beaches: 30, cameras: 8, pois: 22 },
    coords: { lat: 44.7561, lng: 14.7642 },
    description_en: "30+ sandy beaches, medieval old town with four bell towers, and the famous Rabska Torta. Croatia's island paradise.",
    description_de: "30+ Sandstrände, mittelalterliche Altstadt mit vier Glockentürmen und die berühmte Rabska Torta. Kroatiens Inselparadies.",
    categories: [
      {
        id: "stay", icon: "🏠", title_en: "Accommodation", title_de: "Unterkunft", bookable: true,
        items: [
          { name: "🃏 Black Jack Rab", sub_en: "Palit 315 · AI companion included · Direct partner", sub_de: "Palit 315 · KI-Begleiter inklusive · Direktpartner",
            direct: true, type: "direct", bookable: true, rating: 4.8 },
          { name: "Arbiana Hotel", sub_en: "Old Town · sea view · 4★ · within city walls", sub_de: "Altstadt · Meerblick · 4★ · innerhalb der Stadtmauern",
            booking: BKGH("arbiana"), bookable: true, type: "affiliate", rating: 4.6 },
          { name: "Hotel International Rab", sub_en: "Town center · beach access · family rooms", sub_de: "Stadtzentrum · Strandzugang · Familienzimmer",
            booking: BKGH("hotel-international-rab"), bookable: true, type: "affiliate", rating: 4.3 },
          { name: "Valamar Padova Resort", sub_en: "Lopar · near Paradise Beach · pool · 4★", sub_de: "Lopar · nahe Paradiesstrand · Pool · 4★",
            booking: BKGH("valamar-padova-rab"), bookable: true, type: "affiliate", rating: 4.4 },
          { name: "Apartments in Lopar", sub_en: "Steps from Paradise Beach · budget-friendly", sub_de: "Direkt am Paradiesstrand · budgetfreundlich",
            booking: BKG("Lopar Rab Island Croatia"), bookable: true, type: "affiliate", rating: 4.2 },
          { name: "Camping San Marino Resort", sub_en: "Lopar · mobile homes · direct beach access", sub_de: "Lopar · Mobilheime · direkter Strandzugang",
            booking: BKG("Rab camping San Marino"), bookable: true, type: "affiliate", rating: 4.3 },
        ],
      },
      {
        id: "beaches", icon: "🏖️", title_en: "Beaches", title_de: "Strände",
        items: [
          { name: "Paradise Beach (Rajska Plaža)", sub_en: "2km sandy · shallow · family paradise · arrive before 10h", sub_de: "2km Sand · flach · Familienparadies · vor 10 Uhr ankommen", rating: 4.7 },
          { name: "Banova Vila", sub_en: "Below old town walls · kayaks · sunset bar", sub_de: "Unter den Stadtmauern · Kajaks · Sunset Bar", rating: 4.5 },
          { name: "Suha Punta", sub_en: "Kalifront forest · pine shade · taxi boat access", sub_de: "Kalifront-Wald · Kiefernschatten · Taxiboot", rating: 4.6 },
          { name: "Pudarica", sub_en: "Sandy by day · nightclub by night", sub_de: "Tagsüber Sand · nachts Nightclub", rating: 4.4 },
          { name: "Sahara Beach", sub_en: "Secluded · naturist-friendly · sandstone formations", sub_de: "Abgelegen · FKK-freundlich · Sandsteinformationen", rating: 4.3 },
          { name: "Livačina", sub_en: "Near Paradise Beach · natural tree shade · families", sub_de: "Nah am Paradiesstrand · natürlicher Schatten · Familien", rating: 4.5 },
        ],
      },
      {
        id: "excursions", icon: "🚢", title_en: "Excursions", title_de: "Ausflüge", affiliate: true,
        items: [
          { name: "Boat Tours around Rab", sub_en: "Hidden coves, caves & sea caves", sub_de: "Versteckte Buchten, Höhlen & Meereshöhlen", rating: 4.8,
            gyg: GYG("Rab island boat tour"), viator: VIA("Rab boat tour") },
          { name: "Goli Otok — Croatian Alcatraz", sub_en: "Haunting abandoned prison island · 1949–1989", sub_de: "Verlassene Gefängnisinsel · 1949–1989", rating: 4.6,
            gyg: GYG("Goli Otok tour"), viator: VIA("Goli Otok") },
          { name: "Sea Kayaking Adventure", sub_en: "Caves, cliffs & crystal water · half or full day", sub_de: "Höhlen, Klippen & Kristallwasser · halb oder ganzer Tag", rating: 4.7,
            gyg: GYG("Rab kayak"), viator: VIA("Rab kayak") },
          { name: "Island Hopping: Rab → Cres → Lošinj", sub_en: "Full day · 3 islands · swimming stops", sub_de: "Ganzer Tag · 3 Inseln · Baustopps", rating: 4.5,
            gyg: GYG("Rab island hopping"), viator: VIA("Rab island hopping Croatia") },
          { name: "Scuba Diving — PADI Courses", sub_en: "Walls, caves & wrecks · beginners welcome", sub_de: "Wände, Höhlen & Wracks · Anfänger willkommen", rating: 4.6,
            gyg: GYG("Rab diving Croatia"), viator: VIA("Rab scuba diving") },
        ],
      },
      {
        id: "food", icon: "🍽️", title_en: "Food & Drink", title_de: "Essen & Trinken",
        items: [
          { name: "Rabska Torta", sub_en: "Ul. Stjepana Radića 5 · spiral almond cake · perfect souvenir", sub_de: "Ul. Stjepana Radića 5 · Spiralmandeltorte · Perfektes Souvenir", rating: 4.9, local: true },
          { name: "Restaurant Kamenjak", sub_en: "407m hilltop · panoramic Kvarner Bay view", sub_de: "407m Gipfel · Panoramablick auf die Kvarner Bucht", rating: 4.8, local: true },
          { name: "Konoba Santa Maria", sub_en: "Old town · fresh catch of the day · octopus salad", sub_de: "Altstadt · Frischer Fang des Tages · Tintenfischsalat", rating: 4.7, local: true },
          { name: "Forum Bar & Restaurant", sub_en: "Old town square · café by day · cocktails by night", sub_de: "Altstadtplatz · Café am Tag · Cocktails am Abend", rating: 4.3, local: true },
          { name: "Zlatni Zal Beach Bar", sub_en: "Banova Vila beach · cold Karlovačko · sunset views", sub_de: "Banova-Vila-Strand · kaltes Karlovačko · Sonnenuntergang", rating: 4.4, local: true },
        ],
      },
      {
        id: "sights", icon: "🏛️", title_en: "Must See", title_de: "Sehenswürdigkeiten",
        items: [
          { name: "Rab Old Town — Four Bell Towers", sub_en: "Venetian-Roman architecture · ship silhouette from sea", sub_de: "Venezianisch-römische Architektur · Schiffssilhouette vom Meer", rating: 4.8 },
          { name: "Kamenjak Peak (407m)", sub_en: "Drive or hike · panoramic Kvarner Bay view · restaurant at top", sub_de: "Fahren oder wandern · Panorama · Restaurant am Gipfel", rating: 4.9 },
          { name: "Cathedral of St Mary (26m tower)", sub_en: "Climb the bell tower · €3 · best photos at golden hour", sub_de: "Glockenturm besteigen · €3 · Beste Fotos zur goldenen Stunde", rating: 4.7 },
          { name: "Geopark Rab — Lopar", sub_en: "UNESCO · sandstone formations · coastal hiking", sub_de: "UNESCO · Sandsteinformationen · Küstenwanderung", rating: 4.6 },
          { name: "Franciscan Monastery of St. Euphemia", sub_en: "Kampor · 1458 · 27-scene painted ceiling", sub_de: "Kampor · 1458 · 27-szenen bemalte Decke", rating: 4.5 },
          { name: "Komrčar Forest Park", sub_en: "8ha · pines & cypress · sea views · walking paths", sub_de: "8ha · Kiefern & Zypressen · Meerblick · Wanderwege", rating: 4.4 },
        ],
      },
      {
        id: "transport", icon: "⛴️", title_en: "Getting There", title_de: "Anreise",
        items: [
          { name: "Ferry Stinica → Mišnjak", sub_en: "Main line · 15 min · hourly · ~€25 car+passengers · NO advance booking · arrive early in summer!", sub_de: "Hauptlinie · 15 Min · stündlich · ~€25 · KEINE Vorausbuchung · Im Sommer früh ankommen!", important: true },
          { name: "Ferry Lopar → Valbiska (Krk)", sub_en: "Car ferry · Krk connected to mainland by bridge · good for Rijeka route", sub_de: "Autofähre · Krk über Brücke mit Festland verbunden · gut für Rijeka-Route" },
          { name: "Catamaran Rijeka → Rab Town", sub_en: "~2h · summer season only · foot passengers only", sub_de: "~2h · nur Sommersaison · nur Fußpassagiere" },
          { name: "Taxi boats to beaches", sub_en: "From Rab harbor · Suha Punta, Kampor, hidden coves", sub_de: "Vom Hafen Rab · Suha Punta, Kampor, versteckte Buchten" },
        ],
      },
    ],
  },
  { id: "split", name: "Split", tagline_en: "Heart of Dalmatia", tagline_de: "Herz Dalmatiens",
    hero: "https://images.unsplash.com/photo-1592486058517-a9d8e6a95bf0?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155", locked: true,
    stats: { beaches: 15, cameras: 12, pois: 35 } },
  { id: "dubrovnik", name: "Dubrovnik", tagline_en: "Pearl of the Adriatic", tagline_de: "Perle der Adria",
    hero: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155", locked: true,
    stats: { beaches: 10, cameras: 8, pois: 40 } },
  { id: "zadar", name: "Zadar", tagline_en: "City of Sunsets", tagline_de: "Stadt der Sonnenuntergänge",
    hero: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155", locked: true,
    stats: { beaches: 12, cameras: 6, pois: 28 } },
  { id: "hvar", name: "Hvar", tagline_en: "Island of Sun", tagline_de: "Insel der Sonne",
    hero: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155", locked: true,
    stats: { beaches: 20, cameras: 7, pois: 32 } },
  { id: "krk", name: "Krk", tagline_en: "Golden Island", tagline_de: "Goldene Insel",
    hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155", locked: true,
    stats: { beaches: 25, cameras: 10, pois: 30 } },
];

// ── JOURNEY STAGES ──
const JOURNEY = [
  { num: "01", icon: "🏠", key: "book",
    en: { title: "Book", sub: "Choose your destination and accommodation. Direct partner bookings activate your AI companion immediately." },
    de: { title: "Buchen", sub: "Wähle Destination und Unterkunft. Direktbuchungen aktivieren den KI-Begleiter sofort." } },
  { num: "02", icon: "🚗", key: "drive",
    en: { title: "Drive", sub: "Real-time AI on every kilometer. Bura warnings, ferry queues, camper height alerts — door-to-door." },
    de: { title: "Fahren", sub: "Echtzeit-KI auf jedem Kilometer. Bora, Fährenzeiten, Mautinfos — von Tür zu Tür." } },
  { num: "03", icon: "🏝️", key: "arrive",
    en: { title: "Arrive", sub: "App switches to Kiosk mode. Check-in info, first-day tips, live cameras — for all guests." },
    de: { title: "Ankommen", sub: "App wechselt in Kiosk-Modus. Check-in, Tipps für den ersten Tag, Live-Kameras." } },
  { num: "04", icon: "🍽️", key: "stay",
    en: { title: "Stay", sub: "Beaches, restaurants, excursions on demand. Our partners always first — best deals." },
    de: { title: "Bleiben", sub: "Strände, Restaurants, Ausflüge auf Abruf. Unsere Partner immer zuerst." } },
  { num: "05", icon: "👋", key: "depart",
    en: { title: "Depart", sub: "Departure reminder + extend your stay? Loyalty discount for returning guests." },
    de: { title: "Abreise", sub: "Abreise-Erinnerung + Verlängerungsangebot. Treuerabatt für Stammgäste." } },
];

// ── RATING STARS ──
const Stars = ({ rating }) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span style={{ color: C.gold, fontSize: 11, letterSpacing: -1 }}>
      {"★".repeat(full)}{half ? "½" : ""}
      <span style={{ color: C.muted, marginLeft: 4, fontSize: 11 }}>{rating.toFixed(1)}</span>
    </span>
  );
};

// ── MAIN COMPONENT ──
export default function DestinationExplorer({ language = "en", onStartChat }) {
  const [lang, setLang] = useState(() => {
    if (language === "de") return "de";
    try {
      const saved = localStorage.getItem("jadran_lang");
      if (saved === "de" || saved === "en") return saved;
    } catch {}
    return (typeof navigator !== "undefined" && (navigator.language || "").slice(0, 2) === "de") ? "de" : "en";
  });

  // Views: "explorer" | "destination" | "prebooking" | "confirmed"
  const [view, setView] = useState("explorer");
  const [selected, setSelected] = useState(null);       // DESTINATIONS entry
  const [selectedAccom, setSelectedAccom] = useState(null); // accommodation object
  const [activeCategory, setActiveCategory] = useState(null);

  // Booking form state
  const [form, setForm] = useState({ name: "", email: "", arrival: "", departure: "", guests: 2, notes: "" });
  const [bookingId, setBookingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copied, setCopied] = useState(false);

  const t = (en, de) => lang === "de" ? de : en;

  useEffect(() => {
    try { localStorage.setItem("jadran_lang", lang); } catch {}
  }, [lang]);

  // Inject Google Fonts
  useEffect(() => {
    const id = "jadran-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id; link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500;600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "instant" });

  // ── NAVIGATION ──
  const goBack = () => {
    if (view === "prebooking") {
      setView(selected ? "destination" : "explorer");
    } else if (view === "destination") {
      setView("explorer"); setSelected(null); setActiveCategory(null);
    } else if (view === "confirmed") {
      setView("explorer"); setSelected(null); setSelectedAccom(null); setBookingId(null);
      setForm({ name: "", email: "", arrival: "", departure: "", guests: 2, notes: "" });
    } else {
      setView("explorer");
    }
    scrollTop();
  };

  const selectDestination = (dest) => {
    if (dest.locked) return;
    setSelected(dest);
    setActiveCategory(dest.categories?.[0] || null);
    setView("destination");
    scrollTop();
  };

  const startBooking = (accom, destOverride) => {
    if (destOverride) setSelected(destOverride);
    setSelectedAccom(accom);
    setSubmitError(null);
    setView("prebooking");
    scrollTop();
  };

  // ── BOOKING SUBMISSION ──
  const submitBooking = async () => {
    if (!form.name.trim()) { setSubmitError(t("Name is required.", "Name ist erforderlich.")); return; }
    if (!form.arrival)     { setSubmitError(t("Arrival date is required.", "Anreisedatum ist erforderlich.")); return; }
    if (!form.departure)   { setSubmitError(t("Departure date is required.", "Abreisedatum ist erforderlich.")); return; }
    if (form.arrival >= form.departure) { setSubmitError(t("Departure must be after arrival.", "Abreise muss nach Anreise sein.")); return; }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const destId = selected?.id || selectedAccom?.destinationId || "ADR";
      const clientId = genId(destId);
      let finalId = clientId;

      // Call API — best-effort (fallback to client-generated ID)
      try {
        const res = await fetch("/api/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: destId,
            destinationName: selected?.name || selectedAccom?.destinationName || destId,
            accommodation: {
              name: selectedAccom?.name || "Unknown",
              type: selectedAccom?.type || "affiliate",
              direct: selectedAccom?.direct || false,
            },
            guestName: form.name.trim(),
            guestEmail: form.email.trim(),
            arrival: form.arrival,
            departure: form.departure,
            guests: form.guests,
            lang,
            deviceId: (() => { try { return localStorage.getItem("jadran_device_id") || ""; } catch { return ""; } })(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.id) finalId = data.id;
        }
      } catch { /* API down — client ID is fine for demo */ }

      // Persist booking
      const booking = {
        id: finalId,
        destination: destId,
        destinationName: selected?.name || selectedAccom?.destinationName || destId,
        accommodation: { name: selectedAccom?.name, type: selectedAccom?.type, direct: selectedAccom?.direct },
        guest: { name: form.name.trim(), email: form.email.trim() },
        dates: { arrival: form.arrival, departure: form.departure, guests: form.guests },
        lang,
        createdAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem("jadran_booking", JSON.stringify(booking));
        localStorage.setItem("jadran_booking_id", finalId);
      } catch {}

      // Save to delta_context so AI guide knows context on entry
      try {
        saveDelta({
          destination: { city: selected?.name || selectedAccom?.destinationName, region: "kvarner" },
          arrival_date: form.arrival,
          departure_date: form.departure,
          guest_name: form.name.trim(),
          booking_id: finalId,
          accommodation_name: selectedAccom?.name || "",
          accommodation_direct: selectedAccom?.direct || false,
          travelers: { adults: Number(form.guests) || 2, kids: 0, kids_ages: [] },
          phase: "pretrip",
        });
      } catch {}

      setBookingId(finalId);
      setView("confirmed");
      scrollTop();
    } catch {
      setSubmitError(t("Something went wrong. Please try again.", "Etwas ist schiefgelaufen. Bitte erneut versuchen."));
    } finally {
      setSubmitting(false);
    }
  };

  const copyId = async () => {
    try { await navigator.clipboard.writeText(bookingId); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const goToTrip = () => {
    const destId = selected?.id || selectedAccom?.destinationId || "rab";
    window.location.href = `/?kiosk=${destId}&lang=${lang}&booking=${bookingId}`;
  };

  // ── ITEM SUB HELPER ──
  const sub = (item) => lang === "de" && item.sub_de ? item.sub_de : item.sub_en || item.sub || "";

  // ═══════════════ RENDER ═══════════════
  return (
    <div style={{ minHeight: "100dvh", background: C.gradBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (hover: hover) {
          .dest-card:not(.locked):hover { transform: translateY(-6px) scale(1.015); box-shadow: 0 20px 48px rgba(0,0,0,0.5); }
          .aff-btn:hover { transform: scale(1.04); filter: brightness(1.12); }
          .item-card:hover { background: ${C.cardHover} !important; }
          .partner-card:hover { border-color: ${C.borderGoldBright} !important; box-shadow: 0 0 24px rgba(255,184,0,0.15); }
          .stage-card:hover { background: ${C.cardHover} !important; }
          .lang-btn:hover { opacity: 0.85; }
          .accom-book-btn:hover { background: ${C.accent} !important; color: #fff !important; }
          .back-btn:hover { color: ${C.white} !important; }
        }
        .dest-card { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s; cursor: pointer; }
        .dest-card.locked { opacity: 0.42; cursor: not-allowed; }
        .aff-btn { transition: transform 0.18s, filter 0.18s; cursor: pointer; border: none; outline: none; }
        .item-card { transition: background 0.2s; }
        .partner-card { transition: border-color 0.25s, box-shadow 0.25s; }
        .stage-card { transition: background 0.2s; }
        .lang-btn { transition: opacity 0.15s; }
        .back-btn { transition: color 0.15s; }
        .accom-book-btn { transition: background 0.18s, color 0.18s; }
        .fade-in { opacity: 0; transform: translateY(14px); animation: fadeUp 0.45s ease forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer { background: linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent) !important; background-size: 200% 100% !important; animation: shimmer 3s infinite !important; }
        .pills-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .pills-row::-webkit-scrollbar { display: none; }
        .journey-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 0; }
        @media (max-width: 860px) { .journey-grid { grid-template-columns: 1fr; } }
        .dest-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(290px,1fr)); gap: 18px; }
        .items-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 14px; }
        .partner-row { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 16px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
        input[type="text"],input[type="email"],input[type="date"],input[type="number"],textarea,select {
          width: 100%; background: rgba(255,255,255,0.04); border: 1px solid ${C.border};
          border-radius: 10px; color: ${C.white}; font-family: inherit; font-size: 15px; padding: 12px 14px;
          outline: none; appearance: none; -webkit-appearance: none;
        }
        input:focus,textarea:focus,select:focus { border-color: ${C.accent}; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        .confirm-id { font-family: 'Courier New', monospace; font-size: clamp(18px,4vw,28px); font-weight: 800;
          letter-spacing: 2px; color: ${C.white}; word-break: break-all; }
        @keyframes checkPop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        .check-anim { animation: checkPop 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ══ HEADER ══ */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(7,17,31,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={view === "explorer" ? undefined : goBack}>
          <span style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
            <span style={{ color: C.white }}>JADRAN</span><span style={{ color: C.gold }}>.ai</span>
          </span>
          {view !== "explorer" ? (
            <button className="back-btn" onClick={goBack} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: "0 0 0 4px" }}>
              ← {view === "destination" ? t("Destinations", "Destinationen") : view === "prebooking" ? t("Back", "Zurück") : t("Start over", "Neu starten")}
            </button>
          ) : (
            <span style={{ color: C.muted, fontSize: 11, marginLeft: 4, letterSpacing: "0.5px" }}>{t("AI TRAVEL OPERATOR", "KI-REISEOPERATEUR")}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="lang-btn" onClick={() => setLang("de")} style={{ padding: "4px 13px", borderRadius: 20, border: `1px solid ${lang === "de" ? C.accent : C.border}`, background: lang === "de" ? C.accent + "22" : "transparent", color: lang === "de" ? C.accent : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>DE</button>
          <button className="lang-btn" onClick={() => setLang("en")} style={{ padding: "4px 13px", borderRadius: 20, border: `1px solid ${lang === "en" ? C.accent : C.border}`, background: lang === "en" ? C.accent + "22" : "transparent", color: lang === "en" ? C.accent : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>EN</button>
          {bookingId ? (
            <button onClick={goToTrip} style={{ marginLeft: 8, padding: "7px 18px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #007fa0)`, color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              🚀 {t("GO TO TRIP", "ZUR REISE")}
            </button>
          ) : (
            <a href="/" style={{ marginLeft: 8, padding: "7px 18px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #007fa0)`, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
              {t("Go to the Trip →", "Zur Reise →")}
            </a>
          )}
        </div>
      </header>

      {/* ════════════ VIEW: EXPLORER ════════════ */}
      {view === "explorer" && (
        <>
          {/* HERO */}
          <section style={{ padding: "56px 24px 40px", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
            <div className="fade-in">
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${C.accent}18`, border: `1px solid ${C.accent}40`, fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.8px" }}>
                  {t("AI TRAVEL OPERATOR · BOOK · DRIVE · ARRIVE · STAY · DEPART", "KI-REISEOPERATEUR · BUCHEN · FAHREN · ANKOMMEN · BLEIBEN · ABREISE")}
                </span>
                <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${C.gold}15`, border: `1px solid ${C.borderGold}`, fontSize: 12, color: C.gold, fontWeight: 700, letterSpacing: "0.5px" }}>
                  🏛️ {t("Official Partner · TZ Rab", "Offizieller Partner · TZ Rab")}
                </span>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5.5vw, 54px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 18 }}>
                {t("Your Complete", "Dein kompletter")}{" "}
                <span style={{ color: C.accent, fontStyle: "italic" }}>{t("Adriatic Journey", "Adria-Urlaub")}</span>
                <br />{t("— from home to home.", "— von zu Hause bis zurück.")}
              </h1>
              <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: C.muted, maxWidth: 540, margin: "0 auto 28px", lineHeight: 1.65 }}>
                {t(
                  "We book your accommodation. Track you to the island. Become your local guardian for the entire stay. Then bring you safely home.",
                  "Wir buchen deine Unterkunft. Begleiten dich zur Insel. Werden dein lokaler Guardian. Und bringen dich sicher heim."
                )}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { const el = document.getElementById("partners-section"); el?.scrollIntoView({ behavior: "smooth" }); }}
                  style={{ padding: "14px 36px", borderRadius: 28, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 28px ${C.accent}45` }}>
                  🏖️ {t("Start Planning", "Reise planen")}
                </button>
                <a href="/" style={{ padding: "14px 32px", borderRadius: 28, border: `1px solid ${C.border}`, color: C.muted, fontSize: 15, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {t("I already have a trip →", "Ich habe bereits eine Reise →")}
                </a>
              </div>
            </div>
          </section>

          {/* JOURNEY TIMELINE */}
          <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <div className="journey-grid">
              {JOURNEY.map((s, i) => {
                const txt = lang === "de" ? s.de : s.en;
                const isLast = i === JOURNEY.length - 1;
                return (
                  <div key={s.key} className="stage-card" style={{ padding: "28px 24px", borderRight: isLast ? "none" : `1px solid ${C.border}`, background: "transparent", position: "relative" }}>
                    <div style={{ fontSize: 9, color: C.accent, fontWeight: 700, letterSpacing: "1px", marginBottom: 6 }}>{s.num}</div>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 6 }}>{txt.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{txt.sub}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* DIRECT PARTNERS — always visible */}
          <section id="partners-section" style={{ padding: "52px 24px 40px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${C.borderGold})` }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.gold, letterSpacing: "2px" }}>{t("OUR DIRECT PARTNERS", "DIREKTPARTNER")}</span>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${C.borderGold}, transparent)` }} />
            </div>
            <p style={{ textAlign: "center", fontSize: 14, color: C.muted, marginBottom: 28, marginTop: -16 }}>
              {t("Direct bookings include your AI guide, priority kiosk access and full transit tracking.", "Direktbuchungen beinhalten KI-Guide, Priority-Kiosk und vollständiges Transit-Tracking.")}
            </p>
            <div className="partner-row">
              {DIRECT_PARTNERS.map(p => {
                const destObj = DESTINATIONS.find(d => d.id === p.destinationId);
                const perks = lang === "de" ? p.perks_de : p.perks_en;
                const desc = lang === "de" ? p.description_de : p.description_en;
                return (
                  <div key={p.id} className="partner-card" style={{ position: "relative", background: `linear-gradient(135deg, rgba(255,184,0,0.06), ${C.card})`, border: `1.5px solid ${C.borderGold}`, borderRadius: 20, padding: "28px 24px", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 14, right: 14, background: C.gold, color: "#000", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "1px" }}>DIRECT</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 36 }}>{p.emoji}</span>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.white }}>{p.name}</h3>
                        <p style={{ fontSize: 12, color: C.muted }}>{p.address}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <Stars rating={p.rating} />
                      <span style={{ fontSize: 11, color: C.muted }}>{p.reviews} {t("reviews", "Bewertungen")}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>{desc}</p>
                    <ul style={{ listStyle: "none", marginBottom: 20 }}>
                      {perks.map(pk => (
                        <li key={pk} style={{ fontSize: 13, color: C.success, marginBottom: 4 }}>✓ {pk}</li>
                      ))}
                    </ul>
                    <button
                      className="aff-btn"
                      onClick={() => startBooking({ name: p.name, type: "direct", direct: true, destinationId: p.destinationId, destinationName: p.destinationName }, destObj)}
                      style={{ width: "100%", padding: "13px", borderRadius: 14, background: `linear-gradient(135deg, ${C.gold}, #e6a600)`, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      🃏 {t("Book Direct →", "Direkt buchen →")}
                    </button>
                  </div>
                );
              })}
              {/* Placeholder */}
              <div style={{ background: `${C.card}80`, border: `1px dashed ${C.borderGold}`, borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🏨</div>
                <p style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>{t("Your property here", "Ihre Unterkunft hier")}</p>
                <a href="/host" style={{ padding: "9px 22px", borderRadius: 20, border: `1px solid ${C.borderGold}`, color: C.gold, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  {t("Become a partner →", "Partner werden →")}
                </a>
              </div>
            </div>
          </section>

          {/* DESTINATIONS GRID */}
          <section style={{ padding: "0 24px 52px", maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${C.border})` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "2px" }}>{t("CHOOSE YOUR DESTINATION", "REISEZIEL WÄHLEN")}</span>
              <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${C.border}, transparent)` }} />
            </div>
            <p style={{ textAlign: "center", fontSize: 14, color: C.muted, marginBottom: 28, marginTop: -12 }}>
              {t("Select a destination to see all accommodation, beaches, excursions and local tips.", "Wähle eine Destination für alle Unterkünfte, Strände, Ausflüge und lokale Tipps.")}
            </p>
            <div className="dest-grid">
              {DESTINATIONS.map(dest => (
                <div key={dest.id} className={`dest-card${dest.locked ? " locked" : ""}`} onClick={() => selectDestination(dest)}
                  style={{ borderRadius: 20, overflow: "hidden", background: C.card, border: `1px solid ${C.border}`, position: "relative" }}>
                  <div style={{ height: 180, backgroundImage: `url(${dest.hero})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))" }} />
                    <div style={{ position: "absolute", top: 14, left: 14, background: dest.badge_color || C.accent, color: dest.id === "rab" ? "#000" : "#fff", fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: "1px" }}>
                      {dest.badge}
                    </div>
                    {dest.locked && <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />}
                  </div>
                  <div style={{ padding: "18px 20px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <h3 style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{dest.name}</h3>
                        <p style={{ fontSize: 13, color: C.accent, fontStyle: "italic" }}>{lang === "de" ? dest.tagline_de : dest.tagline_en}</p>
                      </div>
                    </div>
                    {dest.description_en && (
                      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 14 }}>
                        {lang === "de" ? dest.description_de : dest.description_en}
                      </p>
                    )}
                    {dest.stats && (
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>🏖️ {dest.stats.beaches} {t("beaches", "Strände")}</span>
                        <span style={{ fontSize: 12, color: C.muted }}>📍 {dest.stats.pois} POIs</span>
                        <span style={{ fontSize: 12, color: C.muted }}>📷 {dest.stats.cameras} {t("cameras", "Kameras")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PARTNER PORTAL */}
          <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "48px 24px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "2px", marginBottom: 16 }}>B2B · DESTINATION PARTNER</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 700, color: C.white, marginBottom: 14 }}>
                {t("Tourist board or property owner?", "Tourismusverband oder Unterkunft?")}
              </h2>
              <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.65, marginBottom: 28, maxWidth: 580, margin: "0 auto 28px" }}>
                {t("TZ Rab chose Jadran.ai as their official AI travel operator. Your destination could be next. Guests get an operator that guides them door-to-door and generates affiliate revenue for the destination.", "TZ Rab wählte Jadran.ai als offiziellen KI-Reiseoperateur. Deine Destination kann die nächste sein. Gäste erhalten einen Operateur von Tür zu Tür und generieren Affiliate-Einnahmen für die Destination.")}
              </p>
              <a href="/host" style={{ display: "inline-block", padding: "13px 34px", borderRadius: 24, background: `linear-gradient(135deg, ${C.gold}, #e6a600)`, color: "#000", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                {t("Become a destination partner →", "Destinationspartner werden →")}
              </a>
            </div>
          </section>
        </>
      )}

      {/* ════════════ VIEW: DESTINATION DETAIL ════════════ */}
      {view === "destination" && selected && (
        <>
          {/* DESTINATION HERO */}
          <div style={{ position: "relative", height: "clamp(260px, 40vw, 420px)", backgroundImage: `url(${selected.heroDetail || selected.hero})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(7,17,31,0.95) 100%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 28px 36px", maxWidth: 900, margin: "0 auto" }}>
              <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, background: selected.badge_color || C.accent, color: selected.id === "rab" ? "#000" : "#fff", fontSize: 9, fontWeight: 800, marginBottom: 10, letterSpacing: "1px" }}>
                {selected.badge}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, marginBottom: 6 }}>
                {selected.name}
                <span style={{ color: C.accent, fontStyle: "italic", fontSize: "0.55em", marginLeft: 14 }}>
                  {lang === "de" ? selected.tagline_de : selected.tagline_en}
                </span>
              </h1>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: C.muted }}>🏖️ {selected.stats?.beaches} {t("beaches", "Strände")}</span>
                <span style={{ fontSize: 13, color: C.muted }}>📷 {selected.stats?.cameras} {t("live cameras", "Live-Kameras")}</span>
                <span style={{ fontSize: 13, color: C.muted }}>📍 {selected.stats?.pois} POIs</span>
              </div>
            </div>
          </div>

          {/* CATEGORY PILLS */}
          <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 57, zIndex: 100 }}>
            <div className="pills-row" style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 0" }}>
              {selected.categories?.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat)}
                  style={{ flexShrink: 0, padding: "7px 18px", borderRadius: 20, border: `1px solid ${activeCategory?.id === cat.id ? C.accent : C.border}`, background: activeCategory?.id === cat.id ? `${C.accent}20` : "transparent", color: activeCategory?.id === cat.id ? C.accent : C.muted, fontSize: 13, fontWeight: activeCategory?.id === cat.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {cat.icon} {lang === "de" ? cat.title_de : cat.title_en}
                </button>
              ))}
            </div>
          </div>

          {/* ITEMS */}
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" }}>
            {activeCategory && (
              <div className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600 }}>{activeCategory.icon} {lang === "de" ? activeCategory.title_de : activeCategory.title_en}</h2>
                  {activeCategory.bookable && (
                    <span style={{ fontSize: 12, color: C.accent, padding: "3px 10px", borderRadius: 12, border: `1px solid ${C.accent}40`, background: `${C.accent}10` }}>
                      {t("Book any option below", "Buchung unten möglich")}
                    </span>
                  )}
                </div>
                <div className="items-grid">
                  {activeCategory.items?.map(item => (
                    <div key={item.name} className="item-card" style={{ background: item.direct ? `linear-gradient(135deg, rgba(255,184,0,0.06), ${C.card})` : C.card, border: item.direct ? `1.5px solid ${C.borderGold}` : `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", position: "relative" }}>
                      {item.direct && (
                        <div style={{ position: "absolute", top: 10, right: 10, background: C.gold, color: "#000", fontSize: 8, fontWeight: 800, padding: "2px 8px", borderRadius: 12, letterSpacing: "1px" }}>DIRECT</div>
                      )}
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.white, marginBottom: 4, paddingRight: item.direct ? 50 : 0 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: item.rating ? 8 : 12, lineHeight: 1.45 }}>{sub(item)}</div>
                      {item.rating && <div style={{ marginBottom: 10 }}><Stars rating={item.rating} /></div>}
                      {item.important && (
                        <div style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "5px 10px", marginBottom: 10 }}>
                          ⚠️ {t("Important info", "Wichtiger Hinweis")}
                        </div>
                      )}
                      {/* Accommodation: Book button */}
                      {item.bookable && (
                        item.direct ? (
                          <button className="accom-book-btn" onClick={() => startBooking({ ...item, destinationId: selected.id, destinationName: selected.name })}
                            style={{ width: "100%", padding: "10px", borderRadius: 10, background: `linear-gradient(135deg, ${C.gold}, #e6a600)`, color: "#000", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
                            {t("Book Direct →", "Direkt buchen →")}
                          </button>
                        ) : (
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            {item.booking ? (
                              <>
                                <button className="accom-book-btn" onClick={() => startBooking({ ...item, destinationId: selected.id, destinationName: selected.name })}
                                  style={{ flex: 1, padding: "9px 10px", borderRadius: 10, background: "transparent", color: C.accent, fontSize: 12, fontWeight: 600, border: `1px solid ${C.accent}`, cursor: "pointer", fontFamily: "inherit" }}>
                                  {t("Plan my trip", "Reise planen")}
                                </button>
                                <a href={item.booking} target="_blank" rel="noopener noreferrer"
                                  style={{ flex: 1, padding: "9px 10px", borderRadius: 10, background: "#003580", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  Booking.com →
                                </a>
                              </>
                            ) : (
                              <button className="accom-book-btn" onClick={() => startBooking({ ...item, destinationId: selected.id, destinationName: selected.name })}
                                style={{ width: "100%", padding: "9px", borderRadius: 10, background: "transparent", color: C.accent, fontSize: 12, fontWeight: 600, border: `1px solid ${C.accent}`, cursor: "pointer", fontFamily: "inherit" }}>
                                {t("Plan my trip →", "Reise planen →")}
                              </button>
                            )}
                          </div>
                        )
                      )}
                      {/* Excursions: GYG + Viator buttons */}
                      {(item.gyg || item.viator) && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                          {item.gyg && <a href={item.gyg} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#cc3300", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>GetYourGuide</a>}
                          {item.viator && <a href={item.viator} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ flex: 1, padding: "8px", borderRadius: 10, background: "#117733", color: "#fff", fontSize: 11, fontWeight: 600, textDecoration: "none", textAlign: "center" }}>Viator</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STICKY BOOK BAR */}
            <div style={{ marginTop: 40, padding: "20px 24px", background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>
                  {t(`Ready to book ${selected.name}?`, `Bereit für ${selected.name}?`)}
                </p>
                <p style={{ fontSize: 13, color: C.muted }}>
                  {t("Choose accommodation above to get your unique trip ID and AI guide.", "Unterkunft oben wählen um Trip-ID und KI-Guide zu erhalten.")}
                </p>
              </div>
              <button onClick={() => setActiveCategory(selected.categories?.find(c => c.id === "stay") || selected.categories?.[0])}
                style={{ padding: "13px 32px", borderRadius: 24, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                🏠 {t("Browse Accommodation", "Unterkunft wählen")}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ════════════ VIEW: PREBOOKING FORM ════════════ */}
      {view === "prebooking" && (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* STEP INDICATOR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 40 }}>
            {[
              t("Destination", "Reiseziel"),
              t("Details", "Details"),
              t("Confirm", "Bestätigen"),
            ].map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 1 ? C.accent : i < 1 ? C.accent : C.card, border: `2px solid ${i <= 1 ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: i <= 1 ? "#fff" : C.muted }}>
                    {i < 1 ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 11, color: i === 1 ? C.white : C.muted, fontWeight: i === 1 ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < 2 && <div style={{ width: 60, height: 1, background: i < 1 ? C.accent : C.border, margin: "0 8px 18px" }} />}
              </div>
            ))}
          </div>

          {/* BOOKING SUMMARY */}
          <div style={{ background: selectedAccom?.direct ? `linear-gradient(135deg, rgba(255,184,0,0.06), ${C.card})` : C.surface, border: `1.5px solid ${selectedAccom?.direct ? C.borderGold : C.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 32, position: "relative" }}>
            {selectedAccom?.direct && (
              <div style={{ position: "absolute", top: 12, right: 14, background: C.gold, color: "#000", fontSize: 9, fontWeight: 800, padding: "2px 10px", borderRadius: 12, letterSpacing: "1px" }}>DIRECT</div>
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 32 }}>{selectedAccom?.direct ? "🃏" : "🏨"}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 2 }}>{selectedAccom?.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
                  {selected ? (
                    <><span style={{ color: C.accent }}>📍 {selected.name}</span> · {lang === "de" ? selected.tagline_de : selected.tagline_en}</>
                  ) : (
                    <span style={{ color: C.accent }}>📍 {selectedAccom?.destinationName}</span>
                  )}
                </div>
                {selectedAccom?.direct ? (
                  <div style={{ fontSize: 12, color: C.success }}>✓ {t("AI companion included with this booking", "KI-Begleiter bei dieser Buchung inklusive")}</div>
                ) : (
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {t("Register your trip to get AI guide access", "Reise registrieren für KI-Guide-Zugang")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FORM */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 28px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              {selectedAccom?.direct ? t("Book Direct", "Direkt buchen") : t("Register Your Trip", "Reise registrieren")}
            </h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
              {selectedAccom?.direct
                ? t("Fill in your details and we'll connect you directly with the property.", "Fülle deine Daten aus und wir verbinden dich direkt mit der Unterkunft.")
                : t("Register your trip dates to activate your AI guide with full context.", "Registriere deine Reisedaten um deinen KI-Guide zu aktivieren.")}
            </p>

            {submitError && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "#f87171" }}>
                {submitError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Full name *", "Vollständiger Name *")}</label>
                <input type="text" placeholder={t("e.g. Hans Müller", "z.B. Hans Müller")}
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Email (for confirmation)", "E-Mail (für Bestätigung)")}</label>
                <input type="email" placeholder={t("your@email.com", "ihre@email.de")}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="form-grid">
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Arrival date *", "Anreisedatum *")}</label>
                  <input type="date" min={new Date().toISOString().slice(0, 10)}
                    value={form.arrival} onChange={e => setForm(f => ({ ...f, arrival: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Departure date *", "Abreisedatum *")}</label>
                  <input type="date" min={form.arrival || new Date().toISOString().slice(0, 10)}
                    value={form.departure} onChange={e => setForm(f => ({ ...f, departure: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Number of guests", "Anzahl der Gäste")}</label>
                <select value={form.guests} onChange={e => setForm(f => ({ ...f, guests: Number(e.target.value) }))}>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <option key={n} value={n} style={{ background: C.card }}>{n} {n === 1 ? t("guest", "Gast") : t("guests", "Gäste")}</option>
                  ))}
                </select>
              </div>
              {selectedAccom?.direct && (
                <div>
                  <label style={{ fontSize: 12, color: C.muted, fontWeight: 500, display: "block", marginBottom: 6 }}>{t("Special requests (optional)", "Besondere Wünsche (optional)")}</label>
                  <textarea rows={3} placeholder={t("Crib, late check-in, dietary needs...", "Kinderbett, später Check-in, Ernährungsbedürfnisse...")}
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ resize: "vertical" }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={goBack} style={{ flex: "0 0 auto", padding: "13px 24px", borderRadius: 12, background: "transparent", color: C.muted, fontSize: 14, border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit" }}>
                ← {t("Back", "Zurück")}
              </button>
              <button onClick={submitBooking} disabled={submitting}
                style={{ flex: 1, padding: "14px 24px", borderRadius: 12, background: submitting ? C.muted : `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit", minWidth: 180 }}>
                {submitting ? t("Processing…", "Verarbeite…") : t("Confirm Reservation →", "Buchung bestätigen →")}
              </button>
            </div>

            {!selectedAccom?.direct && (
              <p style={{ fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.6 }}>
                {t("ℹ️ For non-direct bookings, please complete your accommodation booking on the provider's site. We'll set up your AI guide with the dates you enter here.", "ℹ️ Bei Nicht-Direktbuchungen schließe die Buchung bitte auf der Anbieterseite ab. Wir richten deinen KI-Guide mit den hier eingegebenen Daten ein.")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ════════════ VIEW: CONFIRMED ════════════ */}
      {view === "confirmed" && bookingId && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px", textAlign: "center" }}>
          <div className="fade-in">

            {/* CHECK MARK */}
            <div className="check-anim" style={{ width: 80, height: 80, borderRadius: "50%", background: `${C.success}20`, border: `2px solid ${C.success}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 24px" }}>
              ✅
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, marginBottom: 10 }}>
              {selectedAccom?.direct ? t("Booking Request Sent!", "Buchungsanfrage gesendet!") : t("Trip Registered!", "Reise registriert!")}
            </h1>
            <p style={{ fontSize: 15, color: C.muted, marginBottom: 36, lineHeight: 1.6 }}>
              {selectedAccom?.direct
                ? t(`Your booking request for ${selectedAccom.name} has been sent. They will confirm within 24h.`, `Deine Buchungsanfrage für ${selectedAccom?.name} wurde gesendet. Bestätigung innerhalb von 24h.`)
                : t("Your trip guide is ready. Save your booking ID — it's your key to the AI guide.", "Dein Reiseführer ist bereit. Speichere deine Booking-ID — sie ist dein Schlüssel zum KI-Guide.")}
            </p>

            {/* BOOKING ID CARD */}
            <div style={{ background: C.surface, border: `1.5px solid ${C.accent}40`, borderRadius: 20, padding: "28px 24px", marginBottom: 32 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "1px", marginBottom: 12, textTransform: "uppercase" }}>
                {t("Your Booking ID", "Deine Booking-ID")}
              </div>
              <div className="confirm-id" style={{ marginBottom: 20 }}>{bookingId}</div>

              {/* QR CODE */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=0f1e35&color=00b4d8&data=${encodeURIComponent(`https://jadran.ai/?trip=${bookingId}`)}`}
                  alt={`QR: ${bookingId}`}
                  style={{ width: 130, height: 130, borderRadius: 14, border: `2px solid ${C.border}` }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
                {t("Scan to open your trip guide on any device", "QR scannen um Trip-Guide auf jedem Gerät zu öffnen")}
              </p>

              <button onClick={copyId} style={{ padding: "10px 28px", borderRadius: 12, background: copied ? `${C.success}20` : "transparent", border: `1px solid ${copied ? C.success : C.border}`, color: copied ? C.success : C.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
                {copied ? t("✓ Copied!", "✓ Kopiert!") : t("📋 Copy ID", "📋 ID kopieren")}
              </button>
            </div>

            {/* WHAT'S NEXT */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", marginBottom: 32, textAlign: "left" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 16, textAlign: "center" }}>{t("What happens next", "Was passiert als nächstes")}</h3>
              {[
                selectedAccom?.direct
                  ? { icon: "📧", en: "Accommodation confirms within 24h — you'll receive an email", de: "Unterkunft bestätigt innerhalb von 24h — du erhältst eine E-Mail" }
                  : { icon: "💾", en: "Your trip ID is saved — share or bookmark it now", de: "Deine Trip-ID ist gespeichert — teile oder bookmarke sie jetzt" },
                { icon: "🚗", en: "On travel day → click 'GO TO TRIP' below — AI activates with your full context", de: "Am Reisetag → unten 'ZUR REISE' klicken — KI aktiviert sich mit deinem Kontext" },
                { icon: "🏝️", en: "On arrival → AI switches to local Kiosk mode automatically", de: "Bei Ankunft → KI wechselt automatisch in lokalen Kiosk-Modus" },
                { icon: "👋", en: "On departure → AI reminds you about ferry times and offers loyalty discount for next year", de: "Bei Abreise → KI erinnert dich an Fährzeiten und bietet Treuerabatt für nächstes Jahr" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 3 ? 14 : 0 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{step.icon}</span>
                  <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{lang === "de" ? step.de : step.en}</p>
                </div>
              ))}
            </div>

            {/* TRIP DETAILS SUMMARY */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 32, textAlign: "left" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div><span style={{ fontSize: 11, color: C.muted }}>{t("Guest", "Gast")}</span><div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{form.name}</div></div>
                <div><span style={{ fontSize: 11, color: C.muted }}>{t("Accommodation", "Unterkunft")}</span><div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{selectedAccom?.name}</div></div>
                <div><span style={{ fontSize: 11, color: C.muted }}>{t("Arrival", "Anreise")}</span><div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{form.arrival}</div></div>
                <div><span style={{ fontSize: 11, color: C.muted }}>{t("Departure", "Abreise")}</span><div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{form.departure}</div></div>
                <div><span style={{ fontSize: 11, color: C.muted }}>{t("Guests", "Gäste")}</span><div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{form.guests}</div></div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={goToTrip}
                style={{ padding: "18px 36px", borderRadius: 28, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 18, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 8px 36px ${C.accent}50`, letterSpacing: "0.5px" }}>
                🚀 {t("GO TO TRIP", "ZUR REISE")}
              </button>
              <p style={{ fontSize: 12, color: C.muted }}>
                {t("Saves your booking context · AI activates immediately", "Buchungskontext wird gespeichert · KI aktiviert sich sofort")}
              </p>
              <button onClick={goBack} style={{ padding: "12px", borderRadius: 20, background: "transparent", color: C.muted, fontSize: 13, border: `1px solid ${C.border}`, cursor: "pointer", fontFamily: "inherit" }}>
                {t("← Book another destination", "← Weitere Destination buchen")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
