<?php
/**
 * Plugin Name: LAB_CORE Rewards
 * Description: Auditable USD-based loyalty points with dynamic COP conversion for LAB_CORE and WooCommerce.
 * Version: 1.0.1
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * WC requires at least: 8.0
 * Text Domain: lab-core-rewards
 */

defined( 'ABSPATH' ) || exit;

final class LAB_Core_Rewards {
	const VERSION = '1.0.1';
	const DB_VERSION = '1.0.0';
	const NS = 'lab-core/v1';
	const RATE_CACHE = 'lab_core_rewards_usd_rates';

	public static function table() { global $wpdb; return $wpdb->prefix . 'lab_core_reward_ledger'; }

	public static function activate() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table = self::table();
		$collate = $wpdb->get_charset_collate();
		dbDelta( "CREATE TABLE {$table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned NOT NULL,
			order_id bigint(20) unsigned DEFAULT NULL,
			points bigint(20) NOT NULL,
			type varchar(24) NOT NULL,
			status varchar(20) NOT NULL,
			reference varchar(100) NOT NULL,
			currency char(3) NOT NULL DEFAULT 'USD',
			market_rate decimal(20,8) NOT NULL DEFAULT 1,
			amount decimal(20,4) NOT NULL DEFAULT 0,
			expires_at datetime DEFAULT NULL,
			created_at datetime NOT NULL,
			updated_at datetime NOT NULL,
			PRIMARY KEY (id), UNIQUE KEY reference (reference), KEY user_status (user_id,status), KEY order_id (order_id)
		) {$collate};" );
		update_option( 'lab_core_rewards_db_version', self::DB_VERSION, false );
		add_option( 'lab_core_rewards_points_per_usd', 1, '', false );
		add_option( 'lab_core_rewards_block_points', 500, '', false );
		add_option( 'lab_core_rewards_block_usd', 5, '', false );
		add_option( 'lab_core_rewards_max_percent', 25, '', false );
		add_option( 'lab_core_rewards_rate_ttl', 21600, '', false );
	}

	public static function init() {
		if ( get_option( 'lab_core_rewards_db_version' ) !== self::DB_VERSION ) self::activate();
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
		add_action( 'woocommerce_order_status_processing', array( __CLASS__, 'settle_order' ) );
		add_action( 'woocommerce_order_status_completed', array( __CLASS__, 'settle_order' ) );
		add_action( 'woocommerce_order_status_cancelled', array( __CLASS__, 'release_order' ) );
		add_action( 'woocommerce_order_status_failed', array( __CLASS__, 'release_order' ) );
		add_action( 'woocommerce_order_status_refunded', array( __CLASS__, 'refund_order' ) );
		add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
	}

	public static function auth( $request ) {
		if ( ! class_exists( 'LAB_Core_Accounts_Sessions' ) ) return new WP_Error( 'REWARDS_ACCOUNT_PLUGIN_REQUIRED', 'LAB_CORE Accounts is required.', array( 'status' => 503 ) );
		return LAB_Core_Accounts_Sessions::authenticate( $request );
	}

	public static function routes() {
		register_rest_route( self::NS, '/rewards', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'balance_api' ), 'permission_callback' => array( __CLASS__, 'auth' ) ) );
		register_rest_route( self::NS, '/rewards/quote', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'quote_api' ), 'permission_callback' => array( __CLASS__, 'auth' ) ) );
		register_rest_route( self::NS, '/rewards/attach', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'attach_api' ), 'permission_callback' => array( __CLASS__, 'auth' ) ) );
		register_rest_route( self::NS, '/rewards/release', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'release_api' ), 'permission_callback' => array( __CLASS__, 'auth' ) ) );
		register_rest_route( self::NS, '/rewards/rate', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'rate_api' ), 'permission_callback' => '__return_true' ) );
	}

	private static function user_id( $request ) { $auth = self::auth( $request ); return is_wp_error( $auth ) ? 0 : absint( $auth['user']->ID ); }
	private static function clean_expired() { global $wpdb; $wpdb->query( $wpdb->prepare( 'UPDATE ' . self::table() . " SET status='released',updated_at=%s WHERE status='reserved' AND expires_at < %s", current_time( 'mysql', true ), current_time( 'mysql', true ) ) ); }

	public static function available( $user_id ) {
		global $wpdb; self::clean_expired();
		return (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COALESCE(SUM(points),0) FROM ' . self::table() . " WHERE user_id=%d AND ((type='earning' AND status='available') OR (type='redemption' AND status IN ('reserved','used')))", $user_id ) );
	}

	public static function summary( $user_id ) {
		global $wpdb; self::clean_expired();
		$available = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COALESCE(SUM(points),0) FROM ' . self::table() . " WHERE user_id=%d AND ((type='earning' AND status='available') OR (type='redemption' AND status IN ('reserved','used')))", $user_id ) );
		$reserved = abs( (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COALESCE(SUM(points),0) FROM ' . self::table() . " WHERE user_id=%d AND status='reserved'", $user_id ) ) );
		$pending = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COALESCE(SUM(points),0) FROM ' . self::table() . " WHERE user_id=%d AND status='pending'", $user_id ) );
		$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT points,type,status,reference,currency,market_rate,amount,created_at FROM ' . self::table() . ' WHERE user_id=%d ORDER BY id DESC LIMIT 50', $user_id ), ARRAY_A );
		$block = max( 1, absint( get_option( 'lab_core_rewards_block_points', 500 ) ) );
		return array( 'available' => $available, 'reserved' => $reserved, 'pending' => $pending, 'redeemable_blocks' => intdiv( max( 0, $available ), $block ), 'block_points' => $block, 'block_usd' => (float) get_option( 'lab_core_rewards_block_usd', 5 ), 'history' => $rows );
	}

	public static function balance_api( $request ) { return rest_ensure_response( array_merge( array( 'ok' => true ), self::summary( self::user_id( $request ) ) ) ); }

	public static function rates() {
		$cached = get_option( self::RATE_CACHE, array() );
		$ttl = min( DAY_IN_SECONDS, max( HOUR_IN_SECONDS, absint( get_option( 'lab_core_rewards_rate_ttl', 21600 ) ) ) );
		if ( is_array( $cached ) && ! empty( $cached['fetched_at'] ) && time() - absint( $cached['fetched_at'] ) < $ttl ) return $cached;
		$response = wp_remote_get( 'https://open.er-api.com/v6/latest/USD', array( 'timeout' => 8, 'user-agent' => 'LAB_CORE Rewards/' . self::VERSION ) );
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( isset( $body['rates']['COP'] ) && (float) $body['rates']['COP'] > 0 ) {
				$cached = array( 'USD' => 1.0, 'COP' => (float) $body['rates']['COP'], 'provider' => 'ExchangeRate-API', 'provider_updated_at' => isset( $body['time_last_update_unix'] ) ? absint( $body['time_last_update_unix'] ) : time(), 'fetched_at' => time() );
				update_option( self::RATE_CACHE, $cached, false ); return $cached;
			}
		}
		if ( is_array( $cached ) && isset( $cached['COP'] ) && time() - absint( $cached['fetched_at'] ) <= 7 * DAY_IN_SECONDS ) { $cached['stale'] = true; return $cached; }
		return new WP_Error( 'REWARD_RATE_UNAVAILABLE', 'The market exchange rate is temporarily unavailable.', array( 'status' => 503 ) );
	}

	public static function rate_api() { $rates = self::rates(); return is_wp_error( $rates ) ? $rates : rest_ensure_response( array( 'ok' => true, 'rates' => $rates ) ); }

	public static function quote_api( $request ) {
		global $wpdb;
		$user_id = self::user_id( $request ); $data = $request->get_json_params();
		$currency = strtoupper( sanitize_text_field( isset( $data['currency'] ) ? $data['currency'] : 'USD' ) );
		$subtotal = round( max( 0, (float) ( isset( $data['subtotal'] ) ? $data['subtotal'] : 0 ) ), 4 );
		$points = max( 0, absint( isset( $data['points'] ) ? $data['points'] : 0 ) );
		$block = max( 1, absint( get_option( 'lab_core_rewards_block_points', 500 ) ) );
		if ( ! in_array( $currency, array( 'USD', 'COP' ), true ) || $subtotal <= 0 || $points % $block !== 0 ) return new WP_Error( 'INVALID_REWARD_QUOTE', 'Invalid reward quote.', array( 'status' => 422 ) );
		$rates = self::rates(); if ( is_wp_error( $rates ) ) return $rates; $rate = (float) $rates[ $currency ];
		$max_points = intdiv( max( 0, self::summary( $user_id )['available'] ), $block ) * $block;
		$max_discount = $subtotal * min( 100, max( 1, absint( get_option( 'lab_core_rewards_max_percent', 25 ) ) ) ) / 100;
		$block_value = (float) get_option( 'lab_core_rewards_block_usd', 5 ) * $rate;
		$allowed_blocks = min( intdiv( $max_points, $block ), (int) floor( $max_discount / $block_value ) );
		if ( $points > $allowed_blocks * $block ) return new WP_Error( 'REWARD_POINTS_UNAVAILABLE', 'The requested points are not available for this order.', array( 'status' => 422 ) );
		if ( 0 === $points ) return rest_ensure_response( array( 'ok' => true, 'points' => 0, 'discount' => 0, 'rate' => $rate, 'max_points' => $allowed_blocks * $block ) );
		$discount = round( ( $points / $block ) * $block_value, 'COP' === $currency ? 0 : 2 );
		if ( ! empty( $data['preview'] ) ) return rest_ensure_response( array( 'ok' => true, 'points' => $points, 'discount' => $discount, 'rate' => $rate, 'max_points' => $allowed_blocks * $block ) );
		$reference = 'reserve_' . $user_id . '_' . wp_generate_uuid4(); $now = current_time( 'mysql', true );
		$wpdb->insert( self::table(), array( 'user_id' => $user_id, 'points' => -$points, 'type' => 'redemption', 'status' => 'reserved', 'reference' => $reference, 'currency' => $currency, 'market_rate' => $rate, 'amount' => $discount, 'expires_at' => gmdate( 'Y-m-d H:i:s', time() + 30 * MINUTE_IN_SECONDS ), 'created_at' => $now, 'updated_at' => $now ) );
		return rest_ensure_response( array( 'ok' => true, 'reservation' => $reference, 'points' => $points, 'discount' => $discount, 'rate' => $rate, 'max_points' => $allowed_blocks * $block ) );
	}

	public static function attach_api( $request ) {
		global $wpdb; $user_id = self::user_id( $request ); $data = $request->get_json_params(); $ref = sanitize_text_field( $data['reservation'] ?? '' ); $order_id = absint( $data['order_id'] ?? 0 );
		$order = function_exists( 'wc_get_order' ) ? wc_get_order( $order_id ) : false;
		if ( ! $order || absint( $order->get_customer_id() ) !== $user_id ) return new WP_Error( 'INVALID_REWARD_ORDER', 'Invalid reward order.', array( 'status' => 422 ) );
		$updated = $wpdb->update( self::table(), array( 'order_id' => $order_id, 'updated_at' => current_time( 'mysql', true ) ), array( 'user_id' => $user_id, 'reference' => $ref, 'status' => 'reserved' ) );
		if ( ! $updated ) return new WP_Error( 'REWARD_RESERVATION_NOT_FOUND', 'Reward reservation not found.', array( 'status' => 404 ) );
		$order->update_meta_data( '_lab_reward_reservation', $ref ); $order->save(); return rest_ensure_response( array( 'ok' => true ) );
	}

	public static function release_api( $request ) { global $wpdb; $data = $request->get_json_params(); $wpdb->update( self::table(), array( 'status' => 'released', 'updated_at' => current_time( 'mysql', true ) ), array( 'user_id' => self::user_id( $request ), 'reference' => sanitize_text_field( $data['reservation'] ?? '' ), 'status' => 'reserved' ) ); return rest_ensure_response( array( 'ok' => true ) ); }

	public static function settle_order( $order_id ) {
		global $wpdb; $order = wc_get_order( $order_id ); if ( ! $order || ! $order->get_customer_id() ) return;
		$now = current_time( 'mysql', true );
		$wpdb->update( self::table(), array( 'status' => 'used', 'updated_at' => $now ), array( 'order_id' => $order_id, 'type' => 'redemption', 'status' => 'reserved' ) );
		$reference = 'earn_order_' . $order_id; $exists = $wpdb->get_var( $wpdb->prepare( 'SELECT id FROM ' . self::table() . ' WHERE reference=%s', $reference ) ); if ( $exists ) return;
		$currency = $order->get_currency(); $rate = (float) $order->get_meta( '_lab_reward_market_rate' );
		if ( $rate <= 0 ) { $rates = self::rates(); if ( is_wp_error( $rates ) || empty( $rates[ $currency ] ) ) return; $rate = (float) $rates[ $currency ]; }
		$eligible = 0; foreach ( $order->get_items() as $item ) $eligible += (float) $item->get_total();
		$points = (int) floor( ( $eligible / $rate ) * max( 0, (float) get_option( 'lab_core_rewards_points_per_usd', 1 ) ) ); if ( $points < 1 ) return;
		$wpdb->insert( self::table(), array( 'user_id' => $order->get_customer_id(), 'order_id' => $order_id, 'points' => $points, 'type' => 'earning', 'status' => 'available', 'reference' => $reference, 'currency' => $currency, 'market_rate' => $rate, 'amount' => $eligible, 'created_at' => $now, 'updated_at' => $now ) );
		$order->update_meta_data( '_lab_reward_points_earned', $points ); $order->update_meta_data( '_lab_reward_market_rate', $rate ); $order->save();
	}

	public static function release_order( $order_id ) { global $wpdb; $wpdb->update( self::table(), array( 'status' => 'released', 'updated_at' => current_time( 'mysql', true ) ), array( 'order_id' => $order_id, 'type' => 'redemption', 'status' => 'reserved' ) ); }
	public static function refund_order( $order_id ) { global $wpdb; self::release_order( $order_id ); $wpdb->update( self::table(), array( 'status' => 'reversed', 'updated_at' => current_time( 'mysql', true ) ), array( 'order_id' => $order_id, 'type' => 'earning', 'status' => 'available' ) ); $wpdb->update( self::table(), array( 'status' => 'released', 'updated_at' => current_time( 'mysql', true ) ), array( 'order_id' => $order_id, 'type' => 'redemption', 'status' => 'used' ) ); }

	public static function admin_menu() { add_submenu_page( 'woocommerce', 'LAB_CORE Rewards', 'LAB_CORE Rewards', 'manage_woocommerce', 'lab-core-rewards', array( __CLASS__, 'admin_page' ) ); }
	public static function admin_page() { $rates = self::rates(); echo '<div class="wrap"><h1>LAB_CORE Rewards</h1><p>1 USD elegible = 1 punto. 500 puntos = USD 5. Canje máximo: 25%.</p>'; if ( is_wp_error( $rates ) ) echo '<div class="notice notice-error"><p>' . esc_html( $rates->get_error_message() ) . '</p></div>'; else echo '<p><strong>USD/COP:</strong> ' . esc_html( number_format_i18n( $rates['COP'], 2 ) ) . ' · ExchangeRate-API · ' . esc_html( gmdate( 'Y-m-d H:i', $rates['provider_updated_at'] ) ) . ' UTC</p>'; echo '</div>'; }
}

register_activation_hook( __FILE__, array( 'LAB_Core_Rewards', 'activate' ) );
add_action( 'before_woocommerce_init', static function () { if ( class_exists( '\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil' ) ) \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true ); } );
add_action( 'plugins_loaded', array( 'LAB_Core_Rewards', 'init' ) );
