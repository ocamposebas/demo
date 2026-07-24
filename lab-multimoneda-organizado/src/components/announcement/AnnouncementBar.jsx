import { BadgeCheck, CreditCard, Truck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

export default function AnnouncementBar() {
  const { t } = useLanguage();
  const announcements = t("announcements");
  const items = [
    [BadgeCheck, announcements[2]],
    [Truck, announcements[1]],
    [CreditCard, announcements[3]],
  ];

  return (
    <div className="fixed left-0 top-0 z-[80] h-10 w-full overflow-hidden border-b border-cyan-300/10 bg-[#071323]/95 text-white backdrop-blur-xl">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#071323] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#071323] to-transparent sm:w-24" />

      <div className="lab-announcement-track flex h-full min-w-max items-center">
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="flex h-full shrink-0 items-center" aria-hidden={copyIndex === 1 ? "true" : undefined}>
            {[0, 1].map((repeatIndex) => items.map(([Icon, label]) => (
              <div
                key={`${copyIndex}-${repeatIndex}-${label}`}
                className="flex min-w-max items-center gap-2 px-8 font-sans text-[11px] font-semibold text-slate-300 sm:px-14"
                aria-hidden={copyIndex === 0 && repeatIndex === 1 ? "true" : undefined}
              >
                  <Icon size={13} className="shrink-0 text-cyan-300" />
                  <span className="whitespace-nowrap">{label}</span>
                  <span className="ml-6 h-1 w-1 rounded-full bg-cyan-300/50 sm:ml-10" aria-hidden="true" />
              </div>
            )))}
          </div>
        ))}
      </div>

      <style>{`
        .lab-announcement-track {
          animation: labAnnouncement 46s linear infinite;
          will-change: transform;
        }
        .lab-announcement-track:hover { animation-play-state: paused; }
        @keyframes labAnnouncement {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lab-announcement-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
