import { Link } from "react-router-dom";
import { Maximize2 } from "lucide-react";
import TerminalView from "./TerminalView";

/* ---------------------------------------------------------------
   The /network hub's terminal card: boots on mount, does not steal
   focus (a page that grabs the caret on load is hostile), and is
   preceded by a skip link for keyboard users (§6.8).
   --------------------------------------------------------------- */

export default function TerminalEmbed({ className = "" }) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <a
          href="#after-terminal"
          className="rounded text-sm text-muted underline decoration-line underline-offset-4 hover:text-net"
        >
          Skip the terminal
        </a>
        <Link
          to="/network/terminal"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-net"
        >
          <Maximize2 size={14} aria-hidden="true" />
          Full screen
        </Link>
      </div>

      <TerminalView variant="embedded" autoBoot />

      <p className="mt-3 text-sm text-muted">
        Real math, not canned answers. Try{" "}
        <code className="font-mono text-net">vlsm 192.168.1.0/24 60 28 12 5</code> or{" "}
        <code className="font-mono text-net">show ip route</code>.
      </p>
    </div>
  );
}
