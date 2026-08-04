import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Card from "../ui/Card";
import Tag from "../ui/Tag";

/* ---------------------------------------------------------------
   One lab. The `whatBroke` / `howIFixedIt` pair is the point of the
   whole log — it gets its own bordered block rather than being
   buried in prose, because it is the part that proves the lab was
   run and not transcribed (§7).

   Config and verification output are collapsed by default: five labs
   of raw IOS is a wall, and the takeaway is what a recruiter reads.
   --------------------------------------------------------------- */

function Disclosure({ label, children, id }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-3 text-left font-mono text-xs tracking-widest text-faint hover:text-net"
      >
        {label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>
      <div id={id} hidden={!open} className="mt-3">
        {children}
      </div>
    </div>
  );
}

function Pre({ children }) {
  return (
    <pre className="terminal-scroll terminal-pre overflow-x-auto rounded-md border border-line bg-bg p-4 font-mono text-xs leading-relaxed text-muted">
      {children}
    </pre>
  );
}

/** @param {{lab: import('../../data/labs').Lab}} props */
export default function LabCard({ lab }) {
  const date = new Date(lab.date).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

  return (
    <Card tone="net" id={lab.slug} as="article" className="p-6 md:p-8">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="font-mono text-sm text-net">lab {lab.id}</span>
        <span className="font-mono text-xs text-faint">{date}</span>
      </div>

      <h2 className="font-display text-2xl font-semibold tracking-tight text-text">{lab.title}</h2>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {lab.topics.map((topic) => (
          <Tag key={topic} tone="net">
            {topic}
          </Tag>
        ))}
      </div>

      <p className="mt-5 max-w-[72ch] leading-relaxed text-muted">{lab.objective}</p>

      <div className="my-6 rounded-md border border-warn/30 bg-warn/5 p-5">
        <h3 className="font-mono text-xs tracking-widest text-warn">WHAT BROKE</h3>
        <p className="mt-2 max-w-[72ch] leading-relaxed text-muted">{lab.whatBroke}</p>
        <h3 className="mt-5 font-mono text-xs tracking-widest text-net">HOW I FIXED IT</h3>
        <p className="mt-2 max-w-[72ch] leading-relaxed text-muted">{lab.howIFixedIt}</p>
      </div>

      <div className="space-y-4">
        <Disclosure id={`${lab.slug}-topology`} label="TOPOLOGY">
          <Pre>{lab.topologyAscii}</Pre>
        </Disclosure>
        <Disclosure id={`${lab.slug}-config`} label="CONFIGURATION">
          <Pre>{lab.config}</Pre>
        </Disclosure>
        <Disclosure id={`${lab.slug}-verify`} label="VERIFICATION">
          <Pre>{lab.verification}</Pre>
        </Disclosure>
      </div>

      <p className="mt-6 border-l-2 border-net/50 pl-4 leading-relaxed text-text">
        <span className="font-mono text-xs tracking-widest text-net">TAKEAWAY </span>
        {lab.takeaway}
      </p>
    </Card>
  );
}
