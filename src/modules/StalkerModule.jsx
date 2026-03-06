// StalkerModule.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useGraph } from "../hooks/useGraph";
import {
  getActiveIncidents,
  getAlertsForIncident,
  getAlertDetail,
  assignIncidentToMe,
  resolveIncident,
} from "../services/GraphService";

function severityClass(sev) {
  const s = (sev || "").toLowerCase();
  if (s === "high" || s === "critical") return "sev-high";
  if (s === "medium") return "sev-medium";
  if (s === "low") return "sev-low";
  return "sev-unknown";
}

function buildAlertsText(alerts) {
  if (!alerts?.length) return "> NO ALERTS FOUND FOR THIS INCIDENT.";
  let out = `> ${alerts.length} ALERT(S) DETECTED:\n\n`;
  for (const a of alerts) {
    out += `[-] ${a.title}\n`;
    out += `    SEVERITY : ${a.severity}\n`;
    out += `    CATEGORY : ${a.category}\n`;
    out += `    CREATED  : ${a.createdDateTime}\n\n`;
  }
  return out;
}

function renderVal(v, depth = 0) {
  const pad = "      " + "  ".repeat(depth);
  if (v === null || v === undefined) return "null";
  if (typeof v !== "object") return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return v.map((item, i) => `\n${pad}[${i}] ${renderVal(item, depth + 1)}`).join("");
  }
  const entries = Object.entries(v).filter(([k]) => !["backingStore", "additionalData"].includes(k));
  if (!entries.length) return "{}";
  return entries.map(([k, val]) => `\n${pad}${k} : ${renderVal(val, depth + 1)}`).join("");
}

function buildEntitiesText(alertsWithEvidence) {
  if (!alertsWithEvidence?.length) return "> NO ALERTS FOUND TO EXTRACT ENTITIES.";
  let out = "";
  for (const alert of alertsWithEvidence) {
    out += `\n=== ALERT: ${alert.title} ===\n`;
    if (alert.evidence?.length) {
      for (const ev of alert.evidence) {
        const t = (ev["@odata.type"] || "unknown").replace("#microsoft.graph.security.", "");
        out += `  > ENTITY TYPE: ${t.toUpperCase()}\n`;
        for (const [k, v] of Object.entries(ev)) {
          if (["@odata.type", "backingStore", "additionalData"].includes(k)) continue;
          if (v !== null && v !== undefined) {
            out += `    - ${k} : ${renderVal(v)}\n`;
          }
        }
      }
    } else {
      out += "  > NO EVIDENCE/ENTITIES ATTACHED.\n";
    }
  }
  return out;
}

export default function StalkerModule() {
  const { getToken, currentUser, loadCurrentUser } = useGraph();
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consoleText, setConsoleText] = useState("> WAITING FOR OPERATIVE SELECTION...");
  const [showCustomComment, setShowCustomComment] = useState(false);
  const [customComment, setCustomComment] = useState("");
  const consoleRef = useRef(null);

  const appendConsole = useCallback((text) => {
    setConsoleText((prev) => prev + "\n\n" + text);
    setTimeout(() => {
      if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }, 50);
  }, []);

  const writeConsole = useCallback((text) => {
    setConsoleText(text);
    setTimeout(() => {
      if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }, 50);
  }, []);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await getActiveIncidents(token);
      setIncidents(data);
    } catch (e) {
      writeConsole(`[!] ERROR LOADING INCIDENTS: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [getToken, writeConsole]);

  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);

  // Auto-refresh every 60s while on this module
  useEffect(() => {
    loadIncidents();
    const timer = setInterval(() => {
      loadIncidents();
    }, 60000);
    return () => clearInterval(timer);
  }, [loadIncidents]);

  const selectIncident = (inc) => {
    setSelected(inc);
    setShowCustomComment(false);
    writeConsole(
      `SELECTED THREAT: ${inc.title}\n> ID: ${inc.id}\n> AWAITING COMMAND...`
    );
  };

  const handleViewAlerts = async () => {
    if (!selected) return;
    appendConsole("> EXTRACTING ALERT METADATA...");
    try {
      const token = await getToken();
      const alerts = await getAlertsForIncident(token, selected.id);
      appendConsole(buildAlertsText(alerts));
    } catch (e) {
      appendConsole(`[!] ERROR EXTRACTING ALERTS: ${e.message}`);
    }
  };

  const handleViewEntities = async () => {
    if (!selected) return;
    appendConsole("> DECRYPTING ENTITY EVIDENCE. THIS MAY TAKE A MOMENT...");
    try {
      const token = await getToken();
      const alerts = await getAlertsForIncident(token, selected.id);
      const detailed = await Promise.all(
        alerts.map((a) => getAlertDetail(token, a.id))
      );
      appendConsole(buildEntitiesText(detailed));
    } catch (e) {
      appendConsole(`[!] ERROR DECRYPTING ENTITIES: ${e.message}`);
    }
  };

  const handleAssign = async () => {
    if (!selected) return;
    appendConsole("> ASSIGNING TO OPERATIVE...");
    try {
      const token = await getToken();
      await assignIncidentToMe(token, selected.id, currentUser.email);
      appendConsole("> [SUCCESS] THREAT ASSIGNED. REFRESHING LIST...");
      await loadIncidents();
    } catch (e) {
      appendConsole(`[!] ASSIGN FAILED: ${e.message}`);
    }
  };

  const handleResolveFP = async () => {
    if (!selected) return;
    appendConsole("> RESOLVING AS FALSE POSITIVE...");
    try {
      const token = await getToken();
      await resolveIncident(token, selected.id, "falsePositive", "notMalicious", "", currentUser.email);
      appendConsole("> [SUCCESS] THREAT NEUTRALIZED. REFRESHING LIST...");
      setSelected(null);
      await loadIncidents();
    } catch (e) {
      appendConsole(`[!] RESOLVE FAILED: ${e.message}`);
    }
  };

  const handleResolveTP = async () => {
    if (!selected) return;
    appendConsole("> RESOLVING AS TRUE POSITIVE (PHISHING)...");
    try {
      const token = await getToken();
      await resolveIncident(token, selected.id, "truePositive", "phishing", "", currentUser.email);
      appendConsole("> [SUCCESS] THREAT NEUTRALIZED. REFRESHING LIST...");
      setSelected(null);
      await loadIncidents();
    } catch (e) {
      appendConsole(`[!] RESOLVE FAILED: ${e.message}`);
    }
  };

  const handleCustomResolve = async () => {
    if (!selected) return;
    if (!showCustomComment) {
      setShowCustomComment(true);
      appendConsole("> ENTER RESOLUTION DIRECTIVE IN TEXT BOX AND CLICK SUBMIT.");
      return;
    }
    appendConsole("> RESOLVING WITH CUSTOM DIRECTIVE...");
    try {
      const token = await getToken();
      await resolveIncident(token, selected.id, "truePositive", "other", customComment, currentUser.email);
      appendConsole("> [SUCCESS] CUSTOM RESOLUTION APPLIED.");
      setSelected(null);
      setShowCustomComment(false);
      setCustomComment("");
      await loadIncidents();
    } catch (e) {
      appendConsole(`[!] RESOLVE FAILED: ${e.message}`);
    }
  };

  const actionsDisabled = !selected;

  return (
    <div className="module-view">
      {/* Red Alert Banner */}
      <div className="stalker-header-banner">
        <span className="stalker-banner-text">/!\ SECURITY INCIDENTS /!\</span>
      </div>

      {/* Incidents Table */}
      <div className="cyber-table-wrap table-red" style={{ flex: 2, minHeight: 0, marginBottom: 0 }}>
        <table className="cyber-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>SEVERITY</th>
              <th>THREAT_DESIGNATION</th>
              <th style={{ width: 180 }}>ASSIGNED_OPERATIVE</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#555" }}>
                SCANNING THREAT VECTORS...
              </td></tr>
            )}
            {!loading && incidents.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: "center", padding: "20px", color: "#555" }}>
                NO ACTIVE INCIDENTS DETECTED.
              </td></tr>
            )}
            {incidents.map((inc) => (
              <tr
                key={inc.id}
                className={selected?.id === inc.id ? "selected" : ""}
                style={{ cursor: "pointer" }}
                onClick={() => selectIncident(inc)}
              >
                <td><span className={severityClass(inc.severity)}>{inc.severity?.toUpperCase()}</span></td>
                <td>{inc.title}</td>
                <td style={{ color: "#aaa" }}>{inc.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Bar */}
      <div className="stalker-actions">
        <div className="stalker-actions-left">
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleViewAlerts}>
            [ VIEW ALERTS ]
          </button>
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleViewEntities}>
            [ VIEW ENTITIES ]
          </button>
        </div>
        <div className="stalker-actions-right">
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleAssign}>
            [ ASSIGN TO ME ]
          </button>
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleResolveFP}>
            [ RES: FALSE POS ]
          </button>
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleResolveTP}>
            [ RES: PHISH ]
          </button>
          {showCustomComment && (
            <input
              className="custom-comment-input"
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              placeholder="CUSTOM COMMENT..."
              autoFocus
            />
          )}
          <button className="cyber-btn btn-red" disabled={actionsDisabled} onClick={handleCustomResolve}>
            {showCustomComment ? "[ SUBMIT ]" : "[ CUSTOM RES ]"}
          </button>
          <button className="cyber-btn btn-red" onClick={() => { loadIncidents(); }} style={{ marginLeft: 8 }}>
            [ REFRESH ]
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={consoleRef}
        className="console-box console-red"
        style={{ flex: 1, minHeight: 100, marginTop: 8 }}
      >
        {consoleText}
        <span className="cursor"> _</span>
      </div>
    </div>
  );
}
