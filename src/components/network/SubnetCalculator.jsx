import { useMemo, useState } from "react";
import { subnet } from "../../lib/ip";
import Button from "../ui/Button";
import Table from "../ui/Table";

/* ---------------------------------------------------------------
   The non-terminal path to the same math (§6.8). Everything the
   `subnet` command prints is reachable here with a keyboard, a
   screen reader, and no emulated shell — the terminal is the fun
   route, never the only route.

   It calls the exact same lib/ip.js function the command does, so
   the two can't drift.
   --------------------------------------------------------------- */

const PRESETS = ["192.168.1.10/26", "10.0.0.0/8", "172.16.5.1 255.255.255.240", "203.0.113.9/31"];

export default function SubnetCalculator() {
  const [input, setInput] = useState("192.168.1.10/26");
  const [query, setQuery] = useState("192.168.1.10/26");

  const result = useMemo(() => {
    try {
      return { data: subnet(query), error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }, [query]);

  const onSubmit = (event) => {
    event.preventDefault();
    setQuery(input.trim());
  };

  const { data, error } = result;

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="grow">
          <label htmlFor="subnet-input" className="mb-1.5 block text-sm text-muted">
            Address with prefix or mask
          </label>
          <input
            id="subnet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck="false"
            autoComplete="off"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "subnet-error" : "subnet-hint"}
            className="w-full rounded-md border border-line bg-surface px-3 py-2.5 font-mono text-sm text-text placeholder:text-faint focus:border-net focus:outline-none"
            placeholder="192.168.1.10/26"
          />
        </div>
        <Button type="submit" tone="net">
          Calculate
        </Button>
      </form>

      <p id="subnet-hint" className="mt-2 text-sm text-faint">
        Accepts <code className="font-mono">10.0.0.1/24</code> or{" "}
        <code className="font-mono">10.0.0.1 255.255.255.0</code>.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setInput(preset);
              setQuery(preset);
            }}
            className="rounded border border-line bg-surface-raise px-2 py-0.5 font-mono text-xs text-muted hover:border-net/40 hover:text-net"
          >
            {preset}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="mt-6">
        {error && (
          <p id="subnet-error" className="font-mono text-sm text-warn">
            {error}
          </p>
        )}

        {data && (
          <>
            <Table
              tone="net"
              mono
              caption={`Results for ${data.cidr}`}
              head={["Field", "Value"]}
              rows={[
                ["Network", data.network],
                ["Prefix", `/${data.prefix}`],
                ["Subnet mask", data.mask],
                ["Wildcard", data.wildcard],
                ["Broadcast", data.broadcast],
                ["Usable range", `${data.firstHost} – ${data.lastHost}`],
                ["Usable hosts", data.usableHosts.toLocaleString()],
                ["Total addresses", data.totalAddresses.toLocaleString()],
                ["Class", data.class],
                ["Scope", `${data.scope.scope} (${data.scope.rfc})`],
              ]}
            />
            {data.note && <p className="mt-4 text-sm text-muted">{data.note}</p>}
          </>
        )}
      </div>
    </div>
  );
}
