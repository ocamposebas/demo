import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(scriptDirectory, "../omnisend-emails");

const emails = [
  {
    file: "01-carrito-seleccion-guardada.html",
    workflow: "Carrito abandonado",
    stage: "01",
    eyebrow: "CARRITO GUARDADO // SECUENCIA 01 DE 03",
    title: "Tu selección<br><span style=\"color:#67e8f9;\">sigue aquí.</span>",
    lead: "Guardamos los productos que elegiste para que puedas continuar tu compra cuando estés listo.",
    note: "Revisa tu selección, disponibilidad y documentación antes de continuar.",
    cta: "RECUPERAR MI CARRITO",
    subject: "Tu selección sigue aquí",
    preheader: "Retoma tu selección de LAB_CORE en un clic.",
  },
  {
    file: "02-carrito-continuar-seleccion.html",
    workflow: "Carrito abandonado",
    stage: "02",
    eyebrow: "CARRITO GUARDADO // SECUENCIA 02 DE 03",
    title: "¿Continuamos donde<br><span style=\"color:#67e8f9;\">lo dejaste?</span>",
    lead: "Tu selección sigue preparada. Puedes revisar los productos y continuar sin empezar de nuevo.",
    note: "Si tienes preguntas sobre tu pedido o la documentación, estamos para ayudarte.",
    cta: "CONTINUAR CON MI SELECCIÓN",
    subject: "¿Continuamos? Tu carrito te espera",
    preheader: "Tus productos siguen disponibles para continuar.",
  },
  {
    file: "03-carrito-ultimo-recordatorio.html",
    workflow: "Carrito abandonado",
    stage: "03",
    eyebrow: "CARRITO GUARDADO // SECUENCIA 03 DE 03",
    title: "Un último<br><span style=\"color:#67e8f9;\">recordatorio.</span>",
    lead: "Este es el último correo de esta secuencia. Si todavía te interesa tu selección, puedes retomarla desde aquí.",
    note: "Sin presión ni cargos automáticos. Tú decides si deseas continuar.",
    cta: "REVISAR MI CARRITO",
    subject: "Un último recordatorio sobre tu carrito",
    preheader: "Revisa tu selección antes de que finalice esta secuencia.",
  },
  {
    file: "04-checkout-pendiente.html",
    workflow: "Checkout abandonado",
    stage: "01",
    eyebrow: "CHECKOUT SEGURO // SECUENCIA 01 DE 03",
    title: "Tu checkout quedó<br><span style=\"color:#67e8f9;\">pendiente.</span>",
    lead: "Tu pedido todavía no se ha completado. Regresa de forma segura para revisar los datos y finalizarlo.",
    note: "Podrás revisar todos los detalles antes de confirmar el pago.",
    cta: "VOLVER AL CHECKOUT",
    subject: "Tu checkout quedó pendiente",
    preheader: "Tu pedido está listo para ser revisado y completado.",
  },
  {
    file: "05-checkout-listo.html",
    workflow: "Checkout abandonado",
    stage: "02",
    eyebrow: "CHECKOUT SEGURO // SECUENCIA 02 DE 03",
    title: "Todo está listo<br><span style=\"color:#67e8f9;\">para continuar.</span>",
    lead: "Conservamos tu selección para que puedas retomar el checkout sin volver a empezar.",
    note: "¿Necesitas ayuda? Escríbenos y revisaremos tu caso contigo.",
    cta: "CONTINUAR CHECKOUT",
    subject: "Tu selección está lista para continuar",
    preheader: "Regresa a tu checkout seguro cuando estés listo.",
  },
  {
    file: "06-checkout-ultimo-recordatorio.html",
    workflow: "Checkout abandonado",
    stage: "03",
    eyebrow: "CHECKOUT SEGURO // SECUENCIA 03 DE 03",
    title: "¿Quieres completar<br><span style=\"color:#67e8f9;\">tu pedido?</span>",
    lead: "Este es el último recordatorio. Puedes volver para revisar todos los detalles antes de confirmar.",
    note: "No se realizará ningún cargo hasta que tú lo autorices.",
    cta: "REVISAR Y COMPLETAR",
    subject: "¿Quieres completar tu pedido?",
    preheader: "Último recordatorio para revisar tu checkout pendiente.",
  },
];

const dynamicAssignments = `[% assign cart_items = event.raw.line_items | default: event.raw.lineItems | default: event.line_items | default: event.lineItems %]
[% assign recovery_url = event.raw.abandonedCheckoutURL | default: event.raw.abandoned_checkout_url | default: event.abandonedCheckoutURL | default: event.abandoned_checkout_url | default: abandoned_cart.recover_url | default: 'https://labcorepep.com/cart' %]
[% assign cart_currency = event.raw.currency | default: event.currency | default: 'USD' %]`;

function renderEmail(email) {
  return `${dynamicAssignments}

<!-- ASUNTO: ${email.subject} -->
<!-- PREHEADER: ${email.preheader} -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
  ${email.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<style>
  @media only screen and (max-width: 620px) {
    .lab-shell { width: 100% !important; }
    .lab-pad { padding-left: 20px !important; padding-right: 20px !important; }
    .lab-title { font-size: 34px !important; line-height: 38px !important; }
    .lab-product-image,
    .lab-product-copy { display: block !important; width: auto !important; border-right: 0 !important; }
    .lab-product-image { border-bottom: 1px solid #17324d !important; }
    .lab-product-image img { width: 180px !important; max-width: 70% !important; }
    .lab-trust { display: block !important; width: auto !important; border-right: 0 !important; border-bottom: 1px solid #17324d !important; }
    .lab-trust-last { border-bottom: 0 !important; }
    .lab-button { display: block !important; }
  }
</style>

<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#020617" style="width:100%;margin:0;background-color:#020617;border-collapse:collapse;color-scheme:dark;">
  <tr>
    <td align="center" style="padding:18px 8px 28px;">
      <table class="lab-shell" role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#071426" style="width:100%;max-width:600px;background-color:#071426;border:1px solid #164e63;border-collapse:separate;border-spacing:0;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="height:4px;line-height:4px;font-size:4px;background-color:#67e8f9;">&nbsp;</td>
        </tr>

        <tr>
          <td class="lab-pad" style="padding:24px 34px 18px;background-color:#050d1b;border-bottom:1px solid #13283f;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td valign="middle">
                  <a href="https://labcorepep.com/" style="text-decoration:none;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:23px;line-height:26px;font-weight:900;letter-spacing:1.8px;color:#f8fafc;">
                      LAB<span style="color:#67e8f9;">_CORE</span>
                    </p>
                    <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:8px;line-height:11px;font-weight:700;letter-spacing:2.2px;color:#64748b;">
                      INVESTIGACIÓN DE LABORATORIO
                    </p>
                  </a>
                </td>
                <td width="74" align="right" valign="middle">
                  <span style="display:inline-block;padding:7px 9px;background-color:#0b1b31;border:1px solid #164e63;border-radius:999px;font-family:'Courier New',Courier,monospace;font-size:9px;line-height:11px;font-weight:700;letter-spacing:1px;color:#a5f3fc;">
                    ${email.stage}/03
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" align="left" style="padding:34px 46px 8px;background-color:#071426;">
            <span style="display:inline-block;padding:7px 10px;background-color:#083344;border:1px solid #155e75;border-radius:7px;font-family:'Courier New',Courier,monospace;font-size:9px;line-height:12px;font-weight:700;letter-spacing:1.2px;color:#a5f3fc;">
              ${email.eyebrow}
            </span>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" style="padding:17px 46px 0;background-color:#071426;">
            <h1 class="lab-title" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:42px;line-height:46px;font-weight:900;letter-spacing:-1.4px;color:#f8fafc;">
              ${email.title}
            </h1>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" style="padding:17px 46px 10px;background-color:#071426;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#cbd5e1;">
              Hola [[ contact.first_name | default: 'investigador' ]], ${email.lead}
            </p>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" style="padding:10px 46px 26px;background-color:#071426;">
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate;">
              <tr>
                <td align="center" bgcolor="#67e8f9" style="background-color:#67e8f9;border:1px solid #a5f3fc;border-radius:12px;">
                  <a class="lab-button" href="[[ recovery_url ]]" style="display:inline-block;padding:15px 24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;font-weight:900;letter-spacing:1px;color:#020617;text-decoration:none;">
                    ${email.cta}&nbsp;&nbsp;&#8594;
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:15px;color:#64748b;">
              ${email.note}
            </p>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" style="padding:0 34px 14px;background-color:#071426;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="height:1px;line-height:1px;font-size:1px;background-color:#164e63;">&nbsp;</td>
                <td width="180" align="center">
                  <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;line-height:12px;font-weight:700;letter-spacing:1.3px;color:#67e8f9;">
                    TU SELECCIÓN
                  </p>
                </td>
                <td style="height:1px;line-height:1px;font-size:1px;background-color:#164e63;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        [% if cart_items %]
          [% for item in cart_items %]
          <tr>
            <td class="lab-pad" style="padding:0 34px 13px;background-color:#071426;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0b1b31" style="width:100%;background-color:#0b1b31;border:1px solid #17324d;border-collapse:separate;border-spacing:0;border-radius:14px;overflow:hidden;">
                <tr>
                  <td class="lab-product-image" width="145" align="center" valign="middle" style="width:145px;padding:16px;background-color:#0e2139;border-right:1px solid #17324d;">
                    <a href="[[ item.productURL | default: item.product_url | default: item.url | default: item.product.url | default: 'https://labcorepep.com/shop' ]]" style="text-decoration:none;">
                      <img src="[[ item.productImageURL | default: item.product_image_url | default: item.imageUrl | default: item.image_url | default: item.image | default: item.product.productImageURL | default: item.product.product_image_url | default: item.product.product_image_urls[0] | default: 'https://labcorepep.com/tarro1.png' ]]" alt="Producto guardado en tu selección" width="113" style="display:block;width:113px;max-width:113px;height:auto;margin:0 auto;border:0;outline:none;">
                    </a>
                  </td>
                  <td class="lab-product-copy" valign="middle" style="padding:18px 20px;">
                    <p style="margin:0 0 6px;font-family:'Courier New',Courier,monospace;font-size:8px;line-height:11px;font-weight:700;letter-spacing:1.1px;color:#67e8f9;">
                      PRODUCTO GUARDADO&nbsp;&nbsp;//&nbsp;&nbsp;CANT.
                      [[ item.productQuantity | default: item.product_quantity | default: item.quantity | default: item.qty | default: '1' ]]
                    </p>
                    <h2 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:800;color:#f8fafc;">
                      [[ item.productTitle | default: item.product_title | default: item.name | default: item.title | default: item.product.name | default: item.product.title | default: 'Producto de investigación LAB_CORE' ]]
                    </h2>
                    <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#94a3b8;">
                      [[ item.productDescription | default: item.product_description | default: item.description | default: item.product.description | default: 'Compuesto destinado exclusivamente a investigación de laboratorio. Consulta la ficha del producto y su documentación disponible.' ]]
                    </p>
                    <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:17px;line-height:21px;font-weight:900;color:#a5f3fc;">
                      [[ cart_currency ]]&nbsp;[[ item.productPrice | default: item.product_price | default: item.price | default: item.product.price | default: '0.00' ]]
                    </p>
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin-top:11px;border-collapse:separate;">
                      <tr>
                        <td bgcolor="#0e7490" style="background-color:#0e7490;border:1px solid #22d3ee;border-radius:8px;">
                          <a href="[[ item.productURL | default: item.product_url | default: item.url | default: item.product.url | default: 'https://labcorepep.com/shop' ]]" style="display:inline-block;padding:9px 12px;font-family:Arial,Helvetica,sans-serif;font-size:8px;line-height:11px;font-weight:900;letter-spacing:.6px;color:#ffffff;text-decoration:none;">
                            VER PRODUCTO
                          </a>
                        </td>
                        <td width="8">&nbsp;</td>
                        <td style="background-color:#071426;border:1px solid #334155;border-radius:8px;">
                          <a href="https://labcorepep.com/coa-library" style="display:inline-block;padding:9px 12px;font-family:Arial,Helvetica,sans-serif;font-size:8px;line-height:11px;font-weight:900;letter-spacing:.6px;color:#cbd5e1;text-decoration:none;">
                            CONSULTAR COA
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          [% endfor %]
        [% else %]
          <tr>
            <td class="lab-pad" style="padding:0 34px 14px;background-color:#071426;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#0b1b31" style="width:100%;background-color:#0b1b31;border:1px solid #17324d;border-collapse:separate;border-radius:14px;">
                <tr>
                  <td align="center" style="padding:24px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:21px;font-weight:800;color:#f8fafc;">Tu selección está lista.</p>
                    <p style="margin:7px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:17px;color:#94a3b8;">Vuelve a LAB_CORE para revisar los productos y la documentación disponible.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        [% endif %]

        <tr>
          <td class="lab-pad" style="padding:8px 34px 18px;background-color:#071426;">
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#050d1b" style="width:100%;background-color:#050d1b;border:1px solid #17324d;border-collapse:separate;border-spacing:0;border-radius:12px;overflow:hidden;">
              <tr>
                <td class="lab-trust" width="33.33%" align="center" style="padding:13px 6px;border-right:1px solid #17324d;">
                  <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:8px;line-height:11px;font-weight:700;letter-spacing:1px;color:#67e8f9;">01 // REVISA</p>
                  <p style="margin:3px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:13px;font-weight:700;color:#e2e8f0;">Detalles del producto</p>
                </td>
                <td class="lab-trust" width="33.33%" align="center" style="padding:13px 6px;border-right:1px solid #17324d;">
                  <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:8px;line-height:11px;font-weight:700;letter-spacing:1px;color:#67e8f9;">02 // VERIFICA</p>
                  <p style="margin:3px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:13px;font-weight:700;color:#e2e8f0;">Documentación COA</p>
                </td>
                <td class="lab-trust lab-trust-last" width="33.33%" align="center" style="padding:13px 6px;">
                  <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:8px;line-height:11px;font-weight:700;letter-spacing:1px;color:#67e8f9;">03 // CONTINÚA</p>
                  <p style="margin:3px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:13px;font-weight:700;color:#e2e8f0;">Checkout seguro</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" align="center" style="padding:8px 34px 30px;background-color:#071426;">
            <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:21px;font-weight:800;color:#f8fafc;">
              ¿LISTO PARA CONTINUAR?
            </p>
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:separate;">
              <tr>
                <td align="center" bgcolor="#67e8f9" style="background-color:#67e8f9;border:1px solid #a5f3fc;border-radius:12px;">
                  <a class="lab-button" href="[[ recovery_url ]]" style="display:inline-block;padding:15px 24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:14px;font-weight:900;letter-spacing:1px;color:#020617;text-decoration:none;">
                    ${email.cta}&nbsp;&nbsp;&#8594;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="lab-pad" align="center" style="padding:23px 34px;background-color:#050d1b;border-top:1px solid #17324d;">
            <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;font-weight:700;color:#e2e8f0;">
              ¿Necesitas ayuda con tu pedido?
            </p>
            <p style="margin:0 0 15px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#94a3b8;">
              Escríbenos a <a href="mailto:info@labcorepep.com" style="color:#67e8f9;text-decoration:underline;">info@labcorepep.com</a>
            </p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:15px;color:#64748b;">
              Todos los productos se ofrecen exclusivamente para investigación legítima de laboratorio. No son medicamentos ni están destinados al consumo humano, uso veterinario, diagnóstico o tratamiento.
            </p>
            <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:9px;line-height:15px;color:#64748b;">
              © [[ current_date | date:'%Y' ]] LAB_CORE ·
              <a href="https://labcorepep.com/privacy-policy" style="color:#94a3b8;text-decoration:underline;">Privacidad</a>
              &nbsp;·&nbsp;
              <a href="[[ preference_link ]]" style="color:#94a3b8;text-decoration:underline;">Preferencias</a>
              &nbsp;·&nbsp;
              <a href="[[ unsubscribe_link ]]" style="color:#94a3b8;text-decoration:underline;">Cancelar suscripción</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="height:4px;line-height:4px;font-size:4px;background-color:#67e8f9;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
}

await mkdir(outputDirectory, { recursive: true });

for (const email of emails) {
  await writeFile(path.join(outputDirectory, email.file), renderEmail(email), "utf8");
}

const readme = `# Plantillas de recuperación LAB_CORE para Omnisend

Estas seis plantillas usan Liquid de Omnisend para insertar dinámicamente los productos enviados por la web. No necesitan JavaScript en el navegador.

## Orden recomendado

| Archivo | Automatización | Envío | Asunto | Preheader |
| --- | --- | --- | --- | --- |
${emails.map((email, index) => `| ${email.file} | ${email.workflow} | ${index % 3 === 0 ? "1 hora" : index % 3 === 1 ? "12 horas" : "24 horas"} | ${email.subject} | ${email.preheader} |`).join("\n")}

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
`;

await writeFile(path.join(outputDirectory, "README.md"), readme, "utf8");

console.log(`Generadas ${emails.length} plantillas en ${outputDirectory}`);
