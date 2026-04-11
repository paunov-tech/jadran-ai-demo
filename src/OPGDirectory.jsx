// OPGDirectory.jsx — Local OPG farm & artisan producer directory for Rab island
// Zero-km food: olive oil, honey, donkey milk, wine, herbs, cheese

import { useState } from "react";

const OPG_DATA = [
  {
    id: "natura-rab",
    name: "Natura Rab",
    emoji: "🫒",
    color: "#84cc16",
    tagline: { hr: "Maslinovo ulje & med · eko uzgoj", en: "Olive oil & honey · organic farming", de: "Olivenöl & Honig · Bio-Anbau", it: "Olio d'oliva & miele · agricoltura biologica" },
    products: [
      { name: { hr: "Extra djevičansko maslinovo ulje", en: "Extra virgin olive oil", de: "Natives Olivenöl extra", it: "Olio extravergine di oliva" }, price: "120–180 kn / 500ml", emoji: "🫒" },
      { name: { hr: "Labinska otočna skuša (med)", en: "Labinska island honey", de: "Labinska Inselhonig", it: "Miele isolano Labinska" }, price: "80–120 kn / 250g", emoji: "🍯" },
      { name: { hr: "Eterično ulje lavande", en: "Lavender essential oil", de: "Lavendelätherisches Öl", it: "Olio essenziale di lavanda" }, price: "60 kn / 10ml", emoji: "💜" },
    ],
    contact: { tel: "+385 91 xxx xxxx", location: { hr: "Palit, Rab", en: "Palit, Rab", de: "Palit, Rab", it: "Palit, Rab" } },
    lat: 44.7612, lng: 14.7350,
    cert: "🌿 Eco certified",
    note: { hr: "Obiteljski OPG, treća generacija uzgajivača maslina na otoku. Direktna prodaja s farme.", en: "Family farm, third generation olive growers on the island. Direct sales from the farm.", de: "Familienhof, dritte Generation der Olivenbauern auf der Insel. Direktverkauf ab Hof.", it: "Azienda familiare, terza generazione di olivicoltori sull'isola. Vendita diretta dalla fattoria." },
  },
  {
    id: "opg-kanat",
    name: "OPG Kanat",
    emoji: "🫏",
    color: "#f59e0b",
    tagline: { hr: "Magareće mlijeko & sapuni", en: "Donkey milk & soaps", de: "Eselsmilch & Seifen", it: "Latte d'asino & saponi" },
    products: [
      { name: { hr: "Svježe magareće mlijeko", en: "Fresh donkey milk", de: "Frische Eselsmilch", it: "Latte fresco d'asino" }, price: "40 kn / 200ml", emoji: "🫏" },
      { name: { hr: "Sapun s magarećim mlijekom", en: "Donkey milk soap", de: "Eselsmilchseife", it: "Sapone al latte d'asino" }, price: "35 kn / kom", emoji: "🧼" },
      { name: { hr: "Krema za lice s magarećim mlijekom", en: "Donkey milk face cream", de: "Eselsmilch-Gesichtscreme", it: "Crema viso al latte d'asino" }, price: "85 kn / 50ml", emoji: "✨" },
      { name: { hr: "Rab sir (ovčji)", en: "Rab cheese (sheep)", de: "Rab-Käse (Schaf)", it: "Formaggio Rab (ovino)" }, price: "90 kn / 200g", emoji: "🧀" },
    ],
    contact: { tel: "+385 98 xxx xxxx", location: { hr: "Mundanije, Rab", en: "Mundanije, Rab", de: "Mundanije, Rab", it: "Mundanije, Rab" } },
    lat: 44.7688, lng: 14.7850,
    cert: "🏅 Tradicijska proizvodnja",
    note: { hr: "Jedina farma magaraca na otoku Rabu. Magareće mlijeko poznato po ljekovitim svojstvima i visokom sadržaju vitamina.", en: "The only donkey farm on Rab island. Donkey milk known for medicinal properties and high vitamin content.", de: "Die einzige Eselsfarm auf Rab. Eselsmilch bekannt für Heilwirkung und hohen Vitamingehalt.", it: "L'unica fattoria di asini sull'isola di Rab. Latte d'asino noto per proprietà medicinali e alto contenuto vitaminico." },
  },
  {
    id: "rabpur",
    name: "RABPUR",
    emoji: "🍷",
    color: "#a78bfa",
    tagline: { hr: "Domaće vino, sirup nara & ljekovite trave", en: "Local wine, pomegranate syrup & herbs", de: "Heimischer Wein, Granatapfelsirup & Kräuter", it: "Vino locale, sciroppo di melograno & erbe" },
    products: [
      { name: { hr: "Otočno bijelo vino (Žlahtina)", en: "Island white wine (Žlahtina)", de: "Inselweißwein (Žlahtina)", it: "Vino bianco isolano (Žlahtina)" }, price: "80–120 kn / boca", emoji: "🍾" },
      { name: { hr: "Sirup od nara", en: "Pomegranate syrup", de: "Granatapfelsirup", it: "Sciroppo di melograno" }, price: "55 kn / 250ml", emoji: "🍓" },
      { name: { hr: "Rab mješavina trava (čaj)", en: "Rab herb blend (tea)", de: "Rab-Kräutermischung (Tee)", it: "Miscela di erbe di Rab (tè)" }, price: "30 kn / 50g", emoji: "🌿" },
      { name: { hr: "Likerica od rogača", en: "Carob liqueur", de: "Johannisbrotlikör", it: "Liquore di carruba" }, price: "95 kn / 200ml", emoji: "🥃" },
    ],
    contact: { tel: "+385 51 xxx xxxx", location: { hr: "Grad Rab, tržnica", en: "Rab town, market", de: "Rab-Stadt, Markt", it: "Città di Rab, mercato" } },
    lat: 44.7562, lng: 14.7629,
    cert: "🍷 Zaštićeni naziv porijekla",
    note: { hr: "Lokalna kooperativa proizvođača. Tjedna tržnica svaki petak ujutro u gradu Rabu — svježe i direktno od farmera.", en: "Local producer cooperative. Weekly market every Friday morning in Rab town — fresh and direct from farmers.", de: "Lokale Erzeugergenossenschaft. Wochenmarkt jeden Freitagmorgen in Rab-Stadt — frisch und direkt von Bauern.", it: "Cooperativa locale di produttori. Mercato settimanale ogni venerdì mattina a Rab — fresco e diretto dai produttori." },
  },
  {
    id: "valanga",
    name: "Valanga",
    emoji: "🏆",
    color: "#C9A84C",
    tagline: { hr: "Nagrađivano maslinovo ulje — premium linija", en: "Award-winning olive oil — premium line", de: "Preisgekröntes Olivenöl — Premiumlinie", it: "Olio d'oliva premiato — linea premium" },
    products: [
      { name: { hr: "Valanga Premium EV (Oblika sorta)", en: "Valanga Premium EV (Oblika variety)", de: "Valanga Premium EV (Oblika-Sorte)", it: "Valanga Premium EV (varietà Oblika)" }, price: "250–380 kn / 500ml", emoji: "🥇" },
      { name: { hr: "Valanga Riserva (limitirano)", en: "Valanga Riserva (limited)", de: "Valanga Riserva (limitiert)", it: "Valanga Riserva (edizione limitata)" }, price: "420 kn / 500ml", emoji: "🏆" },
      { name: { hr: "Degustacijski set (3 × 100ml)", en: "Tasting set (3 × 100ml)", de: "Verkostungsset (3 × 100ml)", it: "Set degustazione (3 × 100ml)" }, price: "180 kn / set", emoji: "🎁" },
    ],
    contact: { tel: "+385 99 xxx xxxx", location: { hr: "Lopar, Rab", en: "Lopar, Rab", de: "Lopar, Rab", it: "Lopar, Rab" } },
    lat: 44.8342, lng: 14.7280,
    cert: "🥇 Salon de Gourmets Madrid · Terraolivo",
    note: { hr: "Višestruko nagrađivano ulje na međunarodnim natjecanjima. Oblika masline uzgajane isključivo na sjevernom Rabu, ručno brano u listopadu.", en: "Multiple award winner at international competitions. Oblika olives grown exclusively in northern Rab, hand-picked in October.", de: "Vielfacher Preisträger bei internationalen Wettbewerben. Oblika-Oliven, ausschließlich im Nordteil Rabs angebaut, im Oktober von Hand geerntet.", it: "Multipremio a competizioni internazionali. Olive Oblika coltivate esclusivamente nel Rab settentrionale, raccolte a mano in ottobre." },
  },
];

const T = {
  title:   { hr: "OPG Direktorij — Rab", en: "OPG Directory — Rab", de: "OPG-Verzeichnis — Rab", it: "Direttorio OPG — Rab" },
  sub:     { hr: "Lokalni proizvođači · zero-km · direktna kupnja", en: "Local producers · zero-km · direct purchase", de: "Lokale Erzeuger · Zero-km · Direktkauf", it: "Produttori locali · zero-km · acquisto diretto" },
  contact: { hr: "Kontakt", en: "Contact", de: "Kontakt", it: "Contatto" },
  loc:     { hr: "Lokacija", en: "Location", de: "Standort", it: "Posizione" },
  rabCard: { hr: "Rab Card: posebna ponuda −10%", en: "Rab Card: special offer −10%", de: "Rab Card: Sonderangebot −10%", it: "Rab Card: offerta speciale −10%" },
  market:  { hr: "Tržnica: petak 08–13h · Grad Rab", en: "Market: Friday 08–13h · Rab town", de: "Markt: Freitag 08–13h · Rab-Stadt", it: "Mercato: venerdì 08–13h · città di Rab" },
};

export default function OPGDirectory({ lang = "hr", C, dm, hf }) {
  const [sel, setSel] = useState(null);

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
        <div style={{ fontSize: 48 }}>🧺</div>
        <div style={{ ...(hf||{}), fontSize: 26, fontWeight: 400, marginTop: 8 }}>{T.title[lang]||T.title.en}</div>
        <div style={{ ...(dm||{}), fontSize: 13, color: C?.mut||"#94a3b8", marginTop: 4 }}>{T.sub[lang]||T.sub.en}</div>
      </div>

      {/* Market banner */}
      <div style={{ padding: "10px 16px", borderRadius: 14, background: "rgba(245,215,142,0.07)", border: "1px solid rgba(201,168,76,0.25)", marginBottom: 16, ...(dm||{}), fontSize: 12, color: "#F5D78E", textAlign: "center" }}>
        🛒 {T.market[lang]||T.market.en}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {OPG_DATA.map(opg => (
          <div key={opg.id} style={{
            background: C?.card||"rgba(255,255,255,0.04)", borderRadius: 20,
            border: `1px solid ${sel === opg.id ? opg.color + "50" : (C?.bord||"rgba(255,255,255,0.08)")}`,
            overflow: "hidden", transition: "all 0.2s",
            boxShadow: sel === opg.id ? `0 8px 32px ${opg.color}14` : "none",
          }}>
            {/* Header row */}
            <div onClick={() => setSel(sel === opg.id ? null : opg.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", cursor: "pointer" }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: opg.color + "15",
                border: `1px solid ${opg.color}30`, display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 }}>
                {opg.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...(dm||{}), fontWeight: 700, fontSize: 15, color: C?.text||"#e2e8f0" }}>{opg.name}</div>
                <div style={{ ...(dm||{}), fontSize: 12, color: opg.color, marginTop: 2 }}>{opg.tagline[lang]||opg.tagline.en}</div>
                <div style={{ ...(dm||{}), fontSize: 10, color: C?.mut||"#64748b", marginTop: 3 }}>{opg.cert}</div>
              </div>
              <span style={{ color: C?.mut||"#64748b", fontSize: 16, display: "inline-block", transition: "transform 0.2s", transform: sel === opg.id ? "rotate(180deg)" : "none" }}>▼</span>
            </div>

            {/* Products list */}
            <div style={{ borderTop: `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}`, background: "rgba(0,0,0,0.15)" }}>
              {opg.products.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px",
                  borderBottom: i < opg.products.length - 1 ? `1px solid ${C?.bord||"rgba(255,255,255,0.05)"}` : "none" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1, ...(dm||{}), fontSize: 13, color: C?.text||"#e2e8f0" }}>{p.name[lang]||p.name.en}</div>
                  <div style={{ ...(dm||{}), fontSize: 12, color: opg.color, fontWeight: 600, whiteSpace: "nowrap" }}>{p.price}</div>
                </div>
              ))}
            </div>

            {/* Expanded info */}
            {sel === opg.id && (
              <div style={{ padding: "14px 18px", borderTop: `1px solid ${C?.bord||"rgba(255,255,255,0.07)"}` }}>
                <div style={{ ...(dm||{}), fontSize: 13, color: C?.text||"#e2e8f0", lineHeight: 1.65, marginBottom: 14 }}>
                  {opg.note[lang]||opg.note.en}
                </div>
                {/* Rab Card benefit */}
                <div style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", marginBottom: 12, ...(dm||{}), fontSize: 12, color: "#F5D78E" }}>
                  🏆 {T.rabCard[lang]||T.rabCard.en}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${opg.lat},${opg.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ ...(dm||{}), display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: opg.color + "15", border: `1px solid ${opg.color}40`, color: opg.color, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    📍 {T.loc[lang]||T.loc.en}
                  </a>
                  {opg.contact.tel && (
                    <a href={`tel:${opg.contact.tel.replace(/\s/g,"")}`}
                      style={{ ...(dm||{}), display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${C?.bord||"rgba(255,255,255,0.1)"}`, color: C?.mut||"#94a3b8", fontSize: 12, textDecoration: "none" }}>
                      📞 {T.contact[lang]||T.contact.en}
                    </a>
                  )}
                </div>
                <div style={{ ...(dm||{}), fontSize: 11, color: C?.mut||"#64748b", marginTop: 8 }}>
                  📍 {opg.contact.location[lang]||opg.contact.location.en}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
