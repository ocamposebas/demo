import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Coins } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { useCurrency } from "./CurrencyContext.jsx";

export default function CurrencySelector({ compact = false, mobile = false }) {
  const { language } = useLanguage();
  const { currency, currencies, setCurrency, ready } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = currencies[currency];
  const currencyLabel = language === "es" ? "Moneda de la tienda" : "Store currency";
  const activeName = active.names?.[language] || active.name;

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const select = (code) => {
    setCurrency(code);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${mobile ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${currencyLabel}: ${active.code}, ${activeName}`}
        className={`group flex items-center justify-between rounded-xl border border-cyan-300/15 bg-cyan-300/[0.055] text-cyan-100 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.1] ${mobile ? "min-h-12 w-full px-3" : compact ? "h-10 min-w-[88px] gap-2 px-2.5" : "min-h-11 min-w-[118px] gap-3 px-3"}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-base leading-none" aria-hidden="true">{active.flag}</span>
          <span className="font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.06em]">{ready ? active.code : "···"}</span>
        </span>
        <ChevronDown size={13} className={`shrink-0 text-cyan-300/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className={`z-[120] mt-2 overflow-hidden border border-cyan-300/20 bg-[#030a19] p-2 shadow-[0_24px_70px_rgba(0,0,0,.65)] backdrop-blur-2xl ${mobile ? "relative w-full" : "absolute right-0 top-full w-[272px]"}`} role="listbox" aria-label={language === "es" ? "Seleccionar moneda" : "Select currency"}>
          <div className="mb-2 flex items-center gap-2 border-b border-white/[0.07] px-2 pb-2 pt-1">
            <Coins size={13} className="text-cyan-300" />
            <span className="font-sans text-xs font-semibold text-slate-400">
              {currencyLabel}
            </span>
          </div>
          {Object.values(currencies).map((option) => {
            const selected = option.code === currency;
            const optionName = option.names?.[language] || option.name;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(option.code)}
                className={`flex min-h-12 w-full items-center gap-3 px-3 text-left transition-colors ${selected ? "bg-cyan-300 text-[#020617]" : "text-slate-300 hover:bg-cyan-300/[0.07] hover:text-white"}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">{option.flag}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-['Orbitron'] text-[10px] font-black uppercase tracking-[0.06em]">{option.code}</span>
                  <span className={`mt-1 block truncate font-sans text-xs ${selected ? "text-[#020617]/70" : "text-slate-400"}`}>{optionName}</span>
                </span>
                {selected && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
