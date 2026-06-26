# Architecture

## Overview

HR Admin Platform is an Electron desktop application with a static frontend and a small native storage bridge.

```text
Electron main process
  -> BrowserWindow
  -> preload bridge
  -> renderer modules
  -> local or shared JSON storage
```

## Runtime Components

- **Electron main process**: creates the desktop window and manages native storage IPC.
- **Preload script**: exposes a small `HRAdminNativeStorage` API to the renderer.
- **Renderer app**: static HTML/CSS/JavaScript modules.
- **Module registry**: registers invoice, fleet, attendance, utilities, and settings modules.
- **Storage file**: JSON data file stored under Electron's user data path or an explicitly selected shared path.

## Storage Flow

In the installed Windows app:

1. Renderer calls `window.HRPlatform.storage`.
2. Storage driver uses `window.HRAdminNativeStorage`.
3. Preload forwards calls to Electron IPC.
4. Main process reads/writes `hr-admin-data.json`.
5. If configured, the same storage bridge points to a NAS/shared file path stored in `hr-admin-storage-config.json`.

Writes use a short `.lock` file next to the active JSON file. This reduces simultaneous write collisions in shared-file mode, but it does not provide full database transactions or record-level conflict resolution.

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
- Optional SMB/NAS file share path for shared data file mode.

## Magyar összefoglaló

Az app Electron alapú, statikus frontenddel és preloadon keresztüli JSON adatmentéssel. Az adatfájl alapból helyi, de Beállításokból közös NAS/hálózati fájlra is átváltható. Release módban üresen indul, demo módban fiktív mintaadatokat tölt. Jelenleg nincs szerveres komponens vagy adatbázis-szolgáltatás.
