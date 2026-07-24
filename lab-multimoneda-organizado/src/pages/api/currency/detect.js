export const prerender = false;

const allowed = new Set(["USD", "COP", "MXN"]);
const normalizeRoot = (value) => String(value || "").trim().replace(/\/+$/, "").replace(/\/wp-json(?:\/.*)?$/i, "");
const cleanCurrency = (value) => {
  const currency = String(value || "").trim().toUpperCase();
  return allowed.has(currency) ? currency : "";
};

const currencyFromCountry = (value) => {
  const country = String(value || "").trim().toUpperCase();
  if (country === "CO") return "COP";
  if (country === "MX") return "MXN";
  return country && country !== "XX" ? "USD" : "";
};

const requestCountry = (request) => {
  const headers = [
    "x-vercel-ip-country",
    "cf-ipcountry",
    "x-country-code",
    "cloudfront-viewer-country",
    "x-appengine-country",
  ];
  for (const header of headers) {
    const country = String(request.headers.get(header) || "").trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(country) && country !== "XX") return country;
  }
  return "";
};

const readCookie = (request, name) => {
  const source = request.headers.get("cookie") || "";
  const match = source.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return ""; }
};

const languageFallback = (request) => {
  const language = String(request.headers.get("accept-language") || "").toUpperCase();
  if (/(^|[,;\s-])CO([,;\s-]|$)/.test(language)) return "COP";
  if (/(^|[,;\s-])MX([,;\s-]|$)/.test(language)) return "MXN";
  return "USD";
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  },
});

export async function GET({ request }) {
  const saved = cleanCurrency(readCookie(request, "labcore_currency"));
  if (saved) return json({ currency: saved, source: "saved" });

  const edgeCountry = requestCountry(request);
  const edgeCurrency = currencyFromCountry(edgeCountry);
  if (edgeCurrency) {
    return json({ currency: edgeCurrency, country: edgeCountry, source: "edge-geolocation" });
  }

  const root = normalizeRoot(import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL);
  if (root) {
    try {
      const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
      const response = await fetch(`${root}/wp-json/labcore-multicurrency/v1/currencies`, {
        headers: {
          Accept: "application/json",
          "User-Agent": request.headers.get("user-agent") || "LAB_CORE Currency Detection",
          ...(forwarded ? { "X-Forwarded-For": forwarded, "X-Real-IP": forwarded.split(",")[0].trim() } : {}),
        },
        signal: AbortSignal.timeout(5_000),
      });
      const payload = response.ok ? await response.json() : null;
      const detected = cleanCurrency(payload?.active);
      if (detected) return json({ currency: detected, source: "woocommerce" });
    } catch (error) {
      console.error("Currency detection through WooCommerce failed:", error?.message || error);
    }
  }

  return json({ currency: languageFallback(request), source: "browser-language" });
}

export function ALL() {
  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
