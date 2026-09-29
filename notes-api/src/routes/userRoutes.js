const express = require('express');
const router = express.Router();
const {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  groupedByInterests,
} = require('../controllers/userController');
const { getUserPosts } = require('../controllers/postController');
const { isAuthenticated, requireRole } = require('../middleware/auth');

// Public endpoint: get user's posts (no auth)
router.get('/:id/posts', getUserPosts);

// All user management routes are admin-only
router.use(isAuthenticated, requireRole('admin'));

router.post('/', createUser);
router.get('/', listUsers);
router.get('/grouped-by-interests', groupedByInterests);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;