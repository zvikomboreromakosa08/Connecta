// backend/models/Meeting.js
const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  // Meeting basics
  title: { type: String, required: true },
  description: { type: String },
  scheduledTime: { type: Date, required: true },

  // Host and participants
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  channel: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Channel' 
  },

  // Unique meeting identifiers & status
  meetingId: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled'
  },

  // URLs for joining and recordings
  joinUrl: { type: String },
  hostUrl: { type: String },
  recordingUrl: { type: String },

  // AI & tracking data
  summary: { type: String },
  transcript: { type: String },
  duration: { type: Number }, // Duration in minutes
}, {
  timestamps: true // Auto-manage createdAt and updatedAt
});

module.exports = mongoose.model('Meeting', meetingSchema);
