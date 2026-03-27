import React from 'react'
import ReactDOM from 'react-dom/client'

// Route logic:
// /host         → HostPanel (apartment management)
// /ai           → Standalone AI (pay & use, campers, day-trippers)
// ?room=XXXX    → Guest App (guide for apartment guests)
// jadran.ai     → Landing Page (marketing + booking)
const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
const hasRoom = params.has("room");
const hasKiosk = params.has("kiosk");
const isHost = path === "/host" || path === "/host/";
const isAI = path === "/ai" || path === "/ai/";
const isTZ = path === "/tz" || path === "/tz/";

const route = isHost ? "host" : isAI ? "ai" : isTZ ? "tz" : (hasRoom || hasKiosk) ? "app" : "landing";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Error:", error, info); try { window.Sentry?.captureException(error, { extra: { componentStack: info?.componentStack } }); } catch {} }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: "#7dd3fc", background: "#0a1628", minHeight: "100dvh", fontFamily: "'Outfit', system-ui, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌊</div>
        <h2 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8, color: "#f0f9ff" }}>Nešto nije u redu</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, maxWidth: 400 }}>Stranica se nije učitala ispravno. Pokušajte ponovo ili očistite cache.</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: "12px 28px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 15, fontFamily: "inherit", marginBottom: 12 }}>
          Pokušaj ponovo
        </button>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ padding: "8px 20px", background: "transparent", color: "#64748b", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 12, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
          Očisti cache
        </button>
      </div>
    );
    return this.props.children;
  }
}

const App = React.lazy(() =>
  route === "host" ? import('./HostPanel.jsx')
  : route === "ai" ? import('./StandaloneAI.jsx')
  : route === "tz" ? import('./TZDashboard.jsx')
  : route === "app" ? import('./App.jsx')
  : import('./LandingPage.jsx')
);

const labels = { host: "Host Panel", ai: "Vodič", tz: "TZ Dashboard", app: "JADRAN", landing: "JADRAN" };

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
