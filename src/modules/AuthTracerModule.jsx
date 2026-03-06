// AuthTracerModule.jsx
import { useState } from "react";
import { useGraph } from "../hooks/useGraph";
import { getAuthLogs } from "../services/GraphService";

export default function AuthTracerModule() {
  const { getToken } = useGraph();
  const [alias, setAlias] = useState("");
  const [logs, setLogs] = useState(null);
  const [consoleText, setConsoleText] = useState("> AWAITING TRACER TARGET...");

  const search = async () => {
    if (!alias.trim()) { setConsoleText("[!] INVALID TARGET: ALIAS CANNOT BE EMPTY."); return; }
    setLogs(null);
    setConsoleText(`> INITIATING TELEMETRY TRACE FOR: '${alias}'\n> QUERYING ENTRA AUDIT LOGS...\n> DECRYPTING SIGN-IN VECTORS...`);
    try {
      const token = await getToken();
      const data = await getAuthLogs(token, alias.trim());
      if (data?.length) {
        setLogs(data);
        setConsoleText(`> [SUCCESS] TRACE COMPLETE. EXTRACTED ${data.length} RECENT AUTHENTICATION ATTEMPTS.`);
      } else {
        setConsoleText(`> [ERROR] NO SIGN-IN LOGS FOUND FOR '${alias}'.\n> Verify alias or account activity.`);
      }
    } catch (e) {
      setConsoleText(`[!] TRACE FAILURE:\n${e.message}`);
    }
  };

  const reset = () => { setAlias(""); setLogs(null); setConsoleText("> TRACE TERMINATED. AWAITING NEXT TARGET..."); };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">IDENTITY TRACKING // </span>
        <span className="module-header-name" style={{ color: "var(--neon-orange)", textShadow: "0 0 8px #FF6600" }}>AUTH TRACER</span>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ color: "var(--neon-orange)", fontWeight: "bold", fontSize: 14 }}>[ TARGET ALIAS / UPN ]</span>
        <input className="cyber-input" style={{ color: "var(--neon-orange)", borderColor: "var(--neon-orange)", width: 240, background: "#110500", fontSize: 18, textAlign: "center" }}
          value={alias} onChange={(e) => setAlias(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="alias..." />
        <button className="cyber-btn btn-orange" onClick={search}>[ TRACE AUTHENTICATION ]</button>
        <button className="cyber-btn btn-orange" onClick={reset}>[ RESET ]</button>
      </div>

      <div className="cyber-table-wrap table-orange" style={{ flex: 1, minHeight: 0, marginBottom: 12 }}>
        <table className="cyber-table">
          <thead><tr>
            <th style={{ width: 170 }}>TIMESTAMP</th>
            <th style={{ width: 140 }}>IP ADDRESS</th>
            <th style={{ width: 200 }}>LOCATION</th>
            <th>APPLICATION</th>
            <th style={{ width: 140 }}>STATUS</th>
          </tr></thead>
          <tbody>
            {!logs && <tr><td colSpan={5} style={{ textAlign: "center", padding: 20, color: "#555" }}>NO DATA. SUBMIT A TARGET TO TRACE.</td></tr>}
            {logs?.map((log, i) => (
              <tr key={i}>
                <td>{log.timestamp}</td>
                <td>{log.ipAddress}</td>
                <td>{log.location}</td>
                <td>{log.application}</td>
                <td style={{ color: log.status === "SUCCESS" ? "var(--neon-green)" : "var(--neon-red)" }}>{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="console-box console-orange" style={{ height: 80 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
