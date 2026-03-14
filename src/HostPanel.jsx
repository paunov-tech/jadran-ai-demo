// ═══════════════════════════════════════════════════════════════
// JADRAN AI — Host Panel (Blok 2)
// Route: jadran.ai/host
// Features: Login, Apartment CRUD, QR generation, Guest list
// Firestore: apartments/{id}, guests/{roomCode}
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";
import { db } from "./firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

const COLL_APT = "apartments";
const COLL_GUEST = "guests";

// Generate room code: JADRAN-XXXX
function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "JADRAN-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Simple QR Code SVG generator (no deps)
function qrSvg(text, size = 200) {
  // Use a simple URL-encoded QR via external API for reliability
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=0a1628&color=0ea5e9&format=svg`;
}

/* ══════════════════════════════════════════════════ */
export default function HostPanel() {
  const [auth, setAuth] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [apartments, setApartments] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", wifi: "", wifiPass: "", hostName: "", hostPhone: "", notes: "" });

  // QR modal
  const [qrModal, setQrModal] = useState(null);

  // Detail view
  const [viewApt, setViewApt] = useState(null);

  // ─── AUTH ───
  const HOST_PIN = "jadran2026"; // Simple pin for MVP

  const doLogin = () => {
    if (pin.toLowerCase() === HOST_PIN) {
      setAuth(true);
      setPinError(false);
      try { localStorage.setItem("jadran_host_auth", "1"); } catch {}
    } else {
      setPinError(true);
    }
  };

  useEffect(() => {
    try {
      if (localStorage.getItem("jadran_host_auth") === "1") setAuth(true);
    } catch {}
  }, []);

  // ─── LOAD DATA ───
  useEffect(() => {
    if (!auth || !db) return;

    // Real-time apartments listener
    const unsub = onSnapshot(collection(db, COLL_APT), (snap) => {
      const apts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApartments(apts);
      setLoading(false);

      // Load guests for each apartment
      const codes = apts.map(a => a.roomCode).filter(Boolean);
      if (codes.length > 0) {
        // Firestore 'in' query limited to 30
        getDocs(collection(db, COLL_GUEST)).then(gSnap => {
          const gs = gSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(g => codes.includes(g.roomCode || g.id));
          setGuests(gs);
        }).catch(() => {});
      }
    });

    return () => unsub();
  }, [auth]);

  // ─── SAVE APARTMENT ───
  const saveApartment = async () => {
    if (!form.name.trim()) return;
    const id = editId || doc(collection(db, COLL_APT)).id;
    const roomCode = editId
      ? apartments.find(a => a.id === editId)?.roomCode || genRoomCode()
      : genRoomCode();

    await setDoc(doc(db, COLL_APT, id), {
      ...form,
      roomCode,
      createdAt: editId ? apartments.find(a => a.id === editId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    setForm({ name: "", address: "", wifi: "", wifiPass: "", hostName: "", hostPhone: "", notes: "" });
    setShowForm(false);
    setEditId(null);
  };

  // ─── DELETE APARTMENT ───
  const deleteApt = async (id) => {
    if (!confirm("Obrisati apartman?")) return;
    await deleteDoc(doc(db, COLL_APT, id));
  };

  // ─── EDIT ───
  const startEdit = (apt) => {
    setForm({ name: apt.name || "", address: apt.address || "", wifi: apt.wifi || "", wifiPass: apt.wifiPass || "", hostName: apt.hostName || "", hostPhone: apt.hostPhone || "", notes: apt.notes || "" });
    setEditId(apt.id);
    setShowForm(true);
  };

  // ─── GUEST for apartment ───
  const guestForApt = (roomCode) => guests.find(g => (g.roomCode || g.id) === roomCode);

  // ─── STYLES ───
  const C = {
    bg: "#0a1628", card: "rgba(12,28,50,0.85)", accent: "#0ea5e9", acDim: "rgba(14,165,233,0.12)",
    gold: "#f59e0b", text: "#f0f9ff", mut: "#7dd3fc", bord: "rgba(14,165,233,0.08)",
    green: "#4ade80", red: "#f87171",
  };

  // ════════════════════════════════════════════════
  // LOGIN SCREEN
  // ════════════════════════════════════════════════
  if (!auth) return (
    <div style={{ ...S.wrap, background: `linear-gradient(160deg, ${C.bg}, #0e3a5c 50%, #134e6f)` }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <div style={S.loginCard}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Host Panel</div>
        <div style={{ fontSize: 13, color: C.mut, marginBottom: 28 }}>JADRAN AI — Upravljanje apartmanima</div>
        <input
          type="password"
          placeholder="PIN kod"
          value={pin}
          onChange={e => { setPin(e.target.value); setPinError(false); }}
          onKeyDown={e => e.key === "Enter" && doLogin()}
          style={{ ...S.input, textAlign: "center", fontSize: 20, letterSpacing: 8, marginBottom: 16 }}
          autoFocus
        />
        {pinError && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>Pogrešan PIN</div>}
        <button onClick={doLogin} style={S.primaryBtn}>Prijava →</button>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>SIAL Consulting d.o.o.</div>
      </div>
      <style>{ANIMS}</style>
    </div>
  );

  // ════════════════════════════════════════════════
  // QR MODAL
  // ════════════════════════════════════════════════
  const QrModal = () => qrModal && (
    <div style={S.overlay} onClick={() => setQrModal(null)}>
      <div onClick={e => e.stopPropagation()} style={{ ...S.modal, maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{qrModal.name}</div>
        <div style={{ fontSize: 12, color: C.mut, marginBottom: 20 }}>Room: {qrModal.roomCode}</div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, display: "inline-block", marginBottom: 16 }}>
          <img src={qrSvg(`https://jadran.ai?room=${qrModal.roomCode}`, 220)} alt="QR" style={{ width: 220, height: 220 }} />
        </div>
        <div style={{ fontSize: 11, color: C.mut, marginBottom: 16, fontFamily: "monospace" }}>
          jadran.ai?room={qrModal.roomCode}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => {
            const url = qrSvg(`https://jadran.ai?room=${qrModal.roomCode}`, 400);
            window.open(url, "_blank");
          }} style={S.primaryBtn}>⬇️ Download QR</button>
          <button onClick={() => {
            const printWin = window.open("", "_blank");
            printWin.document.write(`
              <html><head><title>QR - ${qrModal.name}</title>
              <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#fff;}
              h2{margin-bottom:8px;} p{color:#666;font-size:14px;}</style></head>
              <body>
                <h2>${qrModal.name}</h2>
                <p>Skenirajte za turistički vodič</p>
                <img src="${qrSvg(`https://jadran.ai?room=${qrModal.roomCode}`, 300)}" width="300" />
                <p style="margin-top:16px;font-family:monospace;font-size:12px;">jadran.ai?room=${qrModal.roomCode}</p>
                <p style="color:#aaa;font-size:10px;margin-top:24px;">JADRAN AI · SIAL Consulting d.o.o.</p>
              </body></html>
            `);
            printWin.document.close();
            setTimeout(() => printWin.print(), 500);
          }} style={S.secBtn}>🖨️ Print</button>
        </div>
        <button onClick={() => setQrModal(null)} style={{ ...S.secBtn, marginTop: 16, width: "100%" }}>Zatvori</button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // APARTMENT FORM MODAL
  // ════════════════════════════════════════════════
  const AptForm = () => showForm && (
    <div style={S.overlay} onClick={() => { setShowForm(false); setEditId(null); }}>
      <div onClick={e => e.stopPropagation()} style={{ ...S.modal, maxWidth: 480 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
          {editId ? "✏️ Uredi apartman" : "➕ Novi apartman"}
        </div>
        {[
          ["name", "Naziv apartmana *", "Villa Marija"],
          ["address", "Adresa", "Podstrana, Put Svetog Martina 12"],
          ["hostName", "Ime domaćina", "Marija Perić"],
          ["hostPhone", "Telefon domaćina", "+385 91 555 1234"],
          ["wifi", "WiFi mreža", "VillaMarija-5G"],
          ["wifiPass", "WiFi lozinka", "jadran2026"],
          ["notes", "Napomene", "Parking u dvorištu, klima u svim sobama"],
        ].map(([key, label, ph]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.mut, display: "block", marginBottom: 4 }}>{label}</label>
            {key === "notes" ? (
              <textarea value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={ph} rows={3} style={{ ...S.input, resize: "vertical" }} />
            ) : (
              <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={ph} style={S.input} />
            )}
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={saveApartment} disabled={!form.name.trim()} style={{ ...S.primaryBtn, flex: 1, opacity: form.name.trim() ? 1 : 0.4 }}>
            {editId ? "Spremi izmjene" : "Kreiraj apartman"}
          </button>
          <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ ...S.secBtn, flex: 0.5 }}>Odustani</button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // MAIN DASHBOARD
  // ════════════════════════════════════════════════
  return (
    <div style={{ ...S.wrap, background: `linear-gradient(160deg, ${C.bg}, #0e3a5c 50%, ${C.bg})` }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", position: "relative", zIndex: 2 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, paddingBottom: 16, borderBottom: `1px solid ${C.bord}` }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>🏠 Host Panel</div>
            <div style={{ fontSize: 12, color: C.mut, marginTop: 2 }}>JADRAN AI — {apartments.length} apartman{apartments.length !== 1 ? "a" : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => { setForm({ name: "", address: "", wifi: "", wifiPass: "", hostName: "", hostPhone: "", notes: "" }); setEditId(null); setShowForm(true); }}
              style={S.primaryBtn}>
              ➕ Novi apartman
            </button>
            <button onClick={() => { localStorage.removeItem("jadran_host_auth"); setAuth(false); }}
              style={{ ...S.secBtn, padding: "8px 14px", fontSize: 11 }}>
              🚪 Odjava
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Apartmani", value: apartments.length, icon: "🏠", color: C.accent },
            { label: "Gosti aktivni", value: guests.filter(g => { const p = g.phase; return p === "kiosk" || p === "pre"; }).length, icon: "👥", color: C.green },
            { label: "Premium", value: guests.filter(g => g.premium).length, icon: "⭐", color: C.gold },
            { label: "QR skeniranja", value: guests.length, icon: "📱", color: "#a78bfa" },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, borderRadius: 16, padding: "16px 14px", border: `1px solid ${C.bord}`, backdropFilter: "blur(20px)" }}>
              <div style={{ fontSize: 11, color: C.mut, marginBottom: 6 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Apartments list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.mut }}>Učitavanje...</div>
        ) : apartments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: C.card, borderRadius: 20, border: `1px dashed ${C.bord}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Nema apartmana</div>
            <div style={{ fontSize: 13, color: C.mut, marginBottom: 20 }}>Kreirajte prvi apartman i generirajte QR kod za goste</div>
            <button onClick={() => setShowForm(true)} style={S.primaryBtn}>➕ Kreiraj apartman</button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {apartments.map(apt => {
              const guest = guestForApt(apt.roomCode);
              const isActive = guest && (guest.phase === "kiosk" || guest.phase === "pre");
              return (
                <div key={apt.id} style={{
                  background: C.card, borderRadius: 20, border: `1px solid ${isActive ? "rgba(14,165,233,0.2)" : C.bord}`,
                  overflow: "hidden", backdropFilter: "blur(20px)",
                  boxShadow: isActive ? "0 0 30px rgba(14,165,233,0.06)" : "none",
                  transition: "all 0.3s",
                }}>
                  {/* Apartment header */}
                  <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{apt.name}</div>
                        <span style={{
                          padding: "2px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                          background: isActive ? "rgba(74,222,128,0.12)" : "rgba(100,116,139,0.12)",
                          color: isActive ? C.green : C.mut,
                          border: `1px solid ${isActive ? "rgba(74,222,128,0.2)" : "rgba(100,116,139,0.15)"}`,
                        }}>
                          {isActive ? "● AKTIVAN" : guest ? "○ " + (guest.phase || "idle") : "○ ČEKA GOSTA"}
                        </span>
                      </div>
                      {apt.address && <div style={{ fontSize: 13, color: C.mut, marginBottom: 4 }}>📍 {apt.address}</div>}
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                        🔗 jadran.ai?room={apt.roomCode}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setQrModal(apt)} style={{ ...S.iconBtn, background: "rgba(14,165,233,0.1)", color: C.accent }} title="QR kod">
                        📱
                      </button>
                      <button onClick={() => startEdit(apt)} style={{ ...S.iconBtn, background: "rgba(251,191,36,0.1)", color: C.gold }} title="Uredi">
                        ✏️
                      </button>
                      <button onClick={() => deleteApt(apt.id)} style={{ ...S.iconBtn, background: "rgba(248,113,113,0.1)", color: C.red }} title="Obriši">
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Info row */}
                  <div style={{ padding: "0 24px 12px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {apt.hostName && <span style={S.infoBadge}>👤 {apt.hostName}</span>}
                    {apt.hostPhone && <span style={S.infoBadge}>📞 {apt.hostPhone}</span>}
                    {apt.wifi && <span style={S.infoBadge}>📶 {apt.wifi}</span>}
                  </div>

                  {/* Guest info */}
                  {guest && (
                    <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.bord}`, background: "rgba(14,165,233,0.03)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{guest.flag || "🌍"} {guest.name}</span>
                          <span style={{ fontSize: 12, color: C.mut, marginLeft: 10 }}>
                            {guest.arrival && guest.departure ? `${guest.arrival} → ${guest.departure}` : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {guest.premium && <span style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(251,191,36,0.12)", color: C.gold, fontSize: 10, fontWeight: 600 }}>⭐ PREMIUM</span>}
                          <span style={{ padding: "2px 8px", borderRadius: 8, background: C.acDim, color: C.accent, fontSize: 10 }}>
                            {guest.adults || 0}+{guest.kids || 0} osoba
                          </span>
                        </div>
                      </div>
                      {guest.interests && guest.interests.length > 0 && (
                        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {guest.interests.map(i => (
                            <span key={i} style={{ padding: "2px 8px", borderRadius: 8, background: "rgba(14,165,233,0.06)", color: C.mut, fontSize: 10 }}>{i}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 20px", fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
          JADRAN Host Panel · SIAL Consulting d.o.o.
        </div>
      </div>

      {/* Modals */}
      <QrModal />
      <AptForm />

      <style>{ANIMS}</style>
    </div>
  );
}

// ═══ ANIMATIONS ═══
const ANIMS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a1628; }
  input, textarea, button { font-family: 'Outfit', system-ui, sans-serif; }
  ::selection { background: rgba(14,165,233,0.3); }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.2); border-radius: 3px; }
`;

// ═══ STYLES ═══
const S = {
  wrap: {
    minHeight: "100vh", fontFamily: "'Outfit', system-ui, sans-serif", color: "#f0f9ff",
  },
  loginCard: {
    zIndex: 10, textAlign: "center",
    width: "min(380px, 90vw)", padding: "40px 32px",
    background: "rgba(12,28,50,0.85)", backdropFilter: "blur(40px)",
    border: "1px solid rgba(14,165,233,0.1)", borderRadius: 24,
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    margin: "auto",
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
  },
  input: {
    width: "100%", padding: "12px 16px", borderRadius: 12,
    border: "1px solid rgba(14,165,233,0.12)", background: "rgba(255,255,255,0.05)",
    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
    transition: "border 0.2s",
  },
  primaryBtn: {
    padding: "12px 24px", borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
    transition: "all 0.2s",
  },
  secBtn: {
    padding: "10px 20px", borderRadius: 12, cursor: "pointer",
    border: "1px solid rgba(14,165,233,0.15)", background: "rgba(14,165,233,0.06)",
    color: "#7dd3fc", fontSize: 13, transition: "all 0.2s",
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12, border: "none",
    cursor: "pointer", fontSize: 16, display: "grid", placeItems: "center",
    transition: "all 0.2s",
  },
  infoBadge: {
    fontSize: 12, color: "rgba(255,255,255,0.5)", padding: "2px 0",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
    zIndex: 300, display: "grid", placeItems: "center", padding: 24,
  },
  modal: {
    background: "rgba(12,28,50,0.95)", borderRadius: 24, padding: "32px 28px",
    border: "1px solid rgba(14,165,233,0.1)", width: "100%",
    boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
    maxHeight: "85vh", overflowY: "auto",
  },
};
