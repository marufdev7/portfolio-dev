import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Seo from "../components/layout/Seo";
import TerminalView from "../components/terminal/TerminalView";

/* ---------------------------------------------------------------
   Full-screen terminal. No PageShell header — the shell is the page,
   and a 5rem hero above it would be the only thing standing between
   the visitor and the thing they came here to type into (§6.1).

   autoFocus is correct HERE and only here: the route exists for no
   other purpose, so taking the caret is what the visitor asked for.
   --------------------------------------------------------------- */

export default function NetworkTerminal() {
  return (
    <>
      <Seo
        title="Terminal"
        description="A real shell in the browser: subnetting, VLSM, OSI lookups, IOS-style show commands, and a CCNA quiz."
        path="/network/terminal"
      />

      <div className="net-surface mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/network"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-net"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to network
          </Link>

          <p className="font-mono text-xs text-faint">
            <kbd className="rounded border border-line px-1.5 py-0.5">Tab</kbd>{" "}
            completes ·{" "}
            <kbd className="rounded border border-line px-1.5 py-0.5">↑</kbd>{" "}
            history ·{" "}
            <kbd className="rounded border border-line px-1.5 py-0.5">Ctrl</kbd>
            +<kbd className="rounded border border-line px-1.5 py-0.5">R</kbd>{" "}
            search
          </p>
        </div>

        <h1 className="sr-only">Terminal</h1>

        <TerminalView variant="full" autoBoot autoFocus />

        <p className="mt-4 text-sm text-muted">
          Nothing here is terminal-only. The{" "}
          <Link to="/network/labs" className="text-net hover:underline">
            lab log
          </Link>
          ,{" "}
          <Link to="/network/notes" className="text-net hover:underline">
            notes
          </Link>
          , and{" "}
          <Link to="/network" className="text-net hover:underline">
            subnet calculator
          </Link>{" "}
          cover the same ground as ordinary pages.
        </p>
      </div>
    </>
  );
}
