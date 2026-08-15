import { useSearchParams } from "react-router-dom";
import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Reveal from "../components/ui/Reveal";
import Tag from "../components/ui/Tag";
import ProjectCard from "../components/sections/ProjectCard";
import { allStacks, projects } from "../data/projects";

/* ---------------------------------------------------------------
   The filter lives in the URL (`?stack=React`), so a filtered view is
   shareable and the back button undoes a filter the way a visitor
   expects (§5.2).
   --------------------------------------------------------------- */

export default function Projects() {
  const [params, setParams] = useSearchParams();
  const active = params.get("stack");

  const visible = active
    ? projects.filter((p) => p.stack.includes(active))
    : projects;

  const setStack = (stack) => {
    const next = new URLSearchParams(params);
    if (stack === active || stack === null) next.delete("stack");
    else next.set("stack", stack);
    setParams(next, { replace: true });
  };

  return (
    <>
      <Seo
        title="Projects"
        description="Real frontend and full-stack projects with live deployments, source code, technical decisions, and implementation details."
        path="/projects"
      />

      <PageShell
        eyebrow="dev / work"
        title="Projects"
        lead="Five deployed projects spanning e-commerce, travel, and parcel delivery, with the architecture, tools, and implementation decisions documented."
        grid
      >
        <div className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 font-mono text-xs tracking-widest text-faint">
              FILTER
            </span>
            <Tag active={!active} onClick={() => setStack(null)}>
              All
            </Tag>
            {allStacks.map((stack) => (
              <Tag
                key={stack}
                active={stack === active}
                onClick={() => setStack(stack)}
              >
                {stack}
              </Tag>
            ))}
          </div>

          <p aria-live="polite" className="mt-4 text-sm text-muted">
            {visible.length} {visible.length === 1 ? "project" : "projects"}
            {active ? ` using ${active}` : ""}
          </p>

          <div className="mt-8 grid auto-rows-fr gap-6 md:grid-cols-2">
            {visible.map((project, i) => (
              <Reveal key={project.slug} delay={i * 0.05} className="flex">
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-8 text-muted">
              Nothing built with {active} yet.{" "}
              <button
                type="button"
                onClick={() => setStack(null)}
                className="text-accent hover:underline"
              >
                Clear the filter
              </button>
              .
            </p>
          )}
        </div>
      </PageShell>
    </>
  );
}
