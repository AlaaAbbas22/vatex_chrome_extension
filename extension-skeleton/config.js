/**
 * @file config.js
 * @description Configuration settings for the extension
 * @date 2025-09-07
 */

const config = {
  // API endpoints
  apiUrl: "https://vatex.onrender.com",
  clientUrl: "https://vatex.vercel.app",

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
