# Changelog

All notable changes to OpenFields will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions workflow for automated releases
- Comprehensive documentation index
- Cross-linked documentation for better navigation
- LICENSE file at repository root
- Updated CONTRIBUTING.md with step-by-step guide
- GitHub Actions build verification workflow

### Fixed
- TypeScript type error in ConditionalLogicPanel (field ID to string conversion)
- Deprecated `get_openfields()` reference removed from documentation

### Changed
- Completely redesigned README for user-friendliness
- Simplified and reorganized CONTRIBUTING.md
- Added "See Also" links to all main documentation files
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
