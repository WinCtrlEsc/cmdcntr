// IpReconService.js
// Geo lookup via ipgeolocation.io v3 (key stored in localStorage)
// Threat intel via AbuseIPDB v2 API (key stored in localStorage)

import { STORAGE_KEY_ABUSEIPDB, STORAGE_KEY_IPGEO } from "../authConfig";

export async function traceIp(ip, log) {
  // ── GEO LOOKUP ──────────────────────────────────────────────────────────────
  const ipGeoKey = localStorage.getItem(STORAGE_KEY_IPGEO) ?? "";
  if (!ipGeoKey) throw new Error("IPGEOLOCATION.IO KEY NOT CONFIGURED — add it in Settings.");

  const geoRes = await fetch(
    `https://api.ipgeolocation.io/v3/ipgeo?apiKey=${encodeURIComponent(ipGeoKey)}&ip=${encodeURIComponent(ip)}`
  );
  if (!geoRes.ok) throw new Error(`GEO API error ${geoRes.status}`);
  const geo = await geoRes.json();

  log("> GEO DATA ACQUIRED.");

  const org = geo.asn?.organization ?? "UNKNOWN";
  const asn = geo.asn?.as_number    ?? "UNKNOWN";

  const geoData = {
    ip:          geo.ip,
    country:     geo.location?.country_name      ?? "UNKNOWN",
    countryCode: geo.location?.country_code2     ?? "UNKNOWN",
    region:      geo.location?.state_prov        ?? "UNKNOWN",
    city:        geo.location?.city              ?? "UNKNOWN",
    lat:         geo.location?.latitude          ?? "UNKNOWN",
    lon:         geo.location?.longitude         ?? "UNKNOWN",
    timezone:    geo.time_zone?.name             ?? "UNKNOWN",
    isp:         org,
    org:         org,
    asn:         asn,
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
