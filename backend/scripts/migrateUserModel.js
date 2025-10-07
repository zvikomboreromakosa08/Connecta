require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const migrateUserModel = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      {}, 
      { 
        $set: { 
          'encryptionKeys.publicKey': '',
          'encryptionKeys.privateKey': '',
          'availabilityStatus': 'online',
          'customStatus': '',
          'lastSeen': new Date(),
          'isAdmin': false,
          'twoFactorSecret': '',
          'title': 'Employee',
          'profilePicture': ''
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} users`);
    
    const users = await User.find({});
    console.log('Sample user after migration:', users[0]);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

migrateUserModel();
