# GitHub Actions CI/CD Setup

This document describes the CI/CD workflow and required secrets configuration.

## Workflows

### build.yml

Builds installation packages for Windows, macOS, and Linux on every push to main branch.

**Triggers:**
- Push to main branch (except documentation changes)

**Artifacts:**
- Windows: `.exe`, `.msi`, `.zip`
- macOS: `.dmg`, `.zip`
- Linux: `.deb`, `.rpm`, `.AppImage`

### release.yml

Automatically creates GitHub releases with changelog when pushing to main branch.

**Triggers:**
- Push to main branch (except documentation changes)

**Actions:**
- Generates changelog from commit history
- Creates or updates GitHub release
- Uploads built artifacts

## Required Secrets

Configure these secrets in GitHub repository Settings → Secrets and variables → Actions:

### For All Platforms

| Secret Name | Description |
|-------------|-------------|
| `GITHUB_TOKEN` | Auto-provided by GitHub |

### For Windows Code Signing (Optional)

| Secret Name | Description |
|-------------|-------------|
| `WIN_CERTIFICATE_PASSWORD` | Password for Windows PFX certificate |

### For macOS Signing & Notarization (Optional)

| Secret Name | Description |
|-------------|-------------|
| `APPLE_ID_PASSWORD` | Apple ID app-specific password |
| `APPLE_ID` | Apple Developer ID email (optional, if not set notarization is skipped) |
| `APPLE_TEAM_ID` | Team ID for notarization (optional) |

### Setting up macOS Signing (Optional)

macOS notarization is optional. If you want your app to be notarized by Apple:

1. Create an Apple Developer account
2. Generate app-specific password for GitHub Actions
3. Add `APPLE_ID_PASSWORD` secret with the app-specific password
4. Optionally add `APPLE_ID` and `APPLE_TEAM_ID` for full notarization

If these secrets are not set, the build will skip notarization but still create a valid DMG.

### Setting up Windows Signing

1. Purchase a code signing certificate
2. Export as PFX format
3. Place in `certificates/windows.pfx`
4. Add password as `WIN_CERTIFICATE_PASSWORD` secret

## Build Commands

```bash
# Install dependencies
npm ci

# Build for current platform
npm run build

# Build and make all installers
npm run make

# Publish to GitHub Releases
npm run publish
```

## Version Management

The version is read from `package.json`:

```json
{
  "version": "1.0.0"
}
```

When creating releases, the workflow expects semantic versioning (e.g., `1.0.0`).

## Artifacts

Build artifacts are uploaded to GitHub Actions and can be downloaded from the workflow run page. After release, artifacts are attached to the GitHub release.

## Troubleshooting

### Build fails on Windows

- Ensure `WIN_CERTIFICATE_PASSWORD` is set correctly
- Check certificate validity

### macOS notarization fails

- Verify Apple ID and app-specific password
- Ensure team ID is correct
- Check certificate is valid for notarization

### Linux build issues

- Ensure all native dependencies are compatible
- Check Electron rebuild status
