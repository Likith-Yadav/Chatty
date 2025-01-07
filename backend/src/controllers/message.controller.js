import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io, getOnlineUsers } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    // Get online users
    const onlineUsers = getOnlineUsers();
    
    // Add online status to each user
    const usersWithOnlineStatus = filteredUsers.map(user => ({
      ...user.toObject(),
      isOnline: onlineUsers.includes(user._id.toString())
    }));

    res.status(200).json(usersWithOnlineStatus);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    console.group('Send Message Comprehensive Debug');
    console.log('Message Send Request:', {
      body: req.body,
      params: req.params,
      user: {
        id: req.user?._id,
        username: req.user?.username
      }
    });

    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    // Validate input
    if (!text && !image) {
      console.error('Empty message payload');
      return res.status(400).json({ error: "Message or image is required" });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      console.error('Receiver not found:', receiverId);
      return res.status(404).json({ error: "Receiver not found" });
    }

    let imageUrl = null;
    if (image) {
      // Basic validation of base64 image
      if (!image.startsWith('data:image')) {
        console.error('Invalid image format:', image.substring(0, 50));
        return res.status(400).json({ error: "Invalid image format" });
      }

      try {
        // Upload base64 image to cloudinary with error handling
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: 'chat_images',
          transformation: [
            { width: 800, crop: 'limit' }, // Limit image width
            { quality: 'auto' } // Auto optimize quality
          ]
        });
        
        if (!uploadResponse || !uploadResponse.secure_url) {
          console.error('Cloudinary upload failed', uploadResponse);
          return res.status(500).json({ error: "Image upload failed" });
        }
        
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ 
          error: "Failed to upload image", 
          details: uploadError.message 
        });
      }
    }

    // Create and save message
    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || '',
      image: imageUrl
    });

    const savedMessage = await newMessage.save();

    console.log('Message Saved Details:', {
      messageId: savedMessage._id,
      senderId: savedMessage.senderId,
      receiverId: savedMessage.receiverId,
      hasText: !!savedMessage.text,
      hasImage: !!savedMessage.image
    });

    // Emit to receiver if socket exists
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", savedMessage);
      console.log('Message emitted to receiver socket:', receiverSocketId);
    }

    console.groupEnd();
    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Critical error in sendMessage:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    console.groupEnd();
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
};
