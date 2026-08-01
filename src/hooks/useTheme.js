import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/** @returns {{mode: 'dark'|'light', setTheme: (m: 'dark'|'light'|'toggle') => void, toggle: () => void}} */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
