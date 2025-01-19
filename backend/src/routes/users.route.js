import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getUserChats } from "../controllers/users.controller.js";

const router = express.Router();

// Protected route to get user chats
router.get("/chats", protectRoute, getUserChats);

export default router;
