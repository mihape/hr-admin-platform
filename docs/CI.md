# Continuous Integration

## Intended Workflow

The repository includes a GitHub Actions workflow at:

```text
.github/workflows/build-windows.yml
```

The workflow is designed to:

- run on pull requests
- run on pushes to `main`
- run on version tags such as `v0.3.2`
- install dependencies with `npm ci`
- run JavaScript syntax checks
- build the Windows release installer
- build the demo installer on tags or manual dispatch
- generate SHA256 checksums
- upload release assets on version tags

## Current GitHub Actions Limitation

At the time of writing, GitHub Actions runs are not starting because the repository owner account reports:

```text
The job was not started because your account is locked due to a billing issue.
```

This is an account-level GitHub Actions/billing limitation, not an application build failure. Local Windows builds have been used for the published release assets until Actions execution is available again.

## Local Build Fallback

Use Windows Node.js for installer builds:

```bash
npm ci
npm run build:win
npm run build:win:demo
```

After building, generate checksums and upload installers as GitHub Release assets.

## Resolution Plan

- Resolve GitHub account billing/Actions lock.
- Re-run the workflow manually with `workflow_dispatch`.
- Validate the first tag-based release build.
- Close the existing release automation validation issue when the workflow produces installer and checksum assets.

## Magyar összefoglaló

A CI workflow készen van, de a GitHub jelenleg account/billing okból nem indítja el a jobokat. Ez nem apphiba. Amíg ez nincs rendezve, a release telepítők helyi Windows buildből készülnek.
