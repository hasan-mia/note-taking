const User = require('../models/User');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { parsePaginationParams, paginate } = require('../utils/pagination');
const { normalizeInterests } = require('../utils/interests');

// Create user (admin only)
const createUser = async (data) => {
  const { name, email, password, role = 'user', interests = [] } = data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    interests: normalizeInterests(interests),
  });
  return user;
};

// List all users (admin only), cursor paginated
const listUsers = async (query) => {
  const params = parsePaginationParams(query);
  const result = await paginate(User.find(), params);
  return result;
};

// Get user by id (admin only)
const getUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user id');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

// Update user by id (admin only)
const updateUser = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user id');
  }

  const allowed = ['name', 'email', 'role', 'interests'];
  const update = {};
  for (const key of allowed) {
    if (data[key] !== undefined) {
      update[key] = data[key];
    }
  }

  if (update.interests !== undefined) {
    update.interests = normalizeInterests(update.interests);
  }

  if (update.email) {
    const existing = await User.findOne({ email: update.email, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(409, 'Email already in use');
    }
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  Object.assign(user, update);
  await user.save();
  return user;
};

// Delete user by id (admin only)
const deleteUser = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid user id');
  }
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

// Group users by interests, optionally filtered by a specific interest (senerio 1)
const groupUsersByInterests = async (query) => {
  const interest =
    typeof query.interest === 'string' ? query.interest.trim().toLowerCase() : '';

  const pipeline = [
    ...(interest ? [{ $match: { interests: interest } }] : []),
    { $project: { name: 1, interests: 1 } },
    { $unwind: '$interests' },
    ...(interest ? [{ $match: { interests: interest } }] : []),
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: {
          $push: { _id: '$_id', name: '$name' },
        },
      },
    },
    { $sort: { count: -1 } },
  ];

  const result = await User.aggregate(pipeline);
  return result;
};

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  groupUsersByInterests,
};