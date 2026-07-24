# LAB_CORE — Integración multimoneda

La tienda usa tres precios manuales por producto y por variación:

- USD — Estados Unidos y moneda de respaldo.
- COP — Colombia.
- MXN — México.

## Componentes

### WordPress / WooCommerce

Instala y activa:

`wordpress/labcore-multicurrency-prices-manager.zip`

El panel aparece en:

`WooCommerce → Precios Multimoneda`

Completa el precio normal y, cuando corresponda, el precio de oferta para cada producto simple y cada variación. Una variante sin precio en la moneda seleccionada no puede añadirse al carrito ni pagarse.

### Astro / React

La integración está distribuida en:

- `src/currency/CurrencyContext.jsx`: estado global, formato, cookie y persistencia.
- `src/currency/CurrencySelector.jsx`: selector visible en la navegación.
- `src/pages/api/currency/detect.js`: detección inicial a través de WooCommerce.
- `src/pages/api/currency/quote.js`: cotización segura del carrito.
- `src/components/cart/CartContext.jsx`: recálculo del carrito al cambiar moneda.
- `src/pages/api/payments/bold/session.js`: validación final y creación de la orden.

## Prioridad para elegir moneda

1. Elección manual guardada del visitante.
2. País detectado por la geolocalización de WooCommerce.
3. Idioma/región del navegador como respaldo.
4. USD como respaldo final.

Mapa inicial:

- CO → COP
- MX → MXN
- Cualquier otro país → USD

La elección manual se guarda en `localStorage` y en la cookie `labcore_currency` durante un año.

## Seguridad de precios

El precio mostrado por el navegador nunca se usa como fuente definitiva para crear la orden. Antes de cobrar:

1. Astro envía producto, variación, cantidad y moneda al endpoint de cotización.
2. WordPress consulta los precios manuales guardados por el plugin.
3. El servidor valida existencia, inventario y precio.
4. WooCommerce crea la orden con esa moneda y esos totales.

Esto evita que un cliente modifique el precio desde las herramientas del navegador.

## Checkout Bold

La integración actual envía a Bold órdenes en COP o USD:

- COP: se presenta el checkout con los medios habilitados para Colombia.
- USD: se presenta el checkout disponible para esa moneda.
- MXN: la tienda puede navegar y mantener carrito en MXN, pero el checkout solicita cambiar a USD antes de crear la orden.

Para cobrar MXN de forma nativa será necesario conectar una pasarela que acepte MXN en esta integración.

## Variables de entorno

Conserva las variables privadas únicamente en el servidor. Usa `.env.example` como referencia. El proyecto entregado no incluye `.env` para evitar distribuir credenciales.

Variables principales:

- `WOOCOMMERCE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `WORDPRESS_API_URL`
- `BOLD_IDENTITY_KEY`
- `BOLD_SECRET_KEY`
- `BOLD_ENVIRONMENT`
- `BOLD_WEBHOOK_SECRET`
- `SITE_URL`

## Pruebas antes de publicar

1. Configura un producto simple en las tres monedas.
2. Configura todas las variaciones de un producto variable.
3. Abre la tienda en una ventana privada.
4. Cambia USD → COP → MXN desde el selector.
5. Agrega una variante y verifica que el carrito se recalcule.
6. En COP y USD, inicia el pago y confirma el total de Bold.
7. En MXN, confirma que el checkout obliga a cambiar a USD.
8. Realiza una orden de prueba por moneda admitida y verifica la moneda guardada en WooCommerce.
