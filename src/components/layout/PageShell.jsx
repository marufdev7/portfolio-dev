import CircuitGrid from "./CircuitGrid";

/* ---------------------------------------------------------------
   Standard page frame: max width, gutters, and the optional page
   header. `tone="net"` adds `.net-surface`, which flips the focus
   ring to green — the whole networking side inherits its accent from
   this one class rather than from per-component overrides (§3).
   --------------------------------------------------------------- */

/**
 * @param {Object} props
 * @param {string} [props.eyebrow]  mono kicker above the title
 * @param {string} props.title
 * @param {string} [props.lead]
 * @param {'dev'|'net'} [props.tone]
 * @param {boolean} [props.grid]    ambient circuit background
 * @param {React.ReactNode} [props.actions]
 */
export default function PageShell({
  eyebrow,
  title,
  lead,
  tone = "dev",
  grid = false,
  actions,
  wide = false,
  children,
}) {
  const accent = tone === "net" ? "text-net" : "text-accent";

  return (
    <div className={tone === "net" ? "net-surface" : undefined}>
      <div className="relative">
        {grid && <CircuitGrid tone={tone} />}
        <div
          className={`mx-auto px-4 pb-16 pt-12 sm:px-6 md:pt-16 ${wide ? "max-w-7xl" : "max-w-6xl"}`}
        >
          <header className="max-w-[72ch]">
            {eyebrow && (
              <p className={`mb-3 font-mono text-xs tracking-widest ${accent}`}>
                {eyebrow}
              </p>
            )}
            <h1 className="font-display text-4xl font-semibold tracking-tight text-text md:text-5xl">
              {title}
            </h1>
            {lead && (
              <p className="mt-5 text-lg leading-relaxed text-muted">{lead}</p>
            )}
            {actions && (
              <div className="mt-7 flex flex-wrap gap-3">{actions}</div>
            )}
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
