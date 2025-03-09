import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    const messageHandler = (event) => {
      console.log(event)
      if (event.source !== window) return;
      
      if (event.data.type === 'FROM_EXTENSION_FETCH_ROOMS') {
        const response = event.data.response;
        if (response.success) {
          setEditingRooms(response.data.editingRooms)
          setViewingRooms(response.data.viewingRooms)
        }
      }
      
      if (event.data.type === 'FROM_EXTENSION_LOGIN') {
        
        const response = event.data.response;
        if (response.success) {
          setIsLoggedIn(true)
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

    return () => window.removeEventListener('message', messageHandler);
  }, [roomCode]); // Add roomCode to dependencies

  const filteredEditingRooms = editingRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViewingRooms = viewingRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      window.postMessage({
        type: 'FROM_PAGE_LOGIN',
        message: {
          type: 'login',
          data: { username, password }
        }
      }, '*');
    } catch (err) {
      console.log(err)
      setError('Invalid username or password')
    }
  }

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

  if (!isLoggedIn) {
    return (
      <div className="popup-container">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    )
  }

  if (isLoggedIn && !isInRoom) {
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

  if (isLoggedIn && isInRoom) {
    return (
      <div className="popup-container">
        <h2>Room: {roomCode}</h2>
        <div className="content-area">
          {role === 'editor' ? (
            <textarea
              className="editor-textarea"
              value={text}
              onChange={handleContentChange}
              placeholder="Start typing here..."
            />
          ) : (
            <div className="viewer-content">
              <div className="text-content">
                {text || 'No content yet'}
              </div>
              {latex && (
                <div className="latex-preview">
                  <h3>Preview:</h3>
                  <div className="latex-content">
                    {latex}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Remove the duplicate isLoggedIn check at the end
}

export default App
