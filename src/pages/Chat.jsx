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
  const [activeChat, setActiveChat] = useState("Cherry");

  // =========================
  // SEND TEXT MESSAGE
  // =========================
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      sender: user,
      text,
      time: new Date().toLocaleTimeString(),
      type: "text"
    };

    setMessages((prev) => [...prev, msg]);
    setText("");
  };

  // =========================
  // SEND IMAGE (LOCAL PREVIEW DEMO)
  // =========================
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    const msg = {
      sender: user,
      type: "image",
      url,
      time: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, msg]);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-page">

      {/* =========================
          CHAT LIST (LEFT SIDEBAR)
      ========================= */}
      <ChatList
        users={onlineUsers.length ? onlineUsers : ["Cherry", "Raymond"]}
        activeUser={activeChat}
        setActiveUser={setActiveChat}
      />

      {/* =========================
          MAIN DASHBOARD
      ========================= */}
      <div className="chat-main">

        {/* TOP BAR */}
        <div className="topbar">
          <div>
            💬 Chatting as <b>{user}</b>
          </div>

          <div style={{ display: "flex", gap: 10 }}>

            {/* VIDEO CALL */}
            <button
              onClick={() => startVideoCall(activeChat)}
            >
              📹 Call
            </button>

            {/* LOGOUT */}
            <button onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* =========================
            INCOMING CALL POPUP
        ========================= */}
        {incomingCall && (
          <div style={{
            position: "absolute",
            top: 80,
            right: 20,
            background: "white",
            padding: 15,
            borderRadius: 10,
            zIndex: 1000
          }}>
            📞 Incoming call from <b>{incomingCall.from}</b>

            <div style={{ marginTop: 10 }}>
              <button onClick={acceptVideoCall}>
                Accept
              </button>

              <button onClick={endVideoCall}>
                Reject
              </button>
            </div>
          </div>
        )}

        {/* =========================
            MESSAGES AREA
        ========================= */}
        <div className="messages">

          {messages.length === 0 && (
            <p style={{ opacity: 0.5 }}>
              No messages yet. Start chatting...
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                textAlign: m.sender === user ? "right" : "left",
                margin: "8px 0"
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "10px",
                  borderRadius: "10px",
                  maxWidth: "70%",
                  background: m.sender === user ? "#dcf8c6" : "#fff"
                }}
              >

                {/* TEXT MESSAGE */}
                {m.type === "text" && <div>{m.text}</div>}

                {/* IMAGE MESSAGE */}
                {m.type === "image" && (
                  <img
                    src={m.url}
                    style={{
                      width: "200px",
                      borderRadius: "10px"
                    }}
                  />
                )}

                <div style={{ fontSize: 10, marginTop: 5 }}>
                  {m.time}
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* =========================
            INPUT BAR
        ========================= */}
        <div className="composer">

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />

          <button onClick={sendMessage}>➤</button>

          <input
            type="file"
            id="file"
            onChange={sendImage}
            style={{ display: "none" }}
          />

          <button onClick={() => document.getElementById("file").click()}>
            📎
          </button>

        </div>

      </div>
    </div>
  );
}