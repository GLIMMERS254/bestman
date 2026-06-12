import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (!name.trim()) return setError("Enter name");

    if (password !== "15.01.2026") {
      return setError("Wrong password");
    }

    onLogin(name);
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={submit}>

        <h1>Welcome {name || "Cherry / Raymond"}</h1>

        <input
          placeholder="Enter name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="password"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button>Enter Chat</button>

      </form>
    </div>
  );
}