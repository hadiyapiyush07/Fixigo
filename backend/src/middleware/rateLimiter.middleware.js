const rateLimit = require("express-rate-limit");

// General — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Try again after 15 minutes." },
});

// Auth — 10 attempts per 15 minutes (prevents brute force on login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Try again after 15 minutes." },
});

// OTP — 5 requests per hour (prevents OTP spam)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests. Try again after 1 hour." },
});

module.exports = { apiLimiter, authLimiter, otpLimiter };
