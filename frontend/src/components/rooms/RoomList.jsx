import { useState, useEffect } from 'react';
import { PlusCircle, DoorOpen, Users, Trash2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomModal from './RoomModal';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const { socket } = useSocketContext();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    console.group('Room List Debug');
    console.log('Rooms:', rooms);
    console.log('Auth User:', authUser);
    rooms.forEach((room, index) => {
      console.log(`Room ${index}:`, {
        id: room._id,
        name: room.name,
        creator: room.creator,
        creatorType: typeof room.creator,
        authUserType: typeof authUser._id
      });
    });
    console.groupEnd();
  }, [rooms, authUser]);

  useEffect(() => {
    if (authUser) {
      fetchRooms();
    } else {
      navigate('/login');
    }
  }, [authUser, navigate]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = () => {
      fetchRooms();
    };

    const handleRoomDeleted = (deletedRoomId) => {
      setRooms(prev => prev.filter(room => room._id !== deletedRoomId));
      toast.success('Room deleted successfully');
    };

    socket.on('roomUpdate', handleRoomUpdate);
    socket.on('roomDeleted', handleRoomDeleted);
    window.addEventListener('roomsUpdated', handleRoomUpdate);

    return () => {
      socket.off('roomUpdate', handleRoomUpdate);
      socket.off('roomDeleted', handleRoomDeleted);
      window.removeEventListener('roomsUpdated', handleRoomUpdate);
    };
  }, [socket]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/rooms/user-rooms');
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRoomCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Room code copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy room code:', err);
      toast.error('Failed to copy room code');
    });
  };

  const handleRoomClick = (roomId) => {
    navigate(`/rooms/${roomId}`);
  };

  const handleCreateRoom = () => {
    setModalMode('create');
    setModalOpen(true);
  };

  const handleJoinRoom = () => {
    setModalMode('join');
    setModalOpen(true);
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      console.group('Delete Room Comprehensive Debug');
      console.log('Attempting to delete room:', {
        roomId,
        currentUser: {
          id: authUser?._id,
          fullName: authUser?.fullName
        }
      });

      const room = rooms.find(r => r._id === roomId);
      
      if (!room) {
        console.error('Room not found');
        toast.error('Room not found');
        return;
      }

      // Explicit creator check
      const isCreator = 
        String(room.creator?._id || room.creator) === String(authUser?._id || authUser);

      if (!isCreator) {
        console.error('Unauthorized: Not room creator');
        toast.error('You are not authorized to delete this room');
        return;
      }

      const confirmDelete = window.confirm('Are you sure you want to delete this room? All messages will be permanently deleted.');
      
      if (confirmDelete) {
        console.log('User confirmed deletion');
        
        try {
          const response = await api.delete(`/rooms/${roomId}`);
          console.log('Delete Room Response:', response);

          setRooms(prev => {
            const updatedRooms = prev.filter(r => r._id !== roomId);
            console.log('Updated Rooms:', updatedRooms);
            return updatedRooms;
          });
          
          toast.success('Room deleted successfully');
        } catch (deleteError) {
          console.error('Delete Room API Error:', deleteError);
          toast.error(deleteError.message || 'Failed to delete room');
        }
      }
    } catch (error) {
      console.error('Detailed Delete Room Error:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to delete room');
    } finally {
      console.groupEnd();
    }
  };

  if (!authUser) return null;

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white mb-3">Your Rooms</h2>
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleCreateRoom}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm font-medium"
          >
            <PlusCircle size={18} />
            Create Room
          </button>
          <button
            onClick={handleJoinRoom}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            <DoorOpen size={18} />
            Join Room
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>You haven't joined any rooms yet.</p>
          <p>Create a new room or join an existing one!</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-2 h-[calc(100vh-50px)] overflow-y-auto pb-32">
          {rooms.map((room) => (
            <div
              key={room._id}
              className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-3">
                {room.avatar ? (
                  <img
                    src={room.avatar}
                    alt={room.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                    <Users className="text-gray-400" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 w-full">
                      <h3 className="text-white font-medium truncate flex-grow">{room.name}</h3>
                      {(() => {
                        // Explicit type conversion and comparison
                        const isCreator = String(room.creator) === String(authUser._id);
                        console.log(`Room ${room.name} Creator Check:`, {
                          roomCreator: room.creator,
                          authUserId: authUser._id,
                          isCreator
                        });
                        
                        return isCreator ? (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoom(room._id);
                            }} 
                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-red-100/20"
                            title="Delete Room"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null;
                      })()}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center flex-shrink-0">
                      <Users size={12} className="mr-1" />
                      {room.members.length}
                    </span>
                  </div>
                  {room.description && (
                    <p className="text-sm text-gray-400 truncate">
                      {room.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="card-actions justify-between items-center mt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="opacity-70" />
                    <span>{room.members.length} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs opacity-70">Code:</span>
                    <div className="badge badge-primary badge-sm flex items-center">
                      <span className="mr-1">{room.code}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRoomCode(room.code);
                        }}
                        className="btn btn-xs btn-ghost btn-circle"
                        title="Copy Room Code"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(() => {
                    // Comprehensive creator check with logging
                    const isCreator = 
                      (room.creator?._id || room.creator) && 
                      (authUser?._id || authUser) && 
                      String(room.creator?._id || room.creator) === String(authUser?._id || authUser);

                    console.group('Room Delete Option Debug');
                    console.log('Room Creator Check:', {
                      roomCreator: room.creator,
                      authUser: authUser,
                      isCreator: isCreator
                    });
                    console.groupEnd();

                    return isCreator ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room._id);
                        }} 
                        className="btn btn-error btn-sm"
                        title="Delete Room"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    ) : null;
                  })()}
                  <button 
                    onClick={() => navigate(`/rooms/${room._id}`)} 
                    className="btn btn-primary btn-sm"
                  >
                    <DoorOpen size={16} /> Enter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </div>
  );
};

export default RoomList;
