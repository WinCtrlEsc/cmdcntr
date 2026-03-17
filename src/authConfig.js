// ============================================================
// authConfig.js
// Client ID and Tenant ID are NEVER hardcoded here.
// They are entered by the operator in the Settings module
// and stored in localStorage on the local device only.
// Nothing in this file should ever be committed with real IDs.
// ============================================================

export const STORAGE_KEY_CLIENT_ID    = "cc_client_id";
export const STORAGE_KEY_TENANT_ID    = "cc_tenant_id";
export const STORAGE_KEY_LOGIN_HINT   = "cc_login_hint";
export const STORAGE_KEY_ABUSEIPDB    = "cc_abuseipdb_key";
export const STORAGE_KEY_IPGEO        = "cc_ipgeo_key";

/** Read saved credentials from localStorage */
export function loadStoredConfig() {
  return {
    clientId:     localStorage.getItem(STORAGE_KEY_CLIENT_ID)  ?? "",
    tenantId:     localStorage.getItem(STORAGE_KEY_TENANT_ID)  ?? "",
    loginHint:    localStorage.getItem(STORAGE_KEY_LOGIN_HINT) ?? "",
    abuseIpDbKey: localStorage.getItem(STORAGE_KEY_ABUSEIPDB)  ?? "",
    ipGeoKey:     localStorage.getItem(STORAGE_KEY_IPGEO)       ?? "",
  };
}

/** Persist credentials to localStorage */
export function saveStoredConfig({ clientId, tenantId, loginHint = "", abuseIpDbKey = "", ipGeoKey = "" }) {
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  localStorage.setItem(STORAGE_KEY_TENANT_ID, tenantId.trim());
  if (loginHint.trim()) {
    localStorage.setItem(STORAGE_KEY_LOGIN_HINT, loginHint.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_LOGIN_HINT);
  }
  if (abuseIpDbKey.trim()) {
    localStorage.setItem(STORAGE_KEY_ABUSEIPDB, abuseIpDbKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_ABUSEIPDB);
  }
  if (ipGeoKey.trim()) {
    localStorage.setItem(STORAGE_KEY_IPGEO, ipGeoKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_IPGEO);
  }
}

/** Wipe all credentials from localStorage */
export function clearStoredConfig() {
  localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  localStorage.removeItem(STORAGE_KEY_TENANT_ID);
  localStorage.removeItem(STORAGE_KEY_LOGIN_HINT);
  localStorage.removeItem(STORAGE_KEY_ABUSEIPDB);
  localStorage.removeItem(STORAGE_KEY_IPGEO);
}

/** Returns true only when both required values are present */
export function isConfigured() {
  const { clientId, tenantId } = loadStoredConfig();
  return clientId.length > 0 && tenantId.length > 0;
}

/**
 * Build the login request, injecting login_hint + prompt if a
 * preferred UPN is stored. This forces Entra to skip the managed-device
 * SSO broker (Microsoft Authenticator / Company Portal) on iOS and go
 * directly to the specified elevated account instead.
 */
export function buildLoginRequest() {
  const { loginHint } = loadStoredConfig();
  if (loginHint) {
    return {
      ...loginRequest,
      loginHint,
      prompt: "login",
    };
  }
  return loginRequest;
}

/**
 * Build the MSAL PublicClientApplication config from stored values.
 * Call this at runtime — never at module-load time with static strings.
 */
export function buildMsalConfig() {
  const { clientId, tenantId } = loadStoredConfig();
  // Use origin + pathname so subdirectory deployments like
  // https://winctrlesc.github.io/cmdcntr/ send the correct redirect URI.
  // window.location.origin alone strips the path, causing AADSTS50011.
  const baseUrl = window.location.origin + window.location.pathname;
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: baseUrl,
      postLogoutRedirectUri: baseUrl,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: false,
    },
  };
}

export const graphScopes = [
  "SecurityIncident.ReadWrite.All",
  "RoleManagement.ReadWrite.Directory",
  "RoleAssignmentSchedule.ReadWrite.Directory",
  "SecurityEvents.Read.All",
  "User.Read.All",
  "Directory.Read.All",
  "Device.Read.All",
  "DeviceLocalCredential.Read.All",
  "DeviceManagementManagedDevices.ReadWrite.All",
  "BitLockerKey.Read.All",
  "AuditLog.Read.All",
  "ThreatHunting.Read.All",
  "ThreatSubmission.ReadWrite.All",
];

export const loginRequest = {
  scopes: graphScopes,
};