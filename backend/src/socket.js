import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "./models/Chat.js";
import { User } from "./models/User.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Allow all origins for dev simplicity, restrict in prod
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // console.log('Socket connected:', socket.id);

    // 1. Join room based on user role
    socket.on("join_user", async ({ token }) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        socket.join(`user_${decoded.sub}`);
        socket.userId = decoded.sub;
        // console.log(`User ${decoded.sub} joined room user_${decoded.sub}`);
      } catch (err) {
        console.error("Socket auth failed:", err.message);
      }
    });

    socket.on("join_admin", async ({ token }) => {
      try {
        if (!token) return;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        if (decoded.role === "admin") {
          socket.join("admin_channel");
          // console.log(`Admin ${decoded.id} joined admin_channel`);
        }
      } catch (err) {
        console.error("Socket auth failed:", err.message);
      }
    });

    // 2. Handle messages
    socket.on("send_message", async (data) => {
      // data: { token, content, role, userId? (if admin sending to user) }
      try {
        const { token, content, role, toUserId } = data;
        if (!token) return;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

        let chat;
        let targetRoom;

        if (role === "user") {
          // User sending to admin
          // Find or create chat
          chat = await Chat.findOne({ user: decoded.sub });
          if (!chat) {
            chat = new Chat({ user: decoded.sub, messages: [] });
          }

          chat.messages.push({ sender: "user", content });
          chat.lastMessageAt = new Date();
          chat.hasUnreadUser = true; // Admin needs to read
          await chat.save();

          // Emit to user (self) and admin channel
          targetRoom = `user_${decoded.sub}`;
          io.to(targetRoom).emit("receive_message", {
            sender: "user",
            content,
            timestamp: new Date(),
          });
          io.to("admin_channel").emit("admin_receive_message", {
            chatId: chat._id,
            userId: decoded.sub,
            sender: "user",
            content,
            timestamp: new Date(),
          });
        } else if (role === "admin") {
          // Admin sending to specific user
          if (!toUserId) return;

          chat = await Chat.findOne({ user: toUserId });
          if (!chat) {
            // Should usually exist if admin is replying, but safeguard
            chat = new Chat({ user: toUserId, messages: [] });
          }

          chat.messages.push({ sender: "admin", content });
          chat.lastMessageAt = new Date();
          chat.hasUnreadAdmin = true;
          chat.hasUnreadUser = false; // Admin replied, so they read it
          await chat.save();

          // Emit to user room and admin (for other admins sync)
          io.to(`user_${toUserId}`).emit("receive_message", {
            sender: "admin",
            content,
            timestamp: new Date(),
          });
          // Also broadcast back to admins so their UI updates
          io.to("admin_channel").emit("admin_receive_message", {
            chatId: chat._id,
            userId: toUserId,
            sender: "admin",
            content,
            timestamp: new Date(),
          });
        }
      } catch (err) {
        console.error("Socket message error:", err);
      }
    });

    // 3. Mark read
    socket.on("mark_read", async ({ token, userId, role }) => {
      // userId is target user whose chat is being read (if admin action)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        if (role === "admin" && decoded.role === "admin" && userId) {
          await Chat.findOneAndUpdate(
            { user: userId },
            { hasUnreadUser: false }
          );
          // Notify user that admin read the message
          io.to(`user_${userId}`).emit("messages_read", { by: "admin" });
        } else if (role === "user") {
          await Chat.findOneAndUpdate(
            { user: decoded.sub },
            { hasUnreadAdmin: false }
          );
          // Notify admin that user read the message
          io.to("admin_channel").emit("messages_read", {
            userId: decoded.sub,
            by: "user",
          });
        }
      } catch (e) {}
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}
