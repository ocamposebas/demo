import { useEffect, useState } from "react";
import { Calendar, Check, ChevronRight, Folder, LoaderCircle, Mail, ShieldAlert } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

const newsletterCopy = {
  es: {
    emailLabel: "Correo electrónico",
    consent: "Acepto recibir novedades y ofertas de LAB_CORE por correo. Puedo cancelar la suscripción cuando quiera.",
    invalidEmail: "Ingresa un correo electrónico válido.",
    consentRequired: "Debes aceptar la suscripción para continuar.",
    pending: "Suscribiendo...",
    success: "Suscripción completada. Revisa tu correo para recibir las novedades de LAB_CORE.",
    existing: "Tu correo ya estaba registrado. Hemos actualizado tu suscripción.",
    error: "No pudimos completar la suscripción. Inténtalo de nuevo.",
    subscribed: "Suscrito",
  },
  en: {
    emailLabel: "Email address",
    consent: "I agree to receive LAB_CORE news and offers by email. I can unsubscribe at any time.",
    invalidEmail: "Enter a valid email address.",
    consentRequired: "You must agree to subscribe before continuing.",
    pending: "Subscribing...",
    success: "Subscription complete. Check your inbox for LAB_CORE updates.",
    existing: "Your email was already registered. We have updated your subscription.",
    error: "We could not complete the subscription. Please try again.",
    subscribed: "Subscribed",
  },
};

function PaymentIcon({ method }) {
  const frame = "flex h-8 min-w-12 items-center justify-center rounded-sm border border-white/10 bg-white px-2";

  if (method === "visa") return <span className={frame} role="img" aria-label="Visa"><svg viewBox="0 0 48 16" className="h-4 w-10" aria-hidden="true"><text x="1" y="13" fill="#1434CB" fontFamily="Arial, sans-serif" fontSize="15" fontStyle="italic" fontWeight="900">VISA</text></svg></span>;
  if (method === "mastercard") return <span className={frame} role="img" aria-label="Mastercard"><svg viewBox="0 0 36 22" className="h-5 w-9" aria-hidden="true"><circle cx="13" cy="11" r="9" fill="#EB001B"/><circle cx="23" cy="11" r="9" fill="#F79E1B"/><path d="M18 4.1a9 9 0 0 1 0 13.8 9 9 0 0 1 0-13.8Z" fill="#FF5F00"/></svg></span>;
  if (method === "amex") return <span className={`${frame} bg-[#006FCF]`} role="img" aria-label="American Express"><svg viewBox="0 0 50 18" className="h-4 w-10" aria-hidden="true"><text x="1" y="13" fill="white" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="900">AMEX</text></svg></span>;
  return <span className={frame} role="img" aria-label="PSE"><svg viewBox="0 0 44 18" className="h-4 w-10" aria-hidden="true"><circle cx="8" cy="9" r="7" fill="#F7931E"/><path d="M5 5h5.5a3 3 0 0 1 0 6H8v3H5V5Zm3 2.5v1.2h2.2c.5 0 .7-.2.7-.6s-.2-.6-.7-.6H8Z" fill="white"/><text x="17" y="13" fill="#243746" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="800">PSE</text></svg></span>;
}

export default function Footer() {
  const { language, t } = useLanguage();
  const newsletter = newsletterCopy[language] || newsletterCopy.es;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  useEffect(() => {
    const markSubscribed = (event) => {
      const subscribedEmail = String(event?.detail?.email || "");
      if (subscribedEmail) setEmail(subscribedEmail);
      setNewsletterStatus("success");
      setNewsletterMessage(newsletter.existing);
    };

    try {
      if (window.localStorage.getItem("lab_rewards_popup_subscribed") === "true") {
        markSubscribed();
      }
    } catch {}

    window.addEventListener("lab:newsletter-subscribed", markSubscribed);
    return () => window.removeEventListener("lab:newsletter-subscribed", markSubscribed);
  }, [newsletter.existing]);

  const submitNewsletter = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setNewsletterStatus("error");
      setNewsletterMessage(newsletter.invalidEmail);
      return;
    }

    if (!consent) {
      setNewsletterStatus("error");
      setNewsletterMessage(newsletter.consentRequired);
      return;
    }

    setNewsletterStatus("loading");
    setNewsletterMessage(newsletter.pending);

    try {
      const response = await fetch("/api/marketing/subscribe", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          consent,
          website,
          source: "footer_newsletter",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) throw new Error(payload?.code || "SUBSCRIPTION_FAILED");

      setNewsletterStatus("success");
      setNewsletterMessage(payload.new_subscriber ? newsletter.success : newsletter.existing);
      try {
        window.localStorage.setItem("lab_rewards_popup_subscribed", "true");
      } catch {}
    } catch (error) {
      setNewsletterStatus("error");
      const messages = {
        NOT_CONFIGURED:
          language === "es"
            ? "El servicio de suscripción se está configurando. Inténtalo nuevamente en unos minutos."
            : "The subscription service is being configured. Please try again in a few minutes.",
        RATE_LIMITED:
          language === "es"
            ? "Ya recibimos varios intentos. Espera un minuto antes de volver a probar."
            : "We received several attempts. Wait a minute before trying again.",
        PROVIDER_ERROR:
          language === "es"
            ? "Omnisend rechazó temporalmente la solicitud. Revisa el correo e inténtalo nuevamente."
            : "Omnisend temporarily rejected the request. Check the email and try again.",
        PROVIDER_UNAVAILABLE:
          language === "es"
            ? "Omnisend no está disponible temporalmente. Inténtalo en unos minutos."
            : "Omnisend is temporarily unavailable. Try again in a few minutes.",
      };
      setNewsletterMessage(messages[error?.message] || newsletter.error);
    }
  };

  const linkGroups = [
    {
      title: t("footer.navigation"),
      links: [
        [t("footer.shopCatalog"), "/shop"],
        [t("footer.systemNews"), "/news"],
        [t("footer.aboutUs"), "/about"],
        [t("footer.researchAreas"), "/research-areas"],
      ],
    },
    {
      title: t("footer.products"),
      links: [
        [t("footer.peptideArchive"), "/shop"],
        [t("footer.specifications"), "/specifications"],
        [t("footer.analysisLog"), "/analysis-log"],
        [t("footer.molecularData"), "/molecular-data"],
      ],
    },
    {
      title: t("footer.support"),
      links: [
        [t("footer.myAccount"), "/cuenta"],
        [t("footer.trackOrder"), "/track-order"],
        [t("footer.faq"), "/faqs"],
        [t("footer.contactNode"), "/contact"],
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        [t("footer.privacy"), "/privacy-policy"],
        [t("footer.terms"), "/terms-conditions"],
        [t("footer.disclaimer"), "/disclaimer", true],
        [t("footer.waiver"), "/waiver-agreement"],
      ],
    },
  ];

  const paymentMethods = ["visa", "mastercard", "amex", "pse"];

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] px-4 pb-8 pt-16 font-['Orbitron'] text-white sm:px-6 sm:pb-10 sm:pt-20 lg:px-10 lg:pb-12 lg:pt-24">
      <div className="relative z-10 mx-auto w-full max-w-[1180px] space-y-10 sm:space-y-12">
        <div className="relative grid border-b border-white/10 pb-10 lg:grid-cols-[0.82fr_1.18fr] lg:pb-12">
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-cyan-300/70" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-cyan-300/70" />

          <div className="flex items-center gap-5 py-2 sm:gap-6 lg:pr-10">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 p-2">
              <img src="/brand-mark.svg" alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" />
            </div>

            <div className="min-w-0">
              <a href="/" className="block truncate text-lg font-black uppercase tracking-[0.1em] text-white transition-colors hover:text-cyan-300 sm:text-xl">
                LAB_<span className="text-cyan-300">CORE</span>
              </a>
              <p className="mt-1.5 font-sans text-xs text-slate-400">
                {language === "es" ? "Compuestos para investigación de laboratorio" : "Compounds for laboratory research"}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.1em] text-cyan-200">{t("footer.newsletter")}</p>
            <form
              onSubmit={submitNewsletter}
              className="mt-3"
              noValidate
              aria-busy={newsletterStatus === "loading"}
            >
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <label htmlFor="footer-newsletter-email" className="sr-only">{newsletter.emailLabel}</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (newsletterStatus !== "idle") {
                      setNewsletterStatus("idle");
                      setNewsletterMessage("");
                    }
                  }}
                  aria-describedby="footer-newsletter-help footer-newsletter-status"
                  aria-invalid={newsletterStatus === "error"}
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  placeholder={t("footer.emailPlaceholder")}
                  className="h-12 min-w-0 border border-white/10 bg-transparent px-4 font-sans text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 px-6 text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {newsletterStatus === "loading" && <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />}
                  {newsletterStatus === "success" && <Check size={14} aria-hidden="true" />}
                  {newsletterStatus === "loading"
                    ? newsletter.pending
                    : newsletterStatus === "success"
                      ? newsletter.subscribed
                      : t("footer.subscribe")}
                </button>
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-2.5 font-sans text-xs leading-relaxed text-slate-400">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    if (newsletterStatus === "error") {
                      setNewsletterStatus("idle");
                      setNewsletterMessage("");
                    }
                  }}
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  aria-describedby="footer-newsletter-status"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span>{newsletter.consent}</span>
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

              <p
                id="footer-newsletter-status"
                role={newsletterStatus === "error" ? "alert" : "status"}
                aria-live={newsletterStatus === "error" ? "assertive" : "polite"}
                className={`mt-2 min-h-4 font-sans text-xs leading-relaxed ${
                  newsletterStatus === "error"
                    ? "text-amber-300"
                    : newsletterStatus === "success"
                      ? "text-emerald-300"
                      : "text-slate-500"
                }`}
              >
                {newsletterMessage}
              </p>
            </form>
            <p id="footer-newsletter-help" className="mt-1 font-sans text-xs leading-relaxed text-slate-500">{t("footer.noSpam")}</p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12">
          <div>
            <div className="grid grid-cols-2 gap-x-7 gap-y-10 md:grid-cols-4 md:gap-8">
              {linkGroups.map((group) => (
                <section key={group.title} className="min-w-0">
                  <h3 className="flex items-center gap-2 font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.07em] text-slate-200">
                    <Folder size={11} className="shrink-0 text-cyan-500" />
                    <span className="truncate">{group.title}</span>
                  </h3>
                  <ul className="mt-4 space-y-3 font-sans text-xs leading-snug text-slate-400 sm:text-[13px]">
                    {group.links.map(([label, href, critical]) => (
                      <li key={href}>
                        <a href={href} className={`group flex items-start gap-1.5 transition-colors ${critical ? "text-red-400/80 hover:text-red-300" : "hover:text-cyan-300"}`}>
                          <ChevronRight size={11} className="mt-0.5 shrink-0 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
                          <span>{label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>

          <aside className="border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <h3 className="font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.08em] text-cyan-200">{t("footer.communications")}</h3>
            <div className="mt-5 grid gap-5 font-sans text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-3">
                <Mail size={15} className="mt-0.5 shrink-0 text-cyan-500" />
                <div className="min-w-0">
                  <span className="block font-sans text-xs text-slate-400">{t("footer.email")}</span>
                  <a href="mailto:info@labcorepep.com" className="mt-1 block break-all text-white transition-colors hover:text-cyan-300">info@labcorepep.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={15} className="mt-0.5 shrink-0 text-cyan-500" />
                <div>
                  <span className="block font-sans text-xs text-slate-400">{t("footer.shippingDays")}</span>
                  <span className="mt-1 block text-white">{t("footer.availability")}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="grid gap-6 border-t border-white/10 pt-10 md:grid-cols-2 md:gap-10">
          <div className="border-l border-red-900/50 pl-4 sm:pl-5">
            <div className="flex items-start gap-3">
              <ShieldAlert size={15} className="mt-0.5 shrink-0 text-red-500" />
              <p className="font-sans text-xs leading-[1.65] text-slate-400 sm:text-[13px]">
                <strong className="mb-1.5 block font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.07em] text-red-300">{t("footer.critical")}</strong>
                {t("footer.criticalText")}
              </p>
            </div>
          </div>

          <div className="border-l border-white/10 pl-4 sm:pl-5">
            <p className="font-sans text-xs leading-[1.65] text-slate-400 sm:text-[13px]">
              <strong className="mb-1.5 block font-['Orbitron'] text-[11px] font-bold uppercase tracking-[0.07em] text-slate-300">{t("footer.fdaTitle")}</strong>
              {t("footer.fdaText")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/[0.07] pt-8 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="font-sans text-xs font-semibold text-slate-400">{t("footer.secureCards")}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {paymentMethods.map((method) => (
                <PaymentIcon key={method} method={method} />
              ))}
            </div>
          </div>

          <p className="max-w-md font-sans text-xs leading-relaxed text-slate-500 md:text-right">
            &copy; 2026 LAB_CORE · {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}
