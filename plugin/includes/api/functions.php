<?php
/**
 * Public API functions.
 *
 * Developer-facing functions for template use.
 * These functions are ACF-compatible - same function names, same output format.
 * 
 * If ACF is already active, these functions won't be defined to avoid conflicts.
 * Since OpenFields stores data in the same format as ACF, ACF's functions will
 * work with OpenFields data automatically.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// =============================================================================
// ACF COMPATIBILITY NOTICE
// =============================================================================

/**
 * Check if ACF is active and add admin notice if needed.
 */
add_action( 'admin_notices', 'openfields_acf_compatibility_notice' );

function openfields_acf_compatibility_notice() {
	// Only show to admins on OpenFields pages.
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$screen = get_current_screen();
	if ( ! $screen || strpos( $screen->id, 'openfields' ) === false ) {
		return;
	}

	if ( class_exists( 'ACF' ) ) {
		?>
		<div class="notice notice-info is-dismissible">
			<p>
				<strong><?php esc_html_e( 'OpenFields + ACF Detected', 'openfields' ); ?></strong>
				<?php esc_html_e( 'Both plugins are active. OpenFields stores data in ACF-compatible format, so ACF\'s template functions will work with OpenFields data. You can use either plugin\'s API.', 'openfields' ); ?>
			</p>
		</div>
		<?php
	}
}

// =============================================================================
// MAIN API FUNCTIONS (ACF-Compatible)
// Only defined if not already defined by ACF or another plugin.
// =============================================================================

if ( ! function_exists( 'get_field' ) ) {
	/**
	 * Get a field value.
	 *
	 * For repeater fields, if the value is an integer (ACF format row count),
	 * this function returns the reconstructed array of rows.
	 *
	 * For relational fields (post_object, taxonomy, user), applies return_format
	 * to return either ID(s), object(s), or array(s) based on field settings.
	 *
	 * @since 1.0.0
	 *
	 * @param  string   $field_name   Field name.
	 * @param  int|null $object_id    Object ID. Defaults to current post.
	 * @param  bool     $format_value Whether to format the value based on return_format.
	 * @return mixed    Field value.
	 */
	function get_field( $field_name, $object_id = null, $format_value = true ) {
		$context = openfields_detect_context( $object_id );
		$value   = OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );

		// Check if this is a repeater field (value is integer row count).
		if ( is_numeric( $value ) && (int) $value > 0 ) {
			$all_meta = openfields_get_all_meta( $context['id'], $context['type'] );
			$test_key = $field_name . '_0_';

			foreach ( $all_meta as $key => $v ) {
				if ( strpos( $key, $test_key ) === 0 ) {
					return get_rows( $field_name, $object_id );
				}
			}
		}

		// Apply return_format for relational fields if formatting is enabled.
		if ( $format_value && ! empty( $value ) ) {
			$value = openfields_apply_return_format( $field_name, $value );
		}

		return $value;
	}
}

if ( ! function_exists( 'the_field' ) ) {
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

		if ( is_array( $value ) || is_object( $value ) ) {
			return;
		}

		echo esc_html( $value );
	}
}

if ( ! function_exists( 'get_fields' ) ) {
	/**
	 * Get all field values for an object.
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
}

if ( ! function_exists( 'update_field' ) ) {
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
}

if ( ! function_exists( 'delete_field' ) ) {
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
}

if ( ! function_exists( 'get_field_object' ) ) {
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

		$settings = array();
		if ( ! empty( $field['field_config'] ) ) {
			$decoded = json_decode( $field['field_config'], true );
			if ( is_array( $decoded ) ) {
				$settings = $decoded;
			}
		}
		$field['settings'] = $settings;

		return $field;
	}
}

// =============================================================================
// REPEATER / ROW FUNCTIONS (ACF-Compatible)
// =============================================================================

if ( ! function_exists( 'have_rows' ) ) {
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
		global $openfields_rows, $openfields_row_index;

		if ( isset( $openfields_rows[ $field_name ] ) ) {
			$index = $openfields_row_index[ $field_name ] ?? 0;
			return $index < count( $openfields_rows[ $field_name ] );
		}

		$context   = openfields_detect_context( $object_id );
		$row_count = OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );

		if ( is_numeric( $row_count ) ) {
			return (int) $row_count > 0;
		}

		if ( is_array( $row_count ) ) {
			return ! empty( $row_count );
		}

		return false;
	}
}

if ( ! function_exists( 'the_row' ) ) {
	/**
	 * Iterate through repeater rows.
	 *
	 * Usage:
	 * while ( have_rows( 'my_repeater' ) ) {
	 *     the_row();
	 *     echo get_sub_field( 'text_field' );
	 * }
	 *
	 * @since 1.0.0
	 *
	 * @param  string   $field_name Field name (optional).
	 * @param  int|null $object_id  Object ID.
	 * @return bool
	 */
	function the_row( $field_name = '', $object_id = null ) {
		global $openfields_rows, $openfields_row_index, $openfields_row, $openfields_current_field;

		if ( ! empty( $field_name ) ) {
			$openfields_current_field = $field_name;
		} else {
			$field_name = $openfields_current_field ?? '';
		}

		if ( empty( $field_name ) ) {
			return false;
		}

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

		unset( $openfields_rows[ $field_name ], $openfields_row_index[ $field_name ] );
		$openfields_row           = null;
		$openfields_current_field = null;

		return false;
	}
}

if ( ! function_exists( 'get_row' ) ) {
	/**
	 * Get the current row data.
	 *
	 * @since 1.0.0
	 *
	 * @return array|null Current row data.
	 */
	function get_row() {
		global $openfields_row;
		return $openfields_row;
	}
}

if ( ! function_exists( 'get_rows' ) ) {
	/**
	 * Get repeater rows as an array.
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

		if ( is_array( $row_count ) ) {
			return $row_count;
		}

		if ( ! is_numeric( $row_count ) || (int) $row_count <= 0 ) {
			return array();
		}

		$rows     = array();
		$all_meta = openfields_get_all_meta( $context['id'], $context['type'] );
		$prefix_pattern = '/^' . preg_quote( $field_name, '/' ) . '_(\d+)_(.+)$/';

		foreach ( $all_meta as $key => $value ) {
			if ( preg_match( $prefix_pattern, $key, $matches ) ) {
				$index     = (int) $matches[1];
				$sub_field = $matches[2];

				if ( ! isset( $rows[ $index ] ) ) {
					$rows[ $index ] = array();
				}
				$rows[ $index ][ $sub_field ] = $value;
			}
		}

		ksort( $rows );
		return array_values( $rows );
	}
}

if ( ! function_exists( 'reset_rows' ) ) {
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
}

if ( ! function_exists( 'get_row_index' ) ) {
	/**
	 * Get row index (0-based).
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	function get_row_index() {
		global $openfields_row_index, $openfields_current_field;
		$field_name = $openfields_current_field ?? '';
		return ( $openfields_row_index[ $field_name ] ?? 1 ) - 1;
	}
}

if ( ! function_exists( 'get_row_layout' ) ) {
	/**
	 * Get the current row layout (for flexible content fields).
	 *
	 * @since 1.0.0
	 *
	 * @return string|null Layout name.
	 */
	function get_row_layout() {
		global $openfields_row;
		return $openfields_row['acf_fc_layout'] ?? null;
	}
}

// =============================================================================
// SUB-FIELD FUNCTIONS (ACF-Compatible)
// =============================================================================

if ( ! function_exists( 'get_sub_field' ) ) {
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
}

if ( ! function_exists( 'the_sub_field' ) ) {
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
			return;
		}
		echo esc_html( $value );
	}
}

if ( ! function_exists( 'have_sub_field' ) ) {
	/**
	 * Check if a sub-field has a value (alias for have_rows for nested repeaters).
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
}

if ( ! function_exists( 'get_sub_field_object' ) ) {
	/**
	 * Get sub-field object from the current row.
	 *
	 * @since 1.0.0
	 *
	 * @param  string $field_name Sub-field name.
	 * @return array|null
	 */
	function get_sub_field_object( $field_name ) {
		return get_field_object( $field_name );
	}
}

// =============================================================================
// OPENFIELDS-SPECIFIC FUNCTIONS (Always available, prefixed)
// =============================================================================

/**
 * Get a field value without formatting (raw value from database).
 *
 * @since 1.0.0
 *
 * @param  string   $field_name Field name.
 * @param  int|null $object_id  Object ID. Defaults to current post.
 * @return mixed    Raw field value.
 */
function openfields_get_field_raw( $field_name, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::get_value( $field_name, $context['id'], $context['type'] );
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
function openfields_have_field( $field_name, $object_id = null ) {
	$value = function_exists( 'get_field' ) ? get_field( $field_name, $object_id ) : openfields_get_field_raw( $field_name, $object_id );
	return ! empty( $value );
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
function openfields_get_fieldset( $fieldset_key, $object_id = null ) {
	$context = openfields_detect_context( $object_id );
	return OpenFields_Storage_Manager::get_fieldset_values( $fieldset_key, $context['id'], $context['type'] );
}

// =============================================================================
// HELPER FUNCTIONS (Internal, always prefixed)
// =============================================================================

/**
 * Detect context from object ID.
 *
 * @since 1.0.0
 *
 * @param  mixed $object_id Object ID or prefix like 'user_123', 'term_456'.
 * @return array
 */
function openfields_detect_context( $object_id = null ) {
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

	$result = array();
	foreach ( $all as $key => $values ) {
		$result[ $key ] = maybe_unserialize( $values[0] ?? '' );
	}
	return $result;
}

/**
 * Apply return_format to a field value based on field settings.
 *
 * @since 1.0.0
 *
 * @param  string $field_name Field name.
 * @param  mixed  $value      Raw field value.
 * @return mixed  Formatted value.
 */
function openfields_apply_return_format( $field_name, $value ) {
	$field = function_exists( 'get_field_object' ) ? get_field_object( $field_name ) : null;

	if ( ! $field || empty( $field['type'] ) ) {
		return $value;
	}

	$type     = $field['type'];
	$settings = is_array( $field['settings'] ) ? $field['settings'] : array();

	if ( ! in_array( $type, array( 'post_object', 'relationship', 'taxonomy', 'user' ), true ) ) {
		return $value;
	}

	$return_format = $settings['return_format'] ?? 'id';

	if ( 'id' === $return_format ) {
		return $value;
	}

	switch ( $type ) {
		case 'post_object':
		case 'relationship':
			return openfields_format_post_value( $value, $return_format );

		case 'taxonomy':
			return openfields_format_taxonomy_value( $value, $return_format );

		case 'user':
			return openfields_format_user_value( $value, $return_format );

		default:
			return $value;
	}
}

/**
 * Format post value based on return_format.
 *
 * @param  mixed  $value         Post ID or array of IDs.
 * @param  string $return_format 'object' or 'id'.
 * @return mixed
 */
function openfields_format_post_value( $value, $return_format ) {
	if ( 'id' === $return_format ) {
		return $value;
	}

	if ( is_array( $value ) ) {
		return array_filter( array_map( 'get_post', $value ) );
	}

	return get_post( $value ) ?: null;
}

/**
 * Format taxonomy term value based on return_format.
 *
 * @param  mixed  $value         Term ID or array of IDs.
 * @param  string $return_format 'object' or 'id'.
 * @return mixed
 */
function openfields_format_taxonomy_value( $value, $return_format ) {
	if ( 'id' === $return_format ) {
		return $value;
	}

	if ( is_array( $value ) ) {
		return array_filter( array_map( function( $term_id ) {
			return get_term( $term_id );
		}, $value ) );
	}

	return get_term( $value ) ?: null;
}

/**
 * Format user value based on return_format.
 *
 * @param  mixed  $value         User ID or array of IDs.
 * @param  string $return_format 'object', 'array', or 'id'.
 * @return mixed
 */
function openfields_format_user_value( $value, $return_format ) {
	if ( 'id' === $return_format ) {
		return $value;
	}

	if ( is_array( $value ) ) {
		return array_filter( array_map( function( $user_id ) use ( $return_format ) {
			$user = get_userdata( $user_id );
			if ( ! $user ) {
				return null;
			}
			if ( 'array' === $return_format ) {
				return array(
					'ID'           => $user->ID,
					'user_login'   => $user->user_login,
					'user_email'   => $user->user_email,
					'display_name' => $user->display_name,
					'user_url'     => $user->user_url,
				);
			}
			return $user;
		}, $value ) );
	}

	$user = get_userdata( $value );
	if ( ! $user ) {
		return null;
	}

	if ( 'array' === $return_format ) {
		return array(
			'ID'           => $user->ID,
			'user_login'   => $user->user_login,
			'user_email'   => $user->user_email,
			'display_name' => $user->display_name,
			'user_url'     => $user->user_url,
		);
	}

	return $user;
}

// =============================================================================
// REGISTRATION FUNCTIONS (OpenFields-specific, always prefixed)
// =============================================================================

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
			/** This filter is documented in includes/api/functions.php */
			$args = apply_filters( 'openfields_register_fieldset', $args, $key );

			$registered          = get_transient( 'openfields_registered_fieldsets' ) ?: array();
			$registered[ $key ]  = $args;
			set_transient( 'openfields_registered_fieldsets', $registered );
		},
		5
	);
}

/**
 * Check if ACF is active.
 *
 * @since 1.0.0
 *
 * @return bool
 */
function openfields_is_acf_active() {
	return class_exists( 'ACF' );
}
