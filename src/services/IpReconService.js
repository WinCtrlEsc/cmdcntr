// IpReconService.js
// Geo lookup via ipapi.co (free, HTTPS, CORS-enabled, no key required)
// Threat intel via AbuseIPDB v2 API (key stored in localStorage)

import { STORAGE_KEY_ABUSEIPDB } from "../authConfig";

export async function traceIp(ip, log) {
  // ── GEO LOOKUP ──────────────────────────────────────────────────────────────
  const geoRes = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
  if (!geoRes.ok) throw new Error(`GEO API error ${geoRes.status}`);
  const geo = await geoRes.json();
  if (geo.error) throw new Error(`GEO lookup failed: ${geo.reason ?? "unknown error"}`);

  log("> GEO DATA ACQUIRED.");

  // org field is "AS22773 Cox Communications Inc." — split off the ASN prefix for cleaner display
  const orgFull  = geo.org ?? "UNKNOWN";
  const ispClean = orgFull.replace(/^AS\d+\s*/, "") || orgFull;

  const geoData = {
    ip:          geo.ip,
    country:     geo.country_name,
    countryCode: geo.country,
    region:      geo.region,
    city:        geo.city,
    lat:         geo.latitude,
    lon:         geo.longitude,
    timezone:    geo.timezone ?? "UNKNOWN",
    isp:         ispClean,
    org:         ispClean,
    asn:         geo.asn ?? orgFull,
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
