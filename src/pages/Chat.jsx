import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";
import Peer from "simple-peer";

/**
 * FULL CHAT SYSTEM
 */

export default function Chat({ user, onLogout }) {

  const [activeChat, setActiveChat] = useState("Cherry");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  // VOICE
  const [recording, setRecording] = useState(false);
  const [time, setTime] = useState(0);

  const recorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);

  // VIDEO
  const [stream, setStream] = useState(null);
  const [remote, setRemote] = useState(null);
  const [calling, setCalling] = useState(false);
  const [peer, setPeer] = useState(null);

  // =========================
  // FILTER CHAT
  // =========================
  const chat = messages.filter(
    m =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // SOCKET LISTEN
  // =========================
  useEffect(() => {

    socket.emit("join", user);

    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("typing", ({ from }) => {
      if (from === activeChat) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1200);
      }
    });

    return () => {
      socket.off("message");
      socket.off("typing");
    };

  }, [activeChat]);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!text) return;

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      text,
      type: "text",
      status: "sent"
    };

    setMessages(prev => [...prev, msg]);
    socket.emit("message", msg);
    setText("");
  };

  // =========================
  // TYPING
  // =========================
  const handleTyping = (e) => {
    setText(e.target.value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });
  };

  // =========================
  // IMAGE
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
      url
    };

    setMessages(prev => [...prev, msg]);
    socket.emit("message", msg);
  };

  // =========================
  // VOICE RECORDING
  // =========================
  const startRecord = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });

    recorder.current = new MediaRecorder(s);
    chunks.current = [];

    recorder.current.ondataavailable = e => chunks.current.push(e.data);

    recorder.current.onstop = () => {
      const blob = new Blob(chunks.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);

      const msg = {
        id: Date.now(),
        sender: user,
        receiver: activeChat,
        type: "voice",
        url,
        duration: time
      };

      setMessages(prev => [...prev, msg]);
      socket.emit("message", msg);

      setTime(0);
    };

    recorder.current.start();
    setRecording(true);

    timer.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  };

  const stopRecord = () => {
    recorder.current.stop();
    setRecording(false);
    clearInterval(timer.current);
  };

  // =========================
  // VIDEO CALL (INITIATE)
  // =========================
  const startCall = async () => {

    const myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setStream(myStream);
    setCalling(true);

    const p = new Peer({
      initiator: true,
      trickle: false,
      stream: myStream
    });

    p.on("signal", data => {
      socket.emit("video-offer", {
        from: user,
        to: activeChat,
        signal: data
      });
    });

    p.on("stream", remoteStream => {
      setRemote(remoteStream);
    });

    setPeer(p);
  };

  // =========================
  // RECEIVE CALL
  // =========================
  useEffect(() => {

    socket.on("video-offer", async (data) => {

      const myStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setStream(myStream);
      setCalling(true);

      const p = new Peer({
        initiator: false,
        trickle: false,
        stream: myStream
      });

      p.on("signal", answer => {
        socket.emit("video-answer", {
          to: data.from,
          signal: answer
        });
      });

      p.on("stream", remoteStream => {
        setRemote(remoteStream);
      });

      p.signal(data.signal);
      setPeer(p);
    });

    socket.on("video-answer", data => {
      peer?.signal(data.signal);
    });

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
    };

  }, [peer]);

  // =========================
  // END CALL
  // =========================
  const endCall = () => {
    stream?.getTracks().forEach(t => t.stop());
    peer?.destroy();

    setCalling(false);
    setStream(null);
    setRemote(null);
  };

  return (
    <div className="chat-page">

      {/* CALL UI */}
      {calling && (
        <div className="call-ui">

          {stream && (
            <video autoPlay muted ref={v => v && (v.srcObject = stream)} />
          )}

          {remote && (
            <video autoPlay ref={v => v && (v.srcObject = remote)} />
          )}

          <button onClick={endCall}>End</button>

        </div>
      )}

      {/* CHAT LIST */}
      <div className="chat-list">
        <div onClick={() => setActiveChat("Cherry")}>Cherry</div>
        <div onClick={() => setActiveChat("Raymond")}>Raymond</div>
      </div>

      {/* CHAT AREA */}
      <div className="chat-main">

        <div className="topbar">
          {user} chatting with {activeChat}
          <button onClick={startCall}>📹 Call</button>
          <button onClick={onLogout}>Logout</button>
        </div>

        {typing && <div className="typing">typing...</div>}

        <div className="messages">
          {chat.map(m => (
            <div key={m.id} className={m.sender === user ? "my" : "their"}>
              {m.text}
            </div>
          ))}
        </div>

        <div className="composer">

          <input value={text} onChange={handleTyping} />

          <button onClick={sendMessage}>Send</button>

          <input type="file" onChange={sendImage} />

          <button onMouseDown={startRecord} onMouseUp={stopRecord}>
            🎤 {recording ? time : ""}
          </button>

        </div>

      </div>
    </div>
  );
}