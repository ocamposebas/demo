export const prerender = false;

const SITE = "https://labcorepep.com";
const STATIC_PATHS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/peptidos-investigacion-colombia", changefreq: "weekly", priority: "0.9" },
  { path: "/peptide-info", changefreq: "monthly", priority: "0.8" },
  { path: "/coa-library", changefreq: "weekly", priority: "0.8" },
  { path: "/research-areas", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/molecular-data", changefreq: "monthly", priority: "0.6" },
  { path: "/specifications", changefreq: "monthly", priority: "0.6" },
  { path: "/analysis-log", changefreq: "weekly", priority: "0.6" },
  { path: "/faqs", changefreq: "monthly", priority: "0.6" },
  { path: "/news", changefreq: "weekly", priority: "0.6" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.2" },
  { path: "/terms-conditions", changefreq: "yearly", priority: "0.2" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.2" },
  { path: "/waiver-agreement", changefreq: "yearly", priority: "0.2" },
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
    ...STATIC_PATHS.map(({ path, ...meta }) => ({
      loc: new URL(path, SITE).toString(),
      ...meta,
    })),
    ...products
      .filter((product) => product?.slug)
      .map((product) => ({
        loc: new URL(`/products/${encodeURIComponent(product.slug)}`, SITE).toString(),
        lastmod: product.modified_gmt
          ? new Date(`${product.modified_gmt}Z`).toISOString()
          : undefined,
        changefreq: "weekly",
        priority: "0.8",
      })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) =>
      `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}${priority ? `<priority>${priority}</priority>` : ""}</url>`,
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
