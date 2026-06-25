# Security Model

## Current Model

HR Admin Platform is a local-first desktop application. It stores data locally for the current Windows user and does not expose a network service.

## What the App Does Not Do

- No cloud sync.
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
- Endpoint security controls.
- Disk encryption such as BitLocker, if enabled by the environment.
- Operational backup handling.

## Sensitive Data Guidance

The public repository must not contain real invoices, supplier lists, employee data, backups, or production exports.

Only fictional demo/sample data should be committed.

## Known Security Limitations

- Anyone with access to the Windows user profile and app data file may be able to read the local JSON data.
- There is no per-user permission model inside the app.
- Backup files are plain JSON and must be protected operationally.
- Demo data must remain fictional.

## Hardening Roadmap

Recommended future issues:

- Research local data encryption with Windows DPAPI.
- Add optional app-level PIN or Windows-integrated authentication.
- Define role-based permissions for admin vs read-only users.
- Add signed installer support.
- Add an internal data retention and backup policy.

## Magyar összefoglaló

Az app jelenleg helyi adatfájlba ment, nincs beépített bejelentkezés, RBAC vagy app-szintű titkosítás. Publikus repóba nem kerülhet valós számla, munkatársadat, backup vagy éles export. Éles környezetben a Windows profilvédelem, BitLocker és mentési szabályok adják a fő védelmi réteget.
