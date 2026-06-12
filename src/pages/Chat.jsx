import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import Message from "../components/Message";

export default function Chat({ user }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const fileRef = useRef();

  // =========================
  // LOAD MESSAGES
  // =========================
  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    setMessages(data || []);
  }

  // =========================
  // REALTIME
  // =========================
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // =========================
  // TYPING INDICATOR (LOCAL)
  // =========================
  useEffect(() => {
    if (text.length > 0) {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 1000);
      return () => clearTimeout(t);
    }
  }, [text]);

  // =========================
  // SEND TEXT
  // =========================
  async function sendText() {
    if (!text.trim()) return;

    await supabase.from("messages").insert([
      {
        sender: user,
        text,
        delivered: true,
        seen: false,
      },
    ]);

    setText("");
  }

  // =========================
  // SEND FILE
  // =========================
  async function sendFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    let type = "image";
    if (file.type.startsWith("video")) type = "video";
    if (file.type.startsWith("audio")) type = "audio";

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("YOUR_CLOUDINARY_URL", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    await supabase.from("messages").insert([
      {
        sender: user,
        media_url: data.secure_url,
        media_type: type,
        delivered: true,
        seen: false,
      },
    ]);
  }

  // =========================
  // MARK AS SEEN (REALISTIC SIMPLE VERSION)
  // =========================
  async function markSeen() {
    await supabase
      .from("messages")
      .update({ seen: true })
      .neq("sender", user);
  }

  useEffect(() => {
    markSeen();
  }, [messages]);

  return (
    <div className="chat-page">

      {/* WALLPAPER */}
      <div className="chat-wallpaper"></div>

      {/* TOP BAR */}
      <div className="topbar">
        💜 Cherry Chat
      </div>

      {/* MESSAGES */}
      <div className="messages">

        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={msg}
            currentUser={user}
          />
        ))}

        {/* TYPING */}
        {typing && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            typing...
          </div>
        )}

      </div>

      {/* INPUT */}
      <div className="composer">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
        />

        <button onClick={sendText}>➤</button>

        <input
          type="file"
          ref={fileRef}
          onChange={sendFile}
          hidden
        />

        <button onClick={() => fileRef.current.click()}>
          📎
        </button>

      </div>
    </div>
  );
}