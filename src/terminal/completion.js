// ---------------------------------------------------------------
// Tab completion (§6.5).
//
// Context-aware: at position 0 it completes command names; after that
// it asks the command itself for candidates via an optional
// `complete()` hook, so `cd <Tab>` offers directories, `show <Tab>`
// offers IOS keywords, and `quiz <Tab>` offers modes — without the
// completion engine knowing anything about those domains.
// ---------------------------------------------------------------

import { tokenize } from "./parser";
import { resolve, commandNames } from "./registry";

/**
 * Longest string every candidate starts with. Bash fills this in on a
 * single Tab and only lists options on the second — matching that
 * behaviour is most of what makes completion feel native.
 *
 * @param {string[]} candidates
 * @returns {string}
 */
export function commonPrefix(candidates) {
    if (candidates.length === 0) return "";
    if (candidates.length === 1) return candidates[0];

    let prefix = candidates[0];
    for (const candidate of candidates.slice(1)) {
        let i = 0;
        while (i < prefix.length && i < candidate.length && prefix[i] === candidate[i]) i++;
        prefix = prefix.slice(0, i);
        if (!prefix) break;
    }
    return prefix;
}

const startsWith = (list, partial) => {
    const needle = partial.toLowerCase();
    return list.filter((item) => item.toLowerCase().startsWith(needle));
};

/**
 * Computes a completion for the current input.
 *
 * @param {string} input the whole line
 * @param {Object} ctx command context (for cwd, device state, …)
 * @returns {{value: string, suggestions: string[], appended: boolean}}
 *   `value` — the line after filling in the common prefix
 *   `suggestions` — candidates worth listing (empty if 0 or 1 match)
 */
export function complete(input, ctx) {
    const line = String(input ?? "");
    const endsWithSpace = /\s$/.test(line);
    const tokens = tokenize(line);

    // Completing a fresh word vs. extending the one under the cursor.
    const partial = endsWithSpace ? "" : (tokens[tokens.length - 1] ?? "");
    const head = endsWithSpace ? tokens : tokens.slice(0, -1);

    const nothing = { value: line, suggestions: [], appended: false };

    /* --- position 0: command names --- */
    if (head.length === 0) {
        const matches = startsWith(commandNames(), partial);
        if (matches.length === 0) return nothing;

        const filled = commonPrefix(matches);
        const value = matches.length === 1 ? `${filled} ` : filled;
        return {
            value,
            suggestions: matches.length > 1 ? matches : [],
            appended: value !== line,
        };
    }

    /* --- everything after: ask the command --- */
    const command = resolve(head[0]);
    let candidates = [];

    if (partial.startsWith("-")) {
        // Flag completion is generic — every command declares its flags.
        const declared = Object.keys(command?.flags ?? {});
        candidates = startsWith(
            declared.map((f) => `--${f}`),
            partial
        );
    } else if (typeof command?.complete === "function") {
        const produced =
            command.complete(ctx, {
                partial,
                args: head.slice(1),
                index: head.length - 1,
            }) ?? [];
        candidates = startsWith(produced, partial);
    }

    if (candidates.length === 0) return nothing;

    const filled = commonPrefix(candidates);
    // Directory candidates arrive with a trailing '/'; don't add a space
    // after one, so `cd network/` can keep going.
    const suffix = candidates.length === 1 && !filled.endsWith("/") ? " " : "";
    const value = `${line.slice(0, line.length - partial.length)}${filled}${suffix}`;

    return {
        value,
        suggestions: candidates.length > 1 ? candidates : [],
        appended: value !== line,
    };
}
