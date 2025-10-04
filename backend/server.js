// server.js

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Load environment variables from .env file

// Import routes
const authRoutes = require('./routes/auth');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const conferencingRoutes = require('./routes/conferencing');
const aiController = require('./controllers/aiController'); // Assuming this is an exported Router

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        // Use environment variable for a specific origin or default to a safe value
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

// Security and performance middleware
app.use(helmet()); // Set various HTTP headers for security
app.use(compression()); // Compress response bodies for performance
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000" // Use a more restrictive CORS setup for API requests
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies, increased limit for potential file uploads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Database connection
// Use process.env for the MongoDB URI, falling back to a default
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecta', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Note: useCreateIndex and useFindAndModify are default true in newer Mongoose versions,
    // so they are often omitted now.
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conferencing', conferencingRoutes);
app.use('/api/ai', aiController); // New route for AI features

// Socket.io for real-time features
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a channel/room
    socket.on('join-channel', (channelId) => {
        // Leave any previous room to ensure only one channel is active at a time for simple apps
        // A more complex app might allow multiple rooms. For this implementation, we just join.
        socket.join(channelId);
        console.log(`Socket ${socket.id} joined channel ${channelId}`);
    });

    // Send a message to all others in the channel (room)
    socket.on('send-message', (data) => {
        // Broadcast the message to all clients in the channel *except* the sender
        socket.to(data.channelId).emit('new-message', data);
        // If you want the sender to also receive the message (e.g., for immediate UI update confirmation), use:
        // io.to(data.channelId).emit('new-message', data);
    });

    // User status update (e.g., typing, online/offline)
    socket.on('user-status', (data) => {
        // Broadcast the status to all *other* connected clients
        socket.broadcast.emit('status-update', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Keep the old 'leave_channel' and 'send_message' logic for compatibility/clarity
    // The new events 'join-channel', 'send-message' (new-message emit) are preferred
    // and replace the functionality of 'join_channel', 'leave_channel', 'send_message' (receive_message emit)
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Connecta server running on port ${PORT}`);
});