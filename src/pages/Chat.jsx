import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

export default function Chat({ user, onLogout }) {

  // =========================
  // USERS
  // =========================
  const users = ["Cherry", "Raymond", "Anne"];
  const [activeChat, setActiveChat] = useState("Cherry");

  // =========================
  // CHAT STATE
  // =========================
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // =========================
  // PROFILE PICS
  // =========================
  const profilePics = {
    Cherry: "https://i.pravatar.cc/150?img=5",
    Raymond: "https://i.pravatar.cc/150?img=12",
    Anne: "https://i.pravatar.cc/150?img=20"
  };

  // =========================
  // VOICE RECORDING
  // =========================
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // =========================
  // VIDEO CALL STATE
  // =========================
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  // =========================
  // JOIN
  // =========================
  useEffect(() => {
    socket.emit("join", user);
  }, [user]);

  // =========================
  // LOAD CHAT
  // =========================
  useEffect(() => {
    socket.emit("load-chat", { user, target: activeChat });

    socket.on("chat-history", (data) => {
      setMessages(data);
    });

    return () => socket.off("chat-history");
  }, [activeChat]);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", ({ from }) => {
      if (from === activeChat) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1000);
      }
    });

    socket.on("online-users", setOnlineUsers);

    // VIDEO CALL SIGNALING
    socket.on("video-offer", async (data) => {
      setIncomingCall(data);
    });

    socket.on("video-answer", async (data) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    socket.on("ice-candidate", async (data) => {
      if (peerRef.current && data.candidate) {
        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      }
    });

    socket.on("end-video", () => {
      endCall();
    });

    return () => {
      socket.off("message");
      socket.off("typing");
      socket.off("online-users");
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      socket.off("end-video");
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
  const handleTyping = (val) => {
    setText(val);
    socket.emit("typing", { from: user, to: activeChat });
  };

  // =========================
  // MEDIA (IMAGE / VIDEO)
  // =========================
  const handleMedia = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    const msg = {
      id: Date.now(),
      sender: user,
      receiver: activeChat,
      type: file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
        ? "video"
        : "file",
      url,
      status: "sent"
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("message", msg);
  };

  // =========================
  // VOICE NOTES
  // =========================
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
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
    };

    recorder.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  // =========================
  // FILTER CHAT
  // =========================
  const chatMessages = messages.filter(
    (m) =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // VIDEO CALL START
  // =========================
  const startCall = async () => {
    setCalling(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    streamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peerRef.current = peer;

    stream.getTracks().forEach((track) =>
      peer.addTrack(track, stream)
    );

    peer.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: activeChat,
          candidate: event.candidate
        });
      }
    };

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    socket.emit("video-offer", {
      from: user,
      to: activeChat,
      offer
    });
  };

  // =========================
  // ACCEPT CALL
  // =========================
  const acceptCall = async () => {
    setIncomingCall(null);
    setCalling(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    streamRef.current = stream;
    localVideoRef.current.srcObject = stream;

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    peerRef.current = peer;

    stream.getTracks().forEach((track) =>
      peer.addTrack(track, stream)
    );

    peer.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    await peer.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("video-answer", {
      to: incomingCall.from,
      answer
    });
  };

  // =========================
  // END CALL
  // =========================
  const endCall = () => {
    setCalling(false);
    setIncomingCall(null);

    peerRef.current?.close();
    peerRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    socket.emit("end-video", {
      from: user,
      to: activeChat
    });
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

        {users.map((u) => (
          <div
            key={u}
            className={`chat-item ${activeChat === u ? "active" : ""}`}
            onClick={() => setActiveChat(u)}
          >
            <img src={profilePics[u]} className="avatar" />
            {u}
            {onlineUsers.includes(u) ? "🟢" : "⚪"}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div className="chat-container">

        <div className="chat-header">
          Chat with {activeChat}
          <button onClick={startCall}>📹</button>
        </div>

        {typing && <div className="typing">{activeChat} typing...</div>}

        {/* CALL UI */}
        {calling && (
          <div className="call-ui">

            {incomingCall && (
              <div>
                <p>{incomingCall.from} is calling</p>
                <button onClick={acceptCall}>Accept</button>
                <button onClick={endCall}>Reject</button>
              </div>
            )}

            <video ref={localVideoRef} autoPlay muted />
            <video ref={remoteVideoRef} autoPlay />

            <button onClick={endCall}>End</button>
          </div>
        )}

        {/* MESSAGES */}
        <div className="chat-body">

          {chatMessages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.sender === user ? "me" : "them"}`}
            >
              {m.type === "text" && m.text}
              {m.type === "image" && <img src={m.url} />}
              {m.type === "video" && <video src={m.url} controls />}
              {m.type === "voice" && <audio src={m.url} controls />}
            </div>
          ))}

        </div>

        {/* INPUT */}
        <div className="chat-input">

          <input value={text} onChange={(e) => handleTyping(e.target.value)} />

          <input type="file" onChange={handleMedia} />

          <button onClick={sendMessage}>Send</button>

          <button onMouseDown={startRecording} onMouseUp={stopRecording}>
            🎤
          </button>

        </div>

      </div>
    </div>
  );
}