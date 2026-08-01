// ---------------------------------------------------------------
// All project content. The grid, the case-study route, the terminal's
// `projects` / `open project <slug>` commands, and the VFS all read
// from here. Zero hardcoded project JSX anywhere (plan §5).
// ---------------------------------------------------------------

/** @typedef {Object} Project
 *  @property {string}   slug
 *  @property {string}   title
 *  @property {string}   tagline        one line
 *  @property {string[]} stack
 *  @property {string}   liveLink
 *  @property {string}   githubLink
 *  @property {boolean}  featured
 *  @property {string}   cover
 *  @property {string[]} screenshots    consistent viewport, same order everywhere
 *  @property {string[]} highlights     3–4 bullets
 *  @property {string[]} [metrics]      concrete before/after numbers (§5.3)
 *  @property {string}   [year]
 *  @property {{problem:string, solution:string, tech:string, challenges:string, result:string}} caseStudy
 */

/** @type {Project[]} */
export const projects = [
  {
    slug: "taskflow",
    title: "TaskFlow",
    tagline: "A kanban board that works offline and never traps your keyboard.",
    stack: ["React", "Tailwind CSS", "Zustand", "Vite", "Vitest"],
    liveLink: "https://example.com", // TODO
    githubLink: "https://github.com/your-username/taskflow", // TODO
    featured: true,
    year: "2025",
    cover: "",
    screenshots: [],
    highlights: [
      "Drag-and-drop that is fully operable from the keyboard",
      "Offline-first — state survives a refresh with no backend",
      "Under 60KB gzipped JavaScript",
      "38 Vitest cases covering the board reducer",
    ],
    metrics: [
      "Initial bundle 340KB → 118KB after code-splitting the board view",
      "Board re-renders on drag cut from ~40 to 6 with selector-scoped Zustand subscriptions",
    ],
    caseStudy: {
      problem:
        "Every kanban app I tried failed one of two tests: it broke on a flaky connection, or it was unusable without a mouse. I wanted one that passed both, which meant treating offline and keyboard support as requirements rather than polish.",
      solution:
        "A board where state lives locally first and syncs opportunistically. Cards move with arrow keys under a roving-tabindex model, and every drag interaction has a keyboard equivalent that announces the result through a live region — so the pointer path and the keyboard path produce identical outcomes.",
      tech:
        "React 18 with Zustand for state, chosen over Context because selector-scoped subscriptions were the fix for the re-render problem. Tailwind for styling, Vite for the build, Vitest for the reducer suite. Persistence is a debounced localStorage write behind a versioned schema so old saved boards still load after a shape change.",
      challenges:
        "The drag-and-drop library I started with rebuilt the entire board on every pointer move — 40+ component renders per drag. I replaced it with a small custom hook that tracks only the dragged card and the hovered column, and moved board state into per-column selectors. The second problem was optimistic reordering: a fast drag could land two moves out of order, so reorders are now applied against a monotonic version counter and stale ones are dropped.",
      result:
        "The board holds 60fps while dragging on a mid-range Android phone, works with the network off, and passes an axe audit with zero violations. The reducer tests caught three ordering bugs before they shipped, which is the argument I make for writing them.",
    },
  },
  {
    slug: "shoplens",
    title: "ShopLens",
    tagline: "A storefront that stays fast when the product catalogue doesn't.",
    stack: ["React", "React Router", "React Query", "Node.js", "MongoDB"],
    liveLink: "https://example.com", // TODO
    githubLink: "https://github.com/your-username/shoplens", // TODO
    featured: true,
    year: "2025",
    cover: "",
    screenshots: [],
    highlights: [
      "Server-side pagination and search across 5k products",
      "JWT auth with protected routes and silent refresh",
      "Responsive product grid with zero layout shift",
      "React Query caching removed 70% of repeat requests",
    ],
    metrics: [
      "Repeat category navigation: 480ms → 0ms served from cache",
      "Cumulative Layout Shift 0.24 → 0.00 by reserving image aspect boxes",
    ],
    caseStudy: {
      problem:
        "The first version fetched the full product list on every category click. With 5,000 products that meant a visible spinner on each navigation and a Lighthouse performance score in the sixties.",
      solution:
        "Moved filtering and pagination to the API, then layered React Query over it so a category the visitor already viewed renders instantly from cache while revalidating in the background. Product images reserve their aspect ratio before loading, which is what actually fixed the layout shift.",
      tech:
        "React with React Router v6 for the route tree, React Query for the server-state cache, and an Express + MongoDB API with a compound index on category and price. Auth is a short-lived JWT with a refresh call on 401, held in memory rather than localStorage so an XSS bug can't walk away with it.",
      challenges:
        "Cart state was the hard part. It has to survive a refresh, merge sensibly when a guest logs in, and never silently drop an item. I settled on a guest cart in localStorage that merges server-side on login, with quantity conflicts resolved to the larger value and a visible summary of what changed — guessing quietly was worse than telling the user.",
      result:
        "Lighthouse performance went from 64 to 96, and the spinner on category navigation is gone entirely for cached views. The engineering upgrade I'd point a reviewer at is the React Query layer — it's a small diff with the largest measurable effect in the project.",
    },
  },
  {
    slug: "weatherscope",
    title: "WeatherScope",
    tagline: "A weather dashboard that respects an API rate limit.",
    stack: ["JavaScript", "Vite", "OpenWeather API"],
    liveLink: "https://example.com", // TODO
    githubLink: "https://github.com/your-username/weatherscope", // TODO
    featured: false,
    year: "2024",
    cover: "",
    screenshots: [],
    highlights: [
      "Debounced geocoding search with request cancellation",
      "Local caching cuts API calls by roughly 80%",
      "Works as a single 24KB bundle with no framework",
    ],
    metrics: ["API calls per session 45 → 9 with a 10-minute TTL cache"],
    caseStudy: {
      problem:
        "A free weather API allows 60 calls a minute. My first build fired one request per keystroke and hit that ceiling during ordinary typing, which returned errors to the user for no good reason.",
      solution:
        "A 300ms debounce on the search input, AbortController cancellation of superseded requests, and a keyed cache with a 10-minute TTL — weather does not change fast enough to justify refetching it more often.",
      tech:
        "Plain JavaScript modules with Vite, deliberately no framework — it's a small app and I wanted to see what the DOM work actually costs. The cache is a Map serialised into sessionStorage on unload.",
      challenges:
        "Cancellation exposed a race I hadn't seen: an aborted fetch still rejected, and the rejection handler cleared the loading state that a newer in-flight request had just set. Now each request carries a sequence number and only the newest one is allowed to write state.",
      result:
        "Rate-limit errors went to zero and typical sessions make 9 calls instead of 45. This is the oldest project here and the one I'd rewrite first — but the caching decision still holds up.",
    },
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

/** Every distinct stack tag, for the URL-synced filter on /projects. */
export const allStacks = [...new Set(projects.flatMap((p) => p.stack))].sort();

/** @param {string} slug */
export function getProject(slug) {
  return projects.find((p) => p.slug === slug) ?? null;
}
