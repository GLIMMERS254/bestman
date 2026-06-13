import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { uploadFile } from "../services/upload";

export default function Chat({ user, avatar, onLogout }) {

  const otherUser = user === "Ray" ? "Cherry" : "Ray";

  const [activeChat, setActiveChat] = useState(otherUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ================= LOGIN =================
  useEffect(() => {
    socket.emit("login", {
      user,
      avatar,
      deviceId: navigator.userAgent
    });
  }, []);

  // ================= ONLINE =================
  useEffect(() => {
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users");
  }, []);

  // ================= MESSAGES =================
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);

      socket.emit("message-seen", {
        messageId: msg.id,
        user
      });
    });

    socket.on("message-updated", ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, status } : m
        )
      );
    });

    return () => socket.off("message");
  }, []);

  // ================= TYPING =================
  useEffect(() => {
    socket.on("typing", ({ from, to }) => {
      if (to === user) {
        setTypingUser(from);
        setTimeout(() => setTypingUser(null), 1200);
      }
    });

    return () => socket.off("typing");
  }, []);

  // ================= SEND =================
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      text,
      type: "text",
      status: "sent"
    };

    socket.emit("message", msg);
    setText("");
  };

  // ================= TYPING =================
  const handleTyping = (value) => {
    setText(value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });
  };

  return (
    <div className="app-container">

      {/* TOP BAR */}
      <div className="top-bar">
        <div className="left">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>

          <div className="profile">
            <img src={avatar || "https://via.placeholder.com/40"} />
            <span>{user}</span>
          </div>
        </div>

        <button className="menu-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="chat-layout">

        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>

          <div
            className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
            onClick={() => {
              setActiveChat(otherUser);
              setSidebarOpen(false);
            }}
          >
            <img src="https://via.placeholder.com/40" className="avatar" />
            <div>
              <b>{otherUser}</b>
              <div style={{ fontSize: 12 }}>
                {onlineUsers.includes(otherUser) ? "🟢 online" : "⚪ offline"}
              </div>
            </div>
          </div>

        </div>

        {/* CHAT AREA */}
        <div className="chat-container">

          <div className="chat-header">
            Chat with {activeChat}
          </div>

          {/* MESSAGES */}
          <div className="chat-body">

            {messages
              .filter(m =>
                (m.sender === user && m.receiver === activeChat) ||
                (m.sender === activeChat && m.receiver === user)
              )
              .map(m => (
                <div key={m.id} className={`msg ${m.sender === user ? "me" : "them"}`}>
                  {m.text}
                  <small>
                    {m.status === "sent" && " ✓"}
                    {m.status === "seen" && " ✓✓"}
                  </small>
                </div>
              ))}

          </div>

          {/* TYPING */}
          {typingUser && (
            <div className="typing">{typingUser} is typing...</div>
          )}

          {/* INPUT (FIXED ALWAYS) */}
          <div className="chat-input">
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type a message..."
            />

            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}