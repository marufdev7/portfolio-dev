import { Download } from "lucide-react";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Section from "../components/ui/Section";
import Reveal from "../components/ui/Reveal";
import Button from "../components/ui/Button";
import SkillsList from "../components/sections/SkillsList";
import Timeline from "../components/network/Timeline";
import { about, profile } from "../data/profile";
import { journey } from "../data/timeline";

export default function About() {
  return (
    <>
      <Seo title="About" description={about.intro} path="/about" />

      <PageShell
        eyebrow="dev / about"
        title="About"
        lead={profile.positioning}
        actions={
          <Button href={profile.resumeUrl} variant="outline">
            <Download size={16} aria-hidden="true" />
            CV (PDF)
          </Button>
        }
      >
        <div className="mt-12 max-w-[72ch] space-y-6 text-lg leading-relaxed text-muted">
          <p>{about.intro}</p>
          <p>{about.currentFocus}</p>
          <p>{about.learning}</p>
          <p>{about.workStyle}</p>
        </div>

        <Section
          index="01 / the connection"
          title="Why frontend is still part of my path"
        >
          <Reveal>
            <p className="max-w-[72ch] text-lg leading-relaxed text-muted">
              {about.whyBoth}
            </p>
          </Reveal>
        </Section>

        <Section index="02 / how I got here" title="Journey">
          <Timeline items={journey} />
        </Section>

        <Section
          index="03 / skills"
          title="What I can actually do"
          lead="Three levels, no percentage bars. If something says learning, that's the truthful label, not modesty."
        >
          <SkillsList side="dev" />
        </Section>
      </PageShell>
    </>
  );
}
