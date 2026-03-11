// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Landing Page
// For direct visitors to jadran.ai (no ?room= parameter)
// Booking.com affiliate + room code entry + host CTA
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const BKG = (city, params="") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

const DESTINATIONS = [
  { name: "Split & Podstrana", emoji: "🏛️", desc: "Dioklecijanova palača, Bačvice, Marjan", link: BKG("Split, Croatia"), region: "Dalmacija", city: "Split" },
  { name: "Makarska rivijera", emoji: "🏖️", desc: "Najljepše plaže Jadrana", link: BKG("Makarska, Croatia"), region: "Dalmacija", city: "Makarska" },
  { name: "Hvar", emoji: "🌿", desc: "Lavanda, glamur, noćni život", link: BKG("Hvar, Croatia"), region: "Otoci", city: "Hvar" },
  { name: "Rovinj", emoji: "⛪", desc: "Najromantičniji grad Istre", link: BKG("Rovinj, Croatia"), region: "Istra", city: "Rovinj" },
  { name: "Pula", emoji: "🏟️", desc: "Rimska arena, obiteljske plaže", link: BKG("Pula, Croatia"), region: "Istra", city: "Pula" },
  { name: "Opatija", emoji: "⚓", desc: "Elegancija Kvarnera", link: BKG("Opatija, Croatia"), region: "Kvarner", city: "Opatija" },
  { name: "Dubrovnik", emoji: "🏰", desc: "Biser Jadrana, gradske zidine", link: BKG("Dubrovnik, Croatia"), region: "Dalmacija", city: "Dubrovnik" },
  { name: "Zadar", emoji: "🌅", desc: "Morske orgulje, najljepši zalazak", link: BKG("Zadar, Croatia"), region: "Dalmacija", city: "Zadar" },
];

const STEPS = [
  { num: "01", icon: "🏠", title: "Domaćin kreira apartman", desc: "Registrira smještaj i generira jedinstveni QR kod" },
  { num: "02", icon: "📱", title: "Gost skenira QR", desc: "Na zidu apartmana — unosi profil i interese" },
  { num: "03", icon: "🌊", title: "Osobni vodič 24/7", desc: "Provjerene preporuke, lokalni savjeti, rezervacije" },
];

export default function LandingPage() {
  const [lang, setLang] = useState("hr");
  const [roomInput, setRoomInput] = useState("");
  const [anim, setAnim] = useState(false);
  const [cityImgs, setCityImgs] = useState({});

  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

  // Load Wikipedia images for destination cards
  useEffect(() => {
    DESTINATIONS.forEach(d => {
      fetch(`/api/cityimg?city=${encodeURIComponent(d.city)}`)
        .then(r => r.json())
        .then(data => {
          if (data.url) setCityImgs(prev => ({ ...prev, [d.city]: data.url }));
        })
        .catch(() => {});
    });
  }, []);

  const goRoom = () => {
    const code = roomInput.trim().toUpperCase();
    if (code) window.location.href = `/?room=${encodeURIComponent(code)}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a1628 0%, #0e3a5c 50%, #134e6f 100%)", color: "#f0f9ff", fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ═══ HERO ═══ */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, color: "#fff", boxShadow: "0 4px 16px rgba(14,165,233,0.25)" }}>J</div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1 }}>Jadran</div>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 3, fontWeight: 500 }}>VODIČ</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/host" style={{ padding: "10px 20px", borderRadius: 12, border: "1px solid rgba(14,165,233,0.15)", color: "#7dd3fc", fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
              🏠 Host Panel
            </a>
          </div>
        </div>

        {/* Hero content */}
        <div style={{
          padding: "clamp(40px, 8vw, 80px) 0 clamp(30px, 6vw, 60px)", textAlign: "center",
          opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🌊</div>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 400, lineHeight: 1.1,
            background: "linear-gradient(135deg, #f0f9ff 30%, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 16,
          }}>
            Lokalni vodič<br />za savršen Jadran
          </h1>
          <p style={{ fontSize: 18, color: "#7dd3fc", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.6, fontWeight: 300 }}>
            Provjerene preporuke od lokalaca, skrivene plaže, najbolji restorani — za sve koji vole Jadran. Dostupno na 8 jezika.
          </p>

          {/* Primary CTAs */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
            <a href="/ai" style={{
              flex: "1 1 260px", padding: "24px 28px", borderRadius: 22, textDecoration: "none",
              background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(2,132,199,0.06))",
              border: "1px solid rgba(14,165,233,0.2)",
              display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.3s", cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(14,165,233,0.4)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(14,165,233,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>🗺️</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 19, color: "#f0f9ff", marginBottom: 3 }}>Lokalni vodič</div>
                <div style={{ fontSize: 12, color: "#7dd3fc", lineHeight: 1.4 }}>Plaže, restorani, skrivena mjesta — pitajte bilo što</div>
              </div>
            </a>
            <a href="/ai" style={{
              flex: "1 1 260px", padding: "24px 28px", borderRadius: 22, textDecoration: "none",
              background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))",
              border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.3s", cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "rgba(245,158,11,0.2)"; e.currentTarget.style.boxShadow = ""; }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "grid", placeItems: "center", fontSize: 24, flexShrink: 0 }}>🚐</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 19, color: "#f0f9ff", marginBottom: 3 }}>Kamper vodič</div>
                <div style={{ fontSize: 12, color: "#fbbf24", lineHeight: 1.4 }}>Parking, dump station, voda, legalna noćenja</div>
              </div>
            </a>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 14 }}>
            3 besplatna pitanja · Premium 5.99€ · 8 jezika
          </div>
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <div style={{ background: "rgba(0,0,0,0.15)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#0ea5e9", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>KAKO FUNKCIONIRA</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 400 }}>Tri koraka do savršenog odmora</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                padding: 28, borderRadius: 22,
                background: "rgba(12,28,50,0.6)", border: "1px solid rgba(14,165,233,0.08)",
                backdropFilter: "blur(12px)", textAlign: "center",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>KORAK {s.num}</div>
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#7dd3fc", lineHeight: 1.6, fontWeight: 300 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ DESTINATIONS ═══ */}
      <div style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: "#f59e0b", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>DESTINACIJE</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 400 }}>Otkrijte Jadran</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {DESTINATIONS.map((d, i) => (
              <a key={i} href={d.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  padding: 0, borderRadius: 20, overflow: "hidden", position: "relative",
                  background: "#0c1c32", border: "1px solid rgba(14,165,233,0.06)",
                  cursor: "pointer", transition: "all 0.3s", minHeight: 200,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.25)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.06)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  {/* Photo background */}
                  {cityImgs[d.city] && <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${cityImgs[d.city]})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    transition: "transform 0.5s",
                  }} className="dest-img" />}
                  {/* Dark gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(6,14,28,0.92) 0%, rgba(6,14,28,0.5) 50%, rgba(6,14,28,0.25) 100%)" }} />
                  {/* Content */}
                  <div style={{ position: "relative", padding: 20, display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 200 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", padding: "3px 10px", borderRadius: 10, background: "rgba(14,165,233,0.15)", backdropFilter: "blur(4px)" }}>{d.region}</span>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, fontWeight: 400, marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 10 }}>{d.desc}</div>
                    <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>Booking.com →</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ROOM CODE (for apartment guests) ═══ */}
      <div style={{ padding: "48px 24px", background: "rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#7dd3fc", letterSpacing: 4, fontWeight: 600, marginBottom: 8 }}>VEĆ IMATE SOBU?</div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 400, marginBottom: 16 }}>Unesite kod iz apartmana</div>
          <div style={{
            display: "inline-flex", gap: 8, padding: 6, borderRadius: 18,
            background: "rgba(12,28,50,0.7)", border: "1px solid rgba(14,165,233,0.08)",
          }}>
            <input
              type="text"
              placeholder="npr. JADRAN-AB34"
              value={roomInput}
              onChange={e => setRoomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && goRoom()}
              style={{
                padding: "12px 18px", borderRadius: 14, border: "none",
                background: "transparent", color: "#fff", fontSize: 14,
                outline: "none", width: "min(220px, 50vw)", fontFamily: "inherit",
              }}
            />
            <button onClick={goRoom} style={{
              padding: "12px 22px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>Otvori →</button>
          </div>
        </div>
      </div>

      {/* ═══ PREMIUM CTA ═══ */}
      <div style={{ padding: "40px 24px 60px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto", padding: "40px 32px",
          borderRadius: 24, textAlign: "center",
          background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(14,165,233,0.04))",
          border: "1px solid rgba(245,158,11,0.1)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, marginBottom: 8 }}>Premium za 5.99€</div>
          <div style={{ fontSize: 14, color: "#7dd3fc", maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Neograničeni razgovori s lokalnim vodičem, skrivena mjesta, detaljna prognoza, praćenje troškova — cijeli boravak.
          </div>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            {["💬 Lokalni vodič", "💎 Skrivena mjesta", "🍽️ Restorani", "🗺️ Tajne rute", "☀️ Detaljna prognoza", "💰 Praćenje troškova"].map(f => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ HOST CTA ═══ */}
      <div style={{ padding: "0 24px 60px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto", padding: "32px",
          borderRadius: 24, textAlign: "center",
          background: "rgba(12,28,50,0.5)", border: "1px dashed rgba(14,165,233,0.15)",
        }}>
          <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, marginBottom: 8 }}>Iznajmljujete apartman?</div>
          <div style={{ fontSize: 14, color: "#7dd3fc", marginBottom: 20, lineHeight: 1.6 }}>
            Ponudite gostima osobnog digitalnog vodiča. Bolji recenzije, manje pitanja, dodatni prihod od preporuka.
          </div>
          <a href="/host" style={{
            display: "inline-block", padding: "14px 32px", borderRadius: 16,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            color: "#fff", fontSize: 16, fontWeight: 600, textDecoration: "none",
            fontFamily: "'DM Serif Display', Georgia, serif",
            boxShadow: "0 6px 24px rgba(14,165,233,0.2)",
          }}>Registrirajte apartman →</a>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div style={{ borderTop: "1px solid rgba(14,165,233,0.06)", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 2 }}>
          JADRAN · SIAL Consulting d.o.o.
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(14,165,233,0.3); }
        .dest-img { transition: transform 0.5s ease !important; }
        a:hover .dest-img { transform: scale(1.08) !important; }
        @media (max-width: 768px) {
          input[style] { width: 180px !important; }
        }
      `}</style>
    </div>
  );
}
