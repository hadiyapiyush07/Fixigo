const express    = require("express");
const router     = express.Router();
const {
  register, 
  login, 
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  logout, 
  refreshToken, 
  updateFcmToken 
} = require("../controllers/auth.controller");
const { verifyToken }  = require("../middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter.middleware");
const { validateRegister, validateLogin, validateChangePassword } = require("../middleware/validate.middleware");

// ── Public routes (no token needed) ──────────────────────────────────────
router.post("/register",         authLimiter, validateRegister, register);
router.post("/login",            authLimiter, validateLogin, login);
router.post("/verify-login-otp", otpLimiter, verifyLoginOtp);
router.post("/forgot-password",  otpLimiter, forgotPassword);
router.post("/reset-password",   otpLimiter, resetPassword);
router.post("/refresh-token",    refreshToken);

// ── Protected routes (token required) ────────────────────────────────────
router.post("/change-password",  verifyToken, validateChangePassword, changePassword);
router.post("/logout",           verifyToken, logout);
router.put("/fcm-token",         verifyToken, updateFcmToken);

module.exports = router;
