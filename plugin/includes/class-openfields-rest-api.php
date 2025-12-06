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

		// Duplicate fieldset.
		register_rest_route(
			self::NAMESPACE,
			'/fieldsets/(?P<id>\d+)/duplicate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'duplicate_fieldset' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
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
			'/fieldsets/(?P<id>\d+)/export',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'export_fieldset' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/fieldsets/import',
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

		// -----------------------------------------------------------------
		// Relational field search endpoints.
		// -----------------------------------------------------------------

		// Search posts for Post Object / Relationship fields.
		register_rest_route(
			self::NAMESPACE,
			'/search/posts',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search_posts' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
				'args'                => array(
					's'         => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'post_type' => array(
						'type'    => array( 'string', 'array' ),
						'default' => 'post',
					),
					'include'   => array(
						'type' => 'array',
					),
					'exclude'   => array(
						'type' => 'array',
					),
					'per_page'  => array(
						'type'    => 'integer',
						'default' => 20,
					),
					'paged'     => array(
						'type'    => 'integer',
						'default' => 1,
					),
				),
			)
		);

		// Search taxonomy terms.
		register_rest_route(
			self::NAMESPACE,
			'/search/terms',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search_terms' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
				'args'                => array(
					's'        => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'taxonomy' => array(
						'type'     => 'string',
						'default'  => 'category',
						'required' => true,
					),
					'include'  => array(
						'type' => 'array',
					),
					'exclude'  => array(
						'type' => 'array',
					),
					'per_page' => array(
						'type'    => 'integer',
						'default' => 20,
					),
				),
			)
		);

		// Search users.
		register_rest_route(
			self::NAMESPACE,
			'/search/users',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search_users' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
				'args'                => array(
					's'        => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'role'     => array(
						'type'    => array( 'string', 'array' ),
						'default' => '',
					),
					'include'  => array(
						'type' => 'array',
					),
					'exclude'  => array(
						'type' => 'array',
					),
					'per_page' => array(
						'type'    => 'integer',
						'default' => 20,
					),
				),
			)
		);

		// Get available post types.
		register_rest_route(
			self::NAMESPACE,
			'/options/post-types',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_post_types' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
			)
		);

		// Get available taxonomies.
		register_rest_route(
			self::NAMESPACE,
			'/options/taxonomies',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_taxonomies' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
			)
		);

		// Get available user roles.
		register_rest_route(
			self::NAMESPACE,
			'/options/roles',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_user_roles' ),
				'permission_callback' => array( $this, 'check_edit_permission' ),
			)
		);

		// Plugin settings routes.
		register_rest_route(
			self::NAMESPACE,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'check_admin_permission' ),
				),
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
	 * Check edit permission (for relational field searches).
	 *
	 * @since  1.0.0
	 * @return bool|WP_Error
	 */
	public function check_edit_permission() {
		if ( ! current_user_can( 'edit_posts' ) ) {
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

		// Ensure settings is always an array (not a JSON string that would be double-encoded)
		$settings = $request['settings'] ?? array();
		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true ) ?: array();
		}

		$data = array(
			'title'      => sanitize_text_field( $request['title'] ),
			'field_key'  => sanitize_key( $request['field_key'] ?? 'fieldset_' . uniqid() ),
			'description' => sanitize_textarea_field( $request['description'] ?? '' ),
			'status'     => sanitize_key( $request['status'] ?? 'active' ),
			'custom_css' => wp_strip_all_tags( $request['custom_css'] ?? '' ),
			'settings'   => wp_json_encode( $settings ),
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

		// Extract location_groups from settings for saving to locations table.
		// Ensure settings is always an array (not a JSON string that would be double-encoded).
		$settings = $request['settings'] ?? array();
		if ( is_string( $settings ) ) {
			$settings = json_decode( $settings, true ) ?: array();
		}
		$location_groups = $settings['location_groups'] ?? array();

		// Determine status - handle various truthy/falsy values.
		$is_active = $request['is_active'] ?? true;
		$status = ( $is_active === false || $is_active === 'false' || $is_active === 0 || $is_active === '0' ) ? 'inactive' : 'active';

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
	 * Duplicate fieldset.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function duplicate_fieldset( $request ) {
		global $wpdb;

		$id = absint( $request['id'] );

		// Get the fieldset to duplicate
		$table = $wpdb->prefix . 'openfields_fieldsets';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldset = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ),
			ARRAY_A
		);

		if ( ! $fieldset ) {
			return new WP_Error(
				'openfields_fieldset_not_found',
				__( 'Fieldset not found.', 'openfields' ),
				array( 'status' => 404 )
			);
		}

		// Create new fieldset data
		$new_fieldset = array(
			'title'       => $fieldset['title'] . ' (Copy)',
			'field_key'   => 'fieldset_' . uniqid(),
			'description' => $fieldset['description'],
			'status'      => $fieldset['status'],
			'custom_css'  => $fieldset['custom_css'],
			'settings'    => $fieldset['settings'],
			'menu_order'  => $fieldset['menu_order'] + 1,
			'created_at'  => current_time( 'mysql' ),
			'updated_at'  => current_time( 'mysql' ),
		);

		// Insert new fieldset
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		$result = $wpdb->insert( $table, $new_fieldset );

		if ( false === $result ) {
			return new WP_Error(
				'openfields_duplicate_failed',
				__( 'Failed to duplicate fieldset.', 'openfields' ),
				array( 'status' => 500 )
			);
		}

		$new_fieldset_id = $wpdb->insert_id;

		// Duplicate fields
		$fields_table = $wpdb->prefix . 'openfields_fields';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fields = $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$fields_table} WHERE fieldset_id = %d", $id ),
			ARRAY_A
		);

		foreach ( $fields as $field ) {
			$new_field = $field;
			$new_field['fieldset_id'] = $new_fieldset_id;
			$new_field['field_key']   = 'field_' . uniqid();
			$new_field['created_at']  = current_time( 'mysql' );
			$new_field['updated_at']  = current_time( 'mysql' );
			unset( $new_field['id'] );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->insert( $fields_table, $new_field );
		}

		// Duplicate locations
		$locations_table = $wpdb->prefix . 'openfields_locations';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$locations = $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$locations_table} WHERE fieldset_id = %d", $id ),
			ARRAY_A
		);

		foreach ( $locations as $location ) {
			$new_location = $location;
			$new_location['fieldset_id'] = $new_fieldset_id;
			unset( $new_location['id'] );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			$wpdb->insert( $locations_table, $new_location );
		}

		// Return the new fieldset
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$new_fieldset_data = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $new_fieldset_id ),
			ARRAY_A
		);

		$new_fieldset_data = $this->transform_fieldset( $new_fieldset_data );

		return rest_ensure_response( $new_fieldset_data );
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

		// Handle settings - support both 'settings' and 'field_config' for backwards compatibility
		$settings = $request['settings'] ?? $request['field_config'] ?? array();
		$settings = $this->sanitize_field_settings( $settings );

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
			'field_config'      => wp_json_encode( $settings ),
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
		// Handle settings - support both 'settings' and 'field_config' for backwards compatibility
		if ( array_key_exists( 'settings', $request->get_params() ) || array_key_exists( 'field_config', $request->get_params() ) ) {
			$value = $request['settings'] ?? $request['field_config'];
			$value = $this->sanitize_field_settings( $value );
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
		global $wpdb;
		
		$fieldset_id = absint( $request['id'] );
		$table = $wpdb->prefix . 'openfields_fieldsets';
		
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldset = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $fieldset_id ),
			ARRAY_A
		);
		
		if ( ! $fieldset ) {
			return new WP_Error(
				'openfields_fieldset_not_found',
				__( 'Fieldset not found.', 'openfields' ),
				array( 'status' => 404 )
			);
		}

		// Get fields
		$fields_table = $wpdb->prefix . 'openfields_fields';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$fields_table} WHERE fieldset_id = %d ORDER BY menu_order ASC",
				$fieldset_id
			),
			ARRAY_A
		);

		// Decode JSON fields in each field record
		$decoded_fields = array();
		foreach ( $fields as $field ) {
			$decoded_field = $field;
			
			// Decode JSON columns in fields
			foreach ( array( 'conditional_logic', 'wrapper_config', 'field_config' ) as $json_col ) {
				if ( ! empty( $field[ $json_col ] ) && is_string( $field[ $json_col ] ) ) {
					$decoded_field[ $json_col ] = $this->safe_json_decode( $field[ $json_col ] );
				}
			}
			
			$decoded_fields[] = $decoded_field;
		}

		// Get locations
		$locations_table = $wpdb->prefix . 'openfields_locations';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$locations = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$locations_table} WHERE fieldset_id = %d ORDER BY group_id ASC",
				$fieldset_id
			),
			ARRAY_A
		);

		// Safely decode settings - handle multiple levels of encoding corruption
		$raw_settings = $fieldset['settings'] ?? '';
		$settings = $this->safe_json_decode( $raw_settings );
		
		// Remove location_groups from settings for export since it's duplicated in the locations table
		// The locations table is the source of truth
		if ( isset( $settings['location_groups'] ) ) {
			unset( $settings['location_groups'] );
		}

		$export_data = array(
			'version'  => OPENFIELDS_VERSION,
			'exported' => current_time( 'mysql' ),
			'fieldset' => array(
				'title'       => $fieldset['title'],
				'field_key'   => $fieldset['field_key'],
				'description' => $fieldset['description'],
				'status'      => $fieldset['status'],
				'custom_css'  => $fieldset['custom_css'],
				'settings'    => $settings,
				'menu_order'  => $fieldset['menu_order'],
				'fields'      => $decoded_fields,
				'locations'   => $locations,
			),
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
					continue;
				}

				$data = array(
					'fieldset_id' => $fieldset_id,
					'param'       => sanitize_key( $rule['type'] ),
					'operator'    => sanitize_text_field( $rule['operator'] ?? '==' ),
					'value'       => sanitize_text_field( $rule['value'] ?? '' ),
					'group_id'    => $group_index,
				);


				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
				$result = $wpdb->insert( $table, $data );
				
				if ( $result === false ) {
				}
			}

			$group_index++;
		}
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
		// Use safe_json_decode for all JSON fields to handle multi-encoded data
		$field['conditional_logic'] = $this->safe_json_decode( $field['conditional_logic'] ?? '' );
		$field['wrapper_config'] = $this->safe_json_decode( $field['wrapper_config'] ?? '' );
		
		// Transform field_config to settings for frontend
		$field['settings'] = $this->safe_json_decode( $field['field_config'] ?? '' );
		
		// Keep field_config for backwards compatibility
		$field['field_config'] = $this->safe_json_decode( $field['field_config'] ?? '' );
		
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

		// Parse JSON fields - use safe_json_decode to handle multi-encoded data
		$fieldset['settings'] = $this->safe_json_decode( $fieldset['settings'] ?? '' );

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

	/**
	 * Sanitize field settings, including filtering empty choices.
	 *
	 * @since  1.0.0
	 * @param  array $settings Field settings array.
	 * @return array Sanitized settings.
	 */
	private function sanitize_field_settings( $settings ) {
		if ( ! is_array( $settings ) ) {
			return array();
		}

		// Filter empty choices for select, radio, checkbox fields
		if ( isset( $settings['choices'] ) && is_array( $settings['choices'] ) ) {
			$settings['choices'] = array_values( array_filter( $settings['choices'], function( $choice ) {
				// Choice can be a string or an array with value/label
				if ( is_array( $choice ) ) {
					// Keep if either value or label is not empty
					$value = isset( $choice['value'] ) ? trim( $choice['value'] ) : '';
					$label = isset( $choice['label'] ) ? trim( $choice['label'] ) : '';
					return ! empty( $value ) || ! empty( $label );
				}
				// If string, keep if not empty
				return ! empty( trim( (string) $choice ) );
			} ) );
		}

		return $settings;
	}

	/**
	 * Safely decode JSON that may have been multi-encoded.
	 *
	 * This handles cases where JSON strings were accidentally double or triple encoded.
	 * It keeps decoding until we get an array/object or can't decode anymore.
	 *
	 * @since  1.0.0
	 * @param  mixed $value The value to decode.
	 * @return array The decoded array, or empty array if decoding fails.
	 */
	private function safe_json_decode( $value ) {
		// If already an array, return it
		if ( is_array( $value ) ) {
			return $value;
		}

		// If empty or not a string, return empty array
		if ( empty( $value ) || ! is_string( $value ) ) {
			return array();
		}

		// Keep decoding while we have a string that looks like JSON
		$max_iterations = 10; // Safety limit
		$current = $value;
		
		for ( $i = 0; $i < $max_iterations; $i++ ) {
			// Try to decode
			$decoded = json_decode( $current, true );
			
			// If decode failed or returned null, we're done
			if ( json_last_error() !== JSON_ERROR_NONE || $decoded === null ) {
				// If we never successfully decoded to an array, return empty array
				return is_array( $current ) ? $current : array();
			}
			
			// If we got an array, we're done
			if ( is_array( $decoded ) ) {
				return $decoded;
			}
			
			// If we got another string, it might be multi-encoded - keep going
			if ( is_string( $decoded ) ) {
				$current = $decoded;
				continue;
			}
			
			// For any other type (int, bool, etc), return empty array
			return array();
		}

		// Safety fallback
		return array();
	}

	// -----------------------------------------------------------------
	// Relational Field Search Methods.
	// -----------------------------------------------------------------

	/**
	 * Search posts for Post Object / Relationship fields.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function search_posts( $request ) {
		$search    = $request->get_param( 's' );
		$post_type = $request->get_param( 'post_type' );
		$include   = $request->get_param( 'include' );
		$exclude   = $request->get_param( 'exclude' );
		$per_page  = $request->get_param( 'per_page' );
		$paged     = $request->get_param( 'paged' );

		// Ensure post_type is an array.
		if ( ! is_array( $post_type ) ) {
			$post_type = array_filter( explode( ',', $post_type ) );
		}
		if ( empty( $post_type ) ) {
			$post_type = array( 'post' );
		}

		$args = array(
			'post_type'      => $post_type,
			'post_status'    => 'publish',
			'posts_per_page' => min( $per_page, 100 ),
			'paged'          => $paged,
			'orderby'        => 'title',
			'order'          => 'ASC',
		);

		// Search query.
		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}

		// Include specific IDs.
		if ( ! empty( $include ) && is_array( $include ) ) {
			$args['post__in'] = array_map( 'absint', $include );
			$args['orderby']  = 'post__in';
		}

		// Exclude specific IDs.
		if ( ! empty( $exclude ) && is_array( $exclude ) ) {
			$args['post__not_in'] = array_map( 'absint', $exclude );
		}

		$query = new WP_Query( $args );
		$posts = array();

		foreach ( $query->posts as $post ) {
			$posts[] = array(
				'id'         => $post->ID,
				'title'      => $post->post_title,
				'type'       => $post->post_type,
				'type_label' => get_post_type_object( $post->post_type )->labels->singular_name ?? $post->post_type,
				'status'     => $post->post_status,
				'date'       => $post->post_date,
				'link'       => get_permalink( $post->ID ),
				'edit_link'  => get_edit_post_link( $post->ID, 'raw' ),
			);
		}

		return rest_ensure_response( array(
			'results'     => $posts,
			'total'       => $query->found_posts,
			'total_pages' => $query->max_num_pages,
		) );
	}

	/**
	 * Search taxonomy terms.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function search_terms( $request ) {
		$search   = $request->get_param( 's' );
		$taxonomy = $request->get_param( 'taxonomy' );
		$include  = $request->get_param( 'include' );
		$exclude  = $request->get_param( 'exclude' );
		$per_page = $request->get_param( 'per_page' );

		// Validate taxonomy.
		if ( ! taxonomy_exists( $taxonomy ) ) {
			return new WP_Error(
				'invalid_taxonomy',
				__( 'Invalid taxonomy.', 'openfields' ),
				array( 'status' => 400 )
			);
		}

		$args = array(
			'taxonomy'   => $taxonomy,
			'hide_empty' => false,
			'number'     => min( $per_page, 100 ),
			'orderby'    => 'name',
			'order'      => 'ASC',
		);

		// Search query.
		if ( ! empty( $search ) ) {
			$args['search'] = $search;
		}

		// Include specific IDs.
		if ( ! empty( $include ) && is_array( $include ) ) {
			$args['include'] = array_map( 'absint', $include );
		}

		// Exclude specific IDs.
		if ( ! empty( $exclude ) && is_array( $exclude ) ) {
			$args['exclude'] = array_map( 'absint', $exclude );
		}

		$terms  = get_terms( $args );
		$result = array();

		if ( is_wp_error( $terms ) ) {
			return rest_ensure_response( array(
				'results' => array(),
				'total'   => 0,
			) );
		}

		foreach ( $terms as $term ) {
			$result[] = array(
				'id'       => $term->term_id,
				'name'     => $term->name,
				'slug'     => $term->slug,
				'taxonomy' => $term->taxonomy,
				'parent'   => $term->parent,
				'count'    => $term->count,
			);
		}

		// Get total count.
		$count_args          = $args;
		$count_args['count'] = true;
		unset( $count_args['number'] );
		$total = wp_count_terms( $count_args );

		return rest_ensure_response( array(
			'results' => $result,
			'total'   => is_wp_error( $total ) ? count( $result ) : $total,
		) );
	}

	/**
	 * Search users.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function search_users( $request ) {
		$search   = $request->get_param( 's' );
		$role     = $request->get_param( 'role' );
		$include  = $request->get_param( 'include' );
		$exclude  = $request->get_param( 'exclude' );
		$per_page = $request->get_param( 'per_page' );

		$args = array(
			'number'  => min( $per_page, 100 ),
			'orderby' => 'display_name',
			'order'   => 'ASC',
		);

		// Search query.
		if ( ! empty( $search ) ) {
			$args['search']         = '*' . $search . '*';
			$args['search_columns'] = array( 'user_login', 'user_email', 'display_name' );
		}

		// Filter by role.
		if ( ! empty( $role ) ) {
			if ( is_array( $role ) ) {
				$args['role__in'] = $role;
			} else {
				$args['role'] = $role;
			}
		}

		// Include specific IDs.
		if ( ! empty( $include ) && is_array( $include ) ) {
			$args['include'] = array_map( 'absint', $include );
		}

		// Exclude specific IDs.
		if ( ! empty( $exclude ) && is_array( $exclude ) ) {
			$args['exclude'] = array_map( 'absint', $exclude );
		}

		$query = new WP_User_Query( $args );
		$users = array();

		foreach ( $query->get_results() as $user ) {
			$users[] = array(
				'id'           => $user->ID,
				'display_name' => $user->display_name,
				'user_login'   => $user->user_login,
				'user_email'   => $user->user_email,
				'avatar'       => get_avatar_url( $user->ID, array( 'size' => 32 ) ),
				'roles'        => $user->roles,
			);
		}

		return rest_ensure_response( array(
			'results' => $users,
			'total'   => $query->get_total(),
		) );
	}

	/**
	 * Get available post types.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_post_types( $request ) {
		$post_types = get_post_types( array( 'public' => true ), 'objects' );
		$result     = array();

		foreach ( $post_types as $slug => $type ) {
			$result[] = array(
				'value' => $slug,
				'label' => $type->labels->singular_name,
				'icon'  => $type->menu_icon ?? 'dashicons-admin-post',
			);
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Get available taxonomies.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_taxonomies( $request ) {
		$taxonomies = get_taxonomies( array( 'public' => true ), 'objects' );
		$result     = array();

		foreach ( $taxonomies as $slug => $taxonomy ) {
			$result[] = array(
				'value' => $slug,
				'label' => $taxonomy->labels->singular_name,
			);
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Get available user roles.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_user_roles( $request ) {
		global $wp_roles;

		$result = array();
		foreach ( $wp_roles->roles as $slug => $role ) {
			$result[] = array(
				'value' => $slug,
				'label' => $role['name'],
			);
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Get plugin settings.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_settings( $request ) {
		$settings = get_option( 'openfields_settings', array() );

		// Ensure defaults.
		$defaults = array(
			'version'           => OPENFIELDS_VERSION,
			'enable_rest_api'   => true,
			'show_admin_column' => true,
			'delete_data'       => false,
		);

		$settings = wp_parse_args( $settings, $defaults );

		return rest_ensure_response( $settings );
	}

	/**
	 * Update plugin settings.
	 *
	 * @since  1.0.0
	 * @param  WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function update_settings( $request ) {
		$current_settings = get_option( 'openfields_settings', array() );
		$params           = $request->get_params();

		// Only update allowed settings.
		$allowed_keys = array( 'enable_rest_api', 'show_admin_column', 'delete_data' );

		foreach ( $allowed_keys as $key ) {
			if ( isset( $params[ $key ] ) ) {
				$current_settings[ $key ] = $params[ $key ];
			}
		}

		update_option( 'openfields_settings', $current_settings );

		return rest_ensure_response( $current_settings );
	}
}
