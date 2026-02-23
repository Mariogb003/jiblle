import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  apiSecret: process.env.API_SECRET,
  jibble: {
    apiKeyId: process.env.JIBBLE_API_KEY_ID,
    apiKeySecret: process.env.JIBBLE_API_KEY_SECRET,
    authUrl: process.env.JIBBLE_AUTH_URL || 'https://identity.prod.jibble.io/connect/token',
    workspaceUrl: process.env.JIBBLE_WORKSPACE_URL || 'https://workspace.prod.jibble.io/v1',
    timeTrackingUrl: process.env.JIBBLE_TIME_TRACKING_URL || 'https://time-tracking.prod.jibble.io/v1',
    attendanceUrl: process.env.JIBBLE_ATTENDANCE_URL || 'https://time-attendance.prod.jibble.io/v1',
  },
};