// RabCard.jsx — Rab Card digital pass generator
// Used as kiosk subScreen "rabcard"
// Generates Google Wallet pass + web QR fallback for all devices

import { useState } from "react";

const BENEFITS = {
  hr: [
    "🍽️ Popust kod Jadran.ai partner restorana",
    "⛵ Shuttle do Kalifronta",
    "🏛️ Ulaz u zvonika starog grada Raba",
    "🌿 Prioritetni pristup organiziranim plažama",
    "🧺 Posebne ponude OPG partnera (zero-km)",
    "🎯 Ekskluzivne aktivnosti i izleti",
  ],
  en: [
    "🍽️ Discount at Jadran.ai partner restaurants",
    "⛵ Shuttle to Kalifront nature reserve",
    "🏛️ Entry to Rab Old Town bell towers",
    "🌿 Priority access to organised beaches",
    "🧺 Special offers from local OPG farms (zero-km)",
    "🎯 Exclusive activities & excursions",
  ],
  de: [
    "🍽️ Rabatt bei Jadran.ai-Partnerrestaurants",
    "⛵ Shuttle zum Naturreservat Kalifront",
    "🏛️ Eintritt in die Glockentürme der Altstadt",
    "🌿 Prioritätszugang zu organisierten Stränden",
    "🧺 Sonderangebote lokaler OPG-Höfe (Zero-km)",
    "🎯 Exklusive Aktivitäten & Ausflüge",
  ],
  it: [
    "🍽️ Sconto nei ristoranti partner Jadran.ai",
    "⛵ Shuttle per la riserva naturale Kalifront",
    "🏛️ Ingresso ai campanili del centro storico",
    "🌿 Accesso prioritario alle spiagge organizzate",
    "🧺 Offerte speciali dagli OPG locali (zero-km)",
    "🎯 Attività ed escursioni esclusive",
  ],
};

const T = {
  title:       { hr:"Rab Card", en:"Rab Card", de:"Rab Card", it:"Rab Card" },
  sub:         { hr:"Vaš digitalni pass za Rab", en:"Your digital pass for Rab", de:"Ihr digitaler Pass für Rab", it:"Il tuo pass digitale per Rab" },
  benefitsHdr: { hr:"Što je uključeno", en:"What's included", de:"Was ist enthalten", it:"Cosa è incluso" },
  nameLabel:   { hr:"Ime i prezime", en:"Full name", de:"Vor- und Nachname", it:"Nome e cognome" },
  namePh:      { hr:"Vaše ime...", en:"Your name...", de:"Ihr Name...", it:"Il vostro nome..." },
  btn:         { hr:"🪪 Kreiraj Rab Card", en:"🪪 Create Rab Card", de:"🪪 Rab Card erstellen", it:"🪪 Crea Rab Card" },
  creating:    { hr:"Kreiram...", en:"Creating...", de:"Erstelle...", it:"Sto creando..." },
  walletBtn:   { hr:"Dodaj u Google Wallet", en:"Add to Google Wallet", de:"Zu Google Wallet hinzufügen", it:"Aggiungi a Google Wallet" },
  validUntil:  { hr:"Vrijedi do", en:"Valid until", de:"Gültig bis", it:"Valido fino al" },
  scanInfo:    { hr:"Pokaži QR kod partnerima za popust ili ulaz", en:"Show QR code to partners for discounts or entry", de:"QR-Code Partnern zeigen für Rabatte oder Eintritt", it:"Mostra il QR ai partner per sconti o ingresso" },
  webLink:     { hr:"Otvori web karticu", en:"Open web card", de:"Web-Karte öffnen", it:"Apri carta web" },
};
const t = (k, lang) => T[k]?.[lang] || T[k]?.en || "";

export default function RabCard({ lang = "hr", affiliateId = "", C, dm }) {
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [card, setCard]       = useState(null);
  const [error, setError]     = useState("");

  async function generate() {
    if (!name.trim()) { setError(lang === "hr" ? "Unesite ime." : "Name required."); return; }
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/rab-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name.trim(), city: "Rab", lang, affiliateId, validDays: 14 }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Greška"); return; }
      setCard(data);
    } catch { setError("Greška mreže."); }
    finally { setLoading(false); }
  }

  const benefits = BENEFITS[lang] || BENEFITS.en;

  // ── Card display (after generation) ──────────────────────────────
  if (card) {
    const qrImgUrl = `https://quickchart.io/qr?text=${encodeURIComponent(card.cardUrl)}&size=220&margin=2&ecLevel=M&dark=0a1628&light=FFFFFF`;

    return (
      <div>
        {/* The card */}
        <div style={{
          background: "linear-gradient(145deg,#07111f 0%,#0d2137 60%,#0f2a4a 100%)",
          border: "1px solid rgba(255,184,0,0.35)",
          borderRadius: 20, padding: "22px 20px", marginBottom: 16,
          boxShadow: "0 0 32px rgba(255,184,0,0.07), 0 4px 24px rgba(0,0,0,0.4)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Top shimmer line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(255,184,0,0.6),transparent)" }} />

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
            <div>
              <div style={{ fontSize:11, color:"#FFB800", fontWeight:800, letterSpacing:".12em", textTransform:"uppercase" }}>JADRAN.ai</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#fff", lineHeight:1.1 }}>Rab Card</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:"#475569", textTransform:"uppercase", letterSpacing:".06em" }}>{t("validUntil", lang)}</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#94a3b8" }}>{card.expiresAt}</div>
            </div>
          </div>

          {/* Guest name */}
          <div style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:18, letterSpacing:".02em" }}>
            {card.guestName}
          </div>

          {/* QR code */}
          <div style={{ textAlign:"center", marginBottom:14 }}>
            <div style={{ display:"inline-block", background:"#fff", borderRadius:14, padding:10 }}>
              <img src={qrImgUrl} alt="Rab Card QR" width={200} height={200} style={{ display:"block", borderRadius:4 }} />
            </div>
          </div>

          {/* Card ID */}
          <div style={{ textAlign:"center", fontFamily:"monospace", fontSize:13, color:"#38bdf8", letterSpacing:".08em" }}>
            {card.cardId}
          </div>

          {/* Scan hint */}
          <div style={{ textAlign:"center", fontSize:11, color:"#334155", marginTop:8 }}>
            {t("scanInfo", lang)}
          </div>
        </div>

        {/* Google Wallet button */}
        {card.walletUrl && (
          <a href={card.walletUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:"block", textAlign:"center", marginBottom:10 }}>
            <img
              src="https://wallet.google.com/intl/en_us/images/saveToGoogleWallet/save-to-google-wallet-button-en-us.svg"
              alt={t("walletBtn", lang)}
              style={{ height:48, maxWidth:240 }}
            />
          </a>
        )}

        {/* Web fallback link */}
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <a href={card.cardUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, color:"#475569", textDecoration:"underline" }}>
            {t("webLink", lang)} ↗
          </a>
        </div>

        {/* Benefits summary */}
        <div style={{ background:"rgba(255,184,0,0.04)", border:"1px solid rgba(255,184,0,0.1)", borderRadius:14, padding:"14px 16px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#FFB800", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>
            {t("benefitsHdr", lang)}
          </div>
          {benefits.map((b, i) => (
            <div key={i} style={{ ...dm, fontSize:13, color:"#64748b", padding:"5px 0", borderBottom: i < benefits.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Generation form ───────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <span style={{ fontSize:40 }}>🪪</span>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:C.text }}>{t("title", lang)}</div>
          <div style={{ ...dm, fontSize:13, color:C.mut }}>{t("sub", lang)}</div>
        </div>
      </div>

      {/* Benefits preview */}
      <div style={{
        background:"rgba(255,184,0,0.05)", border:"1px solid rgba(255,184,0,0.14)",
        borderRadius:14, padding:"14px 16px", marginBottom:22,
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#FFB800", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>
          {t("benefitsHdr", lang)}
        </div>
        {benefits.map((b, i) => (
          <div key={i} style={{ ...dm, fontSize:13, color:C.mut, padding:"5px 0", borderBottom: i < benefits.length-1 ? `1px solid ${C.bord}` : "none" }}>
            {b}
          </div>
        ))}
      </div>

      {/* Name input */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:C.mut, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:7 }}>
          {t("nameLabel", lang)}
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
          placeholder={t("namePh", lang)}
          style={{
            width:"100%", boxSizing:"border-box",
            padding:"12px 14px", borderRadius:12,
            background:"rgba(255,255,255,0.05)",
            border:`1px solid ${C.bord}`,
            color:C.text, fontSize:15, outline:"none",
          }}
        />
      </div>

      {error && <div style={{ fontSize:13, color:"#f87171", marginBottom:10 }}>{error}</div>}

      <button onClick={generate} disabled={loading} style={{
        width:"100%", padding:"13px 0",
        background: loading ? "rgba(255,184,0,0.25)" : "linear-gradient(135deg,#FFB800,#f59e0b)",
        color:"#0a0f1a", border:"none", borderRadius:12,
        fontSize:15, fontWeight:800, cursor: loading ? "default" : "pointer",
        letterSpacing:".02em",
      }}>
        {loading ? t("creating", lang) : t("btn", lang)}
      </button>

      <p style={{ ...dm, fontSize:11, color:C.mut, textAlign:"center", marginTop:12 }}>
        {lang === "hr" ? "Kartica vrijedi 14 dana · Besplatno" :
         lang === "de" ? "Karte gilt 14 Tage · Kostenlos" :
         lang === "it" ? "Carta valida 14 giorni · Gratuita" :
         "Card valid for 14 days · Free"}
      </p>
    </div>
  );
}
