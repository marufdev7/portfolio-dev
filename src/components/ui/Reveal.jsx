import { motion, useReducedMotion } from "framer-motion";

/**
 * Fade-up on scroll into view. The site's default entrance and, apart
 * from the circuit grid and the terminal, close to its only motion.
 * `useReducedMotion` collapses it to a plain render (§10).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
  ...rest
}) {
  const reduce = useReducedMotion();
  const Motion = motion[as] ?? motion.div;

  return (
    <Motion
      className={className}
      {...rest}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.65, 0.35, 1] }}
    >
      {children}
    </Motion>
  );
}
