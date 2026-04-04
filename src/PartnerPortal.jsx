// src/PartnerPortal.jsx — Partner self-service portal
// Route: /partner  (detected in App.jsx via window.location.pathname)

import { useState, useEffect, useCallback } from "react";

const API_AUTH    = "/api/partner-auth";
const API_DATA    = "/api/partner-data";
const API_CAL     = "/api/partner-calendar";
const API_BOOK    = "/api/partner-bookings";

const PARTNER_TYPES = [
  { value: "smještaj",  label: "Smještaj (sobe/apartmani)" },
  { value: "hotel",     label: "Hotel" },
  { value: "kamp",      label: "Kamp / glamping" },
  { value: "restoran",  label: "Restoran" },
  { value: "konoba",    label: "Konoba / taverna" },
  { value: "bar",       label: "Bar / kafić" },
  { value: "marina",    label: "Marina / nautika" },
  { value: "combo",     label: "Kombinirano" },
];

const CAP_TYPES = [
  { value: "soba",       label: "Soba" },
  { value: "apartman",   label: "Apartman" },
  { value: "studio",     label: "Studio" },
  { value: "villa",      label: "Vila / kuća" },
  { value: "parcela",    label: "Kamp parcela" },
  { value: "sto",        label: "Stol (restoran)" },
  { value: "čamac",      label: "Čamac / brod" },
  { value: "vez",        label: "Vez (marina)" },
];

const CAP_UNITS = [
  { value: "noć",  label: "po noći" },
  { value: "dan",  label: "po danu" },
  { value: "h",    label: "po satu" },
];

const STATUS_LABELS = {
  pending:           { label: "Na čekanju",     color: "#d97706", bg: "#fef3c7" },
  partner_confirmed: { label: "Vi ste potvrdili", color: "#0284c7", bg: "#e0f2fe" },
  confirmed:         { label: "Potvrđeno ✓",    color: "#16a34a", bg: "#dcfce7" },
  rejected:          { label: "Odbijeno",        color: "#dc2626", bg: "#fee2e2" },
  cancelled:         { label: "Otkazano",        color: "#6b7280", bg: "#f3f4f6" },
};

// ── Helpers ───────────────────────────────────────────────────────
function authHdr(token) { return { "x-partner-token": token, "Content-Type": "application/json" }; }

async function apiFetch(url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: e.message } };
  }
}

function nightsBetween(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Mini Calendar ─────────────────────────────────────────────────
function MiniCalendar({ partnerId, capacityId, token }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected]   = useState([]);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    if (!capacityId) return;
    setLoading(true);
    apiFetch(`${API_CAL}?capacityId=${capacityId}&month=${monthKey}`, {
      headers: authHdr(token),
    }).then(r => {
      setBlocked(r.ok ? (r.data.blockedDates || []) : []);
      setLoading(false);
    });
  }, [capacityId, monthKey, token]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow    = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const startOffset = (firstDow + 6) % 7; // Mon=0

  function toggleDay(d) {
    const key = `${monthKey}-${String(d).padStart(2, "0")}`;
    setSelected(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    );
  }

  async function applyBlock(block) {
    if (selected.length === 0) return;
    setLoading(true);
    await apiFetch(API_CAL, {
      method: "POST",
      headers: authHdr(token),
      body: JSON.stringify({ capacityId, dates: selected, blocked: block }),
    });
    setSelected([]);
    // Refresh
    const r = await apiFetch(`${API_CAL}?capacityId=${capacityId}&month=${monthKey}`, {
      headers: authHdr(token),
    });
    setBlocked(r.ok ? (r.data.blockedDates || []) : []);
    setLoading(false);
  }

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthNames = ["Siječanj","Veljača","Ožujak","Travanj","Svibanj","Lipanj","Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac"];

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={navBtn}>‹</button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{monthNames[month - 1]} {year}</span>
        <button onClick={nextMonth} style={navBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 8 }}>
        {["Po","Ut","Sr","Če","Pe","Su","Ne"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600, padding: "2px 0" }}>{d}</div>
        ))}
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d   = i + 1;
          const key = `${monthKey}-${String(d).padStart(2, "0")}`;
          const isBlocked  = blocked.includes(key);
          const isSelected = selected.includes(key);
          const isPast     = new Date(key) < new Date(new Date().toDateString());
          return (
            <button
              key={d}
              onClick={() => !isPast && toggleDay(d)}
              disabled={isPast}
              style={{
                border: "none", borderRadius: 6, padding: "5px 2px",
                cursor: isPast ? "default" : "pointer",
                fontSize: 12, fontWeight: isBlocked ? 700 : 400,
                background: isSelected ? "#0f2a4a" : isBlocked ? "#fee2e2" : "#f8fafc",
                color: isSelected ? "#fff" : isBlocked ? "#dc2626" : isPast ? "#cbd5e1" : "#1e293b",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => applyBlock(true)} style={{ ...btn, flex: 1, background: "#dc2626" }}>
            🔒 Blokiraj ({selected.length})
          </button>
          <button onClick={() => applyBlock(false)} style={{ ...btn, flex: 1, background: "#16a34a" }}>
            🔓 Oslobodi ({selected.length})
          </button>
        </div>
      )}
      {loading && <p style={{ fontSize: 12, color: "#94a3b8", margin: "8px 0 0", textAlign: "center" }}>Učitavanje…</p>}
      <p style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 0" }}>Crveni dani = blokirano. Klikni dan za označavanje.</p>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const btn = {
  border: "none", borderRadius: 8, padding: "9px 18px",
  cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#fff",
  background: "#0f2a4a",
};
const btnSm = { ...btn, padding: "6px 12px", fontSize: 12 };
const btnGhost = { ...btn, background: "transparent", color: "#64748b", border: "1px solid #e2e8f0" };
const navBtn = { ...btn, padding: "4px 10px", fontSize: 16, background: "#f1f5f9", color: "#334155" };
const input = {
  width: "100%", boxSizing: "border-box", border: "1px solid #e2e8f0",
  borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none",
};
const label = { display: "block", fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 4 };
const card  = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 };

// ── Main Component ────────────────────────────────────────────────
export default function PartnerPortal() {
  const [token,   setToken]   = useState(() => localStorage.getItem("pp_token") || "");
  const [partner, setPartner] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [tab,     setTab]     = useState("pregled");  // pregled | profil | kapaciteti | kalendar | rezervacije
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // ── Auth forms ───────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd,   setLoginPwd]   = useState("");
  const [regForm, setRegForm]       = useState({ email:"", password:"", name:"", type:"smještaj", city:"", address:"", phone:"" });

  // ── Profile tab ──────────────────────────────────────────────
  const [profForm, setProfForm] = useState({});
  const [profSaving, setProfSaving] = useState(false);

  // ── Capacities tab ───────────────────────────────────────────
  const [caps, setCaps]         = useState([]);
  const [capForm, setCapForm]   = useState({ name:"", type:"soba", capacity:2, priceFrom:0, description:"", unit:"noć" });
  const [editCap, setEditCap]   = useState(null);
  const [calCap, setCalCap]     = useState(null); // capacityId shown in calendar

  // ── Photos tab ───────────────────────────────────────────────
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // ── Bookings tab ─────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [bookLoading, setBookLoading] = useState(false);

  // ── Session verify on mount ──────────────────────────────────
  useEffect(() => {
    if (!token) return;
    apiFetch(`${API_AUTH}?action=verify`, { headers: authHdr(token) }).then(r => {
      if (r.ok) {
        setPartner(r.data.partner);
        setCaps(r.data.partner.capacities || []);
        setProfForm(buildProfForm(r.data.partner));
      } else {
        localStorage.removeItem("pp_token");
        setToken("");
      }
    });
  }, []);

  function buildProfForm(p) {
    return {
      name: p.name || "", type: p.type || "smještaj", city: p.city || "",
      address: p.address || "", phone: p.phone || "", website: p.website || "",
      description_hr: p.description_hr || "", description_en: p.description_en || "",
      description_de: p.description_de || "", description_it: p.description_it || "",
      hours_hr: p.hours_hr || "",
    };
  }

  function refreshPartner(updatedPartner) {
    setPartner(updatedPartner);
    setCaps(updatedPartner.capacities || []);
    setProfForm(buildProfForm(updatedPartner));
  }

  // ── Login ────────────────────────────────────────────────────
  async function doLogin(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const r = await apiFetch(`${API_AUTH}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPwd }),
    });
    setLoading(false);
    if (r.ok) {
      localStorage.setItem("pp_token", r.data.token);
      setToken(r.data.token);
      setPartner(r.data.partner);
      setCaps(r.data.partner.capacities || []);
      setProfForm(buildProfForm(r.data.partner));
    } else {
      setError(r.data.error || "Greška pri prijavi");
    }
  }

  // ── Register ─────────────────────────────────────────────────
  async function doRegister(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const r = await apiFetch(`${API_AUTH}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    });
    setLoading(false);
    if (r.ok) {
      setSuccess("Račun kreiran! Prijavite se emailom i lozinkom.");
      setAuthMode("login");
      setLoginEmail(regForm.email);
    } else {
      setError(r.data.error || "Greška pri registraciji");
    }
  }

  // ── Logout ───────────────────────────────────────────────────
  async function doLogout() {
    await apiFetch(`${API_AUTH}?action=logout`, { method: "POST", headers: authHdr(token) });
    localStorage.removeItem("pp_token");
    setToken(""); setPartner(null);
  }

  // ── Save profile ─────────────────────────────────────────────
  async function saveProfile(e) {
    e.preventDefault();
    setProfSaving(true); setError(""); setSuccess("");
    const r = await apiFetch(API_DATA, {
      method: "PATCH",
      headers: authHdr(token),
      body: JSON.stringify(profForm),
    });
    setProfSaving(false);
    if (r.ok) setSuccess("Profil spremljen!");
    else setError(r.data.error || "Greška");
  }

  // ── Add capacity ─────────────────────────────────────────────
  async function addCapacity(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const r = await apiFetch(`${API_DATA}?action=add-capacity`, {
      method: "POST",
      headers: authHdr(token),
      body: JSON.stringify(capForm),
    });
    setLoading(false);
    if (r.ok) {
      setCaps(prev => [...prev, r.data.capacity]);
      setCapForm({ name:"", type:"soba", capacity:2, priceFrom:0, description:"", unit:"noć" });
      setSuccess("Kapacitet dodan!");
    } else setError(r.data.error || "Greška");
  }

  // ── Edit capacity ────────────────────────────────────────────
  async function saveEditCap(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const r = await apiFetch(`${API_DATA}?action=edit-capacity`, {
      method: "PATCH",
      headers: authHdr(token),
      body: JSON.stringify(editCap),
    });
    setLoading(false);
    if (r.ok) {
      setCaps(prev => prev.map(c => c.id === editCap.id ? r.data.capacity : c));
      setEditCap(null);
      setSuccess("Kapacitet ažuriran!");
    } else setError(r.data.error || "Greška");
  }

  // ── Delete capacity ──────────────────────────────────────────
  async function delCapacity(capId) {
    if (!confirm("Obrisati kapacitet?")) return;
    const r = await apiFetch(`${API_DATA}?action=del-capacity&id=${capId}`, {
      method: "DELETE", headers: authHdr(token),
    });
    if (r.ok) setCaps(prev => prev.filter(c => c.id !== capId));
    else setError(r.data.error || "Greška");
  }

  // ── Photos ───────────────────────────────────────────────────
  async function addPhoto(e) {
    e.preventDefault();
    if (!newPhotoUrl.startsWith("http")) return setError("URL mora počinjati s http");
    const r = await apiFetch(`${API_DATA}?action=add-photo`, {
      method: "POST", headers: authHdr(token),
      body: JSON.stringify({ url: newPhotoUrl }),
    });
    if (r.ok) {
      setPartner(p => ({ ...p, photos: r.data.photos }));
      setNewPhotoUrl(""); setSuccess("Fotografija dodana!");
    } else setError(r.data.error || "Greška");
  }

  async function delPhoto(url) {
    if (!confirm("Obrisati fotografiju?")) return;
    const r = await apiFetch(`${API_DATA}?action=del-photo&url=${encodeURIComponent(url)}`, {
      method: "DELETE", headers: authHdr(token),
    });
    if (r.ok) setPartner(p => ({ ...p, photos: r.data.photos }));
    else setError(r.data.error || "Greška");
  }

  // ── Load bookings ─────────────────────────────────────────────
  async function loadBookings() {
    setBookLoading(true);
    const r = await apiFetch(API_BOOK, { headers: authHdr(token) });
    setBookLoading(false);
    if (r.ok) setBookings(r.data.bookings || []);
  }

  useEffect(() => {
    if (tab === "rezervacije" && partner) loadBookings();
  }, [tab, partner]);

  // ── Booking actions ───────────────────────────────────────────
  async function bookingAction(id, action) {
    const r = await apiFetch(`${API_BOOK}?action=${action}&id=${id}`, {
      method: "POST", headers: authHdr(token),
    });
    if (r.ok) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: r.data.status } : b));
    } else setError(r.data.error || "Greška");
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Auth screen
  // ─────────────────────────────────────────────────────────────
  if (!partner) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a1628,#0f2a4a)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontFamily: "Georgia,serif", fontSize: 26, fontWeight: 700, color: "#0a1628" }}>
              JADRAN<span style={{ color: "#FFB800" }}>.ai</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Partner Program</div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setError(""); setSuccess(""); }}
                style={{ ...btn, flex: 1, background: authMode === m ? "#0f2a4a" : "#f1f5f9", color: authMode === m ? "#fff" : "#475569" }}>
                {m === "login" ? "Prijava" : "Registracija"}
              </button>
            ))}
          </div>

          {error   && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
          {success && <div style={{ background:"#dcfce7", color:"#16a34a", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16 }}>{success}</div>}

          {authMode === "login" ? (
            <form onSubmit={doLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={label}>Email</label>
                <input style={input} type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="partner@email.com" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={label}>Lozinka</label>
                <input style={input} type="password" required value={loginPwd} onChange={e => setLoginPwd(e.target.value)} placeholder="••••••••" />
              </div>
              <button type="submit" style={{ ...btn, width: "100%" }} disabled={loading}>
                {loading ? "Prijava…" : "Prijavi se"}
              </button>
            </form>
          ) : (
            <form onSubmit={doRegister}>
              {[
                { key:"name",    label:"Naziv objekta", type:"text",  placeholder:"Konoba Jadran" },
                { key:"email",   label:"Email",         type:"email", placeholder:"partner@email.com" },
                { key:"password",label:"Lozinka (min. 8 znakova)", type:"password", placeholder:"••••••••" },
                { key:"city",    label:"Grad / mjesto", type:"text",  placeholder:"Rab" },
                { key:"address", label:"Adresa",        type:"text",  placeholder:"Ul. Stjepana Radića 1" },
                { key:"phone",   label:"Telefon",       type:"text",  placeholder:"+385 91..." },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={label}>{f.label}</label>
                  <input style={input} type={f.type} required={["name","email","password","city"].includes(f.key)}
                    placeholder={f.placeholder}
                    value={regForm[f.key]}
                    onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 20 }}>
                <label style={label}>Tip objekta</label>
                <select style={{ ...input }} value={regForm.type} onChange={e => setRegForm(p => ({ ...p, type: e.target.value }))}>
                  {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <button type="submit" style={{ ...btn, width: "100%", background: "#16a34a" }} disabled={loading}>
                {loading ? "Registracija…" : "Registriraj se besplatno"}
              </button>
              <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
                Probni period do 30. travnja 2026. Sezonska naknada 1.000 EUR — fakturira se odvojeno.
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Dashboard
  // ─────────────────────────────────────────────────────────────
  const photos = partner.photos || [];
  const trialDays = partner.trialEnds
    ? Math.max(0, Math.round((new Date(partner.trialEnds) - new Date()) / 86400000))
    : null;

  const TABS = [
    { id: "pregled",      icon: "📊", label: "Pregled" },
    { id: "profil",       icon: "✏️", label: "Profil" },
    { id: "kapaciteti",   icon: "🛏", label: "Kapaciteti" },
    { id: "kalendar",     icon: "📅", label: "Kalendar" },
    { id: "rezervacije",  icon: "📋", label: "Rezervacije" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a1628,#0f2a4a)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>
            JADRAN<span style={{ color: "#FFB800" }}>.ai</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>Partner</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{partner.name}</div>
        </div>
        <button onClick={doLogout} style={{ ...btnSm, background: "rgba(255,255,255,0.12)", color: "#fff" }}>Odjava</button>
      </div>

      {/* Trial banner */}
      {trialDays !== null && trialDays <= 30 && (
        <div style={{ background: trialDays <= 7 ? "#fee2e2" : "#fef3c7", padding: "10px 20px", fontSize: 13, color: trialDays <= 7 ? "#dc2626" : "#92400e", borderBottom: "1px solid #e2e8f0" }}>
          {trialDays > 0
            ? `⏳ Probni period ističe za ${trialDays} dana (${partner.trialEnds}). Kontaktirajte nas za nastavak.`
            : "⚠️ Probni period je istekao. Kontaktirajte nas za aktivaciju."}
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setError(""); setSuccess(""); }}
            style={{ border: "none", background: "none", padding: "14px 16px", cursor: "pointer", fontWeight: tab === t.id ? 700 : 400,
              fontSize: 13, color: tab === t.id ? "#0f2a4a" : "#64748b", whiteSpace: "nowrap",
              borderBottom: tab === t.id ? "2px solid #0f2a4a" : "2px solid transparent" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>
        {error   && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16 }}>{error}</div>}
        {success && <div style={{ background:"#dcfce7", color:"#16a34a", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16 }}>{success}</div>}

        {/* ── PREGLED ── */}
        {tab === "pregled" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Kapaciteti", value: caps.length, icon: "🛏" },
                { label: "Fotografije", value: photos.length + "/10", icon: "📸" },
                { label: "Status", value: partner.status === "trial" ? "Probni" : "Aktivan", icon: "✅" },
                { label: "Ocjena", value: partner.rating ? `${partner.rating} ★` : "—", icon: "⭐" },
              ].map(s => (
                <div key={s.label} style={{ ...card, marginBottom: 0, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0f2a4a" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Profil partnera</h3>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}><b>Tip:</b> {PARTNER_TYPES.find(t => t.value === partner.type)?.label || partner.type}</p>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}><b>Grad:</b> {partner.city}</p>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}><b>Email:</b> {partner.email}</p>
              {partner.phone   && <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}><b>Tel:</b> {partner.phone}</p>}
              {partner.website && <p style={{ margin: "4px 0", fontSize: 13, color: "#475569" }}><b>Web:</b> <a href={partner.website} target="_blank" rel="noreferrer">{partner.website}</a></p>}
              <p style={{ margin: "4px 0", fontSize: 13, color: "#94a3b8" }}><b>ID:</b> <span style={{ fontFamily: "monospace" }}>{partner.id}</span></p>
            </div>
            {photos.length > 0 && (
              <div style={card}>
                <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Fotografije ({photos.length}/10)</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))", gap: 8 }}>
                  {photos.map(url => (
                    <img key={url} src={url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROFIL ── */}
        {tab === "profil" && (
          <form onSubmit={saveProfile}>
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Osnovni podaci</h3>
              {[
                { key:"name",    lbl:"Naziv objekta" },
                { key:"city",    lbl:"Grad / mjesto" },
                { key:"address", lbl:"Adresa" },
                { key:"phone",   lbl:"Telefon" },
                { key:"website", lbl:"Web stranica" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={label}>{f.lbl}</label>
                  <input style={input} value={profForm[f.key] || ""} onChange={e => setProfForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={label}>Tip objekta</label>
                <select style={{ ...input }} value={profForm.type || ""} onChange={e => setProfForm(p => ({ ...p, type: e.target.value }))}>
                  {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Opis (višejezično)</h3>
              {[
                { key:"description_hr", lbl:"Opis (HR)" },
                { key:"description_en", lbl:"Opis (EN)" },
                { key:"description_de", lbl:"Opis (DE)" },
                { key:"description_it", lbl:"Opis (IT)" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={label}>{f.lbl}</label>
                  <textarea style={{ ...input, height: 80, resize: "vertical" }}
                    value={profForm[f.key] || ""}
                    onChange={e => setProfForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={label}>Radno vrijeme (HR)</label>
                <input style={input} placeholder="Pon–Ned: 8:00–23:00"
                  value={profForm.hours_hr || ""} onChange={e => setProfForm(p => ({ ...p, hours_hr: e.target.value }))} />
              </div>
            </div>

            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Fotografije ({photos.length}/10)</h3>
              <form onSubmit={addPhoto} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input style={{ ...input, flex: 1 }} type="url" placeholder="https://..." value={newPhotoUrl}
                  onChange={e => setNewPhotoUrl(e.target.value)} />
                <button type="submit" style={{ ...btn, whiteSpace: "nowrap" }}>Dodaj</button>
              </form>
              {photos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px,1fr))", gap: 8 }}>
                  {photos.map(url => (
                    <div key={url} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8 }} />
                      <button onClick={() => delPhoto(url)}
                        style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 12 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" style={{ ...btn, width: "100%", background: "#16a34a" }} disabled={profSaving}>
              {profSaving ? "Sprema…" : "Spremi profil"}
            </button>
          </form>
        )}

        {/* ── KAPACITETI ── */}
        {tab === "kapaciteti" && (
          <div>
            {/* Add form */}
            <div style={card}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>
                {editCap ? "Uredi kapacitet" : "Dodaj kapacitet"}
              </h3>
              <form onSubmit={editCap ? saveEditCap : addCapacity}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={label}>Naziv</label>
                    <input style={input} required placeholder="Soba 1 / Stol A"
                      value={editCap ? editCap.name : capForm.name}
                      onChange={e => editCap ? setEditCap(p => ({ ...p, name: e.target.value })) : setCapForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={label}>Tip</label>
                    <select style={{ ...input }}
                      value={editCap ? editCap.type : capForm.type}
                      onChange={e => editCap ? setEditCap(p => ({ ...p, type: e.target.value })) : setCapForm(p => ({ ...p, type: e.target.value }))}>
                      {CAP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Kapacitet (osoba)</label>
                    <input style={input} type="number" min={1} max={200}
                      value={editCap ? editCap.capacity : capForm.capacity}
                      onChange={e => editCap ? setEditCap(p => ({ ...p, capacity: Number(e.target.value) })) : setCapForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={label}>Cijena od (EUR)</label>
                    <input style={input} type="number" min={0}
                      value={editCap ? editCap.priceFrom : capForm.priceFrom}
                      onChange={e => editCap ? setEditCap(p => ({ ...p, priceFrom: Number(e.target.value) })) : setCapForm(p => ({ ...p, priceFrom: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label style={label}>Jedinica naplate</label>
                    <select style={{ ...input }}
                      value={editCap ? editCap.unit : capForm.unit}
                      onChange={e => editCap ? setEditCap(p => ({ ...p, unit: e.target.value })) : setCapForm(p => ({ ...p, unit: e.target.value }))}>
                      {CAP_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Aktivan</label>
                    <select style={{ ...input }}
                      value={editCap ? String(editCap.active !== false) : "true"}
                      onChange={e => editCap && setEditCap(p => ({ ...p, active: e.target.value === "true" }))}>
                      <option value="true">Da</option>
                      <option value="false">Ne</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Opis (opcijski)</label>
                  <textarea style={{ ...input, height: 60, resize: "vertical" }}
                    value={editCap ? editCap.description : capForm.description}
                    onChange={e => editCap ? setEditCap(p => ({ ...p, description: e.target.value })) : setCapForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" style={{ ...btn, flex: 1, background: "#16a34a" }} disabled={loading}>
                    {loading ? "Sprema…" : editCap ? "Spremi izmjene" : "Dodaj kapacitet"}
                  </button>
                  {editCap && (
                    <button type="button" onClick={() => setEditCap(null)} style={{ ...btnGhost }}>Odustani</button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            {caps.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" }}>Nema kapaciteta. Dodajte sobe, apartmane, stolove…</p>}
            {caps.map(cap => (
              <div key={cap.id} style={{ ...card, opacity: cap.active === false ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{cap.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {CAP_TYPES.find(t => t.value === cap.type)?.label || cap.type} · {cap.capacity} osoba · {cap.priceFrom > 0 ? `od ${cap.priceFrom} EUR/${cap.unit}` : "cijena na upit"}
                    </div>
                    {cap.description && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{cap.description}</div>}
                    {cap.active === false && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>● Neaktivno</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    <button onClick={() => setEditCap({ ...cap })} style={{ ...btnSm, background: "#f1f5f9", color: "#334155" }}>Uredi</button>
                    <button onClick={() => delCapacity(cap.id)} style={{ ...btnSm, background: "#fee2e2", color: "#dc2626" }}>Briši</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── KALENDAR ── */}
        {tab === "kalendar" && (
          <div>
            <div style={card}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Odaberite kapacitet</h3>
              {caps.length === 0
                ? <p style={{ color: "#94a3b8", fontSize: 13 }}>Nema kapaciteta. Dodajte ih u tab Kapaciteti.</p>
                : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {caps.map(cap => (
                      <button key={cap.id} onClick={() => setCalCap(cap.id)}
                        style={{ ...btnSm, background: calCap === cap.id ? "#0f2a4a" : "#f1f5f9", color: calCap === cap.id ? "#fff" : "#334155" }}>
                        {cap.name}
                      </button>
                    ))}
                  </div>
                )
              }
            </div>

            {calCap && (
              <MiniCalendar
                partnerId={partner.id}
                capacityId={calCap}
                token={token}
              />
            )}

            {!calCap && caps.length > 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" }}>Odaberite kapacitet gore za upravljanje kalendarom.</p>
            )}
          </div>
        )}

        {/* ── REZERVACIJE ── */}
        {tab === "rezervacije" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>Booking inbox</h3>
              <button onClick={loadBookings} style={{ ...btnSm, background: "#f1f5f9", color: "#334155" }}>↻ Osvježi</button>
            </div>

            {bookLoading && <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Učitavanje…</p>}
            {!bookLoading && bookings.length === 0 && (
              <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center" }}>Nema rezervacija.</p>
            )}

            {bookings.map(b => {
              const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
              return (
                <div key={b.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#0284c7" }}>{b.id}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{b.guestName}</div>
                    </div>
                    <span style={{ background: st.bg, color: st.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>
                    <div>📦 {b.capacityName}</div>
                    <div>📅 {fmt(b.checkIn)} → {fmt(b.checkOut)} ({b.nights} noći)</div>
                    <div>👥 {b.guests} osoba</div>
                    {b.guestEmail && <div>✉️ <a href={`mailto:${b.guestEmail}`}>{b.guestEmail}</a></div>}
                    {b.guestPhone && <div>📞 <a href={`tel:${b.guestPhone}`}>{b.guestPhone}</a></div>}
                    {b.note && <div style={{ marginTop: 6, fontStyle: "italic", color: "#64748b" }}>"{b.note}"</div>}
                  </div>

                  {(b.status === "pending") && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => bookingAction(b.id, "confirm")} style={{ ...btn, flex: 1, background: "#16a34a" }}>
                        ✓ Potvrdi
                      </button>
                      <button onClick={() => bookingAction(b.id, "reject")} style={{ ...btn, flex: 1, background: "#dc2626" }}>
                        ✗ Odbij
                      </button>
                    </div>
                  )}
                  {b.status === "partner_confirmed" && (
                    <div style={{ background: "#e0f2fe", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#0284c7" }}>
                      ✓ Vi ste potvrdili — čeka potvrdu JADRAN.ai platforme
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
