<?php
/**
 * Field registry.
 *
 * Central registry for all field types.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields field registry class.
 *
 * @since 1.0.0
 */
class OpenFields_Field_Registry {

	/**
	 * Instance.
	 *
	 * @var OpenFields_Field_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registered field types.
	 *
	 * @var array
	 */
	private $field_types = array();

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_Field_Registry
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
		$this->register_default_field_types();
	}

	/**
	 * Register default field types.
	 *
	 * @since 1.0.0
	 */
	private function register_default_field_types() {
		// Basic fields.
		$this->register( 'text', array(
			'label'       => __( 'Text', 'openfields' ),
			'description' => __( 'Single line text input.', 'openfields' ),
			'category'    => 'basic',
			'icon'        => 'type',
			'schema'      => array(
				'max_length' => array(
					'type'    => 'number',
					'label'   => __( 'Max Length', 'openfields' ),
					'default' => '',
				),
				'prepend'    => array(
					'type'    => 'text',
					'label'   => __( 'Prepend', 'openfields' ),
					'default' => '',
				),
				'append'     => array(
					'type'    => 'text',
					'label'   => __( 'Append', 'openfields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'textarea', array(
			'label'       => __( 'Textarea', 'openfields' ),
			'description' => __( 'Multi-line text area.', 'openfields' ),
			'category'    => 'basic',
			'icon'        => 'align-left',
			'schema'      => array(
				'rows'       => array(
					'type'    => 'number',
					'label'   => __( 'Rows', 'openfields' ),
					'default' => 4,
				),
				'max_length' => array(
					'type'    => 'number',
					'label'   => __( 'Max Length', 'openfields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'number', array(
			'label'       => __( 'Number', 'openfields' ),
			'description' => __( 'Numeric input field.', 'openfields' ),
			'category'    => 'basic',
			'icon'        => 'hash',
			'schema'      => array(
				'min'     => array(
					'type'    => 'number',
					'label'   => __( 'Minimum', 'openfields' ),
					'default' => '',
				),
				'max'     => array(
					'type'    => 'number',
					'label'   => __( 'Maximum', 'openfields' ),
					'default' => '',
				),
				'step'    => array(
					'type'    => 'number',
					'label'   => __( 'Step', 'openfields' ),
					'default' => 1,
				),
				'prepend' => array(
					'type'    => 'text',
					'label'   => __( 'Prepend', 'openfields' ),
					'default' => '',
				),
				'append'  => array(
					'type'    => 'text',
					'label'   => __( 'Append', 'openfields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'email', array(
			'label'       => __( 'Email', 'openfields' ),
			'description' => __( 'Email address input.', 'openfields' ),
			'category'    => 'basic',
			'icon'        => 'mail',
			'schema'      => array(),
		) );

		$this->register( 'url', array(
			'label'       => __( 'URL', 'openfields' ),
			'description' => __( 'URL input with validation.', 'openfields' ),
			'category'    => 'basic',
			'icon'        => 'link',
			'schema'      => array(),
		) );

		// Choice fields.
		$this->register( 'select', array(
			'label'       => __( 'Select', 'openfields' ),
			'description' => __( 'Dropdown select field.', 'openfields' ),
			'category'    => 'choice',
			'icon'        => 'chevron-down',
			'schema'      => array(
				'choices'    => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'openfields' ),
					'default' => array(),
				),
				'multiple'   => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Multiple', 'openfields' ),
					'default' => false,
				),
				'allow_null' => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Null', 'openfields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'radio', array(
			'label'       => __( 'Radio', 'openfields' ),
			'description' => __( 'Radio button group.', 'openfields' ),
			'category'    => 'choice',
			'icon'        => 'circle-dot',
			'schema'      => array(
				'choices'     => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'openfields' ),
					'default' => array(),
				),
				'layout'      => array(
					'type'    => 'select',
					'label'   => __( 'Layout', 'openfields' ),
					'choices' => array(
						'vertical'   => __( 'Vertical', 'openfields' ),
						'horizontal' => __( 'Horizontal', 'openfields' ),
					),
					'default' => 'vertical',
				),
				'allow_other' => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Other', 'openfields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'checkbox', array(
			'label'       => __( 'Checkbox', 'openfields' ),
			'description' => __( 'Checkbox group.', 'openfields' ),
			'category'    => 'choice',
			'icon'        => 'check-square',
			'schema'      => array(
				'choices' => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'openfields' ),
					'default' => array(),
				),
				'layout'  => array(
					'type'    => 'select',
					'label'   => __( 'Layout', 'openfields' ),
					'choices' => array(
						'vertical'   => __( 'Vertical', 'openfields' ),
						'horizontal' => __( 'Horizontal', 'openfields' ),
					),
					'default' => 'vertical',
				),
			),
		) );

		$this->register( 'switch', array(
			'label'       => __( 'Switch', 'openfields' ),
			'description' => __( 'True/False toggle switch.', 'openfields' ),
			'category'    => 'choice',
			'icon'        => 'toggle-left',
			'schema'      => array(
				'on_text'  => array(
					'type'    => 'text',
					'label'   => __( 'On Text', 'openfields' ),
					'default' => __( 'Yes', 'openfields' ),
				),
				'off_text' => array(
					'type'    => 'text',
					'label'   => __( 'Off Text', 'openfields' ),
					'default' => __( 'No', 'openfields' ),
				),
			),
		) );

		/**
		 * Fires after default field types are registered.
		 *
		 * @since 1.0.0
		 * @param OpenFields_Field_Registry $this Registry instance.
		 */
		do_action( 'openfields/register_field_types', $this );
	}

	/**
	 * Register a field type.
	 *
	 * @since 1.0.0
	 * @param string $type   Field type slug.
	 * @param array  $config Field type configuration.
	 */
	public function register( $type, $config ) {
		$defaults = array(
			'label'       => '',
			'description' => '',
			'category'    => 'basic',
			'icon'        => 'square',
			'schema'      => array(),
		);

		$this->field_types[ $type ] = wp_parse_args( $config, $defaults );
	}

	/**
	 * Unregister a field type.
	 *
	 * @since 1.0.0
	 * @param string $type Field type slug.
	 */
	public function unregister( $type ) {
		unset( $this->field_types[ $type ] );
	}

	/**
	 * Get a field type.
	 *
	 * @since  1.0.0
	 * @param  string $type Field type slug.
	 * @return array|null
	 */
	public function get( $type ) {
		return isset( $this->field_types[ $type ] ) ? $this->field_types[ $type ] : null;
	}

	/**
	 * Get all field types.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public function get_all() {
		return $this->field_types;
	}

	/**
	 * Get field types formatted for admin.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public function get_field_types_for_admin() {
		$result = array();

		foreach ( $this->field_types as $type => $config ) {
			$result[] = array(
				'type'        => $type,
				'label'       => $config['label'],
				'description' => $config['description'],
				'category'    => $config['category'],
				'icon'        => $config['icon'],
				'schema'      => $config['schema'],
			);
		}

		return $result;
	}

	/**
	 * Get field categories.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public function get_categories() {
		return array(
			'basic'        => __( 'Basic', 'openfields' ),
			'choice'       => __( 'Choice', 'openfields' ),
			'content'      => __( 'Content', 'openfields' ),
			'media'        => __( 'Media', 'openfields' ),
			'relational'   => __( 'Relational', 'openfields' ),
			'date_time'    => __( 'Date & Time', 'openfields' ),
			'layout'       => __( 'Layout', 'openfields' ),
		);
	}
}
