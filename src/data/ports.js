// ---------------------------------------------------------------
// Well-known ports for the `port` command (bidirectional lookup)
// and the `quiz ports` bank.
// ---------------------------------------------------------------

/** @typedef {Object} PortEntry
 *  @property {number} port
 *  @property {'TCP'|'UDP'|'TCP/UDP'} proto
 *  @property {string} service
 *  @property {string} description
 */

/** @type {PortEntry[]} */
export const ports = [
  { port: 20, proto: "TCP", service: "FTP-DATA", description: "FTP data transfer channel" },
  { port: 21, proto: "TCP", service: "FTP", description: "FTP control channel" },
  { port: 22, proto: "TCP", service: "SSH", description: "Secure Shell — encrypted remote CLI" },
  { port: 23, proto: "TCP", service: "Telnet", description: "Unencrypted remote CLI — avoid" },
  { port: 25, proto: "TCP", service: "SMTP", description: "Mail submission between servers" },
  { port: 49, proto: "TCP", service: "TACACS+", description: "Cisco AAA server protocol" },
  { port: 53, proto: "TCP/UDP", service: "DNS", description: "Name resolution — UDP for queries, TCP for zone transfers" },
  { port: 67, proto: "UDP", service: "DHCP-SERVER", description: "DHCP server port (offers/acks)" },
  { port: 68, proto: "UDP", service: "DHCP-CLIENT", description: "DHCP client port (discover/request)" },
  { port: 69, proto: "UDP", service: "TFTP", description: "Trivial FTP — IOS image and config transfer" },
  { port: 80, proto: "TCP", service: "HTTP", description: "Unencrypted web traffic" },
  { port: 88, proto: "TCP/UDP", service: "Kerberos", description: "Network authentication" },
  { port: 110, proto: "TCP", service: "POP3", description: "Mail retrieval — download and delete" },
  { port: 111, proto: "TCP/UDP", service: "RPCbind", description: "ONC RPC portmapper" },
  { port: 119, proto: "TCP", service: "NNTP", description: "Usenet news transfer" },
  { port: 123, proto: "UDP", service: "NTP", description: "Time synchronisation" },
  { port: 135, proto: "TCP", service: "MS-RPC", description: "Microsoft RPC endpoint mapper" },
  { port: 137, proto: "UDP", service: "NetBIOS-NS", description: "NetBIOS name service" },
  { port: 138, proto: "UDP", service: "NetBIOS-DGM", description: "NetBIOS datagram service" },
  { port: 139, proto: "TCP", service: "NetBIOS-SSN", description: "NetBIOS session service" },
  { port: 143, proto: "TCP", service: "IMAP", description: "Mail retrieval — server-side folders" },
  { port: 161, proto: "UDP", service: "SNMP", description: "Device monitoring — get/set" },
  { port: 162, proto: "UDP", service: "SNMP-TRAP", description: "Unsolicited SNMP notifications" },
  { port: 179, proto: "TCP", service: "BGP", description: "Border Gateway Protocol peering" },
  { port: 389, proto: "TCP/UDP", service: "LDAP", description: "Directory services" },
  { port: 443, proto: "TCP", service: "HTTPS", description: "HTTP over TLS" },
  { port: 445, proto: "TCP", service: "SMB", description: "Windows file and printer sharing" },
  { port: 465, proto: "TCP", service: "SMTPS", description: "SMTP over implicit TLS" },
  { port: 500, proto: "UDP", service: "ISAKMP", description: "IPsec key exchange (IKE)" },
  { port: 514, proto: "UDP", service: "Syslog", description: "Remote logging — where the lab 01 fix came from" },
  { port: 520, proto: "UDP", service: "RIP", description: "Routing Information Protocol" },
  { port: 546, proto: "UDP", service: "DHCPv6-CLIENT", description: "DHCPv6 client" },
  { port: 547, proto: "UDP", service: "DHCPv6-SERVER", description: "DHCPv6 server" },
  { port: 587, proto: "TCP", service: "SMTP-SUBMISSION", description: "Authenticated mail submission with STARTTLS" },
  { port: 636, proto: "TCP", service: "LDAPS", description: "LDAP over TLS" },
  { port: 989, proto: "TCP", service: "FTPS-DATA", description: "FTP data over TLS" },
  { port: 990, proto: "TCP", service: "FTPS", description: "FTP control over TLS" },
  { port: 993, proto: "TCP", service: "IMAPS", description: "IMAP over TLS" },
  { port: 995, proto: "TCP", service: "POP3S", description: "POP3 over TLS" },
  { port: 1433, proto: "TCP", service: "MSSQL", description: "Microsoft SQL Server" },
  { port: 1521, proto: "TCP", service: "Oracle", description: "Oracle database listener" },
  { port: 1645, proto: "UDP", service: "RADIUS-legacy", description: "Legacy RADIUS authentication" },
  { port: 1701, proto: "UDP", service: "L2TP", description: "Layer 2 Tunneling Protocol" },
  { port: 1723, proto: "TCP", service: "PPTP", description: "Point-to-Point Tunneling Protocol" },
  { port: 1812, proto: "UDP", service: "RADIUS", description: "RADIUS authentication" },
  { port: 1813, proto: "UDP", service: "RADIUS-ACCT", description: "RADIUS accounting" },
  { port: 2049, proto: "TCP/UDP", service: "NFS", description: "Network File System" },
  { port: 3128, proto: "TCP", service: "Squid", description: "Common HTTP proxy port" },
  { port: 3306, proto: "TCP", service: "MySQL", description: "MySQL / MariaDB" },
  { port: 3389, proto: "TCP", service: "RDP", description: "Windows Remote Desktop" },
  { port: 4500, proto: "UDP", service: "IPsec-NAT-T", description: "IPsec NAT traversal" },
  { port: 5060, proto: "TCP/UDP", service: "SIP", description: "VoIP session signalling" },
  { port: 5061, proto: "TCP", service: "SIP-TLS", description: "SIP over TLS" },
  { port: 5432, proto: "TCP", service: "PostgreSQL", description: "PostgreSQL database" },
  { port: 5900, proto: "TCP", service: "VNC", description: "Remote framebuffer" },
  { port: 6379, proto: "TCP", service: "Redis", description: "Redis key-value store" },
  { port: 8080, proto: "TCP", service: "HTTP-ALT", description: "Alternate HTTP — dev servers, proxies" },
  { port: 8443, proto: "TCP", service: "HTTPS-ALT", description: "Alternate HTTPS" },
  { port: 9090, proto: "TCP", service: "Prometheus", description: "Prometheus metrics endpoint" },
  { port: 27017, proto: "TCP", service: "MongoDB", description: "MongoDB wire protocol" },
];

/**
 * Bidirectional lookup — accepts a port number or a service name.
 * @param {string|number} query
 * @returns {PortEntry[]}
 */
export function lookupPort(query) {
  const raw = String(query).trim();
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return ports.filter((p) => p.port === n);
  }
  const needle = raw.toLowerCase();
  const exact = ports.filter((p) => p.service.toLowerCase() === needle);
  if (exact.length) return exact;
  return ports.filter(
    (p) =>
      p.service.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle)
  );
}
