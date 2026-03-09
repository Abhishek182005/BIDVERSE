const jwt = require("jsonwebtoken");

// Connected users map: userId -> socketId
const connectedUsers = new Map();

const initSocket = (io) => {
  // Middleware: authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connections for public auction watching
      socket.userId = null;
      socket.userRole = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role; // might not be in token, look up if needed
      next();
    } catch (err) {
      socket.userId = null;
      next(); // Don't disconnect — just mark as unauthenticated
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.id} (user: ${socket.userId || "anon"})`,
    );

    // Track authenticated users
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
    }

    // ── Join auction room ───────────────────────────────────────────────────
    socket.on("join_auction", ({ auctionId }) => {
      if (!auctionId) return;
      socket.join(`auction:${auctionId}`);

      // Acknowledge join
      socket.emit("joined_auction", { auctionId });
    });

    // ── Leave auction room ──────────────────────────────────────────────────
    socket.on("leave_auction", ({ auctionId }) => {
      if (!auctionId) return;
      socket.leave(`auction:${auctionId}`);
    });

    // ── Admin joins dashboard room ──────────────────────────────────────────
    socket.on("join_admin", () => {
      // In production, verify admin role here
      socket.join("admin_room");
    });

    // ── Leave admin room ────────────────────────────────────────────────────
    socket.on("leave_admin", () => {
      socket.leave("admin_room");
    });

    // ── Ping/pong for latency monitoring ───────────────────────────────────
    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
      }
      console.log(`[Socket] Disconnected: ${socket.id} (reason: ${reason})`);
    });
  });
};

const getConnectedUsers = () => connectedUsers;

module.exports = { initSocket, getConnectedUsers };
