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

  // 🔊 sound
  const playSound = () => {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/notifications/notification_2.ogg"
    );
    audio.play();
  };

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
  // REALTIME LISTENER
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

          if (payload.new.sender !== user) {
            setUnread((prev) => prev + 1);
            playSound();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // PWA INSTALL BUTTON
  // =========================
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

  // =========================
  // SEND TEXT (INSTANT + PUSH)
  // =========================
  async function sendText() {
    if (!text.trim()) return;

    const tempMsg = {
      id: Date.now(),
      sender: user,
      text,
      created_at: new Date().toISOString(),
    };

    // ⚡ INSTANT UI (WhatsApp style)
    setMessages((prev) => [...prev, tempMsg]);
    setText("");

    // 💾 save to database
    await supabase.from("messages").insert([
      {
        sender: user,
        text,
      },
    ]);

    // 📲 trigger push notification
    await fetch(
      "https://ihqpdlkwipxnnzpkjmlb.supabase.co/functions/v1/send-push",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: user,
          message: text,
        }),
      }
    );
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

    const url = await uploadToCloudinary(file, type);

    const newMsg = {
      id: Date.now(),
      sender: user,
      media_url: url,
      media_type: type,
    };

    setMessages((prev) => [...prev, newMsg]);

    await supabase.from("messages").insert([newMsg]);
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
      {/* TOP BAR */}
      <div
        className="topbar"
        style={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        Cherry 🍒 {unread > 0 && `(${unread})`}
      </div>

      {/* MESSAGES */}
      <div
        className="messages"
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(0,0,0,0.25)",
          padding: 10,
        }}
      >
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} currentUser={user} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* INSTALL BUTTON */}
      {installPrompt && (
        <button
          onClick={installApp}
          style={{
            margin: 10,
            padding: 12,
            borderRadius: 12,
            background: "#7b2cbf",
            color: "white",
            border: "none",
          }}
        >
          📱 Install App
        </button>
      )}

      {/* COMPOSER */}
      <div
        className="composer"
        style={{
          display: "flex",
          padding: "10px 10px calc(10px + env(safe-area-inset-bottom)) 10px",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(12px)",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "none",
            outline: "none",
          }}
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