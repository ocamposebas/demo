import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileSearch,
  FlaskConical,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import AnnouncementBar from "../announcement/AnnouncementBar.jsx";
import CartDrawer from "../cart/CartDrawer.jsx";
import Footer from "../footer/Footer.jsx";
import Header from "../header/Header.jsx";
import StoreProviders from "../shop/StoreProviders.jsx";

const checks = [
  ["Lote identificable", "El código del material debe coincidir con el documento analítico presentado."],
  ["Identidad", "Un resultado de identidad responde si la muestra corresponde al compuesto esperado."],
  ["Pureza y método", "El porcentaje necesita contexto: técnica, condiciones y criterio de reporte."],
  ["Fecha y responsable", "La trazabilidad mejora cuando el documento identifica cuándo y quién realizó el análisis."],
];

const faqs = [
  ["¿Qué es un péptido de investigación?", "Es un material peptídico destinado a estudios de laboratorio. Los péptidos son cadenas de residuos de aminoácidos unidos por enlaces peptídicos; su secuencia y modificaciones forman parte de su identidad química."],
  ["¿Qué significa RUO o Research Use Only?", "Indica que el material se ofrece exclusivamente para investigación y no como alimento, cosmético, medicamento ni producto destinado al uso humano o veterinario."],
  ["¿Qué es un certificado de análisis o COA?", "Es un documento que reúne información y resultados analíticos de un lote. Debe permitir relacionar el producto, el lote, los métodos utilizados y los resultados reportados."],
  ["¿Un porcentaje de pureza confirma la identidad?", "No. Pureza e identidad responden preguntas diferentes. Una evaluación documental sólida revisa ambas y no infiere esterilidad, contenido o identidad a partir de un único porcentaje."],
  ["¿LAB_CORE ofrece péptidos de investigación en Colombia?", "LAB_CORE presenta un catálogo para investigación de laboratorio con disponibilidad para Colombia, información técnica y consulta de documentación analítica por lote."],
  ["¿Dónde puedo consultar la documentación de un lote?", "La biblioteca COA de LAB_CORE permite buscar los registros disponibles. También puedes abrir la ficha del producto para revisar sus características y enlaces documentales."],
];

function Eyebrow({ children }) {
  return <p className="font-mono text-[10px] font-bold uppercase tracking-[.22em] text-cyan-300">{children}</p>;
}

export default function PeptidesColombiaExperience() {
  return (
    <StoreProviders>
      <AnnouncementBar />
      <Header />
      <main className="font-sans">
        <section className="relative overflow-hidden px-4 pb-20 pt-[calc(var(--lab-mobile-page-top)+1.5rem)] sm:px-6 sm:pb-24 sm:pt-44 lg:px-10 lg:pt-52">
          <div className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-cyan-400/[.07] blur-[130px]" />
          <div className="relative mx-auto max-w-[1180px]">
            <nav aria-label="Migas de pan" className="mb-8 flex items-center gap-2 text-xs text-slate-500">
              <a href="/" className="hover:text-cyan-300">Inicio</a><span aria-hidden="true">/</span>
              <span className="text-slate-300">Péptidos de investigación en Colombia</span>
            </nav>
            <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
              <div>
                <Eyebrow>Guía Colombia · Investigación de laboratorio</Eyebrow>
                <h1 className="mt-6 max-w-4xl font-['Orbitron'] text-[clamp(2.4rem,6vw,4.8rem)] font-black uppercase leading-[.98] tracking-[-.055em] text-white">
                  Péptidos de investigación <span className="text-cyan-300">en Colombia</span>
                </h1>
                <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                  Una guía para entender qué es un péptido de investigación, cómo evaluar su documentación
                  analítica y qué revisar antes de confiar en un certificado de análisis.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-7 text-xs font-black uppercase tracking-[.12em] text-slate-950 hover:bg-white">
                    Ver catálogo <ArrowRight size={16} />
                  </a>
                  <a href="/coa-library" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/30 px-7 text-xs font-black uppercase tracking-[.12em] text-cyan-200 hover:bg-cyan-300/[.08]">
                    Consultar COA <FileSearch size={16} />
                  </a>
                </div>
                <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                  Materiales exclusivamente para investigación de laboratorio. No destinados al uso humano ni veterinario.
                </p>
              </div>
              <aside className="rounded-3xl border border-cyan-300/15 bg-[#071426]/80 p-6 shadow-2xl sm:p-8">
                <Eyebrow>Ruta de verificación</Eyebrow>
                <h2 className="mt-4 font-['Orbitron'] text-2xl font-black uppercase text-white">Cuatro señales documentales</h2>
                <div className="mt-7 space-y-6">
                  {checks.map(([title, text], index) => (
                    <div key={title} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 font-mono text-xs font-black text-cyan-200">0{index + 1}</span>
                      <div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[.06] bg-white/[.018] px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <Eyebrow>Conceptos esenciales</Eyebrow>
            <h2 className="mt-5 max-w-3xl font-['Orbitron'] text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-4xl">Qué debes saber antes de revisar un catálogo</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                [FlaskConical, "Molécula y secuencia", "Un péptido es una cadena de aminoácidos. La secuencia, los extremos y las modificaciones declaradas ayudan a definir qué material se está evaluando."],
                [FileSearch, "Documento y lote", "Un COA útil debe vincular claramente el resultado con un lote concreto. Un documento genérico no sustituye la trazabilidad individual."],
                [ShieldCheck, "Alcance responsable", "Investigación no significa uso clínico. Una ficha responsable evita instrucciones de administración y afirmaciones terapéuticas no sustentadas."],
              ].map(([Icon, title, text]) => (
                <article key={title} className="rounded-2xl border border-white/[.08] bg-[#07111f] p-7">
                  <Icon className="text-cyan-300" size={25} />
                  <h3 className="mt-5 font-['Orbitron'] text-lg font-bold uppercase text-white">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-[.78fr_1.22fr]">
            <div>
              <Eyebrow>Certificado de análisis</Eyebrow>
              <h2 className="mt-5 font-['Orbitron'] text-3xl font-black uppercase tracking-[-.04em] text-white sm:text-4xl">Cómo leer un COA sin caer en atajos</h2>
              <p className="mt-6 text-base leading-8 text-slate-400">Un número grande no reemplaza el contexto. Lee el documento como un conjunto conectado de evidencias.</p>
              <a href="/peptide-info#coa" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-white">Abrir guía completa <ArrowRight size={15} /></a>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {[
                ["01", "Producto", "Nombre, presentación e identificadores deben describir el material correcto."],
                ["02", "Lote", "El código del documento debe coincidir con el lote físico consultado."],
                ["03", "Método", "HPLC, LC-MS u otra técnica deben aparecer con el resultado que respaldan."],
                ["04", "Resultado", "Cada valor debe interpretarse según el método y su alcance analítico."],
                ["05", "Fecha", "Permite ubicar la medición dentro del ciclo documental del lote."],
                ["06", "Responsable", "El laboratorio o entidad emisora debe poder identificarse claramente."],
              ].map(([number, title, text]) => (
                <li key={number} className="rounded-xl border border-cyan-300/10 bg-cyan-950/10 p-5">
                  <span className="font-mono text-xs font-black text-cyan-300">{number}</span>
                  <h3 className="mt-2 font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-y border-white/[.06] bg-[#06101d] px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1100px]">
            <div className="grid gap-10 lg:grid-cols-2">
              <article>
                <Eyebrow>Disponibilidad nacional</Eyebrow>
                <h2 className="mt-5 font-['Orbitron'] text-3xl font-black uppercase text-white">Investigación y documentación para Colombia</h2>
                <p className="mt-6 text-base leading-8 text-slate-400">
                  LAB_CORE organiza su catálogo alrededor de información de producto, disponibilidad,
                  trazabilidad y consulta documental. El objetivo es que el investigador pueda comparar
                  presentaciones y revisar la evidencia disponible antes de tomar una decisión.
                </p>
                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-cyan-200"><MapPin size={17} /> Atención y envíos sujetos a cobertura en Colombia</p>
              </article>
              <article className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-7">
                <h2 className="font-['Orbitron'] text-xl font-black uppercase text-white">Una distinción importante</h2>
                <p className="mt-5 text-sm leading-7 text-slate-300">
                  Un producto rotulado para investigación no debe presentarse como medicamento aprobado.
                  Tampoco deben deducirse seguridad, eficacia clínica o instrucciones de uso a partir de
                  estudios preclínicos, una etiqueta o un certificado analítico.
                </p>
                <a href="/disclaimer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-amber-200 hover:text-white">Leer aviso legal <ArrowRight size={15} /></a>
              </article>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-[900px]">
            <Eyebrow>Preguntas frecuentes</Eyebrow>
            <h2 className="mt-5 font-['Orbitron'] text-3xl font-black uppercase text-white sm:text-4xl">Respuestas sobre péptidos en Colombia</h2>
            <div className="mt-10 divide-y divide-white/[.08] border-y border-white/[.08]">
              {faqs.map(([question, answer]) => (
                <details key={question} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-white">
                    <span>{question}</span><span className="text-xl text-cyan-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[900px] border-t border-white/[.08] pt-10">
            <Eyebrow>Transparencia editorial</Eyebrow>
            <h2 className="mt-4 font-['Orbitron'] text-2xl font-black uppercase text-white">Fuentes y revisión</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Contenido educativo revisado por LAB_CORE el 25 de julio de 2026. La explicación química
              se apoya en literatura de referencia; las advertencias separan materiales de investigación
              y productos aprobados.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><a className="text-cyan-300 hover:text-white" href="https://www.ncbi.nlm.nih.gov/books/NBK26883/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf: aminoácidos y enlace peptídico ↗</a></li>
              <li><a className="text-cyan-300 hover:text-white" href="https://www.ncbi.nlm.nih.gov/books/NBK564343/" target="_blank" rel="noopener noreferrer">NCBI Bookshelf: estructura primaria y secuencia ↗</a></li>
              <li><a className="text-cyan-300 hover:text-white" href="https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss" target="_blank" rel="noopener noreferrer">FDA: diferencias y riesgos de versiones no aprobadas ↗</a></li>
            </ul>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-[1100px] rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.09] to-blue-500/[.03] p-8 sm:p-12">
            <BookOpen className="text-cyan-300" />
            <h2 className="mt-5 max-w-3xl font-['Orbitron'] text-3xl font-black uppercase text-white">Continúa con información verificable</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">Explora la guía educativa, compara el catálogo o consulta directamente los documentos disponibles por lote.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[["Guía de péptidos", "/peptide-info"], ["Catálogo", "/shop"], ["Biblioteca COA", "/coa-library"]].map(([label, href]) => (
                <a key={href} href={href} className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 px-5 py-3 text-xs font-black uppercase tracking-[.1em] text-cyan-100 hover:bg-cyan-300/10">{label}<ArrowRight size={14} /></a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </StoreProviders>
  );
}

export { faqs };
