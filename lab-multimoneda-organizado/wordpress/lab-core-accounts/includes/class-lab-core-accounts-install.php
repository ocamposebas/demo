<?php

defined( 'ABSPATH' ) || exit;

class LAB_Core_Accounts_Install {
	const CRON_HOOK = 'lab_core_accounts_cleanup_sessions';

	public static function table_name() {
		global $wpdb;
		return $wpdb->prefix . 'lab_core_sessions';
	}

	public static function activate() {
		self::create_table();
		self::add_defaults();

		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK );
		}
	}

	public static function deactivate() {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	public static function maybe_upgrade() {
		if ( get_option( 'lab_core_accounts_db_version' ) !== LAB_CORE_ACCOUNTS_DB_VERSION ) {
			self::create_table();
			self::add_defaults();
		}

		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK );
		}
	}

	private static function create_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$table_name      = self::table_name();
		$charset_collate = $wpdb->get_charset_collate();

		$sql = "CREATE TABLE {$table_name} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned NOT NULL,
			token_hash char(64) NOT NULL,
			created_at datetime NOT NULL,
			expires_at datetime NOT NULL,
			last_used_at datetime DEFAULT NULL,
			user_agent varchar(255) NOT NULL DEFAULT '',
			ip_hash char(64) NOT NULL DEFAULT '',
			PRIMARY KEY  (id),
			UNIQUE KEY token_hash (token_hash),
			KEY user_id (user_id),
			KEY expires_at (expires_at)
		) {$charset_collate};";

		dbDelta( $sql );
		update_option( 'lab_core_accounts_db_version', LAB_CORE_ACCOUNTS_DB_VERSION, false );
	}

	private static function add_defaults() {
		$home_parts = wp_parse_url( home_url( '/' ) );
		$origin     = '';

		if ( ! empty( $home_parts['scheme'] ) && ! empty( $home_parts['host'] ) ) {
			$origin = $home_parts['scheme'] . '://' . $home_parts['host'];
			if ( ! empty( $home_parts['port'] ) ) {
				$origin .= ':' . absint( $home_parts['port'] );
			}
		}

		add_option( 'lab_core_accounts_frontend_url', home_url( '/' ), '', false );
		add_option( 'lab_core_accounts_allowed_origins', $origin, '', false );
		add_option( 'lab_core_accounts_session_days', 30, '', false );
		add_option( 'lab_core_accounts_discount_percent', 10, '', false );
		add_option( 'lab_core_accounts_discount_days', 30, '', false );
		add_option( 'lab_core_accounts_delete_data', 0, '', false );
	}
}
