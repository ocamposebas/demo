import { ArrowUpRight, Atom, CheckCircle2, FileCheck2, FlaskConical, Mail, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const pages = {
  news: {
    code: "SYSTEM_NEWS", icon: Atom,
    es: { title: "Noticias del sistema", intro: "Actualizaciones operativas y documentales de LAB_CORE, publicadas con contexto y fecha de revisión.", sections: [["Actualizaciones de catálogo", "Nuevas presentaciones, cambios de disponibilidad y documentación asociada se comunicarán aquí."], ["Estado documental", "Publicaremos novedades sobre certificados de análisis, trazabilidad por lote y mejoras de consulta."], ["Comunicaciones verificadas", "Los avisos importantes siempre remitirán a canales oficiales de LAB_CORE. Nunca solicitaremos contraseñas por correo."]], note: "Próxima actualización editorial en preparación." },
    en: { title: "System news", intro: "Operational and documentation updates from LAB_CORE, published with context and a review date.", sections: [["Catalog updates", "New presentations, availability changes and related documentation will be announced here."], ["Documentation status", "We will publish updates on certificates of analysis, batch traceability and search improvements."], ["Verified communications", "Important notices will always direct you to official LAB_CORE channels. We never request passwords by email."]], note: "Next editorial update in preparation." },
  },
  "research-areas": {
    code: "RESEARCH_AREAS", icon: FlaskConical,
    es: { title: "Áreas de investigación", intro: "Una guía de las categorías científicas utilizadas para organizar el catálogo y su documentación técnica.", sections: [["Bioquímica y señalización", "Materiales de referencia para investigación in vitro sobre rutas moleculares, interacción y caracterización analítica."], ["Control y caracterización", "Información de identidad, pureza reportada, método analítico y trazabilidad disponible para cada lote."], ["Investigación responsable", "El contenido es exclusivamente educativo y de laboratorio; no constituye una indicación clínica, dosis ni protocolo para humanos o animales."]], note: "Consulta la ficha individual y el COA del lote antes de diseñar cualquier trabajo experimental." },
    en: { title: "Research areas", intro: "A guide to the scientific categories used to organize the catalog and its technical documentation.", sections: [["Biochemistry and signaling", "Reference materials for in-vitro research involving molecular pathways, interaction and analytical characterization."], ["Control and characterization", "Available identity, reported purity, analytical method and traceability information for each batch."], ["Responsible research", "Content is for educational and laboratory purposes only; it is not a clinical indication, dose or human/animal protocol."]], note: "Review the individual product record and batch COA before designing experimental work." },
  },
  specifications: {
    code: "SPECIFICATIONS", icon: FileCheck2,
    es: { title: "Especificaciones", intro: "Cómo leer y validar la información técnica que acompaña cada material de investigación.", sections: [["Identidad del material", "Verifica nombre, presentación, SKU, lote y fecha del documento. Todos deben corresponder al producto recibido."], ["Resultados analíticos", "La pureza reportada depende del método y sus límites. HPLC, MS u otras pruebas responden preguntas distintas y no son intercambiables."], ["Almacenamiento y manipulación", "Sigue únicamente las condiciones documentadas en la etiqueta y ficha del producto, junto con los procedimientos de seguridad de tu laboratorio."]], note: "Una especificación no demostrada expresamente no debe inferirse a partir del porcentaje de pureza." },
    en: { title: "Specifications", intro: "How to read and validate the technical information accompanying each research material.", sections: [["Material identity", "Verify the name, presentation, SKU, batch and document date. All must match the received product."], ["Analytical results", "Reported purity depends on the method and its limits. HPLC, MS and other tests answer different questions and are not interchangeable."], ["Storage and handling", "Follow only conditions documented on the label and product record, together with your laboratory safety procedures."]], note: "A specification not explicitly demonstrated must not be inferred from a purity percentage." },
  },
  "analysis-log": {
    code: "ANALYSIS_LOG", icon: CheckCircle2,
    es: { title: "Registro de análisis", intro: "Punto de acceso a la evidencia analítica disponible y al historial documental de los lotes.", sections: [["Registro por lote", "Cada certificado debe identificar el compuesto, lote, método, resultado, laboratorio y fecha de emisión cuando esos datos estén disponibles."], ["Control de versiones", "Si un documento se reemplaza o corrige, debe conservar una referencia clara que permita reconocer la versión vigente."], ["Verificación", "Busca el certificado por lote o SKU en la biblioteca de COA y compara sus identificadores con la etiqueta física."]], note: "La ausencia de una prueba en el certificado significa que ese atributo no fue acreditado por dicho documento." },
    en: { title: "Analysis log", intro: "Access point for available analytical evidence and batch documentation history.", sections: [["Batch records", "Each certificate should identify the compound, batch, method, result, laboratory and issue date when available."], ["Version control", "If a document is replaced or corrected, it should retain a clear reference identifying the current version."], ["Verification", "Search by batch or SKU in the COA library and compare its identifiers with the physical label."]], note: "If a test is absent from a certificate, that attribute was not demonstrated by that document." },
    action: ["/coa-library", "Abrir biblioteca COA", "Open COA library"],
  },
  "molecular-data": {
    code: "MOLECULAR_DATA", icon: Atom,
    es: { title: "Datos moleculares", intro: "Referencias técnicas para interpretar nomenclatura, estructura y metadatos del catálogo.", sections: [["Nomenclatura", "Los nombres y abreviaturas se presentan como referencias de identificación; confirma siempre la ficha y el certificado del lote."], ["Propiedades reportadas", "Fórmula, masa molecular y secuencia solo se muestran cuando existe una fuente documental apropiada para el producto."], ["Alcance", "Los datos moleculares describen identidad química o analítica. No prueban seguridad, esterilidad, eficacia ni aptitud clínica."]], note: "Ante cualquier discrepancia entre esta página y el COA, solicita aclaración antes de continuar." },
    en: { title: "Molecular data", intro: "Technical references for interpreting catalog nomenclature, structure and metadata.", sections: [["Nomenclature", "Names and abbreviations are identification references; always confirm the product record and batch certificate."], ["Reported properties", "Formula, molecular mass and sequence are shown only when an appropriate documentary source exists."], ["Scope", "Molecular data describes chemical or analytical identity. It does not prove safety, sterility, efficacy or clinical suitability."]], note: "If this page and a COA differ, request clarification before proceeding." },
  },
  faqs: {
    code: "SUPPORT_FAQ", icon: ShieldCheck,
    es: { title: "Preguntas frecuentes", intro: "Respuestas claras sobre pedidos, documentación, pagos y uso responsable del sitio.", sections: [["¿Dónde consulto un COA?", "Abre la Biblioteca COA y busca por producto, SKU o lote. Comprueba que el lote coincida con la etiqueta."], ["¿Cómo rastreo mi pedido?", "Utiliza la página Rastrear pedido con la referencia y el correo usados en la compra."], ["¿Los productos son para consumo humano?", "No. Todos los productos de LAB_CORE se ofrecen exclusivamente para investigación de laboratorio y no para uso humano o veterinario."], ["¿Cómo se procesa el pago?", "La pasarela habilitada procesa los datos sensibles. LAB_CORE no pretende almacenar los datos completos de tu tarjeta."]], note: "¿No encuentras tu respuesta? Escríbenos e incluye la referencia del pedido, sin compartir datos completos de pago." },
    en: { title: "Frequently asked questions", intro: "Clear answers about orders, documentation, payments and responsible site use.", sections: [["Where can I find a COA?", "Open the COA Library and search by product, SKU or batch. Confirm the batch matches the label."], ["How do I track an order?", "Use the Track Order page with the reference and email used for purchase."], ["Are products for human consumption?", "No. All LAB_CORE products are offered exclusively for laboratory research, not for human or veterinary use."], ["How is payment processed?", "The enabled gateway processes sensitive data. LAB_CORE does not intend to store full card details."]], note: "Still need help? Email us with your order reference, without sharing full payment details." },
  },
  contact: {
    code: "CONTACT_NODE", icon: Mail,
    es: { title: "Contacto", intro: "Canal oficial para soporte de pedidos, documentación técnica y consultas comerciales.", sections: [["Soporte de pedidos", "Incluye tu número de pedido y el correo de compra. No envíes números completos de tarjeta ni contraseñas."], ["Documentación y COA", "Indica producto, SKU, lote y el documento que necesitas revisar para que podamos responder con precisión."], ["Horario de atención", "Lunes a viernes, excepto festivos. Los mensajes se atienden por orden de llegada."]], note: "Correo oficial: info@labcorepep.com" },
    en: { title: "Contact", intro: "Official channel for order support, technical documentation and commercial inquiries.", sections: [["Order support", "Include your order number and purchase email. Never send full card numbers or passwords."], ["Documentation and COAs", "Specify the product, SKU, batch and document you need reviewed so we can answer accurately."], ["Support hours", "Monday through Friday, excluding holidays. Messages are handled in the order received."]], note: "Official email: info@labcorepep.com" },
    action: ["mailto:info@labcorepep.com", "Enviar correo", "Send email"],
  },
};

export default function ResourcePage({ page }) {
  const { language } = useLanguage();
  const config = pages[page] || pages.faqs;
  const copy = config[language === "es" ? "es" : "en"];
  const Icon = config.icon;
  const action = config.action || ["/shop", "Ver catálogo", "View catalog"];

  return <main className="px-4 pb-24 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pt-[12rem]">
    <section className="mx-auto max-w-[1100px]">
      <div className="flex items-center gap-3 font-mono text-[8px] font-bold uppercase tracking-[.22em] text-cyan-300"><span className="flex h-8 w-8 items-center justify-center border border-cyan-300/25 bg-cyan-300/[.06]"><Icon size={15}/></span>{config.code}</div>
      <div className="mt-7 grid gap-8 border-b border-white/10 pb-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
        <h1 className="font-['Orbitron'] text-[clamp(2.25rem,6vw,4.5rem)] font-black uppercase leading-[1.03] tracking-[-.055em] text-white">{copy.title}</h1>
        <p className="max-w-xl font-mono text-[11px] leading-7 text-slate-400">{copy.intro}</p>
      </div>
      <div className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-2">
        {copy.sections.map(([title, text], index) => <article key={title} className="relative bg-[#040b19] p-6 sm:p-8">
          <span className="font-mono text-[8px] font-bold tracking-[.18em] text-cyan-300/55">0{index + 1}</span>
          <h2 className="mt-5 font-['Orbitron'] text-sm font-black uppercase tracking-[.04em] text-white sm:text-base">{title}</h2>
          <p className="mt-4 font-sans text-sm leading-7 text-slate-400">{text}</p>
        </article>)}
      </div>
      <div className="mt-10 flex flex-col gap-6 border-l-2 border-cyan-300/50 bg-cyan-300/[.035] p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl font-mono text-[9px] leading-6 text-slate-400">{copy.note}</p>
        <a href={action[0]} className="flex min-h-11 shrink-0 items-center justify-center gap-2 bg-cyan-300 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[.12em] text-[#020617] hover:bg-white">{language === "es" ? action[1] : action[2]} <ArrowUpRight size={13}/></a>
      </div>
    </section>
  </main>;
}
