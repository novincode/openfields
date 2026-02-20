=== Codeideal Open Fields ===
Contributors: shayancode
Donate link: https://codeideal.com
Tags: custom fields, meta fields, field builder, post meta, custom meta
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 0.2.1
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Modern custom fields builder for WordPress. Create and manage custom field groups with an intuitive, developer-friendly interface.

== Description ==

Codeideal Open Fields is a powerful, lightweight, and 100% open-source custom fields plugin for WordPress. Add custom fields to posts, pages, custom post types, taxonomies, and users with an intuitive, modern interface for creating field groups and managing custom data.

= Source Code & Build Instructions =

The admin interface JavaScript (`assets/admin/js/admin.js`) is built from uncompressed React/TypeScript source code included in the development repository.

**Source files:** The full uncompressed source is available at [https://github.com/codeideal/openfields](https://github.com/codeideal/openfields) in the `admin/src/` directory.

**To build from source:**

1. Clone the repository: `git clone https://github.com/codeideal/openfields.git`
2. Install dependencies: `pnpm install`
3. Build the admin JS: `pnpm run build`

The build output is placed in `plugin/assets/admin/js/admin.js`. All other CSS and JavaScript files in the plugin are uncompressed and human-readable.

= Key Features =

* **Modern Interface** - Built with React for a smooth, intuitive user experience
* **Multiple Field Types** - Text, textarea, number, email, URL, select, checkbox, radio, switch, date, time, color picker, image, file, gallery, WYSIWYG editor, link, post object, taxonomy, user, repeater, and group fields
* **Flexible Locations** - Assign field groups to specific post types, page templates, taxonomies, or users
* **Repeater Fields** - Create repeatable sets of fields for dynamic content
* **Group Fields** - Organize related fields into collapsible groups
* **Standards Compatible** - Uses standard WordPress meta storage for maximum compatibility
* **Developer Friendly** - Clean codebase with hooks and filters for customization
* **Lightweight** - No bloat, only what you need
* **100% Free** - All features available, no premium version

= Field Types =

* **Basic Fields**: Text, Textarea, Number, Email, URL, Password
* **Choice Fields**: Select, Checkbox, Radio, Switch (Toggle)
* **Date & Time**: Date Picker, Time Picker, DateTime Picker
* **Media Fields**: Image, File, Gallery
* **Content Fields**: WYSIWYG Editor, Link
* **Relational Fields**: Post Object, Taxonomy, User
* **Layout Fields**: Repeater, Group

= Location Rules =

Assign your field groups based on:

* Post Type (posts, pages, custom post types)
* Page Template
* Post Status
* Taxonomy Terms
* User Role
* And more...

== Installation ==

1. Upload the `codeideal-open-fields` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Open Fields in the admin menu to create your first field group

== Frequently Asked Questions ==

= Is Codeideal Open Fields free? =

Yes! Codeideal Open Fields is 100% free and open source. All features are available without any premium version.

= Can I migrate from other custom fields plugins? =

Codeideal Open Fields uses standard WordPress post meta storage, making it compatible with data from other custom fields plugins. You may need to recreate your field groups manually.

= Does Codeideal Open Fields work with custom post types? =

Yes! Codeideal Open Fields works with all post types, including custom post types created by other plugins or themes.

= Can I use Codeideal Open Fields with page builders? =

Yes, Codeideal Open Fields stores data as standard WordPress post meta, making it compatible with most page builders and themes.

= How do I retrieve field values in my theme? =

Use the standard WordPress functions like `get_post_meta()` or the helper function `get_field()`.

== Screenshots ==

1. Field Groups List - Manage all your custom field groups
2. Field Group Editor - Create and configure fields with an intuitive interface
3. Meta Box Display - See your custom fields on the post edit screen
4. Repeater Fields - Add repeatable sets of fields
5. Location Rules - Control where your fields appear

== Changelog ==

= 0.2 =
* Fixed: Page templates not fetched dynamically — now scans all public post types and block theme templates
* Fixed: Template matching failure when default template is selected (value mismatch between WordPress API and stored rules)
* Fixed: Fields not saving when fieldsets use template, category, or post format location rules
* Fixed: Admin interface failed to load data (localized script variable name mismatch)
* Fixed: Invalid menu icon (dashicons-forms does not exist)
* Fixed: Meta box script localization targeting non-existent script handle
* Fixed: Term and user default value logic overriding intentional "0" or empty values
* Added: Dynamic page template options in location rule builder (fetched from WordPress, no longer hardcoded)
* Added: Post Category and Post Format location rule types in admin UI
* Added: Categories, post formats, and page templates provided to admin via localized data
* Added: Plugin text domain loading for translation support
* Added: Activation redirect transient for first-time setup experience
* Added: Switch field renderer include (was missing)
* Improved: Removed unnecessary flush_rewrite_rules on activation/deactivation
* Improved: Removed phantom scheduled hook cleanup for non-existent cron event
* Improved: Admin mount point ID aligned between PHP and React

= 0.1.1 =
* Rebranded to Codeideal Open Fields
* Improved security and code quality
* Various bug fixes

= 0.1.0 =
* Initial release
* Field types: text, textarea, number, email, URL, select, checkbox, radio, switch, date, time, datetime, color, image, file, gallery, WYSIWYG, link, post object, taxonomy, user, repeater, group
* Location rules for post types, page templates, taxonomies, and users
* Modern React-based admin interface
* REST API for field group management
* Developer hooks and filters

== Upgrade Notice ==

= 0.1.1 =
Rebranded to Codeideal Open Fields with various improvements.
