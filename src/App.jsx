import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { socket } from "./services/socket";

/**
 * MAIN APP CONTROLLER
 * - handles login
 * - auto login
 * - install banner
 * - socket join
 * - routing between login/chat
 */

export default function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // =========================
  // AUTO LOGIN
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
  // PWA INSTALL HANDLER
  // =========================
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

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
      <div className="loading">
        Loading Chat System...
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
    <>
      {/* INSTALL BANNER */}
      {installPrompt && (
        <div className="install-bar">
          <span>Install Cherry Chat App</span>
          <button onClick={installApp}>Install</button>
        </div>
      )}

      {/* ONLINE STATUS DEBUG */}
      <div className="online-bar">
        Online: {onlineUsers.length}
      </div>

      {/* CHAT APP */}
      <Chat user={user} onLogout={logout} />
    </>
  );
}