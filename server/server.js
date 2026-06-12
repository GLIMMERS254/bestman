const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// =========================
// ONLINE USERS
// =========================
const users = {};

// =========================
// SOCKET CONNECTION
// =========================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // USER JOIN
  socket.on("join", (userId) => {
    socket.userId = userId;
    users[userId] = socket.id;

    io.emit("online-users", Object.keys(users));
  });

  // CHAT MESSAGE
  socket.on("new-message", async (msg) => {
    io.emit("message-received", msg);

    // OPTIONAL PUSH
    await sendPush(msg.text || "New message");
  });

  // CALL USER
  socket.on("call-user", (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target).emit("incoming-call", data);
    }
  });

  socket.on("answer-call", (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target).emit("call-answered", data);
    }
  });

  socket.on("end-call", (data) => {
    const target = users[data.to];
    if (target) {
      io.to(target).emit("call-ended");
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.userId) {
      delete users[socket.userId];
      io.emit("online-users", Object.keys(users));
    }
  });
});

// =========================
// PUSH NOTIFICATION (ONE SIGNAL)
// =========================
async function sendPush(message) {
  try {
    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: "918bb8ea-5838-4ec8-b4ab-95d130415679",
        included_segments: ["All"],
        headings: { en: "💜 Cherry Chat" },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: "Basic YOUR_REST_API_KEY",
        },
      }
    );
  } catch (err) {
    console.log("Push error:", err.message);
  }
}

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});