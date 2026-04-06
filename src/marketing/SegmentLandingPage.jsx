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
  .or-sep { display:flex; align-items:center; gap:10px; margin:14px 0; color:#334155; font-size:12px; }
  .or-sep::before, .or-sep::after { content:""; flex:1; height:1px; background:rgba(255,255,255,0.06); }
  .btn-wa { width:100%; padding:14px; background:#25D366; color:#fff; border:none; border-radius:14px;
    font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; display:flex; align-items:center;
    justify-content:center; gap:8px; transition:all 0.2s; }
  .btn-wa:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(37,211,102,0.35); }
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
  de: { name: "Vorname", email: "E-Mail-Adresse", cta: "Kostenlos testen →", trust: "Kein Spam. Jederzeit abmeldbar.", wa: "Per WhatsApp kontaktieren" },
  it: { name: "Nome", email: "Indirizzo email", cta: "Prova gratis →", trust: "Niente spam. Disiscrizione in qualsiasi momento.", wa: "Contatta via WhatsApp" },
  en: { name: "First name", email: "Email address", cta: "Get free access →", trust: "No spam. Unsubscribe anytime.", wa: "Contact via WhatsApp" },
};

const WA_MESSAGES = {
  de_camper:  "Hallo, ich interessiere mich für den Wohnmobil-Guide für Kroatien 🚐",
  de_family:  "Hallo, ich interessiere mich für den Familienurlaub-Guide für Kroatien 🏖️",
  it_sailor:  "Ciao, sono interessato alla guida vela per la Croazia ⛵",
  en_cruiser: "Hi, I'm interested in the Croatia sailing guide ⚓",
  en_camper:  "Hi, I'm interested in the Croatia camper van guide 🚐",
  en_couple:  "Hi, I'm interested in the Croatia couples guide 🌊",
};

const WA_NUMBER = "381695561699";

const RETURNING_HOOK = {
  de_camper:  "Willkommen zurück! Noch auf der Suche nach Stellplätzen in Kroatien?",
  de_family:  "Willkommen zurück! Noch auf der Suche nach dem perfekten Familienurlaub?",
  it_sailor:  "Bentornato! Stai ancora cercando ormeggi in Croazia?",
  en_cruiser: "Welcome back! Still looking for the best anchorages in Croatia?",
  en_camper:  "Welcome back! Still looking for camper spots on the Adriatic?",
  en_couple:  "Welcome back! Still looking for those secret beaches?",
};

function getVid() {
  const KEY = "jadran_vid";
  // try localStorage first, then cookie
  let vid = localStorage.getItem(KEY);
  if (!vid) {
    const match = document.cookie.match(/(?:^|;\s*)jadran_vid=([^;]+)/);
    vid = match ? match[1] : null;
  }
  if (!vid) {
    vid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, vid);
    const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `jadran_vid=${vid}; expires=${exp}; path=/; SameSite=Lax`;
    return { vid, returning: false };
  }
  return { vid, returning: true };
}

function getFingerprint() {
  return {
    ua: navigator.userAgent,
    lang: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    dpr: window.devicePixelRatio || 1,
  };
}

export default function SegmentLandingPage({ slug }) {
  const seg = SEGMENTS[slug];
  const [variantId, setVariantId] = useState("default");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [vid, setVid] = useState("");
  const [returning, setReturning] = useState(false);

  const labels = FORM_LABELS[seg?.lang] || FORM_LABELS.en;
  const benefits = BENEFITS[slug] || [];

  useEffect(() => {
    if (!seg) return;
    const v = new URLSearchParams(window.location.search).get("v") || "default";
    setVariantId(v);
    const { vid: visitorId, returning: isReturning } = getVid();
    setVid(visitorId);
    setReturning(isReturning);
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
        body: JSON.stringify({ email, name, segmentId: slug, variantId, source: "landing", fingerprint: getFingerprint(), vid, returning }),
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
        <h1 className="hook">{returning && RETURNING_HOOK[slug] ? RETURNING_HOOK[slug] : seg.headline}</h1>
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
              <div className="or-sep">or</div>
              <button
                type="button"
                className="btn-wa"
                onClick={() => {
                  const msg = encodeURIComponent(WA_MESSAGES[slug] || "Hi, I'm interested in JADRAN.AI 🌊");
                  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {labels.wa}
              </button>
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
