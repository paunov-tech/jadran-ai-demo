// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Landing Page
// For direct visitors to jadran.ai (no ?room= parameter)
// Booking.com affiliate + room code entry + host CTA
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const BKG = (city, params="") => `https://www.booking.com/searchresults.html?aid=101704203&ss=${encodeURIComponent(city)}&lang=en${params}`;

const DESTINATIONS = [
  { name: "Split & Podstrana", emoji: "🏛️", desc: "Dioklecijanova palača, Bačvice, Marjan", link: BKG("Split, Croatia"), region: "Dalmacija",
    sky: "M0,50 L0,42 C5,38 10,28 18,20 C22,17 25,18 28,24 L32,34 L35,40 L38,42 L40,44 L42,43 L44,42 L46,43 L48,42 L50,41 L52,42 L55,43 L57,42 L59,40 L60,38 L61,14 L62,10 L63,14 L64,38 L65,40 L68,42 L70,43 L72,42 L75,43 L78,44 L82,43 L85,44 L90,45 L95,46 L100,48 L100,50 Z" },
  { name: "Makarska rivijera", emoji: "🏖️", desc: "Najljepše plaže Jadrana", link: BKG("Makarska, Croatia"), region: "Dalmacija",
    sky: "M0,50 L0,48 L5,46 L8,45 L12,44 L15,43 L18,42 L20,40 L22,36 L24,30 L26,22 L28,16 L30,12 L32,9 L34,7 L36,6 L38,7 L40,8 L42,10 L44,12 L46,11 L48,13 L50,15 L52,14 L54,16 L56,18 L58,20 L60,22 L62,25 L64,28 L66,32 L68,35 L70,38 L72,40 L75,42 L80,44 L85,46 L90,47 L95,48 L100,49 L100,50 Z" },
  { name: "Hvar", emoji: "🌿", desc: "Lavanda, glamur, noćni život", link: BKG("Hvar, Croatia"), region: "Otoci",
    sky: "M0,50 L5,48 L10,46 L12,45 L15,44 L18,43 L20,42 L22,41 L24,40 L25,38 L26,34 L27,30 L28,34 L30,38 L32,40 L34,42 L36,40 L38,38 L40,36 L42,34 L44,32 L46,30 L48,28 L50,26 L52,24 L54,22 L56,20 L58,18 L60,16 L62,14 L64,16 L66,20 L68,24 L70,30 L72,36 L75,40 L78,44 L82,46 L88,48 L95,49 L100,50 Z" },
  { name: "Rovinj", emoji: "⛪", desc: "Najromantičniji grad Istre", link: BKG("Rovinj, Croatia"), region: "Istra",
    sky: "M0,50 L8,48 L12,47 L16,46 L20,44 L24,42 L27,40 L30,38 L33,36 L36,33 L39,30 L42,26 L44,22 L46,18 L47,14 L48,10 L48.5,5 L49,3 L49.5,5 L50,10 L51,14 L52,18 L54,22 L56,26 L58,30 L60,33 L63,36 L66,38 L69,40 L72,42 L76,44 L80,46 L84,47 L88,48 L94,49 L100,50 Z" },
  { name: "Pula", emoji: "🏟️", desc: "Rimska arena, obiteljske plaže", link: BKG("Pula, Croatia"), region: "Istra",
    sky: "M0,50 L5,48 L10,47 L15,46 L20,45 L24,44 L27,42 L30,38 L32,34 L34,30 L36,26 L38,23 L40,20 L42,18 L44,17 L46,16 L48,15.5 L50,15 L52,15.5 L54,16 L56,17 L58,18 L60,20 L62,23 L64,26 L66,30 L68,34 L70,38 L73,42 L76,44 L80,45 L85,46 L90,47 L95,48 L100,50 Z" },
  { name: "Opatija", emoji: "⚓", desc: "Elegancija Kvarnera", link: BKG("Opatija, Croatia"), region: "Kvarner",
    sky: "M0,50 L3,48 L6,46 L9,44 L12,42 L15,40 L18,38 L20,37 L22,36 L24,35 L26,34 L28,33 L30,32 L32,34 L34,33 L36,31 L38,30 L40,31 L42,32 L44,30 L46,29 L48,30 L50,32 L52,33 L54,31 L56,30 L58,32 L60,34 L62,36 L65,38 L68,40 L72,42 L76,44 L80,46 L85,47 L90,48 L95,49 L100,50 Z" },
  { name: "Dubrovnik", emoji: "🏰", desc: "Biser Jadrana, gradske zidine", link: BKG("Dubrovnik, Croatia"), region: "Dalmacija",
    sky: "M0,50 L3,48 L6,44 L8,36 L9,32 L10,36 L12,40 L14,42 L16,44 L18,42 L20,38 L22,34 L24,30 L25,26 L26,22 L27,18 L28,15 L29,18 L30,22 L31,26 L32,24 L33,20 L34,24 L35,28 L36,26 L37,22 L38,26 L39,28 L40,24 L41,20 L42,16 L43,12 L44,16 L45,20 L46,24 L47,28 L48,26 L49,22 L50,26 L52,30 L54,28 L56,32 L58,30 L60,34 L62,36 L64,38 L66,36 L68,38 L70,40 L72,42 L75,44 L80,46 L85,47 L90,48 L95,49 L100,50 Z" },
  { name: "Zadar", emoji: "🌅", desc: "Morske orgulje, najljepši zalazak", link: BKG("Zadar, Croatia"), region: "Dalmacija",
    sky: "M0,50 L5,48 L10,46 L12,45 L15,44 L18,43 L20,42 L22,43 L24,42 L26,40 L28,38 L30,36 L31,28 L32,20 L33,12 L33.5,8 L34,12 L35,20 L36,28 L37,36 L38,38 L40,36 L42,34 L43,30 L44,26 L44.5,30 L45,34 L46,36 L48,38 L50,40 L52,42 L55,40 L58,42 L60,43 L65,44 L70,45 L75,44 L78,45 L82,46 L86,47 L90,48 L95,49 L100,50 Z" },
];

const STEPS = [
  { num: "01", icon: "🏠", title: "Domaćin kreira apartman", desc: "Registrira smještaj i generira jedinstveni QR kod" },
  { num: "02", icon: "📱", title: "Gost skenira QR", desc: "Na zidu apartmana — unosi profil i interese" },
  { num: "03", icon: "🌊", title: "Osobni savjetnik 24/7", desc: "Provjerene preporuke, lokalni savjeti, rezervacije" },
];

export default function LandingPage() {
  const [lang, setLang] = useState("hr");
  const [roomInput, setRoomInput] = useState("");
  const [anim, setAnim] = useState(false);

  useEffect(() => { setTimeout(() => setAnim(true), 100); }, []);

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
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "grid", placeItems: "center", boxShadow: "0 4px 16px rgba(14,165,233,0.25)" }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <path d="M8 6C8 6 10 6 12 6C16 6 16 14 16 18C16 22 14 26 10 26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M4 20C6 17 9 17 12 20C15 23 18 23 20 20C22 17 25 17 28 20" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M4 24C6 21 9 21 12 24C15 27 18 27 20 24C22 21 25 21 28 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1 }}>Jadran</div>
              <div style={{ fontSize: 9, color: "#0ea5e9", letterSpacing: 3, fontWeight: 500 }}>SAVJETNIK</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/ai" style={{ padding: "10px 20px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", fontSize: 13, textDecoration: "none", fontWeight: 600, boxShadow: "0 4px 12px rgba(14,165,233,0.2)" }}>
              🗺️ Vodič
            </a>
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

          {/* Room code input */}
          <div style={{
            display: "inline-flex", gap: 8, padding: 6, borderRadius: 18,
            background: "rgba(12,28,50,0.7)", border: "1px solid rgba(14,165,233,0.12)",
            backdropFilter: "blur(20px)",
          }}>
            <input
              type="text"
              placeholder="Unesite room kod (npr. JADRAN-AB34)"
              value={roomInput}
              onChange={e => setRoomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && goRoom()}
              style={{
                padding: "14px 20px", borderRadius: 14, border: "none",
                background: "transparent", color: "#fff", fontSize: 15,
                outline: "none", width: "min(300px, 50vw)", fontFamily: "inherit",
              }}
            />
            <button onClick={goRoom} style={{
              padding: "14px 28px", borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
              fontFamily: "inherit",
            }}>Otvori →</button>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>
            Imate QR kod u apartmanu? Skenirajte ili unesite kod ručno.
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {DESTINATIONS.map((d, i) => (
              <a key={i} href={d.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  padding: 20, borderRadius: 20, position: "relative", overflow: "hidden",
                  background: "rgba(12,28,50,0.6)", border: "1px solid rgba(14,165,233,0.06)",
                  cursor: "pointer", transition: "all 0.3s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.2)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.06)"; e.currentTarget.style.transform = ""; }}>
                  {/* City skyline silhouette */}
                  {d.sky && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, opacity: 0.07, pointerEvents: "none" }}>
                    <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none" style={{ display: "block" }}>
                      <path d={d.sky} fill="#0ea5e9" />
                    </svg>
                  </div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{d.emoji}</span>
                    <span style={{ fontSize: 10, color: "#7dd3fc", padding: "3px 10px", borderRadius: 10, background: "rgba(14,165,233,0.08)" }}>{d.region}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 18, fontWeight: 400, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: "#7dd3fc", lineHeight: 1.5, marginBottom: 10 }}>{d.desc}</div>
                  <div style={{ fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>Booking.com →</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ AI STANDALONE CTA ═══ */}
      <div style={{ padding: "60px 24px", background: "rgba(0,0,0,0.1)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {/* AI for everyone */}
          <div style={{
            padding: 32, borderRadius: 24, textAlign: "center",
            background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(2,132,199,0.04))",
            border: "1px solid rgba(14,165,233,0.12)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, marginBottom: 8 }}>Osobni vodič</div>
            <div style={{ fontSize: 13, color: "#7dd3fc", marginBottom: 20, lineHeight: 1.6 }}>
              Pitajte bilo što o destinaciji — preporuke restorana, skrivene plaže, praktični savjeti. 3 besplatna pitanja.
            </div>
            <a href="/ai" style={{
              display: "inline-block", padding: "14px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none",
              fontFamily: "'DM Serif Display', Georgia, serif",
              boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
            }}>Probajte besplatno →</a>
          </div>

          {/* Camper special */}
          <div style={{
            padding: 32, borderRadius: 24, textAlign: "center",
            background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(251,191,36,0.03))",
            border: "1px solid rgba(245,158,11,0.1)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚐</div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, marginBottom: 8 }}>Kamper vodič</div>
            <div style={{ fontSize: 13, color: "#fbbf24", marginBottom: 20, lineHeight: 1.6 }}>
              Legalna noćenja, punjenje vode, parkirališta za kampere — sve na jednom mjestu duž cijele obale.
            </div>
            <a href="/ai" style={{
              display: "inline-block", padding: "14px 28px", borderRadius: 16,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none",
              fontFamily: "'DM Serif Display', Georgia, serif",
              boxShadow: "0 4px 16px rgba(245,158,11,0.25)",
            }}>Kamper mode →</a>
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
        @media (max-width: 768px) {
          input[style] { width: 180px !important; }
        }
      `}</style>
    </div>
  );
}
