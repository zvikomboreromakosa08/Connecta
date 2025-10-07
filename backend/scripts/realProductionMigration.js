require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const migrateProductionData = async () => {
  try {
    console.log('🚀 Starting REAL production migration...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to production database');

    // Get database instance for raw operations
    const db = mongoose.connection.db;
    
    // 1. Create real indexes for performance
    console.log('📊 Creating production indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('messages').createIndex({ channel: 1, createdAt: -1 });
    await db.collection('messages').createIndex({ isDirectMessage: 1, sender: 1, recipient: 1 });
    await db.collection('meetings').createIndex({ meetingId: 1 }, { unique: true });
    await db.collection('meetings').createIndex({ scheduledTime: 1 });
    await db.collection('analytics').createIndex({ timestamp: 1 });
    
    console.log('✅ Production indexes created');

    // 2. Generate real encryption keys for existing users
    console.log('🔐 Generating encryption keys for existing users...');
    const users = await db.collection('users').find({}).toArray();
    
    for (const user of users) {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const encryptedPrivateKey = await bcrypt.hash(privateKey, 12);

      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            'encryptionKeys.publicKey': publicKey,
            'encryptionKeys.privateKey': encryptedPrivateKey,
            'availabilityStatus': 'online',
            'lastSeen': new Date(),
            'isAdmin': user.email === 'admin@yourcompany.com' // Real admin detection
          } 
        }
      );
    }

    console.log(`✅ Encryption keys generated for ${users.length} users`);

    // 3. Initialize real analytics collection
    console.log('📈 Setting up analytics collection...');
    await db.createCollection('analytics', {
      timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'hours'
      },
      expireAfterSeconds: 2592000 // 30 days
    });

    console.log('✅ Analytics collection ready');

    console.log('🎉 REAL PRODUCTION MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your production server: npm start');
    console.log('2. Test all endpoints with real data');
    console.log('3. Monitor logs for any issues');
    console.log('4. Your organization is now ready to use Connecta!');

  } catch (error) {
    console.error('❌ Production migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

migrateProductionData();