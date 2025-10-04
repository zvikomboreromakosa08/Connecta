// backend/routes/messages.js

const express = require('express');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const auth = require('../middleware/auth');
// Assume aiController exports a function named 'summarizeMessage'
const { summarizeMessage } = require('../controllers/aiController'); 
const router = express.Router();

// ------------------------------------
// AI-powered message priority analysis (simple keyword check)
// This is a local helper function and not part of the router exports
// ------------------------------------
async function analyzeMessagePriority(content) {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'immediate'];
    const highPriorityKeywords = ['important', 'action required', 'deadline', 'review', 'approval'];

    const lowerContent = content.toLowerCase();

    if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
        return 'urgent';
    } else if (highPriorityKeywords.some(keyword => lowerContent.includes(keyword))) {
        return 'high';
    }

    return 'medium';
}

// ------------------------------------
// @route   POST /api/messages/channel/:channelId
// @desc    Send a message to a channel
// @access  Private
// ------------------------------------
router.post('/channel/:channelId', auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content, messageType, encrypted } = req.body;
        const currentUserId = req.user.userId; // Use userId from the auth middleware

        // 1. Check if channel exists and user is a member
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }
        if (!channel.members.includes(currentUserId)) {
            return res.status(403).json({ error: 'Not authorized to post in this channel' });
        }

        // 2. Create the message instance
        const message = new Message({
            content,
            sender: currentUserId,
            channel: channelId,
            messageType: messageType || 'text', // Use new messageType field
            encrypted: encrypted || false // Use new encrypted field
        });

        // 3. AI Analysis (Immediate check for priority)
        if (content && content.length > 50) {
            message.priority = await analyzeMessagePriority(content);
        }

        await message.save();
        await message.populate('sender', 'name profilePicture'); // Populate necessary sender fields

        // 4. AI Summary (Run asynchronously for long messages)
        if (content && content.length > 200) {
            // Use setTimeout to avoid blocking the user response, but be aware this is non-blocking and the
            // summary update happens later in the database.
            setTimeout(async () => {
                try {
                    const summary = await summarizeMessage(content);
                    message.aiSummary = summary;
                    await message.save();
                    // In a production app, you would emit a socket event here to update the client with the summary.
                    console.log(`AI Summary generated for message ${message._id}`);
                } catch (summaryError) {
                    console.error('AI Summary generation failed:', summaryError.message);
                }
            }, 1000);
        }

        // 5. Respond to user
        res.status(201).json(message);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error sending channel message' });
    }
});

// ------------------------------------
// @route   GET /api/messages/channel/:channelId
// @desc    Get paginated messages from a channel (Updated to use pagination)
// @access  Private
// ------------------------------------
router.get('/channel/:channelId', auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const currentUserId = req.user.userId;

        // 1. Check channel and user membership
        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        // Use a more robust check: a private channel MUST include the user in members
        if (channel.isPrivate && !channel.members.includes(currentUserId)) {
             return res.status(403).json({ error: 'Not authorized to view this channel' });
        }
        // If public, no membership check is strictly needed, but it's assumed the client filters by available channels.
        // For simplicity, we only block unauthorized access to private channels here.

        // 2. Fetch paginated messages
        const messages = await Message.find({ channel: channelId })
            .populate('sender', 'name profilePicture')
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(limit)
            .skip(skip);

        // Reverse the array to send messages in chronological order (oldest first)
        res.json(messages.reverse());
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message || 'Server error fetching channel messages' });
    }
});

// ------------------------------------
// @route   POST /api/messages/direct/:userId
// @desc    Send a direct message (DM)
// @access  Private
// ------------------------------------
router.post('/direct/:userId', auth, async (req, res) => {
    try {
        const { userId: recipientId } = req.params;
        const { content, encrypted } = req.body;
        const currentUserId = req.user.userId;

        // Note: Direct messages don't typically require a channel model check,
        // but we should ensure the recipient user exists.
        // A check for the recipient user is omitted here but is recommended.

        const message = new Message({
            content,
            sender: currentUserId,
            recipient: recipientId,
            isDirectMessage: true,
            encrypted: encrypted || false
        });

        await message.save();

        // Populate sender and recipient for the client response
        await message.populate('sender', 'name profilePicture');
        await message.populate('recipient', 'name profilePicture');

        res.status(201).json(message);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error sending direct message' });
    }
});

// ------------------------------------
// @route   GET /api/messages/direct/:userId
// @desc    Get paginated direct messages history between two users
// @access  Private
// ------------------------------------
router.get('/direct/:userId', auth, async (req, res) => {
    try {
        const { userId: otherUserId } = req.params;
        const currentUserId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Query messages where:
        // 1. Sender is current user AND recipient is other user (outbound)
        // OR
        // 2. Sender is other user AND recipient is current user (inbound)
        const messages = await Message.find({
            isDirectMessage: true, // Ensure we only get DMs
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        })
        .populate('sender', 'name profilePicture')
        .populate('recipient', 'name profilePicture')
        .sort({ createdAt: -1 }) // Newest first for pagination
        .limit(limit)
        .skip(skip);

        // Reverse for chronological display on the client (oldest first)
        res.json(messages.reverse());
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: error.message || 'Server error fetching direct messages' });
    }
});

module.exports = router;