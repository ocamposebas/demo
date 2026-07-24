import {
  cleanText,
  createBoldReference,
  createIntegritySignature,
  getAuthenticatedCustomerId,
  getBoldConfig,
  isAllowedRequestOrigin,
  paymentJson,
  quoteMultiCurrencyCart,
  resolveSiteOrigin,
  wooRequest,
} from "../../../../lib/boldPayments.js";
import {
  createCartEventProperties,
  createCartRecoveryToken,
  normalizeCartId,
  resolveMarketingOrigin,
  sendOmnisendEvent,
} from "../../../../lib/omnisend.js";

export const prerender = false;

const LEGAL_VERSION = "2026.07.20";
const MAX_BODY_BYTES = 60_000;
const MAX_LINES = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_COOKIE = "lab_core_session";
const wordpressRoot = () => String(import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL || "").trim().replace(/\/+$/, "").replace(/\/wp-json(?:\/.*)?$/i, "");
const readCookie = (request, name) => {
  const part = (request.headers.get("cookie") || "").split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  if (!part) return "";
  try { return decodeURIComponent(part.slice(name.length + 1)); } catch { return ""; }
};
const rewardsRequest = async (request, path, body) => {
  const token = readCookie(request, ACCOUNT_COOKIE);
  const root = wordpressRoot();
  if (!token || !root) { const error = new Error("Rewards account required"); error.code = "REWARDS_LOGIN_REQUIRED"; throw error; }
  const response = await fetch(`${root}/wp-json/lab-core/v1/rewards/${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8_000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result?.ok === false) { const error = new Error(result?.message || "Rewards request failed"); error.code = result?.code || "REWARDS_UNAVAILABLE"; throw error; }
  return result;
};
const normalizeCouponCode = (value) =>
  cleanText(value, 48)
    .replace(/\s+/g, "")
    .toUpperCase();

const couponFailureCode = (code, message = "") => {
  const source = `${cleanText(code, 120)} ${cleanText(message, 300)}`.toLowerCase();

  if (source.includes("expired") || source.includes("expirado")) {
    return "COUPON_EXPIRED";
  }

  if (
    source.includes("usage_limit") ||
    source.includes("usage limit") ||
    source.includes("límite de uso") ||
    source.includes("limite de uso") ||
    source.includes("already been used") ||
    source.includes("ya fue utilizado")
  ) {
    return "COUPON_USAGE_LIMIT_REACHED";
  }

  return "COUPON_INVALID";
};

const reject = (code, status = 400) => paymentJson({ ok: false, code }, status);

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
    imageUrl: cleanText(line?.imageUrl, 1_000),
    variantTitle: cleanText(line?.variantTitle, 140),
  };
};

const normalizeCustomer = (payload) => {
  const customer = {
    firstName: cleanText(payload?.firstName, 80),
    lastName: cleanText(payload?.lastName, 80),
    email: cleanText(payload?.email, 160).toLowerCase(),
    phone: cleanText(payload?.phone, 30),
    country: cleanText(payload?.country, 2).toUpperCase(),
    address: cleanText(payload?.address, 180),
    addressExtra: cleanText(payload?.addressExtra, 100),
    city: cleanText(payload?.city, 100),
    region: cleanText(payload?.region, 100),
    postalCode: cleanText(payload?.postalCode, 20),
    notes: cleanText(payload?.notes, 500),
  };

  if (
    customer.firstName.length < 2 ||
    customer.lastName.length < 2 ||
    !EMAIL_PATTERN.test(customer.email) ||
    customer.phone.length < 5 ||
    !/^[A-Z]{2}$/.test(customer.country) ||
    customer.address.length < 4 ||
    customer.city.length < 2 ||
    customer.region.length < 2 ||
    customer.postalCode.length < 2
  ) return null;

  return customer;
};

const dialCodeForCountry = (country) => ({ CO: "+57", MX: "+52", US: "+1" })[country] || "";

export async function POST({ request }) {
  if (!isAllowedRequestOrigin(request)) return reject("ORIGIN_NOT_ALLOWED", 403);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return reject("PAYLOAD_TOO_LARGE", 413);

  const bold = getBoldConfig();
  if (!bold.ready) return reject("BOLD_NOT_CONFIGURED", 503);

  let siteOrigin;
  try {
    siteOrigin = resolveSiteOrigin(request);
  } catch (error) {
    return reject(error.code || "INVALID_SITE_URL", 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return reject("INVALID_JSON");
  }

  const selectedCurrency = cleanText(payload?.currency, 3).toUpperCase();
  if (!bold.supportedCurrencies.includes(selectedCurrency)) {
    return reject(selectedCurrency === "MXN" ? "MXN_PAYMENT_NOT_SUPPORTED" : "INVALID_CURRENCY", 422);
  }

  if (payload?.acceptedLegal !== true || cleanText(payload?.legalVersion, 30) !== LEGAL_VERSION) {
    return reject("LEGAL_ACCEPTANCE_REQUIRED", 422);
  }

  const customer = normalizeCustomer(payload?.customer);
  if (!customer) return reject("INVALID_CUSTOMER_DATA", 422);
  const omnisendCartId = normalizeCartId(payload?.cartId);

  let couponCode = normalizeCouponCode(payload?.couponCode);

  if (!Array.isArray(payload?.items) || payload.items.length < 1 || payload.items.length > MAX_LINES) {
    return reject("INVALID_CART", 422);
  }

  const lines = payload.items.map(normalizeLine);
  if (lines.some((line) => !line)) return reject("INVALID_CART", 422);

  const uniqueKeys = new Set(lines.map((line) => `${line.productId}:${line.variationId}`));
  if (uniqueKeys.size !== lines.length) return reject("DUPLICATE_CART_LINE", 422);

  let quote;
  let pricedLines;
  try {
    quote = await quoteMultiCurrencyCart({ currency: selectedCurrency, items: lines });
    pricedLines = lines.map((line) => {
      const quoted = quote.lines.find((item) =>
        Number(item.product_id) === line.productId &&
        Number(item.variation_id || 0) === line.variationId
      );
      if (!quoted || !Number.isFinite(Number(quoted.unit_price)) || Number(quoted.unit_price) <= 0) {
        const error = new Error("Currency price missing");
        error.code = "CURRENCY_PRICE_MISSING";
        throw error;
      }
      return {
        ...line,
        unitPrice: Number(quoted.unit_price),
        lineTotal: Number(quoted.line_total),
      };
    });
  } catch (error) {
    console.error("Bold checkout multi-currency validation failed:", error.code || error.message);
    const status = error.status === 409 ? 409 : error.status === 422 ? 422 : 502;
    return reject(error.code || "CATALOG_VALIDATION_FAILED", status);
  }

  const customerId = await getAuthenticatedCustomerId(request);
  const requestedRewardPoints = Math.max(0, Number.parseInt(payload?.rewardPoints || 0, 10) || 0);
  let reward = null;
  if (requestedRewardPoints > 0 && !customerId) return reject("REWARDS_LOGIN_REQUIRED", 401);
  if (customerId) {
    try {
      reward = await rewardsRequest(request, "quote", {
        currency: selectedCurrency,
        subtotal: pricedLines.reduce((sum, line) => sum + line.lineTotal, 0),
        points: requestedRewardPoints,
      });
    } catch (error) {
      if (requestedRewardPoints > 0) return reject(error.code || "REWARDS_UNAVAILABLE", error.code === "REWARD_POINTS_UNAVAILABLE" ? 422 : 502);
      reward = null;
    }
  }
  const billing = {
    first_name: customer.firstName,
    last_name: customer.lastName,
    address_1: customer.address,
    address_2: customer.addressExtra,
    city: customer.city,
    state: customer.region,
    postcode: customer.postalCode,
    country: customer.country,
    email: customer.email,
    phone: customer.phone,
  };
  const shipping = {
    first_name: customer.firstName,
    last_name: customer.lastName,
    address_1: customer.address,
    address_2: customer.addressExtra,
    city: customer.city,
    state: customer.region,
    postcode: customer.postalCode,
    country: customer.country,
  };

  let order;
  try {
    order = await wooRequest("/orders", {
      method: "POST",
      body: {
        status: "pending",
        currency: selectedCurrency,
        customer_id: customerId,
        payment_method: "bold_embedded",
        payment_method_title: "Bold Embedded Checkout",
        billing,
        shipping,
        customer_note: customer.notes,
        line_items: pricedLines.map((line) => ({
          product_id: line.productId,
          variation_id: line.variationId || undefined,
          quantity: line.quantity,
          subtotal: String(line.lineTotal),
          total: String(line.lineTotal),
        })),
        coupon_lines: couponCode ? [{ code: couponCode }] : [],
        fee_lines: reward?.discount > 0 ? [{ name: `LAB Points (${reward.points})`, total: String(-Number(reward.discount)), tax_status: "none" }] : [],
        meta_data: [
          { key: "_lab_legal_version", value: LEGAL_VERSION },
          { key: "_lab_research_agreement", value: "accepted" },
          { key: "_lab_checkout_language", value: cleanText(payload?.language, 2) === "en" ? "en" : "es" },
          { key: "_lab_checkout_currency", value: selectedCurrency },
          { key: "_lab_coupon_code", value: couponCode },
          { key: "_bold_payment_status", value: "CREATED" },
          ...(omnisendCartId ? [{ key: "_lab_omnisend_cart_id", value: omnisendCartId }] : []),
          { key: "_lab_reward_points_redeemed", value: reward?.points || 0 },
          { key: "_lab_reward_discount", value: reward?.discount || 0 },
          { key: "_lab_reward_market_rate", value: reward?.rate || (selectedCurrency === "USD" ? 1 : 0) },
        ],
      },
      headers: { "X-Labcore-Currency": selectedCurrency },
    });
  } catch (error) {
    if (reward?.reservation) rewardsRequest(request, "release", { reservation: reward.reservation }).catch(() => {});
    console.error("Bold checkout order creation failed:", error.code || error.message);

    const isCouponFailure = couponCode && (
      String(error?.code || "").toLowerCase().includes("coupon") ||
      String(error?.details || "").toLowerCase().includes("coupon") ||
      String(error?.details || "").toLowerCase().includes("cupón")
    );

    if (isCouponFailure) {
      return reject(couponFailureCode(error?.code, error?.details), 422);
    }

    return reject(error.code || "ORDER_CREATION_FAILED", error.status === 400 ? 422 : 502);
  }

  if (reward?.reservation) {
    try {
      await rewardsRequest(request, "attach", { reservation: reward.reservation, order_id: order.id });
    } catch (error) {
      try { await wooRequest(`/orders/${order.id}`, { method: "PUT", body: { status: "cancelled", meta_data: [{ key: "_lab_reward_error", value: error.code || "ATTACH_FAILED" }] } }); } catch {}
      await rewardsRequest(request, "release", { reservation: reward.reservation }).catch(() => {});
      return reject("REWARD_RESERVATION_FAILED", 502);
    }
  }

  const total = Number(order?.total || 0);
  const currency = cleanText(order?.currency || selectedCurrency, 3).toUpperCase();
  const cancelOrder = async (reason) => {
    try {
      await wooRequest(`/orders/${order.id}`, {
        method: "PUT",
        body: {
          status: "cancelled",
          meta_data: [{ key: "_bold_configuration_error", value: reason }],
        },
      });
    } catch {}
  };

  if (couponCode) {
    const returnedCoupon = Array.isArray(order?.coupon_lines)
      ? order.coupon_lines.find(
          (item) => normalizeCouponCode(item?.code) === couponCode,
        )
      : null;

    if (!returnedCoupon) {
      await cancelOrder("COUPON_NOT_APPLIED");
      return reject("COUPON_INVALID", 422);
    }
  }

  if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(total)) {
    await cancelOrder("BOLD_AMOUNT_MUST_BE_INTEGER");
    return reject("BOLD_AMOUNT_MUST_BE_INTEGER", 422);
  }
  if (!bold.supportedCurrencies.includes(currency) || currency !== selectedCurrency) {
    await cancelOrder("BOLD_CURRENCY_MISMATCH");
    return reject("BOLD_CURRENCY_MISMATCH", 422);
  }
  if (currency === "COP" && total < 1000) {
    await cancelOrder("BOLD_MINIMUM_AMOUNT");
    return reject("BOLD_MINIMUM_AMOUNT", 422);
  }

  const amount = String(total);
  const reference = createBoldReference(order.id);
  const integritySignature = createIntegritySignature({
    reference,
    amount,
    currency,
    secretKey: bold.secretKey,
  });

  const redirectionUrl = new URL("/checkout/result", siteOrigin).toString();
  const originUrl = new URL("/checkout", siteOrigin).toString();
  const fullName = `${customer.firstName} ${customer.lastName}`.trim();
  const customerData = {
    email: customer.email,
    fullName,
    phone: customer.phone,
  };
  const dialCode = dialCodeForCountry(customer.country);
  if (dialCode) customerData.dialCode = dialCode;

  const billingAddress = {
    address: [customer.address, customer.addressExtra].filter(Boolean).join(", "),
    zipCode: customer.postalCode,
    city: customer.city,
    state: customer.region,
    country: customer.country,
  };

  try {
    await wooRequest(`/orders/${order.id}`, {
      method: "PUT",
      body: {
        meta_data: [
          { key: "_bold_order_id", value: reference },
          { key: "_bold_payment_status", value: "PENDING" },
          { key: "_bold_environment", value: bold.environment },
        ],
      },
    });
  } catch (error) {
    console.error("Bold checkout order reference update failed:", error.code || error.message);
    return reject("ORDER_UPDATE_FAILED", 502);
  }

  const checkout = {
    orderId: reference,
    currency,
    amount,
    apiKey: bold.apiKey,
    integritySignature,
    description: `LAB_CORE order ${order.number || order.id} - ${lines.length} research item${lines.length === 1 ? "" : "s"}`.slice(0, 100),
    redirectionUrl,
    expirationDate: String(BigInt(Date.now() + 24 * 60 * 60 * 1000) * 1_000_000n),
    renderMode: "embedded",
    customerData: JSON.stringify(customerData),
    billingAddress: JSON.stringify(billingAddress),
    extraData1: `WOO-${order.id}`,
    extraData2: `LEGAL-${LEGAL_VERSION}`,
  };

  // Bold requires originUrl to use HTTPS. Its documented localhost exception
  // applies to redirectionUrl, so omit this optional field during local work.
  if (new URL(siteOrigin).protocol === "https:") checkout.originUrl = originUrl;

  if (omnisendCartId) {
    try {
      const marketingOrigin = resolveMarketingOrigin(request);
      const token = createCartRecoveryToken({
        cartId: omnisendCartId,
        currency,
        lines: pricedLines,
      });
      const recoveryUrl = new URL("/checkout", marketingOrigin);
      recoveryUrl.searchParams.set("recover", token);
      await sendOmnisendEvent({
        eventName: "started checkout",
        email: customer.email,
        properties: createCartEventProperties({
          cartId: omnisendCartId,
          currency,
          lines: pricedLines,
          recoveryUrl: recoveryUrl.toString(),
          origin: marketingOrigin,
        }),
      });
    } catch (error) {
      // Marketing must never prevent a valid payment session from opening.
      console.error("Omnisend started-checkout event failed:", error?.details || error?.message);
    }
  }

  return paymentJson({
    ok: true,
    environment: bold.environment,
    order: {
      id: order.id,
      number: String(order.number || order.id),
      reference,
      amount,
      currency,
      couponCode: couponCode || null,
      discount: String(order?.discount_total || "0"),
      rewardPoints: reward?.points || 0,
      rewardDiscount: reward?.discount || 0,
    },
    checkout,
  });
}

export function ALL() {
  return paymentJson({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
