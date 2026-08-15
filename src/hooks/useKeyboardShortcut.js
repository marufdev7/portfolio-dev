import { useEffect } from "react";

/**
 * Binds a global key combo. Ignores repeats and lets the handler decide
 * whether to preventDefault.
 *
 * @param {string} key            lowercase key name, e.g. 'k' or 'escape'
 * @param {(e: KeyboardEvent) => void} handler
 * @param {{ meta?: boolean, ctrl?: boolean, shift?: boolean, enabled?: boolean }} [opts]
 *   `meta: true` matches Ctrl **or** Cmd, so one binding covers both platforms.
 */
export function useKeyboardShortcut(key, handler, opts = {}) {
    const { meta = false, shift = false, enabled = true } = opts;

    useEffect(() => {
        if (!enabled) return;

        const onKeyDown = (e) => {
            if (e.repeat) return;
            if (e.key.toLowerCase() !== key.toLowerCase()) return;
            if (meta && !(e.metaKey || e.ctrlKey)) return;
            if (!meta && (e.metaKey || e.ctrlKey)) return;
            if (shift && !e.shiftKey) return;
            handler(e);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [key, handler, meta, shift, enabled]);
}
