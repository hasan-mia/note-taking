const mongoose = require('mongoose');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Parse pagination params from query string.
 * @param {Object} query - Express req.query
 * @returns {{ limit: number, after: string|null }}
 */
function parsePaginationParams(query) {
  let limit = DEFAULT_LIMIT;
  if (query.limit) {
    const parsed = parseInt(query.limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }
  const after = query.after || null;
  return { limit, after };
}

/**
 * Apply cursor pagination to a Mongoose Query.
 * Cursor is the last seen _id; next page fetches _id < after, sorted desc.
 * @param {mongoose.Query} baseQuery - The base Mongoose query (e.g. Note.find({owner}))
 * @param {{ limit: number, after: string|null }} params
 * @returns {Object} { data, nextCursor, hasMore }
 */
async function paginate(baseQuery, params) {
  const { limit, after } = params;
  const filter = {};
  if (after) {
    if (!mongoose.Types.ObjectId.isValid(after)) {
      const err = new Error('Invalid cursor');
      err.statusCode = 400;
      throw err;
    }
    filter._id = { $lt: new mongoose.Types.ObjectId(after) };
  }

  const data = await baseQuery
    .find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .exec();

  const nextCursor = data.length ? data[data.length - 1]._id.toString() : null;
  const hasMore = data.length === limit;

  return { data, nextCursor, hasMore };
}

module.exports = { parsePaginationParams, paginate, DEFAULT_LIMIT, MAX_LIMIT };