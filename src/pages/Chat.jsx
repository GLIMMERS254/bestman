import { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { socket } from "../services/socket";

export default function Chat({
  user,
  onlineUsers,
  incomingCall,
  setIncomingCall,
  onLogout
}) {
  const [activeChat, setActiveChat] = useState("Cherry");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);

  const [typing, setTyping] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // =========================
  // FILTER CHAT ONLY
  // =========================
  const chatMessages = messages.filter(
    (m) =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // SOCKET RECEIVE MESSAGE
  // =========================
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message-status", ({ id, status }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
    });

    socket.on("typing", ({ from }) => {
      if (from === activeChat) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1200);
      }
    });

    return () => {
      socket.off("message");
      socket.off("message-status");
      socket.off("typing");
    };
  }, [activeChat]);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      type: "text",
      text,
      status: "sent",
      time: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("message", msg);

    setText("");
  };

  // =========================
  // TYPING EVENT
  // =========================
  const handleTyping = (e) => {
    setText(e.target.value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });
  };

  // =========================
  // IMAGE SEND
  // =========================
  const sendImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      type: "image",
      url,
      status: "sent"
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("message", msg);
  };

  // =========================
  // VOICE RECORDING (WITH TIMER)
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    recorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    recorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);

      const msg = {
        id: Date.now(),
        sender: user,
        receiver: activeChat,
        type: "voice",
        url,
        duration: recordTime,
        status: "sent"
      };

      setMessages((prev) => [...prev, msg]);

      socket.emit("message", msg);

      setRecordTime(0);
    };

    recorderRef.current.start();
    setRecording(true);

    timerRef.current = setInterval(() => {
      setRecordTime((t) => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);

    clearInterval(timerRef.current);
  };

  // =========================
  // FORMAT TIME
  // =========================
  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="chat-page">

      {/* LEFT CHATLIST */}
      <ChatList
        users={onlineUsers.length ? onlineUsers : ["Cherry", "Raymond"]}
        active={activeChat}
        setActive={setActiveChat}
      />

      {/* MAIN CHAT */}
      <div className="chat-main">

        {/* TOP */}
        <div className="topbar">
          💬 {user} → {activeChat}
          <button onClick={onLogout}>Logout</button>
        </div>

        {/* TYPING */}
        {typing && (
          <div style={{ fontSize: 12, padding: 5 }}>
            {activeChat} is typing...
          </div>
        )}

        {/* RECORDING */}
        {recording && (
          <div style={{ background: "red", color: "white", padding: 5 }}>
            🎤 Recording... {format(recordTime)}
          </div>
        )}

        {/* MESSAGES */}
        <div className="messages">

          {chatMessages.map((m) => (
            <div key={m.id} className={m.sender === user ? "my-msg" : "their-msg"}>

              {m.type === "text" && <p>{m.text}</p>}

              {m.type === "image" && <img src={m.url} width="180" />}

              {m.type === "voice" && (
                <>
                  <audio controls src={m.url} />
                  <small>🎧 {m.duration}s</small>
                </>
              )}

              <small>
                {m.status === "sent" && "✓ sent"}
                {m.status === "delivered" && "✓✓ delivered"}
                {m.status === "seen" && "✓✓ seen"}
              </small>

            </div>
          ))}

        </div>

        {/* INPUT */}
        <div className="composer">

          <input
            value={text}
            onChange={handleTyping}
            placeholder="Message..."
          />

          <button onClick={sendMessage}>➤</button>

          <input type="file" onChange={sendImage} />

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            style={{
              background: recording ? "red" : "#075e54",
              color: "white"
            }}
          >
            🎤
          </button>

        </div>

      </div>
    </div>
  );
}