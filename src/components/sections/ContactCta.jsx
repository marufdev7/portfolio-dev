import { Download, Eye } from "lucide-react";
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
        lead="I'm focused on network engineering opportunities and building toward network automation. Replies usually land within a day."
      >
        <Reveal className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          <Button to="/contact" size="lg" className="w-full">
            Get in touch
          </Button>
          <EmailActions className="h-full w-full flex-nowrap">
            <Button
              href={`mailto:${profile.email}`}
              variant="outline"
              size="lg"
              className="min-w-0 flex-1 whitespace-nowrap"
            >
              {profile.email}
            </Button>
          </EmailActions>
          <Button
            href={profile.resumeUrl}
            variant="outline"
            size="lg"
            className="w-full"
            target="_blank"
            rel="noreferrer"
          >
            <Eye size={17} aria-hidden="true" />
            View CV
          </Button>
          <Button
            href={profile.resumeUrl}
            variant="outline"
            size="lg"
            className="w-full"
            download="Maruf_Ahmed_CV.pdf"
          >
            <Download size={17} aria-hidden="true" />
            Download CV
          </Button>
        </Reveal>
      </Section>
    </div>
  );
}
