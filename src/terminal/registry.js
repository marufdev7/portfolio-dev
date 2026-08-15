// ---------------------------------------------------------------
// Command registry (§6.2, §6.10).
//
// Adding a command means exporting it from a file under commands/ —
// there is no list to update. The glob picks it up, the registry
// indexes it by name and every alias, and `help`, `man`, and tab
// completion all read from that index. Metadata can't drift from
// behaviour because there is only one copy of it.
//
// The whole registry lives in the terminal's own chunk: the terminal
// component is React.lazy'd, so none of this is in the initial bundle.
// ---------------------------------------------------------------

/** @typedef {Object} CommandContext see engine.js for the full shape */

/** @typedef {Object} Command
 *  @property {string} name
 *  @property {string[]} [aliases]
 *  @property {'system'|'portfolio'|'network'|'ios'|'quiz'|'fun'} category
 *  @property {string} usage
 *  @property {string} description
 *  @property {string[]} [examples]
 *  @property {string} [notes]            extra prose for `man`
 *  @property {Record<string,'string'|'number'|'boolean'>} [flags]
 *  @property {Record<string,string>} [aliasFlags]   short letter → flag name
 *  @property {boolean} [hidden]          kept out of `help`, still runnable
 *  @property {(ctx: CommandContext, input: {args: string[], flags: Object, raw: string}) => any} run
 */

/** Display order and labels for `help` (§6.5). */
export const CATEGORIES = [
    { key: "system", label: "System" },
    { key: "portfolio", label: "Portfolio" },
    { key: "network", label: "Networking" },
    { key: "ios", label: "Cisco IOS (simulated)" },
    { key: "quiz", label: "Quiz" },
    { key: "fun", label: "Fun" },
];

const modules = import.meta.glob("./commands/*.js", { eager: true });

/** @type {Map<string, Command>} */
const index = new Map();
/** @type {Command[]} */
const all = [];

/** Problems found while indexing — surfaced by the registry test (§6.9). */
export const registryIssues = [];

function register(command, source) {
    const problems = [];
    if (!command?.name) problems.push(`${source}: a command is missing 'name'`);
    if (!command?.usage) problems.push(`${command?.name ?? source}: missing 'usage'`);
    if (!command?.description) problems.push(`${command?.name ?? source}: missing 'description'`);
    if (typeof command?.run !== "function") {
        problems.push(`${command?.name ?? source}: missing 'run'`);
    }
    if (!CATEGORIES.some((c) => c.key === command?.category)) {
        problems.push(`${command?.name ?? source}: unknown category '${command?.category}'`);
    }

    if (problems.length) {
        registryIssues.push(...problems);
        return;
    }

    for (const key of [command.name, ...(command.aliases ?? [])]) {
        const lower = key.toLowerCase();
        if (index.has(lower)) {
            registryIssues.push(
                `duplicate name/alias '${lower}' — claimed by both '${index.get(lower).name}' and '${command.name}'`
            );
            continue;
        }
        index.set(lower, command);
    }
    all.push(command);
}

for (const [path, mod] of Object.entries(modules)) {
    const exported = mod.default ?? mod.commands;
    if (!exported) {
        registryIssues.push(`${path}: no default export`);
        continue;
    }
    for (const command of Array.isArray(exported) ? exported : [exported]) {
        register(command, path);
    }
}

all.sort((a, b) => a.name.localeCompare(b.name));

/**
 * Looks a command up by name or alias.
 * @param {string} name
 * @returns {Command|undefined}
 */
export function resolve(name) {
    return index.get(String(name ?? "").toLowerCase());
}

/** Every registered command, name-sorted, hidden ones included. */
export function listCommands({ includeHidden = false } = {}) {
    return includeHidden ? all.slice() : all.filter((c) => !c.hidden);
}

/** Names and aliases — the candidate set for completion and did-you-mean. */
export function commandNames({ includeHidden = false, includeAliases = true } = {}) {
    const names = [];
    for (const command of all) {
        if (command.hidden && !includeHidden) continue;
        names.push(command.name);
        if (includeAliases) names.push(...(command.aliases ?? []));
    }
    return names.sort();
}

/**
 * Grouped for `help`.
 * @returns {{key: string, label: string, commands: Command[]}[]}
 */
export function commandsByCategory({ includeHidden = false } = {}) {
    return CATEGORIES.map(({ key, label }) => ({
        key,
        label,
        commands: all.filter((c) => c.category === key && (includeHidden || !c.hidden)),
    })).filter((group) => group.commands.length > 0);
}

/** Total registered, for the boot banner's "N commands" line. */
export function commandCount() {
    return all.filter((c) => !c.hidden).length;
}
