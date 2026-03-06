// DossierModule.jsx
import { useState } from "react";
import { useGraph } from "../hooks/useGraph";
import { getDossier } from "../services/GraphService";

export default function DossierModule() {
  const { getToken } = useGraph();
  const [alias, setAlias] = useState("");
  const [dossier, setDossier] = useState(null);
  const [consoleText, setConsoleText] = useState("> AWAITING DOSSIER TARGET...");

  const search = async () => {
    if (!alias.trim()) { setConsoleText("[!] INVALID TARGET: ALIAS CANNOT BE EMPTY."); return; }
    setDossier(null);
    setConsoleText(`> INITIATING IDENTITY QUERY FOR: '${alias}'\n> FETCHING PERSONNEL FILE...\n> MAPPING CLEARANCES...`);
    try {
      const token = await getToken();
      const data = await getDossier(token, alias.trim());
      if (data) {
        setDossier(data);
        setConsoleText(`> [SUCCESS] INTEL ACQUIRED. ${data.groups.length} CLEARANCES DECRYPTED.`);
      } else {
        setConsoleText(`> [ERROR] NO MATCHING DOSSIER FOUND FOR '${alias}'.\n> Verify alias or try full UPN.`);
      }
    } catch (e) {
      setConsoleText(`[!] QUERY FAILURE:\n${e.message}`);
    }
  };

  const reset = () => { setAlias(""); setDossier(null); setConsoleText("> DOSSIER CLOSED. AWAITING NEXT TARGET..."); };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">OPERATIVE INTEL // </span>
        <span className="module-header-name" style={{ color: "var(--neon-blue)", textShadow: "0 0 8px #00E5FF" }}>DOSSIER LOOKUP</span>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ color: "var(--neon-blue)", fontWeight: "bold", fontSize: 14 }}>[ TARGET ALIAS / UPN ]</span>
        <input className="cyber-input" style={{ color: "var(--neon-blue)", borderColor: "var(--neon-blue)", width: 240, background: "#000A11", fontSize: 18, textAlign: "center" }}
          value={alias} onChange={(e) => setAlias(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="alias..." />
        <button className="cyber-btn btn-blue" onClick={search}>[ QUERY INTEL ]</button>
        <button className="cyber-btn btn-blue" onClick={reset}>[ RESET ]</button>
      </div>

      {/* Dossier reveal */}
      {dossier && (
        <div className="reveal-panel" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minHeight: 0, marginBottom: 12 }}>
          {/* ID Card — centered */}
          <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <div className="id-card-inner" style={{ border: "2px solid var(--neon-blue)", background: "#001122", padding: 20, boxShadow: "0 0 14px #00E5FF55", display: "flex", gap: 24, alignItems: "center" }}>
              {dossier.photoUrl && (
                <img src={dossier.photoUrl} style={{ width: 90, height: 90, objectFit: "cover", border: "2px solid var(--neon-cyan)", borderRadius: 4, flexShrink: 0 }} alt="profile" />
              )}
              <div>
                <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", marginBottom: 12 }}>IDENTITY CONFIRMED</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 32px" }}>
                  {[["NAME", dossier.displayName, "#fff"], ["TITLE", dossier.jobTitle, "var(--neon-blue)"], ["DEPARTMENT", dossier.department, "var(--neon-blue)"], ["REPORTS TO", dossier.managerName, "var(--neon-yellow)"]].map(([label, val, color]) => (
                    <div key={label}>
                      <div style={{ color: "#555", fontSize: 10, fontWeight: "bold" }}>{label}</div>
                      <div style={{ color, fontSize: 14, fontWeight: "bold", wordBreak: "break-word" }}>{val?.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Groups table */}
          <div style={{ border: "1px solid #3300E5FF", background: "#00050A", padding: 12, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ color: "var(--neon-blue)", fontSize: 12, fontWeight: "bold", marginBottom: 10 }}>ACTIVE CLEARANCES // GROUPS</div>
            <div className="cyber-table-wrap" style={{ flex: 1 }}>
              <table className="cyber-table">
                <thead><tr><th style={{ width: 110 }}>TYPE</th><th>IDENTIFIER</th></tr></thead>
                <tbody>
                  {[...dossier.groups].sort((a, b) => a.groupType.localeCompare(b.groupType) || a.groupName.localeCompare(b.groupName)).map((g, i) => (
                    <tr key={i}><td style={{ color: "var(--neon-blue)" }}>{g.groupType}</td><td style={{ color: "var(--neon-blue)" }}>{g.groupName}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!dossier && <div style={{ flex: 1 }} />}

      <div className="console-box console-blue" style={{ height: 80, marginTop: 8 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
