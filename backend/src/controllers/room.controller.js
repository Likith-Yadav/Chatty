import Room from "../models/room.model.js";
import RoomMessage from "../models/roomMessage.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../lib/socket.js";
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export const createRoom = async (req, res) => {
  try {
    console.log('Create Room Request:', {
      body: req.body,
      user: req.user ? req.user._id : 'No user found'
    });

    // Validate required fields
    const { name, description, isPrivate } = req.body;
    if (!name) {
      console.log('Room creation failed: Missing name');
      return res.status(400).json({ error: "Room name is required" });
    }

    const creator = req.user._id;
    if (!creator) {
      console.log('Room creation failed: No authenticated user');
      return res.status(401).json({ error: "Unauthorized" });
    }

    let avatar = "";
    if (req.body.avatar) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(req.body.avatar, {
          folder: "chat_room_avatars",
          resource_type: "auto"
        });
        avatar = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        // Continue without avatar
      }
    }

    // Generate unique room code
    const code = uuidv4().substr(0, 6).toUpperCase();

    const room = new Room({
      name,
      description,
      creator,
      members: [creator],
      avatar,
      isPrivate,
      code  // Add unique room code
    });

    await room.save();

    // Create system message for room creation
    const systemMessage = new RoomMessage({
      roomId: room._id,
      sender: creator,
      text: `${req.user.fullName} created the room`,
      type: "system"
    });
    await systemMessage.save();

    // Populate creator details
    await room.populate("creator", "fullName email profilePic");

    console.log('Room created successfully:', room);

    res.status(201).json(room);
  } catch (error) {
    console.error("Detailed error in createRoom:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: "Failed to create room", 
      details: error.message 
    });
  }
};

export const joinRoom = async (req, res) => {
  try {
    console.log('Join Room Request:', {
      body: req.body,
      user: req.user ? req.user._id : 'No user found'
    });

    const { code } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!code) {
      console.log('Room join failed: Missing room code');
      return res.status(400).json({ error: "Room code is required" });
    }

    const room = await Room.findOne({ code }).populate("members", "fullName email profilePic");
    if (!room) {
      console.log('Room join failed: Room not found with code', code);
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is already a member
    if (room.members.some(member => member._id.toString() === userId.toString())) {
      console.log('User already in room', { userId, roomId: room._id });
      return res.status(400).json({ error: "You're already a member of this room" });
    }

    // Add user to room members
    room.members.push(userId);
    await room.save();

    // Create system message for user joining
    const systemMessage = new RoomMessage({
      roomId: room._id,
      sender: userId,
      text: `${req.user.fullName} joined the room`,
      type: "system"
    });
    await systemMessage.save();

    // Notify room members
    io.to(room._id.toString()).emit("userJoinedRoom", {
      room: room._id,
      user: { _id: userId, fullName: req.user.fullName }
    });

    console.log('Room joined successfully:', { roomId: room._id, userId });

    res.status(200).json(room);
  } catch (error) {
    console.error("Detailed error in joinRoom:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      body: req.body
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: "Failed to join room", 
      details: error.message 
    });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Verify room exists and user is a member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (!room.members.includes(userId)) {
      return res.status(403).json({ error: "Not authorized to view messages in this room" });
    }

    const messages = await RoomMessage.find({ roomId })
      .populate('sender', 'username fullName profilePic')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error in getRoomMessages:", error);
    res.status(500).json({ error: "Failed to get room messages" });
  }
};

export const sendRoomMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    // Verify room exists and user is a member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (!room.members.includes(senderId)) {
      return res.status(403).json({ error: "Not authorized to send messages in this room" });
    }

    // Handle image upload if present
    let imageUrl = '';
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "chat_messages",
        });
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    const message = new RoomMessage({
      roomId,
      sender: senderId,
      text,
      image: imageUrl,
      type: imageUrl ? "image" : "text"
    });

    await message.save();

    // Populate sender details before sending response and emitting socket event
    const populatedMessage = await RoomMessage.findById(message._id)
      .populate('sender', 'username fullName profilePic');

    // Update room's lastActivity
    await Room.findByIdAndUpdate(roomId, { lastActivity: new Date() });

    // Emit message to room
    io.to(roomId).emit("newRoomMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error in sendRoomMessage:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getUserRooms = async (req, res) => {
  try {
    console.group('Get User Rooms Detailed Debug');
    console.log('Request User Details:', {
      userId: req.user?._id,
      userEmail: req.user?.email,
      userFullName: req.user?.fullName
    });

    // Explicitly check for authenticated user
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    const userId = req.user._id;

    // Validate userId
    if (!userId) {
      console.log('Invalid user ID');
      return res.status(400).json({ error: "Invalid user ID" });
    }

    console.log('Searching for rooms for user:', userId);

    const rooms = await Room.find({ 
      $or: [
        { creator: userId },  // Rooms created by the user
        { members: userId }   // Rooms where user is a member
      ]
    })
    .populate({
      path: "creator",
      select: "fullName email profilePic _id"
    })
    .populate({
      path: "members",
      select: "fullName email profilePic _id"
    })
    .sort({ lastActivity: -1 });

    console.log('Rooms Found Details:', rooms.map(room => ({
      roomId: room._id,
      roomName: room.name,
      creator: room.creator?._id,
      creatorEmail: room.creator?.email,
      members: room.members.map(m => m._id)
    })));

    // Explicitly check if rooms exist
    if (!rooms || rooms.length === 0) {
      console.log('No rooms found for user');
      return res.status(200).json([]); // Return empty array instead of throwing error
    }

    console.groupEnd();
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Detailed error in getUserRooms:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      userId: req.user?._id
    });

    // Send a more informative error response
    res.status(500).json({ 
      error: "Failed to get user rooms", 
      details: error.message 
    });
  }
};

export const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId)
      .populate('members', 'username profilePic')
      .populate('creator', 'username profilePic');

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is a member of the room
    if (!room.members.some(member => member._id.toString() === userId.toString())) {
      return res.status(403).json({ error: "You are not a member of this room" });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error("Error in getRoom:", error);
    res.status(500).json({ error: "Failed to get room details" });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Remove user from room members
    room.members = room.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    await room.save();

    // Create system message for user leaving
    const systemMessage = new RoomMessage({
      roomId,
      sender: userId,
      text: `${req.user.fullName} left the room`,
      type: "system"
    });
    await systemMessage.save();

    // Notify room members
    io.to(roomId).emit("userLeftRoom", {
      room: roomId,
      user: { _id: userId, fullName: req.user.fullName }
    });

    res.status(200).json({ message: "Successfully left the room" });
  } catch (error) {
    console.error("Error in leaveRoom:", error);
    res.status(500).json({ error: "Failed to leave room" });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    console.group('Delete Room Comprehensive Debug');
    console.log('Delete Room Request Details:', {
      params: req.params,
      user: {
        id: req.user?._id,
        email: req.user?.email
      }
    });

    const { roomId } = req.params;
    const userId = req.user._id;

    // Validate input
    if (!roomId) {
      console.error('Room ID is required');
      return res.status(400).json({ error: "Room ID is required" });
    }

    // Find the room
    const room = await Room.findById(roomId);

    if (!room) {
      console.error('Room not found:', roomId);
      return res.status(404).json({ error: "Room not found" });
    }

    // Detailed creator check with logging
    console.log('Room Creator Check:', {
      roomCreatorId: room.creator.toString(),
      requestUserId: userId.toString(),
      match: room.creator.toString() === userId.toString()
    });

    // Check if the user is the creator of the room
    if (room.creator.toString() !== userId.toString()) {
      console.error('Unauthorized delete attempt:', {
        roomId,
        roomCreator: room.creator,
        attemptedBy: userId
      });
      return res.status(403).json({ error: "Only the room creator can delete the room" });
    }

    try {
      // Delete all messages associated with the room
      await RoomMessage.deleteMany({ roomId });

      // Delete the room
      const deletedRoom = await Room.findByIdAndDelete(roomId);

      if (!deletedRoom) {
        console.error('Room deletion failed');
        return res.status(500).json({ error: "Failed to delete room" });
      }

      // Emit room deletion event to all members
      if (room.members && room.members.length > 0) {
        room.members.forEach(memberId => {
          const socketId = userSocketMap.get(memberId.toString());
          if (socketId) {
            io.to(socketId).emit('roomDeleted', roomId);
          }
        });
      }

      console.log('Room deleted successfully:', roomId);
      console.groupEnd();

      res.status(200).json({ 
        message: "Room deleted successfully",
        roomId: roomId
      });

    } catch (deleteError) {
      console.error('Deletion Error:', deleteError);
      throw deleteError;
    }

  } catch (error) {
    console.error("Comprehensive Delete Room Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    console.groupEnd();
    res.status(500).json({ 
      error: "Failed to delete room", 
      details: error.message 
    });
  }
};
