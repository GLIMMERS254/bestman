import { useEffect, useState, useRef } from "react";
import { supabase } from "../services/supabase";

export default function Chat({ user, chatId }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  const bottomRef = useRef(null);

  // =========================
  // LOAD MESSAGES
  // =========================
  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  // =========================
  // REALTIME MESSAGES
  // =========================
  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("chat-room")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [chatId]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // TYPING UPDATE
  // =========================
  async function handleTyping(value) {
    setText(value);
    setTyping(true);

    await supabase
      .from("profiles")
      .update({ typing: true })
      .eq("email", user);

    setTimeout(() => setTyping(false), 1000);
  }

  async function stopTyping() {
    await supabase
      .from("profiles")
      .update({ typing: false })
      .eq("email", user);
  }

  // =========================
  // SEND MESSAGE (INSTANT)
  // =========================
  async function sendText() {
    if (!text.trim()) return;

    const newMsg = {
      chat_id: chatId,
      sender: user,
      text,
    };

    // instant UI (WhatsApp style)
    setMessages((prev) => [...prev, newMsg]);
    setText("");

    stopTyping();

    await supabase.from("messages").insert([newMsg]);
  }

  // =========================
  // MARK READ
  // =========================
  useEffect(() => {
    supabase
      .from("messages")
      .update({ read: true })
      .eq("chat_id", chatId)
      .eq("receiver", user);
  }, [chatId]);

  // =========================
  // UI
  // =========================
  return (
    <div className="chat-page">

      {/* TOP BAR */}
      <div className="topbar">
        💬 Chat
      </div>

      {/* MESSAGES */}
      <div className="messages">

        {messages.map((msg, i) => {
          const isMine = msg.sender === user;

          return (
            <div
              key={i}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                background: isMine ? "#7b2cbf" : "#2a2a3d",
                color: "white",
                padding: 10,
                margin: 5,
                borderRadius: 10,
                maxWidth: "70%",
              }}
            >
              {msg.text}

              {msg.read && isMine && (
                <div style={{ fontSize: 10 }}>✔✔</div>
              )}
            </div>
          );
        })}

        {typingUser && (
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            typing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="composer">

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onBlur={stopTyping}
          placeholder="Type message..."
        />

        <button onClick={sendText}>
          ➤
        </button>

      </div>
    </div>
  );
}