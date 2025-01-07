import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  description: {
    type: String,
    default: ""
  },
  avatar: {
    type: String,
    default: ""
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Generate unique room code
roomSchema.pre("save", async function(next) {
  if (!this.code) {
    // Generate a unique 6-character code
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = "";
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      // Check if code is unique
      const existingRoom = await mongoose.models.Room.findOne({ code });
      if (!existingRoom) {
        isUnique = true;
      }
    }
    
    this.code = code;
  }
  next();
});

const Room = mongoose.model("Room", roomSchema);
export default Room;
