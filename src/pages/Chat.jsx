import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { uploadToCloudinary } from "../services/cloudinary";
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

  useEffect(() => {
    loadMessages();

    // 🔴 realtime listener (ONLY THIS NOW)
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

          if (payload.new.sender !== user) {
            setUnread((prev) => prev + 1);
            playSound();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 💬 send text
  async function sendText() {
    if (!text.trim()) return;

    await supabase.from("messages").insert([
      { sender: user, text },
    ]);

    setText("");
  }

  // 📎 send file
  async function sendFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    let type = "image";

    if (file.type.startsWith("video")) type = "video";
    if (file.type.startsWith("audio")) type = "audio";

    const url = await uploadToCloudinary(file, type);

    await supabase.from("messages").insert([
      {
        sender: user,
        media_url: url,
        media_type: type,
      },
    ]);
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
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} currentUser={user} />
        ))}
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
          style={{ display: "none" }}
        />

        <button onClick={() => fileRef.current.click()}>
          📎
        </button>

      </div>
    </div>
  );
}