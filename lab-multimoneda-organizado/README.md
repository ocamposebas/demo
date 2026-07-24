# LAB_CORE

Tienda bilingüe de compuestos para investigación construida con Astro, React y Tailwind CSS. El catálogo y las cuentas se integran con WooCommerce; el checkout utiliza Bold y los precios admiten USD, COP y MXN.

## Desarrollo local

Requiere Node.js 24 o una versión compatible con `package.json`.

```sh
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:4321`.

## Comandos

```sh
npm run dev      # servidor de desarrollo
npm run build    # compilación para Vercel
npm run preview  # vista previa de producción
```

## Configuración principal

Crea un archivo `.env` local y configura, según los flujos que vayas a utilizar:

- `PUBLIC_SITE_URL` o `SITE_URL`
- `WOOCOMMERCE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `BOLD_IDENTITY_KEY`, `BOLD_SECRET_KEY` y `BOLD_WEBHOOK_SECRET`
- `OMNISEND_API_KEY`

Las credenciales no deben añadirse al repositorio. La documentación específica de precios y monedas está en [`MULTICURRENCY.md`](./MULTICURRENCY.md). Los plugins de WordPress y sus scripts de empaquetado se encuentran en [`wordpress`](./wordpress).

## Estructura

- `src/pages`: páginas Astro y endpoints del servidor.
- `src/components`: experiencias React, catálogo, carrito, checkout y cuenta.
- `src/i18n`: traducciones y selección independiente de idioma.
- `src/currency`: detección, persistencia y formato de moneda.
- `public`: recursos públicos de marca y producto.
