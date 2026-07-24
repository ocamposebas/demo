<?php

defined( 'ABSPATH' ) || exit;

class LAB_Core_Accounts_Admin {
	public static function init() {
		if ( ! is_admin() ) {
			return;
		}

		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'settings' ) );
		add_action( 'woocommerce_admin_order_data_after_shipping_address', array( __CLASS__, 'tracking_fields' ) );
		add_action( 'woocommerce_process_shop_order_meta', array( __CLASS__, 'save_tracking_fields' ), 20, 2 );
	}

	public static function tracking_fields( $order ) {
		if ( ! $order || ! is_a( $order, 'WC_Order' ) ) return;
		echo '<div class="address"><h3>' . esc_html__( 'LAB_CORE Tracking', 'lab-core-accounts' ) . '</h3>';
		woocommerce_wp_text_input( array( 'id' => '_tracking_provider', 'label' => __( 'Carrier', 'lab-core-accounts' ), 'value' => $order->get_meta( '_tracking_provider' ), 'wrapper_class' => 'form-field-wide' ) );
		woocommerce_wp_text_input( array( 'id' => '_tracking_number', 'label' => __( 'Tracking number', 'lab-core-accounts' ), 'value' => $order->get_meta( '_tracking_number' ), 'wrapper_class' => 'form-field-wide' ) );
		woocommerce_wp_text_input( array( 'id' => '_tracking_url', 'label' => __( 'Tracking URL', 'lab-core-accounts' ), 'value' => $order->get_meta( '_tracking_url' ), 'type' => 'url', 'wrapper_class' => 'form-field-wide' ) );
		echo '<p class="description">' . esc_html__( 'These details appear in the customer tracking portal.', 'lab-core-accounts' ) . '</p></div>';
	}

	public static function save_tracking_fields( $order_id, $post = null ) {
		if ( ! current_user_can( 'edit_shop_order', $order_id ) || ! function_exists( 'wc_get_order' ) ) return;
		$order = wc_get_order( $order_id ); if ( ! $order ) return;
		$fields = array( '_tracking_provider' => 'sanitize_text_field', '_tracking_number' => 'sanitize_text_field', '_tracking_url' => 'esc_url_raw' );
		foreach ( $fields as $key => $sanitize ) { if ( isset( $_POST[ $key ] ) ) $order->update_meta_data( $key, call_user_func( $sanitize, wp_unslash( $_POST[ $key ] ) ) ); }
		$order->save();
	}

	public static function menu() {
		add_options_page(
			__( 'LAB_CORE Accounts', 'lab-core-accounts' ),
			__( 'LAB_CORE Accounts', 'lab-core-accounts' ),
			'manage_options',
			'lab-core-accounts',
			array( __CLASS__, 'page' )
		);
	}

	public static function settings() {
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_frontend_url',
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_url' ),
				'default'           => home_url( '/' ),
			)
		);
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_allowed_origins',
			array(
				'type'              => 'string',
				'sanitize_callback' => array( __CLASS__, 'sanitize_origins' ),
				'default'           => '',
			)
		);
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_session_days',
			array(
				'type'              => 'integer',
				'sanitize_callback' => static function ( $value ) {
					return min( 90, max( 1, absint( $value ) ) );
				},
				'default'           => 30,
			)
		);
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_discount_percent',
			array(
				'type'              => 'integer',
				'sanitize_callback' => static function ( $value ) {
					return min( 100, max( 0, absint( $value ) ) );
				},
				'default'           => 10,
			)
		);
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_discount_days',
			array(
				'type'              => 'integer',
				'sanitize_callback' => static function ( $value ) {
					return min( 365, max( 1, absint( $value ) ) );
				},
				'default'           => 30,
			)
		);
		register_setting(
			'lab_core_accounts',
			'lab_core_accounts_delete_data',
			array(
				'type'              => 'boolean',
				'sanitize_callback' => static function ( $value ) {
					return $value ? 1 : 0;
				},
				'default'           => 0,
			)
		);
	}

	public static function sanitize_url( $value ) {
		$url = esc_url_raw( trim( (string) $value ) );
		return $url ? trailingslashit( $url ) : home_url( '/' );
	}

	public static function sanitize_origins( $value ) {
		$values  = preg_split( '/[\r\n,]+/', (string) $value );
		$origins = array();

		foreach ( $values as $candidate ) {
			$parts = wp_parse_url( trim( $candidate ) );
			if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) || ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) {
				continue;
			}

			$origin = strtolower( $parts['scheme'] ) . '://' . strtolower( $parts['host'] );
			if ( ! empty( $parts['port'] ) ) {
				$origin .= ':' . absint( $parts['port'] );
			}
			$origins[] = $origin;
		}

		return implode( "\n", array_values( array_unique( $origins ) ) );
	}

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		global $wpdb;
		$table       = LAB_Core_Accounts_Install::table_name();
		$table_ready = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) === $table;
		$woo_ready   = class_exists( 'WooCommerce' );
		$rest_url    = rest_url( LAB_Core_Accounts_REST::NAMESPACE . '/' );
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'LAB_CORE Accounts', 'lab-core-accounts' ); ?></h1>
			<p><?php esc_html_e( 'Secure customer sessions and WooCommerce account services for the LAB_CORE Astro storefront.', 'lab-core-accounts' ); ?></p>

			<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;max-width:900px;margin:22px 0;">
				<div class="card" style="margin:0;max-width:none;">
					<h2 style="margin-top:0;"><?php esc_html_e( 'Session table', 'lab-core-accounts' ); ?></h2>
					<p><strong style="color:<?php echo $table_ready ? '#008a20' : '#b32d2e'; ?>;"><?php echo $table_ready ? esc_html__( 'Operational', 'lab-core-accounts' ) : esc_html__( 'Missing', 'lab-core-accounts' ); ?></strong></p>
				</div>
				<div class="card" style="margin:0;max-width:none;">
					<h2 style="margin-top:0;"><?php esc_html_e( 'WooCommerce', 'lab-core-accounts' ); ?></h2>
					<p><strong style="color:<?php echo $woo_ready ? '#008a20' : '#996800'; ?>;"><?php echo $woo_ready ? esc_html__( 'Connected', 'lab-core-accounts' ) : esc_html__( 'Optional / inactive', 'lab-core-accounts' ); ?></strong></p>
				</div>
				<div class="card" style="margin:0;max-width:none;">
					<h2 style="margin-top:0;"><?php esc_html_e( 'REST namespace', 'lab-core-accounts' ); ?></h2>
					<p><code><?php echo esc_html( $rest_url ); ?></code></p>
				</div>
			</div>

			<form action="options.php" method="post" style="max-width:900px;">
				<?php settings_fields( 'lab_core_accounts' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="lab_core_accounts_frontend_url"><?php esc_html_e( 'Storefront URL', 'lab-core-accounts' ); ?></label></th>
						<td>
							<input class="regular-text" type="url" id="lab_core_accounts_frontend_url" name="lab_core_accounts_frontend_url" value="<?php echo esc_attr( get_option( 'lab_core_accounts_frontend_url', home_url( '/' ) ) ); ?>" required />
							<p class="description"><?php esc_html_e( 'Public Astro site root. Password recovery links point to /cuenta on this domain.', 'lab-core-accounts' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="lab_core_accounts_allowed_origins"><?php esc_html_e( 'Allowed browser origins', 'lab-core-accounts' ); ?></label></th>
						<td>
							<textarea class="large-text code" rows="4" id="lab_core_accounts_allowed_origins" name="lab_core_accounts_allowed_origins" placeholder="https://labcore.co"><?php echo esc_textarea( get_option( 'lab_core_accounts_allowed_origins', '' ) ); ?></textarea>
							<p class="description"><?php esc_html_e( 'One exact origin per line. The Astro server proxy does not require CORS, but these origins may call the API directly.', 'lab-core-accounts' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="lab_core_accounts_session_days"><?php esc_html_e( 'Session duration', 'lab-core-accounts' ); ?></label></th>
						<td><input class="small-text" type="number" min="1" max="90" id="lab_core_accounts_session_days" name="lab_core_accounts_session_days" value="<?php echo esc_attr( get_option( 'lab_core_accounts_session_days', 30 ) ); ?>" /> <?php esc_html_e( 'days', 'lab-core-accounts' ); ?></td>
					</tr>
					<tr>
						<th scope="row"><label for="lab_core_accounts_discount_percent"><?php esc_html_e( 'Welcome discount', 'lab-core-accounts' ); ?></label></th>
						<td>
							<input class="small-text" type="number" min="0" max="100" id="lab_core_accounts_discount_percent" name="lab_core_accounts_discount_percent" value="<?php echo esc_attr( get_option( 'lab_core_accounts_discount_percent', 10 ) ); ?>" /> %
							&nbsp;&nbsp;<?php esc_html_e( 'Valid for', 'lab-core-accounts' ); ?> <input class="small-text" type="number" min="1" max="365" name="lab_core_accounts_discount_days" value="<?php echo esc_attr( get_option( 'lab_core_accounts_discount_days', 30 ) ); ?>" /> <?php esc_html_e( 'days', 'lab-core-accounts' ); ?>
							<p class="description"><?php esc_html_e( 'Set the percentage to 0 to disable coupon creation. Coupons are single-use and restricted to the registered email.', 'lab-core-accounts' ); ?></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><?php esc_html_e( 'Uninstall behavior', 'lab-core-accounts' ); ?></th>
						<td><label><input type="checkbox" name="lab_core_accounts_delete_data" value="1" <?php checked( get_option( 'lab_core_accounts_delete_data', 0 ), 1 ); ?> /> <?php esc_html_e( 'Delete the session table, settings, and plugin user metadata when the plugin is deleted.', 'lab-core-accounts' ); ?></label></td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<div class="card" style="max-width:900px;">
				<h2><?php esc_html_e( 'Deployment checklist', 'lab-core-accounts' ); ?></h2>
				<ol>
					<li><?php esc_html_e( 'Set the storefront URL above and save changes.', 'lab-core-accounts' ); ?></li>
					<li><?php esc_html_e( 'Set WORDPRESS_API_URL on Astro/Vercel to this WordPress site root.', 'lab-core-accounts' ); ?></li>
					<li><?php esc_html_e( 'Configure a reliable SMTP provider in WordPress and test wp_mail() for password recovery.', 'lab-core-accounts' ); ?></li>
					<li><?php esc_html_e( 'Keep HTTPS enabled on both domains.', 'lab-core-accounts' ); ?></li>
				</ol>
			</div>
		</div>
		<?php
	}
}
