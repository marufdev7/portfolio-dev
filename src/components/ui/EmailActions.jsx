import { Check, Copy } from "lucide-react";
import { profile } from "../../data/profile";
import { useCopyToClipboard } from "../../hooks/useCopyToClipboard";

/* ---------------------------------------------------------------
   The address, twice over.

   `mailto:` is the primary action and stays a real anchor — it keeps
   middle-click, "copy link address", and the keyboard path intact, and
   it is what a visitor with a configured mail client wants.

   But a browser cannot report whether the protocol handler resolved.
   A machine with no mailto: association swallows the click and returns
   nothing to catch, so there is no failure to detect and no moment at
   which a fallback could be triggered. The copy button is therefore a
   sibling rather than a rescue: always present, never conditional.
   --------------------------------------------------------------- */

/**
 * @param {Object} props
 * @param {string} [props.className]  applied to the wrapper
 * @param {React.ReactNode} props.children  the mailto control itself
 */
export default function EmailActions({ className = "", children }) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {children}

      <button
        type="button"
        onClick={() => copy(profile.email)}
        aria-label={copied ? "Address copied" : `Copy ${profile.email}`}
        className={
          "inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 " +
          "font-mono text-xs text-muted transition-colors duration-200 " +
          "hover:border-accent/40 hover:text-accent focus-visible:border-accent " +
          "focus-visible:outline-none"
        }
      >
        {copied ? (
          <Check size={14} aria-hidden="true" className="text-net" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
