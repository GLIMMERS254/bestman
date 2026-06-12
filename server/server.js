const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// =========================
// USERS MEMORY
// =========================
let users = {};

// =========================
// SOCKET CONNECTION
// =========================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // =========================
  // JOIN USER
  // =========================
  socket.on("join", (username) => {
    users[username] = socket.id;

    io.emit("online-users", Object.keys(users));
  });

  // =========================
  // SEND MESSAGE
  // =========================
  socket.on("message", (msg) => {
    const receiverSocket = users[msg.receiver];

    if (receiverSocket) {
      io.to(receiverSocket).emit("message", msg);

      // mark as delivered
      io.to(receiverSocket).emit("message-status", {
        id: msg.id,
        status: "delivered"
      });
    }
  });

  // =========================
  // MESSAGE SEEN
  // =========================
  socket.on("seen", (msgId) => {
    socket.broadcast.emit("message-status", {
      id: msgId,
      status: "seen"
    });
  });

  // =========================
  // CALL USER
  // =========================
  socket.on("call-user", (data) => {
    const targetSocket = users[data.to];

    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", {
        from: data.from
      });
    }
  });

  // =========================
  // ACCEPT CALL
  // =========================
  socket.on("accept-call", (data) => {
    const callerSocket = users[data.from];

    if (callerSocket) {
      io.to(callerSocket).emit("call-accepted", {
        from: data.from
      });
    }
  });

  // =========================
  // END CALL
  // =========================
  socket.on("end-call", (data) => {
    socket.broadcast.emit("call-ended");
  });

  // =========================
  // LEAVE
  // =========================
  socket.on("leave", (username) => {
    delete users[username];
    io.emit("online-users", Object.keys(users));
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    for (let user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        break;
      }
    }

    io.emit("online-users", Object.keys(users));

    console.log("User disconnected:", socket.id);
  });
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});