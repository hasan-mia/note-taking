const userService = require('../services/userService');
const catchAsyncError = require('../middleware/catchAsyncError');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

const createUser = catchAsyncError(async (req, res) => {
  const { name, email, password, role, interests } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }
  const user = await userService.createUser({ name, email, password, role, interests });
  sendResponse(res).created(user);
});

const listUsers = catchAsyncError(async (req, res) => {
  const result = await userService.listUsers(req.query);
  sendResponse(res).paginated(result.data, {
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

const getUser = catchAsyncError(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendResponse(res).ok(user);
});

const updateUser = catchAsyncError(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendResponse(res).ok(user);
});

const deleteUser = catchAsyncError(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendResponse(res).ok(null, 'User deleted');
});

const groupedByInterests = catchAsyncError(async (req, res) => {
  const result = await userService.groupUsersByInterests(req.query);
  sendResponse(res).ok(result);
});

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  groupedByInterests,
};