// Environment configuration
module.exports = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/connecta',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  
  // Cloud Services
  CLOUD_PROVIDER: process.env.CLOUD_PROVIDER || 'google',
  
  // Feature Flags
  FEATURES: {
    AI_SUMMARIZATION: process.env.AI_SUMMARIZATION !== 'false',
    E2E_ENCRYPTION: process.env.E2E_ENCRYPTION !== 'false',
    VIDEO_CONFERENCING: process.env.VIDEO_CONFERENCING !== 'false'
  }
};