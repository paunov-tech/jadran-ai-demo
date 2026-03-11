import React from 'react'
import ReactDOM from 'react-dom/client'

// Simple path-based routing: /host → HostPanel, everything else → Guest app
const isHostRoute = window.location.pathname === "/host" || window.location.pathname === "/host/";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("JADRAN CRASH:", error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: "#f87171", background: "#0a1628", minHeight: "100vh", fontFamily: "monospace" }}>
        <h2>JADRAN AI — Error</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 16, color: "#fbbf24" }}>
          {this.state.error.toString()}
        </pre>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ marginTop: 24, padding: "12px 24px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          Clear Cache and Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

// Lazy load the right component
const App = React.lazy(() => isHostRoute
  ? import('./HostPanel.jsx')
  : import('./App.jsx')
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a1628", color: "rgba(14,165,233,0.6)", fontFamily: "system-ui", fontSize: 18 }}>
          🌊 {isHostRoute ? "Host Panel" : "JADRAN AI"}...
        </div>
      }>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
