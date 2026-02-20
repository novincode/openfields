<?php
/**
 * Uninstall Codeideal Open Fields
 *
 * This file runs when the plugin is uninstalled via WordPress admin.
 * It respects the user's preference for data preservation.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Get plugin settings.
 *
 * @return array Plugin settings.
 */
function cofld_get_settings() {
	return get_option( 'cofld_settings', array() );
}

/**
 * Check if data should be preserved on uninstall.
 *
 * Default behavior is to PRESERVE data (safe default).
 * Only delete if user explicitly set delete_data to true.
 *
 * @return bool True if data should be preserved.
 */
function cofld_should_preserve_data() {
	$settings = cofld_get_settings();
	
	// Default to preserving data (delete_data = false means preserve)
	// Only delete if explicitly set to true
	return empty( $settings['delete_data'] );
}

/**
 * Delete all plugin data.
 */
function cofld_delete_all_data() {
	global $wpdb;

	// Drop custom tables.
	// Note: Table names are constructed from $wpdb->prefix which is already sanitized,
	// and hardcoded table suffixes, so they are safe.
	$tables = array(
		$wpdb->prefix . 'cofld_fieldsets',
		$wpdb->prefix . 'cofld_fields',
		$wpdb->prefix . 'cofld_locations',
	);

	foreach ( $tables as $table ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS `{$table}`" );
	}

	// Delete options.
	delete_option( 'cofld_settings' );
	delete_option( 'cofld_version' );
	delete_option( 'cofld_db_version' );

	// Note: User-created field data is stored as standard WordPress meta
	// (post meta, term meta, user meta) without a plugin-specific prefix.
	// This data is intentionally NOT deleted during uninstall because:
	// 1. It's impossible to distinguish plugin-created meta from other meta.
	// 2. The field names are user-defined and could match any meta key.
	// 3. Preserving this data allows migration to other custom fields plugins.
	// The custom tables (cofld_fieldsets, cofld_fields, cofld_locations) that store
	// the field group definitions ARE deleted above.

	// Clear any transients.
	delete_transient( 'cofld_cache' );
	
	// Delete site transients in multisite.
	delete_site_transient( 'cofld_cache' );

	/**
	 * Fires after all plugin data has been deleted.
	 *
	 * @since 1.0.0
	 */
	do_action( 'cofld/uninstalled' );
}

// Main uninstall logic.
if ( cofld_should_preserve_data() ) {
	// User chose to preserve data - do nothing.
	// The plugin files will be deleted but data remains.
	return;
}

// User explicitly chose to delete data.
cofld_delete_all_data();
