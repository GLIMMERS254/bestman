import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // =========================
  // AUTO LOGIN STORAGE CHECK
  // =========================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedAvatar = localStorage.getItem("avatar");

    if (savedUser) {
      setUser(savedUser);
      if (savedAvatar) setAvatar(savedAvatar);
      socket.emit("join", savedUser);
    }
    setLoading(false);
  }, []);

  // =========================
  // SOCKET STATE SYNCHRONIZATION
  // =========================
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Secure Connection Established:", socket.id);
    });

    // INSTANT LIVE DETECTOR: Instantly catches when anyone logs in or drops out
    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("connect");
      socket.off("online-users");
    };
  }, []);

  // =========================
  // NOTIFICATION PERMISSION REQUEST
  // =========================
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // =========================
  // PWA SERVICE WORKER
  // =========================
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("Service Worker Registration Postponed:", err);
      });
    }
  }, []);

  // =========================
  // PWA INSTALL ENGINE
  // =========================
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      console.log("PWA Installation Verified Successfully");
    }
    setDeferredPrompt(null);
  };

  const handleLogin = (username, avatarUrl) => {
    setUser(username);
    setAvatar(avatarUrl);
    localStorage.setItem("user", username);
    localStorage.setItem("avatar", avatarUrl);
    socket.emit("join", username);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("avatar");
    setUser(null);
    setAvatar("");
  };

  if (loading) {
    return (
      <div className="login-screen-container">
        <div style={{ color: "#00a884", fontWeight: "bold", fontSize: "16px" }}>
          Initializing Encrypted Channels...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Chat
      user={user}
      avatar={avatar}
      onLogout={logout}
      onlineUsers={onlineUsers}
      deferredPrompt={deferredPrompt}
      onInstall={installApp}
    />
  );
}