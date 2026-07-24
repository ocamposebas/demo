import { ArrowUpRight, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "../cart/CartContext";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useCurrency } from "../../currency/CurrencyContext.jsx";

export default function ProductCard({ product, featured = false }) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { currency, formatMoney, getPriceData } = useCurrency();
  const primaryImage = product.images?.[0];
  const image = primaryImage?.thumbnail || primaryImage?.src;
  const productUrl = `/products/${product.slug}`;
  const isInStock = product.stock_status === "instock";
  const requiresOptions =
    product.type === "variable" || product.variations?.length > 0;
  const priceData = getPriceData(product);
  const hasPrice = Number.isFinite(priceData.price) && priceData.price > 0;
  const formatPrice = hasPrice
    ? priceData.isRange && Number.isFinite(priceData.max)
      ? `${formatMoney(priceData.price)} – ${formatMoney(priceData.max)}`
      : formatMoney(priceData.price)
    : t("catalog.requestPrice");

  const addProduct = () => {
    if (!hasPrice) return;
    addToCart({
    ...product,
    price: priceData.price,
    regularPrice: priceData.regular,
    currency,
    priceMap: product?.labcore_multicurrency?.all_prices || {},
    });
  };

  return (
    <article
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#061021] shadow-[0_16px_50px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow] duration-500 hover:border-cyan-300/30 hover:-translate-y-1 hover:shadow-[0_22px_65px_rgba(6,182,212,0.12)] ${
        featured ? "min-h-[390px] sm:min-h-[520px]" : "min-h-[390px] max-w-[340px] sm:min-h-[510px] sm:max-w-[268px]"
      }`}
    >
      <span className={`absolute left-0 top-0 z-30 h-4 w-4 border-l border-t ${featured ? "border-blue-800/90" : "border-cyan-300/80"}`} />
      <span className={`absolute right-0 top-0 z-30 h-4 w-4 border-r border-t ${featured ? "border-blue-800/90" : "border-cyan-300/80"}`} />

      <a href={productUrl} className="relative block shrink-0">
        <div className="relative aspect-square overflow-hidden bg-[#030712]">
          <div className={`absolute inset-0 ${featured ? "bg-[radial-gradient(circle_at_50%_42%,rgba(30,64,175,0.2),transparent_48%),linear-gradient(145deg,#081733,#020617)]" : "bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.18),transparent_48%),linear-gradient(145deg,#071426,#020617)]"}`} />
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:28px_28px]" />

          {image ? (
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={image}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-cover object-center transition-transform duration-700 ${featured ? "" : "group-hover:scale-[1.025]"}`}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-44 w-28 rounded-b-[2rem] rounded-t-2xl border border-cyan-200/25 bg-gradient-to-r from-white/20 via-white/[0.04] to-cyan-300/15 shadow-[0_0_50px_rgba(6,182,212,0.22)]">
                <div className="absolute -top-9 left-1/2 h-11 w-20 -translate-x-1/2 rounded-t-xl rounded-b-md border border-slate-300/30 bg-gradient-to-r from-slate-600 via-white to-slate-500" />
                <div className="absolute left-1/2 top-16 w-36 -translate-x-1/2 border border-cyan-300/30 bg-[#071b32]/90 px-2 py-3 text-center backdrop-blur-md">
                  <p className="lab-line-clamp-2 font-['Orbitron'] text-[10px] font-bold uppercase tracking-tight text-white">{product.name}</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-cyan-200">{t("catalog.researchUse")}</p>
                </div>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#061021]/80 via-[#061021]/20 to-transparent" />

          <div className="absolute right-2 top-2 z-10 flex items-start justify-end sm:right-4 sm:top-4">
            <span className={`flex items-center gap-1 border px-1.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.02em] shadow-[0_6px_20px_rgba(0,0,0,.28)] sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[10px] sm:tracking-[0.06em] ${isInStock ? "border-emerald-300/50 bg-[#063b2d] text-emerald-50" : "border-red-300/50 bg-[#521b24] text-red-50"}`}>
              <span className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${isInStock ? "bg-emerald-300 text-emerald-300" : "bg-red-300 text-red-300"}`} />
              {isInStock ? t("catalog.inStock") : t("catalog.outOfStock")}
            </span>
          </div>

        </div>
      </a>

      <div className="relative z-10 flex min-h-[220px] flex-1 flex-col p-2.5 sm:min-h-[224px] sm:p-5">
        <div className="min-h-[48px] sm:min-h-[64px]">
          <p className="mb-2 hidden truncate font-mono text-[9px] uppercase tracking-[0.08em] text-slate-400 sm:block">{t("catalog.researchUse")}</p>
          <h3 className="lab-line-clamp-2 font-['Orbitron'] text-[11px] font-black uppercase leading-snug tracking-[-0.02em] text-white sm:text-base">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 border-t border-white/10 pt-2.5 sm:mt-4 sm:pt-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-400">{t("catalog.startingAt")}</p>
            <p className="mt-1 break-words text-sm font-bold leading-snug tracking-[-0.04em] text-white sm:text-xl">{formatPrice}</p>
            <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-cyan-200/80">{currency}</p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-1 gap-2 pt-3 sm:grid-cols-[1fr_auto] sm:pt-4">
          {isInStock && hasPrice ? (
            requiresOptions ? (
              <a
                href={productUrl}
                aria-label={`${t("product.chooseDose")}: ${product.name}`}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-[10px] font-black uppercase leading-tight tracking-[0.06em] transition-colors sm:px-3 ${featured ? "bg-[#12366b] text-blue-50 hover:bg-[#194a8a]" : "bg-cyan-400 text-black hover:bg-white"}`}
              >
                <SlidersHorizontal size={14} />
                <span className="sm:hidden">{language === "es" ? "Elegir" : "Choose"}</span>
                <span className="hidden sm:inline">{t("product.chooseDose")}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={addProduct}
                aria-label={`${t("catalog.addToCart")}: ${product.name}`}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-[10px] font-black uppercase leading-tight tracking-[0.06em] transition-colors sm:px-3 ${featured ? "bg-[#12366b] text-blue-50 hover:bg-[#194a8a]" : "bg-cyan-400 text-black hover:bg-white"}`}
              >
                <ShoppingCart size={14} />
                <span className="sm:hidden">{language === "es" ? "Añadir" : "Add"}</span>
                <span className="hidden sm:inline">{t("catalog.addToCart")}</span>
              </button>
            )
          ) : (
            <button type="button" disabled className="flex min-h-12 items-center justify-center rounded-xl bg-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] text-slate-400">
              {t("catalog.unavailable")}
            </button>
          )}
          <a
            href={productUrl}
            aria-label={`${t("catalog.readMore")}: ${product.name}`}
            title={t("catalog.readMore")}
            className={`hidden min-h-12 w-12 items-center justify-center rounded-xl border transition-colors sm:flex ${featured ? "border-blue-700/80 bg-[#071a35] text-blue-100 hover:border-blue-500 hover:bg-[#12366b] hover:text-white" : "border-cyan-300/35 bg-cyan-400/[0.04] text-cyan-200 hover:border-cyan-300 hover:bg-cyan-400 hover:text-black"}`}
          >
            <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
    </article>
  );
}
