// PassPullerModule.jsx
import { useState } from "react";
import { useGraph } from "../hooks/useGraph";
import { getLapsPassword } from "../services/GraphService";

export default function PassPullerModule() {
  const { getToken } = useGraph();
  const [hostname, setHostname] = useState("");
  const [password, setPassword] = useState(null);
  const [consoleText, setConsoleText] = useState("> AWAITING DEVICE TARGET INPUT...");

  const extract = async () => {
    if (!hostname.trim()) { setConsoleText("[!] INVALID TARGET: DEVICE NAME CANNOT BE EMPTY."); return; }
    setPassword(null);
    setConsoleText(`> INITIATING LAPS DECRYPTION FOR: '${hostname}'\n> QUERYING DIRECTORY LOCAL CREDENTIALS...`);
    try {
      const token = await getToken();
      const pass = await getLapsPassword(token, hostname.trim());
      if (pass) {
        setPassword(pass);
        setConsoleText("> [SUCCESS] CREDENTIAL VAULT BREACHED. LAPS KEY DECRYPTED.");
      } else {
        setConsoleText(`> [ERROR] NO LAPS CREDENTIAL FOUND FOR '${hostname}'.\n> Verify device exists and LAPS is configured.`);
      }
    } catch (e) {
      setConsoleText(`[!] EXTRACTION FAILURE:\n${e.message}`);
    }
  };

  const reset = () => { setHostname(""); setPassword(null); setConsoleText("> AWAITING DEVICE TARGET INPUT..."); };
  const copy = () => { if (password) navigator.clipboard.writeText(password); };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">CREDENTIAL VAULT // </span>
        <span className="module-header-name" style={{ color: "var(--neon-yellow)", textShadow: "0 0 8px #FFE600" }}>LAPS DECRYPTION</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--neon-yellow)", fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>[ TARGET HOSTNAME / DEVICE ID ]</div>
          <input
            className="cyber-input"
            style={{ color: "var(--neon-yellow)", borderColor: "var(--neon-yellow)", width: 340, fontSize: 20, textAlign: "center", background: "#0A0A00" }}
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && extract()}
            placeholder="HOSTNAME..."
          />
        </div>
        <button className="cyber-btn btn-yellow" style={{ fontSize: 16, padding: "14px 28px" }} onClick={extract}>
          [ INITIATE EXTRACTION ]
        </button>

        {password && (
          <div className="reveal-panel" style={{ border: "2px solid var(--neon-green)", background: "#001100", padding: 24, textAlign: "center", boxShadow: "0 0 15px #00FF41" }}>
            <div style={{ color: "var(--neon-green)", fontSize: 13, fontWeight: "bold", marginBottom: 8 }}>PASSWORD DECRYPTED SUCCESSFULLY</div>
            <div style={{ color: "#fff", fontSize: 26, fontFamily: "var(--font-mono)", fontWeight: "bold", margin: "0 0 16px" }}>{password}</div>
            <button className="cyber-btn btn-green" onClick={copy}>[ COPY TO CLIPBOARD ]</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 0", borderTop: "1px solid #33FFE600", marginTop: 8 }}>
        <button className="cyber-btn btn-yellow" onClick={reset}>[ RESET TARGET ]</button>
      </div>

      <div className="console-box console-yellow" style={{ height: 80, marginTop: 8 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
