// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // Add trim to remove whitespace
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true // Convert email to lowercase before saving
    },
    password: {
        type: String,
        required: function() {
            // Password is required only if the user is not using OAuth
            return !this.googleId && !this.appleId;
        }
    },
    googleId: {
        type: String,
        sparse: true // Allows multiple documents to have a null value
        // The adjustment simplified this to just 'String', but keeping sparse for the index
    },
    appleId: {
        type: String,
        sparse: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        required: true // Changed from optional to required
    },
    department: {
        type: String,
        required: true // Changed from optional to required
    },
    availabilityStatus: {
        type: String,
        // Added 'do-not-disturb' to the enum list
        enum: ['online', 'offline', 'away', 'busy', 'do-not-disturb'],
        default: 'online'
    },
    customStatus: {
        type: String,
        default: ''
        // The adjustment simplified this to just 'String', but keeping default for completeness
    },
    lastSeen: {
        type: Date // New field to track the last time the user was active
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String
        // The adjustment simplified this to just 'String', no change in functionality
    },
    // New field for end-to-end encryption keys
    encryptionKeys: {
        publicKey: String,
        privateKey: String
    }
}, {
    timestamps: true
});

// --- Schema Middleware ---

/**
 * Pre-save hook to hash the user's password before saving to the database.
 * Only runs if the password field has been modified (or is new).
 */
UserSchema.pre('save', async function(next) {
    // If the password field hasn't changed, skip hashing
    if (!this.isModified('password') || !this.password) return next();

    try {
        // Hash the password using a cost factor of 12
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (err) {
        next(err);
    }
});

// --- Schema Methods ---

/**
 * Method to compare a candidate password with the stored hashed password.
 * @param {string} candidatePassword - The plain text password to check.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
    // Check if the user has a password set (i.e., not an OAuth user)
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Export the model
module.exports = mongoose.model('User', UserSchema);