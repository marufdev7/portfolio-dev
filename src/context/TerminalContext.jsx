import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { append, toBlocks, promptEcho, muted, text, warn } from "../terminal/output";
import {
  loadHistory,
  saveHistory,
  pushHistory,
  clearHistory as clearStoredHistory,
} from "../terminal/history";
import { HOME } from "../terminal/home";
import { profile } from "../data/profile";
import { useTheme } from "../hooks/useTheme";
import { prefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/* ---------------------------------------------------------------
   One session, three shells (§6.1).

   The provider sits above the router, so navigating from /network to
   /projects and opening Ctrl+K again lands you in the same session
   with the same scrollback, history, cwd, and IOS device. That
   continuity is most of what separates this from a styled <div>.
   --------------------------------------------------------------- */

export const TerminalContext = createContext(null);

/* The engine, its ~45 commands, and the VFS derived from every data
   file behind them are a large chunk of the bundle, and a visitor who
   only reads the case studies should never download it. One dynamic
   import, resolved before the first line runs and cached after — the
   promise is memoised rather than the module, so two commands racing
   on a cold start still share one request. */
let enginePromise = null;
const loadEngine = () => (enginePromise ??= import("../terminal"));


/**
 * Boot lines (§6.7). Stored as data and turned into blocks at print
 * time — block ids are minted per call, so a constant array of blocks
 * would hand React duplicate keys.
 */
const BOOT = [
  { delay: 260, make: () => text("[  OK  ] Initializing portfolio shell v2.0") },
  { delay: 300, make: () => text("[  OK  ] Loading network stack ......... up") },
  { delay: 300, make: () => text("[  OK  ] Mounting /home/maruf .......... ok") },
  { delay: 320, make: () => warn("[ WARN ] CCNA certification ............ in progress") },
];

export function TerminalProvider({ children }) {
  const navigate = useNavigate();
  const { mode, setTheme } = useTheme();

  /* Scrollback lives in a ref and renders through a forced update:
     a streaming command prints a line at a time, and batching those
     into one frame is the difference between smooth and janky (§6.10). */
  const blocksRef = useRef([]);
  const [, rerender] = useReducer((n) => n + 1, 0);
  const frameRef = useRef(null);

  const flush = useCallback(() => {
    if (frameRef.current != null) return;
    if (typeof requestAnimationFrame !== "function") {
      rerender();
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      rerender();
    });
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  const [history, setHistory] = useState(() => loadHistory());
  const [cwd, setCwd] = useState(HOME);
  const [busy, setBusy] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [booted, setBooted] = useState(false);

  const sessionRef = useRef({ device: "R1", iosMode: "user" });
  const engineRef = useRef(null); // set once the chunk above lands
  const interceptorRef = useRef(null);
  const abortRef = useRef({ aborted: false });
  const cwdRef = useRef(cwd);
  const historyRef = useRef(history);
  const themeRef = useRef(mode);

  cwdRef.current = cwd;
  historyRef.current = history;
  themeRef.current = mode;

  /* ---------- output ---------- */

  const print = useCallback(
    (value) => {
      const blocks = toBlocks(value);
      if (!blocks.length) return;
      blocksRef.current = append(blocksRef.current, blocks);
      flush();
    },
    [flush]
  );

  const clear = useCallback(() => {
    blocksRef.current = [];
    flush();
  }, [flush]);

  /* ---------- the context handed to every command ---------- */

  const makeCtx = useCallback(
    () => ({
      print,
      clear,
      get cwd() {
        return cwdRef.current;
      },
      setCwd: (next) => {
        cwdRef.current = next;
        setCwd(next);
      },
      get history() {
        return historyRef.current;
      },
      get env() {
        return {
          USER: profile.shell.user,
          HOST: profile.shell.host,
          PWD: cwdRef.current,
          SHELL: "/bin/portfolio",
          // Only ever read from inside a running command, by which
          // point the engine chunk is necessarily loaded.
          COMMANDS: String(engineRef.current?.commandCount() ?? 0),
        };
      },
      /** Abortable and instant under reduced motion — the one pacing lever commands have. */
      sleep: (ms) =>
        new Promise((resolve) => {
          if (prefersReducedMotion() || abortRef.current.aborted) {
            resolve();
            return;
          }
          const id = setTimeout(resolve, ms);
          abortRef.current.onAbort = () => {
            clearTimeout(id);
            resolve();
          };
        }),
      go: (path) => {
        setOverlayOpen(false);
        navigate(path);
      },
      openExternal: (url) => window.open(url, "_blank", "noopener,noreferrer"),
      download: (url) => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      },
      close: () => setOverlayOpen(false),
      get theme() {
        return themeRef.current;
      },
      setTheme,
      session: sessionRef.current,
      setInterceptor: (fn) => {
        interceptorRef.current = fn;
        flush();
      },
      getInterceptor: () => interceptorRef.current,
    }),
    [print, clear, navigate, setTheme, flush]
  );

  /* ---------- prompt ---------- */

  const prompt = useMemo(() => {
    const session = sessionRef.current;
    if (session.quiz) {
      const { index = 0, questions = [] } = session.quiz;
      return `quiz(${Math.min(index + 1, questions.length)}/${questions.length})>`;
    }
    if (session.iosMode === "config") return `${session.device}(config)#`;
    return `${profile.shell.user}@${profile.shell.host}:${cwd}$`;
    // sessionRef is mutated by commands, so the render that follows a
    // command's output is what picks the new prompt up — which is
    // exactly when it should change.
  }, [cwd, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- running a line ---------- */

  const run = useCallback(
    async (line) => {
      const input = String(line ?? "");
      const intercepted = Boolean(interceptorRef.current);

      print(promptEcho(input, prompt));

      if (!intercepted && input.trim()) {
        setHistory((current) => {
          const next = pushHistory(current, input);
          historyRef.current = next;
          saveHistory(next);
          return next;
        });
      }

      abortRef.current = { aborted: false };
      setBusy(true);
      try {
        engineRef.current ??= await loadEngine();
        await engineRef.current.execute(input, makeCtx());
      } finally {
        setBusy(false);
      }
    },
    [makeCtx, print, prompt]
  );

  /** Ctrl+C — collapses any pending sleep so a stream ends now. */
  const abort = useCallback(() => {
    abortRef.current.aborted = true;
    abortRef.current.onAbort?.();
    print(muted("^C"));
  }, [print]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    historyRef.current = [];
    clearStoredHistory();
  }, []);

  /* ---------- boot (§6.7) ---------- */

  const boot = useCallback(async () => {
    if (booted) return;
    setBooted(true);

    // Warm the engine while the boot lines play. By the time anyone
    // has typed a command the chunk has long since arrived, so the
    // split costs no perceptible latency.
    loadEngine().then((mod) => {
      engineRef.current ??= mod;
    });

    const hint = muted(
      "Type `help` to get started, or `subnet 10.0.0.0/24` to see something useful."
    );

    if (prefersReducedMotion()) {
      print([...BOOT.map((step) => step.make()), text(""), hint]);
      return;
    }

    for (const step of BOOT) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      print(step.make());
    }
    print([text(""), hint]);
  }, [booted, print]);

  /** Any keypress during boot jumps to the end (§6.7). */
  const skipBoot = useCallback(() => setBooted(true), []);

  const value = useMemo(
    () => ({
      blocks: blocksRef.current,
      history,
      cwd,
      prompt,
      busy,
      booted,
      overlayOpen,
      openOverlay: () => setOverlayOpen(true),
      closeOverlay: () => setOverlayOpen(false),
      toggleOverlay: () => setOverlayOpen((v) => !v),
      run,
      abort,
      print,
      clear,
      clearHistory,
      boot,
      skipBoot,
      makeCtx,
      session: sessionRef.current,
      hasInterceptor: () => Boolean(interceptorRef.current),
    }),
    // blocksRef.current is swapped wholesale on every print, so the
    // forced rerender is what makes this memo produce a fresh value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [history, cwd, prompt, busy, booted, overlayOpen, run, abort, print, clear, clearHistory, boot, skipBoot, makeCtx, blocksRef.current]
  );

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>;
}
