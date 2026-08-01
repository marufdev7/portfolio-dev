import { Link } from "react-router-dom";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Table from "../components/ui/Table";
import Reveal from "../components/ui/Reveal";
import { noteSections } from "../data/notes";

/* ---------------------------------------------------------------
   CCNA notes (§6.4). This page and `cat ~/network/cheatsheet.md`
   render the same `noteSections` array — the terminal is a second
   view of this data, never a second copy of it.
   --------------------------------------------------------------- */

/** @param {{block: import('../data/notes').NoteSection['blocks'][number]}} props */
function Block({ block }) {
  return (
    <div className="mt-6 first:mt-0">
      {block.heading && (
        <h3 className="mb-3 font-mono text-xs tracking-widest text-net">
          {block.heading.toUpperCase()}
        </h3>
      )}
      {block.body && <p className="max-w-[72ch] leading-relaxed text-muted">{block.body}</p>}
      {block.mono && (
        <pre className="terminal-scroll terminal-pre mt-3 overflow-x-auto rounded-md border border-line bg-surface p-4 font-mono text-xs leading-relaxed text-muted">
          {block.mono}
        </pre>
      )}
      {block.table && <Table tone="net" head={block.table.head} rows={block.table.rows} />}
    </div>
  );
}

export default function NetworkNotes() {
  return (
    <>
      <Seo
        title="CCNA notes"
        description="Subnetting shortcuts, VLSM allocation, VLANs and trunking, ACL placement, NAT terminology, and what a stuck OSPF state actually means."
        path="/network/notes"
      />

      <PageShell
        eyebrow="net / notes"
        title="CCNA notes"
        lead="Not a textbook summary — the specific things I had to look up more than once, written the way I'd want them explained. The terminal serves the same text with `cat ~/network/cheatsheet.md`."
        tone="net"
        grid
      >
        <div className="mt-12 grid gap-12 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-16">
          <nav aria-label="Notes sections" className="md:sticky md:top-24 md:self-start">
            <h2 className="mb-4 font-mono text-xs tracking-widest text-faint">ON THIS PAGE</h2>
            <ul className="space-y-2.5 text-sm">
              {noteSections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-muted hover:text-net">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-faint">
              Prefer typing?{" "}
              <Link to="/network/terminal" className="text-net hover:underline">
                Open the terminal
              </Link>
              .
            </p>
          </nav>

          <div className="min-w-0 space-y-16">
            {noteSections.map((section) => (
              <Reveal key={section.id} as="section" id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
                  {section.title}
                </h2>
                {section.intro && (
                  <p className="mt-3 max-w-[72ch] leading-relaxed text-muted">{section.intro}</p>
                )}
                <div className="mt-6">
                  {section.blocks.map((block, i) => (
                    <Block key={i} block={block} />
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
