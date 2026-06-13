import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import { uploadFile } from "../services/upload";

export default function Chat({ user, onLogout }) {

  const [activeChat, setActiveChat] = useState(
    user === "Raymond" ? "Cherry" : "Raymond"
  );

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // =========================
  // LOGIN
  // =========================
  useEffect(() => {
    socket.emit("login", {
      user,
      deviceId: navigator.userAgent
    });
  }, []);

  // =========================
  // FORCE LOGOUT
  // =========================
  useEffect(() => {
    socket.on("force-logout", () => {
      localStorage.removeItem("chat_user");
      window.location.reload();
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
  // MESSAGES
  // =========================
  useEffect(() => {

    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);

      if (msg.receiver === user && Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender}`, {
          body: msg.text || "Media message"
        });
      }

      socket.emit("message-seen", {
        messageId: msg.id
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
      status: "sent"
    };

    socket.emit("message", msg);
    setText("");
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

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="user-header">
          <h3>{user}</h3>
          <button onClick={onLogout}>Logout</button>
        </div>

        {["Raymond", "Cherry"].map(u => (
          <div
            key={u}
            className={`chat-item ${activeChat === u ? "active" : ""}`}
            onClick={() => setActiveChat(u)}
          >
            {u} {onlineUsers.includes(u) ? "🟢" : "⚪"}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="chat-container">

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

        {/* INPUT ALWAYS FIXED */}
        <div className="chat-input">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />

          <button className="send-btn" onClick={sendMessage}>
            Send
          </button>
        </div>

        <button onMouseDown={startRecording} onMouseUp={stopRecording}>
          🎤 Hold
        </button>

      </div>
    </div>
  );
}