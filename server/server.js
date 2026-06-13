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
// DATABASE
// =========================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

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
// MEMORY STORAGE
// =========================
let messages = [];
let users = new Map();

// =========================
// SOCKET EVENTS
// =========================
io.on("connection", (socket) => {

  // LOGIN WITH PROFILE
  socket.on("login", ({ user, deviceId, avatar }) => {

    users.set(user, {
      socketId: socket.id,
      deviceId,
      avatar: avatar || null
    });

    io.emit("online-users", Array.from(users.keys()));
  });

  // SEND MESSAGE
  socket.on("message", (msg) => {

    const fullMsg = {
      ...msg,
      status: "sent"
    };

    messages.push(fullMsg);
    io.emit("message", fullMsg);
  });

  // MESSAGE SEEN (READ RECEIPT)
  socket.on("message-seen", ({ messageId }) => {

    messages = messages.map(m =>
      m.id === messageId ? { ...m, status: "seen" } : m
    );

    io.emit("message-updated", {
      messageId,
      status: "seen"
    });
  });

  // TYPING INDICATOR
  socket.on("typing", ({ from, to }) => {
    io.emit("typing", { from, to });
  });

  // DELETE MESSAGE
  socket.on("delete-message", ({ messageId }) => {

    messages = messages.filter(m => m.id !== messageId);

    io.emit("message-deleted", { messageId });
  });

  // GET USERS WITH PROFILES
  socket.on("get-users", () => {

    const result = Array.from(users.entries()).map(([name, data]) => ({
      name,
      avatar: data.avatar
    }));

    io.emit("users-list", result);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    io.emit("online-users", Array.from(users.keys()));
  });
});

// =========================
// ROUTES
// =========================
app.use("/upload", uploadRoute);

app.get("/", (req, res) => {
  res.send("Server Running");
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});