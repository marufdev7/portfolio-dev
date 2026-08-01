// ---------------------------------------------------------------
// Two timelines: the development journey, and the CCNA track.
// `status: 'current'` pulses green on /network — exactly one entry
// should carry it.
// ---------------------------------------------------------------

/** @typedef {Object} Milestone
 *  @property {string} period
 *  @property {string} title
 *  @property {string} detail
 *  @property {'done'|'current'|'planned'} status
 */

/** @type {Milestone[]} — newest first */
export const journey = [
  {
    period: "2025 — Present",
    title: "Freelance frontend developer",
    detail:
      "Building React applications for small clients — landing pages through to full dashboards, usually solo from design handoff to deploy.",
    status: "current",
  },
  {
    period: "2024",
    title: "Moved to component-driven development",
    detail:
      "Left static sites behind for React, Tailwind, and REST APIs. This is where the three case studies on this site come from.",
    status: "done",
  },
  {
    period: "2023",
    title: "Started web development",
    detail:
      "HTML, CSS, and JavaScript fundamentals. Shipped my first sites and got hooked on the craft.",
    status: "done",
  },
];

/** CCNA track — oldest first, so it reads as forward progress. */
export const ccnaTimeline = [
  {
    period: "Jun 2026",
    title: "Network fundamentals",
    detail:
      "OSI and TCP/IP models, cabling, Ethernet framing, and IPv4 addressing. Built the first Packet Tracer topology.",
    status: "done",
  },
  {
    period: "Jul 2026",
    title: "Subnetting until it was instant",
    detail:
      "VLSM by hand, route summarization, wildcard masks. The `subnet` and `vlsm` terminal commands on this site are the same math, written out.",
    status: "done",
  },
  {
    period: "Aug 2026",
    title: "Switching — VLANs, trunking, inter-VLAN routing",
    detail:
      "Labs 01 and 02. Router-on-a-stick with three VLANs, and the native-VLAN mismatch that cost me an evening.",
    status: "current",
  },
  {
    period: "Sep 2026",
    title: "Routing — OSPF, static, default",
    detail: "Labs 03 onward. Single-area OSPF between R1 and R2, then default-information originate.",
    status: "planned",
  },
  {
    period: "Oct 2026",
    title: "Security & services — ACLs, NAT, DHCP",
    detail: "Labs 04 and 05, plus device hardening.",
    status: "planned",
  },
  {
    period: "Target: late 2026",
    title: "CCNA 200-301 exam",
    detail: "Sitting the exam once the lab log covers every blueprint section I'd be asked about.",
    status: "planned",
  },
];

/** The honest one-liner reused on /network and by the `ccna` command. */
export const ccnaStatus = {
  headline: "CCNA 200-301 — in progress",
  detail:
    "Not certified yet. Roughly a three-month target from August 2026. Everything below is something I actually built or configured, not something I read about.",
  progressNote: "Currently on the switching and routing sections.",
};
