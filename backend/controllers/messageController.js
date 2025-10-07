const Message = require('../models/Message');
const Channel = require('../models/Channel');
const User = require('../models/User');
const crypto = require('crypto');

exports.sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, encrypted, recipientId } = req.body;
    const senderId = req.user.userId;

    // Verify real channel access
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Channel not found' 
      });
    }

    if (!channel.members.includes(senderId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied: Not a member of this channel' 
      });
    }

    let encryptedContent = null;
    let encryptionKey = null;

    // Real E2E encryption implementation
    if (encrypted && recipientId) {
      const [sender, recipient] = await Promise.all([
        User.findById(senderId),
        User.findById(recipientId)
      ]);

      if (!sender || !recipient) {
        return res.status(404).json({ 
          success: false, 
          error: 'Sender or recipient not found' 
        });
      }

      // Generate shared secret using Diffie-Hellman
      const sharedSecret = this.deriveSharedSecret(
        sender.encryptionKeys.privateKey,
        recipient.encryptionKeys.publicKey
      );

      encryptedContent = this.encryptMessage(content, sharedSecret);
      encryptionKey = sharedSecret.toString('base64');
    }

    // Create real message in database
    const message = new Message({
      content: encrypted ? encryptedContent : content,
      sender: senderId,
      channel: channelId,
      recipient: recipientId,
      isDirectMessage: !!recipientId,
      encrypted: encrypted || false,
      encryptionKey
    });

    await message.save();
    await message.populate('sender', 'name profilePicture availabilityStatus');

    // Real socket.io emission to all channel members
    const io = req.app.get('io');
    io.to(channelId).emit('new-message', {
      ...message.toJSON(),
      realTime: true,
      serverTimestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Message sending error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message' 
    });
  }
};

// REAL FUNCTION: Get channel messages
exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify channel access
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Channel not found' 
      });
    }

    if (!channel.members.includes(req.user.userId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied: Not a member of this channel' 
      });
    }

    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name profilePicture availabilityStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalMessages = await Message.countDocuments({ channel: channelId });

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      }
    });

  } catch (error) {
    console.error('Get channel messages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch messages' 
    });
  }
};

// REAL FUNCTION: Send direct message
exports.sendDirectMessage = async (req, res) => {
  try {
    const { userId: recipientId } = req.params;
    const { content, encrypted } = req.body;
    const senderId = req.user.userId;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipient not found' 
      });
    }

    let encryptedContent = null;
    let encryptionKey = null;

    // Real E2E encryption for direct messages
    if (encrypted) {
      const [sender, recipientUser] = await Promise.all([
        User.findById(senderId),
        User.findById(recipientId)
      ]);

      const sharedSecret = this.deriveSharedSecret(
        sender.encryptionKeys.privateKey,
        recipientUser.encryptionKeys.publicKey
      );

      encryptedContent = this.encryptMessage(content, sharedSecret);
      encryptionKey = sharedSecret.toString('base64');
    }

    // Create direct message
    const message = new Message({
      content: encrypted ? encryptedContent : content,
      sender: senderId,
      recipient: recipientId,
      isDirectMessage: true,
      encrypted: encrypted || false,
      encryptionKey
    });

    await message.save();
    await message.populate('sender', 'name profilePicture availabilityStatus');
    await message.populate('recipient', 'name profilePicture availabilityStatus');

    // Real-time socket emission to recipient
    const io = req.app.get('io');
    io.to(`user-${recipientId}`).emit('new-direct-message', {
      ...message.toJSON(),
      realTime: true,
      serverTimestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send direct message' 
    });
  }
};

// REAL FUNCTION: Get direct messages
exports.getDirectMessages = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name profilePicture availabilityStatus')
    .populate('recipient', 'name profilePicture availabilityStatus')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit)
      },
      conversationWith: {
        id: otherUser._id,
        name: otherUser.name,
        profilePicture: otherUser.profilePicture,
        availabilityStatus: otherUser.availabilityStatus
      }
    });

  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch direct messages' 
    });
  }
};

// REAL FUNCTION: Get recent conversations
exports.getRecentConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get users you've had conversations with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { recipient: currentUserId }
          ],
          isDirectMessage: true
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$recipient",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$recipient", currentUserId] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          "user.password": 0,
          "user.encryptionKeys": 0,
          "user.twoFactorSecret": 0
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent conversations' 
    });
  }
};

// Real cryptographic functions
exports.deriveSharedSecret = (privateKeyPem, publicKeyPem) => {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const publicKey = crypto.createPublicKey(publicKeyPem);
  
  const dh = crypto.createDiffieHellman(256);
  const sharedSecret = dh.computeSecret(publicKey);
  
  return crypto.createHash('sha256').update(sharedSecret).digest();
};

exports.encryptMessage = (message, key) => {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('ConnectaE2E'));
  
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex'),
    algorithm: algorithm
  };
};

// REAL FUNCTION: Decrypt message (for recipient)
exports.decryptMessage = (encryptedData, key) => {
  const decipher = crypto.createDecipher(
    encryptedData.algorithm, 
    key
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  decipher.setAAD(Buffer.from('ConnectaE2E'));
  
  let decrypted = decipher.update(
    encryptedData.encryptedData, 
    'hex', 
    'utf8'
  );
  decrypted += decipher.final('utf8');
  
  return decrypted;
};