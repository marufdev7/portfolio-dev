/* ---------------------------------------------------------------
   Small status pill. `pulse` marks the one current milestone on the
   CCNA timeline — it is the only pulsing thing on the site, which is
   what makes it read as "you are here" rather than decoration.
   --------------------------------------------------------------- */

const tones = {
  dev: "border-accent/30 bg-accent/10 text-accent",
  net: "border-net/30 bg-net/10 text-net",
  warn: "border-warn/30 bg-warn/10 text-warn",
  muted: "border-line bg-surface-raise text-muted",
};

export default function Badge({
  tone = "muted",
  pulse = false,
  className = "",
  children,
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
        `font-mono text-xs ${tones[tone]} ${className}`
      }
    >
      {pulse && (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
