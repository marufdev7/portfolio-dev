/**
 * The ambient grid motif (§3) — the site's only background animation,
 * capped at 0.06 opacity and switched off by the stylesheet under
 * prefers-reduced-motion.
 *
 * @param {{tone?: 'dev'|'net', className?: string}} props
 */
export default function CircuitGrid({ tone = "dev", className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden " + className
      }
    >
      <div className={`h-full w-full circuit-grid ${tone === "net" ? "circuit-grid--net" : ""}`} />
    </div>
  );
}
