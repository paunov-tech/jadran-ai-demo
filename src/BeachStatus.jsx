// BeachStatus.jsx — Real-time per-beach capacity for Rab island
// Data: /api/sense?city=Rab (YOLO real + Open-Meteo weather + Windy webcams)
// Fallback: time-of-day simulation

import { useState, useEffect } from "react";

const BEACHES = [
  { id: "rajska",    name: "Rajska plaža",   emoji: "🏖️", type: "pješčana",  cap: 2000, lat: 44.7612, lng: 14.6814, fac: ["🚿","🏄","🍴","🅿️"], color: "#0ea5e9", note: { hr: "Najdulja pješčana plaža na Jadranu", en: "Longest sandy beach on the Adriatic", de: "Längster Sandstrand der Adria", it: "La più lunga spiaggia sabbiosa dell'Adriatico" } },
  { id: "livacina",  name: "Livačina",        emoji: "🪨", type: "šljunčana", cap: 600,  lat: 44.7550, lng: 14.6950, fac: ["🚿","🏊"], color: "#38bdf8", note: { hr: "Mirna uvala, idealna za obitelji", en: "Quiet cove, ideal for families", de: "Ruhige Bucht, ideal für Familien", it: "Baia tranquilla, ideale per famiglie" } },
  { id: "sahara",    name: "Sahara",          emoji: "🏝️", type: "pješčana",  cap: 1200, lat: 44.7498, lng: 14.6788, fac: ["🚿","🏄","🍴"], color: "#f59e0b", note: { hr: "Divlja plaža bez objekata", en: "Wild beach, no facilities", de: "Wilder Strand ohne Einrichtungen", it: "Spiaggia selvaggia, nessun servizio" } },
  { id: "suha-punta",name: "Suha Punta",     emoji: "⛵", type: "mješovita", cap: 400,  lat: 44.7460, lng: 14.6720, fac: ["🚿","⛵"], color: "#34d399", note: { hr: "Popularna s nautičarima", en: "Popular with sailors", de: "Beliebt bei Seglern", it: "Popolare tra i velisti" } },
  { id: "pudarica",  name: "Pudarica",        emoji: "🌊", type: "šljunčana", cap: 800,  lat: 44.7302, lng: 14.7288, fac: ["🚿","🍴","🅿️"], color: "#0ea5e9", note: { hr: "Šljunčana plaža s čistim morem", en: "Pebble beach with crystal clear water", de: "Kiesstrand mit kristallklarem Wasser", it: "Spiaggia di ciottoli con acque limpide" } },
  { id: "mel",       name: "Mel",             emoji: "🌿", type: "šljunčana", cap: 300,  lat: 44.7350, lng: 14.7180, fac: ["🚿"], color: "#22c55e", note: { hr: "Skrivena plaža okružena borovima", en: "Hidden beach surrounded by pines", de: "Versteckter Strand umgeben von Pinien", it: "Spiaggia nascosta circondata da pini" } },
  { id: "sv-ivan",   name: "Sveti Ivan",      emoji: "⛪", type: "kamenita",  cap: 200,  lat: 44.7588, lng: 14.7452, fac: ["🚿"], color: "#a78bfa", note: { hr: "Romantična plaža ispod crkvice", en: "Romantic beach below a small church", de: "Romantischer Strand unter einer kleinen Kirche", it: "Spiaggia romantica sotto una piccola chiesa" } },
  { id: "barbat",    name: "Barbat",          emoji: "🏘️", type: "šljunčana", cap: 500,  lat: 44.7158, lng: 14.7078, fac: ["🚿","🍴","🅿️"], color: "#fb923c", note: { hr: "Mirna obiteljska plaža u zaseoku", en: "Quiet family beach in a hamlet", de: "Ruhiger Familienstrand im Weiler", it: "Spiaggia tranquilla per famiglie nel borgo" } },
  { id: "frkanj",    name: "Frkanj",          emoji: "🌊", type: "šljunčana", cap: 600,  lat: 44.7650, lng: 14.7680, fac: ["🚿","🍴"], color: "#38bdf8", note: { hr: "Popularna kod lokalnog stanovništva", en: "Popular with locals", de: "Beliebt bei Einheimischen", it: "Popolare tra i locali" } },
  { id: "crnika",    name: "Crnika",          emoji: "🌲", type: "šljunčana", cap: 700,  lat: 44.7682, lng: 14.7520, fac: ["🚿","🏊","🅿️"], color: "#34d399", note: { hr: "Borova šuma do mora", en: "Pine forest to the sea", de: "Kiefernwald bis ans Meer", it: "Pineta fino al mare" } },
  { id: "banjol",    name: "Banjol",          emoji: "⚓", type: "šljunčana", cap: 450,  lat: 44.7720, lng: 14.7610, fac: ["🚿","🍴","🅿️"], color: "#0ea5e9", note: { hr: "U blizini luke, pogodna za sve", en: "Near the marina, suitable for all", de: "In der Nähe des Hafens, für alle geeignet", it: "Vicino al porto, adatta a tutti" } },
  { id: "podgrad",   name: "Podgrad",         emoji: "🏰", type: "kamenita",  cap: 250,  lat: 44.7580, lng: 14.8020, fac: ["🚿"], color: "#a78bfa", note: { hr: "Ispod starog kaštela, mirna luka", en: "Below the old castle, quiet cove", de: "Unter der alten Burg, ruhige Bucht", it: "Sotto il vecchio castello, baia tranquilla" } },
];

function estimateOccupancy(beach, hour) {
  const peakFactor = (() => {
    if (hour >= 10 && hour <= 14) return 0.85 + (beach.cap > 1000 ? 0.1 : 0);
    if (hour >= 15 && hour <= 17) return 0.55 + Math.random() * 0.15;
    if (hour >= 8 && hour < 10)   return 0.25 + Math.random() * 0.15;
    if (hour >= 18 && hour < 20)  return 0.20 + Math.random() * 0.10;
    return 0.05;
  })();
  const noise = ((beach.id.charCodeAt(0) + beach.id.charCodeAt(1)) % 20 - 10) / 100;
  return Math.max(0.02, Math.min(0.98, peakFactor + noise));
}

function OccupancyBar({ pct, color }) {
  const level = pct > 0.8 ? "🔴" : pct > 0.6 ? "🟡" : "🟢";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12 }}>{level}</span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ width: `${Math.round(pct * 100)}%`, height: "100%", borderRadius: 3,
          background: pct > 0.8 ? "#ef4444" : pct > 0.6 ? "#f59e0b" : "#22c55e",
          transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 32, textAlign: "right", fontFamily: "'Outfit',monospace" }}>{Math.round(pct * 100)}%</span>
    </div>
  );
}

// Get tourist's Rab Card from localStorage for check-in
function getStoredCard() {
  try {
    const room = localStorage.getItem("jadran_room") || "DEMO";
    const raw  = localStorage.getItem(`jadran_rab_card_${room}`);
    if (!raw) return null;
    const card = JSON.parse(raw);
    if (!card?.cardId || !card?.expiresAt) return null;
    if (new Date(card.expiresAt) < new Date()) return null;
    return card;
  } catch { return null; }
}

export default function BeachStatus({ lang = "hr", C, dm, hf }) {
  const [hour, setHour]       = useState(() => new Date().getHours());
  const [filter, setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [senseData, setSenseData] = useState(null);
  const [checkedIn, setCheckedIn] = useState({}); // beachId → true
  const [checkInMsg, setCheckInMsg] = useState(null); // { id, ok }

  useEffect(() => {
    const iv = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    fetch("/api/sense?city=Rab")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSenseData(d); })
      .catch(() => {});
  }, []);

  const T = {
    title:    { hr: "Status plaža — Rab", en: "Beach Status — Rab", de: "Strandstatus — Rab", it: "Stato spiagge — Rab" },
    sub:      { hr: "Procjena popunjenosti u realnom vremenu", en: "Real-time occupancy estimate", de: "Echtzeit-Belegungsschätzung", it: "Stima occupazione in tempo reale" },
    cap:      { hr: "maks. kapacitet", en: "max capacity", de: "max. Kapazität", it: "capacità max" },
    filters:  {
      all:    { hr: "Sve",     en: "All",    de: "Alle",    it: "Tutte" },
      free:   { hr: "Slobodne",en: "Free",   de: "Frei",    it: "Libere" },
      sandy:  { hr: "Pješčane",en: "Sandy",  de: "Sandige", it: "Sabbiose" },
      pebble: { hr: "Šljunak", en: "Pebble", de: "Kies",    it: "Ciottoli" },
    },
    navBtn:   { hr: "Navigiraj",  en: "Navigate",   de: "Navigation",  it: "Naviga" },
    checkIn:  { hr: "Prijava",    en: "Check-in",   de: "Einchecken",  it: "Check-in" },
    checked:  { hr: "Prijavljeni ✓", en: "Checked in ✓", de: "Eingecheckt ✓", it: "Fatto ✓" },
    noCard:   { hr: "Potrebna Rab Card", en: "Rab Card required", de: "Rab Card erforderlich", it: "Rab Card richiesta" },
    est:      { hr: "📊 Procjena bazirana na tipičnoj popunjenosti za ovo doba dana", en: "📊 Estimate based on typical occupancy for this time of day", de: "📊 Schätzung basierend auf typischer Belegung für diese Tageszeit", it: "📊 Stima basata sull'occupazione tipica per quest'ora del giorno" },
    webcams:  { hr: "Live webcami — Rab", en: "Live webcams — Rab", de: "Live-Webcams — Rab", it: "Webcam live — Rab" },
    liveData: { hr: "JADRAN SENSE™ LIVE", en: "JADRAN SENSE™ LIVE", de: "JADRAN SENSE™ LIVE", it: "JADRAN SENSE™ LIVE" },
  };

  const lv = k => T[k]?.[lang] || T[k]?.en || "";

  // Resolve occupancy: prefer YOLO (kvarner region busyness) over simulation
  const yoloRegion   = senseData?.beach?.occupancy_pct; // region-level %
  const isLive       = !!senseData && senseData.source === "yolo";
  const regionFactor = yoloRegion != null ? yoloRegion / 100 : null;

  const occupancies = BEACHES.map(b => {
    let occ;
    if (regionFactor != null) {
      // Scale simulation around live regional factor
      const simBase = estimateOccupancy(b, hour);
      occ = Math.max(0.02, Math.min(0.98, (regionFactor * 0.7) + (simBase * 0.3)));
    } else {
      occ = estimateOccupancy(b, hour);
    }
    return { ...b, occ };
  });

  const filtered = occupancies.filter(b => {
    if (filter === "free")   return b.occ < 0.6;
    if (filter === "sandy")  return b.type === "pješčana";
    if (filter === "pebble") return b.type === "šljunčana";
    return true;
  }).sort((a, b) => a.occ - b.occ);

  const webcams   = senseData?.webcams || [];
  const accentColor = C?.accent || "#0ea5e9";

  async function handleCheckIn(beach, e) {
    e.stopPropagation();
    const card = getStoredCard();
    if (!card) {
      setCheckInMsg({ id: beach.id, ok: false, msg: lv("noCard") });
      setTimeout(() => setCheckInMsg(null), 2500);
      return;
    }
    if (checkedIn[beach.id]) return; // already checked in
    try {
      const r = await fetch("/api/rab-card-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId:      card.cardId,
          partnerId:   beach.id,
          partnerName: beach.name,
          scanType:    "beach_checkin",
        }),
      });
      if (r.ok) {
        setCheckedIn(p => ({ ...p, [beach.id]: true }));
        setCheckInMsg({ id: beach.id, ok: true, msg: `✓ ${beach.name}` });
      } else {
        setCheckInMsg({ id: beach.id, ok: false, msg: "Greška" });
      }
    } catch {
      setCheckInMsg({ id: beach.id, ok: false, msg: "Greška mreže" });
    }
    setTimeout(() => setCheckInMsg(m => m?.id === beach.id ? null : m), 2500);
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
        <div style={{ fontSize: 48 }}>🏖️</div>
        <div style={{ ...(hf||{}), fontSize: 26, fontWeight: 400, marginTop: 8 }}>{lv("title")}</div>
        <div style={{ ...(dm||{}), fontSize: 13, color: C?.mut||"#94a3b8", marginTop: 4 }}>
          {lv("sub")}
          {isLive && (
            <span style={{ marginLeft: 8, fontSize: 9, background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "2px 7px", fontWeight: 700, letterSpacing: ".05em", verticalAlign: "middle" }}>
              {lv("liveData")}
            </span>
          )}
        </div>
      </div>

      {/* Webcam strip */}
      {webcams.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...(dm||{}), fontSize: 10, color: C?.mut||"#64748b", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
            📷 {lv("webcams")} ({webcams.length})
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {webcams.map(w => (
              <a key={w.id} href={w.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration: "none", flexShrink: 0 }}>
                {w.preview ? (
                  <div style={{ position: "relative", width: 110, height: 70 }}>
                    <img src={w.preview} alt={w.title}
                      style={{ width: 110, height: 70, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(14,165,233,0.2)", display: "block" }} />
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "rgba(6,15,30,0.78)", borderRadius: "0 0 7px 7px",
                      fontSize: 8, color: "#94a3b8", padding: "2px 5px",
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                    }}>{w.city || w.title}</div>
                  </div>
                ) : (
                  <div style={{
                    width: 110, height: 70, borderRadius: 8,
                    border: "1px solid rgba(14,165,233,0.15)",
                    background: "rgba(14,165,233,0.04)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 18 }}>📷</span>
                    <span style={{ fontSize: 8, color: "#475569", textAlign: "center", padding: "0 5px",
                      overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 100 }}>
                      {w.city || w.title}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(T.filters).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            ...(dm||{}), padding: "7px 16px", borderRadius: 20, fontSize: 12,
            background: filter === k ? accentColor : "rgba(255,255,255,0.05)",
            color: filter === k ? "#fff" : (C?.mut||"#94a3b8"),
            border: `1px solid ${filter === k ? accentColor : (C?.bord||"rgba(255,255,255,0.1)")}`,
            cursor: "pointer", fontWeight: filter === k ? 600 : 400, transition: "all 0.2s",
          }}>{v[lang]||v.en}</button>
        ))}
      </div>

      {/* Beach cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(beach => (
          <div key={beach.id}
            onClick={() => setSelected(selected?.id === beach.id ? null : beach)}
            style={{
              background: C?.card||"rgba(255,255,255,0.04)", borderRadius: 16, padding: "14px 16px",
              border: `1px solid ${selected?.id === beach.id ? beach.color + "50" : (C?.bord||"rgba(255,255,255,0.08)")}`,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: selected?.id === beach.id ? `0 4px 20px ${beach.color}18` : "none",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{beach.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...(dm||{}), fontWeight: 600, fontSize: 14, color: C?.text||"#e2e8f0" }}>{beach.name}</div>
                <div style={{ ...(dm||{}), fontSize: 11, color: C?.mut||"#94a3b8", marginTop: 1 }}>
                  {beach.type} · {beach.cap.toLocaleString()} {lv("cap")}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ ...(dm||{}), fontSize: 11, color: C?.mut||"#94a3b8" }}>{beach.fac.join(" ")}</span>
                {/* Check-in button */}
                <button
                  onClick={e => handleCheckIn(beach, e)}
                  style={{
                    fontSize: 9, padding: "3px 9px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    background: checkedIn[beach.id] ? "rgba(34,197,94,0.12)" : "rgba(14,165,233,0.08)",
                    border: `1px solid ${checkedIn[beach.id] ? "rgba(34,197,94,0.3)" : "rgba(14,165,233,0.2)"}`,
                    color: checkedIn[beach.id] ? "#86efac" : "#7dd3fc",
                    fontWeight: 600,
                  }}>
                  {checkedIn[beach.id] ? lv("checked") : lv("checkIn")}
                </button>
              </div>
            </div>
            <OccupancyBar pct={beach.occ} color={beach.color} />

            {/* Check-in feedback */}
            {checkInMsg?.id === beach.id && (
              <div style={{ marginTop: 8, fontSize: 11, color: checkInMsg.ok ? "#86efac" : "#fca5a5", textAlign: "center" }}>
                {checkInMsg.msg}
              </div>
            )}

            {/* Expanded detail */}
            {selected?.id === beach.id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}` }}>
                <div style={{ ...(dm||{}), fontSize: 13, color: C?.text||"#e2e8f0", lineHeight: 1.6, marginBottom: 12 }}>
                  {beach.note[lang]||beach.note.en}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${beach.lat},${beach.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ ...(dm||{}), display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: beach.color + "18", border: `1px solid ${beach.color}40`, color: beach.color, fontSize: 12, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}>
                    📍 {lv("navBtn")}
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ ...(dm||{}), fontSize: 11, color: C?.mut||"#64748b", marginTop: 20, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: `1px solid ${C?.bord||"rgba(255,255,255,0.06)"}`, textAlign: "center", lineHeight: 1.6 }}>
        {isLive
          ? `JADRAN SENSE™ · ${senseData?.note || "Live YOLO data"}`
          : lv("est")
        }
      </div>
    </div>
  );
}
