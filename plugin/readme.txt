=== OpenFields - Custom Fields Builder ===
Contributors: novincode
Donate link: https://openfields.dev
Tags: custom fields, acf alternative, meta box, custom meta, post meta
Requires at least: 6.0
Tested up to: 6.7
Stable tag: 0.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Modern custom fields builder for WordPress - the open-source ACF alternative. Create and manage custom field groups with an intuitive interface.

== Description ==

OpenFields is a powerful and lightweight custom fields plugin that allows you to add custom fields to posts, pages, custom post types, taxonomies, and users. It provides an intuitive, modern interface for creating field groups and managing custom data.

= Key Features =

* **Modern Interface** - Built with React for a smooth, intuitive user experience
* **Multiple Field Types** - Text, textarea, number, email, URL, select, checkbox, radio, switch, date, time, color picker, image, file, gallery, WYSIWYG editor, link, post object, taxonomy, user, repeater, and group fields
* **Flexible Locations** - Assign field groups to specific post types, page templates, taxonomies, or users
* **Repeater Fields** - Create repeatable sets of fields for dynamic content
* **Group Fields** - Organize related fields into collapsible groups
* **ACF Compatible** - Designed with familiar concepts for easy migration
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

1. Upload the `openfields` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to OpenFields in the admin menu to create your first field group

== Frequently Asked Questions ==

= Is OpenFields free? =

Yes! OpenFields is 100% free and open source. All features are available without any premium version.

= Can I migrate from ACF? =

While OpenFields uses similar concepts to ACF, there is no automatic migration tool at this time. You would need to recreate your field groups manually.

= Does OpenFields work with custom post types? =

Yes! OpenFields works with all post types, including custom post types created by other plugins or themes.

= Can I use OpenFields with page builders? =

Yes, OpenFields stores data as standard WordPress post meta, making it compatible with most page builders and themes.

= How do I retrieve field values in my theme? =

Use the standard WordPress functions like `get_post_meta()` or the OpenFields helper function `openfields_get_field()`.

== Screenshots ==

1. Field Groups List - Manage all your custom field groups
2. Field Group Editor - Create and configure fields with an intuitive interface
3. Meta Box Display - See your custom fields on the post edit screen
4. Repeater Fields - Add repeatable sets of fields
5. Location Rules - Control where your fields appear

== Changelog ==

= 0.1.0 =
* Initial release
* Field types: text, textarea, number, email, URL, select, checkbox, radio, switch, date, time, datetime, color, image, file, gallery, WYSIWYG, link, post object, taxonomy, user, repeater, group
* Location rules for post types, page templates, taxonomies, and users
* Modern React-based admin interface
* REST API for field group management
* Developer hooks and filters

== Upgrade Notice ==

= 0.1.0 =
Initial release of OpenFields.
