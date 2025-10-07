// backend/server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const conferencingRoutes = require('./routes/conferencing');
const aiRoutes = require('./routes/ai'); // ✅ Confirmed export
const analyticsMiddleware = require('./middleware/analytics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: 'Too many requests from this IP, try again later.'
});
app.use(limiter);

// Analytics Middleware
app.use(analyticsMiddleware);

// -----------------------------
// MongoDB Connection
// -----------------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecta', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// -----------------------------
// Routes
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conferencing', conferencingRoutes);
app.use('/api/ai', aiRoutes); // ✅ Correct middleware registration

// -----------------------------
// Socket.io Events
// -----------------------------
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('send-message', (messageData) => {
    const timestamp = new Date();
    socket.to(messageData.channelId).emit('new-message', {
      ...messageData,
      timestamp,
      id: Date.now().toString()
    });
  });

  socket.on('join-meeting', (meetingId) => {
    const roomName = `meeting-${meetingId}`;
    socket.join(roomName);
    socket.to(roomName).emit('user-joined', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  socket.on('user-status', (data) => {
    socket.broadcast.emit('status-update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach socket.io instance globally
app.set('io', io);

// -----------------------------
// Start Server
// -----------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Connecta backend running on port ${PORT}`);
  console.log('✅ Real features enabled: Video Conferencing, AI, Analytics');
});
