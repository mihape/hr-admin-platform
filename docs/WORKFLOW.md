# Development Workflow

## Purpose

This repository uses a small but intentional workflow to make the project readable as a public portfolio repo and maintainable as a real internal operations tool.

## Standard Flow

1. Create a GitHub issue.
2. Define reproduction steps or acceptance criteria.
3. Create a focused branch.
4. Implement the smallest useful change.
5. Run checks.
6. Open a pull request.
7. Link the PR to the issue.
8. Merge to `main`.
9. Create a versioned release when user-facing behavior changes.

## Branch Naming

Use short, descriptive names:

```text
feature/shared-data-file
fix/invoice-search-scroll
docs/deployment-guide
release/v0.4.0
```

## Issue Expectations

Bug issues should include:

- reproduction steps
- expected behavior
- actual behavior
- app version
- data mode: local file, NAS shared file, or browser fallback
- acceptance criteria

Feature issues should include:

- user or operations value
- data/security impact
- acceptance criteria
- documentation impact

## Pull Request Expectations

Every PR should include:

- summary
- linked issue
- validation performed
- screenshots for UI changes
- release-note impact
- confirmation that no real production data is included

Solo maintainers may merge their own PRs, but the PR still acts as a public engineering record.

## Release Rules

Create a GitHub Release when a change affects:

- installer behavior
- local or shared data storage
- business workflows
- user-visible UI behavior
- public documentation or portfolio presentation

Use semantic versioning pragmatically:

- Patch: bug fixes and documentation polish, for example `0.3.2`.
- Minor: new user-facing capability, for example `0.4.0`.
- Major: breaking storage, installer, or workflow changes.

## Validation Checklist

Run the relevant checks before opening or merging a PR:

```bash
node --check src/core/module-registry.js
node --check src/app.js
node --check src/modules/invoices/invoices.module.js
node --check src/modules/fleet/fleet.module.js
node --check src/modules/attendance/attendance.module.js
node --check src/modules/utilities/utilities.module.js
node --check src/modules/settings/settings.module.js
node --check electron/main.js
node --check electron/preload.js
node --check scripts/write-build-config.js
```

For installer changes, build both modes:

```bash
npm run build:win
npm run build:win:demo
```

## Magyar összefoglaló

A cél az, hogy minden fontos munka látható útvonalon menjen: issue, branch, PR, ellenőrzés, majd release. Egyedüli fejlesztőként is hasznos, mert a GitHub repó így nem csak kész fájlokat mutat, hanem szakmai gondolkodást és átadási fegyelmet is.
