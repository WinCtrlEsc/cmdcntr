// IpReconService.js
// Geo lookup via ipwho.is (free, HTTPS, CORS-enabled, no key required)
// Threat intel via AbuseIPDB v2 API (key stored in localStorage)

import { STORAGE_KEY_ABUSEIPDB } from "../authConfig";

export async function traceIp(ip, log) {
  // ── GEO LOOKUP ──────────────────────────────────────────────────────────────
  // ipwho.is: free, HTTPS, CORS-enabled, no key required
  const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
  if (!geoRes.ok) throw new Error(`GEO API error ${geoRes.status}`);
  const geo = await geoRes.json();
  if (!geo.success) throw new Error(`GEO lookup failed: ${geo.message ?? "unknown error"}`);

  log("> GEO DATA ACQUIRED.");

  const ispClean = geo.connection?.isp ?? geo.connection?.org ?? "UNKNOWN";
  const asnFull  = geo.connection?.asn ? `AS${geo.connection.asn} ${geo.connection.org ?? ""}`.trim() : "UNKNOWN";

  const geoData = {
    ip:          geo.ip,
    country:     geo.country,
    countryCode: geo.country_code,
    region:      geo.region,
    city:        geo.city,
    lat:         geo.latitude,
    lon:         geo.longitude,
    timezone:    geo.timezone?.id ?? "UNKNOWN",
    isp:         ispClean,
    org:         geo.connection?.org ?? ispClean,
    asn:         asnFull,
  };

  // ── ABUSEIPDB THREAT INTEL ───────────────────────────────────────────────────
  log("> QUERYING ABUSEIPDB...");

  const apiKey = localStorage.getItem(STORAGE_KEY_ABUSEIPDB) ?? "";
  let abuseData = {
    score: 0,
    totalReports: 0,
    numDistinctUsers: 0,
    usageType: "UNKNOWN",
    domain: "UNKNOWN",
    lastReportedAt: null,
    error: null,
  };

  if (!apiKey) {
    abuseData.error = "NO API KEY — configure in Settings.";
    log("> [!] ABUSEIPDB KEY NOT CONFIGURED. SKIPPING THREAT INTEL.");
  } else {
    // AbuseIPDB does not send CORS headers, so browser fetch is blocked.
    // Route through corsproxy.io (?url= format) which forwards all request headers to the target.
    const targetUrl = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const proxyUrl  = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;

    const abuseRes = await fetch(proxyUrl, {
      headers: { Key: apiKey, Accept: "application/json" },
    });
    if (!abuseRes.ok) {
      const errText = await abuseRes.text();
      abuseData.error = `AbuseIPDB error ${abuseRes.status}`;
      log(`> [!] ABUSEIPDB ERROR ${abuseRes.status}: ${errText}`);
    } else {
      const json = await abuseRes.json();
      const d = json.data;
      abuseData = {
        score:            d.abuseConfidenceScore  ?? 0,
        totalReports:     d.totalReports          ?? 0,
        numDistinctUsers: d.numDistinctUsers       ?? 0,
        usageType:        d.usageType             ?? "UNKNOWN",
        domain:           d.domain                ?? "UNKNOWN",
        lastReportedAt:   d.lastReportedAt        ?? null,
        error:            null,
      };
    }
  }

  log(`> ABUSEIPDB SCORE: ${abuseData.score}% | REPORTS: ${abuseData.totalReports}`);
  log("> TRACE COMPLETE.");

  return { geo: geoData, abuse: abuseData };
}
