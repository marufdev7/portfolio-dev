import { featuredProjects } from "../../data/projects";
import Section from "../ui/Section";
import Reveal from "../ui/Reveal";
import Button from "../ui/Button";
import ProjectCard from "./ProjectCard";

export default function FeaturedProjects() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Section
        id="work"
        index="01 / selected work"
        title="Things I built and can defend"
        lead="Four selected projects with their real feature sets, source code, architecture, and implementation decisions documented."
      >
        <div className="grid auto-rows-fr gap-6 md:grid-cols-2">
          {featuredProjects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 0.06} className="flex">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <Button to="/projects" variant="outline">
            All projects
          </Button>
        </Reveal>
      </Section>
    </div>
  );
}
