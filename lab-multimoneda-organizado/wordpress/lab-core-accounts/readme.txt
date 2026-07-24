=== LAB_CORE Accounts ===
Contributors: labcore
Tags: customer accounts, woocommerce, rest api, password reset
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.9
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Secure account services for the LAB_CORE Astro storefront.

== Description ==

LAB_CORE Accounts adds a purpose-built customer account API to WordPress:

* Customer registration and sign-in.
* Opaque bearer sessions stored as SHA-256 hashes in a dedicated database table.
* Sign-out, profile updates, and password changes.
* Password recovery links backed by WordPress native reset keys.
* WooCommerce order history using wc_get_orders() for HPOS compatibility.
* Secure order tracking by order number and billing email, including common carrier metadata.
* Optional personal, single-use welcome coupons restricted to the customer email.
* Exact-origin CORS allowlist, rate limiting, session cleanup, and no-store REST responses.
* An administrator settings screen under Settings > LAB_CORE Accounts.

The Astro storefront should call the plugin through its same-origin /api/account proxy. The proxy keeps the raw session token inside an HttpOnly cookie; WordPress stores only its hash.

== Installation ==

1. Upload lab-core-accounts.zip in Plugins > Add New > Upload Plugin.
2. Activate LAB_CORE Accounts.
3. Open Settings > LAB_CORE Accounts.
4. Set Storefront URL to the public Astro site: https://labcorepep.com/.
5. On Astro/Vercel, set WORDPRESS_API_URL to the WordPress site root. If omitted, the storefront falls back to WOOCOMMERCE_URL.
6. Configure HTTPS and a reliable WordPress SMTP provider.
7. Test registration, login, password recovery, and order history with a non-administrator customer account.

== REST API ==

Namespace: /wp-json/lab-core/v1

Public endpoints:

* POST /register
* POST /login
* POST /forgot-password
* POST /reset-password
* POST /track-order

Authenticated endpoints accept Authorization: Bearer TOKEN:

* POST /logout
* GET /me
* PATCH /me
* POST /change-password
* GET /orders

The raw token is returned only when a session is created. Storefront applications should protect it in an HttpOnly cookie or another secure server-side session mechanism.

== Security notes ==

* Passwords are handled by WordPress and are never stored by this plugin.
* Password reset responses do not reveal whether an email exists.
* Password changes and resets revoke all existing LAB_CORE sessions.
* Session tokens expire automatically and a daily cleanup job removes expired records.
* The API does not grant access to wp-admin or WordPress core REST resources.
* wp_mail() accepting a message does not guarantee delivery. Configure and monitor SMTP separately.

== Changelog ==

= 1.0.9 =
* Normalize password-recovery responses after WordPress receives the request.
* Rebuild account emails as full-width, email-client-safe dark templates.
* Add explicit dark color-scheme metadata, bgcolor fallbacks, and compact mobile spacing.

= 1.0.8 =
* Replace plain-text account emails with responsive branded HTML templates.
* Start a fresh secure session automatically after a successful password reset.
* Improve recovery response handling when WordPress accepted the request but emitted a malformed response.

= 1.0.7 =
* Send the personal welcome coupon, expiration date, and account link in the registration email.
* Send unique native WordPress password recovery links exclusively to https://labcorepep.com/cuenta.
* Send account emails from info@labcorepep.com and log wp_mail handoff failures.

= 1.0.6 =
* Allow registered customers to track their orders with their current account email while retaining billing-email support for guest and historical orders.

= 1.0.3 =
* Add aggregate order count, customer spend, and store currency to the account order response.
* Power the storefront account overview without loading the full order history.

= 1.0.2 =
* Return a generic invalid-registration response for email addresses already associated with an account.
* Coordinate with the storefront password progress and strength indicators.

= 1.0.1 =
* Repacked the installable archive with portable POSIX paths for Linux WordPress hosts.

= 1.0.0 =
* Initial release.
