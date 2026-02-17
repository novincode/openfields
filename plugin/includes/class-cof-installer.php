<?php
/**
 * Plugin installer.
 *
 * Handles activation, deactivation, and database setup.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields installer class.
 *
 * @since 1.0.0
 */
class COF_Installer {

	/**
	 * Database version.
	 *
	 * @var string
	 */
	const DB_VERSION = '1.0.0';

	/**
	 * Activate the plugin.
	 *
	 * @since 1.0.0
	 */
	public static function activate() {
		self::create_tables();
		self::create_options();
		self::set_version();

		// Set transient for activation redirect.
		set_transient( 'cof_activation_redirect', 1, 30 );

		/**
		 * Fires after plugin activation.
		 *
		 * @since 1.0.0
		 */
		do_action( 'cof/activated' );
	}

	/**
	 * Deactivate the plugin.
	 *
	 * @since 1.0.0
	 */
	public static function deactivate() {
		// Delete activation redirect transient.
		delete_transient( 'cof_activation_redirect' );

		/**
		 * Fires after plugin deactivation.
		 *
		 * @since 1.0.0
		 */
		do_action( 'cof/deactivated' );
	}

	/**
	 * Create database tables.
	 *
	 * @since 1.0.0
	 */
	public static function create_tables() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		// Fieldsets table.
		$fieldsets_table = $wpdb->prefix . 'cof_fieldsets';
		$fieldsets_sql   = "CREATE TABLE {$fieldsets_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			title varchar(255) NOT NULL,
			field_key varchar(64) NOT NULL,
			description text,
			status varchar(20) DEFAULT 'active',
			custom_css text,
			settings longtext,
			menu_order int(11) DEFAULT 0,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY (id),
			UNIQUE KEY field_key_unique (field_key),
			KEY status (status),
			KEY menu_order (menu_order)
		) {$charset_collate};";

		// Fields table.
		$fields_table = $wpdb->prefix . 'cof_fields';
		$fields_sql   = "CREATE TABLE {$fields_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			fieldset_id bigint(20) unsigned NOT NULL,
			parent_id bigint(20) unsigned DEFAULT NULL,
			label varchar(255) NOT NULL,
			name varchar(64) NOT NULL,
			field_key varchar(64) NOT NULL,
			type varchar(64) NOT NULL,
			instructions text,
			required tinyint(1) DEFAULT 0,
			default_value text,
			placeholder varchar(255),
			conditional_logic longtext,
			wrapper_config longtext,
			field_config longtext,
			menu_order int(11) DEFAULT 0,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY (id),
			UNIQUE KEY field_key_unique (field_key),
			KEY fieldset_id (fieldset_id),
			KEY parent_id (parent_id),
			KEY type (type),
			KEY menu_order (menu_order)
		) {$charset_collate};";

		// Location rules table.
		$locations_table = $wpdb->prefix . 'cof_locations';
		$locations_sql   = "CREATE TABLE {$locations_table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			fieldset_id bigint(20) unsigned NOT NULL,
			param varchar(64) NOT NULL,
			operator varchar(20) NOT NULL,
			value varchar(255) NOT NULL,
			group_id int(11) DEFAULT 0,
			PRIMARY KEY (id),
			KEY fieldset_id (fieldset_id),
			KEY param (param),
			KEY group_id (group_id)
		) {$charset_collate};";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		dbDelta( $fieldsets_sql );
		dbDelta( $fields_sql );
		dbDelta( $locations_sql );

		// Store the DB version.
		update_option( 'cof_db_version', self::DB_VERSION );
	}

	/**
	 * Create default options.
	 *
	 * @since 1.0.0
	 */
	public static function create_options() {
		$default_options = array(
			'version'           => COF_VERSION,
			'enable_rest_api'   => true,
			'show_admin_column' => true,
			'delete_data'       => false,
		);

		add_option( 'cof_settings', $default_options );
	}

	/**
	 * Set plugin version.
	 *
	 * @since 1.0.0
	 */
	public static function set_version() {
		update_option( 'cof_version', COF_VERSION );
	}

	/**
	 * Check if database needs update.
	 *
	 * @since  1.0.0
	 * @return bool
	 */
	public static function needs_db_update() {
		$current_db_version = get_option( 'cof_db_version', '0' );
		return version_compare( $current_db_version, self::DB_VERSION, '<' );
	}

	/**
	 * Run database update.
	 *
	 * @since 1.0.0
	 */
	public static function maybe_update_db() {
		if ( self::needs_db_update() ) {
			self::create_tables();
		}
	}

	/**
	 * Get table names.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public static function get_tables() {
		global $wpdb;

		return array(
			'fieldsets' => $wpdb->prefix . 'cof_fieldsets',
			'fields'    => $wpdb->prefix . 'cof_fields',
			'locations' => $wpdb->prefix . 'cof_locations',
		);
	}

	/**
	 * Drop all plugin tables.
	 *
	 * Only used during uninstall if user opts to delete data.
	 *
	 * @since 1.0.0
	 */
	public static function drop_tables() {
		global $wpdb;

		$tables = self::get_tables();

		foreach ( $tables as $table ) {
			$wpdb->query( "DROP TABLE IF EXISTS {$table}" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}
	}
}
