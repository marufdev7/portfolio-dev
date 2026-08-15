import Seo from "../components/layout/Seo";
import PageShell from "../components/layout/PageShell";
import Button from "../components/ui/Button";
import { useTerminal } from "../hooks/useTerminal";

/* ---------------------------------------------------------------
   404 as an ICMP unreachable — the one joke on the site that earns
   its place, because it's the same vocabulary the rest of the
   networking half uses (§8).
   --------------------------------------------------------------- */

export default function NotFound() {
  const { openOverlay } = useTerminal();

  return (
    <>
      <Seo title="404 — Destination unreachable" noIndex />

      <PageShell
        eyebrow="icmp type 3"
        title="Destination host unreachable"
        lead="That route doesn't exist in the table. No hard feelings — the network drops packets it can't place, and so does this site."
        tone="net"
        grid
        actions={
          <>
            <Button to="/" tone="net">
              Back to the default route
            </Button>
            <Button tone="net" variant="outline" onClick={openOverlay}>
              Open the terminal
            </Button>
          </>
        }
      >
        <pre className="terminal-scroll mt-12 overflow-x-auto overflow-y-hidden rounded-lg border border-line bg-surface p-5 font-mono text-xs leading-relaxed text-muted">
          {`$ traceroute that-page
 1  gateway            0.412 ms   0.388 ms   0.401 ms
 2  edge-router        1.204 ms   1.190 ms   1.233 ms
 3  * * *
 4  * * *
 5  !H  host unreachable

$ echo $?
404`}
        </pre>
      </PageShell>
    </>
  );
}
