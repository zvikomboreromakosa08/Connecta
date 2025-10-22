const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

// ✅ REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password, title, department } = req.body;

    if (!name || !email || !password || !title || !department) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists with this email' 
      });
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    const user = new User({
      name,
      email,
      password,
      title,
      department,
      clerkId: crypto.randomUUID(), // ✅ this fixes your duplicate key crash
      encryptionKeys: {
        publicKey,
        privateKey: await bcrypt.hash(privateKey, 12)
      }
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        title: user.title,
        department: user.department,
        profilePicture: user.profilePicture,
        publicKey: user.encryptionKeys.publicKey
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during registration' 
    });
  }
};

// ✅ LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    user.availabilityStatus = 'online';
    user.lastSeen = new Date();
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
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
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
};

// ✅ GET USER PROFILE
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -encryptionKeys.privateKey -twoFactorSecret');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
};

// ✅ UPDATE STATUS
exports.updateStatus = async (req, res) => {
  try {
    const { status, customStatus } = req.body;
    const validStatuses = ['online', 'offline', 'away', 'busy', 'do-not-disturb'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { availabilityStatus: status, customStatus: customStatus || '', lastSeen: new Date() },
      { new: true }
    ).select('-password -encryptionKeys.privateKey -twoFactorSecret');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const io = req.app.get('io');
    io.emit('user-status-update', {
      userId: user._id,
      availabilityStatus: user.availabilityStatus,
      customStatus: user.customStatus,
      lastSeen: user.lastSeen
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

// ✅ LOGOUT
exports.logout = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { availabilityStatus: 'offline', lastSeen: new Date() },
      { new: true }
    );
    if (user) {
      const io = req.app.get('io');
      io.emit('user-status-update', {
        userId: user._id,
        availabilityStatus: 'offline',
        lastSeen: user.lastSeen
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Failed to logout' });
  }
};
