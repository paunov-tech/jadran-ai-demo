// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Design System
// Fonts, colors, shared UI primitives.
// Import: import { makeTheme, Badge, Btn, Card, SectionLabel, BackBtn, Icon, IC, CITY_ICON, CityIcon } from "./ui";
// ═══════════════════════════════════════════════════════════════
import React, { createContext, useContext } from "react";

const ThemeCtx = createContext(null);
export const ThemeProvider = ({ C, children }) => <ThemeCtx.Provider value={C}>{children}</ThemeCtx.Provider>;
export const useC = () => useContext(ThemeCtx);

// ─── FONTS ────────────────────────────────────────────────────
export const FONT_LINK = (
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
);
// Shorthand style objects — use spread: { ...dm } or { ...hf }
export const dm = { fontFamily: "'Outfit',sans-serif" };
export const hf = { fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif" };

// ─── THEME ────────────────────────────────────────────────────
// Call makeTheme(hour) once per render; pass result as `C` to all children.
export const makeTheme = (hour) => {
  const isNight = hour >= 19 || hour < 6;
  return isNight ? {
    // 🌙 NIGHT — deep Adriatic
    bg:       "#040a14",
    card:     "rgba(8,18,32,0.9)",
    accent:   "#38bdf8",
    acDim:    "rgba(56,189,248,0.10)",
    gold:     "#fbbf24",
    goDim:    "rgba(251,191,36,0.08)",
    text:     "#e0f2fe",
    mut:      "#64748b",
    bord:     "rgba(148,163,184,0.08)",
    red:      "#f87171",
    green:    "#4ade80",
    grDim:    "rgba(74,222,128,0.08)",
    sky:      "#0c4a6e",
    deep:     "#082f49",
    warm:     "#fbbf24",
    sand:     "rgba(251,191,36,0.06)",
    terracotta:"#fb923c",
    isNight:  true,
  } : {
    // ☀️ DAY — Adriatic azure
    bg:       "#0a1628",
    card:     "rgba(12,28,50,0.85)",
    accent:   "#0ea5e9",
    acDim:    "rgba(14,165,233,0.12)",
    gold:     "#f59e0b",
    goDim:    "rgba(245,158,11,0.08)",
    text:     "#f0f9ff",
    mut:      "#7dd3fc",
    bord:     "rgba(14,165,233,0.08)",
    red:      "#f87171",
    green:    "#4ade80",
    grDim:    "rgba(74,222,128,0.08)",
    sky:      "#0c4a6e",
    deep:     "#0e3a5c",
    warm:     "#f59e0b",
    sand:     "rgba(245,158,11,0.05)",
    terracotta:"#f97316",
    isNight:  false,
  };
};

// ─── SVG ICON PATHS (Feather-style 24×24) ────────────────────
export const IC = {
  // Navigation
  plane:    "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
  home:     "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z M9 21V14h6v7",
  sparkle:  "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z",
  // Quick access
  parking:  "M5 21V5a2 2 0 0 1 2-2h5a5 5 0 0 1 0 10H7",
  beach:    "M17.5 21H6.5 M5 21l4.5-9h5l4.5 9 M12 3v9 M7.5 7h9",
  sun:      "M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41",
  map:      "M3 7l6-3l6 3l6-3v13l-6 3l-6-3l-6 3Z M9 4v13 M15 7v13",
  food:     "M3 2v7a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V2 M7 2v20 M21 15V2c-2.8 0-5 2.2-5 5v6h5",
  shop:     "M3 3h18l-2 13H5Z M1 7h22 M16 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  bakery:   "M12 6C8 6 5 8 5 11c0 2 1.5 4 4 5v5h6v-5c2.5-1 4-3 4-5 0-3-3-5-7-5Z M9 3h6 M12 3v3",
  medic:    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 9v6 M9 12h6",
  gem:      "M6 3h12l4 6l-10 12L2 9Z M2 9h20",
  bot:      "M12 8V4H8 M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 16h0 M15 16h0",
  check:    "M20 6L9 17l-5-5",
  // City landmarks
  palace:   "M3 21h18 M5 21V10l7-7l7 7v11 M9 21v-5h6v5 M9 10h0 M15 10h0 M3 10h18 M7 7V4 M17 7V4",
  arena:    "M4 21c0-6 3.6-10.8 8-10.8S20 15 20 21 M6 21c0-4 2.7-7.2 6-7.2s6 3.2 6 7.2 M2 21h20 M8 10.5V8 M16 10.5V8 M12 10.2V7 M10 11V9 M14 11V9",
  church:   "M12 2v4 M10 4h4 M8 21V10l4-4l4 4v11 M8 10h8 M3 21h18 M10 16h4 M12 13v3",
  anchor:   "M12 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z M12 8v13 M5 21a7 7 0 0 1 7-7a7 7 0 0 1 7 7 M8 12H5 M19 12h-3",
  walls:    "M3 21V6l4-3l4 3l4-3l4 3l2 0v15 M3 6h18 M7 6v15 M11 6v15 M15 6v15",
  island:   "M2 20c2-3 5-5 10-5s8 2 10 5 M7 15V9l3-4l3 4v6 M12 5V3 M10 5h4",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01Z",
  ticket:   "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z M13 5v2 M13 17v2 M13 11v2",
};

// ─── SVG ICON RENDERER ────────────────────────────────────────
export const Icon = ({ d, size = 24, color = "currentColor", stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
  </svg>
);

// ─── CITY → SVG ICON MAPPING ─────────────────────────────────
export const CITY_ICON_MAP = {
  "Podstrana & Split": { ic: IC.palace, clr: "#0ea5e9",  fallback: "🏛️" },
  "Makarska rivijera": { ic: IC.beach,  clr: "#38bdf8",  fallback: "🏖️" },
  "Hvar":              { ic: IC.island, clr: "#f59e0b",  fallback: "🏝️" },
  "Rovinj":            { ic: IC.church, clr: "#fb923c",  fallback: "⛪" },
  "Pula & Medulin":    { ic: IC.arena,  clr: "#a78bfa",  fallback: "🏟️" },
  "Opatija":           { ic: IC.anchor, clr: "#34d399",  fallback: "⚓" },
  "Otok Krk":          { ic: IC.island, clr: "#fbbf24",  fallback: "🏝️" },
  "Makarska Riviera":  { ic: IC.beach,  clr: "#38bdf8",  fallback: "🏖️" },
  "Krk Island":        { ic: IC.island, clr: "#fbbf24",  fallback: "🏝️" },
};

export const CityIcon = ({ name, size = 28 }) => {
  const city = CITY_ICON_MAP[name];
  if (!city) return null;
  return (
    <div style={{ width: size + 8, height: size + 8, borderRadius: 10,
      background: city.clr + "14", display: "grid", placeItems: "center",
      border: `1px solid ${city.clr}18` }}>
      <Icon d={city.ic} size={size} color={city.clr} stroke={1.5} />
    </div>
  );
};

// ─── PRIMITIVE COMPONENTS ────────────────────────────────────
// These accept `C` (theme) as a prop so they're pure and testable.

export const Badge = ({ c = "accent", children }) => {
  const C = useC();
  const bg    = c === "accent" ? C.acDim : c === "gold" ? C.goDim : c === "green" ? C.grDim : "rgba(248,113,113,0.08)";
  const color = c === "accent" ? C.accent : c === "gold" ? C.gold : c === "green" ? C.green : C.red;
  const border= `1px solid ${c === "accent" ? "rgba(14,165,233,0.1)" : c === "gold" ? "rgba(245,158,11,0.1)" : c === "green" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`;
  return (
    <span style={{ ...dm, display:"inline-block", padding:"4px 12px", borderRadius:20,
      fontSize:11, letterSpacing:0.5, fontWeight:500, background:bg, color, border }}>
      {children}
    </span>
  );
};

export const Btn = ({ primary, small, children, ...p }) => {
  const C = useC();
  return (
    <button {...p} style={{
      padding: small ? "10px 18px" : "16px 28px",
      background: primary ? `linear-gradient(135deg,${C.accent} 0%,#0284c7 100%)` : "rgba(186,230,253,0.03)",
      border: primary ? "none" : "1px solid rgba(186,230,253,0.06)",
      borderRadius: 16, color: primary ? "#fff" : C.text,
      fontSize: small ? 13 : 17, ...hf,
      cursor: "pointer", transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      letterSpacing: primary ? 0.3 : 0,
      boxShadow: primary ? "0 6px 24px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
      ...(p.style || {}),
    }} className={primary ? "btn-glow" : ""}>
      {children}
    </button>
  );
};

export const Card = ({ children, glow, warm: isWarm, style: sx, ...p }) => {
  const C = useC();
  return (
    <div {...p} className="glass anim-card" style={{
      background: isWarm
        ? "linear-gradient(165deg, rgba(12,28,50,0.82), rgba(24,20,16,0.75))"
        : glow ? "rgba(12,28,50,0.82)" : "rgba(12,28,50,0.7)",
      borderRadius: 22, padding: 24,
      border: `1px solid ${isWarm ? "rgba(245,158,11,0.1)" : glow ? "rgba(14,165,233,0.12)" : C.bord}`,
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: glow
        ? "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(14,165,233,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...sx,
    }}>
      {children}
    </div>
  );
};

export const SectionLabel = ({ children, extra }) => {
  const C = useC();
  return (
    <div style={{ ...dm, fontSize:10, color:C.mut, letterSpacing:4, textTransform:"uppercase",
      marginBottom:16, fontWeight:500, display:"flex", alignItems:"center", gap:10 }}>
      <span style={{ width:16, height:1, background:`linear-gradient(90deg,${C.accent},transparent)` }} />
      {children}
      {extra && <span style={{ color:C.accent, fontWeight:600 }}>{extra}</span>}
    </div>
  );
};

export const BackBtn = ({ onClick, label = "← Natrag" }) => {
  const C = useC();
  return (
    <button onClick={onClick} style={{ ...dm, background:"none", border:"none",
      color:C.accent, fontSize:14, cursor:"pointer", padding:"12px 0" }}>
      {label}
    </button>
  );
};
