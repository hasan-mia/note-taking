const express = require('express');
const router = express.Router();
const {
  createPost,
  listPosts,
  getPost,
} = require('../controllers/postController');
const { isAuthenticated } = require('../middleware/auth');

// Create post requires authentication
router.post('/', isAuthenticated, createPost);
// Public posts list
router.get('/', listPosts);
// Public single post
router.get('/:id', getPost);

module.exports = router;