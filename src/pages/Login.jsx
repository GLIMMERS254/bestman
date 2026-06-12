import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!name) return alert("Enter name");

    if (password !== "15.01.2026") {
      alert("Wrong password");
      return;
    }

    localStorage.setItem("user", name);
    onLogin(name);
  };

  return (
    <div className="login-screen">

      <div className="login-card">

        <div className="logo">💚</div>

        <h1>Cherry & Raymond</h1>
        <p>Private Chat System</p>

        <input
          placeholder="Enter name (Cherry / Raymond)"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Enter Chat
        </button>

      </div>

    </div>
  );
}