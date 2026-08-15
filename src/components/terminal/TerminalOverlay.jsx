import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTerminal } from "../../hooks/useTerminal";
import TerminalView from "./TerminalView";

/* ---------------------------------------------------------------
   Ctrl/Cmd+K overlay (§6.1, §6.7). Same session as the embedded and
   full-screen shells — open it on /projects, close it, open it on
   /about, and your history and cwd are still there.
   --------------------------------------------------------------- */

export default function TerminalOverlay() {
  const { overlayOpen, closeOverlay, booted, boot } = useTerminal();
  const reduce = useReducedMotion();
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!overlayOpen) return;

    returnFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    if (!booted) boot();

    return () => {
      document.body.style.overflow = overflow;
      // Send focus back where it came from — otherwise closing the
      // overlay drops a keyboard user at the top of the document.
      if (returnFocusRef.current instanceof HTMLElement)
        returnFocusRef.current.focus();
    };
  }, [overlayOpen, booted, boot]);

  return (
    <AnimatePresence>
      {overlayOpen && (
        <motion.div
          className="fixed inset-0 z-70 flex items-start justify-center bg-bg/80 p-4 pt-[10vh] backdrop-blur-sm"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOverlay();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Terminal"
            className="w-full max-w-3xl"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.21, 0.65, 0.35, 1] }}
          >
            <TerminalView
              variant="overlay"
              autoFocus
              onRequestClose={closeOverlay}
              className="glow-net"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
