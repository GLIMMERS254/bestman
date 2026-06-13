import { useState } from "react";

export default function Login({ onLogin }) {

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const correctPassword = "15.01.2026";

  const handleSubmit = () => {

    if (name.trim() === "") {
      setError("Enter your name");
      return;
    }

    if (password !== correctPassword) {
      setError("Wrong password");
      return;
    }

    setError("");
    localStorage.setItem("user", name);
    onLogin(name);
  };

  return (
    <div className="login-screen">

      <div className="login-card">

        <div className="logo">💚</div>

        <h2>Secure Chat Login</h2>
        <p>Cherry & Raymond Chat</p>

        {error && <div className="error-box">{error}</div>}

        <input
          type="text"
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

        <button onClick={handleSubmit}>
          Enter Chat
        </button>

      </div>

    </div>
  );
}