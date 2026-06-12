import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const SECRET = "15.01.2026";

  function handleLogin() {
    if (!name || !password) return;

    if (password === SECRET) {
      localStorage.setItem("user", name);
      onLogin(name);
    } else {
      alert("Wrong password");
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="logo">💜</div>
        <h1>Cherry & Raymond</h1>
        <p>Private Chat App</p>

        <input
          placeholder="Enter name (Cherry / Raymond)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Enter Chat
        </button>
      </div>
    </div>
  );
}