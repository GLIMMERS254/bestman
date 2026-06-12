import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // =========================
  // AUTO LOGIN FIX
  // =========================
  useEffect(() => {

    const saved = localStorage.getItem("user");

    if (saved) {
      setUser(saved);
      socket.emit("join", saved);
    }

    setLoading(false);

  }, []);

  // =========================
  // SOCKET INIT
  // =========================
  useEffect(() => {

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("connect");
      socket.off("online-users");
    };

  }, []);

  // =========================
  // LOGIN HANDLER
  // =========================
  const handleLogin = (username) => {

    setUser(username);
    localStorage.setItem("user", username);

    socket.emit("join", username);
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {

    localStorage.removeItem("user");
    setUser(null);

  };

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div style={{ color: "white", padding: 20 }}>
        Loading...
      </div>
    );
  }

  // =========================
  // LOGIN SCREEN
  // =========================
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // =========================
  // MAIN APP
  // =========================
  return (
    <div>

      <div className="online-bar">
        Online users: {onlineUsers.length}
      </div>

      <Chat user={user} onLogout={logout} />

    </div>
  );
}