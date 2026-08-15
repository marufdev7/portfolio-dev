import Reveal from "./Reveal";

/* ---------------------------------------------------------------
   Page section + its heading. The mono index ("01", "net/labs") is
   the type contrast the brand rests on (§3), so it is part of the
   primitive rather than something each page re-invents.
   --------------------------------------------------------------- */

/**
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props.index]     small mono label above the title
 * @param {string} [props.title]
 * @param {string} [props.lead]      one-paragraph intro under the title
 * @param {'dev'|'net'} [props.tone]
 */
export default function Section({
  id,
  index,
  title,
  lead,
  tone = "dev",
  className = "",
  headingLevel: Heading = "h2",
  children,
}) {
  const accent = tone === "net" ? "text-net" : "text-accent";

  return (
    <section id={id} className={`py-16 md:py-24 ${className}`}>
      {(index || title || lead) && (
        <Reveal className="mb-10 md:mb-14">
          {index && (
            <p
              aria-hidden="true"
              className={`mb-3 font-mono text-xs tracking-widest ${accent}`}
            >
              {index}
            </p>
          )}
          {title && (
            <Heading className="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
              {title}
            </Heading>
          )}
          {lead && (
            <p className="mt-4 max-w-[72ch] leading-relaxed text-muted">
              {lead}
            </p>
          )}
        </Reveal>
      )}
      {children}
    </section>
  );
}
