<?php
/**
 * Storage manager.
 *
 * Routes storage operations to the correct handler.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields storage manager class.
 *
 * @since 1.0.0
 */
class OpenFields_Storage_Manager {

	/**
	 * Instance.
	 *
	 * @var OpenFields_Storage_Manager|null
	 */
	private static $instance = null;

	/**
	 * Meta prefix.
	 * Empty for ACF compatibility - fields save directly with their name.
	 *
	 * @var string
	 */
	const META_PREFIX = '';

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_Storage_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		// Initialize storage handlers.
	}

	/**
	 * Get field value.
	 *
	 * @since  1.0.0
	 * @param  string   $field_name Field name.
	 * @param  int|null $object_id  Object ID.
	 * @param  string   $context    Context (post, user, term, option).
	 * @return mixed
	 */
	public static function get_value( $field_name, $object_id = null, $context = 'post' ) {
		$meta_key = self::META_PREFIX . $field_name;

		switch ( $context ) {
			case 'post':
				$object_id = $object_id ?? get_the_ID();
				return get_post_meta( $object_id, $meta_key, true );

			case 'user':
				$object_id = $object_id ?? get_current_user_id();
				return get_user_meta( $object_id, $meta_key, true );

			case 'term':
				return get_term_meta( $object_id, $meta_key, true );

			case 'option':
				return get_option( $meta_key );

			default:
				return null;
		}
	}

	/**
	 * Update field value.
	 *
	 * @since  1.0.0
	 * @param  string   $field_name Field name.
	 * @param  mixed    $value      Value to store.
	 * @param  int|null $object_id  Object ID.
	 * @param  string   $context    Context (post, user, term, option).
	 * @return bool
	 */
	public static function update_value( $field_name, $value, $object_id = null, $context = 'post' ) {
		$meta_key = self::META_PREFIX . $field_name;

		switch ( $context ) {
			case 'post':
				$object_id = $object_id ?? get_the_ID();
				return update_post_meta( $object_id, $meta_key, $value );

			case 'user':
				$object_id = $object_id ?? get_current_user_id();
				return update_user_meta( $object_id, $meta_key, $value );

			case 'term':
				return update_term_meta( $object_id, $meta_key, $value );

			case 'option':
				return update_option( $meta_key, $value );

			default:
				return false;
		}
	}

	/**
	 * Delete field value.
	 *
	 * @since  1.0.0
	 * @param  string   $field_name Field name.
	 * @param  int|null $object_id  Object ID.
	 * @param  string   $context    Context (post, user, term, option).
	 * @return bool
	 */
	public static function delete_value( $field_name, $object_id = null, $context = 'post' ) {
		$meta_key = self::META_PREFIX . $field_name;

		switch ( $context ) {
			case 'post':
				$object_id = $object_id ?? get_the_ID();
				return delete_post_meta( $object_id, $meta_key );

			case 'user':
				$object_id = $object_id ?? get_current_user_id();
				return delete_user_meta( $object_id, $meta_key );

			case 'term':
				return delete_term_meta( $object_id, $meta_key );

			case 'option':
				return delete_option( $meta_key );

			default:
				return false;
		}
	}

	/**
	 * Get all field values for an object.
	 *
	 * @since  1.0.0
	 * @param  int    $object_id Object ID.
	 * @param  string $context   Context (post, user, term, option).
	 * @return array
	 */
	public static function get_all_values( $object_id, $context = 'post' ) {
		$all_meta = array();

		switch ( $context ) {
			case 'post':
				$all_meta = get_post_meta( $object_id );
				break;

			case 'user':
				$all_meta = get_user_meta( $object_id );
				break;

			case 'term':
				$all_meta = get_term_meta( $object_id );
				break;
		}

		// Filter only our meta keys.
		$values = array();
		$prefix = self::META_PREFIX;

		foreach ( $all_meta as $key => $value ) {
			if ( strpos( $key, $prefix ) === 0 ) {
				$field_name = substr( $key, strlen( $prefix ) );
				$values[ $field_name ] = maybe_unserialize( $value[0] ?? $value );
			}
		}

		return $values;
	}

	/**
	 * Get values for a specific fieldset.
	 *
	 * @since  1.0.0
	 * @param  string   $fieldset_key Fieldset key.
	 * @param  int|null $object_id    Object ID.
	 * @param  string   $context      Context.
	 * @return array
	 */
	public static function get_fieldset_values( $fieldset_key, $object_id = null, $context = 'post' ) {
		global $wpdb;

		// Get fieldset.
		$fieldsets_table = $wpdb->prefix . 'openfields_fieldsets';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldset = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id FROM {$fieldsets_table} WHERE field_key = %s",
				$fieldset_key
			)
		);

		if ( ! $fieldset ) {
			return array();
		}

		// Get fields.
		$fields_table = $wpdb->prefix . 'openfields_fields';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT name FROM {$fields_table} WHERE fieldset_id = %d",
				$fieldset->id
			)
		);

		// Get values.
		$values = array();
		foreach ( $fields as $field ) {
			$values[ $field->name ] = self::get_value( $field->name, $object_id, $context );
		}

		return $values;
	}
}
