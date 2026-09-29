const uploadService = require('../services/uploadService');
const catchAsyncError = require('../middleware/catchAsyncError');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');

exports.uploadFile = catchAsyncError(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'No file uploaded'));
  }

  const result = await uploadService.uploadFile(req.file);

  sendResponse(res).created(result, 'File uploaded successfully');
});

exports.uploadMultipleFiles = catchAsyncError(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'No files uploaded'));
  }

  const results = await uploadService.uploadMultipleFiles(req.files);

  sendResponse(res).created(results, 'Files uploaded successfully');
});

exports.deleteFile = catchAsyncError(async (req, res, next) => {
  const { publicId } = req.params;

  if (!publicId) {
    return next(new ApiError(400, 'Public ID is required'));
  }

  const result = await uploadService.deleteFile(publicId);

  if (result.result === 'not found') {
    return next(new ApiError(404, 'File not found'));
  }

  sendResponse(res).ok(result, 'File deleted successfully');
});

exports.getFileInfo = catchAsyncError(async (req, res, next) => {
  const { filename } = req.params;

  if (!filename) {
    return next(new ApiError(400, 'Filename is required'));
  }

  const fileInfo = await uploadService.getFileInfo(filename);

  sendResponse(res).ok(fileInfo);
});

exports.listFiles = catchAsyncError(async (req, res, next) => {
  const files = await uploadService.listFiles();

  sendResponse(res).ok(files);
});