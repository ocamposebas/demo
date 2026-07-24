import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  Atom,
  Box,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ClipboardCheck,
  FileCheck2,
  FlaskConical,
  Link2,
  Microscope,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import PeptideDirectory from "./PeptideDirectory.jsx";

const sourceUrls = [
  "https://goldbook.iupac.org/terms/view/P04479",
  "https://www.fda.gov/drugs/investigational-new-drug-ind-application/ind-applications-clinical-investigations-chemistry-manufacturing-and-control-cmc-information",
  "https://www.nist.gov/publications/isotope-dilution-liquid-chromatography-tandem-mass-spectrometry-quantitative-amino-acid",
  "https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks",
];

export default function PeptideInfo() {
  const { t } = useLanguage();
  const [activeCoa, setActiveCoa] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const basicSteps = t("peptideInfo.basicSteps");
  const anatomyParts = t("peptideInfo.anatomyParts");
  const peptideForms = t("peptideInfo.forms");
  const synthesisSteps = t("peptideInfo.synthesisSteps");
  const qualityItems = t("peptideInfo.qualityItems");
  const methods = t("peptideInfo.methods");
  const methodColumns = t("peptideInfo.methodColumns");
  const coaFields = t("peptideInfo.coaFields");
  const lifecycleSteps = t("peptideInfo.lifecycleSteps");
  const handlingItems = t("peptideInfo.handlingItems");
  const faqs = t("peptideInfo.faqs");
  const sourceLinks = t("peptideInfo.sourceLinks");

  return (
    <main className="overflow-hidden px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
      <section className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(430px,.92fr)] lg:gap-14">
        <div>
          <div className="flex items-center gap-3 font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300">
            <span className="flex h-7 w-7 items-center justify-center border border-cyan-300/25 bg-cyan-300/[0.06]">
              <Atom size={13} />
            </span>
            {t("peptideInfo.heroEyebrow")}
          </div>

          <h1 className="mt-6 max-w-[720px] font-['Orbitron'] text-[clamp(2.1rem,5vw,3.7rem)] font-black uppercase leading-[1.06] tracking-[-0.055em] text-white">
            {t("peptideInfo.heroTitle")}{" "}
            <span className="text-cyan-300">{t("peptideInfo.heroAccent")}</span>
          </h1>

          <p className="mt-6 max-w-[650px] font-mono text-[11px] leading-6 text-slate-400 sm:text-xs sm:leading-7">
            {t("peptideInfo.heroText")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#peptide-directory" className="flex min-h-12 items-center justify-center gap-2 bg-cyan-300 px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-[#020617] transition-colors hover:bg-white">
              {t("peptideInfo.startGuide")} <ArrowDown size={14} />
            </a>
            <a href="/coa-library" className="flex min-h-12 items-center justify-center gap-2 border border-cyan-300/25 bg-cyan-300/[0.04] px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200 transition-colors hover:border-cyan-200 hover:bg-cyan-300/[0.1]">
              {t("peptideInfo.viewCoa")} <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="mt-9 grid grid-cols-3 border-y border-white/10 py-4">
            {[t("peptideInfo.readTime"), t("peptideInfo.modules"), t("peptideInfo.noClinical")].map((item, index) => (
              <div key={item} className={`px-2 first:pl-0 sm:px-4 ${index < 2 ? "border-r border-white/10" : ""}`}>
                <p className="font-mono text-[7px] uppercase leading-4 tracking-[0.11em] text-slate-500 sm:text-[8px]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[540px] overflow-hidden border border-cyan-300/15 bg-[#040d1e] p-5 shadow-[0_35px_100px_rgba(0,0,0,.34)] sm:p-8">
          <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-cyan-200" />
          <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-cyan-200" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,.12),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.04]" />

          <div className="relative flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.18em] text-slate-600">
            <span>{t("peptideInfo.chainLabel")}</span>
            <span className="text-emerald-300">MODEL_READY</span>
          </div>

          <div className="relative my-10 flex items-center justify-center sm:my-14">
            {["N", "Cα", "C", "N", "Cα"].map((label, index) => (
              <div key={`${label}-${index}`} className="flex items-center">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border font-['Orbitron'] text-[9px] font-black sm:h-16 sm:w-16 sm:text-xs ${index === 2 ? "border-blue-400/40 bg-blue-400/10 text-blue-200" : "border-cyan-300/30 bg-cyan-300/[0.06] text-cyan-100"}`}>
                  {label}
                  <span className="absolute inset-1 rounded-full border border-dashed border-white/[0.06]" />
                </div>
                {index < 4 && <span className={`h-px w-3 sm:w-5 ${index === 2 ? "bg-blue-400" : "bg-cyan-300/45"}`} />}
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-3 gap-2">
            {[
              [CircleDot, t("peptideInfo.aminoAcid")],
              [Link2, t("peptideInfo.peptideBond")],
              [ScanLine, t("peptideInfo.sequence")],
            ].map(([Icon, label]) => (
              <div key={label} className="border border-white/10 bg-white/[0.02] p-2.5 text-center sm:p-3">
                <Icon size={13} className="mx-auto text-cyan-300" />
                <p className="mt-2 font-mono text-[6px] font-bold uppercase leading-3 tracking-[0.09em] text-slate-500 sm:text-[7px]">{label}</p>
              </div>
            ))}
          </div>

          <div className="relative mt-5 border-l-2 border-cyan-300/50 bg-cyan-300/[0.035] p-4">
            <p className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-cyan-300">{t("peptideInfo.quickLabel")}</p>
            <p className="mt-2 font-mono text-[9px] leading-5 text-slate-300">{t("peptideInfo.definition")}</p>
            <p className="mt-2 font-mono text-[8px] leading-4 text-slate-600">{t("peptideInfo.definitionNote")}</p>
          </div>
        </div>
      </section>

      <PeptideDirectory />

      <section id="peptide-basics" className="lab-scroll-target mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="02" eyebrow={t("peptideInfo.basicsEyebrow")} title={t("peptideInfo.basicsTitle")} accent={t("peptideInfo.basicsAccent")} description={t("peptideInfo.basicsDescription")} />

        <div className="relative mt-10 grid border border-white/10 md:grid-cols-3">
          <div className="absolute left-[16.66%] right-[16.66%] top-[51px] hidden h-px bg-gradient-to-r from-cyan-300/30 via-blue-400/35 to-cyan-300/30 md:block" />
          {basicSteps.map((step, index) => (
            <article key={step.index} className={`relative min-h-[230px] bg-[#061021]/65 p-6 sm:p-8 ${index < 2 ? "border-b border-white/10 md:border-b-0 md:border-r" : ""}`}>
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/30 bg-[#041020] font-mono text-[8px] font-bold text-cyan-300">{step.index}</div>
              <h2 className="mt-8 font-['Orbitron'] text-sm font-black uppercase tracking-[0.07em] text-white">{step.title}</h2>
              <p className="mt-4 font-mono text-[9px] leading-5 text-slate-500">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="03" eyebrow={t("peptideInfo.anatomyEyebrow")} title={t("peptideInfo.anatomyTitle")} accent={t("peptideInfo.anatomyAccent")} description={t("peptideInfo.anatomyDescription")} />

        <div className="mt-10 grid overflow-hidden border border-white/10 lg:grid-cols-[1.12fr_.88fr]">
          <div className="grid sm:grid-cols-2">
            {anatomyParts.map((part, index) => (
              <article key={part.title} className={`min-h-[210px] bg-[#061021]/60 p-6 sm:p-7 ${index % 2 === 0 ? "sm:border-r sm:border-white/10" : ""} ${index < 2 ? "border-b border-white/10" : index === 2 ? "border-b border-white/10 sm:border-b-0" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 min-w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/[0.055] px-2 font-['Orbitron'] text-[9px] font-black text-cyan-200">{part.key}</span>
                  <span className="font-mono text-[7px] tracking-[0.18em] text-slate-700">ATOM_REF // 0{index + 1}</span>
                </div>
                <h2 className="mt-7 font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.06em] text-white">{part.title}</h2>
                <p className="mt-3 font-mono text-[8px] leading-5 text-slate-500">{part.text}</p>
              </article>
            ))}
          </div>

          <aside className="border-t border-white/10 bg-[#040d1e] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300"><Atom size={15} /></span>
              <h2 className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.075em] text-white">{t("peptideInfo.formsTitle")}</h2>
            </div>
            <div className="mt-6 grid gap-2">
              {peptideForms.map((form, index) => (
                <div key={form.title} className="grid grid-cols-[32px_1fr] gap-3 border border-white/[0.075] bg-white/[0.015] p-3.5">
                  <span className="font-mono text-[8px] font-bold text-cyan-300/55">0{index + 1}</span>
                  <div>
                    <p className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em] text-slate-200">{form.title}</p>
                    <p className="mt-1.5 font-mono text-[7px] leading-4 text-slate-600">{form.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 border-l-2 border-blue-400/45 bg-blue-400/[0.04] p-4 font-mono text-[8px] leading-5 text-blue-100/55">{t("peptideInfo.anatomyNote")}</p>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="04" eyebrow={t("peptideInfo.synthesisEyebrow")} title={t("peptideInfo.synthesisTitle")} accent={t("peptideInfo.synthesisAccent")} description={t("peptideInfo.synthesisDescription")} />

        <div className="relative mt-10 grid overflow-hidden border border-white/10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-[53px] hidden h-px bg-gradient-to-r from-cyan-300/10 via-cyan-300/45 to-cyan-300/10 lg:block" />
          {synthesisSteps.map((step, index) => (
            <article key={step.code} className={`relative min-h-[215px] bg-[#061021]/55 p-5 sm:p-6 ${index < synthesisSteps.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""} ${index % 2 === 0 && index < synthesisSteps.length - 1 ? "sm:border-r sm:border-white/10 lg:border-r" : ""} ${index === 1 || index === 3 ? "sm:border-r-0" : ""} ${index === synthesisSteps.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/30 bg-[#041020] font-mono text-[7px] font-bold text-cyan-300">{step.code}</span>
              <h2 className="mt-7 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.065em] text-white">{step.title}</h2>
              <p className="mt-3 font-mono text-[8px] leading-5 text-slate-500">{step.text}</p>
            </article>
          ))}
        </div>
        <div className="flex items-start gap-3 border-x border-b border-cyan-300/15 bg-cyan-300/[0.035] p-4 sm:px-6">
          <FlaskConical size={14} className="mt-0.5 shrink-0 text-cyan-300" />
          <p className="font-mono text-[8px] leading-5 text-cyan-100/55">{t("peptideInfo.synthesisNote")}</p>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="05" eyebrow={t("peptideInfo.qualityEyebrow")} title={t("peptideInfo.qualityTitle")} accent={t("peptideInfo.qualityAccent")} description={t("peptideInfo.qualityDescription")} />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {qualityItems.map((item) => (
            <article key={item.key} className="group relative min-h-[220px] overflow-hidden border border-white/10 bg-[#061021]/60 p-5 sm:p-6">
              <span className="font-mono text-xl font-black tracking-[-0.04em] text-cyan-300">{item.key}</span>
              <h2 className="mt-8 font-['Orbitron'] text-[11px] font-black uppercase leading-5 tracking-[0.045em] text-white">{item.title}</h2>
              <p className="mt-4 font-mono text-[8px] leading-[1.75] text-slate-500">{item.text}</p>
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-cyan-300/40" />
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="06" eyebrow={t("peptideInfo.methodsEyebrow")} title={t("peptideInfo.methodsTitle")} accent={t("peptideInfo.methodsAccent")} description={t("peptideInfo.methodsDescription")} />

        <div className="mt-10 overflow-hidden border border-white/10">
          <div className="hidden grid-cols-[.55fr_1fr_1fr] border-b border-white/10 bg-cyan-300/[0.035] px-6 py-4 font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-cyan-300/70 md:grid">
            <span>{methodColumns.method}</span><span>{methodColumns.tells}</span><span>{methodColumns.limit}</span>
          </div>
          {methods.map((method, index) => (
            <article key={method.method} className={`grid gap-4 bg-[#061021]/55 p-5 md:grid-cols-[.55fr_1fr_1fr] md:gap-8 md:px-6 md:py-5 ${index < methods.length - 1 ? "border-b border-white/10" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-300"><Microscope size={14} /></span>
                <h2 className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.07em] text-white">{method.method}</h2>
              </div>
              <div>
                <p className="mb-1 font-mono text-[6px] font-bold uppercase tracking-[0.14em] text-emerald-300/65 md:hidden">{methodColumns.tells}</p>
                <p className="font-mono text-[8px] leading-5 text-slate-400">{method.tells}</p>
              </div>
              <div>
                <p className="mb-1 font-mono text-[6px] font-bold uppercase tracking-[0.14em] text-amber-300/65 md:hidden">{methodColumns.limit}</p>
                <p className="font-mono text-[8px] leading-5 text-slate-500">{method.limit}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="07" eyebrow={t("peptideInfo.coaEyebrow")} title={t("peptideInfo.coaTitle")} accent={t("peptideInfo.coaAccent")} description={t("peptideInfo.coaDescription")} />

        <div className="mt-10 grid overflow-hidden border border-cyan-300/15 bg-[#040d1e] lg:grid-cols-[.82fr_1.18fr]">
          <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="grid gap-2">
              {coaFields.map((field, index) => (
                <button key={field.code} type="button" onClick={() => setActiveCoa(index)} aria-pressed={activeCoa === index} className={`flex min-h-14 items-center gap-3 border px-3 text-left transition-colors ${activeCoa === index ? "border-cyan-300/50 bg-cyan-300/[0.09] text-white" : "border-white/[0.07] bg-white/[0.015] text-slate-500 hover:border-cyan-300/20 hover:text-slate-300"}`}>
                  <span className={`font-mono text-[8px] font-bold ${activeCoa === index ? "text-cyan-300" : "text-slate-700"}`}>{field.code}</span>
                  <span className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em]">{field.title}</span>
                  <ArrowUpRight size={12} className="ml-auto" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex min-h-[390px] flex-col justify-between overflow-hidden p-6 sm:p-10 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(34,211,238,.11),transparent_32%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.035]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300">COA_FIELD // {coaFields[activeCoa].code}</span>
                <FileCheck2 size={20} className="text-cyan-300" />
              </div>
              <p className="mt-10 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-slate-600">{coaFields[activeCoa].short}</p>
              <h2 className="mt-3 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">{coaFields[activeCoa].title}</h2>
              <p className="mt-6 max-w-xl font-mono text-[10px] leading-6 text-slate-400">{coaFields[activeCoa].text}</p>
            </div>
            <div className="relative mt-10 flex items-start gap-3 border-l-2 border-amber-300/55 bg-amber-300/[0.04] p-4">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="font-mono text-[8px] leading-5 text-amber-100/65">{t("peptideInfo.coaWarning")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="08" eyebrow={t("peptideInfo.lifecycleEyebrow")} title={t("peptideInfo.lifecycleTitle")} accent={t("peptideInfo.lifecycleAccent")} description={t("peptideInfo.lifecycleDescription")} />

        <div className="mt-10 grid overflow-hidden border border-white/10 lg:grid-cols-[1.15fr_.85fr]">
          <div className="grid sm:grid-cols-2">
            {lifecycleSteps.map((step, index) => (
              <article key={step.title} className={`min-h-[180px] bg-[#061021]/60 p-5 sm:p-6 ${index % 2 === 0 ? "sm:border-r sm:border-white/10" : ""} ${index < 2 ? "border-b border-white/10" : index === 2 ? "border-b border-white/10 sm:border-b-0" : ""}`}>
                <div className="flex items-center justify-between">
                  {[Box, ClipboardCheck, FileCheck2, ShieldCheck][index] ? (() => {
                    const Icon = [Box, ClipboardCheck, FileCheck2, ShieldCheck][index];
                    return <Icon size={17} className="text-cyan-300" />;
                  })() : null}
                  <span className="font-mono text-[8px] text-slate-700">0{index + 1}</span>
                </div>
                <h2 className="mt-7 font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.08em] text-white">{step.title}</h2>
                <p className="mt-3 font-mono text-[8px] leading-5 text-slate-500">{step.text}</p>
              </article>
            ))}
          </div>

          <aside className="border-t border-white/10 bg-[#040d1e] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="flex h-10 w-10 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300"><ClipboardCheck size={17} /></div>
            <h2 className="mt-6 font-['Orbitron'] text-sm font-black uppercase tracking-[0.06em] text-white">{t("peptideInfo.handlingTitle")}</h2>
            <ul className="mt-6 space-y-4">
              {handlingItems.map((item) => (
                <li key={item} className="flex items-start gap-3 font-mono text-[8px] leading-5 text-slate-500">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" /> {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading index="09" eyebrow={t("peptideInfo.faqEyebrow")} title={t("peptideInfo.faqTitle")} accent={t("peptideInfo.faqAccent")} description={t("peptideInfo.faqDescription")} />

        <div className="mt-10 grid gap-3">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <article key={faq.question} className={`border transition-colors ${open ? "border-cyan-300/25 bg-cyan-300/[0.035]" : "border-white/10 bg-[#061021]/45"}`}>
                <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-4 px-4 text-left sm:px-6">
                  <span className="font-mono text-[8px] font-bold text-cyan-300/55">0{index + 1}</span>
                  <span className="font-['Orbitron'] text-[9px] font-black uppercase leading-5 tracking-[0.055em] text-white sm:text-[10px]">{faq.question}</span>
                  <ChevronDown size={15} className={`ml-auto shrink-0 text-cyan-300 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && <p className="border-t border-white/[0.07] px-4 py-5 pl-12 font-mono text-[9px] leading-6 text-slate-500 sm:px-6 sm:pl-16">{faq.answer}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <div className="grid overflow-hidden border border-amber-300/20 bg-amber-300/[0.035] lg:grid-cols-[220px_1fr]">
          <div className="flex items-center gap-3 border-b border-amber-300/10 p-5 lg:border-b-0 lg:border-r lg:p-7">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-300/25 text-amber-300"><AlertTriangle size={17} /></span>
            <h2 className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.09em] text-amber-100">{t("peptideInfo.boundaryTitle")}</h2>
          </div>
          <p className="p-5 font-mono text-[9px] leading-6 text-amber-100/55 lg:p-7">{t("peptideInfo.boundaryText")}</p>
        </div>

        <div className="mt-5 border border-white/10 p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.1em] text-white">{t("peptideInfo.sourcesTitle")}</p>
              <p className="mt-2 font-mono text-[8px] leading-4 text-slate-600">{t("peptideInfo.sourcesText")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {sourceLinks.map((label, index) => (
                <a key={label} href={sourceUrls[index]} target="_blank" rel="noreferrer" className="flex min-h-9 items-center gap-2 border border-white/10 px-3 font-mono text-[7px] uppercase tracking-[0.1em] text-slate-500 transition-colors hover:border-cyan-300/30 hover:text-cyan-300">
                  {label} <ArrowUpRight size={11} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
