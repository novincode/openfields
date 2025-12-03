<?php
/**
 * Field Settings Manager
 * 
 * Bridges TypeScript field definitions with PHP rendering.
 * Reads field type configurations and provides PHP-friendly accessors.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields Field Settings class.
 * 
 * This class provides a bridge between TypeScript field definitions
 * and PHP field rendering. Instead of duplicating logic, we maintain
 * a single source of truth and access it from both sides.
 *
 * @since 1.0.0
 */
class OpenFields_Field_Settings {

	/**
	 * Field type configurations - defines how each field type should render
	 * 
	 * This mirrors the TypeScript definitions in admin/src/types/fields.ts
	 * Maintain both to keep single source of truth concept.
	 *
	 * @var array
	 */
	private static $field_configs = array(
		'text' => array(
			'label' => 'Text',
			'category' => 'basic',
			'settings' => array( 'placeholder', 'default_value', 'max_length', 'prepend', 'append' ),
		),
		'textarea' => array(
			'label' => 'Textarea',
			'category' => 'basic',
			'settings' => array( 'placeholder', 'default_value', 'rows', 'max_length' ),
		),
		'number' => array(
			'label' => 'Number',
			'category' => 'basic',
			'settings' => array( 'placeholder', 'default_value', 'min', 'max', 'step', 'prepend', 'append' ),
		),
		'email' => array(
			'label' => 'Email',
			'category' => 'basic',
			'settings' => array( 'placeholder', 'default_value' ),
		),
		'url' => array(
			'label' => 'URL',
			'category' => 'basic',
			'settings' => array( 'placeholder', 'default_value' ),
		),
		'select' => array(
			'label' => 'Select',
			'category' => 'choice',
			'settings' => array( 'default_value', 'choices', 'multiple', 'allow_null' ),
		),
		'radio' => array(
			'label' => 'Radio',
			'category' => 'choice',
			'settings' => array( 'default_value', 'choices', 'layout' ),
		),
		'checkbox' => array(
			'label' => 'Checkbox',
			'category' => 'choice',
			'settings' => array( 'default_value', 'choices', 'layout' ),
		),
		'switch' => array(
			'label' => 'Switch',
			'category' => 'choice',
			'settings' => array( 'default_value', 'on_text', 'off_text' ),
		),
		'wysiwyg' => array(
			'label' => 'WYSIWYG Editor',
			'category' => 'content',
			'settings' => array( 'default_value', 'toolbar', 'media_upload' ),
		),
		'image' => array(
			'label' => 'Image',
			'category' => 'content',
			'settings' => array( 'default_value', 'return_format', 'preview_size' ),
		),
		'gallery' => array(
			'label' => 'Gallery',
			'category' => 'content',
			'settings' => array( 'default_value', 'return_format', 'preview_size', 'min', 'max' ),
		),
		'file' => array(
			'label' => 'File',
			'category' => 'content',
			'settings' => array( 'default_value', 'return_format', 'mime_types' ),
		),
		'date' => array(
			'label' => 'Date Picker',
			'category' => 'basic',
			'settings' => array( 'default_value', 'display_format', 'return_format' ),
		),
		'datetime' => array(
			'label' => 'Date Time',
			'category' => 'basic',
			'settings' => array( 'default_value', 'display_format', 'return_format' ),
		),
		'color' => array(
			'label' => 'Color Picker',
			'category' => 'basic',
			'settings' => array( 'default_value', 'enable_opacity' ),
		),
		'repeater' => array(
			'label' => 'Repeater',
			'category' => 'layout',
			'settings' => array( 'min', 'max', 'layout', 'button_label' ),
		),
	);

	/**
	 * Get field type configuration
	 *
	 * @param  string $field_type Field type key
	 * @return array|null
	 */
	public static function get_config( $field_type ) {
		return self::$field_configs[ $field_type ] ?? null;
	}

	/**
	 * Get applicable settings for a field type
	 *
	 * @param  string $field_type Field type key
	 * @return array
	 */
	public static function get_applicable_settings( $field_type ) {
		$config = self::get_config( $field_type );
		return $config['settings'] ?? array();
	}

	/**
	 * Get a setting value with fallback
	 *
	 * @param  array  $settings Settings array
	 * @param  string $key      Setting key
	 * @param  mixed  $default  Default value
	 * @return mixed
	 */
	public static function get_setting( $settings, $key, $default = '' ) {
		return $settings[ $key ] ?? $default;
	}

	/**
	 * Get default value for a field type and setting
	 *
	 * @param  string $field_type Field type
	 * @param  string $setting    Setting name
	 * @return mixed
	 */
	public static function get_default_for_setting( $field_type, $setting ) {
		$defaults = array(
			'number' => array(
				'step' => 1,
				'min'  => '',
				'max'  => '',
			),
			'textarea' => array(
				'rows' => 5,
			),
			'select' => array(
				'multiple'   => false,
				'allow_null' => false,
			),
			'radio' => array(
				'layout' => 'vertical',
			),
			'checkbox' => array(
				'layout' => 'vertical',
			),
		);

		return $defaults[ $field_type ][ $setting ] ?? null;
	}

	/**
	 * Check if a field type supports a specific setting
	 *
	 * @param  string $field_type Field type
	 * @param  string $setting    Setting name
	 * @return bool
	 */
	public static function supports_setting( $field_type, $setting ) {
		$applicable = self::get_applicable_settings( $field_type );
		return in_array( $setting, $applicable, true );
	}
}
