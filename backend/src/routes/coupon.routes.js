const express = require("express");
const { applyCoupon, getActiveCoupons } = require("../controllers/coupon.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", verifyToken, getActiveCoupons);
router.post("/apply", verifyToken, applyCoupon);

module.exports = router;
