import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, TerminalSquare, X } from "lucide-react";
import { navLinks, profile } from "../../data/profile";
import { useTerminal } from "../../hooks/useTerminal";
import ThemeToggle from "./ThemeToggle";

/* ---------------------------------------------------------------
   Navigation. The terminal button is deliberately in the nav rather
   than hidden behind the shortcut: Ctrl+K is for people who already
   know, the button is for everyone else.
   --------------------------------------------------------------- */

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { openOverlay } = useTerminal();

  // Route change closes the mobile sheet — otherwise it stays open
  // over the page the user just navigated to.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = ({ isActive }) =>
    "rounded px-1 py-1 text-sm transition-colors " +
    (isActive ? "text-accent" : "text-muted hover:text-text");

  return (
    <header
      className={
        "sticky top-0 z-50 border-b transition-colors " +
        (scrolled
          ? "border-line bg-bg/80 backdrop-blur-md elevate"
          : "border-transparent bg-transparent")
      }
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link
          to="/"
          className="font-mono text-sm font-medium tracking-tight text-text hover:text-accent"
        >
          <span className="text-accent">~/</span>
          {profile.shell.user}
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openOverlay}
            className="hidden items-center gap-2 rounded-md border border-line px-2.5 py-2 text-xs text-muted transition-colors hover:border-net/40 hover:text-net sm:inline-flex"
            aria-label="Open terminal (Control or Command K)"
          >
            <TerminalSquare size={15} aria-hidden="true" />
            <kbd className="font-mono text-[0.6875rem]">⌘K</kbd>
          </button>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-md border border-line p-2 text-muted transition-colors hover:text-text md:hidden"
          >
            {open ? (
              <X size={16} aria-hidden="true" />
            ) : (
              <Menu size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-nav"
          className="elevate border-t border-line bg-surface md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {navLinks.map((item) => (
              <li
                key={item.to}
                className="border-b border-line/60 last:border-0"
              >
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    "block py-3 text-sm " +
                    (isActive ? "text-accent" : "text-muted")
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="py-3">
              <button
                type="button"
                onClick={openOverlay}
                className="inline-flex items-center gap-2 text-sm text-net"
              >
                <TerminalSquare size={15} aria-hidden="true" />
                Open terminal
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
