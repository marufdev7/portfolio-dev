import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";

/**
 * The same door the terminal's `theme` command uses — both call
 * setTheme on ThemeContext, so the toggle and the command can never
 * disagree about what mode the site is in (§3).
 */
export default function ThemeToggle({ className = "" }) {
  const { mode, toggle } = useTheme();
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={
        "rounded-md border border-line p-2 text-muted transition-colors " +
        `hover:border-accent/40 hover:text-accent ${className}`
      }
    >
      {mode === "dark" ? (
        <Sun size={16} aria-hidden="true" />
      ) : (
        <Moon size={16} aria-hidden="true" />
      )}
    </button>
  );
}
