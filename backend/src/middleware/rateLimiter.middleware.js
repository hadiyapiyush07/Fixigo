const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV !== "production";

// ── Helper: routes that should NEVER be rate-limited ─────────────────────
// Booking status polling and dashboard refresh fire every 8-15 seconds.
// Blocking them would break the live-tracking UX.
const skipRateLimit = (req) => {
  const { method, path } = req;
  // Always skip health checks
  if (path === "/health") return true;
  // Skip GET polling: /api/bookings/:id  and  /api/bookings/provider
  if (method === "GET" && /^\/bookings(\/provider|\/my|\/[a-f0-9]{24})/.test(path)) return true;
  // Skip provider dashboard stats
  if (method === "GET" && path.startsWith("/providers/my-stats")) return true;
  return false;
};

// ── General API Limiter ───────────────────────────────────────────────────
// Dev  : 10 000 req / 15 min  (effectively unlimited for testing)
// Prod :    500 req / 15 min  (generous but protects against abuse)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimit,
  message: {
    success: false,
    message: isDev
      ? "Rate limit hit even in dev mode — check skipRateLimit() config."
      : "Too many requests. Please slow down and try again.",
  },
});

// ── Auth Limiter — brute-force protection ─────────────────────────────────
// Dev  : 1 000 attempts / 15 min  (no friction during development)
// Prod :    20 attempts / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// ── OTP Limiter — SMS-cost protection ────────────────────────────────────
// Dev  : 100 req / hr
// Prod :   5 req / hr
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 1 hour.",
  },
});

module.exports = { apiLimiter, authLimiter, otpLimiter };
