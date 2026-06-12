import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  // =========================
  // AUTO LOGIN
  // =========================
  useEffect(() => {
    const saved = localStorage.getItem("user");

    if (saved) {
      setUser(saved);
      socket.emit("join", saved);
    }
  }, []);

  // =========================
  // SOCKET EVENTS
  // =========================
  useEffect(() => {
    socket.on("online-users", setOnlineUsers);

    socket.on("incoming-call", (data) => {
      setIncomingCall(data);
    });

    socket.on("call-ended", () => {
      setIncomingCall(null);
    });

    return () => {
      socket.off("online-users");
      socket.off("incoming-call");
      socket.off("call-ended");
    };
  }, []);

  // =========================
  // LOGIN
  // =========================
  const handleLogin = (name) => {
    setUser(name);
    localStorage.setItem("user", name);
    socket.emit("join", name);
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    socket.emit("leave", user);
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Chat
      user={user}
      onlineUsers={onlineUsers}
      incomingCall={incomingCall}
      setIncomingCall={setIncomingCall}
      onLogout={logout}
    />
  );
}