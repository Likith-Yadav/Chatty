import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createRoom,
  joinRoom,
  getRoomMessages,
  sendRoomMessage,
  getUserRooms,
  leaveRoom,
  getRoom,
  deleteRoom
} from "../controllers/room.controller.js";

const router = express.Router();

// Logging middleware for rooms routes
router.use((req, res, next) => {
  console.log('ROOMS ROUTE MIDDLEWARE:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: {
      contentType: req.get('Content-Type'),
      accept: req.get('Accept')
    }
  });
  next();
});

// All routes are protected
router.use(protectRoute);

// Room management
router.post("/create", (req, res, next) => {
  console.log('CREATE ROOM REQUEST:', {
    body: req.body,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, createRoom);

router.post("/join", (req, res, next) => {
  console.log('JOIN ROOM REQUEST:', {
    body: req.body,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, joinRoom);

router.get("/user-rooms", (req, res, next) => {
  console.log('GET USER ROOMS REQUEST:', {
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, getUserRooms);

router.post("/:roomId/leave", (req, res, next) => {
  console.log('LEAVE ROOM REQUEST:', {
    roomId: req.params.roomId,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, leaveRoom);

// Single room routes
router.get("/:roomId", (req, res, next) => {
  console.log('GET ROOM DETAILS REQUEST:', {
    roomId: req.params.roomId,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, getRoom);

router.get("/:roomId/messages", (req, res, next) => {
  console.log('GET ROOM MESSAGES REQUEST:', {
    roomId: req.params.roomId,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, getRoomMessages);

router.post("/:roomId/messages", (req, res, next) => {
  console.log('SEND ROOM MESSAGE REQUEST:', {
    roomId: req.params.roomId,
    body: req.body,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, sendRoomMessage);

router.delete("/:roomId", (req, res, next) => {
  console.log('DELETE ROOM REQUEST:', {
    roomId: req.params.roomId,
    user: req.user ? req.user._id : 'No user'
  });
  next();
}, deleteRoom);

export default router;
