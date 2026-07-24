import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const BOLD_REFERENCE_PATTERN = /^LAB-(\d+)-[A-Z0-9]+-[A-F0-9]+$/;
const ACCOUNT_COOKIE = "lab_core_session";

export const paymentJson = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });

export const cleanText = (value, maxLength = 180) =>
  String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

export const getBoldConfig = () => {
  const apiKey = cleanText(import.meta.env.BOLD_IDENTITY_KEY, 300);
  const secretKey = cleanText(import.meta.env.BOLD_SECRET_KEY, 300);
  const environment = cleanText(import.meta.env.BOLD_ENVIRONMENT || "test", 20).toLowerCase();

  return {
    apiKey,
    secretKey,
    environment: environment === "production" ? "production" : "test",
    supportedCurrencies: ["USD", "COP"],
    ready: Boolean(apiKey && secretKey),
  };
};

const normalizeRoot = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/wp-json(?:\/.*)?$/i, "");

export const getWooConfig = () => ({
  root: normalizeRoot(import.meta.env.WOOCOMMERCE_URL),
  key: String(import.meta.env.WOOCOMMERCE_CONSUMER_KEY || "").trim(),
  secret: String(import.meta.env.WOOCOMMERCE_CONSUMER_SECRET || "").trim(),
});

export async function wooRequest(path, { method = "GET", body, timeout = 8_000, headers = {} } = {}) {
  const config = getWooConfig();

  if (!config.root || !config.key || !config.secret) {
    const error = new Error("WooCommerce is not configured");
    error.code = "WOOCOMMERCE_NOT_CONFIGURED";
    throw error;
  }

  const token = Buffer.from(`${config.key}:${config.secret}`).toString("base64");
  const response = await fetch(`${config.root}/wp-json/wc/v3${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "LAB_CORE Bold Checkout",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeout),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(`WooCommerce request failed with ${response.status}`);
    error.code = payload?.code || "WOOCOMMERCE_REQUEST_FAILED";
    error.status = response.status;
    error.details = payload?.message;
    throw error;
  }

  return payload;
}

export async function quoteMultiCurrencyCart({ currency, items, timeout = 8_000 }) {
  const config = getWooConfig();
  const selectedCurrency = cleanText(currency, 3).toUpperCase();
  if (!config.root) {
    const error = new Error("WooCommerce is not configured");
    error.code = "WOOCOMMERCE_NOT_CONFIGURED";
    throw error;
  }
  if (!["USD", "COP", "MXN"].includes(selectedCurrency)) {
    const error = new Error("Invalid currency");
    error.code = "INVALID_CURRENCY";
    throw error;
  }

  const response = await fetch(`${config.root}/wp-json/labcore-multicurrency/v1/quote`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Labcore-Currency": selectedCurrency,
      "User-Agent": "LAB_CORE Secure Multi-Currency Quote",
    },
    body: JSON.stringify({ currency: selectedCurrency, items }),
    signal: AbortSignal.timeout(timeout),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(payload?.lines)) {
    const error = new Error(payload?.message || `Multi-currency quote failed with ${response.status}`);
    error.code = payload?.code || "MULTICURRENCY_QUOTE_FAILED";
    error.status = response.status;
    error.details = payload?.data;
    throw error;
  }

  return payload;
}

const readCookie = (request, name) => {
  const source = request.headers.get("cookie") || "";
  const match = source
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return "";
  }
};

export async function getAuthenticatedCustomerId(request) {
  const token = readCookie(request, ACCOUNT_COOKIE);
  if (!token) return 0;

  const root = normalizeRoot(import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL);
  if (!root) return 0;

  try {
    const response = await fetch(`${root}/wp-json/lab-core/v1/me`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return 0;
    const payload = await response.json();
    const customerId = Number(payload?.user?.id || payload?.user?.customer_id || 0);
    return Number.isSafeInteger(customerId) && customerId > 0 ? customerId : 0;
  } catch {
    return 0;
  }
}

export const createBoldReference = (wooOrderId) => {
  const orderId = Number(wooOrderId);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) throw new Error("Invalid WooCommerce order ID");

  return `LAB-${orderId}-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
};

export const getWooOrderIdFromReference = (reference) => {
  const match = cleanText(reference, 60).match(BOLD_REFERENCE_PATTERN);
  const orderId = Number(match?.[1] || 0);
  return Number.isSafeInteger(orderId) && orderId > 0 ? orderId : 0;
};

export const createIntegritySignature = ({ reference, amount, currency, secretKey }) =>
  createHash("sha256")
    .update(`${reference}${amount}${currency}${secretKey}`, "utf8")
    .digest("hex");

export const verifyBoldWebhookSignature = ({ rawBody, signature, secretKey }) => {
  const received = cleanText(signature, 200).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(received)) return false;

  const base64Body = Buffer.from(String(rawBody), "utf8").toString("base64");
  const expected = createHmac("sha256", String(secretKey || ""))
    .update(base64Body, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const resolveSiteOrigin = (request) => {
  const configured = cleanText(import.meta.env.SITE_URL, 300);
  const candidate = configured || new URL(request.url).origin;
  const url = new URL(candidate);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (!local && url.protocol !== "https:") {
    const error = new Error("Bold requires HTTPS outside local development");
    error.code = "HTTPS_REQUIRED";
    throw error;
  }

  return url.origin;
};

export const isAllowedRequestOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set();
  const addOrigin = (value) => {
    try {
      allowedOrigins.add(new URL(value).origin);
    } catch {}
  };

  addOrigin(request.url);
  addOrigin(import.meta.env.SITE_URL);

  const forwardedHost = String(
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "",
  )
    .split(",")[0]
    .trim();
  const forwardedProto = String(
    request.headers.get("x-forwarded-proto") || "https",
  )
    .split(",")[0]
    .trim();

  if (forwardedHost && ["http", "https"].includes(forwardedProto)) {
    addOrigin(`${forwardedProto}://${forwardedHost}`);
  }

  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
};

export const getBoldWebhookSecret = () => {
  const explicit = import.meta.env.BOLD_WEBHOOK_SECRET;
  const bold = getBoldConfig();
  if (bold.environment === "test") {
    return typeof explicit === "string" ? explicit.trim() : "";
  }
  return typeof explicit === "string" && explicit.trim()
    ? explicit.trim()
    : bold.secretKey;
};

export const mapBoldStatusToWoo = (status) => {
  const normalized = cleanText(status, 40).toUpperCase();
  if (["APPROVED", "SALE_APPROVED"].includes(normalized)) return { bold: "APPROVED", woo: "processing", paid: true };
  if (["REJECTED", "FAILED", "SALE_REJECTED"].includes(normalized)) return { bold: normalized === "FAILED" ? "FAILED" : "REJECTED", woo: "failed", paid: false };
  if (["VOIDED", "VOID_APPROVED"].includes(normalized)) return { bold: "VOIDED", woo: "cancelled", paid: false };
  if (["PROCESSING", "PENDING"].includes(normalized)) return { bold: normalized, woo: "pending", paid: false };
  return { bold: "NO_TRANSACTION_FOUND", woo: "pending", paid: false };
};

export async function updateWooOrderPayment({
  wooOrderId,
  reference,
  status,
  transactionId,
  eventId,
  payerEmail,
  timeout = 5_000,
}) {
  const mapped = mapBoldStatusToWoo(status);
  const metaData = [
    { key: "_bold_order_id", value: cleanText(reference, 60) },
    { key: "_bold_payment_status", value: mapped.bold },
  ];

  if (eventId) metaData.push({ key: "_bold_last_event_id", value: cleanText(eventId, 100) });
  if (payerEmail) metaData.push({ key: "_bold_payer_email", value: cleanText(payerEmail, 160) });

  const body = {
    status: mapped.woo,
    set_paid: mapped.paid,
    meta_data: metaData,
  };
  if (transactionId) body.transaction_id = cleanText(transactionId, 100);

  return wooRequest(`/orders/${wooOrderId}`, { method: "PUT", body, timeout });
}
