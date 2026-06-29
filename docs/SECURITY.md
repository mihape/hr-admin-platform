# Security Model

## Current Model

HR Admin Platform is a local-first desktop application. It stores data in a JSON file and does not expose a network service. The data file can optionally be placed on a NAS or Windows network share.

## What the App Does Not Do

- No built-in cloud sync.
- No external API calls for business data.
- No open listening ports.
- No built-in user login.
- No Active Directory or Entra ID integration.
- No role-based access control in this release.
- No encryption-at-rest inside the application layer.

## Data Protection Boundary

Data protection currently depends on:

- Windows user account access.
- NTFS permissions on the user profile.
- Share and NTFS permissions if a NAS/shared file path is used.
- Endpoint security controls.
- Disk encryption such as BitLocker, if enabled by the environment.
- NAS volume protection and backup policy for shared storage.
- Operational backup handling.

## Sensitive Data Guidance

The public repository must not contain real invoices, supplier lists, employee data, backups, or production exports.

Only fictional demo/sample data should be committed.

## Known Security Limitations

- Anyone with access to the Windows user profile and app data file may be able to read the local JSON data.
- Anyone with access to the configured NAS/shared JSON file may be able to read or copy the shared data.
- There is no per-user permission model inside the app.
- Backup files are plain JSON and must be protected operationally.
- The shared data file mode uses a short write lock, but it is not a full transactional multi-user database.
- Demo data must remain fictional.

## Encryption Research

Optional Windows local data encryption has been researched in
[ENCRYPTION_RESEARCH.md](ENCRYPTION_RESEARCH.md).

The recommended direction is to use Electron `safeStorage` / Windows DPAPI for
optional single-user local data encryption only. This is not recommended as the
first solution for the shared NAS data file mode, because user-scoped DPAPI can
prevent another authorized Windows user from decrypting the same shared file.

## Authentication and RBAC Roadmap

Authentication and role-based access control options have been documented in
[AUTH_RBAC_ROADMAP.md](AUTH_RBAC_ROADMAP.md).

The recommended direction is to keep the current OS/share-permission model as
the documented baseline, then add a minimum viable local RBAC model before
considering Active Directory or Entra ID integration.

## Hardening Roadmap

Recommended future issues:

- Add optional local data encryption with Electron `safeStorage`.
- Add UI-level read-only mode.
- Add storage/API-level write authorization in the Electron main/preload layer.
- Add Windows user-to-role mapping.
- Evaluate Entra ID or Active Directory integration after local RBAC is stable.
- Add signed installer support.
- Add an internal data retention and backup policy.

## Magyar összefoglaló

Az app JSON adatfájlba ment, amely lehet helyi Windows profilban vagy opcionálisan NAS/hálózati megosztáson. Nincs beépített bejelentkezés vagy RBAC. A helyi adattitkosítás kutatása elkészült: DPAPI/Electron safeStorage jó lehet egyfelhasználós helyi adatfájlhoz, de nem első megoldás a közös NAS fájlhoz. Az auth/RBAC roadmap szerint először egyszerű admin/operator/read-only modell, majd storage szintű írásvédelem, később Windows user mapping és csak utána Entra ID / Active Directory integráció javasolt. Publikus repóba nem kerülhet valós számla, munkatársadat, backup vagy éles export. Éles környezetben a Windows/NAS jogosultságok, BitLocker vagy NAS védelem és mentési szabályok adják a fő védelmi réteget.
