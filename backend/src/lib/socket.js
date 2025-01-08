import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://127.0.0.1:5173", 
      "https://chatty-frontend-p6tt.onrender.com"
    ],
    credentials: true
  },
  pingTimeout: 60000
});

// Map to store online users and their socket IDs
const userSocketMap = new Map();
// Map to store room memberships
const roomMemberships = new Map();
// Map to store typing users in each room
const typingUsers = new Map();

export const getOnlineUsers = () => {
  return Array.from(userSocketMap.keys());
};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap.get(receiverId);
};

export const getRoomMembers = (roomId) => {
  return roomMemberships.get(roomId) || new Set();
};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (!userId) {
    console.log("No userId provided for socket connection");
    return;
  }

  // Add user to online users
  userSocketMap.set(userId, socket.id);
  
  // Broadcast online users to all connected clients
  io.emit("getOnlineUsers", getOnlineUsers());

  // Handle room joining
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    
    // Track room membership
    if (!roomMemberships.has(roomId)) {
      roomMemberships.set(roomId, new Set());
    }
    roomMemberships.get(roomId).add(userId);
    
    // Notify room about new member
    io.to(roomId).emit("roomMembers", Array.from(roomMemberships.get(roomId)));
    
    // Clear any existing typing status for this user in this room
    if (typingUsers.has(roomId)) {
      const roomTypingUsers = typingUsers.get(roomId);
      roomTypingUsers.delete(userId);
      const typingUsersArray = Array.from(roomTypingUsers.values());
      io.to(roomId).emit("userTyping", typingUsersArray);
    }
  });

  // Handle room leaving
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    
    // Update room membership
    if (roomMemberships.has(roomId)) {
      roomMemberships.get(roomId).delete(userId);
      if (roomMemberships.get(roomId).size === 0) {
        roomMemberships.delete(roomId);
      } else {
        // Notify remaining members
        io.to(roomId).emit("roomMembers", Array.from(roomMemberships.get(roomId)));
      }
    }
    
    // Clear typing status when user leaves
    if (typingUsers.has(roomId)) {
      const roomTypingUsers = typingUsers.get(roomId);
      roomTypingUsers.delete(userId);
      const typingUsersArray = Array.from(roomTypingUsers.values());
      io.to(roomId).emit("userTyping", typingUsersArray);
    }
  });

  // Handle typing indicators for rooms
  socket.on("roomTyping", ({ roomId, isTyping }) => {
    socket.to(roomId).emit("roomUserTyping", {
      userId,
      isTyping
    });
  });

  // Handle typing status
  socket.on("typing", ({ roomId, user, isTyping }) => {
    if (!typingUsers.has(roomId)) {
      typingUsers.set(roomId, new Map());
    }
    
    const roomTypingUsers = typingUsers.get(roomId);
    if (isTyping) {
      roomTypingUsers.set(user._id, user);
    } else {
      roomTypingUsers.delete(user._id);
    }
    
    // Convert Map to array for sending
    const typingUsersArray = Array.from(roomTypingUsers.values());
    console.log(`Typing users in room ${roomId}:`, typingUsersArray);
    
    // Broadcast to everyone in the room
    io.to(roomId).emit("userTyping", typingUsersArray);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    
    if (userId) {
      userSocketMap.delete(userId);
      
      // Clear typing status from all rooms
      typingUsers.forEach((users, roomId) => {
        users.delete(userId);
        const typingUsersArray = Array.from(users.values());
        io.to(roomId).emit("userTyping", typingUsersArray);
      });
    }
  });

  // Handle explicit logout
  socket.on("logout", () => {
    // Leave all rooms
    for (const [roomId, members] of roomMemberships.entries()) {
      if (members.has(userId)) {
        members.delete(userId);
        socket.leave(roomId);
        if (members.size > 0) {
          io.to(roomId).emit("roomMembers", Array.from(members));
        }
      }
    }
    
    userSocketMap.delete(userId);
    io.emit("getOnlineUsers", getOnlineUsers());
    socket.disconnect();
  });

  // Handle reconnection attempts
  socket.on("reconnect_attempt", () => {
    console.log("Reconnection attempt by user:", userId);
  });

  // Handle successful reconnection
  socket.on("reconnect", () => {
    console.log("User reconnected:", userId);
    userSocketMap.set(userId, socket.id);
    io.emit("getOnlineUsers", getOnlineUsers());
  });
});

export { io, app, server, userSocketMap };
