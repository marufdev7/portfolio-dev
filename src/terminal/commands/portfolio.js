// ---------------------------------------------------------------
// Portfolio commands (§6.5).
//
// Every one of these is a shortcut to something the site also shows as
// a page — the terminal is a second door into the same content, never
// a place where content only exists.
// ---------------------------------------------------------------

import * as out from "../output";
import { profile, about as aboutData } from "../../data/profile";
import { projects, getProject, allStacks } from "../../data/projects";
import { devSkills, netSkills, LEVELS } from "../../data/skills";
import { labs, getLab, labTopics } from "../../data/labs";
import { ccnaStatus, ccnaTimeline, journey } from "../../data/timeline";
import { wrap, keyValue, formatDate } from "../../lib/format";

/**
 * Labs are keyed by a zero-padded string id ("01"), but nobody types
 * `lab 01`. Accept the slug, the padded id, and the bare number.
 */
function findLab(key) {
  const needle = String(key ?? "").toLowerCase();
  if (!needle) return null;
  return (
    getLab(needle) ??
    labs.find((l) => String(l.id) === needle) ??
    labs.find((l) => Number(l.id) === Number(needle)) ??
    labs.find((l) => l.slug.startsWith(`${needle}-`)) ??
    null
  );
}

/* ------------------------------------------------------------------
   about / contact / resume
   ------------------------------------------------------------------ */

const about = {
  name: "about",
  aliases: ["bio"],
  category: "portfolio",
  usage: "about [--full]",
  description: "Who I am, in about six lines.",
  flags: { full: "boolean" },

  run(ctx, { flags }) {
    const blocks = [
      out.heading(`${profile.name} — ${profile.role}`),
      out.muted(profile.location),
      out.blank(),
      out.text(wrap(aboutData.intro)),
    ];

    if (flags.full) {
      blocks.push(
        out.blank(),
        out.heading("Current focus"),
        out.text(wrap(aboutData.currentFocus)),
        out.blank(),
        out.heading("Learning"),
        out.text(wrap(aboutData.learning)),
        out.blank(),
        out.heading("Why both sides"),
        out.text(wrap(aboutData.whyBoth))
      );
    } else {
      blocks.push(out.blank(), out.muted("`about --full` for the rest, or `open about`."));
    }
    return blocks;
  },
};

const contact = {
  name: "contact",
  aliases: ["email", "hire"],
  category: "portfolio",
  usage: "contact",
  description: "How to reach me.",
  run() {
    return [
      out.ascii(
        keyValue([
          ["email", profile.email],
          ["github", profile.github],
          ["linkedin", profile.linkedin],
          ["location", profile.location],
        ])
      ),
      out.blank(),
      profile.available
        ? out.success("Open to frontend roles and freelance work.")
        : out.warn("Not taking new work right now."),
      out.blank(),
      out.link("open the contact form →", "/contact", { internal: true }),
    ];
  },
};

const resume = {
  name: "resume",
  aliases: ["cv"],
  category: "portfolio",
  usage: "resume [--download]",
  description: "Summary CV, or grab the PDF.",
  examples: ["resume", "resume --download"],
  flags: { download: "boolean" },

  run(ctx, { flags }) {
    if (flags.download) {
      ctx.download?.(profile.resumeUrl);
      return [
        out.success("downloading resume.pdf…"),
        out.link("if nothing happened, click here", profile.resumeUrl, { download: true }),
      ];
    }

    return [
      out.heading(`${profile.name} — ${profile.role}`),
      out.muted(`${profile.email} · ${profile.location}`),
      out.blank(),
      out.text(wrap(profile.positioning)),
      out.blank(),
      out.heading("Projects"),
      out.table(
        [],
        projects.map((p) => [p.title, p.stack.slice(0, 3).join(", ")])
      ),
      out.blank(),
      out.heading("Certification"),
      out.text(`  ${ccnaStatus.headline}`),
      out.blank(),
      out.muted("`resume --download` for the PDF."),
    ];
  },
};

/* ------------------------------------------------------------------
   projects
   ------------------------------------------------------------------ */

const projectsCommand = {
  name: "projects",
  aliases: ["work", "ls-projects"],
  category: "portfolio",
  usage: "projects [--stack <name>] [--featured]",
  description: "List the case studies.",
  examples: ["projects", "projects --stack React", "projects --featured"],
  flags: { stack: "string", featured: "boolean" },
  complete: () => allStacks,

  run(ctx, { flags }) {
    let list = projects;
    if (flags.featured) list = list.filter((p) => p.featured);
    if (flags.stack) {
      const needle = String(flags.stack).toLowerCase();
      list = list.filter((p) => p.stack.some((s) => s.toLowerCase().includes(needle)));
    }

    if (list.length === 0) {
      return [
        out.warn(`no projects match ${flags.stack ?? "that filter"}.`),
        out.muted(`stacks in use: ${allStacks.join(", ")}`),
      ];
    }

    const blocks = [out.heading(`${list.length} project${list.length === 1 ? "" : "s"}`), out.blank()];

    for (const p of list) {
      blocks.push(out.text(`${p.title}${p.featured ? "  ★" : ""}`));
      blocks.push(out.muted(`  ${p.tagline}`));
      blocks.push(out.muted(`  ${p.stack.join(" · ")}`));
      blocks.push(out.muted(`  project ${p.slug}`));
      blocks.push(out.blank());
    }

    blocks.push(out.link("browse the grid →", "/projects", { internal: true }));
    return blocks;
  },
};

const project = {
  name: "project",
  category: "portfolio",
  usage: "project <slug>",
  description: "Read one case study in full.",
  examples: ["project taskflow"],
  complete: () => projects.map((p) => p.slug),

  run(ctx, { args }) {
    if (!args[0]) {
      return [
        out.error("usage: project <slug>"),
        out.muted(`available: ${projects.map((p) => p.slug).join(", ")}`),
      ];
    }

    const p = getProject(args[0].toLowerCase());
    if (!p) {
      return [
        out.error(`no project called '${args[0]}'`),
        out.muted(`available: ${projects.map((x) => x.slug).join(", ")}`),
      ];
    }

    const section = (title, body) => [out.heading(title), out.text(wrap(body)), out.blank()];

    return [
      out.heading(p.title),
      out.muted(p.tagline),
      out.blank(),
      out.ascii(
        keyValue([
          ["stack", p.stack.join(", ")],
          ["year", p.year ?? "—"],
          ["live", p.liveLink],
          ["source", p.githubLink],
        ])
      ),
      out.blank(),
      ...section("Problem", p.caseStudy.problem),
      ...section("Solution", p.caseStudy.solution),
      ...section("Tech", p.caseStudy.tech),
      ...section("Challenges", p.caseStudy.challenges),
      ...section("Result", p.caseStudy.result),
      ...(p.metrics?.length
        ? [out.heading("Measured"), ...p.metrics.map((m) => out.success(`  ${m}`)), out.blank()]
        : []),
      out.link(`full case study →  /projects/${p.slug}`, `/projects/${p.slug}`, { internal: true }),
    ];
  },
};

/* ------------------------------------------------------------------
   skills / stack
   ------------------------------------------------------------------ */

function renderSkillGroups(groups, accent) {
  const blocks = [];
  for (const group of groups) {
    blocks.push(out.heading(group.group));
    blocks.push(
      out.table(
        [],
        group.items.map((i) => [i.name, LEVELS[i.level].label]),
        { accent }
      )
    );
    blocks.push(out.blank());
  }
  return blocks;
}

const skills = {
  name: "skills",
  aliases: ["stack"],
  category: "portfolio",
  usage: "skills [dev|net|all]",
  description: "What I can actually do, with honest levels.",
  examples: ["skills", "skills net"],
  complete: () => ["dev", "net", "all"],

  run(ctx, { args }) {
    const side = (args[0] ?? "all").toLowerCase();
    const blocks = [];

    if (side === "dev" || side === "all") {
      blocks.push(out.heading("── Frontend ──"), out.blank());
      blocks.push(...renderSkillGroups(devSkills, "accent"));
    }
    if (side === "net" || side === "all") {
      blocks.push(out.heading("── Networking ──"), out.blank());
      blocks.push(...renderSkillGroups(netSkills, "net"));
    }
    if (blocks.length === 0) {
      return out.error(`unknown side '${side}' — try dev, net, or all`);
    }

    blocks.push(
      out.muted(
        Object.values(LEVELS)
          .map((l) => `${l.label}: ${l.meaning}`)
          .join("   ·   ")
      )
    );
    return blocks;
  },
};

/* ------------------------------------------------------------------
   ccna / labs / lab
   ------------------------------------------------------------------ */

const ccna = {
  name: "ccna",
  category: "portfolio",
  usage: "ccna",
  description: "Where I am with the CCNA, honestly.",
  run() {
    const blocks = [
      out.heading(ccnaStatus.headline),
      out.text(wrap(ccnaStatus.detail)),
      out.blank(),
      out.heading("Timeline"),
    ];

    for (const m of ccnaTimeline) {
      const marker = m.status === "done" ? "[x]" : m.status === "current" ? "[>]" : "[ ]";
      const line = `  ${marker} ${m.period.padEnd(18)} ${m.title}`;
      blocks.push(m.status === "done" ? out.success(line) : m.status === "current" ? out.warn(line) : out.muted(line));
    }

    blocks.push(
      out.blank(),
      out.muted(ccnaStatus.progressNote),
      out.blank(),
      out.link("the networking side →", "/network", { internal: true })
    );
    return blocks;
  },
};

const labsCommand = {
  name: "labs",
  category: "portfolio",
  usage: "labs [--topic <name>]",
  description: "List the documented lab writeups.",
  examples: ["labs", "labs --topic OSPF"],
  flags: { topic: "string" },
  complete: () => labTopics,

  run(ctx, { flags }) {
    let list = labs;
    if (flags.topic) {
      const needle = String(flags.topic).toLowerCase();
      list = list.filter((l) => l.topics.some((t) => t.toLowerCase().includes(needle)));
    }

    if (list.length === 0) {
      return [
        out.warn(`no labs tagged '${flags.topic}'.`),
        out.muted(`topics: ${labTopics.join(", ")}`),
      ];
    }

    const blocks = [out.heading(`${list.length} lab${list.length === 1 ? "" : "s"}`), out.blank()];
    for (const l of list) {
      blocks.push(out.text(`${String(l.id).padStart(2, "0")}  ${l.title}`));
      blocks.push(out.muted(`    ${l.topics.join(" · ")} · ${formatDate(l.date)}`));
      blocks.push(out.muted(`    lab ${l.slug}`));
    }
    blocks.push(out.blank(), out.link("read them as pages →", "/network/labs", { internal: true }));
    return blocks;
  },
};

const lab = {
  name: "lab",
  category: "portfolio",
  usage: "lab <slug|id> [--config] [--verify]",
  description: "Read one lab: topology, config, what broke, how I fixed it.",
  examples: ["lab 1", "lab ospf-mtu-mismatch", "lab 3 --config"],
  flags: { config: "boolean", verify: "boolean" },
  complete: () => labs.map((l) => l.slug),

  run(ctx, { args, flags }) {
    if (!args[0]) {
      return [
        out.error("usage: lab <slug|id>"),
        out.muted(`available: ${labs.map((l) => l.slug).join(", ")}`),
      ];
    }

    const found = findLab(args[0]);

    if (!found) {
      return [
        out.error(`no lab '${args[0]}'`),
        out.muted(`try: ${labs.map((l) => l.slug).join(", ")}`),
      ];
    }

    if (flags.config) return out.ascii(found.config);
    if (flags.verify) return out.ascii(found.verification);

    return [
      out.heading(`Lab ${String(found.id).padStart(2, "0")} — ${found.title}`),
      out.muted(`${found.topics.join(" · ")} · ${formatDate(found.date)}`),
      out.blank(),
      out.heading("Objective"),
      out.text(wrap(found.objective)),
      out.blank(),
      out.heading("Topology"),
      out.ascii(found.topologyAscii),
      out.blank(),
      out.heading("What broke"),
      out.error(wrap(found.whatBroke)),
      out.blank(),
      out.heading("How I fixed it"),
      out.success(wrap(found.howIFixedIt)),
      out.blank(),
      out.heading("Takeaway"),
      out.text(wrap(found.takeaway)),
      out.blank(),
      out.muted("`lab " + found.slug + " --config` for the configuration, `--verify` for the show output."),
      out.link("read it as a page →", `/network/labs#${found.slug}`, { internal: true }),
    ];
  },
};

/* ------------------------------------------------------------------
   timeline / open
   ------------------------------------------------------------------ */

const timeline = {
  name: "timeline",
  aliases: ["journey"],
  category: "portfolio",
  usage: "timeline",
  description: "How I got here, in order.",
  run() {
    const blocks = [out.heading("Journey"), out.blank()];
    for (const entry of journey) {
      blocks.push(out.text(`${entry.period}  ${entry.title}`));
      blocks.push(out.muted(`  ${wrap(entry.detail, 66).replace(/\n/g, "\n  ")}`));
      blocks.push(out.blank());
    }
    return blocks;
  },
};

/** Routes the terminal can jump to by name. */
const DESTINATIONS = {
  home: "/",
  projects: "/projects",
  network: "/network",
  labs: "/network/labs",
  notes: "/network/notes",
  cheatsheet: "/network/notes",
  about: "/about",
  contact: "/contact",
  terminal: "/terminal",
  github: profile.github,
  linkedin: profile.linkedin,
};

const open = {
  name: "open",
  aliases: ["goto", "cd-page"],
  category: "portfolio",
  usage: "open <page|project <slug>|lab <slug>>",
  description: "Navigate the site from the terminal.",
  examples: ["open projects", "open project taskflow", "open lab 2", "open github"],
  complete: (ctx, { args }) => {
    if (args[1] === "project") return projects.map((p) => p.slug);
    if (args[1] === "lab") return labs.map((l) => l.slug);
    return [...Object.keys(DESTINATIONS), "project", "lab"];
  },

  run(ctx, { args }) {
    const target = (args[0] ?? "").toLowerCase();

    if (!target) {
      return [
        out.error("usage: open <page>"),
        out.muted(`pages: ${Object.keys(DESTINATIONS).join(", ")}`),
      ];
    }

    if (target === "project") {
      const p = getProject((args[1] ?? "").toLowerCase());
      if (!p) return out.error(`unknown project '${args[1] ?? ""}'`);
      ctx.go(`/projects/${p.slug}`);
      return out.success(`opening ${p.title}…`);
    }

    if (target === "lab") {
      const found = findLab(args[1]);
      if (!found) return out.error(`unknown lab '${args[1] ?? ""}'`);
      ctx.go(`/network/labs#${found.slug}`);
      return out.success(`opening lab ${found.id}…`);
    }

    const destination = DESTINATIONS[target];
    if (!destination) {
      return [
        out.error(`don't know how to open '${target}'`),
        out.muted(`try: ${Object.keys(DESTINATIONS).join(", ")}`),
      ];
    }

    if (destination.startsWith("http")) {
      ctx.openExternal?.(destination);
      return [out.success(`opening ${destination}`), out.link(destination, destination)];
    }

    ctx.go(destination);
    return out.success(`→ ${destination}`);
  },
};

export default [
  about,
  contact,
  resume,
  projectsCommand,
  project,
  skills,
  ccna,
  labsCommand,
  lab,
  timeline,
  open,
];
