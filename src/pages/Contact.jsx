import { Github, Linkedin, Mail } from "lucide-react";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import ContactForm from "../components/sections/ContactForm";
import EmailActions from "../components/ui/EmailActions";
import { profile } from "../data/profile";

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: profile.email,
    href: `mailto:${profile.email}`,
    // The only channel whose href is a protocol handler rather than a
    // URL, so the only one that can fail silently. See EmailActions.
    copyable: true,
  },
  {
    icon: Github,
    label: "GitHub",
    value: "Code and commits",
    href: profile.github,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "The formal version",
    href: profile.linkedin,
  },
];

export default function Contact() {
  return (
    <>
      <Seo
        title="Contact"
        description="Open to network-focused opportunities. Email is fastest."
        path="/contact"
      />

      <PageShell
        eyebrow="dev / contact"
        title="Get in touch"
        lead="Open to network-focused opportunities. Email is the fastest way to reach me."
      >
        <div className="mt-12 grid gap-12 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-16">
          <ContactForm />

          <aside className="space-y-6">
            {profile.available && (
              <Badge tone="dev" pulse>
                Available for work
              </Badge>
            )}

            <ul className="space-y-3">
              {channels.map(({ icon: Icon, label, value, href, copyable }) => {
                // Built once and placed either bare or beside the copy
                // control — the copy button has to be a sibling of the
                // anchor, never a descendant of it.
                const link = (
                  <a
                    href={href}
                    {...(/^https?:/.test(href)
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Icon
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-accent"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-text">{label}</span>
                      <span className="block truncate text-sm text-muted">
                        {value}
                      </span>
                    </span>
                  </a>
                );

                return (
                  <li key={label}>
                    <Card interactive className="p-4">
                      {copyable ? <EmailActions>{link}</EmailActions> : link}
                    </Card>
                  </li>
                );
              })}
            </ul>

            <p className="text-sm text-faint">
              Based in {profile.location}. Comfortable working remotely across
              time zones.
            </p>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
