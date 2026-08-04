import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/* ---------------------------------------------------------------
   Counts a number up once, when it first scrolls into view.

   Values arrive as strings from the data files ("3", "CCNA"), so the
   leading number is parsed out and anything after it is kept as a
   suffix. A value with no leading number renders as plain text — the
   snapshot strip mixes both, and that shouldn't need a second
   component at the call site.

   The counting text is hidden from assistive tech and the final value
   is exposed once as sr-only, so a screen reader reads "3" instead of
   every frame between 0 and 3.
   --------------------------------------------------------------- */

const LEADING_NUMBER = /^(\d+(?:\.\d+)?)(.*)$/s;

export default function CountUp({ value, duration = 1.1, delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const text = String(value);
  const match = LEADING_NUMBER.exec(text);
  const target = match ? Number(match[1]) : null;
  const suffix = match ? match[2] : "";
  const decimals = match ? (match[1].split(".")[1]?.length ?? 0) : 0;

  // Start at zero so the count has somewhere to travel from; non-numeric
  // values and reduced motion skip straight to the final text.
  const [display, setDisplay] = useState(() =>
    target === null || reduce ? text : `0${suffix}`
  );

  useEffect(() => {
    if (target === null) return;
    if (reduce) {
      setDisplay(text);
      return;
    }
    if (!inView) return;

    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.21, 0.65, 0.35, 1],
      onUpdate: (n) => setDisplay(`${n.toFixed(decimals)}${suffix}`),
    });
    return () => controls.stop();
  }, [target, suffix, decimals, text, duration, delay, reduce, inView]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true" className="tabular-nums">
        {display}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
