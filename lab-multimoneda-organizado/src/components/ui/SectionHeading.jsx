export default function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  description,
  as = "h2",
  className = "",
}) {
  const Heading = as;

  return (
    <header className={`w-full ${className}`}>
      <div className="flex max-w-full items-center gap-3 font-mono uppercase">
        <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/[0.06] px-2 text-[10px] font-bold tracking-normal text-cyan-300">
          {index}
        </span>
        <span className="truncate text-[10px] font-bold tracking-[0.13em] text-cyan-200/75 sm:text-[11px]">
          {eyebrow}
        </span>
        <span className="h-px min-w-6 flex-1 bg-gradient-to-r from-cyan-300/25 to-transparent" />
      </div>

      <div className={`mt-4 grid gap-4 ${description ? "md:grid-cols-[minmax(0,1fr)_minmax(240px,360px)] md:items-end md:gap-10" : ""}`}>
        <Heading className="max-w-[780px] font-['Orbitron'] text-2xl font-semibold uppercase leading-[1.14] tracking-[0.055em] text-white sm:text-3xl sm:tracking-[0.075em] lg:text-4xl">
          {title}
          {accent && <span className="text-cyan-300"> {accent}</span>}
        </Heading>

        {description && (
          <p className="max-w-md font-sans text-sm leading-[1.7] text-slate-400 md:justify-self-end md:text-right">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
