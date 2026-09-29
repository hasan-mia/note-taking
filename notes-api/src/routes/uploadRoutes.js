const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

router.post('/single', uploadSingle('file'), uploadController.uploadFile);
router.post('/multiple', uploadMultiple('files', 10), uploadController.uploadMultipleFiles);
router.delete('/:publicId', uploadController.deleteFile);
router.get('/info/:filename', uploadController.getFileInfo);
router.get('/list', uploadController.listFiles);

module.exports = router;