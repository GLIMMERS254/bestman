import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { uploadFile } from "../services/upload";

export default function Chat({ user, onLogout }) {

  const partner = user === "Ray" ? "Cherry" : "Ray";

  const [activeChat, setActiveChat] = useState(partner);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showChats, setShowChats] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const avatar = localStorage.getItem("avatar");

  // ================= LOGIN =================
  useEffect(() => {
    socket.emit("login", {
      user,
      deviceId: navigator.userAgent,
      avatar
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

      if (msg.receiver === user && Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender}`, {
          body: msg.text || "Media message"
        });
      }

      socket.emit("message-seen", { messageId: msg.id });
    });

    socket.on("message-updated", ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, status } : m)
      );
    });

    return () => socket.off("message");

  }, []);

  // ================= TYPING =================
  useEffect(() => {
    socket.on("typing", ({ from, to }) => {
      if (to === user) {
        setTypingUser(from);
        setTimeout(() => setTypingUser(null), 1000);
      }
    });

    return () => socket.off("typing");
  }, []);

  const handleTyping = (value) => {
    setText(value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });
  };

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

  // ================= VOICE =================
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

  // ================= FILTER =================
  const chatMessages = messages.filter(m =>
    (m.sender === user && m.receiver === activeChat) ||
    (m.sender === activeChat && m.receiver === user)
  );

  return (
    <div className="mobile-app">

      {/* HEADER */}
      <div className="top-bar">
        <button onClick={() => setShowChats(!showChats)}>
          ☰
        </button>

        <div className="title">Ray & Cherry</div>

        <button onClick={onLogout}>Logout</button>
      </div>

      {/* CHAT LIST (OVERLAY) */}
      {showChats && (
        <div className="chat-list">

          {[partner].map(u => (
            <div
              key={u}
              className="chat-item"
              onClick={() => {
                setActiveChat(u);
                setShowChats(false);
              }}
            >

              <img
                src={avatar || "https://via.placeholder.com/40"}
                className="avatar"
              />

              <div>
                <b>{u}</b>
                <small>
                  {onlineUsers.includes(u) ? "🟢 online" : "⚪ offline"}
                </small>
              </div>

            </div>
          ))}

        </div>
      )}

      {/* CHAT BODY (WHITE LIKE WHATSAPP) */}
      <div className="chat-screen">

        {chatMessages.map(m => (
          <div
            key={m.id}
            className={`msg ${m.sender === user ? "me" : "them"}`}
          >
            {m.type === "text" && m.text}
            {m.type === "voice" && <audio controls src={m.url} />}

            <small>
              {m.status === "sent" && "✓"}
              {m.status === "seen" && "✓✓"}
            </small>
          </div>
        ))}

        {typingUser && (
          <div className="typing">
            {typingUser} is typing...
          </div>
        )}

      </div>

      {/* INPUT */}
      <div className="chat-input">

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message..."
        />

        <button className="send-btn" onClick={sendMessage}>
          ➤
        </button>

        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          className="mic-btn"
        >
          🎤
        </button>

      </div>

    </div>
  );
}