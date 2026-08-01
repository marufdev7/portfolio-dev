import { profile } from "../../data/profile";
import Section from "../ui/Section";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";
import EmailActions from "../ui/EmailActions";

export default function ContactCta() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Section
        index="03 / next"
        title="Hiring, or just curious?"
        lead="I'm open to frontend roles and freelance work — and happy to talk about either half of this site. Replies usually land within a day."
      >
        <Reveal className="flex flex-wrap items-center gap-3">
          <Button to="/contact" size="lg">
            Get in touch
          </Button>
          <EmailActions>
            <Button href={`mailto:${profile.email}`} variant="outline" size="lg">
              {profile.email}
            </Button>
          </EmailActions>
        </Reveal>
      </Section>
    </div>
  );
}
