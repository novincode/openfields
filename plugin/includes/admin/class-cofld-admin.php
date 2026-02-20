<?php
/**
 * Admin handler.
 *
 * @package Codeideal_Open_Fields
 * @since   1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Codeideal Open Fields admin class.
 *
 * @since 1.0.0
 */
class COFLD_Admin {

	/**
	 * Instance.
	 *
	 * @var COFLD_Admin|null
	 */
	private static $instance = null;

	/**
	 * Get instance.
	 *
	 * @since  1.0.0
	 * @return COFLD_Admin
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
		add_filter( 'plugin_action_links_' . COFLD_PLUGIN_BASENAME, array( $this, 'add_action_links' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_loading_styles' ) );
	}

	/**
	 * Add admin menu pages.
	 *
	 * @since 1.0.0
	 */
	public function add_menu_pages() {
		// Main menu page - single page with tabs for Field Sets, Settings, and Import/Export.
		add_menu_page(
			__( 'Open Fields', 'codeideal-open-fields' ),
			__( 'Open Fields', 'codeideal-open-fields' ),
			'manage_options',
			'codeideal-open-fields',
			array( $this, 'render_main_page' ),
			'dashicons-editor-table',
			30
		);

		// Field Groups submenu (same as main).
		add_submenu_page(
			'codeideal-open-fields',
			__( 'Field Groups', 'codeideal-open-fields' ),
			__( 'Field Groups', 'codeideal-open-fields' ),
			'manage_options',
			'codeideal-open-fields',
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
		<div id="openfields-admin" class="cofld-admin-wrap">
			<div class="cofld-loading">
				<span class="spinner is-active"></span>
				<?php esc_html_e( 'Loading Open Fields...', 'codeideal-open-fields' ); ?>
			</div>
		</div>
		<?php
	}

	/**
	 * Enqueue loading styles for admin page.
	 *
	 * @since 1.0.0
	 * @param string $hook Current admin page hook.
	 */
	public function enqueue_loading_styles( $hook ) {
		// Only on our admin page.
		if ( 'toplevel_page_codeideal-open-fields' !== $hook ) {
			return;
		}

		$inline_css = '
			#openfields-admin {
				margin: 0;
			}
			.cof-loading {
				display: flex;
				align-items: center;
				justify-content: center;
				min-height: 400px;
				font-size: 14px;
				color: #646970;
			}
			.cof-loading .spinner {
				float: none;
				margin-right: 10px;
			}
			/* Hide WP admin notices on our pages */
			.cof-admin-wrap ~ .notice,
			.cof-admin-wrap ~ .updated,
			.cof-admin-wrap ~ .error {
				display: none !important;
			}
		';

		wp_register_style( 'cofld-admin-loading', false, array(), COFLD_VERSION );
		wp_enqueue_style( 'cofld-admin-loading' );
		wp_add_inline_style( 'cofld-admin-loading', $inline_css );
	}

	/**
	 * Maybe redirect after activation.
	 *
	 * @since 1.0.0
	 */
	public function maybe_redirect_after_activation() {
		if ( get_transient( 'cofld_activation_redirect' ) ) {
			delete_transient( 'cofld_activation_redirect' );

			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only checking if param exists during activation redirect, no data processing.
			if ( ! isset( $_GET['activate-multi'] ) ) {
				wp_safe_redirect( admin_url( 'admin.php?page=codeideal-open-fields' ) );
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
			'<a href="' . esc_url( admin_url( 'admin.php?page=codeideal-open-fields' ) ) . '">' . esc_html__( 'Field Groups', 'codeideal-open-fields' ) . '</a>',
			'<a href="' . esc_url( admin_url( 'admin.php?page=codeideal-open-fields&tab=settings' ) ) . '">' . esc_html__( 'Settings', 'codeideal-open-fields' ) . '</a>',
		);

		return array_merge( $plugin_links, $links );
	}
}
