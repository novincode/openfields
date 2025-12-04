<?php
/**
 * Uninstall OpenFields
 *
 * This file runs when the plugin is uninstalled via WordPress admin.
 * It respects the user's preference for data preservation.
 *
 * @package OpenFields
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
function openfields_get_settings() {
	return get_option( 'openfields_settings', array() );
}

/**
 * Check if data should be preserved on uninstall.
 *
 * Default behavior is to PRESERVE data (safe default).
 * Only delete if user explicitly set delete_data to true.
 *
 * @return bool True if data should be preserved.
 */
function openfields_should_preserve_data() {
	$settings = openfields_get_settings();
	
	// Default to preserving data (delete_data = false means preserve)
	// Only delete if explicitly set to true
	return empty( $settings['delete_data'] );
}

/**
 * Delete all plugin data.
 */
function openfields_delete_all_data() {
	global $wpdb;

	// Drop custom tables.
	// Note: Table names are constructed from $wpdb->prefix which is already sanitized,
	// and hardcoded table suffixes, so they are safe.
	$tables = array(
		$wpdb->prefix . 'openfields_fieldsets',
		$wpdb->prefix . 'openfields_fields',
		$wpdb->prefix . 'openfields_locations',
	);

	foreach ( $tables as $table ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DROP TABLE IF EXISTS `{$table}`" );
	}

	// Delete options.
	delete_option( 'openfields_settings' );
	delete_option( 'openfields_version' );
	delete_option( 'openfields_db_version' );

	// Delete all post meta created by OpenFields.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE %s",
			'openfields_%'
		)
	);

	// Delete all term meta created by OpenFields.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->termmeta} WHERE meta_key LIKE %s",
			'openfields_%'
		)
	);

	// Delete all user meta created by OpenFields.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE %s",
			'openfields_%'
		)
	);

	// Delete all comment meta created by OpenFields.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->commentmeta} WHERE meta_key LIKE %s",
			'openfields_%'
		)
	);

	// Clear any transients.
	delete_transient( 'openfields_cache' );
	
	// Delete site transients in multisite.
	delete_site_transient( 'openfields_cache' );

	/**
	 * Fires after all OpenFields data has been deleted.
	 *
	 * @since 1.0.0
	 */
	do_action( 'openfields/uninstalled' );
}

// Main uninstall logic.
if ( openfields_should_preserve_data() ) {
	// User chose to preserve data - do nothing.
	// The plugin files will be deleted but data remains.
	return;
}

// User explicitly chose to delete data.
openfields_delete_all_data();
