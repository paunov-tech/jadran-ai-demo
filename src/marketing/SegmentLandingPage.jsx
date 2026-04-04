// Route: /m/:slug  (e.g. /m/de_camper?v=vDEC_001)
// Segment-specific landing page with A/B variant tracking and lead capture.

import { useState, useEffect } from "react";
import { BRAND, SEGMENTS } from "./marketingConfig.js";

const STYLES = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Outfit', system-ui, sans-serif; background:#0a1628; color:#f0f9ff; }
  .hero { min-height:100dvh; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:40px 20px; background:linear-gradient(160deg, #050d1a 0%, #0a1628 60%, #061018 100%);
    text-align:center; }
  .logo { font-size:13px; letter-spacing:3px; color:#0ea5e9; margin-bottom:32px; font-weight:700; }
  .hook { font-size:clamp(22px,5vw,48px); font-weight:700; line-height:1.2; max-width:720px;
    margin-bottom:20px; }
  .sub { font-size:clamp(14px,2vw,18px); color:#7dd3fc; max-width:560px; line-height:1.6;
    margin-bottom:40px; font-weight:300; }
  .form-wrap { background:rgba(255,255,255,0.04); border:1px solid rgba(14,165,233,0.2);
    border-radius:20px; padding:32px; max-width:420px; width:100%; }
  .form-title { font-size:16px; color:#7dd3fc; margin-bottom:20px; font-weight:500; }
  input { width:100%; padding:14px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(14,165,233,0.2);
    border-radius:12px; color:#f0f9ff; font-size:15px; margin-bottom:12px; outline:none;
    font-family:inherit; transition:border-color 0.2s; }
  input:focus { border-color:#0ea5e9; }
  input::placeholder { color:#475569; }
  .btn { width:100%; padding:16px; background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff;
    border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit;
    transition:all 0.2s; }
  .btn:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(14,165,233,0.35); }
  .btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
  .trust { margin-top:16px; font-size:12px; color:#475569; }
  .success { text-align:center; padding:20px; }
  .success .wave { font-size:48px; margin-bottom:16px; }
  .success h3 { font-size:20px; margin-bottom:8px; }
  .success p { color:#7dd3fc; font-size:14px; margin-bottom:20px; }
  .explore-btn { display:inline-block; padding:12px 24px; background:linear-gradient(135deg,#0ea5e9,#0284c7);
    color:#fff; text-decoration:none; border-radius:12px; font-weight:700; font-size:14px; }
  .benefits { display:flex; flex-direction:column; gap:12px; margin:40px 0; max-width:520px; }
  .benefit { display:flex; align-items:flex-start; gap:12px; text-align:left; }
  .benefit .icon { font-size:20px; flex-shrink:0; margin-top:2px; }
  .benefit p { color:#94a3b8; font-size:14px; line-height:1.5; }
  .benefit strong { color:#f0f9ff; }
  .footer { padding:24px; text-align:center; font-size:11px; color:#1e293b; }
`;

const BENEFITS = {
  de_camper: [
    { icon: "🅿️", title: "Legale Stellplätze", desc: "Findet genehmigte Campingplätze und Stellplätze — kein Bußgeldrisiko." },
    { icon: "📏", title: "Höhenbeschränkungen", desc: "Tunnel, Brücken und Straßen mit Höhenlimits für dein Fahrzeug." },
    { icon: "🌬️", title: "Bora-Warnungen", desc: "KI warnt dich vor gefährlichen Böen auf Küstenstraßen." },
  ],
  de_family: [
    { icon: "🏖️", title: "Familienstrände", desc: "Flaches Wasser, Sandstrand, keine gefährlichen Strömungen." },
    { icon: "🍕", title: "Restaurants in der Nähe", desc: "Kinderfreundliche Lokale mit echten Bewertungen." },
    { icon: "🚗", title: "Anreise & Parken", desc: "Parkplätze, Busverbindungen und Zugang zu den Stränden." },
  ],
  it_sailor: [
    { icon: "⚓", title: "Marina ACI", desc: "Disponibilità in tempo reale, prezzi e servizi." },
    { icon: "🌊", title: "Ancoraggi liberi", desc: "Le baie più belle dove passare la notte gratuitamente." },
    { icon: "🌬️", title: "Meteo marino", desc: "Previsioni Bora e Jugo — non salpare alla cieca." },
  ],
  en_cruiser: [
    { icon: "⚓", title: "Marina availability", desc: "Real-time ACI marina berth info and pricing." },
    { icon: "🏝️", title: "Hidden anchorages", desc: "Quiet bays away from the charter flotillas." },
    { icon: "📡", title: "NAVTEX & weather", desc: "Bura and Jugo forecasts before you leave port." },
  ],
  en_camper: [
    { icon: "🅿️", title: "Legal parking spots", desc: "Approved camper stops along the Adriatic — no fine risk." },
    { icon: "📏", title: "Height restrictions", desc: "Tunnels, bridges and roads with vehicle height limits." },
    { icon: "🌬️", title: "Bura wind warnings", desc: "AI alerts you before dangerous gusts hit coastal roads." },
  ],
  en_couple: [
    { icon: "🏖️", title: "Secret beaches", desc: "GPS coordinates to coves that aren't on Google Maps." },
    { icon: "🍷", title: "Local restaurants", desc: "Where the fishermen eat — not the tourist traps." },
    { icon: "🌅", title: "Sunset spots", desc: "Best viewpoints for golden hour along the coast." },
  ],
};

const FORM_LABELS = {
  de: { name: "Vorname", email: "E-Mail-Adresse", cta: "Kostenlos testen →", trust: "Kein Spam. Jederzeit abmeldbar." },
  it: { name: "Nome", email: "Indirizzo email", cta: "Prova gratis →", trust: "Niente spam. Disiscrizione in qualsiasi momento." },
  en: { name: "First name", email: "Email address", cta: "Get free access →", trust: "No spam. Unsubscribe anytime." },
};

export default function SegmentLandingPage({ slug }) {
  const seg = SEGMENTS[slug];
  const [variantId, setVariantId] = useState("default");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const labels = FORM_LABELS[seg?.lang] || FORM_LABELS.en;
  const benefits = BENEFITS[slug] || [];

  useEffect(() => {
    if (!seg) return;
    const v = new URLSearchParams(window.location.search).get("v") || "default";
    setVariantId(v);
    // Track impression
    fetch("/api/ab-impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: v, segmentId: slug, source: document.referrer || "direct" }),
    }).catch(() => {});
  }, [slug]);

  if (!seg) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a1628", color: "#f0f9ff", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
          <p>Page not found</p>
          <a href="/" style={{ color: "#0ea5e9", marginTop: 16, display: "block" }}>Go home</a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, segmentId: slug, variantId, source: "landing" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "error");

      // Record conversion
      fetch("/api/ab-convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, segmentId: slug }),
      }).catch(() => {});

      setDone(true);
    } catch (err) {
      setError(err.message === "invalid email" ? "Please enter a valid email." : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="hero">
        <div className="logo">JADRAN.AI</div>
        <h1 className="hook">{seg.headline}</h1>
        <p className="sub">{seg.subheadline}</p>

        <div className="form-wrap">
          {done ? (
            <div className="success">
              <div className="wave">🌊</div>
              <h3>Check your inbox!</h3>
              <p>We sent your guide to <strong>{email}</strong></p>
              <a href={`/ai?niche=${seg.niche}&lang=${seg.lang_param}`} className="explore-btn">
                Open JADRAN.AI →
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="form-title">{seg.pain}</p>
              <input
                type="text"
                placeholder={labels.name}
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                type="email"
                placeholder={labels.email}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</p>}
              <button type="submit" className="btn" disabled={loading}>
                {loading ? "..." : seg.cta}
              </button>
              <p className="trust">{labels.trust}</p>
            </form>
          )}
        </div>

        {benefits.length > 0 && !done && (
          <div className="benefits">
            {benefits.map((b, i) => (
              <div key={i} className="benefit">
                <span className="icon">{b.icon}</span>
                <p><strong>{b.title}</strong> — {b.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <footer className="footer">
        <a href="/privacy" style={{ color: "#334155", textDecoration: "none" }}>Privacy</a>
        {" · "}JADRAN.AI · SIAL Consulting d.o.o.
      </footer>
    </>
  );
}
