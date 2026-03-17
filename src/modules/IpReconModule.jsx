// IpReconModule.jsx
import { useState, useRef } from "react";
import { traceIp } from "../services/IpReconService";

export default function IpReconModule() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [consoleText, setConsoleText] = useState("> AWAITING TARGET IP ADDRESS...");
  const consoleRef = useRef(null);

  const append = (t) => {
    setConsoleText((p) => p + "\n" + t);
    setTimeout(() => {
      if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }, 50);
  };

  const trace = async () => {
    if (!ip.trim()) { setConsoleText("[!] INVALID TARGET: IP ADDRESS CANNOT BE EMPTY."); return; }
    setResult(null);
    setLoading(true);
    setConsoleText(`> INITIATING TRACE ON ${ip.trim()}...\n> QUERYING GEO DATABASE [ipgeolocation.io]...`);
    try {
      const data = await traceIp(ip.trim(), append);
      setResult(data);
    } catch (e) {
      append(`[!] TRACE FAILED: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setIp("");
    setResult(null);
    setConsoleText("> TELEMETRY CLEARED. AWAITING NEXT TARGET...");
  };

  return (
    <div className="module-view">
      <div className="module-header">
        <span className="module-header-prefix">THREAT INTEL // </span>
        <span className="module-header-name" style={{ color: "var(--neon-pink)", textShadow: "0 0 8px #FF00AA" }}>
          IP RECON
        </span>
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ color: "var(--neon-pink)", fontWeight: "bold", fontSize: 14 }}>[ TARGET IP ADDRESS ]</span>
        <input
          className="cyber-input"
          style={{ color: "var(--neon-pink)", borderColor: "var(--neon-pink)", width: 220, background: "#110011", fontSize: 18, textAlign: "center" }}
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && trace()}
          placeholder="0.0.0.0"
        />
        <button className="cyber-btn btn-pink" onClick={trace} disabled={loading}>
          {loading ? "TRACING..." : "[ TRACE IP ]"}
        </button>
        <button className="cyber-btn btn-pink" onClick={reset} disabled={loading}>[ RESET ]</button>
      </div>

      {/* Results */}
      {result && (
        <div className="reveal-panel" style={{ flex: 1, display: "flex", justifyContent: "center", minHeight: 0, marginBottom: 12 }}>
          <div style={{ border: "2px solid var(--neon-pink)", background: "#110011", padding: 20, boxShadow: "0 0 12px #FF00AA44", overflowY: "auto", width: "100%", maxWidth: 480 }}>
            <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 16, letterSpacing: "0.1em" }}>
              GEO LOCATION DATA
            </div>
            {[
              ["IP ADDRESS",    result.ip,                                       "#fff"],
              ["COUNTRY",       `${result.country} [${result.countryCode}]`,    "var(--neon-pink)"],
              ["REGION / CITY", `${result.region} / ${result.city}`,            "var(--neon-pink)"],
              ["COORDINATES",   `${result.lat}, ${result.lon}`,                 "var(--neon-pink)"],
              ["TIMEZONE",      result.timezone,                                  "var(--neon-pink)"],
              ["ISP",           result.isp,                                       "var(--neon-pink)"],
              ["ORG",           result.org,                                       "var(--neon-pink)"],
              ["ASN",           result.asn,                                       "var(--neon-pink)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", letterSpacing: "0.08em" }}>{label}</div>
                <div style={{ color, fontSize: 14, fontWeight: "bold", wordBreak: "break-word" }}>{val ?? "UNKNOWN"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && <div style={{ flex: 1 }} />}

      <div ref={consoleRef} className="console-box console-pink" style={{ height: 100 }}>
        {consoleText}<span className="cursor"> _</span>
      </div>
    </div>
  );
}
