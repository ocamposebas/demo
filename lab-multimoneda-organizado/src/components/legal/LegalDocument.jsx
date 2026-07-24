import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  LockKeyhole,
  Mail,
  Printer,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { LEGAL_PATHS, LEGAL_UPDATED_ISO, LEGAL_VERSION, legalCopy } from "./legalContent.js";

const highlightIcons = [ShieldCheck, LockKeyhole, FileCheck2, CheckCircle2];

export default function LegalDocument({ documentType }) {
  const { language } = useLanguage();
  const copy = legalCopy[language] || legalCopy.es;
  const document = copy.docs[documentType] || copy.docs.terms;
  const related = Object.entries(LEGAL_PATHS).filter(([key]) => key !== documentType);

  return (
    <main className="lab-legal-page overflow-hidden px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
      <div className="mx-auto max-w-[1180px]">
        <section className="relative overflow-hidden border-y border-cyan-300/15 py-9 sm:py-12 lg:py-14">
          <div className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-cyan-400/[0.07] blur-[90px]" />
          <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <p className="flex items-center gap-3 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                <span className="flex h-8 w-8 items-center justify-center border border-cyan-300/25 bg-cyan-300/[0.05]"><Scale size={14} /></span>
                {copy.ui.legalCenter}
              </p>
              <p className="mt-7 font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300/55">{document.code}</p>
              <h1 className="mt-4 max-w-[820px] font-['Orbitron'] text-[clamp(2rem,5.2vw,3.65rem)] font-semibold uppercase leading-[1.1] tracking-[-0.04em] text-white">
                {document.title} <span className="text-cyan-300">{document.accent}</span>
              </h1>
              <p className="mt-5 max-w-[720px] font-sans text-sm leading-7 text-slate-400 sm:text-[15px]">{document.description}</p>
            </div>

            <div className="grid grid-cols-2 border border-white/10 font-mono text-[8px] uppercase tracking-[0.12em]">
              <div className="border-b border-r border-white/10 p-4">
                <span className="block text-slate-600">{copy.ui.updated}</span>
                <time dateTime={LEGAL_UPDATED_ISO} className="mt-2 block leading-4 text-slate-300">{copy.ui.date}</time>
              </div>
              <div className="border-b border-white/10 p-4">
                <span className="block text-slate-600">{copy.ui.version}</span>
                <span className="mt-2 block text-cyan-300">{LEGAL_VERSION}</span>
              </div>
              <a href="mailto:info@labcorepep.com" className="col-span-2 flex min-h-12 items-center justify-between gap-3 px-4 text-slate-400 transition-colors hover:bg-cyan-300/[0.05] hover:text-cyan-300">
                <span className="flex items-center gap-2"><Mail size={12} /> {copy.ui.email}</span>
                <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </section>

        <section role="alert" className="mt-6 border border-red-400/25 bg-red-400/[0.035] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-400/25 text-red-300"><AlertTriangle size={17} /></span>
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-red-300">CRITICAL_USE_RESTRICTION</p>
              <p className="mt-2 font-['Orbitron'] text-[10px] font-semibold uppercase leading-6 tracking-[0.07em] text-red-100/90 sm:text-[11px]">{document.critical}</p>
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-18">
          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300">{copy.ui.plainSummary}</p>
              <p className="mt-3 font-sans text-[11px] leading-5 text-slate-600">{copy.ui.summaryWarning}</p>
            </div>
            <div className="grid border border-white/10 sm:grid-cols-2">
              {document.highlights.map(([title, text], index) => {
                const Icon = highlightIcons[index] || FileText;
                return (
                  <article key={title} className={`min-h-[155px] p-5 sm:p-6 ${index % 2 === 0 ? "sm:border-r sm:border-white/10" : ""} ${index < 2 ? "border-b border-white/10" : index === 2 ? "border-b border-white/10 sm:border-b-0" : ""}`}>
                    <Icon size={16} className="text-cyan-300" />
                    <h2 className="mt-5 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-white">{title}</h2>
                    <p className="mt-3 font-sans text-xs leading-5 text-slate-500">{text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="border-l-2 border-cyan-300/45 bg-cyan-300/[0.025] p-5 sm:p-6">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300">{copy.ui.operatorTitle}</p>
            <p className="mt-3 font-sans text-xs leading-6 text-slate-500">{copy.ui.operatorText}</p>
          </div>
          <div className="border-l-2 border-emerald-300/35 bg-emerald-300/[0.02] p-5 sm:p-6">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-300">NON_WAIVABLE_RIGHTS</p>
            <p className="mt-3 font-sans text-xs leading-6 text-slate-500">{copy.ui.mandatoryRights}</p>
          </div>
        </section>

        <details className="mt-10 border border-white/10 bg-[#061021]/40 lg:hidden">
          <summary className="cursor-pointer px-5 py-4 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300">{copy.ui.contents}</summary>
          <nav aria-label={copy.ui.contents} className="grid border-t border-white/10 px-5 py-3">
            {document.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="border-b border-white/[0.06] py-3 font-sans text-xs leading-5 text-slate-500 transition-colors last:border-0 hover:text-cyan-300">{section.title}</a>
            ))}
          </nav>
        </details>

        <div className="mt-12 grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start lg:gap-14">
          <aside className="hidden lg:sticky lg:top-36 lg:block">
            <div className="border border-white/10 p-5">
              <p className="flex items-center gap-2 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300"><FileText size={13} /> {copy.ui.contents}</p>
              <nav aria-label={copy.ui.contents} className="mt-4 grid">
                {document.sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="border-t border-white/[0.06] py-2.5 font-sans text-[11px] leading-4 text-slate-600 transition-colors hover:pl-1 hover:text-cyan-300">{section.title}</a>
                ))}
              </nav>
            </div>
            <button type="button" onClick={() => window.print()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-cyan-300/20 font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-300 transition-colors hover:bg-cyan-300 hover:text-[#020617]">
              <Printer size={13} /> {copy.ui.print}
            </button>
          </aside>

          <article className="min-w-0 border-t border-white/10">
            {document.sections.map((section) => (
              <section id={section.id} key={section.id} className="lab-scroll-target border-b border-white/10 py-9 first:pt-0 sm:py-11">
                <h2 className="font-['Orbitron'] text-base font-semibold uppercase leading-6 tracking-[0.035em] text-white sm:text-lg">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-5 max-w-[820px] font-sans text-[13px] leading-7 text-slate-400 sm:text-sm sm:leading-7">{paragraph}</p>
                ))}
                {section.bullets && (
                  <ul className="mt-5 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 font-sans text-[13px] leading-6 text-slate-400 sm:text-sm sm:leading-7">
                        <span className="mt-[10px] h-1.5 w-1.5 shrink-0 bg-cyan-300/70" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {section.note && (
                  <div className="mt-6 border-l-2 border-amber-300/45 bg-amber-300/[0.025] px-4 py-3 font-sans text-xs leading-6 text-amber-100/65">{section.note}</div>
                )}
              </section>
            ))}
          </article>
        </div>

        <section className="mt-12 border border-cyan-300/20 bg-[#040d1e] p-6 sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300">{copy.ui.acceptanceTitle}</p>
              <p className="mt-4 max-w-3xl font-sans text-sm leading-7 text-slate-400">{copy.ui.acceptanceText}</p>
            </div>
            <a href="mailto:info@labcorepep.com" className="flex min-h-12 items-center justify-center gap-2 border border-cyan-300/25 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.12em] text-cyan-300 transition-colors hover:bg-cyan-300 hover:text-[#020617]">
              <Mail size={13} /> {copy.ui.contact}
            </a>
          </div>
        </section>

        <section className="mt-16 sm:mt-20">
          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300">{copy.ui.related}</p>
          <div className="mt-5 grid border border-white/10 md:grid-cols-3">
            {related.map(([key, path], index) => (
              <a key={key} href={path} className={`group flex min-h-28 items-end justify-between gap-4 p-5 transition-colors hover:bg-cyan-300/[0.04] sm:p-6 ${index < related.length - 1 ? "border-b border-white/10 md:border-b-0 md:border-r" : ""}`}>
                <span>
                  <span className="block font-mono text-[7px] uppercase tracking-[0.16em] text-slate-600">LEGAL_DOC // 0{Object.keys(LEGAL_PATHS).indexOf(key) + 1}</span>
                  <span className="mt-3 block font-['Orbitron'] text-[10px] font-black uppercase leading-5 tracking-[0.05em] text-white group-hover:text-cyan-300">{copy.labels[key]}</span>
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-cyan-300" />
              </a>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          .lab-legal-page { padding-top: 24px !important; color: #111827 !important; }
          .lab-legal-page button, .lab-legal-page details, .lab-legal-page aside { display: none !important; }
          .lab-legal-page section, .lab-legal-page article { break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}
