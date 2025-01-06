const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config/config');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    res.status(400).json({
      error: 'Registration failed',
      details: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    res.status(400).json({
      error: 'Login failed',
      details: error.message
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(400).json({
      error: 'Failed to get profile',
      details: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'password', 'preferences'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    res.status(400).json({
      error: 'Update failed',
      details: error.message
    });
  }
}; 