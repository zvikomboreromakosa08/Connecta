// backend/monitoring/setup.js
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// LogRocket setup (for frontend - add to your frontend code)
const logRocketConfig = `
// frontend/monitoring.js
import LogRocket from 'logrocket';
LogRocket.init(process.env.LOGROCKET_APP_ID);

// Identify users for session tracking
export const identifyUser = (user) => {
  LogRocket.identify(user.id, {
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role || 'user'
  });
};
`;

module.exports = { Sentry, logRocketConfig };