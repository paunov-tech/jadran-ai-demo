// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Standalone AI Assistant
// Route: jadran.ai/ai
// Pay 5.99€ → travel guide without apartment context
// Perfect for: campervan travelers, day-trippers, cruise visitors
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { EXPERIENCES, GEMS, BOOKING_CITIES, CAMPER_WARNINGS, ISTRA_CAMPER_INTEL, DEEP_LOCAL, DUBROVNIK_INTEL, filterByRegion } from "./data.js";

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
  de: { title: "Jadran Reiseführer", sub: "Geprüfte Tipps von Einheimischen für Ihren Adria-Urlaub", start: "Gespräch starten", send: "Senden", placeholder: "Fragen Sie mich über die Adria...", region: "Wo befinden Sie sich?", mode: "Wie reisen Sie?", unlock: "Freischalten — 5.99€", free3: "3 kostenlose Fragen", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "← Zurück", typing: "einen Moment..." },
  it: { title: "Guida Jadran", sub: "Consigli locali per la vacanza perfetta", start: "Inizia a chattare", send: "Invia", placeholder: "Chiedimi dell'Adriatico...", region: "Dove siete?", mode: "Come viaggiate?", unlock: "Sblocca guida — 5.99€", free3: "3 domande gratuite", remaining: "rimanenti", upgraded: "Premium sbloccato!", back: "← Indietro", typing: "penso..." },
  at: { title: "Jadran Urlaubsguide", sub: "Insider-Tipps von Einheimischen für deinen Adria-Urlaub", start: "Los geht's", send: "Abschicken", placeholder: "Frag mich was über die Adria...", region: "Wo bist du gerade?", mode: "Wie bist du unterwegs?", unlock: "Freischalten — 5.99€", free3: "3 Fragen gratis", remaining: "übrig", upgraded: "Premium freigeschaltet!", back: "← Zurück", typing: "Moment..." },
  si: { title: "Jadran vodič", sub: "Lokalni nasveti za popoln Jadran", start: "Začni pogovor", send: "Pošlji", placeholder: "Vprašajte me o Jadranu...", region: "Kje ste?", mode: "Kako potujete?", unlock: "Odkleni vodič — 5.99€", free3: "3 brezplačna vprašanja", remaining: "preostalo", upgraded: "Premium odklenjen!", back: "← Nazaj", typing: "razmišljam..." },
  cz: { title: "Jadran průvodce", sub: "Místní tipy pro perfektní Jadran", start: "Začít konverzaci", send: "Odeslat", placeholder: "Zeptejte se na Jadran...", region: "Kde jste?", mode: "Jak cestujete?", unlock: "Odemknout průvodce — 5.99€", free3: "3 otázky zdarma", remaining: "zbývá", upgraded: "Premium odemčen!", back: "← Zpět", typing: "přemýšlím..." },
  pl: { title: "Jadran przewodnik", sub: "Lokalne wskazówki na Adriatyk", start: "Zacznij rozmowę", send: "Wyślij", placeholder: "Zapytaj o Adriatyk...", region: "Gdzie jesteś?", mode: "Jak podróżujesz?", unlock: "Odblokuj przewodnik — 5.99€", free3: "3 pytania za darmo", remaining: "pozostało", upgraded: "Premium odblokowany!", back: "← Wstecz", typing: "myślę..." },
};

export default function StandaloneAI() {
  const [step, setStep] = useState("setup"); // setup | chat
  const [niche, setNiche] = useState(null); // "camper" | "local" | null — set from landing CTA
  const [lang, setLang] = useState("hr");
  const [region, setRegion] = useState(null);
  const [travelMode, setTravelMode] = useState(null);
  const [premium, setPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState(null);
  const [trialHoursLeft, setTrialHoursLeft] = useState(24);
  const [trialExpired, setTrialExpired] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  // Chat
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  const [weather, setWeather] = useState(null);
  const [regionImgs, setRegionImgs] = useState({});

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  // Fetch live weather
  useEffect(() => {
    fetch("/api/weather").then(r => r.json()).then(d => {
      if (d.current?.temp) setWeather(d.current);
    }).catch(() => {});
  }, []);
  // Load region image when region selected
  useEffect(() => {
    if (!region || regionImgs[region]) return;
    const cityMap = { split: "Split", makarska: "Makarska", dubrovnik: "Dubrovnik", zadar: "Zadar", istra: "Rovinj", kvarner: "Opatija" };
    const city = cityMap[region];
    if (city) fetch(`/api/cityimg?city=${encodeURIComponent(city)}`)
      .then(r => r.json()).then(d => { if (d.url) setRegionImgs(prev => ({ ...prev, [region]: d.url })); })
      .catch(() => {});
  }, [region]);

  // Check URL params: premium + niche mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const n = params.get("niche");
    if (n === "camper" || n === "local") { setNiche(n); if (n === "camper") setTravelMode("camper"); }
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
  const startCheckout = async (plan = "week") => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomCode: "AI-STANDALONE", guestName: "AI User", lang,
          returnPath: "/ai" + (niche ? "?niche=" + niche : ""),
          plan, region: plan === "week" ? (region || "split") : "all",
        }),
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
    if (!premium && trialExpired) { setShowPaywall(true); return; }

    const msg = input.trim();
    setInput("");
    setMsgs(p => [...p, { role: "user", text: msg }]);
    setLoading(true);
    // trial active — no decrement

    const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";
    const modeName = TRAVEL_MODES.find(m => m.id === travelMode)?.name || "";
    const isCamper = travelMode === "camper";
    const isSailing = travelMode === "sailing";
    const wxCtx = weather ? `TRENUTNO VRIJEME: ${weather.temp}°C ${weather.icon}, osjeća se ${weather.feelsLike || weather.temp}°C, UV ${weather.uv}, vjetar ${weather.windDir || ""} ${weather.windSpeed || ""} km/h (udari ${weather.gusts || "—"} km/h), more ${weather.sea}°C, valovi ${weather.waveHeight || 0}m, tlak ${weather.pressure || "—"} hPa, zalazak ${weather.sunset}.` : "";

    const langStr = lang === "at" ? "Österreichisches Deutsch — verwende du-Form, warmen Ton, österreichische Ausdrücke (Jause statt Brotzeit, Schmankerl, Beisl statt Kneipe, leiwand statt toll, heuer statt dieses Jahr, Sackerl statt Tüte, Paradeiser statt Tomaten). Sprich wie ein guter Freund aus Kärnten der die Adria in- und auswendig kennt" : lang === "de" ? "Deutsch — verwende Sie-Form, sachlich aber freundlich" : lang === "en" ? "English" : lang === "it" ? "Italiano" : lang === "si" ? "Slovenščina" : lang === "cz" ? "Čeština" : lang === "pl" ? "Polski" : "Hrvatski";

    const sys = isCamper ? `Ti si "Jadran Camping Expert" — vrhunski poznavalac obale od Istre do Dubrovnika, specijalizovan za logistiku kamp vozila (kamperi, vanovi, prikolice).

TON: Informativan, praktičan, sa dozom outdoor entuzijazma. Koristi lokalne nazive (riva, konoba, buža, cesta, maestral). Nikad generičke fraze.
JEZIK: ${langStr}.
KONTEKST: Gost je u regiji ${regionName}. ${wxCtx}

PRIORITETI U SVAKOM ODGOVORU (ovim redom):

1. BEZBEDNOST I LOGISTIKA (UVIJEK PRVO):
- Provjeri da li je put prohodan za kampere (uske ulice, serpentine, tuneli, visinski profil)
- Upozori na vjetar (bura/jugo), stanje mora, provalije bez bankine
- Daj konkretne dimenzije ako su relevantne (širina puta, visina tunela)
- Legalna mjesta za parkiranje i noćenje (kampiralište, autocamp, legalni parking)
- Najbliže pumpe za vodu i dump station (sani-station)
- Zabrane divljeg kampiranja (kazne 130-400€)

2. KONTEKSTUALNA PRODAJA (suptilno u svaki odgovor):
- Ako gost pita za plaže → ponudi turu brodom do pećina ili otoka
- Ako gost pita za hranu → preporuči restoran uz napomenu "Imaju veliki parking pogodan za kampere"
- Ako je gost u tranzitu → ponudi kamp ili mobilnu kućicu "za promjenu tempa"
- Uvijek integriraj jednu preporuku koja je monetizabilna
- Ako znaš za partner-ponudu, dodaj: "Ako kažeš da te poslao Jadran.ai, dobiješ [bonus]"

3. LOKALNA EKSPERTIZA:
- Vjetar: bura (NE), jugo (JI), maestral (Z popodne) — praktični savjeti
- Benzinske postaje s LPG-om
- Preporuči aplikacije: park4night, Campercontact, CamperStop
- Cijene parkinga za kampere (obično 15-40€/noć ovisno o lokaciji)

⚠️ KRITIČNA UPOZORENJA — ODMAH upozori kad gost spomene ove lokacije:
${CAMPER_WARNINGS.map(w => `• ${w.name} [${w.severity.toUpperCase()}]: ${w.danger} → ${w.advice}`).join("\n")}
${region === "istra" ? `
🏕️ ISTRA CAMPING EXPERT v2.1 — Specifično znanje za Istru:
${ISTRA_CAMPER_INTEL.map(i => `• ${i.name} [${i.severity.toUpperCase()}]: ${i.danger} → ${i.advice}`).join("\n")}
PRAVILO ZA ISTRU: Ako je predsezona (april/maj), UVIJEK upozori na zatvorene usluge u kampovima, slabu amperažu i blato nakon kiše. Ako je padala kiša u zadnja 24h — odmah savjetuj šljunčane parcele. Za Pulu NIKAD ne šalji na parking Karolina.` : ""}
${region === "dubrovnik" ? `
🏰 DUBROVNIK & PELJEŠAC SURVIVAL GUIDE:
${DUBROVNIK_INTEL.map(d => `• ${d.spot} [${d.severity.toUpperCase()}]: ${d.intel}`).join("\n")}
PRAVILO ZA DUBROVNIK: NIKADA ne šalji kamper prema Starom gradu. Za Srđ UVIJEK žičara, nikad kamperom. Prije ulaska u Dubrovnik UVIJEK provjeri buru (Most Tuđmana). Na Pelješcu UVIJEK preporuči vino + kamenice.` : ""}
${DEEP_LOCAL[region] ? `
🗺️ DEEP-LOCAL ZNANJE za tvoju regiju — informacije koje NEMA na Google Mapsu:
${DEEP_LOCAL[region].map(d => `• ${d.spot}: ${d.intel}`).join("\n")}
Koristi ove podatke PROAKTIVNO — kad gost spomene bilo koju od ovih lokacija, odmah ubaci insider savjet.` : ""}

PRAVILA ODGOVORA:
- Dužina: 3-5 rečenica za jednostavna pitanja, do 8 za složena
- Uvijek: konkretan parking (ime + kapacitet), cijena, udaljenost u minutima
- Uvijek: jedan emoji po ključnoj informaciji
- Uvijek: završi sa jednim bonus savjetom ili ponudom ("Dok si u tom kraju...")
- Nikad: "Preporučujem da posjetite..." — umjesto toga: "Kreni 15 min južnije ka..."
- Nikad: generički TripAdvisor stil — ti si lokalni čovjek koji živi tu
- LINKOVI: Kad preporučuješ aktivnost ili rezervaciju, koristi format [Tekst dugmeta](URL). Primjer: [Rezerviraj izlet brodom](https://www.getyourguide.com/...). Ovo se prikazuje kao klikabilno dugme u chatu. UVIJEK umetni barem jedan link u odgovor ako preporučuješ aktivnost, restoran ili izlet.` :

    isSailing ? `Ti si lokalni nautički vodič za hrvatsku obalu Jadrana.
KONTEKST: Gost plovi u regiji ${regionName}. ${wxCtx}
JEZIK: ${langStr}.
Uključi: marine i sidrišta s cijenama veza, meteo upozorenja (bura, jugo, maestral), opskrba vodom i gorivom, najbolja zaštićena sidrišta, konobe dostupne s mora.
Daj konkretne koordinate sidrišta, dubinu, zaštićenost od pojedinog vjetra. Završi sa preporukom za sutra.
PRAVILA: Kratko (4-6 rečenica), konkretno s cijenama i udaljenostima u NM. Koristi emoji. Lokalni insider. Za linkove koristi format [Tekst](URL).` :

    `Ti si lokalni turistički vodič za hrvatsku obalu Jadrana.
KONTEKST: Gost je u regiji ${regionName}. ${modeName ? "Putuje kao: " + modeName + "." : ""} ${wxCtx}
JEZIK: ${langStr}.
PRAVILA: Kratko (4-6 rečenica), toplo, konkretno s cijenama i udaljenostima. Koristi emoji. Lokalni insider savjeti — ne generički turistički info. Završi sa jednom bonus preporukom. Za linkove koristi format [Tekst](URL).`;

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

  const hour = new Date().getHours();
  const isNight = hour >= 19 || hour < 6;
  const C = isNight ? {
    bg: "#0a1628", accent: "#0ea5e9", gold: "#f59e0b", text: "#f0f9ff",
    mut: "#7dd3fc", bord: "rgba(14,165,233,0.08)", card: "rgba(12,28,50,0.7)",
    heroBg: "linear-gradient(160deg, #0a1628, #0e3a5c 50%, #134e6f)",
    chatBg: "linear-gradient(160deg, #0a1628, #0e3a5c)",
    inputBg: "rgba(255,255,255,0.04)",
  } : {
    bg: "#e8f4fc", accent: "#0284c7", gold: "#d97706", text: "#0c2d48",
    mut: "#4b7a99", bord: "rgba(12,74,110,0.1)", card: "rgba(255,255,255,0.7)",
    heroBg: "linear-gradient(160deg, #dbeef9 0%, #b8dff5 30%, #87ceeb 60%, #e0f2fe 100%)",
    chatBg: "linear-gradient(160deg, #e0f2fe, #bae6fd 50%, #dbeef9)",
    inputBg: "rgba(12,74,110,0.04)",
  };

  // ═══ PAYWALL MODAL ═══
  const Paywall = () => showPaywall && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }}
      onClick={() => setShowPaywall(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: isNight ? "rgba(12,28,50,0.97)" : "rgba(255,255,255,0.97)", borderRadius: 24, padding: "32px 24px", maxWidth: 440, width: "100%", border: "1px solid rgba(245,158,11,0.1)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>BESPLATNI DAN JE ISTEKAO</div>
          <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 24, color: C.text }}>Otključajte svog vodiča</div>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: isNight ? "rgba(14,165,233,0.04)" : "rgba(14,165,233,0.06)", marginBottom: 20, fontSize: 13, lineHeight: 2, color: C.text }}>
          ✅ Neograničena AI pitanja 24/7<br/>
          ✅ Svi savjeti na upozorenjima otključani<br/>
          ✅ 8+ skrivenih plaža i konoba<br/>
          {(travelMode === "camper" || niche === "camper") && <>✅ Kamper parking, dump station, voda<br/></>}
          {region === "istra" && <>✅ Istra Insider — sezonski savjeti<br/></>}
          ✅ Personalizirana ruta za danas
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button onClick={() => startCheckout("week")} disabled={payLoading}
            style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: `1px solid ${C.bord}`, background: isNight ? C.card : "rgba(255,255,255,0.8)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>
            <div style={{ fontSize: 28, fontWeight: 300, color: C.accent }}>3.99€</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4 }}>Tjedan</div>
            <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>7 dana · 1 regija</div>
          </button>
          <button onClick={() => startCheckout("season")} disabled={payLoading}
            style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: "1px solid rgba(245,158,11,0.2)", background: isNight ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.08)", cursor: "pointer", fontFamily: "inherit", textAlign: "center", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"}>
            <div style={{ position: "absolute", top: 0, right: 0, padding: "2px 10px", background: C.gold, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "0 14px 0 8px" }}>BEST</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: C.gold }}>7.99€</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 4 }}>Sezona</div>
            <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>30 dana · sve regije</div>
          </button>
        </div>
        {payLoading && <div style={{ textAlign: "center", fontSize: 13, color: C.accent, marginBottom: 8 }}>⏳ Preusmjeravanje na plaćanje...</div>}
        <button onClick={() => setShowPaywall(false)} style={{ width: "100%", background: "none", border: "none", color: C.mut, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 8 }}>Možda kasnije</button>
      </div>
    </div>
  );


  // ═══ ICE-BREAKER — context-aware welcome message ═══
  const generateIcebreaker = () => {
    const h = new Date().getHours();
    const regionName = REGIONS.find(r => r.id === region)?.name || "Jadran";
    const isCamperMode = travelMode === "camper" || niche === "camper";
    const w = weather;
    
    // Weather-conditional (rain or strong wind)
    if (w && (w.windSpeed > 40 || w.icon === "🌧️" || w.icon === "🌦️" || w.icon === "⛈️")) {
      const windWarn = w.windSpeed > 40;
      if (isCamperMode) {
        return `Uh, vrijeme danas nije na našoj strani! ${w.icon} ${windWarn ? "Jaka bura otežava vožnju kamperima uz obalu." : "Kiša pada u regiji " + regionName + "."}

Nema smisla sjediti u vozilu — ovo je savršen dan za istraživanje unutrašnjosti na toplom. ${region === "istra" ? "Preporučujem degustaciju vina i pršuta u lokalnoj vinariji — imaju zaštićen parking za kamper.\n[Rezerviraj degustaciju vina](https://www.getyourguide.com/istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975/?partner_id=9OEGOYI&utm_medium=local_partners)" : region === "split" ? "Idealan dan za Dioklecijanove podrume — pod krovom, a fascinantan!\n[Rezerviraj obilazak palače](https://www.getyourguide.com/split-l268/split-walking-tour-t54976/?partner_id=9OEGOYI&utm_medium=local_partners)" : "Idealan dan za lokalne konobe u unutrašnjosti — topla jela i vino iz podruma."}

Gdje se trenutno nalaziš da ti provjerim prohodnost puteva? 🛡️`;
      }
      return `Vrijeme danas traži plan B! ${w.icon} ${windWarn ? "Vjetar je jak — " + w.windSpeed + " km/h." : "Kiša pada, ali to znači manje turista svugdje!"}

Preporučujem dan u unutrašnjosti: lokalne konobe, vinarije, muzeji. ${region === "istra" ? "Motovun i Grožnjan su prekrasni po kiši — manje turista, više atmosfere! 🍷" : "Savršen dan za skrivene lokalne tajne! 🍷"}

Što vas zanima — hrana, kultura, ili nešto treće?`;
    }
    
    // Time-conditional
    if (h >= 17 && h < 21) {
      // Evening - dinner time
      if (isCamperMode) {
        return `Dobra večer! 🌅 Zalazak u ${regionName} je danas u ${w?.sunset || "19:30"} — savršeno za večeru s pogledom.

${region === "split" ? "Konoba Matoni u Podstrani — terasa nad morem, pašticada 14€, i imaju veliki parking za kampere!" : region === "istra" ? "Konoba Batelina u Banjolama kod Pule — svježa riba po kg, a parking je prostran i ravan." : region === "dubrovnik" ? "Na Pelješcu obavezno probaj stonske kamenice — 1€/kom! Parking bez problema.\n[Rezerviraj degustaciju kamenica](https://www.getyourguide.com/ston-l4159/ston-oyster-and-wine-tasting-tour-t197562/?partner_id=9OEGOYI&utm_medium=local_partners)" : "Lokalne konobe u " + regionName + " imaju mjesta za kamper — pitaj me za preporuku!"}

Treba li ti parking za večeras ili želiš preporuku za sutra? 🚐`;
      }
      return `Dobra večer! 🌅 More je ${w?.sea || 20}°C, zalazak u ${w?.sunset || "19:30"}. Savršeno za šetnju rivom.

Što planirate za večeras — romantična večera, noćni život, ili mirna kava uz more?`;
    }
    
    if (h >= 6 && h < 10) {
      // Morning - activity time
      if (isCamperMode) {
        return `Dobro jutro! ☀️ ${w ? w.icon + " " + w.temp + "°C" : ""}, more ${w?.sea || 20}°C — savršen dan za avanturu!

${w?.waveHeight && w.waveHeight < 0.5 ? "More je mirno kao ulje — idealno za izlet brodom!\n[Pogledaj dostupne izlete](https://www.getyourguide.com/split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676/?partner_id=9OEGOYI&utm_medium=local_partners) 🚤" : ""}${region === "istra" ? " Rt Kamenjak je rano ujutro prazan — ali zatvori ventilaciju frižidera zbog prašine na makadamu!" : region === "split" ? " Kašjuni plaža pod Marjanom — dođi prije 10h dok je prazna!" : ""}

Kamo danas — plaže, izleti, ili tranzit prema sljedećoj destinaciji?`;
      }
      return `Dobro jutro! ☀️ ${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C" : "Prekrasan dan na Jadranu!"}

Što planirate danas — plaže, izleti, kultura? 🌊`;
    }
    
    // Default - general welcome
    if (isCamperMode) {
      return `Pozdrav! 🚐 Dobrodošli u ${regionName}. Ja sam vaš lokalni kamper expert — poznajem svaki parking, dump station i skrivenu uvalu na ovom dijelu obale.

${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C, vjetar " + (w.windDir || "") + " " + (w.windSpeed || "") + " km/h" : ""}

Što vam prvo treba — siguran parking za noćas, preporuka za plažu pristupačnu kamperom, ili nešto treće?`;
    }
    return `Pozdrav! 🌊 Dobrodošli u ${regionName}. Poznajem svaku skrivenu plažu i konubu na ovom dijelu obale.

${w ? w.icon + " " + w.temp + "°C, more " + w.sea + "°C" : ""} Što vas zanima? 🗺️`;
  };

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
    <div style={{ minHeight: "100vh", background: C.heroBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <a href="/" style={{ color: C.mut, fontSize: 13, textDecoration: "none" }}>{t.back}</a>
          <div style={{ display: "flex", gap: 2, background: isNight ? "rgba(12,28,50,0.5)" : "rgba(255,255,255,0.5)", borderRadius: 12, padding: 3 }}>
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code)}
                style={{ padding: "4px 6px", background: lang === l.code ? "rgba(14,165,233,0.12)" : "transparent", border: lang === l.code ? `1px solid ${C.accent}40` : "1px solid transparent", borderRadius: 9, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
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
            {TRAVEL_MODES.filter(m => niche === "camper" ? m.id === "camper" : niche === "local" ? m.id !== "camper" : true).map(m => (
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
        <button onClick={() => { if (region && travelMode) { setStep("chat"); setTimeout(() => setMsgs([{ role: "assistant", text: generateIcebreaker() }]), 300); } }}
          disabled={!region || !travelMode}
          style={{
            width: "100%", padding: "18px", borderRadius: 18, border: "none",
            background: region && travelMode ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : (isNight ? "rgba(255,255,255,0.06)" : "rgba(12,74,110,0.08)"),
            color: "#fff", fontSize: 17, fontWeight: 600, cursor: region && travelMode ? "pointer" : "not-allowed",
            opacity: region && travelMode ? 1 : 0.4,
            fontFamily: "'DM Serif Display',Georgia,serif",
            boxShadow: region && travelMode ? "0 6px 24px rgba(14,165,233,0.25)" : "none",
          }}>
          {t.start} →
        </button>

        {/* Free tier note */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: isNight ? "rgba(255,255,255,0.3)" : "rgba(12,74,110,0.4)" }}>
          24h besplatno · zatim od 3.99€/tjedan
        </div>
      </div>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } ::selection { background: rgba(14,165,233,0.3); }`}</style>
    </div>
  );

  // ═══ CHAT SCREEN ═══
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.chatBg, fontFamily: "'Outfit',system-ui,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.bord}`, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setStep("setup")} style={{ background: "none", border: "none", color: C.mut, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{t.back}</button>
          <div style={{ width: 1, height: 20, background: C.bord }} />
          <span style={{ fontSize: 18 }}>{TRAVEL_MODES.find(m => m.id === travelMode)?.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{REGIONS.find(r => r.id === region)?.name}</span>
          {weather && <span style={{ fontSize: 12, color: C.mut, marginLeft: 4 }}>{weather.icon} {weather.temp}° · 🌊 {weather.sea}°</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {premium
            ? <span style={{ padding: "4px 12px", borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.12)", color: C.gold, fontSize: 10, fontWeight: 600 }}>⭐ {premiumPlan?.plan === "season" ? "SEZONA" : "TJEDAN"} {premiumPlan ? Math.ceil((premiumPlan.expiresAt - Date.now()) / 86400000) + "d" : ""}</span>
            : <button onClick={() => trialExpired && setShowPaywall(true)} style={{ padding: "4px 12px", borderRadius: 12, background: trialExpired ? "rgba(239,68,68,0.08)" : "rgba(52,211,153,0.08)", border: `1px solid ${trialExpired ? "rgba(239,68,68,0.12)" : "rgba(52,211,153,0.12)"}`, color: trialExpired ? "#f87171" : "#34d399", fontSize: 10, fontWeight: 600, cursor: trialExpired ? "pointer" : "default", fontFamily: "inherit" }}>
                {trialExpired ? "⏰ Isteklo" : `✅ ${trialHoursLeft}h besplatno`}
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
            <div style={{ position: "relative", minHeight: 280, overflow: "hidden", background: isNight
              ? "linear-gradient(180deg, #0f2b3d 0%, #0c4a6e 30%, #0ea5e9 65%, #38bdf8 80%, #7dd3fc 100%)"
              : "linear-gradient(180deg, #60a5fa 0%, #38bdf8 25%, #0ea5e9 50%, #0284c7 75%, #0369a1 100%)"
            }}>
              {/* Sun or Moon based on time */}
              {isNight ? (
                <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)" }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)", boxShadow: "0 0 40px rgba(148,163,184,0.3), 0 0 80px rgba(148,163,184,0.1)", animation: "sunGlow 6s ease-in-out infinite" }} />
                  {[{t:8,l:42,s:2},{t:14,l:55,s:1.5},{t:6,l:60,s:1},{t:18,l:38,s:1.5},{t:3,l:48,s:1}].map((st,i) => (
                    <div key={i} style={{ position:"absolute", top:st.t, left:st.l, width:st.s, height:st.s, borderRadius:"50%", background:"rgba(255,255,255,0.6)" }} />
                  ))}
                </div>
              ) : (
                <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%)", width: 70, height: 70, borderRadius: "50%", background: "radial-gradient(circle, #fef9c3 15%, #fde047 35%, #fbbf24 55%, rgba(251,191,36,0.2) 75%, transparent 100%)", boxShadow: "0 0 80px rgba(251,191,36,0.5), 0 0 160px rgba(251,191,36,0.2)", animation: "sunGlow 4s ease-in-out infinite" }}>
                  {/* Sun rays */}
                  {[0,45,90,135,180,225,270,315].map(deg => (
                    <div key={deg} style={{ position:"absolute", top:"50%", left:"50%", width:2, height:12, background:"rgba(251,191,36,0.3)", transformOrigin:"center -12px", transform:`rotate(${deg}deg)`, borderRadius:1 }} />
                  ))}
                </div>
              )}
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
              {/* Live marine data overlay */}
              {weather && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 12px 14px", background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
                <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 4 }}>
                  {[
                    { v: `${weather.temp}°`, sub: `${weather.icon} osjeća ${weather.feelsLike || weather.temp}°`, l: "ZRAK" },
                    { v: `${weather.sea}°`, sub: "površina mora", l: "MORE" },
                    { v: `${weather.windDir || "—"} ${weather.windSpeed || "—"}`, sub: `udari ${weather.gusts || "—"} km/h`, l: "VJETAR" },
                    { v: weather.waveHeight ? `${weather.waveHeight}m` : "mirno", sub: weather.wavePeriod ? `period ${weather.wavePeriod}s` : "valovi", l: "VALOVI" },
                    { v: `UV ${weather.uv}`, sub: weather.uv >= 8 ? "⚠️ zaštita!" : weather.uv >= 5 ? "SPF 30+" : "nizak", l: "UV INDEX" },
                    { v: `🌅 ${weather.sunset}`, sub: `izlazak ${weather.sunrise || "06:00"}`, l: "SUNCE" },
                  ].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", minWidth: 52, padding: "4px 6px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f9ff", lineHeight: 1.1 }}>{d.v}</div>
                      <div style={{ fontSize: 8, color: "rgba(240,249,255,0.5)", letterSpacing: 1, marginTop: 2 }}>{d.l}</div>
                      <div style={{ fontSize: 9, color: "rgba(240,249,255,0.4)", marginTop: 1 }}>{d.sub}</div>
                    </div>
                  ))}
                </div>
                {weather.pressure && <div style={{ textAlign: "center", marginTop: 6, fontSize: 9, color: "rgba(240,249,255,0.3)" }}>
                  Tlak {weather.pressure} hPa {weather.pressure < 1010 ? "↓ pad — moguća promjena" : weather.pressure > 1020 ? "↑ stabilan" : "— umjeren"} · Vlažnost {weather.humidity}%
                </div>}
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
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.08))", border: "1px solid rgba(14,165,233,0.15)", fontSize: 13, color: isNight ? "#bae6fd" : "#0c4a6e", maxWidth: "75%" }}>{conv.q}</div>
                    </div>
                    {/* AI answer */}
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 4 }}>
                      <div style={{ padding: "10px 14px", borderRadius: "16px 16px 16px 4px", background: C.card, border: `1px solid ${C.bord}`, fontSize: 13, color: C.text, maxWidth: "85%", lineHeight: 1.6 }}>{conv.a}</div>
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
              <div style={{ fontSize: 11, color: isNight ? "rgba(255,255,255,0.2)" : "rgba(12,74,110,0.3)", marginTop: 14 }}>3 besplatna pitanja · Premium 5.99€</div>
            </div>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? (isNight ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(2,132,199,0.1))" : "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(2,132,199,0.12))") : C.card,
              border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.2)" : C.bord}`,
              fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap",
            }}>
              {m.role === "assistant" ? m.text.split("\n").map((line, j) => {
                // Parse [label](url) into rich buttons AND plain URLs into links
                const parts = line.split(/(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s)]+)/g).filter(Boolean);
                return <div key={j} style={{ marginBottom: line === "" ? 4 : 0 }}>{parts.map((part, k) => {
                  const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                  if (linkMatch) {
                    return <a key={k} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-block", margin: "6px 4px 2px 0", padding: "8px 16px", borderRadius: 12,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff",
                      fontSize: 12, fontWeight: 600, textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(14,165,233,0.2)", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = ""}
                    >{linkMatch[1]} →</a>;
                  }
                  if (/^https?:\/\//.test(part)) {
                    const label = part.includes("getyourguide") ? "Pogledaj ponudu" : part.includes("viator") ? "Pogledaj turu" : part.includes("booking.com") ? "Pogledaj smještaj" : "Otvori link";
                    return <a key={k} href={part} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-block", margin: "6px 4px 2px 0", padding: "6px 14px", borderRadius: 10,
                      background: isNight ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.08)", border: `1px solid ${C.bord}`,
                      fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 500,
                    }}>{label} →</a>;
                  }
                  return <span key={k}>{part}</span>;
                })}</div>;
              }) : m.text}
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

        {/* ═══ CONTENT CARDS — filtered by region ═══ */}
        {region && (
          <div style={{ padding: "8px 0 20px" }}>
            {/* Separator */}
            {msgs.length > 0 && <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C.bord}, transparent)`, margin: "16px 0 20px" }} />}

            {/* Activities — affiliate, always visible */}
            {(() => {
              const allActs = filterByRegion(EXPERIENCES, region);
              const acts = (niche === 'camper' ? allActs.filter(a => ['adventure','nature'].includes(a.cat)) : niche === 'local' ? allActs.filter(a => a.cat !== 'nature' || true) : allActs).slice(0, 6);
              return acts.length > 0 && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, fontWeight: 600 }}>AKTIVNOSTI</div>
                    <div style={{ fontSize: 10, color: C.mut }}>{acts.length} dostupno</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }}>
                    {acts.map(a => (
                      <a key={a.id} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit", scrollSnapAlign: "start" }}>
                        <div style={{
                          minWidth: 180, minHeight: 140, padding: 0, borderRadius: 18,
                          background: C.card, border: `1px solid ${C.bord}`,
                          transition: "all 0.2s", cursor: "pointer", position: "relative", overflow: "hidden",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
                          {/* Region photo */}
                          {regionImgs[region] && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${regionImgs[region]})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.25 }} />}
                          <div style={{ position: "absolute", inset: 0, background: isNight ? "linear-gradient(180deg, rgba(10,22,40,0.3) 0%, rgba(10,22,40,0.85) 100%)" : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.8) 100%)" }} />
                          <div style={{ position: "relative", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 140 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <span style={{ fontSize: 22 }}>{a.emoji}</span>
                              <span style={{ fontSize: 12, color: C.gold, fontWeight: 700, background: isNight ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.15)", padding: "3px 10px", borderRadius: 10 }}>{a.price}€</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{a.name}</div>
                            <div style={{ display: "flex", gap: 6, fontSize: 10, color: C.mut }}>
                              <span>⏱ {a.dur}</span>
                              <span>⭐ {a.rating}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ⚠️ Camper Warnings — trust builders */}
            {(() => {
              if (niche === "local") return null;
              const warnings = filterByRegion(CAMPER_WARNINGS, region);
              return warnings.length > 0 && (travelMode === "camper" || niche === "camper") && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>⚠️ UPOZORENJA ZA KAMPERE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {warnings.map(w => (
                      <div key={w.id} style={{
                        padding: "14px 16px", borderRadius: 16,
                        background: isNight ? "rgba(248,113,113,0.06)" : "rgba(248,113,113,0.08)",
                        border: `1px solid ${w.severity === "critical" ? "rgba(239,68,68,0.3)" : w.severity === "high" ? "rgba(248,113,113,0.2)" : "rgba(248,113,113,0.1)"}`,
                      }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 22 }}>{w.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{w.name}</span>
                              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8,
                                background: w.severity === "critical" ? "rgba(239,68,68,0.15)" : w.severity === "high" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                                color: w.severity === "critical" ? "#ef4444" : w.severity === "high" ? "#f87171" : C.gold,
                                fontWeight: 700, letterSpacing: 1,
                              }}>{w.severity === "critical" ? "KRITIČNO" : w.severity === "high" ? "OPASNO" : "PAŽNJA"}</span>
                            </div>
                            <div style={{ fontSize: 12, color: isNight ? "#fca5a5" : "#b91c1c", lineHeight: 1.4, marginBottom: 6 }}>{w.danger}</div>
                            {(premium || w.severity === "medium") ? <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.4 }}>💡 {w.advice}</div> : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 12, color: C.gold, cursor: "pointer" }}>🔒 Otključaj savjet — Premium</div>}
                            {w.link && <a href={w.link} target="_blank" rel="noopener noreferrer" style={{
                              display: "inline-block", marginTop: 8, padding: "5px 14px", borderRadius: 10,
                              background: isNight ? "rgba(14,165,233,0.1)" : "rgba(14,165,233,0.08)", border: `1px solid ${C.bord}`,
                              fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 500,
                            }}>Rezerviraj alternativu →</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* 🏕️ Istra Camping Intel — seasonal tips */}
            {region === "istra" && (travelMode === "camper" || niche === "camper") && (
              <div style={{ marginBottom: 20, padding: "0 4px" }}>
                <div style={{ fontSize: 10, color: "#34d399", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🏕️ ISTRA INSIDER</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ISTRA_CAMPER_INTEL.map(tip => (
                    <div key={tip.id} style={{
                      padding: "12px 14px", borderRadius: 14,
                      background: isNight ? "rgba(52,211,153,0.04)" : "rgba(52,211,153,0.06)",
                      border: `1px solid ${tip.severity === "critical" ? "rgba(239,68,68,0.2)" : tip.severity === "high" ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.12)"}`,
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18 }}>{tip.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                            {tip.name}
                            {tip.season === "pre" && <span style={{ fontSize: 9, marginLeft: 6, padding: "1px 6px", borderRadius: 6, background: "rgba(251,191,36,0.1)", color: C.gold }}>PREDSEZONA</span>}
                          </div>
                          <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.4, marginBottom: 4 }}>{tip.danger}</div>
                          <div style={{ fontSize: 11, color: "#34d399", lineHeight: 1.4 }}>💡 {tip.advice}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🏰 Dubrovnik & Pelješac Intel */}
            {region === "dubrovnik" && (travelMode === "camper" || niche === "camper") && (
              <div style={{ marginBottom: 20, padding: "0 4px" }}>
                <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🏰 DUBROVNIK SURVIVAL</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {DUBROVNIK_INTEL.map(tip => (
                    <div key={tip.id} style={{
                      padding: "12px 14px", borderRadius: 14,
                      background: isNight ? "rgba(245,158,11,0.04)" : "rgba(245,158,11,0.06)",
                      border: `1px solid ${tip.severity === "critical" ? "rgba(239,68,68,0.25)" : tip.severity === "high" ? "rgba(248,113,113,0.15)" : "rgba(245,158,11,0.1)"}`,
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 18 }}>{tip.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{tip.spot}</span>
                            {tip.severity !== "low" && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 8,
                              background: tip.severity === "critical" ? "rgba(239,68,68,0.15)" : "rgba(248,113,113,0.1)",
                              color: tip.severity === "critical" ? "#ef4444" : "#f87171",
                              fontWeight: 700, letterSpacing: 1,
                            }}>{tip.severity === "critical" ? "KRITIČNO" : "OPASNO"}</span>}
                          </div>
                          {premium
                            ? <>
                                <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5 }}>{tip.intel}</div>
                                {tip.link && <a href={tip.link} target="_blank" rel="noopener noreferrer" style={{
                                  display: "inline-block", marginTop: 6, padding: "4px 12px", borderRadius: 8,
                                  background: isNight ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.06)", border: `1px solid ${C.bord}`,
                                  fontSize: 10, color: C.accent, textDecoration: "none", fontWeight: 500,
                                }}>Rezerviraj →</a>}
                              </>
                            : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 11, color: C.gold, cursor: "pointer" }}>🔒 Otključaj savjet — Premium</div>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🗺️ Deep Local Intel — region-specific */}
            {(() => {
              const locals = DEEP_LOCAL[region];
              return locals && locals.length > 0 && (travelMode === "camper" || niche === "camper") && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", letterSpacing: 3, fontWeight: 600, marginBottom: 10 }}>🗺️ LOKALNO ZNANJE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {locals.map(d => (
                      <div key={d.id} style={{
                        padding: "12px 14px", borderRadius: 14,
                        background: isNight ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.06)",
                        border: `1px solid rgba(167,139,250,0.1)`,
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16 }}>{d.emoji}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{d.spot}</div>
                            {premium
                              ? <div style={{ fontSize: 11, color: C.mut, lineHeight: 1.5 }}>{d.intel}</div>
                              : <div onClick={() => setShowPaywall(true)} style={{ fontSize: 11, color: C.gold, cursor: "pointer" }}>🔒 Insider savjet — Premium</div>
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Hidden Gems */}
            {(() => {
              const gems = filterByRegion(GEMS, region);
              const freeGems = gems.filter(g => !g.premium);
              const premGems = gems.filter(g => g.premium);
              return gems.length > 0 && (
                <div style={{ marginBottom: 20, padding: "0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: C.gold, letterSpacing: 3, fontWeight: 600 }}>💎 SKRIVENA MJESTA</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {freeGems.map((g, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 16, background: C.card, border: `1px solid ${C.bord}` }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 22 }}>{g.emoji}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{g.name} <span style={{ fontSize: 10, color: C.mut, fontWeight: 400 }}>{g.type}</span></div>
                            <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{g.desc}</div>
                            <div style={{ fontSize: 11, color: C.accent, marginTop: 4 }}>💡 {g.tip}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {premGems.length > 0 && (
                      <div onClick={() => !premium && setShowPaywall(true)} style={{
                        padding: "14px 16px", borderRadius: 16, cursor: premium ? "default" : "pointer",
                        background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(251,191,36,0.02))",
                        border: "1px solid rgba(245,158,11,0.1)",
                      }}>
                        {premium ? premGems.map((g, i) => (
                          <div key={i} style={{ padding: "8px 0", borderBottom: i < premGems.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <span style={{ fontSize: 20 }}>{g.emoji}</span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                                <div style={{ fontSize: 12, color: C.mut, lineHeight: 1.4 }}>{g.desc}</div>
                                <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>💡 {g.tip}</div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 4 }}>🔒 Još {premGems.length} skrivenih mjesta</div>
                            <div style={{ fontSize: 11, color: C.mut }}>Premium · {premGems.map(g => g.name).join(", ")}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Booking.com */}
            {(() => {
              const city = BOOKING_CITIES.find(c => c.region === region);
              return city && (
                <div style={{ padding: "0 4px" }}>
                  <a href={city.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      padding: "16px 20px", borderRadius: 18, display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: "rgba(0,53,128,0.08)", border: "1px dashed rgba(0,85,166,0.15)",
                      transition: "all 0.2s", cursor: "pointer",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.15)"; }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>🏨 Smještaj — {city.name}</div>
                        <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>Booking.com · Najbolje cijene</div>
                      </div>
                      <div style={{ padding: "8px 14px", background: "linear-gradient(135deg, #003580, #0055A6)", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Pogledaj →
                      </div>
                    </div>
                  </a>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Free questions warning */}
      {!premium && trialExpired && (
        <div style={{ padding: "10px 20px", background: isNight ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.1)", borderTop: "1px solid rgba(245,158,11,0.15)", textAlign: "center", flexShrink: 0 }}>
          <button onClick={() => setShowPaywall(true)} style={{ background: "none", border: "none", color: C.gold, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            ⏰ Besplatni dan istekao — {t.unlock}
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.bord}`, display: "flex", gap: 8, flexShrink: 0, background: isNight ? "transparent" : "rgba(255,255,255,0.3)" }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
          placeholder={t.placeholder}
          style={{ flex: 1, padding: "14px 18px", borderRadius: 16, border: `1px solid ${C.bord}`, background: C.inputBg, color: C.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
        />
        <button onClick={sendMsg} disabled={loading || !input.trim()}
          style={{
            width: 48, height: 48, borderRadius: 16, border: "none",
            background: input.trim() && !loading ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : (isNight ? "rgba(255,255,255,0.06)" : "rgba(12,74,110,0.08)"),
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
