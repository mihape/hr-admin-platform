# Authentication and RBAC Roadmap

## Goal

Define a practical authentication and role-based access control roadmap for HR
Admin Platform without overstating the current security model.

This document supports issue #4.

## Current State

HR Admin Platform is a local-first Electron desktop app. It does not currently
include a real authentication or authorization boundary.

Current behavior:

- The app opens directly for the current Windows user.
- There is no app-level login screen.
- There is no password, PIN, Windows Hello, Active Directory, or Entra ID sign-in.
- There is no enforced role-based access control.
- The module registry contains demo user metadata and module permission labels,
  but those labels are not a security boundary in this release.
- Data protection depends on Windows profile permissions, NTFS/share
  permissions, endpoint controls, BitLocker/NAS protection, and backup handling.

## Why This Matters

The app can contain invoice, fleet, attendance, utility/rent, and company
settings data. In a single-user local setup, Windows profile protection may be
enough for a small internal tool. In a shared NAS data-file setup, more people
can potentially read or modify the same JSON file, so the access model needs to
be explicit before the app is used more broadly.

## Target User Scenarios

### Admin User

Typical responsibilities:

- manage all modules
- import invoices
- settle invoices
- edit fleet records
- edit attendance data
- edit utility/rent records
- change company/app settings
- export backups and handoff manifests
- choose local or shared data file paths

Suggested permission set:

```text
platform.view
invoices.manage
fleet.manage
attendance.manage
utilities.manage
settings.manage
exports.run
storage.configure
backup.run
```

### Read-Only User

Typical responsibilities:

- open dashboards
- search and view invoices
- view fleet/service information
- view attendance summaries
- view utility/rent balances
- export limited reports if allowed

Suggested permission set:

```text
platform.view
invoices.view
fleet.view
attendance.view
utilities.view
exports.view
```

Read-only users should not be able to:

- create, edit, import, settle, or delete records
- change settings
- switch storage paths
- restore backups
- overwrite the shared data file

### Operator / Clerk User

Optional middle role for later versions:

- create and edit operational records
- cannot change global settings
- cannot switch storage paths
- cannot restore backups
- cannot manage users/roles

Suggested permission set:

```text
platform.view
invoices.manage
fleet.manage
attendance.manage
utilities.manage
exports.run
```

## Identity Options

### Option 1: No App Login, OS/Share Permissions Only

This is the current model.

Good fit:

- one trusted user
- small internal tool
- local-only data
- tightly controlled Windows profile

Limitations:

- no per-user accountability inside the app
- no admin/read-only split
- any user who can open the data file can potentially read or copy it
- shared NAS mode depends entirely on share/NTFS permissions

Recommended status: keep as the default documented baseline until app-level
auth is implemented.

### Option 2: Local App PIN

A local PIN can reduce casual access but should not be treated as strong
enterprise authentication by itself.

Good fit:

- simple single-user protection
- preventing accidental access on an unlocked workstation

Limitations:

- PIN reset/recovery needs careful design
- PIN storage must be protected, for example via Electron `safeStorage`
- does not identify different Windows/domain users
- does not replace Windows/NAS permissions

Recommended status: possible small-business feature, but not the first RBAC
foundation.

### Option 3: Windows User Detection

The app can read the current Windows username/domain context and map it to a
local role list.

Good fit:

- small organization with known Windows accounts
- shared NAS data file with separate Windows users
- simple admin/read-only mapping without cloud sign-in

Limitations:

- username/domain mapping is not a full authentication protocol by itself
- local role mapping needs tamper-resistant storage
- shared data mode still needs NTFS/share permissions
- user/group lookup behavior must be tested on workgroup vs domain devices

Recommended status: best minimum viable direction for a local-first Windows app.

### Option 4: Active Directory / Entra ID Integration

For a more formal identity model, the app could integrate with Microsoft Entra
ID or domain identity.

High-level implementation choices:

- Microsoft identity platform sign-in using authorization code flow with PKCE
  for desktop/native apps.
- Group/role mapping from Entra ID app roles or group claims.
- Domain/AD group based authorization for on-prem environments.

Useful references:

- Microsoft identity platform authorization code flow:
  <https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow>

Good fit:

- managed business environment
- remote users
- audit requirements
- centralized joiner/mover/leaver process

Limitations:

- requires app registration and tenant configuration
- token handling and refresh behavior must be designed carefully
- local JSON file writes still need application-level authorization checks
- offline behavior must be defined
- this is a larger product/security project, not a quick documentation-only
  change

Recommended status: roadmap item after local role enforcement exists.

## Minimum Viable RBAC Roadmap

### Phase 1: Documented Permission Model

Status: proposed first implementation step.

Tasks:

- Define roles: `admin`, `operator`, `read_only`.
- Define permissions per module.
- Make module metadata use `.view` and `.manage` permissions consistently.
- Document which actions require which permission.

Acceptance criteria:

- Role/permission matrix is documented.
- No UI action is added without a permission decision.

### Phase 2: UI-Level Enforcement

Tasks:

- Hide or disable create/edit/delete/import/settle/settings actions for users
  without the required permission.
- Keep read-only users able to search, filter, and inspect records.
- Add clear "not allowed" messaging for blocked actions.

Acceptance criteria:

- Read-only role cannot trigger mutating actions from the UI.
- Admin role keeps current behavior.

Important limitation:

- UI-level enforcement is not enough by itself, because renderer-side checks can
  be bypassed. This phase is usability and workflow control, not the final
  security boundary.

### Phase 3: Storage/API-Level Enforcement

Tasks:

- Move write authorization checks into the preload/main-process storage bridge.
- Require permission metadata for mutating storage calls.
- Block unauthorized writes, imports, backup restores, and storage path changes.
- Log blocked attempts locally without storing sensitive data.

Acceptance criteria:

- Read-only users cannot mutate data even if a renderer action is triggered.
- Backup restore and storage path changes require admin permissions.

### Phase 4: Local Identity Mapping

Tasks:

- Detect the current Windows user.
- Map Windows users or groups to app roles.
- Store role mapping in protected local settings, or in an admin-managed config
  file.
- Provide a fallback admin recovery procedure.

Acceptance criteria:

- Known admin account receives admin permissions.
- Known read-only account receives read-only permissions.
- Unknown users get no access or read-only access, depending on configured
  policy.

### Phase 5: Enterprise Identity Option

Tasks:

- Evaluate Entra ID app registration.
- Choose a desktop sign-in flow.
- Define offline behavior.
- Map Entra groups/app roles to app roles.
- Document tenant setup and support process.

Acceptance criteria:

- Identity provider setup is documented.
- Token storage and logout behavior are documented.
- The app can map external identity to local app permissions.

## Role / Permission Matrix

| Permission | Admin | Operator | Read-only |
| --- | --- | --- | --- |
| `platform.view` | Yes | Yes | Yes |
| `invoices.view` | Yes | Yes | Yes |
| `invoices.manage` | Yes | Yes | No |
| `fleet.view` | Yes | Yes | Yes |
| `fleet.manage` | Yes | Yes | No |
| `attendance.view` | Yes | Yes | Yes |
| `attendance.manage` | Yes | Yes | No |
| `utilities.view` | Yes | Yes | Yes |
| `utilities.manage` | Yes | Yes | No |
| `settings.manage` | Yes | No | No |
| `exports.run` | Yes | Yes | Optional |
| `storage.configure` | Yes | No | No |
| `backup.run` | Yes | Optional | No |
| `backup.restore` | Yes | No | No |
| `roles.manage` | Yes | No | No |

## Recommended Decision

Do not add Entra ID or Active Directory integration as the first step.

Recommended next implementation path:

1. Keep the current OS/share-permission model documented as the active model.
2. Add a clear role/permission matrix.
3. Implement UI-level read-only mode.
4. Move write authorization into the Electron preload/main storage boundary.
5. Add Windows user-to-role mapping.
6. Consider Entra ID integration only after local RBAC behavior is stable.

This keeps the project realistic for a local-first Windows desktop app while
showing a credible path toward stronger enterprise access control.

## Magyar összefoglaló

Jelenleg az appban nincs valódi bejelentkezés vagy RBAC. A kódban már vannak
modul permission címkék, de ezek ebben a kiadásban még nem jelentenek biztonsági
határt. A védelem főként a Windows profil, NTFS/NAS jogosultság, BitLocker/NAS
védelem és mentési fegyelem oldalán van.

Javasolt irány: először ne Entra ID integrációval kezdjünk, hanem egy egyszerű
admin/operator/read-only szerepkör modellel. Előbb UI szinten legyen read-only
mód, utána az Electron preload/main storage rétegben is legyen tiltva minden
jogosulatlan írás. Ezután jöhet Windows user -> szerepkör mapping, és csak
utána érdemes Entra ID / Active Directory integrációban gondolkodni.
