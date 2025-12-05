<?php
/**
 * Main plugin class.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields main plugin class.
 *
 * @since 1.0.0
 */
final class OpenFields_Plugin {

	/**
	 * Plugin instance.
	 *
	 * @since 1.0.0
	 * @var   OpenFields_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get plugin instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_Plugin
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
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields-installer.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields-assets.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields-rest-api.php';

		// Admin includes.
		if ( is_admin() ) {
			require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/class-openfields-admin.php';
			require_once OPENFIELDS_PLUGIN_DIR . 'includes/admin/class-openfields-meta-box.php';
		}

		// Field includes.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/fields/class-openfields-field-registry.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/fields/class-openfields-base-field.php';
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/fields/class-openfields-field-settings.php';

		// Storage includes.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/storage/class-openfields-storage-manager.php';

		// Location includes.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/locations/class-openfields-location-manager.php';

		// Public API.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/api/functions.php';

		// Gutenberg block.
		require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields-block.php';
	}

	/**
	 * Initialize hooks.
	 *
	 * @since 1.0.0
	 */
	private function init_hooks() {
		add_action( 'init', array( $this, 'init' ), 0 );
		add_action( 'init', array( $this, 'load_textdomain' ) );

		// Initialize REST API early - rest_api_init fires before init on REST requests.
		OpenFields_REST_API::instance();
	}

	/**
	 * Initialize plugin.
	 *
	 * @since 1.0.0
	 */
	public function init() {
		// Initialize components.
		OpenFields_Assets::instance();
		OpenFields_Field_Registry::instance();
		OpenFields_Storage_Manager::instance();
		OpenFields_Location_Manager::instance();

		if ( is_admin() ) {
			OpenFields_Admin::instance();
			OpenFields_Meta_Box::instance();
		}

		/**
		 * Fires after OpenFields has been initialized.
		 *
		 * @since 1.0.0
		 */
		do_action( 'openfields/init' );
	}

	/**
	 * Load plugin text domain.
	 *
	 * @since 1.0.0
	 */
	public function load_textdomain() {
		load_plugin_textdomain(
			'openfields',
			false,
			dirname( OPENFIELDS_PLUGIN_BASENAME ) . '/languages'
		);
	}

	/**
	 * Get plugin path.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_path( $path = '' ) {
		return OPENFIELDS_PLUGIN_DIR . ltrim( $path, '/' );
	}

	/**
	 * Get plugin URL.
	 *
	 * @since  1.0.0
	 * @param  string $path Optional path to append.
	 * @return string
	 */
	public function plugin_url( $path = '' ) {
		return OPENFIELDS_PLUGIN_URL . ltrim( $path, '/' );
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
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Unserializing instances of this class is forbidden.', 'openfields' ), '1.0.0' );
	}
}
