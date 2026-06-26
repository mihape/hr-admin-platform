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

## Hardening Roadmap

Recommended future issues:

- Research local data encryption with Windows DPAPI.
- Add optional app-level PIN or Windows-integrated authentication.
- Define role-based permissions for admin vs read-only users.
- Add signed installer support.
- Add an internal data retention and backup policy.

## Magyar összefoglaló

Az app JSON adatfájlba ment, amely lehet helyi Windows profilban vagy opcionálisan NAS/hálózati megosztáson. Nincs beépített bejelentkezés, RBAC vagy app-szintű titkosítás. Publikus repóba nem kerülhet valós számla, munkatársadat, backup vagy éles export. Éles környezetben a Windows/NAS jogosultságok, BitLocker vagy NAS védelem és mentési szabályok adják a fő védelmi réteget.
