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

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // =========================
  // LOGIN (WITH AVATAR)
  // =========================
  useEffect(() => {
    socket.emit("login", {
      user,
      avatar,
      deviceId: navigator.userAgent
    });
  }, []);

  // =========================
  // ONLINE USERS
  // =========================
  useEffect(() => {
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users");
  }, []);

  // =========================
  // RECEIVE MESSAGES
  // =========================
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);

      // AUTO MARK SEEN
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

    socket.on("message-deleted", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    return () => socket.off("message");
  }, []);

  // =========================
  // TYPING INDICATOR
  // =========================
  useEffect(() => {
    socket.on("typing", ({ from, to }) => {
      if (to === user) {
        setTypingUser(from);
        setTimeout(() => setTypingUser(null), 1200);
      }
    });

    return () => socket.off("typing");
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================
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

  // =========================
  // TYPING EMIT
  // =========================
  const handleTyping = (value) => {
    setText(value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });
  };

  // =========================
  // DELETE MESSAGE
  // =========================
  const deleteMessage = (id) => {
    socket.emit("delete-message", { messageId: id });
  };

  // =========================
  // VOICE NOTES
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];

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
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="chat-layout">

      {/* ================= SIDEBAR ================= */}
      <div className="sidebar">

        <div className="user-header">
          <img src={avatar || "https://via.placeholder.com/40"} className="avatar" />
          <div>
            <b>{user}</b>
            <div style={{ fontSize: 12 }}>
              {onlineUsers.includes(user) ? "🟢 online" : "⚪ offline"}
            </div>
          </div>
          <button onClick={onLogout}>Logout</button>
        </div>

        {/* ONLY ONE CHAT */}
        <div
          className={`chat-item ${activeChat === otherUser ? "active" : ""}`}
          onClick={() => setActiveChat(otherUser)}
        >
          <img
            src="https://via.placeholder.com/40"
            className="avatar"
          />
          <div className="chat-info">
            <b>{otherUser}</b>
            <small>Tap to chat</small>
          </div>
        </div>

      </div>

      {/* ================= CHAT AREA ================= */}
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
                onDoubleClick={() => deleteMessage(m.id)}
              >

                {m.type === "text" && m.text}
                {m.type === "voice" && <audio controls src={m.url} />}

                <small>
                  {m.status === "sent" && "✓"}
                  {m.status === "seen" && "✓✓"}
                </small>

              </div>
            ))}

        </div>

        {/* TYPING */}
        {typingUser && (
          <div className="typing">
            {typingUser} is typing...
          </div>
        )}

        {/* INPUT */}
        <div className="chat-input">

          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type message..."
          />

          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>

        </div>

        {/* VOICE HOLD */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
        >
          🎤 Hold
        </button>

      </div>
    </div>
  );
}