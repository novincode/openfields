<?php
/**
 * Location manager.
 *
 * Determines which fieldsets should display on which screens.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields location manager class.
 *
 * @since 1.0.0
 */
class COFLD_Location_Manager {

	/**
	 * Instance.
	 *
	 * @var COFLD_Location_Manager|null
	 */
	private static $instance = null;

	/**
	 * Registered location types.
	 *
	 * @var array
	 */
	private $location_types = array();

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return COFLD_Location_Manager
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
		$this->register_default_locations();
	}

	/**
	 * Register default location types.
	 *
	 * @since 1.0.0
	 */
	private function register_default_locations() {
		// Post types.
		$this->register_location_type(
			'post_type',
			array(
				'label'    => __( 'Post Type', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_post_type' ),
				'options'  => array( $this, 'get_post_type_options' ),
			)
		);

		// Page template.
		$this->register_location_type(
			'page_template',
			array(
				'label'    => __( 'Page Template', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_page_template' ),
				'options'  => array( $this, 'get_page_template_options' ),
			)
		);

		// Post category.
		$this->register_location_type(
			'post_category',
			array(
				'label'    => __( 'Post Category', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_post_category' ),
				'options'  => array( $this, 'get_post_category_options' ),
			)
		);

		// Post format.
		$this->register_location_type(
			'post_format',
			array(
				'label'    => __( 'Post Format', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_post_format' ),
				'options'  => array( $this, 'get_post_format_options' ),
			)
		);

		// Taxonomy.
		$this->register_location_type(
			'taxonomy',
			array(
				'label'    => __( 'Taxonomy', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_taxonomy' ),
				'options'  => array( $this, 'get_taxonomy_options' ),
			)
		);

		// User role.
		$this->register_location_type(
			'user_role',
			array(
				'label'    => __( 'User Role', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_user_role' ),
				'options'  => array( $this, 'get_user_role_options' ),
			)
		);

		// Options page.
		$this->register_location_type(
			'options_page',
			array(
				'label'    => __( 'Options Page', 'codeideal-open-fields' ),
				'callback' => array( $this, 'match_options_page' ),
				'options'  => array( $this, 'get_options_page_options' ),
			)
		);
	}

	/**
	 * Register a location type.
	 *
	 * @since 1.0.0
	 * @param string $key  Location type key.
	 * @param array  $args Location type arguments.
	 */
	public function register_location_type( $key, $args ) {
		$this->location_types[ $key ] = wp_parse_args(
			$args,
			array(
				'label'    => '',
				'callback' => null,
				'options'  => null,
			)
		);
	}

	/**
	 * Get registered location types.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public function get_location_types() {
		return $this->location_types;
	}

	/**
	 * Get location types for API.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	public function get_location_types_for_api() {
		$types = array();

		foreach ( $this->location_types as $key => $type ) {
			$options = array();
			if ( is_callable( $type['options'] ) ) {
				$options = call_user_func( $type['options'] );
			}

			$types[] = array(
				'key'     => $key,
				'label'   => $type['label'],
				'options' => $options,
			);
		}

		return $types;
	}

	/**
	 * Check if a fieldset should display for given context.
	 *
	 * @since  1.0.0
	 * @param  array $location_rules Location rules.
	 * @param  array $context        Context data.
	 * @return bool
	 */
	public function match( $location_rules, $context ) {
		if ( empty( $location_rules ) ) {
			return true;
		}

		// Rules are OR groups containing AND conditions.
		foreach ( $location_rules as $group ) {
			$group_match = true;

			foreach ( $group as $rule ) {
				$type     = $rule['type'] ?? '';
				$operator = $rule['operator'] ?? '==';
				$value    = $rule['value'] ?? '';

				if ( ! isset( $this->location_types[ $type ] ) ) {
					continue;
				}

				$callback = $this->location_types[ $type ]['callback'];
				if ( ! is_callable( $callback ) ) {
					continue;
				}

				$matches = call_user_func( $callback, $value, $operator, $context );

				if ( ! $matches ) {
					$group_match = false;
					break;
				}
			}

			// If any group matches, return true (OR logic).
			if ( $group_match ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get fieldsets for a given context.
	 *
	 * @since  1.0.0
	 * @param  array $context Context data.
	 * @return array
	 */
	public function get_fieldsets_for_context( $context ) {
		global $wpdb;

		$fieldsets_table = $wpdb->prefix . 'cofld_fieldsets';
		$locations_table = $wpdb->prefix . 'cofld_locations';

		// Get all active fieldsets.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$fieldsets = $wpdb->get_results(
			"SELECT * FROM {$fieldsets_table} WHERE status = 'active' ORDER BY menu_order ASC"
		);


		if ( empty( $fieldsets ) ) {
			return array();
		}

		$matched = array();

		foreach ( $fieldsets as $fieldset ) {
			// Get location rules for this fieldset.
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$location_rows = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT * FROM {$locations_table} WHERE fieldset_id = %d ORDER BY group_id ASC",
					$fieldset->id
				)
			);


			// Convert rows to grouped rules format.
			$rules = $this->rows_to_rules( $location_rows );


			if ( $this->match( $rules, $context ) ) {
				$matched[] = $fieldset;
			} else {
			}
		}

		return $matched;
	}

	/**
	 * Convert location rows to grouped rules format.
	 *
	 * @since  1.0.0
	 * @param  array $rows Location rows from database.
	 * @return array Grouped rules array.
	 */
	private function rows_to_rules( $rows ) {
		if ( empty( $rows ) ) {
			return array();
		}

		$groups = array();

		foreach ( $rows as $row ) {
			$group_id = $row->group_id ?? 0;

			if ( ! isset( $groups[ $group_id ] ) ) {
				$groups[ $group_id ] = array();
			}

			$groups[ $group_id ][] = array(
				'type'     => $row->param,
				'operator' => $row->operator,
				'value'    => $row->value,
			);
		}

		// Return as indexed array (not associative).
		return array_values( $groups );
	}

	// -------------------------------------------------------------------------
	// Location matchers.
	// -------------------------------------------------------------------------

	/**
	 * Match post type.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_post_type( $value, $operator, $context ) {
		$current = $context['post_type'] ?? '';
		return $this->compare( $current, $value, $operator );
	}

	/**
	 * Match page template.
	 *
	 * Handles the mismatch between get_page_template_slug() which returns ''
	 * for the default template, and the location rule which stores 'default'.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_page_template( $value, $operator, $context ) {
		$current = $context['page_template'] ?? '';

		// Normalize: get_page_template_slug() returns '' for the default template,
		// but the UI stores 'default'. Treat both '' and 'default' as the same value.
		if ( '' === $current || 'default' === $current ) {
			$current = 'default';
		}
		if ( '' === $value || 'default' === $value ) {
			$value = 'default';
		}

		return $this->compare( $current, $value, $operator );
	}

	/**
	 * Match post category.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_post_category( $value, $operator, $context ) {
		$categories = $context['categories'] ?? array();
		$in_array   = in_array( $value, $categories, true );
		return '==' === $operator ? $in_array : ! $in_array;
	}

	/**
	 * Match post format.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_post_format( $value, $operator, $context ) {
		$current = $context['post_format'] ?? 'standard';
		return $this->compare( $current, $value, $operator );
	}

	/**
	 * Match taxonomy.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_taxonomy( $value, $operator, $context ) {
		$current = $context['taxonomy'] ?? '';
		return $this->compare( $current, $value, $operator );
	}

	/**
	 * Match user role.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_user_role( $value, $operator, $context ) {
		$roles    = $context['user_roles'] ?? array();
		$in_array = in_array( $value, $roles, true );
		return '==' === $operator ? $in_array : ! $in_array;
	}

	/**
	 * Match options page.
	 *
	 * @param  string $value    Expected value.
	 * @param  string $operator Operator.
	 * @param  array  $context  Context.
	 * @return bool
	 */
	public function match_options_page( $value, $operator, $context ) {
		$current = $context['options_page'] ?? '';
		return $this->compare( $current, $value, $operator );
	}

	/**
	 * Compare values.
	 *
	 * @param  mixed  $current  Current value.
	 * @param  mixed  $expected Expected value.
	 * @param  string $operator Operator.
	 * @return bool
	 */
	private function compare( $current, $expected, $operator ) {
		switch ( $operator ) {
			case '==':
				return $current === $expected;
			case '!=':
				return $current !== $expected;
			default:
				return false;
		}
	}

	// -------------------------------------------------------------------------
	// Options providers.
	// -------------------------------------------------------------------------

	/**
	 * Get post type options.
	 *
	 * @return array
	 */
	public function get_post_type_options() {
		$post_types = get_post_types( array( 'public' => true ), 'objects' );
		$options    = array();

		foreach ( $post_types as $pt ) {
			$options[] = array(
				'value' => $pt->name,
				'label' => $pt->labels->singular_name,
			);
		}

		return $options;
	}

	/**
	 * Get page template options.
	 *
	 * Fetches templates from multiple sources:
	 * 1. Classic PHP-based page templates (Template Name: header in .php files)
	 * 2. Templates registered via theme.json / block themes
	 * 3. Templates for ALL public post types, not just pages
	 *
	 * @since 1.0.0
	 * @return array
	 */
	public function get_page_template_options() {
		$options = array(
			array(
				'value' => 'default',
				'label' => __( 'Default Template', 'codeideal-open-fields' ),
			),
		);

		$seen = array();

		// Get templates for all public post types.
		$post_types = get_post_types( array( 'public' => true ) );
		foreach ( $post_types as $post_type ) {
			$templates = wp_get_theme()->get_page_templates( null, $post_type );
			foreach ( $templates as $file => $name ) {
				if ( isset( $seen[ $file ] ) ) {
					continue;
				}
				$seen[ $file ] = true;
				$options[]     = array(
					'value' => $file,
					'label' => $name,
				);
			}
		}

		// Also include block-theme templates (WordPress 5.9+ Full Site Editing).
		if ( function_exists( 'get_block_templates' ) ) {
			try {
				$block_templates = get_block_templates( array(), 'wp_template' );
				if ( is_array( $block_templates ) ) {
					foreach ( $block_templates as $template ) {
						$slug = $template->slug ?? '';
						if ( empty( $slug ) || isset( $seen[ $slug ] ) ) {
							continue;
						}
						$seen[ $slug ] = true;
						$title         = ! empty( $template->title ) ? $template->title : $slug;
						$options[]     = array(
							'value' => $slug,
							'label' => $title,
						);
					}
				}
			} catch ( \Exception $e ) {
				// Silently fail — block templates are optional.
			}
		}

		return $options;
	}

	/**
	 * Get post category options.
	 *
	 * @return array
	 */
	public function get_post_category_options() {
		$categories = get_categories( array( 'hide_empty' => false ) );
		$options    = array();

		foreach ( $categories as $cat ) {
			$options[] = array(
				'value' => (string) $cat->term_id,
				'label' => $cat->name,
			);
		}

		return $options;
	}

	/**
	 * Get post format options.
	 *
	 * @return array
	 */
	public function get_post_format_options() {
		$formats = get_post_format_strings();
		$options = array();

		foreach ( $formats as $slug => $name ) {
			$options[] = array(
				'value' => $slug,
				'label' => $name,
			);
		}

		return $options;
	}

	/**
	 * Get taxonomy options.
	 *
	 * @return array
	 */
	public function get_taxonomy_options() {
		$taxonomies = get_taxonomies( array( 'public' => true ), 'objects' );
		$options    = array();

		foreach ( $taxonomies as $tax ) {
			$options[] = array(
				'value' => $tax->name,
				'label' => $tax->labels->singular_name,
			);
		}

		return $options;
	}

	/**
	 * Get user role options.
	 *
	 * @return array
	 */
	public function get_user_role_options() {
		$roles   = wp_roles()->roles;
		$options = array();

		foreach ( $roles as $slug => $role ) {
			$options[] = array(
				'value' => $slug,
				'label' => $role['name'],
			);
		}

		return $options;
	}

	/**
	 * Get options page options.
	 *
	 * @return array
	 */
	public function get_options_page_options() {
		/**
		 * Filter registered options pages.
		 *
		 * @since 1.0.0
		 * @param array $pages Registered options pages.
		 */
		$pages = apply_filters( 'cofld_options_pages', array() );

		$options = array();
		foreach ( $pages as $slug => $title ) {
			$options[] = array(
				'value' => $slug,
				'label' => $title,
			);
		}

		return $options;
	}
}
