import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "../../currency/CurrencyContext.jsx";
import {
  identifyOmnisendContact,
  identifyOmnisendContactWhenReady,
  trackOmnisendEvent,
} from "../../lib/omnisendClient.js";
import { metaCartData, trackMetaEvent } from "../../lib/metaPixel.js";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "lab_cart";
const CART_ID_STORAGE_KEY = "lab_omnisend_cart_id";
const CART_EMAIL_STORAGE_KEY = "lab_omnisend_contact_email";
const CART_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{15,79}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createCartId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `lab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
};

const normalizeEmail = (value) => {
  const email = String(value || "").trim().toLowerCase().slice(0, 160);
  return EMAIL_PATTERN.test(email) ? email : "";
};

const getCartKey = (item) => {
  if (!item || typeof item !== "object") return "";
  const customKey = String(item.cartKey || "").trim();
  if (customKey) return customKey;
  const id = Number(item.id || 0);
  if (!Number.isSafeInteger(id) || id <= 0) return "";
  const variationId = Number(item.variationId || 0);
  return `${id}:${Number.isSafeInteger(variationId) && variationId > 0 ? variationId : "base"}`;
};

const numeric = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const fallbackPriceForCurrency = (item, currency) => {
  const entry = item?.priceMap?.[currency];
  const price = numeric(entry?.price ?? entry?.sale ?? entry?.regular);
  if (Number.isFinite(price)) return price;
  if (String(item?.currency || "").toUpperCase() === currency) {
    const current = numeric(item?.price);
    if (Number.isFinite(current)) return current;
  }
  return null;
};

const normalizeCartItem = (item, fallbackQuantity = 1) => {
  if (!item || typeof item !== "object") return null;
  const id = Number(item.id || 0);
  const variationId = Number(item.variationId || 0);
  const rawQuantity = Number(item.quantity ?? fallbackQuantity);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const normalized = {
    ...item,
    id,
    variationId: Number.isSafeInteger(variationId) && variationId > 0 ? variationId : null,
    quantity: Number.isFinite(rawQuantity) ? Math.min(20, Math.max(1, Math.trunc(rawQuantity))) : fallbackQuantity,
    price: numeric(item.price) ?? 0,
    priceMap: item.priceMap && typeof item.priceMap === "object" ? item.priceMap : {},
    currency: String(item.currency || "USD").toUpperCase(),
  };
  const cartKey = getCartKey(normalized);
  return cartKey ? { ...normalized, cartKey } : null;
};

const absoluteStoreUrl = (value, fallbackPath = "/shop") => {
  if (typeof window === "undefined") return "";
  try {
    return new URL(value || fallbackPath, window.location.origin).toString();
  } catch {
    return new URL(fallbackPath, window.location.origin).toString();
  }
};

const omnisendLineItem = (item) => {
  const imageUrl = absoluteStoreUrl(item?.images?.[0]?.src, "/tarro1.png");
  const productUrl = absoluteStoreUrl(
    item?.slug ? `/products/${encodeURIComponent(item.slug)}` : "/shop",
  );
  const categories = Array.isArray(item?.categories)
    ? item.categories
      .map((category) => ({
        id: String(category?.id || category?.slug || "").trim(),
        title: String(category?.name || category?.title || "").trim(),
      }))
      .filter((category) => category.id || category.title)
    : [];
  const line = {
    productID: String(item?.id || ""),
    productVariantID: String(item?.variationId || item?.id || ""),
    productTitle: String(item?.name || "Producto de investigación LAB_CORE"),
    productQuantity: Number(item?.quantity || 1),
    productPrice: Number(item?.price || 0),
    productURL: productUrl,
    productImageURL: imageUrl,
    productVariantImageURL: imageUrl,
  };
  if (item?.sku) line.productSKU = String(item.sku);
  if (item?.description || item?.short_description) {
    line.productDescription = String(item.description || item.short_description)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }
  if (categories.length) line.productCategories = categories;
  return line;
};

const createBrowserCartEvent = ({ cartId, currency, items, addedCartKey, email }) => {
  const lineItems = items.map(omnisendLineItem);
  const addedIndex = items.findIndex((item) => getCartKey(item) === addedCartKey);
  const addedItem = lineItems[addedIndex >= 0 ? addedIndex : lineItems.length - 1];
  const eventID = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `lab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
  return {
    origin: "api",
    eventVersion: "",
    eventID,
    properties: {
      abandonedCheckoutURL: absoluteStoreUrl("/checkout"),
      cartID: cartId,
      currency,
      lineItems,
      ...(addedItem ? { addedItem } : {}),
      value: Number(items.reduce(
        (total, item) => total + Number(item?.price || 0) * Number(item?.quantity || 0),
        0,
      ).toFixed(2)),
    },
    ...(email ? { contact: { email } } : {}),
  };
};

export function CartProvider({ children }) {
  const { currency, setCurrency } = useCurrency();
  const [cartItems, setCartItems] = useState([]);
  const [cartId, setCartId] = useState("");
  const [cartContactEmail, setCartContactEmail] = useState("");
  const [cartReady, setCartReady] = useState(false);
  const [cartPricing, setCartPricing] = useState(false);
  const [cartPricingError, setCartPricingError] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const quoteRequestRef = useRef(0);
  const cartActionRef = useRef("updated");
  const addedCartKeyRef = useRef("");
  const cartHadItemsRef = useRef(false);
  const lastSyncedSignatureRef = useRef("");
  const lastCheckoutSignatureRef = useRef("");
  const pendingBrowserCartEventRef = useRef(null);
  const browserTrackedAddedKeyRef = useRef("");

  useEffect(() => {
    let active = true;
    const initializeCart = async () => {
      let normalizedCart = [];
      let nextCartId = createCartId();
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        normalizedCart = Array.isArray(parsedCart)
          ? parsedCart.map((item) => normalizeCartItem(item)).filter(Boolean)
          : [];
        const savedCartId = String(localStorage.getItem(CART_ID_STORAGE_KEY) || "");
        if (CART_ID_PATTERN.test(savedCartId)) nextCartId = savedCartId;
        const savedEmail = normalizeEmail(localStorage.getItem(CART_EMAIL_STORAGE_KEY));
        if (savedEmail) setCartContactEmail(savedEmail);
      } catch (error) {
        console.error("Failed to parse cart:", error);
      }

      const recoveryToken = new URLSearchParams(window.location.search).get("recover");
      if (recoveryToken) {
        try {
          const response = await fetch(
            `/api/marketing/cart?recover=${encodeURIComponent(recoveryToken)}`,
            { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } },
          );
          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !Array.isArray(payload?.items)) {
            throw new Error(payload?.code || "CART_RECOVERY_FAILED");
          }
          normalizedCart = payload.items.map((item) => normalizeCartItem(item)).filter(Boolean);
          if (CART_ID_PATTERN.test(String(payload.cartId || ""))) nextCartId = payload.cartId;
          if (["USD", "COP", "MXN"].includes(payload.currency)) setCurrency(payload.currency);
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("recover");
          window.history.replaceState({}, "", `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
        } catch (error) {
          console.error("Failed to recover cart:", error?.message || error);
        }
      }

      if (!active) return;
      cartHadItemsRef.current = normalizedCart.length > 0;
      setCartItems(normalizedCart);
      setCartId(nextCartId);
      try {
        localStorage.setItem(CART_ID_STORAGE_KEY, nextCartId);
      } catch {}
      setCartReady(true);
    };
    initializeCart();
    return () => { active = false; };
  }, [setCurrency]);

  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [cartItems, cartReady]);

  const identifyCartContact = useCallback((value) => {
    const email = normalizeEmail(value);
    if (!email) return false;
    setCartContactEmail(email);
    try {
      localStorage.setItem(CART_EMAIL_STORAGE_KEY, email);
    } catch {}
    return true;
  }, []);

  useEffect(() => {
    if (!cartContactEmail) return undefined;
    return identifyOmnisendContactWhenReady(cartContactEmail);
  }, [cartContactEmail]);

  useEffect(() => {
    const handleNewsletter = (event) => identifyCartContact(event?.detail?.email);
    const handleAccount = (event) => {
      const email = event?.detail?.user?.email;
      if (email) {
        identifyCartContact(email);
        return;
      }
      setCartContactEmail("");
      try {
        localStorage.removeItem(CART_EMAIL_STORAGE_KEY);
      } catch {}
    };
    window.addEventListener("lab:newsletter-subscribed", handleNewsletter);
    window.addEventListener("lab:account-session", handleAccount);
    return () => {
      window.removeEventListener("lab:newsletter-subscribed", handleNewsletter);
      window.removeEventListener("lab:account-session", handleAccount);
    };
  }, [identifyCartContact]);

  useEffect(() => {
    const pending = pendingBrowserCartEventRef.current;
    if (!cartReady || !pending || pending.action !== "added" || cartItems.length === 0) return;

    const email = normalizeEmail(cartContactEmail);
    if (!email) return;
    identifyOmnisendContact(email);
    const tracked = trackOmnisendEvent(
      "added product to cart",
      createBrowserCartEvent({
        cartId,
        currency,
        items: cartItems,
        addedCartKey: pending.addedCartKey,
        email,
      }),
    );

    if (tracked) {
      browserTrackedAddedKeyRef.current = pending.addedCartKey;
      pendingBrowserCartEventRef.current = null;
    }
  }, [cartItems, cartReady, cartId, cartContactEmail, currency]);

  useEffect(() => {
    if (!cartReady || !cartId || !cartContactEmail) return undefined;
    if (cartItems.length === 0 && !cartHadItemsRef.current) return undefined;

    const action = cartItems.length === 0 ? "cleared" : cartActionRef.current;
    const addedCartKey = addedCartKeyRef.current;
    const clientTracked = action === "added" && browserTrackedAddedKeyRef.current === addedCartKey;
    const signature = JSON.stringify({
      cartId,
      email: cartContactEmail,
      currency,
      action,
      addedCartKey,
      items: cartItems.map((item) => [item.id, item.variationId || 0, item.quantity]),
    });
    if (signature === lastSyncedSignatureRef.current) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/marketing/cart", {
          method: "POST",
          credentials: "same-origin",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            cartId,
            email: cartContactEmail,
            currency,
            action,
            addedCartKey,
            clientTracked,
            items: cartItems.map((item) => ({
              productId: Number(item.id),
              variationId: Number(item.variationId || 0),
              quantity: Number(item.quantity),
              title: item.name,
              slug: item.slug,
              sku: item.sku,
              imageUrl: item.images?.[0]?.src,
              variantTitle: item.variantLabel,
            })),
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.ok === false) throw new Error(payload?.code || "CART_SYNC_FAILED");
        lastSyncedSignatureRef.current = signature;
        cartHadItemsRef.current = cartItems.length > 0;
        cartActionRef.current = "updated";
        addedCartKeyRef.current = "";
        if (clientTracked) browserTrackedAddedKeyRef.current = "";
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.warn("Abandoned cart sync unavailable:", error?.message || error);
        }
      }
    }, 1_200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cartItems, cartReady, cartId, cartContactEmail, currency]);

  const refreshCartPrices = useCallback(async (targetCurrency = currency, itemsOverride = null) => {
    const sourceItems = Array.isArray(itemsOverride) ? itemsOverride : cartItems;
    if (!sourceItems.length) {
      setCartPricing(false);
      setCartPricingError("");
      return [];
    }

    const requestId = ++quoteRequestRef.current;
    setCartPricing(true);
    setCartPricingError("");

    try {
      const response = await fetch("/api/currency/quote", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          currency: targetCurrency,
          items: sourceItems.map((item) => ({
            productId: Number(item.id),
            variationId: Number(item.variationId || 0),
            quantity: Number(item.quantity),
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !Array.isArray(payload?.lines)) throw new Error(payload?.code || "QUOTE_FAILED");
      if (requestId !== quoteRequestRef.current) return sourceItems;

      const lineByLookup = new Map(payload.lines.map((line) => [Number(line.lookup_id || line.variation_id || line.product_id), line]));
      const nextItems = sourceItems.map((item) => {
        const lookupId = Number(item.variationId || item.id);
        const line = lineByLookup.get(lookupId);
        const quotedPrice = numeric(line?.unit_price);
        return {
          ...item,
          price: Number.isFinite(quotedPrice) ? quotedPrice : fallbackPriceForCurrency(item, targetCurrency) ?? item.price,
          currency: targetCurrency,
        };
      });
      setCartItems(nextItems);
      return nextItems;
    } catch (error) {
      if (requestId !== quoteRequestRef.current) return sourceItems;
      console.error("Cart repricing failed:", error?.message || error);
      const fallbackItems = sourceItems.map((item) => ({
        ...item,
        price: fallbackPriceForCurrency(item, targetCurrency) ?? item.price,
        currency: targetCurrency,
      }));
      setCartItems(fallbackItems);
      setCartPricingError(String(error?.message || "QUOTE_FAILED"));
      return fallbackItems;
    } finally {
      if (requestId === quoteRequestRef.current) setCartPricing(false);
    }
  }, [cartItems, currency]);

  useEffect(() => {
    if (!cartReady || cartItems.length === 0) return;
    const alreadyPriced = cartItems.every((item) => item.currency === currency && Number.isFinite(Number(item.price)) && Number(item.price) > 0);
    if (!alreadyPriced) refreshCartPrices(currency);
  }, [currency, cartReady]); // intentionally reprices only when the global currency becomes available or changes

  const addToCart = useCallback((product) => {
    const desiredPrice = fallbackPriceForCurrency(product, currency) ?? numeric(product?.price);
    if (!Number.isFinite(desiredPrice) || desiredPrice <= 0) return;
    const productWithKey = normalizeCartItem({ ...product, price: desiredPrice, currency, quantity: 1 });
    if (!productWithKey) return;
    trackMetaEvent("AddToCart", {
      ...metaCartData([productWithKey], currency),
      content_name: String(productWithKey.name || ""),
    });
    cartActionRef.current = "added";
    addedCartKeyRef.current = productWithKey.cartKey;
    pendingBrowserCartEventRef.current = {
      action: "added",
      addedCartKey: productWithKey.cartKey,
    };

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => getCartKey(item) === productWithKey.cartKey);
      if (existingItem) {
        return prevItems.map((item) => getCartKey(item) === productWithKey.cartKey
          ? { ...item, ...productWithKey, quantity: Math.min(20, Number(item.quantity || 0) + 1) }
          : item);
      }
      return [...prevItems, productWithKey];
    });
    setIsCartOpen(true);
  }, [currency]);

  const removeFromCart = useCallback((cartKey) => {
    cartActionRef.current = "updated";
    setCartItems((prevItems) => prevItems.filter((item) => getCartKey(item) !== String(cartKey)));
  }, []);

  const updateQuantity = useCallback((cartKey, amount) => {
    cartActionRef.current = "updated";
    setCartItems((prevItems) => prevItems.map((item) => {
      if (getCartKey(item) !== String(cartKey)) return item;
      const newQty = Math.min(20, item.quantity + amount);
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean));
  }, []);

  const clearCart = useCallback(() => {
    cartActionRef.current = "cleared";
    setCartItems([]);
    if (typeof window !== "undefined") localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const markCheckoutStarted = useCallback(async (value) => {
    const email = normalizeEmail(value);
    if (!email || !cartId || cartItems.length === 0) return false;
    identifyCartContact(email);
    const signature = `${cartId}:${email}:${currency}:${cartItems
      .map((item) => `${item.id}:${item.variationId || 0}:${item.quantity}`)
      .join("|")}`;
    if (signature === lastCheckoutSignatureRef.current) return true;

    try {
      identifyOmnisendContact(email);
      const clientTracked = trackOmnisendEvent(
        "started checkout",
        createBrowserCartEvent({
          cartId,
          currency,
          items: cartItems,
          addedCartKey: "",
          email,
        }),
      );
      const response = await fetch("/api/marketing/cart", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          cartId,
          email,
          currency,
          action: "started_checkout",
          clientTracked,
          items: cartItems.map((item) => ({
            productId: Number(item.id),
            variationId: Number(item.variationId || 0),
            quantity: Number(item.quantity),
            title: item.name,
            slug: item.slug,
            sku: item.sku,
            imageUrl: item.images?.[0]?.src,
            variantTitle: item.variantLabel,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) return false;
      lastCheckoutSignatureRef.current = signature;
      return true;
    } catch {
      return false;
    }
  }, [cartId, cartItems, currency, identifyCartContact]);

  const checkout = useCallback(() => {
    if (typeof window === "undefined") return;
    if (cartItems.length === 0) {
      setIsCartOpen(true);
      return;
    }
    trackMetaEvent(
      "InitiateCheckout",
      metaCartData(cartItems, currency),
      {
        dedupeKey: `lab_meta_checkout:${cartId}:${cartItems
          .map((item) => `${getCartKey(item)}:${item.quantity}`)
          .join("|")}`,
      },
    );
    setIsCartOpen(false);
    window.location.assign("/checkout");
  }, [cartId, cartItems, currency]);

  const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + Number(item.price || 0) * item.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    cartId,
    cartContactEmail,
    cartReady,
    cartPricing,
    cartPricingError,
    cartCurrency: currency,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    identifyCartContact,
    markCheckoutStarted,
    checkout,
    refreshCartPrices,
    cartTotal,
    cartCount,
  }), [cartItems, cartId, cartContactEmail, cartReady, cartPricing, cartPricingError, currency, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, identifyCartContact, markCheckoutStarted, checkout, refreshCartPrices, cartTotal, cartCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
