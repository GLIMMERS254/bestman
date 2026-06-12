import { useState } from "react";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    if (e) e.preventDefault(); // allows Enter key

    if (password === "15.01.2026") {
      localStorage.setItem("user", "cherry-user"); // simple session
      onLogin("cherry-user");
    } else {
      setError("Wrong password ❌");
    }
  };

  return (
    <div className="login-screen">

      <form className="login-card" onSubmit={handleLogin}>

        <div className="logo">🍒</div>

        <h1>Cherry</h1>
        <p>Welcome back</p>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter password"
        />

        {error && <p style={{ color: "red", fontSize: "12px" }}>{error}</p>}

        <button type="submit">
          Login
        </button>

      </form>

    </div>
  );
}