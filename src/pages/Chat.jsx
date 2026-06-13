import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export default function Chat({ user, onLogout }) {

  const otherUser = user === "Ray" ? "Cherry" : "Ray";

  const [activeChat, setActiveChat] = useState(otherUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // LOGIN
  useEffect(() => {
    socket.emit("login", {
      user,
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
      <div className="online-bar">
        <span>📲 Ray & Cherry Chat</span>
        <button className="install-btn">Install</button>
      </div>

      <div className="chat-layout">

        {/* SIDEBAR (ONLY ONE CHAT) */}
        <div className="sidebar">

          <h3>{user}</h3>
          <button onClick={onLogout}>Logout</button>

          <div
            className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
            onClick={() => setActiveChat(otherUser)}
          >
            💬 Chat with {otherUser}
          </div>

        </div>

        {/* CHAT AREA */}
        <div className="chat-container">

          <div className="chat-header">
            Chat with {activeChat}
          </div>

          {/* SCROLL AREA ONLY */}
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

          {/* FIXED INPUT BAR */}
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