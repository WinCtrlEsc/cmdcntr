// main.jsx
// MSAL is initialised at runtime from localStorage — no credentials in source.
// If no credentials are stored yet, we render the first-run Settings screen
// directly (outside of MsalProvider) so the operator can configure the app.
// Once saved, the page reloads and MSAL boots with the real values.

import React from "react";
import ReactDOM from "react-dom/client";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { isConfigured, buildMsalConfig } from "./authConfig";
import App from "./App";
import FirstRunSetup from "./modules/SettingsModule";
import "./index.css";

function Root() {
  if (!isConfigured()) {
    // No credentials stored — show the setup screen standalone, no MSAL needed
    return (
      <div className="app-shell" style={{ alignItems: "stretch" }}>
        <main className="screen-area" style={{ margin: 0, flex: 1 }}>
          <div className="scan-sweep" />
          <div className="screen-content">
            <FirstRunSetup
              onSaved={() => {
                // Reload so MSAL boots with the newly stored values
                window.location.reload();
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // Credentials present — build the MSAL instance from localStorage values
  const msalInstance = new PublicClientApplication(buildMsalConfig());

  return (
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
