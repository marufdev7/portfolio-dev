// ---------------------------------------------------------------
// Identity, bio, and navigation. Edit here — never in a component.
// ---------------------------------------------------------------

export const profile = {
  name: "Md. Maruf Ahmed",
  firstName: "Maruf",
  role: "Frontend Developer",
  /** The positioning line. Everything on the site should earn this. */
  positioning: "Aspiring network engineer, built on a frontend foundation.",
  tagline:
    "I build fast, accessible React interfaces — and I understand the network they travel over.",
  location: "Dhaka, Bangladesh", // TODO: confirm
  email: "maruf.ahmed.dev@gmail.com",
  github: "https://github.com/marufdev7",
  linkedin: "https://www.linkedin.com/in/marufdev7",
  resumeUrl: "/resume.pdf", // TODO: drop the real PDF into /public
  available: true,
  /** Terminal env — `whoami`, `neofetch`, and the prompt read these. */
  shell: {
    user: "maruf",
    host: "portfolio",
    codingSince: "2023-01-01",
  },
};

export const about = {
  intro:
    "I'm a frontend developer who cares about the details — the load time, the tab order, the way a layout holds up on a cheap phone. I started building websites out of curiosity and stayed because shipping something real never stopped being satisfying.",
  currentFocus:
    "React and the modern JavaScript ecosystem — building projects end to end, from UI to deployment. Alongside that I'm working through the CCNA, which is where the second half of this site comes from.",
  learning:
    "Right now: subnetting until it's instant, OSPF beyond single-area, and enough Node.js to be dangerous on the backend.",
  workStyle:
    "I like clear requirements, honest feedback, and small iterations. I'd rather ship a solid feature this week than a perfect one never.",
  /** Why a frontend portfolio has a networking half — asked in every interview, answered once here. */
  whyBoth:
    "Most frontend bugs I've chased ended up being something other than the component — a cache header, a DNS answer, a request that never left the tab. Learning the network made me a better debugger, so I stopped treating it as a side interest and started documenting it.",
};

export const navLinks = [
  // `end` keeps "/" from matching every route — without it react-router
  // marks Home active on every page, since all paths start with "/".
  { label: "Home", to: "/", end: true },
  { label: "Projects", to: "/projects" },
  { label: "Network", to: "/network" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/** Home-page snapshot strip. Honest, checkable numbers only — no vanity stats. */
export const snapshot = [
  { value: "3", label: "Shipped case studies" },
  { value: "5", label: "Documented labs" },
  { value: "CCNA", label: "In progress" },
];
