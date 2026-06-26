const jwt               = require("jsonwebtoken");
const User              = require("../models/User.model");
const Provider          = require("../models/Provider.model");
const ApiError          = require("../utils/ApiError");
const { generateTokenPair } = require("../utils/generateToken");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// ── Register ──────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, phone, password, role }) => {
  // Check duplicate email or phone
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    const field = existing.email === email ? "Email" : "Phone number";
    throw new ApiError(409, `${field} already registered.`);
  }

  // Create user — password is hashed by User model pre-save hook
  const user = await User.create({ name, email, phone, password, role });

  // If registering as provider → create their Provider profile automatically
  if (role === "provider") {
    await Provider.create({ userId: user._id });
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
};

// ── Validate Credentials (for Login) ───────────────────────────────────────
const validateCredentials = async ({ email, phone, password }) => {
  const query = email ? { email } : { phone };
  const user  = await User.findOne(query).select("+password +failedLoginAttempts +lockUntil");

  if (!user) throw new ApiError(404, "No account found with these credentials.");
  if (!user.isActive) throw new ApiError(403, "Account has been deactivated.");

  // Check lockout
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(403, `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`);
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME_MS;
    }
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, "Incorrect password.");
  }

  // Reset failed attempts on success
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return { phone: user.phone, email: user.email };
};

// ── Generate Auth Tokens (After OTP) ───────────────────────────────────────
const generateAuthTokens = async (phone) => {
  const user = await User.findOne({ phone });
  if (!user) throw new ApiError(404, "User not found.");

  const tokens = generateTokenPair(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    user: {
      _id:          user._id,
      name:         user.name,
      email:        user.email,
      phone:        user.phone,
      role:         user.role,
      profilePhoto: user.profilePhoto,
    },
    accessToken:  tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

// ── Change Password ────────────────────────────────────────────────────────
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found.");

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw new ApiError(401, "Incorrect current password.");

  user.password = newPassword;
  await user.save(); // Password hashed in pre-save hook
};

// ── Forgot Password Reset ──────────────────────────────────────────────────
const resetPassword = async (phone, newPassword) => {
  const user = await User.findOne({ phone }).select("+password");
  if (!user) throw new ApiError(404, "User not found.");

  user.password = newPassword;
  await user.save();
};

// ── Logout ────────────────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  const user = await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: "", fcmTokens: "" }, // Unset fcmTokens not fcmToken
  });

  if (user && user.role === 'provider') {
    await Provider.findOneAndUpdate(
      { userId: userId },
      { status: "offline" }
    );
  }
};

// ── Refresh access token ──────────────────────────────────────────────────
const refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token required.");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch. Please login again.");
  }

  const tokens = generateTokenPair(user._id, user.role);
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  return tokens;
};

// ── Update FCM token ──────────────────────────────────────────────────────
const updateFcmToken = async (userId, fcmToken) => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { fcmTokens: fcmToken } // Add token to array
  });
};

module.exports = { 
  registerUser, 
  validateCredentials, 
  generateAuthTokens, 
  changePassword,
  resetPassword,
  logoutUser, 
  refreshAccessToken, 
  updateFcmToken 
};
