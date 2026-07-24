import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  Search,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";

const CONTENT = {
  es: {
    process: {
      eyebrow: "Un proceso sin dudas",
      title: "Cómo funciona",
      accent: "tu pedido",
      description: "Desde la selección del compuesto hasta la consulta de la documentación del lote.",
      steps: [
        [Search, "Explora el catálogo", "Busca por nombre o utiliza los enfoques de investigación para encontrar la referencia adecuada."],
        [ClipboardCheck, "Revisa la información", "Consulta presentación, disponibilidad, precio y documentación analítica disponible."],
        [CreditCard, "Completa y paga", "Ingresa tus datos, revisa el resumen de la orden y continúa al pago seguro con Bold."],
        [PackageCheck, "Rastrea y verifica", "Consulta el estado de la orden y accede al COA correspondiente cuando esté disponible."],
      ],
      action: "Explorar catálogo",
    },
    faq: {
      eyebrow: "Respuestas directas",
      title: "Preguntas",
      accent: "frecuentes",
      description: "Información esencial antes de realizar una orden de investigación.",
      items: [
        ["¿Los productos son para uso humano?", "No. Los productos de LAB_CORE se ofrecen exclusivamente para investigación legítima de laboratorio y no están destinados al consumo humano ni veterinario."],
        ["¿Cómo consulto el COA de un producto?", "Puedes ingresar a la biblioteca de COA desde el menú principal o desde los accesos del producto. Allí podrás buscar la documentación analítica disponible por referencia o lote."],
        ["¿En qué monedas puedo ver los precios?", "La tienda permite visualizar precios en las monedas disponibles en el selector superior. La moneda y los métodos habilitados para completar el pago se confirman durante el checkout."],
        ["¿Cómo funciona el envío?", "Después de completar tus datos, la orden se valida y se prepara para despacho. La disponibilidad, el destino y la información final del envío se confirman dentro del proceso de compra."],
        ["¿Puedo rastrear mi pedido?", "Sí. Utiliza la opción de seguimiento con los datos asociados a tu orden para consultar su estado y las actualizaciones disponibles."],
      ],
      coaAction: "Consultar biblioteca COA",
      support: "¿Aún tienes dudas? Revisa la documentación antes de comprar.",
    },
  },
  en: {
    process: {
      eyebrow: "A process without guesswork",
      title: "How your order",
      accent: "works",
      description: "From compound selection to reviewing the documentation associated with a batch.",
      steps: [
        [Search, "Explore the catalog", "Search by name or use research-focus filters to find the right reference."],
        [ClipboardCheck, "Review the information", "Check presentation, availability, price, and available analytical documentation."],
        [CreditCard, "Complete and pay", "Enter your details, review the order summary, and continue to secure payment with Bold."],
        [PackageCheck, "Track and verify", "Check the order status and access its corresponding COA when available."],
      ],
      action: "Explore catalog",
    },
    faq: {
      eyebrow: "Straight answers",
      title: "Frequently asked",
      accent: "questions",
      description: "Essential information before placing a research order.",
      items: [
        ["Are the products intended for human use?", "No. LAB_CORE products are offered exclusively for legitimate laboratory research and are not intended for human or veterinary consumption."],
        ["How do I find a product COA?", "Open the COA library from the main menu or a product access point. You can search available analytical documentation by reference or batch."],
        ["Which currencies can I use?", "The store displays prices in the currencies available from the top selector. The currency and payment methods available to complete payment are confirmed during checkout."],
        ["How does shipping work?", "After you submit your details, the order is validated and prepared for dispatch. Availability, destination, and final shipping information are confirmed during the purchasing process."],
        ["Can I track my order?", "Yes. Use the tracking option with the information associated with your order to view its status and available updates."],
      ],
      coaAction: "Open COA library",
      support: "Still have questions? Review the documentation before purchasing.",
    },
  },
};

export function OrderProcess() {
  const { language } = useLanguage();
  const copy = CONTENT[language]?.process || CONTENT.en.process;

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.05] blur-[110px]" />
      <div className="relative mx-auto max-w-[1180px]">
        <SectionHeading index="02" eyebrow={copy.eyebrow} title={copy.title} accent={copy.accent} description={copy.description} className="mb-10 sm:mb-12" />

        <div className="grid overflow-hidden rounded-[26px] border border-white/10 bg-[#050d1b] sm:grid-cols-2 lg:grid-cols-4">
          {copy.steps.map(([Icon, title, text], index) => (
            <article key={title} className={`relative p-6 sm:p-7 ${index ? "border-t border-white/[0.07] sm:border-t-0 sm:[&:nth-child(odd)]:border-l lg:border-l" : ""} ${index === 2 ? "sm:border-t sm:border-white/[0.07] lg:border-t-0" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300"><Icon size={18} /></span>
                <span className="font-['Orbitron'] text-2xl font-black text-white/[0.05]">0{index + 1}</span>
              </div>
              <h3 className="mt-6 font-['Orbitron'] text-xs font-black uppercase tracking-[0.06em] text-white">{title}</h3>
              <p className="mt-3 font-sans text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a href="/shop" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-7 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.1em] text-[#020617] transition-colors hover:bg-white">
            {copy.action}<ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function HomeFaq() {
  const { language } = useLanguage();
  const copy = CONTENT[language]?.faq || CONTENT.en.faq;

  return (
    <section className="relative border-t border-white/[0.06] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeading index="04" eyebrow={copy.eyebrow} title={copy.title} accent={copy.accent} description={copy.description} className="mb-10 sm:mb-12" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#050d1b]">
            {copy.items.map(([question, answer], index) => (
              <details key={question} className="group border-b border-white/[0.07] last:border-b-0">
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-cyan-300/55">0{index + 1}</span>
                    <span className="font-['Orbitron'] text-[11px] font-bold uppercase leading-5 tracking-[0.04em] text-slate-100 sm:text-xs">{question}</span>
                  </span>
                  <ChevronDown size={16} className="shrink-0 text-cyan-300 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="border-t border-white/[0.05] bg-[#020817]/60 px-5 py-5 pl-12 font-sans text-sm leading-6 text-slate-400 sm:px-6 sm:pl-14">{answer}</p>
              </details>
            ))}
          </div>

          <aside className="rounded-[24px] border border-cyan-300/15 bg-gradient-to-b from-cyan-300/[0.07] to-[#050d1b] p-6 sm:p-7">
            <BadgeCheck size={24} className="text-cyan-300" />
            <p className="mt-5 font-['Orbitron'] text-xs font-black uppercase leading-5 tracking-[0.05em] text-white">{copy.support}</p>
            <a href="/coa-library" className="mt-6 flex min-h-11 items-center justify-between rounded-xl border border-cyan-300/25 px-4 font-sans text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-[#020617]">
              {copy.coaAction}<ArrowRight size={13} />
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
