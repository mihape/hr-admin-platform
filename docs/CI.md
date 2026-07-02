# Continuous Integration

## Intended Workflow

The repository includes a GitHub Actions workflow at:

```text
.github/workflows/build-windows.yml
```

The workflow is designed to:

- run on pull requests
- run on pushes to `main`
- run on version tags such as `v0.3.6`
- install dependencies with `npm ci`
- run JavaScript syntax checks
- build the Windows release installer
- build the demo installer on tags or manual dispatch
- generate SHA256 checksums
- upload release assets on version tags

Installer builds run `electron-builder` with `--publish never`. GitHub Release
publishing is handled only by the dedicated `softprops/action-gh-release` step,
so pull request and `main` builds do not require a separate electron-builder
GitHub token.

Release asset filenames are normalized before checksum generation. The
filenames inside `CHECKSUMS.txt` must match the filenames shown on the GitHub
Release page, for example:

```text
HR.Admin.Platform.Setup.0.3.6.exe
HR.Admin.Platform.Setup.0.3.6.Demo.exe
```

## Current Status

GitHub Actions is enabled and the workflow has successfully completed on pull requests, `main` pushes, and tag-based release builds. A successful PR run verifies:

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

The tag-based release flow has also been validated. A successful tag run
publishes:

- `HR.Admin.Platform.Setup.<version>.exe`
- `HR.Admin.Platform.Setup.<version>.Demo.exe`
- `CHECKSUMS.txt`

## Previous GitHub Actions Limitation

Earlier Actions runs did not start because the repository owner account reported:

```text
The job was not started because your account is locked due to a billing issue.
```

That was an account-level GitHub Actions/billing limitation, not an application build failure. It has since been resolved.

## Local Build Fallback

Use Windows Node.js for installer builds:

```powershell
npm ci
npm run build:win
New-Item -ItemType Directory -Force artifacts | Out-Null
$version = node -p "require('./package.json').version"
Copy-Item "dist/HR Admin Platform Setup $version.exe" "artifacts/HR.Admin.Platform.Setup.$version.exe"
npm run build:win:demo
Copy-Item "dist/HR Admin Platform Setup $version.exe" "artifacts/HR.Admin.Platform.Setup.$version.Demo.exe"
Get-ChildItem artifacts -Filter "*.exe" | ForEach-Object {
  $hash = Get-FileHash $_.FullName -Algorithm SHA256
  "$($hash.Hash.ToLower())  $($_.Name)"
} | Set-Content "artifacts/CHECKSUMS.txt"
```

The release installer must be copied before `npm run build:win:demo`, because
both build modes write the same `dist/HR Admin Platform Setup $version.exe`
filename. Upload the files from `artifacts/` as GitHub Release assets if
Actions is unavailable.

## Release Validation Status

The release automation validation issue was completed after a successful
tag-based release build. During validation, a filename mismatch between GitHub
Release assets and `CHECKSUMS.txt` entries was found and fixed by normalizing
artifact names before checksum generation.

## Troubleshooting Notes

If a `main` or pull request build fails with this message:

```text
GitHub Personal Access Token is not set, neither programmatically, nor using env "GH_TOKEN"
```

then `electron-builder` is trying to publish artifacts by itself. Keep
`--publish never` in the npm build scripts and let the GitHub Actions release
step upload assets on `v*` tags.

## Magyar összefoglaló

A CI workflow működik, és PR-en, `main` pushon, valamint tag alapú release builden is sikeresen lefutott: dependency telepítés, syntax check, Windows installer build, checksum és release asset feltöltés. Korábban volt GitHub account/billing lock, de ez nem apphiba volt, és már rendezve lett.
