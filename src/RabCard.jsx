// RabCard.jsx — Rab Card · Platinum-grade digital pass
// Visual identity: JADRAN.ai Privilege Card (Amex Centurion aesthetic)

import { useState } from "react";

const GOLD  = "#C9A84C";
const GOLD2 = "#F5D78E";
const GOLD3 = "#8B6914";
const CARD_BG = "linear-gradient(145deg,#0c0e13 0%,#141820 55%,#0a0c10 100%)";

const BENEFITS = {
  hr: [
    "🍽️ Popust kod Jadran.ai partner restorana",
    "⛵ Shuttle do rezervata Kalifront",
    "🏛️ Ulaz u zvonike starog grada Raba",
    "🌿 Prioritetni pristup organiziranim plažama",
    "🧺 Posebne ponude OPG partnera · zero-km",
    "🎯 Ekskluzivni izleti i aktivnosti",
  ],
  en: [
    "🍽️ Discount at Jadran.ai partner restaurants",
    "⛵ Shuttle to Kalifront nature reserve",
    "🏛️ Entry to Rab Old Town bell towers",
    "🌿 Priority access to organised beaches",
    "🧺 Special offers from local OPG farms · zero-km",
    "🎯 Exclusive excursions & activities",
  ],
  de: [
    "🍽️ Rabatt bei Jadran.ai-Partnerrestaurants",
    "⛵ Shuttle zum Naturreservat Kalifront",
    "🏛️ Eintritt in die Glockentürme der Altstadt",
    "🌿 Prioritätszugang zu organisierten Stränden",
    "🧺 Sonderangebote lokaler OPG-Höfe · Zero-km",
    "🎯 Exklusive Ausflüge & Aktivitäten",
  ],
  it: [
    "🍽️ Sconto nei ristoranti partner Jadran.ai",
    "⛵ Shuttle per la riserva Kalifront",
    "🏛️ Ingresso ai campanili del centro storico",
    "🌿 Accesso prioritario alle spiagge organizzate",
    "🧺 Offerte OPG locali · zero-km",
    "🎯 Escursioni ed attività esclusive",
  ],
};

const T = {
  title:      { hr:"Rab Card", en:"Rab Card", de:"Rab Card", it:"Rab Card" },
  sub:        { hr:"Vaš Platinum pass za Rab", en:"Your Platinum pass for Rab", de:"Ihr Platinum-Pass für Rab", it:"Il tuo Platinum pass per Rab" },
  inclHdr:    { hr:"Uključene pogodnosti", en:"Included privileges", de:"Enthaltene Privilegien", it:"Privilegi inclusi" },
  nameLabel:  { hr:"Ime i prezime", en:"Full name", de:"Vor- und Nachname", it:"Nome e cognome" },
  namePh:     { hr:"Vaše ime...", en:"Your name...", de:"Ihr Name...", it:"Il vostro nome..." },
  btn:        { hr:"Kreiraj Rab Card", en:"Create Rab Card", de:"Rab Card erstellen", it:"Crea Rab Card" },
  creating:   { hr:"Kreiram...", en:"Creating...", de:"Erstelle...", it:"Sto creando..." },
  validUntil: { hr:"Vrijedi do", en:"Valid until", de:"Gültig bis", it:"Valido fino al" },
  scanHint:   { hr:"Pokaži QR kod partnerima", en:"Show QR code to partners", de:"QR-Code Partnern zeigen", it:"Mostra il QR ai partner" },
  walletAdd:  { hr:"Dodaj u Google Wallet", en:"Add to Google Wallet", de:"Zu Google Wallet", it:"Aggiungi al Wallet" },
  webOpen:    { hr:"Otvori web karticu", en:"Open web card", de:"Web-Karte öffnen", it:"Apri carta web" },
  validity:   { hr:"Kartica vrijedi 14 dana · Besplatno", en:"Card valid 14 days · Free", de:"14 Tage gültig · Kostenlos", it:"Valida 14 giorni · Gratuita" },
};
const t = (k, lang) => T[k]?.[lang] || T[k]?.en || "";

// ── Chip SVG ──────────────────────────────────────────────────
function Chip() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#C9A84C"/>
          <stop offset="40%"  stopColor="#F5D78E"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </linearGradient>
      </defs>
      <rect width="44" height="34" rx="5" fill="url(#cg)"/>
      <rect x="10" y="9"  width="24" height="16" rx="3" fill="none" stroke="#7a5c10" strokeWidth="1.2"/>
      <line x1="22" y1="9"  x2="22" y2="25" stroke="#7a5c10" strokeWidth="1.2"/>
      <line x1="10" y1="17" x2="34" y2="17" stroke="#7a5c10" strokeWidth="1.2"/>
      <line x1="10" y1="13" x2="10" y2="21" stroke="#7a5c10" strokeWidth="0.8"/>
      <line x1="34" y1="13" x2="34" y2="21" stroke="#7a5c10" strokeWidth="0.8"/>
    </svg>
  );
}

// ── The physical card face ────────────────────────────────────
function CardFace({ guestName, cardId, expiresAt, qrUrl, lang }) {
  return (
    <div style={{
      background: CARD_BG,
      borderRadius: 20,
      padding: "22px 24px 20px",
      position: "relative",
      overflow: "hidden",
      boxShadow: [
        "0 30px 60px rgba(0,0,0,0.75)",
        "0 0 0 1px rgba(201,168,76,0.25)",
        "inset 0 1px 0 rgba(245,215,142,0.15)",
        "inset 0 -1px 0 rgba(139,105,20,0.3)",
      ].join(", "),
      userSelect: "none",
    }}>
      {/* Brushed metal texture */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.012) 3px,rgba(255,255,255,0.012) 6px)",
      }}/>

      {/* Gold shimmer — top edge */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2, pointerEvents: "none",
        background: `linear-gradient(90deg,transparent 5%,${GOLD3} 20%,${GOLD2} 50%,${GOLD3} 80%,transparent 95%)`,
      }}/>

      {/* Radial glow — top right */}
      <div style={{
        position: "absolute", right: -80, top: -80,
        width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 65%)`,
        pointerEvents: "none",
      }}/>

      {/* Radial glow — bottom left */}
      <div style={{
        position: "absolute", left: -60, bottom: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle,rgba(14,165,233,0.05) 0%,transparent 65%)`,
        pointerEvents: "none",
      }}/>

      {/* Row 1: Wordmark + chip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative", zIndex: 1 }}>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: ".22em", fontFamily: "Georgia,serif" }}>JADRAN</div>
          <div style={{ fontSize: 11, fontWeight: 300, color: `${GOLD}aa`, letterSpacing: ".35em" }}>.ai</div>
        </div>
        <Chip />
      </div>

      {/* RAB wordmark */}
      <div style={{
        fontSize: 42, fontWeight: 200, color: "rgba(255,255,255,0.9)",
        letterSpacing: ".28em", fontFamily: "Georgia,serif",
        marginBottom: 14, position: "relative", zIndex: 1,
        textShadow: `0 0 40px rgba(201,168,76,0.2)`,
      }}>
        RAB
      </div>

      {/* QR + info side by side */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", position: "relative", zIndex: 1 }}>
        {/* QR */}
        <div style={{
          background: "#fff", borderRadius: 10, padding: 6, flexShrink: 0,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}>
          {qrUrl
            ? <img src={qrUrl} alt="QR" width={110} height={110} style={{ display: "block", borderRadius: 4 }} />
            : <div style={{ width: 110, height: 110, background: "#f1f5f9", borderRadius: 4, display: "grid", placeItems: "center", fontSize: 28 }}>⬜</div>
          }
        </div>

        {/* Card info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Guest name */}
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e0d0", letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {guestName}
          </div>

          {/* Card ID */}
          <div style={{ fontSize: 10, color: `${GOLD3}cc`, letterSpacing: ".08em", fontFamily: "monospace", marginBottom: 12 }}>
            {cardId}
          </div>

          {/* Validity */}
          <div>
            <div style={{ fontSize: 8, color: "#3d3520", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 2 }}>
              {t("validUntil", lang)}
            </div>
            <div style={{ fontSize: 13, color: GOLD, fontWeight: 600, letterSpacing: ".06em", fontFamily: "monospace" }}>
              {expiresAt}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginTop: 10, fontSize: 8, color: "#3d3520", letterSpacing: ".12em", textTransform: "uppercase", lineHeight: 1.5 }}>
            Partner<br/>Privilege Card
          </div>
        </div>
      </div>

      {/* Scan hint */}
      <div style={{
        marginTop: 14, textAlign: "center",
        fontSize: 10, color: "#2a2416", letterSpacing: ".06em",
        position: "relative", zIndex: 1,
      }}>
        {t("scanHint", lang)}
      </div>

      {/* Gold shimmer — bottom edge */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 1, pointerEvents: "none",
        background: `linear-gradient(90deg,transparent 10%,${GOLD3}88 40%,${GOLD3}88 60%,transparent 90%)`,
      }}/>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
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
  const qrUrl = card
    ? `https://quickchart.io/qr?text=${encodeURIComponent(card.cardUrl)}&size=220&margin=1&ecLevel=M&dark=0a0c10&light=FFFFFF`
    : null;

  // ── Card shown after generation ───────────────────────────
  if (card) {
    return (
      <div>
        <CardFace
          guestName={card.guestName}
          cardId={card.cardId}
          expiresAt={card.expiresAt}
          qrUrl={qrUrl}
          lang={lang}
        />

        {/* Google Wallet */}
        {card.walletUrl && (
          <a href={card.walletUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", margin: "16px 0 8px" }}>
            <img
              src="https://wallet.google.com/intl/en_us/images/saveToGoogleWallet/save-to-google-wallet-button-en-us.svg"
              alt={t("walletAdd", lang)}
              style={{ height: 52, maxWidth: 250 }}
            />
          </a>
        )}

        {/* Web fallback */}
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <a href={card.cardUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: "#475569" }}>
            {t("webOpen", lang)} ↗
          </a>
        </div>

        {/* Privileges */}
        <div style={{
          background: "rgba(201,168,76,0.04)",
          border: `1px solid rgba(201,168,76,0.12)`,
          borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>
            {t("inclHdr", lang)}
          </div>
          {benefits.map((b, i) => (
            <div key={i} style={{
              ...dm, fontSize: 13, color: "#64748b",
              padding: "6px 0",
              borderBottom: i < benefits.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>{b}</div>
          ))}
        </div>
      </div>
    );
  }

  // ── Generation form ───────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg,${GOLD},${GOLD3})`,
          display: "grid", placeItems: "center", fontSize: 24,
          boxShadow: `0 4px 16px rgba(201,168,76,0.25)`,
        }}>🪪</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Rab Card</div>
          <div style={{ ...dm, fontSize: 13, color: GOLD }}>{t("sub", lang)}</div>
        </div>
      </div>

      {/* Preview card (empty) */}
      <div style={{ marginBottom: 22, opacity: 0.7 }}>
        <CardFace guestName="••••• •••••••••••" cardId="RAB-••••••••-••••" expiresAt="••••-••-••" qrUrl={null} lang={lang} />
      </div>

      {/* Privileges */}
      <div style={{
        background: "rgba(201,168,76,0.04)",
        border: `1px solid rgba(201,168,76,0.1)`,
        borderRadius: 14, padding: "14px 16px", marginBottom: 20,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>
          {t("inclHdr", lang)}
        </div>
        {benefits.map((b, i) => (
          <div key={i} style={{
            ...dm, fontSize: 13, color: C.mut,
            padding: "5px 0",
            borderBottom: i < benefits.length - 1 ? `1px solid ${C.bord}` : "none",
          }}>{b}</div>
        ))}
      </div>

      {/* Name input */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.mut, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7 }}>
          {t("nameLabel", lang)}
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
          placeholder={t("namePh", lang)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "12px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid rgba(201,168,76,0.2)`,
            color: C.text, fontSize: 15, outline: "none",
          }}
        />
      </div>

      {error && <div style={{ fontSize: 13, color: "#f87171", marginBottom: 10 }}>{error}</div>}

      <button onClick={generate} disabled={loading} style={{
        width: "100%", padding: "13px 0",
        background: loading
          ? "rgba(201,168,76,0.2)"
          : `linear-gradient(135deg,${GOLD},${GOLD3})`,
        color: loading ? GOLD : "#0a0c10",
        border: "none", borderRadius: 12,
        fontSize: 15, fontWeight: 800,
        cursor: loading ? "default" : "pointer",
        letterSpacing: ".04em",
        boxShadow: loading ? "none" : `0 4px 20px rgba(201,168,76,0.25)`,
        transition: "all .2s",
      }}>
        {loading ? t("creating", lang) : `🪪 ${t("btn", lang)}`}
      </button>

      <p style={{ ...dm, fontSize: 11, color: "#3d3520", textAlign: "center", marginTop: 10 }}>
        {t("validity", lang)}
      </p>
    </div>
  );
}
