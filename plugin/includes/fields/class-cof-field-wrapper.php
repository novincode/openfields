<?php
/**
 * Field wrapper class.
 *
 * Provides a reusable wrapper for rendering fields with consistent styling,
 * width management, conditional rendering, and shared metadata.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields field wrapper class.
 *
 * Wraps individual field instances with common functionality:
 * - Width and layout control
 * - Label and description rendering
 * - Required indicator
 * - Conditional logic UI
 * - Error state display
 *
 * @since 1.0.0
 */
class COF_Field_Wrapper {

	/**
	 * Field instance.
	 *
	 * @var COF_Base_Field
	 */
	private $field;

	/**
	 * Field value.
	 *
	 * @var mixed
	 */
	private $value;

	/**
	 * Field name/ID.
	 *
	 * @var string
	 */
	private $field_name;

	/**
	 * Meta prefix.
	 *
	 * @var string
	 */
	private $meta_prefix;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @param COF_Base_Field $field       Field instance.
	 * @param mixed                 $value       Current field value.
	 * @param string                $field_name  Field name/ID.
	 * @param string                $meta_prefix Meta prefix for database storage (empty for cross-plugin compatibility).
	 */
	public function __construct( $field, $value, $field_name, $meta_prefix = '' ) {
		$this->field         = $field;
		$this->value         = $value;
		$this->field_name    = $field_name;
		$this->meta_prefix   = $meta_prefix;
	}

	/**
	 * Render the wrapped field.
	 *
	 * @since  1.0.0
	 * @return string HTML output.
	 */
	public function render() {
		$config = $this->field->get_config();
		$wrapper_config = isset( $config['wrapper_config'] ) ? $config['wrapper_config'] : array();

		// Get dimensions and styles.
		$width = isset( $wrapper_config['width'] ) ? intval( $wrapper_config['width'] ) : 100;
		$width = max( 10, min( 100, $width ) ); // Constrain between 10-100%.
		$wrapper_class = isset( $wrapper_config['class'] ) ? sanitize_html_class( $wrapper_config['class'] ) : '';
		$wrapper_id = isset( $wrapper_config['id'] ) ? sanitize_html_class( $wrapper_config['id'] ) : '';

		// Build wrapper HTML.
		$html = '<div class="cof-field-wrapper';
		if ( $wrapper_class ) {
			$html .= ' ' . $wrapper_class;
		}
		$html .= '"';

		// Add ID if provided.
		if ( $wrapper_id ) {
			$html .= ' id="' . esc_attr( $wrapper_id ) . '"';
		}

		// Add width as CSS custom property and data attribute (for JS access).
		$html .= ' style="--of-field-width: ' . intval( $width ) . '%;"';
		$html .= ' data-width="' . intval( $width ) . '"';

		// Add unique field ID for conditional logic and form tracking.
		if ( ! empty( $this->field->id ) ) {
			$html .= ' data-field-id="' . esc_attr( $this->field->id ) . '"';
		}

		// Add data attributes for conditional logic if present.
		$conditions = isset( $config['conditional_logic'] ) ? $config['conditional_logic'] : array();
		if ( ! empty( $conditions ) ) {
			$html .= ' data-conditional-logic="' . esc_attr( wp_json_encode( $conditions ) ) . '"';
			$html .= ' data-conditional-status="hidden"'; // Initially hidden, shown by JS if conditions met.
		}

		$html .= '>';

		// Render label section.
		$html .= $this->render_label();

		// Render the field itself.
		$html .= '<div class="cof-field-input">';
		$html .= $this->field->render( $this->value );
		$html .= '</div>';

		// Render description if present.
		if ( ! empty( $config['instructions'] ) ) {
			$html .= '<p class="cof-field-description">' . wp_kses_post( $config['instructions'] ) . '</p>';
		}

		$html .= '</div>';

		return $html;
	}

	/**
	 * Render the field label section.
	 *
	 * @since  1.0.0
	 * @return string HTML output.
	 */
	private function render_label() {
		$config = $this->field->get_config();
		$label = isset( $config['label'] ) ? $config['label'] : '';
		$required = isset( $config['required'] ) ? $config['required'] : false;

		if ( ! $label ) {
			return '';
		}

		$html = '<div class="cof-field-label">';
		$html .= '<label for="' . esc_attr( $this->meta_prefix . $this->field_name ) . '">';
		$html .= esc_html( $label );

		if ( $required ) {
			$html .= '<span class="cof-field-required" aria-label="required">*</span>';
		}

		$html .= '</label>';
		$html .= '</div>';

		return $html;
	}

	/**
	 * Get the meta key for database storage.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	public function get_meta_key() {
		return $this->meta_prefix . $this->field_name;
	}

	/**
	 * Get the field input name attribute.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	public function get_input_name() {
		return $this->meta_prefix . $this->field_name;
	}
}
