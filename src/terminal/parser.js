// ---------------------------------------------------------------
// Input tokenizer. Handles quotes, escapes, short and long flags,
// and `--` as the end-of-flags marker (§6.2).
//
// Deliberately not a shell: no pipes, no globbing, no subshells.
// Pipe support is a listed stretch goal, and the parser is shaped
// so adding it later doesn't mean a rewrite.
// ---------------------------------------------------------------

/** @typedef {Object} ParsedInput
 *  @property {string}   name        command name (lowercased)
 *  @property {string[]} args        positional arguments
 *  @property {Record<string, string|number|boolean>} flags
 *  @property {string}   raw         original input, trimmed
 *  @property {string[]} tokens      every token including the command
 */

/**
 * Splits a line into tokens, respecting single and double quotes and
 * backslash escapes.
 *
 * @param {string} input
 * @returns {string[]}
 */
export function tokenize(input) {
  const tokens = [];
  let current = "";
  let quote = null;
  let escaped = false;
  let hasContent = false;

  for (const char of String(input)) {
    if (escaped) {
      current += char;
      hasContent = true;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
        // An empty quoted string is still a token: `echo ""`
        hasContent = true;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      hasContent = true;
      continue;
    }

    if (/\s/.test(char)) {
      if (hasContent) {
        tokens.push(current);
        current = "";
        hasContent = false;
      }
      continue;
    }

    current += char;
    hasContent = true;
  }

  if (hasContent) tokens.push(current);
  return tokens;
}

/**
 * Coerces a flag value against the command's declared flag types.
 * @param {'string'|'number'|'boolean'} type
 * @param {string} value
 */
function coerce(type, value) {
  if (type === "number") {
    const n = Number(value);
    if (Number.isNaN(n)) {
      throw new Error(`expected a number, got "${value}"`);
    }
    return n;
  }
  if (type === "boolean") {
    return value !== "false" && value !== "0";
  }
  return value;
}

/**
 * Parses a line into a command invocation.
 *
 * Flag forms understood:
 *   --hosts 20     --hosts=20     --binary     --no-color
 *   -c 4           -c4            -abc (grouped booleans)
 *
 * A flag not declared by the command is still collected — commands
 * decide whether to complain, so `man` can report unknown flags
 * usefully rather than the parser rejecting them blindly.
 *
 * @param {string} input
 * @param {{flags?: Record<string, 'string'|'number'|'boolean'>, aliasFlags?: Record<string,string>}} [spec]
 * @returns {ParsedInput}
 */
export function parse(input, spec = {}) {
  const raw = String(input).trim();
  const tokens = tokenize(raw);

  if (tokens.length === 0) {
    return { name: "", args: [], flags: {}, raw, tokens: [] };
  }

  const [name, ...rest] = tokens;
  const declared = spec.flags ?? {};
  const shortMap = spec.aliasFlags ?? {};

  const args = [];
  const flags = {};
  let endOfFlags = false;

  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];

    if (endOfFlags) {
      args.push(token);
      continue;
    }

    if (token === "--") {
      endOfFlags = true;
      continue;
    }

    // --long or --long=value
    if (token.startsWith("--") && token.length > 2) {
      const body = token.slice(2);
      const eq = body.indexOf("=");
      const key = eq === -1 ? body : body.slice(0, eq);
      const inlineValue = eq === -1 ? null : body.slice(eq + 1);
      const type = declared[key] ?? (inlineValue === null ? "boolean" : "string");

      if (type === "boolean" && inlineValue === null) {
        flags[key] = true;
      } else if (inlineValue !== null) {
        flags[key] = coerce(type, inlineValue);
      } else {
        const next = rest[i + 1];
        if (next === undefined || (next.startsWith("-") && next.length > 1)) {
          throw new Error(`flag --${key} expects a value`);
        }
        flags[key] = coerce(type, next);
        i++;
      }
      continue;
    }

    // -c, -c4, -abc — but not a bare "-" or a negative number
    if (
      token.startsWith("-") &&
      token.length > 1 &&
      !/^-\d/.test(token)
    ) {
      const body = token.slice(1);

      // -c4 style: a known non-boolean short flag with its value attached
      const firstKey = shortMap[body[0]] ?? body[0];
      if (body.length > 1 && declared[firstKey] && declared[firstKey] !== "boolean") {
        flags[firstKey] = coerce(declared[firstKey], body.slice(1));
        continue;
      }

      // Otherwise treat each letter as its own flag
      for (let c = 0; c < body.length; c++) {
        const key = shortMap[body[c]] ?? body[c];
        const type = declared[key] ?? "boolean";

        if (type === "boolean") {
          flags[key] = true;
        } else {
          const next = rest[i + 1];
          if (next === undefined) throw new Error(`flag -${body[c]} expects a value`);
          flags[key] = coerce(type, next);
          i++;
        }
      }
      continue;
    }

    args.push(token);
  }

  return { name: name.toLowerCase(), args, flags, raw, tokens };
}

/**
 * Expands $VAR and ${VAR} against an env map — used by `echo`.
 * Unknown variables expand to an empty string, like a real shell.
 *
 * @param {string} text
 * @param {Record<string, string>} env
 */
export function expandVars(text, env = {}) {
  return String(text).replace(
    /\$\{(\w+)\}|\$(\w+)/g,
    (_, braced, bare) => env[braced ?? bare] ?? ""
  );
}
