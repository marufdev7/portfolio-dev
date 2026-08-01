// ---------------------------------------------------------------
// OSI model reference — drives `osi [layer]` and `quiz osi`.
// ---------------------------------------------------------------

/** @typedef {Object} OsiLayer
 *  @property {number} n
 *  @property {string} name
 *  @property {string} pdu
 *  @property {string} summary
 *  @property {string[]} protocols
 *  @property {string[]} devices
 *  @property {string} [troubleshoot]
 */

/** @type {OsiLayer[]} — 7 down to 1, the order engineers actually recite */
export const osiLayers = [
  {
    n: 7,
    name: "Application",
    pdu: "Data",
    summary: "What the user or program actually interacts with.",
    protocols: ["HTTP", "HTTPS", "DNS", "DHCP", "FTP", "SMTP", "IMAP", "SNMP", "SSH", "Telnet"],
    devices: ["Hosts", "Application firewalls", "Proxies"],
    troubleshoot: "Can you resolve the name and get a response body? curl before you blame the network.",
  },
  {
    n: 6,
    name: "Presentation",
    pdu: "Data",
    summary: "Encoding, serialisation, compression, and encryption format.",
    protocols: ["TLS", "SSL", "JPEG", "GIF", "ASCII", "UTF-8", "MIME"],
    devices: ["Hosts"],
    troubleshoot: "Certificate and cipher mismatches live here, even though TLS spans 5–6 in practice.",
  },
  {
    n: 5,
    name: "Session",
    pdu: "Data",
    summary: "Sets up, maintains, and tears down conversations between applications.",
    protocols: ["NetBIOS", "RPC", "SIP", "PPTP", "L2TP"],
    devices: ["Hosts"],
    troubleshoot: "Sessions dropping at a fixed interval usually means an idle timeout on a middlebox.",
  },
  {
    n: 4,
    name: "Transport",
    pdu: "Segment (TCP) / Datagram (UDP)",
    summary: "End-to-end delivery, ports, reliability, flow control, and segmentation.",
    protocols: ["TCP", "UDP", "SCTP"],
    devices: ["Firewalls", "Load balancers (L4)"],
    troubleshoot: "A connection that opens but stalls points at MSS/MTU. A refused connection points at a closed port or an ACL.",
  },
  {
    n: 3,
    name: "Network",
    pdu: "Packet",
    summary: "Logical addressing and path selection between networks.",
    protocols: ["IPv4", "IPv6", "ICMP", "OSPF", "EIGRP", "BGP", "IPsec"],
    devices: ["Routers", "Layer 3 switches"],
    troubleshoot: "ping and traceroute live here. Reachable one way but not back means a missing return route (lab 02).",
  },
  {
    n: 2,
    name: "Data Link",
    pdu: "Frame",
    summary: "Physical addressing within a single broadcast domain; framing and error detection.",
    protocols: ["Ethernet", "802.1Q", "PPP", "HDLC", "ARP", "STP", "CDP", "LLDP"],
    devices: ["Switches", "Bridges", "NICs", "Wireless APs"],
    troubleshoot: "VLAN and trunk problems are here. A native-VLAN mismatch is a layer 2 fault that looks like a layer 3 one (lab 01).",
  },
  {
    n: 1,
    name: "Physical",
    pdu: "Bit",
    summary: "Signalling, cabling, connectors, and voltage — the part you can trip over.",
    protocols: ["1000BASE-T", "RJ45", "SFP", "Fibre", "802.11 radio"],
    devices: ["Hubs", "Repeaters", "Cables", "Transceivers", "Patch panels"],
    troubleshoot: "Interface down/down is layer 1. Interface up/down is layer 2. That one distinction saves hours.",
  },
];

export const osiMnemonic = {
  topDown: "All People Seem To Need Data Processing",
  bottomUp: "Please Do Not Throw Sausage Pizza Away",
};

/** TCP/IP model mapping, since the CCNA asks both ways. */
export const tcpIpModel = [
  { name: "Application", osi: "7, 6, 5" },
  { name: "Transport", osi: "4" },
  { name: "Internet", osi: "3" },
  { name: "Network Access", osi: "2, 1" },
];

/** @param {number|string} n */
export function getLayer(n) {
  const num = Number(n);
  if (Number.isInteger(num)) return osiLayers.find((l) => l.n === num) ?? null;
  const needle = String(n).toLowerCase();
  return osiLayers.find((l) => l.name.toLowerCase().startsWith(needle)) ?? null;
}
