<?php
/**
 * Admin handler.
 *
 * @package OpenFields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * OpenFields admin class.
 *
 * @since 1.0.0
 */
class OpenFields_Admin {

	/**
	 * Instance.
	 *
	 * @var OpenFields_Admin|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return OpenFields_Admin
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
		add_action( 'admin_menu', array( $this, 'add_menu_pages' ) );
		add_action( 'admin_init', array( $this, 'maybe_redirect_after_activation' ) );
		add_filter( 'plugin_action_links_' . OPENFIELDS_PLUGIN_BASENAME, array( $this, 'add_action_links' ) );
	}

	/**
	 * Add admin menu pages.
	 *
	 * @since 1.0.0
	 */
	public function add_menu_pages() {
		// Main menu page.
		add_menu_page(
			__( 'OpenFields', 'openfields' ),
			__( 'OpenFields', 'openfields' ),
			'manage_options',
			'openfields',
			array( $this, 'render_main_page' ),
			'dashicons-forms',
			30
		);

		// Field Sets submenu (same as main).
		add_submenu_page(
			'openfields',
			__( 'Field Sets', 'openfields' ),
			__( 'Field Sets', 'openfields' ),
			'manage_options',
			'openfields',
			array( $this, 'render_main_page' )
		);

		// Add New submenu.
		add_submenu_page(
			'openfields',
			__( 'Add New', 'openfields' ),
			__( 'Add New', 'openfields' ),
			'manage_options',
			'openfields#/new',
			array( $this, 'render_main_page' )
		);

		// Tools submenu.
		add_submenu_page(
			'openfields',
			__( 'Tools', 'openfields' ),
			__( 'Tools', 'openfields' ),
			'manage_options',
			'openfields-tools',
			array( $this, 'render_main_page' )
		);

		// Settings submenu.
		add_submenu_page(
			'openfields',
			__( 'Settings', 'openfields' ),
			__( 'Settings', 'openfields' ),
			'manage_options',
			'openfields-settings',
			array( $this, 'render_main_page' )
		);
	}

	/**
	 * Render main admin page.
	 *
	 * This is just a container - React handles the UI.
	 *
	 * @since 1.0.0
	 */
	public function render_main_page() {
		?>
		<div id="openfields-admin" class="openfields-admin-wrap">
			<div class="openfields-loading">
				<span class="spinner is-active"></span>
				<?php esc_html_e( 'Loading OpenFields...', 'openfields' ); ?>
			</div>
		</div>
		<style>
			#openfields-admin {
				margin: 0;
			}
			.openfields-loading {
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 400px;
				font-size: 14px;
				color: #646970;
			}
			.openfields-loading .spinner {
				float: none;
				margin-right: 10px;
			}
			/* Hide WP admin notices on our pages */
			.openfields-admin-wrap ~ .notice,
			.openfields-admin-wrap ~ .updated,
			.openfields-admin-wrap ~ .error {
				display: none !important;
			}
		</style>
		<?php
	}

	/**
	 * Maybe redirect after activation.
	 *
	 * @since 1.0.0
	 */
	public function maybe_redirect_after_activation() {
		if ( get_transient( 'openfields_activation_redirect' ) ) {
			delete_transient( 'openfields_activation_redirect' );

			if ( ! isset( $_GET['activate-multi'] ) ) {
				wp_safe_redirect( admin_url( 'admin.php?page=openfields' ) );
				exit;
			}
		}
	}

	/**
	 * Add plugin action links.
	 *
	 * @since  1.0.0
	 * @param  array $links Existing links.
	 * @return array
	 */
	public function add_action_links( $links ) {
		$plugin_links = array(
			'<a href="' . esc_url( admin_url( 'admin.php?page=openfields' ) ) . '">' . esc_html__( 'Field Sets', 'openfields' ) . '</a>',
			'<a href="' . esc_url( admin_url( 'admin.php?page=openfields-settings' ) ) . '">' . esc_html__( 'Settings', 'openfields' ) . '</a>',
		);

		return array_merge( $plugin_links, $links );
	}
}
