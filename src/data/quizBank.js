// ---------------------------------------------------------------
// Quiz content for `quiz subnet | vlan | ports | osi`.
//
// Subnet questions are GENERATED, not stored — a fixed bank of ten
// gets memorised in a week and stops teaching anything. The other
// three modes draw from static banks below.
//
// Every question carries a worked `solution`, because printing
// "incorrect" alone teaches nothing (plan §6.3).
// ---------------------------------------------------------------

import { subnet, intToIp, ipToInt, prefixForHosts, prefixToMask } from "../lib/ip";
import { ports } from "./ports";
import { osiLayers } from "./osi";

/** @typedef {Object} Question
 *  @property {string} prompt
 *  @property {string} answer            canonical form
 *  @property {string[]} [accept]        additional acceptable spellings
 *  @property {string} solution          worked explanation, shown either way
 *  @property {string} [hint]
 */

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr) => arr[randInt(0, arr.length - 1)];

/** A random address inside a plausible private range. */
function randomPrivateAddress() {
    const style = pick(["10", "172", "192"]);
    if (style === "10") return `10.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
    if (style === "172") return `172.${randInt(16, 31)}.${randInt(0, 255)}.${randInt(1, 254)}`;
    return `192.168.${randInt(0, 255)}.${randInt(1, 254)}`;
}

/* ------------------------------------------------------------------
   Subnet — generated
   ------------------------------------------------------------------ */

const subnetQuestionKinds = [
    /** Usable host count. */
    () => {
        const prefix = randInt(16, 30);
        const cidr = `${randomPrivateAddress()}/${prefix}`;
        const info = subnet(cidr);
        return {
            prompt: `How many usable hosts in ${info.network}/${prefix}?`,
            answer: String(info.usableHosts),
            accept: [info.usableHosts.toLocaleString("en-US")],
            hint: "2^(32 - prefix) - 2",
            solution:
                `/${prefix} leaves ${32 - prefix} host bits.\n` +
                `2^${32 - prefix} = ${info.totalAddresses} total addresses.\n` +
                `Minus the network and broadcast addresses = ${info.usableHosts} usable.`,
        };
    },

    /** Network address of a given host address. */
    () => {
        const prefix = randInt(17, 30);
        const address = randomPrivateAddress();
        const info = subnet(`${address}/${prefix}`);
        const octetIndex = Math.floor((prefix - 1) / 8);
        const maskOctet = Number(info.mask.split(".")[octetIndex]);
        const blockSize = 256 - maskOctet;
        return {
            prompt: `What is the network address of ${address}/${prefix}?`,
            answer: info.network,
            hint: "Find the interesting octet, then count in block-size steps.",
            solution:
                `Mask for /${prefix} is ${info.mask}.\n` +
                `Interesting octet is #${octetIndex + 1}; block size = 256 - ${maskOctet} = ${blockSize}.\n` +
                `Counting in ${blockSize}s, ${address.split(".")[octetIndex]} falls in the block starting at ` +
                `${info.network.split(".")[octetIndex]}.\n` +
                `Network = ${info.network}`,
        };
    },

    /** Broadcast address. */
    () => {
        const prefix = randInt(17, 30);
        const address = randomPrivateAddress();
        const info = subnet(`${address}/${prefix}`);
        const nextNetwork = intToIp(ipToInt(info.network) + info.totalAddresses);
        return {
            prompt: `What is the broadcast address of ${address}/${prefix}?`,
            answer: info.broadcast,
            hint: "Next network's address, minus one.",
            solution:
                `Network is ${info.network}/${prefix}, block size ${info.totalAddresses}.\n` +
                `The next network starts at ${nextNetwork}.\n` +
                `One below that is the broadcast address = ${info.broadcast}`,
        };
    },

    /** Dotted mask for a prefix. */
    () => {
        const prefix = randInt(8, 30);
        return {
            prompt: `Write /${prefix} as a dotted-decimal subnet mask.`,
            answer: prefixToMask(prefix),
            hint: "Cumulative octet values: 128 192 224 240 248 252 254 255",
            solution:
                `/${prefix} = ${prefix} network bits.\n` +
                `${Math.floor(prefix / 8)} full octets of 255, then ${prefix % 8} bit${prefix % 8 === 1 ? "" : "s"
                } in the next octet.\n` +
                `= ${prefixToMask(prefix)}`,
        };
    },

    /** Smallest prefix for a host requirement. */
    () => {
        const hosts = pick([5, 10, 12, 25, 28, 30, 50, 60, 100, 120, 200, 250, 500, 1000]);
        const prefix = prefixForHosts(hosts);
        return {
            prompt: `What is the smallest subnet (as a prefix) that fits ${hosts} usable hosts?`,
            answer: `/${prefix}`,
            accept: [String(prefix), prefixToMask(prefix)],
            hint: "Smallest n where 2^n - 2 >= hosts",
            solution:
                `Need 2^n - 2 >= ${hosts}, so n = ${32 - prefix} host bits ` +
                `(2^${32 - prefix} - 2 = ${2 ** (32 - prefix) - 2}).\n` +
                `32 - ${32 - prefix} = /${prefix}  (${prefixToMask(prefix)})`,
        };
    },

    /** Wildcard mask for a prefix. */
    () => {
        const prefix = randInt(16, 30);
        const info = subnet(`10.0.0.0/${prefix}`);
        return {
            prompt: `What is the ACL wildcard mask for a /${prefix}?`,
            answer: info.wildcard,
            hint: "255.255.255.255 minus the subnet mask",
            solution:
                `Subnet mask for /${prefix} is ${info.mask}.\n` +
                `Wildcard = 255.255.255.255 - ${info.mask} = ${info.wildcard}`,
        };
    },

    /** First usable host. */
    () => {
        const prefix = randInt(17, 29);
        const address = randomPrivateAddress();
        const info = subnet(`${address}/${prefix}`);
        return {
            prompt: `What is the first usable host address in ${address}/${prefix}?`,
            answer: info.firstHost,
            hint: "Network address plus one.",
            solution: `Network is ${info.network}, so the first usable host is ${info.firstHost}.`,
        };
    },
];

/* ------------------------------------------------------------------
   Static banks
   ------------------------------------------------------------------ */

/** @type {Question[]} */
export const vlanQuestions = [
    {
        prompt: "Which command sets a switchport into a single VLAN, VLAN 10?",
        answer: "switchport access vlan 10",
        accept: ["switchport access vlan10"],
        solution:
            "`switchport mode access` sets the role; `switchport access vlan 10` assigns the VLAN. Without the second command the port stays in VLAN 1.",
    },
    {
        prompt: "What is the default native VLAN on a Cisco trunk?",
        answer: "1",
        accept: ["vlan 1", "vlan1"],
        solution:
            "VLAN 1 by default. Best practice is to change it to an unused VLAN on both ends — a mismatch is what broke lab 01.",
    },
    {
        prompt: "Which protocol tags frames on a trunk link?",
        answer: "802.1Q",
        accept: ["dot1q", "802.1q", "ieee 802.1q"],
        solution:
            "IEEE 802.1Q inserts a 4-byte tag containing the VLAN ID. The native VLAN is the exception — its frames cross untagged.",
    },
    {
        prompt: "How many bytes does an 802.1Q tag add to an Ethernet frame?",
        answer: "4",
        accept: ["4 bytes"],
        solution:
            "4 bytes, which pushes the maximum frame to 1522. This is why some switches need a 'baby giant' MTU allowance.",
    },
    {
        prompt: "Name the three things that must match on both ends of a trunk.",
        answer: "native vlan, allowed vlan list, encapsulation",
        accept: [
            "native vlan allowed vlan encapsulation",
            "native vlan, allowed vlans, encapsulation",
            "encapsulation, native vlan, allowed vlan list",
        ],
        solution:
            "Native VLAN, allowed VLAN list, and encapsulation. `show interfaces trunk` reports each end's own view and will say `trunking` on both while they disagree.",
    },
    {
        prompt: "Which command shows trunk status, native VLAN, and allowed VLANs?",
        answer: "show interfaces trunk",
        accept: ["show interface trunk", "sh int trunk"],
        solution:
            "`show interfaces trunk`. Remember it only shows the local view — compare with `show cdp neighbors detail` or the syslog to catch a mismatch.",
    },
    {
        prompt: "What is 'router-on-a-stick'?",
        answer: "inter-vlan routing over one trunk using subinterfaces",
        accept: [
            "inter-vlan routing with subinterfaces",
            "routing between vlans over a single trunk link",
            "subinterfaces on one physical interface",
        ],
        solution:
            "One physical router interface carries every VLAN over a trunk, with a dot1Q subinterface per VLAN holding that VLAN's gateway address. The physical interface gets no IP and must be no-shutdown.",
    },
    {
        prompt: "Which VLAN range is reserved and cannot be used?",
        answer: "1002-1005",
        accept: ["1002 to 1005", "1002–1005"],
        solution:
            "VLANs 1002–1005 are reserved for legacy Token Ring and FDDI. Usable range is 2–1001 and 1006–4094; VLAN 1 exists but shouldn't carry user traffic.",
    },
];

/** @type {Question[]} */
export const osiQuestions = [
    ...osiLayers.map((layer) => ({
        prompt: `Which OSI layer number is the ${layer.name} layer?`,
        answer: String(layer.n),
        accept: [`layer ${layer.n}`, `l${layer.n}`],
        solution: `${layer.name} is layer ${layer.n}. PDU: ${layer.pdu}. ${layer.summary}`,
    })),
    {
        prompt: "At which OSI layer does a router operate?",
        answer: "3",
        accept: ["layer 3", "network", "network layer"],
        solution:
            "Layer 3 — routers make forwarding decisions on logical (IP) addresses. Switches are layer 2, hubs layer 1.",
    },
    {
        prompt: "At which OSI layer does a switch normally operate?",
        answer: "2",
        accept: ["layer 2", "data link", "data link layer"],
        solution:
            "Layer 2 — a switch forwards on MAC addresses. A 'layer 3 switch' adds routing on top of that.",
    },
    {
        prompt: "What is the PDU at layer 3?",
        answer: "packet",
        accept: ["packets"],
        solution: "Layer 4 segments, layer 3 packets, layer 2 frames, layer 1 bits.",
    },
    {
        prompt: "What is the PDU at layer 2?",
        answer: "frame",
        accept: ["frames"],
        solution: "Layer 2 encapsulates packets into frames, adding MAC addresses and a frame check sequence.",
    },
    {
        prompt: "Interface status is up/down. Which layer is the problem?",
        answer: "2",
        accept: ["layer 2", "data link"],
        solution:
            "up/down means layer 1 is fine (signal present) but layer 2 won't come up — encapsulation mismatch, keepalive failure, or a duplex issue. down/down is layer 1.",
    },
    {
        prompt: "At which layer do TCP and UDP operate?",
        answer: "4",
        accept: ["layer 4", "transport", "transport layer"],
        solution: "Layer 4 — ports, reliability, and segmentation. TCP is connection-oriented; UDP is not.",
    },
    {
        prompt: "Which layer does ARP belong to?",
        answer: "2",
        accept: ["layer 2", "data link"],
        solution:
            "ARP is generally placed at layer 2 — it resolves layer 3 addresses to layer 2 ones and its frames don't leave the broadcast domain.",
    },
];

/** Generated from ports.js so the bank never drifts from the lookup table. */
export const portQuestions = ports
    .filter((p) => p.port <= 3389)
    .map((p) => ({
        prompt: `Which port does ${p.service} use?`,
        answer: String(p.port),
        accept: [`port ${p.port}`, `${p.port}/${p.proto.toLowerCase()}`],
        solution: `${p.service} — ${p.proto} ${p.port}. ${p.description}`,
    }));

/* ------------------------------------------------------------------
   Public API
   ------------------------------------------------------------------ */

export const quizModes = {
    subnet: { label: "Subnetting", generated: true },
    vlan: { label: "VLANs & trunking", bank: vlanQuestions },
    ports: { label: "Well-known ports", bank: portQuestions },
    osi: { label: "OSI model", bank: osiQuestions },
};

/**
 * @param {'subnet'|'vlan'|'ports'|'osi'} mode
 * @param {number} count
 * @returns {Question[]}
 */
export function buildQuiz(mode, count = 10) {
    if (mode === "subnet") {
        return Array.from({ length: count }, () => pick(subnetQuestionKinds)());
    }

    const bank = quizModes[mode]?.bank;
    if (!bank) throw new Error(`unknown quiz mode: ${mode}`);

    // Shuffle a copy, then take `count` — no repeats within a round.
    const shuffled = [...bank];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = randInt(0, i);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Lenient answer checking — case, whitespace, and a leading slash on
 * prefixes are all forgiven. Being pedantic about formatting teaches
 * formatting, not networking.
 *
 * @param {Question} question
 * @param {string} input
 */
export function checkAnswer(question, input) {
    const normalize = (s) =>
        String(s)
            .toLowerCase()
            .trim()
            .replace(/,/g, "")
            .replace(/\s+/g, " ");

    const given = normalize(input);
    if (!given) return false;

    const candidates = [question.answer, ...(question.accept ?? [])].map(normalize);
    if (candidates.includes(given)) return true;

    // "/26" and "26" are the same answer.
    const stripped = given.replace(/^\//, "");
    return candidates.some((c) => c.replace(/^\//, "") === stripped);
}
