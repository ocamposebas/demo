export const prerender = false;

const SITE = "https://labcorepep.com";
const STATIC_PATHS = [
  "/",
  "/shop",
  "/about",
  "/peptide-info",
  "/research-areas",
  "/coa-library",
  "/molecular-data",
  "/specifications",
  "/analysis-log",
  "/faqs",
  "/news",
  "/contact",
  "/privacy-policy",
  "/terms-conditions",
  "/disclaimer",
  "/waiver-agreement",
  "/track-order",
];

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const normalizeRoot = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/wp-json(?:\/.*)?$/i, "");

async function getProducts() {
  const root = normalizeRoot(import.meta.env.WOOCOMMERCE_URL);
  const key = String(import.meta.env.WOOCOMMERCE_CONSUMER_KEY || "").trim();
  const secret = String(import.meta.env.WOOCOMMERCE_CONSUMER_SECRET || "").trim();
  if (!root || !key || !secret) return [];

  try {
    const token = Buffer.from(`${key}:${secret}`).toString("base64");
    const response = await fetch(
      `${root}/wp-json/wc/v3/products?status=publish&per_page=100&_fields=slug,modified_gmt`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${token}`,
          "User-Agent": "LAB_CORE Sitemap",
        },
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return [];
    const products = await response.json();
    return Array.isArray(products) ? products : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const products = await getProducts();
  const urls = [
    ...STATIC_PATHS.map((path) => ({ loc: new URL(path, SITE).toString() })),
    ...products
      .filter((product) => product?.slug)
      .map((product) => ({
        loc: new URL(`/products/${encodeURIComponent(product.slug)}`, SITE).toString(),
        lastmod: product.modified_gmt
          ? new Date(`${product.modified_gmt}Z`).toISOString()
          : undefined,
      })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
