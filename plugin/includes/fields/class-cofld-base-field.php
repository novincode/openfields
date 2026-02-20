<?php
/**
 * Base field class.
 *
 * Abstract class for field types.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields base field class.
 *
 * @since 1.0.0
 */
abstract class COFLD_Base_Field {

	/**
	 * Field configuration.
	 *
	 * @var array
	 */
	protected $config;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 * @param array $config Field configuration.
	 */
	public function __construct( $config = array() ) {
		$this->config = wp_parse_args( $config, $this->get_defaults() );
	}

	/**
	 * Get field type.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	abstract public static function get_type();

	/**
	 * Get field type label.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	abstract public static function get_label();

	/**
	 * Get field schema.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	abstract public static function get_schema();

	/**
	 * Render the field.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Current value.
	 * @return string HTML output.
	 */
	abstract public function render( $value );

	/**
	 * Validate the field value.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Value to validate.
	 * @return bool|WP_Error
	 */
	abstract public function validate( $value );

	/**
	 * Sanitize the field value.
	 *
	 * @since  1.0.0
	 * @param  mixed $value Value to sanitize.
	 * @return mixed
	 */
	abstract public function sanitize( $value );

	/**
	 * Get default configuration.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	protected function get_defaults() {
		return array(
			'label'             => '',
			'name'              => '',
			'instructions'      => '',
			'required'          => false,
			'default_value'     => '',
			'placeholder'       => '',
			'conditional_logic' => array(),
			'wrapper_config'    => array(
				'width' => 100,
				'class' => '',
				'id'    => '',
			),
			'field_config'      => array(),
		);
	}

	/**
	 * Get field configuration.
	 *
	 * @since  1.0.0
	 * @param  string $key Optional specific key.
	 * @return mixed
	 */
	public function get_config( $key = null ) {
		if ( $key ) {
			return isset( $this->config[ $key ] ) ? $this->config[ $key ] : null;
		}
		return $this->config;
	}

	/**
	 * Set field configuration.
	 *
	 * @since 1.0.0
	 * @param string $key   Configuration key.
	 * @param mixed  $value Configuration value.
	 */
	public function set_config( $key, $value ) {
		$this->config[ $key ] = $value;
	}

	/**
	 * Check if field should be rendered based on conditional logic.
	 *
	 * @since  1.0.0
	 * @param  array $field_values All field values.
	 * @return bool
	 */
	public function should_render( $field_values ) {
		$conditions = $this->get_config( 'conditional_logic' );

		if ( empty( $conditions ) ) {
			return true;
		}

		return $this->evaluate_conditions( $conditions, $field_values );
	}

	/**
	 * Evaluate conditional logic.
	 *
	 * @since  1.0.0
	 * @param  array $conditions   Conditional rules.
	 * @param  array $field_values All field values.
	 * @return bool
	 */
	protected function evaluate_conditions( $conditions, $field_values ) {
		foreach ( $conditions as $group ) {
			$group_result = true;

			foreach ( $group['rules'] as $rule ) {
				$rule_result = $this->evaluate_rule( $rule, $field_values );

				if ( 'AND' === $group['relation'] ) {
					$group_result = $group_result && $rule_result;
				} else {
					$group_result = $group_result || $rule_result;
				}
			}

			if ( $group_result ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Evaluate a single rule.
	 *
	 * @since  1.0.0
	 * @param  array $rule         Rule to evaluate.
	 * @param  array $field_values All field values.
	 * @return bool
	 */
	protected function evaluate_rule( $rule, $field_values ) {
		$field_name = $rule['field'];
		$operator   = $rule['operator'];
		$value      = $rule['value'];

		$field_value = isset( $field_values[ $field_name ] ) ? $field_values[ $field_name ] : '';

		switch ( $operator ) {
			case '==':
				return $field_value == $value; // phpcs:ignore WordPress.PHP.StrictComparisons
			case '!=':
				return $field_value != $value; // phpcs:ignore WordPress.PHP.StrictComparisons
			case '>':
				return $field_value > $value;
			case '<':
				return $field_value < $value;
			case '>=':
				return $field_value >= $value;
			case '<=':
				return $field_value <= $value;
			case 'contains':
				return strpos( $field_value, $value ) !== false;
			case 'not_contains':
				return strpos( $field_value, $value ) === false;
			case 'empty':
				return empty( $field_value );
			case 'not_empty':
				return ! empty( $field_value );
			default:
				return false;
		}
	}

	/**
	 * Get wrapper attributes.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	protected function get_wrapper_attributes() {
		$wrapper = $this->get_config( 'wrapper_config' );
		$classes = array( 'cofld-field', 'cofld-field-' . static::get_type() );

		if ( ! empty( $wrapper['class'] ) ) {
			$classes[] = $wrapper['class'];
		}

		if ( $this->get_config( 'required' ) ) {
			$classes[] = 'cofld-required';
		}

		$attrs = array(
			'class' => implode( ' ', $classes ),
			'style' => '',
		);

		if ( ! empty( $wrapper['width'] ) && 100 !== (int) $wrapper['width'] ) {
			$attrs['style'] = 'width: ' . absint( $wrapper['width'] ) . '%;';
		}

		if ( ! empty( $wrapper['id'] ) ) {
			$attrs['id'] = $wrapper['id'];
		}

		return $attrs;
	}

	/**
	 * Render field wrapper open tag.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function render_wrapper_open() {
		$attrs = $this->get_wrapper_attributes();
		$html  = '<div';

		foreach ( $attrs as $key => $value ) {
			if ( ! empty( $value ) ) {
				$html .= ' ' . esc_attr( $key ) . '="' . esc_attr( $value ) . '"';
			}
		}

		$html .= '>';

		return $html;
	}

	/**
	 * Render field wrapper close tag.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function render_wrapper_close() {
		return '</div>';
	}

	/**
	 * Render field label.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function render_label() {
		$label = $this->get_config( 'label' );

		if ( empty( $label ) ) {
			return '';
		}

		$html = '<label class="cofld-label" for="' . esc_attr( $this->get_input_id() ) . '">';
		$html .= esc_html( $label );

		if ( $this->get_config( 'required' ) ) {
			$html .= ' <span class="cofld-required-indicator">*</span>';
		}

		$html .= '</label>';

		return $html;
	}

	/**
	 * Render field instructions.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function render_instructions() {
		$instructions = $this->get_config( 'instructions' );

		if ( empty( $instructions ) ) {
			return '';
		}

		return '<p class="cofld-instructions">' . wp_kses_post( $instructions ) . '</p>';
	}

	/**
	 * Get input ID.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function get_input_id() {
		return 'cofld-' . $this->get_config( 'name' );
	}

	/**
	 * Get input name.
	 *
	 * @since  1.0.0
	 * @return string
	 */
	protected function get_input_name() {
		return 'cof[' . $this->get_config( 'name' ) . ']';
	}
}
