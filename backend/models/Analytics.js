// backend/models/Analytics.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  // Timestamp of the event
  timestamp: { type: Date, default: Date.now, required: true },

  // Metadata about the request or action
  metadata: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    userAgent: { type: String },
    ip: { type: String }
  },

  // Performance and status info
  responseTime: { type: Number, required: true }, // in milliseconds
  statusCode: { type: Number, required: true },

  // Event type classification
  eventType: {
    type: String,
    enum: ['api_call', 'message_sent', 'meeting_created', 'user_login'],
    default: 'api_call',
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// TTL index for automatic expiration after 30 days
analyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Analytics', analyticsSchema);
