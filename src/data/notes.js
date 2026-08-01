// ---------------------------------------------------------------
// CCNA notes. Renders /network/notes and is the source for
// `cat ~/network/cheatsheet.md` — one source of truth (§6.4).
// ---------------------------------------------------------------

/** @typedef {Object} NoteSection
 *  @property {string} id
 *  @property {string} title
 *  @property {string} intro
 *  @property {{heading?: string, body?: string, table?: {head: string[], rows: string[][]}, mono?: string}[]} blocks
 */

/** @type {NoteSection[]} */
export const noteSections = [
  {
    id: "subnetting",
    title: "Subnetting shortcuts",
    intro:
      "The two tables below are the only things I memorised. Everything else is derived from them at speed.",
    blocks: [
      {
        heading: "Powers of two, right to left",
        table: {
          head: ["Bit position", "8", "7", "6", "5", "4", "3", "2", "1"],
          rows: [
            ["Value", "128", "64", "32", "16", "8", "4", "2", "1"],
            ["Cumulative mask octet", "128", "192", "224", "240", "248", "252", "254", "255"],
          ],
        },
      },
      {
        heading: "CIDR to mask, block size, and usable hosts",
        table: {
          head: ["CIDR", "Mask", "Block size", "Usable hosts"],
          rows: [
            ["/24", "255.255.255.0", "256", "254"],
            ["/25", "255.255.255.128", "128", "126"],
            ["/26", "255.255.255.192", "64", "62"],
            ["/27", "255.255.255.224", "32", "30"],
            ["/28", "255.255.255.240", "16", "14"],
            ["/29", "255.255.255.248", "8", "6"],
            ["/30", "255.255.255.252", "4", "2"],
            ["/31", "255.255.255.254", "2", "2 (RFC 3021 p2p)"],
            ["/32", "255.255.255.255", "1", "1 (host route)"],
          ],
        },
      },
      {
        heading: "The method",
        body:
          "Find the interesting octet — the one the prefix lands in. Block size is 256 minus that octet's mask value. Count up in block-size steps until you pass the address; the step below it is the network address. Broadcast is the next network minus one. That's it — no long division, no binary unless someone asks you to show it.",
      },
      {
        heading: "Worked example — 172.16.135.200/20",
        mono: `/20 -> mask 255.255.240.0, interesting octet = 3rd
block size = 256 - 240 = 16
3rd-octet boundaries: 128, 144  ->  135 falls in 128
network    172.16.128.0
broadcast  172.16.143.255      (next boundary 144, minus one)
usable     172.16.128.1 - 172.16.143.254
hosts      2^12 - 2 = 4094`,
      },
      {
        body:
          "Run `subnet 172.16.135.200/20 --binary` in the terminal to see the same answer computed bitwise.",
      },
    ],
  },
  {
    id: "vlsm",
    title: "VLSM allocation",
    intro:
      "VLSM is subnetting with the discipline to stop wasting addresses. Order matters more than arithmetic.",
    blocks: [
      {
        heading: "The rule",
        body:
          "Always allocate largest requirement first. If you allocate a small subnet at the front of the range, the next large one cannot fit contiguously and you fragment the space. Sort descending, then walk forward.",
      },
      {
        heading: "Sizing a block",
        body:
          "For h hosts you need the smallest n where 2^n - 2 >= h. Subtract two for the network and broadcast addresses — a /30 gives you two usable addresses, which is exactly why point-to-point links use it.",
      },
      {
        heading: "Example — 192.168.1.0/24 for 60, 28, 12, and 5 hosts",
        mono: `60 hosts -> /26  192.168.1.0/26    .1 - .62      (2 wasted)
28 hosts -> /27  192.168.1.64/27   .65 - .94     (2 wasted)
12 hosts -> /28  192.168.1.96/28   .97 - .110    (2 wasted)
 5 hosts -> /29  192.168.1.112/29  .113 - .118   (1 wasted)
remaining: 192.168.1.120 - 192.168.1.255`,
      },
      { body: "`vlsm 192.168.1.0/24 60 28 12 5` prints this table with the waste column." },
    ],
  },
  {
    id: "vlans",
    title: "VLANs and trunking",
    intro: "Where lab 01 went wrong, written down so it doesn't happen twice.",
    blocks: [
      {
        heading: "Access vs trunk",
        table: {
          head: ["", "Access port", "Trunk port"],
          rows: [
            ["Carries", "One VLAN", "Many VLANs"],
            ["Tagging", "Untagged to the host", "802.1Q tagged, except the native VLAN"],
            ["Connects to", "Hosts, printers, APs", "Switches, routers, hypervisors"],
            ["Key command", "switchport access vlan 10", "switchport mode trunk"],
          ],
        },
      },
      {
        heading: "Must match on both ends of a trunk",
        body:
          "Native VLAN, allowed VLAN list, and encapsulation. `show interfaces trunk` reports each end's own view and will happily say `trunking` on both while they disagree — compare with `show cdp neighbors detail`, or just read the syslog, which announces the mismatch.",
      },
      {
        heading: "Router-on-a-stick",
        mono: `interface GigabitEthernet0/0
 no ip address
 no shutdown
!
interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0`,
      },
      {
        body:
          "The physical interface gets no IP and must be no-shutdown; the subinterfaces carry the addresses. Forgetting to bring the physical interface up leaves every subinterface down with no obvious reason.",
      },
    ],
  },
  {
    id: "acls",
    title: "ACL syntax and placement",
    intro: "Two rules cover most of the exam and all of the mistakes I've made.",
    blocks: [
      {
        table: {
          head: ["", "Standard", "Extended"],
          rows: [
            ["Matches", "Source IP only", "Source, destination, protocol, port"],
            ["Numbered range", "1–99, 1300–1999", "100–199, 2000–2699"],
            ["Place it", "Close to the destination", "Close to the source"],
          ],
        },
      },
      {
        heading: "Why the placement rule exists",
        body:
          "A standard ACL only knows where a packet came from. Put it near the source and it blocks that source from reaching everything, not just the one thing you meant — which is precisely what broke lab 04.",
      },
      {
        heading: "Wildcard masks",
        mono: `wildcard = 255.255.255.255 - subnet mask

255.255.255.0   -> 0.0.0.255      (a /24)
255.255.255.240 -> 0.0.0.15       (a /28)
0.0.0.0         -> exactly one host  (host x.x.x.x)
255.255.255.255 -> any address       (any)`,
      },
      {
        heading: "The invisible last line",
        body:
          "Every ACL ends in an implicit `deny any`. If traffic you never wrote a rule about stops working, that's what stopped it. Add an explicit `permit ip any any` when the ACL is meant to be selective rather than restrictive, and `log` your denies while testing.",
      },
    ],
  },
  {
    id: "nat",
    title: "NAT types",
    intro: "",
    blocks: [
      {
        table: {
          head: ["Type", "Mapping", "Use"],
          rows: [
            ["Static NAT", "One private ↔ one public", "A server that must be reachable inbound"],
            ["Dynamic NAT", "Private → pool of public", "Rare; the pool runs out"],
            ["PAT (overload)", "Many private → one public + port", "Essentially every home and small office"],
          ],
        },
      },
      {
        heading: "Terminology, which the exam tests harder than the config",
        table: {
          head: ["Term", "Means"],
          rows: [
            ["Inside local", "Private address of the internal host"],
            ["Inside global", "What the internal host looks like from outside"],
            ["Outside global", "Real public address of the external host"],
            ["Outside local", "How the external host appears internally (usually identical)"],
          ],
        },
      },
      {
        body:
          "NAT is a boundary, not a filter — every participating interface needs `ip nat inside` or `ip nat outside`. With one side unmarked, no translation happens at all and `show ip nat statistics` shows zero hits (lab 05).",
      },
    ],
  },
  {
    id: "ospf",
    title: "OSPF basics",
    intro: "",
    blocks: [
      {
        heading: "Adjacency states, and what a stuck one means",
        table: {
          head: ["Stuck in", "Almost always"],
          rows: [
            ["DOWN / INIT", "Hellos are one-way — ACL, wrong subnet, or passive-interface"],
            ["2WAY on a p2p link", "DR/BDR election issue or a priority misconfiguration"],
            ["EXSTART / EXCHANGE", "MTU mismatch, or duplicate router-ID"],
            ["LOADING", "Corrupt or missing LSA — rare"],
            ["FULL", "Working. This is the goal."],
          ],
        },
      },
      {
        heading: "Must match to form an adjacency",
        body:
          "Area ID, hello and dead timers, authentication, MTU, and the subnet itself. Router-IDs must be unique — matching them is a failure, not a requirement.",
      },
      {
        heading: "Cost",
        mono: `cost = reference bandwidth / interface bandwidth
default reference = 100 Mbps

FastEthernet  100/100  = 1
GigabitEthernet 100/1000 = 1   <- both are 1, which is the problem
fix: router ospf 1 / auto-cost reference-bandwidth 1000`,
      },
      {
        body:
          "Because the default reference bandwidth makes Fast and Gigabit interfaces cost the same, OSPF will happily prefer a 100Mbps path. Set `auto-cost reference-bandwidth` identically on every router in the area or the metrics disagree.",
      },
    ],
  },
];

/** Flattened plain-text rendering for `cat ~/network/cheatsheet.md`. */
export function notesAsText() {
  const lines = [];
  for (const section of noteSections) {
    lines.push(`## ${section.title}`, "");
    if (section.intro) lines.push(section.intro, "");
    for (const block of section.blocks) {
      if (block.heading) lines.push(`### ${block.heading}`, "");
      if (block.body) lines.push(block.body, "");
      if (block.mono) lines.push(block.mono, "");
      if (block.table) {
        const widths = block.table.head.map((h, i) =>
          Math.max(h.length, ...block.table.rows.map((r) => (r[i] ?? "").length))
        );
        const fmt = (cells) =>
          cells.map((c, i) => String(c ?? "").padEnd(widths[i])).join("  ");
        lines.push(fmt(block.table.head));
        lines.push(widths.map((w) => "-".repeat(w)).join("  "));
        block.table.rows.forEach((r) => lines.push(fmt(r)));
        lines.push("");
      }
    }
  }
  return lines.join("\n").trim();
}
