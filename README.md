# OpenFields

**The free, open-source alternative to ACF (Advanced Custom Fields) for WordPress**

[![License: GPL v2](https://img.shields.io/badge/License-GPL%20v2-blue.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![WordPress](https://img.shields.io/badge/WordPress-6.0%2B-blue.svg)](https://wordpress.org)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-purple.svg)](https://php.net)

> **✨ Modern custom fields plugin for WordPress with a beautiful admin interface and developer-friendly API.**

---

## 🚀 Why OpenFields?

- ✅ **100% Free & Open Source** - No premium tiers, no vendor lock-in
- ✅ **ACF-Compatible API** - Familiar `get_field()` function works exactly like ACF
- ✅ **Beautiful Builder** - Intuitive visual field editor with drag-and-drop
- ✅ **Smart Features** - Conditional logic, field groups, repeaters, and more
- ✅ **WordPress.org Ready** - Fully compliant with WordPress plugin guidelines
- ✅ **Developer Friendly** - Clean PHP API, REST endpoints, headless-ready

---

## 📥 Installation

### Option 1: From GitHub (Easy Download)
1. Go to [Releases](https://github.com/novincode/openfields/releases)
2. Download the latest `openfields-X.X.X.zip`
3. In WordPress admin: **Plugins → Add New → Upload Plugin**
4. Select the ZIP file and click **Install Now**
5. Click **Activate Plugin**

### Option 2: Manual Installation
1. Clone the repository: `git clone https://github.com/novincode/openfields.git`
2. Place in `wp-content/plugins/openfields/`
3. Activate in WordPress admin

---

## 💡 Quick Example

The API is simple and familiar if you've used ACF:

```php
// Get a single field value
$product_price = get_field('price', get_the_ID());
echo 'Price: $' . $product_price;

// Get all fields in a fieldset
$product = get_field('product_details', get_the_ID(), false);
// Returns array of all fields in that fieldset

// Repeater fields
if (have_rows('team_members')) {
    while (have_rows('team_members')) {
        the_row();
        echo get_sub_field('name');
    }
}
```

That's it! The API is intuitive and requires no special syntax.

---

## ⚙️ Setup (For Development)

```bash
# Clone the repository
git clone https://github.com/novincode/openfields.git
cd openfields

# Install dependencies
pnpm install  # or npm install

# Start local WordPress
pnpm run wp-env:start

# Build admin UI and watch for changes
pnpm run dev

# WordPress will be available at http://localhost:8888
# Admin: http://localhost:8888/wp-admin (user: admin / pass: password)
```

See [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) for more information.

---

## 🛠️ Features

- **Visual Field Builder** - Drag-and-drop interface to create fieldsets
- **Multiple Field Types** - Text, textarea, select, radio, checkbox, switch, repeater, group, and more
- **Conditional Logic** - Show/hide fields based on other field values
- **Location Rules** - Display fieldsets on specific post types, user roles, or taxonomies
- **Copy & Paste** - Duplicate fields between fieldsets with one click
- **Import/Export** - Share fieldsets as JSON files
- **REST API** - Full REST endpoint support for headless applications
- **No Premium Tiers** - All features are completely free

---

## 📚 Documentation

- [**Developer Guide**](./docs/DEVELOPER_GUIDE.md) - API reference and code examples
- [**Architecture**](./docs/ARCHITECTURE.md) - How the plugin is built
- [**Contributing**](./CONTRIBUTING.md) - How to contribute to the project
- [**WordPress Guidelines**](./docs/WORDPRESS_GUIDELINES.md) - Compliance details
- [**Build System**](./docs/BUILD.md) - Build process documentation

Or visit the full docs: **[openfields.codeideal.com/docs](https://openfields.codeideal.com/docs)**

---

## 🏗️ Architecture

**Backend (PHP)** - WordPress meta tables, REST API, clean plugin structure  
**Frontend (Admin)** - React 18 + TypeScript with a beautiful UI  
**Storage** - Automatic meta routing + custom database tables  

Full technical details in [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🏛️ License

OpenFields is licensed under **GPL v2 or later** - completely free and open source.

You can:
- ✅ Use for any purpose (personal, commercial)
- ✅ Modify and distribute
- ✅ No fees, no licensing costs
- ✅ No vendor lock-in

See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

We'd love your help! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- How to report bugs
- How to submit features
- Development setup
- Code style guidelines

---

## 💝 Support This Project

If OpenFields has been helpful to you, consider supporting the project:

[![Become a Sponsor](https://img.shields.io/badge/Sponsor-OpenFields-blue?style=for-the-badge)](https://github.com/sponsors/novincode)

Even just starring ⭐ the repository helps us grow!
