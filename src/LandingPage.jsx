// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Landing Page v2 "Izlog"
// Conversion-optimized: Video hero, pain relief, live demo,
// social proof carousel, B2B section, sticky CTA
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

// Direct Stripe checkout
const goToStripe = async (plan = "season", lang = "en") => {
  try {
    // Analytics
    try { window.plausible?.("checkout_click", { props: { plan, source: "landing" } }); } catch {}
    try { window.fbq?.("track", "AddPaymentInfo", { content_name: plan, currency: "EUR", value: plan === "vip" ? 49.99 : plan === "season" ? 19.99 : 9.99 }); } catch {}
    let deviceId;
    try { deviceId = localStorage.getItem("jadran_device_id"); if (!deviceId) { deviceId = "jd_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8); localStorage.setItem("jadran_device_id", deviceId); } } catch { deviceId = "unknown"; }
    let utmData = {};
    try { utmData = JSON.parse(localStorage.getItem("jadran_utm") || "{}"); } catch {}
    // Save session so post-payment redirect enters chat
    try { localStorage.setItem("jadran_session", JSON.stringify({ region: plan === "week" ? "split" : "split", travelMode: "apartment", lang })); } catch {}
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomCode: "AI-STANDALONE", guestName: "AI User", lang, returnPath: "/ai", plan, region: plan === "week" ? "split" : "all", deviceId, utm_source: utmData.utm_source || "", utm_medium: utmData.utm_medium || "", utm_campaign: utmData.utm_campaign || "" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (e) { console.error("Checkout error:", e); }
};

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const BKG = (city) => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en`;

const L = {
  hr: { badge: "AI vodič · radi odmah u browseru", h1a: "", h1b: "", h1c: "Tvoj digitalni |J| vodič.", sub: "Google Maps poznaje puteve. Mi poznajemo sve ostalo.", destLabel: "Kamo ideš?", lenLabel: "Dužina vozila?", cta: "Započni Chat", pain1t: "Zaboravi na kazne", pain1d: "Naš vodič zna visinu svakog podvožnjaka i širinu svakog starog grada. Ne rizikuj zaglavljivanje kampera na usponima Biokova ili uličicama Trogira.", pain2t: "Bura te neće iznenaditi", pain2d: "Povezani smo sa lokalnim meteo-stanicama. Ako udari vjetar opasan za tvoju tendu, dobijaš upozorenje i lokaciju najbližeg zaklona.", pain3t: "Mjesta kojih nema na Googleu", pain3d: "OPG-ovi, vinarije s besplatnim parkingom i prazne uvale koje samo lokalci čuvaju za sebe.", demoTitle: "Pametnije od mape. Brže od recepcije.", trendTitle: "Što se traži na Jadranu?", b2bTitle: "Vlasnik ste apartmana, kampa ili konobe?", b2bDesc: "Prestanite odgovarati na ista pitanja 50 puta dnevno. Podijelite naš QR kod gostima — oni dobijaju 24/7 vodiča na svom jeziku, a vi mirnu recepciju.", b2bBtn: "Generiraj besplatan QR kod", sticky: "Od 9.99€/tjedan", stickyBuy: "KUPI ODMAH", stickyBtn: "POKRENI JADRAN", demoLabel: "POGLEDAJTE U AKCIJI", demoDesc: "Hans pita:", demoQ: "Mogu li kamperom do centra Pule?", demoA: "Nikako! 🚨 Pauk cilja kampere — kazna 60€. Parkiraj na Gregovici besplatno.", demoCta: "Konoba Batelina — svježa riba, parking", demoTry: "Probaj besplatno", demoStory: "Vodič odmah upozorava, daje besplatan parking i preporučuje konubu sa popustom. Sve u 3 sekunde.", destLabel2: "DESTINACIJE", destTitle2: "Otkrijte Jadran", destBook2: "Booking.com →", trendLabel2: "POPULARNO", trendSub2: "Aktivnosti i izleti", trendAsk: "Pitaj vodič", trendBook2: "Rezerviraj", freeInfo: "10 poruka besplatno · 8 jezika · bez registracije", roomCode: "Kod sobe", roomOpen: "Otvori", phoneName: "Jadran Vodič" , tab1: "Kamper vodič", tab1s: "Parking, rute, upozorenja", tab2: "Lokalni vodič", tab2s: "Apartman, hotel ili auto — plaže, konobe", tab3: "Nautički vodič", tab3s: "Marine, sidrišta, vjetar", tab4: "Kruzer vodič", tab4s: "Lučki dan, plan po minutu" },
  de: { badge: "KI-Reiseführer · sofort im Browser nutzbar", h1a: "", h1b: "", h1c: "Ihr digitaler |J| Reiseführer.", sub: "Google Maps kennt die Straßen. Wir kennen alles andere.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Keine Strafen mehr", pain1d: "Unser Guide kennt jede Unterführung und jede Altstadtgasse. Kein Risiko.", pain2t: "Bora überrascht nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind erhalten Sie sofort eine Warnung.", pain3t: "Was nicht auf Google steht", pain3d: "Familienbetriebe, Weingüter mit Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Vermieten Sie eine Unterkunft?", b2bDesc: "Teilen Sie unseren QR-Code — Ihre Gäste erhalten einen 24/7 Guide.", b2bBtn: "Kostenlosen QR-Code erstellen", sticky: "Ab 9,99€/Woche", stickyBuy: "JETZT KAUFEN", stickyBtn: "JADRAN STARTEN" , tab1: "Camper-Reiseführer", demoLabel: "IN AKTION ANSEHEN", demoDesc: "Hans fragt:", demoQ: "Kann ich mit dem Camper ins Zentrum von Pula?", demoA: "Auf keinen Fall! 🚨 Abschleppwagen — 60€ Strafe. Kostenlos parken in Gregovica.", demoCta: "Konoba Batelina — frischer Fisch, Parkplatz", demoTry: "Kostenlos testen", demoStory: "Der Guide warnt sofort, findet kostenloses Parken und empfiehlt ein Restaurant mit Rabatt. In 3 Sekunden.", destLabel2: "REISEZIELE", destTitle2: "Entdecken Sie die Adria", destBook2: "Booking.com →", trendLabel2: "BELIEBT", trendSub2: "Aktivitäten und Ausflüge", trendAsk: "Guide fragen", trendBook2: "Reservieren", freeInfo: "10 Nachrichten gratis · 8 Sprachen · ohne Registrierung", roomCode: "Zimmercode", roomOpen: "Öffnen", phoneName: "Jadran Reiseführer", tab1s: "Stellplätze, Routen, Warnungen", tab2: "Lokaler Reiseführer", tab2s: "Ferienwohnung, Hotel oder Auto — Strände, Restaurants", tab3: "Nautischer Reiseführer", tab3s: "Marinas, Ankerplätze, Wind", tab4: "Kreuzfahrt-Reiseführer", tab4s: "Hafentag, Minutenplan" },
  at: { badge: "KI-Reiseführer · sofort im Browser nutzbar", h1a: "", h1b: "", h1c: "Dein digitaler |J| Reiseführer.", sub: "Google Maps kennt die Straßen. Wir kennen alles andere.", destLabel: "Wohin?", lenLabel: "Fahrzeuglänge?", cta: "Chat starten", pain1t: "Vergiss die Strafen", pain1d: "Unser Guide kennt jede Unterführung und jede Altstadtgasse. Null Risiko.", pain2t: "Bora überrascht dich nicht", pain2d: "Verbunden mit lokalen Wetterstationen. Bei Sturmwind bekommst du sofort eine Warnung.", pain3t: "Was ned auf Google steht", pain3d: "Familienbetriebe, Weingüter mit Camper-Parkplatz und leere Buchten.", demoTitle: "Schlauer als jede Karte.", trendTitle: "Was wird an der Adria gesucht?", b2bTitle: "Vermietest du eine Unterkunft?", b2bDesc: "Teil unseren QR-Code — deine Gäste kriegen einen 24/7 Guide.", b2bBtn: "Gratis QR-Code erstellen", sticky: "Ab 9,99€/Woche", stickyBuy: "JETZT KAUFEN", stickyBtn: "JADRAN STARTEN" , tab1: "Camper-Guide", demoLabel: "SCHAU DIR DAS AN", demoDesc: "Hans fragt:", demoQ: "Kann i mit dem Camper ins Zentrum von Pula?", demoA: "Auf gar keinen Fall! 🚨 Abschleppdienst — 60€ Strafe. Gratis parken in Gregovica.", demoCta: "Konoba Batelina — frischer Fisch, Parkplatz", demoTry: "Gratis ausprobieren", demoStory: "Der Guide warnt sofort, findet gratis Parken und empfiehlt a Beisl mit Rabatt. In 3 Sekunden.", destLabel2: "REISEZIELE", destTitle2: "Entdeck die Adria", destBook2: "Booking.com →", trendLabel2: "BELIEBT", trendSub2: "Aktivitäten und Ausflüge", trendAsk: "Guide fragen", trendBook2: "Reservieren", freeInfo: "10 Nachrichten gratis · 8 Sprachen · ohne Registrierung", roomCode: "Zimmercode", roomOpen: "Öffnen", phoneName: "Jadran Urlaubsguide", tab1s: "Stellplätze, Routen, Warnungen", tab2: "Dein Urlaubsguide", tab2s: "Ferienwohnung, Hotel oder Auto — Strände, Beisln", tab3: "Nautik-Guide", tab3s: "Marinas, Ankerplätze, Wind", tab4: "Kreuzfahrt-Guide", tab4s: "Hafentag, Minutenplan" },
  en: { badge: "AI guide · works instantly in your browser", h1a: "", h1b: "", h1c: "Your digital |J| guide.", sub: "Google Maps knows the roads. We know everything else.", destLabel: "Where to?", lenLabel: "Vehicle length?", cta: "Start Chat", pain1t: "Forget about fines", pain1d: "Our guide knows every underpass height and every old town width. Zero risk.", pain2t: "Bora won't surprise you", pain2d: "Connected to local weather stations. Dangerous wind triggers an instant warning.", pain3t: "What's not on Google", pain3d: "Family farms, wineries with free parking and empty coves only locals know.", demoTitle: "Smarter than any map.", trendTitle: "Trending on the Adriatic?", b2bTitle: "Own a property?", b2bDesc: "Share our QR code — your guests get a 24/7 guide in their language.", b2bBtn: "Generate free QR code", sticky: "From €9.99", stickyBuy: "BUY NOW", demoLabel: "SEE IT IN ACTION", demoDesc: "Hans asks:", demoQ: "Can I drive my camper to the center of Pula?", demoA: "Absolutely not! 🚨 Tow trucks — €60 fine. Park free at Gregovica.", demoCta: "Konoba Batelina — fresh fish, flat parking", demoTry: "Try for free", demoStory: "The guide warns instantly, finds free parking and recommends a restaurant with a discount. All in 3 seconds.", destLabel2: "DESTINATIONS", destTitle2: "Discover the Adriatic", destBook2: "Booking.com →", trendLabel2: "TRENDING", trendSub2: "Activities & excursions", trendAsk: "Ask guide", trendBook2: "Book now", freeInfo: "10 messages free · 8 languages · no registration", roomCode: "Room code", roomOpen: "Open", phoneName: "Jadran Guide" , tab1: "Camper Guide", tab1s: "Parking, routes, warnings", tab2: "Local Guide", tab2s: "Apartment, hotel or by car — beaches, restaurants", tab3: "Nautical Guide", tab3s: "Marinas, anchorages, wind", tab4: "Cruise Guide", tab4s: "Port day, minute-by-minute plan" },
  it: { badge: "Guida AI · funziona subito nel browser", h1a: "", h1b: "", h1c: "La tua |J| guida digitale.", sub: "Google Maps conosce le strade. Noi conosciamo tutto il resto.", destLabel: "Dove vai?", lenLabel: "Lunghezza?", cta: "Inizia Chat", pain1t: "Dimentica le multe", pain1d: "La nostra guida conosce ogni sottopasso e ogni centro storico.", pain2t: "La Bora non sorprende", pain2d: "Collegati alle stazioni meteo. Vento pericoloso = avviso immediato.", pain3t: "Cosa non c'è su Google", pain3d: "Agriturismi, cantine con parcheggio e calette vuote.", demoTitle: "Più smart di ogni mappa.", trendTitle: "Tendenze sull'Adriatico?", b2bTitle: "Affitti un alloggio?", b2bDesc: "Condividi il QR code — ospiti ottengono guida 24/7.", b2bBtn: "Genera QR gratuito", sticky: "Da 9,99€/settimana", stickyBuy: "ACQUISTA ORA", demoLabel: "GUARDALO IN AZIONE", demoDesc: "Hans chiede:", demoQ: "Posso col camper nel centro di Pola?", demoA: "Assolutamente no! 🚨 Carri attrezzi — multa 60€. Gratis a Gregovica.", demoCta: "Konoba Batelina — pesce fresco, parcheggio", demoTry: "Prova gratis", demoStory: "La guida avvisa subito, trova parcheggio gratuito e consiglia un ristorante con sconto. Tutto in 3 secondi.", destLabel2: "DESTINAZIONI", destTitle2: "Scoprite l'Adriatico", destBook2: "Booking.com →", trendLabel2: "POPOLARE", trendSub2: "Attività ed escursioni", trendAsk: "Chiedi alla guida", trendBook2: "Prenota", freeInfo: "10 messaggi gratis · 8 lingue · senza registrazione", roomCode: "Codice camera", roomOpen: "Apri", phoneName: "Guida Jadran" , tab1: "Guida camper", tab1s: "Parcheggi, percorsi, avvertenze", tab2: "Guida locale", tab2s: "Appartamento, hotel o in auto — spiagge, ristoranti", tab3: "Guida nautica", tab3s: "Porti turistici, ancoraggi, vento", tab4: "Guida crociera", tab4s: "Giorno in porto, piano al minuto" },
};

const TRENDING = [
  { emoji: "🚤", title: "Limski kanal \u2014 tura brodom", sub: "Samo 12 mjesta", price: "45\u20AC", link: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468"), tag: "ISTRA" },
  { emoji: "🍷", title: "Degustacija na Pelješcu", sub: "Parking za kampere", price: "35\u20AC", link: GYG("ston-l4159/ston-oyster-and-wine-tasting-tour-t197562"), tag: "DUBROVNIK" },
  { emoji: "🏝️", title: "Blue Cave & 5 otoka", sub: "Cijeli dan na moru", price: "110\u20AC", link: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), tag: "SPLIT" },
  { emoji: "🍄", title: "Lov na tartufe \u2014 Motovun", sub: "Pravi lovac i pas", price: "45\u20AC", link: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975"), tag: "ISTRA" },
  { emoji: "🏰", title: "Dubrovnik zidine", sub: "Bez \u010Dekanja", price: "45\u20AC", link: GYG("dubrovnik-l518/dubrovnik-old-town-and-city-walls-walking-tour-t50564"), tag: "DUBROVNIK" },
];

// Demo chat built dynamically from tx() translations


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
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem("jadran_lang");
      if (saved) return saved;
      const nav = (navigator.language || "hr").toLowerCase();
      if (nav.startsWith("de") && nav.includes("at")) return "at";
      if (nav.startsWith("de")) return "de";
      if (nav.startsWith("en")) return "en";
      if (nav.startsWith("it")) return "it";
    } catch {}
    return "hr";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [legalPage, setLegalPage] = useState(null); // "impressum" | "privacy" | null
  // Persist language + close popover on outside click
  useEffect(() => { try { localStorage.setItem("jadran_lang", lang); } catch {} }, [lang]);
  const FLAGS = [["hr","🇭🇷"],["de","🇩🇪"],["at","🇦🇹"],["en","🇬🇧"],["it","🇮🇹"],["si","🇸🇮"],["cz","🇨🇿"],["pl","🇵🇱"]];
  const curFlag = (FLAGS.find(f => f[0] === lang) || FLAGS[0])[1];
  const tx = (k) => (L[lang] || L.hr)[k] || L.hr[k];
  const [dest, setDest] = useState("");
  const [vLen, setVLen] = useState("");
  const [anim, setAnim] = useState(false);
  const [roomInput, setRoomInput] = useState("");
  const [chatStep, setChatStep] = useState(0);
  const [trendImgs, setTrendImgs] = useState({});
  const [cityImgs, setCityImgs] = useState({});
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  useEffect(() => {
    if (!showPlanPicker) return;
    const h = e => { if (e.key === "Escape") setShowPlanPicker(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showPlanPicker]);
  const [isPremium, setIsPremium] = useState(() => {
    try {
      if (localStorage.getItem("jadran_ai_premium") !== "1") return false;
      const pp = localStorage.getItem("jadran_premium_plan");
      if (pp) {
        const d = JSON.parse(pp);
        if (d.expiresAt && d.expiresAt < Date.now()) { localStorage.removeItem("jadran_ai_premium"); return false; }
      }
      return true;
    } catch { return false; }
  });
  const [premDays, setPremDays] = useState(null);
  const [premLabel, setPremLabel] = useState("");
  useEffect(() => {
    try {
      const pp = localStorage.getItem("jadran_premium_plan");
      if (pp) {
        const d = JSON.parse(pp);
        const left = Math.ceil((d.expiresAt - Date.now()) / 86400000);
        setPremDays(left > 0 ? left : 0);
        setPremLabel(d.plan === "season" ? (lang === "en" ? "SEASON" : lang === "de" || lang === "at" ? "SAISON" : lang === "it" ? "STAGIONE" : "SEZONA") : (lang === "en" ? "WEEK" : lang === "de" || lang === "at" ? "WOCHE" : lang === "it" ? "SETTIMANA" : "TJEDAN"));
      }
    } catch {}
  }, [lang]);

  useEffect(() => { setTimeout(() => setAnim(true), 200); }, []);
  useEffect(() => {
    if (chatStep < 3) {
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

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "10px 20px", paddingTop: "max(10px, env(safe-area-inset-top, 10px))", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(10,22,40,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>J</div>
          <span style={{ fontFamily: F, fontSize: 16, fontWeight: 700, letterSpacing: 2 }}>JADRAN</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", fontSize: 16, lineHeight: 1, display: "flex", alignItems: "center", gap: 4 }}>
              {curFlag}<span style={{ fontSize: 9, color: "#64748b" }}>▾</span>
            </button>
            {langOpen && <>
              <div onClick={() => setLangOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 998 }} />
              <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 999, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2, padding: 6, background: "rgba(10,22,40,0.95)", backdropFilter: "blur(20px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {FLAGS.map(([c,f]) => (
                  <button key={c} onClick={() => { setLang(c); setLangOpen(false); }} style={{ padding: "6px 8px", background: lang === c ? "rgba(14,165,233,0.15)" : "transparent", border: lang === c ? "1px solid rgba(14,165,233,0.3)" : "1px solid transparent", borderRadius: 8, cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "all 0.15s" }}>{f}</button>
                ))}
              </div>
            </>}
          </div>
          <a href="/host" style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", color: "#64748b", fontSize: 11, textDecoration: "none" }}>Host</a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%230a0e17'/%3E%3C/svg%3E">
          <source src="https://videos.pexels.com/video-files/1093662/1093662-sd_640_360_30fps.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,14,23,0.6) 0%, rgba(10,14,23,0.3) 40%, rgba(10,14,23,0.95) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto", padding: "100px 24px 60px", textAlign: "center", opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(40px)", transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.15)", color: "#facc15", fontSize: 11, fontWeight: 600, marginBottom: 20, letterSpacing: 1 }}>{"\u26A1"} {tx("badge")}</div>
          <h1 style={{ fontFamily: F, fontSize: "clamp(28px, 5.5vw, 52px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
            <span style={{ color: "#f87171" }}>{tx("h1a")}<br/>{tx("h1b")}</span><br/>
            <span style={{ background: "linear-gradient(135deg, #38bdf8, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {tx("h1c").split("|J|").map((part, idx) => idx === 0 ? <span key={idx}>{part}</span> : <span key={idx}><span style={{ display: "inline-block", width: "0.9em", height: "0.9em", borderRadius: "0.2em", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", textAlign: "center", lineHeight: "0.9em", fontSize: "0.65em", fontWeight: 800, color: "#fff", WebkitTextFillColor: "#fff", verticalAlign: "middle", margin: "0 0.15em" }}>J</span>{part}</span>)}
              </span>
          </h1>
          <p style={{ fontSize: "clamp(14px, 2.2vw, 17px)", color: "#94a3b8", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>{tx("sub")}</p>
          {/* 4 CTA Cards — 2x2 grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520, margin: "0 auto" }}>
            {/* Camper */}
            <a href={`/ai?niche=camper&lang=${lang}`} aria-label="Kamper vodič" style={{
              borderRadius: 16, textDecoration: "none", position: "relative", overflow: "hidden",
              border: "1px solid rgba(245,158,11,0.2)", transition: "all 0.3s", display: "block", minHeight: 90,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400&q=75)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(245,158,11,0.7) 0%, rgba(15,23,42,0.85) 100%)" }} />
              <div style={{ position: "relative", padding: "18px 14px" }}>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#fff" }}>{tx("tab1")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{tx("tab1s")}</div>
              </div>
            </a>
            {/* Local / Auto */}
            <a href={`/ai?niche=local&lang=${lang}`} aria-label="Lokalni vodič" style={{
              borderRadius: 16, textDecoration: "none", position: "relative", overflow: "hidden",
              border: "1px solid rgba(14,165,233,0.15)", transition: "all 0.3s", display: "block", minHeight: 90,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,165,233,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.15)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=75)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(14,165,233,0.65) 0%, rgba(15,23,42,0.85) 100%)" }} />
              <div style={{ position: "relative", padding: "18px 14px" }}>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#fff" }}>{tx("tab2")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{tx("tab2s")}</div>
              </div>
            </a>
            {/* Sailing / Yacht */}
            <a href={`/ai?niche=sailing&lang=${lang}`} aria-label="Nautički vodič" style={{
              borderRadius: 16, textDecoration: "none", position: "relative", overflow: "hidden",
              border: "1px solid rgba(6,182,212,0.15)", transition: "all 0.3s", display: "block", minHeight: 90,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(6,182,212,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.15)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=400&q=75)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(6,182,212,0.6) 0%, rgba(15,23,42,0.85) 100%)" }} />
              <div style={{ position: "relative", padding: "18px 14px" }}>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#fff" }}>{tx("tab3")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{tx("tab3s")}</div>
              </div>
            </a>
            {/* Cruise */}
            <a href={`/ai?niche=cruiser&lang=${lang}`} aria-label="Kruzer vodič" style={{
              borderRadius: 16, textDecoration: "none", position: "relative", overflow: "hidden",
              border: "1px solid rgba(168,85,247,0.15)", transition: "all 0.3s", display: "block", minHeight: 90,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(168,85,247,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.15)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://images.unsplash.com/photo-1548574505-5e239809ee19?w=400&q=75)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(168,85,247,0.6) 0%, rgba(15,23,42,0.85) 100%)" }} />
              <div style={{ position: "relative", padding: "18px 14px" }}>
                <div style={{ fontFamily: F, fontSize: 17, fontWeight: 700, color: "#fff" }}>{tx("tab4")}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>{tx("tab4s")}</div>
              </div>
            </a>
          </div>
          <div style={{ marginTop: 16, fontSize: 11, color: "#334155" }}>{tx("freeInfo")}</div>
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
            <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>{tx("demoLabel")}</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700 }}>{tx("demoTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, alignItems: "center" }}>
            {/* Phone mockup */}
            <div style={{ background: "linear-gradient(135deg, #0c2d48, #0e3a5c)", borderRadius: 28, padding: "14px 10px", maxWidth: 320, margin: "0 auto", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ padding: "6px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>J</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{tx("phoneName")}</div>
                <div style={{ fontSize: 8, color: "#22c55e", marginLeft: 2 }}>{"\u25CF"} online</div>
              </div>
              <div style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, padding: "0 4px" }}>
                {[{role:"user",text:tx("demoQ")},{role:"ai",text:tx("demoA")},{role:"cta",text:tx("demoCta")}].slice(0, chatStep).map((m, i) => (
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
                {tx("demoDesc")} <em>"{tx("demoQ")}"</em><br/><br/>
                {tx("demoStory")}
              </p>
              <a href={`/ai?niche=camper&lang=${lang}`} aria-label="Kamper vodič" style={{ display: "inline-block", padding: "13px 28px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", fontFamily: F }}>
                {tx("demoTry")} {"\u2192"}
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
            <div style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 5, fontWeight: 600, marginBottom: 8 }}>{tx("destLabel2")}</div>
            <h2 style={{ fontFamily: F, fontSize: "clamp(20px, 3.5vw, 28px)", fontWeight: 700 }}>{tx("destTitle2")}</h2>
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
            <h2 style={{ fontFamily: F, fontSize: "clamp(18px, 3vw, 24px)", fontWeight: 700 }}>{tx("trendSub2")}</h2>
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
              placeholder={tx("roomCode")} style={{ width: 100, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#94a3b8", fontSize: 13, outline: "none", fontFamily: B }} />
            {roomInput && <button onClick={goRoom} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(14,165,233,0.08)", border: "none", color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{tx("roomOpen")} {"\u2192"}</button>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 24px", paddingBottom: "calc(32px + 52px)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.03)", background: "#080e1a" }}>
        {/* Payment trust — minimal */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#475569" }}>🛡️</span>
          <span style={{ fontSize: 11, color: "#475569" }}>Secure payments by</span>
          <span style={{ color: "#635BFF", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',system-ui,sans-serif" }}>stripe</span>
        </div>
        <div style={{ fontSize: 11, color: "#1e293b" }}>JADRAN {"\u00B7"} SIAL Consulting d.o.o. {"\u00B7"} 2026</div>
        <div style={{ fontSize: 9, color: "#0f172a", marginTop: 6, letterSpacing: 0.5 }}>{"\u00A9"} 2026 SIAL Consulting d.o.o. All rights reserved.</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <span onClick={() => setLegalPage("impressum")} style={{ fontSize: 9, color: "#1e293b", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Impressum</span>
          <span onClick={() => setLegalPage("privacy")} style={{ fontSize: 9, color: "#1e293b", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>Privacy</span>
        </div>
      </footer>

      {/* ═══ STICKY BUY BAR — PREMIUM DESIGN ═══ */}
      {isPremium ? (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ padding: "10px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", borderTop: "1px solid rgba(245,158,11,0.15)", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "4px 14px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>⭐ {premLabel} {premDays !== null ? premDays + "d" : ""}</span>
            <span style={{ color: "#475569", fontSize: 10 }}>JADRAN.AI PREMIUM</span>
          </div>
        </div>
      ) : (
        <div onClick={() => setShowPlanPicker(true)} style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99, cursor: "pointer", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ position: "relative", overflow: "hidden", padding: "12px 20px", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)", borderTop: "1px solid rgba(245,158,11,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)" }}>
            {/* Shimmer accent line */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "grid", placeItems: "center", fontSize: 16, boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}>⭐</div>
              <div>
                <div style={{ color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: F }}>{tx("stickyBuy") || "KUPI ODMAH"}</div>
                <div style={{ color: "#94a3b8", fontSize: 10 }}>{tx("sticky")}</div>
              </div>
            </div>
            <div style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#0f172a", fontWeight: 800, fontSize: 14, fontFamily: F, boxShadow: "0 4px 16px rgba(245,158,11,0.3)", letterSpacing: 0.5 }}>
              {tx("sticky") || "Od 9.99€"} →
            </div>
          </div>
        </div>
      )}

      {/* ═══ PLAN PICKER MODAL ═══ */}
      {showPlanPicker && (
        <div onClick={() => setShowPlanPicker(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", borderRadius: 24, padding: "32px 24px", maxWidth: 380, width: "100%", border: "1px solid rgba(245,158,11,0.15)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 3, fontWeight: 600, marginBottom: 8 }}>
                {lang === "en" ? "CHOOSE YOUR PLAN" : lang === "de" || lang === "at" ? "WÄHLE DEIN PAKET" : lang === "it" ? "SCEGLI IL TUO PIANO" : "ODABERI PAKET"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display',Georgia,serif" }}>
                {lang === "en" ? "Unlock your guide" : lang === "de" || lang === "at" ? "Guide freischalten" : lang === "it" ? "Sblocca la guida" : "Otključaj vodiča"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {/* Explorer */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("week", lang); }}
                style={{ flex: 1, padding: "18px 10px", borderRadius: 16, border: "1px solid rgba(14,165,233,0.3)", background: "rgba(14,165,233,0.06)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.transform = "scale(1)"; }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0ea5e9" }}>9.99€</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginTop: 4 }}>Explorer</div>
                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
                  {lang === "en" ? "7 days · 1 region" : lang === "de" || lang === "at" ? "7 Tage · 1 Region" : lang === "it" ? "7 giorni · 1 regione" : "7 dana · 1 regija"}
                </div>
              </div>
              {/* Season */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("season", lang); }}
                style={{ flex: 1.1, padding: "18px 10px", borderRadius: 16, border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.06)", cursor: "pointer", textAlign: "center", position: "relative", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,158,11,0.3)"; e.currentTarget.style.transform = "scale(1)"; }}>
                <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, color: "#0f172a", background: "linear-gradient(135deg, #f59e0b, #fbbf24)", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>
                  {lang === "en" ? "BEST VALUE" : lang === "de" || lang === "at" ? "BEST PREIS" : lang === "it" ? "MIGLIORE" : "NAJBOLJE"}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>19.99€</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginTop: 4 }}>
                  {lang === "en" ? "Season" : lang === "de" || lang === "at" ? "Saison" : lang === "it" ? "Stagione" : "Sezona"}
                </div>
                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
                  {lang === "en" ? "30 days · all regions" : lang === "de" || lang === "at" ? "30 Tage · alle Regionen" : lang === "it" ? "30 giorni · tutte" : "30 dana · sve regije"}
                </div>
              </div>
              {/* VIP */}
              <div onClick={() => { setShowPlanPicker(false); goToStripe("vip", lang); }}
                style={{ flex: 1, padding: "18px 10px", borderRadius: 16, border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; e.currentTarget.style.transform = "scale(1)"; }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#a855f7" }}>49.99€</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", marginTop: 4 }}>VIP</div>
                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 4 }}>
                  {lang === "en" ? "30d · priority" : lang === "de" || lang === "at" ? "30T · Priorität" : lang === "it" ? "30g · priorità" : "30d · prioritet"}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "center", fontSize: 10, color: "#64748b" }}>
              {lang === "en" ? "Secure payment via Stripe · No hidden fees" : lang === "de" || lang === "at" ? "Sichere Zahlung über Stripe · Keine versteckten Kosten" : lang === "it" ? "Pagamento sicuro via Stripe · Nessun costo nascosto" : "Sigurno plaćanje putem Stripe · Bez skrivenih troškova"}
            </div>
            <div onClick={() => setShowPlanPicker(false)} style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#475569", cursor: "pointer" }}>
              {lang === "en" ? "Maybe later" : lang === "de" || lang === "at" ? "Vielleicht später" : lang === "it" ? "Forse dopo" : "Možda kasnije"}
            </div>
          </div>
        </div>
      )}

      {/* ═══ LEGAL OVERLAY ═══ */}
      {legalPage && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", overflowY: "auto", WebkitOverflowScrolling: "touch" }} onClick={() => setLegalPage(null)}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px 100px", color: "#e2e8f0", fontFamily: B, fontSize: 13, lineHeight: 1.8 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLegalPage(null)} style={{ position: "fixed", top: 16, right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 20, width: 36, height: 36, borderRadius: "50%", cursor: "pointer", zIndex: 10000 }}>×</button>
            {legalPage === "impressum" ? (<>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>RECHTLICHES</div>
              <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#fff" }}>Impressum</h2>
              <p><strong>Angaben gemäß § 5 ECG (Österreich) / § 5 TMG (Deutschland):</strong></p>
              <p style={{ margin: "16px 0" }}>
                <strong>SIAL Consulting d.o.o.</strong><br/>
                Bizeljska cesta 5<br/>
                8250 Brežice<br/>
                Slovenija / Slowenien
              </p>
              <p><strong>Identifikationsnummer:</strong> SI97117765</p>
              <p><strong>Verantwortlich:</strong> Miroslav Paunov</p>
              <p style={{ margin: "16px 0" }}>
                <strong>Kontakt:</strong><br/>
                E-Mail: info@sialconsulting.com<br/>
                Telefon: +386 40 564 940
              </p>
              <p style={{ margin: "16px 0" }}>
                <strong>Umsatzsteuer-Identifikationsnummer:</strong> SI97117765<br/>
                <strong>Handelsregister:</strong> Okrožno sodišče v Krškem, Slovenija
              </p>
              <p style={{ color: "#64748b", marginTop: 24, fontSize: 11 }}>
                Plattform der EU-Kommission zur Online-Streitbeilegung:<br/>
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>https://ec.europa.eu/consumers/odr</a>
              </p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 16 }}>
                <strong>Haftungshinweis:</strong> Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich. Die auf dieser Plattform bereitgestellten Informationen und Empfehlungen dienen ausschließlich zu Informationszwecken und stellen keine rechtsverbindliche Beratung dar.
              </p>
            </>) : (<>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>RECHTLICHES</div>
              <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#fff" }}>Datenschutzerklärung</h2>
              <p><strong>Verantwortlicher:</strong><br/>SIAL Consulting d.o.o., Bizeljska cesta 5, 8250 Brežice, Slovenija<br/>E-Mail: info@sialconsulting.com</p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>1. Erhobene Daten</h3>
              <p>Wir erheben so wenig Daten wie möglich:</p>
              <p style={{ margin: "8px 0" }}>
                <strong>Automatisch:</strong> Anonymisierte Seitenaufrufe über Plausible Analytics (cookielos, DSGVO-konform, keine personenbezogenen Daten, keine Cookies, kein Tracking über Websites hinweg). Server-Logs (IP-Adresse, Browser-Typ) werden nicht gespeichert.
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Bei Nutzung des AI-Guides:</strong> Ihre Chat-Nachrichten werden an den AI-Dienst (Anthropic Claude / Google Gemini) zur Verarbeitung gesendet. Nachrichten werden nicht dauerhaft gespeichert. Nutzungspräferenzen (Sprache, Region, Reiseart) werden lokal in Ihrem Browser gespeichert (localStorage) und nie an unsere Server übertragen.
              </p>
              <p style={{ margin: "8px 0" }}>
                <strong>Bei Zahlung:</strong> Zahlungen werden über Stripe Inc. abgewickelt. Wir erhalten Ihre E-Mail-Adresse für die Kaufbestätigung. Kreditkartendaten werden ausschließlich von Stripe verarbeitet und nie auf unseren Servern gespeichert. Stripe Datenschutz: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>stripe.com/privacy</a>
              </p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>2. Cookies</h3>
              <p>Diese Website verwendet <strong>keine Cookies</strong>. Weder eigene noch von Drittanbietern. Alle Nutzerdaten werden ausschließlich im localStorage Ihres Browsers gespeichert und verlassen Ihr Gerät nicht.</p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>3. Ihre Rechte (DSGVO Art. 15-21)</h3>
              <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Da wir keine personenbezogenen Daten auf unseren Servern speichern, können Sie Ihre lokalen Daten jederzeit selbst löschen, indem Sie den Browser-Cache leeren.</p>
              <p style={{ margin: "8px 0" }}>Für Anfragen: <a href="mailto:info@sialconsulting.com" style={{ color: "#0ea5e9" }}>info@sialconsulting.com</a></p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>4. Drittanbieter</h3>
              <p style={{ margin: "8px 0" }}><strong>Plausible Analytics</strong> — cookielose, DSGVO-konforme Webanalyse. Keine personenbezogenen Daten. <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Stripe</strong> — Zahlungsabwicklung. PCI DSS Level 1 zertifiziert. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Anthropic (Claude AI)</strong> — AI-Chatverarbeitung. Nachrichten werden nicht für Training verwendet. <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>
              <p style={{ margin: "8px 0" }}><strong>Sentry</strong> — Fehlerbericht-Dienst. Erfasst technische Fehler (keine Chatinhalte). <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>Datenschutz</a></p>

              <h3 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: "#fff", margin: "24px 0 8px" }}>5. Kontakt & Aufsichtsbehörde</h3>
              <p>Bei Fragen: info@sialconsulting.com</p>
              <p style={{ margin: "8px 0", color: "#64748b", fontSize: 11 }}>Zuständige Aufsichtsbehörde: Informacijski pooblaščenec Republike Slovenije, Dunajska cesta 22, 1000 Ljubljana, Slovenija. <a href="https://www.ip-rs.si" target="_blank" rel="noopener noreferrer" style={{ color: "#0ea5e9" }}>www.ip-rs.si</a></p>
              <p style={{ color: "#64748b", fontSize: 11, marginTop: 8 }}>Stand: März 2026</p>
            </>)}
          </div>
        </div>
      )}

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
