# Architecture

## Overview

HR Admin Platform is an Electron desktop application with a static frontend and a small native storage bridge.

```text
Electron main process
  -> BrowserWindow
  -> preload bridge
  -> renderer modules
  -> local JSON storage
```

## Runtime Components

- **Electron main process**: creates the desktop window and manages native storage IPC.
- **Preload script**: exposes a small `HRAdminNativeStorage` API to the renderer.
- **Renderer app**: static HTML/CSS/JavaScript modules.
- **Module registry**: registers invoice, fleet, attendance, utilities, and settings modules.
- **Local storage file**: JSON data file stored under Electron's user data path.

## Storage Flow

In the installed Windows app:

1. Renderer calls `window.HRPlatform.storage`.
2. Storage driver uses `window.HRAdminNativeStorage`.
3. Preload forwards calls to Electron IPC.
4. Main process reads/writes `hr-admin-data.json`.

In browser-only development:

1. Renderer falls back to `localStorage`.
2. This is only for development/testing, not the preferred production path.

## Build Modes

The build mode is written by:

```text
scripts/write-build-config.js
```

Release mode:

```bash
npm run build:win
```

- `seedDemoData: false`
- Fresh machine starts empty.

Demo mode:

```bash
npm run build:win:demo
```

- `seedDemoData: true`
- Fictional sample data is seeded for testing.

## Packaging

The Windows installer is built with electron-builder and NSIS.

Important installer settings:

- `oneClick: false`
- `allowToChangeInstallationDirectory: true`
- desktop shortcut enabled
- Start menu shortcut enabled

## Network Architecture

There is no client-server architecture in this release.

- No backend API.
- No database service.
- No network port.
- No router/firewall dependency.

## Magyar összefoglaló

Az app Electron alapú, statikus frontenddel és preloadon keresztüli helyi JSON adatmentéssel. Release módban üresen indul, demo módban fiktív mintaadatokat tölt. Jelenleg nincs szerveres komponens vagy hálózati kapcsolat.
