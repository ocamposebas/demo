export const prerender = false;

const OMNISEND_CONTACTS_URL = "https://api.omnisend.com/api/contacts";
const OMNISEND_API_VERSION = "2026-03-15";
const MAX_PAYLOAD_BYTES = 8_000;
const ALLOWED_SOURCES = new Set(["rewards_popup", "footer_newsletter"]);

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      ...headers,
    },
  });

export async function POST({ request }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, code: "INVALID_JSON" }, 400);
  }

  if (payload?.website) {
    return json({ ok: true, new_subscriber: false });
  }

  const email = String(payload?.email || "").trim().toLowerCase();
  const consent = payload?.consent === true;
  const source = ALLOWED_SOURCES.has(payload?.source) ? payload.source : "rewards_popup";

  if (!consent || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, code: "INVALID_FIELDS" }, 400);
  }

  const apiKey = String(import.meta.env.OMNISEND_API_KEY || "").trim();
  if (!apiKey) {
    return json({ ok: false, code: "NOT_CONFIGURED" }, 503);
  }

  const subscribedAt = new Date().toISOString();
  const contact = {
    identifiers: [
      {
        type: "email",
        id: email,
        channels: {
          email: {
            status: "subscribed",
            statusDate: subscribedAt,
          },
        },
      },
    ],
    customProperties: {
      labcoreSignupSource: source,
      labcoreWelcomeDiscountPercent: 10,
      labcorePointsPerUsd: 1,
    },
  };

  try {
    const response = await fetch(OMNISEND_CONTACTS_URL, {
      method: "POST",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Omnisend-API-Key ${apiKey}`,
        "Omnisend-Version": OMNISEND_API_VERSION,
      },
      body: JSON.stringify(contact),
    });

    if (response.ok) {
      return json({ ok: true, new_subscriber: response.status === 201 });
    }

    console.error("Omnisend contact subscription failed:", response.status);
    if ([401, 403, 410].includes(response.status)) {
      return json({ ok: false, code: "NOT_CONFIGURED" }, 503);
    }
    if (response.status === 429) {
      return json({ ok: false, code: "RATE_LIMITED" }, 429);
    }
    return json({ ok: false, code: "PROVIDER_ERROR" }, 502);
  } catch (error) {
    console.error("Omnisend contact subscription unavailable:", error);
    return json({ ok: false, code: "PROVIDER_UNAVAILABLE" }, 502);
  }
}

export function ALL() {
  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, { Allow: "POST" });
}
