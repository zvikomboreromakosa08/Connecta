// backend/routes/messages.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import real controller functions
const { 
    sendMessage, 
    getChannelMessages, 
    sendDirectMessage, 
    getDirectMessages 
} = require('../controllers/messageController');

// ------------------------------------
// Real messaging routes
// ------------------------------------

// Send a message to a channel
router.post('/channel/:channelId', auth, sendMessage);

// Get paginated messages from a channel
router.get('/channel/:channelId', auth, getChannelMessages);

// Send a direct message (DM)
router.post('/direct/:userId', auth, sendDirectMessage);

// Get paginated direct messages history between two users
router.get('/direct/:userId', auth, getDirectMessages);

module.exports = router;
