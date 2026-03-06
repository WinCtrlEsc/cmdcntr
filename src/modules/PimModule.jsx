// PimModule.jsx
import { useState, useEffect, useCallback } from "react";
import { useGraph } from "../hooks/useGraph";
import { getPimRoles, activatePimRole } from "../services/GraphService";

export default function PimModule() {
  const { getToken, currentUser, loadCurrentUser } = useGraph();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("FETCHING ROLE MATRICES...");
  const [customHours, setCustomHours] = useState("");

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const loadRoles = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setStatus("FETCHING ROLE MATRICES...");
    try {
      const token = await getToken();
      const data = await getPimRoles(token, currentUser.id);
      // Sort: active first (matching original .OrderBy(r => r.IsActive) reversed = active on top)
      data.sort((a, b) => b.isActive - a.isActive);
      setRoles(data);
      setStatus("PIM DATA SYNCHRONIZED.");
    } catch (e) {
      setStatus(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [getToken, currentUser]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const toggleSelect = (idx) => {
    setRoles((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, isSelected: !r.isSelected } : r))
    );
  };

  const parseHours = () => {
    if (!customHours) return null;
    const n = parseInt(customHours);
    if (isNaN(n) || n < 1 || n > 24) {
      setStatus("INVALID HRS (1-24). USING DEFAULTS.");
      return null;
    }
    return n;
  };

  const activateSelected = async () => {
    const selected = roles.filter((r) => r.isSelected && !r.isActive);
    if (!selected.length) { setStatus("NO ELIGIBLE ROLES SELECTED."); return; }
    const hrs = parseHours();
    setStatus("INITIATING TARGETED ACTIVATION PROTOCOL...");
    const token = await getToken();
    for (const role of selected) {
      try {
        await activatePimRole(token, currentUser.id, role, hrs);
      } catch (e) {
        setStatus(`ERROR ON ${role.roleName}: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setStatus("ACTIVATION COMPLETE.");
    setCustomHours("");
    await loadRoles();
  };

  const activateAll = async () => {
    const eligible = roles.filter((r) => !r.isActive);
    if (!eligible.length) { setStatus("NO DORMANT ROLES DETECTED."); return; }
    const hrs = parseHours();
    setStatus("INITIATING BATCH OVERRIDE PROTOCOL...");
    const token = await getToken();
    for (const role of eligible) {
      try {
        await activatePimRole(token, currentUser.id, role, hrs);
      } catch (e) {
        setStatus(`ERROR ON ${role.roleName}: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setStatus("BATCH ACTIVATION COMPLETE.");
    setCustomHours("");
    await loadRoles();
  };

  return (
    <div className="module-view">
      {/* Header */}
      <div className="module-header">
        <span className="module-header-prefix">DIRECTORY SERVICES // </span>
        <span className="module-header-name" style={{ color: "var(--neon-green)", textShadow: "0 0 8px #00FF41" }}>
          PIM ELIGIBILITY MATRIX
        </span>
      </div>

      {/* Roles Table */}
      <div className="cyber-table-wrap table-green" style={{ flex: 1, minHeight: 0, marginBottom: 12 }}>
        <table className="cyber-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>[X]</th>
              <th>ROLE_IDENTIFIER</th>
              <th style={{ width: 170 }}>STATUS</th>
              <th style={{ width: 90 }}>MAX_HRS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#555" }}>
                LOADING...
              </td></tr>
            )}
            {!loading && roles.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#555" }}>
                NO ELIGIBLE ROLES FOUND.
              </td></tr>
            )}
            {roles.map((role, idx) => (
              <tr
                key={role.roleDefinitionId}
                style={{ cursor: "pointer" }}
                onClick={() => !role.isActive && toggleSelect(idx)}
              >
                <td>
                  <input
                    type="checkbox"
                    className="cyber-checkbox"
                    style={{ color: role.isActive ? "var(--neon-green)" : "var(--neon-cyan)" }}
                    checked={role.isSelected}
                    disabled={role.isActive}
                    onChange={() => toggleSelect(idx)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td style={{ color: role.isActive ? "var(--neon-green)" : undefined }}>
                  {role.roleName}
                </td>
                <td>
                  <span className={role.isActive ? "pim-status-active" : "pim-status-eligible"}>
                    {role.status}
                  </span>
                </td>
                <td style={{ color: "#aaa" }}>{role.defaultHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Controls */}
      <div className="pim-footer">
        <span className="pim-hours-label">CUSTOM HRS:</span>
        <input
          type="number"
          className="pim-hours-input"
          value={customHours}
          onChange={(e) => setCustomHours(e.target.value)}
          min={1}
          max={24}
          placeholder="—"
        />
        <div style={{ flex: 1 }} />
        <button className="cyber-btn btn-green" onClick={activateSelected} disabled={loading}>
          &gt; ACTIVATE_SELECTED
        </button>
        <button className="cyber-btn btn-green" onClick={activateAll} disabled={loading}>
          &gt; BATCH_ACTIVATE_ALL
        </button>
        <button className="cyber-btn btn-cyan" onClick={loadRoles} disabled={loading}>
          &gt; REFRESH_DATA
        </button>
      </div>

      {/* Status */}
      <div style={{ paddingTop: 8, fontSize: 12, color: "var(--neon-cyan)", flexShrink: 0 }}>
        STATUS: {status}
      </div>
    </div>
  );
}
