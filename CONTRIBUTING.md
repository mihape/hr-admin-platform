# Contributing

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
