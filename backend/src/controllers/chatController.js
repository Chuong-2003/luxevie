import Chat from "../models/Chat.js";
import { User } from "../models/User.js";

// GET /api/chat/history
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.sub; // Extract from JWT middleware
    let chat = await Chat.findOne({ user: userId });

    if (!chat) {
      // Return empty if no chat exists yet
      return res.json({ messages: [], adminHasRead: false });
    }

    // If user is reading, mark that User has read Admin's messages
    if (chat.hasUnreadUser) {
      chat.hasUnreadUser = false;
      await chat.save();
    }

    // Return messages and whether Admin has read the latest user messages
    res.json({ messages: chat.messages, adminHasRead: !chat.hasUnreadAdmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/chats
export const getAdminChats = async (req, res) => {
  try {
    // Populate user details for the list
    const chats = await Chat.find()
      .populate("user", "name email avatarUrl")
      .sort({ lastMessageAt: -1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
