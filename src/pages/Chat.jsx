import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { socket } from "../services/socket";
import Message from "../components/Message";

export default function Chat({ user }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const fileRef = useRef();

  // 🔊 sound
  const playSound = () => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/notifications/notification_2.ogg"
    );
    audio.play();
  };

  // 📥 load messages
  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    setMessages(data || []);
  }

  // 🚀 INIT
  useEffect(() => {
    loadMessages();

    socket.emit("join", user);

    // realtime socket messages
    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      if (msg.sender !== user) {
        setUnread((prev) => prev + 1);
        playSound();
      }
    });

    return () => socket.off("message");
  }, []);

  // 💬 send text
  function sendText() {
    if (!text.trim()) return;

    const msg = {
      sender: user,
      text,
      createdAt: Date.now()
    };

    socket.emit("message", msg);
    setMessages((prev) => [...prev, msg]);
    setText("");
  }

  // 📎 send file (simple placeholder - cloudinary still needed)
  async function sendFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const msg = {
      sender: user,
      media: URL.createObjectURL(file),
      type: file.type
    };

    socket.emit("message", msg);
  }

  return (
    <div className="chat-page">

      {/* TOP BAR */}
      <div className="topbar">
        <h2>
          Cherry 🍒 {unread > 0 && <span>({unread})</span>}
        </h2>
      </div>

      {/* MESSAGES */}
      <div className="messages">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} currentUser={user} />
        ))}
      </div>

      {/* INPUT */}
      <div className="composer">

        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setUnread(0);
          }}
          placeholder="Type message..."
        />

        <button onClick={sendText}>➤</button>

        <input
          type="file"
          ref={fileRef}
          onChange={sendFile}
          style={{ display: "none" }}
        />

        <button onClick={() => fileRef.current.click()}>
          📎
        </button>

      </div>
    </div>
  );
}