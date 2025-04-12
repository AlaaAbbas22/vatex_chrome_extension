// Import Socket.IO client properly
// We need to use the CDN version since service workers have limitations
import "./socket.io.min.js"
import config from "./config.js"

let socket = null;
let sessionId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Add new handler for checking authentication
  if (request.type === 'checkAuth') {
    chrome.cookies.get({url: config.clientUrl, name: config.cookieName}, (cookie) => {
      if (cookie && cookie.value) {
        sessionId = cookie.value; // Store the session ID for later use
        sendResponse({ success: true, isAuthenticated: true });
      } else {
        sendResponse({ success: true, isAuthenticated: false });
      }
    });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'login') {
    fetch(`${config.apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request.data)
    })
    .then(response => {
      return response.json();
    })
    .then(data => {sendResponse({ success: true, data }); })
    .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  if (request.type === 'fetchRooms') {
    Promise.all([
      fetch(`${config.apiUrl}/myrooms`, {
        credentials: 'include'
      }),
      fetch(`${config.apiUrl}/viewablerooms`, {
        credentials: 'include'
      })
    ])
    .then(async ([editingResponse, viewingResponse]) => {
      const editingRooms = await editingResponse.json();
      const viewingRooms = await viewingResponse.json();
      sendResponse({ 
        success: true, 
        data: { editingRooms, viewingRooms } 
      });
    })
    .catch(error => sendResponse({ 
      success: false, 
      error: error.message 
    }));
    return true;
  }
  if (request.type === 'joinRoom') {
    fetch(`${config.apiUrl}/rooms/${request.roomCode}/role`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (request.type === 'initSocket') {
    console.log('Socket initialized0');

    // Get cookies before initializing socket
    chrome.cookies.get({url: config.clientUrl, name: config.cookieName}, async (cookie) => {
      // Store session ID for future use
      sessionId = cookie.value;
      
      // Format cookies for the header
      socket = io(config.apiUrl, config.socketOptions);
      console.log('Socket initialized', socket.connected);

      socket.on('connect', () => {
        console.log('Connected to server', sessionId);
        socket.emit('authenticate', sessionId);
      });

      // Rest of the socket event handlers
      socket.on('authenticated', () => {
        console.log('Authenticated');
        socket.emit('join-room', request.roomId, sessionId);
      });

      socket.on('receive-text', (latex) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'FROM_SOCKET_LATEX',
          data: latex
        });
      });

      socket.on('receive-original', (text, username) => {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: 'FROM_SOCKET_TEXT',
          data: { text, username }
        });
      });

      sendResponse({ success: true });
    });
    
    return true;
  }

  if (request.type === 'emitText') {
    if (socket) {
      socket.emit('send-text', request.text, request.roomId, sessionId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Socket not initialized' });
    }
    return true;
  }
});