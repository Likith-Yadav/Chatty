import User from "../models/user.model.js";
import Room from "../models/room.model.js";

export const getUserChats = async (req, res) => {
  try {
    // Get the current user's ID from the protected route middleware
    const userId = req.user._id;

    // Find rooms where the user is a member
    const userRooms = await Room.find({ 
      members: { $elemMatch: { $eq: userId } } 
    }).populate({
      path: 'members',
      select: 'fullName profilePic' // Only select necessary user details
    }).sort({ updatedAt: -1 }); // Sort by most recently updated

    res.status(200).json(userRooms);
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ 
      error: "Unable to fetch user chats", 
      details: error.message 
    });
  }
};
