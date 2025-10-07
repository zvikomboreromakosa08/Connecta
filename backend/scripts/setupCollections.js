// backend/scripts/setupCollections.js
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Explicitly load .env from backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in your .env file.');
  process.exit(1); // Stop the script immediately
}

const setupCollections = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log('Setting up meeting and analytics collections...');

    // Create Meetings collection with schema validation
    await db.createCollection('meetings', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'host', 'meetingId', 'status'],
          properties: {
            title: { bsonType: 'string' },
            description: { bsonType: 'string' },
            scheduledTime: { bsonType: 'date' },
            host: { bsonType: 'objectId' },
            participants: { bsonType: 'array' },
            channel: { bsonType: 'objectId' },
            meetingId: { bsonType: 'string' },
            status: { 
              bsonType: 'string',
              enum: ['scheduled', 'ongoing', 'completed', 'cancelled']
            },
            joinUrl: { bsonType: 'string' },
            recordingUrl: { bsonType: 'string' },
            summary: { bsonType: 'string' },
            duration: { bsonType: 'int' }
          }
        }
      }
    }).catch(err => {
      if (err.codeName === 'NamespaceExists') {
        console.log('⚠️ Meetings collection already exists, skipping creation.');
      } else {
        throw err;
      }
    });

    // Create Analytics collection for user activity tracking
    await db.createCollection('analytics', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'hours'
      },
      expireAfterSeconds: 2592000 // 30 days retention
    }).catch(err => {
      if (err.codeName === 'NamespaceExists') {
        console.log('⚠️ Analytics collection already exists, skipping creation.');
      } else {
        throw err;
      }
    });

    // Create indexes for performance
    await db.collection('meetings').createIndex({ meetingId: 1 }, { unique: true });
    await db.collection('meetings').createIndex({ host: 1 });
    await db.collection('meetings').createIndex({ scheduledTime: 1 });

    await db.collection('analytics').createIndex({ 'metadata.userId': 1 });
    await db.collection('analytics').createIndex({ timestamp: 1 });

    console.log('✅ Successfully created meetings and analytics collections');

  } catch (error) {
    console.error('Collection setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

setupCollections();
