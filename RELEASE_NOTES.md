# HR Admin Platform 0.3.4

## Highlights

- Uses release asset filenames that match `CHECKSUMS.txt`.
- Validates the GitHub Actions release path after fixing the installer build publish behavior.
- Keeps installer publishing in the dedicated GitHub Release workflow step instead of `electron-builder` auto-publishing.
- Adds portfolio workflow documentation, CI troubleshooting notes, and local encryption research.
- Keeps the 0.3.x application behavior: invoice search scroll fix, cash payment handling, and shared NAS/network JSON data file mode.

## Recommended release asset

Upload this as the main GitHub Release installer:

`release-assets/HR.Admin.Platform.Setup.0.3.4.exe`

It starts with an empty local database on a fresh machine. Existing users can switch to a NAS/shared data file from Settings.

## Demo asset

Optional internal testing asset:

`release-assets/HR.Admin.Platform.Setup.0.3.4.Demo.exe`

This build starts with fictional sample data. Do not use it as the default public download.

## Summary

Local-first Windows desktop admin application for invoices, fleet records, attendance sheets, and utilities/rent settlements. Data can be stored locally or pointed to a NAS/shared JSON file; no backend server is required.

## Installation

1. Download `HR.Admin.Platform.Setup.0.3.4.exe`.
2. Run the installer.
3. Choose the installation directory.
4. Launch the app at the end of setup or from the Start menu.

## Existing installation note

Reinstalling the app may keep the existing local user data file. This is intentional to avoid accidental data loss.

## Verification

SHA256 checksums are available in `CHECKSUMS.txt`.

## Magyar összefoglaló

Windows desktop admin alkalmazás számlák, flotta, jelenlét és rezsi/albérlet nyilvántartására. Az adatok alapból helyben tárolódnak, de Beállításokból közös NAS/hálózati JSON adatfájl is választható. A default release üresen indul, a demo telepítő csak fiktív mintaadatokkal való teszteléshez készült.
