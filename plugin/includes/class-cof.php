<?php
/**
 * Main plugin class.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields main plugin class.
 *
 * @since 1.0.0
 */
final class COF_Plugin {

	/**
	 * Plugin instance.
	 *
	 * @since 1.0.0
	 * @var   COF_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @since  1.0.0
	 * @return COF_Plugin
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
		$this->includes();
		$this->init_hooks();
	}

	/**
	 * Include required files.
	 *
	 * @since 1.0.0
	 */
	private function includes() {
		// Core includes.
		require_once COF_PLUGIN_DIR . 'includes/class-cof-installer.php';
		require_once COF_PLUGIN_DIR . 'includes/class-cof-assets.php';
		require_once COF_PLUGIN_DIR . 'includes/class-cof-rest-api.php';

		// Admin includes.
		if ( is_admin() ) {
			require_once COF_PLUGIN_DIR . 'includes/admin/class-cof-admin.php';
			require_once COF_PLUGIN_DIR . 'includes/admin/class-cof-meta-box.php';
		}

		// Field includes.
		require_once COF_PLUGIN_DIR . 'includes/fields/class-cof-field-registry.php';
		require_once COF_PLUGIN_DIR . 'includes/fields/class-cof-base-field.php';
		require_once COF_PLUGIN_DIR . 'includes/fields/class-cof-field-settings.php';

		// Storage includes.
		require_once COF_PLUGIN_DIR . 'includes/storage/class-cof-storage-manager.php';

		// Location includes.
		require_once COF_PLUGIN_DIR . 'includes/locations/class-cof-location-manager.php';

		// Public API.
		require_once COF_PLUGIN_DIR . 'includes/api/functions.php';

		// Gutenberg block.
		require_once COF_PLUGIN_DIR . 'includes/class-cof-block.php';
	}

	/**
	 * Initialize hooks.
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {
		add_action( 'init', array( $this, 'init' ), 0 );

		// Initialize REST API early - rest_api_init fires before init on REST requests.
		COF_REST_API::instance();
	}

	/**
	 * Initialize plugin.
	 *
	 * @since 1.0.0
	 */
	public function init() {
		// Initialize components.
		COF_Assets::instance();
		COF_Field_Registry::instance();
		COF_Storage_Manager::instance();
		COF_Location_Manager::instance();

		if ( is_admin() ) {
			COF_Admin::instance();
			COF_Meta_Box::instance();
		}

		/**
		 * Fires after Codeideal Open Fields has been initialized.
		 *
		 * @since 1.0.0
		 */
		do_action( 'cof/init' );
	}

	/**
	 * Get plugin path.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_path( $path = '' ) {
		return COF_PLUGIN_DIR . ltrim( $path, '/' );
	}

	/**
	 * Get plugin URL.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_url( $path = '' ) {
		return COF_PLUGIN_URL . ltrim( $path, '/' );
	}

	/**
	 * Prevent cloning.
	 *
	 * @since 1.0.0
	 */
	private function __clone() {}

	/**
	 * Prevent unserializing.
	 *
	 * @since 1.0.0
	 */
	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Unserializing instances of this class is forbidden.', 'codeideal-open-fields' ), '1.0.0' );
	}
}
