# Local Data Encryption Research

## Goal

Evaluate whether HR Admin Platform should add optional encryption-at-rest for
the local JSON data file, especially for Windows desktop use.

This document supports issue #5.

## Sources Checked

- Microsoft DPAPI `CryptProtectData` documentation:
  <https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata>
- Electron `safeStorage` documentation:
  <https://www.electronjs.org/docs/latest/api/safe-storage>

## Current Risk

The application stores business data in a local JSON file. That file can include
invoice metadata, fleet records, attendance-related data, utility/rent records,
and local settings.

Current protection depends on the operating environment:

- Windows user profile permissions
- NTFS permissions
- NAS/share permissions for shared data mode
- endpoint protection
- BitLocker or NAS volume encryption, if enabled
- backup handling discipline

The app does not currently encrypt the JSON payload itself.

## DPAPI / safeStorage Feasibility

Electron provides `safeStorage`, a main-process API for encrypting strings with
the operating system's cryptography provider. On Windows, Electron uses DPAPI.

Microsoft DPAPI is usually scoped to the Windows user credentials and the same
computer. Electron documents the same practical security model: content is
protected from other users on the same machine, but not from other apps running
as the same Windows user.

This makes DPAPI/safeStorage a good fit for:

- optional protection of a single user's local app data file
- reducing accidental exposure if another Windows user can browse the machine
- encrypting selected sensitive fields or the full local JSON payload

It is a poor fit for:

- a shared NAS JSON file that multiple colleagues must open from different
  Windows accounts
- moving backups between users or computers without a planned export/restore
  flow
- replacing Windows/NAS permissions, BitLocker, endpoint controls, or backups

## Recommended Direction

Add optional local encryption only for the default local data file first.

Recommended first implementation:

- Scope: local data path only.
- Provider: Electron `safeStorage`.
- Mode: encrypt the full JSON payload instead of individual fields.
- Storage format: keep a small unencrypted wrapper with metadata and a base64
  encrypted payload.
- UI: add a setting such as "Encrypt local data for this Windows user".
- Guardrail: disable or warn against this mode when the active data path is a
  NAS/shared file.

Example wrapper shape:

```json
{
  "schemaVersion": 2,
  "encrypted": true,
  "provider": "electron.safeStorage",
  "scope": "current-windows-user",
  "payload": "base64-ciphertext"
}
```

## Backup and Restore Implications

User-scoped encryption changes backup handling.

Important implications:

- An encrypted backup may only be readable by the same Windows user on the same
  machine, depending on the Windows profile/domain environment.
- A colleague may not be able to restore another user's encrypted backup.
- A Windows reinstall, profile change, or machine replacement may make encrypted
  data unrecoverable unless a decrypted export exists.
- Support documentation must clearly separate "encrypted app backup" from
  "plain JSON export for migration".

Recommended backup model:

- Keep normal automatic backups in the same encrypted format as the active data
  file.
- Add an explicit "Export decrypted backup" action with a strong warning.
- Document that decrypted exports must be stored securely and deleted after
  migration.
- Test restore before enabling this for live business data.

## Shared NAS Data Mode

For the shared NAS data file mode, do not use user-scoped DPAPI on the shared
JSON file in the first version. It would likely prevent other authorized users
from reading the same file.

Recommended controls for shared mode:

- restrict share permissions to the business group
- restrict NTFS permissions on the NAS/share
- enable NAS volume protection where available
- enable workstation BitLocker
- keep versioned backups
- keep the app's short write-lock behavior, but treat it as coordination, not
  database-grade transaction isolation

Future shared encryption options would need a different design, such as an
organization-managed shared key, Windows certificate-based encryption, or moving
to a small server/database model.

## Implementation Plan

1. Add storage format detection.
   - Plain JSON remains supported.
   - Encrypted wrapper JSON is detected and decrypted in the main process.

2. Add safeStorage service in Electron main/preload.
   - Check encryption availability after app ready.
   - Encrypt/decrypt the full serialized JSON string.
   - Return clear errors for unavailable encryption or failed decryption.

3. Add migration flow.
   - Create a plain backup before first encryption.
   - Encrypt the current local data file.
   - Store metadata showing provider and scope.

4. Add settings UI.
   - Show current data path mode: local or shared.
   - Allow encryption toggle only for local mode.
   - Explain restore limitations briefly in Hungarian UI copy.

5. Add restore/export behavior.
   - Restore encrypted backups through the app.
   - Add explicit decrypted export for machine migration.
   - Warn that decrypted exports contain readable business data.

6. Add test coverage.
   - round-trip encrypt/decrypt
   - load legacy plain JSON
   - fail gracefully on corrupted encrypted payload
   - reject encryption toggle in shared NAS mode
   - verify backup/export behavior manually on Windows

## Decision

DPAPI via Electron `safeStorage` is viable for optional local data encryption.
It should not be the first security control for the shared NAS file mode.

Recommended next issue:

```text
[Feature] Add optional local data encryption with Electron safeStorage
```

## Magyar összefoglaló

A DPAPI/Electron safeStorage jó irány lehet a helyi, egy felhasználóhoz kötött
adatfájl titkosítására. NAS-os közös adatfájlnál viszont nem ez az első jó
megoldás, mert a kolléganő másik Windows felhasználóként valószínűleg nem
tudná visszafejteni ugyanazt az adatfájlt.

Javaslat: először opcionális helyi titkosítás készüljön, a közös NAS módnál
pedig maradjon a Windows/NAS jogosultság, BitLocker/NAS védelem és a mentési
rend. A titkosított backupokhoz külön restore/export szabály kell, mert gépcsere
vagy profilcsere esetén könnyű kizárni magunkat a saját adatból.
