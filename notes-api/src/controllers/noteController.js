const noteService = require('../services/noteService');
const catchAsyncError = require('../middleware/catchAsyncError');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

const createNote = catchAsyncError(async (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    throw new ApiError(400, 'Title is required');
  }
  const note = await noteService.createNote(req.user.id, { title, content });
  sendResponse(res).created(note);
});

const listNotes = catchAsyncError(async (req, res) => {
  const result = await noteService.listNotes(req.query, req.user);
  sendResponse(res).paginated(result.data, {
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

const getNote = catchAsyncError(async (req, res) => {
  const note = await noteService.getNote(req.params.id, req.user);
  sendResponse(res).ok(note);
});

const updateNote = catchAsyncError(async (req, res) => {
  const { title, content } = req.body;
  if (title === undefined && content === undefined) {
    throw new ApiError(400, 'Nothing to update');
  }
  const note = await noteService.updateNote(req.params.id, req.user, { title, content });
  sendResponse(res).ok(note);
});

const deleteNote = catchAsyncError(async (req, res) => {
  await noteService.deleteNote(req.params.id, req.user);
  sendResponse(res).ok(null, 'Note deleted');
});

module.exports = { createNote, listNotes, getNote, updateNote, deleteNote };