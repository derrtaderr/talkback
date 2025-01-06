const express = require('express');
const entriesController = require('../controllers/entries.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// CRUD operations
router.post('/', entriesController.createEntry);
router.get('/', entriesController.getEntries);
router.get('/stats', entriesController.getStats);
router.get('/:id', entriesController.getEntry);
router.patch('/:id', entriesController.updateEntry);
router.delete('/:id', entriesController.deleteEntry);

module.exports = router; 