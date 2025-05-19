import { useState, useEffect } from 'react'
import './App.css'
import config from './config.js'
import AuthRequired from './components/AuthRequired'
import RoomManagement from './components/RoomManagement'
import RoomContent from './components/RoomContent'

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
          setEditingRooms(response.data.editingRooms)
          setViewingRooms(response.data.viewingRooms)
        }
      }
      
      if (event.data.type === 'FROM_EXTENSION_JOIN_ROOM') {
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

    return () => {
      window.removeEventListener('message', messageHandler);
      if (window.MathJax) {
        window.MathJax.typesetClear();
      }
    };
  }, [roomCode]);

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
    return <AuthRequired />;
  }

  if (!isInRoom) {
    return (
      <RoomManagement
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredEditingRooms={filteredEditingRooms}
        filteredViewingRooms={filteredViewingRooms}
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        handleJoinRoom={handleJoinRoom}
      />
    );
  }

  return (
    <RoomContent
      roomCode={roomCode}
      role={role}
      text={text}
      latex={latex}
      handleContentChange={handleContentChange}
    />
  );
}

export default App;
