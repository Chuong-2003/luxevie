import { Router } from "express";
import {
  getChatHistory,
  getAdminChats,
} from "../controllers/chatController.js";
import { authenticate, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// User routes
router.get("/chat/history", authenticate, getChatHistory);

// Admin routes
router.get("/admin/chats", authenticate, requireAdmin, getAdminChats);

export default router;
