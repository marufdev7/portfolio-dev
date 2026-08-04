/* ---------------------------------------------------------------
   Surface container. `interactive` adds the hover lift — the only
   card motion on the site, and it stays under 2px (§10: nothing
   floats).

   The lift is mirrored on `focus-within`, because the interactive
   cards are whole-card links: a keyboard user tabbing to one saw no
   affordance at all before. `active` settles it back down so a click
   reads as a press.

   Two Tailwind v4 details this depends on:

   1. `-translate-y-*` compiles to the standalone `translate` property,
      not to `transform`. It has to be named in the transition list or
      the lift snaps instead of animating.
   2. The lift is gated with `motion-safe:` rather than undone with a
      `motion-reduce:` override — `.motion-reduce\:translate-none` is
      one class (0,1,0) and would lose to `.hover\:-translate-y-0\.5:hover`
      (0,2,0) on specificity no matter what order they land in.
   --------------------------------------------------------------- */

/**
 * @param {Object} props
 * @param {'dev'|'net'} [props.tone]
 * @param {boolean} [props.interactive]
 * @param {keyof JSX.IntrinsicElements} [props.as]
 */
export default function Card({
  tone = "dev",
  interactive = false,
  as: Tag = "div",
  className = "",
  children,
  ...rest
}) {
  const lift =
    "motion-safe:hover:-translate-y-0.5 motion-safe:focus-within:-translate-y-0.5 " +
    "motion-safe:active:translate-y-0 active:duration-75";

  // Full literal class strings per tone — Tailwind scans source text,
  // so an interpolated `border-${tone}/40` would never be generated.
  const hover =
    tone === "net"
      ? "hover:border-net/40 hover:elevate-2 " +
        "focus-within:border-net/40 focus-within:elevate-2 active:elevate " +
        lift
      : "hover:border-accent/40 hover:elevate-2 " +
        "focus-within:border-accent/40 focus-within:elevate-2 active:elevate " +
        lift;

  return (
    <Tag
      className={
        "rounded-lg border border-line bg-surface panel-sheen elevate " +
        "transition-[color,background-color,border-color,box-shadow,translate] duration-300 " +
        "ease-[cubic-bezier(0.21,0.65,0.35,1)] " +
        `${interactive ? hover : ""} ${className}`
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}
