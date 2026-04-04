// ═══════════════════════════════════════════════════════════════
// JADRAN.AI — Admin Panel
// Route: jadran.ai/admin
// Features: Booking list, status management, dual-confirm
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from "react";

// PIN is entered at login, sent via POST body — never hardcoded here
// Token is base64-encoded when sent as HTTP header (handles special characters)
const encTok = t => { try { return btoa(t); } catch { return t; } };

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

export default function AdminPanel() {
  const [auth, setAuth] = useState(false);
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | confirmed
  const [selected, setSelected] = useState(null); // booking detail modal
  const [confirming, setConfirming] = useState(null); // bookingId being confirmed

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
        setPinErr(false);
        try { localStorage.setItem("jadran_admin_token", pin); } catch {}
      } else {
        setPinErr(true);
      }
    } catch {
      setPinErr(true);
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
          {pinErr && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>Incorrect PIN</p>}
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

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
