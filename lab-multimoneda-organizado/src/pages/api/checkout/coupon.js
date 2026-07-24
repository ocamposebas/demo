export const prerender = false;

const WORDPRESS_URL = String(
  import.meta.env.WORDPRESS_API_URL ||
    import.meta.env.WOOCOMMERCE_URL ||
    import.meta.env.PUBLIC_WOOCOMMERCE_URL ||
    "",
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/wp-json(?:\/.*)?$/i, "");

const MAX_BODY_BYTES = 60_000;
const MAX_LINES = 20;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cleanText(value, maxLength = 180) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeCouponCode(value) {
  return cleanText(value, 48).replace(/\s+/g, "").toUpperCase();
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_LINES) return [];

  const normalized = items.map((item) => {
    const productId = Number(item?.productId || item?.id || 0);
    const variationId = Number(item?.variationId || 0);
    const quantity = Number(item?.quantity || 0);

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      !Number.isSafeInteger(variationId) ||
      variationId < 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    ) {
      return null;
    }

    return { productId, variationId, quantity };
  });

  if (normalized.some((item) => !item)) return [];

  const keys = new Set(normalized.map((item) => `${item.productId}:${item.variationId}`));
  return keys.size === normalized.length ? normalized : [];
}

function moneyFromMinorUnits(value, minorUnit = 2) {
  const raw = Number(value || 0);
  const decimals = Number.isSafeInteger(Number(minorUnit))
    ? Math.max(0, Math.min(6, Number(minorUnit)))
    : 2;

  if (!Number.isFinite(raw)) return 0;
  return raw / 10 ** decimals;
}

function friendlyCouponMessage(error, language = "es") {
  const source = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  const spanish = language !== "en";

  if (source.includes("expired") || source.includes("expir")) {
    return spanish ? "Este cupón ya venció." : "This coupon has expired.";
  }

  if (source.includes("minimum") || source.includes("minimum_spend")) {
    return spanish
      ? "El carrito todavía no alcanza el valor mínimo requerido por este cupón."
      : "The cart has not reached this coupon's minimum spend.";
  }

  if (source.includes("maximum") || source.includes("maximum_spend")) {
    return spanish
      ? "El total del carrito supera el máximo permitido por este cupón."
      : "The cart exceeds this coupon's maximum spend.";
  }

  if (
    source.includes("usage") ||
    source.includes("limit") ||
    source.includes("already used") ||
    source.includes("used_by")
  ) {
    return spanish
      ? "Este cupón alcanzó su límite de uso o ya fue utilizado por esta cuenta."
      : "This coupon reached its usage limit or was already used by this account.";
  }

  if (source.includes("email")) {
    return spanish
      ? "Este cupón no está disponible para el correo ingresado."
      : "This coupon is not available for the entered email.";
  }

  if (
    source.includes("not applicable") ||
    source.includes("not_valid") ||
    source.includes("invalid_product") ||
    source.includes("excluded") ||
    source.includes("sale item")
  ) {
    return spanish
      ? "Este cupón no aplica a los productos actuales del carrito."
      : "This coupon does not apply to the current cart items.";
  }

  if (source.includes("does not exist") || source.includes("not exist") || source.includes("invalid coupon")) {
    return spanish ? "El código de cupón no existe." : "The coupon code does not exist.";
  }

  return cleanText(error?.message, 240) ||
    (spanish
      ? "WooCommerce rechazó este cupón para el carrito actual."
      : "WooCommerce rejected this coupon for the current cart.");
}

async function storeRequest(path, {
  method = "GET",
  body,
  cartToken = "",
  currency = "",
  timeout = 10_000,
} = {}) {
  const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/store/v1${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "LAB_CORE Native WooCommerce Coupon Validation",
      ...(cartToken ? { "Cart-Token": cartToken } : {}),
      ...(currency ? { "X-Labcore-Currency": currency } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });

  const payload = await response.json().catch(() => ({}));
  const nextCartToken = response.headers.get("Cart-Token") || cartToken;

  if (!response.ok) {
    const error = new Error(payload?.message || `WooCommerce Store API failed with ${response.status}`);
    error.code = payload?.code || "WOOCOMMERCE_STORE_API_ERROR";
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return { payload, cartToken: nextCartToken };
}

export async function POST({ request }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ valid: false, code: "ORIGIN_NOT_ALLOWED", message: "Origen no permitido." }, 403);
  }

  if (!WORDPRESS_URL) {
    return json(
      {
        valid: false,
        code: "WORDPRESS_NOT_CONFIGURED",
        message: "WordPress no está configurado en el servidor.",
      },
      503,
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ valid: false, code: "PAYLOAD_TOO_LARGE", message: "Solicitud demasiado grande." }, 413);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, code: "INVALID_JSON", message: "La solicitud no es válida." }, 400);
  }

  const language = cleanText(body?.language, 2) === "en" ? "en" : "es";
  const code = normalizeCouponCode(body?.code);
  const currency = cleanText(body?.currency, 3).toUpperCase();
  const email = cleanText(body?.email, 160).toLowerCase();
  const items = normalizeItems(body?.items);

  if (!code) {
    return json(
      {
        valid: false,
        code: "COUPON_REQUIRED",
        message: language === "es" ? "Escribe un código de cupón." : "Enter a coupon code.",
      },
      400,
    );
  }

  if (!items.length) {
    return json(
      {
        valid: false,
        code: "INVALID_CART",
        message: language === "es" ? "El carrito no es válido." : "The cart is invalid.",
      },
      422,
    );
  }

  if (currency && !["USD", "COP", "MXN"].includes(currency)) {
    return json({ valid: false, code: "INVALID_CURRENCY", message: "Moneda no válida." }, 422);
  }

  try {
    // A new Cart-Token creates an isolated, server-side WooCommerce cart.
    let result = await storeRequest("/cart", { currency });
    let cartToken = result.cartToken;

    if (!cartToken) {
      throw Object.assign(new Error("WooCommerce did not return a Cart-Token"), {
        code: "CART_TOKEN_MISSING",
        status: 502,
      });
    }

    for (const item of items) {
      const id = item.variationId || item.productId;
      result = await storeRequest("/cart/add-item", {
        method: "POST",
        body: { id, quantity: item.quantity },
        cartToken,
        currency,
      });
      cartToken = result.cartToken;
    }

    // WooCommerce uses the billing email for email-restricted coupons.
    if (EMAIL_PATTERN.test(email)) {
      result = await storeRequest("/cart/update-customer", {
        method: "POST",
        body: { billing_address: { email } },
        cartToken,
        currency,
      });
      cartToken = result.cartToken;
    }

    result = await storeRequest(`/cart/apply-coupon?code=${encodeURIComponent(code)}`, {
      method: "POST",
      cartToken,
      currency,
    });

    const cart = result.payload;
    const appliedCoupon = Array.isArray(cart?.coupons)
      ? cart.coupons.find(
          (coupon) => normalizeCouponCode(coupon?.code) === code,
        )
      : null;

    if (!appliedCoupon) {
      return json(
        {
          valid: false,
          code: "COUPON_NOT_APPLIED",
          message:
            language === "es"
              ? "WooCommerce no aplicó el cupón al carrito."
              : "WooCommerce did not apply the coupon to the cart.",
        },
        422,
      );
    }

    const totals = cart?.totals || {};
    const couponTotals = appliedCoupon?.totals || {};
    const minorUnit = Number(
      couponTotals?.currency_minor_unit ?? totals?.currency_minor_unit ?? 2,
    );
    const returnedCurrency = cleanText(
      totals?.currency_code || couponTotals?.currency_code || currency,
      3,
    ).toUpperCase();

    if (currency && returnedCurrency && returnedCurrency !== currency) {
      return json(
        {
          valid: false,
          code: "COUPON_CURRENCY_MISMATCH",
          message:
            language === "es"
              ? `WooCommerce validó el cupón en ${returnedCurrency}, pero el checkout está en ${currency}.`
              : `WooCommerce validated the coupon in ${returnedCurrency}, but checkout is using ${currency}.`,
        },
        409,
      );
    }

    const discount = moneyFromMinorUnits(couponTotals?.total_discount, minorUnit);
    const total = moneyFromMinorUnits(totals?.total_price, minorUnit);
    const subtotal = moneyFromMinorUnits(totals?.total_items, minorUnit);

    return json({
      valid: true,
      code,
      message:
        language === "es"
          ? "Cupón validado y aplicado por WooCommerce."
          : "Coupon validated and applied by WooCommerce.",
      coupon: {
        code: normalizeCouponCode(appliedCoupon?.code || code),
        type: cleanText(appliedCoupon?.discount_type || appliedCoupon?.type, 40),
      },
      totals: {
        subtotal,
        discount,
        total,
        currency: returnedCurrency || currency,
      },
    });
  } catch (error) {
    console.error("Native WooCommerce coupon validation failed:", error?.code || error?.message);

    const status = [400, 401, 403, 404, 409, 422, 429].includes(Number(error?.status))
      ? Number(error.status)
      : 502;

    return json(
      {
        valid: false,
        code: cleanText(error?.code, 100) || "COUPON_VALIDATION_FAILED",
        message: friendlyCouponMessage(error, language),
      },
      status,
    );
  }
}

export function ALL() {
  return json({ valid: false, code: "METHOD_NOT_ALLOWED" }, 405);
}