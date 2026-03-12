// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Landing Page v2 "Izlog"
// Conversion-optimized: Video hero, pain relief, live demo,
// social proof carousel, B2B section, sticky CTA
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;

const L = {
  hr: { badge: "Bez skidanja aplikacije. Radi odmah.", h1a: "Jadran ne oprašta", h1b: "uske ulice i visoke kazne.", h1c: "Tvoj lokalni AI vodič je tu.", sub: "Od Istre do Dalmacije. Unesi gabarite svog vozila i odmah dobij sigurne rute, tajne parkinge i popuste za skrivene konobe.", destLabel: "Kamo ideš?", lenLabel: "Dužina vozila?", cta: "Započni Chat", pain1t: "Zaboravi na kazne", pain1d: "Naš AI zna visinu svakog podvožnjaka i širinu svakog starog grada. Ne rizikuj zaglavljivanje kampera na usponima Biokova ili uličicama Trogira.", pain2t: "Bura te neće iznenaditi", pain2d: "Povezani smo sa lokalnim meteo-stanicama. Ako udari vjetar opasan za tvoju tendu, dobijaš upozorenje i lokaciju najbližeg zaklona.", pain3t: "Mjesta koja Google ne zna", pain3d: "Otkrij OPG-ove, vinarije s besplatnim parkingom i prazne uvale koje samo lokalci čuvaju za sebe.", demoTitle: "Pametnije od mape. Brže od recepcije.", trendTitle: "Što se traži na Jadranu?", b2bTitle: "Vlasnik ste apartmana, kampa ili konobe?", b2bDesc: "Prestanite odgovarati na ista pitanja 50 puta dnevno. Podijelite naš QR kod gostima — oni dobijaju 24/7 vodiča na svom jeziku, a vi mirnu recepciju.", b2bBtn: "Generiraj besplatan QR kod", sticky: "Spremio si se za put?", stickyBtn: "POKRENI JADRAN.AI" },
  de: { badge: "Keine App nötig. Sofort nutzbar.", h1a: "Die Adria verzeiht keine", h1b: "engen Gassen und hohen Strafen.", h1c: "Ihr lokaler AI-Reiseführer.", sub: "Von Istrien bis Dalmatien. Fahrzeugmaße eingeben, sichere Routen und geheime Parkplätze erhalten.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Keine Strafen mehr", pain1d: "Unsere KI kennt jede Unterführung und jede Altstadtgasse. Kein Risiko.", pain2t: "Bora überrascht nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind erhalten Sie sofort eine Warnung.", pain3t: "Was Google nicht kennt", pain3d: "Familienbetriebe, Weingüter mit Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Vermieten Sie eine Unterkunft?", b2bDesc: "Teilen Sie unseren QR-Code — Ihre Gäste erhalten einen 24/7 Guide.", b2bBtn: "Kostenlosen QR-Code erstellen", sticky: "Bereit?", stickyBtn: "JADRAN.AI STARTEN" },
  at: { badge: "Keine App nötig. Sofort nutzbar.", h1a: "Die Adria verzeiht keine", h1b: "engen Gassen und hohen Strafen.", h1c: "Dein lokaler AI-Reiseführer.", sub: "Von Istrien bis Dalmatien. Gib deine Fahrzeugmaße ein und hol dir sichere Routen und geheime Parkplätze.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Vergiss die Strafen", pain1d: "Unsere KI kennt jede Unterführung und jede Altstadtgasse. Null Risiko.", pain2t: "Bora überrascht dich nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind bekommst du sofort eine Warnung.", pain3t: "Was Google nicht kennt", pain3d: "Familienbetriebe, Weingüter mit Camper-Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Vermietest du eine Unterkunft?", b2bDesc: "Teil unseren QR-Code — deine Gäste kriegen einen 24/7 Guide.", b2bBtn: "Gratis QR-Code erstellen", sticky: "Bereit?", stickyBtn: "JADRAN.AI STARTEN" },
  en: { badge: "No app needed. Works instantly.", h1a: "The Adriatic doesn't forgive", h1b: "narrow streets and steep fines.", h1c: "Your local AI guide is here.", sub: "From Istria to Dalmatia. Enter your vehicle size and get safe routes, secret parking and local discounts.", destLabel: "Where to?", lenLabel: "Vehicle length?", cta: "Start Chat", pain1t: "Forget about fines", pain1d: "Our AI knows every underpass height and every old town width. Zero risk.", pain2t: "Bora won't surprise you", pain2d: "Connected to local weather stations. Dangerous wind triggers an instant warning.", pain3t: "What Google doesn't know", pain3d: "Family farms, wineries with free parking and empty coves only locals know.", demoTitle: "Smarter than any map.", trendTitle: "Trending on the Adriatic?", b2bTitle: "Own a property?", b2bDesc: "Share our QR code — your guests get a 24/7 guide in their language.", b2bBtn: "Generate free QR code", sticky: "Ready?", stickyBtn: "LAUNCH JADRAN.AI" },
  it: { badge: "Nessun download. Funziona subito.", h1a: "L'Adriatico non perdona", h1b: "strade strette e multe salate.", h1c: "La tua guida AI locale.", sub: "Dall'Istria alla Dalmazia. Inserisci le dimensioni del veicolo e ottieni percorsi sicuri.", destLabel: "Dove vai?", lenLabel: "Lunghezza?", cta: "Inizia Chat", pain1t: "Dimentica le multe", pain1d: "La nostra IA conosce ogni sottopasso e ogni centro storico.", pain2t: "La Bora non sorprende", pain2d: "Collegati alle stazioni meteo. Vento pericoloso = avviso immediato.", pain3t: "Cosa Google non sa", pain3d: "Agriturismi, cantine con parcheggio e calette vuote.", demoTitle: "Più smart di ogni mappa.", trendTitle: "Tendenze sull'Adriatico?", b2bTitle: "Affitti un alloggio?", b2bDesc: "Condividi il QR code — ospiti ottengono guida 24/7.", b2bBtn: "Genera QR gratuito", sticky: "Pronto?", stickyBtn: "LANCIA JADRAN.AI" },
};

const TRENDING = [
  { emoji: "🚤", title: "Limski kanal \u2014 tura brodom", sub: "Samo 12 mjesta", price: "45\u20AC", link: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468"), tag: "ISTRA" },
  { emoji: "🍷", title: "Degustacija na Pelješcu", sub: "Parking za kampere", price: "35\u20AC", link: GYG("ston-l4159/ston-oyster-and-wine-tasting-tour-t197562"), tag: "DUBROVNIK" },
  { emoji: "🏝️", title: "Blue Cave & 5 otoka", sub: "Cijeli dan na moru", price: "110\u20AC", link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), tag: "SPLIT" },
  { emoji: "🍄", title: "Lov na tartufe \u2014 Motovun", sub: "Pravi lovac i pas", price: "45\u20AC", link: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975"), tag: "ISTRA" },
  { emoji: "🏰", title: "Dubrovnik zidine", sub: "Bez \u010Dekanja", price: "45\u20AC", link: GYG("dubrovnik-l518/dubrovnik-old-town-and-city-walls-walking-tour-t50564"), tag: "DUBROVNIK" },
];

const DEMO_CHAT = [
  { role: "user", text: "Mogu li kamperom do centra Pule?" },
  { role: "ai", text: "Nikako! 🚨 Pauk oko Arene cilja kampere \u2014 kazna 60\u20AC. Parkiraj na Gregovici, besplatno. Bolt do centra 5 min." },
  { role: "cta", text: "Konoba Batelina \u2014 svježa riba, ravan parking" },
];


const DESTINATIONS = [
  { name: "Split & Podstrana", emoji: "🏛️", desc: "Dioklecijanova palača, Bačvice, Marjan", link: BKG("Split, Croatia"), region: "Dalmacija", city: "Split" },
  { name: "Makarska rivijera", emoji: "🏖️", desc: "Najljepše plaže Jadrana", link: BKG("Makarska, Croatia"), region: "Dalmacija", city: "Makarska" },
  { name: "Hvar", emoji: "🌿", desc: "Lavanda, glamur, noćni život", link: BKG("Hvar, Croatia"), region: "Otoci", city: "Hvar" },
  { name: "Rovinj", emoji: "⛪", desc: "Najromantičniji grad Istre", link: BKG("Rovinj, Croatia"), region: "Istra", city: "Rovinj" },
  { name: "Pula", emoji: "🏟️", desc: "Rimska arena, obiteljske plaže", link: BKG("Pula, Croatia"), region: "Istra", city: "Pula" },
  { name: "Opatija", emoji: "⚓", desc: "Elegancija Kvarnera", link: BKG("Opatija, Croatia"), region: "Kvarner", city: "Opatija" },
  { name: "Dubrovnik", emoji: "🏰", desc: "Biser Jadrana, gradske zidine", link: BKG("Dubrovnik, Croatia"), region: "Dalmacija", city: "Dubrovnik" },
  { name: "Zadar", emoji: "🌅", desc: "Morske orgulje, najljepši zalazak", link: BKG("Zadar, Croatia"), region: "Dalmacija", city: "Zadar" },
];

const DESTS = ["Rovinj","Split","Dubrovnik","Zadar","Pula","Makarska","Hvar","Opatija"];

export default function LandingPage() {
  const [lang, setLang] = useState("hr");
  const tx = (k) => (L[lang] || L.hr)[k] || L.hr[k];
  const [dest, setDest] = useState("");
  const [vLen, setVLen] = useState("");
  const [anim, setAnim] = useState(false);
  const [roomInput, setRoomInput] = useState("");
  const [chatStep, setChatStep] = useState(0);
  const [trendImgs, setTrendImgs] = useState({});
  const [cityImgs, setCityImgs] = useState({});
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => { setTimeout(() => setAnim(true), 200); }, []);
  useEffect(() => {
    if (chatStep < DEMO_CHAT.length) {
      const t = setTimeout(() => setChatStep(s => s + 1), chatStep === 0 ? 1200 : 1800);
      return () => clearTimeout(t);
    }
  }, [chatStep]);

  // Load destination city images
  useEffect(() => {
    DESTINATIONS.forEach(d => {
      fetch(`/api/cityimg?city=${encodeURIComponent(d.city)}`)
        .then(r => r.json())
        .then(data => { if (data.url) setCityImgs(prev => ({ ...prev, [d.city]: data.url })); })
        .catch(() => {});
    });
  }, []);

  // Load trending images
  useEffect(() => {
    const cities = [...new Set(TRENDING.map(t => t.city))];
    cities.forEach(city => {
      fetch(`/api/cityimg?city=${encodeURIComponent(city)}`)
        .then(r => r.json())
        .then(d => { if (d.url) setTrendImgs(prev => ({ ...prev, [city]: d.url })); })
        .catch(() => {});
    });
  }, []);

  // Auto-carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIdx(i => (i + 1) % TRENDING.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const goChat = () => { window.location.href = `/ai?niche=camper${dest ? "&dest=" + dest : ""}`; };
  const goRoom = () => { const c = roomInput.trim().toUpperCase(); if (c) window.location.href = `/?room=${encodeURIComponent(c)}`; };

  const F = "'Playfair Display', Georgia, serif";
  const B = "'Outfit', system-ui, sans-serif";

  return (
    <div style={{ background: "#0a1628", color: "#f0f4f8", fontFamily: B, overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 20px", paddingTop: "max(10px, env(safe-area-inset-top, 10px))", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,22,40,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>J</div>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>JADRAN</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 1, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 2 }}>
            {[["hr","🇭🇷"],["de","🇩🇪"],["at","🇦🇹"],["en","🇬🇧"],["it","🇮🇹"],["si","🇸🇮"],["cz","🇨🇿"],["pl","🇵🇱"]].map(([c,f]) => (
              <button key={c} onClick={() => setLang(c)} style={{ padding: "2px 4px", background: lang === c ? "rgba(14,165,233,0.2)" : "transparent", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>{f}</button>
            ))}
          </div>
          <a href="/host" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", color: "#64748b", fontSize: 11, textDecoration: "none" }}>Host</a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%230a0e17'/%3E%3C/svg%3E">
          <source src="https://videos.pexels.com/video-files/1093662/1093662-hd_1920_1080_30fps.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,23,0.6) 0%, rgba(10,14,23,0.3) 40%, rgba(10,14,23,0.95) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto", padding: "100px 24px 60px", textAlign: "center", opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.15)", color: "#facc15", fontSize: 11, fontWeight: 600, marginBottom: 20, letterSpacing: 1 }}>{"\u26A1"} {tx("badge")}</div>
          <h1 style={{ fontFamily: F, fontSize: "clamp(28px, 5.5vw, 52px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
            <span style={{ color: "#f87171" }}>{tx("h1a")}<br/>{tx("h1b")}</span><br/>
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{tx("h1c")}</span>
          </h1>
          <p style={{ fontSize: "clamp(14px, 2.2vw, 17px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>{tx("sub")}</p>
          {/* Two CTA Buttons */}
          <div style={{ display: "flex", gap: 14, maxWidth: 480, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/ai?niche=camper" style={{
              flex: "1 1 200px", padding: "20px 24px", borderRadius: 18, textDecoration: "none",
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", gap: 14, transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🚐</div>
              <div>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#f0f4f8" }}>Kamper vodič</div>
                <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 2 }}>Parking, rute, upozorenja</div>
              </div>
            </a>
            <a href="/ai?niche=local" style={{
              flex: "1 1 200px", padding: "20px 24px", borderRadius: 18, textDecoration: "none",
              background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)",
              display: "flex", alignItems: "center", gap: 14, transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,165,233,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.15)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>🗺️</div>
              <div>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#f0f4f8" }}>Lokalni vodič</div>
                <div style={{ fontSize: 12, color: "#7dd3fc", marginTop: 2 }}>Plaže, konobe, izleti</div>
              </div>
            </a>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "#334155" }}>24h besplatno {"\u00B7"} 8 jezika {"\u00B7"} bez registracije</div>
        </div>
      </section>

      {/* ═══ PAIN RELIEF ═══ */}
      <section style={{ background: "#f8fafc", color: "#0f172a", padding: "72px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {[
            { icon: "\u26D4", t: tx("pain1t"), d: tx("pain1d"), c: "#ef4444" },
            { icon: "🌬️", t: tx("pain2t"), d: tx("pain2d"), c: "#f59e0b" },
            { icon: "💎", t: tx("pain3t"), d: tx("pain3d"), c: "#0ea5e9" },
          ].map((p, i) => (
            <div key={i} style={{ padding: 28, borderRadius: 18, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #e2e8f0" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: p.c + "10", display: "grid", placeItems: "center", fontSize: 24, marginBottom: 14 }}>{p.icon}</div>
              <h3 style={{ fontFamily: F, fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>{p.t}</h3>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ LIVE DEMO ═══ */}
      <section style={{ padding: "72px 24px", background: "linear-gradient(180deg, #0a1628, #0e3a5c)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>DEMO</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700 }}>{tx("demoTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, alignItems: "center" }}>
            {/* Phone mockup */}
            <div style={{ background: "linear-gradient(135deg, #0c2d48, #0e3a5c)", borderRadius: 28, padding: "14px 10px", maxWidth: 320, margin: "0 auto", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>J</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Jadran AI</div>
                <div style={{ fontSize: 8, color: "#22c55e", marginLeft: 2 }}>{"\u25CF"} online</div>
              </div>
              <div style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, padding: "0 4px" }}>
                {DEMO_CHAT.slice(0, chatStep).map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", animation: "fadeSlide 0.5s both" }}>
                    {m.role === "cta" ? (
                      <div style={{ width: "88%", padding: "10px 12px", borderRadius: 12, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", fontSize: 12, fontWeight: 600, textAlign: "center" }}>
                        {"🍽️"} {m.text} {"\u2192"}
                      </div>
                    ) : (
                      <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: m.role === "user" ? "12px 12px 3px 12px" : "12px 12px 12px 3px", background: m.role === "user" ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.05)", fontSize: 12, lineHeight: 1.5 }}>
                        {m.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Right text */}
            <div>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, marginBottom: 20 }}>
                Hans pita: <em>"Mogu li kamperom do centra Pule?"</em><br/><br/>
                AI odmah upozorava na pauka, daje besplatan parking, i rezervira sto u konobi {"\u2014"} sa popustom. Sve u 3 sekunde.
              </p>
              <a href="/ai?niche=camper" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: F }}>
                Probaj besplatno {"\u2192"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DESTINATIONS + AFFILIATE ═══ */}
      <section style={{ padding: "72px 24px", background: "#0a1628" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Destination cards with photos */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>DESTINACIJE</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 700 }}>Otkrijte Jadran</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 48 }}>
            {DESTINATIONS.map((d, i) => (
              <a key={i} href={d.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  borderRadius: 18, overflow: "hidden", position: "relative",
                  background: "#0c2d48", border: "1px solid rgba(14,165,233,0.06)",
                  cursor: "pointer", transition: "all 0.3s", minHeight: 200,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.06)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  {cityImgs[d.city] && <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${cityImgs[d.city]})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    transition: "transform 0.5s",
                  }} className="dest-img" />}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(6,14,28,0.92) 0%, rgba(6,14,28,0.4) 50%, rgba(6,14,28,0.2) 100%)" }} />
                  <div style={{ position: "relative", padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 200 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: 8, background: "rgba(14,165,233,0.15)", alignSelf: "flex-start", marginBottom: 8 }}>{d.region}</span>
                    <div style={{ fontFamily: F, fontSize: 19, fontWeight: 700, marginBottom: 3, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{d.desc}</div>
                    <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>Booking.com →</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Affiliate carousel */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>🔥 POPULARNO</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700 }}>Aktivnosti i izleti</h2>
          </div>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory" }}>
            {TRENDING.map((t, i) => (
              <a key={i} href={t.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", scrollSnapAlign: "start" }}>
                <div style={{ minWidth: 260, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden", transition: "all 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.transform = ""; }}>
                  <div style={{ height: 100, background: "linear-gradient(135deg, #0c2d48, #134e6f)", position: "relative", overflow: "hidden", display: "grid", placeItems: "center" }}>
                    {trendImgs[t.city] && <img src={trendImgs[t.city]} alt={t.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />}
                    <span style={{ position: "relative", fontSize: 32 }}>{t.emoji}</span>
                    <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(14,165,233,0.15)", color: "#38bdf8", fontSize: 9, fontWeight: 600, letterSpacing: 1 }}>{t.tag}</span>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{t.sub}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>{t.price}</span>
                      <span style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(14,165,233,0.08)", color: "#38bdf8", fontSize: 11, fontWeight: 600 }}>Rezerviraj →</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ B2B ═══ */}
      <section style={{ padding: "72px 24px", background: "linear-gradient(180deg, #0e3a5c, #0a1628)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: F, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, color: "#facc15", marginBottom: 14 }}>{tx("b2bTitle")}</h2>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, marginBottom: 28 }}>{tx("b2bDesc")}</p>
          <a href="/host" style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "#fff", color: "#0a1628", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: F }}>
            {tx("b2bBtn")} {"\u2192"}
          </a>
          <div style={{ marginTop: 32, display: "inline-flex", gap: 6, alignItems: "center", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <input value={roomInput} onChange={e => setRoomInput(e.target.value)} onKeyDown={e => e.key === "Enter" && goRoom()}
              placeholder="Room kod" style={{ width: 100, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#94a3b8", fontSize: 13, outline: "none", fontFamily: B }} />
            {roomInput && <button onClick={goRoom} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(14,165,233,0.08)", border: "none", color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Otvori {"\u2192"}</button>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "20px", paddingBottom: "calc(20px + 52px)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ fontSize: 11, color: "#0c4a6e" }}>JADRAN {"\u00B7"} SIAL Consulting d.o.o. {"\u00B7"} 2026</div>
      </footer>

      {/* ═══ STICKY BAR ═══ */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99, padding: "8px 16px", paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))", background: "linear-gradient(135deg, #16a34a, #15803d)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 16px rgba(0,0,0,0.3)" }}>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{"💬"} {tx("sticky")}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <a href="/ai?niche=camper" style={{ padding: "8px 14px", borderRadius: 8, background: "#fff", color: "#15803d", fontSize: 12, fontWeight: 800, textDecoration: "none", fontFamily: F }}>{"🚜"} Kamper</a>
          <a href="/ai?niche=local" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: F }}>{"🗺️"} Vodič</a>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(14,165,233,0.3); }
        html { scroll-behavior: smooth; }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        select option { background: #1e293b; color: #f0f4f8; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 2px; }
        .dest-img { transition: transform 0.5s ease !important; }
        a:hover .dest-img { transform: scale(1.08) !important; }
      `}</style>
    </div>
  );
}
