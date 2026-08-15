import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import { useTerminal } from "./hooks/useTerminal";

import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

/* The networking half is a separate chunk: a visitor who only reads
   the case studies never downloads the IOS topology or the quiz bank. */
const Network = lazy(() => import("./pages/Network"));
const NetworkTerminal = lazy(() => import("./pages/NetworkTerminal"));
const NetworkLabs = lazy(() => import("./pages/NetworkLabs"));
const NetworkNotes = lazy(() => import("./pages/NetworkNotes"));

/* The overlay carries the shell UI, so it is deferred until Ctrl+K is
   pressed for the first time. It stays mounted afterwards — unmounting
   it would take the exit animation with it. */
const TerminalOverlay = lazy(
  () => import("./components/terminal/TerminalOverlay"),
);

function RouteFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <p className="font-mono text-sm text-muted">loading…</p>
    </div>
  );
}

export default function App() {
  const { toggleOverlay, overlayOpen, closeOverlay } = useTerminal();
  const [overlayUsed, setOverlayUsed] = useState(false);

  useEffect(() => {
    if (overlayOpen) setOverlayUsed(true);
  }, [overlayOpen]);

  // Ctrl/Cmd+K from any route (§4). preventDefault stops the browser
  // from opening its own search bar.
  const onShortcut = useCallback(
    (event) => {
      event.preventDefault();
      toggleOverlay();
    },
    [toggleOverlay],
  );

  useKeyboardShortcut("k", onShortcut, { meta: true });
  useKeyboardShortcut("escape", closeOverlay, { enabled: overlayOpen });

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-80 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-bg"
      >
        Skip to content
      </a>

      <ScrollToTop />
      <Navbar />

      <main id="main">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/network" element={<Network />} />
            <Route path="/network/terminal" element={<NetworkTerminal />} />
            <Route path="/network/labs" element={<NetworkLabs />} />
            <Route path="/network/notes" element={<NetworkNotes />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {overlayUsed && (
        <Suspense fallback={null}>
          <TerminalOverlay />
        </Suspense>
      )}
    </>
  );
}
