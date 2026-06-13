import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { uploadFile } from "../services/upload";

export default function Chat({ user, avatar, onLogout, onlineUsers, deferredPrompt, onInstall }) {
  // Enforces structural workspace naming constraints
  const otherUser = user === "Raymond" ? "Anne" : "Raymond";

  const [activeChat, setActiveChat] = useState(otherUser);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatBodyRef = useRef(null);

  // Smooth layout bottom lock scroll configuration
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  // =========================
  // MESSAGE STREAM TRANSLATION
  // =========================
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      socket.emit("message-seen", { messageId: msg.id, user });
    });

    socket.on("message-updated", ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
    });

    socket.on("message-deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    return () => {
      socket.off("message");
      socket.off("message-updated");
      socket.off("message-deleted");
    };
  }, [user]);

  // =========================
  // TYPING CHANNEL HOOKS
  // =========================
  useEffect(() => {
    socket.on("typing", ({ from, to }) => {
      if (to === user) {
        setTypingUser(from);
        setTimeout(() => setTypingUser(null), 1500);
      }
    });
    return () => socket.off("typing");
  }, [user]);

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      text,
      type: "text",
      status: "sent",
      createdAt: new Date()
    };

    socket.emit("message", msg);
    setText("");
  };

  const handleTyping = (value) => {
    setText(value);
    socket.emit("typing", { from: user, to: activeChat });
  };

  const deleteMessage = (id) => {
    socket.emit("delete-message", { messageId: id });
  };

  // =========================
  // HARDWARE RECORDING ENGINE
  // =========================
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "voice.webm", { type: "audio/webm" });
        const data = await uploadFile(file);

        if (data && data.url) {
          socket.emit("message", {
            id: Date.now(),
            sender: user,
            receiver: activeChat,
            type: "voice",
            url: data.url,
            status: "sent",
            createdAt: new Date()
          });
        }
      };

      recorder.start();
    } catch (err) {
      console.error("Microphone hardware connection rejected", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  };

  return (
    <div className="app-container">
      
      {/* TOP COMPONENT NAVIGATION PANEL */}
      <div className="top-bar">
        <div className="left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰ Chats
          </button>
          <div className="profile">
            <img 
              src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} 
              className="user-header-avatar" 
              alt="Profile avatar" 
            />
            <div>
              <b>{user}</b>
              <span className="status-indicator">
                {onlineUsers.includes(user) ? "🟢 online" : "⚪ offline"}
              </span>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Exit Space</button>
      </div>

      <div className="chat-layout">
        
        {/* SLIDING SIDEBAR COMPONENT BLOCK */}
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3>Active Sessions</h3>
            <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
          </div>

          <div
            className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
            onClick={() => {
              setActiveChat(otherUser);
              setIsSidebarOpen(false);
            }}
          >
            <div className="avatar-placeholder">{otherUser[0]}</div>
            <div className="chat-info">
              <b>{otherUser}</b>
              {/* STRICT SOCKET-CONNECTED MONITORING ONLY */}
              <small style={{ color: onlineUsers.includes(otherUser) ? "#00a884" : "#8696a0" }}>
                {onlineUsers.includes(otherUser) ? "online" : "offline"}
              </small>
            </div>
          </div>
        </div>

        {/* COMPONENT OUTSIDE PANEL CLICK HOOK */}
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

        {/* FULLSCREEN CHAT AREA CANVAS */}
        <div className="chat-container">
          
          {/* PWA FLOATING APP ATTACHMENT ANCHOR (Left Center Location) */}
          {deferredPrompt && (
            <button className="sidebar-install-floating-btn" onClick={onInstall}>
              📥 Install App
            </button>
          )}

          <div className="chat-header">
            Secure Channel: <span>{activeChat}</span>
          </div>

          {/* MESSAGE VIEWPORT BLOCK */}
          <div className="chat-body" ref={chatBodyRef}>
            {messages
              .filter(
                (m) =>
                  (m.sender === user && m.receiver === activeChat) ||
                  (m.sender === activeChat && m.receiver === user)
              )
              .map((m) => (
                <div
                  key={m.id}
                  className={`msg ${m.sender === user ? "me" : "them"}`}
                  onDoubleClick={() => deleteMessage(m.id)}
                >
                  <div className="msg-content">
                    {m.type === "text" && m.text}
                    {m.type === "voice" && <audio controls src={m.url} className="voice-player" />}
                  </div>
                  <small className="msg-meta">
                    {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <span className="ticks">
                      {m.status === "sent" && " ✓"}
                      {m.status === "seen" && " ✓✓"}
                    </span>
                  </small>
                </div>
              ))}

            {typingUser && (
              <div className="typing-bubble">
                <small style={{ color: "#8696a0", marginRight: "6px" }}>{typingUser} typing</small>
                <span className="dot">.</span><span className="dot animate-two">.</span><span className="dot animate-three">.</span>
              </div>
            )}
          </div>

          {/* FIXED ELEVATED INPUT WRAPPER CONTROLLER */}
          <div className="input-panel-wrapper">
            <form onSubmit={sendMessage} className="chat-input-bar">
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type message..."
              />
              
              <button
                type="button"
                className="mic-btn"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
              >
                🎤
              </button>

              <button type="submit" className="send-btn">
                Send
              </button>
            </form>
            
            {/* Custom Footer Credit Container */}
            <div className="boyfriend-credit-footer">
              Designed with ❤️ by your boyfriend Ray
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}