# HR Admin Platform 0.3.2

## Highlights

- Fixed invoice search scroll jumping by updating only the invoice results table while typing.
- Keeps the cash payment handling from 0.3.1: same-day due date and automatic `Kiegyenlítve` status.
- Includes the shared NAS/network JSON data file mode from 0.3.0.

## Recommended release asset

Upload this as the main GitHub Release installer:

`release-assets/HR Admin Platform Setup 0.3.2.exe`

It starts with an empty local database on a fresh machine. Existing users can switch to a NAS/shared data file from Settings.

## Demo asset

Optional internal testing asset:

`release-assets/HR Admin Platform Setup 0.3.2 Demo.exe`

This build starts with fictional sample data. Do not use it as the default public download.

## Summary

Local-first Windows desktop admin application for invoices, fleet records, attendance sheets, and utilities/rent settlements. Data can be stored locally or pointed to a NAS/shared JSON file; no backend server is required.

## Installation

1. Download `HR Admin Platform Setup 0.3.2.exe`.
2. Run the installer.
3. Choose the installation directory.
4. Launch the app at the end of setup or from the Start menu.

## Existing installation note

Reinstalling the app may keep the existing local user data file. This is intentional to avoid accidental data loss.

## Verification

SHA256 checksums are available in `CHECKSUMS.txt`.

## Magyar összefoglaló

Windows desktop admin alkalmazás számlák, flotta, jelenlét és rezsi/albérlet nyilvántartására. Az adatok alapból helyben tárolódnak, de Beállításokból közös NAS/hálózati JSON adatfájl is választható. A default release üresen indul, a demo telepítő csak fiktív mintaadatokkal való teszteléshez készült.
