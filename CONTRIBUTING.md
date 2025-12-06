# Contributing to OpenFields

Thank you for your interest in contributing to OpenFields! This guide will help you get started.

## Quick Links

- **Development Setup**: See README.md for local environment setup
- **Build System**: `docs/BUILD.md` - Understanding the build process
- **Architecture**: `docs/ARCHITECTURE.md` - How the plugin is structured
- **Code Standards**: `docs/WORDPRESS_GUIDELINES.md` - WordPress coding standards we follow
- **Developer Guide**: `docs/DEVELOPER_GUIDE.md` - API documentation and patterns
- **Admin System**: `docs/ADMIN_SYSTEM.md` - How the admin UI works

## Development Workflow

### 1. Setup

```bash
npm install
npm run wp-env start
npm run dev
```

### 2. Make Changes

- **Admin UI Changes**: Edit files in `admin/src/`
- **PHP Backend**: Edit files in `plugin/includes/`
- **Documentation**: Update relevant `.md` files in `docs/`

### 3. Build & Test

```bash
# If modifying admin UI
npm run build:plugin

# Test in WordPress at http://localhost:8888/wp-admin

# If ready to release
npm run build:plugin:release
```

### 4. Commit & Push

```bash
git add .
git commit -m "Add feature: xyz"
git push origin main
```

## Coding Standards

### PHP
- Follow WordPress Coding Standards (checked via PHPCS)
- All functions must be prefixed with `openfields_`
- Use proper escaping and sanitization
- Include PHPDoc comments

### TypeScript/React
- Use TypeScript - no plain JavaScript
- Follow ESLint rules (run `npm run lint:fix`)
- Use absolute imports with `@/` prefix
- Include proper type definitions

### Documentation
- Update relevant `.md` files when changing APIs
- Include inline code comments for complex logic
- Update QUICK_REFERENCE.md for user-facing features

## File Structure

```
openfields/
├── admin/                    # React admin app
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Main admin pages
│   │   ├── lib/             # Utilities and helpers
│   │   └── types/           # TypeScript definitions
│   └── dist/                # Built output (don't edit)
│
├── plugin/                   # WordPress plugin
│   ├── openfields.php        # Main plugin file
│   ├── includes/
│   │   ├── class-*.php       # Core classes
│   │   ├── admin/            # Admin-specific code
│   │   ├── api/              # REST API endpoints
│   │   ├── fields/           # Field type implementations
│   │   ├── locations/        # Location rule handlers
│   │   └── storage/          # Data storage managers
│   └── assets/               # Built CSS/JS (auto-generated)
│
├── scripts/                  # Build and deployment scripts
│   └── build.sh             # Main build script
│
├── docs/                     # Documentation
│   ├── BUILD.md             # Build system documentation
│   ├── ARCHITECTURE.md       # System architecture
│   ├── DEVELOPER_GUIDE.md    # API reference
│   └── ...
│
└── package.json             # Node.js configuration
```

## Common Tasks

### Build the plugin for testing
```bash
npm run build:plugin
```

### Create a release
```bash
# Update version in package.json
npm version patch

# Build release package
npm run build:plugin:release

# The ZIP file is in dist/openfields-X.X.X.zip
```

### Run tests
```bash
npm run test
```

### Check code quality
```bash
npm run type-check
npm run lint
```

### Format code
```bash
npm run lint:fix
npm run format
```

## Reporting Issues

When reporting issues, please include:
- WordPress version
- PHP version
- Steps to reproduce
- Expected behavior vs actual behavior
- Screenshots if applicable

## Pull Request Process

1. **Create a branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Follow coding standards above
3. **Test thoroughly**: Use `npm run wp-env start` to test locally
4. **Build release**: Run `npm run build:plugin:release` to verify
5. **Create PR**: Include description of changes and testing steps

## Architecture Overview

**Backend (PHP)**
- Field definitions stored in custom `wp_openfields_fields` table
- Fieldset configurations stored in `wp_openfields_fieldsets` table
- Field values stored in standard post/user/term meta
- REST API at `/wp-json/openfields/v1/`

**Frontend (React)**
- Built with Vite for fast development
- All UI components use TypeScript and Tailwind
- State management with Zustand
- Uses shadcn/ui for UI component library

**Storage Layer**
- `Storage_Manager` handles all data persistence
- Supports post, user, term, and option storage
- Automatic routing based on context

## Need Help?

- Check `docs/QUICK_REFERENCE.md` for common questions
- Review `docs/AI_CONTEXT.md` for project context and decisions
- Open an issue if you're stuck

Thank you for contributing! 🚀
