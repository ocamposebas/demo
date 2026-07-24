# Plantillas de recuperación LAB_CORE para Omnisend

Estas seis plantillas usan Liquid de Omnisend para insertar dinámicamente los productos enviados por la web. No necesitan JavaScript en el navegador.

## Orden recomendado

| Archivo | Automatización | Envío | Asunto | Preheader |
| --- | --- | --- | --- | --- |
| 01-carrito-seleccion-guardada.html | Carrito abandonado | 1 hora | Tu selección sigue aquí | Retoma tu selección de LAB_CORE en un clic. |
| 02-carrito-continuar-seleccion.html | Carrito abandonado | 12 horas | ¿Continuamos? Tu carrito te espera | Tus productos siguen disponibles para continuar. |
| 03-carrito-ultimo-recordatorio.html | Carrito abandonado | 24 horas | Un último recordatorio sobre tu carrito | Revisa tu selección antes de que finalice esta secuencia. |
| 04-checkout-pendiente.html | Checkout abandonado | 1 hora | Tu checkout quedó pendiente | Tu pedido está listo para ser revisado y completado. |
| 05-checkout-listo.html | Checkout abandonado | 12 horas | Tu selección está lista para continuar | Regresa a tu checkout seguro cuando estés listo. |
| 06-checkout-ultimo-recordatorio.html | Checkout abandonado | 24 horas | ¿Quieres completar tu pedido? | Último recordatorio para revisar tu checkout pendiente. |

## Cómo instalarlas

1. Abre **Automatizaciones** en Omnisend y entra al correo correspondiente.
2. Elimina los bloques visuales anteriores del cuerpo del correo.
3. Añade un bloque **Código HTML / HTML personalizado**.
4. Copia todo el contenido del archivo correspondiente y pégalo en ese bloque.
5. Usa el asunto y preheader de la tabla anterior en la configuración del correo.
6. Configura el remitente como **LAB_CORE**.
7. Guarda y usa **Vista previa dinámica** con un contacto que tenga un evento real de carrito o checkout. El envío de prueba simple puede mostrar etiquetas sin procesar porque no incluye datos del evento.

## Variables dinámicas incluidas

- Productos: intenta event.raw.line_items, event.raw.lineItems, event.line_items y event.lineItems.
- Recuperación: intenta las variantes de abandonedCheckoutURL y termina con abandoned_cart.recover_url.
- Moneda: usa la moneda real del evento, con USD solo como respaldo.
- Producto: incluye fallbacks para título, imagen, descripción, cantidad, precio y URL.
- Cumplimiento: incluye [[ unsubscribe_link ]], [[ preference_link ]] y el aviso de uso exclusivo para investigación.

No reemplaces los corchetes de Omnisend. Las etiquetas [% ... %] y [[ ... ]] deben conservarse exactamente.
