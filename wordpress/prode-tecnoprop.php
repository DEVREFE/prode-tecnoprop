<?php
/**
 * Plugin Name:  Prode Tecnoprop 2026
 * Plugin URI:   https://tecnoprop.ar
 * Description:  Integra el Prode Digital del Mundial 2026 en WordPress.
 *               Crea la página /prode con redirect a prode.tecnoprop.ar
 *               y ofrece un shortcode [prode_embed] para incrustar la app.
 * Version:      1.0.0
 * Author:       Tecnoprop
 * Author URI:   https://tecnoprop.ar
 * License:      GPL v2 or later
 */

defined('ABSPATH') || exit;

// ── Constantes ────────────────────────────────────────────────────
define('PRODE_APP_URL',   'https://prode.tecnoprop.ar');
define('PRODE_PAGE_SLUG', 'prode');

// ================================================================
// 1. ACTIVACIÓN — crear página /prode automáticamente
// ================================================================

register_activation_hook(__FILE__, 'prode_tecnoprop_activate');

function prode_tecnoprop_activate() {
    // Verificar si la página ya existe
    $existing = get_page_by_path(PRODE_PAGE_SLUG);
    if ($existing) return;

    wp_insert_post([
        'post_title'   => 'Prode Digital Tecnoprop 2026',
        'post_name'    => PRODE_PAGE_SLUG,
        'post_content' => '<!-- Manejado por el plugin Prode Tecnoprop -->',
        'post_status'  => 'publish',
        'post_type'    => 'page',
        'meta_input'   => ['_prode_managed' => '1'],
    ]);
}

// ================================================================
// 2. REDIRECT — tecnoprop.ar/prode → prode.tecnoprop.ar
// ================================================================

add_action('template_redirect', 'prode_tecnoprop_redirect');

function prode_tecnoprop_redirect() {
    if (!is_page(PRODE_PAGE_SLUG)) return;

    // Preservar query strings (ej: ?ref=ABC123)
    $query = '';
    if (!empty($_SERVER['QUERY_STRING'])) {
        $query = '?' . sanitize_text_field($_SERVER['QUERY_STRING']);
    }

    // 301 permanente para SEO
    wp_redirect(PRODE_APP_URL . $query, 301);
    exit;
}

// ================================================================
// 3. SHORTCODE [prode_embed] — embeber la app en cualquier página
//
// Uso: [prode_embed height="800px"]
// ================================================================

add_shortcode('prode_embed', 'prode_tecnoprop_shortcode');

function prode_tecnoprop_shortcode($atts) {
    $atts = shortcode_atts([
        'height' => '700px',
        'page'   => '',   // ej: page="ranking" → prode.tecnoprop.ar/ranking
    ], $atts, 'prode_embed');

    $url = PRODE_APP_URL;
    if (!empty($atts['page'])) {
        $url .= '/' . sanitize_text_field($atts['page']);
    }

    $height = esc_attr($atts['height']);
    $url    = esc_url($url);

    return sprintf(
        '<div class="prode-embed-wrapper" style="width:100%%;overflow:hidden;border-radius:16px;">
            <iframe
                src="%s"
                width="100%%"
                height="%s"
                frameborder="0"
                allow="clipboard-write"
                loading="lazy"
                title="Prode Digital Tecnoprop 2026"
                style="border:none;display:block;">
            </iframe>
        </div>',
        $url,
        $height
    );
}

// ================================================================
// 4. SEO — meta tags Open Graph para /prode
// ================================================================

add_action('wp_head', 'prode_tecnoprop_og_tags');

function prode_tecnoprop_og_tags() {
    if (!is_page(PRODE_PAGE_SLUG)) return;
    ?>
    <!-- Open Graph: Prode Tecnoprop 2026 -->
    <meta property="og:title"       content="Prode Digital Tecnoprop · Mundial 2026" />
    <meta property="og:description" content="No mires el Mundial. Jugalo. Pronosticá todos los partidos y ganá premios." />
    <meta property="og:url"         content="<?php echo esc_url(home_url('/prode')); ?>" />
    <meta property="og:type"        content="website" />
    <meta property="og:image"       content="<?php echo esc_url(plugins_url('assets/og-image.png', __FILE__)); ?>" />
    <meta property="og:locale"      content="es_AR" />

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="Prode Tecnoprop · Mundial 2026" />
    <meta name="twitter:description" content="No mires el Mundial. Jugalo." />

    <!-- Canonical → evitar duplicate content -->
    <link rel="canonical" href="<?php echo esc_url(PRODE_APP_URL); ?>" />
    <?php
}

// ================================================================
// 5. WIDGET en el sidebar de WordPress
// ================================================================

class Prode_Tecnoprop_Widget extends WP_Widget {

    public function __construct() {
        parent::__construct(
            'prode_tecnoprop_widget',
            'Prode Tecnoprop 2026',
            ['description' => 'Muestra el countdown y CTA del Prode']
        );
    }

    public function widget($args, $instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'Prode del Mundial';
        echo $args['before_widget'];
        echo $args['before_title'] . esc_html($title) . $args['after_title'];
        ?>
        <div style="background:linear-gradient(135deg,#0d1a2e,#071121);border:1px solid rgba(54,169,224,0.2);border-radius:14px;padding:20px;text-align:center;font-family:system-ui,sans-serif;">
            <div style="font-size:28px;margin-bottom:8px;">🌍⚽</div>
            <div style="color:#ffffff;font-size:16px;font-weight:700;margin-bottom:4px;">Prode Digital 2026</div>
            <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:16px;">No mires el Mundial. Jugalo.</div>
            <a href="<?php echo esc_url(home_url('/prode')); ?>"
               style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#36A9E0,#1D70B7);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:13px;">
                Participar Gratis →
            </a>
        </div>
        <?php
        echo $args['after_widget'];
    }

    public function form($instance) {
        $title = !empty($instance['title']) ? $instance['title'] : 'Prode del Mundial';
        printf(
            '<p><label for="%s">Título:</label><input class="widefat" id="%s" name="%s" type="text" value="%s"></p>',
            $this->get_field_id('title'),
            $this->get_field_id('title'),
            $this->get_field_name('title'),
            esc_attr($title)
        );
    }

    public function update($new_instance, $old_instance) {
        $instance['title'] = sanitize_text_field($new_instance['title'] ?? '');
        return $instance;
    }
}

add_action('widgets_init', fn() => register_widget('Prode_Tecnoprop_Widget'));

// ================================================================
// 6. MENÚ DE ADMIN en WordPress
// ================================================================

add_action('admin_menu', 'prode_tecnoprop_admin_menu');

function prode_tecnoprop_admin_menu() {
    add_menu_page(
        'Prode Tecnoprop',
        'Prode 2026',
        'manage_options',
        'prode-tecnoprop',
        'prode_tecnoprop_admin_page',
        'dashicons-awards',
        30
    );
}

function prode_tecnoprop_admin_page() {
    ?>
    <div class="wrap">
        <h1>⚽ Prode Digital Tecnoprop 2026</h1>
        <div style="background:#fff;padding:24px;border-radius:8px;border:1px solid #ddd;max-width:600px;">
            <h2>Estado del plugin</h2>
            <table class="widefat" style="margin-bottom:20px;">
                <tbody>
                    <tr>
                        <td><strong>URL de la app</strong></td>
                        <td><a href="<?php echo esc_url(PRODE_APP_URL); ?>" target="_blank"><?php echo esc_html(PRODE_APP_URL); ?></a></td>
                    </tr>
                    <tr>
                        <td><strong>Página de WordPress</strong></td>
                        <td><a href="<?php echo esc_url(home_url('/prode')); ?>" target="_blank"><?php echo esc_url(home_url('/prode')); ?></a></td>
                    </tr>
                    <tr>
                        <td><strong>Redirect</strong></td>
                        <td><span style="color:green;">✓ Activo (301)</span></td>
                    </tr>
                </tbody>
            </table>

            <h2>Shortcodes disponibles</h2>
            <p>Usá estos shortcodes en cualquier página o entrada de WordPress:</p>
            <code>[prode_embed]</code> — Embebe la app completa<br><br>
            <code>[prode_embed height="600px"]</code> — Con altura personalizada<br><br>
            <code>[prode_embed page="ranking"]</code> — Abre en la página de ranking<br><br>
            <code>[prode_embed page="register"]</code> — Abre el registro directamente

            <h2 style="margin-top:24px;">Panel de administración</h2>
            <p>
                <a href="<?php echo esc_url(PRODE_APP_URL . '/admin'); ?>" target="_blank" class="button button-primary">
                    Abrir panel admin →
                </a>
            </p>
        </div>
    </div>
    <?php
}
