import React from "react";
import LatexDisplayer from "../Latex";
import DrawingBoard from "./DrawingBoard";

const RoomContent = ({
  room,
  userRole,
  latexContent,
  text,
  setLatexContent,
  handleLeaveRoom,
  isPushToTalkActive,
  inputMode,
  setInputMode,
  store,
  editorRef,
  onDrawingChange,
}) => {
  return (
    <div className="popup-container">
      <div className="room-header">
        <span>
          <span
            className="text-xl font-bold"
            style={{
              width: "100px",
            }}
          >
            <strong>Room:</strong> {room?.name ?? room}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <strong>Role:</strong> {userRole === "editor" ? "Editor" : "Viewer"}
          </span>

          {/* Push-to-talk status indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              isPushToTalkActive
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <svg
              className={`w-3 h-3 ${isPushToTalkActive ? "animate-pulse" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              {isPushToTalkActive ? "Recording..." : "Hold Ctrl to speak"}
            </span>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-[20px]"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{
                width: "25px",
              }}
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </span>
      </div>

      {userRole === "editor" && (
        <div className="editor-section mb-[50px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-2 w-2 text-gray-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{
                  width: "50px",
                }}
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <h3 className="text-lg font-semibold">
                {inputMode === "text" ? "LaTeX Editor" : "Drawing Board"}
              </h3>
            </div>

            {/* Input Mode Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setInputMode("text")}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  inputMode === "text"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block w-4 h-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Text
              </button>
              <button
                onClick={() => setInputMode("drawing")}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  inputMode === "drawing"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block w-4 h-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Draw
              </button>
            </div>
          </div>

          {inputMode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setLatexContent(e.target.value)}
              placeholder="Enter LaTeX content here..."
              className="latex-editor"
            />
          ) : (
            <DrawingBoard
              store={store}
              editorRef={editorRef}
              onDrawingChange={onDrawingChange}
            />
          )}
        </div>
      )}

      <div className="preview-section">
        <div className="flex items-center gap-2 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-2 w-2 text-gray-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{
              width: "50px",
            }}
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-lg font-semibold">Preview</h3>
        </div>
        <div className="latex-preview">
          <LatexDisplayer latex={latexContent} />
        </div>
      </div>
    </div>
  );
};

export default RoomContent;
