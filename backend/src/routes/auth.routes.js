const express = require('express');
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.patch('/profile', auth, authController.updateProfile);

module.exports = router; 