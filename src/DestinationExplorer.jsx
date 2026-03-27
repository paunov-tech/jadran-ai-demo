import { useState, useEffect } from "react";

// =========================================================
// JADRAN.AI — Destination Explorer + Trip Planner
// Comes BEFORE current landing. Flow:
// Explorer → Destination Detail → Trip Services → AI Chat
// =========================================================

const DESTINATIONS = [
  {
    id: "rab",
    name: "Rab",
    tagline_en: "Island of Happiness",
    tagline_de: "Insel des Glücks",
    hero: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&q=80",
    badge: "PILOT",
    badge_color: "#FFB800",
    stats: { beaches: 30, cameras: 8, pois: 22 },
    coords: { lat: 44.7561, lng: 14.7642 },
    description_en: "30+ sandy beaches, medieval old town with four bell towers, and the famous Rabska Torta. Croatia's island paradise.",
    description_de: "30+ Sandstrände, mittelalterliche Altstadt mit vier Glockentürmen und die berühmte Rabska Torta. Kroatiens Inselparadies.",
    categories: [
      {
        id: "beaches",
        icon: "🏖️",
        title_en: "Beaches",
        title_de: "Strände",
        items: [
          { name: "Paradise Beach", sub: "2km sandy, family paradise", rating: 4.7 },
          { name: "Banova Vila", sub: "Below old town walls", rating: 4.5 },
          { name: "Suha Punta", sub: "Pine forest shade, peaceful", rating: 4.6 },
          { name: "Pudarica", sub: "Beach by day, party by night", rating: 4.4 },
        ],
      },
      {
        id: "excursions",
        icon: "🚢",
        title_en: "Excursions",
        title_de: "Ausflüge",
        affiliate: true,
        items: [
          {
            name: "Boat Tours around Rab",
            sub: "Hidden coves & islands",
            rating: 4.8,
            gyg: "https://www.getyourguide.com/searchResults?q=Rab+boat+tour&partner_id=9OEGOYI",
            viator: "https://www.viator.com/searchResults/all?text=Rab+boat+tour&pid=P00292197",
          },
          {
            name: "Goli Otok — Croatian Alcatraz",
            sub: "Haunting prison island tour",
            rating: 4.6,
            gyg: "https://www.getyourguide.com/searchResults?q=Goli+Otok+tour&partner_id=9OEGOYI",
            viator: "https://www.viator.com/searchResults/all?text=Goli+Otok&pid=P00292197",
          },
          {
            name: "Sea Kayaking Adventure",
            sub: "Caves, cliffs & crystal water",
            rating: 4.7,
            gyg: "https://www.getyourguide.com/searchResults?q=Rab+kayak&partner_id=9OEGOYI",
            viator: "https://www.viator.com/searchResults/all?text=Rab+kayak&pid=P00292197",
          },
          {
            name: "Island Hopping Day Trip",
            sub: "Rab → Cres → Lošinj",
            rating: 4.5,
            gyg: "https://www.getyourguide.com/searchResults?q=Rab+island+hopping&partner_id=9OEGOYI",
            viator: "https://www.viator.com/searchResults/all?text=Rab+island+hopping&pid=P00292197",
          },
        ],
      },
      {
        id: "stay",
        icon: "🏠",
        title_en: "Accommodation",
        title_de: "Unterkunft",
        affiliate: true,
        items: [
          {
            name: "Hotels in Rab Town",
            sub: "Walking distance to everything",
            booking: "https://www.booking.com/searchresults.html?ss=Rab+Town&aid=101704203",
          },
          {
            name: "Apartments in Lopar",
            sub: "Near Paradise Beach",
            booking: "https://www.booking.com/searchresults.html?ss=Lopar+Rab&aid=101704203",
          },
          {
            name: "Villas in Barbat",
            sub: "Quiet, sea view, couples",
            booking: "https://www.booking.com/searchresults.html?ss=Barbat+Rab&aid=101704203",
          },
          {
            name: "Camping & Mobile Homes",
            sub: "San Marino Resort, Padova",
            booking: "https://www.booking.com/searchresults.html?ss=Rab+camping&aid=101704203",
          },
        ],
      },
      {
        id: "food",
        icon: "🍽️",
        title_en: "Food & Drink",
        title_de: "Essen & Trinken",
        items: [
          { name: "Rabska Torta", sub: "Famous spiral almond cake", rating: 4.9, local: true },
          { name: "Konoba Rab", sub: "Fresh fish, grilled octopus", rating: 4.7, local: true },
          { name: "Restaurant Kamenjak", sub: "Dining with THE view", rating: 4.8, local: true },
          { name: "Forum Bar", sub: "Old town, day café → night pub", rating: 4.3, local: true },
        ],
      },
      {
        id: "sights",
        icon: "🏛️",
        title_en: "Must See",
        title_de: "Sehenswürdigkeiten",
        items: [
          { name: "Rab Old Town", sub: "4 bell towers, medieval streets", rating: 4.8 },
          { name: "Kamenjak Peak (407m)", sub: "Panoramic view of Kvarner", rating: 4.9 },
          { name: "Geopark Rab", sub: "Sandstone formations, hiking", rating: 4.6 },
          { name: "Cathedral Bell Tower", sub: "Climb 26m, €3, best photos", rating: 4.7 },
        ],
      },
      {
        id: "transport",
        icon: "⛴️",
        title_en: "Getting There",
        title_de: "Anreise",
        items: [
          { name: "Ferry Stinica → Mišnjak", sub: "15 min, hourly, ~€25/car", important: true },
          { name: "Ferry Lopar → Valbiska (Krk)", sub: "To mainland via Krk bridge" },
          { name: "Catamaran Rijeka → Rab", sub: "~2h, summer only" },
          { name: "Taxi boats to beaches", sub: "From Rab harbor" },
        ],
      },
    ],
  },
  {
    id: "split",
    name: "Split",
    tagline_en: "Heart of Dalmatia",
    tagline_de: "Herz Dalmatiens",
    hero: "https://images.unsplash.com/photo-1592486058517-a9d8e6a95bf0?w=800&q=80",
    badge: "COMING SOON",
    badge_color: "#666",
    stats: { beaches: 15, cameras: 12, pois: 35 },
    locked: true,
  },
  {
    id: "dubrovnik",
    name: "Dubrovnik",
    tagline_en: "Pearl of the Adriatic",
    tagline_de: "Perle der Adria",
    hero: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&q=80",
    badge: "COMING SOON",
    badge_color: "#666",
    stats: { beaches: 10, cameras: 8, pois: 40 },
    locked: true,
  },
  {
    id: "zadar",
    name: "Zadar",
    tagline_en: "City of Sunsets",
    tagline_de: "Stadt der Sonnenuntergänge",
    hero: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80",
    badge: "COMING SOON",
    badge_color: "#666",
    stats: { beaches: 12, cameras: 6, pois: 28 },
    locked: true,
  },
  {
    id: "pag",
    name: "Pag",
    tagline_en: "Moon Island",
    tagline_de: "Mondinsel",
    hero: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=800&q=80",
    badge: "COMING SOON",
    badge_color: "#666",
    stats: { beaches: 20, cameras: 5, pois: 18 },
    locked: true,
  },
  {
    id: "krk",
    name: "Krk",
    tagline_en: "Golden Island",
    tagline_de: "Goldene Insel",
    hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    badge: "COMING SOON",
    badge_color: "#666",
    stats: { beaches: 25, cameras: 10, pois: 30 },
    locked: true,
  },
];

const C = {
  bg: "#0a1628",
  surface: "#111d33",
  card: "#162240",
  cardHover: "#1a2d52",
  accent: "#00b4d8",
  gold: "#FFB800",
  white: "#f0f4f8",
  muted: "#8899aa",
  border: "rgba(0,180,216,0.15)",
  gradient: "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)",
};

export default function DestinationExplorer({ language = "en", onStartChat }) {
  const [view, setView] = useState("explorer"); // explorer | detail
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [lang, setLang] = useState(() => {
    if (language === "de") return "de";
    if (typeof navigator !== "undefined") {
      const bl = navigator.language?.slice(0, 2).toLowerCase();
      if (bl === "de") return "de";
    }
    return "en";
  });

  // Inject Google Fonts into <head> — more reliable than @import in body <style>
  useEffect(() => {
    const id = "jadran-explore-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";
      document.head.appendChild(link);
    }
    return () => {};
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
    if (onStartChat) {
      onStartChat(selected, lang);
    } else {
      window.location.href = `/?kiosk=${selected.id}&lang=${lang}`;
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: C.gradient, fontFamily: "'DM Sans', sans-serif", color: C.white, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Hover effects — pointer devices only, avoids sticky-hover on touch */
        @media (hover: hover) {
          .dest-card:not(.locked):hover { transform: translateY(-8px) scale(1.02); }
          .cat-pill:hover { opacity: 0.85; }
          .item-card:hover { transform: translateX(4px); background: ${C.cardHover} !important; }
          .aff-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        }

        .dest-card { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .dest-card.locked { opacity: 0.5; cursor: default; }
        .cat-pill { transition: opacity 0.2s; cursor: pointer; border: none; outline: none; }
        .item-card { transition: transform 0.25s, background 0.25s; }
        .aff-btn { transition: transform 0.2s, filter 0.2s; cursor: pointer; border: none; outline: none; }

        .fade-in { opacity: 0; transform: translateY(16px); animation: fadeUp 0.5s ease forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .hero-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 3s infinite; }

        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* Pill scrollbar — hidden but scrollable */
        .pills-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 24px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .pills-row::-webkit-scrollbar { display: none; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.accent}40; border-radius: 4px; }

        /* Detail hero: stack vertically on narrow screens */
        .hero-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
        @media (max-width: 600px) {
          .hero-bottom { flex-direction: column; align-items: flex-start; }
          .hero-plan-btn { align-self: flex-start; }
        }
      `}</style>

      {/* HEADER — sticky so navigation is always reachable */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "16px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: C.bg,
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={goBack}>
          <div style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, letterSpacing: "-0.5px" }}>
            <span style={{ color: C.white }}>JADRAN</span>
            <span style={{ color: C.gold }}>.ai</span>
          </div>
          {view === "detail" && (
            <span style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>
              ← {lang === "de" ? "Alle Destinationen" : "All Destinations"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setLang("de")}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${lang === "de" ? C.accent : C.border}`, background: lang === "de" ? C.accent + "20" : "transparent", color: lang === "de" ? C.accent : C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >DE</button>
          <button
            onClick={() => setLang("en")}
            style={{ padding: "5px 14px", borderRadius: 20, border: `1px solid ${lang === "en" ? C.accent : C.border}`, background: lang === "en" ? C.accent + "20" : "transparent", color: lang === "en" ? C.accent : C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
          >EN</button>
        </div>
      </header>

      {/* ========== EXPLORER VIEW ========== */}
      {view === "explorer" && (
        <div style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
              {lang === "de" ? "Entdecke die" : "Discover the"}{" "}
              <span style={{ color: C.accent }}>{lang === "de" ? "Adriaküste" : "Adriatic Coast"}</span>
            </h1>
            <p style={{ color: C.muted, fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 500, margin: "0 auto" }}>
              {lang === "de"
                ? "Wähle dein Reiseziel. Dein AI-Reisebegleiter erwartet dich."
                : "Choose your destination. Your AI travel companion awaits."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {DESTINATIONS.map((d, i) => (
              <div
                key={d.id}
                className={`dest-card fade-in ${d.locked ? "locked" : ""}`}
                style={{ animationDelay: `${i * 0.08}s`, borderRadius: 16, overflow: "hidden", background: C.card, border: `1px solid ${C.border}`, position: "relative" }}
                onClick={() => openDestination(d)}
              >
                {/* Hero image */}
                <div style={{ height: 190, background: `url(${d.hero}) center/cover`, position: "relative" }}>
                  {!d.locked && <div className="hero-shimmer" style={{ position: "absolute", inset: 0 }} />}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, rgba(10,22,40,0.95))" }} />

                  {/* Badge */}
                  <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 12px", borderRadius: 20, background: d.badge_color, color: d.badge_color === "#666" ? "#ccc" : "#000", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 5 }}>
                    {d.badge === "PILOT" && <span className="pulse-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#000" }} />}
                    {d.badge}
                  </div>

                  {/* Name overlay */}
                  <div style={{ position: "absolute", bottom: 12, left: 16 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, margin: 0 }}>{d.name}</h2>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{lang === "de" ? d.tagline_de : d.tagline_en}</p>
                  </div>
                </div>

                {/* Stats bar */}
                {d.stats && (
                  <div style={{ padding: "10px 16px", display: "flex", gap: 14, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.muted }}>🏖️ {d.stats.beaches} {lang === "de" ? "Strände" : "beaches"}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>📸 {d.stats.cameras} {lang === "de" ? "Kameras" : "cameras"}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>📍 {d.stats.pois} POIs</span>
                  </div>
                )}

                {/* Locked overlay */}
                {d.locked && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,22,40,0.6)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}>
                    <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>🔒 {lang === "de" ? "Bald verfügbar" : "Coming Soon"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Partner strip */}
          <div style={{ marginTop: 56, textAlign: "center", padding: "28px 0", borderTop: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 18 }}>
              {lang === "de" ? "Unsere Partner" : "Our Partners"}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", opacity: 0.55 }}>
              <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>GetYourGuide</span>
              <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>Viator</span>
              <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>Booking.com</span>
              <span style={{ fontSize: 15, color: C.muted, fontWeight: 600 }}>Jadrolinija</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL VIEW ========== */}
      {view === "detail" && selected && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 60px" }}>

          {/* Hero — full-width within container, padded content below */}
          <div className="fade-in" style={{ position: "relative", height: 260, overflow: "hidden", marginBottom: 32 }}>
            <div style={{ position: "absolute", inset: 0, background: `url(${selected.hero}) center/cover` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 20%, rgba(10,22,40,0.96))" }} />
            <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
              <div className="hero-bottom">
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(30px, 6vw, 48px)", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>{selected.name}</h1>
                  <p style={{ color: C.accent, fontSize: 15, margin: "4px 0 0" }}>{lang === "de" ? selected.tagline_de : selected.tagline_en}</p>
                </div>
                <button
                  onClick={handleStartTrip}
                  className="aff-btn hero-plan-btn"
                  style={{ padding: "12px 24px", borderRadius: 24, background: `linear-gradient(135deg, ${C.accent}, #0090b0)`, color: "white", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 4px 20px ${C.accent}40`, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  🤖 {lang === "de" ? "Mit AI planen" : "Plan with AI"}
                </button>
              </div>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 8, maxWidth: 560 }}>
                {lang === "de" ? selected.description_de : selected.description_en}
              </p>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ padding: "0 24px" }}>
            <div className="pills-row">
              {selected.categories?.map((cat) => (
                <button
                  key={cat.id}
                  className="cat-pill"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 24,
                    background: activeCategory?.id === cat.id ? C.accent : C.card,
                    color: activeCategory?.id === cat.id ? "white" : C.muted,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    whiteSpace: "nowrap",
                    border: `1px solid ${activeCategory?.id === cat.id ? C.accent : C.border}`,
                    transition: "background 0.2s, color 0.2s, border-color 0.2s",
                  }}
                >
                  {cat.icon} {lang === "de" ? cat.title_de : cat.title_en}
                </button>
              ))}
            </div>

            {/* Category content */}
            {activeCategory && (
              <div className="fade-in" key={activeCategory.id}>
                {/* Affiliate partner header */}
                {activeCategory.affiliate && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "8px 14px", borderRadius: 12, background: `${C.gold}10`, border: `1px solid ${C.gold}30` }}>
                    <span style={{ fontSize: 12, color: C.gold }}>⭐</span>
                    <span style={{ fontSize: 12, color: C.gold, fontWeight: 500 }}>
                      {lang === "de" ? "Buche direkt bei unseren Partnern — bester Preis garantiert" : "Book directly with our partners — best price guaranteed"}
                    </span>
                  </div>
                )}

                {/* Items grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {activeCategory.items?.map((item) => (
                    <div
                      key={item.name}
                      className="item-card"
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background: C.card,
                        border: `1px solid ${item.important ? C.accent + "50" : C.border}`,
                        position: "relative",
                      }}
                    >
                      {item.local && (
                        <div style={{ position: "absolute", top: 12, right: 12, padding: "2px 8px", borderRadius: 8, background: "#22c55e20", border: "1px solid #22c55e40" }}>
                          <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>LOCAL TIP</span>
                        </div>
                      )}

                      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, paddingRight: item.local ? 72 : 0, lineHeight: 1.3 }}>{item.name}</h3>
                      <p style={{ fontSize: 13, color: C.muted, marginBottom: item.rating || item.gyg || item.viator || item.booking ? 10 : 0 }}>{item.sub}</p>

                      {item.rating && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: item.gyg || item.viator || item.booking ? 10 : 0 }}>
                          <span style={{ color: C.gold, fontSize: 13 }}>★</span>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{item.rating}</span>
                        </div>
                      )}

                      {(item.gyg || item.viator || item.booking) && (
                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                          {item.gyg && (
                            <a href={item.gyg} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 13px", borderRadius: 8, background: "#FF5533", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                              GetYourGuide →
                            </a>
                          )}
                          {item.viator && (
                            <a href={item.viator} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 13px", borderRadius: 8, background: "#2E8B57", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                              Viator →
                            </a>
                          )}
                          {item.booking && (
                            <a href={item.booking} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 13px", borderRadius: 8, background: "#003580", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                              Booking.com →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div style={{ marginTop: 44, textAlign: "center", padding: "28px 24px", borderRadius: 20, background: C.surface, border: `1px solid ${C.border}` }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(22px, 4vw, 28px)", marginBottom: 8 }}>
                {lang === "de" ? "Bereit für" : "Ready for"} {selected.name}?
              </h2>
              <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
                {lang === "de"
                  ? "Lass unseren AI-Reisebegleiter deinen perfekten Trip planen."
                  : "Let our AI travel companion plan your perfect trip."}
              </p>
              <button
                onClick={handleStartTrip}
                className="aff-btn"
                style={{ padding: "14px 36px", borderRadius: 28, background: `linear-gradient(135deg, ${C.accent}, #0090b0)`, color: "white", fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", boxShadow: `0 6px 24px ${C.accent}40` }}
              >
                🤖 {lang === "de" ? "AI Trip Planer starten" : "Start AI Trip Planner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: "20px 24px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
        <p style={{ color: C.muted, fontSize: 12 }}>
          © 2026 JADRAN.AI — SIAL Consulting d.o.o. | Bizeljska cesta 5, 8250 Brežice, Slovenia
        </p>
      </footer>
    </div>
  );
}
