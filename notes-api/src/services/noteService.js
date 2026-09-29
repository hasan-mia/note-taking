const mongoose = require('mongoose');
const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const { parsePaginationParams, paginate } = require('../utils/pagination');

// Create note for authenticated user
const createNote = async (userId, data) => {
  const { title, content } = data;
  const note = await Note.create({ title, content, owner: userId });
  return note;
};

// List notes: own for user, all for admin
const listNotes = async (query, user) => {
  const params = parsePaginationParams(query);
  const baseQuery =
    user.role === 'admin' ? Note.find() : Note.find({ owner: user.id });
  return paginate(baseQuery, params);
};

// Get note by id (owner or admin)
const getNote = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid note id');
  }
  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  if (user.role !== 'admin' && note.owner.toString() !== user.id) {
    throw new ApiError(403, 'Access denied');
  }
  return note;
};

// Update note (owner or admin)
const updateNote = async (id, user, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid note id');
  }

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  if (user.role !== 'admin' && note.owner.toString() !== user.id) {
    throw new ApiError(403, 'Access denied');
  }

  const { title, content } = data;
  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  await note.save();
  return note;
};

// Delete note (owner or admin)
const deleteNote = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid note id');
  }

  const note = await Note.findById(id);
  if (!note) {
    throw new ApiError(404, 'Note not found');
  }
  if (user.role !== 'admin' && note.owner.toString() !== user.id) {
    throw new ApiError(403, 'Access denied');
  }
  await note.deleteOne();
  return { message: 'Note deleted' };
};

module.exports = {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
};