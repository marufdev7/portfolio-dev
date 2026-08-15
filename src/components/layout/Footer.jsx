import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../../data/profile";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-sm text-text">{profile.name}</p>
          <p className="mt-1 text-sm text-muted">{profile.positioning}</p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={`mailto:${profile.email}`}
            aria-label="Email"
            className="text-muted transition-colors hover:text-accent"
          >
            <Mail size={18} aria-hidden="true" />
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="GitHub"
            className="text-muted transition-colors hover:text-accent"
          >
            <Github size={18} aria-hidden="true" />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn"
            className="text-muted transition-colors hover:text-accent"
          >
            <Linkedin size={18} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 font-mono text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            © {year} {profile.name}
          </span>
          <span>
            Built with React and Tailwind ·{" "}
            <Link to="/network/terminal" className="hover:text-net">
              try the terminal
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
