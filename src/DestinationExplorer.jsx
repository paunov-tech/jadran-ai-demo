// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Destination Explorer  "/explore"
// Mediterranean luxury editorial · mobile-first · Apple-grade
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";

// ─── FONTS ───
const F = "'Playfair Display','Cormorant Garamond',Georgia,serif";
const B = "'Outfit','system-ui',sans-serif";

// ─── DESTINATIONS ───
const DESTINATIONS = [
  { id:"rab",       name:"Rab",               region:"Kvarner",   tagline:{hr:"Otok četiri zvonika",de:"Insel der vier Türme",en:"Island of four bell towers",it:"Isola dei quattro campanili"}, img:"https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=800&q=80", accent:"#fbbf24", featured:true },
  { id:"split",     name:"Split",             region:"Dalmacija", tagline:{hr:"Dioklecijanova palača",de:"Diokletianpalast",en:"Diocletian's Palace",it:"Palazzo di Diocleziano"}, img:"https://images.unsplash.com/photo-1558271736-cd043ef3e4c8?w=800&q=80", accent:"#0ea5e9" },
  { id:"dubrovnik", name:"Dubrovnik",         region:"Dalmacija", tagline:{hr:"Biser Jadrana",de:"Perle der Adria",en:"Pearl of the Adriatic",it:"Perla dell'Adriatico"}, img:"https://images.unsplash.com/photo-1555990793-da11153b2473?w=800&q=80", accent:"#f97316" },
  { id:"rovinj",    name:"Rovinj",            region:"Istra",     tagline:{hr:"Najromantičniji grad",de:"Die romantischste Stadt",en:"Most romantic town",it:"La città più romantica"}, img:"https://plus.unsplash.com/premium_photo-1664298761043-bd31d840a756?w=800&q=80", accent:"#fb923c" },
  { id:"hvar",      name:"Hvar",              region:"Otoci",     tagline:{hr:"Lavanda i glamur",de:"Lavendel und Glamour",en:"Lavender and glamour",it:"Lavanda e glamour"}, img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", accent:"#a78bfa" },
  { id:"makarska",  name:"Makarska",          region:"Dalmacija", tagline:{hr:"Rivijera iz snova",de:"Traumriviera",en:"Dream riviera",it:"Riviera dei sogni"}, img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", accent:"#38bdf8" },
  { id:"zadar",     name:"Zadar",             region:"Dalmacija", tagline:{hr:"Najljepši zalazak sunca",de:"Schönster Sonnenuntergang",en:"Most beautiful sunset",it:"Tramonto più bello"}, img:"https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=800&q=80", accent:"#f59e0b" },
  { id:"pula",      name:"Pula & Medulin",    region:"Istra",     tagline:{hr:"Rimska arena",de:"Römische Arena",en:"Roman Arena",it:"Arena Romana"}, img:"https://images.unsplash.com/photo-1747339664027-4d18dc50c905?w=800&q=80", accent:"#34d399" },
  { id:"opatija",   name:"Opatija",           region:"Kvarner",   tagline:{hr:"Elegancija Kvarnera",de:"Eleganz des Kvarner",en:"Kvarner elegance",it:"Eleganza del Quarnero"}, img:"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80", accent:"#06b6d4" },
];

// ─── RABSKA FJERA ───
const FJERA = {
  title: { hr:"Rabska Fjera", de:"Rabska Fjera", en:"Rabska Fjera", it:"Rabska Fjera" },
  sub: { hr:"Najveći srednjovjekovni festival Hrvatske · od 1364.", de:"Kroatiens größtes Mittelalterfest · seit 1364.", en:"Croatia's largest medieval festival · since 1364.", it:"Il più grande festival medievale della Croazia · dal 1364." },
  date: "25 — 27. VII.",
  facts: [
    { n:"700+", l:{hr:"Kostimiranih sudionika",de:"Kostümierte Teilnehmer",en:"Costumed participants",it:"Partecipanti in costume"} },
    { n:"100+", l:{hr:"Obrtničkih radionica",de:"Handwerksstätten",en:"Craft workshops",it:"Laboratori artigianali"} },
    { n:"1364", l:{hr:"Godina osnivanja",de:"Gründungsjahr",en:"Year founded",it:"Anno di fondazione"} },
  ],
  highlights: [
    { e:"⚔️", l:{hr:"Turnir samostreličara",de:"Armbrustturnier",en:"Crossbow tournament",it:"Torneo di balestra"} },
    { e:"🏰", l:{hr:"Povorka kroz stari grad",de:"Parade durch die Altstadt",en:"Old town parade",it:"Sfilata nel centro storico"} },
    { e:"🍖", l:{hr:"Srednjovjekovna jela",de:"Mittelalterliche Speisen",en:"Medieval cuisine",it:"Cucina medievale"} },
    { e:"🎆", l:{hr:"Vatromet u ponoć",de:"Feuerwerk um Mitternacht",en:"Midnight fireworks",it:"Fuochi d'artificio a mezzanotte"} },
  ],
};

// ─── STATS ───
const STATS = [
  { n:"165+",  l:{hr:"Jadran Sense™ točaka",de:"Jadran Sense™ Punkte",en:"Jadran Sense™ points",it:"Punti Jadran Sense™"} },
  { n:"8",     l:{hr:"Jezika",de:"Sprachen",en:"Languages",it:"Lingue"} },
  { n:"7",     l:{hr:"Regija",de:"Regionen",en:"Regions",it:"Regioni"} },
  { n:"24/7",  l:{hr:"AI vodič",de:"KI-Guide",en:"AI guide",it:"Guida AI"} },
];

// ─── SENSE — image-driven, no emoji ───
const SENSE = [
  { img:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&q=60", l:{hr:"Plaže uživo",de:"Live-Strände",en:"Live beaches",it:"Spiagge live"}, v:{hr:"Popunjenost · Stanje mora",de:"Auslastung · Meerzustand",en:"Occupancy · Sea conditions",it:"Occupazione · Condizioni mare"} },
  { img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=60", l:{hr:"Parking uživo",de:"Live Parken",en:"Live parking",it:"Parcheggio live"}, v:{hr:"Slobodna mjesta · Cijene",de:"Freie Plätze · Preise",en:"Free spots · Prices",it:"Posti liberi · Prezzi"} },
  { img:"https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=200&q=60", l:{hr:"Marine i vezovi",de:"Marinas & Liegeplätze",en:"Marinas & berths",it:"Marine e ormeggi"}, v:{hr:"Slobodni vezovi · Uvjeti",de:"Freie Liegeplätze · Bedingungen",en:"Free berths · Conditions",it:"Posti liberi · Condizioni"} },
  { img:"https://images.unsplash.com/photo-1476673160081-cf065607f449?w=200&q=60", l:{hr:"Vrijeme i more",de:"Wetter & Meer",en:"Weather & sea",it:"Meteo e mare"}, v:{hr:"UV · Temperatura · Vjetar",de:"UV · Temperatur · Wind",en:"UV · Temperature · Wind",it:"UV · Temperatura · Vento"} },
];

// ─── OFFERS — real excursions with prices ───
const OFFERS = [
  { title:{hr:"Tura brodom — Rab",de:"Bootstour — Rab",en:"Boat tour — Rab",it:"Tour in barca — Rab"}, price:"45€", tag:"RAB", img:"https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=75", link:"https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour" },
  { title:{hr:"Blue Cave & 5 otoka",de:"Blaue Grotte & 5 Inseln",en:"Blue Cave & 5 islands",it:"Grotta Azzurra & 5 isole"}, price:"110€", tag:"SPLIT", img:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75", link:"https://www.getyourguide.com/split-l268/?partner_id=9OEGOYI&q=blue+cave" },
  { title:{hr:"Lov na tartufe — Motovun",de:"Trüffeljagd — Motovun",en:"Truffle hunting — Motovun",it:"Caccia al tartufo — Montona"}, price:"45€", tag:"ISTRA", img:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=75", link:"https://www.getyourguide.com/istria-county-l1297/?partner_id=9OEGOYI&q=truffle" },
  { title:{hr:"Degustacija vina — Pelješac",de:"Weinverkostung — Pelješac",en:"Wine tasting — Pelješac",it:"Degustazione vini — Pelješac"}, price:"35€", tag:"DUBROVNIK", img:"https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&q=75", link:"https://www.getyourguide.com/ston-l4159/?partner_id=9OEGOYI&q=wine" },
  { title:{hr:"Kajak Dubrovnik zidine",de:"Kajak Dubrovnik Mauern",en:"Kayak Dubrovnik walls",it:"Kayak mura Dubrovnik"}, price:"40€", tag:"DUBROVNIK", img:"https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&q=75", link:"https://www.getyourguide.com/dubrovnik-l213/?partner_id=9OEGOYI&q=kayak" },
];
const PARTNER = {
  name: "Black Jack",
  sub: { hr:"Gurman House · Palit 315, Rab", de:"Gurman House · Palit 315, Rab", en:"Gurman House · Palit 315, Rab", it:"Gurman House · Palit 315, Rab" },
  desc: { hr:"Argentinski steakovi, ćevapi s dimljenim sirom i najbolja pizza na Rabu. Terasa uz more, parking, WiFi.", de:"Argentino-Steaks, Ćevapi mit Räucherkäse und beste Pizza auf Rab. Meerterrasse, Parkplatz, WLAN.", en:"Argentino steaks, ćevapi with smoked cheese and best pizza on Rab. Seaside terrace, parking, WiFi.", it:"Steak argentini, ćevapi con formaggio affumicato e la migliore pizza di Rab. Terrazza sul mare, parcheggio, WiFi." },
  link: "/?kiosk=rab&affiliate=blackjack&tk=sial2026&lang=de",
  img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
};

const FLAGS = { hr:"🇭🇷", de:"🇩🇪", at:"🇦🇹", en:"🇬🇧", it:"🇮🇹" };

export default function DestinationExplorer() {
  const [lang, setLang] = useState(() => {
    try {
      const s = localStorage.getItem("jadran_lang"); if (s) return s;
      const n = (navigator.language||"").toLowerCase();
      if (n.includes("at")) return "at";
      if (n.startsWith("de")) return "de";
      if (n.startsWith("en")) return "en";
      if (n.startsWith("it")) return "it";
    } catch {} return "hr";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeRegion, setActiveRegion] = useState("all");
  const heroRef = useRef(null);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  useEffect(() => { try { localStorage.setItem("jadran_lang",lang); } catch {} }, [lang]);

  const t = (obj) => obj[lang==="at"?"de":lang] || obj.hr || "";
  const dl = lang === "at" ? "de" : lang;

  const regions = ["all", ...new Set(DESTINATIONS.map(d => d.region))];
  const filtered = activeRegion === "all" ? DESTINATIONS : DESTINATIONS.filter(d => d.region === activeRegion);

  return (
    <div style={{ background:"#050d1a", color:"#f0f4f8", fontFamily:B, minHeight:"100dvh", overflowX:"hidden" }}>

      {/* ── CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html { scroll-behavior: smooth; }
        body { overscroll-behavior: none; }
        @keyframes heroReveal { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes waveFlow { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        @keyframes gradShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
        .explore-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .explore-card:active { transform: scale(0.97) !important; }
        @media (hover:hover) { .explore-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.4) !important; } }
        .region-pill { transition: all 0.25s; }
        .region-pill:active { transform: scale(0.95); }
        .sense-card { transition: all 0.3s; }
        @media (hover:hover) { .sense-card:hover { background: rgba(14,165,233,0.08) !important; border-color: rgba(14,165,233,0.25) !important; } }
        ::-webkit-scrollbar { height:4px; width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(14,165,233,0.2); border-radius:2px; }
        input:focus { outline:none; border-color:rgba(14,165,233,0.5) !important; box-shadow:0 0 0 3px rgba(14,165,233,0.1) !important; }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"10px 20px", paddingTop:"max(10px, env(safe-area-inset-top, 10px))", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(5,13,26,0.8)", backdropFilter:"blur(24px) saturate(1.8)", WebkitBackdropFilter:"blur(24px) saturate(1.8)", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"grid", placeItems:"center", fontSize:15, fontWeight:800, color:"#fff", fontFamily:F, boxShadow:"0 4px 16px rgba(14,165,233,0.3)" }}>J</div>
          <div>
            <div style={{ fontFamily:F, fontSize:16, fontWeight:600, letterSpacing:3, textTransform:"uppercase", lineHeight:1 }}>Jadran</div>
            <div style={{ fontSize:7, color:"rgba(14,165,233,0.7)", letterSpacing:3, fontWeight:600, textTransform:"uppercase", marginTop:1 }}>Explore</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ position:"relative" }}>
            <button onClick={() => setLangOpen(!langOpen)} style={{ padding:"6px 10px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, cursor:"pointer", fontSize:16, lineHeight:1 }}>{FLAGS[lang]||"🇭🇷"}</button>
            {langOpen && <>
              <div onClick={() => setLangOpen(false)} style={{ position:"fixed", inset:0, zIndex:998 }} />
              <div style={{ position:"absolute", top:"110%", right:0, zIndex:999, display:"flex", gap:2, padding:6, background:"rgba(5,13,26,0.95)", backdropFilter:"blur(20px)", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)", boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {Object.entries(FLAGS).filter(([k]) => k !== lang).map(([k,v]) => (
                  <button key={k} onClick={() => { setLang(k); setLangOpen(false); }} style={{ padding:"6px 8px", background:"transparent", border:"none", cursor:"pointer", fontSize:16, borderRadius:6 }}>{v}</button>
                ))}
              </div>
            </>}
          </div>
          <a href="/ai" style={{ padding:"8px 14px", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:10, color:"#fff", fontSize:11, fontWeight:700, textDecoration:"none", letterSpacing:0.5, boxShadow:"0 2px 12px rgba(14,165,233,0.3)" }}>AI Guide</a>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ position:"relative", height:"100dvh", overflow:"hidden" }}>
        {/* Cinematic background */}
        <div style={{ position:"absolute", inset:"-10%", backgroundImage:"url(https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=1200&q=80)", backgroundSize:"cover", backgroundPosition:"center 40%", filter:"brightness(0.3) saturate(1.3)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(5,13,26,0.4) 0%, rgba(5,13,26,0.1) 30%, rgba(5,13,26,0.6) 70%, #050d1a 100%)" }} />
        {/* Accent line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(251,191,36,0.3), transparent)", backgroundSize:"200% 100%", animation:"gradShift 8s ease infinite" }} />

        <div style={{ position:"relative", zIndex:2, height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", padding:"0 24px 60px", maxWidth:640, margin:"0 auto", opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(30px)", transition:"all 1s cubic-bezier(0.16,1,0.3,1)" }}>
          {/* Badge */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 16px", borderRadius:20, background:"rgba(14,165,233,0.08)", border:"1px solid rgba(14,165,233,0.15)", marginBottom:28 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 8px #22c55e", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:11, color:"#7dd3fc", fontWeight:600, letterSpacing:1.5 }}>
              {({hr:"JADRAN SENSE™ AKTIVAN",de:"JADRAN SENSE™ AKTIV",en:"JADRAN SENSE™ ACTIVE",it:"JADRAN SENSE™ ATTIVO"})[dl] || "JADRAN SENSE™ ACTIVE"}
            </span>
          </div>

          {/* Main headline */}
          <h1 style={{ fontFamily:F, fontSize:"clamp(36px, 7vw, 64px)", fontWeight:400, lineHeight:1.1, marginBottom:20, letterSpacing:"-0.02em" }}>
            <span style={{ display:"block", color:"rgba(240,244,248,0.5)", fontSize:"clamp(14px,2.5vw,18px)", fontFamily:B, fontWeight:300, letterSpacing:6, textTransform:"uppercase", marginBottom:12 }}>
              {({hr:"Otkrijte",de:"Entdecken Sie",en:"Discover",it:"Scoprite"})[dl] || "Discover"}
            </span>
            <span style={{ background:"linear-gradient(135deg, #f0f4f8 20%, #7dd3fc 50%, #fbbf24 80%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200% 200%", animation:"gradShift 6s ease infinite" }}>
              {({hr:"Hrvatski Jadran",de:"Kroatische Adria",en:"Croatian Adriatic",it:"Adriatico Croato"})[dl] || "Croatian Adriatic"}
            </span>
          </h1>

          <p style={{ fontSize:"clamp(14px,2.2vw,17px)", color:"#94a3b8", lineHeight:1.7, maxWidth:480, margin:"0 auto 36px", fontWeight:300 }}>
            {({
              hr:"Skrivene plaže, konobe od lokalaca, live stanje mora i parkinga — vaš AI vodič za savršeni Jadran.",
              de:"Versteckte Strände, Restaurants der Einheimischen, Live-Meer- und Parkdaten — Ihr KI-Guide für die perfekte Adria.",
              en:"Hidden beaches, local restaurants, live sea & parking data — your AI guide to the perfect Adriatic.",
              it:"Spiagge nascoste, ristoranti locali, dati live su mare e parcheggi — la vostra guida AI per l'Adriatico perfetto."
            })[dl] || ""}
          </p>

          {/* Dual CTA */}
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <a href="#destinations" style={{ padding:"15px 28px", background:"linear-gradient(135deg,#0ea5e9,#0284c7)", borderRadius:14, color:"#fff", fontSize:15, fontWeight:600, textDecoration:"none", fontFamily:F, letterSpacing:0.5, boxShadow:"0 4px 24px rgba(14,165,233,0.3), inset 0 1px 0 rgba(255,255,255,0.15)", minHeight:48, display:"inline-flex", alignItems:"center" }}>
              {({hr:"Istraži destinacije",de:"Destinationen entdecken",en:"Explore destinations",it:"Esplora destinazioni"})[dl] || "Explore"} ↓
            </a>
            <a href="/ai" style={{ padding:"15px 28px", borderRadius:14, color:"#f0f4f8", fontSize:15, fontWeight:500, textDecoration:"none", fontFamily:F, border:"1px solid rgba(251,191,36,0.25)", background:"rgba(251,191,36,0.06)", minHeight:48, display:"inline-flex", alignItems:"center", gap:6, letterSpacing:0.3 }}>
              AI Travel Guardian →
            </a>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop:48, animation:"float 3s ease infinite" }}>
            <div style={{ width:24, height:40, borderRadius:12, border:"1px solid rgba(255,255,255,0.15)", margin:"0 auto", display:"flex", justifyContent:"center", paddingTop:8 }}>
              <div style={{ width:3, height:8, borderRadius:2, background:"rgba(14,165,233,0.6)", animation:"pulse 2s infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ JADRAN SENSE™ ═══ */}
      <section style={{ padding:"60px 20px", background:"linear-gradient(180deg, #050d1a 0%, #071828 100%)" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 12px #22c55e", animation:"pulse 2s infinite" }} />
            <span style={{ fontSize:10, color:"#22c55e", letterSpacing:3, fontWeight:700 }}>JADRAN SENSE™</span>
          </div>
          <h2 style={{ fontFamily:F, fontSize:"clamp(24px,4.5vw,36px)", fontWeight:400, marginBottom:8, lineHeight:1.2 }}>
            {({hr:"Jadran u realnom vremenu",de:"Die Adria in Echtzeit",en:"The Adriatic in real time",it:"L'Adriatico in tempo reale"})[dl] || ""}
          </h2>
          <p style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.6 }}>
            {({hr:"165+ senzorskih točaka duž obale. Plaže, parkovi, marine — sve uživo.",de:"165+ Sensorpunkte entlang der Küste. Strände, Parkplätze, Marinas — alles live.",en:"165+ sensor points along the coast. Beaches, parking, marinas — all live.",it:"165+ punti sensoriali lungo la costa. Spiagge, parcheggi, marine — tutto in tempo reale."})[dl] || ""}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {SENSE.map((s,i) => (
              <div key={i} style={{ borderRadius:14, overflow:"hidden", position:"relative", height:120, border:"1px solid rgba(14,165,233,0.08)", animation:`fadeUp 0.4s ease ${i*0.1}s both` }}>
                <img src={s.img} alt="" loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:0.25 }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.9) 0%, rgba(5,13,26,0.4) 100%)" }} />
                <div style={{ position:"relative", padding:"14px 12px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", marginBottom:2 }}>{t(s.l)}</div>
                  <div style={{ fontSize:10, color:"#64748b", lineHeight:1.4 }}>{t(s.v)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DESTINATIONS ═══ */}
      <section id="destinations" style={{ padding:"60px 20px 40px", background:"linear-gradient(180deg, #071828 0%, #0a1e36 50%, #071828 100%)" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:10, color:"#0ea5e9", letterSpacing:4, fontWeight:700, marginBottom:8 }}>
              {({hr:"DESTINACIJE",de:"REISEZIELE",en:"DESTINATIONS",it:"DESTINAZIONI"})[dl] || "DESTINATIONS"}
            </div>
            <h2 style={{ fontFamily:F, fontSize:"clamp(28px,5vw,42px)", fontWeight:400, marginBottom:12 }}>
              {({hr:"Vaš sljedeći odmor",de:"Ihr nächster Urlaub",en:"Your next escape",it:"La vostra prossima fuga"})[dl] || ""}
            </h2>
          </div>

          {/* Region filter pills */}
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:12, marginBottom:20, scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch" }}>
            {regions.map(r => (
              <button key={r} className="region-pill" onClick={() => setActiveRegion(r)} style={{
                padding:"8px 18px", borderRadius:20, border:`1px solid ${activeRegion===r ? "rgba(14,165,233,0.4)" : "rgba(255,255,255,0.06)"}`,
                background: activeRegion===r ? "rgba(14,165,233,0.12)" : "rgba(255,255,255,0.03)",
                color: activeRegion===r ? "#7dd3fc" : "#64748b", fontSize:12, fontWeight:600,
                cursor:"pointer", whiteSpace:"nowrap", scrollSnapAlign:"start", minHeight:36,
              }}>
                {r === "all" ? ({hr:"Sve",de:"Alle",en:"All",it:"Tutte"})[dl]||"All" : r}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
            {filtered.map((d, i) => (
              <a key={d.id} href={`/?kiosk=${d.id}&lang=${lang}`} className="explore-card" style={{
                display:"block", borderRadius:20, overflow:"hidden", position:"relative",
                height: d.featured ? 280 : 220, textDecoration:"none", color:"#fff",
                border:"1px solid rgba(255,255,255,0.06)",
                boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
                animation:`fadeUp 0.5s ease ${i * 0.08}s both`,
              }}>
                <img src={d.img} alt={d.name} loading="lazy" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.9) 0%, rgba(5,13,26,0.2) 50%, rgba(5,13,26,0.1) 100%)" }} />
                {/* Region tag */}
                <div style={{ position:"absolute", top:14, left:14, padding:"4px 10px", borderRadius:8, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", fontSize:9, fontWeight:600, color:d.accent, letterSpacing:1.5, textTransform:"uppercase" }}>{d.region}</div>
                {/* Featured badge */}
                {d.featured && <div style={{ position:"absolute", top:14, right:14, padding:"4px 10px", borderRadius:8, background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.2)", fontSize:9, fontWeight:700, color:"#fbbf24", letterSpacing:1 }}>● {({hr:"PILOT",de:"PILOT",en:"PILOT",it:"PILOTA"})[dl]||"PILOT"}</div>}
                {/* Content */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"20px 18px" }}>
                  <h3 style={{ fontFamily:F, fontSize: d.featured ? 32 : 24, fontWeight:400, marginBottom:4, lineHeight:1.1 }}>{d.name}</h3>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,0.65)", fontWeight:300 }}>{t(d.tagline)}</p>
                  <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:4, padding:"6px 12px", borderRadius:8, background:`${d.accent}18`, border:`1px solid ${d.accent}30`, fontSize:11, color:d.accent, fontWeight:600 }}>
                    {({hr:"Istraži",de:"Entdecken",en:"Explore",it:"Esplora"})[dl]||"Explore"} →
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OFFERS — real excursions with prices ═══ */}
      <section style={{ padding:"56px 20px", background:"linear-gradient(180deg, #071828, #050d1a)" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontSize:10, color:"#f59e0b", letterSpacing:4, fontWeight:700, marginBottom:6 }}>
            {({hr:"IZLETI & AKTIVNOSTI",de:"AUSFLÜGE & AKTIVITÄTEN",en:"EXCURSIONS & ACTIVITIES",it:"ESCURSIONI & ATTIVITÀ"})[dl]||""}
          </div>
          <h2 style={{ fontFamily:F, fontSize:"clamp(24px,4.5vw,34px)", fontWeight:400, marginBottom:24, lineHeight:1.2 }}>
            {({hr:"Doživite Jadran",de:"Erleben Sie die Adria",en:"Experience the Adriatic",it:"Vivete l'Adriatico"})[dl]||""}
          </h2>
          <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:12, WebkitOverflowScrolling:"touch", scrollSnapType:"x mandatory" }}>
            {OFFERS.map((o,i) => (
              <a key={i} href={o.link} target="_blank" rel="noopener noreferrer" className="ex-card" style={{
                minWidth:240, maxWidth:280, borderRadius:16, overflow:"hidden", textDecoration:"none", color:"#fff",
                border:"1px solid rgba(255,255,255,0.06)", flexShrink:0, scrollSnapAlign:"start",
                boxShadow:"0 4px 20px rgba(0,0,0,0.2)",
              }}>
                <div style={{ height:130, position:"relative" }}>
                  <img src={o.img} alt={t(o.title)} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, rgba(5,13,26,0.8) 0%, transparent 60%)" }} />
                  <div style={{ position:"absolute", top:8, left:8, padding:"3px 8px", borderRadius:6, background:"rgba(14,165,233,0.15)", border:"1px solid rgba(14,165,233,0.12)", fontSize:8, fontWeight:700, color:"#38bdf8", letterSpacing:1 }}>{o.tag}</div>
                  <div style={{ position:"absolute", bottom:8, right:8, padding:"4px 10px", borderRadius:8, background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.2)", fontSize:14, fontWeight:700, color:"#22c55e", fontFamily:F }}>{o.price}</div>
                </div>
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:14, fontWeight:600, lineHeight:1.3, marginBottom:4 }}>{t(o.title)}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>GetYourGuide</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ RABSKA FJERA — cinematic ═══ */}
      <section style={{ position:"relative", padding:"72px 20px", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=1200&q=60)", backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(0.15) saturate(1.4)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(5,13,26,0.5) 0%, rgba(15,31,15,0.3) 50%, rgba(5,13,26,0.7) 100%)" }} />
        <div style={{ position:"relative", maxWidth:540, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:10, color:"#fbbf24", letterSpacing:5, fontWeight:700, marginBottom:8 }}>{FJERA.date}</div>
          <h2 style={{ fontFamily:F, fontSize:"clamp(28px,5vw,40px)", fontWeight:400, fontStyle:"italic", marginBottom:8 }}>{t(FJERA.title)}</h2>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.65)", lineHeight:1.6, marginBottom:28 }}>
            {({hr:"Najveći srednjovjekovni festival Hrvatske. 700+ kostimiranih sudionika, turnir samostreličara, povorka kroz stari grad, vatromet u ponoć.",de:"Kroatiens größtes Mittelalterfest. 700+ kostümierte Teilnehmer, Armbrustturnier, Parade durch die Altstadt, Feuerwerk um Mitternacht.",en:"Croatia's largest medieval festival. 700+ costumed participants, crossbow tournament, old town parade, midnight fireworks.",it:"Il più grande festival medievale della Croazia. 700+ partecipanti in costume, torneo di balestra, sfilata, fuochi d'artificio."})[dl]||""}
          </p>

          <div style={{ display:"flex", justifyContent:"center", gap:28, marginBottom:28 }}>
            {[{n:"700+",l:{hr:"Sudionika",de:"Teilnehmer",en:"Participants",it:"Partecipanti"}},{n:"1364",l:{hr:"Osnivanje",de:"Gegründet",en:"Founded",it:"Fondato"}},{n:"3",l:{hr:"Dana",de:"Tage",en:"Days",it:"Giorni"}}].map((f,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:F, fontSize:28, fontWeight:700, color:"#fbbf24" }}>{f.n}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:3 }}>{t(f.l)}</div>
              </div>
            ))}
          </div>

          <a href="/?kiosk=rab&lang=de" style={{ display:"inline-flex", alignItems:"center", padding:"14px 28px", borderRadius:14, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.25)", color:"#fbbf24", fontSize:14, fontWeight:600, textDecoration:"none", fontFamily:B, minHeight:48 }}>
            {({hr:"Istraži Rab",de:"Rab entdecken",en:"Explore Rab",it:"Esplora Rab"})[dl]||"Explore Rab"} →
          </a>
        </div>
      </section>

      {/* ═══ PARTNER SPOTLIGHT ═══ */}
      <section style={{ padding:"60px 20px", background:"#050d1a" }}>
        <div style={{ maxWidth:640, margin:"0 auto" }}>
          <div style={{ fontSize:10, color:"#0ea5e9", letterSpacing:4, fontWeight:700, marginBottom:8 }}>
            {({hr:"PARTNER DESTINACIJA",de:"PARTNER DESTINATION",en:"PARTNER DESTINATION",it:"DESTINAZIONE PARTNER"})[dl]||"PARTNER"}
          </div>
          <div style={{ borderRadius:20, overflow:"hidden", border:"1px solid rgba(14,165,233,0.12)", boxShadow:"0 12px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ height:180, position:"relative" }}>
              <img src={PARTNER.img} alt={PARTNER.name} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(0deg, #050d1a 0%, transparent 60%)" }} />
              <div style={{ position:"absolute", bottom:16, left:18 }}>
                <div style={{ fontFamily:F, fontSize:28, fontWeight:400 }}>Black Jack</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{t(PARTNER.sub)}</div>
              </div>
            </div>
            <div style={{ padding:"18px 18px 20px" }}>
              <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.7, marginBottom:16 }}>{t(PARTNER.desc)}</p>
              <a href={PARTNER.link} style={{ display:"block", padding:"14px", borderRadius:12, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none", textAlign:"center", boxShadow:"0 4px 20px rgba(14,165,233,0.25)", minHeight:48 }}>
                {({hr:"Otvori vodič za Rab",de:"Rab-Guide öffnen",en:"Open Rab guide",it:"Apri guida Rab"})[dl]||"Open guide"} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{ padding:"48px 20px", background:"linear-gradient(180deg, #050d1a, #071828)", borderTop:"1px solid rgba(14,165,233,0.06)", borderBottom:"1px solid rgba(14,165,233,0.06)" }}>
        <div style={{ maxWidth:640, margin:"0 auto", display:"flex", justifyContent:"space-around", flexWrap:"wrap", gap:20 }}>
          {STATS.map((s,i) => (
            <div key={i} style={{ textAlign:"center", animation:`countUp 0.5s ease ${i*0.1+0.2}s both` }}>
              <div style={{ fontFamily:F, fontSize:28, fontWeight:700, color:"#0ea5e9", lineHeight:1 }}>{s.n}</div>
              <div style={{ fontSize:10, color:"#475569", marginTop:4, letterSpacing:0.5 }}>{t(s.l)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ AI TRAVEL GUARDIAN CTA ═══ */}
      <section style={{ position:"relative", padding:"72px 20px", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=60)", backgroundSize:"cover", backgroundPosition:"center", filter:"brightness(0.12) saturate(1.2)" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(5,13,26,0.7) 0%, rgba(5,13,26,0.5) 50%, rgba(5,13,26,0.9) 100%)" }} />
        <div style={{ position:"relative", maxWidth:480, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:10, color:"rgba(245,158,11,0.8)", letterSpacing:4, fontWeight:700, marginBottom:12 }}>AI TRAVEL GUARDIAN</div>
          <h2 style={{ fontFamily:F, fontSize:"clamp(26px,5vw,38px)", fontWeight:400, marginBottom:12, lineHeight:1.2 }}>
            {({hr:"Vaš osobni vodič za Jadran",de:"Ihr persönlicher Adria-Guide",en:"Your personal Adriatic guide",it:"La vostra guida personale"})[dl]||""}
          </h2>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:8 }}>
            {({
              hr:"Planira put, upozorava na opasnosti, vodi vas od vrata do vrata. 3 besplatne poruke.",
              de:"Plant die Reise, warnt vor Gefahren, begleitet Sie von Tür zu Tür. 3 kostenlose Nachrichten.",
              en:"Plans your trip, warns of dangers, guides you door-to-door. 3 free messages.",
              it:"Pianifica il viaggio, avverte dei pericoli, vi accompagna porta a porta. 3 messaggi gratuiti."
            })[dl] || ""}
          </p>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:28 }}>
            {({hr:"Od 9.99€/tjedan · 8 jezika · bez registracije",de:"Ab 9,99€/Woche · 8 Sprachen · ohne Registrierung",en:"From €9.99/week · 8 languages · no registration",it:"Da 9,99€/settimana · 8 lingue · senza registrazione"})[dl]||""}
          </p>
          <a href="/ai" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"16px 32px", borderRadius:16, background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#0f172a", fontSize:16, fontWeight:800, textDecoration:"none", fontFamily:B, boxShadow:"0 8px 32px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", letterSpacing:0.5, minHeight:52 }}>
            {({hr:"Pokreni AI Guardian",de:"AI Guardian starten",en:"Start AI Guardian",it:"Avvia AI Guardian"})[dl]||"Start"} →
          </a>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:"32px 20px 48px", paddingBottom:"calc(32px + env(safe-area-inset-bottom, 0px))", textAlign:"center", background:"#030810", borderTop:"1px solid rgba(255,255,255,0.03)" }}>
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,#0ea5e9,#0284c7)", display:"grid", placeItems:"center", fontSize:12, fontWeight:800, color:"#fff", fontFamily:F }}>J</div>
          <span style={{ fontFamily:F, fontSize:14, letterSpacing:3, textTransform:"uppercase", color:"#334155" }}>Jadran</span>
        </div>
        <div style={{ fontSize:10, color:"#1e293b", letterSpacing:0.5 }}>© 2026 SIAL Consulting d.o.o. · jadran.ai</div>
        <div style={{ display:"flex", justifyContent:"center", gap:16, marginTop:8 }}>
          <a href="/ai" style={{ fontSize:10, color:"#334155", textDecoration:"underline", textUnderlineOffset:2 }}>AI Travel Guardian</a>
          <a href="/host" style={{ fontSize:10, color:"#334155", textDecoration:"underline", textUnderlineOffset:2 }}>Host Panel</a>
        </div>
      </footer>
    </div>
  );
}
