import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";
import { uploadToCloudinary } from "../services/cloudinary";
import Message from "../components/Message";

export default function Chat({ user }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [installPrompt, setInstallPrompt] = useState(null);
  const fileRef = useRef();
  const bottomRef = useRef(null);

  const playSound = () => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/notifications/notification_2.ogg"
    );
    audio.play();
  };

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });
    setMessages(data || []);
  }

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

          if (payload.new.sender !== user) {
            setUnread((prev) => prev + 1);
            playSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Added user to dependency array since it is used inside

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function sendText() {
    if (!text.trim()) return;
    await supabase.from("messages").insert([
      {
        sender: user,
        text,
      },
    ]);

    setText("");
  }

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
    <div
      className="chat-page"
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: "url('/icon-512.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 1. FIXED: Added closing tag to topbar div so it correctly wraps only the header text */}
      <div
        className="topbar"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* 2. FIXED: Fixed the template literal syntax inside HTML prose */}
        Cherry 🍒 {unread > 0 && `(${unread})`}
      </div>

      <div
        className="messages"
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} currentUser={user} />
        ))}

        <div ref={bottomRef}></div>
      </div>

      {installPrompt && (
        <button
          onClick={installApp}
          style={{
            margin: "10px",
            border: "none",
            borderRadius: "12px",
            padding: "12px",
            background: "#7b2cbf",
            color: "white",
            fontWeight: "bold",
          }}
        >
          📱 Install Loved
        </button>
      )}

      <div
        className="composer"
        style={{
          padding: "10px 10px calc(10px + env(safe-area-inset-bottom)) 10px",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
        }}
      >
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

        <button onClick={() => fileRef.current.click()}>📎</button>
      </div>
    </div>
  );
}