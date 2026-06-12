export default function ChatList({ users, active, setActive }) {
  return (
    <div className="chat-list">

      <h3>Chats</h3>

      {users.map((u, i) => (
        <div
          key={i}
          onClick={() => setActive(u)}
          style={{
            padding: 10,
            margin: 5,
            borderRadius: 8,
            cursor: "pointer",
            background: active === u ? "#c8f7c5" : "white"
          }}
        >
          🟢 {u}
        </div>
      ))}
    </div>
  );
}