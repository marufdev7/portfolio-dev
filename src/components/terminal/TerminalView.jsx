import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Block } from "../../terminal/ansi";
import { complete } from "../../terminal/completion";
import { navigate as walkHistory, reverseSearch } from "../../terminal/history";
import { commandNames } from "../../terminal/registry";
import { muted, text } from "../../terminal/output";
import { useTerminal } from "../../hooks/useTerminal";

/* ---------------------------------------------------------------
   The shell UI. One component behind all three surfaces (§6.1) —
   embedded, full-screen, and the Ctrl+K overlay differ only in
   chrome and height.

   Input model: a real <input> holds the text and the focus (§6.8 —
   never a contenteditable), rendered transparent over a mirror span
   that draws the block caret and the ghost suggestion. Mirror and
   input share the font and scroll offset, so the fake caret sits
   exactly where the real one would.
   --------------------------------------------------------------- */

/** One-tap commands for phones (§6.6). */
const CHIPS = [
  "help",
  "subnet 10.0.0.0/24",
  "projects",
  "ping google.com",
  "quiz",
  "clear",
];

export default function TerminalView({
  variant = "embedded",
  autoBoot = false,
  autoFocus = false,
  className = "",
  onRequestClose,
}) {
  const {
    blocks,
    history,
    prompt,
    busy,
    booted,
    run,
    abort,
    print,
    clear,
    boot,
    skipBoot,
    makeCtx,
  } = useTerminal();

  const [value, setValue] = useState("");
  const [caret, setCaret] = useState(0);
  const [ghost, setGhost] = useState("");
  const [search, setSearch] = useState(null); // { query, skip } while Ctrl+R is active

  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const scrollRef = useRef(null);
  const pinnedRef = useRef(true);
  const draftRef = useRef("");
  const historyIndexRef = useRef(0);
  const lastTabRef = useRef("");

  /* ---------- boot ---------- */

  useEffect(() => {
    if (autoBoot && !booted) boot();
  }, [autoBoot, booted, boot]);

  /* ---------- scrollback follows output unless the user scrolled up ---------- */

  /* Pinned-ness is a ref, not state, for two reasons. It drives no
     markup, and `onScroll` fires at frame rate: as state it re-rendered
     the entire scrollback on every frame of a flick, which is what made
     scrolling stutter on a long session. As a ref it also keeps *itself*
     out of the effect's deps — when it was a dep, scrolling back down
     into the bottom 24px flipped it true and re-ran the effect mid
     -gesture, snapping the view to the end and killing the fling. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!pinnedRef.current || !el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [blocks]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }, []);

  /* ---------- caret + ghost ---------- */

  const syncCaret = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    setCaret(el.selectionStart ?? el.value.length);
    if (mirrorRef.current) mirrorRef.current.scrollLeft = el.scrollLeft;
  }, []);

  useEffect(() => {
    // Ghost = the most recent history line, or command name, that
    // extends what's typed. Right-arrow at end of line accepts it.
    if (!value.trim()) {
      setGhost("");
      return;
    }
    const fromHistory = [...history]
      .reverse()
      .find((h) => h.startsWith(value) && h !== value);
    if (fromHistory) {
      setGhost(fromHistory.slice(value.length));
      return;
    }
    if (!value.includes(" ")) {
      const name = commandNames().find(
        (c) => c.startsWith(value) && c !== value,
      );
      setGhost(name ? name.slice(value.length) : "");
      return;
    }
    setGhost("");
  }, [value, history]);

  /* ---------- focus ---------- */

  const focusInput = useCallback((event) => {
    // Don't steal focus mid-selection — copying output is a normal thing to want.
    if (event && !window.getSelection()?.isCollapsed) return;
    if (event?.target?.closest?.("a,button")) return;
    // preventScroll: the input sits at the end of the scrollback, so the
    // default "scroll the focused element into view" drags the reader to
    // the bottom — and, because the scrollback is nested, the page with
    // it. The pin effect above is what decides when we follow output.
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  /* ---------- submit ---------- */

  const submit = useCallback(
    async (line) => {
      setValue("");
      setGhost("");
      draftRef.current = "";
      historyIndexRef.current = 0;
      lastTabRef.current = "";
      pinnedRef.current = true;
      await run(line);
    },
    [run],
  );

  const insertChip = useCallback(
    (chip) => {
      setValue(chip);
      draftRef.current = chip;
      inputRef.current?.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) el.setSelectionRange(chip.length, chip.length);
        syncCaret();
      });
    },
    [syncCaret],
  );

  /* ---------- keys (§6.5) ---------- */

  const onKeyDown = useCallback(
    (event) => {
      if (!booted) skipBoot();

      const el = inputRef.current;
      const ctrl = event.ctrlKey || event.metaKey;

      /* --- reverse search owns the keyboard while it's open --- */
      if (search) {
        if (
          event.key === "Escape" ||
          (ctrl && event.key.toLowerCase() === "g")
        ) {
          event.preventDefault();
          setSearch(null);
          return;
        }
        if (ctrl && event.key.toLowerCase() === "r") {
          event.preventDefault();
          const next = { ...search, skip: search.skip + 1 };
          if (reverseSearch(history, next.query, next.skip)) setSearch(next);
          return;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const hit = reverseSearch(history, search.query, search.skip);
          setSearch(null);
          if (hit) {
            setValue(hit.value);
            requestAnimationFrame(syncCaret);
          }
          return;
        }
        if (event.key === "Backspace") {
          event.preventDefault();
          setSearch({ query: search.query.slice(0, -1), skip: 0 });
          return;
        }
        if (event.key.length === 1 && !ctrl) {
          event.preventDefault();
          setSearch({ query: search.query + event.key, skip: 0 });
          return;
        }
        return;
      }

      if (ctrl) {
        const key = event.key.toLowerCase();
        if (key === "c") {
          event.preventDefault();
          if (busy) abort();
          else {
            print(text(`${prompt} ${value}^C`));
            setValue("");
          }
          return;
        }
        if (key === "l") {
          event.preventDefault();
          clear();
          return;
        }
        if (key === "r") {
          event.preventDefault();
          setSearch({ query: "", skip: 0 });
          return;
        }
        if (key === "a") {
          event.preventDefault();
          el?.setSelectionRange(0, 0);
          syncCaret();
          return;
        }
        if (key === "e") {
          event.preventDefault();
          el?.setSelectionRange(value.length, value.length);
          syncCaret();
          return;
        }
        if (key === "u") {
          event.preventDefault();
          setValue("");
          return;
        }
        return;
      }

      switch (event.key) {
        case "Enter": {
          event.preventDefault();
          submit(value);
          return;
        }

        case "ArrowUp":
        case "ArrowDown": {
          event.preventDefault();
          if (historyIndexRef.current === 0) draftRef.current = value;
          const step = walkHistory(
            history,
            historyIndexRef.current,
            event.key === "ArrowUp" ? "up" : "down",
            draftRef.current,
          );
          historyIndexRef.current = step.index;
          setValue(step.value);
          requestAnimationFrame(() => {
            const input = inputRef.current;
            if (input)
              input.setSelectionRange(step.value.length, step.value.length);
            syncCaret();
          });
          return;
        }

        case "ArrowRight": {
          // Accept the ghost, but only from the end of the line —
          // mid-line, → still means → .
          if (ghost && el && el.selectionStart === value.length) {
            event.preventDefault();
            const next = value + ghost;
            setValue(next);
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(next.length, next.length);
              syncCaret();
            });
          }
          return;
        }

        case "Tab": {
          event.preventDefault();
          const result = complete(value, makeCtx());
          if (result.appended) {
            setValue(result.value);
            lastTabRef.current = "";
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(
                result.value.length,
                result.value.length,
              );
              syncCaret();
            });
            return;
          }
          // Nothing to fill: a second Tab on the same line lists the
          // candidates, exactly as bash does.
          if (result.suggestions.length > 1 && lastTabRef.current === value) {
            print([
              text(`${prompt} ${value}`),
              muted(result.suggestions.join("   ")),
            ]);
            lastTabRef.current = "";
          } else {
            lastTabRef.current = value;
          }
          return;
        }

        case "Escape": {
          if (onRequestClose) {
            event.preventDefault();
            onRequestClose();
          }
          return;
        }

        default:
          lastTabRef.current = "";
      }
    },
    [
      booted,
      skipBoot,
      search,
      history,
      busy,
      abort,
      print,
      prompt,
      value,
      clear,
      syncCaret,
      submit,
      ghost,
      makeCtx,
      onRequestClose,
    ],
  );

  const before = value.slice(0, caret);
  const at = value.slice(caret, caret + 1);
  const after = value.slice(caret + 1);
  const searchHit = search
    ? reverseSearch(history, search.query, search.skip)
    : null;

  /* Height belongs on the *panel*, not on the scrollback. Putting it on
     the scrollback looked equivalent and was not: `flex-1` computes to
     `flex: 1 1 0%`, and a zero flex-basis in an auto-height column
     container overrides the height property outright, so the scrollback
     used its content height instead — 4400px after a few commands. The
     panel grew forever, nothing ever scrolled inside it, and because the
     element is still `overflow-y: auto` with `overscroll-behavior:
     contain` it became a scroll container with nothing to scroll that
     also refused to hand the wheel to the page. A dead zone that grew
     with every command. The panel is what has a size; the scrollback
     takes what's left (`min-h-0` lets it shrink below its content). */
  const heights = {
    embedded: "h-[24rem] md:h-[30rem]",
    full: "h-[calc(100vh-13rem)] min-h-[24rem]",
    overlay: "h-[60vh] max-h-[34rem]",
  };

  // The embedded terminal is a panel in an article: reaching its last
  // line should hand the wheel back to the page. The other two are the
  // thing you are reading, so they keep it (§6.1).
  const chaining = variant === "embedded" ? "" : "terminal-trap";

  return (
    <div
      className={
        "net-surface elevate flex flex-col overflow-hidden rounded-lg border border-line bg-surface " +
        `font-mono text-[0.9375rem] leading-6 focus-within:border-net/40 ${heights[variant]} ${className}`
      }
    >
      {/* Title bar — the one piece of skeuomorphism, and it earns its
          place by making the region's purpose obvious at a glance. */}
      <div className="flex items-center justify-between border-b border-line bg-surface-raise px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-net/70" />
        </div>
        <span className="text-xs text-faint">maruf@portfolio — {variant}</span>
        {onRequestClose ? (
          <button
            type="button"
            onClick={onRequestClose}
            className="text-xs text-muted hover:text-net"
          >
            esc
          </button>
        ) : (
          <span className="w-8" aria-hidden="true" />
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        onClick={focusInput}
        className={`terminal-scroll ${chaining} min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4`}
      >
        <p className="sr-only" id="terminal-help">
          Interactive terminal. Type a command and press Enter. Press Tab to
          complete, up and down arrows for history, and Control C to cancel.
          Everything here is also available as a normal page — see the links
          below the terminal.
        </p>

        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        >
          {blocks.map((block) => (
            <Block key={block.id} block={block} />
          ))}
        </div>

        {/* Input line */}
        <div className="mt-1 flex items-start gap-2">
          <label
            htmlFor="terminal-input"
            className="shrink-0 whitespace-pre text-net"
          >
            {search ? `(reverse-i-search)\`${search.query}':` : prompt}
          </label>

          <div className="relative min-w-0 flex-1">
            <input
              id="terminal-input"
              ref={inputRef}
              value={search ? (searchHit?.value ?? "") : value}
              onChange={(e) => {
                setValue(e.target.value);
                draftRef.current = e.target.value;
                historyIndexRef.current = 0;
                syncCaret();
              }}
              onKeyDown={onKeyDown}
              onKeyUp={syncCaret}
              onClick={syncCaret}
              onSelect={syncCaret}
              onScroll={syncCaret}
              readOnly={Boolean(search)}
              aria-describedby="terminal-help"
              aria-label="Terminal input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="text"
              enterKeyHint="go"
              className="w-full bg-transparent text-transparent caret-transparent outline-none selection:bg-net/30"
            />

            {/* The visible line. aria-hidden — the input above is what
                assistive tech reads. */}
            <div
              ref={mirrorRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre"
            >
              <span>{before}</span>
              <span className="terminal-caret bg-net text-bg">{at || " "}</span>
              <span>{after}</span>
              {ghost && !search && <span className="text-faint">{ghost}</span>}
            </div>
          </div>
        </div>

        {busy && (
          <p className="mt-1 text-xs text-faint">
            running… <span className="text-muted">Ctrl+C to stop</span>
          </p>
        )}
      </div>

      {/* Command chips — the difference between usable and unusable on
          a phone (§6.6). Hidden on pointer-first widths. */}
      <div className="terminal-scroll flex gap-2 overflow-x-auto overflow-y-hidden border-t border-line bg-surface-raise px-3 py-2 sm:hidden">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => insertChip(chip)}
            className="shrink-0 rounded border border-line px-2 py-1 text-xs text-muted active:text-net"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
