// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Admin Panel
// Route: jadran.ai/admin
// Features: Booking list, status management, dual-confirm
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";

// PIN is entered at login, sent via POST body — never hardcoded here
// Token is base64-encoded when sent as HTTP header (handles special characters)
const encTok = t => { try { return btoa(t); } catch { return t; } };

const B2B_STEP_CFG = {
  0: { label: "Novi",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  1: { label: "Email 1",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  2: { label: "Email 2",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  3: { label: "Email 3",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  4: { label: "Email 4",  color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  5: { label: "Završeno", color: "#7a8fa8", bg: "rgba(122,143,168,0.12)" },
};
const B2B_TYPE_LABELS = {
  kamp: "Kamp", "smje_taj": "Smještaj", "smještaj": "Smještaj",
  restoran: "Restoran", konoba: "Konoba", marina: "Marina", other: "Ostalo",
};

const C = {
  bg: "#07111f", surface: "#0f1e35", card: "#121d30", card2: "#162240",
  accent: "#00b4d8", gold: "#FFB800", white: "#f0f4f8",
  muted: "#7a8fa8", border: "rgba(0,180,216,0.12)",
  success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#818cf8",
};

const STATUS_CFG = {
  pending:          { label: "Pending",          color: C.warning, bg: "rgba(245,158,11,0.12)" },
  partner_confirmed:{ label: "Partner ✓",        color: C.info,    bg: "rgba(129,140,248,0.12)" },
  operator_confirmed:{ label: "Operator ✓",      color: C.info,    bg: "rgba(129,140,248,0.12)" },
  confirmed:        { label: "Confirmed",         color: C.success, bg: "rgba(34,197,94,0.12)" },
  cancelled:        { label: "Cancelled",         color: C.danger,  bg: "rgba(239,68,68,0.12)" },
};

function StatusBadge({ booking }) {
  let s = booking.status || "pending";
  if (s === "pending" && booking.partnerConfirmed === "true") s = "partner_confirmed";
  if (s === "pending" && booking.operatorConfirmed === "true") s = "operator_confirmed";
  const cfg = STATUS_CFG[s] || STATUS_CFG.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
      {cfg.label}
    </span>
  );
}

const PARTNER_STATUS_CFG = {
  pending:   { label: "Na čekanju", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  trial:     { label: "Trial",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  active:    { label: "Aktivan",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  suspended: { label: "Suspendiran", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

const PBOOKING_STATUS_CFG = {
  pending:           { label: "Na čekanju",   color: "#f59e0b" },
  partner_confirmed: { label: "Partner ✓",    color: "#818cf8" },
  confirmed:         { label: "Potvrđeno ✓",  color: "#22c55e" },
  rejected:          { label: "Odbijeno",     color: "#ef4444" },
  cancelled:         { label: "Otkazano",     color: "#7a8fa8" },
};

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");

  const [mainTab, setMainTab] = useState("bookings"); // bookings | partners | marketing

  // Marketing tab state
  const [mkSegment, setMkSegment] = useState("de_camper");
  const [mkBudget, setMkBudget] = useState("10");
  const [mkLoading, setMkLoading] = useState(false);
  const [mkStep, setMkStep] = useState(null); // null | 1 | 2 | 3 | 4 | "done" | "error"
  const [mkLog, setMkLog] = useState([]);
  const [mkInsights, setMkInsights] = useState(null);
  const [mkInsightsLoading, setMkInsightsLoading] = useState(false);
  const [mkOptLoading, setMkOptLoading] = useState(false);
  const [mkOptResult, setMkOptResult] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | confirmed
  const [selected, setSelected] = useState(null); // booking detail modal
  const [confirming, setConfirming] = useState(null); // bookingId being confirmed

  // Partners state
  const [partners, setPartners] = useState([]);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerBookings, setPartnerBookings] = useState([]);
  const [pbLoading, setPbLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [pbFilter, setPbFilter] = useState("all");
  const [statusChanging, setStatusChanging] = useState(null);

  // B2B Outreach state
  const [partnersSubTab, setPartnersSubTab] = useState("registered"); // "registered" | "b2b"
  const [b2bContacts, setB2bContacts] = useState([]);
  const [b2bStats, setB2bStats] = useState(null);
  const [b2bLoading, setB2bLoading] = useState(false);
  const [b2bQuotaError, setB2bQuotaError] = useState(false);
  const [b2bFetchError, setB2bFetchError] = useState("");
  const [b2bLoaded, setB2bLoaded] = useState(false);
  const [b2bFilter, setB2bFilter] = useState({ region: "all", type: "all", tier: "all", step: "all" });
  const [b2bSearch, setB2bSearch] = useState("");
  const [selectedB2b, setSelectedB2b] = useState(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("jadran_admin_token");
      if (t) { setToken(t); setAuth(true); }
    } catch {}
  }, []);

  const doLogin = async () => {
    try {
      const r = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (r.ok) {
        setAuth(true);
        setToken(pin);
        setPinErr("");
        try { localStorage.setItem("jadran_admin_token", pin); } catch {}
      } else {
        const status = r.status;
        if (status === 503) setPinErr("Server: ADMIN_TOKEN env var nije postavljen u Vercel");
        else if (status === 404) setPinErr("Server: /api/admin-login endpoint nije pronađen (404)");
        else setPinErr(`Pogrešan PIN (HTTP ${status})`);
      }
    } catch (e) {
      setPinErr("Network greška: " + (e?.message || "provjeri vezu"));
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/bookings", {
        headers: { "x-admin-token": encTok(token) },
      });
      if (r.ok) {
        const data = await r.json();
        setBookings(data.bookings || []);
      }
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { if (auth) fetchBookings(); }, [auth, fetchBookings]);

  const confirmBooking = async (id, role) => {
    setConfirming(id);
    try {
      const r = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": encTok(token) },
        body: JSON.stringify({ id, role }),
      });
      if (r.ok) {
        await fetchBookings();
        if (selected?.id === id) {
          setSelected(prev => {
            const updated = { ...prev };
            if (role === "partner")  updated.partnerConfirmed = "true";
            if (role === "operator") updated.operatorConfirmed = "true";
            if (updated.partnerConfirmed === "true" && updated.operatorConfirmed === "true") {
              updated.status = "confirmed";
            }
            return updated;
          });
        }
      }
    } catch {}
    setConfirming(null);
  };

  // ── Partner data ──
  const fetchPartners = useCallback(async () => {
    setPartnerLoading(true);
    try {
      const r = await fetch("/api/partner-auth?action=admin-list", {
        headers: { "x-admin-token": encTok(token) },
      });
      if (r.ok) {
        const data = await r.json();
        setPartners(data.partners || []);
      }
    } catch {}
    setPartnerLoading(false);
  }, [token]);

  const fetchPartnerBookings = useCallback(async () => {
    setPbLoading(true);
    try {
      const r = await fetch("/api/partner-bookings?action=admin-all", {
        headers: { "x-admin-token": encTok(token) },
      });
      if (r.ok) {
        const data = await r.json();
        setPartnerBookings(data.bookings || []);
      }
    } catch {}
    setPbLoading(false);
  }, [token]);

  const setPartnerStatus = async (partnerId, status) => {
    setStatusChanging(partnerId);
    try {
      const r = await fetch("/api/partner-auth?action=admin-set-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": encTok(token) },
        body: JSON.stringify({ partnerId, status }),
      });
      if (r.ok) {
        setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, status } : p));
        if (selectedPartner?.id === partnerId) setSelectedPartner(p => ({ ...p, status }));
      }
    } catch {}
    setStatusChanging(null);
  };

  const verifyPartner = async (partnerId) => {
    setStatusChanging(partnerId);
    try {
      const r = await fetch("/api/partner-auth?action=admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": encTok(token) },
        body: JSON.stringify({ partnerId }),
      });
      if (r.ok) {
        setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, status: "trial", verified: true } : p));
        if (selectedPartner?.id === partnerId) setSelectedPartner(p => ({ ...p, status: "trial", verified: true }));
      }
    } catch {}
    setStatusChanging(null);
  };

  const [prefillStatus, setPrefillStatus] = useState(null);
  const runB2bPrefill = async () => {
    setPrefillStatus("running");
    try {
      const r = await fetch("/api/partner-auth?action=b2b-prefill", {
        method: "POST",
        headers: { "x-admin-token": encTok(token) },
      });
      const d = await r.json();
      setPrefillStatus(d.ok ? `✓ ${d.created} kreirano, ${d.skipped} preskočeno` : `Greška: ${d.error}`);
      if (d.ok) fetchPartners();
    } catch (e) {
      setPrefillStatus(`Greška: ${e.message}`);
    }
  };

  const platformConfirmPB = async (id) => {
    setConfirming(id);
    try {
      const r = await fetch(`/api/partner-bookings?action=platform-confirm&id=${id}`, {
        method: "POST",
        headers: { "x-admin-token": encTok(token) },
      });
      if (r.ok) {
        const data = await r.json();
        setPartnerBookings(prev => prev.map(b => b.id === id ? { ...b, status: data.status, platformConfirmed: "true" } : b));
      }
    } catch {}
    setConfirming(null);
  };

  const fetchB2bData = useCallback(async (filter, search) => {
    setB2bLoading(true);
    setB2bQuotaError(false);
    setB2bFetchError("");
    try {
      const tok = encTok(token);
      // Fetch stats (1 point read — always works)
      const sr = await fetch("/api/b2b-outreach?action=stats", { headers: { "x-admin-token": tok } });
      if (sr.ok) { const sd = await sr.json(); if (sd.ok) setB2bStats(sd.stats); }
      else setB2bFetchError(`Stats HTTP ${sr.status}`);

      // Fetch contact list
      const params = new URLSearchParams({ action: "list" });
      if (filter.region !== "all") params.set("region", filter.region);
      if (filter.type   !== "all") params.set("type",   filter.type);
      if (filter.tier   !== "all") params.set("tier",   filter.tier);
      if (filter.step   !== "all") params.set("step",   filter.step);
      if (search) params.set("search", search);
      const lr = await fetch(`/api/b2b-outreach?${params}`, { headers: { "x-admin-token": tok } });
      if (!lr.ok) {
        setB2bFetchError(`Lista HTTP ${lr.status} — provjeri token`);
      } else {
        const ld = await lr.json();
        if (ld.error === "quota_exceeded") { setB2bQuotaError(true); setB2bContacts([]); }
        else { setB2bContacts(ld.contacts || []); setB2bLoaded(true); }
      }
    } catch (e) {
      setB2bFetchError("Network greška: " + (e?.message || "?"));
    }
    setB2bLoading(false);
  }, [token]);

  useEffect(() => {
    if (auth && mainTab === "partners") {
      if (partnersSubTab === "registered") {
        fetchPartners();
        fetchPartnerBookings();
      } else if (!b2bLoaded) {
        fetchB2bData(b2bFilter, b2bSearch);
      }
    }
  }, [auth, mainTab, partnersSubTab, fetchPartners, fetchPartnerBookings, fetchB2bData, b2bLoaded, b2bFilter, b2bSearch]);

  const filtered = bookings.filter(b => {
    if (filter === "pending")   return b.status !== "confirmed" && b.status !== "cancelled";
    if (filter === "confirmed") return b.status === "confirmed";
    return true;
  });

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
  };

  // B2B derived values
  const b2bSt    = b2bStats || {};
  const b2bTotal = b2bSt.total || 0;
  const b2bSent  = b2bTotal - (b2bSt.byStep?.["0"] || 0);

  // ── Login screen ──
  if (!auth) {
    return (
      <div style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 400, width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: "40px 36px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 6 }}>Admin Panel</h1>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>JADRAN.ai · Operator Access</p>
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="Enter PIN"
            autoFocus
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: C.card, border: `1px solid ${pinErr ? C.danger : C.border}`, color: C.white, fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box" }}
          />
          {pinErr && <p style={{ fontSize: 12, color: C.danger, marginBottom: 12, wordBreak: "break-word" }}>{pinErr}</p>}
          <button onClick={doLogin}
            style={{ width: "100%", padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, #0085a8)`, color: "#fff", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Sign In →
          </button>
        </div>
      </div>
    );
  }

  // ── Main panel ──
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: C.white }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .row:hover { background: rgba(0,180,216,0.04) !important; }
        .row { transition: background 0.15s; cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: rgba(0,180,216,0.2); border-radius: 3px; }
      `}</style>

      {/* HEADER */}
      <header style={{ padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: "rgba(7,17,31,0.95)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 20, fontFamily: "Georgia, serif", fontWeight: 700 }}>
            <span style={{ color: C.white }}>JADRAN</span><span style={{ color: C.gold }}>.ai</span>
          </span>
          <span style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "1.5px", borderLeft: `1px solid ${C.border}`, paddingLeft: 14 }}>ADMIN PANEL</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={fetchBookings} disabled={loading}
            style={{ padding: "7px 14px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          <button onClick={() => { try { localStorage.removeItem("jadran_admin_token"); } catch {} window.location.reload(); }}
            style={{ padding: "7px 14px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            Sign out
          </button>
        </div>
      </header>

      {/* MAIN TAB BAR */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, background: C.surface, padding: "0 28px" }}>
        {[
          { id: "bookings", label: "🏨 Bookings" },
          { id: "partners", label: "🤝 Partneri" },
          { id: "marketing", label: "📣 Marketing" },
        ].map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            style={{ padding: "14px 20px", border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
              fontWeight: mainTab === t.id ? 700 : 400, fontSize: 13,
              color: mainTab === t.id ? C.accent : C.muted,
              borderBottom: mainTab === t.id ? `2px solid ${C.accent}` : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* ══ BOOKINGS TAB ══ */}
        {mainTab === "bookings" && <>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Bookings", val: stats.total, color: C.accent },
            { label: "Pending",        val: stats.pending,   color: C.warning },
            { label: "Confirmed",      val: stats.confirmed, color: C.success },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color, marginBottom: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: "0.5px" }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all", "pending", "confirmed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 18px", borderRadius: 10, border: `1px solid ${filter === f ? C.accent : C.border}`, background: filter === f ? `${C.accent}18` : "transparent", color: filter === f ? C.accent : C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
              {f === "all" ? `All (${stats.total})` : f === "pending" ? `Pending (${stats.pending})` : `Confirmed (${stats.confirmed})`}
            </button>
          ))}
        </div>

        {/* BOOKINGS TABLE */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 120px 100px 90px 80px", gap: 0, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.8px" }}>
            <span>BOOKING ID</span>
            <span>GUEST / ACCOMMODATION</span>
            <span>DATES</span>
            <span>CONFIRM</span>
            <span>STATUS</span>
            <span></span>
          </div>

          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading bookings…</div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
              {filter === "all" ? "No bookings yet." : `No ${filter} bookings.`}
            </div>
          )}

          {!loading && filtered.map((b, i) => {
            const partnerOk = b.partnerConfirmed === "true";
            const opOk = b.operatorConfirmed === "true";
            const needsPartner = !partnerOk && b.status !== "confirmed";
            const needsOp = !opOk && b.status !== "confirmed";

            return (
              <div key={b.id || i} className="row"
                style={{ display: "grid", gridTemplateColumns: "200px 1fr 120px 100px 90px 80px", gap: 0, padding: "14px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center", animation: "fadeIn 0.3s ease forwards" }}
                onClick={() => setSelected(b)}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.id}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{b.guestName}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{b.accommodationName || b.destinationName} {b.accommodationDirect === "true" && "✓"}</div>
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  <div>{b.arrival}</div>
                  <div style={{ fontSize: 10 }}>{b.departure} · {b.nights}n</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }} onClick={e => e.stopPropagation()}>
                  {needsPartner && (
                    <button onClick={() => confirmBooking(b.id, "partner")} disabled={confirming === b.id}
                      style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(129,140,248,0.15)", border: `1px solid rgba(129,140,248,0.35)`, color: "#818cf8", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {confirming === b.id ? "…" : "Partner ✓"}
                    </button>
                  )}
                  {needsOp && (
                    <button onClick={() => confirmBooking(b.id, "operator")} disabled={confirming === b.id}
                      style={{ padding: "4px 8px", borderRadius: 6, background: `rgba(0,180,216,0.12)`, border: `1px solid ${C.border}`, color: C.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {confirming === b.id ? "…" : "Op. ✓"}
                    </button>
                  )}
                  {!needsPartner && !needsOp && <span style={{ fontSize: 11, color: C.success }}>All ✓</span>}
                </div>
                <StatusBadge booking={b} />
                <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
                  {b.guests}👤
                </div>
              </div>
            );
          })}
        </div>

        </> /* end bookings tab */}

        {/* ══ PARTNERS TAB ══ */}
        {mainTab === "partners" && <>

          {/* Sub-tab toggle */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: C.surface, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, width: "fit-content" }}>
            {[{ id: "registered", label: "🤝 Registrirani" }, { id: "b2b", label: "📧 B2B Outreach" }].map(t => (
              <button key={t.id} onClick={() => setPartnersSubTab(t.id)}
                style={{ padding: "7px 18px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 12, fontWeight: partnersSubTab === t.id ? 700 : 500,
                  background: partnersSubTab === t.id ? C.accent : "transparent",
                  color: partnersSubTab === t.id ? "#fff" : C.muted,
                  transition: "all 0.15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Registrirani sub-tab ── */}
          {partnersSubTab === "registered" && <>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 16 }}>
            {[
              { label: "Ukupno", val: partners.length, color: C.accent },
              { label: "Na čekanju", val: partners.filter(p => p.status === "pending").length, color: "#a855f7" },
              { label: "Trial",   val: partners.filter(p => p.status === "trial").length,     color: "#f59e0b" },
              { label: "Aktivni", val: partners.filter(p => p.status === "active").length,    color: C.success },
              { label: "Bookingsi", val: partnerBookings.length, color: C.info },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.5px" }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {/* B2B Prefill button */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={runB2bPrefill} disabled={prefillStatus === "running"}
              style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid #a855f7`, background: "rgba(168,85,247,0.1)",
                color: "#a855f7", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {prefillStatus === "running" ? "Kreiranje…" : "🔄 B2B Prefill — kreiraj pending kartice"}
            </button>
            {prefillStatus && prefillStatus !== "running" && (
              <span style={{ fontSize: 12, color: prefillStatus.startsWith("✓") ? C.success : "#ef4444" }}>{prefillStatus}</span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Partners list */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.muted, letterSpacing: "0.8px" }}>PARTNERI</h3>
                <button onClick={fetchPartners} disabled={partnerLoading}
                  style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                  {partnerLoading ? "…" : "↻"}
                </button>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                {partnerLoading && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Učitavanje…</div>}
                {!partnerLoading && partners.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Nema registrovanih partnera.</div>}
                {partners.map((p, i) => {
                  const stCfg = PARTNER_STATUS_CFG[p.status] || PARTNER_STATUS_CFG.trial;
                  const isSelected = selectedPartner?.id === p.id;
                  return (
                    <div key={p.id} onClick={() => setSelectedPartner(p)}
                      style={{ padding: "12px 16px", borderBottom: i < partners.length - 1 ? `1px solid ${C.border}` : "none",
                        cursor: "pointer", background: isSelected ? `rgba(0,180,216,0.06)` : "transparent",
                        borderLeft: isSelected ? `3px solid ${C.accent}` : "3px solid transparent",
                        transition: "background 0.15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.white }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.type} · {p.city}</div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{p.email}</div>
                        </div>
                        <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, background: stCfg.bg, color: stCfg.color }}>
                          {stCfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Partner detail */}
            <div>
              {!selectedPartner ? (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
                  ← Odaberi partnera za detalje
                </div>
              ) : (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 2 }}>{selectedPartner.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{selectedPartner.type} · {selectedPartner.city}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, color: C.accent, marginTop: 4 }}>{selectedPartner.id}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      ["Email", selectedPartner.email],
                      ["Tel", selectedPartner.phone || "—"],
                      ["Adresa", selectedPartner.address || "—"],
                      ["Trial do", selectedPartner.trialEnds || "—"],
                      ["Registrovan", selectedPartner.createdAt ? new Date(selectedPartner.createdAt).toLocaleDateString("hr-HR") : "—"],
                      ["Izvor", selectedPartner.source || "direktan"],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: C.card, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.6px" }}>{l.toUpperCase()}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, wordBreak: "break-all" }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status actions */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8, letterSpacing: "0.6px" }}>STATUS AKCIJE</div>
                    {selectedPartner.status === "pending" ? (
                      <button onClick={() => verifyPartner(selectedPartner.id)}
                        disabled={statusChanging === selectedPartner.id}
                        style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #22c55e",
                          background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: 12, fontWeight: 700,
                          cursor: "pointer", fontFamily: "inherit", opacity: statusChanging === selectedPartner.id ? 0.5 : 1 }}>
                        {statusChanging === selectedPartner.id ? "…" : "✓ Aktiviraj Trial"}
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["trial","active","suspended"].map(s => (
                          <button key={s} onClick={() => setPartnerStatus(selectedPartner.id, s)}
                            disabled={statusChanging === selectedPartner.id || selectedPartner.status === s}
                            style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${PARTNER_STATUS_CFG[s].color}50`,
                              background: selectedPartner.status === s ? `${PARTNER_STATUS_CFG[s].color}20` : "transparent",
                              color: PARTNER_STATUS_CFG[s].color, fontSize: 11, fontWeight: 700,
                              cursor: selectedPartner.status === s ? "default" : "pointer", fontFamily: "inherit",
                              opacity: statusChanging === selectedPartner.id ? 0.5 : 1 }}>
                            {statusChanging === selectedPartner.id ? "…" : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Partner's bookings */}
                  <div>
                    <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8, letterSpacing: "0.6px" }}>BOOKINGSI OD OVOG PARTNERA</div>
                    {(() => {
                      const pb = partnerBookings.filter(b => b.partnerId === selectedPartner.id);
                      if (pb.length === 0) return <div style={{ fontSize: 12, color: C.muted }}>Nema bookingsa.</div>;
                      return pb.map(b => {
                        const stCfg = PBOOKING_STATUS_CFG[b.status] || PBOOKING_STATUS_CFG.pending;
                        const needsPlatform = b.platformConfirmed !== "true" && b.status !== "confirmed" && b.status !== "rejected";
                        return (
                          <div key={b.id} style={{ background: C.card, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <div>
                                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.accent }}>{b.id}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{b.guestName}</div>
                                <div style={{ fontSize: 11, color: C.muted }}>{b.capacityName} · {b.checkIn} → {b.checkOut}</div>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: stCfg.color, whiteSpace: "nowrap" }}>{stCfg.label}</span>
                            </div>
                            {needsPlatform && (
                              <button onClick={() => platformConfirmPB(b.id)} disabled={confirming === b.id}
                                style={{ padding: "5px 12px", borderRadius: 7, background: `rgba(0,180,216,0.12)`, border: `1px solid ${C.border}`, color: C.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                {confirming === b.id ? "…" : "Platform potvrdi ✓"}
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
          </> /* end registered sub-tab */}

          {/* ── B2B Outreach sub-tab ── */}
          {partnersSubTab === "b2b" && (<>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Ukupno kontakata", val: b2bTotal, color: C.accent },
                  { label: "Novi (čekaju)",     val: b2bSt.byStep?.["0"] || 0, color: "#f59e0b" },
                  { label: "Email poslan",       val: b2bSent, color: C.info },
                  { label: "Otvorili",           val: b2bSt.opened || 0, color: C.success },
                  { label: "Registrovani",       val: b2bSt.registered || 0, color: "#a855f7" },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.5px" }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Region breakdown mini-bars */}
              {b2bSt.byRegion && Object.keys(b2bSt.byRegion).length > 0 && (
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                  {Object.entries(b2bSt.byRegion).sort((a,b) => b[1]-a[1]).map(([r, n]) => (
                    <div key={r} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{r.replace("_"," ")}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{n}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { key: "region", opts: ["all","istra","kvarner","zadar_sibenik","dubrovnik"], labels: { all:"Sve regije", istra:"Istra", kvarner:"Kvarner", zadar_sibenik:"Zadar-Šibenik", dubrovnik:"Dubrovnik" } },
                  { key: "type",   opts: ["all","kamp","smještaj","restoran","konoba","marina","other"], labels: { all:"Sve vrste", kamp:"Kamp", "smještaj":"Smještaj", restoran:"Restoran", konoba:"Konoba", marina:"Marina", other:"Ostalo" } },
                  { key: "tier",   opts: ["all","A","B","C"], labels: { all:"Sve tier", A:"Tier A", B:"Tier B", C:"Tier C" } },
                  { key: "step",   opts: ["all","0","1","2","3","4","5"], labels: { all:"Svi koraci", "0":"Novi", "1":"Email 1", "2":"Email 2", "3":"Email 3", "4":"Email 4", "5":"Završeno" } },
                ].map(({ key, opts, labels }) => (
                  <select key={key} value={b2bFilter[key]}
                    onChange={e => setB2bFilter(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: b2bFilter[key] !== "all" ? C.accent : C.muted,
                      fontSize: 12, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                    {opts.map(o => <option key={o} value={o}>{labels[o] || o}</option>)}
                  </select>
                ))}
                <input value={b2bSearch} onChange={e => setB2bSearch(e.target.value)}
                  placeholder="Pretraži po imenu / emailu / gradu…"
                  style={{ flex: 1, minWidth: 200, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface,
                    color: C.white, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => fetchB2bData(b2bFilter, b2bSearch)} disabled={b2bLoading}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.accent, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {b2bLoading ? "…" : "Traži"}
                </button>
              </div>

              {/* Quota error banner */}
              {b2bQuotaError && (
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: "#f59e0b" }}>
                  ⚠️ Firestore runQuery kvota iscrpljena — lista kontakata nije dostupna. Stats rade normalno. Lista će raditi nakon što se Blaze kvota aktivira (obično u roku od par sati od upgraja).
                </div>
              )}

              {/* Main 2-col layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Contact list */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: "0.8px" }}>
                      B2B KONTAKTI {b2bContacts.length > 0 && <span style={{ color: C.accent }}>({b2bContacts.length})</span>}
                    </h3>
                    <button onClick={() => fetchB2bData(b2bFilter, b2bSearch)} disabled={b2bLoading}
                      style={{ padding: "5px 12px", borderRadius: 8, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      {b2bLoading ? "…" : "↻"}
                    </button>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", maxHeight: 520, overflowY: "auto" }}>
                    {b2bLoading && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Učitavanje…</div>}
                    {b2bFetchError && (
                      <div style={{ padding: 16, color: C.danger, fontSize: 12 }}>⚠ {b2bFetchError}</div>
                    )}
                    {!b2bLoading && !b2bFetchError && b2bContacts.length === 0 && !b2bQuotaError && (
                      <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>
                        {b2bLoaded ? "Nema rezultata." : "Učitavanje…"}
                      </div>
                    )}
                    {b2bContacts.map((c, i) => {
                      const stepCfg = B2B_STEP_CFG[c.step || 0] || B2B_STEP_CFG[0];
                      const isSelected = selectedB2b?.id === c.id;
                      return (
                        <div key={c.id} onClick={() => setSelectedB2b(c)}
                          style={{ padding: "10px 14px", borderBottom: i < b2bContacts.length - 1 ? `1px solid ${C.border}` : "none",
                            cursor: "pointer", background: isSelected ? "rgba(0,180,216,0.06)" : "transparent",
                            borderLeft: isSelected ? `3px solid ${C.accent}` : "3px solid transparent",
                            transition: "background 0.15s" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 12, color: C.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.objectName || c.email}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                                {B2B_TYPE_LABELS[c.type] || c.type} · {c.city}
                                {c.capacity > 0 && <span style={{ marginLeft: 4 }}>· {c.capacity} mjesta</span>}
                              </div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{c.email}</div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0, marginLeft: 8 }}>
                              <span style={{ padding: "2px 7px", borderRadius: 10, fontSize: 9, fontWeight: 700, background: stepCfg.bg, color: stepCfg.color }}>{stepCfg.label}</span>
                              <span style={{ fontSize: 9, fontWeight: 800, color: c.tier === "A" ? C.success : c.tier === "B" ? C.warning : C.muted }}>T{c.tier}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contact detail */}
                <div>
                  {!selectedB2b ? (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>
                      ← Odaberi kontakt za detalje
                    </div>
                  ) : (
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.white }}>{selectedB2b.objectName}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {B2B_TYPE_LABELS[selectedB2b.type] || selectedB2b.type} · {selectedB2b.city} · {selectedB2b.region}
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
                        {[
                          ["Email",    selectedB2b.email],
                          ["Telefon",  selectedB2b.phone || "—"],
                          ["Adresa",   selectedB2b.address || "—"],
                          ["Kapacitet",selectedB2b.capacity > 0 ? `${selectedB2b.capacity} mjesta` : "—"],
                          ["Tier",     selectedB2b.tier || "—"],
                          ["Jezik",    selectedB2b.lang || "—"],
                        ].map(([l, v]) => (
                          <div key={l} style={{ background: C.card, borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.5px" }}>{l.toUpperCase()}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, wordBreak: "break-all" }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                      {/* Email sequence status */}
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 8, letterSpacing: "0.6px" }}>EMAIL SEKVENCA</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[0,1,2,3,4,5].map(s => {
                            const cfg = B2B_STEP_CFG[s];
                            const done = (selectedB2b.step || 0) > s;
                            const current = (selectedB2b.step || 0) === s;
                            return (
                              <div key={s} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                                background: done ? "rgba(34,197,94,0.15)" : current ? cfg.bg : "rgba(0,0,0,0.2)",
                                color: done ? C.success : current ? cfg.color : C.muted,
                                border: `1px solid ${done ? "rgba(34,197,94,0.3)" : current ? cfg.color+"40" : "transparent"}` }}>
                                {s === 0 ? "Novi" : s === 5 ? "Završeno" : `E${s}`}
                                {done && " ✓"}
                              </div>
                            );
                          })}
                        </div>
                        {selectedB2b.nextSendAt && (selectedB2b.step || 0) < 5 && (
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>
                            Sljedeći email: {new Date(selectedB2b.nextSendAt).toLocaleDateString("hr-HR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                        {selectedB2b.opened && <div style={{ fontSize: 10, color: C.success, marginTop: 4 }}>✓ Otvorio email</div>}
                        {selectedB2b.clicked && <div style={{ fontSize: 10, color: "#a855f7", marginTop: 2 }}>✓ Kliknuo link</div>}
                        {selectedB2b.registered && <div style={{ fontSize: 10, color: C.accent, marginTop: 2, fontWeight: 700 }}>★ Registrovan kao partner!</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </>)}

        </> /* end partners tab */}

        {mainTab === "marketing" && (
          <MarketingTab
            token={token} C={C}
            segment={mkSegment} setSegment={setMkSegment}
            budget={mkBudget} setBudget={setMkBudget}
            loading={mkLoading} setLoading={setMkLoading}
            step={mkStep} setStep={setMkStep}
            log={mkLog} setLog={setMkLog}
            insights={mkInsights} setInsights={setMkInsights}
            insightsLoading={mkInsightsLoading} setInsightsLoading={setMkInsightsLoading}
            optLoading={mkOptLoading} setOptLoading={setMkOptLoading}
            optResult={mkOptResult} setOptResult={setMkOptResult}
          />
        )}

      </div>

      {/* DETAIL MODAL */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,17,31,0.85)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: "32px 28px 40px", width: "100%", maxWidth: 600, maxHeight: "85dvh", overflowY: "auto", animation: "fadeIn 0.25s ease" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: C.accent, marginBottom: 4 }}>{selected.id}</div>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selected.guestName}</h2>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ padding: "6px 14px", borderRadius: 10, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[
                ["Destination", selected.destinationName],
                ["Accommodation", selected.accommodationName + (selected.accommodationDirect === "true" ? " (direct)" : "")],
                ["Arrival", selected.arrival],
                ["Departure", selected.departure],
                ["Nights", selected.nights],
                ["Guests", selected.guests],
                ["Email", selected.guestEmail || "—"],
                ["Language", selected.lang || "en"],
                ["Created", selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"],
                ["Device ID", selected.deviceId || "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ background: C.card, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.8px", marginBottom: 3 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, wordBreak: "break-all" }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            {/* Confirmation status */}
            <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, marginBottom: 12, letterSpacing: "0.8px" }}>CONFIRMATION STATUS</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: selected.partnerConfirmed === "true" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.1)", color: selected.partnerConfirmed === "true" ? C.success : C.warning, border: `1px solid ${selected.partnerConfirmed === "true" ? C.success : C.warning}40` }}>
                  {selected.partnerConfirmed === "true" ? "✓ Partner confirmed" : "○ Partner pending"}
                </span>
                <span style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: selected.operatorConfirmed === "true" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.1)", color: selected.operatorConfirmed === "true" ? C.success : C.warning, border: `1px solid ${selected.operatorConfirmed === "true" ? C.success : C.warning}40` }}>
                  {selected.operatorConfirmed === "true" ? "✓ Operator confirmed" : "○ Operator pending"}
                </span>
              </div>
              <StatusBadge booking={selected} />
            </div>

            {/* Actions */}
            {selected.status !== "confirmed" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {selected.partnerConfirmed !== "true" && (
                  <button onClick={() => confirmBooking(selected.id, "partner")} disabled={confirming === selected.id}
                    style={{ flex: 1, padding: "12px", borderRadius: 12, background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.35)", color: "#818cf8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {confirming === selected.id ? "Confirming…" : "Confirm as Partner"}
                  </button>
                )}
                {selected.operatorConfirmed !== "true" && (
                  <button onClick={() => confirmBooking(selected.id, "operator")} disabled={confirming === selected.id}
                    style={{ flex: 1, padding: "12px", borderRadius: 12, background: `rgba(0,180,216,0.12)`, border: `1px solid ${C.border}`, color: C.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    {confirming === selected.id ? "Confirming…" : "Confirm as Operator"}
                  </button>
                )}
              </div>
            )}
            {selected.status === "confirmed" && (
              <div style={{ padding: "14px", borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: C.success, fontSize: 14, fontWeight: 700, textAlign: "center" }}>
                ✓ Booking fully confirmed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MARKETING TAB ────────────────────────────────────────────────────────────
const SEGMENTS = [
  { id: "de_camper",  label: "🚐 DE Camper",   geo: "DE/AT/CH" },
  { id: "de_family",  label: "👨‍👩‍👧 DE Family",   geo: "DE/AT/CH" },
  { id: "it_sailor",  label: "⛵ IT Sailor",    geo: "IT" },
  { id: "en_cruiser", label: "🚢 EN Cruiser",   geo: "GB/US/AU" },
  { id: "en_camper",  label: "🏕️ EN Camper",    geo: "GB/US/AU" },
  { id: "en_couple",  label: "💑 EN Couple",    geo: "GB/US/AU" },
];

function MkCard({ children, C, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

function MkLabel({ children, C }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: C.accent, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function MarketingTab({ token, C, segment, setSegment, budget, setBudget, loading, setLoading, step, setStep, log, setLog, insights, setInsights, insightsLoading, setInsightsLoading, optLoading, setOptLoading, optResult, setOptResult }) {
  const hdr = { "Content-Type": "application/json", "x-admin-token": btoa(token) };

  const runCampaign = async () => {
    setLoading(true);
    setLog([]);
    setStep(1);
    const name = `JADRAN_${segment.toUpperCase()}_${new Date().toISOString().slice(0,7).replace("-","_")}`;
    const budgetCents = Math.round(parseFloat(budget) * 100);

    try {
      // Step 1 — generate variants
      setLog(l => [...l, { ok: true,  text: `[1/4] Generiranje varijanti za ${segment}…` }]);
      const g = await fetch("/api/campaign-generate", { method: "POST", headers: hdr, body: JSON.stringify({ segmentId: segment, count: 10 }) });
      if (!g.ok) throw new Error(`campaign-generate: ${g.status}`);
      const gData = await g.json();
      const variants = gData.variants || [];
      setLog(l => [...l, { ok: true, text: `    ✓ ${variants.length} varijanti generirano` }]);

      // Helper: fetch meta-ads and surface real error message
      const metaCall = async (action, body) => {
        const r = await fetch("/api/meta-ads", { method: "POST", headers: hdr, body: JSON.stringify({ action, ...body }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `${action}: HTTP ${r.status}`);
        return d;
      };

      // Step 2 — create campaign
      setStep(2);
      setLog(l => [...l, { ok: true, text: `[2/4] Kreiranje kampanje "${name}"…` }]);
      const cData = await metaCall("create_campaign", { name });
      const campaignId = cData.id;
      setLog(l => [...l, { ok: true, text: `    ✓ Campaign ID: ${campaignId} (PAUSED)` }]);

      // Step 3 — create adset
      setStep(3);
      setLog(l => [...l, { ok: true, text: `[3/4] Kreiranje AdSeta (${budgetCents/100}€/dan)…` }]);
      const aData = await metaCall("create_adset", { campaignId, segmentId: segment, dailyBudget: budgetCents, name: `${segment}_adset` });
      const adsetId = aData.id;
      setLog(l => [...l, { ok: true, text: `    ✓ AdSet ID: ${adsetId}` }]);

      // Step 4 — push top 5 ads
      setStep(4);
      setLog(l => [...l, { ok: true, text: `[4/4] Push top 5 ads…` }]);
      const pData = await metaCall("push_winners", { segmentId: segment, adsetId, variants: variants.slice(0, 5) });
      const ok = (pData.results || []).filter(r => !r.error).length;
      setLog(l => [...l, { ok: true, text: `    ✓ ${ok} ads kreirano` }]);
      (pData.results || []).filter(r => r.error).forEach(r => {
        setLog(l => [...l, { ok: false, text: `    ✗ v${r.variantId}: ${r.error}` }]);
      });

      setStep("done");
      setLog(l => [...l, { ok: true, text: `\nKampanja kreirana. Status: PAUSED — aktiviraj u Ads Manageru.` }]);
    } catch (e) {
      setStep("error");
      setLog(l => [...l, { ok: false, text: `✗ Greška: ${e.message}` }]);
    }
    setLoading(false);
  };

  const pullInsights = async () => {
    setInsightsLoading(true);
    try {
      const r = await fetch(`/api/cron-insights?secret=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || r.status);
      setInsights(d);
    } catch (e) {
      setInsights({ error: e.message });
    }
    setInsightsLoading(false);
  };

  const runOptimize = async () => {
    setOptLoading(true);
    setOptResult(null);
    try {
      const r = await fetch(`/api/cron-meta-optimize?secret=${encodeURIComponent(token)}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || r.status);
      setOptResult(d);
    } catch (e) {
      setOptResult({ error: e.message });
    }
    setOptLoading(false);
  };

  const stepColor = s => s === "done" ? C.success : s === "error" ? C.danger : C.gold;

  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 760 }}>

      {/* ── Campaign Creator ── */}
      <MkCard C={C}>
        <MkLabel C={C}>Nova Kampanja</MkLabel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Segment</div>
            <select value={segment} onChange={e => setSegment(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
              {SEGMENTS.map(s => (
                <option key={s.id} value={s.id}>{s.label} · {s.geo}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Dnevni budget (€)</div>
            <input type="number" min="1" max="500" value={budget} onChange={e => setBudget(e.target.value)}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.white, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
        </div>

        <button onClick={runCampaign} disabled={loading}
          style={{ padding: "11px 28px", background: loading ? C.muted : C.accent, color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer", transition: "background 0.2s" }}>
          {loading ? `Korak ${typeof step === "number" ? step : "…"}/4` : "Kreiraj kampanju →"}
        </button>

        {/* Log output */}
        {log.length > 0 && (
          <div style={{ marginTop: 16, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.9, maxHeight: 220, overflowY: "auto" }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.ok ? (l.text.startsWith("\n") ? C.success : C.white) : C.danger }}>{l.text}</div>
            ))}
            {step === "done" && (
              <div style={{ marginTop: 8, color: C.muted, fontSize: 11 }}>
                Otvori Meta Ads Manager → pronađi kampanju → aktiviraj ručno.
              </div>
            )}
          </div>
        )}
      </MkCard>

      {/* ── Insights ── */}
      <MkCard C={C}>
        <MkLabel C={C}>Insights (juče)</MkLabel>
        <button onClick={pullInsights} disabled={insightsLoading}
          style={{ padding: "9px 20px", background: "transparent", color: C.accent, border: `1px solid ${C.accent}40`, borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: insightsLoading ? "wait" : "pointer", marginBottom: insights ? 14 : 0 }}>
          {insightsLoading ? "Učitava…" : "Povuci Meta Insights"}
        </button>

        {insights && !insights.error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Kampanja", "Imp.", "Klikovi", "Leadi", "Spend", "CPL", "CTR"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: h === "Kampanja" ? "left" : "right", color: C.muted, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(insights.campaigns || []).filter(c => !c.error).map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}20` }}>
                    <td style={{ padding: "8px 10px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.campaign_name}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>{(c.impressions||0).toLocaleString()}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>{c.clicks||0}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: c.leads > 0 ? C.success : C.muted }}>{c.leads||0}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>{(c.spend||0).toFixed(2)}€</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: c.cost_per_lead > 5 ? C.danger : C.success }}>{c.cost_per_lead > 0 ? c.cost_per_lead.toFixed(2)+"€" : "–"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: c.ctr < 0.5 ? C.warning : C.white }}>{c.ctr > 0 ? c.ctr.toFixed(2)+"%" : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 8 }}>Datum: {insights.date}</div>
          </div>
        )}
        {insights?.error && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>Greška: {insights.error}</div>}
      </MkCard>

      {/* ── Auto-Optimize ── */}
      <MkCard C={C}>
        <MkLabel C={C}>Auto-Optimizer (zadnjih 3 dana)</MkLabel>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
          Pauziraj kampanje s &gt;15€ spend + 0 leadova · CPL &gt;8€ · Flagiraj CTR &lt;0.3%
        </div>
        <button onClick={runOptimize} disabled={optLoading}
          style={{ padding: "9px 20px", background: "transparent", color: C.warning, border: `1px solid ${C.warning}40`, borderRadius: 8, fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: optLoading ? "wait" : "pointer", marginBottom: optResult ? 14 : 0 }}>
          {optLoading ? "Evaluira…" : "Pokreni Optimizer"}
        </button>

        {optResult && !optResult.error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(optResult.results || []).map((r, i) => {
              const color = r.action === "pause" ? C.danger : r.action === "flag" ? C.warning : C.success;
              const icon = r.action === "pause" ? "⏸" : r.action === "flag" ? "🔄" : "✅";
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: C.bg, borderRadius: 8, fontSize: 12 }}>
                  <span>{icon}</span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  <span style={{ color: C.muted }}>{r.spend?.toFixed(2)}€</span>
                  <span style={{ color: C.muted }}>{r.leads} leada</span>
                  <span style={{ color, fontWeight: 700, minWidth: 50 }}>{r.action?.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        )}
        {optResult?.error && <div style={{ color: C.danger, fontSize: 12, marginTop: 8 }}>Greška: {optResult.error}</div>}
      </MkCard>

    </div>
  );
}
