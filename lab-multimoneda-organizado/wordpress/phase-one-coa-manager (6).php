<?php
/**
 * Plugin Name: Phase One COA Manager
 * Description: Premium intelligent COA workspace with bulk PDF/link scanning, live review, family and WooCommerce matching, and REST API for Phase One Labz/Astro.
 * Version: 2.3.1
 * Author: Phase One Labz
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: phase-one-coa-manager
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Phase_One_COA_Manager {
    const VERSION = '2.3.1';
    const CPT = 'phaseone_coa';
    const REST_NAMESPACE = 'phaseone/v1';
    const META_PREFIX = '_p1coa_';
    const OFFICIAL_LABORATORY = 'ILS Labs';
    const SMART_MAX_ITEMS = 40;
    const SMART_MAX_FILE_BYTES = 26214400;

    public static function init() {
        add_action('init', [__CLASS__, 'register_post_type']);
        add_action('add_meta_boxes', [__CLASS__, 'add_meta_boxes']);
        add_action('save_post_' . self::CPT, [__CLASS__, 'save_post'], 10, 2);
        add_action('admin_enqueue_scripts', [__CLASS__, 'enqueue_admin_assets']);
        add_action('admin_menu', [__CLASS__, 'admin_menu']);
        add_action('load-edit.php', [__CLASS__, 'maybe_redirect_to_family_library']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
        add_action('rest_api_init', [__CLASS__, 'register_rest_routes']);
        add_filter('rest_pre_serve_request', [__CLASS__, 'maybe_add_cors_headers'], 10, 4);
        add_filter('manage_' . self::CPT . '_posts_columns', [__CLASS__, 'columns']);
        add_action('manage_' . self::CPT . '_posts_custom_column', [__CLASS__, 'column_content'], 10, 2);
        add_filter('manage_edit-' . self::CPT . '_sortable_columns', [__CLASS__, 'sortable_columns']);
        add_action('admin_post_p1coa_export_json', [__CLASS__, 'export_json']);
        add_action('admin_post_p1coa_save_family_name', [__CLASS__, 'save_family_name']);
        add_action('admin_post_p1coa_smart_scan', [__CLASS__, 'handle_smart_scan']);
        add_action('admin_post_p1coa_smart_commit', [__CLASS__, 'handle_smart_commit']);
        add_action('admin_post_p1coa_smart_clear', [__CLASS__, 'handle_smart_clear']);
        add_action('wp_ajax_p1coa_get_product_matching_data', [__CLASS__, 'ajax_get_product_matching_data']);
        add_action('wp_ajax_p1coa_smart_scan_reset', [__CLASS__, 'ajax_smart_scan_reset']);
        add_action('wp_ajax_p1coa_smart_scan_item', [__CLASS__, 'ajax_smart_scan_item']);
    }

    public static function activate() {
        self::register_post_type();
        add_option('p1coa_auto_unmark_current', '1');
        add_option('p1coa_cors_origins', '');
        add_option('p1coa_autofill_on_save', '1');
        add_option('p1coa_smart_import_version', self::VERSION);
        flush_rewrite_rules();
    }

    public static function deactivate() {
        flush_rewrite_rules();
    }

    public static function register_post_type() {
        $labels = [
            'name' => 'COA Manager',
            'singular_name' => 'COA Record',
            'menu_name' => 'COA Manager',
            'add_new' => 'Add New COA',
            'add_new_item' => 'Add New COA',
            'edit_item' => 'Edit COA',
            'new_item' => 'New COA',
            'view_item' => 'View COA',
            'search_items' => 'Search COAs',
            'not_found' => 'No COAs found',
            'not_found_in_trash' => 'No COAs found in Trash',
            'all_items' => 'All COAs',
        ];

        register_post_type(self::CPT, [
            'labels' => $labels,
            'public' => false,
            'show_ui' => true,
            'show_in_menu' => true,
            'menu_position' => 56,
            'menu_icon' => 'dashicons-media-document',
            'capability_type' => 'post',
            'map_meta_cap' => true,
            'supports' => ['title'],
            'has_archive' => false,
            'rewrite' => false,
            'show_in_rest' => false,
        ]);
    }

    public static function add_meta_boxes() {
        add_meta_box(
            'p1coa_details',
            'COA Record Details',
            [__CLASS__, 'render_details_meta_box'],
            self::CPT,
            'normal',
            'high'
        );

        add_meta_box(
            'p1coa_help',
            'Frontend API',
            [__CLASS__, 'render_help_meta_box'],
            self::CPT,
            'side',
            'default'
        );
    }

    public static function enqueue_admin_assets($hook) {
        global $post_type;

        $screen = function_exists('get_current_screen') ? get_current_screen() : null;
        $is_coa_screen = ($post_type === self::CPT) || ($screen && $screen->post_type === self::CPT);
        $is_settings_page = isset($_GET['post_type']) && $_GET['post_type'] === self::CPT;

        if (!$is_coa_screen && !$is_settings_page) {
            return;
        }

        add_filter('admin_body_class', function ($classes) {
            return trim($classes . ' p1coa-admin-dark');
        });

        wp_enqueue_media();
        wp_enqueue_style(
            'p1coa-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.css',
            [],
            self::VERSION
        );
        wp_enqueue_script(
            'p1coa-admin',
            plugin_dir_url(__FILE__) . 'assets/admin.js',
            ['jquery'],
            self::VERSION,
            true
        );

        wp_add_inline_style('p1coa-admin', self::editor_inline_css());
        wp_add_inline_style('p1coa-admin', self::premium_admin_styles());
        wp_add_inline_script('p1coa-admin', self::editor_inline_js());

        wp_localize_script('p1coa-admin', 'P1COAAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('p1coa_product_matching'),
            'products' => self::get_product_matching_data(),
            'woocommerceActive' => class_exists('WooCommerce') && function_exists('wc_get_products'),
            'labels' => [
                'chooseVariation' => 'Choose a variation',
                'noVariation' => 'No variation / parent product only',
                'noVariationsFound' => 'No variations found for this product',
            ],
        ]);
    }

    private static function editor_inline_css() {
        return <<<'CSS'
#p1coa_details .inside{margin:0;padding:0;background:#f3f6fa}
#p1coa_details .postbox-header{border-bottom-color:#dce5ef}
.p1coa-admin-app{--p1-ink:#102033;--p1-muted:#64748b;--p1-line:#dce5ef;--p1-blue:#2563eb;--p1-panel:#fff;color:var(--p1-ink);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.p1coa-editor-hero{position:relative;overflow:hidden;padding:24px;background:linear-gradient(135deg,#08182c 0%,#10294a 58%,#0b2039 100%);color:#fff}
.p1coa-editor-hero:after{position:absolute;right:-80px;top:-110px;width:280px;height:280px;border:1px solid rgba(125,211,252,.13);border-radius:50%;box-shadow:0 0 0 42px rgba(59,130,246,.035),0 0 0 90px rgba(59,130,246,.025);content:""}
.p1coa-editor-hero-main{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:22px}
.p1coa-editor-identity{display:flex;min-width:0;align-items:center;gap:14px}.p1coa-editor-mark{display:grid;width:52px;height:52px;flex:0 0 52px;place-items:center;border:1px solid rgba(147,197,253,.25);border-radius:16px;background:linear-gradient(145deg,rgba(59,130,246,.24),rgba(34,211,238,.08));box-shadow:0 16px 45px rgba(0,0,0,.2);font-size:24px}
.p1coa-editor-kicker{margin:0 0 4px;color:#85b7ec;font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.p1coa-editor-title{overflow:hidden;margin:0;color:#fff;font-size:25px;font-weight:750;letter-spacing:-.035em;text-overflow:ellipsis;white-space:nowrap}.p1coa-editor-subtitle{margin:5px 0 0;color:#91a5bd;font-size:11px}
.p1coa-editor-chips{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.p1coa-editor-chip{display:inline-flex;min-height:28px;align-items:center;gap:6px;padding:0 10px;border:1px solid rgba(148,197,255,.15);border-radius:999px;background:rgba(255,255,255,.045);color:#bdd6ef;font-size:9px;font-weight:750}.p1coa-editor-chip:before{width:6px;height:6px;border-radius:50%;background:#70b9ff;box-shadow:0 0 10px rgba(112,185,255,.75);content:""}.p1coa-editor-chip.is-good{border-color:rgba(74,222,128,.2);color:#a7f3d0}.p1coa-editor-chip.is-good:before{background:#6ee7b7;box-shadow:0 0 10px rgba(110,231,183,.8)}.p1coa-editor-chip.is-warning{border-color:rgba(251,191,36,.2);color:#fde68a}.p1coa-editor-chip.is-warning:before{background:#fbbf24;box-shadow:0 0 10px rgba(251,191,36,.7)}
.p1coa-editor-progress{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(120px,260px);align-items:center;justify-content:end;gap:10px;margin-top:18px;color:#7590ad;font-size:9px;font-weight:750;text-transform:uppercase;letter-spacing:.12em}.p1coa-editor-progress-bar{overflow:hidden;height:5px;border-radius:99px;background:rgba(255,255,255,.08)}.p1coa-editor-progress-bar>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#3b82f6,#67e8f9);box-shadow:0 0 15px rgba(103,232,249,.4)}
.p1coa-editor-tabs{position:sticky;top:32px;z-index:20;display:flex;gap:5px;overflow-x:auto;padding:10px 14px;border-bottom:1px solid var(--p1-line);background:rgba(255,255,255,.96);box-shadow:0 8px 25px rgba(15,23,42,.05);scrollbar-width:none}.p1coa-editor-tabs::-webkit-scrollbar{display:none}.p1coa-editor-tab{display:inline-flex;min-height:38px;flex:0 0 auto;align-items:center;gap:7px;padding:0 13px;border:1px solid transparent;border-radius:11px;background:transparent;color:#718096;cursor:pointer;font-size:10px;font-weight:800;letter-spacing:.04em}.p1coa-editor-tab:hover{background:#f1f5f9;color:#334155}.p1coa-editor-tab.is-active{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8;box-shadow:0 6px 18px rgba(37,99,235,.08)}.p1coa-editor-tab-count{display:grid;min-width:18px;height:18px;place-items:center;border-radius:6px;background:rgba(37,99,235,.09);font-size:8px}
.p1coa-editor-content{padding:18px}.p1coa-editor-panel{display:none}.p1coa-editor-panel.is-active{display:block}.p1coa-editor-card{margin-bottom:14px;padding:18px;border:1px solid var(--p1-line);border-radius:18px;background:var(--p1-panel);box-shadow:0 10px 35px rgba(15,23,42,.045)}
.p1coa-section-title{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin:0 0 16px;padding:0 0 12px;border-bottom:1px solid #edf2f7}.p1coa-section-title h3{margin:0;color:#17283d;font-size:14px;font-weight:800;letter-spacing:-.015em}.p1coa-section-title p{max-width:540px;margin:2px 0 0;color:#8492a6;font-size:10px;line-height:1.55;text-align:right}
.p1coa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.p1coa-grid-two{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-field{display:grid;min-width:0;gap:6px;margin:0}.p1coa-field>span{color:#53657a;font-size:9px;font-weight:800;letter-spacing:.045em}.p1coa-field>small{color:#8b9aad;font-size:9px;line-height:1.45}.p1coa-field input:not([type=checkbox]),.p1coa-field select,.p1coa-field textarea{width:100%;max-width:none;min-height:42px;margin:0;padding:8px 11px;border:1px solid #d7e1eb;border-radius:11px;background:#fbfdff;color:#17283d;box-shadow:none;font-size:12px;transition:border-color .18s,box-shadow .18s,background .18s}.p1coa-field textarea{min-height:88px;resize:vertical}.p1coa-field input:focus,.p1coa-field select:focus,.p1coa-field textarea:focus{border-color:#7bb5f7;background:#fff;box-shadow:0 0 0 3px rgba(59,130,246,.1);outline:0}.p1coa-field-wide{grid-column:span 1}.p1coa-media-field{grid-column:span 2}.p1coa-media-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px}.p1coa-media-row .button{min-height:42px;border-color:#bfdbfe;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:750}
.p1coa-check-row{display:flex;flex-wrap:wrap;gap:9px}.p1coa-checkbox{display:flex;min-height:44px;align-items:center;gap:9px;margin:0;padding:0 13px;border:1px solid #dbe5ef;border-radius:12px;background:#fbfdff;color:#43566b;font-size:10px;font-weight:750}.p1coa-checkbox input{margin:0}.p1coa-panel-picker{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.p1coa-panel-option{position:relative;display:flex;min-height:68px;align-items:center;gap:10px;padding:0 13px;border:1px solid #dbe5ef;border-radius:14px;background:#fbfdff;cursor:pointer;color:#43566b;font-size:10px;font-weight:800;transition:.18s}.p1coa-panel-option:hover{transform:translateY(-1px);border-color:var(--panel-color);box-shadow:0 10px 25px rgba(15,23,42,.06)}.p1coa-panel-option:has(input:checked){border-color:var(--panel-color);background:color-mix(in srgb,var(--panel-color) 8%,white);box-shadow:0 0 0 2px color-mix(in srgb,var(--panel-color) 12%,transparent)}.p1coa-panel-option input{margin:0}.p1coa-panel-dot{width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:var(--panel-color);box-shadow:0 0 12px var(--panel-color)}
.p1coa-match-box{padding:14px;border:1px solid #dbe7f3;border-radius:15px;background:#f8fbff}.p1coa-match-actions{display:flex;align-items:center;gap:10px;margin-top:12px}.p1coa-match-actions .button-primary{min-height:38px;border-radius:10px}.p1coa-match-preview{margin-top:12px;padding:11px 13px;border:1px dashed #c9d7e6;border-radius:11px;background:#fff;color:#64748b;font-size:10px;line-height:1.5}
.p1coa-history{padding:0}.p1coa-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.p1coa-history-head strong{font-size:12px}.p1coa-history-head .button{min-height:38px;border-radius:10px}.p1coa-history-list{display:grid;gap:10px}.p1coa-history-row{position:relative;padding:15px;border:1px solid #dce5ef;border-radius:15px;background:#fbfdff}.p1coa-remove-row{position:absolute;right:10px;top:10px;z-index:2;width:28px;height:28px;border:1px solid #fecaca;border-radius:9px;background:#fff1f2;color:#be123c;cursor:pointer;font-size:18px}.p1coa-history-row .p1coa-grid{padding-right:30px}
.p1coa-advanced-note{display:flex;gap:10px;margin-bottom:14px;padding:12px 14px;border:1px solid #fde68a;border-radius:13px;background:#fffbeb;color:#86620c;font-size:10px;line-height:1.5}.p1coa-advanced-note strong{display:block;color:#713f12}
.p1coa-editor-savebar{position:sticky;bottom:0;z-index:25;display:flex;align-items:center;justify-content:space-between;gap:15px;margin:18px -18px -18px;padding:12px 18px;border-top:1px solid #dbe5ef;background:rgba(255,255,255,.96);box-shadow:0 -12px 30px rgba(15,23,42,.07)}.p1coa-editor-savecopy strong{display:block;color:#25364a;font-size:10px}.p1coa-editor-savecopy span{color:#8a99aa;font-size:9px}.p1coa-editor-save{min-height:42px;padding:0 20px;border:0;border-radius:11px;background:linear-gradient(135deg,#2563eb,#0ea5e9);box-shadow:0 10px 24px rgba(37,99,235,.22);color:#fff;cursor:pointer;font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.p1coa-editor-save:hover{filter:brightness(1.06)}
.p1coa-side-guide{color:#526579;font-size:11px;line-height:1.55}.p1coa-side-guide>strong{display:block;margin-bottom:9px;color:#1e3853;font-size:12px}.p1coa-side-guide ol{margin:0 0 12px 19px}.p1coa-side-guide li{margin:0 0 7px}.p1coa-side-guide p{padding:9px 10px;border-radius:9px;background:#eff6ff;color:#42648a;font-size:10px}.p1coa-side-guide details{margin-top:12px}.p1coa-side-guide summary{cursor:pointer;color:#5b7087;font-weight:700}.p1coa-side-guide code{display:block;margin-top:8px;padding:8px;word-break:break-all;white-space:normal;font-size:9px}
@media(max-width:1100px){.p1coa-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-panel-picker{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:782px){.p1coa-editor-hero{padding:18px}.p1coa-editor-hero-main{display:grid}.p1coa-editor-chips{justify-content:flex-start}.p1coa-editor-progress{grid-template-columns:auto 1fr;justify-content:stretch}.p1coa-editor-tabs{top:46px;padding-inline:10px}.p1coa-editor-content{padding:10px}.p1coa-editor-card{padding:14px;border-radius:14px}.p1coa-grid,.p1coa-grid-two{grid-template-columns:1fr}.p1coa-media-field,.p1coa-field-wide{grid-column:auto}.p1coa-section-title{display:block}.p1coa-section-title p{margin-top:5px;text-align:left}.p1coa-panel-picker{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-editor-savebar{margin:14px -10px -10px}.p1coa-editor-savecopy{display:none}}
CSS;
    }

    private static function premium_admin_styles() {
        return <<<'CSS'
/* Phase One COA Manager 2.2 — premium clinical workspace */
.p1coa-admin-app,.p1coa-library,.p1coa-smart,.p1coa-tools-page{--p1-navy:#071a2f;--p1-navy-2:#0b2947;--p1-electric:#1677ff;--p1-cyan:#29c5e6;--p1-ink:#13243a;--p1-muted:#687b91;--p1-line:#dce6f0;--p1-soft:#f4f8fc;--p1-white:#fff;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.p1coa-admin-app *,.p1coa-library *,.p1coa-smart *,.p1coa-tools-page *{box-sizing:border-box}
.p1coa-admin-app :focus-visible,.p1coa-library :focus-visible,.p1coa-smart :focus-visible,.p1coa-tools-page :focus-visible{outline:3px solid rgba(22,119,255,.2);outline-offset:2px}

/* Record editor */
#p1coa_details{overflow:hidden;border:0;border-radius:22px;background:#fff;box-shadow:0 20px 60px rgba(18,42,69,.1)}
#p1coa_details .postbox-header{min-height:50px;border-color:#e5edf5;background:#fff}
#p1coa_details .inside{background:#f5f8fc}
.p1coa-editor-hero{padding:30px 32px;background:radial-gradient(circle at 82% -20%,rgba(41,197,230,.28),transparent 34%),linear-gradient(135deg,#06182b 0%,#0a2b4a 66%,#0b3553 100%)}
.p1coa-editor-hero:before{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(90deg,transparent,#000);content:""}
.p1coa-editor-mark{width:58px;height:58px;flex-basis:58px;border-color:rgba(113,219,255,.34);border-radius:18px;background:linear-gradient(145deg,rgba(38,156,255,.34),rgba(51,218,230,.12));color:#dff8ff;box-shadow:0 18px 44px rgba(0,0,0,.25)}
.p1coa-editor-mark .dashicons{width:25px;height:25px;font-size:25px}
.p1coa-editor-kicker{margin-bottom:6px;color:#75d6ed;font-size:10px}.p1coa-editor-title{font-size:30px;font-weight:760}.p1coa-editor-subtitle{color:#9eb3c8;font-size:12px}
.p1coa-editor-chip{min-height:31px;padding:0 12px;border-color:rgba(175,215,255,.2);background:rgba(255,255,255,.07);color:#d7e8f8;font-size:10px}
.p1coa-editor-progress{margin-top:24px;color:#9cb0c4;font-size:10px}.p1coa-editor-progress-bar{height:7px;background:rgba(255,255,255,.11)}.p1coa-editor-progress-bar>span{background:linear-gradient(90deg,#1684ff,#4dd7e7)}
.p1coa-editor-tabs{gap:8px;padding:12px 18px;border-color:#e0e9f2;background:rgba(255,255,255,.97)}
.p1coa-editor-tab{min-height:42px;padding:0 15px;border-radius:12px;color:#6c7f94;font-size:11px}.p1coa-editor-tab:hover{background:#f3f7fb;color:#19334f}.p1coa-editor-tab.is-active{border-color:#cfe2ff;background:linear-gradient(180deg,#f1f7ff,#eaf3ff);color:#075fd2;box-shadow:0 8px 20px rgba(22,119,255,.09)}
.p1coa-editor-content{padding:22px}.p1coa-editor-card{margin-bottom:18px;padding:22px;border-color:#dfe8f1;border-radius:19px;box-shadow:0 10px 30px rgba(24,53,82,.045)}
.p1coa-section-title{margin-bottom:19px;padding-bottom:15px}.p1coa-section-title h3{font-size:16px}.p1coa-section-title p{color:#75879a;font-size:11px}
.p1coa-grid{gap:16px}.p1coa-field{gap:7px}.p1coa-field>span{color:#41566d;font-size:11px;letter-spacing:.02em}.p1coa-field>small{font-size:10px}.p1coa-field input:not([type=checkbox]),.p1coa-field select,.p1coa-field textarea{min-height:46px;padding:9px 13px;border-color:#d5e1ec;border-radius:12px;background:#f9fbfd;font-size:13px}.p1coa-field textarea{min-height:102px}.p1coa-field input:hover,.p1coa-field select:hover,.p1coa-field textarea:hover{border-color:#b7cada}.p1coa-field input:focus,.p1coa-field select:focus,.p1coa-field textarea:focus{border-color:#4695f5;box-shadow:0 0 0 4px rgba(22,119,255,.1)}
.p1coa-media-row .button,.p1coa-history-head .button{min-height:46px;border-color:#c9dfff;border-radius:12px;background:#edf5ff;color:#075fcf;font-size:12px;font-weight:700}
.p1coa-checkbox{min-height:50px;padding:0 16px;border-color:#d9e4ee;background:#f9fbfd;color:#344b63;font-size:12px}.p1coa-panel-option{min-height:76px;padding:0 16px;background:#fafcfe;color:#344b63;font-size:12px}
.p1coa-match-box{padding:18px;border-color:#d7e5f2;background:linear-gradient(145deg,#f7fbff,#f1f7fd)}.p1coa-match-actions .button-primary{min-height:42px;border:0;border-radius:11px;background:#1677ff;box-shadow:0 8px 18px rgba(22,119,255,.18)}.p1coa-match-preview{padding:14px 16px;font-size:11px}
.p1coa-history-row{padding:18px;background:#f9fbfd}.p1coa-advanced-note{padding:15px 17px;font-size:11px}
.p1coa-editor-savebar{padding:15px 22px;background:rgba(255,255,255,.97)}.p1coa-editor-savecopy strong{font-size:12px}.p1coa-editor-savecopy span{font-size:10px}.p1coa-editor-save{min-height:46px;padding:0 24px;border-radius:12px;background:linear-gradient(135deg,#0869f0,#18a9dd);box-shadow:0 12px 26px rgba(22,119,255,.25);font-size:11px}

/* Family library */
.p1coa-library{--p1-bg:#f4f7fb;--p1-panel:#fff;--p1-panel-2:#f7faff;--p1-line:#dce6f0;--p1-blue:#1677ff;--p1-text:#13243a;--p1-muted:#6d8094;max-width:1460px;margin-top:22px;color:var(--p1-text)}
.p1coa-library-hero{align-items:center;padding:38px 40px;border:0;border-radius:26px;background:radial-gradient(circle at 78% 0,rgba(42,201,225,.25),transparent 32%),radial-gradient(circle at 5% 0,rgba(31,127,255,.22),transparent 36%),linear-gradient(135deg,#06182b,#0a2946 68%,#0b3553);box-shadow:0 24px 65px rgba(7,26,47,.18)}
.p1coa-library-hero:before{position:absolute;right:-70px;bottom:-150px;width:390px;height:390px;border:1px solid rgba(117,220,242,.16);border-radius:50%;box-shadow:0 0 0 48px rgba(65,197,231,.035),0 0 0 96px rgba(65,197,231,.02);content:""}
.p1coa-library-kicker{margin-bottom:16px;color:#89dcee;font-size:10px}.p1coa-library-hero h1{font-size:42px;font-weight:760}.p1coa-library-hero p{color:#a7b8c9;font-size:14px}
.p1coa-btn{min-height:46px;border-color:rgba(194,222,247,.24);background:rgba(255,255,255,.075);color:#eef7ff;font-size:12px}.p1coa-btn-primary{border:0;background:linear-gradient(135deg,#f8fdff,#a7ecf6);color:#08213a;box-shadow:0 14px 28px rgba(40,199,227,.2)}.p1coa-btn-primary:hover{background:#fff;color:#08213a}
.p1coa-library-stats{gap:14px;margin:16px 0}.p1coa-stat{padding:20px;border-color:#dce6f0;background:#fff;box-shadow:0 10px 30px rgba(26,55,85,.055)}.p1coa-stat-icon{width:46px;height:46px;flex-basis:46px;border-color:#cfe2ff;background:#edf5ff;color:#1677ff}.p1coa-stat-green .p1coa-stat-icon{border-color:#c6eadc;background:#ebfaf4;color:#149567}.p1coa-stat-violet .p1coa-stat-icon{border-color:#ddd5fa;background:#f3f0ff;color:#7858d6}.p1coa-stat-cyan .p1coa-stat-icon{border-color:#c7eaf1;background:#eafafd;color:#1489a4}.p1coa-stat strong{color:#102740;font-size:27px}.p1coa-stat span:not(.p1coa-stat-icon){color:#718398;font-size:10px}
.p1coa-library-toolbar{padding:13px;border-color:#dce6f0;border-radius:18px;background:#fff;box-shadow:0 9px 28px rgba(25,54,84,.045)}.p1coa-library-search .dashicons{color:#7890a7}.p1coa-library-search input{border-color:#d7e3ee!important;background:#f7fafd!important;color:#152a42!important;font-size:12px}.p1coa-library-search input::placeholder{color:#8da0b3}.p1coa-filter-row button{color:#6a7e93;font-size:11px}.p1coa-filter-row button:hover{background:#f0f5fa;color:#15324f}.p1coa-filter-row button.is-active{border-color:#cfe2ff;background:#eaf3ff;color:#0763dc}.p1coa-toolbar-meta{color:#74879a;font-size:11px}.p1coa-toolbar-meta>span{color:#132d49}.p1coa-toolbar-meta button{color:#3c6d9d;font-size:11px}.p1coa-toolbar-meta button:hover{color:#075fcf}
.p1coa-family-list{gap:12px}.p1coa-family{border-color:#dbe5ef;border-radius:20px;background:#fff;box-shadow:0 12px 34px rgba(24,53,82,.055)}.p1coa-family-summary{min-height:94px;padding:18px 20px}.p1coa-family-summary:hover{background:#fbfdff}.p1coa-family-avatar{width:52px;height:52px;border-color:#cae0ff;background:linear-gradient(145deg,#edf5ff,#e5f8fb);color:#0968df;font-size:15px}.p1coa-family-overline{color:#5585b3;font-size:9px}.p1coa-family-heading strong{color:#122a43;font-size:20px}.p1coa-family-heading small{color:#72869a;font-size:11px}.p1coa-chip{min-height:30px;border-color:#dbe5ef;background:#f6f9fc;color:#60758a;font-size:10px}.p1coa-chip-current{border-color:#c7ebdb;background:#ebfaf4;color:#14845e}.p1coa-chip-warning{border-color:#f4ddbd;background:#fff8ed;color:#a36513}.p1coa-family-chevron{color:#69839c}
.p1coa-family-content{padding:0 14px 14px}.p1coa-family-name-form{padding:14px 16px;border-color:#dbe8f3;background:linear-gradient(90deg,#f3f8ff,#f8fbfe)}.p1coa-family-name-copy>.dashicons{border-color:#cde1ff;background:#eaf3ff;color:#126ee8}.p1coa-family-name-copy strong{color:#18324c;font-size:12px}.p1coa-family-name-copy small,.p1coa-family-name-help{color:#70869a;font-size:10px}.p1coa-family-name-form input[type=text]{border-color:#cfdeea!important;background:#fff!important;color:#152a42!important;font-size:13px}.p1coa-family-name-form input[type=text]::placeholder{color:#98a8b7}.p1coa-family-name-form button{border-color:#bcd9ff;background:#eaf3ff;color:#075fcf;font-size:11px}.p1coa-family-name-form button:hover{border-color:#8ebcff;background:#dfeeff;color:#064fa9}
.p1coa-record-head{color:#73879a;font-size:9px}.p1coa-record{min-height:76px;border-color:#e0e8f0;background:#f9fbfd}.p1coa-record:hover{border-color:#c9d9e8;background:#fff;box-shadow:0 8px 22px rgba(22,51,79,.05)}.p1coa-record.is-current{border-color:#c7e9da;background:linear-gradient(90deg,#edf9f4,#fbfdfc 42%)}.p1coa-strength{border-color:#cde2ff;background:#eaf3ff;color:#075fcf;font-size:11px}.p1coa-record strong{color:#1a3048;font-size:12px}.p1coa-record small{color:#74879a;font-size:10px}.p1coa-doc-state,.p1coa-current-label,.p1coa-neutral-label{font-size:10px}.p1coa-doc-state.is-ready{color:#1469bd}.p1coa-doc-state.is-missing{color:#a8661d}.p1coa-current-label{color:#14845e}.p1coa-neutral-label{color:#72869a}.p1coa-record-actions a{border-color:#d5e2ed;background:#fff;color:#58738d;font-size:10px}.p1coa-record-actions a:hover{border-color:#a9cfff;background:#eff6ff;color:#075fcf}.p1coa-record-actions a.is-primary{border-color:#c3dcff;background:#eaf3ff;color:#075fcf}
.p1coa-library-empty,.p1coa-library-no-results{border-color:#cbdbe9;background:#fff}.p1coa-library-empty h2,.p1coa-library-no-results h2{color:#15304d}.p1coa-library-empty p,.p1coa-library-no-results p{color:#71879b}.p1coa-library-footer{color:#73869a;font-size:11px}.p1coa-library-footer code{color:#58718a}.p1coa-library-footer a{color:#1269ca}.p1coa-library-footer a:hover{color:#0752a7}

/* Smart intake and review */
.p1coa-smart{--bg:#f4f7fb;--panel:#fff;--panel2:#f6f9fc;--line:#dce6f0;--blue:#1677ff;--cyan:#29c5e6;--text:#14263b;--muted:#6b7f94;color:var(--text)}
.p1coa-smart-hero{padding:38px 40px;border:0;background:radial-gradient(circle at 80% 0,rgba(41,197,230,.25),transparent 34%),linear-gradient(135deg,#06182b,#0a2947 70%,#0b3452);box-shadow:0 24px 65px rgba(7,26,47,.17)}.p1coa-smart-hero h1{font-size:42px;font-weight:760}.p1coa-smart-hero p{color:#a6b8ca;font-size:14px}.p1coa-smart-kicker{color:#81d8ed;font-size:10px}.p1coa-smart-shield{border-color:rgba(103,230,190,.26);background:rgba(67,208,161,.09)}.p1coa-smart-shield strong{font-size:12px}.p1coa-smart-shield small{color:#8eb8aa;font-size:10px}
.p1coa-smart-flow{margin:16px 0;padding:17px 22px;border-color:#dbe6f0;background:#fff;box-shadow:0 8px 26px rgba(24,53,82,.045)}.p1coa-smart-flow>div{color:#708398}.p1coa-smart-flow>div b{border-color:#dbe6f0;background:#f6f9fc;font-size:10px}.p1coa-smart-flow>div span{font-size:11px}.p1coa-smart-flow>div small{color:#8a9bae;font-size:9px}.p1coa-smart-flow>div.is-active{color:#174b7d}.p1coa-smart-flow>div.is-active b{border-color:#c8deff;background:#eaf3ff;color:#0967dc}.p1coa-smart-flow>i{background:#dbe5ee}
.p1coa-smart-upload{border-color:#dbe6f0;background:#fff;box-shadow:0 16px 45px rgba(22,51,80,.065)}.p1coa-smart-source-grid{gap:16px;padding:22px}.p1coa-smart-drop,.p1coa-smart-links{border-color:#bfd4e8;background:radial-gradient(circle at 50% 15%,rgba(34,142,255,.08),transparent 48%),#f7faff}.p1coa-smart-drop:hover,.p1coa-smart-drop.is-dragging{border-color:#3d9aff;background-color:#f0f7ff;box-shadow:inset 0 0 0 3px rgba(22,119,255,.06)}.p1coa-smart-drop strong,.p1coa-smart-links strong{color:#17304b;font-size:16px}.p1coa-smart-drop small,.p1coa-smart-links small{color:#71869b;font-size:11px}.p1coa-smart-drop em{border-color:#c9ddf0;background:#edf5fd;color:#3172aa;font-size:10px}.p1coa-smart-links textarea{border-color:#d2dfeb;background:#fff;color:#172b42;font-size:11px}.p1coa-smart-links textarea:focus{border-color:#4695f5;box-shadow:0 0 0 4px rgba(22,119,255,.09)}.p1coa-smart-options{border-color:#e0e8f0;background:#f9fbfd;color:#6f8397;font-size:11px}.p1coa-smart-options label{color:#344c64}.p1coa-smart-submit{border-color:#e0e8f0}.p1coa-smart-submit strong{color:#203a54;font-size:12px}.p1coa-smart-submit span{color:#75899d;font-size:10px}.p1coa-smart .button-hero{min-height:48px;border:0;border-radius:13px;background:linear-gradient(135deg,#0869ef,#19aadd);box-shadow:0 12px 27px rgba(22,119,255,.24);font-size:11px}.p1coa-smart .button-hero:hover{background:linear-gradient(135deg,#075fd8,#1497ca)}
.p1coa-smart-capabilities{gap:12px;margin-top:14px}.p1coa-smart-capabilities article{padding:18px;border-color:#dce6f0;background:#fff;box-shadow:0 8px 25px rgba(23,51,80,.04)}.p1coa-smart-capabilities strong{color:#203b55;font-size:11px}.p1coa-smart-capabilities small{color:#73879a;font-size:10px}
.p1coa-review-summary{border-color:#dce6f0;background:#fff;box-shadow:0 8px 25px rgba(23,51,80,.04)}.p1coa-review-summary>div{border-color:#e5ecf3}.p1coa-review-summary span{color:#72869a;font-size:10px}.p1coa-review-summary strong{color:#172d45}.p1coa-review-toolbar{border-color:#dce6f0;background:#fff}.p1coa-review-toolbar label{color:#455b71}.p1coa-review-toolbar p{color:#71869a}.p1coa-review-item{border-color:#dbe6f0;background:#fff;box-shadow:0 10px 28px rgba(22,51,80,.045)}.p1coa-review-item>header{background:#f9fbfd}.p1coa-review-index{border-color:#cbdff9;background:#eaf3ff;color:#0965d5}.p1coa-review-file strong{color:#19324c;font-size:12px}.p1coa-review-file small{color:#71869a;font-size:10px}.p1coa-confidence>span{background:#e3ebf2}.p1coa-confidence strong{color:#60788f;font-size:9px}.p1coa-review-toggle{border-color:#d3e0eb;background:#fff;color:#607a93}.p1coa-review-body{border-color:#e2eaf1}.p1coa-row-warnings span{border-color:#f0d8b3;background:#fff7e9;color:#966018;font-size:9px}
.p1coa-detected-grid label>span,.p1coa-review-match-row label>span,.p1coa-review-match-row>div>span{color:#566d84;font-size:9px}.p1coa-detected-grid input,.p1coa-review-match-row select{border-color:#d1dfeb;background:#f9fbfd;color:#172b42;font-size:11px}.p1coa-detected-grid input:focus,.p1coa-review-match-row select:focus{border-color:#4695f5;box-shadow:0 0 0 4px rgba(22,119,255,.09)}.p1coa-review-match-row{border-color:#dce6f0;background:#f7fafd}.p1coa-review-panels label{border-color:#d4e1ec;background:#fff;color:#536d85;font-size:9px}.p1coa-current-switch{border-color:#c8e8dc;background:#edf9f4}.p1coa-current-switch b{color:#28785e;font-size:9px}.p1coa-review-source{color:#71869a;font-size:9px}.p1coa-review-source b{color:#4d657c}.p1coa-review-source a{color:#126dcc}.p1coa-review-final{border-color:#dce6f0;background:rgba(255,255,255,.97);box-shadow:0 -14px 35px rgba(22,50,79,.08)}.p1coa-review-final label{color:#263f59;font-size:11px}.p1coa-review-final small{color:#71869a;font-size:9px}.p1coa-review-final .button:not(.button-primary){border-color:#d4e1ec;background:#f6f9fc;color:#526c84}

/* Import / export and settings */
.p1coa-tools-page{max-width:1180px;margin:22px auto 50px;padding-right:20px;color:#172b42}.p1coa-tools-page>h1{display:none}.p1coa-tools-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:28px;overflow:hidden;margin-bottom:16px;padding:34px 38px;border-radius:25px;background:radial-gradient(circle at 85% 0,rgba(41,197,230,.24),transparent 34%),linear-gradient(135deg,#06182b,#0a2b49);box-shadow:0 22px 58px rgba(7,26,47,.17);color:#fff}.p1coa-tools-hero:after{position:absolute;right:-90px;bottom:-190px;width:360px;height:360px;border:1px solid rgba(121,220,241,.14);border-radius:50%;box-shadow:0 0 0 48px rgba(60,197,227,.03);content:""}.p1coa-tools-hero-copy,.p1coa-tools-hero-badge{position:relative;z-index:1}.p1coa-tools-kicker{display:block;margin-bottom:9px;color:#7dd9ed;font-size:10px;font-weight:900;letter-spacing:.18em}.p1coa-tools-hero h1{margin:0;color:#fff;font-size:36px;line-height:1.08;letter-spacing:-.04em}.p1coa-tools-hero p{max-width:690px;margin:11px 0 0;color:#a8bacb;font-size:13px;line-height:1.65}.p1coa-tools-hero-badge{display:flex;min-width:190px;align-items:center;gap:12px;padding:14px 16px;border:1px solid rgba(165,220,255,.18);border-radius:16px;background:rgba(255,255,255,.065)}.p1coa-tools-hero-badge>.dashicons{width:30px;height:30px;color:#7dd9ed;font-size:30px}.p1coa-tools-hero-badge>span{display:grid;gap:2px}.p1coa-tools-hero-badge strong{font-size:11px}.p1coa-tools-hero-badge small{color:#8faac0;font-size:9px}
.p1coa-tools-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.p1coa-tool-card{position:relative;margin:0;padding:23px;border:1px solid #dce6f0;border-radius:19px;background:#fff;box-shadow:0 10px 30px rgba(23,51,80,.05)}.p1coa-tool-card.is-wide{grid-column:1/-1}.p1coa-tool-card-head{display:flex;align-items:flex-start;gap:13px;margin-bottom:14px}.p1coa-tool-card-icon{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border:1px solid #cce0ff;border-radius:13px;background:#eaf3ff;color:#126fe9}.p1coa-tool-card-icon .dashicons{width:19px;height:19px;font-size:19px}.p1coa-tool-card h2{margin:1px 0 4px;color:#17304a;font-size:16px}.p1coa-tool-card p{margin:0 0 15px;color:#6d8195;font-size:12px;line-height:1.65}.p1coa-tool-card code{border-radius:7px;background:#eef4f9;color:#34506b}.p1coa-tool-card input[type=file]{width:100%;padding:14px;border:1px dashed #bfd1e1;border-radius:12px;background:#f7fafd;color:#526a82}.p1coa-tool-card textarea{width:100%;padding:14px;border:1px solid #d3e0eb;border-radius:12px;background:#f8fafc;color:#17304a;box-shadow:none;font-size:12px}.p1coa-tool-card textarea:focus{border-color:#4695f5;box-shadow:0 0 0 4px rgba(22,119,255,.09)}.p1coa-tool-card .button{min-height:42px;padding:0 16px;border-radius:11px;font-weight:700}.p1coa-tool-card .button-primary{border:0;background:#1677ff;box-shadow:0 8px 18px rgba(22,119,255,.18)}.p1coa-api-endpoint{display:flex;align-items:center;gap:10px;padding:13px 15px;border:1px solid #dbe6ef;border-radius:12px;background:#f7fafd}.p1coa-api-endpoint code{overflow:hidden;flex:1;background:transparent;text-overflow:ellipsis;white-space:nowrap}.p1coa-api-endpoint .dashicons{color:#1677ff}
.p1coa-settings-grid{display:grid;gap:14px}.p1coa-setting-option{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:15px;padding:17px;border:1px solid #dce6f0;border-radius:15px;background:#f9fbfd;cursor:pointer}.p1coa-setting-option:hover{border-color:#bdd3e6;background:#fff}.p1coa-setting-option>input{position:absolute;opacity:0;pointer-events:none}.p1coa-setting-switch{position:relative;width:44px;height:24px;border-radius:99px;background:#b9c7d4;box-shadow:inset 0 1px 3px rgba(20,44,67,.16);transition:.2s}.p1coa-setting-switch:after{position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(17,39,61,.2);content:"";transition:.2s}.p1coa-setting-option>input:checked+.p1coa-setting-switch{background:linear-gradient(90deg,#1677ff,#20b7df)}.p1coa-setting-option>input:checked+.p1coa-setting-switch:after{left:24px}.p1coa-setting-option-copy{display:grid;gap:3px}.p1coa-setting-option-copy strong{color:#203a54;font-size:12px}.p1coa-setting-option-copy small{color:#71869a;font-size:10px;line-height:1.55}.p1coa-settings-actions{position:sticky;bottom:0;z-index:8;display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:16px;padding:15px 18px;border:1px solid #dce6f0;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 -10px 30px rgba(23,51,80,.07);backdrop-filter:blur(10px)}.p1coa-settings-actions span{color:#71869a;font-size:11px}.p1coa-settings-actions .button-primary{min-height:44px;padding:0 22px;border:0;border-radius:11px;background:linear-gradient(135deg,#0869ef,#19aadd);box-shadow:0 10px 22px rgba(22,119,255,.22);font-weight:800}
.p1coa-tools-page .notice{margin:0 0 14px;padding:3px 12px;border:1px solid #c9e8da;border-left:4px solid #25a56e;border-radius:12px;background:#f1fbf6;box-shadow:none}.p1coa-tools-page .notice-error{border-color:#f0c9cc;border-left-color:#d63638;background:#fff5f5}

/* Dark premium mode — deep navy surfaces without pure black */
body.p1coa-admin-dark #wpcontent{min-height:100vh;background:radial-gradient(circle at 78% 0,rgba(20,105,170,.08),transparent 30%),#050d17}
body.p1coa-admin-dark #wpbody-content{min-height:calc(100vh - 32px)}
body.p1coa-admin-dark #wpfooter,body.p1coa-admin-dark #wpfooter a{color:#687d91}
body.p1coa-admin-dark,.p1coa-admin-app,.p1coa-library,.p1coa-smart,.p1coa-tools-page{color-scheme:dark}
body.p1coa-admin-dark select,.p1coa-admin-app select,.p1coa-library select,.p1coa-smart select,.p1coa-tools-page select{border-color:#293f53!important;background-color:#071522!important;color:#edf6ff!important;color-scheme:dark!important}
body.p1coa-admin-dark select option,body.p1coa-admin-dark select optgroup,.p1coa-admin-app select option,.p1coa-admin-app select optgroup,.p1coa-library select option,.p1coa-library select optgroup,.p1coa-smart select option,.p1coa-smart select optgroup,.p1coa-tools-page select option,.p1coa-tools-page select optgroup{background:#071522!important;color:#edf6ff!important}
body.p1coa-admin-dark select option:checked,.p1coa-admin-app select option:checked,.p1coa-library select option:checked,.p1coa-smart select option:checked,.p1coa-tools-page select option:checked{background:#176bd1!important;color:#fff!important}
body.p1coa-admin-dark #screen-meta-links .show-settings{border-color:#20364a;background:#0b1825;color:#9db0c2}
body.p1coa-admin-dark #titlediv #title,body.p1coa-admin-dark #titlediv #title-prompt-text{border-color:#21384d;background:#091724;color:#eef7ff}
body.p1coa-admin-dark #submitdiv,body.p1coa-admin-dark #p1coa_help{border-color:#20364a;background:#0a1724;color:#cbdbea;box-shadow:0 14px 38px rgba(0,0,0,.2)}
body.p1coa-admin-dark #submitdiv .postbox-header,body.p1coa-admin-dark #p1coa_help .postbox-header{border-color:#20364a;background:#0d1b29;color:#e8f3fc}
body.p1coa-admin-dark #submitdiv .inside,body.p1coa-admin-dark #p1coa_help .inside,body.p1coa-admin-dark #major-publishing-actions{border-color:#20364a;background:#0a1724;color:#9eb2c4}
body.p1coa-admin-dark #submitdiv h2,body.p1coa-admin-dark #p1coa_help h2{color:#eaf5ff}

#p1coa_details{background:#081522;box-shadow:0 24px 70px rgba(0,0,0,.3)}
#p1coa_details .postbox-header{border-color:#20364a;background:#0c1a28;color:#eaf5ff}
#p1coa_details .postbox-header h2{color:#eaf5ff}
#p1coa_details .inside{background:#06111d}
.p1coa-admin-app{--p1-ink:#eaf4fe;--p1-muted:#8195a9;--p1-line:#203548;--p1-panel:#0b1927;color:#eaf4fe}
.p1coa-editor-tabs{border-color:#203548;background:rgba(8,21,34,.97);box-shadow:0 10px 30px rgba(0,0,0,.22)}
.p1coa-editor-tab{color:#7f94a9}.p1coa-editor-tab:hover{background:#102235;color:#d5e5f3}.p1coa-editor-tab.is-active{border-color:#28567b;background:linear-gradient(180deg,#123150,#0e2944);color:#83c7ff;box-shadow:0 8px 22px rgba(0,0,0,.2)}.p1coa-editor-tab-count{background:rgba(64,159,244,.15)}
.p1coa-editor-content{background:#06111d}.p1coa-editor-card{border-color:#203548;background:linear-gradient(180deg,#0c1a28,#091724);box-shadow:0 14px 36px rgba(0,0,0,.18)}
.p1coa-section-title{border-color:#1d3042}.p1coa-section-title h3{color:#edf6ff}.p1coa-section-title p{color:#7f93a6}
.p1coa-field>span{color:#b8cad9}.p1coa-field>small{color:#73889c}.p1coa-field input:not([type=checkbox]),.p1coa-field select,.p1coa-field textarea{border-color:#263c50;background:#071522;color:#eaf5ff}.p1coa-field input:hover,.p1coa-field select:hover,.p1coa-field textarea:hover{border-color:#37566f}.p1coa-field input:focus,.p1coa-field select:focus,.p1coa-field textarea:focus{border-color:#2588ed;background:#091a2a;box-shadow:0 0 0 4px rgba(37,136,237,.12)}.p1coa-field input::placeholder,.p1coa-field textarea::placeholder{color:#536a80}
.p1coa-media-row .button,.p1coa-history-head .button{border-color:#2b557a;background:#102c48;color:#8ac9ff}.p1coa-checkbox,.p1coa-panel-option{border-color:#23394d;background:#081725;color:#b9cada}.p1coa-panel-option:hover{background:#0d1e2e}.p1coa-match-box{border-color:#233c52;background:linear-gradient(145deg,#0b1c2d,#081623)}.p1coa-match-preview{border-color:#2b4358;background:#071522;color:#8298ab}.p1coa-history-row{border-color:#22384b;background:#081624}.p1coa-advanced-note{border-color:#5f4921;background:#241d10;color:#d2ae63}.p1coa-advanced-note strong{color:#f0c875}
.p1coa-editor-savebar{border-color:#203548;background:rgba(8,21,34,.97);box-shadow:0 -14px 34px rgba(0,0,0,.22)}.p1coa-editor-savecopy strong{color:#e2edf7}.p1coa-editor-savecopy span{color:#72879a}.p1coa-side-guide{color:#9cafc0}.p1coa-side-guide>strong{color:#e5f1fb}.p1coa-side-guide p{background:#0f2942;color:#9bc8ef}.p1coa-side-guide summary{color:#91a8bb}.p1coa-side-guide code{background:#071522;color:#8fc9f6}

.p1coa-library{--p1-bg:#050d17;--p1-panel:#0a1724;--p1-panel-2:#0d1c2b;--p1-line:#203548;--p1-blue:#63b6ff;--p1-text:#edf6ff;--p1-muted:#8094a8;color:#edf6ff}
.p1coa-stat{border-color:#203548;background:linear-gradient(180deg,#0c1b2a,#081623);box-shadow:0 14px 36px rgba(0,0,0,.2)}.p1coa-stat strong{color:#f2f8ff}.p1coa-stat span:not(.p1coa-stat-icon){color:#778ca0}.p1coa-stat-icon{border-color:#25496a;background:#0f2b47;color:#7bc2ff}.p1coa-stat-green .p1coa-stat-icon{border-color:#245643;background:#0d2b22;color:#6ed9ae}.p1coa-stat-violet .p1coa-stat-icon{border-color:#4a3a6d;background:#211a36;color:#b49bf3}.p1coa-stat-cyan .p1coa-stat-icon{border-color:#245365;background:#0d2832;color:#71d4e7}
.p1coa-library-toolbar{border-color:#203548;background:#091724;box-shadow:0 12px 34px rgba(0,0,0,.2)}.p1coa-library-search input{border-color:#263d51!important;background:#06131f!important;color:#eef7ff!important}.p1coa-library-search input::placeholder{color:#53697e}.p1coa-filter-row button{color:#7d92a7}.p1coa-filter-row button:hover{background:#102235;color:#d8e8f6}.p1coa-filter-row button.is-active{border-color:#28577d;background:#0f2d4b;color:#83c8ff}.p1coa-toolbar-meta{color:#71869a}.p1coa-toolbar-meta>span{color:#d6e5f2}.p1coa-toolbar-meta button{color:#78a7cf}.p1coa-toolbar-meta button:hover{color:#b9ddfa}
.p1coa-family{border-color:#203548;background:linear-gradient(180deg,#0b1927,#081522);box-shadow:0 14px 38px rgba(0,0,0,.22)}.p1coa-family-summary:hover{background:#0d1c2b}.p1coa-family-avatar{border-color:#28557a;background:linear-gradient(145deg,#123454,#0b293c);color:#87ccff}.p1coa-family-overline{color:#5f8eb8}.p1coa-family-heading strong{color:#edf6ff}.p1coa-family-heading small{color:#778ca0}.p1coa-chip{border-color:#253a4d;background:#0d1b29;color:#8197aa}.p1coa-chip-current{border-color:#24533f;background:#0d2920;color:#6ed2aa}.p1coa-chip-warning{border-color:#5b4423;background:#261d10;color:#d6a75d}
.p1coa-family-name-form{border-color:#213b52;background:linear-gradient(90deg,#0d2236,#0a1927)}.p1coa-family-name-copy>.dashicons{border-color:#28557b;background:#102c48;color:#7ec3ff}.p1coa-family-name-copy strong{color:#e7f1fa}.p1coa-family-name-copy small,.p1coa-family-name-help{color:#748a9e}.p1coa-family-name-form input[type=text]{border-color:#294258!important;background:#06131f!important;color:#eef7ff!important}.p1coa-family-name-form input[type=text]::placeholder{color:#536b81}.p1coa-family-name-form button{border-color:#2d5c83;background:#113252;color:#87caff}.p1coa-family-name-form button:hover{border-color:#3f7caf;background:#174064;color:#b6deff}
.p1coa-record{border-color:#1d3143;background:#081623}.p1coa-record:hover{border-color:#2d4b64;background:#0b1b2a;box-shadow:0 10px 26px rgba(0,0,0,.18)}.p1coa-record.is-current{border-color:#24533f;background:linear-gradient(90deg,#0b271e,#091924 42%)}.p1coa-strength{border-color:#28557a;background:#102c48;color:#82c6ff}.p1coa-record strong{color:#e9f3fc}.p1coa-record small{color:#71869a}.p1coa-doc-state.is-ready{color:#74bdf7}.p1coa-doc-state.is-missing{color:#d2a15e}.p1coa-current-label{color:#69d0a5}.p1coa-neutral-label{color:#74899c}.p1coa-record-actions a{border-color:#253b4e;background:#0b1a28;color:#819bb2}.p1coa-record-actions a:hover{border-color:#326890;background:#11304c;color:#b7ddfa}.p1coa-record-actions a.is-primary{border-color:#2a5a80;background:#102e4b;color:#86c9ff}.p1coa-library-empty,.p1coa-library-no-results{border-color:#294258;background:#091724}.p1coa-library-empty h2,.p1coa-library-no-results h2{color:#eaf5ff}.p1coa-library-empty p,.p1coa-library-no-results p{color:#74899d}.p1coa-library-footer{color:#6d8296}.p1coa-library-footer code{color:#68829a}.p1coa-library-footer a{color:#76b9f3}.p1coa-library-footer a:hover{color:#a8d6fb}

.p1coa-smart{--bg:#050d17;--panel:#0a1724;--panel2:#0d1c2b;--line:#203548;--blue:#63b6ff;--cyan:#65d7e9;--text:#edf6ff;--muted:#8094a8;color:#edf6ff}
.p1coa-smart-flow{border-color:#203548;background:#091724;box-shadow:0 12px 34px rgba(0,0,0,.2)}.p1coa-smart-flow>div{color:#71879b}.p1coa-smart-flow>div b{border-color:#263c50;background:#0c1b29}.p1coa-smart-flow>div small{color:#596f83}.p1coa-smart-flow>div.is-active{color:#c9e5fa}.p1coa-smart-flow>div.is-active b{border-color:#2a5d85;background:#113351;color:#82c8ff}.p1coa-smart-flow>i{background:#213547}
.p1coa-smart-upload{border-color:#203548;background:linear-gradient(180deg,#0b1927,#081522);box-shadow:0 16px 45px rgba(0,0,0,.22)}.p1coa-smart-drop,.p1coa-smart-links{border-color:#29455e;background:radial-gradient(circle at 50% 15%,rgba(34,142,255,.08),transparent 48%),#081725}.p1coa-smart-drop:hover,.p1coa-smart-drop.is-dragging{border-color:#3d9aff;background-color:#0b1d2e}.p1coa-smart-drop strong,.p1coa-smart-links strong{color:#edf6ff}.p1coa-smart-drop small,.p1coa-smart-links small{color:#748a9f}.p1coa-smart-drop em{border-color:#28445c;background:#0e273e;color:#83bce9}.p1coa-smart-links textarea{border-color:#293f53;background:#06131f;color:#e8f4fd}.p1coa-smart-options{border-color:#203548;background:#091724;color:#768ba0}.p1coa-smart-options label{color:#c7d8e7}.p1coa-smart-submit{border-color:#203548}.p1coa-smart-submit strong{color:#e5f0f9}.p1coa-smart-submit span{color:#71869a}
.p1coa-smart-capabilities article{border-color:#203548;background:#091724;box-shadow:0 10px 28px rgba(0,0,0,.18)}.p1coa-smart-capabilities strong{color:#dceaf6}.p1coa-smart-capabilities small{color:#71869a}
.p1coa-review-summary,.p1coa-review-toolbar,.p1coa-review-item{border-color:#203548;background:#091724;box-shadow:0 10px 28px rgba(0,0,0,.18)}.p1coa-review-summary>div{border-color:#1d3042}.p1coa-review-summary span{color:#71869a}.p1coa-review-summary strong{color:#eaf5ff}.p1coa-review-toolbar label{color:#b8cada}.p1coa-review-toolbar p{color:#71869a}.p1coa-review-item>header{background:#0b1a28}.p1coa-review-index{border-color:#29587f;background:#10304e;color:#83c7ff}.p1coa-review-file strong{color:#e8f2fb}.p1coa-review-file small{color:#71869a}.p1coa-confidence>span{background:#1b2d3e}.p1coa-confidence strong{color:#7890a5}.p1coa-review-toggle{border-color:#263d51;background:#0a1927;color:#7f9ab1}.p1coa-review-body{border-color:#1e3244}.p1coa-row-warnings span{border-color:#5b4423;background:#261d10;color:#d6a35a}
.p1coa-detected-grid label>span,.p1coa-review-match-row label>span,.p1coa-review-match-row>div>span{color:#8499ac}.p1coa-detected-grid input,.p1coa-review-match-row select{border-color:#293f53;background:#061522;color:#eaf5ff}.p1coa-review-match-row{border-color:#1f3548;background:#081623}.p1coa-review-panels label{border-color:#263c50;background:#0a1927;color:#849caf}.p1coa-current-switch{border-color:#24513f;background:#0c271f}.p1coa-current-switch b{color:#6ec5a3}.p1coa-review-source{color:#6e8498}.p1coa-review-source b{color:#97aabc}.p1coa-review-source a{color:#73baf3}.p1coa-review-final{border-color:#203548;background:rgba(8,21,34,.97);box-shadow:0 -14px 35px rgba(0,0,0,.24)}.p1coa-review-final label{color:#dce9f4}.p1coa-review-final small{color:#71869a}.p1coa-review-final .button:not(.button-primary){border-color:#263e52;background:#0c1b29;color:#91a8bb}

.p1coa-tools-page{color:#eaf4fd}.p1coa-tool-card{border-color:#203548;background:linear-gradient(180deg,#0b1927,#081522);box-shadow:0 14px 38px rgba(0,0,0,.22)}.p1coa-tool-card-icon{border-color:#28577d;background:#102f4d;color:#80c5ff}.p1coa-tool-card h2{color:#eaf5ff}.p1coa-tool-card p{color:#788da1}.p1coa-tool-card code{background:#0e2234;color:#91b5d3}.p1coa-tool-card input[type=file]{border-color:#29455d;background:#071522;color:#8096aa}.p1coa-tool-card textarea{border-color:#293f53;background:#061522;color:#eaf5ff}.p1coa-api-endpoint{border-color:#22394c;background:#071522}.p1coa-api-endpoint code{color:#82a7c6}.p1coa-setting-option{border-color:#23394d;background:#081624}.p1coa-setting-option:hover{border-color:#34546e;background:#0c1c2b}.p1coa-setting-option-copy strong{color:#dceaf6}.p1coa-setting-option-copy small{color:#74899d}.p1coa-setting-switch{background:#35495b}.p1coa-settings-actions{border-color:#203548;background:rgba(8,21,34,.97);box-shadow:0 -12px 32px rgba(0,0,0,.22)}.p1coa-settings-actions span{color:#758a9e}.p1coa-tools-page .notice{border-color:#24533f;border-left-color:#35bf83;background:#0b271e;color:#a4dec5}.p1coa-tools-page .notice-error{border-color:#64343a;border-left-color:#ef5b61;background:#291316;color:#efb5b8}

@keyframes p1coaPremiumRise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.p1coa-library-stats,.p1coa-library-toolbar,.p1coa-family-list,.p1coa-smart-flow,.p1coa-smart-upload,.p1coa-smart-capabilities,.p1coa-tools-grid{animation:p1coaPremiumRise .38s ease both}
@media(max-width:900px){.p1coa-tools-grid{grid-template-columns:1fr}.p1coa-tool-card.is-wide{grid-column:auto}.p1coa-tools-hero{align-items:flex-start;flex-direction:column}.p1coa-tools-hero-badge{min-width:0;width:100%}}
@media(max-width:782px){.p1coa-editor-title{font-size:25px}.p1coa-library-hero h1,.p1coa-smart-hero h1{font-size:34px}.p1coa-tools-page{padding-right:10px}.p1coa-tools-hero{padding:26px}.p1coa-tools-hero h1{font-size:31px}.p1coa-smart-source-grid{padding:14px}.p1coa-smart-drop,.p1coa-smart-links{min-height:250px}.p1coa-settings-actions{align-items:flex-start;flex-direction:column}.p1coa-settings-actions .button-primary{width:100%}}
@media(max-width:520px){.p1coa-library-hero,.p1coa-smart-hero{padding:25px}.p1coa-library-hero h1,.p1coa-smart-hero h1{font-size:31px}.p1coa-tools-hero{padding:23px}.p1coa-tool-card{padding:18px}}
@media(prefers-reduced-motion:reduce){.p1coa-library-stats,.p1coa-library-toolbar,.p1coa-family-list,.p1coa-smart-flow,.p1coa-smart-upload,.p1coa-smart-capabilities,.p1coa-tools-grid{animation:none}.p1coa-admin-app *,.p1coa-library *,.p1coa-smart *,.p1coa-tools-page *{scroll-behavior:auto!important;transition:none!important}}
CSS;
    }

    private static function editor_inline_js() {
        return <<<'JS'
(function(){
  function initEditor(root){
    var tabs=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-editor-tab]'));
    var panels=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-editor-panel]'));
    if(!tabs.length||!panels.length)return;
    function activate(id){
      tabs.forEach(function(tab){var active=tab.getAttribute('data-p1coa-editor-tab')===id;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',active?'true':'false');});
      panels.forEach(function(panel){var active=panel.getAttribute('data-p1coa-editor-panel')===id;panel.classList.toggle('is-active',active);panel.hidden=!active;});
    }
    tabs.forEach(function(tab){tab.addEventListener('click',function(){activate(tab.getAttribute('data-p1coa-editor-tab'));});});
    activate('basics');
    var save=root.querySelector('[data-p1coa-editor-save]');
    if(save)save.addEventListener('click',function(){var publish=document.getElementById('publish')||document.getElementById('save-post');if(publish){save.disabled=true;save.textContent='Saving...';publish.click();}});
  }
  function boot(){document.querySelectorAll('[data-p1coa-editor]').forEach(initEditor);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
JS;
    }

    public static function admin_menu() {
        add_submenu_page(
            'edit.php?post_type=' . self::CPT,
            'Smart COA Intake',
            'Smart Intake',
            'manage_options',
            'p1coa-smart-intake',
            [__CLASS__, 'render_smart_intake_page'],
            0
        );

        add_submenu_page(
            'edit.php?post_type=' . self::CPT,
            'COA Family Library',
            'Family Library',
            'edit_posts',
            'p1coa-family-library',
            [__CLASS__, 'render_family_library_page'],
            1
        );

        add_submenu_page(
            'edit.php?post_type=' . self::CPT,
            'Import / Export COAs',
            'Import / Export',
            'manage_options',
            'p1coa-import-export',
            [__CLASS__, 'render_import_export_page']
        );

        add_submenu_page(
            'edit.php?post_type=' . self::CPT,
            'COA Settings',
            'Settings',
            'manage_options',
            'p1coa-settings',
            [__CLASS__, 'render_settings_page']
        );
    }

    public static function maybe_redirect_to_family_library() {
        if (wp_doing_ajax() || !current_user_can('edit_posts')) {
            return;
        }

        $post_type = isset($_GET['post_type']) ? sanitize_key(wp_unslash($_GET['post_type'])) : '';
        $page = isset($_GET['page']) ? sanitize_key(wp_unslash($_GET['page'])) : '';
        $classic = isset($_GET['p1coa_classic']) ? sanitize_key(wp_unslash($_GET['p1coa_classic'])) : '';
        $request_method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';

        if ($post_type !== self::CPT || $page || $classic === '1' || $request_method !== 'GET') {
            return;
        }

        if (!empty($_GET['action']) && sanitize_key(wp_unslash($_GET['action'])) !== '-1') {
            return;
        }

        wp_safe_redirect(admin_url('edit.php?post_type=' . self::CPT . '&page=p1coa-family-library'));
        exit;
    }

    public static function save_family_name() {
        if (!current_user_can('edit_posts')) {
            wp_die('Unauthorized');
        }

        check_admin_referer('p1coa_save_family_name', 'p1coa_family_nonce');

        $custom_name = isset($_POST['family_name'])
            ? sanitize_text_field(wp_unslash($_POST['family_name']))
            : '';
        $family_key = isset($_POST['family_key'])
            ? sanitize_title(wp_unslash($_POST['family_key']))
            : '';
        $raw_ids = isset($_POST['record_ids'])
            ? sanitize_text_field(wp_unslash($_POST['record_ids']))
            : '';
        $record_ids = array_values(array_filter(array_map('absint', explode(',', $raw_ids))));
        $updated = 0;

        foreach ($record_ids as $post_id) {
            if (get_post_type($post_id) !== self::CPT || !current_user_can('edit_post', $post_id)) {
                continue;
            }

            if ($custom_name === '') {
                delete_post_meta($post_id, self::META_PREFIX . 'family_name');
            } else {
                update_post_meta($post_id, self::META_PREFIX . 'family_name', $custom_name);
            }

            if ($family_key !== '') {
                update_post_meta($post_id, self::META_PREFIX . 'family_key', $family_key);
            }

            $updated++;
        }

        $redirect_url = add_query_arg(
            [
                'post_type' => self::CPT,
                'page' => 'p1coa-family-library',
                'family_updated' => $updated > 0 ? '1' : '0',
                'updated_records' => $updated,
            ],
            admin_url('edit.php')
        );

        wp_safe_redirect($redirect_url);
        exit;
    }

    public static function register_settings() {
        register_setting('p1coa_settings', 'p1coa_auto_unmark_current', [
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value ? '1' : '0';
            },
            'default' => '1',
        ]);

        register_setting('p1coa_settings', 'p1coa_cors_origins', [
            'type' => 'string',
            'sanitize_callback' => [__CLASS__, 'sanitize_textarea'],
            'default' => '',
        ]);

        register_setting('p1coa_settings', 'p1coa_autofill_on_save', [
            'type' => 'string',
            'sanitize_callback' => function ($value) {
                return $value ? '1' : '0';
            },
            'default' => '1',
        ]);
    }

    public static function render_help_meta_box($post) {
        $endpoint = esc_url_raw(rest_url(self::REST_NAMESPACE . '/coas'));
        echo '<div class="p1coa-side-guide">';
        echo '<strong>Fast workflow</strong>';
        echo '<ol><li>Complete <b>Basic info</b>.</li><li>Select the included <b>Testing</b> panels.</li><li>Add the PDF and laboratory verification link in <b>PDF & product</b>.</li><li>Press <b>Save COA</b>.</li></ol>';
        echo '<p>Only published records appear on the customer page.</p>';
        echo '<details><summary>Developer API</summary><code>' . esc_html($endpoint) . '</code></details>';
        echo '</div>';
    }

    public static function render_details_meta_box($post) {
        wp_nonce_field('p1coa_save_details', 'p1coa_nonce');

        $m = function ($key, $default = '') use ($post) {
            return self::get_meta($post->ID, $key, $default);
        };

        $history = self::get_meta($post->ID, 'history', []);
        if (!is_array($history)) {
            $history = [];
        }

        $family_name = trim((string) $m('family_name'));
        $product_name = trim((string) $m('product_name', $post->post_title));
        $aliases = self::string_array($m('aliases', []));
        $display_name = $family_name ?: (!empty($aliases[0]) ? $aliases[0] : ($product_name ?: $post->post_title));
        $coa_number = trim((string) $m('coa_number'));
        $batch = trim((string) $m('batch'));
        $strength = trim((string) $m('strength'));
        $editor_laboratory = trim((string) $m('laboratory'));
        if ($editor_laboratory === '') {
            $editor_laboratory = self::OFFICIAL_LABORATORY;
        }
        $is_current = self::to_bool($m('current_shipping_lot', false)) || self::to_bool($m('active_shipping_lot', false)) || self::to_bool($m('current_coa_current_shipping_lot', false));
        $pdf_ready = trim((string) $m('current_file_url')) !== '' || trim((string) $m('file_url')) !== '';
        $required_values = [$display_name, $coa_number, $batch, $strength, (string) $m('date'), $pdf_ready ? 'ready' : ''];
        $completed = count(array_filter($required_values, function ($value) { return trim((string) $value) !== ''; }));
        $completion = (int) round(($completed / count($required_values)) * 100);
        $panel_count = count(self::sanitize_panel_types($m('panel_types', [])));
        $history_count = count($history);

        echo '<div class="p1coa-admin-app" data-p1coa-editor>';
        echo '<header class="p1coa-editor-hero">';
        echo '<div class="p1coa-editor-hero-main"><div class="p1coa-editor-identity"><span class="p1coa-editor-mark"><span class="dashicons dashicons-media-document"></span></span><div style="min-width:0"><p class="p1coa-editor-kicker">COA workspace</p><h2 class="p1coa-editor-title">' . esc_html($display_name ?: 'New COA') . '</h2><p class="p1coa-editor-subtitle">' . esc_html($coa_number ?: 'COA number pending') . ($batch ? ' · ' . esc_html($batch) : '') . '</p></div></div>';
        echo '<div class="p1coa-editor-chips">';
        echo '<span class="p1coa-editor-chip' . ($post->post_status === 'publish' ? ' is-good' : ' is-warning') . '">' . esc_html($post->post_status === 'publish' ? 'Published' : ucfirst($post->post_status)) . '</span>';
        echo '<span class="p1coa-editor-chip' . ($pdf_ready ? ' is-good' : ' is-warning') . '">' . esc_html($pdf_ready ? 'PDF ready' : 'PDF missing') . '</span>';
        if ($is_current) { echo '<span class="p1coa-editor-chip is-good">Current lot</span>'; }
        echo '</div></div>';
        echo '<div class="p1coa-editor-progress"><span>' . esc_html((string) $completion) . '% essential setup</span><span class="p1coa-editor-progress-bar"><span style="width:' . esc_attr((string) $completion) . '%"></span></span></div>';
        echo '</header>';

        echo '<nav class="p1coa-editor-tabs" role="tablist" aria-label="COA editor sections">';
        echo '<button type="button" class="p1coa-editor-tab is-active" data-p1coa-editor-tab="basics" role="tab">01 · Basic info</button>';
        echo '<button type="button" class="p1coa-editor-tab" data-p1coa-editor-tab="testing" role="tab">02 · Testing <span class="p1coa-editor-tab-count">' . esc_html((string) $panel_count) . '</span></button>';
        echo '<button type="button" class="p1coa-editor-tab" data-p1coa-editor-tab="documents" role="tab">03 · PDF & product</button>';
        echo '<button type="button" class="p1coa-editor-tab" data-p1coa-editor-tab="advanced" role="tab">04 · Advanced</button>';
        echo '<button type="button" class="p1coa-editor-tab" data-p1coa-editor-tab="history" role="tab">05 · History <span class="p1coa-editor-tab-count">' . esc_html((string) $history_count) . '</span></button>';
        echo '</nav>';

        echo '<div class="p1coa-editor-content">';

        echo '<section class="p1coa-editor-panel is-active" data-p1coa-editor-panel="basics">';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Product identity', 'The public name and presentation customers use to find this certificate.');
        echo '<div class="p1coa-grid">';
        self::text_field('family_name', 'Public family name', $m('family_name'), 'R3TA');
        self::text_field('product_name', 'Product / presentation name', $m('product_name'), 'Retatrutide 10mg');
        self::text_field('compound', 'Compound', $m('compound'), 'Retatrutide');
        self::text_field('strength', 'Strength', $m('strength'), '10 mg');
        echo '</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Certificate essentials', 'The information shown beside the PDF in the customer modal.');
        echo '<div class="p1coa-grid">';
        self::text_field('coa_number', 'COA number', $m('coa_number'), 'KVR-2026-C184DC');
        self::text_field('batch', 'Batch / lot shown publicly', $m('batch'), 'RT10-1025');
        self::date_field('date', 'Certificate date', $m('date'));
        self::text_field('purity', 'Purity', $m('purity'), '99%');
        echo '<label class="p1coa-field"><span>Testing laboratory</span><input type="text" name="p1coa[laboratory]" value="' . esc_attr($editor_laboratory) . '" readonly aria-readonly="true"><small>Historical laboratory names stay unchanged; new COAs default to ' . esc_html(self::OFFICIAL_LABORATORY) . '.</small></label>';
        self::text_field('method', 'Testing method', $m('method'), 'HPLC');
        self::text_field('tested', 'Tested parameters', $m('tested'), 'HPLC / MS');
        echo '</div></div></section>';

        echo '<section class="p1coa-editor-panel" data-p1coa-editor-panel="testing" hidden>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Testing coverage', 'Select every testing panel this certificate includes. All selected labels appear on the family card.');
        self::panel_types_field($m('panel_types', []));
        echo '</div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Distribution status', 'Turn this on only for the lot customers are currently receiving.');
        echo '<div class="p1coa-check-row">';
        self::checkbox_field('current_shipping_lot', 'This is the current shipping lot', (bool) $m('current_shipping_lot', false));
        echo '</div></div></section>';

        echo '<section class="p1coa-editor-panel" data-p1coa-editor-panel="documents" hidden>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('PDF and full report link', 'The PDF appears inside the modal; the verification link opens the external full report.');
        echo '<div class="p1coa-grid p1coa-grid-two">';
        self::media_url_field('file_url', 'PDF shown in the modal', $m('file_url'), $m('file_attachment_id'));
        self::url_field('verify_url', 'Open full report / laboratory link', $m('verify_url'), 'https://laboratory.example/report/...');
        echo '</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('WooCommerce product', 'Choose the connected store product, then use autofill to populate IDs and SKUs.');
        self::render_product_matching_controls($post->ID, (int) $m('matched_product_id', 0), (int) $m('matched_variation_id', 0));
        echo '</div></section>';

        echo '<section class="p1coa-editor-panel" data-p1coa-editor-panel="advanced" hidden>';
        echo '<div class="p1coa-advanced-note"><span>⚠</span><div><strong>Advanced controls</strong>These values are preserved for integrations and special overrides. Most COAs do not need changes here.</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Technical identity', 'Stable grouping and internal reference values.');
        echo '<div class="p1coa-grid">';
        self::text_field('custom_id', 'Internal ID', $m('custom_id'), 'kvr-2026-c184dc');
        self::text_field('family_key', 'Family group key', $m('family_key'), 'retatrutide');
        self::text_field('lot', 'Alternative lot field', $m('lot'), 'Optional');
        self::text_field('order', 'Laboratory order', $m('order'), 'PHA-817211');
        self::text_field('status', 'API status', $m('status', 'Available'), 'Available');
        echo '</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Search and WooCommerce IDs', 'Usually filled automatically from the selected store product.');
        echo '<div class="p1coa-grid p1coa-grid-two">';
        self::textarea_field('woo_ids', 'Woo IDs', $m('woo_ids', []), '530');
        self::textarea_field('product_ids', 'Product IDs', $m('product_ids', []), '530');
        self::textarea_field('parent_product_ids', 'Parent product IDs', $m('parent_product_ids', []), '534');
        self::textarea_field('variation_ids', 'Variation IDs', $m('variation_ids', []), '650');
        self::textarea_field('skus', 'SKUs', $m('skus', []), "P1-RT-10\nPL-RT-10");
        self::textarea_field('aliases', 'Search aliases', $m('aliases', []), "PL-Rt\nRt 10mg");
        self::textarea_field('keywords', 'Extra search keywords', $m('keywords', []), "current shipping lot\nbatch verified");
        echo '</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Alternative URLs', 'Fallback links used only when the primary PDF or verification URL is unavailable.');
        echo '<div class="p1coa-grid p1coa-grid-two">';
        self::url_field('coa_url', 'Alternative COA URL', $m('coa_url'), 'https://...');
        self::url_field('url', 'Generic fallback URL', $m('url'), 'https://...');
        self::url_field('current_verify_url', 'Current report link override', $m('current_verify_url'), 'https://...');
        self::media_url_field('current_file_url', 'Current PDF override', $m('current_file_url'), $m('current_file_attachment_id'), 'current_file_attachment_id');
        echo '</div></div>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Current report overrides', 'Leave these empty to reuse the certificate essentials from Basic info.');
        echo '<div class="p1coa-grid">';
        self::text_field('current_version', 'Version', $m('current_version', 'v1'), 'v1');
        self::text_field('current_label', 'Document label', $m('current_label', 'Current COA'), 'Current COA');
        self::date_field('current_date', 'Override date', $m('current_date'));
        self::text_field('current_purity', 'Override purity', $m('current_purity'), '99%');
        self::text_field('current_method', 'Override method', $m('current_method'), 'HPLC');
        self::text_field('current_tested', 'Override tested values', $m('current_tested'), 'HPLC / MS');
        echo '</div><div class="p1coa-check-row" style="margin-top:12px">';
        self::checkbox_field('active_shipping_lot', 'Legacy active shipping flag', (bool) $m('active_shipping_lot', false));
        self::checkbox_field('current_coa_current_shipping_lot', 'Current object shipping flag', (bool) $m('current_coa_current_shipping_lot', false));
        echo '</div></div></section>';

        echo '<section class="p1coa-editor-panel" data-p1coa-editor-panel="history" hidden>';
        echo '<div class="p1coa-editor-card">';
        self::section_title('Archived reports', 'Add previous certificates only when this product has older laboratory reports.');
        echo '<div class="p1coa-history" data-p1coa-history><div class="p1coa-history-head"><strong>' . esc_html((string) $history_count) . ' archived report' . ($history_count === 1 ? '' : 's') . '</strong><button type="button" class="button button-secondary" data-p1coa-add-history>Add archived report</button></div><div class="p1coa-history-list" data-p1coa-history-list>';
        if (empty($history)) { self::history_row(0, []); } else { foreach ($history as $index => $row) { self::history_row((int) $index, is_array($row) ? $row : []); } }
        echo '</div></div>';
        echo '<template data-p1coa-history-template>'; self::history_row('__INDEX__', []); echo '</template>';
        echo '</div></section>';

        echo '<div class="p1coa-editor-savebar"><div class="p1coa-editor-savecopy"><strong>Ready to update this certificate?</strong><span>Uses the standard WordPress save action and keeps all integrations intact.</span></div><button type="button" class="p1coa-editor-save" data-p1coa-editor-save>Save COA</button></div>';
        echo '</div></div>';
    }

    private static function section_title($title, $description = '') {
        echo '<div class="p1coa-section-title">';
        echo '<h3>' . esc_html($title) . '</h3>';
        if ($description) {
            echo '<p>' . esc_html($description) . '</p>';
        }
        echo '</div>';
    }

    private static function render_product_matching_controls($post_id, $matched_product_id = 0, $matched_variation_id = 0) {
        $products = self::get_product_matching_data();
        $woo_active = class_exists('WooCommerce') && function_exists('wc_get_products');

        echo '<div class="p1coa-match-box" data-p1coa-match-box>';

        if (!$woo_active) {
            echo '<div class="notice notice-warning inline"><p><strong>WooCommerce is not active.</strong> Activate WooCommerce to select products and variations automatically.</p></div>';
        }

        echo '<div class="p1coa-grid">';
        echo '<label class="p1coa-field">';
        echo '<span>Matching Product</span>';
        echo '<select name="p1coa[matched_product_id]" data-p1coa-product-select>';
        echo '<option value="0">Choose a WooCommerce product</option>';
        foreach ($products as $product) {
            $label = $product['name'];
            if (!empty($product['sku'])) {
                $label .= ' — SKU: ' . $product['sku'];
            }
            if (!empty($product['type'])) {
                $label .= ' (' . $product['type'] . ')';
            }
            echo '<option value="' . esc_attr((string) $product['id']) . '" ' . selected((int) $matched_product_id, (int) $product['id'], false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<small>Select from all WooCommerce products created in your store.</small>';
        echo '</label>';

        echo '<label class="p1coa-field">';
        echo '<span>Matching Variation</span>';
        echo '<select name="p1coa[matched_variation_id]" data-p1coa-variation-select data-selected-variation="' . esc_attr((string) $matched_variation_id) . '">';
        echo '<option value="0">No variation / parent product only</option>';
        echo '</select>';
        echo '<small>If the product has variations, choose the exact vial/size/variant for this COA.</small>';
        echo '</label>';
        echo '</div>';

        echo '<div class="p1coa-match-actions">';
        echo '<button type="button" class="button button-primary" data-p1coa-autofill-product>Autofill from selected product</button>';
        echo '<span class="p1coa-match-status" data-p1coa-match-status></span>';
        echo '</div>';

        echo '<div class="p1coa-match-preview" data-p1coa-match-preview>';
        echo '<strong>Matching preview:</strong>';
        echo '<div data-p1coa-match-preview-body>Choose a product to preview the IDs and SKU that will be used.</div>';
        echo '</div>';

        echo '<p class="description">Autofill updates Product Name, Compound, Strength when detected, wooIds, productIds, parentProductIds, variationIds and SKUs. You can still edit the fields manually after autofill.</p>';
        echo '</div>';
    }

    private static function text_field($key, $label, $value = '', $placeholder = '') {
        echo '<label class="p1coa-field">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<input type="text" name="p1coa[' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" placeholder="' . esc_attr($placeholder) . '" />';
        echo '</label>';
    }

    private static function date_field($key, $label, $value = '') {
        echo '<label class="p1coa-field">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<input type="date" name="p1coa[' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" />';
        echo '</label>';
    }

    private static function url_field($key, $label, $value = '', $placeholder = '') {
        echo '<label class="p1coa-field">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<input type="url" name="p1coa[' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" placeholder="' . esc_attr($placeholder) . '" />';
        echo '</label>';
    }

    private static function media_url_field($key, $label, $value = '', $attachment_id = '', $attachment_key = 'file_attachment_id') {
        echo '<label class="p1coa-field p1coa-media-field">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<div class="p1coa-media-row">';
        echo '<input type="url" name="p1coa[' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" placeholder="https://.../coa.pdf" data-p1coa-media-url />';
        echo '<input type="hidden" name="p1coa[' . esc_attr($attachment_key) . ']" value="' . esc_attr((string) $attachment_id) . '" data-p1coa-media-id />';
        echo '<button type="button" class="button" data-p1coa-media-button>Select PDF</button>';
        echo '</div>';
        echo '</label>';
    }

    private static function textarea_field($key, $label, $value = [], $placeholder = '') {
        if (is_array($value)) {
            $value = implode("\n", array_map('strval', $value));
        }
        echo '<label class="p1coa-field p1coa-field-wide">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<textarea name="p1coa[' . esc_attr($key) . ']" rows="4" placeholder="' . esc_attr($placeholder) . '">' . esc_textarea((string) $value) . '</textarea>';
        echo '</label>';
    }

    private static function checkbox_field($key, $label, $checked = false) {
        echo '<label class="p1coa-checkbox">';
        echo '<input type="checkbox" name="p1coa[' . esc_attr($key) . ']" value="1" ' . checked($checked, true, false) . ' />';
        echo '<span>' . esc_html($label) . '</span>';
        echo '</label>';
    }

    private static function panel_types_field($value = []) {
        $selected = self::sanitize_panel_types($value);
        $options = [
            '3x' => ['3X Tested Panel', '#f5b942'],
            'standard' => ['Standard Panel', '#67e8f9'],
            'full' => ['Full Panel', '#e879f9'],
            '8x' => ['8X Tested Panel', '#93c5fd'],
        ];

        echo '<div class="p1coa-panel-picker">';
        foreach ($options as $key => $option) {
            $is_checked = in_array($key, $selected, true);
            echo '<label class="p1coa-panel-option" style="--panel-color:' . esc_attr($option[1]) . '">';
            echo '<input type="checkbox" name="p1coa[panel_types][]" value="' . esc_attr($key) . '" ' . checked($is_checked, true, false) . ' />';
            echo '<span class="p1coa-panel-dot"></span><span>' . esc_html($option[0]) . '</span>';
            echo '</label>';
        }
        echo '</div>';
    }

    private static function history_row($index, $row) {
        $get = function ($key, $default = '') use ($row) {
            if (isset($row[$key])) {
                return $row[$key];
            }
            $camel = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $key))));
            return isset($row[$camel]) ? $row[$camel] : $default;
        };

        echo '<div class="p1coa-history-row" data-p1coa-history-row>';
        echo '<button type="button" class="p1coa-remove-row" data-p1coa-remove-history aria-label="Remove history row">×</button>';
        echo '<div class="p1coa-grid">';
        self::history_input($index, 'version', 'Version', $get('version'), 'v1');
        self::history_input($index, 'label', 'Label', $get('label'), 'Archived COA');
        self::history_input($index, 'date', 'Date', $get('date'), '', 'date');
        self::history_input($index, 'purity', 'Purity', $get('purity'), '99.2%');
        self::history_input($index, 'method', 'Method', $get('method'), 'HPLC');
        self::history_input($index, 'tested', 'Tested', $get('tested'), 'HPLC / MS');
        self::history_input($index, 'verifyUrl', 'verifyUrl', $get('verifyUrl'), 'https://...', 'url');
        self::history_input($index, 'fileUrl', 'fileUrl', $get('fileUrl'), 'https://.../coa.pdf', 'url');
        echo '</div>';
        echo '</div>';
    }

    private static function history_input($index, $key, $label, $value = '', $placeholder = '', $type = 'text') {
        echo '<label class="p1coa-field">';
        echo '<span>' . esc_html($label) . '</span>';
        echo '<input type="' . esc_attr($type) . '" name="p1coa_history[' . esc_attr($index) . '][' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" placeholder="' . esc_attr($placeholder) . '" />';
        echo '</label>';
    }

    public static function save_post($post_id, $post) {
        if (!isset($_POST['p1coa_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['p1coa_nonce'])), 'p1coa_save_details')) {
            return;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $posted = isset($_POST['p1coa']) && is_array($_POST['p1coa']) ? wp_unslash($_POST['p1coa']) : [];
        $clean = self::sanitize_record_input($posted);

        // Existing certificates keep the laboratory that was originally stored.
        // Only brand-new/blank records receive the current laboratory default.
        $stored_laboratory = trim((string) get_post_meta($post_id, self::META_PREFIX . 'laboratory', true));
        $clean['laboratory'] = $stored_laboratory !== '' ? $stored_laboratory : self::OFFICIAL_LABORATORY;

        if (get_option('p1coa_autofill_on_save', '1') === '1') {
            self::apply_product_matching_defaults($clean);
        }

        foreach ($clean as $key => $value) {
            update_post_meta($post_id, self::META_PREFIX . $key, $value);
        }

        $history = isset($_POST['p1coa_history']) && is_array($_POST['p1coa_history']) ? wp_unslash($_POST['p1coa_history']) : [];
        update_post_meta($post_id, self::META_PREFIX . 'history', self::sanitize_history($history));

        if (!empty($clean['current_shipping_lot'])) {
            update_post_meta($post_id, self::META_PREFIX . 'current_coa_current_shipping_lot', '1');
            if (get_option('p1coa_auto_unmark_current', '1') === '1') {
                self::unmark_other_current_lots($post_id, $clean);
            }
        }
    }

    private static function sanitize_record_input($posted) {
        $scalar_text = [
            'custom_id', 'coa_number', 'product_name', 'compound', 'family_name', 'family_key', 'strength', 'batch', 'lot', 'order', 'date', 'status', 'laboratory',
            'purity', 'method', 'tested', 'current_version', 'current_label', 'current_date', 'current_purity',
            'current_method', 'current_tested'
        ];
        $url_fields = ['coa_url', 'verify_url', 'url', 'file_url', 'current_verify_url', 'current_file_url'];
        $list_fields = ['woo_ids', 'product_ids', 'parent_product_ids', 'variation_ids', 'skus', 'aliases', 'keywords'];
        $int_fields = ['matched_product_id', 'matched_variation_id', 'file_attachment_id', 'current_file_attachment_id'];
        $bool_fields = ['current_shipping_lot', 'active_shipping_lot', 'current_coa_current_shipping_lot'];

        $clean = [];

        foreach ($scalar_text as $key) {
            $clean[$key] = isset($posted[$key]) ? sanitize_text_field((string) $posted[$key]) : '';
        }

        foreach ($url_fields as $key) {
            $clean[$key] = isset($posted[$key]) ? esc_url_raw((string) $posted[$key]) : '';
        }

        foreach ($list_fields as $key) {
            $clean[$key] = isset($posted[$key]) ? self::parse_list((string) $posted[$key]) : [];
        }

        foreach ($int_fields as $key) {
            $clean[$key] = isset($posted[$key]) ? absint($posted[$key]) : 0;
        }

        foreach ($bool_fields as $key) {
            $clean[$key] = !empty($posted[$key]) ? '1' : '0';
        }

        $clean['panel_types'] = self::sanitize_panel_types(isset($posted['panel_types']) ? $posted['panel_types'] : []);
        return $clean;
    }

    private static function sanitize_history($history) {
        $clean = [];
        foreach ($history as $row) {
            if (!is_array($row)) {
                continue;
            }
            $item = [
                'version' => isset($row['version']) ? sanitize_text_field((string) $row['version']) : '',
                'label' => isset($row['label']) ? sanitize_text_field((string) $row['label']) : '',
                'date' => isset($row['date']) ? sanitize_text_field((string) $row['date']) : '',
                'purity' => isset($row['purity']) ? sanitize_text_field((string) $row['purity']) : '',
                'method' => isset($row['method']) ? sanitize_text_field((string) $row['method']) : '',
                'tested' => isset($row['tested']) ? sanitize_text_field((string) $row['tested']) : '',
                'verifyUrl' => isset($row['verifyUrl']) ? esc_url_raw((string) $row['verifyUrl']) : '',
                'fileUrl' => isset($row['fileUrl']) ? esc_url_raw((string) $row['fileUrl']) : '',
            ];

            $has_value = false;
            foreach ($item as $value) {
                if ($value !== '') {
                    $has_value = true;
                    break;
                }
            }

            if ($has_value) {
                $clean[] = $item;
            }
        }
        return $clean;
    }

    private static function parse_list($value) {
        $value = str_replace(["\r\n", "\r", ","], "\n", (string) $value);
        $parts = array_map('trim', explode("\n", $value));
        $parts = array_filter($parts, function ($item) {
            return $item !== '';
        });
        return array_values(array_map('sanitize_text_field', $parts));
    }

    private static function sanitize_textarea($value) {
        return sanitize_textarea_field((string) $value);
    }

    private static function get_meta($post_id, $key, $default = '') {
        $value = get_post_meta($post_id, self::META_PREFIX . $key, true);
        if ($value === '' || $value === null) {
            return $default;
        }
        return $value;
    }

    public static function ajax_get_product_matching_data() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        check_ajax_referer('p1coa_product_matching', 'nonce');
        wp_send_json_success(self::get_product_matching_data(false));
    }

    private static function get_product_matching_data($use_static_cache = true) {
        static $cache = null;

        if ($use_static_cache && is_array($cache)) {
            return $cache;
        }

        if (!class_exists('WooCommerce') || !function_exists('wc_get_products')) {
            $cache = [];
            return $cache;
        }

        $product_ids = wc_get_products([
            'status' => ['publish', 'draft', 'pending', 'private'],
            'limit' => -1,
            'return' => 'ids',
            'orderby' => 'title',
            'order' => 'ASC',
            'type' => ['simple', 'variable', 'grouped', 'external'],
        ]);

        $products = [];

        foreach ($product_ids as $product_id) {
            $product = wc_get_product($product_id);
            if (!$product) {
                continue;
            }

            $product_name = wp_strip_all_tags($product->get_name());
            $product_sku = (string) $product->get_sku();
            $product_type = (string) $product->get_type();
            $product_strength = self::detect_strength_from_text($product_name . ' ' . $product_sku);

            $variations = [];
            if ($product->is_type('variable')) {
                foreach ((array) $product->get_children() as $variation_id) {
                    $variation = wc_get_product($variation_id);
                    if (!$variation) {
                        continue;
                    }

                    $variation_name = wp_strip_all_tags($variation->get_name());
                    $variation_sku = (string) $variation->get_sku();
                    $attributes_text = self::variation_attributes_text($variation);
                    $variation_strength = self::detect_strength_from_text($variation_name . ' ' . $variation_sku . ' ' . $attributes_text);

                    $variations[] = [
                        'id' => (int) $variation_id,
                        'parentId' => (int) $product_id,
                        'name' => $variation_name ?: $product_name,
                        'parentName' => $product_name,
                        'sku' => $variation_sku ?: $product_sku,
                        'parentSku' => $product_sku,
                        'type' => 'variation',
                        'status' => (string) $variation->get_status(),
                        'attributesText' => $attributes_text,
                        'strength' => $variation_strength,
                        'searchText' => trim($variation_name . ' ' . $variation_sku . ' ' . $attributes_text),
                    ];
                }
            }

            $products[] = [
                'id' => (int) $product_id,
                'name' => $product_name,
                'sku' => $product_sku,
                'type' => $product_type,
                'status' => (string) $product->get_status(),
                'variationCount' => count($variations),
                'variations' => $variations,
                'strength' => $product_strength,
                'searchText' => trim($product_name . ' ' . $product_sku),
            ];
        }

        usort($products, function ($a, $b) {
            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        $cache = $products;
        return $products;
    }

    private static function variation_attributes_text($variation) {
        if (!$variation || !method_exists($variation, 'get_attributes')) {
            return '';
        }

        $parts = [];
        foreach ((array) $variation->get_attributes() as $attribute_name => $value) {
            if ($value === '') {
                continue;
            }

            $taxonomy = str_replace('attribute_', '', (string) $attribute_name);
            $label = function_exists('wc_attribute_label') ? wc_attribute_label($taxonomy) : $taxonomy;
            $display_value = (string) $value;

            if (taxonomy_exists($taxonomy)) {
                $term = get_term_by('slug', $display_value, $taxonomy);
                if ($term && !is_wp_error($term)) {
                    $display_value = $term->name;
                }
            }

            $parts[] = trim(wp_strip_all_tags($label . ': ' . $display_value));
        }

        return implode(', ', array_filter($parts));
    }

    private static function detect_strength_from_text($text) {
        $text = html_entity_decode(wp_strip_all_tags((string) $text));
        if (preg_match('/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu)\b/i', $text, $matches)) {
            return preg_replace('/\s+/', '', strtolower($matches[0]));
        }
        return '';
    }

    private static function apply_product_matching_defaults(&$clean) {
        if (!class_exists('WooCommerce') || !function_exists('wc_get_product')) {
            return;
        }

        $matched_product_id = isset($clean['matched_product_id']) ? absint($clean['matched_product_id']) : 0;
        $matched_variation_id = isset($clean['matched_variation_id']) ? absint($clean['matched_variation_id']) : 0;

        if (!$matched_product_id && !$matched_variation_id) {
            return;
        }

        $product = $matched_product_id ? wc_get_product($matched_product_id) : null;
        $variation = $matched_variation_id ? wc_get_product($matched_variation_id) : null;

        if ($variation && $variation->is_type('variation')) {
            $parent_id = (int) $variation->get_parent_id();
            if (!$matched_product_id && $parent_id) {
                $matched_product_id = $parent_id;
                $product = wc_get_product($parent_id);
            }

            $variation_name = wp_strip_all_tags($variation->get_name());
            $variation_sku = (string) $variation->get_sku();
            $parent_sku = $product ? (string) $product->get_sku() : '';
            $attributes_text = self::variation_attributes_text($variation);
            $strength = self::detect_strength_from_text($variation_name . ' ' . $variation_sku . ' ' . $attributes_text);

            $clean['matched_product_id'] = $matched_product_id;
            $clean['matched_variation_id'] = $matched_variation_id;
            $clean['woo_ids'] = [$matched_variation_id];
            $clean['product_ids'] = [];
            $clean['parent_product_ids'] = $matched_product_id ? [$matched_product_id] : [];
            $clean['variation_ids'] = [$matched_variation_id];
            $clean['skus'] = array_values(array_filter(array_unique([$variation_sku ?: $parent_sku, $parent_sku])));

            if (empty($clean['product_name'])) {
                $clean['product_name'] = $variation_name;
            }
            if (empty($clean['compound'])) {
                $clean['compound'] = $variation_name;
            }
            if (empty($clean['strength']) && $strength) {
                $clean['strength'] = $strength;
            }
            return;
        }

        if ($product) {
            $product_name = wp_strip_all_tags($product->get_name());
            $product_sku = (string) $product->get_sku();
            $strength = self::detect_strength_from_text($product_name . ' ' . $product_sku);

            $clean['matched_product_id'] = $matched_product_id;
            $clean['matched_variation_id'] = 0;
            $clean['woo_ids'] = [$matched_product_id];
            $clean['product_ids'] = [$matched_product_id];
            $clean['parent_product_ids'] = [];
            $clean['variation_ids'] = [];
            $clean['skus'] = array_values(array_filter(array_unique([$product_sku])));

            if (empty($clean['product_name'])) {
                $clean['product_name'] = $product_name;
            }
            if (empty($clean['compound'])) {
                $clean['compound'] = $product_name;
            }
            if (empty($clean['strength']) && $strength) {
                $clean['strength'] = $strength;
            }
        }
    }

    private static function unmark_other_current_lots($post_id, $record) {
        $product_name = isset($record['product_name']) ? (string) $record['product_name'] : '';
        $compound = isset($record['compound']) ? (string) $record['compound'] : '';
        $family_key = isset($record['family_key']) ? sanitize_title((string) $record['family_key']) : '';
        $strength = isset($record['strength']) ? (string) $record['strength'] : '';
        $matched_product_id = isset($record['matched_product_id']) ? absint($record['matched_product_id']) : 0;
        $matched_variation_id = isset($record['matched_variation_id']) ? absint($record['matched_variation_id']) : 0;

        if ($product_name === '' && $compound === '' && $family_key === '' && !$matched_product_id && !$matched_variation_id) {
            return;
        }

        if ($matched_variation_id) {
            $meta_query = [
                [
                    'key' => self::META_PREFIX . 'matched_variation_id',
                    'value' => $matched_variation_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ],
            ];
        } elseif ($matched_product_id) {
            $meta_query = [
                'relation' => 'AND',
                [
                    'key' => self::META_PREFIX . 'matched_product_id',
                    'value' => $matched_product_id,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ],
            ];
        } else {
            $identity_query = ['relation' => 'OR'];
            if ($family_key !== '') {
                $identity_query[] = [
                    'key' => self::META_PREFIX . 'family_key',
                    'value' => $family_key,
                    'compare' => '=',
                ];
            }
            if ($product_name !== '') {
                $identity_query[] = [
                    'key' => self::META_PREFIX . 'product_name',
                    'value' => $product_name,
                    'compare' => '=',
                ];
            }
            if ($compound !== '') {
                $identity_query[] = [
                    'key' => self::META_PREFIX . 'compound',
                    'value' => $compound,
                    'compare' => '=',
                ];
            }

            $meta_query = ['relation' => 'AND', $identity_query];
        }

        if (empty($meta_query)) {
            return;
        }

        $query = new WP_Query([
            'post_type' => self::CPT,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => -1,
            'fields' => 'ids',
            'post__not_in' => [$post_id],
            'meta_query' => $meta_query,
            'no_found_rows' => true,
        ]);

        foreach ($query->posts as $other_id) {
            if ($strength !== '' && self::smart_strength_key(self::get_meta($other_id, 'strength')) !== self::smart_strength_key($strength)) {
                continue;
            }
            update_post_meta($other_id, self::META_PREFIX . 'current_shipping_lot', '0');
            update_post_meta($other_id, self::META_PREFIX . 'active_shipping_lot', '0');
            update_post_meta($other_id, self::META_PREFIX . 'current_coa_current_shipping_lot', '0');
        }
    }

    public static function register_rest_routes() {
        register_rest_route(self::REST_NAMESPACE, '/coas', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'rest_get_coas'],
            'permission_callback' => '__return_true',
            'args' => [
                'search' => ['sanitize_callback' => 'sanitize_text_field'],
                'sku' => ['sanitize_callback' => 'sanitize_text_field'],
                'currentShippingLot' => ['sanitize_callback' => 'rest_sanitize_boolean'],
                'productId' => ['sanitize_callback' => 'absint'],
            ],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/coas/(?P<id>[a-zA-Z0-9\-_]+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'rest_get_coa'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function rest_get_coas(WP_REST_Request $request) {
        $query = new WP_Query([
            'post_type' => self::CPT,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
            'no_found_rows' => true,
        ]);

        $records = [];
        foreach ($query->posts as $post) {
            $records[] = self::build_record($post->ID);
        }

        $search = trim((string) $request->get_param('search'));
        $sku = trim((string) $request->get_param('sku'));
        $current = $request->get_param('currentShippingLot');
        $product_id = absint($request->get_param('productId'));

        if ($search !== '') {
            $needle = self::normalize_for_search($search);
            $records = array_values(array_filter($records, function ($record) use ($needle) {
                return strpos(self::normalize_for_search(wp_json_encode($record)), $needle) !== false;
            }));
        }

        if ($sku !== '') {
            $needle_sku = self::normalize_for_search($sku);
            $records = array_values(array_filter($records, function ($record) use ($needle_sku) {
                foreach ((array) ($record['skus'] ?? []) as $sku_item) {
                    if (self::normalize_for_search($sku_item) === $needle_sku) {
                        return true;
                    }
                }
                return false;
            }));
        }

        if ($product_id > 0) {
            $records = array_values(array_filter($records, function ($record) use ($product_id) {
                if ((int) ($record['matchedProductId'] ?? 0) === $product_id || (int) ($record['matchedVariationId'] ?? 0) === $product_id) {
                    return true;
                }
                $id_lists = ['wooIds', 'productIds', 'parentProductIds', 'variationIds'];
                foreach ($id_lists as $list_key) {
                    foreach ((array) ($record[$list_key] ?? []) as $id) {
                        if ((int) $id === $product_id) {
                            return true;
                        }
                    }
                }
                return false;
            }));
        }

        if ($current !== null) {
            $want_current = rest_sanitize_boolean($current);
            $records = array_values(array_filter($records, function ($record) use ($want_current) {
                $is_current = !empty($record['currentShippingLot']) || !empty($record['activeShippingLot']) || !empty($record['currentCoa']['currentShippingLot']);
                return $want_current ? $is_current : !$is_current;
            }));
        }

        $response = rest_ensure_response($records);
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('X-P1COA-Source', 'wordpress-live-library');
        $response->header('X-P1COA-Count', (string) count($records));
        $response->header('X-P1COA-Generated-At', gmdate('c'));
        return $response;
    }

    public static function rest_get_coa(WP_REST_Request $request) {
        $id = sanitize_text_field((string) $request['id']);
        $posts = get_posts([
            'post_type' => self::CPT,
            'post_status' => 'publish',
            'posts_per_page' => 1,
            'meta_query' => [
                'relation' => 'OR',
                [
                    'key' => self::META_PREFIX . 'custom_id',
                    'value' => $id,
                    'compare' => '=',
                ],
                [
                    'key' => self::META_PREFIX . 'coa_number',
                    'value' => $id,
                    'compare' => '=',
                ],
            ],
        ]);

        if (empty($posts)) {
            return new WP_Error('p1coa_not_found', 'COA not found.', ['status' => 404]);
        }

        $response = rest_ensure_response(self::build_record($posts[0]->ID));
        $response->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->header('Pragma', 'no-cache');
        $response->header('X-P1COA-Source', 'wordpress-live-library');
        $response->header('X-P1COA-Generated-At', gmdate('c'));
        return $response;
    }

    private static function normalize_for_search($value) {
        $value = strtolower((string) $value);
        $value = preg_replace('/[^a-z0-9.%\s\-\/\+]/', ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value);
        return trim($value);
    }

    private static function build_record($post_id) {
        $m = function ($key, $default = '') use ($post_id) {
            return self::get_meta($post_id, $key, $default);
        };

        $post = get_post($post_id);
        $custom_id = (string) $m('custom_id');
        $coa_number = (string) $m('coa_number');
        $date = (string) $m('date');
        $verify_url = (string) $m('verify_url');
        $coa_url = (string) $m('coa_url');
        $url = (string) $m('url');
        $file_url = (string) $m('file_url');
        $method = (string) $m('method');
        $tested = (string) $m('tested');
        $purity = (string) $m('purity');
        $laboratory = trim((string) $m('laboratory'));
        if ($laboratory === '') {
            $laboratory = self::OFFICIAL_LABORATORY;
        }
        $current_shipping_lot = self::to_bool($m('current_shipping_lot', false));
        $active_shipping_lot = self::to_bool($m('active_shipping_lot', false));
        $current_coa_current_shipping_lot = self::to_bool($m('current_coa_current_shipping_lot', false));

        $record_id = $custom_id ?: ($coa_number ? sanitize_title($coa_number) : (string) $post_id);
        $current_verify = (string) $m('current_verify_url');
        $current_file = (string) $m('current_file_url');
        $current_method = (string) $m('current_method');
        $current_tested = (string) $m('current_tested');

        $history = $m('history', []);
        if (!is_array($history)) {
            $history = [];
        }

        $family_name = trim((string) $m('family_name'));
        $aliases = self::string_array($m('aliases', []));

        if ($family_name !== '') {
            $aliases = array_values(array_filter($aliases, function ($alias) use ($family_name) {
                return strcasecmp(trim((string) $alias), $family_name) !== 0;
            }));
            array_unshift($aliases, $family_name);
        }

        $record = [
            'id' => $record_id,
            'wpPostId' => (int) $post_id,
            'matchedProductId' => (int) $m('matched_product_id', 0),
            'matchedVariationId' => (int) $m('matched_variation_id', 0),
            'coaNumber' => $coa_number,
            'productName' => (string) $m('product_name', $post ? $post->post_title : ''),
            'compound' => (string) $m('compound'),
            'familyName' => $family_name,
            'familyKey' => (string) $m('family_key'),
            'wooIds' => self::int_array($m('woo_ids', [])),
            'productIds' => self::int_array($m('product_ids', [])),
            'parentProductIds' => self::int_array($m('parent_product_ids', [])),
            'variationIds' => self::int_array($m('variation_ids', [])),
            'skus' => self::string_array($m('skus', [])),
            'aliases' => $aliases,
            'keywords' => self::string_array($m('keywords', [])),
            'panelTypes' => self::sanitize_panel_types($m('panel_types', [])),
            'strength' => (string) $m('strength'),
            'batch' => (string) $m('batch'),
            'lot' => (string) $m('lot'),
            'order' => (string) $m('order'),
            'date' => $date,
            'status' => (string) $m('status', 'Available'),
            'purity' => $purity,
            'laboratory' => $laboratory,
            'method' => $method,
            'tested' => $tested,
            'currentShippingLot' => $current_shipping_lot,
            'activeShippingLot' => $active_shipping_lot,
            'coaUrl' => $coa_url,
            'verifyUrl' => $verify_url,
            'url' => $url,
            'fileUrl' => $file_url,
            'fileAttachmentId' => (int) $m('file_attachment_id', 0),
            'currentCoa' => [
                'version' => (string) $m('current_version', 'v1'),
                'label' => (string) $m('current_label', 'Current COA'),
                'date' => (string) $m('current_date', $date),
                'purity' => (string) $m('current_purity', $purity),
                'method' => $current_method ?: ($method ?: $tested),
                'tested' => $current_tested ?: ($tested ?: $method),
                'verifyUrl' => $current_verify ?: ($verify_url ?: ($coa_url ?: $url)),
                'fileUrl' => $current_file ?: $file_url,
                'fileAttachmentId' => (int) $m('current_file_attachment_id', 0),
                'currentShippingLot' => $current_coa_current_shipping_lot || $current_shipping_lot || $active_shipping_lot,
            ],
            'history' => array_values(array_map([__CLASS__, 'normalize_history_item'], $history)),
        ];

        return $record;
    }

    private static function normalize_history_item($item) {
        if (!is_array($item)) {
            return [];
        }
        return [
            'version' => isset($item['version']) ? (string) $item['version'] : '',
            'label' => isset($item['label']) ? (string) $item['label'] : '',
            'date' => isset($item['date']) ? (string) $item['date'] : '',
            'purity' => isset($item['purity']) ? (string) $item['purity'] : '',
            'method' => isset($item['method']) ? (string) $item['method'] : '',
            'tested' => isset($item['tested']) ? (string) $item['tested'] : '',
            'verifyUrl' => isset($item['verifyUrl']) ? (string) $item['verifyUrl'] : '',
            'fileUrl' => isset($item['fileUrl']) ? (string) $item['fileUrl'] : '',
        ];
    }

    private static function int_array($value) {
        $items = self::string_array($value);
        $items = array_map('absint', $items);
        $items = array_filter($items, function ($item) {
            return $item > 0;
        });
        return array_values($items);
    }

    private static function string_array($value) {
        if (!is_array($value)) {
            $value = self::parse_list((string) $value);
        }
        $value = array_map('strval', $value);
        $value = array_map('trim', $value);
        $value = array_filter($value, function ($item) {
            return $item !== '';
        });
        return array_values($value);
    }

    private static function sanitize_panel_types($value) {
        $allowed = ['3x', 'standard', 'full', '8x'];
        $clean = [];

        foreach (self::string_array($value) as $item) {
            $normalized = strtolower(trim((string) $item));
            $normalized = preg_replace('/[^a-z0-9]+/', '', $normalized);

            if ($normalized === '3' || $normalized === 'x3' || strpos($normalized, '3xtested') !== false) {
                $normalized = '3x';
            } elseif ($normalized === '8' || $normalized === 'x8' || strpos($normalized, '8xtested') !== false) {
                $normalized = '8x';
            } elseif (strpos($normalized, 'standard') !== false) {
                $normalized = 'standard';
            } elseif (strpos($normalized, 'full') !== false) {
                $normalized = 'full';
            }

            if (in_array($normalized, $allowed, true) && !in_array($normalized, $clean, true)) {
                $clean[] = $normalized;
            }
        }

        return $clean;
    }

    private static function to_bool($value) {
        return $value === true || $value === 1 || $value === '1' || $value === 'true' || $value === 'yes' || $value === 'on';
    }

    private static function library_family_identity($post_id) {
        $aliases = self::string_array(self::get_meta($post_id, 'aliases', []));
        $primary_alias = !empty($aliases[0]) ? trim((string) $aliases[0]) : '';
        $family_name = trim((string) self::get_meta($post_id, 'family_name'));
        $family_key = trim((string) self::get_meta($post_id, 'family_key'));
        $compound = trim((string) self::get_meta($post_id, 'compound'));
        $product_name = trim((string) self::get_meta($post_id, 'product_name'));
        $post_title = trim((string) get_the_title($post_id));

        $display_name = $family_name ?: ($primary_alias ?: ($compound ?: ($product_name ?: ($post_title ?: 'Unnamed family'))));
        $group_source = $family_key ?: ($family_name ?: ($compound ?: ($primary_alias ?: ($product_name ?: $display_name))));

        if (!$family_key) {
            $group_source = preg_replace(
                '/\b\d+(?:\.\d+)?\s*(?:mcg|mg|g|ml|iu)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mcg|mg|g|ml|iu))?\b/i',
                ' ',
                (string) $group_source
            );
            $group_source = preg_replace('/\b(?:single\s+vial|vials?|kit|packs?)\b/i', ' ', (string) $group_source);
            $group_source = preg_replace('/\s+/', ' ', (string) $group_source);
        }

        $key = sanitize_title(trim((string) $group_source));
        if ($key === '') {
            $key = 'family-' . absint($post_id);
        }

        return [
            'key' => $key,
            'name' => $display_name,
            'primary_alias' => $primary_alias,
            'custom_name' => $family_name,
            'aliases' => $aliases,
            'has_custom_name' => $family_name !== '',
        ];
    }

    private static function library_document_url($post_id) {
        $keys = [
            'current_file_url',
            'file_url',
            'current_verify_url',
            'verify_url',
            'coa_url',
            'url',
        ];

        foreach ($keys as $key) {
            $url = trim((string) self::get_meta($post_id, $key));
            if ($url !== '') {
                return $url;
            }
        }

        return '';
    }

    private static function library_strength_sort_value($strength) {
        if (!preg_match('/(\d+(?:\.\d+)?)\s*(mcg|mg|g|ml|iu)/i', (string) $strength, $matches)) {
            return PHP_INT_MAX;
        }

        $multipliers = [
            'mcg' => 0.001,
            'mg' => 1,
            'g' => 1000,
            'ml' => 1000000,
            'iu' => 2000000,
        ];
        $unit = strtolower((string) $matches[2]);
        return (float) $matches[1] * (isset($multipliers[$unit]) ? $multipliers[$unit] : 1);
    }

    private static function library_format_date($date) {
        $date = trim((string) $date);
        if ($date === '') {
            return 'Date pending';
        }

        $timestamp = strtotime($date);
        if (!$timestamp) {
            return $date;
        }

        return wp_date('M j, Y', $timestamp);
    }

    private static function library_initials($name) {
        $parts = preg_split('/[\s\-\/]+/', trim((string) $name));
        $parts = array_values(array_filter((array) $parts));
        if (empty($parts)) {
            return 'CO';
        }
        if (count($parts) === 1) {
            return strtoupper(substr((string) $parts[0], 0, 2));
        }
        return strtoupper(substr((string) $parts[0], 0, 1) . substr((string) $parts[1], 0, 1));
    }

    public static function render_family_library_page() {
        if (!current_user_can('edit_posts')) {
            wp_die('Unauthorized');
        }

        $query = new WP_Query([
            'post_type' => self::CPT,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
            'no_found_rows' => true,
        ]);

        $families = [];
        $total_current = 0;
        $total_history = 0;
        $total_documents = 0;

        foreach ($query->posts as $post) {
            $post_id = (int) $post->ID;
            $identity = self::library_family_identity($post_id);
            $key = $identity['key'];
            $product_name = trim((string) self::get_meta($post_id, 'product_name', $post->post_title));
            $compound = trim((string) self::get_meta($post_id, 'compound'));
            $strength = trim((string) self::get_meta($post_id, 'strength'));
            if ($strength === '') {
                $strength = self::detect_strength_from_text($product_name . ' ' . $compound);
            }
            if ($strength === '') {
                $strength = 'Standard';
            }

            $history = self::get_meta($post_id, 'history', []);
            $history_count = is_array($history) ? count($history) : 0;
            $is_current = self::to_bool(self::get_meta($post_id, 'current_shipping_lot', false))
                || self::to_bool(self::get_meta($post_id, 'active_shipping_lot', false))
                || self::to_bool(self::get_meta($post_id, 'current_coa_current_shipping_lot', false));
            $document_url = self::library_document_url($post_id);
            $date = (string) self::get_meta($post_id, 'current_date', self::get_meta($post_id, 'date'));
            $purity = trim((string) self::get_meta($post_id, 'current_purity', self::get_meta($post_id, 'purity')));
            $coa_number = trim((string) self::get_meta($post_id, 'coa_number'));
            $batch = trim((string) self::get_meta($post_id, 'batch'));
            $lot = trim((string) self::get_meta($post_id, 'lot'));
            $batch_label = $batch ?: $lot;

            if (!isset($families[$key])) {
                $families[$key] = [
                    'key' => $key,
                    'name' => $identity['name'],
                    'custom_name' => $identity['custom_name'],
                    'has_custom_name' => $identity['has_custom_name'],
                    'aliases' => $identity['aliases'],
                    'records' => [],
                    'strengths' => [],
                    'current' => 0,
                    'history' => 0,
                    'documents' => 0,
                ];
            } elseif (!$families[$key]['has_custom_name'] && $identity['has_custom_name']) {
                $families[$key]['name'] = $identity['name'];
                $families[$key]['custom_name'] = $identity['custom_name'];
                $families[$key]['has_custom_name'] = true;
                $families[$key]['aliases'] = $identity['aliases'];
            }

            $record = [
                'id' => $post_id,
                'title' => $product_name ?: ($compound ?: $post->post_title),
                'compound' => $compound,
                'strength' => $strength,
                'strength_sort' => self::library_strength_sort_value($strength),
                'coa_number' => $coa_number,
                'batch' => $batch_label,
                'date' => $date,
                'date_label' => self::library_format_date($date),
                'purity' => $purity,
                'status' => (string) $post->post_status,
                'current' => $is_current,
                'history' => $history_count,
                'document_url' => $document_url,
                'edit_url' => get_edit_post_link($post_id, 'raw'),
            ];

            $families[$key]['records'][] = $record;
            $families[$key]['strengths'][strtolower($strength)] = $strength;
            $families[$key]['current'] += $is_current ? 1 : 0;
            $families[$key]['history'] += $history_count;
            $families[$key]['documents'] += $document_url !== '' ? 1 : 0;
            $total_current += $is_current ? 1 : 0;
            $total_history += $history_count;
            $total_documents += $document_url !== '' ? 1 : 0;
        }

        wp_reset_postdata();

        uasort($families, function ($a, $b) {
            if ($a['current'] !== $b['current']) {
                return $b['current'] <=> $a['current'];
            }
            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        foreach ($families as &$family) {
            usort($family['records'], function ($a, $b) {
                if ($a['current'] !== $b['current']) {
                    return (int) $b['current'] <=> (int) $a['current'];
                }
                if ($a['strength_sort'] !== $b['strength_sort']) {
                    return $a['strength_sort'] <=> $b['strength_sort'];
                }
                return strcasecmp((string) $a['title'], (string) $b['title']);
            });
        }
        unset($family);

        $total_records = count($query->posts);
        $endpoint = rest_url(self::REST_NAMESPACE . '/coas');
        $add_url = admin_url('post-new.php?post_type=' . self::CPT);
        $classic_url = admin_url('edit.php?post_type=' . self::CPT . '&p1coa_classic=1');
        $import_url = admin_url('edit.php?post_type=' . self::CPT . '&page=p1coa-import-export');
        $settings_url = admin_url('edit.php?post_type=' . self::CPT . '&page=p1coa-settings');

        echo '<div class="wrap p1coa-library" data-p1coa-family-library>';
        if (isset($_GET['family_updated'])) {
            $family_updated = sanitize_key(wp_unslash($_GET['family_updated']));
            $updated_records = isset($_GET['updated_records']) ? absint($_GET['updated_records']) : 0;
            if ($family_updated === '1') {
                echo '<div class="p1coa-library-notice is-success"><span class="dashicons dashicons-yes-alt"></span><div><strong>Custom family name saved</strong><span>Updated ' . esc_html((string) $updated_records) . ' COA record' . ($updated_records === 1 ? '' : 's') . ' in this family.</span></div></div>';
            } else {
                echo '<div class="p1coa-library-notice is-warning"><span class="dashicons dashicons-warning"></span><div><strong>Nothing was updated</strong><span>Please confirm that this family still contains editable COA records.</span></div></div>';
            }
        }
        echo '<section class="p1coa-library-hero">';
        echo '<div class="p1coa-library-hero-copy">';
        echo '<div class="p1coa-library-kicker"><span class="dashicons dashicons-shield-alt"></span> Phase One Labz · Certificate Control</div>';
        echo '<h1>COA Family Library</h1>';
        echo '<p>Every certificate organized by family, strength and lot. Manage current shipping documents without digging through the classic WordPress table.</p>';
        echo '</div>';
        echo '<div class="p1coa-library-actions">';
        echo '<a class="p1coa-btn p1coa-btn-primary" href="' . esc_url($add_url) . '"><span class="dashicons dashicons-plus-alt2"></span> Add COA</a>';
        echo '<a class="p1coa-btn" href="' . esc_url($import_url) . '"><span class="dashicons dashicons-upload"></span> Import / Export</a>';
        echo '<a class="p1coa-btn p1coa-btn-icon" href="' . esc_url($settings_url) . '" aria-label="COA settings"><span class="dashicons dashicons-admin-generic"></span></a>';
        echo '</div>';
        echo '</section>';

        echo '<section class="p1coa-library-stats" aria-label="COA library summary">';
        $stats = [
            ['Families', count($families), 'dashicons-category', 'blue'],
            ['COA records', $total_records, 'dashicons-media-document', 'cyan'],
            ['Current lots', $total_current, 'dashicons-yes-alt', 'green'],
            ['Archived reports', $total_history, 'dashicons-backup', 'violet'],
        ];
        foreach ($stats as $stat) {
            echo '<article class="p1coa-stat p1coa-stat-' . esc_attr($stat[3]) . '">';
            echo '<span class="p1coa-stat-icon dashicons ' . esc_attr($stat[2]) . '"></span>';
            echo '<div><strong>' . esc_html((string) $stat[1]) . '</strong><span>' . esc_html($stat[0]) . '</span></div>';
            echo '</article>';
        }
        echo '</section>';

        echo '<section class="p1coa-library-toolbar">';
        echo '<label class="p1coa-library-search"><span class="dashicons dashicons-search"></span><input type="search" placeholder="Search family, alias, strength, batch or COA number..." data-p1coa-family-search></label>';
        echo '<div class="p1coa-filter-row" role="group" aria-label="Filter COA families">';
        echo '<button type="button" class="is-active" data-p1coa-filter="all">All families</button>';
        echo '<button type="button" data-p1coa-filter="current">Current lots</button>';
        echo '<button type="button" data-p1coa-filter="history">With history</button>';
        echo '<button type="button" data-p1coa-filter="missing">Missing document</button>';
        echo '</div>';
        echo '<div class="p1coa-toolbar-meta"><span data-p1coa-visible-count>' . esc_html((string) count($families)) . '</span> visible <button type="button" data-p1coa-expand>Expand all</button><button type="button" data-p1coa-collapse>Collapse all</button></div>';
        echo '</section>';

        echo '<section class="p1coa-family-list">';
        if (empty($families)) {
            echo '<div class="p1coa-library-empty"><span class="dashicons dashicons-media-document"></span><h2>No COA families yet</h2><p>Add your first certificate or import the existing records.</p><a class="p1coa-btn p1coa-btn-primary" href="' . esc_url($add_url) . '">Add first COA</a></div>';
        } else {
            foreach ($families as $family) {
                $strength_count = count($family['strengths']);
                $record_count = count($family['records']);
                $missing_documents = max(0, $record_count - (int) $family['documents']);
                $record_ids = implode(',', array_map('absint', wp_list_pluck($family['records'], 'id')));
                $fallback_family_name = !empty($family['aliases'][0]) ? (string) $family['aliases'][0] : $family['name'];
                $search_parts = [$family['name'], implode(' ', $family['aliases'])];
                foreach ($family['records'] as $record) {
                    $search_parts[] = implode(' ', [$record['title'], $record['compound'], $record['strength'], $record['coa_number'], $record['batch']]);
                }
                $search_text = strtolower(trim(implode(' ', $search_parts)));
                $open = $family['current'] > 0 ? ' open' : '';

                echo '<details class="p1coa-family" data-p1coa-family data-search="' . esc_attr($search_text) . '" data-current="' . esc_attr((string) $family['current']) . '" data-history="' . esc_attr((string) $family['history']) . '" data-missing="' . esc_attr((string) $missing_documents) . '"' . $open . '>';
                echo '<summary class="p1coa-family-summary">';
                echo '<span class="p1coa-family-avatar">' . esc_html(self::library_initials($family['name'])) . '</span>';
                echo '<span class="p1coa-family-heading"><span class="p1coa-family-overline">COA family</span><strong>' . esc_html($family['name']) . '</strong><small>' . esc_html((string) $strength_count) . ' strength' . ($strength_count === 1 ? '' : 's') . ' · ' . esc_html((string) $record_count) . ' record' . ($record_count === 1 ? '' : 's') . '</small></span>';
                echo '<span class="p1coa-family-badges">';
                if ($family['current'] > 0) {
                    echo '<span class="p1coa-chip p1coa-chip-current"><span></span>' . esc_html((string) $family['current']) . ' current</span>';
                }
                if ($family['history'] > 0) {
                    echo '<span class="p1coa-chip"><span class="dashicons dashicons-backup"></span>' . esc_html((string) $family['history']) . ' archived</span>';
                }
                if ($missing_documents > 0) {
                    echo '<span class="p1coa-chip p1coa-chip-warning"><span class="dashicons dashicons-warning"></span>' . esc_html((string) $missing_documents) . ' missing PDF</span>';
                }
                echo '</span>';
                echo '<span class="p1coa-family-chevron dashicons dashicons-arrow-down-alt2"></span>';
                echo '</summary>';

                echo '<div class="p1coa-family-content">';
                echo '<form class="p1coa-family-name-form" method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
                echo '<input type="hidden" name="action" value="p1coa_save_family_name">';
                echo '<input type="hidden" name="record_ids" value="' . esc_attr($record_ids) . '">';
                echo '<input type="hidden" name="family_key" value="' . esc_attr($family['key']) . '">';
                echo wp_nonce_field('p1coa_save_family_name', 'p1coa_family_nonce', true, false);
                echo '<div class="p1coa-family-name-copy"><span class="dashicons dashicons-edit-page"></span><div><strong>Custom family name</strong><small>Public name used by every strength and lot in this family.</small></div></div>';
                echo '<label><span class="screen-reader-text">Custom family name</span><input type="text" name="family_name" value="' . esc_attr($family['custom_name']) . '" placeholder="' . esc_attr($fallback_family_name) . '" maxlength="80"></label>';
                echo '<button type="submit"><span class="dashicons dashicons-saved"></span> Save name</button>';
                echo '<small class="p1coa-family-name-help">Examples: R3TA, TIRZ, GLOW. Clear the field and save to return to the first alias.</small>';
                echo '</form>';
                echo '<div class="p1coa-record-head"><span>Strength / product</span><span>Batch / COA</span><span>Certificate</span><span>Quality</span><span>Actions</span></div>';
                foreach ($family['records'] as $record) {
                    $status_label = $record['status'] === 'publish' ? 'Published' : ucfirst((string) $record['status']);
                    echo '<article class="p1coa-record' . ($record['current'] ? ' is-current' : '') . '">';
                    echo '<div class="p1coa-record-product"><span class="p1coa-strength">' . esc_html($record['strength']) . '</span><div><strong>' . esc_html($record['title']) . '</strong><small>' . esc_html($status_label) . ($record['history'] ? ' · ' . esc_html((string) $record['history']) . ' archived' : '') . '</small></div></div>';
                    echo '<div class="p1coa-record-meta"><strong>' . esc_html($record['batch'] ?: 'Batch pending') . '</strong><small>' . esc_html($record['coa_number'] ?: 'COA number pending') . '</small></div>';
                    echo '<div class="p1coa-record-document">';
                    if ($record['document_url']) {
                        echo '<span class="p1coa-doc-state is-ready"><span class="dashicons dashicons-pdf"></span> Document ready</span><small>' . esc_html($record['date_label']) . '</small>';
                    } else {
                        echo '<span class="p1coa-doc-state is-missing"><span class="dashicons dashicons-warning"></span> Missing document</span><small>' . esc_html($record['date_label']) . '</small>';
                    }
                    echo '</div>';
                    echo '<div class="p1coa-record-quality">';
                    if ($record['current']) {
                        echo '<span class="p1coa-current-label"><span></span> Shipping now</span>';
                    } else {
                        echo '<span class="p1coa-neutral-label">Stored lot</span>';
                    }
                    echo '<small>' . esc_html($record['purity'] ?: 'Purity not reported') . '</small></div>';
                    echo '<div class="p1coa-record-actions">';
                    if ($record['document_url']) {
                        echo '<a href="' . esc_url($record['document_url']) . '" target="_blank" rel="noopener noreferrer" aria-label="Open certificate"><span class="dashicons dashicons-visibility"></span></a>';
                    }
                    echo '<a class="is-primary" href="' . esc_url($record['edit_url']) . '"><span class="dashicons dashicons-edit"></span><span>Edit</span></a>';
                    echo '</div>';
                    echo '</article>';
                }
                echo '</div>';
                echo '</details>';
            }
        }
        echo '<div class="p1coa-library-no-results" data-p1coa-no-results hidden><span class="dashicons dashicons-search"></span><h2>No matching families</h2><p>Try another name, strength, batch or filter.</p></div>';
        echo '</section>';

        echo '<footer class="p1coa-library-footer"><span><span class="dashicons dashicons-rest-api"></span> Public API connected</span><code>' . esc_html($endpoint) . '</code><a href="' . esc_url($classic_url) . '">Open classic records</a></footer>';
        echo '</div>';

        self::render_family_library_styles();
        echo '<style>' . self::premium_admin_styles() . '</style>';
        self::render_family_library_script();
    }

    private static function render_family_library_styles() {
        echo <<<'P1COACSS'
<style>
.p1coa-library{--p1-bg:#07111f;--p1-panel:#0b1728;--p1-panel-2:#101d30;--p1-line:rgba(148,197,255,.13);--p1-blue:#72b8ff;--p1-cyan:#8eeaff;--p1-text:#f7fbff;--p1-muted:#8291a7;max-width:1440px;margin:24px auto 40px;padding-right:20px;color:var(--p1-text)}
.p1coa-library *{box-sizing:border-box}.p1coa-library a{text-decoration:none}.p1coa-library-hero{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:28px;overflow:hidden;padding:34px;border:1px solid var(--p1-line);border-radius:28px;background:radial-gradient(circle at 8% 0%,rgba(58,139,255,.22),transparent 34%),linear-gradient(135deg,#0c1a2e,#07111f 60%,#091525);box-shadow:0 24px 70px rgba(2,8,20,.2)}
.p1coa-library-notice{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:13px 16px;border:1px solid rgba(93,225,170,.2);border-radius:15px;background:rgba(59,190,136,.08);color:#9de7c6}.p1coa-library-notice.is-warning{border-color:rgba(255,184,92,.2);background:rgba(255,184,92,.07);color:#e1b77f}.p1coa-library-notice>.dashicons{width:20px;height:20px;font-size:20px}.p1coa-library-notice>div{display:grid;gap:2px}.p1coa-library-notice strong{color:#eefcf6;font-size:12px}.p1coa-library-notice span{font-size:10px}
.p1coa-library-hero:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 40%,rgba(142,234,255,.04),transparent 70%)}
.p1coa-library-hero-copy,.p1coa-library-actions{position:relative;z-index:1}.p1coa-library-kicker{display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;color:#9ecbff;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.p1coa-library-kicker .dashicons{font-size:15px;width:15px;height:15px}
.p1coa-library-hero h1{margin:0;color:#fff;font-size:38px;line-height:1;letter-spacing:-.045em}.p1coa-library-hero p{max-width:720px;margin:13px 0 0;color:#9aa9bc;font-size:14px;line-height:1.7}.p1coa-library-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px}
.p1coa-btn{display:inline-flex;min-height:44px;align-items:center;justify-content:center;gap:8px;padding:0 16px;border:1px solid rgba(157,202,255,.14);border-radius:13px;background:rgba(255,255,255,.045);color:#dbeaff;font-size:12px;font-weight:700;transition:.18s ease}.p1coa-btn:hover{transform:translateY(-1px);border-color:rgba(142,234,255,.32);background:rgba(142,234,255,.08);color:#fff}.p1coa-btn-primary{border-color:rgba(142,234,255,.42);background:linear-gradient(180deg,#9aeaff,#6bc9f4);color:#06121e;box-shadow:0 12px 28px rgba(74,190,239,.2)}.p1coa-btn-primary:hover{background:#a9efff;color:#06121e}.p1coa-btn-icon{width:44px;padding:0}.p1coa-btn .dashicons{font-size:16px;width:16px;height:16px}
.p1coa-library-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}.p1coa-stat{display:flex;min-width:0;align-items:center;gap:14px;padding:18px;border:1px solid var(--p1-line);border-radius:18px;background:linear-gradient(180deg,rgba(15,30,50,.96),rgba(8,19,34,.96));box-shadow:inset 0 1px rgba(255,255,255,.03)}.p1coa-stat-icon{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border:1px solid rgba(114,184,255,.18);border-radius:13px;background:rgba(114,184,255,.09);color:#91c8ff}.p1coa-stat div{display:grid;gap:2px}.p1coa-stat strong{color:#fff;font-size:24px;line-height:1}.p1coa-stat span:not(.p1coa-stat-icon){color:#73849b;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.p1coa-stat-green .p1coa-stat-icon{border-color:rgba(97,233,177,.18);background:rgba(97,233,177,.08);color:#85efc3}.p1coa-stat-violet .p1coa-stat-icon{border-color:rgba(188,151,255,.18);background:rgba(188,151,255,.08);color:#c7aaff}.p1coa-stat-cyan .p1coa-stat-icon{border-color:rgba(142,234,255,.18);background:rgba(142,234,255,.08);color:#9af1ff}
.p1coa-library-toolbar{display:grid;grid-template-columns:minmax(280px,1.2fr) auto auto;align-items:center;gap:12px;margin:14px 0;padding:12px;border:1px solid var(--p1-line);border-radius:19px;background:rgba(8,20,35,.96)}.p1coa-library-search{position:relative;display:block}.p1coa-library-search .dashicons{position:absolute;top:50%;left:14px;width:17px;height:17px;transform:translateY(-50%);color:#64809f}.p1coa-library-search input{width:100%;min-height:44px;padding:0 14px 0 42px;border:1px solid rgba(151,196,247,.12)!important;border-radius:13px!important;background:#07111f!important;color:#fff!important;box-shadow:none!important}.p1coa-library-search input:focus{border-color:rgba(114,184,255,.46)!important}.p1coa-library-search input::placeholder{color:#53657b}
.p1coa-filter-row{display:flex;gap:5px;overflow-x:auto}.p1coa-filter-row button,.p1coa-toolbar-meta button{border:0;cursor:pointer}.p1coa-filter-row button{min-height:36px;white-space:nowrap;padding:0 11px;border:1px solid transparent;border-radius:10px;background:transparent;color:#74869c;font-size:10px;font-weight:700}.p1coa-filter-row button:hover{background:rgba(255,255,255,.04);color:#cde2f8}.p1coa-filter-row button.is-active{border-color:rgba(114,184,255,.2);background:rgba(114,184,255,.1);color:#b9dcff}.p1coa-toolbar-meta{display:flex;align-items:center;justify-content:flex-end;gap:7px;white-space:nowrap;color:#60738b;font-size:10px}.p1coa-toolbar-meta>span{color:#b5cae0;font-weight:800}.p1coa-toolbar-meta button{padding:5px;background:transparent;color:#7190ae;font-size:10px}.p1coa-toolbar-meta button:hover{color:#fff}
.p1coa-family-list{display:grid;gap:10px}.p1coa-family{overflow:hidden;border:1px solid var(--p1-line);border-radius:20px;background:linear-gradient(180deg,#0c192a,#091422);box-shadow:0 12px 35px rgba(1,7,18,.12)}.p1coa-family[hidden]{display:none}.p1coa-family-summary{display:grid;grid-template-columns:auto minmax(220px,1fr) auto auto;align-items:center;gap:14px;min-height:86px;padding:16px 18px;cursor:pointer;list-style:none}.p1coa-family-summary::-webkit-details-marker{display:none}.p1coa-family-summary:hover{background:rgba(132,196,255,.025)}.p1coa-family-avatar{display:grid;width:48px;height:48px;place-items:center;border:1px solid rgba(114,184,255,.22);border-radius:15px;background:linear-gradient(145deg,rgba(74,139,255,.17),rgba(90,219,255,.07));color:#b8dcff;font-size:14px;font-weight:900;letter-spacing:.04em}.p1coa-family-heading{display:grid;min-width:0;gap:2px}.p1coa-family-overline{color:#52769d;font-size:8px;font-weight:900;letter-spacing:.17em;text-transform:uppercase}.p1coa-family-heading strong{overflow:hidden;color:#fff;font-size:19px;letter-spacing:-.025em;text-overflow:ellipsis;white-space:nowrap}.p1coa-family-heading small{color:#667a92;font-size:10px}.p1coa-family-badges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.p1coa-chip{display:inline-flex;min-height:28px;align-items:center;gap:6px;padding:0 9px;border:1px solid rgba(150,191,238,.1);border-radius:999px;background:rgba(255,255,255,.025);color:#8295ab;font-size:9px;font-weight:700}.p1coa-chip .dashicons{width:12px;height:12px;font-size:12px}.p1coa-chip-current{border-color:rgba(80,223,166,.15);background:rgba(80,223,166,.06);color:#9ce9c7}.p1coa-chip-current>span{width:6px;height:6px;border-radius:99px;background:#66e4ae;box-shadow:0 0 10px rgba(102,228,174,.8)}.p1coa-chip-warning{border-color:rgba(255,184,92,.15);background:rgba(255,184,92,.05);color:#d9a96f}.p1coa-family-chevron{color:#5f7895;transition:transform .2s ease}.p1coa-family[open] .p1coa-family-chevron{transform:rotate(180deg)}
.p1coa-family-content{padding:0 12px 12px}.p1coa-record-head,.p1coa-record{display:grid;grid-template-columns:minmax(230px,1.25fr) minmax(160px,.9fr) minmax(160px,.85fr) minmax(135px,.65fr) 100px;align-items:center;gap:12px}.p1coa-record-head{padding:10px 14px;color:#51657d;font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.p1coa-record{position:relative;min-height:72px;margin-top:6px;padding:11px 14px;border:1px solid rgba(148,197,255,.08);border-radius:14px;background:rgba(255,255,255,.018)}.p1coa-record.is-current{border-color:rgba(93,227,173,.14);background:linear-gradient(90deg,rgba(69,211,155,.045),rgba(255,255,255,.015) 35%)}.p1coa-record.is-current:before{content:"";position:absolute;top:13px;bottom:13px;left:0;width:2px;border-radius:2px;background:#5de1aa;box-shadow:0 0 12px rgba(93,225,170,.5)}.p1coa-record-product{display:flex;min-width:0;align-items:center;gap:10px}.p1coa-strength{display:inline-flex;min-width:58px;min-height:34px;align-items:center;justify-content:center;padding:0 8px;border:1px solid rgba(114,184,255,.16);border-radius:10px;background:rgba(114,184,255,.07);color:#b9dcff;font-size:10px;font-weight:900}.p1coa-record-product>div,.p1coa-record-meta,.p1coa-record-document,.p1coa-record-quality{display:grid;min-width:0;gap:3px}.p1coa-record strong{overflow:hidden;color:#eaf3fc;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.p1coa-record small{overflow:hidden;color:#60748c;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.p1coa-doc-state,.p1coa-current-label,.p1coa-neutral-label{display:inline-flex;width:max-content;max-width:100%;align-items:center;gap:6px;font-size:9px;font-weight:800}.p1coa-doc-state .dashicons{width:13px;height:13px;font-size:13px}.p1coa-doc-state.is-ready{color:#9fceff}.p1coa-doc-state.is-missing{color:#d5a46e}.p1coa-current-label{color:#91e5c0}.p1coa-current-label>span{width:6px;height:6px;border-radius:99px;background:#61dda8;box-shadow:0 0 8px rgba(97,221,168,.7)}.p1coa-neutral-label{color:#75889f}.p1coa-record-actions{display:flex;justify-content:flex-end;gap:6px}.p1coa-record-actions a{display:inline-flex;min-width:34px;min-height:34px;align-items:center;justify-content:center;gap:6px;padding:0 8px;border:1px solid rgba(148,197,255,.1);border-radius:10px;background:rgba(255,255,255,.025);color:#86a1bd;font-size:9px;font-weight:800}.p1coa-record-actions a:hover{border-color:rgba(114,184,255,.28);background:rgba(114,184,255,.08);color:#dff1ff}.p1coa-record-actions a.is-primary{border-color:rgba(114,184,255,.2);background:rgba(114,184,255,.09);color:#b9dcff}.p1coa-record-actions .dashicons{width:14px;height:14px;font-size:14px}
.p1coa-family-name-form{display:grid;grid-template-columns:minmax(260px,1fr) minmax(220px,360px) auto;align-items:center;gap:10px;margin:2px 0 8px;padding:12px 14px;border:1px solid rgba(142,234,255,.11);border-radius:14px;background:linear-gradient(90deg,rgba(72,170,255,.055),rgba(255,255,255,.018))}.p1coa-family-name-copy{display:flex;min-width:0;align-items:center;gap:10px}.p1coa-family-name-copy>.dashicons{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border:1px solid rgba(114,184,255,.16);border-radius:10px;background:rgba(114,184,255,.07);color:#9bcfff;font-size:15px}.p1coa-family-name-copy>div{display:grid;gap:2px}.p1coa-family-name-copy strong{color:#eaf6ff;font-size:11px}.p1coa-family-name-copy small,.p1coa-family-name-help{color:#637a92;font-size:9px}.p1coa-family-name-form label{display:block}.p1coa-family-name-form input[type=text]{width:100%;min-height:38px;margin:0;padding:0 12px;border:1px solid rgba(142,199,255,.16)!important;border-radius:10px!important;background:#07111f!important;color:#fff!important;font-size:12px;font-weight:700;box-shadow:none!important}.p1coa-family-name-form input[type=text]:focus{border-color:rgba(142,234,255,.48)!important}.p1coa-family-name-form input[type=text]::placeholder{color:#536c86}.p1coa-family-name-form button{display:inline-flex;min-height:38px;align-items:center;justify-content:center;gap:6px;padding:0 13px;border:1px solid rgba(142,234,255,.28);border-radius:10px;background:rgba(113,215,255,.12);color:#c9f2ff;font-size:10px;font-weight:800;cursor:pointer}.p1coa-family-name-form button:hover{border-color:rgba(142,234,255,.48);background:rgba(113,215,255,.18);color:#fff}.p1coa-family-name-form button .dashicons{width:14px;height:14px;font-size:14px}.p1coa-family-name-help{grid-column:2/4;margin-top:-3px}
.p1coa-library-empty,.p1coa-library-no-results{padding:70px 24px;border:1px dashed rgba(148,197,255,.17);border-radius:22px;background:rgba(8,19,33,.65);text-align:center}.p1coa-library-empty>.dashicons,.p1coa-library-no-results>.dashicons{width:46px;height:46px;color:#6c91b5;font-size:46px}.p1coa-library-empty h2,.p1coa-library-no-results h2{margin:14px 0 5px;color:#fff}.p1coa-library-empty p,.p1coa-library-no-results p{margin:0 0 18px;color:#71849a}.p1coa-library-footer{display:flex;align-items:center;gap:12px;margin-top:13px;padding:12px 4px;color:#60738b;font-size:10px}.p1coa-library-footer>span{display:flex;align-items:center;gap:6px;color:#7da588}.p1coa-library-footer .dashicons{width:14px;height:14px;font-size:14px}.p1coa-library-footer code{overflow:hidden;max-width:600px;background:transparent;color:#52677e;text-overflow:ellipsis;white-space:nowrap}.p1coa-library-footer a{margin-left:auto;color:#7899ba}.p1coa-library-footer a:hover{color:#fff}
@media(max-width:1180px){.p1coa-library-toolbar{grid-template-columns:1fr}.p1coa-filter-row{order:2}.p1coa-toolbar-meta{justify-content:flex-start;order:3}.p1coa-record-head{display:none}.p1coa-record{grid-template-columns:minmax(220px,1.3fr) minmax(140px,.8fr) minmax(150px,.8fr) 110px 90px}}
@media(max-width:900px){.p1coa-library{padding-right:10px}.p1coa-library-hero{align-items:flex-start;flex-direction:column;padding:26px}.p1coa-library-actions{justify-content:flex-start}.p1coa-library-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-family-summary{grid-template-columns:auto minmax(0,1fr) auto}.p1coa-family-badges{grid-column:2/3;justify-content:flex-start}.p1coa-family-chevron{grid-column:3;grid-row:1/3}.p1coa-family-name-form{grid-template-columns:1fr auto}.p1coa-family-name-copy{grid-column:1/3}.p1coa-family-name-help{grid-column:1/3}.p1coa-record{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.p1coa-record-actions{justify-content:flex-start}.p1coa-record-actions a.is-primary span:last-child{display:inline}}
@media(max-width:600px){.p1coa-library{margin-top:12px;padding-right:10px}.p1coa-library-hero{padding:22px;border-radius:20px}.p1coa-library-hero h1{font-size:30px}.p1coa-library-actions{width:100%}.p1coa-btn{flex:1}.p1coa-btn-icon{flex:0 0 44px}.p1coa-library-stats{gap:8px}.p1coa-stat{padding:14px 12px}.p1coa-stat-icon{width:36px;height:36px;flex-basis:36px}.p1coa-stat strong{font-size:20px}.p1coa-library-toolbar{padding:9px}.p1coa-filter-row{padding-bottom:3px}.p1coa-family{border-radius:17px}.p1coa-family-summary{grid-template-columns:auto minmax(0,1fr) auto;gap:10px;padding:14px}.p1coa-family-avatar{width:42px;height:42px;border-radius:13px}.p1coa-family-heading strong{font-size:16px}.p1coa-family-badges{grid-column:1/4;justify-content:flex-start}.p1coa-family-chevron{grid-column:3;grid-row:1}.p1coa-family-content{padding:0 8px 8px}.p1coa-family-name-form{grid-template-columns:1fr;padding:11px}.p1coa-family-name-copy,.p1coa-family-name-help{grid-column:1}.p1coa-family-name-form button{width:100%}.p1coa-record{grid-template-columns:1fr 1fr;min-height:0;padding:12px}.p1coa-record-product{grid-column:1/3}.p1coa-record-document,.p1coa-record-quality{padding-top:8px;border-top:1px solid rgba(148,197,255,.07)}.p1coa-record-actions{grid-column:1/3}.p1coa-record-actions a{flex:1}.p1coa-library-footer{align-items:flex-start;flex-direction:column}.p1coa-library-footer code{max-width:100%}.p1coa-library-footer a{margin-left:0}}
</style>
P1COACSS;
    }

    private static function render_family_library_script() {
        echo <<<'P1COAJS'
<script>
(function(){
  var root=document.querySelector('[data-p1coa-family-library]');
  if(!root)return;
  var search=root.querySelector('[data-p1coa-family-search]');
  var cards=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-family]'));
  var buttons=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-filter]'));
  var count=root.querySelector('[data-p1coa-visible-count]');
  var empty=root.querySelector('[data-p1coa-no-results]');
  var active='all';
  function normalize(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
  function refresh(){
    var query=normalize(search&&search.value);
    var visible=0;
    cards.forEach(function(card){
      var matchesSearch=!query||normalize(card.getAttribute('data-search')).indexOf(query)!==-1;
      var matchesFilter=active==='all'||(active==='current'&&Number(card.getAttribute('data-current'))>0)||(active==='history'&&Number(card.getAttribute('data-history'))>0)||(active==='missing'&&Number(card.getAttribute('data-missing'))>0);
      var show=matchesSearch&&matchesFilter;
      card.hidden=!show;
      if(show){visible+=1;if(query)card.open=true;}
    });
    if(count)count.textContent=String(visible);
    if(empty)empty.hidden=visible!==0;
  }
  buttons.forEach(function(button){button.addEventListener('click',function(){active=button.getAttribute('data-p1coa-filter')||'all';buttons.forEach(function(item){item.classList.toggle('is-active',item===button);});refresh();});});
  if(search)search.addEventListener('input',refresh);
  var expand=root.querySelector('[data-p1coa-expand]');
  var collapse=root.querySelector('[data-p1coa-collapse]');
  if(expand)expand.addEventListener('click',function(){cards.forEach(function(card){if(!card.hidden)card.open=true;});});
  if(collapse)collapse.addEventListener('click',function(){cards.forEach(function(card){card.open=false;});});
  refresh();
})();
</script>
P1COAJS;
    }

    public static function columns($columns) {
        $new = [];
        $new['cb'] = isset($columns['cb']) ? $columns['cb'] : '<input type="checkbox" />';
        $new['title'] = 'Product';
        $new['coa_number'] = 'COA Number';
        $new['batch'] = 'Batch / Lot';
        $new['skus'] = 'SKUs';
        $new['current_lot'] = 'Current Lot';
        $new['coa_date'] = 'COA Date';
        $new['date'] = 'Updated';
        return $new;
    }

    public static function column_content($column, $post_id) {
        switch ($column) {
            case 'coa_number':
                echo esc_html((string) self::get_meta($post_id, 'coa_number'));
                break;
            case 'batch':
                $batch = (string) self::get_meta($post_id, 'batch');
                $lot = (string) self::get_meta($post_id, 'lot');
                echo esc_html(trim($batch . ($lot ? ' / ' . $lot : '')));
                break;
            case 'skus':
                echo esc_html(implode(', ', self::string_array(self::get_meta($post_id, 'skus', []))));
                break;
            case 'current_lot':
                $current = self::to_bool(self::get_meta($post_id, 'current_shipping_lot', false)) || self::to_bool(self::get_meta($post_id, 'active_shipping_lot', false));
                echo $current ? '<span class="p1coa-badge p1coa-badge-current">Yes</span>' : '<span class="p1coa-badge">No</span>';
                break;
            case 'coa_date':
                echo esc_html((string) self::get_meta($post_id, 'date'));
                break;
        }
    }

    public static function sortable_columns($columns) {
        $columns['coa_date'] = 'coa_date';
        return $columns;
    }

    private static function smart_review_key() {
        return 'p1coa_smart_review_' . get_current_user_id();
    }

    private static function smart_intake_url($args = []) {
        return add_query_arg(
            array_merge([
                'post_type' => self::CPT,
                'page' => 'p1coa-smart-intake',
            ], (array) $args),
            admin_url('edit.php')
        );
    }

    public static function handle_smart_scan() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('p1coa_smart_scan');

        if (function_exists('set_time_limit')) {
            @set_time_limit(180);
        }

        $rows = [];
        $errors = [];
        $mark_current = !empty($_POST['p1coa_mark_current']);
        $files = self::smart_normalize_uploaded_files(isset($_FILES['p1coa_pdfs']) ? $_FILES['p1coa_pdfs'] : []);
        $urls_raw = isset($_POST['p1coa_source_urls']) ? wp_unslash($_POST['p1coa_source_urls']) : '';
        $urls = preg_split('/[\r\n,]+/', (string) $urls_raw);
        $urls = array_values(array_unique(array_filter(array_map('trim', (array) $urls))));

        $total_requested = count($files) + count($urls);
        if ($total_requested > self::SMART_MAX_ITEMS) {
            $errors[] = sprintf('Only the first %d sources were scanned. Split very large batches into more than one intake.', self::SMART_MAX_ITEMS);
        }

        foreach ($files as $file) {
            if (count($rows) >= self::SMART_MAX_ITEMS) {
                break;
            }
            $result = self::smart_ingest_uploaded_pdf($file, $mark_current);
            if (is_wp_error($result)) {
                $errors[] = ($file['name'] ? $file['name'] . ': ' : '') . $result->get_error_message();
            } else {
                $rows[] = $result;
            }
        }

        foreach ($urls as $url) {
            if (count($rows) >= self::SMART_MAX_ITEMS) {
                break;
            }
            $result = self::smart_ingest_remote_source($url, $mark_current);
            if (is_wp_error($result)) {
                $errors[] = $url . ': ' . $result->get_error_message();
            } else {
                $rows[] = $result;
            }
        }

        if ($total_requested === 0) {
            $errors[] = 'Choose at least one PDF or paste at least one report link.';
        }

        set_transient(self::smart_review_key(), [
            'created_at' => time(),
            'rows' => $rows,
            'errors' => $errors,
        ], 2 * HOUR_IN_SECONDS);

        wp_safe_redirect(self::smart_intake_url(['review' => '1']));
        exit;
    }

    public static function ajax_smart_scan_reset() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }
        check_ajax_referer('p1coa_smart_scan_ajax', 'nonce');

        delete_transient(self::smart_review_key());
        set_transient(self::smart_review_key(), [
            'created_at' => time(),
            'processed' => 0,
            'rows' => [],
            'errors' => [],
        ], 2 * HOUR_IN_SECONDS);

        wp_send_json_success([
            'status' => 'ready',
            'maxItems' => self::SMART_MAX_ITEMS,
        ]);
    }

    public static function ajax_smart_scan_item() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }
        check_ajax_referer('p1coa_smart_scan_ajax', 'nonce');

        if (function_exists('set_time_limit')) {
            @set_time_limit(120);
        }

        $review = get_transient(self::smart_review_key());
        if (!is_array($review)) {
            $review = [
                'created_at' => time(),
                'processed' => 0,
                'rows' => [],
                'errors' => [],
            ];
        }
        $review['rows'] = isset($review['rows']) && is_array($review['rows']) ? $review['rows'] : [];
        $review['errors'] = isset($review['errors']) && is_array($review['errors']) ? $review['errors'] : [];
        $review['processed'] = isset($review['processed']) ? absint($review['processed']) : 0;

        if ($review['processed'] >= self::SMART_MAX_ITEMS) {
            wp_send_json_error(['message' => 'The maximum number of documents for this batch has been reached.'], 400);
        }

        $mark_current = !empty($_POST['mark_current']);
        $kind = isset($_POST['kind']) ? sanitize_key(wp_unslash($_POST['kind'])) : '';
        $label = '';
        $result = null;

        if ($kind === 'file' && !empty($_FILES['p1coa_pdf']) && is_array($_FILES['p1coa_pdf'])) {
            $label = isset($_FILES['p1coa_pdf']['name']) ? sanitize_file_name((string) $_FILES['p1coa_pdf']['name']) : 'PDF document';
            $result = self::smart_ingest_uploaded_pdf($_FILES['p1coa_pdf'], $mark_current);
        } elseif ($kind === 'url') {
            $url = isset($_POST['source_url']) ? esc_url_raw(wp_unslash($_POST['source_url'])) : '';
            $label = $url ?: 'Laboratory link';
            $result = $url ? self::smart_ingest_remote_source($url, $mark_current) : new WP_Error('p1coa_smart_url', 'The laboratory link is empty.');
        } else {
            $result = new WP_Error('p1coa_smart_source', 'No valid PDF or laboratory link was received.');
            $label = 'Unknown source';
        }

        $review['processed']++;
        if (is_wp_error($result)) {
            $message = $label . ': ' . $result->get_error_message();
            $review['errors'][] = $message;
            set_transient(self::smart_review_key(), $review, 2 * HOUR_IN_SECONDS);
            wp_send_json_success([
                'itemStatus' => 'error',
                'label' => $label,
                'message' => $result->get_error_message(),
                'processed' => $review['processed'],
                'ready' => count($review['rows']),
            ]);
        }

        $review['rows'][] = $result;
        set_transient(self::smart_review_key(), $review, 2 * HOUR_IN_SECONDS);
        $record = isset($result['record']) && is_array($result['record']) ? $result['record'] : [];

        wp_send_json_success([
            'itemStatus' => 'ready',
            'label' => isset($result['source_label']) ? $result['source_label'] : $label,
            'confidence' => isset($result['confidence']) ? absint($result['confidence']) : 0,
            'compound' => isset($record['compound']) ? $record['compound'] : '',
            'family' => isset($record['familyName']) ? $record['familyName'] : '',
            'strength' => isset($record['strength']) ? $record['strength'] : '',
            'laboratory' => isset($record['laboratory']) ? $record['laboratory'] : '',
            'extractor' => isset($result['extractor']) ? $result['extractor'] : '',
            'warnings' => isset($result['warnings']) ? array_values((array) $result['warnings']) : [],
            'processed' => $review['processed'],
            'ready' => count($review['rows']),
        ]);
    }

    public static function handle_smart_commit() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('p1coa_smart_commit');

        $review = get_transient(self::smart_review_key());
        if (!is_array($review) || empty($review['rows']) || !is_array($review['rows'])) {
            wp_safe_redirect(self::smart_intake_url(['smart_error' => 'expired']));
            exit;
        }

        $posted_rows = isset($_POST['p1coa_rows']) && is_array($_POST['p1coa_rows']) ? wp_unslash($_POST['p1coa_rows']) : [];
        $save_as_draft = !empty($_POST['p1coa_save_as_draft']);
        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($review['rows'] as $index => $stored) {
            $posted = isset($posted_rows[$index]) && is_array($posted_rows[$index]) ? $posted_rows[$index] : [];
            if (empty($posted['selected'])) {
                $skipped++;
                continue;
            }

            $record = self::smart_build_reviewed_record($stored, $posted);
            if (is_wp_error($record)) {
                $skipped++;
                continue;
            }

            $existing_id = self::find_existing_record_id(
                (string) self::record_value($record, ['id', 'custom_id'], ''),
                (string) self::record_value($record, ['coaNumber', 'coa_number'], '')
            );
            $post_id = self::import_single_record($record, $save_as_draft ? 'draft' : 'publish');
            if (!$post_id) {
                $skipped++;
                continue;
            }

            update_post_meta($post_id, self::META_PREFIX . 'scan_confidence', absint(isset($stored['confidence']) ? $stored['confidence'] : 0));
            update_post_meta($post_id, self::META_PREFIX . 'scan_method', sanitize_text_field(isset($stored['extractor']) ? $stored['extractor'] : ''));
            update_post_meta($post_id, self::META_PREFIX . 'scan_source', esc_url_raw(isset($stored['source_url']) ? $stored['source_url'] : ''));
            update_post_meta($post_id, self::META_PREFIX . 'scan_fingerprint', sanitize_text_field(isset($stored['fingerprint']) ? $stored['fingerprint'] : ''));
            update_post_meta($post_id, self::META_PREFIX . 'scan_reviewed_at', current_time('mysql'));

            if (!empty($record['currentShippingLot'])) {
                $clean = [
                    'product_name' => isset($record['productName']) ? $record['productName'] : '',
                    'compound' => isset($record['compound']) ? $record['compound'] : '',
                    'family_key' => isset($record['familyKey']) ? $record['familyKey'] : '',
                    'strength' => isset($record['strength']) ? $record['strength'] : '',
                    'matched_product_id' => isset($record['matchedProductId']) ? $record['matchedProductId'] : 0,
                    'matched_variation_id' => isset($record['matchedVariationId']) ? $record['matchedVariationId'] : 0,
                ];
                if (get_option('p1coa_auto_unmark_current', '1') === '1') {
                    self::unmark_other_current_lots($post_id, $clean);
                }
            }

            if ($existing_id) {
                $updated++;
            } else {
                $created++;
            }
        }

        delete_transient(self::smart_review_key());
        wp_safe_redirect(self::smart_intake_url([
            'smart_saved' => '1',
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
        ]));
        exit;
    }

    public static function handle_smart_clear() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        check_admin_referer('p1coa_smart_clear');
        delete_transient(self::smart_review_key());
        wp_safe_redirect(self::smart_intake_url());
        exit;
    }

    public static function render_smart_intake_page() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        $review = get_transient(self::smart_review_key());
        $rows = is_array($review) && isset($review['rows']) && is_array($review['rows']) ? $review['rows'] : [];
        $errors = is_array($review) && isset($review['errors']) && is_array($review['errors']) ? $review['errors'] : [];
        $family_options = self::smart_family_catalog();

        echo '<style>' . self::smart_intake_styles() . self::premium_admin_styles() . '</style>';
        echo '<div class="wrap p1coa-smart" data-p1coa-smart>';
        echo '<header class="p1coa-smart-hero"><div><span class="p1coa-smart-kicker">PHASE ONE · INTELLIGENT DOCUMENT INTAKE</span><h1>Smart COA Intake</h1><p>Drop a full batch of PDFs or paste every laboratory link. The scanner reads, classifies, matches and prepares each certificate for one final review.</p></div><div class="p1coa-smart-shield"><span class="dashicons dashicons-shield-alt"></span><strong>Review first</strong><small>Nothing is published during scanning</small></div></header>';

        if (isset($_GET['smart_saved'])) {
            $created = isset($_GET['created']) ? absint($_GET['created']) : 0;
            $updated = isset($_GET['updated']) ? absint($_GET['updated']) : 0;
            $skipped = isset($_GET['skipped']) ? absint($_GET['skipped']) : 0;
            echo '<div class="notice notice-success is-dismissible"><p><strong>Smart Intake completed.</strong> ' . esc_html(sprintf('%d created, %d updated, %d skipped.', $created, $updated, $skipped)) . '</p></div>';
        }
        if (isset($_GET['smart_error']) && sanitize_key(wp_unslash($_GET['smart_error'])) === 'expired') {
            echo '<div class="notice notice-error"><p>The review session expired. Scan the documents again.</p></div>';
        }

        echo '<section class="p1coa-smart-flow"><div class="is-active"><b>01</b><span>Collect<br><small>PDFs + links</small></span></div><i></i><div class="' . ($rows ? 'is-active' : '') . '"><b>02</b><span>Detect<br><small>Data + family</small></span></div><i></i><div><b>03</b><span>Review<br><small>Human approval</small></span></div><i></i><div><b>04</b><span>Publish<br><small>Library + API</small></span></div></section>';

        if (!empty($errors)) {
            echo '<div class="p1coa-smart-errors"><strong>Some sources need attention</strong><ul>';
            foreach ($errors as $error) {
                echo '<li>' . esc_html($error) . '</li>';
            }
            echo '</ul></div>';
        }

        if (empty($rows)) {
            self::render_smart_upload_form();
        } else {
            self::render_smart_review($rows, $family_options);
        }

        echo '<script>' . self::smart_intake_script() . '</script>';
        echo '</div>';
    }

    private static function render_smart_upload_form() {
        echo '<form class="p1coa-smart-upload" method="post" action="' . esc_url(admin_url('admin-post.php')) . '" enctype="multipart/form-data" data-p1coa-scan-form data-ajax-url="' . esc_url(admin_url('admin-ajax.php')) . '" data-ajax-nonce="' . esc_attr(wp_create_nonce('p1coa_smart_scan_ajax')) . '" data-review-url="' . esc_url(self::smart_intake_url(['review' => '1'])) . '">';
        echo '<input type="hidden" name="action" value="p1coa_smart_scan">';
        wp_nonce_field('p1coa_smart_scan');
        echo '<div class="p1coa-smart-source-grid">';
        echo '<label class="p1coa-smart-drop" data-p1coa-drop><input type="file" name="p1coa_pdfs[]" accept="application/pdf,.pdf" multiple data-p1coa-files><span class="dashicons dashicons-cloud-upload"></span><strong>Drop all COA PDFs here</strong><small>or click to choose multiple files · up to ' . esc_html((string) self::SMART_MAX_ITEMS) . ' documents per scan</small><em data-p1coa-file-count>No PDFs selected</em></label>';
        echo '<div class="p1coa-smart-links"><span class="dashicons dashicons-admin-links"></span><strong>Paste laboratory or PDF links</strong><small>One per line. Direct PDFs and report pages are supported.</small><textarea name="p1coa_source_urls" rows="9" placeholder="https://lab.example/report/123&#10;https://example.com/coa.pdf"></textarea></div>';
        echo '</div>';
        echo '<div class="p1coa-smart-options"><label><input type="checkbox" name="p1coa_mark_current" value="1" checked> Suggest these as current shipping lots</label><span>The setting remains editable on every result before import.</span></div>';
        echo '<div class="p1coa-smart-submit"><div><strong>Multi-stage detection</strong><span>PDF text → built-in fallback → optional server OCR → family + WooCommerce matching</span></div><button type="submit" class="button button-primary button-hero" data-p1coa-scan-button><span class="dashicons dashicons-search"></span> Scan & classify batch</button></div>';
        echo '</form>';

        echo '<section class="p1coa-scan-live" data-p1coa-scan-live hidden aria-live="polite">';
        echo '<div class="p1coa-scan-live-card">';
        echo '<header><div><span class="p1coa-smart-kicker">LIVE DOCUMENT PIPELINE</span><h2 data-p1coa-live-title>Preparing intelligent scan…</h2><p data-p1coa-live-subtitle>Building the document queue.</p></div><div class="p1coa-live-counter"><strong data-p1coa-live-current>0</strong><span>/</span><b data-p1coa-live-total>0</b></div></header>';
        echo '<div class="p1coa-live-meter"><span data-p1coa-live-meter style="width:0%"></span></div>';
        echo '<div class="p1coa-live-layout">';
        echo '<div class="p1coa-live-current"><div class="p1coa-live-document"><span class="dashicons dashicons-pdf"></span><div><small>NOW PROCESSING</small><strong data-p1coa-live-document>Waiting for document…</strong></div><em data-p1coa-live-percent>0%</em></div>';
        echo '<div class="p1coa-live-stages">';
        foreach ([
            ['receive', 'cloud-upload', 'Receive PDF or link'],
            ['extract', 'media-text', 'Extract embedded document text'],
            ['visual', 'visibility', 'Read report header and identifiers'],
            ['detect', 'search', 'Detect COA values and testing data'],
            ['match', 'category', 'Match family and WooCommerce product'],
        ] as $stage) {
            echo '<div data-p1coa-live-stage="' . esc_attr($stage[0]) . '"><span class="dashicons dashicons-' . esc_attr($stage[1]) . '"></span><b>' . esc_html($stage[2]) . '</b><i></i></div>';
        }
        echo '</div></div>';
        echo '<aside class="p1coa-live-results"><div class="p1coa-live-results-head"><strong>Batch activity</strong><span data-p1coa-live-ready>0 ready</span></div><div class="p1coa-live-log" data-p1coa-live-log><p data-p1coa-live-empty>Results will appear here as each document finishes.</p></div></aside>';
        echo '</div>';
        echo '<footer><span data-p1coa-live-footer>Keep this page open while the scanner processes the queue.</span><a class="button button-primary button-hero" href="' . esc_url(self::smart_intake_url(['review' => '1'])) . '" data-p1coa-live-review hidden>Review detected COAs <span class="dashicons dashicons-arrow-right-alt"></span></a></footer>';
        echo '</div></section>';

        echo '<div class="p1coa-smart-capabilities"><article><span class="dashicons dashicons-media-document"></span><strong>Document intelligence</strong><small>Compound, strength, lot, COA number, purity, date, lab and testing methods.</small></article><article><span class="dashicons dashicons-category"></span><strong>Family memory</strong><small>Reuses your custom family names and keys instead of inventing duplicate groups.</small></article><article><span class="dashicons dashicons-cart"></span><strong>Store matching</strong><small>Finds the closest WooCommerce product and exact strength variation.</small></article><article><span class="dashicons dashicons-update"></span><strong>Duplicate protection</strong><small>Updates matching COA numbers and fingerprints instead of creating copies.</small></article></div>';
    }

    private static function render_smart_review($rows, $family_options) {
        $ready = count(array_filter($rows, function ($row) { return !empty($row['confidence']) && (int) $row['confidence'] >= 65; }));
        $needs_review = count($rows) - $ready;

        echo '<div class="p1coa-review-summary"><div><span>Scanned</span><strong>' . esc_html((string) count($rows)) . '</strong></div><div><span>High confidence</span><strong class="is-good">' . esc_html((string) $ready) . '</strong></div><div><span>Needs attention</span><strong class="is-warn">' . esc_html((string) $needs_review) . '</strong></div><div><span>Families detected</span><strong>' . esc_html((string) count(array_unique(array_filter(array_map(function ($row) { return isset($row['record']['familyKey']) ? $row['record']['familyKey'] : ''; }, $rows))))) . '</strong></div></div>';

        echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '" class="p1coa-review-form">';
        echo '<input type="hidden" name="action" value="p1coa_smart_commit">';
        wp_nonce_field('p1coa_smart_commit');
        echo '<datalist id="p1coa-family-options">';
        foreach ($family_options as $family) {
            echo '<option value="' . esc_attr($family['name']) . '" data-key="' . esc_attr($family['key']) . '">' . esc_html($family['key']) . '</option>';
        }
        echo '</datalist>';

        echo '<div class="p1coa-review-toolbar"><div><strong>Review every detected field</strong><span>Blue fields were inferred automatically. Correct anything uncertain before importing.</span></div><label><input type="checkbox" data-p1coa-select-all checked> Select all</label></div>';
        echo '<div class="p1coa-review-list">';
        foreach ($rows as $index => $row) {
            self::render_smart_review_row((int) $index, $row);
        }
        echo '</div>';

        echo '<div class="p1coa-review-final"><div><label><input type="checkbox" name="p1coa_save_as_draft" value="1"> Save selected records as drafts</label><small>Leave unchecked to publish them to the COA API immediately.</small></div><div class="p1coa-review-final-actions"><a href="' . esc_url(wp_nonce_url(admin_url('admin-post.php?action=p1coa_smart_clear'), 'p1coa_smart_clear')) . '" class="button">Discard review</a><button type="submit" class="button button-primary button-hero"><span class="dashicons dashicons-yes-alt"></span> Import selected COAs</button></div></div>';
        echo '</form>';
    }

    private static function render_smart_review_row($index, $row) {
        $record = isset($row['record']) && is_array($row['record']) ? $row['record'] : [];
        $value = function ($key, $default = '') use ($record) { return isset($record[$key]) ? $record[$key] : $default; };
        $confidence = isset($row['confidence']) ? absint($row['confidence']) : 0;
        $confidence_class = $confidence >= 80 ? 'is-high' : ($confidence >= 55 ? 'is-medium' : 'is-low');
        $warnings = isset($row['warnings']) && is_array($row['warnings']) ? $row['warnings'] : [];
        $existing_id = isset($row['existing_id']) ? absint($row['existing_id']) : 0;
        $source_label = isset($row['source_label']) ? (string) $row['source_label'] : 'COA source';
        $extractor = isset($row['extractor']) ? (string) $row['extractor'] : 'fallback';
        $panel_types = isset($record['panelTypes']) ? self::sanitize_panel_types($record['panelTypes']) : [];

        echo '<article class="p1coa-review-item ' . esc_attr($confidence_class) . '" data-p1coa-review-item>';
        echo '<header><label class="p1coa-review-select"><input type="checkbox" name="p1coa_rows[' . esc_attr((string) $index) . '][selected]" value="1" checked data-p1coa-row-select><span></span></label><div class="p1coa-review-file"><span class="dashicons dashicons-pdf"></span><div><strong>' . esc_html($source_label) . '</strong><small>' . esc_html(ucwords(str_replace('_', ' ', $extractor))) . ($existing_id ? ' · Will update record #' . esc_html((string) $existing_id) : ' · New record') . '</small></div></div><div class="p1coa-confidence"><span><i style="width:' . esc_attr((string) $confidence) . '%"></i></span><strong>' . esc_html((string) $confidence) . '% confidence</strong></div><button type="button" class="p1coa-review-toggle" data-p1coa-review-toggle aria-expanded="true"><span class="dashicons dashicons-arrow-up-alt2"></span></button></header>';
        echo '<div class="p1coa-review-body">';

        if ($warnings) {
            echo '<div class="p1coa-row-warnings">';
            foreach ($warnings as $warning) {
                echo '<span><i>!</i>' . esc_html($warning) . '</span>';
            }
            echo '</div>';
        }

        echo '<div class="p1coa-detected-grid">';
        self::smart_review_input($index, 'productName', 'Product name', $value('productName'), 'Retatrutide 10mg');
        self::smart_review_input($index, 'compound', 'Compound', $value('compound'), 'Retatrutide');
        self::smart_review_input($index, 'strength', 'Strength', $value('strength'), '10 mg');
        self::smart_review_input($index, 'familyName', 'Family name', $value('familyName'), 'R3TA', 'text', 'list="p1coa-family-options" data-p1coa-family-name');
        self::smart_review_input($index, 'familyKey', 'Family key', $value('familyKey'), 'retatrutide', 'text', 'data-p1coa-family-key');
        self::smart_review_input($index, 'batch', 'Batch / lot', $value('batch'), 'RT10-1025');
        self::smart_review_input($index, 'coaNumber', 'COA number', $value('coaNumber'), 'KVR-2026-...');
        self::smart_review_input($index, 'date', 'Certificate date', $value('date'), '', 'date');
        self::smart_review_input($index, 'purity', 'Purity', $value('purity'), '99.4%');
        self::smart_review_input($index, 'laboratory', 'Laboratory · fixed', self::OFFICIAL_LABORATORY, self::OFFICIAL_LABORATORY, 'text', 'readonly aria-readonly="true"');
        self::smart_review_input($index, 'method', 'Method', $value('method'), 'HPLC / LC-MS');
        self::smart_review_input($index, 'tested', 'Detected testing', $value('tested'), 'HPLC / MS');
        echo '</div>';

        echo '<div class="p1coa-review-match-row"><label><span>WooCommerce match</span>';
        self::smart_render_product_match_select($index, absint($value('matchedProductId', 0)), absint($value('matchedVariationId', 0)));
        echo '</label><div><span>Testing panels</span><div class="p1coa-review-panels">';
        foreach (['3x' => '3X', 'standard' => 'Standard', 'full' => 'Full', '8x' => '8X'] as $panel_key => $panel_label) {
            echo '<label><input type="checkbox" name="p1coa_rows[' . esc_attr((string) $index) . '][panelTypes][]" value="' . esc_attr($panel_key) . '" ' . checked(in_array($panel_key, $panel_types, true), true, false) . '>' . esc_html($panel_label) . '</label>';
        }
        echo '</div></div><label class="p1coa-current-switch"><input type="checkbox" name="p1coa_rows[' . esc_attr((string) $index) . '][currentShippingLot]" value="1" ' . checked(!empty($record['currentShippingLot']), true, false) . '><span></span><b>Current shipping lot</b></label></div>';

        echo '<div class="p1coa-review-source"><span><b>Source</b> ' . (empty($row['source_url']) ? 'Uploaded PDF' : '<a href="' . esc_url($row['source_url']) . '" target="_blank" rel="noopener">Open original</a>') . '</span><span><b>PDF</b> ' . (empty($record['fileUrl']) ? 'Not found' : '<a href="' . esc_url($record['fileUrl']) . '" target="_blank" rel="noopener">Open document</a>') . '</span><span><b>Text read</b> ' . esc_html(number_format_i18n(isset($row['text_length']) ? absint($row['text_length']) : 0)) . ' characters</span></div>';
        echo '</div></article>';
    }

    private static function smart_review_input($index, $key, $label, $value, $placeholder = '', $type = 'text', $extra = '') {
        echo '<label><span>' . esc_html($label) . '</span><input type="' . esc_attr($type) . '" name="p1coa_rows[' . esc_attr((string) $index) . '][' . esc_attr($key) . ']" value="' . esc_attr((string) $value) . '" placeholder="' . esc_attr($placeholder) . '" ' . $extra . '></label>';
    }

    private static function smart_render_product_match_select($index, $selected_product_id, $selected_variation_id) {
        echo '<select name="p1coa_rows[' . esc_attr((string) $index) . '][productMatch]">';
        echo '<option value="0:0">No product match</option>';
        foreach (self::get_product_matching_data() as $product) {
            $parent_value = absint($product['id']) . ':0';
            $selected = $selected_product_id === absint($product['id']) && !$selected_variation_id;
            echo '<option value="' . esc_attr($parent_value) . '" ' . selected($selected, true, false) . '>' . esc_html($product['name'] . (!empty($product['sku']) ? ' — ' . $product['sku'] : '')) . '</option>';
            foreach ((array) $product['variations'] as $variation) {
                $variation_value = absint($product['id']) . ':' . absint($variation['id']);
                $selected = $selected_variation_id === absint($variation['id']);
                echo '<option value="' . esc_attr($variation_value) . '" ' . selected($selected, true, false) . '>↳ ' . esc_html($variation['name'] . (!empty($variation['sku']) ? ' — ' . $variation['sku'] : '')) . '</option>';
            }
        }
        echo '</select>';
    }

    private static function smart_intake_styles() {
        return <<<'CSS'
.p1coa-smart{--bg:#07111f;--panel:#0b192a;--panel2:#0e2035;--line:rgba(145,194,245,.14);--blue:#66b8ff;--cyan:#7be7ff;--text:#edf7ff;--muted:#7890aa;max-width:1500px;margin:18px 20px 40px 0;color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.p1coa-smart *{box-sizing:border-box}.p1coa-smart a{text-decoration:none}.p1coa-smart-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:30px;overflow:hidden;padding:34px 38px;border:1px solid var(--line);border-radius:26px;background:radial-gradient(circle at 80% 0,rgba(61,156,255,.16),transparent 38%),linear-gradient(135deg,#071321,#0b1d32);box-shadow:0 25px 70px rgba(2,8,20,.18)}.p1coa-smart-hero:after{position:absolute;right:14%;bottom:-150px;width:310px;height:310px;border:1px solid rgba(105,190,255,.1);border-radius:50%;box-shadow:0 0 0 46px rgba(105,190,255,.025),0 0 0 92px rgba(105,190,255,.018);content:""}.p1coa-smart-kicker{display:block;margin-bottom:8px;color:#72bfff;font-size:9px;font-weight:900;letter-spacing:.2em}.p1coa-smart-hero h1{position:relative;z-index:1;margin:0;color:#fff;font-size:38px;line-height:1;letter-spacing:-.045em}.p1coa-smart-hero p{position:relative;z-index:1;max-width:760px;margin:12px 0 0;color:#8299b1;font-size:13px;line-height:1.7}.p1coa-smart-shield{position:relative;z-index:2;display:grid;min-width:230px;grid-template-columns:auto 1fr;align-items:center;gap:2px 12px;padding:16px 18px;border:1px solid rgba(105,224,183,.18);border-radius:17px;background:rgba(65,204,155,.065)}.p1coa-smart-shield>.dashicons{grid-row:1/3;width:34px;height:34px;color:#77e4bd;font-size:34px}.p1coa-smart-shield strong{color:#b6f2dd;font-size:11px}.p1coa-smart-shield small{color:#638b7f;font-size:9px}.p1coa-smart-flow{display:grid;grid-template-columns:auto 1fr auto 1fr auto 1fr auto;align-items:center;gap:12px;margin:16px 0;padding:15px 20px;border:1px solid var(--line);border-radius:18px;background:#091625}.p1coa-smart-flow>div{display:flex;align-items:center;gap:9px;color:#51667d}.p1coa-smart-flow>div b{display:grid;width:31px;height:31px;place-items:center;border:1px solid rgba(139,183,227,.12);border-radius:10px;background:rgba(255,255,255,.02);font-size:9px}.p1coa-smart-flow>div span{font-size:10px;font-weight:800;line-height:1.2}.p1coa-smart-flow>div small{color:#43566b;font-size:8px;font-weight:600}.p1coa-smart-flow>div.is-active{color:#bfe3ff}.p1coa-smart-flow>div.is-active b{border-color:rgba(103,193,255,.3);background:rgba(79,172,255,.12);color:#87caff}.p1coa-smart-flow>i{height:1px;background:linear-gradient(90deg,rgba(101,181,245,.16),rgba(101,181,245,.04))}.p1coa-smart-errors{margin:14px 0;padding:15px 18px;border:1px solid rgba(248,180,83,.22);border-radius:15px;background:rgba(245,158,11,.07);color:#d9ae72;font-size:11px}.p1coa-smart-errors strong{color:#ffd69a}.p1coa-smart-errors ul{margin:8px 0 0 18px}.p1coa-smart-upload{overflow:hidden;border:1px solid var(--line);border-radius:24px;background:linear-gradient(180deg,#0b192a,#081522);box-shadow:0 20px 55px rgba(1,7,17,.13)}.p1coa-smart-source-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;padding:20px}.p1coa-smart-drop,.p1coa-smart-links{position:relative;display:flex;min-height:280px;flex-direction:column;align-items:center;justify-content:center;padding:28px;border:1px dashed rgba(119,193,255,.25);border-radius:19px;background:radial-gradient(circle at 50% 20%,rgba(63,158,255,.075),transparent 50%),#091727;text-align:center}.p1coa-smart-drop{cursor:pointer;transition:.2s}.p1coa-smart-drop:hover,.p1coa-smart-drop.is-dragging{border-color:rgba(112,208,255,.65);background-color:#0b1b2d;transform:translateY(-1px)}.p1coa-smart-drop input{position:absolute;width:1px;height:1px;opacity:0}.p1coa-smart-drop>.dashicons,.p1coa-smart-links>.dashicons{width:47px;height:47px;margin-bottom:14px;color:#6bbcff;font-size:47px}.p1coa-smart-drop strong,.p1coa-smart-links strong{color:#f0f8ff;font-size:15px}.p1coa-smart-drop small,.p1coa-smart-links small{max-width:430px;margin-top:7px;color:#687f98;font-size:10px;line-height:1.55}.p1coa-smart-drop em{margin-top:18px;padding:7px 10px;border:1px solid rgba(111,188,249,.14);border-radius:99px;background:rgba(100,180,245,.07);color:#89bfe9;font-size:9px;font-style:normal;font-weight:800}.p1coa-smart-links{justify-content:flex-start}.p1coa-smart-links textarea{width:100%;min-height:120px;margin-top:16px;padding:13px;border:1px solid rgba(141,190,238,.15);border-radius:13px;background:#06111e;color:#dff2ff;box-shadow:none;font:10px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical}.p1coa-smart-links textarea:focus{border-color:rgba(100,196,255,.45);box-shadow:0 0 0 3px rgba(70,158,245,.08);outline:0}.p1coa-smart-options{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 22px;border-top:1px solid var(--line);background:rgba(255,255,255,.015);color:#8195aa;font-size:10px}.p1coa-smart-options label{color:#bdd8ed;font-weight:800}.p1coa-smart-options input{margin-right:6px}.p1coa-smart-submit{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 22px;border-top:1px solid var(--line)}.p1coa-smart-submit>div{display:grid;gap:3px}.p1coa-smart-submit strong{color:#dcecff;font-size:11px}.p1coa-smart-submit span{color:#5e748b;font-size:9px}.p1coa-smart .button-hero{display:inline-flex;min-height:46px;align-items:center;justify-content:center;gap:8px;padding:0 20px;border:1px solid #4da8ed;border-radius:13px;background:linear-gradient(135deg,#2d86dc,#31a7d9);box-shadow:0 12px 28px rgba(40,139,217,.2);color:#fff;font-size:10px;font-weight:900;letter-spacing:.04em;text-shadow:none}.p1coa-smart .button-hero:hover{border-color:#74c8ff;background:linear-gradient(135deg,#3494ea,#39b7e9);color:#fff}.p1coa-smart .button-hero .dashicons{width:15px;height:15px;font-size:15px}.p1coa-smart-capabilities{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.p1coa-smart-capabilities article{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;padding:15px;border:1px solid var(--line);border-radius:15px;background:#091625}.p1coa-smart-capabilities .dashicons{grid-row:1/3;color:#66b9f7}.p1coa-smart-capabilities strong{color:#cfe6f8;font-size:10px}.p1coa-smart-capabilities small{color:#5f7389;font-size:9px;line-height:1.45}.p1coa-review-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}.p1coa-review-summary>div{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border:1px solid var(--line);border-radius:15px;background:#091625}.p1coa-review-summary span{color:#687d92;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.p1coa-review-summary strong{color:#ecf7ff;font-size:22px}.p1coa-review-summary strong.is-good{color:#6fe0b0}.p1coa-review-summary strong.is-warn{color:#f3bc70}.p1coa-review-form{overflow:hidden;border:1px solid var(--line);border-radius:22px;background:#081522}.p1coa-review-toolbar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 20px;border-bottom:1px solid var(--line);background:#0b1929}.p1coa-review-toolbar>div{display:grid;gap:3px}.p1coa-review-toolbar strong{color:#e8f5ff;font-size:12px}.p1coa-review-toolbar span{color:#667d94;font-size:9px}.p1coa-review-toolbar label{color:#a9c7df;font-size:10px;font-weight:800}.p1coa-review-list{display:grid;gap:10px;padding:12px}.p1coa-review-item{overflow:hidden;border:1px solid var(--line);border-left:3px solid #f0b85f;border-radius:16px;background:#0a1827}.p1coa-review-item.is-high{border-left-color:#59d5a3}.p1coa-review-item.is-medium{border-left-color:#69bfff}.p1coa-review-item>header{display:grid;grid-template-columns:auto minmax(240px,1fr) minmax(180px,260px) auto;align-items:center;gap:12px;min-height:70px;padding:11px 14px;background:rgba(255,255,255,.012)}.p1coa-review-select{position:relative;display:block;width:20px;height:20px}.p1coa-review-select input{position:absolute;opacity:0}.p1coa-review-select span{display:grid;width:20px;height:20px;place-items:center;border:1px solid rgba(135,186,232,.25);border-radius:7px;background:#071321}.p1coa-review-select input:checked+span{border-color:#4ea9ed;background:#318bd4}.p1coa-review-select input:checked+span:after{color:#fff;content:"✓";font-size:12px;font-weight:900}.p1coa-review-file{display:flex;min-width:0;align-items:center;gap:11px}.p1coa-review-file>.dashicons{display:grid;width:38px;height:38px;flex:0 0 38px;place-items:center;border:1px solid rgba(102,184,246,.16);border-radius:11px;background:rgba(92,171,239,.08);color:#83c7fb;font-size:18px}.p1coa-review-file>div{display:grid;min-width:0;gap:3px}.p1coa-review-file strong{overflow:hidden;color:#e8f5ff;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.p1coa-review-file small{color:#60778e;font-size:9px}.p1coa-confidence{display:grid;grid-template-columns:minmax(90px,1fr) auto;align-items:center;gap:9px}.p1coa-confidence>span{overflow:hidden;height:5px;border-radius:99px;background:rgba(255,255,255,.06)}.p1coa-confidence i{display:block;height:100%;border-radius:inherit;background:#eab45b}.is-high .p1coa-confidence i{background:#58d5a2}.is-medium .p1coa-confidence i{background:#64b9f4}.p1coa-confidence strong{color:#7891a9;font-size:8px;white-space:nowrap}.p1coa-review-toggle{display:grid;width:34px;height:34px;place-items:center;border:1px solid rgba(130,183,229,.12);border-radius:10px;background:rgba(255,255,255,.025);color:#7790a8;cursor:pointer}.p1coa-review-item.is-collapsed .p1coa-review-body{display:none}.p1coa-review-item.is-collapsed .p1coa-review-toggle .dashicons{transform:rotate(180deg)}.p1coa-review-body{padding:14px;border-top:1px solid var(--line)}.p1coa-row-warnings{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}.p1coa-row-warnings span{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border:1px solid rgba(239,179,89,.16);border-radius:9px;background:rgba(234,166,62,.055);color:#c99b5e;font-size:8px;font-weight:750}.p1coa-row-warnings i{display:grid;width:14px;height:14px;place-items:center;border-radius:50%;background:#ca8b36;color:#fff;font-size:8px;font-style:normal}.p1coa-detected-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.p1coa-detected-grid label,.p1coa-review-match-row>label,.p1coa-review-match-row>div{display:grid;min-width:0;gap:5px}.p1coa-detected-grid label>span,.p1coa-review-match-row label>span,.p1coa-review-match-row>div>span{color:#72879c;font-size:8px;font-weight:850;letter-spacing:.045em;text-transform:uppercase}.p1coa-detected-grid input,.p1coa-review-match-row select{width:100%;min-height:39px;margin:0;padding:0 10px;border:1px solid rgba(126,181,229,.15);border-radius:10px;background:#071421;color:#dff1ff;box-shadow:none;font-size:10px}.p1coa-detected-grid input:focus,.p1coa-review-match-row select:focus{border-color:rgba(103,192,255,.5);box-shadow:0 0 0 3px rgba(83,173,244,.08);outline:0}.p1coa-review-match-row{display:grid;grid-template-columns:minmax(240px,1.15fr) minmax(250px,1fr) auto;align-items:end;gap:12px;margin-top:12px;padding:12px;border:1px solid rgba(132,185,230,.09);border-radius:13px;background:rgba(255,255,255,.012)}.p1coa-review-panels{display:flex;min-height:39px;align-items:center;flex-wrap:wrap;gap:6px}.p1coa-review-panels label{display:flex;min-height:31px;align-items:center;gap:5px;padding:0 8px;border:1px solid rgba(129,183,230,.12);border-radius:8px;background:#071421;color:#85a0b7;font-size:8px;font-weight:800}.p1coa-current-switch{display:flex!important;min-height:39px;grid-template-columns:auto 1fr;align-items:center;gap:8px!important;padding:0 10px;border:1px solid rgba(89,215,166,.13);border-radius:10px;background:rgba(77,202,154,.04)}.p1coa-current-switch input{display:none}.p1coa-current-switch>span{position:relative;width:29px;height:16px;border-radius:99px;background:#33475b}.p1coa-current-switch>span:after{position:absolute;top:3px;left:3px;width:10px;height:10px;border-radius:50%;background:#93a5b6;content:"";transition:.18s}.p1coa-current-switch input:checked+span{background:#277d62}.p1coa-current-switch input:checked+span:after{left:16px;background:#78edc0}.p1coa-current-switch b{color:#86b9a7;font-size:8px;white-space:nowrap}.p1coa-review-source{display:flex;flex-wrap:wrap;gap:16px;margin-top:11px;color:#5d738a;font-size:8px}.p1coa-review-source b{color:#8299af}.p1coa-review-source a{color:#73baf0}.p1coa-review-final{position:sticky;bottom:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 18px;border-top:1px solid var(--line);background:rgba(9,22,37,.97);box-shadow:0 -15px 35px rgba(1,7,17,.2)}.p1coa-review-final>div:first-child{display:grid;gap:3px}.p1coa-review-final label{color:#b7cede;font-size:10px;font-weight:800}.p1coa-review-final small{color:#5e7389;font-size:8px}.p1coa-review-final-actions{display:flex;gap:8px}.p1coa-review-final .button:not(.button-primary){display:inline-flex;min-height:46px;align-items:center;padding:0 16px;border-color:rgba(133,184,229,.16);border-radius:12px;background:#0c1b2c;color:#8ba2b7}
.p1coa-scan-live[hidden]{display:none}.p1coa-scan-live{position:fixed;z-index:100000;inset:0;display:grid;place-items:center;padding:30px;background:rgba(1,7,15,.84);backdrop-filter:blur(9px)}.p1coa-scan-live-card{display:grid;width:min(1160px,100%);max-height:calc(100vh - 60px);overflow:hidden;border:1px solid rgba(122,198,255,.25);border-radius:26px;background:radial-gradient(circle at 78% 0,rgba(50,153,247,.15),transparent 34%),linear-gradient(145deg,#091827,#06111e);box-shadow:0 40px 120px rgba(0,0,0,.48)}.p1coa-scan-live-card>header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:25px 28px 20px}.p1coa-scan-live-card h2{margin:0;color:#f3f9ff;font-size:24px;letter-spacing:-.035em}.p1coa-scan-live-card header p{margin:6px 0 0;color:#6d849b;font-size:10px}.p1coa-live-counter{display:flex;align-items:baseline;gap:5px;color:#5d7389}.p1coa-live-counter strong{color:#7bc7ff;font-size:34px;line-height:1}.p1coa-live-counter span{font-size:16px}.p1coa-live-counter b{color:#aac3d8;font-size:17px}.p1coa-live-meter{height:4px;background:rgba(255,255,255,.055)}.p1coa-live-meter>span{display:block;height:100%;background:linear-gradient(90deg,#3b8ee8,#65d8f6,#65dfa9);box-shadow:0 0 18px rgba(91,199,247,.45);transition:width .35s ease}.p1coa-live-layout{display:grid;min-height:390px;grid-template-columns:1.05fr .95fr;overflow:auto;border-bottom:1px solid rgba(140,190,235,.1)}.p1coa-live-current{padding:24px 28px;border-right:1px solid rgba(140,190,235,.1)}.p1coa-live-document{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:13px;padding:14px;border:1px solid rgba(116,191,250,.14);border-radius:16px;background:rgba(76,162,232,.05)}.p1coa-live-document>.dashicons{display:grid;width:39px;height:39px;place-items:center;border-radius:11px;background:rgba(87,175,242,.1);color:#82c8fa;font-size:20px}.p1coa-live-document>div{display:grid;min-width:0;gap:3px}.p1coa-live-document small{color:#53708c;font-size:7px;font-weight:900;letter-spacing:.16em}.p1coa-live-document strong{overflow:hidden;color:#dceefa;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.p1coa-live-document em{color:#75c8ff;font-size:15px;font-style:normal;font-weight:900}.p1coa-live-stages{display:grid;gap:7px;margin-top:15px}.p1coa-live-stages>div{display:grid;min-height:51px;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:0 14px;border:1px solid rgba(131,182,226,.08);border-radius:13px;background:rgba(255,255,255,.012);color:#556d85;transition:.2s}.p1coa-live-stages .dashicons{display:grid;width:29px;height:29px;place-items:center;border-radius:9px;background:rgba(255,255,255,.025);font-size:14px}.p1coa-live-stages b{font-size:9px}.p1coa-live-stages i{width:8px;height:8px;border-radius:50%;background:#314357}.p1coa-live-stages>div.is-active{border-color:rgba(95,188,251,.27);background:rgba(67,157,229,.07);color:#b9ddf6;box-shadow:0 8px 24px rgba(1,8,18,.12)}.p1coa-live-stages>div.is-active i{border:2px solid rgba(100,197,255,.25);background:#64c4ff;box-shadow:0 0 0 5px rgba(100,196,255,.08),0 0 15px rgba(100,196,255,.55);animation:p1coaLivePulse 1.1s ease-in-out infinite}.p1coa-live-stages>div.is-complete{color:#80bba7}.p1coa-live-stages>div.is-complete .dashicons{background:rgba(72,205,155,.08);color:#6bdcaf}.p1coa-live-stages>div.is-complete i{background:#61d7a8;box-shadow:0 0 10px rgba(97,215,168,.5)}.p1coa-live-results{display:grid;min-width:0;grid-template-rows:auto 1fr;padding:24px}.p1coa-live-results-head{display:flex;align-items:center;justify-content:space-between;padding:0 2px 12px}.p1coa-live-results-head strong{color:#cfe2f1;font-size:10px}.p1coa-live-results-head span{padding:5px 8px;border-radius:99px;background:rgba(74,200,151,.07);color:#75c5a8;font-size:8px;font-weight:850}.p1coa-live-log{display:grid;align-content:start;gap:8px;max-height:340px;overflow:auto;padding-right:4px}.p1coa-live-log>p{margin:30px 0;color:#50677d;font-size:9px;line-height:1.6;text-align:center}.p1coa-live-log-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px;border:1px solid rgba(130,183,229,.09);border-radius:12px;background:rgba(255,255,255,.015)}.p1coa-live-log-row>i{display:grid;width:28px;height:28px;place-items:center;border-radius:9px;background:rgba(81,202,156,.08);color:#67d6aa;font-size:13px;font-style:normal;font-weight:900}.p1coa-live-log-row.is-error>i{background:rgba(241,169,70,.08);color:#efb25f}.p1coa-live-log-row>div{display:grid;min-width:0;gap:3px}.p1coa-live-log-row strong{overflow:hidden;color:#d5e8f7;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.p1coa-live-log-row small{overflow:hidden;color:#627a91;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.p1coa-live-log-row>b{color:#7090a8;font-size:8px}.p1coa-scan-live-card>footer{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:17px 24px}.p1coa-scan-live-card>footer>span{color:#60768c;font-size:9px}.p1coa-scan-live-card>footer .button[hidden]{display:none}@keyframes p1coaLivePulse{50%{opacity:.55;transform:scale(.82)}}
@media(max-width:1150px){.p1coa-detected-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.p1coa-smart-capabilities{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-review-match-row{grid-template-columns:1fr 1fr}.p1coa-current-switch{grid-column:1/3}}
@media(max-width:782px){.p1coa-smart{margin-right:10px}.p1coa-smart-hero{align-items:flex-start;flex-direction:column;padding:25px}.p1coa-smart-hero h1{font-size:31px}.p1coa-smart-shield{min-width:0;width:100%}.p1coa-smart-flow{grid-template-columns:1fr 1fr}.p1coa-smart-flow>i{display:none}.p1coa-smart-source-grid{grid-template-columns:1fr}.p1coa-smart-options,.p1coa-smart-submit{align-items:flex-start;flex-direction:column}.p1coa-smart-submit .button{width:100%}.p1coa-review-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-review-item>header{grid-template-columns:auto 1fr auto}.p1coa-confidence{grid-column:2/3}.p1coa-review-toggle{grid-column:3;grid-row:1/3}.p1coa-detected-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.p1coa-review-final{align-items:flex-start;flex-direction:column}.p1coa-review-final-actions{width:100%}.p1coa-review-final-actions>*{flex:1}.p1coa-review-toolbar{align-items:flex-start;flex-direction:column}.p1coa-scan-live{padding:12px}.p1coa-scan-live-card{max-height:calc(100vh - 24px)}.p1coa-scan-live-card>header{padding:19px}.p1coa-scan-live-card h2{font-size:19px}.p1coa-live-layout{grid-template-columns:1fr}.p1coa-live-current{padding:16px;border-right:0;border-bottom:1px solid rgba(140,190,235,.1)}.p1coa-live-results{padding:16px}.p1coa-scan-live-card>footer{align-items:flex-start;flex-direction:column}.p1coa-scan-live-card>footer .button{width:100%}}
@media(max-width:520px){.p1coa-smart-capabilities{grid-template-columns:1fr}.p1coa-detected-grid,.p1coa-review-match-row{grid-template-columns:1fr}.p1coa-current-switch{grid-column:auto}.p1coa-review-summary>div{padding:12px}.p1coa-review-summary strong{font-size:18px}.p1coa-review-item>header{gap:8px}.p1coa-review-file>.dashicons{display:none}.p1coa-review-final-actions{flex-direction:column}.p1coa-review-final-actions>*{width:100%}}
CSS;
    }

    private static function smart_intake_script() {
        return <<<'JS'
(function(){
  var root=document.querySelector('[data-p1coa-smart]');if(!root)return;
  var input=root.querySelector('[data-p1coa-files]'),drop=root.querySelector('[data-p1coa-drop]'),count=root.querySelector('[data-p1coa-file-count]');
  function updateCount(){if(!input||!count)return;var n=input.files?input.files.length:0;count.textContent=n?n+' PDF'+(n===1?'':'s')+' selected':'No PDFs selected';}
  if(input){input.addEventListener('change',updateCount);}
  if(drop){['dragenter','dragover'].forEach(function(e){drop.addEventListener(e,function(ev){ev.preventDefault();drop.classList.add('is-dragging');});});['dragleave','drop'].forEach(function(e){drop.addEventListener(e,function(){drop.classList.remove('is-dragging');});});drop.addEventListener('drop',function(ev){ev.preventDefault();if(input&&ev.dataTransfer&&ev.dataTransfer.files){input.files=ev.dataTransfer.files;updateCount();}});}
  var form=root.querySelector('[data-p1coa-scan-form]'),scan=root.querySelector('[data-p1coa-scan-button]');
  function p1Text(el,value){if(el)el.textContent=value;}
  function p1Request(url,data){return fetch(url,{method:'POST',credentials:'same-origin',body:data}).then(function(response){return response.json().catch(function(){throw new Error('WordPress returned an unreadable response.');});}).then(function(json){if(!json||!json.success)throw new Error(json&&json.data&&json.data.message?json.data.message:'The scanner request failed.');return json.data||{};});}
  if(form&&scan&&window.fetch&&window.FormData){form.addEventListener('submit',function(event){
    event.preventDefault();
    var files=input&&input.files?Array.prototype.slice.call(input.files):[];
    var textarea=form.querySelector('textarea[name="p1coa_source_urls"]');
    var urls=(textarea?textarea.value:'').split(/[\r\n,]+/).map(function(url){return url.trim();}).filter(function(url,index,array){return url&&array.indexOf(url)===index;});
    var queue=files.map(function(file){return {kind:'file',label:file.name,file:file};}).concat(urls.map(function(url){return {kind:'url',label:url,url:url};}));
    if(!queue.length){window.alert('Choose at least one PDF or paste one laboratory link.');return;}
    if(queue.length>40){window.alert('Smart Intake accepts up to 40 sources per batch.');return;}

    var ajaxUrl=form.getAttribute('data-ajax-url'),nonce=form.getAttribute('data-ajax-nonce'),reviewUrl=form.getAttribute('data-review-url');
    var live=root.querySelector('[data-p1coa-scan-live]'),title=root.querySelector('[data-p1coa-live-title]'),subtitle=root.querySelector('[data-p1coa-live-subtitle]'),current=root.querySelector('[data-p1coa-live-current]'),total=root.querySelector('[data-p1coa-live-total]'),meter=root.querySelector('[data-p1coa-live-meter]'),documentName=root.querySelector('[data-p1coa-live-document]'),percent=root.querySelector('[data-p1coa-live-percent]'),ready=root.querySelector('[data-p1coa-live-ready]'),log=root.querySelector('[data-p1coa-live-log]'),empty=root.querySelector('[data-p1coa-live-empty]'),footer=root.querySelector('[data-p1coa-live-footer]'),review=root.querySelector('[data-p1coa-live-review]');
    var stages=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-live-stage]'));
    function stageAt(position,completeAll){stages.forEach(function(stage,index){stage.classList.toggle('is-active',!completeAll&&index===position);stage.classList.toggle('is-complete',completeAll||index<position);});}
    function paintProgress(value){var safe=Math.max(0,Math.min(100,value));if(meter)meter.style.width=safe.toFixed(2)+'%';p1Text(percent,String(Math.round(safe))+'%');}
    function finishProgress(state,target){return new Promise(function(resolve){var from=state.value,started=Date.now(),duration=420;function frame(){var elapsed=Math.min(1,(Date.now()-started)/duration),eased=1-Math.pow(1-elapsed,3);state.value=from+((target-from)*eased);paintProgress(state.value);if(elapsed<1){window.requestAnimationFrame(frame);}else{state.value=target;paintProgress(target);resolve();}}window.requestAnimationFrame(frame);});}
    function addLog(data){if(empty)empty.remove();var row=document.createElement('div');row.className='p1coa-live-log-row'+(data.itemStatus==='error'?' is-error':'');var icon=document.createElement('i');icon.textContent=data.itemStatus==='error'?'!':'✓';var copy=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small'),score=document.createElement('b');strong.textContent=data.label||'COA document';small.textContent=data.itemStatus==='error'?(data.message||'Could not scan'):[data.compound,data.strength,data.laboratory].filter(Boolean).join(' · ')||'Ready for review';score.textContent=data.itemStatus==='error'?'Error':String(data.confidence||0)+'%';copy.appendChild(strong);copy.appendChild(small);row.appendChild(icon);row.appendChild(copy);row.appendChild(score);log.appendChild(row);log.scrollTop=log.scrollHeight;}

    scan.disabled=true;live.hidden=false;document.body.style.overflow='hidden';p1Text(total,String(queue.length));p1Text(title,'Initializing intelligent scan…');p1Text(subtitle,'Creating a protected review session for this batch.');
    var reset=new FormData();reset.append('action','p1coa_smart_scan_reset');reset.append('nonce',nonce);
    p1Request(ajaxUrl,reset).then(async function(){
      var readyCount=0;
      for(var index=0;index<queue.length;index++){
        var item=queue[index],position=0;
        p1Text(current,String(index+1));p1Text(documentName,item.label);p1Text(title,'Scanning document '+String(index+1)+' of '+String(queue.length));p1Text(subtitle,item.kind==='file'?'Uploading PDF and opening its document structure.':'Opening laboratory report link and locating its PDF.');
        var startPercent=(index/queue.length)*100,finishedPercent=((index+1)/queue.length)*100,progressState={value:startPercent},progressCeiling=startPercent+((finishedPercent-startPercent)*.94);paintProgress(startPercent);stageAt(0,false);
        var progressTimer=window.setInterval(function(){var distance=progressCeiling-progressState.value;if(distance<=0)return;progressState.value=Math.min(progressCeiling,progressState.value+Math.max(.08,distance*.055));paintProgress(progressState.value);},160);
        var stageTimer=window.setInterval(function(){position=Math.min(position+1,stages.length-1);stageAt(position,false);var messages=['Receiving source…','Extracting embedded text…','Reading report header and identifiers…','Detecting compound, lot and purity…','Matching family and store product…'];p1Text(subtitle,messages[position]);},1100);
        var payload=new FormData();payload.append('action','p1coa_smart_scan_item');payload.append('nonce',nonce);payload.append('kind',item.kind);payload.append('mark_current',form.querySelector('[name="p1coa_mark_current"]:checked')?'1':'0');if(item.kind==='file')payload.append('p1coa_pdf',item.file,item.file.name);else payload.append('source_url',item.url);
        try{var data=await p1Request(ajaxUrl,payload);window.clearInterval(stageTimer);window.clearInterval(progressTimer);stageAt(stages.length-1,true);addLog(data);if(data.itemStatus==='ready')readyCount++;p1Text(ready,String(readyCount)+' ready');}
        catch(error){window.clearInterval(stageTimer);window.clearInterval(progressTimer);stageAt(stages.length-1,true);addLog({itemStatus:'error',label:item.label,message:error.message});}
        await finishProgress(progressState,finishedPercent);
      }
      p1Text(title,'Batch scan complete');p1Text(subtitle,'Every available result is ready for human review.');p1Text(documentName,'All documents processed');p1Text(footer,'Review the detected fields before publishing anything to the COA library.');stageAt(stages.length-1,true);review.href=reviewUrl;review.hidden=false;scan.disabled=false;
    }).catch(function(error){p1Text(title,'The scan could not start');p1Text(subtitle,error.message);p1Text(footer,'Reload the page and try the batch again.');scan.disabled=false;review.href=reviewUrl;review.hidden=false;});
  });}
  var all=root.querySelector('[data-p1coa-select-all]');var selects=Array.prototype.slice.call(root.querySelectorAll('[data-p1coa-row-select]'));if(all){all.addEventListener('change',function(){selects.forEach(function(box){box.checked=all.checked;});});selects.forEach(function(box){box.addEventListener('change',function(){all.checked=selects.every(function(item){return item.checked;});});});}
  root.querySelectorAll('[data-p1coa-review-toggle]').forEach(function(button){button.addEventListener('click',function(){var item=button.closest('[data-p1coa-review-item]');if(!item)return;var collapsed=item.classList.toggle('is-collapsed');button.setAttribute('aria-expanded',collapsed?'false':'true');});});
  root.querySelectorAll('[data-p1coa-review-item]').forEach(function(item){var name=item.querySelector('[data-p1coa-family-name]'),key=item.querySelector('[data-p1coa-family-key]');if(!name||!key)return;name.addEventListener('input',function(){if(key.dataset.manual==='1')return;key.value=name.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');});name.addEventListener('change',function(){var options=Array.prototype.slice.call(document.querySelectorAll('#p1coa-family-options option')),match=options.find(function(option){return option.value.toLowerCase()===name.value.toLowerCase();});if(match&&match.dataset.key){key.value=match.dataset.key;key.dataset.manual='1';}});key.addEventListener('input',function(){key.dataset.manual='1';});});
})();
JS;
    }

    private static function smart_normalize_uploaded_files($input) {
        if (!is_array($input) || empty($input['name'])) {
            return [];
        }

        if (!is_array($input['name'])) {
            return [$input];
        }

        $files = [];
        foreach ($input['name'] as $index => $name) {
            $error = isset($input['error'][$index]) ? (int) $input['error'][$index] : UPLOAD_ERR_NO_FILE;
            if ($error === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            $files[] = [
                'name' => $name,
                'type' => isset($input['type'][$index]) ? $input['type'][$index] : '',
                'tmp_name' => isset($input['tmp_name'][$index]) ? $input['tmp_name'][$index] : '',
                'error' => $error,
                'size' => isset($input['size'][$index]) ? (int) $input['size'][$index] : 0,
            ];
        }
        return $files;
    }

    private static function smart_ingest_uploaded_pdf($file, $mark_current) {
        if (!is_array($file) || !isset($file['error']) || (int) $file['error'] !== UPLOAD_ERR_OK) {
            return new WP_Error('p1coa_smart_upload', 'The PDF upload did not complete successfully.');
        }

        $name = sanitize_file_name(isset($file['name']) ? (string) $file['name'] : 'coa.pdf');
        if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== 'pdf') {
            return new WP_Error('p1coa_smart_type', 'Only PDF documents are accepted.');
        }
        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return new WP_Error('p1coa_smart_upload', 'WordPress could not read the uploaded file.');
        }
        if (!empty($file['size']) && (int) $file['size'] > self::SMART_MAX_FILE_BYTES) {
            return new WP_Error('p1coa_smart_size', 'The PDF is larger than 25 MB.');
        }
        $signature = file_get_contents($file['tmp_name'], false, null, 0, 5);
        if ($signature !== '%PDF-') {
            return new WP_Error('p1coa_smart_type', 'The uploaded file has a .pdf name but is not a valid PDF document.');
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $attachment_id = media_handle_sideload([
            'name' => $name,
            'tmp_name' => $file['tmp_name'],
        ], 0, 'COA document imported by Smart Intake');

        if (is_wp_error($attachment_id)) {
            return $attachment_id;
        }

        return self::smart_analyze_attachment($attachment_id, $name, '', $mark_current, 'upload');
    }

    private static function smart_ingest_remote_source($raw_url, $mark_current) {
        $url = esc_url_raw(trim((string) $raw_url));
        if ($url === '' || !wp_http_validate_url($url)) {
            return new WP_Error('p1coa_smart_url', 'The source is not a valid public HTTP/HTTPS URL.');
        }

        $response = wp_safe_remote_get($url, [
            'timeout' => 25,
            'redirection' => 3,
            'user-agent' => 'Phase-One-COA-Manager/' . self::VERSION . '; ' . home_url('/'),
            'limit_response_size' => self::SMART_MAX_FILE_BYTES + 1024,
        ]);
        if (is_wp_error($response)) {
            return new WP_Error('p1coa_smart_fetch', $response->get_error_message());
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        if ($code < 200 || $code >= 300) {
            return new WP_Error('p1coa_smart_http', 'The source returned HTTP ' . $code . '.');
        }

        $body = (string) wp_remote_retrieve_body($response);
        $content_type = strtolower((string) wp_remote_retrieve_header($response, 'content-type'));
        $looks_pdf = strpos($content_type, 'application/pdf') !== false || strncmp(ltrim($body), '%PDF-', 5) === 0;

        if ($looks_pdf) {
            $filename = self::smart_filename_from_url($url);
            $attachment_id = self::smart_sideload_pdf_body($body, $filename);
            if (is_wp_error($attachment_id)) {
                return $attachment_id;
            }
            return self::smart_analyze_attachment($attachment_id, $filename, $url, $mark_current, 'remote_pdf');
        }

        $pdf_url = self::smart_find_pdf_in_html($body, $url);
        if ($pdf_url) {
            $pdf_response = wp_safe_remote_get($pdf_url, [
                'timeout' => 25,
                'redirection' => 3,
                'user-agent' => 'Phase-One-COA-Manager/' . self::VERSION . '; ' . home_url('/'),
                'limit_response_size' => self::SMART_MAX_FILE_BYTES + 1024,
            ]);
            if (!is_wp_error($pdf_response) && (int) wp_remote_retrieve_response_code($pdf_response) >= 200 && (int) wp_remote_retrieve_response_code($pdf_response) < 300) {
                $pdf_body = (string) wp_remote_retrieve_body($pdf_response);
                $pdf_type = strtolower((string) wp_remote_retrieve_header($pdf_response, 'content-type'));
                if (strpos($pdf_type, 'application/pdf') !== false || strncmp(ltrim($pdf_body), '%PDF-', 5) === 0) {
                    $filename = self::smart_filename_from_url($pdf_url);
                    $attachment_id = self::smart_sideload_pdf_body($pdf_body, $filename);
                    if (!is_wp_error($attachment_id)) {
                        return self::smart_analyze_attachment($attachment_id, $filename, $url, $mark_current, 'report_page');
                    }
                }
            }
        }

        $page_text = self::smart_clean_extracted_text(wp_strip_all_tags(preg_replace('/<(script|style)\b[^>]*>.*?<\/\1>/is', ' ', $body)));
        if (strlen($page_text) < 30) {
            return new WP_Error('p1coa_smart_no_document', 'No readable report data or PDF was found on the page.');
        }

        return self::smart_detect_coa($page_text, self::smart_filename_from_url($url), $url, '', 0, 'report_page_text', $mark_current);
    }

    private static function smart_sideload_pdf_body($body, $filename) {
        if ($body === '' || strlen($body) > self::SMART_MAX_FILE_BYTES) {
            return new WP_Error('p1coa_smart_size', 'The remote PDF is empty or larger than 25 MB.');
        }
        if (strncmp(ltrim($body), '%PDF-', 5) !== 0) {
            return new WP_Error('p1coa_smart_type', 'The remote file is not a valid PDF.');
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $tmp = wp_tempnam($filename);
        if (!$tmp || file_put_contents($tmp, $body) === false) {
            return new WP_Error('p1coa_smart_temp', 'WordPress could not create a temporary PDF file.');
        }

        $attachment_id = media_handle_sideload([
            'name' => sanitize_file_name($filename),
            'tmp_name' => $tmp,
        ], 0, 'COA document imported from a laboratory link');

        if (is_wp_error($attachment_id) && file_exists($tmp)) {
            unlink($tmp);
        }
        return $attachment_id;
    }

    private static function smart_filename_from_url($url) {
        $path = (string) wp_parse_url($url, PHP_URL_PATH);
        $name = sanitize_file_name(basename($path));
        if ($name === '' || $name === '.' || $name === '/') {
            $name = 'coa-' . substr(sha1((string) $url), 0, 10) . '.pdf';
        }
        if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) !== 'pdf') {
            $name = pathinfo($name, PATHINFO_FILENAME) . '.pdf';
        }
        return $name;
    }

    private static function smart_find_pdf_in_html($html, $base_url) {
        $candidates = [];
        if (preg_match_all('~(?:href|src|data)\s*=\s*["\']([^"\']+)["\']~i', (string) $html, $matches)) {
            foreach ($matches[1] as $candidate) {
                $decoded = html_entity_decode(trim((string) $candidate), ENT_QUOTES, 'UTF-8');
                if (stripos($decoded, '.pdf') === false && stripos($decoded, 'download') === false) {
                    continue;
                }
                $absolute = self::smart_absolute_url($decoded, $base_url);
                if ($absolute && wp_http_validate_url($absolute)) {
                    $candidates[] = $absolute;
                }
            }
        }
        return !empty($candidates) ? $candidates[0] : '';
    }

    private static function smart_absolute_url($candidate, $base_url) {
        if (preg_match('~^https?://~i', $candidate)) {
            return esc_url_raw($candidate);
        }
        if (strpos($candidate, '//') === 0) {
            $scheme = (string) wp_parse_url($base_url, PHP_URL_SCHEME);
            return esc_url_raw(($scheme ?: 'https') . ':' . $candidate);
        }

        $scheme = (string) wp_parse_url($base_url, PHP_URL_SCHEME);
        $host = (string) wp_parse_url($base_url, PHP_URL_HOST);
        $port = wp_parse_url($base_url, PHP_URL_PORT);
        if (!$scheme || !$host) {
            return '';
        }
        $origin = $scheme . '://' . $host . ($port ? ':' . absint($port) : '');
        if (strpos($candidate, '/') === 0) {
            return esc_url_raw($origin . $candidate);
        }
        $base_path = (string) wp_parse_url($base_url, PHP_URL_PATH);
        $directory = trailingslashit(dirname($base_path));
        return esc_url_raw($origin . $directory . $candidate);
    }

    private static function smart_analyze_attachment($attachment_id, $source_label, $source_url, $mark_current, $source_type) {
        $path = get_attached_file($attachment_id);
        $file_url = wp_get_attachment_url($attachment_id);
        if (!$path || !is_readable($path) || !$file_url) {
            return new WP_Error('p1coa_smart_attachment', 'The PDF was stored, but WordPress could not reopen it for scanning.');
        }

        $extraction = self::smart_extract_pdf_text($path);
        $row = self::smart_detect_coa(
            isset($extraction['text']) ? $extraction['text'] : '',
            $source_label,
            $source_url,
            $file_url,
            $attachment_id,
            isset($extraction['method']) ? $extraction['method'] : $source_type,
            $mark_current
        );
        if (!empty($extraction['warnings'])) {
            $row['warnings'] = array_values(array_unique(array_merge($row['warnings'], (array) $extraction['warnings'])));
        }
        return $row;
    }

    private static function smart_extract_pdf_text($path) {
        $text = '';
        $method = 'built_in_pdf_reader';
        $warnings = [];

        if (class_exists('\\Smalot\\PdfParser\\Parser')) {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($path);
                $text = (string) $pdf->getText();
                if (strlen(trim($text)) >= 60) {
                    $method = 'pdf_parser';
                }
            } catch (Throwable $exception) {
                $warnings[] = 'The advanced PDF parser could not read this document; fallback extraction was used.';
            }
        }

        if (strlen(trim($text)) < 60) {
            $process_text = self::smart_run_process(['pdftotext', '-layout', '-enc', 'UTF-8', $path, '-'], 25);
            if (strlen(trim($process_text)) >= 60) {
                $text = $process_text;
                $method = 'pdftotext';
            }
        }

        if (strlen(trim($text)) < 60) {
            $native = self::smart_extract_native_pdf_text($path);
            if (strlen(trim($native)) > strlen(trim($text))) {
                $text = $native;
                $method = 'built_in_pdf_reader';
            }
        }

        if (strlen(trim($text)) < 80) {
            $ocr = self::smart_ocr_pdf($path);
            if (strlen(trim($ocr)) > strlen(trim($text))) {
                $text = $ocr;
                $method = 'ocr';
            }
        }

        // Read the first page visually even when the PDF already contains selectable text.
        // Laboratory identities are frequently stored only inside a header logo/image.
        $visual_header = self::smart_ocr_pdf_header($path);
        if (strlen(trim($visual_header)) >= 2) {
            $text .= "\n\nVISUAL HEADER OCR\n" . $visual_header;
            if (strpos($method, 'visual_header_ocr') === false) {
                $method .= '_visual_header_ocr';
            }
        }

        $text = self::smart_clean_extracted_text($text);
        if (strlen($text) < 80) {
            $warnings[] = 'Very little text was detected. This may be an image-only PDF; verify the highlighted fields carefully.';
        }

        return [
            'text' => $text,
            'method' => $method,
            'warnings' => $warnings,
        ];
    }

    private static function smart_run_process($command, $timeout = 20) {
        if (!function_exists('proc_open')) {
            return '';
        }
        $disabled = array_map('trim', explode(',', (string) ini_get('disable_functions')));
        if (in_array('proc_open', $disabled, true)) {
            return '';
        }

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $pipes = [];
        $process = @proc_open($command, $descriptors, $pipes, null, null, ['bypass_shell' => true]);
        if (!is_resource($process)) {
            return '';
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);
        $stdout = '';
        $started = microtime(true);

        do {
            $stdout .= stream_get_contents($pipes[1]);
            stream_get_contents($pipes[2]);
            $status = proc_get_status($process);
            if (!$status['running']) {
                break;
            }
            if ((microtime(true) - $started) > $timeout) {
                proc_terminate($process);
                break;
            }
            usleep(25000);
        } while (true);

        $stdout .= stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);
        return $stdout;
    }

    private static function smart_ocr_pdf($path) {
        $base = trailingslashit(get_temp_dir()) . 'p1coa-ocr-' . wp_generate_password(10, false, false);
        if (!wp_mkdir_p($base)) {
            return '';
        }

        $prefix = trailingslashit($base) . 'page';
        self::smart_run_process(['pdftoppm', '-f', '1', '-l', '2', '-r', '180', '-png', $path, $prefix], 35);
        $images = glob($prefix . '-*.png');
        $text = '';
        foreach ((array) $images as $image) {
            $text .= "\n" . self::smart_run_process(['tesseract', $image, 'stdout', '-l', 'eng', '--psm', '6'], 35);
            if (file_exists($image)) {
                unlink($image);
            }
        }
        if (is_dir($base)) {
            rmdir($base);
        }
        return $text;
    }

    private static function smart_ocr_pdf_header($path) {
        $base = trailingslashit(get_temp_dir()) . 'p1coa-logo-' . wp_generate_password(10, false, false);
        if (!wp_mkdir_p($base)) {
            return '';
        }

        $prefix = trailingslashit($base) . 'header';
        self::smart_run_process(['pdftoppm', '-f', '1', '-l', '1', '-singlefile', '-r', '240', '-png', $path, $prefix], 35);
        $image = $prefix . '.png';
        $text = '';
        if (file_exists($image)) {
            // Sparse-text mode performs better on isolated words inside laboratory logos.
            $text = self::smart_run_process(['tesseract', $image, 'stdout', '-l', 'eng', '--psm', '11'], 35);
            unlink($image);
        }
        if (is_dir($base)) {
            rmdir($base);
        }
        return self::smart_clean_extracted_text($text);
    }

    private static function smart_extract_native_pdf_text($path) {
        $raw = file_get_contents($path);
        if ($raw === false || $raw === '') {
            return '';
        }

        $chunks = [$raw];
        if (preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $raw, $streams, PREG_OFFSET_CAPTURE)) {
            foreach ($streams[1] as $stream) {
                $data = $stream[0];
                $offset = (int) $stream[1];
                $dictionary = substr($raw, max(0, $offset - 260), min(260, $offset));
                if (strpos($dictionary, 'FlateDecode') !== false) {
                    $decoded = @gzuncompress($data);
                    if ($decoded === false) {
                        $decoded = @gzinflate($data);
                    }
                    if ($decoded !== false) {
                        $chunks[] = $decoded;
                    }
                } else {
                    $chunks[] = $data;
                }
            }
        }

        $output = [];
        foreach ($chunks as $chunk) {
            if (preg_match_all('/BT(.*?)ET/s', $chunk, $blocks)) {
                foreach ($blocks[1] as $block) {
                    if (preg_match_all('/\((?:\\\\.|[^\\\\)])*\)/s', $block, $strings)) {
                        foreach ($strings[0] as $string) {
                            $decoded = self::smart_decode_pdf_literal(substr($string, 1, -1));
                            if ($decoded !== '') {
                                $output[] = $decoded;
                            }
                        }
                    }
                    if (preg_match_all('/<([0-9A-Fa-f]{4,})>\s*(?:Tj|TJ)/', $block, $hex_strings)) {
                        foreach ($hex_strings[1] as $hex) {
                            $binary = @hex2bin(strlen($hex) % 2 ? $hex . '0' : $hex);
                            if ($binary !== false) {
                                $output[] = self::smart_decode_pdf_string($binary);
                            }
                        }
                    }
                }
            }
        }
        return implode("\n", $output);
    }

    private static function smart_decode_pdf_literal($value) {
        $value = preg_replace_callback('/\\\\([0-7]{1,3})/', function ($match) {
            return chr(octdec($match[1]));
        }, (string) $value);
        $value = str_replace(
            ['\\n', '\\r', '\\t', '\\b', '\\f', '\\(', '\\)', '\\\\'],
            ["\n", "\r", "\t", "\x08", "\x0C", '(', ')', '\\'],
            $value
        );
        return self::smart_decode_pdf_string($value);
    }

    private static function smart_decode_pdf_string($value) {
        if (substr($value, 0, 2) === "\xFE\xFF" && function_exists('mb_convert_encoding')) {
            return (string) mb_convert_encoding(substr($value, 2), 'UTF-8', 'UTF-16BE');
        }
        if (substr($value, 0, 2) === "\xFF\xFE" && function_exists('mb_convert_encoding')) {
            return (string) mb_convert_encoding(substr($value, 2), 'UTF-8', 'UTF-16LE');
        }
        return (string) $value;
    }

    private static function smart_clean_extracted_text($text) {
        $text = (string) $text;
        if (function_exists('wp_check_invalid_utf8')) {
            $text = wp_check_invalid_utf8($text, true);
        }
        $text = str_replace(["\x00", "\x0B"], ' ', $text);
        $text = preg_replace('/[\x01-\x08\x0E-\x1F\x7F]/', ' ', $text);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\s*\n\s*/', "\n", $text);
        $text = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim((string) $text);
    }

    private static function smart_detect_coa($text, $source_label, $source_url, $file_url, $attachment_id, $extractor, $mark_current) {
        $text = self::smart_clean_extracted_text($text);
        $source_label = sanitize_file_name((string) $source_label);
        $combined = trim($source_label . "\n" . (string) $source_url . "\n" . $text);
        $compound_match = self::smart_detect_compound($combined, $source_label);
        $compound = isset($compound_match['compound']) ? $compound_match['compound'] : '';
        $family = self::smart_match_family($compound, $combined, $source_label, $compound_match);
        if ($compound === '' && !empty($family['post_ids'])) {
            $remembered_compound = (string) self::get_meta(absint($family['post_ids'][0]), 'compound');
            $compound = $remembered_compound ?: (isset($family['name']) ? (string) $family['name'] : '');
        }
        $strength = self::smart_extract_strength($combined, $source_label, $compound);
        $batch = self::smart_extract_batch($text . "\n" . $source_label);
        $coa_number = self::smart_extract_coa_number($text . "\n" . $source_url . "\n" . $source_label);
        $date = self::smart_extract_date($text);
        $purity = self::smart_extract_purity($text);
        $laboratory = self::OFFICIAL_LABORATORY;
        $testing = self::smart_extract_testing($text);
        $product_match = self::smart_match_product($compound, $strength, $source_label, $combined, $compound_match);

        $product_name = '';
        if (!empty($product_match['name'])) {
            $product_name = $product_match['name'];
        } elseif ($compound !== '') {
            $product_name = trim($compound . ($strength ? ' ' . $strength : ''));
        }

        $fingerprint_source = implode('|', [
            self::smart_normalize($compound),
            self::smart_normalize($strength),
            self::smart_normalize($batch),
            self::smart_normalize($coa_number),
            self::smart_normalize($source_label),
            (string) $source_url,
        ]);
        $fingerprint = sha1($fingerprint_source);
        $custom_id = $coa_number !== '' ? sanitize_title($coa_number) : 'smart-' . substr($fingerprint, 0, 20);
        $existing_id = self::find_existing_record_id($custom_id, $coa_number);

        $warnings = [];
        $confidence = 0;
        if ($compound !== '') { $confidence += 24; } else { $warnings[] = 'Compound not detected'; }
        if (!empty($family['key'])) { $confidence += 12; } else { $warnings[] = 'Family needs confirmation'; }
        if ($strength !== '') { $confidence += 12; } else { $warnings[] = 'Strength not detected'; }
        if ($batch !== '') { $confidence += 13; } else { $warnings[] = 'Batch / lot not detected'; }
        if ($coa_number !== '') { $confidence += 13; } else { $warnings[] = 'COA number not detected'; }
        if ($date !== '') { $confidence += 8; } else { $warnings[] = 'Certificate date not detected'; }
        if ($purity !== '') { $confidence += 8; } else { $warnings[] = 'Purity not detected'; }
        if (!empty($product_match['product_id'])) { $confidence += 6; } else { $warnings[] = 'No confident WooCommerce match'; }
        if (strlen($text) >= 120) { $confidence += 4; }
        $confidence = min(100, $confidence);

        $record = [
            'id' => $custom_id,
            'coaNumber' => $coa_number,
            'productName' => $product_name,
            'compound' => $compound,
            'familyName' => isset($family['name']) ? $family['name'] : (isset($compound_match['family']) ? $compound_match['family'] : $compound),
            'familyKey' => isset($family['key']) ? $family['key'] : sanitize_title($compound),
            'matchedProductId' => isset($product_match['product_id']) ? absint($product_match['product_id']) : 0,
            'matchedVariationId' => isset($product_match['variation_id']) ? absint($product_match['variation_id']) : 0,
            'strength' => $strength,
            'batch' => $batch,
            'lot' => $batch,
            'date' => $date,
            'status' => 'Available',
            'purity' => $purity,
            'laboratory' => $laboratory,
            'method' => isset($testing['method']) ? $testing['method'] : '',
            'tested' => isset($testing['tested']) ? $testing['tested'] : '',
            'panelTypes' => isset($testing['panels']) ? $testing['panels'] : [],
            'currentShippingLot' => (bool) $mark_current,
            'verifyUrl' => esc_url_raw((string) $source_url),
            'url' => esc_url_raw((string) $source_url),
            'fileUrl' => esc_url_raw((string) $file_url),
            'fileAttachmentId' => absint($attachment_id),
        ];

        return [
            'record' => $record,
            'confidence' => $confidence,
            'warnings' => array_values(array_unique($warnings)),
            'extractor' => sanitize_key((string) $extractor),
            'text_length' => strlen($text),
            'source_label' => $source_label ?: 'COA document',
            'source_url' => esc_url_raw((string) $source_url),
            'fingerprint' => $fingerprint,
            'existing_id' => $existing_id,
            'excerpt' => substr($text, 0, 1200),
        ];
    }

    private static function smart_compound_dictionary() {
        return [
            ['compound' => 'BPC-157 / TB-500', 'family' => 'Wolverine', 'aliases' => ['wolverine', 'bpc 157 tb 500', 'bpc157 tb500', 'bpc tb blend']],
            ['compound' => 'GHK-Cu / BPC-157 / TB-500', 'family' => 'Glow', 'aliases' => ['glow blend', 'glow70', 'glow 70', 'ghk cu bpc 157 tb 500']],
            ['compound' => 'GHK-Cu / BPC-157 / TB-500 / KPV', 'family' => 'Klow', 'aliases' => ['klow blend', 'klow', 'ghk cu bpc 157 tb 500 kpv']],
            ['compound' => 'CJC-1295 / Ipamorelin', 'family' => 'CJC + IPA', 'aliases' => ['cjc 1295 ipamorelin', 'cjc ipa', 'cjc1295 ipa']],
            ['compound' => 'Tesamorelin / Ipamorelin', 'family' => 'Tesa + IPA', 'aliases' => ['tesamorelin ipamorelin', 'tesa ipa']],
            ['compound' => '5-Amino-1MQ', 'family' => '5-Amino-1MQ', 'aliases' => ['5 amino 1mq', '5amino1mq', '5 amino']],
            ['compound' => 'IGF-1 LR3', 'family' => 'IGF-1 LR3', 'aliases' => ['igf 1 lr3', 'igf1 lr3', 'igf1lr3']],
            ['compound' => 'HGH Fragment 176-191', 'family' => 'HGH Fragment', 'aliases' => ['hgh fragment 176 191', 'fragment 176 191', 'hgh frag']],
            ['compound' => 'Thymosin Alpha-1', 'family' => 'Thymosin Alpha-1', 'aliases' => ['thymosin alpha 1', 'thymosin a1', 'ta 1']],
            ['compound' => 'AOD-9604', 'family' => 'AOD-9604', 'aliases' => ['aod 9604', 'aod9604']],
            ['compound' => 'Retatrutide', 'family' => 'R3TA', 'aliases' => ['retatrutide', 'r3ta', 'reta', 'rt3']],
            ['compound' => 'Tirzepatide', 'family' => 'TIRZ', 'aliases' => ['tirzepatide', 'tirz', 'tz2']],
            ['compound' => 'Semaglutide', 'family' => 'Semaglutide', 'aliases' => ['semaglutide', 'sema']],
            ['compound' => 'Tesamorelin', 'family' => 'Tesamorelin', 'aliases' => ['tesamorelin', 'tesa']],
            ['compound' => 'Ipamorelin', 'family' => 'Ipamorelin', 'aliases' => ['ipamorelin', 'ipa']],
            ['compound' => 'CJC-1295', 'family' => 'CJC-1295', 'aliases' => ['cjc 1295 dac', 'cjc 1295 no dac', 'cjc1295', 'cjc 1295']],
            ['compound' => 'BPC-157', 'family' => 'BPC-157', 'aliases' => ['bpc 157', 'bpc157']],
            ['compound' => 'TB-500', 'family' => 'TB-500', 'aliases' => ['tb 500', 'tb500', 'thymosin beta 4']],
            ['compound' => 'GHK-Cu', 'family' => 'GHK-Cu', 'aliases' => ['ghk cu', 'ghkcu', 'copper peptide']],
            ['compound' => 'AHK-Cu', 'family' => 'AHK-Cu', 'aliases' => ['ahk cu', 'ahkcu']],
            ['compound' => 'MOTS-c', 'family' => 'MOTS-c', 'aliases' => ['mots c', 'motsc']],
            ['compound' => 'SS-31', 'family' => 'SS-31', 'aliases' => ['ss 31', 'ss31', 'elamipretide']],
            ['compound' => 'NAD+', 'family' => 'NAD+', 'aliases' => ['nad plus', 'nad+', 'nad']],
            ['compound' => 'Glutathione', 'family' => 'Glutathione', 'aliases' => ['korean glutathione', 'glutathione', 'glutathione injectable']],
            ['compound' => 'L-Carnitine', 'family' => 'L-Carnitine', 'aliases' => ['l carnitine', 'lcarnitine']],
            ['compound' => 'LL-37', 'family' => 'LL-37', 'aliases' => ['ll 37', 'll37', 'll 375']],
            ['compound' => 'KPV', 'family' => 'KPV', 'aliases' => ['kpv']],
            ['compound' => 'Epitalon', 'family' => 'Epitalon', 'aliases' => ['epitalon', 'epithalon']],
            ['compound' => 'PT-141', 'family' => 'PT-141', 'aliases' => ['pt 141', 'pt141', 'bremelanotide']],
            ['compound' => 'Melanotan II', 'family' => 'Melanotan II', 'aliases' => ['melanotan ii', 'melanotan 2', 'mt 2', 'mt2']],
            ['compound' => 'Sermorelin', 'family' => 'Sermorelin', 'aliases' => ['sermorelin']],
            ['compound' => 'GHRP-2', 'family' => 'GHRP-2', 'aliases' => ['ghrp 2', 'ghrp2']],
            ['compound' => 'GHRP-6', 'family' => 'GHRP-6', 'aliases' => ['ghrp 6', 'ghrp6']],
            ['compound' => 'Hexarelin', 'family' => 'Hexarelin', 'aliases' => ['hexarelin']],
            ['compound' => 'PEG-MGF', 'family' => 'PEG-MGF', 'aliases' => ['peg mgf', 'pegmgf']],
            ['compound' => 'Kisspeptin-10', 'family' => 'Kisspeptin-10', 'aliases' => ['kisspeptin 10', 'kisspeptin10']],
            ['compound' => 'Selank', 'family' => 'Selank', 'aliases' => ['selank']],
            ['compound' => 'Semax', 'family' => 'Semax', 'aliases' => ['semax']],
            ['compound' => 'DSIP', 'family' => 'DSIP', 'aliases' => ['dsip', 'delta sleep inducing peptide']],
            ['compound' => 'Oxytocin', 'family' => 'Oxytocin', 'aliases' => ['oxytocin']],
            ['compound' => 'Thymalin', 'family' => 'Thymalin', 'aliases' => ['thymalin']],
            ['compound' => 'Snap-8', 'family' => 'Snap-8', 'aliases' => ['snap 8', 'snap8', 'acetyl octapeptide 3']],
            ['compound' => 'Adamax', 'family' => 'Adamax', 'aliases' => ['adamax']],
            ['compound' => 'Bacteriostatic Water', 'family' => 'P1 Water', 'aliases' => ['bacteriostatic water', 'bac water', 'p1 water'] ],
        ];
    }

    private static function smart_detect_compound($haystack, $source_label = '') {
        $normalized = ' ' . self::smart_normalize($haystack) . ' ';
        $label = ' ' . self::smart_normalize($source_label) . ' ';
        $best = [];
        $best_score = 0;

        foreach (self::smart_compound_dictionary() as $entry) {
            foreach ($entry['aliases'] as $alias) {
                $needle = self::smart_normalize($alias);
                if (strlen(str_replace(' ', '', $needle)) < 3) {
                    continue;
                }
                $score = 0;
                if (strpos($label, ' ' . $needle . ' ') !== false) {
                    $score = 100 + strlen($needle);
                } elseif (strpos($normalized, ' ' . $needle . ' ') !== false) {
                    $score = 55 + strlen($needle);
                }
                if ($score > $best_score) {
                    $best_score = $score;
                    $best = $entry;
                }
            }
        }
        if (!$best && preg_match('/\b(?:compound|product|sample\s+name|material|identity)\s*[:\-]\s*([^\n\r]{3,70})/i', (string) $haystack, $match)) {
            $candidate = preg_replace('/\b\d+(?:\.\d+)?\s*(?:mcg|µg|ug|mg|g|ml|iu)\b.*$/iu', '', trim($match[1]));
            $candidate = trim((string) preg_replace('/\s{2,}.*/', '', $candidate), " .,:;-\t");
            if ($candidate !== '' && strlen($candidate) <= 60 && !preg_match('/^(?:name|description|test|sample|unknown|n\/a)$/i', $candidate)) {
                $best = [
                    'compound' => sanitize_text_field($candidate),
                    'family' => sanitize_text_field($candidate),
                    'aliases' => [sanitize_text_field($candidate)],
                    'score' => 45,
                ];
            }
        }
        if ($best) {
            if (!isset($best['score'])) {
                $best['score'] = $best_score;
            }
        }
        return $best;
    }

    private static function smart_family_catalog() {
        static $catalog = null;
        if (is_array($catalog)) {
            return $catalog;
        }

        $catalog = [];
        $ids = get_posts([
            'post_type' => self::CPT,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => -1,
            'fields' => 'ids',
            'no_found_rows' => true,
        ]);

        foreach ($ids as $post_id) {
            $identity = self::library_family_identity($post_id);
            $key = $identity['key'];
            if (!isset($catalog[$key])) {
                $catalog[$key] = [
                    'key' => $key,
                    'name' => $identity['name'],
                    'terms' => [],
                    'post_ids' => [],
                    'has_custom_name' => !empty($identity['has_custom_name']),
                ];
            }
            if (!empty($identity['has_custom_name'])) {
                $catalog[$key]['name'] = $identity['name'];
                $catalog[$key]['has_custom_name'] = true;
            }
            $catalog[$key]['post_ids'][] = absint($post_id);
            $terms = array_merge(
                [$identity['name'], $identity['key'], self::get_meta($post_id, 'compound'), self::get_meta($post_id, 'product_name')],
                (array) $identity['aliases']
            );
            foreach ($terms as $term) {
                $term = trim((string) $term);
                if ($term !== '' && !in_array($term, $catalog[$key]['terms'], true)) {
                    $catalog[$key]['terms'][] = $term;
                }
            }
        }

        $catalog = array_values($catalog);
        usort($catalog, function ($a, $b) { return strcasecmp($a['name'], $b['name']); });
        return $catalog;
    }

    private static function smart_match_family($compound, $haystack, $source_label, $compound_match = []) {
        $target = self::smart_normalize($compound);
        $normalized = ' ' . self::smart_normalize($haystack) . ' ';
        $label = ' ' . self::smart_normalize($source_label) . ' ';
        $best = [];
        $best_score = 0;

        foreach (self::smart_family_catalog() as $family) {
            $score = 0;
            foreach ($family['terms'] as $term) {
                $needle = self::smart_normalize(preg_replace('/\b\d+(?:\.\d+)?\s*(?:mcg|mg|g|ml|iu)\b/i', ' ', $term));
                if ($needle === '') {
                    continue;
                }
                if ($target !== '' && ($needle === $target || strpos($needle, $target) !== false || strpos($target, $needle) !== false)) {
                    $score = max($score, 120 + strlen($needle));
                }
                if (strlen(str_replace(' ', '', $needle)) >= 3 && strpos($label, ' ' . $needle . ' ') !== false) {
                    $score = max($score, 100 + strlen($needle));
                } elseif (strlen(str_replace(' ', '', $needle)) >= 4 && strpos($normalized, ' ' . $needle . ' ') !== false) {
                    $score = max($score, 45 + strlen($needle));
                }
            }
            if ($score > $best_score) {
                $best = $family;
                $best_score = $score;
            }
        }

        if ($best_score >= 50) {
            return $best;
        }
        return [
            'key' => sanitize_title($compound),
            'name' => isset($compound_match['family']) ? $compound_match['family'] : $compound,
            'terms' => [],
            'post_ids' => [],
            'has_custom_name' => false,
        ];
    }

    private static function smart_extract_strength($haystack, $source_label, $compound = '') {
        $sources = [(string) $source_label];
        if ($compound !== '') {
            $position = stripos((string) $haystack, $compound);
            if ($position !== false) {
                $sources[] = substr((string) $haystack, max(0, $position - 80), 220);
            }
        }
        $sources[] = (string) $haystack;

        foreach ($sources as $source) {
            if (preg_match('/\b(\d+(?:\.\d+)?)\s*(mcg|µg|ug|mg|g|ml|mL|iu|IU)\b/u', $source, $match)) {
                $unit = strtolower($match[2]);
                if ($unit === 'ug' || $unit === 'µg') { $unit = 'mcg'; }
                if ($unit === 'ml') { $unit = 'mL'; }
                if ($unit === 'iu') { $unit = 'IU'; }
                $number = (string) $match[1];
                if (strpos($number, '.') !== false) {
                    $number = rtrim(rtrim($number, '0'), '.');
                }
                return $number . ' ' . $unit;
            }
        }
        return '';
    }

    private static function smart_extract_batch($text) {
        $patterns = [
            '/\b(?:batch|lot)(?:\s*(?:number|no\.?|#))?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,32})/i',
            '/\b(?:sample\s*(?:id|number|no\.?))\s*[:#\-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,32})/i',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, (string) $text, $match)) {
                $value = trim($match[1], " .-_/:\t\n\r");
                if (preg_match('/\d/', $value) && !preg_match('/^(?:number|unknown|n\/a|none)$/i', $value)) {
                    return sanitize_text_field($value);
                }
            }
        }
        return '';
    }

    private static function smart_extract_coa_number($text) {
        $patterns = [
            '/\b(?:coa|certificate\s+of\s+analysis)\s*(?:(?:number|no\.?|id|#)\s*[:#\-]?|[:#\-])\s*([A-Z0-9][A-Z0-9._\/-]{3,40})/i',
            '/\b(?:report|certificate)(?:\s*(?:number|no\.?|id|#))\s*[:#\-]?\s*([A-Z0-9][A-Z0-9._\/-]{3,40})/i',
            '/[?&](?:t|token|report)=([A-Za-z0-9_-]{6,80})/i',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, (string) $text, $match)) {
                $value = trim($match[1], " .-_/:\t\n\r");
                if (preg_match('/\d/', $value) && !preg_match('/^(?:analysis|number|unknown|n\/a|none)$/i', $value)) {
                    return sanitize_text_field($value);
                }
            }
        }
        return '';
    }

    private static function smart_extract_purity($text) {
        $patterns = [
            '/\b(?:purity|hplc\s+purity|area\s*%|assay)\b.{0,45}?(\d{2,3}(?:\.\d{1,4})?)\s*%/is',
            '/\b(9[5-9](?:\.\d{1,4})?|100(?:\.0+)?)\s*%\b/',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, (string) $text, $match)) {
                $number = (float) $match[1];
                if ($number >= 90 && $number <= 100.5) {
                    return rtrim(rtrim(number_format($number, 4, '.', ''), '0'), '.') . '%';
                }
            }
        }
        return '';
    }

    private static function smart_extract_date($text) {
        $patterns = [
            '/\b(?:report\s+date|certificate\s+date|date\s+of\s+(?:analysis|test)|tested\s+on|analysis\s+date|issue\s+date|date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i',
            '/\b(20\d{2}[\/-]\d{1,2}[\/-]\d{1,2})\b/',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, (string) $text, $match)) {
                $timestamp = strtotime($match[1]);
                if ($timestamp && (int) gmdate('Y', $timestamp) >= 2015 && (int) gmdate('Y', $timestamp) <= ((int) gmdate('Y') + 2)) {
                    return gmdate('Y-m-d', $timestamp);
                }
            }
        }
        return '';
    }

    private static function smart_extract_laboratory($text) {
        $text = self::smart_clean_extracted_text($text);

        // Prefer an explicitly labelled issuer/facility field when the report provides one.
        $label_patterns = [
            '/\b(?:testing\s+laboratory|laboratory\s+name|laboratory|testing\s+facility|performed\s+by|tested\s+by|issued\s+by)\s*[:\-]\s*([^\n\r]{2,90})/i',
            '/\b(?:lab|facility)\s+name\s*[:\-]\s*([^\n\r]{2,90})/i',
        ];
        foreach ($label_patterns as $pattern) {
            if (preg_match($pattern, $text, $match)) {
                $candidate = self::smart_clean_laboratory_candidate($match[1]);
                if ($candidate !== '') {
                    return $candidate;
                }
            }
        }

        // OCR output after this marker comes from the rendered first page and includes logo text.
        $visual_text = '';
        $visual_position = stripos($text, 'VISUAL HEADER OCR');
        if ($visual_position !== false) {
            $visual_text = substr($text, $visual_position + strlen('VISUAL HEADER OCR'), 2500);
        }

        $areas = array_filter([$visual_text, substr($text, 0, 3000)]);
        foreach ($areas as $area) {
            $lines = preg_split('/\r?\n+/', (string) $area);
            $lines = array_values(array_filter(array_map('trim', (array) $lines)));
            foreach ($lines as $index => $line) {
                $candidates = [$line];
                if (isset($lines[$index + 1])) {
                    $candidates[] = trim($line . ' ' . $lines[$index + 1]);
                }
                foreach ($candidates as $raw_candidate) {
                    if (strlen($raw_candidate) > 100 || !preg_match('/\b(?:labs?|laborator(?:y|ies)|analytics|analytical|bio\s*labs?|bioanalytics|diagnostics|testing\s+services|analytical\s+sciences)\b/i', $raw_candidate)) {
                        continue;
                    }
                    $candidate = self::smart_clean_laboratory_candidate($raw_candidate);
                    if ($candidate !== '') {
                        return $candidate;
                    }
                }
            }
        }

        // Last-resort identity from the verification URL host, without favoring any lab brand.
        if (preg_match_all('~https?://([^/\s?#]+)~i', $text, $url_matches)) {
            $own_host = strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST));
            foreach ($url_matches[1] as $host) {
                $host = strtolower(preg_replace('/^www\./i', '', (string) $host));
                if ($host === $own_host || preg_match('/(?:amazonaws|cloudfront|googleapis|wp\.com|wordpress|cloudflare|facebook|instagram|linkedin|youtube|twitter)\./i', $host) || $host === 'x.com') {
                    continue;
                }
                $parts = explode('.', $host);
                if (count($parts) < 2) {
                    continue;
                }
                $slug = $parts[count($parts) - 2];
                $slug = preg_replace('/(laboratories|laboratory|biolabs|labs|analytics|analytical)$/i', ' $1', $slug);
                $candidate = self::smart_clean_laboratory_candidate(ucwords(str_replace(['-', '_'], ' ', $slug)));
                if ($candidate !== '') {
                    return $candidate;
                }
            }
        }

        return '';
    }

    private static function smart_clean_laboratory_candidate($candidate) {
        $candidate = html_entity_decode(wp_strip_all_tags((string) $candidate));
        $candidate = preg_replace('/^(?:testing\s+laboratory|laboratory\s+name|laboratory|testing\s+facility|performed\s+by|tested\s+by|issued\s+by|lab\s+name)\s*[:\-]?\s*/i', '', $candidate);
        $candidate = preg_replace('/\s+(?:report|certificate|address|phone|email|website|www\.).*$/i', '', $candidate);
        $candidate = trim(preg_replace('/\s+/', ' ', $candidate), " \t\n\r\0\x0B|,;:-");
        if ($candidate === '' || strlen($candidate) < 2 || strlen($candidate) > 90 || !preg_match('/[A-Za-z]/', $candidate)) {
            return '';
        }

        $generic = self::smart_normalize($candidate);
        $rejected = [
            'laboratory', 'testing laboratory', 'laboratory test', 'laboratory test results', 'lab results',
            'analytical results', 'certificate of analysis', 'quality control laboratory', 'testing facility',
            'performed by', 'tested by', 'issued by', 'visual header ocr',
        ];
        if (in_array($generic, $rejected, true) || preg_match('/\b(?:sample|batch|lot|purity|method|result|date)\b/i', $candidate)) {
            return '';
        }
        return sanitize_text_field($candidate);
    }

    private static function smart_extract_testing($text) {
        $methods = [
            'LC-MS/MS' => ['lc-ms/ms', 'lc ms/ms', 'lcmsms'],
            'LC-MS' => ['lc-ms', 'lc ms', 'lcms'],
            'HPLC' => ['hplc', 'high performance liquid chromatography'],
            'UPLC' => ['uplc'],
            'GC-MS' => ['gc-ms', 'gc ms'],
            'NMR' => ['nmr'],
            'Mass Spectrometry' => ['mass spectrometry'],
        ];
        $coverage = [
            'Sterility' => ['sterility'],
            'Endotoxin' => ['endotoxin', 'lps'],
            'Heavy Metals' => ['heavy metals', 'arsenic', 'cadmium', 'lead', 'mercury'],
            'Microbial' => ['microbial', 'bioburden', 'total plate count'],
            'Amino Acid Analysis' => ['amino acid analysis'],
        ];
        $normalized = ' ' . self::smart_normalize($text) . ' ';
        $found_methods = [];
        $found_coverage = [];
        foreach ($methods as $label => $aliases) {
            foreach ($aliases as $alias) {
                if (strpos($normalized, ' ' . self::smart_normalize($alias) . ' ') !== false) {
                    $found_methods[] = $label;
                    break;
                }
            }
        }
        foreach ($coverage as $label => $aliases) {
            foreach ($aliases as $alias) {
                if (strpos($normalized, ' ' . self::smart_normalize($alias) . ' ') !== false) {
                    $found_coverage[] = $label;
                    break;
                }
            }
        }

        $panels = [];
        if (preg_match('/\b8\s*x\b|8x\s+tested/i', (string) $text)) { $panels[] = '8x'; }
        if (preg_match('/\b3\s*x\b|3x\s+tested/i', (string) $text)) { $panels[] = '3x'; }
        if (preg_match('/\bfull\s+(?:testing\s+)?panel\b/i', (string) $text)) { $panels[] = 'full'; }
        if (preg_match('/\bstandard\s+panel\b/i', (string) $text)) { $panels[] = 'standard'; }

        return [
            'method' => implode(' / ', array_values(array_unique($found_methods))),
            'tested' => implode(' / ', array_values(array_unique(array_merge($found_methods, $found_coverage)))),
            'panels' => self::sanitize_panel_types($panels),
        ];
    }

    private static function smart_match_product($compound, $strength, $source_label, $haystack, $compound_match = []) {
        if ($compound === '' || !class_exists('WooCommerce')) {
            return [];
        }

        $aliases = isset($compound_match['aliases']) ? (array) $compound_match['aliases'] : [$compound];
        $best = [];
        $best_score = 0;
        foreach (self::get_product_matching_data() as $product) {
            $score = self::smart_product_score($product['searchText'], $compound, $strength, $source_label, $aliases);
            if ($score > $best_score) {
                $best_score = $score;
                $best = [
                    'product_id' => absint($product['id']),
                    'variation_id' => 0,
                    'name' => (string) $product['name'],
                    'score' => $score,
                ];
            }
            foreach ((array) $product['variations'] as $variation) {
                $variation_text = $variation['searchText'] . ' ' . $product['searchText'];
                $variation_score = self::smart_product_score($variation_text, $compound, $strength, $source_label, $aliases);
                if ($strength !== '' && self::smart_strength_key($variation['strength']) === self::smart_strength_key($strength)) {
                    $variation_score += 14;
                }
                if ($variation_score > $best_score) {
                    $best_score = $variation_score;
                    $best = [
                        'product_id' => absint($product['id']),
                        'variation_id' => absint($variation['id']),
                        'name' => (string) $variation['name'],
                        'score' => $variation_score,
                    ];
                }
            }
        }
        return $best_score >= 35 ? $best : [];
    }

    private static function smart_product_score($product_text, $compound, $strength, $source_label, $aliases) {
        $product = ' ' . self::smart_normalize($product_text) . ' ';
        $label = ' ' . self::smart_normalize($source_label) . ' ';
        $score = 0;
        foreach (array_merge([$compound], (array) $aliases) as $alias) {
            $needle = self::smart_normalize($alias);
            if (strlen(str_replace(' ', '', $needle)) < 3) {
                continue;
            }
            if (strpos($product, ' ' . $needle . ' ') !== false) {
                $score = max($score, 55 + strlen($needle));
            }
            if (strpos($label, ' ' . $needle . ' ') !== false && strpos($product, ' ' . $needle . ' ') !== false) {
                $score += 15;
            }
        }
        if ($strength !== '' && strpos(str_replace(' ', '', $product), self::smart_strength_key($strength)) !== false) {
            $score += 22;
        }
        return $score;
    }

    private static function smart_strength_key($value) {
        return preg_replace('/[^a-z0-9]+/', '', strtolower((string) $value));
    }

    private static function smart_normalize($value) {
        $value = remove_accents(strtolower(html_entity_decode(wp_strip_all_tags((string) $value))));
        $value = str_replace(['µ', '+'], ['u', ' plus '], $value);
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value);
        return trim(preg_replace('/\s+/', ' ', $value));
    }

    private static function smart_build_reviewed_record($stored, $posted) {
        if (!is_array($stored) || empty($stored['record']) || !is_array($stored['record'])) {
            return new WP_Error('p1coa_smart_record', 'Stored scan data is invalid.');
        }
        $base = $stored['record'];
        $text = function ($key, $default = '') use ($posted) {
            return isset($posted[$key]) ? sanitize_text_field((string) $posted[$key]) : $default;
        };

        $compound = $text('compound', isset($base['compound']) ? $base['compound'] : '');
        $strength = $text('strength', isset($base['strength']) ? $base['strength'] : '');
        $product_name = $text('productName', isset($base['productName']) ? $base['productName'] : '');
        if ($product_name === '') {
            $product_name = trim($compound . ' ' . $strength);
        }
        if ($product_name === '' && $compound === '') {
            return new WP_Error('p1coa_smart_identity', 'A product name or compound is required.');
        }

        $family_name = $text('familyName', isset($base['familyName']) ? $base['familyName'] : '');
        $family_key = sanitize_title($text('familyKey', isset($base['familyKey']) ? $base['familyKey'] : ''));
        if ($family_key === '' && $family_name !== '') {
            foreach (self::smart_family_catalog() as $family) {
                if (strcasecmp($family['name'], $family_name) === 0) {
                    $family_key = $family['key'];
                    break;
                }
            }
        }
        if ($family_key === '') {
            $family_key = sanitize_title($compound ?: $product_name);
        }

        $matched_product_id = isset($base['matchedProductId']) ? absint($base['matchedProductId']) : 0;
        $matched_variation_id = isset($base['matchedVariationId']) ? absint($base['matchedVariationId']) : 0;
        if (!empty($posted['productMatch'])) {
            $parts = array_map('absint', explode(':', (string) $posted['productMatch']));
            $matched_product_id = isset($parts[0]) ? $parts[0] : 0;
            $matched_variation_id = isset($parts[1]) ? $parts[1] : 0;
        }

        $current = !empty($posted['currentShippingLot']);
        $date = $text('date', isset($base['date']) ? $base['date'] : '');
        $purity = $text('purity', isset($base['purity']) ? $base['purity'] : '');
        $method = $text('method', isset($base['method']) ? $base['method'] : '');
        $tested = $text('tested', isset($base['tested']) ? $base['tested'] : '');
        $coa_number = $text('coaNumber', isset($base['coaNumber']) ? $base['coaNumber'] : '');
        $custom_id = isset($base['id']) ? sanitize_text_field((string) $base['id']) : '';
        if ($coa_number !== '') {
            $custom_id = sanitize_title($coa_number);
        }

        $record = [
            'id' => $custom_id,
            'coaNumber' => $coa_number,
            'productName' => $product_name,
            'compound' => $compound,
            'familyName' => $family_name,
            'familyKey' => $family_key,
            'matchedProductId' => $matched_product_id,
            'matchedVariationId' => $matched_variation_id,
            'strength' => $strength,
            'batch' => $text('batch', isset($base['batch']) ? $base['batch'] : ''),
            'lot' => $text('batch', isset($base['batch']) ? $base['batch'] : ''),
            'date' => $date,
            'status' => 'Available',
            'purity' => $purity,
            'laboratory' => self::OFFICIAL_LABORATORY,
            'method' => $method,
            'tested' => $tested,
            'panelTypes' => self::sanitize_panel_types(isset($posted['panelTypes']) ? $posted['panelTypes'] : []),
            'currentShippingLot' => $current,
            'activeShippingLot' => $current,
            'verifyUrl' => isset($base['verifyUrl']) ? esc_url_raw((string) $base['verifyUrl']) : '',
            'url' => isset($base['url']) ? esc_url_raw((string) $base['url']) : '',
            'fileUrl' => isset($base['fileUrl']) ? esc_url_raw((string) $base['fileUrl']) : '',
            'fileAttachmentId' => isset($base['fileAttachmentId']) ? absint($base['fileAttachmentId']) : 0,
            'currentCoa' => [
                'version' => 'v1',
                'label' => 'Current COA',
                'date' => $date,
                'purity' => $purity,
                'method' => $method,
                'tested' => $tested,
                'verifyUrl' => isset($base['verifyUrl']) ? esc_url_raw((string) $base['verifyUrl']) : '',
                'fileUrl' => isset($base['fileUrl']) ? esc_url_raw((string) $base['fileUrl']) : '',
                'fileAttachmentId' => isset($base['fileAttachmentId']) ? absint($base['fileAttachmentId']) : 0,
                'currentShippingLot' => $current,
            ],
        ];

        $existing_id = isset($stored['existing_id']) ? absint($stored['existing_id']) : 0;
        if ($existing_id) {
            $record['aliases'] = self::string_array(self::get_meta($existing_id, 'aliases', []));
            $record['keywords'] = self::string_array(self::get_meta($existing_id, 'keywords', []));
            $record['history'] = self::get_meta($existing_id, 'history', []);
            $record['order'] = (string) self::get_meta($existing_id, 'order');
            $record['coaUrl'] = (string) self::get_meta($existing_id, 'coa_url');
            if (empty($record['verifyUrl'])) {
                $record['verifyUrl'] = (string) self::get_meta($existing_id, 'verify_url');
                $record['url'] = (string) self::get_meta($existing_id, 'url');
                $record['currentCoa']['verifyUrl'] = (string) self::get_meta($existing_id, 'current_verify_url', $record['verifyUrl']);
            }

            if (!$matched_product_id && !$matched_variation_id) {
                $record['matchedProductId'] = absint(self::get_meta($existing_id, 'matched_product_id', 0));
                $record['matchedVariationId'] = absint(self::get_meta($existing_id, 'matched_variation_id', 0));
                $record['wooIds'] = self::int_array(self::get_meta($existing_id, 'woo_ids', []));
                $record['productIds'] = self::int_array(self::get_meta($existing_id, 'product_ids', []));
                $record['parentProductIds'] = self::int_array(self::get_meta($existing_id, 'parent_product_ids', []));
                $record['variationIds'] = self::int_array(self::get_meta($existing_id, 'variation_ids', []));
                $record['skus'] = self::string_array(self::get_meta($existing_id, 'skus', []));
            }
        }

        return $record;
    }

    public static function render_import_export_page() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        $message = '';
        $error = '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['p1coa_import_nonce']) && wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['p1coa_import_nonce'])), 'p1coa_import')) {
            if (isset($_POST['p1coa_import_bundled'])) {
                $file = plugin_dir_path(__FILE__) . 'data/initial-coas.json';
                if (file_exists($file)) {
                    $json = file_get_contents($file);
                    $result = self::import_json_records($json);
                    if (is_wp_error($result)) {
                        $error = $result->get_error_message();
                    } else {
                        $message = sprintf('Bundled COAs imported/updated: %d records.', (int) $result);
                    }
                } else {
                    $error = 'Bundled data file not found.';
                }
            } elseif (isset($_POST['p1coa_import_file'])) {
                $file_result = self::read_uploaded_import_file('p1coa_json_file');
                if (is_wp_error($file_result)) {
                    $error = $file_result->get_error_message();
                } else {
                    $result = self::import_json_records($file_result);
                    if (is_wp_error($result)) {
                        $error = $result->get_error_message();
                    } else {
                        $message = sprintf('Uploaded file imported/updated: %d COA records.', (int) $result);
                    }
                }
            } elseif (isset($_POST['p1coa_import_json'])) {
                $json = isset($_POST['p1coa_json']) ? wp_unslash($_POST['p1coa_json']) : '';
                $result = self::import_json_records($json);
                if (is_wp_error($result)) {
                    $error = $result->get_error_message();
                } else {
                    $message = sprintf('COAs imported/updated: %d records.', (int) $result);
                }
            }
        }

        $endpoint = rest_url(self::REST_NAMESPACE . '/coas');
        $export_url = wp_nonce_url(admin_url('admin-post.php?action=p1coa_export_json'), 'p1coa_export_json');

        echo '<div class="wrap p1coa-tools-page">';
        echo '<section class="p1coa-tools-hero"><div class="p1coa-tools-hero-copy"><span class="p1coa-tools-kicker">PHASE ONE · DATA OPERATIONS</span><h1>Import &amp; Export</h1><p>Move your certificate library safely, seed a new installation, or connect an external storefront through the live REST endpoint.</p></div><div class="p1coa-tools-hero-badge"><span class="dashicons dashicons-database"></span><span><strong>Portable by design</strong><small>JSON · JavaScript · REST API</small></span></div></section>';

        if ($message) {
            echo '<div class="notice notice-success"><p>' . esc_html($message) . '</p></div>';
        }
        if ($error) {
            echo '<div class="notice notice-error"><p>' . esc_html($error) . '</p></div>';
        }

        echo '<div class="p1coa-tools-grid">';
        echo '<div class="p1coa-tool-card">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-archive"></span></span><div><h2>Import bundled COAs</h2><p>Seed WordPress from the JSON library shipped with this plugin package.</p></div></div>';
        echo '<form method="post">';
        wp_nonce_field('p1coa_import', 'p1coa_import_nonce');
        echo '<button type="submit" name="p1coa_import_bundled" value="1" class="button button-primary">Import bundled current COAs</button>';
        echo '</form>';
        echo '</div>';

        echo '<div class="p1coa-tool-card">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-upload"></span></span><div><h2>Upload a data file</h2><p>Accepts <code>.json</code>, <code>.js</code>, and <code>.txt</code> exports, including wrapped record arrays.</p></div></div>';
        echo '<form method="post" enctype="multipart/form-data">';
        wp_nonce_field('p1coa_import', 'p1coa_import_nonce');
        echo '<input type="file" name="p1coa_json_file" accept=".json,.js,.txt,application/json,text/plain" required />';
        echo '<p><button type="submit" name="p1coa_import_file" value="1" class="button button-primary">Upload and import COAs</button></p>';
        echo '<p class="description">Existing COAs are updated by <code>id</code> or <code>coaNumber</code>. New records are created automatically.</p>';
        echo '</form>';
        echo '</div>';

        echo '<div class="p1coa-tool-card is-wide">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-editor-code"></span></span><div><h2>Paste JSON or JavaScript</h2><p>Paste a record array or a frontend <code>export const coaRecords = [...]</code> block. Camel case and snake case keys are supported.</p></div></div>';
        echo '<form method="post">';
        wp_nonce_field('p1coa_import', 'p1coa_import_nonce');
        echo '<textarea name="p1coa_json" rows="14" class="large-text code" placeholder="export const coaRecords = [{...}];"></textarea>';
        echo '<p><button type="submit" name="p1coa_import_json" value="1" class="button button-primary">Import pasted data</button></p>';
        echo '</form>';
        echo '</div>';

        echo '<div class="p1coa-tool-card is-wide">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-rest-api"></span></span><div><h2>Export &amp; live API</h2><p>Download a portable snapshot or use the endpoint from Astro and other approved frontends.</p></div></div>';
        echo '<div class="p1coa-api-endpoint"><span class="dashicons dashicons-admin-links"></span><code>' . esc_html($endpoint) . '</code></div>';
        echo '<p><a class="button button-secondary" href="' . esc_url($export_url) . '"><span class="dashicons dashicons-download"></span> Download current COAs as JSON</a></p>';
        echo '</div>';

        echo '</div>';
        echo '</div>';
    }

    private static function read_uploaded_import_file($field_name) {
        if (empty($_FILES[$field_name]) || !is_array($_FILES[$field_name])) {
            return new WP_Error('p1coa_no_file', 'No import file was uploaded.');
        }

        $file = $_FILES[$field_name];

        if (!empty($file['error'])) {
            return new WP_Error('p1coa_upload_error', 'Upload failed with error code ' . (int) $file['error'] . '.');
        }

        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return new WP_Error('p1coa_invalid_upload', 'The uploaded file could not be read.');
        }

        $filename = isset($file['name']) ? sanitize_file_name((string) $file['name']) : '';
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowed = ['json', 'js', 'txt'];

        if (!in_array($extension, $allowed, true)) {
            return new WP_Error('p1coa_invalid_extension', 'Please upload a .json, .js, or .txt file.');
        }

        $max_bytes = 8 * 1024 * 1024;
        if (!empty($file['size']) && (int) $file['size'] > $max_bytes) {
            return new WP_Error('p1coa_file_too_large', 'The import file is too large. Please keep it under 8 MB.');
        }

        $contents = file_get_contents($file['tmp_name']);
        if ($contents === false || trim((string) $contents) === '') {
            return new WP_Error('p1coa_empty_file', 'The uploaded file is empty.');
        }

        return $contents;
    }

    private static function import_json_records($payload) {
        $payload = trim((string) $payload);
        if ($payload === '') {
            return new WP_Error('p1coa_empty_json', 'No JSON or JS data was provided.');
        }

        $records = self::decode_import_records($payload);
        if (is_wp_error($records)) {
            return $records;
        }

        $count = 0;
        foreach ($records as $record) {
            if (!is_array($record)) {
                continue;
            }
            self::import_single_record($record);
            $count++;
        }

        if ($count === 0) {
            return new WP_Error('p1coa_no_records', 'No COA records were found in the imported data.');
        }

        return $count;
    }

    private static function decode_import_records($payload) {
        $normalized_payload = self::normalize_import_payload($payload);
        $decoded = json_decode($normalized_payload, true);

        if (!is_array($decoded)) {
            return new WP_Error(
                'p1coa_invalid_json',
                'Invalid import data. Upload a JSON array/object, { records: [...] }, { coas: [...] }, { data: [...] }, or a JS file like export const coaRecords = [...]. JSON error: ' . json_last_error_msg()
            );
        }

        $records = self::extract_records_from_decoded_payload($decoded);

        if (empty($records)) {
            return new WP_Error('p1coa_no_records', 'The file was read, but no COA records were found.');
        }

        return $records;
    }

    private static function normalize_import_payload($payload) {
        $payload = trim((string) $payload);
        $payload = preg_replace('/^\xEF\xBB\xBF/', '', $payload);

        // Remove block comments and full-line JS comments without touching URLs like https://.
        $payload = preg_replace('~/\*.*?\*/~s', '', $payload);
        $payload = preg_replace('/^\s*\/\/.*$/m', '', $payload);
        $payload = trim($payload);

        if (preg_match('/^export\s+default\s+(.+?)\s*;?\s*$/s', $payload, $matches)) {
            $payload = trim($matches[1]);
        } elseif (preg_match('/^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(.+?)\s*;?\s*$/s', $payload, $matches)) {
            $payload = trim($matches[1]);
        }

        $payload = trim($payload);
        $payload = rtrim($payload, "; \t\n\r\0\x0B");

        // If extra text surrounds the data, keep the outer JSON/JS array or object.
        $first_array = strpos($payload, '[');
        $first_object = strpos($payload, '{');
        $first = false;

        if ($first_array !== false && $first_object !== false) {
            $first = min($first_array, $first_object);
        } elseif ($first_array !== false) {
            $first = $first_array;
        } elseif ($first_object !== false) {
            $first = $first_object;
        }

        if ($first !== false && $first > 0) {
            $payload = substr($payload, $first);
        }

        $last_array = strrpos($payload, ']');
        $last_object = strrpos($payload, '}');
        $last = false;

        if ($last_array !== false && $last_object !== false) {
            $last = max($last_array, $last_object);
        } elseif ($last_array !== false) {
            $last = $last_array;
        } elseif ($last_object !== false) {
            $last = $last_object;
        }

        if ($last !== false) {
            $payload = substr($payload, 0, $last + 1);
        }

        // Convert common JS object literal syntax into valid JSON.
        $payload = preg_replace('/([\{\[,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/', '$1"$2":', $payload);
        $payload = preg_replace('/,\s*([\]}])/', '$1', $payload);

        return trim($payload);
    }

    private static function extract_records_from_decoded_payload($decoded) {
        if (self::looks_like_record($decoded)) {
            return [$decoded];
        }

        $wrapper_keys = ['records', 'coas', 'data', 'items', 'coaRecords', 'coa_records', 'results'];
        foreach ($wrapper_keys as $key) {
            if (isset($decoded[$key]) && is_array($decoded[$key])) {
                if (self::looks_like_record($decoded[$key])) {
                    return [$decoded[$key]];
                }
                return self::is_list_array($decoded[$key]) ? $decoded[$key] : array_values($decoded[$key]);
            }
        }

        return self::is_list_array($decoded) ? $decoded : array_values($decoded);
    }

    private static function looks_like_record($value) {
        if (!is_array($value)) {
            return false;
        }

        $keys = ['id', 'coaNumber', 'coa_number', 'productName', 'product_name', 'batch', 'lot', 'verifyUrl', 'verify_url', 'currentCoa', 'current_coa'];
        foreach ($keys as $key) {
            if (array_key_exists($key, $value)) {
                return true;
            }
        }

        return false;
    }

    private static function is_list_array($value) {
        if (!is_array($value)) {
            return false;
        }

        $expected = 0;
        foreach (array_keys($value) as $key) {
            if ($key !== $expected) {
                return false;
            }
            $expected++;
        }
        return true;
    }

    private static function record_value($record, $keys, $default = '') {
        foreach ((array) $keys as $key) {
            if (array_key_exists($key, $record) && $record[$key] !== null) {
                return $record[$key];
            }
        }
        return $default;
    }

    private static function first_int_from_array($value) {
        foreach (self::string_array($value) as $item) {
            $id = absint($item);
            if ($id > 0) {
                return $id;
            }
        }
        return 0;
    }

    private static function infer_matching_ids_from_record($record, &$matched_product_id, &$matched_variation_id) {
        if (!class_exists('WooCommerce') || !function_exists('wc_get_product')) {
            return;
        }

        if (!$matched_variation_id) {
            $variation_id = self::first_int_from_array(self::record_value($record, ['variationIds', 'variation_ids'], []));
            if ($variation_id) {
                $variation = wc_get_product($variation_id);
                if ($variation && $variation->is_type('variation')) {
                    $matched_variation_id = $variation_id;
                    if (!$matched_product_id) {
                        $matched_product_id = (int) $variation->get_parent_id();
                    }
                    return;
                }
            }
        }

        if (!$matched_product_id) {
            $product_id = self::first_int_from_array(self::record_value($record, ['productIds', 'product_ids', 'parentProductIds', 'parent_product_ids', 'wooIds', 'woo_ids'], []));
            if ($product_id) {
                $product = wc_get_product($product_id);
                if ($product) {
                    if ($product->is_type('variation')) {
                        $matched_variation_id = $product_id;
                        $matched_product_id = (int) $product->get_parent_id();
                    } else {
                        $matched_product_id = $product_id;
                    }
                }
            }
        }
    }

    private static function import_single_record($record, $post_status = 'publish') {
        $custom_id = sanitize_text_field((string) self::record_value($record, ['id', 'custom_id'], ''));
        $coa_number = sanitize_text_field((string) self::record_value($record, ['coaNumber', 'coa_number'], ''));
        $product_name_for_title = self::record_value($record, ['productName', 'product_name', 'product', 'title'], '');
        $title = $product_name_for_title !== '' ? sanitize_text_field((string) $product_name_for_title) : ($coa_number ?: 'COA Record');
        $existing_id = self::find_existing_record_id($custom_id, $coa_number);

        if ($existing_id) {
            $post_id = $existing_id;
            wp_update_post([
                'ID' => $post_id,
                'post_title' => $title,
                'post_status' => in_array($post_status, ['publish', 'draft', 'pending', 'private'], true) ? $post_status : 'publish',
            ]);
        } else {
            $post_id = wp_insert_post([
                'post_type' => self::CPT,
                'post_title' => $title,
                'post_status' => in_array($post_status, ['publish', 'draft', 'pending', 'private'], true) ? $post_status : 'publish',
            ]);
        }

        if (is_wp_error($post_id) || !$post_id) {
            return 0;
        }

        $current = self::record_value($record, ['currentCoa', 'current_coa'], []);
        if (!is_array($current)) {
            $current = [];
        }

        $matched_product_id = absint(self::record_value($record, ['matchedProductId', 'matched_product_id'], 0));
        $matched_variation_id = absint(self::record_value($record, ['matchedVariationId', 'matched_variation_id'], 0));
        self::infer_matching_ids_from_record($record, $matched_product_id, $matched_variation_id);

        $incoming_laboratory = sanitize_text_field((string) self::record_value(
            $record,
            ['laboratory', 'lab', 'testingLaboratory', 'testing_laboratory'],
            ''
        ));
        if ($incoming_laboratory === '' && $existing_id) {
            $incoming_laboratory = trim((string) get_post_meta($existing_id, self::META_PREFIX . 'laboratory', true));
        }
        if ($incoming_laboratory === '') {
            $incoming_laboratory = self::OFFICIAL_LABORATORY;
        }

        $map = [
            'custom_id' => $custom_id,
            'coa_number' => $coa_number,
            'matched_product_id' => $matched_product_id,
            'matched_variation_id' => $matched_variation_id,
            'product_name' => sanitize_text_field((string) self::record_value($record, ['productName', 'product_name', 'product', 'title'], '')),
            'compound' => sanitize_text_field((string) self::record_value($record, ['compound', 'productName', 'product_name', 'product', 'title'], '')),
            'family_name' => sanitize_text_field((string) self::record_value($record, ['familyName', 'family_name'], '')),
            'family_key' => sanitize_title((string) self::record_value($record, ['familyKey', 'family_key'], '')),
            'woo_ids' => self::string_array(self::record_value($record, ['wooIds', 'woo_ids'], [])),
            'product_ids' => self::string_array(self::record_value($record, ['productIds', 'product_ids'], [])),
            'parent_product_ids' => self::string_array(self::record_value($record, ['parentProductIds', 'parent_product_ids'], [])),
            'variation_ids' => self::string_array(self::record_value($record, ['variationIds', 'variation_ids'], [])),
            'skus' => self::string_array(self::record_value($record, ['skus', 'sku'], [])),
            'aliases' => self::string_array(self::record_value($record, ['aliases', 'alias'], [])),
            'keywords' => self::string_array(self::record_value($record, ['keywords', 'search_keywords'], [])),
            'panel_types' => self::sanitize_panel_types(self::record_value($record, ['panelTypes', 'panel_types', 'reportPanels', 'report_panels'], [])),
            'strength' => sanitize_text_field((string) self::record_value($record, ['strength'], '')),
            'batch' => sanitize_text_field((string) self::record_value($record, ['batch', 'lot'], '')),
            'lot' => sanitize_text_field((string) self::record_value($record, ['lot', 'batch'], '')),
            'order' => sanitize_text_field((string) self::record_value($record, ['order', 'order_number'], '')),
            'date' => sanitize_text_field((string) self::record_value($record, ['date', 'coaDate', 'coa_date'], '')),
            'status' => sanitize_text_field((string) self::record_value($record, ['status'], 'Available')),
            'purity' => sanitize_text_field((string) self::record_value($record, ['purity'], '')),
            'laboratory' => $incoming_laboratory,
            'method' => sanitize_text_field((string) self::record_value($record, ['method'], '')),
            'tested' => sanitize_text_field((string) self::record_value($record, ['tested'], '')),
            'current_shipping_lot' => self::to_bool(self::record_value($record, ['currentShippingLot', 'current_shipping_lot'], false)) ? '1' : '0',
            'active_shipping_lot' => self::to_bool(self::record_value($record, ['activeShippingLot', 'active_shipping_lot'], false)) ? '1' : '0',
            'coa_url' => esc_url_raw((string) self::record_value($record, ['coaUrl', 'coa_url'], '')),
            'verify_url' => esc_url_raw((string) self::record_value($record, ['verifyUrl', 'verify_url'], '')),
            'url' => esc_url_raw((string) self::record_value($record, ['url', 'verifyUrl', 'verify_url', 'coaUrl', 'coa_url'], '')),
            'file_url' => esc_url_raw((string) self::record_value($record, ['fileUrl', 'file_url'], '')),
            'file_attachment_id' => absint(self::record_value($record, ['fileAttachmentId', 'file_attachment_id'], 0)),
            'current_version' => sanitize_text_field((string) self::record_value($current, ['version'], 'v1')),
            'current_label' => sanitize_text_field((string) self::record_value($current, ['label', 'document_label'], 'Current COA')),
            'current_date' => sanitize_text_field((string) self::record_value($current, ['date', 'coa_date'], '')),
            'current_purity' => sanitize_text_field((string) self::record_value($current, ['purity'], '')),
            'current_method' => sanitize_text_field((string) self::record_value($current, ['method', 'tested'], '')),
            'current_tested' => sanitize_text_field((string) self::record_value($current, ['tested', 'method'], '')),
            'current_verify_url' => esc_url_raw((string) self::record_value($current, ['verifyUrl', 'verify_url'], '')),
            'current_file_url' => esc_url_raw((string) self::record_value($current, ['fileUrl', 'file_url'], '')),
            'current_file_attachment_id' => absint(self::record_value($current, ['fileAttachmentId', 'file_attachment_id'], 0)),
            'current_coa_current_shipping_lot' => (self::to_bool(self::record_value($current, ['currentShippingLot', 'current_shipping_lot'], false)) || self::to_bool(self::record_value($record, ['currentShippingLot', 'current_shipping_lot'], false))) ? '1' : '0',
        ];

        if (get_option('p1coa_autofill_on_save', '1') === '1') {
            self::apply_product_matching_defaults($map);
        }

        foreach ($map as $key => $value) {
            update_post_meta($post_id, self::META_PREFIX . $key, $value);
        }

        $history = self::record_value($record, ['history'], []);
        $history = is_array($history) ? self::sanitize_history($history) : [];
        update_post_meta($post_id, self::META_PREFIX . 'history', $history);
        return (int) $post_id;
    }

    private static function find_existing_record_id($custom_id, $coa_number) {
        $meta_query = ['relation' => 'OR'];
        if ($custom_id !== '') {
            $meta_query[] = [
                'key' => self::META_PREFIX . 'custom_id',
                'value' => $custom_id,
                'compare' => '=',
            ];
        }
        if ($coa_number !== '') {
            $meta_query[] = [
                'key' => self::META_PREFIX . 'coa_number',
                'value' => $coa_number,
                'compare' => '=',
            ];
        }

        if (count($meta_query) === 1) {
            return 0;
        }

        $posts = get_posts([
            'post_type' => self::CPT,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => 1,
            'fields' => 'ids',
            'meta_query' => $meta_query,
        ]);

        return !empty($posts) ? (int) $posts[0] : 0;
    }

    public static function export_json() {
        if (!current_user_can('manage_options') || !check_admin_referer('p1coa_export_json')) {
            wp_die('Unauthorized');
        }

        $query = new WP_Query([
            'post_type' => self::CPT,
            'post_status' => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC',
            'no_found_rows' => true,
        ]);

        $records = [];
        foreach ($query->posts as $post) {
            $records[] = self::build_record($post->ID);
        }

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="phase-one-coas-' . gmdate('Y-m-d') . '.json"');
        echo wp_json_encode($records, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function render_settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        echo '<div class="wrap p1coa-tools-page">';
        echo '<section class="p1coa-tools-hero"><div class="p1coa-tools-hero-copy"><span class="p1coa-tools-kicker">PHASE ONE · SYSTEM CONTROL</span><h1>COA Settings</h1><p>Control lot behavior, WooCommerce synchronization and secure frontend access from one focused workspace.</p></div><div class="p1coa-tools-hero-badge"><span class="dashicons dashicons-shield-alt"></span><span><strong>Protected settings</strong><small>WordPress permissions active</small></span></div></section>';
        echo '<form method="post" action="options.php">';
        settings_fields('p1coa_settings');

        echo '<div class="p1coa-settings-grid">';
        echo '<div class="p1coa-tool-card">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-controls-repeat"></span></span><div><h2>Current shipping lot</h2><p>Keep one clear active certificate for each product family.</p></div></div>';
        echo '<label class="p1coa-setting-option"><input type="checkbox" name="p1coa_auto_unmark_current" value="1" ' . checked(get_option('p1coa_auto_unmark_current', '1'), '1', false) . '><span class="p1coa-setting-switch"></span><span class="p1coa-setting-option-copy"><strong>Automatically replace the previous current lot</strong><small>When a new COA becomes current, other COAs for the same product or compound are unmarked automatically.</small></span></label>';
        echo '</div>';

        echo '<div class="p1coa-tool-card">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-cart"></span></span><div><h2>WooCommerce matching</h2><p>Keep product IDs, variation IDs and SKUs aligned with each certificate.</p></div></div>';
        echo '<label class="p1coa-setting-option"><input type="checkbox" name="p1coa_autofill_on_save" value="1" ' . checked(get_option('p1coa_autofill_on_save', '1'), '1', false) . '><span class="p1coa-setting-switch"></span><span class="p1coa-setting-option-copy"><strong>Synchronize product data on save</strong><small>Updates Woo IDs, parent IDs, variation IDs and SKUs from the selected WooCommerce product.</small></span></label>';
        echo '</div>';

        echo '<div class="p1coa-tool-card">';
        echo '<div class="p1coa-tool-card-head"><span class="p1coa-tool-card-icon"><span class="dashicons dashicons-admin-site-alt3"></span></span><div><h2>External frontend access</h2><p>Add approved Astro or storefront origins, one per line. Leave empty for same-domain access only.</p></div></div>';
        echo '<textarea name="p1coa_cors_origins" rows="6" class="large-text code" placeholder="https://phaseonelabz.com&#10;https://staging.phaseonelabz.com">' . esc_textarea(get_option('p1coa_cors_origins', '')) . '</textarea>';
        echo '</div>';
        echo '</div>';

        echo '<div class="p1coa-settings-actions"><span>Changes apply to future saves and API requests.</span>';
        submit_button('Save Settings', 'primary', 'submit', false);
        echo '</div>';
        echo '</form>';
        echo '</div>';
    }

    public static function maybe_add_cors_headers($served, $result, $request, $server) {
        if (!$request instanceof WP_REST_Request) {
            return $served;
        }

        $route = $request->get_route();
        if (strpos($route, '/' . self::REST_NAMESPACE . '/coas') !== 0) {
            return $served;
        }

        $origins_raw = (string) get_option('p1coa_cors_origins', '');
        if ($origins_raw === '') {
            return $served;
        }

        $allowed = self::parse_list($origins_raw);
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? esc_url_raw(wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';

        if ($origin && (in_array('*', $allowed, true) || in_array($origin, $allowed, true))) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
            header('Access-Control-Expose-Headers: X-P1COA-Source, X-P1COA-Count, X-P1COA-Generated-At');
        }

        return $served;
    }
}

register_activation_hook(__FILE__, ['Phase_One_COA_Manager', 'activate']);
register_deactivation_hook(__FILE__, ['Phase_One_COA_Manager', 'deactivate']);
Phase_One_COA_Manager::init();
