import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export default function Chat({ user, avatar, onLogout }) {

  const otherUser = user === "Ray" ? "Cherry" : "Ray";

  const [activeChat, setActiveChat] = useState(otherUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // LOGIN
  useEffect(() => {
    socket.emit("login", {
      user,
      avatar,
      deviceId: navigator.userAgent
    });
  }, []);

  // RECEIVE MESSAGES
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("message");
  }, []);

  // SEND MESSAGE
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      text,
      type: "text"
    };

    socket.emit("message", msg);
    setText("");
  };

  return (
    <div className="app-container">

      {/* TOP BAR */}
      <div className="top-bar">

        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </button>

        <div className="profile">
          <img src={avatar || "https://via.placeholder.com/40"} />
          <span>{user}</span>
        </div>

        <button className="menu-btn" onClick={onLogout}>
          Logout
        </button>

      </div>

      <div className="chat-layout">

        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>

          <h3>Chats</h3>

          <div
            className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
            onClick={() => {
              setActiveChat(otherUser);
              setSidebarOpen(false);
            }}
          >
            💬 {otherUser}
          </div>

        </div>

        {/* CHAT */}
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
                <div
                  key={m.id}
                  className={`msg ${m.sender === user ? "me" : "them"}`}
                >
                  {m.text}
                </div>
              ))}

          </div>

          {/* INPUT */}
          <div className="chat-input">

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message..."
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