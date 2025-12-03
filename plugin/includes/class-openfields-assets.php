<?php
/**
 * Assets handler.
 *
 * Handles enqueueing of scripts and styles.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields assets class.
 *
 * @since 1.0.0
 */
class OpenFields_Assets {

	/**
	 * Instance.
	 *
	 * @var OpenFields_Assets|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_Assets
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
		// Only load on OpenFields admin pages.
		if ( ! $this->is_openfields_admin_page( $hook ) ) {
			return;
		}

		// React admin app.
		wp_enqueue_script(
			'openfields-admin',
			OPENFIELDS_PLUGIN_URL . 'assets/admin/js/admin.js',
			array(),
			OPENFIELDS_VERSION,
			true
		);

		// Admin styles.
		wp_enqueue_style(
			'openfields-admin',
			OPENFIELDS_PLUGIN_URL . 'assets/admin/css/admin.css',
			array(),
			OPENFIELDS_VERSION
		);

		// Localize script data.
		wp_localize_script(
			'openfields-admin',
			'openfieldsAdmin',
			$this->get_admin_data()
		);

		// Set script translations.
		wp_set_script_translations(
			'openfields-admin',
			'openfields',
			OPENFIELDS_PLUGIN_DIR . 'languages'
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
			'openfields-frontend',
			OPENFIELDS_PLUGIN_URL . 'assets/public/js/frontend.js',
			array(),
			OPENFIELDS_VERSION,
			true
		);

		wp_enqueue_style(
			'openfields-frontend',
			OPENFIELDS_PLUGIN_URL . 'assets/public/css/frontend.css',
			array(),
			OPENFIELDS_VERSION
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

		$fieldsets = OpenFields_Location_Manager::instance()->get_fieldsets_for_context( $context );

		if ( empty( $fieldsets ) ) {
			return;
		}

		// Enqueue media uploader for image/file fields.
		wp_enqueue_media();

		// Enqueue color picker styles.
		wp_enqueue_style( 'wp-color-picker' );

		// Localize script data.
		wp_localize_script(
			'openfields-meta-box',
			'openfieldsMetaBox',
			array(
				'i18n' => array(
					'selectImage' => __( 'Select Image', 'openfields' ),
					'useImage'    => __( 'Use this image', 'openfields' ),
					'selectFile'  => __( 'Select File', 'openfields' ),
					'useFile'     => __( 'Use this file', 'openfields' ),
				),
			)
		);
	}

	/**
	 * Check if current page is an OpenFields admin page.
	 *
	 * @since  1.0.0
	 * @param  string $hook Current admin page hook.
	 * @return bool
	 */
	private function is_openfields_admin_page( $hook ) {
		$openfields_pages = array(
			'toplevel_page_openfields',
			'openfields_page_openfields-settings',
			'openfields_page_openfields-tools',
		);

		return in_array( $hook, $openfields_pages, true );
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
		return apply_filters( 'openfields/load_frontend_assets', false );
	}

	/**
	 * Get admin localization data.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_admin_data() {
		return array(
			'version'    => OPENFIELDS_VERSION,
			'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
			'restUrl'    => rest_url( 'openfields/v1' ),
			'nonce'      => wp_create_nonce( 'wp_rest' ),
			'adminUrl'   => admin_url(),
			'pluginUrl'  => OPENFIELDS_PLUGIN_URL,
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
		if ( ! class_exists( 'OpenFields_Field_Registry' ) ) {
			return array();
		}

		return OpenFields_Field_Registry::instance()->get_field_types_for_admin();
	}

	/**
	 * Get i18n strings for JavaScript.
	 *
	 * @since  1.0.0
	 * @return array
	 */
	private function get_i18n_strings() {
		return array(
			'save'           => __( 'Save', 'openfields' ),
			'cancel'         => __( 'Cancel', 'openfields' ),
			'delete'         => __( 'Delete', 'openfields' ),
			'confirm'        => __( 'Are you sure?', 'openfields' ),
			'saving'         => __( 'Saving...', 'openfields' ),
			'saved'          => __( 'Saved!', 'openfields' ),
			'error'          => __( 'Error', 'openfields' ),
			'addField'       => __( 'Add Field', 'openfields' ),
			'fieldSettings'  => __( 'Field Settings', 'openfields' ),
			'noFieldsYet'    => __( 'No fields yet. Drag a field type to get started.', 'openfields' ),
			'copyField'      => __( 'Copy Field', 'openfields' ),
			'pasteField'     => __( 'Paste Field', 'openfields' ),
			'duplicateField' => __( 'Duplicate Field', 'openfields' ),
		);
	}
}
