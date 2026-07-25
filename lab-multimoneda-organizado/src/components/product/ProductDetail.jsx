import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  Eye,
  FileCheck2,
  FlaskConical,
  LoaderCircle,
  PackageCheck,
  Plus,
  Search,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useCurrency } from "../../currency/CurrencyContext.jsx";
import { metaCartData, trackMetaEvent } from "../../lib/metaPixel.js";
import ProductCard from "../catalog/ProductCard.jsx";
import SectionHeading from "../ui/SectionHeading.jsx";
import { CoaViewer, coaText } from "../coa/CoaLibrary.jsx";
import { formatRewardPoints, getProductRewardPoints } from "../../lib/rewards.js";

const PRESENTATION_PATTERN = /\d+(?:[.,]\d+)?\s*(?:mcg|mg|ml|g|iu|ui)\b/i;

function normalizePresentationLabel(value = "") {
  const cleanValue = String(value).trim();
  const match = cleanValue.match(PRESENTATION_PATTERN);

  if (!match) return cleanValue.toUpperCase();

  return match[0]
    .replace(/\s+/g, "")
    .replace(/^(\d+(?:[.,]\d+)?)([a-z]+)$/i, "$1 $2")
    .toUpperCase();
}

function getPresentationAmount(label = "") {
  const match = String(label).match(PRESENTATION_PATTERN);
  if (!match) return Number.POSITIVE_INFINITY;

  return Number.parseFloat(match[0].replace(/[^\d.,]/g, "").replace(",", "."));
}

function sortDoseOptions(options) {
  return options.sort(
    (a, b) => getPresentationAmount(a.label) - getPresentationAmount(b.label)
  );
}

function getDoseLabel(attributes = [], fallback = "") {
  for (const attribute of attributes) {
    const option = String(attribute?.option || "").trim();
    const name = String(attribute?.name || "").trim();
    const match = option.match(PRESENTATION_PATTERN);

    if (match) return normalizePresentationLabel(match[0]);

    if (/\b(mg|strength|dose|dosage)\b/i.test(name) && option) {
      return /mg/i.test(option) ? option.toUpperCase() : `${option} MG`;
    }

    if (/\b(presentaci[oó]n|presentation|size|volume|format|formato)\b/i.test(name) && option) {
      return normalizePresentationLabel(option);
    }
  }

  const firstOption = attributes
    .map((attribute) => String(attribute?.option || "").trim())
    .find(Boolean);

  if (firstOption) return normalizePresentationLabel(firstOption);

  const fallbackMatch = String(fallback).match(PRESENTATION_PATTERN);
  return fallbackMatch ? normalizePresentationLabel(fallbackMatch[0]) : "STANDARD";
}

function getProductDoseOptions(product, variations) {
  const productImages = product?.images || [];

  if (variations.length > 0) {
    return sortDoseOptions(variations.map((variation, index) => ({
      key: String(variation.id),
      variationId: variation.id,
      label: getDoseLabel(variation.attributes, variation.sku || product.name),
      source: variation,
      priceMap: variation?.labcore_multicurrency?.all_prices || {},
      price: variation.price || product.price,
      regularPrice: variation.regular_price || product.regular_price,
      stockStatus: variation.stock_status || product.stock_status,
      stockQuantity: variation.stock_quantity,
      sku: variation.sku || product.sku,
      image:
        variation.image?.src ||
        productImages[index]?.src ||
        productImages[0]?.src ||
        "",
    })));
  }

  const presentationAttribute = product?.attributes?.find((attribute) => {
    const name = String(attribute?.name || "");
    return (
      /\b(mg|strength|dose|dosage|presentaci[oó]n|presentation|size|volume|format|formato)\b/i.test(name) ||
      attribute?.options?.some((option) => PRESENTATION_PATTERN.test(String(option)))
    );
  });

  if (presentationAttribute?.options?.length > 0) {
    const isDoseAttribute = /\b(mg|strength|dose|dosage)\b/i.test(
      String(presentationAttribute.name || "")
    );

    return sortDoseOptions(presentationAttribute.options.map((option, index) => ({
      key: `dose-${option}`,
      variationId: null,
      label:
        isDoseAttribute && !PRESENTATION_PATTERN.test(String(option))
          ? `${option} MG`
          : normalizePresentationLabel(option),
      source: product,
      priceMap: product?.labcore_multicurrency?.all_prices || {},
      price: product.price,
      regularPrice: product.regular_price,
      stockStatus: product.stock_status,
      stockQuantity: product.stock_quantity,
      sku: product.sku,
      image: productImages[index]?.src || productImages[0]?.src || "",
    })));
  }

  return [
    {
      key: "base",
      variationId: null,
      label: getDoseLabel([], product?.name || ""),
      source: product,
      priceMap: product?.labcore_multicurrency?.all_prices || {},
      price: product?.price,
      regularPrice: product?.regular_price,
      stockStatus: product?.stock_status,
      stockQuantity: product?.stock_quantity,
      sku: product?.sku,
      image: productImages[0]?.src || "",
    },
  ];
}

export default function ProductDetail({ product, variations = [], featuredProducts = [], pageStatus = "ready" }) {
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { currency, formatMoney, getPriceData } = useCurrency();
  const options = useMemo(
    () => (product ? getProductDoseOptions(product, variations) : []),
    [product, variations]
  );
  const [selectedKey, setSelectedKey] = useState(options[0]?.key || "");
  const selected =
    options.find((option) => option.key === selectedKey) || options[0];
  const selectedPriceData = getPriceData(selected?.source || product);
  const selectedRewardPoints = getProductRewardPoints(selected?.source || product);
  const [displayImage, setDisplayImage] = useState(selected?.image || "");
  const [imageLoading, setImageLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formStatus, setFormStatus] = useState("idle");
  const recommendedExtras = useMemo(() => {
    if (!product || !featuredProducts.length) return [];
    const explicitIds = [...(product.cross_sell_ids || []), ...(product.upsell_ids || [])].map(Number);
    const currentName = String(product.name || "").toLowerCase();
    const score = (candidate) => {
      const name = String(candidate?.name || "").toLowerCase();
      let value = 0;
      const explicitIndex = explicitIds.indexOf(Number(candidate.id));
      if (explicitIndex >= 0) value += 1000 - explicitIndex;
      if (/bac\s*water|bacteriostatic|bacteriostática|bacteriostatica/.test(name) && !/bac\s*water|bacteriostatic|bacteriostática|bacteriostatica/.test(currentName)) value += 5000;
      if (/\breta\b|retatrutide/.test(currentName) && /ghk[\s-]*cu/.test(name)) value += 250;
      if (candidate.is_fallback_recommendation) value += 100;
      return value;
    };
    return featuredProducts
      .filter((candidate) => candidate.stock_status === "instock")
      .map((candidate) => ({ candidate, score: score(candidate) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((entry) => entry.candidate);
  }, [featuredProducts, product]);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [extraOptions, setExtraOptions] = useState({});
  const [coaState, setCoaState] = useState({ status: "loading", record: null });
  const [showCoa, setShowCoa] = useState(false);

  useEffect(() => {
    if (!product?.id || !selected) return;

    const price = Number(selectedPriceData.price || 0);
    const item = {
      id: product.id,
      variationId: selected.variationId,
      quantity: 1,
      price,
    };

    trackMetaEvent(
      "ViewContent",
      {
        ...metaCartData([item], currency, price),
        content_name: String(product.name || ""),
        content_category: String(product.categories?.[0]?.name || ""),
      },
      {
        dedupeKey: `lab_meta_view:${product.id}:${selected.variationId || "base"}:${currency}`,
      },
    );
  }, [
    currency,
    product?.id,
    product?.name,
    selected?.variationId,
    selectedPriceData.price,
  ]);

  useEffect(() => {
    const nextImage = selected?.image || "";
    if (!nextImage || nextImage === displayImage) return;

    let active = true;
    const image = new Image();
    setImageLoading(true);
    image.onload = () => {
      if (!active) return;
      setDisplayImage(nextImage);
      setImageLoading(false);
    };
    image.onerror = () => {
      if (active) setImageLoading(false);
    };
    image.src = nextImage;

    return () => {
      active = false;
    };
  }, [displayImage, selected?.image]);

  useEffect(() => {
    setFormStatus("idle");
  }, [selectedKey]);

  useEffect(() => {
    setSelectedExtras([]);
    setExtraOptions({});
  }, [product?.id]);

  useEffect(() => {
    if (!product?.id) return undefined;
    let active = true;
    setCoaState({ status: "loading", record: null });
    fetch(`/api/coa?productId=${encodeURIComponent(product.id)}`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !Array.isArray(payload)) throw new Error(payload?.code || "COA_API_ERROR");
        return payload;
      })
      .then((records) => {
        if (!active) return;
        const sorted = [...records].sort((a, b) => {
          const aCurrent = Number(Boolean(a.currentShippingLot || a.activeShippingLot || a.currentCoa?.currentShippingLot));
          const bCurrent = Number(Boolean(b.currentShippingLot || b.activeShippingLot || b.currentCoa?.currentShippingLot));
          if (aCurrent !== bCurrent) return bCurrent - aCurrent;
          const aDate = Date.parse(a.currentCoa?.date || a.date || 0) || 0;
          const bDate = Date.parse(b.currentCoa?.date || b.date || 0) || 0;
          return bDate - aDate;
        });
        setCoaState({ status: "ready", record: sorted[0] || null });
      })
      .catch(() => { if (active) setCoaState({ status: "error", record: null }); });
    return () => { active = false; };
  }, [product?.id]);

  useEffect(() => {
    if (!showCoa) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [showCoa]);

  const formatPrice = (price) => {
    const parsed = Number(price);
    return Number.isFinite(parsed) && parsed > 0 ? formatMoney(parsed) : t("catalog.requestPrice");
  };

  if (!product) {
    const offline = pageStatus === "offline";

    return (
      <main className="min-h-[76vh] px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pt-[12rem] lg:px-8 lg:pt-[13rem]">
        <div className="mx-auto max-w-[1180px] border border-cyan-400/15 bg-[#061021]/80 px-6 py-16 text-center sm:px-10 sm:py-24">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
            <AlertTriangle size={25} />
          </div>
          <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-400">
            SYS_PRODUCT // {offline ? "503" : "404"}
          </p>
          <h1 className="mt-4 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl">
            {t(offline ? "product.offline" : "product.notFound")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-mono text-xs leading-6 text-slate-400">
            {t(offline ? "product.offlineText" : "product.notFoundText")}
          </p>
          <a
            href="/shop"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 bg-cyan-400 px-6 text-[10px] font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-white"
          >
            <ArrowLeft size={14} /> {t("product.backCatalog")}
          </a>
        </div>
      </main>
    );
  }

  const isInStock = selected?.stockStatus === "instock";
  const hasSelectedPrice = Number.isFinite(selectedPriceData.price) && selectedPriceData.price > 0;
  const canPurchase = isInStock && hasSelectedPrice;
  const hasMultipleOptions = options.length > 1;

  const addSelectedToCart = () => {
    if (!selected || !canPurchase) return;

    addToCart({
      ...product,
      price: selectedPriceData.price,
      regularPrice: selectedPriceData.regular,
      currency,
      priceMap: selected.priceMap || selected?.source?.labcore_multicurrency?.all_prices || product?.labcore_multicurrency?.all_prices || {},
      stock_status: selected.stockStatus,
      variationId: selected.variationId,
      cartKey: `${product.id}:${selected.variationId || selected.label}`,
      variantLabel: selected.label,
      sku: selected.sku || product.sku,
      images: selected.image ? [{ src: selected.image }] : product.images,
    });

    recommendedExtras.filter((extra) => selectedExtras.includes(extra.id)).forEach((extra) => {
        const choices = getProductDoseOptions(extra, extra.recommendation_variations || []);
        const choice = choices.find((option) => option.key === extraOptions[extra.id]) || choices[0];
        const extraPrice = getPriceData(choice?.source || extra);
        if (!Number.isFinite(extraPrice.price) || extraPrice.price <= 0) return;
        addToCart({
          ...extra,
          price: extraPrice.price,
          regularPrice: extraPrice.regular,
          currency,
          priceMap: extra?.labcore_multicurrency?.all_prices || {},
          stock_status: choice?.stockStatus || extra.stock_status,
          variationId: choice?.variationId || null,
          variantLabel: choice?.label || "STANDARD",
          sku: choice?.sku || extra.sku,
          images: choice?.image ? [{ src: choice.image }] : extra.images,
          cartKey: `${extra.id}:${choice?.variationId || choice?.label || "base"}`,
        });
      });
  };

  const submitNotification = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      setFormStatus("invalid");
      return;
    }

    setFormStatus("submitting");

    try {
      const response = await fetch("/api/back-notifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          productId: product.id,
          variationId: selected?.variationId,
          productName: product.name,
          mg: selected?.label,
          website: "",
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setFormStatus("success");
        setForm({ name: "", email: "" });
      } else if (result.code === "NOT_CONFIGURED") {
        setFormStatus("notConfigured");
      } else {
        setFormStatus("error");
      }
    } catch {
      setFormStatus("error");
    }
  };

  const statusMessage = {
    invalid: t("product.requiredFields"),
    success: t("product.notified"),
    notConfigured: t("product.notifyConfigError"),
    error: t("product.notifyError"),
  }[formStatus];

  return (
    <main className="px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-24 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
      <div className="mx-auto max-w-[1180px]">
        <a
          href="/shop"
          className="group mb-5 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-cyan-300 sm:mb-7"
        >
          <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1" />
          {t("product.backCatalog")}
        </a>

        <section className="grid items-start overflow-hidden border border-white/10 bg-[#061021]/90 shadow-[0_35px_100px_rgba(0,0,0,0.38)] lg:grid-cols-[minmax(0,1.04fr)_minmax(390px,.96fr)] lg:gap-5 lg:overflow-visible lg:border-0 lg:bg-transparent lg:shadow-none">
          <div className="relative min-w-0 border-b border-white/10 bg-[#030712] lg:sticky lg:top-[8.75rem] lg:self-start lg:border lg:border-white/10 lg:shadow-[0_30px_90px_rgba(0,0,0,0.32)]">
            <span className="absolute left-0 top-0 z-20 h-6 w-6 border-l border-t border-cyan-300/80" />
            <span className="absolute right-0 top-0 z-20 h-6 w-6 border-r border-t border-cyan-300/80" />
            <div className="relative aspect-square w-full overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.14),transparent_50%),linear-gradient(145deg,#071426,#020617)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.7)_1px,transparent_1px)] bg-[size:36px_36px] opacity-[0.055]" />

              {displayImage ? (
                <img
                  key={displayImage}
                  src={displayImage}
                  alt={`${t("product.imageFor")} ${product.name} ${selected?.label || ""}`}
                  fetchpriority="high"
                  decoding="async"
                  className="relative z-10 h-full w-full animate-[labFadeScale_.42s_cubic-bezier(.16,1,.3,1)] object-cover"
                />
              ) : (
                <div className="relative z-10 flex h-full items-center justify-center">
                  <FlaskConical size={84} strokeWidth={1} className="text-cyan-300/35" />
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#030712]/85 to-transparent" />
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 border border-cyan-300/20 bg-[#020617]/80 px-3 py-2 font-sans text-[11px] font-semibold text-cyan-100 backdrop-blur-md sm:bottom-5 sm:left-5">
                <ScanLine size={13} /> {language === "es" ? "Imagen de referencia" : "Reference image"} · {selected?.label}
              </div>
              <div className={`absolute inset-0 z-30 flex items-center justify-center bg-[#020617]/45 transition-opacity duration-200 ${imageLoading ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                <LoaderCircle size={24} className="animate-spin text-cyan-300" />
                <span className="sr-only">{t("product.loadingImage")}</span>
              </div>
            </div>
          </div>

          <div className="relative flex min-w-0 flex-col p-5 sm:p-8 lg:border lg:border-white/10 lg:bg-[#061021]/90 lg:p-10 lg:shadow-[0_30px_90px_rgba(0,0,0,0.32)] xl:p-12">
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-cyan-400/[0.045] blur-[80px]" />

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-300">
                  {language === "es" ? "Producto para investigación" : "Research product"}
                </p>
                <span className={`flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.13em] ${isInStock ? "border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-200" : "border-red-300/25 bg-red-300/[0.07] text-red-200"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isInStock ? "bg-emerald-300" : "bg-red-300"}`} />
                  {isInStock ? t("catalog.inStock") : t("catalog.outOfStock")}
                </span>
              </div>

              <h1 className="mt-5 max-w-[620px] font-['Orbitron'] text-[clamp(1.55rem,3.1vw,2.65rem)] font-black uppercase leading-[1.08] tracking-[-0.045em] text-white">
                {product.name}
              </h1>

              <p className="mt-5 max-w-xl font-sans text-sm leading-7 text-slate-300 sm:text-base">
                {product.shortDescriptionText || product.descriptionText || t("product.profileText")}
              </p>

            </div>

            <div className="relative mt-7 rounded-2xl border border-cyan-300/15 bg-[#041126]/75 p-4 sm:p-6">
              <div>
                <div>
                  <h2 className="font-['Orbitron'] text-sm font-black tracking-[-0.01em] text-white">
                    {hasMultipleOptions
                      ? language === "es" ? "Elige tu presentación" : "Choose your presentation"
                      : language === "es" ? "Presentación disponible" : "Available presentation"}
                  </h2>
                  {hasMultipleOptions && (
                    <p className="mt-2 max-w-md font-sans text-xs leading-5 text-slate-400">
                      {language === "es"
                        ? "Toca una opción para actualizar el precio."
                        : "Tap an option to update the price."}
                    </p>
                  )}
                </div>
              </div>

              <div className={`mt-5 grid gap-3 ${hasMultipleOptions ? "grid-cols-1 sm:grid-cols-2" : "max-w-[340px] grid-cols-1"}`}>
                {options.map((option) => {
                  const active = option.key === selected?.key;
                  const available = option.stockStatus === "instock";
                  const optionPrice = getPriceData(option.source).price;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedKey(option.key)}
                      aria-pressed={active}
                      className={`relative flex min-h-[96px] flex-col justify-between rounded-xl border p-4 text-left transition-all ${active ? "border-cyan-300/60 bg-cyan-300/[0.11] text-white shadow-[0_10px_28px_rgba(6,182,212,0.12)]" : "border-white/10 bg-[#07162a]/80 text-white hover:border-cyan-300/35 hover:bg-cyan-300/[0.06]"}`}
                    >
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="font-['Orbitron'] text-sm font-black uppercase tracking-[0.04em] sm:text-base">
                          {option.label}
                        </span>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-cyan-300/60 bg-cyan-300/[0.12] text-cyan-200" : "border-white/10 text-transparent"}`}>
                          <Check size={13} strokeWidth={3} />
                        </span>
                      </span>
                      <span className="mt-4 flex w-full items-end justify-between gap-3 border-t border-white/[0.07] pt-3">
                        <span className={`flex min-w-0 items-center gap-1.5 font-sans text-[10px] font-semibold ${available ? "text-emerald-300" : "text-red-300"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-300" : "bg-red-300"}`} />
                          {available ? t("catalog.inStock") : t("catalog.outOfStock")}
                        </span>
                        {Number.isFinite(optionPrice) && optionPrice > 0 && (
                          <span className="shrink-0 font-['Orbitron'] text-[11px] font-black text-white sm:text-xs">
                            {formatPrice(optionPrice)}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {recommendedExtras.length > 0 && (
              <details className="group relative mt-6 overflow-hidden rounded-[18px] border border-cyan-300/15 bg-[#040d1e]">
                <summary className="flex cursor-pointer list-none items-start gap-3 bg-gradient-to-r from-cyan-300/[0.07] to-transparent px-4 py-4 sm:px-5 [&::-webkit-details-marker]:hidden">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300">
                    <Plus size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.07em] text-white">
                      {language === "es" ? "Complementos opcionales" : "Optional add-ons"}
                    </p>
                    <p className="mt-1.5 font-sans text-[11px] leading-4 text-slate-400">
                      {language === "es"
                        ? "No necesitas elegirlos para comprar este producto. Ábrelo solo si quieres revisarlos."
                        : "You do not need these to buy this product. Open only if you want to review them."}
                    </p>
                  </div>
                  <span className="mt-1 shrink-0 font-mono text-[9px] font-bold uppercase text-cyan-300 group-open:hidden">
                    {language === "es" ? "Ver" : "View"}
                  </span>
                  <span className="mt-1 hidden shrink-0 font-mono text-[9px] font-bold uppercase text-cyan-300 group-open:inline">
                    {language === "es" ? "Cerrar" : "Close"}
                  </span>
                </summary>

                <div className="grid gap-px border-t border-white/[0.07] bg-white/[0.06] sm:grid-cols-2">
                  {recommendedExtras.map((extra) => {
                    const checked = selectedExtras.includes(extra.id);
                    const choices = getProductDoseOptions(extra, extra.recommendation_variations || []).filter((option) => option.stockStatus === "instock");
                    const selectedChoice = choices.find((option) => option.key === extraOptions[extra.id]) || choices[0];
                    const extraPrice = getPriceData(selectedChoice?.source || extra);
                    const image = selectedChoice?.image || extra.images?.[0]?.src;
                    return (
                      <article key={extra.id} className={`bg-[#061021] p-3 transition-colors sm:p-4 ${checked ? "bg-cyan-300/[0.09]" : ""}`}>
                        <button
                          type="button"
                          aria-pressed={checked}
                          onClick={() => setSelectedExtras((current) => checked ? current.filter((id) => id !== extra.id) : [...current, extra.id])}
                          className="flex min-h-[68px] w-full items-center gap-3 text-left"
                        >
                          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white">
                            {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <FlaskConical size={20} className="text-slate-700" />}
                            {checked && <span className="absolute inset-0 flex items-center justify-center bg-cyan-300/85 text-[#020617]"><Check size={20} strokeWidth={3} /></span>}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="lab-line-clamp-2 font-['Orbitron'] text-[8px] font-black uppercase leading-4 tracking-[0.05em] text-white">{extra.name}</span>
                            <span className="mt-1.5 block font-mono text-[9px] font-bold text-cyan-300">+ {formatPrice(extraPrice.price)}</span>
                          </span>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-300 bg-cyan-300 text-[#020617]" : "border-white/20 text-transparent"}`}><Check size={12} strokeWidth={3} /></span>
                        </button>

                        {choices.length > 1 && (
                          <label className="mt-3 block border-t border-white/[0.07] pt-3">
                            <span className="mb-2 block font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-slate-500">{language === "es" ? "Selecciona presentación" : "Select presentation"}</span>
                            <span className="relative block">
                              <select
                                value={selectedChoice?.key || ""}
                                onChange={(event) => {
                                  setExtraOptions((current) => ({ ...current, [extra.id]: event.target.value }));
                                  setSelectedExtras((current) => current.includes(extra.id) ? current : [...current, extra.id]);
                                }}
                                className="h-10 w-full appearance-none rounded-xl border border-cyan-300/15 bg-[#020817] px-3 pr-9 font-mono text-[8px] font-bold uppercase text-white outline-none focus:border-cyan-300/50"
                              >
                                {choices.map((choice) => <option key={choice.key} value={choice.key}>{choice.label} · {formatPrice(getPriceData(choice.source).price)}</option>)}
                              </select>
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300">⌄</span>
                            </span>
                          </label>
                        )}
                      </article>
                    );
                  })}
                </div>
              </details>
            )}

            <div className="relative mt-auto pt-7">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-500">
                    {language === "es" ? "Tu selección" : "Your selection"} · {selected?.label}
                  </p>
                  <p className="mt-2 font-['Orbitron'] text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                    {formatPrice(selectedPriceData.price)}
                  </p>
                  <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.16em] text-cyan-300/60">{currency}</p>
                  {selectedRewardPoints.points > 0 && (
                    <p className="mt-2 font-mono text-[9px] font-bold text-emerald-300">
                      + {formatRewardPoints(selectedRewardPoints.points)}{" "}
                      {language === "es" ? "puntos con esta presentación · 1 punto por cada $1.000 COP" : "points with this presentation · 1 point per COP 1,000"}
                    </p>
                  )}
                </div>
                <p className="text-right font-mono text-[8px] uppercase leading-4 tracking-[0.13em] text-slate-500">
                  {t("product.sku")}<br />
                  <span className="text-cyan-300">{selected?.sku || product.sku || `LAB-${product.id}`}</span>
                </p>
              </div>

              {canPurchase ? (
                <div>
                  <button
                    type="button"
                    onClick={addSelectedToCart}
                    className="flex min-h-14 w-full items-center justify-center gap-3 bg-cyan-400 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-black shadow-[0_0_30px_rgba(34,211,238,0.18)] transition-colors hover:bg-white sm:text-[11px]"
                  >
                    <ShoppingCart size={16} /> {selectedExtras.length > 0
                      ? language === "es"
                        ? `Añadir todo (${selectedExtras.length + 1})`
                        : `Add all (${selectedExtras.length + 1})`
                      : language === "es" ? "Añadir al carrito" : "Add to cart"}
                  </button>

                  <div className="mt-3 grid overflow-hidden border border-cyan-300/15 bg-[#041024] sm:grid-cols-3">
                    {[
                      {
                        icon: Truck,
                        title: t("product.secureShippingTitle"),
                        text: t("product.secureShippingText"),
                      },
                      {
                        icon: ScanLine,
                        title: t("product.productCoaTitle"),
                        text: t("product.productCoaText"),
                      },
                      {
                        icon: PackageCheck,
                        title: t("product.discreetPackagingTitle"),
                        text: t("product.discreetPackagingText"),
                      },
                    ].map(({ icon: Icon, title, text }, index) => (
                      <div
                        key={title}
                        className={`flex min-h-[86px] items-start gap-2.5 p-3 ${index < 2 ? "border-b border-cyan-300/10 sm:border-b-0 sm:border-r" : ""}`}
                      >
                        <Icon size={15} className="mt-0.5 shrink-0 text-cyan-300" />
                        <div>
                          <p className="font-['Orbitron'] text-[8px] font-black uppercase leading-[1.4] tracking-[0.08em] text-white">
                            {title}
                          </p>
                          <p className="mt-1.5 font-mono text-[7px] leading-[1.5] text-slate-500">
                            {text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-start gap-2 border-l-2 border-amber-300/60 bg-amber-300/[0.045] px-3 py-2.5">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-300" />
                    <p className="font-mono text-[8px] leading-[1.55] text-amber-100/70 sm:text-[9px]">
                      {t("product.noRefund")}
                    </p>
                  </div>

                  <p className="mx-auto mt-3 max-w-xl text-center font-mono text-[7px] leading-[1.65] text-slate-600 sm:text-[8px]">
                    {t("product.acceptanceBefore")}{" "}
                    <a href="/terms-conditions" className="text-slate-400 underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-300">
                      {t("product.acceptanceTerms")}
                    </a>{" "}
                    {t("product.acceptanceAfter")}
                  </p>
                </div>
              ) : isInStock ? (
                <div className="border border-amber-300/20 bg-amber-300/[0.045] p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-amber-300/20 bg-amber-300/[0.06] text-amber-300">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <h2 className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.1em] text-white">
                        {language === "es" ? `Precio ${currency} no configurado` : `${currency} price not configured`}
                      </h2>
                      <p className="mt-2 font-mono text-[9px] leading-5 text-amber-100/65">
                        {language === "es"
                          ? "Esta presentación tiene inventario, pero todavía no tiene un precio guardado para la moneda seleccionada. Elige otra moneda o completa el precio desde WooCommerce → Precios Multimoneda."
                          : "This variation is in stock, but it does not yet have a saved price for the selected currency. Choose another currency or complete it under WooCommerce → Multi-Currency Prices."}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-cyan-400/15 bg-[#030a18]/75 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300">
                      <Bell size={15} />
                    </div>
                    <div>
                      <h2 className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.1em] text-white">
                        {t("product.notifyTitle")}
                      </h2>
                      <p className="mt-2 font-mono text-[9px] leading-4 text-slate-500">
                        {t("product.notifyText")}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={submitNotification} className="mt-5 grid gap-3 sm:grid-cols-2" noValidate>
                    <label className="block">
                      <span className="mb-2 block font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400">
                        {t("product.name")}
                      </span>
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder={t("product.namePlaceholder")}
                        maxLength={80}
                        required
                        className="h-12 w-full border border-white/10 bg-[#020617] px-3 font-mono text-xs text-white placeholder:text-slate-700 focus:border-cyan-300 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-mono text-[8px] uppercase tracking-[0.16em] text-slate-400">
                        {t("product.email")}
                      </span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder={t("product.emailPlaceholder")}
                        maxLength={160}
                        required
                        className="h-12 w-full border border-white/10 bg-[#020617] px-3 font-mono text-xs text-white placeholder:text-slate-700 focus:border-cyan-300 focus:outline-none"
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={formStatus === "submitting" || formStatus === "success"}
                      className="flex min-h-12 items-center justify-center gap-2 bg-cyan-400 px-4 text-[9px] font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
                    >
                      {formStatus === "submitting" ? <LoaderCircle size={14} className="animate-spin" /> : formStatus === "success" ? <Check size={14} /> : <Bell size={14} />}
                      {formStatus === "submitting" ? t("product.sending") : t("product.notifyButton")}
                    </button>
                  </form>

                  {statusMessage && (
                    <p
                      aria-live="polite"
                      className={`mt-3 font-mono text-[9px] leading-4 ${formStatus === "success" ? "text-emerald-300" : "text-amber-300"}`}
                    >
                      {statusMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-cyan-300/15 bg-[#040d1e]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex items-start gap-4 p-5 sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300">
                {coaState.status === "loading" ? <LoaderCircle size={19} className="animate-spin" /> : <FileCheck2 size={19} />}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-cyan-300/65">COA // {language === "es" ? "ÚLTIMO REGISTRO" : "LATEST RECORD"}</p>
                {coaState.status === "loading" ? (
                  <p className="mt-2 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.07em] text-white">{language === "es" ? "Consultando archivo analítico" : "Checking analytical archive"}</p>
                ) : coaState.record ? (
                  <>
                    <h2 className="mt-2 font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.06em] text-white sm:text-sm">{language === "es" ? "Certificado más reciente disponible" : "Latest certificate available"}</h2>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[8px] uppercase tracking-[0.08em] text-slate-500">
                      <span>{language === "es" ? "Lote" : "Batch"}: <b className="text-white">{coaState.record.batch || coaState.record.lot || "—"}</b></span>
                      <span>{language === "es" ? "Pureza" : "Purity"}: <b className="text-emerald-300">{coaState.record.currentCoa?.purity || coaState.record.purity || "—"}</b></span>
                      <span>{language === "es" ? "Fecha" : "Date"}: <b className="text-white">{coaState.record.currentCoa?.date || coaState.record.date || "—"}</b></span>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.07em] text-white">{language === "es" ? "Sin COA vinculado por el momento" : "No linked COA at this time"}</h2>
                    <p className="mt-2 font-mono text-[8px] leading-4 text-slate-500">{language === "es" ? "Puedes consultar el archivo completo por lote o referencia." : "You can search the complete archive by batch or reference."}</p>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.07] p-4 lg:border-l lg:border-t-0 lg:p-5">
              {coaState.record ? (
                <button type="button" onClick={() => setShowCoa(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.11em] text-[#020617] transition-colors hover:bg-white lg:w-auto">
                  <Eye size={15} /> {language === "es" ? "Ver COA reciente" : "View latest COA"}
                </button>
              ) : (
                <a href="/coa-library" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/20 px-6 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.11em] text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-[#020617] lg:w-auto">
                  <Search size={14} /> {language === "es" ? "Buscar en biblioteca" : "Search COA library"}
                </a>
              )}
            </div>
          </div>
        </section>

        {showCoa && coaState.record && (
          <CoaViewer record={coaState.record} copy={coaText[language] || coaText.es} language={language} onClose={() => setShowCoa(false)} />
        )}

        <section className="mt-5 grid border border-white/10 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: t("product.verifiedBatch"), text: t("product.profileText") },
            { icon: ScanLine, title: t("product.coaReady"), text: t("catalog.researchDisclaimer") },
            { icon: Truck, title: t("product.secureDispatch"), text: t("product.researchOnly") },
          ].map(({ icon: Icon, title, text }, index) => (
            <article key={title} className={`relative min-h-40 bg-[#061021]/60 p-5 sm:p-6 ${index < 2 ? "border-b border-white/10 md:border-b-0 md:border-r" : ""}`}>
              <div className="flex h-9 w-9 items-center justify-center border border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-300">
                <Icon size={16} />
              </div>
              <h2 className="mt-5 font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.12em] text-white">
                {title}
              </h2>
              <p className="mt-3 font-mono text-[9px] leading-4 text-slate-500">
                {text}
              </p>
            </article>
          ))}
        </section>

        {featuredProducts.length > 0 && (
          <section className="mt-20 border-t border-white/[0.07] pt-16 sm:mt-24 sm:pt-20">
            <SectionHeading
              index="★"
              eyebrow={t("product.featuredEyebrow")}
              title={t("product.featuredTitle")}
              accent={t("product.featuredAccent")}
              description={t("product.featuredDescription")}
              className="mb-9 sm:mb-12"
            />

            <div className="grid grid-cols-2 justify-items-center gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((featuredProduct) => (
                <div key={featuredProduct.id} className="w-full max-w-[268px]">
                  <ProductCard product={featuredProduct} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
