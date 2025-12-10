import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

export default function AdminChat() {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]); // List of users with chats
  const [activeChat, setActiveChat] = useState(null); // Selected user chat object
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Load conversations list
  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/admin/chats");
      setConversations(data.chats || []);
    } catch (err) {
      // console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });
    newSocket.on("connect", () => {
      newSocket.emit("join_admin", { token });
    });

    // Listen for any user message or admin reply
    newSocket.on("admin_receive_message", (data) => {
      // data: { chatId, userId, sender, content, timestamp }
      setConversations((prev) => {
        const existing = prev.find(
          (c) => c.user._id === data.userId || c.user === data.userId
        );
        if (existing) {
          // Update existing
          const updated = {
            ...existing,
            messages: [...(existing.messages || []), { ...data }],
            lastMessageAt: data.timestamp,
            hasUnreadUser: data.sender === "user",
          };
          // Move to top
          return [updated, ...prev.filter((c) => c._id !== existing._id)];
        } else {
          // New conversation found? ideally fetch full chat or just add stub
          if (data.sender === "user") {
            // Refetch list to get full user details
            fetchConversations();
          }
          return prev;
        }
      });

      // If this is the active chat, append message
      setActiveChat((current) => {
        if (
          current &&
          (current.user._id === data.userId || current.user === data.userId)
        ) {
          setMessages((prevMsgs) => [...prevMsgs, data]);
          return current;
        }
        return current;
      });
    });

    setSocket(newSocket);
    fetchConversations();

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (activeChat) {
      // Set messages for view
      if (activeChat.messages) setMessages(activeChat.messages);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || !socket) return;

    const token = localStorage.getItem("token");
    // Admin sending
    socket.emit("send_message", {
      token,
      role: "admin",
      content: input,
      toUserId: activeChat.user._id || activeChat.user, // Handle populated or not
    });
    setInput("");
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    // Mark read
    if (chat.hasUnreadUser) {
      // Emit socket event to mark read? or API
      // For MVP just UI update
      chat.hasUnreadUser = false;
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] border rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className="w-1/3 border-r overflow-y-auto bg-gray-50/50">
        <div className="p-4 border-b bg-white sticky top-0 z-10 font-bold text-gray-700">
          Tin nhắn
        </div>
        {conversations.length === 0 && (
          <div className="p-8 text-gray-400 text-center text-sm">
            Chưa có tin nhắn nào
          </div>
        )}
        {conversations.map((c) => (
          <div
            key={c._id}
            onClick={() => selectChat(c)}
            className={`p-4 border-b cursor-pointer transition-colors hover:bg-gray-100 flex gap-3 items-center ${
              activeChat?._id === c._id
                ? "bg-blue-50/80 border-l-4 border-l-blue-600"
                : "border-l-4 border-l-transparent"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold overflow-hidden shrink-0">
              {c.user?.avatarUrl ? (
                <img
                  src={c.user.avatarUrl}
                  alt="avt"
                  className="w-full h-full object-cover"
                />
              ) : (
                c.user?.name?.[0] || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-gray-900 truncate">
                  {c.user?.name || c.user?.email || "User"}
                </span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">
                  {new Date(c.lastMessageAt).toLocaleDateString(undefined, {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm truncate ${
                    c.hasUnreadUser
                      ? "font-semibold text-gray-800"
                      : "text-gray-500"
                  }`}
                >
                  {(c.messages && c.messages[c.messages.length - 1]?.content) ||
                    "..."}
                </span>
                {c.hasUnreadUser && (
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 ml-2"></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3 shadow-sm z-10">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold overflow-hidden">
              {activeChat.user?.avatarUrl ? (
                <img
                  src={activeChat.user.avatarUrl}
                  alt="avt"
                  className="w-full h-full object-cover"
                />
              ) : (
                activeChat.user?.name?.[0] || "U"
              )}
            </div>
            <div>
              <div className="font-bold text-gray-800">
                {activeChat.user?.name ||
                  activeChat.user?.email ||
                  "Khách hàng"}
              </div>
              <div className="text-xs text-gray-500">
                {activeChat.user?.email}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                Bắt đầu cuộc trò chuyện...
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[75%] ${
                  m.sender === "admin"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    m.sender === "admin"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t bg-white flex gap-3 items-center"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="Nhập tin nhắn..."
            />
            <button
              disabled={!input.trim()}
              type="submit"
              className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 pl-0.5"
              >
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-16 h-16 mb-4 text-gray-200"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          <p>Chọn một cuộc hội thoại để bắt đầu</p>
        </div>
      )}
    </div>
  );
}
