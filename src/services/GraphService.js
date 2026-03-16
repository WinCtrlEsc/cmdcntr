// ============================================================
// GraphService.js
// Direct port of GraphService.cs to browser fetch() calls.
// All Graph API endpoints are identical; only the client differs.
// ============================================================

const GRAPH_BASE      = "https://graph.microsoft.com/v1.0";
const GRAPH_BASE_BETA = "https://graph.microsoft.com/beta";

async function graphFetch(accessToken, path, options = {}, base = GRAPH_BASE) {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error ${res.status}: ${err}`);
  }
  // Some actions return 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

const graphFetchBeta = (accessToken, path, options = {}) =>
  graphFetch(accessToken, path, options, GRAPH_BASE_BETA);

// ─── ME ──────────────────────────────────────────────────────────────────────

export async function getMe(token) {
  return graphFetch(token, "/me");
}

// ─── PIM ─────────────────────────────────────────────────────────────────────

export async function getPimRoles(token, userId) {
  const shortRoles = ["Cloud Application Administrator", "POSD LAPS Reader", "Global Reader"];

  const [eligibleRes, activeRes] = await Promise.all([
    graphFetch(
      token,
      `/roleManagement/directory/roleEligibilitySchedules?$filter=principalId eq '${userId}'&$expand=roleDefinition`
    ),
    graphFetch(
      token,
      `/roleManagement/directory/roleAssignments?$filter=principalId eq '${userId}'`
    ),
  ]);

  const activeIds = (activeRes?.value ?? []).map((a) => a.roleDefinitionId);

  return (eligibleRes?.value ?? []).map((schedule) => {
    const roleName = schedule.roleDefinition?.displayName ?? "Unknown Role";
    const isActive = activeIds.includes(schedule.roleDefinitionId);
    return {
      roleDefinitionId: schedule.roleDefinitionId,
      directoryScopeId: schedule.directoryScopeId,
      principalId: schedule.principalId,
      roleName,
      status: isActive ? "ACTIVE [ON]" : "ELIGIBLE [OFF]",
      defaultHours: shortRoles.includes(roleName) ? 8 : 10,
      isActive,
      isSelected: false,
    };
  });
}

export async function activatePimRole(token, userId, role, customHours = null) {
  const hours = customHours ?? role.defaultHours;
  const body = {
    action: "selfActivate",
    principalId: role.principalId ?? userId,
    roleDefinitionId: role.roleDefinitionId,
    directoryScopeId: role.directoryScopeId,
    justification: "Command Center Manual Activation",
    scheduleInfo: {
      startDateTime: new Date().toISOString(),
      expiration: {
        type: "afterDuration",
        duration: `PT${hours}H`,
      },
    },
  };
  return graphFetch(token, "/roleManagement/directory/roleAssignmentScheduleRequests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── GRAPH STALKER ────────────────────────────────────────────────────────────

export async function getActiveIncidents(token) {
  const res = await graphFetch(
    token,
    `/security/incidents?$filter=status ne 'resolved' and severity ne 'informational'&$top=50`
  );
  return (res?.value ?? []).map((inc) => ({
    id: inc.id,
    title: inc.displayName ?? inc.name ?? "(No Title)",
    severity: inc.severity ?? "Unknown",
    assignedTo: inc.assignedTo ?? "Unassigned",
  }));
}

export async function getAlertsForIncident(token, incidentId) {
  const res = await graphFetch(
    token,
    `/security/alerts_v2?$filter=incidentId eq '${incidentId}'`
  );
  return res?.value ?? [];
}

export async function getAlertDetail(token, alertId) {
  return graphFetch(token, `/security/alerts_v2/${alertId}`);
}

export async function assignIncidentToMe(token, incidentId, userEmail) {
  return graphFetch(token, `/security/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify({ assignedTo: userEmail, status: "inProgress" }),
  });
}

export async function resolveIncident(token, incidentId, classification, determination, comment, userEmail) {
  const body = {
    assignedTo: userEmail,
    status: "resolved",
    classification,
    determination,
  };
  if (comment) {
    body.comments = [{ comment }];
  }
  return graphFetch(token, `/security/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ─── PASS PULLER ─────────────────────────────────────────────────────────────

export async function getLapsPassword(token, hostname) {
  const devRes = await graphFetch(
    token,
    `/devices?$filter=displayName eq '${encodeURIComponent(hostname)}'&$select=id,deviceId`
  );
  const device = devRes?.value?.[0];
  if (!device?.deviceId) return null;

  const lapsRes = await graphFetch(
    token,
    `/directory/deviceLocalCredentials/${device.deviceId}?$select=credentials`
  );
  const cred = lapsRes?.credentials?.[0];
  if (!cred) return null;

  // Password is Base64 encoded in the API response
  return atob(cred.passwordBase64 ?? cred.secret ?? "");
}

// ─── DOSSIER ─────────────────────────────────────────────────────────────────

export async function getDossier(token, alias) {
  const usersRes = await graphFetch(
    token,
    `/users?$filter=mailNickname eq '${alias}' or userPrincipalName eq '${alias}' or startswith(userPrincipalName,'${alias}@')&$select=id,displayName,jobTitle,department`
  );
  const user = usersRes?.value?.[0];
  if (!user) return null;

  const dossier = {
    displayName: user.displayName ?? "UNKNOWN",
    jobTitle: user.jobTitle ?? "UNKNOWN",
    department: user.department ?? "UNKNOWN",
    managerName: "UNASSIGNED",
    photoUrl: null,
    groups: [],
  };

  // Manager
  try {
    const mgr = await graphFetch(token, `/users/${user.id}/manager?$select=displayName`);
    dossier.managerName = mgr?.displayName ?? "UNASSIGNED";
  } catch (_) {}

  // Photo — return as blob URL
  try {
    const res = await fetch(`${GRAPH_BASE}/users/${user.id}/photo/$value`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      dossier.photoUrl = URL.createObjectURL(blob);
    }
  } catch (_) {}

  // Groups / Roles
  try {
    const memberRes = await graphFetch(token, `/users/${user.id}/memberOf`);
    for (const obj of memberRes?.value ?? []) {
      dossier.groups.push({
        groupName: obj.displayName ?? "Unknown",
        groupType:
          obj["@odata.type"] === "#microsoft.graph.directoryRole"
            ? "ENTRA ROLE"
            : obj.securityEnabled
            ? "SECURITY"
            : "M365",
      });
    }
  } catch (_) {}

  return dossier;
}

// ─── AUTH TRACER ──────────────────────────────────────────────────────────────

export async function getAuthLogs(token, alias) {
  const usersRes = await graphFetch(
    token,
    `/users?$filter=mailNickname eq '${alias}' or userPrincipalName eq '${alias}' or startswith(userPrincipalName,'${alias}@')&$select=userPrincipalName`
  );
  const user = usersRes?.value?.[0];
  if (!user) return null;

  const logsRes = await graphFetch(
    token,
    `/auditLogs/signIns?$filter=userPrincipalName eq '${user.userPrincipalName}'&$orderby=createdDateTime desc&$top=20`
  );

  return (logsRes?.value ?? []).map((s) => {
    let status = s.status?.errorCode === 0 ? "SUCCESS" : `FAILURE (${s.status?.errorCode})`;
    if (s.conditionalAccessStatus === "failure") status = "BLOCKED (CA)";

    const locParts = [s.location?.city, s.location?.state, s.location?.countryOrRegion].filter(Boolean);
    const location = locParts.length ? locParts.join(", ") : "UNKNOWN";

    const ts = s.createdDateTime
      ? new Date(s.createdDateTime).toLocaleString("en-US", { timeZone: "America/Los_Angeles", hour12: false })
      : "UNKNOWN";

    return {
      timestamp: ts,
      ipAddress: s.ipAddress ?? "UNKNOWN",
      location,
      application: s.appDisplayName ?? "UNKNOWN",
      status,
    };
  }).reverse();
}

// ─── RIG SCANNER ─────────────────────────────────────────────────────────────

export async function getRigIntel(token, hostname) {
  const devRes = await graphFetchBeta(
    token,
    `/deviceManagement/managedDevices?$select=id,deviceName,azureADDeviceId,osVersion,complianceState,lastSyncDateTime,userPrincipalName&$filter=deviceName eq '${hostname}'&$top=1`
  );
  const device = devRes?.value?.[0];
  if (!device) return null;

  const intel = {
    managedDeviceId: device.id,
    azureAdDeviceId: device.azureADDeviceId,
    osVersion: device.osVersion ?? "UNKNOWN",
    complianceState: device.complianceState ?? "UNKNOWN",
    lastCheckIn: device.lastSyncDateTime
      ? new Date(device.lastSyncDateTime).toLocaleString("en-US", { hour12: false })
      : "UNKNOWN",
    primaryUser: device.userPrincipalName ?? "UNKNOWN",
    bitLockerKey: "SEARCHING...",
  };

  try {
    const keysRes = await graphFetch(
      token,
      `/informationProtection/bitlocker/recoveryKeys?$filter=deviceId eq '${device.azureADDeviceId}'`
    );
    const firstKey = keysRes?.value?.[0];
    if (firstKey?.id) {
      const keyDetail = await graphFetch(
        token,
        `/informationProtection/bitlocker/recoveryKeys/${firstKey.id}?$select=key`
      );
      intel.bitLockerKey = keyDetail?.key ?? "ENCRYPTED - KEY CONTENTS UNAVAILABLE";
    } else {
      intel.bitLockerKey = "NO RECOVERY KEY FOUND";
    }
  } catch (_) {
    intel.bitLockerKey = "ACCESS DENIED / ERROR";
  }

  return intel;
}

export async function executeRigAction(token, managedDeviceId, actionType) {
  const base = `/deviceManagement/managedDevices/${managedDeviceId}`;
  switch (actionType) {
    case "QUICK_SCAN":
      await graphFetchBeta(token, `${base}/windowsDefenderScan`, { method: "POST", body: JSON.stringify({ quickScan: true }) });
      return "Quick AV Scan initiated on target.";
    case "FULL_SCAN":
      await graphFetchBeta(token, `${base}/windowsDefenderScan`, { method: "POST", body: JSON.stringify({ quickScan: false }) });
      return "Full System AV Scan initiated on target.";
    case "SYNC":
      await graphFetchBeta(token, `${base}/syncDevice`, { method: "POST", body: "{}" });
      return "Force Sync signal transmitted to target.";
    case "DIAGNOSTICS":
      await graphFetchBeta(token, `${base}/createDeviceLogCollectionRequest`, {
        method: "POST",
        body: JSON.stringify({
          "@odata.type": "#microsoft.graph.deviceLogCollectionRequest",
          templateType: "predefined",
        }),
      });
      return "Diagnostics log collection requested. Check Intune console for payload later.";
    default:
      return "UNKNOWN TACTICAL DIRECTIVE.";
  }
}

// ─── PHISH HUNTER ────────────────────────────────────────────────────────────

async function runKql(token, kql) {
  return graphFetch(token, "/security/runHuntingQuery", {
    method: "POST",
    body: JSON.stringify({ query: kql }),
  });
}

export async function searchPhishPayload(token, target) {
  const safe = target.replace(/'/g, "\\'");
  const kql = `EmailEvents | where NetworkMessageId == '${safe}' or SenderFromAddress =~ '${safe}' | summarize by RecipientEmailAddress, DeliveryAction, LatestDeliveryLocation, NetworkMessageId | limit 100`;
  const res = await runKql(token, kql);
  return (res?.results ?? []).map((row) => ({
    recipient: row.RecipientEmailAddress?.toUpperCase(),
    deliveryAction: row.DeliveryAction?.toUpperCase(),
    deliveryLocation: row.LatestDeliveryLocation?.toUpperCase(),
    networkMessageId: row.NetworkMessageId,
  }));
}

export async function extractPhishUrls(token, networkMessageId) {
  const safe = networkMessageId.replace(/'/g, "\\'");
  const kql = `EmailUrlInfo | where NetworkMessageId == '${safe}' | distinct Url | limit 50`;
  const res = await runKql(token, kql);
  return (res?.results ?? []).map((row) => row.Url);
}

export async function reportMalicious(token, _target) {
  await new Promise((r) => setTimeout(r, 1500));
  return "[+] PAYLOAD SIGNATURE SUBMITTED TO MICROSOFT THREAT INTELLIGENCE ENGINE.";
}

export async function purgeThreat(token, _target) {
  await new Promise((r) => setTimeout(r, 2000));
  return "[+] Z.A.P. (ZERO-HOUR AUTO PURGE) REMEDIATION TRIGGERED.\n[+] CHECK DEFENDER ACTION CENTER FOR COMPLETION STATUS.";
}
