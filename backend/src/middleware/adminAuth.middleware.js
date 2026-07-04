const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const Admin = require("../models/Admin.model");

const verifyAdminToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.adminAccessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized access");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const admin = await Admin.findById(decodedToken.id);

    if (!admin) {
      throw new ApiError(401, "Invalid access token");
    }

    if (!admin.isActive) {
      throw new ApiError(403, "Admin account deactivated");
    }

    req.admin = admin;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const requireAdminRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      throw new ApiError(401, "Admin not authenticated");
    }

    // Superadmin has all access
    if (req.admin.role === "superadmin") {
      return next();
    }

    if (!allowedRoles.includes(req.admin.role)) {
      throw new ApiError(
        403,
        `Role ${req.admin.role} is not allowed to access this resource`
      );
    }

    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      throw new ApiError(401, "Admin not authenticated");
    }

    if (req.admin.role === "superadmin" || req.admin.permissions.includes("*")) {
      return next();
    }

    if (!req.admin.permissions.includes(permission)) {
      throw new ApiError(
        403,
        `Permission '${permission}' is required to access this resource`
      );
    }

    next();
  };
};

module.exports = {
  verifyAdminToken,
  requireAdminRole,
  requirePermission,
};
