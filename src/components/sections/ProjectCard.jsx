import { Link } from "react-router-dom";
import { ArrowUpRight, Github } from "lucide-react";
import Card from "../ui/Card";
import Tag from "../ui/Tag";

/* ---------------------------------------------------------------
   Project card. Every field comes from projects.js — there is no
   hardcoded project markup anywhere on the site (§10).

   The whole card is a link to the case study, with the live/source
   links layered on top; that keeps the click target large without
   nesting anchors.
   --------------------------------------------------------------- */

/** @param {{project: import('../../data/projects').Project}} props */
export default function ProjectCard({ project }) {
  return (
    <Card interactive className="group relative flex h-full w-full min-w-0 flex-col p-6">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl font-semibold tracking-tight text-text">
          <Link to={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        {project.year && <span className="font-mono text-xs text-faint">{project.year}</span>}
      </div>

      <p className="mb-5 leading-relaxed text-muted">{project.tagline}</p>

      {project.metrics?.[0] && (
        <p className="mb-5 border-l-2 border-accent/40 pl-3 font-mono text-xs leading-relaxed text-muted">
          {project.metrics[0]}
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        {project.stack.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-4 pt-2 text-sm">
        <span className="text-accent transition-[color,filter] duration-300 group-hover:brightness-110">
          Read case study{" "}
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.21,0.65,0.35,1)] motion-safe:group-hover:translate-x-1 motion-safe:group-focus-within:translate-x-1"
          >
            →
          </span>
        </span>
        <span className="ml-auto flex items-center gap-3">
          <a
            href={project.githubLink}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${project.title} source on GitHub`}
            className="relative z-10 text-muted hover:text-accent"
          >
            <Github size={16} aria-hidden="true" />
          </a>
          <a
            href={project.liveLink}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${project.title} live demo`}
            className="relative z-10 text-muted hover:text-accent"
          >
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </span>
      </div>
    </Card>
  );
}
