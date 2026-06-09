export default function Message({ msg, currentUser }) {
  const mine = msg.sender === currentUser;

  return (
    <div className={mine ? "my-message" : "their-message"}>

      <strong>{msg.sender}</strong>

      {msg.text && <p>{msg.text}</p>}

      {msg.media_type === "image" && (
        <img src={msg.media_url} width="200" />
      )}

      {msg.media_type === "video" && (
        <video src={msg.media_url} controls width="220" />
      )}

    </div>
  );
}