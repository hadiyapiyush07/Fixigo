const jwt               = require("jsonwebtoken");
const User              = require("../models/User.model");
const Provider          = require("../models/Provider.model");
const ApiError          = require("../utils/ApiError");
const { generateTokenPair } = require("../utils/generateToken");

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

  const tokens = generateTokenPair(user._id, user.role);

  // Save refresh token to DB so we can invalidate it on logout
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

// ── Login ─────────────────────────────────────────────────────────────────
const loginUser = async ({ email, phone, password }) => {
  const query = email ? { email } : { phone };
  const user  = await User.findOne(query).select("+password +refreshToken");

  if (!user)          throw new ApiError(404, "No account found with these credentials.");
  if (!user.isActive) throw new ApiError(403, "Account has been deactivated.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, "Incorrect password.");

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

// ── Logout ────────────────────────────────────────────────────────────────
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $unset: { refreshToken: "", fcmToken: "" },
  });
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
// Called from mobile app every time app opens — FCM token can change
const updateFcmToken = async (userId, fcmToken) => {
  await User.findByIdAndUpdate(userId, { fcmToken });
};

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, updateFcmToken };
