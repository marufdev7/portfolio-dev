// ---------------------------------------------------------------
// IPv4 math. Pure functions, zero React imports — which is why the
// terminal, the <SubnetCalculator /> component, and the quiz
// generator can all share it, and why it's the part of the site
// that gets a real test suite (plan §6.9, §8).
//
// Every function here computes its answer bitwise. There is no
// lookup table of canned responses anywhere in this file.
//
// Note on 32-bit arithmetic: JavaScript bitwise operators coerce to
// SIGNED int32, so `>>> 0` is used to bring values back into the
// unsigned range. Without it, any address above 127.255.255.255
// comes out negative.
// ---------------------------------------------------------------

export class IpError extends Error {
    constructor(message) {
        super(message);
        this.name = "IpError";
    }
}

/* ------------------------------------------------------------------
   Parsing & formatting
   ------------------------------------------------------------------ */

/**
 * Dotted-decimal string → unsigned 32-bit integer.
 * @param {string} ip
 * @returns {number}
 */
export function ipToInt(ip) {
    const octets = parseOctets(ip);
    return (
        ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
    );
}

/**
 * Unsigned 32-bit integer → dotted-decimal string.
 * @param {number} int
 * @returns {string}
 */
export function intToIp(int) {
    if (!Number.isInteger(int) || int < 0 || int > 0xffffffff) {
        throw new IpError(`value out of IPv4 range: ${int}`);
    }
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255,
    ].join(".");
}

/**
 * Validates and splits a dotted-decimal address.
 * Rejects leading zeros ("010.1.1.1") because they read as octal
 * in some resolvers and are a real source of confusion.
 * @param {string} ip
 * @returns {number[]}
 */
export function parseOctets(ip) {
    if (typeof ip !== "string") throw new IpError("address must be a string");
    const parts = ip.trim().split(".");
    if (parts.length !== 4) {
        throw new IpError(`invalid IPv4 address: ${ip} (expected 4 octets)`);
    }
    return parts.map((part) => {
        if (!/^\d{1,3}$/.test(part)) {
            throw new IpError(`invalid octet "${part}" in ${ip}`);
        }
        if (part.length > 1 && part[0] === "0") {
            throw new IpError(`octet "${part}" in ${ip} has a leading zero`);
        }
        const n = Number(part);
        if (n > 255) throw new IpError(`octet ${n} in ${ip} exceeds 255`);
        return n;
    });
}

/** @param {string} ip */
export function isValidIp(ip) {
    try {
        parseOctets(ip);
        return true;
    } catch {
        return false;
    }
}

/**
 * Accepts a prefix length ("24", "/24") or a dotted mask ("255.255.255.0").
 * @param {string|number} input
 * @returns {number} prefix length 0–32
 */
export function parsePrefix(input) {
    const raw = String(input).trim().replace(/^\//, "");

    if (/^\d{1,2}$/.test(raw)) {
        const n = Number(raw);
        if (n > 32) throw new IpError(`prefix /${n} is out of range (0–32)`);
        return n;
    }

    if (raw.includes(".")) return maskToPrefix(raw);

    throw new IpError(`invalid prefix or mask: ${input}`);
}

/**
 * Dotted mask → prefix length. Rejects non-contiguous masks
 * (255.255.0.255 is not a valid subnet mask, however much it looks like one).
 * @param {string} mask
 * @returns {number}
 */
export function maskToPrefix(mask) {
    const int = ipToInt(mask);
    // A valid mask is a run of 1s then a run of 0s. Inverting it and
    // adding one must yield a power of two (or zero, for /32).
    const inverted = (~int) >>> 0;
    if (((inverted + 1) & inverted) !== 0) {
        throw new IpError(`${mask} is not a contiguous subnet mask`);
    }
    let prefix = 0;
    for (let i = 31; i >= 0; i--) {
        if ((int >>> i) & 1) prefix++;
        else break;
    }
    return prefix;
}

/** @param {number} prefix @returns {string} */
export function prefixToMask(prefix) {
    assertPrefix(prefix);
    if (prefix === 0) return "0.0.0.0";
    return intToIp(((0xffffffff << (32 - prefix)) >>> 0) >>> 0);
}

/** @param {number} prefix @returns {string} ACL wildcard mask */
export function prefixToWildcard(prefix) {
    assertPrefix(prefix);
    return intToIp((~maskInt(prefix)) >>> 0);
}

/** @param {number} prefix */
function assertPrefix(prefix) {
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
        throw new IpError(`prefix /${prefix} is out of range (0–32)`);
    }
}

/** @param {number} prefix @returns {number} mask as an unsigned int */
export function maskInt(prefix) {
    assertPrefix(prefix);
    return prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0) >>> 0;
}

/**
 * Splits "10.0.0.1/24" or "10.0.0.1 255.255.255.0" into its parts.
 * @param {string} input
 * @returns {{ip: string, prefix: number}}
 */
export function parseCidr(input) {
    if (typeof input !== "string") throw new IpError("expected a string like 10.0.0.0/24");
    const trimmed = input.trim();

    if (trimmed.includes("/")) {
        const [ip, prefix] = trimmed.split("/");
        if (prefix === undefined || prefix === "") {
            throw new IpError(`missing prefix after "/" in ${input}`);
        }
        parseOctets(ip);
        return { ip: ip.trim(), prefix: parsePrefix(prefix) };
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
        parseOctets(parts[0]);
        return { ip: parts[0], prefix: parsePrefix(parts[1]) };
    }

    throw new IpError(`expected <ip>/<cidr>, got: ${input}`);
}

/* ------------------------------------------------------------------
   Binary / hex representations
   ------------------------------------------------------------------ */

/** @param {number} int @returns {string} e.g. "11000000.10101000.00000001.00000001" */
export function intToBinary(int) {
    return [24, 16, 8, 0]
        .map((shift) => ((int >>> shift) & 255).toString(2).padStart(8, "0"))
        .join(".");
}

/** @param {number} int @returns {string} e.g. "0xC0A80101" */
export function intToHex(int) {
    return `0x${(int >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

/**
 * Splits the binary form at the prefix boundary so a caller can render
 * the network portion and host portion differently.
 * @param {string} ip
 * @param {number} prefix
 * @returns {{network: string, host: string, full: string}}
 */
export function binarySplit(ip, prefix) {
    assertPrefix(prefix);
    const bits = intToBinary(ipToInt(ip)).replace(/\./g, "");
    return {
        network: bits.slice(0, prefix),
        host: bits.slice(prefix),
        full: intToBinary(ipToInt(ip)),
    };
}

/* ------------------------------------------------------------------
   Address classification
   ------------------------------------------------------------------ */

/** Legacy classful letter. Still asked about, so still answered. */
export function ipClass(ip) {
    const first = parseOctets(ip)[0];
    if (first < 128) return "A";
    if (first < 192) return "B";
    if (first < 224) return "C";
    if (first < 240) return "D (multicast)";
    return "E (experimental)";
}

/**
 * Special-range detection. Order matters — loopback is inside no
 * private range, and APIPA is a subset of the 169.254 space.
 * @param {string} ip
 * @returns {{scope: string, rfc: string, detail: string}}
 */
export function classifyIp(ip) {
    const int = ipToInt(ip);
    const o = parseOctets(ip);

    const inRange = (cidr) => {
        const { ip: base, prefix } = parseCidr(cidr);
        return (int & maskInt(prefix)) >>> 0 === (ipToInt(base) & maskInt(prefix)) >>> 0;
    };

    if (inRange("127.0.0.0/8")) {
        return { scope: "Loopback", rfc: "RFC 1122", detail: "Never leaves the host" };
    }
    if (inRange("169.254.0.0/16")) {
        return {
            scope: "Link-local (APIPA)",
            rfc: "RFC 3927",
            detail: "Self-assigned — usually means DHCP failed",
        };
    }
    if (inRange("10.0.0.0/8") || inRange("172.16.0.0/12") || inRange("192.168.0.0/16")) {
        return { scope: "Private", rfc: "RFC 1918", detail: "Not routable on the internet — needs NAT" };
    }
    if (inRange("100.64.0.0/10")) {
        return { scope: "Shared address space (CGNAT)", rfc: "RFC 6598", detail: "Carrier-grade NAT" };
    }
    if (o[0] >= 224 && o[0] <= 239) {
        return { scope: "Multicast", rfc: "RFC 5771", detail: "One-to-many delivery" };
    }
    if (o[0] >= 240) {
        return { scope: "Reserved", rfc: "RFC 1112", detail: "Class E — experimental" };
    }
    if (inRange("0.0.0.0/8")) {
        return { scope: "This network", rfc: "RFC 1122", detail: "0.0.0.0 means 'any' or 'unspecified'" };
    }
    if (inRange("192.0.2.0/24") || inRange("198.51.100.0/24") || inRange("203.0.113.0/24")) {
        return { scope: "Documentation", rfc: "RFC 5737", detail: "Reserved for examples — safe in writeups" };
    }
    if (int === 0xffffffff) {
        return { scope: "Broadcast", rfc: "RFC 919", detail: "Limited broadcast — never forwarded" };
    }
    return { scope: "Public", rfc: "—", detail: "Globally routable" };
}

/* ------------------------------------------------------------------
   Subnet calculation
   ------------------------------------------------------------------ */

/** @typedef {Object} SubnetInfo
 *  @property {string} address
 *  @property {number} prefix
 *  @property {string} mask
 *  @property {string} wildcard
 *  @property {string} network
 *  @property {string} broadcast
 *  @property {string|null} firstHost
 *  @property {string|null} lastHost
 *  @property {number} totalAddresses
 *  @property {number} usableHosts
 *  @property {string} cidr
 *  @property {string} range
 *  @property {string} class
 *  @property {{scope: string, rfc: string, detail: string}} scope
 *  @property {string} [note]
 */

/**
 * The centrepiece. Handles /31 and /32 as the special cases they are
 * rather than returning nonsense negative host counts.
 *
 * @param {string} input '10.0.0.1/24' or '10.0.0.1 255.255.255.0'
 * @returns {SubnetInfo}
 */
export function subnet(input) {
    const { ip, prefix } = parseCidr(input);
    const addrInt = ipToInt(ip);
    const mask = maskInt(prefix);
    const networkInt = (addrInt & mask) >>> 0;
    const broadcastInt = (networkInt | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);

    let firstHost = null;
    let lastHost = null;
    let usableHosts = 0;
    let note;

    if (prefix === 32) {
        // A single address — a host route, not a subnet.
        firstHost = intToIp(networkInt);
        lastHost = intToIp(networkInt);
        usableHosts = 1;
        note = "/32 is a single host route — no network or broadcast address exists.";
    } else if (prefix === 31) {
        // RFC 3021: both addresses are usable on a point-to-point link.
        firstHost = intToIp(networkInt);
        lastHost = intToIp(broadcastInt);
        usableHosts = 2;
        note = "/31 point-to-point link (RFC 3021) — both addresses are usable, no broadcast.";
    } else {
        firstHost = intToIp(networkInt + 1);
        lastHost = intToIp(broadcastInt - 1);
        usableHosts = total - 2;
        if (prefix === 30) note = "/30 is the classic point-to-point subnet — 2 usable addresses.";
        if (prefix === 0) note = "/0 covers the entire IPv4 address space — this is a default route.";
    }

    return {
        address: ip,
        prefix,
        mask: prefixToMask(prefix),
        wildcard: prefixToWildcard(prefix),
        network: intToIp(networkInt),
        broadcast: prefix >= 31 ? "—" : intToIp(broadcastInt),
        firstHost,
        lastHost,
        totalAddresses: total,
        usableHosts,
        cidr: `${intToIp(networkInt)}/${prefix}`,
        range: `${intToIp(networkInt)} – ${intToIp(broadcastInt)}`,
        class: ipClass(ip),
        scope: classifyIp(ip),
        note,
    };
}

/**
 * Smallest prefix that can host `hosts` usable addresses.
 * @param {number} hosts
 * @returns {number} prefix length
 */
export function prefixForHosts(hosts) {
    const n = Number(hosts);
    if (!Number.isInteger(n) || n < 1) {
        throw new IpError(`host count must be a positive integer, got: ${hosts}`);
    }
    if (n > 2 ** 32 - 2) throw new IpError(`${n} hosts exceeds the IPv4 address space`);

    // /31 and /32 don't reserve network+broadcast, so they're checked first.
    if (n === 1) return 32;
    if (n === 2) return 31;

    for (let prefix = 30; prefix >= 0; prefix--) {
        if (2 ** (32 - prefix) - 2 >= n) return prefix;
    }
    throw new IpError(`cannot fit ${n} hosts in IPv4`);
}

/* ------------------------------------------------------------------
   VLSM
   ------------------------------------------------------------------ */

/** @typedef {Object} VlsmBlock
 *  @property {number} requested
 *  @property {number} prefix
 *  @property {string} network
 *  @property {string} mask
 *  @property {string} firstHost
 *  @property {string} lastHost
 *  @property {string} broadcast
 *  @property {number} usableHosts
 *  @property {number} wasted
 *  @property {number} order      original position in the request list
 */

/**
 * Allocates variable-length blocks largest-first inside a parent network.
 * Largest-first is not a stylistic choice — allocating a small block at
 * the front of the range fragments the space so the next large block
 * can't fit contiguously.
 *
 * @param {string} parentCidr e.g. '192.168.1.0/24'
 * @param {number[]} hostCounts
 * @returns {{parent: SubnetInfo, blocks: VlsmBlock[], remaining: {addresses: number, from: string|null, to: string|null}}}
 */
export function vlsm(parentCidr, hostCounts) {
    if (!Array.isArray(hostCounts) || hostCounts.length === 0) {
        throw new IpError("vlsm needs at least one host count");
    }

    const parent = subnet(parentCidr);
    const parentStart = ipToInt(parent.network);
    const parentEnd = ipToInt(parent.range.split(" – ")[1]);

    // Keep the original index so the output can be reported in request
    // order while still being *allocated* largest-first.
    const requests = hostCounts.map((hosts, order) => {
        const n = Number(hosts);
        if (!Number.isInteger(n) || n < 1) {
            throw new IpError(`invalid host count: ${hosts}`);
        }
        return { hosts: n, order, prefix: prefixForHosts(n) };
    });

    const sorted = [...requests].sort((a, b) => b.hosts - a.hosts);

    let cursor = parentStart;
    const blocks = [];

    for (const req of sorted) {
        const size = 2 ** (32 - req.prefix);

        // Subnets must start on a boundary that is a multiple of their size.
        const aligned = Math.ceil(cursor / size) * size;
        if (aligned + size - 1 > parentEnd) {
            throw new IpError(
                `cannot fit ${req.hosts} hosts (/${req.prefix}, ${size} addresses) inside ${parent.cidr} — ` +
                `${Math.max(0, parentEnd - cursor + 1)} addresses remain, ${size} needed`
            );
        }

        const blockInfo = subnet(`${intToIp(aligned)}/${req.prefix}`);
        blocks.push({
            requested: req.hosts,
            prefix: req.prefix,
            network: blockInfo.network,
            mask: blockInfo.mask,
            firstHost: blockInfo.firstHost,
            lastHost: blockInfo.lastHost,
            broadcast: blockInfo.broadcast,
            usableHosts: blockInfo.usableHosts,
            wasted: blockInfo.usableHosts - req.hosts,
            order: req.order,
        });

        cursor = aligned + size;
    }

    return {
        parent,
        blocks,
        remaining: {
            addresses: Math.max(0, parentEnd - cursor + 1),
            from: cursor <= parentEnd ? intToIp(cursor) : null,
            to: cursor <= parentEnd ? intToIp(parentEnd) : null,
        },
    };
}

/* ------------------------------------------------------------------
   Route summarization
   ------------------------------------------------------------------ */

/**
 * Longest common prefix across the given networks — the supernet that
 * covers all of them.
 *
 * `exact` reports whether the summary covers *only* the given networks
 * or pulls in extra address space, which is the part that matters when
 * you're about to advertise it.
 *
 * @param {string[]} cidrs
 * @returns {{summary: string, prefix: number, mask: string, wildcard: string, exact: boolean, covered: number, requested: number, inputs: SubnetInfo[]}}
 */
export function summarize(cidrs) {
    if (!Array.isArray(cidrs) || cidrs.length === 0) {
        throw new IpError("summarize needs at least one network");
    }

    const inputs = cidrs.map((c) => subnet(c.includes("/") ? c : `${c}/24`));
    const networkInts = inputs.map((i) => ipToInt(i.network));

    // Common prefix = leading bits identical across every network address.
    let commonPrefix = 32;
    for (let bit = 31; bit >= 0; bit--) {
        const reference = (networkInts[0] >>> bit) & 1;
        const allMatch = networkInts.every((n) => ((n >>> bit) & 1) === reference);
        if (!allMatch) {
            commonPrefix = 31 - bit;
            break;
        }
        if (bit === 0) commonPrefix = 32;
    }

    // The summary can never be more specific than its most general member.
    const shortestMember = Math.min(...inputs.map((i) => i.prefix));
    const prefix = Math.min(commonPrefix, shortestMember);

    const summaryNet = intToIp((networkInts[0] & maskInt(prefix)) >>> 0);
    const covered = 2 ** (32 - prefix);
    const requested = inputs.reduce((sum, i) => sum + 2 ** (32 - i.prefix), 0);

    return {
        summary: `${summaryNet}/${prefix}`,
        prefix,
        mask: prefixToMask(prefix),
        wildcard: prefixToWildcard(prefix),
        exact: covered === requested,
        covered,
        requested,
        inputs,
    };
}

/* ------------------------------------------------------------------
   Helpers used by the terminal and quiz
   ------------------------------------------------------------------ */

/**
 * Is `ip` inside `cidr`?
 * @param {string} ip @param {string} cidr
 */
export function contains(cidr, ip) {
    const { ip: base, prefix } = parseCidr(cidr);
    const mask = maskInt(prefix);
    return ((ipToInt(ip) & mask) >>> 0) === ((ipToInt(base) & mask) >>> 0);
}

/** Number → dotted quad, binary, and hex in one call — backs `binary`. */
export function describeNumber(input) {
    const raw = String(input).trim();

    if (raw.includes(".")) {
        const int = ipToInt(raw);
        return { dotted: intToIp(int), int, binary: intToBinary(int), hex: intToHex(int) };
    }

    let int;
    if (/^0x[0-9a-f]+$/i.test(raw)) int = parseInt(raw, 16);
    else if (/^0b[01]+$/i.test(raw)) int = parseInt(raw.slice(2), 2);
    else if (/^[01]{32}$/.test(raw)) int = parseInt(raw, 2);
    else if (/^\d+$/.test(raw)) int = Number(raw);
    else throw new IpError(`can't interpret "${input}" as an address or number`);

    if (int < 0 || int > 0xffffffff) {
        throw new IpError(`${int} is outside the 32-bit range`);
    }
    return { dotted: intToIp(int), int, binary: intToBinary(int), hex: intToHex(int) };
}
