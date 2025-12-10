import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    messages: [
      {
        sender: { type: String, enum: ["user", "admin"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastMessageAt: { type: Date, default: Date.now },
    hasUnreadAdmin: { type: Boolean, default: false }, // User has unread message from admin
    hasUnreadUser: { type: Boolean, default: false }, // Admin has unread message from user
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
