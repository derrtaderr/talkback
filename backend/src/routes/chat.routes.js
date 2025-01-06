const express = require('express');
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Chat routes
router.post('/message', chatController.chat);
router.get('/analysis', chatController.getPatternAnalysis);

module.exports = router; 