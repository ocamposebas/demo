import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export const CURRENCIES = {
  USD: { code: "USD", flag: "🇺🇸", label: "USD", name: "Dólar estadounidense", names: { es: "Dólar estadounidense", en: "US dollar" }, locale: "en-US", decimals: 2 },
  COP: { code: "COP", flag: "🇨🇴", label: "COP", name: "Peso colombiano", names: { es: "Peso colombiano", en: "Colombian peso" }, locale: "es-CO", decimals: 0 },
  MXN: { code: "MXN", flag: "🇲🇽", label: "MXN", name: "Peso mexicano", names: { es: "Peso mexicano", en: "Mexican peso" }, locale: "es-MX", decimals: 2 },
};

const COOKIE_NAME = "labcore_currency";
const STORAGE_NAME = "labcore_currency";
const CurrencyContext = createContext(null);
// Lanzamiento Colombia: cambia a false para reactivar detección y selección multimoneda.
export const COP_ONLY = true;
const STOREFRONT_CURRENCY = "COP";

const cleanCurrency = (value) => {
  const code = String(value || "").trim().toUpperCase();
  return CURRENCIES[code] ? code : "";
};

const readCookie = () => {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  return cleanCurrency(match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : "");
};

const writeCurrency = (currency) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_NAME, currency);
  } catch {}
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(currency)};path=/;max-age=31536000;SameSite=Lax${window.location.protocol === "https:" ? ";Secure" : ""}`;
};

const browserCurrencyFallback = () => {
  if (typeof navigator === "undefined") return "USD";
  const locales = [navigator.language, ...(navigator.languages || [])]
    .filter(Boolean)
    .map((value) => String(value).toUpperCase());
  if (locales.some((value) => /(^|-)CO\b/.test(value))) return "COP";
  if (locales.some((value) => /(^|-)MX\b/.test(value))) return "MXN";
  return "USD";
};

const numeric = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/,/g, "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
};

const nativeUsdPrice = (entity) => {
  const price = numeric(entity?.price);
  const regular = numeric(entity?.regular_price ?? entity?.regularPrice);
  const sale = numeric(entity?.sale_price ?? entity?.salePrice);
  return {
    price,
    min: price,
    max: price,
    regular,
    regularMax: regular,
    sale,
    saleMax: sale,
    isRange: false,
  };
};

export const getEntityPriceData = (entity, currency = "USD") => {
  const code = cleanCurrency(currency) || "USD";
  const payload = entity?.labcore_multicurrency || entity?.multicurrency || null;
  const entry = payload?.all_prices?.[code] || entity?.priceMap?.[code] || null;

  if (entry) {
    const price = numeric(entry.price);
    const max = numeric(entry.price_max ?? entry.max_price ?? entry.max ?? entry.price);
    const regular = numeric(entry.regular ?? entry.regular_price);
    const regularMax = numeric(entry.regular_max ?? entry.regularMax ?? entry.regular ?? entry.regular_price);
    const sale = numeric(entry.sale ?? entry.sale_price);
    const saleMax = numeric(entry.sale_max ?? entry.saleMax ?? entry.sale ?? entry.sale_price);
    return {
      price,
      min: price,
      max,
      regular,
      regularMax,
      sale,
      saleMax,
      isRange: Number.isFinite(price) && Number.isFinite(max) && price !== max,
    };
  }

  if (payload && payload.currency === code) {
    const price = numeric(payload.price);
    const max = numeric(payload.max_price ?? payload.price);
    return {
      price,
      min: price,
      max,
      regular: numeric(payload.regular_price),
      regularMax: numeric(payload.regular_max ?? payload.regular_price),
      sale: numeric(payload.sale_price),
      saleMax: numeric(payload.sale_max ?? payload.sale_price),
      isRange: Boolean(payload.is_range) || (Number.isFinite(price) && Number.isFinite(max) && price !== max),
    };
  }

  return code === "USD" ? nativeUsdPrice(entity) : {
    price: null,
    min: null,
    max: null,
    regular: null,
    regularMax: null,
    sale: null,
    saleMax: null,
    isRange: false,
  };
};

export function CurrencyProvider({ children }) {
  const { setLanguage } = useLanguage();
  const initialCurrency = (() => {
    if (COP_ONLY) return STOREFRONT_CURRENCY;
    if (typeof window === "undefined") return "USD";
    try {
      return cleanCurrency(window.localStorage.getItem(STORAGE_NAME)) || readCookie() || "USD";
    } catch {
      return readCookie() || "USD";
    }
  })();

  const [currency, setCurrencyState] = useState(initialCurrency);
  const [ready, setReady] = useState(false);
  const [source, setSource] = useState(COP_ONLY ? "storefront-lock" : (initialCurrency !== "USD" || readCookie() ? "saved" : "default"));

  const setCurrency = useCallback((nextCurrency, options = {}) => {
    const next = COP_ONLY ? STOREFRONT_CURRENCY : cleanCurrency(nextCurrency);
    if (!next) return;
    setCurrencyState(next);
    writeCurrency(next);
    setSource(options.detected ? "detected" : "manual");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lab:currency-change", { detail: { currency: next } }));
    }
  }, []);

  useEffect(() => {
    if (COP_ONLY) {
      setCurrencyState(STOREFRONT_CURRENCY);
      writeCurrency(STOREFRONT_CURRENCY);
      setSource("storefront-lock");
      setReady(true);
      return;
    }

    let active = true;
    let saved = "";
    try {
      saved = cleanCurrency(window.localStorage.getItem(STORAGE_NAME)) || readCookie();
    } catch {
      saved = readCookie();
    }

    if (saved) {
      setCurrencyState(saved);
      writeCurrency(saved);
      setSource("saved");
      setReady(true);
      return () => { active = false; };
    }

    const detect = async () => {
      try {
        const response = await fetch("/api/currency/detect", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const payload = response.ok ? await response.json() : null;
        const detected = cleanCurrency(payload?.currency) || browserCurrencyFallback();
        if (!active) return;
        setCurrencyState(detected);
        writeCurrency(detected);
        setSource(payload?.source || "detected");
      } catch {
        if (!active) return;
        const fallback = browserCurrencyFallback();
        setCurrencyState(fallback);
        writeCurrency(fallback);
        setSource("browser");
      } finally {
        if (active) setReady(true);
      }
    };

    detect();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const nextLanguage = COP_ONLY ? "es" : (currency === "USD" ? "en" : "es");
    setLanguage(nextLanguage);
    window.dispatchEvent(new CustomEvent("lab:language-change", {
      detail: { language: nextLanguage, currency },
    }));
  }, [currency, ready, setLanguage]);

  const formatMoney = useCallback((value, options = {}) => {
    const code = cleanCurrency(options.currency || currency) || "USD";
    const config = CURRENCIES[code];
    const number = numeric(value);
    if (!Number.isFinite(number)) return options.fallback || "—";
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(number);
  }, [currency]);

  const getPriceData = useCallback((entity, code = currency) => getEntityPriceData(entity, code), [currency]);

  const formatEntityPrice = useCallback((entity, options = {}) => {
    const code = cleanCurrency(options.currency || currency) || "USD";
    const data = getEntityPriceData(entity, code);
    if (!Number.isFinite(data.price) || data.price <= 0) return options.fallback || "—";
    if (data.isRange && Number.isFinite(data.max)) {
      return `${formatMoney(data.price, { currency: code })} – ${formatMoney(data.max, { currency: code })}`;
    }
    return formatMoney(data.price, { currency: code });
  }, [currency, formatMoney]);

  const value = useMemo(() => ({
    currency,
    currencyConfig: CURRENCIES[currency],
    currencies: CURRENCIES,
    ready,
    source,
    setCurrency,
    formatMoney,
    getPriceData,
    formatEntityPrice,
  }), [currency, ready, source, setCurrency, formatMoney, getPriceData, formatEntityPrice]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
