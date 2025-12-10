import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_URL.replace("/api", "");

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [adminHasRead, setAdminHasRead] = useState(false);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. Hide if admin

  useEffect(() => {
    if (!user || user.role === "admin") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Load history
    api
      .get("/chat/history")
      .then((res) => {
        setMessages(res.data.messages || []);
        setAdminHasRead(res.data.adminHasRead);
      })
      .catch(() => {});

    const newSocket = io(SOCKET_URL, { transports: ["websocket"] });

    newSocket.on("connect", () => {
      newSocket.emit("join_user", { token });
    });

    newSocket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // If valid message from admin, it means they saw previous ones? Not necessarily.
      // But if we receive a message, we should scroll.
      // Also if admin replies, they implicitly read.
      if (msg.sender === "admin") {
        setAdminHasRead(true);
        // We also need to mark it as read by US (user).
        // Emit 'mark_read' back
        if (isOpen) {
          newSocket.emit("mark_read", { token, role: "user" });
        }
      } else {
        // If I sent it (echo), admin hasn't read it yet presumably
        setAdminHasRead(false);
      }
    });

    newSocket.on("messages_read", (data) => {
      if (data.by === "admin") {
        setAdminHasRead(true);
      }
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]); // Re-run if user changes (e.g. login)

  useEffect(() => {
    if (isOpen && socket) {
      // Mark read when opening
      const token = localStorage.getItem("token");
      socket.emit("mark_read", { token, role: "user" });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    const token = localStorage.getItem("token");
    socket.emit("send_message", {
      token,
      role: "user",
      content: input,
    });
    setInput("");
  };

  if (!user || user.role === "admin") return null;

  return (
    <div className="fixed bottom-24 right-5 z-50 flex flex-col items-end pointer-events-none font-sans">
      <div
        className={`bg-white shadow-2xl rounded-2xl w-80 mb-4 overflow-hidden transition-all duration-300 origin-bottom-right pointer-events-auto border border-gray-100 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-10 h-0"
        }`}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-bold text-sm">Hỗ trợ trực tuyến</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-blue-100 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-10 h-10 opacity-50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                  <p className="text-xs">
                    Xin chào! Chúng tôi có thể giúp gì cho bạn?
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === "user"
                      ? "self-end items-end"
                      : "self-start items-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                      m.sender === "user"
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
              {/* Read Receipt */}
              {adminHasRead &&
                messages.length > 0 &&
                messages[messages.length - 1].sender === "user" && (
                  <div className="text-[10px] text-gray-500 text-right w-full pr-1 flex justify-end items-center gap-1">
                    <span>Đã xem</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3 h-3 text-blue-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t flex gap-2 items-center"
            >
              <input
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
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
          </>
        )}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full p-0 shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center w-14 h-14"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-7 h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
        {/* Unread Indicator if needed (requires global state or prop) */}
      </button>
    </div>
  );
}
