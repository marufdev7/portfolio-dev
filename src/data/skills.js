// ---------------------------------------------------------------
// Skills, labelled honestly. Three levels, no percentages, ever (§10).
//
//   confident   — I can build with this unsupervised and debug it
//   comfortable — I've used it on real work and can find my way
//   learning    — actively studying; don't put me on call for it yet
// ---------------------------------------------------------------

export const LEVELS = {
  confident: {
    label: "Confident",
    order: 0,
    meaning: "build with it unsupervised and debug it",
  },
  comfortable: {
    label: "Comfortable",
    order: 1,
    meaning: "used on real work, can find my way",
  },
  learning: {
    label: "Learning",
    order: 2,
    meaning: "actively studying — don't put me on call for it",
  },
};

/** @typedef {Object} Skill
 *  @property {string} name
 *  @property {'confident'|'comfortable'|'learning'} level
 *  @property {string} [note]
 */

/** Development side — cyan surfaces. */
export const devSkills = [
  {
    group: "Core",
    items: [
      { name: "HTML", level: "confident" },
      { name: "CSS", level: "confident" },
      { name: "JavaScript (ES2022+)", level: "confident" },
      { name: "Accessibility (WCAG AA)", level: "comfortable", note: "keyboard + SR testing by hand" },
    ],
  },
  {
    group: "Frameworks",
    items: [
      { name: "React 18", level: "confident" },
      { name: "React Router", level: "confident" },
      { name: "Tailwind CSS", level: "confident" },
      { name: "React Query", level: "comfortable" },
      { name: "TypeScript", level: "learning" },
    ],
  },
  {
    group: "Backend & data",
    items: [
      { name: "Node.js", level: "comfortable" },
      { name: "Express", level: "comfortable" },
      { name: "REST API design", level: "comfortable" },
      { name: "MongoDB", level: "comfortable" },
    ],
  },
  {
    group: "Tooling",
    items: [
      { name: "Vite", level: "confident" },
      { name: "Git & GitHub", level: "confident" },
      { name: "Vitest", level: "comfortable" },
      { name: "Chrome DevTools / Lighthouse", level: "comfortable" },
      { name: "Figma", level: "comfortable" },
    ],
  },
];

/** Networking side — green surfaces. Every entry maps to a lab in labs.js (§11). */
export const netSkills = [
  {
    group: "Addressing",
    items: [
      { name: "IPv4 subnetting", level: "confident", note: "VLSM by hand, no calculator" },
      { name: "Route summarization", level: "comfortable" },
      { name: "IPv6 addressing", level: "learning" },
    ],
  },
  {
    group: "Switching",
    items: [
      { name: "VLANs & 802.1Q trunking", level: "comfortable", note: "lab 01" },
      { name: "Inter-VLAN routing", level: "comfortable", note: "router-on-a-stick" },
      { name: "STP / RSTP", level: "learning" },
      { name: "EtherChannel", level: "learning" },
    ],
  },
  {
    group: "Routing",
    items: [
      { name: "Static & default routing", level: "comfortable", note: "lab 02" },
      { name: "OSPF single-area", level: "comfortable", note: "lab 03" },
      { name: "OSPF multi-area", level: "learning" },
      { name: "EIGRP", level: "learning" },
    ],
  },
  {
    group: "Services & security",
    items: [
      { name: "Standard & extended ACLs", level: "comfortable", note: "lab 04" },
      { name: "NAT / PAT", level: "comfortable", note: "lab 05" },
      { name: "DHCP & DNS operation", level: "comfortable" },
      { name: "Device hardening / SSH", level: "learning" },
    ],
  },
  {
    group: "Tools",
    items: [
      { name: "Cisco IOS CLI", level: "comfortable" },
      { name: "Cisco Packet Tracer", level: "confident" },
      { name: "Wireshark", level: "learning" },
    ],
  },
];

/** Flat list for the terminal's `skills` command. */
export function flatSkills(side) {
  const groups = side === "net" ? netSkills : devSkills;
  return groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));
}
