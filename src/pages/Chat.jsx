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
  const [callState, setCallState] = useState(null); // calling | incoming | in-call
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // =========================
  // FILTER PRIVATE CHAT (IMPORTANT FIX)
  // =========================
  const chatMessages = messages.filter(
    (m) =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // SOCKET MESSAGE RECEIVE
  // =========================
  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message-status", (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.id ? { ...m, status: data.status } : m
        )
      );
    });

    return () => {
      socket.off("message");
      socket.off("message-status");
    };
  }, []);

  // =========================
  // SEND MESSAGE (WITH TICKS)
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
      time: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("message", msg);

    setText("");
  };

  // =========================
  // SEND IMAGE
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
      status: "sent",
      time: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("message", msg);
  };

  // =========================
  // VIDEO CALL
  // =========================
  const startCall = () => {
    setCallState("calling");

    socket.emit("call-user", {
      from: user,
      to: activeChat
    });
  };

  const acceptCall = () => {
    socket.emit("accept-call", { from: incomingCall.from });
    setCallState("in-call");
    setIncomingCall(null);
  };

  const rejectCall = () => {
    socket.emit("reject-call", { from: user });
    setIncomingCall(null);
    setCallState(null);
  };

  const endCall = () => {
    socket.emit("end-call", { from: user });
    setCallState(null);
  };

  // =========================
  // VOICE NOTES
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);

      const msg = {
        id: Date.now(),
        sender: user,
        receiver: activeChat,
        type: "voice",
        url,
        status: "sent"
      };

      setMessages((prev) => [...prev, msg]);
      socket.emit("message", msg);

      chunksRef.current = [];
    };

    recorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="chat-page">

      {/* LEFT */}
      <ChatList
        users={onlineUsers.length ? onlineUsers : ["Cherry", "Raymond"]}
        active={activeChat}
        setActive={setActiveChat}
      />

      {/* RIGHT */}
      <div className="chat-main">

        {/* TOP */}
        <div className="topbar">
          <div>
            💬 {user} → {activeChat}
          </div>

          <div>
            <button onClick={startCall}>📹 Call</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>

        {/* CALL UI */}
        {incomingCall && (
          <div className="call-overlay">
            📞 Incoming Call from {incomingCall.from}

            <button onClick={acceptCall}>Accept</button>
            <button onClick={rejectCall}>Reject</button>
          </div>
        )}

        {callState === "calling" && (
          <div className="call-overlay">📞 Calling...</div>
        )}

        {callState === "in-call" && (
          <div className="call-overlay">
            📹 In Call
            <button onClick={endCall}>End</button>
          </div>
        )}

        {/* MESSAGES */}
        <div className="messages">

          {chatMessages.map((m) => (
            <div key={m.id} className={m.sender === user ? "my-msg" : "their-msg"}>

              {m.type === "text" && <p>{m.text}</p>}

              {m.type === "image" && (
                <img src={m.url} width="180" />
              )}

              {m.type === "voice" && (
                <audio controls src={m.url} />
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
            onChange={(e) => setText(e.target.value)}
            placeholder="Message..."
          />

          <button onClick={sendMessage}>➤</button>

          <input type="file" onChange={sendImage} />

          <button onMouseDown={startRecording} onMouseUp={stopRecording}>
            🎤
          </button>

        </div>

      </div>
    </div>
  );
}