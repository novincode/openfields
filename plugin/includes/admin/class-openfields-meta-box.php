<?php
/**
 * Meta box handler.
 *
 * Registers and renders meta boxes for fieldsets.
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

		// Enqueue styles directly in meta box class for reliability.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_meta_box_styles' ) );
	}

	/**
	 * Enqueue meta box styles on post edit screens.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_meta_box_styles( $hook ) {
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		// Inline styles for meta boxes - no external file needed.
		$inline_css = '
			.openfields-meta-box { padding: 10px 0; }
			.openfields-field { margin-bottom: 15px; }
			.openfields-field:last-child { margin-bottom: 0; }
			.openfields-field-label { display: block; font-weight: 600; margin-bottom: 5px; }
			.openfields-field-label .required { color: #d63638; margin-left: 2px; }
			.openfields-field-input { width: 100%; }
			.openfields-field-description { font-size: 12px; color: #646970; margin-top: 4px; font-style: italic; }
			.openfields-field input[type="text"],
			.openfields-field input[type="email"],
			.openfields-field input[type="url"],
			.openfields-field input[type="number"],
			.openfields-field input[type="password"],
			.openfields-field textarea,
			.openfields-field select { width: 100%; max-width: 100%; }
			.openfields-field textarea { min-height: 100px; }
		';

		wp_add_inline_style( 'wp-admin', $inline_css );
	}

	/**
	 * Register meta boxes.
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
			'categories'    => wp_get_post_categories( $post->ID ),
			'post_format'   => get_post_format( $post->ID ) ?: 'standard',
		);

		// Debug: Log context and fieldsets
		error_log( 'OpenFields Debug - Context: ' . print_r( $context, true ) );

		$fieldsets = OpenFields_Location_Manager::instance()->get_fieldsets_for_context( $context );

		error_log( 'OpenFields Debug - Matched fieldsets count: ' . count( $fieldsets ) );

		foreach ( $fieldsets as $fieldset ) {
			error_log( 'OpenFields Debug - Registering meta box for: ' . $fieldset->title . ' (ID: ' . $fieldset->field_key . ')' );
			
			$settings = json_decode( $fieldset->settings, true ) ?: array();
			$position = $settings['position'] ?? 'normal';
			$priority = $settings['priority'] ?? 'high';

			add_meta_box(
				'openfields-' . $fieldset->field_key,
				$fieldset->title,
				array( $this, 'render_meta_box' ),
				$post_type,
				$position,
				$priority,
				array( 'fieldset' => $fieldset )
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
		$fieldset = $meta_box['args']['fieldset'];

		// Security nonce.
		wp_nonce_field( 'openfields_save_' . $fieldset->id, 'openfields_nonce_' . $fieldset->id );

		// Get fields for this fieldset.
		global $wpdb;
		$fields_table = $wpdb->prefix . 'openfields_fields';
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fields = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT * FROM {$fields_table} WHERE fieldset_id = %d ORDER BY menu_order ASC",
				$fieldset->id
			)
		);

		if ( empty( $fields ) ) {
			echo '<p>' . esc_html__( 'No fields in this fieldset.', 'openfields' ) . '</p>';
			return;
		}

		echo '<div class="openfields-meta-box" data-fieldset="' . esc_attr( $fieldset->field_key ) . '">';

		foreach ( $fields as $field ) {
			$this->render_field( $field, $post->ID );
		}

		echo '</div>';
	}

	/**
	 * Render a single field.
	 *
	 * @since 1.0.0
	 * @param object $field     Field object.
	 * @param int    $post_id   Post ID.
	 */
	private function render_field( $field, $post_id ) {
		$settings    = json_decode( $field->settings, true ) ?: array();
		$value       = get_field( $field->name, $post_id );
		$field_id    = 'openfields-' . $field->name;
		$field_name  = 'openfields[' . $field->name . ']';
		$required    = ! empty( $settings['required'] ) ? 'required' : '';
		$placeholder = $settings['placeholder'] ?? '';
		$description = $settings['instructions'] ?? '';

		// Check conditional logic.
		$conditional = $settings['conditional_logic'] ?? array();
		$wrapper_class = 'openfields-field openfields-field--' . $field->type;
		$data_attrs = ' data-field="' . esc_attr( $field->name ) . '" data-type="' . esc_attr( $field->type ) . '"';

		if ( ! empty( $conditional ) && ! empty( $conditional['enabled'] ) ) {
			$wrapper_class .= ' openfields-field--has-conditional';
			$data_attrs .= " data-conditional='" . esc_attr( wp_json_encode( $conditional ) ) . "'";
		}

		echo '<div class="' . esc_attr( $wrapper_class ) . '"' . $data_attrs . '>';

		// Label.
		echo '<div class="openfields-field__label">';
		echo '<label for="' . esc_attr( $field_id ) . '">' . esc_html( $field->label ) . '</label>';
		if ( $required ) {
			echo '<span class="openfields-field__required">*</span>';
		}
		echo '</div>';

		// Input.
		echo '<div class="openfields-field__input">';
		$this->render_field_input( $field, $value, $field_id, $field_name, $settings );
		echo '</div>';

		// Description.
		if ( $description ) {
			echo '<div class="openfields-field__description">' . esc_html( $description ) . '</div>';
		}

		echo '</div>';
	}

	/**
	 * Render field input.
	 *
	 * @since 1.0.0
	 * @param object $field      Field object.
	 * @param mixed  $value      Current value.
	 * @param string $field_id   Field ID attribute.
	 * @param string $field_name Field name attribute.
	 * @param array  $settings   Field settings.
	 */
	private function render_field_input( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $settings['placeholder'] ?? '';
		$required    = ! empty( $settings['required'] ) ? 'required' : '';

		switch ( $field->type ) {
			case 'text':
			case 'email':
			case 'url':
			case 'number':
				$type = $field->type;
				$atts = array(
					'type'        => $type,
					'id'          => $field_id,
					'name'        => $field_name,
					'value'       => esc_attr( $value ),
					'placeholder' => $placeholder,
					'class'       => 'widefat',
				);
				if ( $required ) {
					$atts['required'] = 'required';
				}
				if ( 'number' === $type ) {
					$atts['min']  = $settings['min'] ?? '';
					$atts['max']  = $settings['max'] ?? '';
					$atts['step'] = $settings['step'] ?? '';
				}
				echo '<input ' . $this->build_atts( $atts ) . ' />';
				break;

			case 'textarea':
				$rows = $settings['rows'] ?? 5;
				echo '<textarea id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" rows="' . esc_attr( $rows ) . '" class="widefat" placeholder="' . esc_attr( $placeholder ) . '" ' . esc_attr( $required ) . '>' . esc_textarea( $value ) . '</textarea>';
				break;

			case 'select':
				$choices  = $settings['choices'] ?? array();
				$multiple = ! empty( $settings['multiple'] );
				$name     = $multiple ? $field_name . '[]' : $field_name;
				echo '<select id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $name ) . '" class="widefat" ' . ( $multiple ? 'multiple' : '' ) . ' ' . esc_attr( $required ) . '>';
				if ( ! $multiple && empty( $settings['default_value'] ) ) {
					echo '<option value="">' . esc_html__( 'Select...', 'openfields' ) . '</option>';
				}
				foreach ( $choices as $choice ) {
					$choice_value = $choice['value'] ?? $choice;
					$choice_label = $choice['label'] ?? $choice;
					$selected     = is_array( $value ) ? in_array( $choice_value, $value, true ) : ( $value === $choice_value );
					echo '<option value="' . esc_attr( $choice_value ) . '"' . selected( $selected, true, false ) . '>' . esc_html( $choice_label ) . '</option>';
				}
				echo '</select>';
				break;

			case 'radio':
				$choices = $settings['choices'] ?? array();
				$layout = $settings['layout'] ?? 'vertical';
				$layout_class = $layout === 'horizontal' ? ' openfields-radio-group--horizontal' : '';
				echo '<div class="openfields-radio-group' . esc_attr( $layout_class ) . '">';
				foreach ( $choices as $i => $choice ) {
					$choice_value = $choice['value'] ?? $choice;
					$choice_label = $choice['label'] ?? $choice;
					$checked      = $value === $choice_value;
					$radio_id     = $field_id . '-' . $i;
					echo '<label for="' . esc_attr( $radio_id ) . '">';
					echo '<input type="radio" id="' . esc_attr( $radio_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
					echo esc_html( $choice_label );
					echo '</label>';
				}
				echo '</div>';
				break;

			case 'checkbox':
				$choices = $settings['choices'] ?? array();
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
					$layout = $settings['layout'] ?? 'vertical';
					$layout_class = $layout === 'horizontal' ? ' openfields-checkbox-group--horizontal' : '';
					echo '<div class="openfields-checkbox-group' . esc_attr( $layout_class ) . '">';
					foreach ( $choices as $i => $choice ) {
						$choice_value = $choice['value'] ?? $choice;
						$choice_label = $choice['label'] ?? $choice;
						$checked      = in_array( $choice_value, $values, true );
						$checkbox_id  = $field_id . '-' . $i;
						echo '<label for="' . esc_attr( $checkbox_id ) . '">';
						echo '<input type="checkbox" id="' . esc_attr( $checkbox_id ) . '" name="' . esc_attr( $field_name ) . '[]" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
						echo esc_html( $choice_label );
						echo '</label>';
					}
					echo '</div>';
				}
				break;

			case 'switch':
				$checked = ! empty( $value );
				echo '<label class="openfields-switch">';
				echo '<input type="checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
				echo '<span class="openfields-switch__slider"></span>';
				echo '</label>';
				break;

			case 'wysiwyg':
				wp_editor(
					$value,
					$field_id,
					array(
						'textarea_name' => $field_name,
						'textarea_rows' => $settings['rows'] ?? 10,
						'media_buttons' => $settings['media_upload'] ?? true,
						'teeny'         => $settings['teeny'] ?? false,
					)
				);
				break;

			case 'image':
				$attachment_id = absint( $value );
				$preview       = $attachment_id ? wp_get_attachment_image_url( $attachment_id, 'thumbnail' ) : '';
				echo '<div class="openfields-image-field">';
				echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $attachment_id ) . '" />';
				echo '<div class="openfields-image-preview">';
				if ( $preview ) {
					echo '<img src="' . esc_url( $preview ) . '" alt="" />';
				}
				echo '</div>';
				echo '<button type="button" class="button openfields-image-select">' . esc_html__( 'Select Image', 'openfields' ) . '</button>';
				echo '<button type="button" class="button openfields-image-remove" style="' . ( $preview ? '' : 'display:none;' ) . '">' . esc_html__( 'Remove', 'openfields' ) . '</button>';
				echo '</div>';
				break;

			case 'file':
				$attachment_id = absint( $value );
				$filename      = $attachment_id ? basename( get_attached_file( $attachment_id ) ) : '';
				echo '<div class="openfields-file-field">';
				echo '<input type="hidden" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $attachment_id ) . '" />';
				echo '<span class="openfields-file-name">' . esc_html( $filename ) . '</span>';
				echo '<button type="button" class="button openfields-file-select">' . esc_html__( 'Select File', 'openfields' ) . '</button>';
				echo '<button type="button" class="button openfields-file-remove" style="' . ( $filename ? '' : 'display:none;' ) . '">' . esc_html__( 'Remove', 'openfields' ) . '</button>';
				echo '</div>';
				break;

			case 'date':
				echo '<input type="date" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" ' . esc_attr( $required ) . ' />';
				break;

			case 'datetime':
				echo '<input type="datetime-local" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="widefat" ' . esc_attr( $required ) . ' />';
				break;

			case 'color':
				echo '<input type="text" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $value ) . '" class="openfields-color-picker" />';
				break;

			default:
				/**
				 * Render custom field type.
				 *
				 * @since 1.0.0
				 *
				 * @param object $field      Field object.
				 * @param mixed  $value      Current value.
				 * @param string $field_id   Field ID.
				 * @param string $field_name Field name.
				 * @param array  $settings   Field settings.
				 */
				do_action( 'openfields_render_field_' . $field->type, $field, $value, $field_id, $field_name, $settings );
		}
	}

	/**
	 * Build HTML attributes string.
	 *
	 * @since  1.0.0
	 * @param  array $atts Attributes.
	 * @return string
	 */
	private function build_atts( $atts ) {
		$html = '';
		foreach ( $atts as $key => $val ) {
			if ( '' !== $val ) {
				$html .= ' ' . esc_attr( $key ) . '="' . esc_attr( $val ) . '"';
			}
		}
		return trim( $html );
	}

	/**
	 * Save post meta.
	 *
	 * @since 1.0.0
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 * @param bool    $update  Whether this is an update.
	 */
	public function save_post( $post_id, $post, $update ) {
		// Skip autosave.
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Check permissions.
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Check for openfields data.
		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		if ( empty( $_POST['openfields'] ) ) {
			return;
		}

		// Get all fieldsets for this context.
		$context = array(
			'post_type'     => $post->post_type,
			'post_id'       => $post_id,
			'page_template' => get_page_template_slug( $post_id ),
			'categories'    => wp_get_post_categories( $post_id ),
			'post_format'   => get_post_format( $post_id ) ?: 'standard',
		);

		$fieldsets = OpenFields_Location_Manager::instance()->get_fieldsets_for_context( $context );

		foreach ( $fieldsets as $fieldset ) {
			// Verify nonce for this fieldset.
			$nonce_key = 'openfields_nonce_' . $fieldset->id;
			if ( ! isset( $_POST[ $nonce_key ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $nonce_key ] ) ), 'openfields_save_' . $fieldset->id ) ) {
				continue;
			}

			// Get fields for this fieldset.
			global $wpdb;
			$fields_table = $wpdb->prefix . 'openfields_fields';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$fields = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$fields_table} WHERE fieldset_id = %d",
					$fieldset->id
				)
			);

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$data = wp_unslash( $_POST['openfields'] );

			foreach ( $fields as $field ) {
				$field_name = $field->name;
				$value      = isset( $data[ $field_name ] ) ? $data[ $field_name ] : '';

				// Sanitize based on field type.
				$value = $this->sanitize_field_value( $value, $field );

				// Update the field.
				update_field( $field_name, $value, $post_id );
			}
		}
	}

	/**
	 * Sanitize field value.
	 *
	 * @since  1.0.0
	 * @param  mixed  $value Field value.
	 * @param  object $field Field object.
	 * @return mixed
	 */
	private function sanitize_field_value( $value, $field ) {
		switch ( $field->type ) {
			case 'text':
			case 'radio':
				return sanitize_text_field( $value );

			case 'textarea':
				return sanitize_textarea_field( $value );

			case 'email':
				return sanitize_email( $value );

			case 'url':
				return esc_url_raw( $value );

			case 'number':
				return is_numeric( $value ) ? floatval( $value ) : '';

			case 'wysiwyg':
				return wp_kses_post( $value );

			case 'select':
			case 'checkbox':
				if ( is_array( $value ) ) {
					return array_map( 'sanitize_text_field', $value );
				}
				return sanitize_text_field( $value );

			case 'switch':
				return ! empty( $value ) ? 1 : 0;

			case 'image':
			case 'file':
				return absint( $value );

			case 'date':
			case 'datetime':
				return sanitize_text_field( $value );

			case 'color':
				return sanitize_hex_color( $value );

			default:
				/**
				 * Sanitize custom field type value.
				 *
				 * @since 1.0.0
				 *
				 * @param mixed  $value Unsanitized value.
				 * @param object $field Field object.
				 */
				return apply_filters( 'openfields_sanitize_field_' . $field->type, $value, $field );
		}
	}
}
