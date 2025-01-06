const express = require('express');
const entriesController = require('../controllers/entries.controller');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Voice memo specific routes
router.post('/voice/upload-url', entriesController.getUploadUrl);
router.post('/voice', upload.single('audio'), entriesController.createEntry);

// Regular CRUD operations
router.post('/', entriesController.createEntry);
router.get('/', entriesController.getEntries);
router.get('/stats', entriesController.getStats);
router.get('/:id', entriesController.getEntry);
router.patch('/:id', entriesController.updateEntry);
router.delete('/:id', entriesController.deleteEntry);

module.exports = router; 