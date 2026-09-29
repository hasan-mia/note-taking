const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { parsePaginationParams } = require('../utils/pagination');

const { ObjectId } = mongoose.Types;

const parseCursor = (after) => {
  if (!after) return null;
  if (!ObjectId.isValid(after)) {
    throw new ApiError(400, 'Invalid cursor');
  }
  return new ObjectId(after);
};

const buildPage = (rows, limit) => {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1]._id.toString() : null;
  return { data, nextCursor, hasMore };
};

const authorStages = [
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1 } }],
      as: 'author',
    },
  },
  { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
];

// Create post for authenticated user
const createPost = async (userId, data) => {
  const { title, content } = data;
  const post = await Post.create({ title, content, author: userId });
  return post;
};

// List posts with pagination
const listPosts = async (query) => {
  const { limit, after } = parsePaginationParams(query);
  const cursor = parseCursor(after);

  const rows = await Post.aggregate([
    { $match: cursor ? { _id: { $lt: cursor } } : {} },
    { $sort: { _id: -1 } },
    { $limit: limit + 1 },
    ...authorStages,
    { $project: { __v: 0 } },
  ]);

  return buildPage(rows, limit);
};

// Get post by id with author populated
const getPost = async (id) => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid post id');
  }

  const [post] = await Post.aggregate([
    { $match: { _id: new ObjectId(id) } },
    ...authorStages,
    { $project: { __v: 0 } },
  ]);

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }
  return post;
};

// Get posts for a specific user with pagination
const getUserPosts = async (userId, query) => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const { limit, after } = parsePaginationParams(query);
  const cursor = parseCursor(after);

  const innerPipeline = [];
  if (cursor) {
    innerPipeline.push({ $match: { _id: { $lt: cursor } } });
  }
  innerPipeline.push(
    { $sort: { _id: -1 } },
    { $limit: limit + 1 },
    { $project: { __v: 0 } }
  );

  const result = await User.aggregate([
    { $match: { _id: new ObjectId(userId) } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        pipeline: innerPipeline,
        as: 'posts',
      },
    },
    { $project: { _id: 1, name: 1, posts: 1 } },
  ]);

  if (!result.length) {
    throw new ApiError(404, 'User not found');
  }

  const { posts: rows, _id: authorId, name: authorName } = result[0];
  const page = buildPage(rows, limit);

  return {
    ...page,
    author: { _id: authorId.toString(), name: authorName },
  };
};

module.exports = { createPost, listPosts, getPost, getUserPosts };