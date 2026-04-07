// Route: /m/:slug  (e.g. /m/de_camper?v=vDEC_001)
// Segment-specific landing page — aggressive demo-first funnel.
// Flow: teaser chat → live AI question (free) → email gate → full access

import { useState, useEffect, useRef } from "react";
import { BRAND, SEGMENTS } from "./marketingConfig.js";

const STYLES = `
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { overflow-x:hidden; max-width:100vw; }
  body { font-family: 'Outfit', system-ui, sans-serif; background:#050d1a; color:#f0f9ff; }

  /* ── HERO ── */
  .hero { padding:40px 20px 0; text-align:center; background:linear-gradient(180deg,#050d1a 0%,#071828 100%); }
  .logo { font-size:12px; letter-spacing:4px; color:#0ea5e9; margin-bottom:28px; font-weight:700; }
  .hook { font-size:clamp(24px,5.5vw,52px); font-weight:700; line-height:1.15; max-width:680px;
    margin:0 auto 16px; }
  .sub { font-size:clamp(14px,2vw,17px); color:#7dd3fc; max-width:520px; margin:0 auto 12px; line-height:1.6; font-weight:300; }
  .social-proof { font-size:13px; color:#475569; margin-bottom:32px; }
  .social-proof span { color:#38bdf8; font-weight:600; }

  /* ── DEMO CHAT ── */
  .demo-wrap { max-width:560px; margin:0 auto 0; padding:0 0 32px; }
  .demo-label { font-size:11px; letter-spacing:2px; color:#334155; font-weight:700; text-align:center; margin-bottom:12px; }
  .chat-box { background:rgba(10,18,32,0.95); border:1px solid rgba(14,165,233,0.18);
    border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.6); }

  /* teaser conversation */
  .teaser-msgs { padding:20px 18px 14px; }
  .tmsg { display:flex; margin-bottom:12px; }
  .tmsg.user { justify-content:flex-end; }
  .tmsg .bubble { padding:11px 15px; font-size:14px; line-height:1.6; max-width:84%; border-radius:16px; }
  .tmsg.user .bubble { background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff; border-radius:16px 4px 16px 16px; }
  .tmsg.ai .bubble { background:rgba(14,165,233,0.07); border:1px solid rgba(14,165,233,0.12);
    color:#cbd5e1; border-radius:4px 16px 16px 16px; }
  .ai-badge { font-size:10px; color:#0ea5e9; font-weight:700; letter-spacing:1px; margin-bottom:4px; }

  /* live reply area */
  .live-msgs { padding:0 18px 8px; min-height:0; }
  .live-msgs.has-msgs { padding-top:8px; border-top:1px solid rgba(14,165,233,0.07); }
  .lmsg { display:flex; margin-bottom:10px; animation:msgIn .3s both; }
  .lmsg.user { justify-content:flex-end; }
  .lmsg .bubble { padding:10px 14px; font-size:14px; line-height:1.65; max-width:84%; border-radius:16px; white-space:pre-wrap; }
  .lmsg.user .bubble { background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff; border-radius:16px 4px 16px 16px; }
  .lmsg.ai .bubble { background:rgba(14,165,233,0.07); border:1px solid rgba(14,165,233,0.1);
    color:#cbd5e1; border-radius:4px 16px 16px 16px; }
  @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  @keyframes blink { 0%,80%,100%{opacity:.15} 40%{opacity:1} }

  /* chips */
  .chips { display:flex; flex-wrap:wrap; gap:8px; padding:0 18px 16px; }
  .chip { padding:9px 14px; background:rgba(14,165,233,0.06); border:1px solid rgba(14,165,233,0.2);
    border-radius:20px; font-size:13px; color:#7dd3fc; cursor:pointer; font-family:inherit;
    transition:all .2s; text-align:left; }
  .chip:hover { background:rgba(14,165,233,0.14); border-color:#0ea5e9; color:#fff; }
  .chip:disabled { opacity:.4; cursor:default; }

  /* input row */
  .input-row { display:flex; gap:8px; padding:12px 14px; border-top:1px solid rgba(14,165,233,0.08); }
  .chat-input { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(14,165,233,0.18);
    border-radius:12px; padding:12px 16px; font-size:15px; color:#e2e8f0; outline:none;
    font-family:inherit; caret-color:#0ea5e9; }
  .chat-input::placeholder { color:#334155; }
  .send-btn { width:44px; height:44px; border-radius:11px; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; }
  .send-btn.active { background:linear-gradient(135deg,#0ea5e9,#0284c7); }
  .send-btn.inactive { background:rgba(14,165,233,0.07); cursor:default; }

  /* email gate */
  .gate { padding:20px 20px 20px; background:rgba(14,165,233,0.04);
    border-top:1px solid rgba(14,165,233,0.12); }
  .gate-title { font-size:15px; font-weight:600; color:#f0f9ff; margin-bottom:6px; }
  .gate-sub { font-size:13px; color:#64748b; margin-bottom:16px; line-height:1.5; }
  .gate input { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06);
    border:1px solid rgba(14,165,233,0.2); border-radius:12px; color:#f0f9ff; font-size:15px;
    margin-bottom:10px; outline:none; font-family:inherit; }
  .gate input:focus { border-color:#0ea5e9; }
  .gate input::placeholder { color:#475569; }
  .gate-btn { width:100%; padding:14px; background:linear-gradient(135deg,#0ea5e9,#0284c7);
    color:#fff; border:none; border-radius:12px; font-size:15px; font-weight:700;
    cursor:pointer; font-family:inherit; transition:all .2s; }
  .gate-btn:disabled { opacity:.6; cursor:not-allowed; }
  .gate-trust { font-size:11px; color:#334155; margin-top:8px; text-align:center; }

  /* ── BELOW CHAT ── */
  .section { padding:40px 20px; max-width:580px; margin:0 auto; }
  .section-label { font-size:10px; letter-spacing:3px; color:#0ea5e9; font-weight:700; margin-bottom:20px; text-align:center; }

  /* proof */
  .proof-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .proof-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
    border-radius:16px; padding:18px; }
  .proof-card blockquote { font-size:14px; color:#94a3b8; line-height:1.6; font-style:italic; margin-bottom:10px; }
  .proof-card cite { font-size:12px; color:#475569; font-style:normal; }

  /* benefits */
  .ben-list { display:flex; flex-direction:column; gap:14px; }
  .ben { display:flex; gap:14px; align-items:flex-start; }
  .ben-icon { font-size:22px; flex-shrink:0; margin-top:1px; }
  .ben-text strong { display:block; font-size:15px; color:#f0f9ff; margin-bottom:3px; }
  .ben-text span { font-size:13px; color:#64748b; line-height:1.5; }

  /* final CTA */
  .final-cta { padding:0 20px 60px; text-align:center; max-width:480px; margin:0 auto; }
  .final-cta p { font-size:13px; color:#475569; margin-top:10px; }

  /* success */
  .success-wrap { text-align:center; padding:40px 20px; }
  .success-wrap .wave { font-size:52px; margin-bottom:16px; }
  .success-wrap h2 { font-size:22px; margin-bottom:10px; }
  .success-wrap p { color:#7dd3fc; font-size:15px; margin-bottom:24px; max-width:400px; }
  .open-btn { display:inline-block; padding:14px 32px; background:linear-gradient(135deg,#0ea5e9,#0284c7);
    color:#fff; text-decoration:none; border-radius:14px; font-weight:700; font-size:16px; }

  .footer { padding:24px; text-align:center; font-size:11px; color:#1e293b; }

  /* WA */
  .wa-sep { display:flex; align-items:center; gap:10px; margin:16px 0 12px; color:#1e293b; font-size:11px; }
  .wa-sep::before,.wa-sep::after { content:""; flex:1; height:1px; background:rgba(255,255,255,0.04); }
  .btn-wa { width:100%; padding:13px; background:#25D366; color:#fff; border:none; border-radius:12px;
    font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; display:flex;
    align-items:center; justify-content:center; gap:8px; }
`;

// ── Per-segment demo content ──────────────────────────────────────────────────
const DEMO = {
  de_camper: {
    teaserQ: "Wo kann ich heute Nacht in der Nähe von Zadar legal übernachten?",
    teaserA: "Camp Zaton (15km nördlich, Vollservice, 28€/Nacht) oder kostenloser Stellplatz bei Nin — Wohnmobile bis 8m, direkt am Flachstrand. Für morgen früh: Bura-Warnung aktiv auf der Küstenstraße bei Maslenica — fahre vor 9 Uhr oder nach 16 Uhr.",
    chips: [
      "Legale Stellplätze in Split?",
      "Bura — wann ist es gefährlich?",
      "Tunnel mit Höhenbeschränkung?",
      "Günstige Entsorgungsstation Istrien?",
    ],
    gateTitle: "Deine vollständige Antwort wartet",
    gateSub: "E-Mail eingeben — wir schicken dir deinen kompletten Kroatien-Wohnmobilguide sofort:",
    gateCta: "Meinen Guide sichern →",
    mode: "camper", lang: "de",
  },
  de_family: {
    teaserQ: "Welche Strände in Kroatien sind am besten für kleine Kinder?",
    teaserA: "Saharun (Dugi Otok): weißer Sand, Wasser nur 30–50cm tief, kein Bootsverkehr — perfekt bis 6 Jahre. Brela (Makarska): flaches Kiesstrand, direkt vom Parkplatz. Lopar (Rab): 22 Sandstrände auf einer Insel, kinderfreundlichste Destination der Adria.",
    chips: ["Kinderfreundliche Restaurants Split?", "Sicherer Strand ohne Strömung?", "Wasserpark Kroatien?", "Anreise mit Kindern — Tipps?"],
    gateTitle: "Dein Familienguide wartet",
    gateSub: "E-Mail eingeben für deinen kompletten Kroatien-Familienplan:",
    gateCta: "Meinen Familienguide sichern →",
    mode: "apartment", lang: "de",
  },
  it_sailor: {
    teaserQ: "Dove posso ancorare stanotte vicino a Hvar senza pagare la marina?",
    teaserA: "Baia Vinogradišće (Hvar nord): fondo sabbioso, 5–8m, protetta da Bora e Maestrale. Baia Jagodna (Vis): più isolata, ideale per una notte tranquilla. Domani: NAVTEX segnala Bora 18–22kn da Zadar — niente di critico ma evita le rotte aperte.",
    chips: ["Marina ACI disponibile a Šibenik?", "Previsione Bora domani?", "Ristorante pesce fresco Vis?", "Rotta Split → Dubrovnik sicura?"],
    gateTitle: "La tua guida velistica ti aspetta",
    gateSub: "Inserisci la tua email per la guida completa all'Adriatico:",
    gateCta: "Ottieni la mia guida →",
    mode: "sailing", lang: "it",
  },
  en_cruiser: {
    teaserQ: "Where can I anchor tonight near Hvar without paying a marina?",
    teaserA: "Vinogradišće bay (north Hvar): sandy bottom, 5–8m depth, sheltered from Bora and Maestrale. Jagodna bay (Vis): more isolated, perfect for a quiet night. Tomorrow: NAVTEX shows Bora 18–22kn from Zadar — nothing critical but avoid exposed northerly routes.",
    chips: ["ACI marina availability Šibenik?", "Bura forecast tomorrow?", "Best anchorage Kornati?", "Split → Dubrovnik route safe?"],
    gateTitle: "Your sailing guide is waiting",
    gateSub: "Enter your email for your full Adriatic sailing guide:",
    gateCta: "Get my guide →",
    mode: "sailing", lang: "en",
  },
  en_camper: {
    teaserQ: "Where can I legally park my motorhome near Split tonight?",
    teaserA: "Camp Stobreč (4km east of Split, €22/night, full hookups, bus to centre every 20min). Free option: parking near Kaštel Štafilić — allowed for motorhomes up to 7.5m, no time limit. Warning: Split city centre tunnels max 2.8m — most GPS apps don't show this.",
    chips: ["Legal spots near Dubrovnik?", "Height limit Učka tunnel?", "Bura warning active now?", "Cheap dump station Istria?"],
    gateTitle: "Your full camper guide is waiting",
    gateSub: "Enter your email — we'll send your complete Croatia motorhome guide:",
    gateCta: "Get my guide →",
    mode: "camper", lang: "en",
  },
  en_couple: {
    teaserQ: "Which beach near Split is most secluded — away from the crowds?",
    teaserA: "Pakleni Islands (boat from Hvar, 10 min): Palmižana bay has a nude beach that clears out after 5pm. Stiniva cove (Vis): most beautiful beach in Croatia, arrive before 8am. Žukovac (Brač, south side): no road access, zero tourists, 45min walk from Bol.",
    chips: ["Best sunset dinner Split?", "Hidden beach Dubrovnik?", "Romantic spot Hvar?", "Local wine region Pelješac?"],
    gateTitle: "Your secret Croatia guide is waiting",
    gateSub: "Enter your email for your complete hidden-spots guide:",
    gateCta: "Get my guide →",
    mode: "apartment", lang: "en",
  },
};

const PROOF = {
  de_camper: [
    { q: "\"Hat uns vor €200 Bußgeld gerettet — Stellplatz den Google Maps nicht kennt.\"", name: "Klaus & Renate, Wohnmobil Istrien→Dubrovnik" },
    { q: "\"Tunnel-Warnung 10 Minuten bevor wir reingefahren wären. Fahrzeug passte nicht durch.\"", name: "Thomas H., Bayern → Dalmatien" },
  ],
  de_family: [
    { q: "\"Meine Kinder haben mitgeplant statt zu quengeln. Der beste Urlaub seit Jahren.\"", name: "Familie Weber, Split–Hvar–Brač" },
    { q: "\"Hat uns den einzigen kinderfreundlichen Strand ohne Strömung in der Gegend gezeigt.\"", name: "Sandra M., Wien" },
  ],
  it_sailor: [
    { q: "\"Tre baie che non esistono su nessuna app. Incredibile per chi naviga in Croazia.\"", name: "Marco, Ancona → Spalato" },
    { q: "\"Bora warning 2 ore prima. Abbiamo aspettato a Šibenik. La barca prima era okay.\"", name: "Giulia & Luca, Costa Dalmata" },
  ],
  en_cruiser: [
    { q: "\"Found three anchorages that aren't on any chart app. Best tool for Croatian waters.\"", name: "James, sailing Ancona to Dubrovnik" },
    { q: "\"Bura warning 2 hours before it hit. Stayed in Šibenik. Boat was fine.\"", name: "Sarah & Tom, Hanse 458" },
  ],
  en_camper: [
    { q: "\"Saved us from a €200 fine — found a legal spot Google Maps doesn't even show.\"", name: "Dave & Sarah, motorhome Split to Istria" },
    { q: "\"Height warning 10 minutes before the tunnel. Our van wouldn't have made it through.\"", name: "Mike, Lancashire → Dalmatia" },
  ],
  en_couple: [
    { q: "\"We had the beach completely to ourselves for two hours. No travel blog mentioned it.\"", name: "Sophie & Tom, island-hopping from Split" },
    { q: "\"The restaurant recommendation was so good the owner came out to talk to us.\"", name: "Anna & Felix, honeymoon Croatia" },
  ],
};

const WA_NUMBER = "381695561699";
const WA_MESSAGES = {
  de_camper:  "Hallo, ich interessiere mich für den Wohnmobil-Guide für Kroatien 🚐",
  de_family:  "Hallo, ich interessiere mich für den Familien-Guide für Kroatien 🏖️",
  it_sailor:  "Ciao, sono interessato alla guida vela per la Croazia ⛵",
  en_cruiser: "Hi, I'm interested in the Croatia sailing guide ⚓",
  en_camper:  "Hi, I'm interested in the Croatia camper guide 🚐",
  en_couple:  "Hi, I'm interested in the Croatia couples guide 🌊",
};

const LABELS = {
  de: { namePh: "Vorname (optional)", emailPh: "E-Mail-Adresse", trust: "Kein Spam · Jederzeit abmeldbar", or: "oder", wa: "Per WhatsApp fragen" },
  it: { namePh: "Nome (opzionale)", emailPh: "Indirizzo email", trust: "Niente spam · Disiscrizione sempre possibile", or: "o", wa: "Chatta su WhatsApp" },
  en: { namePh: "First name (optional)", emailPh: "Email address", trust: "No spam · Unsubscribe anytime", or: "or", wa: "Ask via WhatsApp" },
};

function getVid() {
  const KEY = "jadran_vid";
  let vid = localStorage.getItem(KEY);
  if (!vid) { const m = document.cookie.match(/(?:^|;\s*)jadran_vid=([^;]+)/); vid = m ? m[1] : null; }
  if (!vid) {
    vid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(KEY, vid);
    const exp = new Date(Date.now() + 30*86400000).toUTCString();
    document.cookie = `jadran_vid=${vid}; expires=${exp}; path=/; SameSite=Lax`;
    return { vid, returning: false };
  }
  return { vid, returning: true };
}

export default function SegmentLandingPage({ slug }) {
  const seg = SEGMENTS[slug];
  const demo = DEMO[slug] || DEMO.en_camper;
  const proof = PROOF[slug] || PROOF.en_camper;
  const labels = LABELS[seg?.lang] || LABELS.en;

  const [variantId, setVariantId] = useState("default");
  const [vid, setVid] = useState("");
  const [returning, setReturning] = useState(false);

  // Chat state
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const chatBoxRef = useRef(null);

  // Email form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!seg) return;
    const v = new URLSearchParams(window.location.search).get("v") || "default";
    setVariantId(v);
    const { vid: visitorId, returning: isReturning } = getVid();
    setVid(visitorId);
    setReturning(isReturning);
    fetch("/api/ab-impression", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId: v, segmentId: slug, source: document.referrer || "direct" }),
    }).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [msgs, loading]);

  if (!seg) return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"#050d1a", color:"#f0f9ff", fontFamily:"system-ui" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🌊</div>
        <p>Page not found</p>
        <a href="/" style={{ color:"#0ea5e9", marginTop:16, display:"block" }}>Go home</a>
      </div>
    </div>
  );

  async function askAI(question) {
    if (loading) return;
    // After 1st real question, show email gate (but still send the question)
    const isFirstQ = msgs.length === 0;

    const uMsg = { role: "user", content: question };
    setMsgs(p => [...p, uMsg]);
    setInput("");
    setLoading(true);

    // If gate not unlocked, store question and show gate after response
    if (!gateUnlocked && !isFirstQ) {
      setShowGate(true);
      setPendingQuestion(question);
      setLoading(false);
      return;
    }

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({
          mode: demo.mode, plan: "free", lang: demo.lang, region: "all",
          messages: [...msgs, uMsg].slice(-4),
        }),
      });
      clearTimeout(t);
      const d = await r.json();
      const reply = d.content?.[0]?.text || d.reply || d.text || (seg.lang === "de" ? "Keine Antwort — bitte nochmal versuchen." : seg.lang === "it" ? "Nessuna risposta — riprova." : "No response — please try again.");
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
      // Show gate after first AI response
      if (isFirstQ && !gateUnlocked) setShowGate(true);
    } catch {
      const err = seg.lang === "de" ? "Keine Antwort — bitte nochmal versuchen." : seg.lang === "it" ? "Nessuna risposta — riprova." : "No response — please try again.";
      setMsgs(p => [...p, { role: "assistant", content: err }]);
      if (isFirstQ && !gateUnlocked) setShowGate(true);
    }
    setLoading(false);
  }

  async function handleGate(e) {
    e.preventDefault();
    if (!email) return;
    setFormLoading(true);
    setFormError("");
    try {
      const r = await fetch("/api/lead-capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, segmentId: slug, variantId, source: "landing", vid, returning,
          fingerprint: { ua: navigator.userAgent, lang: navigator.language, tz: Intl.DateTimeFormat().resolvedOptions().timeZone } }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "error");
      fetch("/api/ab-convert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, segmentId: slug }),
      }).catch(() => {});
      setGateUnlocked(true);
      setShowGate(false);
      // If there's a pending question, answer it now
      if (pendingQuestion) {
        const q = pendingQuestion;
        setPendingQuestion("");
        await askAI(q);
      }
    } catch (err) {
      setFormError(err.message === "invalid email" ? (seg.lang === "de" ? "Bitte gültige E-Mail eingeben." : "Please enter a valid email.") : (seg.lang === "de" ? "Fehler — bitte nochmal versuchen." : "Error — please try again."));
    }
    setFormLoading(false);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    if (!email || done) return;
    setFormLoading(true); setFormError("");
    try {
      const r = await fetch("/api/lead-capture", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, segmentId: slug, variantId, source: "landing_bottom", vid, returning,
          fingerprint: { ua: navigator.userAgent, lang: navigator.language, tz: Intl.DateTimeFormat().resolvedOptions().timeZone } }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "error");
      fetch("/api/ab-convert", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ variantId, segmentId: slug }) }).catch(()=>{});
      setDone(true);
    } catch (err) {
      setFormError(seg.lang === "de" ? "Fehler — bitte nochmal versuchen." : "Error — please try again.");
    }
    setFormLoading(false);
  }

  const waMsg = encodeURIComponent(WA_MESSAGES[slug] || "Hi, I'm interested in JADRAN.AI 🌊");

  return (
    <>
      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="logo">JADRAN.AI</div>
        <h1 className="hook">{seg.headline}</h1>
        <p className="sub">{seg.subheadline}</p>
        <p className="social-proof">
          <span>412 </span>
          {seg.lang === "de" ? "Reisende nutzen Jadran.ai diese Saison" : seg.lang === "it" ? "viaggiatori usano Jadran.ai questa stagione" : "travellers using Jadran.ai this season"}
        </p>
      </div>

      {/* ── DEMO CHAT ── */}
      <div className="demo-wrap" style={{ padding:"0 16px 40px" }}>
        <p className="demo-label">
          {seg.lang === "de" ? "TESTE ES JETZT — KOSTENLOS" : seg.lang === "it" ? "PROVALO ADESSO — GRATIS" : "TRY IT NOW — FREE"}
        </p>
        <div className="chat-box">
          {/* Teaser — pre-loaded conversation */}
          <div className="teaser-msgs">
            <div className="tmsg user"><div className="bubble">{demo.teaserQ}</div></div>
            <div className="tmsg ai">
              <div style={{ flex:1 }}>
                <div className="ai-badge">JADRAN.AI</div>
                <div className="bubble">{demo.teaserA}</div>
              </div>
            </div>
          </div>

          {/* Live messages */}
          {msgs.length > 0 && (
            <div ref={chatBoxRef} className={`live-msgs ${msgs.length > 0 ? "has-msgs" : ""}`} style={{ maxHeight:300, overflowY:"auto" }}>
              {msgs.map((m, i) => (
                <div key={i} className={`lmsg ${m.role === "user" ? "user" : "ai"}`}>
                  <div className="bubble">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="lmsg ai">
                  <div className="bubble" style={{ display:"flex", gap:5, alignItems:"center" }}>
                    {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#38bdf8", display:"inline-block", animation:`blink 1.4s ease ${i*0.22}s infinite` }}/>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email gate — shown after first response */}
          {showGate && !gateUnlocked && (
            <div className="gate">
              <div className="gate-title">{demo.gateTitle}</div>
              <div className="gate-sub">{demo.gateSub}</div>
              <form onSubmit={handleGate}>
                <input type="text" placeholder={labels.namePh} value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" />
                <input type="email" placeholder={labels.emailPh} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                {formError && <p style={{ color:"#f87171", fontSize:13, marginBottom:8 }}>{formError}</p>}
                <button type="submit" className="gate-btn" disabled={formLoading}>{formLoading ? "..." : demo.gateCta}</button>
                <p className="gate-trust">{labels.trust}</p>
              </form>
              <div className="wa-sep">{labels.or}</div>
              <button className="btn-wa" onClick={() => window.open(`https://wa.me/${WA_NUMBER}?text=${waMsg}`, "_blank")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {labels.wa}
              </button>
            </div>
          )}

          {/* Question chips — shown before gate or after unlock */}
          {(!showGate || gateUnlocked) && !loading && (
            <div className="chips">
              {demo.chips.map((c, i) => (
                <button key={i} className="chip" disabled={loading} onClick={() => askAI(c)}>{c}</button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="input-row">
            <input className="chat-input"
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), input.trim() && askAI(input))}
              placeholder={seg.lang === "de" ? "Eigene Frage stellen…" : seg.lang === "it" ? "Fai una domanda…" : "Ask your own question…"}
              disabled={loading || (showGate && !gateUnlocked)}
            />
            <button className={`send-btn ${input.trim() && !loading && (!showGate || gateUnlocked) ? "active" : "inactive"}`}
              onClick={() => input.trim() && askAI(input)}
              disabled={!input.trim() || loading || (showGate && !gateUnlocked)}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── SOCIAL PROOF ── */}
      <div className="section">
        <p className="section-label">
          {seg.lang === "de" ? "WAS ANDERE SAGEN" : seg.lang === "it" ? "COSA DICONO GLI ALTRI" : "WHAT OTHERS SAY"}
        </p>
        <div className="proof-grid">
          {proof.map((p, i) => (
            <div key={i} className="proof-card">
              <blockquote>{p.q}</blockquote>
              <cite>— {p.name}</cite>
            </div>
          ))}
        </div>
      </div>

      {/* ── BENEFITS ── */}
      <div className="section" style={{ paddingTop:0 }}>
        <p className="section-label">
          {seg.lang === "de" ? "WAS DU BEKOMMST" : seg.lang === "it" ? "COSA OTTIENI" : "WHAT YOU GET"}
        </p>
        <div className="ben-list">
          {(DEMO[slug] ? [
            slug.startsWith("de_camper") || slug === "en_camper" ? { icon:"🅿️", title: seg.lang==="de"?"Legale Stellplätze":"Legal camper spots", desc: seg.lang==="de"?"Alle genehmigten Stellplätze entlang der Adria — kein Bußgeldrisiko.":"All approved spots along the Adriatic — no fine risk." } : { icon:"⚓", title:"Marina availability", desc:"Real-time ACI marina berth info and pricing." },
            slug.startsWith("de_camper") || slug === "en_camper" ? { icon:"📏", title: seg.lang==="de"?"Höhenbeschränkungen":"Height restrictions", desc: seg.lang==="de"?"Tunnel und Brücken mit Limits — bevor es zu spät ist.":"Tunnels and bridges with limits — before it's too late." } : { icon:"🌊", title:"Hidden anchorages", desc:"Quiet bays away from the charter flotillas." },
            { icon:"🌬️", title: seg.lang==="de"?"Bora-Warnungen":seg.lang==="it"?"Avvisi Bora":"Bura wind warnings", desc: seg.lang==="de"?"KI warnt dich vor gefährlichen Böen — automatisch.":seg.lang==="it"?"Avvisi automatici prima che la Bora colpisca.":"AI alerts before dangerous gusts hit coastal roads." },
          ] : []).map((b, i) => (
            <div key={i} className="ben">
              <span className="ben-icon">{b.icon}</span>
              <div className="ben-text"><strong>{b.title}</strong><span>{b.desc}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA (for users who scrolled past gate) ── */}
      {!done && !gateUnlocked && (
        <div className="final-cta">
          <form onSubmit={handleFinalSubmit}>
            <input type="text" placeholder={labels.namePh} value={name} onChange={e => setName(e.target.value)}
              style={{ width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:12, color:"#f0f9ff", fontSize:15, marginBottom:10, outline:"none", fontFamily:"inherit" }} />
            <input type="email" placeholder={labels.emailPh} value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(14,165,233,0.18)", borderRadius:12, color:"#f0f9ff", fontSize:15, marginBottom:10, outline:"none", fontFamily:"inherit" }} />
            {formError && <p style={{ color:"#f87171", fontSize:13, marginBottom:8 }}>{formError}</p>}
            <button type="submit" disabled={formLoading}
              style={{ width:"100%", padding:"15px", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {formLoading ? "..." : demo.gateCta}
            </button>
            <p style={{ fontSize:11, color:"#334155", marginTop:8, textAlign:"center" }}>{labels.trust}</p>
          </form>
        </div>
      )}

      {done && (
        <div className="success-wrap">
          <div className="wave">🌊</div>
          <h2>{seg.lang === "de" ? "Guide unterwegs!" : seg.lang === "it" ? "Guida in arrivo!" : "Guide on its way!"}</h2>
          <p>{seg.lang === "de" ? `Wir haben deinen Guide an ${email} geschickt.` : seg.lang === "it" ? `Abbiamo inviato la tua guida a ${email}.` : `We sent your guide to ${email}.`}</p>
          <a href={`/ai?niche=${seg.niche}&lang=${seg.lang_param}`} className="open-btn">
            {seg.lang === "de" ? "JADRAN.AI öffnen →" : seg.lang === "it" ? "Apri JADRAN.AI →" : "Open JADRAN.AI →"}
          </a>
        </div>
      )}

      <footer className="footer">
        <a href="/privacy" style={{ color:"#1e293b", textDecoration:"none" }}>Privacy</a>
        {" · "}JADRAN.AI · SIAL Consulting d.o.o.
      </footer>
    </>
  );
}
