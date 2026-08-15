import { LEVELS, devSkills, netSkills } from "../../data/skills";
import Card from "../ui/Card";

/* ---------------------------------------------------------------
   Skills, grouped, with an honest level label instead of a bar or a
   percentage — nobody is 87% good at Tailwind (§10).

   The legend states what each level means, so "learning" reads as a
   deliberate claim rather than a hedge.
   --------------------------------------------------------------- */

const levelStyles = {
  dev: {
    confident: "border-accent/40 text-accent",
    comfortable: "border-line text-muted",
    learning: "border-warn/40 text-warn",
  },
  net: {
    confident: "border-net/40 text-net",
    comfortable: "border-line text-muted",
    learning: "border-warn/40 text-warn",
  },
};

/**
 * @param {Object} props
 * @param {'dev'|'net'} [props.side]
 * @param {boolean} [props.legend]
 */
export default function SkillsList({ side = "dev", legend = true }) {
  const groups = side === "net" ? netSkills : devSkills;
  const styles = levelStyles[side];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.group} tone={side} className="p-5">
            <h3 className="mb-4 font-mono text-xs tracking-widest text-faint">
              {group.group.toUpperCase()}
            </h3>
            <ul className="space-y-3">
              {group.items.map((item) => (
                <li
                  key={item.name}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="text-sm text-text">
                    {item.name}
                    {item.note && (
                      <span className="ml-2 font-mono text-xs text-faint">
                        — {item.note}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[0.6875rem] ${styles[item.level]}`}
                  >
                    {LEVELS[item.level].label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {legend && (
        <dl className="mt-6 space-y-1.5 text-sm text-muted">
          {Object.entries(LEVELS).map(([key, level]) => (
            <div key={key} className="flex gap-2">
              <dt className={`font-mono text-xs ${styles[key].split(" ")[1]}`}>
                {level.label}
              </dt>
              <dd className="text-muted">— {level.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
