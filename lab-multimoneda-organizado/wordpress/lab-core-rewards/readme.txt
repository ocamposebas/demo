=== LAB_CORE Rewards ===
Contributors: labcore
Requires at least: 6.4
Requires PHP: 7.4
Stable tag: 1.1.1

Sistema auditable de puntos basado en COP y canje multimoneda.

== Installation ==
1. Instala y activa WooCommerce y LAB_CORE Accounts.
2. Sube lab-core-rewards-1.1.1.zip en Plugins > Añadir plugin.
3. Actívalo. La tabla del libro de puntos se crea automáticamente.
4. Revisa WooCommerce > LAB_CORE Rewards para confirmar la tasa USD/COP.

== Rules ==
* Cada COP 1.000 elegibles completos = 1 punto, redondeado hacia abajo.
* 1.000 puntos = COP 50.000 o su equivalente dinámico en USD.
* El descuento nunca puede superar el subtotal de la orden.
* No se otorgan puntos por envío, impuestos ni descuentos pagados con puntos.
* Las reservas expiran en 30 minutos; se liberan en órdenes fallidas o canceladas.
* Los puntos se revierten en órdenes totalmente reembolsadas.

La tasa proviene de https://open.er-api.com/v6/latest/USD, se cachea 6 horas y conserva un respaldo máximo de 7 días.
