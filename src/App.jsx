import React, { useState, useEffect, useRef } from "react";
import PartnerPortal from "./PartnerPortal";
import { DealCards } from "./DealCards";
import RestaurantFinder from "./RestaurantFinder";
import RabCard from "./RabCard";
import BeachStatus from "./BeachStatus";
import OPGDirectory from "./OPGDirectory";
import WellnessRoutes from "./WellnessRoutes";
import { loadGuest, updateGuest, getRoomCode } from "./guestStore";
import GuestOnboarding from "./GuestOnboarding";
import { loadDelta, saveDelta } from "./deltaContext";
import { startGPS } from "./gpsEngine";

// ─── PARTNER / AFFILIATE DATA ─────────────────────────────────
import {
  AFFILIATE_TOKENS, AFFILIATE_COORDS, AFFILIATE_DATA,
} from "./affiliates";

// ─── DATA LAYER ───────────────────────────────────────────────
import {
  CITY_COORDS, COUNTRY_CITY, getDestRegion, GUEST_FALLBACK,
  W_DEFAULT, FORECAST_DAYS, FORECAST_DEFAULT, PRACTICAL,
  GEMS, EXPERIENCES, ACCOMMODATION, BUNDLES, LOYALTY, VIATOR_FALLBACK,
  INTEREST_LABELS, INTERESTS, LANGS, t,
  GYG, VIA, BKG, navigateTo,
  ALERT_ICONS, ALERT_COLORS, SEG_ICON, NEARBY_CATS,
} from "./data";

// ─── DESIGN SYSTEM ────────────────────────────────────────────
import {
  FONT_LINK, dm, hf, makeTheme, GLOBAL_CSS,
  ThemeProvider,
  Badge, Btn, Card, SectionLabel, BackBtn, TabBar,
  IC, Icon, CITY_ICON_MAP, CityIcon,
} from "./ui";

const HERE_ROUTING_KEY = import.meta.env.VITE_HERE_API_KEY || "";
const captureErr = e => { try { window.Sentry?.captureException(e instanceof Error ? e : new Error(String(e))); } catch {} };

const TransitMap = React.memo(({ fromCoords, toCoords, transportMode, onRouteReady, gpsPosition }) => {
  const iframeRef = useRef(null);
  const routeFetched = useRef(false);

  // Send GPS position to iframe via postMessage
  useEffect(() => {
    if (!gpsPosition || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: "gps_update", lat: gpsPosition.lat, lng: gpsPosition.lng
    }, "*");
  }, [gpsPosition?.lat, gpsPosition?.lng]);

  // Fetch route summary via REST (not SDK — avoids race condition)
  useEffect(() => {
    if (!fromCoords || !toCoords || routeFetched.current) return;
    routeFetched.current = true;
    const mode = transportMode === "kamper" ? "truck" : "car";
    fetch(`https://router.hereapi.com/v8/routes?transportMode=${mode}&origin=${fromCoords[0]},${fromCoords[1]}&destination=${toCoords[0]},${toCoords[1]}&return=summary&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(data => {
        const sections = data.routes?.[0]?.sections;
        if (sections?.length && onRouteReady) {
          const totalLength = sections.reduce((sum, s) => sum + (s.summary?.length || 0), 0);
          const totalDuration = sections.reduce((sum, s) => sum + (s.summary?.duration || 0), 0);
          const totalMin = Math.round(totalDuration / 60);
          onRouteReady({
            km: Math.round(totalLength / 1000), hrs: Math.floor(totalMin / 60),
            mins: totalMin % 60,
            oLat: fromCoords[0], oLng: fromCoords[1], dLat: toCoords[0], dLng: toCoords[1],
            mode: transportMode || "auto",
          });
        }
      })
      .catch(() => {
        // Haversine fallback
        const R = 6371;
        const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
        const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(fromCoords[0]*Math.PI/180)*Math.cos(toCoords[0]*Math.PI/180)*Math.sin(dLon/2)**2;
        const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.35);
        const min = Math.round(km / 1.2);
        if (onRouteReady) onRouteReady({
          km, hrs: Math.floor(min/60), mins: min%60, mode: transportMode || "auto",
          oLat: fromCoords[0], oLng: fromCoords[1], dLat: toCoords[0], dLng: toCoords[1], estimated: true,
        });
      });
  }, [fromCoords?.[0], toCoords?.[0]]); // eslint-disable-line

  const tmode = transportMode === "kamper" ? "truck" : "car";
  const src = fromCoords && toCoords
    ? `/map.html?flat=${fromCoords[0]}&flon=${fromCoords[1]}&tlat=${toCoords[0]}&tlon=${toCoords[1]}&tmode=${tmode}`
    : null;

  if (!src) return <div style={{ width: "100%", height: 300, background: "#0c1426", borderRadius: 14, display: "grid", placeItems: "center" }}><span style={{ fontSize: 13, color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>Učitavam mapu…</span></div>;

  return (
    <iframe ref={iframeRef} src={src} className="map-frame"
      style={{ width: "100%", height: 300, border: "none", display: "block" }}
      allow="webgl; fullscreen" title="here-route"
      onLoad={() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: "map_init", key: HERE_ROUTING_KEY },
            window.location.origin
          );
        }
      }}
    />
  );
});

// ─── HERE Traffic Incidents along a route corridor ───

// ─── RouteGuide: Live Intelligence Feed ───
// Polls /api/guide every 3min, displays prioritized cards from all data sources
// ─── LiveTicker: Single line above map with rotating live data ───
const LiveTicker = React.memo(({ fromCoords, toCoords, seg, lang, routeData, dm, C }) => {
  const [guideCards, setGuideCards] = React.useState([]);
  const [guideSources, setGuideSources] = React.useState(null);
  const [idx, setIdx] = React.useState(0);

  // Fetch guide data (non-blocking — ticker works without it)
  React.useEffect(() => {
    if (!fromCoords || !toCoords) return;
    let cancelled = false;
    const load = () => {
      fetch(`/api/guide?oLat=${fromCoords[0]}&oLng=${fromCoords[1]}&dLat=${toCoords[0]}&dLng=${toCoords[1]}&seg=${seg || "auto"}&lang=${lang || "hr"}`)
        .then(r => r.json())
        .then(data => { if (!cancelled) { setGuideCards(data.cards || []); setGuideSources(data.sources || null); } })
        .catch(captureErr);
    };
    load();
    const iv = setInterval(load, 60000); // 1 min — fresh data
    return () => { cancelled = true; clearInterval(iv); };
  }, [fromCoords?.[0], toCoords?.[0], seg]); // eslint-disable-line

  // Build ticker items from route + guide
  const items = React.useMemo(() => {
    const t = [];
    for (const c of guideCards) {
      if (c.severity === "critical") t.push({ icon: c.icon, text: `${c.title} — ${c.body?.slice(0,80)||""}`, color: "#ef4444" });
    }
    for (const c of guideCards) {
      if (c.severity === "warning") t.push({ icon: c.icon, text: `${c.title} — ${c.body?.slice(0,80)||""}`, color: "#f59e0b" });
    }
    for (const c of guideCards) {
      if (c.severity === "info") t.push({ icon: c.icon, text: c.body?.slice(0, 100) || c.title, color: C.mut });
    }
    for (const c of guideCards) {
      if (c.severity === "tip") t.push({ icon: c.icon, text: c.body?.slice(0, 100) || c.title, color: "rgba(100,116,139,0.6)" });
    }
    if (guideSources) {
      const s = guideSources;
      const srcs = [`HERE:${s.here||0}`, s.hak > 0 ? `HAK:${s.hak}` : null, s.dars > 0 ? `DARS:${s.dars}` : null, `Wx:${s.meteo?1:0}`].filter(Boolean).join(" · ");
      t.push({ icon: "📡", text: srcs, color: "rgba(100,116,139,0.35)" });
    }
    return t.length ? t : [{ icon: "⏳", text: routeData ? "Prikupljam live podatke…" : "Izračunavam rutu…", color: C.mut }];
  }, [routeData, guideCards, guideSources]); // eslint-disable-line

  // Rotate — 2.5s per card for a live feel
  React.useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 2500);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx % items.length];
  return (
    <div style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8, minHeight: 24, overflow: "hidden" }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{current.icon}</span>
      <span style={{ ...dm, fontSize: 12, color: current.color || C.mut, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: current.color === "#ef4444" ? 700 : 400 }}>
        {current.text}
      </span>
      {items.length > 1 && <span style={{ ...dm, fontSize: 9, color: "rgba(100,116,139,0.3)", flexShrink: 0 }}>{idx % items.length + 1}/{items.length}</span>}
    </div>
  );
});

const RouteGuide = React.memo(({ fromCoords, toCoords, seg, lang, dm, C, extraCards }) => {
  const [cards, setCards] = React.useState(null);
  const [sources, setSources] = React.useState(null);
  const [updated, setUpdated] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Merge API cards + GPS cards, deduplicate by id, sort by severity
  const SEV_ORDER = { critical: 0, warning: 1, info: 2, tip: 3 };
  const mergedCards = React.useMemo(() => {
    const api = cards || [];
    const gps = extraCards || [];
    const all = [...gps, ...api];
    const seen = new Set();
    return all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
      .sort((a, b) => {
        // AI cards always first
        if (a.isAI && !b.isAI) return -1;
        if (!a.isAI && b.isAI) return 1;
        return (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
      });
  }, [cards, extraCards]);

  const fetchGuide = React.useCallback(() => {
    if (!fromCoords || !toCoords) return;
    setLoading(true);
    fetch(`/api/guide?oLat=${fromCoords[0]}&oLng=${fromCoords[1]}&dLat=${toCoords[0]}&dLng=${toCoords[1]}&seg=${seg}&lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        setCards(data.cards || []);
        setSources(data.sources || null);
        setUpdated(data.updated);
      })
      .catch(() => { setCards([]); })
      .finally(() => setLoading(false));
  }, [fromCoords?.[0], fromCoords?.[1], toCoords?.[0], toCoords?.[1], seg, lang]); // eslint-disable-line

  React.useEffect(() => {
    fetchGuide();
    const iv = setInterval(fetchGuide, 60000); // 1 min — fresh
    return () => clearInterval(iv);
  }, [fetchGuide]);

  const SEV_COLOR = { critical: "#ef4444", warning: "#f59e0b", info: "#0ea5e9", tip: "#22c55e" };
  const SEV_BG = { critical: "rgba(239,68,68,0.06)", warning: "rgba(245,158,11,0.06)", info: "rgba(14,165,233,0.04)", tip: "rgba(34,197,94,0.04)" };
  const SEV_BORDER = { critical: "rgba(239,68,68,0.2)", warning: "rgba(245,158,11,0.2)", info: "rgba(14,165,233,0.12)", tip: "rgba(34,197,94,0.12)" };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ ...dm, fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cards && cards.some(c => c.severity === "critical") ? "#ef4444" : "#22c55e", display: "inline-block", animation: loading ? "pulse 1.5s infinite" : "none" }} />
          PULS JADRANA
        </div>
        <button onClick={fetchGuide} disabled={loading}
          style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.bord}`, background: "transparent", color: loading ? C.mut : C.accent, fontSize: 11, cursor: loading ? "default" : "pointer", ...dm }}>
          {loading ? "⏳" : "↻"}
        </button>
      </div>

      {/* Cards */}
      {cards === null && mergedCards.length === 0 && (
        <div style={{ ...dm, fontSize: 13, color: C.mut, padding: "20px 0", textAlign: "center" }}>
          Prikupljam live podatke…
        </div>
      )}
      {cards !== null && mergedCards.length === 0 && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", ...dm, fontSize: 13, color: "#22c55e" }}>
          ✅ Sve čisto — bez incidenata na ruti
        </div>
      )}
      {mergedCards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mergedCards.map((card, i) => (
            <div key={card.id || i}
              style={{
                padding: card.isAI ? "14px 16px" : "12px 14px", borderRadius: 14,
                background: card.isAI ? "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(139,92,246,0.06))" : (SEV_BG[card.severity] || SEV_BG.info),
                border: card.isAI ? "1px solid rgba(139,92,246,0.2)" : `1px solid ${SEV_BORDER[card.severity] || SEV_BORDER.info}`,
                animation: i === 0 && card.severity === "critical" ? "pulse 2s infinite" : card.isAI ? "fadeIn 0.5s both" : "none",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ ...dm, fontSize: 13, fontWeight: 700, color: card.isAI ? "#a78bfa" : (SEV_COLOR[card.severity] || C.text) }}>
                  {card.icon} {card.title}
                </div>
                <span style={{ ...dm, fontSize: 9, color: C.mut, whiteSpace: "nowrap", marginLeft: 8 }}>{card.source}</span>
              </div>
              <div style={{ ...dm, fontSize: card.isAI ? 13 : 12, color: card.isAI ? C.text : C.mut, marginTop: 4, lineHeight: 1.6 }}>
                {card.body}
              </div>
              {card.ts && <div style={{ ...dm, fontSize: 9, color: "rgba(100,116,139,0.35)", marginTop: 4 }}>{(() => { const s = Math.floor((Date.now() - new Date(card.ts).getTime()) / 1000); return s < 60 ? "upravo" : s < 3600 ? `prije ${Math.floor(s/60)} min` : s < 86400 ? `prije ${Math.floor(s/3600)}h` : ""; })()}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Source indicator */}
      {(sources || extraCards?.length > 0) && (
        <div style={{ ...dm, fontSize: 10, color: "rgba(100,116,139,0.4)", marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sources && <><span>HERE:{sources.here || 0}</span>{sources.hak > 0 && <span>HAK:{sources.hak}</span>}{sources.dars > 0 && <span>DARS:{sources.dars}</span>}<span>Wx:{sources.meteo ? "✓" : "–"}</span></>}
          {extraCards?.length > 0 && <span>GPS:{extraCards.length}</span>}
          {updated && <span style={{ marginLeft: "auto" }}>{new Date(updated).toLocaleTimeString("hr", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════


/* ─── ALERT TICKER — pure CSS scroll, no JS state during animation ─── */
const AlertTicker = React.memo(function AlertTicker({ items }) {
  if (!items.length) return null;
  const isCritical = items.some(i => i.sev === "critical");
  const borderColor = isCritical ? "rgba(239,68,66,0.3)" : "rgba(245,158,11,0.25)";
  const bgColor     = isCritical ? "rgba(239,68,66,0.06)" : "rgba(245,158,11,0.05)";
  const dotColor    = isCritical ? "#ef4444" : "#f59e0b";
  const full = items.map(i => `${i.icon}  ${i.text}`).join("     ·     ");
  const duration = Math.max(18, full.length * 0.13);
  return (
    <div style={{ marginBottom:12, borderRadius:10, background:bgColor, border:`1px solid ${borderColor}`,
      overflow:"hidden", contain:"layout paint", display:"flex", alignItems:"center", height:40 }}>
      <div style={{ flexShrink:0, width:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:6, height:6, borderRadius:"50%", background:dotColor, animation:"pulse 2s infinite" }} />
      </div>
      <div style={{ flex:1, overflow:"hidden", height:"100%", display:"flex", alignItems:"center" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:`ticker ${duration}s linear infinite`, willChange:"transform" }}>
          <span style={{ paddingRight:80, fontSize:13, color:"#e2e8f0", fontFamily:"'Outfit',sans-serif" }}>{full}</span>
          <span style={{ paddingRight:80, fontSize:13, color:"#e2e8f0", fontFamily:"'Outfit',sans-serif" }}>{full}</span>
        </div>
      </div>
    </div>
  );
});

/* ─── PARTNER STATS DASHBOARD COMPONENT ─── */
function PartnerStatsDashboard({ partner, pin }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const aff = AFFILIATE_DATA[partner] || {};

  React.useEffect(() => {
    fetch(`/api/partner-stats?partner=${encodeURIComponent(partner)}&pin=${encodeURIComponent(pin || "")}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [partner, pin]);

  const dm = { fontFamily: "'DM Sans', 'Outfit', sans-serif" };
  const C = { bg: "#0c1a2e", card: "#0f2035", accent: "#0ea5e9", mut: "#64748b", text: "#e2f0ff" };

  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const langFlags = { hr:"🇭🇷", de:"🇩🇪", at:"🇦🇹", en:"🇬🇧", it:"🇮🇹", si:"🇸🇮", cz:"🇨🇿", pl:"🇵🇱" };

  return (
    <div style={{ background: C.bg, minHeight: "100dvh", color: C.text, ...dm, padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0c1a2e,#0d2744)", padding: "24px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 11, color: C.mut, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Partner Analytics</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{aff.emoji || "🏪"}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{aff.name || partner}</div>
            <div style={{ fontSize: 12, color: C.mut }}>{aff.city || ""} · jadran.ai</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: C.mut }}>Učitavam podatke…</div>
        )}

        {!loading && !data?.ok && (
          <div style={{ background: "#1e0a0a", border: "1px solid #7f1d1d", borderRadius: 12, padding: 16, color: "#fca5a5", fontSize: 13 }}>
            Greška pri učitavanju podataka. Provjeri API ključ.
          </div>
        )}

        {!loading && data?.ok && (
          <>
            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Ukupno pregleda", value: data.totalViews ?? 0, icon: "👁️" },
                { label: "Zadnjih 7 dana",  value: data.views7d  ?? 0, icon: "📅" },
                { label: "Zadnjih 30 dana", value: data.views30d ?? 0, icon: "📊" },
              ].map(k => (
                <div key={k.label} style={{ background: C.card, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 20 }}>{k.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, marginTop: 4 }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Feedback KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: C.card, borderRadius: 12, padding: "14px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: C.mut, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Prosj. ocjena</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 22, color: "#f59e0b" }}>★</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b" }}>{data.avgRating ?? "–"}</span>
                </div>
                <div style={{ fontSize: 11, color: C.mut, marginTop: 4 }}>{data.feedbackCount} feedback zapisa</div>
              </div>
              <div style={{ background: C.card, borderRadius: 12, padding: "14px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: C.mut, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Jezici gostiju</div>
                {Object.entries(data.byLang || {}).sort((a,b) => b[1]-a[1]).slice(0,4).map(([lang, cnt]) => (
                  <div key={lang} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13 }}>{langFlags[lang] || "🌐"} {lang.toUpperCase()}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.accent }}>{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 7 days chart */}
            {data.byDay && (
              <div style={{ background: C.card, borderRadius: 12, padding: "14px 14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.mut, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Pregledi — zadnjih 7 dana</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                  {Object.entries(data.byDay).map(([day, cnt]) => {
                    const maxVal = Math.max(...Object.values(data.byDay), 1);
                    const pct = (cnt / maxVal) * 100;
                    return (
                      <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 10, color: C.accent, fontWeight: 600 }}>{cnt > 0 ? cnt : ""}</div>
                        <div style={{ width: "100%", background: cnt > 0 ? C.accent : "rgba(255,255,255,0.06)", borderRadius: "4px 4px 0 0", height: `${Math.max(pct, 4)}%`, minHeight: 4, transition: "height 0.3s" }} />
                        <div style={{ fontSize: 9, color: C.mut }}>{day}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent feedback */}
            {data.recentFeedback?.length > 0 && (
              <div style={{ background: C.card, borderRadius: 12, padding: "14px 14px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: C.mut, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Nedavni feedback</div>
                {data.recentFeedback.map((fb, i) => (
                  <div key={i} style={{ borderBottom: i < data.recentFeedback.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingBottom: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ color: "#f59e0b", fontSize: 12 }}>{"★".repeat(fb.rating)}{"☆".repeat(5-fb.rating)}</span>
                      <span style={{ fontSize: 10, color: C.mut }}>{langFlags[fb.lang] || "🌐"} · {new Date(fb.ts).toLocaleDateString()}</span>
                    </div>
                    {fb.comment && <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>"{fb.comment}"</div>}
                  </div>
                ))}
              </div>
            )}

            {data.feedbackCount === 0 && data.totalViews === 0 && (
              <div style={{ background: C.card, borderRadius: 12, padding: 24, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>Dashboard spreman!</div>
                <div style={{ fontSize: 13, color: C.mut, lineHeight: 1.6 }}>
                  Podaci se pojavljuju čim korisnici skeniraju QR kod.<br/>
                  Dijelite <strong style={{ color: C.accent }}>jadran.ai/bj-qr.html</strong> ili printajte QR karticu.
                </div>
                <div style={{ marginTop: 14, padding: "10px 16px", background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 10, fontSize: 11, color: C.mut }}>
                  Testirajte sami: posjetite <span style={{ color: C.accent }}>jadran.ai/?kiosk=rab&affiliate=blackjack&tk=sial2026</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── COMPONENT ─── */
export default function JadranUnified() {
  // Partner portal route
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/partner")) {
    return <PartnerPortal />;
  }

  // mounted
  const [lang, setLang] = useState("hr");
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const [phase, setPhase] = useState("pre"); // overridden by loadGuest on mount
  const [subScreen, setSubScreen] = useState("onboard"); // varies per phase
  const [premium, setPremium] = useState(() => {
    try {
      // Check plan expiry first — auto-clears expired paid plans
      const exp = Number(localStorage.getItem("jadran_premium_exp") || "0");
      if (exp > 0 && exp < Date.now()) {
        localStorage.removeItem("jadran_ai_premium");
        localStorage.removeItem("jadran_premium_exp");
        return false;
      }
      if (localStorage.getItem("jadran_ai_premium") === "1") return true;
      // Restore active trial across page reloads
      const until = Number(localStorage.getItem("jadran_ai_trial_until") || "0");
      return until > Date.now();
    } catch { return false; }
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState(null);       // deferred beforeinstallprompt event
  const [pwaInstalled, setPwaInstalled] = useState(false); // hide button after install
  const [selectedPlan, setSelectedPlan] = useState("season"); // default to mid-tier (decoy effect)
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState(null); // null | "loading" | "success" | "error" | "expired"
  const [recoveryError, setRecoveryError] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [interests, setInterests] = useState(new Set(["gastro", "adventure"]));
  const [kioskDay, setKioskDay] = useState(3);
  const [simHour, setSimHour] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [svModal, setSvModal] = useState(null); // { lat, lng, name } — inline Street View overlay
  // Kiosk v2: location-aware nearby data
  const [nearbyData, setNearbyData] = useState(null); // { location, categories }
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [kioskCoords, setKioskCoords] = useState(null); // [lat, lng] from GPS or fallback
  const [kioskWelcome, setKioskWelcome] = useState(false); // transition screen
  const [senseData, setSenseData] = useState(null); // YOLO Sense parking/marina/beach
  const [showKioskLive, setShowKioskLive] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);
  const [booked, setBooked] = useState(new Set());
  // Viator activities
  const [viatorActs, setViatorActs] = useState(null); // null=not loaded, array=loaded
  const [viatorLoading, setViatorLoading] = useState(false);
  const [selectedViatorAct, setSelectedViatorAct] = useState(null);
  const [viatorImgIdx, setViatorImgIdx] = useState(0);
  const [viatorBookDate, setViatorBookDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  const [viatorPersons, setViatorPersons] = useState(2);
  const [viatorWishlist, setViatorWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem("jadran_viator_wishlist") || "[]"); } catch { return []; } });
  // In-app browser
  const [inAppUrl, setInAppUrl] = useState(null);
  // BJ direct room booking
  const [bjBookRoom, setBjBookRoom] = useState(null);
  const [bjCheckIn, setBjCheckIn] = useState(() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); });
  const [bjCheckOut, setBjCheckOut] = useState(() => { const d = new Date(); d.setDate(d.getDate()+5); return d.toISOString().slice(0,10); });
  const [bjGuests, setBjGuests] = useState(2);
  const [bjGuestName, setBjGuestName] = useState("");
  const [bjGuestEmail, setBjGuestEmail] = useState("");
  const [bjStatus, setBjStatus] = useState(null); // null|"loading"|"done"|"error"
  const [bjConfirmId, setBjConfirmId] = useState("");
  // Border intelligence
  const [borderData, setBorderData] = useState(null);
  const [borderLoading, setBorderLoading] = useState(false);
  // Arrival geofencing
  const [geoArrival, setGeoArrival] = useState(false); // true = within 10km
  const [arrivalCountdown, setArrivalCountdown] = useState(null); // seconds remaining
  const geoWatchRef = useRef(null);
  const arrivalFiredRef = useRef(false);
  const [affiliateId, setAffiliateId] = useState(null); // e.g. "blackjack" — shows content
  const [statsAccess, setStatsAccess] = useState(null); // {partner, pin} — set when ?stats=X&pin=Y
  const [pfRating, setPfRating] = useState(0);      // partner feedback star rating
  const [pfComment, setPfComment] = useState("");    // partner feedback text
  const [pfDone, setPfDone] = useState(false);       // feedback submitted
  const [menuOpenSec, setMenuOpenSec] = useState(null); // which menu section is expanded
  const verifiedAffiliate = useRef(false); // true only if tk= token validated — grants 72h
  const kioskForcedCoords = useRef(null); // set by ?kiosk= param — bypasses GPS
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [trialRemaining, setTrialRemaining] = useState(null); // ms left in 72h trial, null=not started
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  // ── FREE MESSAGE COUNTER — persisted in localStorage, survives refresh ──
  const [freeMsgUsed, setFreeMsgUsed] = useState(() => {
    try { return parseInt(localStorage.getItem("jadran_msg_count") || "0", 10); } catch { return 0; }
  });
  const incFreeMsg = () => {
    setFreeMsgUsed(prev => {
      const next = prev + 1;
      try { localStorage.setItem("jadran_msg_count", String(next)); } catch {}
      return next;
    });
  };

  // ── MY JADRAN: detect returning kiosk user synchronously from localStorage ──
  const [returningKiosk] = useState(() => {
    try {
      const rc = (() => { try { return localStorage.getItem("jadran_room") || ""; } catch { return ""; } })();
      if (!rc || rc === "DEMO") return null;
      const raw = localStorage.getItem("jadran_guest_" + rc);
      if (!raw) return null;
      const g = JSON.parse(raw);
      if (g?.phase !== "kiosk") return null;
      return { city: g.destination || null, lang: g.lang || null, premium: !!g.premium };
    } catch { return null; }
  });

  const chatEnd = useRef(null);
  // Guest key: roomCode from URL, or deviceId for standalone users
  const roomCode = useRef((() => {
    const rc = getRoomCode();
    if (rc !== "DEMO") return rc;
    let did = ""; try { did = localStorage.getItem("jadran_push_deviceId") || ""; } catch {}
    if (!did) { const b = new Uint8Array(9); crypto.getRandomValues(b); did = "dev_" + Array.from(b, x => x.toString(16).padStart(2,"0")).join(""); try { localStorage.setItem("jadran_push_deviceId", did); } catch {} }
    return did;
  })());

  // ─── NETWORK STATUS ───
  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ─── TRANSIT HERE MAP ───
  const [transitFromUrl, setTransitFromUrl] = useState("");
  const [transitToUrl, setTransitToUrl] = useState("");
  const [transitSegUrl, setTransitSegUrl] = useState("");
  // Restore coords from persisted delta on reload (fixes background-kill state loss)
  const [transitFromCoords, setTransitFromCoords] = useState(() => {
    const d = loadDelta(); return d.from_coords?.[0] ? d.from_coords : null;
  });
  const [transitToCoords, setTransitToCoords] = useState(() => {
    const d = loadDelta(); return d.destination?.lat ? [d.destination.lat, d.destination.lng] : null;
  });
  const [transitRouteData, setTransitRouteData] = useState(null);
  const [preTripGuideCards, setPreTripGuideCards] = useState([]);
  // Save real HERE road distance to delta → gpsEngine → pulse.js gets accurate km
  useEffect(() => {
    if (transitRouteData?.km) {
      saveDelta({ route_km: transitRouteData.km, route_hrs: transitRouteData.hrs, route_mins: transitRouteData.mins });
    }
  }, [transitRouteData?.km]); // eslint-disable-line

  // Pre-fetch guide cards when route coords are known — ready when user opens chat
  useEffect(() => {
    if (!transitFromCoords || !transitToCoords) return;
    const seg = loadDelta().segment || "auto";
    fetch(`/api/guide?oLat=${transitFromCoords[0]}&oLng=${transitFromCoords[1]}&dLat=${transitToCoords[0]}&dLng=${transitToCoords[1]}&seg=${seg}&lang=${lang || "hr"}`)
      .then(r => r.json())
      .then(d => setPreTripGuideCards(d.cards || []))
      .catch(captureErr);
  }, [transitFromCoords?.[0], transitToCoords?.[0]]); // eslint-disable-line

  // ─── GPS LIVE ENGINE (starts on user action, not automatically) ───
  const [gpsCards, setGpsCards] = useState([]);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const gpsStarted = useRef(false);
  const pushDeviceId = useRef(null);

  // Register SW Web Push subscription and store on server
  const setupPushSub = React.useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const raw = "BHNHtalPk8wfqL9yxMbAgiVQ5Df-V0BWElnPOfPH2MenN1UbOrQDu76Hj_pTSoNmFFjATVgZck3a8JO4jQrm8j0";
        const pad = "=".repeat((4 - raw.length % 4) % 4);
        const b64 = (raw + pad).replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
      }
      let devId = localStorage.getItem("jadran_device_id");
      if (!devId) { devId = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("jadran_device_id", devId); }
      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), deviceId: devId, roomCode: roomCode.current || "" }),
      });
      pushDeviceId.current = devId;
      return devId;
    } catch (e) { console.warn("Push setup:", e.message); return null; }
  }, []); // eslint-disable-line

  const startTrip = () => {
    if (gpsStarted.current) return;
    gpsStarted.current = true;
    setTripActive(true);
    saveDelta({ trip_started: true });
    try { window.fbq?.("track", "ViewContent", { content_name: "trip_started", content_category: transitSegUrl || "auto" }); } catch {}

    // Register SW push subscription (works in background/locked screen)
    setupPushSub();

    // Inject "tracking mode activated" card immediately — NOT a route brief
    const trackingCard = {
      id: "tracking_start",
      type: "tracking",
      severity: "info",
      icon: "🛡️",
      title: ({ hr: "Monitoring aktivan — Guardian te prati", de: "Monitoring aktiv — Guardian begleitet dich", en: "Monitoring active — Guardian is with you", it: "Monitoraggio attivo — Guardian ti accompagna" })[lang] || "Monitoring aktivan",
      body: ({ hr: `${transitFromUrl || "Start"} → ${transitToUrl || "Cilj"} · GPS praćenje, HAK upozorenja, prometni senzori aktivni`, de: `${transitFromUrl || "Start"} → ${transitToUrl || "Ziel"} · GPS-Tracking, HAK-Warnungen, Verkehrssensoren aktiv`, en: `${transitFromUrl || "Start"} → ${transitToUrl || "Destination"} · GPS tracking, HAK alerts, traffic sensors active`, it: `${transitFromUrl || "Partenza"} → ${transitToUrl || "Destinazione"} · GPS tracking, avvisi HAK, sensori traffico attivi` })[lang] || "",
      source: "Guardian",
      ts: new Date().toISOString(),
    };
    setGpsCards([trackingCard]);

    // 72h trial ONLY for booking partners (affiliate) or real host QR guests
    // Landing page users (DEMO/dev_) stay on 3 free messages
    const isBookingGuest = verifiedAffiliate.current || (roomCode.current && roomCode.current !== "DEMO" && !roomCode.current.startsWith("dev_"));
    if (!premium && isBookingGuest) {
      try {
        const until = Date.now() + 72 * 60 * 60 * 1000;
        localStorage.setItem("jadran_ai_trial_until", String(until));
        localStorage.setItem("jadran_ai_premium", "1");
      } catch {}
      setPremium(true);
    }
    startGPS({
      onCard: (card) => {
        // Critical alerts → server-side Web Push (works on locked screen / background tab)
        if (card.severity === "critical" && pushDeviceId.current) {
          fetch("/api/push-send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId: pushDeviceId.current,
              title: `🛡️ Guardian — ${card.title}`,
              body: card.body,
              tag: card.id,
              url: "/",
            }),
          }).catch(() => {});
        }
        setGpsCards(prev => {
          const exists = prev.some(c => c.id === card.id);
          if (exists) return prev;
          // Keep only the newest AI card — remove older AI pulse cards
          const filtered = card.isAI ? prev.filter(c => !c.isAI) : prev;
          return [card, ...filtered].slice(0, 20);
        });
      },
      onPosition: (pos) => setGpsPosition(pos),
      onPhase: (newPhase) => {
        if (newPhase === "odmor") {
          ensureTrialStart();
          setPhase("kiosk"); setSubScreen("home");
          updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" });
        }
      },
      onCountry: (country) => {
        saveDelta({ country });
      },
    });
  };

  // Resume trip if was active before reload
  useEffect(() => {
    if (gpsStarted.current) return;
    if (phase !== "pre" || subScreen !== "transit") return;
    try {
      const delta = loadDelta();
      if (delta.trip_started === true) {
        startTrip();
      }
    } catch {}
  }, [phase, subScreen]);

  // ─── GUEST ONBOARDING STATE ───
  const [guestProfile, setGuestProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const G = guestProfile || GUEST_FALLBACK;

  useEffect(() => {
    // 350ms delay — iOS keyboard animation must settle before scrollIntoView or it jumps
    const t = setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 350);
    return () => clearTimeout(t);
  }, [chatMsgs]);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1500); return () => clearTimeout(t); }, []);

  // ─── URL transit handoff (?go=transit&from=Wien&to=Split&seg=kamper) ───
  const urlFromSet = useRef(false); // blocks geocode race condition
  const urlToSet = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("go") !== "transit") return;
    const from = p.get("from") || "";
    const to = p.get("to") || "";
    const seg = p.get("seg") || "par";
    if (!from || !to) return;
    setTransitFromUrl(from);
    setTransitToUrl(to);
    setTransitSegUrl(seg);
    // Use coords from URL if available (passed from LandingPage autosuggest)
    const fLat = parseFloat(p.get("fLat")), fLng = parseFloat(p.get("fLng"));
    const tLat = parseFloat(p.get("tLat")), tLng = parseFloat(p.get("tLng"));
    if (fLat && fLng) { setTransitFromCoords([fLat, fLng]); saveDelta({ from_coords: [fLat, fLng] }); urlFromSet.current = true; }
    if (tLat && tLng) { setTransitToCoords([tLat, tLng]); saveDelta({ destination: { city: to, lat: tLat, lng: tLng } }); urlToSet.current = true; }
    const urlLang = p.get("lang");
    if (urlLang) { setLang(urlLang); saveDelta({ lang: urlLang }); }
    // Sprint 7B — persist dates from URL into DELTA (lifecycle hook)
    const arrParam = p.get("arr");
    const depParam = p.get("dep");
    if (arrParam || depParam) saveDelta({ arrival_date: arrParam || null, departure_date: depParam || null });
    setPhase("pre");
    setSubScreen("transit");
    setSplash(false);
    saveDelta({ trip_started: false }); // new route = new trip, not resumed
    setTripActive(false);
    gpsStarted.current = false;
    localStorage.setItem("jadran_go_transit", "1");
    window.history.replaceState({}, "", "/");
  }, []); // eslint-disable-line

  // ─── ?kiosk=rab&lang=de&affiliate=blackjack → direct kiosk demo mode ───
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const kioskParam = p.get("kiosk");
    if (!kioskParam) return;
    const KIOSK_CITIES = {
      "rab":       [44.7561, 14.7642, "Rab"],
      "split":     [43.508,  16.440,  "Split"],
      "dubrovnik": [42.650,  18.094,  "Dubrovnik"],
      "makarska":  [43.298,  17.018,  "Makarska"],
      "hvar":      [43.172,  16.441,  "Hvar"],
      "zadar":     [44.119,  15.232,  "Zadar"],
      "krk":       [45.028,  14.575,  "Krk"],
      "pula":      [44.867,  13.850,  "Pula"],
      "rovinj":    [45.081,  13.639,  "Rovinj"],
      "sibenik":   [43.735,  15.890,  "Šibenik"],
      "trogir":    [43.517,  16.252,  "Trogir"],
      "korcula":   [42.960,  17.136,  "Korčula"],
      "brac":      [43.306,  16.655,  "Brač"],
      "porec":     [45.227,  13.594,  "Poreč"],
      "opatija":   [45.337,  14.305,  "Opatija"],
      "crikvenica":[45.177,  14.693,  "Crikvenica"],
      "novalja":   [44.554,  14.886,  "Novalja"],
      "biograd":   [43.943,  15.443,  "Biograd"],
      "vodice":    [43.761,  15.779,  "Vodice"],
      "primosten": [43.586,  15.923,  "Primošten"],
    };
    const urlAffiliate = p.get("affiliate");
    const urlToken = p.get("tk");
    const isValidAffiliate = urlAffiliate && AFFILIATE_TOKENS[urlAffiliate] === urlToken;
    const cd = (urlAffiliate && AFFILIATE_COORDS[urlAffiliate]) || KIOSK_CITIES[kioskParam.toLowerCase()];
    if (!cd) return;
    const urlLang = p.get("lang");
    if (urlLang) { setLang(urlLang); saveDelta({ lang: urlLang }); }
    if (urlAffiliate) {
      setAffiliateId(urlAffiliate); // show affiliate content regardless
      // Fire-and-forget view counter
      const guestLang = p.get("lang") || "?";
      const devId = localStorage.getItem("jadran_device_id") || "unknown";
      fetch("/api/partner-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner: urlAffiliate, event: "qr_open", lang: guestLang, deviceId: devId }),
      }).catch(() => {});
    }
    if (isValidAffiliate) verifiedAffiliate.current = true;
    // Allow Guardian arrival to override coords with precise destination coords (tLat/tLng)
    const urlTLat = parseFloat(p.get("tLat")), urlTLng = parseFloat(p.get("tLng"));
    const finalLat = (urlTLat && urlTLng) ? urlTLat : cd[0];
    const finalLng = (urlTLat && urlTLng) ? urlTLng : cd[1];
    kioskForcedCoords.current = [finalLat, finalLng]; // prevent GPS from overriding
    setTransitToCoords([finalLat, finalLng]);
    saveDelta({ destination: { city: cd[2], lat: finalLat, lng: finalLng } });
    // ── KRAJ TESTING PERIODA: kiosk zahteva premium (affiliate QR kodovi i dalje dobijaju trial) ──
    if (!isValidAffiliate) {
      const hasPrem = (() => {
        try {
          if (localStorage.getItem("jadran_ai_premium") !== "1") return false;
          const exp = parseInt(localStorage.getItem("jadran_premium_exp") || "0", 10);
          return !exp || Date.now() < exp;
        } catch { return false; }
      })();
      if (!hasPrem) {
        try { sessionStorage.setItem("jadran_after_pay_kiosk", JSON.stringify({ city: cd[2], lat: finalLat, lng: finalLng, lang: urlLang || null })); } catch {}
        window.history.replaceState({}, "", "/");
        setSplash(false);
        setShowPaywall(true);
        return;
      }
    }
    // ── action=card: auto-navigate to Rab Card screen (TZ & affiliate entry QRs) ──
    const urlAction = p.get("action");
    const urlTzPoint = p.get("tz"); // TZ entry point ID (ferry_terminal, beach_rajska, etc.)
    if (urlTzPoint) saveDelta({ tzPoint: urlTzPoint });

    setPhase("kiosk");
    setSubScreen(urlAction === "card" ? "rabcard" : urlAffiliate ? "affiliate" : "home");
    setSplash(false);
    // Only grant 72h trial for verified affiliate partners (QR #1 with valid token)
    if (isValidAffiliate) ensureTrialStart();
    // Auto-unlock premium if arriving from a paid TripGuide booking
    const bookingId = p.get("booking");
    if (bookingId && bookingId.startsWith("JAD-")) {
      try {
        const paid = JSON.parse(localStorage.getItem("jadran_trip_paid") || "{}");
        if (paid[bookingId]) {
          setPremium(true);
          localStorage.setItem("jadran_ai_premium", "1");
        }
      } catch {}
    }
    window.history.replaceState({}, "", "/");
  }, []); // eslint-disable-line

  // ─── ?stats=blackjack&pin=... → partner analytics dashboard ───
  // PIN validation is server-side only — never stored in client bundle
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const statsParam = p.get("stats");
    if (!statsParam) return;
    const pinParam = p.get("pin") || "";
    if (statsParam && pinParam) {
      setStatsAccess({ partner: statsParam, pin: pinParam });
      setSplash(false);
      window.history.replaceState({}, "", "/");
    }
  }, []); // eslint-disable-line

  // ─── PERSISTENCE: Load guest state from Firestore/localStorage ───
  const persistReady = useRef(false);
  useEffect(() => {
    loadGuest(roomCode.current).then(data => {
      if (localStorage.getItem("jadran_go_transit") === "1") {
        localStorage.removeItem("jadran_go_transit");
        return; // transit handoff active — don't override phase/subScreen
      }
      if (data) {
        if (data.premium) setPremium(true);
        if (data.lang) setLang(data.lang);
        if (data.phase) {
          // Use date-based phase if dates are available
          const autoPhase = (() => {
            const now = new Date();
            const arr = data.arrival ? new Date(data.arrival) : null;
            const dep = data.departure ? new Date(data.departure) : null;
            if (arr && now < arr) return "pre";
            if (arr && dep && now >= arr && now <= dep) return "kiosk";
            if (dep && now > dep) return "post";
            return data.phase;
          })();
          setPhase(autoPhase);
          if (autoPhase === "pre") setSubScreen(data.subScreen || "onboard");
          else if (autoPhase === "kiosk") {
            setSubScreen(data.subScreen || "home");
            // QR guests without payment get 3 free messages (handled in doChat)
            // Only pre-paid or booking guests get premium flag from Firestore
          }
          else setSubScreen(data.subScreen || "summary");
        }
        if (data.booked) setBooked(new Set(data.booked));
        // Load guest profile fields if they exist
        if (data.name && data.country) {
          setGuestProfile({
            name: data.name, first: data.first || data.name.split(" ").pop(),
            country: data.country, flag: data.flag || "🌍", lang: data.lang || "en",
            adults: data.adults || 2, kids: data.kids || 0, kidsAges: data.kidsAges || [],
            interests: data.interests || ["gastro","adventure"],
            arrival: data.arrival || data.checkIn || "",
            departure: data.departure || data.checkOut || "",
            car: data.car || false, carPlate: data.carPlate || "",
            accommodation: data.accommodation || "Apartman", host: data.host || "",
            hostPhone: data.hostPhone || "", email: data.email || "",
          });
          // Sync dates to DELTA so lifecycle works on QR path too
          const gArr = data.arrival || data.checkIn;
          const gDep = data.departure || data.checkOut;
          if (gArr || gDep) saveDelta({ arrival_date: gArr || null, departure_date: gDep || null });
        } else if (roomCode.current && !roomCode.current.startsWith("dev_")) {
          // No profile yet — show onboarding (only for real room codes, not standalone)
          setShowOnboarding(true);
        }
      } else if (roomCode.current && !roomCode.current.startsWith("dev_")) {
        setShowOnboarding(true);
      }
      // Mark ready AFTER initial state is applied
      const _pt = setTimeout(() => { persistReady.current = true; }, 500);
      return () => clearTimeout(_pt);
    }).catch(() => { persistReady.current = true; });
  }, []);

  // ─── PERSISTENCE: Auto-save on key state changes ───
  useEffect(() => {
    if (!persistReady.current) return;
    updateGuest(roomCode.current, { lang, phase, subScreen, premium, booked: [...booked], destination: kioskCity || transitDestCity, lastAccess: new Date().toISOString() });
  }, [lang, phase, subScreen, premium, booked]);


  // ─── AUTO-FETCH VIATOR when entering relevant screens ───
  useEffect(() => {
    if ((phase === "kiosk" && subScreen === "activities") || (phase === "pre" && subScreen === "pretrip")) {
      fetchViatorActs();
    }
  }, [phase, subScreen]); // eslint-disable-line

  // ─── PUSH NOTIFICATIONS: register SW subscription on first load ───
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const VAPID_PUBLIC = "BJ2JAE5jwAipfCJU4x6sgWPYnDZAIFcg-_1XJU4F5-qUdCo1eHKSe8wsC56WZELnHUWAp-eNA4hcWs1YeLcKjXE";
    const stored = localStorage.getItem("jadran_push_deviceId");
    let deviceId = stored;
    if (!deviceId) { const b = new Uint8Array(9); crypto.getRandomValues(b); deviceId = "dev_" + Array.from(b, x => x.toString(16).padStart(2,"0")).join(""); localStorage.setItem("jadran_push_deviceId", deviceId); }

    const registerPush = async (reg) => {
      try {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC,
          });
        }
        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), deviceId, roomCode: roomCode.current }),
        }).catch(() => {});
        localStorage.setItem("jadran_push_active", "1");
      } catch {}
    };

    navigator.serviceWorker.ready.then(reg => {
      if (Notification.permission === "granted") {
        registerPush(reg);
      } else if (Notification.permission === "default") {
        // Request permission on first meaningful interaction (after onboarding)
        const onInteract = () => {
          Notification.requestPermission().then(p => { if (p === "granted") registerPush(reg); });
          window.removeEventListener("click", onInteract);
        };
        window.addEventListener("click", onInteract, { once: true });
      }
    }).catch(() => {});
  }, []); // eslint-disable-line

  // ─── PWA INSTALL PROMPT ───
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e); };
    const installed = () => { setPwaInstalled(true); setPwaPrompt(null); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    // Check if already running as PWA (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
      setPwaInstalled(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  // ─── ALERTS BAR ───
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [navtexData, setNavtexData] = useState(null);
  useEffect(() => {
    const fetchAlerts = () => fetch("/api/alerts").then(r => r.json()).then(d => { if (d.alerts?.length) setAlerts(d.alerts); }).catch(captureErr);
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (phase !== "kiosk") return;
    fetch("/api/navtex").then(r => r.json()).then(setNavtexData).catch(() => {});
    const iv = setInterval(() => fetch("/api/navtex").then(r => r.json()).then(setNavtexData).catch(() => {}), 1800000); // 30 min
    return () => clearInterval(iv);
  }, [phase]);

  // ─── LEAFLET MAP: call hook unconditionally (React rules) ───
  const mapFromCity = transitFromUrl || COUNTRY_CITY[G.country] || "Wien";
  const mapToCity = transitToUrl || loadDelta().destination?.city || kioskCity || "Split";

  // Geocode transit cities to coordinates
  useEffect(() => {
    if (!mapFromCity) return;
    if (transitFromCoords) return;
    if (urlFromSet.current) return; // URL coords pending — don't race
    const c = CITY_COORDS[mapFromCity];
    if (c) { setTransitFromCoords(c); saveDelta({ from_coords: c }); return; }
    fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(mapFromCity + ", Europe")}&limit=1&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(d => {
        const p = d.items?.[0]?.position;
        const coords = p ? [p.lat, p.lng] : CITY_COORDS["Wien"];
        setTransitFromCoords(coords);
        saveDelta({ from_coords: coords });
      })
      .catch(() => { setTransitFromCoords(CITY_COORDS["Wien"]); saveDelta({ from_coords: CITY_COORDS["Wien"] }); });
  }, [mapFromCity]); // eslint-disable-line
  useEffect(() => {
    if (!mapToCity) return;
    if (transitToCoords) return;
    if (urlToSet.current) return; // URL coords pending — don't race
    const c = CITY_COORDS[mapToCity];
    if (c) { setTransitToCoords(c); saveDelta({ destination: { city: mapToCity, lat: c[0], lng: c[1] } }); return; }
    fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(mapToCity + ", Croatia")}&limit=1&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(d => {
        const p = d.items?.[0]?.position;
        const coords = p ? [p.lat, p.lng] : CITY_COORDS["Split"];
        setTransitToCoords(coords);
        saveDelta({ destination: { city: mapToCity, lat: coords[0], lng: coords[1] } });
      })
      .catch(() => { const fb = CITY_COORDS[mapToCity] || CITY_COORDS["Split"]; setTransitToCoords(fb); saveDelta({ destination: { city: mapToCity, lat: fb[0], lng: fb[1] } }); });
  }, [mapToCity]); // eslint-disable-line

  // Traffic incidents now handled by /api/guide (RouteGuide component)

  // Route fallback handled inside TransitMap component

  // ─── WEATHER: Fetch real data via Gemini grounding ───
  const [weather, setWeather] = useState(W_DEFAULT);
  const [forecast, setForecast] = useState(null); // null = use FORECAST_DEFAULT

  useEffect(() => {
    // Live weather at destination — resolve coords from best available source
    const delta = loadDelta();
    const wLat = kioskForcedCoords.current?.[0] || transitToCoords?.[0] || delta.destination?.lat || kioskCoords?.[0];
    const wLng = kioskForcedCoords.current?.[1] || transitToCoords?.[1] || delta.destination?.lng || kioskCoords?.[1];
    if (!wLat || !wLng) return; // wait for real coords — don't pollute with Split fallback
    fetch(`/api/weather?lat=${wLat}&lon=${wLng}`).then(r => r.json()).then(data => {
      if (data.current?.temp) setWeather(data.current);
      if (data.forecast?.length >= 1) setForecast(data.forecast);
    }).catch(captureErr);
  }, [transitToCoords?.[0], kioskCoords?.[0], phase]); // eslint-disable-line
  // ─── ADMIN: Secret unlock DISABLED in production ───
  // To test premium: use Stripe test mode or set jadran_ai_premium in Firebase console
  // useEffect(() => { ... }, []);

  // ─── ?paywall=1 redirect from Guardian Brief (LandingPage) ───
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("paywall") !== "1") return;
    window.history.replaceState({}, "", "/");
    setSplash(false);
    setShowPaywall(true);
  }, []); // eslint-disable-line

  // ─── STRIPE: Detect payment redirect ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const bookingStatus = params.get('booking');
    const activityName = params.get('activity');

    if (paymentStatus === 'success' && sessionId) {
      // Verify payment server-side
      fetch('/api/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then(r => r.json()).then(data => {
        if (data.paid) {
          setPremium(true);
          try {
            localStorage.setItem("jadran_ai_premium", "1");
            const days = parseInt(data.days || "7");
            localStorage.setItem("jadran_premium_exp", String(Date.now() + days * 86400000));
          } catch {}
          // If user came from Guardian Brief, navigate to their chosen destination
          const afterPayKiosk = (() => { try { return JSON.parse(sessionStorage.getItem("jadran_after_pay_kiosk") || "null"); } catch { return null; } })();
          if (afterPayKiosk) {
            try { sessionStorage.removeItem("jadran_after_pay_kiosk"); } catch {}
            kioskForcedCoords.current = [afterPayKiosk.lat, afterPayKiosk.lng];
            setTransitToCoords([afterPayKiosk.lat, afterPayKiosk.lng]);
            saveDelta({ destination: { city: afterPayKiosk.city, lat: afterPayKiosk.lat, lng: afterPayKiosk.lng } });
            if (afterPayKiosk.lang) { setLang(afterPayKiosk.lang); saveDelta({ lang: afterPayKiosk.lang }); }
          }
          setSplash(false);
          setPhase('kiosk');
          setSubScreen('home');
          updateGuest(roomCode.current, { premium: true, premiumSessionId: sessionId, phase: 'kiosk' });
        }
      }).catch(() => {
        // Verification failed — do NOT self-grant premium; webhook is authoritative
        console.warn("[jadran] Payment verify failed — waiting for webhook confirmation");
      });
      // Clean URL (keep ?room= if present)
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    } else if (paymentStatus === 'success' && !sessionId) {
      // session_id missing — Stripe redirect issue; clean URL and show soft warning
      console.warn("[jadran] payment=success but session_id missing — possible redirect error");
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (bookingStatus === 'success' && activityName) {
      setSplash(false);
      setPhase('kiosk');
      setSubScreen('home');
      setShowConfirm(decodeURIComponent(activityName));
      setBooked(prev => {
        const next = new Set([...prev, activityName]);
        updateGuest(roomCode.current, { booked: [...next] });
        return next;
      });
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }
  }, []);

  // ─── STRIPE: Start Premium Checkout ───
  const startPremiumCheckout = async (plan = "week") => {
    setPayLoading(true);
    try { window.fbq?.("track", "AddPaymentInfo", { content_name: plan, currency: "EUR", value: plan === "vip" ? 49.99 : plan === "season" ? 19.99 : 9.99 }); } catch {}
    try {
      const deviceId = localStorage.getItem("jadran_push_deviceId") || `dev_${Date.now()}`;
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.current, guestName: G.name, lang, plan,
          deviceId, returnPath: window.location.pathname + window.location.search,
          region: kioskCity || "all",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        // Stripe returned no URL — show error
        console.error("Checkout failed: no URL returned", data);
        alert(lang === "de" ? "Zahlung derzeit nicht verfügbar. Bitte versuchen Sie es später." : lang === "it" ? "Pagamento non disponibile. Riprovare più tardi." : lang === "en" ? "Payment currently unavailable. Please try again later." : "Plaćanje trenutno nedostupno. Pokušajte kasnije.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert(lang === "de" ? "Verbindungsfehler. Bitte versuchen Sie es später." : lang === "it" ? "Errore di connessione. Riprovare più tardi." : lang === "en" ? "Connection error. Please try again later." : "Greška u povezivanju. Pokušajte kasnije.");
    }
    setPayLoading(false);
  };

  // ─── STRIPE: Start Activity Booking Checkout ───
  const startBookingCheckout = async (exp) => {
    setPayLoading(true);
    try {
      const totalPersons = G.adults + (G.kids || 0);
      const res = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: exp.name, price: exp.price,
          quantity: totalPersons, roomCode: roomCode.current,
          guestName: G.name, lang,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Booking checkout failed: no URL", data);
        alert(lang === "de" ? "Buchung derzeit nicht verfügbar." : lang === "en" ? "Booking currently unavailable." : "Rezervacija trenutno nedostupna.");
      }
    } catch (err) {
      console.error("Booking checkout error:", err);
      alert(lang === "de" ? "Verbindungsfehler." : lang === "en" ? "Connection error." : "Greška u povezivanju.");
    }
    setPayLoading(false);
  };

  // ─── Viator: Fetch activities ───
  const fetchViatorActs = async () => {
    if (viatorLoading || viatorActs !== null) return;
    setViatorLoading(true);
    try {
      const res = await fetch("/api/viator-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: loadDelta().destination?.city || kioskCity || "Split" }),
      });
      const data = await res.json();
      setViatorActs(Array.isArray(data.activities) && data.activities.length > 0 ? data.activities : VIATOR_FALLBACK);
    } catch {
      setViatorActs(VIATOR_FALLBACK);
    } finally {
      setViatorLoading(false);
    }
  };

  // ─── Viator: Book activity via Stripe ───
  const startViatorBooking = async (act, date, persons) => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/viator-book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode: act.productCode, title: act.title, price: act.price, date, persons, roomCode: roomCode.current, guestName: G.name, lang }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert(lang === "de" ? "Buchung nicht verfügbar." : lang === "en" ? "Booking unavailable." : "Rezervacija nije dostupna."); }
    } catch { alert(lang === "en" ? "Connection error." : "Greška. Pokušajte ponovo."); }
    setPayLoading(false);
  };

  // ─── BJ: Direct room booking ───
  const doBjBook = async () => {
    if (!bjBookRoom || !bjGuestName || !bjCheckIn || !bjCheckOut) return;
    setBjStatus("loading");
    try {
      const r = await fetch("/api/room-book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: bjBookRoom.id, roomName: bjBookRoom._nameLocalized || bjBookRoom.id,
          affiliate: affiliateId || "blackjack",
          checkIn: bjCheckIn, checkOut: bjCheckOut,
          guests: bjGuests, guestName: bjGuestName, guestEmail: bjGuestEmail, lang,
        }),
      });
      const data = await r.json();
      if (r.ok && data.id) { setBjConfirmId(data.id); setBjStatus("done"); }
      else { setBjStatus("error"); }
    } catch { setBjStatus("error"); }
  };

  // ─── Viator: Wishlist toggle ───
  const toggleViatorWishlist = (act) => {
    const next = viatorWishlist.some(a => a.productCode === act.productCode)
      ? viatorWishlist.filter(a => a.productCode !== act.productCode)
      : [...viatorWishlist, { productCode: act.productCode, title: act.title, price: act.price, duration: act.duration, rating: act.rating }];
    setViatorWishlist(next);
    try { localStorage.setItem("jadran_viator_wishlist", JSON.stringify(next)); } catch {}
  };

  // ─── Border intelligence ───
  const fetchBorderData = async () => {
    if (borderLoading) return;
    setBorderLoading(true);
    try {
      const res = await fetch("/api/border-intelligence");
      if (res.ok) setBorderData(await res.json());
    } catch {}
    setBorderLoading(false);
  };

  useEffect(() => {
    if (phase === "pre" && subScreen === "transit") {
      fetchBorderData();
      const iv = setInterval(fetchBorderData, 600000); // 10-min auto-refresh
      return () => clearInterval(iv);
    }
  }, [phase, subScreen]); // eslint-disable-line

  // ─── ARRIVAL GEOFENCING: watch position, trigger at <10km to destination ───
  useEffect(() => {
    if (phase !== "pre" || subScreen !== "transit") return;
    if (!("geolocation" in navigator)) return;

    // Use transit destination coords (dynamic, not hardcoded)
    const delta = loadDelta();
    const dLat = transitToCoords?.[0] || delta.destination?.lat;
    const dLng = transitToCoords?.[1] || delta.destination?.lng;
    if (!dLat || !dLng) return;

    const R = 6371;
    const distKm = (lat1, lng1, lat2, lng2) => {
      const dl = (lat2 - lat1) * Math.PI / 180;
      const dn = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dl / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dn / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const onPos = (pos) => {
      const km = distKm(pos.coords.latitude, pos.coords.longitude, dLat, dLng);
      if (km < 10 && !arrivalFiredRef.current) {
        arrivalFiredRef.current = true;
        setGeoArrival(true);
        setArrivalCountdown(30);

        // Notify host via push-send (fire-and-forget)
        const deviceId = localStorage.getItem("jadran_push_deviceId");
        if (deviceId) {
          fetch("/api/push-send", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId, title: "Gost stiže!",
              body: `${G.first} je ~${Math.round(km)} km od apartmana`,
              tag: "arrival",
            }),
          }).catch(() => {});
        }
      }
    };

    geoWatchRef.current = navigator.geolocation.watchPosition(onPos, () => {}, {
      enableHighAccuracy: false, maximumAge: 60000, timeout: 30000,
    });
    return () => {
      if (geoWatchRef.current != null) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, [phase, subScreen]); // eslint-disable-line

  // ─── ARRIVAL COUNTDOWN: auto-transition to kiosk after 30s ───
  useEffect(() => {
    if (arrivalCountdown === null) return;
    if (arrivalCountdown <= 0) {
      ensureTrialStart();
      setKioskWelcome(true); setNearbyData(null);
      setPhase("kiosk");
      setSubScreen("home");
      updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" });
      return;
    }
    const t = setTimeout(() => setArrivalCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [arrivalCountdown]); // eslint-disable-line

  const hour = simHour ?? new Date().getHours();
  const timeCtx = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
  const dateLocale = lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-GB" : lang === "it" ? "it-IT" : lang === "si" ? "sl-SI" : lang === "cz" ? "cs-CZ" : lang === "pl" ? "pl-PL" : "hr-HR";
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "sial";

  // ─── 72h AI TRIAL — set start timestamp on first kiosk entry ───
  const ensureTrialStart = () => {
    // Only booking guests (affiliate partner or real host QR) get 72h trial
    // Landing/TZ QR users stay on 3 free messages — no trial timer for them
    const isBookingGuest = verifiedAffiliate.current || (roomCode.current && roomCode.current !== "DEMO" && !roomCode.current.startsWith("dev_"));
    if (!isBookingGuest) return;
    try {
      if (!localStorage.getItem("jadran_trial_start")) {
        localStorage.setItem("jadran_trial_start", Date.now().toString());
      }
    } catch {}
  };

  // Compute remaining ms every minute
  useEffect(() => {
    if (phase !== "kiosk" || premium) return;
    const calc = () => {
      try {
        const start = parseInt(localStorage.getItem("jadran_trial_start") || "0", 10);
        if (!start) return null;
        return Math.max(0, start + 72 * 3600000 - Date.now());
      } catch { return null; }
    };
    const update = () => setTrialRemaining(calc());
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [phase, premium]); // eslint-disable-line

  // Show paywall when trial expires (and user is not premium)
  useEffect(() => {
    if (premium || trialRemaining === null) return;
    if (trialRemaining === 0) { try { window.fbq?.("track", "InitiateCheckout", { content_name: "trial_expired" }); } catch {} setShowPaywall(true); }
  }, [trialRemaining, premium]); // eslint-disable-line

  const tryPremium = (cb) => { if (premium) { cb(); } else { setShowPaywall(true); } };

  const doChat = async () => {
    if (!chatInput.trim()) return;
    // ── 3 FREE MESSAGES GATE (persisted in localStorage) ──
    if (!premium && freeMsgUsed >= 5) {
      setShowPaywall(true);
      return;
    }
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]);
    if (!premium) incFreeMsg(); // increment BEFORE API call
    setChatLoading(true);
    try {
      const langName = ({hr:"Hrvatski",de:"Deutsch",at:"Österreichisches Deutsch",en:"English",it:"Italiano",si:"Slovenščina",cz:"Čeština",pl:"Polski"})[lang] || "Hrvatski";
      const guestCtx = [
        G.name !== "Gost" ? `GOST: ${G.name}` : "",
        G.country ? `Zemlja: ${G.country}` : "",
        G.adults ? `${G.adults} odraslih` : "",
        G.kids > 0 ? `${G.kids} djece (${G.kidsAges.join(',')} god)` : "",
        G.interests?.length ? `Interesi: ${G.interests.join(', ')}` : "",
        G.car ? "Ima auto" : "",
      ].filter(Boolean).join(". ");
      const senseCtx = senseData ? [
        senseData.beach ? `Plaža: ${senseData.beach.crowd} (${senseData.beach.occupancy_pct}% popunjenost, best time: ${senseData.beach.best_time})` : "",
        senseData.parking ? `Parking: ${senseData.parking.free_spots}/${senseData.parking.total_spots} slobodnih mjesta (${senseData.parking.status})` : "",
        senseData.marina ? `Marina: ${senseData.marina.free_moorings} slobodnih vezova (${senseData.marina.status})` : "",
      ].filter(Boolean).join(" | ") : "";
      const sys = `Ti si lokalni turistički vodič za ${kioskCity}, Hrvatska. Adriatic coast.
${guestCtx ? guestCtx + "." : ""}
VRIJEME: ${weather.temp}°C ${weather.icon}, UV ${weather.uv}, more ${weather.sea}°C, zalazak ${weather.sunset}.
LOKACIJA: ${kioskCity}.
${senseCtx ? "LIVE STATUS: " + senseCtx + "." : ""}
Odgovaraš na ${langName}. Kratko (3-5 rečenica), toplo, konkretno s cijenama i udaljenostima. Bez emoji.`;
      // Map guest segment to chat mode
      const delta = loadDelta();
      const SEG_TO_MODE = { kamper:"camper", jedrilicar:"sailing", kruzer:"cruiser", standard:"apartment" };
      const chatMode = SEG_TO_MODE[delta.segment] || SEG_TO_MODE[G.segment] || "default";
      // Detect region from kiosk coords OR transit destination
      const regionCoords = kioskCoords || transitToCoords;
      const chatRegion = regionCoords
        ? Object.entries({ istra:[45.1,13.9], kvarner:[45.0,14.5], zadar:[44.1,15.3], split:[43.5,16.5], makarska:[43.3,17.0], dubrovnik:[42.65,18.1] })
            .sort(([,a],[,b]) => Math.hypot(regionCoords[0]-a[0],regionCoords[1]-a[1]) - Math.hypot(regionCoords[0]-b[0],regionCoords[1]-b[1]))[0]?.[0]
        : "kvarner";

      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }],
          mode: chatMode,
          region: chatRegion,
          lang: lang || "hr",
          weather: weather || undefined,
          guide_cards: preTripGuideCards.length ? preTripGuideCards : undefined,
          plan: premium ? "season" : "free",
          delta_context: delta,
          freeMsgUsed: premium ? -1 : freeMsgUsed,
          deviceId: (() => { try { return localStorage.getItem("jadran_push_deviceId") || ""; } catch { return ""; } })(),
          emergencyAlerts: alerts.filter(a => a.severity === "critical" || a.severity === "high" || a.severity === "medium")
            .slice(0, 10).map(a => ({ type: a.type, severity: a.severity, region: a.region, title: a.title, description: a.description, count: a.count, source: a.source })),
          navtexData: navtexData || undefined,
          lastUserMessage: msg,
          camperLen: delta.camperLen || undefined,
          camperHeight: delta.camperHeight || undefined,
          ...(gpsPosition ? { userLat: gpsPosition.lat, userLng: gpsPosition.lng } : {}),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.content?.map(c => c.text || "").join("") || data.error || "...";
      setChatMsgs(p => [...p, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("[chat]", err);
      setChatMsgs(p => [...p, { role: "assistant", text: "⚠️ " + ({"hr":"Nema veze. Pokušaj ponovo.","de":"Keine Verbindung. Bitte erneut versuchen.","en":"No connection. Please try again.","it":"Nessuna connessione. Riprova."})[lang] || "Nema veze." }]);
    }
    setChatLoading(false);
  };

  /* ─── COLORS ─── */
  // ─── TIME-AWARE COLOR SYSTEM ───
  // ─── THEME (day/night from makeTheme in ui.jsx) ───
  const C = makeTheme(hour);
  const fonts = FONT_LINK;

  // ─── UI PRIMITIVES: Badge, Btn, Card, SectionLabel, BackBtn, Icon, IC → imported from ./ui

  const AlertsBar = () => {
    // Show only most severe unread alert — single row, no map displacement
    const critical = alerts.filter(a => (a.severity === "critical" || a.severity === "high") && !dismissedAlerts.has(a.title));
    if (!critical.length) return null;
    const a = critical[0];
    const icon = ALERT_ICONS[a.type] || ALERT_ICONS.default;
    const color = a.severity === "critical" ? "#ef4444" : "#f59e0b";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: `${color}0B`, border: `1px solid ${color}22`, minHeight: 32, marginBottom: 8, overflow: "hidden" }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
        {critical.length > 1 && <span style={{ fontSize: 9, color, flexShrink: 0, fontWeight: 700 }}>+{critical.length - 1}</span>}
        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${color}18`, color, fontWeight: 700, flexShrink: 0 }}>{a.severity === "critical" ? "LIVE" : "⚠️"}</span>
        <button onClick={() => setDismissedAlerts(s => new Set([...s, a.title]))} aria-label="Zatvori upozorenje" style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer", padding: "8px", flexShrink: 0, lineHeight: 1, minWidth: 44, minHeight: 44, display: "grid", placeItems: "center" }}>×</button>
      </div>
    );
  };

  /* ─── PAYWALL ─── */
  const Paywall = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 300, display: "grid", placeItems: "center", padding: "24px 16px", paddingTop: "calc(24px + env(safe-area-inset-top, 0px))", paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }} onClick={() => { setShowPaywall(false); setShowRecovery(false); setRecoveryStatus(null); setRecoveryEmail(""); }}>
      <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 28, maxWidth: 440, width: "100%", padding: "40px 28px", border: `1px solid rgba(251,191,36,0.15)`, textAlign: "center", maxHeight: "calc(100dvh - 80px)", overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative" }}>
        <button onClick={() => { setShowPaywall(false); setShowRecovery(false); setRecoveryStatus(null); setRecoveryEmail(""); }}
          style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"50%", width:32, height:32, display:"grid", placeItems:"center", cursor:"pointer", color:C.mut, fontSize:16, lineHeight:1, zIndex:1 }}
          aria-label="Zatvori">✕</button>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("premiumTitle",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {t("premiumDesc",lang)}
        </div>
        {/* Plan selector — 3 tiers, season default (decoy) */}
        {(() => {
          const plans = [
            { id:"week",   price:"9.99€",  days:7,  label:{hr:"Explorer",de:"Explorer",en:"Explorer",it:"Explorer"},     sub:{hr:"7 dana",de:"7 Tage",en:"7 days",it:"7 giorni"} },
            { id:"season", price:"19.99€", days:30, label:{hr:"Sezona",de:"Saison",en:"Season",it:"Stagione"},           sub:{hr:"30 dana",de:"30 Tage",en:"30 days",it:"30 giorni"}, badge:{hr:"NAJPOPULARNIJE",de:"BELIEBTESTE",en:"MOST POPULAR",it:"PIÙ POPOLARE"} },
            { id:"vip",    price:"49.99€", days:30, label:{hr:"VIP Sezona",de:"VIP-Saison",en:"VIP Season",it:"Stagione VIP"}, sub:{hr:"30 dana · Claude Opus · 300 msg",de:"30 Tage · Claude Opus · 300 Msg",en:"30 days · Claude Opus · 300 msg",it:"30 giorni · Claude Opus · 300 msg"} },
          ];
          return (
            <div style={{ display:"flex", gap:8, marginBottom:18 }}>
              {plans.map(p => {
                const active = selectedPlan === p.id;
                return (
                  <div key={p.id} onClick={() => setSelectedPlan(p.id)}
                    style={{ flex:1, borderRadius:14, padding:"12px 8px", textAlign:"center", cursor:"pointer", position:"relative",
                      background: active ? C.goDim : "rgba(255,255,255,0.03)",
                      border: active ? `1.5px solid ${C.gold}` : "1.5px solid rgba(255,255,255,0.08)",
                      transition:"all 0.2s" }}>
                    {p.badge && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:C.gold, color:"#0a0f1a", fontSize:8, fontWeight:800, letterSpacing:1, padding:"2px 8px", borderRadius:20, whiteSpace:"nowrap", ...dm }}>
                      {p.badge[lang]||p.badge.en}
                    </div>}
                    <div style={{ ...dm, fontSize:18, fontWeight:700, color: active ? C.gold : C.text, marginBottom:1 }}>{p.price}</div>
                    <div style={{ ...dm, fontSize:11, fontWeight:700, color: active ? C.gold : C.text, marginBottom:2 }}>{p.label[lang]||p.label.en}</div>
                    <div style={{ ...dm, fontSize:9, color:C.mut }}>{p.sub[lang]||p.sub.en}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {(() => {
          const pf = {
            week: {
              hr:["AI Vodič (Claude) — chat 24/7","8 jezika, bez registracije","Rute i navigacija (kamper / nautika)","Preporuke restorana, plaža i parkinga","Vremenska upozorenja"],
              de:["AI-Guide (Claude) — Chat 24/7","8 Sprachen, ohne Registrierung","Routen & Navigation (Camper / Nautik)","Restaurant-, Strand- und Parkempfehlungen","Wetterwarnungen"],
              en:["AI Guide (Claude) — chat 24/7","8 languages, no registration","Routes & navigation (camper / nautical)","Restaurant, beach & parking tips","Weather alerts"],
              it:["Guida AI (Claude) — chat 24/7","8 lingue, senza registrazione","Percorsi e navigazione (camper / nautica)","Consigli ristoranti, spiagge e parcheggi","Avvisi meteo"],
              si:["AI Vodič (Claude) — klepet 24/7","8 jezikov, brez registracije","Poti in navigacija","Priporočila restavracij in plaž","Vremenska opozorila"],
              cz:["AI Průvodce (Claude) — chat 24/7","8 jazyků, bez registrace","Trasy a navigace","Doporučení restaurací a pláží","Meteorologická upozornění"],
              pl:["Przewodnik AI (Claude) — czat 24/7","8 języków, bez rejestracji","Trasy i nawigacja","Polecenia restauracji i plaż","Alerty pogodowe"],
            },
            season: {
              hr:["Sve iz Explorera +","6 Hidden Gems sa lokalnim savjetima","Analiza fotografija mjesta (Lens)","Glasovni asistent (Walkie)","Rezervacije aktivnosti s vodičem","Guardian — sigurnosna upozorenja","Loyalty bodovi i popusti"],
              de:["Alles aus Explorer +","6 Hidden Gems mit lokalen Tipps","Fotoanalyse von Orten (Lens)","Sprachassistent (Walkie)","Aktivitätsbuchungen mit Guide","Guardian — Sicherheitswarnungen","Treuepunkte & Rabatte"],
              en:["Everything in Explorer +","6 Hidden Gems with local tips","Photo analysis of places (Lens)","Voice assistant (Walkie)","Guided activity bookings","Guardian — safety alerts","Loyalty points & discounts"],
              it:["Tutto di Explorer +","6 Gemme nascoste con consigli locali","Analisi foto dei luoghi (Lens)","Assistente vocale (Walkie)","Prenotazione attività guidate","Guardian — avvisi di sicurezza","Punti fedeltà e sconti"],
              si:["Vse iz Explorerja +","6 skritih draguljev","Analiza fotografij (Lens)","Glasovni asistent (Walkie)","Rezervacije aktivnosti","Guardian — varnostna opozorila","Točke zvestobe in popusti"],
              cz:["Vše z Exploreru +","6 skrytých perel","Analýza fotografií (Lens)","Hlasový asistent (Walkie)","Rezervace aktivit s průvodcem","Guardian — bezpečnostní upozornění","Věrnostní body a slevy"],
              pl:["Wszystko z Explorera +","6 ukrytych pereł","Analiza zdjęć (Lens)","Asystent głosowy (Walkie)","Rezerwacje aktywności z przewodnikiem","Guardian — alerty bezpieczeństwa","Punkty lojalnościowe i zniżki"],
            },
            vip: {
              hr:["Sve iz Sezone +","Claude Opus — najmoćniji AI model","300 poruka dnevno (3× više od Sezone)","Prioritetni odgovori bez čekanja","VIP podrška"],
              de:["Alles aus Season +","Claude Opus — leistungsstärkstes AI-Modell","300 Nachrichten/Tag (3× mehr als Season)","Prioritätsantworten ohne Wartezeit","VIP-Support"],
              en:["Everything in Season +","Claude Opus — most powerful AI model","300 messages/day (3× more than Season)","Priority responses, no queue","VIP support"],
              it:["Tutto di Season +","Claude Opus — modello AI più potente","300 messaggi/giorno (3× di Season)","Risposte prioritarie, nessuna coda","Supporto VIP"],
              si:["Vse iz Sezone +","Claude Opus — najmočnejši AI model","300 sporočil/dan","Prednostni odgovori","VIP podpora"],
              cz:["Vše ze Season +","Claude Opus — nejmocnější AI model","300 zpráv/den","Prioritní odpovědi bez čekání","VIP podpora"],
              pl:["Wszystko z Season +","Claude Opus — najpotężniejszy model AI","300 wiadomości/dzień","Odpowiedzi priorytetowe","Wsparcie VIP"],
            },
          };
          const list = (pf[selectedPlan]||pf.season)[lang] || (pf[selectedPlan]||pf.season).en;
          return (
            <div style={{ ...dm, fontSize: 12, color: C.mut, lineHeight: 1.9, marginBottom: 18, textAlign: "left" }}>
              {list.map((f, i) => <div key={i}>✓ {f}</div>)}
            </div>
          );
        })()}
        <Btn warm disabled={payLoading} style={{ width: "100%", marginBottom: 10, opacity: payLoading ? 0.6 : 1 }} onClick={() => !payLoading && startPremiumCheckout(selectedPlan)}>
          {payLoading ? "⏳..." : ({hr:`Otključaj ${selectedPlan==="week"?"Explorer":selectedPlan==="season"?"Sezonu":"VIP"} →`,de:`${selectedPlan==="week"?"Explorer":selectedPlan==="season"?"Saison":"VIP"} freischalten →`,en:`Unlock ${selectedPlan==="week"?"Explorer":selectedPlan==="season"?"Season":"VIP"} →`,it:`Sblocca ${selectedPlan==="week"?"Explorer":selectedPlan==="season"?"Stagione":"VIP"} →`})[lang]||`Unlock ${selectedPlan} →`}
        </Btn>
        {/* Anthropic / Claude badge */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, marginBottom:6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-label="Anthropic"><path d="M14.25 2h-4.5L3 22h4.5l1.5-4.5h6l1.5 4.5H21L14.25 2zm-5.5 12 3.25-9.5 3.25 9.5H8.75z" fill="#D97706"/></svg>
          <span style={{ ...dm, fontSize:10, fontWeight:700, color:"#D97706", letterSpacing:0.5 }}>Claude</span>
          <span style={{ ...dm, fontSize:10, color:C.mut }}>by Anthropic</span>
        </div>
        <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 8 }}>{t("payVia",lang)}</div>

        {/* Recovery */}
        {!showRecovery ? (
          <button onClick={() => { setShowRecovery(true); setRecoveryStatus(null); setRecoveryError(""); }}
            style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", textDecoration: "underline", opacity: 0.8, padding: "6px 12px" }}>
            {({hr:"Već ste platili?",de:"Bereits bezahlt?",en:"Already paid?",it:"Già pagato?",si:"Že plačano?",cz:"Už jste platili?",pl:"Już zapłacono?"})[lang] || "Već ste platili?"}
          </button>
        ) : (
          <div style={{ padding: "12px 16px", marginTop: 8, borderRadius: 12, background: "rgba(14,165,233,0.06)", border: `1px solid rgba(14,165,233,0.15)` }}>
            {recoveryStatus === "success" ? (
              <div style={{ textAlign: "center", color: "#22c55e", fontSize: 13, fontWeight: 600, padding: 8 }}>
                {({hr:"Pristup obnovljen!",de:"Zugang wiederhergestellt!",en:"Access restored!",it:"Accesso ripristinato!"})[lang] || "Pristup obnovljen!"}
              </div>
            ) : (
              <>
                <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 8 }}>
                  {({hr:"Unesite email s kojim ste platili",de:"E-Mail eingeben, mit der Sie bezahlt haben",en:"Enter the email you used at checkout",it:"Inserisci l'email usata per il pagamento"})[lang] || "Unesite email"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="email" inputMode="email" autoComplete="email" autoFocus
                    value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{ ...dm, flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${recoveryStatus === "error" || recoveryStatus === "expired" ? "#ef4444" : C.bord}`, background: "rgba(255,255,255,0.06)", color: C.text, fontSize: 14, outline: "none" }}
                    onKeyDown={e => { if (e.key === "Enter") document.getElementById("jadran-app-recover-btn")?.click(); }}
                  />
                  <button id="jadran-app-recover-btn"
                    disabled={recoveryStatus === "loading" || !recoveryEmail.includes("@")}
                    onClick={() => {
                      setRecoveryStatus("loading"); setRecoveryError("");
                      const did = localStorage.getItem("jadran_push_deviceId") || `dev_${Date.now()}`;
                      fetch("/api/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recoveryEmail.trim(), deviceId: did }) })
                        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d })))
                        .then(({ ok, status, data }) => {
                          if (ok && data.recovered) {
                            setRecoveryStatus("success");
                            setPremium(true);
                            try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
                            setTimeout(() => { setShowPaywall(false); setShowRecovery(false); }, 1500);
                          } else {
                            setRecoveryStatus(status === 410 ? "expired" : "error");
                            setRecoveryError(status === 410 ? "Pretplata istekla" : (data.error || "Plaćanje nije pronađeno"));
                          }
                        })
                        .catch(() => { setRecoveryStatus("error"); setRecoveryError("Greška. Pokušajte ponovo."); });
                    }}
                    style={{ ...dm, padding: "12px 18px", borderRadius: 10, border: "none", background: recoveryStatus === "loading" ? C.mut : C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: recoveryStatus === "loading" ? "wait" : "pointer", whiteSpace: "nowrap", opacity: !recoveryEmail.includes("@") ? 0.5 : 1 }}>
                    {recoveryStatus === "loading" ? "..." : ({hr:"Obnovi",de:"Wiederherstellen",en:"Restore",it:"Ripristina"})[lang] || "Obnovi"}
                  </button>
                </div>
                {recoveryError && <div style={{ ...dm, color: "#ef4444", fontSize: 11, marginTop: 6, textAlign: "center" }}>{recoveryError}</div>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ─── BOOKING CONFIRM ─── */
  const BookConfirm = () => showConfirm && (() => {
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(5,14,30,0.88)", zIndex:250, display:"grid", placeItems:"center" }}
        onClick={() => setShowConfirm(null)}>
        <div onClick={e => e.stopPropagation()} style={{ background:C.card, borderRadius:24, padding:40,
          textAlign:"center", maxWidth:420, border:`1px solid rgba(14,165,233,0.15)` }}>
          <div className="check-anim" style={{ width:80, height:80, borderRadius:"50%",
            background:`linear-gradient(135deg,${C.accent},#0284c7)`, display:"grid", placeItems:"center",
            fontSize:40, margin:"0 auto 20px", color:"#fff", boxShadow:"0 8px 32px rgba(14,165,233,0.35)" }}>✓</div>
          <div style={{ fontSize:22, fontWeight:400, marginBottom:6 }}>{t("bookSent",lang)}</div>
          <div style={{ ...dm, color:C.mut, fontSize:14, marginBottom:16, lineHeight:1.6 }}>
            {t("bookConfirm",lang)}
          </div>
          <div style={{ fontSize:18, color:C.accent, marginBottom:20 }}>{showConfirm}</div>
          <Btn primary onClick={() => setShowConfirm(null)}>OK</Btn>
        </div>
      </div>
    );
  })();

  /* ══════════════════════════════
     PHASE 1: PRE-TRIP
     ══════════════════════════════ */
  const PreTrip = () => {
    if (subScreen === "onboard") return (
      <div style={{ maxWidth: 540, margin: "32px auto", textAlign: "center" }}>
        {returningKiosk?.city && (
          <div onClick={() => { if (returningKiosk.premium) setPremium(true); if (returningKiosk.lang) setLang(returningKiosk.lang); setPhase("kiosk"); setSubScreen("home"); }}
            style={{ marginBottom: 20, padding: "16px 20px", borderRadius: 18, background: "linear-gradient(135deg,rgba(201,168,76,0.12),rgba(245,215,142,0.06))", border: "1px solid rgba(201,168,76,0.30)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
            <span style={{ fontSize: 32 }}>🏝</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...dm, fontSize: 13, fontWeight: 700, color: "#F5D78E", letterSpacing: 0.3 }}>My Jadran</div>
              <div style={{ ...dm, fontSize: 12, color: "rgba(245,215,142,0.6)", marginTop: 2 }}>Nastavi gdje si stao — {returningKiosk.city}</div>
            </div>
            <span style={{ color: "#F5D78E", fontSize: 18 }}>→</span>
          </div>
        )}
        {onboardStep === 0 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }} className="emoji-float">🌊</div>
            <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginBottom: 8, background: `linear-gradient(135deg,${C.text} 30%,${C.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("welcome",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              {t("hostUsesName",lang).replace("{HOST}","")}<strong style={{ color: C.gold }}>{G.host}</strong><br />{t("onboardSub",lang)}
            </div>
            <Btn primary onClick={() => setOnboardStep(1)}>{t("createProfile",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 1 && (
          <Card style={{ padding: 32 }}>
            <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>{t("step1",lang)}</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>{t("interests",lang)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 10, marginBottom: 24 }}>
              {INTERESTS.map(opt => (
                <div key={opt.k} onClick={() => setInterests(p => { const n = new Set(p); n.has(opt.k) ? n.delete(opt.k) : n.add(opt.k); return n; })}
                  style={{ padding: "16px 8px", background: interests.has(opt.k) ? C.acDim : C.card, border: `1px solid ${interests.has(opt.k) ? "rgba(14,165,233,0.25)" : C.bord}`, borderRadius: 14, cursor: "pointer", textAlign: "center", ...dm, fontSize: 13, color: interests.has(opt.k) ? C.accent : C.mut, transition: "all 0.3s" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{opt.e}</span>{(INTEREST_LABELS[opt.k]||{})[lang] || (INTEREST_LABELS[opt.k]||{}).hr || opt.k}
                </div>
              ))}
            </div>
            <Btn primary onClick={() => setOnboardStep(2)}>{t("next",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 2 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("profileDone",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {t("preparing",lang)}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {[...interests].map(k => { const o = INTERESTS.find(x => x.k === k); return o ? <Badge key={k} c="accent">{o.e} {(INTEREST_LABELS[k]||{})[lang] || (INTEREST_LABELS[k]||{}).hr || k}</Badge> : null; })}
            </div>
            <Btn primary onClick={() => { try { window.fbq?.("track", "CompleteRegistration", { content_name: "onboarding", status: true }); } catch {} setSubScreen("pretrip"); }}>{t("toPreTrip",lang)}</Btn>
          </Card>
        )}
      </div>
    );

    if (subScreen === "pretrip") return (
      <>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:16 }}>
          <BackBtn onClick={() => setSubScreen("onboard")} label={({hr:"Uredi profil",de:"Profil bearbeiten",en:"Edit profile",it:"Modifica profilo",si:"Uredi profil",cz:"Upravit profil",pl:"Edytuj profil"})[lang] || "Uredi profil"} />
        </div>
        <div style={{ padding: "8px 0 8px" }}>
          <div style={{ fontSize: 30, fontWeight: 400 }}>{Math.max(0, Math.ceil((new Date(G.arrival) - new Date()) / 86400000))} {t("daysToGo",lang)} ☀️</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>{new Date(G.arrival).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long"})} – {new Date(G.departure).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long",year:"numeric"})} · {G.accommodation}</div>
        </div>
        <SectionLabel>{t("forecast",lang)}</SectionLabel>
        <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
          {(forecast || FORECAST_DEFAULT).map((d, i) => {
            const locked = !premium && i >= 3;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: 12, position: "relative", cursor: locked ? "pointer" : "default" }}
                onClick={() => locked && setShowPaywall(true)}>
                <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1 }}>{(FORECAST_DAYS[lang]||FORECAST_DAYS.hr)[d.di]}</div>
                <div style={{ fontSize: 22, margin: "4px 0", filter: locked ? "blur(4px)" : "none" }}>{d.icon}</div>
                <div style={{ ...dm, fontSize: 13, color: C.mut, filter: locked ? "blur(4px)" : "none" }}>{d.h}°</div>
                {locked && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span style={{ fontSize: 14, color: C.gold }}>🔒</span></div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel extra="AI">{t("optPlan",lang)}</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>{t("rainDay",lang)}</strong> — {t("palaceTour",lang)}. <strong style={{ color: C.green }}>{t("sunnyDay",lang)}</strong> — {t("beachKayak",lang)}.
              {t("aiOptimized",lang)}
            </div>
          </Card>
          <Card>
            <SectionLabel>{t("packages",lang)}</SectionLabel>
            {BUNDLES.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "10px 0", borderBottom: i < BUNDLES.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                <div><span style={{ marginRight: 8 }}>{b.emoji}</span><span style={{ ...dm, fontSize: 14 }}>{b.name[lang] || b.name.hr}</span></div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, maxWidth: 160 }}>{b.tip[lang] || b.tip.hr}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Accommodation — Booking.com Affiliate */}
        <SectionLabel extra="Booking.com">{t("findStay",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {ACCOMMODATION.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
              onClick={e => { e.preventDefault(); setInAppUrl(a.link); }}
              style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ cursor: "pointer", padding: 16, transition: "all 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <CityIcon name={a.name.hr || a.name.en} size={24} />
                  <Badge c="accent">{a.region.toUpperCase()}</Badge>
                </div>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{a.name[lang] || a.name.hr}</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{a.note[lang] || a.note.hr}</div>
                <div style={{ ...dm, fontSize: 11, color: "#0055A6", marginTop: 8, fontWeight: 600 }}>{t("browseOn",lang)}</div>
              </Card>
            </a>
          ))}
        </div>

        {/* Top aktivnosti — Viator preview */}
        <SectionLabel extra="Viator">Top aktivnosti</SectionLabel>
        {viatorLoading && <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 16 }}>Učitavam aktivnosti…</div>}
        {(viatorActs || VIATOR_FALLBACK).slice(0, 3).map(act => {
          const inWishlist = viatorWishlist.some(a => a.productCode === act.productCode);
          return (
            <Card key={act.productCode} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
              {act.images?.[0] && <img src={act.images[0]} alt={act.title} style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />}
              {!act.images?.[0] && <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>🎯</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.title}</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut }}>⏱ {act.duration} · <span style={{ color: C.accent }}>{act.price}€</span> / osobi</div>
              </div>
              <button onClick={() => toggleViatorWishlist(act)}
                style={{ padding: "6px 14px", borderRadius: 10, border: `1px solid ${inWishlist ? "rgba(34,197,94,0.3)" : C.bord}`, background: inWishlist ? "rgba(34,197,94,0.1)" : "transparent", color: inWishlist ? "#22c55e" : C.mut, fontSize: 12, cursor: "pointer", ...dm, flexShrink: 0, fontWeight: inWishlist ? 600 : 400 }}>
                {inWishlist ? "💚 Dodano" : "Saznaj više"}
              </button>
            </Card>
          );
        })}

        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Btn primary onClick={() => setSubScreen("transit")}>{t("simArrival",lang)}</Btn>
        </div>
      </>
    );

    // Chat accessible from transit — same component, back goes to transit
    if (subScreen === "chat") {
      const prompts = [t("chatPrompt1",lang), t("chatPrompt2",lang), t("chatPrompt3",lang), t("chatPrompt4",lang)];
      const canSend = premium || freeMsgUsed < 5;
      return (
        <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", background: C.bg }}>
          <div style={{ flexShrink: 0, padding: "12px 16px 8px", paddingTop: "calc(12px + env(safe-area-inset-top, 0px))", borderBottom: `1px solid ${C.bord}` }}>
            <BackBtn onClick={() => setSubScreen("transit")} label={({hr:"← Ruta",de:"← Route",en:"← Route",it:"← Percorso"})[lang] || "← Ruta"} />
          </div>
          <div className="scroll-smooth" style={{ flex: 1, overflowY: "auto", padding: "12px 16px", WebkitOverflowScrolling: "touch" }}>
            {chatMsgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 8px" }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🌊</div>
                <div style={{ fontSize: 22, fontWeight: 300, marginBottom: 6 }}>{t("askAnything",lang)}</div>
                <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 18 }}>{t("askDalmatia",lang)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {prompts.map((p, i) => (
                    <button key={i} onClick={() => setChatInput(p)} style={{ ...dm, padding: "10px 14px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 12, color: C.text, fontSize: 13, cursor: "pointer", minHeight: 44, textAlign: "left" }}>{p}</button>
                  ))}
                </div>
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div key={i} style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "rgba(14,165,233,0.08)" : "rgba(186,230,253,0.03)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.65, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
                {m.role !== "user" && <div style={{ fontSize: 9, color: C.accent, marginBottom: 5, letterSpacing: 1.5, fontWeight: 700 }}>JADRAN AI</div>}
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div style={{ ...dm, display: "inline-flex", padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <div style={{ flexShrink: 0, padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${C.bord}`, background: C.bg, display: "flex", flexDirection: "column", gap: 8 }}>
            {!premium && (() => {
              const left = Math.max(0, 5 - freeMsgUsed);
              return left > 0 ? (
                <div style={{ ...dm, fontSize: 11, color: left === 1 ? C.gold : C.mut, textAlign: "center" }}>
                  {({hr:`${left} od 5 besplatnih poruka`,de:`${left} von 5 kostenlosen Nachrichten`,en:`${left} of 5 free messages`,it:`${left} di 5 messaggi gratuiti`})[lang] || `${left}/5`}
                </div>
              ) : (
                <div onClick={() => setShowPaywall(true)} style={{ ...dm, fontSize: 12, color: C.gold, textAlign: "center", padding: "8px 12px", cursor: "pointer", background: C.goDim, borderRadius: 10, border: `1px solid ${C.goBorder}` }}>
                  ⭐ {({hr:"Nadogradi za neograničen chat",de:"Upgrade für unbegrenzten Chat",en:"Upgrade for unlimited chat",it:"Aggiorna per chat illimitata"})[lang] || "Upgrade →"}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && canSend && doChat()}
                placeholder={t("askPlaceholder",lang)}
                inputMode="text" autoCorrect="off" autoCapitalize="sentences" spellCheck={false} autoComplete="off"
                style={{ ...dm, flex: 1, padding: "13px 16px", background: "rgba(186,230,253,0.05)", border: `1px solid ${C.bord}`, borderRadius: 20, color: C.text, fontSize: 16, outline: "none", minHeight: 48 }} />
              <button onClick={() => canSend ? doChat() : setShowPaywall(true)}
                style={{ padding: "0 20px", background: canSend ? `linear-gradient(135deg,${C.accent},#0284c7)` : C.goDim, border: canSend ? "none" : `1px solid ${C.goBorder}`, borderRadius: 20, color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 600, minWidth: 52, minHeight: 48, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {canSend ? "→" : "⭐"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (subScreen === "transit") return (
      <>
        <div style={{ display:"flex", alignItems:"center", paddingTop:16, paddingBottom:8 }}>
          <BackBtn onClick={() => transitFromUrl ? (window.location.href = "/") : setSubScreen("pretrip")} label={({hr:"← Promijeni rutu",de:"← Route ändern",en:"← Change route",it:"← Cambia percorso",si:"← Spremeni pot",cz:"← Změnit trasu",pl:"← Zmień trasę"})[lang] || "← Promijeni rutu"} />
        </div>
        {/* ── HERE Map ── */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.bord}`, marginBottom: 0 }}>
          {transitFromCoords && transitToCoords ? (
            <TransitMap
              fromCoords={transitFromCoords}
              toCoords={transitToCoords}
              transportMode={transitSegUrl || "auto"}
              onRouteReady={setTransitRouteData}
              gpsPosition={gpsPosition}
            />
          ) : (
            <div style={{ height: 300, background: "#0c1426", display: "grid", placeItems: "center" }}>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>Učitavam HERE mapu…</div>
            </div>
          )}
        </div>

        {/* ── HERE Navigation (inside map card) ── */}
        {transitRouteData && (
          <div className="route-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: `rgba(14,165,233,0.04)`, borderRadius: "0 0 16px 16px", border: `1px solid ${C.bord}`, borderTop: "none", marginBottom: 16 }}>
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>
              🛣 {transitRouteData.km} km · ⏱ {transitRouteData.hrs}h {transitRouteData.mins}min
              {transitRouteData.estimated && <span style={{ fontSize: 10, color: C.gold, marginLeft: 6 }}>(procjena)</span>}
            </div>
            <button onClick={() => {
              const { oLat, oLng, dLat, dLng } = transitRouteData;
              window.location.href = `https://wego.here.com/directions/drive/${oLat},${oLng}/${dLat},${dLng}`;
            }}
              style={{ padding: "8px 18px", borderRadius: 10, background: `linear-gradient(135deg,#48dad0,#0ea5e9)`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...dm, whiteSpace: "nowrap" }}>
              📍 HERE Navigacija
            </button>
          </div>
        )}

        {/* ── Trip action button — always visible ── */}
        <div style={{ padding: "12px 0" }}>
          {!tripActive ? (
            <button onClick={startTrip} className="trip-btn" style={{
              width: "100%", padding: "16px 40px", borderRadius: 16, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, #22c55e, #16a34a)`,
              color: "#fff", fontSize: 16, fontWeight: 700, ...dm,
              boxShadow: "0 4px 24px rgba(34,197,94,0.3)",
              animation: "pulse 2s infinite",
            }}>
              🚀 {lang === "de" || lang === "at" ? "Reise starten" : lang === "en" ? "Start trip" : lang === "it" ? "Inizia viaggio" : "Krećem na put"}
            </button>
          ) : (
            <div>
              {/* Tracking phase status bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 14, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", marginBottom: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0, animation: "pulse 2s infinite" }} />
                <span style={{ ...dm, fontSize: 12, color: "#4ade80", flex: 1 }}>
                  {lang === "de" || lang === "at" ? "Guardian überwacht — kritische Warnungen werden als Benachrichtigungen gesendet" : lang === "en" ? "Guardian monitoring — critical alerts sent as notifications" : lang === "it" ? "Guardian monitora — avvisi critici come notifiche" : "Guardian prati — kritična upozorenja stižu kao notifikacije"}
                </span>
              </div>
              <Btn primary onClick={() => { try { window.fbq?.("track", "Lead", { content_name: "arrived", content_category: transitDestCity || kioskCity }); } catch {} ensureTrialStart(); setKioskWelcome(true); setNearbyData(null); setPhase("kiosk"); setSubScreen("home"); updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home", lang, destination: transitDestCity || kioskCity, segment: transitSegUrl || "auto", lastAccess: new Date().toISOString() }); }}>{t("arrived",lang)}</Btn>
            </div>
          )}
        </div>

        {/* ── PULS JADRANA — unified intelligence feed ── */}
        <RouteGuide
          fromCoords={transitFromCoords}
          toCoords={transitToCoords}
          seg={transitSegUrl || "auto"}
          lang={lang}
          dm={dm}
          C={C}
          extraCards={[
            ...alerts
              .filter(a => !dismissedAlerts.has(a.title))
              .filter(a => !(a.source || "").includes("Auswärtiges"))  // irrelevant for route
              .filter(a => a.title && a.title.length > 5)
              .reduce((acc, a) => {  // deduplicate by first 40 chars
                const key = (a.title || "").slice(0, 40);
                if (!acc.seen.has(key)) { acc.seen.add(key); acc.items.push(a); }
                return acc;
              }, { seen: new Set(), items: [] }).items
              .slice(0, 3)  // max 3 alerts
              .map(a => ({
              id: "alert_" + (a.title || "").slice(0, 20),
              type: a.type || "alert",
              severity: a.severity === "critical" ? "critical" : a.severity === "high" ? "warning" : "info",
              icon: ALERT_ICONS[a.type] || "⚠️",
              title: a.title || "Upozorenje",
              body: "",  // title is enough, no duplicate body
              source: a.source || "HAK",
              ts: a.ts || new Date().toISOString(),
            })),
            ...gpsCards,
          ]}
        />

        {/* ── Arrival ── */}
        {geoArrival && arrivalCountdown !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ fontSize: 80 }}>⚓</div>
            <div style={{ ...hf, fontSize: 32, fontWeight: 300, textAlign: "center" }}>
              Dobrodošli,<br /><span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}!</span>
            </div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.accent}`, display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 32, fontWeight: 300 }}>{arrivalCountdown}</span>
            </div>
            <button onClick={() => { ensureTrialStart(); setKioskWelcome(true); setNearbyData(null); setPhase("kiosk"); setSubScreen("home"); updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" }); setArrivalCountdown(null); }}
              style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},#0284c7)`, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", ...dm }}>
              Uđi u Kiosk →
            </button>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════
     PHASE 2: KIOSK (STAY)
     ══════════════════════════════ */

  // ─── GPS → Nearby: detect location and fetch nearby POIs ───
  useEffect(() => {
    if (phase !== "kiosk") return;
    if (nearbyData) return; // already fetched

    const fetchNearby = (lat, lng) => {
      setKioskCoords([lat, lng]);
      setNearbyLoading(true);
      fetch(`/api/nearby?lat=${lat}&lng=${lng}&cats=parking,food,shop,beach,pharmacy,bakery,culture,fuel&limit=5&lang=${lang}`)
        .then(r => r.json())
        .then(data => {
          setNearbyData(data.error ? { location: { city: transitDestCity || "Jadran" }, categories: {} } : data);
          setNearbyLoading(false);
          // DON'T auto-dismiss welcome — user clicks "Explore" button
        })
        .catch(() => {
          setNearbyData({ location: { city: transitDestCity || "Jadran" }, categories: {} });
          setNearbyLoading(false);
        });
    };

    // Priority: forced coords (?kiosk= URL) → GPS → transitToCoords → delta → Split
    const delta = loadDelta();
    const fallbackLat = transitToCoords?.[0] || delta.destination?.lat || 43.508;
    const fallbackLng = transitToCoords?.[1] || delta.destination?.lng || 16.440;

    if (kioskForcedCoords.current) {
      // ?kiosk= URL param forces specific location — never use GPS
      fetchNearby(kioskForcedCoords.current[0], kioskForcedCoords.current[1]);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
        () => fetchNearby(fallbackLat, fallbackLng),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      fetchNearby(fallbackLat, fallbackLng);
    }
  }, [phase]); // eslint-disable-line

  // Transit destination city — for welcome screen and fallbacks
  const transitDestCity = loadDelta().destination?.city || (transitToCoords ? "" : "Jadran");

  // Nearby city name for display
  const kioskCity = nearbyData?.location?.city || transitDestCity || "Jadran";

  // ─── YOLO Sense: parking/marina/beach status ───
  useEffect(() => {
    if (phase !== "kiosk") return;
    const fetchSense = () => {
      fetch(`/api/sense?city=${encodeURIComponent(kioskCity)}`)
        .then(r => r.json()).then(setSenseData).catch(() => {});
    };
    fetchSense();
    const iv = setInterval(fetchSense, 600000); // 10 min
    return () => clearInterval(iv);
  }, [phase, kioskCity]);

  // ─── Emergency alerts from TZ Dashboard ───
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const [emergencyNearby, setEmergencyNearby] = useState(null);
  useEffect(() => {
    if (subScreen !== "emergency") return;
    const lat = nearbyData?.location?.lat || kioskCoords?.[0];
    const lng = nearbyData?.location?.lng || kioskCoords?.[1];
    if (!lat || !lng) return;
    setEmergencyNearby(null);
    fetch(`/api/nearby?lat=${lat}&lng=${lng}&cats=hospital,clinic,pharmacy,vet&limit=6&lang=${lang}`)
      .then(r => r.json()).then(setEmergencyNearby).catch(() => {});
    // Also immediately refresh Firestore emergency alerts when entering screen
    const FB_KEY = import.meta.env.VITE_FB_API_KEY;
    if (FB_KEY) {
      fetch(`https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_alerts?key=${FB_KEY}&pageSize=10`)
        .then(r => r.json())
        .then(data => {
          const docs = (data.documents || []).sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0));
          const now = new Date();
          const active = docs.find(d => {
            const f = d.fields || {};
            const isActive = f.active?.booleanValue === true || f.active?.stringValue === "true";
            const expires = f.expires?.stringValue || f.expires?.timestampValue || "0";
            return isActive && new Date(expires) > now;
          });
          setEmergencyAlert(active ? (active.fields.message?.stringValue || null) : null);
        }).catch(() => {});
    }
  }, [subScreen]); // eslint-disable-line

  useEffect(() => {
    if (phase !== "kiosk") return;
    const FB_KEY = import.meta.env.VITE_FB_API_KEY;
    if (!FB_KEY) return;
    const checkAlerts = () => {
      fetch(`https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_alerts?key=${FB_KEY}&pageSize=10`)
        .then(r => r.json())
        .then(data => {
          const docs = data.documents || [];
          // Sort by createTime desc so newest comes first
          docs.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0));
          const now = new Date();
          const active = docs.find(d => {
            const f = d.fields || {};
            const isActive = f.active?.booleanValue === true || f.active?.stringValue === "true";
            const expires = f.expires?.stringValue || f.expires?.timestampValue || "0";
            return isActive && new Date(expires) > now;
          });
          setEmergencyAlert(active ? (active.fields.message?.stringValue || null) : null);
        }).catch(() => {});
    };
    checkAlerts();
    const iv = setInterval(checkAlerts, 30000); // check every 30s
    return () => clearInterval(iv);
  }, [phase]);

  const KioskHome = () => {
    const greetKey = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
    const greeting = t(greetKey, lang);
    const tipIcon = hour < 6 ? "🌙" : hour < 12 ? "☕" : hour < 18 ? "🏖️" : hour < 22 ? "🍷" : "🌙";

    // Dynamic tip based on real nearby data
    const buildTip = () => {
      const nb = nearbyData?.categories || {};
      const firstBakery = nb.bakery?.[0];
      const firstBeach = nb.beach?.[0];
      const firstFood = nb.food?.[0];
      const firstShop = nb.shop?.[0];
      const firstParking = nb.parking?.[0];
      if (hour < 6) return `${weather.temp}°C. ${firstShop ? firstShop.name + ` (${firstShop.walkMin || "?"}min)` : kioskCity}.`;
      if (hour < 12) {
        const bakeryTip = firstBakery ? `${firstBakery.name} (${firstBakery.distance}m)` : "";
        const beachTip = firstBeach ? `${firstBeach.name} — ${firstBeach.walkMin}min` : "";
        return [bakeryTip, beachTip].filter(Boolean).join(". ") || `${kioskCity} — ${weather.temp}°C.`;
      }
      if (hour < 18) {
        const uvWarn = weather.uv >= 8 ? "SPF50+! " : weather.uv >= 5 ? "SPF30. " : "";
        const beachTip = firstBeach ? `${firstBeach.name} (${firstBeach.distance}m)` : "";
        return `${uvWarn}${weather.temp}°C. ${beachTip}`;
      }
      if (hour < 22) {
        const foodTip = firstFood ? `${firstFood.name} — ${firstFood.walkMin}min` : "";
        return `${weather.sunset ? "🌅 " + weather.sunset + ". " : ""}${foodTip}`;
      }
      return `${weather.temp}°C. ${kioskCity}.`;
    };
    const tip = nearbyData ? buildTip() : "...";

    // Dynamic nearby highlights bar
    const nb = nearbyData?.categories || {};
    const nearbyHighlights = [
      nb.parking?.[0] && { icon: "🅿️", text: `${nb.parking[0].name} · ${nb.parking[0].distance}m` },
      nb.beach?.[0] && { icon: "🏖️", text: `${nb.beach[0].name} · ${nb.beach[0].walkMin}min` },
      nb.food?.[0] && { icon: "🍽️", text: `${nb.food[0].name} · ${nb.food[0].distance}m` },
      nb.shop?.[0] && { icon: "🛒", text: `${nb.shop[0].name} · ${nb.shop[0].walkMin}min` },
    ].filter(Boolean);

    return (
      <>
        {/* Header: greeting + city */}
        <div style={{ padding: "20px 0 12px" }}>
          <div style={{ ...dm, fontSize: 12, color: C.mut, letterSpacing: 2, textTransform: "uppercase" }}>
            {tipIcon} {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginTop: 8, lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>
          </div>
          <div style={{ ...dm, fontSize: 13, color: nearbyData ? C.accent : C.mut, marginTop: 4 }}>
            {nearbyData ? `📍 ${kioskCity}${nearbyData.location?.district && nearbyData.location.district !== kioskCity ? ` · ${nearbyData.location.district}` : ""}` 
             : nearbyLoading ? `📍 ${kioskCity}...`
             : `📍 ${kioskCity}`}
          </div>
        </div>


        {/* ═══ TRIAL EXPIRY BANNER — <12h remaining ═══ */}
        {!premium && trialRemaining !== null && trialRemaining > 0 && trialRemaining < 43200000 && (() => {
          const hrs = Math.floor(trialRemaining / 3600000);
          const mins = Math.floor((trialRemaining % 3600000) / 60000);
          const timeStr = hrs > 0
            ? `${hrs}h ${mins}min`
            : `${mins} min`;
          const msg = {
            hr: `⏳ AI vodič ističe za ${timeStr} — nadogradi na Premium`,
            de: `⏳ KI-Guide läuft in ${timeStr} ab — auf Premium upgraden`,
            at: `⏳ KI-Guide läuft in ${timeStr} ab — auf Premium upgraden`,
            en: `⏳ AI guide expires in ${timeStr} — upgrade to Premium`,
            it: `⏳ Guida AI scade tra ${timeStr} — passa a Premium`,
            si: `⏳ AI vodič poteče čez ${timeStr} — nadgradi na Premium`,
            cz: `⏳ AI průvodce vyprší za ${timeStr} — přejdi na Premium`,
            pl: `⏳ Przewodnik AI wygaśnie za ${timeStr} — przejdź na Premium`,
          }[lang] || `⏳ AI guide expires in ${timeStr}`;
          return (
            <div onClick={() => setShowPaywall(true)} style={{ cursor: "pointer", padding: "14px 18px", borderRadius: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, ...dm, fontSize: 13, color: "#fbbf24", lineHeight: 1.4 }}>{msg}</div>
              <div style={{ ...dm, fontSize: 11, color: "#f59e0b", fontWeight: 700, whiteSpace: "nowrap", background: "rgba(245,158,11,0.12)", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(245,158,11,0.2)" }}>
                {lang === "de" || lang === "at" ? "Upgrade →" : lang === "en" ? "Upgrade →" : "Nadogradi →"}
              </div>
            </div>
          );
        })()}

        {/* ═══ AFFILIATE BANNER — shown when entered via ?affiliate= ═══ */}
        {affiliateId && AFFILIATE_DATA?.[affiliateId] && (() => {
          const aff = AFFILIATE_DATA[affiliateId];
          const L = (o) => o[lang] || o[lang === "at" ? "de" : "en"] || o.en || "";
          return (
            <div onClick={() => setSubScreen("affiliate")} style={{ cursor:"pointer", borderRadius:20, overflow:"hidden", marginBottom:16, position:"relative", height:160, border:`1px solid ${aff.color}30` }}>
              <img src={aff.heroImg} alt={aff.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(5,14,30,0.88) 0%, rgba(5,14,30,0.4) 60%, transparent 100%)" }} />
              <div style={{ position:"absolute", top:0, left:0, bottom:0, padding:"20px 22px", display:"flex", flexDirection:"column", justifyContent:"center" }}>
                <div style={{ ...dm, fontSize:9, color:aff.color, letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>
                  {lang==="de"||lang==="at" ? "IHR DOMIZIL" : lang==="en" ? "YOUR STAY" : "VAŠ SMJEŠTAJ"}
                </div>
                <div style={{ fontSize:28, fontWeight:400, color:"#f0f9ff", lineHeight:1 }}>{aff.emoji} {aff.name}</div>
                <div style={{ ...dm, fontSize:12, color:"rgba(240,249,255,0.65)", marginTop:5 }}>📍 {L(aff.address)}</div>
                <div style={{ ...dm, fontSize:11, color:aff.color, marginTop:8, display:"flex", alignItems:"center", gap:6 }}>
                  {lang==="de"||lang==="at" ? "Details & Aktivitäten" : lang==="en" ? "Details & Activities" : "Detalji & Aktivnosti"} →
                </div>
              </div>
            </div>
          );
        })()}

        {/* ═══ ADRIATIC PULSE — unified weather/sea/UV board ═══ */}
        <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, opacity: 0.12, pointerEvents: "none" }}>
            <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ display: "block" }}>
              <path fill={C.accent} d="M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z">
                <animate attributeName="d" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  values="M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z;M0,35 C100,20 200,42 300,28 C350,22 375,38 400,32 L400,60 L0,60 Z;M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z" />
              </path>
              <path fill={C.accent} opacity="0.5" d="M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z">
                <animate attributeName="d" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  values="M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z;M0,28 C80,42 160,22 240,38 C320,42 360,25 400,30 L400,60 L0,60 Z;M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z" />
              </path>
            </svg>
          </div>
          <div style={{ padding: "16px 20px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ ...dm, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 10, color: C.mut, letterSpacing: 3, fontWeight: 600 }}>ADRIATIC PULSE</span>
              </div>
              <span style={{ ...dm, fontSize: 10, color: C.mut }}>{new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div style={{ display: "flex", gap: 0, justifyContent: "space-between" }}>
              {[
                { label: {hr:"MORE",de:"MEER",en:"SEA",it:"MARE"}[lang]||"MORE", value: `${weather.sea}°`, sub: "surface", icon: "🌊", color: C.accent },
                { label: {hr:"ZRAK",de:"LUFT",en:"AIR",it:"ARIA"}[lang]||"ZRAK", value: `${weather.temp}°`, sub: weather.icon, icon: null, color: C.text },
                { label: "UV", value: weather.uv, sub: weather.uv >= 8 ? "!" : weather.uv >= 5 ? "med" : "low", icon: null, color: weather.uv >= 8 ? C.red : weather.uv >= 5 ? C.warm : C.green },
                { label: {hr:"VJETAR",de:"WIND",en:"WIND",it:"VENTO"}[lang]||"VJETAR", value: weather.wind?.split(" ")[1] || "—", sub: weather.wind?.split(" ")[0] || "", icon: null, color: C.mut },
                { label: "🌅", value: weather.sunset || "—", sub: "", icon: null, color: C.warm },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ ...dm, fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: m.color, lineHeight: 1 }}>{m.icon || ""}{m.value}</div>
                  <div style={{ ...dm, fontSize: 10, color: C.mut, marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>


        {/* Quick tiles */}
        <SectionLabel>{t("quickAccess",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginBottom: 24 }}>
          {[
            { k: "parking",   ic: IC.parking, l: t("parking",lang), clr: C.accent, free: true },
            { k: "beach",     ic: IC.beach,   l: t("beaches",lang), clr: "#38bdf8", free: true },
            { k: "food",        ic: IC.food,    l: ({hr:"Hrana",de:"Essen",en:"Food",it:"Cibo",si:"Hrana",cz:"Jídlo",pl:"Jedzenie"})[lang]||"Hrana", clr: C.terracotta, free: true },
            { k: "restaurants", ic: IC.food,    l: ({hr:"Rezerviraj",de:"Tisch res.",en:"Book table",it:"Prenota",si:"Rezerviraj",cz:"Rezervuj",pl:"Rezerwuj"})[lang]||"Rezerviraj", clr: "#FFB800", free: true },
            { k: "rabcard",     ic: IC.ticket,  l: ({hr:"Rab Card",de:"Rab Card",en:"Rab Card",it:"Rab Card",si:"Rab Card",cz:"Rab Card",pl:"Rab Card"})[lang]||"Rab Card", clr: "#FFB800", free: true },
            { k: "emergency",   ic: IC.medic,   l: ({hr:"Hitno",de:"Notfall",en:"Emergency",it:"Emergenza",si:"Nujno",cz:"Nouzové",pl:"Nagłe"})[lang]||"Hitno", clr: C.red, free: true },
            ...(kioskCity?.toLowerCase().includes("rab") ? [
              { k: "beach-status", ic: IC.beach,   l: ({hr:"Plaže",de:"Strände",en:"Beaches",it:"Spiagge"})[lang]||"Plaže", clr: "#38bdf8", free: true },
              { k: "opg",          ic: IC.shop,    l: ({hr:"OPG",de:"OPG",en:"OPG",it:"OPG"})[lang]||"OPG", clr: "#84cc16", free: true },
              { k: "wellness",     ic: IC.map,     l: ({hr:"Wellness",de:"Wellness",en:"Wellness",it:"Wellness"})[lang]||"Wellness", clr: "#f472b6", free: true },
            ] : []),
          ].map(tile => {
            const count = nearbyData?.categories?.[tile.k]?.length;
            return (
              <div key={tile.k}
                onClick={() => { if (!tile.free && !premium) setShowPaywall(true); else setSubScreen(tile.k); }}
                className="glass"
                style={{
                  background: C.card, borderRadius: 18,
                  padding: "18px 10px 14px", textAlign: "center",
                  cursor: "pointer", position: "relative",
                  border: `1px solid ${C.bord}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: tile.clr + "10", border: `1px solid ${tile.clr}1c`,
                  display: "grid", placeItems: "center", margin: "0 auto 9px",
                }}>
                  <Icon d={tile.ic} size={20} color={tile.clr} stroke={1.7} />
                </div>
                <div style={{ ...dm, fontSize: 11, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>{tile.l}</div>
                {count > 0 && (
                  <div style={{ position:"absolute", top:6, left:6, ...dm, fontSize:9,
                    color:C.accent, background:C.acDim, padding:"1px 5px",
                    borderRadius:7, fontWeight:700, border:`1px solid ${C.acBorder}` }}>{count}</div>
                )}
                {!tile.free && !premium && (
                  <div style={{ position:"absolute", top:7, right:7, ...dm, fontSize:8,
                    color:C.gold, background:C.goDim, padding:"2px 6px",
                    borderRadius:7, fontWeight:700, letterSpacing:0.5,
                    border:`1px solid ${C.goBorder}` }}>PRO</div>
                )}
              </div>
            );
          })}
        </div>


        {/* ── AI Guide — primary CTA above grid ── */}
        <div onClick={() => setSubScreen("chat")} style={{
          marginBottom: 12, padding: "16px 20px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(167,139,250,0.10), rgba(56,189,248,0.06))",
          border: "1px solid rgba(167,139,250,0.22)",
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(167,139,250,0.10)",
        }} className="glass">
          <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.20)",
            display: "grid", placeItems: "center" }}>
            <Icon d={IC.bot} size={24} color="#a78bfa" stroke={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...hf, fontSize: 18, fontWeight: 400, color: "#e2d9ff", marginBottom: 2 }}>
              {t("aiGuide", lang)}
            </div>
            <div style={{ ...dm, fontSize: 12, color: "#a78bfa", opacity: 0.8 }}>
              {({hr:"Pitajte bilo što o destinaciji",de:"Fragen Sie alles über Ihr Ziel",en:"Ask anything about your destination",it:"Chiedi qualsiasi cosa sulla destinazione",si:"Vprašajte karkoli o destinaciji",cz:"Zeptejte se na cokoliv o cíli",pl:"Zapytaj o cokolwiek o celu"})[lang] || "Ask anything about your destination"}
            </div>
          </div>
          <div style={{ ...dm, fontSize: 18, color: "#a78bfa", opacity: 0.6 }}>→</div>
        </div>

        {/* Alert ticker — all sources: Firestore, HAK/MeteoAlarm/HVZ/HERE, NAVTEX maritime, weather */}
        {(() => {
          const items = [
            ...(emergencyAlert ? [{ icon:"🚨", text: emergencyAlert, sev:"critical", dismiss: () => setEmergencyAlert(null) }] : []),
            ...alerts.filter(a => (a.severity==="critical"||a.severity==="high"||a.severity==="medium") && !dismissedAlerts.has(a.title))
              .map(a => ({ icon: ALERT_ICONS[a.type]||"⚠️", text: a.message || a.title, sev: a.severity, dismiss: () => setDismissedAlerts(s => new Set([...s, a.title])) })),
            ...(navtexData?.warning ? [{ icon:"⚓", text: `NAVTEX: ${navtexData.warning}`, sev:"high" }] : []),
            ...(navtexData?.jadranWarning ? [{ icon:"⚓", text: `Jadran upozorenje: ${navtexData.jadranWarning}`, sev:"high" }] : []),
            ...(navtexData?.synoptic ? [{ icon:"🌊", text: `Stanje mora: ${navtexData.synoptic}`, sev:"medium" }] : []),
            ...(weather?.windName?.toLowerCase().includes("bura") || weather?.windSpeed >= 15
              ? [{ icon:"💨", text: `Bura: ${weather.windName||""} ${weather.windSpeed ? Math.round(weather.windSpeed*3.6)+"km/h" : ""}`.trim(), sev:"medium" }] : []),
            ...(weather?.uv >= 7
              ? [{ icon:"☀️", text: `UV indeks: ${weather.uv} — zaštitite se od sunca`, sev:"medium" }] : []),
            ...(weather?.waveHeight >= 1.5
              ? [{ icon:"🌊", text: `Valovi: ${weather.waveHeight}m — oprez na moru`, sev:"medium" }] : []),
          ];
          return items.length ? <AlertTicker items={items} /> : null;
        })()}


        {/* ── AI-curated deals from n8n/Firestore ── */}
        <DealCards region={getDestRegion(kioskCity)} lang={lang} C={C} />


        {/* 3-day forecast — compact strip */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...dm, fontSize: 8, color: C.mut, letterSpacing: 2, marginBottom: 6, opacity: 0.5 }}>
            openmeteo · meteoadriatic
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(forecast || FORECAST_DEFAULT).slice(0, 3).map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12,
                background: i === 0 ? "rgba(14,165,233,0.07)" : "rgba(14,165,233,0.03)",
                border: `1px solid ${i === 0 ? "rgba(14,165,233,0.18)" : C.bord}` }}>
                <div style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{d.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...dm, fontSize: 9, color: i === 0 ? C.accent : C.mut, letterSpacing: 0.5, marginBottom: 2 }}>
                    {i === 0
                      ? ({hr:"Danas",de:"Heute",en:"Today",it:"Oggi",si:"Danes",cz:"Dnes",pl:"Dziś"})[lang]||"Today"
                      : (FORECAST_DAYS[lang]||FORECAST_DAYS.hr)[d.di]}
                  </div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 500, color: C.text, lineHeight: 1 }}>{d.h}° <span style={{ fontSize: 11, color: C.mut }}>{d.l}°</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extend Stay — Booking.com */}
        <Card style={{ marginBottom: 16, border: "1px dashed rgba(0,85,166,0.2)", background: "rgba(0,85,166,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 400 }}>🏨 {t("extendStay",lang)}</div>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>{t("bestDeals",lang)} — Booking.com</div>
            </div>
            <a href={BKG(`${kioskCity}, Croatia`, "&checkin=&checkout=&group_adults=2&no_rooms=1")} target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 18px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{t("browseOn",lang)}</a>
          </div>
        </Card>

        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <Btn onClick={() => setSubScreen("departure")}>{t("checkOut",lang)}</Btn>
        </div>
      </>
    );
  };

  const KioskDetail = () => {
    const staticData = PRACTICAL[subScreen]; // fallback for sun, emergency, routes
    const nearbyPlaces = subScreen === "food"
      ? [...(nearbyData?.categories?.food || []), ...(nearbyData?.categories?.shop || [])]
      : (nearbyData?.categories?.[subScreen] || []);
    const hasNearby = nearbyPlaces.length > 0;
    const svKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    // Category display config
    const CAT_DISPLAY = {
      parking: { icon: "🅿️", tk: "parking" },
      food: { icon: "🍽️", tk: "food" },
      shop: { icon: "🛒", tk: "shop" },
      beach: { icon: "🏖️", tk: "beaches" },
      pharmacy: { icon: "💊", tk: "emergency" },
      bakery: { icon: "🥐", tk: "food" },
      culture: { icon: "🏛️", tk: "activities" },
      fuel: { icon: "⛽", tk: "routes" },
    };
    const display = CAT_DISPLAY[subScreen] || (staticData ? { icon: staticData.icon, tk: staticData.tk } : { icon: "📍", tk: subScreen });

    // For static categories (sun, emergency, routes), use old PRACTICAL
    if (!hasNearby && staticData) {
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{display.icon}</span>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{display.tk ? t(display.tk,lang) : subScreen}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staticData.items.map((it, i) => (
              <Card key={i} style={{ borderColor: it.warn ? "rgba(239,68,68,0.12)" : it.free ? "rgba(34,197,94,0.12)" : C.bord, display: "flex", gap: 14, alignItems: "flex-start" }}>
                {it.warn && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, marginTop: 8, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{it.uvDynamic ? `UV ${weather.uv} (${weather.uv >= 8 ? "HIGH" : weather.uv >= 5 ? "MED" : "LOW"})` : typeof it.n === "object" ? (it.n[lang] || it.n.hr || "") : it.n}</div>
                  <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>
                    {typeof it.note === "object" ? (it.note[lang] || it.note.hr || "") : it.note}
                    {it.d && <span style={{ color: C.accent, marginLeft: 8 }}>{it.d}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      );
    }

    // Dynamic nearby places from HERE
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>{display.icon}</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{display.tk ? t(display.tk,lang) : subScreen}</div>
            <div style={{ ...dm, fontSize: 12, color: C.mut }}>📍 {kioskCity} · {nearbyPlaces.length} {({hr:"rezultata",de:"Ergebnisse",en:"results",it:"risultati"})[lang] || "rezultata"}</div>
          </div>
        </div>

        {nearbyLoading && !hasNearby && <Card style={{ marginBottom: 14, padding: "14px 20px" }}>
          <div style={{ ...dm, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.accent }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 1.2s infinite" }} />
            {({hr:"Tražim...",de:"Suche...",en:"Searching...",it:"Cerco..."})[lang] || "Tražim..."}
          </div>
        </Card>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nearbyPlaces.map((place, i) => (
            <Card key={place.place_id || `${place.lat},${place.lng}` || i} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{place.name}</div>
                  {place.address && <div style={{ ...dm, fontSize: 12, color: C.mut }}>{place.street || place.district || place.address.split(",")[0]}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  {place.distance != null && <div style={{ ...dm, fontSize: 14, fontWeight: 600, color: C.accent }}>{place.distance >= 1000 ? `${(place.distance/1000).toFixed(1)}km` : `${place.distance}m`}</div>}
                  {place.walkMin && <div style={{ ...dm, fontSize: 10, color: C.mut }}>🚶 {place.walkMin}min</div>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {place.openNow !== null && (
                  <span style={{ ...dm, fontSize: 11, padding: "2px 8px", borderRadius: 8, background: place.openNow ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: place.openNow ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {place.openNow ? (({hr:"Otvoreno",de:"Geöffnet",en:"Open",it:"Aperto"})[lang]||"Otvoreno") : (({hr:"Zatvoreno",de:"Geschlossen",en:"Closed",it:"Chiuso"})[lang]||"Zatvoreno")}
                  </span>
                )}
                {place.hours && <span style={{ ...dm, fontSize: 11, color: C.mut }}>{place.hours}</span>}
                {place.phone && <a href={`tel:${place.phone}`} style={{ ...dm, fontSize: 11, color: C.accent, textDecoration: "none" }}>📞 {place.phone}</a>}
                {place.categories?.[0] && <span style={{ ...dm, fontSize: 10, color: C.mut, padding: "1px 6px", borderRadius: 6, border: `1px solid ${C.bord}` }}>{place.categories[0]}</span>}
              </div>

              {/* Street View thumbnail + Navigation */}
              {place.lat && place.lng && (
                <>
                  {/* Street View static preview — shows what the place looks like */}
                  {svKey && (
                    <div style={{ borderRadius: 10, overflow: "hidden", marginTop: 10, position: "relative", height: 130, background: "rgba(0,0,0,0.2)" }}>
                      <img
                        key={`sv-${place.lat}-${place.lng}`}
                        src={`https://maps.googleapis.com/maps/api/streetview?size=600x260&location=${place.lat},${place.lng}&fov=80&key=${svKey}`}
                        alt={`Street View — ${place.name}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.25s" }}
                        loading="lazy"
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
                      />
                      <div style={{ position: "absolute", bottom: 6, left: 8, ...dm, fontSize: 9, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.45)", padding: "2px 8px", borderRadius: 6 }}>
                        Street View
                      </div>
                      {/* Tap thumbnail → open inline Street View overlay */}
                      <button
                        onClick={() => setSvModal({ lat: place.lat, lng: place.lng, name: place.name })}
                        style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer", width: "100%", height: "100%" }}
                        title="Open Street View"
                      />
                      <div style={{ position: "absolute", bottom: 6, right: 8, ...dm, fontSize: 9, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.45)", padding: "2px 8px", borderRadius: 6 }}>
                        {({hr:"Tapni za prikaz",de:"Tippen",en:"Tap to view",it:"Tocca"})[lang]||"Tap"}
                      </div>
                    </div>
                  )}
                  {/* Navigation buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => { window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`, '_blank', 'noopener,noreferrer'); }}
                      style={{ ...dm, flex: 1, padding: "10px 14px", background: C.acDim, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 12, color: C.accent, fontSize: 13, cursor: "pointer", fontWeight: 600, textAlign: "center" }}>
                      🚶 {({hr:"Pješice",de:"Zu Fuß",en:"Walk",it:"A piedi"})[lang]||"Pješice"}
                    </button>
                    <button onClick={() => { window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`, '_blank', 'noopener,noreferrer'); }}
                      style={{ ...dm, flex: 1, padding: "10px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, color: C.gold, fontSize: 13, cursor: "pointer", fontWeight: 600, textAlign: "center" }}>
                      🚗 {({hr:"Autom",de:"Mit Auto",en:"Drive",it:"In auto"})[lang]||"Autom"}
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {!hasNearby && !nearbyLoading && (
          <Card style={{ textAlign: "center", padding: "24px 20px" }}>
            <div style={{ ...dm, fontSize: 14, color: C.mut }}>{({hr:"Nema rezultata u blizini",de:"Keine Ergebnisse in der Nähe",en:"No results nearby",it:"Nessun risultato vicino"})[lang] || "Nema rezultata"}</div>
          </Card>
        )}
      </>
    );
  };

  const KioskGems = () => {
    const destRegion = getDestRegion(kioskCity);
    const visibleGems = destRegion
      ? GEMS.filter(g => g.region === destRegion)
      : GEMS; // fallback: show all if region unknown
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>💎</span>
          <div><div style={{ fontSize: 28, fontWeight: 400 }}>{t("gems",lang)}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("localTip",lang)}</div></div>
        </div>
        {visibleGems.length === 0 && (
          <Card style={{ textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗺️</div>
            <div style={{ ...dm, fontSize: 14, color: C.mut }}>
              {({hr:"AI vodič za ovu destinaciju dolazi uskoro!",de:"KI-Guide für dieses Ziel kommt bald!",en:"AI guide for this destination coming soon!",it:"Guida AI per questa destinazione in arrivo!"})[lang] || "Coming soon!"}
            </div>
          </Card>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginTop: 20 }}>
          {visibleGems.map((g, i) => (
            <Card key={i} style={{ cursor: "pointer", position: "relative" }}
              onClick={() => { if (g.premium && !premium) setShowPaywall(true); else setSelectedGem(g); }}>
              {g.premium && !premium && <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)", borderRadius: 18, display: "grid", placeItems: "center", zIndex: 5 }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🔒</div><div style={{ ...dm, fontSize: 12, color: C.gold }}>Premium</div></div>
              </div>}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 32 }}>{g.emoji}</span>
                <Badge c="gold">{(typeof g.type === "object" ? (g.type[lang] || g.type.hr) : g.type).toUpperCase()}</Badge>
              </div>
              <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{g.name}</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>{(typeof g.desc === "object" ? (g.desc[lang] || g.desc.hr) : g.desc).substring(0, 90)}...</div>
              <div style={{ ...dm, display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: C.mut }}>
                <span>⏰ {typeof g.best === "object" ? (g.best[lang] || g.best.hr) : g.best}</span><span>📍 {typeof g.diff === "object" ? (g.diff[lang] || g.diff.hr) : g.diff}</span>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const KioskActivities = () => {
    const destRegion = getDestRegion(kioskCity);
    // Build region-filtered static fallback from EXPERIENCES
    const regionFallback = destRegion
      ? EXPERIENCES.filter(e => e.region === destRegion).map(e => ({
          productCode: `LOCAL-${e.id}`,
          title: e.name,
          description: "",
          price: e.price,
          rating: e.rating,
          reviewCount: null,
          duration: e.dur,
          category: ({adventure:"Avantura",culture:"Kultura",gastro:"Gastro",premium:"Premium",nature:"Priroda"})[e.cat] || e.cat,
          images: [],
          bookingUrl: e.gyg || e.viator || "#",
        }))
      : VIATOR_FALLBACK;
    const acts = viatorActs || (regionFallback.length > 0 ? regionFallback : VIATOR_FALLBACK);
    const CATCLR = { Kultura: "#a78bfa", Nautika: "#0ea5e9", Priroda: "#34d399", Avantura: "#f97316", Romantika: "#f472b6" };
    const STARS = (r) => r ? "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)) : "★★★★★";
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>🎯</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{t("activities",lang)}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>Rezervirajte odmah · Potvrda odmah</div>
          </div>
        </div>

        {/* Wishlist teaser */}
        {viatorWishlist.length > 0 && (
          <div style={{ padding: "10px 16px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>💚</span>
            <div style={{ ...dm, fontSize: 13 }}>
              <strong style={{ color: "#22c55e" }}>{viatorWishlist.length} aktivnost{viatorWishlist.length === 1 ? "" : "i"}</strong> iz vaše liste želja
            </div>
          </div>
        )}

        <DealCards region={getDestRegion(kioskCity)} lang={lang} C={C} maxCards={6} />

        <a href="https://vi.me/qku0x" target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:12, background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.18)", textDecoration:"none", marginTop:4 }}>
          <span style={{ ...dm, fontSize:13, color:"#22c55e", fontWeight:600 }}>
            {lang === "de" || lang === "at" ? "Alle Aktivitäten auf Viator →" : lang === "en" ? "All activities on Viator →" : "Sve aktivnosti na Viatoru →"}
          </span>
          <span style={{ fontSize:16 }}>🎟️</span>
        </a>
      </>
    );
  };

  const KioskChat = () => {
    const prompts = [t("chatPrompt1",lang), t("chatPrompt2",lang), t("chatPrompt3",lang), t("chatPrompt4",lang)];
    const canSend = premium;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 20, display: "flex", flexDirection: "column", background: C.bg }}>
        {/* Header — paddingTop includes notch/Dynamic Island clearance */}
        <div style={{ flexShrink: 0, padding: "12px 16px 8px", paddingTop: "calc(12px + env(safe-area-inset-top, 0px))", borderBottom: `1px solid ${C.bord}` }}>
          <BackBtn onClick={() => setSubScreen("home")} />
        </div>

        {/* Messages */}
        <div className="scroll-smooth" style={{ flex: 1, overflowY: "auto", padding: "12px 16px", WebkitOverflowScrolling: "touch" }}>
          {chatMsgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 8px" }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🌊</div>
              <div style={{ fontSize: 22, fontWeight: 300, marginBottom: 6 }}>{t("askAnything",lang)}</div>
              <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 18 }}>{t("askDalmatia",lang)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => { setChatInput(p); }} style={{ ...dm, padding: "10px 14px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 12, color: C.text, fontSize: 13, cursor: "pointer", minHeight: 44, WebkitTapHighlightColor: "transparent", textAlign: "left" }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: m.role === "user" ? "rgba(14,165,233,0.08)" : "rgba(186,230,253,0.03)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.65, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
              {m.role !== "user" && <div style={{ fontSize: 9, color: C.accent, marginBottom: 5, letterSpacing: 1.5, fontWeight: 700 }}>JADRAN AI</div>}
              {m.text}
            </div>
          ))}
          {chatLoading && (
            <div style={{ ...dm, display: "inline-flex", padding: "12px 16px", borderRadius: "16px 16px 16px 4px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {/* Input bar — pinned to bottom */}
        <div style={{ flexShrink: 0, padding: "10px 16px", paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))", borderTop: `1px solid ${C.bord}`, background: C.bg, display: "flex", flexDirection: "column", gap: 8 }}>
          {!premium && (() => {
            const left = Math.max(0, 5 - freeMsgUsed);
            return left > 0 ? (
              <div style={{ ...dm, fontSize: 11, color: left === 1 ? C.gold : C.mut, textAlign: "center" }}>
                {({hr:`${left} od 5 besplatnih poruka`,de:`${left} von 5 kostenlosen Nachrichten`,en:`${left} of 5 free messages`,it:`${left} di 5 messaggi gratuiti`})[lang] || `${left}/5`}
              </div>
            ) : (
              <div onClick={() => setShowPaywall(true)} style={{ ...dm, fontSize: 12, color: C.gold, textAlign: "center", padding: "8px 12px", cursor: "pointer", background: C.goDim, borderRadius: 10, border: `1px solid ${C.goBorder}` }}>
                ⭐ {({hr:"Nadogradi za neograničen chat",de:"Upgrade für unbegrenzten Chat",en:"Upgrade for unlimited chat",it:"Aggiorna per chat illimitata"})[lang] || "Upgrade →"}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && canSend && doChat()}
              placeholder={t("askPlaceholder",lang)}
              inputMode="text" autoCorrect="off" autoCapitalize="sentences" spellCheck={false} autoComplete="off"
              style={{ ...dm, flex: 1, padding: "13px 16px", background: "rgba(186,230,253,0.05)", border: `1px solid ${C.bord}`, borderRadius: 20, color: C.text, fontSize: 16, outline: "none", minHeight: 48 }}
            />
            <button
              onClick={() => canSend ? doChat() : setShowPaywall(true)}
              style={{ padding: "0 20px", background: canSend ? `linear-gradient(135deg,${C.accent},#0284c7)` : C.goDim, border: canSend ? "none" : `1px solid ${C.goBorder}`, borderRadius: 20, color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 600, minWidth: 52, minHeight: 48, display: "grid", placeItems: "center", flexShrink: 0 }}>
              {canSend ? "→" : "⭐"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // AFFILIATE_DATA imported from ./affiliates

  const Kiosk = () => {
    // ── Welcome/Transition screen ──
    if (kioskWelcome) {
      const welcomeTexts = {
        hr: ["Stigli ste!", `Dobrodošli u ${kioskCity}`, nearbyData ? null : "Tražim lokacije u blizini..."],
        de: ["Angekommen!", `Willkommen in ${kioskCity}`, nearbyData ? null : "Suche Orte in der Nähe..."],
        en: ["You've arrived!", `Welcome to ${kioskCity}`, nearbyData ? null : "Finding places nearby..."],
        it: ["Siete arrivati!", `Benvenuti a ${kioskCity}`, nearbyData ? null : "Cerco luoghi vicini..."],
        si: ["Prispeli ste!", `Dobrodošli v ${kioskCity}`, nearbyData ? null : "Iščem bližnje lokacije..."],
        cz: ["Dorazili jste!", `Vítejte v ${kioskCity}`, nearbyData ? null : "Hledám místa poblíž..."],
        pl: ["Dotarliście!", `Witamy w ${kioskCity}`, nearbyData ? null : "Szukam miejsc w pobliżu..."],
      };
      const wt = welcomeTexts[lang] || welcomeTexts[lang === "at" ? "de" : "hr"];
      const nearbyCount = nearbyData ? Object.values(nearbyData.categories || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", animation: "fadeIn 0.6s both" }}>
          {/* Guardian journey summary — shown when arriving from Guardian mode */}
          {transitFromUrl && transitToUrl && (
            <div style={{ marginBottom: 20, padding: "10px 18px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.5s both" }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <div style={{ ...dm, fontSize: 13, color: "#4ade80", textAlign: "left" }}>
                <strong style={{ color: "#86efac" }}>{transitFromUrl}</strong>
                <span style={{ color: "#475569", margin: "0 6px" }}>→</span>
                <strong style={{ color: "#86efac" }}>{transitToUrl}</strong>
                {transitRouteData?.km && <span style={{ color: "#475569", marginLeft: 8, fontSize: 11 }}>· {transitRouteData.km} km</span>}
              </div>
            </div>
          )}
          <div style={{ fontSize: 72, marginBottom: 16, animation: "pulse-glow 2s ease infinite" }}>⚓</div>
          <div style={{ ...dm, fontSize: 14, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{wt[0]}</div>
          <div style={{ ...hf, fontSize: 36, fontWeight: 400, color: C.text, marginBottom: 8 }}>{wt[1]}</div>
          {wt[2] && (
            <div style={{ ...dm, fontSize: 13, color: C.mut, display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse 1.5s infinite" }} />
              {wt[2]}
            </div>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { emoji: "🅿️", k: "parking", label: {hr:"Parking",de:"Parken",en:"Parking",it:"Parcheggio"}[lang]||"Parking" },
              { emoji: "🛒", k: "shop", label: {hr:"Dućan",de:"Laden",en:"Shop",it:"Negozio"}[lang]||"Dućan" },
              { emoji: "🏖️", k: "beach", label: {hr:"Plaže",de:"Strände",en:"Beaches",it:"Spiagge"}[lang]||"Plaže" },
              { emoji: "🍽️", k: "food", label: {hr:"Hrana",de:"Essen",en:"Food",it:"Cibo"}[lang]||"Hrana" },
            ].map((item, i) => (
              <div key={item.k} onClick={() => { setKioskWelcome(false); setSubScreen(item.k); }}
                style={{ width: 76, cursor: "pointer", textAlign: "center", animation: `fadeUp 0.4s ease ${i * 0.1}s both`, WebkitTapHighlightColor: "transparent" }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: C.card, border: `1px solid ${C.bord}`, display: "grid", placeItems: "center", fontSize: 26, margin: "0 auto 6px", transition: "all 0.2s" }}>
                  {item.emoji}
                </div>
                <div style={{ ...dm, fontSize: 11, color: C.mut, fontWeight: 500 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {nearbyData ? (
            <Btn primary onClick={() => setKioskWelcome(false)} style={{ marginTop: 28 }}>
              {({hr:"Istraži",de:"Entdecken",en:"Explore",it:"Esplora",si:"Razišči",cz:"Prozkoumej",pl:"Odkrywaj"})[lang] || "Istraži"} {kioskCity} → {nearbyCount > 0 ? `(${nearbyCount})` : ""}
            </Btn>
          ) : (
            <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 28, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} />
              {({hr:"Učitavam...",de:"Laden...",en:"Loading...",it:"Caricamento...",si:"Nalagam...",cz:"Načítám...",pl:"Ładuję..."})[lang] || "..."}
            </div>
          )}
        </div>
      );
    }

    // ── KioskExcursions: Rab affiliate excursions (GYG + Viator + Booking) ──
    const KioskExcursions = () => {
      const RAB_EXCURSIONS = [
        { emoji: "🚢", en: "Boat Tours", de: "Bootstouren", hr: "Ture brodom",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour",
          viator: "https://www.viator.com/searchResults/all?text=Rab+boat+tour&pid=P00292197",
          img: "https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=400&q=75", clr: "#0ea5e9" },
        { emoji: "🤿", en: "Snorkeling & Diving", de: "Schnorcheln & Tauchen", hr: "Ronjenje",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=diving+snorkeling",
          viator: "https://www.viator.com/searchResults/all?text=Rab+diving&pid=P00292197",
          img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75", clr: "#38bdf8" },
        { emoji: "🛶", en: "Kayaking & Paddling", de: "Kajak & Paddeln", hr: "Kajak",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=kayak",
          viator: "https://www.viator.com/searchResults/all?text=Rab+kayak&pid=P00292197",
          img: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&q=75", clr: "#34d399" },
        { emoji: "🏛️", en: "Cultural Tours", de: "Kulturelle Touren", hr: "Kulturne ture",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=walking+tour",
          viator: "https://www.viator.com/searchResults/all?text=Rab+walking+tour&pid=P00292197",
          img: "https://images.unsplash.com/photo-1592488637498-fa5827d1e847?w=400&q=75", clr: C.gold },
        { emoji: "🏝️", en: "Island Hopping", de: "Insel-Hopping", hr: "Otočki obilazak",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=island+hopping",
          viator: "https://www.viator.com/searchResults/all?text=Rab+island+hopping&pid=P00292197",
          img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75", clr: "#a78bfa" },
        { emoji: "⚔️", en: "Rabska Fjera & Old Town", de: "Rabska Fjera & Altstadt", hr: "Rabska Fjera & Stari grad",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=rab+walking+tour",
          viator: "https://www.viator.com/searchResults/all?text=Rab+walking+tour&pid=P00292197",
          img: "https://images.unsplash.com/photo-1592488637498-fa5827d1e847?w=400&q=75", clr: "#fbbf24" },
        { emoji: "🏠", en: "Find Accommodation", de: "Unterkunft finden", hr: "Smještaj",
          booking: "https://www.booking.com/searchresults.html?ss=Rab%2C+Croatia&aid=101704203",
          img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75", clr: "#22c55e" },
      ];
      const lbl = (x) => lang === "de" || lang === "at" ? x.de : lang === "en" ? x.en : x.hr;
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>🚢</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 400 }}>
                {lang === "de" || lang === "at" ? "Ausflüge & Aktivitäten" : lang === "en" ? "Excursions & Activities" : "Izleti & Aktivnosti"}
              </div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>📍 Rab · GetYourGuide + Viator</div>
            </div>
          </div>

          {/* Category cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, marginBottom: 20 }}>
            {RAB_EXCURSIONS.map((ex, i) => (
              <Card key={i} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}>
                {/* Image header */}
                <div style={{ height: 90, position: "relative", background: `linear-gradient(135deg,${ex.clr}22,rgba(12,28,50,0.9))`, overflow: "hidden" }}>
                  <img src={ex.img} alt={lbl(ex)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} loading="lazy" />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{ex.emoji}</span>
                    <span style={{ ...dm, fontSize: 15, fontWeight: 600, color: "#f0f4f8" }}>{lbl(ex)}</span>
                  </div>
                </div>
                {/* Buttons */}
                <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
                  {ex.gyg && (
                    <button onClick={() => setInAppUrl(ex.gyg)}
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, color: C.accent, fontSize: 12, fontWeight: 700, textAlign: "center", cursor: "pointer", ...dm }}>
                      GetYourGuide
                    </button>
                  )}
                  {ex.viator && (
                    <button onClick={() => setInAppUrl(ex.viator)}
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, color: "#22c55e", fontSize: 12, fontWeight: 700, textAlign: "center", cursor: "pointer", ...dm }}>
                      Viator
                    </button>
                  )}
                  {ex.booking && (
                    <button onClick={() => setInAppUrl(ex.booking)}
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(0,85,166,0.1)", border: "1px solid rgba(0,85,166,0.25)", borderRadius: 10, color: "#60a5fa", fontSize: 12, fontWeight: 700, textAlign: "center", cursor: "pointer", ...dm }}>
                      Booking.com
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* GYG Widget — auto-hydrated by script in index.html */}
          <Card style={{ padding: 20, overflow: "hidden" }}>
            <div style={{ ...dm, fontSize: 12, color: C.mut, marginBottom: 12 }}>
              {lang === "de" || lang === "at" ? "Alle Ausflüge auf Rab" : lang === "en" ? "All excursions on Rab" : "Svi izleti na Rabu"}
            </div>
            <div
              data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
              data-gyg-locale-code={lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-US" : lang === "it" ? "it-IT" : "en-US"}
              data-gyg-widget="activities"
              data-gyg-number-of-items="4"
              data-gyg-partner-id="9OEGOYI"
              data-gyg-q="Rab Croatia"
              data-gyg-cmp="jadran_kiosk_rab"
            />
          </Card>

          {/* Viator Shop */}
          <button onClick={() => setInAppUrl("https://www.viator.com/searchResults/all?text=Rab+Croatia&pid=P00292197")}
            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:12, background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.18)", marginTop:12, width:"100%", cursor:"pointer" }}>
            <span style={{ ...dm, fontSize:13, color:"#22c55e", fontWeight:600 }}>
              {lang === "de" || lang === "at" ? "Viator Shop — alle Aktivitäten →" : lang === "en" ? "Viator Shop — all activities →" : "Viator Shop — sve aktivnosti →"}
            </span>
            <span style={{ fontSize:16 }}>🎟️</span>
          </button>

          {/* Booking.com — accommodations */}
          <Card style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 400 }}>
                🏨 {lang === "de" || lang === "at" ? "Unterkunft auf Rab" : lang === "en" ? "Accommodation on Rab" : "Smještaj na Rabu"}
              </div>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>Booking.com · 4-5% provizija</div>
            </div>
            <button onClick={() => setInAppUrl("https://www.booking.com/searchresults.html?ss=Rab%2C+Croatia&aid=101704203")}
              style={{ padding: "10px 18px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", border: "none", ...dm }}>
              {lang === "de" || lang === "at" ? "Suchen" : lang === "en" ? "Search" : "Traži"}
            </button>
          </Card>
        </>
      );
    };

    // ── KioskAffiliate: full property presentation ──────────────────────
    const KioskAffiliate = () => {
      const aff = affiliateId && AFFILIATE_DATA[affiliateId];
      if (!aff) return KioskHome();
      const L = (o) => o[lang] || o[lang === "at" ? "de" : "en"] || o.en || "";
      const isDE = lang === "de" || lang === "at";
      const feats = aff.features[lang] || aff.features[lang === "at" ? "de" : "en"] || aff.features.en;
      const today = new Date().getDay();
      const special = aff.dailySpecials?.find(s => s.day === today);

      const T = {
        contact:     { de:"KONTAKT",              en:"CONTACT",             hr:"KONTAKT",               it:"CONTATTI" },
        todaySpec:   { de:"TAGESGERICHT",          en:"TODAY'S SPECIAL",     hr:"JELO DANA",             it:"PIATTO DEL GIORNO" },
        gallery:     { de:"GALERIE",               en:"GALLERY",             hr:"GALERIJA",              it:"GALLERIA" },
        features:    { de:"AUSSTATTUNG",           en:"FEATURES",            hr:"SADRŽAJ",               it:"DOTAZIONI" },
        menu:        { de:"SPEISEKARTE",           en:"MENU",                hr:"JELOVNIK",              it:"MENÙ" },
        reviews:     { de:"GÄSTEBEWERTUNGEN",      en:"GUEST REVIEWS",       hr:"OCJENE GOSTIJU",        it:"RECENSIONI" },
        nearby:      { de:"IN DER NÄHE",           en:"NEARBY",              hr:"U BLIZINI",             it:"NELLE VICINANZE" },
        excursions:  { de:"AUSFLÜGE & AKTIVITÄTEN",en:"EXCURSIONS & ACTIVITIES",hr:"IZLETI & AKTIVNOSTI",it:"ESCURSIONI & ATTIVITÀ" },
        highlight:   { de:"HIGHLIGHT",             en:"HIGHLIGHT",           hr:"ISTAKNUTO",             it:"IN EVIDENZA" },
        openNow:     { de:"Jetzt geöffnet",        en:"Open now",            hr:"Otvoreno sada",         it:"Aperto ora" },
        fbTitle:     { de:"War diese Präsentation hilfreich?", en:"Was this presentation helpful?", hr:"Je li ova prezentacija bila korisna?", it:"Questa presentazione è stata utile?" },
        fbSend:      { de:"Absenden",              en:"Submit",              hr:"Pošalji",               it:"Invia" },
        fbThanks:    { de:"Danke! Ihr Feedback hilft uns sehr.", en:"Thank you! Your feedback helps us improve.", hr:"Hvala! Vaše mišljenje nam je jako korisno.", it:"Grazie! Il tuo feedback ci aiuta a migliorare." },
        fbPlaceholder:{ de:"Was hat Ihnen gefallen oder fehlt noch?", en:"What did you like or what's missing?", hr:"Što vam se svidjelo ili što nedostaje?", it:"Cosa ti è piaciuto o cosa manca?" },
      };
      const tl = k => T[k]?.[lang] || T[k]?.en || "";

      const submitPF = async () => {
        if (!pfRating) return;
        try {
          const deviceId = localStorage.getItem("jadran_device_id") || "unknown";
          await fetch("/api/partner-feedback", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partner: affiliateId, rating: pfRating, comment: pfComment, lang, deviceId }),
          });
        } catch {}
        setPfDone(true);
      };

      const shareAffiliate = () => {
        const url = `https://jadran.ai/?kiosk=${(AFFILIATE_COORDS[affiliateId]?.[2] || "rab").toLowerCase()}&affiliate=${affiliateId}&tk=${AFFILIATE_TOKENS[affiliateId] || ""}`;
        const txt = isDE ? `${aff.name} auf Rab — Gurman House entdecken` : lang==="en" ? `${aff.name} on Rab — Discover Gurman House` : lang==="it" ? `${aff.name} a Rab — Scopri Gurman House` : `${aff.name} na Rabu — Otkrijte Gurman House`;
        if (navigator.share) { navigator.share({ title: aff.name, text: txt, url }); }
        else { navigator.clipboard?.writeText(url).then(() => alert(isDE ? "Link kopiert!" : lang==="en" ? "Link copied!" : "Link kopiran!")); }
      };

      return (
        <>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <BackBtn onClick={() => setSubScreen("home")} />
            <button onClick={shareAffiliate} style={{ ...dm, background:"none", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"8px 14px", fontSize:12, color:C.mut, cursor:"pointer", display:"flex", alignItems:"center", gap:6, marginRight:4 }}>
              <span style={{ fontSize:14 }}>↗</span>
              {isDE ? "Teilen" : lang==="en" ? "Share" : lang==="it" ? "Condividi" : "Dijeli"}
            </button>
          </div>

          {/* ── Hero ── */}
          <div style={{ borderRadius:20, overflow:"hidden", marginBottom:16, position:"relative", height:230 }}>
            <img src={aff.heroImg} alt={aff.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(5,14,30,0.95) 0%, rgba(5,14,30,0.3) 60%, transparent 100%)" }} />
            <div style={{ position:"absolute", top:14, left:14, padding:"4px 10px", borderRadius:8, background:"rgba(249,115,22,0.15)", border:"1px solid rgba(249,115,22,0.25)", fontSize:9, fontWeight:700, color:"#f97316", letterSpacing:1.5 }}>PARTNER • RAB</div>
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"18px 22px" }}>
              <div style={{ ...dm, fontSize:10, color:aff.color, letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>
                {isDE ? "Ihr Feriendomizil" : lang==="en" ? "Your Holiday Home" : lang==="it" ? "La tua casa vacanze" : "Vaš odmor"}
              </div>
              <div style={{ fontSize:34, fontWeight:300, color:"#f0f9ff", lineHeight:1.1 }}>{aff.emoji} {aff.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7, flexWrap:"wrap" }}>
                <div style={{ ...dm, fontSize:12, color:"rgba(240,249,255,0.6)" }}>📍 {L(aff.address)}</div>
                <div style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:10, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.3)", flexShrink:0 }}>
                  <span style={{ color:"#fbbf24", fontSize:12 }}>★</span>
                  <span style={{ ...dm, fontSize:12, fontWeight:700, color:"#fbbf24" }}>{aff.rating}</span>
                  <span style={{ ...dm, fontSize:10, color:"rgba(255,255,255,0.45)" }}>({aff.reviewCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Contact strip ── */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <a href={`tel:${aff.phone}`}
              style={{ flex:"1 1 0", minWidth:0, padding:"13px 8px", borderRadius:14, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.2)", display:"flex", flexDirection:"column", alignItems:"center", gap:5, textDecoration:"none" }}>
              <span style={{ fontSize:22 }}>📞</span>
              <span style={{ ...dm, fontSize:10, fontWeight:700, color:C.accent }}>{isDE ? "Anrufen" : lang==="en" ? "Call" : lang==="it" ? "Chiama" : "Zovi"}</span>
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=Palit+315,+Rab,+Croatia" target="_blank" rel="noopener noreferrer"
              style={{ flex:"1 1 0", minWidth:0, padding:"13px 8px", borderRadius:14, background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.2)", display:"flex", flexDirection:"column", alignItems:"center", gap:5, textDecoration:"none" }}>
              <span style={{ fontSize:22 }}>🗺️</span>
              <span style={{ ...dm, fontSize:10, fontWeight:700, color:C.gold }}>{isDE ? "Navigation" : lang==="en" ? "Navigate" : lang==="it" ? "Naviga" : "Navigacija"}</span>
            </a>
          </div>

          {/* ── Trust badges ── */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(L(aff.address))}`} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 10px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", textDecoration:"none" }}>
              <span style={{ fontSize:13 }}>🗺️</span>
              <span style={{ ...dm, fontSize:11, color:"#94a3b8" }}>Google Maps</span>
            </a>
            <a href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(aff.name + " " + (AFFILIATE_COORDS[affiliateId]?.[2] || "Rab"))}`} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 10px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", textDecoration:"none" }}>
              <span style={{ fontSize:13 }}>🦉</span>
              <span style={{ ...dm, fontSize:11, color:"#94a3b8" }}>TripAdvisor</span>
            </a>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 10px", borderRadius:10, background:"rgba(14,165,233,0.05)", border:"1px solid rgba(14,165,233,0.12)" }}>
              <span style={{ fontSize:11 }}>✓</span>
              <span style={{ ...dm, fontSize:11, color:C.accent, fontWeight:600 }}>
                {isDE ? "Verifizierter Partner" : lang==="en" ? "Verified Partner" : lang==="it" ? "Partner Verificato" : "Verificirani partner"}
              </span>
            </div>
          </div>

          {/* ── Open hours + response time ── */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderRadius:12, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", minWidth:0 }}>
              <span style={{ fontSize:16 }}>🕐</span>
              <div style={{ minWidth:0 }}>
                <span style={{ ...dm, fontSize:11, fontWeight:700, color:"#22c55e" }}>{tl("openNow")} · </span>
                <span style={{ ...dm, fontSize:12, color:C.text }}>{L(aff.hours)}</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 14px", borderRadius:12, background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.15)", flexShrink:0 }}>
              <span style={{ fontSize:14 }}>💬</span>
              <span style={{ ...dm, fontSize:11, fontWeight:700, color:"#fbbf24" }}>
                {isDE ? "Antw. ~2h" : lang==="en" ? "Reply ~2h" : lang==="it" ? "Risposta ~2h" : "Odg. ~2h"}
              </span>
            </div>
          </div>

          {/* ── Today's special ── */}
          {special && (
            <Card warm style={{ marginBottom:20, padding:"16px 18px" }}>
              <div style={{ ...dm, fontSize:10, color:"#fbbf24", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("todaySpec")}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:30 }}>{special.emoji}</span>
                  <span style={{ ...dm, fontSize:15, fontWeight:600, color:C.text }}>{L(special)}</span>
                </div>
                {special.price && (
                  <div style={{ padding:"6px 14px", borderRadius:10, background:"rgba(251,191,36,0.12)", border:"1px solid rgba(251,191,36,0.3)", ...dm, fontSize:16, fontWeight:700, color:"#fbbf24", flexShrink:0 }}>€{special.price}</div>
                )}
              </div>
            </Card>
          )}

          {/* ── Tagline + desc ── */}
          <div style={{ ...hf, fontSize:20, fontWeight:400, color:C.text, textAlign:"center", marginBottom:6, fontStyle:"italic" }}>{L(aff.tagline)}</div>
          <div style={{ ...dm, fontSize:14, color:C.mut, lineHeight:1.75, marginBottom:20 }}>{L(aff.desc)}</div>

          {/* ── Photo gallery ── */}
          {aff.gallery?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ ...dm, fontSize:10, color:aff.color, letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("gallery")}</div>
              <div style={{ display:"flex", gap:8, overflowX:"auto", scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch", paddingBottom:8, scrollbarWidth:"none" }}>
                {aff.gallery.map((src, gi) => (
                  <div key={gi} style={{ minWidth:160, height:112, borderRadius:14, overflow:"hidden", flexShrink:0, scrollSnapAlign:"start", position:"relative" }}>
                    <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
                  </div>
                ))}
              </div>
              {/* Swipe hint — only shown once */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginTop:4, opacity:0.5 }}>
                {aff.gallery.map((_, gi) => (
                  <div key={gi} style={{ width: gi===0 ? 16 : 5, height:5, borderRadius:3, background: gi===0 ? aff.color : "rgba(255,255,255,0.3)", transition:"width 0.3s" }} />
                ))}
                <span style={{ ...dm, fontSize:9, color:C.mut, marginLeft:6 }}>swipe</span>
              </div>
            </div>
          )}

          {/* ── Features grid ── */}
          <div style={{ ...dm, fontSize:10, color:aff.color, letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("features")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
            {feats.map((f, i) => (
              <div key={i} style={{ padding:"10px 12px", background:"rgba(14,165,233,0.04)", border:`1px solid ${C.bord}`, borderRadius:12, ...dm, fontSize:13, color:C.text }}>{f}</div>
            ))}
          </div>

          {/* ── Smještaj / Accommodation ── */}
          {aff.rooms?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ ...dm, fontSize:10, color:"#22c55e", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
                {isDE ? "UNTERKUNFT" : lang==="en" ? "ACCOMMODATION" : lang==="it" ? "ALLOGGIO" : "SMJEŠTAJ"}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {aff.rooms.map((room) => {
                  const amen = room.amenities[lang] || room.amenities[lang === "at" ? "de" : "en"] || room.amenities.en;
                  return (
                    <Card key={room.id} style={{ padding:0, overflow:"hidden" }}>
                      {/* Room photo */}
                      <div style={{ position:"relative", height:140 }}>
                        <img src={room.img} alt={L(room.name)} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(5,14,30,0.88) 0%, transparent 50%)" }} />
                        <div style={{ position:"absolute", bottom:12, left:14, right:14, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
                          <div>
                            <div style={{ ...dm, fontSize:14, fontWeight:700, color:"#f0f9ff" }}>{room.emoji} {L(room.name)}</div>
                            <div style={{ ...dm, fontSize:11, color:"rgba(240,249,255,0.6)", marginTop:2 }}>
                              👤 {room.guests} · 🛏️ {room.beds} · 📐 {room.sqm}m² · {L(room.view)}
                            </div>
                          </div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ ...dm, fontSize:11, color:"rgba(255,255,255,0.5)" }}>
                              {isDE ? "ab" : lang==="en" ? "from" : lang==="it" ? "da" : "od"}
                            </div>
                            <div style={{ ...dm, fontSize:18, fontWeight:700, color:"#22c55e" }}>€{room.priceFrom}</div>
                            <div style={{ ...dm, fontSize:9, color:"rgba(255,255,255,0.4)" }}>
                              {isDE ? "/Nacht" : lang==="en" ? "/night" : lang==="it" ? "/notte" : "/noć"}
                            </div>
                          </div>
                        </div>
                        <div style={{ position:"absolute", top:10, right:10, padding:"3px 8px", borderRadius:6, background:"rgba(34,197,94,0.18)", border:"1px solid rgba(34,197,94,0.3)", ...dm, fontSize:9, color:"#22c55e", fontWeight:700 }}>
                          {L(room.bookingNote)}
                        </div>
                      </div>
                      {/* Amenities */}
                      <div style={{ padding:"10px 14px 8px", display:"flex", gap:6, flexWrap:"wrap" }}>
                        {amen.map((a, ai) => (
                          <span key={ai} style={{ padding:"3px 8px", borderRadius:8, background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", ...dm, fontSize:11, color:"#86efac" }}>{a}</span>
                        ))}
                      </div>
                      {/* Direct booking button */}
                      <div style={{ padding:"0 14px 14px" }}>
                        <button onClick={() => { setBjGuestName(""); setBjGuestEmail(""); setBjStatus(null); setBjBookRoom({ ...room, _nameLocalized: L(room.name) }); }}
                          style={{ width:"100%", padding:"11px", borderRadius:10, background:"linear-gradient(135deg,rgba(34,197,94,0.18),rgba(34,197,94,0.08))", border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e", fontSize:13, fontWeight:700, cursor:"pointer", ...dm }}>
                          📅 {isDE ? "Direkt buchen" : lang==="en" ? "Book directly" : lang==="it" ? "Prenota direttamente" : "Rezerviraj direktno"}
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Pogled od gore / Aerial view ── */}
          <div style={{ marginBottom:24 }}>
            <div style={{ ...dm, fontSize:10, color:"#a78bfa", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
              {isDE ? "LAGE AUS DER VOGELPERSPEKTIVE" : lang==="en" ? "AERIAL VIEW · LOCATION" : lang==="it" ? "VISTA AEREA · POSIZIONE" : "POGLED ODOZGO · LOKACIJA"}
            </div>
            <div style={{ borderRadius:16, overflow:"hidden", position:"relative", height:220, border:`1px solid rgba(167,139,250,0.2)` }}>
              <iframe
                title="Black Jack Rab — aerial"
                src="https://maps.google.com/maps?q=Palit+315,+Rab,+Croatia&hl=hr&z=17&t=k&output=embed"
                style={{ width:"100%", height:"100%", border:0, display:"block" }}
                loading="lazy"
                allowFullScreen
              />
              <div style={{ position:"absolute", bottom:10, left:10, padding:"4px 10px", borderRadius:8, background:"rgba(5,14,30,0.82)", border:"1px solid rgba(167,139,250,0.25)", ...dm, fontSize:10, color:"#c4b5fd" }}>
                📍 Palit 315, Rab · 200m {isDE ? "vom Strand" : lang==="en" ? "from beach" : lang==="it" ? "dalla spiaggia" : "od plaže"}
              </div>
            </div>
          </div>

          {/* ── Virtual tour / Drone — slot ── */}
          {aff.droneVideoId ? (
            <div style={{ marginBottom:24 }}>
              <div style={{ ...dm, fontSize:10, color:"#f97316", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
                {isDE ? "DROHNENAUFNAHME" : lang==="en" ? "DRONE FOOTAGE" : lang==="it" ? "RIPRESE DRONE" : "DRONE SNIMAK"}
              </div>
              <div style={{ borderRadius:16, overflow:"hidden", position:"relative", paddingTop:"56.25%" }}>
                <iframe
                  title="Black Jack drone"
                  src={`https://www.youtube.com/embed/${aff.droneVideoId}?autoplay=0&rel=0`}
                  style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:0 }}
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          {/* ── Menu ── */}
          {aff.menu?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ ...dm, fontSize:10, color:"#f97316", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("menu")}</div>
              {aff.menu.map((sec, si) => (
                <div key={si} style={{ marginBottom:6 }}>
                  <button
                    onClick={() => setMenuOpenSec(menuOpenSec === si ? null : si)}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", background: menuOpenSec===si ? "rgba(249,115,22,0.09)" : "rgba(0,0,0,0.12)", border:`1px solid ${menuOpenSec===si ? "rgba(249,115,22,0.3)" : C.bord}`, borderRadius: menuOpenSec===si ? "12px 12px 0 0" : 12, cursor:"pointer", color:C.text, transition:"all 0.2s" }}>
                    <span style={{ ...dm, fontSize:14, fontWeight:700 }}>{L(sec.section)}</span>
                    <span style={{ fontSize:11, color:C.mut, display:"inline-block", transition:"transform 0.2s", transform: menuOpenSec===si ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                  </button>
                  {menuOpenSec === si && (
                    <div style={{ border:`1px solid rgba(249,115,22,0.15)`, borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden" }}>
                      {sec.items.map((item, ii) => (
                        <div key={ii} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"12px 16px", borderTop: ii>0 ? `1px solid ${C.bord}` : "none", background:"rgba(0,0,0,0.08)" }}>
                          <div style={{ flex:1, minWidth:0, marginRight:12 }}>
                            <div style={{ ...dm, fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{item.emoji} {L(item.name)}</div>
                            <div style={{ ...dm, fontSize:11, color:C.mut, lineHeight:1.5 }}>{L(item.desc)}</div>
                          </div>
                          <div style={{ ...dm, fontSize:15, fontWeight:700, color:"#fbbf24", flexShrink:0, paddingTop:1 }}>€{item.price}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Testimonials ── */}
          {aff.testimonials?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ ...dm, fontSize:10, color:C.gold, letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("reviews")}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {aff.testimonials.map((t, ti) => (
                  <Card key={ti} style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:18 }}>{t.flag}</span>
                      <span style={{ ...dm, fontSize:13, fontWeight:700, color:C.text }}>{t.name}</span>
                      <span style={{ ...dm, fontSize:13, color:"#fbbf24", marginLeft:"auto" }}>{"★".repeat(t.rating)}</span>
                    </div>
                    <div style={{ ...dm, fontSize:13, color:C.mut, lineHeight:1.65, fontStyle:"italic" }}>"{L(t.text)}"</div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── Property photo ── */}
          <div style={{ borderRadius:16, overflow:"hidden", marginBottom:20, height:160 }}>
            <img src={aff.propImg} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} loading="lazy" />
          </div>

          {/* ── Fjera highlight ── */}
          {aff.highlight && (
            <Card warm style={{ marginBottom:20, padding:"20px 18px", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, right:0, width:80, height:80, opacity:0.06, fontSize:72, lineHeight:1 }}>⚔️</div>
              <div style={{ ...dm, fontSize:10, color:"#fbbf24", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>{tl("highlight")}</div>
              <div style={{ ...dm, fontSize:14, color:C.text, lineHeight:1.7 }}>{L(aff.highlight)}</div>
            </Card>
          )}

          {/* ── Nearby POI ── */}
          <div style={{ ...dm, fontSize:10, color:C.gold, letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("nearby")}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {aff.poi.map((p, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 16px", background:"rgba(0,0,0,0.15)", border:`1px solid ${C.bord}`, borderRadius:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>{p.icon}</span>
                  <span style={{ ...dm, fontSize:14, color:C.text }}>{L(p)}</span>
                </div>
                <span style={{ ...dm, fontSize:12, color:aff.color, fontWeight:600 }}>{p.dist}</span>
              </div>
            ))}
          </div>

          {/* ── Excursions ── */}
          <div style={{ ...dm, fontSize:10, color:"#22c55e", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>{tl("excursions")}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
            {aff.excursions.map((ex, i) => (
              <Card key={i} style={{ padding:"14px 12px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{ex.emoji}</div>
                <div style={{ ...dm, fontSize:12, fontWeight:600, color:C.text, marginBottom:10 }}>{L(ex)}</div>
                <div style={{ display:"flex", gap:6 }}>
                  {ex.gyg && <button onClick={() => setInAppUrl(ex.gyg)} style={{ flex:1, padding:"7px 4px", background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.2)", borderRadius:8, color:C.accent, fontSize:10, fontWeight:700, textAlign:"center", cursor:"pointer", ...dm }}>GYG</button>}
                  {ex.viator && <button onClick={() => setInAppUrl(ex.viator)} style={{ flex:1, padding:"7px 4px", background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:8, color:"#22c55e", fontSize:10, fontWeight:700, textAlign:"center", cursor:"pointer", ...dm }}>Viator</button>}
                </div>
              </Card>
            ))}
          </div>

          {/* ── Direct Booking CTA ── */}
          <Card style={{ background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.04))", border:"1px solid rgba(34,197,94,0.28)", padding:"22px 20px", marginBottom:24 }}>
            <div style={{ ...dm, fontSize:11, color:"#22c55e", letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>DIREKTNA REZERVACIJA · BEZ PROVIZIJA</div>
            <div style={{ fontSize:20, fontWeight:400, marginBottom:6 }}>
              🏡 {isDE ? "Direkt buchen — beste Preise" : lang==="en" ? "Book direct — best rates" : lang==="it" ? "Prenota direttamente — prezzi migliori" : "Rezervirajte direktno — najniže cijene"}
            </div>
            <div style={{ ...dm, fontSize:13, color:C.mut, marginBottom:16 }}>
              {isDE ? "Ohne Buchungsgebühren · Antwort in 2 Stunden" : lang==="en" ? "No booking fees · Response within 2 hours" : lang==="it" ? "Senza commissioni · Risposta entro 2 ore" : "Bez naknada · Odgovor unutar 2 sata"}
            </div>
            <button
              onClick={() => { setBjGuestName(""); setBjGuestEmail(""); setBjStatus(null); setBjBookRoom({ id:"general", priceFrom: aff.rooms?.[0]?.priceFrom || 50, guests:4, emoji:"🏡", name:{hr:"Smještaj",en:"Accommodation",de:"Unterkunft",it:"Alloggio"}, _nameLocalized: isDE?"Unterkunft":lang==="en"?"Accommodation":lang==="it"?"Alloggio":"Smještaj", amenities:{hr:[],en:[],de:[],it:[]} }); }}
              style={{ display:"block", width:"100%", padding:"16px", background:"linear-gradient(135deg,#16a34a,#22c55e)", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, textAlign:"center", cursor:"pointer", border:"none", ...dm }}>
              {isDE ? "Verfügbarkeit anfragen →" : lang==="en" ? "Request availability →" : lang==="it" ? "Richiedi disponibilità →" : "Provjeri dostupnost →"}
            </button>
          </Card>

          {/* ── USER TESTING FEEDBACK ── */}
          <Card style={{ border:"1px solid rgba(14,165,233,0.2)", padding:"20px 18px", marginBottom:36 }}>
            <div style={{ ...dm, fontSize:9, color:C.accent, letterSpacing:3, textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>
              {isDE ? "BETA · IHR FEEDBACK" : lang==="en" ? "BETA · YOUR FEEDBACK" : lang==="it" ? "BETA · IL TUO FEEDBACK" : "BETA · VAŠE MIŠLJENJE"}
            </div>
            {pfDone ? (
              <div style={{ textAlign:"center", padding:"10px 0" }}>
                <div style={{ fontSize:38, marginBottom:8 }}>🙏</div>
                <div style={{ ...dm, fontSize:14, color:C.text }}>{tl("fbThanks")}</div>
              </div>
            ) : (
              <>
                <div style={{ ...dm, fontSize:14, color:C.text, marginBottom:14 }}>{tl("fbTitle")}</div>
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setPfRating(n)}
                      style={{ flex:1, padding:"10px 0", borderRadius:10, border:`1px solid ${pfRating>=n ? "rgba(251,191,36,0.55)" : C.bord}`, background: pfRating>=n ? "rgba(251,191,36,0.12)" : "transparent", fontSize:22, cursor:"pointer", transition:"all 0.15s", color: pfRating>=n ? "#fbbf24" : C.mut }}>
                      {pfRating >= n ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                {pfRating > 0 && (
                  <textarea
                    placeholder={tl("fbPlaceholder")}
                    value={pfComment}
                    onChange={e => setPfComment(e.target.value)}
                    rows={3}
                    style={{ width:"100%", padding:"10px 12px", background:"rgba(0,0,0,0.15)", border:`1px solid ${C.bord}`, borderRadius:10, color:C.text, fontSize:13, ...dm, resize:"none", outline:"none", boxSizing:"border-box", marginBottom:12 }}
                  />
                )}
                <button onClick={submitPF} disabled={!pfRating}
                  style={{ width:"100%", padding:"14px", borderRadius:12, background: pfRating ? C.accent : "rgba(14,165,233,0.12)", border:"none", color: pfRating ? "#fff" : C.mut, fontSize:15, fontWeight:700, cursor: pfRating ? "pointer" : "default", ...dm, opacity: pfRating ? 1 : 0.5, transition:"all 0.2s" }}>
                  {tl("fbSend")} →
                </button>
              </>
            )}
          </Card>
        </>
      );
    };

    // ── HITNO / Emergency screen ──
    const KioskEmergency = () => {
      const ne = emergencyNearby;
      const NUMS = [
        { n:"112", l:{hr:"Hitna pomoć / Spašavanje",de:"Notruf / Rettung",en:"Emergency / Rescue",it:"Emergenza / Soccorso",si:"Nujna pomoč",cz:"Tísňové volání",pl:"Pogotowie"}, icon:"🚑", clr:"#ef4444" },
        { n:"194", l:{hr:"Hitna medicinska",de:"Rettungsdienst",en:"Medical emergency",it:"Emergenza medica",si:"Reševalci",cz:"Záchranná služba",pl:"Pogotowie medyczne"}, icon:"🏥", clr:"#ef4444" },
        { n:"192", l:{hr:"Policija",de:"Polizei",en:"Police",it:"Polizia",si:"Policija",cz:"Policie",pl:"Policja"}, icon:"🚓", clr:"#3b82f6" },
        { n:"193", l:{hr:"Vatrogasci",de:"Feuerwehr",en:"Fire brigade",it:"Pompieri",si:"Gasilci",cz:"Hasiči",pl:"Straż pożarna"}, icon:"🚒", clr:"#f97316" },
        { n:"1987", l:{hr:"HAK · ceste",de:"Straßenhilfe",en:"Road assistance",it:"Soccorso stradale",si:"Pomoč na cesti",cz:"Silniční pomoc",pl:"Pomoc drogowa"}, icon:"🛣️", clr:"#f59e0b" },
      ];
      const lbl = (o) => o[lang] || o[lang==="at"?"de":"en"] || o.en || o.hr;
      const catGroups = [
        { key:"hospital", icon:"🏥", l:{hr:"Bolnice",de:"Krankenhäuser",en:"Hospitals",it:"Ospedali",si:"Bolnišnice",cz:"Nemocnice",pl:"Szpitale"} },
        { key:"clinic",   icon:"🩺", l:{hr:"Ambulante / Ordinacije",de:"Kliniken / Praxen",en:"Clinics / Practices",it:"Ambulatori / Studi",si:"Klinike",cz:"Kliniky",pl:"Kliniki"} },
        { key:"pharmacy", icon:"💊", l:{hr:"Ljekarnice",de:"Apotheken",en:"Pharmacies",it:"Farmacie",si:"Lekarne",cz:"Lékárny",pl:"Apteki"} },
        { key:"vet",      icon:"🐾", l:{hr:"Veterinari",de:"Tierärzte",en:"Veterinarians",it:"Veterinari",si:"Veterinarji",cz:"Veterináři",pl:"Weterynarze"} },
      ];
      const pharm = nearbyData?.categories?.pharmacy || [];
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
            <span style={{ fontSize:36 }}>🚨</span>
            <div>
              <div style={{ ...hf, fontSize:24, fontWeight:400, color:C.red }}>
                {({hr:"Hitne službe",de:"Notfalldienste",en:"Emergency services",it:"Servizi di emergenza",si:"Nujne službe",cz:"Záchranné služby",pl:"Służby ratunkowe"})[lang]||"Emergency"}
              </div>
              <div style={{ ...dm, fontSize:11, color:C.mut }}>📍 {kioskCity}</div>
            </div>
          </div>

          {/* Emergency numbers — always instant, no API needed */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
            {NUMS.map(num => (
              <a key={num.n} href={`tel:${num.n}`}
                style={{ padding:"14px 12px", borderRadius:14, background:`${num.clr}0a`, border:`1px solid ${num.clr}28`,
                  textDecoration:"none", display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{num.icon}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ ...dm, fontSize:18, fontWeight:600, color:num.clr, lineHeight:1 }}>{num.n}</div>
                  <div style={{ ...dm, fontSize:10, color:C.mut, marginTop:2, lineHeight:1.3 }}>{lbl(num.l)}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Nearby services by category */}
          {catGroups.map(cat => {
            const places = cat.key === "pharmacy" ? pharm
              : (ne?.categories?.[cat.key] || []);
            if (!places.length && ne !== null) return null; // loaded but empty — skip
            return (
              <div key={cat.key} style={{ marginBottom:16 }}>
                <div style={{ ...dm, fontSize:10, color:C.accent, letterSpacing:3, fontWeight:700, marginBottom:8 }}>
                  {cat.icon} {lbl(cat.l).toUpperCase()}
                </div>
                {(!ne && cat.key !== "pharmacy") ? (
                  // Loading shimmer
                  <div style={{ height:60, borderRadius:12, background:"rgba(14,165,233,0.04)", border:`1px solid ${C.bord}`,
                    backgroundImage:"linear-gradient(90deg,transparent 0%,rgba(14,165,233,0.06) 50%,transparent 100%)",
                    backgroundSize:"200% 100%", animation:"shimmer 1.6s ease infinite" }} />
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {places.map((p, i) => (
                      <div key={p.place_id||i} style={{ padding:"12px 14px", borderRadius:12, background:C.card, border:`1px solid ${C.bord}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ minWidth:0 }}>
                          <div style={{ ...dm, fontSize:14, color:C.text, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                          {p.address && <div style={{ ...dm, fontSize:11, color:C.mut, marginTop:1 }}>{p.address}</div>}
                        </div>
                        <div style={{ ...dm, fontSize:11, color:C.accent, flexShrink:0, marginLeft:8 }}>
                          {p.distance ? `${p.distance}m` : p.walkMin ? `${p.walkMin}min` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      );
    };

    /* ── DEPARTURE SCREEN ── */
    const KioskDeparture = () => {
      const depDate = G.departure ? new Date(G.departure) : null;
      const depDay = depDate ? depDate.toLocaleDateString(dateLocale || "hr-HR", { weekday:"long", day:"numeric", month:"long" }) : null;
      const stayNights = (G.arrival && G.departure)
        ? Math.max(1, Math.round((new Date(G.departure) - new Date(G.arrival)) / 86400000))
        : null;
      const depForecast = (forecast || FORECAST_DEFAULT)[0];
      const CHECKLIST = {
        hr:["Klima / TV isključeni","Prozori zatvoreni","Ključ vraćen","Parking propusnica","Prtljaga u autu"],
        de:["Klima / TV ausschalten","Fenster schließen","Schlüssel zurückgeben","Parkausweis mitnehmen","Gepäck im Auto"],
        en:["A/C & TV off","Windows closed","Key returned","Parking pass","Luggage in car"],
        it:["A/C e TV spenti","Finestre chiuse","Chiave restituita","Tagliando parcheggio","Bagagli in auto"],
        si:["Klima / TV izklopljeni","Okna zaprta","Ključ vrnjen","Parkirni listek","Prtljaga v avtu"],
        cz:["Klima / TV vypnuto","Okna zavřená","Klíč vrácen","Parkovací lístek","Zavazadla v autě"],
        pl:["Klima / TV wyłączone","Okna zamknięte","Klucz oddany","Bilet parkingowy","Bagaż w samochodzie"],
      };
      const TRANSPORT = [
        { icon:"✈️", label:{hr:"Aerodrom",de:"Flughafen",en:"Airport",it:"Aeroporto",si:"Letališče",cz:"Letiště",pl:"Lotnisko"}, q:`airport ${kioskCity} Croatia` },
        { icon:"⛴️", label:{hr:"Trajekt",de:"Fähre",en:"Ferry",it:"Traghetto",si:"Trajekt",cz:"Trajekt",pl:"Prom"}, q:`trajekt ferry ${kioskCity}` },
        { icon:"🚌", label:{hr:"Autobusni kol.",de:"Busbahnhof",en:"Bus station",it:"Staz. autobus",si:"Avtobusna post.",cz:"Autobusové nádraží",pl:"Dworzec aut."}, q:`bus station ${kioskCity}` },
        { icon:"🚕", label:{hr:"Taksi",de:"Taxi",en:"Taxi",it:"Taxi",si:"Taksi",cz:"Taxi",pl:"Taxi"}, q:`taxi ${kioskCity}` },
      ];
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ textAlign:"center", padding:"16px 0 20px" }}>
            <div style={{ fontSize:54, marginBottom:10 }} className="emoji-float">👋</div>
            <div style={{ ...hf, fontSize:28, fontWeight:400 }}>
              {({hr:`Doviđenja, ${G.first||""}!`,de:`Auf Wiedersehen, ${G.first||""}!`,en:`Goodbye, ${G.first||""}!`,it:`Arrivederci, ${G.first||""}!`,si:`Na svidenje, ${G.first||""}!`,cz:`Na shledanou, ${G.first||""}!`,pl:`Do widzenia, ${G.first||""}!`})[lang]||"Goodbye!"}
            </div>
            <div style={{ ...dm, color:C.mut, fontSize:14, marginTop:6 }}>
              {kioskCity}{stayNights ? ` · ${stayNights} ${stayNights===1?({hr:"noć",de:"Nacht",en:"night",it:"notte",si:"noč",cz:"noc",pl:"noc"})[lang]||"noć":({hr:"noći",de:"Nächte",en:"nights",it:"notti",si:"noči",cz:"nocí",pl:"nocy"})[lang]||"noći"}` : ""}
            </div>
            {depDay && <div style={{ ...dm, fontSize:12, color:C.accent, marginTop:4 }}>📅 {depDay}</div>}
          </div>

          {/* Departure day weather */}
          {depForecast && (
            <Card style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", marginBottom:12 }}>
              <div style={{ fontSize:34 }}>{depForecast.icon}</div>
              <div>
                <div style={{ ...dm, fontSize:10, color:C.mut, letterSpacing:1, marginBottom:2 }}>
                  {({hr:"Danas",de:"Heute",en:"Today",it:"Oggi",si:"Danes",cz:"Dnes",pl:"Dziś"})[lang]||"Today"}
                </div>
                <div style={{ fontSize:22, fontWeight:300 }}>{depForecast.h}° <span style={{ fontSize:14, color:C.mut }}>{depForecast.l}°</span></div>
              </div>
              <div style={{ flex:1, textAlign:"right", ...dm, fontSize:11, color:C.mut }}>
                {weather.wind > 0 ? `💨 ${weather.wind} km/h` : ""}
                {weather.uv > 0 ? ` · UV ${weather.uv}` : ""}
              </div>
            </Card>
          )}

          {/* Checklist */}
          <Card style={{ marginBottom:12 }}>
            <SectionLabel>{({hr:"Provjeri prije odlaska",de:"Checkliste vor der Abreise",en:"Before you leave",it:"Prima di partire",si:"Pred odhodom",cz:"Před odjezdem",pl:"Przed wyjazdem"})[lang]||"Before you leave"}</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {(CHECKLIST[lang]||CHECKLIST.en).map((item, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:10, background:"rgba(34,197,94,0.04)", border:"1px solid rgba(34,197,94,0.1)", ...dm, fontSize:12 }}>
                  <span style={{ color:"#22c55e", flexShrink:0 }}>✓</span>{item}
                </div>
              ))}
            </div>
          </Card>

          {/* Transport */}
          <Card style={{ marginBottom:16 }}>
            <SectionLabel>{({hr:"Prijevoz",de:"Transport",en:"Transport",it:"Trasporto",si:"Prevoz",cz:"Doprava",pl:"Transport"})[lang]||"Transport"}</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {TRANSPORT.map((tr, i) => (
                <a key={i} href={`https://www.google.com/maps/search/${encodeURIComponent(tr.q)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:12, background:"rgba(14,165,233,0.05)", border:`1px solid rgba(14,165,233,0.1)`, textDecoration:"none", color:C.text }}>
                  <span style={{ fontSize:20 }}>{tr.icon}</span>
                  <span style={{ ...dm, fontSize:12 }}>{(tr.label[lang]||tr.label.en)}</span>
                </a>
              ))}
            </div>
          </Card>

          {/* Checkout CTA */}
          <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
            <Btn warm onClick={() => { setPhase("post"); setSubScreen("summary"); updateGuest(roomCode.current, { phase:"post", subScreen:"summary" }); }}>
              {({hr:"Završi boravak →",de:"Aufenthalt beenden →",en:"Complete stay →",it:"Concludi soggiorno →",si:"Zaključi bivanje →",cz:"Dokončit pobyt →",pl:"Zakończ pobyt →"})[lang]||"Complete stay →"}
            </Btn>
          </div>
        </>
      );
    };

    if (subScreen === "home") return KioskHome();
    if (subScreen === "departure") return KioskDeparture();
    if (subScreen === "restaurants") return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <RestaurantFinder lang={lang} initialCity={
          { "Šibenik":"sibenik", "Korčula":"dubrovnik", "Brač":"split", "Poreč":"rovinj", "Primošten":"sibenik" }[kioskCity]
          || (kioskCity || "rab").toLowerCase()
        } />
      </>
    );
    if (subScreen === "rabcard") return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <RabCard
          lang={lang}
          affiliateId={affiliateId || loadDelta().tzPoint || ""}
          C={C} dm={dm}
        />
      </>
    );
    if (subScreen === "activities") return KioskActivities();
    if (subScreen === "excursions") return KioskExcursions();
    if (subScreen === "gems") return KioskGems();
    if (subScreen === "chat") return KioskChat();
    if (subScreen === "affiliate" && affiliateId) return KioskAffiliate();
    if (subScreen === "emergency") return KioskEmergency();
    if (subScreen === "beach-status") return (<><BackBtn onClick={() => setSubScreen("home")} /><BeachStatus lang={lang} C={C} dm={dm} hf={hf} /></>);
    if (subScreen === "opg") return (<><BackBtn onClick={() => setSubScreen("home")} /><OPGDirectory lang={lang} C={C} dm={dm} hf={hf} /></>);
    if (subScreen === "wellness") return (<><BackBtn onClick={() => setSubScreen("home")} /><WellnessRoutes lang={lang} C={C} dm={dm} hf={hf} /></>);
    if (PRACTICAL[subScreen] || NEARBY_CATS.includes(subScreen)) return KioskDetail();
    return KioskHome();
  };

  /* ══════════════════════════════
     PHASE 3: POST-STAY
     ══════════════════════════════ */
  const PostStay = () => {
    // Dynamic stay duration from guest data or DELTA
    const delta = loadDelta();
    const arrDate = G.arrival || delta.arrival_date;
    const depDate = G.departure || delta.departure_date;
    const stayNights = (arrDate && depDate)
      ? Math.max(1, Math.round((new Date(depDate) - new Date(arrDate)) / 86400000))
      : null;
    const loyaltyPts = 125 + (stayNights ? stayNights * 15 : 0);
    const loyaltyCode = G.name ? G.name.split(" ")[0].toUpperCase().slice(0,8) + new Date().getFullYear() : "JADRAN" + new Date().getFullYear();
    return (
    <>
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }} className="emoji-float">🌅</div>
        <div style={{ ...hf, fontSize: 34, fontWeight: 400 }}>{t("thanks",lang)}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          {kioskCity}{stayNights ? ` · ${stayNights} ${stayNights === 1 ? ({hr:"noć",de:"Nacht",en:"night",it:"notte"})[lang]||"noć" : ({hr:"noći",de:"Nächte",en:"nights",it:"notti"})[lang]||"noći"}` : ""} · {t("unforgettable",lang)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
        {/* Loyalty */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, borderColor: "rgba(14,165,233,0.1)" }}>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.gold, marginBottom: 4 }}>JADRAN LOYALTY</div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>🌊 {LOYALTY.tier}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, marginTop: 8 }}>
            {loyaltyPts} {t("points",lang)} → <strong style={{ color: C.gold }}>{LOYALTY.next}</strong> ({LOYALTY.nextPts})
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", overflow: "hidden", margin: "12px 0 6px" }}>
            <div style={{ height: "100%", width: `${Math.min(100, (loyaltyPts / LOYALTY.nextPts) * 100)}%`, borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>{t("more",lang)} {Math.max(0, LOYALTY.nextPts - loyaltyPts)} {t("points",lang)}</div>
        </Card>

        {/* Revenue summary — admin only (visible with ?admin=sial) */}
        {isAdmin && <Card>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8 }}>💰 {t("revenue",lang)} (admin)</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 2 }}>
            Premium: <strong style={{ color: C.green }}>9.99–49.99€</strong><br />
            Affiliate: <strong style={{ color: C.green }}>~8-15€</strong><br />
            <span style={{ borderTop: `1px solid ${C.bord}`, display: "block", paddingTop: 4, marginTop: 4 }}>
              UKUPNO: <strong style={{ color: C.gold, fontSize: 18 }}>~20-30€</strong>
            </span>
          </div>
        </Card>}
      </div>

      {/* Referral */}
      <Card style={{ textAlign: "center", border: `1px dashed rgba(14,165,233,0.15)`, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{t("inviteFriends",lang)}</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 8 }}>{t("bothDiscount",lang)}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: C.accent, margin: "10px 0" }}>{loyaltyCode}</div>
        <Btn primary>{t("shareCode",lang)}</Btn>
      </Card>

      {/* Rebooking — Booking.com Affiliate */}
      <Card style={{ textAlign: "center", padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("nextYear",lang)}</div>
        <div style={{ ...dm, fontSize: 14, color: C.mut, marginBottom: 16, lineHeight: 1.6 }}>
          {t("planNext",lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 16, textAlign: "left" }}>
          {ACCOMMODATION.slice(0, 4).map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px 12px", background: "rgba(0,85,166,0.04)", border: `1px solid rgba(0,85,166,0.1)`, borderRadius: 12, cursor: "pointer", transition: "all 0.3s" }}>
                <CityIcon name={a.name.hr || a.name.en} size={18} />
                <div style={{ ...dm, fontSize: 12, fontWeight: 500, marginTop: 4 }}>{a.name[lang] || a.name.hr}</div>
              </div>
            </a>
          ))}
        </div>
        <a href={BKG(`${kioskCity}, Croatia`)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "14px 28px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,53,128,0.3)" }}>{t("browseOn",lang)}</a>
      </Card>

      {/* Monetization breakdown (admin) */}
      {isAdmin && <Card style={{ background: `linear-gradient(135deg,rgba(251,191,36,0.04),rgba(14,165,233,0.03))`, borderColor: "rgba(251,191,36,0.08)" }}>
        <SectionLabel extra="ADMIN">MONETIZACIJA</SectionLabel>
        <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
          1. Premium (9.99€) · 2. Affiliate (~8-15€) · 3. Host fee<br />
          <span style={{ color: C.gold }}>📊 ~20-30€/gost</span>
        </div>
      </Card>}

      {/* ── EXIT NAVIGATION ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        <a href="/explore" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 12px", borderRadius: 16, background: "rgba(14,165,233,0.06)", border: `1px solid rgba(14,165,233,0.12)`, textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🗺️</div>
          <div style={{ ...dm, fontSize: 13, fontWeight: 600, color: C.accent, textAlign: "center" }}>
            {({hr:"Istraži destinacije",de:"Destinationen",en:"Explore",it:"Esplora",si:"Destinacije",cz:"Destinace",pl:"Destynacje"})[lang]||"Explore"}
          </div>
        </a>
        <button onClick={() => { setPhase("pre"); setSubScreen("pretrip"); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 12px", borderRadius: 16, background: "rgba(251,191,36,0.05)", border: `1px solid rgba(251,191,36,0.1)`, cursor: "pointer" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>🛡️</div>
          <div style={{ ...dm, fontSize: 13, fontWeight: 600, color: C.gold, textAlign: "center" }}>
            {({hr:"Planiraj novi odmor",de:"Neue Reise",en:"Plan new trip",it:"Nuovo viaggio",si:"Nova pot",cz:"Nová cesta",pl:"Nowa podróż"})[lang]||"New trip"}
          </div>
        </button>
      </div>
    </>
    );
  };

  /* ═══ MAIN RENDER ═══ */

  /* ─── GUEST ONBOARDING ─── */
  if (showOnboarding) return (
    <GuestOnboarding
      roomCode={roomCode.current}
      onComplete={(guestData) => {
        setGuestProfile({
          name: guestData.name, first: guestData.first || guestData.name.split(" ").pop(),
          country: guestData.country, flag: guestData.flag || "🌍", lang: guestData.lang || "en",
          adults: guestData.adults || 2, kids: guestData.kids || 0, kidsAges: guestData.kidsAges || [],
          interests: guestData.interests || [], arrival: guestData.arrival || "",
          departure: guestData.departure || "", car: guestData.car || false,
          accommodation: guestData.accommodation || "", host: guestData.host || "",
          hostPhone: guestData.hostPhone || "", email: guestData.email || "",
        });
        // Sprint 7B — persist dates into DELTA so lifecycle hook works on all paths
        if (guestData.arrival || guestData.departure) {
          saveDelta({ arrival_date: guestData.arrival || null, departure_date: guestData.departure || null });
        }
        setLang(guestData.lang || "en");
        // Auto-set phase based on dates
        const now = new Date();
        const cin = new Date(guestData.arrival);
        const cout = new Date(guestData.departure);
        if (now < cin) { setPhase("pre"); setSubScreen("pretrip"); }
        else if (now <= cout) {
          setPhase("kiosk"); setSubScreen("home");
          // Grant 72h AI trial — guest arrived, no trip button in this flow
          if (!premium) {
            try {
              const until = Date.now() + 72 * 60 * 60 * 1000;
              localStorage.setItem("jadran_ai_trial_until", String(until));
              localStorage.setItem("jadran_ai_premium", "1");
            } catch {}
            setPremium(true);
          }
        }
        else { setPhase("post"); setSubScreen("summary"); }
        setInterests(new Set(guestData.interests || []));
        setShowOnboarding(false);
        setSplash(false);
      }}
    />
  );

  /* ─── PARTNER STATS DASHBOARD ─── */
  if (statsAccess) return <PartnerStatsDashboard partner={statsAccess.partner} pin={statsAccess.pin} />;

  /* ─── CINEMATIC SPLASH ─── */
  if (splash) return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#061020", color: "#e0f2fe", minHeight: "100dvh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes splash-logo-reveal { 0% { opacity:0; transform: scale(0.7) translateY(10px); filter: blur(8px); }
          60% { opacity:1; transform: scale(1.02) translateY(0); filter: blur(0); }
          100% { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes splash-text-reveal { 0% { opacity:0; transform: translateY(16px); letter-spacing: 12px; }
          100% { opacity:1; transform: translateY(0); letter-spacing: 8px; } }
        @keyframes splash-tagline { 0% { opacity:0; transform: translateY(10px); } 100% { opacity:0.6; transform: translateY(0); } }
        @keyframes splash-line { 0% { width: 0; } 100% { width: 80px; } }
        @keyframes splash-dots { 0%,20% { opacity:0; } 30% { opacity:1; } 60% { opacity:1; } 70%,100% { opacity:0; } }
        @keyframes splash-glow { 0%,100% { box-shadow: 0 0 40px rgba(14,165,233,0.2), 0 0 80px rgba(14,165,233,0.08); }
          50% { box-shadow: 0 0 60px rgba(14,165,233,0.35), 0 0 120px rgba(14,165,233,0.12); } }
        @keyframes splash-fade-out { 0% { opacity:1; } 100% { opacity:0; pointer-events:none; } }
        @keyframes splash-particles { 0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-120px) scale(0); opacity: 0; } }
        .splash-wrap { animation: splash-fade-out 0.8s ease 3s forwards; }
      `}</style>

      {/* Ambient light */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 60%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.03) 0%, transparent 50%)" }} />

      {/* Animated waves at bottom */}
      <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"320px", opacity:0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#0ea5e9" d="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z;M0,180 C320,120 640,220 960,140 C1120,110 1280,200 1440,170 L1440,320 L0,320 Z;M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z" />
        </path>
        <path fill="#0284c7" opacity="0.6" d="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z;M0,190 C360,240 720,160 1080,210 C1260,230 1350,180 1440,205 L1440,320 L0,320 Z;M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z" />
        </path>
        <path fill="#075985" opacity="0.4" d="M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z;M0,235 C400,260 800,220 1200,245 C1320,255 1380,230 1440,242 L1440,320 L0,320 Z;M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z" />
        </path>
      </svg>

      {/* Floating particles */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position:"absolute",
            left: `${8 + (i * 7.5)}%`,
            bottom: `${10 + (i % 3) * 15}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(14,165,233,0.5)" : "rgba(251,191,36,0.4)",
            animation: `splash-particles ${3 + (i % 4)}s ease-in-out ${0.5 + i * 0.3}s infinite`,
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-wrap" style={{ textAlign:"center", position:"relative", zIndex:2 }}>
        {/* Logo */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #0284c7, #075985)",
          display: "grid", placeItems: "center",
          margin: "0 auto 28px",
          fontSize: 40, fontWeight: 700, color: "#fff",
          animation: "splash-logo-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both, splash-glow 3s ease-in-out infinite",
        }}>J</div>

        {/* Brand name */}
        <div style={{
          fontSize: 44, fontWeight: 300, textTransform: "uppercase", color: "#e0f2fe",
          animation: "splash-text-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
          letterSpacing: 8,
        }}>JADRAN</div>

        {/* Decorative line */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(251,191,36,0.3), transparent)",
          margin: "16px auto",
          animation: "splash-line 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14, fontWeight: 300, textTransform: "uppercase", letterSpacing: 4,
          color: "rgba(14,165,233,0.7)",
          animation: "splash-tagline 0.8s ease 1.6s both",
        }}>{t("tagline",lang)}</div>

        {/* Loading dots */}
        <div style={{ display:"flex", justifyContent:"center", gap: 6, marginTop: 32 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "rgba(14,165,233,0.5)",
              animation: `splash-dots 1.5s ease ${1.8 + i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* Powered by */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase",
          marginTop: 40,
          animation: "splash-tagline 0.6s ease 2.2s both",
        }}>SIAL Consulting d.o.o. · jadran.ai</div>
      </div>

      {/* Skip / My Jadran buttons */}
      <div style={{ position:"absolute", bottom: 32, display:"flex", flexDirection:"column", alignItems:"center", gap: 12, animation: "splash-tagline 0.5s ease 1.5s both" }}>
        {returningKiosk?.city && (
          <button onClick={() => {
            if (returningKiosk.premium) setPremium(true);
            if (returningKiosk.lang) setLang(returningKiosk.lang);
            setPhase("kiosk"); setSubScreen("home"); setSplash(false);
          }} style={{
            fontFamily:"'Outfit',sans-serif",
            background:"linear-gradient(135deg,rgba(201,168,76,0.18),rgba(245,215,142,0.10))",
            border:"1px solid rgba(201,168,76,0.45)", borderRadius: 22,
            color:"#F5D78E", fontSize: 14, fontWeight: 600, padding:"12px 32px", cursor:"pointer",
            letterSpacing: 0.5, transition:"all 0.2s", display:"flex", alignItems:"center", gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.background="linear-gradient(135deg,rgba(201,168,76,0.28),rgba(245,215,142,0.18))"; }}
          onMouseLeave={e => { e.currentTarget.style.background="linear-gradient(135deg,rgba(201,168,76,0.18),rgba(245,215,142,0.10))"; }}
          >🏝 Nastavi u {returningKiosk.city} →</button>
        )}
        <button onClick={() => setSplash(false)} style={{
          fontFamily:"'Outfit',sans-serif",
          background:"rgba(186,230,253,0.07)", border:"1px solid rgba(186,230,253,0.25)", borderRadius: 20,
          color:"rgba(186,230,253,0.75)", fontSize: 12, padding:"10px 28px", cursor:"pointer",
          letterSpacing: 1.5, textTransform:"uppercase", transition:"all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background="rgba(186,230,253,0.15)"; e.currentTarget.style.color="rgba(186,230,253,1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background="rgba(186,230,253,0.07)"; e.currentTarget.style.color="rgba(186,230,253,0.75)"; }}
        >{t("skipBtn",lang)}</button>
      </div>
    </div>
  );
  return (
    <ThemeProvider C={C}>
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: `linear-gradient(160deg, ${C.bg} 0%, ${C.deep || C.bg} 50%, ${C.sky || C.bg} 100%)`, color: C.text, minHeight: "100dvh", position: "relative", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {fonts}

      <style>{GLOBAL_CSS}</style>
      <div className="grain" />
      <div className="wave-deco" />
      <div className="jadran-ambient" />

      {/* ── PWA Install Banner — shown when browser supports install and not yet installed ── */}
      {pwaPrompt && !pwaInstalled && (
        <div style={{ position: "fixed", bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", left: 16, right: 16, zIndex: 9998,
          background: "rgba(5,14,30,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(14,165,233,0.25)", borderRadius: 18,
          padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>📲</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#e0f2fe", marginBottom: 2 }}>
              {({ hr:"Instaliraj aplikaciju", de:"App installieren", at:"App installieren", en:"Install app", it:"Installa l'app", si:"Namesti aplikacijo", cz:"Instalovat aplikaci", pl:"Zainstaluj aplikację" })[lang] || "Install app"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {({ hr:"Dodaj JADRAN na početni ekran — radi i offline", de:"JADRAN zum Startbildschirm hinzufügen", at:"JADRAN zum Startbildschirm hinzufügen", en:"Add JADRAN to home screen — works offline", it:"Aggiungi JADRAN alla schermata iniziale", si:"Dodaj JADRAN na začetni zaslon", cz:"Přidat JADRAN na domovskou obrazovku", pl:"Dodaj JADRAN do ekranu głównego" })[lang] || "Add to home screen — works offline"}
            </div>
          </div>
          <button onClick={async () => {
            if (!pwaPrompt) return;
            pwaPrompt.prompt();
            const { outcome } = await pwaPrompt.userChoice;
            if (outcome === "accepted") setPwaInstalled(true);
            setPwaPrompt(null);
          }} style={{ padding: "10px 18px", background: "linear-gradient(135deg,#0ea5e9,#0284c7)", border: "none", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
            {({ hr:"Instaliraj", de:"Installieren", at:"Installieren", en:"Install", it:"Installa", si:"Namesti", cz:"Instalovat", pl:"Zainstaluj" })[lang] || "Install"}
          </button>
          <button onClick={() => setPwaPrompt(null)} aria-label="Zatvori" style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "8px", flexShrink: 0, minWidth: 36, minHeight: 36, display: "grid", placeItems: "center" }}>×</button>
        </div>
      )}

      {/* ── Offline banner ── */}
      {isOffline && (
        <div style={{ position: "fixed", top: "env(safe-area-inset-top, 0px)", left: 0, right: 0, zIndex: 9997, padding: "8px 16px", background: "rgba(239,68,68,0.92)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'Outfit',sans-serif", letterSpacing: 0.3 }}>
          <span>📡</span>
          <span>{lang === "en" ? "No internet connection" : lang === "de" || lang === "at" ? "Keine Internetverbindung" : lang === "it" ? "Nessuna connessione" : lang === "si" ? "Brez povezave" : lang === "cz" ? "Offline" : lang === "pl" ? "Brak połączenia" : "Nema internet veze"}</span>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "0 clamp(12px, 3vw, 24px)" }} className="page-enter">
        {/* ── HEADER ── */}
        <div style={{ padding: "14px 0 10px", position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Left: hamburger */}
          <button onClick={() => setMenuOpen(m => !m)} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.bord}`, borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 0, flexShrink: 0 }} aria-label="Meni">
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? C.accent : C.mut, borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "transparent" : C.mut, borderRadius: 2, transition: "all 0.2s" }} />
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? C.accent : C.mut, borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
          </button>

          {/* Center: JADRAN */}
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", ...hf, fontSize: 18, fontWeight: 400, letterSpacing: 4, textTransform: "uppercase", color: C.text, pointerEvents: "none" }}>Jadran</span>

          {/* Right: premium + lang */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {premium && (
              <span className="premium-shimmer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, fontSize: 9, ...dm, color: C.gold, letterSpacing: 2, fontWeight: 700, border: `1px solid ${C.goBorder}` }}>⭐ PREMIUM</span>
            )}
            <div style={{ display: "flex", gap: 2, background: "rgba(10,20,38,0.6)", borderRadius: 13, padding: 3, border: `1px solid ${C.bord}`, backdropFilter: "blur(10px)" }}>
              <button onClick={() => setLangOpen(!langOpen)} className="lang-btn" style={{ ...dm, padding: "5px 7px", background: C.acDim, border: `1px solid ${C.acBorder}`, borderRadius: 10, cursor: "pointer", fontSize: 15, lineHeight: 1 }} title="Jezik">{LANGS.find(l => l.code === lang)?.flag || "🇭🇷"}</button>
              {langOpen && LANGS.filter(lg => lg.code !== lang).map(lg => (
                <button key={lg.code} onClick={() => { setLang(lg.code); saveDelta({ lang: lg.code }); setLangOpen(false); }} className="lang-btn" style={{ ...dm, padding: "5px 7px", background: "transparent", border: "1px solid transparent", borderRadius: 10, cursor: "pointer", fontSize: 15, lineHeight: 1, transition: "all 0.2s", animation: "fadeIn 0.18s both" }} title={lg.name}>{lg.flag}</button>
              ))}
            </div>
          </div>

          {/* Hamburger dropdown */}
          {menuOpen && <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 99, minWidth: 220, background: "rgba(5,14,30,0.97)", backdropFilter: "blur(24px)", borderRadius: 14, border: `1px solid ${C.bord}`, boxShadow: "0 12px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>
              {returningKiosk?.city && (
                <button onClick={() => {
                  setMenuOpen(false);
                  if (returningKiosk.premium) setPremium(true);
                  if (returningKiosk.lang) setLang(returningKiosk.lang);
                  setPhase("kiosk"); setSubScreen("home");
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg,rgba(201,168,76,0.12),rgba(245,215,142,0.06))", border: "none", borderBottom: `1px solid rgba(201,168,76,0.2)`, cursor: "pointer", width: "100%", fontFamily: "'Outfit',sans-serif", textAlign: "left", color: "#F5D78E" }}>
                  <span style={{ fontSize: 18 }}>🏝</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>My Jadran</div>
                    <div style={{ fontSize: 11, color: "rgba(245,215,142,0.6)", fontWeight: 400, marginTop: 1 }}>{returningKiosk.city}</div>
                  </div>
                </button>
              )}
              <button onClick={() => { setMenuOpen(false); setSubScreen("home"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", color: C.accent, fontSize: 14, fontWeight: 600, background: "none", border: "none", borderBottom: `1px solid ${C.bord}`, cursor: "pointer", width: "100%", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                {({hr:"Početna",de:"Startseite",en:"Home",it:"Home",si:"Domov",cz:"Domů",pl:"Strona główna"})[lang]||"Home"}
              </button>
              <button onClick={() => { setMenuOpen(false); setSubScreen("chat"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", color: "#a78bfa", fontSize: 14, fontWeight: 600, background: "none", border: "none", borderBottom: `1px solid ${C.bord}`, cursor: "pointer", width: "100%", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {t("aiGuide", lang)}
              </button>
              <a href="/explore" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", color: C.mut, fontSize: 14, textDecoration: "none", borderBottom: `1px solid ${C.bord}` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                {({hr:"Destinacije",de:"Destinationen",en:"Destinations",it:"Destinazioni",si:"Destinacije",cz:"Destinace",pl:"Destynacje"})[lang]||"Explore"}
              </a>
              <button onClick={() => { setMenuOpen(false); window.history.back(); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", color: C.mut, fontSize: 14, background: "none", border: "none", cursor: "pointer", width: "100%", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                {({hr:"Nazad",de:"Zurück",en:"Back",it:"Indietro",si:"Nazaj",cz:"Zpět",pl:"Wstecz"})[lang]||"Back"}
              </button>
            </div>
          </>}
        </div>


        {/* Content */}
        {phase === "pre" && <div className="page-enter">{PreTrip()}</div>}
        {phase === "kiosk" && <div key={subScreen} style={{ paddingBottom: subScreen !== "chat" ? "calc(80px + env(safe-area-inset-bottom, 0px))" : 0 }}>{Kiosk()}</div>}
        {phase === "post" && <div className="page-enter">{PostStay()}</div>}

        <div style={{ ...dm, textAlign: "center", padding: "20px 0 28px", paddingBottom: phase === "kiosk" && subScreen !== "chat" ? 100 : 28, fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          JADRAN · SIAL Consulting d.o.o.
        </div>
      </div>

      {/* ── KIOSK BOTTOM TAB BAR ── */}
      {phase === "kiosk" && !kioskWelcome && subScreen !== "chat" && (
        <TabBar
          active={subScreen === "affiliate" ? "home" : (["home","activities","gems","excursions"].includes(subScreen) ? subScreen : "home")}
          onChange={(k) => {
            if (k === "live") { setShowKioskLive(true); return; }
            if (k === "explore") { window.location.href = "/explore"; return; }
            setSubScreen(k); window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          items={[
            { key: "home",       icon: IC.home,   label: ({hr:"Početna",de:"Start",en:"Home",it:"Home",si:"Domov",cz:"Domů",pl:"Start"})[lang] || "Home" },
            { key: "chat",       icon: IC.bot,    label: "AI Chat" },
            { key: "live",       icon: IC.map,    label: ({hr:"Live",de:"Live",en:"Live",it:"Live"})[lang] || "Live" },
            { key: "activities", icon: IC.ticket, label: ({hr:"Aktivnosti",de:"Aktivitäten",en:"Activities",it:"Attività",si:"Aktivnosti",cz:"Aktivity",pl:"Aktywności"})[lang] || "Activities" },
            { key: "explore",    icon: IC.search, label: ({hr:"Destinacije",de:"Ziele",en:"Explore",it:"Esplora",si:"Cilji",cz:"Cíle",pl:"Cele"})[lang] || "Explore" },
          ]}
        />
      )}

      {/* ── KIOSK LIVE OVERLAY ── */}
      {showKioskLive && (
        <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(5,14,30,0.75)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)" }}
          onClick={() => setShowKioskLive(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ position:"absolute", bottom:0, left:0, right:0, background:"#0a1628", borderRadius:"24px 24px 0 0", padding:"20px 20px", paddingBottom:"calc(20px + env(safe-area-inset-bottom, 0px))", animation:"fadeUp 0.28s ease" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:17, fontWeight:500 }}>🌊 Jadran Sense™</div>
                <div style={{ fontSize:11, color: senseData?.source==="yolo" ? "#22c55e" : "#64748b", marginTop:2 }}>
                  {senseData?.source==="yolo" ? `● LIVE · ${kioskCity}` : `● ${({hr:"procjena",de:"Schätzung",en:"estimate",it:"stima"})[lang]||"estimate"} · ${kioskCity}`}
                </div>
              </div>
              <button onClick={() => setShowKioskLive(false)} aria-label="Zatvori" style={{ background:"rgba(255,255,255,0.06)", border:`1px solid rgba(14,165,233,0.12)`, borderRadius:10, color:"#94a3b8", fontSize:13, padding:"8px 14px", cursor:"pointer", minHeight:40 }}>✕</button>
            </div>

            {/* Weather row — always shown */}
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.1)", marginBottom:12 }}>
              <span style={{ fontSize:28 }}>{weather.icon || "🌤"}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:20, fontWeight:300, color:"#e2e8f0" }}>{weather.temp ?? "—"}°C</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>
                  {weather.condition || ""}
                  {weather.wind > 0 ? ` · ${({hr:"vjetar",de:"Wind",en:"wind",it:"vento"})[lang]||"wind"} ${weather.wind} km/h` : ""}
                  {weather.uv > 0 ? ` · UV ${weather.uv}` : ""}
                </div>
              </div>
              <div style={{ fontSize:11, color:"#475569", textAlign:"right" }}>📍 {kioskCity}</div>
            </div>

            {/* Sense tiles */}
            <div style={{ display:"grid", gridTemplateColumns: [senseData?.parking, senseData?.beach, senseData?.marina].filter(Boolean).length === 3 ? "1fr 1fr 1fr" : [senseData?.parking, senseData?.beach, senseData?.marina].filter(Boolean).length === 2 ? "1fr 1fr" : "1fr", gap:10 }}>
              {senseData?.beach && (
                <div style={{ padding:"14px 10px", borderRadius:14, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.12)", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>🏖️</div>
                  <div style={{ fontSize:20, fontWeight:300, color: senseData.beach.crowd==="mirno"?"#22c55e":senseData.beach.crowd==="malo gužve"?"#38bdf8":senseData.beach.crowd==="srednje gužve"?"#f59e0b":"#ef4444" }}>{senseData.beach.occupancy_pct}%</div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:2, lineHeight:1.3 }}>{senseData.beach.crowd}</div>
                </div>
              )}
              {senseData?.parking && (
                <div style={{ padding:"14px 10px", borderRadius:14, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.12)", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>🅿️</div>
                  <div style={{ fontSize:20, fontWeight:300, color: senseData.parking.status==="slobodno"?"#22c55e":senseData.parking.status==="umjereno"?"#f59e0b":"#ef4444" }}>{senseData.parking.free_spots}<span style={{ fontSize:13, color:"#64748b" }}>/{senseData.parking.total_spots}</span></div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{({hr:"slobodnih",de:"frei",en:"free",it:"liberi"})[lang]||"free"}</div>
                </div>
              )}
              {senseData?.marina && (
                <div style={{ padding:"14px 10px", borderRadius:14, background:"rgba(14,165,233,0.06)", border:"1px solid rgba(14,165,233,0.12)", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>⛵</div>
                  <div style={{ fontSize:20, fontWeight:300, color: senseData.marina.status==="slobodno"?"#22c55e":senseData.marina.status==="umjereno"?"#f59e0b":"#ef4444" }}>{senseData.marina.free_moorings}</div>
                  <div style={{ fontSize:10, color:"#64748b", marginTop:2 }}>{({hr:"vezova",de:"Plätze",en:"berths",it:"posti"})[lang]||"berths"}</div>
                </div>
              )}
              {!senseData && (
                <div style={{ gridColumn:"1/-1", padding:"20px", textAlign:"center", color:"#64748b", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#0ea5e9", display:"inline-block", animation:"pulse 1s infinite" }} />
                  {({hr:"Učitavam senzore...",de:"Sensoren laden...",en:"Loading sensors...",it:"Caricamento sensori..."})[lang]||"Loading..."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {showPaywall && <Paywall />}
      {showConfirm && <BookConfirm />}

      {/* ── Inline Street View overlay ── */}
      {svModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", background: "#000" }}
          onClick={() => setSvModal(null)}>
          {/* Header bar */}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", paddingTop: "calc(12px + env(safe-area-inset-top, 0px))", background: "rgba(10,22,40,0.95)", borderBottom: "1px solid rgba(14,165,233,0.1)", flexShrink: 0, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <div style={{ ...dm, fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "calc(100% - 120px)" }}>
              🌍 {svModal.name}
            </div>
            <button onClick={() => setSvModal(null)}
              style={{ ...dm, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.bord}`, borderRadius: 10, color: C.mut, fontSize: 13, padding: "8px 14px", cursor: "pointer", minHeight: 40 }}>
              ✕ {({hr:"Zatvori",de:"Schließen",en:"Close",it:"Chiudi"})[lang]||"Zatvori"}
            </button>
          </div>

          {/* Street View iframe — fills remaining height */}
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, position: "relative" }}>
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&location=${svModal.lat},${svModal.lng}&fov=80&pitch=0`}
              title={`Street View — ${svModal.name}`}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              allow="fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Bottom navigation bar */}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 10, padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", background: "rgba(10,22,40,0.95)", borderTop: "1px solid rgba(14,165,233,0.1)", flexShrink: 0, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <button onClick={() => { setSvModal(null); window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${svModal.lat},${svModal.lng}&travelmode=walking`; }}
              style={{ ...dm, flex: 1, padding: "14px", background: C.acDim, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 14, color: C.accent, fontSize: 14, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48 }}>
              🚶 {({hr:"Navigiraj pješice",de:"Zu Fuß navigieren",en:"Walk there",it:"A piedi"})[lang]||"Navigiraj pješice"}
            </button>
            <button onClick={() => { setSvModal(null); window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${svModal.lat},${svModal.lng}&travelmode=driving`; }}
              style={{ ...dm, padding: "14px 20px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14, color: C.gold, fontSize: 20, cursor: "pointer", flexShrink: 0, minHeight: 48, display: "grid", placeItems: "center" }}>
              🚗
            </button>
          </div>
        </div>
      )}

      {/* Gem detail */}
      {selectedGem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedGem(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, border: `1px solid rgba(251,191,36,0.12)` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedGem.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedGem.name}</div>
            <div style={{ ...dm, fontSize: 15, color: C.mut, lineHeight: 1.8, marginBottom: 20 }}>{typeof selectedGem.desc === "object" ? (selectedGem.desc[lang] || selectedGem.desc.hr) : selectedGem.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[{ l: "Najbolje doba", v: selectedGem.best }, { l: "Težina", v: selectedGem.diff }].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut }}>{x.l}</div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 600 }}>{typeof x.v === "object" ? (x.v[lang] || x.v.hr || "") : (x.v || "")}</div>
                </div>
              ))}
            </div>
            <Card glow style={{ background: C.goDim, borderColor: "rgba(251,191,36,0.12)" }}>
              <div style={{ ...dm, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 LOCALS TIP</div>
              <div style={{ ...dm, fontSize: 14, lineHeight: 1.6 }}>{typeof selectedGem.tip === "object" ? (selectedGem.tip[lang] || selectedGem.tip.hr) : selectedGem.tip}</div>
            </Card>
            {selectedGem.lat && (() => {
              const gmKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
              const svSrc = gmKey
                ? `https://www.google.com/maps/embed/v1/streetview?key=${gmKey}&location=${selectedGem.lat},${selectedGem.lng}&fov=80&pitch=0`
                : null;
              return (
                <>
                  {/* Street View — tap header to expand fullscreen */}
                  <div style={{ borderRadius: 14, overflow: "hidden", marginTop: 16, marginBottom: 4, border: `1px solid rgba(14,165,233,0.12)` }}>
                    <button onClick={() => setSvModal({ lat: selectedGem.lat, lng: selectedGem.lng, name: selectedGem.name })}
                      style={{ width: "100%", padding: "7px 12px", background: "rgba(14,165,233,0.06)", border: "none", borderBottom: "1px solid rgba(14,165,233,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", ...dm }}>
                      <span style={{ fontSize: 11, color: C.accent, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🌍</span>
                        <span>{lang === "de" || lang === "at" ? "Umgebung ansehen — tippen zum Vergrößern" : lang === "en" ? "Look around — tap to expand" : lang === "it" ? "Guarda intorno — tocca per espandere" : "Pogledaj okolo — tapni za puni ekran"}</span>
                      </span>
                      <span style={{ fontSize: 11, color: C.mut }}>⛶</span>
                    </button>
                    {svSrc ? (
                      <div style={{ position: "relative" }}>
                        <iframe
                          src={svSrc}
                          title={`Street View — ${selectedGem.name}`}
                          style={{ width: "100%", height: 220, border: "none", display: "block" }}
                          loading="lazy"
                          allow="fullscreen"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <button onClick={() => setSvModal({ lat: selectedGem.lat, lng: selectedGem.lng, name: selectedGem.name })}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "rgba(14,165,233,0.04)", color: C.accent, fontSize: 13, border: "none", cursor: "pointer", ...dm }}>
                        🌍 {lang === "de" || lang === "at" ? "In Street View öffnen" : lang === "en" ? "Open Street View" : lang === "it" ? "Apri Street View" : "Otvori Street View"}
                      </button>
                    )}
                  </div>
                  {/* Navigate buttons — walking primary, driving secondary */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => { setSelectedGem(null); window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${selectedGem.lat},${selectedGem.lng}&travelmode=walking`; }}
                      style={{...dm,flex:1,padding:"13px",background:C.acDim,border:`1px solid rgba(14,165,233,0.15)`,borderRadius:14,color:C.accent,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600}}>
                      🚶 {({hr:"Vodi me pješice",de:"Zu Fuß navigieren",en:"Walk there",it:"A piedi"})[lang]||"Vodi me pješice"}
                    </button>
                    <button onClick={() => { setSelectedGem(null); window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${selectedGem.lat},${selectedGem.lng}&travelmode=driving`; }}
                      style={{...dm,padding:"13px 16px",background:"rgba(251,191,36,0.06)",border:`1px solid rgba(251,191,36,0.15)`,borderRadius:14,color:C.gold,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      🚗
                    </button>
                  </div>
                </>
              );
            })()}
            <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => setSelectedGem(null)}>{t("back",lang)}</Btn>
          </div>
        </div>
      )}

      {/* Viator Activity Modal */}
      {selectedViatorAct && (() => {
        const act = selectedViatorAct;
        const IMGS = act.images?.length ? act.images : [];
        const imgIdx = viatorImgIdx;
        const setImgIdx = setViatorImgIdx;
        const totalPrice = act.price ? (act.price * viatorPersons).toFixed(2) : "—";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 200, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px" }}
            onClick={() => setSelectedViatorAct(null)}>
            <div onClick={e => e.stopPropagation()} className="overlay-enter glass"
              style={{ background: "rgba(12,28,50,0.96)", borderRadius: 24, maxWidth: 520, width: "100%", border: `1px solid ${C.bord}`, overflow: "hidden" }}>
              {/* Photo gallery */}
              <div style={{ position: "relative", height: 240, background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(34,197,94,0.08))" }}>
                {IMGS.length > 0
                  ? <img src={IMGS[imgIdx % IMGS.length]} alt={act.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 72 }}>🏖️</div>}
                {IMGS.length > 1 && <>
                  <button onClick={e => { e.stopPropagation(); setImgIdx(p => Math.max(0, p - 1)); }} aria-label="Prethodna slika" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 44, height: 44, fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(8px)" }}>‹</button>
                  <button onClick={e => { e.stopPropagation(); setImgIdx(p => (p + 1) % IMGS.length); }} aria-label="Sljedeća slika" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 44, height: 44, fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(8px)" }}>›</button>
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                    {IMGS.map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === imgIdx % IMGS.length ? "#fff" : "rgba(255,255,255,0.4)" }} />)}
                  </div>
                </>}
                <button onClick={() => setSelectedViatorAct(null)} aria-label="Zatvori" style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 20, display: "grid", placeItems: "center", backdropFilter: "blur(8px)" }}>✕</button>
              </div>

              <div style={{ padding: "20px 24px 28px" }}>
                <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{act.title}</div>
                <div style={{ ...dm, display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: C.mut }}>
                  {act.rating && <span style={{ color: "#facc15" }}>★ {act.rating.toFixed(1)} <span style={{ color: C.mut }}>({act.reviewCount > 1000 ? `${(act.reviewCount/1000).toFixed(1)}k` : act.reviewCount})</span></span>}
                  <span>⏱ {act.duration}</span>
                  {act.category && <span style={{ color: "#22c55e" }}>{act.category}</span>}
                </div>
                {act.description && <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7, marginBottom: 20 }}>{act.description}</div>}

                {/* Date picker */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...dm, fontSize: 11, color: C.mut, display: "block", marginBottom: 6, letterSpacing: 1 }}>DATUM AKTIVNOSTI</label>
                  <input type="date" value={viatorBookDate} min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setViatorBookDate(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Persons stepper */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.bord}` }}>
                  <div style={{ ...dm, fontSize: 14 }}>Broj osoba</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={() => setViatorPersons(p => Math.max(1, p - 1))} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center" }}>−</button>
                    <span style={{ fontSize: 20, fontWeight: 600, minWidth: 24, textAlign: "center" }}>{viatorPersons}</span>
                    <button onClick={() => setViatorPersons(p => Math.min(20, p + 1))} style={{ width: 44, height: 44, borderRadius: "50%", border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center" }}>+</button>
                  </div>
                </div>

                {/* Total price */}
                <div style={{ textAlign: "center", padding: "14px", borderRadius: 14, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 20 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 4 }}>{act.price}€ × {viatorPersons} osoba</div>
                  <div style={{ fontSize: 32, fontWeight: 300, color: "#22c55e" }}>{totalPrice}€</div>
                  <div style={{ ...dm, fontSize: 10, color: C.mut, marginTop: 4 }}>Uključuje JADRAN uslugu · Plaćanje karticom</div>
                </div>

                <button onClick={() => startViatorBooking(act, viatorBookDate, viatorPersons)} disabled={payLoading || !viatorBookDate}
                  style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: payLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: payLoading || !viatorBookDate ? "not-allowed" : "pointer", opacity: viatorBookDate ? 1 : 0.5, ...dm, transition: "all 0.2s", minHeight: 52 }}>
                  {payLoading ? "⏳ Preusmjeravam…" : `🎟 Rezerviraj — ${totalPrice}€`}
                </button>
                <Btn style={{ width: "100%", marginTop: 10 }} onClick={() => setSelectedViatorAct(null)}>{t("back",lang)}</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── In-app browser ── */}
      {inAppUrl && (
        <div style={{ position:"fixed", inset:0, zIndex:350, display:"flex", flexDirection:"column", background:"#0a1628" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", paddingTop:"calc(10px + env(safe-area-inset-top,0px))", background:"#0f1e35", borderBottom:"1px solid rgba(255,255,255,0.08)", flexShrink:0 }}>
            <button onClick={() => setInAppUrl(null)} aria-label="Zatvori"
              style={{ background:"none", border:"1px solid rgba(255,255,255,0.12)", color:"#94a3b8", fontSize:15, cursor:"pointer", padding:"8px 12px", borderRadius:8, minHeight:40, flexShrink:0 }}>✕</button>
            <div style={{ flex:1, padding:"8px 10px", background:"rgba(255,255,255,0.05)", borderRadius:8, fontSize:11, color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", ...dm }}>
              {inAppUrl.replace(/^https?:\/\/(www\.)?/,"")}
            </div>
            <a href={inAppUrl} target="_blank" rel="noopener noreferrer"
              style={{ background:"rgba(14,165,233,0.12)", border:"1px solid rgba(14,165,233,0.2)", borderRadius:8, padding:"8px 10px", color:"#00b4d8", fontSize:11, fontWeight:700, textDecoration:"none", whiteSpace:"nowrap", flexShrink:0, ...dm }}>
              ↗ {lang==="de"||lang==="at"?"Browser":"Open"}
            </a>
          </div>
          <iframe
            key={inAppUrl}
            src={inAppUrl}
            style={{ flex:1, border:"none", background:"#fff", display:"block" }}
            title="JADRAN in-app browser"
            allow="payment; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        </div>
      )}

      {/* ── BJ Direct Room Booking ── */}
      {bjBookRoom && (
        <div style={{ position:"fixed", inset:0, zIndex:350, background:"rgba(5,14,30,0.92)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
          onClick={() => { if (bjStatus !== "loading") setBjBookRoom(null); }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#0f1e35", borderRadius:"24px 24px 0 0", maxWidth:480, width:"100%", border:"1px solid rgba(34,197,94,0.2)", borderBottom:"none", overflow:"hidden", maxHeight:"92dvh", overflowY:"auto", paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
            {bjStatus === "done" ? (
              <div style={{ padding:"36px 28px", textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:14 }}>🎉</div>
                <div style={{ fontSize:22, fontWeight:400, marginBottom:8, color:"#f0f9ff" }}>
                  {lang==="de"||lang==="at" ? "Anfrage gesendet!" : lang==="en" ? "Request sent!" : lang==="it" ? "Richiesta inviata!" : "Upit poslan!"}
                </div>
                <div style={{ ...dm, fontSize:14, color:"#64748b", lineHeight:1.7, marginBottom:20 }}>
                  {lang==="de"||lang==="at" ? "Der Gastgeber meldet sich innerhalb von 2 Stunden." : lang==="en" ? "The host will contact you within 2 hours." : lang==="it" ? "L'host vi contatterà entro 2 ore." : "Domaćin će vas kontaktirati u roku 2 sata."}
                </div>
                <div style={{ padding:"14px 18px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:12, marginBottom:24 }}>
                  <div style={{ ...dm, fontSize:10, color:"#86efac", letterSpacing:1.5, fontWeight:700, marginBottom:4 }}>BROJ UPITA</div>
                  <div style={{ fontFamily:"monospace", fontSize:20, fontWeight:800, color:"#22c55e" }}>{bjConfirmId}</div>
                </div>
                <button onClick={() => { setBjBookRoom(null); setBjStatus(null); }}
                  style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:"rgba(34,197,94,0.12)", color:"#22c55e", fontSize:15, fontWeight:700, cursor:"pointer", ...dm }}>
                  {lang==="de"||lang==="at" ? "Schließen" : lang==="en" ? "Close" : lang==="it" ? "Chiudi" : "Zatvori"}
                </button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <div style={{ ...dm, fontSize:10, color:"#22c55e", letterSpacing:2, fontWeight:700 }}>DIREKTNA REZERVACIJA</div>
                    <div style={{ fontSize:17, fontWeight:600, marginTop:3 }}>{bjBookRoom.emoji} {bjBookRoom._nameLocalized || (bjBookRoom.name?.[lang] || bjBookRoom.name?.hr || bjBookRoom.id)}</div>
                    <div style={{ ...dm, fontSize:12, color:"#64748b", marginTop:2 }}>
                      🏡 Black Jack · Palit, Rab{bjBookRoom.priceFrom ? <span style={{ color:"#22c55e", fontWeight:700 }}> · od €{bjBookRoom.priceFrom}/noć</span> : ""}
                    </div>
                  </div>
                  <button onClick={() => setBjBookRoom(null)}
                    style={{ background:"none", border:"1px solid rgba(255,255,255,0.1)", color:"#94a3b8", fontSize:15, cursor:"pointer", padding:"6px 10px", borderRadius:8, flexShrink:0 }}>✕</button>
                </div>
                <div style={{ padding:"18px 20px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ ...dm, fontSize:10, color:"#94a3b8", display:"block", marginBottom:5, letterSpacing:1 }}>
                        {lang==="de"||lang==="at"?"ANKUNFT":lang==="en"?"CHECK-IN":lang==="it"?"ARRIVO":"DOLAZAK"}
                      </label>
                      <input type="date" value={bjCheckIn} min={new Date().toISOString().slice(0,10)}
                        onChange={e => setBjCheckIn(e.target.value)}
                        style={{ width:"100%", padding:"11px 10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#f0f4f8", fontSize:16, outline:"none", boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ ...dm, fontSize:10, color:"#94a3b8", display:"block", marginBottom:5, letterSpacing:1 }}>
                        {lang==="de"||lang==="at"?"ABREISE":lang==="en"?"CHECK-OUT":lang==="it"?"PARTENZA":"ODLAZAK"}
                      </label>
                      <input type="date" value={bjCheckOut} min={bjCheckIn || new Date().toISOString().slice(0,10)}
                        onChange={e => setBjCheckOut(e.target.value)}
                        style={{ width:"100%", padding:"11px 10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#f0f4f8", fontSize:16, outline:"none", boxSizing:"border-box" }} />
                    </div>
                  </div>
                  {bjCheckIn && bjCheckOut && (() => {
                    const n = Math.max(0, Math.round((new Date(bjCheckOut)-new Date(bjCheckIn))/86400000));
                    if (n <= 0) return null;
                    return (
                      <div style={{ textAlign:"center", padding:"8px", marginBottom:12, ...dm, fontSize:12, color:"#22c55e" }}>
                        🌙 {n} {n===1?({hr:"noć",de:"Nacht",en:"night",it:"notte"})[lang]||"noć":({hr:"noći",de:"Nächte",en:"nights",it:"notti"})[lang]||"noći"}
                        {bjBookRoom.priceFrom ? <span style={{ color:"#64748b" }}>{" · "}~€{n * bjBookRoom.priceFrom} {lang==="de"||lang==="at"?"gesamt":lang==="en"?"total":lang==="it"?"totale":"ukupno"}</span> : ""}
                      </div>
                    );
                  })()}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", marginBottom:14 }}>
                    <div style={{ ...dm, fontSize:13 }}>
                      {lang==="de"||lang==="at"?"Gäste":lang==="en"?"Guests":lang==="it"?"Ospiti":"Gosti"}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <button onClick={() => setBjGuests(g => Math.max(1,g-1))} style={{ width:36, height:36, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#fff", fontSize:18, cursor:"pointer", display:"grid", placeItems:"center" }}>−</button>
                      <span style={{ fontSize:18, fontWeight:600, minWidth:24, textAlign:"center" }}>{bjGuests}</span>
                      <button onClick={() => setBjGuests(g => Math.min(bjBookRoom.guests||8,g+1))} style={{ width:36, height:36, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#fff", fontSize:18, cursor:"pointer", display:"grid", placeItems:"center" }}>+</button>
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label style={{ ...dm, fontSize:10, color:"#94a3b8", display:"block", marginBottom:5, letterSpacing:1 }}>
                      {lang==="de"||lang==="at"?"NAME":lang==="en"?"YOUR NAME":lang==="it"?"NOME":"IME I PREZIME"}
                    </label>
                    <input value={bjGuestName} onChange={e => setBjGuestName(e.target.value)}
                      placeholder={lang==="de"||lang==="at"?"Vollständiger Name":lang==="en"?"Full name":lang==="it"?"Nome completo":"Ime i prezime"}
                      autoCapitalize="words"
                      style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${bjGuestName?"rgba(34,197,94,0.35)":"rgba(255,255,255,0.1)"}`, background:"rgba(255,255,255,0.05)", color:"#f0f4f8", fontSize:16, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }} />
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label style={{ ...dm, fontSize:10, color:"#94a3b8", display:"block", marginBottom:5, letterSpacing:1 }}>
                      EMAIL {lang==="en"?"(optional)":lang==="de"||lang==="at"?"(optional)":lang==="it"?"(opzionale)":"(opcionalno)"}
                    </label>
                    <input type="email" value={bjGuestEmail} onChange={e => setBjGuestEmail(e.target.value)}
                      placeholder="email@example.com" inputMode="email"
                      style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"#f0f4f8", fontSize:16, outline:"none", boxSizing:"border-box" }} />
                  </div>
                  {bjStatus === "error" && (
                    <div style={{ ...dm, fontSize:12, color:"#f87171", marginBottom:12, textAlign:"center" }}>
                      {lang==="de"||lang==="at"?"Fehler. Bitte erneut versuchen.":lang==="en"?"Error. Please try again.":lang==="it"?"Errore. Riprova.":"Greška. Pokušajte ponovo."}
                    </div>
                  )}
                  <button
                    onClick={doBjBook}
                    disabled={bjStatus==="loading" || !bjGuestName || !bjCheckIn || !bjCheckOut}
                    style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", background: (bjStatus==="loading"||!bjGuestName||!bjCheckIn||!bjCheckOut) ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#16a34a,#22c55e)", color: (bjStatus==="loading"||!bjGuestName||!bjCheckIn||!bjCheckOut) ? "#86efac" : "#fff", fontSize:16, fontWeight:700, cursor: (bjStatus==="loading"||!bjGuestName||!bjCheckIn||!bjCheckOut) ? "not-allowed":"pointer", opacity:(bjGuestName&&bjCheckIn&&bjCheckOut)?1:0.6, transition:"all 0.2s", minHeight:52, ...dm }}>
                    {bjStatus==="loading" ? "⏳ "+(lang==="de"||lang==="at"?"Wird gesendet…":lang==="en"?"Sending…":lang==="it"?"Invio…":"Šaljem…")
                      : lang==="de"||lang==="at" ? "📩 Anfrage senden →"
                      : lang==="en" ? "📩 Send request →"
                      : lang==="it" ? "📩 Invia richiesta →"
                      : "📩 Pošalji upit →"}
                  </button>
                  <div style={{ ...dm, fontSize:11, color:"#64748b", textAlign:"center", marginTop:10, lineHeight:1.6, paddingBottom:8 }}>
                    {lang==="de"||lang==="at" ? "Keine Vorauszahlung · Kostenlose Stornierung · Direktbestätigung" : lang==="en" ? "No prepayment · Free cancellation · Direct confirmation" : lang==="it" ? "Nessun anticipo · Cancellazione gratuita · Conferma diretta" : "Nema predujma · Besplatni otkaz · Direktna potvrda"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Experience booking */}
      {selectedExp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedExp(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 440, width: "100%", padding: 32, border: `1px solid ${C.bord}` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedExp.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedExp.name}</div>
            <div style={{ ...dm, display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 13, color: C.mut }}>
              <span>⏱ {selectedExp.dur}</span><span>⭐ {selectedExp.rating}</span>
            </div>
            <Card style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginBottom: 4 }}>{t("perPerson",lang)}</div>
              <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>~{selectedExp.price}€</div>
              {G.kids > 0 && <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 4 }}>{t("familyPrice",lang)}: ~{selectedExp.price * 2 + Math.round(selectedExp.price * 0.5 * 2)}€</div>}
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {selectedExp.gyg && <button onClick={() => setInAppUrl(selectedExp.gyg)} style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#FF5533,#FF7744)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(255,85,51,0.3)", width: "100%" }}>{t("bookVia",lang)} GetYourGuide →</button>}
              {selectedExp.viator && <button onClick={() => setInAppUrl(selectedExp.viator)} style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#2B8B4B,#3DA65E)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", border: "none", cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(43,139,75,0.3)", width: "100%" }}>{t("bookVia",lang)} Viator →</button>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setSelectedExp(null)}>{t("back",lang)}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
    </ThemeProvider>
  );
}
