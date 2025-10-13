let connectedUsers = [];

const UserSockets = function (io) {
  io.on("connection", (socket) => {
    // Check if the user is already connected
    console.log('connected users',connectedUsers)
    if (connectedUsers.some((user) => user.socketId === socket.id)) {
      return;
    }

    const userId = socket.handshake.query.userId;
    console.log('user id from handshake',userId)

    if (!userId) {
      console.log("User without userId tried to connect");
      return;
    }

    console.log("New user connected:", userId);
    console.log(" Incoming connection:", socket.id, "with userId:", socket.handshake.query.userId);
    
    addUser(socket.id, userId);
    io.to(socket.id).emit("welcome", "Welcome " + userId);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      removeUser(socket.id);
    });
  });
};


const removeUser = (socketId) => {
  connectedUsers = connectedUsers.filter((user) => user.socketId !== socketId);
};

const getConnectedUsers = () => {
  return connectedUsers;
};

const addUser = (socketId, userId) => {
  const normalizedId = userId.toString();  // ensure string
  if (!connectedUsers.some((u) => u.socketId === socketId)) {
    connectedUsers.push({ socketId, userId: normalizedId });
    console.log(" Added user:", { socketId: socketId, userId });
    console.log("Current connectedUsers:", connectedUsers);
  }
};

const getConnectedSocketByUserId = (userId) => {
  console.log("connectedUsers before lookup:", getConnectedUsers());
  const normalizedId = userId.toString();
  console.log('connected socket by user id',connectedUsers.find((u) => u.userId === normalizedId))
  return connectedUsers.find((u) => u.userId === normalizedId);
};


module.exports = {
  getConnectedUsers,
  getConnectedSocketByUserId,
  UserSockets,
};
