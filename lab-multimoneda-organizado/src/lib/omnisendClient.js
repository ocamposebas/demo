const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value) => {
  const email = String(value || "").trim().toLowerCase().slice(0, 160);
  return EMAIL_PATTERN.test(email) ? email : "";
};

export const identifyOmnisendContact = (value) => {
  if (typeof window === "undefined") return false;
  const email = normalizeEmail(value);
  if (!email || typeof window.omnisend?.identifyContact !== "function") return false;

  try {
    window.omnisend.identifyContact({ email });
    return true;
  } catch (error) {
    console.warn("Omnisend contact identification unavailable:", error?.message || error);
    return false;
  }
};

export const identifyOmnisendContactWhenReady = (value, { attempts = 20, interval = 250 } = {}) => {
  if (typeof window === "undefined") return () => {};
  const email = normalizeEmail(value);
  if (!email) return () => {};

  let cancelled = false;
  let timer = 0;
  let remaining = Math.max(1, Number(attempts) || 1);

  const identify = () => {
    if (cancelled || identifyOmnisendContact(email)) return;
    remaining -= 1;
    if (remaining > 0) timer = window.setTimeout(identify, Math.max(50, Number(interval) || 250));
  };

  identify();
  return () => {
    cancelled = true;
    if (timer) window.clearTimeout(timer);
  };
};

export const trackOmnisendEvent = (eventName, payload) => {
  if (
    typeof window === "undefined" ||
    !eventName ||
    typeof window.omnisend?.push !== "function"
  ) return false;

  try {
    window.omnisend.push(["track", eventName, payload]);
    return true;
  } catch (error) {
    console.warn("Omnisend browser event unavailable:", error?.message || error);
    return false;
  }
};

