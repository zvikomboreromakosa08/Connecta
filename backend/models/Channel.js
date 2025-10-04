// backend/models/Channel.js

const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Keep 'unique: true' for channels like public chat rooms
        trim: true // Add trim to remove whitespace
    },
    description: {
        type: String,
        default: ''
        // The adjustment simplified this to just 'String', but keeping 'default: ''' for robustness
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // New field to track channel administrators
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // New field for the channel's encryption key (for E2E encryption features)
    encryptionKey: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Channel', ChannelSchema);