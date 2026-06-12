import { useEffect, useRef, useState } from "react";
import ChatList from "../components/ChatList";
import { socket } from "../services/socket";
import Peer from "simple-peer";

export default function Chat({ user, onLogout }) {

  // =========================
  // CHAT STATE
  // =========================
  const [activeChat, setActiveChat] = useState("Cherry");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  // =========================
  // VOICE STATE
  // =========================
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // =========================
  // VIDEO CALL STATE
  // =========================
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [calling, setCalling] = useState(false);
  const [peer, setPeer] = useState(null);

  // =========================
  // FILTER CHAT
  // =========================
  const chatMessages = messages.filter(
    (m) =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // SOCKET CONNECT
  // =========================
  useEffect(() => {
    socket.emit("join", user);

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
      text,
      type: "text",
      status: "sent"
    };

    setMessages((prev) => [...prev, msg]);
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
      url,
      status: "sent"
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("message", msg);
  };

  // =========================
  // VOICE RECORDING
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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
  // GET MEDIA
  // =========================
  const getMedia = async () => {
    const myStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    setStream(myStream);
    return myStream;
  };

  // =========================
  // START VIDEO CALL
  // =========================
  const startVideoCall = async () => {
    const myStream = await getMedia();

    setCalling(true);

    const p = new Peer({
      initiator: true,
      trickle: false,
      stream: myStream
    });

    p.on("signal", (data) => {
      socket.emit("video-offer", {
        from: user,
        to: activeChat,
        signal: data
      });
    });

    p.on("stream", (remote) => {
      setRemoteStream(remote);
    });

    setPeer(p);
  };

  // =========================
  // RECEIVE CALL
  // =========================
  useEffect(() => {
    socket.on("video-offer", async (data) => {

      const myStream = await getMedia();
      setCalling(true);

      const p = new Peer({
        initiator: false,
        trickle: false,
        stream: myStream
      });

      p.on("signal", (answer) => {
        socket.emit("video-answer", {
          to: data.from,
          signal: answer
        });
      });

      p.on("stream", (remote) => {
        setRemoteStream(remote);
      });

      p.signal(data.signal);
      setPeer(p);
    });

    socket.on("video-answer", (data) => {
      peer?.signal(data.signal);
    });

    socket.on("end-video", () => {
      endCall();
    });

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("end-video");
    };
  }, [peer]);

  // =========================
  // END CALL
  // =========================
  const endCall = () => {
    stream?.getTracks().forEach((t) => t.stop());
    peer?.destroy();

    setCalling(false);
    setStream(null);
    setRemoteStream(null);
    setPeer(null);

    socket.emit("end-video");
  };

  return (
    <div className="chat-page">

      {/* CHAT LIST */}
      <ChatList
        users={["Cherry", "Raymond"]}
        active={activeChat}
        setActive={setActiveChat}
      />

      {/* MAIN */}
      <div className="chat-main">

        {/* TOP BAR */}
        <div className="topbar">
          💬 {user} → {activeChat}

          <div>
            <button onClick={startVideoCall}>📹 Call</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>

        {/* CALL UI */}
        {calling && (
          <div className="video-call">

            {stream && (
              <video
                autoPlay
                muted
                ref={(v) => v && (v.srcObject = stream)}
                className="local-video"
              />
            )}

            {remoteStream && (
              <video
                autoPlay
                ref={(v) => v && (v.srcObject = remoteStream)}
                className="remote-video"
              />
            )}

            <button onClick={endCall} className="end-call">
              End Call
            </button>

          </div>
        )}

        {/* TYPING */}
        {typing && (
          <div className="typing">
            {activeChat} is typing...
          </div>
        )}

        {/* VOICE TIMER */}
        {recording && (
          <div className="recording">
            🎤 Recording... {recordTime}s
          </div>
        )}

        {/* MESSAGES */}
        <div className="messages">

          {chatMessages.map((m) => (
            <div key={m.id} className={m.sender === user ? "my-msg" : "their-msg"}>

              {m.type === "text" && <p>{m.text}</p>}
              {m.type === "image" && <img src={m.url} />}
              {m.type === "voice" && <audio controls src={m.url} />}

              <small>{m.status}</small>

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
          >
            🎤
          </button>

        </div>

      </div>
    </div>
  );
}