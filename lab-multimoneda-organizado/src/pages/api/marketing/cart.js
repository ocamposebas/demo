import { isAllowedRequestOrigin } from "../../../lib/boldPayments.js";
import {
  createCartEventProperties,
  createCartRecoveryToken,
  deleteOmnisendCart,
  normalizeCartEmail,
  normalizeCartId,
  normalizeCartLines,
  priceCartLines,
  resolveMarketingOrigin,
  restoreCartFromToken,
  sendOmnisendEvent,
  upsertOmnisendCart,
} from "../../../lib/omnisend.js";

export const prerender = false;
const MAX_PAYLOAD_BYTES = 50_000;

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

export async function GET({ request }) {
  const token = new URL(request.url).searchParams.get("recover");
  if (!token || token.length > 12_000) return json({ ok: false, code: "INVALID_RECOVERY_LINK" }, 410);
  try {
    return json({ ok: true, ...(await restoreCartFromToken(token)) });
  } catch (error) {
    console.error("Cart recovery failed:", error?.code || error?.message);
    return json({ ok: false, code: error?.code || "RECOVERY_UNAVAILABLE" }, error?.status || 502);
  }
}

export async function POST({ request }) {
  if (!isAllowedRequestOrigin(request)) return json({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403);
  if (Number(request.headers.get("content-length") || 0) > MAX_PAYLOAD_BYTES) {
    return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const cartId = normalizeCartId(payload?.cartId);
  const email = normalizeCartEmail(payload?.email);
  const currency = String(payload?.currency || "").trim().toUpperCase();
  const lines = normalizeCartLines(payload?.items, { allowEmpty: true });
  if (!cartId || !email || !["USD", "COP", "MXN"].includes(currency) || !lines) {
    return json({ ok: false, code: "INVALID_CART" }, 422);
  }

  try {
    if (lines.length === 0) {
      await deleteOmnisendCart(cartId);
      return json({ ok: true, deleted: true });
    }

    const origin = resolveMarketingOrigin(request);
    const pricedLines = await priceCartLines({ currency, lines });
    const recoveryToken = createCartRecoveryToken({ cartId, currency, lines: pricedLines });
    const recoveryUrl = new URL("/checkout", origin);
    recoveryUrl.searchParams.set("recover", recoveryToken);
    const recoveryUrlString = recoveryUrl.toString();

    await upsertOmnisendCart({
      cartId,
      email,
      currency,
      lines: pricedLines,
      recoveryUrl: recoveryUrlString,
      origin,
    });

    let eventTracked = true;
    if (["added", "started_checkout"].includes(payload?.action)) {
      const properties = createCartEventProperties({
        cartId,
        currency,
        lines: pricedLines,
        recoveryUrl: recoveryUrlString,
        origin,
      });
      if (payload.action === "added") {
        const addedIndex = pricedLines.findIndex(
          (line) => `${line.productId}:${line.variationId || "base"}` === payload?.addedCartKey,
        );
        properties.addedItem = properties.lineItems[addedIndex >= 0 ? addedIndex : properties.lineItems.length - 1];
      }
      try {
        await sendOmnisendEvent({
          eventName: payload.action === "started_checkout" ? "started checkout" : "added product to cart",
          email,
          properties,
        });
      } catch (error) {
        eventTracked = false;
        console.error("Omnisend cart event failed:", error?.details || error?.message);
      }
    }

    return json({ ok: true, cartId, recoveryUrl: recoveryUrlString, eventTracked });
  } catch (error) {
    console.error(
      "Omnisend cart synchronization failed:",
      error?.status,
      error?.details || error?.code || error?.message,
    );
    return json(
      { ok: false, code: error?.code || "OMNISEND_UNAVAILABLE" },
      error?.code === "OMNISEND_NOT_CONFIGURED" ? 503 : 502,
    );
  }
}

export function ALL() {
  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET, POST" });
}
