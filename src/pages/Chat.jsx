import { useState } from "react";
import ChatList from "./ChatList";

export default function Chat({ user, onLogout }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState("Cherry");

  const users = ["Cherry", "Raymond"];

  // =========================
  // SEND MESSAGE
  // =========================
  const send = () => {
    if (!text.trim()) return;

    setMessages([
      ...messages,
      {
        sender: user,
        text,
        time: new Date().toLocaleTimeString()
      }
    ]);

    setText("");
  };

  // =========================
  // VIDEO CALL (PLACEHOLDER READY)
  // =========================
  const startCall = () => {
    alert("📞 Video call feature coming next step");
  };

  return (
    <div className="chat-page">

      {/* LEFT CHAT LIST */}
      <ChatList
        users={users}
        active={activeUser}
        setActive={setActiveUser}
      />

      {/* RIGHT CHAT AREA */}
      <div className="chat-main">

        {/* TOP BAR */}
        <div className="topbar">
          <div>
            👤 {user} chatting with {activeUser}
          </div>

          <div>
            <button onClick={startCall}>📹 Call</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="messages">

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.sender === user ? "right" : "left"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: 10,
                  margin: 5,
                  borderRadius: 10,
                  background: m.sender === user ? "#dcf8c6" : "#fff",
                  maxWidth: "70%"
                }}
              >
                {m.text}
                <div style={{ fontSize: 10 }}>{m.time}</div>
              </div>
            </div>
          ))}

        </div>

        {/* INPUT */}
        <div className="composer">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
          />

          <button onClick={send}>➤</button>
        </div>

      </div>
    </div>
  );
}