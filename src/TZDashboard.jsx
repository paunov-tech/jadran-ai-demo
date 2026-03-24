import { useState, useEffect, useCallback } from "react";

const FB_KEY = ""; // unused, TZ Dashboard uses /api/tz-* endpoints
const TZ_PINS = { "tz2026": "tz_makarska", "tzsplit": "tz_split", "tzpula": "tz_pula", "tzzadar": "tz_zadar", "tzdubrovnik": "tz_dubrovnik" };

// ── Styles ──
const dm = { fontFamily: "'DM Sans','Outfit',system-ui,sans-serif" };
const hf = { fontFamily: "'Cormorant Garamond',Georgia,serif" };
const C = {
  bg: "#0a1628", card: "rgba(12,28,50,0.8)", text: "#f0f9ff", mut: "#64748b",
  accent: "#0ea5e9", acDim: "rgba(14,165,233,0.08)", gold: "#f59e0b", goDim: "rgba(245,158,11,0.06)",
  green: "#22c55e", red: "#ef4444", bord: "rgba(14,165,233,0.06)", warm: "#f97316",
};

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, borderRadius: 18, padding: "20px 24px", border: `1px solid ${C.bord}`, backdropFilter: "blur(20px)", ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, primary, danger, disabled, style }) => (
  <button onClick={onClick} disabled={disabled} style={{
    ...dm, padding: "12px 24px", borderRadius: 14, border: "none", cursor: disabled ? "default" : "pointer",
    background: danger ? "rgba(239,68,68,0.15)" : primary ? `linear-gradient(135deg,${C.accent},#0284c7)` : "rgba(14,165,233,0.08)",
    color: danger ? C.red : primary ? "#fff" : C.accent, fontSize: 14, fontWeight: 600,
    opacity: disabled ? 0.5 : 1, ...style,
  }}>{children}</button>
);

const Input = ({ label, value, onChange, placeholder, type = "text", textarea }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...dm, width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 14, resize: "vertical", minHeight: 80, outline: "none", boxSizing: "border-box" }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...dm, width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${C.bord}`, background: "rgba(255,255,255,0.04)", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
    )}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, marginTop: 24 }}>{children}</div>
);

// ── Main Component ──
export default function TZDashboard() {
  const [pin, setPin] = useState("");
  const [tzId, setTzId] = useState(null);
  const [screen, setScreen] = useState("overview"); // overview, pois, events, analytics, emergency, add-poi, add-event
  const [pois, setPois] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // POI form
  const [poiForm, setPoiForm] = useState({ name: "", category: "restaurant", address: "", lat: "", lng: "", hours: "", phone: "", price: "", desc_hr: "", desc_en: "", desc_de: "" });

  // Event form
  const [eventForm, setEventForm] = useState({ name: "", date: "", time: "", location: "", category: "kultura", capacity: "", price: "", desc: "", booking_url: "" });

  // Emergency
  const [emergencyMsg, setEmergencyMsg] = useState("");
  const [emergencySent, setEmergencySent] = useState(false);

  // ── Auth ──
  const handleLogin = () => {
    const id = TZ_PINS[pin.toLowerCase().trim()];
    if (id) {
      setTzId(id);
      try { localStorage.setItem("jadran_tz_id", id); } catch {}
    } else {
      alert("Neispravan PIN. Kontaktirajte info@sialconsulting.com");
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jadran_tz_id");
      if (saved && Object.values(TZ_PINS).includes(saved)) setTzId(saved);
    } catch {}
  }, []);

  // ── Firestore helpers ──
  const FB_PROJECT = "molty-portal";
  const FB_API_KEY = import.meta.env.VITE_FB_API_KEY || "";

  const firestoreRead = useCallback(async (collection) => {
    try {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}?key=${FB_API_KEY}&pageSize=100`);
      if (!r.ok) return [];
      const data = await r.json();
      return (data.documents || []).map(doc => {
        const id = doc.name.split("/").pop();
        const fields = {};
        for (const [k, v] of Object.entries(doc.fields || {})) {
          fields[k] = v.stringValue || v.integerValue || v.doubleValue || v.booleanValue || "";
        }
        return { id, ...fields };
      });
    } catch { return []; }
  }, []);

  const firestoreWrite = useCallback(async (collection, docId, data) => {
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "number") fields[k] = { integerValue: String(v) };
      else if (typeof v === "boolean") fields[k] = { booleanValue: v };
      else fields[k] = { stringValue: String(v || "") };
    }
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/${collection}/${docId}?key=${FB_API_KEY}`;
      await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
      return true;
    } catch { return false; }
  }, []);

  // ── Load data ──
  useEffect(() => {
    if (!tzId) return;
    setLoading(true);
    Promise.all([
      firestoreRead(`jadran_poi`),
      firestoreRead(`jadran_events`),
      firestoreRead(`jadran_analytics`),
    ]).then(([p, e, a]) => {
      setPois(p.filter(x => x.tz_id === tzId || !x.tz_id));
      setEvents(e.filter(x => x.tz_id === tzId || !x.tz_id));
      if (a.length > 0) {
        const latest = a.sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
        setStats(latest);
      }
      setLoading(false);
    });
  }, [tzId, firestoreRead]);

  const tzName = (tzId || "").replace("tz_", "").replace(/^\w/, c => c.toUpperCase());

  // ── POI Save ──
  const savePoi = async () => {
    if (!poiForm.name || !poiForm.category) return alert("Ime i kategorija su obavezni");
    const docId = `poi_${Date.now()}`;
    const ok = await firestoreWrite("jadran_poi", docId, {
      ...poiForm, tz_id: tzId, created: new Date().toISOString(), active: true,
    });
    if (ok) {
      setPois(prev => [{ id: docId, ...poiForm, tz_id: tzId }, ...prev]);
      setPoiForm({ name: "", category: "restaurant", address: "", lat: "", lng: "", hours: "", phone: "", price: "", desc_hr: "", desc_en: "", desc_de: "" });
      setScreen("pois");
    }
  };

  // ── Event Save ──
  const saveEvent = async () => {
    if (!eventForm.name || !eventForm.date) return alert("Ime i datum su obavezni");
    const docId = `evt_${Date.now()}`;
    const ok = await firestoreWrite("jadran_events", docId, {
      ...eventForm, tz_id: tzId, created: new Date().toISOString(),
    });
    if (ok) {
      setEvents(prev => [{ id: docId, ...eventForm, tz_id: tzId }, ...prev]);
      setEventForm({ name: "", date: "", time: "", location: "", category: "kultura", capacity: "", price: "", desc: "", booking_url: "" });
      setScreen("events");
    }
  };

  // ── Login Screen ──
  if (!tzId) return (
    <div style={{ ...dm, background: C.bg, color: C.text, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <Card style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
        <div style={{ ...hf, fontSize: 28, fontWeight: 400, marginBottom: 4 }}>TZ Dashboard</div>
        <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 24 }}>Upravljačka ploča za turističke zajednice</div>
        <Input label="PIN" value={pin} onChange={setPin} placeholder="Unesite TZ PIN" />
        <Btn primary onClick={handleLogin} style={{ width: "100%", marginTop: 8 }}>Prijava</Btn>
        <div style={{ ...dm, fontSize: 11, color: C.mut, marginTop: 16 }}>Nemate PIN? info@sialconsulting.com</div>
      </Card>
    </div>
  );

  // ── Sidebar + Content ──
  const NAV = [
    { k: "overview", icon: "📊", l: "Pregled" },
    { k: "pois", icon: "📍", l: "Lokacije" },
    { k: "events", icon: "📅", l: "Eventi" },
    { k: "analytics", icon: "📈", l: "Analitika" },
    { k: "emergency", icon: "🚨", l: "Hitno" },
  ];

  const renderContent = () => {
    if (loading) return <div style={{ textAlign: "center", padding: 60, color: C.mut }}>Učitavam podatke...</div>;

    switch (screen) {
      case "overview":
        return (
          <>
            <div style={{ ...hf, fontSize: 32, fontWeight: 400, marginBottom: 4 }}>Dobrodošli, TZ {tzName}</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 24 }}>{new Date().toLocaleDateString("hr", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Lokacije", value: pois.length, icon: "📍", color: C.accent },
                { label: "Eventi", value: events.length, icon: "📅", color: C.gold },
                { label: "Sesije danas", value: stats?.sessions || "—", icon: "👥", color: C.green },
                { label: "Top jezik", value: stats?.top_lang || "DE", icon: "🌍", color: C.warm },
              ].map((s, i) => (
                <Card key={i} style={{ textAlign: "center", padding: "18px 16px" }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: s.color, marginTop: 4 }}>{s.value}</div>
                  <div style={{ ...dm, fontSize: 11, color: C.mut, marginTop: 2 }}>{s.label}</div>
                </Card>
              ))}
            </div>

            <SectionLabel>Brze akcije</SectionLabel>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Btn primary onClick={() => setScreen("add-poi")}>+ Nova lokacija</Btn>
              <Btn onClick={() => setScreen("add-event")}>+ Novi event</Btn>
              <Btn danger onClick={() => setScreen("emergency")}>🚨 Hitno obavještenje</Btn>
            </div>

            <SectionLabel>Nedavne lokacije</SectionLabel>
            {pois.slice(0, 5).map(p => (
              <Card key={p.id} style={{ marginBottom: 8, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ ...dm, fontSize: 12, color: C.mut }}>{p.category} · {p.address || "—"}</div>
                </div>
                <span style={{ ...dm, fontSize: 10, padding: "3px 10px", borderRadius: 8, background: p.active !== "false" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.active !== "false" ? C.green : C.red }}>{p.active !== "false" ? "Aktivno" : "Neaktivno"}</span>
              </Card>
            ))}
          </>
        );

      case "pois":
        return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ ...hf, fontSize: 28, fontWeight: 400 }}>Lokacije ({pois.length})</div>
              <Btn primary onClick={() => setScreen("add-poi")}>+ Dodaj</Btn>
            </div>
            {pois.map(p => (
              <Card key={p.id} style={{ marginBottom: 10, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ ...dm, fontSize: 12, color: C.mut }}>{p.address || "—"}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ ...dm, fontSize: 10, padding: "2px 8px", borderRadius: 6, background: C.acDim, color: C.accent }}>{p.category}</span>
                      {p.hours && <span style={{ ...dm, fontSize: 10, color: C.mut }}>🕐 {p.hours}</span>}
                      {p.phone && <span style={{ ...dm, fontSize: 10, color: C.mut }}>📞 {p.phone}</span>}
                      {p.price && <span style={{ ...dm, fontSize: 10, color: C.gold }}>💰 {p.price}</span>}
                    </div>
                    {p.desc_hr && <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 6 }}>{p.desc_hr}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    {p.lat && p.lng && <div style={{ ...dm, fontSize: 10, color: C.mut }}>{p.lat}, {p.lng}</div>}
                    <span style={{ ...dm, fontSize: 10, padding: "3px 10px", borderRadius: 8, background: p.active !== "false" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.active !== "false" ? C.green : C.red, display: "inline-block", marginTop: 4 }}>{p.active !== "false" ? "Aktivno" : "Neaktivno"}</span>
                  </div>
                </div>
              </Card>
            ))}
            {pois.length === 0 && <Card style={{ textAlign: "center", padding: "40px 20px", color: C.mut }}>Nema lokacija. Kliknite "+ Dodaj" za početak.</Card>}
          </>
        );

      case "add-poi":
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setScreen("pois")} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", ...dm }}>← Nazad</button>
              <div style={{ ...hf, fontSize: 28, fontWeight: 400 }}>Nova lokacija</div>
            </div>
            <Card>
              <Input label="Naziv" value={poiForm.name} onChange={v => setPoiForm(p => ({...p, name: v}))} placeholder="npr. Konoba Stari Mlin" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Kategorija</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["restaurant","parking","beach","shop","pharmacy","bakery","cafe","culture","sport","marina","camping","fuel"].map(cat => (
                    <button key={cat} onClick={() => setPoiForm(p => ({...p, category: cat}))}
                      style={{ ...dm, padding: "6px 14px", borderRadius: 10, border: `1px solid ${poiForm.category === cat ? "rgba(14,165,233,0.4)" : C.bord}`, background: poiForm.category === cat ? C.acDim : "transparent", color: poiForm.category === cat ? C.accent : C.mut, fontSize: 12, cursor: "pointer" }}>{cat}</button>
                  ))}
                </div>
              </div>
              <Input label="Adresa" value={poiForm.address} onChange={v => setPoiForm(p => ({...p, address: v}))} placeholder="Obala kralja Tomislava 14, Makarska" />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Input label="Latitude" value={poiForm.lat} onChange={v => setPoiForm(p => ({...p, lat: v}))} placeholder="43.2967" /></div>
                <div style={{ flex: 1 }}><Input label="Longitude" value={poiForm.lng} onChange={v => setPoiForm(p => ({...p, lng: v}))} placeholder="17.0177" /></div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Input label="Radno vrijeme" value={poiForm.hours} onChange={v => setPoiForm(p => ({...p, hours: v}))} placeholder="08:00-22:00" /></div>
                <div style={{ flex: 1 }}><Input label="Telefon" value={poiForm.phone} onChange={v => setPoiForm(p => ({...p, phone: v}))} placeholder="+385 21 612345" /></div>
              </div>
              <Input label="Cijena" value={poiForm.price} onChange={v => setPoiForm(p => ({...p, price: v}))} placeholder="npr. 1€/h, 15€/dan" />
              <Input label="Opis (HR)" value={poiForm.desc_hr} onChange={v => setPoiForm(p => ({...p, desc_hr: v}))} placeholder="Opis na hrvatskom" textarea />
              <Input label="Opis (EN)" value={poiForm.desc_en} onChange={v => setPoiForm(p => ({...p, desc_en: v}))} placeholder="Description in English" textarea />
              <Input label="Opis (DE)" value={poiForm.desc_de} onChange={v => setPoiForm(p => ({...p, desc_de: v}))} placeholder="Beschreibung auf Deutsch" textarea />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Btn primary onClick={savePoi}>Spremi lokaciju</Btn>
                <Btn onClick={() => setScreen("pois")}>Odustani</Btn>
              </div>
            </Card>
          </>
        );

      case "events":
        return (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ ...hf, fontSize: 28, fontWeight: 400 }}>Eventi ({events.length})</div>
              <Btn primary onClick={() => setScreen("add-event")}>+ Novi event</Btn>
            </div>
            {events.map(e => (
              <Card key={e.id} style={{ marginBottom: 10, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500 }}>{e.name}</div>
                    <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 4 }}>
                      📅 {e.date}{e.time ? ` · ${e.time}` : ""} · 📍 {e.location || "—"} · {e.category}
                    </div>
                    {e.desc && <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 4 }}>{e.desc}</div>}
                  </div>
                  {e.price && <div style={{ ...dm, fontSize: 14, color: C.gold, fontWeight: 600 }}>{e.price}</div>}
                </div>
              </Card>
            ))}
            {events.length === 0 && <Card style={{ textAlign: "center", padding: "40px 20px", color: C.mut }}>Nema eventa. Kliknite "+ Novi event".</Card>}
          </>
        );

      case "add-event":
        return (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setScreen("events")} style={{ background: "none", border: "none", color: C.accent, fontSize: 14, cursor: "pointer", ...dm }}>← Nazad</button>
              <div style={{ ...hf, fontSize: 28, fontWeight: 400 }}>Novi event</div>
            </div>
            <Card>
              <Input label="Naziv" value={eventForm.name} onChange={v => setEventForm(p => ({...p, name: v}))} placeholder="npr. Ribarska noć Makarska" />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Input label="Datum" value={eventForm.date} onChange={v => setEventForm(p => ({...p, date: v}))} type="date" /></div>
                <div style={{ flex: 1 }}><Input label="Vrijeme" value={eventForm.time} onChange={v => setEventForm(p => ({...p, time: v}))} placeholder="20:00" /></div>
              </div>
              <Input label="Lokacija" value={eventForm.location} onChange={v => setEventForm(p => ({...p, location: v}))} placeholder="Riva Makarska" />
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...dm, fontSize: 11, color: C.mut, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Kategorija</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["kultura","gastro","sport","muzika","dječji","sajam","izložba"].map(cat => (
                    <button key={cat} onClick={() => setEventForm(p => ({...p, category: cat}))}
                      style={{ ...dm, padding: "6px 14px", borderRadius: 10, border: `1px solid ${eventForm.category === cat ? "rgba(245,158,11,0.4)" : C.bord}`, background: eventForm.category === cat ? C.goDim : "transparent", color: eventForm.category === cat ? C.gold : C.mut, fontSize: 12, cursor: "pointer" }}>{cat}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><Input label="Kapacitet" value={eventForm.capacity} onChange={v => setEventForm(p => ({...p, capacity: v}))} placeholder="200" /></div>
                <div style={{ flex: 1 }}><Input label="Cijena" value={eventForm.price} onChange={v => setEventForm(p => ({...p, price: v}))} placeholder="Besplatno / 15€" /></div>
              </div>
              <Input label="Opis" value={eventForm.desc} onChange={v => setEventForm(p => ({...p, desc: v}))} placeholder="Opis događaja" textarea />
              <Input label="Link za rezervaciju" value={eventForm.booking_url} onChange={v => setEventForm(p => ({...p, booking_url: v}))} placeholder="https://..." />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <Btn primary onClick={saveEvent}>Spremi event</Btn>
                <Btn onClick={() => setScreen("events")}>Odustani</Btn>
              </div>
            </Card>
          </>
        );

      case "analytics":
        return (
          <>
            <div style={{ ...hf, fontSize: 28, fontWeight: 400, marginBottom: 20 }}>Analitika</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
              {[
                { l: "Sesije (danas)", v: stats?.sessions || 0, c: C.accent },
                { l: "Sesije (ovaj mjesec)", v: stats?.monthly_sessions || "—", c: C.green },
                { l: "Upiti na AI", v: stats?.ai_queries || "—", c: "#a78bfa" },
                { l: "Navigacija pokrenuta", v: stats?.nav_clicks || "—", c: C.warm },
              ].map((s, i) => (
                <Card key={i} style={{ textAlign: "center", padding: "20px 16px" }}>
                  <div style={{ fontSize: 32, fontWeight: 300, color: s.c }}>{s.v}</div>
                  <div style={{ ...dm, fontSize: 11, color: C.mut, marginTop: 4 }}>{s.l}</div>
                </Card>
              ))}
            </div>

            <SectionLabel>Top kategorije</SectionLabel>
            <Card style={{ marginBottom: 16 }}>
              {["parking", "beach", "food", "shop", "pharmacy"].map((cat, i) => {
                const val = Math.max(10, Math.round(Math.random() * 80 + 20)); // placeholder
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.bord}` : "none" }}>
                    <div style={{ ...dm, fontSize: 13, color: C.text, width: 80 }}>{cat}</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(14,165,233,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${val}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${C.accent},${C.gold})` }} />
                    </div>
                    <div style={{ ...dm, fontSize: 12, color: C.mut, width: 30, textAlign: "right" }}>{val}%</div>
                  </div>
                );
              })}
            </Card>

            <SectionLabel>Jezična distribucija</SectionLabel>
            <Card>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                {[["🇩🇪", "DE", "42%"], ["🇬🇧", "EN", "24%"], ["🇮🇹", "IT", "12%"], ["🇭🇷", "HR", "8%"], ["🇸🇮", "SI", "6%"], ["🇨🇿", "CZ", "4%"], ["🇵🇱", "PL", "3%"], ["🇦🇹", "AT", "1%"]].map(([flag, code, pct]) => (
                  <div key={code} style={{ textAlign: "center", width: 50 }}>
                    <div style={{ fontSize: 24 }}>{flag}</div>
                    <div style={{ ...dm, fontSize: 14, fontWeight: 600, color: C.text }}>{pct}</div>
                    <div style={{ ...dm, fontSize: 10, color: C.mut }}>{code}</div>
                  </div>
                ))}
              </div>
            </Card>

            <SectionLabel>EU izvještaj</SectionLabel>
            <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>Generiraj EU izvještaj</div>
                <div style={{ ...dm, fontSize: 12, color: C.mut, marginTop: 2 }}>Automatski PDF sa KPI-jevima za EU aplikaciju</div>
              </div>
              <Btn onClick={() => alert("EU Report — coming soon")}>📄 Generiraj</Btn>
            </Card>
          </>
        );

      case "emergency":
        return (
          <>
            <div style={{ ...hf, fontSize: 28, fontWeight: 400, marginBottom: 8 }}>Hitno obavještenje</div>
            <div style={{ ...dm, fontSize: 13, color: C.mut, marginBottom: 20 }}>Šalje push notifikaciju svim aktivnim turistima u vašoj regiji</div>
            <Card style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ ...dm, fontSize: 11, color: C.red, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Tip upozorenja</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["⛈ Nevrijeme","🌬 Bura","🔥 Požar","🌊 Zagađeno more","🚧 Zatvorena cesta","⚠️ Drugo"].map(t => (
                    <button key={t} onClick={() => setEmergencyMsg(t + ": ")}
                      style={{ ...dm, padding: "8px 14px", borderRadius: 10, border: `1px solid rgba(239,68,68,0.2)`, background: "rgba(239,68,68,0.06)", color: C.red, fontSize: 12, cursor: "pointer" }}>{t}</button>
                  ))}
                </div>
              </div>
              <Input label="Poruka" value={emergencyMsg} onChange={setEmergencyMsg} placeholder="Opišite situaciju..." textarea />
              {emergencySent ? (
                <div style={{ ...dm, padding: "14px 20px", borderRadius: 12, background: "rgba(34,197,94,0.1)", color: C.green, fontSize: 14, fontWeight: 600 }}>
                  ✅ Obavještenje poslano svim turistima u regiji {tzName}
                </div>
              ) : (
                <Btn danger onClick={() => { if (emergencyMsg.length > 10) setEmergencySent(true); else alert("Poruka prekratka"); }} style={{ width: "100%" }}>
                  🚨 Pošalji hitno obavještenje
                </Btn>
              )}
            </Card>
          </>
        );

      default: return null;
    }
  };

  return (
    <div style={{ ...dm, background: C.bg, color: C.text, minHeight: "100vh", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "rgba(12,28,50,0.95)", borderRight: `1px solid ${C.bord}`, padding: "20px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${C.bord}` }}>
          <div style={{ ...hf, fontSize: 22, fontWeight: 400, letterSpacing: 2 }}>
            <span style={{ color: C.text }}>JADRAN</span><span style={{ color: C.accent }}>.AI</span>
          </div>
          <div style={{ ...dm, fontSize: 10, color: C.mut, letterSpacing: 2, marginTop: 2 }}>TZ DASHBOARD</div>
        </div>

        <div style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(n => (
            <button key={n.k} onClick={() => setScreen(n.k)} style={{
              ...dm, display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 20px",
              background: screen === n.k || (screen.startsWith("add-") && n.k === (screen.includes("poi") ? "pois" : "events")) ? C.acDim : "transparent",
              border: "none", color: screen === n.k ? C.accent : C.mut, fontSize: 13, cursor: "pointer", textAlign: "left",
              borderLeft: screen === n.k ? `3px solid ${C.accent}` : "3px solid transparent",
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.l}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.bord}` }}>
          <div style={{ ...dm, fontSize: 11, color: C.mut }}>🏛️ TZ {tzName}</div>
          <button onClick={() => { setTzId(null); localStorage.removeItem("jadran_tz_id"); }} style={{ ...dm, marginTop: 8, background: "none", border: "none", color: C.red, fontSize: 11, cursor: "pointer", padding: 0 }}>Odjava</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ marginLeft: 220, flex: 1, padding: "32px 40px", maxWidth: 900 }}>
        {renderContent()}
      </div>
    </div>
  );
}
