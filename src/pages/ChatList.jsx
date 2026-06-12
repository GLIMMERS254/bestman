import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export default function ChatList({ user, openChat }) {
  const [chats, setChats] = useState([]);

  async function loadChats() {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .or(`user1.eq.${user},user2.eq.${user}`)
      .order("created_at", { ascending: false });

    setChats(data || []);
  }

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <div className="chat-list-page">

      {/* TOP BAR */}
      <div className="topbar">
        💬 Your Chats
      </div>

      {/* CHAT LIST */}
      <div className="chat-list">

        {chats.length === 0 && (
          <p style={{ padding: 20, opacity: 0.6 }}>
            No chats yet
          </p>
        )}

        {chats.map((chat) => {
          const otherUser =
            chat.user1 === user ? chat.user2 : chat.user1;

          return (
            <div
              key={chat.id}
              onClick={() => openChat(chat)}
              style={{
                padding: 15,
                borderBottom: "1px solid #2a2a3d",
                cursor: "pointer",
                background: "#0f0f17",
              }}
            >
              <div style={{ fontWeight: "bold" }}>
                {otherUser}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Tap to open chat
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}