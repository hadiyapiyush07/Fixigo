const ApiError = require("../utils/ApiError");

// Restrict a route to specific roles
// Usage: router.get("/admin/stats", verifyToken, requireRole("admin"), controller)
// Multiple roles: requireRole("admin", "provider")

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated."));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Required: ${roles.join(" or ")}`)
      );
    }
    next();
  };
};

module.exports = { requireRole };
