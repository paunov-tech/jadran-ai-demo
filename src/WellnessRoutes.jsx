// WellnessRoutes.jsx — Wellness & nature GPS routes for Rab island
// Forest bathing, hiking, cycling, kayaking, meditation walks

import { useState } from "react";

const ROUTES = [
  {
    id: "dundo-forest",
    name: { hr: "Šuma Dundo — Šetnja kroz miris borova", en: "Dundo Forest — Pine fragrance walk", de: "Wald Dundo — Spaziergang im Kiefernduft", it: "Foresta Dundo — Passeggiata nel profumo dei pini" },
    type: "forest",
    emoji: "🌲",
    color: "#22c55e",
    dist: "3.2 km",
    dur: { hr: "45–60 min", en: "45–60 min", de: "45–60 Min.", it: "45–60 min" },
    diff: { hr: "Lagano", en: "Easy", de: "Leicht", it: "Facile" },
    elev: "+40m",
    cat: { hr: "Šumska kupka · meditacija", en: "Forest bathing · meditation", de: "Waldbaden · Meditation", it: "Bagno forestale · meditazione" },
    start: { hr: "Parking Dundo, autocesta Rab–Lopar", en: "Dundo parking, Rab–Lopar highway", de: "Parkplatz Dundo, Rab–Lopar Schnellstraße", it: "Parcheggio Dundo, autostrada Rab–Lopar" },
    lat: 44.7820, lng: 14.7450,
    desc: { hr: "Stoljetna šuma alepskog bora — jedna od najstarijih šuma Mediterana. Fitoncidi borova djeluju terapeutski, smanjuju stres i jačaju imunitet. Idealno za jutarnji šetnju.", en: "Ancient Aleppo pine forest — one of the oldest forests in the Mediterranean. Pine phytoncides have therapeutic effects, reducing stress and boosting immunity. Ideal for a morning walk.", de: "Jahrhundertealter Aleppokiefernwald — einer der ältesten Wälder des Mittelmeers. Kiefernphytonzide wirken therapeutisch, reduzieren Stress und stärken das Immunsystem.", it: "Antica foresta di pini d'Aleppo — una delle più antiche del Mediterraneo. I fitonicidi dei pini hanno effetti terapeutici, riducendo lo stress e rafforzando l'immunità." },
    tags: ["🌲", "🧘", "🫁"],
  },
  {
    id: "kalifront",
    name: { hr: "Poluotok Kalifront — Ruta starih maslina", en: "Kalifront Peninsula — Ancient olive route", de: "Halbinsel Kalifront — Route alter Olivenbäume", it: "Penisola Kalifront — Percorso degli ulivi antichi" },
    type: "hiking",
    emoji: "🫒",
    color: "#84cc16",
    dist: "8.5 km",
    dur: { hr: "2.5–3 h", en: "2.5–3 h", de: "2,5–3 Std.", it: "2,5–3 ore" },
    diff: { hr: "Srednje", en: "Moderate", de: "Mittel", it: "Moderato" },
    elev: "+120m",
    cat: { hr: "Planinarenje · prirodni rezervat", en: "Hiking · nature reserve", de: "Wandern · Naturschutzgebiet", it: "Escursionismo · riserva naturale" },
    start: { hr: "Barbat, kod crkve sv. Andrije", en: "Barbat, near St. Andrew's church", de: "Barbat, bei der St.-Andreas-Kirche", it: "Barbat, vicino alla chiesa di Sant'Andrea" },
    lat: 44.7158, lng: 14.7100,
    desc: { hr: "Poluotok sa zaštićenim maslinjarima starim do 2000 godina. Ruta prolazi pored svetišta sv. Eufemije i pruža panoramski pogled na Kvarnerski zaljev. Povremeno prisutni mufloni.", en: "Peninsula with protected olive groves up to 2000 years old. The route passes by the St. Euphemia sanctuary and offers panoramic views over Kvarner Bay. Mouflon occasionally present.", de: "Halbinsel mit geschützten Olivenhainen bis zu 2000 Jahre alt. Die Route führt am Heiligtum der hl. Euphemia vorbei und bietet Panoramablick auf die Kvarner Bucht.", it: "Penisola con uliveti protetti fino a 2000 anni. Il percorso passa dal santuario di Sant'Eufemia e offre viste panoramiche sul golfo del Quarnero." },
    tags: ["🫒", "🦌", "🌊"],
  },
  {
    id: "glagolitic",
    name: { hr: "Glagoljičko hodočašće — Stari grad Rab", en: "Glagolitic pilgrimage — Rab Old Town", de: "Glagolitische Pilgerfahrt — Rab Altstadt", it: "Pellegrinaggio glagolitico — Rab centro storico" },
    type: "cultural",
    emoji: "🏛️",
    color: "#a78bfa",
    dist: "2.0 km",
    dur: { hr: "1–1.5 h", en: "1–1.5 h", de: "1–1,5 Std.", it: "1–1,5 ore" },
    diff: { hr: "Lagano", en: "Easy", de: "Leicht", it: "Facile" },
    elev: "+25m",
    cat: { hr: "Kulturna ruta · duhovnost", en: "Cultural route · spirituality", de: "Kulturroute · Spiritualität", it: "Percorso culturale · spiritualità" },
    start: { hr: "Gradska vrata, luka Rab", en: "City gate, Rab harbour", de: "Stadttor, Hafen Rab", it: "Porta della città, porto di Rab" },
    lat: 44.7560, lng: 14.7600,
    desc: { hr: "Prolaz kroz četiri zvonike: sv. Marije Velike, sv. Andrije, sv. Ivana Evanđeliste i sv. Justine. Glagoljica je ovdje živjela najdulje na svijetu. Meditativna šetnja kroz povijest.", en: "Walk past four bell towers: St. Mary the Great, St. Andrew, St. John the Evangelist and St. Justina. Glagolitic script survived here longest in the world. A meditative walk through history.", de: "Spaziergang an vier Glockentürmen vorbei: Hl. Maria die Große, Hl. Andreas, Johannes der Evangelist und Hl. Justina. Die glagolitische Schrift überlebte hier am längsten.", it: "Passeggiata davanti a quattro campanili. La scrittura glagolitica sopravvisse qui più a lungo al mondo. Una passeggiata meditativa attraverso la storia." },
    tags: ["🏛️", "🔔", "📜"],
  },
  {
    id: "lopar-sunset",
    name: { hr: "Rajska plaža — Meditativni zalazak sunca", en: "Rajska Beach — Meditative sunset", de: "Rajska Strand — Meditativer Sonnenuntergang", it: "Spiaggia Rajska — Tramonto meditativo" },
    type: "meditation",
    emoji: "🌅",
    color: "#f59e0b",
    dist: "1.5 km",
    dur: { hr: "30–45 min", en: "30–45 min", de: "30–45 Min.", it: "30–45 min" },
    diff: { hr: "Lagano", en: "Easy", de: "Leicht", it: "Facile" },
    elev: "+5m",
    cat: { hr: "Meditacija · mindfulness", en: "Meditation · mindfulness", de: "Meditation · Achtsamkeit", it: "Meditazione · mindfulness" },
    start: { hr: "Jug Rajske plaže, Lopar", en: "South end of Rajska beach, Lopar", de: "Südende des Strands Rajska, Lopar", it: "Estremità sud della spiaggia Rajska, Lopar" },
    lat: 44.8300, lng: 14.7200,
    desc: { hr: "Šetnja duž najdulje pješčane plaže Jadrana u večernjim satima. Zalazak sunca iza brda otoka Paga stvara nestvarnu zlatnu atmosferu. Popularna polazna točka za jutarnju jogu.", en: "Evening walk along the longest sandy beach on the Adriatic. Sunset behind the hills of Pag island creates an otherworldly golden atmosphere. Popular starting point for morning yoga.", de: "Abendspaziergang entlang des längsten Sandstrands der Adria. Sonnenuntergang hinter den Hügeln von Pag schafft eine unwirkliche goldene Atmosphäre.", it: "Passeggiata serale lungo la più lunga spiaggia sabbiosa dell'Adriatico. Il tramonto dietro le colline di Pag crea un'atmosfera dorata irreale." },
    tags: ["🌅", "🧘", "🏖️"],
  },
  {
    id: "bike-island",
    name: { hr: "Otočna biciklistička magistrala", en: "Island bicycle main route", de: "Insel-Fahrradfernstraße", it: "Percorso ciclabile principale dell'isola" },
    type: "cycling",
    emoji: "🚴",
    color: "#0ea5e9",
    dist: "42 km",
    dur: { hr: "3–4 h", en: "3–4 h", de: "3–4 Std.", it: "3–4 ore" },
    diff: { hr: "Teže", en: "Challenging", de: "Schwierig", it: "Impegnativo" },
    elev: "+480m",
    cat: { hr: "Biciklizam · avantura", en: "Cycling · adventure", de: "Radfahren · Abenteuer", it: "Ciclismo · avventura" },
    start: { hr: "Grad Rab, riva", en: "Rab town, promenade", de: "Rab-Stadt, Promenade", it: "Città di Rab, lungomare" },
    lat: 44.7560, lng: 14.7600,
    desc: { hr: "Kompletna tura oko otoka: Rab → Barbat → Supetarska Draga → Lopar → Mundanije → Kamporska draga → Rab. Prolaz kroz sve mikroklimatske zone — borove šume, maslinike, pješčane plaže.", en: "Complete island loop: Rab → Barbat → Supetarska Draga → Lopar → Mundanije → Kamporska draga → Rab. Passing through all microclimatic zones — pine forests, olive groves, sandy beaches.", de: "Komplette Inselrunde: Rab → Barbat → Supetarska Draga → Lopar → Mundanije → Kamporska Draga → Rab. Durch alle Mikroklimazonen.", it: "Giro completo dell'isola. Attraverso tutte le zone microclimatiche — foreste di pini, uliveti, spiagge sabbiose." },
    tags: ["🚴", "🌲", "🏖️"],
  },
  {
    id: "kayak-north",
    name: { hr: "Kajakaška ruta — Sjeverni otočić", en: "Kayak route — Northern islets", de: "Kajakroute — Nördliche Inselchen", it: "Percorso kayak — Isolotti settentrionali" },
    type: "kayak",
    emoji: "🛶",
    color: "#38bdf8",
    dist: "12 km",
    dur: { hr: "3–4 h", en: "3–4 h", de: "3–4 Std.", it: "3–4 ore" },
    diff: { hr: "Srednje", en: "Moderate", de: "Mittel", it: "Moderato" },
    elev: "—",
    cat: { hr: "Kajak · more", en: "Kayak · sea", de: "Kajak · Meer", it: "Kayak · mare" },
    start: { hr: "Uvala Supetarska Draga", en: "Supetarska Draga cove", de: "Bucht Supetarska Draga", it: "Baia di Supetarska Draga" },
    lat: 44.7965, lng: 14.7180,
    desc: { hr: "Ruta kroz kristalno čiste uvale sjevernog Raba. Obilazak nenaseljenih otočića sv. Grgura i Dolin. Ronilačke točke s bogato morskim životom. Iznajmljivanje kajaka dostupno.", en: "Route through crystal clear coves of northern Rab. Visit uninhabited islets of St. Grgur and Dolin. Snorkeling spots with rich marine life. Kayak rental available.", de: "Route durch kristallklare Buchten im Nordteil Rabs. Besuch unbewohnter Inselchen St. Grgur und Dolin. Schnorchelstellen mit reichem Meeresleben.", it: "Percorso attraverso baie cristalline del Rab settentrionale. Visita agli isolotti disabitati di San Gregorio e Dolin. Spot snorkeling con ricca vita marina." },
    tags: ["🛶", "🐠", "🏝️"],
  },
  {
    id: "kamporska",
    name: { hr: "Kamporska draga — Šetnja dolinom", en: "Kamporska draga — Valley walk", de: "Kamporska Draga — Talwanderung", it: "Kamporska draga — Passeggiata nella valle" },
    type: "hiking",
    emoji: "🌿",
    color: "#34d399",
    dist: "5.5 km",
    dur: { hr: "1.5–2 h", en: "1.5–2 h", de: "1,5–2 Std.", it: "1,5–2 ore" },
    diff: { hr: "Lagano", en: "Easy", de: "Leicht", it: "Facile" },
    elev: "+60m",
    cat: { hr: "Šetnja · priroda · ptičarstvo", en: "Walking · nature · birdwatching", de: "Spaziergang · Natur · Vogelbeobachtung", it: "Passeggiata · natura · birdwatching" },
    start: { hr: "Kampor, groblje partizana", en: "Kampor, partisan cemetery", de: "Kampor, Partisanenfriedhof", it: "Kampor, cimitero partigiano" },
    lat: 44.7760, lng: 14.7080,
    desc: { hr: "Mirna šetnja kroz Kamporsku dragu — plodnu uvalu s vinogradima, maslinicima i povrtnjacima. Bogate zajednice ptica. Uz rutu: crkva sv. Euphemije iz 14. st.", en: "Peaceful walk through Kamporska draga — a fertile cove with vineyards, olive groves and vegetable gardens. Rich bird communities. Along the route: St. Euphemia church from the 14th century.", de: "Ruhiger Spaziergang durch Kamporska Draga — fruchtbare Bucht mit Weinbergen, Olivenhainen und Gemüsegärten.", it: "Passeggiata tranquilla attraverso la Kamporska draga — una baia fertile con vigneti, uliveti e orti. Comunità di uccelli ricche." },
    tags: ["🌿", "🐦", "🍇"],
  },
  {
    id: "sunrise-yoga",
    name: { hr: "Jutarnja joga — Uvala Frkanj", en: "Morning yoga — Frkanj cove", de: "Morgenyoga — Bucht Frkanj", it: "Yoga mattutino — baia di Frkanj" },
    type: "wellness",
    emoji: "🧘",
    color: "#f472b6",
    dist: "0.5 km",
    dur: { hr: "60–90 min", en: "60–90 min", de: "60–90 Min.", it: "60–90 min" },
    diff: { hr: "Lagano", en: "Easy", de: "Leicht", it: "Facile" },
    elev: "+5m",
    cat: { hr: "Joga · wellbeing", en: "Yoga · wellbeing", de: "Yoga · Wohlbefinden", it: "Yoga · benessere" },
    start: { hr: "Plaža Frkanj, sjeverni kraj", en: "Frkanj beach, northern end", de: "Strand Frkanj, Nordende", it: "Spiaggia Frkanj, estremità nord" },
    lat: 44.7650, lng: 14.7680,
    desc: { hr: "Ravna kamena platforma uz more, idealna za jutarnju jogu pri izlasku sunca. Vodič na zahtjev. Preporuča se dolazak 30 min prije izlaska sunca.", en: "Flat stone platform by the sea, ideal for morning yoga at sunrise. Guide available on request. Recommended arrival 30 min before sunrise.", de: "Flache Steinplattform am Meer, ideal für Morgenyoga bei Sonnenaufgang. Guide auf Anfrage.", it: "Piattaforma di pietra piatta vicino al mare, ideale per yoga mattutino all'alba. Guida disponibile su richiesta." },
    tags: ["🧘", "🌅", "💧"],
  },
];

const DIFF_COLOR = {
  Lagano: "#22c55e", Easy: "#22c55e", Leicht: "#22c55e", Facile: "#22c55e",
  Srednje: "#f59e0b", Moderate: "#f59e0b", Mittel: "#f59e0b", Moderato: "#f59e0b",
  Teže: "#ef4444", Challenging: "#ef4444", Schwierig: "#ef4444", Impegnativo: "#ef4444",
};

const FILTERS = {
  all:       { hr: "Sve",       en: "All",      de: "Alle",      it: "Tutte",    emoji: "🌍" },
  forest:    { hr: "Šuma",      en: "Forest",   de: "Wald",      it: "Foresta",  emoji: "🌲" },
  hiking:    { hr: "Planin.",   en: "Hiking",   de: "Wandern",   it: "Hiking",   emoji: "🥾" },
  cycling:   { hr: "Bicikl",   en: "Cycling",  de: "Radfahren", it: "Bici",     emoji: "🚴" },
  kayak:     { hr: "Kajak",     en: "Kayak",    de: "Kajak",     it: "Kayak",    emoji: "🛶" },
  wellness:  { hr: "Wellness",  en: "Wellness", de: "Wellness",  it: "Wellness", emoji: "🧘" },
};

const T = {
  title: { hr: "Wellness & Prirodne rute — Rab", en: "Wellness & Nature Routes — Rab", de: "Wellness & Naturrouten — Rab", it: "Percorsi Wellness & Natura — Rab" },
  sub:   { hr: "GPS rute za tijelo i um · od laganog do izazovnog", en: "GPS routes for body & mind · from easy to challenging", de: "GPS-Routen für Körper & Geist · von leicht bis anspruchsvoll", it: "Percorsi GPS per corpo e mente · dal facile all'impegnativo" },
  start: { hr: "Startna točka", en: "Starting point", de: "Startpunkt", it: "Punto di partenza" },
  nav:   { hr: "Navigiraj", en: "Navigate", de: "Navigation", it: "Naviga" },
  strava:{ hr: "Strava", en: "Strava", de: "Strava", it: "Strava" },
};

export default function WellnessRoutes({ lang = "hr", C, dm, hf }) {
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState(null);

  const filtered = ROUTES.filter(r => filter === "all" || r.type === filter);
  const accent = C?.accent || "#0ea5e9";

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
        <div style={{ fontSize: 48 }}>🌿</div>
        <div style={{ ...(hf||{}), fontSize: 26, fontWeight: 400, marginTop: 8 }}>{T.title[lang]||T.title.en}</div>
        <div style={{ ...(dm||{}), fontSize: 13, color: C?.mut||"#94a3b8", marginTop: 4 }}>{T.sub[lang]||T.sub.en}</div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(FILTERS).map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            ...(dm||{}), padding: "7px 13px", borderRadius: 20, fontSize: 12,
            background: filter === k ? accent : "rgba(255,255,255,0.05)",
            color: filter === k ? "#fff" : (C?.mut||"#94a3b8"),
            border: `1px solid ${filter === k ? accent : (C?.bord||"rgba(255,255,255,0.1)")}`,
            cursor: "pointer", fontWeight: filter === k ? 600 : 400, transition: "all 0.2s",
          }}>{v.emoji} {v[lang]||v.en}</button>
        ))}
      </div>

      {/* Route cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(route => {
          const name = route.name[lang]||route.name.en;
          const diff = route.diff[lang]||route.diff.en;
          const diffColor = DIFF_COLOR[diff] || "#94a3b8";
          return (
            <div key={route.id}
              onClick={() => setSel(sel === route.id ? null : route.id)}
              style={{
                background: C?.card||"rgba(255,255,255,0.04)", borderRadius: 18, overflow: "hidden",
                border: `1px solid ${sel === route.id ? route.color + "50" : (C?.bord||"rgba(255,255,255,0.08)")}`,
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: sel === route.id ? `0 6px 24px ${route.color}18` : "none",
              }}>
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: route.color + "15",
                  border: `1px solid ${route.color}30`, display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
                  {route.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...(dm||{}), fontWeight: 600, fontSize: 13, color: C?.text||"#e2e8f0", lineHeight: 1.3 }}>{name}</div>
                  <div style={{ ...(dm||{}), fontSize: 11, color: route.color, marginTop: 2 }}>{route.cat[lang]||route.cat.en}</div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}`, background: "rgba(0,0,0,0.12)" }}>
                {[
                  { label: "📏", value: route.dist },
                  { label: "⏱️", value: route.dur[lang]||route.dur.en },
                  { label: "⬆️", value: route.elev },
                  { label: "💪", value: diff, color: diffColor },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRight: i < 3 ? `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}` : "none" }}>
                    <div style={{ fontSize: 12 }}>{s.label}</div>
                    <div style={{ ...(dm||{}), fontSize: 11, color: s.color || (C?.text||"#e2e8f0"), fontWeight: 600, marginTop: 1 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 4, padding: "8px 16px", alignItems: "center" }}>
                {route.tags.map((t, i) => <span key={i} style={{ fontSize: 16 }}>{t}</span>)}
              </div>

              {/* Expanded */}
              {sel === route.id && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}` }}>
                  <div style={{ ...(dm||{}), fontSize: 13, color: C?.text||"#e2e8f0", lineHeight: 1.65, marginTop: 14, marginBottom: 14 }}>
                    {route.desc[lang]||route.desc.en}
                  </div>
                  <div style={{ ...(dm||{}), fontSize: 12, color: C?.mut||"#64748b", marginBottom: 12 }}>
                    🚩 {T.start[lang]||T.start.en}: {route.start[lang]||route.start.en}
                  </div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${route.lat},${route.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ ...(dm||{}), display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 11, background: route.color + "18", border: `1px solid ${route.color}40`, color: route.color, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    📍 {T.nav[lang]||T.nav.en}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
