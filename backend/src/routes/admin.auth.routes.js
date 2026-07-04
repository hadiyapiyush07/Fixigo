const express = require("express");
const {
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  createFirstSuperAdmin,
} = require("../controllers/admin.auth.controller");
const { verifyAdminToken } = require("../middleware/adminAuth.middleware");

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/setup-superadmin", createFirstSuperAdmin);

// Secured routes
router.post("/logout", verifyAdminToken, logoutAdmin);
router.get("/me", verifyAdminToken, getAdminProfile);

module.exports = router;
