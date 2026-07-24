import { createHmac, timingSafeEqual } from "node:crypto";
import { cleanText, quoteMultiCurrencyCart, wooRequest } from "./boldPayments.js";

const API_VERSION = "2026-03-15";
const CARTS_URL = "https://api.omnisend.com/v3/carts";
const EVENTS_URL = "https://api.omnisend.com/api/events";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CART_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{15,79}$/;
const RECOVERY_TTL_SECONDS = 14 * 24 * 60 * 60;

const getApiKey = () => String(import.meta.env.OMNISEND_API_KEY || "").trim();
const getRecoverySecret = () =>
  String(import.meta.env.OMNISEND_RECOVERY_SECRET || import.meta.env.BOLD_SECRET_KEY || "").trim();

export const normalizeCartEmail = (value) => {
  const email = cleanText(value, 160).toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : "";
};

export const normalizeCartId = (value) => {
  const cartId = cleanText(value, 80);
  return CART_ID_PATTERN.test(cartId) ? cartId : "";
};

const normalizeCurrency = (value) => {
  const currency = cleanText(value, 3).toUpperCase();
  return ["USD", "COP", "MXN"].includes(currency) ? currency : "";
};

const normalizeLine = (line) => {
  const productId = Number(line?.productId || line?.id || 0);
  const variationId = Number(line?.variationId || 0);
  const quantity = Number(line?.quantity || 0);
  if (
    !Number.isSafeInteger(productId) || productId <= 0 ||
    !Number.isSafeInteger(variationId) || variationId < 0 ||
    !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20
  ) return null;

  return {
    productId,
    variationId,
    quantity,
    title: cleanText(line?.title || line?.name, 180),
    slug: cleanText(line?.slug, 180),
    sku: cleanText(line?.sku, 100),
    imageUrl: cleanText(line?.imageUrl || line?.images?.[0]?.src, 1_000),
    variantTitle: cleanText(line?.variantTitle || line?.variantLabel, 140),
  };
};

export const normalizeCartLines = (items, { allowEmpty = false } = {}) => {
  if (!Array.isArray(items) || items.length > 20 || (!allowEmpty && items.length < 1)) return null;
  const lines = items.map(normalizeLine);
  if (lines.some((line) => !line)) return null;
  const unique = new Set(lines.map((line) => `${line.productId}:${line.variationId}`));
  return unique.size === lines.length ? lines : null;
};

const absoluteHttpUrl = (value, origin) => {
  if (!value) return "";
  try {
    const url = new URL(value, origin);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
};

export const resolveMarketingOrigin = (request) => {
  const configured = cleanText(import.meta.env.SITE_URL, 300);
  return new URL(configured || new URL(request.url).origin).origin;
};

const signatureFor = (encoded, secret) =>
  createHmac("sha256", secret).update(encoded, "utf8").digest("base64url");

export const createCartRecoveryToken = ({ cartId, currency, lines }) => {
  const secret = getRecoverySecret();
  if (!secret) {
    const error = new Error("Cart recovery signing is not configured");
    error.code = "RECOVERY_NOT_CONFIGURED";
    throw error;
  }

  const payload = {
    v: 1,
    exp: Math.floor(Date.now() / 1_000) + RECOVERY_TTL_SECONDS,
    id: normalizeCartId(cartId),
    c: normalizeCurrency(currency),
    i: lines.map((line) => ({ p: line.productId, v: line.variationId, q: line.quantity })),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signatureFor(encoded, secret)}`;
};

export const verifyCartRecoveryToken = (token) => {
  const secret = getRecoverySecret();
  const [encoded, receivedSignature, ...extra] = String(token || "").split(".");
  if (!secret || !encoded || !receivedSignature || extra.length) return null;

  const expected = Buffer.from(signatureFor(encoded, secret), "utf8");
  const received = Buffer.from(receivedSignature, "utf8");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (payload?.v !== 1 || !Number.isFinite(payload?.exp) || payload.exp < Date.now() / 1_000) return null;
    const cartId = normalizeCartId(payload.id);
    const currency = normalizeCurrency(payload.c);
    const lines = normalizeCartLines(payload.i?.map((line) => ({
      productId: line?.p,
      variationId: line?.v,
      quantity: line?.q,
    })));
    return cartId && currency && lines ? { cartId, currency, lines } : null;
  } catch {
    return null;
  }
};

const omnisendHeaders = () => {
  const key = getApiKey();
  if (!key) {
    const error = new Error("Omnisend is not configured");
    error.code = "OMNISEND_NOT_CONFIGURED";
    throw error;
  }
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Omnisend-API-Key ${key}`,
    "X-API-KEY": key,
  };
};

const providerError = async (response) => {
  const error = new Error(`Omnisend request failed with ${response.status}`);
  error.code = "OMNISEND_REQUEST_FAILED";
  error.status = response.status;
  error.details = (await response.text().catch(() => "")).slice(0, 600);
  return error;
};

export const priceCartLines = async ({ currency, lines }) => {
  const quote = await quoteMultiCurrencyCart({ currency, items: lines });
  return lines.map((line) => {
    const priced = quote.lines.find((candidate) =>
      Number(candidate.product_id) === line.productId &&
      Number(candidate.variation_id || 0) === line.variationId
    );
    const unitPrice = Number(priced?.unit_price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      const error = new Error("Cart product price is unavailable");
      error.code = "CURRENCY_PRICE_MISSING";
      throw error;
    }
    return { ...line, unitPrice };
  });
};

const eventLine = (line, origin) => {
  const imageUrl = absoluteHttpUrl(line.imageUrl, origin);
  const result = {
    productID: String(line.productId),
    productVariantID: String(line.variationId || line.productId),
    productTitle: line.title || `LAB_CORE product ${line.productId}`,
    productQuantity: line.quantity,
    productPrice: line.unitPrice,
    productURL: line.slug
      ? absoluteHttpUrl(`/products/${encodeURIComponent(line.slug)}`, origin)
      : absoluteHttpUrl("/shop", origin),
  };
  if (line.sku) result.productSKU = line.sku;
  if (imageUrl) {
    result.productImageURL = imageUrl;
    result.productVariantImageURL = imageUrl;
  }
  if (line.variantTitle) result.productVariantTitle = line.variantTitle;
  return result;
};

export const createCartEventProperties = ({ cartId, currency, lines, recoveryUrl, origin }) => ({
  abandonedCheckoutURL: recoveryUrl,
  cartID: cartId,
  currency,
  lineItems: lines.map((line) => eventLine(line, origin)),
  value: Number(lines.reduce((total, line) => total + line.unitPrice * line.quantity, 0).toFixed(2)),
});

export async function sendOmnisendEvent({ eventName, email, properties, eventVersion = "" }) {
  const normalizedEmail = normalizeCartEmail(email);
  if (!normalizedEmail) return false;
  const response = await fetch(EVENTS_URL, {
    method: "POST",
    signal: AbortSignal.timeout(8_000),
    headers: { ...omnisendHeaders(), "Omnisend-Version": API_VERSION },
    body: JSON.stringify({
      eventName,
      eventVersion,
      origin: "api",
      contact: { email: normalizedEmail },
      properties,
    }),
  });
  if (!response.ok) throw await providerError(response);
  return true;
}

export async function upsertOmnisendCart({ cartId, email, currency, lines, recoveryUrl, origin }) {
  const products = lines.map((line) => {
    const imageUrl = absoluteHttpUrl(line.imageUrl, origin);
    const product = {
      cartProductID: `${line.productId}:${line.variationId || "base"}`,
      productID: String(line.productId),
      variantID: String(line.variationId || line.productId),
      title: line.title || `LAB_CORE product ${line.productId}`,
      quantity: line.quantity,
      price: Math.max(0, Math.round(line.unitPrice * 100)),
      productUrl: line.slug
        ? absoluteHttpUrl(`/products/${encodeURIComponent(line.slug)}`, origin)
        : absoluteHttpUrl("/shop", origin),
    };
    if (line.sku) product.sku = line.sku;
    if (imageUrl) product.imageUrl = imageUrl;
    return product;
  });
  const cart = {
    currency,
    cartSum: products.reduce((total, product) => total + product.price * product.quantity, 0),
    cartRecoveryUrl: recoveryUrl,
    products,
  };
  const headers = omnisendHeaders();
  const cartUrl = `${CARTS_URL}/${encodeURIComponent(cartId)}`;
  let response = await fetch(cartUrl, {
    method: "GET",
    signal: AbortSignal.timeout(8_000),
    headers,
  });
  if (response.status === 404) {
    response = await fetch(CARTS_URL, {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers,
      body: JSON.stringify({ ...cart, cartID: cartId, email, createdAt: new Date().toISOString() }),
    });
  } else if (response.ok) {
    const existing = await response.json().catch(() => ({}));
    const existingProducts = Array.isArray(existing?.products)
      ? existing.products
      : Array.isArray(existing?.cart?.products)
        ? existing.cart.products
        : [];
    const nextProductIds = new Set(products.map((product) => product.cartProductID));
    const removedProductIds = existingProducts
      .map((product) => cleanText(product?.cartProductID, 180))
      .filter((productId) => productId && !nextProductIds.has(productId));
    await Promise.all(removedProductIds.map(async (productId) => {
      const removed = await fetch(
        `${cartUrl}/products/${encodeURIComponent(productId)}`,
        { method: "DELETE", signal: AbortSignal.timeout(8_000), headers },
      );
      if (![204, 404].includes(removed.status)) throw await providerError(removed);
    }));
    response = await fetch(cartUrl, {
      method: "PATCH",
      signal: AbortSignal.timeout(8_000),
      headers,
      body: JSON.stringify(cart),
    });
  }
  if (!response.ok) throw await providerError(response);
  return true;
}

export async function deleteOmnisendCart(cartId) {
  const normalizedId = normalizeCartId(cartId);
  if (!normalizedId) return false;
  const response = await fetch(`${CARTS_URL}/${encodeURIComponent(normalizedId)}`, {
    method: "DELETE",
    signal: AbortSignal.timeout(8_000),
    headers: omnisendHeaders(),
  });
  if (response.status === 404) return true;
  if (!response.ok) throw await providerError(response);
  return true;
}

export async function restoreCartFromToken(token) {
  const recovery = verifyCartRecoveryToken(token);
  if (!recovery) {
    const error = new Error("Invalid or expired cart recovery link");
    error.code = "INVALID_RECOVERY_LINK";
    error.status = 410;
    throw error;
  }

  const pricedLines = await priceCartLines(recovery);
  const productIds = [...new Set(pricedLines.map((line) => line.productId))];
  const products = await wooRequest(`/products?include=${encodeURIComponent(productIds.join(","))}&per_page=100`);
  const byId = new Map((Array.isArray(products) ? products : []).map((product) => [Number(product.id), product]));
  const variations = await Promise.all(pricedLines.filter((line) => line.variationId > 0).map(async (line) => {
    try {
      return [
        `${line.productId}:${line.variationId}`,
        await wooRequest(`/products/${line.productId}/variations/${line.variationId}`),
      ];
    } catch {
      return [`${line.productId}:${line.variationId}`, null];
    }
  }));
  const variationById = new Map(variations);

  return {
    cartId: recovery.cartId,
    currency: recovery.currency,
    items: pricedLines.map((line) => {
      const product = byId.get(line.productId) || {};
      const variation = variationById.get(`${line.productId}:${line.variationId}`);
      const variantLabel = Array.isArray(variation?.attributes)
        ? variation.attributes.map((attribute) => attribute?.option).filter(Boolean).join(" / ")
        : "";
      const image = variation?.image?.src || product?.images?.[0]?.src || "";
      return {
        id: line.productId,
        variationId: line.variationId || null,
        cartKey: `${line.productId}:${line.variationId || "base"}`,
        quantity: line.quantity,
        price: line.unitPrice,
        currency: recovery.currency,
        priceMap: {},
        name: cleanText(product?.name, 180) || `LAB_CORE product ${line.productId}`,
        slug: cleanText(product?.slug, 180),
        sku: cleanText(variation?.sku || product?.sku, 100),
        variantLabel,
        stock_status: variation?.stock_status || product?.stock_status || "instock",
        images: image ? [{ src: image }] : [],
      };
    }),
  };
}

const orderMeta = (order, key) =>
  order?.meta_data?.find((item) => item?.key === key)?.value;

export async function completeOmnisendOrder({ order, request }) {
  if (!order || orderMeta(order, "_lab_omnisend_order_sent")) return false;
  const email = normalizeCartEmail(order?.billing?.email);
  if (!email) return false;

  const origin = resolveMarketingOrigin(request);
  const cartId = normalizeCartId(orderMeta(order, "_lab_omnisend_cart_id"));
  const lineItems = (Array.isArray(order?.line_items) ? order.line_items : []).map((line) => {
    const imageUrl = absoluteHttpUrl(line?.image?.src, origin);
    const item = {
      productID: String(line?.product_id || line?.id || ""),
      productVariantID: String(line?.variation_id || line?.product_id || line?.id || ""),
      productTitle: cleanText(line?.name, 180) || "LAB_CORE product",
      productQuantity: Math.max(1, Number(line?.quantity || 1)),
      productPrice: Number(line?.price || 0),
      productURL: absoluteHttpUrl("/shop", origin),
    };
    if (line?.sku) item.productSKU = cleanText(line.sku, 100);
    if (imageUrl) {
      item.productImageURL = imageUrl;
      item.productVariantImageURL = imageUrl;
    }
    return item;
  });
  const address = (source = {}) => ({
    firstName: cleanText(source.first_name, 80),
    lastName: cleanText(source.last_name, 80),
    address1: cleanText(source.address_1, 180),
    address2: cleanText(source.address_2, 100),
    city: cleanText(source.city, 100),
    state: cleanText(source.state, 100),
    stateCode: cleanText(source.state, 20),
    zip: cleanText(source.postcode, 20),
    country: cleanText(source.country, 80),
    phone: cleanText(source.phone, 30),
  });
  const totalPrice = Number(order?.total || 0);
  const totalDiscount = Number(order?.discount_total || 0);

  await sendOmnisendEvent({
    eventName: "placed order",
    eventVersion: "v2",
    email,
    properties: {
      billingAddress: address(order?.billing),
      shippingAddress: address({ ...order?.shipping, phone: order?.billing?.phone }),
      createdAt: order?.date_created_gmt || order?.date_created || new Date().toISOString(),
      currency: normalizeCurrency(order?.currency) || "USD",
      discounts: (Array.isArray(order?.coupon_lines) ? order.coupon_lines : []).map((coupon) => ({
        amount: Number(coupon?.discount || 0),
        code: cleanText(coupon?.code, 80),
        type: "coupon",
      })),
      fulfillmentStatus: "unfulfilled",
      lineItems,
      note: cleanText(order?.customer_note, 500),
      orderID: String(order?.id || ""),
      orderNumber: String(order?.number || order?.id || ""),
      orderStatusURL: absoluteHttpUrl("/cuenta", origin),
      paymentMethod: cleanText(order?.payment_method_title || "Bold", 80),
      paymentStatus: "paid",
      shippingPrice: Number(order?.shipping_total || 0),
      subTotalPrice: Number((totalPrice + totalDiscount).toFixed(2)),
      subTotalTaxIncluded: true,
      totalDiscount,
      totalPrice,
      totalTax: Number(order?.total_tax || 0),
      tags: ["paid", "bold"],
    },
  });

  if (cartId) {
    try {
      await deleteOmnisendCart(cartId);
    } catch (error) {
      // The placed-order event already exits recovery workflows.
      console.error("Omnisend paid cart cleanup failed:", error?.details || error?.message);
    }
  }
  await wooRequest(`/orders/${order.id}`, {
    method: "PUT",
    body: {
      meta_data: [
        { key: "_lab_omnisend_order_sent", value: new Date().toISOString() },
      ],
    },
  });
  return true;
}
