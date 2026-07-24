import { useEffect, useState } from "react";
import { ShoppingCart, User, Menu, X, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { useCart } from "../cart/CartContext";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import CurrencySelector from "../../currency/CurrencySelector.jsx";

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

export default function HeaderPro() {
  const { cartCount, setIsCartOpen } = useCart();
  const { language, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountUser, setAccountUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const accountMenu = language === "en"
    ? { active: "Active session", view: "My account", logout: "Log out", loggingOut: "Logging out" }
    : { active: "Sesión activa", view: "Mi cuenta", logout: "Cerrar sesión", loggingOut: "Cerrando sesión" };

  const initials = (() => {
    if (!accountUser) return "";
    const first = String(accountUser.first_name || "").trim();
    const last = String(accountUser.last_name || "").trim();
    const fallback = String(accountUser.display_name || accountUser.email || "LC").trim().split(/\s+/);
    return `${first[0] || fallback[0]?.[0] || "L"}${last[0] || fallback[1]?.[0] || ""}`.toUpperCase().slice(0, 2);
  })();

  const navLinks = [
    { name: t("nav.shop"), href: "/shop" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.peptideInfo"), href: "/peptide-info" },
    { name: t("nav.coa"), href: "/coa-library" },
  ];

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else if (!document.body.classList.contains("lab-age-gate-open")) {
      document.body.style.overflow = "";
    }
    return () => {
      if (!document.body.classList.contains("lab-age-gate-open")) {
        document.body.style.overflow = "";
      }
    };
  }, [isMenuOpen]);

  useEffect(() => {
    let active = true;
    let requestId = 0;
    const syncSession = (event) => {
      requestId++;
      if (active) setAccountUser(event.detail?.user || null);
    };

    const loadAccount = async (notify = false) => {
      const currentRequest = ++requestId;
      try {
        const response = await fetch("/api/account/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const payload = response.ok ? await response.json() : null;
        const nextUser = payload?.user || null;

        if (!active || currentRequest !== requestId) return;
        setAccountUser(nextUser);
        // On the first authenticated page load, publish the session too so
        // cart tracking can identify the Omnisend contact before any event.
        if (notify || nextUser) {
          window.dispatchEvent(new CustomEvent("lab:account-session", {
            detail: { user: nextUser, preservePanel: true },
          }));
        }
      } catch {
        // Keep the current visual state during a temporary network interruption.
      }
    };

    const handlePageShow = (event) => {
      if (event.persisted) loadAccount(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadAccount(true);
    };

    window.addEventListener("lab:account-session", syncSession);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibility);
    loadAccount();

    return () => {
      active = false;
      requestId++;
      window.removeEventListener("lab:account-session", syncSession);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const closed = await closeAccountSession();
      if (!closed) return;

      setAccountUser(null);
      setIsMenuOpen(false);
      window.dispatchEvent(new CustomEvent("lab:account-session", { detail: { user: null } }));
      window.location.replace(`/?logged_out=${Date.now()}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);



  return (
    <header
      className="fixed left-0 top-10 z-[90] w-full animate-[labHeaderIn_.6s_cubic-bezier(.16,1,.3,1)] border-b border-cyan-400/20 bg-[#020617]/[0.96] px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:px-6 sm:py-4 lg:px-8 lg:py-5"
    >
      <div className="mx-auto flex min-h-12 w-full max-w-[1280px] items-center justify-between gap-3">
        <a href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" onClick={closeMenu}>
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center sm:h-9 sm:w-9">
            <img src="/brand-mark.svg" alt="" className="h-full w-full animate-[labMarkFloat_3.4s_ease-in-out_infinite] object-contain" />
          </div>

          <div className="flex min-w-0 flex-col leading-none text-slate-400">
            <span className="truncate font-['Orbitron'] text-sm font-bold tracking-wider text-white transition-colors group-hover:text-cyan-400 sm:text-base">
              LAB_CORE
            </span>
            <span className="mt-1 truncate font-sans text-[9px] text-slate-400 sm:text-[10px]">
              {language === "es" ? "Investigación de laboratorio" : "Laboratory research"}
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-1 rounded-xl border border-cyan-500/15 bg-cyan-950/20 px-3 py-2 lg:flex xl:gap-2 xl:px-5" aria-label={t("nav.shop")}>
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="group relative whitespace-nowrap px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300 transition-all hover:text-cyan-400 xl:px-4 xl:text-[11px] xl:tracking-[0.2em]"
            >
              {link.name}
              <span className="absolute left-0 top-0 h-1 w-1 border-l border-t border-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-0 right-0 h-1 w-1 border-b border-r border-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute -bottom-1 left-3 right-3 h-px origin-center scale-x-0 bg-cyan-400 shadow-[0_0_8px_#00f3ff] transition-transform duration-300 group-hover:scale-x-100 xl:left-4 xl:right-4" />
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden lg:block">
            <CurrencySelector compact />
          </div>

          <div className="group/account relative hidden lg:block">
            <a
              href="/cuenta"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.04em] transition-all ${accountUser ? "border-cyan-300/35 bg-cyan-300 text-[#020617] shadow-[0_0_18px_rgba(103,232,249,.16)]" : "border-cyan-500/15 bg-cyan-500/[0.06] text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-500/10"}`}
              aria-label={accountUser ? `${t("account")}: ${accountUser.display_name}` : t("account")}
              aria-haspopup={accountUser ? "menu" : undefined}
            >
              {accountUser ? initials : <User size={16} />}
            </a>

            {accountUser && (
              <div className="invisible absolute right-0 top-full w-[248px] translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover/account:visible group-hover/account:translate-y-0 group-hover/account:opacity-100 group-focus-within/account:visible group-focus-within/account:translate-y-0 group-focus-within/account:opacity-100">
                <div className="relative border border-cyan-300/20 bg-[#030a19]/[0.98] p-3 shadow-[0_24px_60px_rgba(0,0,0,.62)] backdrop-blur-2xl" role="menu">
                  <span className="absolute right-3 top-0 h-px w-9 bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.75)]" />
                  <div className="flex items-center gap-3 border-b border-white/[0.08] px-2 pb-3 pt-1">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300 font-['Orbitron'] text-[10px] font-black text-[#020617]">{initials}</span>
                    <div className="min-w-0">
                      <p className="truncate font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.05em] text-white">{accountUser.display_name}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-sans text-[11px] text-emerald-300"><ShieldCheck size={11} /> {accountMenu.active}</p>
                    </div>
                  </div>
                  <a href="/cuenta" role="menuitem" className="mt-2 flex min-h-10 items-center justify-between rounded-lg px-3 font-sans text-xs font-semibold text-slate-300 transition-colors hover:bg-cyan-300/[0.07] hover:text-cyan-200"><span className="flex items-center gap-2"><User size={14} /> {accountMenu.view}</span><ChevronRight size={13} /></a>
                  <button type="button" role="menuitem" onClick={logout} disabled={isLoggingOut} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 font-sans text-xs font-semibold text-slate-400 transition-colors hover:bg-red-300/[0.05] hover:text-red-300 disabled:opacity-50"><LogOut size={14} /> {isLoggingOut ? accountMenu.loggingOut : accountMenu.logout}</button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/15 bg-cyan-500/[0.06] text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/10"
            aria-label={t("openCart")}
          >
            <ShoppingCart size={17} />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center border border-black bg-cyan-400 px-1 text-[9px] font-bold text-black shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              {cartCount}
            </span>
          </button>


          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/10 text-cyan-300 transition-all hover:bg-cyan-400 hover:text-black lg:hidden"
            aria-label={isMenuOpen ? t("mobile.closeMenu") : t("mobile.openMenu")}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
          <div
            id="mobile-navigation"
            className="absolute left-0 right-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-b border-cyan-400/20 bg-[#030a19]/[0.98] shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-[labMenuIn_.22s_ease-out] lg:hidden"
          >
            <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-4 sm:px-6">
              <div className="mb-4 flex items-center border-b border-cyan-500/10 pb-4 font-sans text-xs font-semibold text-slate-400">
                <span>{t("mobile.title")}</span>
              </div>

              <nav className="grid gap-1" aria-label={t("nav.shop")}>
                {navLinks.map((link, index) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={closeMenu}
                    className="group flex min-h-12 items-center justify-between border border-transparent px-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 transition-all hover:border-cyan-400/20 hover:bg-cyan-400/[0.06] hover:text-cyan-300"
                  >
                    <span className="flex items-center gap-3"><span className="font-mono text-[9px] text-cyan-500/50">0{index + 1}</span>{link.name}</span>
                    <ChevronRight size={15} className="text-cyan-400 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                  </a>
                ))}
              </nav>

              <div className="mt-4 border-t border-cyan-500/10 pt-4">
                <CurrencySelector mobile />
              </div>

              <div className="mt-2 grid gap-2">
                <a href="/cuenta" onClick={closeMenu} className="flex min-h-11 items-center justify-center gap-2 border border-cyan-500/15 bg-cyan-500/[0.05] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                  {accountUser ? <span className="flex h-7 min-w-7 items-center justify-center bg-cyan-300 px-1 font-['Orbitron'] text-[8px] font-black text-[#020617]">{initials}</span> : <User size={14} />} {t("account")}
                </a>
                {accountUser && (
                  <button type="button" onClick={logout} disabled={isLoggingOut} className="flex min-h-11 items-center justify-center gap-2 border border-red-300/15 bg-red-300/[0.035] px-3 text-[9px] font-bold uppercase tracking-[0.11em] text-red-200/75 disabled:opacity-50">
                    <LogOut size={13} /> {isLoggingOut ? accountMenu.loggingOut : accountMenu.logout}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </header>
  );
}
