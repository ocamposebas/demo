import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Coins,
  CreditCard,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Landmark,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "../cart/CartContext.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useCurrency } from "../../currency/CurrencyContext.jsx";
import { LEGAL_VERSION } from "../legal/legalContent.js";

const lineKey = (item) => String(item.cartKey || `${item.id}:${item.variationId || "base"}`);
const BOLD_SCRIPT_URL = "https://checkout.bold.co/library/boldPaymentButton.js";
let boldLibraryPromise;

const inputClass =
  "h-12 w-full rounded-xl border border-white/10 bg-[#020817] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10";

const textareaClass =
  "min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#020817] px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10";

const normalizeCouponCode = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 48);

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const PaymentLogoBadge = ({ children, className = "" }) => (
  <div
    className={`flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-3 ${className}`}
  >
    {children}
  </div>
);

const VisaLogo = () => (
  <PaymentLogoBadge>
    <span className="font-['Orbitron'] text-[12px] font-black italic tracking-[-0.08em] text-[#60a5fa]">
      VISA
    </span>
  </PaymentLogoBadge>
);

const MastercardLogo = () => (
  <PaymentLogoBadge className="justify-start gap-2.5">
    <span className="relative flex h-5 w-8 items-center">
      <span className="absolute left-0 h-5 w-5 rounded-full bg-[#ef4444]/95" />
      <span className="absolute left-3 h-5 w-5 rounded-full bg-[#f59e0b]/95 mix-blend-screen" />
    </span>
    <span className="font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-slate-200">
      Mastercard
    </span>
  </PaymentLogoBadge>
);

const AmexLogo = () => (
  <PaymentLogoBadge>
    <span className="rounded-md border border-cyan-300/20 bg-cyan-300/[0.08] px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.1em] text-cyan-100">
      AMEX
    </span>
  </PaymentLogoBadge>
);

const DinersLogo = () => (
  <PaymentLogoBadge>
    <span className="rounded-md border border-blue-300/25 bg-blue-400/[0.08] px-2 py-1 font-mono text-[8px] font-black text-blue-100">
      DINERS
    </span>
  </PaymentLogoBadge>
);

const DiscoverLogo = () => (
  <PaymentLogoBadge>
    <span className="font-mono text-[8px] font-black tracking-[-0.04em] text-slate-100">
      DISC<span className="text-orange-400">O</span>VER
    </span>
  </PaymentLogoBadge>
);

const CodensaLogo = () => (
  <PaymentLogoBadge>
    <span className="skew-x-[-8deg] rounded bg-[#ffd43b] px-2 py-1 font-mono text-[7px] font-black text-[#15204b]">
      CODENSA
    </span>
  </PaymentLogoBadge>
);

const BancolombiaLogo = () => (
  <PaymentLogoBadge className="justify-start gap-2.5">
    <span className="flex h-7 w-7 rotate-[-8deg] items-center justify-center rounded-lg bg-[#ffe600] text-[#171717]">
      <Landmark size={14} strokeWidth={2.5} />
    </span>
    <span className="truncate text-[9px] font-bold text-slate-100">Bancolombia</span>
  </PaymentLogoBadge>
);

const NequiLogo = () => (
  <PaymentLogoBadge className="justify-start gap-2.5">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-black text-[#5f164f]">
      N
    </span>
    <span className="text-[10px] font-bold text-slate-100">Nequi</span>
  </PaymentLogoBadge>
);

const PseLogo = () => (
  <PaymentLogoBadge className="justify-start gap-2.5">
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-300/[0.08] text-cyan-300">
      <Landmark size={14} />
    </span>
    <div className="leading-none">
      <p className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.08em] text-white">
        PSE
      </p>
      <p className="mt-1 font-mono text-[6px] uppercase tracking-[0.08em] text-slate-500">
        Pagos seguros
      </p>
    </div>
  </PaymentLogoBadge>
);

const StepPill = ({ number, label, active = false }) => (
  <div
    className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 transition sm:px-4 ${
      active
        ? "border-cyan-300/35 bg-cyan-300/[0.08] text-white"
        : "border-white/[0.07] bg-white/[0.018] text-slate-600"
    }`}
  >
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[8px] font-bold ${
        active ? "bg-cyan-300 text-[#020617]" : "border border-white/10 text-slate-600"
      }`}
    >
      {number}
    </span>
    <span className="truncate font-mono text-[7px] font-bold uppercase tracking-[0.12em] sm:text-[8px]">
      {label}
    </span>
  </div>
);

const SectionCard = ({ icon: Icon, step, eyebrow, title, description, children, trailing }) => (
  <section
    className="overflow-hidden rounded-2xl border border-white/10 bg-[#061021]"
  >
    <div className="border-b border-white/[0.07] px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/[0.08] text-cyan-300">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white">
              {title}
            </h2>
          </div>
        </div>
        {trailing}
      </div>
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

const FieldLabel = ({ children, optional = false }) => (
  <span className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-slate-300">
    <span>{children}</span>
    {optional && <span className="text-[7px] text-slate-700">OPTIONAL</span>}
  </span>
);

const loadBoldLibrary = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("BROWSER_REQUIRED"));
  if (typeof window.BoldCheckout === "function") return Promise.resolve(window.BoldCheckout);
  if (boldLibraryPromise) return boldLibraryPromise;

  boldLibraryPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${BOLD_SCRIPT_URL}"]`);

    const loaded = () => {
      if (typeof window.BoldCheckout === "function") {
        script?.setAttribute("data-lab-bold-state", "ready");
        resolve(window.BoldCheckout);
      } else {
        boldLibraryPromise = undefined;
        reject(new Error("BOLD_LIBRARY_INVALID"));
      }
    };

    const failed = () => {
      script?.setAttribute("data-lab-bold-state", "error");
      boldLibraryPromise = undefined;
      reject(new Error("BOLD_LIBRARY_UNAVAILABLE"));
    };

    if (script?.getAttribute("data-lab-bold-state") === "error") {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = BOLD_SCRIPT_URL;
      script.async = true;
      script.setAttribute("data-lab-bold-library", "true");
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", failed, { once: true });
      document.head.appendChild(script);
      return;
    }

    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    window.setTimeout(() => {
      if (typeof window.BoldCheckout === "function") loaded();
    }, 0);
  });

  return boldLibraryPromise;
};

const getSavedCustomer = (payload) => {
  const user = payload?.user || payload?.customer || null;
  if (!user) return null;

  const shipping = user.shipping || {};
  const legacyAddress = user.address || {};
  const billing = user.billing || {};

  const first = (...values) => values.find((value) => String(value || "").trim()) || "";

  return {
    firstName: first(user.first_name, shipping.first_name, billing.first_name),
    lastName: first(user.last_name, shipping.last_name, billing.last_name),
    email: first(user.email, billing.email),
    phone: first(user.phone, shipping.phone, billing.phone),
    country: first(shipping.country, legacyAddress.country, billing.country),
    address: first(shipping.address_1, legacyAddress.address_1, billing.address_1),
    addressExtra: first(shipping.address_2, legacyAddress.address_2, billing.address_2),
    city: first(shipping.city, legacyAddress.city, billing.city),
    region: first(shipping.state, legacyAddress.state, billing.state),
    postalCode: first(shipping.postcode, legacyAddress.postcode, billing.postcode),
  };
};

const setNativeFieldValue = (form, name, value) => {
  if (!form || !value) return false;
  const field = form.elements?.namedItem(name);
  if (!field || field.value) return false;

  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
};

export default function Checkout() {
  const { language, t } = useLanguage();
  const { currency, formatMoney, setCurrency } = useCurrency();
  const {
    cartItems,
    cartId,
    cartReady,
    cartTotal,
    updateQuantity,
    removeFromCart,
    cartPricing,
    cartPricingError,
    identifyCartContact,
    markCheckoutStarted,
  } = useCart();

  const [formStatus, setFormStatus] = useState("idle");
  const [paymentError, setPaymentError] = useState("");
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [accountState, setAccountState] = useState({
    status: "loading",
    name: "",
    addressLoaded: false,
  });
  const [couponInput, setCouponInput] = useState("");
  const [couponState, setCouponState] = useState({
    status: "idle",
    code: "",
    discount: 0,
    total: null,
    message: "",
  });
  const [rewards, setRewards] = useState({ status: "idle", available: 0, blockPoints: 500, blockUsd: 5, selected: 0, discount: 0, maxPoints: 0, message: "" });

  const formRef = useRef(null);
  const boldCheckoutRef = useRef(null);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + safeNumber(item.quantity, 0), 0),
    [cartItems],
  );

  const cartSignature = useMemo(
    () =>
      cartItems
        .map(
          (item) =>
            `${item.id}:${item.variationId || 0}:${safeNumber(item.quantity, 0)}:${safeNumber(item.price, 0)}`,
        )
        .join("|"),
    [cartItems],
  );

  const appliedCoupon = couponState.status === "applied" ? couponState : null;
  const totalBeforeRewards = appliedCoupon
    ? safeNumber(appliedCoupon.total, Math.max(0, cartTotal - appliedCoupon.discount))
    : cartTotal;
  const checkoutTotal = Math.max(0, totalBeforeRewards - safeNumber(rewards.discount, 0));

  const formatPrice = (value) => formatMoney(safeNumber(value, 0));

  const resetPreparedPayment = useCallback(() => {
    boldCheckoutRef.current = null;
    setPaymentOrder(null);
    setPaymentError("");
    setFormStatus("idle");
  }, []);

  useEffect(() => {
    if (!cartReady || cartItems.length === 0) return undefined;

    let active = true;

    const prefillAccount = async () => {
      setAccountState((current) => ({ ...current, status: "loading" }));

      try {
        const response = await fetch("/api/account/me", {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (response.status === 401 || response.status === 403) {
          if (active) setAccountState({ status: "guest", name: "", addressLoaded: false });
          return;
        }

        if (!response.ok) throw new Error("ACCOUNT_LOOKUP_FAILED");

        const payload = await response.json();
        const customer = getSavedCustomer(payload);

        if (!active || !customer || !formRef.current) {
          if (active) setAccountState({ status: "guest", name: "", addressLoaded: false });
          return;
        }
        identifyCartContact(customer.email);

        let filledFields = 0;
        Object.entries(customer).forEach(([name, value]) => {
          if (setNativeFieldValue(formRef.current, name, value)) filledFields += 1;
        });

        setAccountState({
          status: "connected",
          name: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
          addressLoaded: filledFields > 0,
        });
      } catch {
        if (active) setAccountState({ status: "unavailable", name: "", addressLoaded: false });
      }
    };

    prefillAccount();
    return () => {
      active = false;
    };
  }, [cartReady, cartItems.length, identifyCartContact]);

  useEffect(() => {
    if (accountState.status !== "connected") return;
    let active = true;
    fetch("/api/account/rewards", { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || payload.ok === false) throw new Error(payload.code || "REWARDS_UNAVAILABLE");
        if (active) setRewards((current) => ({ ...current, status: "ready", available: safeNumber(payload.available), blockPoints: safeNumber(payload.block_points, 500), blockUsd: safeNumber(payload.block_usd, 5), maxPoints: Math.floor(safeNumber(payload.available) / safeNumber(payload.block_points, 500)) * safeNumber(payload.block_points, 500) }));
      })
      .catch(() => { if (active) setRewards((current) => ({ ...current, status: "unavailable" })); });
    return () => { active = false; };
  }, [accountState.status]);

  const selectRewardPoints = useCallback(async (points) => {
    const selected = Math.max(0, safeNumber(points));
    setRewards((current) => ({ ...current, status: "checking", selected, message: "" }));
    try {
      const response = await fetch("/api/account/rewards-quote", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, subtotal: totalBeforeRewards, points: selected, preview: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) {
        const code = payload.code || "REWARDS_UNAVAILABLE";
        throw Object.assign(new Error(code), { code });
      }
      setRewards((current) => ({ ...current, status: "ready", selected, discount: safeNumber(payload.discount), maxPoints: safeNumber(payload.max_points), message: selected ? (language === "es" ? `${selected} puntos aplicarán ${formatMoney(safeNumber(payload.discount))} de descuento.` : `${selected} points will apply a ${formatMoney(safeNumber(payload.discount))} discount.`) : "" }));
    } catch (error) {
      let freshBalance = null;
      try {
        const balanceResponse = await fetch("/api/account/rewards", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const balancePayload = await balanceResponse.json().catch(() => ({}));
        if (balanceResponse.ok && balancePayload.ok !== false) freshBalance = balancePayload;
      } catch {}

      setRewards((current) => {
        const blockPoints = freshBalance ? safeNumber(freshBalance.block_points, 500) : current.blockPoints;
        const available = freshBalance
          ? safeNumber(freshBalance.available)
          : error?.code === "REWARD_POINTS_UNAVAILABLE"
            ? 0
            : current.available;
        const maxPoints = Math.floor(available / blockPoints) * blockPoints;
        return {
          ...current,
          status: "ready",
          available,
          blockPoints,
          blockUsd: freshBalance ? safeNumber(freshBalance.block_usd, 5) : current.blockUsd,
          maxPoints,
          selected: 0,
          discount: 0,
          message: error?.code === "REWARD_POINTS_UNAVAILABLE"
            ? language === "es"
              ? "Tu saldo cambió. Actualizamos los puntos disponibles."
              : "Your balance changed. We refreshed the available points."
            : language === "es"
              ? "No pudimos validar este canje."
              : "We could not validate this redemption.",
        };
      });
    }
  }, [currency, totalBeforeRewards, language, formatMoney]);

  useEffect(() => {
    resetPreparedPayment();
  }, [cartSignature, currency, resetPreparedPayment]);

  const validateCoupon = useCallback(
    async (rawCode, { silent = false } = {}) => {
      const code = normalizeCouponCode(rawCode);

      if (!code) {
        setCouponState({
          status: "error",
          code: "",
          discount: 0,
          total: null,
          message: language === "es" ? "Escribe un código de cupón." : "Enter a coupon code.",
        });
        return false;
      }

      resetPreparedPayment();
      setCouponInput(code);
      setCouponState((current) => ({
        ...current,
        status: "checking",
        code,
        message: silent ? current.message : "",
      }));

      try {
        const email = String(formRef.current?.elements?.namedItem("email")?.value || "").trim();
        const response = await fetch("/api/checkout/coupon", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            code,
            currency,
            email,
            items: cartItems.map((item) => ({
              productId: Number(item.id),
              variationId: Number(item.variationId || 0),
              quantity: Number(item.quantity),
            })),
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload?.valid !== true) {
          throw new Error(
            payload?.message ||
              (language === "es"
                ? "Este cupón no es válido para tu carrito."
                : "This coupon is not valid for your cart."),
          );
        }

        const discount = safeNumber(payload?.totals?.discount ?? payload?.discount, 0);
        const total = safeNumber(
          payload?.totals?.total ?? payload?.total,
          Math.max(0, cartTotal - discount),
        );
        const validatedCode = normalizeCouponCode(payload?.coupon?.code || payload?.code || code);

        setCouponState({
          status: "applied",
          code: validatedCode,
          discount,
          total,
          message:
            payload?.message ||
            (language === "es" ? "Cupón aplicado correctamente." : "Coupon applied successfully."),
        });
        return true;
      } catch (error) {
        setCouponState({
          status: "error",
          code,
          discount: 0,
          total: null,
          message:
            error?.message ||
            (language === "es"
              ? "No pudimos validar el cupón en WordPress."
              : "We could not validate the coupon in WordPress."),
        });
        return false;
      }
    },
    [cartItems, cartTotal, currency, language, resetPreparedPayment],
  );

  useEffect(() => {
    if (couponState.status !== "applied" || !couponState.code) return;
    validateCoupon(couponState.code, { silent: true });
    // Revalidate only when the cart or currency changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSignature, currency]);

  const removeCoupon = () => {
    setCouponInput("");
    setCouponState({
      status: "idle",
      code: "",
      discount: 0,
      total: null,
      message: "",
    });
    resetPreparedPayment();
  };

  const paymentMessage = (code) => {
    const messages =
      language === "es"
        ? {
            ORIGIN_NOT_ALLOWED:
              "El dominio de la tienda no está autorizado por el servidor de pagos. Revisa la configuración del dominio e inténtalo nuevamente.",
            BOLD_NOT_CONFIGURED:
              "Bold todavía no está configurado. Agrega las llaves de identidad y secreta en las variables del servidor.",
            PRODUCT_UNAVAILABLE:
              "Un producto cambió de disponibilidad. Revisa el carrito antes de continuar.",
            INSUFFICIENT_STOCK:
              "No hay inventario suficiente para completar una de las líneas del pedido.",
            PRODUCT_VARIATION_REQUIRED:
              "Una presentación necesita volver a seleccionarse desde la ficha del producto.",
            BOLD_AMOUNT_MUST_BE_INTEGER:
              "Bold requiere un monto sin decimales. Ajusta los precios del catálogo a valores enteros en la moneda configurada.",
            BOLD_CURRENCY_MISMATCH:
              "La moneda de WooCommerce no coincide con la configurada para Bold.",
            LEGAL_ACCEPTANCE_REQUIRED:
              "Debes aceptar los documentos legales para continuar.",
            BOLD_LIBRARY_UNAVAILABLE:
              "No fue posible cargar la ventana segura de Bold. Revisa la conexión e inténtalo nuevamente.",
            MXN_PAYMENT_NOT_SUPPORTED:
              "Puedes ver todos los precios en MXN, pero Bold todavía no procesa pagos en pesos mexicanos. Cambia la moneda a USD para completar la compra.",
            COUPON_INVALID:
              "El cupón dejó de ser válido. Elimínalo o vuelve a aplicarlo antes de pagar.",
            REWARDS_LOGIN_REQUIRED: "Inicia sesión antes de canjear LAB Points.",
            REWARD_POINTS_UNAVAILABLE: "Estos puntos ya no están disponibles. Actualiza tu saldo e inténtalo nuevamente.",
            REWARD_RATE_UNAVAILABLE: "La tasa de mercado no está disponible temporalmente. Inténtalo en unos minutos.",
            REWARD_RESERVATION_FAILED: "No pudimos reservar tus puntos de forma segura. No se descontó ningún punto.",
            COUPON_EXPIRED: "El cupón ha expirado.",
            COUPON_USAGE_LIMIT_REACHED:
              "Este cupón ya alcanzó su límite de uso.",
          }
        : {
            ORIGIN_NOT_ALLOWED:
              "The store domain is not authorized by the payment server. Review the domain configuration and try again.",
            BOLD_NOT_CONFIGURED:
              "Bold is not configured yet. Add the identity and secret keys to the server environment.",
            PRODUCT_UNAVAILABLE:
              "A product's availability changed. Review the cart before continuing.",
            INSUFFICIENT_STOCK:
              "There is not enough stock to complete one of the order lines.",
            PRODUCT_VARIATION_REQUIRED:
              "A presentation must be selected again from its product page.",
            BOLD_AMOUNT_MUST_BE_INTEGER:
              "Bold requires an amount without decimals. Adjust catalog prices to whole values in the configured currency.",
            BOLD_CURRENCY_MISMATCH:
              "The WooCommerce currency does not match the currency configured for Bold.",
            LEGAL_ACCEPTANCE_REQUIRED:
              "You must accept the legal documents to continue.",
            BOLD_LIBRARY_UNAVAILABLE:
              "The secure Bold window could not be loaded. Check your connection and try again.",
            MXN_PAYMENT_NOT_SUPPORTED:
              "You can browse all prices in MXN, but Bold does not yet process Mexican peso payments. Switch the store currency to USD to complete checkout.",
            COUPON_INVALID:
              "The coupon is no longer valid. Remove it or apply it again before paying.",
            COUPON_EXPIRED: "The coupon has expired.",
            COUPON_USAGE_LIMIT_REACHED:
              "This coupon has reached its usage limit.",
            REWARDS_LOGIN_REQUIRED: "Sign in before redeeming LAB Points.",
            REWARD_POINTS_UNAVAILABLE: "These points are no longer available. Refresh your balance and try again.",
            REWARD_RATE_UNAVAILABLE: "The market exchange rate is temporarily unavailable. Try again shortly.",
            REWARD_RESERVATION_FAILED: "We could not safely reserve your points. No points were deducted.",
          };

    return (
      messages[code] ||
      (language === "es"
        ? "No pudimos preparar el pago seguro. Verifica los datos e inténtalo nuevamente."
        : "We could not prepare the secure payment. Check your details and try again.")
    );
  };

  const submitCheckout = async (event) => {
    event.preventDefault();

    if (currency === "MXN") {
      setPaymentError(paymentMessage("MXN_PAYMENT_NOT_SUPPORTED"));
      setFormStatus("error");
      return;
    }

    if (couponState.status === "checking") {
      setPaymentError(
        language === "es"
          ? "Espera mientras terminamos de validar el cupón."
          : "Please wait while we finish validating the coupon.",
      );
      return;
    }

    if (couponInput && couponState.status !== "applied") {
      setPaymentError(
        language === "es"
          ? "Aplica o elimina el código de cupón antes de continuar."
          : "Apply or remove the coupon code before continuing.",
      );
      return;
    }

    if (cartPricing) {
      setPaymentError(
        language === "es"
          ? "Espera un momento mientras actualizamos los precios del carrito."
          : "Please wait while cart prices are updated.",
      );
      return;
    }

    if (cartPricingError) {
      setPaymentError(
        language === "es"
          ? "No pudimos validar todos los precios del carrito. Revisa los precios de esta moneda en WooCommerce e inténtalo de nuevo."
          : "We could not validate every cart price. Review this currency's prices and try again.",
      );
      return;
    }

    if (formStatus === "preparing") return;

    if (boldCheckoutRef.current && paymentOrder) {
      boldCheckoutRef.current.open();
      setFormStatus("ready");
      return;
    }

    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const data = new FormData(form);
    identifyCartContact(data.get("email"));
    setFormStatus("preparing");
    setPaymentError("");

    try {
      const response = await fetch("/api/payments/bold/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          currency,
          cartId,
          couponCode: appliedCoupon?.code || "",
          rewardPoints: rewards.selected || 0,
          legalVersion: LEGAL_VERSION,
          acceptedLegal: data.get("researchAgreement") === "on",
          customer: {
            firstName: data.get("firstName"),
            lastName: data.get("lastName"),
            email: data.get("email"),
            phone: data.get("phone"),
            country: data.get("country"),
            address: data.get("address"),
            addressExtra: data.get("addressExtra"),
            city: data.get("city"),
            region: data.get("region"),
            postalCode: data.get("postalCode"),
            notes: data.get("notes"),
          },
          items: cartItems.map((item) => ({
            productId: Number(item.id),
            variationId: Number(item.variationId || 0),
            quantity: Number(item.quantity),
            title: item.name,
            slug: item.slug,
            sku: item.sku,
            imageUrl: item.images?.[0]?.src,
            variantTitle: item.variantLabel,
          })),
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.checkout) {
        const error = new Error(payload?.code || "PAYMENT_SESSION_FAILED");
        error.code = payload?.code || "PAYMENT_SESSION_FAILED";
        throw error;
      }

      const BoldCheckout = await loadBoldLibrary();
      const checkout = new BoldCheckout(payload.checkout);
      boldCheckoutRef.current = checkout;
      setPaymentOrder({
        ...payload.order,
        environment: payload.environment,
      });
      try {
        sessionStorage.setItem("bold_pending_order", String(payload.order.reference));
        sessionStorage.setItem("bold_pending_cart_id", String(cartId || ""));
      } catch {}
      setFormStatus("ready");
      checkout.open();
    } catch (error) {
      const code = error?.code || error?.message || "PAYMENT_SESSION_FAILED";
      setPaymentError(paymentMessage(code));
      setFormStatus("error");
    }
  };

  if (!cartReady) {
    return (
      <main className="flex min-h-[72vh] items-center justify-center px-4 pt-[var(--lab-mobile-page-top)]">
        <div className="flex items-center gap-3 rounded-full border border-cyan-300/15 bg-cyan-300/[0.04] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-300">
          <LoaderCircle size={16} className="animate-spin" /> {t("checkout.loading")}
        </div>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[76vh] px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pt-[11rem] lg:px-8">
        <div className="mx-auto max-w-[820px] overflow-hidden rounded-[30px] border border-cyan-300/15 bg-[#061021] px-6 py-16 text-center shadow-[0_14px_42px_rgba(2,8,23,0.28)] sm:px-12 sm:py-20">
          <div>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-cyan-300/20 bg-cyan-300/[0.06] text-cyan-300">
              <ShoppingBag size={28} />
            </div>
            <p className="mt-7 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
              CHECKOUT // EMPTY
            </p>
            <h1 className="mt-4 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-4xl">
              {t("checkout.emptyTitle")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-mono text-[10px] leading-6 text-slate-400 sm:text-[11px]">
              {t("checkout.emptyText")}
            </p>
            <a
              href="/shop"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.13em] text-[#020617] transition-colors duration-150 hover:bg-white"
            >
              <ArrowLeft size={14} /> {t("checkout.backShop")}
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="traditional-checkout relative overflow-x-clip px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pt-[9rem] lg:px-8 lg:pt-[9.5rem]">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="checkout-intro mb-7">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <a
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.02] px-3.5 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.15em] text-slate-500 transition hover:border-cyan-300/20 hover:text-cyan-300"
              >
                <ArrowLeft size={12} /> {t("checkout.continueShopping")}
              </a>

              <p className="checkout-kicker mt-6 font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
                SECURE CHECKOUT // LABCORE
              </p>
              <h1 className="checkout-title mt-3 text-3xl font-bold text-white sm:text-4xl">
                {language === "es" ? "Finalizar compra" : "Checkout"}
              </h1>
              <p className="checkout-description mt-4 max-w-2xl font-mono text-[10px] leading-6 text-slate-500 sm:text-[11px]">
                {language === "es"
                  ? "Completa tus datos y revisa tu pedido antes de pagar."
                  : "Enter your details and review your order before paying."}
              </p>

              <div className="checkout-benefits mt-5 flex flex-wrap gap-2">
                {[
                  [ShieldCheck, language === "es" ? "Pago protegido" : "Protected payment"],
                  [LockKeyhole, language === "es" ? "Datos seguros" : "Secure details"],
                  [Truck, language === "es" ? "Orden rastreable" : "Trackable order"],
                ].map(([Icon, label]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.018] px-3 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.09em] text-slate-500"
                  >
                    <Icon size={11} className="text-cyan-300" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="checkout-progress w-full lg:max-w-[450px]">
              <p className="mb-3 font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-slate-600">
                {language === "es" ? "PROGRESO DE COMPRA" : "CHECKOUT PROGRESS"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <StepPill number="01" label={language === "es" ? "Datos" : "Details"} active />
                <StepPill number="02" label={language === "es" ? "Envío" : "Shipping"} active />
                <StepPill number="03" label={language === "es" ? "Pago" : "Payment"} active={Boolean(paymentOrder)} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:items-start">
          <form
            ref={formRef}
            id="lab-checkout-form"
            onSubmit={submitCheckout}
            onChange={resetPreparedPayment}
            className="order-1 grid min-w-0 gap-4"
          >
            <SectionCard
              icon={CircleUserRound}
              step="01"
              eyebrow="CUSTOMER"
              title={language === "es" ? "Información de contacto" : "Contact information"}
              description={
                language === "es"
                  ? "Si ya iniciaste sesión, cargaremos automáticamente los datos guardados en tu cuenta."
                  : "If you are signed in, saved account details are loaded automatically."
              }
              trailing={
                <div
                  className={`hidden shrink-0 items-center gap-2 rounded-full border px-3 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.1em] sm:flex ${
                    accountState.status === "connected"
                      ? "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-300"
                      : accountState.status === "loading"
                        ? "border-white/10 text-slate-500"
                        : "border-white/[0.07] text-slate-600"
                  }`}
                >
                  {accountState.status === "loading" ? (
                    <LoaderCircle size={11} className="animate-spin" />
                  ) : accountState.status === "connected" ? (
                    <BadgeCheck size={11} />
                  ) : (
                    <CircleUserRound size={11} />
                  )}
                  {accountState.status === "connected"
                    ? language === "es"
                      ? "CUENTA DETECTADA"
                      : "ACCOUNT DETECTED"
                    : accountState.status === "loading"
                      ? language === "es"
                        ? "BUSCANDO CUENTA"
                        : "CHECKING ACCOUNT"
                      : language === "es"
                        ? "COMPRA COMO INVITADO"
                        : "GUEST CHECKOUT"}
                </div>
              }
            >
              {accountState.status === "connected" && accountState.addressLoaded && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-300">
                    <Check size={14} />
                  </span>
                  <div>
                    <p className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em] text-emerald-100">
                      {language === "es"
                        ? `Datos cargados${accountState.name ? ` para ${accountState.name}` : ""}`
                        : `Saved details loaded${accountState.name ? ` for ${accountState.name}` : ""}`}
                    </p>
                    <p className="mt-1.5 font-mono text-[8px] leading-5 text-emerald-100/50">
                      {language === "es"
                        ? "Puedes revisar o editar cualquier campo antes de continuar."
                        : "You can review or edit any field before continuing."}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>{t("checkout.firstName")}</FieldLabel>
                  <input
                    name="firstName"
                    autoComplete="section-shipping given-name"
                    required
                    maxLength={80}
                    placeholder={language === "es" ? "Nombre" : "First name"}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.lastName")}</FieldLabel>
                  <input
                    name="lastName"
                    autoComplete="section-shipping family-name"
                    required
                    maxLength={80}
                    placeholder={language === "es" ? "Apellido" : "Last name"}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.email")}</FieldLabel>
                  <input
                    type="email"
                    name="email"
                    autoComplete="section-shipping email"
                    required
                    maxLength={160}
                    placeholder="correo@ejemplo.com"
                    onBlur={(event) => {
                      identifyCartContact(event.currentTarget.value);
                      markCheckoutStarted(event.currentTarget.value);
                    }}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.phone")}</FieldLabel>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="section-shipping tel"
                    required
                    maxLength={30}
                    placeholder={language === "es" ? "+57 300 000 0000" : "+1 000 000 0000"}
                    className={inputClass}
                  />
                </label>
              </div>
            </SectionCard>

            <SectionCard
              icon={MapPin}
              step="02"
              eyebrow="DELIVERY"
              title={language === "es" ? "Dirección de envío" : "Shipping address"}
              description={
                language === "es"
                  ? "Usaremos esta información para crear la orden correctamente en WooCommerce."
                  : "This information will be used to create the WooCommerce order correctly."
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <FieldLabel>{t("checkout.country")}</FieldLabel>
                  <select
                    name="country"
                    autoComplete="section-shipping country"
                    required
                    defaultValue=""
                    className={inputClass}
                  >
                    <option value="" disabled>
                      {t("checkout.chooseCountry")}
                    </option>
                    <option value="CO">Colombia</option>
                    <option value="MX">México</option>
                    <option value="US">United States</option>
                    <option value="OTHER">{t("checkout.otherCountry")}</option>
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <FieldLabel>{t("checkout.address")}</FieldLabel>
                  <input
                    name="address"
                    autoComplete="section-shipping address-line1"
                    required
                    maxLength={180}
                    placeholder={language === "es" ? "Calle, carrera y número" : "Street address"}
                    className={inputClass}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <FieldLabel optional>{t("checkout.addressExtra")}</FieldLabel>
                  <input
                    name="addressExtra"
                    autoComplete="section-shipping address-line2"
                    maxLength={100}
                    placeholder={language === "es" ? "Apartamento, unidad, referencia" : "Apartment, suite, unit"}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.city")}</FieldLabel>
                  <input
                    name="city"
                    autoComplete="section-shipping address-level2"
                    required
                    maxLength={100}
                    placeholder={language === "es" ? "Ciudad" : "City"}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.region")}</FieldLabel>
                  <input
                    name="region"
                    autoComplete="section-shipping address-level1"
                    required
                    maxLength={100}
                    placeholder={language === "es" ? "Departamento / estado" : "State / region"}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <FieldLabel>{t("checkout.postalCode")}</FieldLabel>
                  <input
                    name="postalCode"
                    autoComplete="section-shipping postal-code"
                    required
                    maxLength={20}
                    placeholder={language === "es" ? "Código postal" : "Postal code"}
                    className={inputClass}
                  />
                </label>

                <div className="hidden items-end sm:flex">
                  <div className="flex h-12 w-full items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.018] px-4 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-600">
                    <Truck size={13} className="text-cyan-300/60" />
                    {language === "es" ? "Envío calculado al confirmar" : "Shipping calculated at confirmation"}
                  </div>
                </div>

                <label className="block sm:col-span-2">
                  <FieldLabel optional>{t("checkout.notes")}</FieldLabel>
                  <textarea
                    name="notes"
                    rows={3}
                    maxLength={500}
                    placeholder={
                      language === "es"
                        ? "Indicaciones adicionales para la orden"
                        : "Additional order instructions"
                    }
                    className={textareaClass}
                  />
                </label>
              </div>
            </SectionCard>

            <div
              className="overflow-hidden rounded-[24px] border border-amber-300/15 bg-[#0b1320] p-4 shadow-[0_10px_28px_rgba(2,8,23,0.18)] sm:p-5"
            >
              <div>
              <div className="flex items-start gap-3">
                <input
                  id="researchAgreement"
                  type="checkbox"
                  name="researchAgreement"
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
                />
                <input type="hidden" name="legalVersion" value={LEGAL_VERSION} />
                <div className="font-mono text-[9px] leading-6 text-amber-100/60">
                  <label htmlFor="researchAgreement" className="cursor-pointer">
                    {language === "es"
                      ? "Confirmo que tengo 21 años o más y que los productos se destinarán exclusivamente a investigación legítima de laboratorio, nunca a uso humano ni veterinario. Acepto expresamente la "
                      : "I confirm that I am 21 or older and that the products will be used exclusively for legitimate laboratory research, never for human or veterinary use. I expressly accept the "}
                  </label>
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 hover:text-white"
                  >
                    {language === "es" ? "Política de privacidad" : "Privacy Policy"}
                  </a>
                  {language === "es" ? ", los " : ", the "}
                  <a
                    href="/terms-conditions"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 hover:text-white"
                  >
                    {language === "es" ? "Términos y condiciones" : "Terms & Conditions"}
                  </a>
                  {language === "es" ? ", el " : ", the "}
                  <a
                    href="/disclaimer"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 hover:text-white"
                  >
                    {language === "es" ? "Aviso legal" : "Legal Disclaimer"}
                  </a>
                  {language === "es" ? " y el " : ", and the "}
                  <a
                    href="/waiver-agreement"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4 hover:text-white"
                  >
                    {language === "es" ? "Acuerdo de exención" : "Waiver Agreement"}
                  </a>
                  .
                </div>
              </div>
              </div>
            </div>

            <a
              href="#order-review"
              className="flex min-h-[58px] items-center justify-between rounded-2xl border border-cyan-300/30 bg-cyan-300/[0.08] px-5 text-left text-cyan-100 shadow-[0_10px_30px_rgba(2,8,23,.25)] lg:hidden"
            >
              <span>
                <span className="block font-mono text-[7px] font-bold uppercase tracking-[0.16em] text-cyan-300/65">02 // {language === "es" ? "SIGUIENTE PASO" : "NEXT STEP"}</span>
                <span className="mt-1.5 block font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.08em] text-white">{language === "es" ? "Revisar pedido y continuar al pago" : "Review order and continue to payment"}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-cyan-300" />
            </a>
          </form>

          <aside id="order-review" className="lab-scroll-target order-2 min-w-0 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[28px] border border-cyan-300/16 bg-[#040d1e] shadow-[0_16px_46px_rgba(2,8,23,0.34)]">
              <div className="border-b border-white/[0.075] px-4 py-5 sm:px-5 sm:py-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300">
                      <ReceiptText size={17} />
                    </span>
                    <div>
                      <p className="font-mono text-[7px] font-bold uppercase tracking-[0.18em] text-cyan-300/65">
                        03 // ORDER REVIEW
                      </p>
                      <h2 className="mt-1.5 font-['Orbitron'] text-xs font-black uppercase tracking-[0.075em] text-white">
                        {language === "es" ? "Tu pedido" : "Your order"}
                      </h2>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.05] px-3 py-2 font-mono text-[7px] font-bold uppercase tracking-[0.08em] text-cyan-300">
                    {itemCount} {itemCount === 1 ? (language === "es" ? "PRODUCTO" : "ITEM") : language === "es" ? "PRODUCTOS" : "ITEMS"}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 p-3 sm:p-4 lg:max-h-[430px] lg:overflow-y-auto lg:pr-2 [scrollbar-color:rgba(34,211,238,.22)_transparent] [scrollbar-width:thin]">
                {cartItems.map((item) => {
                  const key = lineKey(item);
                  const image = item.images?.[0]?.src;
                  const quantity = safeNumber(item.quantity, 1);
                  const unitPrice = safeNumber(item.price, 0);

                  return (
                    <article
                      key={key}
                      className="grid grid-cols-[78px_minmax(0,1fr)] gap-3 rounded-[20px] border border-white/[0.075] bg-white/[0.022] p-2.5 transition-colors duration-150 hover:border-cyan-300/18 hover:bg-cyan-300/[0.02]"
                    >
                      <a
                        href={`/products/${item.slug}`}
                        className="relative aspect-square overflow-hidden rounded-xl border border-white/[0.06] bg-[#020617]"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-cyan-300/35">
                            <FlaskConical size={24} />
                          </div>
                        )}
                      </a>

                      <div className="min-w-0 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <a
                              href={`/products/${item.slug}`}
                              className="lab-line-clamp-2 font-['Orbitron'] text-[9px] font-black uppercase leading-4 tracking-[0.025em] text-white transition-colors hover:text-cyan-300"
                            >
                              {item.name}
                            </a>
                            {item.variantLabel && (
                              <p className="mt-1 font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-cyan-300/65">
                                {item.variantLabel}
                              </p>
                            )}
                            <p className="mt-1.5 font-mono text-[8px] text-slate-600">
                              {formatPrice(unitPrice)} {language === "es" ? "cada uno" : "each"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(key)}
                            aria-label={t("cart.remove")}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-red-300/[0.07] hover:text-red-300"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-[#020617]">
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, -1)}
                              aria-label={t("cart.decrease")}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-white/[0.04] hover:text-cyan-300"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="min-w-8 border-x border-white/[0.07] text-center font-mono text-[9px] font-bold text-white">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(key, 1)}
                              aria-label={t("cart.increase")}
                              className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-white/[0.04] hover:text-cyan-300"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <span className="font-['Orbitron'] text-[10px] font-black text-white">
                            {formatPrice(unitPrice * quantity)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="border-t border-white/[0.075] p-4 sm:p-5">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.022] p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-300">
                      <Tag size={14} />
                    </span>
                    <div>
                      <p className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em] text-white">
                        {language === "es" ? "¿Tienes un cupón?" : "Have a coupon?"}
                      </p>
                      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-slate-600">
                        {language === "es" ? "Se valida directamente en WordPress" : "Validated directly in WordPress"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(event) => {
                          const nextCode = normalizeCouponCode(event.target.value);
                          setCouponInput(nextCode);

                          if (couponState.status === "applied" && nextCode !== couponState.code) {
                            setCouponState({
                              status: "idle",
                              code: "",
                              discount: 0,
                              total: null,
                              message: "",
                            });
                            resetPreparedPayment();
                          } else if (couponState.status === "error") {
                            setCouponState((current) => ({ ...current, status: "idle", message: "" }));
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            validateCoupon(couponInput);
                          }
                        }}
                        placeholder={language === "es" ? "CÓDIGO" : "CODE"}
                        aria-label={language === "es" ? "Código de cupón" : "Coupon code"}
                        disabled={couponState.status === "checking"}
                        className="h-11 w-full rounded-xl border border-white/10 bg-[#020617] px-3 pr-9 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/45 disabled:opacity-60"
                      />
                      {couponInput && couponState.status !== "checking" && (
                        <button
                          type="button"
                          onClick={removeCoupon}
                          aria-label={language === "es" ? "Quitar cupón" : "Remove coupon"}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => validateCoupon(couponInput)}
                      disabled={!couponInput || couponState.status === "checking"}
                      className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 font-['Orbitron'] text-[7px] font-black uppercase tracking-[0.1em] text-[#020617] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {couponState.status === "checking" ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        language === "es" ? "APLICAR" : "APPLY"
                      )}
                    </button>
                  </div>

                  {couponState.message && (
                    <div
                      aria-live="polite"
                      className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
                        couponState.status === "applied"
                          ? "border-emerald-300/15 bg-emerald-300/[0.04] text-emerald-100/65"
                          : couponState.status === "error"
                            ? "border-red-300/15 bg-red-300/[0.04] text-red-100/65"
                            : "border-white/[0.07] text-slate-500"
                      }`}
                    >
                      {couponState.status === "applied" ? (
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-300" />
                      ) : couponState.status === "error" ? (
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-300" />
                      ) : (
                        <LoaderCircle size={12} className="mt-0.5 shrink-0 animate-spin text-cyan-300" />
                      )}
                      <p className="font-mono text-[8px] leading-4">{couponState.message}</p>
                    </div>
                  )}
                </div>

                {false && accountState.status === "connected" && rewards.status !== "unavailable" && rewards.available >= rewards.blockPoints && (
                  <div className="mt-5 overflow-hidden rounded-[22px] border border-blue-300/20 bg-[#071225]">
                    <div className="flex items-center justify-between gap-4 border-b border-blue-300/10 px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 bg-blue-300/[0.08] text-blue-200">
                          <Coins size={19} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-['Orbitron'] text-[11px] font-black uppercase tracking-[0.1em] text-white">
                            LAB POINTS
                          </p>
                          <p className="mt-1 font-mono text-[9px] leading-4 text-slate-400">
                            {language === "es"
                              ? "Usa tus puntos para reducir el total de esta compra."
                              : "Use your points to reduce this order total."}
                          </p>
                        </div>
                      </div>

                      {rewards.status === "checking" ? (
                        <LoaderCircle size={18} className="shrink-0 animate-spin text-blue-300" />
                      ) : (
                        <span className="shrink-0 rounded-full border border-blue-300/15 bg-blue-300/[0.06] px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-blue-200">
                          {language === "es" ? "DISPONIBLES" : "AVAILABLE"}
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div>
                          <p className="font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                            {language === "es" ? "TU SALDO ACTUAL" : "YOUR CURRENT BALANCE"}
                          </p>
                          <div className="mt-1.5 flex items-end gap-2">
                            <span className="font-['Orbitron'] text-2xl font-black leading-none tracking-[-0.04em] text-blue-200 sm:text-[28px]">
                              {rewards.available}
                            </span>
                            <span className="pb-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                              {language === "es" ? "puntos" : "points"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.07] bg-[#020817] px-4 py-3 text-left sm:text-right">
                          <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">
                            {language === "es" ? "VALOR DE CANJE" : "REDEMPTION VALUE"}
                          </p>
                          <p className="mt-1 font-mono text-[10px] font-bold text-white">
                            {rewards.blockPoints} pts = USD {rewards.blockUsd}
                          </p>
                        </div>
                      </div>

                      {rewards.available >= rewards.blockPoints ? (
                        <label className="mt-5 block">
                          <span className="mb-2 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-blue-100/75">
                            {language === "es" ? "¿CUÁNTOS PUNTOS QUIERES USAR?" : "HOW MANY POINTS DO YOU WANT TO USE?"}
                          </span>
                          <select
                            value={rewards.selected}
                            disabled={rewards.status === "checking"}
                            onChange={(event) => { resetPreparedPayment(); selectRewardPoints(event.target.value); }}
                            className="h-[52px] w-full rounded-xl border border-blue-300/25 bg-[#020617] px-4 font-mono text-[11px] font-bold text-white outline-none transition-colors focus:border-blue-300/55 focus:ring-2 focus:ring-blue-300/[0.07] disabled:cursor-wait disabled:opacity-60"
                          >
                            <option value="0">
                              {language === "es" ? "No usar puntos en esta compra" : "Do not use points on this order"}
                            </option>
                            {Array.from(
                              { length: Math.min(10, Math.floor(rewards.maxPoints / rewards.blockPoints)) },
                              (_, index) => (index + 1) * rewards.blockPoints,
                            ).map((points) => (
                              <option key={points} value={points}>
                                {language === "es" ? `Usar ${points} puntos` : `Use ${points} points`}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#020817] px-4 py-3.5">
                          <p className="font-mono text-[10px] leading-5 text-slate-400">
                            {language === "es"
                              ? `Te faltan ${Math.max(0, rewards.blockPoints - rewards.available)} puntos para realizar tu primer canje.`
                              : `You need ${Math.max(0, rewards.blockPoints - rewards.available)} more points for your first redemption.`}
                          </p>
                        </div>
                      )}

                      {rewards.selected > 0 && rewards.discount > 0 && (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.045] px-4 py-3">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-100/70">
                            {language === "es" ? "DESCUENTO CON PUNTOS" : "POINTS DISCOUNT"}
                          </span>
                          <span className="font-['Orbitron'] text-[12px] font-black text-emerald-300">
                            -{formatMoney(rewards.discount)}
                          </span>
                        </div>
                      )}

                      {rewards.message && (
                        <p className="mt-3 font-mono text-[9px] leading-5 text-blue-100/70">
                          {rewards.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-3 font-mono text-[9px]">
                  <div className="flex justify-between gap-4 text-slate-500">
                    <span>{t("checkout.subtotal")}</span>
                    <span className="text-slate-300">{formatPrice(cartTotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between gap-4 text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <Tag size={11} /> {appliedCoupon.code}
                      </span>
                      <span>-{formatPrice(appliedCoupon.discount)}</span>
                    </div>
                  )}

                  {rewards.discount > 0 && (
                    <div className="flex justify-between gap-4 text-blue-300">
                      <span>LAB Points ({rewards.selected})</span>
                      <span>-{formatPrice(rewards.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 text-slate-500">
                    <span>{t("checkout.shipping")}</span>
                    <span className="text-cyan-300">{t("checkout.calculatedLater")}</span>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-white/[0.08] pt-4">
                    <div>
                      <span className="font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.08em] text-white">
                        {t("checkout.total")}
                      </span>
                      <p className="mt-1 font-mono text-[7px] uppercase tracking-[0.08em] text-slate-700">
                        {language === "es" ? "Total antes del envío" : "Total before shipping"}
                      </p>
                    </div>
                    <span className="font-['Orbitron'] text-2xl font-black tracking-[-0.04em] text-cyan-300">
                      {formatPrice(checkoutTotal)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[22px] border-2 border-cyan-300/35 bg-[#061225] shadow-[0_10px_28px_rgba(2,8,23,0.2)]">
                  <div className="border-b border-cyan-300/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-300">
                        <CreditCard size={16} />
                      </span>
                      <div>
                        <p className="font-mono text-[7px] font-bold uppercase tracking-[0.17em] text-cyan-300/70">
                          {language === "es" ? "PAGO SEGURO CON BOLD" : "SECURE PAYMENT WITH BOLD"}
                        </p>
                        <p className="mt-1.5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.07em] text-white">
                          {currency === "COP"
                            ? language === "es"
                              ? "Tarjeta, PSE y métodos habilitados"
                              : "Card, PSE and enabled methods"
                            : language === "es"
                              ? "Tarjeta de crédito o débito"
                              : "Credit or debit card"}
                        </p>
                      </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/[0.10] px-2.5 py-1.5 font-mono text-[6px] font-black uppercase tracking-[0.1em] text-cyan-200">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-300 text-[#020617]">
                          <Check size={10} strokeWidth={3} />
                        </span>
                        {language === "es" ? "SELECCIONADO" : "SELECTED"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <p className="mb-2 font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      {language === "es" ? "Tarjetas aceptadas" : "Accepted cards"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <VisaLogo />
                      <MastercardLogo />
                      <AmexLogo />
                      <DinersLogo />
                      <DiscoverLogo />
                      <CodensaLogo />
                    </div>

                    {currency === "COP" && (
                      <>
                        <p className="mb-2 mt-4 font-mono text-[7px] font-bold uppercase tracking-[0.12em] text-slate-500">
                          {language === "es" ? "Bancos y billeteras" : "Banks and wallets"}
                        </p>
                        <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                          <BancolombiaLogo />
                          <NequiLogo />
                          <PseLogo />
                        </div>
                      </>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#020617]/75 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <LockKeyhole size={12} className="text-cyan-300" />
                        <span className="font-mono text-[7px] font-bold uppercase tracking-[0.1em] text-slate-500">
                          {language === "es" ? "Sesión protegida" : "Protected session"}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[7px] font-bold uppercase tracking-[0.1em] ${
                          paymentOrder
                            ? paymentOrder.environment === "test"
                              ? "text-amber-300"
                              : "text-emerald-300"
                            : "text-cyan-300"
                        }`}
                      >
                        {paymentOrder
                          ? paymentOrder.environment === "test"
                            ? "TEST MODE"
                            : "READY"
                          : "SECURE"}
                      </span>
                    </div>
                  </div>

                  {paymentOrder && (
                    <div className="border-t border-white/[0.07] px-4 py-3 font-mono text-[7px] uppercase leading-4 text-slate-600">
                      <div className="flex justify-between gap-3">
                        <span>{language === "es" ? "Orden preparada" : "Order prepared"}</span>
                        <b className="text-slate-300">#{paymentOrder.number}</b>
                      </div>
                      <div className="mt-1 flex justify-between gap-3">
                        <span>{language === "es" ? "Total firmado" : "Signed total"}</span>
                        <b className="text-cyan-300">
                          {paymentOrder.currency} {paymentOrder.amount}
                        </b>
                      </div>
                    </div>
                  )}
                </div>

                {currency === "MXN" && (
                  <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.045] p-4">
                    <p className="font-mono text-[8px] leading-5 text-amber-100/65">
                      {language === "es"
                        ? "Los precios pueden visualizarse en MXN, pero Bold debe procesar este pago en USD."
                        : "Prices can be displayed in MXN, but Bold must process this payment in USD."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrency("USD")}
                      className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-amber-200 px-4 font-['Orbitron'] text-[7px] font-black uppercase tracking-[0.1em] text-[#171004] hover:bg-white"
                    >
                      {language === "es" ? "CAMBIAR A USD" : "SWITCH TO USD"}
                    </button>
                  </div>
                )}

                <button
                  form="lab-checkout-form"
                  type="submit"
                  onClick={
                    currency === "MXN"
                      ? (event) => {
                          event.preventDefault();
                          setPaymentError("");
                          setCurrency("USD");
                        }
                      : undefined
                  }
                  disabled={
                    formStatus === "preparing" ||
                    cartPricing ||
                    Boolean(cartPricingError) ||
                    couponState.status === "checking"
                  }
                  className="mt-5 flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.12em] text-[#020617] shadow-[0_8px_22px_rgba(34,211,238,0.14)] transition-colors duration-150 hover:bg-white disabled:cursor-wait disabled:opacity-55"
                >
                  {formStatus === "preparing" ? (
                    <>
                      <LoaderCircle size={15} className="animate-spin" />
                      {language === "es" ? "VERIFICANDO ORDEN" : "VERIFYING ORDER"}
                    </>
                  ) : paymentOrder ? (
                    <>
                      {language === "es" ? "ABRIR PAGO SEGURO" : "OPEN SECURE PAYMENT"}
                      <LockKeyhole size={14} />
                    </>
                  ) : currency === "MXN" ? (
                    <>
                      {language === "es" ? "CAMBIAR A USD PARA PAGAR" : "SWITCH TO USD TO PAY"}
                      <ChevronRight size={15} />
                    </>
                  ) : (
                    <>
                      {language === "es" ? "CONTINUAR AL PAGO" : "CONTINUE TO PAYMENT"}
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>

                <p className="mt-3 px-2 text-center font-mono text-[7px] uppercase leading-4 tracking-[0.08em] text-slate-700">
                  {language === "es"
                    ? `El total y cualquier cupón se vuelven a validar en el servidor antes de crear la orden. Versión legal ${LEGAL_VERSION}.`
                    : `The total and any coupon are revalidated on the server before creating the order. Legal version ${LEGAL_VERSION}.`}
                </p>

                {paymentError && (
                  <div
                    aria-live="polite"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-red-300/15 bg-red-300/[0.04] p-3"
                  >
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-300" />
                    <p className="font-mono text-[8px] leading-5 text-red-100/70">{paymentError}</p>
                  </div>
                )}

                {formStatus === "ready" && !paymentError && (
                  <div
                    aria-live="polite"
                    className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.04] p-3"
                  >
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-300" />
                    <p className="font-mono text-[8px] leading-5 text-emerald-100/65">
                      {language === "es"
                        ? "La orden quedó preparada. Si cerraste Bold, puedes abrir la misma sesión nuevamente."
                        : "The order is ready. If you closed Bold, you can reopen the same session."}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 border-t border-white/[0.07]">
                {[
                  [ShieldCheck, t("checkout.secure")],
                  [PackageCheck, t("checkout.discreet")],
                  [CheckCircle2, t("checkout.traceable")],
                ].map(([Icon, label], index) => (
                  <div
                    key={label}
                    className={`flex min-h-[74px] flex-col items-center justify-center gap-2 px-2 text-center ${
                      index < 2 ? "border-r border-white/[0.07]" : ""
                    }`}
                  >
                    <Icon size={13} className="text-cyan-300" />
                    <span className="font-mono text-[6px] font-bold uppercase leading-3 tracking-[0.08em] text-slate-600">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
