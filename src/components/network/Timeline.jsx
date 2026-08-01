import Badge from "../ui/Badge";
import Reveal from "../ui/Reveal";

/* ---------------------------------------------------------------
   Vertical timeline. `status: 'current'` is the only pulsing dot on
   the site — it means "you are here", so exactly one entry per list
   should carry it (§7).
   --------------------------------------------------------------- */

const dot = {
  dev: {
    done: "border-accent/50 bg-accent/30",
    current: "border-accent bg-accent",
    planned: "border-line bg-surface-raise",
  },
  net: {
    done: "border-net/50 bg-net/30",
    current: "border-net bg-net",
    planned: "border-line bg-surface-raise",
  },
};

const labels = { done: "Done", current: "In progress", planned: "Planned" };

/**
 * @param {Object} props
 * @param {import('../../data/timeline').Milestone[]} props.items
 * @param {'dev'|'net'} [props.tone]
 */
export default function Timeline({ items, tone = "dev" }) {
  return (
    <ol className="relative space-y-8 border-l border-line pl-6">
      {items.map((item, i) => (
        <Reveal key={item.title} as="li" delay={i * 0.05} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[1.9375rem] top-1.5 h-3 w-3 rounded-full border-2 ${dot[tone][item.status]}`}
          />
          {item.status === "current" && (
            <span
              aria-hidden="true"
              className={`absolute -left-[1.9375rem] top-1.5 h-3 w-3 animate-ping rounded-full ${tone === "net" ? "bg-net" : "bg-accent"} opacity-50 motion-reduce:hidden`}
            />
          )}

          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-xs text-faint">{item.period}</p>
            {item.status !== "done" && (
              <Badge tone={item.status === "current" ? tone : "muted"}>
                {labels[item.status]}
              </Badge>
            )}
          </div>
          <h3 className="mt-1.5 font-display text-lg font-semibold text-text">{item.title}</h3>
          <p className="mt-2 max-w-[68ch] leading-relaxed text-muted">{item.detail}</p>
        </Reveal>
      ))}
    </ol>
  );
}
