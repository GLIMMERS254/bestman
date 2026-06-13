import { useState } from "react";
import { socket } from "../services/socket";

export default function Login({ onLogin }) {

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [preview, setPreview] = useState(null);

  const correctPassword = "15.01.2026";

  // PICK IMAGE FROM GALLERY
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleLogin = () => {

    if (!name.trim()) return;

    if (password !== correctPassword) {
      alert("Wrong password");
      return;
    }

    const avatarURL = preview || "";

    localStorage.setItem("user", name);
    localStorage.setItem("avatar", avatarURL);

    socket.emit("login", {
      user: name,
      deviceId: navigator.userAgent,
      avatar: avatarURL
    });

    onLogin(name, avatarURL);
  };

  return (
    <div className="login-screen">

      <div className="login-card">

        {/* BRAND HEADER */}
        <div style={{ fontSize: 40, marginBottom: 10 }}>
          💚 ⭕ ⭕ 💚
        </div>

        <h1>Ray & Cherry</h1>
        <p style={{ fontStyle: "italic", marginBottom: 10 }}>
          Intertwined connection chat 💫
        </p>

        {/* NAME */}
        <input
          placeholder="Enter name (Ray / Cherry)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* PROFILE IMAGE PICK */}
        <input type="file" accept="image/*" onChange={handleImage} />

        {preview && (
          <img
            src={preview}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              marginTop: 10,
              objectFit: "cover"
            }}
          />
        )}

        <button onClick={handleLogin}>
          Enter Chat 💬
        </button>

      </div>

    </div>
  );
}