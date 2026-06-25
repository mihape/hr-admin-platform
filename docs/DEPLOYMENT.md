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
HR Admin Platform Setup 0.2.0.exe
```

The installer is an NSIS assisted installer. It is not a one-click silent installer by default. The user can select the installation directory and launch the app after setup.

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

For managed environments, the installer can be distributed through Intune, SCCM, GPO startup scripts, or other endpoint management tooling. Silent deployment has not been finalized in this release and should be tested before production rollout.

## Uninstall Notes

Uninstalling the app may remove program files but should not be treated as a guaranteed user data wipe. Local app data can remain in the Windows user profile.

If a clean reset is required:

1. Export a backup if needed.
2. Uninstall the app.
3. Remove the app's local user data directory.
4. Reinstall the release build.

## Network and Firewall Requirements

The app is local-only.

- No backend server.
- No database server.
- No inbound network port.
- No firewall exception required.
- No cloud synchronization.

## Operational Checklist

- Confirm the installer source and checksum.
- Install using the release build for real users.
- Use the demo build only for testing or presentations.
- Verify the local data path.
- Export a backup before imports and before upgrades.
- Document who owns support and backup responsibility.

## Magyar összefoglaló

Az alkalmazás helyi Windows desktop appként települ, nem igényel szervert vagy tűzfalszabályt. Éles használatra a release telepítő való, amely friss gépen üres adatbázissal indul. A demo telepítő csak teszteléshez készült fiktív adatokkal.
