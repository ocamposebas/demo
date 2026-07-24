<?php

defined( 'ABSPATH' ) || exit;

class LAB_Core_Accounts_REST {
	const NAMESPACE = 'lab-core/v1';
	private static $authenticated_requests = array();

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_filter( 'rest_post_dispatch', array( __CLASS__, 'disable_cache' ), 20, 3 );
		add_filter( 'rest_pre_serve_request', array( __CLASS__, 'send_cors_headers' ), 20, 4 );
	}

	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/register',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'register' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/login',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'login' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/forgot-password',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'forgot_password' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/reset-password',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'reset_password' ),
				'permission_callback' => '__return_true',
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/logout',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'logout' ),
				'permission_callback' => array( __CLASS__, 'require_session' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/me',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'me' ),
					'permission_callback' => array( __CLASS__, 'require_session' ),
				),
				array(
					'methods'             => 'PATCH',
					'callback'            => array( __CLASS__, 'update_me' ),
					'permission_callback' => array( __CLASS__, 'require_session' ),
				),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/change-password',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'change_password' ),
				'permission_callback' => array( __CLASS__, 'require_session' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/orders',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'orders' ),
				'permission_callback' => array( __CLASS__, 'require_session' ),
			)
		);
		register_rest_route(
			self::NAMESPACE,
			'/track-order',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'track_order' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	public static function require_session( WP_REST_Request $request ) {
		$auth = LAB_Core_Accounts_Sessions::authenticate( $request );
		if ( is_wp_error( $auth ) ) {
			return $auth;
		}

		self::$authenticated_requests[ spl_object_hash( $request ) ] = $auth;
		return true;
	}

	public static function register( WP_REST_Request $request ) {
		$data       = self::json_data( $request );
		$email      = sanitize_email( self::value( $data, 'email' ) );
		$first_name = self::short_text( self::value( $data, 'first_name' ), 80 );
		$last_name  = self::short_text( self::value( $data, 'last_name' ), 80 );
		$password   = (string) self::value( $data, 'password' );
		$language   = self::value( $data, 'language' ) === 'en' ? 'en' : 'es';
		$age        = filter_var( self::value( $data, 'age_confirmed' ), FILTER_VALIDATE_BOOLEAN );

		$limited = self::rate_limit( 'register', 5, HOUR_IN_SECONDS, $email );
		if ( is_wp_error( $limited ) ) {
			return $limited;
		}

		if ( ! is_email( $email ) ) {
			return self::error( 'INVALID_EMAIL', __( 'Enter a valid email address.', 'lab-core-accounts' ), 400 );
		}
		if ( email_exists( $email ) ) {
			return self::error( 'INVALID_REGISTRATION', __( 'The registration details are invalid.', 'lab-core-accounts' ), 400 );
		}
		if ( ! $first_name || ! $last_name ) {
			return self::error( 'INVALID_FIELDS', __( 'First and last name are required.', 'lab-core-accounts' ), 400 );
		}
		if ( ! self::valid_password( $password ) ) {
			return self::error( 'WEAK_PASSWORD', __( 'The password must contain at least 10 characters.', 'lab-core-accounts' ), 400 );
		}
		if ( ! $age ) {
			return self::error( 'AGE_REQUIRED', __( 'You must confirm that you are 21 or older.', 'lab-core-accounts' ), 400 );
		}

		$role     = get_role( 'customer' ) ? 'customer' : 'subscriber';
		$user_id  = wp_insert_user(
			array(
				'user_login'   => self::unique_login( $email ),
				'user_email'   => $email,
				'user_pass'    => $password,
				'first_name'   => $first_name,
				'last_name'    => $last_name,
				'display_name' => trim( $first_name . ' ' . $last_name ),
				'role'         => $role,
			)
		);

		if ( is_wp_error( $user_id ) ) {
			return self::error( 'REGISTRATION_FAILED', __( 'The account could not be created.', 'lab-core-accounts' ), 500 );
		}

		update_user_meta( $user_id, 'billing_first_name', $first_name );
		update_user_meta( $user_id, 'billing_last_name', $last_name );
		update_user_meta( $user_id, '_lab_core_age_confirmed_at', gmdate( DATE_ATOM ) );
		update_user_meta( $user_id, '_lab_core_language', $language );

		$discount = self::create_welcome_discount( $user_id, $email );
		$session  = LAB_Core_Accounts_Sessions::issue( $user_id );

		if ( is_wp_error( $session ) ) {
			return self::error( 'SESSION_CREATE_FAILED', __( 'The account was created, but the session could not be started. Please sign in.', 'lab-core-accounts' ), 500 );
		}

		self::send_welcome_email( get_userdata( $user_id ), $discount, $language );

		return self::success(
			array(
				'user'        => self::user_payload( $user_id ),
				'token'       => $session['token'],
				'expires_in'  => $session['expires_in'],
				'expires_at'  => $session['expires_at'],
			),
			201
		);
	}

	public static function login( WP_REST_Request $request ) {
		$data     = self::json_data( $request );
		$email    = sanitize_email( self::value( $data, 'email' ) );
		$password = (string) self::value( $data, 'password' );

		$limited = self::rate_limit( 'login', 10, 15 * MINUTE_IN_SECONDS, $email );
		if ( is_wp_error( $limited ) ) {
			return $limited;
		}

		if ( ! is_email( $email ) || ! $password ) {
			return self::error( 'INVALID_CREDENTIALS', __( 'The email or password is incorrect.', 'lab-core-accounts' ), 401 );
		}

		$user = wp_authenticate( $email, $password );
		if ( is_wp_error( $user ) ) {
			return self::error( 'INVALID_CREDENTIALS', __( 'The email or password is incorrect.', 'lab-core-accounts' ), 401 );
		}

		$session = LAB_Core_Accounts_Sessions::issue( $user->ID );
		if ( is_wp_error( $session ) ) {
			return self::error( 'SESSION_CREATE_FAILED', __( 'The secure session could not be created.', 'lab-core-accounts' ), 500 );
		}

		return self::success(
			array(
				'user'       => self::user_payload( $user->ID ),
				'token'      => $session['token'],
				'expires_in' => $session['expires_in'],
				'expires_at' => $session['expires_at'],
			)
		);
	}

	public static function logout( WP_REST_Request $request ) {
		$auth = self::authenticated_request( $request );
		LAB_Core_Accounts_Sessions::revoke_hash( $auth['token_hash'] );
		return self::success();
	}

	public static function me( WP_REST_Request $request ) {
		$auth = self::authenticated_request( $request );
		return self::success( array( 'user' => self::user_payload( $auth['user']->ID ) ) );
	}

	public static function update_me( WP_REST_Request $request ) {
		$auth       = self::authenticated_request( $request );
		$user_id    = absint( $auth['user']->ID );
		$data       = self::json_data( $request );
		$first_name = self::short_text( self::value( $data, 'first_name' ), 80 );
		$last_name  = self::short_text( self::value( $data, 'last_name' ), 80 );

		if ( ! $first_name || ! $last_name ) {
			return self::error( 'INVALID_FIELDS', __( 'First and last name are required.', 'lab-core-accounts' ), 400 );
		}

		$updated = wp_update_user(
			array(
				'ID'           => $user_id,
				'first_name'   => $first_name,
				'last_name'    => $last_name,
				'display_name' => trim( $first_name . ' ' . $last_name ),
			)
		);

		if ( is_wp_error( $updated ) ) {
			return self::error( 'PROFILE_UPDATE_FAILED', __( 'The profile could not be updated.', 'lab-core-accounts' ), 500 );
		}

		$meta_fields = array(
			'phone'     => 'billing_phone',
			'country'   => 'billing_country',
			'address_1' => 'billing_address_1',
			'address_2' => 'billing_address_2',
			'city'      => 'billing_city',
			'state'     => 'billing_state',
			'postcode'  => 'billing_postcode',
		);

		foreach ( $meta_fields as $field => $meta_key ) {
			$value = self::short_text( self::value( $data, $field ), 180 );
			update_user_meta( $user_id, $meta_key, $value );
		}

		update_user_meta( $user_id, 'billing_first_name', $first_name );
		update_user_meta( $user_id, 'billing_last_name', $last_name );

		return self::success( array( 'user' => self::user_payload( $user_id ) ) );
	}

	public static function forgot_password( WP_REST_Request $request ) {
		$data     = self::json_data( $request );
		$email    = sanitize_email( self::value( $data, 'email' ) );
		$language = self::value( $data, 'language' ) === 'en' ? 'en' : 'es';

		$limited = self::rate_limit( 'forgot', 5, HOUR_IN_SECONDS, $email );
		if ( is_wp_error( $limited ) ) {
			return $limited;
		}

		if ( is_email( $email ) ) {
			$user = get_user_by( 'email', $email );
			if ( $user ) {
				$key = get_password_reset_key( $user );
				if ( ! is_wp_error( $key ) ) {
					self::send_reset_email( $user, $key, $language );
				}
			}
		}

		return self::success(
			array(
				'message' => __( 'If an account matches that email, a recovery link will be sent.', 'lab-core-accounts' ),
			)
		);
	}

	public static function reset_password( WP_REST_Request $request ) {
		$data     = self::json_data( $request );
		$key      = self::short_text( self::value( $data, 'key' ), 100 );
		$login    = self::short_text( self::value( $data, 'login' ), 100 );
		$password = (string) self::value( $data, 'password' );

		$limited = self::rate_limit( 'reset', 8, HOUR_IN_SECONDS, $login );
		if ( is_wp_error( $limited ) ) {
			return $limited;
		}

		if ( ! self::valid_password( $password ) ) {
			return self::error( 'WEAK_PASSWORD', __( 'The password must contain at least 10 characters.', 'lab-core-accounts' ), 400 );
		}

		$user = check_password_reset_key( $key, $login );
		if ( is_wp_error( $user ) ) {
			return self::error( 'INVALID_RESET_KEY', __( 'The recovery link is invalid or expired.', 'lab-core-accounts' ), 400 );
		}

		reset_password( $user, $password );
		LAB_Core_Accounts_Sessions::revoke_all( $user->ID );

		return self::success();
	}

	public static function change_password( WP_REST_Request $request ) {
		$auth             = self::authenticated_request( $request );
		$user_id          = absint( $auth['user']->ID );
		$data             = self::json_data( $request );
		$current_password = (string) self::value( $data, 'current_password' );
		$new_password     = (string) self::value( $data, 'new_password' );
		$user             = get_userdata( $user_id );

		if ( ! $user || ! wp_check_password( $current_password, $user->user_pass, $user_id ) ) {
			return self::error( 'CURRENT_PASSWORD_INVALID', __( 'The current password is incorrect.', 'lab-core-accounts' ), 400 );
		}
		if ( ! self::valid_password( $new_password ) ) {
			return self::error( 'WEAK_PASSWORD', __( 'The password must contain at least 10 characters.', 'lab-core-accounts' ), 400 );
		}

		wp_set_password( $new_password, $user_id );
		LAB_Core_Accounts_Sessions::revoke_all( $user_id );
		$session = LAB_Core_Accounts_Sessions::issue( $user_id );

		if ( is_wp_error( $session ) ) {
			return self::error( 'SESSION_CREATE_FAILED', __( 'The password changed, but a new session could not be created.', 'lab-core-accounts' ), 500 );
		}

		return self::success(
			array(
				'user'       => self::user_payload( $user_id ),
				'token'      => $session['token'],
				'expires_in' => $session['expires_in'],
				'expires_at' => $session['expires_at'],
			)
		);
	}

	public static function orders( WP_REST_Request $request ) {
		$auth    = self::authenticated_request( $request );
		$user_id = absint( $auth['user']->ID );
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return self::success(
				array(
					'orders'      => array(),
					'summary'     => array( 'total_orders' => 0, 'total_spent' => '0', 'currency' => 'USD' ),
					'woocommerce' => false,
				)
			);
		}

		try {
			$order_query = wc_get_orders(
				array(
					'customer_id' => $user_id,
					'limit'       => 30,
					'orderby'     => 'date',
					'order'       => 'DESC',
					'return'      => 'objects',
					'paginate'    => true,
				)
			);
			$orders       = is_object( $order_query ) && isset( $order_query->orders ) ? $order_query->orders : array();
			$total_orders = is_object( $order_query ) && isset( $order_query->total ) ? absint( $order_query->total ) : count( $orders );
			$total_spent  = 0;
			if ( function_exists( 'wc_get_customer_total_spent' ) ) {
				$total_spent = wc_get_customer_total_spent( $user_id );
			} else {
				foreach ( $orders as $summary_order ) {
					$total_spent += (float) $summary_order->get_total();
				}
			}
		} catch ( Throwable $throwable ) {
			return self::error( 'ORDER_QUERY_FAILED', __( 'Orders could not be loaded.', 'lab-core-accounts' ), 500 );
		}

		$payload = array();
		foreach ( $orders as $order ) {
			$items = array();
			foreach ( $order->get_items() as $item ) {
				$items[] = array(
					'name'     => wp_strip_all_tags( $item->get_name() ),
					'quantity' => absint( $item->get_quantity() ),
					'total'    => (string) $item->get_total(),
				);
			}

			$date      = $order->get_date_created();
			$payload[] = array(
				'id'           => $order->get_id(),
				'number'       => $order->get_order_number(),
				'status'       => $order->get_status(),
				'status_label' => wc_get_order_status_name( $order->get_status() ),
				'date_created' => $date ? $date->date( DATE_ATOM ) : null,
				'total'        => (string) $order->get_total(),
				'currency'     => $order->get_currency(),
				'item_count'   => $order->get_item_count(),
				'items'        => $items,
				'tracking'     => self::tracking_payload( $order ),
			);
		}

		return self::success(
			array(
				'orders'      => $payload,
				'summary'     => array(
					'total_orders' => $total_orders,
					'total_spent'  => (string) $total_spent,
					'currency'     => function_exists( 'get_woocommerce_currency' ) ? get_woocommerce_currency() : 'USD',
				),
				'woocommerce' => true,
			)
		);
	}

	public static function track_order( WP_REST_Request $request ) {
		$data         = self::json_data( $request );
		$order_number = preg_replace( '/[^A-Za-z0-9\-_]/', '', (string) self::value( $data, 'order_number' ) );
		$email        = sanitize_email( self::value( $data, 'email' ) );
		$limited      = self::rate_limit( 'track_order', 12, 15 * MINUTE_IN_SECONDS, $order_number . '|' . $email );
		if ( is_wp_error( $limited ) ) return $limited;
		if ( ! $order_number || ! is_email( $email ) || ! function_exists( 'wc_get_order' ) ) return self::error( 'TRACKING_NOT_FOUND', __( 'The order details do not match.', 'lab-core-accounts' ), 404 );

		$order = wc_get_order( absint( $order_number ) );
		if ( ! $order ) {
			$orders = wc_get_orders( array( 'limit' => 1, 'return' => 'objects', 'type' => 'shop_order', 'meta_key' => '_order_number', 'meta_value' => $order_number ) );
			$order = ! empty( $orders ) ? $orders[0] : false;
		}
		if ( ! $order ) return self::error( 'TRACKING_NOT_FOUND', __( 'The order details do not match.', 'lab-core-accounts' ), 404 );

		$provided_email = strtolower( trim( $email ) );
		$valid_emails   = array();
		$billing_email  = sanitize_email( $order->get_billing_email() );
		if ( $billing_email ) {
			$valid_emails[] = strtolower( trim( $billing_email ) );
		}

		$customer_id = absint( $order->get_customer_id() );
		if ( $customer_id ) {
			$customer = get_userdata( $customer_id );
			if ( $customer && is_email( $customer->user_email ) ) {
				$valid_emails[] = strtolower( trim( sanitize_email( $customer->user_email ) ) );
			}
		}

		if ( ! in_array( $provided_email, array_unique( $valid_emails ), true ) ) return self::error( 'TRACKING_NOT_FOUND', __( 'The order details do not match.', 'lab-core-accounts' ), 404 );

		$date = $order->get_date_created();
		return self::success( array( 'order' => array(
			'id' => $order->get_id(), 'number' => $order->get_order_number(), 'status' => $order->get_status(),
			'status_label' => wc_get_order_status_name( $order->get_status() ), 'date_created' => $date ? $date->date( DATE_ATOM ) : null,
			'tracking' => self::tracking_payload( $order ),
		) ) );
	}

	private static function tracking_payload( $order ) {
		$first_meta = static function ( $keys ) use ( $order ) { foreach ( $keys as $key ) { $value = $order->get_meta( $key, true ); if ( is_scalar( $value ) && trim( (string) $value ) !== '' ) return trim( (string) $value ); } return ''; };
		$number = $first_meta( array( '_tracking_number', 'tracking_number', '_wc_shipment_tracking_number', '_aftership_tracking_number', 'ywot_tracking_code', '_shiprocket_awb_code' ) );
		$provider = $first_meta( array( '_tracking_provider', 'tracking_provider', '_wc_shipment_tracking_provider', '_aftership_tracking_provider_name', 'ywot_carrier_name', '_shiprocket_courier_name' ) );
		$url = $first_meta( array( '_tracking_link', 'tracking_link', '_tracking_url', '_wc_shipment_tracking_link', '_aftership_tracking_url', 'ywot_tracking_url' ) );
		$status = $order->get_status();
		$stage = 0;
		if ( in_array( $status, array( 'processing', 'on-hold' ), true ) ) $stage = 1;
		if ( in_array( $status, array( 'shipped', 'in-transit', 'out-for-delivery' ), true ) || $number ) $stage = 2;
		if ( 'completed' === $status ) $stage = 3;
		if ( in_array( $status, array( 'cancelled', 'failed', 'refunded' ), true ) ) $stage = -1;
		return array( 'number' => sanitize_text_field( $number ), 'provider' => sanitize_text_field( $provider ), 'url' => esc_url_raw( $url ), 'stage' => $stage, 'status' => $status, 'updated_at' => $order->get_date_modified() ? $order->get_date_modified()->date( DATE_ATOM ) : null );
	}

	public static function disable_cache( $response, $server, WP_REST_Request $request ) {
		if ( 0 === strpos( $request->get_route(), '/' . self::NAMESPACE . '/' ) && method_exists( $response, 'header' ) ) {
			$response->header( 'Cache-Control', 'no-store, private' );
			$response->header( 'Pragma', 'no-cache' );
		}
		return $response;
	}

	public static function send_cors_headers( $served, $result, WP_REST_Request $request, $server ) {
		if ( 0 !== strpos( $request->get_route(), '/' . self::NAMESPACE . '/' ) ) {
			return $served;
		}

		$origin  = get_http_origin();
		$allowed = self::allowed_origins();
		if ( $origin && in_array( self::normalize_origin( $origin ), $allowed, true ) ) {
			header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ), true );
			header( 'Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS', true );
			header( 'Access-Control-Allow-Headers: Authorization, Content-Type', true );
			header( 'Access-Control-Max-Age: 600', true );
			header( 'Vary: Origin', false );
		}

		return $served;
	}

	private static function success( $data = array(), $status = 200 ) {
		return new WP_REST_Response( array_merge( array( 'ok' => true ), $data ), $status );
	}

	private static function authenticated_request( WP_REST_Request $request ) {
		$key = spl_object_hash( $request );
		return isset( self::$authenticated_requests[ $key ] ) ? self::$authenticated_requests[ $key ] : array(
			'user'       => new WP_User(),
			'token_hash' => '',
		);
	}

	private static function error( $code, $message, $status ) {
		return new WP_Error( $code, $message, array( 'status' => absint( $status ) ) );
	}

	private static function json_data( WP_REST_Request $request ) {
		$data = $request->get_json_params();
		return is_array( $data ) ? $data : array();
	}

	private static function value( $data, $key ) {
		return isset( $data[ $key ] ) ? $data[ $key ] : '';
	}

	private static function short_text( $value, $length ) {
		return substr( sanitize_text_field( (string) $value ), 0, absint( $length ) );
	}

	private static function valid_password( $password ) {
		$length = strlen( (string) $password );
		return $length >= 10 && $length <= 4096;
	}

	private static function unique_login( $email ) {
		$parts = explode( '@', $email );
		$base  = sanitize_user( $parts[0], true );
		if ( strlen( $base ) < 3 ) {
			$base = 'lab-member';
		}

		$login = $base;
		while ( username_exists( $login ) ) {
			$login = substr( $base, 0, 48 ) . '-' . wp_rand( 1000, 999999 );
		}

		return $login;
	}

	private static function user_payload( $user_id ) {
		$user     = get_userdata( absint( $user_id ) );
		$discount = get_user_meta( $user->ID, '_lab_core_welcome_discount', true );

		return array(
			'id'               => $user->ID,
			'email'            => $user->user_email,
			'display_name'     => $user->display_name,
			'first_name'       => $user->first_name,
			'last_name'        => $user->last_name,
			'phone'            => (string) get_user_meta( $user->ID, 'billing_phone', true ),
			'registered_at'    => mysql_to_rfc3339( $user->user_registered ),
			'address'          => array(
				'country'   => (string) get_user_meta( $user->ID, 'billing_country', true ),
				'address_1' => (string) get_user_meta( $user->ID, 'billing_address_1', true ),
				'address_2' => (string) get_user_meta( $user->ID, 'billing_address_2', true ),
				'city'      => (string) get_user_meta( $user->ID, 'billing_city', true ),
				'state'     => (string) get_user_meta( $user->ID, 'billing_state', true ),
				'postcode'  => (string) get_user_meta( $user->ID, 'billing_postcode', true ),
			),
			'welcome_discount' => is_array( $discount ) && ! empty( $discount['code'] ) ? array(
				'code'       => sanitize_text_field( $discount['code'] ),
				'percent'    => isset( $discount['percent'] ) ? absint( $discount['percent'] ) : 10,
				'expires_at' => isset( $discount['expires_at'] ) ? sanitize_text_field( $discount['expires_at'] ) : null,
			) : null,
		);
	}

	private static function create_welcome_discount( $user_id, $email ) {
		$percent = min( 100, max( 0, absint( get_option( 'lab_core_accounts_discount_percent', 10 ) ) ) );
		$days    = min( 365, max( 1, absint( get_option( 'lab_core_accounts_discount_days', 30 ) ) ) );
		if ( ! $percent || ! class_exists( 'WC_Coupon' ) ) {
			return null;
		}

		try {
			$code = 'LAB' . $percent . '-' . strtoupper( wp_generate_password( 8, false, false ) );
			while ( function_exists( 'wc_get_coupon_id_by_code' ) && wc_get_coupon_id_by_code( $code ) ) {
				$code = 'LAB' . $percent . '-' . strtoupper( wp_generate_password( 8, false, false ) );
			}

			$expires = time() + ( $days * DAY_IN_SECONDS );
			$coupon  = new WC_Coupon();
			$coupon->set_code( $code );
			$coupon->set_discount_type( 'percent' );
			$coupon->set_amount( $percent );
			$coupon->set_individual_use( true );
			$coupon->set_usage_limit( 1 );
			$coupon->set_usage_limit_per_user( 1 );
			$coupon->set_email_restrictions( array( $email ) );
			$coupon->set_date_expires( $expires );
			$coupon->set_description( 'LAB_CORE account welcome benefit for user #' . absint( $user_id ) );
			$coupon->update_meta_data( '_lab_core_accounts_generated', 1 );
			$coupon->save();

			$discount = array(
				'coupon_id'  => $coupon->get_id(),
				'code'       => $code,
				'percent'    => $percent,
				'expires_at' => gmdate( DATE_ATOM, $expires ),
			);
			update_user_meta( $user_id, '_lab_core_welcome_discount', $discount );
			return $discount;
		} catch ( Throwable $throwable ) {
			error_log( 'LAB_CORE Accounts coupon error: ' . $throwable->getMessage() );
			return null;
		}
	}

	private static function send_welcome_email( $user, $discount, $language ) {
		if ( ! $user ) {
			return;
		}

		if ( 'en' === $language ) {
			$subject = 'Your LAB_CORE account is ready';
			$message = "Hello {$user->first_name},\n\nYour LAB_CORE account is now active.";
			if ( is_array( $discount ) ) {
				$message .= "\n\nYour personal {$discount['percent']}% welcome code is: {$discount['code']}";
			}
			$message .= "\n\nResearch use only. Not for human or veterinary use.";
		} else {
			$subject = 'Tu cuenta LAB_CORE está lista';
			$message = "Hola {$user->first_name},\n\nTu cuenta LAB_CORE ya está activa.";
			if ( is_array( $discount ) ) {
				$message .= "\n\nTu código personal de bienvenida del {$discount['percent']}% es: {$discount['code']}";
			}
			$message .= "\n\nSolo para investigación. No apto para uso humano ni veterinario.";
		}

		wp_mail( $user->user_email, $subject, $message );
	}

	private static function send_reset_email( $user, $key, $language ) {
		$frontend = esc_url_raw( get_option( 'lab_core_accounts_frontend_url', home_url( '/' ) ) );
		$url      = add_query_arg(
			array(
				'view'  => 'reset',
				'key'   => $key,
				'login' => $user->user_login,
			),
			trailingslashit( $frontend ) . 'cuenta'
		);

		if ( 'en' === $language ) {
			$subject = 'Reset your LAB_CORE password';
			$message = "A password reset was requested for your LAB_CORE account.\n\nCreate a new password here:\n{$url}\n\nIf you did not request this, you can ignore this email.";
		} else {
			$subject = 'Restablece tu contraseña de LAB_CORE';
			$message = "Recibimos una solicitud para restablecer la contraseña de tu cuenta LAB_CORE.\n\nCrea una contraseña nueva aquí:\n{$url}\n\nSi no hiciste esta solicitud, puedes ignorar este correo.";
		}

		$sent = wp_mail( $user->user_email, $subject, $message );
		if ( ! $sent ) {
			error_log( 'LAB_CORE Accounts could not hand the password reset email to wp_mail().' );
		}
	}

	private static function rate_limit( $bucket, $limit, $window, $identity = '' ) {
		$ip   = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$key  = 'lab_core_rate_' . md5( $bucket . '|' . strtolower( (string) $identity ) . '|' . $ip );
		$data = get_transient( $key );

		if ( ! is_array( $data ) ) {
			$data = array( 'count' => 0, 'started' => time() );
		}
		if ( time() - absint( $data['started'] ) >= $window ) {
			$data = array( 'count' => 0, 'started' => time() );
		}

		$data['count']++;
		set_transient( $key, $data, $window );

		if ( $data['count'] > $limit ) {
			return self::error( 'RATE_LIMITED', __( 'Too many attempts. Please wait and try again.', 'lab-core-accounts' ), 429 );
		}

		return true;
	}

	private static function allowed_origins() {
		$raw     = (string) get_option( 'lab_core_accounts_allowed_origins', '' );
		$values  = preg_split( '/[\r\n,]+/', $raw );
		$origins = array();

		foreach ( $values as $value ) {
			$origin = self::normalize_origin( $value );
			if ( $origin ) {
				$origins[] = $origin;
			}
		}

		return array_values( array_unique( $origins ) );
	}

	private static function normalize_origin( $value ) {
		$parts = wp_parse_url( trim( (string) $value ) );
		if ( empty( $parts['scheme'] ) || empty( $parts['host'] ) || ! in_array( strtolower( $parts['scheme'] ), array( 'http', 'https' ), true ) ) {
			return '';
		}

		$origin = strtolower( $parts['scheme'] ) . '://' . strtolower( $parts['host'] );
		if ( ! empty( $parts['port'] ) ) {
			$origin .= ':' . absint( $parts['port'] );
		}
		return $origin;
	}
}
