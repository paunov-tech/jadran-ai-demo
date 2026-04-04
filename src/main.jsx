import React from 'react'
import ReactDOM from 'react-dom/client'

// Route logic:
// /host         → HostPanel (apartment management)
// /ai           → Standalone AI (pay & use, campers, day-trippers)
// /explore      → DestinationExplorer (pre-trip hub) — DEFAULT entry point
// /landing      → LandingPage (marketing, kept for direct link / SEO)
// ?room=XXXX    → Guest App (guide for apartment guests)
// ?kiosk=XXX    → Guest App (kiosk mode, tablet demo)
// ?trip=JAD-... → TripGuide (booking ID entry → AI guide with full context)
// /             → redirects to /explore
const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
const hasRoom = params.has("room");
const hasKiosk = params.has("kiosk");
const isHost = path === "/host" || path === "/host/";
const isAI = path === "/ai" || path === "/ai/";
const isTZ = path === "/tz" || path === "/tz/";
const isExplore = path === "/explore" || path === "/explore/";
const isLanding = path === "/landing" || path === "/landing/";
const isAdmin = path === "/admin" || path === "/admin/";
const isPartner = path === "/partner" || path.startsWith("/partner/");
const isQualify = path === "/qualify" || path === "/qualify/";
const isCampaigns = path === "/campaigns" || path === "/campaigns/";
const isSegmentLanding = path.startsWith("/m/");
const hasTrip = params.has("trip");

// /explore is the main entry. / and all unknown paths → explore.
// Operational paths (room, kiosk, trip, host, ai, tz, admin, partner, marketing) stay unchanged.
const route = isHost ? "host" : isAI ? "ai" : isTZ ? "tz" : isAdmin ? "admin" : isPartner ? "partner"
  : isQualify ? "qualify" : isCampaigns ? "campaigns" : isSegmentLanding ? "segment"
  : hasTrip ? "trip" : (hasRoom || hasKiosk) ? "app" : isLanding ? "landing" : "explore";

const _ebLang = (() => { try { const s = localStorage.getItem("jadran_lang"); if (s) return s; const n = (navigator.language || "").toLowerCase(); if (n.startsWith("de")) return "de"; if (n.startsWith("it")) return "it"; if (n.startsWith("en")) return "en"; if (n.startsWith("hr")) return "hr"; if (n.startsWith("pl")) return "pl"; if (n.startsWith("sl")) return "si"; } catch {} return "en"; })();
const _eb = {
  hr: ["Nešto nije u redu", "Stranica se nije učitala. Pokušajte ponovo ili očistite cache.", "Pokušaj ponovo", "Očisti cache"],
  de: ["Etwas ist schiefgelaufen", "Seite konnte nicht geladen werden. Bitte neu laden oder Cache leeren.", "Neu laden", "Cache leeren"],
  en: ["Something went wrong", "Page failed to load. Please reload or clear your cache.", "Reload", "Clear cache"],
  it: ["Qualcosa è andato storto", "La pagina non si è caricata. Riprova o svuota la cache.", "Riprova", "Svuota cache"],
  pl: ["Coś poszło nie tak", "Strona nie załadowała się. Spróbuj ponownie lub wyczyść pamięć podręczną.", "Odśwież", "Wyczyść cache"],
  si: ["Prišlo je do napake", "Stran se ni naložila. Poskusite znova ali počistite predpomnilnik.", "Poskusi znova", "Počisti cache"],
}[_ebLang] || ["Something went wrong", "Page failed to load. Please reload.", "Reload", "Clear cache"];

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Error:", error, info); try { window.Sentry?.captureException(error, { extra: { componentStack: info?.componentStack } }); } catch {} }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: "#7dd3fc", background: "#0a1628", minHeight: "100dvh", fontFamily: "'Outfit', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
        <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8, color: "#f0f9ff" }}>{_eb[0]}</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, maxWidth: 400 }}>{_eb[1]}</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: "12px 28px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 15, fontFamily: "inherit", marginBottom: 12 }}>
          {_eb[2]}
        </button>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ padding: "8px 20px", background: "transparent", color: "#64748b", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 12, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
          {_eb[3]}
        </button>
      </div>
    );
    return this.props.children;
  }
}

// For segment landing pages, extract slug from path
const segSlug = isSegmentLanding ? path.replace(/^\/m\//, "").replace(/\/$/, "") : null;

const App = React.lazy(() =>
  route === "host"    ? import('./HostPanel.jsx')
  : route === "ai"   ? import('./StandaloneAI.jsx')
  : route === "tz"   ? import('./TZDashboard.jsx')
  : route === "admin" ? import('./AdminPanel.jsx')
  : route === "partner" ? import('./PartnerPortal.jsx')
  : route === "qualify" ? import('./marketing/LeadQualifier.jsx')
  : route === "campaigns" ? import('./marketing/CampaignManager.jsx')
  : route === "segment" ? import('./marketing/SegmentLandingPage.jsx').then(m => ({
      default: () => React.createElement(m.default, { slug: segSlug })
    }))
  : route === "trip" ? import('./TripGuide.jsx')
  : route === "app"  ? import('./App.jsx')
  : route === "landing" ? import('./LandingPage.jsx')
  : import('./DestinationExplorer.jsx')  // default: explore
);

const labels = { host: "Host Panel", ai: "Jadran AI", tz: "TZ Dashboard", explore: "Jadran", admin: "Admin", partner: "Partner Portal", trip: "JADRAN Trip", app: "JADRAN", landing: "JADRAN", qualify: "JADRAN", campaigns: "Campaigns", segment: "JADRAN" };

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", background: "#0a1628", color: "rgba(14,165,233,0.6)", fontFamily: "system-ui", fontSize: 18 }}>
          🌊 {labels[route]}...
        </div>
      }>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
