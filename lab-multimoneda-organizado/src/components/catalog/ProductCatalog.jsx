import { FlaskConical, ScanLine, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import ProductCard from "./ProductCard.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";

export default function ProductCatalog({ products, error }) {
  const { t, language } = useLanguage();

  if (!products || products.length === 0) {
    return (
      <section className="relative border-t border-white/[0.06] bg-[#020617] px-4 py-16 font-[inherit] sm:px-6 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeading
            index="01"
            eyebrow={t("catalog.featuredInventory")}
            title={t("catalog.shop")}
            accent={t("catalog.peptides")}
            description={t("catalog.researchDisclaimer")}
            className="mb-10 sm:mb-12"
          />
          <div className="border border-cyan-300/15 bg-[#040c1a] px-5 py-10 text-center sm:px-8">
            <p className="font-['Orbitron'] text-xs uppercase tracking-[0.24em] text-cyan-300/80">
              {error ? t("catalog.catalogOffline") : t("catalog.noProducts")}
            </p>
            {error && (
              <p className="mx-auto mt-3 max-w-xl font-mono text-[11px] leading-relaxed text-slate-400">
                {t("catalog.catalogOfflineText")}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  const featuredProducts = products.slice(0, 8);
  const standards = [
    [FlaskConical, language === "es" ? "Pureza analítica" : "Analytical purity"],
    [ScanLine, language === "es" ? "Documentación por lote" : "Batch documentation"],
    [ShieldCheck, language === "es" ? "Trazabilidad verificable" : "Verifiable traceability"],
  ];

  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] px-4 py-16 font-[inherit] text-white sm:px-6 sm:py-20 lg:px-10 lg:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[340px] w-[340px] -translate-x-1/2 rounded-full bg-blue-900/[0.14] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(6,182,212,0.018)_95%)] bg-[size:100%_32px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <SectionHeading
          index="01"
          eyebrow={t("catalog.featuredInventory")}
          title={t("catalog.shop")}
          accent={t("catalog.peptides")}
          description={t("catalog.researchDisclaimer")}
          className="mb-10 sm:mb-12"
        />

        <div className="mb-8 grid overflow-hidden border border-cyan-300/15 bg-[#050d1b]/80 sm:grid-cols-3">
          {standards.map(([Icon, label], index) => (
            <div
              key={label}
              className={`flex items-center gap-3 px-4 py-4 sm:px-5 ${index ? "border-t border-white/[0.07] sm:border-l sm:border-t-0" : ""}`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300">
                <Icon size={16} />
              </span>
              <p className="min-w-0 text-[11px] font-bold uppercase leading-snug tracking-[0.06em] text-slate-100">
                {label}
              </p>
            </div>
          ))}
        </div>

        <a
          href="/cuenta"
          className="mb-7 flex flex-col gap-2 border-l-2 border-l-cyan-300 border-y border-r border-white/[0.08] bg-gradient-to-r from-cyan-300/[0.07] to-transparent px-4 py-3.5 transition-colors hover:border-y-cyan-300/20 hover:border-r-cyan-300/20 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <span className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.08em] text-blue-100">
            LAB POINTS · 1 COP = 1 PUNTO
          </span>
          <span className="font-mono text-[10px] leading-5 text-slate-300">
            {language === "es"
              ? "Cada peso colombiano elegible suma 1 punto. Canjea 1.000 puntos por COP 50.000."
              : "Every eligible Colombian peso earns 1 point. Redeem 1,000 points for COP 50,000."}
          </span>
        </a>

        <div className="mx-auto grid max-w-[1120px] grid-cols-2 items-stretch gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <div key={product.id} className="min-w-0 w-full">
              <ProductCard product={product} featured />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center md:mt-12">
          <a
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center border border-blue-700/80 bg-[#071a35] px-7 py-3.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-100 transition-colors hover:border-blue-500 hover:bg-[#12366b] hover:text-white"
          >
            {t("catalog.shopAll")}
          </a>
        </div>
      </div>
    </section>
  );
}
