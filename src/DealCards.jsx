// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Deal Cards Component
// Reads from Firestore jadran_deals/latest, renders in Kiosk/Explore
// Drop into App.jsx KioskHome or DestinationExplorer
// ═══════════════════════════════════════════════════════════════

// ─── USAGE IN APP.JSX (KioskHome) ───
// Import: import { DealCards } from "./DealCards";
// Place after weather widget:
//   <DealCards region={getDestRegion(kioskCity)} lang={lang} C={C} />
//
// ─── USAGE IN DestinationExplorer.jsx ───
// Place in Offers section, replace static OFFERS with:
//   <DealCards region="all" lang={lang} />

import { useState, useEffect } from "react";

const F = "'Playfair Display','Georgia',serif";
const B = "'Outfit','system-ui',sans-serif";

// Badge colors by source
const BADGE_COLORS = {
  partner: "#0ea5e9",
  gyg: "#22c55e",
  viator: "#34d399",
  default: "#94a3b8",
};

export function DealCards({ region = "all", lang = "de", C, maxCards = 6 }) {
  const [deals, setDeals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from Firestore REST API (no SDK needed)
    const fetchDeals = async () => {
      try {
        const resp = await fetch(
          "https://firestore.googleapis.com/v1/projects/molty-portal/databases/(default)/documents/jadran_deals/latest"
        );
        if (!resp.ok) throw new Error("fetch failed");
        const doc = await resp.json();
        const raw = doc.fields?.data?.stringValue;
        if (raw) {
          const parsed = JSON.parse(raw);
          setDeals(parsed);
        }
      } catch (e) {
        console.warn("[DealCards] fetch failed:", e);
      }
      setLoading(false);
    };
    fetchDeals();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              minWidth: 240, height: 200, borderRadius: 16,
              background: "rgba(14,165,233,0.04)",
              border: "1px solid rgba(14,165,233,0.06)",
              animation: "pulse 2s infinite",
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!deals?.regions) return null;

  // Flatten deals for region or all
  let cards = [];
  if (region === "all") {
    for (const r of Object.values(deals.regions)) {
      if (Array.isArray(r)) cards.push(...r);
    }
  } else {
    cards = deals.regions[region] || [];
  }

  if (cards.length === 0) return null;
  cards = cards.slice(0, maxCards);

  // Theme colors (use provided C or defaults)
  const colors = C || {
    accent: "#0ea5e9", text: "#f0f4f8", mut: "#64748b",
    bord: "rgba(14,165,233,0.07)", card: "rgba(10,22,42,0.88)",
    gold: "#f59e0b", goBorder: "rgba(245,158,11,0.22)",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section label */}
      <div style={{
        fontFamily: B, fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
        fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
        color: colors.gold,
      }}>
        <span style={{
          width: 14, height: 1,
          background: `linear-gradient(90deg, ${colors.gold}, transparent)`,
        }} />
        {({ hr: "PONUDE OVOG TJEDNA", de: "ANGEBOTE DIESER WOCHE", en: "THIS WEEK'S DEALS", it: "OFFERTE DELLA SETTIMANA" })[lang === "at" ? "de" : lang] || "DEALS"}
      </div>

      {/* Horizontal scroll cards */}
      <div style={{
        display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12,
        WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory",
        margin: "0 -4px", padding: "0 4px 12px",
      }}>
        {cards.map((deal, i) => (
          <a
            key={deal.name + i}
            href={deal.cta_url || "#"}
            target={deal.source === "gyg" || deal.source === "viator" ? "_blank" : "_self"}
            rel="noopener noreferrer"
            style={{
              minWidth: 260, maxWidth: 300, flexShrink: 0,
              borderRadius: 18, overflow: "hidden",
              border: `1px solid ${deal.source === "partner" ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.05)"}`,
              textDecoration: "none", color: colors.text,
              boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
              scrollSnapAlign: "start",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              background: colors.card,
            }}
          >
            {/* Image */}
            <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
              {deal.image_url ? (
                <img
                  src={deal.image_url}
                  alt={deal.name}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(135deg, #0c2d48, #134e6f)",
                  display: "grid", placeItems: "center",
                  fontSize: 32, color: "rgba(255,255,255,0.2)",
                }}>J</div>
              )}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(0deg, rgba(5,13,26,0.7) 0%, transparent 50%)",
              }} />

              {/* Badge */}
              <div style={{
                position: "absolute", top: 10, left: 10,
                padding: "3px 10px", borderRadius: 7,
                background: (deal.badge_color || BADGE_COLORS[deal.source] || BADGE_COLORS.default) + "22",
                border: `1px solid ${(deal.badge_color || BADGE_COLORS[deal.source] || BADGE_COLORS.default)}44`,
                fontSize: 9, fontWeight: 700,
                color: deal.badge_color || BADGE_COLORS[deal.source] || BADGE_COLORS.default,
                letterSpacing: 1, textTransform: "uppercase",
                fontFamily: B,
              }}>
                {deal.badge || (deal.source === "partner" ? "PARTNER" : deal.source?.toUpperCase())}
              </div>

              {/* Price */}
              <div style={{
                position: "absolute", bottom: 10, right: 10,
                display: "flex", alignItems: "baseline", gap: 6,
              }}>
                {deal.original_price_eur && deal.original_price_eur > deal.price_eur && (
                  <span style={{
                    fontSize: 12, color: "rgba(255,255,255,0.4)",
                    textDecoration: "line-through", fontFamily: B,
                  }}>{deal.original_price_eur}€</span>
                )}
                <span style={{
                  padding: "4px 10px", borderRadius: 8,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  fontSize: 16, fontWeight: 700, color: "#22c55e",
                  fontFamily: F,
                }}>{deal.price_eur}€</span>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: "14px 14px 16px" }}>
              <div style={{
                fontFamily: B, fontSize: 14, fontWeight: 600,
                lineHeight: 1.3, marginBottom: 3,
                overflow: "hidden", textOverflow: "ellipsis",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>{deal.name}</div>

              {/* Rating */}
              {deal.rating && (
                <div style={{
                  fontFamily: B, fontSize: 11, color: colors.mut,
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ color: "#facc15" }}>★ {deal.rating}</span>
                  {deal.review_count > 0 && <span>({deal.review_count})</span>}
                  {deal.price_note && <span>· {deal.price_note}</span>}
                </div>
              )}

              {/* AI Pitch */}
              {deal.ai_pitch && (
                <div style={{
                  fontFamily: B, fontSize: 12, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.5, marginBottom: 10,
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                  fontStyle: "italic",
                }}>"{deal.ai_pitch}"</div>
              )}

              {/* Drive info */}
              {deal.drive_info && (
                <div style={{
                  display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10,
                }}>
                  {Object.entries(deal.drive_info).slice(0, 2).map(([city, info]) => (
                    <span key={city} style={{
                      fontFamily: B, fontSize: 9, color: colors.mut,
                      padding: "2px 8px", borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${colors.bord}`,
                    }}>{city}: {info}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div style={{
                fontFamily: B, fontSize: 12, fontWeight: 700,
                color: deal.source === "partner" ? colors.accent : "#22c55e",
                letterSpacing: 0.3,
              }}>
                {deal.cta_label || (deal.source === "partner" ? "Guide öffnen →" : "Buchen →")}
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Updated timestamp */}
      {deals.generated_at && (
        <div style={{
          fontFamily: B, fontSize: 9, color: "rgba(100,116,139,0.3)",
          textAlign: "right",
        }}>
          R09-HUNTER · {new Date(deals.generated_at).toLocaleString("hr", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
        </div>
      )}
    </div>
  );
}
