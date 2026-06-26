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

## Current Status

GitHub Actions is enabled and the workflow has successfully completed on pull requests. A successful PR run verifies:

- dependency installation with `npm ci`
- JavaScript syntax checks
- Windows release installer build
- checksum generation
- build artifact upload

Example verified run:

```text
Build Windows Installer / build
event: pull_request
result: success
artifact: hr-admin-platform-windows
```

## Previous GitHub Actions Limitation

Earlier Actions runs did not start because the repository owner account reported:

```text
The job was not started because your account is locked due to a billing issue.
```

That was an account-level GitHub Actions/billing limitation, not an application build failure. It has since been resolved.

## Local Build Fallback

Use Windows Node.js for installer builds:

```bash
npm ci
npm run build:win
npm run build:win:demo
```

After building, generate checksums and upload installers as GitHub Release assets if Actions is unavailable.

## Follow-up Plan

- Validate the next tag-based release build.
- Close the existing release automation validation issue when the workflow produces installer and checksum assets.

## Magyar összefoglaló

A CI workflow működik, és PR-en már sikeresen lefutott: dependency telepítés, syntax check, Windows installer build, checksum és artifact feltöltés. Korábban volt GitHub account/billing lock, de ez nem apphiba volt, és már rendezve lett.
