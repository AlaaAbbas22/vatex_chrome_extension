/**
 * @file config.js
 * @description Configuration settings for the extension
 * @date 2025-09-07
 */

const config = {
  // API endpoints
  apiUrl: "http://localhost:5000",
  clientUrl: "http://localhost:3000",

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
