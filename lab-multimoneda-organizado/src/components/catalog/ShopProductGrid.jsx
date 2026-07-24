import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useCurrency } from "../../currency/CurrencyContext.jsx";
import ProductCard from "./ProductCard.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";

const customProductOrder = [
  { label: "R3ta", terms: ["r3ta", "reta", "retatrutide", "retarutide"] },
  { label: "Tirz", terms: ["tirz", "tirzepatide", "tirzep", "tirza", "tz"] },
  { label: "Mots C", terms: ["mots c", "mots-c", "motsc", "mots"] },
  { label: "NAD", terms: ["nad", "nad plus", "nad+"] },
  { label: "SS31", terms: ["ss31", "ss 31", "ss-31"] },
  { label: "Tesamorelin", terms: ["tesamorelin", "tesa", "tesam"] },
  { label: "CJC/IPA", terms: ["cjc ipa", "cjc/ipa", "cjc ipamorelin", "ipamorelin", "ipa", "cjc"] },
  { label: "Adamax", terms: ["adamax"] },
  { label: "Semax", terms: ["semax"] },
  { label: "Selank", terms: ["selank"] },
  { label: "GHK-Cu 50/100", terms: ["ghk cu", "ghk-cu", "ghkcu", "ghk 50", "ghk 100"] },
  { label: "Klow", terms: ["klow"] },
  { label: "Glow", terms: ["glow"] },
  { label: "Raw GHK", terms: ["raw ghk", "rawghk"] },
  {
    label: "Korean Glutathione 1200mg",
    terms: ["korean glutathione 1200", "korean glutathione", "glutathione 1200", "glutathione", "gluta"],
  },
  { label: "Lipo-C/B12", terms: ["lipo c b12", "lipo-c/b12", "lipocb12", "lipo c", "lipo b12"] },
  { label: "Fat Blaster", terms: ["fat blaster", "fatblaster"] },
  {
    label: "Hospira Bac Water",
    terms: [
      "hospira bac water",
      "hospira bacteriostatic water",
      "hospira bac",
      "bac water",
      "bacteriostatic water",
      "bac 30ml",
      "bac",
      "hospira",
    ],
  },
];

const normalizeProductText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const productMatchesCustomTerm = (searchable, term) => {
  const normalizedTerm = normalizeProductText(term);
  if (!normalizedTerm) return false;

  // Evita coincidencias accidentales con alias cortos como "tz", "ipa" o "bac".
  if (normalizedTerm.length <= 3) {
    return searchable.split(" ").includes(normalizedTerm);
  }

  return searchable.includes(normalizedTerm);
};

export default function ShopProductGrid({ products, error }) {
  const PRODUCTS_PER_PAGE = 8;
  const { t, language } = useLanguage();
  const { currency, getPriceData } = useCurrency();
  const productGridRef = useRef(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [focusFilter, setFocusFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const productTypes = [
    { label: t("catalog.all"), value: "all" },
    { label: t("catalog.vialsType"), value: "vials" },
    { label: t("catalog.capsules"), value: "capsules" },
    { label: t("catalog.liquids"), value: "liquids" },
  ];

  const researchFocus = [
    { label: t("catalog.all"), value: "all" },
    { label: t("catalog.recovery"), value: "recovery" },
    { label: t("catalog.longevity"), value: "longevity" },
    { label: t("catalog.cognitive"), value: "cognitive" },
    { label: t("catalog.metabolic"), value: "metabolic" },
    { label: t("catalog.tissueRepair"), value: "tissue-repair" },
    { label: t("catalog.immune"), value: "immune" },
  ];

  const productPrice = (product) => Number(getPriceData(product).price || 0);

  const getProductTerms = (product) => {
    const categories = product.categories?.map((cat) => cat.name || cat.slug) || [];
    const tags = product.tags?.map((tag) => tag.name || tag.slug) || [];
    const attributes = product.attributes?.flatMap((attr) => [attr.name, ...(attr.options || [])]) || [];
    return [...categories, ...tags, ...attributes].join(" ").toLowerCase();
  };

  const matchesTerm = (product, term) => {
    if (term === "all") return true;
    const searchable = `${product.name || ""} ${getProductTerms(product)}`.toLowerCase();
    const aliases = {
      vials: ["vial", "vials", "bpc", "peptide"],
      capsules: ["capsule", "capsules", "caps"],
      liquids: ["liquid", "liquids", "drop", "solution"],
      recovery: ["recovery", "repair", "bpc", "tb", "growth"],
      longevity: ["longevity", "anti-aging", "age", "cellular"],
      cognitive: ["cognitive", "neuro", "brain", "focus"],
      metabolic: ["metabolic", "metabolism", "energy", "mitochondrial"],
      "tissue-repair": ["tissue", "repair", "regeneration", "bpc", "tb"],
      immune: ["immune", "inflammatory", "inflammation"],
    };
    return aliases[term]?.some((word) => searchable.includes(word)) || false;
  };

  const getCustomOrderIndex = (product) => {
    const searchable = normalizeProductText(
      `${product.name || ""} ${product.slug || ""} ${product.sku || ""} ${getProductTerms(product)}`,
    );

    return customProductOrder.findIndex((group) =>
      group.terms.some((term) => productMatchesCustomTerm(searchable, term)),
    );
  };

  const filteredProducts = useMemo(() => {
    let result = (products || []).filter((product) => {
      const matchesSearch = (product.name || "").toLowerCase().includes(query.toLowerCase());
      return matchesSearch && matchesTerm(product, typeFilter) && matchesTerm(product, focusFilter);
    });

    if (sortFilter === "featured") {
      result = result
        .map((product, originalIndex) => ({
          product,
          originalIndex,
          orderIndex: getCustomOrderIndex(product),
        }))
        .sort((a, b) => {
          const orderA = a.orderIndex === -1 ? Number.MAX_SAFE_INTEGER : a.orderIndex;
          const orderB = b.orderIndex === -1 ? Number.MAX_SAFE_INTEGER : b.orderIndex;

          if (orderA !== orderB) return orderA - orderB;
          return a.originalIndex - b.originalIndex;
        })
        .map(({ product }) => product);
    }

    if (sortFilter === "price-low") result = [...result].sort((a, b) => productPrice(a) - productPrice(b));
    if (sortFilter === "price-high") result = [...result].sort((a, b) => productPrice(b) - productPrice(a));
    if (sortFilter === "az") result = [...result].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return result;
  }, [products, query, typeFilter, focusFilter, sortFilter, currency]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, typeFilter, focusFilter, sortFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const changePage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);

    window.requestAnimationFrame(() => {
      const top = productGridRef.current?.getBoundingClientRect().top ?? 0;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: window.scrollY + top - 140,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
  };

  if (!products || products.length === 0) {
    return (
      <section className="relative overflow-hidden bg-[#020617] px-4 pb-16 pt-[var(--lab-mobile-page-top)] text-white sm:px-6 sm:pb-20 sm:pt-[146px] lg:px-10 lg:pt-[160px]">
        <div className="relative z-10 mx-auto max-w-[1180px]">
          <SectionHeading
            index="02"
            eyebrow={t("catalog.title")}
            title={t("catalog.shop")}
            accent={t("catalog.peptides")}
            description={t("catalog.researchDisclaimer")}
            as="h1"
            className="mb-10 sm:mb-12"
          />
          <div className="border border-cyan-300/15 bg-[#040c1a] px-5 py-10 text-center sm:px-8">
            <p className="font-['Orbitron'] text-xs uppercase tracking-[0.24em] text-cyan-300/80">{error ? t("catalog.catalogOffline") : t("catalog.noProducts")}</p>
            {error && <p className="mx-auto mt-3 max-w-xl font-sans text-sm leading-relaxed text-slate-400">{t("catalog.catalogOfflineText")}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#020617] px-4 pb-16 pt-[var(--lab-mobile-page-top)] text-white sm:px-6 sm:pb-20 sm:pt-[146px] lg:px-10 lg:pt-[160px]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-32 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/[0.08] blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-blue-700/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px]">
        <SectionHeading
          index="02"
          eyebrow={t("catalog.title")}
          title={t("catalog.shop")}
          accent={t("catalog.peptides")}
          description={t("catalog.researchDisclaimer")}
          as="h1"
          className="mb-10 sm:mb-12"
        />

        <div className="relative mb-8">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
              <label className="group block">
                <span className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cyan-300/70 transition-colors group-focus-within:text-cyan-300" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("catalog.search")}
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#07101e] pl-11 pr-4 font-mono text-[11px] text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/50"
                  />
                </span>
              </label>

              <label className="group block">
                <span className="relative block">
                  <select
                    value={sortFilter}
                    onChange={(event) => setSortFilter(event.target.value)}
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-[#07101e] px-4 pr-10 font-sans text-sm text-slate-200 outline-none transition-colors focus:border-cyan-300/50"
                  >
                    <option value="featured" className="bg-[#020617]">{t("catalog.featured")}</option>
                    <option value="price-low" className="bg-[#020617]">{t("catalog.priceLow")}</option>
                    <option value="price-high" className="bg-[#020617]">{t("catalog.priceHigh")}</option>
                    <option value="az" className="bg-[#020617]">{t("catalog.az")}</option>
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-cyan-300/70 transition-colors group-focus-within:text-cyan-300" />
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowFilters((current) => !current)}
                aria-expanded={showFilters}
                className={`flex h-12 items-center justify-center gap-2 rounded-xl border px-5 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.07em] transition-colors ${showFilters || typeFilter !== "all" || focusFilter !== "all" ? "border-cyan-300 bg-cyan-300 text-[#020617]" : "border-white/10 bg-[#07101e] text-cyan-200 hover:border-cyan-300/40"}`}
              >
                <SlidersHorizontal size={14} /> {t("catalog.productFilters")}
                {(typeFilter !== "all" || focusFilter !== "all") && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#020617] px-1 text-[10px] text-white">{Number(typeFilter !== "all") + Number(focusFilter !== "all")}</span>}
              </button>
          </div>

          <div className="mt-3 flex items-center justify-between px-1 font-sans text-xs text-slate-400">
            <span><strong className="text-white">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? t("catalog.result") : t("catalog.results")}</span>
            {(query || typeFilter !== "all" || focusFilter !== "all" || sortFilter !== "featured") && (
              <button type="button" onClick={() => { setQuery(""); setTypeFilter("all"); setFocusFilter("all"); setSortFilter("featured"); }} className="flex items-center gap-1.5 text-cyan-300 hover:text-white"><RotateCcw size={11} /> {t("catalog.reset")}</button>
            )}
          </div>

          <fieldset className="mt-5 min-w-0 border-y border-white/[0.07] py-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-white">{t("catalog.researchFocus")}</p>
              <span className="hidden font-sans text-xs text-slate-500 sm:block">{language === "es" ? "Selecciona un área" : "Select an area"}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {researchFocus.map((item) => {
                const active = focusFilter === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFocusFilter(item.value)}
                    aria-pressed={active}
                    className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[11px] font-bold transition-colors ${active ? "border-cyan-300 bg-cyan-300 text-[#020617] shadow-[0_5px_18px_rgba(34,211,238,.12)]" : "border-white/10 bg-[#07101e] text-slate-300 hover:border-cyan-300/35 hover:text-cyan-200"}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#020617]" : "bg-slate-600"}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {showFilters && (
            <div className="mt-4 grid gap-5 rounded-[18px] border border-cyan-300/15 bg-[#07101e] p-4 shadow-[0_18px_45px_rgba(0,0,0,.22)] sm:p-5">
              <fieldset className="grid min-w-0 gap-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
                <legend className="font-sans text-xs font-semibold text-slate-400 sm:mb-0">{t("catalog.productType")}</legend>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
                  {productTypes.map((item) => {
                    const active = typeFilter === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setTypeFilter(item.value)}
                        aria-pressed={active}
                        className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[11px] font-bold transition-colors ${active ? "border-cyan-300 bg-cyan-300 text-[#020617]" : "border-white/10 bg-[#07101e] text-slate-300 hover:border-cyan-300/35 hover:text-cyan-200"}`}
                      >
                        <span className={`h-1.5 w-1.5 ${active ? "bg-[#020617]" : "bg-slate-600"}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <button type="button" onClick={() => setShowFilters(false)} className="flex h-11 items-center justify-center rounded-xl bg-cyan-300 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-[#020617] sm:ml-auto sm:w-48">{language === "es" ? "Ver resultados" : "View results"}</button>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mx-auto max-w-xl border border-cyan-400/15 bg-[#061021]/70 p-10 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">{t("catalog.noMatch")}</p>
            <p className="mt-3 font-mono text-sm text-slate-500">{t("catalog.tryAgain")}</p>
          </div>
        ) : (
          <div ref={productGridRef} className="mx-auto grid max-w-[1120px] grid-cols-2 justify-items-center gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}

        {filteredProducts.length > 0 && totalPages > 1 && (
          <nav className="mx-auto mt-10 flex max-w-[1120px] items-center justify-center gap-2 border-t border-white/10 pt-6 sm:mt-12" aria-label={t("catalog.pagination")}>
            <button
              type="button"
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center border border-cyan-300/20 bg-[#071426] text-cyan-300 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300 hover:text-[#020617] disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-700 disabled:hover:bg-[#071426]"
              aria-label={t("catalog.previousPage")}
            >
              <ChevronLeft size={16} />
            </button>

            <span className="flex h-10 min-w-[116px] items-center justify-center border border-white/10 bg-[#040c1a] px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500" aria-live="polite">
              {t("catalog.page")} <strong className="mx-1.5 text-white">{currentPage}</strong> {t("catalog.of")} {totalPages}
            </span>

            <button
              type="button"
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center border border-cyan-300/20 bg-[#071426] text-cyan-300 transition-colors hover:border-cyan-300/50 hover:bg-cyan-300 hover:text-[#020617] disabled:cursor-not-allowed disabled:border-white/5 disabled:text-slate-700 disabled:hover:bg-[#071426]"
              aria-label={t("catalog.nextPage")}
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
