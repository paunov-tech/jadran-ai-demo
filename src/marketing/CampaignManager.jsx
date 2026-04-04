// Route: /campaigns (admin only)
// Campaign Manager: generate ad variants, view A/B stats, kill losers.

import { useState, useEffect } from "react";
import { SEGMENTS, BRAND } from "./marketingConfig.js";

const enc = t => { try { return btoa(t); } catch { return t; } };

const STYLES = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Outfit',system-ui,sans-serif; background:#080f1e; color:#f0f9ff; }
  .shell { display:flex; min-height:100dvh; }
  nav { width:220px; background:#050c1a; border-right:1px solid rgba(14,165,233,0.1);
    padding:24px 16px; display:flex; flex-direction:column; gap:4px; flex-shrink:0; }
  nav .logo { font-size:11px; letter-spacing:3px; color:#0ea5e9; font-weight:700;
    margin-bottom:24px; padding:0 8px; }
  nav button { padding:10px 12px; background:none; border:none; color:#64748b;
    text-align:left; border-radius:10px; cursor:pointer; font-size:13px; font-family:inherit;
    transition:all 0.15s; }
  nav button:hover, nav button.active { background:rgba(14,165,233,0.1); color:#7dd3fc; }
  .main { flex:1; padding:32px; overflow-y:auto; }
  h1 { font-size:20px; margin-bottom:8px; }
  .sub { color:#64748b; font-size:13px; margin-bottom:28px; }
  .seg-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:24px; }
  .tab { padding:8px 16px; border-radius:10px; font-size:13px; cursor:pointer;
    border:1px solid rgba(14,165,233,0.2); background:none; color:#64748b;
    font-family:inherit; transition:all 0.15s; }
  .tab.active { background:rgba(14,165,233,0.15); color:#7dd3fc; border-color:#0ea5e9; }
  .generate-panel { background:rgba(255,255,255,0.02); border:1px solid rgba(14,165,233,0.1);
    border-radius:16px; padding:24px; margin-bottom:28px; }
  .generate-panel h3 { font-size:14px; color:#7dd3fc; margin-bottom:16px; letter-spacing:1px; }
  .row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  select, input[type=number] { padding:10px 14px; background:rgba(255,255,255,0.05);
    border:1px solid rgba(14,165,233,0.2); border-radius:10px; color:#f0f9ff;
    font-size:13px; font-family:inherit; outline:none; }
  .btn { padding:10px 20px; background:linear-gradient(135deg,#0ea5e9,#0284c7);
    color:#fff; border:none; border-radius:10px; cursor:pointer; font-size:13px;
    font-weight:600; font-family:inherit; transition:all 0.2s; }
  .btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(14,165,233,0.3); }
  .btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-sm { padding:6px 12px; font-size:12px; }
  .btn-kill { background:linear-gradient(135deg,#ef4444,#dc2626); }
  .btn-revive { background:linear-gradient(135deg,#22c55e,#16a34a); }
  .variants-grid { display:grid; gap:12px; }
  .variant-card { background:rgba(255,255,255,0.02); border:1px solid rgba(14,165,233,0.1);
    border-radius:14px; padding:16px 20px; display:flex; align-items:center; gap:16px; }
  .variant-card.killed { opacity:0.4; border-color:rgba(239,68,68,0.2); }
  .variant-id { font-size:11px; color:#0ea5e9; letter-spacing:1px; font-weight:600; min-width:120px; }
  .stats { display:flex; gap:20px; flex:1; }
  .stat { text-align:center; }
  .stat-val { font-size:18px; font-weight:700; }
  .stat-lbl { font-size:10px; color:#475569; letter-spacing:1px; margin-top:2px; }
  .conv-rate { font-size:18px; font-weight:700; }
  .conv-rate.good { color:#22c55e; }
  .conv-rate.bad { color:#ef4444; }
  .conv-rate.neutral { color:#f59e0b; }
  .killed-badge { font-size:10px; background:rgba(239,68,68,0.15); color:#f87171;
    padding:3px 8px; border-radius:6px; letter-spacing:1px; }
  .copy-panel { margin-top:16px; display:grid; gap:8px; max-height:400px; overflow-y:auto; }
  .copy-card { background:rgba(255,255,255,0.02); border:1px solid rgba(14,165,233,0.1);
    border-radius:12px; padding:14px 16px; }
  .copy-hook { font-size:14px; font-weight:600; color:#f0f9ff; margin-bottom:4px; }
  .copy-body { font-size:13px; color:#64748b; line-height:1.5; margin-bottom:6px; }
  .copy-meta { display:flex; gap:12px; font-size:11px; color:#475569; }
  .angle-badge { padding:2px 8px; background:rgba(14,165,233,0.1); border-radius:6px; color:#7dd3fc; }
  .err { color:#f87171; font-size:13px; padding:12px; }
  .loading { color:#64748b; font-size:14px; padding:20px; text-align:center; }
  .empty { color:#334155; font-size:14px; padding:20px; text-align:center; }
  .section-title { font-size:11px; letter-spacing:2px; color:#475569; margin:24px 0 12px; }
  .token-wrap { margin-bottom:24px; display:flex; gap:8px; align-items:center; }
  .token-input { padding:10px 14px; background:rgba(255,255,255,0.05);
    border:1px solid rgba(14,165,233,0.2); border-radius:10px; color:#f0f9ff;
    font-size:13px; font-family:inherit; outline:none; width:300px; }
`;

export default function CampaignManager() {
  const [token, setToken] = useState(() => sessionStorage.getItem("cm_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSeg, setSelectedSeg] = useState("de_camper");
  const [count, setCount] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [abData, setAbData] = useState([]);
  const [abLoading, setAbLoading] = useState(false);
  const [genError, setGenError] = useState("");

  const authed = !!token;

  function saveToken() {
    sessionStorage.setItem("cm_token", tokenInput);
    setToken(tokenInput);
    setTokenInput("");
  }

  async function loadAbData(segId) {
    setAbLoading(true);
    try {
      const r = await fetch(`/api/ab-control?segmentId=${segId}`, {
        headers: { "x-admin-token": enc(token) },
      });
      const data = await r.json();
      setAbData(data.variants || []);
    } catch {
      setAbData([]);
    } finally {
      setAbLoading(false);
    }
  }

  useEffect(() => {
    if (authed && activeTab === "ab") loadAbData(selectedSeg);
  }, [selectedSeg, activeTab, authed]);

  async function generate() {
    setGenerating(true);
    setGenError("");
    setGeneratedVariants([]);
    try {
      const r = await fetch("/api/campaign-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": enc(token) },
        body: JSON.stringify({ segmentId: selectedSeg, count }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || data.error || "Generation failed");
      setGeneratedVariants(data.variants || []);
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function killVariant(variantId) {
    await fetch("/api/ab-control", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": enc(token) },
      body: JSON.stringify({ action: "kill", variantId, segmentId: selectedSeg }),
    });
    loadAbData(selectedSeg);
  }

  async function reviveVariant(variantId) {
    await fetch("/api/ab-control", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": enc(token) },
      body: JSON.stringify({ action: "revive", variantId, segmentId: selectedSeg }),
    });
    loadAbData(selectedSeg);
  }

  function convRateClass(rate) {
    const n = parseFloat(rate);
    if (isNaN(n)) return "neutral";
    if (n >= 2) return "good";
    if (n < 1) return "bad";
    return "neutral";
  }

  if (!authed) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080f1e" }}>
          <div style={{ maxWidth: 360, padding: 32, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#0ea5e9", fontWeight: 700, marginBottom: 24, fontFamily: "Outfit,system-ui,sans-serif" }}>CAMPAIGN MANAGER</div>
            <input
              className="token-input"
              type="password"
              placeholder="Admin token"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveToken()}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <button className="btn" style={{ width: "100%" }} onClick={saveToken}>Enter →</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">
        <nav>
          <div className="logo">CAMPAIGNS</div>
          {["overview", "generate", "ab"].map(t => (
            <button key={t} className={activeTab === t ? "active" : ""} onClick={() => setActiveTab(t)}>
              {t === "overview" && "📊 Overview"}
              {t === "generate" && "✨ Generate"}
              {t === "ab" && "⚗️ A/B Stats"}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={() => { sessionStorage.removeItem("cm_token"); setToken(""); }} style={{ fontSize: 12, color: "#334155" }}>
            Sign out
          </button>
        </nav>

        <div className="main">
          {/* Segment selector */}
          <div className="seg-tabs">
            {Object.values(SEGMENTS).map(seg => (
              <button
                key={seg.id}
                className={`tab ${selectedSeg === seg.id ? "active" : ""}`}
                onClick={() => setSelectedSeg(seg.id)}
              >
                {seg.label}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <>
              <h1>Marketing Platform</h1>
              <p className="sub">JADRAN.AI · Medvi-style performance marketing</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
                {[
                  { label: "Active segments", val: Object.keys(SEGMENTS).length, icon: "🎯" },
                  { label: "Lead routes", val: "/m/{slug}", icon: "🔗" },
                  { label: "Qualifier", val: "/qualify", icon: "🤖" },
                  { label: "Email drip", val: "3 steps", icon: "📧" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(14,165,233,0.1)", borderRadius: 16, padding: "20px 24px" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="section-title">SEGMENT LANDING PAGES</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.values(SEGMENTS).map(seg => (
                  <div key={seg.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(14,165,233,0.08)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#0ea5e9", letterSpacing: 1, fontWeight: 600, minWidth: 100 }}>{seg.id}</span>
                    <a href={`/m/${seg.id}`} target="_blank" rel="noreferrer" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>/m/{seg.id}</a>
                    <span style={{ flex: 1 }} />
                    <a href={`/m/${seg.id}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#0ea5e9", textDecoration: "none" }}>Preview →</a>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "generate" && (
            <>
              <h1>Generate Ad Variants</h1>
              <p className="sub">Claude generates {count} variants — hooks, bodies, CTAs, angles</p>
              <div className="generate-panel">
                <h3>GENERATION SETTINGS</h3>
                <div className="row">
                  <select value={selectedSeg} onChange={e => setSelectedSeg(e.target.value)}>
                    {Object.values(SEGMENTS).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <input type="number" value={count} min={5} max={20} step={5}
                    onChange={e => setCount(parseInt(e.target.value))}
                    style={{ width: 80 }} />
                  <span style={{ fontSize: 13, color: "#475569" }}>variants</span>
                  <button className="btn" onClick={generate} disabled={generating}>
                    {generating ? "Generating..." : "✨ Generate with Claude"}
                  </button>
                </div>
                {genError && <p className="err">{genError}</p>}
              </div>

              {generatedVariants.length > 0 && (
                <>
                  <div className="section-title">{generatedVariants.length} VARIANTS GENERATED</div>
                  <div className="copy-panel">
                    {generatedVariants.map((v, i) => (
                      <div key={i} className="copy-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#0ea5e9", letterSpacing: 1 }}>{v.id || `V${i + 1}`}</span>
                          <span className="angle-badge">{v.angle}</span>
                        </div>
                        <div className="copy-hook">{v.hook}</div>
                        <div className="copy-body">{v.body}</div>
                        <div className="copy-meta">
                          <span>CTA: <strong style={{ color: "#f0f9ff" }}>{v.cta}</strong></span>
                          {v.headline && <span style={{ color: "#475569" }}>LP: {v.headline}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!generating && generatedVariants.length === 0 && (
                <p className="empty">Click Generate to create ad variants for the selected segment.</p>
              )}
            </>
          )}

          {activeTab === "ab" && (
            <>
              <h1>A/B Test Results</h1>
              <p className="sub">Auto-kills variants below 1% conv rate after 500 impressions</p>
              <button className="btn btn-sm" style={{ marginBottom: 16 }} onClick={() => loadAbData(selectedSeg)}>
                ↻ Refresh
              </button>
              {abLoading && <p className="loading">Loading...</p>}
              {!abLoading && abData.length === 0 && (
                <p className="empty">No A/B data yet for {selectedSeg}. Run ads with ?v=variantId in the URL.</p>
              )}
              {!abLoading && abData.length > 0 && (
                <div className="variants-grid">
                  {abData.map(v => (
                    <div key={v.id} className={`variant-card ${v.killed ? "killed" : ""}`}>
                      <div className="variant-id">{v.variantId}</div>
                      <div className="stats">
                        <div className="stat">
                          <div className="stat-val">{v.impressions.toLocaleString()}</div>
                          <div className="stat-lbl">IMPRESSIONS</div>
                        </div>
                        <div className="stat">
                          <div className="stat-val">{v.conversions}</div>
                          <div className="stat-lbl">LEADS</div>
                        </div>
                        <div className="stat">
                          <div className={`conv-rate ${convRateClass(v.convRate)}`}>{v.convRate}</div>
                          <div className="stat-lbl">CONV RATE</div>
                        </div>
                      </div>
                      {v.killed ? (
                        <>
                          <span className="killed-badge">KILLED</span>
                          <button className="btn btn-sm btn-revive" onClick={() => reviveVariant(v.variantId)}>Revive</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-kill" onClick={() => killVariant(v.variantId)}>Kill</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
