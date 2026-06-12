export default function Message({ msg, currentUser }) {
  const isMine = msg.sender === currentUser;

  return (
    <div className={isMine ? "my-message" : "their-message"}>

      {/* TEXT */}
      {msg.text && <p>{msg.text}</p>}

      {/* MEDIA */}
      {msg.media_url && (
        <>
          {msg.media_type === "image" && (
            <img src={msg.media_url} alt="media" />
          )}

          {msg.media_type === "video" && (
            <video controls src={msg.media_url} />
          )}

          {msg.media_type === "audio" && (
            <audio controls src={msg.media_url} />
          )}
        </>
      )}

      {/* TICKS SYSTEM */}
      {isMine && (
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
          {msg.seen
            ? "✔✔ Seen"
            : msg.delivered
            ? "✔✔ Delivered"
            : "✔ Sent"}
        </div>
      )}

    </div>
  );
}