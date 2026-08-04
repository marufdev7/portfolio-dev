import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { scrollToHash, scrollToTop } from "../../lib/scroll";

/**
 * React Router keeps the scroll position across navigations, which on
 * a long page means the next route opens halfway down. Hash links are
 * left alone so `/network/labs#02-static-routing` still jumps.
 *
 * Whether that jump animates depends on where it came from: arriving on
 * a new route is a cut (instant), moving to an anchor on the page you
 * are already reading is a pan (smooth). See lib/scroll.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const samePage = previousPath.current === pathname;
    previousPath.current = pathname;

    if (hash) {
      const options = { smooth: samePage };

      // On a fresh navigation the target route has only just mounted;
      // the element can be a frame away. Try now, then once more after
      // paint before giving up and going to the top.
      if (scrollToHash(hash, options)) return;

      const frame = requestAnimationFrame(() => {
        if (!scrollToHash(hash, options)) scrollToTop();
      });
      return () => cancelAnimationFrame(frame);
    }

    // A route change is a cut; only leave the position alone if the
    // hash was merely dropped from the page we are already on.
    if (!samePage) scrollToTop();
  }, [pathname, hash]);

  return null;
}
