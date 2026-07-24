export const prerender = false;

const normalizeRoot = (value) => String(value || "").trim().replace(/\/+$/, "").replace(/\/wp-json(?:\/.*)?$/i, "");

export async function GET({ request }) {
  const root = normalizeRoot(import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL);
  if (!root) return new Response(JSON.stringify({ ok: false, code: "COA_API_NOT_CONFIGURED" }), { status: 503, headers: { "Content-Type": "application/json" } });

  const incoming = new URL(request.url);
  const upstream = new URL(`${root}/wp-json/phaseone/v1/coas`);
  ["search", "sku", "currentShippingLot", "productId"].forEach((key) => {
    const value = incoming.searchParams.get(key);
    if (value) upstream.searchParams.set(key, value.slice(0, 160));
  });

  try {
    const response = await fetch(upstream, { headers: { Accept: "application/json", "User-Agent": "LAB_CORE COA Library" }, signal: AbortSignal.timeout(10_000) });
    const payload = await response.text();
    return new Response(payload, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        "X-Lab-COA-Source": response.headers.get("X-P1COA-Source") || "wordpress",
      },
    });
  } catch (error) {
    console.error("COA library unavailable:", error.message);
    return new Response(JSON.stringify({ ok: false, code: "COA_API_UNAVAILABLE" }), { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
}
