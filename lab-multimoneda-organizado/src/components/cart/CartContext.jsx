import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCurrency } from "../../currency/CurrencyContext.jsx";

const CartContext = createContext(null);

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

export function CartProvider({ children }) {
  const { currency } = useCurrency();
  const [cartItems, setCartItems] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartPricing, setCartPricing] = useState(false);
  const [cartPricingError, setCartPricingError] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const quoteRequestRef = useRef(0);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("lab_cart");
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      const normalizedCart = Array.isArray(parsedCart) ? parsedCart.map((item) => normalizeCartItem(item)).filter(Boolean) : [];
      setCartItems(normalizedCart);
    } catch (error) {
      console.error("Failed to parse cart:", error);
      setCartItems([]);
    } finally {
      setCartReady(true);
    }
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem("lab_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [cartItems, cartReady]);

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
    setCartItems((prevItems) => prevItems.filter((item) => getCartKey(item) !== String(cartKey)));
  }, []);

  const updateQuantity = useCallback((cartKey, amount) => {
    setCartItems((prevItems) => prevItems.map((item) => {
      if (getCartKey(item) !== String(cartKey)) return item;
      const newQty = Math.min(20, item.quantity + amount);
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (typeof window !== "undefined") localStorage.removeItem("lab_cart");
  }, []);

  const checkout = useCallback(() => {
    if (typeof window === "undefined") return;
    if (cartItems.length === 0) {
      setIsCartOpen(true);
      return;
    }
    setIsCartOpen(false);
    window.location.assign("/checkout");
  }, [cartItems.length]);

  const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + Number(item.price || 0) * item.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  const value = useMemo(() => ({
    cartItems,
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
    checkout,
    refreshCartPrices,
    cartTotal,
    cartCount,
  }), [cartItems, cartReady, cartPricing, cartPricingError, currency, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, checkout, refreshCartPrices, cartTotal, cartCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
}
