const Meeting = require('../models/Meeting');
const { v4: uuidv4 } = require('uuid');

exports.createMeeting = async (req, res) => {
  try {
    const { title, description, scheduledTime, participants, channelId } = req.body;
    const hostId = req.user.userId;

    const meeting = new Meeting({
      title,
      description,
      scheduledTime,
      host: hostId,
      participants,
      channel: channelId,
      meetingId: uuidv4(),
      status: 'scheduled'
    });

    await meeting.save();
    
    // Integrate with real video conferencing service (e.g., Daily.co, Zoom)
    const videoCallData = await this.createVideoCall(meeting.meetingId);

    res.status(201).json({
      ...meeting.toJSON(),
      joinUrl: videoCallData.joinUrl,
      hostUrl: videoCallData.hostUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createVideoCall = async (meetingId) => {
  // Implementation for Daily.co API
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`
    },
    body: JSON.stringify({
      name: meetingId,
      privacy: 'public',
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        e2ee_encryption: true // Enable E2E encryption for video calls :cite[1]
      }
    })
  });

  const data = await response.json();
  return {
    joinUrl: data.url,
    hostUrl: data.url
  };
};