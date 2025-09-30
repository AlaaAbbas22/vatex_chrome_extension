/**
 * @file config.js
 * @description Configuration settings for the extension
 * @date 2025-09-07
 */

const config = {
  // API endpoints
  apiUrl: "http://localhost:5000",
  clientUrl: "http://localhost:3000",
  transcriptionUrl: "http://127.0.0.1:5000",

  // Socket.io settings
  socketOptions: {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    transports: ["websocket", "polling"],
  },

  // Cookie settings
  cookieName: "connect.sid",
};

export default config;
