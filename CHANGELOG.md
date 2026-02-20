# Changelog

All notable changes to OpenFields will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.3.0] - 2026-02-20

### Security
- REST API `/search/users` and `/options/roles` endpoints now require `list_users` capability instead of `edit_posts`
- Added `current_user_can( 'edit_term' )` capability check to taxonomy field save handler
- All bare `echo` ternary output wrapped in `esc_attr()` for consistent escaping discipline

### Changed
- **BREAKING:** Plugin prefix renamed from `cof` (3 chars) to `cofld` (5 chars) per WordPress.org prefix length guidelines
  - All PHP constants: `COF_*` → `COFLD_*`
  - All PHP classes: `COF_*` → `COFLD_*`
  - All PHP functions: `cof_*()` → `cofld_*()`
  - All CSS classes: `.cof-*` → `.cofld-*`
  - All JS variables: `cofConfig` → `cofldConfig`, `cofMetaBox` → `cofldMetaBox`, `openfieldsAdmin` → `cofldAdmin`
  - Database tables: `cof_fieldsets` → `cofld_fieldsets`, `cof_fields` → `cofld_fields`, `cof_locations` → `cofld_locations`
  - PHP file names: `class-cof-*.php` → `class-cofld-*.php`

### Added
- Source code & build instructions section in readme.txt for compressed JS/CSS assets
- `check_list_users_permission()` REST API method for user-data endpoints

---

## [0.2.0] - 2025-07-13

### Fixed
- **Page templates not fetched** (GitHub #1) — now dynamically scans all public post types and block theme templates
- Template matching failure when default template is selected (value mismatch between `get_page_template_slug()` returning `''` and rules storing `'default'`)
- Fields not saving when fieldsets have template, category, or post format location rules (missing context in `save_post()`)
- Admin interface failed to load any data — localized script variable name mismatch (`cofAdmin` → `openfieldsAdmin`)
- Invalid menu icon (`dashicons-forms` does not exist, replaced with `dashicons-editor-table`)
- Meta box script localization targeting non-existent `cof-meta-box` handle (changed to `cof-fields`)
- Term and user default value logic overriding intentional `0`/empty values (now uses `metadata_exists()`)
- Admin mount point ID mismatch between PHP (`cof-admin`) and React (`openfields-admin`)
- TypeScript type error in ConditionalLogicPanel (field ID to string conversion)
- Deprecated `get_openfields()` reference removed from documentation

### Added
- Dynamic page template options in location rule builder (fetched from WordPress instead of hardcoded)
- Post Category and Post Format location rule types in admin UI
- Categories, post formats, and page templates provided to admin via localized data
- Plugin text domain loading for translation support
- Activation redirect transient for first-time setup experience
- Switch field renderer include (was missing)
- GitHub Actions workflow for automated releases
- Comprehensive documentation index with cross-linked navigation

### Changed
- Removed unnecessary `flush_rewrite_rules()` on activation/deactivation
- Removed phantom scheduled hook cleanup for non-existent cron event
- Completely redesigned README for user-friendliness
- Simplified and reorganized CONTRIBUTING.md
- Improved documentation discoverability with INDEX.md

---

## [0.1.0] - 2024-12-11

### Features
- ✨ Visual field builder with drag-and-drop interface
- 📋 Core field types (text, textarea, select, radio, checkbox, switch, repeater, group, etc.)
- 🎯 Conditional logic system with field ID-based references
- 📍 Location rules for post types, taxonomies, and user roles
- 🎨 Custom CSS per fieldset
- 📤 Import/Export fieldsets as JSON
- 🔌 REST API endpoints for headless usage
- 📱 Responsive admin interface built with React 18 + TypeScript
- 🧪 Field copy/paste functionality

### Backend
- WordPress plugin with PSR-4 autoloading
- Custom database tables for fieldsets and fields
- Automatic meta storage routing (post/user/term meta)
- Full REST API with proper authentication
- WordPress.org compliant code structure

### Admin Interface
- React 18 + TypeScript with Vite
- shadcn/ui components and Tailwind CSS
- Zustand state management
- @dnd-kit for drag-and-drop functionality
- Hot reload development experience

### Documentation
- Comprehensive developer guide
- Architecture reference
- Build system documentation
- WordPress compliance guidelines
- Quick reference for common tasks

---

## Release Process

To create a new release:

1. **Update version in `package.json`**:
   ```bash
   pnpm version patch  # or minor, major
   ```

2. **Build the release**:
   ```bash
   pnpm run build:plugin:release
   ```

3. **Create a git tag**:
   ```bash
   git tag v$(node -p "require('./package.json').version")
   ```

4. **Push to GitHub**:
   ```bash
   git push origin main --tags
   ```

GitHub Actions will automatically:
- Build the plugin
- Create a release on GitHub
- Upload the ZIP file for download

See [BUILD.md](./docs/BUILD.md) for detailed build instructions.

---

## Planned Features

### Phase 2 (v1.1)
- Advanced field types (WYSIWYG, Color Picker, Date/Time)
- Field validation rules
- Performance optimizations
- CLI commands for scaffolding

### Phase 3 (v2.0)
- Enhanced repeater and flexible content
- Custom field type builder UI
- GraphQL support
- Block editor integration
- Field template library

---

## Installation

### For Users
1. Download from [Releases](https://github.com/novincode/openfields/releases)
2. Upload ZIP to WordPress admin → Plugins → Add New → Upload Plugin
3. Activate the plugin

### For Developers
```bash
git clone https://github.com/novincode/openfields.git
cd openfields
pnpm install
pnpm run wp-env:start
pnpm run dev
```

---

## Support & Contributing

- 📖 See [README.md](./README.md) for overview
- 🤝 See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to contribute
- 📚 See [Documentation Index](./docs/INDEX.md) for all docs
- 🐛 Report issues on [GitHub Issues](https://github.com/novincode/openfields/issues)
- 💬 Ask questions in [GitHub Discussions](https://github.com/novincode/openfields/discussions)

---

## License

OpenFields is licensed under **GPL v2 or later**. See [LICENSE](./LICENSE) for details.

Made with ❤️ by the OpenFields team
