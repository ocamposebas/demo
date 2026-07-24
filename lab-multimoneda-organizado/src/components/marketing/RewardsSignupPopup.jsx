import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Gift,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const DISMISSED_AT_KEY = "lab_rewards_popup_dismissed_at";
const SUBSCRIBED_KEY = "lab_rewards_popup_subscribed";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 8_000;
const SCROLL_ENGAGEMENT_DELAY_MS = 2_500;
const EXCLUDED_PATHS = [
  "/checkout",
  "/cuenta",
  "/track-order",
  "/privacy-policy",
  "/terms-conditions",
  "/disclaimer",
  "/waiver-agreement",
];

const copy = {
  es: {
    eyebrow: "LAB_REWARDS // BENEFICIO DE BIENVENIDA",
    pointsTitle: "1 USD GASTADO = 1 PUNTO",
    pointsText: "Cada compra elegible impulsa tu saldo LAB_REWARDS.",
    discount: "10%",
    discountLabel: "DE DESCUENTO",
    title: "TU PRIMERA VENTAJA EMPIEZA AQUÍ",
    text: "Suscríbete por primera vez y activa un 10% de descuento para tu primera orden.",
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    consent: "Acepto recibir novedades y ofertas de LAB_CORE por correo. Puedo cancelar la suscripción cuando quiera.",
    submit: "ACTIVAR MI 10%",
    pending: "CONECTANDO CON OMNISEND...",
    privacy: "Tus datos se tratarán según nuestra política de privacidad.",
    privacyLink: "Ver política",
    error: "No pudimos completar la suscripción. Inténtalo nuevamente.",
    invalid: "Ingresa un correo válido y acepta la suscripción.",
    successEyebrow: "REGISTRO COMPLETADO",
    successTitle: "TU BENEFICIO ESTÁ ACTIVO",
    successText: "Ya formas parte de LAB_CORE. Revisa tu correo para las novedades y beneficios de bienvenida.",
    existingTitle: "YA ESTABAS EN EL SISTEMA",
    existingText: "Actualizamos tu suscripción. Los beneficios para nuevos suscriptores se aplican una sola vez.",
    continue: "CONTINUAR EXPLORANDO",
    close: "Cerrar promoción",
    system: "BENEFICIO DE BIENVENIDA",
  },
  en: {
    eyebrow: "LAB_REWARDS // WELCOME BENEFIT",
    pointsTitle: "1 USD SPENT = 1 POINT",
    pointsText: "Every eligible purchase grows your LAB_REWARDS balance.",
    discount: "10%",
    discountLabel: "OFF",
    title: "YOUR FIRST ADVANTAGE STARTS HERE",
    text: "Subscribe for the first time and activate 10% off your first order.",
    emailLabel: "Email address",
    emailPlaceholder: "you@email.com",
    consent: "I agree to receive LAB_CORE news and offers by email. I can unsubscribe at any time.",
    submit: "ACTIVATE MY 10%",
    pending: "CONNECTING TO OMNISEND...",
    privacy: "Your data will be handled according to our privacy policy.",
    privacyLink: "View policy",
    error: "We could not complete the subscription. Please try again.",
    invalid: "Enter a valid email and accept the subscription.",
    successEyebrow: "REGISTRATION COMPLETE",
    successTitle: "YOUR BENEFIT IS ACTIVE",
    successText: "You are now part of LAB_CORE. Check your email for welcome news and benefits.",
    existingTitle: "YOU WERE ALREADY IN THE SYSTEM",
    existingText: "We updated your subscription. New-subscriber benefits can only be used once.",
    continue: "CONTINUE EXPLORING",
    close: "Close promotion",
    system: "WELCOME BENEFIT",
  },
};

const safeStorageGet = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

export default function RewardsSignupPopup() {
  const { language } = useLanguage();
  const c = copy[language] || copy.es;
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const emailRef = useRef(null);

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const forceOpen = new URLSearchParams(window.location.search).get("rewards-popup") === "1";
    if (EXCLUDED_PATHS.some((excluded) => path === excluded || path.startsWith(`${excluded}/`))) return undefined;
    if (!forceOpen && safeStorageGet(SUBSCRIBED_KEY) === "true") return undefined;

    const dismissedAt = Number(safeStorageGet(DISMISSED_AT_KEY));
    if (!forceOpen && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS) return undefined;

    let openTimer;
    let readinessTimer;
    let openScheduled = false;
    let scrollEligibleAt = 0;

    const openPopup = () => {
      window.removeEventListener("scroll", handleEngagedScroll);
      setVisible(true);
    };

    const handleEngagedScroll = () => {
      if (Date.now() < scrollEligibleAt) return;
      if (window.scrollY < window.innerHeight * 0.75) return;
      window.clearTimeout(openTimer);
      openPopup();
    };

    const scheduleWhenReady = () => {
      window.clearTimeout(readinessTimer);
      const ageGate = document.getElementById("lab-age-gate");
      const ageAccepted = document.documentElement.dataset.labAgeValid === "true" || ageGate?.hidden;
      if (!ageAccepted || document.body.classList.contains("lab-age-gate-open")) {
        readinessTimer = window.setTimeout(scheduleWhenReady, 300);
        return;
      }
      if (openScheduled) return;
      openScheduled = true;
      scrollEligibleAt = Date.now() + SCROLL_ENGAGEMENT_DELAY_MS;
      if (!forceOpen) window.addEventListener("scroll", handleEngagedScroll, { passive: true });
      openTimer = window.setTimeout(openPopup, forceOpen ? 150 : OPEN_DELAY_MS);
    };

    scheduleWhenReady();
    const handleManualOpen = () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(readinessTimer);
      openPopup();
    };
    window.addEventListener("lab:open-rewards-popup", handleManualOpen);
    window.addEventListener("lab:age-accepted", scheduleWhenReady, { once: true });
    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(readinessTimer);
      window.removeEventListener("scroll", handleEngagedScroll);
      window.removeEventListener("lab:open-rewards-popup", handleManualOpen);
      window.removeEventListener("lab:age-accepted", scheduleWhenReady);
    };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 120);
    const onKeyDown = (event) => {
      if (event.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const closePopup = () => {
    safeStorageSet(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !consent) {
      setMessage(c.invalid);
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/marketing/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email.trim(), consent, website, source: "rewards_popup" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.code || "SUBSCRIPTION_FAILED");

      safeStorageSet(SUBSCRIBED_KEY, "true");
      setStatus(payload.new_subscriber ? "success" : "existing");
    } catch (error) {
      setStatus("error");
      setMessage(
        error?.message === "NOT_CONFIGURED"
          ? language === "es"
            ? "El servicio de suscripción se está configurando. Inténtalo nuevamente en unos minutos."
            : "The subscription service is being configured. Please try again in a few minutes."
          : c.error,
      );
    }
  };

  if (!visible) return null;

  const completed = status === "success" || status === "existing";
  return (
    <div
      className="fixed inset-0 z-[80000] grid place-items-center overflow-y-auto bg-[#01050f]/90 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePopup();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-rewards-popup-title"
        aria-describedby="lab-rewards-popup-description"
        className="relative my-auto w-full max-w-[900px] overflow-hidden border border-cyan-300/20 bg-[#040c1c] text-white shadow-[0_40px_120px_rgba(0,0,0,0.75),0_0_60px_rgba(6,182,212,0.08)]"
      >
        <button
          type="button"
          onClick={closePopup}
          aria-label={c.close}
          className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center border border-white/10 bg-[#020617]/80 text-slate-400 transition hover:border-cyan-300/40 hover:text-cyan-200 sm:right-4 sm:top-4"
        >
          <X size={17} />
        </button>

        <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l border-t border-cyan-300/80" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b border-r border-cyan-300/80" />

        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="relative hidden overflow-hidden border-b border-cyan-300/10 bg-[linear-gradient(145deg,rgba(8,47,73,0.92),rgba(2,6,23,0.98))] p-6 sm:p-8 lg:block lg:border-b-0 lg:border-r">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center gap-2 font-sans text-xs font-semibold text-cyan-200">
                {c.system}
              </div>

              <div className="mt-8 flex items-end gap-3 sm:mt-10">
                <strong className="font-['Orbitron'] text-6xl font-black leading-none tracking-[-0.09em] text-cyan-100 sm:text-7xl">
                  {c.discount}
                </strong>
                <span className="pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-400">
                  {c.discountLabel}
                </span>
              </div>

              <div className="mt-8 border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
                <div className="flex items-start gap-3">
                  <CircleDollarSign size={20} className="mt-0.5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.08em] text-white">
                      {c.pointsTitle}
                    </p>
                    <p className="mt-2 font-mono text-[8px] leading-5 text-slate-400">{c.pointsText}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto hidden items-center gap-2 pt-8 font-sans text-xs text-slate-400 lg:flex">
                <ShieldCheck size={14} className="text-emerald-400/70" /> {language === "es" ? "Suscripción segura" : "Secure subscription"}
              </div>
            </div>
          </aside>

          <div className="relative p-6 sm:p-9 lg:p-11">
            <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full bg-cyan-400/10 blur-3xl" />
            {!completed ? (
              <>
                <p className="flex items-center gap-2 pr-12 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  <Sparkles size={13} /> {c.eyebrow}
                </p>
                <h2 id="lab-rewards-popup-title" className="mt-5 max-w-lg font-['Orbitron'] text-2xl font-black uppercase leading-tight tracking-[-0.045em] text-white sm:text-3xl">
                  {c.title}
                </h2>
                <p id="lab-rewards-popup-description" className="mt-4 max-w-xl font-mono text-[10px] leading-6 text-slate-400">
                  {c.text}
                </p>

                <form onSubmit={submit} className="mt-7" noValidate>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-slate-500">{c.emailLabel}</span>
                    <input
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={c.emailPlaceholder}
                      disabled={status === "loading"}
                      className="h-13 w-full border border-white/10 bg-[#020817] px-4 font-mono text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/60 disabled:opacity-60"
                    />
                  </label>

                  <label className="mt-4 flex cursor-pointer items-start gap-3 font-mono text-[8px] leading-5 text-slate-500">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                      disabled={status === "loading"}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-300"
                    />
                    <span>{c.consent}</span>
                  </label>

                  <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    Website
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-5 flex min-h-13 w-full items-center justify-center gap-3 border border-cyan-200 bg-cyan-200 px-5 font-['Orbitron'] text-[9px] font-black uppercase tracking-[0.13em] text-[#020617] transition hover:border-white hover:bg-white disabled:cursor-wait disabled:opacity-65"
                  >
                    {status === "loading" ? <LoaderCircle size={16} className="animate-spin" /> : <Gift size={16} />}
                    {status === "loading" ? c.pending : c.submit}
                    {status !== "loading" && <ArrowRight size={15} />}
                  </button>

                  <div aria-live="polite" className="min-h-5">
                    {message && <p className="mt-3 font-mono text-[8px] leading-5 text-amber-300">{message}</p>}
                  </div>
                </form>

                <p className="mt-2 font-mono text-[7px] leading-4 text-slate-600">
                  {c.privacy} <a href="/privacy-policy" className="text-slate-400 underline decoration-slate-700 underline-offset-2 hover:text-cyan-300">{c.privacyLink}</a>
                </p>
              </>
            ) : (
              <div className="flex min-h-[370px] flex-col justify-center" aria-live="polite">
                <div className="grid h-14 w-14 place-items-center border border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-300">
                  <Check size={25} />
                </div>
                <p className="mt-6 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-emerald-300">{c.successEyebrow}</p>
                <h2 id="lab-rewards-popup-title" className="mt-4 font-['Orbitron'] text-2xl font-black uppercase leading-tight tracking-[-0.04em] text-white sm:text-3xl">
                  {status === "success" ? c.successTitle : c.existingTitle}
                </h2>
                <p id="lab-rewards-popup-description" className="mt-4 max-w-lg font-mono text-[10px] leading-6 text-slate-400">
                  {status === "success" ? c.successText : c.existingText}
                </p>
                <button
                  type="button"
                  onClick={closePopup}
                  className="mt-8 flex min-h-12 items-center justify-center gap-3 border border-cyan-300/25 bg-cyan-300/[0.04] px-5 font-['Orbitron'] text-[8px] font-black uppercase tracking-[0.13em] text-cyan-200 transition hover:bg-cyan-200 hover:text-[#020617]"
                >
                  {c.continue} <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
