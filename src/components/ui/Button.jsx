import { Link } from "react-router-dom";

/* ---------------------------------------------------------------
   One button, three weights, two accents.

   `tone` is the dual-accent switch (§3): 'dev' paints cyan, 'net'
   paints green. Nothing else in the component knows which side of
   the site it is on, so a button can never leak the wrong accent
   into the wrong surface.
   --------------------------------------------------------------- */

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium " +
  "transition-colors transition-transform duration-200 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variants = {
  dev: {
    solid: "bg-accent text-bg hover:brightness-110",
    outline: "border border-accent/40 text-accent hover:border-accent hover:bg-accent/10",
    ghost: "text-muted hover:text-accent hover:bg-accent/10",
  },
  net: {
    solid: "bg-net text-bg hover:brightness-110",
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
