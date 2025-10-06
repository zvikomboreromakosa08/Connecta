const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { E2EEncryption } = require('../utils/encryption');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, title, department } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate E2E encryption keys for the user
    const e2e = new E2EEncryption();
    const { publicKey, privateKey } = e2e.generateKeyPair();

    // Create user with encryption keys
    const user = new User({
      name,
      email,
      password,
      title,
      department,
      encryptionKeys: {
        publicKey,
        privateKey: await bcrypt.hash(privateKey, 12) // Encrypt private key
      }
    });

    await user.save();

    // Generate auth token
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        title: user.title,
        department: user.department,
        publicKey: user.encryptionKeys.publicKey
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Update user status
    user.availabilityStatus = 'online';
    user.lastSeen = new Date();
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        title: user.title,
        department: user.department,
        profilePicture: user.profilePicture,
        availabilityStatus: user.availabilityStatus,
        publicKey: user.encryptionKeys.publicKey
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};