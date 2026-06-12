const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*" }
});

// =========================
// MONGO CONNECT
// =========================
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// =========================
// MESSAGE MODEL
// =========================
const Message = mongoose.model("Message", {
  sender: String,
  receiver: String,
  text: String,
  type: String,
  url: String,
  status: String,
  createdAt: { type: Date, default: Date.now }
});

// =========================
// USERS
// =========================
let users = {};

// =========================
// SOCKET
// =========================
io.on("connection", (socket) => {

  socket.on("join", (user) => {
    users[user] = socket.id;
    io.emit("online-users", Object.keys(users));
  });

  // =========================
  // LOAD CHAT HISTORY (SYNC FIX)
  // =========================
  socket.on("load-chat", async ({ user, target }) => {
    const msgs = await Message.find({
      $or: [
        { sender: user, receiver: target },
        { sender: target, receiver: user }
      ]
    });

    socket.emit("chat-history", msgs);
  });

  // =========================
  // SEND MESSAGE + SAVE DB
  // =========================
  socket.on("message", async (msg) => {

    await Message.create(msg);

    const receiverSocket = users[msg.receiver];

    if (receiverSocket) {
      io.to(receiverSocket).emit("message", msg);

      io.to(receiverSocket).emit("message-status", {
        id: msg.id,
        status: "delivered"
      });
    }
  });

  // =========================
  // TYPING
  // =========================
  socket.on("typing", (data) => {
    const r = users[data.to];
    if (r) io.to(r).emit("typing", data);
  });

  // =========================
  // VIDEO CALL SIGNALING
  // =========================
  socket.on("video-offer", (data) => {
    const r = users[data.to];
    if (r) io.to(r).emit("video-offer", data);
  });

  socket.on("video-answer", (data) => {
    const r = users[data.to];
    if (r) io.to(r).emit("video-answer", data);
  });

  socket.on("end-video", () => {
    socket.broadcast.emit("end-video");
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    for (let u in users) {
      if (users[u] === socket.id) delete users[u];
    }
    io.emit("online-users", Object.keys(users));
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});