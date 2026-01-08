<?php
/**
 * Assets handler.
 *
 * Handles enqueueing of scripts and styles.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields assets class.
 *
 * @since 1.0.0
 */
class COF_Assets {

	/**
	 * Instance.
	 *
	 * @var COF_Assets|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return COF_Assets
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
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'meta_box_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'frontend_scripts' ) );
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook.
	 */
	public function admin_scripts( $hook ) {
		// Only load on Codeideal Open Fields admin pages.
		if ( ! $this->is_cof_admin_page( $hook ) ) {
			return;
		}

		// React admin app.
		wp_enqueue_script(
			'cof-admin',
			COF_PLUGIN_URL . 'assets/admin/js/admin.js',
			array(),
			COF_VERSION,
			true
		);

		// Admin styles.
		wp_enqueue_style(
			'cof-admin',
			COF_PLUGIN_URL . 'assets/admin/css/admin.css',
			array(),
			COF_VERSION
		);

		// Localize script data.
		wp_localize_script(
			'cof-admin',
			'cofAdmin',
			$this->get_admin_data()
		);

		// Set script translations.
		wp_set_script_translations(
			'cof-admin',
			'codeideal-open-fields',
			COF_PLUGIN_DIR . 'languages'
		);
	}

	/**
	 * Enqueue frontend scripts and styles.
	 *
	 * @since 1.0.0
	 */
	public function frontend_scripts() {
		// Only load if needed.
		if ( ! $this->should_load_frontend_assets() ) {
			return;
		}

		wp_enqueue_script(
			'cof-frontend',
			COF_PLUGIN_URL . 'assets/public/js/frontend.js',
			array(),
			COF_VERSION,
			true
		);

		wp_enqueue_style(
			'cof-frontend',
			COF_PLUGIN_URL . 'assets/public/css/frontend.css',
			array(),
			COF_VERSION
		);
	}

	/**
	 * Enqueue meta box scripts and styles on post edit screens.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook.
	 */
	public function meta_box_scripts( $hook ) {
		// Only load on post edit screens.
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		// Check if there are any OpenFields meta boxes for this post type.
		global $post;
		if ( ! $post ) {
			return;
		}

		$context = array(
			'post_type'     => $post->post_type,
			'post_id'       => $post->ID,
			'page_template' => get_page_template_slug( $post->ID ),
			'categories'    => wp_get_post_categories( $post->ID ),
			'post_format'   => get_post_format( $post->ID ) ?: 'standard',
		);

		$fieldsets = COF_Location_Manager::instance()->get_fieldsets_for_context( $context );

		if ( empty( $fieldsets ) ) {
			return;
		}

		// Enqueue media uploader for image/file fields.
		wp_enqueue_media();

		// Enqueue color picker styles.
		wp_enqueue_style( 'wp-color-picker' );

		// Enqueue choice fields styles (for radio, checkbox, select layout).
		wp_enqueue_style(
			'cof-choice-fields',
			COF_PLUGIN_URL . 'assets/admin/css/choice-fields.css',
			array(),
			COF_VERSION
		);

		// Localize script data.
		wp_localize_script(
			'cof-meta-box',
			'cofMetaBox',
			array(
				'i18n' => array(
					'selectImage' => __( 'Select Image', 'codeideal-open-fields' ),
					'useImage'    => __( 'Use this image', 'codeideal-open-fields' ),
					'selectFile'  => __( 'Select File', 'codeideal-open-fields' ),
					'useFile'     => __( 'Use this file', 'codeideal-open-fields' ),
				),
			)
		);
	}

	/**
	 * Check if current page is an Codeideal Open Fields admin page.
	 *
	 * @since  1.0.0
	 * @param  string $hook Current admin page hook.
	 * @return bool
	 */
	private function is_cof_admin_page( $hook ) {
		$cof_pages = array(
			'toplevel_page_codeideal-open-fields',
			'open-fields_page_codeideal-open-fields-settings',
			'open-fields_page_codeideal-open-fields-tools',
		);

		return in_array( $hook, $cof_pages, true );
	}

	/**
	 * Check if frontend assets should be loaded.
	 *
	 * @since  1.0.0
	 * @return bool
	 */
	private function should_load_frontend_assets() {
		/**
		 * Filter whether to load frontend assets.
		 *
		 * @since 1.0.0
		 * @param bool $load Whether to load assets.
		 */
		return apply_filters( 'cof/load_frontend_assets', false );
	}

	/**
	 * Get admin localization data.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_admin_data() {
		return array(
			'version'    => COF_VERSION,
			'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
			'restUrl'    => rest_url( 'codeideal-open-fields/v1' ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'adminUrl'   => admin_url(),
			'pluginUrl'  => COF_PLUGIN_URL,
			'postTypes'  => $this->get_post_types(),
			'taxonomies' => $this->get_taxonomies(),
			'userRoles'  => $this->get_user_roles(),
			'fieldTypes' => $this->get_field_types(),
			'i18n'       => $this->get_i18n_strings(),
		);
	}

	/**
	 * Get available post types.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_post_types() {
		$post_types = get_post_types(
			array( 'public' => true ),
			'objects'
		);

		$result = array();
		foreach ( $post_types as $post_type ) {
			$result[] = array(
				'name'  => $post_type->name,
				'label' => $post_type->labels->singular_name,
			);
		}

		return $result;
	}

	/**
	 * Get available taxonomies.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_taxonomies() {
		$taxonomies = get_taxonomies(
			array( 'public' => true ),
			'objects'
		);

		$result = array();
		foreach ( $taxonomies as $taxonomy ) {
			$result[] = array(
				'name'  => $taxonomy->name,
				'label' => $taxonomy->labels->singular_name,
			);
		}

		return $result;
	}

	/**
	 * Get user roles.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_user_roles() {
		$roles  = wp_roles()->roles;
		$result = array();

		foreach ( $roles as $key => $role ) {
			$result[] = array(
				'name'  => $key,
				'label' => $role['name'],
			);
		}

		return $result;
	}

	/**
	 * Get registered field types.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_field_types() {
		if ( ! class_exists( 'COF_Field_Registry' ) ) {
			return array();
		}

		return COF_Field_Registry::instance()->get_field_types_for_admin();
	}

	/**
	 * Get i18n strings for JavaScript.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_i18n_strings() {
		return array(
			'save'           => __( 'Save', 'codeideal-open-fields' ),
			'cancel'         => __( 'Cancel', 'codeideal-open-fields' ),
			'delete'         => __( 'Delete', 'codeideal-open-fields' ),
			'confirm'        => __( 'Are you sure?', 'codeideal-open-fields' ),
			'saving'         => __( 'Saving...', 'codeideal-open-fields' ),
			'saved'          => __( 'Saved!', 'codeideal-open-fields' ),
			'error'          => __( 'Error', 'codeideal-open-fields' ),
			'addField'       => __( 'Add Field', 'codeideal-open-fields' ),
			'fieldSettings'  => __( 'Field Settings', 'codeideal-open-fields' ),
			'noFieldsYet'    => __( 'No fields yet. Drag a field type to get started.', 'codeideal-open-fields' ),
			'copyField'      => __( 'Copy Field', 'codeideal-open-fields' ),
			'pasteField'     => __( 'Paste Field', 'codeideal-open-fields' ),
			'duplicateField' => __( 'Duplicate Field', 'codeideal-open-fields' ),
		);
	}
}
