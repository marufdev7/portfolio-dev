/* ---------------------------------------------------------------
   Data table. Wide technical tables scroll horizontally rather than
   wrapping — a wrapped IOS column is worse than an off-screen one
   (§6.6).
   --------------------------------------------------------------- */

/**
 * @param {Object} props
 * @param {string[]} props.head
 * @param {(string|number|JSX.Element)[][]} props.rows
 * @param {'dev'|'net'} [props.tone]
 * @param {boolean} [props.mono]     mono body — addresses, masks, ports
 * @param {string} [props.caption]
 */
export default function Table({
  head,
  rows,
  tone = "dev",
  mono = false,
  caption,
  className = "",
}) {
  const accent = tone === "net" ? "text-net" : "text-accent";

  return (
    <div className={`terminal-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 ${className}`}>
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        {caption && <caption className="pb-3 text-left text-sm text-muted">{caption}</caption>}
        <thead>
          <tr className="border-b border-line">
            {head.map((cell) => (
              <th
                key={cell}
                scope="col"
                className={`py-2.5 pr-6 font-mono text-xs font-medium tracking-wide ${accent}`}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={mono ? "font-mono text-[0.8125rem]" : ""}>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-2.5 pr-6 align-top ${j === 0 ? "text-text" : "text-muted"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
