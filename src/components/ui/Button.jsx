import { Link } from "react-router-dom";

/* ---------------------------------------------------------------
   One button, three weights, two accents.

   `tone` is the dual-accent switch (§3): 'dev' paints cyan, 'net'
   paints green. Nothing else in the component knows which side of
   the site it is on, so a button can never leak the wrong accent
   into the wrong surface.

   `solid` fills from the `-solid` tokens, not the raw accents: at
   full-button scale the dark-mode cyan/green read as light sources.
   See the token comment in styles/index.css.
   --------------------------------------------------------------- */

/* One combined transition-property: `transition-colors` and
   `transition-transform` both set the same property, so listing both
   meant the later one in the cascade won outright and the colour
   change snapped. `translate` is named because Tailwind v4 compiles
   `translate-y-px` to the standalone `translate` property. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-[color,background-color,border-color,box-shadow,filter,translate] duration-200 " +
  "motion-safe:active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variants = {
  dev: {
    solid: "bg-accent-solid text-bg hover:brightness-110",
    outline: "border border-accent/40 text-accent hover:border-accent hover:bg-accent/10",
    ghost: "text-muted hover:text-accent hover:bg-accent/10",
  },
  net: {
    solid: "bg-net-solid text-bg hover:brightness-110",
    outline: "border border-net/40 text-net hover:border-net hover:bg-net/10",
    ghost: "text-muted hover:text-net hover:bg-net/10",
  },
};

/**
 * @param {Object} props
 * @param {'solid'|'outline'|'ghost'} [props.variant]
 * @param {'dev'|'net'} [props.tone]
 * @param {'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.to]    internal route — renders a router <Link>
 * @param {string} [props.href]  external URL — renders an <a> with rel/target
 */
export default function Button({
  variant = "solid",
  tone = "dev",
  size = "md",
  to,
  href,
  className = "",
  children,
  ...rest
}) {
  const classes = `${base} ${sizes[size]} ${variants[tone][variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    const external = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
