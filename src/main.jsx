import React from 'react'
import ReactDOM from 'react-dom/client'
import JadranUnified from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("JADRAN CRASH:", error, info); }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: "#ff6b6b", background: "#0a0a0a", minHeight: "100vh", fontFamily: "monospace" }}>
        <h2>JADRAN AI — Error</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 16, color: "#ffa" }}>
          {this.state.error.toString()}
        </pre>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ marginTop: 24, padding: "12px 24px", background: "#333", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          Clear Cache and Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <JadranUnified />
    </ErrorBoundary>
  </React.StrictMode>
)
