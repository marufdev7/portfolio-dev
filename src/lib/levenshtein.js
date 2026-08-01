/**
 * Damerau-Levenshtein distance (optimal string alignment), three-row
 * variant — O(min(a,b)) memory.
 *
 * Transposition counts as ONE edit, not two, which matters more than it
 * sounds: the typo this exists for is `pign` for `ping`, and plain
 * Levenshtein scores that as 2 — far enough to fall outside the
 * tolerance for a four-letter word and suggest nothing at all (§6.5).
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  // Three rows: i-2 is needed to price a transposition.
  let prev2 = new Array(b.length + 1);
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost // substitution
      );

      // Adjacent transposition: "pign" → "ping".
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, prev2[j - 2] + 1);
      }

      curr[j] = best;
    }
    [prev2, prev, curr] = [prev, curr, prev2];
  }

  return prev[b.length];
}

/**
 * Nearest candidate within a tolerance that scales with word length —
 * a 3-letter typo shouldn't match a 9-letter command.
 *
 * @param {string} input
 * @param {string[]} candidates
 * @returns {string|null}
 */
export function nearest(input, candidates) {
  if (!input) return null;
  const needle = input.toLowerCase();

  // A prefix match beats edit distance: "sub" should suggest "subnet".
  const prefixMatch = candidates.find((c) => c.toLowerCase().startsWith(needle));
  if (prefixMatch && needle.length >= 2) return prefixMatch;

  const maxDistance = needle.length <= 4 ? 1 : needle.length <= 7 ? 2 : 3;

  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshtein(needle, candidate.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return bestDistance <= maxDistance ? best : null;
}
