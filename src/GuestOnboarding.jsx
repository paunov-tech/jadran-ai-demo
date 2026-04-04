// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Guest Onboarding (Blok 1 - Production)
// QR scan → jadran.ai?room=XXXX → 3-step form → Firestore
// Uses existing guestStore.js for persistence
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { saveGuest } from "./guestStore";

/* ── COUNTRIES ── */
const COUNTRIES = [
  { code: "DE", flag: "🇩🇪", name: "Deutschland" },
  { code: "AT", flag: "🇦🇹", name: "Österreich" },
  { code: "HR", flag: "🇭🇷", name: "Hrvatska" },
  { code: "EN", flag: "🇬🇧", name: "UK" },
  { code: "US", flag: "🇺🇸", name: "USA" },
  { code: "IT", flag: "🇮🇹", name: "Italia" },
  { code: "SI", flag: "🇸🇮", name: "Slovenija" },
  { code: "CZ", flag: "🇨🇿", name: "Česko" },
  { code: "PL", flag: "🇵🇱", name: "Polska" },
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "NL", flag: "🇳🇱", name: "Nederland" },
  { code: "HU", flag: "🇭🇺", name: "Magyar" },
  { code: "RS", flag: "🇷🇸", name: "Srbija" },
  { code: "BA", flag: "🇧🇦", name: "BiH" },
  { code: "OTHER", flag: "🌍", name: "Other" },
];

/* ── INTERESTS ── */
const INTERESTS = [
  { id: "beach", emoji: "🏖️", l: { hr:"Plaže", en:"Beaches", de:"Strände", it:"Spiagge", si:"Plaže", cz:"Pláže", pl:"Plaże" }},
  { id: "gastro", emoji: "🍽️", l: { hr:"Hrana i vino", en:"Food & Wine", de:"Essen & Wein", it:"Cibo & Vino", si:"Hrana in vino", cz:"Jídlo a víno", pl:"Jedzenie" }},
  { id: "culture", emoji: "🏛️", l: { hr:"Kultura", en:"Culture", de:"Kultur", it:"Cultura", si:"Kultura", cz:"Kultura", pl:"Kultura" }},
  { id: "nature", emoji: "🌿", l: { hr:"Priroda", en:"Nature", de:"Natur", it:"Natura", si:"Narava", cz:"Příroda", pl:"Natura" }},
  { id: "adventure", emoji: "🚴", l: { hr:"Avantura", en:"Adventure", de:"Abenteuer", it:"Avventura", si:"Pustolovščina", cz:"Dobrodružství", pl:"Przygoda" }},
  { id: "family", emoji: "👨‍👩‍👧‍👦", l: { hr:"Obitelj", en:"Family", de:"Familie", it:"Famiglia", si:"Družina", cz:"Rodina", pl:"Rodzina" }},
  { id: "nightlife", emoji: "🎶", l: { hr:"Noćni život", en:"Nightlife", de:"Nachtleben", it:"Vita notturna", si:"Nočno življenje", cz:"Noční život", pl:"Życie nocne" }},
  { id: "diving", emoji: "🤿", l: { hr:"Ronjenje", en:"Diving", de:"Tauchen", it:"Immersioni", si:"Potapljanje", cz:"Potápění", pl:"Nurkowanie" }},
  { id: "sailing", emoji: "⛵", l: { hr:"Jedrenje", en:"Sailing", de:"Segeln", it:"Vela", si:"Jadranje", cz:"Jachting", pl:"Żeglarstwo" }},
  { id: "wellness", emoji: "🧘", l: { hr:"Wellness", en:"Wellness", de:"Wellness", it:"Benessere", si:"Wellness", cz:"Wellness", pl:"Wellness" }},
  { id: "shopping", emoji: "🛍️", l: { hr:"Shopping", en:"Shopping", de:"Einkaufen", it:"Shopping", si:"Nakupovanje", cz:"Nákupy", pl:"Zakupy" }},
  { id: "photo", emoji: "📸", l: { hr:"Foto", en:"Photo", de:"Foto", it:"Foto", si:"Foto", cz:"Foto", pl:"Foto" }},
];

/* ── i18n ── */
const TX = {
  hr: { welcome:"Dobrodošli!", sub:"Vaš osobni turistički vodič za Jadran", s1:"Tko ste vi?", s2:"Kada dolazite?", s3:"Što vas zanima?", name:"Ime (npr. Familie Weber)", country:"Zemlja", cin:"Dolazak", cout:"Odlazak", adults:"Odrasli", kids:"Djeca", next:"Dalje", back:"Natrag", go:"Započni avanturu!", pick2:"Odaberite barem 2 interesa", nights:"noći", saving:"Pripremamo vaš doživljaj..." },
  en: { welcome:"Welcome!", sub:"Your personal guide to the perfect Adriatic getaway", s1:"Who are you?", s2:"When are you visiting?", s3:"What interests you?", name:"Name (e.g. Familie Weber)", country:"Country", cin:"Check-in", cout:"Check-out", adults:"Adults", kids:"Children", next:"Next", back:"Back", go:"Start your adventure!", pick2:"Pick at least 2 interests", nights:"nights", saving:"Preparing your experience..." },
  de: { welcome:"Willkommen!", sub:"Ihr persönlicher Reiseberater für die Adria", s1:"Wer sind Sie?", s2:"Wann kommen Sie?", s3:"Was interessiert Sie?", name:"Name (z.B. Familie Weber)", country:"Land", cin:"Anreise", cout:"Abreise", adults:"Erwachsene", kids:"Kinder", next:"Weiter", back:"Zurück", go:"Abenteuer starten!", pick2:"Mindestens 2 Interessen wählen", nights:"Nächte", saving:"Wir bereiten Ihr Erlebnis vor..." },
  it: { welcome:"Benvenuti!", sub:"La vostra guida personale per la vacanza perfetta sull'Adriatico", s1:"Chi siete?", s2:"Quando arrivate?", s3:"Cosa vi interessa?", name:"Nome (es. Famiglia Weber)", country:"Paese", cin:"Arrivo", cout:"Partenza", adults:"Adulti", kids:"Bambini", next:"Avanti", back:"Indietro", go:"Inizia l'avventura!", pick2:"Almeno 2 interessi", nights:"notti", saving:"Prepariamo la vostra esperienza..." },
  si: { welcome:"Dobrodošli!", sub:"Vaš osebni turistični vodič za Jadran", s1:"Kdo ste?", s2:"Kdaj prihajate?", s3:"Kaj vas zanima?", name:"Ime (npr. Družina Weber)", country:"Država", cin:"Prihod", cout:"Odhod", adults:"Odrasli", kids:"Otroci", next:"Naprej", back:"Nazaj", go:"Začnite avanturo!", pick2:"Izberite vsaj 2", nights:"noči", saving:"Pripravljamo..." },
  cz: { welcome:"Vítejte!", sub:"Váš osobní průvodce na dovolenou", s1:"Kdo jste?", s2:"Kdy přijedete?", s3:"Co vás zajímá?", name:"Jméno", country:"Země", cin:"Příjezd", cout:"Odjezd", adults:"Dospělí", kids:"Děti", next:"Další", back:"Zpět", go:"Začněte!", pick2:"Vyberte 2+", nights:"nocí", saving:"Připravujeme..." },
  pl: { welcome:"Witajcie!", sub:"Wasz osobisty przewodnik na urlop", s1:"Kim jesteście?", s2:"Kiedy?", s3:"Co was interesuje?", name:"Imię", country:"Kraj", cin:"Przyjazd", cout:"Wyjazd", adults:"Dorośli", kids:"Dzieci", next:"Dalej", back:"Wstecz", go:"Start!", pick2:"Wybierz 2+", nights:"nocy", saving:"Przygotowujemy..." },
};
TX.at = { ...TX.de }; // AT = standard Hochdeutsch, identical to DE

function langFromCountry(c) { return { DE:"de",AT:"at",HR:"hr",IT:"it",SI:"si",CZ:"cz",PL:"pl" }[c] || "en"; }

/* ── COMPONENT ── */
export default function GuestOnboarding({ roomCode, onComplete }) {
  const track = (event, props) => { try { window.plausible?.(event, { props }); } catch {} };

  const [step, setStep] = useState(0);
  const [lang, setLang] = useState("en");
  const [saving, setSaving] = useState(false);
  const [anim, setAnim] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [interests, setInterests] = useState([]);

  useEffect(() => { const t = setTimeout(() => setAnim(true), 100); track("GuestOnboardingStarted", { roomCode }); return () => clearTimeout(t); }, [roomCode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (country) setLang(langFromCountry(country)); }, [country]);

  const t = TX[lang] || TX.en;
  const toggleI = id => setInterests(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);

  const canGo = step === 0 ? name.trim().length >= 2 && country
    : step === 1 ? checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
    : interests.length >= 2;

  const nights = checkIn && checkOut && new Date(checkOut) > new Date(checkIn)
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;

  // Compute phase from dates
  const computePhase = () => {
    const now = new Date();
    if (now < new Date(checkIn)) return "pre";
    if (now <= new Date(checkOut)) return "kiosk";
    return "post";
  };

  const finish = async () => {
    setSaving(true);
    const countryObj = COUNTRIES.find(c => c.code === country);
    const guestData = {
      name: name.trim(),
      first: name.trim().split(" ")[0],
      country,
      flag: countryObj?.flag || "🌍",
      lang,
      arrival: checkIn,
      departure: checkOut,
      adults,
      kids,
      kidsAges: [],
      interests: [...interests],
      car: false,
      accommodation: "",
      host: "",
      hostPhone: "",
      budget: 1200,
      spent: 0,
      email: "",
      phase: computePhase(),
      premium: false,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveGuest(roomCode, guestData);
      track("GuestOnboardingCompleted", { roomCode, country: guestData.country });
      fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "checkin", guestName: guestData.name, roomCode, dates: `${checkIn}–${checkOut}` }),
      }).catch(() => {});
      setTimeout(() => onComplete(guestData), 800);
    } catch (err) {
      console.error("Save error:", err);
      setSaving(false);
    }
  };

  // ── Saving overlay ──
  if (saving) return (
    <div style={S.wrap}>
      <div style={S.bgGrad} />
      <div style={{ position:"relative", zIndex:10, textAlign:"center" }}>
        <div style={{ fontSize:60, animation:"obFloat 2s ease-in-out infinite" }}>🌊</div>
        <div style={{ fontSize:20, fontWeight:700, color:"#fff", marginTop:16 }}>{t.saving}</div>
        <div style={{ width:180, height:4, borderRadius:2, background:"rgba(255,255,255,0.1)", marginTop:20, overflow:"hidden", margin:"20px auto 0" }}>
          <div style={{ height:"100%", borderRadius:2, background:"linear-gradient(90deg,#0ea5e9,#06b6d4)", animation:"obProg 1.5s ease-out forwards" }} />
        </div>
      </div>
      <style>{ANIMS}</style>
    </div>
  );

  // ── Main ──
  return (
    <div style={S.wrap}>
      <div style={S.bgGrad} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40%", background:"linear-gradient(0deg,rgba(14,165,233,0.06),transparent)", animation:"obWave 6s ease-in-out infinite" }} />

      <div style={{ position:"relative", zIndex:10, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100dvh", padding:16 }}>
        <div style={{
          width:"min(420px,92vw)", maxHeight:"90vh", overflowY:"auto",
          background:"rgba(15,30,50,0.85)", backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
          border:"1px solid rgba(255,255,255,0.08)", borderRadius:24,
          padding:"32px 28px 24px", position:"relative",
          boxShadow:"0 32px 80px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.05)",
          opacity: anim?1:0, transform: anim?"translateY(0)":"translateY(20px)",
          transition:"all 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", fontFamily:"'Outfit','DM Sans',system-ui,sans-serif", marginBottom:6 }}>
              🌊 JADRAN
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:"#7dd3fc", fontFamily:"'Outfit',sans-serif", marginBottom:4 }}>{t.welcome}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.4, fontFamily:"'Outfit',sans-serif" }}>{t.sub}</div>
          </div>

          {/* Progress dots */}
          <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:20 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height:8, borderRadius:i===step?4:"50%", width:i===step?32:8, background:i<=step?"#0ea5e9":"rgba(255,255,255,0.15)", transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)" }} />
            ))}
          </div>

          <div style={{ fontSize:15, fontWeight:600, color:"#e0f2fe", marginBottom:16, textAlign:"center", fontFamily:"'Outfit',sans-serif" }}>
            {step===0?t.s1:step===1?t.s2:t.s3}
          </div>

          {/* ── STEP 0: Identity ── */}
          {step===0 && <div>
            <input type="text" placeholder={t.name} value={name} onChange={e=>setName(e.target.value)}
              style={S.input} autoFocus
              onFocus={e=>e.target.style.borderColor="rgba(14,165,233,0.5)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
            />
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"16px 0 8px", fontFamily:"'Outfit',sans-serif" }}>{t.country}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(60px, 1fr))", gap:6 }}>
              {COUNTRIES.map(c => (
                <button key={c.code} onClick={()=>setCountry(c.code)} style={{
                  display:"flex", flexDirection:"column", alignItems:"center", padding:"8px 2px", borderRadius:12,
                  border:`1px solid ${country===c.code?"#0ea5e9":"rgba(255,255,255,0.08)"}`,
                  background:country===c.code?"rgba(14,165,233,0.2)":"rgba(255,255,255,0.03)",
                  cursor:"pointer", transition:"all 0.2s", transform:country===c.code?"scale(1.08)":"scale(1)",
                  fontFamily:"inherit",
                }}>
                  <span style={{ fontSize:22 }}>{c.flag}</span>
                  <span style={{ fontSize:8, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>}

          {/* ── STEP 1: Dates ── */}
          {step===1 && <div>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <label style={S.label}>{t.cin}</label>
                <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} style={S.dateInput} />
              </div>
              <div style={{ fontSize:18, color:"rgba(255,255,255,0.2)", paddingTop:28, fontFamily:"'Outfit',sans-serif" }}>→</div>
              <div style={{ flex:1 }}>
                <label style={S.label}>{t.cout}</label>
                <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} style={S.dateInput} />
              </div>
            </div>
            {nights > 0 && (
              <div style={{ textAlign:"center", marginTop:16 }}>
                <span style={{ padding:"8px 20px", borderRadius:20, background:"rgba(14,165,233,0.12)", color:"#7dd3fc", fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif" }}>
                  🌙 {nights} {t.nights}
                </span>
              </div>
            )}
            <div style={{ display:"flex", gap:16, marginTop:24 }}>
              {[[t.adults, adults, setAdults, 1, 10], [t.kids, kids, setKids, 0, 8]].map(([label, val, set, min, max]) => (
                <div key={label} style={{ flex:1, textAlign:"center", padding:"16px 12px", borderRadius:16, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:10, fontFamily:"'Outfit',sans-serif" }}>{label}</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:14 }}>
                    <button onClick={()=>set(Math.max(min,val-1))} style={S.cBtn}>−</button>
                    <span style={{ fontSize:22, fontWeight:700, color:"#fff", minWidth:24, textAlign:"center" }}>{val}</span>
                    <button onClick={()=>set(Math.min(max,val+1))} style={S.cBtn}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* ── STEP 2: Interests ── */}
          {step===2 && <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:12, fontFamily:"'Outfit',sans-serif" }}>{t.pick2}</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {INTERESTS.map(i => {
                const sel = interests.includes(i.id);
                return (
                  <button key={i.id} onClick={()=>toggleI(i.id)} style={{
                    display:"flex", flexDirection:"column", alignItems:"center",
                    padding:"14px 6px", borderRadius:16,
                    border:`1px solid ${sel?"#0ea5e9":"rgba(255,255,255,0.06)"}`,
                    background:sel?"rgba(14,165,233,0.15)":"rgba(255,255,255,0.03)",
                    cursor:"pointer", transition:"all 0.2s", fontFamily:"inherit",
                    transform:sel?"scale(1.04)":"scale(1)",
                  }}>
                    <span style={{ fontSize:26 }}>{i.emoji}</span>
                    <span style={{ fontSize:10, color:sel?"#7dd3fc":"rgba(255,255,255,0.5)", marginTop:4, fontWeight:sel?600:400 }}>
                      {i.l[lang]||i.l.en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>}

          {/* Navigation */}
          <div style={{ display:"flex", alignItems:"center", marginTop:24, gap:12 }}>
            {step > 0 && <button onClick={()=>setStep(s=>s-1)} style={S.backBtn}>{t.back}</button>}
            <div style={{ flex:1 }} />
            {step < 2 ? (
              <button onClick={()=>setStep(s=>s+1)} disabled={!canGo} style={{
                ...S.nextBtn, opacity:canGo?1:0.4, cursor:canGo?"pointer":"not-allowed",
                background:canGo?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(255,255,255,0.08)",
                boxShadow:canGo?"0 4px 20px rgba(14,165,233,0.3)":"none",
              }}>{t.next} →</button>
            ) : (
              <button onClick={finish} disabled={!canGo} style={{
                ...S.goBtn, opacity:canGo?1:0.4, cursor:canGo?"pointer":"not-allowed",
                background:canGo?"linear-gradient(135deg,#0ea5e9,#06b6d4)":"rgba(255,255,255,0.08)",
                boxShadow:canGo?"0 6px 30px rgba(14,165,233,0.35)":"none",
                animation:canGo?"obPulse 2s ease-in-out infinite":"none",
              }}>{t.go} 🚀</button>
            )}
          </div>

          {/* Room code badge */}
          {roomCode && roomCode !== "DEMO" && (
            <div style={{ position:"absolute", top:12, right:16, padding:"4px 10px", borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.25)", fontSize:9, fontFamily:"monospace" }}>
              🏠 {roomCode}
            </div>
          )}
        </div>
      </div>
      <style>{ANIMS}</style>
    </div>
  );
}

/* ── ANIMATIONS ── */
const ANIMS = `
  @keyframes obWave { 0%,100%{transform:translateY(0) scaleX(1)} 50%{transform:translateY(-8px) scaleX(1.02)} }
  @keyframes obPulse { 0%,100%{opacity:0.85} 50%{opacity:1} }
  @keyframes obFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes obProg { 0%{width:0%} 100%{width:100%} }
  input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.8); cursor:pointer; }
`;

/* ── STYLES ── */
const S = {
  wrap: { position:"fixed", inset:0, zIndex:9999, fontFamily:"'Cormorant Garamond','Georgia',serif", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" },
  bgGrad: { position:"absolute", inset:0, background:"linear-gradient(160deg,#0c1929,#0a2540 30%,#0e3a5c 60%,#134e6f)" },
  input: { width:"100%", padding:"14px 16px", borderRadius:14, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:16, outline:"none", fontFamily:"'Outfit',sans-serif", transition:"border 0.2s", boxSizing:"border-box" },
  label: { fontSize:11, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:6, fontFamily:"'Outfit',sans-serif" },
  dateInput: { width:"100%", padding:"12px 10px", borderRadius:14, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:13, outline:"none", fontFamily:"'Outfit',sans-serif", boxSizing:"border-box" },
  cBtn: { width:34, height:34, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit", transition:"all 0.15s" },
  backBtn: { padding:"10px 20px", borderRadius:14, border:"1px solid rgba(255,255,255,0.12)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" },
  nextBtn: { padding:"12px 28px", borderRadius:14, border:"none", color:"#fff", fontSize:14, fontWeight:600, fontFamily:"'Outfit',sans-serif", transition:"all 0.2s" },
  goBtn: { padding:"14px 32px", borderRadius:16, border:"none", color:"#fff", fontSize:15, fontWeight:700, fontFamily:"'Outfit',sans-serif", transition:"all 0.2s" },
};
