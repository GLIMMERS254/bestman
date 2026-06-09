import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import Message from "../components/Message";

export default function Chat({ user }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [openChat, setOpenChat] = useState(false);

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .order("id", { ascending: true });

    setMessages(data || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    await supabase.from("messages").insert([
      {
        sender: user,
        text,
      },
    ]);

    setText("");
  }

  if (!openChat) {
    return (
      <div className="chat-list-page">
        <div className="topbar">
          <h2>Loved 💜</h2>
        </div>

        <div
          className="chat-card"
          onClick={() => setOpenChat(true)}
        >
          <div className="avatar">
            🍒
          </div>

          <div>
            <h3>Cherry</h3>
            <p>
              Open your private conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">

      <div className="topbar">

        <button
          onClick={() => setOpenChat(false)}
        >
          ←
        </button>

        <div>
          <h2 style={{ margin: 0 }}>
            Cherry 🍒
          </h2>

          <small>
            Private Chat
          </small>
        </div>

      </div>

      <div className="messages">

        {messages.map((msg) => (
          <Message
            key={msg.id}
            msg={msg}
            currentUser={user}
          />
        ))}

      </div>

      <div className="composer">

        <input
          placeholder="Type a message..."
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          onKeyDown={(e) =>
            e.key === "Enter" &&
            sendMessage()
          }
        />

        <button onClick={sendMessage}>
          ➤
        </button>

      </div>

    </div>
  );
}