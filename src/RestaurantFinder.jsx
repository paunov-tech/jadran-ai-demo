// RestaurantFinder.jsx — Live restaurant discovery + table reservation
// Route: /restaurants
// Uses: /api/places (Google Places) + /api/table-book

import { useState, useEffect, useCallback } from "react";

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

// Next 14 days
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

function BookingForm({ restaurant, onClose, onSuccess }) {
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
    if (!form.guestName.trim()) return setError("Unesite ime");
    if (!form.guestEmail.trim() && !form.guestPhone.trim()) return setError("Email ili telefon obavezan");
    setLoading(true);
    try {
      const r = await fetch("/api/table-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName:    restaurant.name,
          restaurantAddress: restaurant.address,
          restaurantId:      restaurant.place_id,
          ...form,
          persons: parseInt(form.persons),
          lang: "hr",
        }),
      });
      const data = await r.json();
      if (!r.ok) return setError(data.error || "Greška pri slanju");
      onSuccess(data.id);
    } catch { setError("Greška mreže — pokušajte ponovo"); }
    finally { setLoading(false); }
  }

  const inp = {
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(14,165,233,0.25)",
    borderRadius: 8, padding: "9px 12px", fontSize: 14, color: "#e2e8f0",
    width: "100%", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#0f1e35", border: "1px solid rgba(14,165,233,0.25)",
        borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 420,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginBottom: 3 }}>REZERVACIJA STOLA</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#f0f9ff" }}>{restaurant.name}</div>
            {restaurant.address && <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{restaurant.address}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit}>
          {/* Date + Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Datum</div>
              <select value={form.date} onChange={e => set("date", e.target.value)} style={inp}>
                {getDateOptions().map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Sat</div>
              <select value={form.time} onChange={e => set("time", e.target.value)} style={inp}>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Persons */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Broj osoba</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <button key={n} type="button" onClick={() => set("persons", String(n))} style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid",
                  borderColor: form.persons === String(n) ? "#0ea5e9" : "rgba(14,165,233,0.2)",
                  background: form.persons === String(n) ? "rgba(14,165,233,0.2)" : "rgba(255,255,255,0.03)",
                  color: form.persons === String(n) ? "#38bdf8" : "#64748b",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: ".06em", marginBottom: 5, textTransform: "uppercase" }}>Vaše ime *</div>
            <input value={form.guestName} onChange={e => set("guestName", e.target.value)} placeholder="Ime i prezime" style={inp} />
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

          {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>{error}</div>}

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

function RestaurantCard({ place, onBook }) {
  const stars = Math.round(place.rating || 0);
  return (
    <div style={{
      background: "#0f1e35", border: "1px solid rgba(14,165,233,0.12)",
      borderRadius: 16, overflow: "hidden",
      transition: "border-color .2s",
    }}>
      {/* Photo */}
      {place.photo ? (
        <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
          <img src={place.photo} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {place.open_now === false && (
            <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#fff", fontWeight: 700 }}>ZATVORENO</div>
          )}
          {place.open_now === true && (
            <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(34,197,94,0.9)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#fff", fontWeight: 700 }}>OTVORENO</div>
          )}
        </div>
      ) : (
        <div style={{ height: 80, background: "rgba(14,165,233,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🍽️</div>
      )}

      {/* Info */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f9ff", marginBottom: 4, lineHeight: 1.3 }}>{place.name}</div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.address}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          {place.rating && (
            <span style={{ fontSize: 12, color: "#fbbf24" }}>
              {STAR.repeat(stars)}<span style={{ color: "#64748b" }}>{"★".repeat(5 - stars)}</span>
              <span style={{ color: "#94a3b8", marginLeft: 4 }}>{place.rating.toFixed(1)}</span>
              {place.reviews > 0 && <span style={{ color: "#475569" }}> ({place.reviews})</span>}
            </span>
          )}
          {place.price_level && (
            <span style={{ fontSize: 12, color: "#22d3ee", fontWeight: 600 }}>{PRICE_LABEL[place.price_level]}</span>
          )}
        </div>

        <button onClick={() => onBook(place)} style={{
          width: "100%", padding: "10px 0",
          background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
          color: "#fff", border: "none", borderRadius: 10,
          fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: ".02em",
        }}>
          🗓 Rezerviši stol
        </button>
      </div>
    </div>
  );
}

export default function RestaurantFinder({ lang = "hr", initialCity = "rab" }) {
  const [city, setCity]         = useState(initialCity);
  const [places, setPlaces]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [booking, setBooking]   = useState(null);   // restaurant being booked
  const [successId, setSuccessId] = useState(null);

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

  const T = {
    title: { hr: "Restorani & Konobe", en: "Restaurants & Konobas", de: "Restaurants", it: "Ristoranti" },
    sub:   { hr: "Pronađi i rezerviši stol u jednom koraku", en: "Find and book a table in one step", de: "Tisch reservieren in einem Schritt", it: "Trova e prenota un tavolo in un passo" },
    empty: { hr: "Nema dostupnih rezultata za ovaj grad.", en: "No results for this city.", de: "Keine Ergebnisse für diese Stadt.", it: "Nessun risultato per questa città." },
  };
  const t = k => T[k]?.[lang] || T[k]?.en || "";

  return (
    <div style={{ minHeight: "100vh", background: "#060f1e", color: "#e2e8f0", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 24px" }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f9ff", marginBottom: 6 }}>🍽️ {t("title")}</div>
        <div style={{ fontSize: 14, color: "#64748b" }}>{t("sub")}</div>
      </div>

      {/* City selector */}
      <div style={{ maxWidth: 900, margin: "0 auto 20px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.entries(CITY_COORDS).map(([id, c]) => (
          <button key={id} onClick={() => setCity(id)} style={{
            padding: "7px 14px", borderRadius: 20, border: "1px solid",
            borderColor: city === id ? "#0ea5e9" : "rgba(14,165,233,0.2)",
            background: city === id ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.03)",
            color: city === id ? "#38bdf8" : "#94a3b8",
            fontSize: 13, fontWeight: city === id ? 700 : 400, cursor: "pointer",
            transition: "all .15s",
          }}>{c.name}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14 }}>Učitavam restorane...</div>
          </div>
        )}
        {!loading && places.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#475569", fontSize: 14 }}>{t("empty")}</div>
        )}
        {!loading && places.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {places.map(p => (
              <RestaurantCard key={p.place_id} place={p} onBook={setBooking} />
            ))}
          </div>
        )}
      </div>

      {/* Powered by note */}
      <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: "#1e3a5f" }}>
        Powered by Google Places · JADRAN.ai
      </div>

      {/* Booking modal */}
      {booking && !successId && (
        <BookingForm
          restaurant={booking}
          onClose={() => setBooking(null)}
          onSuccess={id => { setSuccessId(id); setBooking(null); }}
        />
      )}
      {successId && (
        <SuccessScreen
          bookingId={successId}
          restaurantName={booking?.name || ""}
          onClose={() => setSuccessId(null)}
        />
      )}
    </div>
  );
}
