import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

export default function App() {

  // =========================
  // STATE
  // =========================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // =========================
  // AUTO LOGIN
  // =========================
  useEffect(() => {

    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(savedUser);
      socket.emit("join", savedUser);
    }

    setLoading(false);

  }, []);

  // =========================
  // SOCKET CONNECTION
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
  // NOTIFICATION PERMISSION
  // =========================
  useEffect(() => {

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

  }, []);

  // =========================
  // SERVICE WORKER (PWA PUSH BASE)
  // =========================
  useEffect(() => {

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

  }, []);

  // =========================
  // PWA INSTALL HANDLER
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
      console.log("App installed");
    }

    setDeferredPrompt(null);
  };

  // =========================
  // LOGIN
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
      <div style={{
        color: "white",
        textAlign: "center",
        marginTop: 50
      }}>
        Loading chat...
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

      {/* =========================
          INSTALL APP BUTTON
      ========================= */}
      {deferredPrompt && (
        <button
          onClick={installApp}
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "#25d366",
            border: "none",
            padding: "10px 15px",
            borderRadius: 20,
            fontWeight: "bold",
            zIndex: 9999,
            cursor: "pointer"
          }}
        >
          📲 Install App
        </button>
      )}

      {/* =========================
          ONLINE USERS BAR
      ========================= */}
      <div style={{
        background: "#111b21",
        color: "white",
        padding: 8,
        textAlign: "center"
      }}>
        Online users: {onlineUsers.length}
      </div>

      {/* =========================
          CHAT APP
      ========================= */}
      <Chat
        user={user}
        onLogout={logout}
        onlineUsers={onlineUsers}
      />

    </div>
  );
}