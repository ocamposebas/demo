export const prerender = false;

const ALLOWED = new Set(["USD", "COP", "MXN"]);
const normalizeRoot = (value) => String(value || "").trim().replace(/\/+$/, "").replace(/\/wp-json(?:\/.*)?$/i, "");
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  },
});

export async function POST({ request }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ code: "ORIGIN_NOT_ALLOWED" }, 403);

  let payload;
  try { payload = await request.json(); } catch { return json({ code: "INVALID_JSON" }, 400); }

  const currency = String(payload?.currency || "").trim().toUpperCase();
  if (!ALLOWED.has(currency)) return json({ code: "INVALID_CURRENCY" }, 422);
  if (!Array.isArray(payload?.items) || payload.items.length < 1 || payload.items.length > 100) {
    return json({ code: "INVALID_CART" }, 422);
  }

  const items = payload.items.map((item) => ({
    productId: Number(item?.productId || item?.id || 0),
    variationId: Number(item?.variationId || 0),
    quantity: Number(item?.quantity || 0),
  }));
  if (items.some((item) => !Number.isSafeInteger(item.productId) || item.productId <= 0 || !Number.isSafeInteger(item.variationId) || item.variationId < 0 || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
    return json({ code: "INVALID_CART" }, 422);
  }

  const root = normalizeRoot(import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL);
  if (!root) return json({ code: "WORDPRESS_NOT_CONFIGURED" }, 503);

  try {
    const response = await fetch(`${root}/wp-json/labcore-multicurrency/v1/quote`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Labcore-Currency": currency,
        "User-Agent": "LAB_CORE Multi-Currency Quote",
      },
      body: JSON.stringify({ currency, items }),
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json().catch(() => ({}));
    return json(result, response.status);
  } catch (error) {
    console.error("Multi-currency quote failed:", error?.message || error);
    return json({ code: "QUOTE_UNAVAILABLE" }, 502);
  }
}

export function ALL() {
  return json({ code: "METHOD_NOT_ALLOWED" }, 405);
}
