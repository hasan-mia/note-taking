const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { normalizeInterests } = require('../utils/interests');

// Register a new user. Returns the created user.
const register = async ({ name, email, password, interests }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'user',
    interests: normalizeInterests(interests),
  });
  return user;
};

// Login a user and return a JWT token along with user info.
const login = async ({ email, password }) => {
  // password is select:false so we must explicitly include it
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  // Build user object without password
  const userObj = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return { token, user: userObj };
};

// Get the authenticated user's info
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

module.exports = { register, login, getMe };