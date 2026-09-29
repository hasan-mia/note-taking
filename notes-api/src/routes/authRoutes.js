const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
} = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', isAuthenticated, getMe);

module.exports = router;