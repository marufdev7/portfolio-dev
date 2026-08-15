/* ---------------------------------------------------------------
   Stack / topic chip. Doubles as the filter control on /projects,
   so it can be a plain <span> or a real <button> with pressed state.

   Every class is spelled out rather than interpolated — Tailwind
   scans source text, so a template-literal class name compiles to
   nothing at all.
   --------------------------------------------------------------- */

const styles = {
  dev: {
    on: "border-accent bg-accent/15 text-accent",
    off: "border-line bg-surface-raise text-muted hover:border-accent/40 hover:text-accent",
  },
  net: {
    on: "border-net bg-net/15 text-net",
    off: "border-line bg-surface-raise text-muted hover:border-net/40 hover:text-net",
  },
};

/**
 * @param {Object} props
 * @param {'dev'|'net'} [props.tone]
 * @param {boolean} [props.active]
 * @param {() => void} [props.onClick]  present → renders a toggle button
 */
export default function Tag({
  tone = "dev",
  active = false,
  onClick,
  className = "",
  children,
  ...rest
}) {
  const classes =
    "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs transition-colors " +
    `${styles[tone][active ? "on" : "off"]} ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={classes}
        {...rest}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
