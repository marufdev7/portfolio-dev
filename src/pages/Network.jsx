import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FlaskConical,
  NotebookText,
  TerminalSquare,
} from "lucide-react";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Section from "../components/ui/Section";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Reveal from "../components/ui/Reveal";
import TerminalEmbed from "../components/terminal/TerminalEmbed";
import Timeline from "../components/network/Timeline";
import SubnetCalculator from "../components/network/SubnetCalculator";
import SkillsList from "../components/sections/SkillsList";
import { ccnaStatus, ccnaTimeline } from "../data/timeline";
import { labs } from "../data/labs";

/* ---------------------------------------------------------------
   The networking hub. Green accent throughout — nothing cyan is
   allowed inside `.net-surface` (§3).

   Order is deliberate: the terminal first because it's the thing
   worth showing, then the honest CCNA status, then the evidence
   (labs, notes) that keeps the terminal from reading as a toy.
   --------------------------------------------------------------- */

const routes = [
  {
    to: "/network/terminal",
    icon: TerminalSquare,
    title: "Full-screen terminal",
    detail: "The same shell with room to breathe. `help` lists every command.",
  },
  {
    to: "/network/labs",
    icon: FlaskConical,
    title: "Lab log",
    detail: `${labs.length} labs, each with the config, the verification output, and what broke.`,
  },
  {
    to: "/network/notes",
    icon: NotebookText,
    title: "CCNA notes",
    detail:
      "Subnetting shortcuts, VLSM, ACL placement, NAT terms, OSPF states.",
  },
];

export default function Network() {
  const recent = labs.slice(-3).reverse();

  return (
    <>
      <Seo
        title="Network"
        description="CCNA in progress — an interactive terminal, a documented lab log, and the notes behind it. Real math, not canned answers."
        path="/network"
      />

      <PageShell
        eyebrow="net / ccna"
        title="The networking half"
        lead="I'm working through the CCNA 200-301. This side of the site is the evidence: a terminal that does the subnetting for real, five labs with the failures written down, and the notes I actually use."
        tone="net"
        grid
      >
        <div className="mt-8">
          <Badge tone="net" pulse>
            {ccnaStatus.headline}
          </Badge>
          <p className="mt-4 max-w-[72ch] leading-relaxed text-muted">
            {ccnaStatus.detail}
          </p>
        </div>

        <Section
          index="01 / try it"
          title="Terminal"
          lead="Every command computes its answer at runtime. Type an address it has never seen and it still gets the subnetting right — that's the point."
          tone="net"
        >
          <TerminalEmbed />
        </Section>

        <div id="after-terminal" className="grid gap-4 sm:grid-cols-3">
          {routes.map(({ to, icon: Icon, title, detail }, i) => (
            <Reveal key={to} delay={i * 0.05}>
              <Card tone="net" interactive className="relative h-full p-5">
                <Icon size={18} aria-hidden="true" className="text-net" />
                <h2 className="mt-3 font-display text-lg font-semibold text-text">
                  <Link to={to} className="after:absolute after:inset-0">
                    {title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {detail}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Section
          index="02 / no terminal required"
          title="Subnet calculator"
          lead="The same lib/ip.js function the terminal calls, behind a plain form. Nothing on this page is only reachable by typing."
          tone="net"
        >
          <SubnetCalculator />
        </Section>

        <Section
          index="03 / where I am"
          title="CCNA progress"
          lead={ccnaStatus.progressNote}
          tone="net"
        >
          <Timeline items={ccnaTimeline} tone="net" />
        </Section>

        <Section
          index="04 / recent labs"
          title="Latest from the log"
          lead="Newest first. Each one lists what broke before it lists what worked."
          tone="net"
        >
          <ul className="space-y-4">
            {recent.map((lab, i) => (
              <Reveal key={lab.slug} as="li" delay={i * 0.05}>
                <Card tone="net" interactive className="relative p-5">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono text-sm text-net">
                      lab {lab.id}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-text">
                      <Link
                        to={`/network/labs#${lab.slug}`}
                        className="after:absolute after:inset-0"
                      >
                        {lab.title}
                      </Link>
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[72ch] text-sm leading-relaxed text-muted">
                    {lab.takeaway}
                  </p>
                </Card>
              </Reveal>
            ))}
          </ul>

          <Link
            to="/network/labs"
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-net"
          >
            All {labs.length} labs
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </Section>

        <Section
          index="05 / skills"
          title="What I can configure"
          lead="Same three honest levels as the development side. Nothing here claims production experience I don't have."
          tone="net"
        >
          <SkillsList side="net" />
        </Section>
      </PageShell>
    </>
  );
}
