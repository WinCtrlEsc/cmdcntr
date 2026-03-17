// App.jsx
import { useState, useEffect, useRef } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { buildLoginRequest } from "./authConfig";
import { useGraph } from "./hooks/useGraph";

import PimModule        from "./modules/PimModule";
import StalkerModule    from "./modules/StalkerModule";
import PassPullerModule from "./modules/PassPullerModule";
import DossierModule    from "./modules/DossierModule";
import AuthTracerModule from "./modules/AuthTracerModule";
import RigScannerModule from "./modules/RigScannerModule";
import PhishHunterModule from "./modules/PhishHunterModule";
import IpReconModule    from "./modules/IpReconModule";
import SettingsModule   from "./modules/SettingsModule";

const MODULES = [
  { id: "stalker",   label: "[ GRAPH STALKER ]",  color: "cyan"   },
  { id: "pim",       label: "[ PIM COMMANDER ]",  color: "green"  },
  { id: "pass",      label: "[ PASS PULLER ]",    color: "yellow" },
  { id: "dossier",   label: "[ DOSSIER ]",        color: "blue"   },
  { id: "auth",      label: "[ AUTH TRACER ]",    color: "orange" },
  { id: "rig",       label: "[ RIG SCANNER ]",    color: "magenta"},
  { id: "phish",     label: "[ PHISH HUNTER ]",   color: "acid"   },
  { id: "iprecon",   label: "[ IP RECON ]",        color: "pink"   },
  { id: "settings",  label: "[ SETTINGS ]",        color: "purple" },
];

// Cyberpunk hex logo SVG
function HexLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className="logo-hex">
      <polygon points="15,2 45,2 58,26 45,50 15,50 2,26" fill="#1100FFFF" stroke="#00FFFF" strokeWidth="2"/>
      <circle cx="30" cy="26" r="8" fill="#FF00AA" filter="url(#pinkGlow)"/>
      <line x1="30" y1="10" x2="30" y2="18" stroke="#00FFFF" strokeWidth="2"/>
      <line x1="30" y1="34" x2="30" y2="42" stroke="#00FFFF" strokeWidth="2"/>
      <line x1="14" y1="26" x2="22" y2="26" stroke="#00FFFF" strokeWidth="2"/>
      <line x1="38" y1="26" x2="46" y2="26" stroke="#00FFFF" strokeWidth="2"/>
      <defs>
        <filter id="pinkGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

function LoginScreen() {
  const { instance } = useMsal();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await instance.loginRedirect(buildLoginRequest());;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-logo">
        <HexLogo size={80} />
      </div>
      <div>
        <div className="login-title">COMMAND CENTER</div>
        <div style={{ color: "var(--neon-cyan)", fontSize: 12, textAlign: "center", marginTop: 4 }}>OS v3.0 // SECURITY OPERATIONS</div>
      </div>
      <div className="login-subtitle">AWAITING OPERATOR AUTHENTICATION...</div>
      <button
        className="cyber-btn btn-cyan"
        style={{ fontSize: 16, padding: "14px 36px" }}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "AUTHENTICATING..." : "[ INITIATE MS GRAPH OVERRIDE ]"}
      </button>
      {error && <div className="login-error">[!] AUTH ERROR: {error}</div>}
      <div style={{ color: "#333", fontSize: 11, marginTop: 16, letterSpacing: "0.08em" }}>
        ENTRA ID // MSAL AUTH // GRAPH API v1.0
      </div>
    </div>
  );
}

function AppShell() {
  const { instance } = useMsal();
  const { loadCurrentUser, currentUser } = useGraph();
  const [activeModule, setActiveModule] = useState("pim");
  const [statusText, setStatusText] = useState("AUTHENTICATING...");
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < 80) return;
    const ids = MODULES.map((m) => m.id);
    const idx = ids.indexOf(activeModule);
    if (idx === -1) return;
    if (deltaX < 0 && idx < ids.length - 1) setActiveModule(ids[idx + 1]);
    else if (deltaX > 0 && idx > 0) setActiveModule(ids[idx - 1]);
  };

  useEffect(() => {
    (async () => {
      try {
        const user = await loadCurrentUser();
        setStatusText(`OPERATIVE: ${user.displayName?.toUpperCase() ?? user.email}`);
      } catch {
        setStatusText("USER DATA UNAVAILABLE");
      }
    })();
  }, [loadCurrentUser]);

  const renderModule = () => {
    switch (activeModule) {
      case "stalker":  return <StalkerModule />;
      case "pim":      return <PimModule />;
      case "pass":     return <PassPullerModule />;
      case "dossier":  return <DossierModule />;
      case "auth":     return <AuthTracerModule />;
      case "rig":      return <RigScannerModule />;
      case "phish":    return <PhishHunterModule />;
      case "iprecon":  return <IpReconModule />;
      case "settings": return <SettingsModule onSaved={() => window.location.reload()} />;
      default:         return <PimModule />;
    }
  };

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <HexLogo size={52} />
          <div className="logo-title">COMMAND<br/>CENTER</div>
        </div>

        <div className="nav-section-label">SYSTEM MODULES //</div>

        {MODULES.map((mod) => (
          <button
            key={mod.id}
            className={`nav-btn ${mod.color}${activeModule === mod.id ? " active" : ""}`}
            onClick={() => setActiveModule(mod.id)}
          >
            {mod.label}
          </button>
        ))}

        <div className="status-bar">
          <div className="status-text">STATUS: {statusText}</div>
          <button
            className="nav-btn dim"
            onClick={() => instance.logoutRedirect()}
            style={{ color: "#555" }}
          >
            [ DISCONNECT ]
          </button>
        </div>
      </nav>

      {/* ── Screen ── */}
      <main className="screen-area" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="scan-sweep" />
        <div className="screen-content">
          {renderModule()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();
  const { instance, inProgress } = useMsal();

  // Handle redirect callback on return from AAD
  useEffect(() => {
    instance.handleRedirectPromise().catch(() => {});
  }, [instance]);

  if (inProgress !== "none") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--neon-cyan)", fontFamily: "var(--font-mono)" }}>
        AUTHENTICATING...
      </div>
    );
  }

  return isAuthenticated ? <AppShell /> : <LoginScreen />;
}
