# 🚀 OpenFields - Quick Release Guide

**For releasing OpenFields to users**

---

## The Super Simple Release Process

### Step 1: Update Version
```bash
cd openfields
pnpm version patch    # or 'minor' for new features, 'major' for big changes
```

This updates `package.json` automatically.

### Step 2: Push with Tag
```bash
git push origin main --tags
```

### Done! 🎉

**GitHub Actions automatically:**
- ✅ Builds the plugin
- ✅ Creates a ZIP file
- ✅ Uploads to [Releases page](https://github.com/novincode/openfields/releases)
- ✅ Generates release notes

---

## For Users

They download from the [Releases page](https://github.com/novincode/openfields/releases):

1. Click the latest release
2. Download `openfields-X.X.X.zip`
3. Upload to WordPress → Plugins → Add New → Upload
4. Click Install & Activate

**No coding needed!** 👍

---

## Version Bumping Guide

```bash
# Bug fixes & small improvements → patch
pnpm version patch    # v0.1.0 → v0.1.1

# New features, backwards compatible → minor
pnpm version minor    # v0.1.1 → v0.2.0

# Breaking changes → major
pnpm version major    # v0.2.0 → v1.0.0
```

---

## What GitHub Actions Does

### On Every Tag Push

**File:** `.github/workflows/release.yml`

1. Checks out code
2. Installs Node dependencies
3. Runs `pnpm run build:plugin:release`
4. Creates GitHub Release
5. Uploads ZIP file to release

**Result:** Your plugin is instantly downloadable! 🎁

### On Every Push

**File:** `.github/workflows/build.yml`

1. Runs TypeScript type checking
2. Runs ESLint linting
3. Builds the plugin
4. Saves build artifacts

**Result:** Catches errors early! ✅

---

## Testing Before Release

```bash
# Build locally
pnpm run build:plugin:release

# Test in WordPress
# Upload dist/openfields-X.X.X.zip
# Test in admin

# If all good, push tags:
git tag v0.2.0
git push origin --tags
```

---

## Common Commands

```bash
# See what changed
git status
git diff

# Make a commit
git add .
git commit -m "feat: Add new feature"

# Update version
pnpm version patch

# Push to GitHub (triggers release)
git push origin main --tags

# Check release status
# Visit: https://github.com/novincode/openfields/actions
```

---

## Troubleshooting

### GitHub Actions Failed?
- Check https://github.com/novincode/openfields/actions
- Click failed workflow to see error
- Common issues:
  - Build errors → `pnpm run build` locally first
  - Type errors → `pnpm run type-check` locally
  - Lint errors → `pnpm run lint:fix` locally

### Need to Redo a Release?
```bash
# Delete tag locally
git tag -d v0.2.0

# Delete on GitHub
git push origin --delete v0.2.0

# Create again
pnpm version patch
git push origin main --tags
```

### Want to Test Workflow?
```bash
# Build locally
pnpm run build:plugin:release

# Check files
ls -la dist/
```

---

## Release Checklist

Before pushing:

- [ ] `git pull` - Get latest changes
- [ ] Code review of your changes
- [ ] `pnpm run build:plugin:release` - Build successfully
- [ ] Test in WordPress locally
- [ ] `pnpm version patch` - Update version
- [ ] `git push origin main --tags` - Push tag
- [ ] Wait for Actions to complete (1-2 min)
- [ ] Check [Releases page](https://github.com/novincode/openfields/releases)
- [ ] Download ZIP to verify

---

## Need Help?

- **Build errors?** → See [docs/BUILD.md](./docs/BUILD.md)
- **Contributing?** → See [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Documentation?** → See [docs/INDEX.md](./docs/INDEX.md)
- **GitHub Actions?** → Check `.github/workflows/`

---

That's it! Simple, automated, and professional. 🎉

Made with ❤️ by the OpenFields team
