// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Standalone AI Assistant
// Route: jadran.ai/ai
// Pay 5.99€ → travel guide without apartment context
// Perfect for: campervan travelers, day-trippers, cruise visitors
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";

const REGIONS = [
  { id: "split", name: "Split & okolica", emoji: "🏛️", desc: "Dioklecijanova palača, Podstrana, Omiš" },
  { id: "makarska", name: "Makarska rivijera", emoji: "🏖️", desc: "Brela, Baška Voda, Tučepi" },
  { id: "dubrovnik", name: "Dubrovnik", emoji: "🏰", desc: "Stari grad, Elafiti, Cavtat" },
  { id: "zadar", name: "Zadar & Šibenik", emoji: "🌅", desc: "Morske orgulje, Krka, Kornati" },
  { id: "istra", name: "Istra", emoji: "🫒", desc: "Rovinj, Pula, Poreč, Motovun" },
  { id: "kvarner", name: "Kvarner", emoji: "⚓", desc: "Opatija, Krk, Cres, Lošinj" },
];

const TRAVEL_MODES = [
  { id: "apartment", emoji: "🏠", name: "Apartman/Hotel", desc: "Fiksni smještaj" },
  { id: "camper", emoji: "🚐", name: "Kamper / Autodom", desc: "Sloboda na kotačima" },
  { id: "sailing", emoji: "⛵", name: "Jedrilica / Brod", desc: "Nautički turizam" },
  { id: "daytrip", emoji: "🚗", name: "Dnevni izlet", desc: "Prolazim kroz" },
  { id: "cruise", emoji: "🚢", name: "Krstarenje", desc: "Kratko zaustavljanje" },
];

const LANGS = [
  { code: "hr", flag: "🇭🇷" }, { code: "de", flag: "🇩🇪" }, { code: "at", flag: "🇦🇹" },
  { code: "en", flag: "🇬🇧" }, { code: "it", flag: "🇮🇹" }, { code: "si", flag: "🇸🇮" },
  { code: "cz", flag: "🇨🇿" }, { code: "pl", flag: "🇵🇱" },
];

const T = {
  hr: { title: "Jadran Vodič", sub: "Lokalni savjeti za savršen odmor", start: "Započni razgovor", send: "Pošalji", placeholder: "Pitajte me o Jadranu...", region: "Gdje ste?", mode: "Kako putujete?", unlock: "Otključaj vodič — 5.99€", free3: "3 besplatna pitanja", remaining: "preostalo", upgraded: "Premium otključan!", back: "← Natrag", typing: "razmišljam..." },
  en: { title: "Jadran Guide", sub: "Local tips for the perfect Adriatic trip", start: "Start chatting", send: "Send", placeholder: "Ask me about the Adriatic...", region: "Where are you?", mode: "How are you traveling?", unlock: "Unlock guide — 5.99€", free3: "3 free questions", remaining: "remaining", upgraded: "Premium unlocked!", back: "← Back", typing: "thinking..." },
  de: { title: "Jadran Reiseführer", sub: "Lokale Tipps für den perfekten Adria-Urlaub", start: "Gespräch starten", send: "Senden", placeholder: "Fragen Sie mich über die Adria...", region: "Wo sind Sie?", mode: "Wie reisen Sie?", unlock: "Freischalten — 5.99€", free3: "3 kostenlose Fragen", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "← Zurück", typing: "denke nach..." },
  it: { title: "Guida Jadran", sub: "Consigli locali per la vacanza perfetta", start: "Inizia a chattare", send: "Invia", placeholder: "Chiedimi dell'Adriatico...", region: "Dove siete?", mode: "Come viaggiate?", unlock: "Sblocca guida — 5.99€", free3: "3 domande gratuite", remaining: "rimanenti", upgraded: "Premium sbloccato!", back: "← Indietro", typing: "penso..." },
  at: { title: "Jadran Reiseführer", sub: "Lokale Tipps für den perfekten Adria-Urlaub", start: "Gespräch starten", send: "Senden", placeholder: "Fragen Sie mich über die Adria...", region: "Wo sind Sie?", mode: "Wie reisen Sie?", unlock: "Freischalten — 5.99€", free3: "3 kostenlose Fragen", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "← Zurück", typing: "denke nach..." },
  si: { title: "Jadran vodič", sub: "Lokalni nasveti za popoln Jadran", start: "Začni pogovor", send: "Pošlji", placeholder: "Vprašajte me o Jadranu...", region: "Kje ste?", mode: "Kako potujete?", unlock: "Odkleni vodič — 5.99€", free3: "3 brezplačna vprašanja", remaining: "preostalo", upgraded: "Premium odklenjen!", back: "← Nazaj", typing: "razmišljam..." },
  cz: { title: "Jadran průvodce", sub: "Místní tipy pro perfektní Jadran", start: "Začít konverzaci", send: "Odeslat", placeholder: "Zeptejte se na Jadran...", region: "Kde jste?", mode: "Jak cestujete?", unlock: "Odemknout průvodce — 5.99€", free3: "3 otázky zdarma", remaining: "zbývá", upgraded: "Premium odemčen!", back: "← Zpět", typing: "přemýšlím..." },
  pl: { title: "Jadran przewodnik", sub: "Lokalne wskazówki na Adriatyk", start: "Zacznij rozmowę", send: "Wyślij", placeholder: "Zapytaj o Adriatyk...", region: "Gdzie jesteś?", mode: "Jak podróżujesz?", unlock: "Odblokuj przewodnik — 5.99€", free3: "3 pytania za darmo", remaining: "pozostało", upgraded: "Premium odblokowany!", back: "← Wstecz", typing: "myślę..." },
};

export default function StandaloneAI() {
  const [step, setStep] = useState("setup"); // setup | chat
  const [lang, setLang] = useState("hr");
  const [region, setRegion] = useState(null);
  const [travelMode, setTravelMode] = useState(null);
  const [premium, setPremium] = useState(false);
  const [freeLeft, setFreeLeft] = useState(3);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Chat
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  // Fetch live weather
  useEffect(() => {
    fetch("/api/weather").then(r => r.json()).then(d => {
      if (d.current?.temp) setWeather(d.current);
    }).catch(() => {});
  }, []);

  // Check premium from URL (after Stripe redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("premium") === "true") {
      setPremium(true);
      try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
      window.history.replaceState({}, "", "/ai");
    }
    // Check localStorage
    try { if (localStorage.getItem("jadran_ai_premium") === "1") setPremium(true); } catch {}
    // Also check ?payment=success from Stripe redirect
    if (params.get("payment") === "success") {
      setPremium(true);
      try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
      window.history.replaceState({}, "", "/ai");
    }
  }, []);

  const t = T[lang] || T.en;

  // ─── STRIPE CHECKOUT ───
  const startCheckout = async () => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: "AI-STANDALONE", guestName: "AI User", lang, returnPath: "/ai" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
    setPayLoading(false);
  };

  // ─── AI CHAT ───
  const sendMsg = async () => {
    if (!input.trim() || loading) return;
    if (!premium && freeLeft <= 0) { setShowPaywall(true); return; }

    const msg = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text: msg }]);
    setLoading(true);
    if (!premium) setFreeLeft(f => f - 1);

    const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";
    const modeName = TRAVEL_MODES.find(m => m.id === travelMode)?.name || "";
    const isCamper = travelMode === "camper";
    const isSailing = travelMode === "sailing";
    const wxCtx = weather ? `TRENUTNO VRIJEME: ${weather.temp}°C ${weather.icon}, UV ${weather.uv}, vjetar ${weather.wind}, more ${weather.sea}°C, zalazak ${weather.sunset}.` : "";

    const sys = `Ti si lokalni turistički vodič za hrvatsku obalu Jadrana.
KONTEKST: Gost je u regiji ${regionName}. Putuje kao: ${modeName}. ${wxCtx}
JEZIK: ${lang === "de" || lang === "at" ? "Deutsch" : lang === "en" ? "English" : lang === "it" ? "Italiano" : lang === "si" ? "Slovenščina" : lang === "cz" ? "Čeština" : lang === "pl" ? "Polski" : "Hrvatski"}.
${isCamper ? `KAMPER SPECIFIČNO: Ovaj gost putuje kamperom/autodomom. Uvijek uključi:
- Legalna mjesta za parkiranje i noćenje (kampiralište, autocamp, legalni parking)
- Najbliže pumpe za vodu i dump station
- Plaže pristupačne kamperima (širok prilaz, parking za veća vozila)
- Cijene parkinga za kampere (obično 15-40€/noć ovisno o lokaciji)
- Upozorenja o zabranama divljeg kampiranja (kazne 130-400€)
- Preporuči aplikacije: park4night, Campercontact, CamperStop
- Benzinske postaje s LPG-om ako su u blizini` : ""}
${isSailing ? `NAUTIČKI TURIZAM: Gost putuje jedricom/brodom. Uključi:
- Marine i sidrišta s cijenama veza
- Meteo upozorenja (bura, jugo, maestral) 
- Opskrba vodom i gorivom u marinama
- Najbolja sidrišta zaštićena od vjetra
- Konobe i restorani dostupni s mora` : ""}
PRAVILA: Kratko (4-6 rečenica), toplo, konkretno s cijenama i udaljenostima. Koristi emoji. Lokalni insider savjeti — ne generički turistički info.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: sys,
          messages: [...msgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }],
        }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: "assistant", text: data.content?.map(c => c.text || "").join("") || "..." }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Veza nije dostupna. Pokušajte ponovno. 🌊" }]);
    }
    setLoading(false);
  };

  const C = {
    bg: "#0a1628", accent: "#0ea5e9", gold: "#f59e0b", text: "#f0f9ff",
    mut: "#7dd3fc", bord: "rgba(14,165,233,0.08)", card: "rgba(12,28,50,0.7)",
  };

  // ═══ PAYWALL MODAL ═══
  const Paywall = () => showPaywall && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }}
      onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "rgba(12,28,50,0.95)", borderRadius: 24, padding: 36, maxWidth: 400, width: "100%", textAlign: "center", border: "1px solid rgba(245,158,11,0.1)" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
        <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 26, marginBottom: 8 }}>Premium AI</div>
        <div style={{ fontSize: 40, fontWeight: 300, color: C.gold, marginBottom: 8 }}>5.99€</div>
        <div style={{ fontSize: 13, color: C.mut, marginBottom: 24, lineHeight: 1.6 }}>
          Neograničena pitanja, lokalni savjeti, personalizirane preporuke{travelMode === "camper" ? ", kamper parking & voda" : ""}.
        </div>
        <button onClick={startCheckout} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(14,165,233,0.25)" }}>
          {payLoading ? "⏳..." : t.unlock}
        </button>
        <button onClick={() => setShowPaywall(false)} style={{ marginTop: 12, background: "none", border: "none", color: C.mut, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Možda kasnije</button>
      </div>
    </div>
  );

  // ═══ CAMPER-SPECIFIC QUICK QUESTIONS ═══
  const camperQuick = travelMode === "camper" ? [
    "🅿️ Gdje mogu legalno parkirati kamper?",
    "💧 Najbliža pumpa za vodu?",
    "🚿 Dump station u blizini?",
    "🏖️ Plaže pristupačne kamperima?",
    "⛽ Cijene goriva na ruti?",
    "🌙 Preporuka za noćenje?",
  ] : travelMode === "sailing" ? [
    "⚓ Najbolja marina u blizini?",
    "🌬️ Kakav je vjetar danas?",
    "🍽️ Konoba dostupna s mora?",
    "⛽ Gdje napuniti gorivo?",
    "🏝️ Zaštićeno sidrište?",
    "🌊 Stanje mora i prognoze?",
  ] : [];

  const defaultQuick = [
    "🏖️ Najbolja plaža u blizini?",
    "🍽️ Lokalna konoba za večeru?",
    "🗺️ Što posjetiti danas?",
    "☀️ Kakvo je vrijeme?",
  ];

  const quickQs = [...camperQuick.slice(0, 3), ...defaultQuick.slice(0, camperQuick.length ? 1 : 4)];

  // ═══ SETUP SCREEN ═══
  if (step === "setup") return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.bg}, #0e3a5c 50%, #134e6f)`, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <a href="/" style={{ color: C.mut, fontSize: 13, textDecoration: "none" }}>{t.back}</a>
          <div style={{ display: "flex", gap: 2, background: "rgba(12,28,50,0.5)", borderRadius: 12, padding: 3 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                style={{ padding: "4px 6px", background: lang === l.code ? "rgba(14,165,233,0.12)" : "transparent", border: lang === l.code ? "1px solid rgba(14,165,233,0.15)" : "1px solid transparent", borderRadius: 9, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                {l.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌊</div>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 32, marginBottom: 6 }}>{t.title}</div>
          <div style={{ fontSize: 14, color: C.mut }}>{t.sub}</div>
        </div>

        {/* Travel mode */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: C.mut, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{t.mode}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {TRAVEL_MODES.map(m => (
              <div key={m.id} onClick={() => setTravelMode(m.id)} style={{
                padding: "16px 12px", borderRadius: 16, textAlign: "center", cursor: "pointer",
                background: travelMode === m.id ? "rgba(14,165,233,0.12)" : C.card,
                border: `1px solid ${travelMode === m.id ? "#0ea5e9" : C.bord}`,
                transition: "all 0.2s", transform: travelMode === m.id ? "scale(1.03)" : "scale(1)",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{m.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: C.mut, marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Region */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, color: C.mut, letterSpacing: 3, marginBottom: 12, fontWeight: 500 }}>{t.region}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {REGIONS.map(r => (
              <div key={r.id} onClick={() => setRegion(r.id)} style={{
                padding: "14px 16px", borderRadius: 16, cursor: "pointer",
                background: region === r.id ? "rgba(14,165,233,0.12)" : C.card,
                border: `1px solid ${region === r.id ? "#0ea5e9" : C.bord}`,
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 24 }}>{r.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: C.mut }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start */}
        <button onClick={() => { if (region && travelMode) setStep("chat"); }}
          disabled={!region || !travelMode}
          style={{
            width: "100%", padding: "18px", borderRadius: 18, border: "none",
            background: region && travelMode ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.06)",
            color: "#fff", fontSize: 17, fontWeight: 600, cursor: region && travelMode ? "pointer" : "not-allowed",
            opacity: region && travelMode ? 1 : 0.4,
            fontFamily: "'DM Serif Display',Georgia,serif",
            boxShadow: region && travelMode ? "0 6px 24px rgba(14,165,233,0.25)" : "none",
          }}>
          {t.start} →
        </button>

        {/* Free tier note */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          {t.free3} · Premium {t.unlock.split("—")[1]}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::selection { background: rgba(14,165,233,0.3); }`}</style>
    </div>
  );

  // ═══ CHAT SCREEN ═══
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: `linear-gradient(160deg, ${C.bg}, #0e3a5c)`, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.bord}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStep("setup")} style={{ background: "none", border: "none", color: C.mut, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{t.back}</button>
          <div style={{ width: 1, height: 20, background: C.bord }} />
          <span style={{ fontSize: 18 }}>{TRAVEL_MODES.find(m => m.id === travelMode)?.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{REGIONS.find(r => r.id === region)?.name}</span>
          {weather && <span style={{ fontSize: 12, color: C.mut, marginLeft: 4 }}>{weather.icon} {weather.temp}° · 🌊 {weather.sea}°</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {premium
            ? <span style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: C.gold, fontSize: 10, fontWeight: 600 }}>⭐ PREMIUM</span>
            : <button onClick={() => setShowPaywall(true)} style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: C.gold, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {freeLeft > 0 ? `${freeLeft}/3 ${t.remaining}` : t.unlock}
              </button>
          }
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 && (
          <div style={{ padding: 0 }}>
            {/* ═══ VIBE JADRANA — SHOWROOM ═══ */}

            {/* Ambient Adriatic Scene */}
            <div style={{ position: "relative", minHeight: 280, overflow: "hidden", background: "linear-gradient(180deg, #0f2b3d 0%, #0c4a6e 30%, #0ea5e9 65%, #38bdf8 80%, #7dd3fc 100%)" }}>
              {/* Sun/Moon */}
              <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle, #fbbf24 30%, rgba(251,191,36,0.3) 60%, transparent 100%)", boxShadow: "0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(251,191,36,0.15)", animation: "sunGlow 4s ease-in-out infinite" }} />
              {/* Horizon glow */}
              <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: 80, background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(251,191,36,0.15), transparent)", pointerEvents: "none" }} />
              {/* Animated sea */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%" }}>
                <svg width="100%" height="100%" viewBox="0 0 400 80" preserveAspectRatio="none" style={{ position: "absolute", top: 0 }}>
                  <path fill="rgba(14,165,233,0.4)" style={{ animation: "seaV1 6s ease-in-out infinite" }} d="M0,20 C60,10 120,30 180,18 C240,6 300,28 360,15 C380,12 400,20 400,20 L400,80 L0,80 Z" />
                  <path fill="rgba(8,145,210,0.5)" style={{ animation: "seaV2 8s ease-in-out infinite" }} d="M0,30 C50,22 100,35 160,25 C220,15 280,32 340,22 C370,18 400,28 400,28 L400,80 L0,80 Z" />
                  <path fill="rgba(12,74,110,0.7)" style={{ animation: "seaV1 5s ease-in-out infinite reverse" }} d="M0,38 C80,30 140,42 200,34 C260,26 320,40 400,34 L400,80 L0,80 Z" />
                </svg>
              </div>
              {/* Live weather overlay */}
              {weather && <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6, padding: "0 12px", flexWrap: "wrap" }}>
                {[
                  { v: `${weather.temp}°`, l: "ZRAK", bg: "rgba(240,249,255,0.12)" },
                  { v: `${weather.sea}°`, l: "MORE", bg: "rgba(14,165,233,0.2)" },
                  { v: `UV ${weather.uv}`, l: weather.uv >= 8 ? "VISOK" : weather.uv >= 5 ? "UMJEREN" : "NIZAK", bg: weather.uv >= 8 ? "rgba(248,113,113,0.15)" : "rgba(240,249,255,0.1)" },
                  { v: `🌅 ${weather.sunset}`, l: "ZALAZAK", bg: "rgba(251,191,36,0.12)" },
                ].map((d, i) => (
                  <div key={i} style={{ padding: "8px 14px", borderRadius: 12, background: d.bg, backdropFilter: "blur(12px)", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: "#f0f9ff", lineHeight: 1 }}>{d.v}</div>
                    <div style={{ fontSize: 8, color: "rgba(240,249,255,0.5)", letterSpacing: 2, marginTop: 3 }}>{d.l}</div>
                  </div>
                ))}
              </div>}
              {/* VIBE label */}
              <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", fontSize: 9, letterSpacing: 6, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>JADRAN · LIVE</div>
            </div>

            {/* Floating conversation previews — shows what the AI can do */}
            <div style={{ padding: "20px 16px 8px", position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 10, color: C.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 14, textAlign: "center" }}>POGLEDAJTE ŠTO SVE ZNAM</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(travelMode === "camper" ? [
                  { q: "Gdje mogu parkirati kamper u Splitu?", a: "🅿️ Autocamp Stobreč, 3km — 25€/noć, struja + voda uključeni. Ili slobodni parking Žnjan, besplatno ali bez servisa. Za dump station: INA pumpa Dugopolje, 15km." },
                  { q: "Ima li LPG stanica na putu za Dubrovnik?", a: "⛽ INA Ploče (km 87) ima LPG, 0.72€/L. Sljedeća je tek u Dubrovniku — napunite se u Pločama! Usput preporučam stanku u Stonu — najbolje kamenice na Jadranu, 1€/kom 🦪" },
                ] : travelMode === "sailing" ? [
                  { q: "Najbolja marina blizu Splita?", a: "⚓ ACI Marina Split — 3.5€/m ljeti, odlična zaštita od juga. Za mir: ACI Milna na Braču, 30min sail, upola jeftinije + konoba Palma na rivi 🍷" },
                  { q: "Kakav je vjetar sutra?", a: "🌬️ Maestral 12-15 čv popodne, idealno za Brač. Bura slabi ujutro. Izbjegavajte Hvarski kanal ako puše > 20 čv — bolje zaobići preko Šolte." },
                ] : [
                  { q: "Skrivena plaža blizu Splita?", a: "🏖️ Kašjuni pod Marjanom — lokalci je čuvaju za sebe! Parking 5€, dođite prije 10h. Voda kristalna, borova šuma za hlad. Za djecu bolje Bačvice — pijesak! 🐚" },
                  { q: "Gdje večerati s pogledom?", a: "🍽️ Konoba Matoni, Podstrana — terasa nad morem, pašticada 14€, svježa riba po kg. Rezervirajte dan ranije! Alternativa: Dvor u Omišu, ušće Cetine 🌊" },
                ]).map((conv, i) => (
                  <div key={i} style={{ animation: `fadeSlide 0.6s ${0.3 + i * 0.2}s both` }}>
                    {/* User question */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.08))", border: "1px solid rgba(14,165,233,0.15)", fontSize: 13, color: "#bae6fd", maxWidth: "75%" }}>{conv.q}</div>
                    </div>
                    {/* AI answer */}
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.card, border: `1px solid ${C.bord}`, fontSize: 13, color: "rgba(240,249,255,0.85)", maxWidth: "85%", lineHeight: 1.6 }}>{conv.a}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick questions — CTA */}
            <div style={{ padding: "16px 16px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.gold, letterSpacing: 3, fontWeight: 600, marginBottom: 12 }}>VAŠA PITANJA</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {quickQs.map(q => (
                  <button key={q} onClick={() => { setInput(q); }}
                    style={{ padding: "10px 16px", borderRadius: 14, border: `1px solid ${C.bord}`, background: C.card, color: C.mut, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.25s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)"; e.currentTarget.style.background = "rgba(14,165,233,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.background = C.card; }}>
                    {q}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 14 }}>3 besplatna pitanja · Premium 5.99€</div>
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))" : C.card,
              border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.2)" : C.bord}`,
              fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ padding: "12px 20px", borderRadius: "18px 18px 18px 4px", background: C.card, border: `1px solid ${C.bord}` }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: `pulse 1.2s ${d * 0.2}s infinite` }} />)}
                <span style={{ fontSize: 11, color: C.mut, marginLeft: 6 }}>{t.typing}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Free questions warning */}
      {!premium && freeLeft <= 0 && (
        <div style={{ padding: "10px 20px", background: "rgba(245,158,11,0.06)", borderTop: "1px solid rgba(245,158,11,0.1)", textAlign: "center", flexShrink: 0 }}>
          <button onClick={() => setShowPaywall(true)} style={{ background: "none", border: "none", color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ⭐ Besplatna pitanja potrošena — {t.unlock}
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bord}`, display: "flex", gap: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder={t.placeholder}
          style={{ flex: 1, padding: "14px 18px", borderRadius: 16, border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={sendMsg} disabled={loading || !input.trim()}
          style={{
            width: 48, height: 48, borderRadius: 16, border: "none",
            background: input.trim() && !loading ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.06)",
            color: "#fff", fontSize: 18, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "grid", placeItems: "center",
          }}>↑</button>
      </div>

      <Paywall />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(14,165,233,0.3); }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes seaV1 { 0%,100% { d: path('M0,20 C60,10 120,30 180,18 C240,6 300,28 360,15 C380,12 400,20 400,20 L400,80 L0,80 Z'); } 50% { d: path('M0,25 C60,32 120,14 180,26 C240,34 300,16 360,28 C380,30 400,22 400,22 L400,80 L0,80 Z'); } }
        @keyframes seaV2 { 0%,100% { d: path('M0,30 C50,22 100,35 160,25 C220,15 280,32 340,22 C370,18 400,28 400,28 L400,80 L0,80 Z'); } 50% { d: path('M0,22 C50,32 100,18 160,30 C220,38 280,20 340,32 C370,35 400,24 400,24 L400,80 L0,80 Z'); } }
        @keyframes sunGlow { 0%,100% { box-shadow: 0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(251,191,36,0.15); } 50% { box-shadow: 0 0 80px rgba(251,191,36,0.5), 0 0 160px rgba(251,191,36,0.2); } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}
