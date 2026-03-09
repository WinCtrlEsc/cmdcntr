// useGraph.js
// Wraps MSAL token acquisition so any component can call Graph APIs.

import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";
import { getMe } from "../services/GraphService";

export function useGraph() {
  const { instance, accounts } = useMsal();
  const [currentUser, setCurrentUser] = useState(null);

  const getToken = useCallback(async () => {
    const account = accounts[0];
    if (!account) throw new Error("No authenticated account.");
    try {
      const result = await instance.acquireTokenSilent({ ...loginRequest, account });
      return result.accessToken;
    } catch (e) {
      if (e instanceof InteractionRequiredAuthError) {
        // Refresh token expired or consent required — redirect to re-authenticate
        await instance.acquireTokenRedirect({ ...loginRequest, account });
        // acquireTokenRedirect navigates away; execution stops here
      }
      throw e;
    }
  }, [instance, accounts]);

  const loadCurrentUser = useCallback(async () => {
    const token = await getToken();
    const me = await getMe(token);
    setCurrentUser({ id: me.id, email: me.userPrincipalName, displayName: me.displayName });
    return { id: me.id, email: me.userPrincipalName, displayName: me.displayName };
  }, [getToken]);

  return { getToken, currentUser, loadCurrentUser };
}
