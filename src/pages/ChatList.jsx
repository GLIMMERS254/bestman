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
            background: active === u ? "#ddd" : "#fff",
            cursor: "pointer",
            borderRadius: 8
          }}
        >
          🟢 {u}
        </div>
      ))}
    </div>
  );
}