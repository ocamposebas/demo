<?php
/**
 * Plugin Name: LAB_CORE Accounts
 * Plugin URI: https://labcore.co/
 * Description: Secure customer accounts, password recovery, WooCommerce order history and welcome discounts for the LAB_CORE storefront.
 * Version: 1.0.9
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 * Text Domain: lab-core-accounts
 */

defined( 'ABSPATH' ) || exit;

define( 'LAB_CORE_ACCOUNTS_VERSION', '1.0.9' );
define( 'LAB_CORE_ACCOUNTS_DB_VERSION', '1.0.0' );
define( 'LAB_CORE_ACCOUNTS_FILE', __FILE__ );
define( 'LAB_CORE_ACCOUNTS_DIR', plugin_dir_path( __FILE__ ) );

require_once LAB_CORE_ACCOUNTS_DIR . 'includes/class-lab-core-accounts-install.php';
require_once LAB_CORE_ACCOUNTS_DIR . 'includes/class-lab-core-accounts-sessions.php';
require_once LAB_CORE_ACCOUNTS_DIR . 'includes/class-lab-core-accounts-rest.php';
require_once LAB_CORE_ACCOUNTS_DIR . 'includes/class-lab-core-accounts-admin.php';

register_activation_hook( __FILE__, array( 'LAB_Core_Accounts_Install', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'LAB_Core_Accounts_Install', 'deactivate' ) );

add_action(
	'before_woocommerce_init',
	static function () {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

add_action(
	'plugins_loaded',
	static function () {
		LAB_Core_Accounts_Install::maybe_upgrade();
		LAB_Core_Accounts_Sessions::init();
		LAB_Core_Accounts_REST::init();
		LAB_Core_Accounts_Admin::init();
	}
);

add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	static function ( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=lab-core-accounts' ) ) . '">' . esc_html__( 'Settings', 'lab-core-accounts' ) . '</a>' );
		return $links;
	}
);
