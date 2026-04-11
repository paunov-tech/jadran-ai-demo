// DELTA — Situational Awareness Dashboard
// Operator view: Croatian coast map + live tourist density + AI briefing
// Route: /delta

import { useState, useEffect, useRef, useCallback } from "react";
import { AFFILIATE_DATA, AFFILIATE_TOKENS } from "./affiliates";

const HERE_KEY = import.meta.env.VITE_HERE_API_KEY || "";

// ── Premium QR download helper ────────────────────────────────
async function downloadQR(qrSrc, label, filename) {
  const W = 440, H = 540;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0c0e13"); bg.addColorStop(1, "#14181f");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 24); ctx.fill();

  // Gold top edge
  const tg = ctx.createLinearGradient(0, 0, W, 0);
  tg.addColorStop(0.05, "transparent"); tg.addColorStop(0.25, "#8B6914");
  tg.addColorStop(0.5, "#F5D78E");     tg.addColorStop(0.75, "#8B6914");
  tg.addColorStop(0.95, "transparent");
  ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 2);

  // JADRAN.ai wordmark
  ctx.textAlign = "center";
  ctx.fillStyle = "#C9A84C";
  ctx.font = "bold 22px Georgia, serif";
  ctx.fillText("JADRAN.ai", W / 2, 52);

  ctx.fillStyle = "#3d3520";
  ctx.font = "11px Arial";
  ctx.letterSpacing = "2px";
  ctx.fillText("RAB CARD", W / 2, 74);

  // QR image
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.crossOrigin = "anonymous";
      i.onload = () => res(i); i.onerror = rej;
      i.src = qrSrc;
    });
    // White QR frame
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect(W/2-130, 95, 260, 260, 14); ctx.fill();
    ctx.drawImage(img, W/2-118, 107, 236, 236);
  } catch { /* QR load failed — skip */ }

  // Location label
  ctx.fillStyle = "#e8e0d0";
  ctx.font = "bold 17px Arial";
  ctx.fillText(label.replace(/[^\w\s·-]/gu, "").trim() || label, W / 2, 400);

  // Scan instruction
  ctx.fillStyle = "#475569";
  ctx.font = "13px Arial";
  ctx.fillText("Skeniraj za besplatnu Rab Card", W / 2, 428);

  // Bottom gold line
  const bg2 = ctx.createLinearGradient(0, 0, W, 0);
  bg2.addColorStop(0.1, "transparent"); bg2.addColorStop(0.4, "#8B6914");
  bg2.addColorStop(0.6, "#8B6914");    bg2.addColorStop(0.9, "transparent");
  ctx.fillStyle = bg2; ctx.fillRect(0, H - 2, W, 2);

  // jadran.ai footer
  ctx.fillStyle = "#2a2416";
  ctx.font = "10px Arial";
  ctx.fillText("jadran.ai", W / 2, H - 14);

  const a = document.createElement("a");
  a.download = filename; a.href = canvas.toDataURL("image/png"); a.click();
}

// ── Premium QR card component ─────────────────────────────────
function QRCard({ url, label, filename, accent = "#C9A84C" }) {
  const qrSrc = `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=200&margin=1&ecLevel=M&dark=0a0c10&light=FFFFFF`;
  const [dl, setDl] = useState(false);

  async function handleDownload() {
    setDl(true);
    await downloadQR(qrSrc, label, filename).catch(() => window.open(qrSrc, "_blank"));
    setTimeout(() => setDl(false), 1500);
  }

  return (
    <div style={{
      background: "linear-gradient(145deg,#0c0e13,#14181f)",
      border: `1px solid ${accent}22`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 ${accent}18`,
      display: "flex", flexDirection: "column",
    }}>
      {/* Gold top line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${accent}88,transparent)` }} />

      <div style={{ padding: "16px 14px 14px", textAlign: "center", flex: 1 }}>
        {/* QR */}
        <div style={{
          display: "inline-block", background: "#fff",
          borderRadius: 10, padding: 8, marginBottom: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
        }}>
          <img src={qrSrc} alt={label} width={120} height={120}
            style={{ display: "block", borderRadius: 4 }} crossOrigin="anonymous" />
        </div>

        {/* Label */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e8e0d0", marginBottom: 3, lineHeight: 1.3 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "#3d3520", marginBottom: 12, letterSpacing: ".04em" }}>
          Rab Card · JADRAN.ai
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={handleDownload} disabled={dl} style={{
            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
            background: dl ? `${accent}30` : `linear-gradient(135deg,${accent},#8B6914)`,
            color: dl ? accent : "#0a0c10",
            fontSize: 11, fontWeight: 700, cursor: dl ? "default" : "pointer",
            letterSpacing: ".04em",
          }}>
            {dl ? "✓" : "⬇ PNG"}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, padding: "7px 0", borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#475569", fontSize: 11, fontWeight: 600,
            textDecoration: "none", textAlign: "center",
            display: "block",
          }}>
            ↗ link
          </a>
        </div>
      </div>
    </div>
  );
}

// ── TZ location QR points by city ────────────────────────────
const TZ_POINTS = [
  { id: "ferry_terminal",  label: "Ferry Terminal",   emoji: "⛴", city: "rab"    },
  { id: "beach_rajska",    label: "Plaža Rajska",     emoji: "🏖", city: "rab"    },
  { id: "info_centar",     label: "Info centar Rab",  emoji: "ℹ️", city: "rab"    },
  { id: "stari_grad",      label: "Stari grad",       emoji: "🏛", city: "rab"    },
  { id: "marina_rab",      label: "Marina Rab",       emoji: "⛵", city: "rab"    },
  { id: "park_komrcar",    label: "Park Komrčar",     emoji: "🌲", city: "rab"    },
  { id: "luka_rovinj",     label: "Luka Rovinj",      emoji: "⚓", city: "rovinj" },
  { id: "sv_eufemija_rov", label: "Sv. Eufemija",     emoji: "⛪", city: "rovinj" },
  { id: "info_rovinj",     label: "Info centar",      emoji: "ℹ️", city: "rovinj" },
  { id: "stara_gradska",   label: "Stara gradska",    emoji: "🏛", city: "rovinj" },
];

// ── Build all QR items from TZ + Affiliates ───────────────────
function buildQRItems() {
  const tz = TZ_POINTS.map(pt => ({
    id:     `tz-${pt.id}`,
    rawId:  pt.id,
    label:  pt.label,
    emoji:  pt.emoji,
    city:   pt.city,
    type:   "tz",
    url:    `https://jadran.ai/?kiosk=${pt.city}&tz=${pt.id}&action=card`,
    accent: "#C9A84C",
  }));
  const aff = Object.entries(AFFILIATE_DATA).map(([id, a]) => ({
    id:    `aff-${id}`,
    rawId: id,
    label: a.name,
    emoji: a.emoji || "⭐",
    city:  (a.city || "").toLowerCase(),
    type:  "affiliate",
    url:   `https://jadran.ai/?kiosk=${(a.city||"").toLowerCase()}&affiliate=${id}&tk=${AFFILIATE_TOKENS[id]||""}&action=card`,
    accent: "#0ea5e9",
  }));
  return [...tz, ...aff];
}

// ── QR Manager — slide-in drawer ─────────────────────────────
function QRManager({ onClose }) {
  const [tab,    setTab]    = useState("all");
  const [view,   setView]   = useState("table"); // table | grid
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);

  const ALL = buildQRItems();
  const cities = ["all", ...new Set(ALL.map(i => i.city).filter(Boolean).sort())];

  const filtered = ALL.filter(item => {
    if (tab !== "all" && item.city !== tab) return false;
    if (search && !`${item.label} ${item.city}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function copyLink(item) {
    navigator.clipboard?.writeText(item.url).catch(() => {});
    setCopied(item.id);
    setTimeout(() => setCopied(c => c === item.id ? null : c), 1600);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(4,10,22,0.80)", backdropFilter: "blur(6px)", display: "flex" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        marginLeft: "auto", width: "min(100vw, 860px)",
        background: "#050d1c", borderLeft: "1px solid rgba(14,165,233,0.14)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid rgba(14,165,233,0.1)", flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>🪪</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A84C", letterSpacing: ".06em" }}>QR Manager</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{ALL.length} kodova · {cities.length - 1} destinacija</div>
          </div>
          <button onClick={() => setView(v => v === "table" ? "grid" : "table")}
            style={{ padding: "5px 11px", borderRadius: 6, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)", color: "#7dd3fc", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            {view === "table" ? "⊞ Grid" : "≡ Tabla"}
          </button>
          <button onClick={onClose}
            style={{ padding: "5px 11px", borderRadius: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
            ✕
          </button>
        </div>

        {/* Tabs + search */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderBottom: "1px solid rgba(14,165,233,0.07)", flexShrink: 0, flexWrap: "wrap" }}>
          {cities.map(c => {
            const cnt = c === "all" ? ALL.length : ALL.filter(i => i.city === c).length;
            return (
              <button key={c} onClick={() => setTab(c)} style={{
                padding: "4px 12px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                background: tab === c ? "rgba(14,165,233,0.14)" : "transparent",
                border: `1px solid ${tab === c ? "rgba(14,165,233,0.32)" : "rgba(14,165,233,0.09)"}`,
                color: tab === c ? "#7dd3fc" : "#475569", textTransform: "capitalize", fontFamily: "inherit",
              }}>
                {c === "all" ? "Sve" : c} <span style={{ opacity: 0.6 }}>({cnt})</span>
              </button>
            );
          })}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pretraži..."
            style={{ marginLeft: "auto", padding: "5px 11px", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.1)", borderRadius: 8, color: "#e2e8f0", fontSize: 12, outline: "none", width: 150, fontFamily: "inherit" }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "10px 18px 20px" }}>
          {view === "table" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: ".08em" }}>
                  {["Naziv", "Grad", "Tip", "URL", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 4 ? "right" : "left", padding: "6px 8px", borderBottom: "1px solid rgba(14,165,233,0.09)", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid rgba(14,165,233,0.05)" }}>
                    <td style={{ padding: "7px 8px", fontSize: 12, color: "#e2e8f0", whiteSpace: "nowrap" }}>
                      <span style={{ marginRight: 6 }}>{item.emoji}</span>{item.label}
                    </td>
                    <td style={{ padding: "7px 8px", fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{item.city}</td>
                    <td style={{ padding: "7px 8px" }}>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, fontWeight: 700,
                        background: item.type === "tz" ? "rgba(201,168,76,0.12)" : "rgba(14,165,233,0.09)",
                        color: item.type === "tz" ? "#C9A84C" : "#7dd3fc" }}>
                        {item.type === "tz" ? "TZ" : "Partner"}
                      </span>
                    </td>
                    <td style={{ padding: "7px 8px", fontSize: 10, color: "#334155", maxWidth: 260 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</div>
                    </td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        <button onClick={() => copyLink(item)} style={{
                          padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                          background: copied === item.id ? "rgba(34,197,94,0.12)" : "rgba(14,165,233,0.07)",
                          border: `1px solid ${copied === item.id ? "rgba(34,197,94,0.28)" : "rgba(14,165,233,0.14)"}`,
                          color: copied === item.id ? "#86efac" : "#7dd3fc",
                        }}>{copied === item.id ? "✓" : "⎘ Link"}</button>
                        <button onClick={() => {
                          const qrSrc = `https://quickchart.io/qr?text=${encodeURIComponent(item.url)}&size=200&margin=1&ecLevel=M&dark=0a0c10&light=FFFFFF`;
                          downloadQR(qrSrc, `${item.emoji} ${item.label}`, `qr-${item.rawId}.png`);
                        }} style={{
                          padding: "3px 9px", borderRadius: 5, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                          background: item.type === "tz" ? "rgba(201,168,76,0.1)" : "rgba(14,165,233,0.07)",
                          border: `1px solid ${item.type === "tz" ? "rgba(201,168,76,0.22)" : "rgba(14,165,233,0.14)"}`,
                          color: item.accent,
                        }}>⬇ PNG</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(172px,1fr))", gap: 10 }}>
              {filtered.map(item => (
                <QRCard
                  key={item.id}
                  url={item.url}
                  label={`${item.emoji} ${item.label}`}
                  filename={`qr-${item.rawId}.png`}
                  accent={item.accent}
                />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "#334155", fontSize: 13 }}>
              Nema rezultata{search ? ` za "${search}"` : ""}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}

const POLL_INTEL    = 60000;   // 60s — coast data
const POLL_BRIEFING = 300000;  // 5 min — AI briefing

const LEVEL_COLORS = {
  critical: "#ef4444",
  heavy:    "#f97316",
  moderate: "#eab308",
  light:    "#22c55e",
  empty:    "#475569",
  unknown:  "#475569",
  full:     "#ef4444",
};
const LEVEL_HR = {
  critical: "KRITIČNO", heavy: "gusto", moderate: "umjereno",
  light: "malo", empty: "prazno", unknown: "—", full: "PUNO",
};
const SEV_COLOR = { critical: "#ef4444", warning: "#f97316", info: "#0ea5e9" };
const SEV_ICON  = { critical: "◉", warning: "⚠", info: "ℹ" };

function useInterval(fn, delay) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; }, [fn]);
  useEffect(() => {
    if (delay == null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)",
      borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 80,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "#f0f9ff", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function AlertRow({ alert }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0",
      borderBottom: "1px solid rgba(14,165,233,0.07)",
    }}>
      <span style={{ color: SEV_COLOR[alert.severity] || "#94a3b8", fontSize: 13, marginTop: 1, flexShrink: 0 }}>
        {SEV_ICON[alert.severity]}
      </span>
      <span style={{ fontSize: 12, color: alert.severity === "critical" ? "#fca5a5" : "#cbd5e1", lineHeight: 1.45 }}>
        {alert.text}
      </span>
    </div>
  );
}

function RegionRow({ r }) {
  const bar = Math.min(100, r.objects > 0 ? Math.round((r.objects / 250) * 100) : 0);
  return (
    <div style={{ padding: "6px 0", borderBottom: "1px solid rgba(14,165,233,0.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#e2e8f0" }}>{r.name}</span>
        <span style={{ fontSize: 11, color: LEVEL_COLORS[r.level] || "#94a3b8", fontWeight: 600 }}>
          {r.objects} · {LEVEL_HR[r.level]}
        </span>
      </div>
      <div style={{ height: 3, background: "rgba(14,165,233,0.1)", borderRadius: 2 }}>
        <div style={{ height: 3, borderRadius: 2, width: bar + "%", background: LEVEL_COLORS[r.level] || "#0ea5e9", transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

function WindCard({ w }) {
  const bft = w.windMs < 1.6 ? 1 : w.windMs < 3.4 ? 2 : w.windMs < 5.5 ? 3
    : w.windMs < 8 ? 4 : w.windMs < 10.8 ? 5 : w.windMs < 13.9 ? 6 : w.windMs < 17.2 ? 7 : 8;
  const wc  = bft <= 3 ? "#22c55e" : bft <= 5 ? "#eab308" : bft <= 6 ? "#f97316" : "#ef4444";
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  const compass = dirs[Math.round((w.windDeg % 360) / 45) % 8];
  return (
    <div style={{
      background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.1)",
      borderRadius: 8, padding: "7px 10px", minWidth: 85, flex: "1 1 85px",
    }}>
      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>{w.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: wc, fontVariantNumeric: "tabular-nums" }}>{w.windKts}</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>kn {compass}</span>
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
        {w.tempC}°C
        {w.waveM != null && <span style={{ color: "#38bdf8" }}> · {w.waveM}m val</span>}
      </div>
    </div>
  );
}

function ParkingRow({ p }) {
  if (p.level === "unknown" || p.occupancyPct == null) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid rgba(14,165,233,0.06)" }}>
      <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 150, lineHeight: 1.35 }}>{p.name}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: LEVEL_COLORS[p.level] }}>
        {p.occupancyPct}% — {LEVEL_HR[p.level] || p.level}
      </span>
    </div>
  );
}

export default function DeltaDashboard() {
  const iframeRef   = useRef(null);
  const [intel, setIntel]         = useState(null);
  const [briefing, setBriefing]   = useState(null);
  const [intelTs, setIntelTs]     = useState(null);
  const [briefingTs, setBriefTs]  = useState(null);
  const [intelErr, setIntelErr]   = useState(null);
  const [mapReady, setMapReady]   = useState(false);
  const [showQRManager, setShowQRManager] = useState(false);

  // Send data to coast map iframe
  const pushToMap = useCallback((data) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "coast_data", key: HERE_KEY, data },
      window.location.origin
    );
  }, []);

  const fetchIntel = useCallback(async () => {
    try {
      const r = await fetch("/api/coast-intelligence");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      setIntel(d);
      setIntelTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
      setIntelErr(null);
      pushToMap(d);
    } catch (e) {
      setIntelErr(e.message);
    }
  }, [pushToMap]);

  const fetchBriefing = useCallback(async () => {
    try {
      const r = await fetch("/api/delta-briefing");
      if (!r.ok) return;
      const d = await r.json();
      setBriefing(d);
      setBriefTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    fetchIntel();
    fetchBriefing();
  }, [fetchIntel, fetchBriefing]);

  // Polling
  useInterval(fetchIntel,    POLL_INTEL);
  useInterval(fetchBriefing, POLL_BRIEFING);

  // Re-push to map after mapReady fires
  useEffect(() => {
    if (mapReady && intel) pushToMap(intel);
  }, [mapReady, intel, pushToMap]);

  const activeAlerts   = (intel?.alerts || []).filter(a => a.severity === "critical" || a.severity === "warning");
  const criticalCount  = activeAlerts.filter(a => a.severity === "critical").length;
  const regionsSorted  = [...(intel?.regions || [])].sort((a, b) => b.objects - a.objects).filter(r => r.objects > 0);
  const parkingActive  = (intel?.parking || []).filter(p => p.level !== "unknown" && p.occupancyPct != null);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100dvh",
      background: "#060f1e", color: "#f0f9ff",
      fontFamily: "'Outfit', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 18px", borderBottom: "1px solid rgba(14,165,233,0.12)",
        background: "rgba(6,15,30,0.95)", flexShrink: 0,
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            background: criticalCount > 0 ? "#ef444422" : "rgba(14,165,233,0.12)",
            border: `1px solid ${criticalCount > 0 ? "#ef4444" : "rgba(14,165,233,0.25)"}`,
            borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: criticalCount > 0 ? "#ef4444" : "#22c55e",
              boxShadow: `0 0 6px ${criticalCount > 0 ? "#ef4444" : "#22c55e"}`,
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: criticalCount > 0 ? "#fca5a5" : "#86efac" }}>
              DELTA LIVE
            </span>
          </div>
          <span style={{ fontSize: 14, color: "#94a3b8" }}>Obalna situacijska svjesnost</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "#475569" }}>
          {intelTs && <span>Senzori: {intelTs}</span>}
          {briefingTs && <span>AI: {briefingTs}</span>}
          {intelErr && <span style={{ color: "#f97316" }}>⚠ {intelErr}</span>}
          <button
            onClick={() => setShowQRManager(true)}
            style={{
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.22)",
              color: "#C9A84C", borderRadius: 7, padding: "4px 12px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}
          >🪪 QR Manager</button>
          <button
            onClick={() => { fetchIntel(); fetchBriefing(); }}
            style={{
              background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)",
              color: "#7dd3fc", borderRadius: 7, padding: "4px 12px", cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}
          >↻ Refresh</button>
        </div>
      </div>

      {/* ── Main body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Map (left, 62%) ── */}
        <div style={{ flex: "0 0 62%", position: "relative", overflow: "hidden" }}>
          <iframe
            ref={iframeRef}
            src="/coast.html"
            style={{ width: "100%", height: "100%", border: "none" }}
            title="DELTA Coast Map"
            onLoad={() => {
              setMapReady(true);
              if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                  { type: "coast_init", key: HERE_KEY, data: intel || null },
                  window.location.origin
                );
              }
            }}
          />
          {/* Overlay stat pills on map */}
          {intel && (
            <div style={{
              position: "absolute", top: 12, left: 12, display: "flex", flexDirection: "column", gap: 6,
              pointerEvents: "none",
            }}>
              <div style={{
                background: "rgba(6,15,30,0.88)", border: "1px solid rgba(14,165,233,0.2)",
                borderRadius: 8, padding: "6px 12px", backdropFilter: "blur(8px)",
                fontSize: 12, color: "#94a3b8",
              }}>
                <span style={{ color: "#0ea5e9", fontWeight: 700, fontSize: 15 }}>{intel.yolo?.total || 0}</span>
                {" "}detekcija · {intel.yolo?.active || 0} senzora · {(intel.webcams || []).length} webcam{(intel.webcams || []).length !== 1 ? "a" : ""}
              </div>
              {criticalCount > 0 && (
                <div style={{
                  background: "rgba(239,68,68,0.18)", border: "1px solid #ef4444",
                  borderRadius: 8, padding: "5px 12px", backdropFilter: "blur(8px)",
                  fontSize: 11, color: "#fca5a5", fontWeight: 600,
                }}>
                  ◉ {criticalCount} kritična zona{criticalCount > 1 ? "e" : ""}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right panel (38%) ── */}
        <div style={{
          flex: "0 0 38%", display: "flex", flexDirection: "column", overflow: "hidden",
          borderLeft: "1px solid rgba(14,165,233,0.1)",
        }}>

          {/* Stat boxes */}
          <div style={{ display: "flex", gap: 8, padding: "12px 14px", flexShrink: 0 }}>
            <StatBox label="Detekcije" value={intel?.yolo?.total ?? "—"} color="#0ea5e9" />
            <StatBox label="Kritično" value={criticalCount} color={criticalCount > 0 ? "#ef4444" : "#22c55e"} />
            <StatBox label="A1/A6" value={intel?.highwaySections ? intel.highwaySections.filter(s => s.status !== "clear").length + "/" + intel.highwaySections.length : "—"} color="#f97316" />
            <StatBox label="Partneri" value={intel?.affiliates?.length ?? "—"} color="#f59e0b" />
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: "auto", padding: "0 14px 16px" }}>

            {/* ── Wind & Waves (Windy) ── */}
            {(intel?.forecast || []).length > 0 && (
              <div style={{ marginBottom: 14, marginTop: 4 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Vjetar &amp; Valovi — Windy
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {intel.forecast.map(w => <WindCard key={w.id} w={w} />)}
                </div>
              </div>
            )}

            {/* ── AI DELTA Briefing ── */}
            <div style={{
              background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#0ea5e9", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                  AI Situacijski Izvještaj — Opus 4.6
                </span>
                {briefingTs && <span style={{ fontSize: 10, color: "#475569" }}>{briefingTs}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.65, minHeight: 60 }}>
                {briefing?.briefing || (
                  <span style={{ color: "#475569", fontStyle: "italic" }}>Generira se izvještaj...</span>
                )}
              </div>
            </div>

            {/* ── Active Alerts ── */}
            {activeAlerts.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Alerty ({activeAlerts.length})
                </div>
                {activeAlerts.slice(0, 8).map((a, i) => <AlertRow key={i} alert={a} />)}
              </div>
            )}

            {/* ── NASA FIRMS Fires ── */}
            {(intel?.fires || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#ef4444", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  🔥 NASA FIRMS požari ({intel.fires.length})
                </div>
                {intel.fires.filter(f => f.confidence === "high").slice(0, 5).map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#fca5a5", padding: "4px 0", borderBottom: "1px solid rgba(239,68,68,0.1)", fontVariantNumeric: "tabular-nums" }}>
                    ◉ {f.lat.toFixed(2)}, {f.lng.toFixed(2)} — {f.acqDate}
                  </div>
                ))}
                {intel.fires.filter(f => f.confidence !== "high").length > 0 && (
                  <div style={{ fontSize: 10, color: "#f97316", marginTop: 4 }}>
                    + {intel.fires.filter(f => f.confidence !== "high").length} nominalna detekcija
                  </div>
                )}
              </div>
            )}

            {/* ── HAK Highway Sections ── */}
            {(intel?.highwaySections?.length || 0) > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Autoceste A1 / A6 — HAK
                </div>
                {intel.highwaySections.map(s => {
                  const col = s.status === "critical" ? "#ef4444" : s.status === "warning" ? "#eab308" : s.status === "info" ? "#3b82f6" : "#22c55e";
                  const icon = s.status === "critical" ? "●" : s.status === "warning" ? "▲" : s.status === "info" ? "●" : "●";
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid rgba(14,165,233,0.06)" }}>
                      <span style={{ color: col, fontSize: 9, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: s.status === "clear" ? "#475569" : "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>
                          {s.jamFactor != null
                            ? <span style={{ color: col }}>jam {s.jamFactor}/10{s.speed != null ? ` · ${Math.round(s.speed)} km/h` : ""}</span>
                            : s.incidents?.length > 0
                              ? <span style={{ color: col }}>{s.incidents[0].title}</span>
                              : null
                          }
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Raw HAK items if any */}
                {(intel?.traffic?.length || 0) > 0 && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "#475569" }}>
                    {intel.traffic.slice(0, 2).map((t, i) => (
                      <div key={i} style={{ padding: "3px 0", lineHeight: 1.3 }}>
                        <span style={{ color: "#f97316" }}>▸ </span>{t.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Regions ── */}
            {regionsSorted.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Gustoća po regijama
                </div>
                {regionsSorted.map(r => <RegionRow key={r.id} r={r} />)}
              </div>
            )}

            {/* ── Parking ── */}
            {parkingActive.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Parking (Sentinel-2)
                </div>
                {parkingActive.map(p => <ParkingRow key={p.id} p={p} />)}
              </div>
            )}

            {/* ── Sea Quality ── */}
            {(intel?.sea || []).filter(s => s.clarity !== "unknown").length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Kvalitet mora
                </div>
                {intel.sea.filter(s => s.clarity !== "unknown").map(s => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(14,165,233,0.06)", fontSize: 11 }}>
                    <span style={{ color: "#94a3b8" }}>{s.beach}</span>
                    <span style={{ color: { excellent:"#0ea5e9", good:"#38bdf8", fair:"#eab308", poor:"#f97316", bad:"#ef4444" }[s.clarity] || "#64748b" }}>
                      {s.clarityHR}
                      {s.algaeRisk !== "none" && <span style={{ color: "#f97316" }}> ⚠</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Windy Webcams ── */}
            {(intel?.webcams || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Live webcami — Windy ({intel.webcams.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {intel.webcams.slice(0, 48).map(w => (
                    <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration: "none", display: "block" }}>
                      {w.preview ? (
                        <div style={{ position: "relative", width: 78, height: 52 }}>
                          <img src={w.preview} alt={w.title}
                            style={{ width: 78, height: 52, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(34,211,238,0.25)", display: "block" }}
                          />
                          <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "rgba(6,15,30,0.75)", borderRadius: "0 0 5px 5px",
                            fontSize: 8, color: "#94a3b8", padding: "2px 4px",
                            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                          }}>{w.city || w.title}</div>
                        </div>
                      ) : (
                        <div style={{
                          width: 78, height: 52, borderRadius: 6,
                          border: "1px solid rgba(34,211,238,0.2)",
                          background: "rgba(34,211,238,0.04)",
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 2,
                        }}>
                          <span style={{ fontSize: 14 }}>📷</span>
                          <span style={{ fontSize: 8, color: "#475569", textAlign: "center", padding: "0 4px",
                            overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 70 }}>
                            {w.city || w.title}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* ── Affiliates ── */}
            {(intel?.affiliates || []).length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                  Affiliate partneri
                </div>
                {intel.affiliates.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(14,165,233,0.06)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color || "#f59e0b", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: "#e2e8f0" }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{a.city}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── QR Manager drawer ── */}
      {showQRManager && <QRManager onClose={() => setShowQRManager(false)} />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}
