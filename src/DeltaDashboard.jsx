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
  const iframeRef        = useRef(null);
  const vesselDataRef    = useRef([]);   // always-fresh vessel list for map push
  const intelDataRef     = useRef(null); // always-fresh intel for vessel-triggered push
  const checkinsDataRef  = useRef([]);   // always-fresh Rab Card check-ins for map push
  const notifiedAlertsRef = useRef(new Set()); // dedup browser notifications
  const [intel, setIntel]         = useState(null);
  const [briefing, setBriefing]   = useState(null);
  const [intelTs, setIntelTs]     = useState(null);
  const [briefingTs, setBriefTs]  = useState(null);
  const [intelErr, setIntelErr]   = useState(null);
  const [mapReady, setMapReady]   = useState(false);
  const [showQRManager, setShowQRManager] = useState(false);
  const [checkins, setCheckins]   = useState(null);
  const [checkinsTs, setCheckinsTs] = useState(null);
  const [vessels, setVessels]     = useState(null);
  const [vesselsTs, setVesselsTs] = useState(null);
  const [crowdData, setCrowdData] = useState({});   // webcamId → {persons,busyness,scene}
  const [crowdLoading, setCrowdLoading] = useState(false);
  const [bigEye, setBigEye] = useState([]);         // delta-big-eye Firestore cache

  // Send data to coast map iframe
  const pushToMap = useCallback((data) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "coast_data", key: HERE_KEY, data },
      window.location.origin
    );
  }, []);

  const fetchCrowd = useCallback(async (webcams) => {
    if (!webcams || webcams.length === 0) return;
    setCrowdLoading(true);
    try {
      // Pick up to 12 cameras with preview URLs — balanced across regions
      const REGION_ORDER = ["kvarner", "zadar_sibenik", "split_makarska", "dubrovnik", "istra", "other"];
      const byRegion = {};
      for (const w of webcams) {
        if (!w.preview) continue;
        const r = w.region || "other";
        if (!byRegion[r]) byRegion[r] = [];
        byRegion[r].push(w);
      }
      // 2 cameras per region, rotate through regions
      const selected = [];
      for (const rk of REGION_ORDER) {
        const cams = byRegion[rk] || [];
        selected.push(...cams.slice(0, 15));
        if (selected.length >= 80) break;
      }

      const r = await fetch("/api/webcam-crowd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webcams: selected.map(w => ({ id: w.id, url: w.preview, region: w.region })) }),
      });
      if (!r.ok) return;
      const d = await r.json();
      const map = {};
      for (const result of (d.results || [])) {
        if (!result.error && result.busyness !== null) map[result.id] = result;
      }
      setCrowdData(prev => ({ ...prev, ...map }));
    } catch {}
    finally { setCrowdLoading(false); }
  }, []);

  const fetchIntel = useCallback(async () => {
    try {
      const r = await fetch("/api/coast-intelligence");
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      intelDataRef.current = d;
      setIntel(d);
      setIntelTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
      setIntelErr(null);
      pushToMap({ ...d, vessels: vesselDataRef.current, checkins: checkinsDataRef.current });
      // Trigger AI crowd analysis on webcam frames (non-blocking)
      if (d.webcams?.length > 0) fetchCrowd(d.webcams);
    } catch (e) {
      setIntelErr(e.message);
    }
  }, [pushToMap, fetchCrowd]);

  const fetchBriefing = useCallback(async () => {
    try {
      const r = await fetch("/api/delta-briefing");
      if (!r.ok) return;
      const d = await r.json();
      setBriefing(d);
      setBriefTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
    } catch {}
  }, []);

  const fetchCheckins = useCallback(async () => {
    try {
      const r = await fetch("/api/rab-checkins?hours=24");
      if (!r.ok) return;
      const d = await r.json();
      checkinsDataRef.current = d.locations || [];
      setCheckins(d);
      setCheckinsTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
      // Re-push to map with fresh check-ins
      if (intelDataRef.current) {
        pushToMap({ ...intelDataRef.current, vessels: vesselDataRef.current, checkins: d.locations || [] });
      }
    } catch {}
  }, [pushToMap]);

  const fetchVessels = useCallback(async () => {
    try {
      const r = await fetch("/api/vessels?lat=44.75&lng=14.78&r=60");
      if (!r.ok) return;
      const d = await r.json();
      vesselDataRef.current = d.vessels || [];
      setVessels(d);
      setVesselsTs(new Date().toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" }));
      // Push vessels to map immediately — merge with latest intel
      if (intelDataRef.current) pushToMap({ ...intelDataRef.current, vessels: d.vessels || [], checkins: checkinsDataRef.current });
    } catch {}
  }, [pushToMap]);

  const fetchBigEye = useCallback(async () => {
    try {
      const r = await fetch("/api/delta-big-eye?action=read");
      if (!r.ok) return;
      const d = await r.json();
      if (d.cameras?.length > 0) setBigEye(d.cameras);
    } catch {}
  }, []);

  // Initial load
  useEffect(() => {
    fetchIntel();
    fetchBriefing();
    fetchCheckins();
    fetchVessels();
    fetchBigEye();
  }, [fetchIntel, fetchBriefing, fetchCheckins, fetchVessels, fetchBigEye]);

  // Polling
  useInterval(fetchIntel,    POLL_INTEL);
  useInterval(fetchBriefing, POLL_BRIEFING);
  useInterval(fetchBigEye,   5 * 60 * 1000); // 5min — matches cron interval
  useInterval(fetchCheckins, 30000); // 30s — demo needs live updates
  useInterval(fetchVessels,  5 * 60 * 1000); // 5min — matches server cache

  // Re-push to map after mapReady fires (or when intel/vessels refresh)
  useEffect(() => {
    if (mapReady && intel) pushToMap({ ...intel, vessels: vesselDataRef.current, checkins: checkinsDataRef.current });
  }, [mapReady, intel, pushToMap]);

  // Re-push with crowd-enriched webcams after Gemini analysis completes
  useEffect(() => {
    if (!intel || Object.keys(crowdData).length === 0) return;
    const enriched = (intel.webcams || []).map(w =>
      crowdData[w.id] ? { ...w, busyness: crowdData[w.id].busyness, persons: crowdData[w.id].persons } : w
    );
    pushToMap({ ...intel, vessels: vesselDataRef.current, checkins: checkinsDataRef.current, webcams: enriched });
  }, [crowdData]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeAlerts   = (intel?.alerts || []).filter(a => a.severity === "critical" || a.severity === "warning");
  const criticalCount  = activeAlerts.filter(a => a.severity === "critical").length;
  const regionsSorted  = [...(intel?.regions || [])].sort((a, b) => b.objects - a.objects).filter(r => r.objects > 0);
  const parkingActive  = (intel?.parking || []).filter(p => p.level !== "unknown" && p.occupancyPct != null);

  // ── Browser notifications for new critical alerts ──────────────
  useEffect(() => {
    const criticals = activeAlerts.filter(a => a.severity === "critical");
    if (criticals.length === 0 || !("Notification" in window)) return;
    async function fire() {
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission().catch(() => "denied");
      if (perm !== "granted") return;
      for (const alert of criticals) {
        if (notifiedAlertsRef.current.has(alert.text)) continue;
        notifiedAlertsRef.current.add(alert.text);
        try {
          new Notification("DELTA ◉ Kritična zona", {
            body: alert.text,
            icon: "/favicon.ico",
            tag: `delta-${alert.text.slice(0, 40)}`,
          });
        } catch {}
      }
    }
    fire();
  }, [activeAlerts]);

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
          {intel?.yolo?.simulated
            ? <span style={{ color: "#f59e0b" }}>⚠ YOLO DEMO</span>
            : intel?.yolo?.docCount > 0
              ? <span style={{ color: "#22c55e" }}>YOLO ● {intel.yolo.docCount}</span>
              : null
          }
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
                {" "}detekcija · {intel.yolo?.active || 0} YOLO senzora · <span style={{ color: "#22d3ee", fontWeight: 600 }}>{(intel.webcams || []).length}</span> webcam
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
            <StatBox label="Rab danas" value={checkins?.totalToday ?? "—"} color="#C9A84C" />
            <StatBox label="Plovila" value={vessels ? vessels.total : "—"} color="#22d3ee" />
          </div>

          {/* ── Rab Card Check-ins — per-location tourist tracking ── */}
          {checkins && (
            <div style={{ padding: "0 14px 10px", flexShrink: 0, borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#C9A84C", boxShadow: "0 0 6px #C9A84C", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                    Rab Card — Turisti po lokaciji
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 9, color: "#475569" }}>
                  <span><span style={{ color: "#F5D78E", fontWeight: 700 }}>{checkins.uniqueCards}</span> karti · danas</span>
                  {checkinsTs && <span>{checkinsTs}</span>}
                </div>
              </div>

              {checkins.locations.length === 0 ? (
                <div style={{ fontSize: 11, color: "#334155", textAlign: "center", padding: "8px 0" }}>
                  Nema aktivnih check-ina danas
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {checkins.locations.slice(0, 8).map(loc => {
                    const maxToday = Math.max(...checkins.locations.map(l => l.today), 1);
                    const barW = Math.round((loc.today / maxToday) * 100);
                    const typeColor = loc.type === "beach" ? "#38bdf8" : loc.type === "partner" ? "#f59e0b" : "#C9A84C";
                    return (
                      <div key={loc.id} style={{ position: "relative" }}>
                        {/* Background bar */}
                        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: barW + "%", background: typeColor + "10", borderRadius: 6, transition: "width .5s ease" }} />
                        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", borderRadius: 6 }}>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            <span style={{ marginRight: 5 }}>{loc.emoji}</span>{loc.name}
                          </span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: typeColor }}>{loc.today}</span>
                            {loc.count > loc.today && (
                              <span style={{ fontSize: 9, color: "#334155" }}>/ {loc.count}</span>
                            )}
                            {loc.uniqueCards > 0 && (
                              <span style={{ fontSize: 8, color: "#475569", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "1px 5px" }}>
                                {loc.uniqueCards}🪪
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

            {/* ── Beach-level YOLO (per sensor) ── */}
            {(intel?.beaches || []).filter(b => b.objects > 0 || b.busyness > 0).length > 0 && (() => {
              const activeCams = intel.beaches.filter(b => b.objects > 0 || b.busyness > 0);
              // Group by region
              const byRegion = {};
              for (const cam of activeCams) {
                if (!byRegion[cam.region]) byRegion[cam.region] = [];
                byRegion[cam.region].push(cam);
              }
              const REGION_NAMES = {
                kvarner: "Kvarner", istra: "Istra", zadar_sibenik: "Zadar–Šibenik",
                split_makarska: "Split–Makarska", dubrovnik: "Dubrovnik",
                np_plitvice: "NP Plitvice", np_krka: "NP Krka", other: "Ostalo",
              };
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
                    Turističke lokacije — senzori ({activeCams.length})
                  </div>
                  {Object.entries(byRegion).map(([reg, cams]) => (
                    <div key={reg} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, color: "#334155", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>
                        {REGION_NAMES[reg] || reg}
                      </div>
                      {cams.map(cam => {
                        const pct = cam.busyness || Math.min(100, Math.round(cam.objects / 2));
                        const col = pct >= 80 ? "#ef4444" : pct >= 50 ? "#f97316" : pct >= 25 ? "#eab308" : "#22c55e";
                        return (
                          <div key={cam.camId} style={{ marginBottom: 5 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                              <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cam.name !== cam.camId ? cam.name : cam.camId}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: col, flexShrink: 0, marginLeft: 4 }}>
                                {pct}%
                                {cam.persons > 0 && <span style={{ fontSize: 9, color: "#475569", fontWeight: 400 }}> · {cam.persons}p</span>}
                                {cam.boats > 0   && <span style={{ fontSize: 9, color: "#38bdf8", fontWeight: 400 }}> · {cam.boats}⛵</span>}
                              </span>
                            </div>
                            <div style={{ height: 3, background: "rgba(14,165,233,0.08)", borderRadius: 2 }}>
                              <div style={{ height: 3, borderRadius: 2, width: pct + "%", background: col, transition: "width .5s ease" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}

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

            {/* ── AIS Vessels ── */}
            {vessels && vessels.total > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#22d3ee", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>
                    ⛵ AIS plovila — Rab / Kvarner
                  </span>
                  <div style={{ display: "flex", gap: 8, fontSize: 9, color: "#475569" }}>
                    {vessels.live
                      ? <span style={{ color: "#22c55e" }}>● LIVE</span>
                      : <span style={{ color: "#475569" }}>simulacija</span>
                    }
                    {vesselsTs && <span>{vesselsTs}</span>}
                  </div>
                </div>
                {/* Summary chips */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {vessels.ferries > 0 && (
                    <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fb923c" }}>
                      ⛴ {vessels.ferries} trajekt{vessels.ferries > 1 ? "a" : ""}
                    </div>
                  )}
                  {vessels.pleasure > 0 && (
                    <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#22d3ee" }}>
                      ⛵ {vessels.pleasure} jahta/jedrilica
                    </div>
                  )}
                  {vessels.cargo > 0 && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#fca5a5" }}>
                      🚢 {vessels.cargo} teretni
                    </div>
                  )}
                  <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6, padding: "3px 8px", fontSize: 10, color: "#86efac" }}>
                    ▶ {vessels.moving} u pokretu
                  </div>
                </div>
                {/* Vessel list — ferries first, then by speed */}
                {[...(vessels.vessels || [])]
                  .sort((a, b) => {
                    const fa = a.type >= 60 && a.type <= 69 ? 1 : 0;
                    const fb = b.type >= 60 && b.type <= 69 ? 1 : 0;
                    if (fa !== fb) return fb - fa;
                    return parseFloat(b.sog) - parseFloat(a.sog);
                  })
                  .slice(0, 10)
                  .map(v => {
                    const isFerry  = v.type >= 60 && v.type <= 69;
                    const isCargo  = v.type >= 70 && v.type <= 79;
                    const col      = isFerry ? "#fb923c" : isCargo ? "#fca5a5" : "#22d3ee";
                    const moving   = parseFloat(v.sog) > 0.5;
                    return (
                      <div key={v.mmsi} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "1px solid rgba(34,211,238,0.05)" }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{isFerry ? "⛴" : isCargo ? "🚢" : "⛵"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {v.name || v.mmsi}
                            {v.flag && <span style={{ fontSize: 9, color: "#475569", marginLeft: 4 }}>{v.flag}</span>}
                          </div>
                          <div style={{ fontSize: 9, color: "#475569" }}>
                            {v.typeLabel}
                            {v.dest && <span style={{ color: "#64748b" }}> → {v.dest}</span>}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: moving ? col : "#334155" }}>
                            {v.sog} kn
                          </div>
                          {!moving && <div style={{ fontSize: 9, color: "#334155" }}>usidren</div>}
                        </div>
                      </div>
                    );
                  })
                }
                {vessels.total > 10 && (
                  <div style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>
                    + {vessels.total - 10} plovila prikazano na karti
                  </div>
                )}
              </div>
            )}

            {/* ── Webcam pokrivenost — cijela obala ── */}
            {(intel?.webcams || []).length > 0 && (() => {
              const REGIONS = [
                { key: "istra",         label: "Istra",             flag: "🌿" },
                { key: "kvarner",       label: "Kvarner / Rab",     flag: "⛵" },
                { key: "zadar_sibenik", label: "Zadar–Šibenik",     flag: "🏖️" },
                { key: "split_makarska",label: "Split–Makarska",    flag: "🌅" },
                { key: "dubrovnik",     label: "Dubrovnik",         flag: "🏛" },
                { key: "other",         label: "Ostalo",            flag: "📍" },
              ];
              const byCam = {};
              for (const w of intel.webcams) {
                const r = w.region || "other";
                if (!byCam[r]) byCam[r] = [];
                byCam[r].push(w);
              }
              const totalCams = intel.webcams.length;
              const withPreview = intel.webcams.filter(w => w.preview).length;
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 6px #22d3ee", animation: "pulse 2s infinite" }} />
                      <span style={{ fontSize: 10, color: "#22d3ee", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                        Webcam monitoring — Obala
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, color: "#475569" }}>
                      {crowdLoading && <span style={{ color: "#f59e0b" }}>⟳ AI analiza...</span>}
                      {Object.keys(crowdData).length > 0 && !crowdLoading && (
                        <span style={{ color: "#22c55e" }}>● {Object.keys(crowdData).length} analizirano</span>
                      )}
                      <span><span style={{ color: "#7dd3fc", fontWeight: 700 }}>{totalCams}</span> kamera · {withPreview} live</span>
                    </div>
                  </div>

                  {/* Regional summary bars */}
                  {REGIONS.filter(r => byCam[r.key]?.length > 0).map(reg => {
                    const cams = byCam[reg.key] || [];
                    const barW = Math.round((cams.length / totalCams) * 100);
                    const previews = cams.filter(c => c.preview).slice(0, 15);
                    return (
                      <div key={reg.key} style={{ marginBottom: 10 }}>
                        {/* Region header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            <span style={{ marginRight: 5 }}>{reg.flag}</span>{reg.label}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee" }}>{cams.length}</span>
                        </div>
                        {/* Coverage bar + avg crowd */}
                        {(() => {
                          const analyzed = cams.filter(c => crowdData[c.id]);
                          const avgBusy  = analyzed.length > 0
                            ? Math.round(analyzed.reduce((s, c) => s + crowdData[c.id].busyness, 0) / analyzed.length)
                            : null;
                          const totalPersons = analyzed.reduce((s, c) => s + (crowdData[c.id].persons || 0), 0);
                          const busyCol = avgBusy !== null ? (avgBusy >= 70 ? "#ef4444" : avgBusy >= 40 ? "#f97316" : "#22c55e") : "#22d3ee";
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                              <div style={{ flex: 1, height: 3, background: "rgba(34,211,238,0.08)", borderRadius: 2 }}>
                                <div style={{ height: 3, borderRadius: 2, width: barW + "%", background: "#22d3ee33", transition: "width .5s ease" }} />
                              </div>
                              {avgBusy !== null && (
                                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                                  <span style={{ fontSize: 9, color: busyCol, fontWeight: 700 }}>{avgBusy}% popunjenost</span>
                                  {totalPersons > 0 && <span style={{ fontSize: 9, color: "#64748b" }}>· {totalPersons} osoba</span>}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        {/* Thumbnail strip */}
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {previews.map(w => {
                            const crowd = crowdData[w.id];
                            const bColor = crowd ? (crowd.busyness >= 70 ? "#ef4444" : crowd.busyness >= 40 ? "#f97316" : "#22c55e") : null;
                            return (
                            <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                              <div style={{ position: "relative", width: 72, height: 48 }}>
                                <img src={w.preview} alt={w.title}
                                  style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 5, border: `1px solid ${crowd ? bColor + "88" : "rgba(34,211,238,0.22)"}`, display: "block" }}
                                />
                                {/* AI crowd badge */}
                                {crowd && (
                                  <div style={{
                                    position: "absolute", top: 2, right: 2,
                                    background: "rgba(6,15,30,0.9)", borderRadius: 4,
                                    fontSize: 8, fontWeight: 700, color: bColor,
                                    padding: "1px 4px", lineHeight: 1.4,
                                  }}>
                                    {crowd.persons !== null ? `👥${crowd.persons}` : ""}{crowd.busyness !== null ? ` ${crowd.busyness}%` : ""}
                                  </div>
                                )}
                                <div style={{
                                  position: "absolute", bottom: 0, left: 0, right: 0,
                                  background: "rgba(6,15,30,0.75)", borderRadius: "0 0 4px 4px",
                                  fontSize: 7, color: "#94a3b8", padding: "1px 3px",
                                  overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                                }}>{w.city || w.title}</div>
                              </div>
                            </a>
                            );
                          })}
                          {/* +N more badge */}
                          {cams.filter(c => c.preview).length > 15 && (
                            <div style={{
                              width: 72, height: 48, borderRadius: 5,
                              border: "1px solid rgba(34,211,238,0.15)",
                              background: "rgba(34,211,238,0.04)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, color: "#475569",
                            }}>+{cams.filter(c => c.preview).length - 15}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── BIG EYE — Obalne kamere (Gemini Vision) ── */}
            {bigEye.filter(c => c.visibility !== "offline").length > 0 && (() => {
              const live   = bigEye.filter(c => c.visibility !== "offline");
              const avgPct = Math.round(live.reduce((s, c) => s + c.crowd_pct, 0) / live.length);
              return (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa", animation: "pulse 2s infinite" }} />
                      <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
                        BIG EYE — Obalne kamere
                      </span>
                    </div>
                    <span style={{ fontSize: 9, color: "#475569" }}>{live.length} kamera · ⌀{avgPct}%</span>
                  </div>
                  {live.map(cam => {
                    const pctCol = cam.crowd_pct >= 70 ? "#ef4444" : cam.crowd_pct >= 40 ? "#f97316" : "#22c55e";
                    return (
                      <div key={cam.id} style={{ display: "flex", gap: 6, marginBottom: 7, alignItems: "flex-start" }}>
                        <img
                          src={cam.snap}
                          alt={cam.label}
                          style={{ width: 62, height: 42, objectFit: "cover", borderRadius: 4, border: `1px solid ${pctCol}55`, flexShrink: 0 }}
                          onError={e => { e.target.style.display = "none"; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {cam.label}
                          </div>
                          <div style={{ height: 3, background: "rgba(167,139,250,0.1)", borderRadius: 2, marginBottom: 3, overflow: "hidden" }}>
                            <div style={{ height: 3, borderRadius: 2, width: `${cam.crowd_pct}%`, background: pctCol, transition: "width .5s ease" }} />
                          </div>
                          <div style={{ display: "flex", gap: 6, fontSize: 9, color: "#64748b", flexWrap: "wrap" }}>
                            <span style={{ color: pctCol, fontWeight: 700 }}>{cam.crowd_pct}%</span>
                            {cam.persons  > 0 && <span>👥{cam.persons}</span>}
                            {cam.boats    > 0 && <span>⛵{cam.boats}</span>}
                            {cam.vehicles > 0 && <span>🚗{cam.vehicles}</span>}
                            {cam.notes && <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cam.notes}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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

            {/* ── Data Sources — pouzdanost podataka ── */}
            {(() => {
              const sources = [
                {
                  name: "HERE Traffic",
                  icon: "🛣",
                  status: intel?.highwaySections?.length > 0 ? "live" : "wait",
                  detail: intel?.highwaySections ? intel.highwaySections.length + " dionica · real-time" : "čeka...",
                },
                {
                  name: "AIS Plovila",
                  icon: "⛵",
                  status: vessels?.live ? "live" : vessels ? "sim" : "wait",
                  detail: vessels
                    ? vessels.total + " plovila" + (vessels.live ? " · aisstream.io" : " · simulacija")
                    : "čeka...",
                },
                {
                  name: "Windy webcams",
                  icon: "📷",
                  status: (intel?.webcams?.length || 0) > 0 ? "live" : "wait",
                  detail: intel?.webcams
                    ? intel.webcams.length + " kamera" + (Object.keys(crowdData).length > 0 ? " · " + Object.keys(crowdData).length + " AI" : "")
                    : "čeka...",
                },
                {
                  name: "YOLO senzori",
                  icon: "🔍",
                  status: intel?.yolo ? (intel.yolo.simulated ? "sim" : "live") : "wait",
                  detail: intel?.yolo
                    ? (intel.yolo.simulated ? "DEMO model (sezonski)" : intel.yolo.docCount + " zapisa · Firestore")
                    : "čeka...",
                },
                {
                  name: "BIG EYE Vision",
                  icon: "👁",
                  status: bigEye.filter(c => c.visibility !== "offline").length > 0 ? "live" : "wait",
                  detail: bigEye.length > 0
                    ? bigEye.filter(c => c.visibility !== "offline").length + " kamera · Gemini Flash Vision"
                    : "čeka prvi cron (*/30 min)...",
                },
                {
                  name: "Sentinel-2",
                  icon: "🛰",
                  status: (intel?.parking?.length > 0 || intel?.sea?.length > 0) ? "delay" : "wait",
                  detail: "2–3 dana latencija · ESA Copernicus",
                },
                {
                  name: "Rab Card",
                  icon: "🪪",
                  status: checkins?.totalToday > 0 ? "live" : checkins ? "empty" : "wait",
                  detail: checkins
                    ? (checkins.totalToday > 0
                        ? checkins.totalToday + " scan · " + checkins.uniqueCards + " kartica"
                        : "Nema skena danas — QR aktivacija pending")
                    : "čeka...",
                },
              ];
              const statusMeta = {
                live:  { col: "#22c55e", dot: "●", label: "LIVE"  },
                sim:   { col: "#f59e0b", dot: "◐", label: "DEMO"  },
                delay: { col: "#eab308", dot: "◑", label: "≤3d"   },
                empty: { col: "#475569", dot: "○", label: "ČEKA"  },
                wait:  { col: "#334155", dot: "○", label: "..."   },
              };
              return (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(14,165,233,0.1)" }}>
                  <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                    Pouzdanost podataka
                  </div>
                  {sources.map(src => {
                    const m = statusMeta[src.status] || statusMeta.wait;
                    return (
                      <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: "1px solid rgba(14,165,233,0.05)" }}>
                        <span style={{ fontSize: 13, flexShrink: 0, width: 18, textAlign: "center" }}>{src.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: src.status === "empty" ? "#475569" : "#94a3b8" }}>{src.name}</div>
                          <div style={{ fontSize: 9, color: "#334155", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{src.detail}</div>
                        </div>
                        <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: m.col, letterSpacing: ".04em" }}>
                          {m.dot} {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

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
