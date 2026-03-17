// IpReconService.js
// Geo lookup via ip-api.com (free, HTTPS, CORS-enabled)
// Threat intel via AbuseIPDB v2 API (key stored in localStorage)

import { STORAGE_KEY_ABUSEIPDB } from "../authConfig";

export async function traceIp(ip, log) {
  // ── GEO LOOKUP ──────────────────────────────────────────────────────────────
  const geoRes = await fetch(
    `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,query`
  );
  if (!geoRes.ok) throw new Error(`GEO API error ${geoRes.status}`);
  const geo = await geoRes.json();
  if (geo.status !== "success") throw new Error(`GEO lookup failed: ${geo.message ?? "unknown error"}`);

  log("> GEO DATA ACQUIRED.");

  const geoData = {
    ip:          geo.query,
    country:     geo.country,
    countryCode: geo.countryCode,
    region:      geo.regionName,
    city:        geo.city,
    lat:         geo.lat,
    lon:         geo.lon,
    timezone:    geo.timezone,
    isp:         geo.isp,
    org:         geo.org,
    asn:         geo.as,
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
    const abuseRes = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
      { headers: { Key: apiKey, Accept: "application/json" } }
    );
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
