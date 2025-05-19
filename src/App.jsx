import { useState, useEffect } from 'react'
import './App.css'
import config from './config.js'
import { MathJax, MathJaxContext } from 'better-react-mathjax'
import LatexDisplayer from './Latex.jsx'


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [role, setRole] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [editingRooms, setEditingRooms] = useState([])
  const [viewingRooms, setViewingRooms] = useState([])
  const [activeTab, setActiveTab] = useState('editingRooms')
  const [searchQuery, setSearchQuery] = useState('')
  const [text, setText] = useState('')
  const [latex, setLatex] = useState('')

  useEffect(() => {
    // Check authentication status when component mounts
    window.postMessage({
      type: 'FROM_PAGE_CHECK_AUTH',
      message: { type: 'checkAuth' }
    }, '*');

    const messageHandler = (event) => {
      
      if (event.source !== window) return;
      
      // Handle authentication check response
      if (event.data.type === 'FROM_EXTENSION_CHECK_AUTH') {
        const response = event.data.response;
        setIsAuthenticated(response.isAuthenticated);
        if (!response.isAuthenticated) {
          setIsInRoom(false);
        }
        return;
      }
      
      // Check for authentication errors in any response
      if (event.data.response && event.data.response.error === "Not authenticated") {
        setIsAuthenticated(false);

        setIsInRoom(false);
        setError("Session expired. Please login again.");
        return;
      }
      
      if (event.data.type === 'FROM_EXTENSION_FETCH_ROOMS') {
        const response = event.data.response;
        
        if (response.success && response.data.editingRooms != {error: 'Not authenticated'}) {
          console.log(response)
          //setEditingRooms(response.data.editingRooms)
          //setViewingRooms(response.data.viewingRooms)
        }
      }
      
      if (event.data.type === 'FROM_EXTENSION_LOGIN') {
        
        const response = event.data.response;
        if (response.success) {
          setError('')
        } else {
          setError('Invalid username or password')
        }
      }
      
      if (event.data.type === 'FROM_EXTENSION_JOIN_ROOM') {
        console.log(event)
        const response = event.data.response;
        if (response.success) {
          setRole(response.data.role)
          setIsInRoom(true)
          setError('')
          // Initialize socket when joining room
          window.postMessage({
            type: 'FROM_PAGE_INIT_SOCKET',
            message: {
              type: 'initSocket',
              roomId: roomCode
            }
          }, '*');
        } else {
          setError('Failed to join room')
        }
      }

      if (event.data.type === 'FROM_EXTENSION_SOCKET_LATEX') {
        console.log('Received LaTeX update:', event.data.data);
        setLatex(event.data.data);
      }

      if (event.data.type === 'FROM_EXTENSION_SOCKET_TEXT') {
        const { text, username } = event.data.data;
        if (username !== localStorage.getItem('username')) {
          setText(text);
        }
      }
    };

    window.addEventListener('message', messageHandler);
    
    // Fetch rooms when component mounts
    window.postMessage({
      type: 'FROM_PAGE_FETCH_ROOMS',
      message: { type: 'fetchRooms' }
    }, '*');

    return () => {
      window.removeEventListener('message', messageHandler);
      // Cleanup MathJax when component unmounts
      if (window.MathJax) {
        window.MathJax.typesetClear();
      }
    };
  }, [roomCode]); // Add roomCode to dependencies

  const filteredEditingRooms = editingRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViewingRooms = viewingRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    try {
      window.postMessage({
        type: 'FROM_PAGE_JOIN_ROOM',
        message: {
          type: 'joinRoom',
          roomCode
        }
      }, '*');
    } catch (err) {
      setError('Failed to join room')
    }
  }

  const handleContentChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    window.postMessage({
      type: 'FROM_PAGE_EMIT_TEXT',
      message: {
        type: 'emitText',
        text: newText,
        roomId: roomCode
      }
    }, '*');
  };



  if (!isAuthenticated) {
    return (
      <div className="popup-container">
        <h2>Authentication Required</h2>
        <p>Please login to the main application first.</p>
        <a href={config.clientUrl} target="_blank" rel="noopener noreferrer" className="login-link">
          Go to Login Page
        </a>
      </div>
    )
  }

  

  if (!isInRoom) {
    return (
      <div className="popup-container">
        <h2>Room Management</h2>
        <div className="room-tabs">
          <button
            onClick={() => setActiveTab('editingRooms')}
            className={`tab ${activeTab === 'editingRooms' ? 'active' : ''}`}
          >
            Editing Rooms
          </button>
          <button
            onClick={() => setActiveTab('viewingRooms')}
            className={`tab ${activeTab === 'viewingRooms' ? 'active' : ''}`}
          >
            Viewing Rooms
          </button>
        </div>

        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <div className="rooms-list">
          {activeTab === 'editingRooms' ? (
            <>
              <h3>My Editing Rooms</h3>
              {filteredEditingRooms.map(room => (
                <div 
                  key={room._id} 
                  className="room-item"
                  onClick={() => {
                    setRoomCode(room.name);
                    handleJoinRoom();
                  }}
                >
                  {room.name}
                </div>
              ))}
            </>
          ) : (
            <>
              <h3>My Viewing Rooms</h3>
              {filteredViewingRooms.map(room => (
                <div 
                  key={room._id} 
                  className="room-item"
                  onClick={() => {
                    setRoomCode(room.name);
                    handleJoinRoom();
                  }}
                >
                  {room.name}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="room-actions">
          <input
            type="text"
            placeholder="Room name"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  if (isInRoom) {
    return (
      <div className="popup-container">
        <h2>Room: {roomCode} Role: {role}</h2>
        <div className="content-area">
          {role === 'editor' ? (
            <>
              <textarea
                className="editor-textarea"
                value={text}
                onChange={handleContentChange}
                placeholder="Start typing here... "
              />
              {latex && (
                <div className="latex-preview">
                  <h3>Preview:</h3>
                  <div className="latex-content">
                    <LatexDisplayer latex={latex} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="viewer-content">
              <div className="text-content">
                {text || 'No content yet'}
              </div>
              {latex && (
                <div className="latex-preview">
                  <h3>Preview:</h3>
                  <div className="latex-content">
                    
                    <LatexDisplayer latex={latex} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App
