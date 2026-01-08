<?php
/**
 * OpenFields Gutenberg Block
 *
 * A dynamic block to display custom field values in the block editor.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register the OpenFields display block.
 */
class COF_Block {

	/**
	 * Singleton instance.
	 *
	 * @var COF_Block
	 */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return COF_Block
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
	}

	/**
	 * Register the block.
	 */
	public function register_block() {
		if ( ! function_exists( 'register_block_type' ) ) {
			return;
		}

		register_block_type( 'cof/field', array(
			'api_version'     => 2,
			'editor_script'   => 'cof-block-editor',
			'render_callback' => array( $this, 'render_block' ),
			'attributes'      => array(
				'fieldName'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'fieldLabel'  => array(
					'type'    => 'string',
					'default' => '',
				),
				'showLabel'   => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'className'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'format'      => array(
					'type'    => 'string',
					'default' => 'text', // text, html, link, image
				),
			),
		) );
	}

	/**
	 * Enqueue block editor assets.
	 */
	public function enqueue_editor_assets() {
		wp_enqueue_script(
			'cof-block-editor',
			COF_PLUGIN_URL . 'assets/admin/js/block-editor.js',
			array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-i18n', 'wp-server-side-render' ),
			COF_VERSION,
			true
		);

		wp_localize_script( 'cof-block-editor', 'cofBlock', array(
			'fields' => $this->get_available_fields(),
		) );

		wp_enqueue_style(
			'cof-block-editor',
			COF_PLUGIN_URL . 'assets/admin/css/block-editor.css',
			array(),
			COF_VERSION
		);
	}

	/**
	 * Get available fields for the block selector.
	 *
	 * @return array
	 */
	private function get_available_fields() {
		global $wpdb;

		$fields_table    = $wpdb->prefix . 'cof_fields';
		$fieldsets_table = $wpdb->prefix . 'cof_fieldsets';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table names are safe, derived from $wpdb->prefix.
		$fields = $wpdb->get_results(
			"SELECT f.id, f.label, f.name, f.type, fs.title as fieldset_title
			 FROM {$fields_table} f
			 LEFT JOIN {$fieldsets_table} fs ON f.fieldset_id = fs.id
			 WHERE f.parent_id IS NULL OR f.parent_id = 0
			 ORDER BY fs.title, f.menu_order",
			ARRAY_A
		);

		$result = array();
		foreach ( $fields as $field ) {
			$result[] = array(
				'value'    => $field['name'],
				'label'    => $field['label'] . ' (' . $field['name'] . ')',
				'type'     => $field['type'],
				'fieldset' => $field['fieldset_title'],
			);
		}

		return $result;
	}

	/**
	 * Render the block on the frontend.
	 *
	 * @param  array $attributes Block attributes.
	 * @return string
	 */
	public function render_block( $attributes ) {
		$field_name  = $attributes['fieldName'] ?? '';
		$field_label = $attributes['fieldLabel'] ?? '';
		$show_label  = $attributes['showLabel'] ?? true;
		$class_name  = $attributes['className'] ?? '';
		$format      = $attributes['format'] ?? 'text';

		if ( empty( $field_name ) ) {
			return '';
		}

		// Get the field value.
		$value = function_exists( 'get_field' ) ? get_field( $field_name ) : cof_get_field_raw( $field_name );

		if ( empty( $value ) && ! is_numeric( $value ) ) {
			return '';
		}

		// Build output.
		$classes = 'cof-block cof-field-' . esc_attr( $field_name );
		if ( ! empty( $class_name ) ) {
			$classes .= ' ' . esc_attr( $class_name );
		}

		$output = '<div class="' . $classes . '">';

		// Show label if enabled.
		if ( $show_label && ! empty( $field_label ) ) {
			$output .= '<span class="cof-block-label">' . esc_html( $field_label ) . '</span>';
		}

		// Format the value.
		$output .= '<div class="cof-block-value">';
		$output .= $this->format_value( $value, $format );
		$output .= '</div>';

		$output .= '</div>';

		return $output;
	}

	/**
	 * Format the field value based on format type.
	 *
	 * @param  mixed  $value  Field value.
	 * @param  string $format Format type.
	 * @return string
	 */
	private function format_value( $value, $format ) {
		if ( is_array( $value ) ) {
			// Handle arrays (like repeater data or multiple values).
			if ( isset( $value['url'] ) && isset( $value['title'] ) ) {
				// Link array format.
				$target = ! empty( $value['target'] ) ? ' target="' . esc_attr( $value['target'] ) . '"' : '';
				return '<a href="' . esc_url( $value['url'] ) . '"' . $target . '>' . esc_html( $value['title'] ) . '</a>';
			}
			return esc_html( implode( ', ', array_map( 'strval', $value ) ) );
		}

		if ( is_object( $value ) ) {
			// Handle WP_Post objects.
			if ( $value instanceof WP_Post ) {
				return '<a href="' . esc_url( get_permalink( $value ) ) . '">' . esc_html( $value->post_title ) . '</a>';
			}
			// Handle WP_Term objects.
			if ( $value instanceof WP_Term ) {
				return '<a href="' . esc_url( get_term_link( $value ) ) . '">' . esc_html( $value->name ) . '</a>';
			}
			return '';
		}

		switch ( $format ) {
			case 'html':
				return wp_kses_post( $value );

			case 'link':
				if ( filter_var( $value, FILTER_VALIDATE_URL ) ) {
					return '<a href="' . esc_url( $value ) . '">' . esc_html( $value ) . '</a>';
				}
				return esc_html( $value );

			case 'image':
				if ( is_numeric( $value ) ) {
					return wp_get_attachment_image( $value, 'large' );
				}
				if ( filter_var( $value, FILTER_VALIDATE_URL ) ) {
					return '<img src="' . esc_url( $value ) . '" alt="" />';
				}
				return '';

			case 'text':
			default:
				return esc_html( $value );
		}
	}
}

// Initialize.
COF_Block::instance();
