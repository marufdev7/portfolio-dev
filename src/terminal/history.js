// ---------------------------------------------------------------
// Command history: ring buffer, localStorage persistence, arrow-key
// navigation that preserves an in-progress draft, and Ctrl+R search.
// ---------------------------------------------------------------

const STORAGE_KEY = "terminal:history";
const MAX_ENTRIES = 200;

/** @returns {string[]} */
export function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((e) => typeof e === "string") : [];
    } catch {
        return [];
    }
}

/** @param {string[]} entries */
export function saveHistory(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    } catch {
        /* storage blocked or full — history is still live for this session */
    }
}

/**
 * Appends an entry. Consecutive duplicates are collapsed, like bash's
 * `ignoredups`, so holding Enter doesn't flood the buffer.
 *
 * @param {string[]} entries
 * @param {string} input
 * @returns {string[]}
 */
export function pushHistory(entries, input) {
    const trimmed = input.trim();
    if (!trimmed) return entries;
    if (entries[entries.length - 1] === trimmed) return entries;
    const next = [...entries, trimmed];
    return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
}

export function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* nothing to do */
    }
}

/**
 * Arrow-key navigation.
 *
 * `index` is a position from the END of the list: 0 means "not
 * navigating, showing the draft", 1 is the most recent entry. The
 * draft is held by the caller and restored when the user arrows back
 * down past the newest entry — losing a half-typed command to an
 * accidental ↑ is the kind of thing that makes a fake terminal feel fake.
 *
 * @param {string[]} entries
 * @param {number} index
 * @param {'up'|'down'} direction
 * @param {string} draft
 * @returns {{index: number, value: string}}
 */
export function navigate(entries, index, direction, draft) {
    if (entries.length === 0) return { index: 0, value: draft };

    if (direction === "up") {
        const next = Math.min(index + 1, entries.length);
        return { index: next, value: entries[entries.length - next] };
    }

    const next = Math.max(index - 1, 0);
    return {
        index: next,
        value: next === 0 ? draft : entries[entries.length - next],
    };
}

/**
 * Reverse search — most recent match wins, as Ctrl+R does.
 * @param {string[]} entries
 * @param {string} query
 * @param {number} [skip] how many matches to step past
 * @returns {{value: string, index: number}|null}
 */
export function reverseSearch(entries, query, skip = 0) {
    if (!query) return null;
    const needle = query.toLowerCase();
    let seen = 0;

    for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].toLowerCase().includes(needle)) {
            if (seen === skip) return { value: entries[i], index: i };
            seen++;
        }
    }
    return null;
}

/**
 * Resolves `!42` (entry number) and `!!` (previous command).
 * Numbers are 1-based because that's what `history` prints.
 *
 * @param {string[]} entries
 * @param {string} input
 * @returns {string|null} the expanded command, or null if not a bang expression
 */
export function expandBang(entries, input) {
    const trimmed = input.trim();

    if (trimmed === "!!") return entries[entries.length - 1] ?? null;

    const match = /^!(\d+)$/.exec(trimmed);
    if (!match) return null;

    const n = Number(match[1]);
    return entries[n - 1] ?? null;
}
