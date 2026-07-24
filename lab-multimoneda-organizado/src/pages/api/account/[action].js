export const prerender = false;

const COOKIE_NAME = "lab_core_session";
const ACCOUNT_NAMESPACE = "/wp-json/lab-core/v1";
const MAX_PAYLOAD_BYTES = 20_000;

const ACTIONS = {
  register: ["POST"],
  login: ["POST"],
  logout: ["POST"],
  me: ["GET", "PATCH"],
  "forgot-password": ["POST"],
  "reset-password": ["POST"],
  "change-password": ["POST"],
  orders: ["GET"],
  "track-order": ["POST"],
  rewards: ["GET"],
  "rewards-rate": ["GET"],
  "rewards-quote": ["POST"],
  "rewards-release": ["POST"],
};

const ACTION_PATHS = {
  "rewards-rate": "rewards/rate",
  "rewards-quote": "rewards/quote",
  "rewards-release": "rewards/release",
};

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      ...headers,
    },
  });

const getCookie = (request, name) => {
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

const cookieHeader = (request, token = "", maxAge = 0) => {
  const requestUrl = new URL(request.url);
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const secure = requestUrl.protocol === "https:" || forwardedProtocol === "https";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
  ];

  if (maxAge <= 0) parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  if (secure) parts.push("Secure");

  return parts.join("; ");
};

const normalizeWordPressRoot = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/wp-json(?:\/.*)?$/i, "");

async function handle({ request, params }) {
  const action = String(params.action || "").toLowerCase();
  const method = request.method.toUpperCase();

  if (!ACTIONS[action]) {
    return json({ ok: false, code: "NOT_FOUND" }, 404);
  }

  const respond = (body, status = 200, headers = {}) =>
    json(body, status, {
      ...(action === "logout" ? { "Set-Cookie": cookieHeader(request) } : {}),
      ...headers,
    });

  if (!ACTIONS[action].includes(method)) {
    return respond({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, {
      Allow: ACTIONS[action].join(", "),
    });
  }

  if (!["GET", "HEAD"].includes(method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return respond({ ok: false, code: "ORIGIN_NOT_ALLOWED" }, 403);
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return respond({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413);
  }

  const wordpressRoot = normalizeWordPressRoot(
    import.meta.env.WORDPRESS_API_URL || import.meta.env.WOOCOMMERCE_URL
  );

  if (!wordpressRoot || /your-woocommerce-store\.com/i.test(wordpressRoot)) {
    return respond({ ok: false, code: "ACCOUNT_API_NOT_CONFIGURED" }, 503);
  }

  const headers = {
    Accept: "application/json",
  };
  const sessionToken = getCookie(request, COOKIE_NAME);
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;

  let body;
  if (!["GET", "HEAD"].includes(method)) {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return respond({ ok: false, code: "INVALID_JSON" }, 400);
    }

    headers["Content-Type"] = "application/json";
    body = JSON.stringify(payload);
  }

  let upstream;
  try {
    upstream = await fetch(`${wordpressRoot}${ACCOUNT_NAMESPACE}/${ACTION_PATHS[action] || action}`, {
      method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("LAB_CORE account API unavailable:", error);
    if (action === "logout") {
      return respond({ ok: true, session_revoked: false });
    }
    return respond({ ok: false, code: "ACCOUNT_API_UNAVAILABLE" }, 502);
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    payload = { ok: false, code: "INVALID_UPSTREAM_RESPONSE" };
  }

  if (
    upstream.status === 404 &&
    ["rest_no_route", "INVALID_UPSTREAM_RESPONSE"].includes(payload?.code)
  ) {
    payload = { ok: false, code: "ACCOUNT_API_NOT_CONFIGURED" };
  }

  const responseHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, private",
  };

  if (upstream.ok && payload?.token) {
    const token = String(payload.token);
    const maxAge = Math.min(
      90 * 24 * 60 * 60,
      Math.max(60, Number(payload.expires_in || 30 * 24 * 60 * 60))
    );
    payload = { ...payload };
    delete payload.token;
    responseHeaders["Set-Cookie"] = cookieHeader(request, token, maxAge);
  }

  if (action === "logout" || upstream.status === 401) {
    responseHeaders["Set-Cookie"] = cookieHeader(request);
  }

  const responsePayload = action === "logout"
    ? { ok: true, session_revoked: upstream.ok }
    : payload;
  const responseStatus = action === "logout" ? 200 : upstream.status;

  return new Response(JSON.stringify(responsePayload), {
    status: responseStatus,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const ALL = handle;
