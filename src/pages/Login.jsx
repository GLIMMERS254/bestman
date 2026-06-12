import { useState } from "react";

export default function Login({ onLogin }) {

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const correctPassword = "15.01.2026";

  const handleSubmit = () => {

    if (!name.trim()) {
      setError("Enter your name");
      return;
    }

    if (password !== correctPassword) {
      setError("Wrong password");
      return;
    }

    setError("");

    // AUTO LOGIN SAVE
    localStorage.setItem("user", name);

    onLogin(name);
  };

  return (
    <div className="login-screen">

      <div className="login-card">

        {/* LOGO */}
        <div className="logo">💚</div>

        {/* TITLE */}
        <h1>Secure Chat Login</h1>

        <p>Cherry & Raymond Private Chat</p>

        {/* ERROR */}
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* NAME INPUT */}
        <input
          type="text"
          placeholder="Enter your name (Cherry / Raymond)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* PASSWORD INPUT */}
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* LOGIN BUTTON */}
        <button onClick={handleSubmit}>
          Enter Chat
        </button>

      </div>

    </div>
  );
}