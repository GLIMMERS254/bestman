import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);

  // =========================
  // 🔐 AUTO LOGIN (ON LOAD)
  // =========================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(savedUser);

      // join socket once
      socket.emit("join", savedUser);
    }

    setLoading(false);
  }, []);

  // =========================
  // 🔌 SOCKET CONNECTION (SAFE LISTENERS)
  // =========================
  useEffect(() => {
    const onConnect = () => {
      console.log("Connected:", socket.id);
    };

    const onUsers = (users) => {
      setOnlineUsers(users);
    };

    const onCall = (data) => {
      // incoming call popup trigger
      setIncomingCall(data);
    };

    const onCallEnd = () => {
      setIncomingCall(null);
    };

    socket.on("connect", onConnect);
    socket.on("online-users", onUsers);
    socket.on("video-call-request", onCall);
    socket.on("video-call-ended", onCallEnd);

    return () => {
      socket.off("connect", onConnect);
      socket.off("online-users", onUsers);
      socket.off("video-call-request", onCall);
      socket.off("video-call-ended", onCallEnd);
    };
  }, []);

  // =========================
  // 🔐 LOGIN
  // =========================
  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("user", username);

    socket.emit("join", username);
  };

  // =========================
  // 🚪 LOGOUT
  // =========================
  const handleLogout = () => {
    socket.emit("leave", user);
    localStorage.removeItem("user");
    setUser(null);
  };

  // =========================
  // 🎥 VIDEO CALL HANDLERS
  // =========================
  const startVideoCall = (targetUser) => {
    socket.emit("video-call-request", {
      from: user,
      to: targetUser,
    });
  };

  const acceptVideoCall = () => {
    socket.emit("video-call-accept", incomingCall);
    setIncomingCall(null);
  };

  const endVideoCall = () => {
    socket.emit("video-call-end", {
      from: user,
    });

    setIncomingCall(null);
  };

  // =========================
  // ⏳ LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Loading Cherry Chat...
      </div>
    );
  }

  // =========================
  // 🔐 LOGIN SCREEN
  // =========================
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // =========================
  // 💬 MAIN APP
  // =========================
  return (
    <Chat
      user={user}
      onlineUsers={onlineUsers}
      onLogout={handleLogout}
      startVideoCall={startVideoCall}
      acceptVideoCall={acceptVideoCall}
      endVideoCall={endVideoCall}
      incomingCall={incomingCall}
    />
  );
}