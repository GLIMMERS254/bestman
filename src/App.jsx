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

  // ==========================================
  // AUTO LOGIN LOCALSTORAGE PROFILE RESTORE
  // ==========================================
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

  // ==========================================
  // SECURE WEBSOCKET SYNCHRONIZATION STREAM
  // ==========================================
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Secure Connection Established:", socket.id);
    });

    // Instantly monitors incoming user connection states live on screen
    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("connect");
      socket.off("online-users");
    };
  }, []);

  // ==========================================
  // NATIVE PUSH NOTIFICATION REQUEST HOOK
  // ==========================================
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification capability status:", permission);
      });
    }
  }, []);

  // ==========================================
  // 🔥 PRODUCTION-GRADE PWA APP DRAWER ENGINE
  // ==========================================
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Loved Chat System Registered! Scope:", registration.scope);
            
            // Force code updates instantly if a new shell is deployed
            if (registration.active) {
              registration.update();
            }
          })
          .catch((err) => {
            console.error("Native App compilation rejected:", err);
          });
      });
    }
  }, []);

  // ==========================================
  // NATIVE OPERATING SYSTEM INSTALL PROMPT
  // ==========================================
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
      console.log("PWA Installation Verified and Package Created!");
    }
    setDeferredPrompt(null);
  };

  // ==========================================
  // USER WORKSPACE AUTH OVERLAYS
  // ==========================================
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

  // ==========================================
  // VIEWPORT MATRIX ROUTER
  // ==========================================
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