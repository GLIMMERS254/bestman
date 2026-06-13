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
  const [typingUser, setTypingUser] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const avatar = localStorage.getItem("avatar");

  // =========================
  // LOGIN
  // =========================
  useEffect(() => {
    socket.emit("login", {
      user,
      deviceId: navigator.userAgent,
      avatar
    });
  }, []);

  // =========================
  // FORCE LOGOUT
  // =========================
  useEffect(() => {
    socket.on("force-logout", () => {
      localStorage.clear();
      window.location.reload();
    });

    return () => socket.off("force-logout");
  }, []);

  // =========================
  // ONLINE USERS
  // =========================
  useEffect(() => {
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users");
  }, []);

  // =========================
  // MESSAGES + NOTIFICATIONS
  // =========================
  useEffect(() => {

    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);

      // notification
      if (msg.receiver === user && Notification.permission === "granted") {
        new Notification(`New message from ${msg.sender}`, {
          body: msg.text || "Media message"
        });
      }

      // auto seen
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
  // TYPING
  // =========================
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

  // =========================
  // UI
  // =========================
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
            onClick={() => setActiveChat(u)}
            className={`chat-item ${activeChat === u ? "active" : ""}`}
          >

            <img
              src={avatar || "https://via.placeholder.com/40"}
              className="avatar"
            />

            <div className="chat-info">
              <strong>{u}</strong>
              <small>
                {onlineUsers.includes(u) ? "🟢 online" : "⚪ offline"}
              </small>
            </div>

          </div>
        ))}

      </div>

      {/* CHAT AREA */}
      <div className="chat-container">

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

        {/* VOICE */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          style={{
            background: "#25d366",
            border: "none",
            padding: "10px",
            borderRadius: "50%",
            margin: "10px"
          }}
        >
          🎤
        </button>

      </div>
    </div>
  );
}