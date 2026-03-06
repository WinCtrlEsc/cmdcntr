# Command Center OS v3.0 — PWA

> Security Operations Command Center · React + Vite + MSAL · Installable on iPhone & Android

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+** (https://nodejs.org)

### 2. Install & run
```bash
cd command-center
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Configure your credentials (first run)

**No credentials are ever stored in source code.** On first launch, the app will show the **Settings** screen automatically. Enter your two values there:

- **Entra Application (Client) ID** — from Azure Portal → App Registrations → your app → Overview
- **Entra Directory (Tenant) ID** — from Azure Portal → Entra ID → Overview

Click **[ SAVE TO DEVICE ]**. The app reloads and boots MSAL using those stored values.

To update or wipe the credentials later, open **[ SETTINGS ]** from the sidebar at any time.

> ⚠️ `authConfig.js` contains **no Client ID or Tenant ID**. It is safe to commit to GitHub as-is.

### 4. Update your Entra App Registration redirect URIs

In **Azure Portal → Entra ID → App Registrations → your app → Authentication**:

- Add a **Single-page application** redirect URI: `http://localhost:5173`
- For production/installed PWA, also add your deployed URL (e.g. `https://your-server/`)
- Enable **ID tokens** and **Access tokens** under Implicit grant

---

## 📱 Installing on Mobile

### iPhone (Safari)
1. Open the app URL in **Safari**
2. Tap the **Share** button (bottom bar)
3. Tap **"Add to Home Screen"**
4. Tap **Add** — the app installs with a standalone icon

### Android (Chrome)
1. Open the app URL in **Chrome**
2. Tap the **three-dot menu**
3. Tap **"Add to Home Screen"** or **"Install App"**
4. Tap **Install**

> **Note:** MSAL uses a redirect-based auth flow which works correctly in both installed PWA mode and the browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

Serve the `dist/` folder from any HTTPS web server. The PWA service worker will cache assets for offline resilience.

---

## 🔌 Project Structure

```
src/
├── authConfig.js          ← MSAL + Entra ID config (edit this first)
├── main.jsx               ← Entry point, MsalProvider wrapper
├── App.jsx                ← Shell: sidebar nav + module router + auth gate
├── index.css              ← Full cyberpunk design system
├── hooks/
│   └── useGraph.js        ← Token acquisition hook
├── services/
│   └── GraphService.js    ← All Graph API calls (direct port of GraphService.cs)
└── modules/
    ├── PimModule.jsx       ← PIM role activation ✅ FULLY WIRED
    ├── StalkerModule.jsx   ← Security incidents ✅ FULLY WIRED
    ├── PassPullerModule.jsx   ← LAPS password retrieval ✅ FULLY WIRED
    ├── DossierModule.jsx      ← User identity lookup ✅ FULLY WIRED
    ├── AuthTracerModule.jsx   ← Sign-in log trace ✅ FULLY WIRED
    ├── RigScannerModule.jsx   ← Intune device + actions ✅ FULLY WIRED
    └── PhishHunterModule.jsx  ← KQL hunting + email actions ✅ FULLY WIRED
```

---

## 🔐 Permissions

All scopes are identical to the original desktop app. No changes needed in your app registration scopes:

| Scope | Used By |
|---|---|
| `SecurityIncident.ReadWrite.All` | Graph Stalker |
| `RoleManagement.ReadWrite.Directory` | PIM Commander |
| `RoleAssignmentSchedule.ReadWrite.Directory` | PIM Commander |
| `SecurityEvents.Read.All` | Graph Stalker |
| `User.Read.All` | Dossier, Auth Tracer |
| `Directory.Read.All` | Dossier, Pass Puller |
| `Device.Read.All` | Pass Puller |
| `DeviceLocalCredential.Read.All` | Pass Puller |
| `DeviceManagementManagedDevices.ReadWrite.All` | Rig Scanner |
| `BitLockerKey.Read.All` | Rig Scanner |
| `AuditLog.Read.All` | Auth Tracer |
| `ThreatHunting.Read.All` | Phish Hunter |
| `ThreatSubmission.ReadWrite.All` | Phish Hunter |

---

## 🗂️ Port Notes vs Original C# App

| C# Pattern | Web Equivalent |
|---|---|
| `InteractiveBrowserCredential` | `@azure/msal-browser` redirect flow |
| `config.ini` Base64 decode | `authConfig.js` plain values |
| `GraphServiceClient` SDK | `fetch()` to Graph REST API |
| `DispatcherTimer` (60s) | `setInterval` in `useEffect` |
| `BitmapImage` from stream | `URL.createObjectURL(blob)` |
| `TimeZoneInfo.FindById("Pacific")` | `toLocaleString({ timeZone: "America/Los_Angeles" })` |
| `AppDomain.CurrentDomain.BaseDirectory` | Not needed — config is in JS |

---

## ⚙️ Entra App Registration Checklist

- [ ] Platform: **Single-page application (SPA)** — not "Web" or "Mobile"
- [ ] Redirect URI added for `http://localhost:5173` (dev) and your production URL
- [ ] All scopes listed above granted and **admin-consented**
- [ ] ID tokens & Access tokens enabled under Implicit grant settings
