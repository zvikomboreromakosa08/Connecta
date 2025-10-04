// backend/models/Message.js

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDirectMessage: {
        type: Boolean,
        default: false
    },
    encrypted: {
        type: Boolean,
        default: false
    },
    // New field to store the specific key used to encrypt *this* message
    encryptionKey: {
        type: String
    },
    // New field to define the content type of the message
    messageType: {
        type: String,
        // Expanded enum to support different types of content and system messages
        enum: ['text', 'file', 'image', 'system', 'alert'],
        default: 'text'
    },
    // New field for storing an AI-generated summary (e.g., for long messages)
    aiSummary: {
        type: String
    },
    // New field to define the importance level of the message
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Retaining the recipients array from the original schema for group direct messages
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// --- Schema Indexes for Performance ---

// Index for fetching channel history efficiently (sorting by most recent first)
MessageSchema.index({ channel: 1, createdAt: -1 });

// Index for fetching direct message history efficiently
// (Covers both sender-to-recipient and recipient-to-sender queries)
MessageSchema.index({ isDirectMessage: 1, sender: 1, recipient: 1 });

module.exports = mongoose.model('Message', MessageSchema);