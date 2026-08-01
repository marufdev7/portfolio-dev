// ---------------------------------------------------------------
// Networking commands (§6.5, §6.6).
//
// Every number these print comes from src/lib/ip.js — the same code the
// <SubnetCalculator /> page uses and the same code tests/ip.test.js
// covers. Nothing here computes addresses inline.
// ---------------------------------------------------------------

import * as out from "../output";
import {
  subnet,
  vlsm,
  summarize,
  prefixToWildcard,
  prefixToMask,
  maskToPrefix,
  parsePrefix,
  describeNumber,
  binarySplit,
  contains,
  prefixForHosts,
  intToIp,
  ipToInt,
  isValidIp,
  IpError,
} from "../../lib/ip";
import { commas, keyValue, jitter, ms } from "../../lib/format";
import { lookupPort, ports } from "../../data/ports";
import { osiLayers, osiMnemonic, tcpIpModel, getLayer } from "../../data/osi";
import { lookupOui } from "../../data/ouiVendors";
import { knownHosts, arpTable, devices, getDevice, defaultDevice } from "../../data/labTopology";

/* ------------------------------------------------------------------
   subnet / ipcalc
   ------------------------------------------------------------------ */

/** The full breakdown table both `subnet` and the calculator page show. */
function subnetBlocks(info, { binary = false } = {}) {
  const pairs = [
    ["Address", info.address],
    ["Network", info.cidr],
    ["Mask", `${info.mask}  (/${info.prefix})`],
    ["Wildcard", info.wildcard],
    ["Broadcast", info.broadcast],
    ["Host range", info.firstHost ? `${info.firstHost} – ${info.lastHost}` : "—"],
    ["Usable hosts", commas(info.usableHosts)],
    ["Total addresses", commas(info.totalAddresses)],
    ["Class", info.class],
    ["Scope", `${info.scope.scope}  (${info.scope.rfc})`],
  ];

  const blocks = [out.ascii(keyValue(pairs, 15), { accent: "net" })];

  if (binary) {
    const split = binarySplit(info.address, info.prefix);
    blocks.push(
      out.blank(),
      out.heading("Binary"),
      out.ascii(
        keyValue(
          [
            ["address", split.full],
            ["mask", binarySplit(info.mask, 32).full],
            ["network bits", `${split.network.length} · ${split.network || "(none)"}`],
            ["host bits", `${split.host.length} · ${split.host || "(none)"}`],
          ],
          14
        ),
        { accent: "net" }
      )
    );
  }

  blocks.push(out.blank(), out.muted(info.scope.detail));
  if (info.note) blocks.push(out.warn(info.note));

  return blocks;
}

const subnetCommand = {
  name: "subnet",
  aliases: ["ipcalc", "sn"],
  category: "network",
  usage: "subnet <ip/cidr | ip mask> [--binary] [--hosts <n>] [--subnets <n>]",
  description: "Full subnet breakdown — mask, range, hosts, scope.",
  examples: [
    "subnet 192.168.1.10/26",
    "subnet 10.0.0.1 255.255.255.0",
    "subnet 172.16.0.0/16 --hosts 500",
    "subnet 192.168.1.0/24 --subnets 4 --binary",
  ],
  notes:
    "/31 and /32 are handled as the special cases they are (RFC 3021 and host routes) rather than reported as negative host counts.",
  flags: { binary: "boolean", hosts: "number", subnets: "number" },
  aliasFlags: { b: "binary" },

  run(ctx, { args, flags }) {
    if (args.length === 0) {
      return [
        out.error("usage: subnet <ip/cidr>"),
        out.muted("e.g. subnet 192.168.1.10/26"),
      ];
    }

    const input = args.length >= 2 && isValidIp(args[1]) ? `${args[0]} ${args[1]}` : args[0];
    const info = subnet(input);

    /* --hosts: what prefix would I need, and how does it divide up? */
    if (flags.hosts !== undefined) {
      const needed = prefixForHosts(flags.hosts);
      if (needed < info.prefix) {
        return [
          ...subnetBlocks(info, { binary: flags.binary }),
          out.blank(),
          out.error(
            `${commas(flags.hosts)} hosts needs a /${needed} — ${info.cidr} is too small (${commas(info.usableHosts)} usable).`
          ),
        ];
      }

      const count = 2 ** (needed - info.prefix);
      const size = 2 ** (32 - needed);
      const base = ipToInt(info.network);
      const preview = Array.from({ length: Math.min(count, 8) }, (_, i) => {
        const block = subnet(`${intToIp(base + i * size)}/${needed}`);
        return [String(i + 1), block.cidr, block.firstHost ?? "—", block.lastHost ?? "—", block.broadcast];
      });

      return [
        ...subnetBlocks(info, { binary: flags.binary }),
        out.blank(),
        out.heading(`${commas(flags.hosts)} hosts per subnet → /${needed}`),
        out.muted(
          `${commas(count)} subnet${count === 1 ? "" : "s"} of ${commas(2 ** (32 - needed) - 2)} usable hosts each`
        ),
        out.table(["#", "network", "first", "last", "broadcast"], preview, { accent: "net" }),
        ...(count > 8 ? [out.muted(`… ${commas(count - 8)} more`)] : []),
      ];
    }

    /* --subnets: split this network N ways */
    if (flags.subnets !== undefined) {
      const n = Number(flags.subnets);
      if (!Number.isInteger(n) || n < 1) return out.error("--subnets needs a positive integer");

      const bits = Math.ceil(Math.log2(n));
      const newPrefix = info.prefix + bits;
      if (newPrefix > 32) {
        return out.error(`cannot split ${info.cidr} into ${n} subnets — that needs a /${newPrefix}`);
      }

      const size = 2 ** (32 - newPrefix);
      const base = ipToInt(info.network);
      const rows = Array.from({ length: 2 ** bits }, (_, i) => {
        const block = subnet(`${intToIp(base + i * size)}/${newPrefix}`);
        return [
          String(i + 1),
          block.cidr,
          block.mask,
          block.firstHost ?? "—",
          block.lastHost ?? "—",
          commas(block.usableHosts),
        ];
      });

      return [
        out.heading(`${info.cidr} split ${n} way${n === 1 ? "" : "s"} → /${newPrefix}`),
        out.muted(
          `${bits} borrowed bit${bits === 1 ? "" : "s"} gives ${2 ** bits} subnets` +
            (2 ** bits !== n ? ` (${n} requested — subnets come in powers of two)` : "")
        ),
        out.blank(),
        out.table(["#", "network", "mask", "first", "last", "hosts"], rows, { accent: "net" }),
      ];
    }

    return subnetBlocks(info, { binary: flags.binary });
  },
};

/* ------------------------------------------------------------------
   vlsm
   ------------------------------------------------------------------ */

const vlsmCommand = {
  name: "vlsm",
  category: "network",
  usage: "vlsm <parent/cidr> <hosts> <hosts> …",
  description: "Allocate variable-length subnets largest-first, with waste.",
  examples: ["vlsm 192.168.1.0/24 60 28 12 5", "vlsm 10.0.0.0/22 500 200 100 50 2"],
  notes:
    "Largest-first isn't a preference — allocating a small block at the front fragments the range so the next large block can't fit contiguously.",

  run(ctx, { args }) {
    if (args.length < 2) {
      return [
        out.error("usage: vlsm <parent/cidr> <hosts> <hosts> …"),
        out.muted("e.g. vlsm 192.168.1.0/24 60 28 12 5"),
      ];
    }

    const [parentCidr, ...counts] = args;
    const numbers = counts.map((c) => {
      const n = Number(c);
      if (!Number.isInteger(n) || n < 1) throw new IpError(`invalid host count: ${c}`);
      return n;
    });

    const result = vlsm(parentCidr, numbers);
    const totalWaste = result.blocks.reduce((sum, b) => sum + b.wasted, 0);

    return [
      out.heading(`VLSM inside ${result.parent.cidr}`),
      out.muted(
        `${commas(result.parent.totalAddresses)} addresses · ${numbers.length} subnet${numbers.length === 1 ? "" : "s"} requested`
      ),
      out.blank(),
      out.table(
        ["#", "need", "prefix", "network", "mask", "first", "last", "broadcast", "usable", "waste"],
        result.blocks.map((b, i) => [
          String(i + 1),
          commas(b.requested),
          `/${b.prefix}`,
          b.network,
          b.mask,
          b.firstHost ?? "—",
          b.lastHost ?? "—",
          b.broadcast,
          commas(b.usableHosts),
          commas(b.wasted),
        ]),
        { accent: "net" }
      ),
      out.blank(),
      out.ascii(
        keyValue(
          [
            ["Allocated", `${commas(result.parent.totalAddresses - result.remaining.addresses)} addresses`],
            [
              "Remaining",
              result.remaining.from
                ? `${commas(result.remaining.addresses)}  (${result.remaining.from} – ${result.remaining.to})`
                : "none — the parent is fully consumed",
            ],
            ["Wasted on hosts", `${commas(totalWaste)} usable addresses`],
          ],
          17
        ),
        { accent: "net" }
      ),
      out.blank(),
      out.muted("Allocated largest-first; listed in allocation order."),
    ];
  },
};

/* ------------------------------------------------------------------
   summarize / supernet
   ------------------------------------------------------------------ */

const summarizeCommand = {
  name: "summarize",
  aliases: ["supernet", "aggregate"],
  category: "network",
  usage: "summarize <cidr> <cidr> …",
  description: "Find the summary route that covers several networks.",
  examples: [
    "summarize 192.168.0.0/24 192.168.1.0/24 192.168.2.0/24 192.168.3.0/24",
    "summarize 10.1.0.0/16 10.2.0.0/16",
  ],

  run(ctx, { args }) {
    if (args.length < 2) {
      return [
        out.error("usage: summarize <cidr> <cidr> …"),
        out.muted("give it at least two networks."),
      ];
    }

    const result = summarize(args);

    return [
      out.heading(`Summary: ${result.summary}`),
      out.blank(),
      out.ascii(
        keyValue(
          [
            ["Summary route", result.summary],
            ["Mask", result.mask],
            ["Wildcard", result.wildcard],
            ["Covers", `${commas(result.covered)} addresses`],
            ["Requested", `${commas(result.requested)} addresses`],
          ],
          15
        ),
        { accent: "net" }
      ),
      out.blank(),
      out.heading("Inputs"),
      out.table(
        ["network", "mask", "range"],
        result.inputs.map((i) => [i.cidr, i.mask, i.range]),
        { accent: "net" }
      ),
      out.blank(),
      result.exact
        ? out.success("Exact — the summary covers these networks and nothing else.")
        : out.warn(
            `Inexact — the summary pulls in ${commas(result.covered - result.requested)} extra addresses. ` +
              "Safe to advertise only if nothing else lives in that space."
          ),
      out.blank(),
      out.muted(`OSPF/EIGRP form:  ${result.summary.split("/")[0]} ${result.mask}`),
      out.muted(`ACL form:         ${result.summary.split("/")[0]} ${result.wildcard}`),
    ];
  },
};

/* ------------------------------------------------------------------
   wildcard / mask / binary / contains
   ------------------------------------------------------------------ */

const wildcard = {
  name: "wildcard",
  aliases: ["wc"],
  category: "network",
  usage: "wildcard <cidr|prefix|mask>",
  description: "Convert to the wildcard mask an ACL wants.",
  examples: ["wildcard 192.168.1.0/26", "wildcard /26", "wildcard 255.255.255.192"],

  run(ctx, { args }) {
    if (!args[0]) return out.error("usage: wildcard <cidr|prefix|mask>");

    const input = args[0];
    let prefix;
    let network = null;

    // A bare prefix — "/26" or "26" — has to be checked before the CIDR
    // branch, or the leading slash sends an empty address to subnet().
    if (/^\/?\d{1,2}$/.test(input)) {
      prefix = parsePrefix(input.replace(/^\//, ""));
    } else if (input.includes("/")) {
      const info = subnet(input);
      prefix = info.prefix;
      network = info.network;
    } else if (isValidIp(input)) {
      prefix = maskToPrefix(input);
    } else {
      return out.error(`can't read '${input}' as a prefix, mask, or CIDR`);
    }

    return [
      out.ascii(
        keyValue(
          [
            ["Prefix", `/${prefix}`],
            ["Subnet mask", prefixToMask(prefix)],
            ["Wildcard mask", prefixToWildcard(prefix)],
            ...(network ? [["ACL line", `${network} ${prefixToWildcard(prefix)}`]] : []),
          ],
          14
        ),
        { accent: "net" }
      ),
      out.blank(),
      out.muted(
        prefix === 32
          ? "A /32 wildcard is 0.0.0.0 — IOS writes that as `host x.x.x.x`."
          : "The wildcard is the mask inverted: 0 means 'must match', 1 means 'don't care'."
      ),
    ];
  },
};

const mask = {
  name: "mask",
  category: "network",
  usage: "mask <prefix|mask>",
  description: "Convert between /prefix and dotted-decimal mask.",
  examples: ["mask 27", "mask /27", "mask 255.255.255.224"],

  run(ctx, { args }) {
    if (!args[0]) return out.error("usage: mask <prefix|mask>");

    const input = args[0];
    const prefix = input.includes(".") ? maskToPrefix(input) : parsePrefix(input);
    const block = 2 ** (32 - prefix);

    return [
      out.ascii(
        keyValue(
          [
            ["Prefix", `/${prefix}`],
            ["Mask", prefixToMask(prefix)],
            ["Wildcard", prefixToWildcard(prefix)],
            ["Block size", `${commas(block)} addresses`],
            ["Usable hosts", prefix >= 31 ? (prefix === 31 ? "2 (RFC 3021)" : "1 (host route)") : commas(block - 2)],
            ["Subnets in a /24", prefix >= 24 ? commas(2 ** (prefix - 24)) : "—"],
          ],
          17
        ),
        { accent: "net" }
      ),
    ];
  },
};

const binary = {
  name: "binary",
  aliases: ["bin", "hex"],
  category: "network",
  usage: "binary <ip|integer|0x…|0b…>",
  description: "Show an address as binary, hex, and a 32-bit integer.",
  examples: ["binary 192.168.1.1", "binary 3232235777", "binary 0xC0A80101"],

  run(ctx, { args }) {
    if (!args[0]) return out.error("usage: binary <ip|integer|hex>");

    const d = describeNumber(args[0]);
    return [
      out.ascii(
        keyValue(
          [
            ["Dotted", d.dotted],
            ["Binary", d.binary],
            ["Hex", d.hex],
            ["Integer", commas(d.int)],
          ],
          9
        ),
        { accent: "net" }
      ),
      out.blank(),
      out.muted("Each octet is 8 bits: 128 64 32 16 8 4 2 1."),
    ];
  },
};

const containsCommand = {
  name: "contains",
  aliases: ["in"],
  category: "network",
  usage: "contains <cidr> <ip>",
  description: "Is this address inside that network?",
  examples: ["contains 192.168.1.0/26 192.168.1.70", "contains 10.0.0.0/8 10.55.1.1"],

  run(ctx, { args }) {
    if (args.length < 2) return out.error("usage: contains <cidr> <ip>");

    const [cidr, ip] = args;
    const inside = contains(cidr, ip);
    const info = subnet(cidr);

    return [
      inside
        ? out.success(`yes — ${ip} is inside ${info.cidr}`)
        : out.error(`no — ${ip} is outside ${info.cidr}`),
      out.blank(),
      out.ascii(keyValue([["Network", info.cidr], ["Range", info.range], ["Tested", ip]], 9)),
    ];
  },
};

/* ------------------------------------------------------------------
   port / osi / mac
   ------------------------------------------------------------------ */

const port = {
  name: "port",
  aliases: ["ports", "service"],
  category: "network",
  usage: "port <number|service>",
  description: "Look up a well-known port, either direction.",
  examples: ["port 443", "port ssh", "port dhcp"],
  complete: () => ports.map((p) => p.service.toLowerCase()),

  run(ctx, { args }) {
    if (!args[0]) {
      return [
        out.error("usage: port <number|service>"),
        out.muted(`${ports.length} ports known — try \`port 53\` or \`port dns\`.`),
      ];
    }

    const matches = lookupPort(args[0]);
    if (matches.length === 0) {
      return [
        out.error(`nothing known for '${args[0]}'`),
        out.muted("I only carry the ports the CCNA actually asks about."),
      ];
    }

    return out.table(
      ["port", "proto", "service", "what it does"],
      matches.map((p) => [p.port, p.proto, p.service, p.description]),
      { accent: "net" }
    );
  },
};

const osi = {
  name: "osi",
  category: "network",
  usage: "osi [layer|name] [--tcpip]",
  description: "The OSI model, with what actually breaks at each layer.",
  examples: ["osi", "osi 3", "osi transport", "osi --tcpip"],
  flags: { tcpip: "boolean" },
  complete: () => ["1", "2", "3", "4", "5", "6", "7", ...osiLayers.map((l) => l.name.toLowerCase())],

  run(ctx, { args, flags }) {
    if (flags.tcpip) {
      return [
        out.heading("TCP/IP model ↔ OSI"),
        out.table(
          ["TCP/IP layer", "OSI layers"],
          tcpIpModel.map((t) => [t.name, t.osi]),
          { accent: "net" }
        ),
      ];
    }

    if (args[0]) {
      const layer = getLayer(args[0]);
      if (!layer) return out.error(`no layer '${args[0]}' — layers are 1–7`);

      return [
        out.heading(`Layer ${layer.n} — ${layer.name}`),
        out.muted(layer.summary),
        out.blank(),
        out.ascii(
          keyValue(
            [
              ["PDU", layer.pdu],
              ["Protocols", layer.protocols.join(", ")],
              ["Devices", layer.devices.join(", ")],
            ],
            11
          ),
          { accent: "net" }
        ),
        ...(layer.troubleshoot
          ? [out.blank(), out.heading("Troubleshooting"), out.text(layer.troubleshoot)]
          : []),
      ];
    }

    return [
      out.heading("OSI model"),
      out.table(
        ["#", "layer", "PDU", "lives here"],
        osiLayers.map((l) => [l.n, l.name, l.pdu, l.protocols.slice(0, 4).join(", ")]),
        { accent: "net" }
      ),
      out.blank(),
      out.muted(`Top-down:  ${osiMnemonic.topDown}`),
      out.muted(`Bottom-up: ${osiMnemonic.bottomUp}`),
      out.blank(),
      out.muted("`osi 2` for one layer in detail."),
    ];
  },
};

const mac = {
  name: "mac",
  aliases: ["oui"],
  category: "network",
  usage: "mac <address>",
  description: "Decode a MAC address — vendor, cast, and local bit.",
  examples: ["mac 0060.5C7B.1A01", "mac 00:1A:2B:3C:4D:5E"],

  run(ctx, { args }) {
    if (!args[0]) return out.error("usage: mac <address>");

    const hex = args[0].replace(/[^0-9a-fA-F]/g, "").toUpperCase();
    if (hex.length !== 12) {
      return out.error(`'${args[0]}' isn't 48 bits — a MAC is 12 hex digits`);
    }

    const bytes = hex.match(/.{2}/g);
    const first = parseInt(bytes[0], 16);
    const vendor = lookupOui(hex);

    return [
      out.ascii(
        keyValue(
          [
            ["Cisco form", `${hex.slice(0, 4)}.${hex.slice(4, 8)}.${hex.slice(8)}`.toLowerCase()],
            ["Colon form", bytes.join(":").toLowerCase()],
            ["OUI", bytes.slice(0, 3).join(":")],
            ["Vendor", vendor ?? "not in my (small) OUI table"],
            ["Cast", first & 1 ? "multicast" : "unicast"],
            ["Administration", first & 2 ? "locally assigned" : "globally unique (OUI-assigned)"],
          ],
          15
        ),
        { accent: "net" }
      ),
      out.blank(),
      out.muted(
        "First octet, low two bits: bit 0 is unicast/multicast, bit 1 is global/local. " +
          "ff:ff:ff:ff:ff:ff is broadcast — multicast with every bit set."
      ),
    ];
  },
};

/* ------------------------------------------------------------------
   ping / traceroute — simulated against the lab topology (§6.6)
   ------------------------------------------------------------------ */

/** Resolves a lab hostname or IP to a known host, if we have one. */
function resolveHost(target) {
  const needle = String(target).toLowerCase();
  const byName = knownHosts.find((h) => h.name.toLowerCase() === needle);
  if (byName) return byName;
  const byIp = knownHosts.find((h) => h.ip === target);
  if (byIp) return byIp;
  return null;
}

/** TTL a real reply would carry: routers start at 255, hosts at 64. */
const ttlFor = (host) => (host.name.startsWith("R") || host.name === "isp-gw" ? 255 : 64) - (host.hops - 1);

const ping = {
  name: "ping",
  category: "network",
  usage: "ping <host|ip> [-c <count>]",
  description: "Ping something in the lab topology.",
  examples: ["ping R2", "ping 192.168.20.10", "ping 8.8.8.8 -c 2"],
  notes:
    "Simulated against the fixed lab topology — no packets leave your browser. Unknown addresses time out, which is the honest answer.",
  flags: { c: "number", count: "number" },
  aliasFlags: { c: "count" },
  complete: () => knownHosts.map((h) => h.name),

  async run(ctx, { args, flags }) {
    const target = args[0];
    if (!target) return out.error("usage: ping <host|ip>");

    const count = Math.min(Math.max(Number(flags.count ?? flags.c ?? 4), 1), 10);
    const host = resolveHost(target);

    // A public address is reachable because R2 does NAT; a private one
    // we've never heard of is not, and pretending otherwise would be
    // the exact kind of fake that makes a simulation worthless.
    const external = !host && isValidIp(target) && subnet(`${target}/32`).scope.scope === "Public";
    const resolvable = host || external;

    if (!resolvable && !isValidIp(target)) {
      return out.error(`ping: ${target}: Name or service not known`);
    }

    const ip = host?.ip ?? target;
    const label = host ? `${host.name} (${host.ip})` : ip;
    ctx.print(out.text(`PING ${label} 56(84) bytes of data.`));

    if (!resolvable) {
      for (let i = 0; i < count; i++) {
        await ctx.sleep(400);
        ctx.print(out.error(`Request timeout for icmp_seq ${i}`));
      }
      return [
        out.blank(),
        out.text(`--- ${ip} ping statistics ---`),
        out.error(`${count} packets transmitted, 0 received, 100% packet loss`),
        out.blank(),
        out.muted(
          "Nothing in the lab owns that address. Real troubleshooting starts here: " +
            "`show ip route` to check the path, `arp` to check layer 2."
        ),
      ];
    }

    const base = host?.baseRtt ?? 14.2;
    const hops = host?.hops ?? 6;
    const ttl = host ? ttlFor(host) : 52;
    const rtts = [];

    for (let i = 0; i < count; i++) {
      await ctx.sleep(i === 0 ? 120 : 320);
      const rtt = jitter(base, base * (i === 0 ? 3.2 : 1.6)); // first packet pays for ARP
      rtts.push(rtt);
      ctx.print(out.success(`64 bytes from ${ip}: icmp_seq=${i} ttl=${ttl} time=${ms(rtt)}`));
    }

    const min = Math.min(...rtts);
    const max = Math.max(...rtts);
    const avg = rtts.reduce((a, b) => a + b, 0) / rtts.length;

    return [
      out.blank(),
      out.text(`--- ${ip} ping statistics ---`),
      out.success(`${count} packets transmitted, ${count} received, 0% packet loss`),
      out.text(`rtt min/avg/max = ${min.toFixed(1)}/${avg.toFixed(1)}/${max.toFixed(1)} ms`),
      ...(host
        ? [out.muted(`${hops} hop${hops === 1 ? "" : "s"} away · TTL ${ttl} means it started at ${ttl + host.hops - 1}`)]
        : [out.muted("Left the lab through R2's NAT translation.")]),
    ];
  },
};

const traceroute = {
  name: "traceroute",
  aliases: ["tracert", "trace"],
  category: "network",
  usage: "traceroute <host|ip>",
  description: "Trace the path through the lab, hop by hop.",
  examples: ["traceroute isp-gw", "traceroute 203.0.113.1"],

  async run(ctx, { args }) {
    const target = args[0];
    if (!target) return out.error("usage: traceroute <host|ip>");

    const host = resolveHost(target);
    const external = !host && isValidIp(target);
    if (!host && !external) return out.error(`traceroute: unknown host ${target}`);

    // The lab path is fixed, so the hop list is derived from it rather
    // than invented: PC1 → R1 → R2 → ISP → beyond.
    const path = [
      { name: "R1", ip: "192.168.10.1", base: 1.1 },
      { name: "R2", ip: "10.0.0.2", base: 2.6 },
      { name: "isp-gw", ip: "203.0.113.1", base: 8.4 },
    ];

    const hops = host
      ? path.slice(0, host.hops).map((h, i) => (i === host.hops - 1 ? { ...h, name: host.name, ip: host.ip, base: host.baseRtt } : h))
      : [...path, { name: null, ip: target, base: 16.5 }];

    ctx.print(out.text(`traceroute to ${host?.ip ?? target}, 30 hops max, 60 byte packets`));

    for (let i = 0; i < hops.length; i++) {
      await ctx.sleep(380);
      const hop = hops[i];
      const probes = Array.from({ length: 3 }, () => ms(jitter(hop.base, hop.base * 1.7))).join("  ");
      ctx.print(
        out.success(
          ` ${String(i + 1).padStart(2)}  ${hop.name ? `${hop.name} (${hop.ip})` : hop.ip}  ${probes}`
        )
      );
    }

    return [
      out.blank(),
      out.muted(
        host
          ? `${hops.length} hop${hops.length === 1 ? "" : "s"} — matches \`show ip route\` on R1.`
          : "Beyond R2 the path is simulated; inside the lab it's the real topology."
      ),
    ];
  },
};

/* ------------------------------------------------------------------
   arp / ifconfig / dig
   ------------------------------------------------------------------ */

const arp = {
  name: "arp",
  category: "network",
  usage: "arp [-a] [ip]",
  description: "The lab's ARP table — IP to MAC, per interface.",
  examples: ["arp", "arp 192.168.10.1"],
  flags: { a: "boolean" },

  run(ctx, { args }) {
    const rows = args[0] ? arpTable.filter((e) => e.ip === args[0]) : arpTable;

    if (rows.length === 0) {
      return [
        out.error(`no ARP entry for ${args[0]}`),
        out.muted("An empty ARP entry usually means the host is off, or you're in the wrong VLAN."),
      ];
    }

    return [
      out.table(
        ["address", "hw address", "type", "interface", "host"],
        rows.map((e) => [e.ip, e.mac, e.type, e.iface, e.host]),
        { accent: "net" }
      ),
      out.blank(),
      out.muted("ARP is layer 2 → layer 3 glue. It only ever resolves addresses in your own subnet."),
    ];
  },
};

const ifconfig = {
  name: "ifconfig",
  aliases: ["ipconfig", "ip-a"],
  category: "network",
  usage: "ifconfig [device]",
  description: "Interface addresses on a lab device.",
  examples: ["ifconfig", "ifconfig SW1"],
  complete: () => devices.map((d) => d.hostname),

  run(ctx, { args }) {
    const name = args[0] ?? ctx.session.device ?? defaultDevice;
    const device = getDevice(name);
    if (!device) {
      return [
        out.error(`no device '${name}' in the lab`),
        out.muted(`devices: ${devices.map((d) => d.hostname).join(", ")}`),
      ];
    }

    const rows = device.interfaces
      .filter((i) => i.ip && i.ip !== "unassigned")
      .map((i) => [i.name, i.ip, i.mask, `${i.status}/${i.protocol}`, i.description ?? ""]);

    if (rows.length === 0) {
      return [
        out.warn(`${device.hostname} has no layer 3 addresses — it's a ${device.kind}.`),
        out.muted("Try `show interfaces` in the IOS view, or pick a router."),
      ];
    }

    return [
      out.heading(`${device.hostname} — ${device.model}`),
      out.table(["interface", "address", "mask", "status", "description"], rows, { accent: "net" }),
    ];
  },
};

/** A tiny fixed zone — enough for the lab, honest about being fake. */
const ZONE = {
  "r1.lab.local": "192.168.10.1",
  "r2.lab.local": "10.0.0.2",
  "sw1.lab.local": "192.168.30.11",
  "srv1.lab.local": "192.168.20.10",
  "pc1.lab.local": "192.168.10.10",
};

const dig = {
  name: "dig",
  aliases: ["nslookup", "host"],
  category: "network",
  usage: "dig <name>",
  description: "Resolve a name against the lab's zone file.",
  examples: ["dig srv1.lab.local", "dig r1.lab.local"],
  complete: () => Object.keys(ZONE),

  async run(ctx, { args }) {
    const name = (args[0] ?? "").toLowerCase();
    if (!name) return out.error("usage: dig <name>");

    await ctx.sleep(280);

    const answer = ZONE[name] ?? ZONE[`${name}.lab.local`];
    if (!answer) {
      return [
        out.error(`;; ->>HEADER<<- status: NXDOMAIN`),
        out.blank(),
        out.muted(
          `Only ${Object.keys(ZONE).length} names exist in the lab zone: ${Object.keys(ZONE).join(", ")}`
        ),
      ];
    }

    return [
      out.ascii(
        [
          ";; ->>HEADER<<- opcode: QUERY, status: NOERROR",
          ";; QUESTION SECTION:",
          `;${name}.\t\t\tIN\tA`,
          "",
          ";; ANSWER SECTION:",
          `${name}.\t\t3600\tIN\tA\t${answer}`,
          "",
          ";; Query time: 3 msec",
          ";; SERVER: 192.168.20.10#53(192.168.20.10)",
        ].join("\n"),
        { accent: "net" }
      ),
      out.blank(),
      out.muted("DNS is layer 7 over UDP/53 — TCP/53 only for zone transfers and long answers."),
    ];
  },
};

export default [
  subnetCommand,
  vlsmCommand,
  summarizeCommand,
  wildcard,
  mask,
  binary,
  containsCommand,
  port,
  osi,
  mac,
  ping,
  traceroute,
  arp,
  ifconfig,
  dig,
];
