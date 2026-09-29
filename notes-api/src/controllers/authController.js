const authService = require('../services/authService');
const catchAsyncError = require('../middleware/catchAsyncError');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

const register = catchAsyncError(async (req, res) => {
  // Note: `role` is intentionally NOT accepted here. Self-registration always
  // creates a 'user'; admins are only created by an admin (POST /api/users).
  const { name, email, password, interests } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }
  const result = await authService.register({ name, email, password, interests });
  sendResponse(res).created(result);
});

const login = catchAsyncError(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
  const result = await authService.login({ email, password });
  sendResponse(res).ok(result);
});

const getMe = catchAsyncError(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  sendResponse(res).ok(user);
});

module.exports = { register, login, getMe };