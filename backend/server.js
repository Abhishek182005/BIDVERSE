const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/database");
const errorHandler = require("./src/middleware/errorHandler");
const authRoutes = require("./src/routes/auth");
const auctionRoutes = require("./src/routes/auctions");
const bidRoutes = require("./src/routes/bids");
const adminRoutes = require("./src/routes/admin");
const userRoutes = require("./src/routes/users");
const uploadRoutes = require("./src/routes/upload");
const { initSocket } = require("./src/socket/socketHandler");
const { startAuctionScheduler } = require("./src/utils/auctionScheduler");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Logger ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Attach io to req ────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── Static: uploaded images ─────────────────────────────────────────────────
const path = require("path");
// helmet sets Cross-Origin-Resource-Policy: same-origin globally; override for
// the uploads folder so browsers on other origins (e.g. the Next.js frontend)
// can freely load the images via <img> tags.
app.use("/uploads", (_req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// ─── Socket.io ───────────────────────────────────────────────────────────────
initSocket(io);

// ─── Auction Scheduler ───────────────────────────────────────────────────────
startAuctionScheduler(io);

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\x1b[32m✓ BidVerse server running on port ${PORT}\x1b[0m`);
  if (process.env.NODE_ENV === "development") {
    console.log(`  API:    http://localhost:${PORT}/api`);
    console.log(`  Health: http://localhost:${PORT}/api/health`);
  }
});

module.exports = { app, io };
