// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import real controller functions
const { register, login, getMe, updateStatus } = require('../controllers/authController');

// ------------------------------------
// Real Authentication Routes
// ------------------------------------

// Register a new user
router.post('/register', register);

// Login a user
router.post('/login', login);

// Get logged-in user details
router.get('/me', auth, getMe);

// Update user availability status
router.put('/status', auth, updateStatus);

module.exports = router;
