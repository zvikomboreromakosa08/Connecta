// backend/routes/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Note: You must create this file in '../middleware/auth'
const auth = require('../middleware/auth');
const router = express.Router();

// ------------------------------------
// @route   POST /api/auth/register
// @desc    Register user and get token
// @access  Public
// ------------------------------------
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, title, department } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 2. Create new user instance (password hashing handled by Mongoose pre-save hook)
        const user = new User({
            name,
            email,
            password,
            title,
            department,
            // Set initial status and lastSeen
            availabilityStatus: 'online',
            lastSeen: new Date()
        });

        await user.save();

        // 3. Generate JWT
        const token = jwt.sign(
            // Updated payload structure to use 'userId'
            { userId: user._id },
            process.env.JWT_SECRET,
            // Extended expiration to '7d'
            { expiresIn: '7d' }
        );

        // 4. Return token and necessary user data
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                title: user.title,
                department: user.department,
                profilePicture: user.profilePicture,
                availabilityStatus: user.availabilityStatus
            }
        });
    } catch (error) {
        console.error(error.message);
        // Use JSON for error response consistency
        res.status(500).json({ error: error.message || 'Server error during registration' });
    }
});

// ------------------------------------
// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
// ------------------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // 2. Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 4. Update user status on successful login
        user.availabilityStatus = 'online';
        user.lastSeen = new Date();
        // Use save() instead of findByIdAndUpdate to trigger potential pre/post hooks
        await user.save();

        // 5. Return token and necessary user data
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                title: user.title,
                department: user.department,
                profilePicture: user.profilePicture,
                availabilityStatus: user.availabilityStatus
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error during login' });
    }
});

// ------------------------------------
// @route   GET /api/auth/me
// @desc    Get logged in user data
// @access  Private (requires auth middleware)
// ------------------------------------
router.get('/me', auth, async (req, res) => {
    try {
        // req.user.userId is set by the 'auth' middleware
        const user = await User.findById(req.user.userId).select('-password -twoFactorSecret -encryptionKeys.privateKey');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error fetching user data' });
    }
});

// ------------------------------------
// @route   PUT /api/auth/status
// @desc    Update user availability status
// @access  Private (requires auth middleware)
// ------------------------------------
router.put('/status', auth, async (req, res) => {
    try {
        const { status, customStatus } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                // Set the new availability status
                availabilityStatus: status,
                // Update custom status (allow it to be cleared by passing null or undefined)
                customStatus: customStatus || '',
                // Update lastSeen to reflect the activity
                lastSeen: new Date()
            },
            { new: true } // Return the updated document
        ).select('-password -twoFactorSecret -encryptionKeys.privateKey'); // Exclude sensitive fields

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Server error updating user status' });
    }
});

module.exports = router;