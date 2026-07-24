import {
  cleanText,
  getBoldConfig,
  getWooOrderIdFromReference,
  mapBoldStatusToWoo,
  paymentJson,
  updateWooOrderPayment,
  wooRequest,
} from "../../../../lib/boldPayments.js";

export const prerender = false;

const publicOrder = (order) => ({
  id: Number(order?.id || 0),
  number: String(order?.number || order?.id || ""),
  total: String(order?.total || ""),
  currency: cleanText(order?.currency, 3).toUpperCase(),
  status: cleanText(order?.status, 30),
});

export async function GET({ request }) {
  const url = new URL(request.url);
  const reference = cleanText(url.searchParams.get("orderId"), 60);
  const wooOrderId = getWooOrderIdFromReference(reference);
  if (!wooOrderId) return paymentJson({ ok: false, code: "INVALID_ORDER_REFERENCE" }, 422);

  const bold = getBoldConfig();
  if (!bold.ready) return paymentJson({ ok: false, code: "BOLD_NOT_CONFIGURED" }, 503);

  let order;
  try {
    order = await wooRequest(`/orders/${wooOrderId}`);
  } catch (error) {
    console.error("Bold status order lookup failed:", error.code || error.message);
    return paymentJson({ ok: false, code: "ORDER_NOT_FOUND" }, error.status === 404 ? 404 : 502);
  }

  const storedReference = order?.meta_data?.find((item) => item?.key === "_bold_order_id")?.value;
  if (cleanText(storedReference, 60) !== reference) {
    return paymentJson({ ok: false, code: "ORDER_REFERENCE_MISMATCH" }, 409);
  }

  let response;
  try {
    response = await fetch(`https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(reference)}`, {
      headers: {
        Accept: "application/json",
        Authorization: `x-api-key ${bold.apiKey}`,
        "User-Agent": "LAB_CORE Bold Status",
      },
      signal: AbortSignal.timeout(8_000),
    });
  } catch (error) {
    console.error("Bold status API unavailable:", error.message);
    return paymentJson({ ok: false, code: "BOLD_STATUS_UNAVAILABLE", order: publicOrder(order) }, 502);
  }

  let transaction;
  try {
    transaction = await response.json();
  } catch {
    transaction = null;
  }

  if (!response.ok) {
    const notFound = response.status === 404;
    return paymentJson({
      ok: notFound,
      status: notFound ? "NO_TRANSACTION_FOUND" : "STATUS_ERROR",
      code: notFound ? undefined : "BOLD_STATUS_ERROR",
      order: publicOrder(order),
    }, notFound ? 200 : 502);
  }

  const returnedReference = cleanText(transaction?.reference_id || reference, 60);
  if (returnedReference !== reference) {
    return paymentJson({ ok: false, code: "BOLD_REFERENCE_MISMATCH" }, 409);
  }

  const expectedAmount = Number(order?.total || 0);
  const paidAmount = Number(transaction?.total || 0);
  if (
    transaction?.payment_status !== "NO_TRANSACTION_FOUND" &&
    (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount)
  ) {
    return paymentJson({ ok: false, code: "PAYMENT_AMOUNT_MISMATCH", order: publicOrder(order) }, 409);
  }

  const mapped = mapBoldStatusToWoo(transaction?.payment_status);
  if (mapped.bold !== "NO_TRANSACTION_FOUND") {
    try {
      order = await updateWooOrderPayment({
        wooOrderId,
        reference,
        status: mapped.bold,
        transactionId: transaction?.transaction_id,
        payerEmail: transaction?.payer_email,
      });
    } catch (error) {
      console.error("Bold status WooCommerce update failed:", error.code || error.message);
      return paymentJson({ ok: false, code: "ORDER_STATUS_UPDATE_FAILED", status: mapped.bold, order: publicOrder(order) }, 502);
    }
  }

  return paymentJson({
    ok: true,
    status: mapped.bold,
    final: ["APPROVED", "REJECTED", "FAILED", "VOIDED"].includes(mapped.bold),
    order: publicOrder(order),
    transaction: transaction?.transaction_id
      ? {
          id: cleanText(transaction.transaction_id, 100),
          method: cleanText(transaction?.payment_method, 60),
          date: cleanText(transaction?.transaction_date, 80),
        }
      : null,
  });
}

export function ALL() {
  return paymentJson({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
