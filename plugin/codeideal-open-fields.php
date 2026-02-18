<?php
/**
 * Plugin Name: Codeideal Open Fields
 * Plugin URI: https://openfields.codeideal.com
 * Description: Modern custom fields builder for WordPress. Create and manage custom field groups with an intuitive interface.
 * Version: 0.2
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Codeideal
 * Author URI: https://codeideal.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: codeideal-open-fields
 * Domain Path: /languages
 *
 * @package Codeideal_Open_Fields
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants.
define( 'COF_VERSION', '0.2' );
define( 'COF_PLUGIN_FILE', __FILE__ );
define( 'COF_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'COF_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'COF_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// Require the installer class first (needed for activation hook).
require_once COF_PLUGIN_DIR . 'includes/class-cof-installer.php';

// Require the main plugin class.
require_once COF_PLUGIN_DIR . 'includes/class-cof.php';

/**
 * Get the main plugin instance.
 *
 * @since 1.0.0
 * @return COF_Plugin
 */
function cof() {
	return COF_Plugin::instance();
}

// Register activation/deactivation hooks.
register_activation_hook( __FILE__, array( 'COF_Installer', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'COF_Installer', 'deactivate' ) );

// Initialize the plugin.
add_action( 'plugins_loaded', 'cof' );
