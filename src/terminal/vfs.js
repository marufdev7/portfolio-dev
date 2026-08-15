// ---------------------------------------------------------------
// Virtual filesystem (§6.4).
//
// Every file's contents are DERIVED from src/data/*, never duplicated.
// Editing labs.js updates the labs page, this filesystem, and the
// `show`-command context together — one source of truth.
// ---------------------------------------------------------------

import { profile, about } from "../data/profile";
import { projects } from "../data/projects";
import { labs } from "../data/labs";
import { topologyAscii } from "../data/labTopology";
import { ccnaStatus, ccnaTimeline } from "../data/timeline";
import { notesAsText } from "../data/notes";
import { devSkills, netSkills, LEVELS } from "../data/skills";
import { wrap, formatDate } from "../lib/format";
import { HOME } from "./home";

/** @typedef {Object} VfsNode
 *  @property {'dir'|'file'} type
 *  @property {Record<string, VfsNode>} [children]
 *  @property {() => string} [read]     lazy — content is built on `cat`
 *  @property {number} [size]
 *  @property {string} [action]         'download' | 'route:<path>'
 */

const dir = (children) => ({ type: "dir", children });
const file = (read, extra = {}) => ({ type: "file", read, ...extra });

/* ---------- content builders ---------- */

function aboutText() {
    return [
        `${profile.name} — ${profile.role}`,
        profile.location,
        "",
        wrap(about.intro),
        "",
        "CURRENT FOCUS",
        wrap(about.currentFocus),
        "",
        "LEARNING",
        wrap(about.learning),
        "",
        "HOW I WORK",
        wrap(about.workStyle),
        "",
        "WHY BOTH SIDES",
        wrap(about.whyBoth),
    ].join("\n");
}

function contactText() {
    return [
        "CONTACT",
        "",
        `Email     ${profile.email}`,
        `GitHub    ${profile.github}`,
        `LinkedIn  ${profile.linkedin}`,
        `Location  ${profile.location}`,
        "",
        profile.available
            ? "Status    Open to network-focused opportunities."
            : "Status    Not currently taking new work.",
    ].join("\n");
}

function resumeText() {
    return [
        `${profile.name} — ${profile.role}`,
        `${profile.email} · ${profile.location}`,
        "",
        "SUMMARY",
        wrap(profile.positioning + " " + about.intro),
        "",
        "SELECTED PROJECTS",
        ...projects.map((p) => `  ${p.title.padEnd(14)} ${p.tagline}`),
        "",
        "TECHNICAL",
        `  Frontend    ${devSkills
            .flatMap((g) => g.items)
            .filter((i) => i.level === "confident")
            .map((i) => i.name)
            .join(", ")}`,
        `  Networking  ${netSkills
            .flatMap((g) => g.items)
            .filter((i) => i.level !== "learning")
            .map((i) => i.name)
            .slice(0, 6)
            .join(", ")}`,
        "",
        "CERTIFICATION",
        `  ${ccnaStatus.headline}`,
        "",
        `Run \`resume --download\` for the PDF.`,
    ].join("\n");
}

function projectText(project) {
    return [
        project.title.toUpperCase(),
        "=".repeat(project.title.length),
        "",
        project.tagline,
        "",
        `Stack   ${project.stack.join(" · ")}`,
        `Live    ${project.liveLink}`,
        `Source  ${project.githubLink}`,
        ...(project.apiLink ? [`API     ${project.apiLink}`] : []),
        ...(project.serverGithubLink ? [`Server  ${project.serverGithubLink}`] : []),
        "",
        "PROBLEM",
        wrap(project.caseStudy.problem),
        "",
        "SOLUTION",
        wrap(project.caseStudy.solution),
        "",
        "TECH",
        wrap(project.caseStudy.tech),
        "",
        "ENGINEERING FOCUS",
        wrap(project.caseStudy.challenges),
        "",
        "RESULT",
        wrap(project.caseStudy.result),
        ...(project.facts?.length
            ? ["", "PROJECT SCOPE", ...project.facts.map((fact) => `  - ${fact}`)]
            : []),
    ].join("\n");
}

function labText(lab) {
    return [
        `LAB ${lab.id} — ${lab.title}`,
        "=".repeat(`LAB ${lab.id} — ${lab.title}`.length),
        formatDate(lab.date),
        `Topics: ${lab.topics.join(", ")}`,
        "",
        "OBJECTIVE",
        wrap(lab.objective),
        "",
        "TOPOLOGY",
        lab.topologyAscii,
        "",
        "CONFIGURATION",
        lab.config,
        "",
        "VERIFICATION",
        lab.verification,
        "",
        "WHAT BROKE",
        wrap(lab.whatBroke),
        "",
        "HOW I FIXED IT",
        wrap(lab.howIFixedIt),
        "",
        "TAKEAWAY",
        wrap(lab.takeaway),
    ].join("\n");
}

function ccnaText() {
    const lines = [
        ccnaStatus.headline.toUpperCase(),
        "",
        wrap(ccnaStatus.detail),
        "",
        "TIMELINE",
    ];
    for (const m of ccnaTimeline) {
        const marker = m.status === "done" ? "[x]" : m.status === "current" ? "[>]" : "[ ]";
        lines.push(`  ${marker} ${m.period.padEnd(16)} ${m.title}`);
    }
    lines.push("", "SKILLS", "");
    for (const group of netSkills) {
        lines.push(`  ${group.group}`);
        for (const item of group.items) {
            lines.push(`    ${LEVELS[item.level].label.padEnd(12)} ${item.name}`);
        }
        lines.push("");
    }
    return lines.join("\n").trimEnd();
}

/* ---------- the tree ---------- */

/** @type {VfsNode} */
export const root = dir({
    "about.txt": file(aboutText),
    "contact.txt": file(contactText),
    "resume.pdf": file(resumeText, { action: "download" }),
    projects: dir(
        Object.fromEntries([
            ...projects.map((p) => [
                `${p.slug}.md`,
                file(() => projectText(p), { action: `route:/projects/${p.slug}` }),
            ]),
        ])
    ),
    network: dir({
        "ccna-progress.md": file(ccnaText, { action: "route:/network" }),
        "topology.txt": file(() => topologyAscii),
        "cheatsheet.md": file(notesAsText, { action: "route:/network/notes" }),
        labs: dir(
            Object.fromEntries(
                labs.map((l) => [
                    `${l.slug}.md`,
                    file(() => labText(l), { action: `route:/network/labs#${l.slug}` }),
                ])
            )
        ),
    }),
});

export { HOME } from "./home";

/* ---------- path handling ---------- */

/**
 * Resolves a path against a working directory. Understands `~`, `.`,
 * `..`, absolute (`/network`) and relative forms, and collapses
 * redundant separators.
 *
 * @param {string} cwd  e.g. '~/network'
 * @param {string} target
 * @returns {string} normalized absolute path, always starting '~'
 */
export function resolvePath(cwd, target) {
    const input = String(target ?? "").trim();

    let segments;
    if (!input || input === "~") {
        segments = [];
    } else if (input.startsWith("~/")) {
        segments = input.slice(2).split("/");
    } else if (input.startsWith("/")) {
        segments = input.slice(1).split("/");
    } else {
        const base = cwd === HOME ? [] : cwd.replace(/^~\/?/, "").split("/").filter(Boolean);
        segments = [...base, ...input.split("/")];
    }

    const stack = [];
    for (const segment of segments) {
        if (!segment || segment === ".") continue;
        if (segment === "..") stack.pop();
        else stack.push(segment);
    }

    return stack.length ? `${HOME}/${stack.join("/")}` : HOME;
}

/**
 * Walks the tree to a node.
 * @param {string} path normalized, from resolvePath
 * @returns {VfsNode|null}
 */
export function getNode(path) {
    const segments = path.replace(/^~\/?/, "").split("/").filter(Boolean);
    let node = root;

    for (const segment of segments) {
        if (node.type !== "dir" || !node.children?.[segment]) return null;
        node = node.children[segment];
    }
    return node;
}

/**
 * Directory listing. Directories sort first, then files, both alphabetical.
 * @param {string} path
 * @returns {{name: string, type: 'dir'|'file'}[]|null}
 */
export function listDir(path) {
    const node = getNode(path);
    if (!node || node.type !== "dir") return null;

    return Object.entries(node.children)
        .map(([name, child]) => ({ name, type: child.type }))
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
}

/**
 * Recursive `tree` rendering with box-drawing characters.
 * @param {string} path
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function renderTree(path, prefix = "") {
    const entries = listDir(path);
    if (!entries) return [];

    const lines = [];
    entries.forEach((entry, i) => {
        const last = i === entries.length - 1;
        const branch = last ? "└── " : "├── ";
        lines.push(`${prefix}${branch}${entry.name}${entry.type === "dir" ? "/" : ""}`);
        if (entry.type === "dir") {
            lines.push(
                ...renderTree(`${path === HOME ? "~" : path}/${entry.name}`, `${prefix}${last ? "    " : "│   "}`)
            );
        }
    });
    return lines;
}

/** Every path in the tree — used by tab completion. */
export function allPaths(path = HOME, acc = []) {
    const entries = listDir(path) ?? [];
    for (const entry of entries) {
        const child = `${path === HOME ? "~" : path}/${entry.name}`;
        acc.push(child);
        if (entry.type === "dir") allPaths(child, acc);
    }
    return acc;
}

/** Display form for the prompt: '~/network/labs' stays as-is. */
export function shortPath(path) {
    return path;
}
