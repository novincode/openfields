<?php
/**
 * Meta box handler.
 *
 * Registers and renders meta boxes for fieldsets using only native WordPress functions.
 *
 * @package OpenFields
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
class OpenFields_Meta_Box {

	/**
	 * Instance.
	 *
	 * @var OpenFields_Meta_Box|null
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
	 * @return OpenFields_Meta_Box
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
		add_action( 'add_meta_boxes', array( $this, 'register_meta_boxes' ), 10, 2 );
		add_action( 'save_post', array( $this, 'save_post' ), 10, 3 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// Include field renderers.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/field-renderers/repeater.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/field-renderers/post-object.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/field-renderers/taxonomy.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/field-renderers/user.php';
	}

	/**
	 * Enqueue styles and scripts for meta boxes.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page.
	 */
	public function enqueue_styles( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		// Enqueue field styles.
		wp_enqueue_style(
			'openfields-fields',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/css/fields.css',
			array(),
			OPENFIELDS_VERSION
		);

		// Enqueue repeater styles.
		wp_enqueue_style(
			'openfields-repeater',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/css/repeater.css',
			array( 'openfields-fields' ),
			OPENFIELDS_VERSION
		);

		// Enqueue relational field styles.
		wp_enqueue_style(
			'openfields-relational',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/css/relational-fields.css',
			array( 'openfields-fields', 'dashicons' ),
			OPENFIELDS_VERSION
		);

		// Enqueue field JavaScript.
		wp_enqueue_script(
			'openfields-fields',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/js/fields.js',
			array(),
			OPENFIELDS_VERSION,
			true
		);

		// Enqueue repeater JavaScript.
		wp_enqueue_script(
			'openfields-repeater',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/js/repeater.js',
			array( 'openfields-fields' ),
			OPENFIELDS_VERSION,
			true
		);

		// Enqueue relational fields JavaScript.
		wp_enqueue_script(
			'openfields-relational',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/js/relational-fields.js',
			array( 'openfields-fields' ),
			OPENFIELDS_VERSION,
			true
		);

		// Localize script with any necessary data.
		wp_localize_script(
			'openfields-fields',
			'openfieldsConfig',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'nonce'     => wp_create_nonce( 'openfields_ajax' ),
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
		error_log( 'OpenFields: register_meta_boxes called for post_type=' . $post_type . ', post_id=' . $post->ID );

		$context = array(
			'post_type'     => $post_type,
			'post_id'       => $post->ID,
			'page_template' => get_page_template_slug( $post->ID ),
		);

		$fieldsets = OpenFields_Location_Manager::instance()->get_fieldsets_for_context( $context );
		error_log( 'OpenFields: Found ' . count( $fieldsets ) . ' matching fieldsets' );

		foreach ( $fieldsets as $fieldset ) {
			error_log( 'OpenFields: Registering meta box: ' . $fieldset->title . ' (ID: ' . $fieldset->id . ')' );

			$settings = json_decode( $fieldset->settings, true );
			$position = ( $settings['position'] ?? 'normal' ) === 'side' ? 'side' : 'normal';
			$priority = $settings['priority'] ?? 'high';

			add_meta_box(
				'openfields-' . $fieldset->field_key,
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
		wp_nonce_field( 'openfields_save_' . $fieldset_id, 'openfields_nonce_' . $fieldset_id );

		// Get ROOT-LEVEL fields only (no parent_id) from database.
		// Sub-fields are rendered by their parent repeater/group field.
		global $wpdb;
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE fieldset_id = %d AND (parent_id IS NULL OR parent_id = 0) ORDER BY menu_order ASC",
				$fieldset_id
			)
		);

		if ( empty( $fields ) ) {
			echo '<p>' . esc_html__( 'No fields configured.', 'openfields' ) . '</p>';
			return;
		}

		// Render fields in a flex container.
		echo '<div class="openfields-meta-box">';
		echo '<div class="openfields-fields-container">';

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
		$settings = array();
		if ( ! empty( $field->field_config ) ) {
			$decoded = json_decode( $field->field_config, true );
			$settings = is_array( $decoded ) ? $decoded : array();
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
			'conditional_logic' => $settings['conditional_logic'] ?? array(),
			'wrapper_config'    => array(
				'width' => isset( $settings['wrapper']['width'] ) ? intval( $settings['wrapper']['width'] ) : ( isset( $settings['width'] ) ? intval( $settings['width'] ) : 100 ),
				'class' => $settings['wrapper']['class'] ?? ( $settings['wrapper_class'] ?? '' ),
				'id'    => $settings['wrapper']['id'] ?? ( $settings['wrapper_id'] ?? '' ),
			),
			'field_config'      => $settings,
		);

		// Start field wrapper.
		$wrapper_width = isset( $config['wrapper_config']['width'] ) ? intval( $config['wrapper_config']['width'] ) : 100;
		$wrapper_width = max( 10, min( 100, $wrapper_width ) );
		$wrapper_class = isset( $config['wrapper_config']['class'] ) ? sanitize_html_class( $config['wrapper_config']['class'] ) : '';
		$wrapper_id = isset( $config['wrapper_config']['id'] ) ? sanitize_html_class( $config['wrapper_config']['id'] ) : '';

		// Build wrapper HTML.
		echo '<div class="openfields-field-wrapper openfields-field-wrapper--width-' . intval( $wrapper_width ) . '';
		if ( $wrapper_class ) {
			echo ' ' . esc_attr( $wrapper_class );
		}
		echo '" style="width: ' . intval( $wrapper_width ) . '%;"';

		if ( $wrapper_id ) {
			echo ' id="' . esc_attr( $wrapper_id ) . '"';
		}

		// Add conditional logic data if present.
		if ( ! empty( $config['conditional_logic'] ) ) {
			echo ' data-conditional-logic="' . esc_attr( json_encode( $config['conditional_logic'] ) ) . '"';
			echo ' data-conditional-status="hidden"';
		}

		echo '>';

		// Render label section.
		if ( ! empty( $config['label'] ) ) {
			echo '<div class="openfields-field-label">';
			echo '<label for="' . esc_attr( self::META_PREFIX . $field->name ) . '">';
			echo esc_html( $config['label'] );

			if ( $config['required'] ) {
				echo '<span class="openfields-field-required" aria-label="required">*</span>';
			}

			echo '</label>';
			echo '</div>';
		}

		// Render the input field.
		echo '<div class="openfields-field-input">';
		$this->render_input( $field, $value, self::META_PREFIX . $field->name, self::META_PREFIX . $field->name, $settings, $post_id );
		echo '</div>';

		// Render description if present.
		if ( ! empty( $config['instructions'] ) ) {
			echo '<p class="openfields-field-description">' . wp_kses_post( $config['instructions'] ) . '</p>';
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
	 * @param int    $post_id    Post ID for sub-field value retrieval.
	 */
	private function render_input( $field, $value, $field_id, $field_name, $settings, $post_id = 0 ) {
		switch ( $field->type ) {
			case 'repeater':
				// Repeater fields use ACF-compatible format.
				// Field name is passed WITHOUT prefix for internal naming.
				openfields_render_repeater_field( $field, $value, $field_id, $field->name, $settings, $post_id );
				break;

			case 'text':
				$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
				echo '<input type="text" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
				break;

			case 'email':
				$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : 'email@example.com';
				echo '<div class="openfields-input-with-icon openfields-input-icon-left">';
				echo '<span class="openfields-input-icon dashicons dashicons-email"></span>';
				echo '<input type="email" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat openfields-input-has-icon" data-validate="email" />';
				echo '</div>';
				break;

			case 'url':
				$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : 'https://';
				echo '<div class="openfields-input-with-icon openfields-input-icon-left">';
				echo '<span class="openfields-input-icon dashicons dashicons-admin-links"></span>';
				echo '<input type="url" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat openfields-input-has-icon" data-validate="url" />';
				echo '</div>';
				break;

			case 'number':
				$min         = OpenFields_Field_Settings::get_setting( $settings, 'min', '' );
				$max         = OpenFields_Field_Settings::get_setting( $settings, 'max', '' );
				$step        = OpenFields_Field_Settings::get_setting( $settings, 'step', OpenFields_Field_Settings::get_default_for_setting( 'number', 'step' ) );
				$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
				
				$atts = ' id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat"';
				if ( $min !== '' ) {
					$atts .= ' min="' . esc_attr( $min ) . '"';
				}
				if ( $max !== '' ) {
					$atts .= ' max="' . esc_attr( $max ) . '"';
				}
				if ( $step !== '' ) {
					$atts .= ' step="' . esc_attr( $step ) . '"';
				}
				if ( $placeholder ) {
					$atts .= ' placeholder="' . esc_attr( $placeholder ) . '"';
				}
				echo '<input type="number"' . $atts . ' />';
				break;

			case 'textarea':
				$rows        = OpenFields_Field_Settings::get_setting( $settings, 'rows', OpenFields_Field_Settings::get_default_for_setting( 'textarea', 'rows' ) );
				$placeholder = ! empty( $field->placeholder ) ? $field->placeholder : '';
				echo '<textarea id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" rows="' . esc_attr( $rows ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat">' . esc_textarea( $value ) . '</textarea>';
				break;

			case 'select':
				$choices  = OpenFields_Field_Settings::get_setting( $settings, 'choices', array() );
				$multiple = OpenFields_Field_Settings::get_setting( $settings, 'multiple', false );
				$name     = $multiple ? $field_name . '[]' : $field_name;
				echo '<select id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $name ) . '" class="widefat"' . ( $multiple ? ' multiple' : '' ) . '>';
				if ( ! $multiple ) {
					echo '<option value="">-- Select --</option>';
				}
				foreach ( $choices as $choice ) {
					$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
					$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
					$selected     = is_array( $value ) ? in_array( $choice_value, $value, true ) : ( $value === $choice_value );
					echo '<option value="' . esc_attr( $choice_value ) . '"' . selected( $selected, true, false ) . '>' . esc_html( $choice_label ) . '</option>';
				}
				echo '</select>';
				break;

			case 'radio':
				$choices = OpenFields_Field_Settings::get_setting( $settings, 'choices', array() );
				$layout  = OpenFields_Field_Settings::get_setting( $settings, 'layout', 'vertical' );
				echo '<fieldset>';
				foreach ( $choices as $i => $choice ) {
					$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
					$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
					$radio_id     = $field_id . '-' . $i;
					$checked      = $value === $choice_value;
					echo '<label for="' . esc_attr( $radio_id ) . '">';
					echo '<input type="radio" id="' . esc_attr( $radio_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
					echo esc_html( $choice_label );
					echo '</label><br />';
				}
				echo '</fieldset>';
				break;

			case 'checkbox':
				$choices = OpenFields_Field_Settings::get_setting( $settings, 'choices', array() );
				if ( empty( $choices ) ) {
					// Single checkbox.
					$checked = ! empty( $value );
					echo '<label for="' . esc_attr( $field_id ) . '">';
					echo '<input type="checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
					echo esc_html( $settings['checkbox_label'] ?? '' );
					echo '</label>';
				} else {
					// Multiple checkboxes.
					$values = is_array( $value ) ? $value : array();
					echo '<fieldset>';
					foreach ( $choices as $i => $choice ) {
						$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
						$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
						$checkbox_id  = $field_id . '-' . $i;
						$checked      = in_array( $choice_value, $values, true );
						echo '<label for="' . esc_attr( $checkbox_id ) . '">';
						echo '<input type="checkbox" id="' . esc_attr( $checkbox_id ) . '" name="' . esc_attr( $field_name ) . '[]" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
						echo esc_html( $choice_label );
						echo '</label><br />';
					}
					echo '</fieldset>';
				}
				break;

			case 'switch':
				// Render beautiful switch field with Yes/No labels and sliding background.
				// For switches, "0" means unchecked, anything else means checked.
				$checked = ! empty( $value ) && $value !== '0';
				echo '<input type="checkbox" class="openfields-switch-input" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
				echo '<label class="openfields-switch-track" for="' . esc_attr( $field_id ) . '">';
				echo '<div class="openfields-switch-label openfields-switch-label-off">No</div>';
				echo '<div class="openfields-switch-label openfields-switch-label-on">Yes</div>';
				echo '</label>';
				break;
				break;

			case 'date':
				echo '<input type="date" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" />';
				break;

			case 'datetime':
				echo '<input type="datetime-local" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" />';
				break;

			case 'color':
				echo '<input type="color" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" />';
				break;

			case 'image':
				$attachment_id = absint( $value );
				echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $attachment_id ) . '" />';
				if ( $attachment_id ) {
					$img = wp_get_attachment_image_url( $attachment_id, 'thumbnail' );
					echo '<img src="' . esc_url( $img ) . '" style="max-width: 100px; height: auto;" /><br />';
				}
				echo '<button type="button" class="button">Select Image</button>';
				break;

			case 'file':
				$attachment_id = absint( $value );
				echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $attachment_id ) . '" />';
				if ( $attachment_id ) {
					echo esc_html( basename( get_attached_file( $attachment_id ) ) ) . '<br />';
				}
				echo '<button type="button" class="button">Select File</button>';
				break;

			case 'wysiwyg':
				wp_editor( $value, $field_id, array( 'textarea_name' => $field_name ) );
				break;

			default:
				do_action( 'openfields_render_field_' . $field->type, $field, $value, $field_id, $field_name, $settings );
		}
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
			error_log( 'OpenFields: Skipping autosave' );
			return;
		}

		// Skip revision.
		if ( wp_is_post_revision( $post_id ) ) {
			error_log( 'OpenFields: Skipping revision' );
			return;
		}

		// Check capability.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			error_log( 'OpenFields: User cannot edit post' );
			return;
		}

		error_log( 'OpenFields: save_post called for post_id=' . $post_id . ', type=' . $post->post_type );

		// Get fieldsets for this post.
		$context = array(
			'post_type' => $post->post_type,
			'post_id'   => $post_id,
		);

		$fieldsets = OpenFields_Location_Manager::instance()->get_fieldsets_for_context( $context );
		error_log( 'OpenFields: Found ' . count( $fieldsets ) . ' fieldsets for this context' );

		// Process each fieldset.
		foreach ( $fieldsets as $fieldset ) {
			// Verify nonce.
			$nonce_key = 'openfields_nonce_' . $fieldset->id;
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( empty( $_POST[ $nonce_key ] ) ) {
				error_log( 'OpenFields: Nonce missing for fieldset ' . $fieldset->id );
				continue;
			}

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$nonce = wp_unslash( $_POST[ $nonce_key ] );
			if ( ! wp_verify_nonce( $nonce, 'openfields_save_' . $fieldset->id ) ) {
				error_log( 'OpenFields: Nonce verification failed for fieldset ' . $fieldset->id );
				continue;
			}

			error_log( 'OpenFields: Processing fieldset ' . $fieldset->id . ': ' . $fieldset->title );

			// Get ALL fields including sub-fields for saving.
			global $wpdb;
			$all_fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE fieldset_id = %d",
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

			error_log( 'OpenFields: Fieldset has ' . count( $root_fields ) . ' root fields' );

			// Save each ROOT field.
			foreach ( $root_fields as $field ) {
				if ( $field->type === 'repeater' ) {
					// Handle repeater field in ACF format.
					$this->save_repeater_field( $post_id, $field, $sub_fields_map );
				} else {
					// Standard field save.
					$field_name = $field->name;
					$meta_key   = self::META_PREFIX . $field_name;
					// phpcs:ignore WordPress.Security.NonceVerification.Missing
					$raw_value  = isset( $_POST[ $meta_key ] ) ? wp_unslash( $_POST[ $meta_key ] ) : '';

					error_log( 'OpenFields: Processing field "' . $field_name . '" (type: ' . $field->type . ')' );
					error_log( 'OpenFields: Raw value: ' . print_r( $raw_value, true ) );

					// Sanitize the value.
					$sanitized_value = $this->sanitize_value( $raw_value, $field->type );

					error_log( 'OpenFields: Sanitized value: ' . print_r( $sanitized_value, true ) );

					// Update postmeta with native WordPress function.
					$result = update_post_meta( $post_id, $meta_key, $sanitized_value );

					error_log( 'OpenFields: update_post_meta result: ' . ( $result ? 'SUCCESS' : 'NO_CHANGE' ) );

					// Verify it was saved.
					$verify = get_post_meta( $post_id, $meta_key, true );
					error_log( 'OpenFields: Verify read back: ' . print_r( $verify, true ) );
				}
			}
		}

		error_log( 'OpenFields: save_post completed for post_id=' . $post_id );
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

		error_log( 'OpenFields: Saving repeater "' . $base_name . '" with ' . $row_count . ' rows (meta_key: ' . $meta_key . ')' );

		// Save row count (ACF format - no prefix).
		update_post_meta( $post_id, $meta_key, $row_count );

		// Get sub-fields for this repeater.
		$sub_fields = isset( $sub_fields_map[ $field->id ] ) ? $sub_fields_map[ $field->id ] : array();

		if ( empty( $sub_fields ) ) {
			error_log( 'OpenFields: No sub-fields found for repeater ' . $base_name );
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
					error_log( 'OpenFields: Saved ' . $full_name . ' = ' . print_r( $sanitized, true ) );
				}
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
					error_log( 'OpenFields: Cleaned up old meta: ' . $key );
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

			default:
				return sanitize_text_field( $value );
		}
	}
}
