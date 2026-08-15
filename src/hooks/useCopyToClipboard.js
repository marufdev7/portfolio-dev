import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copies text and reports it for a moment, so a button can confirm
 * itself without the caller holding timer state.
 *
 * `copied` returns to false on its own. The timer is cleared on unmount
 * so a copy on the way out never sets state on a gone component.
 *
 * @param {number} [resetAfter]  ms before `copied` flips back
 * @returns {{ copied: boolean, copy: (text: string) => Promise<boolean> }}
 */
export function useCopyToClipboard(resetAfter = 2000) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    const copy = useCallback(
        async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), resetAfter);
                return true;
            } catch {
                // Insecure context or denied permission. Nothing to announce —
                // the address is visible on the button that was just clicked.
                setCopied(false);
                return false;
            }
        },
        [resetAfter]
    );

    return { copied, copy };
}
