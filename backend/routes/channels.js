// backend/routes/channels.js

const express = require('express');
const Channel = require('../models/Channel');
const Message = require('../models/Message'); // Import Message model
const auth = require('../middleware/auth');
const router = express.Router();

// ------------------------------------
// @route   POST /api/channels
// @desc    Create a new channel
// @access  Private
// ------------------------------------
router.post('/', auth, async (req, res) => {
    try {
        // Note: req.user.userId is used for consistency with the new auth structure
        const currentUserId = req.user.userId;
        const { name, description, isPrivate, members = [] } = req.body;

        // 1. Check if a channel with this name already exists (optional, but good practice for unique names)
        const existingChannel = await Channel.findOne({ name });
        if (existingChannel) {
            return res.status(400).json({ error: 'A channel with this name already exists.' });
        }

        // 2. Create the channel instance
        const channel = new Channel({
            name,
            description,
            isPrivate: isPrivate || false,
            // Ensure the creator is always in the members array and is the first admin
            members: [...new Set([...members, currentUserId])], // Use Set to ensure unique members
            admins: [currentUserId],
            createdBy: currentUserId
        });

        await channel.save();

        // 3. Populate and return the channel object
        await channel.populate('members', 'name email profilePicture');

        res.status(201).json(channel);
    } catch (error) {
        // Handle Mongoose validation or other errors
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error during channel creation' });
    }
});

// ------------------------------------
// @route   GET /api/channels
// @desc    Get all public channels and private channels the user belongs to (Original route)
// @access  Private
// ------------------------------------
router.get('/', auth, async (req, res) => {
    try {
        // Retaining original logic but updated to use req.user.userId
        const channels = await Channel.find({
            $or: [
                { isPrivate: false },
                { members: req.user.userId }
            ]
        })
        .populate('members', ['name', 'email', 'profilePicture'])
        .sort({ createdAt: 1 }); // Sort by creation date

        res.json(channels);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching all channels' });
    }
});

// ------------------------------------
// @route   GET /api/channels/my-channels
// @desc    Get all channels where the authenticated user is a member
// @access  Private
// ------------------------------------
router.get('/my-channels', auth, async (req, res) => {
    try {
        const channels = await Channel.find({
            members: req.user.userId // Filter by membership
        })
        // Populate members with more details
        .populate('members', 'name email profilePicture availabilityStatus')
        // Populate admins
        .populate('admins', 'name email')
        .sort({ createdAt: -1 }); // Sort by most recently created

        res.json(channels);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error fetching user channels' });
    }
});

// ------------------------------------
// @route   GET /api/channels/:channelId/messages
// @desc    Get paginated messages for a channel
// @access  Private
// ------------------------------------
router.get('/:channelId/messages', auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Optional: Check if the user is a member of the channel before fetching messages
        const channel = await Channel.findById(channelId);
        if (!channel || !channel.members.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this channel.' });
        }

        const messages = await Message.find({ channel: channelId })
            .populate('sender', 'name profilePicture') // Only populate necessary sender fields
            .sort({ createdAt: -1 }) // Sort by newest first (to get the latest batch)
            .limit(limit)
            .skip(skip);

        // Reverse the array to send messages in chronological order (oldest first) for the client
        res.json(messages.reverse());
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error fetching channel messages' });
    }
});

// ------------------------------------
// @route   POST /api/channels/:channelId/members
// @desc    Add a member to a channel (Admin privilege required)
// @access  Private
// ------------------------------------
router.post('/:channelId/members', auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;
        const currentUserId = req.user.userId;

        const channel = await Channel.findById(channelId);

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        // 1. Authorization check: Only channel admins can add members
        // The current user must be listed in the channel's admins array
        if (!channel.admins.includes(currentUserId)) {
            return res.status(403).json({ error: 'Access denied. Only channel administrators can add members.' });
        }

        // 2. Add member (using addToSet prevents duplicate IDs)
        channel.members.addToSet(userId);
        await channel.save();

        // 3. Populate and return the updated channel object
        await channel.populate('members', 'name email profilePicture');
        res.json(channel);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error adding member to channel' });
    }
});

module.exports = router;