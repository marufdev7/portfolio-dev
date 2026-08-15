// ---------------------------------------------------------------
// Text formatting shared by the terminal output and the React pages.
// Column-aligned tables are the whole reason the IOS commands look
// convincing, so that logic lives here rather than in each command.
// ---------------------------------------------------------------

/**
 * Fixed-width table, IOS style — no borders, two-space gutters,
 * left-aligned unless a column is flagged numeric.
 *
 * @param {string[]} head
 * @param {(string|number)[][]} rows
 * @param {{gutter?: number, align?: ('left'|'right')[], underline?: boolean}} [opts]
 * @returns {string}
 */
export function table(head, rows, opts = {}) {
    const { gutter = 2, align = [], underline = false } = opts;
    const all = [head, ...rows];
    const widths = head.map((_, i) =>
        Math.max(...all.map((r) => String(r[i] ?? "").length))
    );

    const pad = (cell, i) => {
        const value = String(cell ?? "");
        return align[i] === "right"
            ? value.padStart(widths[i])
            : value.padEnd(widths[i]);
    };

    const sep = " ".repeat(gutter);
    const lines = [head.map(pad).join(sep).trimEnd()];
    if (underline) lines.push(widths.map((w) => "-".repeat(w)).join(sep));
    rows.forEach((r) => lines.push(r.map(pad).join(sep).trimEnd()));

    return lines.join("\n");
}

/**
 * Two-column key/value block — used by `subnet`, `ipcalc`, `whoami`.
 * @param {[string, string|number][]} pairs
 * @param {number} [minKeyWidth]
 */
export function keyValue(pairs, minKeyWidth = 0) {
    const width = Math.max(minKeyWidth, ...pairs.map(([k]) => k.length));
    return pairs
        .map(([k, v]) => `${String(k).padEnd(width)}  ${v}`)
        .join("\n");
}

/** Wraps text to a column without breaking words. */
export function wrap(text, width = 72) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";

    for (const word of words) {
        if (!line.length) line = word;
        else if (line.length + 1 + word.length <= width) line += ` ${word}`;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line.length) lines.push(line);
    return lines.join("\n");
}

/** 1234567 → "1,234,567" */
export function commas(n) {
    return Number(n).toLocaleString("en-US");
}

/** ISO date → "4 Aug 2026" */
export function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Whole days between an ISO date and now — `neofetch` uptime.
 * @param {string} iso
 */
export function daysSince(iso) {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 0;
    return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

/** 928 → "1y 6mo 12d", for the same uptime line. */
export function humanDuration(days) {
    const years = Math.floor(days / 365);
    const months = Math.floor((days % 365) / 30);
    const rest = days - years * 365 - months * 30;
    return [years && `${years}y`, months && `${months}mo`, `${rest}d`]
        .filter(Boolean)
        .join(" ");
}

/** Random float in [min, max) — jittered RTTs in ping/traceroute. */
export function jitter(min, max) {
    return min + Math.random() * (max - min);
}

/** @param {number} n */
export function ms(n) {
    return `${n.toFixed(n < 10 ? 1 : 0)} ms`;
}
