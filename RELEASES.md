# Release Guide

How to release Codeideal Open Fields to users.

---

## Quick Release (Interactive CLI)

```bash
pnpm release
```

This opens an interactive prompt where you choose:
- **WordPress.org** (SVN → trunk + tagged version)
- **GitHub** (git tag → Actions → Release page)
- **Both**

That's it. The CLI handles building, versioning, zipping, and deploying.

---

## CLI Flags (Non-Interactive)

```bash
pnpm release:svn       # WordPress.org only
pnpm release:github    # GitHub only
pnpm release:all       # Both targets
pnpm release:dry       # Dry-run (build + preview, no commits)
```

---

## Step-by-Step: New Version Release

### 1. Bump the version

```bash
pnpm version patch    # 0.3.0 → 0.3.1 (bug fixes)
pnpm version minor    # 0.3.0 → 0.4.0 (new features)
pnpm version major    # 0.3.0 → 1.0.0 (breaking changes)
```

This updates `package.json` automatically and creates a git commit + tag.

### 2. Push code to GitHub

```bash
git push origin main
```

### 3. Release

```bash
pnpm release
```

Select your targets and confirm. Done.

---

## What Happens Under the Hood

### Build Phase (always runs first)
1. Syncs version from `package.json` → `codeideal-open-fields.php`
2. Builds admin React/TypeScript app via Vite
3. Creates distributable ZIP in `dist/`

### WordPress.org SVN Deploy
1. Updates local SVN working copy (`.svn-repo/`)
2. Syncs all plugin files to `trunk/`
3. Creates a version tag via `svn cp trunk tags/X.Y.Z`
4. Commits everything to `https://plugins.svn.wordpress.org/codeideal-open-fields/`
5. Update appears on wordpress.org within ~15 minutes

### GitHub Release
1. Creates an annotated git tag `vX.Y.Z`
2. Pushes tag to origin
3. GitHub Actions (`.github/workflows/release.yml`) builds and creates a Release with the ZIP attached

---

## Configuration

| Item | Location |
|---|---|
| SVN credentials | `.env` (`SVN_PASSWORD=...`) |
| SVN username | `shayancode` |
| SVN working copy | `.svn-repo/` (git-ignored) |
| SVN repository | `https://plugins.svn.wordpress.org/codeideal-open-fields/` |
| Plugin version source | `package.json` → `version` |
| Release script | `scripts/release.ts` |
| Build script | `scripts/build.sh` |
| GitHub Actions | `.github/workflows/release.yml` |

---

## Troubleshooting

### SVN commit fails with "Access forbidden"
- Check your SVN password at https://profiles.wordpress.org/me/profile/edit/group/3/?screen=svn-password
- Ensure `.env` has the correct `SVN_PASSWORD`
- Username is `shayancode` (case-sensitive)

### Plugin not showing on WordPress.org after deploy
- WordPress.org rebuilds ZIPs after each SVN commit — can take up to 15 minutes
- Check https://wordpress.org/plugins/codeideal-open-fields/ after waiting

### GitHub Actions failed
- Check https://github.com/novincode/openfields/actions
- Common issues: build errors, type errors, lint errors
- Test locally first: `pnpm release:dry`

### Need to redo a release
```bash
# Delete the git tag
git tag -d v0.3.1
git push origin --delete v0.3.1

# Fix the issue, then re-release
pnpm release
```

---

## Release Checklist

- [ ] `git pull origin main` — get latest
- [ ] Review your changes
- [ ] `pnpm release:dry` — dry-run to verify everything builds
- [ ] `pnpm version patch` (or minor/major) — bump version
- [ ] `pnpm release` — deploy
- [ ] Verify on [WordPress.org](https://wordpress.org/plugins/codeideal-open-fields/)
- [ ] Verify on [GitHub Releases](https://github.com/novincode/openfields/releases)
