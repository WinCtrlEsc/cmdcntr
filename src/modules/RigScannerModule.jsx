// RigScannerModule.jsx
import { useState } from "react";
import { useGraph } from "../hooks/useGraph";
import { getRigIntel, executeRigAction } from "../services/GraphService";

export default function RigScannerModule() {
  const { getToken } = useGraph();
  const [hostname, setHostname] = useState("");
  const [intel, setIntel] = useState(null);
  const [consoleText, setConsoleText] = useState("> AWAITING DEVICE TARGET...");

  const write = (t) => setConsoleText((p) => p + "\n\n" + t);

  const search = async () => {
    if (!hostname.trim()) { setConsoleText("[!] INVALID TARGET: DEVICE NAME CANNOT BE EMPTY."); return; }
    setIntel(null);
    setConsoleText(`> INITIATING FORENSIC TRACE FOR: '${hostname}'\n> QUERYING INTUNE TELEMETRY...\n> EXTRACTING BITLOCKER SIGNATURES...`);
    try {
      const token = await getToken();
      const data = await getRigIntel(token, hostname.trim());
      if (data) {
        setIntel(data);
        write(`> [SUCCESS] RIG INTEL ACQUIRED. DEVICE '${hostname}' LOCKED AND LOADED FOR TACTICAL ACTIONS.`);
      } else {
        write(`> [ERROR] NO MANAGED DEVICE FOUND FOR '${hostname}'.\n> Verify hostname in Intune.`);
      }
    } catch (e) {
      write(`[!] FORENSIC TRACE FAILURE:\n${e.message}`);
    }
  };

  const action = async (type) => {
    if (!intel?.managedDeviceId) return;
    write(`> TRANSMITTING [ ${type} ] DIRECTIVE...`);
    try {
      const token = await getToken();
      const result = await executeRigAction(token, intel.managedDeviceId, type);
      write(`> ${result}`);
    } catch (e) {
      write(`[!] ACTION FAILED: ${e.message}`);
    }
  };

  const reset = () => { setHostname(""); setIntel(null); setConsoleText("> TELEMETRY CLEARED. AWAITING NEXT RIG TARGET..."); };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">ENDPOINT TELEMETRY // </span>
        <span className="module-header-name" style={{ color: "var(--neon-magenta)", textShadow: "0 0 8px #E020FF" }}>RIG SCANNER</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ color: "var(--neon-magenta)", fontWeight: "bold", fontSize: 14 }}>[ ENTER DEVICE NAME ]</span>
        <input className="cyber-input" style={{ color: "var(--neon-magenta)", borderColor: "var(--neon-magenta)", width: 240, background: "#110011", fontSize: 18, textAlign: "center" }}
          value={hostname} onChange={(e) => setHostname(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="HOSTNAME..." />
        <button className="cyber-btn btn-magenta" onClick={search}>[ SCAN RIG ]</button>
        <button className="cyber-btn btn-magenta" onClick={reset}>[ RESET ]</button>
      </div>

      {intel && (
        <div className="reveal-panel" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0, marginBottom: 12 }}>
          {/* Intel panel — horizontal stats bar */}
          <div style={{ border: "2px solid var(--neon-magenta)", background: "#11001A", padding: 20, boxShadow: "0 0 10px #E020FF55", flexShrink: 0 }}>
            <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", marginBottom: 14 }}>RIG INTEL</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px 24px", marginBottom: 16 }}>
              {[["OS VERSION", intel.osVersion, "#fff"], ["COMPLIANCE STATE", intel.complianceState, intel.complianceState?.toLowerCase().includes("compliant") ? "var(--neon-green)" : "var(--neon-red)"],
                ["LAST CHECK-IN", intel.lastCheckIn, "var(--neon-magenta)"], ["PRIMARY USER", intel.primaryUser, "var(--neon-yellow)"]].map(([label, val, color]) => (
                <div key={label}>
                  <div style={{ color: "#777", fontSize: 10, fontWeight: "bold" }}>{label}</div>
                  <div style={{ color, fontSize: 13, fontWeight: "bold", wordBreak: "break-word" }}>{val?.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ color: "#777", fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>BITLOCKER RECOVERY KEY</div>
            <div style={{ background: "#0A000A", border: "1px solid #55FF00FF", padding: "6px 8px", color: "#fff", fontSize: 12, wordBreak: "break-all" }}>
              {intel.bitLockerKey}
            </div>
          </div>

          {/* Tactical actions */}
          <div style={{ border: "1px solid #33E020FF", background: "#05000A", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--neon-magenta)", fontSize: 14, fontWeight: "bold" }}>TACTICAL ACTIONS</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, width: "100%" }}>
              {[["QUICK_SCAN", "[ QUICK AV SCAN ]"], ["FULL_SCAN", "[ FULL AV SCAN ]"], ["DIAGNOSTICS", "[ COLLECT DIAGNOSTICS ]"], ["SYNC", "[ FORCE SYNC ]"]].map(([type, label]) => (
                <button key={type} className="cyber-btn btn-magenta" style={{ height: 50, width: "100%" }} onClick={() => action(type)}>{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!intel && <div style={{ flex: 1 }} />}

      <div className="console-box console-magenta" style={{ height: 100 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
