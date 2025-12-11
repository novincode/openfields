# Contributing to OpenFields

Thank you for contributing to OpenFields! This guide will help you get started.

---

## Getting Started

### 1. Fork & Clone

```bash
git clone https://github.com/novincode/openfields.git
cd openfields
```

### 2. Install Dependencies

```bash
pnpm install
# or: npm install
```

### 3. Start Development Environment

```bash
pnpm run wp-env:start
# WordPress will be at http://localhost:8888
# Admin: http://localhost:8888/wp-admin (user: admin / pass: password)
```

### 4. Run Development Server

```bash
pnpm run dev
# This starts Vite dev server with hot reload
```

---

## Making Changes

### For Admin UI Changes

Files to edit: `admin/src/**/*.tsx`

```bash
# The changes will auto-reload in the browser
pnpm run dev

# When ready, build the plugin:
pnpm run build:plugin
```

### For PHP Backend Changes

Files to edit: `plugin/includes/**/*.php`

- Rebuild the plugin to test: `pnpm run build:plugin`
- Changes take effect when you reload WordPress

### For Documentation Changes

Files to edit: `docs/**/*.md`

- Test the markdown renders correctly on GitHub
- Link to related docs where relevant

---

## Code Style

### PHP
- Use `openfields_` prefix for all functions and hooks
- Follow WordPress Coding Standards
- Include proper sanitization and escaping
- Add PHPDoc comments to classes and functions

**Check compliance:**
```bash
composer test
```

### TypeScript/React
- All code must be TypeScript (no plain JS)
- Run ESLint before committing

**Fix issues automatically:**
```bash
pnpm run lint:fix
pnpm run format
```

---

## Testing Your Changes

### Test in WordPress Admin

1. Start the dev environment: `pnpm run wp-env:start`
2. Go to http://localhost:8888/wp-admin
3. Test your changes manually
4. Build for testing: `pnpm run build:plugin`

### Run Automated Tests

```bash
pnpm run test              # Run tests
pnpm run test:ui           # Test UI (browser)
pnpm run type-check        # TypeScript checking
```

---

## Submitting Changes

### Before Committing

1. **Build the plugin** to ensure no errors:
   ```bash
   pnpm run build:plugin
   ```

2. **Run type checking**:
   ```bash
   pnpm run type-check
   ```

3. **Run linting & format**:
   ```bash
   pnpm run lint:fix
   pnpm run format
   ```

### Commit Messages

Write clear, descriptive commit messages:

```bash
git commit -m "feat: Add field conditional logic to repeaters"
git commit -m "fix: Switch field styling in admin"
git commit -m "docs: Update API reference for get_field()"
```

### Create a Pull Request

1. Push to your fork
2. Create PR to `main` branch
3. Include a clear description of changes
4. Link any related issues

---

## Project Structure

```
openfields/
├── admin/                      # React admin interface
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Admin pages
│   │   └── stores/             # Zustand state
│   └── dist/                   # Built output
│
├── plugin/                     # WordPress plugin
│   ├── openfields.php          # Main plugin file
│   ├── includes/
│   │   ├── class-openfields-*.php    # Core classes
│   │   ├── admin/              # Admin functionality
│   │   ├── fields/             # Field types
│   │   └── storage/            # Data layer
│   ├── assets/                 # CSS/JS (auto-generated)
│   └── languages/              # Translations
│
├── docs/                       # Documentation
│   ├── BUILD.md
│   ├── ARCHITECTURE.md
│   ├── DEVELOPER_GUIDE.md
│   └── ...
│
└── package.json
```

---

## Documentation

When adding features, update the relevant documentation:

- **API changes** → `docs/DEVELOPER_GUIDE.md`
- **Architecture changes** → `docs/ARCHITECTURE.md`
- **Setup/installation** → `README.md`
- **Build process** → `docs/BUILD.md`

Link between docs using relative paths:

```markdown
See [ARCHITECTURE.md](./ARCHITECTURE.md) for more details.
See [Build System](../docs/BUILD.md) for building.
```

---

## Common Commands

```bash
# Development
pnpm run dev                    # Start dev server
pnpm run wp-env:start           # Start WordPress
pnpm run wp-env:stop            # Stop WordPress

# Building
pnpm run build                  # Build React admin app
pnpm run build:plugin           # Build plugin (dev)
pnpm run build:plugin:release   # Build plugin (release ZIP)

# Code Quality
pnpm run type-check             # TypeScript check
pnpm run lint                   # ESLint check
pnpm run lint:fix               # Auto-fix linting
pnpm run format                 # Prettier formatting

# Testing
pnpm run test                   # Run tests
pnpm run test:ui                # Test UI in browser
```

---

## Questions?

- 📖 Check [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for API reference
- 📐 Check [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details
- 💬 Open an issue on GitHub

---

## Code of Conduct

- Be respectful and inclusive
- Help others learn
- Share knowledge openly
- Report issues responsibly

Thank you for making OpenFields better! 🚀

