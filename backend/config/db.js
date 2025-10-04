// backend/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use the updated environment variable key: MONGODB_URI
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Note: useCreateIndex and useFindAndModify are default true in newer Mongoose versions and are omitted here.
        });

        // Log the successful connection with the host for better visibility
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // Log the error message clearly
        console.error('❌ Database connection error:', error.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;