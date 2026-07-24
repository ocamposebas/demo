import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
  FlaskConical,
  Microscope,
  Search,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";

const directorySourceUrls = {
  "mots-c": "https://pubmed.ncbi.nlm.nih.gov/42324588/",
  tesamorelin: "https://pubmed.ncbi.nlm.nih.gov/38905488/",
  ipamorelin: "https://pubmed.ncbi.nlm.nih.gov/9849822/",
  "cjc-1295": "https://pubmed.ncbi.nlm.nih.gov/16352683/",
  "ghk-cu": "https://pubmed.ncbi.nlm.nih.gov/11045606/",
  "bpc-157": "https://pubmed.ncbi.nlm.nih.gov/40131143/",
  "tb-500": "https://pubmed.ncbi.nlm.nih.gov/41235866/",
  semax: "https://pubmed.ncbi.nlm.nih.gov/25310602/",
};

export default function PeptideDirectory() {
  const { t } = useLanguage();
  const [directoryFilter, setDirectoryFilter] = useState("all");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [activePeptide, setActivePeptide] = useState("mots-c");
  const directoryFilters = t("peptideInfo.directoryFilters");
  const directoryItems = t("peptideInfo.directoryItems");
  const directoryLabels = t("peptideInfo.directoryLabels");
  const directoryFacts = t("peptideInfo.directoryFacts");
  const normalizedQuery = directoryQuery.trim().toLocaleLowerCase();
  const visibleItems = directoryItems.filter((item) => {
    const matchesFilter = directoryFilter === "all" || item.group === directoryFilter;
    const searchable = `${item.name} ${item.classification} ${item.context} ${item.advance}`.toLocaleLowerCase();
    return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const selectedPeptide = visibleItems.find((item) => item.id === activePeptide) || visibleItems[0];

  return (
    <section id="peptide-directory" className="lab-scroll-target mx-auto mt-16 max-w-[1180px] sm:mt-20">
      <SectionHeading index="01" eyebrow={t("peptideInfo.directoryEyebrow")} title={t("peptideInfo.directoryTitle")} accent={t("peptideInfo.directoryAccent")} description={t("peptideInfo.directoryDescription")} />

      <div className="mt-8 grid overflow-hidden border border-cyan-300/15 sm:grid-cols-3">
        {directoryFacts.map((fact, index) => (
          <div key={fact.title} className={`flex min-h-24 items-center gap-4 bg-cyan-300/[0.025] p-4 sm:p-5 ${index < directoryFacts.length - 1 ? "border-b border-cyan-300/10 sm:border-b-0 sm:border-r" : ""}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.055] text-cyan-300">
              {[FlaskConical, Microscope, CircleDot].map((Icon, iconIndex) => iconIndex === index && <Icon key={fact.title} size={16} />)}
            </span>
            <div>
              <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.06em] text-white">{fact.title}</p>
              <p className="mt-1.5 font-mono text-[10px] leading-5 text-slate-500">{fact.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-x border-b border-white/10 bg-[#040d1e] p-3 sm:p-5">
        <div className="grid gap-3 border-b border-white/[0.08] pb-5 lg:grid-cols-[minmax(280px,.62fr)_1.38fr] lg:items-center">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300/55" />
            <input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder={t("peptideInfo.directorySearch")} className="min-h-12 w-full border border-white/10 bg-white/[0.025] pl-12 pr-4 font-mono text-[11px] text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/40" />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
            {directoryFilters.map((filter) => (
              <button key={filter.key} type="button" onClick={() => setDirectoryFilter(filter.key)} aria-pressed={directoryFilter === filter.key} className={`min-h-10 shrink-0 border px-3.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] transition-colors ${directoryFilter === filter.key ? "border-cyan-300/45 bg-cyan-300/[0.09] text-cyan-100" : "border-white/10 text-slate-500 hover:border-cyan-300/25 hover:text-slate-200"}`}>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-slate-600">
          <span>LAB_DIRECTORY // INDEX</span>
          <span className="text-cyan-300/70">{visibleItems.length} {t("peptideInfo.directoryRecord")}</span>
        </div>

        {selectedPeptide ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[.62fr_1.38fr] lg:items-start">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {visibleItems.map((item, index) => (
                <button key={item.id} type="button" onClick={() => setActivePeptide(item.id)} aria-pressed={selectedPeptide.id === item.id} className={`group flex min-h-[82px] items-center gap-4 border px-4 text-left transition-colors ${selectedPeptide.id === item.id ? "border-cyan-300/45 bg-cyan-300/[0.08]" : "border-white/[0.08] bg-white/[0.012] hover:border-cyan-300/25 hover:bg-white/[0.025]"}`}>
                  <span className={`font-mono text-[10px] font-bold ${selectedPeptide.id === item.id ? "text-cyan-300" : "text-slate-700"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block font-['Orbitron'] text-xs font-black uppercase tracking-[0.05em] text-white">{item.name}</span>
                    <span className="mt-1.5 block truncate font-mono text-[9px] text-slate-500">{item.classification}</span>
                  </span>
                  <ArrowUpRight size={14} className={`ml-auto shrink-0 ${selectedPeptide.id === item.id ? "text-cyan-300" : "text-slate-700"}`} />
                </button>
              ))}
            </div>

            <article className="relative overflow-hidden border border-cyan-300/15 bg-[#061021]/75 p-5 sm:p-7 lg:sticky lg:top-36">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_5%,rgba(34,211,238,.1),transparent_30%)]" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-cyan-300/70">PEPTIDE_FILE // {selectedPeptide.id}</p>
                    <h2 className="mt-2 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">{selectedPeptide.name}</h2>
                  </div>
                  <div className="max-w-[230px] border border-emerald-300/20 bg-emerald-300/[0.045] px-3 py-2.5">
                    <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-emerald-300/60">{directoryLabels.evidence}</p>
                    <p className="mt-1.5 font-mono text-[10px] font-bold uppercase leading-5 text-emerald-100">{selectedPeptide.evidence}</p>
                  </div>
                </div>

                <div className="mt-5 border border-cyan-300/20 bg-cyan-300/[0.045] p-5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-300">{directoryLabels.context}</p>
                  <p className="mt-3 font-mono text-xs leading-6 text-slate-200 sm:text-[13px]">{selectedPeptide.context}</p>
                </div>

                <div className="mt-3 border border-blue-400/15 bg-blue-400/[0.035] p-5">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-blue-300">{directoryLabels.advance}</p>
                  <p className="mt-3 font-mono text-[11px] leading-6 text-blue-100/70 sm:text-xs">{selectedPeptide.advance}</p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {[
                    [directoryLabels.classification, selectedPeptide.classification],
                    [directoryLabels.structure, selectedPeptide.structure],
                    [directoryLabels.checkpoints, selectedPeptide.checkpoints],
                  ].map(([label, value], index) => (
                    <div key={label} className={index === 2 ? "sm:col-span-2 sm:border-t sm:border-white/[0.07] sm:pt-5" : ""}>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-300/60">{label}</p>
                      <p className="mt-2 font-mono text-[11px] leading-6 text-slate-400">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3 border-l-2 border-amber-300/50 bg-amber-300/[0.035] p-4 sm:p-5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-amber-300/70">{directoryLabels.labNote}</p>
                    <p className="mt-2 font-mono text-[11px] leading-6 text-amber-100/60">{selectedPeptide.labNote}</p>
                  </div>
                </div>

                <a href={directorySourceUrls[selectedPeptide.id]} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 border border-cyan-300/25 px-4 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-200 transition-colors hover:border-cyan-200 hover:bg-cyan-300/[0.07]">
                  {directoryLabels.source} <ArrowUpRight size={13} />
                </a>
              </div>
            </article>
          </div>
        ) : (
          <div className="mt-4 flex min-h-44 items-center justify-center border border-dashed border-white/10 px-5 text-center font-mono text-xs text-slate-500">{t("peptideInfo.directoryEmpty")}</div>
        )}

        <p className="mt-4 border border-blue-400/15 bg-blue-400/[0.025] p-4 font-mono text-[10px] leading-6 text-blue-100/55">{t("peptideInfo.directoryCaution")}</p>
      </div>
    </section>
  );
}
