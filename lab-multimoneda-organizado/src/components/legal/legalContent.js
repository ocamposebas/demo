export const LEGAL_VERSION = "2026.07.20";
export const LEGAL_UPDATED_ISO = "2026-07-20";

export const LEGAL_PATHS = {
  privacy: "/privacy-policy",
  terms: "/terms-conditions",
  disclaimer: "/disclaimer",
  waiver: "/waiver-agreement",
};

export const legalCopy = {
  es: {
    ui: {
      legalCenter: "Centro legal // LAB_CORE",
      updated: "Última actualización",
      effective: "Vigente desde",
      version: "Versión",
      contents: "Contenido del documento",
      print: "Imprimir o guardar PDF",
      contact: "Consultas legales y de privacidad",
      related: "Documentos relacionados",
      readFull: "Leer documento",
      plainSummary: "Resumen en lenguaje claro",
      summaryWarning: "Este resumen ayuda a entender el documento, pero no sustituye sus cláusulas completas.",
      operatorTitle: "Identidad del vendedor",
      operatorText: "La entidad legal que actúe como vendedor contractual, junto con su domicilio, datos fiscales y jurisdicción, debe mostrarse en el checkout o en la confirmación antes de aceptar cualquier pago. Si esa información no aparece, no complete la compra y escriba a info@labcorepep.com.",
      acceptanceTitle: "Aceptación expresa",
      acceptanceText: "Al crear una cuenta, usar el sitio, marcar la casilla de aceptación o enviar un pedido, confirma que leyó y aceptó los documentos aplicables en su versión vigente. La casilla del checkout no viene marcada previamente.",
      mandatoryRights: "Nada en estos documentos elimina derechos irrenunciables otorgados por la ley aplicable ni limita responsabilidad que legalmente no pueda limitarse.",
      date: "20 de julio de 2026",
      email: "info@labcorepep.com",
    },
    labels: {
      privacy: "Política de privacidad",
      terms: "Términos y condiciones",
      disclaimer: "Aviso legal",
      waiver: "Acuerdo de exención",
    },
    docs: {
      privacy: {
        code: "LEGAL_01 // DATA",
        title: "Política de",
        accent: "privacidad",
        description: "Explica qué datos recoge LAB_CORE, para qué los utiliza, con quién puede compartirlos y cómo ejercer sus derechos.",
        critical: "LAB_CORE no presta servicios médicos. No envíe historias clínicas, diagnósticos, recetas, datos de pacientes ni otra información médica a través del sitio.",
        highlights: [
          ["Datos mínimos", "Recogemos la información necesaria para cuentas, pedidos, soporte, seguridad y cumplimiento."],
          ["Pagos separados", "El proveedor de pago procesa los datos completos de la tarjeta; LAB_CORE no pretende almacenarlos."],
          ["Control del titular", "Puede solicitar acceso, corrección, eliminación, oposición o retiro del consentimiento cuando corresponda."],
          ["Acceso 21+", "El sitio y sus productos se dirigen exclusivamente a personas de 21 años o más."],
        ],
        sections: [
          {
            id: "scope-controller",
            title: "1. Alcance y responsable",
            paragraphs: [
              "Esta Política se aplica a labcore.com y a las páginas, cuentas, formularios, carrito, checkout, alertas de inventario y comunicaciones vinculadas a LAB_CORE (el \"Sitio\"). LAB_CORE actúa como nombre comercial de la entidad vendedora identificada antes del pago y en la confirmación del pedido.",
              "Para consultas o para ejercer derechos, escriba a info@labcorepep.com. Incluya el país desde el cual realizó la compra para dirigir su solicitud conforme a la norma aplicable.",
            ],
          },
          {
            id: "data-collected",
            title: "2. Datos que podemos recopilar",
            paragraphs: ["La información depende de cómo use el Sitio. Puede incluir:"],
            bullets: [
              "Identificación y contacto: nombre, correo, teléfono, país y datos de envío o facturación.",
              "Cuenta: nombre de usuario, identificadores internos, preferencias, historial de acceso y credenciales protegidas. No podemos leer su contraseña en texto plano.",
              "Pedido y cumplimiento: artículos, variaciones, cantidades, importes, estado, seguimiento, devoluciones, comunicaciones y confirmaciones de mayoría de edad y uso investigativo.",
              "Pago: estado, referencia, medio y datos antifraude proporcionados por la pasarela. Los datos completos de tarjeta son tratados por el proveedor de pago.",
              "Soporte y marketing: mensajes, formularios de contacto, nombre y correo para novedades o alertas de inventario.",
              "Datos técnicos: dirección IP, navegador, dispositivo, idioma, zona horaria, registros de seguridad, páginas consultadas y eventos necesarios para prevenir abuso.",
              "Almacenamiento local y cookies: sesión, carrito, idioma y constancia local del control de edad durante 30 días.",
            ],
          },
          {
            id: "sources",
            title: "3. Origen de los datos",
            paragraphs: [
              "Recibimos datos directamente de usted, de su navegador o dispositivo, de los proveedores que operan el Sitio y, cuando exista una compra, de la pasarela de pago, transportista, plataforma de comercio electrónico o herramientas antifraude.",
              "No compramos historias clínicas ni construimos perfiles médicos. No use campos libres para comunicar información sensible que no sea necesaria para su pedido.",
            ],
          },
          {
            id: "purposes-bases",
            title: "4. Finalidades y fundamentos",
            paragraphs: ["Tratamos los datos para las siguientes finalidades, según el consentimiento, la relación contractual, obligaciones legales o intereses legítimos permitidos:"],
            bullets: [
              "Crear y proteger cuentas; autenticar sesiones y recuperar contraseñas.",
              "Preparar, verificar, cobrar, enviar y dar soporte a pedidos.",
              "Confirmar edad, aceptación legal, destino y restricciones de uso; prevenir fraude, desvío o uso prohibido.",
              "Responder solicitudes, reclamaciones y consultas de privacidad.",
              "Mantener seguridad, disponibilidad, registros, copias de respaldo y diagnóstico técnico.",
              "Cumplir obligaciones contables, fiscales, regulatorias, aduaneras, de protección al consumidor y requerimientos de autoridad.",
              "Enviar comunicaciones promocionales o alertas solicitadas; puede cancelar estas comunicaciones en cualquier momento.",
            ],
          },
          {
            id: "cookies",
            title: "5. Cookies y almacenamiento local",
            paragraphs: [
              "Usamos tecnologías estrictamente necesarias para mantener la sesión, recordar el carrito, guardar el idioma, evitar mostrar nuevamente el control de edad durante 30 días y recordar si cerró o completó el formulario promocional. Deshabilitarlas puede impedir que funcionen la cuenta o el checkout.",
              "Si en el futuro se incorporan analítica no esencial, publicidad o perfiles, se actualizará esta Política y se solicitará la elección correspondiente cuando la ley lo exija. El Sitio no debe activar esas categorías bajo la etiqueta de \"esenciales\".",
            ],
          },
          {
            id: "sharing",
            title: "6. Destinatarios y proveedores",
            paragraphs: ["Podemos comunicar datos limitados a proveedores que los necesitan para prestar servicios bajo instrucciones y medidas contractuales razonables:"],
            bullets: [
              "Hosting, seguridad, WordPress/WooCommerce, correo transaccional, marketing solicitado mediante Omnisend, soporte y copias de respaldo.",
              "Procesadores de pago, validación antifraude, bancos y redes de pago.",
              "Almacenes, operadores logísticos, transportistas, agentes aduaneros y aseguradoras de envío.",
              "Asesores profesionales, auditores y autoridades cuando sea necesario para cumplir la ley, proteger derechos o responder a un proceso válido.",
              "Una entidad sucesora en una reorganización, financiación, fusión o venta, sujeta a las garantías exigidas por la ley.",
            ],
            note: "LAB_CORE no vende datos personales a cambio de dinero. Tampoco autoriza a proveedores a utilizar los datos para sus propios fines de marketing ajenos al servicio contratado.",
          },
          {
            id: "transfers",
            title: "7. Transferencias internacionales",
            paragraphs: [
              "El Sitio puede operar con infraestructura o proveedores ubicados en Estados Unidos, Colombia, México u otros países. Por ello, sus datos pueden ser almacenados o tratados fuera de su país.",
              "Cuando corresponda, se emplearán mecanismos legales y contractuales para la transferencia, y se limitará la información a lo necesario. Las autoridades extranjeras pueden tener facultades de acceso distintas a las de su jurisdicción.",
            ],
          },
          {
            id: "retention",
            title: "8. Conservación",
            paragraphs: [
              "Conservamos los datos solo durante el tiempo necesario para la finalidad informada y los plazos legales aplicables. Los datos de cuenta se mantienen mientras esté activa y durante un periodo razonable posterior; pedidos y facturación se conservan por obligaciones fiscales, comerciales, aduaneras y de defensa de reclamaciones; marketing, hasta que retire su autorización; y registros técnicos, durante periodos limitados de seguridad.",
              "Las copias de respaldo se eliminan conforme a ciclos programados. Una solicitud de eliminación no obliga a borrar información que deba conservarse por ley, prevención de fraude, seguridad o defensa de derechos; en esos casos quedará restringida.",
            ],
          },
          {
            id: "security",
            title: "9. Seguridad e incidentes",
            paragraphs: [
              "Aplicamos controles administrativos, técnicos y organizativos proporcionales al riesgo, como acceso limitado, sesiones protegidas, cifrado en tránsito, actualización de sistemas y selección de proveedores. Ningún sistema conectado a Internet puede garantizar seguridad absoluta.",
              "Si ocurre un incidente que active una obligación legal de notificación, LAB_CORE evaluará el alcance y notificará a titulares, autoridades u otras partes dentro de los requisitos aplicables.",
            ],
          },
          {
            id: "rights",
            title: "10. Sus derechos",
            paragraphs: ["Dependiendo de su residencia y de la ley aplicable, puede solicitar:"],
            bullets: [
              "Acceso o conocimiento de los datos tratados y una explicación de su uso.",
              "Corrección, actualización o rectificación de datos inexactos.",
              "Eliminación o supresión cuando sea procedente.",
              "Oposición, limitación del tratamiento o retiro del consentimiento.",
              "Portabilidad o copia en formato utilizable, cuando corresponda.",
              "No recibir marketing y presentar una reclamación ante la autoridad competente.",
            ],
            note: "En Colombia puede ejercer los derechos reconocidos por la Ley 1581 de 2012; en México, los derechos ARCO y demás derechos previstos por la LFPDPPP vigente; en Estados Unidos pueden aplicar derechos estatales adicionales. No discriminaremos por ejercer un derecho válido.",
          },
          {
            id: "requests",
            title: "11. Cómo presentar una solicitud",
            paragraphs: [
              "Envíe la solicitud a info@labcorepep.com con el asunto \"Privacidad / Privacy\", su nombre, correo asociado, país, derecho que desea ejercer y la información necesaria para localizar su cuenta o pedido. Podemos pedir verificación razonable de identidad y autoridad para evitar divulgaciones fraudulentas.",
              "Responderemos dentro del plazo exigido por la ley aplicable. Si la solicitud es incompleta, explicaremos qué dato falta. Si se deniega total o parcialmente, comunicaremos la razón cuando legalmente corresponda y las opciones de reclamación disponibles.",
            ],
          },
          {
            id: "marketing-age",
            title: "12. Marketing, menores y terceros",
            paragraphs: [
              "Puede cancelar correos promocionales mediante el enlace de baja o escribiendo a info@labcorepep.com. Aun así, podremos enviar comunicaciones operativas de cuenta, seguridad o pedidos.",
              "El Sitio es para mayores de 21 años y no recopila intencionalmente datos de menores. Si cree que un menor nos proporcionó información, solicite su eliminación. Los sitios de terceros enlazados tienen sus propias políticas y LAB_CORE no controla sus prácticas.",
            ],
          },
          {
            id: "changes-contact",
            title: "13. Cambios y contacto",
            paragraphs: [
              "Podemos actualizar esta Política para reflejar cambios operativos o legales. Publicaremos la nueva fecha y, si el cambio es material, daremos el aviso o solicitaremos consentimiento cuando corresponda. La versión aplicable a una transacción será la presentada al momento de aceptarla, sin perjuicio de obligaciones legales posteriores.",
              "Contacto: info@labcorepep.com. La identidad y dirección de la entidad responsable deben aparecer antes de habilitar pagos y en la documentación de cada transacción.",
            ],
          },
        ],
      },

      terms: {
        code: "LEGAL_02 // CONTRACT",
        title: "Términos y",
        accent: "condiciones",
        description: "Regulan el acceso al sitio, las cuentas, los pedidos y la compra de compuestos vendidos exclusivamente para investigación de laboratorio.",
        critical: "PROHIBICIÓN ABSOLUTA DE USO: ningún producto se vende para consumo, administración, aplicación, diagnóstico, tratamiento o experimentación en seres humanos o animales. No es para uso humano ni veterinario.",
        highlights: [
          ["Solo 21+", "Debe tener al menos 21 años y capacidad legal para contratar."],
          ["Solo investigación", "Compra únicamente para trabajo legítimo de laboratorio, análisis químico o investigación in vitro permitida."],
          ["Venta condicionada", "LAB_CORE puede verificar, rechazar o cancelar pedidos que presenten riesgo regulatorio, de fraude o uso indebido."],
          ["Derechos vigentes", "Las limitaciones nunca desplazan garantías o remedios obligatorios de protección al consumidor."],
        ],
        sections: [
          {
            id: "acceptance",
            title: "1. Aceptación y documentos incorporados",
            paragraphs: [
              "Estos Términos forman un acuerdo vinculante entre usted y la entidad LAB_CORE identificada como vendedora en el checkout o confirmación. Al usar el Sitio, crear una cuenta, marcar la casilla legal o enviar un pedido, acepta estos Términos, la Política de privacidad, el Aviso legal y, para compras, el Acuerdo de exención.",
              "Si actúa por una empresa, universidad o laboratorio, declara tener autoridad para obligarlo. Si no acepta todos los documentos o no puede realizar estas declaraciones, no use el checkout ni compre productos.",
            ],
          },
          {
            id: "eligibility",
            title: "2. Elegibilidad y cuenta",
            bullets: [
              "Debe tener 21 años o más, capacidad legal y no estar suspendido.",
              "Debe proporcionar datos correctos, proteger sus credenciales y notificarnos accesos no autorizados.",
              "No puede crear cuentas con identidad falsa, eludir límites, comprar por cuenta de una persona no elegible ni automatizar pedidos sin autorización.",
              "Es responsable de la actividad realizada desde su cuenta, salvo en la medida en que derive de una falla imputable legalmente a LAB_CORE.",
            ],
          },
          {
            id: "research-only",
            title: "3. Clasificación y uso exclusivamente investigativo",
            paragraphs: [
              "Los productos son reactivos o compuestos destinados exclusivamente a investigación legítima de laboratorio. No son medicamentos, alimentos, suplementos, cosméticos, productos veterinarios ni productos destinados a diagnosticar, tratar, curar, mitigar o prevenir enfermedades.",
              "Las referencias a literatura científica, dianas, vías biológicas o líneas de investigación describen contextos académicos y no constituyen instrucciones de uso, recomendaciones clínicas, promesas de seguridad o eficacia ni autorización regulatoria.",
            ],
            note: "La leyenda \"solo para investigación\" no convierte por sí sola un uso prohibido en legal. La intención, promoción, distribución y uso real deben permanecer dentro de la investigación permitida.",
          },
          {
            id: "prohibited-use",
            title: "4. Usos y conductas prohibidas",
            bullets: [
              "Ingerir, inyectar, inhalar, aplicar, implantar o administrar un producto a una persona o animal.",
              "Usarlo para diagnóstico clínico, tratamiento, prevención, dopaje, mejora de rendimiento, preparación magistral o cualquier aplicación terapéutica.",
              "Revender, reenvasar, fraccionar, relabelar o promocionar el producto para consumo o como producto aprobado.",
              "Proporcionar instrucciones de dosificación, reconstitución, administración humana o veterinaria, o solicitar que LAB_CORE lo haga.",
              "Desviar envíos, falsear destino, usuario final, institución, edad, permisos o documentación aduanera.",
              "Usar el Sitio para fraude, acceso no autorizado, extracción masiva, malware, infracción de propiedad intelectual o violación de ley.",
            ],
          },
          {
            id: "buyer-representations",
            title: "5. Declaraciones del comprador",
            paragraphs: ["Con cada pedido declara y garantiza que:"],
            bullets: [
              "El producto se destinará exclusivamente a investigación lícita y no clínica por personal competente.",
              "Cuenta con instalaciones, controles de ingeniería, equipos de protección, almacenamiento, eliminación y protocolos adecuados al riesgo.",
              "Evaluará independientemente identidad, peligros, compatibilidad, requisitos regulatorios y aptitud para el protocolo antes de manipularlo.",
              "Obtendrá licencias, autorizaciones, registros, permisos de importación y aprobaciones institucionales que sean necesarios.",
              "No depende del Sitio como sustituto de una ficha de seguridad, evaluación de riesgo, asesoría profesional o autorización de una autoridad.",
            ],
          },
          {
            id: "product-information",
            title: "6. Información, imágenes y COA",
            paragraphs: [
              "Intentamos mostrar descripciones, variaciones, inventario, imágenes y documentación analítica con precisión. Las imágenes pueden ser ilustrativas y el empaque puede cambiar sin alterar la referencia. Los datos del lote y COA aplicables prevalecen sobre material genérico.",
              "Un COA informa resultados de una muestra y lote específicos bajo los métodos indicados. No prueba por sí solo esterilidad, ausencia de endotoxinas, estabilidad futura, seguridad biológica, eficacia, legalidad de un uso ni identidad de otro lote. No debe extrapolarse fuera de su alcance.",
            ],
          },
          {
            id: "orders",
            title: "7. Pedidos, verificación y formación del contrato",
            paragraphs: [
              "El carrito y el envío de un pedido son una oferta de compra, no una aceptación automática. Podemos solicitar verificación de identidad, edad, institución, uso previsto, destino o permisos. El contrato se forma cuando la entidad vendedora acepta el pedido por escrito y confirma el pago, salvo que la ley disponga otra cosa.",
              "Podemos rechazar, limitar o cancelar antes del despacho por inventario, error evidente, fraude, sanciones, restricciones de transportista, riesgo de desvío, incumplimiento regulatorio o sospecha razonable de uso prohibido. Si ya se cobró un pedido cancelado por LAB_CORE, se reembolsará el monto correspondiente.",
            ],
          },
          {
            id: "pricing-payment",
            title: "8. Precio, pago e impuestos",
            paragraphs: [
              "Los precios se muestran en la moneda indicada. Antes de confirmar, el checkout debe presentar artículos, cantidades, precio, descuentos, impuestos conocidos, envío y total. Los cargos aduaneros o tributos que no puedan calcularse anticipadamente se informarán como responsabilidad del destinatario cuando legalmente proceda.",
              "El pago será procesado por la pasarela indicada. Usted autoriza el cargo mostrado y declara estar autorizado para usar el medio de pago. Un error tipográfico evidente no obliga a vender al precio erróneo; se le permitirá confirmar el precio correcto o cancelar.",
            ],
          },
          {
            id: "shipping",
            title: "9. Envío, aduanas y recepción",
            paragraphs: [
              "Los plazos son estimaciones salvo compromiso expreso. El comprador debe proporcionar una dirección válida, revisar las reglas de importación y asegurar que una persona autorizada reciba y almacene el producto. LAB_CORE puede usar embalaje discreto sin ocultar información legal o aduanera obligatoria.",
              "La asignación de riesgo, pérdida o propiedad se determinará por la ley aplicable y las condiciones mostradas en el checkout. Ninguna cláusula transfiere al consumidor riesgos que obligatoriamente correspondan al vendedor. Reporte paquetes dañados, incompletos o incorrectos tan pronto como sea posible y conserve embalaje, fotos y lote.",
            ],
          },
          {
            id: "returns",
            title: "10. Cancelaciones, devoluciones y reembolsos",
            paragraphs: [
              "Por la naturaleza sensible, trazable y potencialmente no revendible de los compuestos, las ventas son finales después del despacho cuando la ley lo permita. No se aceptan devoluciones de productos abiertos, manipulados, almacenados fuera de especificación o cuya cadena de custodia no pueda verificarse.",
              "Esta regla no elimina derechos obligatorios por producto incorrecto, daño previo a la entrega, incumplimiento, defecto cubierto, retracto legal aplicable u otra protección irrenunciable. Contacte a info@labcorepep.com sin demora con número de pedido, fotos, lote y descripción. No destruya ni reenvíe el producto hasta recibir instrucciones.",
            ],
          },
          {
            id: "safety",
            title: "11. Manipulación, almacenamiento y eliminación",
            paragraphs: [
              "Solo personal capacitado debe manipular productos bajo protocolos escritos, controles de exposición y normativa aplicable. El comprador debe consultar documentación específica, realizar su propia evaluación de riesgo y mantener el producto protegido contra acceso no autorizado.",
              "Ante exposición accidental, contacte inmediatamente los servicios locales de emergencia o toxicología y proporcione la etiqueta y documentación disponible. LAB_CORE no ofrece instrucciones médicas. La eliminación debe realizarse como residuo químico conforme a la regulación local; no deseche en desagües ni residuos domésticos salvo autorización expresa de la norma aplicable.",
            ],
          },
          {
            id: "warranties",
            title: "12. Garantías y ausencia de asesoría",
            paragraphs: [
              "En la máxima medida permitida, el Sitio se ofrece según disponibilidad y la garantía del producto se limita a la conformidad con la especificación o documentación expresa del lote al momento de entrega. No se garantiza que el Sitio sea ininterrumpido ni que un producto sea apto para un protocolo, resultado o finalidad no declarada y permitida.",
              "LAB_CORE no brinda asesoría médica, veterinaria, regulatoria, legal ni de seguridad química. Nada excluye garantías legales que no puedan renunciarse ni responsabilidad por declaraciones expresas que formen parte obligatoria del contrato.",
            ],
          },
          {
            id: "liability-indemnity",
            title: "13. Responsabilidad e indemnidad",
            paragraphs: [
              "En la máxima medida permitida, LAB_CORE no será responsable por daños indirectos, especiales o consecuenciales derivados de uso humano o veterinario, desvío, almacenamiento inadecuado, mezcla, reenvasado, reventa, incumplimiento legal o un protocolo diseñado por el comprador. Cualquier límite monetario se aplicará solo cuando sea válido y nunca reducirá derechos obligatorios.",
              "Usted indemnizará a LAB_CORE frente a reclamaciones de terceros que resulten de su uso prohibido, falsedad, reventa no autorizada o incumplimiento de estos Términos, excepto en la proporción causada por conducta de LAB_CORE que no pueda excluirse. No se excluye responsabilidad por fraude, dolo, culpa grave, lesión o muerte cuando la ley prohíba hacerlo.",
            ],
          },
          {
            id: "ip-suspension",
            title: "14. Propiedad intelectual y suspensión",
            paragraphs: [
              "Las marcas, diseño, textos, gráficos, base de datos y código del Sitio pertenecen a LAB_CORE o sus licenciantes. Se concede una licencia limitada, revocable y no transferible para consultar y comprar conforme a estos Términos; no para copiar, explotar o crear una apariencia de afiliación.",
              "Podemos suspender cuentas o acceso cuando exista riesgo de seguridad, fraude, uso prohibido o incumplimiento. Cuando sea razonable y legalmente exigido, informaremos la causa y un mecanismo de revisión.",
            ],
          },
          {
            id: "law-general",
            title: "15. Ley aplicable y disposiciones generales",
            paragraphs: [
              "La entidad vendedora y la jurisdicción contractual deben identificarse antes del pago. La relación se regirá por la ley indicada allí, sin privar a consumidores de protecciones obligatorias de su residencia o del lugar de la transacción. Las partes intentarán resolver primero cualquier controversia mediante info@labcorepep.com, sin impedir el acceso a autoridades o tribunales competentes.",
              "Si una cláusula es inválida, se ajustará al mínimo necesario y las demás continuarán. La falta de ejercicio no es renuncia. Estos Términos y los documentos incorporados constituyen el acuerdo sobre el Sitio y los pedidos, salvo condiciones expresas de una orden aceptada. Las cláusulas que por naturaleza deban sobrevivir seguirán vigentes.",
            ],
          },
          {
            id: "changes",
            title: "16. Cambios y contacto",
            paragraphs: [
              "Podemos modificar estos Términos de forma prospectiva. La fecha y versión estarán visibles; los cambios materiales no alterarán retroactivamente un pedido aceptado salvo acuerdo o exigencia legal. El uso posterior a una entrada en vigor constituye aceptación para actividades futuras cuando la ley lo permita.",
              "Contacto: info@labcorepep.com. No complete un pago si el checkout no muestra la entidad vendedora, precio total y condiciones aplicables.",
            ],
          },
        ],
      },

      disclaimer: {
        code: "LEGAL_03 // NOTICE",
        title: "Aviso",
        accent: "legal",
        description: "Aclara el alcance de la información científica, la documentación analítica y las restricciones absolutas de los productos.",
        critical: "SOLO PARA INVESTIGACIÓN DE LABORATORIO. NO PARA USO HUMANO, CONSUMO, ADMINISTRACIÓN, DIAGNÓSTICO, TRATAMIENTO, USO VETERINARIO NI APLICACIÓN CLÍNICA.",
        highlights: [
          ["Sin consejo médico", "El contenido no reemplaza a profesionales médicos, veterinarios, legales o de seguridad química."],
          ["Sin promesas clínicas", "La investigación publicada no demuestra que el producto vendido sea seguro, eficaz o aprobado."],
          ["COA limitado", "Un certificado corresponde al lote, muestra, fecha y métodos expresamente identificados."],
          ["Emergencias", "Ante una exposición, contacte servicios locales de emergencia o toxicología; no busque instrucciones en este sitio."],
        ],
        sections: [
          {
            id: "purpose",
            title: "1. Propósito del Sitio",
            paragraphs: [
              "LAB_CORE ofrece un catálogo y documentación para adquisición de compuestos por compradores adultos destinados exclusivamente a investigación legítima de laboratorio. El Sitio no es una clínica, farmacia, plataforma de telemedicina ni servicio de prescripción.",
              "El contenido busca facilitar identificación de catálogo, trazabilidad y lectura de documentación. No autoriza ningún uso y no sustituye la evaluación independiente del investigador, las fichas de seguridad, protocolos institucionales o requisitos regulatorios.",
            ],
          },
          {
            id: "no-human-use",
            title: "2. Prohibición de uso humano y veterinario",
            paragraphs: [
              "Ningún producto se ofrece para ingestión, inyección, inhalación, aplicación tópica, implante, preparación, dosificación o administración a seres humanos o animales. Tampoco se ofrece para diagnóstico, tratamiento, prevención, mitigación, dopaje, mejora del rendimiento ni para formular medicamentos, suplementos o cosméticos.",
              "Comprar, poseer o recibir un producto no concede autorización para utilizarlo fuera de la ley. LAB_CORE puede negar servicio cuando el lenguaje, destino, patrón de compra o información disponible indiquen posible uso prohibido.",
            ],
          },
          {
            id: "no-advice",
            title: "3. No es asesoría médica ni instrucción de uso",
            paragraphs: [
              "Nombres de compuestos, mecanismos, dianas, estudios, gráficos y resúmenes no son recomendaciones médicas, veterinarias, nutricionales ni de rendimiento. No constituyen diagnóstico, consentimiento informado, pauta, dosificación, reconstitución, protocolo clínico o relación profesional-paciente.",
              "No tome decisiones de salud basadas en este Sitio. LAB_CORE no responderá solicitudes de administración humana o veterinaria. Si tiene una situación de salud, consulte a un profesional habilitado; ante una emergencia o exposición, contacte de inmediato servicios locales de emergencia o toxicología.",
            ],
          },
          {
            id: "research-evidence",
            title: "4. Literatura y evidencia científica",
            paragraphs: [
              "Los estudios citados pueden ser preclínicos, in vitro, en animales, observacionales, preliminares, no replicados o referirse a sustancias, formulaciones y condiciones distintas. Los resultados de investigación no pueden extrapolarse automáticamente a personas, animales, seguridad, eficacia o al producto comercializado.",
              "Las expresiones sobre \"áreas de estudio\", \"líneas de investigación\" o \"avances\" describen temas académicos y deben leerse con sus limitaciones. LAB_CORE no garantiza exactitud permanente de fuentes externas y corregirá errores materiales conocidos cuando sea razonable.",
            ],
          },
          {
            id: "regulatory",
            title: "5. Estado regulatorio",
            paragraphs: [
              "Salvo declaración específica respaldada por documentación oficial, LAB_CORE no afirma que sus productos estén aprobados, autorizados o evaluados por la FDA de Estados Unidos, INVIMA de Colombia, COFEPRIS de México ni otra autoridad para uso humano o veterinario.",
              "La frase \"Research Use Only\" o \"solo para investigación\" describe el uso comercial previsto; no es una aprobación gubernamental, no elimina obligaciones regulatorias y no permite investigación clínica con sujetos. Los compradores deben determinar de forma independiente los requisitos de su actividad y jurisdicción.",
            ],
          },
          {
            id: "coa",
            title: "6. COA, pureza y especificaciones",
            paragraphs: [
              "Un Certificado de Análisis reporta los ensayos realizados sobre una muestra de un lote bajo fecha, método y condiciones indicadas. Una cifra de pureza no equivale a esterilidad, ausencia de endotoxinas o solventes, estabilidad, biodisponibilidad, seguridad, eficacia ni aptitud para uso humano o animal.",
              "Verifique que producto, presentación, lote y documento coincidan. Los resultados tienen incertidumbre y límites metodológicos. Si un atributo no aparece expresamente probado, no debe asumirse. Contacte a LAB_CORE antes de usar un lote en un protocolo si detecta una inconsistencia documental.",
            ],
          },
          {
            id: "site-accuracy",
            title: "7. Exactitud, disponibilidad y terceros",
            paragraphs: [
              "Hacemos esfuerzos razonables para mantener la información, pero inventario, imágenes, empaque, precio y contenido pueden cambiar. Los errores evidentes pueden corregirse antes de aceptar un pedido. Los enlaces a publicaciones, laboratorios o servicios externos se ofrecen como referencia y no implican control, patrocinio o garantía.",
              "El Sitio puede interrumpirse por mantenimiento, seguridad o causas externas. Ninguna visualización, insignia o término como \"verificado\" debe interpretarse más allá de la evidencia específica que la acompaña.",
            ],
          },
          {
            id: "risk",
            title: "8. Riesgo y responsabilidad",
            paragraphs: [
              "Los compuestos de investigación pueden tener propiedades desconocidas y riesgos de exposición, contaminación, incompatibilidad o degradación. Solo personal calificado, en instalaciones adecuadas y con una evaluación documentada, debe manipularlos.",
              "En la máxima medida permitida, LAB_CORE no responde por consecuencias de uso humano o veterinario, desvío, manipulación no autorizada, almacenamiento incorrecto, mezcla, reenvasado o incumplimiento legal. Esta limitación no aplica cuando la ley prohíba excluir responsabilidad o reconozca un remedio obligatorio.",
            ],
          },
          {
            id: "acceptance-contact",
            title: "9. Aceptación, cambios y contacto",
            paragraphs: [
              "Este Aviso forma parte de los Términos. Al continuar en el Sitio o realizar un pedido, reconoce que comprende la naturaleza exclusivamente investigativa y que ninguna información constituye una invitación a uso humano o veterinario.",
              "Podemos actualizar este Aviso; la versión y fecha estarán visibles. Preguntas o reportes de contenido potencialmente confuso: info@labcorepep.com.",
            ],
          },
        ],
      },

      waiver: {
        code: "LEGAL_04 // ACKNOWLEDGMENT",
        title: "Acuerdo de reconocimiento y",
        accent: "exención limitada",
        description: "Documenta las declaraciones del comprador, la asunción de riesgos de laboratorio y las consecuencias de cualquier desvío o uso no autorizado.",
        critical: "ESTE ACUERDO NO AUTORIZA USO HUMANO O VETERINARIO. SI NO PUEDE GARANTIZAR UN DESTINO EXCLUSIVAMENTE INVESTIGATIVO, NO ACEPTE NI COMPRE.",
        highlights: [
          ["Declaración personal", "Confirma edad, competencia, autoridad y destino legítimo de laboratorio."],
          ["Riesgo conocido", "Reconoce que los compuestos pueden tener peligros o propiedades todavía no caracterizados."],
          ["Responsabilidad por desvío", "Asume consecuencias de administración, reventa, relabeling o manejo contrario al acuerdo."],
          ["Exención limitada", "No cubre fraude, culpa grave ni derechos o responsabilidades que la ley prohíba renunciar."],
        ],
        sections: [
          {
            id: "agreement",
            title: "1. Naturaleza del acuerdo",
            paragraphs: [
              "Este Acuerdo de reconocimiento, asunción de riesgo, liberación limitada e indemnidad (el \"Acuerdo\") se celebra entre el comprador y la entidad LAB_CORE identificada como vendedora antes del pago. Complementa los Términos y se aplica a cada producto de investigación comprado o recibido.",
              "Al marcar la casilla del checkout y enviar un pedido, manifiesta aceptación expresa y electrónica. Si compra para una organización, acepta en nombre propio y declara estar autorizado para obligar a la organización en la medida permitida.",
            ],
          },
          {
            id: "age-capacity",
            title: "2. Edad, capacidad y competencia",
            paragraphs: ["Usted declara que:"],
            bullets: [
              "Tiene al menos 21 años y capacidad legal para contratar.",
              "No compra para una persona menor, suspendida o no elegible.",
              "Posee formación y experiencia adecuadas o actúa bajo supervisión institucional competente.",
              "Cuenta con autorización del laboratorio, empresa o institución cuando la compra no sea personal.",
              "La información de identidad, destino, usuario final y uso previsto es completa y verdadera.",
            ],
          },
          {
            id: "sole-purpose",
            title: "3. Finalidad única y prohibiciones",
            paragraphs: [
              "Acepta adquirir, almacenar y utilizar cada producto únicamente para investigación lícita de laboratorio que no involucre administración humana o veterinaria. No lo utilizará como medicamento, suplemento, cosmético, alimento, diagnóstico, tratamiento, prevención, dopaje ni producto clínico.",
              "No ingerirá, inyectará, inhalará, aplicará, implantará, dosificará ni administrará el producto a persona o animal, y no permitirá que terceros lo hagan. Tampoco suministrará instrucciones, muestras o acceso con ese propósito.",
            ],
          },
          {
            id: "risk-acknowledgment",
            title: "4. Reconocimiento de riesgos",
            paragraphs: [
              "Reconoce que los compuestos de investigación pueden carecer de caracterización toxicológica completa y presentar riesgos conocidos o desconocidos de exposición, reacción, contaminación, degradación, incompatibilidad, transporte, almacenamiento o eliminación.",
              "Reconoce que pureza analítica, apariencia, presentación o disponibilidad de un COA no significan esterilidad, seguridad biológica, eficacia, aprobación regulatoria ni aptitud para seres humanos o animales. Asume los riesgos ordinarios inherentes a la manipulación investigativa que permanezcan después de aplicar controles adecuados.",
            ],
          },
          {
            id: "controls",
            title: "5. Deberes de control y custodia",
            bullets: [
              "Realizar una evaluación de riesgo independiente antes de abrir o manipular.",
              "Usar instalaciones, ventilación, contención, equipos de protección, inventario y protocolos apropiados.",
              "Restringir acceso a personal autorizado y mantener trazabilidad de lote y cadena de custodia.",
              "Almacenar y transportar conforme a documentación aplicable, evitando confusión con productos de consumo o clínicos.",
              "Gestionar derrames, exposición y residuos conforme a planes institucionales y ley local.",
            ],
          },
          {
            id: "compliance",
            title: "6. Cumplimiento, importación y usuario final",
            paragraphs: [
              "Usted es responsable de determinar si la compra, importación, posesión, investigación, transferencia y eliminación son legales en el destino. Obtendrá permisos aduaneros, regulatorios, institucionales o de bioseguridad necesarios y no solicitará declaraciones falsas ni clasificación engañosa del envío.",
              "Informará de inmediato a LAB_CORE si cambia el usuario final o el uso previsto, si una autoridad retiene el envío o si descubre desvío, pérdida o acceso no autorizado. LAB_CORE puede detener el pedido y cooperar con procesos legales válidos.",
            ],
          },
          {
            id: "release",
            title: "7. Asunción y liberación limitada",
            paragraphs: [
              "En la máxima medida permitida, usted asume la responsabilidad por reclamaciones, pérdidas o daños causados por su uso prohibido, desvío, administración, reventa no autorizada, relabeling, mezcla, almacenamiento inadecuado o incumplimiento de este Acuerdo, y libera a LAB_CORE respecto de consecuencias derivadas directamente de esas conductas.",
              "La liberación no se aplica a fraude, dolo, culpa grave, incumplimiento de una obligación no renunciable, producto que no corresponda materialmente a la venta aceptada ni lesión o responsabilidad que la ley no permita excluir. No pretende limitar derechos obligatorios de consumidores.",
            ],
          },
          {
            id: "indemnity",
            title: "8. Indemnidad frente a terceros",
            paragraphs: [
              "En la medida permitida, defenderá, indemnizará y mantendrá indemne a LAB_CORE y sus proveedores frente a reclamaciones de terceros, sanciones, costos razonables y daños derivados de una declaración falsa, uso prohibido, distribución no autorizada o incumplimiento legal suyo o de personas bajo su control.",
              "La obligación se reducirá en la proporción atribuible a conducta de LAB_CORE y estará sujeta a notificación y oportunidad razonable de participar en la defensa. LAB_CORE no podrá aceptar una obligación no monetaria en su nombre sin consentimiento cuando la ley lo exija.",
            ],
          },
          {
            id: "incident",
            title: "9. Incidentes y exposición",
            paragraphs: [
              "Ante pérdida, robo, derrame, exposición o sospecha de administración, activará de inmediato los procedimientos del laboratorio y contactará servicios locales de emergencia, toxicología o autoridad competente. Proporcionará etiqueta, lote y documentación disponible. LAB_CORE no brinda atención ni instrucciones médicas.",
              "Cuando sea seguro y legal, notificará a info@labcorepep.com para apoyar identificación de lote y trazabilidad. Esa comunicación no sustituye la respuesta de emergencia ni admite responsabilidad.",
            ],
          },
          {
            id: "electronic-record",
            title: "10. Aceptación y registro electrónico",
            paragraphs: [
              "Acepta que una acción afirmativa —como marcar una casilla no preseleccionada y enviar el pedido— puede constituir firma o aceptación electrónica cuando la ley lo permita. LAB_CORE puede conservar la versión aceptada, fecha, pedido, cuenta e información técnica razonablemente necesaria para acreditar consentimiento y prevenir fraude.",
              "Puede imprimir o guardar este Acuerdo antes de comprar. Si no comprende una cláusula, no marque la casilla; obtenga asesoría independiente y contacte a LAB_CORE.",
            ],
          },
          {
            id: "general",
            title: "11. Vigencia, separabilidad y contacto",
            paragraphs: [
              "Este Acuerdo rige desde la aceptación y sus obligaciones de uso, custodia, responsabilidad e indemnidad sobreviven a entrega, cierre de cuenta o terminación. Si una cláusula es inválida, se ajustará al mínimo necesario y las restantes seguirán vigentes.",
              "Se aplica la jurisdicción identificada por la entidad vendedora antes del pago, respetando normas obligatorias. Preguntas: info@labcorepep.com. No acepte si la entidad contractual o las condiciones de la compra no están claramente identificadas.",
            ],
          },
        ],
      },
    },
  },
  en: {
    ui: {
      legalCenter: "Legal center // LAB_CORE",
      updated: "Last updated",
      effective: "Effective date",
      version: "Version",
      contents: "Document contents",
      print: "Print or save as PDF",
      contact: "Legal and privacy inquiries",
      related: "Related documents",
      readFull: "Read document",
      plainSummary: "Plain-language summary",
      summaryWarning: "This summary makes the document easier to understand, but it does not replace the full provisions below.",
      operatorTitle: "Seller identity",
      operatorText: "The legal entity acting as contractual seller, together with its address, tax details, and jurisdiction, must be displayed at checkout or in the confirmation before any payment is accepted. If that information is missing, do not complete the purchase and email info@labcorepep.com.",
      acceptanceTitle: "Express acceptance",
      acceptanceText: "By creating an account, using the Site, checking the acceptance box, or submitting an order, you confirm that you read and accepted the applicable documents in their then-current version. The checkout acceptance box is not preselected.",
      mandatoryRights: "Nothing in these documents removes non-waivable rights granted by applicable law or limits liability that cannot legally be limited.",
      date: "July 20, 2026",
      email: "info@labcorepep.com",
    },
    labels: {
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      disclaimer: "Legal Disclaimer",
      waiver: "Waiver Agreement",
    },
    docs: {
      privacy: {
        code: "LEGAL_01 // DATA",
        title: "Privacy",
        accent: "Policy",
        description: "Explains what data LAB_CORE collects, why it is used, who may receive it, and how you can exercise your rights.",
        critical: "LAB_CORE does not provide medical services. Do not submit medical records, diagnoses, prescriptions, patient data, or other health information through the Site.",
        highlights: [
          ["Data minimization", "We collect information needed for accounts, orders, support, security, and compliance."],
          ["Separate payments", "The payment provider processes full card details; LAB_CORE does not intend to store them."],
          ["Your control", "You may request access, correction, deletion, objection, or consent withdrawal where applicable."],
          ["21+ access", "The Site and its products are intended exclusively for people aged 21 or older."],
        ],
        sections: [
          {
            id: "scope-controller",
            title: "1. Scope and controller",
            paragraphs: [
              "This Policy applies to labcore.com and LAB_CORE-linked pages, accounts, forms, cart, checkout, stock alerts, and communications (the \"Site\"). LAB_CORE is the trade name used by the selling entity identified before payment and in the order confirmation.",
              "For questions or rights requests, email info@labcorepep.com and include the country from which you placed your order so the request can be handled under the applicable rules.",
            ],
          },
          {
            id: "data-collected",
            title: "2. Data we may collect",
            paragraphs: ["The information depends on how you use the Site and may include:"],
            bullets: [
              "Identity and contact data: name, email, phone, country, and shipping or billing details.",
              "Account data: username, internal identifiers, preferences, access history, and protected credentials. We cannot read your password in plain text.",
              "Order and compliance data: items, variants, quantities, amounts, status, tracking, returns, communications, and confirmations of age and research-only use.",
              "Payment data: status, reference, method, and fraud-prevention data supplied by the gateway. Full card information is handled by the payment provider.",
              "Support and marketing data: messages, contact forms, and name and email for updates or inventory alerts.",
              "Technical data: IP address, browser, device, language, time zone, security logs, viewed pages, and events needed to prevent abuse.",
              "Local storage and cookies: session, cart, language, and a local record of age-gate acceptance for 30 days.",
            ],
          },
          {
            id: "sources",
            title: "3. Sources of information",
            paragraphs: [
              "We receive data from you, your browser or device, providers operating the Site, and—when a purchase occurs—the payment gateway, carrier, ecommerce platform, or fraud-prevention tools.",
              "We do not purchase medical records or build medical profiles. Do not use free-text fields to send sensitive information that is unnecessary for the order.",
            ],
          },
          {
            id: "purposes-bases",
            title: "4. Purposes and legal grounds",
            paragraphs: ["Depending on consent, the contract, legal obligations, or permitted legitimate interests, we process data to:"],
            bullets: [
              "Create and protect accounts, authenticate sessions, and recover passwords.",
              "Prepare, verify, charge, ship, and support orders.",
              "Confirm age, legal acceptance, destination, and use restrictions, and prevent fraud, diversion, or prohibited use.",
              "Respond to support, claims, and privacy requests.",
              "Maintain security, availability, logs, backups, and technical diagnostics.",
              "Meet accounting, tax, regulatory, customs, consumer-protection, and lawful authority requirements.",
              "Send requested promotions or inventory alerts; you may opt out at any time.",
            ],
          },
          {
            id: "cookies",
            title: "5. Cookies and local storage",
            paragraphs: [
              "We use strictly necessary technology to maintain sessions, remember the cart, save language choice, avoid displaying the age gate again for 30 days, and remember whether the promotional form was dismissed or completed. Disabling it may prevent account or checkout functions.",
              "If non-essential analytics, advertising, or profiling are added, this Policy will be updated and the required choice will be provided. The Site must not classify those categories as \"essential.\"",
            ],
          },
          {
            id: "sharing",
            title: "6. Recipients and service providers",
            paragraphs: ["We may disclose limited data to providers that need it to perform services under instructions and reasonable contractual safeguards:"],
            bullets: [
              "Hosting, security, WordPress/WooCommerce, transactional email, requested marketing through Omnisend, support, and backup providers.",
              "Payment processors, fraud screening, banks, and payment networks.",
              "Warehouses, logistics providers, carriers, customs agents, and shipping insurers.",
              "Professional advisers, auditors, and authorities where needed to comply with law, protect rights, or answer valid process.",
              "A successor in a reorganization, financing, merger, or sale, subject to legally required safeguards.",
            ],
            note: "LAB_CORE does not sell personal data for money and does not authorize providers to use it for unrelated marketing of their own.",
          },
          {
            id: "transfers",
            title: "7. International transfers",
            paragraphs: [
              "The Site may use infrastructure or providers in the United States, Colombia, Mexico, or other countries. Your data may therefore be stored or processed outside your country.",
              "Where applicable, legal and contractual transfer mechanisms will be used and information will be limited to what is necessary. Foreign authorities may have access powers different from those in your jurisdiction.",
            ],
          },
          {
            id: "retention",
            title: "8. Retention",
            paragraphs: [
              "We keep data only as long as needed for the stated purpose and applicable legal periods. Account data remains while the account is active and for a reasonable period afterward; order and billing data is retained for tax, commercial, customs, and claims obligations; marketing data until opt-out; and technical logs for limited security periods.",
              "Backups are removed on scheduled cycles. A deletion request does not require erasure of data that must be retained by law, for fraud prevention, security, or legal defense; such data will instead be restricted where appropriate.",
            ],
          },
          {
            id: "security",
            title: "9. Security and incidents",
            paragraphs: [
              "We use administrative, technical, and organizational controls proportionate to risk, including limited access, protected sessions, encryption in transit, system updates, and provider review. No Internet-connected system can guarantee absolute security.",
              "If an incident triggers a legal notice obligation, LAB_CORE will assess scope and notify individuals, authorities, or other parties as applicable.",
            ],
          },
          {
            id: "rights",
            title: "10. Your rights",
            paragraphs: ["Depending on your residence and applicable law, you may request:"],
            bullets: [
              "Access to or knowledge of processed data and an explanation of its use.",
              "Correction or updating of inaccurate data.",
              "Deletion where legally available.",
              "Objection, processing restriction, or withdrawal of consent.",
              "Portability or a usable copy, where applicable.",
              "Marketing opt-out and the right to complain to a competent authority.",
            ],
            note: "Colombian users may exercise rights under Law 1581 of 2012; Mexican users may exercise ARCO and related rights under the current LFPDPPP; users in the United States may have additional state-law rights. We will not discriminate against a valid exercise of rights.",
          },
          {
            id: "requests",
            title: "11. Submitting a request",
            paragraphs: [
              "Email info@labcorepep.com with the subject \"Privacy,\" your name, account email, country, requested right, and information needed to locate the account or order. We may reasonably verify identity and authority to prevent fraudulent disclosures.",
              "We will respond within the time required by applicable law. If incomplete, we will explain what is missing. If denied in whole or part, we will give the reason and available complaint options where legally required.",
            ],
          },
          {
            id: "marketing-age",
            title: "12. Marketing, minors, and third parties",
            paragraphs: [
              "You can opt out of promotional email through its unsubscribe link or info@labcorepep.com. Operational account, security, and order messages may still be sent.",
              "The Site is for adults 21 or older and does not knowingly collect minors' data. Contact us if you believe a minor submitted information. Linked third-party sites have their own policies, which LAB_CORE does not control.",
            ],
          },
          {
            id: "changes-contact",
            title: "13. Changes and contact",
            paragraphs: [
              "We may update this Policy for operational or legal changes. A new date will be posted and material changes will receive notice or consent where required. The version presented when a transaction was accepted applies to it, subject to later legal obligations.",
              "Contact: info@labcorepep.com. The responsible entity's identity and address must be displayed before payments are enabled and in transaction records.",
            ],
          },
        ],
      },

      terms: {
        code: "LEGAL_02 // CONTRACT",
        title: "Terms &",
        accent: "Conditions",
        description: "Govern Site access, accounts, orders, and compounds sold exclusively for laboratory research.",
        critical: "ABSOLUTE USE RESTRICTION: no product is sold for consumption, administration, application, diagnosis, treatment, or testing in humans or animals. Not for human or veterinary use.",
        highlights: [
          ["21+ only", "You must be at least 21 and legally able to enter a contract."],
          ["Research only", "Purchase solely for legitimate laboratory work, chemical analysis, or permitted in-vitro research."],
          ["Conditional sale", "LAB_CORE may verify, reject, or cancel orders presenting regulatory, fraud, or misuse risk."],
          ["Mandatory rights", "Limits never displace mandatory consumer warranties or remedies."],
        ],
        sections: [
          {
            id: "acceptance",
            title: "1. Acceptance and incorporated documents",
            paragraphs: [
              "These Terms are a binding agreement between you and the LAB_CORE entity identified as seller at checkout or in the confirmation. By using the Site, creating an account, checking the legal box, or submitting an order, you accept these Terms, the Privacy Policy, Legal Disclaimer, and—for purchases—the Waiver Agreement.",
              "If acting for a company, university, or laboratory, you represent that you have authority to bind it. If you do not accept every document or cannot make these statements, do not use checkout or purchase products.",
            ],
          },
          {
            id: "eligibility",
            title: "2. Eligibility and accounts",
            bullets: [
              "You must be at least 21, legally competent, and not suspended.",
              "You must provide accurate details, protect credentials, and report unauthorized access.",
              "You may not use a false identity, evade limits, buy for an ineligible person, or automate orders without permission.",
              "You are responsible for account activity except to the extent caused by a failure legally attributable to LAB_CORE.",
            ],
          },
          {
            id: "research-only",
            title: "3. Classification and research-only use",
            paragraphs: [
              "Products are reagents or compounds intended exclusively for legitimate laboratory research. They are not drugs, foods, supplements, cosmetics, veterinary products, or products intended to diagnose, treat, cure, mitigate, or prevent disease.",
              "References to scientific literature, targets, pathways, or research areas are academic context—not use instructions, clinical recommendations, safety or efficacy promises, or regulatory authorization.",
            ],
            note: "A \"research only\" label does not by itself make prohibited conduct lawful. Intent, promotion, distribution, and actual use must remain within permitted research.",
          },
          {
            id: "prohibited-use",
            title: "4. Prohibited uses and conduct",
            bullets: [
              "Ingesting, injecting, inhaling, applying, implanting, or administering a product to any person or animal.",
              "Using it for clinical diagnosis, treatment, prevention, doping, performance enhancement, compounding, or any therapeutic application.",
              "Reselling, repackaging, dividing, relabeling, or marketing it for consumption or as an approved product.",
              "Providing human or veterinary dosing, reconstitution, or administration instructions, or asking LAB_CORE to do so.",
              "Diverting shipments or falsifying destination, end user, institution, age, permits, or customs documents.",
              "Using the Site for fraud, unauthorized access, bulk extraction, malware, IP infringement, or unlawful conduct.",
            ],
          },
          {
            id: "buyer-representations",
            title: "5. Buyer representations",
            paragraphs: ["With each order, you represent and warrant that:"],
            bullets: [
              "The product will be used only for lawful, non-clinical research by competent personnel.",
              "You have facilities, engineering controls, protective equipment, storage, disposal, and protocols appropriate to risk.",
              "You will independently assess identity, hazards, compatibility, regulatory requirements, and protocol suitability before handling.",
              "You will obtain required licenses, authorizations, registrations, import permits, and institutional approvals.",
              "You do not rely on the Site as a substitute for safety data, risk assessment, professional advice, or authority approval.",
            ],
          },
          {
            id: "product-information",
            title: "6. Product information, images, and COAs",
            paragraphs: [
              "We try to display descriptions, variants, stock, images, and analytical documents accurately. Images may be illustrative and packaging may change without changing the reference. Applicable batch data and COA take priority over generic material.",
              "A COA reports results for a specific sample and batch under stated methods. It does not itself prove sterility, endotoxin absence, future stability, biological safety, efficacy, lawful use, or another batch's identity, and must not be extrapolated beyond its scope.",
            ],
          },
          {
            id: "orders",
            title: "7. Orders, verification, and contract formation",
            paragraphs: [
              "The cart and order submission are an offer to buy, not automatic acceptance. We may verify identity, age, institution, intended use, destination, or permits. The contract forms when the selling entity accepts in writing and confirms payment unless applicable law provides otherwise.",
              "Before shipment, we may reject, limit, or cancel for stock, obvious error, fraud, sanctions, carrier restrictions, diversion risk, regulatory concerns, or reasonable suspicion of prohibited use. A LAB_CORE-cancelled order that was already charged will be refunded as applicable.",
            ],
          },
          {
            id: "pricing-payment",
            title: "8. Price, payment, and taxes",
            paragraphs: [
              "Prices appear in the stated currency. Before confirmation, checkout must show items, quantities, price, discounts, known taxes, shipping, and total. Customs charges or taxes that cannot be calculated in advance will be disclosed as the recipient's responsibility where lawful.",
              "The named gateway processes payment. You authorize the shown charge and confirm authority to use the method. An obvious typographical error does not require sale at the incorrect price; you may confirm the corrected price or cancel.",
            ],
          },
          {
            id: "shipping",
            title: "9. Shipping, customs, and receipt",
            paragraphs: [
              "Delivery times are estimates unless expressly guaranteed. The buyer must provide a valid address, review import rules, and ensure authorized receipt and storage. Discreet packaging may be used but will not conceal legally required customs or product information.",
              "Risk of loss and title are determined by applicable law and checkout terms. No clause shifts risks that legally remain with the seller. Promptly report damaged, incomplete, or incorrect packages and retain packaging, photographs, and lot details.",
            ],
          },
          {
            id: "returns",
            title: "10. Cancellations, returns, and refunds",
            paragraphs: [
              "Because compounds may be sensitive, traceable, and unsuitable for resale, sales are final after shipment where permitted. Opened, handled, improperly stored products or items without verifiable chain of custody cannot be returned.",
              "This rule does not remove mandatory rights for incorrect goods, pre-delivery damage, nonconformity, covered defects, applicable statutory withdrawal, or other non-waivable protections. Contact info@labcorepep.com promptly with order number, photos, lot, and details. Do not destroy or return the item until instructed.",
            ],
          },
          {
            id: "safety",
            title: "11. Handling, storage, and disposal",
            paragraphs: [
              "Only trained personnel may handle products under written protocols, exposure controls, and applicable rules. The buyer must review specific documentation, conduct its own risk assessment, and secure products against unauthorized access.",
              "For accidental exposure, immediately contact local emergency or poison-control services and provide available label information. LAB_CORE gives no medical instructions. Dispose as chemical waste under local rules; do not place in drains or household trash unless expressly allowed.",
            ],
          },
          {
            id: "warranties",
            title: "12. Warranties and no professional advice",
            paragraphs: [
              "To the fullest lawful extent, the Site is offered as available and product warranty is limited to conformity with express batch specifications or documents at delivery. We do not warrant uninterrupted Site operation or fitness for an undisclosed or impermissible protocol, result, or purpose.",
              "LAB_CORE does not provide medical, veterinary, regulatory, legal, or chemical-safety advice. Nothing excludes non-waivable statutory warranties or responsibility for express representations that legally form part of the contract.",
            ],
          },
          {
            id: "liability-indemnity",
            title: "13. Liability and indemnity",
            paragraphs: [
              "To the fullest lawful extent, LAB_CORE is not liable for indirect, special, or consequential harm from human or veterinary use, diversion, improper storage, mixing, repackaging, resale, legal noncompliance, or a buyer-designed protocol. Any monetary cap applies only where valid and never reduces mandatory rights.",
              "You will indemnify LAB_CORE against third-party claims arising from prohibited use, false statements, unauthorized resale, or breach, except to the extent caused by LAB_CORE conduct that cannot be excluded. Liability for fraud, willful misconduct, gross negligence, death, or injury is not excluded where law forbids it.",
            ],
          },
          {
            id: "ip-suspension",
            title: "14. Intellectual property and suspension",
            paragraphs: [
              "Site marks, design, text, graphics, database, and code belong to LAB_CORE or licensors. A limited, revocable, non-transferable license allows viewing and purchasing under these Terms—not copying, exploitation, or false affiliation.",
              "We may suspend accounts or access for security, fraud, prohibited-use risk, or breach. Where reasonable and legally required, we will provide the reason and a review path.",
            ],
          },
          {
            id: "law-general",
            title: "15. Governing law and general terms",
            paragraphs: [
              "The selling entity and contractual jurisdiction must be identified before payment. The relationship is governed by the law stated there without depriving consumers of mandatory protections in their residence or transaction location. The parties will first try to resolve disputes through info@labcorepep.com without blocking access to competent authorities or courts.",
              "If a provision is invalid, it will be narrowed as necessary and the rest remains effective. Failure to enforce is not waiver. These Terms and incorporated documents are the agreement for the Site and orders, except express terms of an accepted order. Provisions intended by nature to survive will do so.",
            ],
          },
          {
            id: "changes",
            title: "16. Changes and contact",
            paragraphs: [
              "We may amend these Terms prospectively. The date and version will be visible; material changes will not retroactively alter an accepted order absent agreement or legal requirement. Continued use after effectiveness is acceptance for future activity where lawful.",
              "Contact: info@labcorepep.com. Do not complete payment if checkout does not show the seller, total price, and applicable conditions.",
            ],
          },
        ],
      },

      disclaimer: {
        code: "LEGAL_03 // NOTICE",
        title: "Legal",
        accent: "Disclaimer",
        description: "Clarifies the scope of scientific information, analytical documents, and absolute product restrictions.",
        critical: "FOR LABORATORY RESEARCH ONLY. NOT FOR HUMAN USE, CONSUMPTION, ADMINISTRATION, DIAGNOSIS, TREATMENT, VETERINARY USE, OR CLINICAL APPLICATION.",
        highlights: [
          ["No medical advice", "Content does not replace medical, veterinary, legal, or chemical-safety professionals."],
          ["No clinical promises", "Published research does not prove that a sold product is safe, effective, or approved."],
          ["Limited COA", "A certificate applies to the expressly identified batch, sample, date, and methods."],
          ["Emergencies", "For exposure, contact local emergency or poison-control services; do not seek instructions on this Site."],
        ],
        sections: [
          {
            id: "purpose",
            title: "1. Purpose of the Site",
            paragraphs: [
              "LAB_CORE provides a catalog and documents for adult buyers acquiring compounds exclusively for legitimate laboratory research. The Site is not a clinic, pharmacy, telemedicine platform, or prescription service.",
              "Content supports catalog identification, traceability, and document review. It authorizes no use and does not replace independent researcher assessment, safety data, institutional protocols, or regulatory requirements.",
            ],
          },
          {
            id: "no-human-use",
            title: "2. Human and veterinary use prohibited",
            paragraphs: [
              "No product is offered for ingestion, injection, inhalation, topical application, implantation, preparation, dosing, or administration to humans or animals. Nor is any product offered for diagnosis, treatment, prevention, mitigation, doping, performance enhancement, or formulation of drugs, supplements, or cosmetics.",
              "Purchase, possession, or receipt does not authorize unlawful use. LAB_CORE may refuse service where wording, destination, buying patterns, or available information indicate possible prohibited use.",
            ],
          },
          {
            id: "no-advice",
            title: "3. No medical advice or use instructions",
            paragraphs: [
              "Compound names, mechanisms, targets, studies, graphics, and summaries are not medical, veterinary, nutritional, or performance recommendations. They are not a diagnosis, informed consent, dose, reconstitution guide, clinical protocol, or professional-patient relationship.",
              "Do not make health decisions based on the Site. LAB_CORE will not answer human or veterinary administration requests. For health concerns, consult a licensed professional; for emergencies or exposure, immediately contact local emergency or poison-control services.",
            ],
          },
          {
            id: "research-evidence",
            title: "4. Literature and scientific evidence",
            paragraphs: [
              "Referenced studies may be preclinical, in vitro, animal, observational, preliminary, unreplicated, or concern different substances, formulations, and conditions. Research findings cannot automatically be extrapolated to people, animals, safety, efficacy, or the sold product.",
              "Terms such as \"research areas,\" \"lines of inquiry,\" or \"advances\" describe academic topics and must be read with their limitations. LAB_CORE does not guarantee permanent accuracy of external sources and will reasonably correct known material errors.",
            ],
          },
          {
            id: "regulatory",
            title: "5. Regulatory status",
            paragraphs: [
              "Unless specifically stated with supporting official documentation, LAB_CORE does not claim its products are approved, authorized, or evaluated for human or veterinary use by the U.S. FDA, Colombia's INVIMA, Mexico's COFEPRIS, or any other authority.",
              "\"Research Use Only\" describes intended commercial use; it is not government approval, does not remove regulatory duties, and does not authorize clinical research involving subjects. Buyers must independently determine requirements for their activity and jurisdiction.",
            ],
          },
          {
            id: "coa",
            title: "6. COAs, purity, and specifications",
            paragraphs: [
              "A Certificate of Analysis reports tests on a sample from a batch under the stated date, method, and conditions. A purity result is not equivalent to sterility, lack of endotoxins or solvents, stability, bioavailability, safety, efficacy, or fitness for humans or animals.",
              "Confirm the product, presentation, batch, and document match. Results have uncertainty and method limits. An attribute not expressly tested must not be assumed. Contact LAB_CORE before laboratory use if documents appear inconsistent.",
            ],
          },
          {
            id: "site-accuracy",
            title: "7. Accuracy, availability, and third parties",
            paragraphs: [
              "We make reasonable efforts to maintain information, but stock, images, packaging, price, and content can change. Obvious errors may be corrected before order acceptance. Links to publications, laboratories, or external services are references and do not imply control, sponsorship, or warranty.",
              "The Site may be interrupted for maintenance, security, or external causes. No display, badge, or word such as \"verified\" should be understood beyond the specific evidence accompanying it.",
            ],
          },
          {
            id: "risk",
            title: "8. Risk and responsibility",
            paragraphs: [
              "Research compounds may have unknown properties and exposure, contamination, incompatibility, or degradation risks. Only qualified personnel in suitable facilities and under a documented assessment should handle them.",
              "To the fullest lawful extent, LAB_CORE is not responsible for human or veterinary use, diversion, unauthorized handling, improper storage, mixing, repackaging, or legal noncompliance. This does not apply where law prohibits exclusion or provides a mandatory remedy.",
            ],
          },
          {
            id: "acceptance-contact",
            title: "9. Acceptance, changes, and contact",
            paragraphs: [
              "This Disclaimer is part of the Terms. By continuing on the Site or ordering, you acknowledge the exclusively research nature and understand that no information invites human or veterinary use.",
              "We may update this Disclaimer; its version and date will be visible. Questions or reports of potentially confusing content: info@labcorepep.com.",
            ],
          },
        ],
      },

      waiver: {
        code: "LEGAL_04 // ACKNOWLEDGMENT",
        title: "Acknowledgment and limited",
        accent: "Waiver Agreement",
        description: "Records buyer representations, assumption of laboratory risks, and consequences of diversion or unauthorized use.",
        critical: "THIS AGREEMENT DOES NOT AUTHORIZE HUMAN OR VETERINARY USE. IF YOU CANNOT GUARANTEE AN EXCLUSIVELY RESEARCH DESTINATION, DO NOT ACCEPT OR PURCHASE.",
        highlights: [
          ["Personal statement", "You confirm age, competence, authority, and legitimate laboratory destination."],
          ["Known risk", "You recognize compounds may present hazards or properties that are not fully characterized."],
          ["Diversion liability", "You assume consequences of administration, resale, relabeling, or handling contrary to this Agreement."],
          ["Limited release", "It does not cover fraud, gross negligence, or rights and liability that cannot legally be waived."],
        ],
        sections: [
          {
            id: "agreement",
            title: "1. Nature of this Agreement",
            paragraphs: [
              "This acknowledgment, assumption of risk, limited release, and indemnity agreement (the \"Agreement\") is between the buyer and the LAB_CORE entity identified as seller before payment. It supplements the Terms and applies to every research product purchased or received.",
              "By checking the checkout box and submitting an order, you expressly and electronically accept. If purchasing for an organization, you accept personally and represent authority to bind that organization to the lawful extent.",
            ],
          },
          {
            id: "age-capacity",
            title: "2. Age, capacity, and competence",
            paragraphs: ["You represent that:"],
            bullets: [
              "You are at least 21 and legally capable of contracting.",
              "You are not buying for a minor, suspended, or ineligible person.",
              "You have suitable training and experience or competent institutional supervision.",
              "You have the laboratory, company, or institution's authority where the purchase is not personal.",
              "Identity, destination, end-user, and intended-use information is complete and true.",
            ],
          },
          {
            id: "sole-purpose",
            title: "3. Sole purpose and prohibitions",
            paragraphs: [
              "You agree to acquire, store, and use each product only for lawful laboratory research that does not involve human or veterinary administration. You will not use it as a drug, supplement, cosmetic, food, diagnostic, treatment, prevention, doping, or clinical product.",
              "You will not ingest, inject, inhale, apply, implant, dose, or administer it to a person or animal, and will not allow a third party to do so. You will not provide instructions, samples, or access for that purpose.",
            ],
          },
          {
            id: "risk-acknowledgment",
            title: "4. Risk acknowledgment",
            paragraphs: [
              "You recognize that research compounds may lack complete toxicological characterization and can present known or unknown risks of exposure, reaction, contamination, degradation, incompatibility, transport, storage, or disposal.",
              "You recognize that analytical purity, appearance, presentation, or a COA does not mean sterility, biological safety, efficacy, regulatory approval, or suitability for humans or animals. You assume ordinary risks inherent in research handling that remain after appropriate controls.",
            ],
          },
          {
            id: "controls",
            title: "5. Control and custody duties",
            bullets: [
              "Conduct an independent risk assessment before opening or handling.",
              "Use appropriate facilities, ventilation, containment, protective equipment, inventory controls, and protocols.",
              "Restrict access to authorized personnel and retain batch traceability and chain of custody.",
              "Store and transport under applicable documents while preventing confusion with consumer or clinical products.",
              "Manage spills, exposure, and waste under institutional plans and local law.",
            ],
          },
          {
            id: "compliance",
            title: "6. Compliance, import, and end user",
            paragraphs: [
              "You are responsible for determining whether purchase, import, possession, research, transfer, and disposal are lawful at destination. You will obtain required customs, regulatory, institutional, or biosafety permissions and will not request false declarations or misleading shipment classifications.",
              "You will promptly tell LAB_CORE if the end user or intended use changes, an authority detains the shipment, or diversion, loss, or unauthorized access is discovered. LAB_CORE may stop the order and cooperate with valid legal process.",
            ],
          },
          {
            id: "release",
            title: "7. Assumption and limited release",
            paragraphs: [
              "To the fullest lawful extent, you assume responsibility for claims, loss, or damage caused by your prohibited use, diversion, administration, unauthorized resale, relabeling, mixing, improper storage, or breach, and release LAB_CORE from consequences directly caused by that conduct.",
              "The release does not apply to fraud, willful misconduct, gross negligence, breach of a non-waivable duty, goods that materially fail to match the accepted sale, or injury and liability that law does not allow to be excluded. It does not limit mandatory consumer rights.",
            ],
          },
          {
            id: "indemnity",
            title: "8. Third-party indemnity",
            paragraphs: [
              "Where permitted, you will defend, indemnify, and hold LAB_CORE and its providers harmless from third-party claims, penalties, reasonable costs, and losses arising from your false statement, prohibited use, unauthorized distribution, or legal breach, including conduct by persons under your control.",
              "The obligation is reduced to the extent attributable to LAB_CORE conduct and is subject to notice and reasonable participation in the defense. LAB_CORE may not accept a non-monetary obligation for you without consent where legally required.",
            ],
          },
          {
            id: "incident",
            title: "9. Incidents and exposure",
            paragraphs: [
              "For loss, theft, spill, exposure, or suspected administration, immediately activate laboratory procedures and contact local emergency, poison-control, or competent authority services. Provide available label, batch, and documents. LAB_CORE does not provide medical care or instructions.",
              "When safe and lawful, notify info@labcorepep.com to support batch identification and traceability. That notice does not replace emergency response or admit liability.",
            ],
          },
          {
            id: "electronic-record",
            title: "10. Electronic acceptance and record",
            paragraphs: [
              "You agree that an affirmative action—such as checking an unselected box and submitting an order—may be an electronic signature or acceptance where lawful. LAB_CORE may retain the accepted version, date, order, account, and technical data reasonably needed to evidence consent and prevent fraud.",
              "You may print or save this Agreement before purchase. If you do not understand a provision, do not check the box; obtain independent advice and contact LAB_CORE.",
            ],
          },
          {
            id: "general",
            title: "11. Duration, severability, and contact",
            paragraphs: [
              "This Agreement begins on acceptance, and use, custody, responsibility, and indemnity duties survive delivery, account closure, or termination. If a provision is invalid, it will be narrowed as needed and the remainder stays effective.",
              "The jurisdiction identified by the seller before payment applies subject to mandatory law. Questions: info@labcorepep.com. Do not accept if the contractual entity or purchase conditions are not clearly identified.",
            ],
          },
        ],
      },
    },
  },
};
