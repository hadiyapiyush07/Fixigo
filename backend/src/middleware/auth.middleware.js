const jwt          = require("jsonwebtoken");
const User         = require("../models/User.model");
const ApiError     = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Attach req.user to every protected request
// Usage in routes: router.get("/profile", verifyToken, controller)
const verifyToken = asyncHandler(async (req, res, next) => {
  // Token format: "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired. Please login again.");
    }
    throw new ApiError(401, "Invalid token.");
  }

  // Confirm user still exists and is active
  const user = await User.findById(decoded.id).select("-password -refreshToken");

  if (!user)          throw new ApiError(401, "User no longer exists.");
  if (!user.isActive) throw new ApiError(403, "Account has been deactivated.");

  req.user = user;
  next();
});

module.exports = { verifyToken };
