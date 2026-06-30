# Deployment Guide

## Purpose

This guide describes how to deploy HR Admin Platform as a local Windows desktop application in a small business or lab environment.

## Supported Environment

- Windows 10 or Windows 11
- x64 desktop environment
- Standard user installation by default
- No server requirement
- No inbound firewall rule required

## Installer

Use the release installer:

```text
HR.Admin.Platform.Setup.0.3.5.exe
```

The installer is an NSIS assisted installer. It is not a one-click silent installer by default. The user can select the installation directory and launch the app after setup.

The installer is built with electron-builder's NSIS target. NSIS supports silent
execution with `/S`, and a custom installation directory can be passed with
`/D=...` as the final command-line argument.

References:

- NSIS common command-line options: <https://nsis.sourceforge.io/Docs/Chapter3.html>
- electron-builder NSIS target: <https://www.electron.build/nsis.html>

## Release vs Demo Build

- **Release build**: starts with an empty local database on a fresh machine.
- **Demo build**: starts with fictional sample data for testing and screenshots.

Do not use the demo build as the default public download.

## Data Location

In the installed Electron app, data is stored in the current Windows user's application data directory through Electron's `app.getPath("userData")`.

The app creates a local JSON database file named:

```text
hr-admin-data.json
```

The exact path is visible inside the app under settings/storage information.

## Shared NAS Data File

The settings screen can switch the app from the local data file to a shared JSON data file on a network share or NAS.

Recommended setup:

1. Create a dedicated shared folder on the NAS.
2. Give write access only to the Windows users who should edit HR Admin data.
3. Open **Settings / Data and handoff** in the app. In the Hungarian UI this is
   **Beállítások / Adatok és átadás**.
4. Choose **Select shared data file** and point it to a path such as:

```text
\\nas-name\shared-folder\hr-admin-data.json
```

If the selected file does not exist, the app creates it from the current active data file. If the selected file already exists, the app validates that it is an HR Admin JSON data file and starts using it after reload.

Operational notes:

- The app uses a short `.lock` file during writes to reduce simultaneous write collisions.
- This is still file-based sharing, not a multi-user database server.
- Avoid having two users edit the same records at the exact same time.
- Keep regular backups of the shared JSON file.
- If the NAS path is unavailable, the app may not be able to read or save data until the path is restored or local mode is selected again.

## Backup and Restore

The app includes backup and restore actions.

Recommended operating procedure:

1. Export a backup before large imports or updates.
2. Store backups outside the user's local profile if the data matters operationally.
3. Test restore on a non-production profile before relying on it.

## Update Flow

For a small environment:

1. Build or download the new installer.
2. Notify users to close the app.
3. Run the new installer over the existing installation.
4. Verify that the existing local data file remains available.
5. Export a fresh backup after verification.

For managed environments, the installer can be distributed through Intune, SCCM, GPO user logon scripts, or other endpoint management tooling that can run in the logged-on user's context.

## Silent Deployment

Silent deployment is suitable for managed Windows endpoints after it has been
smoke-tested on a disposable workstation or VM.

### Silent Install

Default current-user install:

```powershell
.\HR.Admin.Platform.Setup.0.3.5.exe /S
```

Custom install directory:

```powershell
.\HR.Admin.Platform.Setup.0.3.5.exe /S /D=C:\Apps\HR Admin Platform
```

Important notes:

- `/S` is case-sensitive in NSIS.
- `/D=...` must be the final argument.
- Do not quote the `/D=...` value even when the path contains spaces.
- The current build is configured as a standard user install by default, not a
  per-machine deployment.
- Silent install does not configure the shared NAS data file automatically.
  Users still need to choose the shared data file in Settings, unless a future
  managed configuration feature is added.

### Silent Uninstall

After installation, the NSIS uninstaller is normally located in the installation
directory as `Uninstall HR Admin Platform.exe`.

Example:

```powershell
& "$env:LOCALAPPDATA\Programs\HR Admin Platform\Uninstall HR Admin Platform.exe" /S
```

If a custom install directory was used:

```powershell
& "C:\Apps\HR Admin Platform\Uninstall HR Admin Platform.exe" /S _?=C:\Apps\HR Admin Platform
```

Important notes:

- `/S` runs the uninstaller silently.
- `_?=...` can be used with NSIS uninstallers to specify the installed
  directory. Use it only when the deployment tool needs to target a known custom
  installation path.
- Silent uninstall removes application files, not necessarily user data in the
  Windows profile.

### Intune Win32 App Notes

Recommended package source:

- `HR.Admin.Platform.Setup.0.3.5.exe`
- optional `CHECKSUMS.txt` kept with the release evidence

Required Intune assignment setting:

- **Install behavior**: `User`

Do not deploy this package with Intune's `System` install behavior. The current
installer is a per-user NSIS installer. In system context, `%LOCALAPPDATA%`
resolves to the management/System profile, so the app can be installed and
detected outside the intended employee profile.

Example install command:

```text
HR.Admin.Platform.Setup.0.3.5.exe /S
```

Example uninstall command:

```text
"%LOCALAPPDATA%\Programs\HR Admin Platform\Uninstall HR Admin Platform.exe" /S
```

Recommended detection script:

```powershell
$appPath = Join-Path $env:LOCALAPPDATA "Programs\HR Admin Platform\HR Admin Platform.exe"
if (Test-Path $appPath) {
  exit 0
}
exit 1
```

Alternative file detection rule:

- File exists:
  `%LOCALAPPDATA%\Programs\HR Admin Platform\HR Admin Platform.exe`

Alternative file detection:

- File exists:
  `%LOCALAPPDATA%\Programs\HR Admin Platform\Uninstall HR Admin Platform.exe`

Use a pilot group first. Confirm that the app starts, shows the expected version
in Settings, and can read/write its local or shared data file.

### SCCM / Configuration Manager Notes

Deploy this installer in the logged-on user context unless the package is later
changed to a per-machine installer. System-context deployment can install the app
under the service account profile instead of the employee profile.

Example install command:

```text
HR.Admin.Platform.Setup.0.3.5.exe /S
```

Example uninstall command:

```text
"%LOCALAPPDATA%\Programs\HR Admin Platform\Uninstall HR Admin Platform.exe" /S
```

Suggested detection method:

- Check for `HR Admin Platform.exe` under the expected install directory.
- For custom paths, align the detection rule with the `/D=...` install path.

Because this is a current-user style Electron install, deploy in user context
unless the installer configuration is changed to a per-machine model in a future
release.

### GPO Logon Script Notes

For small environments without Intune or SCCM, a logon script can install the
app if the executable is missing.

Use a **user logon script**, not a computer startup script. Computer startup
scripts run before user logon and normally execute as LocalSystem. With this
per-user installer, that would resolve `%LOCALAPPDATA%` to the system profile
instead of each employee's profile.

Example PowerShell sketch:

```powershell
$installPath = Join-Path $env:LOCALAPPDATA "Programs\HR Admin Platform\HR Admin Platform.exe"
$installer = "\\server\software\HR.Admin.Platform.Setup.0.3.5.exe"

if (-not (Test-Path $installPath)) {
  Start-Process -FilePath $installer -ArgumentList "/S" -Wait
}
```

Use share permissions so standard users can read the installer but cannot
modify release files.

## Managed Update Backup Requirements

Before broad silent deployment or upgrade:

1. Confirm where each workstation stores data:
   - local user data file
   - shared NAS JSON file
2. Export a backup from the app for any workstation with local-only business
   data.
3. Back up the shared NAS JSON file if shared mode is active.
4. Confirm no user is actively editing data during the upgrade window.
5. Keep the previous installer available for rollback testing.

Silent install updates application files. It should not be treated as a backup,
migration, or data cleanup mechanism.

## Silent Deployment Test Plan

Run this on a disposable Windows test user/profile before production rollout:

1. Download `HR.Admin.Platform.Setup.0.3.5.exe` and `CHECKSUMS.txt`.
2. Verify the installer hash against `CHECKSUMS.txt`.
3. Run:

   ```powershell
   .\HR.Admin.Platform.Setup.0.3.5.exe /S
   ```

4. Confirm this file exists:

   ```text
   %LOCALAPPDATA%\Programs\HR Admin Platform\HR Admin Platform.exe
   ```

5. Launch the app and confirm Settings shows version `0.3.5`.
6. Create or restore a non-production test backup.
7. Confirm data persists after closing and reopening the app.
8. Run silent uninstall:

   ```powershell
   & "$env:LOCALAPPDATA\Programs\HR Admin Platform\Uninstall HR Admin Platform.exe" /S
   ```

9. Confirm program files are removed.
10. Confirm whether user data remains in the app data directory, and document
    the chosen cleanup policy.

This repository has validated the documented flags against NSIS/electron-builder
behavior and CI-built installers. A live endpoint install/uninstall smoke test
should be recorded before using silent deployment in production.

## Uninstall Notes

Uninstalling the app may remove program files but should not be treated as a guaranteed user data wipe. Local app data can remain in the Windows user profile.

If a clean reset is required:

1. Export a backup if needed.
2. Uninstall the app.
3. Remove the app's local user data directory.
4. Reinstall the release build.

## Network and Firewall Requirements

The app is local-first.

- No backend server.
- No database server.
- No inbound network port.
- No firewall exception required.
- Optional outbound file access to a configured NAS/share path.
- No cloud synchronization unless the chosen folder is managed by a third-party sync client.

## Operational Checklist

- Confirm the installer source and checksum.
- Install using the release build for real users.
- Use the demo build only for testing or presentations.
- For managed deployment, pilot `/S` install and uninstall on a disposable
  Windows profile before broad rollout.
- Verify the local data path.
- For shared mode, verify the NAS path and write permission from every workstation.
- Export a backup before imports and before upgrades.
- Document who owns support and backup responsibility.

## Magyar összefoglaló

Az alkalmazás helyi Windows desktop appként települ, nem igényel szervert vagy tűzfalszabályt. A telepítő NSIS alapú, ezért támogatja a `/S` csendes telepítést, és a dokumentáció tartalmaz Intune/SCCM/GPO jellegű mintaparancsokat is. A Beállításokban választható közös NAS/hálózati JSON adatfájl. Ez nem teljes többfelhasználós adatbázis, ezért egyszerre több aktív szerkesztőnél továbbra is óvatosság és rendszeres mentés szükséges. Éles csendes telepítés előtt külön tesztgépen kell ellenőrizni az install, uninstall, verziókijelzés és adatmegmaradás folyamatát.
