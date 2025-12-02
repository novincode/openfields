# OpenFields

**The modern, open-source alternative to ACF (Advanced Custom Fields) for WordPress**

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0)
[![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-blue.svg)](https://wordpress.org)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)](https://php.net)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://typescriptlang.org)

---

## 🎯 Vision

OpenFields reimagines WordPress custom fields with a **developer-first** approach:

- ⚡ **Modern Stack**: React + TypeScript + Tailwind + shadcn/ui admin interface
- 🎨 **Visual Builder**: Intuitive drag-and-drop field editor with live preview
- 🧩 **Headless Architecture**: Clean PHP backend, framework-agnostic frontend
- 📋 **Smart Copy/Paste**: Copy individual fields or groups between fieldsets effortlessly
- 🎯 **Type-Safe**: Full TypeScript support with proper type definitions
- 🚀 **Performance First**: Optimized database schema and caching strategies
- 📦 **100% Free**: No premium tiers, no upsells, fully GPL-licensed

---

## ✨ Features

### Core Functionality
- **Visual Field Builder** with drag-and-drop using @dnd-kit
- **20+ Field Types** including text, select, image, repeater, relationship, and more
- **Conditional Logic** to show/hide fields based on other field values
- **Location Rules** to display fieldsets on specific post types, user roles, or taxonomy terms
- **Custom CSS** per fieldset for advanced styling
- **Import/Export** fieldsets and individual fields as JSON

### Developer Experience
- Clean, documented PHP API (`get_field()`, `get_openfields()`, etc.)
- Full TypeScript definitions for the admin interface
- Headless design - use fields anywhere (REST API, GraphQL, etc.)
- Extensible field registry system
- WordPress Coding Standards compliant
- Comprehensive inline documentation

### Storage Flexibility
- Automatic storage routing (post meta, user meta, term meta, options)
- Optimized custom database tables for field definitions
- Support for nested/repeater fields with efficient queries

---

## 🚀 Quick Start

### Prerequisites
- **WordPress**: 6.0 or higher
- **PHP**: 7.4 or higher
- **Node.js**: 18+ (for development)

### Installation

#### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/novincode/openfields.git
cd openfields

# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Start local WordPress environment
npm run wp-env start

# Build admin assets
npm run build

# Or start development mode with hot reload
npm run dev
```

#### From WordPress.org (Coming Soon)
1. Download from WordPress.org plugin directory
2. Upload to `/wp-content/plugins/`
3. Activate via WordPress admin

---

## 📖 Usage

### Creating a Fieldset

```php
// In your theme or plugin:

// 1. Create a fieldset via admin UI at WP Admin > OpenFields

// 2. Assign it to post types, user roles, or taxonomies

// 3. Retrieve values in your templates:
$product_details = get_openfields('product_details', get_the_ID());
echo esc_html($product_details['price']);

// Or get individual fields:
$price = get_field('price', get_the_ID());
echo esc_html($price);
```

### Repeater Fields

```php
if (have_rows('team_members')) {
    while (have_rows('team_members')) {
        the_row();
        echo '<div class="member">';
        echo '<h3>' . esc_html(get_sub_field('name')) . '</h3>';
        echo '<p>' . esc_html(get_sub_field('role')) . '</p>';
        echo '</div>';
    }
}
```

### Conditional Fields

Fields can be shown/hidden based on other field values:

```typescript
// In the admin builder:
{
  field: 'show_gallery',
  operator: '==',
  value: true
}
```

---

## 🏗️ Architecture

### Tech Stack

**Backend (PHP)**
- WordPress custom database tables
- PSR-4 autoloading
- REST API endpoints
- Modular field registry system

**Frontend (Admin)**
- React 18 + TypeScript
- Vite for lightning-fast builds
- Tailwind CSS + shadcn/ui components
- Zustand for state management
- @dnd-kit for drag-and-drop

**Storage**
- Custom tables for field definitions
- WordPress meta tables for field values
- Automatic routing based on context

### Project Structure

```
openfields/
├── includes/          # PHP backend
│   ├── fields/        # Field type definitions
│   ├── storage/       # Data persistence layer
│   ├── locations/     # Location rules engine
│   └── api/           # Public PHP functions
├── admin/            # React admin panel
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── stores/
│       └── types/
├── assets/           # Compiled assets
└── languages/        # Internationalization
```

---

## 🎨 Field Types

### Phase 1 (Available Now)
- Text
- Textarea
- Number
- URL
- Email
- Select
- Radio
- Checkbox
- Switch (Toggle)

### Phase 2 (Coming Soon)
- WYSIWYG Editor
- Image Upload
- File Upload
- Date Picker
- Date/Time Picker
- Time Picker
- Color Picker

### Phase 3 (Planned)
- Relationship (Posts/Users/Terms)
- Gallery
- Repeater
- Group
- Flexible Content
- Google Maps

---

## 🛠️ Development

### Local Environment

```bash
# Start wp-env
npm run wp-env start

# Access WordPress
http://localhost:8888
# Admin: http://localhost:8888/wp-admin
# User: admin / Password: password

# Stop environment
npm run wp-env stop
```

### Build Commands

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Testing

```bash
# PHP tests (PHPUnit)
composer test

# JavaScript tests (Vitest)
npm run test

# E2E tests
npm run test:e2e
```

---

## 📝 WordPress.org Guidelines Compliance

OpenFields is built from the ground up to meet all WordPress.org plugin submission requirements:

✅ Unique prefix (`openfields_`) for all functions and classes  
✅ Proper sanitization and escaping  
✅ Nonce verification on all forms  
✅ Capability checks (`current_user_can()`)  
✅ No external dependencies (all assets bundled)  
✅ GPL-compatible license  
✅ Translation-ready  
✅ Uninstall hook for clean removal  
✅ No premium upsells or locked features  

See [WORDPRESS_GUIDELINES.md](./docs/WORDPRESS_GUIDELINES.md) for detailed compliance documentation.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guidelines
- Development workflow
- Pull request process
- Bug reporting

---

## 📄 License

OpenFields is licensed under the **GPL v2 or later**.

This means you are free to:
- Use the plugin for any purpose
- Study and modify the source code
- Redistribute copies
- Distribute modified versions

See [LICENSE](./LICENSE) for full details.

---

## 🗺️ Roadmap

### v1.0 (Current Focus)
- [ ] Core field builder with DnD
- [ ] 9 basic field types
- [ ] Location rules engine
- [ ] Copy/paste fields
- [ ] Export/import as JSON
- [ ] Public API functions
- [ ] WordPress.org submission

### v1.1
- [ ] Advanced field types (WYSIWYG, Image, File)
- [ ] Field validation rules
- [ ] Performance optimizations
- [ ] CLI commands

### v2.0
- [ ] Repeater and flexible content fields
- [ ] Code editor with custom DSL
- [ ] GraphQL support
- [ ] Block editor integration
- [ ] Field templates library

---

## 🙏 Acknowledgments

Inspired by the great work of:
- Advanced Custom Fields (ACF)
- MetaBox
- Carbon Fields

Built with love using:
- [React](https://reactjs.org)
- [shadcn/ui](https://ui.shadcn.com)
- [@dnd-kit](https://dndkit.com)
- [Zustand](https://zustand.surge.sh)

---

## 💬 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/novincode/openfields/issues)
- **Discussions**: [GitHub Discussions](https://github.com/novincode/openfields/discussions)

---

## 🚀 Let's Build Something Amazing

OpenFields is more than a plugin—it's a new foundation for WordPress custom fields. Join us in making WordPress development faster, cleaner, and more enjoyable.

**Star this repo** if you're excited about the project! ⭐

---

Made with ❤️ by developers, for developers.
