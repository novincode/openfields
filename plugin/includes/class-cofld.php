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
final class COFLD_Plugin {

	/**
	 * Plugin instance.
	 *
	 * @since 1.0.0
	 * @var   COFLD_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @since  1.0.0
	 * @return COFLD_Plugin
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
		require_once COFLD_PLUGIN_DIR . 'includes/class-cofld-installer.php';
		require_once COFLD_PLUGIN_DIR . 'includes/class-cofld-assets.php';
		require_once COFLD_PLUGIN_DIR . 'includes/class-cofld-rest-api.php';

		// Admin includes.
		if ( is_admin() ) {
			require_once COFLD_PLUGIN_DIR . 'includes/admin/class-cofld-admin.php';
			require_once COFLD_PLUGIN_DIR . 'includes/admin/class-cofld-meta-box.php';
		}

		// Field includes.
		require_once COFLD_PLUGIN_DIR . 'includes/fields/class-cofld-field-registry.php';
		require_once COFLD_PLUGIN_DIR . 'includes/fields/class-cofld-base-field.php';
		require_once COFLD_PLUGIN_DIR . 'includes/fields/class-cofld-field-settings.php';

		// Storage includes.
		require_once COFLD_PLUGIN_DIR . 'includes/storage/class-cofld-storage-manager.php';

		// Location includes.
		require_once COFLD_PLUGIN_DIR . 'includes/locations/class-cofld-location-manager.php';

		// Public API.
		require_once COFLD_PLUGIN_DIR . 'includes/api/functions.php';

		// Gutenberg block.
		require_once COFLD_PLUGIN_DIR . 'includes/class-cofld-block.php';
	}

	/**
	 * Initialize hooks.
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {
		add_action( 'init', array( $this, 'init' ), 0 );

		// Check for database updates (e.g. table prefix migration).
		COFLD_Installer::maybe_update_db();

		// Initialize REST API early - rest_api_init fires before init on REST requests.
		COFLD_REST_API::instance();
	}

	/**
	 * Initialize plugin.
	 *
	 * @since 1.0.0
	 */
	public function init() {
		// Initialize components.
		COFLD_Assets::instance();
		COFLD_Field_Registry::instance();
		COFLD_Storage_Manager::instance();
		COFLD_Location_Manager::instance();

		if ( is_admin() ) {
			COFLD_Admin::instance();
			COFLD_Meta_Box::instance();
		}

		/**
		 * Fires after Codeideal Open Fields has been initialized.
		 *
		 * @since 1.0.0
		 */
		do_action( 'cofld/init' );
	}

	/**
	 * Get plugin path.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_path( $path = '' ) {
		return COFLD_PLUGIN_DIR . ltrim( $path, '/' );
	}

	/**
	 * Get plugin URL.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_url( $path = '' ) {
		return COFLD_PLUGIN_URL . ltrim( $path, '/' );
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
