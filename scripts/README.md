# Scripts Directory

This directory contains build and deployment scripts for the OpenFields plugin.

## Files

- **build.sh** - Main plugin build script
  - `bash scripts/build.sh` - Development build (builds React app, copies assets)
  - `bash scripts/build.sh release` - Release build (includes version update, creates ZIP)

## Usage via npm

```bash
pnpm build:plugin              # Development build
pnpm build:plugin:release      # Release build (creates distributable ZIP)
```

## See Also

- `docs/BUILD.md` - Detailed build documentation
- `vite.config.ts` - Vite configuration for React app bundling
