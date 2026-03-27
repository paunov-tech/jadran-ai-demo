import { useState, useEffect } from "react";

// =========================================================
// JADRAN.AI — Destination Explorer + Pre-Trip Hub
// Flow: Explore → Book (affiliate) → Drive → Arrive → Stay → Depart
// =========================================================

const GYG  = (q) => `https://www.getyourguide.com/searchResults?q=${encodeURIComponent(q)}&partner_id=9OEGOYI`;
const VIA  = (q) => `https://www.viator.com/searchResults/all?text=${encodeURIComponent(q)}&pid=P00292197`;
const BKG  = (q) => `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}&aid=101704203`;
const BKGH = (id) => `https://www.booking.com/hotel/hr/${id}.html?aid=101704203`;

const DESTINATIONS = [
  {
    id: "rab",
    name: "Rab",
    tagline_en: "Island of Happiness",
    tagline_de: "Insel des Glücks",
    // Paradise Beach / crystal water — NOT Dubrovnik
    hero: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80",
    heroDetail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
    badge: "PILOT", badge_color: "#FFB800",
    stats: { beaches: 30, cameras: 8, pois: 22 },
    coords: { lat: 44.7561, lng: 14.7642 },
    description_en: "30+ sandy beaches, medieval old town with four bell towers, and the famous Rabska Torta. Croatia's island paradise.",
    description_de: "30+ Sandstrände, mittelalterliche Altstadt mit vier Glockentürmen und die berühmte Rabska Torta. Kroatiens Inselparadies.",
    categories: [
      {
        id: "beaches", icon: "🏖️", title_en: "Beaches", title_de: "Strände",
        items: [
          { name: "Paradise Beach (Rajska Plaža)", sub: "2km sandy · shallow · family paradise · arrive before 10h", rating: 4.7 },
          { name: "Banova Vila", sub: "Below old town walls · kayaks · sunset bar", rating: 4.5 },
          { name: "Suha Punta", sub: "Kalifront forest · pine shade · taxi boat access", rating: 4.6 },
          { name: "Pudarica", sub: "Sandy by day · nightclub by night", rating: 4.4 },
          { name: "Sahara Beach", sub: "Secluded · naturist-friendly · sandstone formations", rating: 4.3 },
          { name: "Livačina", sub: "Near Paradise Beach · natural tree shade · families", rating: 4.5 },
        ],
      },
      {
        id: "excursions", icon: "🚢", title_en: "Excursions", title_de: "Ausflüge",
        affiliate: true,
        items: [
          { name: "Boat Tours around Rab", sub: "Hidden coves, caves & sea caves", rating: 4.8,
            gyg: GYG("Rab island boat tour"), viator: VIA("Rab boat tour") },
          { name: "Goli Otok — Croatian Alcatraz", sub: "Haunting abandoned prison island · 1949–1989", rating: 4.6,
            gyg: GYG("Goli Otok tour"), viator: VIA("Goli Otok") },
          { name: "Sea Kayaking Adventure", sub: "Caves, cliffs & crystal water · half or full day", rating: 4.7,
            gyg: GYG("Rab kayak"), viator: VIA("Rab kayak") },
          { name: "Island Hopping: Rab → Cres → Lošinj", sub: "Full day · 3 islands · swimming stops", rating: 4.5,
            gyg: GYG("Rab island hopping"), viator: VIA("Rab island hopping Croatia") },
          { name: "Scuba Diving — PADI Courses", sub: "Walls, caves & wrecks · beginners welcome", rating: 4.6,
            gyg: GYG("Rab diving Croatia"), viator: VIA("Rab scuba diving") },
        ],
      },
      {
        id: "stay", icon: "🏠", title_en: "Accommodation", title_de: "Unterkunft",
        affiliate: true,
        items: [
          { name: "🃏 Black Jack Rab", sub: "Palit 315 · Our direct partner · AI companion included", direct: true,
            booking: "/?kiosk=rab&affiliate=blackjack&lang=de", directLabel: "Book Direct" },
          { name: "Arbiana Hotel", sub: "Rab Old Town · sea view · 4★ · inside city walls", rating: 4.6,
            booking: BKGH("arbiana") },
          { name: "Hotel International Rab", sub: "Town center · beach access · family rooms", rating: 4.3,
            booking: BKGH("hotel-international-rab") },
          { name: "Valamar Padova Resort", sub: "Lopar · near Paradise Beach · pool · 4★", rating: 4.4,
            booking: BKGH("valamar-padova-rab") },
          { name: "Apartments in Lopar", sub: "Steps from Paradise Beach · budget-friendly", rating: 4.2,
            booking: BKG("Lopar Rab Island Croatia") },
          { name: "Camping San Marino Resort", sub: "Lopar · mobile homes · direct beach access", rating: 4.3,
            booking: BKG("Rab camping San Marino") },
        ],
      },
      {
        id: "food", icon: "🍽️", title_en: "Food & Drink", title_de: "Essen & Trinken",
        items: [
          { name: "Rabska Torta", sub: "Ul. Stjepana Radića 5 · spiral almond cake · buy whole as souvenir", rating: 4.9, local: true },
          { name: "Restaurant Kamenjak", sub: "407m hilltop · panoramic Kvarner view · insider pick", rating: 4.8, local: true },
          { name: "Konoba Santa Maria", sub: "Old town · fresh catch of the day · octopus salad", rating: 4.7, local: true },
          { name: "Forum Bar & Restaurant", sub: "Old town square · café by day · cocktails by night", rating: 4.3, local: true },
          { name: "Zlatni Zal Beach Bar", sub: "Banova Vila beach · cold Karlovačko · sunset views", rating: 4.4, local: true },
        ],
      },
      {
        id: "sights", icon: "🏛️", title_en: "Must See", title_de: "Sehenswürdigkeiten",
        items: [
          { name: "Rab Old Town — Four Bell Towers", sub: "Venetian-Roman architecture · ship silhouette from sea", rating: 4.8 },
          { name: "Kamenjak Peak (407m)", sub: "Drive or hike · panoramic Kvarner Bay view · restaurant at top", rating: 4.9 },
          { name: "Cathedral of St Mary (26m tower)", sub: "Climb the bell tower · €3 · best photos at golden hour", rating: 4.7 },
          { name: "Geopark Rab — Lopar", sub: "UNESCO · sandstone formations · coastal hiking trails", rating: 4.6 },
          { name: "Franciscan Monastery of St. Euphemia", sub: "Kampor · 1458 · 27-scene painted ceiling", rating: 4.5 },
          { name: "Komrčar Forest Park", sub: "8ha · pines & cypress · sea views · walking paths", rating: 4.4 },
        ],
      },
      {
        id: "transport", icon: "⛴️", title_en: "Getting There", title_de: "Anreise",
        items: [
          { name: "Ferry Stinica → Mišnjak", sub: "Main line · 15 min · hourly · ~€25 car+passengers · NO advance booking · arrive early in summer!", important: true },
          { name: "Ferry Lopar → Valbiska (Krk)", sub: "Car ferry · Krk connected to mainland by bridge · good for Rijeka route" },
          { name: "Catamaran Rijeka → Rab Town", sub: "~2h · summer season only · foot passengers only" },
          { name: "Taxi boats to beaches", sub: "From Rab harbor · Suha Punta, Kampor, hidden coves" },
        ],
      },
    ],
  },
  {
    id: "split", name: "Split", tagline_en: "Heart of Dalmatia", tagline_de: "Herz Dalmatiens",
    hero: "https://images.unsplash.com/photo-1592486058517-a9d8e6a95bf0?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155",
    stats: { beaches: 15, cameras: 12, pois: 35 }, locked: true,
  },
  {
    id: "dubrovnik", name: "Dubrovnik", tagline_en: "Pearl of the Adriatic", tagline_de: "Perle der Adria",
    hero: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155",
    stats: { beaches: 10, cameras: 8, pois: 40 }, locked: true,
  },
  {
    id: "zadar", name: "Zadar", tagline_en: "City of Sunsets", tagline_de: "Stadt der Sonnenuntergänge",
    hero: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155",
    stats: { beaches: 12, cameras: 6, pois: 28 }, locked: true,
  },
  {
    id: "hvar", name: "Hvar", tagline_en: "Island of Sun", tagline_de: "Insel der Sonne",
    hero: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155",
    stats: { beaches: 20, cameras: 7, pois: 32 }, locked: true,
  },
  {
    id: "krk", name: "Krk", tagline_en: "Golden Island", tagline_de: "Goldene Insel",
    hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    badge: "COMING SOON", badge_color: "#334155",
    stats: { beaches: 25, cameras: 10, pois: 30 }, locked: true,
  },
];

const JOURNEY = [
  {
    num: "01", icon: "🏠", key: "book",
    en: { title: "Book", sub: "Choose your destination, book accommodation via our affiliate partners. Direct partner bookings include AI companion." },
    de: { title: "Buchen", sub: "Wähle dein Reiseziel, buche über unsere Partner. Direktbuchungen beinhalten den KI-Begleiter." },
  },
  {
    num: "02", icon: "🚗", key: "drive",
    en: { title: "Drive", sub: "Real-time AI on every kilometer. Bura warnings, ferry queues, toll plazas, camper height alerts — we track you all the way to your accommodation." },
    de: { title: "Fahren", sub: "Echtzeit-KI auf jedem Kilometer. Bora-Warnungen, Fährenzeiten, Mautinfos — wir begleiten dich bis zur Unterkunft." },
  },
  {
    num: "03", icon: "🏝️", key: "arrive",
    en: { title: "Arrive", sub: "App switches automatically to Kiosk mode on arrival. Check-in info, first-day tips, live cameras — whether you booked with us or not." },
    de: { title: "Ankommen", sub: "App wechselt automatisch in den Kiosk-Modus. Check-in, Tipps für den ersten Tag, Live-Kameras — für alle Gäste." },
  },
  {
    num: "04", icon: "🍽️", key: "stay",
    en: { title: "Stay", sub: "Beaches, restaurants, excursions on demand. Our affiliate partners always shown first — best deals, commission goes back to improving the guide." },
    de: { title: "Bleiben", sub: "Strände, Restaurants, Ausflüge auf Abruf. Unsere Partner immer zuerst — beste Preise, Provision fließt in den Guide zurück." },
  },
  {
    num: "05", icon: "👋", key: "depart",
    en: { title: "Depart", sub: "Departure reminder + \"extend your stay?\" offer. Non-bookers: get promo code for next year. Affiliate guests: loyalty discount applied automatically." },
    de: { title: "Abreise", sub: "Abreise-Erinnerung + Verlängerungsangebot. Aktionscode für nächstes Jahr. Affiliate-Gäste erhalten automatisch Treuerabatt." },
  },
];

const C = {
  bg: "#0a1628", surface: "#0f1e35", card: "#162240",
  cardHover: "#1c2d52", accent: "#00b4d8", gold: "#FFB800",
  white: "#f0f4f8", muted: "#7a8fa8", border: "rgba(0,180,216,0.12)",
  borderGold: "rgba(255,184,0,0.35)", borderGoldBright: "rgba(255,184,0,0.7)",
  gradBg: "linear-gradient(160deg, #07111f 0%, #0d2137 60%, #081523 100%)",
};

export default function DestinationExplorer({ language = "en", onStartChat }) {
  const [view, setView] = useState("explorer");
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lang, setLang] = useState(() => {
    if (language === "de") return "de";
    if (typeof navigator !== "undefined" && navigator.language?.slice(0, 2) === "de") return "de";
    return "en";
  });

  useEffect(() => {
    const id = "jadran-explore-fonts";
    if (!document.getElementById(id)) {
      const link = Object.assign(document.createElement("link"), {
        id, rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap",
      });
      document.head.appendChild(link);
    }
  }, []);

  const openDestination = (dest) => {
    if (dest.locked) return;
    setSelected(dest);
    setActiveCategory(dest.categories?.[0] || null);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const goBack = () => {
    setView("explorer");
    setSelected(null);
    setActiveCategory(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleStartTrip = () => {
    if (onStartChat) { onStartChat(selected, lang); }
    else { window.location.href = `/?kiosk=${selected.id}&lang=${lang}`; }
  };

  const t = (en, de) => lang === "de" ? de : en;

  return (
    <div style={{ minHeight: "100dvh", background: C.gradBg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (hover: hover) {
          .dest-card:not(.locked):hover { transform: translateY(-6px) scale(1.015); box-shadow: 0 20px 48px rgba(0,0,0,0.5); }
          .aff-btn:hover { transform: scale(1.04); filter: brightness(1.12); }
          .item-card:hover { background: ${C.cardHover} !important; transform: translateX(3px); }
          .partner-card:hover { border-color: ${C.borderGoldBright} !important; box-shadow: 0 0 24px rgba(255,184,0,0.15); }
          .stage-card:hover { background: ${C.cardHover} !important; }
          .lang-btn:hover { opacity: 0.85; }
        }
        .dest-card { transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s; cursor: pointer; }
        .dest-card.locked { opacity: 0.42; cursor: not-allowed; }
        .aff-btn { transition: transform 0.18s, filter 0.18s; cursor: pointer; border: none; outline: none; }
        .item-card { transition: background 0.2s, transform 0.2s; }
        .partner-card { transition: border-color 0.25s, box-shadow 0.25s; }
        .stage-card { transition: background 0.2s; }
        .lang-btn { transition: opacity 0.15s; }
        .fade-in { opacity: 0; transform: translateY(14px); animation: fadeUp 0.5s ease forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer { background: linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
        .pills-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .pills-row::-webkit-scrollbar { display: none; }
        .hero-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
        @media (max-width: 580px) {
          .hero-bottom { flex-direction: column; align-items: flex-start; }
          .hero-plan-btn { align-self: flex-start; }
        }
        .journey-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; }
        @media (max-width: 860px) { .journey-grid { grid-template-columns: 1fr; gap: 0; } }
        .aff-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 700px) { .aff-grid { grid-template-columns: 1fr; } }
        .partner-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .how-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 620px) { .how-row { grid-template-columns: 1fr; } }
        .dest-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }
        .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
        .stats-row { display: flex; gap: 14px; flex-wrap: wrap; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(7,17,31,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={goBack}>
          <span style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", fontWeight: 700, letterSpacing: "-0.5px" }}>
            <span style={{ color: C.white }}>JADRAN</span><span style={{ color: C.gold }}>.ai</span>
          </span>
          {view === "detail" && (
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>← {t("All Destinations", "Alle Destinationen")}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="lang-btn" onClick={() => setLang("de")} style={{ padding: "4px 13px", borderRadius: 20, border: `1px solid ${lang === "de" ? C.accent : C.border}`, background: lang === "de" ? C.accent + "22" : "transparent", color: lang === "de" ? C.accent : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>DE</button>
          <button className="lang-btn" onClick={() => setLang("en")} style={{ padding: "4px 13px", borderRadius: 20, border: `1px solid ${lang === "en" ? C.accent : C.border}`, background: lang === "en" ? C.accent + "22" : "transparent", color: lang === "en" ? C.accent : C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>EN</button>
          <a href="/" style={{ marginLeft: 8, padding: "7px 18px", borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}, #007fa0)`, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
            {t("Go to the Trip →", "Zur Reise →")}
          </a>
        </div>
      </header>

      {/* ═══════════════════════ EXPLORER VIEW ═══════════════════════ */}
      {view === "explorer" && (
        <>
          {/* ── HERO ── */}
          <section style={{ padding: "56px 24px 48px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
            <div className="fade-in">
              <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${C.accent}18`, border: `1px solid ${C.accent}40`, fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "1px", marginBottom: 20 }}>
                {t("PRE-TRIP PLANNER · BOOK · DRIVE · ARRIVE · STAY · DEPART", "REISEPLANUNG · BUCHEN · FAHREN · ANKOMMEN · BLEIBEN · ABREISE")}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(30px, 5.5vw, 56px)", fontWeight: 700, lineHeight: 1.08, marginBottom: 20 }}>
                {t("Your Complete", "Deine komplette")}{" "}
                <span style={{ color: C.accent, fontStyle: "italic" }}>{t("Adriatic Journey", "Adria-Reise")}</span>
                <br />{t("starts here.", "beginnt hier.")}
              </h1>
              <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: C.muted, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6 }}>
                {t(
                  "Book accommodation with our partners. We guide you door-to-door, then turn into your local expert for the entire stay.",
                  "Buche Unterkunft bei unseren Partnern. Wir begleiten dich von Tür zu Tür und werden dann dein lokaler Experte für den gesamten Aufenthalt."
                )}
              </p>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 40px", borderRadius: 32, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 17, fontWeight: 700, textDecoration: "none", boxShadow: `0 8px 32px ${C.accent}50`, fontFamily: "inherit" }}>
                🚀 {t("Go to the Trip", "Zur Reise")}
              </a>
              <p style={{ marginTop: 12, fontSize: 13, color: C.muted }}>
                {t("From €9.99/week · 3 messages free · No registration", "Ab €9,99/Woche · 3 Nachrichten gratis · Ohne Registrierung")}
              </p>
            </div>
          </section>

          {/* ── JOURNEY TIMELINE ── */}
          <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "0" }}>
            <div className="journey-grid">
              {JOURNEY.map((s, i) => {
                const txt = lang === "de" ? s.de : s.en;
                const isLast = i === JOURNEY.length - 1;
                return (
                  <div key={s.key} className="stage-card" style={{ padding: "28px 20px", borderRight: isLast ? "none" : `1px solid ${C.border}`, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: "1px" }}>{s.num}</span>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: C.white }}>{txt.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{txt.sub}</div>
                    {!isLast && (
                      <div style={{ display: "none" /* shown via CSS border */ }} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── DESTINATIONS ── */}
          <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
            <div className="fade-in" style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 700, marginBottom: 10 }}>
                {t("Discover the ", "Entdecke die ")}
                <span style={{ color: C.accent }}>{t("Adriatic Coast", "Adriaküste")}</span>
              </h2>
              <p style={{ color: C.muted, fontSize: 15 }}>{t("Click a destination to explore beaches, excursions, and accommodation.", "Klicke auf ein Reiseziel, um Strände, Ausflüge und Unterkünfte zu entdecken.")}</p>
            </div>
            <div className="dest-grid">
              {DESTINATIONS.map((d, i) => (
                <div key={d.id} className={`dest-card fade-in ${d.locked ? "locked" : ""}`}
                  style={{ animationDelay: `${i * 0.07}s`, borderRadius: 14, overflow: "hidden", background: C.card, border: `1px solid ${C.border}`, position: "relative" }}
                  onClick={() => openDestination(d)}>
                  <div style={{ height: 180, background: `url(${d.hero}) center/cover`, position: "relative" }}>
                    {!d.locked && <div className="shimmer" style={{ position: "absolute", inset: 0 }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(7,17,31,0.94))" }} />
                    <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 11px", borderRadius: 20, background: d.badge === "PILOT" ? C.gold : "#2a3a52", color: d.badge === "PILOT" ? "#000" : "#768498", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: 5 }}>
                      {d.badge === "PILOT" && <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#000", display: "inline-block" }} />}
                      {d.badge}
                    </div>
                    <div style={{ position: "absolute", bottom: 10, left: 14 }}>
                      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, margin: 0 }}>{d.name}</h2>
                      <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>{t(d.tagline_en, d.tagline_de)}</p>
                    </div>
                  </div>
                  {d.stats && (
                    <div className="stats-row" style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 11, color: C.muted }}>🏖️ {d.stats.beaches} {t("beaches", "Strände")}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>📸 {d.stats.cameras}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>📍 {d.stats.pois} POIs</span>
                    </div>
                  )}
                  {d.locked && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(7,17,31,0.55)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}>
                      <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>🔒 {t("Coming Soon", "Bald verfügbar")}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════════
              AFFILIATE PROGRAM SECTION
          ══════════════════════════════════════════════════ */}
          <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "56px 24px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

              {/* Section title */}
              <div style={{ textAlign: "center", marginBottom: 44 }}>
                <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: `${C.gold}18`, border: `1px solid ${C.gold}35`, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 16 }}>
                  {t("AFFILIATE PROGRAM", "AFFILIATE-PROGRAMM")}
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 700, marginBottom: 12 }}>
                  {t("Book with our partners.", "Buche bei unseren Partnern.")}<br />
                  <span style={{ color: C.gold }}>{t("We make the journey seamless.", "Wir machen die Reise nahtlos.")}</span>
                </h2>
                <p style={{ color: C.muted, fontSize: 15, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
                  {t(
                    "When you book accommodation or excursions through our links, we include the AI guide, track your journey, and give your booking priority in our recommendation engine. Our partners are always shown first.",
                    "Wenn du Unterkunft oder Ausflüge über unsere Links buchst, beinhalten wir den KI-Guide, verfolgen deine Reise und priorisieren deine Buchung. Unsere Partner werden immer zuerst angezeigt."
                  )}
                </p>
              </div>

              {/* ── DIRECT PARTNERS (GOLD) ── */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{ height: 1, flex: 1, background: C.borderGold }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "2px", whiteSpace: "nowrap" }}>
                    ⭐ {t("DIRECT PARTNERS — HIGHEST PRIORITY", "DIREKTPARTNER — HÖCHSTE PRIORITÄT")}
                  </span>
                  <div style={{ height: 1, flex: 1, background: C.borderGold }} />
                </div>

                <div className="partner-row">
                  {/* Black Jack Rab */}
                  <div className="partner-card" style={{ padding: 20, borderRadius: 16, background: `linear-gradient(135deg, rgba(255,184,0,0.06) 0%, ${C.card} 100%)`, border: `1.5px solid ${C.borderGold}`, position: "relative" }}>
                    <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 10px", borderRadius: 8, background: C.gold, color: "#000", fontSize: 9, fontWeight: 800, letterSpacing: "1px" }}>DIRECT</div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🃏</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Black Jack Rab</h3>
                    <p style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Palit 315 · Otok Rab, Hrvatska</p>
                    <p style={{ fontSize: 12, color: "#22c55e", marginBottom: 14, fontWeight: 500 }}>✓ {t("AI companion included · Priority kiosk", "KI-Begleiter inklusive · Kiosk-Priorität")}</p>
                    <a href="/?kiosk=rab&affiliate=blackjack&lang=de" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 10, background: C.gold, color: "#000", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}>
                      {t("Book Direct →", "Direkt buchen →")}
                    </a>
                  </div>

                  {/* Become a partner placeholder */}
                  <div style={{ padding: 20, borderRadius: 16, background: C.card, border: `1.5px dashed rgba(255,184,0,0.25)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 8, minHeight: 140 }}>
                    <div style={{ fontSize: 28 }}>🏡</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>{t("Your property here", "Deine Unterkunft hier")}</p>
                    <p style={{ fontSize: 11, color: C.muted, maxWidth: 180, lineHeight: 1.4 }}>{t("Become a direct partner — zero commission, priority placement", "Direktpartner werden — keine Provision, Vorrangsplatzierung")}</p>
                    <a href="/host" style={{ padding: "6px 16px", borderRadius: 10, border: `1px solid ${C.borderGold}`, color: C.gold, fontSize: 11, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>
                      {t("Register →", "Registrieren →")}
                    </a>
                  </div>
                </div>
              </div>

              {/* ── AFFILIATE ACCOMMODATION ── */}
              <div className="aff-grid" style={{ marginBottom: 24 }}>

                {/* Booking.com block */}
                <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <div style={{ padding: "14px 18px", background: "#003580", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🏨</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Booking.com</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("Accommodation · All types", "Unterkunft · Alle Typen")}</div>
                    </div>
                  </div>
                  <div style={{ background: C.card, padding: "14px 18px" }}>
                    {[
                      { label: t("Hotels in Rab Town", "Hotels in Rab Stadt"), url: BKG("Rab Town Croatia hotel") },
                      { label: t("Apartments in Lopar", "Apartments in Lopar"), url: BKG("Lopar Rab Island apartment") },
                      { label: t("Villas in Barbat", "Villen in Barbat"), url: BKG("Barbat Rab Island villa") },
                      { label: t("Camping San Marino Resort", "Camping San Marino"), url: BKG("Rab camping San Marino resort") },
                    ].map((item) => (
                      <a key={item.label} href={item.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}`, textDecoration: "none", color: C.white, fontSize: 13 }}>
                        <span>{item.label}</span>
                        <span style={{ color: "#4a90d9", fontSize: 12, fontWeight: 600 }}>{t("Browse →", "Ansehen →")}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* GYG + Viator block */}
                <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <div style={{ padding: "14px 18px", background: "linear-gradient(90deg, #cc3300, #117733)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>🎯</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>GetYourGuide · Viator</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t("Excursions · Activities · Tours", "Ausflüge · Aktivitäten · Touren")}</div>
                    </div>
                  </div>
                  <div style={{ background: C.card, padding: "14px 18px" }}>
                    {[
                      { label: t("Boat Tours around Rab", "Bootstouren um Rab"),
                        gyg: GYG("Rab island boat tour"), via: VIA("Rab boat tour") },
                      { label: t("Goli Otok — Prison Island", "Goli Otok — Gefängnisinsel"),
                        gyg: GYG("Goli Otok tour Croatia"), via: VIA("Goli Otok") },
                      { label: t("Sea Kayaking", "Seekajakfahren"),
                        gyg: GYG("Rab kayaking"), via: VIA("Rab kayak") },
                      { label: t("Island Hopping", "Inselhopping"),
                        gyg: GYG("Rab island hopping"), via: VIA("Rab island hopping Croatia") },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: "9px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: C.white }}>{item.label}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <a href={item.gyg} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "4px 9px", borderRadius: 7, background: "#cc3300", color: "#fff", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>GYG</a>
                          <a href={item.via} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "4px 9px", borderRadius: 7, background: "#117733", color: "#fff", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>VIA</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── GO TO THE TRIP — MAIN CTA ── */}
          <section style={{ padding: "64px 24px", textAlign: "center", background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)` }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 700, marginBottom: 14 }}>
                {t("Ready to start?", "Bereit loszulegen?")}
              </h2>
              <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
                {t(
                  "The AI guide is live right now. Buy a week, a season, or go VIP. Your Adriatic journey starts from the first message.",
                  "Der KI-Guide ist jetzt live. Kaufe eine Woche, eine Saison oder gehe VIP. Deine Adria-Reise beginnt mit der ersten Nachricht."
                )}
              </p>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "18px 48px", borderRadius: 36, background: `linear-gradient(135deg, ${C.accent} 0%, #0072a3 100%)`, color: "#fff", fontSize: 18, fontWeight: 700, textDecoration: "none", boxShadow: `0 10px 40px ${C.accent}55`, fontFamily: "inherit", letterSpacing: "-0.3px" }}>
                🚀 {t("GO TO THE TRIP", "ZUR REISE")}
              </a>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                {[
                  t("€9.99 / week", "€9,99 / Woche"),
                  t("€19.99 / season", "€19,99 / Saison"),
                  t("€49.99 VIP", "€49,99 VIP"),
                ].map((p) => (
                  <span key={p} style={{ fontSize: 13, color: C.muted }}>{p}</span>
                ))}
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
                {t("3 messages free · No registration · 8 languages", "3 Nachrichten gratis · Ohne Registrierung · 8 Sprachen")}
              </p>
            </div>
          </section>

          {/* ── PARTNER PORTAL — B2B ── */}
          <section style={{ padding: "56px 24px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

                {/* Left: pitch */}
                <div>
                  <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, background: `${C.accent}15`, border: `1px solid ${C.accent}35`, fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "1.5px", marginBottom: 16 }}>
                    {t("FOR ACCOMMODATION PROVIDERS", "FÜR UNTERKUNFTSANBIETER")}
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, marginBottom: 14, lineHeight: 1.2 }}>
                    {t("Own a property on the Adriatic?", "Haben Sie eine Unterkunft an der Adria?")}
                  </h2>
                  <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>
                    {t(
                      "Join as a Direct Partner — zero commission on confirmed bookings, priority placement in our recommendation engine, and real-time guest tracking so you know exactly when they arrive.",
                      "Werden Sie Direktpartner — keine Provision auf bestätigte Buchungen, Vorrangsplatzierung und Echtzeit-Gästetracking, damit Sie genau wissen, wann Gäste ankommen."
                    )}
                  </p>
                  <a href="/host" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 24, background: `linear-gradient(135deg, ${C.gold}, #e59900)`, color: "#000", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: "inherit" }}>
                    ⭐ {t("Register as Partner →", "Als Partner registrieren →")}
                  </a>
                </div>

                {/* Right: how it works */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "1.5px", marginBottom: 14 }}>{t("HOW IT WORKS", "SO FUNKTIONIERT ES")}</p>
                  <div className="how-row" style={{ gap: "12px" }}>
                    {[
                      { icon: "🔗", en: "Get your unique booking link from the /host portal", de: "Erhalten Sie Ihren eindeutigen Buchungslink im /host-Portal" },
                      { icon: "📬", en: "Tourist books → you get instant notification with dates & guest count", de: "Gast bucht → Sie erhalten sofortige Benachrichtigung mit Daten & Gästezahl" },
                      { icon: "✅", en: "Confirm within 24h on the portal — booking locked, double-booking impossible", de: "Innerhalb 24h bestätigen — Buchung gesperrt, Doppelbuchung unmöglich" },
                    ].map((step) => (
                      <div key={step.icon} style={{ padding: 14, borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 22, marginBottom: 8 }}>{step.icon}</div>
                        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{lang === "de" ? step.de : step.en}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <p style={{ fontSize: 12, color: "#f87171", lineHeight: 1.5 }}>
                      <strong>🚫 {t("No double booking:", "Kein Doppelbuchen:")}</strong>{" "}
                      {t("Each booking gets a unique ID. Unconfirmed bookings auto-expire in 24h. Confirmed slots are locked and cannot be re-sold.", "Jede Buchung erhält eine eindeutige ID. Unbestätigte Buchungen laufen nach 24h ab. Bestätigte Zeiträume sind gesperrt.")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══════════════════════ DETAIL VIEW ═══════════════════════ */}
      {view === "detail" && selected && (
        <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 60 }}>

          {/* Hero */}
          <div className="fade-in" style={{ position: "relative", height: 280, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: `url(${selected.heroDetail || selected.hero}) center/cover` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 15%, rgba(7,17,31,0.97))" }} />
            <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
              <div className="hero-bottom">
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{selected.name}</h1>
                  <p style={{ color: C.accent, fontSize: 14, margin: "5px 0 0" }}>{t(selected.tagline_en, selected.tagline_de)}</p>
                </div>
                <button onClick={handleStartTrip} className="aff-btn hero-plan-btn"
                  style={{ padding: "11px 22px", borderRadius: 22, background: `linear-gradient(135deg, ${C.accent}, #007fa0)`, color: "white", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 20px ${C.accent}50`, whiteSpace: "nowrap", flexShrink: 0 }}>
                  🤖 {t("Plan with AI", "Mit AI planen")}
                </button>
              </div>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 8, maxWidth: 540 }}>
                {t(selected.description_en, selected.description_de)}
              </p>
            </div>
          </div>

          <div style={{ padding: "0 24px" }}>
            {/* Category pills */}
            <div className="pills-row" style={{ marginTop: 24 }}>
              {selected.categories?.map((cat) => (
                <button key={cat.id} className="cat-pill"
                  onClick={() => setActiveCategory(cat)}
                  style={{ padding: "8px 17px", borderRadius: 22, background: activeCategory?.id === cat.id ? C.accent : C.card, color: activeCategory?.id === cat.id ? "#fff" : C.muted, fontSize: 13, fontWeight: 500, fontFamily: "inherit", whiteSpace: "nowrap", border: `1px solid ${activeCategory?.id === cat.id ? C.accent : C.border}`, transition: "background 0.2s, color 0.2s, border-color 0.2s", cursor: "pointer" }}>
                  {cat.icon} {t(cat.title_en, cat.title_de)}
                </button>
              ))}
            </div>

            {/* Items */}
            {activeCategory && (
              <div className="fade-in" key={activeCategory.id}>
                {activeCategory.affiliate && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 10, background: `${C.gold}10`, border: `1px solid ${C.gold}30` }}>
                    <span style={{ fontSize: 12, color: C.gold }}>⭐</span>
                    <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>
                      {t("Book directly with our partners — best price guaranteed", "Direkt bei unseren Partnern buchen — bester Preis garantiert")}
                    </span>
                  </div>
                )}
                <div className="items-grid">
                  {activeCategory.items?.map((item) => (
                    <div key={item.name} className="item-card"
                      style={{ padding: 16, borderRadius: 14, background: item.direct ? `linear-gradient(135deg, rgba(255,184,0,0.06), ${C.card})` : C.card, border: `1px solid ${item.direct ? C.borderGold : item.important ? C.accent + "40" : C.border}`, position: "relative" }}>
                      {item.local && (
                        <div style={{ position: "absolute", top: 10, right: 10, padding: "2px 8px", borderRadius: 7, background: "#22c55e18", border: "1px solid #22c55e35" }}>
                          <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 700 }}>LOCAL TIP</span>
                        </div>
                      )}
                      {item.direct && (
                        <div style={{ position: "absolute", top: 10, right: 10, padding: "2px 8px", borderRadius: 7, background: C.gold, color: "#000" }}>
                          <span style={{ fontSize: 9, fontWeight: 800 }}>DIRECT</span>
                        </div>
                      )}
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3, paddingRight: item.local || item.direct ? 64 : 0, lineHeight: 1.3 }}>{item.name}</h3>
                      <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.45, marginBottom: (item.rating || item.gyg || item.viator || item.booking) ? 9 : 0 }}>{item.sub}</p>
                      {item.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: item.gyg || item.viator || item.booking ? 9 : 0 }}>
                          <span style={{ color: C.gold, fontSize: 12 }}>★</span>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{item.rating}</span>
                        </div>
                      )}
                      {(item.gyg || item.viator || item.booking) && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {item.direct && item.booking && (
                            <a href={item.booking} style={{ padding: "6px 14px", borderRadius: 8, background: C.gold, color: "#000", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                              {item.directLabel || t("Book →", "Buchen →")}
                            </a>
                          )}
                          {!item.direct && item.gyg && (
                            <a href={item.gyg} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "5px 12px", borderRadius: 7, background: "#cc3300", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>GYG →</a>
                          )}
                          {!item.direct && item.viator && (
                            <a href={item.viator} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "5px 12px", borderRadius: 7, background: "#117733", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Viator →</a>
                          )}
                          {!item.direct && item.booking && (
                            <a href={item.booking} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "5px 12px", borderRadius: 7, background: "#003580", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Booking →</a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail CTA */}
            <div style={{ marginTop: 40, textAlign: "center", padding: "28px 20px", borderRadius: 18, background: C.surface, border: `1px solid ${C.border}` }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 4vw, 28px)", marginBottom: 8 }}>
                {t("Ready for", "Bereit für")} {selected.name}?
              </h2>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
                {t("Let our AI travel companion plan your perfect trip.", "Lass unseren KI-Reisebegleiter deinen perfekten Trip planen.")}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={handleStartTrip} className="aff-btn"
                  style={{ padding: "13px 32px", borderRadius: 26, background: `linear-gradient(135deg, ${C.accent}, #007fa0)`, color: "white", fontSize: 15, fontWeight: 700, fontFamily: "inherit", boxShadow: `0 6px 24px ${C.accent}40` }}>
                  🤖 {t("Plan with AI", "Mit AI planen")}
                </button>
                <a href="/" style={{ padding: "13px 32px", borderRadius: 26, background: C.card, border: `1px solid ${C.border}`, color: C.white, fontSize: 15, fontWeight: 600, textDecoration: "none", fontFamily: "inherit" }}>
                  🚀 {t("Go to the Trip →", "Zur Reise →")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ padding: "20px 24px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
        <p style={{ color: C.muted, fontSize: 11 }}>
          © 2026 JADRAN.AI — SIAL Consulting d.o.o. · Bizeljska cesta 5, 8250 Brežice, Slovenia
          {" · "}
          <a href="/host" style={{ color: C.accent, textDecoration: "none" }}>{t("Partner Portal", "Partnerportal")}</a>
        </p>
      </footer>
    </div>
  );
}
