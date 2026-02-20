<?php
/**
 * Unified Field Renderer
 *
 * Central class for rendering all field types. This eliminates code duplication
 * across meta-box, repeater, and group renderers.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Field Renderer Class
 *
 * Provides a single point for rendering any field type's input element.
 * Used by meta boxes, repeaters, groups, and any other context.
 *
 * @since 1.0.0
 */
class COFLD_Field_Renderer {

	/**
	 * Singleton instance.
	 *
	 * @var COFLD_Field_Renderer
	 */
	private static $instance = null;

	/**
	 * Registered custom renderers.
	 *
	 * @var array
	 */
	private $custom_renderers = array();

	/**
	 * Get singleton instance.
	 *
	 * @return COFLD_Field_Renderer
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Private constructor (singleton).
	 */
	private function __construct() {
		// Allow custom renderers via action.
		do_action( 'cofld_register_field_renderers', $this );
	}

	/**
	 * Register a custom field renderer.
	 *
	 * @param string   $type     Field type.
	 * @param callable $callback Callback function(field, value, field_id, field_name, settings, context).
	 */
	public function register_renderer( $type, $callback ) {
		$this->custom_renderers[ $type ] = $callback;
	}

	/**
	 * Render a field input.
	 *
	 * @param object|array $field      Field object or array with type, placeholder, etc.
	 * @param mixed        $value      Current value.
	 * @param string       $field_id   HTML id attribute.
	 * @param string       $field_name HTML name attribute.
	 * @param array        $settings   Field settings (from field_config).
	 * @param array        $context    Optional context: object_id, object_type, parent_name.
	 */
	public function render( $field, $value, $field_id, $field_name, $settings = array(), $context = array() ) {
		// Normalize field to object.
		$field = is_array( $field ) ? (object) $field : $field;
		$type  = $field->type ?? 'text';

		// Default context.
		$context = wp_parse_args( $context, array(
			'object_id'   => 0,
			'object_type' => 'post',
			'parent_name' => '',
		) );

		// Check for custom renderer first.
		if ( isset( $this->custom_renderers[ $type ] ) ) {
			call_user_func( $this->custom_renderers[ $type ], $field, $value, $field_id, $field_name, $settings, $context );
			return;
		}

		// Built-in renderers.
		switch ( $type ) {
			case 'text':
				$this->render_text( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'email':
				$this->render_email( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'url':
				$this->render_url( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'number':
				$this->render_number( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'textarea':
				$this->render_textarea( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'select':
				$this->render_select( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'radio':
				$this->render_radio( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'checkbox':
				$this->render_checkbox( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'switch':
				$this->render_switch( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'date':
				$this->render_date( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'datetime':
				$this->render_datetime( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'time':
				$this->render_time( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'color':
				$this->render_color( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'image':
				cofld_render_image_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'file':
				cofld_render_file_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'gallery':
				cofld_render_gallery_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'wysiwyg':
				$this->render_wysiwyg( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'link':
				cofld_render_link_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'post_object':
			case 'relationship':
				cofld_render_post_object_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'taxonomy':
				cofld_render_taxonomy_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'user':
				cofld_render_user_field( $field, $value, $field_id, $field_name, $settings );
				break;

			case 'repeater':
				cofld_render_repeater_field( $field, $value, $field_id, $context['parent_name'] ?: $field->name, $settings, $context['object_id'], $context['object_type'] );
				break;

			case 'group':
				cofld_render_group_field( $field, $value, $field_id, $context['parent_name'] ?: $field->name, $settings, $context['object_id'], $context['object_type'] );
				break;

			default:
				// Allow custom field types via action.
				do_action( 'cofld_render_field_' . $type, $field, $value, $field_id, $field_name, $settings, $context );
				break;
		}
	}

	/**
	 * Render text input.
	 */
	private function render_text( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $this->get_placeholder( $field, $settings );
		$maxlength   = $this->get_setting( $settings, 'maxlength', '' );
		
		$atts = $this->build_attributes( array(
			'type'        => 'text',
			'id'          => $field_id,
			'name'        => $field_name,
			'value'       => $value,
			'placeholder' => $placeholder,
			'class'       => 'widefat',
			'maxlength'   => $maxlength ?: null,
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render email input.
	 */
	private function render_email( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $this->get_placeholder( $field, $settings, 'email@example.com' );
		
		echo '<div class="cofld-input-with-icon cof-input-icon-left">';
		echo '<span class="cofld-input-icon dashicons dashicons-email"></span>';
		
		$atts = $this->build_attributes( array(
			'type'         => 'email',
			'id'           => $field_id,
			'name'         => $field_name,
			'value'        => $value,
			'placeholder'  => $placeholder,
			'class'        => 'widefat cof-input-has-icon',
			'data-validate' => 'email',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
		echo '</div>';
	}

	/**
	 * Render URL input.
	 */
	private function render_url( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $this->get_placeholder( $field, $settings, 'https://' );
		
		echo '<div class="cofld-input-with-icon cof-input-icon-left">';
		echo '<span class="cofld-input-icon dashicons dashicons-admin-links"></span>';
		
		$atts = $this->build_attributes( array(
			'type'         => 'url',
			'id'           => $field_id,
			'name'         => $field_name,
			'value'        => $value,
			'placeholder'  => $placeholder,
			'class'        => 'widefat cof-input-has-icon',
			'data-validate' => 'url',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
		echo '</div>';
	}

	/**
	 * Render number input.
	 */
	private function render_number( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $this->get_placeholder( $field, $settings );
		$min         = $this->get_setting( $settings, 'min', '' );
		$max         = $this->get_setting( $settings, 'max', '' );
		$step        = $this->get_setting( $settings, 'step', '' );
		
		$atts = $this->build_attributes( array(
			'type'        => 'number',
			'id'          => $field_id,
			'name'        => $field_name,
			'value'       => $value,
			'placeholder' => $placeholder ?: null,
			'class'       => 'widefat',
			'min'         => $min !== '' ? $min : null,
			'max'         => $max !== '' ? $max : null,
			'step'        => $step !== '' ? $step : null,
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render textarea.
	 */
	private function render_textarea( $field, $value, $field_id, $field_name, $settings ) {
		$placeholder = $this->get_placeholder( $field, $settings );
		$rows        = $this->get_setting( $settings, 'rows', 4 );
		$maxlength   = $this->get_setting( $settings, 'maxlength', '' );
		
		$atts = $this->build_attributes( array(
			'id'          => $field_id,
			'name'        => $field_name,
			'rows'        => $rows,
			'placeholder' => $placeholder ?: null,
			'class'       => 'widefat',
			'maxlength'   => $maxlength ?: null,
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<textarea ' . $atts . '>' . esc_textarea( $value ) . '</textarea>';
	}

	/**
	 * Render select dropdown.
	 */
	private function render_select( $field, $value, $field_id, $field_name, $settings ) {
		$choices  = $this->get_setting( $settings, 'choices', array() );
		$multiple = $this->get_setting( $settings, 'multiple', false );
		$name     = $multiple ? $field_name . '[]' : $field_name;
		
		$atts = $this->build_attributes( array(
			'id'       => $field_id,
			'name'     => $name,
			'class'    => 'widefat',
			'multiple' => $multiple ?: null,
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<select ' . $atts . '>';
		
		if ( ! $multiple ) {
			echo '<option value="">-- ' . esc_html__( 'Select', 'codeideal-open-fields' ) . ' --</option>';
		}
		
		foreach ( $choices as $choice ) {
			$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
			$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
			$selected     = is_array( $value ) ? in_array( $choice_value, $value, true ) : ( $value === $choice_value );
			
			echo '<option value="' . esc_attr( $choice_value ) . '"' . selected( $selected, true, false ) . '>' . esc_html( $choice_label ) . '</option>';
		}
		
		echo '</select>';
	}

	/**
	 * Render radio buttons.
	 */
	private function render_radio( $field, $value, $field_id, $field_name, $settings ) {
		$choices = $this->get_setting( $settings, 'choices', array() );
		$layout  = $this->get_setting( $settings, 'layout', 'vertical' );
		
		echo '<fieldset class="cofld-radio-group cof-radio-' . esc_attr( $layout ) . '">';
		
		foreach ( $choices as $i => $choice ) {
			$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
			$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
			$radio_id     = $field_id . '-' . $i;
			$checked      = $value === $choice_value;
			
			echo '<label for="' . esc_attr( $radio_id ) . '">';
			echo '<input type="radio" id="' . esc_attr( $radio_id ) . '" name="' . esc_attr( $field_name ) . '" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
			echo esc_html( $choice_label );
			echo '</label>';
		}
		
		echo '</fieldset>';
	}

	/**
	 * Render checkbox(es).
	 */
	private function render_checkbox( $field, $value, $field_id, $field_name, $settings ) {
		$choices = $this->get_setting( $settings, 'choices', array() );
		
		if ( empty( $choices ) ) {
			// Single checkbox.
			$checked = ! empty( $value );
			$label   = $this->get_setting( $settings, 'checkbox_label', '' );
			
			echo '<label for="' . esc_attr( $field_id ) . '">';
			echo '<input type="checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
			echo esc_html( $label );
			echo '</label>';
		} else {
			// Multiple checkboxes.
			$values = is_array( $value ) ? $value : array();
			$layout = $this->get_setting( $settings, 'layout', 'vertical' );
			
			echo '<fieldset class="cofld-checkbox-group cof-checkbox-' . esc_attr( $layout ) . '">';
			
			foreach ( $choices as $i => $choice ) {
				$choice_value = is_array( $choice ) ? ( $choice['value'] ?? '' ) : $choice;
				$choice_label = is_array( $choice ) ? ( $choice['label'] ?? $choice_value ) : $choice;
				$checkbox_id  = $field_id . '-' . $i;
				$checked      = in_array( $choice_value, $values, true );
				
				echo '<label for="' . esc_attr( $checkbox_id ) . '">';
				echo '<input type="checkbox" id="' . esc_attr( $checkbox_id ) . '" name="' . esc_attr( $field_name ) . '[]" value="' . esc_attr( $choice_value ) . '"' . checked( $checked, true, false ) . ' />';
				echo esc_html( $choice_label );
				echo '</label>';
			}
			
			echo '</fieldset>';
		}
	}

	/**
	 * Render switch toggle.
	 */
	private function render_switch( $field, $value, $field_id, $field_name, $settings ) {
		$checked   = ! empty( $value ) && $value !== '0';
		$on_label  = $this->get_setting( $settings, 'on_text', __( 'Yes', 'codeideal-open-fields' ) );
		$off_label = $this->get_setting( $settings, 'off_text', __( 'No', 'codeideal-open-fields' ) );
		
		echo '<input type="checkbox" class="cofld-switch-checkbox" id="' . esc_attr( $field_id ) . '" name="' . esc_attr( $field_name ) . '" value="1"' . checked( $checked, true, false ) . ' />';
		echo '<label class="cofld-switch-container" for="' . esc_attr( $field_id ) . '">';
		echo '<div>' . esc_html( $off_label ) . '</div>';
		echo '<div>' . esc_html( $on_label ) . '</div>';
		echo '</label>';
	}

	/**
	 * Render date input.
	 */
	private function render_date( $field, $value, $field_id, $field_name, $settings ) {
		$atts = $this->build_attributes( array(
			'type'  => 'date',
			'id'    => $field_id,
			'name'  => $field_name,
			'value' => $value,
			'class' => 'widefat',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render datetime input.
	 */
	private function render_datetime( $field, $value, $field_id, $field_name, $settings ) {
		$atts = $this->build_attributes( array(
			'type'  => 'datetime-local',
			'id'    => $field_id,
			'name'  => $field_name,
			'value' => $value,
			'class' => 'widefat',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render time input.
	 */
	private function render_time( $field, $value, $field_id, $field_name, $settings ) {
		$atts = $this->build_attributes( array(
			'type'  => 'time',
			'id'    => $field_id,
			'name'  => $field_name,
			'value' => $value,
			'class' => 'widefat',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render color picker.
	 */
	private function render_color( $field, $value, $field_id, $field_name, $settings ) {
		$atts = $this->build_attributes( array(
			'type'  => 'color',
			'id'    => $field_id,
			'name'  => $field_name,
			'value' => $value ?: '#000000',
		) );
		
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is pre-escaped by build_attributes().
		echo '<input ' . $atts . ' />';
	}

	/**
	 * Render WYSIWYG editor.
	 */
	private function render_wysiwyg( $field, $value, $field_id, $field_name, $settings ) {
		$editor_settings = array(
			'textarea_name' => $field_name,
			'media_buttons' => $this->get_setting( $settings, 'media_upload', true ),
			'textarea_rows' => $this->get_setting( $settings, 'rows', 10 ),
			'teeny'         => $this->get_setting( $settings, 'teeny', false ),
		);
		
		wp_editor( $value, $field_id, $editor_settings );
	}

	/**
	 * Get placeholder from field or settings.
	 *
	 * @param object $field    Field object.
	 * @param array  $settings Settings array.
	 * @param string $default  Default placeholder.
	 * @return string
	 */
	private function get_placeholder( $field, $settings, $default = '' ) {
		if ( ! empty( $field->placeholder ) ) {
			return $field->placeholder;
		}
		return $this->get_setting( $settings, 'placeholder', $default );
	}

	/**
	 * Get a setting value.
	 *
	 * @param array  $settings Settings array.
	 * @param string $key      Setting key.
	 * @param mixed  $default  Default value.
	 * @return mixed
	 */
	private function get_setting( $settings, $key, $default = '' ) {
		if ( class_exists( 'COFLD_Field_Settings' ) ) {
			return COFLD_Field_Settings::get_setting( $settings, $key, $default );
		}
		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Build HTML attributes string.
	 *
	 * This method already escapes all attribute keys and values.
	 * The output is safe for direct use in HTML.
	 *
	 * @param array $attributes Key-value pairs.
	 * @return string Pre-escaped attributes string.
	 */
	private function build_attributes( $attributes ) {
		$parts = array();
		
		foreach ( $attributes as $key => $value ) {
			if ( $value === null || $value === '' ) {
				continue;
			}
			
			if ( $value === true ) {
				$parts[] = esc_attr( $key );
			} else {
				$parts[] = esc_attr( $key ) . '="' . esc_attr( $value ) . '"';
			}
		}
		
		return implode( ' ', $parts );
	}
}

/**
 * Helper function to get the field renderer instance.
 *
 * @return COFLD_Field_Renderer
 */
function cofld_field_renderer() {
	return COFLD_Field_Renderer::instance();
}

/**
 * Helper function to render a field.
 *
 * @param object|array $field      Field object or array.
 * @param mixed        $value      Current value.
 * @param string       $field_id   HTML id attribute.
 * @param string       $field_name HTML name attribute.
 * @param array        $settings   Field settings.
 * @param array        $context    Optional context.
 */
function cofld_render_field( $field, $value, $field_id, $field_name, $settings = array(), $context = array() ) {
	cofld_field_renderer()->render( $field, $value, $field_id, $field_name, $settings, $context );
}
