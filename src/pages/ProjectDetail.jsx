import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Github, Server } from "lucide-react";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Button from "../components/ui/Button";
import Tag from "../components/ui/Tag";
import Reveal from "../components/ui/Reveal";
import NotFound from "./NotFound";
import { getProject, projects } from "../data/projects";

/* ---------------------------------------------------------------
   The case study. Fixed five-part structure (§5.3) so every project
   answers the same questions in the same order — a reader who has
   seen one knows where to look in the next.
   --------------------------------------------------------------- */

const SECTIONS = [
  { key: "problem", index: "01", title: "The problem" },
  { key: "solution", index: "02", title: "What I built" },
  { key: "tech", index: "03", title: "Technical decisions" },
  { key: "challenges", index: "04", title: "Engineering focus" },
  { key: "result", index: "05", title: "The result" },
];

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) return <NotFound />;

  const i = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(i + 1) % projects.length];

  return (
    <>
      <Seo
        title={project.title}
        description={project.tagline}
        path={`/projects/${project.slug}`}
      />

      <PageShell
        eyebrow={`dev / case study${project.year ? ` / ${project.year}` : ""}`}
        title={project.title}
        lead={project.tagline}
        actions={
          <>
            <Button href={project.liveLink}>
              Live site
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
            <Button href={project.githubLink} variant="outline">
              <Github size={16} aria-hidden="true" />
              {project.serverGithubLink ? "Client source" : "Source"}
            </Button>
            {project.serverGithubLink && (
              <Button href={project.serverGithubLink} variant="outline">
                <Server size={16} aria-hidden="true" />
                Server source
              </Button>
            )}
            {project.apiLink && (
              <Button href={project.apiLink} variant="ghost">
                API
                <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            )}
          </>
        }
      >
        <div className="mt-6 flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>

        <div className="mt-14 grid gap-12 md:grid-cols-[minmax(0,1fr)_18rem] md:gap-16">
          <div className="max-w-[72ch] space-y-12">
            {SECTIONS.map((section) => (
              <Reveal key={section.key} as="section">
                <p
                  aria-hidden="true"
                  className="mb-2 font-mono text-xs tracking-widest text-accent"
                >
                  {section.index}
                </p>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
                  {section.title}
                </h2>
                <p className="mt-4 leading-relaxed text-muted">
                  {project.caseStudy[section.key]}
                </p>
              </Reveal>
            ))}
          </div>

          <aside className="space-y-10 md:sticky md:top-24 md:self-start">
            <div>
              <h2 className="mb-4 font-mono text-xs tracking-widest text-faint">
                HIGHLIGHTS
              </h2>
              <ul className="space-y-2.5 text-sm text-muted">
                {project.highlights.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="text-accent">
                      ›
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {project.facts?.length > 0 && (
              <div>
                <h2 className="mb-4 font-mono text-xs tracking-widest text-faint">
                  PROJECT SCOPE
                </h2>
                <ul className="space-y-3">
                  {project.facts.map((fact) => (
                    <li
                      key={fact}
                      className="border-l-2 border-accent/40 pl-3 font-mono text-xs leading-relaxed text-muted"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            All projects
          </Link>
          {next.slug !== project.slug && (
            <Link
              to={`/projects/${next.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent"
            >
              Next: {next.title}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>
      </PageShell>
    </>
  );
}
