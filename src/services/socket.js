import { io } from "socket.io-client";

export const socket = io("https://bestman-1.onrender.com", {
  transports: ["websocket"]
});