# Scripts Directory

This directory contains build, release, and deployment scripts for the OpenFields plugin.

## Files

- **build.sh** — Plugin build script (Vite + TypeScript)
  - `pnpm build:plugin` — Development build
  - `pnpm build:plugin:release` — Release build (version sync + ZIP)

- **release.ts** — Interactive release CLI (TypeScript)
  - `pnpm release` — Interactive mode (choose GitHub, WordPress.org, or both)
  - `pnpm release:svn` — Deploy to WordPress.org only
  - `pnpm release:github` — Create GitHub release only (git tag → Actions)
  - `pnpm release:all` — Deploy everywhere
  - `pnpm release:dry` — Dry-run (build + show what would happen, no commits)

## Release Pipeline

The `release.ts` script handles the full release lifecycle:

1. **Build** — Compiles React/TypeScript admin app via Vite, syncs version numbers
2. **ZIP** — Creates a distributable archive in `dist/`
3. **WordPress.org SVN** — Syncs files to `trunk/`, creates a version tag, commits
4. **GitHub** — Creates an annotated git tag, pushes to trigger GitHub Actions release

### WordPress.org SVN

- SVN working copy lives in `.svn-repo/` (git-ignored)
- SVN credentials: username `shayancode`, password from `.env` (`SVN_PASSWORD=...`)
- Repository: `https://plugins.svn.wordpress.org/codeideal-open-fields/`
- After commit, updates appear on wordpress.org within ~15 minutes

### GitHub Actions

- Pushing a `v*.*.*` tag triggers `.github/workflows/release.yml`
- Actions builds the plugin and creates a GitHub Release with the ZIP attached

## See Also

- [docs/BUILD.md](../docs/BUILD.md) — Detailed build documentation
- [RELEASES.md](../RELEASES.md) — Release process guide
- `vite.config.ts` - Vite configuration for React app bundling
