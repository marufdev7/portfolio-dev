// Project content is shared by the project grid, case-study pages, terminal,
// and virtual filesystem. Keep each project accurate and source-backed here.

/** @typedef {Object} Project
 *  @property {string}   slug
 *  @property {string}   title
 *  @property {string}   tagline
 *  @property {string[]} stack
 *  @property {string}   liveLink
 *  @property {string}   githubLink
 *  @property {string}   [apiLink]
 *  @property {string}   [serverGithubLink]
 *  @property {boolean}  featured
 *  @property {string}   cover
 *  @property {string[]} screenshots
 *  @property {string[]} highlights
 *  @property {string[]} [facts]
 *  @property {string}   [year]
 *  @property {{problem:string, solution:string, tech:string, challenges:string, result:string}} caseStudy
 */

/** @type {Project[]} */
export const projects = [
    {
        slug: "kaira-fashion",
        title: "Kaira Fashion",
        tagline:
            "A responsive fashion storefront covering discovery, product browsing, cart, wishlist, and checkout.",
        stack: [
            "JavaScript",
            "React",
            "React Router",
            "TanStack Query",
            "Zustand",
            "Axios",
            "Tailwind CSS",
            "Framer Motion",
            "React Hook Form",
            "Swiper",
            "Vite",
        ],
        liveLink: "https://kaira-fashion-bd.netlify.app",
        githubLink: "https://github.com/marufdev7/kaira-fashion",
        featured: false,
        year: "2026",
        cover: "",
        screenshots: [],
        highlights: [
            "Product catalogue with filters, search, and detailed product views",
            "Persistent cart and wishlist flows managed with Zustand",
            "Validated checkout experience built with React Hook Form",
            "Responsive sliders and page transitions using Swiper and Framer Motion",
        ],
        facts: [
            "9 core customer routes plus branded not-found handling",
            "React 19 storefront built as a reusable component system",
        ],
        caseStudy: {
            problem:
                "A fashion storefront has to keep a large amount of product content easy to scan while still supporting the complete shopping journey. The project needed to connect discovery, product details, saved items, cart management, and checkout in one responsive experience.",
            solution:
                "I built a routed React storefront with a billboard, category browsing, product carousels, collection sections, a searchable shop, product galleries, a wishlist, a cart page and drawer, checkout, blog pages, and contact content. The layouts adapt across mobile, tablet, and desktop.",
            tech:
                "React 19 and React Router provide the application and route structure. TanStack Query and Axios handle the data layer, Zustand owns cart and wishlist state, and React Hook Form validates checkout input. Tailwind CSS v4, Framer Motion, and Swiper provide the responsive visual system and interactions, with Vite and Oxlint supporting development.",
            challenges:
                "The main engineering focus was keeping product, cart, wishlist, search, and checkout state consistent across separate routes and overlay interfaces. Shared product and layout components keep those experiences aligned while Zustand gives cart actions a single source of truth.",
            result:
                "The deployed application presents a complete front-end commerce flow rather than a single landing page. Visitors can browse and filter products, inspect details, save favorites, manage a cart, and complete a validated checkout journey.",
        },
    },
    {
        slug: "ultras-fashion",
        title: "Ultras Fashion",
        tagline:
            "A modern clothing storefront rebuilt as an accessible, data-layered React single-page application.",
        stack: [
            "JavaScript",
            "React",
            "React Router",
            "TanStack Query",
            "Zustand",
            "Axios",
            "Tailwind CSS",
            "Framer Motion",
            "Embla Carousel",
            "Vite",
        ],
        liveLink: "https://ultras-fashion.netlify.app",
        githubLink: "https://github.com/marufdev7/ultras-client",
        featured: true,
        year: "2026",
        cover: "",
        screenshots: [],
        highlights: [
            "Catalogue filters, sorting, price range controls, and pagination",
            "Product quick view, gallery, size and color selection, and related items",
            "Persisted cart and wishlist with focused modal and drawer interactions",
            "Mock-or-API service layer that can switch data sources without changing components",
        ],
        facts: [
            "Component-to-hook-to-service data flow keeps UI code independent of the data source",
            "Route-level lazy loading and reduced-motion-aware animation",
        ],
        caseStudy: {
            problem:
                "The original storefront concept was a static HTML and jQuery template. Turning it into a maintainable application meant replacing page scripts with reusable React components, real routing, durable client state, and a data layer that could work before a backend was available.",
            solution:
                "I rebuilt the experience as a single-page storefront with catalogue browsing, product details, cart, checkout, wishlist, search, blog, authentication, and marketing pages. Filtering, sorting, pagination, quick view, product variants, and responsive carousels make the catalogue practical to explore.",
            tech:
                "React 19, React Router, Tailwind CSS v4, Framer Motion, and Embla Carousel power the interface. TanStack Query handles server state while Zustand persists cart and wishlist state. A service layer selects mock JSON or Axios through one environment flag, so components only depend on query hooks.",
            challenges:
                "The key architecture decision was separating components from their data source. Keeping the flow component to hook to service means the deployed mock catalogue can be replaced by a live API without rewriting product pages. Focus traps, live regions, explicit image sizing, lazy routes, and reduced-motion support cover the interaction and accessibility edge cases.",
            result:
                "Ultras now works as a complete, deployable React storefront with a clean path from local mock data to a production API. The application includes loading skeletons, persistent shopping state, keyboard-aware overlays, and responsive product workflows across its routes.",
        },
    },
    {
        slug: "seabound-travel",
        title: "Seabound Travel",
        tagline:
            "A TypeScript travel platform for discovering destinations, comparing tours, and requesting a booking.",
        stack: [
            "TypeScript",
            "React",
            "React Router",
            "Axios",
            "Tailwind CSS",
            "Framer Motion",
            "Vitest",
            "Playwright",
            "Vite",
        ],
        liveLink: "https://seabound-travel.netlify.app",
        githubLink: "https://github.com/marufdev7/seabound-travel",
        featured: true,
        year: "2026",
        cover: "",
        screenshots: [],
        highlights: [
            "Searchable destinations and budget-filtered small-group tours",
            "Detailed itineraries, galleries, maps, journal content, and booking forms",
            "Protected community area with persistent member sessions and story publishing",
            "Unit, component, and end-to-end coverage with Vitest and Playwright",
        ],
        facts: [
            "15 routed experiences including protected community and booking flows",
            "Typed Axios service layer with mock and real API modes",
        ],
        caseStudy: {
            problem:
                "Travel planning content is broad: destinations, tours, itineraries, maps, stories, bookings, and member features all need different information structures. The goal was to make those paths feel connected without turning the site into a collection of unrelated pages.",
            solution:
                "I built a typed React application where visitors can search destinations, filter tours by style and budget, inspect itineraries and maps, browse a gallery and journal, contact a travel designer, and submit booking requests. Authentication protects a community area for member offers, updates, and traveler stories.",
            tech:
                "The application uses TypeScript, React 18, React Router, Axios, Tailwind CSS, Framer Motion, and React Helmet Async. Axios Mock Adapter provides local API behavior for destinations, tours, journal posts, inquiries, bookings, and checkout handoff. Vitest, React Testing Library, and Playwright cover the main application paths.",
            challenges:
                "The central challenge was keeping a content-heavy route tree consistent while supporting filters, protected navigation, form validation, maps, a keyboard-accessible lightbox, and image processing for community posts. Shared UI primitives and typed data models keep those flows predictable.",
            result:
                "The deployed site supports the full discovery-to-enquiry journey and can run without a backend in demo mode. Its service boundary is also ready to point at real destination, tour, booking, inquiry, and payment endpoints through environment configuration.",
        },
    },
    {
        slug: "furni-nest",
        title: "Furni",
        tagline:
            "A premium furniture storefront with catalogue discovery, persistent shopping flows, and editorial content.",
        stack: [
            "JavaScript",
            "React",
            "React Router",
            "Axios",
            "Tailwind CSS",
            "Framer Motion",
            "React Helmet",
            "Vite",
        ],
        liveLink: "https://furni-nest.netlify.app",
        githubLink: "https://github.com/marufdev7/furni-client",
        featured: true,
        year: "2026",
        cover: "",
        screenshots: [],
        highlights: [
            "Searchable catalogue with category, price, and sort controls",
            "Detailed product pages with materials, dimensions, lead time, and product stories",
            "Persistent cart and wishlist with drawer, quantity, checkout, and confirmation flows",
            "Accounts, journal content, testimonials, contact forms, and route-specific SEO",
        ],
        facts: [
            "59 user-facing capabilities documented in the project repository",
            "12 core routes plus dynamic product and journal detail pages",
        ],
        caseStudy: {
            problem:
                "A furniture brand needs more than a visual catalogue. Visitors need to compare products, understand materials and dimensions, save items, manage a cart, and move through checkout without losing the premium editorial character of the brand.",
            solution:
                "I built a responsive React storefront with product search, category and price filters, sorting, detailed product routes, persistent cart and wishlist state, checkout and confirmation, local member accounts, journal stories, testimonials, services, company content, and a complete contact experience.",
            tech:
                "React 19 and React Router provide the component and route architecture. Axios supports the local content layer, Tailwind CSS v3 defines the responsive design system, and Framer Motion handles page and component transitions with reduced-motion support. React Helmet Async supplies contextual titles, descriptions, canonical URLs, and social metadata, while Vite and Oxlint support development and production builds.",
            challenges:
                "The central engineering focus was making a broad client-side commerce demo behave like one coherent product. Persistent cart, wishlist, account, and checkout state must remain synchronized across the navbar, drawers, product pages, account views, and order confirmation while loading, empty, validation, and reduced-motion states remain clear.",
            result:
                "The deployed Furni experience covers product discovery through simulated order completion while also supporting the editorial and trust-building pages expected from a furniture brand. Its reusable layout, product, cart, testimonial, and SEO components support the full route set consistently.",
        },
    },
    {
        slug: "pro-fast",
        title: "Pro Fast",
        tagline:
            "A full-stack parcel management platform for booking, payment, tracking, and role-based delivery operations.",
        stack: [
            "JavaScript",
            "React",
            "TanStack Query",
            "Axios",
            "Firebase",
            "Node.js",
            "Express.js",
            "MongoDB",
            "Stripe",
            "JWT",
            "React Leaflet",
            "Recharts",
            "Tailwind CSS",
            "DaisyUI",
        ],
        liveLink: "https://pro-fast-d3ffb.web.app",
        githubLink: "https://github.com/marufdev7/pro-fast-client",
        apiLink: "https://pro-fast-server-ten.vercel.app",
        serverGithubLink: "https://github.com/marufdev7/pro-fast-server",
        featured: true,
        year: "2026",
        cover: "",
        screenshots: [],
        highlights: [
            "Separate user, rider, and admin dashboards with protected workflows",
            "Parcel booking, automated pricing, Stripe payment, and status tracking",
            "Firebase authentication with JWT-protected API access and role checks",
            "MongoDB-backed delivery operations, rider assignment, maps, and analytics",
        ],
        facts: [
            "3 role-specific dashboards backed by a separate Express API",
            "Client, server, authentication, database, and payment integrations deployed independently",
        ],
        caseStudy: {
            problem:
                "Parcel delivery is not one workflow. Customers book and pay, riders manage pickups and hand-offs, and administrators approve riders, assign work, and monitor the system. Each role needs different data and permissions while every parcel still moves through one shared lifecycle.",
            solution:
                "I built a full-stack platform with role-specific dashboards for users, riders, and admins. Users can book, pay for, and track parcels; riders manage assigned tasks and delivery stages; admins manage access, approve riders, assign deliveries, and review operational charts.",
            tech:
                "The React client uses TanStack Query, Axios, Firebase Authentication, React Hook Form, React Leaflet, Recharts, Tailwind CSS, and DaisyUI. The Node.js and Express API uses MongoDB, Firebase Admin, JWT authorization, and Stripe. The client is hosted on Firebase, with the API deployed separately on Vercel.",
            challenges:
                "The main engineering challenge was enforcing role and parcel-state rules across both the interface and API. Authentication establishes identity, JWT and server-side role checks protect operations, and TanStack Query keeps dashboard data synchronized after payments, approvals, assignments, and status changes.",
            result:
                "Pro Fast delivers an end-to-end parcel workflow across a deployed client and server. It connects authentication, protected dashboards, pricing, payments, geographic coverage, parcel tracking, delivery management, and analytics in one application.",
        },
    },
];

export const featuredProjects = projects.filter((project) => project.featured);

/** Every distinct stack tag, for the URL-synced filter on /projects. */
export const allStacks = [...new Set(projects.flatMap((project) => project.stack))].sort();

/** @param {string} slug */
export function getProject(slug) {
    return projects.find((project) => project.slug === slug) ?? null;
}
