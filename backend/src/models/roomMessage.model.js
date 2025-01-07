import mongoose from "mongoose";

const roomMessageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String
  },
  image: {
    type: String
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  type: {
    type: String,
    enum: ["text", "image", "system"],
    default: "text"
  }
}, { timestamps: true });

const RoomMessage = mongoose.model("RoomMessage", roomMessageSchema);
export default RoomMessage;
