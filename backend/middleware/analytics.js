// backend/middleware/analytics.js
const Analytics = require('../models/Analytics');

const trackAnalytics = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture request data with proper null handling
  const analyticsData = {
    timestamp: new Date(),
    metadata: {
      userId: req.user?.userId || null, // Handle unauthenticated requests
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent') || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || 'Unknown'
    },
    responseTime: 0,
    statusCode: 200,
    eventType: 'api_call'
  };

  // Override res.send to capture response data
  const originalSend = res.send;
  res.send = function(data) {
    analyticsData.responseTime = Date.now() - startTime;
    analyticsData.statusCode = res.statusCode;
    
    // Save to analytics database with proper error handling
    Analytics.create(analyticsData).catch(error => {
      // Log error but don't break the application
      console.error('Analytics tracking failed:', error.message);
      // In production, you might want to use a proper logging service
    });
    
    originalSend.call(this, data);
  };

  next();
};

module.exports = trackAnalytics;