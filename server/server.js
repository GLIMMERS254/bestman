import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import mongoose from "mongoose";
import uploadRoute from "./routes/upload.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// =========================
// DATABASE CONNECTION
// =========================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch(err => console.log("Database connection error:", err));

// =========================
// SOCKET SETUP
// =========================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

// =========================
// RUNTIME MEMORY STORAGE
// =========================
let messages = [];
let users = new Map();

// =========================
// SOCKET REALTIME ROUTER
// =========================
io.on("connection", (socket) => {

  // 🔥 CHAT ENGINE JOIN HOOK: Triggers the absolute second anyone connects
  socket.on("join", (username) => {
    socket.username = username;
    
    users.set(username, {
      socketId: socket.id,
      avatar: null
    });

    console.log(`[Workspace Sync] ${username} connected.`);

    // 🟢 INSTANT MONITOR: Broadcast updated online list to all users
    io.emit("online-users", Array.from(users.keys()));

    // 📥 OFFLINE HISTORY ENGINE: Send all past saved texts directly to this user's screen
    socket.emit("chat-history", messages);
  });

  // SEND MESSAGE HANDLER
  socket.on("message", (msg) => {
    const fullMsg = {
      ...msg,
      status: "sent"
    };

    messages.push(fullMsg);

    // Limit memory footprint to prevent crashes (Keeps last 300 messages)
    if (messages.length > 300) messages.shift();

    // Broadcast live to everyone
    io.emit("message", fullMsg);
  });

  // MESSAGE SEEN (READ RECEIPT ENGINE)
  socket.on("message-seen", ({ messageId }) => {
    messages = messages.map(m =>
      m.id === messageId ? { ...m, status: "seen" } : m
    );

    io.emit("message-updated", {
      messageId,
      status: "seen"
    });
  });

  // LIVE TYPING INDICATORS
  socket.on("typing", ({ from, to }) => {
    io.emit("typing", { from, to });
  });

  // DOUBLE-TAP MESSAGE DELETION
  socket.on("delete-message", ({ messageId }) => {
    messages = messages.filter(m => m.id !== messageId);
    io.emit("message-deleted", { messageId });
  });

  // SYSTEM PROFILES GENERATOR
  socket.on("get-users", () => {
    const result = Array.from(users.entries()).map(([name, data]) => ({
      name,
      avatar: data.avatar
    }));
    io.emit("users-list", result);
  });

  // CLEAN DISCONNECT PIPELINE
  socket.on("disconnect", () => {
    if (socket.username) {
      users.delete(socket.username);
      console.log(`[Workspace Sync] ${socket.username} left.`);
      io.emit("online-users", Array.from(users.keys()));
    }
  });
});

// =========================
// ROUTES & API PIPELINES
// =========================
app.use("/upload", uploadRoute);

app.get("/", (req, res) => {
  res.send("Server Running");
});

// =========================
// START ENGINE
// =========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running securely on port", PORT);
});