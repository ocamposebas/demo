export const prerender = false;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export async function POST({ request }) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 12_000) {
    return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  if (payload.website) {
    return json({ ok: true });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const productId = Number(payload.productId);
  const variationId = payload.variationId ? Number(payload.variationId) : null;
  const productName = String(payload.productName || "").trim();
  const mg = String(payload.mg || "").trim();

  if (
    name.length < 2 ||
    name.length > 80 ||
    email.length > 160 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    return json({ ok: false, code: "INVALID_FIELDS" }, 400);
  }

  const webhookUrl = import.meta.env.BACK_NOTIFIER_WEBHOOK_URL;
  const wooUrl = import.meta.env.WOOCOMMERCE_URL;
  const wooKey = import.meta.env.WOOCOMMERCE_CONSUMER_KEY;
  const wooSecret = import.meta.env.WOOCOMMERCE_CONSUMER_SECRET;
  const useWebhook = Boolean(webhookUrl);

  if (!useWebhook && (!wooUrl || !wooKey || !wooSecret)) {
    return json({ ok: false, code: "NOT_CONFIGURED" }, 503);
  }

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  let providerUrl;
  let providerPayload;

  if (useWebhook) {
    providerUrl = webhookUrl;
    providerPayload = {
      name,
      email,
      product_id: productId,
      variation_id: variationId,
      product_name: productName,
      mg,
      source: "lab_core_product_detail",
    };

    const apiKey = import.meta.env.BACK_NOTIFIER_API_KEY;
    const authHeader = import.meta.env.BACK_NOTIFIER_AUTH_HEADER || "Authorization";

    if (apiKey) {
      headers[authHeader] =
        authHeader.toLowerCase() === "authorization" ? `Bearer ${apiKey}` : apiKey;
    }
  } else {
    providerUrl = `${wooUrl.replace(/\/$/, "")}/wp-json/wc-instocknotifier/v3/create_subscriber`;
    headers.Authorization = `Basic ${Buffer.from(`${wooKey}:${wooSecret}`).toString("base64")}`;
    providerPayload = {
      subscriber_name: name,
      email,
      product_id: String(productId),
      variation_id: variationId ? String(variationId) : "",
      status: "cwg_subscribed",
    };
  }

  try {
    const response = await fetch(providerUrl, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers,
      body: JSON.stringify(providerPayload),
    });

    if (!response.ok) {
      console.error("Back Notifier request failed:", response.status);
      if ([401, 403, 404].includes(response.status)) {
        return json({ ok: false, code: "NOT_CONFIGURED" }, 503);
      }
      return json({ ok: false, code: "PROVIDER_ERROR" }, 502);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Back Notifier request failed:", error);
    return json({ ok: false, code: "PROVIDER_UNAVAILABLE" }, 502);
  }
}

export function ALL() {
  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
