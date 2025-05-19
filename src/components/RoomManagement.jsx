import React from 'react';

const RoomManagement = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredEditingRooms,
  filteredViewingRooms,
  roomCode,
  setRoomCode,
  handleJoinRoom
}) => {
  return (
    <div className="popup-container">
      <h2 className="text-2xl font-bold mb-4">Room Management</h2>
      
      <div className="room-tabs">
        <button
          onClick={() => setActiveTab('editingRooms')}
          className={`tab ${activeTab === 'editingRooms' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Editing Rooms
        </button>
        <button
          onClick={() => setActiveTab('viewingRooms')}
          className={`tab ${activeTab === 'viewingRooms' ? 'active' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-1 w-1 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Viewing Rooms
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input pl-10"
        />
      </div>

      <div className="rooms-list">
        {activeTab === 'editingRooms' ? (
          <>
            <h3 className="text-lg font-semibold mb-3">My Editing Rooms</h3>
            {filteredEditingRooms.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No editing rooms found</p>
            ) : (
              filteredEditingRooms.map(room => (
                <div 
                  key={room._id} 
                  className="room-item"
                  onClick={() => {
                    setRoomCode(room.name);
                    handleJoinRoom();
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{room.name}</h4>
                      <p className="text-sm text-gray-500">Editor Access</p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-3">My Viewing Rooms</h3>
            {filteredViewingRooms.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No viewing rooms found</p>
            ) : (
              filteredViewingRooms.map(room => (
                <div 
                  key={room._id} 
                  className="room-item"
                  onClick={() => {
                    setRoomCode(room.name);
                    handleJoinRoom();
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{room.name}</h4>
                      <p className="text-sm text-gray-500">Viewer Access</p>
                    </div>

                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className="room-actions">
        <input
          type="text"
          placeholder="Enter room name to join"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button onClick={handleJoinRoom} className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
          Join Room
        </button>
      </div>
    </div>
  );
};

export default RoomManagement; 