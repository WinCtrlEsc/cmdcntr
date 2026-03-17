// IpReconModule.jsx
import { useState, useRef } from "react";
import { traceIp } from "../services/IpReconService";

function scoreColor(score) {
  if (score > 50) return "var(--neon-red)";
  if (score > 20) return "var(--neon-yellow)";
  return "var(--neon-green)";
}

function scoreGlow(score) {
  if (score > 50) return "0 0 16px #FF111188";
  if (score > 20) return "0 0 16px #FFE60088";
  return "0 0 16px #00FF4188";
}

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
    setConsoleText(`> INITIATING TRACE ON ${ip.trim()}...\n> QUERYING GEO DATABASE [ip-api.com]...`);
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

  const lastReported = result?.abuse.lastReportedAt
    ? new Date(result.abuse.lastReportedAt).toLocaleDateString("en-US")
    : "NEVER";

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

      {/* Results — two panel layout matching WPF version */}
      {result && (
        <div className="reveal-panel" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, minHeight: 0, marginBottom: 12 }}>

          {/* GEO LOCATION DATA */}
          <div style={{ border: "2px solid var(--neon-pink)", background: "#110011", padding: 20, boxShadow: "0 0 12px #FF00AA44", overflowY: "auto" }}>
            <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 16, letterSpacing: "0.1em" }}>
              GEO LOCATION DATA
            </div>
            {[
              ["IP ADDRESS",     result.geo.ip,                                        "#fff"],
              ["COUNTRY",        `${result.geo.country} [${result.geo.countryCode}]`,  "var(--neon-pink)"],
              ["REGION / CITY",  `${result.geo.region} / ${result.geo.city}`,          "var(--neon-pink)"],
              ["COORDINATES",    `${result.geo.lat}, ${result.geo.lon}`,               "var(--neon-pink)"],
              ["TIMEZONE",       result.geo.timezone,                                   "var(--neon-pink)"],
              ["ISP",            result.geo.isp,                                        "var(--neon-pink)"],
              ["ORG",            result.geo.org,                                        "var(--neon-pink)"],
              ["ASN",            result.geo.asn,                                        "var(--neon-pink)"],
            ].map(([label, val, color]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", letterSpacing: "0.08em" }}>{label}</div>
                <div style={{ color, fontSize: 14, fontWeight: "bold", wordBreak: "break-word" }}>{val ?? "UNKNOWN"}</div>
              </div>
            ))}
          </div>

          {/* ABUSEIPDB THREAT INTEL */}
          <div style={{ border: "1px solid #FF00AA44", background: "#0A0005", padding: 20, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ color: "var(--neon-cyan)", fontSize: 11, fontWeight: "bold", textAlign: "center", marginBottom: 16, letterSpacing: "0.1em" }}>
              ABUSEIPDB THREAT INTEL
            </div>

            {/* Big score */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", letterSpacing: "0.08em", marginBottom: 6 }}>
                ABUSE CONFIDENCE SCORE
              </div>
              <div style={{
                fontSize: 52,
                fontWeight: 700,
                fontFamily: "var(--font-hud)",
                color: scoreColor(result.abuse.score),
                textShadow: scoreGlow(result.abuse.score),
                lineHeight: 1,
              }}>
                {result.abuse.score}%
              </div>
            </div>

            {result.abuse.error ? (
              <div style={{ color: "var(--neon-yellow)", fontSize: 12, textAlign: "center" }}>
                {result.abuse.error}
              </div>
            ) : (
              <>
                {[
                  ["TOTAL ABUSE REPORTS",  String(result.abuse.totalReports),     result.abuse.totalReports     > 0 ? "var(--neon-red)"    : "var(--neon-green)"],
                  ["DISTINCT REPORTERS",   String(result.abuse.numDistinctUsers), result.abuse.numDistinctUsers > 0 ? "var(--neon-yellow)" : "var(--neon-green)"],
                  ["USAGE TYPE",           result.abuse.usageType,                "#fff"],
                  ["DOMAIN",               result.abuse.domain,                   "var(--neon-cyan)"],
                  ["LAST REPORTED",        lastReported,                           result.abuse.lastReportedAt ? "var(--neon-red)" : "var(--neon-green)"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ color: "#555", fontSize: 10, fontWeight: "bold", letterSpacing: "0.08em" }}>{label}</div>
                    <div style={{ color, fontSize: 14, fontWeight: "bold", wordBreak: "break-word" }}>{val}</div>
                  </div>
                ))}
              </>
            )}
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
