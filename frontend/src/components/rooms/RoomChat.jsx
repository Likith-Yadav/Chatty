import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader } from 'lucide-react';
import { useSocketContext } from '../../context/SocketContext';
import { useAuthStore } from '../../store/useAuthStore';
import MessageInput from '../MessageInput';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const RoomChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { socket } = useSocketContext();
  const { authUser } = useAuthStore();

  useEffect(() => {
    // If no roomId or user is not authenticated, redirect
    if (!roomId || roomId === 'undefined' || !authUser) {
      navigate('/');
      return;
    }

    const initializeRoom = async () => {
      try {
        // If roomId is 'default', fetch the first available room for the user
        const effectiveRoomId = roomId === 'default' 
          ? await fetchDefaultRoom() 
          : roomId;

        if (!effectiveRoomId) {
          toast.error('No rooms available');
          navigate('/');
          return;
        }

        await Promise.all([
          fetchRoomDetails(effectiveRoomId), 
          fetchMessages(effectiveRoomId)
        ]);
      } catch (error) {
        console.error('Failed to initialize room:', error);
        toast.error('Failed to load room');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoom();

    // Socket connection logic remains the same
    if (socket) {
      const currentRoomId = roomId === 'default' ? room?._id : roomId;
      
      if (currentRoomId) {
        console.log('Joining room:', currentRoomId);
        socket.emit('joinRoom', currentRoomId);

        socket.on('newRoomMessage', (message) => {
          if (message.sender._id !== authUser._id) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
          }
        });

        socket.on('roomMembers', (updatedMembers) => {
          setMembers(updatedMembers);
        });

        socket.on('userTyping', (users) => {
          const otherTypingUsers = Array.isArray(users) 
            ? users.filter(user => user._id !== authUser._id)
            : [];
          setTypingUsers(otherTypingUsers);
        });

        return () => {
          console.log('Leaving room:', currentRoomId);
          socket.emit('leaveRoom', currentRoomId);
          socket.off('newRoomMessage');
          socket.off('roomMembers');
          socket.off('userTyping');
        };
      }
    }
  }, [roomId, socket, authUser, navigate]);

  const fetchDefaultRoom = async () => {
    try {
      // Fetch the first room the user is a member of
      const rooms = await api.get('/rooms');
      if (rooms && rooms.length > 0) {
        return rooms[0]._id;
      }
      return null;
    } catch (error) {
      console.error('Error fetching default room:', error);
      return null;
    }
  };

  const fetchRoomDetails = async (currentRoomId) => {
    try {
      console.log('Fetching room details for:', currentRoomId);
      const data = await api.get(`/rooms/${currentRoomId}`);
      console.log('Room details:', data);
      setRoom(data);
      return data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast.error('Failed to load room details');
      navigate('/');
      throw error;
    }
  };

  const fetchMessages = async (currentRoomId) => {
    try {
      console.log('Fetching messages for room:', currentRoomId);
      const data = await api.get(`/rooms/${currentRoomId}/messages`);
      console.log('Messages:', data);
      setMessages(data);
      scrollToBottom();
      return data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
      throw error;
    }
  };

  const handleSendMessage = async (text, image) => {
    try {
      console.group('Room Message Send Debug');
      console.log('Sending message:', { 
        text, 
        image: image ? 'Image present' : 'No image',
        roomId 
      });

      // Validate inputs
      if (!text.trim() && !image) {
        console.error('No message content');
        toast.error('Please enter a message or upload an image');
        return;
      }

      const messageData = { text, image };
      const data = await api.post(`/rooms/${roomId}/messages`, messageData);
      
      console.log('Message sent successfully:', data);

      // Add the message immediately to our local state
      setMessages(prev => [...prev, data]);
      scrollToBottom();

      console.groupEnd();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      console.groupEnd();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading || !room) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-4 p-4 bg-base-200 border-b border-base-300">
        <button onClick={() => navigate('/')} className="btn btn-ghost btn-circle">
          <ArrowLeft />
        </button>
        
        {room && (
          <>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{room.name}</h2>
              <p className="text-sm opacity-70">{room.description}</p>
            </div>
            
            <button className="btn btn-ghost btn-circle">
              <Users />
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader className="animate-spin" size={40} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={message._id || index}
                className={`chat ${
                  message.sender._id === authUser._id ? 'chat-end' : 'chat-start'
                }`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      src={message.sender.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.fullName || message.sender.username)}&background=random`}
                      alt={message.sender.fullName || message.sender.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.fullName || message.sender.username)}&background=random`;
                      }}
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  {message.sender.fullName || message.sender.username}
                </div>
                <div className="chat-bubble">
                  {message.text}
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Message attachment"
                      className="mt-2 max-w-xs rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.length > 0 && (
            <div className="px-4 py-2 text-sm text-base-content/70 bg-base-200/50">
              <div className="flex items-center gap-2">
                <span className="loading loading-dots loading-xs"></span>
                {typingUsers.length === 1 ? (
                  <span>{typingUsers[0].fullName || typingUsers[0].username} is typing...</span>
                ) : typingUsers.length === 2 ? (
                  <span>{typingUsers[0].fullName || typingUsers[0].username} and {typingUsers[1].fullName || typingUsers[1].username} are typing...</span>
                ) : (
                  <span>{typingUsers.length} people are typing...</span>
                )}
              </div>
            </div>
          )}

          <MessageInput 
            key={roomId} 
            onSendMessage={(text, image) => {
              console.log('MessageInput Send Method Called', { text, image, roomId });
              return handleSendMessage(text, image);
            }} 
            roomId={roomId} 
          />
        </>
      )}
    </div>
  );
};

export default RoomChat;
