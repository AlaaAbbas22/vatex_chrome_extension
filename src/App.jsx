import { useState, useEffect, useRef } from "react";
import "./App.css";
import "./index.css";
import AuthRequired from "./components/AuthRequired";
import RoomManagement from "./components/RoomManagement";
import RoomContent from "./components/RoomContent";
import PushToTalkManager from "./utils/pushToTalk";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isInRoom, setIsInRoom] = useState(false);
  const [editingRooms, setEditingRooms] = useState([]);
  const [viewingRooms, setViewingRooms] = useState([]);
  const [activeTab, setActiveTab] = useState("editingRooms");
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [latex, setLatex] = useState("");
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const pushToTalkRef = useRef(null);
  const isEmittingTextRef = useRef(false);
  const handledRequestIds = new Set();

  useEffect(() => {
    // Initialize push-to-talk when component mounts
    pushToTalkRef.current = new PushToTalkManager({
      onStartRecording: () => {
        setIsPushToTalkActive(true);
      },
      onStopRecording: () => {
        setIsPushToTalkActive(false);
      },
      onError: (error) => {
        console.error("❌ Push-to-talk error:", error);
        setIsPushToTalkActive(false);
      },
      serverUrl: "http://127.0.0.1:5000",
    });

    pushToTalkRef.current.init();

    // Check authentication status when component mounts
    window.postMessage(
      {
        type: "FROM_PAGE_CHECK_AUTH",
        message: { type: "checkAuth" },
      },
      "*"
    );

    const messageHandler = (event) => {
      if (event.source !== window) return;

      // Handle authentication check response
      if (event.data.type === "FROM_EXTENSION_CHECK_AUTH") {
        const response = event.data.response;
        setIsAuthenticated(response.isAuthenticated);
        if (!response.isAuthenticated) {
          setIsInRoom(false);
        }
        return;
      }

      // Check for authentication errors in any response
      if (
        event.data.response &&
        event.data.response.error === "Not authenticated"
      ) {
        setIsAuthenticated(false);
        setIsInRoom(false);
        setError("Session expired. Please login again.");
        return;
      }

      if (event.data.type === "FROM_EXTENSION_FETCH_ROOMS") {
        const response = event.data.response;
        if (
          response.success &&
          response.data.editingRooms != { error: "Not authenticated" }
        ) {
          setEditingRooms(response.data.editingRooms);
          setViewingRooms(response.data.viewingRooms);
        }
      }

      if (event.data.type === "FROM_EXTENSION_JOIN_ROOM") {
        const response = event.data.response;
        if (response.success) {
          setRole(response.data.role);
          setRoomName(response.data.roomName || roomCode);
          setIsInRoom(true);
          setError("");
          // Store current room ID for push-to-talk
          window.currentRoomId = roomCode;
          // Initialize socket when joining room
          window.postMessage(
            {
              type: "FROM_PAGE_INIT_SOCKET",
              message: {
                type: "initSocket",
                roomId: roomCode,
              },
            },
            "*"
          );
        } else {
          setError("Failed to join room");
        }
      }

      if (event.data.type === "FROM_EXTENSION_SOCKET_LATEX") {
        setLatex(event.data.data);
      }

      if (event.data.type === "FROM_EXTENSION_SOCKET_TEXT") {
        const { text, username } = event.data.data;
        if (
          username !== localStorage.getItem("username") &&
          !isEmittingTextRef.current
        ) {
          setText(text);
        }
        // Reset the flag after processing
        isEmittingTextRef.current = false;
      }

      // Handle transcription response from push-to-talk
      if (event.data.type === "FROM_EXTENSION_TRANSCRIBE_AUDIO") {
        const { response } = event.data;

        // Deduplicate by requestId if present
        if (response.requestId) {
          if (handledRequestIds.has(response.requestId)) return;
          handledRequestIds.add(response.requestId);
        }
        if (
          response &&
          response.success &&
          response.text &&
          response.text.trim()
        ) {
          // Append transcribed text to current text
          setText((prevText) => {
            const newText = prevText
              ? `${prevText} ${response.text}`
              : response.text;

            // Set flag to prevent socket loop
            isEmittingTextRef.current = true;

            // Emit the updated text to the room
            window.postMessage(
              {
                type: "FROM_PAGE_EMIT_TEXT",
                message: {
                  type: "emitText",
                  text: newText,
                  roomId: roomCode,
                },
              },
              "*"
            );

            return newText;
          });
        }
      }
    };

    window.addEventListener("message", messageHandler);

    // Fetch rooms when component mounts
    window.postMessage(
      {
        type: "FROM_PAGE_FETCH_ROOMS",
        message: { type: "fetchRooms" },
      },
      "*"
    );

    return () => {
      window.removeEventListener("message", messageHandler);
      if (window.MathJax) {
        window.MathJax.typesetClear();
      }
      // Cleanup push-to-talk
      if (pushToTalkRef.current) {
        pushToTalkRef.current.destroy();
      }
    };
  }, [roomCode]);

  const filteredEditingRooms = editingRooms.filter((room) =>
    room?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredViewingRooms = viewingRooms.filter((room) =>
    room?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = async (e) => {
    try {
      e.preventDefault();
    } catch (err) {
      setError("Failed to join room");
    }

    try {
      window.postMessage(
        {
          type: "FROM_PAGE_JOIN_ROOM",
          message: {
            type: "joinRoom",
            roomCode,
          },
        },
        "*"
      );
    } catch (err) {
      setError("Failed to join room");
    }
  };

  const handleContentChange = (value) => {
    const newText = value;
    setText(newText);
    window.postMessage(
      {
        type: "FROM_PAGE_EMIT_TEXT",
        message: {
          type: "emitText",
          text: newText,
          roomId: roomCode,
        },
      },
      "*"
    );
  };

  if (!isAuthenticated) {
    return (
      <>
        <br />
        <AuthRequired />
      </>
    );
  }

  if (!isInRoom) {
    return (
      <>
        <br />
        <RoomManagement
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredEditingRooms={filteredEditingRooms ?? []}
          filteredViewingRooms={filteredViewingRooms ?? []}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          handleJoinRoom={handleJoinRoom}
        />
      </>
    );
  }

  return (
    <>
      <br />
      <RoomContent
        room={{
          name: roomName || roomCode,
        }}
        userRole={role}
        latexContent={latex}
        text={text}
        setLatexContent={handleContentChange}
        handleLeaveRoom={() => {
          setIsInRoom(false);
        }}
        isPushToTalkActive={isPushToTalkActive}
      />
    </>
  );
}

export default App;
