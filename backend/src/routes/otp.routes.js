// // ════════════════════════════════════════════════════════════
// // OTP Controller + Routes in one file
// // ════════════════════════════════════════════════════════════

// const express       = require("express");
// const router        = express.Router();
// const asyncHandler  = require("../utils/asyncHandler");
// const ApiResponse   = require("../utils/ApiResponse");
// const ApiError      = require("../utils/ApiError");
// const { sendOTP, verifyOTP, resendOTP } = require("../utils/sendOTP");
// const { verifyToken }  = require("../middleware/auth.middleware");
// const { otpLimiter }   = require("../middleware/rateLimiter.middleware");
// const User             = require("../models/User.model");

// // ── POST /api/otp/send ────────────────────────────────────────────────────
// // Send OTP to phone number
// // Can be called before login (for phone verification) or after login
// const sendOTPHandler = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) throw new ApiError(400, "phone is required.");
//   if (!/^[6-9]\d{9}$/.test(phone)) {
//     throw new ApiError(400, "Invalid Indian phone number. Must be 10 digits starting with 6-9.");
//   }

//   const result = await sendOTP(phone);
//   res.status(200).json(new ApiResponse(200, null, result.message));
// });

// // ── POST /api/otp/verify ──────────────────────────────────────────────────
// // Verify OTP — if correct, mark phone as verified
// const verifyOTPHandler = asyncHandler(async (req, res) => {
//   const { phone, otp } = req.body;
//   if (!phone || !otp) throw new ApiError(400, "phone and otp are required.");

//   const result = await verifyOTP(phone, otp);
//   if (!result.success) throw new ApiError(400, result.message);

//   // If user is logged in, mark their phone as verified in DB
//   if (req.user) {
//     await User.findByIdAndUpdate(req.user._id, { isPhoneVerified: true });
//   }

//   res.status(200).json(new ApiResponse(200, { verified: true }, result.message));
// });

// // ── POST /api/otp/resend ──────────────────────────────────────────────────
// const resendOTPHandler = asyncHandler(async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) throw new ApiError(400, "phone is required.");

//   const result = await resendOTP(phone);
//   res.status(200).json(new ApiResponse(200, null, result.message));
// });

// // ── Routes ────────────────────────────────────────────────────────────────
// // otpLimiter = max 5 requests per hour (prevents SMS spam/abuse)
// router.post("/send",   otpLimiter, sendOTPHandler);
// router.post("/verify", verifyOTPHandler);
// router.post("/resend", otpLimiter, resendOTPHandler);

// // Optional: protected verify (when user is logged in)
// router.post("/verify-authenticated", verifyToken, verifyOTPHandler);

// module.exports = router;

// // ══════════════════════════════════════════════════════════════
// // POSTMAN TESTING GUIDE — OTP API
// // ══════════════════════════════════════════════════════════════
// //
// // ── STEP 1: SEND OTP ─────────────────────────────────────────
// // POST http://localhost:5000/api/otp/send
// // Body: { "phone": "9876543210" }
// //
// // In DEV mode:
// //   Expected Response: { "message": "OTP sent (check server console in dev mode)" }
// //   Check your terminal/console — OTP prints there like:
// //   ━━━━━━━━━━━━━━━━━━━━━━━━
// //   📱 OTP for 9876543210: 482910
// //   ━━━━━━━━━━━━━━━━━━━━━━━━
// //
// // ── STEP 2: VERIFY OTP ───────────────────────────────────────
// // POST http://localhost:5000/api/otp/verify
// // Body: { "phone": "9876543210", "otp": "482910" }
// // Expected: { "data": { "verified": true } }
// //
// // ── STEP 3: RESEND OTP ───────────────────────────────────────
// // POST http://localhost:5000/api/otp/resend
// // Body: { "phone": "9876543210" }
// //
// // ── ERROR CASES TO TEST ──────────────────────────────────────
// // Wrong OTP:   body { "otp": "000000" } → 400 "Incorrect OTP"
// // Expired OTP: wait 10 minutes → 400 "OTP expired"
// // Reuse OTP:   verify same OTP twice → 400 "OTP expired" (deleted after first use)
// // Invalid phone: "12345" → 400 "Invalid Indian phone number"
// // Rate limit:  send 6 times in 1 hour → 429 "Too many OTP requests"

const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendOTP, verifyOTP, resendOTP } = require("../utils/sendOTP");
const { verifyToken } = require("../middleware/auth.middleware");
const { otpLimiter } = require("../middleware/rateLimiter.middleware");
const User = require("../models/User.model");

// ── POST /api/otp/send ────────────────────────────────────
const sendOTPHandler = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, "phone is required.");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw new ApiError(400, "Invalid Indian phone number. Must be 10 digits starting with 6-9.");
  }

  const result = await sendOTP(phone);
  // If mock mode, include the OTP in response for frontend testing
  const responseData = result.mockOtp ? { mockOtp: result.mockOtp } : null;
  res.status(200).json(new ApiResponse(200, responseData, result.message));
});

// ── POST /api/otp/verify ──────────────────────────────────
const verifyOTPHandler = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new ApiError(400, "phone and otp are required.");

  const result = await verifyOTP(phone, otp);
  if (!result.success) throw new ApiError(400, result.message);

  // If user is logged in, mark phone as verified in DB
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { isPhoneVerified: true });
  }

  res.status(200).json(new ApiResponse(200, { verified: true }, result.message));
});

// ── POST /api/otp/resend ──────────────────────────────────
const resendOTPHandler = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, "phone is required.");

  const result = await resendOTP(phone);
  const responseData = result.mockOtp ? { mockOtp: result.mockOtp } : null;
  res.status(200).json(new ApiResponse(200, responseData, result.message));
});

// ── Routes ─────────────────────────────────────────────────
router.post("/send", otpLimiter, sendOTPHandler);
router.post("/verify", verifyOTPHandler);
router.post("/resend", otpLimiter, resendOTPHandler);
router.post("/verify-authenticated", verifyToken, verifyOTPHandler);

module.exports = router;