import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { profile, snapshot } from "../../data/profile";
import Button from "../ui/Button";
import CircuitGrid from "../layout/CircuitGrid";

/* ---------------------------------------------------------------
   Hero. Two claims, one CTA each — the positioning line splits the
   page into its two halves and the buttons follow it, so the dual
   identity is legible before a single word of body copy (§3).

   No floating gradient, no glass, no orbiting icons (§10).
   --------------------------------------------------------------- */

export default function Hero() {
  const reduce = useReducedMotion();

  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.21, 0.65, 0.35, 1] },
  });

  return (
    <section className="relative overflow-hidden border-b border-line">
      <CircuitGrid />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 md:pb-28 md:pt-28">
        <motion.p {...rise(0)} className="font-mono text-sm text-accent">
          {profile.name}
        </motion.p>

        <motion.h1
          {...rise(0.06)}
          className="mt-5 max-w-[18ch] font-display text-4xl font-semibold leading-[1.08] tracking-tight text-text sm:text-5xl md:text-6xl"
        >
          Frontend developer who thinks like a{" "}
          <span className="text-net">network engineer</span>.
        </motion.h1>

        <motion.p {...rise(0.12)} className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted">
          {profile.tagline}
        </motion.p>

        <motion.div {...rise(0.18)} className="mt-9 flex flex-wrap gap-3">
          <Button to="/projects" size="lg">
            See the work
          </Button>
          <Button to="/network" tone="net" variant="outline" size="lg">
            Open the network side
          </Button>
        </motion.div>

        <motion.dl
          {...rise(0.24)}
          className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-line pt-8"
        >
          {snapshot.map((item) => (
            <div key={item.label}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="block font-display text-2xl font-semibold text-text md:text-3xl">
                  {item.value}
                </span>
                <span className="mt-1 block text-sm text-muted">{item.label}</span>
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.p {...rise(0.3)} className="mt-8 font-mono text-xs text-faint">
          press{" "}
          <kbd className="rounded border border-line px-1.5 py-0.5 text-muted">Ctrl</kbd>
          <span className="px-1">+</span>
          <kbd className="rounded border border-line px-1.5 py-0.5 text-muted">K</kbd> for the
          terminal, or{" "}
          <Link to="/network/terminal" className="text-net hover:underline">
            open it full screen
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
