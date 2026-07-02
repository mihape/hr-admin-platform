# HR Admin Platform 0.3.6

## Highlights

- Adds an invoice reporting panel for the visible/filtered list: gross total, open total, paid total, VAT, overdue count, category split, and payment method split.
- Exports the visible/filtered invoice list with filter scope, status group, overdue flag, and days until due date.
- Extends the daily overview with upcoming open invoice due dates within 7 days.
- Moves data and handoff actions from the overview into Settings / Data and handoff.
- Polishes fleet and utilities/rent overview panels for deadline and open-balance work.
- Fixes local date handling for utilities/rent due dates in Hungarian time zones.
- Allows decimal values in invoice, fleet, and utilities/rent numeric fields with Hungarian comma or dot input.
- Preserves Hungarian dot-grouped thousands for money fields while keeping three-decimal meter readings and unit rates intact.
- Refreshes user documentation and deployment notes for the new reporting, export, and settings layout.

## Recommended release asset

Upload this as the main GitHub Release installer:

`release-assets/HR.Admin.Platform.Setup.0.3.6.exe`

It starts with an empty local database on a fresh machine. Existing users can switch to a NAS/shared data file from Settings.

## Demo asset

Optional internal testing asset:

`release-assets/HR.Admin.Platform.Setup.0.3.6.Demo.exe`

This build starts with fictional sample data. Do not use it as the default public download.

## Summary

Local-first Windows desktop admin application for invoices, fleet records, attendance sheets, and utilities/rent settlements. Data can be stored locally or pointed to a NAS/shared JSON file; no backend server is required.

## Installation

1. Download `HR.Admin.Platform.Setup.0.3.6.exe`.
2. Run the installer.
3. Choose the installation directory.
4. Launch the app at the end of setup or from the Start menu.

## Existing installation note

Reinstalling the app may keep the existing local user data file. This is intentional to avoid accidental data loss.

## Verification

SHA256 checksums are available in `CHECKSUMS.txt`.

## Magyar összefoglaló

Windows desktop admin alkalmazás számlák, flotta, jelenlét és rezsi/albérlet nyilvántartására. Az adatok alapból helyben tárolódnak, de Beállításokból közös NAS/hálózati JSON adatfájl is választható. A default release üresen indul, a demo telepítő csak fiktív mintaadatokkal való teszteléshez készült.
