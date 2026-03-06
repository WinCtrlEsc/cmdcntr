// ============================================================
// authConfig.js
// Client ID and Tenant ID are NEVER hardcoded here.
// They are entered by the operator in the Settings module
// and stored in localStorage on the local device only.
// Nothing in this file should ever be committed with real IDs.
// ============================================================

export const STORAGE_KEY_CLIENT_ID = "cc_client_id";
export const STORAGE_KEY_TENANT_ID = "cc_tenant_id";

/** Read saved credentials from localStorage */
export function loadStoredConfig() {
  return {
    clientId: localStorage.getItem(STORAGE_KEY_CLIENT_ID) ?? "",
    tenantId: localStorage.getItem(STORAGE_KEY_TENANT_ID) ?? "",
  };
}

/** Persist credentials to localStorage */
export function saveStoredConfig({ clientId, tenantId }) {
  localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  localStorage.setItem(STORAGE_KEY_TENANT_ID, tenantId.trim());
}

/** Wipe credentials from localStorage */
export function clearStoredConfig() {
  localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  localStorage.removeItem(STORAGE_KEY_TENANT_ID);
}

/** Returns true only when both values are present */
export function isConfigured() {
  const { clientId, tenantId } = loadStoredConfig();
  return clientId.length > 0 && tenantId.length > 0;
}

/**
 * Build the MSAL PublicClientApplication config from stored values.
 * Call this at runtime — never at module-load time with static strings.
 */
export function buildMsalConfig() {
  const { clientId, tenantId } = loadStoredConfig();
  return {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: "localStorage",   // localStorage so PWA survives tab close
      storeAuthStateInCookie: false,
    },
  };
}

// All scopes — identical to the original GraphService.cs
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
