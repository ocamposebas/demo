<?php

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

wp_clear_scheduled_hook( 'lab_core_accounts_cleanup_sessions' );

if ( ! get_option( 'lab_core_accounts_delete_data', 0 ) ) {
	return;
}

global $wpdb;
$table_name = $wpdb->prefix . 'lab_core_sessions';
$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared

delete_metadata( 'user', 0, '_lab_core_age_confirmed_at', '', true );
delete_metadata( 'user', 0, '_lab_core_language', '', true );
delete_metadata( 'user', 0, '_lab_core_welcome_discount', '', true );

$options = array(
	'lab_core_accounts_db_version',
	'lab_core_accounts_frontend_url',
	'lab_core_accounts_allowed_origins',
	'lab_core_accounts_session_days',
	'lab_core_accounts_discount_percent',
	'lab_core_accounts_discount_days',
	'lab_core_accounts_delete_data',
);

foreach ( $options as $option ) {
	delete_option( $option );
}

$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_lab_core_rate_%' OR option_name LIKE '_transient_timeout_lab_core_rate_%'" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
