import {
  cleanText,
  getBoldWebhookSecret,
  getWooOrderIdFromReference,
  paymentJson,
  updateWooOrderPayment,
  verifyBoldWebhookSignature,
  wooRequest,
} from "../../../../lib/boldPayments.js";
import { completeOmnisendOrder } from "../../../../lib/omnisend.js";

export const prerender = false;
const MAX_BODY_BYTES = 100_000;

const metaValue = (order, key) =>
  order?.meta_data?.find((item) => item?.key === key)?.value;

export async function POST({ request }) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return paymentJson({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-bold-signature");
  if (!verifyBoldWebhookSignature({
    rawBody,
    signature,
    secretKey: getBoldWebhookSecret(),
  })) {
    return paymentJson({ ok: false, code: "INVALID_SIGNATURE" }, 400);
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return paymentJson({ ok: false, code: "INVALID_JSON" }, 400);
  }

  const eventId = cleanText(event?.id, 100);
  const eventType = cleanText(event?.type, 40).toUpperCase();
  const data = event?.data || {};
  const reference = cleanText(
    data?.metadata?.reference || data?.reference_id || data?.reference,
    60,
  );
  const wooOrderId = getWooOrderIdFromReference(reference);
  if (!eventId || !wooOrderId || !["SALE_APPROVED", "SALE_REJECTED", "VOID_APPROVED"].includes(eventType)) {
    return paymentJson({ ok: false, code: "INVALID_EVENT" }, 422);
  }

  let order;
  try {
    order = await wooRequest(`/orders/${wooOrderId}`);
  } catch (error) {
    console.error("Bold webhook order lookup failed:", error?.code || error?.message);
    return paymentJson({ ok: false, code: "ORDER_NOT_FOUND" }, error?.status === 404 ? 404 : 502);
  }

  if (cleanText(metaValue(order, "_bold_order_id"), 60) !== reference) {
    return paymentJson({ ok: false, code: "ORDER_REFERENCE_MISMATCH" }, 409);
  }
  if (cleanText(metaValue(order, "_bold_last_event_id"), 100) === eventId) {
    return paymentJson({ ok: true, duplicate: true });
  }

  const expectedTotal = Number(order?.total || 0);
  const paidTotal = Number(data?.amount?.total);
  const expectedCurrency = cleanText(order?.currency, 3).toUpperCase();
  const paidCurrency = cleanText(data?.amount?.currency || expectedCurrency, 3).toUpperCase();
  if (
    !Number.isFinite(paidTotal) ||
    paidTotal !== expectedTotal ||
    paidCurrency !== expectedCurrency
  ) {
    return paymentJson({ ok: false, code: "PAYMENT_AMOUNT_MISMATCH" }, 409);
  }

  try {
    order = await updateWooOrderPayment({
      wooOrderId,
      reference,
      status: eventType,
      transactionId: data?.payment_id || event?.subject,
      eventId,
      payerEmail: data?.payer_email,
    });
  } catch (error) {
    console.error("Bold webhook WooCommerce update failed:", error?.code || error?.message);
    return paymentJson({ ok: false, code: "ORDER_STATUS_UPDATE_FAILED" }, 502);
  }

  if (eventType === "SALE_APPROVED") {
    try {
      await completeOmnisendOrder({ order, request });
    } catch (error) {
      console.error("Omnisend webhook completion failed:", error?.details || error?.message);
    }
  }

  return paymentJson({ ok: true });
}

export function ALL() {
  return paymentJson({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
