const asyncHandler  = require("../utils/asyncHandler");
const ApiResponse   = require("../utils/ApiResponse");
const ApiError      = require("../utils/ApiError");
const authService   = require("../services/auth.service");
const { sendOTP, verifyOTP } = require("../utils/sendOTP");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const result = await authService.registerUser({
    name, email, phone, password,
    role: role || "customer",
  });

  // NO TOKENS RETURNED. Redirect to login.
  res.status(201).json(new ApiResponse(201, { user: result }, "Account created successfully. Please login to continue."));
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;

  // 1. Validate credentials and check lockout
  const userBasics = await authService.validateCredentials({ email, phone, password });

  // 2. Generate and send OTP
  const smsResponse = await sendOTP(userBasics.phone, 'login');

  // 3. Return success so frontend can redirect to OTP screen
  res.status(200).json(new ApiResponse(200, { phone: userBasics.phone, mockOtp: smsResponse.mockOtp || undefined }, "Credentials verified. OTP sent to your registered mobile number."));
});

// POST /api/auth/verify-login-otp
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new ApiError(400, "phone and otp are required.");

  // 1. Verify OTP
  const result = await verifyOTP(phone, otp, 'login');
  if (!result.success) throw new ApiError(400, result.message);

  // 2. Generate Tokens
  const authData = await authService.generateAuthTokens(phone);

  // Admin authentication is now handled in admin.auth.controller.js

  res.status(200).json(new ApiResponse(200, authData, "Login successful."));
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, "phone is required.");

  // Make sure user exists
  const User = require("../models/User.model");
  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(404, "User not found with this mobile number.");

  const smsResponse = await sendOTP(phone, 'forgot_password');
  res.status(200).json(new ApiResponse(200, { phone, mockOtp: smsResponse.mockOtp || undefined }, "OTP sent to your mobile number."));
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { phone, otp, newPassword } = req.body;
  if (!phone || !otp || !newPassword) throw new ApiError(400, "phone, otp, and new password are required.");

  if (newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
    throw new ApiError(400, "Password must be at least 6 characters and contain uppercase, lowercase, number, and special character.");
  }

  // Verify OTP
  const result = await verifyOTP(phone, otp, 'forgot_password');
  if (!result.success) throw new ApiError(400, result.message);

  // Reset Password
  await authService.resetPassword(phone, newPassword);

  res.status(200).json(new ApiResponse(200, null, "Password reset successfully. Please login with your new password."));
});

// POST /api/auth/change-password (protected)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user._id, currentPassword, newPassword);
  res.status(200).json(new ApiResponse(200, null, "Password changed successfully."));
});

// POST /api/auth/logout (protected)
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

// PUT /api/auth/fcm-token (protected)
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) throw new ApiError(400, "fcmToken is required.");
  await authService.updateFcmToken(req.user._id, fcmToken);
  res.status(200).json(new ApiResponse(200, null, "FCM token updated."));
});

module.exports = { 
  register, 
  login, 
  verifyLoginOtp,
  forgotPassword,
  resetPassword,
  changePassword,
  logout, 
  refreshToken, 
  updateFcmToken 
};
