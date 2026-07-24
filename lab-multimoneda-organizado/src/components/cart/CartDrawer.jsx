import { X, Plus, Minus, Trash2, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "./CartContext";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useCurrency } from "../../currency/CurrencyContext.jsx";

export default function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    checkout,
    cartPricing,
    cartPricingError,
    cartCurrency,
  } = useCart();
  const { t, language } = useLanguage();
  const { formatMoney } = useCurrency();

  const hasItems = cartItems.length > 0;

  const formatPrice = (price) => formatMoney(price);

  return (
    <>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t("cart.close")}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 z-[9998] animate-[labFadeIn_.2s_ease-out] bg-black/75 backdrop-blur-md"
          />

          {/* Drawer */}
          <aside
            className="fixed bottom-0 right-0 top-0 z-[9999] flex w-full max-w-[440px] animate-[labDrawerIn_.38s_cubic-bezier(.16,1,.3,1)] flex-col overflow-hidden border-l border-cyan-400/20 bg-[#030712]/98 font-['Orbitron'] text-white shadow-[-20px_0_80px_rgba(6,182,212,0.16)] backdrop-blur-2xl sm:max-w-[440px]"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-28 right-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[90px]" />
              <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-600/10 blur-[90px]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(6,182,212,0.02)_95%)] bg-[size:100%_32px]" />
            </div>

            {/* Corners */}
            <span className="absolute top-0 left-0 z-20 h-4 w-4 border-l border-t border-cyan-400/70" />
            <span className="absolute bottom-0 left-0 z-20 h-4 w-4 border-l border-b border-cyan-400/70" />

            {/* Header */}
            <div className="relative z-10 border-b border-cyan-400/10 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={17} className="text-cyan-400" />
                    <h2 className="max-w-[220px] truncate text-xs font-black uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.22em]">
                      {t("cart.title")}
                    </h2>
                  </div>

                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {!hasItems
                      ? t("cart.empty")
                      : `${cartItems.length} ${t("cart.title").toLowerCase()} · ${cartCurrency}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="flex h-9 w-9 items-center justify-center border border-cyan-500/20 bg-cyan-400/5 text-slate-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300"
                  aria-label={t("cart.close")}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Items / Empty State */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin] [scrollbar-color:rgba(6,182,212,0.25)_transparent] sm:px-5 sm:py-5">
              {!hasItems ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5">
                    <ShoppingBag size={26} className="text-cyan-300/70" />
                  </div>

                  <p className="text-xs font-black uppercase tracking-[0.22em] text-white">
                    {t("cart.empty")}
                  </p>

                  <p className="mt-3 max-w-[270px] font-mono text-[11px] leading-5 text-slate-500">
                    {t("cart.emptyDescription")}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-7 border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 transition-all hover:bg-cyan-400 hover:text-black"
                  >
                    {t("cart.continue")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const itemImage = item.images?.[0]?.src;
                    const lineTotal = Number(item.price || 0) * item.quantity;
                    const cartKey = String(item.cartKey || `${item.id}:${item.variationId || "base"}`);

                    return (
                      <div
                        key={cartKey}
                        className="group relative animate-[labFadeUp_.25s_ease-out] overflow-hidden border border-cyan-400/10 bg-[#071126]/70 p-3 transition-all hover:border-cyan-400/30 hover:bg-[#09162e]/90"
                      >
                        <div className="absolute left-0 top-0 h-full w-[2px] bg-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />

                        <div className="flex gap-3">
                          {/* Image */}
                          <div className="relative h-[86px] w-[64px] shrink-0 overflow-hidden border border-white/10 bg-black/35">
                            {itemImage ? (
                              <img
                                src={itemImage}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <div className="h-10 w-3 rounded-b-sm border border-cyan-400/40 bg-cyan-400/15" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate text-[12px] font-black uppercase tracking-[0.08em] text-white">
                                  {item.name}
                                </h3>

                                {item.variantLabel && (
                                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400">
                                    {item.variantLabel}
                                  </p>
                                )}

                                <p className="mt-1 font-mono text-[10px] text-cyan-300">
                                  {formatPrice(item.price)} {t("cart.each")}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(cartKey)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center border border-white/5 bg-white/[0.03] text-slate-600 transition-all hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
                                aria-label={t("cart.remove")}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-3">
                              {/* Quantity */}
                              <div className="flex items-center border border-cyan-400/15 bg-black/30">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(cartKey, -1)}
                                  className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-cyan-300"
                                  aria-label={t("cart.decrease")}
                                >
                                  <Minus size={11} />
                                </button>

                                <span className="min-w-8 px-2 text-center font-mono text-xs font-bold text-white">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => updateQuantity(cartKey, 1)}
                                  className="flex h-8 w-8 items-center justify-center text-slate-500 transition-colors hover:text-cyan-300"
                                  aria-label={t("cart.increase")}
                                >
                                  <Plus size={11} />
                                </button>
                              </div>

                              <p className="font-mono text-[11px] font-bold text-white">
                                {formatPrice(lineTotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer - solo cuando hay productos */}
            {hasItems && (
              <div className="relative z-10 border-t border-cyan-400/10 bg-[#030712]/90 px-4 py-4 sm:px-5 sm:py-5">
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <span>{t("cart.checkoutMethod")}</span>
                    <span className="text-cyan-300">{t("cart.wooSecure")}</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
                      {t("cart.subtotal")}
                    </span>

                    <span className="text-xl font-black tracking-[-0.05em] text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)] sm:text-2xl">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>

                  {(cartPricing || cartPricingError) && (
                    <div className={`flex gap-2 border p-3 ${cartPricingError ? "border-amber-300/20 bg-amber-300/[0.045]" : "border-cyan-400/10 bg-cyan-400/[0.04]"}`}>
                      <ShieldCheck size={14} className={`mt-0.5 shrink-0 ${cartPricingError ? "text-amber-300" : "text-cyan-300"}`} />
                      <p className={`font-mono text-[9px] leading-4 ${cartPricingError ? "text-amber-100/70" : "text-slate-400"}`}>
                        {cartPricing
                          ? (language === "es" ? `Actualizando el carrito en ${cartCurrency}…` : `Updating cart prices in ${cartCurrency}…`)
                          : (language === "es" ? "No pudimos validar uno o más precios. Revisa que todos estén configurados en WooCommerce antes de pagar." : "One or more prices could not be validated. Make sure they are configured in WooCommerce before checkout.")}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 border border-cyan-400/10 bg-cyan-400/[0.04] p-3">
                    <ShieldCheck
                      size={14}
                      className="mt-0.5 shrink-0 text-cyan-300"
                    />
                    <p className="font-mono text-[10px] leading-4 text-slate-400">
                      {t("cart.disclaimer")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkout}
                  disabled={cartPricing || Boolean(cartPricingError)}
                  className="w-full bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_0_28px_rgba(6,182,212,0.22)] transition-all hover:bg-white hover:shadow-[0_0_36px_rgba(6,182,212,0.35)]"
                >
                  {t("cart.checkout")}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="mt-3 w-full py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-cyan-300"
                >
                  {t("cart.continue")}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
