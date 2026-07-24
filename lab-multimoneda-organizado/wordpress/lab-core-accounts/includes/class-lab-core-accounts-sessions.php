<?php

defined( 'ABSPATH' ) || exit;

class LAB_Core_Accounts_Sessions {
	public static function init() {
		add_action( LAB_Core_Accounts_Install::CRON_HOOK, array( __CLASS__, 'cleanup' ) );
	}

	public static function issue( $user_id ) {
		global $wpdb;

		$user_id = absint( $user_id );
		if ( ! $user_id || ! get_userdata( $user_id ) ) {
			return new WP_Error( 'INVALID_USER', __( 'The customer account is invalid.', 'lab-core-accounts' ) );
		}

		try {
			$token = bin2hex( random_bytes( 32 ) );
		} catch ( Exception $exception ) {
			$token = wp_generate_password( 64, false, false );
		}

		$days       = min( 90, max( 1, absint( get_option( 'lab_core_accounts_session_days', 30 ) ) ) );
		$issued_at  = time();
		$expires_at = $issued_at + ( $days * DAY_IN_SECONDS );
		$hash       = hash( 'sha256', $token );
		$inserted   = $wpdb->insert(
			LAB_Core_Accounts_Install::table_name(),
			array(
				'user_id'     => $user_id,
				'token_hash'  => $hash,
				'created_at'  => gmdate( 'Y-m-d H:i:s', $issued_at ),
				'expires_at'  => gmdate( 'Y-m-d H:i:s', $expires_at ),
				'last_used_at'=> gmdate( 'Y-m-d H:i:s', $issued_at ),
				'user_agent'  => self::user_agent(),
				'ip_hash'     => self::ip_hash(),
			),
			array( '%d', '%s', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $inserted ) {
			return new WP_Error( 'SESSION_CREATE_FAILED', __( 'The secure session could not be created.', 'lab-core-accounts' ) );
		}

		return array(
			'token'       => $token,
			'token_hash'  => $hash,
			'expires_at'  => gmdate( DATE_ATOM, $expires_at ),
			'expires_in'  => $days * DAY_IN_SECONDS,
		);
	}

	public static function authenticate( WP_REST_Request $request ) {
		global $wpdb;

		$token = self::bearer_token( $request );
		if ( ! $token || strlen( $token ) < 32 || strlen( $token ) > 128 ) {
			return new WP_Error( 'UNAUTHORIZED', __( 'A valid session is required.', 'lab-core-accounts' ), array( 'status' => 401 ) );
		}

		$hash = hash( 'sha256', $token );
		$row  = $wpdb->get_row(
			$wpdb->prepare(
				'SELECT id, user_id, token_hash, expires_at FROM ' . LAB_Core_Accounts_Install::table_name() . ' WHERE token_hash = %s LIMIT 1',
				$hash
			)
		);

		if ( ! $row || ! hash_equals( (string) $row->token_hash, $hash ) ) {
			return new WP_Error( 'UNAUTHORIZED', __( 'The session is invalid.', 'lab-core-accounts' ), array( 'status' => 401 ) );
		}

		$expires_at = strtotime( $row->expires_at . ' UTC' );
		if ( ! $expires_at || $expires_at <= time() ) {
			self::revoke_hash( $hash );
			return new WP_Error( 'UNAUTHORIZED', __( 'The session has expired.', 'lab-core-accounts' ), array( 'status' => 401 ) );
		}

		$user = get_userdata( absint( $row->user_id ) );
		if ( ! $user ) {
			self::revoke_hash( $hash );
			return new WP_Error( 'UNAUTHORIZED', __( 'The customer account no longer exists.', 'lab-core-accounts' ), array( 'status' => 401 ) );
		}

		$wpdb->update(
			LAB_Core_Accounts_Install::table_name(),
			array( 'last_used_at' => gmdate( 'Y-m-d H:i:s' ) ),
			array( 'id' => absint( $row->id ) ),
			array( '%s' ),
			array( '%d' )
		);

		return array(
			'user'       => $user,
			'token_hash' => $hash,
		);
	}

	public static function revoke_hash( $hash ) {
		global $wpdb;
		if ( preg_match( '/^[a-f0-9]{64}$/', (string) $hash ) ) {
			$wpdb->delete( LAB_Core_Accounts_Install::table_name(), array( 'token_hash' => $hash ), array( '%s' ) );
		}
	}

	public static function revoke_all( $user_id ) {
		global $wpdb;
		$wpdb->delete( LAB_Core_Accounts_Install::table_name(), array( 'user_id' => absint( $user_id ) ), array( '%d' ) );
	}

	public static function cleanup() {
		global $wpdb;
		$wpdb->query(
			$wpdb->prepare(
				'DELETE FROM ' . LAB_Core_Accounts_Install::table_name() . ' WHERE expires_at < %s',
				gmdate( 'Y-m-d H:i:s' )
			)
		);
	}

	private static function bearer_token( WP_REST_Request $request ) {
		$header = $request->get_header( 'authorization' );

		if ( ! $header && ! empty( $_SERVER['HTTP_AUTHORIZATION'] ) ) {
			$header = wp_unslash( $_SERVER['HTTP_AUTHORIZATION'] );
		}
		if ( ! $header && ! empty( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ) {
			$header = wp_unslash( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] );
		}

		if ( $header && preg_match( '/^Bearer\s+([^\s]+)$/i', trim( $header ), $matches ) ) {
			return trim( $matches[1] );
		}

		return '';
	}

	private static function user_agent() {
		$value = isset( $_SERVER['HTTP_USER_AGENT'] ) ? wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) : '';
		return substr( sanitize_text_field( $value ), 0, 255 );
	}

	private static function ip_hash() {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? wp_unslash( $_SERVER['REMOTE_ADDR'] ) : '';
		return $ip ? hash_hmac( 'sha256', sanitize_text_field( $ip ), wp_salt( 'auth' ) ) : '';
	}
}
