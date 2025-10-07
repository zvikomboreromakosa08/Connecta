// backend/routes/conferencing.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRealMeeting,
  getMeetingDetails,
  joinMeeting
} = require('../controllers/realConferencingController');

// ------------------------------------
// @route   POST /api/conferencing/create
// @desc    Create a real meeting
// @access  Private
// ------------------------------------
router.post('/create', auth, createRealMeeting);

// ------------------------------------
// @route   GET /api/conferencing/:meetingId
// @desc    Get meeting details
// @access  Private
// ------------------------------------
router.get('/:meetingId', auth, getMeetingDetails);

// ------------------------------------
// @route   POST /api/conferencing/:meetingId/join
// @desc    Join a meeting
// @access  Private
// ------------------------------------
router.post('/:meetingId/join', auth, joinMeeting);

module.exports = router;
