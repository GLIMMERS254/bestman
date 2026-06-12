import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // 🧠 VALIDATION
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (password !== "15.01.2026") {
      setError("Wrong password ❌");
      return;
    }

    // 💾 SAVE USER FOR AUTO LOGIN
    localStorage.setItem("user", name);

    // 🚀 GO TO CHAT
    onLogin(name);
  };

  return (
    <div className="login-screen">

      <form className="login-card" onSubmit={handleSubmit}>

        <div className="logo">🍒</div>

        <h1>Cherry</h1>
        <p>Enter to continue</p>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        {error && (
          <p style={{ color: "red", fontSize: "12px" }}>
            {error}
          </p>
        )}

        <button type="submit">
          Enter Chat
        </button>

      </form>

    </div>
  );
}