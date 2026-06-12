import { useEffect, useState, useRef } from "react";
import ChatList from "./ChatList";
import { socket } from "../services/socket";

export default function Chat({
  user,
  onlineUsers = [],
  onLogout,
}) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState("Cherry");

  // =========================
  // CALL STATES
  // =========================
  const [callState, setCallState] = useState(null); 
  // null | "calling" | "incoming" | "in-call"
  const [caller, setCaller] = useState(null);

  const fileRef = useRef();

  // =========================
  // SOCKET CALL LISTENING
  // =========================
  useEffect(() => {
    socket.on("incoming-call", (data) => {
      setCaller(data.from);
      setCallState("incoming");
    });

    socket.on("call-accepted", () => {
      setCallState("in-call");
    });

    socket.on("call-ended", () => {
      setCallState(null);
      setCaller(null);
    });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-ended");
    };
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      sender: user,
      text,
      type: "text",
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
      sender: user,
      type: "image",
      url,
      time: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("message", msg);
  };

  // =========================
  // CALL FUNCTIONS
  // =========================
  const startCall = (target) => {
    setCallState("calling");

    socket.emit("call-user", {
      from: user,
      to: target
    });
  };

  const acceptCall = () => {
    socket.emit("accept-call", { from: caller, to: user });
    setCallState("in-call");
  };

  const rejectCall = () => {
    socket.emit("reject-call", { from: user });
    setCallState(null);
    setCaller(null);
  };

  const endCall = () => {
    socket.emit("end-call", { from: user });
    setCallState(null);
    setCaller(null);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-page">

      {/* =========================
          CHAT LIST
      ========================= */}
      <ChatList
        users={onlineUsers.length ? onlineUsers : ["Cherry", "Raymond"]}
        activeUser={activeChat}
        setActiveUser={setActiveChat}
      />

      {/* =========================
          CHAT MAIN
      ========================= */}
      <div className="chat-main">

        {/* TOP BAR */}
        <div className="topbar">
          <div>
            💬 {user} chatting with {activeChat}
          </div>

          <div>
            <button onClick={() => startCall(activeChat)}>
              📹 Call
            </button>

            <button onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* =========================
            CALL UI OVERLAY
        ========================= */}
        {callState && (
          <div className="call-overlay">

            <div className="call-box">

              {callState === "calling" && (
                <h2>📞 Calling {activeChat}...</h2>
              )}

              {callState === "incoming" && (
                <>
                  <h2>📞 Incoming Call from {caller}</h2>

                  <div className="call-buttons">
                    <button onClick={acceptCall}>
                      Accept
                    </button>

                    <button onClick={rejectCall}>
                      Reject
                    </button>
                  </div>
                </>
              )}

              {callState === "in-call" && (
                <>
                  <h2>📹 In Call with {caller || activeChat}</h2>

                  <button onClick={endCall}>
                    End Call
                  </button>
                </>
              )}

            </div>
          </div>
        )}

        {/* =========================
            MESSAGES
        ========================= */}
        <div className="messages">

          {messages.map((m, i) => (
            <div key={i} className={m.sender === user ? "my-msg" : "their-msg"}>

              {m.type === "text" && <div>{m.text}</div>}

              {m.type === "image" && (
                <img src={m.url} style={{ width: 180, borderRadius: 10 }} />
              )}

              <small>{m.time}</small>

            </div>
          ))}

        </div>

        {/* =========================
            INPUT
        ========================= */}
        <div className="composer">

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type message..."
          />

          <button onClick={sendMessage}>➤</button>

          <input
            type="file"
            ref={fileRef}
            onChange={sendImage}
            hidden
          />

          <button onClick={() => fileRef.current.click()}>
            📎
          </button>

        </div>

      </div>
    </div>
  );
}