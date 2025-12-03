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
	 *
	 * @var string
	 */
	const META_PREFIX = 'of_';

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

		// Enqueue field JavaScript.
		wp_enqueue_script(
			'openfields-fields',
			plugin_dir_url( OPENFIELDS_PLUGIN_FILE ) . 'assets/admin/js/fields.js',
			array(),
			OPENFIELDS_VERSION,
			true
		);

		// Localize script with any necessary data.
		wp_localize_script(
			'openfields-fields',
			'openfieldsConfig',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'openfields_ajax' ),
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

		// Get fields from database.
		global $wpdb;
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE fieldset_id = %d ORDER BY menu_order ASC",
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
		$value    = get_post_meta( $post_id, $meta_key, true );

		// Use default value if not set.
		if ( empty( $value ) && ! empty( $field->default_value ) ) {
			$value = $field->default_value;
		}

		// Create config array for wrapper.
		$config = array(
			'label'             => $field->label,
			'name'              => $field->name,
			'instructions'      => $settings['instructions'] ?? '',
			'required'          => (bool) ( $settings['required'] ?? false ),
			'default_value'     => $field->default_value ?? '',
			'placeholder'       => $settings['placeholder'] ?? '',
			'conditional_logic' => $settings['conditional_logic'] ?? array(),
			'wrapper_config'    => array(
				'width' => isset( $settings['width'] ) ? intval( $settings['width'] ) : 100,
				'class' => $settings['wrapper_class'] ?? '',
				'id'    => $settings['wrapper_id'] ?? '',
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
		$this->render_input( $field, $value, self::META_PREFIX . $field->name, self::META_PREFIX . $field->name, $settings );
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
	 */
	private function render_input( $field, $value, $field_id, $field_name, $settings ) {
		switch ( $field->type ) {
			case 'text':
				$placeholder = OpenFields_Field_Settings::get_setting( $settings, 'placeholder', '' );
				echo '<input type="text" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
				break;

			case 'email':
				$placeholder = OpenFields_Field_Settings::get_setting( $settings, 'placeholder', '' );
				echo '<input type="email" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
				break;

			case 'url':
				$placeholder = OpenFields_Field_Settings::get_setting( $settings, 'placeholder', '' );
				echo '<input type="url" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" placeholder="' . esc_attr( $placeholder ) . '" class="widefat" />';
				break;

			case 'number':
				$min         = OpenFields_Field_Settings::get_setting( $settings, 'min', '' );
				$max         = OpenFields_Field_Settings::get_setting( $settings, 'max', '' );
				$step        = OpenFields_Field_Settings::get_setting( $settings, 'step', OpenFields_Field_Settings::get_default_for_setting( 'number', 'step' ) );
				$placeholder = OpenFields_Field_Settings::get_setting( $settings, 'placeholder', '' );
				
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
				$placeholder = OpenFields_Field_Settings::get_setting( $settings, 'placeholder', '' );
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
				$checked = ! empty( $value );
				echo '<input type="checkbox" class="openfields-switch-input" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
				echo '<label class="openfields-switch-track" for="' . esc_attr( $field_id ) . '">';
				echo '<div class="openfields-switch-label openfields-switch-label-off">No</div>';
				echo '<div class="openfields-switch-label openfields-switch-label-on">Yes</div>';
				echo '</label>';
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

		// Check nonce and data.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( empty( $_POST['openfields'] ) ) {
			error_log( 'OpenFields: No openfields data in POST' );
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

			// Get fields.
			global $wpdb;
			$fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$wpdb->prefix}openfields_fields WHERE fieldset_id = %d",
					$fieldset->id
				)
			);

			error_log( 'OpenFields: Fieldset has ' . count( $fields ) . ' fields' );

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$post_data = wp_unslash( $_POST['openfields'] );

			// Save each field.
			foreach ( $fields as $field ) {
				$field_name = $field->name;
				$meta_key   = self::META_PREFIX . $field_name;
				$raw_value  = isset( $post_data[ $field_name ] ) ? $post_data[ $field_name ] : '';

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

		error_log( 'OpenFields: save_post completed for post_id=' . $post_id );
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
