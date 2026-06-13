import { useState } from "react";
import { socket } from "../services/socket";

export default function Login({ onLogin }) {

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  const handleLogin = () => {

    if (!name.trim()) return;

    localStorage.setItem("user", name);

    socket.emit("login", {
      user: name,
      deviceId: navigator.userAgent,
      avatar
    });

    onLogin(name);
  };

  return (
    <div className="login-screen">

      <div className="login-card">

        <h1>💬 WhatsApp Style Chat</h1>

        <input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Profile picture URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />

        <button onClick={handleLogin}>
          Enter Chat
        </button>

      </div>

    </div>
  );
}