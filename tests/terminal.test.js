// ---------------------------------------------------------------
// Registry + engine coverage (§6.9).
//
// The registry test is the guard that makes "adding a command is one
// file, zero wiring" safe: if a new command collides with an existing
// alias or forgets its usage line, this fails rather than the user
// discovering it.
// ---------------------------------------------------------------

import { describe, it, expect, beforeEach } from "vitest";
import {
    listCommands,
    commandNames,
    resolve,
    registryIssues,
    commandsByCategory,
    CATEGORIES,
} from "../src/terminal/registry";
import { execute } from "../src/terminal/engine";
import { complete, commonPrefix } from "../src/terminal/completion";
import { parse, tokenize, expandVars } from "../src/terminal/parser";
import { navigate, pushHistory, expandBang } from "../src/terminal/history";
import { resolvePath, getNode, listDir } from "../src/terminal/vfs";

/* ------------------------------------------------------------------
   A context that records instead of rendering.
   ------------------------------------------------------------------ */

function makeContext(overrides = {}) {
    const blocks = [];
    let interceptor = null;

    const ctx = {
        blocks,
        print: (value) => {
            const list = Array.isArray(value) ? value : [value];
            for (const b of list) if (b) blocks.push(b);
        },
        clear: () => blocks.splice(0, blocks.length),
        cwd: "~",
        setCwd(path) {
            ctx.cwd = path;
        },
        history: [],
        env: { USER: "maruf", HOST: "portfolio", PWD: "~" },
        sleep: () => Promise.resolve(), // tests never wait on animation
        go: (path) => blocks.push({ kind: "__navigate", content: path }),
        openExternal: (url) => blocks.push({ kind: "__external", content: url }),
        download: (url) => blocks.push({ kind: "__download", content: url }),
        close: () => blocks.push({ kind: "__close" }),
        theme: "dark",
        setTheme: (mode) => blocks.push({ kind: "__theme", content: mode }),
        session: {},
        setInterceptor: (fn) => {
            interceptor = fn;
        },
        getInterceptor: () => interceptor,
        ...overrides,
    };
    return ctx;
}

/** Runs a line and returns every block it produced, flattened to text. */
async function run(line, ctx = makeContext()) {
    ctx.blocks.length = 0;
    const result = await execute(line, ctx);
    const text = ctx.blocks
        .map((b) => (typeof b.content === "string" ? b.content : JSON.stringify(b.content)))
        .join("\n");
    return { ...result, ctx, blocks: ctx.blocks, text };
}

const kinds = (blocks) => blocks.map((b) => b.kind);

/* ------------------------------------------------------------------
   Registry
   ------------------------------------------------------------------ */

describe("registry", () => {
    it("loads every command module without a structural problem", () => {
        expect(registryIssues).toEqual([]);
    });

    it("registers a reasonable number of commands", () => {
        // The plan promises ~45 including aliases and eggs.
        expect(commandNames({ includeHidden: true }).length).toBeGreaterThanOrEqual(45);
    });

    it("gives every command a usage line, description, and known category", () => {
        for (const command of listCommands({ includeHidden: true })) {
            expect(command.usage, `${command.name} usage`).toBeTruthy();
            expect(command.description, `${command.name} description`).toBeTruthy();
            expect(typeof command.run, `${command.name} run`).toBe("function");
            expect(CATEGORIES.map((c) => c.key)).toContain(command.category);
        }
    });

    it("has no duplicate names or aliases", () => {
        const seen = new Set();
        for (const name of commandNames({ includeHidden: true })) {
            expect(seen.has(name), `duplicate: ${name}`).toBe(false);
            seen.add(name);
        }
    });

    it("resolves aliases to their command", () => {
        expect(resolve("ipcalc").name).toBe("subnet");
        expect(resolve("cls").name).toBe("clear");
        expect(resolve("SH").name).toBe("show");
    });

    it("hides easter eggs from help but keeps them runnable", () => {
        const visible = listCommands().map((c) => c.name);
        expect(visible).not.toContain("sudo");
        expect(resolve("sudo")).toBeDefined();
    });

    it("groups every visible command under a category", () => {
        const grouped = commandsByCategory().flatMap((g) => g.commands);
        expect(grouped.length).toBe(listCommands().length);
    });
});

/* ------------------------------------------------------------------
   Parser
   ------------------------------------------------------------------ */

describe("parser", () => {
    it("splits on whitespace and respects quotes", () => {
        expect(tokenize('echo "hello world" bare')).toEqual(["echo", "hello world", "bare"]);
        expect(tokenize("cowsay 'it is fine'")).toEqual(["cowsay", "it is fine"]);
    });

    it("keeps an empty quoted string as a token", () => {
        expect(tokenize('echo ""')).toEqual(["echo", ""]);
    });

    it("handles escapes", () => {
        expect(tokenize("echo a\\ b")).toEqual(["echo", "a b"]);
    });

    it("parses long flags in both forms", () => {
        const spec = { flags: { hosts: "number", binary: "boolean" } };
        expect(parse("subnet 10.0.0.0/8 --hosts 500", spec).flags).toEqual({ hosts: 500 });
        expect(parse("subnet 10.0.0.0/8 --hosts=500", spec).flags).toEqual({ hosts: 500 });
        expect(parse("subnet 10.0.0.0/8 --binary", spec).flags).toEqual({ binary: true });
    });

    it("parses short flags, attached and detached", () => {
        const spec = { flags: { count: "number" }, aliasFlags: { c: "count" } };
        expect(parse("ping R1 -c 4", spec).flags).toEqual({ count: 4 });
        expect(parse("ping R1 -c4", spec).flags).toEqual({ count: 4 });
    });

    it("groups boolean short flags", () => {
        expect(parse("ls -la").flags).toEqual({ l: true, a: true });
    });

    it("stops flag parsing at --", () => {
        const parsed = parse("echo -- --not-a-flag");
        expect(parsed.args).toEqual(["--not-a-flag"]);
        expect(parsed.flags).toEqual({});
    });

    it("rejects a value flag with nothing after it", () => {
        expect(() => parse("subnet x --hosts", { flags: { hosts: "number" } })).toThrow(/expects a value/);
    });

    it("does not treat a negative number as a flag", () => {
        expect(parse("ttl -5").args).toEqual(["-5"]);
    });

    it("expands variables, and empties unknown ones", () => {
        expect(expandVars("$USER@$HOST", { USER: "maruf", HOST: "portfolio" })).toBe("maruf@portfolio");
        expect(expandVars("${A}-${B}", { A: "x" })).toBe("x-");
    });
});

/* ------------------------------------------------------------------
   History
   ------------------------------------------------------------------ */

describe("history", () => {
    const entries = ["ls", "subnet 10.0.0.0/8", "ping R1"];

    it("collapses consecutive duplicates", () => {
        expect(pushHistory(["ls"], "ls")).toEqual(["ls"]);
        expect(pushHistory(["ls"], "pwd")).toEqual(["ls", "pwd"]);
        expect(pushHistory(["ls"], "   ")).toEqual(["ls"]);
    });

    it("walks backwards from the newest entry", () => {
        let state = navigate(entries, 0, "up", "draft");
        expect(state).toEqual({ index: 1, value: "ping R1" });
        state = navigate(entries, state.index, "up", "draft");
        expect(state.value).toBe("subnet 10.0.0.0/8");
    });

    it("restores the draft when you come back down past the newest", () => {
        const state = navigate(entries, 1, "down", "half-typed");
        expect(state).toEqual({ index: 0, value: "half-typed" });
    });

    it("does not walk past the oldest entry", () => {
        const state = navigate(entries, 3, "up", "draft");
        expect(state.index).toBe(3);
        expect(state.value).toBe("ls");
    });

    it("expands !! and !n", () => {
        expect(expandBang(entries, "!!")).toBe("ping R1");
        expect(expandBang(entries, "!2")).toBe("subnet 10.0.0.0/8");
        expect(expandBang(entries, "!99")).toBeNull();
        expect(expandBang(entries, "ls")).toBeNull();
    });
});

/* ------------------------------------------------------------------
   VFS
   ------------------------------------------------------------------ */

describe("vfs", () => {
    it("resolves relative, absolute, and ~ paths", () => {
        expect(resolvePath("~", "network")).toBe("~/network");
        expect(resolvePath("~/network", "labs")).toBe("~/network/labs");
        expect(resolvePath("~/network/labs", "..")).toBe("~/network");
        expect(resolvePath("~/network/labs", "~")).toBe("~");
        expect(resolvePath("~/network", "/projects")).toBe("~/projects");
        expect(resolvePath("~/network", ".")).toBe("~/network");
    });

    it("does not escape above home", () => {
        expect(resolvePath("~", "../../..")).toBe("~");
    });

    it("lists directories before files", () => {
        const entries = listDir("~");
        const firstFile = entries.findIndex((e) => e.type === "file");
        const lastDir = entries.map((e) => e.type).lastIndexOf("dir");
        expect(lastDir).toBeLessThan(firstFile);
    });

    it("builds file contents from the data layer", () => {
        const node = getNode("~/about.txt");
        expect(node.type).toBe("file");
        expect(node.read()).toContain("Maruf");
    });

    it("returns null for a path that does not exist", () => {
        expect(getNode("~/nope")).toBeNull();
    });
});

/* ------------------------------------------------------------------
   Engine
   ------------------------------------------------------------------ */

describe("engine", () => {
    it("ignores empty input and comments", async () => {
        const { blocks } = await run("   ");
        expect(blocks).toEqual([]);
        expect((await run("# just a note")).blocks).toEqual([]);
    });

    it("reports an unknown command with a suggestion", async () => {
        const { text, ok } = await run("pign R1");
        expect(ok).toBe(false);
        expect(text).toContain("command not found: pign");
        expect(text).toContain("ping");
    });

    it("falls back to a hint when nothing is close", async () => {
        const { text } = await run("zzzzqqqq");
        expect(text).toContain("help");
    });

    it("turns an address error into a usage hint, not a crash", async () => {
        const { text, ok } = await run("subnet 999.1.1.1/24");
        expect(ok).toBe(false);
        expect(text).toContain("usage:");
    });

    it("survives a command that throws", async () => {
        const ctx = makeContext();
        const { ok } = await run("subnet", ctx); // no args → handled error block
        expect(ok).toBe(true);
        expect(kinds(ctx.blocks)).toContain("error");
    });
});

/* ------------------------------------------------------------------
   Commands — the ones with real logic behind them
   ------------------------------------------------------------------ */

describe("network commands", () => {
    it("subnet prints the breakdown the plan specifies", async () => {
        const { text } = await run("subnet 192.168.1.10/26");
        expect(text).toContain("192.168.1.0/26");
        expect(text).toContain("255.255.255.192");
        expect(text).toContain("0.0.0.63");
        expect(text).toContain("192.168.1.1 – 192.168.1.62");
        expect(text).toContain("62");
    });

    it("subnet accepts an ip and a mask as two arguments", async () => {
        const { text } = await run("subnet 10.0.0.1 255.255.255.0");
        expect(text).toContain("10.0.0.0/24");
    });

    it("subnet --binary shows the network/host split", async () => {
        const { text } = await run("subnet 192.168.1.10/26 --binary");
        expect(text).toContain("11000000.10101000.00000001.00001010");
        expect(text).toContain("network bits");
    });

    it("subnet --subnets splits the range", async () => {
        const { text } = await run("subnet 192.168.1.0/24 --subnets 4");
        expect(text).toContain("/26");
        expect(text).toContain("192.168.1.192");
    });

    it("vlsm allocates largest-first — the plan's worked example", async () => {
        const { text } = await run("vlsm 192.168.1.0/24 60 28 12 5");
        expect(text).toContain("192.168.1.0");
        expect(text).toContain("192.168.1.64");
        expect(text).toContain("192.168.1.96");
        expect(text).toContain("192.168.1.112");
        expect(text).toContain("/26");
        expect(text).toContain("/29");
    });

    it("vlsm refuses an allocation that cannot fit", async () => {
        const { ok, text } = await run("vlsm 192.168.1.0/28 100");
        expect(ok).toBe(false);
        expect(text).toContain("cannot fit");
    });

    it("summarize reports exactness honestly", async () => {
        const exact = await run("summarize 192.168.0.0/24 192.168.1.0/24 192.168.2.0/24 192.168.3.0/24");
        expect(exact.text).toContain("192.168.0.0/22");
        expect(exact.text).toContain("Exact");

        const inexact = await run("summarize 192.168.0.0/24 192.168.7.0/24");
        expect(inexact.text).toContain("Inexact");
    });

    it("wildcard converts every input form", async () => {
        for (const input of ["192.168.1.0/26", "/26", "26", "255.255.255.192"]) {
            const { text } = await run(`wildcard ${input}`);
            expect(text, input).toContain("0.0.0.63");
        }
    });

    it("binary round-trips an address", async () => {
        const { text } = await run("binary 192.168.1.1");
        expect(text).toContain("11000000.10101000.00000001.00000001");
        expect(text).toContain("0xC0A80101");
        expect(text).toContain("3,232,235,777");
    });

    it("contains answers both ways", async () => {
        expect((await run("contains 192.168.1.0/26 192.168.1.70")).text).toContain("no —");
        expect((await run("contains 192.168.1.0/26 192.168.1.10")).text).toContain("yes —");
    });

    it("port looks up by number and by name", async () => {
        expect((await run("port 443")).text).toContain("HTTPS");
        expect((await run("port ssh")).text).toContain("22");
    });

    it("mac decodes the cast and administration bits", async () => {
        const { text } = await run("mac 0060.5C7B.1A01");
        expect(text).toContain("unicast");
        expect(text).toContain("globally unique");
    });

    it("osi answers for a single layer", async () => {
        const { text } = await run("osi 3");
        expect(text).toContain("Network");
        expect(text).toContain("OSPF");
    });

    it("ping succeeds for a known host and fails honestly for an unknown one", async () => {
        const known = await run("ping R2 -c 2");
        expect(known.text).toContain("0% packet loss");

        const unknown = await run("ping 192.168.99.99 -c 2");
        expect(unknown.text).toContain("100% packet loss");
    });

    it("ping rejects a name it cannot resolve", async () => {
        const { text } = await run("ping not-a-host");
        expect(text).toContain("Name or service not known");
    });
});

describe("ios commands", () => {
    it("refuses running-config from user mode", async () => {
        const ctx = makeContext();
        const { text } = await run("show running-config", ctx);
        expect(text).toContain("privileged");
    });

    it("allows it after enable", async () => {
        const ctx = makeContext();
        await run("enable", ctx);
        const { text } = await run("show running-config", ctx);
        expect(text).toContain("hostname R1");
    });

    it("prefers the longest matching show subcommand", async () => {
        const ctx = makeContext();
        const brief = await run("show ip interface brief", ctx);
        expect(brief.text).toContain("GigabitEthernet0/0");
        expect(brief.text).toContain("Protocol");

        const route = await run("show ip route", ctx);
        expect(route.text).toContain("directly connected");
    });

    it("switches devices and answers as the new one", async () => {
        const ctx = makeContext();
        await run("device SW1", ctx);
        expect(ctx.session.device).toBe("SW1");

        const vlan = await run("show vlan brief", ctx);
        expect(vlan.text).toContain("USERS");

        const route = await run("show ip route", ctx);
        expect(route.text).toContain("layer 2 switch");
    });

    it("config mode captures raw lines until end", async () => {
        const ctx = makeContext();
        await run("enable", ctx);
        await run("configure terminal", ctx);
        expect(ctx.getInterceptor()).toBeTypeOf("function");

        await run("interface gi0/1", ctx);
        expect(ctx.session.configBuffer).toEqual(["interface gi0/1"]);

        const done = await run("end", ctx);
        expect(ctx.getInterceptor()).toBeNull();
        expect(done.text).toContain("read-only");
    });
});

describe("portfolio commands", () => {
    it("finds a lab by slug, padded id, and bare number", async () => {
        for (const key of ["01-vlan-trunking", "01", "1"]) {
            const { text } = await run(`lab ${key}`);
            expect(text, key).toContain("What broke");
        }
    });

    it("lists projects and filters by stack", async () => {
        expect((await run("projects")).text).toContain("Kaira Fashion");
        const filtered = await run("projects --stack React");
        expect(filtered.text).toContain("Pro Fast");
        expect(filtered.text).toContain("Furni");
    });

    it("navigates the site", async () => {
        const { blocks } = await run("open projects");
        expect(blocks.some((b) => b.kind === "__navigate" && b.content === "/projects")).toBe(true);
    });

    it("changes the theme through the same door the toggle uses", async () => {
        const { blocks } = await run("theme light");
        expect(blocks.some((b) => b.kind === "__theme" && b.content === "light")).toBe(true);
    });
});

describe("filesystem commands", () => {
    it("cd changes directory and rejects files", async () => {
        const ctx = makeContext();
        await run("cd network", ctx);
        expect(ctx.cwd).toBe("~/network");

        const bad = await run("cd ccna-progress.md", ctx);
        expect(bad.text).toContain("not a directory");
        expect(ctx.cwd).toBe("~/network");
    });

    it("cat reads generated content and offers the page equivalent", async () => {
        const { text, blocks } = await run("cat about.txt");
        expect(text).toContain("Maruf");
        expect(kinds(blocks)).toContain("ascii");
    });

    it("cat fails clearly on a missing file", async () => {
        const { text } = await run("cat nope.txt");
        expect(text).toContain("no such file or directory");
    });

    it("tree renders the whole structure", async () => {
        const { text } = await run("tree");
        expect(text).toContain("└──");
        expect(text).toContain("labs");
    });
});

describe("quiz", () => {
    it("takes over the prompt and scores a full round", async () => {
        const ctx = makeContext();
        const start = await run("quiz subnet --count 2", ctx);
        expect(start.text).toContain("Question 1 of 2");
        expect(ctx.getInterceptor()).toBeTypeOf("function");

        // Answering wrong twice still completes the round and scores it.
        await run("definitely wrong", ctx);
        const end = await run("also wrong", ctx);

        expect(ctx.getInterceptor()).toBeNull();
        expect(end.text).toContain("0/2");
        expect(end.text).toContain("Worth reviewing");
    });

    it("accepts the right answer", async () => {
        const ctx = makeContext();
        await run("quiz ports --count 1", ctx);
        const question = ctx.session.quiz.questions[0];
        const result = await run(question.answer, ctx);
        expect(result.text).toContain("correct");
    });

    it("quits early and still reports a score", async () => {
        const ctx = makeContext();
        await run("quiz osi --count 5", ctx);
        const { text } = await run("quit", ctx);
        expect(text).toContain("ended early");
        expect(ctx.getInterceptor()).toBeNull();
    });
});

/* ------------------------------------------------------------------
   Completion
   ------------------------------------------------------------------ */

describe("completion", () => {
    let ctx;
    beforeEach(() => {
        ctx = makeContext();
    });

    it("finds the longest common prefix", () => {
        expect(commonPrefix(["subnet", "summarize"])).toBe("su");
        expect(commonPrefix(["ping"])).toBe("ping");
        expect(commonPrefix([])).toBe("");
    });

    it("completes a unique command and adds a space", () => {
        expect(complete("vls", ctx).value).toBe("vlsm ");
    });

    it("fills the common prefix and lists ambiguous matches", () => {
        const result = complete("su", ctx);
        expect(result.suggestions).toContain("subnet");
        expect(result.suggestions).toContain("summarize");
    });

    it("completes directories for cd, without a trailing space", () => {
        const result = complete("cd net", ctx);
        expect(result.value).toBe("cd network/");
    });

    it("completes nested paths", () => {
        const result = complete("cd network/la", ctx);
        expect(result.value).toBe("cd network/labs/");
    });

    it("completes flags for the command being typed", () => {
        const result = complete("subnet 10.0.0.0/8 --b", ctx);
        expect(result.value).toBe("subnet 10.0.0.0/8 --binary ");
    });

    it("leaves input alone when nothing matches", () => {
        expect(complete("qqqq", ctx).value).toBe("qqqq");
    });
});

/* ------------------------------------------------------------------
   Every command runs without throwing
   ------------------------------------------------------------------ */

describe("smoke", () => {
    const EXAMPLES = listCommands({ includeHidden: true }).flatMap((c) =>
        c.examples?.length ? c.examples : [c.name]
    );

    it.each(EXAMPLES)("`%s` produces output without throwing", async (line) => {
        const ctx = makeContext();
        // `clear` legitimately produces nothing, and `exit` closes.
        await expect(execute(line, ctx)).resolves.toBeDefined();
    });
});
