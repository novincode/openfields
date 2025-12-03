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
 * For repeater fields, if the value is an integer (ACF format row count),
 * this function returns the reconstructed array of rows.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name   Field name.
 * @param  int|null $object_id    Object ID. Defaults to current post.
 * @param  bool     $format_value Whether to format the value (future use).
 * @return mixed    Field value.
 */
function get_field( $field_name, $object_id = null, $format_value = true ) {
	$context = openfields_detect_context( $object_id );
	$value   = OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );

	// Check if this is a repeater field (value is integer row count).
	// ACF stores row count as integer, OpenFields does the same.
	if ( is_numeric( $value ) && (int) $value > 0 ) {
		// Check if there are sub-fields by looking for {field}_0_ pattern.
		$all_meta = openfields_get_all_meta( $context['id'], $context['type'] );
		$test_key = $field_name . '_0_';

		foreach ( $all_meta as $key => $v ) {
			if ( strpos( $key, $test_key ) === 0 ) {
				// This is a repeater field, return rows array.
				return get_rows( $field_name, $object_id );
			}
		}
	}

	return $value;
}

/**
 * Get a field value without formatting (raw value from database).
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return mixed    Raw field value.
 */
function get_field_raw( $field_name, $object_id = null ) {
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

	// Don't echo arrays/objects (like repeater data).
	if ( is_array( $value ) || is_object( $value ) ) {
		return;
	}

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
 * Works with both OpenFields and ACF data formats:
 * - ACF format: {field} = count, {field}_{index}_{subfield} = value
 * - Legacy format: Serialized array
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID.
 * @return bool
 */
function have_rows( $field_name, $object_id = null ) {
	global $openfields_rows, $openfields_row_index;

	// If already initialized in a loop, check if more rows.
	if ( isset( $openfields_rows[ $field_name ] ) ) {
		$index = $openfields_row_index[ $field_name ] ?? 0;
		return $index < count( $openfields_rows[ $field_name ] );
	}

	// Get row count from meta (ACF format stores count as integer).
	$context   = openfields_detect_context( $object_id );
	$row_count = OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );

	// If it's an integer, it's the row count (ACF format).
	if ( is_numeric( $row_count ) ) {
		return (int) $row_count > 0;
	}

	// If it's an array, it's legacy format.
	if ( is_array( $row_count ) ) {
		return ! empty( $row_count );
	}

	return false;
}

/**
 * Get repeater rows as an array.
 *
 * Works with both OpenFields and ACF data formats:
 * - ACF format: Reconstructs rows from flat meta keys
 * - Legacy format: Returns serialized array directly
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID.
 * @return array
 */
function get_rows( $field_name, $object_id = null ) {
	$context   = openfields_detect_context( $object_id );
	$row_count = OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );

	// If it's an array (legacy format), return directly.
	if ( is_array( $row_count ) ) {
		return $row_count;
	}

	// If it's not a positive integer, no rows.
	if ( ! is_numeric( $row_count ) || (int) $row_count <= 0 ) {
		return array();
	}

	$count = (int) $row_count;
	$rows  = array();

	// Reconstruct rows from flat meta keys (ACF format).
	// We need to discover sub-field names by pattern matching.
	$all_meta = openfields_get_all_meta( $context['id'], $context['type'] );

	// Find all keys that start with {field}_{index}_
	$prefix_pattern = '/^' . preg_quote( $field_name, '/' ) . '_(\d+)_(.+)$/';
	$sub_fields     = array();

	foreach ( $all_meta as $key => $value ) {
		if ( preg_match( $prefix_pattern, $key, $matches ) ) {
			$index      = (int) $matches[1];
			$sub_field  = $matches[2];

			if ( ! isset( $rows[ $index ] ) ) {
				$rows[ $index ] = array();
			}
			$rows[ $index ][ $sub_field ] = $value;
		}
	}

	// Re-index to ensure sequential array.
	ksort( $rows );
	return array_values( $rows );
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
	$value = get_sub_field( $field_name );
	if ( is_array( $value ) || is_object( $value ) ) {
		// Don't echo arrays/objects.
		return;
	}
	echo esc_html( $value );
}

/**
 * Check if a sub-field has a value.
 *
 * @since 1.0.0
 *
 * @param  string $field_name Sub-field name.
 * @return bool
 */
function have_sub_field( $field_name ) {
	$value = get_sub_field( $field_name );
	return ! empty( $value );
}

/**
 * Iterate through repeater rows.
 *
 * Usage:
 * while ( have_rows( 'my_repeater' ) ) {
 *     the_row();
 *     echo get_sub_field( 'text_field' );
 * }
 *
 * Note: Use have_rows() as the loop condition, then call the_row() inside.
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name (optional, uses current row context).
 * @param  int|null $object_id  Object ID.
 * @return bool
 */
function the_row( $field_name = '', $object_id = null ) {
	global $openfields_rows, $openfields_row_index, $openfields_row, $openfields_current_field;

	// If field_name is provided, use it. Otherwise use current context.
	if ( ! empty( $field_name ) ) {
		$openfields_current_field = $field_name;
	} else {
		$field_name = $openfields_current_field ?? '';
	}

	if ( empty( $field_name ) ) {
		return false;
	}

	// Initialize if needed.
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
	$openfields_current_field = null;

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
 * Get all meta for an object.
 *
 * @since 1.0.0
 *
 * @param  int    $object_id Object ID.
 * @param  string $type      Context type (post, user, term).
 * @return array
 */
function openfields_get_all_meta( $object_id, $type = 'post' ) {
	switch ( $type ) {
		case 'post':
			$all = get_post_meta( $object_id );
			break;
		case 'user':
			$all = get_user_meta( $object_id );
			break;
		case 'term':
			$all = get_term_meta( $object_id );
			break;
		default:
			return array();
	}

	// WordPress stores meta as arrays, flatten to single values.
	$result = array();
	foreach ( $all as $key => $values ) {
		$result[ $key ] = maybe_unserialize( $values[0] ?? '' );
	}
	return $result;
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
