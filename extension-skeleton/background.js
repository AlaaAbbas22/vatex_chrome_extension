/**
 * @file background.js
 * @description Background worker for handling server requests and socket connections
 * @date 2025-09-07
 */

// Import Socket.IO client properly
// We need to use the CDN version since service workers have limitations
import "./socket.io.min.js";
import config from "./config.js";

// Global variables for socket connection and session management
let socket = null;
let sessionId = null;

/**
 * Main message listener for handling all extension communication
 * Routes different request types to their respective handlers
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Route to appropriate handler based on request type
  switch (request.type) {
    case "checkAuth":
      return handleCheckAuth(request, sender, sendResponse);
    case "login":
      return handleLogin(request, sender, sendResponse);
    case "fetchRooms":
      return handleFetchRooms(request, sender, sendResponse);
    case "joinRoom":
      return handleJoinRoom(request, sender, sendResponse);
    case "initSocket":
      return handleInitSocket(request, sender, sendResponse);
    case "emitText":
      return handleEmitText(request, sender, sendResponse);
    default:
      sendResponse({ success: false, error: "Unknown request type" });
      return false;
  }
});

/**
 * Handles authentication check by verifying session cookie
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleCheckAuth(request, sender, sendResponse) {
  chrome.cookies.get(
    { url: config.clientUrl, name: config.cookieName },
    (cookie) => {
      if (cookie && cookie.value) {
        sessionId = cookie.value; // Store the session ID for later use
        sendResponse({ success: true, isAuthenticated: true });
      } else {
        sendResponse({ success: true, isAuthenticated: false });
      }
    }
  );
  return true; // Will respond asynchronously
}

/**
 * Handles user login by sending credentials to the API
 * @param {Object} request - The request object containing login data
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleLogin(request, sender, sendResponse) {
  fetch(`${config.apiUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request.data),
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      sendResponse({ success: true, data });
    })
    .catch((error) => sendResponse({ success: false, error: error.message }));
  return true; // Will respond asynchronously
}

/**
 * Fetches both editing and viewing rooms for the authenticated user
 * @param {Object} request - The request object
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleFetchRooms(request, sender, sendResponse) {
  Promise.all([
    fetch(`${config.apiUrl}/myrooms`, {
      credentials: "include",
    }),
    fetch(`${config.apiUrl}/viewablerooms`, {
      credentials: "include",
    }),
  ])
    .then(async ([editingResponse, viewingResponse]) => {
      const editingRooms = await editingResponse.json();
      const viewingRooms = await viewingResponse.json();
      sendResponse({
        success: true,
        data: { editingRooms, viewingRooms },
      });
    })
    .catch((error) =>
      sendResponse({
        success: false,
        error: error.message,
      })
    );
  return true;
}

/**
 * Handles joining a room by checking user's role in the room
 * @param {Object} request - The request object containing roomCode
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleJoinRoom(request, sender, sendResponse) {
  fetch(`${config.apiUrl}/rooms/${request.roomCode}/role`, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => response.json())
    .then((data) => {
      sendResponse({ success: true, data });
    })
    .catch((error) => sendResponse({ success: false, error: error.message }));
  return true;
}

/**
 * Initializes socket connection and sets up event listeners
 * @param {Object} request - The request object containing roomId
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleInitSocket(request, sender, sendResponse) {
  // Get cookies before initializing socket
  chrome.cookies.get(
    { url: config.clientUrl, name: config.cookieName },
    async (cookie) => {
      // Store session ID for future use
      sessionId = cookie.value;

      // Initialize socket connection
      socket = io(config.apiUrl, config.socketOptions);

      // Set up socket event listeners
      setupSocketEventListeners(sender, request.roomId);

      sendResponse({ success: true });
    }
  );

  return true;
}

/**
 * Sets up all socket event listeners for real-time communication
 * @param {Object} sender - The sender object containing tab information
 * @param {string} roomId - The room ID to join
 */
function setupSocketEventListeners(sender, roomId) {
  socket.on("connect", () => {
    socket.emit("authenticate", sessionId);
  });

  socket.on("authenticated", () => {
    socket.emit("join-room", roomId, sessionId);
  });

  socket.on("receive-text", (latex) => {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "FROM_SOCKET_LATEX",
      data: latex,
    });
  });

  socket.on("receive-original", (text, username) => {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "FROM_SOCKET_TEXT",
      data: { text, username },
    });
  });
}

/**
 * Handles sending text updates to the server via socket
 * @param {Object} request - The request object containing text and roomId
 * @param {Object} sender - The sender object containing tab information
 * @param {Function} sendResponse - Callback function to send response
 * @returns {boolean} - Always returns true for async response
 */
function handleEmitText(request, sender, sendResponse) {
  if (socket) {
    socket.emit("send-text", request.text, request.roomId, sessionId);
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: "Socket not initialized" });
  }
  return true;
}
