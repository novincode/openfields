=== Codeideal Open Fields ===
Contributors: shayancode
Donate link: https://openfields.codeideal.com/support
Tags: custom fields, meta fields, field builder, post meta, custom meta
Requires at least: 6.0
Tested up to: 6.9
Stable tag: 0.4.2
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A free, modern custom fields plugin for WordPress. Build field groups with a visual editor — no code required.

== Description ==

**Codeideal Open Fields** lets you add custom fields to posts, pages, custom post types, taxonomies, and users. The admin interface is built with React and TypeScript — fast, responsive, and intuitive.

All features are free. No premium tier. No locked functionality.

= Quick Start =

`get_field( 'my_field' )` — retrieve any field value.

`the_field( 'my_field' )` — echo a field value directly.

= Template Examples =

**Simple field:**

    <?php echo esc_html( get_field( 'subtitle' ) ); ?>

**Repeater loop:**

    <?php while ( have_rows( 'team_members' ) ) : the_row(); ?>
        <h3><?php the_sub_field( 'name' ); ?></h3>
        <p><?php the_sub_field( 'role' ); ?></p>
    <?php endwhile; ?>

**User field (with prefix):**

    <?php echo esc_html( get_field( 'company', 'user_' . $user_id ) ); ?>

Full API reference and guides: [openfields.codeideal.com/docs](https://openfields.codeideal.com/docs)

= ACF-Compatible API =

If you know ACF, you already know Open Fields. The template API uses the same function names:

* `get_field()` / `the_field()`
* `get_fields()` / `update_field()` / `delete_field()`
* `have_rows()` / `the_row()` / `get_sub_field()` / `the_sub_field()`
* `get_row()` / `get_rows()` / `reset_rows()` / `get_row_index()`
* `get_field_object()` / `get_sub_field_object()`

When ACF is also active, these wrappers are not loaded — no conflicts. Both plugins store data as standard WordPress meta, so they can coexist.

Every function also has a prefixed version (e.g. `cofld_get_field()`) that is always available regardless of other plugins.

= Field Types =

* **Basic:** Text, Textarea, Number, Email, URL, Password
* **Choice:** Select, Checkbox, Radio, Switch
* **Date & Time:** Date, Time, DateTime, Color Picker
* **Media:** Image, File, Gallery
* **Content:** WYSIWYG Editor, Link
* **Relational:** Post Object, Taxonomy, User
* **Layout:** Repeater, Group

= Location Rules =

Assign field groups to:

* Post types (including custom post types)
* Page templates
* Post status / format / category
* Taxonomy terms
* User roles

= Source Code =

The admin JS and CSS are compiled from TypeScript/React source. All other files are uncompressed.

* **Source repo:** [github.com/novincode/openfields](https://github.com/novincode/openfields)
* **Admin source:** [admin/src/](https://github.com/novincode/openfields/tree/main/admin/src)
* **Build:** `pnpm install && pnpm build` (Vite + TypeScript)

== Installation ==

1. Go to **Plugins → Add New** in your WordPress admin
2. Search for **"Codeideal Open Fields"**
3. Click **Install Now**, then **Activate**
4. Go to **Open Fields** in the admin menu to create your first field group

Or install manually:

1. Download from [WordPress.org](https://wordpress.org/plugins/codeideal-open-fields/) or [GitHub Releases](https://github.com/novincode/openfields/releases)
2. Upload the `codeideal-open-fields` folder to `/wp-content/plugins/`
3. Activate through the Plugins menu

== Frequently Asked Questions ==

= Is this really 100% free? =

Yes. Every feature is free. No premium version, no upsells, no locked fields.

= Can I use this alongside ACF? =

Yes. Both plugins store data as standard WordPress post meta. When ACF is active, Open Fields does not redefine ACF's functions — there are no conflicts.

= How do I get field values in my theme? =

Use `get_field( 'field_name' )` or the prefixed `cofld_get_field( 'field_name' )`. Works exactly like you'd expect.

= Does it work with custom post types? =

Yes. Any public or private post type registered in WordPress.

= What about page builders? =

Standard WordPress meta is used, so Elementor, Bricks, Beaver Builder, and others can read the data via their dynamic data features.

== Screenshots ==

1. Field group editor — visual drag-and-drop builder
2. Field configuration — detailed settings for each field
3. Location rules — control where fields appear
4. Easy to use — clean, modern interface

== Changelog ==

= 0.4.1 =
* Added: Full internationalization (i18n) support — all admin UI strings are now translatable
* Added: RTL (right-to-left) language support — admin interface works correctly in RTL languages like Arabic, Hebrew, and Farsi
* Added: Translation-ready React admin, Gutenberg block, and relational fields
* Fixed: Block editor strings now use the correct text domain
* Fixed: wp_set_script_translations() for all JavaScript handles
* Improved: Logical CSS properties for direction-neutral styling

= 0.4.0 =
* Fixed: Duplicate Gutenberg block (cofld/field vs openfields/field) — now registers a single "Open Fields" block
* Updated: Tested with WordPress 6.9.1
* Improved: Plugin page with screenshots, banner, and icon on WordPress.org
* Improved: readme.txt rewritten for clarity with code examples and docs links

= 0.3.0 =
* Security: REST API endpoints now require proper capabilities
* Security: Added capability check to taxonomy save handler
* Security: All output properly escaped
* Changed: Plugin prefix renamed from cof to cofld (5+ chars per WordPress.org guidelines)

= 0.2 =
* Fixed: Dynamic page template options, template matching, field saving, admin loading
* Added: Post category/format location rules, activation redirect, switch renderer

= 0.1.0 =
* Initial release

== Upgrade Notice ==

= 0.4.1 =
Full i18n and RTL support. Translate the plugin into your language at translate.wordpress.org.

= 0.4.0 =
Fixes duplicate block registration. Updated for WordPress 6.9 compatibility.
