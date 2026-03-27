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
        icon: "🚢",
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

const fonts = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
`;

export default function DestinationExplorer({ language = "en", onStartChat }) {
  const [view, setView] = useState("explorer"); // explorer | detail
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [lang, setLang] = useState(() => {
    // Auto-detect from browser if not passed
    if (language === "de") return "de";
    if (typeof navigator !== "undefined") {
      const bl = navigator.language?.slice(0, 2).toLowerCase();
      if (bl === "de") return "de";
    }
    return "en";
  });

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const openDestination = (dest) => {
    if (dest.locked) return;
    setSelected(dest);
    setActiveCategory(dest.categories?.[0] || null);
    setView("detail");
  };

  const goBack = () => {
    setView("explorer");
    setSelected(null);
    setActiveCategory(null);
  };

  const handleStartTrip = () => {
    if (onStartChat) {
      onStartChat(selected, lang);
    } else {
      // Default: navigate to kiosk mode for this destination
      window.location.href = `/?kiosk=${selected.id}&lang=${lang}`;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.gradient, fontFamily: "'DM Sans', sans-serif", color: C.white, overflow: "hidden" }}>
      <style>{fonts}{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .dest-card { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; }
        .dest-card:hover { transform: translateY(-8px) scale(1.02); }
        .dest-card.locked { opacity: 0.5; cursor: default; }
        .dest-card.locked:hover { transform: none; }
        .cat-pill { transition: all 0.3s; cursor: pointer; border: none; outline: none; }
        .cat-pill:hover { transform: scale(1.05); }
        .cat-pill.active { background: ${C.accent} !important; color: white !important; }
        .item-card { transition: all 0.3s; }
        .item-card:hover { transform: translateX(4px); background: ${C.cardHover} !important; }
        .aff-btn { transition: all 0.2s; cursor: pointer; border: none; outline: none; }
        .aff-btn:hover { transform: scale(1.05); filter: brightness(1.1); }
        .fade-in { opacity: 0; transform: translateY(20px); animation: fadeUp 0.6s ease forwards; }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .hero-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 3s infinite; }
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.accent}40; border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={goBack}>
          <div style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", fontWeight: 700, letterSpacing: "-0.5px" }}>
            <span style={{ color: C.white }}>JADRAN</span>
            <span style={{ color: C.gold }}>.ai</span>
          </div>
          {view === "detail" && (
            <span style={{ color: C.muted, fontSize: 14, marginLeft: 8 }}>← {lang === "de" ? "Alle Destinationen" : "All Destinations"}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setLang("de")} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${lang === "de" ? C.accent : C.border}`, background: lang === "de" ? C.accent + "20" : "transparent", color: lang === "de" ? C.accent : C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>DE</button>
          <button onClick={() => setLang("en")} style={{ padding: "6px 16px", borderRadius: 20, border: `1px solid ${lang === "en" ? C.accent : C.border}`, background: lang === "en" ? C.accent + "20" : "transparent", color: lang === "en" ? C.accent : C.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>EN</button>
        </div>
      </header>

      {/* ========== EXPLORER VIEW ========== */}
      {view === "explorer" && (
        <div style={{ padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <div className="fade-in" style={{ textAlign: "center", marginBottom: 48 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 16 }}>
              {lang === "de" ? "Entdecke die" : "Discover the"}{" "}
              <span style={{ color: C.accent }}>{lang === "de" ? "Adriaküste" : "Adriatic Coast"}</span>
            </h1>
            <p style={{ color: C.muted, fontSize: 18, maxWidth: 500, margin: "0 auto" }}>
              {lang === "de"
                ? "Wähle dein Reiseziel. Dein AI-Reisebegleiter erwartet dich."
                : "Choose your destination. Your AI travel companion awaits."}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {DESTINATIONS.map((d, i) => (
              <div
                key={d.id}
                className={`dest-card fade-in ${d.locked ? "locked" : ""}`}
                style={{ animationDelay: `${i * 0.1}s`, borderRadius: 16, overflow: "hidden", background: C.card, border: `1px solid ${C.border}`, position: "relative" }}
                onClick={() => openDestination(d)}
              >
                {/* Hero image */}
                <div style={{ height: 200, background: `url(${d.hero}) center/cover`, position: "relative" }}>
                  <div className="hero-shimmer" style={{ position: "absolute", inset: 0 }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, rgba(10,22,40,0.95))" }} />

                  {/* Badge */}
                  <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 12px", borderRadius: 20, background: d.badge_color, color: d.badge_color === "#666" ? "#ccc" : "#000", fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}>
                    {d.badge === "PILOT" && <span className="pulse-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#000", marginRight: 6 }} />}
                    {d.badge}
                  </div>

                  {/* Name overlay */}
                  <div style={{ position: "absolute", bottom: 12, left: 16 }}>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, margin: 0 }}>{d.name}</h2>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{lang === "de" ? d.tagline_de : d.tagline_en}</p>
                  </div>
                </div>

                {/* Stats bar */}
                {d.stats && (
                  <div style={{ padding: "12px 16px", display: "flex", gap: 16, borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.muted }}>🏖️ {d.stats.beaches} {lang === "de" ? "Strände" : "beaches"}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>📸 {d.stats.cameras} {lang === "de" ? "Kameras" : "cameras"}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>📍 {d.stats.pois} POIs</span>
                  </div>
                )}

                {/* Locked overlay */}
                {d.locked && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,22,40,0.6)", backdropFilter: "blur(2px)" }}>
                    <span style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>🔒 {lang === "de" ? "Bald verfügbar" : "Coming Soon"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Partner logos */}
          <div style={{ marginTop: 64, textAlign: "center", padding: "32px 0", borderTop: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20 }}>
              {lang === "de" ? "Unsere Partner" : "Our Partners"}
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", opacity: 0.6 }}>
              <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>GetYourGuide</span>
              <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>Viator</span>
              <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>Booking.com</span>
              <span style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>Jadrolinija</span>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL VIEW (TRIP PLANNER) ========== */}
      {view === "detail" && selected && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px 60px" }}>

          {/* Hero section */}
          <div className="fade-in" style={{ position: "relative", height: 280, borderRadius: "0 0 24px 24px", overflow: "hidden", marginBottom: 32 }}>
            <div style={{ position: "absolute", inset: 0, background: `url(${selected.hero}) center/cover` }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(10,22,40,0.95))" }} />
            <div style={{ position: "absolute", bottom: 24, left: 32, right: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 700, margin: 0 }}>{selected.name}</h1>
                  <p style={{ color: C.accent, fontSize: 16, margin: "4px 0 0" }}>{lang === "de" ? selected.tagline_de : selected.tagline_en}</p>
                </div>
                <button
                  onClick={handleStartTrip}
                  className="aff-btn"
                  style={{ padding: "14px 28px", borderRadius: 28, background: `linear-gradient(135deg, ${C.accent}, #0090b0)`, color: "white", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans'", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 20px ${C.accent}40` }}
                >
                  🤖 {lang === "de" ? "Mit AI planen" : "Plan with AI"}
                </button>
              </div>
              <p style={{ color: C.muted, fontSize: 14, marginTop: 8, maxWidth: 600 }}>
                {lang === "de" ? selected.description_de : selected.description_en}
              </p>
            </div>
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 24 }}>
            {selected.categories?.map((cat) => (
              <button
                key={cat.id}
                className={`cat-pill ${activeCategory?.id === cat.id ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 24,
                  background: activeCategory?.id === cat.id ? C.accent : C.card,
                  color: activeCategory?.id === cat.id ? "white" : C.muted,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'DM Sans'",
                  whiteSpace: "nowrap",
                  border: `1px solid ${activeCategory?.id === cat.id ? C.accent : C.border}`,
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "8px 16px", borderRadius: 12, background: `${C.gold}10`, border: `1px solid ${C.gold}30` }}>
                  <span style={{ fontSize: 12, color: C.gold }}>⭐</span>
                  <span style={{ fontSize: 12, color: C.gold, fontWeight: 500 }}>
                    {lang === "de" ? "Buche direkt bei unseren Partnern — bester Preis garantiert" : "Book directly with our partners — best price guaranteed"}
                  </span>
                </div>
              )}

              {/* Items grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {activeCategory.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="item-card"
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: C.card,
                      border: `1px solid ${item.important ? C.accent + "40" : C.border}`,
                      position: "relative",
                    }}
                  >
                    {/* Local badge */}
                    {item.local && (
                      <div style={{ position: "absolute", top: 12, right: 12, padding: "2px 8px", borderRadius: 8, background: "#22c55e20", border: "1px solid #22c55e40" }}>
                        <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>LOCAL TIP</span>
                      </div>
                    )}

                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, paddingRight: item.local ? 70 : 0 }}>{item.name}</h3>
                    <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{item.sub}</p>

                    {/* Rating */}
                    {item.rating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                        <span style={{ color: C.gold, fontSize: 13 }}>★</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{item.rating}</span>
                      </div>
                    )}

                    {/* Affiliate buttons */}
                    {(item.gyg || item.viator || item.booking) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.gyg && (
                          <a href={item.gyg} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 14px", borderRadius: 8, background: "#FF5533", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans'" }}>
                            GetYourGuide →
                          </a>
                        )}
                        {item.viator && (
                          <a href={item.viator} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 14px", borderRadius: 8, background: "#2E8B57", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans'" }}>
                            Viator →
                          </a>
                        )}
                        {item.booking && (
                          <a href={item.booking} target="_blank" rel="noopener noreferrer" className="aff-btn" style={{ padding: "6px 14px", borderRadius: 8, background: "#003580", color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none", fontFamily: "'DM Sans'" }}>
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
          <div style={{ marginTop: 48, textAlign: "center", padding: 32, borderRadius: 20, background: C.surface, border: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 8 }}>
              {lang === "de" ? "Bereit für" : "Ready for"} {selected.name}?
            </h2>
            <p style={{ color: C.muted, fontSize: 15, marginBottom: 20 }}>
              {lang === "de"
                ? "Lass unseren AI-Reisebegleiter deinen perfekten Trip planen."
                : "Let our AI travel companion plan your perfect trip."}
            </p>
            <button
              onClick={handleStartTrip}
              className="aff-btn"
              style={{ padding: "16px 40px", borderRadius: 32, background: `linear-gradient(135deg, ${C.accent}, #0090b0)`, color: "white", fontSize: 17, fontWeight: 600, fontFamily: "'DM Sans'", boxShadow: `0 6px 24px ${C.accent}40` }}
            >
              🤖 {lang === "de" ? "AI Trip Planer starten" : "Start AI Trip Planner"}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: "24px 32px", borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
        <p style={{ color: C.muted, fontSize: 12 }}>
          © 2026 JADRAN.AI — SIAL Consulting d.o.o. | Bizeljska cesta 5, 8250 Brežice, Slovenia
        </p>
      </footer>
    </div>
  );
}
