// PhishHunterModule.jsx
import { useState } from "react";
import { useGraph } from "../hooks/useGraph";
import { searchPhishPayload, extractPhishUrls, reportMalicious, purgeThreat } from "../services/GraphService";

export default function PhishHunterModule() {
  const { getToken } = useGraph();
  const [target, setTarget] = useState("");
  const [results, setResults] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [consoleText, setConsoleText] = useState("> AWAITING THREAT INPUT...");

  const write = (t) => setConsoleText((p) => p + "\n\n" + t);
  const clearWrite = (t) => setConsoleText(t);

  const hunt = async () => {
    if (!target.trim()) { clearWrite("[!] INVALID TARGET: NETWORK MESSAGE ID OR SENDER CANNOT BE EMPTY."); return; }
    setResults(null);
    setSelectedRow(null);
    clearWrite(`> TRANSMITTING KQL PAYLOAD TO ADVANCED HUNTING ENGINE...\n> MAPPING BLAST RADIUS FOR: '${target}'`);
    try {
      const token = await getToken();
      const data = await searchPhishPayload(token, target.trim());
      if (data?.length) {
        setResults(data);
        write(`> [SUCCESS] EMAIL TELEMETRY RETURNED. IDENTIFIED ${data.length} TARGET(S) IN BLAST RADIUS.`);
      } else {
        write(`> [ERROR] NO MATCHING PAYLOAD FOUND.\n> Verify Message ID or Sender Address.\n> (Requires Defender for Office 365 P2 licenses.)`);
      }
    } catch (e) {
      write(`[!] KQL EXECUTION FAILURE:\n${e.message}`);
    }
  };

  const reset = () => { setTarget(""); setResults(null); setSelectedRow(null); clearWrite("> INCIDENT CLEARED. AWAITING NEXT PAYLOAD IDENTIFIER..."); };

  const extractUrls = async () => {
    if (!selectedRow?.networkMessageId) { write("[!] NO TARGET SELECTED: SELECT A SPECIFIC MESSAGE FROM THE BLAST RADIUS TABLE."); return; }
    write(`> RUNNING KQL PARSER ON EmailUrlInfo TABLE FOR MSG ID: ${selectedRow.networkMessageId}...`);
    try {
      const token = await getToken();
      const urls = await extractPhishUrls(token, selectedRow.networkMessageId);
      if (urls.length) {
        write(`> [!] ${urls.length} MALICIOUS URL(S) DETECTED:`);
        urls.forEach((u) => write(`  [-] ${u}`));
      } else {
        write("> [OK] NO URLs DETECTED IN THE SPECIFIED PAYLOAD.");
      }
    } catch (e) {
      write(`[!] URL EXTRACTION FAILURE:\n${e.message}`);
    }
  };

  const report = async () => {
    if (!selectedRow?.networkMessageId) { write("[!] NO TARGET SELECTED."); return; }
    write(`> PREPARING THREAT ASSESSMENT FOR MICROSOFT DEFENDER (ID: ${selectedRow.networkMessageId})...`);
    const token = await getToken();
    const result = await reportMalicious(token, selectedRow.networkMessageId);
    write(`> ${result}`);
  };

  const purge = async () => {
    if (!selectedRow?.networkMessageId) { write("[!] NO TARGET SELECTED."); return; }
    write(`> AUTHENTICATING HARD-DELETE REMEDIATION SIGNAL (ID: ${selectedRow.networkMessageId})...`);
    const token = await getToken();
    const result = await purgeThreat(token, selectedRow.networkMessageId);
    write(`> ${result}`);
  };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">INCIDENT RESPONSE // </span>
        <span className="module-header-name" style={{ color: "var(--acid-green)", textShadow: "0 0 8px #39FF14" }}>PHISH HUNTER</span>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ color: "var(--acid-green)", fontWeight: "bold", fontSize: 14 }}>[ MSG ID / SENDER ]</span>
        <input className="cyber-input" style={{ color: "var(--acid-green)", borderColor: "var(--acid-green)", width: 280, background: "#051105", fontSize: 16, textAlign: "center" }}
          value={target} onChange={(e) => setTarget(e.target.value)} onKeyDown={(e) => e.key === "Enter" && hunt()} placeholder="message-id or sender@domain..." />
        <button className="cyber-btn btn-acid" onClick={hunt}>[ HUNT THREAT ]</button>
        <button className="cyber-btn btn-acid" onClick={reset}>[ RESET ]</button>
      </div>

      {results && (
        <div className="reveal-panel" style={{ flex: 1, display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, minHeight: 0, marginBottom: 12 }}>
          {/* Blast radius table */}
          <div style={{ border: "2px solid var(--acid-green)", background: "#051505", padding: 12, boxShadow: "0 0 10px #39FF1455", display: "flex", flexDirection: "column" }}>
            <div style={{ color: "var(--acid-green)", fontSize: 11, fontWeight: "bold", marginBottom: 10 }}>BLAST RADIUS [RECIPIENTS]</div>
            <div className="cyber-table-wrap table-acid" style={{ flex: 1 }}>
              <table className="cyber-table">
                <thead><tr><th>TARGET MAILBOX</th><th style={{ width: 110 }}>ACTION</th><th style={{ width: 110 }}>LOCATION</th></tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className={selectedRow?.networkMessageId === r.networkMessageId ? "selected" : ""} style={{ cursor: "pointer" }} onClick={() => setSelectedRow(r)}>
                      <td>{r.recipient}</td>
                      <td>{r.deliveryAction}</td>
                      <td>{r.deliveryLocation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tactical actions */}
          <div style={{ border: "1px solid #33FF6600", background: "#110500", padding: 20, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <div style={{ color: "var(--neon-orange)", fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 8 }}>TACTICAL ACTIONS</div>
            <button className="cyber-btn btn-orange" style={{ height: 50 }} onClick={extractUrls}>[ EXTRACT URLs ]</button>
            <button className="cyber-btn btn-red" style={{ height: 50 }} onClick={report}>[ REPORT MALICIOUS ]</button>
            <button className="cyber-btn btn-red" style={{ height: 50 }} onClick={purge}>[ PURGE THREAT ]</button>
          </div>
        </div>
      )}

      {!results && <div style={{ flex: 1 }} />}

      <div className="console-box console-acid" style={{ height: 100 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
