// backend/models/User.js - Fixed and compatible with registration
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },

  title: { type: String, required: true },
  department: { type: String, required: true },
  profilePicture: { type: String, default: '' },

  // Real encryption key management (not required on registration)
  encryptionKeys: {
    publicKey: { type: String, default: null },
    privateKey: { type: String, default: null } // stored encrypted
  },

  // User status management
  availabilityStatus: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy', 'do-not-disturb'],
    default: 'online'
  },
  customStatus: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now },

  // Admin and security
  isAdmin: { type: Boolean, default: false },
  twoFactorSecret: { type: String },

  // Audit fields
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },

  // Optional: for Clerk or external integrations
  clerkId: { type: String, default: null }
}, { 
  timestamps: true 
});

// 🔐 Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// 🔏 Encrypt private key before saving (if it exists)
userSchema.pre('save', async function(next) {
  if (!this.isModified('encryptionKeys.privateKey')) return next();
  if (this.encryptionKeys.privateKey) {
    this.encryptionKeys.privateKey = await bcrypt.hash(
      this.encryptionKeys.privateKey,
      12
    );
  }
  next();
});

// 🔑 Generate encryption keys automatically if missing
userSchema.pre('save', function(next) {
  if (!this.encryptionKeys.publicKey || !this.encryptionKeys.privateKey) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.encryptionKeys = { publicKey, privateKey };
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
