// SettingsModule.jsx
// Operator enters Client ID and Tenant ID here on first run.
// Values are saved to localStorage only — never in source code.

import { useState } from "react";
import {
  loadStoredConfig,
  saveStoredConfig,
  clearStoredConfig,
  isConfigured,
} from "../authConfig";

export default function SettingsModule({ onSaved }) {
  const stored = loadStoredConfig();
  const [clientId, setClientId] = useState(stored.clientId);
  const [tenantId, setTenantId] = useState(stored.tenantId);
  const [loginHint, setLoginHint] = useState(stored.loginHint ?? "");  // NEW: elevated UPN for iOS SSO bypass
  const [saved, setSaved] = useState(false);
  const [showClear, setShowClear] = useState(false);

  const configured = isConfigured();

  const handleSave = () => {
    if (!clientId.trim() || !tenantId.trim()) return;
    saveStoredConfig({ clientId, tenantId, loginHint });  // NEW: pass loginHint through
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (onSaved) onSaved();
  };

  const handleClear = () => {
    clearStoredConfig();
    setClientId("");
    setTenantId("");
    setLoginHint("");  // NEW: clear loginHint on wipe
    setShowClear(false);
    // Force full page reload to re-init MSAL with no config
    window.location.reload();
  };

  const isValid = clientId.trim().length > 0 && tenantId.trim().length > 0;

  return (
    <div className="module-view">
      {/* Header */}
      <div className="module-header">
        <span className="module-header-prefix">SYSTEM CONFIGURATION // </span>
        <span
          className="module-header-name"
          style={{ color: "var(--neon-purple)", textShadow: "0 0 8px var(--neon-purple)" }}
        >
          APP SETTINGS
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>

          {/* Security notice */}
          <div
            style={{
              border: "1px solid #333",
              background: "#0A0012",
              padding: "14px 18px",
              marginBottom: 28,
              fontSize: 12,
              color: "#888",
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: "var(--neon-purple)", fontWeight: "bold" }}>[i] SECURITY NOTE: </span>
            These credentials are stored only in this device's local storage.
            They are never written to source code, config files, or transmitted
            anywhere other than Microsoft's login endpoint.
          </div>

          {/* Client ID */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                color: "var(--neon-purple)",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              ENTRA APPLICATION (CLIENT) ID
            </label>
            <input
              className="cyber-input"
              style={{
                color: "var(--neon-purple)",
                borderColor: "var(--neon-purple)",
                background: "#0A0012",
                width: "100%",
                fontSize: 14,
                letterSpacing: "0.05em",
              }}
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setSaved(false); }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div style={{ color: "#444", fontSize: 11, marginTop: 5 }}>
              Found in Azure Portal → App Registrations → your app → Overview
            </div>
          </div>

          {/* Tenant ID */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                color: "var(--neon-purple)",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              ENTRA DIRECTORY (TENANT) ID
            </label>
            <input
              className="cyber-input"
              style={{
                color: "var(--neon-purple)",
                borderColor: "var(--neon-purple)",
                background: "#0A0012",
                width: "100%",
                fontSize: 14,
                letterSpacing: "0.05em",
              }}
              value={tenantId}
              onChange={(e) => { setTenantId(e.target.value); setSaved(false); }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div style={{ color: "#444", fontSize: 11, marginTop: 5 }}>
              Found in Azure Portal → Entra ID → Overview → Tenant ID
            </div>
          </div>

          {/* NEW: Elevated Identity / Login Hint */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: "block",
                color: "var(--neon-cyan)",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              ELEVATED IDENTITY UPN
              <span style={{ color: "#555", fontWeight: "normal", marginLeft: 8 }}>(OPTIONAL — iOS SSO BYPASS)</span>
            </label>
            <input
              className="cyber-input"
              style={{
                color: "var(--neon-cyan)",
                borderColor: loginHint ? "var(--neon-cyan)" : "#333",
                background: "#000A0A",
                width: "100%",
                fontSize: 14,
                letterSpacing: "0.03em",
              }}
              value={loginHint}
              onChange={(e) => { setLoginHint(e.target.value); setSaved(false); }}
              placeholder="admin@yourorg.com"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              type="email"
            />
            <div style={{ color: "#444", fontSize: 11, marginTop: 5, lineHeight: 1.5 }}>
              On managed iPhones, Microsoft Authenticator silently injects your standard account.
              Enter your <strong style={{ color: "#666" }}>elevated / privileged UPN</strong> here to
              force Entra to bypass SSO and prompt for that specific identity instead.
              Leave blank on devices where account selection works normally.
            </div>
            {loginHint && (
              <div style={{ marginTop: 8, color: "var(--neon-green)", fontSize: 11 }}>
                ✓ iOS SSO OVERRIDE ACTIVE — will authenticate as: {loginHint}
              </div>
            )}
          </div>

          {/* Save button */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button
              className="cyber-btn"
              style={{
                color: "var(--neon-purple)",
                borderColor: "var(--neon-purple)",
                fontSize: 14,
                padding: "12px 28px",
                opacity: isValid ? 1 : 0.4,
              }}
              onClick={handleSave}
              disabled={!isValid}
            >
              {saved ? "[ ✓ CONFIGURATION SAVED ]" : "[ SAVE TO DEVICE ]"}
            </button>

            {saved && (
              <span style={{ color: "var(--neon-green)", fontSize: 12, animation: "fade-in 0.3s" }}>
                App will use new credentials on next login.
              </span>
            )}
          </div>

          {/* Current status */}
          <div
            style={{
              marginTop: 28,
              borderTop: "1px solid #222",
              paddingTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", marginBottom: 6 }}>
                CURRENT DEVICE STATUS
              </div>
              <div
                style={{
                  color: configured ? "var(--neon-green)" : "var(--neon-red)",
                  fontSize: 13,
                  fontWeight: "bold",
                }}
              >
                {configured
                  ? "✓ CREDENTIALS STORED ON DEVICE"
                  : "✗ NO CREDENTIALS — CONFIGURATION REQUIRED"}
              </div>
            </div>

            {/* Clear / danger zone */}
            {configured && (
              <div>
                {!showClear ? (
                  <button
                    className="cyber-btn btn-red"
                    style={{ fontSize: 11, padding: "7px 14px", opacity: 0.6 }}
                    onClick={() => setShowClear(true)}
                  >
                    [ CLEAR STORED CREDENTIALS ]
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "var(--neon-red)", fontSize: 12 }}>
                      CONFIRM WIPE?
                    </span>
                    <button className="cyber-btn btn-red" style={{ fontSize: 11, padding: "7px 14px" }} onClick={handleClear}>
                      [ CONFIRM ]
                    </button>
                    <button className="cyber-btn btn-cyan" style={{ fontSize: 11, padding: "7px 14px" }} onClick={() => setShowClear(false)}>
                      [ CANCEL ]
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Console */}
      <div className="console-box" style={{
        color: "var(--neon-purple)",
        borderColor: "#55A200FF",
        background: "#0A0012",
        height: 60,
        marginTop: 12,
        fontSize: 12,
      }}>
        {configured
          ? `> CONFIGURATION LOADED. CLIENT_ID: ${clientId.slice(0,8)}... TENANT_ID: ${tenantId.slice(0,8)}... ${loginHint ? `SSO_BYPASS: ${loginHint}` : "SSO_BYPASS: DISABLED"}`
          : "> AWAITING OPERATOR INPUT. ENTER CLIENT ID AND TENANT ID TO PROCEED."}
        <span className="cursor"> _</span>
      </div>
    </div>
  );
}