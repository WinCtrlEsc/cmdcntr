// IpReconService.js
// Geo lookup via ipgeolocation.io v3 (key stored in localStorage)

import { STORAGE_KEY_IPGEO } from "../authConfig";

export async function traceIp(ip, log) {
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
    country:     geo.location?.country_name  ?? "UNKNOWN",
    countryCode: geo.location?.country_code2 ?? "UNKNOWN",
    region:      geo.location?.state_prov    ?? "UNKNOWN",
    city:        geo.location?.city          ?? "UNKNOWN",
    lat:         geo.location?.latitude      ?? "UNKNOWN",
    lon:         geo.location?.longitude     ?? "UNKNOWN",
    timezone:    geo.time_zone?.name         ?? "UNKNOWN",
    isp:         org,
    org:         org,
    asn:         asn,
  };

  log("> TRACE COMPLETE.");

  return geoData;
}
