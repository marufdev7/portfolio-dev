// ---------------------------------------------------------------
// System + filesystem commands (§6.5).
//
// `help` and `man` are generated from the registry, so a new command
// documents itself the moment it exists — there is no second list to
// keep in sync.
// ---------------------------------------------------------------

import * as out from "../output";
import { commandsByCategory, resolve, listCommands, commandCount } from "../registry";
import { resolvePath, getNode, listDir, renderTree, HOME } from "../vfs";
import { expandVars } from "../parser";
import { profile } from "../../data/profile";
import { daysSince, humanDuration, keyValue } from "../../lib/format";
import { clearHistory } from "../history";

/* ------------------------------------------------------------------
   help
   ------------------------------------------------------------------ */

const help = {
    name: "help",
    aliases: ["?", "commands"],
    category: "system",
    usage: "help [command] [--all]",
    description: "List every command, grouped by what it's for.",
    examples: ["help", "help subnet", "help --all"],
    flags: { all: "boolean" },
    complete: () => listCommands().map((c) => c.name),

    run(ctx, { args, flags }) {
        if (args[0]) return manPage(args[0]);

        const blocks = [
            out.heading(`${commandCount()} commands available`),
            out.muted("Tab completes · ↑↓ walks history · `man <command>` for detail"),
            out.blank(),
        ];

        for (const group of commandsByCategory({ includeHidden: flags.all })) {
            blocks.push(out.heading(group.label));
            blocks.push(
                out.table(
                    [],
                    group.commands.map((c) => [c.name, c.description]),
                    { accent: group.key === "network" || group.key === "ios" ? "net" : "accent" }
                )
            );
            blocks.push(out.blank());
        }

        if (!flags.all) {
            blocks.push(out.muted("Some things aren't on this list. Poke around."));
        }
        return blocks;
    },
};

/* ------------------------------------------------------------------
   man
   ------------------------------------------------------------------ */

function manPage(name) {
    const command = resolve(name);
    if (!command) {
        return [
            out.error(`no manual entry for ${name}`),
            out.muted("`help` lists everything that has one."),
        ];
    }

    const blocks = [
        out.heading(`${command.name.toUpperCase()} — ${command.description}`),
        out.blank(),
        out.text("USAGE"),
        out.ascii(`  ${command.usage}`),
    ];

    if (command.aliases?.length) {
        blocks.push(out.blank(), out.text("ALIASES"), out.ascii(`  ${command.aliases.join(", ")}`));
    }

    const flagNames = Object.keys(command.flags ?? {});
    if (flagNames.length) {
        blocks.push(
            out.blank(),
            out.text("FLAGS"),
            out.ascii(
                keyValue(
                    flagNames.map((f) => [`  --${f}`, `<${command.flags[f]}>`]),
                    14
                )
            )
        );
    }

    if (command.examples?.length) {
        blocks.push(out.blank(), out.text("EXAMPLES"));
        for (const example of command.examples) blocks.push(out.ascii(`  ${example}`));
    }

    if (command.notes) blocks.push(out.blank(), out.muted(command.notes));

    return blocks;
}

const man = {
    name: "man",
    category: "system",
    usage: "man <command>",
    description: "Show the manual page for a command.",
    examples: ["man vlsm", "man show"],
    complete: () => listCommands({ includeHidden: true }).map((c) => c.name),

    run(ctx, { args }) {
        if (!args[0]) return out.error("usage: man <command>");
        return manPage(args[0]);
    },
};

/* ------------------------------------------------------------------
   clear / history / echo / date
   ------------------------------------------------------------------ */

const clear = {
    name: "clear",
    aliases: ["cls"],
    category: "system",
    usage: "clear",
    description: "Wipe the scrollback.",
    run(ctx) {
        ctx.clear();
    },
};

const history = {
    name: "history",
    category: "system",
    usage: "history [--clear] [-n <count>]",
    description: "Show the commands you've run. `!42` re-runs one.",
    examples: ["history", "history -n 5", "history --clear"],
    flags: { clear: "boolean", n: "number" },

    run(ctx, { flags }) {
        if (flags.clear) {
            clearHistory();
            ctx.session.historyCleared = true;
            return out.success("history cleared.");
        }

        const entries = ctx.history ?? [];
        if (entries.length === 0) return out.muted("no history yet.");

        const slice = flags.n ? entries.slice(-flags.n) : entries;
        const offset = entries.length - slice.length;

        return out.ascii(
            slice
                .map((entry, i) => `${String(offset + i + 1).padStart(4)}  ${entry}`)
                .join("\n")
        );
    },
};

const echo = {
    name: "echo",
    category: "system",
    usage: "echo <text>",
    description: "Print text. Expands $USER, $HOST, $PWD.",
    examples: ["echo hello", "echo $USER on $HOST"],
    run(ctx, { raw }) {
        const text = raw.replace(/^echo\s*/i, "");
        return out.text(expandVars(text, ctx.env));
    },
};

const date = {
    name: "date",
    category: "system",
    usage: "date",
    description: "Current date and time.",
    run() {
        return out.text(new Date().toString());
    },
};

const whoami = {
    name: "whoami",
    category: "system",
    usage: "whoami",
    description: "Who you're talking to.",
    run(ctx) {
        return [
            out.ascii(
                keyValue([
                    ["user", ctx.env.USER],
                    ["name", profile.name],
                    ["role", profile.role],
                    ["location", profile.location],
                    ["shell", "portfolio-sh 2.0"],
                    ["status", profile.available ? "open to work" : "heads down"],
                ])
            ),
            out.blank(),
            out.muted(profile.positioning),
        ];
    },
};

/* ------------------------------------------------------------------
   theme
   ------------------------------------------------------------------ */

const theme = {
    name: "theme",
    category: "system",
    usage: "theme [dark|light|toggle]",
    description: "Switch the site between dark and light.",
    examples: ["theme light", "theme toggle"],
    complete: () => ["dark", "light", "toggle"],

    run(ctx, { args }) {
        const target = (args[0] ?? "toggle").toLowerCase();
        if (!["dark", "light", "toggle"].includes(target)) {
            return out.error(`unknown theme: ${target} (try dark, light, or toggle)`);
        }
        ctx.setTheme(target);
        const next = target === "toggle" ? (ctx.theme === "dark" ? "light" : "dark") : target;
        return out.success(`theme → ${next}`);
    },
};

/* ------------------------------------------------------------------
   Filesystem
   ------------------------------------------------------------------ */

/** Candidates for path completion, relative to what's typed so far. */
function pathCandidates(ctx, partial, { dirsOnly = false } = {}) {
    // Split the typed path into the part that's already a directory and
    // the fragment being completed, so `cd network/la<Tab>` works.
    const slash = partial.lastIndexOf("/");
    const base = slash === -1 ? "" : partial.slice(0, slash + 1);
    const entries = listDir(resolvePath(ctx.cwd, base || ".")) ?? [];

    return entries
        .filter((e) => !dirsOnly || e.type === "dir")
        .map((e) => `${base}${e.name}${e.type === "dir" ? "/" : ""}`);
}

const ls = {
    name: "ls",
    aliases: ["dir"],
    category: "system",
    usage: "ls [path] [-l]",
    description: "List what's in the current directory.",
    examples: ["ls", "ls network", "ls -l projects"],
    flags: { l: "boolean" },
    complete: (ctx, { partial }) => pathCandidates(ctx, partial),

    run(ctx, { args, flags }) {
        const path = resolvePath(ctx.cwd, args[0] ?? ".");
        const node = getNode(path);

        if (!node) return out.error(`ls: ${args[0] ?? path}: no such file or directory`);
        if (node.type === "file") return out.text(args[0]);

        const entries = listDir(path);
        if (entries.length === 0) return out.muted("(empty)");

        if (flags.l) {
            return out.table(
                ["type", "name"],
                entries.map((e) => [e.type === "dir" ? "d" : "-", e.name])
            );
        }

        // Directories get a trailing slash and the accent colour; the
        // renderer reads meta.dirs to know which cells to tint.
        return out.text(
            entries.map((e) => (e.type === "dir" ? `${e.name}/` : e.name)).join("   "),
            { columns: true }
        );
    },
};

const cd = {
    name: "cd",
    category: "system",
    usage: "cd [path]",
    description: "Change directory. `cd` alone goes home.",
    examples: ["cd network", "cd network/labs", "cd ..", "cd"],
    complete: (ctx, { partial }) => pathCandidates(ctx, partial, { dirsOnly: true }),

    run(ctx, { args }) {
        const target = args[0] ?? HOME;
        const path = resolvePath(ctx.cwd, target);
        const node = getNode(path);

        if (!node) return out.error(`cd: ${target}: no such file or directory`);
        if (node.type !== "dir") return out.error(`cd: ${target}: not a directory`);

        ctx.setCwd(path);
    },
};

const pwd = {
    name: "pwd",
    category: "system",
    usage: "pwd",
    description: "Print the current directory.",
    run(ctx) {
        return out.text(ctx.cwd);
    },
};

const cat = {
    name: "cat",
    aliases: ["less", "more"],
    category: "system",
    usage: "cat <file>",
    description: "Read a file. Most of this site is readable this way.",
    examples: ["cat about.txt", "cat network/labs/vlan-trunk-native-mismatch.md"],
    complete: (ctx, { partial }) => pathCandidates(ctx, partial),

    run(ctx, { args }) {
        if (!args[0]) return out.error("usage: cat <file>");

        const path = resolvePath(ctx.cwd, args[0]);
        const node = getNode(path);

        if (!node) return out.error(`cat: ${args[0]}: no such file or directory`);
        if (node.type === "dir") return out.error(`cat: ${args[0]}: is a directory`);

        const blocks = [out.ascii(node.read())];
        if (node.action?.startsWith("route:")) {
            const to = node.action.slice(6);
            blocks.push(out.blank(), out.link(`read this as a page → ${to}`, to, { internal: true }));
        }
        if (node.action === "download") {
            blocks.push(out.blank(), out.link("download the PDF", profile.resumeUrl, { download: true }));
        }
        return blocks;
    },
};

const tree = {
    name: "tree",
    category: "system",
    usage: "tree [path]",
    description: "Show the whole filesystem at once.",
    examples: ["tree", "tree network"],
    complete: (ctx, { partial }) => pathCandidates(ctx, partial, { dirsOnly: true }),

    run(ctx, { args }) {
        const path = resolvePath(ctx.cwd, args[0] ?? ".");
        const node = getNode(path);
        if (!node) return out.error(`tree: ${args[0]}: no such file or directory`);
        if (node.type !== "dir") return out.error(`tree: ${args[0]}: not a directory`);

        const lines = renderTree(path);
        return [
            out.ascii([path, ...lines].join("\n")),
            out.blank(),
            out.muted(`${lines.filter((l) => l.endsWith("/")).length} directories, ${lines.filter((l) => !l.endsWith("/")).length} files`),
        ];
    },
};

/* ------------------------------------------------------------------
   neofetch
   ------------------------------------------------------------------ */

const LOGO = [
    "        ,--.        ",
    "       ( () )       ",
    "        `--'        ",
    "     ___________    ",
    "    /  _______  \\   ",
    "   |  | > _   | |   ",
    "   |  |_______| |   ",
    "    \\___________/   ",
    "     |||||||||||    ",
];

const neofetch = {
    name: "neofetch",
    category: "system",
    usage: "neofetch",
    description: "System info, portfolio edition.",
    run(ctx) {
        const days = daysSince(profile.shell.codingSince);
        const info = [
            [`${ctx.env.USER}@${ctx.env.HOST}`, ""],
            ["─".repeat(20), ""],
            ["OS", "PortfolioOS 2.0 (dual-stack)"],
            ["Shell", "portfolio-sh 2.0"],
            ["Theme", ctx.theme],
            ["Uptime", `${humanDuration(days)} of writing code`],
            ["Kernel", "React 18 · Vite 6"],
            ["Packages", `${commandCount()} commands`],
            ["Frontend", "React, Tailwind, Framer Motion"],
            ["Network", "CCNA 200-301 (in progress)"],
            ["Terminal", "hand-rolled, no xterm.js"],
        ];

        const rendered = info.map(([k, v]) => (v ? `${k.padEnd(10)} ${v}` : k));
        const height = Math.max(LOGO.length, rendered.length);
        const lines = [];

        for (let i = 0; i < height; i++) {
            lines.push(`${(LOGO[i] ?? " ".repeat(20))}  ${rendered[i] ?? ""}`.trimEnd());
        }

        return out.ascii(lines.join("\n"));
    },
};

/* ------------------------------------------------------------------
   exit
   ------------------------------------------------------------------ */

const exit = {
    name: "exit",
    aliases: ["quit", "logout", "q"],
    category: "system",
    usage: "exit",
    description: "Leave the terminal (the site is still here).",
    run(ctx) {
        // Inside IOS modes, `exit` steps back a level instead of closing —
        // that's what a real session does, and the IOS commands set this.
        if (ctx.session.iosMode && ctx.session.iosMode !== "user") {
            ctx.session.iosMode = ctx.session.iosMode === "config" ? "privileged" : "user";
            return out.muted(`now in ${ctx.session.iosMode} mode`);
        }
        ctx.close?.();
        return out.muted("logout");
    },
};

export default [
    help,
    man,
    clear,
    history,
    echo,
    date,
    whoami,
    theme,
    ls,
    cd,
    pwd,
    cat,
    tree,
    neofetch,
    exit,
];
