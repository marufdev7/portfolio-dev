import { Link } from "react-router-dom";
import { Terminal as TerminalIcon } from "lucide-react";
import { ccnaStatus } from "../../data/timeline";
import { labs } from "../../data/labs";
import Section from "../ui/Section";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import CircuitGrid from "../layout/CircuitGrid";
import { useTerminal } from "../../hooks/useTerminal";

/* ---------------------------------------------------------------
   The bridge to the networking half. This is the only green block on
   the home page, and it is wrapped in `.net-surface` so even its
   focus rings switch accent (§3).
   --------------------------------------------------------------- */

export default function NetworkTeaser() {
  const { openOverlay } = useTerminal();

  return (
    <div className="net-surface relative border-y border-line bg-surface/40">
      <CircuitGrid tone="net" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Section
          index="02 / the other half"
          title="I also speak to routers"
          lead={ccnaStatus.detail}
          tone="net"
        >
          <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
            <Reveal>
              <Card tone="net" className="h-full p-6">
                <Badge tone="net" pulse className="mb-4">
                  {ccnaStatus.headline}
                </Badge>
                <p className="leading-relaxed text-muted">
                  {labs.length} labs documented with the configs, the verification output, and the
                  thing that broke each time. Plus a terminal on this site that does real subnetting
                  math and simulates enough Cisco IOS to be worth typing into.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button to="/network" tone="net">
                    Explore the network side
                  </Button>
                  <Button tone="net" variant="outline" onClick={openOverlay}>
                    <TerminalIcon size={16} aria-hidden="true" />
                    Open terminal
                  </Button>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.08}>
              <Card tone="net" className="h-full p-6">
                <h3 className="mb-4 font-mono text-xs tracking-widest text-faint">
                  RECENT LABS
                </h3>
                <ul className="space-y-3">
                  {labs.slice(0, 4).map((lab) => (
                    <li key={lab.slug} className="flex gap-3 text-sm">
                      <span className="font-mono text-net">{lab.id}</span>
                      <Link
                        to={`/network/labs#${lab.slug}`}
                        className="text-muted hover:text-net hover:underline"
                      >
                        {lab.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/network/labs"
                  className="mt-6 inline-block text-sm text-net hover:underline"
                >
                  Read the full lab log →
                </Link>
              </Card>
            </Reveal>
          </div>
        </Section>
      </div>
    </div>
  );
}
