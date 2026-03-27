import React, { useState, useEffect, useRef } from "react";
import { loadGuest, updateGuest, getRoomCode } from "./guestStore";
import GuestOnboarding from "./GuestOnboarding";
import { loadDelta, saveDelta } from "./deltaContext";
import { startGPS } from "./gpsEngine";

// ─── CITY COORDINATES (used by Leaflet map, no HERE SDK) ───
const CITY_COORDS = {
  "Wien":[48.2082,16.3738],"München":[48.1351,11.5820],"Frankfurt":[50.1109,8.6821],
  "Beograd":[44.8176,20.4633],"Ljubljana":[46.0569,14.5058],"Graz":[47.0707,15.4395],
  "Salzburg":[47.8095,13.0550],"Linz":[48.3069,14.2858],"Zürich":[47.3769,8.5417],
  "Berlin":[52.5200,13.4050],"Hamburg":[53.5753,10.0153],"Köln":[50.9333,6.9500],
  "Split":[43.5081,16.4402],"Dubrovnik":[42.6507,18.0944],"Zadar":[44.1194,15.2314],
  "Rijeka":[45.3271,14.4422],"Pula":[44.8666,13.8496],"Rovinj":[45.0811,13.6387],
  "Makarska":[43.2967,17.0177],"Hvar":[43.1729,16.4414],"Trogir":[43.5167,16.2500],
  "Omiš":[43.4439,16.6892],"Šibenik":[43.7350,15.8952],"Podstrana":[43.4833,16.5500],
  "Opatija":[45.3369,14.3053],"Krk":[45.0267,14.5756],"Rab":[44.7556,14.7606],
  "Praha":[50.0755,14.4378],"Kraków":[50.0647,19.9450],"Trieste":[45.6495,13.7768],
  "Zagreb":[45.8150,15.9819],
};
const HERE_ROUTING_KEY = import.meta.env.VITE_HERE_API_KEY || "";

// ─── TransitMap: Real HERE Maps rendered inline via SDK (loaded in index.html) ───
const TransitMap = React.memo(({ fromCoords, toCoords, transportMode, onRouteReady, gpsPosition }) => {
  const iframeRef = useRef(null);
  const routeFetched = useRef(false);

  // Send GPS position to iframe via postMessage
  useEffect(() => {
    if (!gpsPosition || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: "gps_update", lat: gpsPosition.lat, lng: gpsPosition.lng
    }, "*");
  }, [gpsPosition?.lat, gpsPosition?.lng]);

  // Fetch route summary via REST (not SDK — avoids race condition)
  useEffect(() => {
    if (!fromCoords || !toCoords || routeFetched.current) return;
    routeFetched.current = true;
    const mode = transportMode === "kamper" ? "truck" : "car";
    fetch(`https://router.hereapi.com/v8/routes?transportMode=${mode}&origin=${fromCoords[0]},${fromCoords[1]}&destination=${toCoords[0]},${toCoords[1]}&return=summary&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(data => {
        const sections = data.routes?.[0]?.sections;
        if (sections?.length && onRouteReady) {
          const totalLength = sections.reduce((sum, s) => sum + (s.summary?.length || 0), 0);
          const totalDuration = sections.reduce((sum, s) => sum + (s.summary?.duration || 0), 0);
          const totalMin = Math.round(totalDuration / 60);
          onRouteReady({
            km: Math.round(totalLength / 1000), hrs: Math.floor(totalMin / 60),
            mins: totalMin % 60,
            oLat: fromCoords[0], oLng: fromCoords[1], dLat: toCoords[0], dLng: toCoords[1],
            mode: transportMode || "auto",
          });
        }
      })
      .catch(() => {
        // Haversine fallback
        const R = 6371;
        const dLat = (toCoords[0] - fromCoords[0]) * Math.PI / 180;
        const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(fromCoords[0]*Math.PI/180)*Math.cos(toCoords[0]*Math.PI/180)*Math.sin(dLon/2)**2;
        const km = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.35);
        const min = Math.round(km / 1.2);
        if (onRouteReady) onRouteReady({
          km, hrs: Math.floor(min/60), mins: min%60, mode: transportMode || "auto",
          oLat: fromCoords[0], oLng: fromCoords[1], dLat: toCoords[0], dLng: toCoords[1], estimated: true,
        });
      });
  }, [fromCoords?.[0], toCoords?.[0]]); // eslint-disable-line

  const tmode = transportMode === "kamper" ? "truck" : "car";
  const src = fromCoords && toCoords
    ? `/map.html?flat=${fromCoords[0]}&flon=${fromCoords[1]}&tlat=${toCoords[0]}&tlon=${toCoords[1]}&tmode=${tmode}&key=${import.meta.env.VITE_HERE_API_KEY}`
    : null;

  if (!src) return <div style={{ width: "100%", height: 300, background: "#0c1426", borderRadius: 14, display: "grid", placeItems: "center" }}><span style={{ fontSize: 13, color: "#64748b", fontFamily: "'DM Sans',sans-serif" }}>Učitavam mapu…</span></div>;

  return (
    <iframe ref={iframeRef} src={src} className="map-frame"
      style={{ width: "100%", height: 300, border: "none", display: "block" }}
      allow="webgl; fullscreen" title="here-route" />
  );
});

// ─── HERE Traffic Incidents along a route corridor ───

// ─── RouteGuide: Live Intelligence Feed ───
// Polls /api/guide every 3min, displays prioritized cards from all data sources
// ─── LiveTicker: Single line above map with rotating live data ───
const LiveTicker = React.memo(({ fromCoords, toCoords, seg, lang, routeData, dm, C }) => {
  const [guideCards, setGuideCards] = React.useState([]);
  const [guideSources, setGuideSources] = React.useState(null);
  const [idx, setIdx] = React.useState(0);

  // Fetch guide data (non-blocking — ticker works without it)
  React.useEffect(() => {
    if (!fromCoords || !toCoords) return;
    let cancelled = false;
    const load = () => {
      fetch(`/api/guide?oLat=${fromCoords[0]}&oLng=${fromCoords[1]}&dLat=${toCoords[0]}&dLng=${toCoords[1]}&seg=${seg || "auto"}&lang=${lang || "hr"}`)
        .then(r => r.json())
        .then(data => { if (!cancelled) { setGuideCards(data.cards || []); setGuideSources(data.sources || null); } })
        .catch(() => {});
    };
    load();
    const iv = setInterval(load, 180000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [fromCoords?.[0], toCoords?.[0], seg]); // eslint-disable-line

  // Build ticker items from route + guide
  const items = React.useMemo(() => {
    const t = [];
    // Route info shown in bar below map, not in ticker
    for (const c of guideCards) {
      if (c.severity === "critical") t.push({ icon: c.icon, text: c.title, color: "#ef4444" });
    }
    for (const c of guideCards) {
      if (c.severity === "warning") t.push({ icon: c.icon, text: c.title, color: "#f59e0b" });
    }
    for (const c of guideCards) {
      if (c.severity === "info" || c.severity === "tip") t.push({ icon: c.icon, text: c.body?.slice(0, 60) || c.title, color: C.mut });
    }
    if (guideSources) {
      const s = guideSources;
      t.push({ icon: "📡", text: `HERE·${s.here||0} Sense·${s.yolo||0} Meteo·${s.meteo?1:0}`, color: "rgba(100,116,139,0.4)" });
    }
    return t.length ? t : [{ icon: "⏳", text: routeData ? "Prikupljam live podatke…" : "Izračunavam rutu…", color: C.mut }];
  }, [routeData, guideCards, guideSources]); // eslint-disable-line

  // Rotate
  React.useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 4000);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx % items.length];
  return (
    <div style={{ padding: "8px 0", display: "flex", alignItems: "center", gap: 8, minHeight: 24, overflow: "hidden" }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{current.icon}</span>
      <span style={{ ...dm, fontSize: 12, color: current.color || C.mut, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: current.color === "#ef4444" ? 700 : 400 }}>
        {current.text}
      </span>
      {items.length > 1 && <span style={{ ...dm, fontSize: 9, color: "rgba(100,116,139,0.3)", flexShrink: 0 }}>{idx % items.length + 1}/{items.length}</span>}
    </div>
  );
});

const RouteGuide = React.memo(({ fromCoords, toCoords, seg, lang, dm, C, extraCards }) => {
  const [cards, setCards] = React.useState(null);
  const [sources, setSources] = React.useState(null);
  const [updated, setUpdated] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // Merge API cards + GPS cards, deduplicate by id, sort by severity
  const SEV_ORDER = { critical: 0, warning: 1, info: 2, tip: 3 };
  const mergedCards = React.useMemo(() => {
    const api = cards || [];
    const gps = extraCards || [];
    const all = [...gps, ...api];
    const seen = new Set();
    return all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
      .sort((a, b) => {
        // AI cards always first
        if (a.isAI && !b.isAI) return -1;
        if (!a.isAI && b.isAI) return 1;
        return (SEV_ORDER[a.severity] ?? 9) - (SEV_ORDER[b.severity] ?? 9);
      });
  }, [cards, extraCards]);

  const fetchGuide = React.useCallback(() => {
    if (!fromCoords || !toCoords) return;
    setLoading(true);
    fetch(`/api/guide?oLat=${fromCoords[0]}&oLng=${fromCoords[1]}&dLat=${toCoords[0]}&dLng=${toCoords[1]}&seg=${seg}&lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        setCards(data.cards || []);
        setSources(data.sources || null);
        setUpdated(data.updated);
      })
      .catch(() => { setCards([]); })
      .finally(() => setLoading(false));
  }, [fromCoords?.[0], fromCoords?.[1], toCoords?.[0], toCoords?.[1], seg, lang]); // eslint-disable-line

  React.useEffect(() => {
    fetchGuide();
    const iv = setInterval(fetchGuide, 180000); // 3 min
    return () => clearInterval(iv);
  }, [fetchGuide]);

  const SEV_COLOR = { critical: "#ef4444", warning: "#f59e0b", info: "#0ea5e9", tip: "#22c55e" };
  const SEV_BG = { critical: "rgba(239,68,68,0.06)", warning: "rgba(245,158,11,0.06)", info: "rgba(14,165,233,0.04)", tip: "rgba(34,197,94,0.04)" };
  const SEV_BORDER = { critical: "rgba(239,68,68,0.2)", warning: "rgba(245,158,11,0.2)", info: "rgba(14,165,233,0.12)", tip: "rgba(34,197,94,0.12)" };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ ...dm, fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cards && cards.some(c => c.severity === "critical") ? "#ef4444" : "#22c55e", display: "inline-block", animation: loading ? "pulse 1.5s infinite" : "none" }} />
          PULS JADRANA
        </div>
        <button onClick={fetchGuide} disabled={loading}
          style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.bord}`, background: "transparent", color: loading ? C.mut : C.accent, fontSize: 11, cursor: loading ? "default" : "pointer", ...dm }}>
          {loading ? "⏳" : "↻"}
        </button>
      </div>

      {/* Cards */}
      {cards === null && mergedCards.length === 0 && (
        <div style={{ ...dm, fontSize: 13, color: C.mut, padding: "20px 0", textAlign: "center" }}>
          Prikupljam live podatke…
        </div>
      )}
      {cards !== null && mergedCards.length === 0 && (
        <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", ...dm, fontSize: 13, color: "#22c55e" }}>
          ✅ Sve čisto — bez incidenata na ruti
        </div>
      )}
      {mergedCards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mergedCards.map((card, i) => (
            <div key={card.id || i}
              style={{
                padding: card.isAI ? "14px 16px" : "12px 14px", borderRadius: 14,
                background: card.isAI ? "linear-gradient(135deg, rgba(14,165,233,0.06), rgba(139,92,246,0.06))" : (SEV_BG[card.severity] || SEV_BG.info),
                border: card.isAI ? "1px solid rgba(139,92,246,0.2)" : `1px solid ${SEV_BORDER[card.severity] || SEV_BORDER.info}`,
                animation: i === 0 && card.severity === "critical" ? "pulse 2s infinite" : card.isAI ? "fadeIn 0.5s both" : "none",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ ...dm, fontSize: 13, fontWeight: 700, color: card.isAI ? "#a78bfa" : (SEV_COLOR[card.severity] || C.text) }}>
                  {card.icon} {card.title}
                </div>
                <span style={{ ...dm, fontSize: 9, color: C.mut, whiteSpace: "nowrap", marginLeft: 8 }}>{card.source}</span>
              </div>
              <div style={{ ...dm, fontSize: card.isAI ? 13 : 12, color: card.isAI ? C.text : C.mut, marginTop: 4, lineHeight: 1.6 }}>
                {card.body}
              </div>
              {card.ts && <div style={{ ...dm, fontSize: 9, color: "rgba(100,116,139,0.35)", marginTop: 4 }}>{(() => { const s = Math.floor((Date.now() - new Date(card.ts).getTime()) / 1000); return s < 60 ? "upravo" : s < 3600 ? `prije ${Math.floor(s/60)} min` : s < 86400 ? `prije ${Math.floor(s/3600)}h` : ""; })()}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Source indicator */}
      {(sources || extraCards?.length > 0) && (
        <div style={{ ...dm, fontSize: 10, color: "rgba(100,116,139,0.4)", marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sources && <><span>HERE:{sources.here || 0}</span><span>Sense:{sources.yolo || 0}</span><span>Meteo:{sources.meteo ? "✓" : "–"}</span></>}
          {extraCards?.length > 0 && <span>GPS:{extraCards.length}</span>}
          {updated && <span style={{ marginLeft: "auto" }}>{new Date(updated).toLocaleTimeString("hr", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      )}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════
   JADRAN — Turistički vodič v6
   3 Phases: Pre-Trip → Kiosk Stay → Post-Stay
   Monetization: Free/Premium tiers + Affiliate + Concierge
   ══════════════════════════════════════════════════════════ */


/* ─── i18n TRANSLATIONS ─── */
const LANGS = [
  { code: "hr", flag: "🇭🇷", name: "Hrvatski" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "at", flag: "🇦🇹", name: "Österreich" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "si", flag: "🇸🇮", name: "Slovenščina" },
  { code: "cz", flag: "🇨🇿", name: "Čeština" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
];

const T = {
  // ─── Navigation & UI ───
  preTrip:    { hr:"Prije dolaska", de:"Vor Anreise", at:"Vor Anreise", en:"Pre-Trip", it:"Pre-viaggio", si:"Pred prihodom", cz:"Před příjezdem", pl:"Przed przyjazdem" },
  kiosk:      { hr:"Kiosk · Boravak", de:"Kiosk · Aufenthalt", at:"Kiosk · Aufenthalt", en:"Kiosk · Stay", it:"Kiosk · Soggiorno", si:"Kiosk · Bivanje", cz:"Kiosk · Pobyt", pl:"Kiosk · Pobyt" },
  postStay:   { hr:"Nakon odlaska", de:"Nach Abreise", at:"Nach Abreise", en:"Post-Stay", it:"Post-soggiorno", si:"Po odhodu", cz:"Po odjezdu", pl:"Po wyjeździe" },
  back:       { hr:"← Natrag", de:"← Zurück", at:"← Zurück", en:"← Back", it:"← Indietro", si:"← Nazaj", cz:"← Zpět", pl:"← Wstecz" },
  quickAccess:{ hr:"BRZI PRISTUP", de:"SCHNELLZUGRIFF", at:"SCHNELLZUGRIFF", en:"QUICK ACCESS", it:"ACCESSO RAPIDO", si:"HITRI DOSTOP", cz:"RYCHLÝ PŘÍSTUP", pl:"SZYBKI DOSTĘP" },
  activities: { hr:"AKTIVNOSTI", de:"AKTIVITÄTEN", at:"AKTIVITÄTEN", en:"ACTIVITIES", it:"ATTIVITÀ", si:"AKTIVNOSTI", cz:"AKTIVITY", pl:"AKTYWNOŚCI" },
  book:       { hr:"REZERVIRAJ", de:"BUCHEN", at:"BUCHEN", en:"BOOK", it:"PRENOTA", si:"REZERVIRAJ", cz:"REZERVOVAT", pl:"ZAREZERWUJ" },
  bookNow:    { hr:"Rezerviraj →", de:"Jetzt buchen →", at:"Jetzt buchen →", en:"Book now →", it:"Prenota ora →", si:"Rezerviraj →", cz:"Rezervovat →", pl:"Zarezerwuj →" },
  bookSent:   { hr:"Rezervacija poslana!", de:"Buchung gesendet!", at:"Buchung gesendet!", en:"Booking sent!", it:"Prenotazione inviata!", si:"Rezervacija poslana!", cz:"Rezervace odeslána!", pl:"Rezerwacja wysłana!" },
  bookConfirm:{ hr:"Potvrda unutar 30 min na vaš email.", de:"Bestätigung innerhalb von 30 Min per E-Mail.", at:"Bestätigung innerhalb von 30 Min per E-Mail.", en:"Confirmation within 30 min to your email.", it:"Conferma entro 30 min alla tua email.", si:"Potrditev v 30 min na vaš email.", cz:"Potvrzení do 30 min na váš email.", pl:"Potwierdzenie w ciągu 30 min na Twój email." },
  perPerson:  { hr:"po osobi", de:"pro Person", at:"pro Person", en:"per person", it:"a persona", si:"na osebo", cz:"na osobu", pl:"od osoby" },
  spotsLeft:  { hr:"mjesta", de:"Plätze", at:"Plätze", en:"spots", it:"posti", si:"mest", cz:"míst", pl:"miejsc" },
  budget:     { hr:"BUDŽET", de:"BUDGET", at:"BUDGET", en:"BUDGET", it:"BUDGET", si:"PRORAČUN", cz:"ROZPOČET", pl:"BUDŻET" },
  left:       { hr:"preostalo", de:"übrig", at:"übrig", en:"left", it:"rimanente", si:"preostalo", cz:"zbývá", pl:"pozostało" },
  perDay:     { hr:"€/dan", de:"€/Tag", at:"€/Tag", en:"€/day", it:"€/giorno", si:"€/dan", cz:"€/den", pl:"€/dzień" },
  day:        { hr:"Dan", de:"Tag", at:"Tag", en:"Day", it:"Giorno", si:"Dan", cz:"Den", pl:"Dzień" },
  simulation: { hr:"DOBA DANA", de:"TAGESZEIT", at:"TAGESZEIT", en:"TIME OF DAY", it:"ORA DEL GIORNO", si:"ČAS DNEVA", cz:"DENNÍ DOBA", pl:"PORA DNIA" },
  aiRec:      { hr:"AI PREPORUKA", de:"AI-EMPFEHLUNG", at:"AI-EMPFEHLUNG", en:"AI RECOMMENDATION", it:"SUGGERIMENTO AI", si:"AI PRIPOROČILO", cz:"AI DOPORUČENÍ", pl:"REKOMENDACJA AI" },

  // ─── Practical sections ───
  parking:    { hr:"Parking", de:"Parkplatz", at:"Parkplatz", en:"Parking", it:"Parcheggio", si:"Parkiranje", cz:"Parkování", pl:"Parking" },
  beaches:    { hr:"Plaže", de:"Strände", at:"Strände", en:"Beaches", it:"Spiagge", si:"Plaže", cz:"Pláže", pl:"Plaże" },
  sun:        { hr:"Sunce & UV", de:"Sonne & UV", at:"Sonne & UV", en:"Sun & UV", it:"Sole & UV", si:"Sonce & UV", cz:"Slunce & UV", pl:"Słońce & UV" },
  routes:     { hr:"Prijevoz", de:"Transport", at:"Transport", en:"Transport", it:"Trasporti", si:"Prevoz", cz:"Doprava", pl:"Transport" },
  food:       { hr:"Hrana", de:"Essen", at:"Essen", en:"Food", it:"Cibo", si:"Hrana", cz:"Jídlo", pl:"Jedzenie" },
  emergency:  { hr:"Hitno", de:"Notfall", at:"Notfall", en:"Emergency", it:"Emergenza", si:"Nujno", cz:"Nouzové", pl:"Nagłe" },
  gems:       { hr:"Hidden Gems", de:"Hidden Gems", at:"Hidden Gems", en:"Hidden Gems", it:"Gemme Nascoste", si:"Skriti dragulji", cz:"Skryté perly", pl:"Ukryte perły" },
  aiGuide:    { hr:"AI Vodič", de:"AI-Guide", at:"AI-Guide", en:"AI Guide", it:"Guida AI", si:"AI Vodič", cz:"AI Průvodce", pl:"AI Przewodnik" },
  navigate:   { hr:"Navigiraj", de:"Navigieren", at:"Navigieren", en:"Navigate", it:"Naviga", si:"Navigiraj", cz:"Navigovat", pl:"Nawiguj" },
  openMap:    { hr:"Otvori kartu", de:"Karte öffnen", at:"Karte öffnen", en:"Open map", it:"Apri mappa", si:"Odpri zemljevid", cz:"Otevřít mapu", pl:"Otwórz mapę" },

  // ─── Onboarding ───
  welcome:    { hr:"Dobrodošli u JADRAN AI", de:"Willkommen bei JADRAN AI", at:"Willkommen bei JADRAN AI", en:"Welcome to JADRAN AI", it:"Benvenuti su JADRAN AI", si:"Dobrodošli v JADRAN AI", cz:"Vítejte v JADRAN AI", pl:"Witamy w JADRAN AI" },
  hostUses:   { hr:"Vaš domaćin koristi JADRAN AI.", de:"Ihr Gastgeber nutzt JADRAN AI.", at:"Ihr Gastgeber nutzt JADRAN AI.", en:"Your host uses JADRAN AI.", it:"Il tuo host usa JADRAN AI.", si:"Vaš gostitelj uporablja JADRAN AI.", cz:"Váš hostitel používá JADRAN AI.", pl:"Twój gospodarz korzysta z JADRAN AI." },
  createProfile:{ hr:"Kreiraj profil →", de:"Profil erstellen →", at:"Profil erstellen →", en:"Create profile →", it:"Crea profilo →", si:"Ustvari profil →", cz:"Vytvořit profil →", pl:"Utwórz profil →" },
  interests:  { hr:"Što vas zanima?", de:"Was interessiert Sie?", at:"Was interessiert Sie?", en:"What interests you?", it:"Cosa ti interessa?", si:"Kaj vas zanima?", cz:"Co vás zajímá?", pl:"Co Cię interesuje?" },
  chooseMin:  { hr:"Odaberite najmanje 2", de:"Wählen Sie mindestens 2", at:"Wählen Sie mindestens 2", en:"Choose at least 2", it:"Scegli almeno 2", si:"Izberite vsaj 2", cz:"Vyberte alespoň 2", pl:"Wybierz co najmniej 2" },
  next:       { hr:"Dalje →", de:"Weiter →", at:"Weiter →", en:"Next →", it:"Avanti →", si:"Naprej →", cz:"Další →", pl:"Dalej →" },
  profileDone:{ hr:"Profil kreiran!", de:"Profil erstellt!", at:"Profil erstellt!", en:"Profile created!", it:"Profilo creato!", si:"Profil ustvarjen!", cz:"Profil vytvořen!", pl:"Profil utworzony!" },
  preparing:  { hr:"JADRAN AI priprema vaš personalizirani plan.", de:"JADRAN AI bereitet Ihren personalisierten Plan vor.", at:"JADRAN AI bereitet Ihren personalisierten Plan vor.", en:"JADRAN AI is preparing your personalized plan.", it:"JADRAN AI sta preparando il tuo piano personalizzato.", si:"JADRAN AI pripravlja vaš osebni načrt.", cz:"JADRAN AI připravuje váš personalizovaný plán.", pl:"JADRAN AI przygotowuje Twój spersonalizowany plan." },
  toPreTrip:  { hr:"Na Pre-Trip →", de:"Zum Pre-Trip →", at:"Zum Pre-Trip →", en:"To Pre-Trip →", it:"Al Pre-viaggio →", si:"Na Pre-Trip →", cz:"Na Pre-Trip →", pl:"Do Pre-Trip →" },

  // ─── Premium ───
  premiumTitle:{ hr:"JADRAN AI Premium", de:"JADRAN AI Premium", at:"JADRAN AI Premium", en:"JADRAN AI Premium", it:"JADRAN AI Premium", si:"JADRAN AI Premium", cz:"JADRAN AI Premium", pl:"JADRAN AI Premium" },
  premiumDesc: { hr:"Otključajte AI vodič, skrivena mjesta i personalizirane preporuke.", de:"Schalten Sie AI-Guide, versteckte Orte und personalisierte Empfehlungen frei.", at:"Schalten Sie AI-Guide, versteckte Orte und personalisierte Empfehlungen frei.", en:"Unlock AI guide, hidden places, and personalized recommendations.", it:"Sblocca guida AI, luoghi nascosti e consigli personalizzati.", si:"Odklenite AI vodič, skrita mesta in prilagojene priporočila.", cz:"Odemkněte AI průvodce, skrytá místa a personalizovaná doporučení.", pl:"Odblokuj przewodnik AI, ukryte miejsca i spersonalizowane rekomendacje." },
  unlockPremium:{ hr:"Otključaj Premium — 9.99€ →", de:"Premium freischalten — 9.99€ →", at:"Premium freischalten — 9.99€ →", en:"Unlock Premium — 9.99€ →", it:"Sblocca Premium — 9.99€ →", si:"Odklenite Premium — 9.99€ →", cz:"Odemknout Premium — 9.99€ →", pl:"Odblokuj Premium — 9.99€ →" },
  entireStay: { hr:"za cijeli boravak · jednokratno", de:"für den gesamten Aufenthalt · einmalig", at:"für den gesamten Aufenthalt · einmalig", en:"for entire stay · one-time", it:"per tutto il soggiorno · una tantum", si:"za celotno bivanje · enkratno", cz:"na celý pobyt · jednorázově", pl:"na cały pobyt · jednorazowo" },

  // ─── Chat ───
  askAnything:{ hr:"Pitajte bilo što o Jadranu", de:"Fragen Sie alles über die Adria", at:"Fragen Sie alles über die Adria", en:"Ask anything about the Adriatic", it:"Chiedi qualsiasi cosa sull'Adriatico", si:"Vprašajte karkoli o Jadranu", cz:"Zeptejte se na cokoliv o Jadranu", pl:"Zapytaj o cokolwiek nad Adriatykiem" },
  askPlaceholder:{ hr:"Pitajte nešto...", de:"Fragen Sie etwas...", at:"Fragen Sie etwas...", en:"Ask something...", it:"Chiedi qualcosa...", si:"Vprašajte...", cz:"Zeptejte se...", pl:"Zapytaj..." },

  // ─── Post-stay ───
  thanks:     { hr:"Hvala", de:"Danke", at:"Danke", en:"Thank you", it:"Grazie", si:"Hvala", cz:"Děkujeme", pl:"Dziękujemy" },
  inviteFriends:{ hr:"Pozovite prijatelje — 15% popust", de:"Freunde einladen — 15% Rabatt", at:"Freunde einladen — 15% Rabatt", en:"Invite friends — 15% off", it:"Invita amici — 15% di sconto", si:"Povabite prijatelje — 15% popust", cz:"Pozvěte přátele — 15% sleva", pl:"Zaproś przyjaciół — 15% zniżki" },
  shareCode:  { hr:"Podijeli kod →", de:"Code teilen →", at:"Code teilen →", en:"Share code →", it:"Condividi codice →", si:"Deli kodo →", cz:"Sdílet kód →", pl:"Udostępnij kod →" },
  nextYear:   { hr:"Sljedeće godine? 🏖️", de:"Nächstes Jahr? 🏖️", at:"Nächstes Jahr? 🏖️", en:"Next year? 🏖️", it:"L'anno prossimo? 🏖️", si:"Prihodnje leto? 🏖️", cz:"Příští rok? 🏖️", pl:"Następny rok? 🏖️" },
  planSummer: { hr:"Planiraj ljeto 2027 →", de:"Sommer 2027 planen →", at:"Sommer 2027 planen →", en:"Plan summer 2027 →", it:"Pianifica estate 2027 →", si:"Načrtuj poletje 2027 →", cz:"Plánovat léto 2027 →", pl:"Planuj lato 2027 →" },

  // ─── Greetings by time ───
  morning:    { hr:"Dobro jutro", de:"Guten Morgen", at:"Guten Morgen", en:"Good morning", it:"Buongiorno", si:"Dobro jutro", cz:"Dobré ráno", pl:"Dzień dobry" },
  midday:     { hr:"Dobar dan", de:"Guten Tag", at:"Grüß Gott", en:"Good afternoon", it:"Buon pomeriggio", si:"Dober dan", cz:"Dobré odpoledne", pl:"Dzień dobry" },
  evening:    { hr:"Dobra večer", de:"Guten Abend", at:"Guten Abend", en:"Good evening", it:"Buonasera", si:"Dober večer", cz:"Dobrý večer", pl:"Dobry wieczór" },


  // ─── i18n round 2 ───
  hostUsesName:{ hr:"Vaš domaćin {HOST} koristi JADRAN AI.", de:"Ihr Gastgeber {HOST} nutzt JADRAN AI.", at:"Ihr Gastgeber {HOST} nutzt JADRAN AI.", en:"Your host {HOST} uses JADRAN AI.", it:"Il tuo host {HOST} usa JADRAN AI.", si:"Vaš gostitelj {HOST} uporablja JADRAN AI.", cz:"Váš hostitel {HOST} používá JADRAN AI.", pl:"Twój gospodarz {HOST} korzysta z JADRAN AI." },
  onboardSub: { hr:"60 sekundi → personalizirani odmor.", de:"60 Sekunden → personalisierter Urlaub.", at:"60 Sekunden → personalisierter Urlaub.", en:"60 seconds → personalized vacation.", it:"60 secondi → vacanza personalizzata.", si:"60 sekund → prilagojene počitnice.", cz:"60 sekund → personalizovaná dovolená.", pl:"60 sekund → spersonalizowane wakacje." },
  step1:      { hr:"KORAK 1/2 — INTERESI", de:"SCHRITT 1/2 — INTERESSEN", at:"SCHRITT 1/2 — INTERESSEN", en:"STEP 1/2 — INTERESTS", it:"PASSO 1/2 — INTERESSI", si:"KORAK 1/2 — INTERESI", cz:"KROK 1/2 — ZÁJMY", pl:"KROK 1/2 — ZAINTERESOWANIA" },
  forecast:   { hr:"PROGNOZA", de:"WETTERVORHERSAGE", at:"WETTERVORHERSAGE", en:"WEATHER FORECAST", it:"PREVISIONI METEO", si:"NAPOVED", cz:"PŘEDPOVĚĎ", pl:"PROGNOZA" },
  optPlan:    { hr:"OPTIMIRANI PLAN", de:"OPTIMIERTER PLAN", at:"OPTIMIERTER PLAN", en:"OPTIMIZED PLAN", it:"PIANO OTTIMIZZATO", si:"OPTIMIRANI NAČRT", cz:"OPTIMALIZOVANÝ PLÁN", pl:"ZOPTYMALIZOWANY PLAN" },
  rainDay:    { hr:"Kišni dan", de:"Regentag", at:"Regentag", en:"Rainy day", it:"Giorno di pioggia", si:"Deževen dan", cz:"Deštivý den", pl:"Deszczowy dzień" },
  sunnyDay:   { hr:"Sunčani dan", de:"Sonniger Tag", at:"Sonniger Tag", en:"Sunny day", it:"Giornata di sole", si:"Sončen dan", cz:"Slunečný den", pl:"Słoneczny dzień" },
  palaceTour: { hr:"Palača + Muzej", de:"Palast-Tour + Museum", at:"Palast-Tour + Museum", en:"Palace + Museum", it:"Palazzo + Museo", si:"Palača + Muzej", cz:"Palác + Muzeum", pl:"Pałac + Muzeum" },
  beachKayak: { hr:"Plaža + Kajak", de:"Strandtag + Kayak", at:"Strandtag + Kayak", en:"Beach + Kayak", it:"Spiaggia + Kayak", si:"Plaža + Kajak", cz:"Pláž + Kajak", pl:"Plaża + Kajak" },
  aiOptimized:{ hr:"AI je optimizirao raspored prema vremenu.", de:"AI hat den Zeitplan wetterabhängig optimiert.", at:"AI hat den Zeitplan wetterabhängig optimiert.", en:"AI optimized the schedule based on weather.", it:"L'AI ha ottimizzato il programma in base al meteo.", si:"AI je optimiziral urnik glede na vreme.", cz:"AI optimalizovala plán podle počasí.", pl:"AI zoptymalizowało plan na podstawie pogody." },
  packages:   { hr:"PAKETI", de:"PAKETE", at:"PAKETE", en:"PACKAGES", it:"PACCHETTI", si:"PAKETI", cz:"BALÍČKY", pl:"PAKIETY" },
  simArrival: { hr:"Pogledajte putovanje →", de:"Reise ansehen →", at:"Reise ansehen →", en:"View your journey →", it:"Visualizza il viaggio →", si:"Oglejte si potovanje →", cz:"Zobrazit cestu →", pl:"Zobacz podróż →" },
  safeTrip:   { hr:"Sretan put!", de:"Gute Reise!", at:"Gute Reise!", en:"Safe travels!", it:"Buon viaggio!", si:"Srečno pot!", cz:"Šťastnou cestu!", pl:"Szczęśliwej podróży!" },
  onTheRoad:  { hr:"NA PUTU", de:"UNTERWEGS", at:"UNTERWEGS", en:"ON THE ROAD", it:"IN VIAGGIO", si:"NA POTI", cz:"NA CESTĚ", pl:"W DRODZE" },
  arrival:    { hr:"DOLAZAK", de:"ANKUNFT", at:"ANKUNFT", en:"ARRIVAL", it:"ARRIVO", si:"PRIHOD", cz:"PŘÍJEZD", pl:"PRZYJAZD" },
  sunny:      { hr:"Sunčano", de:"Sonnig", at:"Sonnig", en:"Sunny", it:"Soleggiato", si:"Sončno", cz:"Slunečno", pl:"Słonecznie" },
  sea:        { hr:"More", de:"Meer", at:"Meer", en:"Sea", it:"Mare", si:"Morje", cz:"Moře", pl:"Morze" },
  sunset:     { hr:"Zalazak sunca", de:"Sonnenuntergang", at:"Sonnenuntergang", en:"Sunset", it:"Tramonto", si:"Sončni zahod", cz:"Západ slunce", pl:"Zachód słońca" },
  skipBtn:    { hr:"Preskoči", de:"Überspringen", at:"Überspringen", en:"Skip", it:"Salta", si:"Preskoči", cz:"Přeskočit", pl:"Pomiń" },
  tagline:    { hr:"Vaš Jadran, reimaginiran", de:"Ihre Adria, neu gedacht", at:"Ihre Adria, neu gedacht", en:"Your Adriatic, Reimagined", it:"Il tuo Adriatico, reinventato", si:"Vaš Jadran, na novo", cz:"Váš Jadran, znovu", pl:"Twój Adriatyk, na nowo" },
  payFeatures1:{ hr:"AI Vodič — pitajte bilo što 24/7", de:"AI-Guide — fragen Sie alles 24/7", at:"AI-Guide — fragen Sie alles 24/7", en:"AI Guide — ask anything 24/7", it:"Guida AI — chiedi qualsiasi cosa 24/7", si:"AI Vodič — vprašajte karkoli 24/7", cz:"AI Průvodce — ptejte se na cokoliv 24/7", pl:"Przewodnik AI — pytaj o cokolwiek 24/7" },
  payFeatures2:{ hr:"6 Hidden Gems sa lokalnim savjetima", de:"6 Hidden Gems mit lokalen Tipps", at:"6 Hidden Gems mit lokalen Tipps", en:"6 Hidden Gems with local tips", it:"6 Gemme nascoste con consigli locali", si:"6 skritih draguljev z lokalnimi nasveti", cz:"6 skrytých perel s místními tipy", pl:"6 ukrytych pereł z lokalnymi wskazówkami" },
  payFeatures3:{ hr:"Personalizirane preporuke po vremenu i interesima", de:"Personalisierte Empfehlungen nach Wetter und Interessen", at:"Personalisierte Empfehlungen nach Wetter und Interessen", en:"Personalized recommendations by weather and interests", it:"Consigli personalizzati per meteo e interessi", si:"Prilagojene priporočila po vremenu in interesih", cz:"Personalizovaná doporučení podle počasí a zájmů", pl:"Spersonalizowane rekomendacje wg pogody i zainteresowań" },
  payFeatures4:{ hr:"Rezervacije aktivnosti s vodičem", de:"Reiseberater-Buchung von Aktivitäten", at:"Reiseberater-Buchung von Aktivitäten", en:"Guided activity bookings", it:"Prenotazione attività con guida", si:"Rezervacije aktivnosti s vodičem", cz:"Rezervace aktivit s průvodcem", pl:"Rezerwacje aktywności z przewodnikiem" },
  payFeatures5:{ hr:"Loyalty bodovi i popusti za sljedeći put", de:"Treuepunkte und Rabatte für den nächsten Besuch", at:"Treuepunkte und Rabatte für den nächsten Besuch", en:"Loyalty points and discounts for next visit", it:"Punti fedeltà e sconti per la prossima visita", si:"Točke zvestobe in popusti za naslednjič", cz:"Věrnostní body a slevy na příští návštěvu", pl:"Punkty lojalnościowe i zniżki na następny pobyt" },
  payVia:     { hr:"Plaćanje putem Stripe · SIAL Consulting d.o.o.", de:"Zahlung über Stripe · SIAL Consulting d.o.o.", at:"Zahlung über Stripe · SIAL Consulting d.o.o.", en:"Payment via Stripe · SIAL Consulting d.o.o.", it:"Pagamento tramite Stripe · SIAL Consulting d.o.o.", si:"Plačilo prek Stripe · SIAL Consulting d.o.o.", cz:"Platba přes Stripe · SIAL Consulting d.o.o.", pl:"Płatność przez Stripe · SIAL Consulting d.o.o." },
  earlyBird:  { hr:"Early Bird 2027: 20% popusta pri rezervaciji prije 1. listopada.", de:"Early Bird 2027: 20% Rabatt bei Buchung vor 1. Oktober.", at:"Early Bird 2027: 20% Rabatt bei Buchung vor 1. Oktober.", en:"Early Bird 2027: 20% off when booking before October 1st.", it:"Early Bird 2027: 20% di sconto prenotando prima del 1° ottobre.", si:"Early Bird 2027: 20% popusta pri rezervaciji pred 1. oktobrom.", cz:"Early Bird 2027: 20% sleva při rezervaci před 1. říjnem.", pl:"Early Bird 2027: 20% zniżki przy rezerwacji przed 1 października." },
  transitTip1:{ hr:"Ljubljana za 2h — preporučujemo Gostilna Pri Lojzetu. Zadnja jeftina pumpa prije HR granice.", de:"Ljubljana in 2h — wir empfehlen Gostilna Pri Lojzetu. Letzte günstige Tankstelle vor HR-Grenze.", at:"Ljubljana in 2h — wir empfehlen Gostilna Pri Lojzetu. Letzte günstige Tankstelle vor HR-Grenze.", en:"Ljubljana in 2h — we recommend Gostilna Pri Lojzetu. Last cheap gas before HR border.", it:"Lubiana in 2h — consigliamo Gostilna Pri Lojzetu. Ultimo distributore economico prima del confine HR.", si:"Ljubljana čez 2h — priporočamo Gostilna Pri Lojzetu. Zadnja poceni črpalka pred HR mejo.", cz:"Lublaň za 2h — doporučujeme Gostilna Pri Lojzetu. Poslední levná pumpa před HR hranicí.", pl:"Lublana za 2h — polecamy Gostilna Pri Lojzetu. Ostatnia tania stacja przed granicą HR." },
  transitTip2:{ hr:"HR cestarina: ~28€ do Splita. ENC preporučen. A1 HR SIM za 7€ u prvoj benzinskoj.", de:"HR Maut: ~28€ bis Split. ENC empfohlen. A1 HR SIM für 7€ an der ersten Tankstelle.", at:"HR Maut: ~28€ bis Split. ENC empfohlen. A1 HR SIM für 7€ an der ersten Tankstelle.", en:"HR toll: ~28€ to Split. ENC recommended. A1 HR SIM for 7€ at first gas station.", it:"Pedaggio HR: ~28€ fino a Spalato. ENC consigliato. SIM A1 HR per 7€ al primo distributore.", si:"HR cestnina: ~28€ do Splita. ENC priporočen. A1 HR SIM za 7€ na prvi bencinski.", cz:"HR mýtné: ~28€ do Splitu. ENC doporučen. A1 HR SIM za 7€ na první pumpě.", pl:"Opłata HR: ~28€ do Splitu. ENC zalecany. SIM A1 HR za 7€ na pierwszej stacji." },
  transitTip3:{ hr:"Još ~45 min! Domaćin {HOST} obaviješten. Konzum 400m od apartmana za prvi shopping.", de:"Noch ~45 Min! Gastgeber {HOST} informiert. Konzum 400m von der Unterkunft für ersten Einkauf.", at:"Noch ~45 Min! Gastgeber {HOST} informiert. Konzum 400m von der Unterkunft für ersten Einkauf.", en:"~45 min left! Host {HOST} notified. Konzum 400m from apartment for first shopping.", it:"Ancora ~45 min! Host {HOST} avvisato. Konzum a 400m dall'appartamento per la prima spesa.", si:"Še ~45 min! Gostitelj {HOST} obveščen. Konzum 400m od apartmaja za prvi nakup.", cz:"Ještě ~45 min! Hostitel {HOST} informován. Konzum 400m od apartmánu pro první nákup.", pl:"Jeszcze ~45 min! Gospodarz {HOST} powiadomiony. Konzum 400m od apartamentu na pierwsze zakupy." },
  // ─── Missing i18n keys (bugfix) ───
  booked:     { hr:"Rezervirano", de:"Gebucht", at:"Gebucht", en:"Booked", it:"Prenotato", si:"Rezervirano", cz:"Zarezervováno", pl:"Zarezerwowano" },
  daysToGo:   { hr:"dana do odmora", de:"Tage bis zum Urlaub", at:"Tage bis zum Urlaub", en:"days until vacation", it:"giorni alla vacanza", si:"dni do počitnic", cz:"dní do dovolené", pl:"dni do wakacji" },
  arrived:    { hr:"Stigli! → Pokreni Kiosk", de:"Angekommen! → Kiosk starten", at:"Angekommen! → Kiosk starten", en:"Arrived! → Start Kiosk", it:"Arrivati! → Avvia Kiosk", si:"Prispeli! → Zaženi Kiosk", cz:"Dorazili! → Spustit Kiosk", pl:"Przyjechaliśmy! → Uruchom Kiosk" },
  points:     { hr:"bodova", de:"Punkte", at:"Punkte", en:"points", it:"punti", si:"točk", cz:"bodů", pl:"punktów" },
  more:       { hr:"još", de:"Noch", at:"Noch", en:"more", it:"ancora", si:"še", cz:"ještě", pl:"jeszcze" },
  loyaltyTier:{ hr:"Morski val", de:"Meereswelle", at:"Meereswelle", en:"Sea Wave", it:"Onda marina", si:"Morski val", cz:"Mořská vlna", pl:"Fala morska" },
  daysStay:   { hr:"dana", de:"Tage", at:"Tage", en:"days", it:"giorni", si:"dni", cz:"dní", pl:"dni" },
  activitiesDone:{ hr:"aktivnosti", de:"Aktivitäten", at:"Aktivitäten", en:"activities", it:"attività", si:"aktivnosti", cz:"aktivit", pl:"aktywności" },
  unforgettable:{ hr:"Nezaboravno", de:"Unvergesslich", at:"Unvergesslich", en:"Unforgettable", it:"Indimenticabile", si:"Nepozabno", cz:"Nezapomenutelné", pl:"Niezapomniane" },
  bothDiscount:{ hr:"Oboje dobivate popust na sljedeću rezervaciju", de:"Beide erhalten Rabatt auf die nächste Buchung", at:"Beide erhalten Rabatt auf die nächste Buchung", en:"Both of you get a discount on next booking", it:"Entrambi ottenete uno sconto sulla prossima prenotazione", si:"Oba dobita popust na naslednjo rezervacijo", cz:"Oba získáte slevu na příští rezervaci", pl:"Oboje otrzymujecie zniżkę na następną rezerwację" },
  askDalmatia:{ hr:"Pitajte bilo što o Dalmaciji", de:"Fragen Sie alles über Dalmatien", at:"Fragen Sie alles über Dalmatien", en:"Ask anything about Dalmatia", it:"Chiedi qualsiasi cosa sulla Dalmazia", si:"Vprašajte karkoli o Dalmaciji", cz:"Zeptejte se na cokoliv o Dalmácii", pl:"Zapytaj o cokolwiek o Dalmacji" },
  localTip:   { hr:"Lokalni znaju — turisti ne", de:"Einheimische wissen — Touristen nicht", at:"Einheimische wissen — Touristen nicht", en:"Locals know — tourists don't", it:"I locali sanno — i turisti no", si:"Domačini vedo — turisti ne", cz:"Místní ví — turisté ne", pl:"Lokalni wiedzą — turyści nie" },
  checkOut:   { hr:"Check-out →", de:"Check-out →", at:"Check-out →", en:"Check-out →", it:"Check-out →", si:"Check-out →", cz:"Check-out →", pl:"Check-out →" },
  chatPrompt1:{ hr:"Što danas s djecom?", de:"Was heute mit Kindern?", at:"Was heute mit Kindern?", en:"What to do with kids today?", it:"Cosa fare con i bambini oggi?", si:"Kaj danes z otroki?", cz:"Co dnes s dětmi?", pl:"Co dziś z dziećmi?" },
  chatPrompt2:{ hr:"Tajne plaže?", de:"Geheime Strände?", at:"Geheime Strände?", en:"Secret beaches?", it:"Spiagge segrete?", si:"Skrite plaže?", cz:"Tajné pláže?", pl:"Tajne plaże?" },
  chatPrompt3:{ hr:"Preporuka za večeru?", de:"Abendessen-Tipp?", at:"Abendessen-Tipp?", en:"Dinner recommendation?", it:"Consiglio per cena?", si:"Priporočilo za večerjo?", cz:"Tip na večeři?", pl:"Polecenie na kolację?" },
  chatPrompt4:{ hr:"Gdje parkirati u Splitu?", de:"Wo parken in Split?", at:"Wo parken in Split?", en:"Where to park in Split?", it:"Dove parcheggiare a Spalato?", si:"Kje parkirati v Splitu?", cz:"Kde parkovat ve Splitu?", pl:"Gdzie parkować w Splicie?" },
  viewOn:     { hr:"Pogledaj na", de:"Ansehen auf", at:"Ansehen auf", en:"View on", it:"Vedi su", si:"Poglej na", cz:"Zobrazit na", pl:"Zobacz na" },
  bookVia:    { hr:"Rezerviraj preko", de:"Buchen über", at:"Buchen über", en:"Book via", it:"Prenota tramite", si:"Rezerviraj prek", cz:"Rezervovat přes", pl:"Zarezerwuj przez" },
  familyPrice:{ hr:"Obitelj", de:"Familie", at:"Familie", en:"Family", it:"Famiglia", si:"Družina", cz:"Rodina", pl:"Rodzina" },
  revenue:    { hr:"PRIHOD", de:"UMSATZ", at:"UMSATZ", en:"REVENUE", it:"RICAVI", si:"PRIHODKI", cz:"PŘÍJMY", pl:"PRZYCHODY" },
  // ─── Accommodation ───
  findStay:   { hr:"PRONAĐI SMJEŠTAJ", de:"UNTERKUNFT FINDEN", at:"UNTERKUNFT FINDEN", en:"FIND ACCOMMODATION", it:"TROVA ALLOGGIO", si:"NAJDI NASTANITEV", cz:"NAJÍT UBYTOVÁNÍ", pl:"ZNAJDŹ NOCLEG" },
  extendStay: { hr:"Produžite boravak?", de:"Aufenthalt verlängern?", at:"Aufenthalt verlängern?", en:"Extend your stay?", it:"Prolungare il soggiorno?", si:"Podaljšaj bivanje?", cz:"Prodloužit pobyt?", pl:"Przedłużyć pobyt?" },
  planNext:   { hr:"Planirajte sljedeći odmor", de:"Planen Sie den nächsten Urlaub", at:"Planen Sie den nächsten Urlaub", en:"Plan your next vacation", it:"Pianifica la prossima vacanza", si:"Načrtujte naslednje počitnice", cz:"Naplánujte další dovolenou", pl:"Zaplanuj następne wakacje" },
  bestDeals:  { hr:"Najbolje ponude", de:"Beste Angebote", at:"Beste Angebote", en:"Best deals", it:"Migliori offerte", si:"Najboljše ponudbe", cz:"Nejlepší nabídky", pl:"Najlepsze oferty" },
  browseOn:   { hr:"Pogledaj na Booking.com →", de:"Auf Booking.com ansehen →", at:"Auf Booking.com ansehen →", en:"Browse on Booking.com →", it:"Cerca su Booking.com →", si:"Poglej na Booking.com →", cz:"Prohlédnout na Booking.com →", pl:"Zobacz na Booking.com →" },
  night:      { hr:"Laku noć", de:"Gute Nacht", at:"Gute Nacht", en:"Good night", it:"Buonanotte", si:"Lahko noč", cz:"Dobrou noc", pl:"Dobranoc" },
};

// AT = standard Hochdeutsch: copy all DE values into AT keys
Object.keys(T).forEach(k => { if (T[k] && T[k].de !== undefined) T[k].at = T[k].de; });

// Helper: get translation for current language, fallback to HR then EN
const t = (key, lang) => {
  const entry = T[key];
  if (!entry) return key;
  // AT uses standard DE (Hochdeutsch), no dialect
  const l = lang === "at" ? "de" : lang;
  return entry[l] || entry.hr || entry.en || key;
};

/* ─── GOOGLE MAPS COORDINATES ─── */
// Navigation helper — opens Google Maps directions to any lat/lng
const navigateTo = (lat, lng) => {
  if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};


/* ─── DATA ─── */
const GUEST_FALLBACK = {
  name: "Gost", first: "Gost", country: "HR", lang: "hr", flag: "🇭🇷",
  adults: 2, kids: 0, kidsAges: [], interests: ["gastro", "adventure"],
  arrival: null, departure: null, car: true, carPlate: "",
  accommodation: "Apartman", host: "", hostPhone: "",
  budget: 0, spent: 0, email: ""
};

const W_DEFAULT = { icon: "☀️", temp: 28, sea: 24, uv: 7, wind: "Z 8 km/h", sunset: "20:30", humidity: 50 };

const FORECAST_DAYS = {
  hr: ["Pon","Uto","Sri","Čet","Pet","Sub","Ned"],
  de: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  at: ["Mo","Di","Mi","Do","Fr","Sa","So"],
  en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  it: ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"],
  si: ["Pon","Tor","Sre","Čet","Pet","Sob","Ned"],
  cz: ["Po","Út","St","Čt","Pá","So","Ne"],
  pl: ["Pon","Wt","Śr","Czw","Pt","Sob","Ndz"],
};
// Forecast fallback — overridden by Gemini if available
const FORECAST_DEFAULT = [
  { di: 0, icon: "☀️", h: 31, l: 22 }, { di: 1, icon: "⛅", h: 28, l: 21 },
  { di: 2, icon: "🌧️", h: 23, l: 19 }, { di: 3, icon: "☀️", h: 30, l: 22 },
  { di: 4, icon: "☀️", h: 32, l: 23 }, { di: 5, icon: "⛅", h: 29, l: 21 },
  { di: 6, icon: "☀️", h: 31, l: 22 },
];

const PRACTICAL = {
  // parking, beach, food, shop, bakery, pharmacy, culture, fuel — all served by /api/nearby
  sun: { icon: "☀️", tk: "sun", items: [
    { n: "UV Index", note: {hr:"SPF 50+ obavezno između 11-16h!",de:"SPF 50+ Pflicht zwischen 11-16 Uhr!",en:"SPF 50+ mandatory between 11am-4pm!",it:"SPF 50+ obbligatorio tra le 11-16!",si:"SPF 50+ obvezno med 11-16h!",cz:"SPF 50+ povinné mezi 11-16h!",pl:"SPF 50+ obowiązkowe między 11-16!"}, warn: true, uvDynamic: true },
    { n: {hr:"Hidracija",de:"Hydration",en:"Hydration",it:"Idratazione",si:"Hidracija",cz:"Hydratace",pl:"Nawodnienie"}, note: {hr:"Min. 3L vode dnevno · Djeca češće!",de:"Min. 3L Wasser täglich · Kinder öfter!",en:"Min. 3L water daily · Kids more often!",it:"Min. 3L acqua al giorno · Bambini più spesso!",si:"Min. 3L vode dnevno · Otroci pogosteje!",cz:"Min. 3L vody denně · Děti častěji!",pl:"Min. 3L wody dziennie · Dzieci częściej!"} },
    { n: {hr:"Ljekarna",de:"Apotheke",en:"Pharmacy",it:"Farmacia",si:"Lekarna",cz:"Lékárna",pl:"Apteka"}, note: {hr:"Potražite najbližu u kategoriji 'Ljekarna'",de:"Suchen Sie die nächste unter 'Apotheke'",en:"Find nearest in 'Pharmacy' category",it:"Trova la più vicina in 'Farmacia'",si:"Poiščite najbližjo v kategoriji 'Lekarna'",cz:"Najděte nejbližší v kategorii 'Lékárna'",pl:"Znajdź najbliższą w kategorii 'Apteka'"} },
  ]},
  emergency: { icon: "🏥", tk: "emergency", items: [
    { n: {hr:"Hitna pomoć",de:"Notruf",en:"Emergency",it:"Emergenza",si:"Nujna pomoč",cz:"Tísňové volání",pl:"Pogotowie"}, note: "112", warn: true },
    { n: {hr:"Policija",de:"Polizei",en:"Police",it:"Polizia",si:"Policija",cz:"Policie",pl:"Policja"}, note: "192" },
    { n: {hr:"Hitna medicinska",de:"Rettungsdienst",en:"Ambulance",it:"Ambulanza",si:"Reševalci",cz:"Záchranná služba",pl:"Pogotowie ratunkowe"}, note: "194" },
    { n: {hr:"Obalna straža",de:"Küstenwache",en:"Coast Guard",it:"Guardia costiera",si:"Obalna straža",cz:"Pobřežní stráž",pl:"Straż przybrzeżna"}, note: "195" },
    { n: {hr:"Vatrogasci",de:"Feuerwehr",en:"Fire Department",it:"Vigili del fuoco",si:"Gasilci",cz:"Hasiči",pl:"Straż pożarna"}, note: "193" },
  ]},
};

const GEMS = [
  { name: "Uvala Vruja", emoji: "🏝️", lat: 43.3712, lng: 16.7893, region: "split", premium: false,
    type: {hr:"Tajna plaža",de:"Geheimstrand",en:"Secret beach",it:"Spiaggia segreta",si:"Skrita plaža",cz:"Tajná pláž",pl:"Tajna plaża"},
    desc: {hr:"Između Omiša i Makarske, dostupna samo pješice. Kristalno more, potpuno divlja.",de:"Zwischen Omiš und Makarska, nur zu Fuß erreichbar. Kristallklares Meer, völlig wild.",en:"Between Omiš and Makarska, accessible only on foot. Crystal clear sea, completely wild.",it:"Tra Omiš e Makarska, raggiungibile solo a piedi. Mare cristallino, completamente selvaggia.",si:"Med Omišem in Makarsko, dostopna le peš. Kristalno morje, popolnoma divja.",cz:"Mezi Omišem a Makarskou, přístupná pouze pěšky. Křišťálové moře, zcela divoká.",pl:"Między Omišem a Makarską, dostępna tylko pieszo. Krystaliczne morze, całkowicie dzika."},
    tip: {hr:"Ponesite vode i cipele za hodanje! Nema sjene.",de:"Bringen Sie Wasser und Wanderschuhe mit! Kein Schatten.",en:"Bring water and walking shoes! No shade.",it:"Portate acqua e scarpe da trekking! Nessuna ombra.",si:"Vzemite vodo in pohodne čevlje! Ni sence.",cz:"Vezměte vodu a turistickou obuv! Žádný stín.",pl:"Weźcie wodę i buty do chodzenia! Brak cienia."},
    best: {hr:"Ujutro",de:"Morgens",en:"Morning",it:"Mattina",si:"Zjutraj",cz:"Ráno",pl:"Rano"}, diff: {hr:"Srednje",de:"Mittel",en:"Medium",it:"Medio",si:"Srednje",cz:"Střední",pl:"Średni"} },
  { name: "Marjan špilje", emoji: "🕳️", lat: 43.5089, lng: 16.4168, region: "split", premium: false,
    type: {hr:"Šetnja",de:"Wanderung",en:"Walk",it:"Passeggiata",si:"Sprehod",cz:"Procházka",pl:"Spacer"},
    desc: {hr:"Starokršćanske špilje iz 5. st. na stazi od Kašjuna do vrha Marjana.",de:"Frühchristliche Höhlen aus dem 5. Jh. auf dem Weg von Kašjuni zum Marjan-Gipfel.",en:"Early Christian caves from the 5th century on the trail from Kašjuni to Marjan summit.",it:"Grotte paleocristiane del V secolo sul sentiero da Kašjuni alla cima del Marjan.",si:"Starokrščanske jame iz 5. st. na poti od Kašjunov do vrha Marjana.",cz:"Starokřesťanské jeskyně z 5. století na stezce z Kašjuni na vrchol Marjanu.",pl:"Wczesnochrześcijańskie jaskinie z V w. na szlaku z Kašjuni na szczyt Marjanu."},
    tip: {hr:"Krenite u 17h, stignete na vrh za zalazak sunca.",de:"Starten Sie um 17 Uhr, Gipfel zum Sonnenuntergang.",en:"Start at 5pm, reach the summit for sunset.",it:"Partite alle 17, arrivate in cima per il tramonto.",si:"Začnite ob 17h, na vrh za sončni zahod.",cz:"Vyražte v 17h, na vrchol k západu slunce.",pl:"Wyruszcie o 17, na szczyt o zachodzie słońca."},
    best: {hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Konoba Stari Mlin", emoji: "🍷", lat: 43.4901, lng: 16.5634, region: "split", premium: true,
    type: {hr:"Lokalna tajna",de:"Lokales Geheimnis",en:"Local secret",it:"Segreto locale",si:"Lokalna skrivnost",cz:"Místní tajemství",pl:"Lokalny sekret"},
    desc: {hr:"Srinjine, 15min. Nema jelovnika — domaćin kuha što ima. Pršut, sir, vino iz podruma.",de:"Srinjine, 15 Min. Keine Speisekarte — der Wirt kocht, was da ist. Pršut, Käse, Wein aus dem Keller.",en:"Srinjine, 15min. No menu — the host cooks what's available. Pršut, cheese, wine from the cellar.",it:"Srinjine, 15min. Nessun menù — il padrone cucina ciò che c'è. Pršut, formaggio, vino dalla cantina.",si:"Srinjine, 15min. Ni jedilnika — gostilničar kuha, kar ima. Pršut, sir, vino iz kleti.",cz:"Srinjine, 15 min. Žádné menu — hostitel vaří, co má. Pršut, sýr, víno ze sklepa.",pl:"Srinjine, 15min. Brak menu — gospodarz gotuje co ma. Pršut, ser, wino z piwnicy."},
    tip: {hr:"Nazovite dan ranije. ~80€ za 4 osobe sa vinom.",de:"Rufen Sie einen Tag vorher an. ~80€ für 4 Personen mit Wein.",en:"Call a day ahead. ~80€ for 4 people with wine.",it:"Chiamate un giorno prima. ~80€ per 4 persone con vino.",si:"Pokličite dan prej. ~80€ za 4 osebe z vinom.",cz:"Zavolejte den předem. ~80€ pro 4 osoby s vínem.",pl:"Zadzwońcie dzień wcześniej. ~80€ za 4 osoby z winem."},
    best: {hr:"Večer",de:"Abend",en:"Evening",it:"Sera",si:"Večer",cz:"Večer",pl:"Wieczór"}, diff: {hr:"Auto",de:"Auto",en:"Car",it:"Auto",si:"Avto",cz:"Auto",pl:"Auto"} },
  { name: "Klis", emoji: "🏰", lat: 43.5583, lng: 16.5242, region: "split", premium: true,
    type: {hr:"Iskustvo",de:"Erlebnis",en:"Experience",it:"Esperienza",si:"Doživetje",cz:"Zážitek",pl:"Doświadczenie"},
    desc: {hr:"Game of Thrones tvrđava u zoru. Nema turista. Pogled na Split i otoke.",de:"Game of Thrones Festung im Morgengrauen. Keine Touristen. Blick auf Split und die Inseln.",en:"Game of Thrones fortress at dawn. No tourists. View of Split and the islands.",it:"Fortezza di Game of Thrones all'alba. Nessun turista. Vista su Spalato e le isole.",si:"Game of Thrones trdnjava ob zori. Brez turistov. Pogled na Split in otoke.",cz:"Pevnost ze Hry o trůny za úsvitu. Žádní turisté. Výhled na Split a ostrovy.",pl:"Twierdza z Gry o Tron o świcie. Żadnych turystów. Widok na Split i wyspy."},
    tip: {hr:"Parking besplatan prije 8h. Dođite u 5:15.",de:"Parking kostenlos vor 8 Uhr. Kommen Sie um 5:15.",en:"Free parking before 8am. Arrive at 5:15.",it:"Parcheggio gratuito prima delle 8. Arrivate alle 5:15.",si:"Parking brezplačen pred 8h. Pridite ob 5:15.",cz:"Parkování zdarma před 8h. Přijeďte v 5:15.",pl:"Parking bezpłatny przed 8. Przyjedźcie o 5:15."},
    best: {hr:"Izlazak sunca",de:"Sonnenaufgang",en:"Sunrise",it:"Alba",si:"Sončni vzhod",cz:"Východ slunce",pl:"Wschód słońca"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Cetina", emoji: "🌊", lat: 43.4456, lng: 16.7012, region: "split", premium: true,
    type: {hr:"Kupanje",de:"Baden",en:"Swimming",it:"Nuoto",si:"Kopanje",cz:"Koupání",pl:"Kąpiel"},
    desc: {hr:"3km uzvodno od Omiša, makadamski put do skrivenog prirodnog bazena.",de:"3km flussaufwärts von Omiš, Schotterweg zum versteckten Naturbecken.",en:"3km upstream from Omiš, gravel road to a hidden natural pool.",it:"3km a monte da Omiš, strada sterrata verso una piscina naturale nascosta.",si:"3km gorvodno od Omiša, makadamska pot do skritega naravnega bazena.",cz:"3km proti proudu od Omiše, štěrková cesta ke skrytému přírodnímu bazénu.",pl:"3km w górę rzeki od Omisza, droga szutrowa do ukrytego naturalnego basenu."},
    tip: {hr:"Skrenite desno kod mosta u Omišu. Makadamski put 1km.",de:"Rechts abbiegen bei der Brücke in Omiš. Schotterweg 1km.",en:"Turn right at the bridge in Omiš. Gravel road 1km.",it:"Girate a destra al ponte di Omiš. Strada sterrata 1km.",si:"Zavijte desno pri mostu v Omišu. Makadamska pot 1km.",cz:"Odbočte vpravo u mostu v Omiši. Štěrková cesta 1km.",pl:"Skręćcie w prawo przy moście w Omiszu. Droga szutrowa 1km."},
    best: {hr:"Popodne",de:"Nachmittag",en:"Afternoon",it:"Pomeriggio",si:"Popoldne",cz:"Odpoledne",pl:"Popołudnie"}, diff: {hr:"Lagano",de:"Leicht",en:"Easy",it:"Facile",si:"Lahko",cz:"Snadné",pl:"Łatwe"} },
  { name: "Vidova Gora", emoji: "🌄", lat: 43.3151, lng: 16.6212, region: "split", premium: true,
    type: {hr:"Pogled",de:"Aussicht",en:"Viewpoint",it:"Panorama",si:"Razgled",cz:"Vyhlídka",pl:"Punkt widokowy"},
    desc: {hr:"Najviši vrh jadranskih otoka (778m). Auto do vrha. Pogled na Hvar, Vis, Italiju.",de:"Höchster Gipfel der Adriainseln (778m). Auto bis zum Gipfel. Blick auf Hvar, Vis, Italien.",en:"Highest peak of the Adriatic islands (778m). Drive to the top. View of Hvar, Vis, Italy.",it:"Vetta più alta delle isole adriatiche (778m). Auto fino in cima. Vista su Hvar, Vis, Italia.",si:"Najvišji vrh jadranskih otokov (778m). Avto do vrha. Pogled na Hvar, Vis, Italijo.",cz:"Nejvyšší vrchol jadranských ostrovů (778m). Autem na vrchol. Výhled na Hvar, Vis, Itálii.",pl:"Najwyższy szczyt wysp adriatyckich (778m). Autem na szczyt. Widok na Hvar, Vis, Włochy."},
    tip: {hr:"Ferry 12h, auto 30min do vrha, zalazak, večera u Bolu.",de:"Fähre 12 Uhr, Auto 30 Min zum Gipfel, Sonnenuntergang, Abendessen in Bol.",en:"Ferry 12pm, car 30min to top, sunset, dinner in Bol.",it:"Traghetto 12, auto 30min in cima, tramonto, cena a Bol.",si:"Trajekt 12h, avto 30min do vrha, zahod, večerja v Bolu.",cz:"Trajekt 12h, auto 30min na vrchol, západ slunce, večeře v Bolu.",pl:"Prom 12, auto 30min na szczyt, zachód słońca, kolacja w Bolu."},
    best: {hr:"Zalazak",de:"Sonnenuntergang",en:"Sunset",it:"Tramonto",si:"Zahod",cz:"Západ slunce",pl:"Zachód słońca"}, diff: "Ferry+Auto" },
];

const GYG = (id) => `https://www.getyourguide.com/${id}/?partner_id=9OEGOYI&utm_medium=local_partners`;
const VIA = (id) => `https://www.viator.com/tours/${id}?pid=P00292197&mcid=42383&medium=link`;
const BKG = (city, params="") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

const ACCOMMODATION = [
  { region: "split", emoji: "🏖️",
    name: { hr:"Podstrana & Split", de:"Podstrana & Split", en:"Podstrana & Split", it:"Podstrana & Spalato", si:"Podstrana & Split", cz:"Podstrana & Split", pl:"Podstrana & Split" },
    note: { hr:"Blizu centra, plaže na dohvat ruke", de:"Stadtnah, Strände in Reichweite", en:"Near center, beaches within reach", it:"Vicino al centro, spiagge a portata", si:"Blizu centra, plaže na dosegu", cz:"Blízko centra, pláže na dosah", pl:"Blisko centrum, plaże w zasięgu" },
    link: BKG("Split, Croatia", "&checkin=&checkout=&group_adults=2&no_rooms=1&sb_travel_purpose=leisure") },
  { region: "split", emoji: "🏝️",
    name: { hr:"Makarska rivijera", de:"Makarska Riviera", en:"Makarska Riviera", it:"Riviera di Makarska", si:"Makarska riviera", cz:"Makarská riviéra", pl:"Riwiera Makarska" },
    note: { hr:"Najljepše plaže Dalmacije", de:"Die schönsten Strände Dalmatiens", en:"Dalmatia's most beautiful beaches", it:"Le spiagge più belle della Dalmazia", si:"Najlepše plaže Dalmacije", cz:"Nejkrásnější pláže Dalmácie", pl:"Najpiękniejsze plaże Dalmacji" },
    link: BKG("Makarska, Croatia") },
  { region: "split", emoji: "⛵",
    name: { hr:"Hvar", de:"Hvar", en:"Hvar", it:"Hvar", si:"Hvar", cz:"Hvar", pl:"Hvar" },
    note: { hr:"Glamur + lavanda + noćni život", de:"Glamour + Lavendel + Nachtleben", en:"Glamour + lavender + nightlife", it:"Glamour + lavanda + vita notturna", si:"Glamur + sivka + nočno življenje", cz:"Glamour + levandule + noční život", pl:"Glamour + lawenda + życie nocne" },
    link: BKG("Hvar, Croatia") },
  { region: "istria", emoji: "🫒",
    name: { hr:"Rovinj", de:"Rovinj", en:"Rovinj", it:"Rovigno", si:"Rovinj", cz:"Rovinj", pl:"Rovinj" },
    note: { hr:"Najromantičniji grad Istre", de:"Die romantischste Stadt Istriens", en:"Istria's most romantic town", it:"La città più romantica dell'Istria", si:"Najbolj romantično mesto Istre", cz:"Nejromantičtější město Istrie", pl:"Najbardziej romantyczne miasto Istrii" },
    link: BKG("Rovinj, Croatia") },
  { region: "istria", emoji: "🏟️",
    name: { hr:"Pula & Medulin", de:"Pula & Medulin", en:"Pula & Medulin", it:"Pola & Medulin", si:"Pula & Medulin", cz:"Pula & Medulin", pl:"Pula & Medulin" },
    note: { hr:"Rimska arena + obiteljske plaže", de:"Römische Arena + Familienstrände", en:"Roman arena + family beaches", it:"Arena romana + spiagge per famiglie", si:"Rimska arena + družinske plaže", cz:"Římská aréna + rodinné pláže", pl:"Rzymska arena + plaże rodzinne" },
    link: BKG("Pula, Croatia") },
  { region: "kvarner", emoji: "⚓",
    name: { hr:"Opatija", de:"Opatija", en:"Opatija", it:"Abbazia", si:"Opatija", cz:"Opatija", pl:"Opatija" },
    note: { hr:"Biser Kvarnera, elegancija + šetnice", de:"Perle der Kvarner, Eleganz + Promenaden", en:"Pearl of Kvarner, elegance + promenades", it:"Perla del Quarnero, eleganza + lungomare", si:"Biser Kvarnerja, eleganca + sprehajališča", cz:"Perla Kvarneru, elegance + promenády", pl:"Perła Kwarneru, elegancja + promenady" },
    link: BKG("Opatija, Croatia") },
  { region: "kvarner", emoji: "🏝️",
    name: { hr:"Otok Krk", de:"Insel Krk", en:"Krk Island", it:"Isola di Krk", si:"Otok Krk", cz:"Ostrov Krk", pl:"Wyspa Krk" },
    note: { hr:"Zlatni otok — most s kopnom", de:"Goldene Insel — Brücke zum Festland", en:"Golden island — bridge to mainland", it:"Isola d'oro — ponte con la terraferma", si:"Zlati otok — most s kopnim", cz:"Zlatý ostrov — most na pevninu", pl:"Złota wyspa — most z lądem" },
    link: BKG("Krk, Croatia") },
];

const EXPERIENCES = [
  // ═══ SREDNJA DALMACIJA (Split, Omiš, Otoci) ═══
  { id: 1, name: "Rafting Cetina", emoji: "🚣", price: 35, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("omis-l2096/rafting-on-cetina-river-from-omis-t35592"), viator: VIA("Split/rafting-on-Cetina-river-Omis/d4185-261342P1") },
  { id: 2, name: "Kajak Night Glow", emoji: "🛶", price: 55, dur: "3h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("split-l268/split-kayak-night-glow-tour-t438836") },
  { id: 3, name: "ATV Quad + Waterfall", emoji: "🏍️", price: 65, dur: "5h", rating: 4.9, cat: "adventure", region: "split",
    gyg: GYG("split-l268/activity-tc1/?q=atv+quad+waterfall") },
  { id: 4, name: "Split Walking Tour", emoji: "🏛️", price: 25, dur: "2h", rating: 4.7, cat: "culture", region: "split",
    gyg: GYG("split-l268/split-walking-tour-t54976"), viator: VIA("Split/Split-Diocletians-Palace-Walking-Tour/d4185-54976P1") },
  { id: 5, name: "Game of Thrones", emoji: "🐉", price: 60, dur: "2h", rating: 4.9, cat: "culture", region: "split",
    gyg: GYG("split-l268/activity-tc1/?q=game+of+thrones") },
  { id: 6, name: "Blue Cave 5 Islands", emoji: "🏝️", price: 110, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    gyg: GYG("split-l268/from-split-blue-cave-mamma-mia-vis-hvar-5-islands-tour-t326676"), viator: VIA("Split/Blue-Cave-and-Hvar-Tour-from-Split/d4185-17622P2") },
  { id: 7, name: "Hvar + Pakleni Catamaran", emoji: "⛵", price: 89, dur: "10h", rating: 4.8, cat: "premium", region: "split",
    gyg: GYG("split-l268/split-full-day-boat-trip-to-3-islands-w-lunch-snorkeling-t412889"), viator: VIA("Split/Three-Island-Tour-from-Split/d4185-412889P1") },
  { id: 8, name: "Sunset Cruise", emoji: "🌅", price: 65, dur: "2h", rating: 5.0, cat: "premium", region: "split",
    gyg: GYG("split-l268/cruises-boat-tours-tc48/?q=sunset+cruise") },
  { id: 9, name: "Krka + Wine Tasting", emoji: "🍷", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "split",
    gyg: GYG("split-l268/day-tour-from-split-krka-waterfalls-tour-wine-tasting-t251842"), viator: VIA("Split/From-Split-Krka-Waterfalls-Food-Wine-Tasting-Tour/d4185-251842P1") },
  { id: 10, name: "Plitvice Lakes", emoji: "🌊", price: 75, dur: "12h", rating: 4.8, cat: "nature", region: "split",
    gyg: GYG("split-l268/from-split-plitvice-lakes-guided-tour-with-entry-tickets-t411976"), viator: VIA("Split/Plitvice-Lakes-Guided-Tour-with-Entry-Tickets/d4185-411976P1") },

  // ═══ ISTRA (Rovinj, Pula, Motovun) ═══
  { id: 20, name: "Truffle Hunting", emoji: "🍄", price: 45, dur: "2h", rating: 4.9, cat: "gastro", region: "istria",
    gyg: GYG("istria-county-l1297/livade-guided-truffle-hunting-walking-tour-t413975") },
  { id: 21, name: "Istria in 1 Day", emoji: "🏰", price: 55, dur: "9h", rating: 4.7, cat: "culture", region: "istria",
    gyg: GYG("rovinj-l1299/from-rovinj-rovinj-motovun-and-groznjan-day-tour-t132468") },
  { id: 22, name: "Inner Istria + Food", emoji: "🫒", price: 65, dur: "8h", rating: 4.8, cat: "gastro", region: "istria",
    gyg: GYG("pula-l344/food-drink-tc6/?q=inner+istria+food") },
  { id: 23, name: "Pula Arena + Wine", emoji: "🏟️", price: 50, dur: "6h", rating: 4.7, cat: "culture", region: "istria",
    gyg: GYG("pula-l344/food-drink-tc6/?q=istrian+wineries") },

  // ═══ KVARNER (Opatija, Rijeka, Krk) ═══
  { id: 30, name: "Kvarner Bay Tour", emoji: "⚓", price: 55, dur: "5h", rating: 4.8, cat: "culture", region: "kvarner",
    gyg: GYG("opatija-l1296/best-of-kvarner-bay-half-day-tour-from-rijeka-or-opatija-t977515") },
  { id: 31, name: "Cres Island Boat", emoji: "🚢", price: 120, dur: "8h", rating: 4.9, cat: "premium", region: "kvarner",
    gyg: GYG("opatija-l1296?q=cres+island+boat") },
  { id: 32, name: "Opatija Evening Cruise", emoji: "🌙", price: 45, dur: "2h", rating: 4.8, cat: "premium", region: "kvarner",
    gyg: GYG("opatija-l1296?q=evening+cruise+kvarner") },
];

const BUNDLES = [
  { emoji: "🏝️", includes: ["Blue Cave 5 Islands", "Split Walking Tour"],
    name: { hr:"Otoci + Povijest", de:"Inseln + Geschichte", en:"Islands + History", it:"Isole + Storia", si:"Otoki + Zgodovina", cz:"Ostrovy + Historie", pl:"Wyspy + Historia" },
    tip: { hr:"Jedan dan more i otoci, drugi dan Dioklecijanova palača!", de:"Ein Tag Meer und Inseln, am nächsten Diokletianpalast!", en:"One day sea & islands, next day Diocletian's Palace!", it:"Un giorno mare e isole, il giorno dopo il Palazzo di Diocleziano!", si:"En dan morje in otoki, naslednji dan Dioklecijanova palača!", cz:"Jeden den moře a ostrovy, druhý den Diokleciánův palác!", pl:"Jeden dzień morze i wyspy, następny Pałac Dioklecjana!" } },
  { emoji: "👨‍👩‍👧‍👦", includes: ["Rafting Cetina", "ATV Quad + Waterfall"],
    name: { hr:"Adrenalin paket", de:"Adrenalin-Paket", en:"Adrenaline Pack", it:"Pacchetto adrenalina", si:"Adrenalin paket", cz:"Adrenalinový balíček", pl:"Pakiet adrenaliny" },
    tip: { hr:"Dva dana čistog adrenalina! Djeca 8+ na rafting.", de:"Zwei Tage purer Adrenalin! Kinder ab 8 zum Rafting.", en:"Two days of pure adrenaline! Kids 8+ can raft.", it:"Due giorni di pura adrenalina! Bambini 8+ al rafting.", si:"Dva dni čistega adrenalina! Otroci 8+ na rafting.", cz:"Dva dny čistého adrenalinu! Děti 8+ na rafting.", pl:"Dwa dni czystej adrenaliny! Dzieci 8+ na rafting." } },
  { emoji: "🍄", includes: ["Truffle Hunting", "Inner Istria + Food"],
    name: { hr:"Istra Gastro", de:"Istrien Gastro", en:"Istria Gastro", it:"Istria Gastro", si:"Istra Gastro", cz:"Istrie Gastro", pl:"Istria Gastro" },
    tip: { hr:"Lov na tartufe + konobe unutrašnje Istre — nezaboravno!", de:"Trüffeljagd + Konobas des Hinterlands — unvergesslich!", en:"Truffle hunt + inland konobas — unforgettable!", it:"Caccia al tartufo + konobe dell'entroterra — indimenticabile!", si:"Lov na tartufe + konobe notranje Istre — nepozabno!", cz:"Lov na lanýže + konoby vnitrozemí — nezapomenutelné!", pl:"Polowanie na trufle + konoby w głębi lądu — niezapomniane!" } },
  { emoji: "💑", includes: ["Sunset Cruise", "Krka + Wine Tasting"],
    name: { hr:"Romantični bijeg", de:"Romantische Flucht", en:"Romantic Escape", it:"Fuga romantica", si:"Romantični pobeg", cz:"Romantický únik", pl:"Romantyczna ucieczka" },
    tip: { hr:"Zalazak na brodu + vodopadi i vino — savršen dan za dvoje!", de:"Sonnenuntergang auf dem Boot + Wasserfälle und Wein!", en:"Sunset cruise + waterfalls and wine — perfect for two!", it:"Tramonto in barca + cascate e vino — perfetto per due!", si:"Zahod na ladji + slapovi in vino — popoln dan za dva!", cz:"Západ na lodi + vodopády a víno — perfektní pro dva!", pl:"Zachód na łodzi + wodospady i wino — idealny dla dwojga!" } },
];

const LOYALTY = { points: 345, tier: "Morski val", next: "Dalmatinac", nextPts: 500, code: "WEBER2026" };

const VIATOR_FALLBACK = [
  { productCode: "LOCAL-001", title: "Split – Dioklecijanova palača", description: "Razgledajte rimsku palaču iz 4. st. s lokalnim vodičem.", price: 29, rating: 4.8, reviewCount: 1240, duration: "2h", category: "Kultura", images: ["https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=400"], bookingUrl: "https://www.viator.com/tours/Split/?pid=P00292197&mcid=42383&medium=link" },
  { productCode: "LOCAL-002", title: "Plava špilja & 5 otoka (brzi brod)", description: "Posjetite Plavu špilju, Hvar, Brač i uvale Paklenih otoka.", price: 79, rating: 4.9, reviewCount: 3580, duration: "8h", category: "Nautika", images: ["https://images.unsplash.com/photo-1503756234508-e32369269dde?w=400"], bookingUrl: "https://www.viator.com/tours/Split/?pid=P00292197&mcid=42383&medium=link" },
  { productCode: "LOCAL-003", title: "NP Krka – izlet s prijevozom", description: "Vodopadima Roski slap i Skradin Buk. Kupanje u rijeci Krki uključeno.", price: 65, rating: 4.7, reviewCount: 890, duration: "9h", category: "Priroda", images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"], bookingUrl: "https://www.viator.com/tours/Split/?pid=P00292197&mcid=42383&medium=link" },
  { productCode: "LOCAL-004", title: "Rafting na Cetini iz Omiša", description: "Adrenalinska avantura u kanjonu Cetine — 20 min od Podstrane. Oprema uključena.", price: 45, rating: 4.8, reviewCount: 650, duration: "3h", category: "Avantura", images: ["https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400"], bookingUrl: "https://www.viator.com/tours/Omis/?pid=P00292197&mcid=42383&medium=link" },
  { productCode: "LOCAL-005", title: "Hvar + Pakleni otoci (katamaranom)", description: "Cjelodnevni izlet do Hvara, Paklenih otoka i špilje Zelena — ručak uključen.", price: 89, rating: 4.8, reviewCount: 2100, duration: "10h", category: "Nautika", images: ["https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400"], bookingUrl: "https://www.viator.com/tours/Split/?pid=P00292197&mcid=42383&medium=link" },
  { productCode: "LOCAL-006", title: "Zalazak sunca na Bračkim stijenama", description: "Vožnja brodom do zlatnih stijena Brača uz čašu dalmatinskog vina.", price: 55, rating: 5.0, reviewCount: 420, duration: "2.5h", category: "Romantika", images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"], bookingUrl: "https://www.viator.com/tours/Split/?pid=P00292197&mcid=42383&medium=link" },
];

const INTEREST_LABELS = {
  gastro:    { hr:"Gastronomija", de:"Gastronomie", en:"Gastronomy", it:"Gastronomia", si:"Gastronomija", cz:"Gastronomie", pl:"Gastronomia" },
  adventure: { hr:"Avantura", de:"Abenteuer", en:"Adventure", it:"Avventura", si:"Pustolovščina", cz:"Dobrodružství", pl:"Przygoda" },
  culture:   { hr:"Kultura", de:"Kultur", en:"Culture", it:"Cultura", si:"Kultura", cz:"Kultura", pl:"Kultura" },
  beach:     { hr:"Plaže", de:"Strände", en:"Beaches", it:"Spiagge", si:"Plaže", cz:"Pláže", pl:"Plaże" },
  wellness:  { hr:"Wellness", de:"Wellness", en:"Wellness", it:"Benessere", si:"Wellness", cz:"Wellness", pl:"Wellness" },
  kids:      { hr:"Obitelj", de:"Familie", en:"Family", it:"Famiglia", si:"Družina", cz:"Rodina", pl:"Rodzina" },
  nightlife: { hr:"Noćni život", de:"Nachtleben", en:"Nightlife", it:"Vita notturna", si:"Nočno življenje", cz:"Noční život", pl:"Życie nocne" },
  nature:    { hr:"Priroda", de:"Natur", en:"Nature", it:"Natura", si:"Narava", cz:"Příroda", pl:"Przyroda" },
};
const INTERESTS = [
  { k: "gastro", e: "🍷" }, { k: "adventure", e: "🏔️" },
  { k: "culture", e: "🏛️" }, { k: "beach", e: "🏖️" },
  { k: "wellness", e: "🧖" }, { k: "kids", e: "👨‍👩‍👧‍👦" },
  { k: "nightlife", e: "🍸" }, { k: "nature", e: "🌿" },
];

/* ─── COMPONENT ─── */
export default function JadranUnified() {
  // mounted
  const [lang, setLang] = useState("hr");
  const [langOpen, setLangOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const [phase, setPhase] = useState("pre"); // overridden by loadGuest on mount
  const [subScreen, setSubScreen] = useState("onboard"); // varies per phase
  const [premium, setPremium] = useState(() => {
    try { return localStorage.getItem("jadran_ai_premium") === "1"; } catch { return false; }
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState(null); // null | "loading" | "success" | "error" | "expired"
  const [recoveryError, setRecoveryError] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [interests, setInterests] = useState(new Set(["gastro", "adventure"]));
  const [kioskDay, setKioskDay] = useState(3);
  const [simHour, setSimHour] = useState(null);
  const [selectedGem, setSelectedGem] = useState(null);
  const [svModal, setSvModal] = useState(null); // { lat, lng, name } — inline Street View overlay
  // Kiosk v2: location-aware nearby data
  const [nearbyData, setNearbyData] = useState(null); // { location, categories }
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [kioskCoords, setKioskCoords] = useState(null); // [lat, lng] from GPS or fallback
  const [kioskWelcome, setKioskWelcome] = useState(false); // transition screen
  const [senseData, setSenseData] = useState(null); // YOLO Sense parking/marina/beach
  const [selectedExp, setSelectedExp] = useState(null);
  const [booked, setBooked] = useState(new Set());
  // Viator activities
  const [viatorActs, setViatorActs] = useState(null); // null=not loaded, array=loaded
  const [viatorLoading, setViatorLoading] = useState(false);
  const [selectedViatorAct, setSelectedViatorAct] = useState(null);
  const [viatorImgIdx, setViatorImgIdx] = useState(0);
  const [viatorBookDate, setViatorBookDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); });
  const [viatorPersons, setViatorPersons] = useState(2);
  const [viatorWishlist, setViatorWishlist] = useState(() => { try { return JSON.parse(localStorage.getItem("jadran_viator_wishlist") || "[]"); } catch { return []; } });
  // Border intelligence
  const [borderData, setBorderData] = useState(null);
  const [borderLoading, setBorderLoading] = useState(false);
  // Arrival geofencing
  const [geoArrival, setGeoArrival] = useState(false); // true = within 10km
  const [arrivalCountdown, setArrivalCountdown] = useState(null); // seconds remaining
  const geoWatchRef = useRef(null);
  const arrivalFiredRef = useRef(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const chatEnd = useRef(null);
  // Guest key: roomCode from URL, or deviceId for standalone users
  const roomCode = useRef((() => {
    const rc = getRoomCode();
    if (rc !== "DEMO") return rc;
    let did = ""; try { did = localStorage.getItem("jadran_push_deviceId") || ""; } catch {}
    if (!did) { did = `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`; try { localStorage.setItem("jadran_push_deviceId", did); } catch {} }
    return did;
  })());

  // ─── TRANSIT HERE MAP ───
  const [transitFromUrl, setTransitFromUrl] = useState("");
  const [transitToUrl, setTransitToUrl] = useState("");
  const [transitSegUrl, setTransitSegUrl] = useState("");
  const [transitFromCoords, setTransitFromCoords] = useState(null);
  const [transitToCoords, setTransitToCoords] = useState(null);
  const [transitRouteData, setTransitRouteData] = useState(null);
  // Save real HERE road distance to delta → gpsEngine → pulse.js gets accurate km
  useEffect(() => {
    if (transitRouteData?.km) {
      saveDelta({ route_km: transitRouteData.km, route_hrs: transitRouteData.hrs, route_mins: transitRouteData.mins });
    }
  }, [transitRouteData?.km]); // eslint-disable-line
  const SEG_ICON = { kamper:"🚐", porodica:"👨‍👩‍👧", par:"💑", jedrilicar:"⛵" };

  // ─── GPS LIVE ENGINE (starts on user action, not automatically) ───
  const [gpsCards, setGpsCards] = useState([]);
  const [gpsPosition, setGpsPosition] = useState(null);
  const [tripActive, setTripActive] = useState(false);
  const gpsStarted = useRef(false);

  const startTrip = () => {
    if (gpsStarted.current) return;
    gpsStarted.current = true;
    setTripActive(true);
    saveDelta({ trip_started: true });
    startGPS({
      onCard: (card) => setGpsCards(prev => {
        const exists = prev.some(c => c.id === card.id);
        if (exists) return prev;
        // Keep only the newest AI card — remove older AI pulse cards
        const filtered = card.isAI ? prev.filter(c => !c.isAI) : prev;
        return [card, ...filtered].slice(0, 20);
      }),
      onPosition: (pos) => setGpsPosition(pos),
      onPhase: (newPhase) => {
        if (newPhase === "odmor") {
          setPhase("kiosk"); setSubScreen("home");
          updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" });
        }
      },
      onCountry: (country) => {
        saveDelta({ country });
      },
    });
  };

  // Resume trip if was active before reload
  useEffect(() => {
    if (gpsStarted.current) return;
    if (phase !== "pre" || subScreen !== "transit") return;
    try {
      const delta = loadDelta();
      if (delta.trip_started === true) {
        startTrip();
      }
    } catch {}
  }, [phase, subScreen]);

  // ─── GUEST ONBOARDING STATE ───
  const [guestProfile, setGuestProfile] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const G = guestProfile || GUEST_FALLBACK;

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);
  useEffect(() => { const t = setTimeout(() => setSplash(false), 3800); return () => clearTimeout(t); }, []);

  // ─── URL transit handoff (?go=transit&from=Wien&to=Split&seg=kamper) ───
  const urlFromSet = useRef(false); // blocks geocode race condition
  const urlToSet = useRef(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("go") !== "transit") return;
    const from = p.get("from") || "";
    const to = p.get("to") || "";
    const seg = p.get("seg") || "par";
    if (!from || !to) return;
    setTransitFromUrl(from);
    setTransitToUrl(to);
    setTransitSegUrl(seg);
    // Use coords from URL if available (passed from LandingPage autosuggest)
    const fLat = parseFloat(p.get("fLat")), fLng = parseFloat(p.get("fLng"));
    const tLat = parseFloat(p.get("tLat")), tLng = parseFloat(p.get("tLng"));
    if (fLat && fLng) { setTransitFromCoords([fLat, fLng]); saveDelta({ from_coords: [fLat, fLng] }); urlFromSet.current = true; }
    if (tLat && tLng) { setTransitToCoords([tLat, tLng]); saveDelta({ destination: { city: to, lat: tLat, lng: tLng } }); urlToSet.current = true; }
    const urlLang = p.get("lang");
    if (urlLang) { setLang(urlLang); saveDelta({ lang: urlLang }); }
    setPhase("pre");
    setSubScreen("transit");
    setSplash(false);
    saveDelta({ trip_started: false }); // new route = new trip, not resumed
    setTripActive(false);
    gpsStarted.current = false;
    localStorage.setItem("jadran_go_transit", "1");
    window.history.replaceState({}, "", "/");
  }, []); // eslint-disable-line

  // ─── PERSISTENCE: Load guest state from Firestore/localStorage ───
  const persistReady = useRef(false);
  useEffect(() => {
    loadGuest(roomCode.current).then(data => {
      if (localStorage.getItem("jadran_go_transit") === "1") {
        localStorage.removeItem("jadran_go_transit");
        return; // transit handoff active — don't override phase/subScreen
      }
      if (data) {
        if (data.premium) setPremium(true);
        if (data.lang) setLang(data.lang);
        if (data.phase) {
          // Use date-based phase if dates are available
          const autoPhase = (() => {
            const now = new Date();
            const arr = data.arrival ? new Date(data.arrival) : null;
            const dep = data.departure ? new Date(data.departure) : null;
            if (arr && now < arr) return "pre";
            if (arr && dep && now >= arr && now <= dep) return "kiosk";
            if (dep && now > dep) return "post";
            return data.phase;
          })();
          setPhase(autoPhase);
          if (autoPhase === "pre") setSubScreen(data.subScreen || "onboard");
          else if (autoPhase === "kiosk") setSubScreen(data.subScreen || "home");
          else setSubScreen(data.subScreen || "summary");
        }
        if (data.booked) setBooked(new Set(data.booked));
        // Load guest profile fields if they exist
        if (data.name && data.country) {
          setGuestProfile({
            name: data.name, first: data.first || data.name.split(" ").pop(),
            country: data.country, flag: data.flag || "🌍", lang: data.lang || "en",
            adults: data.adults || 2, kids: data.kids || 0, kidsAges: data.kidsAges || [],
            interests: data.interests || ["gastro","adventure"],
            arrival: data.arrival || data.checkIn || "2026-07-12",
            departure: data.departure || data.checkOut || "2026-07-19",
            car: data.car || false, carPlate: data.carPlate || "",
            accommodation: data.accommodation || "Apartman", host: data.host || "",
            hostPhone: data.hostPhone || "", budget: data.budget || 1200,
            spent: data.spent || 0, email: data.email || "",
          });
        } else if (roomCode.current && roomCode.current !== "DEMO") {
          // No profile yet — show onboarding
          setShowOnboarding(true);
        }
      } else if (roomCode.current && roomCode.current !== "DEMO") {
        setShowOnboarding(true);
      }
      // Mark ready AFTER initial state is applied
      setTimeout(() => { persistReady.current = true; }, 500);
    }).catch(() => { persistReady.current = true; });
  }, []);

  // ─── PERSISTENCE: Auto-save on key state changes ───
  useEffect(() => {
    if (!persistReady.current) return;
    updateGuest(roomCode.current, { lang, phase, subScreen, premium, booked: [...booked], destination: kioskCity || transitDestCity, lastAccess: new Date().toISOString() });
  }, [lang, phase, subScreen, premium, booked]);


  // ─── AUTO-FETCH VIATOR when entering relevant screens ───
  useEffect(() => {
    if ((phase === "kiosk" && subScreen === "activities") || (phase === "pre" && subScreen === "pretrip")) {
      fetchViatorActs();
    }
  }, [phase, subScreen]); // eslint-disable-line

  // ─── PUSH NOTIFICATIONS: register SW subscription on first load ───
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const VAPID_PUBLIC = "BGjw0W1rv8Mr69DVizpHWpki-rbrHo9kSWOSF_cZjHwoy8yMcI3rMA2J_TbmOEm1xswDGHkRlQ-IZh1nANK5Ujc";
    const stored = localStorage.getItem("jadran_push_deviceId");
    const deviceId = stored || `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (!stored) localStorage.setItem("jadran_push_deviceId", deviceId);

    const registerPush = async (reg) => {
      try {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC,
          });
        }
        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON(), deviceId, roomCode: roomCode.current }),
        }).catch(() => {});
        localStorage.setItem("jadran_push_active", "1");
      } catch {}
    };

    navigator.serviceWorker.ready.then(reg => {
      if (Notification.permission === "granted") {
        registerPush(reg);
      } else if (Notification.permission === "default") {
        // Request permission on first meaningful interaction (after onboarding)
        const onInteract = () => {
          Notification.requestPermission().then(p => { if (p === "granted") registerPush(reg); });
          window.removeEventListener("click", onInteract);
        };
        window.addEventListener("click", onInteract, { once: true });
      }
    }).catch(() => {});
  }, []); // eslint-disable-line

  // ─── ALERTS BAR ───
  const [alerts, setAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  useEffect(() => {
    const fetchAlerts = () => fetch("/api/alerts").then(r => r.json()).then(d => { if (d.alerts?.length) setAlerts(d.alerts); }).catch(() => {});
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // ─── LEAFLET MAP: call hook unconditionally (React rules) ───
  const COUNTRY_CITY = { DE:"München", AT:"Wien", IT:"Trieste", SI:"Ljubljana", CZ:"Praha", PL:"Kraków", HR:"Zagreb" };
  const mapFromCity = transitFromUrl || COUNTRY_CITY[G.country] || "Wien";
  const mapToCity = transitToUrl || "Split";

  // Geocode transit cities to coordinates
  useEffect(() => {
    if (!mapFromCity) return;
    if (transitFromCoords) return;
    if (urlFromSet.current) return; // URL coords pending — don't race
    const c = CITY_COORDS[mapFromCity];
    if (c) { setTransitFromCoords(c); saveDelta({ from_coords: c }); return; }
    fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(mapFromCity + ", Europe")}&limit=1&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(d => {
        const p = d.items?.[0]?.position;
        const coords = p ? [p.lat, p.lng] : CITY_COORDS["Wien"];
        setTransitFromCoords(coords);
        saveDelta({ from_coords: coords });
      })
      .catch(() => { setTransitFromCoords(CITY_COORDS["Wien"]); saveDelta({ from_coords: CITY_COORDS["Wien"] }); });
  }, [mapFromCity]); // eslint-disable-line
  useEffect(() => {
    if (!mapToCity) return;
    if (transitToCoords) return;
    if (urlToSet.current) return; // URL coords pending — don't race
    const c = CITY_COORDS[mapToCity];
    if (c) { setTransitToCoords(c); saveDelta({ destination: { city: mapToCity, lat: c[0], lng: c[1] } }); return; }
    fetch(`https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(mapToCity + ", Croatia")}&limit=1&apikey=${HERE_ROUTING_KEY}`)
      .then(r => r.json())
      .then(d => {
        const p = d.items?.[0]?.position;
        const coords = p ? [p.lat, p.lng] : CITY_COORDS["Split"];
        setTransitToCoords(coords);
        saveDelta({ destination: { city: mapToCity, lat: coords[0], lng: coords[1] } });
      })
      .catch(() => { setTransitToCoords(CITY_COORDS["Split"]); saveDelta({ destination: { city: mapToCity, lat: 43.508, lng: 16.440 } }); });
  }, [mapToCity]); // eslint-disable-line

  // Traffic incidents now handled by /api/guide (RouteGuide component)

  // Route fallback handled inside TransitMap component

  // ─── WEATHER: Fetch real data via Gemini grounding ───
  const [weather, setWeather] = useState(W_DEFAULT);
  const [forecast, setForecast] = useState(null); // null = use FORECAST_DEFAULT

  useEffect(() => {
    // Live weather at destination (or fallback Split)
    const delta = loadDelta();
    const wLat = transitToCoords?.[0] || delta.destination?.lat || kioskCoords?.[0] || 43.508;
    const wLng = transitToCoords?.[1] || delta.destination?.lng || kioskCoords?.[1] || 16.440;
    fetch(`/api/weather?lat=${wLat}&lon=${wLng}`).then(r => r.json()).then(data => {
      if (data.current?.temp) setWeather(data.current);
      if (data.forecast?.length >= 5) setForecast(data.forecast);
    }).catch(() => {});
  }, [transitToCoords?.[0], kioskCoords?.[0]]); // eslint-disable-line
  // ─── ADMIN: Secret unlock DISABLED in production ───
  // To test premium: use Stripe test mode or set jadran_ai_premium in Firebase console
  // useEffect(() => { ... }, []);

  // ─── STRIPE: Detect payment redirect ───
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const bookingStatus = params.get('booking');
    const activityName = params.get('activity');

    if (paymentStatus === 'success' && sessionId) {
      // Verify payment server-side
      fetch('/api/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).then(r => r.json()).then(data => {
        if (data.paid) {
          setPremium(true);
          setSplash(false);
          setPhase('kiosk');
          setSubScreen('home');
          try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
          updateGuest(roomCode.current, { premium: true, premiumSessionId: sessionId, phase: 'kiosk' });
        }
      }).catch(() => {
        // Verification failed — do NOT self-grant premium; webhook is authoritative
        console.warn("[jadran] Payment verify failed — waiting for webhook confirmation");
      });
      // Clean URL (keep ?room= if present)
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (bookingStatus === 'success' && activityName) {
      setSplash(false);
      setPhase('kiosk');
      setSubScreen('home');
      setShowConfirm(decodeURIComponent(activityName));
      setBooked(prev => {
        const next = new Set([...prev, activityName]);
        updateGuest(roomCode.current, { booked: [...next] });
        return next;
      });
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }

    if (paymentStatus === 'cancelled' || bookingStatus === 'cancelled') {
      const roomParam = new URLSearchParams(window.location.search).get('room');
      window.history.replaceState({}, '', window.location.pathname + (roomParam ? `?room=${roomParam}` : ''));
    }
  }, []);

  // ─── STRIPE: Start Premium Checkout ───
  const startPremiumCheckout = async (plan = "week") => {
    setPayLoading(true);
    try {
      const deviceId = localStorage.getItem("jadran_push_deviceId") || `dev_${Date.now()}`;
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.current, guestName: G.name, lang, plan,
          deviceId, returnPath: window.location.pathname + window.location.search,
          region: kioskCity || "all",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      } else {
        // Stripe returned no URL — show error
        console.error("Checkout failed: no URL returned", data);
        alert(lang === "de" ? "Zahlung derzeit nicht verfügbar. Bitte versuchen Sie es später." : lang === "it" ? "Pagamento non disponibile. Riprovare più tardi." : lang === "en" ? "Payment currently unavailable. Please try again later." : "Plaćanje trenutno nedostupno. Pokušajte kasnije.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert(lang === "de" ? "Verbindungsfehler. Bitte versuchen Sie es später." : lang === "it" ? "Errore di connessione. Riprovare più tardi." : lang === "en" ? "Connection error. Please try again later." : "Greška u povezivanju. Pokušajte kasnije.");
    }
    setPayLoading(false);
  };

  // ─── STRIPE: Start Activity Booking Checkout ───
  const startBookingCheckout = async (exp) => {
    setPayLoading(true);
    try {
      const totalPersons = G.adults + (G.kids || 0);
      const res = await fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: exp.name, price: exp.price,
          quantity: totalPersons, roomCode: roomCode.current,
          guestName: G.name, lang,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Booking checkout failed: no URL", data);
        alert(lang === "de" ? "Buchung derzeit nicht verfügbar." : lang === "en" ? "Booking currently unavailable." : "Rezervacija trenutno nedostupna.");
      }
    } catch (err) {
      console.error("Booking checkout error:", err);
      alert(lang === "de" ? "Verbindungsfehler." : lang === "en" ? "Connection error." : "Greška u povezivanju.");
    }
    setPayLoading(false);
  };

  // ─── Viator: Fetch activities ───
  const fetchViatorActs = async () => {
    if (viatorLoading || viatorActs !== null) return;
    setViatorLoading(true);
    try {
      const res = await fetch("/api/viator-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: loadDelta().destination?.city || "Split" }),
      });
      const data = await res.json();
      setViatorActs(Array.isArray(data.activities) && data.activities.length > 0 ? data.activities : VIATOR_FALLBACK);
    } catch {
      setViatorActs(VIATOR_FALLBACK);
    } finally {
      setViatorLoading(false);
    }
  };

  // ─── Viator: Book activity via Stripe ───
  const startViatorBooking = async (act, date, persons) => {
    setPayLoading(true);
    try {
      const res = await fetch("/api/viator-book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode: act.productCode, title: act.title, price: act.price, date, persons, roomCode: roomCode.current, guestName: G.name, lang }),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert(lang === "de" ? "Buchung nicht verfügbar." : lang === "en" ? "Booking unavailable." : "Rezervacija nije dostupna."); }
    } catch { alert(lang === "en" ? "Connection error." : "Greška. Pokušajte ponovo."); }
    setPayLoading(false);
  };

  // ─── Viator: Wishlist toggle ───
  const toggleViatorWishlist = (act) => {
    const next = viatorWishlist.some(a => a.productCode === act.productCode)
      ? viatorWishlist.filter(a => a.productCode !== act.productCode)
      : [...viatorWishlist, { productCode: act.productCode, title: act.title, price: act.price, duration: act.duration, rating: act.rating }];
    setViatorWishlist(next);
    try { localStorage.setItem("jadran_viator_wishlist", JSON.stringify(next)); } catch {}
  };

  // ─── Border intelligence ───
  const fetchBorderData = async () => {
    if (borderLoading) return;
    setBorderLoading(true);
    try {
      const res = await fetch("/api/border-intelligence");
      if (res.ok) setBorderData(await res.json());
    } catch {}
    setBorderLoading(false);
  };

  useEffect(() => {
    if (phase === "pre" && subScreen === "transit") {
      fetchBorderData();
      const iv = setInterval(fetchBorderData, 600000); // 10-min auto-refresh
      return () => clearInterval(iv);
    }
  }, [phase, subScreen]); // eslint-disable-line

  // ─── ARRIVAL GEOFENCING: watch position, trigger at <10km to destination ───
  useEffect(() => {
    if (phase !== "pre" || subScreen !== "transit") return;
    if (!("geolocation" in navigator)) return;

    // Use transit destination coords (dynamic, not hardcoded)
    const delta = loadDelta();
    const dLat = transitToCoords?.[0] || delta.destination?.lat;
    const dLng = transitToCoords?.[1] || delta.destination?.lng;
    if (!dLat || !dLng) return;

    const R = 6371;
    const distKm = (lat1, lng1, lat2, lng2) => {
      const dl = (lat2 - lat1) * Math.PI / 180;
      const dn = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dl / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dn / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const onPos = (pos) => {
      const km = distKm(pos.coords.latitude, pos.coords.longitude, dLat, dLng);
      if (km < 10 && !arrivalFiredRef.current) {
        arrivalFiredRef.current = true;
        setGeoArrival(true);
        setArrivalCountdown(30);

        // Notify host via push-send (fire-and-forget)
        const deviceId = localStorage.getItem("jadran_push_deviceId");
        if (deviceId) {
          fetch("/api/push-send", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deviceId, title: "Gost stiže!",
              body: `${G.first} je ~${Math.round(km)} km od apartmana`,
              tag: "arrival",
            }),
          }).catch(() => {});
        }
      }
    };

    geoWatchRef.current = navigator.geolocation.watchPosition(onPos, () => {}, {
      enableHighAccuracy: false, maximumAge: 60000, timeout: 30000,
    });
    return () => {
      if (geoWatchRef.current != null) navigator.geolocation.clearWatch(geoWatchRef.current);
    };
  }, [phase, subScreen]); // eslint-disable-line

  // ─── ARRIVAL COUNTDOWN: auto-transition to kiosk after 30s ───
  useEffect(() => {
    if (arrivalCountdown === null) return;
    if (arrivalCountdown <= 0) {
      setKioskWelcome(true); setNearbyData(null);
      setPhase("kiosk");
      setSubScreen("home");
      updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" });
      return;
    }
    const t = setTimeout(() => setArrivalCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [arrivalCountdown]); // eslint-disable-line

  const hour = simHour ?? new Date().getHours();
  const timeCtx = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
  const dateLocale = lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-GB" : lang === "it" ? "it-IT" : lang === "si" ? "sl-SI" : lang === "cz" ? "cs-CZ" : lang === "pl" ? "pl-PL" : "hr-HR";
  const isAdmin = new URLSearchParams(window.location.search).get("admin") === "sial";

  const tryPremium = (cb) => { if (premium) { cb(); } else { setShowPaywall(true); } };

  const doChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMsgs(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const langName = ({hr:"Hrvatski",de:"Deutsch",at:"Österreichisches Deutsch",en:"English",it:"Italiano",si:"Slovenščina",cz:"Čeština",pl:"Polski"})[lang] || "Hrvatski";
      const guestCtx = [
        G.name !== "Gost" ? `GOST: ${G.name}` : "",
        G.country ? `Zemlja: ${G.country}` : "",
        G.adults ? `${G.adults} odraslih` : "",
        G.kids > 0 ? `${G.kids} djece (${G.kidsAges.join(',')} god)` : "",
        G.interests?.length ? `Interesi: ${G.interests.join(', ')}` : "",
        G.car ? "Ima auto" : "",
      ].filter(Boolean).join(". ");
      const sys = `Ti si lokalni turistički vodič za ${kioskCity}, Hrvatska. Adriatic coast.
${guestCtx ? guestCtx + "." : ""}
VRIJEME: ${weather.temp}°C ${weather.icon}, UV ${weather.uv}, more ${weather.sea}°C, zalazak ${weather.sunset}.
LOKACIJA: ${kioskCity}. Nearby: ${nearbyHighlights?.map(h => h.text).join(", ") || "loading..."}.
Odgovaraš na ${langName}. Kratko (3-5 rečenica), toplo, konkretno s cijenama i udaljenostima. Bez emoji.`;
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: sys,
          messages: [...chatMsgs.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })), { role: "user", content: msg }],
          delta_context: loadDelta(),
          guide_cards: guideCards?.length ? guideCards.slice(0, 8) : undefined,
          lang: lang || "hr",
        }),
      });
      const data = await res.json();
      setChatMsgs(p => [...p, { role: "assistant", text: data.content?.map(c => c.text || "").join("") || "..." }]);
    } catch { setChatMsgs(p => [...p, { role: "assistant", text: "Verbindung nicht verfügbar. 🌊" }]); }
    setChatLoading(false);
  };

  /* ─── COLORS ─── */
  // ─── TIME-AWARE COLOR SYSTEM ───
  // Azure Blue (day: 6-19h) → Night Blue (evening: 19-6h)
  const isNight = hour >= 19 || hour < 6;
  const C = isNight ? {
    // 🌙 NIGHT BLUE — deep ocean
    bg: "#040a14", card: "rgba(8,18,32,0.9)", accent: "#38bdf8", acDim: "rgba(56,189,248,0.1)",
    gold: "#fbbf24", goDim: "rgba(251,191,36,0.08)", text: "#e0f2fe", mut: "#64748b",
    bord: "rgba(148,163,184,0.08)", red: "#f87171", green: "#4ade80", grDim: "rgba(74,222,128,0.08)",
    sky: "#0c4a6e", deep: "#082f49", warm: "#fbbf24", sand: "rgba(251,191,36,0.06)", terracotta: "#fb923c",
  } : {
    // ☀️ AZURE BLUE — Adriatic day
    bg: "#0a1628", card: "rgba(12,28,50,0.85)", accent: "#0ea5e9", acDim: "rgba(14,165,233,0.12)",
    gold: "#f59e0b", goDim: "rgba(245,158,11,0.08)", text: "#f0f9ff", mut: "#7dd3fc",
    bord: "rgba(14,165,233,0.08)", red: "#f87171", green: "#4ade80", grDim: "rgba(74,222,128,0.08)",
    sky: "#0c4a6e", deep: "#0e3a5c", warm: "#f59e0b", sand: "rgba(245,158,11,0.05)", terracotta: "#f97316",
  };
  const dm = { fontFamily: "'Outfit',sans-serif" };
  const fonts = <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />;
  const hf = { fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif" }; // heading font

  /* ─── SHARED COMPONENTS ─── */
  const Badge = ({ c = "accent", children }) => (
    <span style={{ ...dm, display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, letterSpacing: 0.5, fontWeight: 500,
      background: c === "accent" ? C.acDim : c === "gold" ? C.goDim : c === "green" ? C.grDim : "rgba(248,113,113,0.08)",
      color: c === "accent" ? C.accent : c === "gold" ? C.gold : c === "green" ? C.green : C.red,
      border: `1px solid ${c === "accent" ? "rgba(14,165,233,0.1)" : c === "gold" ? "rgba(245,158,11,0.1)" : c === "green" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
    }}>{children}</span>
  );
  const Btn = ({ primary, small, children, ...p }) => (
    <button {...p} style={{ padding: small ? "10px 18px" : "16px 28px", background: primary ? `linear-gradient(135deg,${C.accent} 0%,#0284c7 100%)` : "rgba(186,230,253,0.03)",
      border: primary ? "none" : `1px solid rgba(186,230,253,0.06)`, borderRadius: 16, color: primary ? "#fff" : C.text,
      fontSize: small ? 13 : 17, fontFamily: "'DM Serif Display','Cormorant Garamond',Georgia,serif", cursor: "pointer", fontWeight: primary ? 400 : 400, transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)", letterSpacing: primary ? 0.3 : 0, boxShadow: primary ? "0 6px 24px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.15)" : "none", ...(p.style || {}) }} className={primary ? "btn-glow" : ""}>{children}</button>
  );
  const Card = ({ children, glow, warm: isWarm, style: sx, ...p }) => (
    <div {...p} className="glass anim-card" style={{
      background: isWarm
        ? `linear-gradient(165deg, rgba(12,28,50,0.82), rgba(24,20,16,0.75))`
        : glow ? "rgba(12,28,50,0.82)" : "rgba(12,28,50,0.7)",
      borderRadius: 22, padding: 24,
      border: `1px solid ${isWarm ? "rgba(245,158,11,0.1)" : glow ? "rgba(14,165,233,0.12)" : C.bord}`,
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: glow
        ? "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(14,165,233,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.03)",
      ...sx,
    }}>{children}</div>
  );
  const SectionLabel = ({ children, extra }) => (
    <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 16, height: 1, background: `linear-gradient(90deg, ${C.accent}, transparent)` }} />
      {children} {extra && <span style={{ color: C.accent, fontWeight: 600 }}>{extra}</span>}
    </div>
  );
  const BackBtn = ({ onClick }) => <button onClick={onClick} style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", padding: "12px 0" }}>{t("back",lang)}</button>;

  /* ─── SVG PICTOGRAMS — premium line icons ─── */
  const Icon = ({ d, size = 24, color = "currentColor", stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((seg, i) => <path key={i} d={i === 0 ? seg : "M" + seg} />)}
    </svg>
  );
  const IC = {
    // Phase nav
    plane:    "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
    home:     "M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z M9 21V14h6v7",
    sparkle:  "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8Z",
    // Quick access
    parking:  "M5 21V5a2 2 0 0 1 2-2h5a5 5 0 0 1 0 10H7",
    beach:    "M17.5 21H6.5 M5 21l4.5-9h5l4.5 9 M12 3v9 M7.5 7h9",
    sun:      "M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41",
    map:      "M3 7l6-3l6 3l6-3v13l-6 3l-6-3l-6 3Z M9 4v13 M15 7v13",
    food:     "M3 2v7a4 4 0 0 0 4 4h2a4 4 0 0 0 4-4V2 M7 2v20 M21 15V2c-2.8 0-5 2.2-5 5v6h5",
    shop:     "M3 3h18l-2 13H5Z M1 7h22 M16 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
    bakery:   "M12 6C8 6 5 8 5 11c0 2 1.5 4 4 5v5h6v-5c2.5-1 4-3 4-5 0-3-3-5-7-5Z M9 3h6 M12 3v3",
    medic:    "M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z M12 9v6 M9 12h6",
    gem:      "M6 3h12l4 6l-10 12L2 9Z M2 9h20",
    bot:      "M12 8V4H8 M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z M9 16h0 M15 16h0",
    check:    "M20 6L9 17l-5-5",
    // City landmarks
    palace:   "M3 21h18 M5 21V10l7-7l7 7v11 M9 21v-5h6v5 M9 10h0 M15 10h0 M3 10h18 M7 7V4 M17 7V4",
    arena:    "M4 21c0-6 3.6-10.8 8-10.8S20 15 20 21 M6 21c0-4 2.7-7.2 6-7.2s6 3.2 6 7.2 M2 21h20 M8 10.5V8 M16 10.5V8 M12 10.2V7 M10 11V9 M14 11V9",
    church:   "M12 2v4 M10 4h4 M8 21V10l4-4l4 4v11 M8 10h8 M3 21h18 M10 16h4 M12 13v3",
    anchor:   "M12 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3Z M12 8v13 M5 21a7 7 0 0 1 7-7a7 7 0 0 1 7 7 M8 12H5 M19 12h-3",
    walls:    "M3 21V6l4-3l4 3l4-3l4 3l2 0v15 M3 6h18 M7 6v15 M11 6v15 M15 6v15",
    island:   "M2 20c2-3 5-5 10-5s8 2 10 5 M7 15V9l3-4l3 4v6 M12 5V3 M10 5h4",
    star:     "M12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01Z",
    ticket:   "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z M13 5v2 M13 17v2 M13 11v2",
  };

  // City landmark icon mapping — renders SVG instead of emoji for known cities
  const CITY_ICON = {
    "Podstrana & Split": { ic: IC.palace, clr: "#0ea5e9", fallback: "🏛️" },
    "Makarska rivijera": { ic: IC.beach, clr: "#38bdf8", fallback: "🏖️" },
    "Hvar":              { ic: IC.island, clr: "#f59e0b", fallback: "🏝️" },
    "Rovinj":            { ic: IC.church, clr: "#fb923c", fallback: "⛪" },
    "Pula & Medulin":    { ic: IC.arena, clr: "#a78bfa", fallback: "🏟️" },
    "Opatija":           { ic: IC.anchor, clr: "#34d399", fallback: "⚓" },
    "Otok Krk":          { ic: IC.island, clr: "#fbbf24", fallback: "🏝️" },
    "Makarska Riviera":  { ic: IC.beach, clr: "#38bdf8", fallback: "🏖️" },
    "Krk Island":        { ic: IC.island, clr: "#fbbf24", fallback: "🏝️" },
  };
  const CityIcon = ({ name, size = 28 }) => {
    const city = CITY_ICON[name];
    if (!city) return null;
    return <div style={{ width: size + 8, height: size + 8, borderRadius: 10, background: city.clr + "14", display: "grid", placeItems: "center", border: `1px solid ${city.clr}18` }}>
      <Icon d={city.ic} size={size} color={city.clr} stroke={1.5} />
    </div>;
  };
  const ALERT_ICONS = { fire:"🔥", wind:"🌬️", storm:"⛈", rain:"🌧️", heat:"🌡️", coastal:"🌊", flood:"💧", fog:"🌫️", snow:"❄️", road_closure:"⚠️", ferry_cancelled:"⛴", bura_closure:"🌬️", traffic_jam:"🚗", roadworks:"🔧", travel_advisory:"🇩🇪", weather:"⛈", default:"⚠️" };
  const ALERT_COLORS = { critical:"#ef4444", high:"#f59e0b", medium:"#38bdf8" };

  const AlertsBar = () => {
    // Show only most severe unread alert — single row, no map displacement
    const critical = alerts.filter(a => (a.severity === "critical" || a.severity === "high") && !dismissedAlerts.has(a.title));
    if (!critical.length) return null;
    const a = critical[0];
    const icon = ALERT_ICONS[a.type] || ALERT_ICONS.default;
    const color = a.severity === "critical" ? "#ef4444" : "#f59e0b";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 10, background: `${color}0B`, border: `1px solid ${color}22`, minHeight: 32, marginBottom: 8, overflow: "hidden" }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
        {critical.length > 1 && <span style={{ fontSize: 9, color, flexShrink: 0, fontWeight: 700 }}>+{critical.length - 1}</span>}
        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${color}18`, color, fontWeight: 700, flexShrink: 0 }}>{a.severity === "critical" ? "LIVE" : "⚠️"}</span>
        <button onClick={() => setDismissedAlerts(s => new Set([...s, a.title]))} style={{ background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer", padding: "8px", flexShrink: 0, lineHeight: 1, minWidth: 32 }}>×</button>
      </div>
    );
  };

  const PhaseNav = () => {
    const phases = [
      { k: "pre", l: t("preTrip",lang), ic: IC.plane },
      { k: "kiosk", l: t("kiosk",lang), ic: IC.home },
      { k: "post", l: t("postStay",lang), ic: IC.sparkle },
    ];
    const idx = phases.findIndex(p => p.k === phase);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "20px 0 12px", position: "relative" }}>
        {/* Track line */}
        <div style={{ position: "absolute", top: 28, left: "12%", right: "12%", height: 1, background: C.bord, zIndex: 0 }} />
        <div style={{ position: "absolute", top: 28, left: "12%", width: `${(idx / (phases.length - 1)) * 76}%`, height: 1, background: `linear-gradient(90deg,${C.accent},${C.warm})`, zIndex: 1, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
        {phases.map((p, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <div key={p.k} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 2, cursor: "pointer" }}
              onClick={() => { 
                if (p.k === "kiosk" && phase !== "kiosk") { setKioskWelcome(true); setNearbyData(null); }
                setPhase(p.k); if (p.k === "pre") setSubScreen("onboard"); else if (p.k === "kiosk") setSubScreen("home"); else setSubScreen("summary"); 
              }}>
              <div style={{
                width: active ? 48 : 36, height: active ? 48 : 36,
                borderRadius: active ? 18 : 14,
                background: active ? `linear-gradient(135deg,${C.accent},#0284c7)` : done ? C.acDim : "rgba(12,28,50,0.6)",
                border: active ? "none" : `1.5px solid ${done ? C.accent : C.bord}`,
                display: "grid", placeItems: "center",
                transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: active ? `0 8px 28px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.15)` : "none",
              }}>
                {done
                  ? <Icon d={IC.check} size={active ? 22 : 18} color={C.accent} stroke={2.2} />
                  : <Icon d={p.ic} size={active ? 22 : 18} color={active ? "#fff" : done ? C.accent : C.mut} stroke={active ? 2 : 1.5} />
                }
              </div>
              <div className="phase-label" style={{ ...dm, fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: active ? C.text : done ? C.accent : C.mut, fontWeight: active ? 700 : done ? 500 : 400 }}>{p.l}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── PAYWALL ─── */
  const Paywall = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 300, display: "grid", placeItems: "center", padding: 24 }} onClick={() => { setShowPaywall(false); setShowRecovery(false); setRecoveryStatus(null); setRecoveryEmail(""); }}>
      <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 28, maxWidth: 440, width: "100%", padding: "40px 32px", border: `1px solid rgba(251,191,36,0.15)`, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>💎</div>
        <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("premiumTitle",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {t("premiumDesc",lang)}
        </div>
        <div style={{ background: C.goDim, borderRadius: 16, padding: "20px", border: `1px solid rgba(251,191,36,0.12)`, marginBottom: 20 }}>
          <div style={{ fontSize: 40, fontWeight: 300, color: C.gold }}>9.99€</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("entireStay",lang)}</div>
        </div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.8, marginBottom: 20, textAlign: "left" }}>
          ✓ {t("payFeatures1",lang)}<br />
          ✓ {t("payFeatures2",lang)}<br />
          ✓ {t("payFeatures3",lang)}<br />
          ✓ {t("payFeatures4",lang)}<br />
          ✓ {t("payFeatures5",lang)}
        </div>
        <Btn primary style={{ width: "100%", marginBottom: 10 }} onClick={startPremiumCheckout}>
          {payLoading ? "⏳..." : t("unlockPremium",lang)}
        </Btn>
        <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 8 }}>{t("payVia",lang)}</div>

        {/* Recovery */}
        {!showRecovery ? (
          <button onClick={() => { setShowRecovery(true); setRecoveryStatus(null); setRecoveryError(""); }}
            style={{ ...dm, background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", textDecoration: "underline", opacity: 0.8, padding: "6px 12px" }}>
            {({hr:"Već ste platili?",de:"Bereits bezahlt?",en:"Already paid?",it:"Già pagato?",si:"Že plačano?",cz:"Už jste platili?",pl:"Już zapłacono?"})[lang] || "Već ste platili?"}
          </button>
        ) : (
          <div style={{ padding: "12px 16px", marginTop: 8, borderRadius: 12, background: "rgba(14,165,233,0.06)", border: `1px solid rgba(14,165,233,0.15)` }}>
            {recoveryStatus === "success" ? (
              <div style={{ textAlign: "center", color: "#22c55e", fontSize: 13, fontWeight: 600, padding: 8 }}>
                {({hr:"Pristup obnovljen!",de:"Zugang wiederhergestellt!",en:"Access restored!",it:"Accesso ripristinato!"})[lang] || "Pristup obnovljen!"}
              </div>
            ) : (
              <>
                <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 8 }}>
                  {({hr:"Unesite email s kojim ste platili",de:"E-Mail eingeben, mit der Sie bezahlt haben",en:"Enter the email you used at checkout",it:"Inserisci l'email usata per il pagamento"})[lang] || "Unesite email"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="email" inputMode="email" autoComplete="email" autoFocus
                    value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
                    placeholder="email@example.com"
                    style={{ ...dm, flex: 1, padding: "12px 14px", borderRadius: 10, border: `1px solid ${recoveryStatus === "error" || recoveryStatus === "expired" ? "#ef4444" : C.bord}`, background: "rgba(255,255,255,0.06)", color: C.text, fontSize: 14, outline: "none" }}
                    onKeyDown={e => { if (e.key === "Enter") document.getElementById("jadran-app-recover-btn")?.click(); }}
                  />
                  <button id="jadran-app-recover-btn"
                    disabled={recoveryStatus === "loading" || !recoveryEmail.includes("@")}
                    onClick={() => {
                      setRecoveryStatus("loading"); setRecoveryError("");
                      const did = localStorage.getItem("jadran_push_deviceId") || `dev_${Date.now()}`;
                      fetch("/api/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: recoveryEmail.trim(), deviceId: did }) })
                        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d })))
                        .then(({ ok, status, data }) => {
                          if (ok && data.recovered) {
                            setRecoveryStatus("success");
                            setPremium(true);
                            try { localStorage.setItem("jadran_ai_premium", "1"); } catch {}
                            setTimeout(() => { setShowPaywall(false); setShowRecovery(false); }, 1500);
                          } else {
                            setRecoveryStatus(status === 410 ? "expired" : "error");
                            setRecoveryError(status === 410 ? "Pretplata istekla" : (data.error || "Plaćanje nije pronađeno"));
                          }
                        })
                        .catch(() => { setRecoveryStatus("error"); setRecoveryError("Greška. Pokušajte ponovo."); });
                    }}
                    style={{ ...dm, padding: "12px 18px", borderRadius: 10, border: "none", background: recoveryStatus === "loading" ? C.mut : C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: recoveryStatus === "loading" ? "wait" : "pointer", whiteSpace: "nowrap", opacity: !recoveryEmail.includes("@") ? 0.5 : 1 }}>
                    {recoveryStatus === "loading" ? "..." : ({hr:"Obnovi",de:"Wiederherstellen",en:"Restore",it:"Ripristina"})[lang] || "Obnovi"}
                  </button>
                </div>
                {recoveryError && <div style={{ ...dm, color: "#ef4444", fontSize: 11, marginTop: 6, textAlign: "center" }}>{recoveryError}</div>}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ─── BOOKING CONFIRM ─── */
  const BookConfirm = () => showConfirm && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 250, display: "grid", placeItems: "center" }} onClick={() => setShowConfirm(null)}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, borderRadius: 24, padding: 40, textAlign: "center", maxWidth: 400, border: `1px solid rgba(14,165,233,0.15)` }}>
        <div className="check-anim" style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},#0284c7)`, display: "grid", placeItems: "center", fontSize: 40, margin: "0 auto 20px", color: "#fff", boxShadow: "0 8px 32px rgba(14,165,233,0.35)" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("bookSent",lang)}</div>
        <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          {t("bookConfirm",lang)}
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
            <div style={{ fontSize: 64, marginBottom: 16 }} className="emoji-float">🌊</div>
            <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginBottom: 8, background: `linear-gradient(135deg,${C.text} 30%,${C.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("welcome",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 15, marginBottom: 28, lineHeight: 1.7 }}>
              {t("hostUsesName",lang).replace("{HOST}","")}<strong style={{ color: C.gold }}>{G.host}</strong><br />{t("onboardSub",lang)}
            </div>
            <Btn primary onClick={() => setOnboardStep(1)}>{t("createProfile",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 1 && (
          <Card style={{ padding: 32 }}>
            <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>{t("step1",lang)}</div>
            <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>{t("interests",lang)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 10, marginBottom: 24 }}>
              {INTERESTS.map(opt => (
                <div key={opt.k} onClick={() => setInterests(p => { const n = new Set(p); n.has(opt.k) ? n.delete(opt.k) : n.add(opt.k); return n; })}
                  style={{ padding: "16px 8px", background: interests.has(opt.k) ? C.acDim : C.card, border: `1px solid ${interests.has(opt.k) ? "rgba(14,165,233,0.25)" : C.bord}`, borderRadius: 14, cursor: "pointer", textAlign: "center", ...dm, fontSize: 13, color: interests.has(opt.k) ? C.accent : C.mut, transition: "all 0.3s" }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 4 }}>{opt.e}</span>{(INTEREST_LABELS[opt.k]||{})[lang] || (INTEREST_LABELS[opt.k]||{}).hr || opt.k}
                </div>
              ))}
            </div>
            <Btn primary onClick={() => setOnboardStep(2)}>{t("next",lang)}</Btn>
          </Card>
        )}
        {onboardStep === 2 && (
          <Card style={{ padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 26, fontWeight: 400, marginBottom: 6 }}>{t("profileDone",lang)}</div>
            <div style={{ ...dm, color: C.mut, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              {t("preparing",lang)}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {[...interests].map(k => { const o = INTERESTS.find(x => x.k === k); return o ? <Badge key={k} c="accent">{o.e} {(INTEREST_LABELS[k]||{})[lang] || (INTEREST_LABELS[k]||{}).hr || k}</Badge> : null; })}
            </div>
            <Btn primary onClick={() => setSubScreen("pretrip")}>{t("toPreTrip",lang)}</Btn>
          </Card>
        )}
      </div>
    );

    if (subScreen === "pretrip") return (
      <>
        <div style={{ padding: "24px 0 8px" }}>
          <div style={{ fontSize: 30, fontWeight: 400 }}>{Math.max(0, Math.ceil((new Date(G.arrival) - new Date()) / 86400000))} {t("daysToGo",lang)} ☀️</div>
          <div style={{ ...dm, fontSize: 14, color: C.mut, marginTop: 4 }}>{new Date(G.arrival).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long"})} – {new Date(G.departure).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"long",year:"numeric"})} · {G.accommodation}</div>
        </div>
        <SectionLabel>{t("forecast",lang)}</SectionLabel>
        <div style={{ display: "flex", gap: 2, marginBottom: 24 }}>
          {(forecast || FORECAST_DEFAULT).map((d, i) => {
            const locked = !premium && i >= 3;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: 12, position: "relative", cursor: locked ? "pointer" : "default" }}
                onClick={() => locked && setShowPaywall(true)}>
                <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1 }}>{(FORECAST_DAYS[lang]||FORECAST_DAYS.hr)[d.di]}</div>
                <div style={{ fontSize: 22, margin: "4px 0", filter: locked ? "blur(4px)" : "none" }}>{d.icon}</div>
                <div style={{ ...dm, fontSize: 13, color: C.mut, filter: locked ? "blur(4px)" : "none" }}>{d.h}°</div>
                {locked && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span style={{ fontSize: 14, color: C.gold }}>🔒</span></div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
          <Card>
            <SectionLabel extra="AI">{t("optPlan",lang)}</SectionLabel>
            <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7 }}>
              <strong style={{ color: C.gold }}>{t("rainDay",lang)}</strong> — {t("palaceTour",lang)}. <strong style={{ color: C.green }}>{t("sunnyDay",lang)}</strong> — {t("beachKayak",lang)}.
              {t("aiOptimized",lang)}
            </div>
          </Card>
          <Card>
            <SectionLabel>{t("packages",lang)}</SectionLabel>
            {BUNDLES.map((b, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "10px 0", borderBottom: i < BUNDLES.length - 1 ? `1px solid ${C.bord}` : "none" }}>
                <div><span style={{ marginRight: 8 }}>{b.emoji}</span><span style={{ ...dm, fontSize: 14 }}>{b.name[lang] || b.name.hr}</span></div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, maxWidth: 160 }}>{b.tip[lang] || b.tip.hr}</div>
              </div>
            ))}
          </Card>
        </div>

        {/* Accommodation — Booking.com Affiliate */}
        <SectionLabel extra="Booking.com">{t("findStay",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {ACCOMMODATION.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ cursor: "pointer", padding: 16, transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <CityIcon name={a.name.hr || a.name.en} size={24} />
                  <Badge c="accent">{a.region.toUpperCase()}</Badge>
                </div>
                <div style={{ fontSize: 15, fontWeight: 400, marginBottom: 4 }}>{a.name[lang] || a.name.hr}</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, lineHeight: 1.5 }}>{a.note[lang] || a.note.hr}</div>
                <div style={{ ...dm, fontSize: 11, color: "#0055A6", marginTop: 8, fontWeight: 600 }}>{t("browseOn",lang)}</div>
              </Card>
            </a>
          ))}
        </div>

        {/* Top aktivnosti — Viator preview */}
        <SectionLabel extra="Viator">Top aktivnosti</SectionLabel>
        {viatorLoading && <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 16 }}>Učitavam aktivnosti…</div>}
        {(viatorActs || VIATOR_FALLBACK).slice(0, 3).map(act => {
          const inWishlist = viatorWishlist.some(a => a.productCode === act.productCode);
          return (
            <Card key={act.productCode} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
              {act.images?.[0] && <img src={act.images[0]} alt={act.title} style={{ width: 60, height: 60, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />}
              {!act.images?.[0] && <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(34,197,94,0.1)", display: "grid", placeItems: "center", fontSize: 28, flexShrink: 0 }}>🎯</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act.title}</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut }}>⏱ {act.duration} · <span style={{ color: C.accent }}>{act.price}€</span> / osobi</div>
              </div>
              <button onClick={() => toggleViatorWishlist(act)}
                style={{ padding: "6px 14px", borderRadius: 10, border: `1px solid ${inWishlist ? "rgba(34,197,94,0.3)" : C.bord}`, background: inWishlist ? "rgba(34,197,94,0.1)" : "transparent", color: inWishlist ? "#22c55e" : C.mut, fontSize: 12, cursor: "pointer", ...dm, flexShrink: 0, fontWeight: inWishlist ? 600 : 400 }}>
                {inWishlist ? "💚 Dodano" : "Saznaj više"}
              </button>
            </Card>
          );
        })}

        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Btn primary onClick={() => setSubScreen("transit")}>{t("simArrival",lang)}</Btn>
        </div>
      </>
    );

    if (subScreen === "transit") return (
      <>
        {/* ── HERE Map ── */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.bord}`, marginBottom: 0 }}>
          {transitFromCoords && transitToCoords ? (
            <TransitMap
              fromCoords={transitFromCoords}
              toCoords={transitToCoords}
              transportMode={transitSegUrl || "auto"}
              onRouteReady={setTransitRouteData}
              gpsPosition={gpsPosition}
            />
          ) : (
            <div style={{ height: 300, background: "#0c1426", display: "grid", placeItems: "center" }}>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>Učitavam HERE mapu…</div>
            </div>
          )}
        </div>

        {/* ── HERE Navigation (inside map card) ── */}
        {transitRouteData && (
          <div className="route-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: `rgba(14,165,233,0.04)`, borderRadius: "0 0 16px 16px", border: `1px solid ${C.bord}`, borderTop: "none", marginBottom: 16 }}>
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>
              🛣 {transitRouteData.km} km · ⏱ {transitRouteData.hrs}h {transitRouteData.mins}min
              {transitRouteData.estimated && <span style={{ fontSize: 10, color: C.gold, marginLeft: 6 }}>(procjena)</span>}
            </div>
            <button onClick={() => {
              const { oLat, oLng, dLat, dLng } = transitRouteData;
              window.location.href = `https://wego.here.com/directions/drive/${oLat},${oLng}/${dLat},${dLng}`;
            }}
              style={{ padding: "8px 18px", borderRadius: 10, background: `linear-gradient(135deg,#48dad0,#0ea5e9)`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", ...dm, whiteSpace: "nowrap" }}>
              📍 HERE Navigacija
            </button>
          </div>
        )}

        {/* ── Trip action button — always visible ── */}
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          {!tripActive ? (
            <button onClick={startTrip} className="trip-btn" style={{
              padding: "16px 40px", borderRadius: 16, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, #22c55e, #16a34a)`,
              color: "#fff", fontSize: 16, fontWeight: 700, ...dm,
              boxShadow: "0 4px 24px rgba(34,197,94,0.3)",
              animation: "pulse 2s infinite",
            }}>
              🚀 {lang === "de" || lang === "at" ? "Reise starten" : lang === "en" ? "Start trip" : lang === "it" ? "Inizia viaggio" : "Krećem na put"}
            </button>
          ) : (
            <Btn primary onClick={() => { setKioskWelcome(true); setNearbyData(null); setPhase("kiosk"); setSubScreen("home"); updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home", lang, destination: transitDestCity || kioskCity, segment: transitSegUrl || "auto", lastAccess: new Date().toISOString() }); }}>{t("arrived",lang)}</Btn>
          )}
        </div>

        {/* ── PULS JADRANA — unified intelligence feed ── */}
        <RouteGuide
          fromCoords={transitFromCoords}
          toCoords={transitToCoords}
          seg={transitSegUrl || "auto"}
          lang={lang}
          dm={dm}
          C={C}
          extraCards={[
            ...alerts
              .filter(a => !dismissedAlerts.has(a.title))
              .filter(a => !(a.source || "").includes("Auswärtiges"))  // irrelevant for route
              .filter(a => a.title && a.title.length > 5)
              .reduce((acc, a) => {  // deduplicate by first 40 chars
                const key = (a.title || "").slice(0, 40);
                if (!acc.seen.has(key)) { acc.seen.add(key); acc.items.push(a); }
                return acc;
              }, { seen: new Set(), items: [] }).items
              .slice(0, 3)  // max 3 alerts
              .map(a => ({
              id: "alert_" + (a.title || "").slice(0, 20),
              type: a.type || "alert",
              severity: a.severity === "critical" ? "critical" : a.severity === "high" ? "warning" : "info",
              icon: ALERT_ICONS[a.type] || "⚠️",
              title: a.title || "Upozorenje",
              body: "",  // title is enough, no duplicate body
              source: a.source || "HAK",
              ts: a.ts || new Date().toISOString(),
            })),
            ...gpsCards,
          ]}
        />

        {/* ── Arrival ── */}
        {geoArrival && arrivalCountdown !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <div style={{ fontSize: 80 }}>⚓</div>
            <div style={{ ...hf, fontSize: 32, fontWeight: 300, textAlign: "center" }}>
              Dobrodošli,<br /><span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}!</span>
            </div>
            <div style={{ width: 80, height: 80, borderRadius: "50%", border: `3px solid ${C.accent}`, display: "grid", placeItems: "center" }}>
              <span style={{ fontSize: 32, fontWeight: 300 }}>{arrivalCountdown}</span>
            </div>
            <button onClick={() => { setKioskWelcome(true); setNearbyData(null); setPhase("kiosk"); setSubScreen("home"); updateGuest(roomCode.current, { phase: "kiosk", subScreen: "home" }); setArrivalCountdown(null); }}
              style={{ padding: "14px 32px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},#0284c7)`, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", ...dm }}>
              Uđi u Kiosk →
            </button>
          </div>
        )}
      </>
    );
  };

  /* ══════════════════════════════
     PHASE 2: KIOSK (STAY)
     ══════════════════════════════ */

  // ─── GPS → Nearby: detect location and fetch nearby POIs ───
  useEffect(() => {
    if (phase !== "kiosk") return;
    if (nearbyData) return; // already fetched

    const fetchNearby = (lat, lng) => {
      setKioskCoords([lat, lng]);
      setNearbyLoading(true);
      fetch(`/api/nearby?lat=${lat}&lng=${lng}&cats=parking,food,shop,beach,pharmacy,bakery,culture,fuel&limit=5&lang=${lang}`)
        .then(r => r.json())
        .then(data => {
          setNearbyData(data.error ? { location: { city: transitDestCity || "Jadran" }, categories: {} } : data);
          setNearbyLoading(false);
          // DON'T auto-dismiss welcome — user clicks "Explore" button
        })
        .catch(() => {
          setNearbyData({ location: { city: transitDestCity || "Jadran" }, categories: {} });
          setNearbyLoading(false);
        });
    };

    // Priority: GPS (actual location) → transitToCoords (route destination) → delta → Split
    const delta = loadDelta();
    const fallbackLat = transitToCoords?.[0] || delta.destination?.lat || 43.508;
    const fallbackLng = transitToCoords?.[1] || delta.destination?.lng || 16.440;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
        () => fetchNearby(fallbackLat, fallbackLng),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    } else {
      fetchNearby(fallbackLat, fallbackLng);
    }
  }, [phase]); // eslint-disable-line

  // Transit destination city — for welcome screen and fallbacks
  const transitDestCity = loadDelta().destination?.city || (transitToCoords ? "" : "Jadran");

  // Nearby city name for display
  const kioskCity = nearbyData?.location?.city || transitDestCity || "Jadran";

  // ─── YOLO Sense: parking/marina/beach status ───
  useEffect(() => {
    if (phase !== "kiosk") return;
    const fetchSense = () => {
      fetch(`/api/sense?city=${encodeURIComponent(kioskCity)}`)
        .then(r => r.json()).then(setSenseData).catch(() => {});
    };
    fetchSense();
    const iv = setInterval(fetchSense, 600000); // 10 min
    return () => clearInterval(iv);
  }, [phase, kioskCity]);

  // ─── Emergency alerts from TZ Dashboard ───
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  useEffect(() => {
    if (phase !== "kiosk") return;
    const FB_KEY = import.meta.env.VITE_FB_API_KEY;
    if (!FB_KEY) return;
    const checkAlerts = () => {
      fetch(`https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_alerts?key=${FB_KEY}&pageSize=5&orderBy=created desc`)
        .then(r => r.json())
        .then(data => {
          const docs = data.documents || [];
          const active = docs.find(d => {
            const f = d.fields || {};
            return f.active?.stringValue === "true" && new Date(f.expires?.stringValue || 0) > new Date();
          });
          if (active) {
            setEmergencyAlert(active.fields.message?.stringValue || null);
          } else {
            setEmergencyAlert(null);
          }
        }).catch(() => {});
    };
    checkAlerts();
    const iv = setInterval(checkAlerts, 60000); // check every 1 min
    return () => clearInterval(iv);
  }, [phase]);

  const KioskHome = () => {
    const greetKey = hour < 6 ? "night" : hour < 12 ? "morning" : hour < 18 ? "midday" : hour < 22 ? "evening" : "night";
    const greeting = t(greetKey, lang);
    const tipIcon = hour < 6 ? "🌙" : hour < 12 ? "☕" : hour < 18 ? "🏖️" : hour < 22 ? "🍷" : "🌙";

    // Dynamic tip based on real nearby data
    const buildTip = () => {
      const nb = nearbyData?.categories || {};
      const firstBakery = nb.bakery?.[0];
      const firstBeach = nb.beach?.[0];
      const firstFood = nb.food?.[0];
      const firstShop = nb.shop?.[0];
      const firstParking = nb.parking?.[0];
      if (hour < 6) return `${weather.temp}°C. ${firstShop ? firstShop.name + ` (${firstShop.walkMin || "?"}min)` : kioskCity}.`;
      if (hour < 12) {
        const bakeryTip = firstBakery ? `${firstBakery.name} (${firstBakery.distance}m)` : "";
        const beachTip = firstBeach ? `${firstBeach.name} — ${firstBeach.walkMin}min` : "";
        return [bakeryTip, beachTip].filter(Boolean).join(". ") || `${kioskCity} — ${weather.temp}°C.`;
      }
      if (hour < 18) {
        const uvWarn = weather.uv >= 8 ? "SPF50+! " : weather.uv >= 5 ? "SPF30. " : "";
        const beachTip = firstBeach ? `${firstBeach.name} (${firstBeach.distance}m)` : "";
        return `${uvWarn}${weather.temp}°C. ${beachTip}`;
      }
      if (hour < 22) {
        const foodTip = firstFood ? `${firstFood.name} — ${firstFood.walkMin}min` : "";
        return `${weather.sunset ? "🌅 " + weather.sunset + ". " : ""}${foodTip}`;
      }
      return `${weather.temp}°C. ${kioskCity}.`;
    };
    const tip = nearbyData ? buildTip() : "...";

    // Dynamic nearby highlights bar
    const nb = nearbyData?.categories || {};
    const nearbyHighlights = [
      nb.parking?.[0] && { icon: "🅿️", text: `${nb.parking[0].name} · ${nb.parking[0].distance}m` },
      nb.beach?.[0] && { icon: "🏖️", text: `${nb.beach[0].name} · ${nb.beach[0].walkMin}min` },
      nb.food?.[0] && { icon: "🍽️", text: `${nb.food[0].name} · ${nb.food[0].distance}m` },
      nb.shop?.[0] && { icon: "🛒", text: `${nb.shop[0].name} · ${nb.shop[0].walkMin}min` },
    ].filter(Boolean);

    return (
      <>
        {/* Header: greeting + city */}
        <div style={{ padding: "20px 0 12px" }}>
          <div style={{ ...dm, fontSize: 12, color: C.mut, letterSpacing: 2, textTransform: "uppercase" }}>
            {tipIcon} {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <div style={{ ...hf, fontSize: 36, fontWeight: 400, marginTop: 8, lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>
          </div>
          <div style={{ ...dm, fontSize: 13, color: nearbyData ? C.accent : C.mut, marginTop: 4 }}>
            {nearbyData ? `📍 ${kioskCity}${nearbyData.location?.district && nearbyData.location.district !== kioskCity ? ` · ${nearbyData.location.district}` : ""}` 
             : nearbyLoading ? `📍 ${kioskCity}...`
             : `📍 ${kioskCity}`}
          </div>
        </div>

        {/* Emergency alert from TZ Dashboard */}
        {emergencyAlert && (
          <div style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🚨</span>
            <div style={{ flex: 1 }}>
              <div style={{ ...dm, fontSize: 11, color: C.red, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>
                {({hr:"HITNO UPOZORENJE",de:"NOTFALL-WARNUNG",en:"EMERGENCY ALERT",it:"AVVISO DI EMERGENZA",si:"NUJNO OPOZORILO",cz:"NOUZOVÉ VAROVÁNÍ",pl:"ALERT AWARYJNY"})[lang] || "HITNO UPOZORENJE"}
              </div>
              <div style={{ ...dm, fontSize: 14, color: C.text, lineHeight: 1.5 }}>{emergencyAlert}</div>
            </div>
            <button onClick={() => setEmergencyAlert(null)} style={{ background: "none", border: "none", color: C.mut, fontSize: 18, cursor: "pointer", padding: 4, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* ═══ ADRIATIC PULSE — unified weather/sea/UV board ═══ */}
        <Card style={{ marginBottom: 14, padding: 0, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, opacity: 0.12, pointerEvents: "none" }}>
            <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ display: "block" }}>
              <path fill={C.accent} d="M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z">
                <animate attributeName="d" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  values="M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z;M0,35 C100,20 200,42 300,28 C350,22 375,38 400,32 L400,60 L0,60 Z;M0,30 C100,45 200,15 300,30 C350,37 375,25 400,30 L400,60 L0,60 Z" />
              </path>
              <path fill={C.accent} opacity="0.5" d="M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z">
                <animate attributeName="d" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  values="M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z;M0,28 C80,42 160,22 240,38 C320,42 360,25 400,30 L400,60 L0,60 Z;M0,35 C80,20 160,45 240,32 C320,20 360,40 400,35 L400,60 L0,60 Z" />
              </path>
            </svg>
          </div>
          <div style={{ padding: "16px 20px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ ...dm, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}`, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 10, color: C.mut, letterSpacing: 3, fontWeight: 600 }}>ADRIATIC PULSE</span>
              </div>
              <span style={{ ...dm, fontSize: 10, color: C.mut }}>{new Date().toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div style={{ display: "flex", gap: 0, justifyContent: "space-between" }}>
              {[
                { label: {hr:"MORE",de:"MEER",en:"SEA",it:"MARE"}[lang]||"MORE", value: `${weather.sea}°`, sub: "surface", icon: "🌊", color: C.accent },
                { label: {hr:"ZRAK",de:"LUFT",en:"AIR",it:"ARIA"}[lang]||"ZRAK", value: `${weather.temp}°`, sub: weather.icon, icon: null, color: C.text },
                { label: "UV", value: weather.uv, sub: weather.uv >= 8 ? "!" : weather.uv >= 5 ? "med" : "low", icon: null, color: weather.uv >= 8 ? C.red : weather.uv >= 5 ? C.warm : C.green },
                { label: {hr:"VJETAR",de:"WIND",en:"WIND",it:"VENTO"}[lang]||"VJETAR", value: weather.wind?.split(" ")[1] || "—", sub: weather.wind?.split(" ")[0] || "", icon: null, color: C.mut },
                { label: "🌅", value: weather.sunset || "—", sub: "", icon: null, color: C.warm },
              ].map((m, i) => (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ ...dm, fontSize: 9, color: C.mut, letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 300, color: m.color, lineHeight: 1 }}>{m.icon || ""}{m.value}</div>
                  <div style={{ ...dm, fontSize: 10, color: C.mut, marginTop: 2 }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* YOLO Sense — parking/marina/beach live status */}
        {senseData && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {senseData.parking && (
              <div style={{ flex: 1, minWidth: 90, padding: "10px 12px", borderRadius: 12, background: "rgba(14,165,233,0.04)", border: `1px solid ${C.bord}`, textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>🅿️</div>
                <div style={{ ...dm, fontSize: 16, fontWeight: 300, color: senseData.parking.status === "slobodno" ? C.green : senseData.parking.status === "umjereno" ? C.gold : C.red, marginTop: 2 }}>
                  {senseData.parking.free_spots}/{senseData.parking.total_spots}
                </div>
                <div style={{ ...dm, fontSize: 9, color: C.mut, marginTop: 1 }}>
                  {({hr:"slobodnih",de:"frei",en:"free",it:"liberi"})[lang] || "slobodnih"}
                </div>
              </div>
            )}
            {senseData.marina && (
              <div style={{ flex: 1, minWidth: 90, padding: "10px 12px", borderRadius: 12, background: "rgba(14,165,233,0.04)", border: `1px solid ${C.bord}`, textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>⛵</div>
                <div style={{ ...dm, fontSize: 16, fontWeight: 300, color: senseData.marina.status === "slobodno" ? C.green : senseData.marina.status === "umjereno" ? C.gold : C.red, marginTop: 2 }}>
                  {senseData.marina.free_moorings}
                </div>
                <div style={{ ...dm, fontSize: 9, color: C.mut, marginTop: 1 }}>
                  {({hr:"vezova",de:"Plätze",en:"berths",it:"posti"})[lang] || "vezova"}
                </div>
              </div>
            )}
            {senseData.beach && (
              <div style={{ flex: 1, minWidth: 90, padding: "10px 12px", borderRadius: 12, background: "rgba(14,165,233,0.04)", border: `1px solid ${C.bord}`, textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>🏖️</div>
                <div style={{ ...dm, fontSize: 16, fontWeight: 300, color: senseData.beach.crowd === "mirno" ? C.green : senseData.beach.crowd === "malo gužve" ? C.accent : senseData.beach.crowd === "srednje gužve" ? C.gold : C.red, marginTop: 2 }}>
                  {senseData.beach.occupancy_pct}%
                </div>
                <div style={{ ...dm, fontSize: 9, color: C.mut, marginTop: 1 }}>
                  {({hr:"popunjenost",de:"Auslastung",en:"occupancy",it:"occupazione"})[lang] || "popunjenost"}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nearby highlights bar */}
        {nearbyHighlights.length > 0 && (
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", borderRadius: 12, background: "rgba(14,165,233,0.04)", border: `1px solid ${C.bord}`, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            {nearbyHighlights.map((h, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ width: 1, height: 14, background: C.bord }} />}
                <span style={{ ...dm, fontSize: 12, color: C.text }}>{h.icon} {h.text}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Quick tiles */}
        <SectionLabel>{t("quickAccess",lang)}</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10, marginBottom: 24 }}>
          {[
            { k: "parking", ic: IC.parking, l: t("parking",lang), clr: C.accent, free: true },
            { k: "beach", ic: IC.beach, l: t("beaches",lang), clr: "#38bdf8", free: true },
            { k: "food", ic: IC.food, l: ({hr:"Hrana",de:"Essen",en:"Food",it:"Cibo",si:"Hrana",cz:"Jídlo",pl:"Jedzenie"})[lang]||"Hrana", clr: C.terracotta, free: true },
            { k: "shop", ic: IC.shop, l: ({hr:"Dućan",de:"Laden",en:"Shop",it:"Negozio",si:"Trgovina",cz:"Obchod",pl:"Sklep"})[lang]||"Dućan", clr: "#34d399", free: true },
            { k: "bakery", ic: IC.bakery, l: ({hr:"Pekara",de:"Bäckerei",en:"Bakery",it:"Panetteria",si:"Pekarna",cz:"Pekárna",pl:"Piekarnia"})[lang]||"Pekara", clr: C.warm, free: true },
            { k: "pharmacy", ic: IC.medic, l: ({hr:"Ljekarna",de:"Apotheke",en:"Pharmacy",it:"Farmacia",si:"Lekarna",cz:"Lékárna",pl:"Apteka"})[lang]||"Ljekarna", clr: "#f472b6", free: true },
            { k: "culture", ic: IC.gem, l: ({hr:"Kultura",de:"Kultur",en:"Culture",it:"Cultura",si:"Kultura",cz:"Kultura",pl:"Kultura"})[lang]||"Kultura", clr: C.gold, free: true },
            { k: "fuel", ic: IC.map, l: ({hr:"Gorivo",de:"Tanken",en:"Fuel",it:"Carburante",si:"Gorivo",cz:"Palivo",pl:"Paliwo"})[lang]||"Gorivo", clr: "#94a3b8", free: true },
            { k: "emergency", ic: IC.medic, l: t("emergency",lang), clr: C.red, free: true },
            { k: "activities", ic: IC.ticket, l: t("activities",lang), clr: "#22c55e", free: true },
            ...(kioskCity === "Split" || kioskCity === "Podstrana" || kioskCity === "Omiš" || kioskCity === "Makarska" || kioskCity === "Trogir" || kioskCity === "Rab" ? [{ k: "gems", ic: IC.gem, l: t("gems",lang), clr: C.gold, free: false }] : []),
            ...(kioskCity === "Rab" ? [{ k: "excursions", ic: IC.ticket, l: ({hr:"Izleti",de:"Ausflüge",en:"Excursions",it:"Escursioni"})[lang]||"Izleti", clr: "#0ea5e9", free: true }] : []),
            { k: "chat", ic: IC.bot, l: t("aiGuide",lang), clr: "#a78bfa", free: false },
          ].map(t => {
            const count = nearbyData?.categories?.[t.k]?.length;
            return (
            <div key={t.k} onClick={() => {
              if (!t.free && !premium) setShowPaywall(true);
              else setSubScreen(t.k);
            }}
              className="anim-card glass" style={{
                background: "rgba(12,28,50,0.65)", borderRadius: 20, padding: "20px 12px 16px",
                textAlign: "center", cursor: "pointer", position: "relative",
                border: `1px solid ${C.bord}`, transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.clr + "33"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.25), 0 0 20px ${t.clr}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.03)"; }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: t.clr + "12", display: "grid", placeItems: "center", margin: "0 auto 10px", border: `1px solid ${t.clr}15`, transition: "all 0.3s" }}>
                <Icon d={t.ic} size={22} color={t.clr} stroke={1.6} />
              </div>
              <div style={{ ...dm, fontSize: 12, fontWeight: 500, color: C.text }}>{t.l}</div>
              {count > 0 && <div style={{ position: "absolute", top: 6, left: 6, ...dm, fontSize: 9, color: C.accent, background: C.acDim, padding: "1px 6px", borderRadius: 8, fontWeight: 700, border: "1px solid rgba(14,165,233,0.15)" }}>{count}</div>}
              {!t.free && !premium && <div style={{ position: "absolute", top: 8, right: 8, ...dm, fontSize: 8, color: C.gold, background: C.goDim, padding: "2px 7px", borderRadius: 8, fontWeight: 600, letterSpacing: 0.5, border: `1px solid rgba(245,158,11,0.1)` }}>PRO</div>}
            </div>
          );})}
        </div>

        {/* AI Tip — premium */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.goDim},rgba(14,165,233,0.03))`, borderColor: "rgba(251,191,36,0.1)", marginBottom: 14, display: "flex", gap: 16, alignItems: "flex-start", cursor: premium ? "default" : "pointer", position: "relative", overflow: "hidden" }} onClick={() => !premium && setShowPaywall(true)}>
          <div style={{ fontSize: 28 }}>{tipIcon}</div>
          <div>
            <div style={{ ...dm, fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>{t("aiRec",lang)}</div>
            {premium ? <div style={{ ...dm, fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 300 }}>{tip}</div> : <div style={{ ...dm, fontSize: 15, color: C.text, lineHeight: 1.7, fontWeight: 300, filter: "blur(6px)", userSelect: "none" }}>{tip}</div>}
            {!premium && <div style={{ ...dm, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,22,40,0.3)", borderRadius: 22 }}><span style={{ background: C.goDim, padding: "8px 18px", borderRadius: 14, fontSize: 13, color: C.gold, fontWeight: 600, border: `1px solid rgba(245,158,11,0.15)` }}>⭐ Premium — 9.99€</span></div>}
          </div>
        </Card>

        {/* Extend Stay — Booking.com */}
        <Card style={{ marginBottom: 16, border: "1px dashed rgba(0,85,166,0.2)", background: "rgba(0,85,166,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 400 }}>🏨 {t("extendStay",lang)}</div>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>{t("bestDeals",lang)} — Booking.com</div>
            </div>
            <a href={BKG(`${kioskCity}, Croatia`, "&checkin=&checkout=&group_adults=2&no_rooms=1")} target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 18px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 12, color: "#fff", fontSize: 13, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>{t("browseOn",lang)}</a>
          </div>
        </Card>

        <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
          <Btn onClick={() => { setPhase("post"); setSubScreen("summary"); updateGuest(roomCode.current, { phase: "post", subScreen: "summary" }); }}>{t("checkOut",lang)}</Btn>
        </div>
      </>
    );
  };

  const KioskDetail = () => {
    const staticData = PRACTICAL[subScreen]; // fallback for sun, emergency, routes
    const nearbyPlaces = nearbyData?.categories?.[subScreen] || [];
    const hasNearby = nearbyPlaces.length > 0;
    const svKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

    // Category display config
    const CAT_DISPLAY = {
      parking: { icon: "🅿️", tk: "parking" },
      food: { icon: "🍽️", tk: "food" },
      shop: { icon: "🛒", tk: "shop" },
      beach: { icon: "🏖️", tk: "beaches" },
      pharmacy: { icon: "💊", tk: "emergency" },
      bakery: { icon: "🥐", tk: "food" },
      culture: { icon: "🏛️", tk: "activities" },
      fuel: { icon: "⛽", tk: "routes" },
    };
    const display = CAT_DISPLAY[subScreen] || (staticData ? { icon: staticData.icon, tk: staticData.tk } : { icon: "📍", tk: subScreen });

    // For static categories (sun, emergency, routes), use old PRACTICAL
    if (!hasNearby && staticData) {
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 40 }}>{display.icon}</span>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{display.tk ? t(display.tk,lang) : subScreen}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staticData.items.map((it, i) => (
              <Card key={i} style={{ borderColor: it.warn ? "rgba(239,68,68,0.12)" : it.free ? "rgba(34,197,94,0.12)" : C.bord, display: "flex", gap: 14, alignItems: "flex-start" }}>
                {it.warn && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, marginTop: 8, flexShrink: 0 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{it.uvDynamic ? `UV ${weather.uv} (${weather.uv >= 8 ? "HIGH" : weather.uv >= 5 ? "MED" : "LOW"})` : typeof it.n === "object" ? (it.n[lang] || it.n.hr || "") : it.n}</div>
                  <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>
                    {typeof it.note === "object" ? (it.note[lang] || it.note.hr || "") : it.note}
                    {it.d && <span style={{ color: C.accent, marginLeft: 8 }}>{it.d}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      );
    }

    // Dynamic nearby places from HERE
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>{display.icon}</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{display.tk ? t(display.tk,lang) : subScreen}</div>
            <div style={{ ...dm, fontSize: 12, color: C.mut }}>📍 {kioskCity} · {nearbyPlaces.length} {({hr:"rezultata",de:"Ergebnisse",en:"results",it:"risultati"})[lang] || "rezultata"}</div>
          </div>
        </div>

        {nearbyLoading && !hasNearby && <Card style={{ marginBottom: 14, padding: "14px 20px" }}>
          <div style={{ ...dm, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.accent }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 1.2s infinite" }} />
            {({hr:"Tražim...",de:"Suche...",en:"Searching...",it:"Cerco..."})[lang] || "Tražim..."}
          </div>
        </Card>}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nearbyPlaces.map((place, i) => (
            <Card key={i} style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{place.name}</div>
                  {place.address && <div style={{ ...dm, fontSize: 12, color: C.mut }}>{place.street || place.district || place.address.split(",")[0]}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  {place.distance != null && <div style={{ ...dm, fontSize: 14, fontWeight: 600, color: C.accent }}>{place.distance >= 1000 ? `${(place.distance/1000).toFixed(1)}km` : `${place.distance}m`}</div>}
                  {place.walkMin && <div style={{ ...dm, fontSize: 10, color: C.mut }}>🚶 {place.walkMin}min</div>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {place.openNow !== null && (
                  <span style={{ ...dm, fontSize: 11, padding: "2px 8px", borderRadius: 8, background: place.openNow ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: place.openNow ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {place.openNow ? (({hr:"Otvoreno",de:"Geöffnet",en:"Open",it:"Aperto"})[lang]||"Otvoreno") : (({hr:"Zatvoreno",de:"Geschlossen",en:"Closed",it:"Chiuso"})[lang]||"Zatvoreno")}
                  </span>
                )}
                {place.hours && <span style={{ ...dm, fontSize: 11, color: C.mut }}>{place.hours}</span>}
                {place.phone && <a href={`tel:${place.phone}`} style={{ ...dm, fontSize: 11, color: C.accent, textDecoration: "none" }}>📞 {place.phone}</a>}
                {place.categories?.[0] && <span style={{ ...dm, fontSize: 10, color: C.mut, padding: "1px 6px", borderRadius: 6, border: `1px solid ${C.bord}` }}>{place.categories[0]}</span>}
              </div>

              {/* Street View thumbnail + Navigation */}
              {place.lat && place.lng && (
                <>
                  {/* Street View static preview — shows what the place looks like */}
                  {svKey && (
                    <div style={{ borderRadius: 10, overflow: "hidden", marginTop: 10, position: "relative", height: 130, background: "rgba(0,0,0,0.2)" }}>
                      <img
                        src={`https://maps.googleapis.com/maps/api/streetview?size=600x260&location=${place.lat},${place.lng}&fov=80&key=${svKey}`}
                        alt={`Street View — ${place.name}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        loading="lazy"
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
                      />
                      <div style={{ position: "absolute", bottom: 6, left: 8, ...dm, fontSize: 9, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.45)", padding: "2px 8px", borderRadius: 6 }}>
                        Street View
                      </div>
                      {/* Tap thumbnail → open inline Street View overlay */}
                      <button
                        onClick={() => setSvModal({ lat: place.lat, lng: place.lng, name: place.name })}
                        style={{ position: "absolute", inset: 0, background: "transparent", border: "none", cursor: "pointer", width: "100%", height: "100%" }}
                        title="Open Street View"
                      />
                      <div style={{ position: "absolute", bottom: 6, right: 8, ...dm, fontSize: 9, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.45)", padding: "2px 8px", borderRadius: 6 }}>
                        {({hr:"Tapni za prikaz",de:"Tippen",en:"Tap to view",it:"Tocca"})[lang]||"Tap"}
                      </div>
                    </div>
                  )}
                  {/* Navigation buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=walking`, "_blank")}
                      style={{ ...dm, flex: 1, padding: "10px 14px", background: C.acDim, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 12, color: C.accent, fontSize: 13, cursor: "pointer", fontWeight: 600, textAlign: "center" }}>
                      🚶 {({hr:"Pješice",de:"Zu Fuß",en:"Walk",it:"A piedi"})[lang]||"Pješice"}
                    </button>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`, "_blank")}
                      style={{ ...dm, flex: 1, padding: "10px 14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, color: C.gold, fontSize: 13, cursor: "pointer", fontWeight: 600, textAlign: "center" }}>
                      🚗 {({hr:"Autom",de:"Mit Auto",en:"Drive",it:"In auto"})[lang]||"Autom"}
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {!hasNearby && !nearbyLoading && (
          <Card style={{ textAlign: "center", padding: "24px 20px" }}>
            <div style={{ ...dm, fontSize: 14, color: C.mut }}>{({hr:"Nema rezultata u blizini",de:"Keine Ergebnisse in der Nähe",en:"No results nearby",it:"Nessun risultato vicino"})[lang] || "Nema rezultata"}</div>
          </Card>
        )}
      </>
    );
  };

  const KioskGems = () => (
    <>
      <BackBtn onClick={() => setSubScreen("home")} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 36 }}>💎</span>
        <div><div style={{ fontSize: 28, fontWeight: 400 }}>{t("gems",lang)}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut }}>{t("localTip",lang)}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginTop: 20 }}>
        {GEMS.map((g, i) => (
          <Card key={i} style={{ cursor: "pointer", position: "relative" }}
            onClick={() => { if (g.premium && !premium) setShowPaywall(true); else setSelectedGem(g); }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3), 0 0 16px rgba(251,191,36,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.bord; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            {g.premium && !premium && <div style={{ position: "absolute", inset: 0, background: "rgba(10,22,40,0.7)", borderRadius: 18, display: "grid", placeItems: "center", zIndex: 5 }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: 28 }}>🔒</div><div style={{ ...dm, fontSize: 12, color: C.gold }}>Premium</div></div>
            </div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 32 }}>{g.emoji}</span>
              <Badge c="gold">{(typeof g.type === "object" ? (g.type[lang] || g.type.hr) : g.type).toUpperCase()}</Badge>
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{g.name}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 1.5 }}>{(typeof g.desc === "object" ? (g.desc[lang] || g.desc.hr) : g.desc).substring(0, 90)}...</div>
            <div style={{ ...dm, display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: C.mut }}>
              <span>⏰ {typeof g.best === "object" ? (g.best[lang] || g.best.hr) : g.best}</span><span>📍 {typeof g.diff === "object" ? (g.diff[lang] || g.diff.hr) : g.diff}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const KioskActivities = () => {
    const acts = viatorActs || VIATOR_FALLBACK;
    const CATCLR = { Kultura: "#a78bfa", Nautika: "#0ea5e9", Priroda: "#34d399", Avantura: "#f97316", Romantika: "#f472b6" };
    const STARS = (r) => r ? "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r)) : "★★★★★";
    return (
      <>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>🎯</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 400 }}>{t("activities",lang)}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>Rezervirajte odmah · Potvrda odmah</div>
          </div>
        </div>

        {/* Wishlist teaser */}
        {viatorWishlist.length > 0 && (
          <div style={{ padding: "10px 16px", borderRadius: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>💚</span>
            <div style={{ ...dm, fontSize: 13 }}>
              <strong style={{ color: "#22c55e" }}>{viatorWishlist.length} aktivnost{viatorWishlist.length === 1 ? "" : "i"}</strong> iz vaše liste želja
            </div>
          </div>
        )}

        {viatorLoading && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${C.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin-slow 0.8s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ ...dm, fontSize: 13, color: C.mut }}>Učitavam aktivnosti…</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginTop: 8 }}>
          {acts.map((act, i) => {
            const inWishlist = viatorWishlist.some(a => a.productCode === act.productCode);
            const img = act.images?.[0];
            return (
              <Card key={act.productCode} style={{ padding: 0, overflow: "hidden", cursor: "pointer", animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}
                onClick={() => { setSelectedViatorAct(act); setViatorPersons(G.adults || 2); setViatorImgIdx(0); }}>
                {/* Image */}
                <div style={{ height: 140, position: "relative", overflow: "hidden", background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(34,197,94,0.08))" }}>
                  {img && <img src={img} alt={act.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                  {!img && <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 48 }}>🏖️</div>}
                  {/* Wishlist btn */}
                  <button onClick={e => { e.stopPropagation(); toggleViatorWishlist(act); }}
                    style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.45)", color: inWishlist ? "#22c55e" : "#fff", fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    {inWishlist ? "♥" : "♡"}
                  </button>
                  {/* Category badge */}
                  {act.category && <div style={{ position: "absolute", top: 10, left: 10, padding: "2px 10px", borderRadius: 10, background: "rgba(0,0,0,0.5)", color: CATCLR[act.category] || C.mut, fontSize: 10, fontWeight: 600, ...dm }}>{act.category.toUpperCase()}</div>}
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, lineHeight: 1.3 }}>{act.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ ...dm, fontSize: 12, color: C.mut }}>
                      <span style={{ color: "#facc15", letterSpacing: -1 }}>{STARS(act.rating)}</span>{" "}
                      {act.rating?.toFixed(1)} ({act.reviewCount > 1000 ? `${(act.reviewCount/1000).toFixed(1)}k` : act.reviewCount})
                    </div>
                    <div style={{ ...dm, fontSize: 12, color: C.mut }}>⏱ {act.duration}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div style={{ fontSize: 20, fontWeight: 300, color: C.accent }}>{act.price}€ <span style={{ ...dm, fontSize: 11, color: C.mut }}>/ osobi</span></div>
                    <div style={{ ...dm, fontSize: 12, padding: "6px 14px", borderRadius: 10, background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 600 }}>Rezerviraj →</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  const KioskChat = () => {
    const prompts = [t("chatPrompt1",lang), t("chatPrompt2",lang), t("chatPrompt3",lang), t("chatPrompt4",lang)];
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 240px)" }}>
        <BackBtn onClick={() => setSubScreen("home")} />
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
          {chatMsgs.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌊</div>
              <div style={{ fontSize: 24, fontWeight: 300, marginBottom: 8 }}>{t("askAnything",lang)}</div>
              <div style={{ ...dm, color: C.mut, fontSize: 14, marginBottom: 20 }}>{t("askDalmatia",lang)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {prompts.map((p, i) => (
                  <button key={i} onClick={() => setChatInput(p)} style={{ ...dm, padding: "10px 16px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 14, color: C.text, fontSize: 14, cursor: "pointer" }}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {chatMsgs.map((m, i) => (
            <div key={i} style={{ maxWidth: "78%", padding: "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "rgba(14,165,233,0.08)" : "rgba(186,230,253,0.03)", marginBottom: 10, marginLeft: m.role === "user" ? "auto" : 0, ...dm, fontSize: 15, lineHeight: 1.6, fontWeight: 300, border: `1px solid ${m.role === "user" ? "rgba(14,165,233,0.12)" : C.bord}`, whiteSpace: "pre-wrap" }}>
              {m.role !== "user" && <div style={{ fontSize: 10, color: C.accent, marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>JADRAN AI</div>}
              {m.text}
            </div>
          ))}
          {chatLoading && <div style={{ ...dm, maxWidth: "78%", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, opacity: 0.5 }}>● ● ●</div>}
          <div ref={chatEnd} />
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: `1px solid ${C.bord}` }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doChat()}
            placeholder={t("askPlaceholder",lang)} style={{ ...dm, flex: 1, padding: "14px 18px", background: "rgba(186,230,253,0.04)", border: `1px solid ${C.bord}`, borderRadius: 18, color: C.text, fontSize: 16, outline: "none" }} />
          <button onClick={doChat} style={{ padding: "14px 24px", background: `linear-gradient(135deg,${C.accent},#0284c7)`, border: "none", borderRadius: 18, color: "#fff", fontSize: 18, cursor: "pointer", fontWeight: 600 }}>→</button>
        </div>
      </div>
    );
  };

  const NEARBY_CATS = ["parking","food","shop","beach","pharmacy","bakery","culture","fuel"];
  const Kiosk = () => {
    // ── Welcome/Transition screen ──
    if (kioskWelcome) {
      const welcomeTexts = {
        hr: ["Stigli ste!", `Dobrodošli u ${kioskCity}`, nearbyData ? null : "Tražim lokacije u blizini..."],
        de: ["Angekommen!", `Willkommen in ${kioskCity}`, nearbyData ? null : "Suche Orte in der Nähe..."],
        en: ["You've arrived!", `Welcome to ${kioskCity}`, nearbyData ? null : "Finding places nearby..."],
        it: ["Siete arrivati!", `Benvenuti a ${kioskCity}`, nearbyData ? null : "Cerco luoghi vicini..."],
        si: ["Prispeli ste!", `Dobrodošli v ${kioskCity}`, nearbyData ? null : "Iščem bližnje lokacije..."],
        cz: ["Dorazili jste!", `Vítejte v ${kioskCity}`, nearbyData ? null : "Hledám místa poblíž..."],
        pl: ["Dotarliście!", `Witamy w ${kioskCity}`, nearbyData ? null : "Szukam miejsc w pobliżu..."],
      };
      const wt = welcomeTexts[lang] || welcomeTexts[lang === "at" ? "de" : "hr"];
      const nearbyCount = nearbyData ? Object.values(nearbyData.categories || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0) : 0;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", animation: "fadeIn 0.6s both" }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: "pulse-glow 2s ease infinite" }}>⚓</div>
          <div style={{ ...dm, fontSize: 14, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{wt[0]}</div>
          <div style={{ ...hf, fontSize: 36, fontWeight: 400, color: C.text, marginBottom: 8 }}>{wt[1]}</div>
          {wt[2] && (
            <div style={{ ...dm, fontSize: 13, color: C.mut, display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: C.accent, animation: "pulse 1.5s infinite" }} />
              {wt[2]}
            </div>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { emoji: "🅿️", k: "parking", label: {hr:"Parking",de:"Parken",en:"Parking",it:"Parcheggio"}[lang]||"Parking" },
              { emoji: "🛒", k: "shop", label: {hr:"Dućan",de:"Laden",en:"Shop",it:"Negozio"}[lang]||"Dućan" },
              { emoji: "🏖️", k: "beach", label: {hr:"Plaže",de:"Strände",en:"Beaches",it:"Spiagge"}[lang]||"Plaže" },
              { emoji: "🍽️", k: "food", label: {hr:"Hrana",de:"Essen",en:"Food",it:"Cibo"}[lang]||"Hrana" },
            ].map((item, i) => (
              <div key={item.k} onClick={() => { setKioskWelcome(false); setSubScreen(item.k); }}
                style={{ width: 68, cursor: "pointer", textAlign: "center", animation: `fadeUp 0.4s ease ${i * 0.1}s both` }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: C.card, border: `1px solid ${C.bord}`, display: "grid", placeItems: "center", fontSize: 24, margin: "0 auto 4px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.bord}>
                  {item.emoji}
                </div>
                <div style={{ ...dm, fontSize: 10, color: C.mut }}>{item.label}</div>
              </div>
            ))}
          </div>
          {nearbyData ? (
            <Btn primary onClick={() => setKioskWelcome(false)} style={{ marginTop: 28 }}>
              {({hr:"Istraži",de:"Entdecken",en:"Explore",it:"Esplora",si:"Razišči",cz:"Prozkoumej",pl:"Odkrywaj"})[lang] || "Istraži"} {kioskCity} → {nearbyCount > 0 ? `(${nearbyCount})` : ""}
            </Btn>
          ) : (
            <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 28, height: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 1s infinite" }} />
              {({hr:"Učitavam...",de:"Laden...",en:"Loading...",it:"Caricamento...",si:"Nalagam...",cz:"Načítám...",pl:"Ładuję..."})[lang] || "..."}
            </div>
          )}
        </div>
      );
    }

    // ── KioskExcursions: Rab affiliate excursions (GYG + Viator + Booking) ──
    const KioskExcursions = () => {
      const RAB_EXCURSIONS = [
        { emoji: "🚢", en: "Boat Tours", de: "Bootstouren", hr: "Ture brodom",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=boat+tour",
          viator: "https://www.viator.com/searchResults/all?text=Rab+boat+tour&pid=P00292197",
          img: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400&q=75", clr: "#0ea5e9" },
        { emoji: "🤿", en: "Snorkeling & Diving", de: "Schnorcheln & Tauchen", hr: "Ronjenje",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=diving+snorkeling",
          viator: "https://www.viator.com/searchResults/all?text=Rab+diving&pid=P00292197",
          img: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=75", clr: "#38bdf8" },
        { emoji: "🛶", en: "Kayaking & Paddling", de: "Kajak & Paddeln", hr: "Kajak",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=kayak",
          viator: "https://www.viator.com/searchResults/all?text=Rab+kayak&pid=P00292197",
          img: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=400&q=75", clr: "#34d399" },
        { emoji: "🏛️", en: "Cultural Tours", de: "Kulturelle Touren", hr: "Kulturne ture",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=walking+tour",
          viator: "https://www.viator.com/searchResults/all?text=Rab+walking+tour&pid=P00292197",
          img: "https://images.unsplash.com/photo-1555990538-1e09e0e62c7e?w=400&q=75", clr: C.gold },
        { emoji: "🏝️", en: "Island Hopping", de: "Insel-Hopping", hr: "Otočki obilazak",
          gyg: "https://www.getyourguide.com/rab-l97509/?partner_id=9OEGOYI&q=island+hopping",
          viator: "https://www.viator.com/searchResults/all?text=Rab+island+hopping&pid=P00292197",
          img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75", clr: "#a78bfa" },
        { emoji: "🏠", en: "Find Accommodation", de: "Unterkunft finden", hr: "Smještaj",
          booking: "https://www.booking.com/searchresults.html?ss=Rab%2C+Croatia&aid=101704203",
          img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=75", clr: "#22c55e" },
      ];
      const lbl = (x) => lang === "de" || lang === "at" ? x.de : lang === "en" ? x.en : x.hr;
      return (
        <>
          <BackBtn onClick={() => setSubScreen("home")} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>🚢</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 400 }}>
                {lang === "de" || lang === "at" ? "Ausflüge & Aktivitäten" : lang === "en" ? "Excursions & Activities" : "Izleti & Aktivnosti"}
              </div>
              <div style={{ ...dm, fontSize: 13, color: C.mut }}>📍 Rab · GetYourGuide + Viator</div>
            </div>
          </div>

          {/* Category cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, marginBottom: 20 }}>
            {RAB_EXCURSIONS.map((ex, i) => (
              <Card key={i} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = ex.clr + "44"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = C.bord; }}>
                {/* Image header */}
                <div style={{ height: 90, position: "relative", background: `linear-gradient(135deg,${ex.clr}22,rgba(12,28,50,0.9))`, overflow: "hidden" }}>
                  <img src={ex.img} alt={lbl(ex)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} loading="lazy" />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{ex.emoji}</span>
                    <span style={{ ...dm, fontSize: 15, fontWeight: 600, color: "#f0f4f8" }}>{lbl(ex)}</span>
                  </div>
                </div>
                {/* Buttons */}
                <div style={{ padding: "12px 14px", display: "flex", gap: 8 }}>
                  {ex.gyg && (
                    <a href={ex.gyg} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 10, color: C.accent, fontSize: 12, fontWeight: 700, textAlign: "center", textDecoration: "none", ...dm }}>
                      GetYourGuide
                    </a>
                  )}
                  {ex.viator && (
                    <a href={ex.viator} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, color: "#22c55e", fontSize: 12, fontWeight: 700, textAlign: "center", textDecoration: "none", ...dm }}>
                      Viator
                    </a>
                  )}
                  {ex.booking && (
                    <a href={ex.booking} target="_blank" rel="noopener noreferrer"
                      style={{ flex: 1, padding: "9px 10px", background: "rgba(0,85,166,0.1)", border: "1px solid rgba(0,85,166,0.25)", borderRadius: 10, color: "#60a5fa", fontSize: 12, fontWeight: 700, textAlign: "center", textDecoration: "none", ...dm }}>
                      Booking.com
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* GYG Widget — auto-hydrated by script in index.html */}
          <Card style={{ padding: 20, overflow: "hidden" }}>
            <div style={{ ...dm, fontSize: 12, color: C.mut, marginBottom: 12 }}>
              {lang === "de" || lang === "at" ? "Alle Ausflüge auf Rab" : lang === "en" ? "All excursions on Rab" : "Svi izleti na Rabu"}
            </div>
            <div
              data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
              data-gyg-locale-code={lang === "de" || lang === "at" ? "de-DE" : lang === "en" ? "en-US" : lang === "it" ? "it-IT" : "en-US"}
              data-gyg-widget="activities"
              data-gyg-number-of-items="4"
              data-gyg-partner-id="9OEGOYI"
              data-gyg-q="Rab Croatia"
              data-gyg-cmp="jadran_kiosk_rab"
            />
          </Card>

          {/* Booking.com — accommodations */}
          <Card style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 400 }}>
                🏨 {lang === "de" || lang === "at" ? "Unterkunft auf Rab" : lang === "en" ? "Accommodation on Rab" : "Smještaj na Rabu"}
              </div>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>Booking.com · 4-5% provizija</div>
            </div>
            <a href="https://www.booking.com/searchresults.html?ss=Rab%2C+Croatia&aid=101704203"
              target="_blank" rel="noopener noreferrer"
              style={{ padding: "10px 18px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", ...dm }}>
              {lang === "de" || lang === "at" ? "Suchen" : lang === "en" ? "Search" : "Traži"}
            </a>
          </Card>
        </>
      );
    };

    if (subScreen === "home") return <KioskHome />;
    if (subScreen === "activities") return <KioskActivities />;
    if (subScreen === "excursions") return <KioskExcursions />;
    if (subScreen === "gems") return <KioskGems />;
    if (subScreen === "chat") return <KioskChat />;
    if (PRACTICAL[subScreen] || NEARBY_CATS.includes(subScreen)) return <KioskDetail />;
    return <KioskHome />;
  };

  /* ══════════════════════════════
     PHASE 3: POST-STAY
     ══════════════════════════════ */
  const PostStay = () => (
    <>
      <div style={{ textAlign: "center", padding: "28px 0 8px" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }} className="emoji-float">🌅</div>
        <div style={{ ...hf, fontSize: 34, fontWeight: 400 }}>{t("thanks",lang)}, <span style={{ color: C.warm, fontStyle: "italic" }}>{G.first}</span>!</div>
        <div style={{ ...dm, color: C.mut, fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          {kioskCity} · {t("unforgettable",lang)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 20 }}>
        {/* Loyalty */}
        <Card glow style={{ background: `linear-gradient(135deg,${C.acDim},${C.goDim})`, borderColor: "rgba(14,165,233,0.1)" }}>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.gold, marginBottom: 4 }}>JADRAN LOYALTY</div>
          <div style={{ fontSize: 26, fontWeight: 300 }}>🌊 {LOYALTY.tier}</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, marginTop: 8 }}>
            {LOYALTY.points} {t("points",lang)} → <strong style={{ color: C.gold }}>{LOYALTY.next}</strong> ({LOYALTY.nextPts})
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", overflow: "hidden", margin: "12px 0 6px" }}>
            <div style={{ height: "100%", width: `${(LOYALTY.points / LOYALTY.nextPts) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
          </div>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>{t("more",lang)} {LOYALTY.nextPts - LOYALTY.points} {t("points",lang)}</div>
        </Card>

        {/* Revenue summary — admin only (visible with ?admin=sial) */}
        {isAdmin && <Card>
          <div style={{ ...dm, fontSize: 11, textTransform: "uppercase", letterSpacing: 3, color: C.accent, marginBottom: 8 }}>💰 {t("revenue",lang)} (admin)</div>
          <div style={{ ...dm, fontSize: 13, color: C.mut, lineHeight: 2 }}>
            Premium: <strong style={{ color: C.green }}>9.99–49.99€</strong><br />
            Affiliate: <strong style={{ color: C.green }}>~8-15€</strong><br />
            <span style={{ borderTop: `1px solid ${C.bord}`, display: "block", paddingTop: 4, marginTop: 4 }}>
              UKUPNO: <strong style={{ color: C.gold, fontSize: 18 }}>~20-30€</strong>
            </span>
          </div>
        </Card>}
      </div>

      {/* Referral */}
      <Card style={{ textAlign: "center", border: `1px dashed rgba(14,165,233,0.15)`, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{t("inviteFriends",lang)}</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 8 }}>{t("bothDiscount",lang)}</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, color: C.accent, margin: "10px 0" }}>{LOYALTY.code}</div>
        <Btn primary>{t("shareCode",lang)}</Btn>
      </Card>

      {/* Rebooking — Booking.com Affiliate */}
      <Card style={{ textAlign: "center", padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 6 }}>{t("nextYear",lang)}</div>
        <div style={{ ...dm, fontSize: 14, color: C.mut, marginBottom: 16, lineHeight: 1.6 }}>
          {t("planNext",lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 16, textAlign: "left" }}>
          {ACCOMMODATION.slice(0, 4).map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ padding: "10px 12px", background: "rgba(0,85,166,0.04)", border: `1px solid rgba(0,85,166,0.1)`, borderRadius: 12, cursor: "pointer", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,85,166,0.1)"; }}>
                <CityIcon name={a.name.hr || a.name.en} size={18} />
                <div style={{ ...dm, fontSize: 12, fontWeight: 500, marginTop: 4 }}>{a.name[lang] || a.name.hr}</div>
              </div>
            </a>
          ))}
        </div>
        <a href={BKG(`${kioskCity}, Croatia`)} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "14px 28px", background: "linear-gradient(135deg,#003580,#0055A6)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,53,128,0.3)" }}>{t("browseOn",lang)}</a>
      </Card>

      {/* Monetization breakdown (admin) */}
      {isAdmin && <Card style={{ background: `linear-gradient(135deg,rgba(251,191,36,0.04),rgba(14,165,233,0.03))`, borderColor: "rgba(251,191,36,0.08)" }}>
        <SectionLabel extra="ADMIN">MONETIZACIJA</SectionLabel>
        <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.8 }}>
          1. Premium (9.99€) · 2. Affiliate (~8-15€) · 3. Host fee<br />
          <span style={{ color: C.gold }}>📊 ~20-30€/gost</span>
        </div>
      </Card>}
    </>
  );

  /* ═══ MAIN RENDER ═══ */

  /* ─── GUEST ONBOARDING ─── */
  if (showOnboarding) return (
    <GuestOnboarding
      roomCode={roomCode.current}
      onComplete={(guestData) => {
        setGuestProfile({
          name: guestData.name, first: guestData.first || guestData.name.split(" ").pop(),
          country: guestData.country, flag: guestData.flag || "🌍", lang: guestData.lang || "en",
          adults: guestData.adults || 2, kids: guestData.kids || 0, kidsAges: guestData.kidsAges || [],
          interests: guestData.interests || [], arrival: guestData.arrival || "",
          departure: guestData.departure || "", car: guestData.car || false,
          accommodation: guestData.accommodation || "", host: guestData.host || "",
          hostPhone: guestData.hostPhone || "", budget: guestData.budget || 1200,
          spent: guestData.spent || 0, email: guestData.email || "",
        });
        setLang(guestData.lang || "en");
        // Auto-set phase based on dates
        const now = new Date();
        const cin = new Date(guestData.arrival);
        const cout = new Date(guestData.departure);
        if (now < cin) { setPhase("pre"); setSubScreen("pretrip"); }
        else if (now <= cout) { setPhase("kiosk"); setSubScreen("home"); }
        else { setPhase("post"); setSubScreen("summary"); }
        setInterests(new Set(guestData.interests || []));
        setShowOnboarding(false);
        setSplash(false);
      }}
    />
  );

  /* ─── CINEMATIC SPLASH ─── */
  if (splash) return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#061020", color: "#e0f2fe", minHeight: "100vh", minHeight: "100dvh", display: "grid", placeItems: "center", position: "relative", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes splash-logo-reveal { 0% { opacity:0; transform: scale(0.7) translateY(10px); filter: blur(8px); }
          60% { opacity:1; transform: scale(1.02) translateY(0); filter: blur(0); }
          100% { opacity:1; transform: scale(1) translateY(0); filter: blur(0); } }
        @keyframes splash-text-reveal { 0% { opacity:0; transform: translateY(16px); letter-spacing: 12px; }
          100% { opacity:1; transform: translateY(0); letter-spacing: 8px; } }
        @keyframes splash-tagline { 0% { opacity:0; transform: translateY(10px); } 100% { opacity:0.6; transform: translateY(0); } }
        @keyframes splash-line { 0% { width: 0; } 100% { width: 80px; } }
        @keyframes splash-dots { 0%,20% { opacity:0; } 30% { opacity:1; } 60% { opacity:1; } 70%,100% { opacity:0; } }
        @keyframes splash-glow { 0%,100% { box-shadow: 0 0 40px rgba(14,165,233,0.2), 0 0 80px rgba(14,165,233,0.08); }
          50% { box-shadow: 0 0 60px rgba(14,165,233,0.35), 0 0 120px rgba(14,165,233,0.12); } }
        @keyframes splash-fade-out { 0% { opacity:1; } 100% { opacity:0; pointer-events:none; } }
        @keyframes splash-particles { 0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-120px) scale(0); opacity: 0; } }
        .splash-wrap { animation: splash-fade-out 0.8s ease 3s forwards; }
      `}</style>

      {/* Ambient light */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 60%, rgba(14,165,233,0.06) 0%, transparent 60%), radial-gradient(ellipse at 50% 40%, rgba(251,191,36,0.03) 0%, transparent 50%)" }} />

      {/* Animated waves at bottom */}
      <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", height:"320px", opacity:0.12 }} viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#0ea5e9" d="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z;M0,180 C320,120 640,220 960,140 C1120,110 1280,200 1440,170 L1440,320 L0,320 Z;M0,160 C320,220 640,100 960,160 C1120,190 1280,130 1440,160 L1440,320 L0,320 Z" />
        </path>
        <path fill="#0284c7" opacity="0.6" d="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="7s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z;M0,190 C360,240 720,160 1080,210 C1260,230 1350,180 1440,205 L1440,320 L0,320 Z;M0,200 C360,160 720,240 1080,190 C1260,170 1350,220 1440,200 L1440,320 L0,320 Z" />
        </path>
        <path fill="#075985" opacity="0.4" d="M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z">
          <animate attributeName="d" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
            values="M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z;M0,235 C400,260 800,220 1200,245 C1320,255 1380,230 1440,242 L1440,320 L0,320 Z;M0,240 C400,220 800,260 1200,235 C1320,225 1380,250 1440,240 L1440,320 L0,320 Z" />
        </path>
      </svg>

      {/* Floating particles */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position:"absolute",
            left: `${8 + (i * 7.5)}%`,
            bottom: `${10 + (i % 3) * 15}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(14,165,233,0.5)" : "rgba(251,191,36,0.4)",
            animation: `splash-particles ${3 + (i % 4)}s ease-in-out ${0.5 + i * 0.3}s infinite`,
          }} />
        ))}
      </div>

      {/* Center content */}
      <div className="splash-wrap" style={{ textAlign:"center", position:"relative", zIndex:2 }}>
        {/* Logo */}
        <div style={{
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #0284c7, #075985)",
          display: "grid", placeItems: "center",
          margin: "0 auto 28px",
          fontSize: 40, fontWeight: 700, color: "#fff",
          animation: "splash-logo-reveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both, splash-glow 3s ease-in-out infinite",
        }}>J</div>

        {/* Brand name */}
        <div style={{
          fontSize: 44, fontWeight: 300, textTransform: "uppercase", color: "#e0f2fe",
          animation: "splash-text-reveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both",
          letterSpacing: 8,
        }}>JADRAN</div>

        {/* Decorative line */}
        <div style={{
          height: 1, background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(251,191,36,0.3), transparent)",
          margin: "16px auto",
          animation: "splash-line 1s cubic-bezier(0.16, 1, 0.3, 1) 1.2s both",
        }} />

        {/* Tagline */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 14, fontWeight: 300, textTransform: "uppercase", letterSpacing: 4,
          color: "rgba(14,165,233,0.7)",
          animation: "splash-tagline 0.8s ease 1.6s both",
        }}>{t("tagline",lang)}</div>

        {/* Loading dots */}
        <div style={{ display:"flex", justifyContent:"center", gap: 6, marginTop: 32 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "rgba(14,165,233,0.5)",
              animation: `splash-dots 1.5s ease ${1.8 + i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        {/* Powered by */}
        <div style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase",
          marginTop: 40,
          animation: "splash-tagline 0.6s ease 2.2s both",
        }}>SIAL Consulting d.o.o. · jadran.ai</div>
      </div>

      {/* Skip button */}
      <button onClick={() => setSplash(false)} style={{
        position:"absolute", bottom: 40, fontFamily:"'Outfit',sans-serif",
        background:"none", border:"1px solid rgba(186,230,253,0.1)", borderRadius: 20,
        color:"rgba(186,230,253,0.3)", fontSize: 11, padding:"8px 20px", cursor:"pointer",
        letterSpacing: 2, textTransform:"uppercase", transition:"all 0.3s",
        animation: "splash-tagline 0.5s ease 2.5s both",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)"; e.currentTarget.style.color = "rgba(14,165,233,0.5)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(186,230,253,0.1)"; e.currentTarget.style.color = "rgba(186,230,253,0.3)"; }}
      >{t("skipBtn",lang)}</button>
    </div>
  );
  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: `linear-gradient(160deg, ${C.bg} 0%, ${C.deep || C.bg} 50%, ${C.sky || C.bg} 100%)`, color: C.text, minHeight: "100dvh", position: "relative", paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {fonts}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(14,165,233,0.15); } 50% { box-shadow: 0 0 40px rgba(14,165,233,0.3); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes wave-move { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scale-in { from { opacity:0; transform: scale(0.9); } to { opacity:1; transform: scale(1); } }
        @keyframes slide-up { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
        @keyframes check-pop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }

        .jadran-ambient {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background: 
            radial-gradient(ellipse at 20% 10%, rgba(14,165,233,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(14,165,233,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.03) 0%, transparent 70%);
        }
        .jadran-ambient::before {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 300px;
          background: linear-gradient(to top, rgba(10,22,40,0.95), transparent);
        }
        .jadran-ambient::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, rgba(14,165,233,0.5), rgba(6,182,212,0.3), transparent);
          background-size: 200% 100%;
          animation: gradient-shift 8s ease infinite;
        }

        /* Wave decoration */
        .wave-deco { position: fixed; bottom: -2px; left: 0; width: 200%; height: 60px; opacity: 0.03; pointer-events: none; z-index: 1;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 60'%3E%3Cpath fill='%230ea5e9' d='M0,30 C360,60 720,0 1080,30 C1260,45 1350,15 1440,30 L1440,60 L0,60 Z'/%3E%3C/svg%3E") repeat-x;
          animation: wave-move 12s linear infinite;
        }

        /* Grain texture */
        .grain { position: fixed; inset: 0; opacity: 0.018; pointer-events: none; z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* ── iOS / Android universal fixes ───────────────────────────────────── */
        * { -webkit-tap-highlight-color: transparent !important; }
        html { overscroll-behavior: none; }
        body { overscroll-behavior: none; -webkit-overflow-scrolling: touch; }

        /* Prevent 300ms tap delay on all interactive elements */
        button, a, [role="button"], input, select, textarea, label {
          touch-action: manipulation;
        }

        /* Prevent iOS auto-zoom on input focus (requires font-size ≥ 16px) */
        input, select, textarea {
          font-size: 16px !important;
          -webkit-text-size-adjust: 100%;
        }

        /* 100dvh — handles iOS Safari address-bar show/hide correctly.
           Fallback to 100vh for browsers that don't support dvh (iOS < 15.4) */
        .dvh { min-height: 100vh; min-height: 100dvh; }
        .dvh-exact { height: 100vh; height: 100dvh; }

        /* Momentum scrolling on all overflow containers */
        [style*="overflow-y: auto"], [style*="overflowY"] {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
        }
        /* ─────────────────────────────────────────────────────────────────────── */

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.4); }

        /* Selection */
        ::selection { background: rgba(14,165,233,0.3); color: #f0f9ff; }

        /* Animated cards */
        .anim-card { opacity: 1; }
        /* tiles render instantly — no staggered animation */

        /* Button effects — disable hover transform on touch devices to prevent stuck states */
        button { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        @media (hover: hover) {
          button:hover { transform: translateY(-1px); }
        }
        button:active { transform: translateY(0) scale(0.98) !important; }

        /* Card hover — only on pointer devices */
        .glass { transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        @media (hover: hover) {
          .glass:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.05) !important; }
        }

        /* Primary button glow */
        .btn-glow { position: relative; overflow: hidden; }
        .btn-glow::before { content: ''; position: absolute; inset: -2px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(14,165,233,0.4), rgba(2,132,199,0.2)); filter: blur(8px); opacity: 0; transition: opacity 0.3s; z-index: -1; }
        .btn-glow:hover::before { opacity: 1; }

        /* Card glass effect */
        .glass { backdrop-filter: blur(12px) saturate(1.4); -webkit-backdrop-filter: blur(12px) saturate(1.4); }

        /* Shimmer loading */
        .shimmer { background: linear-gradient(90deg, transparent 30%, rgba(14,165,233,0.06) 50%, transparent 70%);
          background-size: 200% 100%; animation: shimmer 2s ease infinite; }

        /* Overlay entrance */
        .overlay-enter { animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Phase dot active pulse */
        .phase-active { animation: pulse-glow 3s ease infinite; }

        /* Premium badge shimmer */
        .premium-shimmer { background: linear-gradient(90deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.2) 50%, rgba(251,191,36,0.08) 100%);
          background-size: 200% 100%; animation: shimmer 3s ease infinite; }

        /* Float animation for emojis */
        .emoji-float { animation: float 4s ease-in-out infinite; display: inline-block; }

        /* Smooth page transitions */
        .page-enter { animation: slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Check animation for booking confirm */
        .check-anim { animation: check-pop 0.5s cubic-bezier(0.4, 0, 0.2, 1); }

        /* Touch-friendly sizing */
        @media (max-width: 480px) {
          .page-enter { padding: 0 !important; }
          button { min-height: 44px; }
          .trip-btn { width: 100% !important; box-sizing: border-box; }
          .map-frame { height: 250px !important; }
          .lang-btn { padding: 10px 12px !important; min-width: 44px; min-height: 44px; }
          .route-bar { flex-wrap: wrap; gap: 8px; }
          .route-bar button { flex: 1; }
          .phase-label { letter-spacing: 1px !important; font-size: 9px !important; }
        }
        @media (max-width: 375px) {
          .phase-label { letter-spacing: 0.5px !important; font-size: 8px !important; }
        }
        @media (min-width: 768px) and (max-width: 1366px) and (hover: none) {
          button { min-height: 48px; }
        }

        /* Smooth font rendering */
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
      <div className="grain" />
      <div className="wave-deco" />
      <div className="jadran-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "0 clamp(12px, 3vw, 24px)" }} className="page-enter">
        {/* Header — premium hotel lobby */}
        <div style={{ padding: "20px 0 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: `linear-gradient(135deg,${C.accent},#0284c7)`, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, color: "#fff", boxShadow: "0 4px 16px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}>J</div>
              <div>
                <div style={{ ...hf, fontSize: 22, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: C.text, lineHeight: 1 }}>Jadran</div>
                <div style={{ ...dm, fontSize: 9, color: C.accent, letterSpacing: 3, marginTop: 2, fontWeight: 500 }}>VODIČ</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {premium && <span className="premium-shimmer" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 14px",borderRadius:20,fontSize:10,fontFamily:"'Outfit',sans-serif",color:C.gold,letterSpacing:1.5,fontWeight:600,border:`1px solid rgba(245,158,11,0.12)`}}>⭐ PREMIUM</span>}
              <div style={{display:"flex",gap:2,background:"rgba(12,28,50,0.5)",borderRadius:14,padding:3,border:`1px solid ${C.bord}`,backdropFilter:"blur(8px)"}}>
                <button onClick={() => setLangOpen(!langOpen)} className="lang-btn"
                  style={{...dm,padding:"5px 7px",background:C.acDim,border:`1px solid rgba(14,165,233,0.15)`,borderRadius:11,cursor:"pointer",fontSize:15,lineHeight:1}}
                  title="Jezik">{LANGS.find(l => l.code === lang)?.flag || "🇭🇷"}</button>
                {langOpen && LANGS.filter(lg => lg.code !== lang).map(lg => (
                  <button key={lg.code} onClick={() => { setLang(lg.code); saveDelta({ lang: lg.code }); setLangOpen(false); }} className="lang-btn"
                    style={{...dm,padding:"5px 7px",background:"transparent",border:"1px solid transparent",borderRadius:11,cursor:"pointer",fontSize:15,lineHeight:1,transition:"all 0.25s",animation:"fadeIn 0.2s both"}}
                    title={lg.name}>{lg.flag}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Guest bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 14, padding: "12px 16px", background: C.sand, borderRadius: 16, border: `1px solid rgba(245,158,11,0.06)` }}>
            <div style={{ ...dm, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{G.flag}</span>
              <div>
                {(() => { try { const d = JSON.parse(localStorage.getItem("jadran_delta_context") || "{}"); const f = transitFromUrl || d.from; const t = transitToUrl || d.destination?.city; const s = transitSegUrl || d.segment; return f && t ? (<><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{(SEG_ICON[s] || "🚗")} {f} → {t}</div><div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>Sloboda ceste i mora</div></>) : (<><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{G.name}</div><div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>{G.accommodation}</div></>); } catch { return (<><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{G.name}</div><div style={{ fontSize: 11, color: C.mut, marginTop: 1 }}>{G.accommodation}</div></>); } })()}
              </div>
            </div>
            {G.arrival && !transitFromUrl && <div style={{ ...dm, fontSize: 11, color: C.mut, textAlign: "right" }}>
              {new Date(G.arrival).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"short"})} – {new Date(G.departure).toLocaleDateString(dateLocale || "hr-HR", {day:"numeric",month:"short"})}
            </div>}
          </div>
          {/* Warm divider */}
          <div style={{ height: 1, marginTop: 16, background: `linear-gradient(90deg, transparent, rgba(245,158,11,0.12) 30%, rgba(14,165,233,0.08) 70%, transparent)` }} />
          {/* Demo mode banner */}
          {!guestProfile && !transitFromUrl && <div style={{ ...dm, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, padding: "10px 16px", background: "rgba(245,158,11,0.06)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.1)" }}>
            <span style={{ fontSize: 12, color: C.warm }}>🎭 Primjer prikaza — kreirajte vlastiti profil</span>
            <a href="/host" style={{ ...dm, fontSize: 11, color: C.accent, textDecoration: "none", fontWeight: 600 }}>Host Panel →</a>
          </div>}
        </div>

        {/* Alerts Bar — hidden on transit (merged into Puls Jadrana) */}
        {!(phase === "pre" && subScreen === "transit") && <AlertsBar />}

        {/* Phase Nav */}
        <PhaseNav />

        {/* Content */}
        {phase === "pre" && <div className="page-enter">{PreTrip()}</div>}
        {phase === "kiosk" && <div key={subScreen}>{Kiosk()}</div>}
        {phase === "post" && <div className="page-enter">{PostStay()}</div>}

        <div style={{ ...dm, textAlign: "center", padding: "20px 0 28px", fontSize: 10, color: "rgba(100,116,139,0.3)", letterSpacing: 2, textTransform: "uppercase" }}>
          JADRAN · SIAL Consulting d.o.o.
        </div>
      </div>

      {/* Overlays */}
      {showPaywall && <Paywall />}
      {showConfirm && <BookConfirm />}

      {/* ── Inline Street View overlay ── */}
      {svModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", background: "#000" }}
          onClick={() => setSvModal(null)}>
          {/* Header bar */}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(10,22,40,0.95)", borderBottom: "1px solid rgba(14,165,233,0.1)", flexShrink: 0 }}>
            <div style={{ ...dm, fontSize: 14, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "calc(100% - 120px)" }}>
              🌍 {svModal.name}
            </div>
            <button onClick={() => setSvModal(null)}
              style={{ ...dm, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.bord}`, borderRadius: 10, color: C.mut, fontSize: 13, padding: "5px 12px", cursor: "pointer" }}>
              ✕ {({hr:"Zatvori",de:"Schließen",en:"Close",it:"Chiudi"})[lang]||"Zatvori"}
            </button>
          </div>

          {/* Street View iframe — fills remaining height */}
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, position: "relative" }}>
            <iframe
              src={`https://www.google.com/maps/embed/v1/streetview?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&location=${svModal.lat},${svModal.lng}&fov=80&pitch=0`}
              title={`Street View — ${svModal.name}`}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              allow="fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Bottom navigation bar */}
          <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 10, padding: "12px 16px", background: "rgba(10,22,40,0.95)", borderTop: "1px solid rgba(14,165,233,0.1)", flexShrink: 0 }}>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${svModal.lat},${svModal.lng}&travelmode=walking`, "_blank")}
              style={{ ...dm, flex: 1, padding: "13px", background: C.acDim, border: `1px solid rgba(14,165,233,0.15)`, borderRadius: 14, color: C.accent, fontSize: 14, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🚶 {({hr:"Navigiraj pješice",de:"Zu Fuß navigieren",en:"Walk there",it:"A piedi"})[lang]||"Navigiraj pješice"}
            </button>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${svModal.lat},${svModal.lng}&travelmode=driving`, "_blank")}
              style={{ ...dm, padding: "13px 18px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14, color: C.gold, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>
              🚗
            </button>
          </div>
        </div>
      )}

      {/* Gem detail */}
      {selectedGem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedGem(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 500, width: "100%", padding: 32, border: `1px solid rgba(251,191,36,0.12)` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedGem.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedGem.name}</div>
            <div style={{ ...dm, fontSize: 15, color: C.mut, lineHeight: 1.8, marginBottom: 20 }}>{typeof selectedGem.desc === "object" ? (selectedGem.desc[lang] || selectedGem.desc.hr) : selectedGem.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[{ l: "Najbolje doba", v: selectedGem.best }, { l: "Težina", v: selectedGem.diff }].map((x, i) => (
                <div key={i} style={{ padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut }}>{x.l}</div>
                  <div style={{ ...dm, fontSize: 14, fontWeight: 600 }}>{typeof x.v === "object" ? (x.v[lang] || x.v.hr || "") : (x.v || "")}</div>
                </div>
              ))}
            </div>
            <Card glow style={{ background: C.goDim, borderColor: "rgba(251,191,36,0.12)" }}>
              <div style={{ ...dm, fontSize: 11, color: C.gold, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💡 LOCALS TIP</div>
              <div style={{ ...dm, fontSize: 14, lineHeight: 1.6 }}>{typeof selectedGem.tip === "object" ? (selectedGem.tip[lang] || selectedGem.tip.hr) : selectedGem.tip}</div>
            </Card>
            {selectedGem.lat && (() => {
              const gmKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
              const svSrc = gmKey
                ? `https://www.google.com/maps/embed/v1/streetview?key=${gmKey}&location=${selectedGem.lat},${selectedGem.lng}&fov=80&pitch=0`
                : null;
              return (
                <>
                  {/* Street View — tap header to expand fullscreen */}
                  <div style={{ borderRadius: 14, overflow: "hidden", marginTop: 16, marginBottom: 4, border: `1px solid rgba(14,165,233,0.12)` }}>
                    <button onClick={() => setSvModal({ lat: selectedGem.lat, lng: selectedGem.lng, name: selectedGem.name })}
                      style={{ width: "100%", padding: "7px 12px", background: "rgba(14,165,233,0.06)", border: "none", borderBottom: "1px solid rgba(14,165,233,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", ...dm }}>
                      <span style={{ fontSize: 11, color: C.accent, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🌍</span>
                        <span>{lang === "de" || lang === "at" ? "Umgebung ansehen — tippen zum Vergrößern" : lang === "en" ? "Look around — tap to expand" : lang === "it" ? "Guarda intorno — tocca per espandere" : "Pogledaj okolo — tapni za puni ekran"}</span>
                      </span>
                      <span style={{ fontSize: 11, color: C.mut }}>⛶</span>
                    </button>
                    {svSrc ? (
                      <div style={{ position: "relative" }}>
                        <iframe
                          src={svSrc}
                          title={`Street View — ${selectedGem.name}`}
                          style={{ width: "100%", height: 220, border: "none", display: "block" }}
                          loading="lazy"
                          allow="fullscreen"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <button onClick={() => setSvModal({ lat: selectedGem.lat, lng: selectedGem.lng, name: selectedGem.name })}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: "rgba(14,165,233,0.04)", color: C.accent, fontSize: 13, border: "none", cursor: "pointer", ...dm }}>
                        🌍 {lang === "de" || lang === "at" ? "In Street View öffnen" : lang === "en" ? "Open Street View" : lang === "it" ? "Apri Street View" : "Otvori Street View"}
                      </button>
                    )}
                  </div>
                  {/* Navigate buttons — walking primary, driving secondary */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedGem.lat},${selectedGem.lng}&travelmode=walking`, "_blank")}
                      style={{...dm,flex:1,padding:"13px",background:C.acDim,border:`1px solid rgba(14,165,233,0.15)`,borderRadius:14,color:C.accent,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontWeight:600}}>
                      🚶 {({hr:"Vodi me pješice",de:"Zu Fuß navigieren",en:"Walk there",it:"A piedi"})[lang]||"Vodi me pješice"}
                    </button>
                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedGem.lat},${selectedGem.lng}&travelmode=driving`, "_blank")}
                      style={{...dm,padding:"13px 16px",background:"rgba(251,191,36,0.06)",border:`1px solid rgba(251,191,36,0.15)`,borderRadius:14,color:C.gold,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      🚗
                    </button>
                  </div>
                </>
              );
            })()}
            <Btn style={{ width: "100%", marginTop: 8 }} onClick={() => setSelectedGem(null)}>{t("back",lang)}</Btn>
          </div>
        </div>
      )}

      {/* Viator Activity Modal */}
      {selectedViatorAct && (() => {
        const act = selectedViatorAct;
        const IMGS = act.images?.length ? act.images : [];
        const imgIdx = viatorImgIdx;
        const setImgIdx = setViatorImgIdx;
        const totalPrice = act.price ? (act.price * viatorPersons).toFixed(2) : "—";
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.92)", zIndex: 200, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px" }}
            onClick={() => setSelectedViatorAct(null)}>
            <div onClick={e => e.stopPropagation()} className="overlay-enter glass"
              style={{ background: "rgba(12,28,50,0.96)", borderRadius: 24, maxWidth: 520, width: "100%", border: `1px solid ${C.bord}`, overflow: "hidden" }}>
              {/* Photo gallery */}
              <div style={{ position: "relative", height: 240, background: "linear-gradient(135deg,rgba(14,165,233,0.1),rgba(34,197,94,0.08))" }}>
                {IMGS.length > 0
                  ? <img src={IMGS[imgIdx % IMGS.length]} alt={act.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 72 }}>🏖️</div>}
                {IMGS.length > 1 && <>
                  <button onClick={e => { e.stopPropagation(); setImgIdx(p => Math.max(0, p - 1)); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center" }}>‹</button>
                  <button onClick={e => { e.stopPropagation(); setImgIdx(p => (p + 1) % IMGS.length); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center" }}>›</button>
                  <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                    {IMGS.map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === imgIdx % IMGS.length ? "#fff" : "rgba(255,255,255,0.4)" }} />)}
                  </div>
                </>}
                <button onClick={() => setSelectedViatorAct(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center" }}>✕</button>
              </div>

              <div style={{ padding: "20px 24px 28px" }}>
                <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 8, lineHeight: 1.3 }}>{act.title}</div>
                <div style={{ ...dm, display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: C.mut }}>
                  {act.rating && <span style={{ color: "#facc15" }}>★ {act.rating.toFixed(1)} <span style={{ color: C.mut }}>({act.reviewCount > 1000 ? `${(act.reviewCount/1000).toFixed(1)}k` : act.reviewCount})</span></span>}
                  <span>⏱ {act.duration}</span>
                  {act.category && <span style={{ color: "#22c55e" }}>{act.category}</span>}
                </div>
                {act.description && <div style={{ ...dm, fontSize: 14, color: C.mut, lineHeight: 1.7, marginBottom: 20 }}>{act.description}</div>}

                {/* Date picker */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ ...dm, fontSize: 11, color: C.mut, display: "block", marginBottom: 6, letterSpacing: 1 }}>DATUM AKTIVNOSTI</label>
                  <input type="date" value={viatorBookDate} min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setViatorBookDate(e.target.value)}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Persons stepper */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "14px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.bord}` }}>
                  <div style={{ ...dm, fontSize: 14 }}>Broj osoba</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={() => setViatorPersons(p => Math.max(1, p - 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center" }}>−</button>
                    <span style={{ fontSize: 20, fontWeight: 600, minWidth: 24, textAlign: "center" }}>{viatorPersons}</span>
                    <button onClick={() => setViatorPersons(p => Math.min(20, p + 1))} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center" }}>+</button>
                  </div>
                </div>

                {/* Total price */}
                <div style={{ textAlign: "center", padding: "14px", borderRadius: 14, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", marginBottom: 20 }}>
                  <div style={{ ...dm, fontSize: 11, color: C.mut, marginBottom: 4 }}>{act.price}€ × {viatorPersons} osoba</div>
                  <div style={{ fontSize: 32, fontWeight: 300, color: "#22c55e" }}>{totalPrice}€</div>
                  <div style={{ ...dm, fontSize: 10, color: C.mut, marginTop: 4 }}>Uključuje JADRAN uslugu · Plaćanje karticom</div>
                </div>

                <button onClick={() => startViatorBooking(act, viatorBookDate, viatorPersons)} disabled={payLoading || !viatorBookDate}
                  style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: payLoading ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 16, fontWeight: 700, cursor: payLoading || !viatorBookDate ? "not-allowed" : "pointer", opacity: viatorBookDate ? 1 : 0.5, ...dm, transition: "all 0.2s" }}>
                  {payLoading ? "⏳ Preusmjeravam…" : `🎟 Rezerviraj — ${totalPrice}€`}
                </button>
                <Btn style={{ width: "100%", marginTop: 10 }} onClick={() => setSelectedViatorAct(null)}>{t("back",lang)}</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Experience booking */}
      {selectedExp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(5,14,30,0.88)", zIndex: 200, display: "grid", placeItems: "center", padding: 24 }} onClick={() => setSelectedExp(null)}>
          <div onClick={e => e.stopPropagation()} className="overlay-enter glass" style={{ background: "rgba(12,28,50,0.92)", borderRadius: 24, maxWidth: 440, width: "100%", padding: 32, border: `1px solid ${C.bord}` }}>
            <div style={{ fontSize: 52, textAlign: "center", marginBottom: 12 }}>{selectedExp.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 400, textAlign: "center", marginBottom: 16 }}>{selectedExp.name}</div>
            <div style={{ ...dm, display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, fontSize: 13, color: C.mut }}>
              <span>⏱ {selectedExp.dur}</span><span>⭐ {selectedExp.rating}</span>
            </div>
            <Card style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ ...dm, fontSize: 12, color: C.mut, marginBottom: 4 }}>{t("perPerson",lang)}</div>
              <div style={{ fontSize: 36, fontWeight: 300, color: C.accent }}>~{selectedExp.price}€</div>
              {G.kids > 0 && <div style={{ ...dm, fontSize: 13, color: C.gold, marginTop: 4 }}>{t("familyPrice",lang)}: ~{selectedExp.price * 2 + Math.round(selectedExp.price * 0.5 * 2)}€</div>}
            </Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {selectedExp.gyg && <a href={selectedExp.gyg} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#FF5533,#FF7744)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(255,85,51,0.3)" }}>{t("bookVia",lang)} GetYourGuide →</a>}
              {selectedExp.viator && <a href={selectedExp.viator} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "14px 20px", background: "linear-gradient(135deg,#2B8B4B,#3DA65E)", borderRadius: 14, color: "#fff", fontSize: 16, fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 600, textAlign: "center", textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 4px 16px rgba(43,139,75,0.3)" }}>{t("bookVia",lang)} Viator →</a>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1 }} onClick={() => setSelectedExp(null)}>{t("back",lang)}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
