const express    = require("express");
const router     = express.Router();
const {
  register, login, logout,
  refreshToken, sendOTPController,
  verifyOTPController, updateFcmToken,
} = require("../controllers/auth.controller");
const { verifyToken }  = require("../middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter.middleware");

// ── Public routes (no token needed) ──────────────────────────────────────
router.post("/register",      authLimiter, register);
router.post("/login",         authLimiter, login);
router.post("/refresh-token", refreshToken);

// ── Protected routes (token required) ────────────────────────────────────
router.post("/logout",       verifyToken, logout);
router.post("/send-otp",     verifyToken, otpLimiter, sendOTPController);
router.post("/verify-otp",   verifyToken, verifyOTPController);
router.put("/fcm-token",     verifyToken, updateFcmToken);

module.exports = router;

// ═══════════════════════════════════════════════════════════════════════════
// POSTMAN TESTING GUIDE FOR AUTH API
// ═══════════════════════════════════════════════════════════════════════════
//
// BASE URL: http://localhost:5000/api/auth
//
// ── 1. REGISTER CUSTOMER ──────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/register
// Headers: Content-Type: application/json
// Body (raw JSON):
// {
//   "name": "Ravi Kumar",
//   "email": "ravi@test.com",
//   "phone": "9876543210",
//   "password": "Test@1234",
//   "role": "customer"
// }
// Expected: 201 { success: true, data: { user, accessToken, refreshToken } }
//
// ── 2. REGISTER PROVIDER ──────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/register
// Body: same as above but "role": "provider"
// Expected: 201 — also creates Provider document automatically
//
// ── 3. LOGIN ──────────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/login
// Body:
// { "email": "ravi@test.com", "password": "Test@1234" }
// OR with phone:
// { "phone": "9876543210", "password": "Test@1234" }
// Expected: 200 — copy the accessToken for all protected requests
//
// ── 4. LOGOUT ─────────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/logout
// Headers: Authorization: Bearer <accessToken>
// Expected: 200 { message: "Logged out successfully." }
//
// ── 5. REFRESH TOKEN ──────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/refresh-token
// Body: { "refreshToken": "<your_refresh_token>" }
// Expected: 200 { data: { accessToken, refreshToken } }
//
// ── 6. SEND OTP ───────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/send-otp
// Headers: Authorization: Bearer <accessToken>
// Body: { "phone": "9876543210" }
// In DEV mode: OTP prints in your terminal console
//
// ── 7. VERIFY OTP ─────────────────────────────────────────────────────────
// POST http://localhost:5000/api/auth/verify-otp
// Headers: Authorization: Bearer <accessToken>
// Body: { "phone": "9876543210", "otp": "482910" }
// Expected: 200 — isPhoneVerified set to true in DB
//
// ── 8. UPDATE FCM TOKEN ───────────────────────────────────────────────────
// PUT http://localhost:5000/api/auth/fcm-token
// Headers: Authorization: Bearer <accessToken>
// Body: { "fcmToken": "device_firebase_token_here" }
//
// ── COMMON ERRORS ─────────────────────────────────────────────────────────
// 400 — missing required fields
// 401 — wrong password or expired token
// 403 — account deactivated
// 404 — email/phone not found
// 409 — email or phone already registered
