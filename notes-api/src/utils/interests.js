const MAX_INTERESTS = 10;
const MAX_INTEREST_LENGTH = 30;

/**
 * Normalise a user-supplied interests value into a clean array of strings.
 *
 * Accepts either an array or a comma-separated string so the same rule applies
 * to POST /api/auth/register and POST /api/users.
 *
 * - trims and drops blanks
 * - lowercases, so "Chess" and "chess" are one interest and one group
 * - strips leading '$' and '.' so a stored value can never be read as a field
 *   path by the group-by-interests pipeline
 * - caps length per entry and the total number of entries
 * - removes duplicates, keeping the first spelling
 *
 * @param {string[]|string} input
 * @returns {string[]}
 */
function normalizeInterests(input) {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(',') : [];

  const seen = new Set();
  const out = [];

  for (const item of raw) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;

    // eslint-disable-next-line no-control-regex
    const cleaned = String(item)
      .replace(/[\u0000]/g, '')
      .replace(/^\$+/, '')
      .replace(/\.+$/, '')
      .trim()
      .toLowerCase()
      .slice(0, MAX_INTEREST_LENGTH);

    if (!cleaned) continue;

    if (seen.has(cleaned)) continue;

    seen.add(cleaned);
    out.push(cleaned);

    if (out.length === MAX_INTERESTS) break;
  }

  return out;
}

module.exports = { normalizeInterests, MAX_INTERESTS, MAX_INTEREST_LENGTH };
