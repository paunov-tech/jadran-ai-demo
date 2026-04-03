// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Design System v2
// Theme, primitives, animations, icons — single source of truth.
// ═══════════════════════════════════════════════════════════════
import React, { createContext, useContext } from "react";

// ─── THEME CONTEXT ────────────────────────────────────────────
const ThemeCtx = createContext(null);
export const ThemeProvider = ({ C, children }) => <ThemeCtx.Provider value={C}>{children}</ThemeCtx.Provider>;
export const useC = () => useContext(ThemeCtx);

// ─── FONTS ────────────────────────────────────────────────────
export const FONT_LINK = (
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
);
export const dm = { fontFamily: "'Outfit',sans-serif" };
export const hf = { fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif" };

// ─── THEME ────────────────────────────────────────────────────
// Two modes keyed to time-of-day: DAY (azure coast) / NIGHT (deep ocean).
// makeTheme(hour) → color token object `C`
export const makeTheme = (hour) => {
  const isNight = hour >= 19 || hour < 6;
  return isNight ? {
    // ── NIGHT ── deep Adriatic, moonlit
    bg:          "#030c18",
    surface:     "#060f1e",
    card:        "rgba(8,18,36,0.96)",
    cardHover:   "rgba(8,20,40,0.98)",
    accent:      "#38bdf8",
    acDim:       "rgba(56,189,248,0.10)",
    acBorder:    "rgba(56,189,248,0.18)",
    gold:        "#fbbf24",
    goDim:       "rgba(251,191,36,0.08)",
    goBorder:    "rgba(251,191,36,0.20)",
    text:        "#e2f4ff",
    textSub:     "#b8d4e8",
    mut:         "#475569",
    bord:        "rgba(148,163,184,0.08)",
    bordHover:   "rgba(56,189,248,0.15)",
    red:         "#f87171",
    green:       "#4ade80",
    grDim:       "rgba(74,222,128,0.08)",
    sky:         "#0c4a6e",
    deep:        "#060d1c",
    warm:        "#fbbf24",
    terracotta:  "#fb923c",
    gradBg:      "linear-gradient(160deg, #030c18 0%, #060f1e 60%, #040a14 100%)",
    gradCard:    "linear-gradient(160deg, rgba(6,15,30,0.95), rgba(4,12,26,0.98))",
    glassBlur:   "blur(16px) saturate(1.6)",
    isNight:     true,
  } : {
    // ── DAY ── Adriatic azure, sun-drenched
    bg:          "#041220",
    surface:     "#0a1c33",
    card:        "rgba(10,22,44,0.90)",
    cardHover:   "rgba(12,26,50,0.94)",
    accent:      "#0ea5e9",
    acDim:       "rgba(14,165,233,0.10)",
    acBorder:    "rgba(14,165,233,0.22)",
    gold:        "#f59e0b",
    goDim:       "rgba(245,158,11,0.08)",
    goBorder:    "rgba(245,158,11,0.22)",
    text:        "#f0f9ff",
    textSub:     "#93c5fd",
    mut:         "#4d7fa0",
    bord:        "rgba(14,165,233,0.07)",
    bordHover:   "rgba(14,165,233,0.20)",
    red:         "#f87171",
    green:       "#4ade80",
    grDim:       "rgba(74,222,128,0.08)",
    sky:         "#0c4a6e",
    deep:        "#071526",
    warm:        "#f59e0b",
    terracotta:  "#f97316",
    gradBg:      "linear-gradient(160deg, #071526 0%, #0a1c33 55%, #091824 100%)",
    gradCard:    "linear-gradient(160deg, rgba(10,22,42,0.92), rgba(7,16,30,0.96))",
    glassBlur:   "blur(14px) saturate(1.5)",
    isNight:     false,
  };
};

// ─── GLOBAL CSS STRING ────────────────────────────────────────
// Injected once into the DOM via <style> in App.jsx main return.
export const GLOBAL_CSS = `
  /* ── Reset & base ── */
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent !important; }
  html { overscroll-behavior: none; }
  body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; margin: 0; }
  * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

  /* ── Touch targets ── */
  button, a, [role="button"], input, select, textarea, label { touch-action: manipulation; }
  input, select, textarea {
    font-size: 16px !important;   /* prevents iOS Safari zoom-on-focus */
    -webkit-appearance: none; appearance: none; /* removes native iOS/Samsung styling glitches */
    max-width: 100%;              /* prevents horizontal overflow on Samsung narrow screens */
  }
  @media (max-width: 480px) { button { min-height: 44px; } }
  @media (min-width: 768px) and (max-width: 1366px) and (hover: none) { button { min-height: 48px; } }

  /* ── Backdrop-filter fallback for Samsung Internet < 16 ── */
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass      { background: rgba(8,18,36,0.97) !important; }
    .fixed-bottom { background: rgba(5,14,30,0.99) !important; }
    .sticky-blur { background: rgba(8,18,36,0.97) !important; }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.18); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.36); }
  [style*="overflow-y: auto"], [style*="overflow-y:auto"] { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }

  /* ── Text selection ── */
  ::selection { background: rgba(14,165,233,0.28); color: #f0f9ff; }

  /* ── Keyframes ── */
  @keyframes fadeUp    { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn   { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }
  @keyframes slideUp   { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer   { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes gradShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
  @keyframes waveMov   { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  @keyframes ticker    { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes spinSlow  { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
  @keyframes pulseGlow { 0%,100% { box-shadow:0 0 18px rgba(14,165,233,0.12); } 50% { box-shadow:0 0 36px rgba(14,165,233,0.28); } }
  @keyframes pulse     { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @keyframes tickerFade { from { opacity:0; transform:translateX(7px); } to { opacity:1; transform:translateX(0); } }
  @keyframes checkPop  { 0% { transform:scale(0) rotate(-10deg); } 60% { transform:scale(1.15) rotate(2deg); } 100% { transform:scale(1) rotate(0); } }
  @keyframes borderFlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* ── Ambient atmosphere ── */
  .jadran-ambient {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 70% 50% at 15% 8%,  rgba(14,165,233,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 85% 85%, rgba(14,165,233,0.04) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 50% 50%, rgba(6,182,212,0.025) 0%, transparent 70%);
  }
  .jadran-ambient::before {
    content:''; position:absolute; bottom:0; left:0; right:0; height:280px;
    background: linear-gradient(to top, rgba(7,21,38,0.97), transparent);
  }
  .jadran-ambient::after {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, transparent 0%, rgba(14,165,233,0.6) 40%, rgba(56,189,248,0.4) 60%, transparent 100%);
    background-size: 200% 100%;
    animation: gradShift 10s ease infinite;
  }

  /* ── Wave decoration ── */
  .wave-deco {
    position:fixed; bottom:-2px; left:0; width:200%; height:48px; opacity:0.025; pointer-events:none; z-index:1;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 48'%3E%3Cpath fill='%230ea5e9' d='M0,24 C360,48 720,0 1080,24 C1260,36 1350,12 1440,24 L1440,48 L0,48 Z'/%3E%3C/svg%3E") repeat-x;
    animation: waveMov 14s linear infinite;
  }

  /* ── Film grain ── */
  .grain {
    position:fixed; inset:0; opacity:0.016; pointer-events:none; z-index:1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  /* ── Glass card ── */
  .glass {
    backdrop-filter: blur(14px) saturate(1.5);
    -webkit-backdrop-filter: blur(14px) saturate(1.5);
    transition: transform 0.32s cubic-bezier(0.4,0,0.2,1),
                box-shadow 0.32s cubic-bezier(0.4,0,0.2,1),
                border-color 0.32s cubic-bezier(0.4,0,0.2,1) !important;
  }
  @media (hover: hover) {
    .glass:hover {
      transform: translateY(-2px) scale(1.005);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 20px 50px rgba(0,0,0,0.26), 0 0 0 1px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,0.08) !important;
    }
  }

  /* ── Animated card entrance ── */
  .anim-card { animation: fadeUp 0.38s cubic-bezier(0.4,0,0.2,1) both; }

  /* ── Buttons — Apple haptic feel ── */
  button { 
    transition: all 0.22s cubic-bezier(0.4,0,0.2,1) !important; 
    -webkit-user-select: none; user-select: none;
  }
  @media (hover: hover) { button:hover { transform: translateY(-1px); } }
  button:active { transform: translateY(0) scale(0.95) !important; opacity: 0.88 !important; }
  a:active { opacity: 0.7; }

  /* ── Interactive card press — Apple spring ── */
  .glass:active { transform: scale(0.975) !important; transition-duration: 0.08s !important; }

  /* ── GPU acceleration for cards with backdrop-filter ── */
  .glass { -webkit-transform: translateZ(0); transform: translateZ(0); }

  /* ── Safe area helpers ── */
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
  .safe-top    { padding-top: env(safe-area-inset-top, 0px); }
  .safe-all    { padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px); }

  /* ── Input focus — blue glow ring ── */
  input:focus, textarea:focus, select:focus {
    outline: none !important;
    border-color: rgba(14,165,233,0.5) !important;
    box-shadow: 0 0 0 3px rgba(14,165,233,0.12), 0 0 20px rgba(14,165,233,0.06) !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
  }

  /* ── Samsung/iOS viewport — address bar & gesture navigation ── */
  /* svh = small viewport height (excludes browser chrome, safest for fixed content) */
  /* dvh = dynamic viewport height (grows/shrinks with address bar — best for full-screen) */
  .dvh       { min-height: 100svh; min-height: 100dvh; }
  .dvh-exact { height: 100svh; height: 100dvh; }
  /* Samsung One UI: allow vertical pan + pinch-zoom through scroll containers */
  .scroll-smooth { touch-action: pan-y pinch-zoom; overscroll-behavior-y: contain; }

  /* ── Prevent iOS rubber-band on fixed containers ── */
  .no-bounce { overscroll-behavior: none; -webkit-overflow-scrolling: auto; }

  /* ── Smooth momentum scroll ── */
  .scroll-smooth {
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain; scroll-behavior: smooth;
  }

  /* ── Sticky elements with blur ── */
  .sticky-blur {
    position: sticky; top: 0; z-index: 10;
    backdrop-filter: blur(20px) saturate(1.8);
    -webkit-backdrop-filter: blur(20px) saturate(1.8);
  }

  /* ── Bottom fixed bar (chat input, tab bar) ── */
  .fixed-bottom {
    position: fixed; bottom: 0; left: 0; right: 0;
    /* min 8px bottom gap on standard Android; adds home-indicator clearance on iOS/Samsung */
    padding-bottom: max(env(safe-area-inset-bottom, 8px), 8px);
    backdrop-filter: blur(24px) saturate(1.8);
    -webkit-backdrop-filter: blur(24px) saturate(1.8);
    z-index: 50;
    transform: translateZ(0); -webkit-transform: translateZ(0);
    will-change: transform;
  }

  /* ── Skeleton pulse (better than shimmer for cards) ── */
  .skeleton {
    background: linear-gradient(90deg, rgba(14,165,233,0.04) 25%, rgba(14,165,233,0.08) 50%, rgba(14,165,233,0.04) 75%);
    background-size: 400% 100%; animation: shimmer 2s ease infinite;
    border-radius: 8px;
  }

  /* ── Tab bar item ── */
  .tab-item {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 0; min-width: 56px; cursor: pointer;
    -webkit-tap-highlight-color: transparent; background: none; border: none;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  }
  .tab-item:active { transform: scale(0.9); }
  .tab-item svg { transition: all 0.2s; }

  /* ── Primary button glow ── */
  .btn-glow { position:relative; overflow:hidden; }
  .btn-glow::after {
    content:''; position:absolute; inset:0; border-radius:inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%);
    pointer-events:none;
  }
  .btn-glow::before {
    content:''; position:absolute; inset:-2px; border-radius:inherit;
    background: linear-gradient(135deg, rgba(14,165,233,0.5), rgba(2,132,199,0.25));
    filter: blur(10px); opacity:0; transition:opacity 0.3s; z-index:-1;
  }
  @media (hover: hover) { .btn-glow:hover::before { opacity:1; } }

  /* ── Overlay ── */
  .overlay-enter { animation: scaleIn 0.28s cubic-bezier(0.4,0,0.2,1); }

  /* ── Shimmer loading skeleton ── */
  .shimmer {
    background: linear-gradient(90deg, transparent 25%, rgba(14,165,233,0.055) 50%, transparent 75%);
    background-size: 200% 100%; animation: shimmer 1.8s ease infinite;
  }

  /* ── Phase dot pulse ── */
  .phase-active { animation: pulseGlow 3s ease infinite; }

  /* ── Premium shimmer badge ── */
  .premium-shimmer {
    background: linear-gradient(90deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.18) 50%, rgba(251,191,36,0.06) 100%);
    background-size: 200% 100%; animation: shimmer 2.8s ease infinite;
  }

  /* ── Floating emoji ── */
  .emoji-float { animation: float 4.5s ease-in-out infinite; display:inline-block; }

  /* ── Page transitions ── */
  .page-enter { animation: slideUp 0.38s cubic-bezier(0.4,0,0.2,1); }

  /* ── Check mark pop ── */
  .check-anim { animation: checkPop 0.45s cubic-bezier(0.4,0,0.2,1); }

  /* ── Spin ── */
  .spin { animation: spinSlow 0.85s linear infinite; }

  /* ── Glowing border (active input, selected card) ── */
  .border-glow {
    border-image: linear-gradient(135deg, rgba(14,165,233,0.7), rgba(56,189,248,0.3), rgba(14,165,233,0.7)) 1;
    animation: borderFlow 4s ease infinite;
    background-size: 200% 200%;
  }

  /* ── Phase nav label sizing ── */
  .phase-label { letter-spacing: 2px; font-size: 10px; }
  @media (max-width: 480px) {
    .phase-label { letter-spacing: 1px !important; font-size: 9px !important; }
    .page-enter { padding: 0 !important; }
    .map-frame { height: 240px !important; }
    .lang-btn { padding: 10px 12px !important; min-width: 44px; min-height: 44px; }
    .route-bar { flex-wrap: wrap; gap: 8px; }
    .route-bar button { flex: 1; min-width: 0; }
    .trip-btn { width: 100% !important; box-sizing: border-box; }
  }
  @media (max-width: 375px) { .phase-label { letter-spacing: 0.5px !important; font-size: 8px !important; } }

  /* ── Tablet (iPad) ── */
  @media (min-width: 768px) and (max-width: 1024px) {
    .fixed-bottom { max-width: 500px; left: 50%; transform: translateX(-50%); border-radius: 20px 20px 0 0; border: 1px solid rgba(14,165,233,0.07); border-bottom: none; }
  }

  /* ── Desktop — hide mobile tab bar ── */
  @media (min-width: 1025px) {
    .fixed-bottom { max-width: 440px; left: 50%; transform: translateX(-50%); border-radius: 20px 20px 0 0; border: 1px solid rgba(14,165,233,0.07); border-bottom: none; box-shadow: 0 -4px 30px rgba(0,0,0,0.15); }
  }

  /* ── Samsung-specific: address bar compensation ── */
  @supports (height: 1dvh) and (not (height: 1svh)) {
    .dvh { min-height: 100dvh; }
  }

  /* ── iOS standalone (PWA) ── */
  @media all and (display-mode: standalone) {
    .safe-top { padding-top: max(env(safe-area-inset-top, 0px), 20px); }
  }
`;

// ─── SVG ICON PATHS (24×24 Feather-style) ────────────────────
export const IC = {
  plane:     "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
  home:      "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z M9 21V14h6v7",
  sparkle:   "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z",
  parking:   "M5 21V5a2 2 0 0 1 2-2h5a5 5 0 0 1 0 10H7",
  beach:     "M17.5 21H6.5 M5 21l4.5-9h5l4.5 9 M12 3v9 M7.5 7h9",
  sun:       "M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41",
  map:       "M3 7l6-3l6 3l6-3v13l-6 3l-6-3l-6 3Z M9 4v13 M15 7v13",
  food:      "M3 2v7a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V2 M7 2v20 M21 15V2c-2.8 0-5 2.2-5 5v6h5",
  shop:      "M3 3h18l-2 13H5Z M1 7h22 M16 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  bakery:    "M12 6C8 6 5 8 5 11c0 2 1.5 4 4 5v5h6v-5c2.5-1 4-3 4-5 0-3-3-5-7-5Z M9 3h6 M12 3v3",
  medic:     "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 9v6 M9 12h6",
  gem:       "M6 3h12l4 6l-10 12L2 9Z M2 9h20",
  bot:       "M12 8V4H8 M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 16h0 M15 16h0",
  check:     "M20 6L9 17l-5-5",
  palace:    "M3 21h18 M5 21V10l7-7l7 7v11 M9 21v-5h6v5 M9 10h0 M15 10h0 M3 10h18 M7 7V4 M17 7V4",
  arena:     "M4 21c0-6 3.6-10.8 8-10.8S20 15 20 21 M6 21c0-4 2.7-7.2 6-7.2s6 3.2 6 7.2 M2 21h20 M8 10.5V8 M16 10.5V8 M12 10.2V7 M10 11V9 M14 11V9",
  church:    "M12 2v4 M10 4h4 M8 21V10l4-4l4 4v11 M8 10h8 M3 21h18 M10 16h4 M12 13v3",
  anchor:    "M12 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z M12 8v13 M5 21a7 7 0 0 1 7-7a7 7 0 0 1 7 7 M8 12H5 M19 12h-3",
  walls:     "M3 21V6l4-3l4 3l4-3l4 3l2 0v15 M3 6h18 M7 6v15 M11 6v15 M15 6v15",
  island:    "M2 20c2-3 5-5 10-5s8 2 10 5 M7 15V9l3-4l3 4v6 M12 5V3 M10 5h4",
  star:      "M12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01Z",
  ticket:    "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z M13 5v2 M13 17v2 M13 11v2",
  search:    "M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z",
};

// ─── SVG RENDERER ─────────────────────────────────────────────
export const Icon = ({ d, size = 24, color = "currentColor", stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
  </svg>
);

// ─── CITY LANDMARK ICONS ──────────────────────────────────────
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
  const C = useC();
  const city = CITY_ICON_MAP[name];
  if (!city) return null;
  return (
    <div style={{ width: size + 10, height: size + 10, borderRadius: 12,
      background: city.clr + "12", display: "grid", placeItems: "center",
      border: `1px solid ${city.clr}1e`, flexShrink: 0 }}>
      <Icon d={city.ic} size={size} color={city.clr} stroke={1.5} />
    </div>
  );
};

// ─── PRIMITIVE COMPONENTS ─────────────────────────────────────

export const Badge = ({ c = "accent", children }) => {
  const C = useC();
  const map = {
    accent: { bg: C.acDim,  color: C.accent, bord: C.acBorder },
    gold:   { bg: C.goDim,  color: C.gold,   bord: C.goBorder },
    green:  { bg: C.grDim,  color: C.green,  bord: "rgba(74,222,128,0.18)" },
    red:    { bg: "rgba(248,113,113,0.08)", color: C.red, bord: "rgba(248,113,113,0.18)" },
  };
  const s = map[c] || map.accent;
  return (
    <span style={{ ...dm, display:"inline-block", padding:"3px 9px", borderRadius:50,
      fontSize:9, letterSpacing:1.2, fontWeight:700, textTransform:"uppercase",
      background: s.bg, color: s.color, border: `1px solid ${s.bord}` }}>
      {children}
    </span>
  );
};

export const Btn = ({ primary, warm: warmBtn, small, children, ...p }) => {
  const C = useC();
  const isPrimary = primary || warmBtn;
  return (
    <button {...p} className={`${isPrimary ? "btn-glow" : ""} ${p.className || ""}`} style={{
      padding: small ? "10px 22px" : "14px 32px",
      minHeight: small ? 40 : 48,
      background: warmBtn
        ? `linear-gradient(145deg, ${C.terracotta} 0%, #ea6c10 60%, #c2550a 100%)`
        : isPrimary
          ? `linear-gradient(145deg, ${C.accent} 0%, #0284c7 60%, #0369a1 100%)`
          : "rgba(14,165,233,0.04)",
      border: isPrimary ? "none" : `1px solid ${C.bord}`,
      borderRadius: isPrimary ? 50 : 14, color: isPrimary ? "#fff" : C.text,
      fontSize: small ? 13 : 16, ...hf,
      cursor: "pointer", fontWeight: isPrimary ? 500 : 400,
      letterSpacing: isPrimary ? 0.4 : 0,
      boxShadow: warmBtn
        ? `0 1px 2px rgba(0,0,0,0.14), 0 4px 20px rgba(251,146,60,0.35), 0 8px 24px rgba(251,146,60,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`
        : isPrimary
          ? `0 1px 2px rgba(0,0,0,0.12), 0 4px 20px rgba(14,165,233,0.28), 0 8px 24px rgba(14,165,233,0.12), inset 0 1px 0 rgba(255,255,255,0.2)`
          : "none",
      transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
      WebkitTapHighlightColor: "transparent",
      ...(p.style || {}),
    }}>
      {children}
    </button>
  );
};

export const Card = ({ children, glow, warm: isWarm, style: sx, ...p }) => {
  const C = useC();
  return (
    <div {...p} className={`glass anim-card ${p.className || ""}`} style={{
      background: isWarm
        ? "linear-gradient(160deg, rgba(10,20,38,0.9), rgba(22,14,8,0.85))"
        : C.card,
      borderRadius: 22,
      padding: 22,
      border: `1px solid ${isWarm ? C.goBorder : glow ? C.acBorder : C.bord}`,
      boxShadow: glow
        ? `0 1px 3px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.24), 0 0 0 1px rgba(14,165,233,0.08), inset 0 1px 0 rgba(255,255,255,0.08)`
        : `0 1px 2px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.18), 0 16px 40px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06)`,
      ...sx,
    }}>
      {children}
    </div>
  );
};

export const SectionLabel = ({ children, extra }) => {
  const C = useC();
  return (
    <div style={{ ...dm, fontSize: 9, color: C.mut, letterSpacing: 4,
      textTransform: "uppercase", marginBottom: 16, fontWeight: 700,
      display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 3, height: 3, borderRadius: "50%",
        background: C.accent, flexShrink: 0, opacity: 0.7 }} />
      {children}
      {extra && <span style={{ marginLeft: 4, color: C.accent, fontWeight: 700, letterSpacing: 1 }}>{extra}</span>}
    </div>
  );
};

export const BackBtn = ({ onClick, label }) => {
  const C = useC();
  return (
    <button onClick={onClick} style={{ ...dm, background: `rgba(56,189,248,0.07)`, border: `1px solid ${C.acBorder}`,
      borderRadius: 20, color: C.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 16px 8px 12px",
      display: "flex", alignItems: "center", gap: 5, opacity: 0.92,
      transition: "all 0.2s", minHeight: 36, WebkitTapHighlightColor: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = `rgba(56,189,248,0.13)`; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.background = `rgba(56,189,248,0.07)`; }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      {label || "Natrag"}
    </button>
  );
};

// ─── BOTTOM TAB BAR (Apple-style kiosk navigation) ────────
export const TabBar = ({ items, active, onChange }) => {
  const C = useC();
  return (
    <div className="fixed-bottom" style={{
      display: "flex", justifyContent: "space-around", alignItems: "center",
      background: `linear-gradient(180deg, ${C.bg}dd 0%, ${C.bg}f5 100%)`,
      borderTop: `1px solid ${C.bord}`,
      paddingTop: 6, paddingLeft: 8, paddingRight: 8,
    }}>
      {items.map(item => {
        const isActive = item.key === active;
        return (
          <button key={item.key} className="tab-item" onClick={() => onChange(item.key)}
            style={{ color: isActive ? C.accent : C.mut }}>
            <div style={{
              width: 28, height: 28, display: "grid", placeItems: "center",
              borderRadius: 10,
              background: isActive ? C.acDim : "transparent",
              boxShadow: isActive ? `0 0 12px rgba(14,165,233,0.15)` : "none",
              transition: "background 0.25s",
            }}>
              <Icon d={item.icon} size={20} color={isActive ? C.accent : C.mut} stroke={isActive ? 2 : 1.5} />
            </div>
            <span style={{ ...dm, fontSize: 10, fontWeight: isActive ? 700 : 400,
              letterSpacing: 0.3, transition: "all 0.2s" }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
