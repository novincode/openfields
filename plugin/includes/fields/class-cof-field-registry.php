<?php
/**
 * Field registry.
 *
 * Central registry for all field types.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields field registry class.
 *
 * @since 1.0.0
 */
class COF_Field_Registry {

	/**
	 * Instance.
	 *
	 * @var COF_Field_Registry|null
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
	 * @return COF_Field_Registry
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
			'label'       => __( 'Text', 'codeideal-open-fields' ),
			'description' => __( 'Single line text input.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'type',
			'schema'      => array(
				'max_length' => array(
					'type'    => 'number',
					'label'   => __( 'Max Length', 'codeideal-open-fields' ),
					'default' => '',
				),
				'prepend'    => array(
					'type'    => 'text',
					'label'   => __( 'Prepend', 'codeideal-open-fields' ),
					'default' => '',
				),
				'append'     => array(
					'type'    => 'text',
					'label'   => __( 'Append', 'codeideal-open-fields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'textarea', array(
			'label'       => __( 'Textarea', 'codeideal-open-fields' ),
			'description' => __( 'Multi-line text area.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'align-left',
			'schema'      => array(
				'rows'       => array(
					'type'    => 'number',
					'label'   => __( 'Rows', 'codeideal-open-fields' ),
					'default' => 4,
				),
				'max_length' => array(
					'type'    => 'number',
					'label'   => __( 'Max Length', 'codeideal-open-fields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'number', array(
			'label'       => __( 'Number', 'codeideal-open-fields' ),
			'description' => __( 'Numeric input field.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'hash',
			'schema'      => array(
				'min'     => array(
					'type'    => 'number',
					'label'   => __( 'Minimum', 'codeideal-open-fields' ),
					'default' => '',
				),
				'max'     => array(
					'type'    => 'number',
					'label'   => __( 'Maximum', 'codeideal-open-fields' ),
					'default' => '',
				),
				'step'    => array(
					'type'    => 'number',
					'label'   => __( 'Step', 'codeideal-open-fields' ),
					'default' => 1,
				),
				'prepend' => array(
					'type'    => 'text',
					'label'   => __( 'Prepend', 'codeideal-open-fields' ),
					'default' => '',
				),
				'append'  => array(
					'type'    => 'text',
					'label'   => __( 'Append', 'codeideal-open-fields' ),
					'default' => '',
				),
			),
		) );

		$this->register( 'email', array(
			'label'       => __( 'Email', 'codeideal-open-fields' ),
			'description' => __( 'Email address input.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'mail',
			'schema'      => array(),
		) );

		$this->register( 'url', array(
			'label'       => __( 'URL', 'codeideal-open-fields' ),
			'description' => __( 'URL input with validation.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'external-link',
			'schema'      => array(),
		) );

		$this->register( 'link', array(
			'label'       => __( 'Link', 'codeideal-open-fields' ),
			'description' => __( 'Link with URL, text, and target options.', 'codeideal-open-fields' ),
			'category'    => 'basic',
			'icon'        => 'link',
			'schema'      => array(
				'show_title'  => array(
					'type'    => 'boolean',
					'label'   => __( 'Show Link Text', 'codeideal-open-fields' ),
					'default' => true,
				),
				'show_target' => array(
					'type'    => 'boolean',
					'label'   => __( 'Show Target', 'codeideal-open-fields' ),
					'default' => true,
				),
			),
		) );

		// Choice fields.
		$this->register( 'select', array(
			'label'       => __( 'Select', 'codeideal-open-fields' ),
			'description' => __( 'Dropdown select field.', 'codeideal-open-fields' ),
			'category'    => 'choice',
			'icon'        => 'chevron-down',
			'schema'      => array(
				'choices'    => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'codeideal-open-fields' ),
					'default' => array(),
				),
				'multiple'   => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Multiple', 'codeideal-open-fields' ),
					'default' => false,
				),
				'allow_null' => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Null', 'codeideal-open-fields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'radio', array(
			'label'       => __( 'Radio', 'codeideal-open-fields' ),
			'description' => __( 'Radio button group.', 'codeideal-open-fields' ),
			'category'    => 'choice',
			'icon'        => 'circle-dot',
			'schema'      => array(
				'choices'     => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'codeideal-open-fields' ),
					'default' => array(),
				),
				'layout'      => array(
					'type'    => 'select',
					'label'   => __( 'Layout', 'codeideal-open-fields' ),
					'choices' => array(
						'vertical'   => __( 'Vertical', 'codeideal-open-fields' ),
						'horizontal' => __( 'Horizontal', 'codeideal-open-fields' ),
					),
					'default' => 'vertical',
				),
				'allow_other' => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Other', 'codeideal-open-fields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'checkbox', array(
			'label'       => __( 'Checkbox', 'codeideal-open-fields' ),
			'description' => __( 'Checkbox group.', 'codeideal-open-fields' ),
			'category'    => 'choice',
			'icon'        => 'check-square',
			'schema'      => array(
				'choices' => array(
					'type'    => 'repeater',
					'label'   => __( 'Choices', 'codeideal-open-fields' ),
					'default' => array(),
				),
				'layout'  => array(
					'type'    => 'select',
					'label'   => __( 'Layout', 'codeideal-open-fields' ),
					'choices' => array(
						'vertical'   => __( 'Vertical', 'codeideal-open-fields' ),
						'horizontal' => __( 'Horizontal', 'codeideal-open-fields' ),
					),
					'default' => 'vertical',
				),
			),
		) );

		$this->register( 'switch', array(
			'label'       => __( 'Switch', 'codeideal-open-fields' ),
			'description' => __( 'True/False toggle switch.', 'codeideal-open-fields' ),
			'category'    => 'choice',
			'icon'        => 'toggle-left',
			'schema'      => array(
				'on_text'  => array(
					'type'    => 'text',
					'label'   => __( 'On Text', 'codeideal-open-fields' ),
					'default' => __( 'Yes', 'codeideal-open-fields' ),
				),
				'off_text' => array(
					'type'    => 'text',
					'label'   => __( 'Off Text', 'codeideal-open-fields' ),
					'default' => __( 'No', 'codeideal-open-fields' ),
				),
			),
		) );

		$this->register( 'repeater', array(
			'label'          => __( 'Repeater', 'codeideal-open-fields' ),
			'description'    => __( 'Repeatable group of sub-fields.', 'codeideal-open-fields' ),
			'category'       => 'layout',
			'icon'           => 'list',
			'has_sub_fields' => true,
			'schema'         => array(
				'min'          => array(
					'type'    => 'number',
					'label'   => __( 'Minimum Rows', 'codeideal-open-fields' ),
					'default' => 0,
				),
				'max'          => array(
					'type'    => 'number',
					'label'   => __( 'Maximum Rows', 'codeideal-open-fields' ),
					'default' => 0,
				),
				'layout'       => array(
					'type'    => 'select',
					'label'   => __( 'Layout', 'codeideal-open-fields' ),
					'choices' => array(
						'table' => __( 'Table', 'codeideal-open-fields' ),
						'block' => __( 'Block', 'codeideal-open-fields' ),
						'row'   => __( 'Row', 'codeideal-open-fields' ),
					),
					'default' => 'table',
				),
				'button_label' => array(
					'type'    => 'text',
					'label'   => __( 'Button Label', 'codeideal-open-fields' ),
					'default' => __( 'Add Row', 'codeideal-open-fields' ),
				),
			),
		) );

		// Relational fields.
		$this->register( 'post_object', array(
			'label'       => __( 'Post Object', 'codeideal-open-fields' ),
			'description' => __( 'Select posts from a searchable dropdown.', 'codeideal-open-fields' ),
			'category'    => 'relational',
			'icon'        => 'file-text',
			'schema'      => array(
				'post_type'     => array(
					'type'    => 'select',
					'label'   => __( 'Post Type', 'codeideal-open-fields' ),
					'choices' => array(), // Dynamically populated.
					'default' => 'post',
					'multiple' => true,
				),
				'multiple'      => array(
					'type'    => 'boolean',
					'label'   => __( 'Select Multiple', 'codeideal-open-fields' ),
					'default' => false,
				),
				'return_format' => array(
					'type'    => 'select',
					'label'   => __( 'Return Format', 'codeideal-open-fields' ),
					'choices' => array(
						'object' => __( 'Post Object', 'codeideal-open-fields' ),
						'id'     => __( 'Post ID', 'codeideal-open-fields' ),
					),
					'default' => 'object',
				),
				'allow_null'    => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Null', 'codeideal-open-fields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'taxonomy', array(
			'label'       => __( 'Taxonomy', 'codeideal-open-fields' ),
			'description' => __( 'Select taxonomy terms.', 'codeideal-open-fields' ),
			'category'    => 'relational',
			'icon'        => 'folder-tree',
			'schema'      => array(
				'taxonomy'      => array(
					'type'    => 'select',
					'label'   => __( 'Taxonomy', 'codeideal-open-fields' ),
					'choices' => array(), // Dynamically populated.
					'default' => 'category',
				),
				'field_type'    => array(
					'type'    => 'select',
					'label'   => __( 'Appearance', 'codeideal-open-fields' ),
					'choices' => array(
						'select'   => __( 'Select', 'codeideal-open-fields' ),
						'checkbox' => __( 'Checkbox', 'codeideal-open-fields' ),
						'radio'    => __( 'Radio Buttons', 'codeideal-open-fields' ),
					),
					'default' => 'select',
				),
				'multiple'      => array(
					'type'    => 'boolean',
					'label'   => __( 'Select Multiple', 'codeideal-open-fields' ),
					'default' => false,
				),
				'return_format' => array(
					'type'    => 'select',
					'label'   => __( 'Return Format', 'codeideal-open-fields' ),
					'choices' => array(
						'object' => __( 'Term Object', 'codeideal-open-fields' ),
						'id'     => __( 'Term ID', 'codeideal-open-fields' ),
					),
					'default' => 'id',
				),
				'add_term'      => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Add Term', 'codeideal-open-fields' ),
					'default' => false,
				),
				'load_terms'    => array(
					'type'    => 'boolean',
					'label'   => __( 'Load Value from Post Terms', 'codeideal-open-fields' ),
					'default' => false,
				),
				'save_terms'    => array(
					'type'    => 'boolean',
					'label'   => __( 'Connect Selected Terms to Post', 'codeideal-open-fields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'user', array(
			'label'       => __( 'User', 'codeideal-open-fields' ),
			'description' => __( 'Select users from a searchable dropdown.', 'codeideal-open-fields' ),
			'category'    => 'relational',
			'icon'        => 'user',
			'schema'      => array(
				'role'          => array(
					'type'     => 'select',
					'label'    => __( 'Filter by Role', 'codeideal-open-fields' ),
					'choices'  => array(), // Dynamically populated.
					'default'  => '',
					'multiple' => true,
				),
				'multiple'      => array(
					'type'    => 'boolean',
					'label'   => __( 'Select Multiple', 'codeideal-open-fields' ),
					'default' => false,
				),
				'return_format' => array(
					'type'    => 'select',
					'label'   => __( 'Return Format', 'codeideal-open-fields' ),
					'choices' => array(
						'object' => __( 'User Object', 'codeideal-open-fields' ),
						'id'     => __( 'User ID', 'codeideal-open-fields' ),
						'array'  => __( 'User Array', 'codeideal-open-fields' ),
					),
					'default' => 'array',
				),
				'allow_null'    => array(
					'type'    => 'boolean',
					'label'   => __( 'Allow Null', 'codeideal-open-fields' ),
					'default' => false,
				),
			),
		) );

		$this->register( 'relationship', array(
			'label'       => __( 'Relationship', 'codeideal-open-fields' ),
			'description' => __( 'A dual-column interface to select multiple posts.', 'codeideal-open-fields' ),
			'category'    => 'relational',
			'icon'        => 'git-branch',
			'schema'      => array(
				'post_type'     => array(
					'type'     => 'select',
					'label'    => __( 'Post Type', 'codeideal-open-fields' ),
					'choices'  => array(), // Dynamically populated.
					'default'  => array( 'post' ),
					'multiple' => true,
				),
				'taxonomy'      => array(
					'type'     => 'select',
					'label'    => __( 'Filter by Taxonomy', 'codeideal-open-fields' ),
					'choices'  => array(), // Dynamically populated.
					'default'  => '',
					'multiple' => true,
				),
				'min'           => array(
					'type'    => 'number',
					'label'   => __( 'Minimum Posts', 'codeideal-open-fields' ),
					'default' => 0,
				),
				'max'           => array(
					'type'    => 'number',
					'label'   => __( 'Maximum Posts', 'codeideal-open-fields' ),
					'default' => 0,
				),
				'return_format' => array(
					'type'    => 'select',
					'label'   => __( 'Return Format', 'codeideal-open-fields' ),
					'choices' => array(
						'object' => __( 'Post Object', 'codeideal-open-fields' ),
						'id'     => __( 'Post ID', 'codeideal-open-fields' ),
					),
					'default' => 'object',
				),
			),
		) );

		/**
		 * Fires after default field types are registered.
		 *
		 * @since 1.0.0
		 * @param COF_Field_Registry $this Registry instance.
		 */
		do_action( 'cof/register_field_types', $this );
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
			'basic'        => __( 'Basic', 'codeideal-open-fields' ),
			'choice'       => __( 'Choice', 'codeideal-open-fields' ),
			'content'      => __( 'Content', 'codeideal-open-fields' ),
			'media'        => __( 'Media', 'codeideal-open-fields' ),
			'relational'   => __( 'Relational', 'codeideal-open-fields' ),
			'date_time'    => __( 'Date & Time', 'codeideal-open-fields' ),
			'layout'       => __( 'Layout', 'codeideal-open-fields' ),
		);
	}
}
