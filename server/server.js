const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ========================
// SOCKET LOGIC
// ========================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (user) => {
    socket.user = user;
    console.log(user, "joined");
  });

  socket.on("message", (msg) => {
    io.emit("message", msg);
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ========================
// TEST ROUTE
// ========================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});