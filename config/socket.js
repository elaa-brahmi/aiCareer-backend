const { Server } = require("socket.io");

let ioInstance;

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  console.log(" Socket.IO initialized");
  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO };
