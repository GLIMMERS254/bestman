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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatBodyRef = useRef(null);

  // Auto scroll to bottom when a new message arrives
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  // LOGIN
  useEffect(() => {
    socket.emit("login", {
      user,
      avatar,
      deviceId: navigator.userAgent
    });
  }, [user, avatar]);

  // ONLINE USERS
  useEffect(() => {
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users");
  }, []);

  // RECEIVE MESSAGES
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
      socket.emit("message-seen", { messageId: msg.id, user });
    });

    socket.on("message-updated", ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status } : m))
      );
    });

    socket.on("message-deleted", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    return () => {
      socket.off("message");
    };
  }, [user]);

  // TYPING INDICATOR
  useEffect(() => {
    socket.on("typing", ({ from, to }) => {
      if (to === user) {
        setTypingUser(from);
        setTimeout(() => setTypingUser(null), 1500);
      }
    });
    return () => socket.off("typing");
  }, [user]);

  // SEND MESSAGE
  const sendMessage = () => {
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

  // RECORD VOICE NOTES
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
        const file = new File([blob], "voice.webm");
        const data = await uploadFile(file);

        socket.emit("message", {
          id: Date.now(),
          sender: user,
          receiver: activeChat,
          type: "voice",
          url: data.url,
          status: "sent"
        });
      };

      recorder.start();
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="app-container">
      
      {/* TOP HEADER BAR */}
      <div className="top-bar">
        <div className="left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            ☰ Chats
          </button>
          <div className="profile">
            <img src={avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} alt="Avatar" />
            <div>
              <b>{user}</b>
              <span className="status-indicator">
                {onlineUsers.includes(user) ? "🟢 online" : "⚪ offline"}
              </span>
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Exit</button>
      </div>

      <div className="chat-layout">
        
        {/* SLIDING SIDEBAR OVERLAY */}
        <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3>Active Sessions</h3>
            <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>×</button>
          </div>

          <div
            className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
            onClick={() => {
              setActiveChat(otherUser);
              setIsSidebarOpen(false); // Autofills screen & closes menu on click
            }}
          >
            <div className="avatar-placeholder">{otherUser[0]}</div>
            <div className="chat-info">
              <b>{otherUser}</b>
              <small>{onlineUsers.includes(otherUser) ? "online" : "offline"}</small>
            </div>
          </div>
        </div>

        {/* CLICK BACKDROP TO CLOSE MENU */}
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

        {/* FULLSCREEN MAIN CHAT CANVAS */}
        <div className="chat-container">
          <div className="chat-header">
            Channel Hub: <span>{activeChat}</span>
          </div>

          {/* SECURE SCROLL VIEWPORT */}
          <div className="chat-body" ref={chatBodyRef}>
            {messages
              .filter(m =>
                (m.sender === user && m.receiver === activeChat) ||
                (m.sender === activeChat && m.receiver === user)
              )
              .map(m => (
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
                <span className="dot animate-one">.</span>
                <span className="dot animate-two">.</span>
                <span className="dot animate-three">.</span>
              </div>
            )}
          </div>

          {/* FIXED WHATSAPP INPUT ANCHOR CONTROLLER */}
          <div className="input-panel-wrapper">
            <div className="chat-input-bar">
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                placeholder="Type message..."
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              
              <button 
                className="mic-btn"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                title="Hold to Record Voice Memo"
              >
                🎤
              </button>

              <button className="send-btn" onClick={sendMessage}>
                Send
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}