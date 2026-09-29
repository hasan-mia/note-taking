const postService = require('../services/postService');
const catchAsyncError = require('../middleware/catchAsyncError');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

const createPost = catchAsyncError(async (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    throw new ApiError(400, 'Title is required');
  }
  const post = await postService.createPost(req.user.id, { title, content });
  sendResponse(res).created(post);
});

const listPosts = catchAsyncError(async (req, res) => {
  const result = await postService.listPosts(req.query);
  sendResponse(res).paginated(result.data, {
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

const getPost = catchAsyncError(async (req, res) => {
  const post = await postService.getPost(req.params.id);
  sendResponse(res).ok(post);
});

const getUserPosts = catchAsyncError(async (req, res) => {
  const result = await postService.getUserPosts(req.params.id, req.query);
  sendResponse(res).paginated(
    result.data,
    {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    },
    'Success',
    { author: result.author }
  );
});

module.exports = { createPost, listPosts, getPost, getUserPosts };