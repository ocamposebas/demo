import {
  Activity,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function HeroPro() {
  const { t, language } = useLanguage();

  const highlights = language === "es"
    ? [["99,86%", "Pureza declarada"], ["HPLC", "Análisis por lote"], ["COA", "Consulta disponible"]]
    : [["99.86%", "Declared purity"], ["HPLC", "Batch analysis"], ["COA", "Available records"]];

  return (
    <section className="relative overflow-hidden px-4 pb-12 pt-[var(--lab-mobile-page-top)] font-['Orbitron'] sm:px-6 sm:pb-14 sm:pt-40 lg:px-12 lg:pb-16 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(6,182,212,0.025)_95%)] bg-[size:100%_32px]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[110px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-blue-700/[0.07] blur-[130px]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] items-center gap-10 lg:grid-cols-[1.03fr_0.97fr] lg:gap-14 xl:gap-20">
        <div className="min-w-0">
          <div className="mb-6 flex max-w-[680px] animate-[labFadeLeft_.5s_ease-out] items-center gap-3 font-mono uppercase">
            <Activity size={15} className="shrink-0 text-cyan-300" />
            <span className="text-[10px] font-bold leading-5 tracking-[0.13em] text-cyan-200/80 sm:text-[11px] sm:tracking-[0.16em]">
              {t("hero.certified")}
            </span>
            <span className="h-px min-w-5 flex-1 bg-gradient-to-r from-cyan-300/25 to-transparent" />
          </div>

          <h1 className="max-w-[680px] animate-[labFadeUp_.7s_.12s_both] text-4xl font-black uppercase leading-[1.06] tracking-[-0.04em] text-white sm:text-5xl lg:text-[3.45rem]">
            {t("hero.pureScience")}
            <span className="block bg-gradient-to-r from-cyan-400 via-cyan-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(6,182,212,0.2)]">
              {t("hero.rawIntegrity")}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl animate-[labFadeIn_.8s_.28s_both] font-sans text-base font-normal leading-[1.75] text-slate-300 sm:text-lg">
            {t("hero.descriptionBefore")} {" "}
            <span className="font-semibold text-cyan-300">{t("hero.purity")}</span>.
            {t("hero.descriptionAfter")}
          </p>

          <div className="mt-8 flex animate-[labFadeUp_.6s_.4s_both] flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="/shop"
              className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#020617] shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-colors hover:bg-white sm:w-auto"
            >
              {t("hero.viewCatalog")}
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/coa-library"
              className="flex min-h-12 w-full items-center justify-center rounded-xl border border-cyan-300/30 px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200 transition-colors hover:border-cyan-200 hover:bg-cyan-300/[0.08] sm:w-auto"
            >
              {t("hero.verifyCoa")}
            </a>
          </div>

          <div className="mt-9 grid max-w-[620px] grid-cols-3 divide-x divide-cyan-300/15 border-y border-cyan-300/15 py-4 sm:py-5">
            {highlights.map(([value, label]) => (
              <div key={label} className="min-w-0 px-3 first:pl-0 sm:px-5">
                <p className="text-lg font-black tracking-tight text-white sm:text-xl">{value}</p>
                <p className="mt-1 font-sans text-[11px] leading-4 text-slate-400 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto block w-full max-w-[510px] animate-[labFadeScale_.8s_.22s_both] lg:justify-self-end">
          <div className="relative min-h-[420px] overflow-visible sm:min-h-[500px]">
            <div className="pointer-events-none absolute left-1/2 top-[48%] h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10 sm:h-[410px] sm:w-[410px]" />
            <div className="pointer-events-none absolute left-1/2 top-[48%] h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-300/15 animate-[spin_42s_linear_infinite] sm:h-[330px] sm:w-[330px]" />
            <div className="pointer-events-none absolute left-1/2 top-[48%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/15 blur-[80px]" />
            <div className="pointer-events-none absolute inset-x-16 bottom-8 h-16 rounded-[50%] bg-cyan-300/20 blur-[32px]" />

            <div className="absolute left-1 top-28 z-20 hidden items-center gap-3 pl-4 drop-shadow-[0_12px_24px_rgba(0,0,0,.65)] before:absolute before:inset-y-1 before:left-0 before:w-px before:bg-gradient-to-b before:from-cyan-200 before:via-cyan-300/70 before:to-transparent sm:left-3 sm:flex">
              <FlaskConical size={17} className="shrink-0 text-cyan-300" />
              <div>
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200">HPLC</span>
                <p className="mt-0.5 text-[28px] font-black leading-none tracking-[-0.06em] text-white">
                  {language === "es" ? "99,86" : "99.86"}<span className="text-cyan-300">%</span>
                </p>
                <p className="mt-1 font-sans text-[11px] font-medium leading-4 text-slate-300">
                  {language === "es" ? "Pureza estructural" : "Structural purity"}
                </p>
              </div>
            </div>

            <div className="absolute right-1 top-12 z-20 hidden max-w-[190px] items-center gap-3 rounded-xl border border-cyan-300/20 bg-[#071426]/90 p-4 shadow-[0_18px_45px_rgba(0,0,0,.35)] backdrop-blur-xl sm:right-3 sm:top-16 sm:flex">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10 text-emerald-300"><ShieldCheck size={19} /></span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-white">{language === "es" ? "COA por lote" : "Batch COA"}</p>
                <p className="mt-1 font-sans text-[11px] leading-4 text-slate-400">{language === "es" ? "Consulta trazable" : "Traceable record"}</p>
              </div>
            </div>

            <img
              src="/tarro1.png"
              alt={language === "es" ? "Vial de compuesto para investigación" : "Research compound vial"}
              width="640"
              height="640"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              className="absolute inset-x-0 bottom-12 top-2 z-10 mx-auto h-[350px] max-h-[calc(100%-3.5rem)] w-full max-w-full object-contain object-center drop-shadow-[0_28px_42px_rgba(0,0,0,.55)] sm:bottom-8 sm:h-[445px]"
            />

            <div className="absolute inset-x-8 bottom-0 z-30 flex items-center justify-center gap-2 border-t border-cyan-300/15 pt-3 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:inset-x-14">
              <CheckCircle2 size={14} className="text-emerald-300" />
              {language === "es" ? "Solo investigación de laboratorio" : "Laboratory research only"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
