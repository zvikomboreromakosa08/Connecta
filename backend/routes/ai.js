// backend/routes/ai.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { summarizeMeeting, prioritizeNotifications } = require('../controllers/aiController');

// AI Summarization
router.post('/:meetingId/summarize', auth, summarizeMeeting);

// AI Notification Prioritization
router.post('/notifications/prioritize', auth, prioritizeNotifications);

module.exports = router;
