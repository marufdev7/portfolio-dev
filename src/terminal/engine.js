// ---------------------------------------------------------------
// The engine (§6.2): execute(input, ctx) → parse → resolve → run.
//
// It owns exactly three things: turning a line into an invocation,
// finding the command, and making sure whatever happens next ends up
// as output blocks rather than an exception. Commands stay pure-ish
// and testable because everything they can touch arrives on ctx.
// ---------------------------------------------------------------

import { parse, expandVars } from "./parser";
import { resolve, commandNames } from "./registry";
import { expandBang } from "./history";
import { nearest } from "../lib/levenshtein";
import { IpError } from "../lib/ip";
import * as out from "./output";

/** @typedef {Object} CommandContext
 *  @property {(value: any) => void} print          queue output blocks
 *  @property {() => void} clear                    wipe scrollback
 *  @property {string} cwd
 *  @property {(path: string) => void} setCwd
 *  @property {string[]} history
 *  @property {Record<string, string>} env
 *  @property {(ms: number) => Promise<void>} sleep resolves instantly under reduced-motion
 *  @property {(path: string) => void} go           React Router navigation
 *  @property {(mode: 'dark'|'light'|'toggle') => void} setTheme
 *  @property {string} theme
 *  @property {Object} session                      mutable per-session state (IOS device, quiz, eggs)
 *  @property {(fn: ((input: string, ctx: CommandContext) => any)|null) => void} setInterceptor
 *  @property {() => ((input: string, ctx: CommandContext) => any)|null} getInterceptor
 */

/**
 * Runs one line of input.
 *
 * Never throws: a command that blows up prints a red block and the
 * prompt comes back. A terminal that dies on bad input is a terminal
 * nobody explores.
 *
 * @param {string} input
 * @param {CommandContext} ctx
 * @returns {Promise<{ok: boolean, command: string|null}>}
 */
export async function execute(input, ctx) {
    const raw = String(input ?? "");

    /* --- an interceptor owns the line: quiz answers, config-mode entry --- */
    const interceptor = ctx.getInterceptor?.();
    if (interceptor) {
        try {
            const result = await interceptor(raw, ctx);
            if (result !== undefined) ctx.print(result);
            return { ok: true, command: "(interactive)" };
        } catch (error) {
            ctx.print(out.error(describeError(error)));
            ctx.setInterceptor?.(null);
            return { ok: false, command: "(interactive)" };
        }
    }

    const trimmed = raw.trim();
    if (!trimmed) return { ok: true, command: null };
    if (trimmed.startsWith("#")) return { ok: true, command: null };

    /* --- history expansion happens before parsing, as in bash --- */
    let line = trimmed;
    if (line.startsWith("!")) {
        const expanded = expandBang(ctx.history ?? [], line);
        if (expanded === null) {
            ctx.print(out.error(`${line}: event not found`));
            return { ok: false, command: null };
        }
        ctx.print(out.muted(expanded));
        line = expanded;
    }

    const name = line.split(/\s+/)[0].toLowerCase();
    const command = resolve(name);

    if (!command) {
        ctx.print(out.error(`command not found: ${name}`));
        const suggestion = nearest(name, commandNames());
        if (suggestion) {
            ctx.print(out.muted(`did you mean '${suggestion}'?`));
        } else {
            ctx.print(out.muted("type `help` to see what's available."));
        }
        return { ok: false, command: null };
    }

    /* --- parse against the command's own flag spec --- */
    let parsed;
    try {
        parsed = parse(line, { flags: command.flags, aliasFlags: command.aliasFlags });
    } catch (error) {
        ctx.print(out.error(`${command.name}: ${error.message}`));
        ctx.print(out.muted(command.usage));
        return { ok: false, command: command.name };
    }

    /* --- run --- */
    try {
        const result = await command.run(ctx, {
            args: parsed.args.map((a) => expandVars(a, ctx.env ?? {})),
            rawArgs: parsed.args,
            flags: parsed.flags,
            raw: line,
            tokens: parsed.tokens,
        });
        if (result !== undefined) ctx.print(result);
        return { ok: true, command: command.name };
    } catch (error) {
        if (error instanceof IpError) {
            // Address math failures are user errors, not crashes — they get
            // the usage line, because the fix is almost always in the input.
            ctx.print(out.error(`${command.name}: ${error.message}`));
            ctx.print(out.muted(`usage: ${command.usage}`));
        } else {
            ctx.print(out.error(`${command.name}: ${describeError(error)}`));
        }
        return { ok: false, command: command.name };
    }
}

function describeError(error) {
    if (error instanceof Error) return error.message;
    return String(error);
}
