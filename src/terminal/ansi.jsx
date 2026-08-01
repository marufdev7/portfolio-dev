import { Link } from "react-router-dom";
import { table as alignTable, keyValue as alignPairs } from "../lib/format";

/* ---------------------------------------------------------------
   Block renderer (§6.2 `ansi.jsx`).

   Commands emit descriptors; this file is the only place that knows
   how a descriptor becomes pixels. Two consequences worth keeping:
   commands stay testable, and a change to how tables look is one edit
   here rather than forty edits across commands/.

   The "ANSI-ish" part is deliberately tiny — one inline convention,
   `backticks`, which every command already writes naturally in its
   hint text.
   --------------------------------------------------------------- */

const TONE = {
  text: "text-text",
  error: "text-error",
  warn: "text-warn",
  success: "text-net",
  muted: "text-muted",
  heading: "text-net font-medium",
};

/**
 * Renders `backticked` spans in the accent colour. Everything else is
 * passed through untouched — no parser, no escaping surprises.
 *
 * @param {string} value
 */
function inline(value) {
  const parts = String(value).split(/(`[^`]+`)/g);
  if (parts.length === 1) return value;

  return parts.map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <span key={i} className="text-net">
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    )
  );
}

/** Wide fixed-width output scrolls sideways rather than wrapping (§6.6). */
function Pre({ children, className = "" }) {
  return <div className={`terminal-pre terminal-scroll ${className}`}>{children}</div>;
}

function Prompt({ input, prompt }) {
  return (
    <div className="flex gap-2">
      <span className="shrink-0 text-net">{prompt}</span>
      <span className="text-text">{input}</span>
    </div>
  );
}

function LinkBlock({ label, href, internal }) {
  const className = "text-net underline decoration-net/40 underline-offset-4 hover:decoration-net";

  if (internal) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {label}
    </a>
  );
}

/**
 * @param {{block: import('./output').OutputBlock}} props
 */
export function Block({ block }) {
  const { kind, content, meta } = block;

  switch (kind) {
    case "prompt":
      return <Prompt input={content} prompt={meta?.prompt ?? "$"} />;

    case "ascii":
      return (
        <Pre>
          <span className="text-net">{content}</span>
        </Pre>
      );

    case "table": {
      // Aligned as text, not as a <table>: the point is that it looks
      // like terminal output, and a real IOS column layout is exactly
      // what someone who knows IOS is checking for.
      const aligned = alignTable(content.head, content.rows, meta ?? {});
      const [header, ...rest] = aligned.split("\n");
      return (
        <Pre>
          <div className="text-net">{header}</div>
          <div className="text-text">{rest.join("\n")}</div>
        </Pre>
      );
    }

    case "keyvalue":
      return (
        <Pre>
          {content.map(([key, value], i) => (
            <div key={i}>
              <span className="text-muted">
                {String(key).padEnd(Math.max(...content.map(([k]) => String(k).length)))}
              </span>
              <span className="text-text">{"  "}{String(value)}</span>
            </div>
          ))}
        </Pre>
      );

    case "link":
      return <LinkBlock {...content} />;

    case "jsx":
      return <div>{content}</div>;

    default: {
      const tone = TONE[kind] ?? TONE.text;
      const value = String(content ?? "");
      // A blank block still needs to occupy a line.
      if (!value) return <div className="h-[1.4em]" aria-hidden="true" />;
      return <div className={`whitespace-pre-wrap break-words ${tone}`}>{inline(value)}</div>;
    }
  }
}

/** Convenience for tests and for the non-terminal fallbacks. */
export function blockToText(block) {
  if (!block) return "";
  const { kind, content } = block;
  if (kind === "table") return alignTable(content.head, content.rows);
  if (kind === "keyvalue") return alignPairs(content);
  if (kind === "link") return `${content.label} (${content.href})`;
  if (typeof content === "string") return content;
  return "";
}
