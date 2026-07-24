    import { useState } from 'react';
    import { AlertTriangle, CheckCircle2, Database, FileText, Search, ShieldCheck, TestTube, Truck } from 'lucide-react';
    import { useLanguage } from '../../i18n/LanguageContext.jsx';
    import SectionHeading from '../ui/SectionHeading.jsx';

    export default function TechSection() {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Database mock interactiva para el buscador de CoAs
    const mockCoAs = [
        { lot: 'BPC1502', compound: 'BPC-157', purity: '99.4%', date: '2026-04-12' },
        { lot: 'TB50089', compound: 'TB-500', purity: '99.2%', date: '2026-05-01' },
        { lot: 'CJC1295', compound: 'CJC-1295 No DAC', purity: '99.6%', date: '2026-03-22' }
    ];

    const findCoA = (value) => {
        setHasSearched(true);
        const result = mockCoAs.find(
        item => item.lot.toLowerCase() === value.trim().toLowerCase() || 
                item.compound.toLowerCase() === value.trim().toLowerCase()
        );
        setSearchResult(result || null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        findCoA(searchQuery);
    };

    const handleExample = (lot) => {
        setSearchQuery(lot);
        findCoA(lot);
    };

    return (
        <section id="coa" className="relative overflow-hidden border-t border-white/[0.06] px-4 py-16 font-['Orbitron'] text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        {/* HUD Gridlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.01)_1px,transparent_1px)] bg-[size:40px_100%] pointer-events-none" />
        
        <div className="relative z-10 mx-auto w-full max-w-[1180px] space-y-16 sm:space-y-20">
            
            {/* ================= SECTION TITLE ================= */}
            <SectionHeading
              index="03"
              eyebrow={t('coa.sectionLabel')}
              title={t('coa.title')}
              description={t('coa.subtitle')}
            />

            {/* ================= THE 3 LOGISTICAL PILLARS ================= */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Purity */}
            <div className="bg-[#040917] border border-slate-900 p-8 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="space-y-4">
                <div className="flex items-center">
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 text-cyan-400">
                    <ShieldCheck size={20} />
                    </div>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                    {t('coa.purity')}
                </h3>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                    {t('coa.purityText')}
                </p>
                </div>
            </div>

            {/* Pillar 2: Handling */}
            <div className="bg-[#040917] border border-slate-900 p-8 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="space-y-4">
                <div className="flex items-center">
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 text-cyan-400">
                    <TestTube size={20} />
                    </div>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                    {t('coa.handling')}
                </h3>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                    {t('coa.handlingText')}
                </p>
                </div>
            </div>

            {/* Pillar 3: Logistics */}
            <div className="bg-[#040917] border border-slate-900 p-8 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="space-y-4">
                <div className="flex items-center">
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 text-cyan-400">
                    <Truck size={20} />
                    </div>
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wide text-white group-hover:text-cyan-400 transition-colors">
                    {t('coa.logistics')}
                </h3>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                    {t('coa.logisticsText')}
                </p>
                </div>
            </div>

            </div>

            {/* ================= PRO CoA LOOKUP SYSTEM ================= */}
            <div className="relative overflow-hidden border border-cyan-300/15 bg-[#030914]">
              <span className="absolute left-0 top-0 z-10 h-4 w-4 border-l border-t border-cyan-300/80" />
              <span className="absolute right-0 top-0 z-10 h-4 w-4 border-r border-t border-cyan-300/80" />

              <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
                <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
                  <div className="flex h-11 w-11 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300">
                    <Database size={19} />
                  </div>
                  <p className="mt-6 font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200">{t('coa.databaseAccess')}</p>
                  <h3 className="mt-3 max-w-md text-xl font-bold uppercase leading-snug tracking-[0.02em] text-white sm:text-2xl">
                    {t('coa.lookup')}
                  </h3>
                  <p className="mt-4 max-w-md font-sans text-sm leading-[1.75] text-slate-400">
                    {t('coa.lookupText')}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5 font-sans text-xs text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      {t('coa.databaseStatus')}: <strong className="text-emerald-300">{t('coa.operational')}</strong>
                    </span>
                    <span className="border-l border-white/10 pl-3 text-cyan-200/75">HPLC · MS</span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 lg:p-10">
                  <form onSubmit={handleSearch}>
                    <label htmlFor="coa-query" className="mb-2.5 block font-sans text-xs font-semibold text-slate-300">
                      {t('coa.searchLabel')}
                    </label>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="group relative">
                        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-cyan-300" />
                        <input
                          id="coa-query"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('coa.placeholder')}
                          className="h-13 w-full border border-white/10 bg-[#020817] pl-11 pr-4 font-mono text-[11px] text-white outline-none transition-colors placeholder:text-slate-700 focus:border-cyan-300/45"
                        />
                      </div>
                      <button type="submit" className="flex h-13 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 text-[11px] font-black uppercase tracking-[0.08em] text-[#020617] transition-colors hover:bg-white">
                        {t('coa.query')} <Search size={13} />
                      </button>
                    </div>
                  </form>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-sans text-xs text-slate-400">{t('coa.examples')}:</span>
                    {mockCoAs.map((record) => (
                      <button key={record.lot} type="button" onClick={() => handleExample(record.lot)} className="rounded-lg border border-white/10 px-2.5 py-1.5 font-mono text-[11px] text-slate-400 transition-colors hover:border-cyan-300/30 hover:text-cyan-200">
                        {record.lot}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 min-h-[164px] border-t border-white/10 pt-6 font-mono">
                    {!hasSearched && (
                      <div className="flex min-h-[138px] flex-col items-center justify-center border border-dashed border-white/10 px-5 text-center">
                        <Search size={20} className="text-cyan-300/35" />
                        <p className="mt-3 max-w-sm font-sans text-xs leading-relaxed text-slate-400">{t('coa.lookupIdle')}</p>
                      </div>
                    )}

                    {hasSearched && searchResult && (
                      <div className="animate-[labFadeIn_.2s_ease-out] border border-emerald-300/20 bg-emerald-300/[0.035] p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-300">
                              <CheckCircle2 size={13} /> {t('coa.found')}
                            </p>
                            <p className="mt-2 truncate font-['Orbitron'] text-sm font-bold uppercase text-white sm:text-base">{searchResult.compound}</p>
                          </div>
                          <button type="button" onClick={() => alert(`${t('coa.download')}: ${searchResult.lot}`)} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-cyan-300/25 px-3 text-[11px] font-bold uppercase tracking-[0.07em] text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-[#020617]">
                            <FileText size={13} /> {t('coa.download')}
                          </button>
                        </div>

                        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-3">
                          <div><dt className="text-[11px] text-slate-400">{t('coa.lot')}</dt><dd className="mt-1 text-sm font-bold text-white">{searchResult.lot}</dd></div>
                          <div><dt className="text-[11px] text-slate-400">{t('coa.verifiedPurity')}</dt><dd className="mt-1 text-sm font-bold text-emerald-300">{searchResult.purity}</dd></div>
                          <div className="col-span-2 sm:col-span-1"><dt className="text-[11px] text-slate-400">{t('coa.analysisDate')}</dt><dd className="mt-1 text-sm font-bold text-white">{searchResult.date}</dd></div>
                        </dl>
                      </div>
                    )}

                    {hasSearched && !searchResult && (
                      <div className="flex min-h-[138px] items-start gap-3 border border-red-400/15 bg-red-400/[0.035] p-4 text-red-300">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                        <p className="font-sans text-xs leading-relaxed">{t('coa.notFound')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ================= CLEAN GLOBAL DISCLAIMER FOOTER ================= */}
            <div className="border-t border-slate-900 pt-8 text-center">
            <p className="font-sans text-xs leading-relaxed text-slate-500">
                {t('coa.disclaimer')}
            </p>
            </div>

        </div>
        </section>
    );
    }
