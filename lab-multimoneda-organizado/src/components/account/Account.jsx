import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  Copy,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LayoutDashboard,
  CircleDollarSign,
  ContactRound,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCw,
  Save,
  ShieldCheck,
  Truck,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const COPY = {
  es: {
    eyebrow: "Portal privado // LAB_CORE ID",
    title: "Tu cuenta,",
    accent: "todo bajo control.",
    intro: "Crea tu acceso, guarda tus datos y consulta el estado de tus pedidos desde un solo lugar.",
    privateAccess: "Acceso privado",
    privateText: "Tu sesión se protege en el servidor y no exponemos credenciales de WordPress en el navegador.",
    orderAccess: "Historial de pedidos",
    orderText: "Consulta pedidos de WooCommerce vinculados a tu correo.",
    profileAccess: "Checkout más rápido",
    profileText: "Guarda tus datos básicos para preparar futuras compras con menos pasos.",
    researchOnly: "Acceso exclusivo para mayores de 21 años y compras de investigación.",
    login: "Iniciar sesión",
    register: "Crear cuenta",
    email: "Correo electrónico",
    password: "Contraseña",
    passwordProgress: "Progreso de seguridad",
    passwordBuilding: "Sigue avanzando",
    passwordReady: "Requisito completado",
    passwordMedium: "Seguridad media",
    passwordStrong: "Seguridad alta",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    firstName: "Nombre",
    lastName: "Apellido",
    phone: "Teléfono",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    loginButton: "Entrar a mi cuenta",
    registerButton: "Crear mi cuenta",
    forgot: "Olvidé mi contraseña",
    forgotTitle: "Recupera tu acceso",
    forgotText: "Escribe el correo de tu cuenta. Si existe, recibirás un enlace seguro para crear una contraseña nueva.",
    sendReset: "Enviar enlace de recuperación",
    backLogin: "Volver al inicio de sesión",
    resetTitle: "Crea una contraseña nueva",
    resetText: "El enlace se validará de forma segura en WordPress y dejará sin acceso a las sesiones anteriores.",
    resetButton: "Guardar nueva contraseña",
    age: "Confirmo que tengo 21 años o más y que usaré la cuenta únicamente para compras de investigación.",
    welcomeOffer: "Beneficio de bienvenida",
    welcomeOfferText: "Al crear tu cuenta recibirás por correo un código personal del 10%, de un solo uso y asociado a tu email.",
    loading: "Verificando sesión",
    greeting: "Bienvenido",
    dashboardText: "Administra tu identidad, pedidos y seguridad.",
    verifiedSession: "Sesión protegida",
    overview: "Resumen",
    overviewTitle: "Balance general",
    overviewText: "Una vista rápida de tus pedidos, datos guardados, beneficio y seguridad.",
    totalOrders: "Pedidos totales",
    accumulatedValue: "Valor acumulado",
    profileComplete: "Perfil completado",
    activeBenefit: "Beneficio activo",
    recentOrder: "Pedido más reciente",
    viewOrders: "Ver todos los pedidos",
    noRecentOrder: "Aún no hay pedidos para mostrar.",
    accountData: "Estado de tus datos",
    accountDataText: "Completa tu información para avanzar más rápido en el checkout.",
    contactReady: "Contacto completo",
    contactPending: "Faltan datos de contacto",
    shippingReady: "Entrega preparada",
    shippingPending: "Falta dirección de entrega",
    editData: "Completar o editar datos",
    protectedAccount: "Cuenta protegida",
    protectedAccountText: "Sesión privada activa y cambio de contraseña disponible.",
    manageSecurity: "Administrar seguridad",
    memberSince: "Miembro desde",
    available: "Disponible",
    profile: "Perfil",
    orders: "Pedidos",
    security: "Seguridad",
    logout: "Cerrar sesión",
    personalTitle: "Datos personales",
    personalText: "Información básica asociada a tu cuenta de cliente.",
    emailLocked: "El correo principal no se cambia desde este panel por seguridad.",
    shippingTitle: "Datos de entrega",
    shippingText: "Déjalos listos para utilizarlos en el checkout.",
    country: "País",
    address1: "Dirección",
    address2: "Apartamento o referencia",
    city: "Ciudad",
    state: "Departamento / estado",
    postcode: "Código postal",
    saveProfile: "Guardar cambios",
    profileSaved: "Tus datos se actualizaron correctamente.",
    ordersTitle: "Historial de pedidos",
    ordersText: "Pedidos vinculados a este usuario en WooCommerce.",
    noOrders: "Todavía no tienes pedidos registrados.",
    noOrdersText: "Cuando completes tu primera compra, aparecerá aquí con su estado.",
    explore: "Explorar productos",
    order: "Pedido",
    items: "productos",
    total: "Total",
    created: "Creado",
    securityTitle: "Cambiar contraseña",
    securityText: "Usa al menos 10 caracteres. Al cambiarla, las demás sesiones se cerrarán automáticamente.",
    changePassword: "Actualizar contraseña",
    passwordChanged: "Contraseña actualizada. Esta sesión sigue activa y las anteriores fueron cerradas.",
    couponTitle: "Tu 10% de bienvenida",
    couponText: "Código personal, de un solo uso y asociado a tu correo.",
    copied: "Código copiado",
    expires: "Vence",
    pendingCoupon: "El beneficio se mostrará aquí cuando WooCommerce lo genere.",
    resetSent: "Si encontramos una cuenta con ese correo, recibirás el enlace de recuperación en unos minutos.",
    resetDone: "Contraseña actualizada. Tu nueva sesión segura ya está activa.",
    accountCreated: "Cuenta creada correctamente. Enviamos tu cupón personal de bienvenida al correo registrado.",
    loggedIn: "Sesión iniciada correctamente.",
    unavailableTitle: "Servicio de cuenta no disponible",
    unavailableText: "Instala y activa el plugin LAB_CORE Accounts en WordPress y revisa WORDPRESS_API_URL en el servidor.",
    retry: "Volver a intentar",
    errors: {
      INVALID_CREDENTIALS: "El correo o la contraseña no coinciden.",
      EMAIL_EXISTS: "Los datos de registro no son válidos.",
      INVALID_REGISTRATION: "Los datos de registro no son válidos.",
      INVALID_EMAIL: "Escribe un correo electrónico válido.",
      WEAK_PASSWORD: "La contraseña debe tener al menos 10 caracteres.",
      PASSWORD_MISMATCH: "Las contraseñas no coinciden.",
      AGE_REQUIRED: "Debes confirmar que tienes 21 años o más.",
      INVALID_RESET_KEY: "El enlace es inválido o ya venció. Solicita uno nuevo.",
      CURRENT_PASSWORD_INVALID: "La contraseña actual no es correcta.",
      UNAUTHORIZED: "Tu sesión terminó. Inicia sesión nuevamente.",
      RATE_LIMITED: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
      ACCOUNT_API_NOT_CONFIGURED: "El servicio de cuenta todavía no está conectado.",
      ACCOUNT_API_UNAVAILABLE: "No pudimos comunicarnos con WordPress en este momento.",
      ORIGIN_NOT_ALLOWED: "El dominio de la tienda no está autorizado por el servicio de cuentas.",
      INVALID_FIELDS: "Revisa los campos marcados e inténtalo de nuevo.",
      DEFAULT: "No pudimos completar la acción. Inténtalo nuevamente.",
    },
  },
  en: {
    eyebrow: "Private portal // LAB_CORE ID",
    title: "Your account,",
    accent: "under control.",
    intro: "Create your access, save your details, and review your order status in one place.",
    privateAccess: "Private access",
    privateText: "Your session is protected server-side and WordPress credentials are never exposed in the browser.",
    orderAccess: "Order history",
    orderText: "Review WooCommerce orders linked to your email.",
    profileAccess: "Faster checkout",
    profileText: "Save your basic details to prepare future purchases with fewer steps.",
    researchOnly: "Access is limited to customers aged 21+ and research purchases.",
    login: "Sign in",
    register: "Create account",
    email: "Email address",
    password: "Password",
    passwordProgress: "Security progress",
    passwordBuilding: "Keep going",
    passwordReady: "Requirement completed",
    passwordMedium: "Medium security",
    passwordStrong: "High security",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    showPassword: "Show password",
    hidePassword: "Hide password",
    loginButton: "Access my account",
    registerButton: "Create my account",
    forgot: "I forgot my password",
    forgotTitle: "Recover your access",
    forgotText: "Enter your account email. If it exists, you will receive a secure link to create a new password.",
    sendReset: "Send recovery link",
    backLogin: "Back to sign in",
    resetTitle: "Create a new password",
    resetText: "WordPress will securely validate this link and revoke all previous sessions.",
    resetButton: "Save new password",
    age: "I confirm I am 21 or older and will use this account only for research purchases.",
    welcomeOffer: "Welcome benefit",
    welcomeOfferText: "When you create an account, we will email you a personal, single-use 10% code linked to your address.",
    loading: "Checking session",
    greeting: "Welcome",
    dashboardText: "Manage your identity, orders, and security.",
    verifiedSession: "Protected session",
    overview: "Overview",
    overviewTitle: "Account overview",
    overviewText: "A quick view of your orders, saved details, benefit, and security.",
    totalOrders: "Total orders",
    accumulatedValue: "Accumulated value",
    profileComplete: "Profile completed",
    activeBenefit: "Active benefit",
    recentOrder: "Most recent order",
    viewOrders: "View all orders",
    noRecentOrder: "There are no orders to display yet.",
    accountData: "Your data status",
    accountDataText: "Complete your information to move faster through checkout.",
    contactReady: "Contact complete",
    contactPending: "Contact details missing",
    shippingReady: "Shipping ready",
    shippingPending: "Shipping address missing",
    editData: "Complete or edit details",
    protectedAccount: "Protected account",
    protectedAccountText: "Private session active and password controls available.",
    manageSecurity: "Manage security",
    memberSince: "Member since",
    available: "Available",
    profile: "Profile",
    orders: "Orders",
    security: "Security",
    logout: "Sign out",
    personalTitle: "Personal details",
    personalText: "Basic information associated with your customer account.",
    emailLocked: "For security, the primary email cannot be changed from this panel.",
    shippingTitle: "Shipping details",
    shippingText: "Keep them ready for checkout.",
    country: "Country",
    address1: "Address",
    address2: "Apartment or reference",
    city: "City",
    state: "State / region",
    postcode: "Postal code",
    saveProfile: "Save changes",
    profileSaved: "Your details were updated successfully.",
    ordersTitle: "Order history",
    ordersText: "Orders linked to this WooCommerce customer.",
    noOrders: "You do not have any orders yet.",
    noOrdersText: "Your first completed purchase will appear here with its status.",
    explore: "Explore products",
    order: "Order",
    items: "items",
    total: "Total",
    created: "Created",
    securityTitle: "Change password",
    securityText: "Use at least 10 characters. Other sessions will be automatically closed when it changes.",
    changePassword: "Update password",
    passwordChanged: "Password updated. This session remains active and previous sessions were closed.",
    couponTitle: "Your 10% welcome code",
    couponText: "A personal, single-use code linked to your email.",
    copied: "Code copied",
    expires: "Expires",
    pendingCoupon: "Your benefit will appear here when WooCommerce generates it.",
    resetSent: "If an account matches that email, you will receive a recovery link in a few minutes.",
    resetDone: "Password updated. Your new secure session is now active.",
    accountCreated: "Account created. We sent your personal welcome coupon to the registered email.",
    loggedIn: "You are now signed in.",
    unavailableTitle: "Account service unavailable",
    unavailableText: "Install and activate LAB_CORE Accounts in WordPress and check WORDPRESS_API_URL on the server.",
    retry: "Try again",
    errors: {
      INVALID_CREDENTIALS: "The email or password does not match.",
      EMAIL_EXISTS: "The registration details are invalid.",
      INVALID_REGISTRATION: "The registration details are invalid.",
      INVALID_EMAIL: "Enter a valid email address.",
      WEAK_PASSWORD: "Your password must contain at least 10 characters.",
      PASSWORD_MISMATCH: "The passwords do not match.",
      AGE_REQUIRED: "You must confirm that you are 21 or older.",
      INVALID_RESET_KEY: "This link is invalid or expired. Request a new one.",
      CURRENT_PASSWORD_INVALID: "The current password is incorrect.",
      UNAUTHORIZED: "Your session has ended. Please sign in again.",
      RATE_LIMITED: "Too many attempts. Wait a few minutes and try again.",
      ACCOUNT_API_NOT_CONFIGURED: "The account service is not connected yet.",
      ACCOUNT_API_UNAVAILABLE: "We could not reach WordPress right now.",
      ORIGIN_NOT_ALLOWED: "The store domain is not authorized by the account service.",
      INVALID_FIELDS: "Review the highlighted fields and try again.",
      DEFAULT: "We could not complete the action. Please try again.",
    },
  },
};

async function accountRequest(action, { method = "POST", body } = {}) {
  const response = await fetch(`/api/account/${action}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({ ok: false, code: "INVALID_RESPONSE" }));

  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || payload.code || "REQUEST_FAILED");
    error.code = payload.code || (response.status === 401 ? "UNAUTHORIZED" : "DEFAULT");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function closeAccountSession() {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await fetch("/api/account/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
        },
        body: "{}",
      });
    } catch {
      // The verification below determines whether the cookie was removed.
    }

    try {
      const verification = await fetch(`/api/account/me?after_logout=${Date.now()}-${attempt}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (verification.status === 401) return true;
    } catch {
      // Retry once before reporting that the session could not be closed.
    }
  }

  return false;
}

function broadcastAccountSession(user, preservePanel = false) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lab:account-session", { detail: { user: user || null, preservePanel } }));
}

function Field({ label, name, type = "text", autoComplete, required = false, readOnly = false, defaultValue = "", className = "", onValueChange }) {
  const [visible, setVisible] = useState(false);
  const password = type === "password";

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.13em] text-slate-400">{label}</span>
      <span className="relative block">
        <input
          type={password && visible ? "text" : type}
          name={name}
          autoComplete={autoComplete}
          required={required}
          readOnly={readOnly}
          defaultValue={defaultValue}
          maxLength={type === "email" ? 160 : password ? 4096 : 180}
          onInput={(event) => onValueChange?.(event.currentTarget.value)}
          className={`h-12 w-full border border-white/10 bg-[#020617] px-4 pr-12 font-mono text-xs text-white outline-none transition-colors placeholder:text-slate-700 focus:border-cyan-300/50 ${readOnly ? "cursor-not-allowed text-slate-500" : ""}`}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition-colors hover:text-cyan-300"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </span>
    </label>
  );
}

function PasswordProgress({ value, copy }) {
  const length = Array.from(value || "").length;
  const progress = Math.min(100, (length / 10) * 100);
  const variety = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const complete = length >= 10;
  const label = !complete
    ? copy.passwordBuilding
    : variety >= 3 || length >= 14
      ? copy.passwordStrong
      : variety >= 2
        ? copy.passwordMedium
        : copy.passwordReady;
  const color = !complete ? "bg-cyan-300" : variety >= 3 || length >= 14 ? "bg-emerald-300" : "bg-amber-300";

  return (
    <div className="border border-white/[0.08] bg-[#020617]/70 p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.11em]">
        <span className="text-slate-500">{copy.passwordProgress}</span>
        <span className={complete ? "text-emerald-300" : "text-cyan-300"}>{length}/10</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden bg-white/[0.07]">
        <span className={`block h-full transition-[width,background-color] duration-300 ${color}`} style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
    </div>
  );
}

function Feedback({ feedback }) {
  if (!feedback?.message) return null;
  const success = feedback.type === "success";

  return (
    <div className={`mt-5 flex items-start gap-3 border p-4 font-mono text-[10px] leading-5 ${success ? "border-emerald-300/20 bg-emerald-300/[0.05] text-emerald-100/80" : "border-red-300/20 bg-red-300/[0.05] text-red-100/80"}`} role="status">
      {success ? <Check size={15} className="mt-0.5 shrink-0 text-emerald-300" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-300" />}
      <span>{feedback.message}</span>
    </div>
  );
}

function ActionButton({ busy, children, icon: Icon = ArrowRight }) {
  return (
    <button type="submit" disabled={busy} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 bg-cyan-300 px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-[#020617] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60">
      {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Icon size={15} />}
      {children}
    </button>
  );
}

export default function Account() {
  const { language } = useLanguage();
  const c = COPY[language] || COPY.es;
  const [authState, setAuthState] = useState("loading");
  const [view, setView] = useState("login");
  const [user, setUser] = useState(null);
  const [activePanel, setActivePanel] = useState("overview");
  const [orders, setOrders] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [ordersBusy, setOrdersBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resetData, setResetData] = useState({ key: "", login: "" });
  const [copied, setCopied] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const sessionRequestRef = useRef(0);

  const errorMessage = (error) => c.errors[error?.code] || c.errors.DEFAULT;

  const checkSession = async () => {
    const requestId = ++sessionRequestRef.current;
    setAuthState("loading");
    try {
      const payload = await accountRequest("me", { method: "GET" });
      if (requestId !== sessionRequestRef.current) return;
      setUser(payload.user);
      setAuthState("authenticated");
    } catch (error) {
      if (requestId !== sessionRequestRef.current) return;
      setUser(null);
      setAuthState(error.code === "ACCOUNT_API_NOT_CONFIGURED" || error.code === "ACCOUNT_API_UNAVAILABLE" ? "unavailable" : "guest");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key") || "";
    const login = params.get("login") || "";

    if (params.get("view") === "reset" && key && login) {
      setResetData({ key, login });
      setView("reset");
      setAuthState("guest");
      return;
    }

    checkSession();
  }, []);

  useEffect(() => {
    const syncSession = (event) => {
      sessionRequestRef.current++;
      const nextUser = event.detail?.user || null;
      if (nextUser) {
        setUser(nextUser);
        setAuthState("authenticated");
        if (!event.detail?.preservePanel) {
          setOrders(null);
          setOrderSummary(null);
          setActivePanel("overview");
        }
        return;
      }

      setUser(null);
      setOrders(null);
      setOrderSummary(null);
      setAuthState("guest");
      setView("login");
      setFeedback(null);
    };

    window.addEventListener("lab:account-session", syncSession);
    return () => window.removeEventListener("lab:account-session", syncSession);
  }, []);

  useEffect(() => {
    if (!["overview", "orders"].includes(activePanel) || orders !== null || authState !== "authenticated") return;

    const loadOrders = async () => {
      setOrdersBusy(true);
      try {
        const payload = await accountRequest("orders", { method: "GET" });
        setOrders(Array.isArray(payload.orders) ? payload.orders : []);
        setOrderSummary(payload.summary || null);
      } catch (error) {
        setFeedback({ type: "error", message: errorMessage(error) });
        setOrders([]);
      } finally {
        setOrdersBusy(false);
      }
    };

    loadOrders();
  }, [activePanel, authState, orders]);

  useEffect(() => {
    if (authState !== "authenticated") return undefined;
    let active = true;
    const loadRewards = () => {
      accountRequest("rewards", { method: "GET" })
        .then((payload) => { if (active) setRewards(payload); })
        .catch(() => { if (active) setRewards({ unavailable: true, available: 0, pending: 0, history: [] }); });
    };
    const refreshVisibleBalance = () => {
      if (document.visibilityState === "visible") loadRewards();
    };

    loadRewards();
    window.addEventListener("focus", refreshVisibleBalance);
    window.addEventListener("lab:rewards-change", loadRewards);
    document.addEventListener("visibilitychange", refreshVisibleBalance);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshVisibleBalance);
      window.removeEventListener("lab:rewards-change", loadRewards);
      document.removeEventListener("visibilitychange", refreshVisibleBalance);
    };
  }, [authState, activePanel]);

  const switchView = (next) => {
    setView(next);
    setFeedback(null);
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    sessionRequestRef.current++;
    setBusy(true);
    setFeedback(null);
    const data = new FormData(event.currentTarget);
    try {
      const payload = await accountRequest("login", { body: { email: data.get("email"), password: data.get("password") } });
      setUser(payload.user);
      setAuthState("authenticated");
      setActivePanel("overview");
      broadcastAccountSession(payload.user);
      setFeedback({ type: "success", message: c.loggedIn });
    } catch (error) {
      setFeedback({ type: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    sessionRequestRef.current++;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("password") !== data.get("confirm_password")) {
      setFeedback({ type: "error", message: c.errors.PASSWORD_MISMATCH });
      return;
    }

    setBusy(true);
    setFeedback(null);
    try {
      const payload = await accountRequest("register", {
        body: {
          first_name: data.get("first_name"),
          last_name: data.get("last_name"),
          email: data.get("email"),
          password: data.get("password"),
          age_confirmed: data.get("age_confirmed") === "on",
          language,
        },
      });
      setUser(payload.user);
      setAuthState("authenticated");
      setActivePanel("overview");
      broadcastAccountSession(payload.user);
      setFeedback({ type: "success", message: c.accountCreated });
      form.reset();
      setRegisterPassword("");
    } catch (error) {
      setFeedback({ type: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const submitForgot = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setFeedback(null);
    try {
      await accountRequest("forgot-password", { body: { email: data.get("email"), language } });
      setFeedback({ type: "success", message: c.resetSent });
      form.reset();
    } catch {
      // Recovery responses are intentionally neutral so the UI never reveals
      // whether an account exists or replaces a delivered email with a false
      // client-side error.
      setFeedback({ type: "success", message: c.resetSent });
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    sessionRequestRef.current++;
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm_password")) {
      setFeedback({ type: "error", message: c.errors.PASSWORD_MISMATCH });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const payload = await accountRequest("reset-password", { body: { ...resetData, password: data.get("password") } });
      window.history.replaceState({}, "", "/cuenta");
      setResetData({ key: "", login: "" });
      setResetPassword("");
      setUser(payload.user);
      setAuthState("authenticated");
      setActivePanel("overview");
      broadcastAccountSession(payload.user);
      setFeedback({ type: "success", message: c.resetDone });
    } catch (error) {
      setFeedback({ type: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setFeedback(null);
    try {
      const payload = await accountRequest("me", { method: "PATCH", body: data });
      setUser(payload.user);
      broadcastAccountSession(payload.user, true);
      setFeedback({ type: "success", message: c.profileSaved });
    } catch (error) {
      setFeedback({ type: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (data.get("new_password") !== data.get("confirm_password")) {
      setFeedback({ type: "error", message: c.errors.PASSWORD_MISMATCH });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const payload = await accountRequest("change-password", {
        body: { current_password: data.get("current_password"), new_password: data.get("new_password") },
      });
      if (payload.user) setUser(payload.user);
      form.reset();
      setSecurityPassword("");
      setFeedback({ type: "success", message: c.passwordChanged });
    } catch (error) {
      setFeedback({ type: "error", message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    // Invalidate every session request that started before logout. Without this,
    // a delayed /me response can restore the authenticated UI after sign-out.
    sessionRequestRef.current++;
    setBusy(true);
    setFeedback(null);
    try {
      const closed = await closeAccountSession();
      if (!closed) {
        setFeedback({ type: "error", message: errorMessage({ code: "DEFAULT" }) });
        await checkSession();
        return;
      }

      setUser(null);
      setOrders(null);
      setOrderSummary(null);
      setRewards(null);
      setAuthState("guest");
      setActivePanel("overview");
      setView("login");
      broadcastAccountSession(null);
      window.location.replace(`/?logged_out=${Date.now()}`);
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(language === "es" ? "es-CO" : "en-US", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };

  const formatMoney = (amount, currency = "USD") => {
    try {
      return new Intl.NumberFormat(language === "es" ? "es-CO" : "en-US", { style: "currency", currency }).format(Number(amount || 0));
    } catch {
      return `${currency} ${amount}`;
    }
  };

  const copyCoupon = async () => {
    if (!user?.welcome_discount?.code) return;
    await navigator.clipboard.writeText(user.welcome_discount.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const panels = useMemo(() => [
    { key: "overview", label: c.overview, icon: LayoutDashboard },
    { key: "points", label: language === "es" ? "Mis puntos" : "My points", icon: CircleDollarSign },
    { key: "profile", label: c.profile, icon: UserRound },
    { key: "orders", label: c.orders, icon: PackageCheck },
    { key: "security", label: c.security, icon: ShieldCheck },
  ], [c, language]);

  if (authState === "loading") {
    return (
      <main className="flex min-h-[72vh] items-center justify-center px-4 pt-[var(--lab-mobile-page-top)]">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
          <LoaderCircle size={18} className="animate-spin" /> {c.loading}
        </div>
      </main>
    );
  }

  if (authState === "unavailable") {
    return (
      <main className="min-h-[76vh] px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pt-[12rem] lg:px-8 lg:pt-[13rem]">
        <section className="mx-auto max-w-[760px] border border-amber-300/20 bg-[#061021]/80 px-6 py-14 text-center sm:px-10 sm:py-20">
          <AlertTriangle size={30} className="mx-auto text-amber-300" />
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300">ACCOUNT API // OFFLINE</p>
          <h1 className="mt-4 font-['Orbitron'] text-2xl font-black uppercase text-white sm:text-3xl">{c.unavailableTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl font-mono text-[11px] leading-6 text-slate-400">{c.unavailableText}</p>
          <button type="button" onClick={checkSession} className="mt-8 inline-flex min-h-12 items-center gap-2 bg-cyan-300 px-6 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.14em] text-[#020617] hover:bg-white"><RefreshCw size={14} /> {c.retry}</button>
        </section>
      </main>
    );
  }

  if (authState === "authenticated" && user) {
    const address = user.address || {};
    const orderList = Array.isArray(orders) ? orders : [];
    const recentOrder = orderList[0] || null;
    const payableOrders = orderList.filter((order) => !["cancelled", "refunded", "failed"].includes(order.status));
    const accumulatedValue = Number(orderSummary?.total_spent ?? payableOrders.reduce((total, order) => total + Number(order.total || 0), 0));
    const totalOrders = Number(orderSummary?.total_orders ?? orderList.length);
    const currency = orderSummary?.currency || payableOrders[0]?.currency || orderList[0]?.currency || "USD";
    const profileFields = [user.first_name, user.last_name, user.email, user.phone, address.country, address.address_1, address.city, address.postcode];
    const profilePercent = Math.round((profileFields.filter((value) => String(value || "").trim()).length / profileFields.length) * 100);
    const contactReady = Boolean(user.email && user.phone && user.first_name && user.last_name);
    const shippingReady = Boolean(address.country && address.address_1 && address.city && address.postcode);
    return (
      <main className="px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
        <div className="mx-auto max-w-[1180px]">
          <section className="border border-cyan-300/15 bg-[#061021]/70 p-5 sm:p-7 lg:p-9">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">ACCOUNT // {String(user.id).padStart(6, "0")}</p>
                <h1 className="mt-3 font-['Orbitron'] text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">{c.greeting}, {user.first_name || user.display_name}</h1>
                <p className="mt-3 font-mono text-[11px] text-slate-400">{c.dashboardText}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex min-h-10 items-center gap-2 border border-emerald-300/15 bg-emerald-300/[0.04] px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-emerald-300"><ShieldCheck size={14} /> {c.verifiedSession}</span>
                <button type="button" onClick={logout} disabled={busy} className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-slate-400 transition-colors hover:border-red-300/25 hover:text-red-300"><LogOut size={14} /> {c.logout}</button>
              </div>
            </div>
          </section>

          {user.welcome_discount?.code && (
            <section className="mt-5 grid gap-5 border border-cyan-300/20 bg-[linear-gradient(110deg,rgba(34,211,238,.09),rgba(2,6,23,.9)_56%)] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-300"><BadgePercent size={19} /></span>
                <div><h2 className="font-['Orbitron'] text-xs font-black uppercase tracking-[0.08em] text-white">{c.couponTitle}</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-400">{c.couponText} {user.welcome_discount.expires_at ? `${c.expires}: ${formatDate(user.welcome_discount.expires_at)}.` : ""}</p></div>
              </div>
              <button type="button" onClick={copyCoupon} className="flex min-h-12 items-center justify-center gap-3 border border-cyan-300/25 bg-[#020617] px-5 font-['Orbitron'] text-xs font-black uppercase tracking-[0.12em] text-cyan-200 transition-colors hover:border-cyan-300/60"><Copy size={14} /> {copied ? c.copied : user.welcome_discount.code}</button>
            </section>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[235px_minmax(0,1fr)] lg:items-start">
            <aside className="border border-white/10 bg-[#040d1e]/80 p-2 lg:sticky lg:top-36">
              {panels.map(({ key, label, icon: Icon }, index) => (
                <button key={key} type="button" onClick={() => { setActivePanel(key); setFeedback(null); }} className={`flex min-h-12 w-full items-center gap-3 border px-4 text-left font-mono text-[9px] font-bold uppercase tracking-[0.14em] transition-colors ${activePanel === key ? "border-cyan-300/25 bg-cyan-300/[0.07] text-cyan-200" : "border-transparent text-slate-500 hover:text-white"}`}><span className="text-[8px] text-cyan-300/40">0{index + 1}</span><Icon size={15} />{label}</button>
              ))}
            </aside>

            <section className="border border-white/10 bg-[#061021]/70 p-5 sm:p-7 lg:p-9">
              {activePanel === "overview" && (
                <div>
                  <div className="flex items-start gap-3 border-b border-white/[0.08] pb-5">
                    <LayoutDashboard className="mt-0.5 text-cyan-300" size={18} />
                    <div>
                      <h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.overviewTitle}</h2>
                      <p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{c.overviewText}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {[
                      { icon: PackageCheck, label: c.totalOrders, value: ordersBusy ? "—" : totalOrders, tone: "text-cyan-300" },
                      { icon: CircleDollarSign, label: c.accumulatedValue, value: ordersBusy ? "—" : formatMoney(accumulatedValue, currency), tone: "text-emerald-300" },
                      { icon: ContactRound, label: c.profileComplete, value: `${profilePercent}%`, tone: profilePercent === 100 ? "text-emerald-300" : "text-amber-300" },
                      { icon: BadgePercent, label: c.activeBenefit, value: user.welcome_discount?.code ? `${user.welcome_discount.percent || 10}%` : "—", tone: "text-cyan-300" },
                    ].map(({ icon: Icon, label, value, tone }) => (
                      <article key={label} className="min-w-0 border border-white/[0.08] bg-[#020617]/65 p-3.5 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`flex h-8 w-8 items-center justify-center border border-white/[0.08] bg-white/[0.02] ${tone}`}><Icon size={14} /></span>
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/45" />
                        </div>
                        <p className="mt-5 break-words font-['Orbitron'] text-base font-black uppercase tracking-[-0.025em] text-white sm:text-lg">{value}</p>
                        <p className="mt-2 font-mono text-[7px] uppercase leading-4 tracking-[0.11em] text-slate-600">{label}</p>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
                    <article className="border border-white/[0.08] bg-[#020617]/55 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
                        <div>
                          <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-cyan-300/70">ORDER_ACTIVITY // 01</p>
                          <h3 className="mt-2 font-['Orbitron'] text-[11px] font-black uppercase text-white">{c.recentOrder}</h3>
                        </div>
                        <PackageCheck size={17} className="text-cyan-300" />
                      </div>

                      {ordersBusy ? (
                        <div className="flex min-h-36 items-center justify-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-cyan-300"><LoaderCircle size={14} className="animate-spin" /> {c.loading}</div>
                      ) : recentOrder ? (
                        <div className="pt-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-slate-600">{c.order} // {formatDate(recentOrder.date_created)}</p>
                              <p className="mt-2 font-['Orbitron'] text-xl font-black uppercase text-white">#{recentOrder.number}</p>
                            </div>
                            <span className="w-max border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.11em] text-cyan-200">{recentOrder.status_label || recentOrder.status}</span>
                          </div>
                          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 font-mono text-[9px] text-slate-500">
                            <span>{recentOrder.item_count} {c.items}</span>
                            <span className="text-right text-white">{formatMoney(recentOrder.total, recentOrder.currency)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex min-h-36 flex-col items-center justify-center text-center">
                          <p className="font-mono text-[9px] leading-5 text-slate-500">{c.noRecentOrder}</p>
                          <a href="/shop" className="mt-4 inline-flex min-h-9 items-center gap-2 bg-cyan-300 px-4 font-['Orbitron'] text-[7px] font-black uppercase tracking-[0.12em] text-[#020617]"><FlaskConical size={12} /> {c.explore}</a>
                        </div>
                      )}

                      <button type="button" onClick={() => setActivePanel("orders")} className="mt-4 flex min-h-10 w-full items-center justify-between border border-white/[0.08] px-3 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors hover:border-cyan-300/25 hover:text-cyan-200"><span>{c.viewOrders}</span><ArrowRight size={13} /></button>
                    </article>

                    <div className="grid gap-5">
                      <article className="border border-white/[0.08] bg-[#020617]/55 p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-mono text-[8px] uppercase tracking-[0.15em] text-cyan-300/70">PROFILE_STATUS // 02</p><h3 className="mt-2 font-['Orbitron'] text-[11px] font-black uppercase text-white">{c.accountData}</h3></div>
                          <span className="font-['Orbitron'] text-sm font-black text-cyan-300">{profilePercent}%</span>
                        </div>
                        <p className="mt-3 font-mono text-[8px] leading-4 text-slate-600">{c.accountDataText}</p>
                        <div className="mt-4 h-1.5 overflow-hidden bg-white/[0.07]"><span className="block h-full bg-cyan-300 transition-[width] duration-500" style={{ width: `${profilePercent}%` }} /></div>
                        <div className="mt-4 grid gap-2 font-mono text-[8px] uppercase tracking-[0.09em]">
                          <span className={`flex items-center gap-2 ${contactReady ? "text-emerald-300" : "text-amber-300"}`}><Check size={12} /> {contactReady ? c.contactReady : c.contactPending}</span>
                          <span className={`flex items-center gap-2 ${shippingReady ? "text-emerald-300" : "text-amber-300"}`}><Truck size={12} /> {shippingReady ? c.shippingReady : c.shippingPending}</span>
                        </div>
                        <button type="button" onClick={() => setActivePanel("profile")} className="mt-4 flex min-h-9 w-full items-center justify-between border border-white/[0.08] px-3 font-mono text-[8px] font-bold uppercase tracking-[0.11em] text-slate-400 transition-colors hover:text-cyan-200"><span>{c.editData}</span><ArrowRight size={12} /></button>
                      </article>

                      <article className="border border-emerald-300/10 bg-emerald-300/[0.025] p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-emerald-300/15 bg-emerald-300/[0.04] text-emerald-300"><ShieldCheck size={15} /></span>
                          <div className="min-w-0"><h3 className="font-['Orbitron'] text-[10px] font-black uppercase text-white">{c.protectedAccount}</h3><p className="mt-2 font-mono text-[8px] leading-4 text-slate-500">{c.protectedAccountText}</p><p className="mt-2 font-mono text-[7px] uppercase tracking-[0.1em] text-emerald-300/70">{c.memberSince}: {formatDate(user.registered_at)}</p></div>
                        </div>
                        <button type="button" onClick={() => setActivePanel("security")} className="mt-4 flex min-h-9 w-full items-center justify-between border border-emerald-300/10 px-3 font-mono text-[8px] font-bold uppercase tracking-[0.11em] text-emerald-100/60 transition-colors hover:border-emerald-300/25 hover:text-emerald-200"><span>{c.manageSecurity}</span><ArrowRight size={12} /></button>
                      </article>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === "points" && (
                <div>
                  <div className="flex items-start gap-3 border-b border-white/[0.08] pb-5">
                    <CircleDollarSign className="mt-0.5 text-blue-300" size={19} />
                    <div><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">LAB POINTS</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{language === "es" ? "1 USD elegible = 1 punto · 500 puntos = USD 5 o su equivalente en COP." : "1 eligible USD = 1 point · 500 points = USD 5 or its COP equivalent."}</p></div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      [language === "es" ? "Disponibles" : "Available", rewards?.available ?? "—", "text-blue-300"],
                      [language === "es" ? "Pendientes" : "Pending", rewards?.pending ?? "—", "text-amber-300"],
                      [language === "es" ? "Valor canjeable" : "Redeemable value", rewards ? `USD ${((rewards.redeemable_blocks || 0) * (rewards.block_usd || 5)).toFixed(2)}` : "—", "text-emerald-300"],
                    ].map(([label, value, tone]) => <article key={label} className="border border-white/[0.08] bg-[#020617]/65 p-5"><p className={`font-['Orbitron'] text-xl font-black ${tone}`}>{value}</p><p className="mt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-slate-600">{label}</p></article>)}
                  </div>
                  <div className="mt-6">
                    <h3 className="font-['Orbitron'] text-[11px] font-black uppercase text-white">{language === "es" ? "Historial de movimientos" : "Points history"}</h3>
                    {rewards?.history?.length ? <div className="mt-4 grid gap-2">{rewards.history.map((entry) => <div key={entry.reference} className="flex items-center justify-between gap-4 border border-white/[0.07] bg-[#020617]/50 px-4 py-3"><div><p className="font-mono text-[9px] uppercase text-slate-300">{entry.type === "earning" ? (language === "es" ? "Compra" : "Purchase") : (language === "es" ? "Canje" : "Redemption")}</p><p className="mt-1 font-mono text-[7px] text-slate-600">{formatDate(entry.created_at)} · {entry.status}</p></div><strong className={`font-mono text-sm ${Number(entry.points) >= 0 ? "text-emerald-300" : "text-blue-300"}`}>{Number(entry.points) >= 0 ? "+" : ""}{entry.points}</strong></div>)}</div> : <p className="mt-4 border border-white/[0.07] p-6 text-center font-mono text-[9px] text-slate-600">{language === "es" ? "Todavía no tienes movimientos de puntos." : "You do not have point activity yet."}</p>}
                  </div>
                </div>
              )}

              {activePanel === "profile" && (
                <form onSubmit={submitProfile}>
                  <div className="flex items-start gap-3 border-b border-white/[0.08] pb-5"><UserRound className="mt-0.5 text-cyan-300" size={18} /><div><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.personalTitle}</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{c.personalText}</p></div></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label={c.firstName} name="first_name" autoComplete="given-name" required defaultValue={user.first_name} />
                    <Field label={c.lastName} name="last_name" autoComplete="family-name" required defaultValue={user.last_name} />
                    <Field label={c.phone} name="phone" type="tel" autoComplete="tel" defaultValue={user.phone} />
                    <Field label={c.email} name="account_email" type="email" autoComplete="email" readOnly defaultValue={user.email} />
                  </div>
                  <p className="mt-3 font-mono text-[8px] leading-4 text-slate-600">{c.emailLocked}</p>
                  <div className="mt-8 flex items-start gap-3 border-b border-white/[0.08] pb-5"><MapPin className="mt-0.5 text-cyan-300" size={18} /><div><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.shippingTitle}</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{c.shippingText}</p></div></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label={c.country} name="country" autoComplete="country" defaultValue={address.country} />
                    <Field label={c.state} name="state" autoComplete="address-level1" defaultValue={address.state} />
                    <Field label={c.address1} name="address_1" autoComplete="address-line1" defaultValue={address.address_1} className="sm:col-span-2" />
                    <Field label={c.address2} name="address_2" autoComplete="address-line2" defaultValue={address.address_2} className="sm:col-span-2" />
                    <Field label={c.city} name="city" autoComplete="address-level2" defaultValue={address.city} />
                    <Field label={c.postcode} name="postcode" autoComplete="postal-code" defaultValue={address.postcode} />
                  </div>
                  <ActionButton busy={busy} icon={Save}>{c.saveProfile}</ActionButton>
                </form>
              )}

              {activePanel === "orders" && (
                <div>
                  <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><PackageCheck className="mt-0.5 text-cyan-300" size={18} /><div><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.ordersTitle}</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{c.ordersText}</p></div></div><a href={`/track-order${orders?.[0]?.number ? `?order=${encodeURIComponent(orders[0].number)}` : ""}`} className="flex min-h-10 shrink-0 items-center justify-center gap-2 border border-cyan-300/20 bg-cyan-300/[0.04] px-4 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.11em] text-cyan-200 transition hover:bg-cyan-300 hover:text-[#020617]"><Truck size={14} />{language === "es" ? "Rastrear pedido" : "Track order"}</a></div>
                  {ordersBusy ? <div className="flex min-h-48 items-center justify-center gap-3 font-mono text-[9px] uppercase text-cyan-300"><LoaderCircle size={16} className="animate-spin" /> {c.loading}</div> : orders?.length ? (
                    <div className="mt-5 grid gap-3">{orders.map((order) => <article key={order.id} className="border border-white/[0.08] bg-[#020617]/70 p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[8px] uppercase tracking-[0.15em] text-slate-600">{c.order} // {formatDate(order.date_created)}</p><h3 className="mt-2 font-['Orbitron'] text-sm font-black uppercase text-white">#{order.number}</h3></div><span className="w-max border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2 font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-200">{order.status_label || order.status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-4 font-mono text-[9px] text-slate-500"><span>{order.item_count} {c.items}</span><span className="text-right text-slate-200">{c.total}: {formatMoney(order.total, order.currency)}</span></div></article>)}</div>
                  ) : <div className="py-14 text-center"><PackageCheck size={30} className="mx-auto text-cyan-300/35" /><h3 className="mt-5 font-['Orbitron'] text-sm font-black uppercase text-white">{c.noOrders}</h3><p className="mx-auto mt-3 max-w-md font-mono text-[10px] leading-5 text-slate-500">{c.noOrdersText}</p><a href="/shop" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-cyan-300 px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.13em] text-[#020617]"><FlaskConical size={14} /> {c.explore}</a></div>}
                </div>
              )}

              {activePanel === "security" && (
                <form onSubmit={submitPassword}>
                  <div className="flex items-start gap-3 border-b border-white/[0.08] pb-5"><LockKeyhole className="mt-0.5 text-cyan-300" size={18} /><div><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.securityTitle}</h2><p className="mt-2 font-mono text-[10px] leading-5 text-slate-500">{c.securityText}</p></div></div>
                  <div className="mt-6 grid gap-4"><Field label={c.currentPassword} name="current_password" type="password" autoComplete="current-password" required /><Field label={c.newPassword} name="new_password" type="password" autoComplete="new-password" required onValueChange={setSecurityPassword} /><PasswordProgress value={securityPassword} copy={c} /><Field label={c.confirmPassword} name="confirm_password" type="password" autoComplete="new-password" required /></div>
                  <ActionButton busy={busy} icon={KeyRound}>{c.changePassword}</ActionButton>
                </form>
              )}
              <Feedback feedback={feedback} />
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-20 pt-[var(--lab-mobile-page-top)] sm:px-6 sm:pb-28 sm:pt-[11.5rem] lg:px-8 lg:pt-[12.5rem]">
      <div className="mx-auto grid max-w-[1180px] overflow-hidden border border-cyan-300/15 bg-[#061021]/70 lg:grid-cols-[minmax(0,.86fr)_minmax(430px,1.14fr)]">
        <section className="relative overflow-hidden border-b border-cyan-300/10 p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-12">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/[0.08] blur-[90px]" />
          <div className="relative">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300">{c.eyebrow}</p>
            <h1 className="mt-5 max-w-xl font-['Orbitron'] text-3xl font-black uppercase leading-[1.06] tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.8rem]">{c.title} <span className="text-cyan-300">{c.accent}</span></h1>
            <p className="mt-5 max-w-lg font-mono text-[11px] leading-6 text-slate-400">{c.intro}</p>
            <div className="mt-9 grid gap-4">
              {[{ icon: ShieldCheck, title: c.privateAccess, text: c.privateText }, { icon: PackageCheck, title: c.orderAccess, text: c.orderText }, { icon: Truck, title: c.profileAccess, text: c.profileText }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4 border-t border-white/[0.07] pt-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-300/15 bg-cyan-300/[0.04] text-cyan-300"><Icon size={15} /></span><div><h2 className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-white">{title}</h2><p className="mt-2 font-mono text-[9px] leading-5 text-slate-500">{text}</p></div></div>)}
            </div>
            <p className="mt-8 flex items-start gap-2 border border-amber-300/15 bg-amber-300/[0.035] p-4 font-mono text-[9px] leading-5 text-amber-100/60"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" /> {c.researchOnly}</p>
          </div>
        </section>

        <section className="p-5 sm:p-9 lg:p-12">
          {view !== "forgot" && view !== "reset" && <div className="grid grid-cols-2 border border-white/10 bg-[#020617] p-1"><button type="button" onClick={() => switchView("login")} className={`min-h-11 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.12em] ${view === "login" ? "bg-cyan-300 text-[#020617]" : "text-slate-500"}`}><LogIn size={14} className="mr-2 inline" />{c.login}</button><button type="button" onClick={() => switchView("register")} className={`min-h-11 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.12em] ${view === "register" ? "bg-cyan-300 text-[#020617]" : "text-slate-500"}`}><UserRoundPlus size={14} className="mr-2 inline" />{c.register}</button></div>}

          {view === "login" && <form onSubmit={submitLogin} className="mt-7"><div className="flex items-center gap-3 border-b border-white/[0.08] pb-5"><UserRound size={18} className="text-cyan-300" /><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.login}</h2></div><div className="mt-6 grid gap-4"><Field label={c.email} name="email" type="email" autoComplete="email" required /><Field label={c.password} name="password" type="password" autoComplete="current-password" required /></div><button type="button" onClick={() => switchView("forgot")} className="mt-4 font-mono text-[9px] text-cyan-300 transition-colors hover:text-white">{c.forgot}</button><ActionButton busy={busy} icon={LogIn}>{c.loginButton}</ActionButton></form>}

          {view === "register" && <form onSubmit={submitRegister} className="mt-7"><div className="flex items-center gap-3 border-b border-white/[0.08] pb-5"><UserRoundPlus size={18} className="text-cyan-300" /><h2 className="font-['Orbitron'] text-sm font-black uppercase text-white">{c.register}</h2></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label={c.firstName} name="first_name" autoComplete="given-name" required /><Field label={c.lastName} name="last_name" autoComplete="family-name" required /><Field label={c.email} name="email" type="email" autoComplete="email" required className="sm:col-span-2" /><Field label={c.password} name="password" type="password" autoComplete="new-password" required onValueChange={setRegisterPassword} /><Field label={c.confirmPassword} name="confirm_password" type="password" autoComplete="new-password" required /><div className="sm:col-span-2"><PasswordProgress value={registerPassword} copy={c} /></div></div><label className="mt-5 flex items-start gap-3 border border-white/[0.08] bg-[#020617]/70 p-4"><input type="checkbox" name="age_confirmed" required className="mt-1 h-4 w-4 accent-cyan-300" /><span className="font-mono text-[9px] leading-5 text-slate-400">{c.age}</span></label><div className="mt-4 flex gap-3 border border-cyan-300/15 bg-cyan-300/[0.035] p-4"><BadgePercent size={17} className="mt-0.5 shrink-0 text-cyan-300" /><div><p className="font-['Orbitron'] text-[9px] font-black uppercase text-white">{c.welcomeOffer}</p><p className="mt-2 font-mono text-[9px] leading-5 text-slate-500">{c.welcomeOfferText}</p></div></div><ActionButton busy={busy} icon={UserRoundPlus}>{c.registerButton}</ActionButton></form>}

          {view === "forgot" && <form onSubmit={submitForgot}><button type="button" onClick={() => switchView("login")} className="mb-7 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 hover:text-cyan-300"><ArrowLeft size={13} /> {c.backLogin}</button><Mail size={22} className="text-cyan-300" /><h2 className="mt-5 font-['Orbitron'] text-xl font-black uppercase text-white">{c.forgotTitle}</h2><p className="mt-4 font-mono text-[10px] leading-6 text-slate-400">{c.forgotText}</p><div className="mt-7"><Field label={c.email} name="email" type="email" autoComplete="email" required /></div><ActionButton busy={busy} icon={Mail}>{c.sendReset}</ActionButton></form>}

          {view === "reset" && <form onSubmit={submitReset}><KeyRound size={22} className="text-cyan-300" /><h2 className="mt-5 font-['Orbitron'] text-xl font-black uppercase text-white">{c.resetTitle}</h2><p className="mt-4 font-mono text-[10px] leading-6 text-slate-400">{c.resetText}</p><div className="mt-7 grid gap-4"><Field label={c.newPassword} name="password" type="password" autoComplete="new-password" required onValueChange={setResetPassword} /><PasswordProgress value={resetPassword} copy={c} /><Field label={c.confirmPassword} name="confirm_password" type="password" autoComplete="new-password" required /></div><ActionButton busy={busy} icon={KeyRound}>{c.resetButton}</ActionButton></form>}
          <Feedback feedback={feedback} />
        </section>
      </div>
    </main>
  );
}
