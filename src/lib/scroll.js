import { prefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/* ---------------------------------------------------------------
   One place that decides how the page moves.

   The rule the site follows: a *route change* is a cut, a *hash jump*
   is a pan. Landing on a new page should feel instant — smoothly
   animating from the bottom of a long page to the top of the next one
   is a second of scenery nobody asked for. Jumping to an anchor on the
   page you are already reading is the opposite: the motion is what
   tells you where you went.

   `prefers-reduced-motion` collapses both to instant (§10).

   Note on `behavior: "instant"` — passing `"auto"` here would *not*
   force a jump, it defers to CSS `scroll-behavior`, which is `smooth`
   on this site. "instant" is the keyword that actually overrides it.
   --------------------------------------------------------------- */

/** Sticky navbar is h-16; anchors clear it plus a little air. */
export const SCROLL_OFFSET = 80;

/** @returns {ScrollBehavior} */
function behavior(smooth) {
  return smooth && !prefersReducedMotion() ? "smooth" : "instant";
}

/** Jump to the top of the document. Instant by default — see above. */
export function scrollToTop({ smooth = false } = {}) {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior: behavior(smooth) });
}

/**
 * Scroll an element clear of the sticky header.
 *
 * `scrollIntoView` is deliberately not used: it honours `scroll-margin`
 * but there is no way to pass an offset, so every anchor target on the
 * site would need its own `scroll-mt-*` utility and they would drift
 * apart. Measuring against the document keeps the offset in one const.
 *
 * @param {Element|null} target
 * @returns {boolean} whether the target existed and was scrolled to
 */
export function scrollToElement(target, { smooth = true } = {}) {
  if (typeof window === "undefined" || !target) return false;

  const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior: behavior(smooth) });
  return true;
}

/**
 * Scroll to whatever `#id` a hash names.
 *
 * @param {string} hash e.g. "#02-static-routing"
 * @returns {boolean} false when the hash is empty or names nothing
 */
export function scrollToHash(hash, options) {
  if (!hash || hash === "#") return false;

  // The id can contain characters that are legal in a fragment but not
  // in a selector, so look it up by id rather than via querySelector.
  const id = decodeURIComponent(hash.replace(/^#/, ""));
  return scrollToElement(document.getElementById(id), options);
}
