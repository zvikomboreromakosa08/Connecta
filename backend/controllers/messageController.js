const Message = require('../models/Message');
const Channel = require('../models/Channel');
const { E2EEncryption } = require('../utils/encryption');
const User = require('../models/User');

exports.sendMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, encrypted, recipientId } = req.body;
    const senderId = req.user.userId;

    // Verify channel access
    const channel = await Channel.findById(channelId);
    if (!channel.members.includes(senderId)) {
      return res.status(403).json({ error: 'Not a member of this channel' });
    }

    let encryptedContent = null;
    let encryptionKey = null;

    // Implement E2E encryption if needed :cite[1]
    if (encrypted && recipientId) {
      const [sender, recipient] = await Promise.all([
        User.findById(senderId),
        User.findById(recipientId)
      ]);

      const e2e = new E2EEncryption();
      const sharedSecret = await e2e.deriveSharedSecret(
        sender.encryptionKeys.privateKey,
        recipient.encryptionKeys.publicKey
      );

      encryptedContent = e2e.encryptMessage(content, sharedSecret);
      encryptionKey = sharedSecret.toString('base64');
    }

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

    // Real socket.io emission for real-time messaging
    req.app.get('io').to(channelId).emit('new-message', message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await Message.find({ channel: channelId })
      .populate('sender', 'name profilePicture availabilityStatus')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};