const express = require("express");
const { applyCoupon } = require("../controllers/coupon.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/apply", verifyToken, applyCoupon);

module.exports = router;
