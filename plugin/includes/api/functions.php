<?php
/**
 * Public API functions.
 *
 * Developer-facing functions for template use.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get a field value.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return mixed    Field value.
 */
function get_field( $field_name, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );
}

/**
 * Get and echo a field value.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return void
 */
function the_field( $field_name, $object_id = null ) {
	$value = get_field( $field_name, $object_id );
	echo esc_html( $value );
}

/**
 * Update a field value.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  mixed    $value      Value to store.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return bool
 */
function update_field( $field_name, $value, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::update_value( $field_name, $value, $context['id'], $context['type'] );
}

/**
 * Delete a field value.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return bool
 */
function delete_field( $field_name, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::delete_value( $field_name, $context['id'], $context['type'] );
}

/**
 * Get all OpenFields values for an object.
 *
 * @since 1.0.0
 *
 * @param  int|null $object_id Object ID. Defaults to current post.
 * @return array    Array of field values.
 */
function get_fields( $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::get_all_values( $context['id'], $context['type'] );
}

/**
 * Get fields for a specific fieldset.
 *
 * @since 1.0.0
 *
 * @param  string   $fieldset_key Fieldset key.
 * @param  int|null $object_id    Object ID. Defaults to current post.
 * @return array
 */
function get_fieldset( $fieldset_key, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::get_fieldset_values( $fieldset_key, $context['id'], $context['type'] );
}

/**
 * Check if a field has a value.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return bool
 */
function have_field( $field_name, $object_id = null ) {
	$value = get_field( $field_name, $object_id );
	return ! empty( $value );
}

/**
 * Check if repeater has rows.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID.
 * @return bool
 */
function have_rows( $field_name, $object_id = null ) {
	$value = get_field( $field_name, $object_id );
	return is_array( $value ) && ! empty( $value );
}

/**
 * Get repeater rows.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID.
 * @return array
 */
function get_rows( $field_name, $object_id = null ) {
	$value = get_field( $field_name, $object_id );
	return is_array( $value ) ? $value : array();
}

/**
 * Get a sub-field value from the current row.
 *
 * @since 1.0.0
 *
 * @param  string $field_name Sub-field name.
 * @return mixed
 */
function get_sub_field( $field_name ) {
	global $openfields_row;
	return $openfields_row[ $field_name ] ?? null;
}

/**
 * Echo a sub-field value.
 *
 * @since 1.0.0
 *
 * @param  string $field_name Sub-field name.
 * @return void
 */
function the_sub_field( $field_name ) {
	echo esc_html( get_sub_field( $field_name ) );
}

/**
 * Iterate through repeater rows.
 *
 * Usage:
 * while ( the_row( 'my_repeater' ) ) {
 *     echo get_sub_field( 'text_field' );
 * }
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID.
 * @return bool
 */
function the_row( $field_name, $object_id = null ) {
	global $openfields_rows, $openfields_row_index, $openfields_row;

	// Initialize.
	if ( ! isset( $openfields_rows[ $field_name ] ) ) {
		$openfields_rows[ $field_name ]      = get_rows( $field_name, $object_id );
		$openfields_row_index[ $field_name ] = 0;
	}

	$rows  = $openfields_rows[ $field_name ];
	$index = $openfields_row_index[ $field_name ];

	if ( $index < count( $rows ) ) {
		$openfields_row = $rows[ $index ];
		++$openfields_row_index[ $field_name ];
		return true;
	}

	// Reset for next loop.
	unset( $openfields_rows[ $field_name ], $openfields_row_index[ $field_name ] );
	$openfields_row = null;

	return false;
}

/**
 * Reset the row loop.
 *
 * @since 1.0.0
 *
 * @param  string $field_name Field name.
 * @return void
 */
function reset_rows( $field_name = '' ) {
	global $openfields_rows, $openfields_row_index, $openfields_row;

	if ( $field_name && isset( $openfields_rows[ $field_name ] ) ) {
		$openfields_row_index[ $field_name ] = 0;
	} else {
		$openfields_rows      = array();
		$openfields_row_index = array();
	}
	$openfields_row = null;
}

/**
 * Get row index (0-based).
 *
 * @since 1.0.0
 *
 * @param  string $field_name Field name.
 * @return int
 */
function get_row_index( $field_name ) {
	global $openfields_row_index;
	return ( $openfields_row_index[ $field_name ] ?? 1 ) - 1;
}

/**
 * Get field object (schema/settings).
 *
 * @since 1.0.0
 *
 * @param  string $field_name Field name.
 * @return array|null
 */
function get_field_object( $field_name ) {
	global $wpdb;

	$table = $wpdb->prefix . 'openfields_fields';

	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$field = $wpdb->get_row(
		$wpdb->prepare(
			"SELECT * FROM {$table} WHERE name = %s",
			$field_name
		),
		ARRAY_A
	);

	if ( ! $field ) {
		return null;
	}

	$field['settings'] = json_decode( $field['settings'], true );

	return $field;
}

// -----------------------------------------------------------------------------
// Helper functions.
// -----------------------------------------------------------------------------

/**
 * Detect context from object ID.
 *
 * @since 1.0.0
 *
 * @param  mixed $object_id Object ID or prefix like 'user_123', 'term_456'.
 * @return array
 */
function openfields_detect_context( $object_id = null ) {
	// Check for prefixed IDs.
	if ( is_string( $object_id ) ) {
		if ( strpos( $object_id, 'user_' ) === 0 ) {
			return array(
				'type' => 'user',
				'id'   => (int) substr( $object_id, 5 ),
			);
		}

		if ( strpos( $object_id, 'term_' ) === 0 ) {
			return array(
				'type' => 'term',
				'id'   => (int) substr( $object_id, 5 ),
			);
		}

		if ( strpos( $object_id, 'option' ) === 0 ) {
			return array(
				'type' => 'option',
				'id'   => null,
			);
		}
	}

	// Default to post.
	return array(
		'type' => 'post',
		'id'   => $object_id ?? get_the_ID(),
	);
}

/**
 * Register a field type programmatically.
 *
 * @since 1.0.0
 *
 * @param  string $key  Field type key.
 * @param  array  $args Field type arguments.
 * @return void
 */
function openfields_register_field_type( $key, $args ) {
	OpenFields_Field_Registry::instance()->register( $key, $args );
}

/**
 * Register an options page.
 *
 * @since 1.0.0
 *
 * @param  array $args Options page arguments.
 * @return void
 */
function openfields_register_options_page( $args ) {
	$defaults = array(
		'page_title' => '',
		'menu_title' => '',
		'menu_slug'  => '',
		'capability' => 'manage_options',
		'parent'     => '',
		'icon'       => 'dashicons-admin-generic',
		'position'   => null,
	);

	$args = wp_parse_args( $args, $defaults );

	add_action(
		'admin_menu',
		function() use ( $args ) {
			if ( $args['parent'] ) {
				add_submenu_page(
					$args['parent'],
					$args['page_title'],
					$args['menu_title'],
					$args['capability'],
					$args['menu_slug'],
					function() use ( $args ) {
						openfields_render_options_page( $args['menu_slug'] );
					}
				);
			} else {
				add_menu_page(
					$args['page_title'],
					$args['menu_title'],
					$args['capability'],
					$args['menu_slug'],
					function() use ( $args ) {
						openfields_render_options_page( $args['menu_slug'] );
					},
					$args['icon'],
					$args['position']
				);
			}
		}
	);

	// Register for location matching.
	add_filter(
		'openfields_options_pages',
		function( $pages ) use ( $args ) {
			$pages[ $args['menu_slug'] ] = $args['page_title'];
			return $pages;
		}
	);
}

/**
 * Render an options page.
 *
 * @since 1.0.0
 *
 * @param  string $page_slug Page slug.
 * @return void
 */
function openfields_render_options_page( $page_slug ) {
	echo '<div class="wrap">';
	echo '<div id="openfields-options-page" data-page="' . esc_attr( $page_slug ) . '"></div>';
	echo '</div>';
}

/**
 * Register a fieldset programmatically.
 *
 * @since 1.0.0
 *
 * @param  string $key  Fieldset key.
 * @param  array  $args Fieldset arguments.
 * @return void
 */
function openfields_register_fieldset( $key, $args ) {
	$defaults = array(
		'title'    => '',
		'fields'   => array(),
		'location' => array(),
		'position' => 'normal',
		'style'    => 'default',
	);

	$args = wp_parse_args( $args, $defaults );

	add_action(
		'init',
		function() use ( $key, $args ) {
			/**
			 * Filter programmatic fieldset registration.
			 *
			 * @since 1.0.0
			 *
			 * @param array  $args Fieldset arguments.
			 * @param string $key  Fieldset key.
			 */
			$args = apply_filters( 'openfields_register_fieldset', $args, $key );

			// Store in transient for runtime use.
			$registered = get_transient( 'openfields_registered_fieldsets' ) ?: array();
			$registered[ $key ] = $args;
			set_transient( 'openfields_registered_fieldsets', $registered );
		},
		5
	);
}
