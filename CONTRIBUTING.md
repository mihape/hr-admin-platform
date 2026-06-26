# Contributing

## Workflow

Use the repository workflow for meaningful changes:

1. Open or select a GitHub issue.
2. Create a focused branch.
3. Implement and validate the change.
4. Open a pull request.
5. Merge to `main`.
6. Create a release when user-facing behavior changes.

See [docs/WORKFLOW.md](docs/WORKFLOW.md) for the full issue -> branch -> PR -> release process.

## Development Setup

```bash
npm install
npm start
```

## Basic Checks

Run JavaScript syntax checks before opening a pull request:

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
```

## Build Commands

Release build with empty startup:

```bash
npm run build:win
```

Demo build with fictional sample data:

```bash
npm run build:win:demo
```

## CI Status

The GitHub Actions workflow is documented in [docs/CI.md](docs/CI.md). Pull requests should wait for the Windows installer workflow to finish unless the failure is explicitly documented as account- or GitHub-side infrastructure.

## Data Rules

Do not commit:

- real invoices
- supplier exports
- employee data
- local backup JSON files
- screenshots containing real company data
- `node_modules`
- installer output under `dist`

Use fictional sample data only.

## Documentation Rules

Documentation should be English first. Hungarian summaries are welcome when they help local handoff or business users.
