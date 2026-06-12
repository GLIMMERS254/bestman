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
      socket.emit("join", savedUser);
    }

    setLoading(false);
  }, []);

  // =========================
  // 🔌 SOCKET EVENTS (SAFE SETUP)
  // =========================
  useEffect(() => {
    const handleConnect = () => {
      console.log("Connected:", socket.id);
    };

    const handleUsers = (users) => {
      setOnlineUsers(users);
    };

    const handleDisconnect = () => {
      console.log("Disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("online-users", handleUsers);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("online-users", handleUsers);
      socket.off("disconnect", handleDisconnect);
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
  // 🎥 VIDEO CALL SYSTEM
  // =========================
  const startVideoCall = (targetUser) => {
    socket.emit("video-call-request", {
      from: user,
      to: targetUser,
    });
  };

  const acceptVideoCall = (data) => {
    socket.emit("