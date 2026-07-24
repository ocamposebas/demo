const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const contentId = (item) =>
  String(item?.variationId || item?.variation_id || item?.id || item?.productId || "");

export const metaContents = (items = []) =>
  items
    .map((item) => ({
      id: contentId(item),
      quantity: Math.max(1, Math.trunc(safeNumber(item?.quantity) || 1)),
      item_price: safeNumber(item?.price ?? item?.unitPrice),
    }))
    .filter((item) => item.id);

export const metaCartData = (items = [], currency = "USD", value) => {
  const contents = metaContents(items);
  const calculatedValue = contents.reduce(
    (total, item) => total + item.item_price * item.quantity,
    0,
  );

  return {
    content_ids: contents.map((item) => item.id),
    content_type: "product",
    contents,
    currency: String(currency || "USD").toUpperCase(),
    num_items: contents.reduce((total, item) => total + item.quantity, 0),
    value: Number((Number.isFinite(Number(value)) ? Number(value) : calculatedValue).toFixed(2)),
  };
};

export const trackMetaEvent = (eventName, parameters = {}, options = {}) => {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return false;

  const dedupeKey = String(options.dedupeKey || "");
  const storage = options.persistent ? window.localStorage : window.sessionStorage;

  if (dedupeKey) {
    try {
      if (storage.getItem(dedupeKey)) return false;
    } catch {}
  }

  window.fbq("track", eventName, parameters);

  if (dedupeKey) {
    try {
      storage.setItem(dedupeKey, new Date().toISOString());
    } catch {}
  }

  return true;
};
