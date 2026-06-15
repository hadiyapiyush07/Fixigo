const asyncHandler  = require("../utils/asyncHandler");
const ApiResponse   = require("../utils/ApiResponse");
const ApiError      = require("../utils/ApiError");
const authService   = require("../services/auth.service");
const { sendOTP, verifyOTP } = require("../utils/sendOTP");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !phone || !password) {
    throw new ApiError(400, "name, email, phone and password are all required.");
  }
  if (role && !["customer", "provider"].includes(role)) {
    throw new ApiError(400, "role must be customer or provider.");
  }

  const result = await authService.registerUser({
    name, email, phone, password,
    role: role || "customer",
  });

  res.status(201).json(new ApiResponse(201, result, "Registration successful."));
});

// POST /api/auth/login
// const login = asyncHandler(async (req, res) => {
//   const { email, phone, password } = req.body;

//   if ((!email && !phone) || !password) {
//     throw new ApiError(400, "Email or phone, and password are required.");
//   }

//   const result = await authService.loginUser({ email, phone, password });
//   res.status(200).json(new ApiResponse(200, result, "Login successful."));
// });

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  if ((!email && !phone) || !password) {
    throw new ApiError(400, "Email or phone, and password are required.");
  }

  const result = await authService.loginUser({ email, phone, password });

  // For admin web panel — set cookie (browser only)
  // React Native app ignores this and uses the token from response body
  if (result.user.role === "admin") {
    res.cookie("adminToken", result.accessToken, {
      httpOnly: true,     // cannot be accessed by JavaScript
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  res.status(200).json(new ApiResponse(200, result, "Login successful."));
});

// POST /api/auth/logout  (protected)
const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully."));
});

// POST /api/auth/refresh-token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.status(200).json(new ApiResponse(200, tokens, "Token refreshed."));
});

// POST /api/auth/send-otp  (protected)
const sendOTPController = asyncHandler(async (req, res) => {
  const phone = req.body.phone || req.user.phone;
  if (!phone) throw new ApiError(400, "phone is required.");

  const result = await sendOTP(phone);
  res.status(200).json(new ApiResponse(200, null, result.message));
});

// POST /api/auth/verify-otp  (protected)
const verifyOTPController = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new ApiError(400, "phone and otp are required.");

  const result = await verifyOTP(phone, otp);
  if (!result.success) throw new ApiError(400, result.message);

  // Mark phone as verified in DB
  const User = require("../models/User.model");
  await User.findByIdAndUpdate(req.user._id, { isPhoneVerified: true });

  res.status(200).json(new ApiResponse(200, null, "Phone verified successfully."));
});

// PUT /api/auth/fcm-token  (protected)
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw new ApiError(400, "fcmToken is required.");
  await authService.updateFcmToken(req.user._id, fcmToken);
  res.status(200).json(new ApiResponse(200, null, "FCM token updated."));
});

module.exports = { register, login, logout, refreshToken, sendOTPController, verifyOTPController, updateFcmToken };
