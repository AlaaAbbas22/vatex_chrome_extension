let socket = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'login') {
    fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request.data)
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  if (request.type === 'fetchRooms') {
    Promise.all([
      fetch('http://localhost:5000/myrooms', {
        credentials: 'include'
      }),
      fetch('http://localhost:5000/viewablerooms', {
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
    fetch(`http://localhost:5000/rooms/${request.roomCode}/role`, {
      method: 'GET',
      credentials: 'include'
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (request.type === 'initSocket') {
    socket = io('http://localhost:5000', {
      withCredentials: true
    });

    socket.on('connect', () => {
      socket.emit('authenticate');
    });

    socket.on('authenticated', () => {
      socket.emit('join-room', request.roomId);
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
    return true;
  }

  if (request.type === 'emitText') {
    if (socket) {
      socket.emit('send-text', request.text, request.roomId);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Socket not initialized' });
    }
    return true;
  }
});