// RestaurantFinder.jsx — Affiliate-exclusive table reservation
// Affiliate restaurants: full booking flow
// Google Places: discovery only, booking locked (exclusive partner perk)

import { useState, useEffect, useCallback } from "react";
import { AFFILIATE_DATA } from "./affiliates";

const CITY_COORDS = {
  rab:       { lat: 44.7561, lng: 14.7642, name: "Rab" },
  dubrovnik: { lat: 42.6507, lng: 18.0944, name: "Dubrovnik" },
  split:     { lat: 43.5081, lng: 16.4402, name: "Split" },
  zadar:     { lat: 44.1194, lng: 15.2314, name: "Zadar" },
  rovinj:    { lat: 45.0812, lng: 13.6388, name: "Rovinj" },
  hvar:      { lat: 43.1729, lng: 16.4412, name: "Hvar" },
  makarska:  { lat: 43.2969, lng: 17.0177, name: "Makarska" },
  pula:      { lat: 44.8666, lng: 13.8496, name: "Pula" },
  sibenik:   { lat: 43.7350, lng: 15.8952, name: "Šibenik" },
  trogir:    { lat: 43.5152, lng: 16.2511, name: "Trogir" },
};

const PRICE_LABEL = ["", "€", "€€", "€€€", "€€€€"];
const STAR = "★";

// Time slots 11:00–23:30, every 30 min
const TIME_SLOTS = [];
for (let h = 11; h <= 23; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function getDateOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const val = d.toISOString().slice(0, 10);
    const label = i === 0 ? `Danas (${val})` : i === 1 ? `Sutra (${val})` : val;
    opts.push({ val, label });
  }
  return opts;
}

// Build affiliate restaurant list for a given city name
function getAffiliateRestaurants(cityName) {
  if (!cityName) return [];
  return Object.entries(AFFILIATE_DATA)
    .filter(([, aff]) => aff.city?.toLowerCase() === cityName.toLowerCase())
    .map(([id, aff]) => ({
      affiliateId: id,
      name: aff.name,
      address: typeof aff.address === "object" ? (aff.address.hr || aff.address.en || "") : (aff.address || ""),
      rating: aff.rating,
      reviews: aff.reviewCount,
      photo: aff.heroImg,
      hours: aff.hours,
      color: aff.color || "#0ea5e9",
      tagline: aff.tagline,
      features: aff.features,
      isAffiliate: true,
    }));
}

// ─── Booking form (affiliate only) ───────────────────────────

function BookingForm({ restaurant, lang, onClose, onSuccess }) {
  const [form, setForm] = useState({
    date: getDateOptions()[0].val,
    time: "20:00",
    persons: "2",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.guestName.trim()) { setError("Unesite ime."); return; }
    if (!form.guestEmail.trim() && !form.guestPhone.trim()) { setError("Email ili telefon je obavezan."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/table-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantId: restaurant.affiliateId,
          affiliateId: restaurant.affiliateId,
          date: form.date, time: form.time,
          persons: parseInt(form.persons) || 2,
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          message: form.message,
          lang: lang || "hr",
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Greška. Pokušajte ponovo."); return; }
      onSuccess(data.id);
    } catch { setError("Greška mreže. Provjerite vezu."); }
    finally { setLoading(false); }
  }

  const inp = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(14,165,233,0.2)",
    color: "#e2e8f0", fontSize: 14, outline: "none",
  };
  const dateOpts = getDateOptions();

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0d1e35", border: "1px solid rgba(14,165,233,0.2)",
        borderRadius: "20px 20px 0 0", padding: "24px 20px 32px",
        width: "100%", maxWidth: 480,
        maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f9ff" }}>{restaurant.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {({ hr:"Rezervacija stola", en:"Table reservation", de:"Tischreservierung", it:"Prenotazione tavolo" })[lang] || "Rezervacija stola"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={submit}>
          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Datum</div>
              <select value={form.date} onChange={e => set("date", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {dateOpts.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Sat</div>
              <select value={form.time} onChange={e => set("time", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Persons */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 8, textTransform: "uppercase" }}>Broj osoba</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["1","2","3","4","5","6","7","8"].map(n => (
                <button key={n} type="button" onClick={() => set("persons", n)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid",
                  borderColor: form.persons === n ? "#0ea5e9" : "rgba(14,165,233,0.15)",
                  background: form.persons === n ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.03)",
                  color: form.persons === n ? "#38bdf8" : "#64748b",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Ime i prezime</div>
            <input value={form.guestName} onChange={e => set("guestName", e.target.value)} placeholder="Vaše ime..." style={inp} />
          </div>

          {/* Email + Phone */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Email</div>
              <input type="email" value={form.guestEmail} onChange={e => set("guestEmail", e.target.value)} placeholder="vas@email.com" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Telefon</div>
              <input type="tel" value={form.guestPhone} onChange={e => set("guestPhone", e.target.value)} placeholder="+385..." style={inp} />
            </div>
          </div>

          {/* Message */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Poruka (opcionalno)</div>
            <textarea value={form.message} onChange={e => set("message", e.target.value)}
              placeholder="Posebne želje, alergije, povod..." rows={2}
              style={{ ...inp, resize: "none" }} />
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "13px 0",
            background: loading ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg,#0ea5e9,#0284c7)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 700, cursor: loading ? "default" : "pointer",
            letterSpacing: ".02em",
          }}>
            {loading ? "Šalje se..." : "Pošalji rezervaciju →"}
          </button>
          <p style={{ fontSize: 11, color: "#475569", textAlign: "center", margin: "10px 0 0" }}>
            Restoran će Vas kontaktirati za potvrdu.
          </p>
        </form>
      </div>
    </div>
  );
}

function SuccessScreen({ bookingId, restaurantName, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: "#0f1e35", border: "1px solid rgba(34,197,94,0.3)",
        borderRadius: 20, padding: "32px 24px", width: "100%", maxWidth: 380, textAlign: "center",
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🍽️</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>Rezervacija poslana!</div>
        <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 20 }}>{restaurantName}</div>
        <div style={{ fontFamily: "monospace", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: 8, padding: "8px 16px", fontSize: 15, color: "#38bdf8", marginBottom: 20, display: "inline-block" }}>{bookingId}</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          Sačuvajte ovaj kod. Restoran će Vas kontaktirati za potvrdu unutar 2 sata. Na email smo poslali potvrdu.
        </p>
        <button onClick={onClose} style={{
          padding: "12px 32px", background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>Zatvori</button>
      </div>
    </div>
  );
}

// ─── Affiliate restaurant card (full booking) ────────────────

function AffiliateCard({ restaurant, lang, onBook }) {
  const stars = Math.round(restaurant.rating || 0);
  const tagline = typeof restaurant.tagline === "object"
    ? (restaurant.tagline[lang] || restaurant.tagline.en || restaurant.tagline.hr || "")
    : (restaurant.tagline || "");
  const hours = typeof restaurant.hours === "object"
    ? (restaurant.hours[lang] || restaurant.hours.en || restaurant.hours.hr || "")
    : (restaurant.hours || "");

  return (
    <div style={{
      background: "#0f1e35",
      border: `1px solid ${restaurant.color}40`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: `0 0 0 1px ${restaurant.color}18`,
      position: "relative",
    }}>
      {/* Partner badge */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 2,
        background: "linear-gradient(135deg,#FFB800,#f59e0b)",
        borderRadius: 6, padding: "3px 8px",
        fontSize: 10, fontWeight: 800, color: "#0a0f1a",
        letterSpacing: ".06em", textTransform: "uppercase",
      }}>⭐ Partner</div>

      {/* Photo */}
      {restaurant.photo ? (
        <div style={{ height: 150, overflow: "hidden" }}>
          <img src={restaurant.photo} alt={restaurant.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        </div>
      ) : (
        <div style={{ height: 80, background: `${restaurant.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🍽️</div>
      )}

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f9ff", marginBottom: 2 }}>{restaurant.name}</div>
        {tagline && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>{tagline}</div>}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {restaurant.rating && (
            <span style={{ fontSize: 12, color: "#fbbf24" }}>
              {STAR.repeat(stars)}<span style={{ color: "#475569" }}>{"★".repeat(5 - stars)}</span>
              <span style={{ color: "#94a3b8", marginLeft: 4 }}>{restaurant.rating.toFixed(1)}</span>
              {restaurant.reviews > 0 && <span style={{ color: "#475569" }}> ({restaurant.reviews})</span>}
            </span>
          )}
        </div>

        {hours && (
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>🕐 {hours}</div>
        )}

        <button onClick={() => onBook(restaurant)} style={{
          width: "100%", padding: "11px 0",
          background: `linear-gradient(135deg,${restaurant.color},${restaurant.color}cc)`,
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: ".02em",
        }}>
          🗓 Rezerviši stol
        </button>
      </div>
    </div>
  );
}

// ─── Regular (non-affiliate) card — discovery only ───────────

function DiscoveryCard({ place, lang }) {
  const stars = Math.round(place.rating || 0);
  const locked = {
    hr: "Rezervacije samo za Jadran.ai partnere",
    en: "Reservations exclusive to Jadran.ai partners",
    de: "Reservierungen nur für Jadran.ai-Partner",
    it: "Prenotazioni esclusive per i partner Jadran.ai",
  };

  return (
    <div style={{
      background: "#0a1422",
      border: "1px solid rgba(14,165,233,0.08)",
      borderRadius: 16, overflow: "hidden",
      opacity: 0.85,
    }}>
      {/* Photo */}
      {place.photo ? (
        <div style={{ height: 130, overflow: "hidden" }}>
          <img src={place.photo} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.75)" }} loading="lazy" />
        </div>
      ) : (
        <div style={{ height: 70, background: "rgba(14,165,233,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, opacity: 0.5 }}>🍽️</div>
      )}

      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#94a3b8", marginBottom: 2 }}>{place.name}</div>
        {place.address && (
          <div style={{ fontSize: 11, color: "#334155", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          {place.rating && (
            <span style={{ fontSize: 11, color: "#78716c" }}>
              {STAR.repeat(stars)}<span style={{ color: "#292524" }}>{"★".repeat(5 - stars)}</span>
              <span style={{ color: "#57534e", marginLeft: 4 }}>{place.rating.toFixed(1)}</span>
              {place.reviews > 0 && <span style={{ color: "#44403c" }}> ({place.reviews})</span>}
            </span>
          )}
          {place.price_level && (
            <span style={{ fontSize: 11, color: "#57534e", fontWeight: 600 }}>{PRICE_LABEL[place.price_level]}</span>
          )}
        </div>

        {/* Locked booking */}
        <div style={{
          width: "100%", padding: "9px 0",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10, textAlign: "center",
          fontSize: 11, color: "#475569",
          cursor: "default",
        }}>
          🔒 {locked[lang] || locked.en}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

export default function RestaurantFinder({ lang = "hr", initialCity = "rab" }) {
  const [city, setCity]       = useState(initialCity);
  const [places, setPlaces]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const [successName, setSuccessName] = useState("");

  // Google Places fetch (for discovery section)
  const load = useCallback(async (c) => {
    const coords = CITY_COORDS[c];
    if (!coords) return;
    setLoading(true);
    setPlaces([]);
    try {
      const r = await fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&type=restaurant&radius=2500`);
      const data = await r.json();
      setPlaces(data.places || []);
    } catch { setPlaces([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(city); }, [city, load]);

  const cityName = CITY_COORDS[city]?.name || "";
  const affiliateRests = getAffiliateRestaurants(cityName);

  // Filter out affiliate restaurants from Google Places to avoid duplicates
  const affiliateNames = new Set(affiliateRests.map(a => a.name.toLowerCase()));
  const discoveryPlaces = places.filter(p => !affiliateNames.has(p.name?.toLowerCase()));

  const TL = {
    partner: { hr: "Partner restorani", en: "Partner restaurants", de: "Partnerrestaurants", it: "Ristoranti partner" },
    more:    { hr: "Više restorana u gradu", en: "More restaurants in town", de: "Weitere Restaurants", it: "Altri ristoranti" },
    noPartner: {
      hr: "Nema partner restorana u ovom gradu — još.", en: "No partner restaurants in this city — yet.",
      de: "Noch keine Partnerrestaurants in dieser Stadt.", it: "Ancora nessun ristorante partner in questa città.",
    },
    partnerNote: {
      hr: "Jedino Jadran.ai partneri nude online rezervaciju stola s email potvrdom.",
      en: "Only Jadran.ai partner restaurants offer online table booking with email confirmation.",
      de: "Nur Jadran.ai-Partnerrestaurants bieten Online-Tischreservierung mit E-Mail-Bestätigung.",
      it: "Solo i ristoranti partner di Jadran.ai offrono prenotazione online con conferma email.",
    },
  };
  const tl = k => TL[k]?.[lang] || TL[k]?.en || "";

  return (
    <div style={{ color: "#e2e8f0", paddingBottom: 32 }}>
      {/* City selector */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(CITY_COORDS).map(([id, c]) => (
          <button key={id} onClick={() => setCity(id)} style={{
            padding: "6px 13px", borderRadius: 18, border: "1px solid",
            borderColor: city === id ? "#0ea5e9" : "rgba(14,165,233,0.18)",
            background: city === id ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.03)",
            color: city === id ? "#38bdf8" : "#64748b",
            fontSize: 12, fontWeight: city === id ? 700 : 400, cursor: "pointer",
          }}>{c.name}</button>
        ))}
      </div>

      {/* Partner restaurants section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#FFB800", letterSpacing: ".04em", textTransform: "uppercase" }}>
            ⭐ {tl("partner")}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>{tl("partnerNote")}</div>

        {affiliateRests.length === 0 ? (
          <div style={{
            background: "rgba(255,184,0,0.04)", border: "1px solid rgba(255,184,0,0.12)",
            borderRadius: 12, padding: "20px 16px", textAlign: "center",
            fontSize: 13, color: "#78716c",
          }}>
            {tl("noPartner")}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {affiliateRests.map(r => (
              <AffiliateCard key={r.affiliateId} restaurant={r} lang={lang} onBook={rest => {
                setSuccessId(null);
                setBooking(rest);
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Discovery section (no booking) */}
      {(loading || discoveryPlaces.length > 0) && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>
            {tl("more")}
          </div>
          {loading && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#334155", fontSize: 13 }}>Učitavam...</div>
          )}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {discoveryPlaces.map(p => (
                <DiscoveryCard key={p.place_id || p.name} place={p} lang={lang} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking modal */}
      {booking && !successId && (
        <BookingForm
          restaurant={booking}
          lang={lang}
          onClose={() => setBooking(null)}
          onSuccess={id => { setSuccessId(id); setSuccessName(booking.name); setBooking(null); }}
        />
      )}
      {successId && (
        <SuccessScreen
          bookingId={successId}
          restaurantName={successName}
          onClose={() => setSuccessId(null)}
        />
      )}
    </div>
  );
}
