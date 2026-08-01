import { createContext, useCallback, useEffect, useMemo, useState } from "react";

/** @typedef {'dark' | 'light'} ThemeMode */

export const ThemeContext = createContext(null);

const STORAGE_KEY = "theme";

/** Read the mode the pre-paint script in index.html already applied. */
function readInitialMode() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readInitialMode);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", mode === "light");
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage blocked — theme still applies for this session */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "light" ? "#e9edf4" : "#0b111c");
  }, [mode]);

  /** Accepts 'dark' | 'light' | 'toggle' — the terminal's `theme` command uses the same door. */
  const setTheme = useCallback((next) => {
    setMode((current) => {
      if (next === "toggle") return current === "dark" ? "light" : "dark";
      return next === "light" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({ mode, setTheme, toggle: () => setTheme("toggle") }),
    [mode, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
