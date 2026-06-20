const { Server }   = require("socket.io");
const jwt          = require("jsonwebtoken");
const { updateLocation } = require("../services/provider.service");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Verify JWT on every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token
      ? socket.handshake.auth.token.replace("Bearer ", "")
      : null;

    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId   = String(decoded.id);
      socket.userRole = decoded.role;
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket: ${socket.userId} (${socket.userRole})`);

    // Each user joins their own personal room
    // Server can push to specific user: io.to(userId).emit(...)
    socket.join(socket.userId);

    // Provider sends GPS location every 5-10 seconds while on job
    socket.on("provider:updateLocation", async ({ longitude, latitude, heading, speed, bookingId }) => {
      if (socket.userRole !== "provider") return;
      
      // We will handle the DB update in the controller or service, but for now we update via service
      await updateLocation(socket.userId, longitude, latitude, heading, speed);
      
      if (bookingId) {
        io.to(`booking:${bookingId}`).emit("location:update", {
          longitude, latitude, heading, speed, timestamp: new Date(),
        });
      }
    });

    // Both customer and provider join this room to share booking events
    socket.on("booking:join",  (bookingId) => socket.join(`booking:${bookingId}`));
    socket.on("booking:leave", (bookingId) => socket.leave(`booking:${bookingId}`));

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Push event to a specific user
const emitToUser = (userId, event, data) => {
  if (io) io.to(String(userId)).emit(event, data);
};

// Push event to everyone in a booking room
const emitToBooking = (bookingId, event, data) => {
  if (io) io.to(`booking:${bookingId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser, emitToBooking };
