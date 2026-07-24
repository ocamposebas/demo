import {
  ArrowDown,
  ArrowUpRight,
  Atom,
  CheckCircle2,
  FileCheck2,
  FlaskConical,
  Globe2,
  MapPin,
  Microscope,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";

function RouteNode({ className, place, detail, active = false }) {
  return (
    <div className={`absolute z-20 ${className}`}>
      <div className="relative flex items-center gap-3">
        <span className={`relative flex h-9 w-9 shrink-0 items-center justify-center border bg-[#041020] ${active ? "border-cyan-200 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.25)]" : "border-blue-400/35 text-blue-300"}`}>
          <MapPin size={14} />
          <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 border-2 border-[#041020] ${active ? "bg-cyan-300" : "bg-blue-400"}`} />
        </span>
        <div className="min-w-0 border-l border-white/10 pl-3">
          <p className="mt-1 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-white sm:text-xs">{place}</p>
          <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.12em] text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function AboutStory() {
  const { t } = useLanguage();
  const standards = t("about.standards");
  const chapters = t("about.chapters");
  const principles = t("about.principles");

  return (
    <main className="overflow-hidden px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
      <section className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(440px,.98fr)] lg:gap-14">
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300">
            <span className="flex h-7 w-7 items-center justify-center border border-cyan-300/25 bg-cyan-300/[0.06]">
              <Atom size={13} />
            </span>
            {t("about.heroEyebrow")}
          </div>

          <h1 className="mt-6 max-w-[720px] font-['Orbitron'] text-[clamp(2.15rem,5vw,3.75rem)] font-black uppercase leading-[1.06] tracking-[-0.055em] text-white">
            {t("about.heroTitle")}{" "}
            <span className="text-cyan-300">{t("about.heroAccent")}</span>
          </h1>

          <p className="mt-6 max-w-[650px] font-mono text-[11px] leading-6 text-slate-400 sm:text-xs sm:leading-7">
            {t("about.heroText")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#origin" className="flex min-h-12 items-center justify-center gap-2 bg-cyan-300 px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-[#020617] transition-colors hover:bg-white">
              {t("about.discoverStory")} <ArrowDown size={14} />
            </a>
            <a href="/coa-library" className="flex min-h-12 items-center justify-center gap-2 border border-cyan-300/25 bg-cyan-300/[0.04] px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200 transition-colors hover:border-cyan-200 hover:bg-cyan-300/[0.1]">
              {t("about.exploreCoa")} <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 border-y border-white/10 py-4">
            {[
              ["USA", t("about.originNode")],
              ["MEX", t("about.expansionNode")],
              ["COL", t("about.nextNode")],
            ].map(([code, label], index) => (
              <div key={code} className={`px-3 first:pl-0 ${index < 2 ? "border-r border-white/10" : ""}`}>
                <p className="font-['Orbitron'] text-sm font-black text-white sm:text-base">{code}</p>
                <p className="mt-1.5 font-mono text-[6px] uppercase leading-3 tracking-[0.12em] text-slate-600 sm:text-[7px]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.04/1] w-full max-w-[560px] overflow-hidden border border-cyan-300/15 bg-[#040d1e] shadow-[0_35px_100px_rgba(0,0,0,0.35)]">
          <span className="absolute left-0 top-0 z-30 h-5 w-5 border-l border-t border-cyan-200" />
          <span className="absolute right-0 top-0 z-30 h-5 w-5 border-r border-t border-cyan-200" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,.13),transparent_30%),radial-gradient(circle_at_75%_80%,rgba(37,99,235,.14),transparent_34%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.045]" />

          <div className="absolute left-5 right-5 top-5 z-20 flex items-center font-sans text-xs text-slate-400 sm:left-7 sm:right-7 sm:top-7">
            <span>{t("about.routeLabel")}</span>
          </div>

          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 540" fill="none" aria-hidden="true">
            <path d="M105 130 C165 145 205 185 250 245 S330 335 420 408" stroke="rgba(51,65,85,.6)" strokeWidth="2" strokeDasharray="5 9" />
            <path className="lab-about-route" d="M105 130 C165 145 205 185 250 245 S330 335 420 408" stroke="url(#aboutRoute)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="105" cy="130" r="47" stroke="rgba(34,211,238,.08)" />
            <circle cx="105" cy="130" r="72" stroke="rgba(34,211,238,.04)" />
            <circle cx="420" cy="408" r="52" stroke="rgba(59,130,246,.07)" />
            <defs>
              <linearGradient id="aboutRoute" x1="105" y1="130" x2="420" y2="408" gradientUnits="userSpaceOnUse">
                <stop stopColor="#67E8F9" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>

          <RouteNode className="left-[8%] top-[18%]" place="USA" detail={t("about.originNode")} active />
          <RouteNode className="left-[38%] top-[43%]" place="MÉXICO" detail={t("about.expansionNode")} />
          <RouteNode className="bottom-[10%] right-[7%]" place="COLOMBIA" detail={t("about.nextNode")} />

          <div className="absolute bottom-5 left-5 z-20 border border-white/10 bg-[#020817]/80 px-3 py-2 font-mono text-[7px] uppercase tracking-[0.15em] text-slate-500 backdrop-blur sm:bottom-7 sm:left-7">
            US_STANDARD → LATAM_NETWORK
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-20 max-w-[1180px] overflow-hidden border-y border-cyan-300/15 py-10 sm:mt-28 sm:py-14">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-cyan-300/[0.025] blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-center lg:gap-14">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300">{t("about.manifestoLabel")}</p>
          </div>
          <div>
            <blockquote className="font-['Orbitron'] text-xl font-semibold uppercase leading-[1.35] tracking-[-0.025em] text-white sm:text-2xl">
              “{t("about.manifestoQuote")}”
            </blockquote>
            <p className="mt-5 max-w-2xl font-mono text-[10px] leading-6 text-slate-500">{t("about.manifestoText")}</p>
          </div>
        </div>
      </section>

      <section id="origin" className="lab-scroll-target mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading
          index="01"
          eyebrow={t("about.originEyebrow")}
          title={t("about.originTitle")}
          accent={t("about.originAccent")}
          description={t("about.originDescription")}
        />

        <div className="mt-10 grid overflow-hidden border border-white/10 lg:grid-cols-[.86fr_1.14fr]">
          <div className="relative min-h-[380px] overflow-hidden border-b border-white/10 bg-[#041020] p-6 sm:p-9 lg:min-h-[520px] lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(34,211,238,.13),transparent_32%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.6)_1px,transparent_1px)] bg-[size:34px_34px] opacity-[0.04]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/70">ORIGIN_NODE // USA</span>
                <Globe2 size={20} className="text-cyan-300" />
              </div>
              <div className="my-12 flex justify-center">
                <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-cyan-300/20 sm:h-52 sm:w-52">
                  <div className="absolute inset-5 rounded-full border border-dashed border-cyan-300/15 animate-[spin_18s_linear_infinite]" />
                  <div className="absolute inset-12 rounded-full border border-blue-400/15" />
                  <span className="font-['Orbitron'] text-4xl font-black tracking-[-0.08em] text-white sm:text-5xl">USA</span>
                  <span className="absolute -bottom-3 border border-cyan-300/20 bg-[#041020] px-3 py-2 font-mono text-[7px] uppercase tracking-[0.18em] text-cyan-300">SOURCE_STANDARD</span>
                </div>
              </div>
              <div className="border-l-2 border-cyan-300/50 bg-cyan-300/[0.035] p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.18em] text-slate-600">{t("about.originProofLabel")}</p>
                <p className="mt-2 font-mono text-[8px] uppercase leading-5 tracking-[0.1em] text-slate-300">{t("about.originProof")}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-[#061021]/75 p-6 sm:p-10 lg:p-14">
            <p className="font-['Orbitron'] text-xl font-black uppercase leading-[1.35] tracking-[-0.025em] text-white sm:text-2xl lg:text-3xl">
              {t("about.originLead")}
            </p>
            <p className="mt-7 font-mono text-[10px] leading-6 text-slate-400 sm:text-[11px] sm:leading-7">
              {t("about.originBody")}
            </p>
            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                [FlaskConical, "US_ORIGIN"],
                [Microscope, "BATCH_ANALYSIS"],
                [FileCheck2, "COA_ACCESS"],
              ].map(([Icon, label]) => (
                <div key={label} className="flex min-h-20 flex-col justify-between border border-white/10 bg-white/[0.02] p-3">
                  <Icon size={16} className="text-cyan-300" />
                  <span className="mt-4 font-mono text-[7px] font-bold uppercase tracking-[0.13em] text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading
          index="02"
          eyebrow={t("about.standardsEyebrow")}
          title={t("about.standardsTitle")}
          accent={t("about.standardsAccent")}
          description={t("about.standardsDescription")}
        />

        <div className="mt-10 grid border border-white/10 lg:grid-cols-3">
          {standards.map((standard, index) => (
            <article key={standard.index} className={`group relative min-h-[260px] overflow-hidden bg-[#061021]/70 p-6 sm:p-8 ${index < standards.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""}`}>
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300">
                  {[Globe2, ScanLine, ShieldCheck][index] ? (() => {
                    const Icon = [Globe2, ScanLine, ShieldCheck][index];
                    return <Icon size={17} />;
                  })() : null}
                </div>
                <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/10">{standard.index}</span>
              </div>
              <p className="relative mt-9 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300/55">STANDARD_{standard.index}</p>
              <h3 className="relative mt-3 font-['Orbitron'] text-sm font-black uppercase tracking-[0.06em] text-white sm:text-base">{standard.title}</h3>
              <p className="relative mt-4 font-mono text-[9px] leading-5 text-slate-500">{standard.text}</p>
            </article>
          ))}
        </div>

        <div className="relative mt-5 grid overflow-hidden border border-cyan-300/15 bg-[#040d1e] lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative p-6 sm:p-10 lg:p-12">
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300">{t("about.coaPanelLabel")}</p>
            <h3 className="mt-5 max-w-xl font-['Orbitron'] text-2xl font-black uppercase leading-[1.2] tracking-[-0.035em] text-white sm:text-3xl">{t("about.coaPanelTitle")}</h3>
            <p className="mt-5 max-w-xl font-mono text-[10px] leading-6 text-slate-500">{t("about.coaPanelText")}</p>

            <div className="mt-8 grid grid-cols-3 gap-2">
              {[t("about.coaIdentity"), t("about.coaPurity"), t("about.coaTraceability")].map((label) => (
                <div key={label} className="border border-white/10 bg-white/[0.02] px-2 py-3 text-center font-mono text-[6px] font-bold uppercase tracking-[0.11em] text-slate-400 sm:text-[8px]">
                  <CheckCircle2 size={13} className="mx-auto mb-2 text-emerald-300" /> {label}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] border-t border-white/10 bg-[#020817] p-6 sm:p-9 lg:border-l lg:border-t-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:26px_26px] opacity-[0.04]" />
            <div className="relative h-full border border-white/10 bg-[#071326]/85 p-5 shadow-[0_20px_60px_rgba(0,0,0,.3)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.1em] text-white">CERTIFICATE_OF_ANALYSIS</p>
                  <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.15em] text-slate-600">LAB_CORE // BATCH_VERIFICATION</p>
                </div>
                <FileCheck2 size={20} className="text-cyan-300" />
              </div>
              <div className="mt-6 space-y-5">
                {[
                  ["IDENTITY_MATCH", "100%"],
                  ["PURITY_PROFILE", ">99%"],
                  ["BATCH_TRACE", "VERIFIED"],
                ].map(([label, value], index) => (
                  <div key={label}>
                    <div className="flex justify-between font-mono text-[7px] uppercase tracking-[0.13em] text-slate-500"><span>{label}</span><span className="text-cyan-300">{value}</span></div>
                    <div className="mt-2 h-1 overflow-hidden bg-white/5"><span className="block h-full bg-gradient-to-r from-cyan-500 to-cyan-200" style={{ width: index === 1 ? "99%" : "100%" }} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center justify-between border-t border-dashed border-white/10 pt-4 font-mono text-[7px] uppercase tracking-[0.13em] text-slate-600">
                <span>US_LAB // THIRD_PARTY</span>
                <span className="text-emerald-300">DOCUMENT_READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading
          index="03"
          eyebrow={t("about.expansionEyebrow")}
          title={t("about.expansionTitle")}
          accent={t("about.expansionAccent")}
          description={t("about.expansionDescription")}
        />

        <div className="relative mt-10 grid gap-0 border border-white/10 lg:grid-cols-3">
          <div className="absolute left-[16.66%] right-[16.66%] top-[57px] hidden h-px bg-gradient-to-r from-cyan-300/35 via-blue-400/35 to-cyan-300/35 lg:block" />
          {chapters.map((chapter, index) => (
            <article key={chapter.place} className={`relative bg-[#061021]/65 p-6 sm:p-8 ${index < chapters.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""}`}>
              <div className="relative z-10 flex h-12 w-12 items-center justify-center border border-cyan-300/25 bg-[#041020] font-['Orbitron'] text-[10px] font-black text-cyan-300">0{index + 1}</div>
              <p className="mt-8 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300/55">{chapter.chapter} // {chapter.status}</p>
              <h3 className="mt-3 font-['Orbitron'] text-xl font-black uppercase tracking-[-0.025em] text-white">{chapter.place}</h3>
              <p className="mt-4 font-mono text-[9px] leading-5 text-slate-500">{chapter.text}</p>
            </article>
          ))}
        </div>

        <div className="relative mt-5 overflow-hidden border border-blue-400/20 bg-[linear-gradient(110deg,rgba(15,44,91,.65),rgba(4,13,30,.9))] p-6 sm:p-9 lg:p-11">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
          <div className="relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border border-blue-300/25 bg-blue-400/[0.08] text-blue-300"><Sparkles size={17} /></span>
              <p className="font-mono text-[8px] font-bold uppercase leading-4 tracking-[0.18em] text-blue-300">{t("about.marketLabel")}</p>
            </div>
            <div>
              <p className="font-['Orbitron'] text-base font-semibold uppercase leading-[1.55] tracking-[-0.015em] text-white sm:text-lg">{t("about.marketClaim")}</p>
              <p className="mt-4 font-mono text-[7px] leading-4 text-slate-600">* {t("about.marketFootnote")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1180px] sm:mt-28">
        <SectionHeading
          index="04"
          eyebrow={t("about.principlesEyebrow")}
          title={t("about.principlesTitle")}
          accent={t("about.principlesAccent")}
          description={t("about.principlesDescription")}
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {principles.map((principle, index) => (
            <article key={principle.title} className="relative min-h-[220px] border border-white/10 bg-transparent p-6 sm:p-7">
              <span className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300/50">RULE // 0{index + 1}</span>
              <h3 className="mt-8 font-['Orbitron'] text-sm font-black uppercase tracking-[0.04em] text-white sm:text-base">{principle.title}</h3>
              <p className="mt-4 font-mono text-[9px] leading-5 text-slate-500">{principle.text}</p>
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-cyan-300/40" />
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto mt-20 max-w-[1180px] overflow-hidden border border-cyan-300/15 bg-[#040d1e] px-6 py-12 sm:mt-28 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(34,211,238,.1),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.6)_1px,transparent_1px)] bg-[size:36px_36px] opacity-[0.03]" />
        <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,.92fr)] lg:items-end">
          <div>
            <p className="font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-cyan-300">{t("about.signatureEyebrow")}</p>
            <h2 className="mt-5 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.04em] text-white sm:text-3xl lg:text-4xl">{t("about.signatureTitle")}</h2>
            <p className="mt-7 max-w-2xl font-mono text-[10px] leading-6 text-slate-400 sm:text-[11px] sm:leading-7">{t("about.signatureTextOne")}</p>
            <p className="mt-5 max-w-2xl font-mono text-[10px] leading-6 text-slate-500 sm:text-[11px] sm:leading-7">{t("about.signatureTextTwo")}</p>
          </div>

          <div className="lg:pl-8">
            <div className="relative w-full max-w-[430px] pb-5 pt-2" role="img" aria-label={t("about.signatureName")}>
              <p className="relative z-10 -rotate-2 font-['Allura'] text-[clamp(4.5rem,10vw,6.7rem)] leading-none text-white drop-shadow-[0_0_22px_rgba(103,232,249,.16)]">
                Lab Core
              </p>
              <svg className="absolute bottom-0 left-0 h-10 w-full" viewBox="0 0 430 40" fill="none" aria-hidden="true">
                <path className="lab-about-signature-line" d="M8 23C96 35 238 33 421 15" stroke="url(#signatureLine)" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="signatureLine" x1="8" y1="23" x2="421" y2="15" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#67E8F9" stopOpacity="0.18" />
                    <stop offset="0.52" stopColor="#67E8F9" />
                    <stop offset="1" stopColor="#3B82F6" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="mt-3 border-t border-white/10 pt-4">
              <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.16em] text-white">{t("about.signatureName")}</p>
              <p className="mt-2 font-mono text-[7px] uppercase leading-4 tracking-[0.13em] text-slate-600">{t("about.signatureRole")}</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes labAboutRoute {
          from { stroke-dasharray: 0 650; }
          to { stroke-dasharray: 650 0; }
        }
        @keyframes labAboutSignature {
          from { stroke-dasharray: 0 500; }
          to { stroke-dasharray: 500 0; }
        }
        .lab-about-route { animation: labAboutRoute 2.2s cubic-bezier(.16,1,.3,1) both; }
        .lab-about-signature-line { animation: labAboutSignature 1.8s .2s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .lab-about-route, .lab-about-signature-line { animation: none; }
        }
      `}</style>
    </main>
  );
}
