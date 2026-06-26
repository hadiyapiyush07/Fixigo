/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE: src/app.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURPOSE:
  Configures the Express application.
  This file does NOT start the server — server.js does that.
  This file ONLY:
    1. Creates the Express app
    2. Applies global middleware (cors, json parser, logger)
    3. Connects all route files to their URL paths
    4. Adds the 404 handler
    5. Adds the global error handler (must be LAST)

ANALOGY:
  Think of app.js like the main reception desk of a hotel.
  When a guest (HTTP request) arrives, reception:
    1. Checks if they are allowed in (cors, rate limit)
    2. Reads their request (express.json)
    3. Sends them to the right department (routes)
    4. If department not found → 404
    5. If something went wrong → error handler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

// ── Import all route files ────────────────────────────────────────────────
// Each route file handles one group of related URLs
const authRoutes     = require("./routes/auth.routes");
const providerRoutes = require("./routes/provider.routes");
const bookingRoutes  = require("./routes/booking.routes");
const paymentRoutes  = require("./routes/payment.routes");
const otpRoutes      = require("./routes/otp.routes");
const messageRoutes  = require("./routes/message.routes");
const couponRoutes   = require("./routes/coupon.routes");
const notificationRoutes = require("./routes/notification.routes");
const addressRoutes  = require("./routes/address.routes");
const { categoryRouter, adminRouter } = require("./routes/combined.routes");

// ── Import middleware ─────────────────────────────────────────────────────
const errorHandler   = require("./middleware/errorHandler.middleware");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");

// Create Express application
const app = express();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL MIDDLEWARE
// These run on EVERY request before reaching the route handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// CORS — Cross Origin Resource Sharing
// Allows your React Native app and admin panel to call this API
// Without this, browser/app would block the request
app.use(cors({ origin: "*", credentials: true }));

// JSON Parser — reads request body as JSON
// Without this, req.body would be undefined
// limit: "10mb" allows images to be sent in base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Morgan — HTTP request logger for development
// Prints: POST /api/auth/login 200 334ms in your terminal
// Only enabled in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate Limiter — prevents API abuse and DDoS attacks
// 100 requests per 15 minutes per IP address
// Returns 429 Too Many Requests if exceeded
app.use("/api", apiLimiter);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTES
// Each line connects a URL prefix to a route file
// Example: /api/auth/login → authRoutes handles it
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use("/api/auth",       authRoutes);      // login, register, logout
app.use("/api/providers",  providerRoutes);  // provider profiles, nearby search
app.use("/api/bookings",   bookingRoutes);   // create, accept, track bookings
app.use("/api/payments",   paymentRoutes);   // Razorpay payment flow
app.use("/api/otp",        otpRoutes);       // send and verify OTP
app.use("/api/categories", categoryRouter);  // service categories
app.use("/api/admin",      adminRouter);     // admin
app.use("/api/addresses", addressRoutes);

// Messages
app.use("/api/messages",   messageRoutes);   // chat and messaging
app.use("/api/coupons",    couponRoutes);
app.use("/api/notifications", notificationRoutes);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEALTH CHECK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Deployment platforms (Railway, Render) ping this to check if server is alive
// Also useful to quickly verify your server started correctly
app.get("/health", (req, res) => {
  res.json({
    success:     true,
    message:     "ServiceBook API is running ✅",
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    routes: [
      "POST   /api/auth/register",
      "POST   /api/auth/login",
      "POST   /api/otp/send",
      "POST   /api/otp/verify",
      "POST   /api/bookings",
      "POST   /api/payments/create-order",
      "POST   /api/payments/verify",
      "GET    /api/categories",
      "GET    /api/providers/nearby",
      "GET    /api/admin/stats",
    ],
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 404 HANDLER
// If no route matched the URL, send 404
// The * matches any URL that wasn't handled above
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLOBAL ERROR HANDLER — MUST BE LAST
// Catches every error thrown anywhere in the app
// Has 4 parameters (err, req, res, next) — Express knows it's an error handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.use(errorHandler);

module.exports = app;
