import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";
import mongoose from "mongoose";
import uploadRoute from "./routes/upload.js";
import { Message } from "./models/Message.js"; // 🔥 IMPORT MODEL

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

// RUNTIME MEMORY FOR USERS
let users = new Map();

// =========================
// SOCKET REALTIME ROUTER
// =========================
io.on("connection", (socket) => {

  // CHAT ENGINE JOIN HOOK
  socket.on("join", async (username) => {
    socket.username = username;
    
    users.set(username, {
      socketId: socket.id,
      avatar: null
    });

    console.log(`[Workspace Sync] ${username} connected.`);
    io.emit("online-users", Array.from(users.keys()));

    try {
      // 📥 FETCH PERMANENT HISTORY: Get last 200 messages from MongoDB
      const dbMessages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(200);
      
      // Reverse them so they are in correct chronological order (oldest to newest)
      socket.emit("chat-history", dbMessages.reverse());
    } catch (err) {
      console.error("Failed to fetch history from MongoDB:", err);
    }
  });

  // SEND MESSAGE HANDLER (SAVING TO DB)
  socket.on("message", async (msg) => {
    try {
      // 🔥 SAVE TO MONGODB: Keep text permanently safe
      const savedMsg = await Message.create({
        sender: msg.sender,
        receiver: msg.receiver,
        text: msg.text,
        type: msg.type,
        url: msg.url,
        status: "sent"
      });

      // Broadcast the saved database message object (includes auto-generated MongoDB IDs)
      io.emit("message", savedMsg);
    } catch (err) {
      console.error("Failed to save message to database:", err);
    }
  });

  // MESSAGE SEEN (READ RECEIPT ENGINE)
  socket.on("message-seen", async ({ messageId }) => {
    try {
      // Update status in MongoDB permanently
      await Message.findByIdAndUpdate(messageId, { status: "seen" });

      io.emit("message-updated", {
        messageId,
        status: "seen"
      });
    } catch (err) {
      console.error("Failed to update message status in DB:", err);
    }
  });

  // LIVE TYPING INDICATORS
  socket.on("typing", ({ from, to }) => {
    io.emit("typing", { from, to });
  });

  // DOUBLE-TAP MESSAGE DELETION
  socket.on("delete-message", async ({ messageId }) => {
    try {
      // Delete permanently from MongoDB
      await Message.findByIdAndDelete(messageId);
      io.emit("message-deleted", { messageId });
    } catch (err) {
      console.error("Failed to delete message from DB:", err);
    }
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
      io.emit("online-users", Array.from(users.keys()));
    }
  });
});

app.use("/upload", uploadRoute);

app.get("/", (req, res) => {
  res.send("Server Running");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running securely on port", PORT);
});