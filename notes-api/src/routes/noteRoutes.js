const express = require('express');
const router = express.Router();
const {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { isAuthenticated } = require('../middleware/auth');

// All note routes require authentication
router.use(isAuthenticated);

router.post('/', createNote);
router.get('/', listNotes);
router.get('/:id', getNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;