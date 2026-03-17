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
  const [loginHint, setLoginHint] = useState(stored.loginHint ?? "");
  const [abuseIpDbKey, setAbuseIpDbKey] = useState(stored.abuseIpDbKey ?? "");
  const [saved, setSaved] = useState(false);
  const [showWipe, setShowWipe] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState(null);

  const configured = isConfigured();

  const handleSave = () => {
    if (!clientId.trim() || !tenantId.trim()) return;
    saveStoredConfig({ clientId, tenantId, loginHint, abuseIpDbKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    if (onSaved) onSaved();
  };

  const handleWipe = () => {
    clearStoredConfig();
    setClientId("");
    setTenantId("");
    setLoginHint("");
    setAbuseIpDbKey("");
    setShowWipe(false);
    window.location.reload();
  };

  const handleUpgrade = async () => {
    if (!("serviceWorker" in navigator)) {
      setUpgradeStatus("SERVICE WORKER NOT SUPPORTED ON THIS PLATFORM.");
      return;
    }
    setUpgradeStatus("SCANNING FOR UPDATES...");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setUpgradeStatus("NO SERVICE WORKER REGISTERED. TRY REINSTALLING THE PWA.");
        return;
      }
      await reg.update();
      if (reg.waiting) {
        setUpgradeStatus("UPDATE FOUND. APPLYING AND RESTARTING...");
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
        setTimeout(() => window.location.reload(), 1000);
      } else if (reg.installing) {
        setUpgradeStatus("UPDATE ALREADY INSTALLING. STAND BY...");
      } else {
        setUpgradeStatus("SYSTEM IS UP TO DATE. NO ACTION REQUIRED.");
      }
    } catch (e) {
      setUpgradeStatus(`UPDATE CHECK FAILED: ${e.message}`);
    }
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

          {/* AbuseIPDB API Key */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", color: "var(--neon-pink)", fontSize: 11, fontWeight: "bold", letterSpacing: "0.1em", marginBottom: 8 }}>
              ABUSEIPDB API KEY
              <span style={{ color: "#555", fontWeight: "normal", marginLeft: 8 }}>(REQUIRED FOR IP RECON MODULE)</span>
            </label>
            <input
              className="cyber-input"
              style={{ color: "var(--neon-pink)", borderColor: abuseIpDbKey ? "var(--neon-pink)" : "#333", background: "#110005", width: "100%", fontSize: 13, letterSpacing: "0.03em" }}
              value={abuseIpDbKey}
              onChange={(e) => { setAbuseIpDbKey(e.target.value); setSaved(false); }}
              placeholder="paste your AbuseIPDB API key..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <div style={{ color: "#444", fontSize: 11, marginTop: 5 }}>
              Found at abuseipdb.com → Account → API → Keys. Stored only on this device.
            </div>
            {abuseIpDbKey && (
              <div style={{ marginTop: 8, color: "var(--neon-green)", fontSize: 11 }}>
                ✓ ABUSEIPDB KEY STORED — IP RECON THREAT INTEL ENABLED
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
          <div style={{ marginTop: 28, borderTop: "1px solid #222", paddingTop: 20 }}>
            <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", marginBottom: 8 }}>
              CURRENT DEVICE STATUS
            </div>
            <div style={{ color: configured ? "var(--neon-green)" : "var(--neon-red)", fontSize: 13, fontWeight: "bold", marginBottom: 24 }}>
              {configured ? "✓ CREDENTIALS STORED ON DEVICE" : "✗ NO CREDENTIALS — CONFIGURATION REQUIRED"}
            </div>

            {/* System Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

              {/* UPGRADE */}
              <div style={{ border: "1px solid #333", background: "#050510", padding: 16 }}>
                <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", letterSpacing: "0.1em", marginBottom: 6 }}>
                  UPGRADE
                </div>
                <div style={{ color: "#555", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
                  Check for a new version of the app and install it immediately.
                </div>
                <button
                  className="cyber-btn btn-cyan"
                  style={{ width: "100%", fontSize: 12 }}
                  onClick={handleUpgrade}
                >
                  [ CHECK FOR UPDATE ]
                </button>
                {upgradeStatus && (
                  <div style={{ marginTop: 10, color: upgradeStatus.includes("FAILED") || upgradeStatus.includes("NOT") ? "var(--neon-yellow)" : "var(--neon-green)", fontSize: 11, lineHeight: 1.4 }}>
                    {upgradeStatus}
                  </div>
                )}
              </div>

              {/* FULL WIPE */}
              <div style={{ border: "1px solid #331111", background: "#0A0000", padding: 16 }}>
                <div style={{ color: "var(--neon-red)", fontSize: 11, fontWeight: "bold", letterSpacing: "0.1em", marginBottom: 6 }}>
                  FULL WIPE
                </div>
                <div style={{ color: "#555", fontSize: 11, marginBottom: 12, lineHeight: 1.5 }}>
                  Purge all stored credentials. App returns to first-run state.
                </div>
                {!showWipe ? (
                  <button
                    className="cyber-btn btn-red"
                    style={{ width: "100%", fontSize: 12, opacity: configured ? 1 : 0.4 }}
                    onClick={() => setShowWipe(true)}
                    disabled={!configured}
                  >
                    [ FULL WIPE ]
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ color: "var(--neon-red)", fontSize: 11, fontWeight: "bold" }}>
                      /!\ CONFIRM WIPE? THIS CANNOT BE UNDONE.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="cyber-btn btn-red" style={{ flex: 1, fontSize: 11 }} onClick={handleWipe}>
                        [ CONFIRM ]
                      </button>
                      <button className="cyber-btn btn-cyan" style={{ flex: 1, fontSize: 11 }} onClick={() => setShowWipe(false)}>
                        [ CANCEL ]
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
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