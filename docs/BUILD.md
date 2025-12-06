# OpenFields Plugin Build Process

## Overview

The OpenFields plugin uses an automated build process that:

1. **Bundles the React admin app** via Vite
2. **Manages versioning** across package.json and plugin file
3. **Copies built assets** to the plugin directory
4. **Creates a distributable ZIP** for WordPress.org submission

## Build Scripts

### Development Build
```bash
pnpm build:plugin
```
- Builds the admin React app
- Copies compiled assets to `plugin/assets/`
- Ready for immediate testing in WordPress
- Does NOT create a ZIP file

### Release Build
```bash
pnpm build:plugin:release
```
- Builds admin React app
- Updates version in `openfields.php` from package.json
- Copies assets
- Creates a **ZIP file** at `dist/openfields-X.X.X.zip`
- Ready for WordPress.org submission

## Versioning

### How Versions Work

1. **Version source**: `package.json` (single source of truth)
2. **Version destinations**:
   - `plugin/openfields.php` header (auto-updated on release)
   - `dist/openfields-X.X.X.zip` filename
   - `OPENFIELDS_VERSION` constant in plugin

### Updating Versions

Before releasing:
```bash
# Update version in package.json
npm version patch  # or minor, major
# or manually edit "version" in package.json

# Then run release build
pnpm build:plugin:release
```

## Asset Management

### Script Enqueuing

Scripts are already configured with automatic versioning:

```php
wp_enqueue_script(
    'openfields-admin',
    OPENFIELDS_PLUGIN_URL . 'assets/admin/js/admin.js',
    array(),
    OPENFIELDS_VERSION,  // ← Auto-versioned!
    true
);
```

**Benefits**:
- Browser cache invalidation on version changes
- Automatic in development builds
- Consistent versioning with package.json

### Built Assets

After running any build:
- Admin JavaScript: `plugin/assets/admin/js/admin.js`
- Admin CSS: `plugin/assets/admin/css/admin.css`
- Minified and optimized via Vite

## Workflow

### For Development

1. Make changes to admin React app (`admin/src/`)
2. Run: `pnpm build:plugin`
3. Test in WordPress
4. Commit changes

### For Release

1. Update version: `npm version patch`
2. Run: `pnpm build:plugin:release`
3. Test the ZIP in WordPress
4. Create Git tag: `git tag v0.1.0`
5. Push to repository: `git push origin v0.1.0`
6. Upload ZIP to WordPress.org

### For CI/CD Integration

```bash
#!/bin/bash
cd /path/to/openfields
pnpm install
pnpm build:plugin:release
# Now dist/openfields-*.zip is ready to deploy
```

## File Structure After Build

### Development
```
plugin/
├── openfields.php
├── assets/
│   ├── admin/
│   │   ├── js/
│   │   │   ├── admin.js          ← Built from React
│   │   │   └── admin.js.map
│   │   └── css/
│   │       └── admin.css          ← Built from React
│   └── ...
└── includes/
    └── ...
```

### Release
```
dist/
└── openfields-0.1.0/
    ├── openfields.php             ← Version updated
    ├── assets/
    │   ├── admin/
    │   │   ├── js/admin.js
    │   │   └── css/admin.css
    │   └── ...
    └── includes/
        └── ...

dist/
└── openfields-0.1.0.zip           ← Ready for submission
```

## Environment Variables

The build script uses:
- `OPENFIELDS_VERSION` - Set from version constant
- `ROOT_DIR` - Auto-detected from script location
- `BUILD_DIR` - `dist/` directory for release builds

## Troubleshooting

### Build fails: "pnpm not found"
```bash
npm install -g pnpm
```

### Assets not copied
Check that `admin/dist/` exists after Vite build:
```bash
ls -la admin/dist/
```

### Version not updating
Ensure package.json has proper version format:
```json
"version": "0.1.0"
```

### ZIP file not created
Check permissions on `dist/` directory:
```bash
chmod -R 755 dist/
```

## Advanced: Custom Build Options

### Build without assets
```bash
# Just rebuild React app
pnpm build
```

### Manual asset copy
```bash
cp -r admin/dist/* plugin/assets/admin/
```

### Manual ZIP creation
```bash
cd dist
zip -r openfields-0.1.0.zip openfields/
```

## Best Practices

1. **Always build before committing**: Ensures assets are up-to-date
2. **Test release builds**: Run in test WordPress before submitting
3. **Use semantic versioning**: `major.minor.patch`
4. **Tag releases in Git**: Makes deployment history clear
5. **Never commit node_modules**: Already in .gitignore

## Integration with WordPress.org

Once you're ready for WordPress.org:

1. Generate release build: `pnpm build:plugin:release`
2. Test the ZIP: Install in WordPress and verify
3. Submit: Upload `dist/openfields-X.X.X.zip`
4. Update GitHub releases with the same ZIP
5. Add deploy tag: `git tag v0.1.0 && git push origin v0.1.0`

## Performance Notes

- React app is minified and tree-shaken by Vite
- Source maps included for development debugging
- Production builds are optimized for size
- Versioning ensures fresh cache on updates
