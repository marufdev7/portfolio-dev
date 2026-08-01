/* ---------------------------------------------------------------
   Surface container. `interactive` adds the hover lift — the only
   card motion on the site, and it stays under 2px (§10: nothing
   floats).
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
  const hover =
    tone === "net"
      ? "hover:-translate-y-0.5 hover:border-net/40 hover:elevate-2"
      : "hover:-translate-y-0.5 hover:border-accent/40 hover:elevate-2";

  return (
    <Tag
      className={
        "rounded-lg border border-line bg-surface panel-sheen elevate " +
        "transition-[color,background-color,border-color,box-shadow,transform] duration-200 " +
        `${interactive ? hover : ""} ${className}`
      }
      {...rest}
    >
      {children}
    </Tag>
  );
}
