import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // =========================
  // 🔐 AUTO LOGIN SYSTEM
  // =========================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(savedUser);

      // join chat room immediately
      socket.emit("join", savedUser);
    }

    setLoading(false);
  }, []);

  // =========================
  // 🔌 SOCKET CONNECTION EVENTS
  // =========================
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      socket.off("connect");
      socket.off("online-users");
      socket.off("disconnect");
    };
  }, []);

  // =========================
  // 🔐 LOGIN FUNCTION
  // =========================
  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("user", username);

    socket.emit("join", username);
  };

  // =========================
  // 🚪 LOGOUT FUNCTION
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);

    socket.emit("leave", user);
  };

  // =========================
  // 🎥 VIDEO CALL SYSTEM (HOOK PLACEHOLDER)
  // =========================
  const startVideoCall = (targetUser) => {
    socket.emit("video-call-request", {
      from: user,
      to: targetUser
    });
  };

  const acceptVideoCall = (data) => {
    socket.emit("video-call-accept", data);
  };

  const endVideoCall = () => {
    socket.emit("video-call-end", {
      from: user
    });
  };

  // =========================
  // 📞 LISTEN FOR CALL EVENTS
  // =========================
  useEffect(() => {
    socket.on("video-call-request", (data) => {
      console.log("Incoming call from:", data.from);
    });

    socket.on("video-call-accepted", (data) => {
      console.log("Call accepted:", data);
    });

    socket.on("video-call-ended", () => {
      console.log("Call ended");
    });

    return () => {
      socket.off("video-call-request");
      socket.off("video-call-accepted");
      socket.off("video-call-ended");
    };
  }, []);

  // =========================
  // ⏳ LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: 50 }}>
        Loading Cherry...
      </div>
    );
  }

  // =========================
  // 🔐 NOT LOGGED IN → LOGIN
  // =========================
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // =========================
  // 💬 MAIN CHAT APP
  // =========================
  return (
    <Chat
      user={user}
      onLogout={handleLogout}
      onlineUsers={onlineUsers}
      startVideoCall={startVideoCall}
      acceptVideoCall={acceptVideoCall}
      endVideoCall={endVideoCall}
    />
  );
}