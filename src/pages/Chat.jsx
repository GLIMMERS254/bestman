import { useState } from "react";
import ChatList from "./ChatList";

export default function Chat({
  user,
  onlineUsers = [],
  onLogout,
  startVideoCall,
  incomingCall,
  acceptVideoCall,
  endVideoCall
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState("Chat");

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: user,
        text,
        type: "text",
        time: new Date().toLocaleTimeString()
      }
    ]);

    setText("");
  };

  // =========================
  // SEND IMAGE (LOCAL PREVIEW)
  // =========================
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setMessages((prev) => [
      ...prev,
      {
        sender: user,
        type: "image",
        url,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  return (
    <div className="chat-page">

      {/* =========================
          CHAT LIST (OPTIONAL)
      ========================= */}
      <ChatList
        users={onlineUsers.length ? onlineUsers : ["Chat"]}
        activeUser={activeChat}
        setActiveUser={setActiveChat}
      />

      {/* =========================
          CHAT AREA (GREEN THEME)
      ========================= */}
      <div className="chat-main-green">

        {/* TOP BAR */}
        <div className="topbar-green">
          <div>
            💚 <b>{user}</b>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => startVideoCall(activeChat)}>
              📹 Call
            </button>

            <button onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* INCOMING CALL */}
        {incomingCall && (
          <div className="call-popup">
            📞 Call from <b>{incomingCall.from}</b>

            <div style={{ marginTop: 10 }}>
              <button onClick={acceptVideoCall}>Accept</button>
              <button onClick={endVideoCall}>Reject</button>
            </div>
          </div>
        )}

        {/* =========================
            MESSAGES (ONLY YOUR CHAT)
        ========================= */}
        <div className="messages-green">

          {messages.length === 0 && (
            <p style={{ opacity: 0.6 }}>
              Start your conversation 💬
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: "right" }}>

              <div className="my-bubble-green">

                {m.type === "text" && <div>{m.text}</div>}

                {m.type === "image" && (
                  <img src={m.url} className="chat-img" />
                )}

                <small>{m.time}</small>

              </div>
            </div>
          ))}

        </div>

        {/* =========================
            INPUT BAR
        ========================= */}
        <div className="composer-green">

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
          />

          <button onClick={sendMessage}>➤</button>

          <input
            type="file"
            id="file"
            onChange={sendImage}
            hidden
          />

          <button onClick={() => document.getElementById("file").click()}>
            📎
          </button>

        </div>

      </div>
    </div>
  );
}