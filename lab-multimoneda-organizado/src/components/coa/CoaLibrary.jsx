import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Database, Download, ExternalLink, FileCheck2, FileSearch, History, LoaderCircle, Search, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export const coaText = {
  es: { eyebrow: "ARCHIVO ANALÍTICO // EN VIVO", title: "Evidencia por", accent: "cada lote.", intro: "Encuentra un producto o escribe el lote de tu vial. Te mostramos el certificado vigente, sus resultados principales y el documento original.", search: "Busca producto, compuesto, lote, SKU o número COA", all: "Todos", current: "Lotes vigentes", history: "Con historial", results: "certificados", verified: "Documento disponible", currentLot: "Lote vigente", purity: "Pureza reportada", method: "Método", laboratory: "Laboratorio", date: "Fecha de análisis", batch: "Lote", open: "Ver certificado", verify: "Verificar fuente", noResults: "No encontramos un certificado con esos datos.", noResultsText: "Revisa el lote exactamente como aparece en la etiqueta o intenta buscar el nombre del producto.", offline: "La biblioteca no está disponible en este momento.", retry: "Reintentar", clear: "Limpiar búsqueda", guideTitle: "Encuéntralo en segundos", guide: ["Escribe el lote o producto", "Abre el registro correcto", "Compara el lote y descarga el COA"], details: "Datos del certificado", previous: "Versiones anteriores", close: "Cerrar detalle", disclaimer: "Un COA describe una muestra y un lote bajo métodos determinados. No demuestra por sí mismo esterilidad, seguridad, eficacia ni aptitud para uso humano o animal." },
  en: { eyebrow: "ANALYTICAL ARCHIVE // LIVE", title: "Evidence for", accent: "every batch.", intro: "Find a product or enter the lot printed on your vial. We show the current certificate, its key results, and the original document.", search: "Search product, compound, lot, SKU, or COA number", all: "All", current: "Current lots", history: "With history", results: "certificates", verified: "Document available", currentLot: "Current lot", purity: "Reported purity", method: "Method", laboratory: "Laboratory", date: "Analysis date", batch: "Batch", open: "View certificate", verify: "Verify source", noResults: "No certificate matched those details.", noResultsText: "Check the lot exactly as printed on the label or search by product name.", offline: "The library is temporarily unavailable.", retry: "Try again", clear: "Clear search", guideTitle: "Find it in seconds", guide: ["Enter a lot or product", "Open the matching record", "Compare the lot and download the COA"], details: "Certificate data", previous: "Previous versions", close: "Close details", disclaimer: "A COA describes a sample and batch under stated methods. It does not by itself prove sterility, safety, efficacy, or suitability for human or animal use." },
};

const norm = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isCurrent = (record) => Boolean(record.currentShippingLot || record.activeShippingLot || record.currentCoa?.currentShippingLot);
// Solo devuelve archivos PDF/directos. Nunca usa verifyUrl ni una página externa en el iframe.
const pdfUrl = (record) =>
  record.currentCoa?.fileUrl ||
  record.fileUrl ||
  record.currentCoa?.pdfUrl ||
  record.pdfUrl ||
  record.currentCoa?.coaPdfUrl ||
  record.coaPdfUrl ||
  "";

const verificationUrl = (record) =>
  record.currentCoa?.verifyUrl || record.verifyUrl || "";
const productName = (record) => record.productName || record.compound || record.familyName || "COA";
const searchBlob = (record) => norm([productName(record), record.compound, record.familyName, record.strength, record.batch, record.lot, record.coaNumber, ...(record.skus || []), ...(record.aliases || []), ...(record.keywords || [])].join(" "));

function Value({ label, value, tone = "text-white" }) {
  return <div className="min-w-0 border-l border-white/10 pl-3"><dt className="font-mono text-[7px] uppercase tracking-[0.14em] text-slate-600">{label}</dt><dd className={`mt-1.5 truncate font-mono text-[10px] font-bold ${tone}`}>{value || "—"}</dd></div>;
}

export function CoaViewer({ record, copy, language, onClose }) {
  const [view, setView] = useState("document");
  // El iframe recibe exclusivamente el archivo PDF directo.
  const file = pdfUrl(record);
  const external = file;
  const iframeSrc = file
    ? `${String(file).split("#")[0]}#toolbar=1&navpanes=0&view=FitH`
    : "";
  const verification = verificationUrl(record);
  const spanish = language === "es";

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617]/90 backdrop-blur-md" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label={copy.close} />
      <section className="absolute inset-x-0 bottom-0 top-8 mx-auto flex max-w-[1180px] flex-col overflow-hidden border border-cyan-300/15 bg-[#040d1e] shadow-[0_0_120px_rgba(0,0,0,.7)] sm:inset-x-5 sm:top-12 lg:inset-x-8">
        <header className="flex shrink-0 flex-col gap-3 border-b border-white/10 bg-[#061021] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[7px] uppercase tracking-[.16em] text-cyan-300">COA // {record.coaNumber || record.id}</p>
            <h2 className="mt-1 truncate font-['Orbitron'] text-[11px] font-black uppercase text-white sm:text-sm">{productName(record)} <span className="text-cyan-300">{record.strength}</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-2 border border-white/10 sm:flex-none">
              <button onClick={() => setView("document")} className={`min-h-10 px-4 font-mono text-[8px] font-bold uppercase tracking-[.1em] transition ${view === "document" ? "bg-cyan-300 text-[#020617]" : "text-slate-400 hover:text-white"}`}><FileCheck2 className="mr-2 inline" size={13} />{spanish ? "Documento" : "Document"}</button>
              <button onClick={() => setView("details")} className={`min-h-10 px-4 font-mono text-[8px] font-bold uppercase tracking-[.1em] transition ${view === "details" ? "bg-cyan-300 text-[#020617]" : "text-slate-400 hover:text-white"}`}><Database className="mr-2 inline" size={13} />{spanish ? "Más información" : "More details"}</button>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-slate-400 hover:border-red-300/25 hover:text-white" aria-label={copy.close}><X size={17} /></button>
          </div>
        </header>

        {view === "document" ? (
          <div className="flex min-h-0 flex-1 flex-col bg-[#020617]">
            {file ? (
              <iframe
                src={iframeSrc}
                title={`COA ${record.coaNumber || record.id}`}
                className="min-h-0 w-full flex-1 bg-white"
                loading="eager"
                allow="fullscreen"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><FileSearch size={34} className="text-slate-600" /><h3 className="mt-5 font-['Orbitron'] text-sm font-black uppercase text-white">{spanish ? "Vista integrada no disponible" : "Embedded preview unavailable"}</h3><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{spanish ? "Este registro todavía no tiene un archivo PDF directo asignado. Agrega el PDF en fileUrl para mostrarlo aquí." : "This record does not have a direct PDF file assigned yet. Add the PDF to fileUrl to display it here."}</p></div>
            )}
            <div className="flex shrink-0 flex-col gap-3 border-t border-white/10 bg-[#061021] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="font-mono text-[8px] leading-4 text-slate-500">{spanish ? "Si el PDF no carga en tu navegador, ábrelo en una pestaña nueva." : "If the PDF does not load in your browser, open it in a new tab."}</p>
              {external && <a href={external} target="_blank" rel="noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 bg-cyan-300 px-4 font-['Orbitron'] text-[8px] font-black uppercase tracking-[.1em] text-[#020617] hover:bg-white"><ExternalLink size={14} />{spanish ? "Abrir PDF completo" : "Open full PDF"}</a>}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-[850px]">
              <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[.18em] text-emerald-300"><CheckCircle2 className="mr-2 inline" size={13} />{copy.verified}</p><h3 className="mt-3 font-['Orbitron'] text-2xl font-black uppercase tracking-[-.04em] text-white">{productName(record)}</h3><p className="mt-2 font-mono text-[9px] text-slate-500">{record.familyName || record.compound}</p></div>{isCurrent(record) && <span className="w-max border border-emerald-300/20 bg-emerald-300/[.05] px-3 py-2 font-mono text-[8px] uppercase text-emerald-300">{copy.currentLot}</span>}</div>
              <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3"><Value label={copy.batch} value={record.batch || record.lot} /><Value label={copy.purity} value={record.currentCoa?.purity || record.purity} tone="text-emerald-300" /><Value label={copy.date} value={record.currentCoa?.date || record.date} /><Value label={copy.laboratory} value={record.laboratory} /><Value label={copy.method} value={record.currentCoa?.method || record.method || record.tested} /><Value label="COA ID" value={record.coaNumber || record.id} /></dl>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">{external && <a href={external} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 bg-cyan-300 px-4 font-['Orbitron'] text-[8px] font-black uppercase tracking-[.1em] text-[#020617] hover:bg-white"><Download size={15} />{copy.open}</a>}{verification && <a href={verification} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 border border-white/15 px-4 font-['Orbitron'] text-[8px] font-black uppercase tracking-[.1em] text-white hover:border-cyan-300/40"><ExternalLink size={15} />{copy.verify}</a>}</div>
              {record.history?.length > 0 && <div className="mt-10"><h4 className="flex items-center gap-2 font-['Orbitron'] text-[10px] font-black uppercase text-white"><History size={15} className="text-cyan-300" />{copy.previous}</h4><div className="mt-4 grid gap-2">{record.history.map((item, index) => <a key={`${item.version}-${index}`} href={item.fileUrl || item.verifyUrl || "#"} target={item.fileUrl || item.verifyUrl ? "_blank" : undefined} rel="noreferrer" className="flex items-center justify-between gap-4 border border-white/[.08] p-4 hover:border-cyan-300/25"><div><p className="font-mono text-[9px] font-bold text-white">{item.label || item.version || `Version ${index + 1}`}</p><p className="mt-1 font-mono text-[7px] text-slate-600">{item.date || "—"} · {item.method || item.tested || "COA"}</p></div><span className="font-mono text-[9px] text-emerald-300">{item.purity || ""}</span></a>)}</div></div>}
              <p className="mt-10 border-t border-white/10 pt-5 font-mono text-[8px] uppercase leading-5 tracking-[.08em] text-slate-600">{copy.disclaimer}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CoaLibrary() {
  const { language } = useLanguage();
  const c = coaText[language] || coaText.es;
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    fetch("/api/coa", { headers: { Accept: "application/json" } })
      .then(async (response) => { const data = await response.json(); if (!response.ok || !Array.isArray(data)) throw new Error(data?.code || "COA_API_ERROR"); return data; })
      .then((data) => { if (active) { setRecords(data); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const filtered = useMemo(() => {
    const needle = norm(query.trim());
    return records.filter((record) => (!needle || searchBlob(record).includes(needle)) && (filter === "all" || (filter === "current" ? isCurrent(record) : (record.history || []).length > 0)));
  }, [records, query, filter]);

  const currentCount = records.filter(isCurrent).length;

  return (
    <main className="min-h-screen pb-24 pt-[var(--lab-mobile-page-top)] text-white sm:pt-[11rem]">
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(37,99,235,.2),transparent_28%),radial-gradient(circle_at_25%_25%,rgba(6,182,212,.09),transparent_25%)]" />
        <div className="relative mx-auto max-w-[1180px]">
          <a href="/" className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.16em] text-slate-500 transition-colors hover:text-cyan-300"><ArrowLeft size={13} /> LAB_CORE</a>
          <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div><p className="font-mono text-[9px] font-bold uppercase tracking-[.24em] text-cyan-300/75">{c.eyebrow}</p><h1 className="mt-4 max-w-3xl font-['Orbitron'] text-3xl font-black uppercase leading-[1.02] tracking-[-.05em] sm:text-5xl">{c.title} <span className="text-transparent [-webkit-text-stroke:1px_#67e8f9]">{c.accent}</span></h1><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">{c.intro}</p></div>
            <div className="border border-white/10 bg-[#061021]/75 p-5 backdrop-blur"><p className="font-['Orbitron'] text-[10px] font-black uppercase text-white">{c.guideTitle}</p><ol className="mt-4 grid gap-3">{c.guide.map((item, index) => <li key={item} className="flex items-center gap-3 font-mono text-[9px] text-slate-400"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/[.05] text-cyan-300">0{index + 1}</span>{item}</li>)}</ol></div>
          </div>

          <div className="mt-10 border border-cyan-300/15 bg-[#030914]/90 p-3 shadow-[0_30px_100px_rgba(0,0,0,.35)] sm:p-4">
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300" size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.search} className="h-14 w-full border border-white/10 bg-[#020617] pl-12 pr-12 font-mono text-[11px] text-white outline-none transition focus:border-cyan-300/45 sm:h-16 sm:text-xs" />{query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 hover:text-white" aria-label={c.clear}><X size={16} /></button>}</div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">{[["all", c.all], ["current", c.current], ["history", c.history]].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`shrink-0 border px-3.5 py-2 font-mono text-[8px] uppercase tracking-[.1em] transition ${filter === key ? "border-cyan-300/35 bg-cyan-300/[.09] text-cyan-200" : "border-white/10 text-slate-500 hover:text-white"}`}>{label}</button>)}</div><p className="font-mono text-[8px] uppercase tracking-[.13em] text-slate-600"><strong className="text-white">{filtered.length}</strong> {c.results} · <span className="text-emerald-300">{currentCount} {c.current.toLowerCase()}</span></p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-[1180px] px-4 sm:px-6 lg:px-8">
        {status === "loading" && <div className="flex min-h-[360px] items-center justify-center gap-3 border border-white/10 font-mono text-[9px] uppercase tracking-[.18em] text-cyan-300"><LoaderCircle className="animate-spin" size={18} /> SYNCING ANALYTICAL ARCHIVE</div>}
        {status === "error" && <div className="flex min-h-[360px] flex-col items-center justify-center border border-red-300/15 bg-red-300/[.025] px-6 text-center"><Database size={28} className="text-red-300" /><h2 className="mt-5 font-['Orbitron'] text-lg font-black uppercase">{c.offline}</h2><button onClick={() => setReload((value) => value + 1)} className="mt-6 border border-white/15 px-5 py-3 font-mono text-[9px] uppercase text-white hover:border-cyan-300/40">{c.retry}</button></div>}
        {status === "ready" && filtered.length === 0 && <div className="flex min-h-[360px] flex-col items-center justify-center border border-dashed border-white/10 px-6 text-center"><FileSearch size={28} className="text-slate-600" /><h2 className="mt-5 font-['Orbitron'] text-base font-black uppercase">{c.noResults}</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">{c.noResultsText}</p>{query && <button onClick={() => setQuery("")} className="mt-6 text-[9px] uppercase tracking-[.14em] text-cyan-300">{c.clear}</button>}</div>}
        {status === "ready" && filtered.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((record) => {
          const current = isCurrent(record); const url = pdfUrl(record); const purity = record.currentCoa?.purity || record.purity; const date = record.currentCoa?.date || record.date;
          return <article key={record.id} className="group relative flex min-h-[330px] flex-col overflow-hidden border border-white/10 bg-[#061021]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_24px_70px_rgba(6,182,212,.08)] sm:p-6"><div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/[.09] blur-2xl" /><div className="relative flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center border border-cyan-300/15 bg-cyan-300/[.045] text-cyan-300"><FileCheck2 size={18} /></span><div className="flex flex-wrap justify-end gap-2">{current && <span className="border border-emerald-300/20 bg-emerald-300/[.05] px-2 py-1 font-mono text-[7px] uppercase tracking-[.1em] text-emerald-300">{c.currentLot}</span>}{url && <span className="border border-blue-300/20 bg-blue-300/[.05] px-2 py-1 font-mono text-[7px] uppercase tracking-[.1em] text-blue-200">{c.verified}</span>}</div></div><p className="mt-6 font-mono text-[8px] uppercase tracking-[.16em] text-cyan-300/60">{record.familyName || record.compound || "ANALYTICAL RECORD"}</p><h2 className="mt-2 line-clamp-2 font-['Orbitron'] text-base font-black uppercase leading-snug tracking-[-.025em] text-white">{productName(record)} {record.strength && <span className="text-cyan-300">// {record.strength}</span>}</h2><dl className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 border-t border-white/[.08] pt-5"><Value label={c.batch} value={record.batch || record.lot} /><Value label={c.purity} value={purity} tone="text-emerald-300" /><Value label={c.date} value={date} /><Value label="COA ID" value={record.coaNumber || record.id} /></dl><button onClick={() => setSelected(record)} className="mt-auto flex min-h-11 items-center justify-between border border-cyan-300/15 bg-cyan-300/[.04] px-4 pt-0 font-['Orbitron'] text-[8px] font-black uppercase tracking-[.12em] text-cyan-200 transition hover:bg-cyan-300 hover:text-[#020617]"><span>{c.open}</span><ChevronRight size={15} /></button></article>;
        })}</div>}
      </section>

      <div className="mx-auto mt-12 max-w-[1180px] px-4 sm:px-6 lg:px-8"><p className="border-t border-white/10 pt-6 text-center font-mono text-[8px] uppercase leading-5 tracking-[.1em] text-slate-600">{c.disclaimer}</p></div>

      {selected && <CoaViewer record={selected} copy={c} language={language} onClose={() => setSelected(null)} />}
    </main>
  );
}
