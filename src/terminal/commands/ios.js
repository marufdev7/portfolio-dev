// ---------------------------------------------------------------
// Simulated Cisco IOS (§6.6).
//
// Scope is deliberately narrow and stated out loud: these commands
// READ a fixed topology. There is no control plane, so `show ip route`
// can't be wrong about a route it didn't compute — it prints what
// labTopology.js declares. Anything that pretends to configure state
// says so.
//
// Mode handling is real though: user → privileged → config, with the
// prompt and the available commands changing at each level, because
// that hierarchy is the first thing anyone who knows IOS will test.
// ---------------------------------------------------------------

import * as out from "../output";
import { table } from "../../lib/format";
import {
    devices,
    getDevice,
    defaultDevice,
    deviceNames,
    vlans,
    routeTables,
    ospfNeighbors,
    macTable,
    cdpNeighbors,
    runningConfigs,
    topologyAscii,
} from "../../data/labTopology";

/** The device the IOS commands are currently answering as. */
const current = (ctx) => getDevice(ctx.session.device ?? defaultDevice);

/** IOS refuses privileged commands from user mode — so do we. */
function requirePrivileged(ctx, what) {
    if ((ctx.session.iosMode ?? "user") === "user") {
        return [
            out.error("% Invalid input detected at '^' marker."),
            out.muted(`${what} needs privileged mode. Type \`enable\` first.`),
        ];
    }
    return null;
}

/* ------------------------------------------------------------------
   device — pick which box you're on
   ------------------------------------------------------------------ */

const device = {
    name: "device",
    aliases: ["console", "connect"],
    category: "ios",
    usage: "device [hostname]",
    description: "Console into another device in the lab.",
    examples: ["device", "device SW1", "device R2"],
    complete: () => deviceNames,

    run(ctx, { args }) {
        if (!args[0]) {
            return [
                out.heading("Devices in the lab"),
                out.table(
                    ["hostname", "kind", "model"],
                    devices.map((d) => [d.hostname, d.kind, d.model]),
                    { accent: "net" }
                ),
                out.blank(),
                out.muted(`currently consoled into ${current(ctx).hostname} — \`device SW1\` to switch.`),
            ];
        }

        const target = getDevice(args[0]);
        if (!target) {
            return [
                out.error(`% No device named '${args[0]}' in this topology`),
                out.muted(`devices: ${deviceNames.join(", ")}`),
            ];
        }

        ctx.session.device = target.hostname;
        ctx.session.iosMode = "user";
        return [
            out.success(`Connected to ${target.hostname} (${target.model}).`),
            out.muted("Press RETURN to get started. `enable` for privileged mode, `show ?` for options."),
        ];
    },
};

/* ------------------------------------------------------------------
   enable / disable / configure
   ------------------------------------------------------------------ */

const enable = {
    name: "enable",
    aliases: ["en"],
    category: "ios",
    usage: "enable",
    description: "Enter privileged EXEC mode (the # prompt).",

    run(ctx) {
        if (ctx.session.iosMode === "privileged") return out.muted("Already in privileged mode.");
        ctx.session.iosMode = "privileged";
        return out.success(`${current(ctx).hostname}# — privileged EXEC mode.`);
    },
};

const disable = {
    name: "disable",
    category: "ios",
    usage: "disable",
    description: "Drop back to user EXEC mode.",

    run(ctx) {
        ctx.session.iosMode = "user";
        return out.muted(`${current(ctx).hostname}> — user EXEC mode.`);
    },
};

const configure = {
    name: "configure",
    aliases: ["conf", "config"],
    category: "ios",
    usage: "configure terminal",
    description: "Enter global configuration mode.",
    examples: ["configure terminal", "conf t"],
    complete: () => ["terminal"],

    run(ctx, { args }) {
        const denied = requirePrivileged(ctx, "configure");
        if (denied) return denied;

        const sub = (args[0] ?? "terminal").toLowerCase();
        if (!"terminal".startsWith(sub)) {
            return out.error("% Invalid input detected at '^' marker.");
        }

        ctx.session.iosMode = "config";
        ctx.session.configBuffer = [];

        // Config mode swallows raw lines until `end` or `exit` — that's the
        // interceptor hook the engine exposes, and it's why config feels
        // like a mode rather than a command.
        ctx.setInterceptor((line, innerCtx) => {
            const trimmed = line.trim();

            if (/^(end|exit|\^z)$/i.test(trimmed)) {
                innerCtx.setInterceptor(null);
                innerCtx.session.iosMode = "privileged";
                const count = innerCtx.session.configBuffer.length;
                return [
                    out.muted(`${current(innerCtx).hostname}#`),
                    count
                        ? out.warn(
                            `${count} line${count === 1 ? "" : "s"} accepted and discarded — this console is read-only. ` +
                            "The real configs live in the lab writeups."
                        )
                        : out.muted("Left configuration mode."),
                    ...(count ? [out.link("see the lab configs →", "/network/labs", { internal: true })] : []),
                ];
            }

            if (!trimmed) return undefined;

            innerCtx.session.configBuffer.push(trimmed);
            return out.muted(`(config)# ${trimmed}`);
        });

        return [
            out.text("Enter configuration commands, one per line.  End with CNTL/Z."),
            out.warn("Read-only console: config lines are echoed, not applied."),
        ];
    },
};

/* ------------------------------------------------------------------
   show
   ------------------------------------------------------------------ */

/** Every `show` subcommand, keyed by the shortest unambiguous phrase. */
const SHOW = {
    "ip route": showIpRoute,
    "ip interface brief": showIpIntBrief,
    "ip int brief": showIpIntBrief,
    "ip ospf neighbor": showOspfNeighbors,
    "ip ospf neighbors": showOspfNeighbors,
    "ip protocols": showIpProtocols,
    "vlan brief": showVlanBrief,
    vlan: showVlanBrief,
    "mac address-table": showMacTable,
    "mac-address-table": showMacTable,
    "cdp neighbors": showCdpNeighbors,
    "cdp neighbor": showCdpNeighbors,
    "running-config": showRunningConfig,
    run: showRunningConfig,
    "startup-config": showRunningConfig,
    version: showVersion,
    interfaces: showInterfaces,
    interface: showInterfaces,
    topology: showTopology,
    clock: showClock,
};

function showIpRoute(ctx) {
    const host = current(ctx).hostname;
    const routes = routeTables[host];

    if (!routes) {
        return [
            out.error(`% ${host} is a layer 2 switch — it has no IP routing table.`),
            out.muted("Try `device R1` first, or `show vlan brief` here."),
        ];
    }

    const legend = [
        "Codes: C - connected, L - local, S - static, O - OSPF,",
        "       E2 - OSPF external type 2, * - candidate default",
        "",
    ].join("\n");

    const body = routes.map((r) => {
        const left = `${r.code.padEnd(4)} ${r.network}`;
        if (r.proto === "connected") return `${left.padEnd(28)} is directly connected, ${r.iface}`;
        if (r.proto === "local") return `${left.padEnd(28)} is directly connected, ${r.iface}`;
        if (r.proto === "static") return `${left.padEnd(28)} [1/0] via ${r.via}`;
        return `${left.padEnd(28)} [${r.metric}] via ${r.via}, ${r.age}, ${r.iface}`;
    });

    return [
        out.ascii(legend + body.join("\n"), { accent: "net" }),
        out.blank(),
        out.muted(
            `${routes.length} routes on ${host}. L entries are the router's own addresses — /32 host routes it installs for itself.`
        ),
    ];
}

function showIpIntBrief(ctx) {
    const device = current(ctx);
    return out.ascii(
        table(
            ["Interface", "IP-Address", "OK?", "Method", "Status", "Protocol"],
            device.interfaces.map((i) => [
                i.name,
                i.ip || "unassigned",
                "YES",
                i.ip && i.ip !== "unassigned" ? "manual" : "unset",
                i.status,
                i.protocol,
            ])
        ),
        { accent: "net" }
    );
}

function showOspfNeighbors(ctx) {
    const host = current(ctx).hostname;
    const neighbors = ospfNeighbors[host];

    if (!neighbors) {
        return [
            out.error(`% OSPF is not running on ${host}.`),
            out.muted("OSPF area 0 runs between R1 and R2 only."),
        ];
    }

    return [
        out.ascii(
            table(
                ["Neighbor ID", "Pri", "State", "Dead Time", "Address", "Interface"],
                neighbors.map((n) => [n.id, n.pri, n.state, n.dead, n.address, n.iface])
            ),
            { accent: "net" }
        ),
        out.blank(),
        out.muted(
            "FULL is the only state you want to see. Stuck in EXSTART/EXCHANGE means an MTU mismatch — that's lab 03."
        ),
    ];
}

function showIpProtocols(ctx) {
    const host = current(ctx).hostname;
    if (!ospfNeighbors[host]) {
        return out.error(`% No routing protocols running on ${host}.`);
    }

    return out.ascii(
        [
            "Routing Protocol is \"ospf 1\"",
            "  Router ID " + (host === "R1" ? "1.1.1.1" : "2.2.2.2"),
            "  Number of areas in this router is 1. 1 normal 0 stub 0 nssa",
            "  Routing for Networks:",
            host === "R1"
                ? "    10.0.0.0 0.0.0.3 area 0\n    192.168.10.0 0.0.0.255 area 0\n    192.168.20.0 0.0.0.255 area 0\n    192.168.30.0 0.0.0.255 area 0"
                : "    10.0.0.0 0.0.0.3 area 0",
            "  Distance: (default is 110)",
        ].join("\n"),
        { accent: "net" }
    );
}

function showVlanBrief(ctx) {
    const device = current(ctx);
    if (device.kind !== "switch") {
        return [
            out.error(`% ${device.hostname} is a ${device.kind} — no VLAN database.`),
            out.muted("`device SW1` to console into a switch."),
        ];
    }

    return [
        out.ascii(
            table(
                ["VLAN", "Name", "Status", "Ports"],
                vlans.map((v) => [v.id, v.name, v.status, v.ports.join(", ") || "—"])
            ),
            { accent: "net" }
        ),
        out.blank(),
        out.muted("Trunk ports never appear in this list — they carry every allowed VLAN, so they belong to none."),
    ];
}

function showMacTable(ctx) {
    const device = current(ctx);
    if (device.kind !== "switch") {
        return out.error(`% ${device.hostname} is a ${device.kind} — no MAC address table.`);
    }

    return [
        out.ascii(
            table(
                ["Vlan", "Mac Address", "Type", "Ports"],
                macTable.map((e) => [e.vlan, e.mac.toLowerCase(), e.type, e.port])
            ),
            { accent: "net" }
        ),
        out.blank(),
        out.muted(
            "The router's MAC appears once per VLAN on the trunk port Gi0/1 — one physical interface, three subinterfaces."
        ),
    ];
}

function showCdpNeighbors(ctx) {
    const host = current(ctx).hostname;
    const neighbors = cdpNeighbors[host] ?? [];

    if (neighbors.length === 0) return out.muted("% No CDP neighbours discovered.");

    return [
        out.ascii(
            [
                "Capability Codes: R - Router, S - Switch, I - IGMP, B - Source Route Bridge",
                "",
                table(
                    ["Device ID", "Local Intrfce", "Holdtme", "Capability", "Platform", "Port ID"],
                    neighbors.map((n) => [n.id, n.localIface, n.holdtime, n.capability, n.platform, n.portId])
                ),
            ].join("\n"),
            { accent: "net" }
        ),
        out.blank(),
        out.muted("CDP is Cisco-proprietary and layer 2 — it sees neighbours even when addressing is broken."),
    ];
}

function showRunningConfig(ctx) {
    const host = current(ctx).hostname;
    const config = runningConfigs[host];
    if (!config) return out.error(`% No saved configuration for ${host}.`);
    return out.ascii(config, { accent: "net" });
}

function showVersion(ctx) {
    const d = current(ctx);
    return out.ascii(
        [
            `Cisco IOS Software, ${d.model} Software, Version ${d.iosVersion ?? "15.0(2)SE"}`,
            "Copyright (c) 1986-2016 by Cisco Systems, Inc.",
            "",
            `${d.hostname} uptime is ${d.uptime ?? "1 week, 4 days"}`,
            `System returned to ROM by power-on`,
            "",
            `Processor board ID ${d.serial ?? "FTX0000XXXX"}`,
            `${d.interfaces.length} interfaces`,
            "",
            "Configuration register is 0x2102",
        ].join("\n"),
        { accent: "net" }
    );
}

function showInterfaces(ctx, target) {
    const d = current(ctx);
    const list = target
        ? d.interfaces.filter((i) => i.name.toLowerCase().replace(/\s/g, "").includes(target.toLowerCase().replace(/\s/g, "")))
        : d.interfaces;

    if (list.length === 0) return out.error(`% Invalid interface '${target}' on ${d.hostname}`);

    const blocks = [];
    for (const i of list) {
        blocks.push(
            out.ascii(
                [
                    `${i.name} is ${i.status}, line protocol is ${i.protocol}`,
                    `  Hardware is Gigabit Ethernet, address is ${i.mac ? i.mac.toLowerCase() : "0000.0000.0000"}`,
                    i.description ? `  Description: ${i.description}` : null,
                    i.ip && i.ip !== "unassigned"
                        ? `  Internet address is ${i.ip}/${maskBits(i.mask)}`
                        : "  Internet address is not set",
                    "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec",
                    i.switchportMode ? `  Switchport mode: ${i.switchportMode}` : null,
                    i.vlan ? `  Encapsulation 802.1Q Virtual LAN, Vlan ID ${i.vlan}` : null,
                ]
                    .filter(Boolean)
                    .join("\n"),
                { accent: "net" }
            )
        );
        blocks.push(out.blank());
    }
    return blocks;
}

/** 255.255.255.0 → 24, without pulling in ip.js for one call site. */
function maskBits(mask) {
    if (!mask) return 0;
    return mask
        .split(".")
        .map((o) => Number(o).toString(2).replace(/0/g, "").length)
        .reduce((a, b) => a + b, 0);
}

function showTopology() {
    return [
        out.ascii(topologyAscii, { accent: "net" }),
        out.blank(),
        out.muted("The whole lab. Every `show` command on this console reads from it."),
    ];
}

function showClock() {
    return out.text(`*${new Date().toUTCString().replace("GMT", "UTC")}`);
}

/** The forms worth advertising — SHOW also accepts abbreviations of these. */
const CANONICAL_SHOW = [
    "ip route",
    "ip interface brief",
    "ip ospf neighbor",
    "ip protocols",
    "vlan brief",
    "mac address-table",
    "cdp neighbors",
    "interfaces [name]",
    "running-config",
    "version",
    "topology",
    "clock",
];

const show = {
    name: "show",
    aliases: ["sh"],
    category: "ios",
    usage: "show <ip route | ip interface brief | vlan brief | mac address-table | cdp neighbors | running-config | version | interfaces | ip ospf neighbor | topology>",
    description: "Read the lab's state, IOS style.",
    examples: [
        "show ip route",
        "show ip interface brief",
        "show vlan brief",
        "show cdp neighbors",
        "show running-config",
    ],
    notes:
        "Reads a fixed topology — there is no control plane behind this. `device <name>` changes which box answers.",
    complete: (ctx, { args }) => {
        // Offer the next word of every subcommand that matches what's typed.
        const typed = args.slice(1).join(" ").toLowerCase();
        const depth = args.length - 1;
        return [
            ...new Set(
                Object.keys(SHOW)
                    .filter((k) => k.startsWith(typed))
                    .map((k) => k.split(" ")[depth])
                    .filter(Boolean)
            ),
        ];
    },

    run(ctx, { args }) {
        if (args.length === 0 || args[0] === "?") {
            return [
                out.heading(`show — available on ${current(ctx).hostname}`),
                out.ascii(CANONICAL_SHOW.map((k) => `  show ${k}`).join("\n"), { accent: "net" }),
                out.blank(),
                out.muted("`show topology` draws the whole lab."),
            ];
        }

        const phrase = args.join(" ").toLowerCase();

        // Longest match first, so `show ip interface brief` doesn't get
        // grabbed by `show interface`.
        const key = Object.keys(SHOW)
            .filter((k) => phrase === k || phrase.startsWith(`${k} `))
            .sort((a, b) => b.length - a.length)[0];

        if (!key) {
            return [
                out.error(`% Invalid input detected at '^' marker.`),
                out.muted(`\`show ?\` lists what this console understands.`),
            ];
        }

        if (key === "running-config" || key === "run" || key === "startup-config") {
            const denied = requirePrivileged(ctx, "show running-config");
            if (denied) return denied;
        }

        const remainder = phrase.slice(key.length).trim();
        return SHOW[key](ctx, remainder || undefined);
    },
};

export default [device, enable, disable, configure, show];
