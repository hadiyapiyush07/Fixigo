/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: server.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURPOSE:
  This is the ENTRY POINT of the entire backend.
  When you run "npm run dev", Node.js starts here.
  It connects to all services and starts the HTTP server.

WHAT IT DOES STEP BY STEP:
  1. Load .env file (secret keys into process.env)
  2. Connect to MongoDB database
  3. Connect to Redis cache
  4. Initialize Firebase for push notifications
  5. Create HTTP server from Express app
  6. Attach Socket.IO to HTTP server (for real-time features)
  7. Start listening on PORT 5000

HOW TO RUN:
  npm run dev    ← development (auto-restart on file change)
  npm start      ← production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

// MUST be the very first line — loads all .env variables
// before any other code tries to use them
require("dotenv").config();

const http = require("http");

// Import our Express app (all routes and middleware configured there)
const app = require("./src/app");

// Import all service connectors
const connectDB          = require("./src/config/db");
const { connectRedis }   = require("./src/config/redis");
const { initFirebase }   = require("./src/config/firebase");
const { initSocket }     = require("./src/socket/socket");
const { startHeartbeatService } = require("./src/services/heartbeat.service");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // ── Step 1: Connect MongoDB ──────────────────────────────
  // If MongoDB fails → process.exit(1) is called inside connectDB
  // App cannot run without a database
  await connectDB();

  // ── Step 2: Connect Redis ────────────────────────────────
  // Redis is used for OTP storage and caching
  // Non-blocking — if Redis fails, app still runs (without caching)
  await connectRedis();

  // ── Step 3: Initialize Firebase ─────────────────────────
  // Firebase Admin SDK for sending push notifications
  // Non-blocking — push notifications just won't work if Firebase fails
  initFirebase();

  // Cloudinary configures automatically when imported
  // No async call needed for Cloudinary

  // ── Step 4: Create HTTP server ───────────────────────────
  // We wrap Express in a raw HTTP server so Socket.IO can attach to it
  // If we just did app.listen(), Socket.IO couldn't share the same port
  const server = http.createServer(app);

  // ── Step 5: Attach Socket.IO ─────────────────────────────
  // Socket.IO enables real-time features:
  //   - Provider location streaming (customer sees provider moving on map)
  //   - Booking status updates (customer sees status change instantly)
  //   - Live chat between customer and provider
  initSocket(server);

  // ── Step 5.1: Start Heartbeat Service ────────────────────
  startHeartbeatService();

  // ── Step 6: Start listening ──────────────────────────────
  server.listen(PORT, () => {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🚀  ServiceBook API started`);
    console.log(`📡  Port     : ${PORT}`);
    console.log(`🌍  Env      : ${process.env.NODE_ENV}`);
    console.log(`🔗  Health   : http://localhost:${PORT}/health`);
    console.log(`🔗  API Base : http://localhost:${PORT}/api`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  });

  // ── Server-level error handler ───────────────────────────
  // Catches EADDRINUSE immediately instead of crashing with an unhandled event
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌  Port ${PORT} is already in use.`);
      console.error(`   → Stop the other server first, then run npm run dev again.\n`);
    } else {
      console.error("Server error:", err.message);
    }
    process.exit(1);
  });

  // ── Graceful shutdown helper ─────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n⏳  ${signal} received — closing HTTP server...`);
    server.close(() => {
      console.log("✅  HTTP server closed. Exiting.");
      process.exit(0);
    });

    // Force-exit after 5 seconds if server didn't close in time
    setTimeout(() => {
      console.error("⚠️  Forced exit after 5s timeout.");
      process.exit(1);
    }, 5000).unref();
  };

  // ── Signal handlers ──────────────────────────────────────
  // SIGINT  = Ctrl+C in terminal, AND what nodemon sends on restart
  // SIGTERM = what hosting platforms (Heroku, Railway) send on deploy/shutdown
  process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  // ── Crash handler ────────────────────────────────────────
  // Catch unhandled promise rejections (async errors not caught anywhere)
  process.on("unhandledRejection", (err) => {
    console.error("\n❌  UNHANDLED REJECTION:", err?.message || err);
    console.error(err?.stack || "");
    gracefulShutdown("unhandledRejection");
  });

  process.on("uncaughtException", (err) => {
    console.error("\n❌  UNCAUGHT EXCEPTION:", err?.message || err);
    console.error(err?.stack || "");
    gracefulShutdown("uncaughtException");
  });
};

startServer();