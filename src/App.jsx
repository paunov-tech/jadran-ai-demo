import { useState, useEffect, useRef } from "react";

/* ══════════════════════════════════════════════════════════
   JADRAN AI — Unified Platform v4
   3 Phases: Pre-Trip → Kiosk Stay → Post-Stay
   Monetization: Free/Premium tiers + Affiliate + Concierge
   ══════════════════════════════════════════════════════════ */

/* ─── DATA ─── */
const GUEST = {
  name: "Familie Weber", first: "Weber", country: "DE", lang: "de", flag: "🇩🇪",
  adults: 2, kids: 2, kidsAges: [7, 11], interests: ["gastro", "adventure", "culture"],
  arrival: "2026-07-12", departure: "2026-07-19", car: true, carPlate: "M-WB 4521",
  accommodation: "Villa Marija, Podstrana", host: "Marija Perić", hostPhone: "+385 91 555 1234",
  budget: 1200, spent: 345, email: "weber@email.de"
};

const W = { icon: "☀️", temp: 31, sea: 25, uv: 8, wind: "Z 8 km/h", sunset: "20:47", humidity: 45 };

const FORECAST = [
  { d: "Pon", icon: "☀️", h: 31, l: 22 }, { d: "Uto", icon: "⛅", h: 28, l: 21 },
  { d: "Sri", icon: "🌧️", h: 23, l: 19 }, { d: "Čet", icon: "☀️", h: 30, l: 22 },
  { d: "Pet", icon: "☀️", h: 32, l: 23 }, { d: "Sub", icon: "⛅", h: 29, l: 21 },
  { d: "Ned", icon: "☀️", h: 31, l: 22 },
];

const PRACTICAL = {
  parking: { icon: "🅿️", title: "Parking", items: [
    { n: "Parking ispred vile", d: "0m", note: "Vaše mjesto: #7", free: true },
    { n: "Podstrana centar", d: "400m", note: "8 kn/h · SMS plaćanje", price: "8kn/h" },
    { n: "Garaža Lora (Split)", d: "8km", note: "Natkrivena garaža, 24/7", price: "10€/dan" },
  ]},
  beach: { icon: "🏖️", title: "Plaže", items: [
    { n: "Plaža Podstrana", d: "200m", note: "3 min pješice · Ležaljke 15€/dan", type: "🪨" },
    { n: "Kašjuni", d: "6km", note: "12 min autom · Parking 5€ · Najljepša!", type: "🪨" },
    { n: "Bačvice", d: "9km", note: "PIJESAK! Savršena za djecu · 15 min autom", type: "🏖️" },
    { n: "Zlatni Rat (Brač)", d: "Ferry", note: "Ikonska · Ferry 7:30, 9:30, 12:00", type: "🏖️", affiliate: true, link: "jadrolinija.hr" },
  ]},
  sun: { icon: "☀️", title: "Sunce & UV", items: [
    { n: `UV Index: ${W.uv} (VISOK)`, note: "SPF 50+ obavezno između 11-16h!", warn: true },
    { n: "Hidracija", note: "Min. 3L vode pri 31°C · Djeca češće!" },
    { n: "Ljekarna Podstrana", d: "300m", note: "Do 20h · SPF, After Sun, Panthenol" },
  ]},
  routes: { icon: "🗺️", title: "Prijevoz", items: [
    { n: "Split centar", d: "10km", note: "Auto 15min / Bus #60 svaki 20min (2€)" },
    { n: "Trogir", d: "30km", note: "Auto 25min · UNESCO · Prekrasan pogled!" },
    { n: "Omiš + Cetina", d: "15km", note: "Auto 18min · Rafting dostupan!", affiliate: true },
    { n: "Ferry Brač/Hvar", note: "jadrolinija.hr · Online booking 20% jeftinije", affiliate: true },
  ]},
  food: { icon: "🍽️", title: "Hrana", items: [
    { n: "Konzum", d: "400m", note: "7-21h · Svježi kruh do 8h" },
    { n: "Pekara Bobis", d: "250m", note: "Od 6h! Burek, kroasani" },
    { n: "Wolt / Glovo", note: "Dostava iz Splita do Podstrane" },
  ]},
  emergency: { icon: "🏥", title: "Hitno", items: [
    { n: "Hitna pomoć: 112 / 194", warn: true },
    { n: "Ljekarna", d: "300m", note: "Do 20h" },
    { n: "WiFi", note: "VillaMarija-5G · Lozinka: jadran2026" },
    { n: "Domaćin", note: `${GUEST.host}: ${GUEST.hostPhone} (WhatsApp)` },
  ]},
};

const GEMS = [
  { name: "Uvala Vruja", emoji: "🏝️", type: "Tajna plaža", desc: "Između Omiša i Makarske, dostupna samo pješice. Kristalno more, potpuno divlja.", tip: "Ponesite vode i cipele za hodanje! Nema sjene.", best: "Ujutro", diff: "Srednje", premium: false },
  { name: "Marjan špilje", emoji: "🕳️", type: "Šetnja", desc: "Starokršćanske špilje iz 5. st. na stazi od Kašjuna do vrha Marjana.", tip: "Krenite u 17h, stignete na vrh za zalazak sunca.", best: "Popodne", diff: "Lagano", premium: false },
  { name: "Konoba Stari Mlin", emoji: "🍷", type: "Lokalna tajna", desc: "Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. Pršut, sir, vino iz podruma.", tip: "Nazovite dan ranije. ~80€ za 4 osobe sa vinom.", best: "Večer", diff: "Auto", premium: true },
  { name: "Klis u zoru", emoji: "🏰", type: "Iskustvo", desc: "Game of Thrones tvrđava u zoru. Nema turista. Pogled na Split i otoke.", tip: "Parking besplatan prije 8h. Dođite u 5:15.", best: "Izlazak sunca", diff: "Lagano", premium: true },
  { name: "Cetina tajni bazen", emoji: "🌊", type: "Kupanje", desc: "3km uzvodno od Omiša, makadamski put do skrivenog prirodnog bazena.", tip: "Skrenite desno kod mosta u Omišu. Makadamski put 1km.", best: "Popodne", diff: "Lagano", premium: true },
  { name: "Vidova Gora zalazak", emoji: "🌄", type: "Pogled", desc: "Najviši vrh jadranskih otoka (778m). Auto do vrha. Pogled na Hvar, Vis, Italiju.", tip: "Ferry 12h, auto 30min do vrha, zalazak, večera u Bolu.", best: "Zalazak", diff: "Ferry+Auto", premium: true },
];

const EXPERIENCES = [
  { id: 1, name: "Kajak Pakleni otoci", emoji: "🛶", price: 55, ourPrice: 65, dur: "4h", rating: 4.9, spots: 3, cat: "adventure" },
  { id: 2, name: "Dalmatinska kuhinja", emoji: "👨‍🍳", price: 50, ourPrice: 65, dur: "4h", rating: 4.8, spots: 6, cat: "gastro" },
  { id: 3, name: "Dioklecijanova palača", emoji: "🏛️", price: 25, ourPrice: 35, dur: "2h", rating: 4.7, spots: 8, cat: "culture" },
  { id: 4, name: "Rafting Cetina", emoji: "🚣", price: 45, ourPrice: 55, dur: "3h", rating: 4.9, spots: 4, cat: "adventure" },
  { id: 5, name: "Sunset Sailing", emoji: "⛵", price: 95, ourPrice: 120, dur: "4h", rating: 5.0, spots: 2, cat: "premium" },
  { id: 6, name: "Wine Tasting Kaštela", emoji: "🍷", price: 35, ourPrice: 45, dur: "3h", rating: 4.8, spots: 4, cat: "gastro" },
];

const BUNDLES = [
  { name: "Romantični bijeg", emoji: "💑", includes: ["Sunset Sailing", "Spa za dvoje", "Večera"], price: 280, orig: 345 },
  { name: "Obiteljska avantura", emoji: "👨‍👩‍👧‍👦", includes: ["Rafting Cetina", "Kajak tura", "Zlatni Rat izlet"], price: 160, orig: 195 },
  { name: "Gastro otkriće", emoji: "🍽️", includes: ["Wine Tasting", "Cooking Class", "Konoba večera"], price: 125, orig: 145 },
];

const LOYALTY = { points: 345, tier: "Morski val", next: "Dalmatinac", nextPts: 500, code: "WEBER2026" };

const INTERESTS = [
  { k: "gastro", e: "🍷", l: "Gastronomija" }, { k: "adventure", e: "🏔️", l: "Avantura" },
  { k: "culture", e: "🏛️", l: "Kultura" }, { k: "beach", e: "🏖️", l: "Plaže" },
  { k: "wellness", e: "🧖", l: "Wellness" }, { k: "kids", e: "👨‍👩‍👧‍👦", l: "Obitelj" },
  { k: "nightlife", e: "🍸", l: "Noćni život" }, { k: "nature", e: "🌿", l: "Priroda" },
];

/* ─── COMPONENT ─── */
export default function JadranUnified() {
  const [phase, setPhase] = useState("pre"); // pre | kiosk | post
  const [subScreen, setSubScreen] = useState("onboard"); // varies per phase
  const [premium, setPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [interests, setInterests] = useState(new Set(["gastro", "adventure"]));
  const [transitProg, setTransitProg] = useState(35);
  const [kioskDay, setKioskDay] = useState(3);
  const [simHour, setSimHour] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [selectedExp, setSelectedExp] = useState(null);
  const [booked, setBooked] = useState(new Set());
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const chatEnd = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const hour = simHour ?? new Date().getHours();
  const timeCtx = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
  const daysLeft = 7 - kioskDay + 1;
  const budgetLeft = GUEST.budget - GUEST.spent;

  const tryPremium = (cb) => { if (premium) { cb(); } else { setShowPaywall(true); } };

  const doChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const sys = `Ti si JADRAN AI, 24/7 turistički concierge u Podstrani (blizu Splita), Hrvatska.
GOST: ${GUEST.name}, ${GUEST.country}, ${GUEST.adults} odraslih + ${GUEST.kids} djece (${GUEST.kidsAges.join(',')} god). Interesi: ${GUEST.interests.join(', ')}. ${GUEST.car ? 'Ima auto.' : 'Nema auto.'}
SMJEŠTAJ: ${GUEST.accommodation}. Domaćin: ${GUEST.host} (${GUEST.hostPhone}).
VRIJEME: ${W.temp}°C ${W.icon}, UV ${W.uv}, more ${W.sea}°C, zalazak ${W.sunset}. Dan: ${kioskDay}/7.
HIDDEN GEMS: ${GEMS.map(g => g.name).join(', ')}.
Odgovaraš na Deutsch (gost iz DE). Kratko (3-5 rečenica), toplo, konkretno s cijenama i udaljenostima. Emoji.`;
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys,
          messages: [...chatMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }] }),
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: "assistant", text: data.content?.map(c => c.text || "").join("") || "..." }]);
    } catch { setChatMsgs(p => [...p, { role: "assistant", text: "Verbindung nicht verfügbar. 🌊" }]); }
    setChatLoading(false);
  };

  /* ─── COLORS ─── */
  const C = {
    bg: "#060910", card: "#0C1018", accent: "#00B4D8", acDim: "rgba(0,180,216,0.1)",
    gold: "#C9A84C", goDim: "rgba(201,168,76,0.08)", text: "#E8E0D4", mut: "#6B6560",
    bord: "rgba(232,224,212,0.05)", red: "#EF4444", green: "#22C55E", grDim: "rgba(34,197,94,0.08)",
  };
  const dm = { fontFamily: "'Nunito Sans',sans-serif" };
  const fonts = <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Nunito+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />;

  /* ─── SHARED COMPONENTS ─── */
  const Badge = ({ c = "accent", children }) => (
    <span style={{ ...dm, display: "inline-block", padding: "3px 10px", borderRadius: 10, fontSize: 11, letterSpacing: 1,
      background: c === "accent" ? C.acDim : c === "gold" ? C.goDim : c === "green" ? C.grDim : "rgba(239,68,68,0.08)",
      color: c === "accent" ? C.accent : c === "gold" ? C.gold : c === "green" ? C.green : C.red }}>{children}</span>
  );
  const Btn = ({ primary, small, children, ...p }) => (
    <button {...p} style={{ padding: small ? "8px 16px" : "14px 24px", background: primary ? `linear-gradient(135deg,${C.accent},#0077B6)` : "transparent",
      border: primary ? "none" : `1px solid ${C.bord}`, borderRadius: 14, color: primary ? "#fff" : C.text,
      fontSize: small ? 13 : 16, fontFamily: "'Instrument Serif',serif", cursor: "pointer", fontWeight: primary ? 600 : 400, transition: "all 0.2s", ...(p.style || {}) }}>{children}</button>
  );
  const Card = ({ children, glow, style: sx, ...p }) => (
    <div {...p} style={{ background: C.card, borderRadius: 18, border: `1px solid ${glow ? "rgba(0,180,216,0.12)" : C.bord}`, padding: 20, transition: "all 0.3s", ...sx }}>{children}</div>
  );
  const SectionLabel = ({ children, extra }) => (
    <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>{children} {extra && <span style={{ color: C.accent }}>{extra}</span>}</div>
  );
  const BackBtn = ({ onClick }) => <button onClick={onClick} style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", padding: "12px 0" }}>← Natrag</button>;

  /* ─── PHASE NAVIGATION ─── */
  const PhaseNav = () => {
    const phases = [{ k: "pre", l: "Pre-Trip", i: "✈️" }, { k: "kiosk", l: "Kiosk · Boravak", i: "🏠" }, { k: "post", l: "Post-Stay", i: "💫" }];
    const idx = phases.findIndex(p => p.k === phase);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "16px 0", position: "relative" }}>
        <div style={{ position: "absolute", top: "50%", left: "8%", right: "8%", height: 2, background: C.bord, zIndex: 0 }} />
        <div style={{ position: "absolute", top: "50%", left: "8%", width: `${(idx / (phases.length - 1)) * 84}%`, height: 2, background: `linear-gradient(90deg,${C.accent},${C.gold})`, zIndex: 1, transition: "width 0.5s" }} />
        {phases.map((p, i) => (
          <div key={p.k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 2, cursor: "pointer" }}
            onClick={() => { setPhase(p.k); if (p.k === "pre") setSubScreen("onboard"); else if (p.k === "kiosk") setSubScreen("home"); else setSubScreen("summary"); }}>
            <div style={{ width: i === idx ? 48 : 38, height: i === idx ? 48 : 38, borderRadius: "50%", background: i === idx ? `linear-gradient(135deg,${C.accent},#0077B6)` : i < idx ? C.acDim : C.card, border: i === idx ? "none" : `2px solid ${i < idx ? C.accent : C.bord}`, display: "grid", placeItems: "center", fontSize: i === idx ? 22 : 17, transition: "all 0.3s", boxShadow: i === idx ? `0 0 24px rgba(0,180,216,0.25)` : "none" }}>{i < idx ? "✓" : p.i}</div>
            <div style={{ ...dm, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: i === idx ? C.accent : C.mut, fontWeight: i === idx ? 700 : 400 }}>{p.l}</div>
          </div>
        ))}
      </div>
    );
  };

  /* ─── PAYWALL ─── */
  const Paywall = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 28, maxWidth: 440, width: "100%", padding: "40px 32px", border: `1px solid rgba(201,168,76,0.15)`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>JADRAN AI Premium</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Otključajte AI vodič, skrivena mjesta, personalizirane preporuke i concierge booking za cijeli boravak.
        </div>
        <div style={{ background: C.goDim, borderRadius: 16, padding: "20px", border: `1px solid rgba(201,168,76,0.12)`, marginBottom: 20 }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: C.gold }}>4.99€</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>za cijeli boravak · jednokratno</div>
        </div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.8, marginBottom: 20, textAlign: "left" }}>
          ✓ AI Vodič — pitajte bilo što 24/7<br />
          ✓ 6 Hidden Gems sa locals tipovima<br />
          ✓ Personalizirane preporuke po vremenu i interesima<br />
          ✓ Concierge booking aktivnosti<br />
          ✓ Loyalty bodovi i popusti za sljedeći put
        </div>
        <Btn primary style={{ width: "100%", marginBottom: 10 }} onClick={() => { setPremium(true); setShowPaywall(false); }}>
          Otključaj Premium — 4.99€ →
        </Btn>
        <div style={{ ...dm, fontSize: 11, color: C.mut }}>Plaćanje putem Stripe · SIAL Consulting d.o.o.</div>
      </div>
    </div>
  );

  /* ─── BOOKING CONFIRM ─── */
  const BookConfirm = () => showConfirm && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", zIndex: 250, display: "grid", placeItems: "center" }} onClick={() => setShowConfirm(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 400, border: `1px solid rgba(0,180,216,0.15)` }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0077B6)`, display: "grid", placeItems: "center", fontSize: 36, margin: "0 auto 20px", color: "#fff" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>Rezervacija poslana!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          Potvrda unutar 30 min na vaš email.
        </div>
        <div style={{ fontSize: 18, color: C.accent, marginBottom: 4 }}>{showConfirm}</div>
        <Btn primary style={{ marginTop: 16 }} onClick={() => setShowConfirm(null)}>OK</Btn>
      </div>
    </div>
  );

  /* ══════════════════════════════
     PHASE 1: PRE-TRIP
     ══════════════════════════════ */
  const PreTrip = () => {
    if (subScreen === "onboard") return (
      <div style={{ maxWidth: 540, margin: "32px auto", textAlign: "center" }}>
        {onboardStep === 0 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌊</div>
            <div style={{ fontSize: 30, fontWeight: 400, marginBottom: 6 }}>Willkommen bei JADRAN AI</div>
            <div style={{ ...dm, color: C.mut, fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              Ihr Gastgeber <strong style={{ color: C.gold }}>{GUEST.host}</strong> nutzt JADRAN AI.<br />60 Sekunden → personalisierter Urlaub.
            </div>
            <Btn primary onClick={() => setOnboardStep(1)}>Profil erstellen →</Btn>
          </Card>
        )}
        {onboardStep === 1 && (
          <Card style={{ padding: 32 }}>
            <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>SCHRITT 1/2 — INTERESSEN</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>Was interessiert Sie?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {INTERESTS.map(opt => (
                <div key={opt.k} onClick={() => setInterests(p => { const n = new Set(p); n.has(opt.k) ? n.delete(opt.k) : n.add(opt.k); return n; })}
                  style={{ padding: "16px 8px", background: interests.has(opt.k) ? C.acDim : C.card, border: `1px solid ${interests.has(opt.k) ? "rgba(0,180,216,0.25)" : C.bord}`, borderRadius: 14, cursor: "pointer", textAlign: "center", ...dm, fontSize: 13, color: interests.has(opt.k) ? C.accent : C.mut, transition: "all 0.3s" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{opt.e}</span>{opt.l}
                </div>
              ))}
            </div>
            <Btn primary onClick={() => setOnboardStep(2)}>Weiter →</Btn>
          </Card>
        )}
        {onboardStep === 2 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>Profil erstellt!</div>
            <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              JADRAN AI bereitet Ihren personalisierten Urlaubsplan vor.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {[...interests].map(k => { const o = INTERESTS.find(x => x.k === k); return o ? <Badge key={k} c="accent">{o.e} {o.l}</Badge> : null; })}
            </div>
            <Btn primary onClick={() => setSubScreen("pretrip")}>Zum Pre-Trip →</Btn>
          </Card>
        )}
      </div>
    );

    if (subScreen === "pretrip") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 30, fontWeight: 400 }}>7 Tage bis zum Urlaub ☀️</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>12.–19. Juli 2026 · {GUEST.accommodation}</div>
        </div>
        <SectionLabel>WETTERVORHERSAGE</SectionLabel>
        <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
          {FORECAST.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: 12 }}>
              <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1 }}>{d.d}</div>
              <div style={{ fontSize: 22, margin: "4px 0" }}>{d.icon}</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>{d.h}°</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel extra="AI">OPTIMIRANI PLAN</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>Mittwoch regnerisch</strong> — Palast-Tour + Museum. <strong style={{ color: C.green }}>Donnerstag sonnig</strong> — Strandtag + Kayak.
              AI je optimizirao raspored prema vremenu.
            </div>
          </Card>
          <Card>
            <SectionLabel>PAKETI</SectionLabel>
            {BUNDLES.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < BUNDLES.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                <div><span style={{ marginRight: 8 }}>{b.emoji}</span><span style={{ ...dm, fontSize: 14 }}>{b.name}</span></div>
                <div><span style={{ color: C.accent, fontSize: 18, fontWeight: 300 }}>{b.price}€</span><span style={{ ...dm, fontSize: 12, color: C.mut, textDecoration: "line-through", marginLeft: 6 }}>{b.orig}€</span></div>
              </div>
            ))}
          </Card>
        </div>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Btn primary onClick={() => setSubScreen("transit")}>Simulation: Anreisetag →</Btn>
        </div>
      </>
    );

    if (subScreen === "transit") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 28, fontWeight: 400 }}>Gute Reise! 🚗</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>München → Podstrana · ~830 km</div>
        </div>
        {/* Map */}
        <div style={{ height: 160, borderRadius: 18, background: "linear-gradient(135deg,#1a2332,#0f1822)", position: "relative", overflow: "hidden", border: `1px solid ${C.bord}`, marginBottom: 16 }}>
          <div style={{ position: "absolute", top: "50%", left: "10%", right: "10%", height: 3, background: C.bord }} />
          <div style={{ position: "absolute", top: "50%", left: "10%", width: `${transitProg * 0.8}%`, height: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})`, transition: "width 0.4s" }} />
          <div style={{ position: "absolute", top: "calc(50% - 8px)", left: "8%", ...dm, fontSize: 12, color: C.mut }}>🇩🇪 München</div>
          <div style={{ position: "absolute", top: "calc(50% - 14px)", left: `calc(10% + ${transitProg * 0.8}% - 14px)`, fontSize: 28, transition: "left 0.4s" }}>🚗</div>
          <div style={{ position: "absolute", top: "calc(50% - 10px)", right: "6%", fontSize: 22 }}>🏖️</div>
        </div>
        <input type="range" min={0} max={100} value={transitProg} onChange={e => setTransitProg(+e.target.value)} style={{ width: "100%", accentColor: C.accent, marginBottom: 16 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel>UNTERWEGS</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
              {transitProg < 40 && "🍽️ Ljubljana za 2h — preporučujemo Gostilna Pri Lojzetu. ⛽ Zadnja jeftina pumpa prije HR granice."}
              {transitProg >= 40 && transitProg < 75 && "🎫 HR maut: ~28€ do Splita. ENC preporučen. 📱 A1 HR SIM za 7€ u prvoj benzinskoj."}
              {transitProg >= 75 && `🏖️ Još ~45 min! Domaćin ${GUEST.host} obaviješten. 🛒 Konzum 400m od apartmana za prvi shopping.`}
            </div>
          </Card>
          <Card>
            <SectionLabel>ANKUNFT</SectionLabel>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>☀️</div>
              <div style={{ fontSize: 32, fontWeight: 300 }}>31°</div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>Sonnig · Meer 25°C</div>
              <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 8 }}>🌅 Sonnenuntergang 20:47</div>
            </div>
          </Card>
        </div>
        <div style={{ textAlign: "center" }}>
          <Btn primary onClick={() => { setPhase("kiosk"); setSubScreen("home"); }}>Angekommen! → Kiosk starten</Btn>
        </div>
      </>
    );
  };

  /* ══════════════════════════════
     PHASE 2: KIOSK (STAY)
     ══════════════════════════════ */
  const KioskHome = () => {
    const greeting = hour < 6 ? "Gute Nacht" : hour < 12 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : hour < 22 ? "Guten Abend" : "Gute Nacht";
    const tipIcon = hour < 6 ? "🌙" : hour < 12 ? "☕" : hour < 18 ? "🏖️" : hour < 22 ? "🍷" : "🌙";
    const tip = hour < 6 ? "Morgen sonnig. Alarm für 8h empfohlen. WiFi: VillaMarija-5G / jadran2026."
      : hour < 12 ? "Perfekt für Strand Kašjuni — vor 10h kommen. Pekara Bobis (250m) hat frischen Burek ab 6h!"
      : hour < 18 ? `UV ${W.uv} — Schatten suchen bis 16h! Dioklecijanova Palača oder Konzum Einkauf ideal.`
      : hour < 22 ? `Sonnenuntergang ${W.sunset}. Konoba Stari Mlin (15min) — rufen Sie einen Tag vorher an!`
      : "Gute Nacht. Morgen sonnig, Meer 25°C.";

    return (
      <>
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ ...dm, fontSize: 12, color: C.mut, letterSpacing: 2, textTransform: "uppercase" }}>
            {tipIcon} {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} · Tag {kioskDay}/7
          </div>
          <div style={{ fontSize: 32, fontWeight: 400, marginTop: 6 }}>
            {greeting}, <span style={{ color: C.gold }}>{GUEST.first}</span>
          </div>
        </div>

        {/* Weather + UV + time sim */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 36 }}>{W.icon}</span><span style={{ fontSize: 44, fontWeight: 300 }}>{W.temp}°</span>
            </div>
            <div style={{ width: 1, height: 40, background: C.bord }} />
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.6 }}>
              Meer: <strong style={{ color: C.accent }}>{W.sea}°C</strong> · {W.wind}<br />
              UV: <strong style={{ color: W.uv >= 8 ? C.red : C.gold }}>{W.uv}</strong>{W.uv >= 8 && <span style={{ color: C.red }}> SPF50+!</span>} · 🌅 {W.sunset}
            </div>
          </Card>
          <Card style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 18px", minWidth: 180 }}>
            <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 1 }}>⏰ SIMULACIJA</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[{ h: null, l: "Sada" }, { h: 7, l: "07" }, { h: 13, l: "13" }, { h: 19, l: "19" }, { h: 23, l: "23" }].map(t => (
                <button key={t.l} onClick={() => setSimHour(t.h)} style={{ ...dm, padding: "5px 10px", background: simHour === t.h ? C.acDim : "transparent", border: `1px solid ${simHour === t.h ? "rgba(0,180,216,0.2)" : C.bord}`, borderRadius: 8, color: simHour === t.h ? C.accent : C.mut, fontSize: 11, cursor: "pointer" }}>{t.l}</button>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Tip */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.goDim},rgba(0,180,216,0.03))`, borderColor: "rgba(201,168,76,0.1)", marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28 }}>{tipIcon}</div>
          <div>
            <div style={{ ...dm, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>AI EMPFEHLUNG</div>
            <div style={{ ...dm, fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 300 }}>{tip}</div>
            {GUEST.kids > 0 && hour >= 12 && hour < 18 && <div style={{ ...dm, fontSize: 13, color: C.accent, marginTop: 6 }}>👨‍👩‍👧‍👦 Mit Kindern: Bačvice (Sand, flaches Wasser) ist perfekt!</div>}
          </div>
        </Card>

        {/* Budget */}
        <Card style={{ marginBottom: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ ...dm, fontSize: 11, color: C.mut }}>BUDGET </span><span style={{ fontSize: 20, fontWeight: 300 }}>{GUEST.spent}€</span><span style={{ ...dm, fontSize: 13, color: C.mut }}> / {GUEST.budget}€</span></div>
            <div style={{ ...dm, fontSize: 13, color: C.accent }}>{budgetLeft}€ übrig · ~{Math.round(budgetLeft / daysLeft)}€/Tag</div>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: C.bord, overflow: "hidden", marginTop: 8 }}>
            <div style={{ height: "100%", width: `${(GUEST.spent / GUEST.budget * 100)}%`, borderRadius: 3, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
        </Card>

        {/* Quick tiles */}
        <SectionLabel>BRZI PRISTUP</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { k: "parking", e: "🅿️", l: "Parking" }, { k: "beach", e: "🏖️", l: "Plaže" },
            { k: "sun", e: "☀️", l: "Sunce" }, { k: "routes", e: "🗺️", l: "Rute" },
            { k: "food", e: "🍽️", l: "Hrana" }, { k: "emergency", e: "🏥", l: "Hitno" },
            { k: "gems", e: "💎", l: "Hidden Gems" }, { k: "chat", e: "🤖", l: "AI Vodič" },
          ].map(t => (
            <div key={t.k} onClick={() => {
              if (t.k === "gems") tryPremium(() => setSubScreen("gems"));
              else if (t.k === "chat") tryPremium(() => setSubScreen("chat"));
              else setSubScreen(t.k);
            }}
              style={{ background: C.card, borderRadius: 18, padding: "22px 12px", textAlign: "center", cursor: "pointer", border: `1px solid ${C.bord}`, transition: "all 0.3s", position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,180,216,0.15)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{t.e}</div>
              <div style={{ ...dm, fontSize: 13, fontWeight: 600 }}>{t.l}</div>
              {(t.k === "gems" || t.k === "chat") && !premium && <div style={{ position: "absolute", top: 8, right: 8, ...dm, fontSize: 9, color: C.gold, background: C.goDim, padding: "2px 6px", borderRadius: 6 }}>PRO</div>}
            </div>
          ))}
        </div>

        {/* Experiences */}
        <SectionLabel extra="BUCHEN">AKTIVITÄTEN</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {EXPERIENCES.map(exp => (
            <Card key={exp.id} style={{ padding: 0, overflow: "hidden", cursor: "pointer", opacity: booked.has(exp.id) ? 0.5 : 1 }}
              onClick={() => !booked.has(exp.id) && setSelectedExp(exp)}>
              <div style={{ height: 60, background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, display: "grid", placeItems: "center", fontSize: 32 }}>{exp.emoji}</div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{exp.name}</div>
                <div style={{ ...dm, display: "flex", justifyContent: "space-between", fontSize: 12, color: C.mut }}>
                  <span>⏱{exp.dur} · ⭐{exp.rating}</span>
                  <span style={{ color: C.accent, fontSize: 16, fontWeight: 300 }}>{exp.ourPrice}€</span>
                </div>
                {booked.has(exp.id) && <Badge c="green">✓ Gebucht</Badge>}
              </div>
            </Card>
          ))}
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <Btn onClick={() => { setPhase("post"); setSubScreen("summary"); }}>Simulation: Check-out →</Btn>
        </div>
      </>
    );
  };

  const KioskDetail = () => {
    const data = PRACTICAL[subScreen];
    if (!data) return null;
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{data.icon}</span>
          <div style={{ fontSize: 28, fontWeight: 400 }}>{data.title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.items.map((it, i) => (
            <Card key={i} style={{ borderColor: it.warn ? "rgba(239,68,68,0.12)" : it.free ? "rgba(34,197,94,0.12)" : C.bord, display: "flex", gap: 14, alignItems: "flex-start" }}>
              {it.warn && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, marginTop: 8, flexShrink: 0 }} />}
              {it.free && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, marginTop: 8, flexShrink: 0 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{it.n}</div>
                <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>
                  {it.note}
                  {it.d && <span style={{ color: C.accent, marginLeft: 8 }}>{it.d}</span>}
                  {it.price && <span style={{ color: C.text, marginLeft: 8 }}>{it.price}</span>}
                  {it.type && <span style={{ marginLeft: 8 }}>{it.type}</span>}
                </div>
                {it.affiliate && <Badge c="gold">AFFILIATE · {it.link || "booking link"}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const KioskGems = () => (
    <>
      <BackBtn onClick={() => setSubScreen("home")} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 36 }}>💎</span>
        <div><div style={{ fontSize: 28, fontWeight: 400 }}>Hidden Gems</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>Lokalni znaju — turisti ne</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginTop: 20 }}>
        {GEMS.map((g, i) => (
          <Card key={i} style={{ cursor: "pointer", position: "relative" }}
            onClick={() => { if (g.premium && !premium) setShowPaywall(true); else setSelectedGem(g); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
            {g.premium && !premium && <div style={{ position: "absolute", inset: 0, background: "rgba(6,9,16,0.7)", borderRadius: 18, display: "grid", placeItems: "center", zIndex: 5 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🔒</div><div style={{ ...dm, fontSize: 12, color: C.gold }}>Premium</div></div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{g.emoji}</span>
              <Badge c="gold">{g.type.toUpperCase()}</Badge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{g.name}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>{g.desc.substring(0, 90)}...</div>
            <div style={{ ...dm, display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: C.mut }}>
              <span>⏰ {g.best}</span><span>📍 {g.diff}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const KioskChat = () => {
    const prompts = ["Was heute mit Kindern?", "Geheime Strände?", "Abendessen-Tipp?", "Wo parken in Split?"];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)" }}>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {chatMsgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>Ihr 24/7 Reiseführer</div>
              <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 20 }}>Fragen Sie alles über Dalmatien</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => setChatInput(p)} style={{ ...dm, padding: "10px 16px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, borderRadius: 14, color: C.text, fontSize: 14, cursor: "pointer" }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? C.acDim : "rgba(232,224,212,0.04)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.6, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(0,180,216,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
              {m.role !== "user" && <div style={{ fontSize: 10, color: C.accent, marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>JADRAN AI</div>}
              {m.text}
            </div>
          ))}
          {chatLoading && <div style={{ ...dm, maxWidth: "78%", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, opacity: 0.5 }}>● ● ●</div>}
          <div ref={chatEnd} />
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: `1px solid ${C.bord}` }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doChat()}
            placeholder="Fragen Sie..." style={{ ...dm, flex: 1, padding: "14px 18px", background: "rgba(232,224,212,0.04)", border: `1px solid ${C.bord}`, borderRadius: 18, color: C.text, fontSize: 16, outline: "none" }} />
          <button onClick={doChat} style={{ padding: "14px 24px", background: `linear-gradient(135deg,${C.accent},#0077B6)`, border: "none", borderRadius: 18, color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 600 }}>→</button>
        </div>
      </div>
    );
  };

  const Kiosk = () => {
    if (subScreen === "home") return <KioskHome />;
    if (subScreen === "gems") return <KioskGems />;
    if (subScreen === "chat") return <KioskChat />;
    if (PRACTICAL[subScreen]) return <KioskDetail />;
    return <KioskHome />;
  };

  /* ══════════════════════════════
     PHASE 3: POST-STAY
     ══════════════════════════════ */
  const PostStay = () => (
    <>
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🌅</div>
        <div style={{ fontSize: 30, fontWeight: 400 }}>Hvala, {GUEST.first}!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          7 Tage · {EXPERIENCES.filter(e => booked.has(e.id)).length + 2} Aktivitäten · {GUEST.spent}€ · Unvergesslich
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Loyalty */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, borderColor: "rgba(0,180,216,0.1)" }}>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.gold, marginBottom: 4 }}>JADRAN LOYALTY</div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>🌊 {LOYALTY.tier}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, marginTop: 8 }}>
            {LOYALTY.points} Punkte → <strong style={{ color: C.gold }}>{LOYALTY.next}</strong> ({LOYALTY.nextPts})
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", overflow: "hidden", margin: "12px 0 6px" }}>
            <div style={{ height: "100%", width: `${(LOYALTY.points / LOYALTY.nextPts) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>Noch {LOYALTY.nextPts - LOYALTY.points} Punkte</div>
        </Card>

        {/* Revenue summary (admin view) */}
        <Card>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8 }}>💰 PRIHOD (admin)</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 2 }}>
            Premium: <strong style={{ color: C.green }}>4.99€</strong><br />
            Concierge marža: <strong style={{ color: C.green }}>~{EXPERIENCES.filter(e => booked.has(e.id)).reduce((s, e) => s + (e.ourPrice - e.price), 0) + 30}€</strong><br />
            Affiliate klikovi: <strong style={{ color: C.green }}>~8-12€</strong><br />
            <span style={{ borderTop: `1px solid ${C.bord}`, display: "block", paddingTop: 4, marginTop: 4 }}>
              UKUPNO po gostu: <strong style={{ color: C.gold, fontSize: 18 }}>~{55 + EXPERIENCES.filter(e => booked.has(e.id)).reduce((s, e) => s + (e.ourPrice - e.price), 0)}€</strong>
            </span>
          </div>
        </Card>
      </div>

      {/* Referral */}
      <Card style={{ textAlign: "center", border: `1px dashed rgba(0,180,216,0.15)`, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>Freunde einladen — 15% Rabatt</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 8 }}>Beide erhalten Rabatt auf die nächste Buchung</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: C.accent, margin: "10px 0" }}>{LOYALTY.code}</div>
        <Btn primary>Code teilen →</Btn>
      </Card>

      {/* Rebooking */}
      <Card style={{ textAlign: "center", padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>Nächstes Jahr? 🏖️</div>
        <div style={{ ...dm, fontSize: 14, color: C.mut, marginBottom: 16, lineHeight: 1.6 }}>
          Early Bird 2027: <strong style={{ color: C.accent }}>20% Rabatt</strong> bei Buchung vor 1. Oktober.
        </div>
        <Btn primary>Sommer 2027 planen →</Btn>
      </Card>

      {/* Monetization breakdown (admin) */}
      <Card style={{ background: `linear-gradient(135deg,rgba(201,168,76,0.04),rgba(0,180,216,0.03))`, borderColor: "rgba(201,168,76,0.08)" }}>
        <SectionLabel extra="ADMIN">MONETIZACIJA — BEZ UGOVORA</SectionLabel>
        <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
          <strong style={{ color: C.text }}>1. Premium fee (4.99€)</strong> — Gost plaća Stripe-om. Zero ugovora.<br />
          <strong style={{ color: C.text }}>2. Concierge marža (~15-25€/aktivnost)</strong> — Bookiraš po nižoj cijeni, prodaješ višu. Gost ne zna razliku, dobiva bolju uslugu.<br />
          <strong style={{ color: C.text }}>3. Affiliate (4-8% po kliku/bookingu)</strong> — Jadrolinija, GetYourGuide, Booking. Automatski prihod.<br />
          <strong style={{ color: C.text }}>4. Host fee (20€/mj neformalno)</strong> — "Tablet servis" — Srđan dogovori na licu mjesta.<br />
          <br />
          <span style={{ color: C.gold }}>📊 Projekcija:</span> 30 apartmana × 4 gosta/mj × 50€/gost = <strong style={{ color: C.green, fontSize: 18 }}>6.000€/mj</strong> u sezoni.
        </div>
      </Card>
    </>
  );

  /* ═══ MAIN RENDER ═══ */
  return (
    <div style={{ fontFamily: "'Instrument Serif','Georgia',serif", background: C.bg, color: C.text, minHeight: "100vh", position: "relative" }}>
      {fonts}
      <div style={{ position: "fixed", inset: 0, background: `radial-gradient(ellipse at 30% 20%,rgba(0,180,216,0.05) 0%,transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(201,168,76,0.03) 0%,transparent 50%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${C.bord}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0077B6)`, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>J</div>
            <div style={{ fontSize: 18, fontWeight: 400, letterSpacing: 5, textTransform: "uppercase", color: C.accent }}>Jadran</div>
            <span style={{ ...dm, fontSize: 9, color: C.accent, letterSpacing: 2, opacity: 0.6 }}>AI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {premium && <Badge c="gold">⭐ PREMIUM</Badge>}
            <div style={{ ...dm, textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{GUEST.flag} {GUEST.name}</div>
              <div style={{ fontSize: 11, color: C.mut }}>{GUEST.accommodation}</div>
            </div>
          </div>
        </div>

        {/* Phase Nav */}
        <PhaseNav />

        {/* Content */}
        {phase === "pre" && <PreTrip />}
        {phase === "kiosk" && <Kiosk />}
        {phase === "post" && <PostStay />}

        <div style={{ ...dm, textAlign: "center", padding: "20px 0 28px", fontSize: 10, color: "rgba(107,101,96,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          JADRAN AI · SIAL Consulting d.o.o. · Claude + Gemini · v4.0
        </div>
      </div>

      {/* Overlays */}
      {showPaywall && <Paywall />}
      {showConfirm && <BookConfirm />}

      {/* Gem detail */}
      {selectedGem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedGem(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, border: `1px solid rgba(201,168,76,0.12)` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedGem.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedGem.name}</div>
            <div style={{ ...dm, fontSize: 15, color: C.mut, lineHeight: 1.8, marginBottom: 20 }}>{selectedGem.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[{ l: "Najbolje doba", v: selectedGem.best }, { l: "Težina", v: selectedGem.diff }].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut }}>{x.l}</div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 600 }}>{x.v}</div>
                </div>
              ))}
            </div>
            <Card glow style={{ background: C.goDim, borderColor: "rgba(201,168,76,0.12)" }}>
              <div style={{ ...dm, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 LOCALS TIP</div>
              <div style={{ ...dm, fontSize: 14, lineHeight: 1.6 }}>{selectedGem.tip}</div>
            </Card>
            <Btn style={{ width: "100%", marginTop: 16 }} onClick={() => setSelectedGem(null)}>Zatvori</Btn>
          </div>
        </div>
      )}

      {/* Experience booking */}
      {selectedExp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedExp(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, maxWidth: 440, width: "100%", padding: 32, border: `1px solid ${C.bord}` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedExp.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedExp.name}</div>
            <div style={{ ...dm, display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 13, color: C.mut }}>
              <span>⏱ {selectedExp.dur}</span><span>⭐ {selectedExp.rating}</span><span>🎫 {selectedExp.spots} mjesta</span>
            </div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>{selectedExp.ourPrice}€</div>
              <div style={{ ...dm, fontSize: 12, color: C.mut }}>pro Person · Transfer uključen</div>
              {GUEST.kids > 0 && <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 4 }}>Familie: ~{selectedExp.ourPrice * 2 + Math.round(selectedExp.ourPrice * 0.5 * 2)}€</div>}
            </div>
            <div style={{ ...dm, fontSize: 11, color: C.mut, textAlign: "center", marginBottom: 16, padding: "8px", background: "rgba(0,0,0,0.15)", borderRadius: 10 }}>
              💰 Marža: {selectedExp.ourPrice - selectedExp.price}€/osobi (admin info)
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setSelectedExp(null)}>Zurück</Btn>
              <Btn primary style={{ flex: 1 }} onClick={() => { setBooked(p => new Set([...p, selectedExp.id])); setShowConfirm(selectedExp.name); setSelectedExp(null); }}>Buchen →</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
