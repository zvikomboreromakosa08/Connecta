// backend/controllers/realConferencingController.js

const Meeting = require('../models/Meeting');
const dailyService = require('../services/dailyService');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a real meeting with persistent record and actual Daily room
 */
exports.createRealMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime, participants, channelId, isPrivate } = req.body;
    const hostId = req.user.userId;

    // Create meeting record
    const meeting = new Meeting({
      title,
      description,
      scheduledTime: scheduledTime || new Date(),
      host: hostId,
      participants: participants || [],
      channel: channelId || null,
      meetingId: uuidv4(),
      status: 'scheduled'
    });

    // Create Daily.co or real video conference room
    const videoCallData = await dailyService.createMeeting({
      roomName: `connecta-${meeting.meetingId}`,
      isPrivate: !!isPrivate,
      duration: 3600, // 1 hour
      maxParticipants: 50,
      encryptMeeting: true,
      recordMeeting: false
    });

    // Attach video call data
    meeting.joinUrl = videoCallData.joinUrl;
    meeting.hostUrl = videoCallData.hostUrl;

    await meeting.save();
    await meeting.populate('host', 'name email profilePicture');

    res.status(201).json({
      success: true,
      meeting: {
        ...meeting.toJSON(),
        joinUrl: videoCallData.joinUrl,
        hostUrl: videoCallData.hostUrl
      }
    });
  } catch (error) {
    console.error('❌ Meeting creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting with video conference'
    });
  }
};

/**
 * Get details for a specific meeting
 */
exports.getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId })
      .populate('host', 'name email profilePicture')
      .populate('participants', 'name email profilePicture availabilityStatus');

    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    res.json({ success: true, meeting });
  } catch (error) {
    console.error('❌ getMeetingDetails error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Join an existing meeting (adds user to participants + notifies via socket)
 */
exports.joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.userId;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    // Add participant if not already present
    if (!meeting.participants.includes(userId)) {
      meeting.participants.push(userId);
      await meeting.save();
    }

    // Real-time broadcast via Socket.io
    const io = req.app.get('io');
    io.to(`meeting-${meetingId}`).emit('user-joined', {
      userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      meeting
    });
  } catch (error) {
    console.error('❌ joinMeeting error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
