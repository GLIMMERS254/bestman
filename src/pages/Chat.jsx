import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

export default function Chat({ user, onLogout }) {

  // =========================
  // CORE STATE
  // =========================
  const [activeChat, setActiveChat] = useState(
    user === "Cherry" ? "Raymond" : "Cherry"
  );

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // =========================
  // VIDEO CALL STATE
  // =========================
  const [calling, setCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  // =========================
  // LOAD CHAT HISTORY
  // =========================
  useEffect(() => {

    socket.emit("load-chat", {
      user,
      target: activeChat
    });

  }, [activeChat, user]);

  useEffect(() => {

    socket.on("chat-history", (data) => {
      setMessages(data);
    });

    return () => socket.off("chat-history");

  }, []);

  // =========================
  // ONLINE USERS
  // =========================
  useEffect(() => {

    socket.on("online-users", setOnlineUsers);

    return () => socket.off("online-users");

  }, []);

  // =========================
  // RECEIVE MESSAGE
  // =========================
  useEffect(() => {

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("message");

  }, []);

  // =========================
  // TYPING
  // =========================
  useEffect(() => {

    socket.on("typing", ({ from }) => {

      if (from === activeChat) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1000);
      }

    });

    return () => socket.off("typing");

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
  // TYPING EVENT
  // =========================
  const handleTyping = (value) => {

    setText(value);

    socket.emit("typing", {
      from: user,
      to: activeChat
    });

  };
    // =========================
  // VIDEO SIGNALS (SOCKET LISTENERS)
  // =========================
  useEffect(() => {

    socket.on("video-offer", (data) => {
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

      try {
        if (peerRef.current && data.candidate) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (err) {
        console.log("ICE error:", err);
      }

    });

    socket.on("end-video", () => {
      setCalling(false);
      setIncomingCall(null);
      setCallAccepted(false);
    });

    return () => {
      socket.off("video-offer");
      socket.off("video-answer");
      socket.off("ice-candidate");
      socket.off("end-video");
    };

  }, []);

  // =========================
  // START CALL (INITIATOR)
  // =========================
  const startCall = async () => {

    setCalling(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    streamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    peerRef.current = peer;

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
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
  // ACCEPT CALL (RECEIVER)
  // =========================
  const acceptCall = async () => {

    setIncomingCall(null);
    setCalling(true);
    setCallAccepted(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    streamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    peerRef.current = peer;

    stream.getTracks().forEach(track => {
      peer.addTrack(track, stream);
    });

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
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

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: incomingCall.from,
          candidate: event.candidate
        });
      }
    };
  };
    // =========================
  // END CALL
  // =========================
  const endCall = () => {

    setCalling(false);
    setIncomingCall(null);
    setCallAccepted(false);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    socket.emit("end-video", {
      from: user,
      to: activeChat
    });
  };

  // =========================
  // FILTER CHAT MESSAGES
  // =========================
  const chatMessages = messages.filter(
    (m) =>
      (m.sender === user && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === user)
  );

  // =========================
  // MARK MESSAGE AS READ (OPTIONAL UPGRADE HOOK)
  // =========================
  const markAsRead = (messageId) => {
    socket.emit("message-read", {
      messageId,
      from: activeChat
    });
  };

  // =========================
  // UI RENDER
  // =========================
  return (
    <div className="chat-layout">

      {/* =========================
          SIDEBAR (CHAT LIST)
      ========================= */}
      <div className="sidebar">

        <div className="user-header">
          <h3>{user}</h3>
          <button onClick={onLogout}>Logout</button>
        </div>

        {["Cherry", "Raymond"].map((u) => (
          <div
            key={u}
            className={`chat-item ${activeChat === u ? "active" : ""}`}
            onClick={() => setActiveChat(u)}
          >
            💬 {u}

            <span className="online-dot">
              {onlineUsers.includes(u) ? "🟢" : "⚪"}
            </span>
          </div>
        ))}

      </div>

      {/* =========================
          CHAT AREA
      ========================= */}
      <div className="chat-container">

        {/* TOP BAR */}
        <div className="chat-header">
          <div>
            <strong>{activeChat}</strong>
            <div className="status">
              {onlineUsers.includes(activeChat)
                ? "online"
                : "offline"}
            </div>
          </div>

          <button className="call-btn" onClick={startCall}>
            📹 Call
          </button>
        </div>

        {/* =========================
            CALL UI
        ========================= */}
        {calling && (
          <div className="call-ui">

            {/* INCOMING CALL */}
            {incomingCall && !callAccepted && (
              <div className="incoming-call">
                <h3>Incoming Call</h3>
                <p>{incomingCall.from} is calling...</p>

                <button onClick={acceptCall} className="accept">
                  Accept
                </button>

                <button onClick={endCall} className="reject">
                  Reject
                </button>
              </div>
            )}

            {/* VIDEO SCREENS */}
            <div className="video-grid">

              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="local-video"
              />

              <video
                ref={remoteVideoRef}
                autoPlay
                className="remote-video"
              />

            </div>

            {/* END CALL BUTTON */}
            <button className="end-call-btn" onClick={endCall}>
              End Call
            </button>

          </div>
        )}

        {/* =========================
            TYPING INDICATOR
        ========================= */}
        {typing && (
          <div className="typing">
            {activeChat} is typing...
          </div>
        )}

        {/* =========================
            MESSAGES AREA
        ========================= */}
        <div className="chat-body">

          {chatMessages.length === 0 && (
            <div className="empty-chat">
              Start chatting with {activeChat} 💬
            </div>
          )}

          {chatMessages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.sender === user ? "me" : "them"}`}
              onClick={() => markAsRead(m.id)}
            >

              {/* TEXT */}
              {m.type === "text" && m.text}

              {/* IMAGE */}
              {m.type === "image" && (
                <img src={m.url} alt="media" className="chat-img" />
              )}

              {/* VOICE NOTE */}
              {m.type === "voice" && (
                <audio controls src={m.url} />
              )}

              {/* TICKS */}
              <div className="ticks">
                {m.status === "sent" && "✓"}
                {m.status === "delivered" && "✓✓"}
                {m.status === "read" && "✓✓"}
              </div>

            </div>
          ))}

        </div>

        {/* =========================
            INPUT AREA
        ========================= */}
        <div className="chat-input">

          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type a message..."
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>
  );
}