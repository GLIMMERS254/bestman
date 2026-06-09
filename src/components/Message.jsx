import { supabase } from "../services/supabase";

export default function Message({ msg, currentUser }) {
  const mine = msg.sender === currentUser;

  async function react(emoji) {
    await supabase
      .from("messages")
      .update({ reaction: emoji })
      .eq("id", msg.id);
  }

  return (
    <div className={mine ? "my-message" : "their-message"}>
      <strong>{msg.sender}</strong>

      {msg.text && <div>{msg.text}</div>}

      {msg.image_url && (
        <img
          src={msg.image_url}
          alt=""
          style={{
            width: "220px",
            borderRadius: "10px",
            marginTop: "8px"
          }}
        />
      )}

      <small>
        {new Date(msg.created_at).toLocaleTimeString()}
      </small>

      <div style={{ marginTop: "5px" }}>
        <button onClick={() => react("❤️")}>❤️</button>
        <button onClick={() => react("😘")}>😘</button>
        <button onClick={() => react("😍")}>😍</button>
      </div>

      {msg.reaction && (
        <div style={{ marginTop: "5px" }}>
          {msg.reaction}
        </div>
      )}
    </div>
  );
}