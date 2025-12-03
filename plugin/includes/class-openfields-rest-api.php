<?php
/**
 * REST API handler.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields REST API class.
 *
 * @since 1.0.0
 */
class OpenFields_REST_API {

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	const NAMESPACE = 'openfields/v1';

	/**
	 * Instance.
	 *
	 * @var OpenFields_REST_API|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_REST_API
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST routes.
	 *
	 * @since 1.0.0
	 */
	public function register_routes() {
		// Fieldsets routes.
		register_rest_route(
			self::NAMESPACE,
			'/fieldsets',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fieldsets' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_fieldset' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
					'args'                => $this->get_fieldset_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/fieldsets/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fieldset' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_fieldset' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
					'args'                => $this->get_fieldset_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_fieldset' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
			)
		);

		// Fields routes.
		register_rest_route(
			self::NAMESPACE,
			'/fieldsets/(?P<fieldset_id>\d+)/fields',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_fields' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_field' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
					'args'                => $this->get_field_args(),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/fields/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_field' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
					'args'                => $this->get_field_update_args(),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_field' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
			)
		);

		// Bulk fields update.
		register_rest_route(
			self::NAMESPACE,
			'/fieldsets/(?P<fieldset_id>\d+)/fields/bulk',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'bulk_update_fields' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Field types.
		register_rest_route(
			self::NAMESPACE,
			'/field-types',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_field_types' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Export/Import.
		register_rest_route(
			self::NAMESPACE,
			'/export/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export_fieldset' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/import',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'import_fieldset' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Location types.
		register_rest_route(
			self::NAMESPACE,
			'/locations/types',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_location_types' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		// Debug endpoint - check locations table.
		register_rest_route(
			self::NAMESPACE,
			'/debug/locations',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'debug_locations' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);
	}

	/**
	 * Check admin permission.
	 *
	 * @since  1.0.0
	 * @return bool|WP_Error
	 */
	public function check_admin_permission() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'openfields_rest_forbidden',
				__( 'You do not have permission to access this resource.', 'openfields' ),
				array( 'status' => 403 )
			);
		}
		return true;
	}

	/**
	 * Get all fieldsets.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_fieldsets( $request ) {
		global $wpdb;

		$table = $wpdb->prefix . 'openfields_fieldsets';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldsets = $wpdb->get_results(
			"SELECT * FROM {$table} ORDER BY menu_order ASC, id ASC",
			ARRAY_A
		);

		// Transform fieldsets to frontend format
		$fieldsets = array_map( array( $this, 'transform_fieldset' ), $fieldsets );

		return rest_ensure_response( $fieldsets );
	}

	/**
	 * Get single fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_fieldset( $request ) {
		global $wpdb;

		$id    = absint( $request['id'] );
		$table = $wpdb->prefix . 'openfields_fieldsets';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldset = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ),
			ARRAY_A
		);

		if ( ! $fieldset ) {
			return new WP_Error(
				'openfields_not_found',
				__( 'Fieldset not found.', 'openfields' ),
				array( 'status' => 404 )
			);
		}

		// Get fields.
		$fields_table       = $wpdb->prefix . 'openfields_fields';
		$fieldset['fields'] = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$fields_table} WHERE fieldset_id = %d ORDER BY menu_order ASC",
				$id
			),
			ARRAY_A
		);

		// Transform to frontend format
		$fieldset = $this->transform_fieldset( $fieldset );

		return rest_ensure_response( $fieldset );
	}

	/**
	 * Create fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_fieldset( $request ) {
		global $wpdb;

		$table = $wpdb->prefix . 'openfields_fieldsets';
		$now   = current_time( 'mysql' );

		$data = array(
			'title'      => sanitize_text_field( $request['title'] ),
			'field_key'  => sanitize_key( $request['field_key'] ?? 'fieldset_' . uniqid() ),
			'description' => sanitize_textarea_field( $request['description'] ?? '' ),
			'status'     => sanitize_key( $request['status'] ?? 'active' ),
			'custom_css' => wp_strip_all_tags( $request['custom_css'] ?? '' ),
			'settings'   => wp_json_encode( $request['settings'] ?? array() ),
			'menu_order' => absint( $request['menu_order'] ?? 0 ),
			'created_at' => $now,
			'updated_at' => $now,
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert( $table, $data );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_create_failed',
				__( 'Failed to create fieldset.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		$data['id'] = $wpdb->insert_id;

		return rest_ensure_response( $data );
	}

	/**
	 * Update fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_fieldset( $request ) {
		global $wpdb;

		$id    = absint( $request['id'] );
		$table = $wpdb->prefix . 'openfields_fieldsets';

		// Debug: log the entire request
		error_log( 'OpenFields Debug - Full request params: ' . print_r( $request->get_params(), true ) );

		// Extract location_groups from settings for saving to locations table
		$settings = $request['settings'] ?? array();
		$location_groups = $settings['location_groups'] ?? array();

		error_log( 'OpenFields Debug - update_fieldset called for ID: ' . $id );
		error_log( 'OpenFields Debug - settings type: ' . gettype( $settings ) );
		error_log( 'OpenFields Debug - settings: ' . print_r( $settings, true ) );
		error_log( 'OpenFields Debug - location_groups count: ' . count( $location_groups ) );

		// Determine status - handle various truthy/falsy values
		$is_active = $request['is_active'] ?? true;
		$status = ( $is_active === false || $is_active === 'false' || $is_active === 0 || $is_active === '0' ) ? 'inactive' : 'active';
		error_log( 'OpenFields Debug - is_active raw: ' . var_export( $request['is_active'], true ) . ', status: ' . $status );

		$data = array(
			'title'       => sanitize_text_field( $request['title'] ),
			'description' => sanitize_textarea_field( $request['description'] ?? '' ),
			'status'      => $status,
			'custom_css'  => wp_strip_all_tags( $request['custom_css'] ?? '' ),
			'settings'    => wp_json_encode( $settings ),
			'menu_order'  => absint( $request['menu_order'] ?? 0 ),
			'updated_at'  => current_time( 'mysql' ),
		);

		// Update field_key if provided
		if ( ! empty( $request['field_key'] ) ) {
			$data['field_key'] = sanitize_key( $request['field_key'] );
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->update( $table, $data, array( 'id' => $id ) );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_update_failed',
				__( 'Failed to update fieldset.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		// Save location groups to locations table
		if ( ! empty( $location_groups ) ) {
			$this->save_location_groups( $id, $location_groups );
		} else {
			// Clear locations if no groups
			$locations_table = $wpdb->prefix . 'openfields_locations';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->delete( $locations_table, array( 'fieldset_id' => $id ) );
		}

		return $this->get_fieldset( $request );
	}

	/**
	 * Delete fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_fieldset( $request ) {
		global $wpdb;

		$id = absint( $request['id'] );

		// Delete fields first.
		$fields_table = $wpdb->prefix . 'openfields_fields';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete( $fields_table, array( 'fieldset_id' => $id ) );

		// Delete locations.
		$locations_table = $wpdb->prefix . 'openfields_locations';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete( $locations_table, array( 'fieldset_id' => $id ) );

		// Delete fieldset.
		$table = $wpdb->prefix . 'openfields_fieldsets';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete( $table, array( 'id' => $id ) );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_delete_failed',
				__( 'Failed to delete fieldset.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array( 'deleted' => true ) );
	}

	/**
	 * Get fields for a fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_fields( $request ) {
		global $wpdb;

		$fieldset_id = absint( $request['fieldset_id'] );
		$table       = $wpdb->prefix . 'openfields_fields';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$table} WHERE fieldset_id = %d ORDER BY menu_order ASC",
				$fieldset_id
			),
			ARRAY_A
		);

		// Transform fields to frontend format
		$fields = array_map( array( $this, 'transform_field' ), $fields );

		return rest_ensure_response( $fields );
	}

	/**
	 * Create field.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_field( $request ) {
		global $wpdb;

		$table = $wpdb->prefix . 'openfields_fields';
		$now   = current_time( 'mysql' );

		// Sanitize and validate field name (becomes meta key).
		$field_name = sanitize_key( $request['name'] );
		if ( empty( $field_name ) ) {
			return new WP_Error(
				'openfields_invalid_field_name',
				__( 'Field name is required and must contain only lowercase letters, numbers, hyphens, and underscores.', 'openfields' ),
				array( 'status' => 400 )
			);
		}

		// Check for duplicate field names in this fieldset.
		$fieldset_id = absint( $request['fieldset_id'] );
		$existing = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$table} WHERE fieldset_id = %d AND name = %s",
				$fieldset_id,
				$field_name
			)
		);

		if ( $existing > 0 ) {
			return new WP_Error(
				'openfields_duplicate_field_name',
				__( 'A field with this name already exists in this fieldset. Field names must be unique within a fieldset.', 'openfields' ),
				array( 'status' => 400 )
			);
		}

		$data = array(
			'fieldset_id'       => $fieldset_id,
			'parent_id'         => ! empty( $request['parent_id'] ) ? absint( $request['parent_id'] ) : null,
			'label'             => sanitize_text_field( $request['label'] ),
			'name'              => $field_name,
			'field_key'         => sanitize_key( $request['field_key'] ?? 'field_' . uniqid() ),
			'type'              => sanitize_key( $request['type'] ),
			'instructions'      => sanitize_textarea_field( $request['instructions'] ?? '' ),
			'required'          => absint( $request['required'] ?? 0 ),
			'default_value'     => sanitize_text_field( $request['default_value'] ?? '' ),
			'placeholder'       => sanitize_text_field( $request['placeholder'] ?? '' ),
			'conditional_logic' => wp_json_encode( $request['conditional_logic'] ?? array() ),
			'wrapper_config'    => wp_json_encode( $request['wrapper_config'] ?? array() ),
			'field_config'      => wp_json_encode( $request['field_config'] ?? array() ),
			'menu_order'        => absint( $request['menu_order'] ?? 0 ),
			'created_at'        => current_time( 'mysql' ),
			'updated_at'        => current_time( 'mysql' ),
		);

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert( $table, $data );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_create_failed',
				__( 'Failed to create field.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		$data['id'] = $wpdb->insert_id;

		// Transform to frontend format
		$data = $this->transform_field( $data );

		return rest_ensure_response( $data );
	}

	/**
	 * Update field.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_field( $request ) {
		global $wpdb;

		$id    = absint( $request['id'] );
		$table = $wpdb->prefix . 'openfields_fields';

		// Start with updated timestamp
		$data = array(
			'updated_at' => current_time( 'mysql' ),
		);

		// Handle all direct field updates - these override settings object values
		if ( isset( $request['label'] ) ) {
			$data['label'] = sanitize_text_field( $request['label'] );
		}
		
		// If name is being changed, validate it.
		if ( isset( $request['name'] ) ) {
			$new_name = sanitize_key( $request['name'] );
			
			if ( empty( $new_name ) ) {
				return new WP_Error(
					'openfields_invalid_field_name',
					__( 'Field name is required and must contain only lowercase letters, numbers, hyphens, and underscores.', 'openfields' ),
					array( 'status' => 400 )
				);
			}

			// Check if this name is already used by another field in the same fieldset.
			$field = $wpdb->get_row(
				$wpdb->prepare( "SELECT fieldset_id FROM {$table} WHERE id = %d", $id )
			);

			if ( $field ) {
				$duplicate = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT COUNT(*) FROM {$table} WHERE fieldset_id = %d AND name = %s AND id != %d",
						$field->fieldset_id,
						$new_name,
						$id
					)
				);

				if ( $duplicate > 0 ) {
					return new WP_Error(
						'openfields_duplicate_field_name',
						__( 'A field with this name already exists in this fieldset. Field names must be unique within a fieldset.', 'openfields' ),
						array( 'status' => 400 )
					);
				}
			}

			$data['name'] = $new_name;
		}
		
		if ( isset( $request['type'] ) ) {
			$data['type'] = sanitize_key( $request['type'] );
		}
		if ( isset( $request['menu_order'] ) ) {
			$data['menu_order'] = absint( $request['menu_order'] );
		}
		
		// Handle fields that can be cleared (empty string is valid)
		if ( array_key_exists( 'instructions', $request->get_params() ) ) {
			$data['instructions'] = sanitize_textarea_field( $request['instructions'] ?? '' );
		}
		if ( array_key_exists( 'default_value', $request->get_params() ) ) {
			$data['default_value'] = sanitize_text_field( $request['default_value'] ?? '' );
		}
		if ( array_key_exists( 'placeholder', $request->get_params() ) ) {
			$data['placeholder'] = sanitize_text_field( $request['placeholder'] ?? '' );
		}
		if ( array_key_exists( 'required', $request->get_params() ) ) {
			$data['required'] = absint( $request['required'] ?? 0 );
		}
		
		// Handle JSON fields - always encode, even if empty (to clear them)
		if ( array_key_exists( 'conditional_logic', $request->get_params() ) ) {
			$value = $request['conditional_logic'];
			$data['conditional_logic'] = ( empty( $value ) ) ? '' : wp_json_encode( $value );
		}
		if ( array_key_exists( 'wrapper_config', $request->get_params() ) ) {
			$value = $request['wrapper_config'];
			$data['wrapper_config'] = ( empty( $value ) ) ? '' : wp_json_encode( $value );
		}
		if ( array_key_exists( 'field_config', $request->get_params() ) ) {
			$value = $request['field_config'];
			$data['field_config'] = ( empty( $value ) ) ? '' : wp_json_encode( $value );
		}

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->update( $table, $data, array( 'id' => $id ) );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_update_failed',
				__( 'Failed to update field.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		// Return the updated field.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$field = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ),
			ARRAY_A
		);

		// Transform to frontend format
		$field = $this->transform_field( $field );

		return rest_ensure_response( $field );
	}

	/**
	 * Delete field.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_field( $request ) {
		global $wpdb;

		$id    = absint( $request['id'] );
		$table = $wpdb->prefix . 'openfields_fields';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->delete( $table, array( 'id' => $id ) );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_delete_failed',
				__( 'Failed to delete field.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array( 'deleted' => true ) );
	}

	/**
	 * Bulk update fields.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function bulk_update_fields( $request ) {
		$fields = $request->get_param( 'fields' );

		if ( ! is_array( $fields ) ) {
			return new WP_Error(
				'openfields_invalid_data',
				__( 'Invalid fields data.', 'openfields' ),
				array( 'status' => 400 )
			);
		}

		foreach ( $fields as $index => $field ) {
			$field_request = new WP_REST_Request( 'PUT' );
			$field_request->set_param( 'id', $field['id'] );
			$field_request->set_param( 'menu_order', $index );

			foreach ( $field as $key => $value ) {
				$field_request->set_param( $key, $value );
			}

			$this->update_field( $field_request );
		}

		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * Get field types.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_field_types( $request ) {
		$field_types = OpenFields_Field_Registry::instance()->get_field_types_for_admin();
		return rest_ensure_response( $field_types );
	}

	/**
	 * Export fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function export_fieldset( $request ) {
		$fieldset = $this->get_fieldset( $request );

		if ( is_wp_error( $fieldset ) ) {
			return $fieldset;
		}

		$export_data = array(
			'version'  => OPENFIELDS_VERSION,
			'exported' => current_time( 'mysql' ),
			'fieldset' => $fieldset->get_data(),
		);

		return rest_ensure_response( $export_data );
	}

	/**
	 * Import fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function import_fieldset( $request ) {
		$import_data = $request->get_json_params();

		if ( ! isset( $import_data['fieldset'] ) ) {
			return new WP_Error(
				'openfields_invalid_import',
				__( 'Invalid import data.', 'openfields' ),
				array( 'status' => 400 )
			);
		}

		// Create fieldset.
		$create_request = new WP_REST_Request( 'POST' );
		$fieldset_data  = $import_data['fieldset'];

		// Generate new key to avoid conflicts.
		$fieldset_data['field_key'] = 'fieldset_' . uniqid();

		foreach ( $fieldset_data as $key => $value ) {
			if ( 'id' !== $key && 'fields' !== $key && 'locations' !== $key ) {
				$create_request->set_param( $key, $value );
			}
		}

		$result = $this->create_fieldset( $create_request );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$new_fieldset = $result->get_data();

		// Import fields.
		if ( ! empty( $fieldset_data['fields'] ) ) {
			foreach ( $fieldset_data['fields'] as $field ) {
				$field_request = new WP_REST_Request( 'POST' );
				$field_request->set_param( 'fieldset_id', $new_fieldset['id'] );
				$field['field_key'] = 'field_' . uniqid();

				foreach ( $field as $key => $value ) {
					if ( 'id' !== $key && 'fieldset_id' !== $key ) {
						$field_request->set_param( $key, $value );
					}
				}

				$this->create_field( $field_request );
			}
		}

		return rest_ensure_response( array( 'imported' => true, 'id' => $new_fieldset['id'] ) );
	}

	/**
	 * Update locations for a fieldset.
	 *
	 * @since 1.0.0
	 * @param int   $fieldset_id Fieldset ID.
	 * @param array $locations   Locations data.
	 */
	private function update_locations( $fieldset_id, $locations ) {
		global $wpdb;

		$table = $wpdb->prefix . 'openfields_locations';

		// Delete existing locations.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete( $table, array( 'fieldset_id' => $fieldset_id ) );

		// Insert new locations.
		foreach ( $locations as $location ) {
			$data = array(
				'fieldset_id' => $fieldset_id,
				'param'       => sanitize_key( $location['param'] ),
				'operator'    => sanitize_key( $location['operator'] ),
				'value'       => sanitize_text_field( $location['value'] ),
				'group_id'    => absint( $location['group_id'] ?? 0 ),
			);

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->insert( $table, $data );
		}
	}

	/**
	 * Save location groups from frontend format to database.
	 *
	 * Converts the frontend format (array of groups with rules) to individual
	 * location rows in the database.
	 *
	 * Frontend format:
	 * [
	 *   { id: '1', rules: [{ type: 'post_type', operator: '==', value: 'page' }] },
	 *   { id: '2', rules: [{ type: 'post_type', operator: '==', value: 'post' }] },
	 * ]
	 *
	 * Database format:
	 * Each rule becomes a row with fieldset_id, param, operator, value, group_id.
	 *
	 * @since 1.0.0
	 * @param int   $fieldset_id    Fieldset ID.
	 * @param array $location_groups Location groups from frontend.
	 */
	private function save_location_groups( $fieldset_id, $location_groups ) {
		global $wpdb;

		error_log( 'OpenFields Debug - save_location_groups called for fieldset ' . $fieldset_id );
		error_log( 'OpenFields Debug - location_groups data: ' . print_r( $location_groups, true ) );

		$table = $wpdb->prefix . 'openfields_locations';

		// Delete existing locations.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->delete( $table, array( 'fieldset_id' => $fieldset_id ) );

		// Insert new locations from groups.
		$group_index = 0;
		foreach ( $location_groups as $group ) {
			$rules = $group['rules'] ?? array();

			foreach ( $rules as $rule ) {
				// Skip empty rules
				if ( empty( $rule['type'] ) ) {
					error_log( 'OpenFields Debug - Skipping empty rule' );
					continue;
				}

				$data = array(
					'fieldset_id' => $fieldset_id,
					'param'       => sanitize_key( $rule['type'] ),
					'operator'    => sanitize_text_field( $rule['operator'] ?? '==' ),
					'value'       => sanitize_text_field( $rule['value'] ?? '' ),
					'group_id'    => $group_index,
				);

				error_log( 'OpenFields Debug - Inserting location: ' . print_r( $data, true ) );

				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$result = $wpdb->insert( $table, $data );
				
				if ( $result === false ) {
					error_log( 'OpenFields Debug - Insert FAILED: ' . $wpdb->last_error );
				}
			}

			$group_index++;
		}
	}

	/**
	 * Debug endpoint to check locations table.
	 *
	 * @since  1.0.0
	 * @return WP_REST_Response
	 */
	public function debug_locations() {
		global $wpdb;

		$fieldsets_table = $wpdb->prefix . 'openfields_fieldsets';
		$locations_table = $wpdb->prefix . 'openfields_locations';

		// Get all fieldsets.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldsets = $wpdb->get_results( "SELECT id, title, status, settings FROM {$fieldsets_table}" );

		// Get all locations.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$locations = $wpdb->get_results( "SELECT * FROM {$locations_table}" );

		return rest_ensure_response(
			array(
				'fieldsets'       => $fieldsets,
				'locations'       => $locations,
				'fieldsets_count' => count( $fieldsets ),
				'locations_count' => count( $locations ),
			)
		);
	}

	/**
	 * Get fieldset arguments for validation.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_fieldset_args() {
		return array(
			'title' => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
		);
	}

	/**
	 * Get field arguments for validation.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_field_args() {
		return array(
			'label' => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'name'  => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
			),
			'type'  => array(
				'required'          => true,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
			),
		);
	}

	/**
	 * Get field update args (all optional for partial updates).
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_field_update_args() {
		return array(
			'label' => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'name'  => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
			),
			'type'  => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_key',
			),
			'instructions' => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_textarea_field',
			),
			'required' => array(
				'required'          => false,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
			'default_value' => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'placeholder' => array(
				'required'          => false,
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
			),
			'conditional_logic' => array(
				'required'          => false,
				'type'              => 'array',
			),
			'wrapper_config' => array(
				'required'          => false,
				'type'              => 'object',
			),
			'field_config' => array(
				'required'          => false,
				'type'              => 'object',
			),
			'settings' => array(
				'required'          => false,
				'type'              => 'object',
			),
			'menu_order' => array(
				'required'          => false,
				'type'              => 'integer',
				'sanitize_callback' => 'absint',
			),
		);
	}

	/**
	 * Transform field for API response.
	 *
	 * Parse JSON fields in field objects.
	 *
	 * @since  1.0.0
	 * @param  array $field Field array.
	 * @return array
	 */
	private function transform_field( $field ) {
		if ( ! empty( $field['conditional_logic'] ) && is_string( $field['conditional_logic'] ) ) {
			$field['conditional_logic'] = json_decode( $field['conditional_logic'], true ) ?: array();
		} else {
			$field['conditional_logic'] = array();
		}
		if ( ! empty( $field['wrapper_config'] ) && is_string( $field['wrapper_config'] ) ) {
			$field['wrapper_config'] = json_decode( $field['wrapper_config'], true ) ?: array();
		} else {
			$field['wrapper_config'] = array();
		}
		if ( ! empty( $field['field_config'] ) && is_string( $field['field_config'] ) ) {
			$field['field_config'] = json_decode( $field['field_config'], true ) ?: array();
		} else {
			$field['field_config'] = array();
		}
		return $field;
	}

	/**
	 * Transform fieldset for API response.
	 *
	 * Maps database format to frontend format:
	 * - status → is_active
	 * - Parse JSON fields
	 *
	 * @since  1.0.0
	 * @param  array $fieldset Fieldset array.
	 * @return array
	 */
	private function transform_fieldset( $fieldset ) {
		global $wpdb;

		// Map status to is_active
		$fieldset['is_active'] = $fieldset['status'] !== 'inactive';

		// Parse JSON fields
		if ( ! empty( $fieldset['settings'] ) && is_string( $fieldset['settings'] ) ) {
			$fieldset['settings'] = json_decode( $fieldset['settings'], true ) ?: array();
		} elseif ( empty( $fieldset['settings'] ) ) {
			$fieldset['settings'] = array();
		}

		// Parse field data if present
		if ( ! empty( $fieldset['fields'] ) && is_array( $fieldset['fields'] ) ) {
			$fieldset['fields'] = array_map( array( $this, 'transform_field' ), $fieldset['fields'] );
		}

		// Get locations if not already present
		if ( ! isset( $fieldset['locations'] ) ) {
			$locations_table = $wpdb->prefix . 'openfields_locations';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$fieldset['locations'] = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$locations_table} WHERE fieldset_id = %d ORDER BY group_id ASC",
					$fieldset['id']
				),
				ARRAY_A
			);
		}

		return $fieldset;
	}

	/**
	 * Get location types.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_location_types( $request ) {
		$manager = OpenFields_Location_Manager::instance();
		$types   = $manager->get_location_types_for_api();

		return rest_ensure_response( $types );
	}
}
