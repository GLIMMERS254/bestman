const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let users = {};

io.on("connection", (socket) => {

  socket.on("join", (user) => {
    users[user] = socket.id;
    io.emit("online-users", Object.keys(users));
  });

  socket.on("message", (msg) => {
    const receiver = users[msg.receiver];

    if (receiver) {
      io.to(receiver).emit("message", msg);

      io.to(receiver).emit("message-status", {
        id: msg.id,
        status: "delivered"
      });
    }
  });

  socket.on("seen", (id) => {
    socket.broadcast.emit("message-status", {
      id,
      status: "seen"
    });
  });

  socket.on("typing", (data) => {
    const receiver = users[data.to];
    if (receiver) io.to(receiver).emit("typing", data);
  });

  socket.on("call-user", (data) => {
    const receiver = users[data.to];
    if (receiver) io.to(receiver).emit("incoming-call", data);
  });

  socket.on("accept-call", (data) => {
    const caller = users[data.from];
    if (caller) io.to(caller).emit("call-accepted");
  });

  socket.on("end-call", () => {
    socket.broadcast.emit("call-ended");
  });

  socket.on("disconnect", () => {
    for (let u in users) {
      if (users[u] === socket.id) delete users[u];
    }
    io.emit("online-users", Object.keys(users));
  });
});

server.listen(5000, () => {
  console.log("Server running on 5000");
});