<?php
/**
 * Plugin Name: OpenFields
 * Plugin URI: https://openfields.dev
 * Description: Modern custom fields builder for WordPress - the open-source ACF alternative
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: OpenFields Contributors
 * Author URI: https://openfields.dev
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: openfields
 * Domain Path: /languages
 *
 * @package OpenFields
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'OPENFIELDS_VERSION', '0.1.0' );
define( 'OPENFIELDS_PLUGIN_FILE', __FILE__ );
define( 'OPENFIELDS_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'OPENFIELDS_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'OPENFIELDS_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Require the installer class first (needed for activation hook).
require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields-installer.php';

// Require the main plugin class.
require_once OPENFIELDS_PLUGIN_DIR . 'includes/class-openfields.php';

/**
 * Get the main plugin instance.
 *
 * @since 1.0.0
 * @return OpenFields_Plugin
 */
function openfields() {
	return OpenFields_Plugin::instance();
}

// Register activation/deactivation hooks.
register_activation_hook( __FILE__, array( 'OpenFields_Installer', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'OpenFields_Installer', 'deactivate' ) );

// Initialize the plugin.
add_action( 'plugins_loaded', 'openfields' );
