// ---------------------------------------------------------------
// The output block model. Commands never touch the DOM — they call
// ctx.print() with one of these descriptors and the renderer decides
// how to draw it. That's what makes commands unit-testable: a test
// asserts on the blocks a command produced (§6.2, §6.9).
// ---------------------------------------------------------------

let sequence = 0;
const nextId = () => `blk-${++sequence}`;

/** Scrollback cap — oldest blocks are trimmed (§6.10). */
export const MAX_BLOCKS = 500;

/** @typedef {'text'|'error'|'warn'|'success'|'muted'|'heading'|'table'|'keyvalue'|'ascii'|'prompt'|'link'|'jsx'} BlockKind */

/** @typedef {Object} OutputBlock
 *  @property {string} id
 *  @property {BlockKind} kind
 *  @property {any} content
 *  @property {Record<string, any>} [meta]
 */

const make = (kind, content, meta) => ({ id: nextId(), kind, content, meta });

/** Plain output line(s). */
export const text = (content, meta) => make("text", content, meta);

/** Red — command errors, failed pings. */
export const error = (content) => make("error", content);

/** Amber — warnings and "in progress" states. */
export const warn = (content) => make("warn", content);

/** Green — successful results on networking surfaces. */
export const success = (content) => make("success", content);

/** Dimmed — hints, secondary detail. */
export const muted = (content) => make("muted", content);

/** A section title inside output. */
export const heading = (content) => make("heading", content);

/** Fixed-width ASCII that must never wrap — banners, topology, IOS tables. */
export const ascii = (content) => make("ascii", content);

/** Echo of the command the user ran, rendered with the prompt. */
export const promptEcho = (input, prompt) => make("prompt", input, { prompt });

/**
 * A table the renderer aligns and can scroll horizontally on mobile.
 * @param {string[]} head
 * @param {(string|number)[][]} rows
 */
export const table = (head, rows, meta) => make("table", { head, rows }, meta);

/**
 * Aligned key/value pairs — `subnet`, `ipcalc`, `whoami`.
 * @param {[string, any][]} pairs
 */
export const keyValue = (pairs, meta) => make("keyvalue", pairs, meta);

/**
 * A clickable link. `internal: true` routes with React Router instead
 * of leaving the site.
 */
export const link = (label, href, opts = {}) =>
    make("link", { label, href, ...opts });

/** Escape hatch for the few commands that need real markup (`handshake`). */
export const jsx = (node) => make("jsx", node);

/** Blank spacer line. */
export const blank = () => make("text", "");

/**
 * Appends blocks and enforces the scrollback cap.
 * @param {OutputBlock[]} current
 * @param {OutputBlock|OutputBlock[]} incoming
 * @returns {OutputBlock[]}
 */
export function append(current, incoming) {
    const additions = Array.isArray(incoming) ? incoming : [incoming];
    const next = current.concat(additions);
    return next.length > MAX_BLOCKS ? next.slice(next.length - MAX_BLOCKS) : next;
}

/**
 * Normalizes whatever a command passed to ctx.print() into blocks.
 * Strings become text blocks so commands can print casually.
 * @param {any} value
 * @returns {OutputBlock[]}
 */
export function toBlocks(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(toBlocks);
    if (typeof value === "string") return [text(value)];
    if (typeof value === "object" && value.kind && value.id) return [value];
    // A React element or anything else renderable.
    return [jsx(value)];
}
