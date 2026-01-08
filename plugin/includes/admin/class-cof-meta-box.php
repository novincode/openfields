<?php
/**
 * Meta box handler.
 *
 * Registers and renders meta boxes for fieldsets using only native WordPress functions.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields meta box class.
 *
 * @since 1.0.0
 */
class COF_Meta_Box {

	/**
	 * Instance.
	 *
	 * @var COF_Meta_Box|null
	 */
	private static $instance = null;

	/**
	 * Meta prefix.
	 * Empty string for ACF compatibility - fields save directly with their name.
	 *
	 * @var string
	 */
	const META_PREFIX = '';

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return COF_Meta_Box
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
		// Post meta boxes.
		add_action( 'add_meta_boxes', array( $this, 'register_meta_boxes' ), 10, 2 );
		add_action( 'save_post', array( $this, 'save_post' ), 10, 3 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Taxonomy term fields.
		add_action( 'admin_init', array( $this, 'register_taxonomy_hooks' ) );

		// User profile fields.
		add_action( 'show_user_profile', array( $this, 'render_user_fields' ) );
		add_action( 'edit_user_profile', array( $this, 'render_user_fields' ) );
		add_action( 'user_new_form', array( $this, 'render_user_fields' ) );
		add_action( 'personal_options_update', array( $this, 'save_user_fields' ) );
		add_action( 'edit_user_profile_update', array( $this, 'save_user_fields' ) );
		add_action( 'user_register', array( $this, 'save_user_fields' ) );

		// Include the unified field renderer first (required by other renderers).
		require_once COF_PLUGIN_DIR . 'includes/fields/class-cof-field-renderer.php';

		// Include field renderers.
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/repeater.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/group.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/post-object.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/taxonomy.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/user.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/link.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/image.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/file.php';
		require_once COF_PLUGIN_DIR . 'includes/admin/field-renderers/gallery.php';
	}

	/**
	 * Enqueue styles and scripts for meta boxes.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page.
	 */
	public function enqueue_styles( $hook ) {
		// List of valid admin pages to load assets.
		$valid_hooks = array(
			'post.php',
			'post-new.php',
			'term.php',
			'edit-tags.php',
			'profile.php',
			'user-edit.php',
			'user-new.php',
		);

		if ( ! in_array( $hook, $valid_hooks, true ) ) {
			return;
		}

		// Enqueue WordPress media library for image/file/gallery fields.
		wp_enqueue_media();

		// Enqueue field styles.
		wp_enqueue_style(
			'cof-fields',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/css/fields.css',
			array(),
			COF_VERSION
		);

		// Enqueue repeater styles.
		wp_enqueue_style(
			'cof-repeater',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/css/repeater.css',
			array( 'cof-fields' ),
			COF_VERSION
		);

		// Enqueue group styles.
		wp_enqueue_style(
			'cof-group',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/css/group.css',
			array( 'cof-fields' ),
			COF_VERSION
		);

		// Enqueue relational field styles.
		wp_enqueue_style(
			'cof-relational',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/css/relational-fields.css',
			array( 'cof-fields', 'dashicons' ),
			COF_VERSION
		);

		// Enqueue field JavaScript.
		wp_enqueue_script(
			'cof-fields',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/js/fields.js',
			array(),
			COF_VERSION,
			true
		);

		// Enqueue repeater JavaScript.
		wp_enqueue_script(
			'cof-repeater',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/js/repeater.js',
			array( 'cof-fields' ),
			COF_VERSION,
			true
		);

		// Enqueue relational fields JavaScript.
		wp_enqueue_script(
			'cof-relational',
			plugin_dir_url( COF_PLUGIN_FILE ) . 'assets/admin/js/relational-fields.js',
			array( 'cof-fields' ),
			COF_VERSION,
			true
		);

		// Localize script with any necessary data.
		wp_localize_script(
			'cof-fields',
			'cofConfig',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'nonce'     => wp_create_nonce( 'cof_ajax' ),
				'restUrl'   => rest_url(),
				'restNonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
	}

	/**
	 * Register meta boxes for fieldsets.
	 *
	 * @since 1.0.0
	 * @param string  $post_type Post type.
	 * @param WP_Post $post      Post object.
	 */
	public function register_meta_boxes( $post_type, $post ) {

		$context = array(
			'post_type'     => $post_type,
			'post_id'       => $post->ID,
			'page_template' => get_page_template_slug( $post->ID ),
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		foreach ( $fieldsets as $fieldset ) {

			$settings = json_decode( $fieldset->settings, true );
			$position = ( $settings['position'] ?? 'normal' ) === 'side' ? 'side' : 'normal';
			$priority = $settings['priority'] ?? 'high';

			add_meta_box(
				'cof-' . $fieldset->field_key,
				$fieldset->title,
				array( $this, 'render_meta_box' ),
				$post_type,
				$position,
				$priority,
				array( 'fieldset_id' => $fieldset->id )
			);
		}
	}

	/**
	 * Render meta box.
	 *
	 * @since 1.0.0
	 * @param WP_Post $post     Post object.
	 * @param array   $meta_box Meta box arguments.
	 */
	public function render_meta_box( $post, $meta_box ) {
		$fieldset_id = $meta_box['args']['fieldset_id'];

		// Nonce for security.
		wp_nonce_field( 'cof_save_' . $fieldset_id, 'cof_nonce_' . $fieldset_id );

		// Get fieldset from database to show description.
		global $wpdb;
		$fieldset = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fieldsets WHERE id = %d",
				$fieldset_id
			)
		);

		// Show fieldset description if available.
		if ( $fieldset && ! empty( $fieldset->description ) ) {
			echo '<p class="cof-fieldset-description">' . wp_kses_post( $fieldset->description ) . '</p>';
		}

		// Get ROOT-LEVEL fields only (no parent_id) from database.
		// Sub-fields are rendered by their parent repeater/group field.
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d AND (parent_id IS NULL OR parent_id = 0) ORDER BY menu_order ASC",
				$fieldset_id
			)
		);

		if ( empty( $fields ) ) {
			echo '<p>' . esc_html__( 'No fields configured.', 'codeideal-open-fields' ) . '</p>';
			return;
		}

		// Render fields in a flex container.
		echo '<div class="cof-meta-box">';
		echo '<div class="cof-fields-container">';

		foreach ( $fields as $field ) {
			$this->render_field( $field, $post->ID );
		}

		echo '</div>';
		echo '</div>';
	}

	/**
	 * Render a single field using the field wrapper.
	 *
	 * @since 1.0.0
	 * @param object $field   Field object from database.
	 * @param int    $post_id Post ID.
	 */
	private function render_field( $field, $post_id ) {
		// Get settings JSON from database.
		// Database has THREE separate JSON columns:
		// - field_config: type-specific settings (choices, min, max, etc.)
		// - wrapper_config: width, class, id
		// - conditional_logic: conditional display rules
		$settings = array();
		if ( ! empty( $field->field_config ) ) {
			$decoded = json_decode( $field->field_config, true );
			$settings = is_array( $decoded ) ? $decoded : array();
		}

		// Get wrapper config from its own column.
		$wrapper_config = array();
		if ( ! empty( $field->wrapper_config ) ) {
			$decoded = json_decode( $field->wrapper_config, true );
			$wrapper_config = is_array( $decoded ) ? $decoded : array();
		}

		// Get conditional logic from its own column.
		$conditional_logic = array();
		if ( ! empty( $field->conditional_logic ) ) {
			$decoded = json_decode( $field->conditional_logic, true );
			$conditional_logic = is_array( $decoded ) ? $decoded : array();
		}

		// Get value from postmeta.
		$meta_key = self::META_PREFIX . $field->name;
		
		// Check if meta key exists in database (not just if it has a value)
		$meta_exists = metadata_exists( 'post', $post_id, $meta_key );
		$value = get_post_meta( $post_id, $meta_key, true );

		// Only use default value if meta key doesn't exist at all in the database
		// If user saved an empty value, the meta key WILL exist (just with empty value)
		if ( ! $meta_exists && ! empty( $field->default_value ) ) {
			$value = $field->default_value;
		}

		// Create config array for wrapper.
		$config = array(
			'label'             => $field->label,
			'name'              => $field->name,
			'instructions'      => $settings['instructions'] ?? ( $field->instructions ?? '' ),
			'required'          => ! empty( $settings['required'] ) || ! empty( $field->required ),
			'default_value'     => $field->default_value ?? '',
			'placeholder'       => $field->placeholder ?? '',
			'conditional_logic' => $conditional_logic,
			'wrapper_config'    => array(
				'width' => isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100,
				'class' => $wrapper_config['class'] ?? '',
				'id'    => $wrapper_config['id'] ?? '',
			),
			'field_config'      => $settings,
		);

		// Start field wrapper.
		$wrapper_width = isset( $config['wrapper_config']['width'] ) ? intval( $config['wrapper_config']['width'] ) : 100;
		$wrapper_width = max( 10, min( 100, $wrapper_width ) );
		$wrapper_class = isset( $config['wrapper_config']['class'] ) ? sanitize_html_class( $config['wrapper_config']['class'] ) : '';
		$wrapper_id = isset( $config['wrapper_config']['id'] ) ? sanitize_html_class( $config['wrapper_config']['id'] ) : '';

		// Build wrapper HTML.
		echo '<div class="cof-field-wrapper cof-field-wrapper--width-' . intval( $wrapper_width ) . '';
		if ( $wrapper_class ) {
			echo ' ' . esc_attr( $wrapper_class );
		}
		echo '" style="width: ' . intval( $wrapper_width ) . '%;"';

		if ( $wrapper_id ) {
			echo ' id="' . esc_attr( $wrapper_id ) . '"';
		}

		// Add field ID for conditional logic lookups
		if ( ! empty( $field->id ) ) {
			echo ' data-field-id="' . esc_attr( $field->id ) . '"';
		}

		// Add conditional logic data if present.
		if ( ! empty( $config['conditional_logic'] ) ) {
			echo ' data-conditional-logic="' . esc_attr( json_encode( $config['conditional_logic'] ) ) . '"';
			echo ' data-conditional-status="hidden"';
		}

		echo '>';

		// Render label section.
		if ( ! empty( $config['label'] ) ) {
			echo '<div class="cof-field-label">';
			echo '<label for="' . esc_attr( self::META_PREFIX . $field->name ) . '">';
			echo esc_html( $config['label'] );

			if ( $config['required'] ) {
				echo '<span class="cof-field-required" aria-label="required">*</span>';
			}

			echo '</label>';
			echo '</div>';
		}

		// Render the input field.
		echo '<div class="cof-field-input">';
		$this->render_input( $field, $value, self::META_PREFIX . $field->name, self::META_PREFIX . $field->name, $settings, $post_id, 'post' );
		echo '</div>';

		// Render description if present.
		if ( ! empty( $config['instructions'] ) ) {
			echo '<p class="cof-field-description">' . wp_kses_post( $config['instructions'] ) . '</p>';
		}

		echo '</div>';
	}

	/**
	 * Render input element based on field type.
	 *
	 * @since 1.0.0
	 * @param object $field      Field database object.
	 * @param mixed  $value      Current value from postmeta.
	 * @param string $field_id   HTML ID attribute.
	 * @param string $field_name HTML name attribute.
	 * @param array  $settings   Field settings from JSON.
	 * @param int    $object_id   Object ID for sub-field value retrieval (post, term, or user ID).
	 * @param string $object_type Object type: 'post', 'term', or 'user'.
	 */
	private function render_input( $field, $value, $field_id, $field_name, $settings, $object_id = 0, $object_type = 'post' ) {
		// Use the centralized field renderer for all field types.
		$context = array(
			'object_id'   => $object_id,
			'object_type' => $object_type,
			'parent_name' => $field->name,
		);

		cof_render_field( $field, $value, $field_id, $field_name, $settings, $context );
	}

	/**
	 * Save post meta when post is saved.
	 *
	 * @since 1.0.0
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @param bool    $update  Is update.
	 */
	public function save_post( $post_id, $post, $update ) {
		// Skip autosave.
		if ( wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// Skip revision.
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		// Check capability.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}


		// Get fieldsets for this post.
		$context = array(
			'post_type' => $post->post_type,
			'post_id'   => $post_id,
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		// Process each fieldset.
		foreach ( $fieldsets as $fieldset ) {
			// Verify nonce.
			$nonce_key = 'cof_nonce_' . $fieldset->id;
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( empty( $_POST[ $nonce_key ] ) ) {
				continue;
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce is immediately verified.
			$nonce = sanitize_text_field( wp_unslash( $_POST[ $nonce_key ] ) );
			if ( ! wp_verify_nonce( $nonce, 'cof_save_' . $fieldset->id ) ) {
				continue;
			}


			// Get ALL fields including sub-fields for saving.
			global $wpdb;
			$all_fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d",
					$fieldset->id
				)
			);

			// Separate root fields from sub-fields.
			$root_fields = array();
			$sub_fields_map = array(); // parent_id => array of sub-fields
			foreach ( $all_fields as $f ) {
				if ( empty( $f->parent_id ) ) {
					$root_fields[] = $f;
				} else {
					if ( ! isset( $sub_fields_map[ $f->parent_id ] ) ) {
						$sub_fields_map[ $f->parent_id ] = array();
					}
					$sub_fields_map[ $f->parent_id ][] = $f;
				}
			}


			// Save each ROOT field.
			foreach ( $root_fields as $field ) {
				if ( $field->type === 'repeater' ) {
					// Handle repeater field in ACF format.
					$this->save_repeater_field( $post_id, $field, $sub_fields_map );
				} elseif ( $field->type === 'group' ) {
					// Handle group field - similar to repeater but without rows.
					$this->save_group_field( $post_id, $field, $sub_fields_map );
				} else {
					// Standard field save.
					$field_name = $field->name;
					$meta_key   = self::META_PREFIX . $field_name;
					// phpcs:ignore WordPress.Security.NonceVerification.Missing
					$raw_value  = isset( $_POST[ $meta_key ] ) ? wp_unslash( $_POST[ $meta_key ] ) : '';


					// Sanitize the value.
					$sanitized_value = $this->sanitize_value( $raw_value, $field->type );


					// Update postmeta with native WordPress function.
					$result = update_post_meta( $post_id, $meta_key, $sanitized_value );


					// Verify it was saved.
					$verify = get_post_meta( $post_id, $meta_key, true );
				}
			}
		}

	}

	/**
	 * Save a repeater field and its sub-fields in ACF-compatible format.
	 *
	 * ACF Format (no prefix, 0-based index):
	 * - {field} = row count
	 * - {field}_{index}_{subfield} = value
	 *
	 * @since 1.0.0
	 * @param int    $post_id        Post ID.
	 * @param object $field          Repeater field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested repeaters.
	 */
	private function save_repeater_field( $post_id, $field, $sub_fields_map, $base_name = '' ) {
		// Base name is just the field name for root repeaters,
		// or parent_index_fieldname for nested repeaters.
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}

		// No prefix for ACF compatibility.
		$meta_key = $base_name;

		// Get row count from POST (stored in hidden input without prefix).
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$row_count = isset( $_POST[ $meta_key ] ) ? absint( $_POST[ $meta_key ] ) : 0;


		// Save row count (ACF format - no prefix).
		update_post_meta( $post_id, $meta_key, $row_count );

		// Get sub-fields for this repeater.
		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		if ( empty( $sub_fields ) ) {
			return;
		}

		// First, clean up old repeater data that might have higher indices.
		$this->cleanup_repeater_meta( $post_id, $base_name, $sub_fields, $row_count );

		// Save each row's sub-field values.
		for ( $i = 0; $i < $row_count; $i++ ) {
			foreach ( $sub_fields as $sub_field ) {
				// Get raw sub-field name (strip parent prefix if present).
				$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $base_name );
				
				// Full name: base_index_subfield (e.g., team_0_name)
				$full_name = $base_name . '_' . $i . '_' . $raw_sub_name;

				// Handle nested repeaters recursively.
				if ( $sub_field->type === 'repeater' ) {
					$this->save_repeater_field( $post_id, $sub_field, $sub_fields_map, $full_name );
				} else {
					// phpcs:ignore WordPress.Security.NonceVerification.Missing
					$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
					$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
					update_post_meta( $post_id, $full_name, $sanitized );
				}
			}
		}
	}

	/**
	 * Save a group field and its sub-fields in ACF-compatible format.
	 *
	 * ACF Format:
	 * - {group}_{subfield} = value
	 *
	 * @since 1.0.0
	 * @param int    $post_id        Post ID.
	 * @param object $field          Group field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested groups.
	 */
	private function save_group_field( $post_id, $field, $sub_fields_map, $base_name = '' ) {
		// Base name is just the field name for root groups,
		// or parent_subfield_name for nested groups.
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}


		// Get sub-fields for this group.
		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		if ( empty( $sub_fields ) ) {
			return;
		}

		// Save each sub-field.
		foreach ( $sub_fields as $sub_field ) {
			// Use the raw sub-field name (strip parent prefix if present).
			$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $field->name );

			// Full meta key: group_subfield (e.g., address_street)
			$full_name = $base_name . '_' . $raw_sub_name;

			if ( $sub_field->type === 'repeater' ) {
				// Nested repeater in group.
				$this->save_repeater_field( $post_id, $sub_field, $sub_fields_map, $full_name );
			} elseif ( $sub_field->type === 'group' ) {
				// Nested group in group.
				$this->save_group_field( $post_id, $sub_field, $sub_fields_map, $full_name );
			} else {
				// Standard sub-field save.
				// phpcs:ignore WordPress.Security.NonceVerification.Missing
				$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
				$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
				update_post_meta( $post_id, $full_name, $sanitized );
			}
		}
	}

	/**
	 * Get raw sub-field name without parent prefix.
	 *
	 * @since 1.0.0
	 * @param string $sub_field_name Full sub-field name.
	 * @param string $parent_name    Parent field name.
	 * @return string Raw name.
	 */
	private function get_raw_subfield_name( $sub_field_name, $parent_name ) {
		$prefix = $parent_name . '_';
		if ( strpos( $sub_field_name, $prefix ) === 0 ) {
			return substr( $sub_field_name, strlen( $prefix ) );
		}
		return $sub_field_name;
	}

	/**
	 * Cleanup old repeater meta values when rows are removed.
	 *
	 * @since 1.0.0
	 * @param int    $post_id    Post ID.
	 * @param string $field_name Repeater field name.
	 * @param array  $sub_fields Sub-field objects.
	 * @param int    $row_count  Current row count.
	 */
	private function cleanup_repeater_meta( $post_id, $field_name, $sub_fields, $row_count ) {
		global $wpdb;

		// Find all meta keys matching this repeater's pattern (no prefix).
		$pattern = $field_name . '_%';
		$existing_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT meta_key FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE %s",
				$post_id,
				$pattern
			)
		);

		foreach ( $existing_keys as $key ) {
			// Extract index from key: {field}_{index}_{subfield}
			$prefix_removed = str_replace( $field_name . '_', '', $key );
			$parts = explode( '_', $prefix_removed, 2 );

			if ( isset( $parts[0] ) && is_numeric( $parts[0] ) ) {
				$index = (int) $parts[0];
				// Delete if index is >= new row count.
				if ( $index >= $row_count ) {
					delete_post_meta( $post_id, $key );
				}
			}
		}
	}

	/**
	 * Sanitize a field value based on type.
	 *
	 * @since  1.0.0
	 * @param  mixed  $value Field value.
	 * @param  string $type  Field type.
	 * @return mixed
	 */
	private function sanitize_value( $value, $type ) {
		switch ( $type ) {
			case 'text':
				return sanitize_text_field( $value );

			case 'email':
				return sanitize_email( $value );

			case 'url':
				return esc_url_raw( $value );

			case 'number':
				return is_numeric( $value ) ? floatval( $value ) : '';

			case 'textarea':
				return sanitize_textarea_field( $value );

			case 'wysiwyg':
				return wp_kses_post( $value );

			case 'select':
			case 'radio':
				return sanitize_text_field( $value );

			case 'checkbox':
				if ( is_array( $value ) ) {
					return array_map( 'sanitize_text_field', $value );
				}
				return sanitize_text_field( $value );

			case 'switch':
				return ! empty( $value ) ? 1 : 0;

			case 'date':
			case 'datetime':
			case 'color':
				return sanitize_text_field( $value );

			case 'image':
			case 'file':
				return absint( $value );

			case 'taxonomy':
				// Taxonomy can be single or multiple term IDs.
				if ( is_array( $value ) ) {
					return array_map( 'absint', array_filter( $value ) );
				}
				return absint( $value );

			case 'post_object':
			case 'relationship':
				// Post object can be single ID or comma-separated IDs.
				if ( is_array( $value ) ) {
					return array_map( 'absint', array_filter( $value ) );
				}
				// Handle comma-separated string from hidden input.
				if ( strpos( (string) $value, ',' ) !== false ) {
					return array_map( 'absint', array_filter( explode( ',', $value ) ) );
				}
				return absint( $value );

			case 'user':
				// User can be single ID or comma-separated IDs.
				if ( is_array( $value ) ) {
					return array_map( 'absint', array_filter( $value ) );
				}
				// Handle comma-separated string from hidden input.
				if ( strpos( (string) $value, ',' ) !== false ) {
					return array_map( 'absint', array_filter( explode( ',', $value ) ) );
				}
				return absint( $value );

			case 'link':
				// Link is an array with url, title, target.
				if ( ! is_array( $value ) ) {
					return array(
						'url'    => '',
						'title'  => '',
						'target' => '',
					);
				}
				return array(
					'url'    => esc_url_raw( $value['url'] ?? '' ),
					'title'  => sanitize_text_field( $value['title'] ?? '' ),
					'target' => sanitize_text_field( $value['target'] ?? '' ),
				);

			default:
				return sanitize_text_field( $value );
		}
	}

	// -------------------------------------------------------------------------
	// Taxonomy Term Fields
	// -------------------------------------------------------------------------

	/**
	 * Register hooks for all taxonomies.
	 *
	 * @since 1.0.0
	 */
	public function register_taxonomy_hooks() {
		$taxonomies = get_taxonomies( array( 'public' => true ) );

		foreach ( $taxonomies as $taxonomy ) {
			// Add fields to "Add New Term" form.
			add_action( "{$taxonomy}_add_form_fields", array( $this, 'render_taxonomy_add_fields' ), 10, 1 );

			// Add fields to "Edit Term" form.
			add_action( "{$taxonomy}_edit_form_fields", array( $this, 'render_taxonomy_edit_fields' ), 10, 2 );

			// Save term fields.
			add_action( "created_{$taxonomy}", array( $this, 'save_taxonomy_fields' ), 10, 2 );
			add_action( "edited_{$taxonomy}", array( $this, 'save_taxonomy_fields' ), 10, 2 );
		}
	}

	/**
	 * Render fields on taxonomy "Add New Term" form.
	 *
	 * @since 1.0.0
	 * @param string $taxonomy Taxonomy slug.
	 */
	public function render_taxonomy_add_fields( $taxonomy ) {
		$context = array(
			'taxonomy' => $taxonomy,
			'term_id'  => 0,
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		if ( empty( $fieldsets ) ) {
			return;
		}

		foreach ( $fieldsets as $fieldset ) {
			echo '<div class="form-field cof-taxonomy-fieldset cof-meta-box">';
			echo '<h3 class="cof-fieldset-title">' . esc_html( $fieldset->title ) . '</h3>';

			wp_nonce_field( 'cof_save_term_' . $fieldset->id, 'cof_term_nonce_' . $fieldset->id );

			echo '<div class="cof-fields-container">';
			$this->render_term_fields( $fieldset->id, 0 );
			echo '</div>';

			echo '</div>';
		}
	}

	/**
	 * Render fields on taxonomy "Edit Term" form.
	 *
	 * @since 1.0.0
	 * @param WP_Term $term     Term object.
	 * @param string  $taxonomy Taxonomy slug.
	 */
	public function render_taxonomy_edit_fields( $term, $taxonomy ) {
		$context = array(
			'taxonomy' => $taxonomy,
			'term_id'  => $term->term_id,
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		if ( empty( $fieldsets ) ) {
			return;
		}

		foreach ( $fieldsets as $fieldset ) {
			echo '<tr class="form-field cof-taxonomy-fieldset-row">';
			echo '<th scope="row" colspan="2">';
			echo '<h3 class="cof-fieldset-title" style="margin: 0; padding: 10px 0;">' . esc_html( $fieldset->title ) . '</h3>';
			echo '</th>';
			echo '</tr>';

			echo '<tr class="form-field">';
			echo '<td colspan="2">';

			wp_nonce_field( 'cof_save_term_' . $fieldset->id, 'cof_term_nonce_' . $fieldset->id );

			echo '<div class="cof-meta-box">';
			echo '<div class="cof-fields-container">';
			$this->render_term_fields( $fieldset->id, $term->term_id );
			echo '</div>';
			echo '</div>';

			echo '</td>';
			echo '</tr>';
		}
	}

	/**
	 * Render fields for a term (both add and edit forms).
	 *
	 * @since 1.0.0
	 * @param int $fieldset_id Fieldset ID.
	 * @param int $term_id     Term ID (0 for new terms).
	 */
	private function render_term_fields( $fieldset_id, $term_id ) {
		global $wpdb;

		// Get ROOT-LEVEL fields only (no parent_id).
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d AND (parent_id IS NULL OR parent_id = 0) ORDER BY menu_order ASC",
				$fieldset_id
			)
		);

		if ( empty( $fields ) ) {
			return;
		}

		foreach ( $fields as $field ) {
			$this->render_term_field( $field, $term_id );
		}
	}

	/**
	 * Render a single field for term meta.
	 *
	 * @since 1.0.0
	 * @param object $field   Field object.
	 * @param int    $term_id Term ID.
	 */
	private function render_term_field( $field, $term_id ) {
		// Get settings from database columns.
		$settings = array();
		if ( ! empty( $field->field_config ) ) {
			$decoded  = json_decode( $field->field_config, true );
			$settings = is_array( $decoded ) ? $decoded : array();
		}

		$wrapper_config = array();
		if ( ! empty( $field->wrapper_config ) ) {
			$decoded        = json_decode( $field->wrapper_config, true );
			$wrapper_config = is_array( $decoded ) ? $decoded : array();
		}

		$conditional_logic = array();
		if ( ! empty( $field->conditional_logic ) ) {
			$decoded           = json_decode( $field->conditional_logic, true );
			$conditional_logic = is_array( $decoded ) ? $decoded : array();
		}

		// Get value from term meta.
		$meta_key = self::META_PREFIX . $field->name;
		$value    = $term_id ? get_term_meta( $term_id, $meta_key, true ) : '';

		// Use default value if no saved value.
		if ( empty( $value ) && ! empty( $field->default_value ) ) {
			$value = $field->default_value;
		}

		// Build wrapper.
		$wrapper_width = isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100;
		$wrapper_width = max( 10, min( 100, $wrapper_width ) );
		$wrapper_class = isset( $wrapper_config['class'] ) ? sanitize_html_class( $wrapper_config['class'] ) : '';
		$wrapper_id    = isset( $wrapper_config['id'] ) ? sanitize_html_class( $wrapper_config['id'] ) : '';

		echo '<div class="cof-field-wrapper cof-field-wrapper--width-' . intval( $wrapper_width );
		if ( $wrapper_class ) {
			echo ' ' . esc_attr( $wrapper_class );
		}
		echo '" style="width: ' . intval( $wrapper_width ) . '%;"';

		if ( $wrapper_id ) {
			echo ' id="' . esc_attr( $wrapper_id ) . '"';
		}

		if ( ! empty( $conditional_logic ) ) {
			echo ' data-conditional-logic="' . esc_attr( wp_json_encode( $conditional_logic ) ) . '"';
			echo ' data-conditional-status="hidden"';
		}

		echo '>';

		// Label.
		if ( ! empty( $field->label ) ) {
			echo '<div class="cof-field-label">';
			echo '<label for="' . esc_attr( $meta_key ) . '">';
			echo esc_html( $field->label );
			if ( ! empty( $settings['required'] ) || ! empty( $field->required ) ) {
				echo '<span class="cof-field-required" aria-label="required">*</span>';
			}
			echo '</label>';
			echo '</div>';
		}

		// Input.
		echo '<div class="cof-field-input">';
		$this->render_input( $field, $value, $meta_key, $meta_key, $settings, $term_id, 'term' );
		echo '</div>';

		// Instructions.
		$instructions = $settings['instructions'] ?? ( $field->instructions ?? '' );
		if ( ! empty( $instructions ) ) {
			echo '<p class="cof-field-description">' . wp_kses_post( $instructions ) . '</p>';
		}

		echo '</div>';
	}

	/**
	 * Save taxonomy term fields.
	 *
	 * @since 1.0.0
	 * @param int $term_id Term ID.
	 * @param int $tt_id   Term taxonomy ID.
	 */
	public function save_taxonomy_fields( $term_id, $tt_id ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldsets = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fieldsets WHERE status = %s",
				'active'
			)
		);

		foreach ( $fieldsets as $fieldset ) {
			$nonce_key = 'cof_term_nonce_' . $fieldset->id;

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( ! isset( $_POST[ $nonce_key ] ) ) {
				continue;
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce is immediately verified.
			$nonce = sanitize_text_field( wp_unslash( $_POST[ $nonce_key ] ) );
			if ( ! wp_verify_nonce( $nonce, 'cof_save_term_' . $fieldset->id ) ) {
				continue;
			}

			// Get ALL fields including sub-fields for saving.
			$all_fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d",
					$fieldset->id
				)
			);

			// Separate root fields from sub-fields.
			$root_fields    = array();
			$sub_fields_map = array();
			foreach ( $all_fields as $f ) {
				if ( empty( $f->parent_id ) ) {
					$root_fields[] = $f;
				} else {
					if ( ! isset( $sub_fields_map[ $f->parent_id ] ) ) {
						$sub_fields_map[ $f->parent_id ] = array();
					}
					$sub_fields_map[ $f->parent_id ][] = $f;
				}
			}

			// Save each ROOT field.
			foreach ( $root_fields as $field ) {
				if ( $field->type === 'repeater' ) {
					// Handle repeater field in ACF format.
					$this->save_repeater_field_for_term( $term_id, $field, $sub_fields_map );
				} elseif ( $field->type === 'group' ) {
					// Handle group field.
					$this->save_group_field_for_term( $term_id, $field, $sub_fields_map );
				} else {
					// Standard field save.
					$meta_key = self::META_PREFIX . $field->name;

					// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
					if ( isset( $_POST[ $meta_key ] ) ) {
						// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
						$value = $this->sanitize_value( wp_unslash( $_POST[ $meta_key ] ), $field->type );
						update_term_meta( $term_id, $meta_key, $value );
					} else {
						// Handle unchecked checkboxes/switches.
						if ( in_array( $field->type, array( 'switch', 'checkbox' ), true ) ) {
							delete_term_meta( $term_id, $meta_key );
						}
					}
				}
			}
		}
	}

	/**
	 * Save a repeater field for term meta.
	 *
	 * @since 1.0.0
	 * @param int    $term_id        Term ID.
	 * @param object $field          Repeater field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested repeaters.
	 */
	private function save_repeater_field_for_term( $term_id, $field, $sub_fields_map, $base_name = '' ) {
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}

		$meta_key  = $base_name;
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in save_taxonomy_fields.
		$row_count = isset( $_POST[ $meta_key ] ) ? absint( $_POST[ $meta_key ] ) : 0;

		// Save row count.
		update_term_meta( $term_id, $meta_key, $row_count );

		// Get sub-fields for this repeater.
		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		if ( empty( $sub_fields ) ) {
			return;
		}

		// Cleanup old data.
		$this->cleanup_repeater_term_meta( $term_id, $base_name, $sub_fields, $row_count );

		// Save each row's sub-field values.
		for ( $i = 0; $i < $row_count; $i++ ) {
			foreach ( $sub_fields as $sub_field ) {
				$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $base_name );
				$full_name    = $base_name . '_' . $i . '_' . $raw_sub_name;

				if ( $sub_field->type === 'repeater' ) {
					$this->save_repeater_field_for_term( $term_id, $sub_field, $sub_fields_map, $full_name );
				} else {
					// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in save_taxonomy_fields.
					$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
					$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
					update_term_meta( $term_id, $full_name, $sanitized );
				}
			}
		}
	}

	/**
	 * Save a group field for term meta.
	 *
	 * @since 1.0.0
	 * @param int    $term_id        Term ID.
	 * @param object $field          Group field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested groups.
	 */
	private function save_group_field_for_term( $term_id, $field, $sub_fields_map, $base_name = '' ) {
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}

		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		foreach ( $sub_fields as $sub_field ) {
			$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $field->name );
			$full_name    = $base_name . '_' . $raw_sub_name;

			if ( $sub_field->type === 'repeater' ) {
				$this->save_repeater_field_for_term( $term_id, $sub_field, $sub_fields_map, $full_name );
			} elseif ( $sub_field->type === 'group' ) {
				$this->save_group_field_for_term( $term_id, $sub_field, $sub_fields_map, $full_name );
			} else {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing
				$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
				$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
				update_term_meta( $term_id, $full_name, $sanitized );
			}
		}
	}

	/**
	 * Cleanup old repeater term meta.
	 *
	 * @since 1.0.0
	 * @param int    $term_id    Term ID.
	 * @param string $field_name Repeater field name.
	 * @param array  $sub_fields Sub-field objects.
	 * @param int    $row_count  Current row count.
	 */
	private function cleanup_repeater_term_meta( $term_id, $field_name, $sub_fields, $row_count ) {
		global $wpdb;

		$pattern       = $field_name . '_%';
		$existing_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT meta_key FROM {$wpdb->termmeta} WHERE term_id = %d AND meta_key LIKE %s",
				$term_id,
				$pattern
			)
		);

		foreach ( $existing_keys as $key ) {
			$prefix_removed = str_replace( $field_name . '_', '', $key );
			$parts          = explode( '_', $prefix_removed, 2 );

			if ( isset( $parts[0] ) && is_numeric( $parts[0] ) ) {
				$index = (int) $parts[0];
				if ( $index >= $row_count ) {
					delete_term_meta( $term_id, $key );
				}
			}
		}
	}

	// -------------------------------------------------------------------------
	// User Profile Fields
	// -------------------------------------------------------------------------

	/**
	 * Render fields on user profile.
	 *
	 * @since 1.0.0
	 * @param WP_User|string $user User object or 'add-new-user'.
	 */
	public function render_user_fields( $user ) {
		$user_id = is_object( $user ) ? $user->ID : 0;
		$roles   = $user_id && is_object( $user ) ? (array) $user->roles : array();

		$context = array(
			'user_roles' => $roles,
			'user_id'    => $user_id,
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		if ( empty( $fieldsets ) ) {
			return;
		}

		foreach ( $fieldsets as $fieldset ) {
			echo '<h2>' . esc_html( $fieldset->title ) . '</h2>';
			echo '<table class="form-table cof-user-fieldset" role="presentation">';
			echo '<tr><td colspan="2">';

			wp_nonce_field( 'cof_save_user_' . $fieldset->id, 'cof_user_nonce_' . $fieldset->id );

			echo '<div class="cof-meta-box">';
			echo '<div class="cof-fields-container">';
			$this->render_user_profile_fields( $fieldset->id, $user_id );
			echo '</div>';
			echo '</div>';

			echo '</td></tr>';
			echo '</table>';
		}
	}

	/**
	 * Render fields for user profile.
	 *
	 * @since 1.0.0
	 * @param int $fieldset_id Fieldset ID.
	 * @param int $user_id     User ID (0 for new users).
	 */
	private function render_user_profile_fields( $fieldset_id, $user_id ) {
		global $wpdb;

		// Get ROOT-LEVEL fields only.
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d AND (parent_id IS NULL OR parent_id = 0) ORDER BY menu_order ASC",
				$fieldset_id
			)
		);

		if ( empty( $fields ) ) {
			return;
		}

		foreach ( $fields as $field ) {
			$this->render_user_field( $field, $user_id );
		}
	}

	/**
	 * Render a single field for user meta.
	 *
	 * @since 1.0.0
	 * @param object $field   Field object.
	 * @param int    $user_id User ID.
	 */
	private function render_user_field( $field, $user_id ) {
		// Get settings from database columns.
		$settings = array();
		if ( ! empty( $field->field_config ) ) {
			$decoded  = json_decode( $field->field_config, true );
			$settings = is_array( $decoded ) ? $decoded : array();
		}

		$wrapper_config = array();
		if ( ! empty( $field->wrapper_config ) ) {
			$decoded        = json_decode( $field->wrapper_config, true );
			$wrapper_config = is_array( $decoded ) ? $decoded : array();
		}

		$conditional_logic = array();
		if ( ! empty( $field->conditional_logic ) ) {
			$decoded           = json_decode( $field->conditional_logic, true );
			$conditional_logic = is_array( $decoded ) ? $decoded : array();
		}

		// Get value from user meta.
		$meta_key = self::META_PREFIX . $field->name;
		$value    = $user_id ? get_user_meta( $user_id, $meta_key, true ) : '';

		// Use default value if no saved value.
		if ( empty( $value ) && ! empty( $field->default_value ) ) {
			$value = $field->default_value;
		}

		// Build wrapper.
		$wrapper_width = isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100;
		$wrapper_width = max( 10, min( 100, $wrapper_width ) );
		$wrapper_class = isset( $wrapper_config['class'] ) ? sanitize_html_class( $wrapper_config['class'] ) : '';
		$wrapper_id    = isset( $wrapper_config['id'] ) ? sanitize_html_class( $wrapper_config['id'] ) : '';

		echo '<div class="cof-field-wrapper cof-field-wrapper--width-' . intval( $wrapper_width );
		if ( $wrapper_class ) {
			echo ' ' . esc_attr( $wrapper_class );
		}
		echo '" style="width: ' . intval( $wrapper_width ) . '%;"';

		if ( $wrapper_id ) {
			echo ' id="' . esc_attr( $wrapper_id ) . '"';
		}

		if ( ! empty( $conditional_logic ) ) {
			echo ' data-conditional-logic="' . esc_attr( wp_json_encode( $conditional_logic ) ) . '"';
			echo ' data-conditional-status="hidden"';
		}

		echo '>';

		// Label.
		if ( ! empty( $field->label ) ) {
			echo '<div class="cof-field-label">';
			echo '<label for="' . esc_attr( $meta_key ) . '">';
			echo esc_html( $field->label );
			if ( ! empty( $settings['required'] ) || ! empty( $field->required ) ) {
				echo '<span class="cof-field-required" aria-label="required">*</span>';
			}
			echo '</label>';
			echo '</div>';
		}

		// Input.
		echo '<div class="cof-field-input">';
		$this->render_input( $field, $value, $meta_key, $meta_key, $settings, $user_id, 'user' );
		echo '</div>';

		// Instructions.
		$instructions = $settings['instructions'] ?? ( $field->instructions ?? '' );
		if ( ! empty( $instructions ) ) {
			echo '<p class="cof-field-description">' . wp_kses_post( $instructions ) . '</p>';
		}

		echo '</div>';
	}

	/**
	 * Save user profile fields.
	 *
	 * @since 1.0.0
	 * @param int $user_id User ID.
	 */
	public function save_user_fields( $user_id ) {
		if ( ! current_user_can( 'edit_user', $user_id ) ) {
			return;
		}

		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldsets = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}cof_fieldsets WHERE status = %s",
				'active'
			)
		);

		foreach ( $fieldsets as $fieldset ) {
			$nonce_key = 'cof_user_nonce_' . $fieldset->id;

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( ! isset( $_POST[ $nonce_key ] ) ) {
				continue;
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce is immediately verified.
			$nonce = sanitize_text_field( wp_unslash( $_POST[ $nonce_key ] ) );
			if ( ! wp_verify_nonce( $nonce, 'cof_save_user_' . $fieldset->id ) ) {
				continue;
			}

			// Get ALL fields including sub-fields for saving.
			$all_fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}cof_fields WHERE fieldset_id = %d",
					$fieldset->id
				)
			);

			// Separate root fields from sub-fields.
			$root_fields    = array();
			$sub_fields_map = array();
			foreach ( $all_fields as $f ) {
				if ( empty( $f->parent_id ) ) {
					$root_fields[] = $f;
				} else {
					if ( ! isset( $sub_fields_map[ $f->parent_id ] ) ) {
						$sub_fields_map[ $f->parent_id ] = array();
					}
					$sub_fields_map[ $f->parent_id ][] = $f;
				}
			}

			// Save each ROOT field.
			foreach ( $root_fields as $field ) {
				if ( $field->type === 'repeater' ) {
					// Handle repeater field in ACF format.
					$this->save_repeater_field_for_user( $user_id, $field, $sub_fields_map );
				} elseif ( $field->type === 'group' ) {
					// Handle group field.
					$this->save_group_field_for_user( $user_id, $field, $sub_fields_map );
				} else {
					// Standard field save.
					$meta_key = self::META_PREFIX . $field->name;

					// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
					if ( isset( $_POST[ $meta_key ] ) ) {
						// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified above.
						$value = $this->sanitize_value( wp_unslash( $_POST[ $meta_key ] ), $field->type );
						update_user_meta( $user_id, $meta_key, $value );
					} else {
						// Handle unchecked checkboxes/switches.
						if ( in_array( $field->type, array( 'switch', 'checkbox' ), true ) ) {
							delete_user_meta( $user_id, $meta_key );
						}
					}
				}
			}
		}
	}

	/**
	 * Save a repeater field for user meta.
	 *
	 * @since 1.0.0
	 * @param int    $user_id        User ID.
	 * @param object $field          Repeater field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested repeaters.
	 */
	private function save_repeater_field_for_user( $user_id, $field, $sub_fields_map, $base_name = '' ) {
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}

		$meta_key  = $base_name;
		// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in save_user_fields.
		$row_count = isset( $_POST[ $meta_key ] ) ? absint( $_POST[ $meta_key ] ) : 0;

		// Save row count.
		update_user_meta( $user_id, $meta_key, $row_count );

		// Get sub-fields for this repeater.
		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		if ( empty( $sub_fields ) ) {
			return;
		}

		// Cleanup old data.
		$this->cleanup_repeater_user_meta( $user_id, $base_name, $sub_fields, $row_count );

		// Save each row's sub-field values.
		for ( $i = 0; $i < $row_count; $i++ ) {
			foreach ( $sub_fields as $sub_field ) {
				$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $base_name );
				$full_name    = $base_name . '_' . $i . '_' . $raw_sub_name;

				if ( $sub_field->type === 'repeater' ) {
					$this->save_repeater_field_for_user( $user_id, $sub_field, $sub_fields_map, $full_name );
				} else {
					// phpcs:ignore WordPress.Security.NonceVerification.Missing -- Nonce verified in save_user_fields.
					$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
					$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
					update_user_meta( $user_id, $full_name, $sanitized );
				}
			}
		}
	}

	/**
	 * Save a group field for user meta.
	 *
	 * @since 1.0.0
	 * @param int    $user_id        User ID.
	 * @param object $field          Group field object.
	 * @param array  $sub_fields_map Map of parent_id => sub-fields.
	 * @param string $base_name      Optional base name for nested groups.
	 */
	private function save_group_field_for_user( $user_id, $field, $sub_fields_map, $base_name = '' ) {
		if ( empty( $base_name ) ) {
			$base_name = $field->name;
		}

		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		foreach ( $sub_fields as $sub_field ) {
			$raw_sub_name = $this->get_raw_subfield_name( $sub_field->name, $field->name );
			$full_name    = $base_name . '_' . $raw_sub_name;

			if ( $sub_field->type === 'repeater' ) {
				$this->save_repeater_field_for_user( $user_id, $sub_field, $sub_fields_map, $full_name );
			} elseif ( $sub_field->type === 'group' ) {
				$this->save_group_field_for_user( $user_id, $sub_field, $sub_fields_map, $full_name );
			} else {
				// phpcs:ignore WordPress.Security.NonceVerification.Missing
				$raw_value = isset( $_POST[ $full_name ] ) ? wp_unslash( $_POST[ $full_name ] ) : '';
				$sanitized = $this->sanitize_value( $raw_value, $sub_field->type );
				update_user_meta( $user_id, $full_name, $sanitized );
			}
		}
	}

	/**
	 * Cleanup old repeater user meta.
	 *
	 * @since 1.0.0
	 * @param int    $user_id    User ID.
	 * @param string $field_name Repeater field name.
	 * @param array  $sub_fields Sub-field objects.
	 * @param int    $row_count  Current row count.
	 */
	private function cleanup_repeater_user_meta( $user_id, $field_name, $sub_fields, $row_count ) {
		global $wpdb;

		$pattern       = $field_name . '_%';
		$existing_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT meta_key FROM {$wpdb->usermeta} WHERE user_id = %d AND meta_key LIKE %s",
				$user_id,
				$pattern
			)
		);

		foreach ( $existing_keys as $key ) {
			$prefix_removed = str_replace( $field_name . '_', '', $key );
			$parts          = explode( '_', $prefix_removed, 2 );

			if ( isset( $parts[0] ) && is_numeric( $parts[0] ) ) {
				$index = (int) $parts[0];
				if ( $index >= $row_count ) {
					delete_user_meta( $user_id, $key );
				}
			}
		}
	}
}
