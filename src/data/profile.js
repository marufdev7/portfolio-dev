// ---------------------------------------------------------------
// Identity, bio, and navigation. Edit here — never in a component.
// ---------------------------------------------------------------

export const profile = {
    name: "Md. Maruf Ahmed",
    firstName: "Maruf",
    role: "Aspiring Network Engineer",
    /** The positioning line. Everything on the site should earn this. */
    positioning: "Network-focused, working toward a career in network automation.",
    tagline:
        "I completed my frontend foundation and am now focused on networking, CCNA labs, and network automation.",
    location: "Dhaka, Bangladesh", // TODO: confirm
    email: "maruf.ahmed.dev@gmail.com",
    github: "https://github.com/marufdev7",
    linkedin: "https://www.linkedin.com/in/marufdev7",
    resumeUrl: "/Maruf_Ahmed_CV.pdf",
    available: true,
    /** Terminal env — `whoami`, `neofetch`, and the prompt read these. */
    shell: {
        user: "maruf",
        host: "portfolio",
        codingSince: "2024-01-01",
    },
};

export const about = {
    intro:
        "I'm a network-focused developer building toward a career in network automation. I started development in 2024, completed my frontend foundation by the end of 2025, and began the CCNA track in April 2026.",
    currentFocus:
        "My current focus is networking: subnetting, switching, routing, services, troubleshooting, and practical CCNA labs. My long-term goal is to become a network automation engineer.",
    learning:
        "Next, I am connecting network fundamentals with code through Python, automation workflows, configuration validation, and repeatable infrastructure tasks.",
    workStyle:
        "I like clear requirements, honest feedback, and small iterations. I'd rather ship a solid feature this week than a perfect one never.",
    /** How the completed frontend foundation supports the networking direction. */
    whyBoth:
        "Frontend development gave me a strong foundation in applications, APIs, deployment, and debugging. Networking is now my main direction. I want to combine both sides to automate network tasks and build reliable tools for engineers.",
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
    { value: "5", label: "Shipped case studies" },
    { value: "5", label: "Documented labs" },
    { value: "CCNA", label: "In progress" },
];
